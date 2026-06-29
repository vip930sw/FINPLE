const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-read-only-provider-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT =
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json";
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const RESPONSE_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const SNAPSHOT_NORMALIZATION_CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const SNAPSHOT_RISK_INPUT_CONTRACT = "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-read-only-provider-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT,
    REQUEST_ENVELOPE_VALIDATION_PREFLIGHT,
    REQUEST_ENVELOPE_CONTRACT,
    RESPONSE_ENVELOPE_CONTRACT,
    SNAPSHOT_NORMALIZATION_CONTRACT,
    SNAPSHOT_RISK_INPUT_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
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

test("passes with current private read-only provider implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_read_only_provider_implementation_preflight\.json/);
});

test("keeps read-only provider implementation blocked until owner packet import", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.currentState.ownerPacketGateStillClosed, true);
  assert.equal(report.readiness.readyForFuturePrivateReadOnlyProviderImplementationReview, false);
  assert.equal(report.readiness.ownerPacketGateStillClosed, true);
  assert.equal(report.readiness.providerImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records private worker read-only implementation rules without raw secrets or provider payloads", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateReadOnlyProviderImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /private_worker_only/);
  assert.match(boundary.implementationRules.join("|"), /read_only_endpoints_only/);
  assert.match(boundary.implementationRules.join("|"), /no_order_endpoint/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
});

test("rejects stale preflight if provider calls are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerImplementationAllowedNow = true;
  report.currentState.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_private_read_only_provider_implementation_preflight\.json is out of date/,
  );
});

test("blocks if read-only approval import gate is no longer closed", () => {
  const workspace = makeWorkspace();
  const approvalImportPreflight = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  approvalImportPreflight.readiness.approvalPacketImportedNow = true;
  approvalImportPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, approvalImportPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalStillDeferred, false);
  assert.equal(report.readiness.ownerPacketGateStillClosed, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_gate_not_closed/);
});

test("blocks if request envelope validation preflight starts allowing provider calls", () => {
  const workspace = makeWorkspace();
  const requestValidationPreflight = readJson(workspace, REQUEST_ENVELOPE_VALIDATION_PREFLIGHT);
  requestValidationPreflight.readiness.providerRequestCreatedNow = true;
  requestValidationPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, REQUEST_ENVELOPE_VALIDATION_PREFLIGHT, requestValidationPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.requestEnvelopeValidationPreflightReady, false);
  assert.match(report.readiness.blockers.join("|"), /request_envelope_validation_preflight_not_ready/);
});

test("blocks if env risk gate starts allowing provider calls", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRiskGate.readiness.readyForProviderCalls = true;
  envRiskGate.readiness.providerCallsAllowed = true;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateStillFailClosed, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_not_fail_closed/);
});

test("blocks if read-only provider runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const providerPath = path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js");
  fs.mkdirSync(path.dirname(providerPath), { recursive: true });
  fs.writeFileSync(providerPath, "module.exports = {};\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
