const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-private-worker-boundary-review-result-review-result-recording-result-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_contract.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-boundary-review-result-recording-result-supply-gate-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  if (fs.existsSync(path.join("data", "processed", CONTRACT))) {
    fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current boundary review-result recording result contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /private_worker_boundary_review_result_review_result_recording_result_contract/,
  );
});

test("opens recording result contract without reading, recording, implementing, calls, or orders", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    true,
  );
  assert.equal(report.readiness.readyForPrivateWorkerImplementationAfterBoundaryReviewResult, false);
  assert.equal(report.currentState.kisPersonalPermissionExternalBlocker, false);
  assert.equal(
    report.currentState.ownerPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultSuppliedNow,
    false,
  );
  assert.equal(
    report.currentState.ownerPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultReadNow,
    false,
  );
  assert.equal(
    report.currentState.privateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordedNow,
    false,
  );
  assert.equal(report.currentState.currentStepRecordsPrivatePath, false);
  assert.equal(report.currentState.currentStepRecordsRawValues, false);
  assert.equal(report.currentState.currentStepOpensPrivateWorkerImplementation, false);
  assert.equal(report.currentState.currentStepImplementsPrivateWorker, false);
  assert.equal(report.currentState.currentStepStartsWorkerRuntime, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if recording result supply gate no longer passes", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(
    workspace,
    "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_supply_gate_contract.json",
  );
  supplyGate.readiness.readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResultSupplyGate =
    false;
  supplyGate.readiness.ownerPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultSuppliedNow = true;
  supplyGate.readiness.privateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_supply_gate_contract.json",
    supplyGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_result_supply_gate_not_ready/,
  );
});

test("blocks if recording preflight no longer passes", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_preflight_contract.json",
  );
  preflight.readiness.readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingPreflight =
    false;
  preflight.readiness.ownerPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultAcceptedNow = true;
  preflight.readiness.privateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_preflight_contract.json",
    preflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_preflight_not_ready/,
  );
});

test("blocks if review result contract no longer passes", () => {
  const workspace = makeWorkspace();
  const reviewResult = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_contract.json",
  );
  reviewResult.readiness.readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResult =
    false;
  reviewResult.readiness.currentStepOpensPrivateWorkerImplementation = true;
  reviewResult.readiness.providerCallsAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_contract.json",
    reviewResult,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_contract_not_ready/,
  );
});

test("blocks if review result supply gate no longer passes", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_supply_gate_contract.json",
  );
  supplyGate.readiness.readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultSupplyGate =
    false;
  supplyGate.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_supply_gate_contract.json",
    supplyGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_supply_gate_not_ready/,
  );
});

test("blocks if launch readiness or progress summary opens runtime flags", () => {
  const workspace = makeWorkspace();
  const launch = readJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json");
  launch.readiness.providerCallsAllowed = true;
  launch.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json", launch);
  const progress = readJson(workspace, "trading_lab_step116_progress_summary.json");
  progress.readiness.readyForLiveGuardedTrading = true;
  progress.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_progress_summary.json", progress);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(report.readiness.blockers.join("|"), /launch_readiness_plan_not_fail_closed/);
  assert.match(report.readiness.blockers.join("|"), /progress_summary_no_longer_fail_closed/);
});

test("blocks if current boundary review allows worker implementation", () => {
  const workspace = makeWorkspace();
  const boundaryReview = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_contract.json",
  );
  boundaryReview.readiness.currentStepOpensPrivateWorkerImplementation = true;
  boundaryReview.readiness.currentStepStartsWorkerRuntime = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_contract.json",
    boundaryReview,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(report.readiness.blockers.join("|"), /live_guarded_private_worker_implementation_boundary_review_not_ready/);
});

test("blocks if architecture doc does not mention recording result contract", () => {
  const workspace = makeWorkspace();
  const docTarget = path.join(workspace, DOC_PATH);
  fs.writeFileSync(docTarget, "missing the new boundary section\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /architecture_doc_missing_private_worker_boundary_review_result_review_result_recording_result/,
  );
});

test("blocks if private review result, worker, adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const forbidden = [
    path.join("data", "private", "trading", "live_guarded_private_worker_boundary_review_result_recording_result_review_result.redacted.json"),
    path.join("server", "src", "workers", "tradingPrivateWorker.js"),
    path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join("server", "src", "routes", "trading"),
    path.join("src", "pages", "TradingLab.jsx"),
    path.join("migrations", "trading"),
    path.join("data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of forbidden) {
    const target = path.join(workspace, filePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, filePath.endsWith(".csv") ? "month,ticker,total_return\n" : "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness
      .readyForLiveGuardedPrivateWorkerImplementationBoundaryReviewResultRecordingResultReviewResultRecordingResult,
    false,
  );
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, forbidden.length);
});
