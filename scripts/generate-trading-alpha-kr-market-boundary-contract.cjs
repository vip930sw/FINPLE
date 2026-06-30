const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_alpha_kr_market_boundary_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const ENDPOINT_ALLOWLIST_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
);
const ENDPOINT_CATEGORY_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
);
const ASSET_DATA_PROVIDER_PATH = path.join("server", "src", "services", "assetDataProvider.js");
const SERVER_INDEX_PATH = path.join("server", "src", "index.js");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-alpha-kr-market-boundary-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_BOUNDARY_ASSERTIONS = [
  "alpha_vantage_asset_proxy_is_not_trading_provider",
  "alpha_vantage_global_quote_is_not_account_snapshot_source",
  "alpha_vantage_korean_symbol_support_is_not_assumed",
  "kr_trading_read_only_source_remains_kis_mock_until_owner_review",
  "asset_proxy_supported_tickers_are_not_trading_allowlist",
  "no_alpha_provider_call_for_kr_stock_validation_now",
  "no_kis_provider_call_for_boundary_validation_now",
  "no_scenario_monthly_data_download_or_write",
  "no_order_submission_or_order_endpoint_mapping",
  "future_kr_market_data_provider_requires_separate_terms_and_owner_review",
];
const REQUIRED_BLOCKED_SHORTCUTS = [
  "using_alpha_as_kis_account_balance_provider",
  "using_alpha_as_kis_positions_provider",
  "using_alpha_as_orderable_cash_provider",
  "using_alpha_global_quote_to_unlock_read_only_provider_calls",
  "using_alpha_symbol_search_to_unblock_kr_trading",
  "using_asset_proxy_health_supported_tickers_as_trading_scope",
  "using_alpha_or_any_market_data_provider_to_write_scenario_monthly_returns",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "alphaKrMarketProvider.js"),
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
  path.join("data", "processed", "scenario_monthly_returns.csv"),
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

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildBoundary() {
  return {
    scope: "alpha_kr_market_boundary",
    purpose:
      "record that the existing Alpha Vantage asset proxy cannot be used to bypass KIS read-only approval, KIS endpoint review, owner packet import, provider call authorization, or Step 114 source-policy approval for Korean market data",
    currentFinpleAssetProxyObservation: {
      providerName: "alpha_vantage",
      assetProxyMayServeConfiguredQuoteFallback: true,
      assetProxyIsTradingProvider: false,
      assetProxySupportedTickersAreTradingAllowlist: false,
      productionHealthSupportedTickersObservedExternally: ["GLD", "QQQ", "SCHD", "TLT"],
    },
    krTradingReadOnlyBoundary: {
      intendedPrivateProviderFamily: "kis_mock_then_kis_reviewed_read_only",
      alphaAllowedForAccountCashBalanceRead: false,
      alphaAllowedForAccountPositionsRead: false,
      alphaAllowedForOrderableCashRead: false,
      alphaAllowedForOrderEndpoints: false,
      alphaAllowedForScenarioMonthlyData: false,
      alphaAllowedForKrStockCallValidationNow: false,
    },
    requiredBoundaryAssertions: REQUIRED_BOUNDARY_ASSERTIONS,
    blockedShortcuts: REQUIRED_BLOCKED_SHORTCUTS,
    promotionRules: [
      "this contract does not prove Alpha Vantage Korean symbol coverage",
      "Alpha Vantage symbol availability cannot authorize KIS account, position, orderable cash, or order endpoints",
      "any future Korean market data provider requires source terms, owner approval, endpoint mapping, response validation, and provider-call authorization review",
      "Step 114 monthly scenario data remains blocked until its separate source-policy and writer gates are satisfied",
    ],
  };
}

function buildContract() {
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const endpointAllowlist = readJson(ENDPOINT_ALLOWLIST_PATH);
  const endpointCategoryPreflight = readJson(ENDPOINT_CATEGORY_PREFLIGHT_PATH);
  const assetDataProvider = readText(ASSET_DATA_PROVIDER_PATH);
  const serverIndex = readText(SERVER_INDEX_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const boundary = buildBoundary();
  const missingAssertions = missingValues(boundary.requiredBoundaryAssertions, REQUIRED_BOUNDARY_ASSERTIONS);
  const missingBlockedShortcuts = missingValues(boundary.blockedShortcuts, REQUIRED_BLOCKED_SHORTCUTS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    progressSummaryFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    launchPlanStillKeepsProviderCallsBlocked:
      launchReadinessPlan.readiness?.planReady === true &&
      launchReadinessPlan.readiness?.providerCallsAllowed === false &&
      launchReadinessPlan.readiness?.orderSubmissionAllowed === false,
    endpointAllowlistStillProviderAgnostic:
      endpointAllowlist.currentState?.providerSpecificEndpointPathsRecordedNow === false &&
      endpointAllowlist.currentState?.providerSpecificTransactionIdsRecordedNow === false &&
      endpointAllowlist.readiness?.providerCallsAllowed === false,
    endpointCategoryPreflightStillProviderAgnostic:
      endpointCategoryPreflight.currentState?.providerSpecificEndpointPathsRecordedNow === false &&
      endpointCategoryPreflight.currentState?.providerSpecificTransactionIdsRecordedNow === false &&
      endpointCategoryPreflight.readiness?.providerCallsAllowed === false,
    assetDataProviderSeparatesKisAndAlpha:
      assetDataProvider.includes("if (isKrTickerLike(normalizedTicker) && hasKisConfig())") &&
      assetDataProvider.includes('if (provider === "alpha_vantage")') &&
      assetDataProvider.includes("return getAlphaVantageAssetData(normalizedTicker);"),
    assetProxySupportedTickersRemainMockUniverse:
      assetDataProvider.includes("export function getSupportedTickers()") &&
      assetDataProvider.includes("...Object.keys(MOCK_ASSET_DATA)") &&
      serverIndex.includes("supportedTickers: getSupportedTickers()"),
    boundaryAssertionsReady: missingAssertions.length === 0,
    blockedShortcutsReady: missingBlockedShortcuts.length === 0,
    architectureDocMentionsAlphaKrMarketBoundary:
      architectureDoc.includes("Trading Alpha KR Market Boundary") &&
      architectureDoc.includes("trading_lab_step116_alpha_kr_market_boundary"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureAlphaKrMarketBoundaryReview =
    checks.progressSummaryFailClosed &&
    checks.launchPlanStillKeepsProviderCallsBlocked &&
    checks.endpointAllowlistStillProviderAgnostic &&
    checks.endpointCategoryPreflightStillProviderAgnostic &&
    checks.assetDataProviderSeparatesKisAndAlpha &&
    checks.assetProxySupportedTickersRemainMockUniverse &&
    checks.boundaryAssertionsReady &&
    checks.blockedShortcutsReady &&
    checks.architectureDocMentionsAlphaKrMarketBoundary &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5G",
    scope: "alpha_kr_market_boundary",
    sourceFiles: {
      progressSummary: PROGRESS_SUMMARY_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      endpointAllowlist: ENDPOINT_ALLOWLIST_PATH,
      endpointCategoryPreflight: ENDPOINT_CATEGORY_PREFLIGHT_PATH,
      assetDataProvider: ASSET_DATA_PROVIDER_PATH,
      serverIndex: SERVER_INDEX_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      alphaKrStockCallValidationAllowedNow: false,
      kisProviderCallsAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    alphaKrMarketBoundary: boundary,
    checks,
    evidence: {
      missingAssertions,
      missingBlockedShortcuts,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      progressSummaryStatus: progressSummary.readiness?.status ?? null,
      launchReadinessStatus: launchReadinessPlan.readiness?.status ?? null,
      endpointAllowlistStatus: endpointAllowlist.readiness?.status ?? null,
      endpointCategoryPreflightStatus: endpointCategoryPreflight.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFutureAlphaKrMarketBoundaryReview
        ? "alpha_kr_market_boundary_ready_provider_calls_still_blocked"
        : "blocked_before_alpha_kr_market_boundary",
      readyForFutureAlphaKrMarketBoundaryReview,
      alphaKrStockCallValidationAllowedNow: false,
      kisProviderCallsAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.progressSummaryFailClosed ? [] : ["progress_summary_not_fail_closed"]),
        ...(checks.launchPlanStillKeepsProviderCallsBlocked ? [] : ["launch_plan_provider_calls_not_blocked"]),
        ...(checks.endpointAllowlistStillProviderAgnostic ? [] : ["endpoint_allowlist_not_provider_agnostic"]),
        ...(checks.endpointCategoryPreflightStillProviderAgnostic
          ? []
          : ["endpoint_category_preflight_not_provider_agnostic"]),
        ...(checks.assetDataProviderSeparatesKisAndAlpha ? [] : ["asset_data_provider_no_longer_separates_kis_alpha"]),
        ...(checks.assetProxySupportedTickersRemainMockUniverse
          ? []
          : ["asset_proxy_supported_tickers_no_longer_mock_universe"]),
        ...(checks.boundaryAssertionsReady ? [] : ["alpha_kr_market_boundary_assertions_missing"]),
        ...(checks.blockedShortcutsReady ? [] : ["alpha_kr_market_boundary_blocked_shortcuts_missing"]),
        ...(checks.architectureDocMentionsAlphaKrMarketBoundary ? [] : ["architecture_doc_missing_alpha_kr_market_boundary"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
        "read_only_provider_call_authorization_review_result_not_owner_supplied",
        "kis_read_only_provider_endpoint_mapping_blocked_pending_private_review",
        "kr_market_data_provider_terms_review_blocked_pending_owner_review",
        "scenario_monthly_returns_csv_blocked_pending_step114_source_policy",
        "order_submission_blocked_pending_manual_permission_and_risk_clearance",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-alpha-kr-market-boundary-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-alpha-kr-market-boundary-contract.cjs`,
      );
    }
    console.log("[generate-trading-alpha-kr-market-boundary-contract] ok");
    console.log(`[generate-trading-alpha-kr-market-boundary-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-alpha-kr-market-boundary-contract] wrote contract");
  console.log(
    `[generate-trading-alpha-kr-market-boundary-contract] readyForFutureAlphaKrMarketBoundaryReview=${parsed.readiness.readyForFutureAlphaKrMarketBoundaryReview}`,
  );
}

main();
