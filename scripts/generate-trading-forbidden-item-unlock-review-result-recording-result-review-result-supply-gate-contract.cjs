const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9K",
  scope: "live_guarded_forbidden_item_unlock_review_result_recording_result_review_result_supply_gate",
  readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewResultSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_supply_gate_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-review-result-recording-result-review-result-supply-gate-contract",
  sources: [
    {
      key: "forbiddenItemUnlockReviewResultRecordingResultReviewPreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_preflight_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewPreflight",
    },
  ],
});
