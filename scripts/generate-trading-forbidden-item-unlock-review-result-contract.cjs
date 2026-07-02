const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9F",
  scope: "live_guarded_forbidden_item_unlock_review_result",
  readyField: "readyForLiveGuardedForbiddenItemUnlockReviewResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_review_result_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-review-result-contract",
  sources: [
    {
      key: "forbiddenItemUnlockReviewSupplyGate",
      path: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_review_supply_gate_contract.json"),
      readyField: "readyForLiveGuardedForbiddenItemUnlockReviewSupplyGate",
    },
  ],
});
