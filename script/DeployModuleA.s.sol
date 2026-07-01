// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarketV2.sol";

/// @notice Deploy Module A: AgentStaking + AgentHeartbeat + JobMarketV2.
///         Reuse the AgentRegistry already on-chain.
contract DeployModuleA is Script {
    // Existing contracts on chain 1979
    address constant REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;

    function run() external {
        vm.startBroadcast();

        AgentStaking staking = new AgentStaking(REGISTRY);
        AgentHeartbeat heartbeat = new AgentHeartbeat(REGISTRY);
        JobMarketV2 jobMarket = new JobMarketV2(REGISTRY, address(staking), address(heartbeat));

        console.log("AGENT_STAKING=%s", address(staking));
        console.log("AGENT_HEARTBEAT=%s", address(heartbeat));
        console.log("JOB_MARKET_V2=%s", address(jobMarket));

        vm.stopBroadcast();
    }
}
