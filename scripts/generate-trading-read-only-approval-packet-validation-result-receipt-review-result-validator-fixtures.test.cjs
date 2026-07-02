const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-approval-packet-validation-result-receipt-review-result-validator-fixtures.cjs",
);
const CONTRACT =
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures.json";
const REVIEW_RESULT_CONTRACT =
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_contract.json";
const VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-read-only-approval-packet-validation-result-receipt-review-result-contract.cjs",
);
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-approval-receipt-review-result-fixtures-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, REVIEW_RESULT_CONTRACT]) {
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

test("passes with current read-only approval validation receipt review result validator fixtures", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures\.json/,
  );
});

test("records synthetic validator fixtures while keeping receipt reads, review-result writes, provider calls, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.fixturesOnly, true);
  assert.equal(report.readiness.readyForReadOnlyApprovalReviewResultValidatorFixtureRegression, true);
  assert.equal(report.readiness.currentStepReadsReceipt, false);
  assert.equal(report.readiness.currentStepRecordsReviewResult, false);
  assert.equal(report.readiness.currentStepCallsProvider, false);
  assert.equal(report.readiness.validationReceiptReadAllowedNow, false);
  assert.equal(report.readiness.approvalPayloadRecorded, false);
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
  assert.match(invalidIds.join("|"), /review_result_record_enabled/);
  assert.match(invalidIds.join("|"), /provider_call_action_enabled/);
  assert.match(invalidIds.join("|"), /missing_review_result_field/);
  assert.match(invalidIds.join("|"), /missing_review_result_assertion/);
  assert.match(invalidIds.join("|"), /missing_forbidden_review_result_content/);
  assert.match(invalidIds.join("|"), /changed_future_receipt_path/);
  assert.match(invalidIds.join("|"), /approval_payload_flag_enabled/);
  assert.match(invalidIds.join("|"), /provider_call_flag_enabled/);
  assert.match(invalidIds.join("|"), /order_submission_flag_enabled/);
  assert.match(invalidIds.join("|"), /runtime_route_flag_enabled/);
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
    /trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures\.json is out of date/,
  );
});

test("blocks if upstream review result contract opens too early", () => {
  const workspace = makeWorkspace();
  const reviewResult = readJson(workspace, REVIEW_RESULT_CONTRACT);
  reviewResult.readiness.validationReceiptReadAllowedNow = true;
  reviewResult.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, REVIEW_RESULT_CONTRACT, reviewResult);

  const result = runFixtures(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.reviewResultContractReady, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /read_only_approval_validation_result_receipt_review_result_contract_not_ready/,
  );
});

test("blocks if private receipt, provider implementation, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(
      workspace,
      "data",
      "private",
      "trading",
      "read_only_approval_validation_result_receipt.redacted.json",
    ),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "routes", "trading", "read-only.js"),
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
