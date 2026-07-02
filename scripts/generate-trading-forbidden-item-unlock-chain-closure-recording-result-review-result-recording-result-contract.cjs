const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9AG",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_result",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewResultRecordingResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_result_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-recording-result-review-result-recording-result-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureRecordingResultReviewResultRecordingResultSupplyGate",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_result_supply_gate_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewResultRecordingResultSupplyGate",
    },
  ],
});
