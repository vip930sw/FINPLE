const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAdminLabDashboardShell.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/AccountPages.jsx",
  "src/components/portfolio/services/serverPortfolioService.js",
  "src/App.jsx",
  "src/App.css",
  "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.cjs",
  "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.test.cjs",
  "scripts/check-trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP169_ADMIN_TRADING_LAB_DASHBOARD_UX_POLISH_CORE_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_CORE_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_CORE_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_SUMMARY_FIRST_LAYOUT_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_COLLAPSIBLE_DETAIL_CHAIN_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_KOREAN_LABEL_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_SAFETY_NOTICE_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_READABILITY_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_DUPLICATE_VERBOSE_CLEANUP_RESULT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabDashboardUxPolishCore"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishCoreResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishSummaryFirstLayoutResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishCollapsibleDetailChainResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishKoreanLabelResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishSafetyNoticeResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabDashboardUxPolishCoreStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_dashboard_ux_polish_core_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_ux_polish_applied"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_ux_polish_review"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardUxPolishPersistenceAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "myPageRouteTouched: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountSubscriptionBillingTouched: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabDashboardUxPolishCoreStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-dashboard-ux-polish-core"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-dashboard-ux-polish-core"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabDashboardUxPolishCoreStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-dashboard-ux-polish-core\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishCoreStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishCoreCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishCoreList"],
  ["src/components/TradingReadinessPanel.jsx", "data-admin-panel-key=\"trading-lab-dashboard-ux-polish-core\""],
  ["src/App.css", ".tradingLabDashboardUxPolishCoreCards"],
  ["src/App.css", ".tradingLabDashboardUxPolishCoreList"],
  ["package.json", "check:trading-step169-admin-trading-lab-dashboard-ux-polish-core"],
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
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardUxPolishPersistenceAllowed: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "myPageRouteChanged: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountSubscriptionBillingChanged: true"],
  ["src/components/TradingReadinessPanel.jsx", "auto-trading start"],
  ["src/components/TradingReadinessPanel.jsx", "live trading ready"],
  ["src/components/TradingReadinessPanel.jsx", "실전 승인"],
  ["src/components/TradingReadinessPanel.jsx", "주문 승인"],
  ["src/components/TradingReadinessPanel.jsx", "자동매매 시작"],
];

const FORBIDDEN_IMPLEMENTATION_TERMS = [
  "actualOrderId",
  "actualExecutionId",
  "actualFillId",
  "actualAccountBalance",
  "actualPerformanceRecordId",
  "actualTradingRunId",
  "actualTradingRunSummaryId",
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

  const implementationText = [
    readText("server/src/services/tradingAdminLabDashboardShell.js"),
    readText("server/src/routes/adminTradingReadinessRoutes.js"),
    readText("src/components/TradingReadinessPanel.jsx"),
  ].join("\n");
  const forbiddenImplementationTerms = FORBIDDEN_IMPLEMENTATION_TERMS.filter((term) => implementationText.includes(term));
  if (forbiddenImplementationTerms.length > 0) {
    fail(`dashboard UX polish core must not expose real identifier terms: ${forbiddenImplementationTerms.join(", ")}`);
  }

  const appCss = readText("src/App.css");
  const step169CssLines = appCss
    .split(/\r?\n/)
    .filter((line) => line.includes("tradingLabDashboardUxPolishCore"));
  if (step169CssLines.length === 0) fail("Step 169 must include scoped dashboard UX polish core CSS");
  const broadStep169Selector = step169CssLines.find((line) => /\.(card|panel|table|dashboard|section)\b/.test(line));
  if (broadStep169Selector) {
    fail(`Step 169 must not add broad global card/panel/table/dashboard/section selectors: ${broadStep169Selector.trim()}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("trading-lab-dashboard-ux-polish-core")
      || text.includes("tradingLabDashboardUxPolishCore")
    ) {
      fail(`dashboard UX polish core UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("dashboard_ux_polish_core")) {
      fail(`scenario runtime files must remain untouched by Step 169: ${filePath}`);
    }
  }

  console.log("[check-trading-step169-admin-trading-lab-dashboard-ux-polish-core] ok");
}

main();
