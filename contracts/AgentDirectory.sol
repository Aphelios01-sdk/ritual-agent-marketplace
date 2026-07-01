// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentDirectory — Category tags + portfolio (output hash) + leaderboard
/// @notice Agent set category & tags sendiri (off-chain index oleh frontend). Portfolio = list output hash
///         per job (bukti kerja on-chain). Leaderboard query by category, urut skor reputasi decay.
contract AgentDirectory {
    IAgentRegistry public immutable registry;
    IAgentReputation public immutable reputation;

    struct Profile {
        bytes32 category;       // keccak256("defi"|"sentiment"|...) — 1 kategori utama
        bytes32[] tags;         // multi-tag
        string metadataURI;     // IPFS/HTTP metadata off-chain (avatar, bio, dll)
        bool set;
    }

    struct PortfolioEntry {
        bytes32 jobId;
        bytes32 outputHash;     // hash hasil kerja (off-chain content)
        bytes32 skillId;        // skill yg dipakai
        uint256 block;
    }

    mapping(address => Profile) public profiles;
    mapping(address => PortfolioEntry[]) public portfolio;
    mapping(bytes32 => address[]) private _byCategory;   // categoryHash -> agents

    event ProfileUpdated(address indexed agent, bytes32 category, bytes32[] tags, string metadataURI);
    event PortfolioAdded(address indexed agent, bytes32 indexed jobId, bytes32 outputHash, bytes32 skillId);

    constructor(address _registry, address _reputation) {
        registry = IAgentRegistry(_registry);
        reputation = IAgentReputation(_reputation);
    }

    modifier onlyAgent() {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        _;
    }

    /// @notice Agent set/update profile. Category change update index.
    function setProfile(bytes32 category, bytes32[] calldata tags, string calldata metadataURI) external onlyAgent {
        Profile storage p = profiles[msg.sender];
        if (p.set && p.category != category) {
            _removeFromCategory(msg.sender, p.category);
        }
        if (!p.set || p.category != category) {
            _byCategory[category].push(msg.sender);
        }
        p.category = category;
        p.tags = tags;
        p.metadataURI = metadataURI;
        p.set = true;
        emit ProfileUpdated(msg.sender, category, tags, metadataURI);
    }

    /// @notice Tambah portfolio entry (bisa dipanggil agent sendiri atau JobMarket via hook).
    function addPortfolioEntry(bytes32 jobId, bytes32 outputHash, bytes32 skillId) external onlyAgent {
        portfolio[msg.sender].push(PortfolioEntry({
            jobId: jobId,
            outputHash: outputHash,
            skillId: skillId,
            block: block.number
        }));
        emit PortfolioAdded(msg.sender, jobId, outputHash, skillId);
    }

    function getProfile(address agent) external view returns (Profile memory) {
        return profiles[agent];
    }

    function getPortfolio(address agent) external view returns (PortfolioEntry[] memory) {
        return portfolio[agent];
    }

    function getAgentsByCategory(bytes32 category) external view returns (address[] memory) {
        return _byCategory[category];
    }

    /// @notice Leaderboard kategori: top N agent urut skor reputasi decay (bubble, N kecil).
    /// @dev ponytail: O(m*log m) naive; aman untuk demo (agent per kategori kecil). Produksi pakai off-chain indexer.
    function getLeaderboard(bytes32 category, uint256 limit) external view returns (address[] memory addrs, uint256[] memory scores) {
        address[] memory members = _byCategory[category];
        uint256 n = members.length;
        uint256[] memory sc = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            (sc[i],,) = reputation.getReputation(members[i]);
            if (sc[i] == 0) sc[i] = 5000;
        }
        // simple selection sort ambil top `limit`
        uint256 outN = n < limit ? n : limit;
        addrs = new address[](outN);
        scores = new uint256[](outN);
        for (uint256 k = 0; k < outN; k++) {
            uint256 best = k;
            for (uint256 j = k + 1; j < n; j++) {
                if (sc[j] > sc[best]) best = j;
            }
            // swap
            (members[k], members[best]) = (members[best], members[k]);
            (sc[k], sc[best]) = (sc[best], sc[k]);
            addrs[k] = members[k];
            scores[k] = sc[k];
        }
    }

    function _removeFromCategory(address agent, bytes32 category) internal {
        address[] storage arr = _byCategory[category];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == agent) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                return;
            }
        }
    }
}
