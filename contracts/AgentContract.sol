// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AgentContract — Sovereign agent template for the agent-to-agent marketplace
/// @notice Fully autonomous agent with RitualWallet + skill execution engine
/// @dev Can act as requester (hire other agents) and provider (be hired by other agents)
contract AgentContract {
    enum AgentStep { IDLE, FETCHING, ANALYZING, DONE }

    address public registry;
    address public jobMarket;
    address public owner;
    uint256 public agentId;

    // current job processing state
    AgentStep public step;
    uint256 public currentJobId;
    bytes public fetchResult;

    // skill configs (stored on-chain for execution)
    struct SkillConfig {
        bytes32 skillId;
        address precompileAddr;  // 0x0801 or 0x0802
        bytes configData;        // encoded {url, headers, promptTemplate, model}
    }
    SkillConfig[] public skillConfigs;

    modifier onlyJobMarket() {
        require(msg.sender == jobMarket, "only jobMarket");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address _registry, address _jobMarket) {
        registry = _registry;
        jobMarket = _jobMarket;
        owner = msg.sender; // the factory / deployer controls initial skill setup
    }

    /// @notice Called by factory after deployment: set agentId from registry
    function setAgentId(uint256 _agentId) external {
        require(agentId == 0, "already set");
        agentId = _agentId;
    }

    /// @notice Agent A request service from other agents
    function requestService(
        bytes32[] calldata requiredSkillIds,
        bytes calldata taskData
    ) external payable returns (uint256) {
        // payable value = reward
        (bool ok, bytes memory data) = jobMarket.call{value: msg.value}(
            abi.encodeWithSignature("requestService(bytes32[],bytes)", requiredSkillIds, taskData)
        );
        require(ok, "request failed");
        return abi.decode(data, (uint256));
    }

    /// @notice Agent B accept a job — post bond
    function acceptJob(uint256 jobId, uint256 bondAmount) external payable {
        (bool ok,) = jobMarket.call{value: bondAmount}(
            abi.encodeWithSignature("acceptJob(uint256)", jobId)
        );
        require(ok, "accept failed");
    }

    /// @notice Agent B start processing accepted job
    function startProcessing(uint256 jobId) external {
        (bool ok,) = jobMarket.call(
            abi.encodeWithSignature("startProcessing(uint256)", jobId)
        );
        require(ok, "start failed");

        currentJobId = jobId;
        step = AgentStep.FETCHING;
        _executeStep();
    }

    /// @notice Execute current step — pairable with scheduler for resumption
    function executeStep() external {
        _executeStep();
    }

    function _executeStep() internal {
        if (step == AgentStep.FETCHING) {
            // HTTP precompile (0x0801)
            // ponytail: configData format depends on Ritual Chain precompile spec
            (bool ok, bytes memory result) = address(0x0801).staticcall(
                abi.encode(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
                    new bytes[](0),
                    "GET",
                    new bytes(0),
                    new bytes[](0),
                    uint256(50)
                )
            );
            if (ok) {
                fetchResult = result;
                step = AgentStep.ANALYZING;
                _executeStep();
            }
        } else if (step == AgentStep.ANALYZING) {
            // LLM precompile (0x0802)
            string memory prompt = string.concat("Analyze this data: ", string(fetchResult));
            (bool ok, bytes memory completion) = address(0x0802).staticcall(
                abi.encode(prompt, "zai-org/GLM-4.7-FP8", uint256(0), uint256(0))
            );
            if (ok) {
                step = AgentStep.DONE;
                (bool ok2,) = jobMarket.call(
                    abi.encodeWithSignature("submitResult(uint256,bytes)", currentJobId, completion)
                );
                ok2;
            }
        }
    }

    /// @notice Install a skill config (only owner — audit H3).
    function installSkill(bytes32 skillId, address precompileAddr, bytes calldata configData) external onlyOwner {
        skillConfigs.push(SkillConfig(skillId, precompileAddr, configData));
    }

    /// @notice Forward skill registration to Registry (msg.sender to Registry = this agent)
    /// @dev Called by owner (factory) during setup. Registry has an only-agent guard. (audit H1)
    function setSkillsOnRegistry(bytes calldata registryCallData) external onlyOwner {
        (bool ok,) = registry.call(registryCallData);
        require(ok, "registry call failed");
    }

    /// @notice Get available jobs from marketplace (filtered by our skills)
    function getAvailableJobs() external view returns (bytes memory) {
        // ponytail: call jobMarket.getAvailableJobs() with our skill IDs
        // This is just a proxy — real implementation needs full skill array
        return "";
    }

    // allow receiving ETH (from job market or wallet)
    receive() external payable {}
}
