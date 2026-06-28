const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-kis-written-response-preflight.cjs");
const INTAKE = "scenario_p0_kis_written_response_intake.csv";
const PREFLIGHT = "scenario_p0_kis_written_response_preflight.json";
const FIXTURE_FILES = [INTAKE, PREFLIGHT];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-written-response-preflight-"));
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

function readJson(workspace, fileName = PREFLIGHT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeText(workspace, fileName, text) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), text);
}

test("passes with current blocked KIS written response preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_kis_written_response_preflight\.json/);
});

test("records sent email but keeps KIS runtime use blocked while response is pending", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.sentToKis, true);
  assert.equal(report.checks.responseReceived, false);
  assert.equal(report.checks.responseReady, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /kis_written_response_pending/);
  assert.match(report.checks.blockers.join("|"), /kis_terms_not_approved/);
  assert.match(report.checks.blockers.join("|"), /kis_raw_redistribution_not_approved/);
});

test("accepts synthetic approved written response without allowing provider calls directly", () => {
  const workspace = makeWorkspace();
  const approvedCsv = `responseId,providerCandidate,sentTo,sentAt,responseStatus,responseReceivedAt,respondent,responseEvidence,termsReviewed,rawRedistributionReviewed,approvedUseScope,requiredAgreement,reviewOwner,reviewedAt,status,blocker,nextAction
kis_openapi_written_confirmation,Korea Investment Open API overseas data,openapi@koreainvestment.com,2026-06-28T14:00:00Z,approved,2026-06-29T01:00:00Z,kis-openapi-support,https://mail.example.com/kis-confirmation,yes,yes,raw_internal_cache_and_derived_monthly_scenario_display,no_additional_agreement_required,finple_lab@naver.com,2026-06-29T02:00:00Z,ready_for_runtime_preflight,,rerun_provider_runtime_preflight_with_kis_written_confirmation
`;
  writeText(workspace, INTAKE, approvedCsv);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.responseReady, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
});

test("keeps rejected or unclear KIS response blocked", () => {
  const workspace = makeWorkspace();
  const rejectedCsv = `responseId,providerCandidate,sentTo,sentAt,responseStatus,responseReceivedAt,respondent,responseEvidence,termsReviewed,rawRedistributionReviewed,approvedUseScope,requiredAgreement,reviewOwner,reviewedAt,status,blocker,nextAction
kis_openapi_written_confirmation,Korea Investment Open API overseas data,openapi@koreainvestment.com,2026-06-28T14:00:00Z,rejected,2026-06-29T01:00:00Z,kis-openapi-support,https://mail.example.com/kis-rejection,no,no,,paid_or_partner_agreement_required,finple_lab@naver.com,2026-06-29T02:00:00Z,blocked_pending_alternate_licensed_source,kis_use_case_rejected,evaluate_paid_or_licensed_market_data_provider
`;
  writeText(workspace, INTAKE, rejectedCsv);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.responseReady, false);
  assert.match(report.checks.blockers.join("|"), /kis_written_response_status_rejected/);
});

test("rejects stale committed KIS written response preflight", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.checks.responseReady = true;
  fs.writeFileSync(path.join(workspace, "data", "processed", PREFLIGHT), `${JSON.stringify(report, null, 2)}\n`);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_kis_written_response_preflight\.json is out of date/);
});
