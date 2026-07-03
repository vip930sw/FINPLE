const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cb recording result supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cb-recording-result-supply",
    script:
      "generate-trading-read-only-approval-import-review-result-cb-review-result-recording-result-supply-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cb_review_result_recording_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_ca_review_result_recording_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_ca_review_result_recording_preflight_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-cb-review-result-recording-result-supply-contract",
  });
});
