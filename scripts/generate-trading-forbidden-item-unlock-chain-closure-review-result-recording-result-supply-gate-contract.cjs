const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9Z",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_review_result_recording_result_supply_gate",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultRecordingResultSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_supply_gate_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-review-result-recording-result-supply-gate-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureReviewResultRecordingPreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_preflight_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultRecordingPreflight",
    },
  ],
});
