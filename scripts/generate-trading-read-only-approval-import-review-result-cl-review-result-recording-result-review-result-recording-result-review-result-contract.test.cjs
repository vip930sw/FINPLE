const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cl review result contract locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cl-review-result",
    script:
      "generate-trading-read-only-approval-import-review-result-cl-review-result-recording-result-review-result-recording-result-review-result-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cl_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_ck_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_ck_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cl-review-result-recording-result-review-result-recording-result-review-result-contract",
  });
});
