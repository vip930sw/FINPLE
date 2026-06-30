const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-private-shadow-intent-audit-event-validator-fixtures.cjs",
);
const CONTRACT = "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json";
const AUDIT_EVENT_CONTRACT = "trading_lab_step116_private_shadow_intent_audit_event_contract.json";
const ORDER_INTENT_VALIDATOR_FIXTURES =
  "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-private-shadow-intent-audit-event.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-intent-audit-event-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, AUDIT_EVENT_CONTRACT, ORDER_INTENT_VALIDATOR_FIXTURES]) {
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

test("passes with current private shadow intent audit event validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures\.json/);
});

test("records synthetic audit event fixtures while keeping provider calls, audit writes, routes, DB, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForPrivateShadowIntentAuditEventFixtureRegression, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.orderCancellationAllowed, false);
  assert.equal(report.readiness.auditLogWritingAllowed, false);
  assert.equal(report.readiness.orderIntentRecordingAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("keeps audit event fixture catalog redacted and validates expected failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.equal(report.validation.validSyntheticAuditEvent.providerCallsAllowed, false);
  assert.equal(report.validation.validSyntheticAuditEvent.orderSubmissionAllowed, false);
  assert.match(invalidIds.join("|"), /missing_order_intent_hash/);
  assert.match(invalidIds.join("|"), /live_guarded_mode/);
  assert.match(invalidIds.join("|"), /unsupported_event_type/);
  assert.match(invalidIds.join("|"), /clear_risk_gate_status/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /order_submission_flag_enabled/);
  assert.match(invalidIds.join("|"), /raw_payload_shape_present/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale fixtures if trading or audit-write flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.auditLogWritingAllowed = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures\.json is out of date/,
  );
});

test("blocks if audit event contract or order-intent fixtures open too early", () => {
  const workspace = makeWorkspace();
  const auditEventContract = readJson(workspace, AUDIT_EVENT_CONTRACT);
  const orderIntentFixtures = readJson(workspace, ORDER_INTENT_VALIDATOR_FIXTURES);
  auditEventContract.readiness.providerCallsAllowed = true;
  orderIntentFixtures.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, AUDIT_EVENT_CONTRACT, auditEventContract);
  writeJson(workspace, ORDER_INTENT_VALIDATOR_FIXTURES, orderIntentFixtures);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.auditEventContractReady, false);
  assert.equal(report.checks.orderIntentValidatorFixturesReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_intent_audit_event_contract_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_order_intent_validator_fixtures_not_ready/);
});

test("blocks if audit recorder, order adapter, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "privateShadowIntentAuditEvent.js"),
    path.join(workspace, "server", "src", "services", "trading", "auditEventRecorder.js"),
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
