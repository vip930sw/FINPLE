const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-provider-endpoint-allowlist-contract.cjs");
const CONTRACT = "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json";
const CALL_AUTHORIZATION_PREFLIGHT = "trading_lab_step116_read_only_provider_call_authorization_preflight.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const RESPONSE_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_response_envelope_contract.json";
const SNAPSHOT_NORMALIZATION_CONTRACT = "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const SNAPSHOT_RISK_INPUT_CONTRACT = "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-endpoints-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    CALL_AUTHORIZATION_PREFLIGHT,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
    REQUEST_ENVELOPE_CONTRACT,
    RESPONSE_ENVELOPE_CONTRACT,
    SNAPSHOT_NORMALIZATION_CONTRACT,
    SNAPSHOT_RISK_INPUT_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
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

test("passes with current read-only provider endpoint allowlist contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_endpoint_allowlist_contract\.json/);
});

test("records category allowlist while keeping provider calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  const boundary = report.futureReadOnlyProviderEndpointAllowlistBoundary;
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderEndpointAllowlistReview, true);
  assert.equal(report.readiness.endpointAllowlistImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.match(boundary.allowedEndpointCategories.join("|"), /account_cash_balance_read/);
  assert.match(boundary.allowedEndpointCategories.join("|"), /current_quote_read/);
  assert.match(boundary.forbiddenEndpointCategories.join("|"), /order_submit/);
  assert.match(boundary.forbiddenEndpointCategories.join("|"), /scenario_monthly_data_download/);
});

test("does not record provider-specific endpoint paths, transaction ids, secrets, or account values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlyProviderEndpointAllowlistBoundary;
  const serialized = JSON.stringify(report);

  assert.equal(report.currentState.providerSpecificEndpointPathsRecordedNow, false);
  assert.equal(report.currentState.providerSpecificTransactionIdsRecordedNow, false);
  assert.match(boundary.endpointRules.join("|"), /no_provider_specific_endpoint_path_committed_now/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /provider_tr_id/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale contract if provider calls are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.endpointAllowlistImplementationAllowed = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_endpoint_allowlist_contract\.json is out of date/,
  );
});

test("blocks if provider call authorization or env risk gate opens too early", () => {
  const workspace = makeWorkspace();
  const callAuthorization = readJson(workspace, CALL_AUTHORIZATION_PREFLIGHT);
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  callAuthorization.readiness.providerCallAuthorizationAllowedNow = true;
  callAuthorization.readiness.providerCallsAllowed = true;
  envRiskGate.readiness.providerCallsAllowed = true;
  envRiskGate.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CALL_AUTHORIZATION_PREFLIGHT, callAuthorization);
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.callAuthorizationStillBlocked, false);
  assert.equal(report.checks.envRiskGateStillFailClosed, false);
  assert.match(report.readiness.blockers.join("|"), /provider_call_authorization_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
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

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
