const fs = require("node:fs");

const REQUIRED_FILES = [
  "src/components/TradingReadinessPanel.jsx",
  "src/components/AdminInquiriesPage.jsx",
  "src/components/AccountPages.jsx",
  "src/App.jsx",
  "src/App.css",
  "src/MyPageSidebar.css",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "scripts/check-trading-step132c-admin-trading-dashboard-layout-css.cjs",
  "scripts/check-trading-step132c-admin-trading-dashboard-layout-css.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/AdminInquiriesPage.jsx", "adminTradingConsoleLayout"],
  ["src/components/AdminInquiriesPage.jsx", "adminTradingConsolePanels"],
  ["src/components/TradingReadinessPanel.jsx", 'return "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'activeTradingPanelTab === "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'activeTradingPanelTab === "safety"'],
  ["src/components/TradingReadinessPanel.jsx", "tradingAdminSegmentControl"],
  ["src/components/TradingReadinessPanel.jsx", "tradingLabDashboardPanel"],
  ["src/components/TradingReadinessPanel.jsx", "tradingSafetyPanel"],
  ["src/App.css", "scroll-margin-top: 104px"],
  ["src/App.css", "isolation: isolate"],
  ["src/App.css", "overscroll-behavior-inline: contain"],
  ["src/App.css", ".tradingLabChartLegend span"],
  ["src/MyPageSidebar.css", ".adminTradingConsoleLayout"],
  ["src/MyPageSidebar.css", "max-width: min(1380px, calc(100% - 48px))"],
  ["src/MyPageSidebar.css", ".adminTradingConsoleLayout .adminTradingConsolePanels"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["package.json", "check:trading-step132c-admin-trading-dashboard-layout-css"],
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

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRuleBlock(cssText, selector) {
  const selectorPattern = new RegExp(`(^|\\n)${escapeRegExp(selector)}\\s*\\{`, "g");
  const selectorMatches = [...cssText.matchAll(selectorPattern)];
  const selectorMatch = selectorMatches.at(-1);
  if (!selectorMatch) fail(`missing CSS selector: ${selector}`);
  const openIndex = cssText.indexOf("{", selectorMatch.index);
  const closeIndex = cssText.indexOf("\n}", openIndex);
  if (openIndex < 0 || closeIndex < 0) fail(`unable to parse CSS block: ${selector}`);
  return cssText.slice(openIndex + 1, closeIndex);
}

function requireInBlock(cssText, selector, snippets) {
  const block = getRuleBlock(cssText, selector);
  const missing = snippets.filter((snippet) => !block.includes(snippet));
  if (missing.length > 0) fail(`${selector} missing CSS snippets: ${missing.join(", ")}`);
  return block;
}

function assertNoUnsafePanelPosition(cssText, selectors) {
  for (const selector of selectors) {
    const block = getRuleBlock(cssText, selector);
    if (/position:\s*(fixed|sticky|absolute)\b/.test(block)) {
      fail(`${selector} must not use fixed, sticky, or absolute positioning`);
    }
    if (/margin-top:\s*-\d/.test(block)) {
      fail(`${selector} must not use negative top margin`);
    }
    if (/transform:\s*(translate|scale|rotate)/.test(block)) {
      fail(`${selector} must not use transform positioning`);
    }
  }
}

function main() {
  const missingFiles = REQUIRED_FILES.filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) fail(`missing required files: ${missingFiles.join(", ")}`);

  const forbiddenPaths = FORBIDDEN_PATHS.filter((filePath) => fs.existsSync(filePath));
  if (forbiddenPaths.length > 0) fail(`forbidden trading artifacts present: ${forbiddenPaths.join(", ")}`);

  const missingSnippets = REQUIRED_SNIPPETS.filter(([filePath, snippet]) => !readText(filePath).includes(snippet));
  if (missingSnippets.length > 0) {
    fail(`missing required snippets: ${missingSnippets.map(([filePath, snippet]) => `${filePath}:${snippet}`).join(", ")}`);
  }

  const appCss = readText("src/App.css");
  const sidebarCss = readText("src/MyPageSidebar.css");
  const uiText = readText("src/components/TradingReadinessPanel.jsx");

  requireInBlock(appCss, ".tradingAdminDashboardStack", [
    "position: relative",
    "scroll-margin-top: 104px",
    "min-width: 0",
    "width: 100%",
  ]);
  requireInBlock(appCss, ".tradingAdminTabHeader", [
    "position: relative",
    "min-width: 0",
    "z-index: 0",
  ]);
  requireInBlock(appCss, ".tradingLabDashboardPanel", [
    "margin-top: 0 !important",
    "min-width: 0",
    "overflow: hidden",
    "position: relative",
  ]);
  requireInBlock(appCss, ".tradingLabDashboard", [
    "display: grid",
    "gap: 0.9rem",
    "min-width: 0",
    "overflow: hidden",
    "position: relative",
  ]);
  requireInBlock(appCss, ".tradingLabTableSection", [
    "overflow-x: auto",
    "overscroll-behavior-inline: contain",
    "margin-top: 0",
  ]);
  requireInBlock(appCss, ".tradingLabChartCard", [
    "min-height: 210px",
    "min-width: 0",
    "overflow: hidden",
  ]);
  requireInBlock(appCss, ".tradingLabGrid", [
    "grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))",
    "min-width: 0",
  ]);
  requireInBlock(appCss, ".tradingSafetyPanel", [
    "min-width: 0",
    "overflow: hidden",
    "position: relative",
  ]);
  requireInBlock(sidebarCss, ".adminTradingConsoleLayout", [
    "max-width: min(1380px, calc(100% - 48px))",
    "padding-top: 6px",
    "scroll-margin-top: 104px",
  ]);
  requireInBlock(sidebarCss, ".adminTradingConsoleLayout .adminTradingConsolePanels", [
    "max-width: none !important",
    "min-width: 0",
    "width: 100% !important",
  ]);

  assertNoUnsafePanelPosition(appCss, [
    ".tradingAdminDashboardStack",
    ".tradingAdminTabHeader",
    ".tradingLabDashboardPanel",
    ".tradingLabDashboard",
    ".tradingLabTableSection",
    ".tradingSafetyPanel",
  ]);

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const safetyBranchStart = uiText.indexOf('activeTradingPanelTab === "safety" ? (');
  if (labBranchStart < 0 || safetyBranchStart < 0) fail("admin trading tabs must keep explicit lab and safety conditionals");
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (!labBranch.includes("tradingLabKpiGrid") || !labBranch.includes("tradingLabLineChart")) {
    fail("lab tab must keep KPI and chart dashboard content");
  }
  if (labBranch.includes("tradingReadinessFlagGrid") || labBranch.includes("tradingKisQuoteAdapterOptInPreflight")) {
    fail("lab tab must not render safety gate details");
  }
  const safetyTopBranchEnd = uiText.indexOf(") : null}", safetyBranchStart);
  const safetyDetailBranchStart = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  const safetyDetailBranchEnd = uiText.indexOf("</div>\n  );", safetyDetailBranchStart);
  const safetyBranches = [
    uiText.slice(safetyBranchStart, safetyTopBranchEnd),
    uiText.slice(safetyDetailBranchStart, safetyDetailBranchEnd),
  ].join("\n");
  if (safetyBranches.includes("tradingLabKpiGrid") || safetyBranches.includes("tradingLabLineChart")) {
    fail("safety tab must not render trading lab KPI or chart sections");
  }

  const accountPagesText = readText("src/components/AccountPages.jsx");
  const appText = readText("src/App.jsx");
  const publicExposureTerms = [
    "adminTradingConsoleLayout",
    "adminTradingConsolePanels",
    "tradingLabDashboardPanel",
    "tradingLabKpiGrid",
    "tradingAdminSegmentControl",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`trading lab dashboard must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`trading lab dashboard must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const joined = [
    readText("server/src/services/tradingAdminLabDashboardShell.js"),
    readText("src/components/TradingReadinessPanel.jsx"),
    readText("src/components/AdminInquiriesPage.jsx"),
  ].join("\n");
  const forbiddenTerms = [
    "axios",
    "submitLiveOrder",
    "placeOrder",
    "issueAccessToken(",
    "queryKisQuote(",
    "quotePrice(",
    "DATABASE_URL",
    "privatePacketPath",
    "providerPayloadStored: true",
    "orderPayloadStored: true",
    "rawProviderResponseStored: true",
    "accountIdentifierStored: true",
    "persistentStorageUsed: true",
    "dbWriteUsed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "tokenIssuanceAttempted: true",
    "quoteRequestAttempted: true",
    "networkCallAttempted: true",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 132C"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  console.log("[check-trading-step132c-admin-trading-dashboard-layout-css] ok");
}

main();
