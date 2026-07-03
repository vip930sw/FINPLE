const path = require("node:path");
const { runContract } = require("./trading-read-only-approval-import-review-result-review-gate.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_cg_review_result_recording_result_review_result_recording_preflight_contract.json",
);
const PREVIOUS_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_cf_review_result_recording_result_review_result_contract.json",
);

runContract({
  contractPath: CONTRACT_PATH,
  step: "Step 116-5Q-CG",
  scope:
    "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_preflight",
  logName: "read-only-approval-import-review-result-cg-review-result-recording-result-review-result-recording-preflight-contract",
  readyField:
    "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingPreflight",
  sources: [
    {
      key:
        "readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
      path: PREVIOUS_REVIEW_RESULT_PATH,
      readyField:
        "readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    },
  ],
  pendingExternalInputs: [
    "owner_redacted_read_only_approval_import_review_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result",
  ],
});
