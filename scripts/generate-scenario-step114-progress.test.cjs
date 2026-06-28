const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-step114-progress.cjs");
const PROCESSED_FILES = [
  "scenario_data_coverage.csv",
  "scenario_monthly_input_readiness.json",
  "scenario_monthly_refetch_plan_summary.json",
  "scenario_p0_monthly_cache_manifest_summary.json",
  "scenario_p0_monthly_cache_dry_run.json",
  "scenario_p0_source_approval_requirements.json",
  "scenario_p0_source_approval_decision_record_summary.json",
  "scenario_p0_provider_candidate_review_summary.json",
  "scenario_p0_external_provider_terms_review_summary.json",
  "scenario_p0_owner_legal_decision_packet_summary.json",
  "scenario_p0_approval_intake_checklist.json",
  "scenario_p0_approval_intake_template_summary.json",
  "scenario_p0_approval_intake_validation.json",
  "scenario_p0_source_policy_sync_plan.json",
  "scenario_p0_source_policy_sync_preflight.json",
  "scenario_p0_provider_adapter_preflight.json",
  "scenario_p0_approval_readiness.json",
  "scenario_monthly_write_preflight.json",
  "scenario_p0_cache_writer_gate.json",
  "scenario_step114_progress.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-step114-progress-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of PROCESSED_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  return workspace;
}

function runProgress(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readProgress(workspace) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", "scenario_step114_progress.json"), "utf8"));
}

function mutateJson(workspace, fileName, patch) {
  const filePath = path.join(workspace, "data", "processed", fileName);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  patch(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current blocked progress report", () => {
  const workspace = makeWorkspace();
  const result = runProgress(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_step114_progress\.json/);
});

test("reports 80 percent overall progress while real approvals and monthly data are blocked", () => {
  const workspace = makeWorkspace();
  const result = runProgress(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const progress = readProgress(workspace);
  assert.equal(progress.overallProgressPercent, 80);
  assert.equal(progress.progressNotes.realApprovalDecisionsPercent, 0);
  assert.equal(progress.progressNotes.monthlyDataAndBootstrapPercent, 0);
  assert.equal(progress.guardrails.providerCallsAllowed, false);
  assert.equal(progress.guardrails.safeToWriteMonthlyData, false);
  assert.equal(progress.guardrails.approvalIntakeValidationReady, false);
  assert.equal(progress.guardrails.sourcePolicySyncPlanReady, false);
  assert.equal(progress.guardrails.sourcePolicySyncPreflightReady, false);
  assert.equal(progress.guardrails.providerAdapterPreflightReady, false);
  assert.equal(progress.guardrails.sourcePolicyMatrixWritten, false);
});

test("real approval progress moves independently from monthly data progress", () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, "scenario_p0_approval_intake_checklist.json", (value) => {
    value.rowCounts.readyProviderGroups = 5;
    value.rowCounts.blockedProviderGroups = 0;
    value.rowCounts.approvedSourcePolicyRows = 17;
    value.rowCounts.completedApprovalSlots = 37;
    value.completion.intakeCompletionPercent = 100;
    value.completion.readyForProviderAdapter = true;
    value.completion.readyForMonthlyDataWrite = true;
    value.providerGroups = value.providerGroups.map((row) => ({
      ...row,
      readyForSourcePolicyApproval: true,
      blockers: [],
    }));
  });

  const result = runProgress(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const progress = readProgress(workspace);
  assert.equal(progress.progressNotes.realApprovalDecisionsPercent, 100);
  assert.equal(progress.progressNotes.monthlyDataAndBootstrapPercent, 0);
  assert.equal(progress.overallProgressPercent, 90);
});

test("rejects stale committed progress report", () => {
  const workspace = makeWorkspace();
  mutateJson(workspace, "scenario_step114_progress.json", (value) => {
    value.overallProgressPercent = 999;
  });

  const result = runProgress(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_step114_progress\.json is out of date/);
});
