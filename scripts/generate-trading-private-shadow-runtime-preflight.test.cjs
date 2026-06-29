const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-shadow-runtime-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const ENV_READINESS_CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const READ_ONLY_APPROVAL_INTAKE_CONTRACT = "trading_lab_step116_read_only_approval_intake_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT =
  "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT =
  "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT =
  "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-runtime-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    SHADOW_CONTRACT,
    ENV_READINESS_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
    ORDER_CREDENTIAL_BOUNDARY_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    READ_ONLY_APPROVAL_INTAKE_CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT,
    READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT,
    READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
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

test("passes with current private shadow runtime preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_runtime_preflight\.json/);
});

test("keeps private shadow runtime implementation blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.privateShadowRuntimeImplementationAllowed, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, true);
  assert.equal(report.readiness.privateShadowRuntimeImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records runtime evidence, assertions, and raw-provider-payload boundary", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futurePrivateShadowRuntimeBoundary.requiredRuntimeEvidence.join("|"), /quote_snapshot_hash/);
  assert.match(report.futurePrivateShadowRuntimeBoundary.requiredRuntimeEvidence.join("|"), /order_intent_hash/);
  assert.match(report.futurePrivateShadowRuntimeBoundary.requiredAssertions.join("|"), /no_order_submission/);
  assert.match(
    report.futurePrivateShadowRuntimeBoundary.requiredAssertions.join("|"),
    /provider_calls_remain_blocked_until_separate_read_only_approval/,
  );
  assert.equal(report.futurePrivateShadowRuntimeBoundary.storageBoundary.futureRawProviderPayloadStorageAllowed, false);
});

test("rejects stale contract when private shadow runtime implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.privateShadowRuntimeImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_shadow_runtime_preflight\.json is out of date/);
});

test("blocks future private shadow runtime review if shadow contract starts allowing runtime", () => {
  const workspace = makeWorkspace();
  const shadowContract = readJson(workspace, SHADOW_CONTRACT);
  shadowContract.readiness.readOnlyRuntimeIntegrationAllowed = true;
  shadowContract.readiness.providerCallsAllowed = true;
  writeJson(workspace, SHADOW_CONTRACT, shadowContract);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.shadowContractStillBlocksRuntime, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_contract_allows_runtime_too_early/);
});

test("blocks future private shadow runtime review if audit logger readiness is not ready", () => {
  const workspace = makeWorkspace();
  const auditLogger = readJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT);
  auditLogger.readiness.readyForFutureAuditLoggerImplementationReview = false;
  auditLogger.readiness.auditLoggerImplementationAllowed = true;
  writeJson(workspace, AUDIT_LOGGER_READINESS_CONTRACT, auditLogger);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.auditLoggerReadinessContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /audit_logger_readiness_contract_not_ready/);
});

test("blocks future private shadow runtime review if env risk gate stops failing closed", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRiskGate.readiness.readyForProviderCalls = true;
  envRiskGate.readiness.providerCallsAllowed = true;
  envRiskGate.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
});

test("blocks future private shadow runtime review if read-only approval intake is not ready", () => {
  const workspace = makeWorkspace();
  const approvalIntake = readJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT);
  approvalIntake.readiness.readyForFutureReadOnlyApprovalIntakeValidation = false;
  approvalIntake.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_INTAKE_CONTRACT, approvalIntake);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalIntakeContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_intake_contract_not_ready/);
});

test("blocks future private shadow runtime review if read-only approval import preflight is not ready", () => {
  const workspace = makeWorkspace();
  const approvalImportPreflight = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  approvalImportPreflight.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = false;
  approvalImportPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, approvalImportPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalImportPreflightReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_preflight_not_ready/);
});

test("blocks future private shadow runtime review if read-only provider request envelope is not ready", () => {
  const workspace = makeWorkspace();
  const requestEnvelope = readJson(workspace, READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT);
  requestEnvelope.readiness.readyForFutureReadOnlyProviderRequestEnvelopeImplementationReview = false;
  requestEnvelope.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_PROVIDER_REQUEST_ENVELOPE_CONTRACT, requestEnvelope);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyProviderRequestEnvelopeContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_request_envelope_contract_not_ready/);
});

test("blocks future private shadow runtime review if read-only provider response envelope is not ready", () => {
  const workspace = makeWorkspace();
  const responseEnvelope = readJson(workspace, READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT);
  responseEnvelope.readiness.readyForFutureReadOnlyProviderResponseEnvelopeImplementationReview = false;
  responseEnvelope.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_CONTRACT, responseEnvelope);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyProviderResponseEnvelopeContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_response_envelope_contract_not_ready/);
});

test("blocks future private shadow runtime review if read-only snapshot normalization is not ready", () => {
  const workspace = makeWorkspace();
  const snapshotNormalization = readJson(workspace, READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT);
  snapshotNormalization.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview = false;
  snapshotNormalization.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT, snapshotNormalization);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlySnapshotNormalizationContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_snapshot_normalization_contract_not_ready/);
});

test("blocks future private shadow runtime review if runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "shadowRuntime.js"), "");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
