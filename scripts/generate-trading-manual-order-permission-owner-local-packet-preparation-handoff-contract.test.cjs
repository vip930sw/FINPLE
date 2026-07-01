const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-owner-local-packet-preparation-handoff-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
  "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-owner-packet-handoff-"));
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

test("passes with current owner-local manual order permission packet preparation handoff", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /manual_order_permission_owner_local_packet_preparation_handoff_contract\.json/);
});

test("unlocks owner-local packet handoff while keeping reads, validation, imports, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForOwnerLocalPacketPreparationHandoff, true);
  assert.equal(report.readiness.ownerLocalPacketPreparationHandoffUnlocked, true);
  assert.equal(report.currentState.currentStepCreatesPermissionPacket, false);
  assert.equal(report.currentState.currentStepReadsPrivatePacket, false);
  assert.equal(report.currentState.currentStepRecordsPacketPath, false);
  assert.equal(report.currentState.currentStepRunsValidator, false);
  assert.equal(report.currentState.hashValuesRecordedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.futureOwnerLocalPacketPreparationHandoff.requiredOwnerLocalPacketFields.length, 24);
});

test("blocks if hash input decision is no longer unlocked", () => {
  const workspace = makeWorkspace();
  const decision = readJson(workspace, "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json");
  decision.readiness.ownerLocalHashInputPreparationUnlocked = false;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json", decision);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalPacketPreparationHandoff, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_hash_input_decision_not_ready/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("blocks if validation preflight starts reading the private packet now", () => {
  const workspace = makeWorkspace();
  const validation = readJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json");
  validation.readiness.ownerPacketReadAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json", validation);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalPacketPreparationHandoff, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_packet_validation_preflight_reads_packet_or_not_ready/,
  );
});

test("blocks if a private permission packet appears in the workspace", () => {
  const workspace = makeWorkspace();
  const privatePath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  fs.mkdirSync(path.dirname(privatePath), { recursive: true });
  fs.writeFileSync(privatePath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalPacketPreparationHandoff, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 1);
});
