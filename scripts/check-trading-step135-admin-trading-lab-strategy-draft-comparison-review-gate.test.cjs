const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 135 admin trading lab strategy draft comparison review gate check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step135-admin-trading-lab-strategy-draft-comparison-review-gate.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step135-admin-trading-lab-strategy-draft-comparison-review-gate\] ok/);
});

test("Step 135 check requires comparison, history, risk impact, and review gate core", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step135-admin-trading-lab-strategy-draft-comparison-review-gate.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA",
    "TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL",
    "TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA",
    "TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA",
    "buildTradingLabStrategyDraftComparison",
    "buildTradingLabStrategyDraftChangeHistory",
    "buildTradingLabStrategyRiskImpactPreview",
    "buildTradingLabStrategyDraftReviewGate",
    "buildAdminTradingLabStrategyDraftReviewStatus",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 135 check protects admin-only exposure and fail-closed trading flags", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step135-admin-trading-lab-strategy-draft-comparison-review-gate.cjs",
    "utf8",
  );

  for (const term of [
    "strategy draft review endpoint must stay admin-only and read-only",
    "strategy draft review gate must not be exposed on /mypage",
    "strategy draft review gate must not be exposed on homepage or public router",
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
