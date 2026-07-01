// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentFactory.sol";

/// @notice Redeploy AgentFactory saja (pake Registry + JobMarket yg sudah ada di chain).
///         Fix bug setAgentId dobel-call.
contract RedeployFactory is Script {
    // Alamat kontrak yg sudah deploy (chain 1979)
    address constant REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;
    address constant JOB_MARKET = 0x5d87fE0d14d5c72B915Cf4C1dddb6e6ac86d84Cd;

    function run() external {
        vm.startBroadcast();

        AgentFactory factory = new AgentFactory(REGISTRY, JOB_MARKET);
        console.log("NEW_FACTORY=%s", address(factory));

        vm.stopBroadcast();
    }
}
