const fs = require("node:fs");

const REQUIRED_FILES = [
  "src/components/TradingReadinessPanel.jsx",
  "src/components/SiteHeader.jsx",
  "src/App.css",
  "src/App.jsx",
  "src/components/AdminInquiriesPage.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "package.json",
  "scripts/check-trading-step174-admin-trading-lab-mvp-completion-handoff-summary.cjs",
  "scripts/check-trading-step174-admin-trading-lab-mvp-completion-handoff-summary.test.cjs",
  "scripts/check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice.cjs",
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_HANDOFF_REMAINING_TRACKS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_HANDOFF_READINESS_FLAGS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_HANDOFF_NOTICE_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-mvp-completion-handoff-summary"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpHandoffSummary"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpHandoffCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpHandoffNotice"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpHandoffLists"],
  ["src/components/TradingReadinessPanel.jsx", "internal_mock_mvp_ready_for_final_review"],
  ["src/components/TradingReadinessPanel.jsx", "admin-mock-trading-lab-step174"],
  ["src/components/TradingReadinessPanel.jsx", "admin-only, mock-only, fail-closed"],
  ["src/components/TradingReadinessPanel.jsx", "Render commit metadata stale"],
  ["src/components/TradingReadinessPanel.jsx", "legacy check shell timeout"],
  ["src/components/TradingReadinessPanel.jsx", "전체 node --test 통과 상태와 별도로"],
  ["src/components/TradingReadinessPanel.jsx", "My Page·homepage exposure"],
  ["src/components/TradingReadinessPanel.jsx", "order authority external blocker"],
  ["src/components/TradingReadinessPanel.jsx", "redacted"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabMvpHandoffSummary"],
  ["src/App.css", ".tradingLabMvpHandoffCards"],
  ["src/App.css", ".tradingLabMvpHandoffNotice"],
  ["src/App.css", ".tradingLabMvpHandoffLists"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step174-admin-trading-lab-mvp-completion-handoff-summary"],
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/kis",
  "server/src/services/trading/kisQuoteAdapter.js",
  "server/src/services/trading/kisTokenClient.js",
  "server/src/services/trading/kisProviderClient.js",
  "server/src/services/trading/providerCallRuntime.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const FORBIDDEN_SOURCE_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisOrderPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisExecutionPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "kisFillPayloadCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "executionRecordCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "fillRecordCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "portfolioLedgerPersisted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "performanceRecordPersisted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "tradingRunSummaryPersisted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountBalanceQueried: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "cashPositionMutated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "realTradingRunIdentifierCreated: true"],
  ["src/components/TradingReadinessPanel.jsx", "auto-trading start"],
  ["src/components/TradingReadinessPanel.jsx", "live trading ready"],
  ["src/components/TradingReadinessPanel.jsx", "실전 승인"],
  ["src/components/TradingReadinessPanel.jsx", "주문 승인"],
  ["src/components/TradingReadinessPanel.jsx", "자동매매 시작"],
  ["src/components/TradingReadinessPanel.jsx", "주문 실행"],
  ["src/components/TradingReadinessPanel.jsx", "실전 준비 완료"],
];

const FORBIDDEN_NEW_ENDPOINT_SNIPPETS = [
  "trading-lab-mvp-completion-handoff-summary",
  "buildAdminTradingLabMvpCompletionHandoffSummaryStatus",
  "fetchAdminTradingLabMvpCompletionHandoffSummaryStatus",
];

const MY_PAGE_FILES = [
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/mypage/panels/MyAccountPanel.jsx",
  "src/components/mypage/panels/MyBillingPlanPanel.jsx",
  "src/components/mypage/panels/MyPaymentMethodPanel.jsx",
  "src/components/mypage/hooks/useSubscriptionStatus.js",
  "src/components/portfolio/utils/subscriptionPlanStatus.js",
  "server/src/routes/paymentBillingRoutes.js",
  "server/src/routes/paymentBillingMethodRoutes.js",
  "server/src/routes/paymentBillingMethodDisplayRoutes.js",
  "server/src/services/subscriptionEffectiveStatus.js",
  "server/src/services/adminSubscriptionEffectiveStatus.js",
];

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function assertKeys(modelText, keys, modelName) {
  for (const key of keys) {
    if (!modelText.includes(`key: "${key}"`)) fail(`${modelName} missing key: ${key}`);
  }
}

function main() {
  const missingFiles = REQUIRED_FILES.filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) fail(`missing required files: ${missingFiles.join(", ")}`);

  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (fs.existsSync(forbiddenPath)) fail(`forbidden runtime artifact exists: ${forbiddenPath}`);
  }

  for (const [filePath, snippet] of REQUIRED_SNIPPETS) {
    const text = readText(filePath);
    if (!text.includes(snippet)) fail(`${filePath} missing required snippet: ${snippet}`);
  }

  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    const text = readText(filePath);
    if (text.includes(snippet)) fail(`${filePath} contains forbidden snippet: ${snippet}`);
  }

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  for (const snippet of FORBIDDEN_NEW_ENDPOINT_SNIPPETS) {
    if (routeText.includes(snippet)) fail(`Step 174 must not add a new endpoint; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 174 must not add a new endpoint; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  assertKeys(panelText.match(/TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS[\s\S]*?\];/)?.[0] || "", [
    "admin_shell",
    "safety_panel",
    "mock_dashboard",
    "fail_closed_flags",
    "provider_order_live_gate",
    "strategy_review_chain",
    "mock_run_candidate",
    "mock_order_execution_fill_chain",
    "mock_ledger_performance_chain",
    "mock_trading_run_summary",
    "dashboard_polish_smoke_review",
    "render_metadata_notice",
    "public_surface_absence",
  ], "implemented areas model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS[\s\S]*?\];/)?.[0] || "", [
    "kis_provider_call",
    "kis_token_issuance",
    "kis_quote_query",
    "kis_order_submission",
    "actual_balance_query",
    "persistent_trading_history",
    "persistent_strategy_storage",
    "user_trading_dashboard",
    "mypage_trading_connection",
    "automated_ordering",
  ], "excluded areas model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_HANDOFF_REMAINING_TRACKS[\s\S]*?\];/)?.[0] || "", [
    "persistent_mock_history",
    "kis_read_only_quote",
    "ai_strategy_console",
    "user_feature_connection",
  ], "remaining tracks model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_HANDOFF_READINESS_FLAGS[\s\S]*?\];/)?.[0] || "", [
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
    "actualLiveTradingReadiness",
    "orderAuthorityExternalBlocker",
  ], "readiness flags model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_HANDOFF_NOTICE_ITEMS[\s\S]*?\];/)?.[0] || "", [
    "scope",
    "mvpStatus",
    "safetyBoundary",
    "deploymentMetadataNotice",
    "legacyCheckNotice",
    "nextRecommendedStep",
    "redacted",
  ], "handoff notice model");

  const finalIndex = panelText.indexOf("tradingLabFinalStabilizationSummary");
  const handoffIndex = panelText.indexOf("tradingLabMvpHandoffSummary");
  const kpiIndex = panelText.indexOf("tradingLabKpiGrid");
  if (finalIndex < 0 || handoffIndex < 0 || kpiIndex < 0 || !(finalIndex < handoffIndex && handoffIndex < kpiIndex)) {
    fail("MVP handoff summary must render after Step173 final stabilization and before KPI cards");
  }

  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText)) {
    fail("detail log must stay default-collapsed with a details element");
  }

  const headerText = readText("src/components/SiteHeader.jsx");
  if (!headerText.includes('activePage === "admin-trading" ? "adminTradingHeaderActive"')) {
    fail("admin trading header artifact fix must remain scoped to admin-trading active page");
  }

  const cssText = readText("src/App.css");
  const step174CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabMvpHandoffSummary")
      || line.includes("tradingLabMvpHandoffCards")
      || line.includes("tradingLabMvpHandoffNotice")
      || line.includes("tradingLabMvpHandoffLists")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step174CssLines.length === 0) fail("Step 174 must include scoped MVP handoff CSS");
  const unsafeBroadSelectors = step174CssLines.filter((line) => (
    /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line)
    && !line.includes("adminTradingHeaderActive")
  ));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 174 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabMvpHandoffSummary")
      || text.includes("trading-lab-mvp-completion-handoff-summary")
      || text.includes("TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS")
      || text.includes("TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS")
    ) {
      fail(`MVP handoff UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("mvp_completion_handoff")) {
      fail(`scenario runtime files must remain untouched by Step 174: ${filePath}`);
    }
  }

  console.log("[check-trading-step174-admin-trading-lab-mvp-completion-handoff-summary] ok");
}

main();
