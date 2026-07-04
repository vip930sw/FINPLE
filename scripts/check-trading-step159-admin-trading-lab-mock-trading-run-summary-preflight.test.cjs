const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 159 checker covers mock trading run summary preflight implementation and safety boundaries", () => {
  const checkText = fs.readFileSync("scripts/check-trading-step159-admin-trading-lab-mock-trading-run-summary-preflight.cjs", "utf8");
  const packageText = fs.readFileSync("package.json", "utf8");

  assert.match(checkText, /STEP159_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_FLAGS/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_INPUT_BUNDLE_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_CHAIN_DEPENDENCY_MAP_MODEL/);
  assert.match(checkText, /TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_RESULT_SCHEMA/);
  assert.match(checkText, /buildTradingLabMockTradingRunSummaryInputBundle/);
  assert.match(checkText, /validateTradingLabMockTradingRunSummaryPreflight/);
  assert.match(checkText, /buildAdminTradingLabMockTradingRunSummaryPreflightStatus/);
  assert.match(checkText, /trading-lab-mock-trading-run-summary-preflight/);
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
  assert.match(checkText, /cashPositionMutated: true/);
  assert.match(checkText, /actualTradingRunSummaryCreated: true/);
  assert.match(packageText, /check:trading-step159-admin-trading-lab-mock-trading-run-summary-preflight/);
});
