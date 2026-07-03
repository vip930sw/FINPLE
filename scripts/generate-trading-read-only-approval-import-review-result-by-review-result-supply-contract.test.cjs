const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result by supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-by-review-result-supply",
    script: "generate-trading-read-only-approval-import-review-result-by-review-result-supply-contract.cjs",
    contract: "trading_lab_step116_read_only_approval_import_review_result_by_review_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_bx_recording_result_review_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_bx_recording_result_review_preflight_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-by-review-result-supply-contract",
  });
});
