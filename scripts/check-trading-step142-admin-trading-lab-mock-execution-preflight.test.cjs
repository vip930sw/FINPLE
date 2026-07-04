const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 142 admin trading lab mock execution preflight check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step142-admin-trading-lab-mock-execution-preflight.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step142-admin-trading-lab-mock-execution-preflight\] ok/);
});

test("Step 142 check requires mock execution models, validation core, route, and UI", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step142-admin-trading-lab-mock-execution-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_INTENT_MODEL",
    "TRADING_LAB_MOCK_FILL_PLAN_PLACEHOLDER_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_PREVIEW_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_PREVIEW_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_RISK_GUARD_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_RESULT_SCHEMA",
    "validateTradingLabMockExecutionPreflight",
    "buildTradingLabMockExecutionPreflight",
    "buildAdminTradingLabMockExecutionPreflightStatus",
    "trading-lab-mock-execution-preflight",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 142 check protects admin-only exposure and forbids live/provider/order/execution promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step142-admin-trading-lab-mock-execution-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "mock execution preflight endpoint must stay admin-only and read-only",
    "mock execution preflight must not be exposed on /mypage",
    "mock execution preflight must not be exposed on homepage or public router",
    "actualOrderCandidateCreated: true",
    "actualOrderDraftCreated: true",
    "kisOrderPayloadCreated: true",
    "kisExecutionPayloadCreated: true",
    "actualExecutionCreated: true",
    "executionRecordCreated: true",
    "fillCreated: true",
    "accountBalanceQueried: true",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
    "scenario runtime files must remain untouched",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});
