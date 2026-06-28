const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-bootstrap-unlock-preflight.cjs");
const MONTHLY_READINESS = "scenario_monthly_input_readiness.json";
const MONTHLY_WRITE_PREFLIGHT = "scenario_monthly_write_preflight.json";
const MONTHLY_CACHE_WRITER_PREFLIGHT = "scenario_p0_monthly_cache_writer_preflight.json";
const BOOTSTRAP_PREFLIGHT = "scenario_bootstrap_unlock_preflight.json";
const MONTHLY_SCHEMA = "scenario_monthly_returns.schema.csv";
const MONTHLY = "scenario_monthly_returns.csv";
const HEADER = [
  "market",
  "ticker",
  "month",
  "priceReturn",
  "totalReturn",
  "closePrice",
  "adjustedClose",
  "dividendAmount",
  "benchmarkId",
  "benchmarkReturn",
  "fxReturn",
  "returnBasis",
  "currency",
  "isProxy",
  "proxyTicker",
  "dataSource",
  "sourceVersion",
  "seriesQuality",
  "reasonCodes",
].join(",");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-bootstrap-unlock-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [MONTHLY_READINESS, MONTHLY_WRITE_PREFLIGHT, MONTHLY_CACHE_WRITER_PREFLIGHT, BOOTSTRAP_PREFLIGHT, MONTHLY_SCHEMA]) {
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

function writeMonthlyFile(workspace, rows) {
  const content = [HEADER, ...rows, ""].join("\n");
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), content);
}

function writeValidMonthlyFile(workspace) {
  writeMonthlyFile(workspace, [
    "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,0.018,,total_return,USD,no,,fixture,2026-06-28,A,",
    "KR,069500,2025-01,0.01,0.011,40000,40010,10,KOSPI200_TR,0.009,0.002,total_return,KRW,no,,fixture,2026-06-28,A,",
  ]);
}

function makeBootstrapReady(workspace) {
  mutateJson(workspace, MONTHLY_READINESS, (value) => {
    value.monthlyInput.dataFilePresent = true;
    value.monthlyInput.dataRowCount = 2;
    value.monthlyInput.status = "present_requires_validator";
    value.readiness.readyForJointBlockBootstrap = true;
    value.readiness.status = "ready_requires_downstream_review";
    value.readiness.blockers = [];
  });
  mutateJson(workspace, MONTHLY_WRITE_PREFLIGHT, (value) => {
    value.checks.monthlyFileExists = true;
    value.checks.safeToWriteMonthlyData = true;
    value.checks.providerCallsAllowed = true;
    value.checks.canAttemptMonthlyWrite = true;
    value.checks.blockers = [];
    value.readiness.status = "monthly_file_present_after_preflight_approval";
    value.readiness.monthlyDataFileWritten = true;
    value.readiness.bootstrapStillBlocked = false;
  });
  mutateJson(workspace, MONTHLY_CACHE_WRITER_PREFLIGHT, (value) => {
    value.checks.adapterReady = true;
    value.checks.approvalReady = true;
    value.checks.monthlyWriteReady = true;
    value.checks.writerGateReady = true;
    value.checks.allSourcePolicyRowsApproved = true;
    value.checks.providerCallsAllowed = true;
    value.checks.safeToImplementMonthlyCacheWriter = false;
    value.checks.monthlyFileExists = true;
    value.checks.approvedSourcePolicyRows = value.checks.sourcePolicyRows;
    value.checks.blockers = [];
    value.readiness.status = "monthly_cache_writer_completed_after_manual_review";
    value.readiness.safeToImplementMonthlyCacheWriter = false;
    value.readiness.providerCallsAllowed = true;
    value.readiness.monthlyDataFileWritten = true;
    value.readiness.bootstrapStillBlocked = false;
  });
}

test("passes with current blocked bootstrap unlock preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_bootstrap_unlock_preflight\.json/);
});

test("keeps current committed bootstrap unlock preflight blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, BOOTSTRAP_PREFLIGHT);
  assert.equal(report.checks.monthlyFileExists, false);
  assert.equal(report.checks.monthlyValidatorPassed, false);
  assert.equal(report.checks.safeToRunJointBlockBootstrap, false);
  assert.equal(report.readiness.scenarioApiAllowed, false);
  assert.equal(report.readiness.compareChartScenarioBandsAllowed, false);
  assert.equal(report.readiness.calculatePortfolioResultChangesAllowed, false);
});

test("opens only after valid monthly data and all write evidence are present", () => {
  const workspace = makeWorkspace();
  writeValidMonthlyFile(workspace);
  makeBootstrapReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, BOOTSTRAP_PREFLIGHT);
  assert.equal(report.checks.monthlyFileExists, true);
  assert.equal(report.checks.monthlyValidatorPassed, true);
  assert.equal(report.checks.monthlyReadinessReady, true);
  assert.equal(report.checks.monthlyWriteComplete, true);
  assert.equal(report.checks.monthlyCacheWriterComplete, true);
  assert.equal(report.checks.safeToRunJointBlockBootstrap, true);
  assert.equal(report.readiness.status, "ready_for_joint_block_bootstrap_review");
});

test("rejects invalid monthly data even when synthetic write evidence is ready", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace, [
    "US,SPY,2025-01,0.02,,500,501,0.1,SP500_TR,,,total_return,USD,no,,fixture,2026-06-28,A,",
  ]);
  makeBootstrapReady(workspace);

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /monthly input validator failed/);
});

test("rejects monthly data when monthly write completion is not recorded", () => {
  const workspace = makeWorkspace();
  writeValidMonthlyFile(workspace);
  makeBootstrapReady(workspace);
  mutateJson(workspace, MONTHLY_WRITE_PREFLIGHT, (value) => {
    value.readiness.bootstrapStillBlocked = true;
  });

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exists before monthly write preflight records a completed write/);
});

test("rejects monthly data when monthly cache writer completion is not recorded", () => {
  const workspace = makeWorkspace();
  writeValidMonthlyFile(workspace);
  makeBootstrapReady(workspace);
  mutateJson(workspace, MONTHLY_CACHE_WRITER_PREFLIGHT, (value) => {
    value.readiness.monthlyDataFileWritten = false;
  });

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exists before monthly cache writer completion is recorded/);
});

test("rejects stale committed bootstrap unlock preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, BOOTSTRAP_PREFLIGHT);
  report.checks.safeToRunJointBlockBootstrap = true;
  writeWorkspaceJson(workspace, BOOTSTRAP_PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_bootstrap_unlock_preflight\.json is out of date/);
});
