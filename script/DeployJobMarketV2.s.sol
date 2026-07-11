// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/JobMarketV2.sol";

interface IAuth {
    function setAuthorized(address who, bool ok) external;
    function owner() external view returns (address);
}

/// @notice Redeploy JobMarketV2 with longer bid/result windows on Ritual 1979.
contract DeployJobMarketV2 is Script {
    address constant REGISTRY  = 0x058756c754CAD054571933be57E3AADD3c3660F4;
    address constant STAKING   = 0xdF186d42Ffe22246dB6FaE8d3E6AB29735ecfF18;
    address constant HEARTBEAT = 0x157802f666233ffd2723b0596fa89824D1aea5aB;

    function run() external {
        vm.startBroadcast();

        JobMarketV2 jobMarket = new JobMarketV2(REGISTRY, STAKING, HEARTBEAT);
        console.log("NEW_JOB_MARKET_V2=%s", address(jobMarket));
        console.log("bidWindow=%s", jobMarket.bidWindow());
        console.log("resultTimeout=%s", jobMarket.resultTimeout());

        // Authorize new market on registry + staking (caller must be owner)
        IAuth(REGISTRY).setAuthorized(address(jobMarket), true);
        console.log("Authorized on registry");
        IAuth(STAKING).setAuthorized(address(jobMarket), true);
        console.log("Authorized on staking");

        vm.stopBroadcast();
    }
}
