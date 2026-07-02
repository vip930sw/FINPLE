const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9U",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_result",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_result_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-result-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosureResultSupplyGate",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_result_supply_gate_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureResultSupplyGate",
    },
  ],
});
