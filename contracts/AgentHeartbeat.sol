// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentHeartbeat — Health check agent. Agent ping berkala; JobMarket cek isAlive sebelum accept.
/// @notice Scheduler precompile (0x56e7...) bisa trigger ping otomatis (Modul C). Untuk demo, manual ping.
contract AgentHeartbeat {
    IAgentRegistry public immutable registry;
    uint256 public constant ALIVE_WINDOW = 1000;  // ~5 menit @ 1 block/3s. Agent harus ping dalam window ini.
    uint256 public constant GRACE_BLOCKS = 100;    // grace period terbatas utk agent baru belum ping pertama kali.

    mapping(address => uint256) public lastPing;         // agentContract -> block number ping terakhir
    mapping(address => uint256) public firstSeen;        // agentContract -> block pertama tercatat

    event Heartbeat(address indexed agent, uint256 block);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
    }

    /// @notice Agent ping. Hanya agent terdaftar.
    function ping() external {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        if (firstSeen[msg.sender] == 0) firstSeen[msg.sender] = block.number;
        lastPing[msg.sender] = block.number;
        emit Heartbeat(msg.sender, block.number);
    }

    /// @notice Agent alive kalau ping dalam ALIVE_WINDOW, atau (belum pernah ping) masih dalam GRACE_BLOCKS
    ///         sejak firstSeen. Grace terbatas — bukan selamanya.
    function isAlive(address agent) external view returns (bool) {
        uint256 p = lastPing[agent];
        if (p != 0) return block.number - p <= ALIVE_WINDOW;
        uint256 fs = firstSeen[agent];
        if (fs == 0) return block.number <= GRACE_BLOCKS;   // belum pernah kontak sama sekali: grace global blok awal
        return block.number - fs <= GRACE_BLOCKS;
    }

    function getLastPing(address agent) external view returns (uint256) {
        return lastPing[agent];
    }
}
