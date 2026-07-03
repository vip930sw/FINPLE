const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-live-trading-public-dashboard-unblock-preflight-contract.cjs",
);
const CONTRACT = "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
  "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-dashboard-unblock-preflight-"));
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

test("passes with the current live trading and public dashboard unblock preflight", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /live-trading-public-dashboard-unblock-preflight/);
});

test("keeps actual trading implementation and homepage dashboard rollout locked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.currentState.ownerEvidenceReceiptPlaceholdersRecorded, true);
  assert.equal(report.currentState.remainingTradingGateCount, 20);
  assert.equal(report.currentState.actualTradingImplementationAllowed, false);
  assert.equal(report.currentState.providerAdapterImplementationAllowed, false);
  assert.equal(report.currentState.privateWorkerImplementationAllowed, false);
  assert.equal(report.currentState.publicDashboardImplementationAllowed, false);
  assert.equal(report.currentState.homepageRouterChangeAllowed, false);
  assert.equal(report.readiness.readyForActualTradingImplementation, false);
  assert.equal(report.readiness.readyForPublicDashboardImplementation, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.requiredBeforeImplementation.includes("kill_switch_clearance_review_not_recorded"), true);
  assert.equal(report.requiredBeforeImplementation.includes("public_dashboard_router_review_not_recorded"), true);
});

test("blocks if owner evidence receipt placeholders are not ready", () => {
  const workspace = makeWorkspace();
  const receiptBundle = readJson(
    workspace,
    "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
  );
  receiptBundle.readiness.readyForOwnerEvidenceReceiptReview = false;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json", receiptBundle);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.status, "blocked_before_live_trading_public_dashboard_unblock_preflight");
  assert.match(report.readiness.blockers.join("|"), /owner_evidence_receipt_placeholders_not_ready/);
});

test("blocks if a forbidden runtime or public UI artifact appears", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "components", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.forbiddenArtifactsAbsent, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_artifact_present/);
});

test("blocks if fail-closed progress flags drift open", () => {
  const workspace = makeWorkspace();
  const progress = readJson(workspace, "trading_lab_step116_progress_summary.json");
  progress.readiness.publicUiAllowed = true;
  writeJson(workspace, "trading_lab_step116_progress_summary.json", progress);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.failClosedFlagsStayFalse, false);
  assert.match(report.readiness.blockers.join("|"), /fail_closed_flags_drifted_open/);
});
