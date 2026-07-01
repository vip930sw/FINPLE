const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-live-guarded-order-adapter-review-result-contract.cjs",
);
const CONTRACT = "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-adapter-review-result-"));
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

test("passes with current live-guarded adapter review result contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /live_guarded_order_adapter_review_result_contract\.json/);
});

test("opens review result contract without implementing adapter, provider calls, or orders", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, true);
  assert.equal(report.readiness.readyForPrivateWorkerImplementationAfterAdapterReview, false);
  assert.equal(report.currentState.ownerLiveGuardedAdapterReviewResultRecordedNow, false);
  assert.equal(report.currentState.currentStepRecordsAdapterReviewResult, false);
  assert.equal(report.currentState.currentStepOpensAdapterImplementation, false);
  assert.equal(report.currentState.currentStepImplementsAdapter, false);
  assert.equal(report.currentState.currentStepSubmitsOrders, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("blocks if shadow-history review result boundary starts opening adapter review", () => {
  const workspace = makeWorkspace();
  const shadowHistory = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
  );
  shadowHistory.readiness.readyForManualOrderPermissionShadowHistoryReviewResultContract = false;
  shadowHistory.readiness.currentStepOpensLiveGuardedAdapterReview = true;
  shadowHistory.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
    shadowHistory,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_shadow_history_review_result_contract_not_ready/,
  );
});

test("blocks if live-guarded adapter preflight opens implementation review too early", () => {
  const workspace = makeWorkspace();
  const adapter = readJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json");
  adapter.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapter.readiness.orderAdapterImplementationAllowedNow = true;
  adapter.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json", adapter);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_preflight_not_closed/);
});

test("blocks if live-guarded clearance bundle starts enabling provider calls or orders", () => {
  const workspace = makeWorkspace();
  const bundle = readJson(workspace, "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json");
  bundle.readiness.readyForFutureLiveGuardedClearanceReviewResultBundle = false;
  bundle.readiness.providerCallsAllowed = true;
  bundle.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json", bundle);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_clearance_bundle_not_ready/);
});

test("blocks if clearance sequence records adapter review or order readiness too early", () => {
  const workspace = makeWorkspace();
  const sequence = readJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json");
  sequence.readiness.liveGuardedAdapterReviewStarted = true;
  sequence.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json", sequence);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_internal_gate_sequence_no_longer_ordered/);
});

test("blocks if private packet, order adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "services", "kisTradingService.js"),
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
  assert.equal(report.readiness.readyForLiveGuardedOrderAdapterReviewResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 8);
});
