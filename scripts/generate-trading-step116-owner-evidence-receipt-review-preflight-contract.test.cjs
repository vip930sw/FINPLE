const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-owner-evidence-receipt-review-preflight-contract.cjs",
);
const CONTRACT = "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_owner_evidence_receipt_schema_contract.json",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
  "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-owner-evidence-receipt-review-preflight-"));
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

test("passes with the current owner evidence receipt review preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /owner-evidence-receipt-review-preflight/);
});

test("opens only the repo-safe result supply gate while keeping implementation locked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.currentState.ownerEvidenceReceiptReviewResultRecorded, false);
  assert.equal(report.currentState.actualPrivateEvidenceImported, false);
  assert.equal(report.readiness.readyForOwnerEvidenceReceiptReviewResultSupplyGate, true);
  assert.equal(report.readiness.readyForActualTradingImplementation, false);
  assert.equal(report.readiness.readyForPublicDashboardImplementation, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.requiredReviewAssertions.includes("review_result_must_not_include_actual_local_paths"), true);
});

test("blocks if owner evidence receipt placeholders are not ready", () => {
  const workspace = makeWorkspace();
  const bundle = readJson(workspace, "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json");
  bundle.readiness.readyForOwnerEvidenceReceiptReview = false;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json", bundle);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForOwnerEvidenceReceiptReviewResultSupplyGate, false);
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_receipt_placeholders_not_ready/);
});

test("blocks if a forbidden runtime artifact appears", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.forbiddenArtifactsAbsent, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_artifact_present/);
});

test("blocks if fail-closed flags drift open", () => {
  const workspace = makeWorkspace();
  const livePreflight = readJson(
    workspace,
    "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json",
  );
  livePreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json", livePreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.failClosedFlagsStayFalse, false);
  assert.match(report.readiness.blockers.join("|"), /fail_closed_flags_drifted_open/);
});
