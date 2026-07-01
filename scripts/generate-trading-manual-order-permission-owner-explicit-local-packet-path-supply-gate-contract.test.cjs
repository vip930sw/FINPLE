const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const RECEIPT_VALIDATOR_PATH = path.join(
  "scripts",
  "validate-trading-manual-order-permission-validation-result-receipt.cjs",
);

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-owner-path-supply-gate-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  for (const scriptPath of [VALIDATOR_PATH, RECEIPT_VALIDATOR_PATH]) {
    const target = path.join(workspace, scriptPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(scriptPath, target);
  }
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

test("passes with current owner explicit local packet path supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract\.json/);
});

test("opens owner path supply gate without recording path, reading packet, running validator, or creating receipt", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForOwnerExplicitLocalPacketPathSupply, true);
  assert.equal(report.readiness.readyForManualOrderPermissionValidationReceiptAfterOwnerPath, true);
  assert.deepEqual(report.readiness.pendingExternalInputs, ["owner_explicit_local_redacted_packet_path"]);
  assert.equal(report.currentState.ownerLocalPacketPathSuppliedNow, false);
  assert.equal(report.currentState.ownerLocalPacketPathRecordedInRepo, false);
  assert.equal(report.currentState.currentStepReadsPrivatePacket, false);
  assert.equal(report.currentState.currentStepRunsValidator, false);
  assert.equal(report.currentState.currentStepRecordsValidationReceipt, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if explicit local packet validation receipt intake is no longer ready", () => {
  const workspace = makeWorkspace();
  const intake = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
  );
  intake.readiness.readyForOwnerSuppliedExplicitLocalPacketValidation = false;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
    intake,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerExplicitLocalPacketPathSupply, false);
  assert.match(report.readiness.blockers.join("|"), /explicit_local_packet_validation_receipt_intake_not_ready/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("blocks if validation receipt has already recorded a path or receipt too early", () => {
  const workspace = makeWorkspace();
  const receipt = readJson(workspace, "trading_lab_step116_manual_order_permission_validation_result_receipt.json");
  receipt.readiness.packetPathRecorded = true;
  receipt.readiness.validationReceiptRecordedNow = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_validation_result_receipt.json", receipt);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerExplicitLocalPacketPathSupply, false);
  assert.match(report.readiness.blockers.join("|"), /validation_result_receipt_no_longer_future_only/);
});

test("blocks if private packet, receipt, route, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const privatePacketPath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  const privateReceiptPath = path.join(
    workspace,
    "data",
    "private",
    "trading",
    "manual_order_permission_validation_result_receipt.redacted.json",
  );
  const routePath = path.join(workspace, "server", "src", "routes", "trading");
  const scenarioPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  fs.mkdirSync(path.dirname(privatePacketPath), { recursive: true });
  fs.writeFileSync(privatePacketPath, "{}\n");
  fs.writeFileSync(privateReceiptPath, "{}\n");
  fs.mkdirSync(routePath, { recursive: true });
  fs.writeFileSync(scenarioPath, "month,return\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerExplicitLocalPacketPathSupply, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 4);
});
