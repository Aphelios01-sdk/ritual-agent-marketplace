// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title SubscriptionManager — Recurring subscription job via Scheduler precompile
/// @notice Client subscribes to an agent (periodic: every N blocks). Scheduler (0x56e7...) triggers
///         execute → calls the agent. Auto-charges per period from the deposit. Cancel anytime.
///         ponytail: Scheduler precompile call is commented out (needs a specific format). For the demo,
///         execute manually / by an off-chain keeper. The execute hook is ready.
interface IAgentSubExec {
    function executeForSubscriber(bytes32 subId, bytes calldata payload) external;
}

contract SubscriptionManager {
    IAgentRegistry public immutable registry;

    uint256 public constant MAX_PERIODS = 365;   // cap subscription at 1 year (period=1day-ish)

    struct Sub {
        bytes32 id;
        address subscriber;     // client
        address agent;          // provider agent
        bytes32[] requiredSkillIds;
        bytes taskTemplate;     // payload per execution
        uint256 pricePerPeriod; // charge tiap period
        uint256 periodBlocks;   // execution interval
        uint256 nextExecBlock;  // next execution block
        uint256 periodsLeft;
        uint256 deposit;        // sisa deposit (auto-decrement)
        bool active;
    }

    mapping(bytes32 => Sub) public subs;
    mapping(address => bytes32[]) private _bySubscriber;
    mapping(address => bytes32[]) private _byAgent;

    event Subscribed(bytes32 indexed id, address indexed subscriber, address indexed agent, uint256 pricePerPeriod, uint256 periods);
    event Executed(bytes32 indexed id, uint256 charge, uint256 periodsLeft);
    event Cancelled(bytes32 indexed id, uint256 refund);
    event ToppedUp(bytes32 indexed id, uint256 amount);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
    }

    /// @notice Client subscribe. msg.value = pricePerPeriod * periods (deposit).
    function subscribe(
        address agent,
        bytes32[] calldata requiredSkillIds,
        bytes calldata taskTemplate,
        uint256 pricePerPeriod,
        uint256 periodBlocks,
        uint256 periods
    ) external payable returns (bytes32) {
        require(registry.agentByContract(agent) != 0, "agent not registered");
        require(pricePerPeriod > 0 && periodBlocks > 0, "bad params");
        require(periods > 0 && periods <= MAX_PERIODS, "bad periods");
        uint256 total = pricePerPeriod * periods;
        require(msg.value >= total, "insufficient deposit");

        bytes32 id = keccak256(abi.encodePacked(msg.sender, agent, block.number, periods));
        require(!subs[id].active, "sub exists");
        subs[id] = Sub({
            id: id,
            subscriber: msg.sender,
            agent: agent,
            requiredSkillIds: requiredSkillIds,
            taskTemplate: taskTemplate,
            pricePerPeriod: pricePerPeriod,
            periodBlocks: periodBlocks,
            nextExecBlock: block.number + periodBlocks,
            periodsLeft: periods,
            deposit: msg.value,
            active: true
        });
        _bySubscriber[msg.sender].push(id);
        _byAgent[agent].push(id);
        emit Subscribed(id, msg.sender, agent, pricePerPeriod, periods);
        return id;
    }

    function topUp(bytes32 id) external payable {
        Sub storage s = subs[id];
        require(s.active, "inactive");
        s.deposit += msg.value;
        s.periodsLeft += msg.value / s.pricePerPeriod;
        emit ToppedUp(id, msg.value);
    }

    /// @notice Execute one period (called by keeper/Scheduler/keeper agent). Charges the deposit, pays the agent.
    /// @dev ponytail: hook to agent execution (HTTP/LLM) off-chain. Payment is settled here.
    function execute(bytes32 id) external {
        Sub storage s = subs[id];
        require(s.active, "inactive");
        require(block.number >= s.nextExecBlock, "not due");
        require(s.periodsLeft > 0, "no periods");
        require(s.deposit >= s.pricePerPeriod, "insufficient deposit");

        s.deposit -= s.pricePerPeriod;
        s.periodsLeft--;
        s.nextExecBlock += s.periodBlocks;

        (bool ok,) = s.agent.call{value: s.pricePerPeriod}("");
        require(ok, "pay agent failed");

        if (s.periodsLeft == 0 || s.deposit < s.pricePerPeriod) {
            s.active = false;
        }
        emit Executed(id, s.pricePerPeriod, s.periodsLeft);
    }

    function cancel(bytes32 id) external {
        Sub storage s = subs[id];
        require(s.subscriber == msg.sender, "only subscriber");
        require(s.active, "inactive");
        s.active = false;
        uint256 refund = s.deposit;
        s.deposit = 0;
        (bool ok,) = msg.sender.call{value: refund}("");
        require(ok, "refund failed");
        emit Cancelled(id, refund);
    }

    function getSubsBySubscriber(address sub) external view returns (bytes32[] memory) { return _bySubscriber[sub]; }
    function getSubsByAgent(address agent) external view returns (bytes32[] memory) { return _byAgent[agent]; }
}
