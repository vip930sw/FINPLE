const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-approval-decision-record.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_approval_requirements.json",
  "scenario_p0_source_approval_decision_record.csv",
  "scenario_p0_source_approval_decision_record_summary.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-source-approval-decision-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runDecisionRecord(workspace, args = ["--check"]) {
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

test("passes with current pending source approval decision record", () => {
  const workspace = makeWorkspace();
  const result = runDecisionRecord(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_approval_decision_record\.csv/);
});

test("summary keeps provider groups pending and source integrity locked", () => {
  const workspace = makeWorkspace();
  const result = runDecisionRecord(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const summary = readWorkspaceJson(workspace, "scenario_p0_source_approval_decision_record_summary.json");
  assert.equal(summary.rowCounts.providerGroups, 5);
  assert.equal(summary.rowCounts.sourcePolicyRows, 17);
  assert.equal(summary.rowCounts.decidedGroups, 0);
  assert.equal(summary.sourceIntegrity.expectedProviderGroups, 5);
  assert.equal(summary.sourceIntegrity.expectedSourcePolicyRows, 17);
  assert.equal(summary.readiness.providerCallsAllowed, false);
  assert.equal(summary.readiness.monthlyDataFileWritten, false);
  assert.equal(summary.readiness.bootstrapStillBlocked, true);
});

test("rejects provider group count drift", () => {
  const workspace = makeWorkspace();
  const requirements = readWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json");
  delete requirements.providerGroups.USD_KRW_fx_provider;
  requirements.rowCounts.providerGroups = 4;
  requirements.rowCounts.totalRows = 16;
  writeWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json", requirements);

  const result = runDecisionRecord(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must contain 5 provider groups, got 4/);
});

test("rejects source policy row count drift", () => {
  const workspace = makeWorkspace();
  const requirements = readWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json");
  requirements.providerGroups.US_price_total_return_dividend_provider.rowCount = 7;
  writeWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json", requirements);

  const result = runDecisionRecord(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must contain 17 source policy rows, got 16/);
});

test("rejects stale committed source approval decision record", () => {
  const workspace = makeWorkspace();
  const summary = readWorkspaceJson(workspace, "scenario_p0_source_approval_decision_record_summary.json");
  summary.rowCounts.decidedGroups = 5;
  writeWorkspaceJson(workspace, "scenario_p0_source_approval_decision_record_summary.json", summary);

  const result = runDecisionRecord(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_approval_decision_record_summary\.json is out of date/);
});
