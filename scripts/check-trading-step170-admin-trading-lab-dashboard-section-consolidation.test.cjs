const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 170 checker covers dashboard section consolidation and safety boundaries", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step170-admin-trading-lab-dashboard-section-consolidation.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");
  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const headerText = fs.readFileSync("src/components/SiteHeader.jsx", "utf8");
  const cssText = fs.readFileSync("src/App.css", "utf8");

  assert.match(checkText, /TRADING_LAB_DETAIL_GROUPS/);
  assert.match(checkText, /tradingLabDetailChainShell/);
  assert.match(checkText, /tradingLabConsolidatedSafetyNotice/);
  assert.match(checkText, /tradingLabEmptyChartPlaceholder/);
  assert.match(checkText, /adminTradingHeaderActive/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(packageText, /check:trading-step170-admin-trading-lab-dashboard-section-consolidation/);
  assert.match(panelText, /Step134~Step138/);
  assert.match(panelText, /Step139~Step148/);
  assert.match(panelText, /Step149~Step153/);
  assert.match(panelText, /Step154~Step158/);
  assert.match(panelText, /Step159~Step161/);
  assert.match(panelText, /Step162~Step169/);
  assert.match(headerText, /adminTradingHeaderActive/);
  assert.match(cssText, /\.tradingLabDetailChainShell/);
  assert.match(cssText, /\.adminTradingHeaderActive \.brandIcon i/);
});
