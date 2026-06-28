const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-monthly-cache-writer-preflight.cjs");
const PROVIDER_ADAPTER_PREFLIGHT = "scenario_p0_provider_adapter_preflight.json";
const SOURCE_POLICY_POST_IMPORT_PREFLIGHT = "scenario_p0_source_policy_post_import_preflight.json";
const APPROVAL_READINESS = "scenario_p0_approval_readiness.json";
const MONTHLY_WRITE_PREFLIGHT = "scenario_monthly_write_preflight.json";
const WRITER_GATE = "scenario_p0_cache_writer_gate.json";
const WRITER_PREFLIGHT = "scenario_p0_monthly_cache_writer_preflight.json";
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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-monthly-cache-writer-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    PROVIDER_ADAPTER_PREFLIGHT,
    SOURCE_POLICY_POST_IMPORT_PREFLIGHT,
    APPROVAL_READINESS,
    MONTHLY_WRITE_PREFLIGHT,
    WRITER_GATE,
    WRITER_PREFLIGHT,
  ]) {
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

function makePostImportPreflightReady(workspace) {
  mutateJson(workspace, SOURCE_POLICY_POST_IMPORT_PREFLIGHT, (value) => {
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

function writeMonthlyFile(workspace) {
  const content = [
    HEADER,
    "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,0.018,,total_return,USD,no,,fixture,2026-06-28,A,",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), content);
}

function makeWriterReady(workspace) {
  makePostImportPreflightReady(workspace);
  mutateJson(workspace, PROVIDER_ADAPTER_PREFLIGHT, (value) => {
    value.checks.sourcePolicySyncReady = true;
    value.checks.sourcePolicyMatrixWritten = true;
    value.checks.approvalReady = true;
    value.checks.writerGateReady = true;
    value.checks.allSourcePolicyRowsApproved = true;
    value.checks.providerCallsAllowed = true;
    value.checks.safeToImplementProviderAdapter = true;
    value.checks.approvedSourcePolicyRows = value.checks.sourcePolicyRows;
    value.checks.blockers = [];
    value.readiness.status = "ready_for_provider_adapter_implementation_review";
    value.readiness.safeToImplementProviderAdapter = true;
    value.readiness.providerCallsAllowed = true;
  });
  mutateJson(workspace, APPROVAL_READINESS, (value) => {
    value.rowCounts.termsApproved = 5;
    value.rowCounts.ownerAdapterApproved = 5;
    value.rowCounts.ownerMonthlyApproved = 5;
    value.rowCounts.sourcePolicyApproved = 17;
    value.readiness.status = "ready_for_p0_monthly_cache_write";
    value.readiness.safeToImplementProviderAdapter = true;
    value.readiness.safeToWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = true;
    value.readiness.blockers = [];
  });
  mutateJson(workspace, MONTHLY_WRITE_PREFLIGHT, (value) => {
    value.checks.approvalStatus = "ready_for_p0_monthly_cache_write";
    value.checks.safeToWriteMonthlyData = true;
    value.checks.providerCallsAllowed = true;
    value.checks.canAttemptMonthlyWrite = true;
    value.checks.blockers = [];
    value.readiness.status = "ready_for_monthly_write_but_file_missing";
    value.readiness.monthlyDataFileWritten = false;
    value.readiness.bootstrapStillBlocked = true;
  });
  mutateJson(workspace, WRITER_GATE, (value) => {
    value.rowCounts.approvedRows = value.rowCounts.totalRows;
    value.rowCounts.blockedRows = 0;
    value.counts.byStatus = { approved_source_policy: value.rowCounts.totalRows };
    value.counts.byBlocker = {};
    value.blockedRows = [];
    value.readiness.status = "ready_to_write_p0_monthly_cache";
    value.readiness.canWriteMonthlyData = true;
    value.readiness.providerCallsAllowed = true;
  });
}

test("passes with current blocked monthly cache writer preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_monthly_cache_writer_preflight\.json/);
});

test("keeps current committed monthly cache writer preflight ready after approvals", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, WRITER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementMonthlyCacheWriter, true);
  assert.equal(report.checks.providerCallsAllowed, true);
  assert.equal(report.checks.monthlyFileExists, false);
  assert.equal(report.readiness.monthlyDataFileWritten, false);
  assert.equal(report.readiness.bootstrapStillBlocked, true);
  assert.equal(report.checks.blockers.length, 0);
});

test("opens only after adapter, approval, monthly write, and writer gates are all ready", () => {
  const workspace = makeWorkspace();
  makeWriterReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, WRITER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementMonthlyCacheWriter, true);
  assert.equal(report.checks.providerCallsAllowed, true);
  assert.equal(report.checks.monthlyFileExists, false);
  assert.equal(report.checks.blockers.length, 0);
  assert.equal(report.readiness.status, "ready_for_monthly_cache_writer_implementation_review");
});

test("stays blocked when source-policy post-import preflight is not ready", () => {
  const workspace = makeWorkspace();
  makeWriterReady(workspace);
  mutateJson(workspace, SOURCE_POLICY_POST_IMPORT_PREFLIGHT, (value) => {
    value.checks.safeToUseImportedSourcePolicy = false;
    value.readiness.safeToUseImportedSourcePolicy = false;
    value.checks.blockers = ["source_policy_post_import_preflight_not_ready"];
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, WRITER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementMonthlyCacheWriter, false);
  assert.equal(report.checks.providerCallsAllowed, false);
  assert.deepEqual(report.checks.blockers, ["source_policy_post_import_preflight_not_ready"]);
});

test("stays blocked when provider adapter is ready but monthly write preflight is not", () => {
  const workspace = makeWorkspace();
  makeWriterReady(workspace);
  mutateJson(workspace, MONTHLY_WRITE_PREFLIGHT, (value) => {
    value.checks.canAttemptMonthlyWrite = false;
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, WRITER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementMonthlyCacheWriter, false);
  assert.deepEqual(report.checks.blockers, ["monthly_write_preflight_not_ready"]);
});

test("rejects monthly file when committed gates are still blocked", () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, PROVIDER_ADAPTER_PREFLIGHT, (value) => {
    value.checks.safeToImplementProviderAdapter = false;
    value.checks.providerCallsAllowed = false;
  });
  writeMonthlyFile(workspace);

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before monthly cache writer preflight is ready/);
});

test("rejects monthly file when writer gate is not open", () => {
  const workspace = makeWorkspace();
  makeWriterReady(workspace);
  mutateJson(workspace, WRITER_GATE, (value) => {
    value.readiness.canWriteMonthlyData = false;
  });
  writeMonthlyFile(workspace);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before monthly cache writer preflight is ready/);
});

test("rejects monthly file before source-policy post-import preflight is ready", () => {
  const workspace = makeWorkspace();
  makeWriterReady(workspace);
  mutateJson(workspace, SOURCE_POLICY_POST_IMPORT_PREFLIGHT, (value) => {
    value.checks.safeToUseImportedSourcePolicy = false;
    value.readiness.safeToUseImportedSourcePolicy = false;
  });
  writeMonthlyFile(workspace);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before monthly cache writer preflight is ready/);
});

test("rejects stale committed monthly cache writer preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, WRITER_PREFLIGHT);
  report.checks.safeToImplementMonthlyCacheWriter = false;
  writeWorkspaceJson(workspace, WRITER_PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_monthly_cache_writer_preflight\.json is out of date/);
});
