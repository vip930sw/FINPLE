const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review-result recording-result review result recording result review result recording result review result recording result contract locked", () => {
  exerciseGate({
    tmpPrefix:
      "finple-read-only-approval-review-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result",
    script:
      "generate-trading-read-only-approval-import-review-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-contract",
  });
});
