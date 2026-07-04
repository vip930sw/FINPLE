const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step 145 admin trading lab mock fill simulation review result recording gate check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step145-admin-trading-lab-mock-fill-simulation-review-result-recording-gate.cjs"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.match(output, /check-trading-step145-admin-trading-lab-mock-fill-simulation-review-result-recording-gate\] ok/);
});

test("Step 145 check requires review result model, receipt, validation core, route, and UI", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step145-admin-trading-lab-mock-fill-simulation-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const snippet of [
    "TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_MODEL",
    "TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RECEIPT_SCHEMA",
    "buildTradingLabMockFillSimulationReviewImpactSummary",
    "validateTradingLabMockFillSimulationReviewResult",
    "buildTradingLabMockFillSimulationReviewResultRecordingGate",
    "buildAdminTradingLabMockFillSimulationReviewResultStatus",
    "trading-lab-mock-fill-simulation-review-result",
    "tradingLabMockFillSimulationReview",
  ]) {
    assert.match(checkText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step 145 check protects admin-only exposure and forbids live/provider/order/fill promotion", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step145-admin-trading-lab-mock-fill-simulation-review-result-recording-gate.cjs",
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
    "kisFillPayloadCreated: true",
    "actualExecutionCreated: true",
    "actualFillRecordCreated: true",
    "fillCreated: true",
    "accountBalanceQueried: true",
    "queryKisFill(",
    "data/processed/scenario_monthly_returns.csv",
  ]) {
    assert.match(checkText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
