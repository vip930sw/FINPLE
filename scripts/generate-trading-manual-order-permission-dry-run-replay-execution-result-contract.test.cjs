const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-dry-run-replay-execution-result-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-dry-run-replay-execution-result-"));
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

test("passes with current dry-run replay execution result contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry_run_replay_execution_result_contract\.json/);
});

test("opens result contract without executing replay, opening shadow history, or ordering", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, true);
  assert.equal(report.readiness.readyForShadowHistoryReviewAfterDryRun, false);
  assert.equal(report.currentState.ownerDryRunReplayExecutionResultRecordedNow, false);
  assert.equal(report.currentState.currentStepExecutesDryRunReplay, false);
  assert.equal(report.currentState.currentStepRecordsDryRunReplayExecutionResult, false);
  assert.equal(report.currentState.currentStepOpensShadowHistoryReview, false);
  assert.equal(report.currentState.currentStepSubmitsOrders, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("blocks if risk-gate review result boundary starts opening dry-run replay", () => {
  const workspace = makeWorkspace();
  const riskGate = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
  );
  riskGate.readiness.readyForManualOrderPermissionRiskGateClearanceReviewResultContract = false;
  riskGate.readiness.currentStepOpensDryRunReplay = true;
  riskGate.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
    riskGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_risk_gate_clearance_review_result_contract_not_ready/,
  );
});

test("blocks if dry-run replay contract starts allowing runtime implementation", () => {
  const workspace = makeWorkspace();
  const dryRun = readJson(workspace, "trading_lab_step116_dry_run_replay_contract.json");
  dryRun.readiness.dryRunReplayImplementationAllowed = true;
  dryRun.readiness.providerCallsAllowed = true;
  dryRun.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_dry_run_replay_contract.json", dryRun);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /dry_run_replay_contract_not_ready/);
});

test("blocks if shadow-history review opens before the dry-run result is separately recorded", () => {
  const workspace = makeWorkspace();
  const shadowHistory = readJson(workspace, "trading_lab_step116_shadow_history_review_contract.json");
  shadowHistory.readiness.shadowHistoryReviewImplementationAllowed = true;
  shadowHistory.readiness.providerCallsAllowed = true;
  shadowHistory.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_shadow_history_review_contract.json", shadowHistory);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_history_review_contract_not_closed/);
});

test("blocks if clearance sequence records later evidence too early", () => {
  const workspace = makeWorkspace();
  const sequence = readJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json");
  sequence.readiness.dryRunReplayExecutionResultRecorded = true;
  sequence.readiness.shadowHistoryReviewResultRecorded = true;
  sequence.readiness.liveGuardedAdapterReviewStarted = true;
  sequence.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json", sequence);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_internal_gate_sequence_no_longer_ordered/);
});

test("blocks if private packet, replay runtime, adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
    path.join(workspace, "server", "src", "services", "tradingDryRunReplayService.js"),
    path.join(workspace, "server", "src", "services", "trading", "dryRunReplay.js"),
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
  assert.equal(report.readiness.readyForManualOrderPermissionDryRunReplayExecutionResultContract, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 9);
});
