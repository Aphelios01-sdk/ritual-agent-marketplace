// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title JobMarket — Request queue & escrow for the agent-to-agent marketplace
/// @notice Agent A request service → Agent B accept → process → submit → escrow release
contract JobMarket {
    enum JobStatus { REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, DISPUTED, REFUNDED }

    struct JobRequest {
        uint256 id;
        address requester;              // Agent A contract
        bytes32[] requiredSkillIds;     // required skills
        bytes taskData;                 // {query, params}
        uint256 reward;                 // RITUAL
        uint256 bondRequired;
        JobStatus status;
        address provider;               // Agent B contract (set on accept)
        bytes resultData;
        uint256 deadline;               // block number
        uint256 rating;
    }

    address public agentRegistry;
    uint256 public nextJobId;
    uint256 public treasuryFeeBps = 250; // 2.5%

    // jobId → JobRequest
    mapping(uint256 => JobRequest) public jobs;
    // agent contract → [jobId] — jobs whose skills match
    mapping(address => uint256[]) private _agentJobQueue;
    // provider → [jobId]
    mapping(address => uint256[]) private _providerJobs;

    event JobRequested(uint256 indexed id, address indexed requester, uint256 reward);
    event JobAccepted(uint256 indexed id, address indexed provider);
    event JobCompleted(uint256 indexed id, bytes resultData);
    event JobDisputed(uint256 indexed id);
    event JobRefunded(uint256 indexed id);
    event ProviderRated(uint256 indexed id, uint256 rating);

    constructor(address _agentRegistry) {
        agentRegistry = _agentRegistry;
    }

    /// @notice Agent A request service
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
            bondRequired: msg.value / 10, // 10% bond
            status: JobStatus.REQUESTED,
            provider: address(0),
            resultData: "",
            deadline: block.number + 200, // ~1 min
            rating: 0
        });

        emit JobRequested(jobId, msg.sender, msg.value);
        return jobId;
    }

    /// @notice Agent B accept job — post bond
    function acceptJob(uint256 jobId) external payable {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.REQUESTED, "not requested");
        require(msg.value >= j.bondRequired, "bond too low");
        require(msg.sender != j.requester, "cannot self-accept");

        j.provider = msg.sender;
        j.status = JobStatus.ACCEPTED;
        _providerJobs[msg.sender].push(jobId);

        emit JobAccepted(jobId, msg.sender);
    }

    /// @notice Agent B start processing
    function startProcessing(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.ACCEPTED, "not accepted");
        require(msg.sender == j.provider, "only provider");
        j.status = JobStatus.IN_PROGRESS;
    }

    /// @notice Agent B submits the result
    function submitResult(uint256 jobId, bytes calldata resultData) external {
        JobRequest storage j = jobs[jobId];
        require(j.status == JobStatus.IN_PROGRESS, "not in progress");
        require(msg.sender == j.provider, "only provider");

        j.status = JobStatus.COMPLETED;
        j.resultData = resultData;

        // release escrow
        uint256 fee = (j.reward * treasuryFeeBps) / 10000;
        uint256 providerShare = j.reward - fee;

        // return bond
        payable(j.provider).transfer(providerShare + j.bondRequired);
        // treasury fee stays in contract

        // get agentId from registry
        // ponytail: use registry.agentByContract() to get agentId, call addEarnings
        (bool ok,) = agentRegistry.call(abi.encodeWithSignature("addEarnings(uint256,uint256,uint256)", 0, providerShare, 0));
        ok;

        emit JobCompleted(jobId, resultData);
    }

    /// @notice Agent A rate provider (1-5)
    function rateProvider(uint256 jobId, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "rating 1-5");
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.COMPLETED, "not completed");
        j.rating = rating;

        (bool ok,) = agentRegistry.call(abi.encodeWithSignature("addEarnings(uint256,uint256,uint256)", 0, 0, rating));
        ok;
        emit ProviderRated(jobId, rating);
    }

    /// @notice Get available jobs for agent with given skill IDs
    function getAvailableJobs(bytes32[] calldata agentSkillIds) external view returns (JobRequest[] memory) {
        // count matching
        uint256 count = 0;
        for (uint256 i = 1; i <= nextJobId; i++) {
            if (jobs[i].status != JobStatus.REQUESTED) continue;
            if (_hasMatchingSkill(jobs[i].requiredSkillIds, agentSkillIds)) {
                count++;
            }
        }
        JobRequest[] memory result = new JobRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= nextJobId; i++) {
            if (jobs[i].status != JobStatus.REQUESTED) continue;
            if (_hasMatchingSkill(jobs[i].requiredSkillIds, agentSkillIds)) {
                result[idx++] = jobs[i];
            }
        }
        return result;
    }

    /// @notice Get jobs for a provider
    function getProviderJobs(address provider) external view returns (JobRequest[] memory) {
        uint256[] storage jobIds = _providerJobs[provider];
        JobRequest[] memory result = new JobRequest[](jobIds.length);
        for (uint256 i = 0; i < jobIds.length; i++) {
            result[i] = jobs[jobIds[i]];
        }
        return result;
    }

    function _hasMatchingSkill(bytes32[] storage required, bytes32[] calldata owned) private view returns (bool) {
        for (uint256 i = 0; i < required.length; i++) {
            for (uint256 j = 0; j < owned.length; j++) {
                if (required[i] == owned[j]) return true;
            }
        }
        return false;
    }

    function dispute(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(msg.sender == j.requester || msg.sender == j.provider, "unauthorized");
        require(j.status == JobStatus.IN_PROGRESS || j.status == JobStatus.ACCEPTED, "cannot dispute");
        j.status = JobStatus.DISPUTED;
        emit JobDisputed(jobId);
    }

    function refund(uint256 jobId) external {
        JobRequest storage j = jobs[jobId];
        require(j.requester == msg.sender, "only requester");
        require(j.status == JobStatus.DISPUTED || (j.status == JobStatus.REQUESTED && block.number > j.deadline), "cannot refund");
        j.status = JobStatus.REFUNDED;
        payable(j.requester).transfer(j.reward);
        emit JobRefunded(jobId);
    }
}
