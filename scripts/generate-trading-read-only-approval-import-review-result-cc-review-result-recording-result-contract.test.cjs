const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cc recording result contract locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cc-recording-result",
    script:
      "generate-trading-read-only-approval-import-review-result-cc-review-result-recording-result-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cc_review_result_recording_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cb_review_result_recording_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cb_review_result_recording_result_supply_gate_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-cc-review-result-recording-result-contract",
  });
});
