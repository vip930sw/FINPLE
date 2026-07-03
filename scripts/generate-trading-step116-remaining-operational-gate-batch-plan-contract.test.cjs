const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-step116-remaining-operational-gate-batch-plan-contract.cjs",
);
const CONTRACT = "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-remaining-gate-batch-plan-"));
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

test("passes with the current remaining operational gate batch plan", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /remaining_operational_gate_batch_plan/);
});

test("reports how many gates remain without opening implementation or trading flags", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);

  assert.equal(report.batchPlan.answerToHowManyRemain.operationalGatesRemaining, 20);
  assert.equal(report.batchPlan.answerToHowManyRemain.ownerSuppliedPrivateEvidenceOrResultRequiredCount, 6);
  assert.equal(report.batchPlan.answerToHowManyRemain.internalReviewOrOperatorGateRequiredCount, 9);
  assert.equal(report.batchPlan.answerToHowManyRemain.runtimeUiDbStillBlockedCount, 5);
  assert.equal(report.checks.batchPlanDoesNotImplementProviderAdapter, true);
  assert.equal(report.checks.batchPlanDoesNotImplementWorker, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if the inventory is not ready", () => {
  const workspace = makeWorkspace();
  const inventory = readJson(workspace, "trading_lab_step116_remaining_operational_gate_inventory_contract.json");
  inventory.readiness.readyForRemainingOperationalGateReporting = false;
  writeJson(workspace, "trading_lab_step116_remaining_operational_gate_inventory_contract.json", inventory);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForBatchReporting, false);
  assert.match(report.readiness.blockers.join("|"), /remaining_operational_gate_inventory_not_ready/);
});
