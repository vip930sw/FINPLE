const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-kis-capability-preflight.cjs");
const PREFLIGHT = "scenario_p0_kis_capability_preflight.json";
const FIXTURE_FILES = [
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_kis_capability_review.csv",
  PREFLIGHT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-capability-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.mkdirSync(path.join(workspace, "server", "src", "services"), { recursive: true });
  fs.copyFileSync(
    path.join("server", "src", "services", "kisPriceService.js"),
    path.join(workspace, "server", "src", "services", "kisPriceService.js"),
  );
  fs.copyFileSync(
    path.join("server", "src", "services", "assetDataProvider.js"),
    path.join(workspace, "server", "src", "services", "assetDataProvider.js"),
  );
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

function readText(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

function writeText(workspace, fileName, text) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), text);
}

test("passes with current blocked KIS capability preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_kis_capability_preflight\.json/);
});

test("keeps provider runtime blocked until KIS terms and raw redistribution are reviewed", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.providerCallsMade, false);
  assert.equal(report.checks.capabilityReady, false);
  assert.equal(report.checks.verifiedCapabilities, 0);
  assert.equal(report.repoSupport.overseasCurrentQuoteImplemented, true);
  assert.equal(report.repoSupport.overseasHistoricalMonthlyAdapterImplemented, false);
  assert.match(report.checks.blockers.join("|"), /kis_overseas_monthly_adjusted_close_proxy_capability_not_verified/);
  assert.match(report.checks.blockers.join("|"), /missing_or_unreviewed_termsReviewed/);
  assert.match(report.checks.blockers.join("|"), /missing_or_unreviewed_rawRedistributionReviewed/);
  assert.doesNotMatch(report.checks.blockers.join("|"), /invalid_or_missing_selectedEndpoint/);
  assert.doesNotMatch(report.checks.blockers.join("|"), /invalid_or_missing_evidenceUrl/);
});

test("accepts synthetic KIS endpoint evidence without allowing provider calls", () => {
  const workspace = makeWorkspace();
  const header = readText(workspace, "scenario_p0_kis_capability_review.csv").split(/\r?\n/)[0];
  const readyCsv = `${header}
kis_overseas_monthly_adjusted_close_proxy,SP500_TR_primary_or_SPY_adjusted_close_proxy,SPY adjusted-close proxy monthly price source,Korea Investment Open API SPY adjusted-close proxy,official KIS overseas historical price endpoint|month-end observation rule|adjustment or close-price basis|proxy display label policy,https://apiportal.koreainvestment.com/apiservice-apiservice,https://apiportal.koreainvestment.com/provider-info,yes,yes,yes,yes,yes,finple_lab@naver.com,2026-06-28T10:00:00Z,synthetic endpoint evidence for test,ready_for_runtime_preflight,,synthetic_ready
kis_overseas_monthly_adjusted_dividend_split,US_price_total_return_dividend_provider,US ETF monthly adjusted close dividend split and corporate-action source,Korea Investment Open API overseas US ETF data,official KIS overseas historical price endpoint|dividend or distribution endpoint|split or corporate-action endpoint|monthly backfill window|raw retention policy,https://apiportal.koreainvestment.com/apiservice-apiservice,https://apiportal.koreainvestment.com/provider-info,yes,yes,yes,yes,yes,finple_lab@naver.com,2026-06-28T10:00:00Z,synthetic endpoint evidence for test,ready_for_runtime_preflight,,synthetic_ready
`;
  writeText(workspace, "scenario_p0_kis_capability_review.csv", readyCsv);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.capabilityReady, true);
  assert.equal(report.checks.verifiedCapabilities, 2);
  assert.equal(report.readiness.providerCallsAllowed, false);
});

test("rejects stale committed KIS capability preflight", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.checks.capabilityReady = true;
  fs.writeFileSync(path.join(workspace, "data", "processed", PREFLIGHT), `${JSON.stringify(report, null, 2)}\n`);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_kis_capability_preflight\.json is out of date/);
});
