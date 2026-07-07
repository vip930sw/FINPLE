const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 169 checker covers dashboard UX polish core implementation and safety boundaries", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step169-admin-trading-lab-dashboard-ux-polish-core.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP169_ADMIN_TRADING_LAB_DASHBOARD_UX_POLISH_CORE_FLAGS/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_CORE_MODEL/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_CORE_RESULT_SCHEMA/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_SUMMARY_FIRST_LAYOUT_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_COLLAPSIBLE_DETAIL_CHAIN_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_KOREAN_LABEL_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_DASHBOARD_UX_POLISH_SAFETY_NOTICE_RESULT_MODEL/);
  assert.match(checkText, /validateTradingLabDashboardUxPolishCore/);
  assert.match(checkText, /buildTradingLabDashboardUxPolishCoreResult/);
  assert.match(checkText, /buildAdminTradingLabDashboardUxPolishCoreStatus/);
  assert.match(checkText, /trading-lab-dashboard-ux-polish-core/);
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
  assert.match(checkText, /dashboardUxPolishPersistenceAllowed: true/);
  assert.match(checkText, /myPageRouteChanged: true/);
  assert.match(checkText, /accountSubscriptionBillingChanged: true/);
  assert.match(checkText, /FORBIDDEN_IMPLEMENTATION_TERMS/);
  assert.match(packageText, /check:trading-step169-admin-trading-lab-dashboard-ux-polish-core/);
});
