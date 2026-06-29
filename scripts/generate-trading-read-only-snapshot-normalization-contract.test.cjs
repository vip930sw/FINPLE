const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-snapshot-normalization-contract.cjs");
const CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT =
  "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-snapshot-normalization-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    SHADOW_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT,
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

test("passes with current read-only snapshot normalization contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_snapshot_normalization_contract\.json/);
});

test("keeps snapshot normalization implementation and provider calls blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview, true);
  assert.equal(report.readiness.snapshotNormalizationImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records snapshot types, fields, forbidden content, and assertions", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlySnapshotNormalizationBoundary;

  assert.match(boundary.requiredNormalizedSnapshotTypes.join("|"), /account_positions_snapshot/);
  assert.match(boundary.requiredNormalizedFields.join("|"), /sourceEnvelopeHash/);
  assert.match(boundary.requiredNormalizedFields.join("|"), /rawPayloadStored/);
  assert.match(boundary.forbiddenNormalizedContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.requiredNormalizationAssertions.join("|"), /scenario_monthly_rows_rejected/);
  assert.match(boundary.redactionRules.join("|"), /hashes only/);
});

test("rejects stale contract when snapshot normalization implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.snapshotNormalizationImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_read_only_snapshot_normalization_contract\.json is out of date/);
});

test("blocks readiness if response envelope contract is not ready", () => {
  const workspace = makeWorkspace();
  const responseEnvelope = readJson(workspace, READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT);
  responseEnvelope.readiness.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview = false;
  responseEnvelope.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT, responseEnvelope);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyProviderResponseEnvelopeContractReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_response_envelope_contract_not_ready/);
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
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /audit_logger_readiness_contract_not_ready/);
});

test("blocks readiness if snapshot normalizer runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "kisReadOnlySnapshotNormalizer.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
