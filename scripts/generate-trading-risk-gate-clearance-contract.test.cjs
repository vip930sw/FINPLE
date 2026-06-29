const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-risk-gate-clearance-contract.cjs");
const CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const KILL_SWITCH_CLEARANCE_CONTRACT = "trading_lab_step116_kill_switch_clearance_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const RISK_ENGINE_SOURCE = path.join("server", "src", "services", "tradingRiskEngine.js");
const POLICY_SOURCE = path.join("server", "src", "services", "tradingLabPolicy.js");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-risk-gate-clearance-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    KILL_SWITCH_CLEARANCE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  for (const sourcePath of [RISK_ENGINE_SOURCE, POLICY_SOURCE]) {
    const targetPath = path.join(workspace, sourcePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
  fs.writeFileSync(path.join(workspace, "package.json"), `${JSON.stringify({ type: "module" }, null, 2)}\n`);
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

test("passes with current trading risk gate clearance contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_risk_gate_clearance_contract\.json/);
});

test("keeps risk gate clearance contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1Q");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.riskGateClearNow, false);
  assert.equal(report.readiness.readyForFutureRiskGateClearanceImplementationReview, true);
  assert.equal(report.readiness.riskGateClearanceImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("records live guarded risk clear as review-only and blocked risk as auditable", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.equal(report.fixtureEvidence.clearLiveGuardedReviewOnly.status, "live_review_required");
  assert.equal(report.fixtureEvidence.clearLiveGuardedReviewOnly.liveOrderIntentEligible, true);
  assert.equal(report.fixtureEvidence.clearLiveGuardedReviewOnly.orderSubmissionAllowed, false);
  assert.equal(report.fixtureEvidence.clearLiveGuardedReviewOnly.providerCallsAllowed, false);
  assert.equal(report.fixtureEvidence.blockedByKillSwitch.status, "blocked");
  assert.match(report.fixtureEvidence.blockedByKillSwitch.riskEvent.reasons.join("|"), /kill_switch_global_trading_disabled/);
});

test("rejects stale contract when risk gate clearance implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.riskGateClearanceImplementationAllowed = true;
  report.readiness.riskGateClearanceImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_risk_gate_clearance_contract\.json is out of date/);
});

test("blocks readiness if env risk gate contract stops failing closed", () => {
  const workspace = makeWorkspace();
  const envRisk = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRisk.readiness.providerCallsAllowed = true;
  envRisk.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRisk);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
  assert.equal(report.readiness.readyForFutureRiskGateClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
});

test("blocks readiness if kill switch clearance contract is not ready", () => {
  const workspace = makeWorkspace();
  const killSwitch = readJson(workspace, KILL_SWITCH_CLEARANCE_CONTRACT);
  killSwitch.readiness.readyForFutureKillSwitchClearanceImplementationReview = false;
  killSwitch.readiness.killSwitchRuntimeImplementationAllowed = true;
  writeJson(workspace, KILL_SWITCH_CLEARANCE_CONTRACT, killSwitch);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.killSwitchClearanceContractReady, false);
  assert.equal(report.readiness.readyForFutureRiskGateClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /kill_switch_clearance_contract_not_ready/);
});

test("blocks readiness if risk gate clearance runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "riskGateClearance.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureRiskGateClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
