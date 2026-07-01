const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-import-review-preflight-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-import-review-preflight-"));
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

test("passes with current manual order permission import review preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_import_review_preflight_contract\.json/);
});

test("opens import review preflight while permission import remains blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForManualOrderPermissionImportReviewPreflight, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportImplementationReview, false);
  assert.equal(report.readiness.readyForKillSwitchClearanceReviewAfterPermissionImport, false);
  assert.equal(report.currentState.ownerRedactedValidationReceiptReviewResultSuppliedNow, false);
  assert.equal(report.currentState.currentStepReadsValidationReceipt, false);
  assert.equal(report.currentState.currentStepReadsReviewResult, false);
  assert.equal(report.currentState.currentStepRecordsReviewResult, false);
  assert.equal(report.currentState.ownerPacketReadAllowedNow, false);
  assert.equal(report.currentState.permissionPacketImportedNow, false);
  assert.equal(report.currentState.importImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if review result supply gate is no longer ready", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
  );
  supplyGate.readiness.readyForManualOrderPermissionValidationReceiptReviewResultSupply = false;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
    supplyGate,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportReviewPreflight, false);
  assert.match(report.readiness.blockers.join("|"), /validation_receipt_review_result_supply_gate_not_ready/);
});

test("blocks if import implementation preflight starts allowing private reads or runtime work", () => {
  const workspace = makeWorkspace();
  const importPreflight = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  );
  importPreflight.readiness.readyForFutureManualOrderPermissionImportImplementationReview = true;
  importPreflight.readiness.importImplementationAllowedNow = true;
  importPreflight.readiness.ownerPacketReadAllowedNow = true;
  importPreflight.readiness.permissionPacketImportedNow = true;
  importPreflight.readiness.providerCallsAllowed = true;
  importPreflight.readiness.orderSubmissionAllowed = true;
  importPreflight.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_preflight.json", importPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportReviewPreflight, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_import_implementation_preflight_no_longer_blocked/,
  );
});

test("blocks if clearance sequence records later evidence too early", () => {
  const workspace = makeWorkspace();
  const sequence = readJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json");
  sequence.readiness.validationReceiptEvidenceRecorded = true;
  sequence.readiness.allClearanceResultsRecorded = true;
  sequence.readiness.liveGuardedAdapterReviewStarted = true;
  sequence.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json", sequence);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportReviewPreflight, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_internal_gate_sequence_no_longer_ordered/);
});

test("blocks if private packet, import service, adapter, route, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const privatePacketPath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  const importServicePath = path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js");
  const adapterPath = path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js");
  const routePath = path.join(workspace, "server", "src", "routes", "trading");
  const scenarioPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  fs.mkdirSync(path.dirname(privatePacketPath), { recursive: true });
  fs.writeFileSync(privatePacketPath, "{}\n");
  fs.mkdirSync(path.dirname(importServicePath), { recursive: true });
  fs.writeFileSync(importServicePath, "module.exports = {};\n");
  fs.writeFileSync(adapterPath, "module.exports = {};\n");
  fs.mkdirSync(routePath, { recursive: true });
  fs.writeFileSync(scenarioPath, "month,return\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportReviewPreflight, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 5);
});
