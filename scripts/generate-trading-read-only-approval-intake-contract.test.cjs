const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-approval-intake-contract.cjs");
const CONTRACT = "trading_lab_step116_read_only_approval_intake_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const ENV_READINESS_CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-intake-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    SHADOW_CONTRACT,
    ENV_READINESS_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    ORDER_CREDENTIAL_BOUNDARY_CONTRACT,
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

test("passes with current read-only approval intake contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_approval_intake_contract\.json/);
});

test("keeps read-only approval intake implementation and provider calls blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.readOnlyApprovalImportedNow, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalIntakeValidation, true);
  assert.equal(report.readiness.readOnlyApprovalIntakeImplementationAllowed, false);
  assert.equal(report.readiness.readOnlyRuntimeIntegrationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records approval fields, read scopes, forbidden actions, and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureReadOnlyApprovalIntakeBoundary.requiredApprovalFields.join("|"), /approvedBy/);
  assert.match(report.futureReadOnlyApprovalIntakeBoundary.requiredApprovalFields.join("|"), /accountIdHash/);
  assert.match(report.futureReadOnlyApprovalIntakeBoundary.allowedReadScopes.join("|"), /account_positions/);
  assert.match(report.futureReadOnlyApprovalIntakeBoundary.forbiddenActions.join("|"), /order_submission/);
  assert.match(report.futureReadOnlyApprovalIntakeBoundary.secretAndDataRules.join("|"), /full account number/);
});

test("rejects stale contract when approval import is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.readOnlyApprovalImportedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_read_only_approval_intake_contract\.json is out of date/);
});

test("blocks readiness if shadow contract no longer requires read-only approval", () => {
  const workspace = makeWorkspace();
  const shadowContract = readJson(workspace, SHADOW_CONTRACT);
  shadowContract.currentState.manualReadOnlyApprovalRecorded = true;
  shadowContract.readiness.readOnlyRuntimeIntegrationAllowed = true;
  shadowContract.readiness.providerCallsAllowed = true;
  writeJson(workspace, SHADOW_CONTRACT, shadowContract);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.shadowContractStillRequiresApproval, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalIntakeValidation, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_contract_no_longer_requires_read_only_approval/);
});

test("blocks readiness if env risk gate stops failing closed", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRiskGate.readiness.readyForProviderCalls = true;
  envRiskGate.readiness.providerCallsAllowed = true;
  envRiskGate.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalIntakeValidation, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
});

test("blocks readiness if approval-intake runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalIntake.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalIntakeValidation, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
