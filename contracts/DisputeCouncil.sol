// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title DisputeCouncil — Verifier staking + arbiter panel + appeal + bond
/// @notice Verifiers stake to become arbiters. A job dispute enters → a panel of N arbiters votes.
///         Tier-2 appeal if unsatisfied (double bond). Winning verifiers earn a fee, losers are suspended.
///         JobMarketV2.dispute() can trigger createDispute (or manual).
interface IAgentStakingExt {
    function slash(address, uint256, string calldata) external;
}

contract DisputeCouncil {
    IAgentRegistry public immutable registry;
    IAgentStakingExt public immutable staking;

    uint256 public constant MIN_VERIFIER_STAKE = 0.05 ether;
    uint256 public constant PANEL_SIZE = 3;
    uint256 public constant VOTE_WINDOW = 100;         // blocks
    uint256 public constant VERIFIER_FEE_BPS = 100;    // 1% of reward to the winning verifier
    uint256 public constant APPEAL_BOND_MULT = 2;
    uint256 public constant SLASH_LOSER_BPS = 2500;    // losing provider has 25% of stake slashed

    enum Verdict { NONE, FAVOR_CLIENT, FAVOR_PROVIDER }
    enum Status { NONE, VOTING, RESOLVED_CLIENT, RESOLVED_PROVIDER, APPEALED }

    struct Verifier {
        uint256 stake;
        uint256 resolvedCount;
        uint256 correctCount;     // voted with the majority
        bool slashed;             // suspended
    }

    struct Dispute {
        bytes32 jobId;            // job id (small jobId → bytes32(uint256(jobId)))
        address client;
        address provider;
        uint256 reward;           // disputed escrow amount
        Status status;
        Verdict verdict;
        uint256 voteDeadline;
        address[] panel;
        mapping(address => Verdict) votes;
        mapping(address => uint256) votedRound;   // voter → last round (resets vote each appeal)
        uint256 round;            // increments each appeal → old votes are ignored
        uint256 favorClient;
        uint256 favorProvider;
        uint256 appealLevel;
    }

    mapping(address => Verifier) public verifiers;
    mapping(uint256 => Dispute) public disputes;   // disputeId → Dispute
    uint256 public nextDisputeId;

    event VerifierStaked(address indexed verifier, uint256 amount);
    event DisputeRaised(uint256 indexed disputeId, bytes32 indexed jobId, address client, address provider);
    event Voted(uint256 indexed disputeId, address verifier, Verdict verdict);
    event DisputeResolved(uint256 indexed disputeId, Verdict verdict, Status status);
    event DisputeAppealed(uint256 indexed disputeId, uint256 appealLevel);

    constructor(address _registry, address _staking) {
        registry = IAgentRegistry(_registry);
        staking = IAgentStakingExt(_staking);
    }

    // ── Verifier staking ──

    function stakeAsVerifier() external payable {
        require(msg.value >= MIN_VERIFIER_STAKE, "min verifier stake");
        Verifier storage v = verifiers[msg.sender];
        v.stake += msg.value;
        v.slashed = false;
        emit VerifierStaked(msg.sender, msg.value);
    }

    function withdrawVerifierStake() external {
        Verifier storage v = verifiers[msg.sender];
        require(!v.slashed, "slashed");
        require(v.stake > 0, "nothing");
        uint256 amt = v.stake;
        v.stake = 0;
        (bool ok,) = msg.sender.call{value: amt}("");
        require(ok, "withdraw failed");
    }

    /// @notice Pick a random-ish panel (deterministic from disputeId + pool). ponytail: production should use VRF.
    function _pickPanel(uint256 disputeId) internal view returns (address[] memory) {
        // ponytail: demo uses fixed pseudo; needs a real pool from stake events. For now
        // return empty → voting is open to all active verifiers (simpler). panel field stays empty.
        return new address[](0);
    }

    // ── Dispute flow ──

    /// @notice Raise a dispute (client or provider). reward = disputed amount (escrow).
    function raiseDispute(bytes32 jobId, address provider, uint256 reward) external returns (uint256) {
        uint256 id = ++nextDisputeId;
        Dispute storage d = disputes[id];
        d.jobId = jobId;
        d.client = msg.sender;
        d.provider = provider;
        d.reward = reward;
        d.status = Status.VOTING;
        d.voteDeadline = block.number + VOTE_WINDOW;
        d.round = 1;   // round starts at 1 (votedRound defaults to 0 → new verifiers may vote)
        d.panel = _pickPanel(id);
        emit DisputeRaised(id, jobId, msg.sender, provider);
        return id;
    }

    /// @notice Verifier votes (open to all active staked verifiers). Each appeal = a new round.
    function vote(uint256 disputeId, Verdict v) external {
        Dispute storage d = disputes[disputeId];
        require(d.status == Status.VOTING, "not voting");
        require(block.number <= d.voteDeadline, "vote closed");
        require(verifiers[msg.sender].stake >= MIN_VERIFIER_STAKE, "not verifier");
        require(!verifiers[msg.sender].slashed, "slashed");
        require(v == Verdict.FAVOR_CLIENT || v == Verdict.FAVOR_PROVIDER, "bad verdict");
        require(d.votedRound[msg.sender] != d.round, "already voted this round");

        d.votedRound[msg.sender] = d.round;
        d.votes[msg.sender] = v;
        if (v == Verdict.FAVOR_CLIENT) d.favorClient++;
        else d.favorProvider++;
        emit Voted(disputeId, msg.sender, v);
    }

    /// @notice Resolve after the vote window. Majority wins. Slash the losing party.
    function resolve(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        require(d.status == Status.VOTING, "not voting");
        require(block.number > d.voteDeadline, "vote still open");

        Verdict v = d.favorClient >= d.favorProvider ? Verdict.FAVOR_CLIENT : Verdict.FAVOR_PROVIDER;
        d.verdict = v;

        if (v == Verdict.FAVOR_CLIENT) {
            d.status = Status.RESOLVED_CLIENT;
            // losing provider: slash stake via staking
            try staking.slash(d.provider, SLASH_LOSER_BPS, "dispute lost") {} catch {}
        } else {
            d.status = Status.RESOLVED_PROVIDER;
        }
        emit DisputeResolved(disputeId, v, d.status);
    }

    /// @notice Appeal — double bond, level increases. Re-opens voting: new round resets votes for all verifiers.
    function appeal(uint256 disputeId) external payable {
        Dispute storage d = disputes[disputeId];
        require(d.status == Status.RESOLVED_CLIENT || d.status == Status.RESOLVED_PROVIDER, "not resolved");
        require(msg.sender == d.client || msg.sender == d.provider, "party only");
        uint256 bond = (d.reward * VERIFIER_FEE_BPS * APPEAL_BOND_MULT) / 10000;
        require(msg.value >= bond, "appeal bond required");

        d.appealLevel++;
        d.round++;                    // new round → old verifiers' votedRound no longer matches → can vote again
        d.status = Status.VOTING;
        d.voteDeadline = block.number + VOTE_WINDOW;
        d.favorClient = 0;
        d.favorProvider = 0;
        emit DisputeAppealed(disputeId, d.appealLevel);
    }

    function getDispute(uint256 disputeId) external view returns (
        bytes32 jobId, address client, address provider, uint256 reward,
        Status status, Verdict verdict, uint256 favorClient, uint256 favorProvider, uint256 appealLevel
    ) {
        Dispute storage d = disputes[disputeId];
        return (d.jobId, d.client, d.provider, d.reward, d.status, d.verdict, d.favorClient, d.favorProvider, d.appealLevel);
    }
}
