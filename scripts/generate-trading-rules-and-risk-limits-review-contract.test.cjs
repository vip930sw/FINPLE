const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-rules-and-risk-limits-review-contract.cjs");
const CONTRACT = "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_manual_operator_approval_contract.json",
  CONTRACT,
];
const SOURCE_FILES = [
  path.join("server", "src", "services", "tradingRiskEngine.js"),
  path.join("server", "src", "services", "tradingLabPolicy.js"),
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-rules-review-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  for (const fileName of SOURCE_FILES) {
    const target = path.join(workspace, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(fileName, target);
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

test("passes with current trading rules and risk limits review contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_trading_rules_and_risk_limits_review_contract\.json/);
});

test("records conservative rules review while keeping runtime application blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureTradingRulesReview, true);
  assert.equal(report.tradingRulesAndRiskLimitsReview.mayPlanRulesNow, true);
  assert.equal(report.tradingRulesAndRiskLimitsReview.mayApplyRuntimeRulesNow, false);
  assert.equal(report.tradingRulesAndRiskLimitsReview.conservativeDefaultsForFutureReview.allowedSymbols.length, 0);
  assert.match(report.tradingRulesAndRiskLimitsReview.requiredRuleReviewItems.join("|"), /max_single_order_notional/);
  assert.match(report.tradingRulesAndRiskLimitsReview.requiredAssertions.join("|"), /wildcard_symbols_cannot_promote_to_live_guarded/);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale contract when runtime rule application is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.rulesRuntimeImplementationAllowed = true;
  report.readiness.rulesRuntimeImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_trading_rules_and_risk_limits_review_contract\.json is out of date/);
});

test("blocks if env risk gate stops warning about wildcard symbols", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, "trading_lab_step116_env_risk_gate_contract.json");
  envRiskGate.parserResult.warnings = envRiskGate.parserResult.warnings.filter(
    (warning) => warning !== "wildcard_allowed_symbols_must_be_narrowed_before_live_guarded",
  );
  writeJson(workspace, "trading_lab_step116_env_risk_gate_contract.json", envRiskGate);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureTradingRulesReview, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_not_fail_closed/);
});

test("blocks if the launch plan stops listing trading rules review", () => {
  const workspace = makeWorkspace();
  const launchPlan = readJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json");
  launchPlan.launchReadinessPlan.phases = launchPlan.launchReadinessPlan.phases.filter(
    (phase) => phase.id !== "trading_rules_and_risk_limits_review",
  );
  writeJson(workspace, "trading_lab_step116_launch_readiness_plan_contract.json", launchPlan);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureTradingRulesReview, false);
  assert.match(report.readiness.blockers.join("|"), /launch_plan_missing_rules_review/);
});

test("blocks if trading rules runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureTradingRulesReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
