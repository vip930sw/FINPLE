const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-import-implementation-review-result-supply-gate-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json",
  "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-import-review-result-supply-"));
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

test("passes with current import implementation review result supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_import_implementation_review_result_supply_gate_contract\.json/);
});

test("opens result supply gate without reading, recording, importing, or implementing", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, true);
  assert.equal(report.readiness.readyForPermissionImportAfterReviewResult, false);
  assert.equal(report.readiness.readyForKillSwitchClearanceReviewAfterPermissionImport, false);
  assert.equal(report.currentState.ownerReviewResultSuppliedNow, false);
  assert.equal(report.currentState.currentStepReadsReviewResult, false);
  assert.equal(report.currentState.currentStepReadsPrivatePacket, false);
  assert.equal(report.currentState.currentStepRecordsReviewResult, false);
  assert.equal(report.currentState.permissionPacketImportedNow, false);
  assert.equal(report.currentState.importImplementationAllowedNow, false);
  assert.equal(report.currentState.orderAdapterImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if result recording preflight is no longer ready", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
  );
  preflight.readiness.readyForManualOrderPermissionImportImplementationReviewResultRecordingPreflight = false;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
    preflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_import_implementation_review_result_recording_preflight_not_ready/,
  );
});

test("blocks if import implementation review starts enabling packet reads, import, or orders", () => {
  const workspace = makeWorkspace();
  const review = readJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json");
  review.readiness.ownerPacketReadAllowedNow = true;
  review.readiness.permissionPacketImportedNow = true;
  review.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json", review);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_implementation_review_contract_not_ready/);
});

test("blocks if import review preflight starts importing or submitting too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json");
  preflight.readiness.permissionPacketImportedNow = true;
  preflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_review_preflight_not_ready/);
});

test("blocks if clearance sequence records later evidence too early", () => {
  const workspace = makeWorkspace();
  const sequence = readJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json");
  sequence.readiness.allClearanceResultsRecorded = true;
  sequence.readiness.liveGuardedAdapterReviewStarted = true;
  sequence.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json", sequence);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_internal_gate_sequence_no_longer_ordered/);
});

test("blocks if private packet, import service, adapter, route, UI, DB, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForManualOrderPermissionImportImplementationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 8);
});
