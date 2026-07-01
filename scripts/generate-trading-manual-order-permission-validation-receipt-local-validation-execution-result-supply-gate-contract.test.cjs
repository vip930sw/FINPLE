const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-receipt-validation-result-supply-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
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

test("passes with current validation receipt local validation execution result supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract\.json/);
});

test("opens execution result supply gate without reading receipts or recording review result", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionValidationReceiptReviewResultAfterExecution, true);
  assert.equal(report.currentState.ownerLocalValidationReceiptExecutionResultSuppliedNow, false);
  assert.equal(report.currentState.currentStepRunsValidator, false);
  assert.equal(report.currentState.currentStepReadsValidationReceipt, false);
  assert.equal(report.currentState.currentStepReadsValidationResult, false);
  assert.equal(report.currentState.currentStepRecordsReviewResult, false);
  assert.equal(report.currentState.validationReceiptReviewRecordedNow, false);
  assert.equal(report.currentState.receiptPathRecorded, false);
  assert.equal(report.currentState.rawValuesRecorded, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if local validation execution preflight is no longer ready", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
  );
  preflight.readiness.readyForOwnerLocalValidationReceiptValidationExecution = false;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
    preflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /validation_receipt_local_validation_execution_preflight_not_ready/);
});

test("blocks if review result starts reading or recording receipt review too early", () => {
  const workspace = makeWorkspace();
  const reviewResult = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  );
  reviewResult.readiness.validationReceiptReviewRecordedNow = true;
  reviewResult.readiness.validationReceiptReadAllowedNow = true;
  reviewResult.readiness.receiptPathRecorded = true;
  reviewResult.readiness.rawValuesRecorded = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
    reviewResult,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /validation_result_receipt_review_result_no_longer_future_only/);
});

test("blocks if review runbook starts running validators or reading receipts early", () => {
  const workspace = makeWorkspace();
  const runbook = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  );
  runbook.readiness.currentStepRunsValidator = true;
  runbook.readiness.currentStepReadsReceipt = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
    runbook,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /validation_result_receipt_review_runbook_not_ready/);
});

test("blocks if private receipt, packet, adapter, route, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const privatePacketPath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  const privateReceiptPath = path.join(
    workspace,
    "data",
    "private",
    "trading",
    "manual_order_permission_validation_result_receipt.redacted.json",
  );
  const adapterPath = path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js");
  const routePath = path.join(workspace, "server", "src", "routes", "trading");
  const scenarioPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  fs.mkdirSync(path.dirname(privatePacketPath), { recursive: true });
  fs.writeFileSync(privatePacketPath, "{}\n");
  fs.writeFileSync(privateReceiptPath, "{}\n");
  fs.mkdirSync(path.dirname(adapterPath), { recursive: true });
  fs.writeFileSync(adapterPath, "module.exports = {};\n");
  fs.mkdirSync(routePath, { recursive: true });
  fs.writeFileSync(scenarioPath, "month,return\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptExecutionResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 5);
});
