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
  "scripts/check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice.cjs",
  "scripts/check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice.test.cjs",
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs",
  "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.cjs",
  "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_FINAL_STABILIZATION_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_SMOKE_REVIEW_HISTORY_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-final-stabilization-deployment-metadata-notice"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabFinalStabilizationSummary"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDeploymentMetadataNotice"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabFinalStabilizationCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabFinalStabilizationLists"],
  ["src/components/TradingReadinessPanel.jsx", "Render health commit metadata stale"],
  ["src/components/TradingReadinessPanel.jsx", "GitHub/Vercel/Render health"],
  ["src/components/TradingReadinessPanel.jsx", "Step169/admin readiness data"],
  ["src/components/TradingReadinessPanel.jsx", "Step171~172"],
  ["src/components/TradingReadinessPanel.jsx", "새 endpoint는 추가하지 않으며"],
  ["src/components/TradingReadinessPanel.jsx", "KIS/provider 호출·주문 제출·DB write·live readiness는 계속 차단"],
  ["src/components/TradingReadinessPanel.jsx", "Step166 account/plan/billing sync"],
  ["src/components/TradingReadinessPanel.jsx", "My Page·homepage trading UI 없음"],
  ["src/components/TradingReadinessPanel.jsx", "readiness/provider/order/live flags false 유지"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabFinalStabilizationSummary"],
  ["src/App.css", ".tradingLabDeploymentMetadataNotice"],
  ["src/App.css", ".tradingLabFinalStabilizationCards"],
  ["src/App.css", ".tradingLabFinalStabilizationLists"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice"],
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
  "trading-lab-final-stabilization-deployment-metadata-notice",
  "buildAdminTradingLabFinalStabilizationDeploymentMetadataNoticeStatus",
  "fetchAdminTradingLabFinalStabilizationDeploymentMetadataNoticeStatus",
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
    if (routeText.includes(snippet)) fail(`Step 173 must not add a new endpoint; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 173 must not add a new endpoint; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const badgeBlock = panelText.match(/<div className="tradingLabSafetyBadges tradingLabConsolidatedBadges"[\s\S]*?<\/div>/);
  if (!badgeBlock) fail("consolidated safety badge block not found");
  for (const rawKey of ["mock-only", "admin-only", ">blocked<"]) {
    if (badgeBlock[0].includes(rawKey)) fail(`badge display must stay polished and not show raw key: ${rawKey}`);
  }

  const finalItems = panelText.match(/TRADING_LAB_FINAL_STABILIZATION_ITEMS[\s\S]*?\];/);
  if (!finalItems) fail("final stabilization item model not found");
  assertKeys(finalItems[0], [
    "admin_route_stable",
    "mock_dashboard_stable",
    "safety_panel_stable",
    "safety_notice_stable",
    "badge_separation_stable",
    "empty_chart_placeholder_stable",
    "detail_log_collapsed_stable",
    "step170_consolidation_stable",
    "step171_badge_polish_stable",
    "step172_smoke_review_stable",
    "step166_account_plan_billing_stable",
    "public_surfaces_stable",
    "provider_order_live_blocked",
  ], "final stabilization model");

  const metadataItems = panelText.match(/TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS[\s\S]*?\];/);
  if (!metadataItems) fail("deployment metadata notice item model not found");
  assertKeys(metadataItems[0], [
    "render_api_health",
    "render_db_health",
    "render_commit_metadata",
    "github_vercel_reference",
    "readiness_impact",
    "provider_order_impact",
  ], "deployment metadata notice model");

  const historyItems = panelText.match(/TRADING_LAB_SMOKE_REVIEW_HISTORY_ITEMS[\s\S]*?\];/);
  if (!historyItems) fail("smoke review history item model not found");
  assertKeys(historyItems[0], [
    "step169_admin_readiness_data",
    "step171_smoke_preflight",
    "step172_smoke_review_result",
    "step173_final_stabilization",
  ], "smoke review history model");

  const preflightIndex = panelText.indexOf("tradingLabSmokePreflightSummary");
  const reviewIndex = panelText.indexOf("tradingLabSmokeReviewResult");
  const finalIndex = panelText.indexOf("tradingLabFinalStabilizationSummary");
  const kpiIndex = panelText.indexOf("tradingLabKpiGrid");
  if (
    preflightIndex < 0
    || reviewIndex < 0
    || finalIndex < 0
    || kpiIndex < 0
    || !(preflightIndex < reviewIndex && reviewIndex < finalIndex && finalIndex < kpiIndex)
  ) {
    fail("final stabilization summary must render after smoke review result and before KPI cards");
  }

  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText)) {
    fail("detail log must stay default-collapsed with a details element");
  }

  const headerText = readText("src/components/SiteHeader.jsx");
  if (!headerText.includes('activePage === "admin-trading" ? "adminTradingHeaderActive"')) {
    fail("admin trading header artifact fix must remain scoped to admin-trading active page");
  }

  const cssText = readText("src/App.css");
  const step173CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabFinalStabilizationSummary")
      || line.includes("tradingLabDeploymentMetadataNotice")
      || line.includes("tradingLabFinalStabilizationCards")
      || line.includes("tradingLabFinalStabilizationLists")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step173CssLines.length === 0) fail("Step 173 must include scoped final stabilization CSS");
  const unsafeBroadSelectors = step173CssLines.filter((line) => (
    /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line)
    && !line.includes("adminTradingHeaderActive")
  ));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 173 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabFinalStabilizationSummary")
      || text.includes("trading-lab-final-stabilization-deployment-metadata-notice")
      || text.includes("TRADING_LAB_FINAL_STABILIZATION_ITEMS")
      || text.includes("TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS")
    ) {
      fail(`final stabilization UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("final_stabilization")) {
      fail(`scenario runtime files must remain untouched by Step 173: ${filePath}`);
    }
  }

  console.log("[check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice] ok");
}

main();
