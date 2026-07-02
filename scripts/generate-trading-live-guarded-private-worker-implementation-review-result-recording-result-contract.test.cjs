const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-live-guarded-private-worker-implementation-review-result-recording-result-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-worker-review-recording-result-"));
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

test("passes with current private worker implementation review result recording result contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /private_worker_implementation_review_result_recording_result_contract\.json/);
});

test("opens recording result contract without reading, recording, implementing, calls, or orders", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(
    report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract,
    true,
  );
  assert.equal(report.readiness.readyForPrivateWorkerImplementationAfterReviewResult, false);
  assert.equal(report.currentState.kisPersonalPermissionExternalBlocker, false);
  assert.equal(report.currentState.ownerPrivateWorkerImplementationReviewResultRecordingResultSuppliedNow, false);
  assert.equal(report.currentState.ownerPrivateWorkerImplementationReviewResultRecordingResultReadNow, false);
  assert.equal(report.currentState.privateWorkerImplementationReviewResultRecordedNow, false);
  assert.equal(report.currentState.currentStepRecordsPrivatePath, false);
  assert.equal(report.currentState.currentStepRecordsRawValues, false);
  assert.equal(report.currentState.currentStepOpensPrivateWorkerImplementation, false);
  assert.equal(report.currentState.currentStepImplementsPrivateWorker, false);
  assert.equal(report.currentState.currentStepImplementsOrderAdapter, false);
  assert.equal(report.currentState.currentStepSignsProviderRequests, false);
  assert.equal(report.currentState.currentStepCallsProvider, false);
  assert.equal(report.currentState.currentStepSubmitsOrders, false);
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
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_supply_gate_contract.json",
  );
  supplyGate.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultSupplyGate = false;
  supplyGate.readiness.ownerPrivateWorkerImplementationReviewResultRecordingResultSuppliedNow = true;
  supplyGate.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_supply_gate_contract.json",
    supplyGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_review_result_recording_result_supply_gate_not_ready/,
  );
});

test("blocks if recording preflight starts recording result", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_preflight_contract.json",
  );
  preflight.readiness.ownerPrivateWorkerImplementationReviewResultReadNow = true;
  preflight.readiness.privateWorkerImplementationReviewResultRecordedNow = true;
  preflight.readiness.currentStepRecordsPrivatePath = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_preflight_contract.json",
    preflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_review_result_recording_preflight_not_ready/,
  );
});

test("blocks if worker review result supply gate starts accepting result", () => {
  const workspace = makeWorkspace();
  const supply = readJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_supply_gate_contract.json",
  );
  supply.readiness.ownerPrivateWorkerImplementationReviewResultSuppliedNow = true;
  supply.readiness.ownerPrivateWorkerImplementationReviewResultReadNow = true;
  supply.readiness.privateWorkerImplementationReviewResultRecordedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_private_worker_implementation_review_result_supply_gate_contract.json",
    supply,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /live_guarded_private_worker_implementation_review_result_supply_gate_not_ready/,
  );
});

test("blocks if launch readiness or progress summary opens runtime/provider/order flags", () => {
  const workspace = makeWorkspace();
  const plan = readJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json");
  plan.readiness.providerCallsAllowed = true;
  plan.readiness.orderSubmissionAllowed = true;
  plan.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json", plan);
  const progress = readJson(workspace, "trading_lab_step116_progress_summary.json");
  progress.readiness.readyForOrderSubmission = true;
  progress.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_progress_summary.json", progress);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /launch_readiness_plan_not_fail_closed/);
  assert.match(report.readiness.blockers.join("|"), /progress_summary_no_longer_fail_closed/);
});

test("blocks if private recording result, worker, adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "live_guarded_private_worker_review_result_recording_result.redacted.json"),
    path.join(workspace, "server", "src", "workers", "tradingPrivateWorker.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "services", "tradingLiveGuardedOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationReviewResultRecordingResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 8);
});
