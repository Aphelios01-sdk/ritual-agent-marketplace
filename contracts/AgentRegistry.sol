// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AgentRegistry — Agent directory + skill registry for the agent-to-agent marketplace
/// @notice Agents are registered via the factory. Skills are defined per-agent.
contract AgentRegistry {
    struct Skill {
        bytes32 skillId;        // keccak(name, precompileAddr)
        string name;            // "fetch-token-price", "sentiment-analysis"
        string description;
        address precompileAddr; // 0x0801 (HTTP) or 0x0802 (LLM)
        bytes configData;       // {url, headers, promptTemplate, model}
        bool active;
    }

    struct AgentInfo {
        uint256 id;
        string name;
        string description;
        address agentContract;
        uint256 bondAmount;
        uint256 totalEarnings;
        uint256 avgRating;      // scaled * 100
        uint256 jobCount;
        bool active;
    }

    uint256 public nextAgentId;
    address public owner;
    mapping(address => bool) public authorized; // callers allowed to mutate earnings (e.g. JobMarketV2)
    mapping(uint256 => AgentInfo) public agents;
    mapping(address => uint256) public agentByContract;
    mapping(uint256 => Skill[]) public agentSkills; // agentId -> skills

    event AgentRegistered(uint256 indexed id, string name, address indexed agentContract);
    event AgentUpdated(uint256 indexed id);
    event AgentDeactivated(uint256 indexed id);
    event SkillUpdated(uint256 indexed agentId, bytes32 indexed skillId, bool active);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Owner authorizes a caller (e.g. JobMarketV2) to record earnings/ratings.
    function setAuthorized(address who, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[who] = ok;
    }

    function registerAgent(
        string calldata name,
        string calldata description,
        address agentContract
    ) external returns (uint256) {
        require(agentByContract[agentContract] == 0, "already registered");
        require(bytes(name).length > 0, "name required");

        uint256 id = ++nextAgentId;
        agents[id] = AgentInfo({
            id: id,
            name: name,
            description: description,
            agentContract: agentContract,
            bondAmount: 0,
            totalEarnings: 0,
            avgRating: 0,
            jobCount: 0,
            active: true
        });
        agentByContract[agentContract] = id;

        emit AgentRegistered(id, name, agentContract);
        return id;
    }

    function updateAgent(uint256 id, string calldata name, string calldata description, bool active) external {
        require(msg.sender == agents[id].agentContract, "only agent");
        AgentInfo storage a = agents[id];
        a.name = name;
        a.description = description;
        a.active = active;
        emit AgentUpdated(id);
        if (!active) emit AgentDeactivated(id);
    }

    function setSkills(uint256 agentId, Skill[] calldata newSkills) external {
        require(msg.sender == agents[agentId].agentContract, "only agent");
        delete agentSkills[agentId];
        for (uint256 i = 0; i < newSkills.length; i++) {
            agentSkills[agentId].push(newSkills[i]);
            emit SkillUpdated(agentId, newSkills[i].skillId, newSkills[i].active);
        }
    }

    function getAgentSkills(uint256 agentId) external view returns (Skill[] memory) {
        return agentSkills[agentId];
    }

    /// @notice Returns only the skillIds (bytes32) for an agent — used for cheap on-chain skill matching.
    /// @dev Dedicated ID getter so callers (e.g. JobMarketV2) don't have to decode the full Skill struct.
    function getAgentSkillIds(uint256 agentId) external view returns (bytes32[] memory) {
        Skill[] storage s = agentSkills[agentId];
        bytes32[] memory ids = new bytes32[](s.length);
        for (uint256 i = 0; i < s.length; i++) {
            ids[i] = s[i].skillId;
        }
        return ids;
    }

    function addEarnings(uint256 id, uint256 amount, uint256 rating) external {
        require(authorized[msg.sender], "not authorized");
        if (rating > 5) rating = 5; // clamp — audit H2
        AgentInfo storage a = agents[id];
        a.totalEarnings += amount;
        a.jobCount++;
        if (rating > 0) {
            a.avgRating = (a.avgRating * (a.jobCount - 1) + rating * 100) / a.jobCount;
        }
    }

    /// @notice Agent updates its own description (permanent on-chain fix for Indonesian descriptions).
    function setDescription(uint256 id, string calldata description) external {
        require(msg.sender == agents[id].agentContract, "only agent");
        agents[id].description = description;
        emit AgentUpdated(id);
    }

    function setBond(uint256 id, uint256 amount) external {
        require(msg.sender == agents[id].agentContract, "only agent");
        agents[id].bondAmount = amount;
    }

    function getAgent(uint256 id) external view returns (AgentInfo memory) {
        return agents[id];
    }

    function getActiveAgents() external view returns (AgentInfo[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= nextAgentId; i++) {
            if (agents[i].active) count++;
        }
        AgentInfo[] memory result = new AgentInfo[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= nextAgentId; i++) {
            if (agents[i].active) result[idx++] = agents[i];
        }
        return result;
    }
}
