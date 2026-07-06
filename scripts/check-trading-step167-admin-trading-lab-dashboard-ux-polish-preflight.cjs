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
  "scripts/check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight.cjs",
  "scripts/check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight.test.cjs",
  "scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["server/src/services/tradingAdminLabDashboardShell.js", "STEP167_ADMIN_TRADING_LAB_DASHBOARD_UX_POLISH_PREFLIGHT_FLAGS"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_PREFLIGHT_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_UX_POLISH_TARGET_INVENTORY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_UX_POLISH_DUPLICATE_VERBOSE_DETECTION_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_UX_POLISH_KOREAN_LABEL_INVENTORY_MODEL"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "TRADING_LAB_DASHBOARD_UX_POLISH_PREFLIGHT_RESULT_SCHEMA"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishTargetInventory"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishDuplicateVerboseDetection"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardKoreanLabelPolishInventory"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "validateTradingLabDashboardUxPolishPreflight"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildTradingLabDashboardUxPolishPreflightResult"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "buildAdminTradingLabDashboardUxPolishPreflightStatus"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "admin_only_trading_lab_dashboard_ux_polish_preflight_fail_closed"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_ux_polish_ready"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "mock_dashboard_ux_polish_review_result"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "myPageRouteTouched: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountSubscriptionBillingTouched: false"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "buildAdminTradingLabDashboardUxPolishPreflightStatus"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/trading-lab-dashboard-ux-polish-preflight"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.test.js", "trading-lab-dashboard-ux-polish-preflight"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchAdminTradingLabDashboardUxPolishPreflightStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/trading-lab-dashboard-ux-polish-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishPreflightStatus"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardUxPolishList"],
  ["src/components/TradingReadinessPanel.jsx", "data-admin-panel-key=\"trading-lab-dashboard-ux-polish-preflight\""],
  ["src/components/TradingReadinessPanel.jsx", "Step165 dependency required"],
  ["src/App.css", ".tradingLabDashboardUxPolishCards"],
  ["src/App.css", ".tradingLabDashboardUxPolishList"],
  ["package.json", "check:trading-step167-admin-trading-lab-dashboard-ux-polish-preflight"],
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
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualCashUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPositionUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "actualPerformanceRecordUpdated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "realTradingRunIdentifierCreated: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardUxPolishExecuted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardSectionDeleted: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "myPageRouteChanged: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "accountSubscriptionBillingChanged: true"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "dashboardUxPolishPersistenceAllowed: true"],
  ["src/components/TradingReadinessPanel.jsx", "auto-trading start"],
  ["src/components/TradingReadinessPanel.jsx", "live trading ready"],
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

  const appCss = readText("src/App.css");
  const step167CssLines = appCss
    .split(/\r?\n/)
    .filter((line) => line.includes("tradingLabDashboardUxPolish"));
  if (step167CssLines.length === 0) fail("Step 167 must include scoped dashboard UX polish CSS");
  const broadStep167Selector = step167CssLines.find((line) => /\.(card|panel|table|dashboard|section)\b/.test(line));
  if (broadStep167Selector) fail(`Step 167 must not add broad global card/panel/table/dashboard/section selectors: ${broadStep167Selector.trim()}`);

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes("trading-lab-dashboard-ux-polish-preflight") || text.includes("tradingLabDashboardUxPolish")) {
      fail(`dashboard UX polish UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("dashboard_ux_polish")) {
      fail(`scenario runtime files must remain untouched by Step 167: ${filePath}`);
    }
  }

  console.log("[check-trading-step167-admin-trading-lab-dashboard-ux-polish-preflight] ok");
}

main();
