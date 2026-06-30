const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-import-implementation-preflight-validator-fixtures.cjs",
);
const CONTRACT =
  "trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures.json";
const IMPORT_PREFLIGHT = "trading_lab_step116_manual_order_permission_import_implementation_preflight.json";
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-import-implementation-preflight.cjs",
);
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-import-preflight-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, IMPORT_PREFLIGHT]) {
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
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current manual order permission import implementation preflight validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures\.json/,
  );
});

test("records synthetic import preflight validator fixtures while keeping private packet, provider, orders, routes, and DB blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForImportImplementationPreflightValidatorRegression, true);
  assert.equal(report.readiness.importImplementationAllowedNow, false);
  assert.equal(report.readiness.ownerPacketReadAllowedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.orderAdapterImplementationAllowedNow, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps fixture catalog redacted and validates expected local failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.match(invalidIds.join("|"), /private_packet_read_enabled/);
  assert.match(invalidIds.join("|"), /private_packet_write_enabled/);
  assert.match(invalidIds.join("|"), /permission_packet_import_enabled/);
  assert.match(invalidIds.join("|"), /hash_generation_enabled/);
  assert.match(invalidIds.join("|"), /provider_call_enabled/);
  assert.match(invalidIds.join("|"), /order_submission_enabled/);
  assert.match(invalidIds.join("|"), /order_adapter_implementation_enabled/);
  assert.match(invalidIds.join("|"), /runtime_route_creation_enabled/);
  assert.match(invalidIds.join("|"), /database_write_enabled/);
  assert.match(invalidIds.join("|"), /changed_future_paths/);
  assert.match(invalidIds.join("|"), /numeric_raw_value_shape_injected/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale fixtures if import, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.importImplementationAllowedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  report.checks.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream import implementation preflight opens too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, IMPORT_PREFLIGHT);
  preflight.readiness.importImplementationAllowedNow = true;
  preflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, IMPORT_PREFLIGHT, preflight);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.importImplementationPreflightReady, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_implementation_preflight_not_ready/);
});

test("blocks if private packet, importer, adapter, route, UI, DB, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
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
