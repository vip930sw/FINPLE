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

function writeText(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), value);
}

function writeJson(workspace, fileName, value) {
  writeText(workspace, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

function makeApprovalImportReady(workspace) {
  const intakeHeader = readText(workspace, "scenario_p0_approval_intake_template.csv").split(/\r?\n/)[0];
  const readyIntakeCsv = `${intakeHeader}
KOSPI200_TR_primary_or_kospi200_etf_proxy,Korea Investment Open API KOSPI200 proxy,KOSPI200 proxy,KR,KOSPI200_TR,1,ready_for_source_policy_review,Korea Investment Open API KOSPI200 proxy,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
KR_price_total_return_dividend_provider,Korea Investment Open API KR market data,KR ETF source,KR,069500|102110|105190|148020|152100|278530,6,ready_for_source_policy_review,Korea Investment Open API KR market data,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
SP500_TR_primary_or_SPY_adjusted_close_proxy,Korea Investment Open API overseas SPY adjusted-close proxy,SPY proxy,US,SP500_TR,1,ready_for_source_policy_review,Korea Investment Open API SPY adjusted-close proxy,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
US_price_total_return_dividend_provider,Korea Investment Open API overseas US ETF data,US ETF source,US,ITOT|IVV|QQQ|QQQM|SCHB|SPY|VOO|VTI,8,ready_for_source_policy_review,Korea Investment Open API overseas US ETF data,https://apiportal.koreainvestment.com/apiservice-apiservice,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://apiportal.koreainvestment.com/provider-info,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
USD_KRW_fx_provider,FRED DEXKOUS,USD KRW FX,FX,USD_KRW,1,ready_for_source_policy_review,FRED DEXKOUS,https://api.stlouisfed.org/fred/series/observations?series_id=DEXKOUS,approved_internal_monthly_derived_return_cache,approved_hash_or_raw_retention_policy,approved_no_raw_redistribution_monthly_derived_only,finple_lab@naver.com,lsw_28@naver.com,finple_lab@naver.com,2026-06-28T10:00:00Z,https://fred.stlouisfed.org/docs/api/terms_of_use.html,synthetic approval evidence,commercial,redistribution,raw,cache,attribution,label,,,synthetic_ready
`;
  writeText(workspace, "scenario_p0_approval_intake_template.csv", readyIntakeCsv);

  const validation = readJson(workspace, "scenario_p0_approval_intake_validation.json");
  validation.rowCounts.pendingRows = 0;
  validation.rowCounts.readyRows = 5;
  validation.rowCounts.rejectedRows = 0;
  validation.rowCounts.rowsWithMissingRequiredFields = 0;
  validation.readiness.status = "ready_for_source_policy_sync_dry_run";
  validation.readiness.allRowsReadyForSourcePolicyReview = true;
  validation.providerGroups = validation.providerGroups.map((row) => ({
    ...row,
    approvalStatusDraft: "ready_for_source_policy_review",
    missingReviewerFields: [],
    blockers: [],
    readyForSourcePolicyReview: true,
  }));
  writeJson(workspace, "scenario_p0_approval_intake_validation.json", validation);
}

test("imports ready intake into approval records without writing monthly data", () => {
  const workspace = copyWorkspace();
  makeApprovalImportReady(workspace);
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
  makeApprovalImportReady(workspace);
  const importResult = runScript(workspace);
  assert.equal(importResult.status, 0, importResult.stderr);
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
