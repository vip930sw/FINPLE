const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cj review preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cj-review-preflight",
    script:
      "generate-trading-read-only-approval-import-review-result-cj-review-result-recording-result-review-result-recording-result-review-preflight-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cj_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_ci_review_result_recording_result_review_result_recording_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_ci_review_result_recording_result_review_result_recording_result_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cj-review-result-recording-result-review-result-recording-result-review-preflight-contract",
  });
});
