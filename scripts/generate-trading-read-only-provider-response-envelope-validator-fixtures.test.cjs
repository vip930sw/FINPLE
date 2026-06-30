const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-response-envelope-validator-fixtures.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json";
const RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json";
const RESPONSE_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const REQUEST_ENVELOPE_VALIDATOR_FIXTURES =
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json";
const ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json";
const SNAPSHOT_NORMALIZATION_CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const CALL_AUTHORIZATION_PREFLIGHT = "trading_lab_step116_read_only_provider_call_authorization_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-response-envelope-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT,
    RESPONSE_ENVELOPE_CONTRACT,
    REQUEST_ENVELOPE_VALIDATOR_FIXTURES,
    ENDPOINT_CATEGORY_VALIDATION_PREFLIGHT,
    SNAPSHOT_NORMALIZATION_CONTRACT,
    CALL_AUTHORIZATION_PREFLIGHT,
  ]) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runFixtures(workspace, args = ["--check"]) {
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

test("passes with current response envelope validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_response_envelope_validator_fixtures\.json/);
});

test("records synthetic response fixtures while keeping provider responses, calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForResponseEnvelopeFixtureRegression, true);
  assert.equal(report.readiness.responsePayloadReceivedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("keeps valid and invalid fixture catalog redacted and synthetic", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.invalidSyntheticFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.currentStepImplementsValidator, false);
  assert.equal(report.validation.currentStepCallsProvider, false);
  assert.equal(report.validation.validSyntheticEnvelope.endpointCategory, "account_cash_balance_read");
  assert.equal(report.validation.validSyntheticEnvelope.providerCallAllowed, false);
  assert.match(invalidIds.join("|"), /missing_raw_response_hash/);
  assert.match(invalidIds.join("|"), /unknown_normalized_snapshot_type/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /order_endpoint_category/);
  assert.match(invalidIds.join("|"), /raw_provider_payload_shape_present/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale fixtures if provider call flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.responsePayloadReceivedNow = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_response_envelope_validator_fixtures\.json is out of date/,
  );
});

test("blocks if response preflight or call authorization opens too early", () => {
  const workspace = makeWorkspace();
  const responsePreflight = readJson(workspace, RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT);
  const callAuthorization = readJson(workspace, CALL_AUTHORIZATION_PREFLIGHT);
  responsePreflight.readiness.responsePayloadReceivedNow = true;
  responsePreflight.readiness.providerCallsAllowed = true;
  callAuthorization.readiness.providerCallAuthorizationAllowedNow = true;
  callAuthorization.readiness.providerCallsAllowed = true;
  writeJson(workspace, RESPONSE_ENVELOPE_VALIDATION_PREFLIGHT, responsePreflight);
  writeJson(workspace, CALL_AUTHORIZATION_PREFLIGHT, callAuthorization);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.responseEnvelopeValidationPreflightReady, false);
  assert.equal(report.checks.callAuthorizationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /response_envelope_validation_preflight_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /provider_call_authorization_not_blocked/);
});

test("blocks if validator, provider service, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "scripts", "validate-trading-read-only-provider-response-envelope.cjs"),
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

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
