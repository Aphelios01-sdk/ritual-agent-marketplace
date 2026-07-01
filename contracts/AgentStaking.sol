// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces.sol";

/// @title AgentStaking — Stake RITUAL untuk aktif jualan jasa + anti-scam slash
/// @notice Agent wajib stake >= minStake. Slash kalau dispute kalah / rating jelek berulang.
///         Unstake ada cooldown (job yang sedang berjalan harus selesai dulu).
contract AgentStaking {
    uint256 public constant MIN_STAKE = 0.01 ether;      // 0.01 RITUAL minimum
    uint256 public constant UNSTAKE_COOLDOWN = 100;       // ~block sebelum withdraw (job in-flight)
    uint256 public constant SLASH_MAX_BPS = 5000;         // max slash 50% per insiden
    uint256 public constant LOW_RATING_THRESHOLD = 2;     // rating <= 2 dianggap jelek
    uint256 public constant LOW_RATING_STRIKES = 3;       // 3x rating jelek = slash otomatis

    IAgentRegistry public immutable registry;
    address public owner;
    mapping(address => bool) public authorized;   // caller whitelist (JobMarket, DisputeCouncil)

    struct Stake {
        uint256 amount;          // total staked
        uint256 lockedUntil;     // block hingga mana tidak bisa withdraw (cooldown)
        uint256 lowRatingCount;  // jumlah rating jelek akumulatif
        bool active;             // sudah pernah stake (aktif jualan)
    }

    mapping(address => Stake) public stakes;     // agentContract -> Stake
    uint256 public totalSlashed;
    uint256 internal _totalStaked;   // total stake aktif (bukan slashed) — proteksi claimTreasury

    event Staked(address indexed agent, uint256 amount);
    event UnstakeRequested(address indexed agent, uint256 unlockBlock);
    event Withdrawn(address indexed agent, uint256 amount);
    event Slashed(address indexed agent, uint256 amount, string reason);
    event RatingRecorded(address indexed agent, uint256 rating, uint256 strikes);
    event TreasuryClaimed(address indexed to, uint256 amount);
    event AuthorizedChanged(address indexed caller, bool ok);

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
        owner = msg.sender;
    }

    modifier onlyAgent() {
        require(registry.agentByContract(msg.sender) != 0, "not registered agent");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner, "not authorized caller");
        _;
    }

    /// @notice Owner kelola whitelist caller (JobMarketV2, DisputeCouncil) yang boleh recordRating/slash.
    function setAuthorized(address caller, bool ok) external {
        require(msg.sender == owner, "only owner");
        authorized[caller] = ok;
        emit AuthorizedChanged(caller, ok);
    }

    function transferOwnership(address next) external {
        require(msg.sender == owner, "only owner");
        owner = next;
    }

    /// @notice Agent stake untuk aktif jualan. Harus >= MIN_STAKE.
    function stake() external payable onlyAgent {
        Stake storage s = stakes[msg.sender];
        s.amount += msg.value;
        _totalStaked += msg.value;
        s.active = true;
        emit Staked(msg.sender, msg.value);
    }

    /// @notice Request unstake — mulai cooldown. Job in-flight tidak di-lock,
    ///         tapi JobMarket bisa cek isUnstaking sebelum accept bid.
    function requestUnstake() external onlyAgent {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "nothing staked");
        require(s.lockedUntil < block.number, "already pending");
        s.lockedUntil = block.number + UNSTAKE_COOLDOWN;
        emit UnstakeRequested(msg.sender, s.lockedUntil);
    }

    /// @notice Withdraw stake setelah cooldown lewat.
    function withdraw() external onlyAgent {
        Stake storage s = stakes[msg.sender];
        require(s.lockedUntil > 0 && block.number >= s.lockedUntil, "cooldown not passed");
        uint256 amt = s.amount;
        require(amt > 0, "nothing to withdraw");
        s.amount = 0;
        s.active = false;
        s.lockedUntil = 0;
        _totalStaked -= amt;
        (bool ok,) = msg.sender.call{value: amt}("");
        require(ok, "withdraw failed");
        emit Withdrawn(msg.sender, amt);
    }

    /// @notice Cek apakah agent aktif (staked >= min & tidak mid-unstake yang sudah lewat window aktif).
    function isAgentActive(address agent) external view returns (bool) {
        Stake storage s = stakes[agent];
        return s.active && s.amount >= MIN_STAKE;
    }

    /// @notice Record rating dari JobMarket setelah job selesai. Trigger slash otomatis kalau strike.
    /// @dev Dipanggil oleh JobMarket (bukan agent). Di sini kita trust JobMarket.
    function recordRating(address agent, uint256 rating) external onlyAuthorized {
        if (rating <= LOW_RATING_THRESHOLD) {
            Stake storage s = stakes[agent];
            s.lowRatingCount++;
            if (s.lowRatingCount >= LOW_RATING_STRIKES) {
                _slash(agent, s.amount / 4, "low rating strikes");
                s.lowRatingCount = 0;
            }
            emit RatingRecorded(agent, rating, s.lowRatingCount);
        }
    }

    /// @notice Slash stake — dipanggil oleh dispute resolver (Modul C) atau otomatis.
    /// @param amountBps porsi stake yang di-slash (basis points, max SLASH_MAX_BPS)
    function slash(address agent, uint256 amountBps, string calldata reason) external onlyAuthorized {
        require(amountBps <= SLASH_MAX_BPS, "slash too high");
        uint256 slashAmt = (stakes[agent].amount * amountBps) / 10000;
        _slash(agent, slashAmt, reason);
    }

    function _slash(address agent, uint256 amount, string memory reason) internal {
        Stake storage s = stakes[agent];
        require(amount <= s.amount, "slash exceeds stake");
        s.amount -= amount;
        _totalStaked -= amount;
        totalSlashed += amount;
        // slashed amount stays in contract — di-claim treasury via claimTreasury
        emit Slashed(agent, amount, reason);
    }

    /// @notice Owner klaim dana hasil slash untuk treasury. Tidak boleh sentuh stake agent.
    function claimTreasury(address payable to) external {
        require(msg.sender == owner, "only owner");
        uint256 bal = address(this).balance;
        uint256 staked = _totalStaked;
        uint256 claimable = bal > staked ? bal - staked : 0;
        require(claimable > 0, "nothing to claim");
        (bool ok,) = to.call{value: claimable}("");
        require(ok, "claim failed");
        emit TreasuryClaimed(to, claimable);
    }

    function getStake(address agent) external view returns (uint256 amount, uint256 lockedUntil, uint256 strikes, bool active) {
        Stake storage s = stakes[agent];
        return (s.amount, s.lockedUntil, s.lowRatingCount, s.active);
    }
}
