const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9S",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosurePreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockReviewResultRecordingResultReviewResult",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_contract.json",
      ),
      readyField:
        "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    },
  ],
});
