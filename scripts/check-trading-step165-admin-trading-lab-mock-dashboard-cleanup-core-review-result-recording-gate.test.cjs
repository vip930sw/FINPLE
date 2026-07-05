const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 165 checker covers mock dashboard cleanup core review implementation and safety boundaries", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP165_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RESULT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_DECISION_SUMMARY_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_REVIEW_SUMMARY_MODEL/);
  assert.match(checkText, /validateTradingLabMockDashboardCleanupCoreReviewResult/);
  assert.match(checkText, /buildAdminTradingLabMockDashboardCleanupCoreReviewResultStatus/);
  assert.match(checkText, /trading-lab-mock-dashboard-cleanup-core-review-result/);
  assert.match(checkText, /requireAdminAccess/);
  assert.match(checkText, /AccountPages\.jsx/);
  assert.match(checkText, /src\/App\.jsx/);
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
  assert.match(checkText, /accountBalanceQueried: true/);
  assert.match(checkText, /realTradingRunIdentifierCreated: true/);
  assert.match(checkText, /dashboardCleanupCoreReviewPersistenceAllowed: true/);
  assert.match(packageText, /check:trading-step165-admin-trading-lab-mock-dashboard-cleanup-core-review-result-recording-gate/);
});
