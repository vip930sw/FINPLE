const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock taxonomy preflight fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-taxonomy-preflight",
    script: "generate-trading-forbidden-item-unlock-taxonomy-preflight-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomyPreflight",
    requiredContracts: [],
    stdoutPattern: "forbidden-item-unlock-taxonomy-preflight-contract",
  });
});
