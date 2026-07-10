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
  "scripts/check-trading-step175-admin-trading-lab-mvp-final-review.cjs",
  "scripts/check-trading-step175-admin-trading-lab-mvp-final-review.test.cjs",
  "scripts/check-trading-step174-admin-trading-lab-mvp-completion-handoff-summary.cjs",
  "scripts/check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice.cjs",
  "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs",
  "scripts/check-step166-account-plan-mbti.test.mjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_FINAL_REVIEW_EXCLUDED_SCOPE"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_FINAL_REVIEW_KNOWN_ISSUES"],
  ["src/components/TradingReadinessPanel.jsx", "TRADING_LAB_MVP_FINAL_REVIEW_NEXT_SPRINT_OPTIONS"],
  ["src/components/TradingReadinessPanel.jsx", "trading-lab-mvp-final-review"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpFinalReviewSummary"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpFinalReviewCards"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpFinalReviewNotice"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabMvpFinalReviewLists"],
  ["src/components/TradingReadinessPanel.jsx", "internal_mock_mvp_final_review_ready"],
  ["src/components/TradingReadinessPanel.jsx", "admin_only_mock_trading_lab"],
  ["src/components/TradingReadinessPanel.jsx", "fail_closed"],
  ["src/components/TradingReadinessPanel.jsx", "Render health commit metadata"],
  ["src/components/TradingReadinessPanel.jsx", "legacy trading check runner"],
  ["src/components/TradingReadinessPanel.jsx", "full node --test result"],
  ["src/components/TradingReadinessPanel.jsx", "order authority external blocker"],
  ["src/components/TradingReadinessPanel.jsx", "Legacy trading check runner cleanup"],
  ["src/components/TradingReadinessPanel.jsx", "DB-backed mock trading history"],
  ["src/components/TradingReadinessPanel.jsx", "AI/ML strategy console"],
  ["src/components/TradingReadinessPanel.jsx", "KIS read-only quote boundary"],
  ["src/components/SiteHeader.jsx", "adminTradingHeaderActive"],
  ["src/App.css", ".tradingLabMvpFinalReviewSummary"],
  ["src/App.css", ".tradingLabMvpFinalReviewCards"],
  ["src/App.css", ".tradingLabMvpFinalReviewNotice"],
  ["src/App.css", ".tradingLabMvpFinalReviewLists"],
  ["src/App.css", ".adminTradingHeaderActive .brandIcon i"],
  ["package.json", "check:trading-step175-admin-trading-lab-mvp-final-review"],
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

const FORBIDDEN_NEW_ENDPOINT_SNIPPETS = [
  "trading-lab-mvp-final-review",
  "buildAdminTradingLabMvpFinalReviewStatus",
  "fetchAdminTradingLabMvpFinalReviewStatus",
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
    if (routeText.includes(snippet)) fail(`Step 175 must not add a new endpoint; route contains ${snippet}`);
    if (clientText.includes(snippet)) fail(`Step 175 must not add a new endpoint; client contains ${snippet}`);
  }

  const panelText = readText("src/components/TradingReadinessPanel.jsx");
  assertKeys(panelText.match(/TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS[\s\S]*?\];/)?.[0] || "", [
    "finalReviewStatus",
    "scope",
    "reviewSurface",
    "safetyBoundary",
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "persistentDbWrite",
    "actualLiveTradingReadiness",
    "orderAuthorityExternalBlocker",
    "redacted",
  ], "MVP final review status model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE[\s\S]*?\];/)?.[0] || "", [
    "admin_only_trading_shell",
    "mock_dashboard_sections",
    "safety_tab_split",
    "strategy_draft_review",
    "mock_run_candidate_chain",
    "mock_order_generation_chain",
    "mock_execution_chain",
    "mock_fill_simulation_chain",
    "mock_ledger_performance_chain",
    "mock_trading_run_summary",
    "dashboard_consolidation_polish",
    "mvp_completion_handoff",
    "public_surface_absence",
    "readiness_flags",
  ], "MVP final review completed scope model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_FINAL_REVIEW_EXCLUDED_SCOPE[\s\S]*?\];/)?.[0] || "", [
    "kis_provider_call",
    "kis_token_issuance",
    "kis_quote_query",
    "kis_order_payload",
    "actual_order_submission",
    "actual_execution_fill",
    "actual_balance_cash_position",
    "db_trading_history",
    "persistent_strategy",
    "user_trading_dashboard",
    "automated_order_action",
  ], "MVP final review excluded scope model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_FINAL_REVIEW_KNOWN_ISSUES[\s\S]*?\];/)?.[0] || "", [
    "render_commit_metadata_stale",
    "legacy_check_runner_timeout",
    "node_test_reference",
    "temp_cleanup_backlog",
  ], "MVP final review known issues model");

  assertKeys(panelText.match(/TRADING_LAB_MVP_FINAL_REVIEW_NEXT_SPRINT_OPTIONS[\s\S]*?\];/)?.[0] || "", [
    "legacy_runner_cleanup",
    "db_mock_history",
    "ai_ml_strategy_console",
    "kis_read_only_quote",
  ], "MVP final review next sprint options model");

  const handoffIndex = panelText.indexOf("tradingLabMvpHandoffSummary");
  const finalReviewIndex = panelText.indexOf("tradingLabMvpFinalReviewSummary");
  const kpiIndex = panelText.indexOf("tradingLabKpiGrid");
  if (handoffIndex < 0 || finalReviewIndex < 0 || kpiIndex < 0 || !(handoffIndex < finalReviewIndex && finalReviewIndex < kpiIndex)) {
    fail("MVP final review must render after Step174 handoff and before KPI cards");
  }

  if (!/<details\s+className="tradingLabDetailChainShell"/.test(panelText)) {
    fail("detail log must stay default-collapsed with a details element");
  }

  const headerText = readText("src/components/SiteHeader.jsx");
  if (!headerText.includes('activePage === "admin-trading" ? "adminTradingHeaderActive"')) {
    fail("admin trading header artifact fix must remain scoped to admin-trading active page");
  }

  const cssText = readText("src/App.css");
  const step175CssLines = cssText
    .split(/\r?\n/)
    .filter((line) => (
      line.includes("tradingLabMvpFinalReviewSummary")
      || line.includes("tradingLabMvpFinalReviewCards")
      || line.includes("tradingLabMvpFinalReviewNotice")
      || line.includes("tradingLabMvpFinalReviewLists")
      || line.includes("adminTradingHeaderActive")
    ));
  if (step175CssLines.length === 0) fail("Step 175 must include scoped MVP final review CSS");
  const unsafeBroadSelectors = step175CssLines.filter((line) => (
    /\.(card|panel|table|dashboard|section|header|nav|active)\b/.test(line)
    && !line.includes("adminTradingHeaderActive")
  ));
  if (unsafeBroadSelectors.length > 0) {
    fail(`Step 175 must not add broad global selectors: ${unsafeBroadSelectors.map((line) => line.trim()).join(", ")}`);
  }

  for (const filePath of MY_PAGE_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (
      text.includes("tradingLabMvpFinalReviewSummary")
      || text.includes("trading-lab-mvp-final-review")
      || text.includes("TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS")
      || text.includes("TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE")
    ) {
      fail(`MVP final review UI must not touch mypage/account/subscription/billing surface: ${filePath}`);
    }
  }

  const scenarioRuntimeFiles = [
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "server/src/services/scenarioRuntime.js",
  ];
  for (const filePath of scenarioRuntimeFiles) {
    if (fs.existsSync(filePath) && readText(filePath).includes("mvp_final_review")) {
      fail(`scenario runtime files must remain untouched by Step 175: ${filePath}`);
    }
  }

  console.log("[check-trading-step175-admin-trading-lab-mvp-final-review] ok");
}

main();
