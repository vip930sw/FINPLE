const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock taxonomy fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-taxonomy",
    script: "generate-trading-forbidden-item-unlock-taxonomy-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomy",
    previousContract: "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomyPreflight",
    previousKey: "forbiddenItemUnlockTaxonomyPreflight",
    requiredContracts: ["trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json"],
    stdoutPattern: "forbidden-item-unlock-taxonomy-contract",
  });
});
