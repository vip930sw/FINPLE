const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9B",
  scope: "live_guarded_forbidden_item_unlock_taxonomy",
  readyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomy",
  contractPath: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json"),
  logName: "generate-trading-forbidden-item-unlock-taxonomy-contract",
  sources: [
    {
      key: "forbiddenItemUnlockTaxonomyPreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
      ),
      readyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomyPreflight",
    },
  ],
});
