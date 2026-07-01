// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Shared interface for Modules A & B — avoid cross-file duplication.
interface IAgentRegistry {
    function agentByContract(address) external view returns (uint256);
    function addEarnings(uint256, uint256, uint256) external;
    function getAgentSkills(uint256) external view returns (bytes32[] memory);
}

interface IAgentStaking {
    function isAgentActive(address) external view returns (bool);
    function recordRating(address, uint256) external;
    function slash(address, uint256, string calldata) external;
}

interface IAgentHeartbeat {
    function isAlive(address) external view returns (bool);
}

interface IAgentReputation {
    function getReputation(address agent) external view returns (uint256 score, uint256 reviewCount, uint256 lastUpdate);
}
