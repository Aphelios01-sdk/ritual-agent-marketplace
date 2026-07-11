// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title JobMarketV2 — Bidding + escrow + timeout + rate-limiting + heartbeat gate
/// @notice Multiple agents bid on 1 job; the requester chooses based on price/reputation/estimate.
///         Providers must be staked & alive. Timeout auto-refund. Rate-limit per provider.
contract JobMarketV2 {
    enum JobStatus { OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, DISPUTED, REFUNDED, CANCELLED }

    struct Bid {
        address provider;
        uint256 price;          // offered price (<= reward = discount, > reward = premium)
        uint256 estBlocks;      // estimated duration (blocks)
        uint256 submittedAt;
    }

    struct JobRequest {
        uint256 id;
        address requester;
        bytes32[] requiredSkillIds;
        bytes taskData;
        uint256 reward;         // max the requester is willing to pay (escrowed)
        uint256 bondRequired;
        JobStatus status;
        address provider;       // bid winner
        bytes resultData;
        uint256 deadline;       // block timeout for submitting result
        uint256 rating;
        uint256 acceptedAt;     // block when assigned (for timeout)
    }

    // Config
    IAgentRegistry public immutable registry;
    IAgentStaking public immutable staking;
    IAgentHeartbeat public heartbeat;        // optional, address(0) = skip
    address public owner;
    address payable public treasury;
    uint256 public treasuryFeeBps = 250;
    uint256 public constant MAX_CONCURRENT = 3;     // rate limit per provider
    /// @dev Defaults sized for real multi-bidder flow on Ritual (~block/2s):
    ///      bidWindow 5000 ≈ 2.5–3h, resultTimeout 15000 ≈ 8h+. Owner can tune.
    uint256 public bidWindow = 5000;
    uint256 public resultTimeout = 15000;
    // Back-compat aliases for tests / external readers
    uint256 public constant BID_WINDOW = 5000;
    uint256 public constant RESULT_TIMEOUT = 15000;

    uint256 public nextJobId;
    mapping(uint256 => JobRequest) public jobs;
    mapping(uint256 => Bid[]) public bids;           // jobId -> bids
    mapping(uint256 => mapping(address => bool)) private _hasBid; // dedup: one bid per provider per job
    mapping(address => uint256[]) private _providerJobs;
    mapping(address => uint256) private _activeCount; // provider -> number of IN_PROGRESS/ASSIGNED jobs

    event JobRequested(uint256 indexed id, address indexed requester, uint256 reward, bytes32[] skills);
    event BidSubmitted(uint256 indexed jobId, address indexed provider, uint256 price, uint256 estBlocks);
    event JobAssigned(uint256 indexed jobId, address indexed provider, uint256 price);
    event JobStarted(uint256 indexed jobId);
    event JobCompleted(uint256 indexed jobId, bytes resultData);
    event JobDisputed(uint256 indexed jobId);
    event JobRefunded(uint256 indexed jobId, address indexed to);
    event JobCancelled(uint256 indexed jobId);
    event ProviderRated(uint256 indexed jobId, uint256 rating);

    constructor(address _registry, address _staking, address _heartbeat) {
        registry = IAgentRegistry(_registry);
        staking = IAgentStaking(_staking);
        heartbeat = IAgentHeartbeat(_heartbeat);
        owner = msg.sender;
        treasury = payable(msg.sender);
    }

    function setTreasury(address payable t) external {
        require(msg.sender == owner, "only owner");
        treasury = t;
    }

    /// @notice Owner tunes bid open window and result submission timeout (in blocks).
    function setWindows(uint256 _bidWindow, uint256 _resultTimeout) external {
        require(msg.sender == owner, "only owner");
        require(_bidWindow >= 50 && _bidWindow <= 1_000_000, "bid window");
        require(_resultTimeout >= 100 && _resultTimeout <= 2_000_000, "result timeout");
        bidWindow = _bidWindow;
        resultTimeout = _resultTimeout;
    }

    // ── Requester flow ──

    /// @notice Agent A requests service. reward = max budget, escrowed. Bid window open for bidWindow blocks.
    function requestService(bytes32[] calldata requiredSkillIds, bytes calldata taskData) external payable returns (uint256) {
        require(msg.value > 0, "reward required");
        require(requiredSkillIds.length > 0, "skills required");

        uint256 jobId = ++nextJobId;
        jobs[jobId] = JobRequest({
            id: jobId,
            requester: msg.sender,
            requiredSkillIds: requiredSkillIds,
            taskData: taskData,
            reward: msg.value,
            bondRequired: msg.value / 10,
            status: JobStatus.OPEN,
            provider: address(0),
            resultData: "",
            deadline: block.number + bidWindow,
            rating: 0,
            acceptedAt: 0
        });
        emit JobRequested(jobId, msg.sender, msg.value, requiredSkillIds);
        return jobId;
    }

    /// @notice Requester cancels an OPEN job (before assignment). Funds are returned.
    function cancelJob(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.OPEN, "not open");
        j.status = JobStatus.CANCELLED;
        _send(msg.sender, j.reward);
        emit JobCancelled(jobId);
    }

    // ── Provider bidding flow ──

    /// @notice Agent B submits a bid. Price can be <= reward (discount) or > (premium, requester tops up at assign).
    function submitBid(uint256 jobId, uint256 price, uint256 estBlocks) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.OPEN, "not open for bids");
        require(block.number <= j.deadline, "bid window closed");
        require(msg.sender != j.requester, "cannot self-bid");
        require(staking.isAgentActive(msg.sender), "agent not staked/active");
        require(address(heartbeat) == address(0) || heartbeat.isAlive(msg.sender), "agent not alive");
        require(_activeCount[msg.sender] < MAX_CONCURRENT, "rate limit: too many active jobs");
        require(_hasMatchingSkill(j.requiredSkillIds, msg.sender), "no matching skill");
        // One bid per provider per job — prevents gas-griefing & bid-index manipulation (audit M3).
        require(!_hasBid[jobId][msg.sender], "already bid");

        bids[jobId].push(Bid({
            provider: msg.sender,
            price: price,
            estBlocks: estBlocks,
            submittedAt: block.number
        }));
        _hasBid[jobId][msg.sender] = true;
        emit BidSubmitted(jobId, msg.sender, price, estBlocks);
    }

    /// @notice Requester picks a bid. If price > reward, the requester tops up via msg.value.
    function assignJob(uint256 jobId, uint256 bidIndex) external payable {
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.OPEN, "not open");
        Bid[] storage jobBids = bids[jobId];
        require(bidIndex < jobBids.length, "invalid bid");
        Bid storage b = jobBids[bidIndex];

        uint256 finalPrice = b.price;
        if (finalPrice > j.reward) {
            uint256 topUp = finalPrice - j.reward;
            require(msg.value >= topUp, "top-up required for premium bid");
        }
        // Refund any excess msg.value above the top-up so it is not stranded (audit M1).
        if (msg.value > 0 && finalPrice <= j.reward) {
            _send(j.requester, msg.value);
        } else if (finalPrice > j.reward && msg.value > (finalPrice - j.reward)) {
            _send(j.requester, msg.value - (finalPrice - j.reward));
        }

        j.provider = b.provider;
        j.status = JobStatus.ASSIGNED;
        j.acceptedAt = block.number;
        j.deadline = block.number + resultTimeout;  // reset deadline to result timeout

        // Refund the escrow difference on a discount bid (finalPrice < initial reward) — previously locked.
        if (finalPrice < j.reward) {
            uint256 refund = j.reward - finalPrice;
            j.reward = finalPrice;  // update reward to the final price
            _send(j.requester, refund);
        } else {
            j.reward = finalPrice;
        }
        _providerJobs[b.provider].push(jobId);
        _activeCount[b.provider]++;

        emit JobAssigned(jobId, b.provider, finalPrice);
    }

    /// @notice Provider starts processing — bond is posted here (called by provider, not requester).
    function startProcessing(uint256 jobId) external payable {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.ASSIGNED, "not assigned");
        require(msg.sender == j.provider, "only provider");
        require(msg.value >= j.bondRequired, "bond required");
        j.status = JobStatus.IN_PROGRESS;
        emit JobStarted(jobId);
    }

    /// @notice Provider submits the result. Escrow release + bond returned + rating hook.
    /// @dev Bond must already be posted via startProcessing (IN_PROGRESS). Allowing ASSIGNED
    ///      here would let a provider skip the bond and still receive `j.bondRequired` it never
    ///      deposited — draining other escrows. See audit C1.
    function submitResult(uint256 jobId, bytes calldata resultData) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.IN_PROGRESS, "must start processing first");
        require(msg.sender == j.provider, "only provider");
        require(block.number <= j.deadline, "result timeout");

        j.status = JobStatus.COMPLETED;
        j.resultData = resultData;
        _activeCount[msg.sender]--;

        uint256 fee = (j.reward * treasuryFeeBps) / 10000;
        uint256 providerShare = j.reward - fee;
        _send(j.provider, providerShare + j.bondRequired);
        if (fee > 0) _send(treasury, fee);

        uint256 agentId = registry.agentByContract(j.provider);
        if (agentId != 0) {
            try registry.addEarnings(agentId, providerShare, 0) {} catch {}
        }
        emit JobCompleted(jobId, resultData);
    }

    /// @notice Requester rates provider (1-5). Triggers recordRating on staking (slash on repeated low ratings).
    function rateProvider(uint256 jobId, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "rating 1-5");
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.COMPLETED, "not completed");
        j.rating = rating;
        try staking.recordRating(j.provider, rating) {} catch {}
        emit ProviderRated(jobId, rating);
    }

    // ── Timeout & dispute ──

    /// @notice Timeout auto-refund: requester claims back funds if the provider doesn't submit before the deadline.
    function claimTimeout(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(
            (j.status == JobStatus.OPEN && block.number > j.deadline) ||
            (j.status == JobStatus.ASSIGNED && block.number > j.deadline) ||
            (j.status == JobStatus.IN_PROGRESS && block.number > j.deadline),
            "not timed out"
        );

        if (j.status != JobStatus.OPEN) {
            _activeCount[j.provider]--;
            // bond stays in the contract — slash the provider (no submission)
            try staking.slash(j.provider, 2500, "timeout no result") {} catch {}
            // The bond posted at startProcessing is slashed to treasury (was previously stuck).
            if (j.status == JobStatus.IN_PROGRESS) {
                _send(treasury, j.bondRequired);
            }
        }
        j.status = JobStatus.REFUNDED;
        _send(j.requester, j.reward);
        emit JobRefunded(jobId, j.requester);
    }

    function dispute(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(msg.sender == j.requester || msg.sender == j.provider, "unauthorized");
        require(j.status == JobStatus.IN_PROGRESS || j.status == JobStatus.ASSIGNED, "cannot dispute");
        j.status = JobStatus.DISPUTED;
        emit JobDisputed(jobId);
    }

    // ── Views ──

    function getBids(uint256 jobId) external view returns (Bid[] memory) {
        return bids[jobId];
    }

    function getProviderJobs(address provider) external view returns (uint256[] memory) {
        return _providerJobs[provider];
    }

    function getActiveCount(address provider) external view returns (uint256) {
        return _activeCount[provider];
    }

    /// @notice OPEN jobs whose skills match a given agent.
    function getOpenJobsForAgent(address provider) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= nextJobId; i++) {
            if (jobs[i].status == JobStatus.OPEN && _hasMatchingSkill(jobs[i].requiredSkillIds, provider)) {
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= nextJobId; i++) {
            if (jobs[i].status == JobStatus.OPEN && _hasMatchingSkill(jobs[i].requiredSkillIds, provider)) {
                result[idx++] = i;
            }
        }
        return result;
    }

    function _hasMatchingSkill(bytes32[] storage required, address provider) internal view returns (bool) {
        uint256 agentId = registry.agentByContract(provider);
        if (agentId == 0) return false;
        IAgentRegistry.Skill[] memory skills = registry.getAgentSkills(agentId);
        for (uint256 i = 0; i < required.length; i++) {
            for (uint256 j = 0; j < skills.length; j++) {
                if (skills[j].active && required[i] == skills[j].skillId) return true;
            }
        }
        return false;
    }

    /// @dev Send ether via call (not transfer) — supports contract recipients, reverts on failure.
    function _send(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = payable(to).call{value: amount}("");
        require(ok, "transfer failed");
    }
}
