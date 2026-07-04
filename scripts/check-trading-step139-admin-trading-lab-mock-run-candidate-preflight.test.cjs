const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 139 admin trading lab mock run candidate preflight check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step139-admin-trading-lab-mock-run-candidate-preflight.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step139-admin-trading-lab-mock-run-candidate-preflight\] ok/);
});

test("Step 139 check requires mock run candidate models, dependency validation, route, and UI", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step139-admin-trading-lab-mock-run-candidate-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_MOCK_RUN_CANDIDATE_MODEL",
    "TRADING_LAB_MOCK_RUN_PREFLIGHT_MODEL",
    "TRADING_LAB_MOCK_RUN_INPUT_BUNDLE_MODEL",
    "TRADING_LAB_MOCK_RUN_UNIVERSE_SNAPSHOT_MODEL",
    "TRADING_LAB_MOCK_RUN_INITIAL_CAPITAL_MODEL",
    "TRADING_LAB_MOCK_RUN_READINESS_SCHEMA",
    "TRADING_LAB_MOCK_RUN_PREFLIGHT_RESULT_SCHEMA",
    "validateTradingLabMockRunCandidatePreflight",
    "buildTradingLabMockRunCandidatePreflight",
    "buildAdminTradingLabMockRunCandidatePreflightStatus",
    "trading-lab-mock-run-candidate-preflight",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 139 check protects admin-only exposure and forbids runtime/order/provider promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step139-admin-trading-lab-mock-run-candidate-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "mock run candidate preflight endpoint must stay admin-only and read-only",
    "mock run candidate preflight must not be exposed on /mypage",
    "mock run candidate preflight must not be exposed on homepage or public router",
    "orderCandidateCreated: true",
    "orderDraftCreated: true",
    "executionCreated: true",
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
