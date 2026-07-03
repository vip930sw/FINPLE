const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-remaining-operational-gate-inventory-contract.cjs",
);
const CONTRACT = "trading_lab_step116_remaining_operational_gate_inventory_contract.json";
const REQUIRED_CONTRACTS = ["trading_lab_step116_progress_summary.json"];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-remaining-gate-inventory-"));
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

test("passes with the current fail-closed remaining gate inventory", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /remaining_operational_gate_inventory/);
});

test("classifies the 20 remaining gates without opening trading readiness", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.gateInventory.totalRemaining, 20);
  assert.equal(report.checks.ownerSuppliedGateCount, 6);
  assert.equal(report.checks.internalReviewGateCount, 9);
  assert.equal(report.checks.runtimeUiDbGateCount, 5);
  assert.equal(report.currentState.orderAuthorityExternalBlockerCleared, true);
  assert.equal(report.currentState.actualLiveTradingReadiness, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if a remaining gate disappears without classification update", () => {
  const workspace = makeWorkspace();
  const progress = readJson(workspace, "trading_lab_step116_progress_summary.json");
  progress.remainingTradingGates = progress.remainingTradingGates.filter(
    (gate) => gate !== "manual_order_permission_packet_not_imported",
  );
  writeJson(workspace, "trading_lab_step116_progress_summary.json", progress);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForRemainingOperationalGateReporting, false);
  assert.match(report.readiness.blockers.join("|"), /remaining_gate_count_changed/);
  assert.match(report.readiness.blockers.join("|"), /owner_supplied_gate_missing_manual_order_permission_packet_not_imported/);
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
