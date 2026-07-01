const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-live-guarded-internal-gate-clearance-sequence-contract.cjs",
);
const CONTRACT = "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step1160_preflight.json",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-gate-sequence-"));
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

test("passes with current live-guarded internal gate clearance sequence", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract\.json/);
});

test("opens only owner-local packet preparation while keeping all runtime effects blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  const openedStages = report.clearanceSequence.filter((stage) => stage.openedForNextAction).map((stage) => stage.id);
  const recordedStages = report.clearanceSequence.filter((stage) => stage.evidenceRecordedNow).map((stage) => stage.id);

  assert.deepEqual(openedStages, ["owner_prepared_manual_permission_packet"]);
  assert.deepEqual(recordedStages, []);
  assert.equal(report.readiness.readyForSequentialInternalGateReview, true);
  assert.equal(report.readiness.ownerLocalManualPacketPreparationUnlocked, true);
  assert.equal(report.readiness.validationReceiptEvidenceRecorded, false);
  assert.equal(report.readiness.allClearanceResultsRecorded, false);
  assert.equal(report.readiness.liveGuardedAdapterReviewStarted, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("blocks if live-guarded adapter review opens before prior results are recorded", () => {
  const workspace = makeWorkspace();
  const adapterPreflight = readJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json");
  adapterPreflight.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapterPreflight.readiness.orderAdapterImplementationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json", adapterPreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForSequentialInternalGateReview, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_adapter_review_opened_too_early/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("blocks if a private permission packet is committed into the repo workspace", () => {
  const workspace = makeWorkspace();
  const privatePacketPath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  fs.mkdirSync(path.dirname(privatePacketPath), { recursive: true });
  fs.writeFileSync(privatePacketPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForSequentialInternalGateReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact_present/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 1);
});
