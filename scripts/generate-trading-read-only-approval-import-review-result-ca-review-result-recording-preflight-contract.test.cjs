const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result ca recording preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-ca-recording-preflight",
    script: "generate-trading-read-only-approval-import-review-result-ca-review-result-recording-preflight-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_ca_review_result_recording_preflight_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousContract: "trading_lab_step116_read_only_approval_import_review_result_bz_review_result_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    requiredContracts: ["trading_lab_step116_read_only_approval_import_review_result_bz_review_result_contract.json"],
    stdoutPattern: "read-only-approval-import-review-result-ca-review-result-recording-preflight-contract",
  });
});
