// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/interfaces.sol";
import "../contracts/AgentStaking.sol";
import "../contracts/AgentHeartbeat.sol";
import "../contracts/JobMarketV2.sol";
import "../contracts/AgentReputation.sol";
import "../contracts/AgentDirectory.sol";
import "../contracts/JobTemplates.sol";
import "../contracts/DisputeCouncil.sol";
import "../contracts/AgentSubcontractor.sol";
import "../contracts/SubscriptionManager.sol";
import "../contracts/BulkJobBatcher.sol";
import "../contracts/WebhookRegistry.sol";

/// @notice Mock registry: matches IAgentRegistry.getAgentSkills (Skill[]) for JobMarketV2 skill matching.
contract MockRegistry {
    mapping(address => uint256) public agentByContract;
    mapping(uint256 => IAgentRegistry.Skill[]) private skillsOf;
    uint256 public nextId = 1;

    function register(address agent) external returns (uint256 id) {
        id = nextId++;
        agentByContract[agent] = id;
    }

    function setSkills(uint256 id, bytes32[] calldata skillIds) external {
        delete skillsOf[id];
        for (uint256 i = 0; i < skillIds.length; i++) {
            skillsOf[id].push(
                IAgentRegistry.Skill({
                    skillId: skillIds[i],
                    name: "skill",
                    description: "mock",
                    precompileAddr: address(0x0801),
                    configData: "",
                    active: true
                })
            );
        }
    }

    function getAgentSkills(uint256 id) external view returns (IAgentRegistry.Skill[] memory) {
        return skillsOf[id];
    }

    function getAgentSkillIds(uint256 id) external view returns (bytes32[] memory ids) {
        IAgentRegistry.Skill[] storage sk = skillsOf[id];
        ids = new bytes32[](sk.length);
        for (uint256 i = 0; i < sk.length; i++) ids[i] = sk[i].skillId;
    }

    function addEarnings(uint256, uint256, uint256) external {}
}

/// @title Harness test for the logic of 18 features across Module A/B/C — local, no on-chain gas.
contract AllModulesTest is Test {
    MockRegistry reg;
    AgentStaking staking;
    AgentHeartbeat hb;
    JobMarketV2 market;
    AgentReputation rep;
    AgentDirectory dir;
    JobTemplates tmpl;
    DisputeCouncil council;
    AgentSubcontractor sub;
    SubscriptionManager subs;
    BulkJobBatcher batcher;
    WebhookRegistry hook;

    address requester = makeAddr("requester");
    address agentA = makeAddr("agentA");
    address agentB = makeAddr("agentB");
    address agentC = makeAddr("agentC");
    bytes32 constant SK1 = bytes32(uint256(1));
    bytes32 constant SK2 = bytes32(uint256(2));

    /// @dev Receive ether (test contract = JobMarketV2 treasury) so fee transfers don't revert.
    receive() external payable {}

    function setUp() public {
        reg = new MockRegistry();
        staking = new AgentStaking(address(reg));
        hb = new AgentHeartbeat(address(reg));
        market = new JobMarketV2(address(reg), address(staking), address(hb));
        rep = new AgentReputation(address(reg));
        dir = new AgentDirectory(address(reg), address(rep));
        tmpl = new JobTemplates();
        council = new DisputeCouncil(address(reg), address(staking));
        sub = new AgentSubcontractor(address(reg), address(market));
        subs = new SubscriptionManager(address(reg));
        batcher = new BulkJobBatcher(address(market));
        hook = new WebhookRegistry(address(reg));

        vm.deal(requester, 100 ether);
        vm.deal(agentA, 100 ether);
        vm.deal(agentB, 100 ether);
        vm.deal(agentC, 100 ether);

        vm.prank(agentA); reg.register(agentA);
        vm.prank(agentB); reg.register(agentB);
        vm.prank(agentC); reg.register(agentC);
        bytes32[] memory s1 = new bytes32[](1); s1[0] = SK1;
        reg.setSkills(reg.agentByContract(agentA), s1);
        reg.setSkills(reg.agentByContract(agentB), s1);
        bytes32[] memory s2 = new bytes32[](2); s2[0] = SK1; s2[1] = SK2;
        reg.setSkills(reg.agentByContract(agentC), s2);

        // stake the agent so isAgentActive=true (prerequisite for submitBid)
        vm.startPrank(agentA); staking.stake{value: 0.05 ether}(); vm.stopPrank();
        vm.startPrank(agentC); staking.stake{value: 0.05 ether}(); vm.stopPrank();
    }

    // ───────── MODULE A ─────────

    function test_A1_stakeAndSlash() public {
        (uint256 amt,,,) = staking.getStake(agentA);
        assertEq(amt, 0.05 ether);
        assertTrue(staking.isAgentActive(agentA));
        staking.slash(agentA, 2500, "timeout");   // 25% slash
        (uint256 amt2,,,) = staking.getStake(agentA);
        assertEq(amt2, 0.0375 ether);   // 0.05 - 25%
    }

    function _status(uint256 id) internal view returns (JobMarketV2.JobStatus) {
        (,,,,, JobMarketV2.JobStatus st,,,,,) = market.jobs(id);
        return st;
    }

    function test_A2_biddingFlow() public {
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        vm.prank(requester);
        uint256 jid = market.requestService{value: 0.1 ether}(req, "task");
        assertEq(jid, 1);

        vm.prank(agentA);
        market.submitBid(jid, 0.09 ether, 30);
        assertEq(market.getBids(jid).length, 1);

        vm.prank(requester);
        market.assignJob(jid, 0);
        // bond = reward/10 = 0.009
        vm.prank(agentA);
        market.startProcessing{value: 0.01 ether}(jid);
        vm.prank(agentA);
        market.submitResult(jid, "result");
        vm.prank(requester);
        market.rateProvider(jid, 5);
        assertEq(uint256(_status(jid)), uint256(JobMarketV2.JobStatus.COMPLETED));
    }

    function test_A3_timeoutAutoRefund() public {
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        vm.prank(requester);
        uint256 jid = market.requestService{value: 0.1 ether}(req, "task");
        vm.prank(agentA);
        market.submitBid(jid, 0.09 ether, 30);
        vm.prank(requester);
        market.assignJob(jid, 0);
        vm.prank(agentA);
        market.startProcessing{value: 0.01 ether}(jid);

        vm.roll(block.number + 200);   // past RESULT_TIMEOUT
        uint256 balBefore = requester.balance;
        vm.prank(requester);
        market.claimTimeout(jid);
        assertEq(uint256(_status(jid)), uint256(JobMarketV2.JobStatus.REFUNDED));
        assertGt(requester.balance, balBefore);
    }

    function test_A4_heartbeat() public {
        assertTrue(hb.isAlive(agentA));   // grace
        vm.prank(agentA); hb.ping();
        assertTrue(hb.isAlive(agentA));
        vm.roll(block.number + 1500);
        assertFalse(hb.isAlive(agentA));
        vm.prank(agentA); hb.ping();
        assertTrue(hb.isAlive(agentA));
    }

    function test_A5_rateLimit() public {
        // agentC accepts 3 jobs → the 4th reverts (MAX_CONCURRENT=3)
        for (uint256 i = 0; i < 3; i++) {
            bytes32[] memory req = new bytes32[](1); req[0] = SK1;
            vm.prank(requester);
            uint256 jid = market.requestService{value: 0.1 ether}(req, "task");
            vm.prank(agentC); market.submitBid(jid, 0.09 ether, 30);
            vm.prank(requester); market.assignJob(jid, 0);
            vm.prank(agentC); market.startProcessing{value: 0.01 ether}(jid);
        }
        assertEq(market.getActiveCount(agentC), 3);
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        vm.prank(requester);
        uint256 jid4 = market.requestService{value: 0.1 ether}(req, "task4");
        vm.prank(agentC);
        vm.expectRevert();   // rate limit exceeded
        market.submitBid(jid4, 0.09 ether, 30);
    }

    // ───────── MODULE B ─────────

    function test_B1_reputation() public {
        // test contract = Reputation owner → passes onlyAuthorized
        rep.recordReview(agentA, bytes32(uint256(1)), 5, 90, keccak256("review"));
        (uint256 score, uint256 cnt,) = rep.getReputation(agentA);
        assertEq(cnt, 1);
        assertGt(score, 5000);   // base + good rating
    }

    function test_B2_directory() public {
        bytes32[] memory tags = new bytes32[](1); tags[0] = keccak256("ai");
        vm.prank(agentA);
        dir.setProfile(keccak256("data"), tags, "ipfs://meta");
        vm.prank(agentA);
        dir.addPortfolioEntry(bytes32(uint256(1)), keccak256("out"), SK1);
    }

    function test_B3_jobTemplates() public {
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        uint256 tid = tmpl.createTemplate("tpl-name", req, "tpl-task", 0.1 ether);
        assertEq(tid, 1);
        assertEq(tmpl.getTemplatesBySkill(SK1).length, 1);
    }

    // ───────── MODULE C ─────────

    function test_C1_dispute() public {
        vm.prank(agentB);
        council.stakeAsVerifier{value: 0.06 ether}();
        uint256 did = council.raiseDispute(bytes32(uint256(1)), agentA, 0.1 ether);
        assertEq(did, 1);
        // panel vote + resolve (verdict FAVOR_PROVIDER=2). vote as agentB (staked verifier)
        vm.prank(agentB);
        council.vote(did, DisputeCouncil.Verdict.FAVOR_PROVIDER);
        vm.roll(block.number + 150);
        council.resolve(did);
    }

    function test_C2_subcontractor() public {
        // agentA creates a sub to agentB, parentReward 0.1, child 0.05, depth 1
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        vm.prank(agentA);
        sub.createSub{value: 0.05 ether}(bytes32(uint256(1)), agentB, req, "subtask", 0.05 ether, 0.1 ether, 1);
    }

    function test_C3_subscription() public {
        bytes32[] memory req = new bytes32[](1); req[0] = SK1;
        vm.prank(requester);
        bytes32 sid = subs.subscribe{value: 0.2 ether}(agentA, req, "tpl", 0.05 ether, 100, 4);
        vm.roll(block.number + 101);
        subs.execute(sid);
    }

    function test_C4_bulkBatch() public {
        BulkJobBatcher.BatchItem[] memory items = new BulkJobBatcher.BatchItem[](3);
        for (uint256 i = 0; i < 3; i++) {
            bytes32[] memory req = new bytes32[](1); req[0] = SK1;
            items[i] = BulkJobBatcher.BatchItem({requiredSkillIds: req, taskData: "t", reward: 0.1 ether});
        }
        vm.prank(requester);
        uint256[] memory ids = batcher.submitBatch{value: 0.3 ether}(items);
        assertEq(ids.length, 3);
        assertEq(market.nextJobId(), 3);
    }

    function test_C5_webhook() public {
        bytes32[] memory ev = new bytes32[](1); ev[0] = keccak256("JOB_COMPLETED");
        vm.prank(agentA);
        uint256 idx = hook.registerWebhook(makeAddr("target"), bytes4(0), ev);
        assertEq(idx, 0);
        hook.trigger(agentA, keccak256("JOB_COMPLETED"), "payload");   // owner = test, passes
    }

    /// @dev Verify new access control: non-whitelisted callers are rejected.
    function test_sec_accessControl() public {
        // agentB (not authorized/owner) cannot slash/rating/review/trigger
        vm.prank(agentB);
        vm.expectRevert();
        staking.slash(agentA, 1000, "malicious");
        vm.prank(agentB);
        vm.expectRevert();
        staking.recordRating(agentA, 1);
        vm.prank(agentB);
        vm.expectRevert();
        rep.recordReview(agentA, bytes32(uint256(1)), 5, 90, keccak256("x"));
        vm.prank(agentB);
        vm.expectRevert();
        hook.trigger(agentA, keccak256("JOB_COMPLETED"), "x");
    }
}
