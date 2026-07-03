const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result ce review result supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-ce-review-result-supply",
    script:
      "generate-trading-read-only-approval-import-review-result-ce-review-result-recording-result-review-result-supply-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_ce_review_result_recording_result_review_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cd_review_result_recording_result_review_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cd_review_result_recording_result_review_preflight_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-ce-review-result-recording-result-review-result-supply-contract",
  });
});
