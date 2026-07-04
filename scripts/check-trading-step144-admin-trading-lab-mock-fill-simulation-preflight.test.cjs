const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step 144 admin trading lab mock fill simulation preflight check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step144-admin-trading-lab-mock-fill-simulation-preflight.cjs"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.match(output, /check-trading-step144-admin-trading-lab-mock-fill-simulation-preflight\] ok/);
});

test("Step 144 check requires mock fill models, validation core, route, and UI", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step144-admin-trading-lab-mock-fill-simulation-preflight.cjs",
    "utf8",
  );

  for (const snippet of [
    "TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_FILL_SIMULATION_CANDIDATE_MODEL",
    "TRADING_LAB_MOCK_FILL_POLICY_MODEL",
    "validateTradingLabMockFillPolicyAndPriceSource",
    "buildTradingLabMockFillSlippageFeePreview",
    "validateTradingLabMockFillCashImpact",
    "validateTradingLabMockFillPositionImpact",
    "validateTradingLabMockFillSimulationPreflight",
    "buildTradingLabMockFillSimulationPreflight",
    "buildAdminTradingLabMockFillSimulationPreflightStatus",
    "trading-lab-mock-fill-simulation-preflight",
    "tradingLabMockFillSimulationPreflight",
  ]) {
    assert.match(checkText, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step 144 check protects admin-only exposure and forbids live/provider/order/fill promotion", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step144-admin-trading-lab-mock-fill-simulation-preflight.cjs",
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
