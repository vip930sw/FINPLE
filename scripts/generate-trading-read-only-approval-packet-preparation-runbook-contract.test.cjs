const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-approval-packet-preparation-runbook-contract.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_approval_packet_preparation_runbook_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json",
  "trading_lab_step116_redacted_read_only_approval_template.json",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
  "trading_lab_step116_read_only_approval_import_preflight.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-packet-runbook-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
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

test("passes with current read-only approval packet preparation runbook", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_approval_packet_preparation_runbook_contract\.json/);
});

test("records owner-assisted packet preparation without creating hashes or packets", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook, true);
  assert.equal(report.currentState.rawInputsRequestedNow, false);
  assert.equal(report.currentState.privatePepperRequestedNow, false);
  assert.equal(report.currentState.hashGenerationAllowed, false);
  assert.equal(report.currentState.approvalPacketCreatedNow, false);
  assert.equal(report.currentState.approvalPacketImportedNow, false);
  assert.equal(report.currentState.providerCallsAllowed, false);
  assert.match(
    report.futureOwnerAssistedReadOnlyApprovalPacketPreparationRunbook.runbookSteps.join("|"),
    /confirm_render_env_is_mock_scope_without_copying_values/,
  );
  assert.match(
    report.futureOwnerAssistedReadOnlyApprovalPacketPreparationRunbook.requiredPacketFields.join("|"),
    /accountIdHash/,
  );
});

test("rejects stale contract when provider calls are manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallsAllowed = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_approval_packet_preparation_runbook_contract\.json is out of date/,
  );
});

test("blocks if the owner action queue starts requesting raw inputs", () => {
  const workspace = makeWorkspace();
  const queue = readJson(workspace, "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json");
  queue.readiness.ownerRawInputRequestedNow = true;
  queue.readiness.hashGenerationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json", queue);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook, false);
  assert.match(report.readiness.blockers.join("|"), /owner_read_only_evidence_action_queue_not_ready/);
});

test("blocks if hash preparation is no longer deferred", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_redacted_approval_hash_helper_preflight.json");
  preflight.readiness.ownerHashPreparationDeferred = false;
  preflight.readiness.hashGenerationAllowed = true;
  writeJson(workspace, "trading_lab_step116_redacted_approval_hash_helper_preflight.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_hash_helper_preflight_not_deferred/);
});

test("blocks if private packet or scenario monthly file appears too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerAssistedReadOnlyApprovalPacketPreparationRunbook, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
