const test = require("node:test");
const { exerciseGate } = require("./trading-private-worker-boundary-review-result-review-gate.test-helper.cjs");

test("keeps private worker boundary review-result recording-result review-result recording-result review preflight locked", () => {
  exerciseGate({
    tmpPrefix: "finple-boundary-review-result-recording-result-review-result-recording-result-review-preflight",
    script:
      "generate-trading-private-worker-boundary-review-result-review-result-recording-result-review-result-recording-result-review-preflight-contract.cjs",
    contract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    readyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewPreflight",
    previousContract:
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_contract.json",
    previousReadyField:
      "readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    previousKey:
      "liveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultReviewResultRecordingResult",
    requiredContracts: [
      "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_contract.json",
    ],
    stdoutPattern: "recording-result-review-preflight-contract",
  });
});
