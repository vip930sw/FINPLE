const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-live-guarded-private-worker-implementation-preflight-contract.cjs",
);
const CONTRACT = "trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-private-worker-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
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

test("passes with current live-guarded private worker implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /live_guarded_private_worker_implementation_preflight_contract\.json/);
});

test("opens preflight without implementing worker, importing adapter, provider calls, or orders", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, true);
  assert.equal(report.readiness.readyForPrivateWorkerImplementationAfterPreflight, false);
  assert.equal(report.currentState.ownerAdapterReviewResultRecordedNow, false);
  assert.equal(report.currentState.currentStepOpensPrivateWorkerImplementation, false);
  assert.equal(report.currentState.currentStepImplementsPrivateWorker, false);
  assert.equal(report.currentState.currentStepImportsOrderAdapter, false);
  assert.equal(report.currentState.currentStepSignsProviderRequests, false);
  assert.equal(report.currentState.currentStepCallsProvider, false);
  assert.equal(report.currentState.currentStepSubmitsOrders, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("blocks if adapter review result starts opening private worker implementation", () => {
  const workspace = makeWorkspace();
  const review = readJson(workspace, "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json");
  review.readiness.readyForLiveGuardedOrderAdapterReviewResultContract = false;
  review.readiness.readyForPrivateWorkerImplementationAfterAdapterReview = true;
  review.readiness.currentStepOpensAdapterImplementation = true;
  review.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json", review);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_review_result_contract_not_ready/);
});

test("blocks if adapter preflight starts enabling implementation review too early", () => {
  const workspace = makeWorkspace();
  const adapter = readJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json");
  adapter.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapter.readiness.orderAdapterImplementationAllowedNow = true;
  adapter.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json", adapter);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_preflight_not_closed/);
});

test("blocks if launch readiness plan starts opening routes, UI, provider calls, or orders", () => {
  const workspace = makeWorkspace();
  const plan = readJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json");
  plan.readiness.providerCallsAllowed = true;
  plan.readiness.orderSubmissionAllowed = true;
  plan.readiness.runtimeRouteAllowed = true;
  plan.readiness.publicUiAllowed = true;
  writeJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json", plan);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, false);
  assert.match(report.readiness.blockers.join("|"), /launch_readiness_plan_not_fail_closed/);
});

test("blocks if progress summary starts allowing order or live trading readiness", () => {
  const workspace = makeWorkspace();
  const progress = readJson(workspace, "trading_lab_step116_progress_summary.json");
  progress.readiness.readyForOrderSubmission = true;
  progress.readiness.readyForLiveGuardedTrading = true;
  progress.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_progress_summary.json", progress);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, false);
  assert.match(report.readiness.blockers.join("|"), /progress_summary_no_longer_fail_closed/);
});

test("blocks if private packet, worker, order adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "workers", "tradingLiveGuardedWorker.js"),
    path.join(workspace, "server", "src", "workers", "tradingPrivateWorker.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
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
  assert.equal(report.readiness.readyForLiveGuardedPrivateWorkerImplementationPreflightContract, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 8);
});
