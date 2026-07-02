const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock request preflight fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-request-preflight",
    script: "generate-trading-forbidden-item-unlock-request-preflight-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_request_preflight_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockRequestPreflight",
    previousContract: "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockSequenceMap",
    previousKey: "forbiddenItemUnlockSequenceMap",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
      "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-request-preflight-contract",
  });
});
