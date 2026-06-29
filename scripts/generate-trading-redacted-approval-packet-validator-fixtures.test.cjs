const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { validateRedactedApprovalPacket } = require("./validate-trading-redacted-read-only-approval-packet.cjs");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-approval-packet-validator-fixtures.cjs");
const CONTRACT = "trading_lab_step116_redacted_approval_packet_validator_fixtures.json";
const VALIDATION_CONTRACT = "trading_lab_step116_redacted_approval_packet_validation_contract.json";
const VALIDATION_PREFLIGHT = "trading_lab_step116_redacted_approval_packet_validation_preflight.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const NOW = "2026-06-29T00:00:00.000Z";

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-approval-packet-validator-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, VALIDATION_CONTRACT, VALIDATION_PREFLIGHT]) {
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

test("passes with current redacted approval packet validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_approval_packet_validator_fixtures\.json/);
});

test("valid fixture passes and invalid fixtures fail with expected validator codes", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const validResult = validateRedactedApprovalPacket(report.validation.validSyntheticRedactedPacket, { now: NOW });

  assert.equal(validResult.valid, true);
  assert.equal(report.validation.invalidSyntheticFixtures.length >= 8, true);
  for (const fixture of report.validation.invalidSyntheticFixtures) {
    const result = validateRedactedApprovalPacket(fixture.packet, { now: NOW });
    const codes = result.errors.map((error) => error.code);
    assert.equal(result.valid, false, fixture.id);
    for (const expectedCode of fixture.expectedErrorCodes) {
      assert.equal(codes.includes(expectedCode), true, `${fixture.id} should include ${expectedCode}`);
    }
  }
});

test("keeps private packet, import, provider, order, runtime, DB, and UI paths blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForValidatorFixtureRegression, true);
  assert.equal(report.readiness.privateApprovalPacketCreated, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("rejects stale fixtures if an expected validator error code is manually changed", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.validation.invalidSyntheticFixtures[0].expectedErrorCodes = ["unknown_field"];
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_approval_packet_validator_fixtures\.json is out of date/);
});

test("blocks readiness if validation preflight is not ready", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, VALIDATION_PREFLIGHT);
  preflight.readiness.readyForPureLocalValidatorImplementationReview = false;
  preflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, VALIDATION_PREFLIGHT, preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.validationPreflightReady, false);
  assert.equal(report.readiness.readyForValidatorFixtureRegression, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_packet_validation_preflight_not_ready/);
});

test("blocks if a private approval packet or runtime artifact appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  const runtimePath = path.join(workspace, "server", "src", "routes", "trading");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.mkdirSync(runtimePath, { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForValidatorFixtureRegression, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("serialized fixtures do not include real account, secret, provider, or order labels", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.doesNotMatch(serialized, /full_account_number|raw_account_identifier/i);
  assert.doesNotMatch(serialized, /app[_ ]?secret|app[_ ]?key|access[_ ]?token/i);
  assert.doesNotMatch(serialized, /raw_provider_payload|raw_order_payload/i);
});
