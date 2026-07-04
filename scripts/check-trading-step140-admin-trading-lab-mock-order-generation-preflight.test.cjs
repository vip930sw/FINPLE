const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 140 admin trading lab mock order generation preflight check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step140-admin-trading-lab-mock-order-generation-preflight.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step140-admin-trading-lab-mock-order-generation-preflight\] ok/);
});

test("Step 140 check requires mock order generation models, validation core, route, and UI", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step140-admin-trading-lab-mock-order-generation-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_ORDER_INTENT_MODEL",
    "TRADING_LAB_MOCK_REBALANCE_DELTA_MODEL",
    "TRADING_LAB_MOCK_TARGET_ALLOCATION_GAP_MODEL",
    "TRADING_LAB_MOCK_BUY_SELL_SIGNAL_PLACEHOLDER_MODEL",
    "TRADING_LAB_MOCK_ORDER_GENERATION_RISK_GUARD_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_RESULT_SCHEMA",
    "validateTradingLabMockOrderGenerationPreflight",
    "buildTradingLabMockOrderGenerationPreflight",
    "buildAdminTradingLabMockOrderGenerationPreflightStatus",
    "trading-lab-mock-order-generation-preflight",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 140 check protects admin-only exposure and forbids live/provider/order promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step140-admin-trading-lab-mock-order-generation-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "mock order generation preflight endpoint must stay admin-only and read-only",
    "mock order generation preflight must not be exposed on /mypage",
    "mock order generation preflight must not be exposed on homepage or public router",
    "actualOrderCandidateCreated: true",
    "actualOrderDraftCreated: true",
    "kisOrderPayloadCreated: true",
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
