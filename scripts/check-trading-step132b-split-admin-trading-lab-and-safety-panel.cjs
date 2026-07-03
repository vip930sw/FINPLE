const fs = require("node:fs");

const REQUIRED_FILES = [
  "src/components/TradingReadinessPanel.jsx",
  "src/components/AdminInquiriesPage.jsx",
  "src/components/AccountPages.jsx",
  "src/App.jsx",
  "src/App.css",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "scripts/check-trading-step132b-split-admin-trading-lab-and-safety-panel.cjs",
  "scripts/check-trading-step132b-split-admin-trading-lab-and-safety-panel.test.cjs",
];

const REQUIRED_SNIPPETS = [
  ["src/components/TradingReadinessPanel.jsx", "TRADING_PANEL_TABS"],
  ["src/components/TradingReadinessPanel.jsx", 'key: "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'key: "safety"'],
  ["src/components/TradingReadinessPanel.jsx", 'return "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'params.get("tab") === "safety" ? "safety" : "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'activeTradingPanelTab === "lab"'],
  ["src/components/TradingReadinessPanel.jsx", 'activeTradingPanelTab === "safety"'],
  ["src/components/TradingReadinessPanel.jsx", "tradingAdminSegmentControl"],
  ["src/components/TradingReadinessPanel.jsx", 'role="tablist"'],
  ["src/components/TradingReadinessPanel.jsx", "모의 운용 대시보드"],
  ["src/components/TradingReadinessPanel.jsx", "거래 안전평가"],
  ["src/components/TradingReadinessPanel.jsx", "모의 평가금액"],
  ["src/components/TradingReadinessPanel.jsx", "누적 수익률"],
  ["src/components/TradingReadinessPanel.jsx", "최근 일별 수익률"],
  ["src/components/TradingReadinessPanel.jsx", "최대 낙폭"],
  ["src/components/TradingReadinessPanel.jsx", "투자 비중"],
  ["src/components/TradingReadinessPanel.jsx", "주문 후보"],
  ["src/components/TradingReadinessPanel.jsx", "감사 로그"],
  ["src/components/TradingReadinessPanel.jsx", "일별 자산 변화"],
  ["src/components/TradingReadinessPanel.jsx", "수익률 경로"],
  ["src/components/TradingReadinessPanel.jsx", "현재 자산분포"],
  ["src/components/TradingReadinessPanel.jsx", "현재 투자전략"],
  ["src/components/TradingReadinessPanel.jsx", "거래 안전상태"],
  ["src/components/TradingReadinessPanel.jsx", "KIS 시세 어댑터 사전검증"],
  ["src/components/AdminInquiriesPage.jsx", 'label: "거래 관리"'],
  ["src/components/AdminInquiriesPage.jsx", 'description: "모의운용·안전평가"'],
  ["src/App.css", "tradingAdminTabHeader"],
  ["src/App.css", "tradingAdminSegmentControl"],
  ["src/App.css", "@media (max-width: 760px)"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "orderSubmissionAllowed: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForReadOnlyProviderCalls: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForOrderSubmission: false"],
  ["server/src/services/tradingAdminLabDashboardShell.js", "readyForLiveGuardedTrading: false"],
  ["package.json", "check:trading-step132b-split-admin-trading-lab-and-safety-panel"],
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

function main() {
  const missingFiles = REQUIRED_FILES.filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) fail(`missing required files: ${missingFiles.join(", ")}`);

  const forbiddenPaths = FORBIDDEN_PATHS.filter((filePath) => fs.existsSync(filePath));
  if (forbiddenPaths.length > 0) fail(`forbidden trading artifacts present: ${forbiddenPaths.join(", ")}`);

  const missingSnippets = REQUIRED_SNIPPETS.filter(([filePath, snippet]) => !readText(filePath).includes(snippet));
  if (missingSnippets.length > 0) {
    fail(`missing required snippets: ${missingSnippets.map(([filePath, snippet]) => `${filePath}:${snippet}`).join(", ")}`);
  }

  const uiText = readText("src/components/TradingReadinessPanel.jsx");
  const labConditionalIndex = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const safetyConditionalIndex = uiText.indexOf('activeTradingPanelTab === "safety" ? (');
  const labPanelIndex = uiText.indexOf("tradingLabDashboardPanel");
  const safetyPanelIndex = uiText.indexOf("tradingSafetyPanel");
  if (labConditionalIndex < 0 || safetyConditionalIndex < 0) fail("admin trading tabs must use explicit lab and safety conditionals");
  if (labPanelIndex < labConditionalIndex) fail("trading lab dashboard panel must be rendered only inside the lab tab branch");
  if (safetyPanelIndex < safetyConditionalIndex) fail("trading safety panel must be rendered only inside the safety tab branch");

  const safetyBranchStart = uiText.indexOf('activeTradingPanelTab === "safety" ? (');
  const safetyTopBranchEnd = uiText.indexOf(") : null}", safetyBranchStart);
  const safetyDetailBranchStart = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labConditionalIndex);
  const safetyDetailBranchEnd = uiText.indexOf("</div>\n  );", safetyDetailBranchStart);
  const safetyBranches = [
    uiText.slice(safetyBranchStart, safetyTopBranchEnd),
    uiText.slice(safetyDetailBranchStart, safetyDetailBranchEnd),
  ].join("\n");
  if (safetyBranches.includes("tradingLabKpiGrid") || safetyBranches.includes("tradingLabLineChart")) {
    fail("safety tab must not render trading lab KPI or chart sections");
  }

  const labBranchStart = uiText.indexOf('activeTradingPanelTab === "lab" ? (');
  const labBranchEnd = uiText.indexOf('{activeTradingPanelTab === "safety" ? (', labBranchStart);
  const labBranch = uiText.slice(labBranchStart, labBranchEnd);
  if (labBranch.includes("tradingReadinessFlagGrid") || labBranch.includes("tradingKisQuoteAdapterOptInPreflight")) {
    fail("lab tab must not render safety gate detail list by default");
  }

  const accountPagesText = readText("src/components/AccountPages.jsx");
  const appText = readText("src/App.jsx");
  const publicExposureTerms = [
    "tradingLabDashboardStatus",
    "tradingAdminSegmentControl",
    "tradingLabKpiGrid",
    "모의 운용 대시보드",
    "거래 안전평가",
  ];
  const accountExposure = publicExposureTerms.filter((term) => accountPagesText.includes(term));
  if (accountExposure.length > 0) fail(`trading lab dashboard must not be exposed on /mypage: ${accountExposure.join(", ")}`);
  const appExposure = publicExposureTerms.filter((term) => appText.includes(term));
  if (appExposure.length > 0) fail(`trading lab dashboard must not be exposed on homepage or public router: ${appExposure.join(", ")}`);

  const forbiddenScenarioFiles = [
    "server/src/services/scenario/calculatePortfolioResult.js",
    "server/src/routes/scenarioRoutes.js",
    "src/components/ScenarioChart.jsx",
  ];
  const touchedScenarioFiles = forbiddenScenarioFiles.filter((filePath) => fs.existsSync(filePath) && readText(filePath).includes("Step 132B"));
  if (touchedScenarioFiles.length > 0) fail(`scenario runtime files must remain untouched: ${touchedScenarioFiles.join(", ")}`);

  const joined = [
    readText("server/src/services/tradingAdminLabDashboardShell.js"),
    readText("src/components/TradingReadinessPanel.jsx"),
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
    "지금 주문하기",
    "자동매매 시작",
    "실계좌 운용 시작",
    "추천 포트폴리오로 매수",
    "수익률 최적화 주문",
  ];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => joined.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step132b-split-admin-trading-lab-and-safety-panel] ok");
}

main();
