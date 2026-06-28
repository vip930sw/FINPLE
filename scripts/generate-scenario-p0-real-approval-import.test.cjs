const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts", "generate-scenario-p0-real-approval-import.cjs");
const processedDir = path.join(repoRoot, "data", "processed");

function copyWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "scenario-p0-real-approval-import-"));
  fs.mkdirSync(path.join(workspace, "data"), { recursive: true });
  fs.cpSync(processedDir, path.join(workspace, "data", "processed"), { recursive: true });
  return workspace;
}

function runScript(workspace, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function readText(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

test("imports ready intake into approval records without writing monthly data", () => {
  const workspace = copyWorkspace();
  const result = runScript(workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /imported real approval decisions/);

  const sourceDecision = readText(workspace, "scenario_p0_source_approval_decision_record.csv");
  const terms = readText(workspace, "scenario_p0_external_provider_terms_review.csv");
  const ownerLegal = readText(workspace, "scenario_p0_owner_legal_decision_packet.csv");
  const sourcePolicy = readText(workspace, "scenario_p0_source_policy_matrix.csv");
  assert.match(sourceDecision, /approved_source_policy/);
  assert.match(terms, /,approved,,external_terms_approved_run_approval_readiness/);
  assert.match(ownerLegal, /approved_for_adapter,approved_for_monthly_write/);
  assert.equal((sourcePolicy.match(/approved_source_policy/g) ?? []).length, 17);
  assert.equal(fs.existsSync(path.join(workspace, "data", "processed", "scenario_monthly_returns.csv")), false);

  const ownerSummary = readJson(workspace, "scenario_p0_owner_legal_decision_packet_summary.json");
  assert.equal(ownerSummary.rowCounts.approvedForAdapter, 5);
  assert.equal(ownerSummary.rowCounts.approvedForMonthlyWrite, 5);
});

test("check mode fails when imported files are out of date", () => {
  const workspace = copyWorkspace();
  const decisionPath = path.join(workspace, "data", "processed", "scenario_p0_source_approval_decision_record.csv");
  const staleDecision = readText(workspace, "scenario_p0_source_approval_decision_record.csv").replace(
    "approved_source_policy",
    "pending_decision",
  );
  fs.writeFileSync(decisionPath, staleDecision);

  const result = runScript(workspace, ["--check"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /is out of date/);
});
