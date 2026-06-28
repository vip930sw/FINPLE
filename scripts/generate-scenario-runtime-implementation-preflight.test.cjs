const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-runtime-implementation-preflight.cjs");
const BOOTSTRAP_PREFLIGHT = "scenario_bootstrap_unlock_preflight.json";
const RUNTIME_PREFLIGHT = "scenario_runtime_implementation_preflight.json";
const MONTHLY = "scenario_monthly_returns.csv";

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-runtime-implementation-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [BOOTSTRAP_PREFLIGHT, RUNTIME_PREFLIGHT]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeWorkspaceJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function mutateJson(workspace, fileName, patch) {
  const value = readWorkspaceJson(workspace, fileName);
  patch(value);
  writeWorkspaceJson(workspace, fileName, value);
}

function writeMonthlyFile(workspace) {
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), "fixture only\n");
}

function makeRuntimeReady(workspace) {
  mutateJson(workspace, BOOTSTRAP_PREFLIGHT, (value) => {
    value.checks.monthlyFileExists = true;
    value.checks.monthlyValidatorPassed = true;
    value.checks.monthlyReadinessReady = true;
    value.checks.monthlyWriteComplete = true;
    value.checks.monthlyCacheWriterComplete = true;
    value.checks.safeToRunJointBlockBootstrap = true;
    value.checks.monthlyDataRows = 2;
    value.checks.blockers = [];
    value.readiness.status = "ready_for_runtime_scenario_implementation_review";
    value.readiness.safeToRunJointBlockBootstrap = true;
    value.readiness.scenarioApiAllowed = true;
    value.readiness.compareChartScenarioBandsAllowed = true;
    value.readiness.calculatePortfolioResultChangesAllowed = true;
    value.readiness.bootstrapStillBlocked = false;
    value.readiness.nextAllowedStep = "review_runtime_scenario_implementation_boundary";
  });
}

test("passes with current blocked runtime implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_runtime_implementation_preflight\.json/);
});

test("keeps current committed runtime implementation preflight blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, RUNTIME_PREFLIGHT);
  assert.equal(report.checks.monthlyFileExists, false);
  assert.equal(report.checks.bootstrapUnlockReady, false);
  assert.equal(report.checks.scenarioApiReviewApproved, false);
  assert.equal(report.checks.compareChartReviewApproved, false);
  assert.equal(report.checks.calculationReviewApproved, false);
  assert.equal(report.checks.runtimeScenarioImplementationAllowed, false);
  assert.equal(report.readiness.safeToImplementScenarioApi, false);
  assert.equal(report.readiness.safeToImplementCompareChartScenarioBands, false);
  assert.equal(report.readiness.safeToModifyCalculatePortfolioResult, false);
  assert.equal(report.readiness.probabilityScenarioCalculationAllowed, false);
});

test("opens only after monthly file, bootstrap unlock, and runtime review flags are present", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace);
  makeRuntimeReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, RUNTIME_PREFLIGHT);
  assert.equal(report.checks.monthlyFileExists, true);
  assert.equal(report.checks.bootstrapUnlockReady, true);
  assert.equal(report.checks.scenarioApiReviewApproved, true);
  assert.equal(report.checks.compareChartReviewApproved, true);
  assert.equal(report.checks.calculationReviewApproved, true);
  assert.equal(report.checks.runtimeScenarioImplementationAllowed, true);
  assert.equal(report.readiness.status, "ready_for_runtime_scenario_implementation");
});

test("stays blocked when scenario API runtime review is not approved", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace);
  makeRuntimeReady(workspace);
  mutateJson(workspace, BOOTSTRAP_PREFLIGHT, (value) => {
    value.readiness.scenarioApiAllowed = false;
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, RUNTIME_PREFLIGHT);
  assert.equal(report.checks.bootstrapUnlockReady, true);
  assert.equal(report.checks.scenarioApiReviewApproved, false);
  assert.equal(report.readiness.safeToImplementScenarioApi, false);
  assert.match(report.checks.blockers.join(","), /scenario_api_runtime_review_not_approved/);
});

test("rejects ready bootstrap preflight without monthly CSV", () => {
  const workspace = makeWorkspace();
  makeRuntimeReady(workspace);

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv missing while bootstrap unlock preflight reports ready/);
});

test("rejects stale committed runtime implementation preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, RUNTIME_PREFLIGHT);
  report.checks.runtimeScenarioImplementationAllowed = true;
  writeWorkspaceJson(workspace, RUNTIME_PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_runtime_implementation_preflight\.json is out of date/);
});
