const test = require("node:test");
const { exerciseGate } = require("./trading-read-only-approval-import-review-result-review-gate.test-helper.cjs");

test("keeps read-only approval import recording result review result bw recording result contract locked", () => {
  exerciseGate({
    tmpPrefix: "finple-read-only-approval-bw-recording-result",
    script: "generate-trading-read-only-approval-import-review-result-bw-recording-result-contract.cjs",
    contract: "trading_lab_step116_read_only_approval_import_review_result_bw_recording_result_contract.json",
    readyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousContract:
      "trading_lab_step116_read_only_approval_import_review_result_bv_recording_result_supply_gate_contract.json",
    previousReadyField:
      "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousKey:
      "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_read_only_approval_import_review_result_bv_recording_result_supply_gate_contract.json",
    ],
    stdoutPattern: "read-only-approval-import-review-result-bw-recording-result-contract",
  });
});
