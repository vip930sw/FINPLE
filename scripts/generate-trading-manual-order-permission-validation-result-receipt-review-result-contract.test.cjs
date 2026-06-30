const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-validation-result-receipt-review-result-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json";
const INPUTS = [
  CONTRACT,
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-validation-receipt-review-result-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of INPUTS) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runReviewResult(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current manual order permission validation result receipt review result contract", () => {
  const workspace = makeWorkspace();
  const result = runReviewResult(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract\.json/,
  );
});

test("records redacted review result boundary while keeping receipt reads, imports, provider calls, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runReviewResult(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.reviewResultContractOnly, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult, true);
  assert.equal(report.readiness.validationReceiptReviewRecordedNow, false);
  assert.equal(report.readiness.validationReceiptReadAllowedNow, false);
  assert.equal(report.readiness.receiptPathRecorded, false);
  assert.equal(report.readiness.rawValuesRecorded, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("keeps review result schema redacted and requires separate import review", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.match(
    report.futureValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions.join("|"),
    /review_result_does_not_record_receipt_path/,
  );
  assert.match(
    report.futureValidationResultReceiptReviewResultBoundary.requiredReviewResultAssertions.join("|"),
    /review_result_requires_separate_permission_import_review/,
  );
  assert.match(
    report.futureValidationResultReceiptReviewResultBoundary.forbiddenReviewResultContent.join("|"),
    /app_secret/,
  );
  assert.doesNotMatch(serialized, /"appKey"|"appSecret"|"accessToken"/);
  assert.doesNotMatch(serialized, /rawAccountIdentifier|rawOperatorIdentifier|rawSessionToken/);
});

test("rejects stale review result if receipt, import, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.validationReceiptReviewRecordedNow = true;
  report.currentState.receiptPathRecorded = true;
  report.readiness.permissionPacketImportedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runReviewResult(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract\.json is out of date/,
  );
});

test("blocks if upstream review runbook, fixtures, or import preflight opens too early", () => {
  const workspace = makeWorkspace();
  const runbook = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  );
  runbook.readiness.currentStepReadsReceipt = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
    runbook,
  );
  const fixtures = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
  );
  fixtures.readiness.providerCallsAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
    fixtures,
  );
  const importPreflight = readJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_preflight.json");
  importPreflight.readiness.importImplementationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_preflight.json", importPreflight);

  const result = runReviewResult(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.reviewRunbookReady, false);
  assert.equal(report.checks.reviewRunbookValidatorFixturesReady, false);
  assert.equal(report.checks.importImplementationPreflightStillBlocked, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_validation_result_receipt_review_runbook_not_ready/,
  );
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures_not_ready/,
  );
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_implementation_preflight_not_blocked/);
});

test("blocks if private receipt, private packet, importer, adapter, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
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

  const result = runReviewResult(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
