const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-owner-read-only-evidence-action-queue-contract.cjs");
const CONTRACT = "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_read_only_approval_import_preflight.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_redacted_read_only_approval_template.json",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-read-only-evidence-action-queue-"));
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

test("passes with current owner read-only evidence action queue", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_owner_read_only_evidence_action_queue_contract\.json/);
});

test("records owner action items without requesting raw inputs or enabling trading", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerReadOnlyEvidenceActionQueue, true);
  assert.equal(report.ownerReadOnlyEvidenceActionQueue.ownerRawInputRequestedNow, false);
  assert.equal(report.ownerReadOnlyEvidenceActionQueue.hashGenerationAllowedNow, false);
  assert.match(report.ownerReadOnlyEvidenceActionQueue.requiredActionItems.join("|"), /prepare_account_id_hash/);
  assert.match(report.ownerReadOnlyEvidenceActionQueue.requiredActionItems.join("|"), /request_owner_import_review_later/);
  assert.equal(report.readiness.approvalPacketCreatedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("rejects stale contract when provider calls are manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.providerCallsAllowed = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_owner_read_only_evidence_action_queue_contract\.json is out of date/);
});

test("blocks if the redacted template is no longer ready", () => {
  const workspace = makeWorkspace();
  const template = readJson(workspace, "trading_lab_step116_redacted_read_only_approval_template.json");
  template.readiness.readyForOwnerRedactedApprovalPacketPreparation = false;
  template.readiness.approvalPacketCreatedNow = true;
  writeJson(workspace, "trading_lab_step116_redacted_read_only_approval_template.json", template);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerReadOnlyEvidenceActionQueue, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_read_only_approval_template_not_ready/);
});

test("blocks if hash preparation stops being deferred", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_redacted_approval_hash_helper_preflight.json");
  preflight.readiness.ownerHashPreparationDeferred = false;
  preflight.readiness.hashGenerationAllowed = true;
  writeJson(workspace, "trading_lab_step116_redacted_approval_hash_helper_preflight.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerReadOnlyEvidenceActionQueue, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_approval_hash_helper_preflight_not_deferred/);
});

test("blocks if private packet or hash helper artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerReadOnlyEvidenceActionQueue, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
