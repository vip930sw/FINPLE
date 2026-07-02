const test = require("node:test");
const { exerciseTaxonomy } = require("./trading-forbidden-item-unlock-taxonomy-gate.test-helper.cjs");

test("keeps forbidden item unlock review-result recording-result review-result recording-result review-result supply gate fail-closed", () => {
  exerciseTaxonomy({
    tmpPrefix:
      "finple-forbidden-item-unlock-review-result-recording-result-review-result-recording-result-review-result-supply-gate",
    script:
      "generate-trading-forbidden-item-unlock-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract.cjs",
    contract:
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    readyField:
      "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousContract:
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    previousReadyField:
      "readyForLiveGuardedForbiddenItemUnlockReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousKey: "forbiddenItemUnlockReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    requiredContracts: [
      "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
      "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
      "trading_lab_step116_forbidden_item_unlock_request_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_preflight_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_contract.json",
      "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    ],
    stdoutPattern:
      "forbidden-item-unlock-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract",
  });
});
