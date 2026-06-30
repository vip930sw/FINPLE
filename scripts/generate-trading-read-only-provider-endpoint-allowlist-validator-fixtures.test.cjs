const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures.json";
const ENDPOINT_ALLOWLIST_CONTRACT = "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const REQUIRED_INVALID_FIXTURE_IDS = [
  "missing_output_files",
  "missing_allowed_endpoint_category",
  "missing_forbidden_endpoint_category",
  "unknown_allowed_endpoint_category",
  "allowed_forbidden_endpoint_overlap",
  "missing_endpoint_rule",
  "missing_forbidden_preflight_content",
  "provider_specific_path_recorded",
  "provider_specific_transaction_id_recorded",
  "endpoint_allowlist_implementation_enabled",
  "provider_call_flag_enabled",
  "order_submission_flag_enabled",
  "runtime_route_flag_enabled",
  "provider_url_path_injected",
  "provider_tr_id_injected",
  "numeric_raw_value_shape_injected",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-endpoint-allowlist-validator-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, ENDPOINT_ALLOWLIST_CONTRACT]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const scriptsDir = path.join(workspace, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  for (const scriptName of [
    "generate-trading-read-only-provider-endpoint-allowlist-validator-fixtures.cjs",
    "validate-trading-read-only-provider-endpoint-allowlist-contract.cjs",
  ]) {
    fs.copyFileSync(path.join("scripts", scriptName), path.join(scriptsDir, scriptName));
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

test("passes with current read-only provider endpoint allowlist validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures\.json/);
});

test("generation keeps provider-specific endpoints, provider calls, routes, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression, true);
  assert.equal(report.readiness.providerSpecificEndpointPathsRecordedNow, false);
  assert.equal(report.readiness.providerSpecificTransactionIdsRecordedNow, false);
  assert.equal(report.readiness.endpointAllowlistImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("catalog is redacted and contains all invalid fixture ids", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.evidence.invalidFixtureIds;
  const missingIds = REQUIRED_INVALID_FIXTURE_IDS.filter((id) => !invalidIds.includes(id));
  const forbiddenAccountPattern = new RegExp([["5019", "5326"].join(""), ["6440", "8140"].join("")].join("|"));
  const sensitiveNamePattern = new RegExp(
    [
      ["KIS", "TRADING", "APP", "SECRET"].join("_"),
      ["KIS", "TRADING", "APP", "KEY"].join("_"),
      ["APP", "Secret"].join(" "),
      ["APP", "Key"].join(" "),
    ].join("|"),
  );

  assert.deepEqual(missingIds, []);
  assert.deepEqual(report.evidence.missingInvalidFixtureIds, []);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, forbiddenAccountPattern);
  assert.doesNotMatch(serialized, sensitiveNamePattern);
});

test("rejects stale fixtures if provider calls or orders are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.readiness.providerCallsAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream endpoint allowlist starts implementation too early", () => {
  const workspace = makeWorkspace();
  const allowlist = readJson(workspace, ENDPOINT_ALLOWLIST_CONTRACT);
  allowlist.readiness.endpointAllowlistImplementationAllowed = true;
  allowlist.readiness.providerCallsAllowed = true;
  writeJson(workspace, ENDPOINT_ALLOWLIST_CONTRACT, allowlist);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.endpointAllowlistContractReady, false);
  assert.equal(report.readiness.readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_endpoint_allowlist_contract_not_ready/);
});

test("blocks if forbidden runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "routes", "trading", "index.js"),
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
  assert.equal(report.readiness.readyForReadOnlyProviderEndpointAllowlistValidatorFixtureRegression, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
