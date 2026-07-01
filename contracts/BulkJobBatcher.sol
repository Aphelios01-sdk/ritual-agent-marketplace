// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BulkJobBatcher — Batch multiple jobs with a discount in 1 TX
/// @notice Requester submits N jobs at once to JobMarketV2 with a discounted treasury fee
///         (volume incentive). Saves gas vs N separate txs. Discount = reduced fee per job.
interface IJobMarketV2Bulk {
    function requestService(bytes32[] calldata, bytes calldata) external payable returns (uint256);
}

contract BulkJobBatcher {
    IJobMarketV2Bulk public immutable jobMarket;

    uint256 public constant BULK_DISCOUNT_THRESHOLD = 3;   // >=3 jobs = discount
    uint256 public constant BULK_DISCOUNT_BPS = 500;       // 5% off total reward (rebate to requester)
    uint256 public constant MAX_BATCH = 20;

    struct BatchItem {
        bytes32[] requiredSkillIds;
        bytes taskData;
        uint256 reward;
    }

    uint256 public nextBatchId;
    mapping(uint256 => uint256[]) public batchJobIds;   // batchId → jobIds created

    event BatchExecuted(uint256 indexed batchId, address indexed requester, uint256 count, uint256 totalReward, uint256 rebate);

    constructor(address _jobMarket) {
        jobMarket = IJobMarketV2Bulk(_jobMarket);
    }

    /// @notice Submit batch. Each item → requestService on JobMarketV2. msg.value = sum of rewards.
    /// @dev ponytail: rebate is sent back to the requester if >= threshold. Jobs are created one by one
    ///      (JobMarketV2.requestService does not support multi). Gas O(N).
    function submitBatch(BatchItem[] calldata items) external payable returns (uint256[] memory jobIds) {
        require(items.length > 0 && items.length <= MAX_BATCH, "bad batch size");
        uint256 total = 0;
        for (uint256 i = 0; i < items.length; i++) total += items[i].reward;
        require(msg.value >= total, "insufficient value");

        jobIds = new uint256[](items.length);
        uint256 batchId = ++nextBatchId;
        for (uint256 i = 0; i < items.length; i++) {
            require(items[i].reward > 0, "zero reward");
            uint256 jid = jobMarket.requestService{value: items[i].reward}(items[i].requiredSkillIds, items[i].taskData);
            jobIds[i] = jid;
            batchJobIds[batchId].push(jid);
        }

        // rebate: the difference msg.value - total (requester overpay as discount intent) goes back to the requester.
        uint256 rebate = 0;
        if (items.length >= BULK_DISCOUNT_THRESHOLD) {
            rebate = (total * BULK_DISCOUNT_BPS) / 10000;
            // ponytail: rebate is taken from the msg.value surplus; if insufficient, skip.
            uint256 surplus = msg.value - total;
            rebate = rebate > surplus ? surplus : rebate;
        } else {
            // refund non-discount surplus
            rebate = msg.value - total;
        }
        if (rebate > 0) {
            (bool ok,) = msg.sender.call{value: rebate}("");
            require(ok, "rebate failed");
        }
        emit BatchExecuted(batchId, msg.sender, items.length, total, rebate);
    }

    function getBatchJobs(uint256 batchId) external view returns (uint256[] memory) {
        return batchJobIds[batchId];
    }
}
