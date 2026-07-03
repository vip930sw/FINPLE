const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract.cjs",
);
const CONTRACT = "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-receipt-review-result-supply-"));
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

test("passes with the current owner evidence receipt review result supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /owner-evidence-receipt-review-result-supply-gate/);
});

test("opens only the supply gate and keeps review result and implementation locked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.currentState.supplyGateOnly, true);
  assert.equal(report.currentState.ownerEvidenceReceiptReviewResultSupplyGateOpen, true);
  assert.equal(report.currentState.ownerEvidenceReceiptReviewResultRecorded, false);
  assert.equal(report.currentState.actualPrivateEvidenceImported, false);
  assert.equal(report.currentState.actualTradingImplementationAllowed, false);
  assert.equal(report.currentState.publicDashboardImplementationAllowed, false);
  assert.equal(report.readiness.readyForOwnerEvidenceReceiptReviewResultRecordingPreflight, false);
  assert.equal(report.readiness.readyForActualTradingImplementation, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.reviewResultSchema.forbiddenFields.includes("actualLocalFilePath"), true);
  assert.equal(report.reviewResultSchema.forbiddenFields.includes("hashValue"), true);
});

test("blocks if the review preflight is not ready", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json");
  preflight.readiness.readyForOwnerEvidenceReceiptReviewResultSupplyGate = false;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.ownerEvidenceReceiptReviewResultSupplyGateOpen, false);
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_receipt_review_preflight_not_ready/);
});

test("blocks if a forbidden public UI artifact appears", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "components", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.forbiddenArtifactsAbsent, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_artifact_present/);
});

test("blocks if fail-closed flags drift open", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json");
  preflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.failClosedFlagsStayFalse, false);
  assert.match(report.readiness.blockers.join("|"), /fail_closed_flags_drifted_open/);
});
