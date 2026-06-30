const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-provider-runtime-preflight.cjs");
const PREFLIGHT = "scenario_p0_provider_runtime_preflight.json";
const FIXTURE_FILES = [
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_approval_readiness.json",
  "scenario_p0_provider_adapter_preflight.json",
  "scenario_p0_monthly_cache_writer_preflight.json",
  "scenario_p0_kis_capability_preflight.json",
  "scenario_p0_kis_written_response_preflight.json",
  PREFLIGHT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-runtime-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  return workspace;
}

function runPreflight(workspace, args = ["--check"], env = {}) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
  });
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeWorkspaceJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function writeWorkspaceText(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), value);
}

function fullCredentialEnv() {
  return {
    FINPLE_SCENARIO_PROVIDER_MODE: "live",
    FINPLE_SCENARIO_ALLOW_PROVIDER_CALLS: "1",
    FRED_API_KEY: "test-fred-key",
    KIS_APP_KEY: "test-kis-app-key",
    KIS_APP_SECRET: "test-kis-app-secret",
  };
}

function makeRuntimeProviderGroupsReady(workspace) {
  const intakeHeader = fs
    .readFileSync(path.join(workspace, "data", "processed", "scenario_p0_approval_intake_template.csv"), "utf8")
    .split(/\r?\n/)[0];
  const readyIntakeCsv = `${intakeHeader}
KOSPI200_TR_primary_or_kospi200_etf_proxy,Korea Investment Open API KOSPI200 proxy,KOSPI200 proxy,KR,KOSPI200_TR,1,ready_for_source_policy_review,Korea Investment Open API KOSPI200 proxy,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
KR_price_total_return_dividend_provider,Korea Investment Open API KR market data,KR ETF source,KR,069500|102110,6,ready_for_source_policy_review,Korea Investment Open API KR market data,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
SP500_TR_primary_or_SPY_adjusted_close_proxy,Korea Investment Open API overseas SPY adjusted-close proxy,SPY proxy,US,SP500_TR,1,ready_for_source_policy_review,Korea Investment Open API SPY adjusted-close proxy,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
US_price_total_return_dividend_provider,Korea Investment Open API overseas US ETF data,US ETF source,US,ITOT|IVV,8,ready_for_source_policy_review,Korea Investment Open API overseas US ETF data,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
USD_KRW_fx_provider,FRED DEXKOUS,USD KRW FX,FX,USD_KRW,1,ready_for_source_policy_review,FRED DEXKOUS,https://api.stlouisfed.org/fred/series/observations?series_id=DEXKOUS,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://fred.stlouisfed.org/docs/api/terms_of_use.html,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
`;
  writeWorkspaceText(workspace, "scenario_p0_approval_intake_template.csv", readyIntakeCsv);

  const approval = readWorkspaceJson(workspace, "scenario_p0_approval_readiness.json");
  approval.readiness.providerCallsAllowed = true;
  writeWorkspaceJson(workspace, "scenario_p0_approval_readiness.json", approval);

  const adapter = readWorkspaceJson(workspace, "scenario_p0_provider_adapter_preflight.json");
  adapter.readiness.providerCallsAllowed = true;
  writeWorkspaceJson(workspace, "scenario_p0_provider_adapter_preflight.json", adapter);

  const writer = readWorkspaceJson(workspace, "scenario_p0_monthly_cache_writer_preflight.json");
  writer.readiness.providerCallsAllowed = true;
  writeWorkspaceJson(workspace, "scenario_p0_monthly_cache_writer_preflight.json", writer);
}

test("passes with current blocked runtime provider preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_provider_runtime_preflight\.json/);
});

test("keeps current runtime provider calls blocked without credentials and explicit opt-in", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, false);
  assert.equal(report.checks.optInReady, false);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.doesNotMatch(report.checks.blockers.join("|"), /ALPHA_VANTAGE_API_KEY/);
  assert.match(report.checks.blockers.join("|"), /provider_group_count_mismatch/);
  assert.match(report.checks.blockers.join("|"), /missing_or_invalid_env_FINPLE_SCENARIO_PROVIDER_MODE/);
});

test("keeps KIS replacement blocked until overseas monthly capabilities are verified", () => {
  const workspace = makeWorkspace();
  makeRuntimeProviderGroupsReady(workspace);
  const result = runPreflight(workspace, [], fullCredentialEnv());

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, true);
  assert.equal(report.checks.providerCapabilityReady, false);
  assert.equal(report.checks.providerWrittenResponseReady, false);
  assert.equal(report.checks.optInReady, true);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /runtime_provider_capability_not_verified/);
  assert.match(report.checks.blockers.join("|"), /runtime_provider_written_response_not_approved/);
  assert.match(report.checks.blockers.join("|"), /kis_overseas_monthly_adjusted_dividend_split_capability_not_verified/);
});

test("keeps KIS replacement blocked until written response is approved", () => {
  const workspace = makeWorkspace();
  makeRuntimeProviderGroupsReady(workspace);
  const capability = readWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json");
  capability.checks.capabilityReady = true;
  capability.checks.verifiedCapabilities = 2;
  capability.checks.blockers = [];
  capability.capabilities = capability.capabilities.map((row) => ({
    ...row,
    status: "ready_for_runtime_preflight",
    capabilityVerified: true,
    blockers: [],
  }));
  capability.readiness.status = "ready_for_runtime_provider_preflight";
  capability.readiness.capabilityReady = true;
  writeWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json", capability);

  const result = runPreflight(workspace, [], fullCredentialEnv());

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, true);
  assert.equal(report.checks.providerCapabilityReady, true);
  assert.equal(report.checks.providerWrittenResponseReady, false);
  assert.equal(report.checks.optInReady, true);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /kis_written_response_pending/);
});

test("opens only when credentials, opt-in, KIS capability evidence, and KIS written response are all present", () => {
  const workspace = makeWorkspace();
  makeRuntimeProviderGroupsReady(workspace);
  const capability = readWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json");
  capability.checks.capabilityReady = true;
  capability.checks.verifiedCapabilities = 2;
  capability.checks.blockers = [];
  capability.capabilities = capability.capabilities.map((row) => ({
    ...row,
    status: "ready_for_runtime_preflight",
    capabilityVerified: true,
    blockers: [],
  }));
  capability.readiness.status = "ready_for_runtime_provider_preflight";
  capability.readiness.capabilityReady = true;
  writeWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json", capability);

  const response = readWorkspaceJson(workspace, "scenario_p0_kis_written_response_preflight.json");
  response.checks.responseReady = true;
  response.checks.responseReceived = true;
  response.checks.responseStatusApproved = true;
  response.checks.responseEvidenceValid = true;
  response.checks.termsReviewed = true;
  response.checks.rawRedistributionReviewed = true;
  response.checks.approvedUseScopePresent = true;
  response.checks.requiredAgreementValid = true;
  response.checks.reviewerFieldsPresent = true;
  response.checks.statusReady = true;
  response.checks.blockers = [];
  response.response.responseStatus = "approved";
  response.response.responseReceivedAt = "2026-06-29T01:00:00Z";
  response.response.responseEvidence = "https://mail.example.com/kis-confirmation";
  response.response.approvedUseScope = "raw_internal_cache_and_derived_monthly_scenario_display";
  response.response.requiredAgreement = "no_additional_agreement_required";
  response.response.reviewOwner = "finple_lab@naver.com";
  response.response.reviewedAt = "2026-06-29T02:00:00Z";
  response.response.status = "ready_for_runtime_preflight";
  response.readiness.status = "ready_for_runtime_provider_preflight";
  response.readiness.responseReady = true;
  writeWorkspaceJson(workspace, "scenario_p0_kis_written_response_preflight.json", response);

  const result = runPreflight(workspace, [], fullCredentialEnv());

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, true);
  assert.equal(report.checks.providerCapabilityReady, true);
  assert.equal(report.checks.providerWrittenResponseReady, true);
  assert.equal(report.checks.optInReady, true);
  assert.equal(report.checks.runtimeProviderCallsAllowed, true);
});

test("stays blocked when one provider credential is missing", () => {
  const workspace = makeWorkspace();
  makeRuntimeProviderGroupsReady(workspace);
  const env = fullCredentialEnv();
  delete env.FRED_API_KEY;

  const result = runPreflight(workspace, [], env);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, false);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /missing_env_FRED_API_KEY/);
});

test("rejects stale committed runtime provider preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  report.checks.runtimeProviderCallsAllowed = true;
  writeWorkspaceJson(workspace, PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_provider_runtime_preflight\.json is out of date/);
});
