const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-hash-input-decision-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
  "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-hash-input-decision-"));
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

test("passes with current manual order permission hash input decision", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_hash_input_decision_contract\.json/);
});

test("unlocks owner-local hash input preparation without recording raw inputs or hash values", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.readiness.readyForOwnerLocalHashInputPreparation, true);
  assert.equal(report.readiness.ownerLocalHashInputPreparationUnlocked, true);
  assert.equal(report.currentState.rawInputsRequestedNow, false);
  assert.equal(report.currentState.privatePepperRequestedNow, false);
  assert.equal(report.currentState.hashGenerationAllowed, false);
  assert.equal(report.currentState.hashValuesRecordedNow, false);
  assert.equal(report.currentState.permissionPacketCreatedNow, false);
  assert.equal(report.currentState.permissionPacketImportedNow, false);
  assert.equal(report.currentState.validationRunNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.ownerLocalHashInputDecision.approvedHashInputLabels.length, 12);
});

test("blocks if KIS terms permission assertion stops being cleared", () => {
  const workspace = makeWorkspace();
  const terms = readJson(workspace, "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json");
  terms.readiness.termsPermissionExternalBlockerCleared = false;
  writeJson(workspace, "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json", terms);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalHashInputPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /kis_terms_permission_external_blocker_not_cleared/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("blocks if validation preflight starts reading private packet in this step", () => {
  const workspace = makeWorkspace();
  const validation = readJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json");
  validation.readiness.ownerPacketReadAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json", validation);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalHashInputPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /validation_preflight_not_ready_or_reads_packet/);
});

test("blocks if a private hash input file is committed into the workspace", () => {
  const workspace = makeWorkspace();
  const privatePath = path.join(workspace, "data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json");
  fs.mkdirSync(path.dirname(privatePath), { recursive: true });
  fs.writeFileSync(privatePath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerLocalHashInputPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact_present/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 1);
});
