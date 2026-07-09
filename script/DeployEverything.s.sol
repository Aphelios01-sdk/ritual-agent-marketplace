// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarket.sol";
import "../contracts/JobMarketV2.sol";
import "../contracts/AgentFactory.sol";
import "../contracts/AgentReputation.sol";
import "../contracts/AgentDirectory.sol";
import "../contracts/JobTemplates.sol";
import "../contracts/DisputeCouncil.sol";
import "../contracts/AgentSubcontractor.sol";
import "../contracts/SubscriptionManager.sol";
import "../contracts/BulkJobBatcher.sol";
import "../contracts/WebhookRegistry.sol";

/// @notice One-shot deploy of the full marketplace stack.
///         Deployer becomes owner of all ownable contracts.
contract DeployEverything is Script {
    function run() external {
        vm.startBroadcast();

        console.log("OWNER=%s", msg.sender);

        // ── Module A (core) ──────────────────────────────────────────
        AgentRegistry registry = new AgentRegistry();
        console.log("AGENT_REGISTRY=%s", address(registry));

        AgentStaking staking = new AgentStaking(address(registry));
        console.log("AGENT_STAKING=%s", address(staking));

        AgentHeartbeat heartbeat = new AgentHeartbeat(address(registry));
        console.log("AGENT_HEARTBEAT=%s", address(heartbeat));

        JobMarketV2 jobMarketV2 = new JobMarketV2(address(registry), address(staking), address(heartbeat));
        console.log("JOB_MARKET_V2=%s", address(jobMarketV2));

        JobMarket jobMarketV1 = new JobMarket(address(registry));
        console.log("JOB_MARKET=%s", address(jobMarketV1));

        AgentFactory factory = new AgentFactory(address(registry), address(jobMarketV2));
        console.log("AGENT_FACTORY=%s", address(factory));

        registry.setAuthorized(address(jobMarketV2), true);
        staking.setAuthorized(address(jobMarketV2), true);

        // ── Module B (discovery) ─────────────────────────────────────
        AgentReputation reputation = new AgentReputation(address(registry));
        console.log("AGENT_REPUTATION=%s", address(reputation));

        AgentDirectory directory = new AgentDirectory(address(registry), address(reputation));
        console.log("AGENT_DIRECTORY=%s", address(directory));

        JobTemplates templates = new JobTemplates();
        console.log("JOB_TEMPLATES=%s", address(templates));

        reputation.setAuthorized(address(jobMarketV2), true);

        // ── Module C (advanced) ──────────────────────────────────────
        DisputeCouncil council = new DisputeCouncil(address(registry), address(staking));
        console.log("DISPUTE_COUNCIL=%s", address(council));

        AgentSubcontractor subcontractor = new AgentSubcontractor(address(registry), address(jobMarketV2));
        console.log("AGENT_SUBCONTRACTOR=%s", address(subcontractor));

        SubscriptionManager subscription = new SubscriptionManager(address(registry));
        console.log("SUBSCRIPTION_MANAGER=%s", address(subscription));

        BulkJobBatcher batcher = new BulkJobBatcher(address(jobMarketV2));
        console.log("BULK_JOB_BATCHER=%s", address(batcher));

        WebhookRegistry webhooks = new WebhookRegistry(address(registry));
        console.log("WEBHOOK_REGISTRY=%s", address(webhooks));

        staking.setAuthorized(address(council), true);

        // Seed demo agent with 2 skills (keeps stack shallow)
        _seedDemo(factory);

        console.log("=== DEPLOY COMPLETE ===");
        vm.stopBroadcast();
    }

    function _seedDemo(AgentFactory factory) internal {
        AgentRegistry.Skill[] memory skills = new AgentRegistry.Skill[](2);
        skills[0] = AgentRegistry.Skill({
            skillId: bytes32(uint256(1)),
            name: "fetch-token-price",
            description: "Fetch real-time token price from CoinGecko",
            precompileAddr: address(0x0000000000000000000000000000000000000801),
            configData: "",
            active: true
        });
        skills[1] = AgentRegistry.Skill({
            skillId: bytes32(uint256(2)),
            name: "sentiment-analysis",
            description: "Analyze sentiment of text data using LLM",
            precompileAddr: address(0x0000000000000000000000000000000000000802),
            configData: "",
            active: true
        });

        (address agentAddr, uint256 agentId) = factory.createAgent(
            "Prompt Market Demo Agent",
            "Official seed agent with HTTP + LLM skills.",
            skills
        );
        console.log("DEMO_AGENT=%s", agentAddr);
        console.log("DEMO_AGENT_ID=%s", agentId);
    }
}
