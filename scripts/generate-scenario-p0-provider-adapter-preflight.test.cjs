const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-provider-adapter-preflight.cjs");
const SOURCE_POLICY_PREFLIGHT = "scenario_p0_source_policy_sync_preflight.json";
const SOURCE_POLICY_POST_IMPORT_PREFLIGHT = "scenario_p0_source_policy_post_import_preflight.json";
const APPROVAL_READINESS = "scenario_p0_approval_readiness.json";
const WRITER_GATE = "scenario_p0_cache_writer_gate.json";
const ADAPTER_PREFLIGHT = "scenario_p0_provider_adapter_preflight.json";

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-provider-adapter-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    SOURCE_POLICY_PREFLIGHT,
    SOURCE_POLICY_POST_IMPORT_PREFLIGHT,
    APPROVAL_READINESS,
    WRITER_GATE,
    ADAPTER_PREFLIGHT,
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

function makeAdapterReady(workspace) {
  mutateJson(workspace, SOURCE_POLICY_PREFLIGHT, (value) => {
    value.checks.syncPlanReady = true;
    value.checks.canSyncSourcePolicy = true;
    value.checks.sourcePolicyMatrixWritten = true;
    value.checks.approvedSourcePolicyRows = 17;
    value.checks.plannedSourcePolicyUpdates = 17;
    value.checks.blockers = [];
    value.readiness.status = "source_policy_matrix_synced_after_manual_review";
    value.readiness.sourcePolicyMatrixWritten = true;
  });
  makePostImportPreflightReady(workspace);
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

test("passes with current blocked provider adapter preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_provider_adapter_preflight\.json/);
});

test("keeps current committed provider adapter preflight blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementProviderAdapter, false);
  assert.equal(report.checks.providerCallsAllowed, false);
  assert.equal(report.readiness.monthlyDataFileWritten, false);
  assert.equal(report.readiness.bootstrapStillBlocked, true);
  assert.match(report.checks.blockers.join("|"), /approval_readiness_not_safe_for_adapter/);
});

test("opens only when source policy, approval readiness, and writer gate are all ready", () => {
  const workspace = makeWorkspace();
  makeAdapterReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementProviderAdapter, true);
  assert.equal(report.checks.providerCallsAllowed, true);
  assert.equal(report.checks.blockers.length, 0);
  assert.equal(report.readiness.status, "ready_for_provider_adapter_implementation_review");
});

test("stays blocked when source-policy post-import preflight is not ready", () => {
  const workspace = makeWorkspace();
  makeAdapterReady(workspace);
  mutateJson(workspace, SOURCE_POLICY_POST_IMPORT_PREFLIGHT, (value) => {
    value.checks.safeToUseImportedSourcePolicy = false;
    value.readiness.safeToUseImportedSourcePolicy = false;
    value.checks.blockers = ["source_policy_post_import_preflight_not_ready"];
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementProviderAdapter, false);
  assert.equal(report.checks.providerCallsAllowed, false);
  assert.deepEqual(report.checks.blockers, ["source_policy_post_import_preflight_not_ready"]);
});

test("stays blocked when approval readiness is open but source policy sync preflight is not written", () => {
  const workspace = makeWorkspace();
  makeAdapterReady(workspace);
  mutateJson(workspace, SOURCE_POLICY_PREFLIGHT, (value) => {
    value.readiness.sourcePolicyMatrixWritten = false;
    value.checks.sourcePolicyMatrixWritten = false;
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementProviderAdapter, false);
  assert.deepEqual(report.checks.blockers, ["source_policy_matrix_not_synced"]);
});

test("stays blocked when writer gate does not allow provider calls", () => {
  const workspace = makeWorkspace();
  makeAdapterReady(workspace);
  mutateJson(workspace, WRITER_GATE, (value) => {
    value.readiness.providerCallsAllowed = false;
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  assert.equal(report.checks.safeToImplementProviderAdapter, false);
  assert.deepEqual(report.checks.blockers, ["writer_gate_not_open_for_provider_calls"]);
});

test("rejects stale committed provider adapter preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, ADAPTER_PREFLIGHT);
  report.checks.safeToImplementProviderAdapter = true;
  writeWorkspaceJson(workspace, ADAPTER_PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_provider_adapter_preflight\.json is out of date/);
});
