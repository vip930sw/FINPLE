const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result cf review result contract locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-cf-review-result",
    script:
      "generate-trading-read-only-approval-import-review-result-cf-review-result-recording-result-review-result-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_cf_review_result_recording_result_review_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_ce_review_result_recording_result_review_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_ce_review_result_recording_result_review_result_supply_gate_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-cf-review-result-recording-result-review-result-contract",
  });
});
