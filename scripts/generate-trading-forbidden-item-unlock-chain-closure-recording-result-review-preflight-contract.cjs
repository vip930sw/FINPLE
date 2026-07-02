const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9AB",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_recording_result_review_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewPreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-recording-result-review-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureReviewResultRecordingResult",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultRecordingResult",
    },
  ],
});
