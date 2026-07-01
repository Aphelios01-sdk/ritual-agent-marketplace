// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentReputation.sol";
import "../contracts/AgentDirectory.sol";
import "../contracts/JobTemplates.sol";

/// @notice Deploy Module B: AgentReputation + AgentDirectory + JobTemplates.
///         Reuse AgentRegistry. AgentDirectory needs AgentReputation (wiring).
contract DeployModuleB is Script {
    address constant REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;

    function run() external {
        vm.startBroadcast();

        AgentReputation reputation = new AgentReputation(REGISTRY);
        AgentDirectory directory = new AgentDirectory(REGISTRY, address(reputation));
        JobTemplates templates = new JobTemplates();

        console.log("AGENT_REPUTATION=%s", address(reputation));
        console.log("AGENT_DIRECTORY=%s", address(directory));
        console.log("JOB_TEMPLATES=%s", address(templates));

        vm.stopBroadcast();
    }
}
