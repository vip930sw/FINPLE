const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock chain closure recording-result review preflight fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-chain-closure-recording-result-review-preflight",
    script: "generate-trading-forbidden-item-unlock-chain-closure-recording-result-review-preflight-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_preflight_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureRecordingResultReviewPreflight",
    previousContract:
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_contract.json",
    previousReadyField: "readyForLiveGuardedForbiddenItemUnlockChainClosureReviewResultRecordingResult",
    previousKey: "forbiddenItemUnlockChainClosureReviewResultRecordingResult",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-chain-closure-recording-result-review-preflight-contract",
  });
});
