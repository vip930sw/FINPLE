const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9V",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_review_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewPreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_review_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-review-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureResult",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_result_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureResult",
    },
  ],
});
