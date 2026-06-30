const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-provider-call-authorization-preflight.cjs");
const CONTRACT = "trading_lab_step116_read_only_provider_call_authorization_preflight.json";
const READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const RESPONSE_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const SNAPSHOT_NORMALIZATION_CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const SNAPSHOT_RISK_INPUT_CONTRACT = "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-call-auth-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
    REQUEST_ENVELOPE_VALIDATION_PREFLIGHT,
    REQUEST_ENVELOPE_CONTRACT,
    RESPONSE_ENVELOPE_CONTRACT,
    SNAPSHOT_NORMALIZATION_CONTRACT,
    SNAPSHOT_RISK_INPUT_CONTRACT,
    PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
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

test("passes with current read-only provider call authorization preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_call_authorization_preflight\.json/);
});

test("keeps provider call authorization, provider calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderCallAuthorizationReview, false);
  assert.equal(report.readiness.providerCallAuthorizationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records read-only authorization rules without secrets, account numbers, or raw provider content", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlyProviderCallAuthorizationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.authorizationRules.join("|"), /private_worker_only/);
  assert.match(boundary.authorizationRules.join("|"), /read_only_endpoints_only/);
  assert.match(boundary.authorizationRules.join("|"), /no_provider_call_now/);
  assert.match(boundary.authorizationRules.join("|"), /no_token_refresh_now/);
  assert.match(boundary.authorizationRules.join("|"), /fail_closed_without_owner_approval_import/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale preflight if provider call authorization is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallAuthorizationAllowedNow = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_call_authorization_preflight\.json is out of date/,
  );
});

test("blocks if approval import or provider implementation gates open too early", () => {
  const workspace = makeWorkspace();
  const approval = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT);
  const provider = readJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT);
  approval.readiness.importImplementationAllowedNow = true;
  approval.readiness.providerCallsAllowed = true;
  provider.readiness.ownerPacketGateStillClosed = false;
  provider.readiness.providerImplementationAllowedNow = true;
  provider.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT, approval);
  writeJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT, provider);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.approvalImportImplementationStillBlocked, false);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
});

test("blocks if envelope or snapshot prerequisites start allowing provider calls", () => {
  const workspace = makeWorkspace();
  const requestValidation = readJson(workspace, REQUEST_ENVELOPE_VALIDATION_PREFLIGHT);
  const requestEnvelope = readJson(workspace, REQUEST_ENVELOPE_CONTRACT);
  const responseEnvelope = readJson(workspace, RESPONSE_ENVELOPE_CONTRACT);
  const normalization = readJson(workspace, SNAPSHOT_NORMALIZATION_CONTRACT);
  const riskInput = readJson(workspace, SNAPSHOT_RISK_INPUT_CONTRACT);
  requestValidation.readiness.providerRequestCreatedNow = true;
  requestValidation.readiness.providerCallsAllowed = true;
  requestEnvelope.readiness.providerCallsAllowed = true;
  responseEnvelope.readiness.providerCallsAllowed = true;
  normalization.readiness.providerCallsAllowed = true;
  riskInput.readiness.providerCallsAllowed = true;
  writeJson(workspace, REQUEST_ENVELOPE_VALIDATION_PREFLIGHT, requestValidation);
  writeJson(workspace, REQUEST_ENVELOPE_CONTRACT, requestEnvelope);
  writeJson(workspace, RESPONSE_ENVELOPE_CONTRACT, responseEnvelope);
  writeJson(workspace, SNAPSHOT_NORMALIZATION_CONTRACT, normalization);
  writeJson(workspace, SNAPSHOT_RISK_INPUT_CONTRACT, riskInput);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.requestEnvelopeValidationPreflightReady, false);
  assert.equal(report.checks.requestEnvelopeContractReady, false);
  assert.equal(report.checks.responseEnvelopeContractReady, false);
  assert.equal(report.checks.snapshotNormalizationContractReady, false);
  assert.equal(report.checks.snapshotRiskInputContractReady, false);
});

test("blocks if runtime service, provider service, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
