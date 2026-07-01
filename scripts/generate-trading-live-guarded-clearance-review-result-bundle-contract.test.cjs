const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-live-guarded-clearance-review-result-bundle-contract.cjs");
const CONTRACT = "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step1160_preflight.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-clearance-review-bundle-"));
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

test("passes with the current live-guarded clearance review result bundle contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /live_guarded_clearance_review_result_bundle_contract\.json/);
});

test("generates a fail-closed bundle boundary without recording private evidence", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedClearanceReviewResultBundle, true);
  assert.equal(report.currentState.currentStepRecordsBundleResult, false);
  assert.equal(report.currentState.currentStepReadsPrivateEvidence, false);
  assert.equal(report.currentState.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.blockers.length, 0);
});

test("blocks the bundle if live-guarded order adapter review is opened early", () => {
  const workspace = makeWorkspace();
  const adapterPreflight = readJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  );
  adapterPreflight.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  writeJson(
    workspace,
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
    adapterPreflight,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureLiveGuardedClearanceReviewResultBundle, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_review_opened_too_early/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});
