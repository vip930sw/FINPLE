const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-validation-receipt-local-validation-execution-preflight-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt.cjs",
);

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-receipt-local-validation-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  const validatorTarget = path.join(workspace, RECEIPT_VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(RECEIPT_VALIDATOR_PATH, validatorTarget);
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

test("passes with current validation receipt local validation execution preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_validation_receipt_local_validation_execution_preflight_contract\.json/);
});

test("opens local validation execution preflight without running validator or reading receipt", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptValidationExecution, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionValidationReceiptReview, true);
  assert.equal(report.currentState.ownerLocalValidationReceiptPathSuppliedNow, false);
  assert.equal(report.currentState.currentStepRunsValidator, false);
  assert.equal(report.currentState.validationReceiptReadAllowedNow, false);
  assert.equal(report.currentState.currentStepReadsValidationReceipt, false);
  assert.equal(report.currentState.currentStepRecordsValidationReceipt, false);
  assert.equal(report.currentState.validationReceiptRecordedNow, false);
  assert.equal(report.currentState.packetPathRecorded, false);
  assert.equal(report.currentState.rawValuesRecorded, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if receipt path supply gate is no longer ready", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
  );
  supplyGate.readiness.readyForOwnerExplicitLocalValidationReceiptPathSupply = false;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
    supplyGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptValidationExecution, false);
  assert.match(report.readiness.blockers.join("|"), /validation_receipt_path_supply_gate_not_ready/);
});

test("blocks if validation receipt contract records receipt, path, or raw values too early", () => {
  const workspace = makeWorkspace();
  const receipt = readJson(workspace, "trading_lab_step116_manual_order_permission_validation_result_receipt.json");
  receipt.readiness.validationReceiptRecordedNow = true;
  receipt.readiness.packetPathRecorded = true;
  receipt.readiness.rawValuesRecorded = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_validation_result_receipt.json", receipt);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptValidationExecution, false);
  assert.match(report.readiness.blockers.join("|"), /validation_result_receipt_no_longer_future_only/);
});

test("blocks if receipt review preflight starts reading or recording receipts early", () => {
  const workspace = makeWorkspace();
  const review = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
  );
  review.readiness.validationReceiptReadAllowedNow = true;
  review.readiness.validationReceiptRecordedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
    review,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptValidationExecution, false);
  assert.match(report.readiness.blockers.join("|"), /validation_result_receipt_review_preflight_no_longer_closed/);
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
  assert.equal(report.readiness.readyForOwnerLocalValidationReceiptValidationExecution, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 5);
});
