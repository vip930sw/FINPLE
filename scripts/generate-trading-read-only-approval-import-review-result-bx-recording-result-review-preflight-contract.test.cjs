const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result bx review preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-bx-review-preflight",
    script: "generate-trading-read-only-approval-import-review-result-bx-recording-result-review-preflight-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_bx_recording_result_review_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousContract: "trading_lab_step116_read_only_approval_import_review_result_bw_recording_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_bw_recording_result_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-bx-recording-result-review-preflight-contract",
  });
});
