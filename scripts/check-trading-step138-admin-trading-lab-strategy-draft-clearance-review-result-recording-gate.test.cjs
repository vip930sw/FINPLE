const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 138 admin trading lab strategy draft clearance review result recording gate check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step138-admin-trading-lab-strategy-draft-clearance-review-result-recording-gate.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step138-admin-trading-lab-strategy-draft-clearance-review-result-recording-gate\] ok/);
});

test("Step 138 check requires clearance review result, receipt, summaries, validation, and recording gate core", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step138-admin-trading-lab-strategy-draft-clearance-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_RECORDING_SCHEMA",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RECEIPT_SCHEMA",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_DECISION_SUMMARY_MODEL",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_BLOCKER_SUMMARY_MODEL",
    "validateTradingLabStrategyDraftClearanceReviewResult",
    "buildTradingLabStrategyDraftClearanceReviewResult",
    "buildTradingLabStrategyDraftClearanceReviewReceipt",
    "buildTradingLabStrategyDraftClearanceReviewResultRecordingGate",
    "buildAdminTradingLabStrategyDraftClearanceReviewResultStatus",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 138 check protects admin-only exposure, mock-only review, and fail-closed flags", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step138-admin-trading-lab-strategy-draft-clearance-review-result-recording-gate.cjs",
    "utf8",
  );

  for (const term of [
    "strategy draft clearance review result endpoint must stay admin-only and read-only",
    "strategy draft clearance review result must not be exposed on /mypage",
    "strategy draft clearance review result must not be exposed on homepage or public router",
    "orderCandidateCreated: true",
    "orderDraftCreated: true",
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
