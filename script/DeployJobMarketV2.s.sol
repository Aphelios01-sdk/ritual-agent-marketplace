// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarketV2.sol";

interface IRegistryAuth {
    function setAuthorized(address who, bool ok) external;
}

/// @notice Deploy JobMarketV2 only (fix for getAgentSkillIds bug).
///         Reuses existing AgentStaking + AgentHeartbeat + AgentRegistry on-chain.
contract DeployJobMarketV2 is Script {
    // Existing contracts on chain 1979
    address constant REGISTRY   = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;
    address constant STAKING    = 0x8C2Ab37A6e9721fb2dE113acf0AC787eD937DdcB;
    address constant HEARTBEAT  = 0x43581F6bE77b1050AA75db112280b46B75666Bc1;

    function run() external {
        vm.startBroadcast();

        JobMarketV2 jobMarket = new JobMarketV2(REGISTRY, STAKING, HEARTBEAT);

        try IRegistryAuth(REGISTRY).setAuthorized(address(jobMarket), true) {} catch {
            console.log("WARN: could not authorize JobMarketV2 on registry (not owner?)");
        }

        console.log("NEW_JOB_MARKET_V2=%s", address(jobMarket));

        vm.stopBroadcast();
    }
}
