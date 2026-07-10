const fs = require("node:fs");

const REQUIRED_FILES = [
  "src/components/TradingReadinessPanel.jsx",
  "src/components/SiteHeader.jsx",
  "src/App.css",
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "src/components/portfolio/services/serverPortfolioService.js",
  "package.json",
  "scripts/check-trading-step176-admin-trading-safety-assessment-layout-polish.cjs",
  "scripts/check-trading-step176-admin-trading-safety-assessment-layout-polish.test.cjs",
  "scripts/check-trading-step175-admin-trading-lab-mvp-final-review.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "trading-safety-assessment-layout-polish"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyAssessmentShell"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyAssessmentHeader"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyNoticeChips"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyStatusCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyFlagBadgeGrid"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyFlagBadge"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyAuditEmptyState"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyDetailChainShell"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyDetailChainBody"],
  ["src/components/TradingReadinessPanel.jsx", "실제 거래 차단"],
  ["src/components/TradingReadinessPanel.jsx", "KIS 호출 차단"],
  ["src/components/TradingReadinessPanel.jsx", "주문 제출 차단"],
  ["src/components/TradingReadinessPanel.jsx", "DB 변경 차단"],
  ["src/components/TradingReadinessPanel.jsx", "일반 사용자 화면 미노출"],
  ["src/components/TradingReadinessPanel.jsx", "오류 시 자동 차단"],
  ["src/components/TradingReadinessPanel.jsx", "실제 거래 감사 이벤트는 아직 발생하지 않았습니다."],
  ["src/components/TradingReadinessPanel.jsx", "상세 검증 이력 펼쳐보기"],
  ["src/App.css", ".tradingSafetyAssessmentShell"],
  ["src/App.css", ".tradingSafetyAssessmentHeader"],
  ["src/App.css", ".tradingSafetyNoticeChips"],
  ["src/App.css", ".tradingSafetyStatusCards"],
  ["src/App.css", ".tradingSafetyFlagBadgeGrid"],
  ["src/App.css", ".tradingSafetyAuditEmptyState"],
  ["src/App.css", ".tradingSafetyDetailChainShell"],
  ["src/App.css", ".tradingSafetyDetailChainBody"],
  ["src/App.css", "word-break: keep-all"],
  ["src/App.css", "overflow-wrap: break-word"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["package.json", "check:trading-step176-admin-trading-safety-assessment-layout-polish"],
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
  ["src/components/TradingReadinessPanel.jsx", "order approved"],
  ["src/components/TradingReadinessPanel.jsx", "order enabled"],
];

const PUBLIC_SURFACE_FILES = [
  "src/App.jsx",
  "src/components/AccountPages.jsx",
  "src/components/mypage/MyPageRoute.jsx",
  "src/components/mypage/MyPageSidebar.jsx",
  "src/components/mypage/MyPageLayout.jsx",
  "src/components/mypage/panels/MyAccountPanel.jsx",
  "src/components/mypage/panels/MyBillingPlanPanel.jsx",
  "src/components/mypage/panels/MyPaymentMethodPanel.jsx",
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
    if (!readText(filePath).includes(snippet)) fail(`${filePath} missing required snippet: ${snippet}`);
  }

  for (const [filePath, snippet] of FORBIDDEN_SOURCE_SNIPPETS) {
    if (fs.existsSync(filePath) && readText(filePath).includes(snippet)) {
      fail(`${filePath} contains forbidden snippet: ${snippet}`);
    }
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  const safetyTopIndex = panelText.indexOf("tradingSafetyAssessmentShell");
  const detailIndex = panelText.indexOf("tradingSafetyDetailChainShell");
  const labIndex = panelText.indexOf("tradingLabDashboardPanel");
  if (safetyTopIndex < 0 || detailIndex < 0 || labIndex < 0) fail("admin trading safety/lab sections must exist");
  if (!(safetyTopIndex < labIndex && labIndex < detailIndex)) {
    fail("safety summary, lab dashboard, and safety details must keep their tab branch ordering");
  }
  if (!/<details\s+className="tradingSafetyDetailChainShell"[\s\S]*data-default-collapsed="true"/.test(panelText)) {
    fail("safety detail chain must stay collapsed by default");
  }
  if (panelText.includes("tradingSafetyAssessmentShell") && panelText.includes("tradingSafetyStatusCards")) {
    const safetyTop = panelText.slice(safetyTopIndex, panelText.indexOf("</section>", safetyTopIndex));
    if (safetyTop.includes("tradingLabKpiGrid") || safetyTop.includes("tradingLabLineChart")) {
      fail("safety assessment must not render mock performance dashboard widgets");
    }
  }

  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = readText("src/components/portfolio/services/serverPortfolioService.js");
  for (const forbiddenEndpoint of [
    "trading-safety-assessment-layout-polish",
    "buildAdminTradingSafetyAssessmentLayoutPolishStatus",
    "fetchAdminTradingSafetyAssessmentLayoutPolishStatus",
  ]) {
    if (routeText.includes(forbiddenEndpoint)) fail(`Step 176 must not add a new endpoint; route contains ${forbiddenEndpoint}`);
    if (clientText.includes(forbiddenEndpoint)) fail(`Step 176 must not add a new endpoint; client contains ${forbiddenEndpoint}`);
  }

  const cssText = readText("src/App.css");
  const step176CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => line.includes("tradingSafety"));
  if (step176CssLines.length === 0) fail("Step 176 must include scoped trading safety CSS");
  const broadSelectors = step176CssLines.filter((line) => /\.(card|panel|section|header|nav|active)\b/.test(line));
  if (broadSelectors.length > 0) {
    fail(`Step 176 must not add broad global selectors: ${broadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of PUBLIC_SURFACE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingSafetyAssessmentShell")
      || text.includes("trading-safety-assessment-layout-polish")
      || text.includes("tradingSafetyDetailChainShell")
    ) {
      fail(`safety assessment layout polish must not touch public/mypage surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("safety-assessment-layout-polish")) {
      fail(`scenario runtime files must remain untouched by Step 176: ${filePath}`);
    }
  }

  console.log("[check-trading-step176-admin-trading-safety-assessment-layout-polish] ok");
}

main();
