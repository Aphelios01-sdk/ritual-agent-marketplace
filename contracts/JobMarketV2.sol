// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title JobMarketV2 — Bidding + escrow + timeout + rate-limiting + heartbeat gate
/// @notice Multiple agent bid untuk 1 job; requester pilih berdasarkan harga/reputasi/estimasi.
///         Provider wajib staked & alive. Timeout auto-refund. Rate-limit per provider.
contract JobMarketV2 {
    enum JobStatus { OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, DISPUTED, REFUNDED, CANCELLED }

    struct Bid {
        address provider;
        uint256 price;          // harga yg ditawarkan (<= reward = diskon, > reward = premium)
        uint256 estBlocks;      // estimasi durasi (block)
        uint256 submittedAt;
    }

    struct JobRequest {
        uint256 id;
        address requester;
        bytes32[] requiredSkillIds;
        bytes taskData;
        uint256 reward;         // max yang requester siap bayar (escrowed)
        uint256 bondRequired;
        JobStatus status;
        address provider;       // pemenang bid
        bytes resultData;
        uint256 deadline;       // block timeout untuk submit result
        uint256 rating;
        uint256 acceptedAt;     // block saat assigned (untuk timeout)
    }

    // Config
    IAgentRegistry public immutable registry;
    IAgentStaking public immutable staking;
    IAgentHeartbeat public heartbeat;        // opsional, address(0) = skip
    address public owner;
    address payable public treasury;
    uint256 public treasuryFeeBps = 250;
    uint256 public constant MAX_CONCURRENT = 3;     // rate limit per provider
    uint256 public constant BID_WINDOW = 50;        // window buka bid (blocks)
    uint256 public constant RESULT_TIMEOUT = 150;   // block untuk submit result

    uint256 public nextJobId;
    mapping(uint256 => JobRequest) public jobs;
    mapping(uint256 => Bid[]) public bids;           // jobId -> bids
    mapping(address => uint256[]) private _providerJobs;
    mapping(address => uint256) private _activeCount; // provider -> jumlah job IN_PROGRESS/ASSIGNED

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

    // ── Requester flow ──

    /// @notice Agent A request service. reward = max budget, escrowed. Bid window terbuka BID_WINDOW blocks.
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
            deadline: block.number + BID_WINDOW,
            rating: 0,
            acceptedAt: 0
        });
        emit JobRequested(jobId, msg.sender, msg.value, requiredSkillIds);
        return jobId;
    }

    /// @notice Requester batalkan job OPEN (sebelum assign). Dana kembali.
    function cancelJob(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.OPEN, "not open");
        j.status = JobStatus.CANCELLED;
        _send(msg.sender, j.reward);
        emit JobCancelled(jobId);
    }

    // ── Provider bidding flow ──

    /// @notice Agent B submit bid. Harga bisa <= reward (diskon) atau > (premium, requester top-up saat assign).
    function submitBid(uint256 jobId, uint256 price, uint256 estBlocks) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.OPEN, "not open for bids");
        require(block.number <= j.deadline, "bid window closed");
        require(msg.sender != j.requester, "cannot self-bid");
        require(staking.isAgentActive(msg.sender), "agent not staked/active");
        require(address(heartbeat) == address(0) || heartbeat.isAlive(msg.sender), "agent not alive");
        require(_activeCount[msg.sender] < MAX_CONCURRENT, "rate limit: too many active jobs");
        require(_hasMatchingSkill(j.requiredSkillIds, msg.sender), "no matching skill");

        bids[jobId].push(Bid({
            provider: msg.sender,
            price: price,
            estBlocks: estBlocks,
            submittedAt: block.number
        }));
        emit BidSubmitted(jobId, msg.sender, price, estBlocks);
    }

    /// @notice Requester pilih bid. Jika price > reward, requester top-up msg.value.
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

        j.provider = b.provider;
        j.status = JobStatus.ASSIGNED;
        j.acceptedAt = block.number;
        j.deadline = block.number + RESULT_TIMEOUT;  // reset deadline jadi timeout result

        // Refund selisih escrow saat bid diskon (finalPrice < reward awal) — dulu terkunci.
        if (finalPrice < j.reward) {
            uint256 refund = j.reward - finalPrice;
            j.reward = finalPrice;  // update reward jadi harga final
            _send(j.requester, refund);
        } else {
            j.reward = finalPrice;
        }
        _providerJobs[b.provider].push(jobId);
        _activeCount[b.provider]++;

        emit JobAssigned(jobId, b.provider, finalPrice);
    }

    /// @notice Provider start processing — post bond di sini (dipanggil provider, bukan requester).
    function startProcessing(uint256 jobId) external payable {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.ASSIGNED, "not assigned");
        require(msg.sender == j.provider, "only provider");
        require(msg.value >= j.bondRequired, "bond required");
        j.status = JobStatus.IN_PROGRESS;
        emit JobStarted(jobId);
    }

    /// @notice Provider submit hasil. Escrow release + bond balik + rating hook.
    function submitResult(uint256 jobId, bytes calldata resultData) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.IN_PROGRESS || j.status == JobStatus.ASSIGNED, "not in progress");
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

    /// @notice Requester rate provider (1-5). Trigger recordRating ke staking (slash kalau jelek berulang).
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

    /// @notice Timeout auto-refund: requester klaim balik dana kalo provider gak submit sebelum deadline.
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
            // bond tetap di kontrak — slash ke provider (gak submit)
            try staking.slash(j.provider, 2500, "timeout no result") {} catch {}
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

    /// @notice Job OPEN dengan skill cocok untuk agent tertentu.
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
        bytes32[] memory owned = registry.getAgentSkills(agentId);
        for (uint256 i = 0; i < required.length; i++) {
            for (uint256 j = 0; j < owned.length; j++) {
                if (required[i] == owned[j]) return true;
            }
        }
        return false;
    }

    /// @dev Kirim ether via call (bukan transfer) — dukung penerima contract, revert kalau gagal.
    function _send(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = payable(to).call{value: amount}("");
        require(ok, "transfer failed");
    }
}
