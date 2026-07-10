const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 174 checker covers MVP handoff summary, notices, and no new endpoint", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step174-admin-trading-lab-mvp-completion-handoff-summary.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");
  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const cssText = fs.readFileSync("src/App.css", "utf8");
  const headerText = fs.readFileSync("src/components/SiteHeader.jsx", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const clientText = fs.readFileSync("src/components/portfolio/services/serverPortfolioService.js", "utf8");

  assert.match(checkText, /TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS/);
  assert.match(checkText, /TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS/);
  assert.match(checkText, /TRADING_LAB_MVP_HANDOFF_REMAINING_TRACKS/);
  assert.match(checkText, /TRADING_LAB_MVP_HANDOFF_READINESS_FLAGS/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(packageText, /check:trading-step174-admin-trading-lab-mvp-completion-handoff-summary/);

  assert.match(panelText, /trading-lab-mvp-completion-handoff-summary/);
  assert.match(panelText, /tradingLabMvpHandoffSummary/);
  assert.match(panelText, /admin-mock-trading-lab-step174/);
  assert.match(panelText, /internal_mock_mvp_ready_for_final_review/);
  assert.match(panelText, /admin-only · mock-only · fail-closed/);
  assert.match(panelText, /actual KIS\/provider network call/);
  assert.match(panelText, /KIS token issuance/);
  assert.match(panelText, /KIS quote query/);
  assert.match(panelText, /DB-backed trading history/);
  assert.match(panelText, /Render commit metadata stale/);
  assert.match(panelText, /legacy check shell timeout/);
  assert.match(panelText, /전체 node --test 통과 상태와 별도로/);
  assert.match(panelText, /order authority external blocker/);
  assert.match(panelText, /redacted/);
  assert.doesNotMatch(panelText, /<span>mock-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>admin-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>blocked<\/span>/);

  assert.match(cssText, /\.tradingLabMvpHandoffSummary/);
  assert.match(cssText, /\.tradingLabMvpHandoffCards/);
  assert.match(cssText, /\.tradingLabMvpHandoffNotice/);
  assert.match(cssText, /\.tradingLabMvpHandoffLists/);
  assert.match(cssText, /\.adminTradingHeaderActive \.brandIcon i/);
  assert.match(headerText, /adminTradingHeaderActive/);
  assert.doesNotMatch(routeText, /trading-lab-mvp-completion-handoff-summary/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLabMvpCompletionHandoffSummaryStatus/);
});
