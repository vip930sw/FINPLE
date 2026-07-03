const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-step116-owner-evidence-intake-kit-contract.cjs");
const CONTRACT = "trading_lab_step116_owner_evidence_intake_kit_contract.json";
const RUNBOOK = path.join("docs", "trading", "FINPLE_STEP116_OWNER_EVIDENCE_INTAKE_RUNBOOK_2026_07_03.md");
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
  "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-intake-kit-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  if (fs.existsSync(path.join("data", "processed", CONTRACT))) {
    fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  }
  const runbookTarget = path.join(workspace, RUNBOOK);
  fs.mkdirSync(path.dirname(runbookTarget), { recursive: true });
  fs.copyFileSync(RUNBOOK, runbookTarget);
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

test("passes with the current owner evidence intake kit", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /owner_evidence_intake_kit/);
});

test("records the six owner-local intake items without opening trading flags", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.ownerLocalOnlyIntakeItems.length, 6);
  assert.equal(report.currentState.ownerSuppliedPrivateEvidenceOrResultRequired, 6);
  assert.equal(report.repoSafeReceiptRules.allowedReceiptFacts.includes("no_private_material_recorded_statement"), true);
  assert.equal(report.repoSafeReceiptRules.forbiddenReceiptContent.includes("actual_local_file_path"), true);
  assert.equal(report.repoSafeReceiptRules.forbiddenReceiptContent.includes("hash_value"), true);
  assert.equal(report.readiness.readyForOwnerEvidenceIntake, true);
  assert.equal(report.readiness.readyForReadOnlyProviderCalls, false);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.readyForLiveGuardedTrading, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if the runbook loses private-material warnings", () => {
  const workspace = makeWorkspace();
  const runbookPath = path.join(workspace, RUNBOOK);
  const runbook = fs.readFileSync(runbookPath, "utf8").replace(
    "Do not paste raw values, local file paths, hash values, credentials, account identifiers",
    "Prepare owner evidence",
  );
  fs.writeFileSync(runbookPath, runbook);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerEvidenceIntake, false);
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_intake_runbook_missing_required_phrases/);
});

test("blocks if remaining operational gate inventory is no longer ready", () => {
  const workspace = makeWorkspace();
  const inventory = readJson(workspace, "trading_lab_step116_remaining_operational_gate_inventory_contract.json");
  inventory.readiness.readyForRemainingOperationalGateReporting = false;
  writeJson(workspace, "trading_lab_step116_remaining_operational_gate_inventory_contract.json", inventory);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerEvidenceIntake, false);
  assert.match(report.readiness.blockers.join("|"), /remaining_operational_gate_inventory_not_ready/);
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
