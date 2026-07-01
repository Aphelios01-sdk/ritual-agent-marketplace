// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title WebhookRegistry — On-chain webhook/callback registry
/// @notice Agent/oracle register webhook target (contract address + function selector).
///         Saat event tertentu (job completed, dispute resolved), JobMarket/oracle trigger
///         callback ke target. Target harus implementasi IWebhookReceiver.
///         ponytail: gas-limit callback dibatasi (low-level call, tidak revert parent).
interface IWebhookReceiver {
    function onWebhook(bytes32 eventType, bytes calldata payload) external;
}

contract WebhookRegistry {
    IAgentRegistry public immutable registry;
    address public owner;
    uint256 public constant MAX_WEBHOOKS_PER_AGENT = 50;
    uint256 public constant MAX_TRIGGER_PER_EVENT = 20;   // cap loop trigger anti gas-grief

    mapping(address => bool) public authorized;   // keeper whitelist utk trigger

    struct Webhook {
        address target;          // contract penerima callback
        bytes4 selector;         // selector (default onWebhook)
        bytes32[] eventTypes;    // jenis event yg dipicu (keccak)
        bool active;
    }

    mapping(address => Webhook[]) public webhooks;          // agent → webhooks
    mapping(address => mapping(bytes32 => uint256[])) private _byEvent;  // agent → eventType → indices

    event WebhookRegistered(address indexed agent, uint256 index, address target, bytes32[] eventTypes);
    event WebhookTriggered(address indexed agent, bytes32 indexed eventType, address target, bool success);
    event WebhookRemoved(address indexed agent, uint256 index);
    event AuthorizedChanged(address indexed caller, bool ok);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
        owner = msg.sender;
    }

    modifier onlyAgent() {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        _;
    }

    /// @notice Owner kelola whitelist keeper (JobMarket/oracle) yang boleh trigger.
    function setAuthorized(address caller, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[caller] = ok;
        emit AuthorizedChanged(caller, ok);
    }

    /// @notice Agent register webhook. selector default ke onWebhook.
    function registerWebhook(address target, bytes4 selector, bytes32[] calldata eventTypes) external onlyAgent returns (uint256) {
        require(target != address(0), "bad target");
        require(eventTypes.length > 0, "no events");
        require(webhooks[msg.sender].length < MAX_WEBHOOKS_PER_AGENT, "webhook cap");
        uint256 idx = webhooks[msg.sender].length;
        webhooks[msg.sender].push(Webhook({
            target: target,
            selector: selector == bytes4(0) ? IWebhookReceiver.onWebhook.selector : selector,
            eventTypes: eventTypes,
            active: true
        }));
        for (uint256 i = 0; i < eventTypes.length; i++) {
            _byEvent[msg.sender][eventTypes[i]].push(idx);
        }
        emit WebhookRegistered(msg.sender, idx, target, eventTypes);
        return idx;
    }

    function removeWebhook(uint256 index) external onlyAgent {
        require(index < webhooks[msg.sender].length, "bad index");
        webhooks[msg.sender][index].active = false;
        emit WebhookRemoved(msg.sender, index);
    }

    /// @notice Trigger webhook untuk agent + eventType. Hanya keeper ter-whitelist.
    /// @dev low-level call dengan gas terbatas, swallow revert (tidak block parent flow).
    ///      Loop di-cap MAX_TRIGGER_PER_EVENT anti gas-grief.
    function trigger(address agent, bytes32 eventType, bytes calldata payload) external {
        require(authorized[msg.sender] || msg.sender == owner, "not authorized keeper");
        uint256[] storage indices = _byEvent[agent][eventType];
        uint256 limit = indices.length < MAX_TRIGGER_PER_EVENT ? indices.length : MAX_TRIGGER_PER_EVENT;
        for (uint256 i = 0; i < limit; i++) {
            Webhook storage w = webhooks[agent][indices[i]];
            if (!w.active) continue;
            (bool ok,) = w.target.call{gas: 100000}(
                abi.encodeWithSelector(w.selector, eventType, payload)
            );
            emit WebhookTriggered(agent, eventType, w.target, ok);
        }
    }

    function getWebhooks(address agent) external view returns (Webhook[] memory) {
        return webhooks[agent];
    }
}
