const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock chain closure preflight fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix: "finple-forbidden-item-unlock-chain-closure-preflight",
    script: "generate-trading-forbidden-item-unlock-chain-closure-preflight-contract.cjs",
    contract: "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
    readyField: "readyForLiveGuardedForbiddenItemUnlockChainClosurePreflight",
    previousContract:
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    previousReadyField:
      "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousKey: "forbiddenItemUnlockReviewResultRecordingResultReviewResult",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    ],
    stdoutPattern: "forbidden-item-unlock-chain-closure-preflight-contract",
  });
});
