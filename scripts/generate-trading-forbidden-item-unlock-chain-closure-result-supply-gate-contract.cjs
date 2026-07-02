const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9T",
  scope: "live_guarded_forbidden_item_unlock_chain_closure_result_supply_gate",
  readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureResultSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_chain_closure_result_supply_gate_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-chain-closure-result-supply-gate-contract",
  sources: [
    {
      key: "forbiddenItemUnlockChainClosurePreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosurePreflight",
    },
  ],
});
