const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-policy-matrix.cjs");
const FIXTURE_FILES = [
  "scenario_p0_monthly_cache_dry_run.json",
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_source_policy_matrix_summary.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-source-policy-matrix-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runMatrix(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readWorkspaceFile(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

function writeWorkspaceFile(workspace, fileName, content) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), content);
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(readWorkspaceFile(workspace, fileName));
}

function writeWorkspaceJson(workspace, fileName, value) {
  writeWorkspaceFile(workspace, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current blocked source policy matrix", () => {
  const workspace = makeWorkspace();
  const result = runMatrix(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_policy_matrix\.csv/);
});

test("summary keeps all source policy rows blocked before approval", () => {
  const workspace = makeWorkspace();
  const result = runMatrix(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const summary = readWorkspaceJson(workspace, "scenario_p0_source_policy_matrix_summary.json");
  assert.equal(summary.rowCounts.totalRows, 17);
  assert.equal(summary.rowCounts.assetRows, 14);
  assert.equal(summary.rowCounts.benchmarkRows, 2);
  assert.equal(summary.rowCounts.fxRows, 1);
  assert.deepEqual(summary.counts.byManifestType, { asset: 14, benchmark: 2, fx: 1 });
  assert.deepEqual(summary.counts.byStatus, { blocked_source_policy_review: 17 });
  assert.equal(summary.matrixIntegrity.expectedProviderTasks, 17);
  assert.equal(summary.matrixIntegrity.providerTasksVerified, true);
  assert.equal(summary.matrixIntegrity.manifestCountsVerified, true);
  assert.equal(summary.matrixIntegrity.allRowsBlocked, true);
  assert.equal(summary.matrixIntegrity.endpointAndLicenseUnselected, true);
  assert.equal(summary.matrixIntegrity.monthlyDataFileAbsent, true);
  assert.equal(summary.readiness.providerEndpointSelected, false);
  assert.equal(summary.readiness.licensePolicyReviewed, false);
  assert.equal(summary.readiness.monthlyDataFileWritten, false);
  assert.equal(summary.readiness.bootstrapStillBlocked, true);
});

test("rejects provider task count drift", () => {
  const workspace = makeWorkspace();
  const dryRun = readWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json");
  dryRun.providerTasks.pop();
  writeWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json", dryRun);

  const result = runMatrix(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must contain 17 providerTasks/);
});

test("rejects manifest count drift", () => {
  const workspace = makeWorkspace();
  const dryRun = readWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json");
  dryRun.providerTasks[0].manifestType = "asset";
  writeWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json", dryRun);

  const result = runMatrix(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source policy manifest counts expected asset=14, got 15/);
});

test("rejects premature monthly data before source policy approval", () => {
  const workspace = makeWorkspace();
  writeWorkspaceFile(workspace, "scenario_monthly_returns.csv", "month,ticker,monthlyReturn\n");

  const result = runMatrix(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before source policy matrix approval is complete/);
});

test("rejects stale committed source policy matrix summary", () => {
  const workspace = makeWorkspace();
  const summary = readWorkspaceJson(workspace, "scenario_p0_source_policy_matrix_summary.json");
  summary.readiness.providerEndpointSelected = true;
  writeWorkspaceJson(workspace, "scenario_p0_source_policy_matrix_summary.json", summary);

  const result = runMatrix(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_matrix_summary\.json is out of date/);
});
