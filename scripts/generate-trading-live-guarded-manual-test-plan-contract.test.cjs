const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-live-guarded-manual-test-plan-contract.cjs");
const CONTRACT = "trading_lab_step116_live_guarded_manual_test_plan_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_paper_shadow_operational_test_plan_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_order_credential_boundary_contract.json",
  "trading_lab_step116_manual_operator_approval_contract.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-manual-test-plan-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
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

test("passes with current live-guarded manual test plan", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_live_guarded_manual_test_plan_contract\.json/);
});

test("records manual test planning while keeping execution and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedManualTestPlan, true);
  assert.equal(report.liveGuardedManualTestPlan.mayPlanManualTestNow, true);
  assert.equal(report.liveGuardedManualTestPlan.mayExecuteManualTestNow, false);
  assert.equal(report.liveGuardedManualTestPlan.futureManualTestEnvelope.maximumIntentCount, 1);
  assert.match(report.liveGuardedManualTestPlan.requiredTestPlanItems.join("|"), /tiny_notional_cap/);
  assert.match(
    report.liveGuardedManualTestPlan.requiredAssertions.join("|"),
    /manual_test_success_cannot_enable_automated_trading/,
  );
  assert.equal(report.readiness.manualTestExecutionAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale contract when manual test execution is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.manualTestExecutionAllowedNow = true;
  report.readiness.manualTestExecutionAllowedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_live_guarded_manual_test_plan_contract\.json is out of date/);
});

test("blocks if paper shadow operational testing starts executing too early", () => {
  const workspace = makeWorkspace();
  const paperPlan = readJson(workspace, "trading_lab_step116_paper_shadow_operational_test_plan_contract.json");
  paperPlan.readiness.operationalTestExecutionAllowedNow = true;
  paperPlan.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_paper_shadow_operational_test_plan_contract.json", paperPlan);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedManualTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /paper_shadow_operational_test_plan_not_ready/);
});

test("blocks if live-guarded order adapter preflight unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const adapterPreflight = readJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  );
  adapterPreflight.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapterPreflight.readiness.orderAdapterImplementationAllowedNow = true;
  adapterPreflight.readiness.orderSubmissionAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
    adapterPreflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedManualTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_preflight_not_blocked/);
});

test("blocks if live trading runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedManualTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
