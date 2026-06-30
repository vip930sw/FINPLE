const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-paper-shadow-operational-test-plan-contract.cjs");
const CONTRACT = "trading_lab_step116_paper_shadow_operational_test_plan_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-paper-shadow-operational-test-plan-"));
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

test("passes with current paper shadow operational test plan", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_paper_shadow_operational_test_plan_contract\.json/);
});

test("records paper shadow test planning while keeping execution blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePaperShadowOperationalTestPlan, true);
  assert.equal(report.paperShadowOperationalTestPlan.mayPlanOperationalTestNow, true);
  assert.equal(report.paperShadowOperationalTestPlan.mayExecuteOperationalTestNow, false);
  assert.equal(report.paperShadowOperationalTestPlan.plannedTestWindows.minimumPaperReplayIntents, 20);
  assert.match(report.paperShadowOperationalTestPlan.requiredTestPlanItems.join("|"), /risk_gate_recompute_for_each_intent/);
  assert.match(report.paperShadowOperationalTestPlan.requiredAssertions.join("|"), /test_plan_does_not_submit_orders/);
  assert.equal(report.readiness.operationalTestExecutionAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale contract when operational test execution is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.operationalTestExecutionAllowedNow = true;
  report.readiness.operationalTestExecutionAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_paper_shadow_operational_test_plan_contract\.json is out of date/);
});

test("blocks if trading rules review becomes runtime-enabled", () => {
  const workspace = makeWorkspace();
  const rulesReview = readJson(workspace, "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json");
  rulesReview.readiness.rulesRuntimeImplementationAllowed = true;
  rulesReview.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json", rulesReview);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePaperShadowOperationalTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /trading_rules_review_not_ready/);
});

test("blocks if private shadow runtime preflight unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const runtimePreflight = readJson(workspace, "trading_lab_step116_private_shadow_runtime_implementation_preflight.json");
  runtimePreflight.readiness.readyForFuturePrivateShadowRuntimeImplementationReview = true;
  runtimePreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_private_shadow_runtime_implementation_preflight.json", runtimePreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePaperShadowOperationalTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_not_blocked/);
});

test("blocks if operational runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePaperShadowOperationalTestPlan, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
