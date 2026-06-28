const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-monthly-write-preflight.cjs");
const APPROVAL_READINESS = "scenario_p0_approval_readiness.json";
const SOURCE_POLICY_POST_IMPORT_PREFLIGHT = "scenario_p0_source_policy_post_import_preflight.json";
const PREFLIGHT = "scenario_monthly_write_preflight.json";
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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-monthly-write-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  fs.copyFileSync(path.join("data", "processed", APPROVAL_READINESS), path.join(processedDir, APPROVAL_READINESS));
  fs.copyFileSync(
    path.join("data", "processed", SOURCE_POLICY_POST_IMPORT_PREFLIGHT),
    path.join(processedDir, SOURCE_POLICY_POST_IMPORT_PREFLIGHT),
  );
  fs.copyFileSync(path.join("data", "processed", PREFLIGHT), path.join(processedDir, PREFLIGHT));
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function writeMonthlyFile(workspace) {
  const content = [
    HEADER,
    "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,0.018,,total_return,USD,no,,fixture,2026-06-28,A,",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), content);
}

function mutateApprovalReadiness(workspace, patch) {
  const filePath = path.join(workspace, "data", "processed", APPROVAL_READINESS);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  patch(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function mutatePostImportPreflight(workspace, patch) {
  const filePath = path.join(workspace, "data", "processed", SOURCE_POLICY_POST_IMPORT_PREFLIGHT);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  patch(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function makePostImportPreflightReady(workspace) {
  mutatePostImportPreflight(workspace, (value) => {
    value.checks.safeToUseImportedSourcePolicy = true;
    value.checks.approvedSourcePolicyRows = 17;
    value.checks.blockedSourcePolicyRows = 0;
    value.checks.plannedSourcePolicyUpdates = 17;
    value.checks.readyProviderGroups = 5;
    value.checks.realApprovalImportReady = true;
    value.checks.allSourcePolicyRowsApproved = true;
    value.checks.approvedRowsMatchPlan = true;
    value.checks.blockers = [];
    value.readiness.safeToUseImportedSourcePolicy = true;
    value.readiness.status = "ready_for_approval_readiness_recalculation_after_source_policy_import";
  });
}

test("passes with current blocked approval and no monthly data file", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_monthly_write_preflight\.json/);
});

test("rejects monthly data file when P0 approval readiness is blocked", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace);
  mutateApprovalReadiness(workspace, (value) => {
    value.readiness.safeToWriteMonthlyData = false;
  });
  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before P0 approval readiness allows monthly writes/);
});

test("rejects monthly data file when provider calls are not allowed", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace);
  makePostImportPreflightReady(workspace);
  mutateApprovalReadiness(workspace, (value) => {
    value.readiness.safeToWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = false;
  });

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists while provider calls are not allowed/);
});

test("stays blocked when approval readiness is opened before source-policy post-import preflight", () => {
  const workspace = makeWorkspace();
  mutatePostImportPreflight(workspace, (value) => {
    value.checks.safeToUseImportedSourcePolicy = false;
    value.readiness.safeToUseImportedSourcePolicy = false;
  });
  mutateApprovalReadiness(workspace, (value) => {
    value.readiness.status = "ready_for_p0_monthly_cache_write";
    value.readiness.safeToWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = true;
    value.readiness.blockers = [];
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", PREFLIGHT), "utf8"));
  assert.equal(report.readiness.status, "blocked_before_monthly_write");
  assert.equal(report.checks.canAttemptMonthlyWrite, false);
  assert.equal(report.checks.postImportPreflightReady, false);
  assert.match(report.checks.blockers.join("|"), /source_policy_post_import_preflight_not_ready/);
});

test("generates ready-but-missing report after approval readiness and post-import preflight are opened", () => {
  const workspace = makeWorkspace();
  makePostImportPreflightReady(workspace);
  mutateApprovalReadiness(workspace, (value) => {
    value.readiness.status = "ready_for_p0_monthly_cache_write";
    value.readiness.safeToWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = true;
    value.readiness.blockers = [];
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", PREFLIGHT), "utf8"));
  assert.equal(report.readiness.status, "ready_for_monthly_write_but_file_missing");
  assert.equal(report.checks.canAttemptMonthlyWrite, true);
  assert.equal(report.checks.postImportPreflightReady, true);
  assert.equal(report.readiness.monthlyDataFileWritten, false);
});

test("rejects monthly data file before source-policy post-import preflight is ready", () => {
  const workspace = makeWorkspace();
  writeMonthlyFile(workspace);
  mutatePostImportPreflight(workspace, (value) => {
    value.checks.safeToUseImportedSourcePolicy = false;
    value.readiness.safeToUseImportedSourcePolicy = false;
  });
  mutateApprovalReadiness(workspace, (value) => {
    value.readiness.status = "ready_for_p0_monthly_cache_write";
    value.readiness.safeToWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = true;
    value.readiness.blockers = [];
  });

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before source-policy post-import preflight is ready/);
});
