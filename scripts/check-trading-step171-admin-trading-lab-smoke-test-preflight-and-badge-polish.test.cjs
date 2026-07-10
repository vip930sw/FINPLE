const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 171 checker covers smoke preflight, badge polish, and no new endpoint", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");
  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const cssText = fs.readFileSync("src/App.css", "utf8");
  const headerText = fs.readFileSync("src/components/SiteHeader.jsx", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const clientText = fs.readFileSync("src/components/portfolio/services/serverPortfolioService.js", "utf8");

  assert.match(checkText, /TRADING_LAB_SMOKE_PREFLIGHT_ITEMS/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(packageText, /check:trading-step171-admin-trading-lab-smoke-test-preflight-and-badge-polish/);

  assert.match(panelText, /trading-lab-smoke-test-preflight/);
  assert.match(panelText, /관리자 화면 표시 안정성 점검/);
  assert.match(panelText, /Step169 admin-only endpoint/);
  assert.match(panelText, /Step171 신규 endpoint 없음/);
  assert.match(panelText, /My Page·homepage trading UI 미노출/);
  assert.match(panelText, /모의 전용/);
  assert.match(panelText, /관리자 전용/);
  assert.match(panelText, /차단 유지/);
  assert.match(panelText, /KIS 호출 없음/);
  assert.match(panelText, /주문 제출 없음/);
  assert.match(panelText, /DB 저장 없음/);
  assert.doesNotMatch(panelText, /<span>mock-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>admin-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>blocked<\/span>/);

  assert.match(cssText, /\.tradingLabConsolidatedBadges span/);
  assert.match(cssText, /\.tradingLabSmokePreflightSummary/);
  assert.match(cssText, /\.adminTradingHeaderActive \.brandIcon i/);
  assert.match(headerText, /adminTradingHeaderActive/);
  assert.doesNotMatch(routeText, /trading-lab-smoke-test-preflight/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLabSmokeTestPreflightStatus/);
});
