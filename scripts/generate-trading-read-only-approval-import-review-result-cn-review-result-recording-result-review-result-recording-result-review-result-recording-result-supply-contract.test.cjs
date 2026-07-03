const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cn recording result supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cn-recording-result-supply",
    script:
      "generate-trading-read-only-approval-import-review-result-cn-review-result-recording-result-review-result-recording-result-review-result-recording-result-supply-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cn_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cm_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cm_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cn-review-result-recording-result-review-result-recording-result-review-result-recording-result-supply-contract",
  });
});
