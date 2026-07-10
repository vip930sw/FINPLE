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
  "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.cjs",
  "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.test.cjs",
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.cjs",
  "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_SMOKE_PREFLIGHT_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-smoke-test-preflight"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabSmokePreflightSummary"],
  ["src/components/TradingReadinessPanel.jsx", "관리자 화면 표시 안정성 점검"],
  ["src/components/TradingReadinessPanel.jsx", "Step169 admin-only endpoint"],
  ["src/components/TradingReadinessPanel.jsx", "Step171 신규 endpoint 없음"],
  ["src/components/TradingReadinessPanel.jsx", "My Page·homepage trading UI 미노출"],
  ["src/components/TradingReadinessPanel.jsx", "readiness/provider/order/live flags"],
  ["src/components/TradingReadinessPanel.jsx", "header artifact regression"],
  ["src/components/TradingReadinessPanel.jsx", "모의 전용"],
  ["src/components/TradingReadinessPanel.jsx", "관리자 전용"],
  ["src/components/TradingReadinessPanel.jsx", "차단 유지"],
  ["src/components/TradingReadinessPanel.jsx", "KIS 호출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "주문 제출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "DB 저장 없음"],
  ["src/components/TradingReadinessPanel.jsx", "최근 핵심 상태만 표시 · 상세 검증 이력 펼쳐보기"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainShell"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabEmptyChartPlaceholder"],
  ["src/components/TradingReadinessPanel.jsx", "Step134~Step138"],
  ["src/components/TradingReadinessPanel.jsx", "Step162~Step169"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabConsolidatedBadges span"],
  ["src/App.css", ".tradingLabSmokePreflightSummary"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish"],
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
  "trading-lab-smoke-test-preflight",
  "buildAdminTradingLabSmokeTestPreflightStatus",
  "fetchAdminTradingLabSmokeTestPreflightStatus",
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
    if (routeText.includes(snippet)) fail(`Step 171 must not add a new endpoint; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 171 must not add a new endpoint; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const consolidatedBadgeMatch = panelText.match(/<div className="tradingLabSafetyBadges tradingLabConsolidatedBadges"[\s\S]*?<\/div>/);
  if (!consolidatedBadgeMatch) fail("consolidated safety badge block not found");
  const consolidatedBadges = consolidatedBadgeMatch[0];
  for (const rawKey of ["mock-only", "admin-only", ">blocked<"]) {
    if (consolidatedBadges.includes(rawKey)) fail(`consolidated badges must show display labels, not raw key: ${rawKey}`);
  }

  const smokeItems = panelText.match(/TRADING_LAB_SMOKE_PREFLIGHT_ITEMS[\s\S]*?\];/);
  if (!smokeItems) fail("smoke preflight item model not found");
  const requiredSmokeKeys = [
    "admin_route",
    "mock_dashboard",
    "safety_summary",
    "blocked_badges",
    "empty_chart_placeholder",
    "detail_chain",
    "step_groups",
    "step169_endpoint",
    "no_step171_endpoint",
    "public_ui_blocked",
    "readiness_flags",
    "header_artifact",
  ];
  for (const key of requiredSmokeKeys) {
    if (!smokeItems[0].includes(`key: "${key}"`)) fail(`smoke preflight missing item key: ${key}`);
  }

  const detailShellIndex = panelText.indexOf("tradingLabDetailChainShell");
  const smokeIndex = panelText.indexOf("tradingLabSmokePreflightSummary");
  const firstKpiIndex = panelText.indexOf("tradingLabKpiGrid");
  if (smokeIndex < 0 || firstKpiIndex < 0 || smokeIndex > firstKpiIndex) {
    fail("smoke preflight summary must render before KPI cards");
  }
  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText) || detailShellIndex < firstKpiIndex) {
    fail("detail chain must remain a default-collapsed details element after summary-first content");
  }

  const headerText = readText("src/components/SiteHeader.jsx");
  if (!headerText.includes('activePage === "admin-trading" ? "adminTradingHeaderActive"')) {
    fail("admin trading header artifact fix must remain scoped to admin-trading active page");
  }

  const cssText = readText("src/App.css");
  const step171CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabSmokePreflightSummary")
      || line.includes("tradingLabConsolidatedBadges")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step171CssLines.length === 0) fail("Step 171 must include scoped smoke/badge CSS");
  const unsafeBroadSelectors = step171CssLines.filter((line) => (
    /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line)
    && !line.includes("adminTradingHeaderActive")
  ));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 171 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabSmokePreflightSummary")
      || text.includes("trading-lab-smoke-test-preflight")
      || text.includes("TRADING_LAB_SMOKE_PREFLIGHT_ITEMS")
    ) {
      fail(`smoke test preflight UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("smoke_test_preflight")) {
      fail(`scenario runtime files must remain untouched by Step 171: ${filePath}`);
    }
  }

  console.log("[check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish] ok");
}

main();
