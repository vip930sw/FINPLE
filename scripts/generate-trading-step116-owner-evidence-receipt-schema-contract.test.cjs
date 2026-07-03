const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-step116-owner-evidence-receipt-schema-contract.cjs");
const CONTRACT = "trading_lab_step116_owner_evidence_receipt_schema_contract.json";
const RUNBOOK = path.join("docs", "trading", "FINPLE_STEP116_OWNER_EVIDENCE_INTAKE_RUNBOOK_2026_07_03.md");
const REQUIRED_CONTRACTS = ["trading_lab_step116_owner_evidence_intake_kit_contract.json"];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-receipt-schema-"));
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
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with the current owner evidence receipt schema", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /owner_evidence_receipt_schema/);
});

test("allows only non-sensitive receipt fields and keeps trading flags closed", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.receiptSchema.allowedFields.includes("itemLabel"), true);
  assert.equal(report.receiptSchema.allowedFields.includes("noPrivateMaterialRecorded"), true);
  assert.equal(report.receiptSchema.forbiddenFields.includes("actualLocalFilePath"), true);
  assert.equal(report.receiptSchema.forbiddenFields.includes("hashValue"), true);
  assert.equal(report.receiptSchema.forbiddenFields.includes("credential"), true);
  assert.equal(report.currentState.ownerLocalEvidencePreparedOutsideRepo, true);
  assert.equal(report.currentState.receiptSchemaReady, true);
  assert.equal(report.readiness.readyForRepoSafeReceiptPlaceholders, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if the owner evidence intake kit is not ready", () => {
  const workspace = makeWorkspace();
  const intakeKit = readJson(workspace, "trading_lab_step116_owner_evidence_intake_kit_contract.json");
  intakeKit.readiness.readyForOwnerEvidenceIntake = false;
  writeJson(workspace, "trading_lab_step116_owner_evidence_intake_kit_contract.json", intakeKit);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForRepoSafeReceiptPlaceholders, false);
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_intake_kit_not_ready/);
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
