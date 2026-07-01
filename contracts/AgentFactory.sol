// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AgentRegistry.sol";
import "./AgentContract.sol";

/// @title AgentFactory — Deploy + register + wallet setup in a single TX
/// @notice Anyone (human or another agent) can deploy a new agent
contract AgentFactory {
    address public registry;
    address public jobMarket;

    event AgentCreated(uint256 indexed agentId, address indexed agentContract, string name);

    constructor(address _registry, address _jobMarket) {
        registry = _registry;
        jobMarket = _jobMarket;
    }

    /// @notice Deploy a new agent, register it, and set up initial skills
    function createAgent(
        string calldata name,
        string calldata description,
        AgentRegistry.Skill[] calldata initialSkills
    ) external returns (address, uint256) {
        // 1. Deploy AgentContract
        AgentContract agent = new AgentContract(registry, jobMarket);

        // 2. Register in AgentRegistry
        uint256 id = AgentRegistry(registry).registerAgent(name, description, address(agent));

        // 3. Set agentId on the contract
        agent.setAgentId(id);

        // 4. Install initial skills (locally on the agent contract)
        for (uint256 i = 0; i < initialSkills.length; i++) {
            AgentRegistry.Skill memory s = initialSkills[i];
            agent.installSkill(s.skillId, s.precompileAddr, s.configData);
        }

        // 5. Set skills in Registry — must go through the agent (only-agent guard in Registry)
        bytes memory data = abi.encodeCall(AgentRegistry.setSkills, (id, initialSkills));
        agent.setSkillsOnRegistry(data);

        // 5. Transfer ownership to the deployer's agent contract (if caller is an agent)
        // ponytail: if msg.sender is another agent contract, set up profit split

        emit AgentCreated(id, address(agent), name);
        return (address(agent), id);
    }
}
