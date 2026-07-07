const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 168 checker covers dashboard UX polish review result implementation and safety boundaries", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP168_ADMIN_TRADING_LAB_DASHBOARD_UX_POLISH_REVIEW_RESULT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_REVIEW_DECISION_SUMMARY_MODEL/);
  assert.match(checkText, /validateTradingLabDashboardUxPolishReviewResult/);
  assert.match(checkText, /buildTradingLabDashboardUxPolishReviewResult/);
  assert.match(checkText, /buildTradingLabDashboardUxPolishReviewReceipt/);
  assert.match(checkText, /buildAdminTradingLabDashboardUxPolishReviewResultStatus/);
  assert.match(checkText, /trading-lab-dashboard-ux-polish-review-result/);
  assert.match(checkText, /requireAdminAccess/);
  assert.match(checkText, /check-step166-account-plan-mbti\.test\.mjs/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /scenario runtime files must remain untouched/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /kisOrderPayloadCreated: true/);
  assert.match(checkText, /kisExecutionPayloadCreated: true/);
  assert.match(checkText, /kisFillPayloadCreated: true/);
  assert.match(checkText, /executionRecordCreated: true/);
  assert.match(checkText, /fillRecordCreated: true/);
  assert.match(checkText, /portfolioLedgerPersisted: true/);
  assert.match(checkText, /performanceRecordPersisted: true/);
  assert.match(checkText, /tradingRunSummaryPersisted: true/);
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /realTradingRunIdentifierCreated: true/);
  assert.match(checkText, /dashboardUxPolishExecuted: true/);
  assert.match(checkText, /dashboardSectionDeleted: true/);
  assert.match(checkText, /myPageRouteChanged: true/);
  assert.match(checkText, /accountSubscriptionBillingChanged: true/);
  assert.match(checkText, /dashboardUxPolishPersistenceAllowed: true/);
  assert.match(packageText, /check:trading-step168-admin-trading-lab-dashboard-ux-polish-review-result-recording-gate/);
});
