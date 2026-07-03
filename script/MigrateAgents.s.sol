// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";

/// @notice Migrate agents from old registry to new registry.
contract MigrateAgents is Script {
    function run() external {
        vm.startBroadcast();

        AgentRegistry reg = AgentRegistry(0x8709375592Be5c8d8Fd582Fff096BCbBE9821637);
        address old = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;

        uint256 count = 13;
        console.log("Migrating %d agents", count);

        for (uint256 i = 1; i <= count; i++) {
            (bool ok, bytes memory data) = old.staticcall(
                abi.encodeWithSignature("agents(uint256)", i)
            );
            if (!ok) continue;

            (, string memory n, string memory d, address c,,,,,) = abi.decode(
                data, (uint256, string, string, address, uint256, uint256, uint256, uint256, bool)
            );

            if (c == address(0) || bytes(n).length == 0) continue;
            reg.registerAgent(n, d, c);
            console.log("Agent #%d migrated", i);
        }

        vm.stopBroadcast();
    }
}
