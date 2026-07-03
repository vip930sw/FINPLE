const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-owner-evidence-receipt-review-result-recording-bundle-contract.cjs",
);
const REQUIRED_CONTRACTS = ["trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json"];
const OUTPUT_CONTRACTS = [
  "trading_lab_step116_owner_evidence_receipt_review_result_recording_preflight_contract.json",
  "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-receipt-review-recording-bundle-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  for (const fileName of OUTPUT_CONTRACTS) {
    if (fs.existsSync(path.join("data", "processed", fileName))) {
      fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
    }
  }
  return workspace;
}

function runBundle(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with the current owner evidence receipt review result recording bundle", () => {
  const workspace = makeWorkspace();
  const result = runBundle(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /recording-bundle/);
});

test("writes three recording contracts while keeping implementation locked", () => {
  const workspace = makeWorkspace();
  const result = runBundle(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  for (const fileName of OUTPUT_CONTRACTS) {
    const report = readJson(workspace, fileName);
    assert.equal(report.currentState.bundleManaged, true);
    assert.equal(report.currentState.ownerEvidenceReceiptReviewResultRecorded, false);
    assert.equal(report.currentState.actualPrivateEvidenceImported, false);
    assert.equal(report.currentState.actualTradingImplementationAllowed, false);
    assert.equal(report.currentState.publicDashboardImplementationAllowed, false);
    assert.equal(report.readiness.readyForActualTradingImplementation, false);
    assert.equal(report.readiness.providerCallsAllowed, false);
    assert.equal(report.readiness.orderSubmissionAllowed, false);
    assert.equal(report.readiness.runtimeRouteAllowed, false);
    assert.equal(report.readiness.publicUiAllowed, false);
    assert.equal(report.readiness.dbMigrationAllowed, false);
    assert.equal(report.redactedReviewResultSchema.forbiddenFields.includes("actualLocalFilePath"), true);
    assert.equal(report.redactedReviewResultSchema.forbiddenFields.includes("hashValue"), true);
  }
});

test("blocks all bundle contracts if the supply gate is not ready", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json");
  supplyGate.readiness.status = "blocked_before_owner_evidence_receipt_review_result_supply_gate";
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json", supplyGate);

  const result = runBundle(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  for (const fileName of OUTPUT_CONTRACTS) {
    const report = readJson(workspace, fileName);
    assert.match(report.readiness.blockers.join("|"), /owner_evidence_receipt_review_result_supply_gate_not_ready/);
  }
});

test("blocks if forbidden runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runBundle(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  for (const fileName of OUTPUT_CONTRACTS) {
    const report = readJson(workspace, fileName);
    assert.equal(report.checks.forbiddenArtifactsAbsent, false);
    assert.match(report.readiness.blockers.join("|"), /forbidden_artifact_present/);
  }
});

test("blocks if fail-closed flags drift open", () => {
  const workspace = makeWorkspace();
  const supplyGate = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json");
  supplyGate.readiness.publicUiAllowed = true;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json", supplyGate);

  const result = runBundle(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  for (const fileName of OUTPUT_CONTRACTS) {
    const report = readJson(workspace, fileName);
    assert.equal(report.checks.failClosedFlagsStayFalse, false);
    assert.match(report.readiness.blockers.join("|"), /fail_closed_flags_drifted_open/);
  }
});
