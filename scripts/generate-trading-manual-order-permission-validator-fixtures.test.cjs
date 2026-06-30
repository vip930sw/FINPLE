const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-manual-order-permission-validator-fixtures.cjs");
const CONTRACT = "trading_lab_step116_manual_order_permission_validator_fixtures.json";
const PERMISSION_PREFLIGHT = "trading_lab_step116_manual_order_permission_preflight.json";
const OPERATOR_ACCESS_VALIDATOR_FIXTURES =
  "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, PERMISSION_PREFLIGHT, OPERATOR_ACCESS_VALIDATOR_FIXTURES]) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const validatorTarget = path.join(workspace, VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(VALIDATOR_PATH, validatorTarget);
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

test("passes with current manual order permission validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_validator_fixtures\.json/);
});

test("records synthetic manual order permission fixtures while keeping imports, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForManualOrderPermissionFixtureRegression, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.permissionImportAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps permission fixture catalog redacted and validates expected failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.equal(report.validation.validSyntheticPermission.mode, "live_guarded");
  assert.equal(report.validation.validSyntheticPermission.providerCallsAllowed, false);
  assert.equal(report.validation.validSyntheticPermission.orderSubmissionAllowed, false);
  assert.match(invalidIds.join("|"), /missing_approved_by_hash/);
  assert.match(invalidIds.join("|"), /shadow_mode/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /empty_symbol_hashes/);
  assert.match(invalidIds.join("|"), /expired_permission/);
  assert.match(invalidIds.join("|"), /permission_window_too_long/);
  assert.match(invalidIds.join("|"), /private_path_reference_present/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /data\/private|data\\private/);
});

test("rejects stale fixtures if permission import or trading flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.permissionImportAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_manual_order_permission_validator_fixtures\.json is out of date/);
});

test("blocks if upstream manual permission or operator fixtures open too early", () => {
  const workspace = makeWorkspace();
  const permissionPreflight = readJson(workspace, PERMISSION_PREFLIGHT);
  const operatorFixtures = readJson(workspace, OPERATOR_ACCESS_VALIDATOR_FIXTURES);
  permissionPreflight.readiness.orderSubmissionAllowed = true;
  operatorFixtures.readiness.providerCallsAllowed = true;
  writeJson(workspace, PERMISSION_PREFLIGHT, permissionPreflight);
  writeJson(workspace, OPERATOR_ACCESS_VALIDATOR_FIXTURES, operatorFixtures);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.permissionPreflightReady, false);
  assert.equal(report.checks.operatorAccessValidatorFixturesReady, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_preflight_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_operator_access_validator_fixtures_not_ready/);
});

test("blocks if order permission importer, adapter, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermission.js"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "manualOrderPermission.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
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
