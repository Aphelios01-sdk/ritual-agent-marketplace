// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentReputation — Decay-based reputation + confidence score + review text
/// @notice EMA reputation score with time decay (long unreviewed → score decays toward the mean).
///         Confidence score = how confident the provider is in the result (0-100, off-chain derived, on-chain record).
///         Review text is stored as a hash (content hash) for auditing.
///         Called by JobMarketV2.submitResult (confidence) + rateProvider (rating+review).
contract AgentReputation {
    uint256 public constant BASE_SCORE = 5000;       // initial score 50.00 (scale 0-10000)
    uint256 public constant DECAY_PER_BLOCK = 1;     // linear decay toward BASE
    uint256 public constant EMA_WEIGHT = 7000;       // new rating weight 70% (basis 10000)
    uint256 public constant MAX_CONFIDENCE = 100;

    IAgentRegistry public immutable registry;
    address public owner;
    mapping(address => bool) public authorized;   // whitelist caller (JobMarketV2)

    struct Rep {
        uint256 score;          // 0-10000 (display = /100, 2 decimals)
        uint256 reviewCount;
        uint256 lastUpdate;     // last rating block number
    }

    struct Review {
        bytes32 jobId;          // job identity (review per-job)
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

    /// @notice Owner manages the caller whitelist (JobMarketV2) allowed to record.
    function setAuthorized(address caller, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[caller] = ok;
    }

    function transferOwnership(address next) external {
        require(msg.sender == owner, "only owner");
        owner = next;
    }

    /// @notice Provider submits a confidence score for a job result (before/at submitResult).
    /// @dev Called by JobMarketV2 (msg.sender = market). Only whitelisted callers.
    function recordConfidence(address agent, bytes32 jobId, uint8 confidence) external onlyAuthorized {
        if (confidence > MAX_CONFIDENCE) confidence = uint8(MAX_CONFIDENCE);
        Rep storage r = reps[agent];
        if (r.lastUpdate == 0) { r.score = BASE_SCORE; r.lastUpdate = block.number; }
        emit ConfidenceRecorded(agent, jobId, confidence);
    }

    /// @notice Client gives a rating + review (hash). Updates the EMA score + applies decay.
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

        // Apply decay: score moves toward BASE_SCORE as blocks pass without a review.
        uint256 elapsed = block.number - r.lastUpdate;
        if (r.score > BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            r.score = r.score > BASE_SCORE + decay ? r.score - decay : BASE_SCORE;
        } else if (r.score < BASE_SCORE) {
            uint256 decay = elapsed * DECAY_PER_BLOCK;
            r.score = r.score + decay < BASE_SCORE ? r.score + decay : BASE_SCORE;
        }

        // EMA update: new score = (old * 30%) + (ratingScaled * 70%)
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

    /// @notice Score decayed to the current time (for real-time leaderboards).
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
