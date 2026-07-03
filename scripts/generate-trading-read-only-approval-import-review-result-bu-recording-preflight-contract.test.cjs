const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result bu recording preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-bu-recording-preflight",
    script: "generate-trading-read-only-approval-import-review-result-bu-recording-preflight-contract.cjs",
    contract: "trading_lab_step116_read_only_approval_import_review_result_bu_recording_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-bu-recording-preflight-contract",
  });
});
