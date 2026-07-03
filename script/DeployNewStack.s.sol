// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarketV2.sol";

/// @notice Deploy full Module A stack with new registry.
contract DeployNewStack is Script {
    function run() external {
        vm.startBroadcast();

        // 1. New registry (we own it, can authorize anything)
        AgentRegistry registry = new AgentRegistry();
        console.log("AGENT_REGISTRY=%s", address(registry));

        // 2. New staking + heartbeat
        AgentStaking staking = new AgentStaking(address(registry));
        console.log("AGENT_STAKING=%s", address(staking));

        AgentHeartbeat heartbeat = new AgentHeartbeat(address(registry));
        console.log("AGENT_HEARTBEAT=%s", address(heartbeat));

        // 3. New JobMarketV2 (fixed getAgentSkills)
        JobMarketV2 jobMarket = new JobMarketV2(address(registry), address(staking), address(heartbeat));
        console.log("JOB_MARKET_V2=%s", address(jobMarket));

        // 4. Authorize everything
        registry.setAuthorized(address(jobMarket), true);
        staking.setAuthorized(address(jobMarket), true);
        console.log("All cross-authorization done");

        vm.stopBroadcast();
    }
}
