const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 173 checker covers final stabilization, deployment metadata notice, and no new endpoint", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");
  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const cssText = fs.readFileSync("src/App.css", "utf8");
  const headerText = fs.readFileSync("src/components/SiteHeader.jsx", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const clientText = fs.readFileSync("src/components/portfolio/services/serverPortfolioService.js", "utf8");

  assert.match(checkText, /TRADING_LAB_FINAL_STABILIZATION_ITEMS/);
  assert.match(checkText, /TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS/);
  assert.match(checkText, /TRADING_LAB_SMOKE_REVIEW_HISTORY_ITEMS/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(packageText, /check:trading-step173-admin-trading-lab-final-stabilization-and-deployment-metadata-notice/);

  assert.match(panelText, /trading-lab-final-stabilization-deployment-metadata-notice/);
  assert.match(panelText, /tradingLabFinalStabilizationSummary/);
  assert.match(panelText, /tradingLabDeploymentMetadataNotice/);
  assert.match(panelText, /Render health commit metadata stale/);
  assert.match(panelText, /GitHub\/Vercel\/Render health/);
  assert.match(panelText, /Step169\/admin readiness data/);
  assert.match(panelText, /Step171~172/);
  assert.match(panelText, /새 endpoint는 추가하지 않으며/);
  assert.match(panelText, /KIS\/provider 호출·주문 제출·DB write·live readiness는 계속 차단/);
  assert.match(panelText, /Step166 account\/plan\/billing sync/);
  assert.match(panelText, /My Page·homepage trading UI 없음/);
  assert.match(panelText, /readiness\/provider\/order\/live flags false 유지/);
  assert.doesNotMatch(panelText, /<span>mock-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>admin-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>blocked<\/span>/);

  assert.match(cssText, /\.tradingLabFinalStabilizationSummary/);
  assert.match(cssText, /\.tradingLabDeploymentMetadataNotice/);
  assert.match(cssText, /\.tradingLabFinalStabilizationCards/);
  assert.match(cssText, /\.tradingLabFinalStabilizationLists/);
  assert.match(cssText, /\.adminTradingHeaderActive \.brandIcon i/);
  assert.match(headerText, /adminTradingHeaderActive/);
  assert.doesNotMatch(routeText, /trading-lab-final-stabilization-deployment-metadata-notice/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLabFinalStabilizationDeploymentMetadataNoticeStatus/);
});
