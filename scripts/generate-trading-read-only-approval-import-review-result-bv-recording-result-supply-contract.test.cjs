const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result bv recording result supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-bv-recording-result-supply",
    script: "generate-trading-read-only-approval-import-review-result-bv-recording-result-supply-contract.cjs",
    contract: "trading_lab_step116_read_only_approval_import_review_result_bv_recording_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_bu_recording_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_bu_recording_preflight_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-bv-recording-result-supply-contract",
  });
});
