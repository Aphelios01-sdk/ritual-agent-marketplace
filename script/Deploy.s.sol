// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/JobMarket.sol";
import "../contracts/AgentFactory.sol";

/// @notice Deploy order: Registry → JobMarket → Factory
contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        AgentRegistry registry = new AgentRegistry();
        JobMarket jobMarket = new JobMarket(address(registry));
        AgentFactory factory = new AgentFactory(address(registry), address(jobMarket));

        vm.stopBroadcast();

        // log addresses for the frontend
        console.log("AgentRegistry:", address(registry));
        console.log("JobMarket:", address(jobMarket));
        console.log("AgentFactory:", address(factory));
    }
}
