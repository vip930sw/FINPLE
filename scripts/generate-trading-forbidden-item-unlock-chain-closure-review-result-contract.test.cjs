const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock chain closure review result fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-chain-closure-review-result",
    script: "generate-trading-forbidden-item-unlock-chain-closure-review-result-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResult",
    previousContract: "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_supply_gate_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultSupplyGate",
    previousKey: "forbiddenItemUnlockChainClosureReviewResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_supply_gate_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-chain-closure-review-result-contract",
  });
});
