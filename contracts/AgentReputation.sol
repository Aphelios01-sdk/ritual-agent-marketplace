// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentReputation — Decay-based reputation + confidence score + review text
/// @notice Skor reputasi EMA dengan decay waktu (lama gak direview → skor turun ke mean).
///         Confidence score = seberapa yakin provider thd hasil (0-100, off-chain derived, on-chain record).
///         Review text disimpan hash-nya (content hash) untuk audit.
///         Dipanggil oleh JobMarketV2.submitResult (confidence) + rateProvider (rating+review).
contract AgentReputation {
    uint256 public constant BASE_SCORE = 5000;       // skor awal 50.00 (scale 0-10000)
    uint256 public constant DECAY_PER_BLOCK = 1;     // decay linear ke BASE
    uint256 public constant EMA_WEIGHT = 7000;       // bobot rating baru 70% (basis 10000)
    uint256 public constant MAX_CONFIDENCE = 100;

    IAgentRegistry public immutable registry;
    address public owner;
    mapping(address => bool) public authorized;   // whitelist caller (JobMarketV2)

    struct Rep {
        uint256 score;          // 0-10000 (display = /100, 2 desimal)
        uint256 reviewCount;
        uint256 lastUpdate;     // block number rating terakhir
    }

    struct Review {
        bytes32 jobId;          // identitas job (review per-job)
        address client;
        uint256 rating;         // 1-5
        uint8 confidence;       // 0-100
        bytes32 contentHash;    // hash review text (off-chain)
        uint256 block;
    }

    mapping(address => Rep) public reps;
    mapping(address => Review[]) public reviews;     // agent -> reviews

    event ConfidenceRecorded(address indexed agent, bytes32 indexed jobId, uint8 confidence);
    event Reviewed(address indexed agent, bytes32 indexed jobId, address indexed client, uint256 rating, bytes32 contentHash, uint256 newScore);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
        owner = msg.sender;
    }

    modifier onlyRegistryAgent(address agent) {
        require(registry.agentByContract(agent) != 0, "not registered agent");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "not authorized caller");
        _;
    }

    /// @notice Owner kelola whitelist caller (JobMarketV2) yang boleh record.
    function setAuthorized(address caller, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[caller] = ok;
    }

    function transferOwnership(address next) external {
        require(msg.sender == owner, "only owner");
        owner = next;
    }

    /// @notice Provider submit confidence score untuk hasil job (sebelum/di saat submitResult).
    /// @dev Dipanggil JobMarketV2 (msg.sender = market). Hanya caller ter-whitelist.
    function recordConfidence(address agent, bytes32 jobId, uint8 confidence) external onlyAuthorized {
        if (confidence > MAX_CONFIDENCE) confidence = uint8(MAX_CONFIDENCE);
        Rep storage r = reps[agent];
        if (r.lastUpdate == 0) { r.score = BASE_SCORE; r.lastUpdate = block.number; }
        emit ConfidenceRecorded(agent, jobId, confidence);
    }

    /// @notice Client kasih rating + review (hash). Update skor EMA + apply decay.
    function recordReview(
        address agent,
        bytes32 jobId,
        uint256 rating,
        uint8 confidence,
        bytes32 contentHash
    ) external onlyAuthorized {
        require(rating >= 1 && rating <= 5, "rating 1-5");
        Rep storage r = reps[agent];
        if (r.lastUpdate == 0) { r.score = BASE_SCORE; r.lastUpdate = block.number; }

        // Apply decay: skor bergerak ke BASE_SCORE seiring block berlalu tanpa review.
        uint256 elapsed = block.number - r.lastUpdate;
        if (r.score > BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            r.score = r.score > BASE_SCORE + decay ? r.score - decay : BASE_SCORE;
        } else if (r.score < BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            r.score = r.score + decay < BASE_SCORE ? r.score + decay : BASE_SCORE;
        }

        // EMA update: skor baru = (old * 30%) + (ratingScaled * 70%)
        uint256 ratingScaled = (rating * 10000) / 5;   // 1-5 → 2000-10000
        r.score = (r.score * (10000 - EMA_WEIGHT) + ratingScaled * EMA_WEIGHT) / 10000;
        r.reviewCount++;
        r.lastUpdate = block.number;

        reviews[agent].push(Review({
            jobId: jobId,
            client: msg.sender,
            rating: rating,
            confidence: confidence,
            contentHash: contentHash,
            block: block.number
        }));

        emit Reviewed(agent, jobId, msg.sender, rating, contentHash, r.score);
    }

    function getReputation(address agent) external view returns (uint256 score, uint256 reviewCount, uint256 lastUpdate) {
        Rep storage r = reps[agent];
        return (r.score == 0 ? BASE_SCORE : r.score, r.reviewCount, r.lastUpdate);
    }

    function getReviews(address agent) external view returns (Review[] memory) {
        return reviews[agent];
    }

    /// @notice Skor yang sudah di-decay ke waktu sekarang (untuk leaderboard real-time).
    function getDecayedScore(address agent) external view returns (uint256) {
        Rep storage r = reps[agent];
        if (r.lastUpdate == 0) return BASE_SCORE;
        uint256 score = r.score;
        uint256 elapsed = block.number - r.lastUpdate;
        if (score > BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            return score > BASE_SCORE + decay ? score - decay : BASE_SCORE;
        } else if (score < BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            return score + decay < BASE_SCORE ? score + decay : BASE_SCORE;
        }
        return BASE_SCORE;
    }
}
