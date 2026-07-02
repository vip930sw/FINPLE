const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9X",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_review_result",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-review-result-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureReviewResultSupplyGate",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_supply_gate_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultSupplyGate",
    },
  ],
});
