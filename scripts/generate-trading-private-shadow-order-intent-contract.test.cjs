const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-shadow-order-intent-contract.cjs");
const CONTRACT = "trading_lab_step116_private_shadow_order_intent_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT =
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-order-intent-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT,
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

test("passes with current private shadow order intent contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_order_intent_contract\.json/);
});

test("keeps private shadow order intent implementation and order submission blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1Y");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateShadowOrderIntentImplementationReview, true);
  assert.equal(report.readiness.privateShadowOrderIntentImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records order intent fields, assertions, forbidden content, and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateShadowOrderIntentBoundary;

  assert.match(boundary.requiredOrderIntentFields.join("|"), /riskInputHash/);
  assert.match(boundary.requiredOrderIntentFields.join("|"), /auditEventHash/);
  assert.match(boundary.requiredOrderIntentAssertions.join("|"), /order_intent_does_not_submit_orders/);
  assert.match(boundary.requiredOrderIntentAssertions.join("|"), /scenario_monthly_rows_rejected/);
  assert.match(boundary.forbiddenOrderIntentContent.join("|"), /order_confirmation/);
  assert.match(boundary.redactionRules.join("|"), /hashes/);
});

test("rejects stale contract when private shadow order intent implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.privateShadowOrderIntentImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_shadow_order_intent_contract\.json is out of date/);
});

test("blocks readiness if snapshot risk input contract is not ready", () => {
  const workspace = makeWorkspace();
  const snapshotRiskInput = readJson(workspace, READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT);
  snapshotRiskInput.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview = false;
  snapshotRiskInput.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT, snapshotRiskInput);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlySnapshotRiskInputContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOrderIntentImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_snapshot_risk_input_contract_not_ready/);
});

test("blocks readiness if audit logger readiness is not ready", () => {
  const workspace = makeWorkspace();
  const auditLogger = readJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT);
  auditLogger.readiness.readyForFutureAuditLoggerImplementationReview = false;
  auditLogger.readiness.auditLoggerImplementationAllowed = true;
  writeJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT, auditLogger);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.auditLoggerReadinessContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOrderIntentImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /audit_logger_readiness_contract_not_ready/);
});

test("blocks readiness if private shadow order intent runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "privateShadowOrderIntent.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOrderIntentImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
