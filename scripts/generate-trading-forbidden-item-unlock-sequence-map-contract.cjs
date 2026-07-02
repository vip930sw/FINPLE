const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9C",
  scope: "live_guarded_forbidden_item_unlock_sequence_map",
  readyField: "readyForLiveGuardedForbiddenItemUnlockSequenceMap",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-sequence-map-contract",
  sources: [
    {
      key: "forbiddenItemUnlockTaxonomy",
      path: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json"),
      readyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomy",
    },
  ],
});
