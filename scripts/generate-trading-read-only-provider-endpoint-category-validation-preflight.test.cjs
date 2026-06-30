const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-endpoint-category-validation-preflight.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json";
const ENDPOINT_ALLOWLIST_CONTRACT = "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json";
const REQUEST_ENVELOPE_CONTRACT = "trading_lab_step116_read_only_provider_request_envelope_contract.json";
const REQUEST_ENVELOPE_VALIDATION_PREFLIGHT =
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json";
const CALL_AUTHORIZATION_PREFLIGHT = "trading_lab_step116_read_only_provider_call_authorization_preflight.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-read-only-provider-request-envelope.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-category-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    ENDPOINT_ALLOWLIST_CONTRACT,
    REQUEST_ENVELOPE_CONTRACT,
    REQUEST_ENVELOPE_VALIDATION_PREFLIGHT,
    CALL_AUTHORIZATION_PREFLIGHT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const validatorTarget = path.join(workspace, VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(VALIDATOR_PATH, validatorTarget);
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

test("passes with current endpoint category validation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_endpoint_category_validation_preflight\.json/);
});

test("keeps endpoint categories aligned while provider calls and runtime surfaces stay blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureReadOnlyProviderEndpointCategoryValidationReview, true);
  assert.equal(report.readiness.categoryValidatorImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.deepEqual(report.evidence.allowlistVsRequestEnvelopeDiff, []);
  assert.deepEqual(report.evidence.allowlistVsValidatorDiff, []);
  assert.match(report.evidence.allowlistCategories.join("|"), /current_quotes_read/);
});

test("rejects stale preflight if category validation starts allowing provider calls", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.categoryValidatorImplementationAllowedNow = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_endpoint_category_validation_preflight\.json is out of date/,
  );
});

test("blocks if allowlist and request envelope categories drift apart", () => {
  const workspace = makeWorkspace();
  const allowlist = readJson(workspace, ENDPOINT_ALLOWLIST_CONTRACT);
  allowlist.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories =
    allowlist.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories.filter(
      (category) => category !== "current_quotes_read",
    );
  allowlist.futureReadOnlyProviderEndpointAllowlistBoundary.allowedEndpointCategories.push("current_quote_read");
  writeJson(workspace, ENDPOINT_ALLOWLIST_CONTRACT, allowlist);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.allowlistMatchesRequestEnvelope, false);
  assert.equal(report.checks.allowlistMatchesValidator, false);
  assert.match(report.readiness.blockers.join("|"), /allowlist_request_envelope_category_mismatch_current_quote_read/);
  assert.match(report.readiness.blockers.join("|"), /allowlist_validator_category_mismatch_current_quote_read/);
});

test("blocks if provider call authorization opens too early", () => {
  const workspace = makeWorkspace();
  const callAuthorization = readJson(workspace, CALL_AUTHORIZATION_PREFLIGHT);
  callAuthorization.readiness.providerCallAuthorizationAllowedNow = true;
  callAuthorization.readiness.providerCallsAllowed = true;
  writeJson(workspace, CALL_AUTHORIZATION_PREFLIGHT, callAuthorization);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.callAuthorizationStillBlocked, false);
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
