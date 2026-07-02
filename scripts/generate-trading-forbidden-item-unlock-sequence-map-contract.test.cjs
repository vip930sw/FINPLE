const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock sequence map fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-sequence-map",
    script: "generate-trading-forbidden-item-unlock-sequence-map-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockSequenceMap",
    previousContract: "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockTaxonomy",
    previousKey: "forbiddenItemUnlockTaxonomy",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-sequence-map-contract",
  });
});
