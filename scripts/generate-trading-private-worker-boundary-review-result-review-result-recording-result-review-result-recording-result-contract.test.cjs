const test = require("node:test");
const { exerciseGate } = require("./trading-private-worker-boundary-review-result-review-gate.test-helper.cjs");

test("keeps private worker boundary review-result recording-result review-result recording result locked", () => {
  exerciseGate({
    tmpPrefix: "finple-boundary-review-result-recording-result-review-result-recording-result",
    script:
      "generate-trading-private-worker-boundary-review-result-review-result-recording-result-review-result-recording-result-contract.cjs",
    contract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_contract.json",
    readyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousContract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    previousReadyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    previousKey:
      "liveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_contract.json",
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_preflight_contract.json",
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
    ],
    stdoutPattern: "recording-result-review-result-recording-result-contract",
  });
});
