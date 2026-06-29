const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-manual-operator-approval-contract.cjs");
const CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-manual-approval-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
  ]) {
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

test("passes with current trading manual operator approval contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_operator_approval_contract\.json/);
});

test("keeps manual operator approval contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1N");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.manualApprovalExistsNow, false);
  assert.equal(report.readiness.readyForFutureManualApprovalImplementationReview, true);
  assert.equal(report.readiness.manualApprovalImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records single-intent approval fields and non-override assertions", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureManualApprovalBoundary.requiredApprovalFields.join("|"), /payloadHash/);
  assert.match(report.futureManualApprovalBoundary.requiredApprovalFields.join("|"), /expiresAt/);
  assert.match(report.futureManualApprovalBoundary.requiredDecisions.join("|"), /revoke/);
  assert.match(report.futureManualApprovalBoundary.requiredAssertions.join("|"), /cannot_override_kill_switch/);
  assert.match(report.futureManualApprovalBoundary.requiredAssertions.join("|"), /cannot_override_risk_gate/);
  assert.equal(report.futureManualApprovalBoundary.approvalWindow.currentStepIssuesApprovals, false);
  assert.equal(report.futureManualApprovalBoundary.approvalWindow.singleIntentOnly, true);
  assert.equal(report.futureManualApprovalBoundary.approvalWindow.reusableApprovalAllowed, false);
});

test("rejects stale contract when manual approval implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.manualApprovalImplementationAllowed = true;
  report.readiness.manualApprovalImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_manual_operator_approval_contract\.json is out of date/);
});

test("blocks readiness if live_guarded stops requiring manual approval", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  const liveGuarded = policy.modes.find((mode) => mode.mode === "live_guarded");
  liveGuarded.requiresManualApproval = false;
  writeJson(workspace, POLICY, policy);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedPolicyRequiresManualApproval, false);
  assert.equal(report.readiness.readyForFutureManualApprovalImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_policy_not_ready/);
});

test("blocks readiness if audit logger readiness contract is not ready", () => {
  const workspace = makeWorkspace();
  const auditLogger = readJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT);
  auditLogger.readiness.readyForFutureAuditLoggerImplementationReview = false;
  auditLogger.readiness.auditLoggerImplementationAllowed = true;
  writeJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT, auditLogger);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.auditLoggerReadinessContractReady, false);
  assert.equal(report.readiness.readyForFutureManualApprovalImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /audit_logger_readiness_contract_not_ready/);
});

test("blocks readiness if manual approval runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "manualApproval.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureManualApprovalImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
