const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9E",
  scope: "live_guarded_forbidden_item_unlock_review_supply_gate",
  readyField: "readyForLiveGuardedForbiddenItemUnlockReviewSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_review_supply_gate_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-review-supply-gate-contract",
  sources: [
    {
      key: "forbiddenItemUnlockRequestPreflight",
      path: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_request_preflight_contract.json"),
      readyField: "readyForLiveGuardedForbiddenItemUnlockRequestPreflight",
    },
  ],
});
