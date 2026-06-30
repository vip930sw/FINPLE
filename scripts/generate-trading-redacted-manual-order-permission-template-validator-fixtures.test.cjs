const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-redacted-manual-order-permission-template-validator-fixtures.cjs",
);
const CONTRACT = "trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures.json";
const TEMPLATE = "trading_lab_step116_redacted_manual_order_permission_template.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-manual-order-permission-template.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-manual-order-template-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, TEMPLATE]) {
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

test("passes with current redacted manual order permission template validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures\.json/);
});

test("records synthetic template fixtures while keeping packet creation, provider, orders, routes, UI, and DB blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForRedactedManualOrderPermissionTemplateValidatorRegression, true);
  assert.equal(report.readiness.permissionPacketCreatedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps fixture catalog redacted and validates expected local failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.match(invalidIds.join("|"), /packet_creation_enabled/);
  assert.match(invalidIds.join("|"), /packet_import_enabled/);
  assert.match(invalidIds.join("|"), /missing_template_field/);
  assert.match(invalidIds.join("|"), /missing_template_assertion/);
  assert.match(invalidIds.join("|"), /missing_forbidden_template_content/);
  assert.match(invalidIds.join("|"), /changed_future_permission_packet_path/);
  assert.match(invalidIds.join("|"), /numeric_raw_value_shape_injected/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  const forbiddenAccountPattern = new RegExp([["5019", "5326"].join(""), ["6440", "8140"].join("")].join("|"));
  const sensitiveNamePattern = new RegExp(
    [
      ["KIS", "TRADING", "APP", "SECRET"].join("_"),
      ["KIS", "TRADING", "APP", "KEY"].join("_"),
      ["APP", "Secret"].join(" "),
      ["APP", "Key"].join(" "),
    ].join("|"),
  );
  assert.doesNotMatch(serialized, forbiddenAccountPattern);
  assert.doesNotMatch(serialized, sensitiveNamePattern);
});

test("rejects stale fixtures if packet, provider, order, or route flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.permissionPacketCreatedNow = true;
  report.currentState.providerCallsAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  report.checks.runtimeRouteAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream redacted template opens too early", () => {
  const workspace = makeWorkspace();
  const template = readJson(workspace, TEMPLATE);
  template.readiness.permissionPacketCreatedNow = true;
  template.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, TEMPLATE, template);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.templateReady, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_manual_order_permission_template_not_ready/);
});

test("blocks if private packet, importer, adapter, route, UI, migration, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermission.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
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
