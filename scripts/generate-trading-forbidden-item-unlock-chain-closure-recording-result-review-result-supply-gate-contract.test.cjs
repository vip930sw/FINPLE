const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock chain closure recording-result review result supply gate fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-chain-closure-recording-result-review-result-supply",
    script:
      "generate-trading-forbidden-item-unlock-chain-closure-recording-result-review-result-supply-gate-contract.cjs",
    contract:
      "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_supply_gate_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewResultSupplyGate",
    previousContract:
      "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_preflight_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewPreflight",
    previousKey: "forbiddenItemUnlockChainClosureRecordingResultReviewPreflight",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_preflight_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-chain-closure-recording-result-review-result-supply-gate-contract",
  });
});
