// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentSubcontractor — Agent-to-agent recursive sub-contracting
/// @notice Provider A dapat job dari JobMarketV2, tapi subcontract sebagian ke Agent B
///         (sub-provider) dengan reward split. Bisa recursive (B subcontract lagi ke C).
///         Anti-loop: MAX_DEPTH. Parent tetap bertanggung jawab ke requester (escrow di parent).
interface IJobMarketV2Sub {
    function submitResult(uint256 jobId, bytes calldata) external;
}

contract AgentSubcontractor {
    IAgentRegistry public immutable registry;
    IJobMarketV2Sub public immutable jobMarket;

    uint256 public constant MAX_DEPTH = 3;
    uint256 public constant PARENT_MARGIN_MIN_BPS = 500;   // parent minimal ambil 5% margin

    struct Sub {
        uint256 id;
        bytes32 parentJobId;       // jobId dari market (bytes32(uint256))
        address parent;            // agent yang subcontract
        address child;             // sub-provider
        bytes32[] requiredSkillIds;
        bytes taskData;
        uint256 reward;            // reward untuk child (<= parent reward)
        uint8 depth;
        Status status;
        bytes resultData;
    }

    enum Status { OPEN, ACCEPTED, COMPLETED, CANCELLED }

    uint256 public nextSubId;
    mapping(uint256 => Sub) public subs;
    mapping(address => uint256[]) private _parentSubs;
    mapping(address => uint256[]) private _childSubs;

    event SubCreated(uint256 indexed id, bytes32 indexed parentJobId, address parent, address child, uint256 reward, uint8 depth);
    event SubAccepted(uint256 indexed id);
    event SubCompleted(uint256 indexed id, bytes resultData);

    constructor(address _registry, address _jobMarket) {
        registry = IAgentRegistry(_registry);
        jobMarket = IJobMarketV2Sub(_jobMarket);
    }

    modifier onlyAgent() {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        _;
    }

    /// @notice Parent create sub-contract. rewardChild <= parentReward * (1 - margin).
    /// @param depth 0 jika dari job market langsung; naik tiap level.
    function createSub(
        bytes32 parentJobId,
        address child,
        bytes32[] calldata requiredSkillIds,
        bytes calldata taskData,
        uint256 rewardChild,
        uint256 parentReward,
        uint8 depth
    ) external payable onlyAgent returns (uint256) {
        require(registry.agentByContract(child) != 0, "child not agent");
        require(depth <= MAX_DEPTH, "max depth");
        require(rewardChild > 0, "reward required");
        // parent harus ambil margin minimal
        require(rewardChild + (parentReward * PARENT_MARGIN_MIN_BPS) / 10000 <= parentReward, "margin too thin");
        require(msg.value >= rewardChild, "escrow child reward");

        uint256 id = ++nextSubId;
        subs[id] = Sub({
            id: id,
            parentJobId: parentJobId,
            parent: msg.sender,
            child: child,
            requiredSkillIds: requiredSkillIds,
            taskData: taskData,
            reward: rewardChild,
            depth: depth,
            status: Status.OPEN,
            resultData: ""
        });
        _parentSubs[msg.sender].push(id);
        _childSubs[child].push(id);
        emit SubCreated(id, parentJobId, msg.sender, child, rewardChild, depth);
        return id;
    }

    /// @notice Child accept sub-contract.
    function acceptSub(uint256 subId) external onlyAgent {
        Sub storage s = subs[subId];
        require(s.status == Status.OPEN, "not open");
        require(msg.sender == s.child, "only child");
        s.status = Status.ACCEPTED;
        emit SubAccepted(subId);
    }

    /// @notice Child submit hasil. Escrow release ke child. Parent dapat sisa (margin).
    /// @dev ponytail: parent reward (sisa) di-claim terpisah; di sini release child + result disimpan.
    function submitSubResult(uint256 subId, bytes calldata resultData) external onlyAgent {
        Sub storage s = subs[subId];
        require(s.status == Status.ACCEPTED, "not accepted");
        require(msg.sender == s.child, "only child");
        s.status = Status.COMPLETED;
        s.resultData = resultData;
        (bool ok,) = s.child.call{value: s.reward}("");
        require(ok, "pay child failed");
        emit SubCompleted(subId, resultData);
    }

    /// @notice Parent batalkan sub OPEN (sebelum accept). Refund escrow.
    function cancelSub(uint256 subId) external onlyAgent {
        Sub storage s = subs[subId];
        require(s.parent == msg.sender, "only parent");
        require(s.status == Status.OPEN, "not open");
        s.status = Status.CANCELLED;
        (bool ok,) = msg.sender.call{value: s.reward}("");
        require(ok, "refund failed");
    }

    function getSubsByParent(address parent) external view returns (uint256[] memory) { return _parentSubs[parent]; }
    function getSubsByChild(address child) external view returns (uint256[] memory) { return _childSubs[child]; }
}
