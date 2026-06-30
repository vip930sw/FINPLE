const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-mock-approval-evidence-receipt-validator-fixtures.cjs");
const CONTRACT = "trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures.json";
const RECEIPT_CONTRACT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const VALIDATOR_PATH = path.join("scripts", "validate-trading-mock-approval-evidence-receipt.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-mock-approval-receipt-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, RECEIPT_CONTRACT]) {
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

test("passes with current mock approval evidence receipt validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures\.json/);
});

test("records synthetic mock approval receipt validator fixtures while keeping runtime effects blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForMockApprovalEvidenceReceiptValidatorRegression, true);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.readOnlyApprovalImportImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
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
  const sensitivePattern = new RegExp(
    [
      ["5019", "5326"].join(""),
      ["6440", "8140"].join(""),
      ["KIS", "TRADING", "APP", "SECRET"].join("_"),
      ["KIS", "TRADING", "APP", "KEY"].join("_"),
      `APP ${"Secret"}`,
      `APP ${"Key"}`,
      ["data", "private", "trading"].join("/"),
    ].join("|"),
  );

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.match(invalidIds.join("|"), /missing_required_field/);
  assert.match(invalidIds.join("|"), /unknown_field/);
  assert.match(invalidIds.join("|"), /allow_flag_enabled/);
  assert.match(invalidIds.join("|"), /secret_value_present/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, sensitivePattern);
});

test("rejects stale fixtures if approval import, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.approvalPacketImportedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  report.checks.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures\.json is out of date/);
});

test("blocks if upstream mock approval evidence receipt opens too early", () => {
  const workspace = makeWorkspace();
  const receiptContract = readJson(workspace, RECEIPT_CONTRACT);
  receiptContract.readiness.approvalPacketImportedNow = true;
  receiptContract.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, RECEIPT_CONTRACT, receiptContract);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.mockApprovalEvidenceReceiptReady, false);
  assert.match(report.readiness.blockers.join("|"), /mock_approval_evidence_receipt_not_ready/);
});

test("blocks if private approval, provider, route, UI, DB, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "routes", "trading", "read-only.js"),
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
