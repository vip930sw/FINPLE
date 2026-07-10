const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step175 checker is wired to the final review model and guardrails", () => {
  const checkText = read("scripts/check-trading-step175-admin-trading-lab-mvp-final-review.cjs");
  const packageText = read("package.json");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");

  assert.match(checkText, /TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS/);
  assert.match(checkText, /TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE/);
  assert.match(checkText, /TRADING_LAB_MVP_FINAL_REVIEW_EXCLUDED_SCOPE/);
  assert.match(checkText, /TRADING_LAB_MVP_FINAL_REVIEW_KNOWN_ISSUES/);
  assert.match(checkText, /TRADING_LAB_MVP_FINAL_REVIEW_NEXT_SPRINT_OPTIONS/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenarioRuntimeFiles/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(checkText, /mvp_final_review/);

  assert.match(packageText, /check:trading-step175-admin-trading-lab-mvp-final-review/);

  assert.match(panelText, /trading-lab-mvp-final-review/);
  assert.match(panelText, /tradingLabMvpFinalReviewSummary/);
  assert.match(panelText, /internal_mock_mvp_final_review_ready/);
  assert.match(panelText, /admin_only_mock_trading_lab/);
  assert.match(panelText, /order authority external blocker/);
  assert.match(panelText, /Legacy trading check runner cleanup/);
  assert.match(panelText, /DB-backed mock trading history/);
  assert.match(panelText, /AI\/ML strategy console/);
  assert.match(panelText, /KIS read-only quote boundary/);
  assert.ok(panelText.indexOf("tradingLabMvpHandoffSummary") < panelText.indexOf("tradingLabMvpFinalReviewSummary"));
  assert.ok(panelText.indexOf("tradingLabMvpFinalReviewSummary") < panelText.indexOf("tradingLabKpiGrid"));

  assert.match(cssText, /\.tradingLabMvpFinalReviewSummary/);
  assert.match(cssText, /\.tradingLabMvpFinalReviewCards/);
  assert.match(cssText, /\.tradingLabMvpFinalReviewNotice/);
  assert.match(cssText, /\.tradingLabMvpFinalReviewLists/);

  assert.doesNotMatch(routeText, /trading-lab-mvp-final-review/);
  assert.doesNotMatch(clientText, /trading-lab-mvp-final-review/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLabMvpFinalReviewStatus/);
});
