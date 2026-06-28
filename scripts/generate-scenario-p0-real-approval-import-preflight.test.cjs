const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-real-approval-import-preflight.cjs");
const PREFLIGHT = "scenario_p0_real_approval_import_preflight.json";
const MONTHLY = "scenario_monthly_returns.csv";
const FIXTURE_FILES = [
  "scenario_p0_approval_intake_template_summary.json",
  "scenario_p0_approval_intake_validation.json",
  "scenario_p0_source_policy_sync_plan.json",
  "scenario_p0_source_policy_sync_preflight.json",
  PREFLIGHT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-real-approval-import-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
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

function makeReadyForImport(workspace) {
  mutateJson(workspace, "scenario_p0_approval_intake_validation.json", (value) => {
    value.rowCounts.pendingRows = 0;
    value.rowCounts.readyRows = 5;
    value.rowCounts.rejectedRows = 0;
    value.rowCounts.rowsWithMissingRequiredFields = 0;
    value.readiness.status = "ready_for_source_policy_sync_dry_run";
    value.readiness.allRowsReadyForSourcePolicyReview = true;
    value.providerGroups = value.providerGroups.map((row) => ({
      ...row,
      approvalStatusDraft: "ready_for_source_policy_review",
      missingReviewerFields: [],
      blockers: [],
      readyForSourcePolicyReview: true,
    }));
  });
  mutateJson(workspace, "scenario_p0_source_policy_sync_plan.json", (value) => {
    value.rowCounts.readyProviderGroups = 5;
    value.rowCounts.blockedProviderGroups = 0;
    value.rowCounts.plannedSourcePolicyUpdates = 17;
    value.rowCounts.blockedSourcePolicyRows = 0;
    value.readiness.status = "ready_for_manual_source_policy_sync_review";
    value.readiness.syncPlanReady = true;
    value.providerGroups = value.providerGroups.map((row) => ({
      ...row,
      readyForSourcePolicySync: true,
      plannedSourcePolicyUpdates: row.sourcePolicyRows,
      blockers: [],
    }));
  });
  mutateJson(workspace, "scenario_p0_source_policy_sync_preflight.json", (value) => {
    value.checks.plannedSourcePolicyUpdates = 17;
    value.checks.syncPlanReady = true;
    value.checks.canSyncSourcePolicy = true;
    value.checks.blockers = [];
    value.readiness.status = "ready_for_manual_source_policy_sync";
  });
}

test("passes with current blocked real approval import preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_real_approval_import_preflight\.json/);
});

test("keeps current committed real approval import preflight blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerGroups, 5);
  assert.equal(report.checks.readyRows, 0);
  assert.equal(report.checks.readyForRealApprovalImport, false);
  assert.equal(report.readiness.safeToImportRealApprovalDecisions, false);
  assert.equal(report.readiness.sourcePolicyMatrixWriteAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.safeToWriteMonthlyData, false);
});

test("opens only after intake validation and source policy sync preflight are ready", () => {
  const workspace = makeWorkspace();
  makeReadyForImport(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.readyRows, 5);
  assert.equal(report.checks.readyForRealApprovalImport, true);
  assert.equal(report.readiness.safeToImportRealApprovalDecisions, true);
  assert.equal(report.readiness.sourcePolicyMatrixWriteAllowed, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.safeToWriteMonthlyData, false);
});

test("stays blocked when only some approval intake rows are ready", () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, "scenario_p0_approval_intake_validation.json", (value) => {
    value.rowCounts.pendingRows = 1;
    value.rowCounts.readyRows = 4;
    value.readiness.allRowsReadyForSourcePolicyReview = false;
  });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.readyRows, 4);
  assert.equal(report.checks.readyForRealApprovalImport, false);
  assert.match(report.checks.blockers.join(","), /approval_intake_not_fully_ready/);
});

test("rejects source policy sync plan ready before approval intake validation", () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, "scenario_p0_source_policy_sync_plan.json", (value) => {
    value.readiness.syncPlanReady = true;
  });

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /is ready before approval intake validation is fully ready/);
});

test("rejects monthly returns before approval import preflight has completed", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), "must not exist\n");

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before real approval import preflight has completed/);
});

test("rejects stale committed real approval import preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  report.checks.readyForRealApprovalImport = true;
  writeWorkspaceJson(workspace, PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_real_approval_import_preflight\.json is out of date/);
});
