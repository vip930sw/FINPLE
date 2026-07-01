const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-owner-order-path-assertion-contract.cjs");
const CONTRACT = "trading_lab_step116_owner_order_path_assertion_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_progress_summary.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-order-path-assertion-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const targetDocPath = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(targetDocPath), { recursive: true });
  fs.copyFileSync(DOC_PATH, targetDocPath);
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

test("passes with current owner order path assertion contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_owner_order_path_assertion_contract\.json/);
});

test("records owner order assertion while keeping orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.assertionRecordedWithOrdersBlocked, true);
  assert.equal(report.currentState.ownerOrderPathAssertionRecordedNow, true);
  assert.equal(report.currentState.ownerAssertionIsOrderSubmissionApproval, false);
  assert.equal(report.readiness.readyForManualOrderPermissionPacketPreparation, true);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.readyForLiveGuardedTrading, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.match(report.ownerOrderPathAssertion.acceptedBoundaries.join("|"), /no_provider_call_or_order_submission/);
});

test("rejects stale contract if order submission is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.ownerAssertionIsOrderSubmissionApproval = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_owner_order_path_assertion_contract\.json is out of date/);
});

test("blocks readiness if manual order permission import stops being blocked", () => {
  const workspace = makeWorkspace();
  const importPreflight = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  );
  importPreflight.readiness.readyForFutureManualOrderPermissionImportImplementationReview = true;
  importPreflight.readiness.ownerPrivatePermissionPacketAbsentNow = false;
  importPreflight.readiness.permissionPacketImportedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
    importPreflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.assertionRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_no_longer_blocked/);
});

test("blocks readiness if live guarded order adapter review opens early", () => {
  const workspace = makeWorkspace();
  const adapterPreflight = readJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  );
  adapterPreflight.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapterPreflight.readiness.orderAdapterImplementationAllowedNow = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
    adapterPreflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.assertionRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_no_longer_blocked/);
});

test("blocks if a premature KIS order adapter appears", () => {
  const workspace = makeWorkspace();
  const artifact = path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js");
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.assertionRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
