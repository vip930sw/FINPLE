const fs = require("node:fs");

const REQUIRED_FILES = [
  "server/src/services/tradingShadowLedger.js",
  "server/src/services/tradingShadowLedger.test.js",
  "server/src/routes/adminTradingReadinessRoutes.js",
  "server/src/routes/adminTradingReadinessRoutes.test.js",
  "src/components/TradingReadinessPanel.jsx",
  "scripts/check-trading-step118-shadow-ledger-dry-run-replay.cjs",
  "scripts/check-trading-step118-shadow-ledger-dry-run-replay.test.cjs",
];

const FORBIDDEN_PATHS = [
  "data/processed/scenario_monthly_returns.csv",
  "server/src/routes/trading",
  "server/src/routes/tradingReadinessRoutes.js",
  "server/src/routes/tradingReadinessRoutes.test.js",
  "server/src/services/trading/kisOrderAdapter.js",
  "server/src/services/trading/kisReadOnlyProvider.js",
  "server/src/services/trading/readOnlyApprovalImport.js",
  "server/src/services/trading/manualOrderPermissionImport.js",
  "server/src/services/trading/tradingLiveGuardedWorker.js",
  "server/src/workers/tradingLiveGuardedWorker.js",
  "src/pages/TradingLab.jsx",
  "src/components/trading",
  "migrations/trading",
];

const REQUIRED_SNIPPETS = [
  ["server/src/index.js", 'app.use("/api/admin/trading-readiness", adminTradingReadinessRoutes);'],
  ["server/src/index.js", "adminTradingReadinessRoutes"],
  ["server/src/routes/adminTradingReadinessRoutes.js", "requireAdminAccess"],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/readiness"'],
  ["server/src/routes/adminTradingReadinessRoutes.js", 'router.get("/shadow-status"'],
  ["server/src/services/tradingShadowLedger.js", "createShadowOrderCandidate"],
  ["server/src/services/tradingShadowLedger.js", "runDryRunReplay"],
  ["server/src/services/tradingShadowLedger.js", "createInMemoryAuditLedger"],
  ["server/src/services/tradingShadowLedger.js", "buildReadOnlyShadowStatusHistory"],
  ["server/src/services/tradingShadowLedger.js", "providerCallsAllowed: false"],
  ["server/src/services/tradingShadowLedger.js", "orderSubmissionAllowed: false"],
  ["src/components/portfolio/services/serverPortfolioService.js", "fetchTradingReadinessStatus"],
  ["src/components/portfolio/services/serverPortfolioService.js", "\"/admin/trading-readiness/readiness\""],
  ["src/components/portfolio/services/serverPortfolioService.js", "includeAdminToken: true"],
  ["src/components/AdminInquiriesPage.jsx", "admin-trading"],
  ["src/components/AdminInquiriesPage.jsx", "<TradingReadinessPanel"],
  ["package.json", "check:trading-step118-shadow-ledger-dry-run-replay"],
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

  const forbidden = FORBIDDEN_PATHS.filter((filePath) => fs.existsSync(filePath));
  if (forbidden.length > 0) fail(`forbidden trading artifacts present: ${forbidden.join(", ")}`);

  const missingSnippets = REQUIRED_SNIPPETS.filter(([filePath, snippet]) => !readText(filePath).includes(snippet));
  if (missingSnippets.length > 0) {
    fail(`missing required snippets: ${missingSnippets.map(([filePath, snippet]) => `${filePath}:${snippet}`).join(", ")}`);
  }

  const accountPagesText = readText("src/components/AccountPages.jsx");
  if (accountPagesText.includes("<TradingReadinessPanel")) fail("trading dashboard must not be exposed on /mypage");

  const appText = readText("src/App.jsx");
  if (!appText.includes("\"admin-trading\": \"/admin/trading\"")) fail("/admin trading route missing");
  if (!appText.includes("admin-trading") || !appText.includes("initialSection=\"trading\"")) fail("admin trading UI route missing");

  const serviceText = readText("server/src/services/tradingShadowLedger.js");
  const routeText = readText("server/src/routes/adminTradingReadinessRoutes.js");
  const forbiddenTerms = ["fetch(", "axios", "submitLiveOrder", "placeOrder", "KIS_TRADING", "DATABASE_URL"];
  const presentForbiddenTerms = forbiddenTerms.filter((term) => `${serviceText}\n${routeText}`.includes(term));
  if (presentForbiddenTerms.length > 0) fail(`forbidden implementation terms present: ${presentForbiddenTerms.join(", ")}`);

  console.log("[check-trading-step118-shadow-ledger-dry-run-replay] ok");
}

main();
