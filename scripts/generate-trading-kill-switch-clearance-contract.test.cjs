const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-kill-switch-clearance-contract.cjs");
const CONTRACT = "trading_lab_step116_kill_switch_clearance_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const ENV_CONFIG_SOURCE = path.join("server", "src", "services", "tradingEnvConfig.js");
const RISK_ENGINE_SOURCE = path.join("server", "src", "services", "tradingRiskEngine.js");
const POLICY_SOURCE = path.join("server", "src", "services", "tradingLabPolicy.js");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-kill-switch-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  for (const sourcePath of [ENV_CONFIG_SOURCE, RISK_ENGINE_SOURCE, POLICY_SOURCE]) {
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

test("passes with current trading kill switch clearance contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_kill_switch_clearance_contract\.json/);
});

test("keeps kill switch clearance contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1O");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.killSwitchClearNow, false);
  assert.equal(report.readiness.readyForFutureKillSwitchClearanceImplementationReview, true);
  assert.equal(report.readiness.killSwitchRuntimeImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records kill switch on as unconditional stop and clear as insufficient by itself", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.equal(report.fixtureEvidence.killSwitchOn.killSwitchEnabled, true);
  assert.match(report.fixtureEvidence.killSwitchOn.riskGate.reasons.join("|"), /kill_switch_global_trading_disabled/);
  assert.equal(report.fixtureEvidence.killSwitchOn.riskGate.orderSubmissionAllowed, false);
  assert.equal(report.fixtureEvidence.killSwitchClear.killSwitchEnabled, false);
  assert.equal(report.fixtureEvidence.killSwitchClear.riskGate.orderSubmissionAllowed, false);
  assert.equal(report.futureKillSwitchClearanceBoundary.clearanceWindow.currentStepClearsKillSwitch, false);
  assert.equal(report.futureKillSwitchClearanceBoundary.clearanceWindow.clearanceByFrontendInputAllowed, false);
});

test("rejects stale contract when kill switch runtime implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.killSwitchRuntimeImplementationAllowed = true;
  report.readiness.killSwitchRuntimeImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_kill_switch_clearance_contract\.json is out of date/);
});

test("blocks readiness if live_guarded stops requiring kill switch clearance", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  const liveGuarded = policy.modes.find((mode) => mode.mode === "live_guarded");
  liveGuarded.requiresKillSwitchClear = false;
  writeJson(workspace, POLICY, policy);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedPolicyRequiresKillSwitchClear, false);
  assert.equal(report.readiness.readyForFutureKillSwitchClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_policy_not_ready/);
});

test("blocks readiness if manual operator approval contract is not ready", () => {
  const workspace = makeWorkspace();
  const manualApproval = readJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT);
  manualApproval.readiness.readyForFutureManualApprovalImplementationReview = false;
  manualApproval.readiness.manualApprovalImplementationAllowed = true;
  writeJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT, manualApproval);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOperatorApprovalContractReady, false);
  assert.equal(report.readiness.readyForFutureKillSwitchClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /manual_operator_approval_contract_not_ready/);
});

test("blocks readiness if kill switch runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "killSwitch.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureKillSwitchClearanceImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
