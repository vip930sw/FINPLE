const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result bs supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-bs-supply",
    script:
      "generate-trading-read-only-approval-import-review-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-bs-supply-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-bs-supply-contract",
  });
});
