const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step 143 admin trading lab mock execution review result recording gate check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step143-admin-trading-lab-mock-execution-review-result-recording-gate.cjs"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.match(output, /check-trading-step143-admin-trading-lab-mock-execution-review-result-recording-gate\] ok/);
});

test("Step 143 check requires mock execution review models, validation core, route, and UI", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step143-admin-trading-lab-mock-execution-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const snippet of [
    "TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_REVIEW_RECEIPT_SCHEMA",
    "buildTradingLabMockExecutionIntentReviewSummary",
    "buildTradingLabMockFillPlanReviewSummary",
    "buildTradingLabMockExecutionCashImpactReviewSummary",
    "buildTradingLabMockExecutionPositionImpactReviewSummary",
    "validateTradingLabMockExecutionReviewResult",
    "buildTradingLabMockExecutionReviewResultRecordingGate",
    "buildAdminTradingLabMockExecutionReviewResultStatus",
    "trading-lab-mock-execution-review-result",
    "tradingLabMockExecutionReviewResult",
  ]) {
    assert.match(checkText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step 143 check protects admin-only exposure and forbids live/provider/order/execution promotion", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step143-admin-trading-lab-mock-execution-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const snippet of [
    "requireAdminAccess",
    "src/components/AccountPages.jsx",
    "src/App.jsx",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "kisExecutionPayloadCreated: true",
    "actualExecutionCreated: true",
    "executionRecordCreated: true",
    "fillCreated: true",
    "accountBalanceQueried: true",
    "queryKisExecution(",
    "data/processed/scenario_monthly_returns.csv",
  ]) {
    assert.match(checkText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
