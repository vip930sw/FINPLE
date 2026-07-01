const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-packet-preparation-checklist-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-packet-checklist-"));
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

test("passes with current manual order permission packet preparation checklist", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_packet_preparation_checklist_contract\.json/);
});

test("records owner-assisted checklist while keeping packet reads, imports, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist, true);
  assert.equal(report.currentState.currentStepCreatesPermissionPacket, false);
  assert.equal(report.currentState.currentStepReadsPrivatePacket, false);
  assert.equal(report.currentState.currentStepRunsValidator, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if manual order permission import preflight opens before owner packet evidence", () => {
  const workspace = makeWorkspace();
  const importPreflight = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  );
  importPreflight.readiness.readyForFutureManualOrderPermissionImportImplementationReview = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
    importPreflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_preflight_opened_too_early/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
}
);
