const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-kis-market-data-reprocessing-follow-up.cjs");
const FOLLOW_UP = "scenario_p0_kis_market_data_reprocessing_follow_up.json";
const FIXTURE_FILES = [
  "scenario_p0_kis_written_response_preflight.json",
  "scenario_p0_provider_runtime_preflight.json",
  FOLLOW_UP,
];
const TERMS_PACKET = path.join("docs", "portfolio-ml", "FINPLE_STEP114_KIS_TERMS_REVIEW_PACKET_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-market-data-follow-up-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const termsTarget = path.join(workspace, TERMS_PACKET);
  fs.mkdirSync(path.dirname(termsTarget), { recursive: true });
  fs.copyFileSync(TERMS_PACKET, termsTarget);
  return workspace;
}

function runFollowUp(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = FOLLOW_UP) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current KIS market-data reprocessing follow-up", () => {
  const workspace = makeWorkspace();
  const result = runFollowUp(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_kis_market_data_reprocessing_follow_up\.json/);
});

test("records follow-up sent while keeping response and provider calls blocked", () => {
  const workspace = makeWorkspace();
  const result = runFollowUp(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.followUpScope.ownerReportedSent, true);
  assert.equal(report.followUpScope.rawEmailBodyStoredInRepo, false);
  assert.equal(report.followUpScope.personalAccountOrOrderDiscussionStoredInRepo, false);
  assert.equal(report.readiness.responseReady, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.monthlyDataWriteAllowed, false);
  assert.match(report.followUpScope.allowedTopics.join("|"), /raw_market_data_not_displayed/);
  assert.match(report.followUpScope.excludedTopics.join("|"), /order_submission_permission/);
});

test("rejects stale committed follow-up when provider calls are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.readiness.providerCallsAllowed = true;
  report.checks.providerCallsAllowed = true;
  writeJson(workspace, FOLLOW_UP, report);

  const result = runFollowUp(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_kis_market_data_reprocessing_follow_up\.json is out of date/);
});

test("blocks readiness if KIS written response gate is no longer pending", () => {
  const workspace = makeWorkspace();
  const writtenResponse = readJson(workspace, "scenario_p0_kis_written_response_preflight.json");
  writtenResponse.checks.responseReady = true;
  writtenResponse.readiness.providerCallsAllowed = true;
  writeJson(workspace, "scenario_p0_kis_written_response_preflight.json", writtenResponse);

  const result = runFollowUp(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.responseStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /kis_written_response_not_pending_or_call_gate_open/);
});

test("blocks readiness if monthly data appears before written response", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"), "month,ticker\n");

  const result = runFollowUp(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.responseStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /scenario_monthly_returns_csv_already_exists/);
});
