const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-audit-logger-readiness-contract.cjs");
const CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-audit-logger-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    STORE_SCHEMA,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
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

test("passes with current trading audit logger readiness contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_audit_logger_readiness_contract\.json/);
});

test("keeps audit logger readiness contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1M");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.auditLoggerExistsNow, false);
  assert.equal(report.readiness.readyForFutureAuditLoggerImplementationReview, true);
  assert.equal(report.readiness.auditLoggerImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records required audit event fields and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureAuditLoggerBoundary.requiredEventTypes.join("|"), /trading_risk_gate/);
  assert.match(report.futureAuditLoggerBoundary.requiredEventTypes.join("|"), /manual_operator_approval/);
  assert.match(report.futureAuditLoggerBoundary.requiredEventFields.join("|"), /payloadHash/);
  assert.match(report.futureAuditLoggerBoundary.requiredEventFields.join("|"), /riskGateStatus/);
  assert.match(report.futureAuditLoggerBoundary.redactionRules.join("|"), /never_log_access_tokens/);
  assert.match(report.futureAuditLoggerBoundary.redactionRules.join("|"), /never_log_full_account_numbers/);
  assert.equal(report.futureAuditLoggerBoundary.storageBoundary.currentStepWritesDatabase, false);
  assert.equal(report.futureAuditLoggerBoundary.storageBoundary.rawProviderPayloadStorageAllowed, false);
});

test("rejects stale contract when audit logger implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.auditLoggerImplementationAllowed = true;
  report.readiness.auditLoggerImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_audit_logger_readiness_contract\.json is out of date/);
});

test("blocks readiness if shadow history review contract is not ready", () => {
  const workspace = makeWorkspace();
  const shadowHistory = readJson(workspace, SHADOW_HISTORY_REVIEW_CONTRACT);
  shadowHistory.readiness.readyForFutureShadowHistoryReviewImplementation = false;
  shadowHistory.readiness.shadowHistoryReviewImplementationAllowed = true;
  writeJson(workspace, SHADOW_HISTORY_REVIEW_CONTRACT, shadowHistory);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.shadowHistoryReviewContractReady, false);
  assert.equal(report.readiness.readyForFutureAuditLoggerImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_history_review_contract_not_ready/);
});

test("blocks readiness if audit logger runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "auditLogger.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureAuditLoggerImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
