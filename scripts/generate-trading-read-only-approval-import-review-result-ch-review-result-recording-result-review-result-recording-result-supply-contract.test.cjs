const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import review result ch recording result supply gate locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-ch-recording-result-supply",
    script:
      "generate-trading-read-only-approval-import-review-result-ch-review-result-recording-result-review-result-recording-result-supply-contract.cjs",
    contract:
      "trading_lab_step116_read_only_approval_import_review_result_ch_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_cg_review_result_recording_result_review_result_recording_preflight_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_cg_review_result_recording_result_review_result_recording_preflight_contract.json",
    ],
    stdoutPattern:
      "read-only-approval-import-review-result-ch-review-result-recording-result-review-result-recording-result-supply-contract",
  });
});
