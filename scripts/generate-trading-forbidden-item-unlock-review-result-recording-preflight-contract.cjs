const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9G",
  scope: "live_guarded_forbidden_item_unlock_review_result_recording_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingPreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_review_result_recording_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-review-result-recording-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockReviewResult",
      path: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_review_result_contract.json"),
      readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResult",
    },
  ],
});
