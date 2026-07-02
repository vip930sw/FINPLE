const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock chain closure result supply gate fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-chain-closure-result-supply-gate",
    script: "generate-trading-forbidden-item-unlock-chain-closure-result-supply-gate-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_chain_closure_result_supply_gate_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureResultSupplyGate",
    previousContract: "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockChainClosurePreflight",
    previousKey: "forbiddenItemUnlockChainClosurePreflight",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-chain-closure-result-supply-gate-contract",
  });
});
