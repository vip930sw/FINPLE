const fs = require("node:fs");
const path = require("node:path");

const KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_kis_written_response_preflight.json",
);
const PROVIDER_RUNTIME_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_runtime_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const OUTPUT_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_kis_market_data_reprocessing_follow_up.json",
);
const TERMS_REVIEW_PACKET_PATH = path.join(
  "docs",
  "portfolio-ml",
  "FINPLE_STEP114_KIS_TERMS_REVIEW_PACKET_2026_06_28.md",
);

const FOLLOW_UP_VERSION = "scenario-p0-kis-market-data-reprocessing-follow-up-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_ALLOWED_TOPICS = [
  "overseas_daily_price_api_scope",
  "overseas_rights_api_scope",
  "internal_calculation_only",
  "raw_market_data_not_displayed",
  "raw_rows_not_redistributed_or_downloadable",
  "derived_monthly_returns_and_scenario_metrics_only",
  "cache_log_retention_policy_question",
  "attribution_disclaimer_and_commercial_use_question",
];
const REQUIRED_EXCLUDED_TOPICS = [
  "mock_trading_account_permission",
  "live_trading_account_permission",
  "order_submission_permission",
  "personal_account_trading_permission",
  "raw_quote_screen_display",
  "raw_chart_screen_display",
  "raw_api_row_user_export",
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function buildFollowUp() {
  const kisWrittenResponse = readJson(KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH);
  const providerRuntimePreflight = readJson(PROVIDER_RUNTIME_PREFLIGHT_PATH);
  const termsReviewPacket = readText(TERMS_REVIEW_PACKET_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);
  const followUpScope = {
    ownerReportedSent: true,
    ownerReportedSentDate: "2026-07-01",
    sentTo: "openapi@koreainvestment.com",
    subjectCategory: "market_data_reprocessing_without_raw_market_data_display",
    allowedTopics: REQUIRED_ALLOWED_TOPICS,
    excludedTopics: REQUIRED_EXCLUDED_TOPICS,
    rawEmailBodyStoredInRepo: false,
    personalAccountOrOrderDiscussionStoredInRepo: false,
  };
  const missingAllowedTopics = missingValues(followUpScope.allowedTopics, REQUIRED_ALLOWED_TOPICS);
  const missingExcludedTopics = missingValues(followUpScope.excludedTopics, REQUIRED_EXCLUDED_TOPICS);
  const checks = {
    followUpEvidenceOnly: true,
    ownerReportedSent: followUpScope.ownerReportedSent === true,
    sentToKisOpenApi: followUpScope.sentTo === "openapi@koreainvestment.com",
    allowedTopicsComplete: missingAllowedTopics.length === 0,
    excludedTopicsComplete: missingExcludedTopics.length === 0,
    rawEmailBodyStoredInRepo: followUpScope.rawEmailBodyStoredInRepo,
    personalAccountOrOrderDiscussionStoredInRepo: followUpScope.personalAccountOrOrderDiscussionStoredInRepo,
    kisWrittenResponseStillPending:
      kisWrittenResponse.checks?.responseReady === false &&
      kisWrittenResponse.readiness?.providerCallsAllowed === false,
    providerRuntimeStillBlocked:
      providerRuntimePreflight.checks?.runtimeProviderCallsAllowed === false &&
      providerRuntimePreflight.readiness?.runtimeProviderCallsAllowed === false,
    termsPacketStillRequiresWrittenResponse:
      termsReviewPacket.includes("responseReady=false") &&
      termsReviewPacket.includes("No provider calls, provider adapters, monthly data writes"),
    monthlyFileExists,
    providerCallsAllowed: false,
    providerAdapterAllowed: false,
    monthlyDataWriteAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    orderSubmissionAllowed: false,
  };
  const responseStillBlocked =
    checks.ownerReportedSent &&
    checks.sentToKisOpenApi &&
    checks.allowedTopicsComplete &&
    checks.excludedTopicsComplete &&
    checks.rawEmailBodyStoredInRepo === false &&
    checks.personalAccountOrOrderDiscussionStoredInRepo === false &&
    checks.kisWrittenResponseStillPending &&
    checks.providerRuntimeStillBlocked &&
    !monthlyFileExists;

  return stableJson({
    followUpVersion: FOLLOW_UP_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      kisWrittenResponsePreflight: KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH,
      providerRuntimePreflight: PROVIDER_RUNTIME_PREFLIGHT_PATH,
      termsReviewPacket: TERMS_REVIEW_PACKET_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      followUp: OUTPUT_PATH,
    },
    followUpScope,
    checks,
    evidence: {
      missingAllowedTopics,
      missingExcludedTopics,
      kisWrittenResponseStatus: kisWrittenResponse.readiness?.status ?? null,
      providerRuntimeStatus: providerRuntimePreflight.readiness?.status ?? null,
      providerRuntimeBlockers: providerRuntimePreflight.checks?.blockers ?? [],
    },
    readiness: {
      status: responseStillBlocked
        ? "kis_market_data_reprocessing_follow_up_sent_response_still_blocked"
        : "kis_market_data_reprocessing_follow_up_needs_review",
      responseStillBlocked,
      responseReady: false,
      providerCallsAllowed: false,
      providerAdapterAllowed: false,
      monthlyDataWriteAllowed: false,
      scenarioMonthlyReturnsWritten: monthlyFileExists,
      bootstrapStillBlocked: true,
      nextAllowedStep: "wait_for_kis_written_response_on_market_data_reprocessing_without_raw_display",
      blockers: [
        ...(checks.ownerReportedSent ? [] : ["owner_reported_sent_missing"]),
        ...(checks.sentToKisOpenApi ? [] : ["sent_to_kis_openapi_missing"]),
        ...(checks.allowedTopicsComplete ? [] : ["allowed_topics_incomplete"]),
        ...(checks.excludedTopicsComplete ? [] : ["excluded_topics_incomplete"]),
        ...(checks.rawEmailBodyStoredInRepo === false ? [] : ["raw_email_body_stored_in_repo"]),
        ...(checks.personalAccountOrOrderDiscussionStoredInRepo === false
          ? []
          : ["personal_account_or_order_discussion_stored_in_repo"]),
        ...(checks.kisWrittenResponseStillPending ? [] : ["kis_written_response_not_pending_or_call_gate_open"]),
        ...(checks.providerRuntimeStillBlocked ? [] : ["provider_runtime_not_blocked"]),
        ...(monthlyFileExists ? ["scenario_monthly_returns_csv_already_exists"] : []),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const followUp = buildFollowUp();

  if (checkOnly) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      fail(`${OUTPUT_PATH} not found; run node scripts/generate-scenario-p0-kis-market-data-reprocessing-follow-up.cjs`);
    }
    const current = fs.readFileSync(OUTPUT_PATH, "utf8");
    if (current !== followUp) {
      fail(`${OUTPUT_PATH} is out of date; run node scripts/generate-scenario-p0-kis-market-data-reprocessing-follow-up.cjs`);
    }
    console.log("[generate-scenario-p0-kis-market-data-reprocessing-follow-up] ok");
    console.log(`[generate-scenario-p0-kis-market-data-reprocessing-follow-up] followUp=${OUTPUT_PATH}`);
    return;
  }

  fs.writeFileSync(OUTPUT_PATH, followUp);
  const parsed = JSON.parse(followUp);
  console.log("[generate-scenario-p0-kis-market-data-reprocessing-follow-up] wrote follow-up");
  console.log(
    `[generate-scenario-p0-kis-market-data-reprocessing-follow-up] responseStillBlocked=${parsed.readiness.responseStillBlocked}`,
  );
}

main();
