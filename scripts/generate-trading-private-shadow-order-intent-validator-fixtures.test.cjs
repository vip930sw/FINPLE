const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-private-shadow-order-intent-validator-fixtures.cjs",
);
const CONTRACT = "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json";
const ORDER_INTENT_CONTRACT = "trading_lab_step116_private_shadow_order_intent_contract.json";
const SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES =
  "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-order-intent.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-order-intent-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, ORDER_INTENT_CONTRACT, SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES]) {
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

test("passes with current private shadow order intent validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_order_intent_validator_fixtures\.json/);
});

test("records synthetic order intent fixtures while keeping provider calls, DB, UI, routes, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForPrivateShadowOrderIntentFixtureRegression, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.orderCancellationAllowed, false);
  assert.equal(report.readiness.orderIntentRecordingAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("keeps order intent fixture catalog redacted and validates expected failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.equal(report.validation.validSyntheticOrderIntent.providerCallsAllowed, false);
  assert.equal(report.validation.validSyntheticOrderIntent.orderSubmissionAllowed, false);
  assert.match(invalidIds.join("|"), /missing_risk_input_hash/);
  assert.match(invalidIds.join("|"), /live_guarded_mode/);
  assert.match(invalidIds.join("|"), /clear_risk_gate_status/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /order_submission_flag_enabled/);
  assert.match(invalidIds.join("|"), /raw_order_shape_present/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale fixtures if trading flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.orderIntentRecordingAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_private_shadow_order_intent_validator_fixtures\.json is out of date/,
  );
});

test("blocks if order intent contract or risk-input fixtures open too early", () => {
  const workspace = makeWorkspace();
  const orderIntentContract = readJson(workspace, ORDER_INTENT_CONTRACT);
  const riskInputFixtures = readJson(workspace, SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES);
  orderIntentContract.readiness.providerCallsAllowed = true;
  riskInputFixtures.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, ORDER_INTENT_CONTRACT, orderIntentContract);
  writeJson(workspace, SNAPSHOT_RISK_INPUT_VALIDATOR_FIXTURES, riskInputFixtures);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.orderIntentContractReady, false);
  assert.equal(report.checks.snapshotRiskInputValidatorFixturesReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_order_intent_contract_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /snapshot_risk_input_validator_fixtures_not_ready/);
});

test("blocks if intent recorder, order adapter, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "privateShadowOrderIntent.js"),
    path.join(workspace, "server", "src", "services", "trading", "orderIntentRecorder.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
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
