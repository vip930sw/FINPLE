const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cd review preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cd-review-preflight",
    script:
      "generate-trading-read-only-approval-import-review-result-cd-review-result-recording-result-review-preflight-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cd_review_result_recording_result_review_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cc_review_result_recording_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cc_review_result_recording_result_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cd-review-result-recording-result-review-preflight-contract",
  });
});
