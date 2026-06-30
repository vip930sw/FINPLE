const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-manual-order-permission-packet-validator-fixtures.cjs");
const CONTRACT = "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json";
const TEMPLATE = "trading_lab_step116_redacted_manual_order_permission_template.json";
const IMPORT_PREFLIGHT = "trading_lab_step116_manual_order_permission_import_implementation_preflight.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-packet-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, TEMPLATE, IMPORT_PREFLIGHT]) {
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

test("passes with current manual order permission packet validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_packet_validator_fixtures\.json/);
});

test("records synthetic packet validator fixtures while keeping private packet, provider, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForManualOrderPermissionPacketValidatorRegression, true);
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
  assert.match(invalidIds.join("|"), /missing_required_field/);
  assert.match(invalidIds.join("|"), /malformed_hash_field/);
  assert.match(invalidIds.join("|"), /empty_allowed_symbol_hashes/);
  assert.match(invalidIds.join("|"), /malformed_symbol_hash/);
  assert.match(invalidIds.join("|"), /expired_permission/);
  assert.match(invalidIds.join("|"), /invalid_mode/);
  assert.match(invalidIds.join("|"), /invalid_numeric_limit/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /order_submission_flag_enabled/);
  assert.match(invalidIds.join("|"), /forbidden_secret_value/);
  assert.deepEqual(report.evidence.forbiddenSyntheticPacketContent, []);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /full_account_number|raw_account_identifier|raw_order_payload/);
});

test("rejects stale fixtures if packet, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.permissionPacketCreatedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  report.checks.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_packet_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream template opens packet creation too early", () => {
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

test("blocks if private packet, importer, adapter, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js"),
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
