// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarketV2.sol";

/// @notice Deploy Module A contracts only. Authorization done separately.
contract DeployAll is Script {
    address constant EXISTING_REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;

    function run() external {
        vm.startBroadcast();

        AgentStaking staking = new AgentStaking(EXISTING_REGISTRY);
        console.log("AGENT_STAKING=%s", address(staking));

        AgentHeartbeat heartbeat = new AgentHeartbeat(EXISTING_REGISTRY);
        console.log("AGENT_HEARTBEAT=%s", address(heartbeat));

        JobMarketV2 jobMarket = new JobMarketV2(EXISTING_REGISTRY, address(staking), address(heartbeat));
        console.log("JOB_MARKET_V2=%s", address(jobMarket));

        // Authorize JobMarketV2 on staking (we own this one)
        staking.setAuthorized(address(jobMarket), true);
        console.log("Authorized JobMarketV2 on AgentStaking");

        vm.stopBroadcast();
    }
}
