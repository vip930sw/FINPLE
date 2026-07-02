const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator-fixtures.cjs",
);
const CONTRACT =
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures.json";
const RUNBOOK_CONTRACT =
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json";
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-runbook-contract.cjs",
);
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-receipt-runbook-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, RUNBOOK_CONTRACT]) {
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

test("passes with current read-only approval receipt review runbook validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures\.json/,
  );
});

test("records synthetic validator fixtures while keeping receipt reads, imports, provider calls, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForReadOnlyApprovalReviewRunbookValidatorFixtureRegression, true);
  assert.equal(report.readiness.currentStepReadsReceipt, false);
  assert.equal(report.readiness.currentStepRunsValidator, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("keeps fixture catalog redacted and validates expected local failures", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);
  const invalidIds = report.validation.syntheticInvalidFixtures.map((fixture) => fixture.id);

  assert.equal(report.validation.evidence.validFixturePasses, true);
  assert.equal(report.validation.evidence.invalidFixturesFailWithExpectedCodes, true);
  assert.match(invalidIds.join("|"), /missing_output_files/);
  assert.match(invalidIds.join("|"), /receipt_read_enabled/);
  assert.match(invalidIds.join("|"), /approval_import_enabled/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.deepEqual(report.evidence.forbiddenFixtureContent, []);
  assert.doesNotMatch(serialized, /50195326|64408140|KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
});

test("rejects stale fixtures if receipt read or trading flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.validationReceiptReadAllowedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runFixtures(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream runbook opens too early", () => {
  const workspace = makeWorkspace();
  const runbook = readJson(workspace, RUNBOOK_CONTRACT);
  runbook.readiness.currentStepReadsReceipt = true;
  runbook.readiness.providerCallsAllowed = true;
  writeJson(workspace, RUNBOOK_CONTRACT, runbook);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.runbookContractReady, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /read_only_approval_packet_validation_result_receipt_review_runbook_contract_not_ready/,
  );
});
