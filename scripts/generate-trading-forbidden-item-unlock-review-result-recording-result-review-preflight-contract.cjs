const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9J",
  scope: "live_guarded_forbidden_item_unlock_review_result_recording_result_review_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewPreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-review-result-recording-result-review-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockReviewResultRecordingResult",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResult",
    },
  ],
});
