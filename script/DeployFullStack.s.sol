// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/JobMarketV2.sol";

/// @notice Deploy full stack: new AgentRegistry + migrate agents from old registry.
contract DeployFullStack is Script {
    address constant OLD_REGISTRY = 0x9dE50bd72941a418B8346d81F9c7217D5b0E0cF5;

    struct OldAgentInfo {
        uint256 id;
        string name;
        string description;
        address agentContract;
        uint256 bondAmount;
        uint256 totalEarnings;
        uint256 avgRating;
        uint256 jobCount;
        bool active;
    }

    struct OldSkill {
        bytes32 skillId;
        string name;
        string description;
        address precompileAddr;
        bytes configData;
        bool active;
    }

    function run() external {
        vm.startBroadcast();

        // 1. Deploy new AgentRegistry (has getAgentSkillIds + setDescription)
        AgentRegistry newRegistry = new AgentRegistry();
        console.log("NEW_REGISTRY=%s", address(newRegistry));

        // 2. Deploy new AgentStaking + AgentHeartbeat + JobMarketV2
        AgentStaking staking = new AgentStaking(address(newRegistry));
        console.log("AGENT_STAKING=%s", address(staking));

        AgentHeartbeat heartbeat = new AgentHeartbeat(address(newRegistry));
        console.log("AGENT_HEARTBEAT=%s", address(heartbeat));

        JobMarketV2 jobMarket = new JobMarketV2(address(newRegistry), address(staking), address(heartbeat));
        console.log("JOB_MARKET_V2=%s", address(jobMarket));

        // 3. Authorize cross-calls
        newRegistry.setAuthorized(address(jobMarket), true);
        staking.setAuthorized(address(jobMarket), true);
        console.log("Authorized JobMarketV2 on registry + staking");

        // 4. Migrate agents from old registry
        uint256 count = 13; // nextAgentId on old registry (from storage)
        uint256 migrated = 0;

        for (uint256 i = 1; i <= count; i++) {
            // Read from old registry
            (uint256 id, string memory name, string memory description, address agentContract,
             ,,, uint256 jobCount, bool active) = OldAgentInfo(abi.decode(
                abi.encode(OldAgentInfo({
                    id: 0, name: "", description: "", agentContract: address(0),
                    bondAmount: 0, totalEarnings: 0, avgRating: 0, jobCount: 0, active: false
                })),
                (uint256, string, string, address, uint256, uint256, uint256, uint256, bool)
            ));

            // Try staticcall to get agent data
            (bool ok, bytes memory data) = OLD_REGISTRY.staticcall(
                abi.encodeWithSignature("agents(uint256)", i)
            );

            if (ok && data.length > 0) {
                (
                    uint256 rid, string memory rname, string memory rdesc, address rcontract,
                    uint256 rbond, uint256 rearnings, uint256 ravg, uint256 rjobcount, bool ractive
                ) = abi.decode(data, (uint256, string, string, address, uint256, uint256, uint256, uint256, bool));

                if (rcontract != address(0) && bytes(rname).length > 0) {
                    uint256 newId = newRegistry.registerAgent(rname, rdesc, rcontract);
                    console.log("Migrated agent %s (old #%d -> new #%d)", rname, i, newId);

                    // Migrate skills
                    (bool skillOk, bytes memory skillData) = OLD_REGISTRY.staticcall(
                        abi.encodeWithSignature("getAgentSkills(uint256)", i)
                    );
                    if (skillOk && skillData.length > 0) {
                        try newRegistry.setSkills(newId, abi.decode(skillData, (OldSkill[]))) {} catch {}
                    }

                    migrated++;
                }
            }
        }

        console.log("Migrated %d agents", migrated);
        vm.stopBroadcast();
    }
}
