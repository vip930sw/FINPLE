const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review-result recording-result review-result recording-result review-result recording-result review-result recording-result review-result contract locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-review-result-review-result-recording-result-review-result-recording-result-review-result",
    script:
      "generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    ],
    stdoutPattern: "recording-result-review-result-recording-result-review-result-contract",
  });
});
