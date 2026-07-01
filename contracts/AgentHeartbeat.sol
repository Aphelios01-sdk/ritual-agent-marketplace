// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentHeartbeat — Agent health check. Agents ping periodically; JobMarket checks isAlive before accept.
/// @notice Scheduler precompile (0x56e7...) can trigger automatic pings (Module C). For the demo, ping manually.
contract AgentHeartbeat {
    IAgentRegistry public immutable registry;
    uint256 public constant ALIVE_WINDOW = 1000;  // ~5 min @ 1 block/3s. Agents must ping within this window.
    uint256 public constant GRACE_BLOCKS = 100;    // limited grace period for new agents that haven't pinged yet.

    mapping(address => uint256) public lastPing;         // agentContract -> last ping block number
    mapping(address => uint256) public firstSeen;        // agentContract -> first recorded block

    event Heartbeat(address indexed agent, uint256 block);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
    }

    /// @notice Agent ping. Only registered agents.
    function ping() external {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        if (firstSeen[msg.sender] == 0) firstSeen[msg.sender] = block.number;
        lastPing[msg.sender] = block.number;
        emit Heartbeat(msg.sender, block.number);
    }

    /// @notice Agent is alive if pinged within ALIVE_WINDOW, or (never pinged) still within GRACE_BLOCKS
    ///         since firstSeen. Grace is limited — not forever.
    function isAlive(address agent) external view returns (bool) {
        uint256 p = lastPing[agent];
        if (p != 0) return block.number - p <= ALIVE_WINDOW;
        uint256 fs = firstSeen[agent];
        if (fs == 0) return block.number <= GRACE_BLOCKS;   // never contacted at all: global grace at early blocks
        return block.number - fs <= GRACE_BLOCKS;
    }

    function getLastPing(address agent) external view returns (uint256) {
        return lastPing[agent];
    }
}
