const path = require("node:path");
const { runContract } = require("./trading-read-only-approval-import-review-result-review-gate.cjs");

runContract({
  step: "Step 116-5Q-Z",
  scope:
    "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate",
  readyField:
    "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  ),
  logName:
    "generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-recording-result-supply-gate-contract",
  pendingExternalInputs: [
    "owner_redacted_read_only_approval_import_review_recording_result_review_result_recording_result_review_result_recording_result",
  ],
  sources: [
    {
      key: "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
      ),
      readyField:
        "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
    },
  ],
});
