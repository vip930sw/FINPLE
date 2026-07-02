const path = require("node:path");
const { runContract } = require("./trading-read-only-approval-import-review-result-review-gate.cjs");

runContract({
  step: "Step 116-5Q-AJ",
  scope:
    "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result",
  readyField:
    "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  ),
  logName:
    "generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-recording-result-review-result-contract",
  pendingExternalInputs: [
    "owner_redacted_read_only_approval_import_review_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result",
  ],
  sources: [
    {
      key: "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
      ),
      readyField:
        "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    },
  ],
});
