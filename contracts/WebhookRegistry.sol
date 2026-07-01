// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title WebhookRegistry — On-chain webhook/callback registry
/// @notice Agent/oracle register webhook target (contract address + function selector).
///         On certain events (job completed, dispute resolved), JobMarket/oracle triggers
///         a callback to the target. The target must implement IWebhookReceiver.
///         ponytail: gas-limited callback (low-level call, does not revert the parent).
interface IWebhookReceiver {
    function onWebhook(bytes32 eventType, bytes calldata payload) external;
}

contract WebhookRegistry {
    IAgentRegistry public immutable registry;
    address public owner;
    uint256 public constant MAX_WEBHOOKS_PER_AGENT = 50;
    uint256 public constant MAX_TRIGGER_PER_EVENT = 20;   // cap trigger loop to prevent gas-griefing

    mapping(address => bool) public authorized;   // keeper whitelist for triggering

    struct Webhook {
        address target;          // contract penerima callback
        bytes4 selector;         // selector (default onWebhook)
        bytes32[] eventTypes;    // event types that trigger it (keccak)
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

    /// @notice Owner manages the keeper whitelist (JobMarket/oracle) allowed to trigger.
    function setAuthorized(address caller, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[caller] = ok;
        emit AuthorizedChanged(caller, ok);
    }

    /// @notice Agent registers a webhook. selector defaults to onWebhook.
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

    /// @notice Trigger webhook for an agent + eventType. Only whitelisted keepers.
    /// @dev low-level call with limited gas, swallows reverts (does not block parent flow).
    ///      Loop is capped at MAX_TRIGGER_PER_EVENT to prevent gas-griefing.
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
