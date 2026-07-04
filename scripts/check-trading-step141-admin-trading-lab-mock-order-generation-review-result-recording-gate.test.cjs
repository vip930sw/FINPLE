const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 141 admin trading lab mock order generation review result recording gate check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step141-admin-trading-lab-mock-order-generation-review-result-recording-gate.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step141-admin-trading-lab-mock-order-generation-review-result-recording-gate\] ok/);
});

test("Step 141 check requires mock order generation review models, receipt, validation core, route, and UI", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step141-admin-trading-lab-mock-order-generation-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_MODEL",
    "TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RECEIPT_SCHEMA",
    "TRADING_LAB_MOCK_ORDER_INTENT_REVIEW_SUMMARY_MODEL",
    "TRADING_LAB_MOCK_ORDER_REVIEW_DECISION_SUMMARY_MODEL",
    "validateTradingLabMockOrderGenerationReviewResult",
    "buildTradingLabMockOrderGenerationReviewResultRecordingGate",
    "buildAdminTradingLabMockOrderGenerationReviewResultStatus",
    "trading-lab-mock-order-generation-review-result",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 141 check protects admin-only exposure and forbids live/provider/order promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step141-admin-trading-lab-mock-order-generation-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const term of [
    "mock order generation review result endpoint must stay admin-only and read-only",
    "mock order generation review result must not be exposed on /mypage",
    "mock order generation review result must not be exposed on homepage or public router",
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
