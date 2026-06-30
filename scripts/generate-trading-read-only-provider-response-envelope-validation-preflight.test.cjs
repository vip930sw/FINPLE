const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-response-envelope-validation-preflight.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json";
const RESPONSE_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const REQUEST_ENVELOPE_VALIDATOR_FIXTURES =
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json";
const ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json";
const SNAPSHOT_NORMALIZATION_CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const CALL_AUTHORIZATION_PREFLIGHT = "trading_lab_step116_read_only_provider_call_authorization_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-response-envelope.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-response-envelope-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    RESPONSE_ENVELOPE_CONTRACT,
    REQUEST_ENVELOPE_VALIDATOR_FIXTURES,
    ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT,
    SNAPSHOT_NORMALIZATION_CONTRACT,
    CALL_AUTHORIZATION_PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  const validatorTarget = path.join(workspace, VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(VALIDATOR_PATH, validatorTarget);
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

test("passes with current response envelope validation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_response_envelope_validation_preflight\.json/);
});

test("allows only future pure local validator review while provider responses and calls stay blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForPureLocalResponseEnvelopeValidatorImplementationReview, true);
  assert.equal(report.readiness.responseEnvelopeValidatorImplementationAllowedNow, true);
  assert.equal(report.readiness.responsePayloadReceivedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("records local validator rules without authorizing provider calls or raw payload persistence", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePureLocalResponseEnvelopeValidatorBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.validatorRules.join("|"), /pure_node_script_only/);
  assert.match(boundary.validatorRules.join("|"), /no_provider_response_fetch/);
  assert.match(boundary.validatorRules.join("|"), /no_raw_provider_payload_persistence/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale preflight if response payloads or provider calls are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.responsePayloadReceivedNow = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_response_envelope_validation_preflight\.json is out of date/,
  );
});

test("blocks if request fixtures or call authorization open too early", () => {
  const workspace = makeWorkspace();
  const fixtures = readJson(workspace, REQUEST_ENVELOPE_VALIDATOR_FIXTURES);
  const callAuthorization = readJson(workspace, CALL_AUTHORIZATION_PREFLIGHT);
  fixtures.readiness.providerRequestCreatedNow = true;
  fixtures.readiness.providerCallsAllowed = true;
  callAuthorization.readiness.providerCallAuthorizationAllowedNow = true;
  callAuthorization.readiness.providerCallsAllowed = true;
  writeJson(workspace, REQUEST_ENVELOPE_VALIDATOR_FIXTURES, fixtures);
  writeJson(workspace, CALL_AUTHORIZATION_PREFLIGHT, callAuthorization);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.requestEnvelopeValidatorFixturesReady, false);
  assert.equal(report.checks.callAuthorizationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /request_envelope_validator_fixtures_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /provider_call_authorization_not_blocked/);
});

test("blocks if provider service, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
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
