const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 134 admin trading lab strategy config draft controls check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step134-admin-trading-lab-strategy-config-draft-controls.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step134-admin-trading-lab-strategy-config-draft-controls\] ok/);
});

test("Step 134 check requires draft schema, validation core, and mock recalculation boundary", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step134-admin-trading-lab-strategy-config-draft-controls.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA",
    "TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL",
    "TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL",
    "TRADING_LAB_RISK_LIMIT_DRAFT_MODEL",
    "buildTradingLabStrategyConfigDraft",
    "validateTradingLabStrategyConfigDraft",
    "buildTradingLabMockRecalculationBoundary",
    "buildAdminTradingLabStrategyDraftStatus",
    "strategy_draft_mock_recalculation_admin_only",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 134 check protects admin-only exposure and fail-closed trading flags", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step134-admin-trading-lab-strategy-config-draft-controls.cjs",
    "utf8",
  );

  for (const term of [
    "strategy draft endpoint must stay admin-only and read-only",
    "strategy draft controls must not be exposed on /mypage",
    "strategy draft controls must not be exposed on homepage or public router",
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
