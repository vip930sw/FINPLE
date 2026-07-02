const path = require("node:path");
const { runContract } = require("./trading-private-worker-boundary-review-result-review-gate.cjs");

runContract({
  step: "Step 116-8F",
  scope:
    "live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_result_review_result_supply_gate",
  readyField:
    "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_supply_gate_contract.json",
  ),
  logName:
    "generate-trading-private-worker-boundary-review-result-review-result-recording-result-review-result-supply-gate-contract",
  sources: [
    {
      key: "liveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewPreflight",
      path: path.join(
        "data",
        "processed",
        "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_preflight_contract.json",
      ),
      readyField:
        "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    },
  ],
});
