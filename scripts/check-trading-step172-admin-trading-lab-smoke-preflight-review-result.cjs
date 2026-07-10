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
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs",
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.test.cjs",
  "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.cjs",
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-smoke-preflight-review-result"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabSmokeReviewResult"],
  ["src/components/TradingReadinessPanel.jsx", "관리자 거래 실험실 smoke 검토 결과"],
  ["src/components/TradingReadinessPanel.jsx", "새 endpoint 없이 기존 Step169/admin readiness data와 Step171 화면 점검 결과를 재사용"],
  ["src/components/TradingReadinessPanel.jsx", "모의 운용 대시보드 정상 표시"],
  ["src/components/TradingReadinessPanel.jsx", "거래 안전평가 정상 표시"],
  ["src/components/TradingReadinessPanel.jsx", "안전 안내 표시됨"],
  ["src/components/TradingReadinessPanel.jsx", "상태 badge 정상 표시"],
  ["src/components/TradingReadinessPanel.jsx", "상세 검증 로그 접힘 유지"],
  ["src/components/TradingReadinessPanel.jsx", "내부 provider 호출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "주문 제출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "DB 저장 없음"],
  ["src/components/TradingReadinessPanel.jsx", "실거래 준비 상태"],
  ["src/components/TradingReadinessPanel.jsx", "My Page·homepage 미노출"],
  ["src/components/TradingReadinessPanel.jsx", "Step166 계정·구독·결제 sync"],
  ["src/components/TradingReadinessPanel.jsx", "모의 전용"],
  ["src/components/TradingReadinessPanel.jsx", "관리자 전용"],
  ["src/components/TradingReadinessPanel.jsx", "차단 유지"],
  ["src/components/TradingReadinessPanel.jsx", "KIS 호출 없음"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDetailChainShell"],
  ["src/components/TradingReadinessPanel.jsx", "최근 핵심 상태만 표시 · 상세 검증 이력 펼쳐보기"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabSmokeReviewResult"],
  ["src/App.css", ".tradingLabSmokeReviewCards"],
  ["src/App.css", ".tradingLabConsolidatedBadges span"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step172-admin-trading-lab-smoke-preflight-review-result"],
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
  "trading-lab-smoke-preflight-review-result",
  "buildAdminTradingLabSmokePreflightReviewResultStatus",
  "fetchAdminTradingLabSmokePreflightReviewResultStatus",
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
    if (routeText.includes(snippet)) fail(`Step 172 must not add a new endpoint; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 172 must not add a new endpoint; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const badgeBlock = panelText.match(/<div className="tradingLabSafetyBadges tradingLabConsolidatedBadges"[\s\S]*?<\/div>/);
  if (!badgeBlock) fail("consolidated safety badge block not found");
  for (const rawKey of ["mock-only", "admin-only", ">blocked<"]) {
    if (badgeBlock[0].includes(rawKey)) fail(`badge display must stay polished and not show raw key: ${rawKey}`);
  }

  const reviewItems = panelText.match(/TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS[\s\S]*?\];/);
  if (!reviewItems) fail("smoke preflight review result item model not found");
  const requiredReviewKeys = [
    "admin_trading_route",
    "mock_dashboard_visible",
    "safety_panel_visible",
    "summary_first_visible",
    "safety_notice_visible",
    "badge_display_ok",
    "empty_chart_placeholder_ok",
    "detail_log_collapsed",
    "detail_groups_present",
    "provider_gate_blocked",
    "order_submission_blocked",
    "db_write_blocked",
    "live_readiness_blocked",
    "public_surfaces_blocked",
    "step166_preserved",
  ];
  for (const key of requiredReviewKeys) {
    if (!reviewItems[0].includes(`key: "${key}"`)) fail(`smoke review result missing item key: ${key}`);
  }

  const preflightIndex = panelText.indexOf("tradingLabSmokePreflightSummary");
  const reviewIndex = panelText.indexOf("tradingLabSmokeReviewResult");
  const kpiIndex = panelText.indexOf("tradingLabKpiGrid");
  if (preflightIndex < 0 || reviewIndex < 0 || kpiIndex < 0 || !(preflightIndex < reviewIndex && reviewIndex < kpiIndex)) {
    fail("smoke review result must render after Step171 smoke preflight and before KPI cards");
  }

  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText)) {
    fail("detail log must stay default-collapsed with a details element");
  }

  const headerText = readText("src/components/SiteHeader.jsx");
  if (!headerText.includes('activePage === "admin-trading" ? "adminTradingHeaderActive"')) {
    fail("admin trading header artifact fix must remain scoped to admin-trading active page");
  }

  const cssText = readText("src/App.css");
  const step172CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabSmokeReviewResult")
      || line.includes("tradingLabSmokeReviewCards")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step172CssLines.length === 0) fail("Step 172 must include scoped smoke review CSS");
  const unsafeBroadSelectors = step172CssLines.filter((line) => (
    /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line)
    && !line.includes("adminTradingHeaderActive")
  ));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 172 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabSmokeReviewResult")
      || text.includes("trading-lab-smoke-preflight-review-result")
      || text.includes("TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS")
    ) {
      fail(`smoke review result UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("smoke_preflight_review_result")) {
      fail(`scenario runtime files must remain untouched by Step 172: ${filePath}`);
    }
  }

  console.log("[check-trading-step172-admin-trading-lab-smoke-preflight-review-result] ok");
}

main();
