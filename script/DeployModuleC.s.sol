// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/DisputeCouncil.sol";
import "../contracts/AgentSubcontractor.sol";
import "../contracts/SubscriptionManager.sol";
import "../contracts/BulkJobBatcher.sol";
import "../contracts/WebhookRegistry.sol";

/// @notice Deploy Modul C: 5 kontrak infra lanjutan. API Gateway Web2 = off-chain (folder api-gateway/).
contract DeployModuleC is Script {
    address constant REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;
    address constant STAKING = 0x3cCdEfCeCb96cc73Fa3B618A6Dc1690B831658eF;   // Modul A
    address constant JOB_MARKET_V2 = 0x14781a0E7e559f2A651115F83467E7AE55ccd6d6;  // Modul A

    function run() external {
        vm.startBroadcast();

        DisputeCouncil council = new DisputeCouncil(REGISTRY, STAKING);
        AgentSubcontractor subcontractor = new AgentSubcontractor(REGISTRY, JOB_MARKET_V2);
        SubscriptionManager subscription = new SubscriptionManager(REGISTRY);
        BulkJobBatcher batcher = new BulkJobBatcher(JOB_MARKET_V2);
        WebhookRegistry webhooks = new WebhookRegistry(REGISTRY);

        console.log("DISPUTE_COUNCIL=%s", address(council));
        console.log("AGENT_SUBCONTRACTOR=%s", address(subcontractor));
        console.log("SUBSCRIPTION_MANAGER=%s", address(subscription));
        console.log("BULK_JOB_BATCHER=%s", address(batcher));
        console.log("WEBHOOK_REGISTRY=%s", address(webhooks));

        vm.stopBroadcast();
    }
}
