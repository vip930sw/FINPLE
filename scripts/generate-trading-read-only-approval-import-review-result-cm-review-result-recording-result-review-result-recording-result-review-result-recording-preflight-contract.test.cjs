const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cm recording preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cm-recording-preflight",
    script:
      "generate-trading-read-only-approval-import-review-result-cm-review-result-recording-result-review-result-recording-result-review-result-recording-preflight-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cm_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cl_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cl_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cm-review-result-recording-result-review-result-recording-result-review-result-recording-preflight-contract",
  });
});
