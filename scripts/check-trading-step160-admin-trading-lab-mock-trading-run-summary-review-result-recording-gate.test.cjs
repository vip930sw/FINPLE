const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 160 checker covers mock trading run summary review result implementation and safety boundaries", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step160-admin-trading-lab-mock-trading-run-summary-review-result-recording-gate.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP160_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RECEIPT_SCHEMA/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_DECISION_SUMMARY_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_SECTION_SUMMARY_MODEL/);
  assert.match(checkText, /validateTradingLabMockTradingRunSummaryReviewResult/);
  assert.match(checkText, /buildAdminTradingLabMockTradingRunSummaryReviewResultStatus/);
  assert.match(checkText, /trading-lab-mock-trading-run-summary-review-result/);
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
  assert.match(checkText, /actualCashUpdated: true/);
  assert.match(checkText, /actualPositionUpdated: true/);
  assert.match(checkText, /realTradingRunIdentifierCreated: true/);
  assert.match(checkText, /realTradingRunSummaryStored: true/);
  assert.match(packageText, /check:trading-step160-admin-trading-lab-mock-trading-run-summary-review-result-recording-gate/);
});
