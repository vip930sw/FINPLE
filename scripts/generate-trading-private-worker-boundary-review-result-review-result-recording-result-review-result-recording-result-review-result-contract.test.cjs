const test = require("node:test");
const { exerciseGate } = require("./trading-private-worker-boundary-review-result-review-gate.test-helper.cjs");

test("keeps private worker boundary review-result recording-result review-result recording-result review result locked", () => {
  exerciseGate({
    tmpPrefix: "finple-boundary-review-result-recording-result-review-result-recording-result-review-result",
    script:
      "generate-trading-private-worker-boundary-review-result-review-result-recording-result-review-result-recording-result-review-result-contract.cjs",
    contract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
    readyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResult",
    previousContract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    previousReadyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    previousKey:
      "liveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate",
    requiredContracts: [
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
    ],
    stdoutPattern: "recording-result-review-result-contract",
  });
});
