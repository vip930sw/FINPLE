const path = require("node:path");
const { runContract } = require("./trading-private-worker-boundary-review-result-review-gate.cjs");

runContract({
  step: "Step 116-8J",
  scope:
    "live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_result_review_result_recording_result",
  readyField:
    "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_contract.json",
  ),
  logName:
    "generate-trading-private-worker-boundary-review-result-review-result-recording-result-review-result-recording-result-contract",
  sources: [
    {
      key: "liveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
      ),
      readyField:
        "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    },
  ],
});
