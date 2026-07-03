const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract.cjs",
);
const CONTRACT = "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_owner_evidence_intake_kit_contract.json",
  "trading_lab_step116_owner_evidence_receipt_schema_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-receipt-placeholders-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  if (fs.existsSync(path.join("data", "processed", CONTRACT))) {
    fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  }
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with the current owner evidence receipt placeholder bundle", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /owner_evidence_receipt_placeholder_bundle/);
});

test("records six repo-safe placeholders without private material or trading flags", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.receipts.length, 6);
  assert.equal(report.currentState.repoSafeReceiptPlaceholdersRecorded, true);
  assert.equal(report.currentState.actualPrivateEvidenceImported, false);
  for (const receipt of report.receipts) {
    assert.equal(receipt.ownerConfirmationStatus, "prepared_outside_repo_pending_receipt_review");
    assert.equal(receipt.redactionStatus, "owner_local_redacted_not_recorded_in_repo");
    assert.equal(receipt.noPrivateMaterialRecorded, true);
    assert.equal(Object.hasOwn(receipt, "actualLocalFilePath"), false);
    assert.equal(Object.hasOwn(receipt, "hashValue"), false);
    assert.equal(Object.hasOwn(receipt, "credential"), false);
    assert.equal(Object.hasOwn(receipt, "accountIdentifier"), false);
  }
  assert.equal(report.readiness.readyForOwnerEvidenceReceiptReview, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if receipt schema is not ready", () => {
  const workspace = makeWorkspace();
  const schema = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_schema_contract.json");
  schema.readiness.readyForRepoSafeReceiptPlaceholders = false;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_schema_contract.json", schema);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerEvidenceReceiptReview, false);
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_receipt_schema_not_ready/);
});

test("blocks if forbidden runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.forbiddenArtifactsAbsent, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_artifact_present/);
});
