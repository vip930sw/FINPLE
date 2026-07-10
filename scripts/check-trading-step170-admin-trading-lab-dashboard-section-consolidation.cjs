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
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.cjs",
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.test.cjs",
  "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_DETAIL_GROUPS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-dashboard-section-consolidation"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabConsolidatedSafetyNotice"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabConsolidatedBadges"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabEmptyChartPlaceholder"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainShell"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainGroups"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainBody"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainGrid"],
  ["src/components/TradingReadinessPanel.jsx", "Step134~Step138"],
  ["src/components/TradingReadinessPanel.jsx", "Step139~Step148"],
  ["src/components/TradingReadinessPanel.jsx", "Step149~Step153"],
  ["src/components/TradingReadinessPanel.jsx", "Step154~Step158"],
  ["src/components/TradingReadinessPanel.jsx", "Step159~Step161"],
  ["src/components/TradingReadinessPanel.jsx", "Step162~Step169"],
  ["src/components/TradingReadinessPanel.jsx", "KIS 호출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "주문 제출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "DB 저장 없음"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabConsolidatedSafetyNotice"],
  ["src/App.css", ".tradingLabEmptyChartPlaceholder"],
  ["src/App.css", ".tradingLabDetailChainShell"],
  ["src/App.css", ".tradingLabDetailChainGroups"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step170-admin-trading-lab-dashboard-section-consolidation"],
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
  "trading-lab-dashboard-section-consolidation",
  "buildAdminTradingLabDashboardSectionConsolidationStatus",
  "fetchAdminTradingLabDashboardSectionConsolidationStatus",
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

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  for (const snippet of FORBIDDEN_NEW_ENDPOINT_SNIPPETS) {
    if (routeText.includes(snippet)) fail(`Step 170 must reuse existing endpoints; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 170 must reuse existing endpoints; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const detailShellIndex = panelText.indexOf("tradingLabDetailChainShell");
  const firstDetailCardIndex = panelText.indexOf("data-admin-panel-key=\"trading-lab-strategy-draft-controls\"");
  if (detailShellIndex < 0 || firstDetailCardIndex < 0 || detailShellIndex > firstDetailCardIndex) {
    fail("detail chain shell must wrap Step detail cards before the first Step134 section");
  }

  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText)) {
    fail("detail chain must use a default-collapsed details element");
  }

  const cssText = readText("src/App.css");
  const step170CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabConsolidated")
      || line.includes("tradingLabDetailChain")
      || line.includes("tradingLabEmptyChartPlaceholder")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step170CssLines.length === 0) fail("Step 170 must include scoped consolidation CSS");

  const broadSelectors = step170CssLines.filter((line) => /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line));
  const unsafeBroadSelectors = broadSelectors.filter((line) => !line.includes("adminTradingHeaderActive"));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 170 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabDetailChainShell")
      || text.includes("tradingLabConsolidatedSafetyNotice")
      || text.includes("trading-lab-dashboard-section-consolidation")
    ) {
      fail(`dashboard section consolidation must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("dashboard_section_consolidation")) {
      fail(`scenario runtime files must remain untouched by Step 170: ${filePath}`);
    }
  }

  console.log("[check-trading-step170-admin-trading-lab-dashboard-section-consolidation] ok");
}

main();
