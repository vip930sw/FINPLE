const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 137 admin trading lab strategy draft clearance preflight check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight\] ok/);
});

test("Step 137 check requires clearance preflight schema, candidate, result, and status core", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_SCHEMA",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_CANDIDATE_MODEL",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_BLOCKER_MODEL",
    "TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_RESULT_SCHEMA",
    "validateTradingLabStrategyDraftClearancePreflight",
    "buildTradingLabStrategyDraftClearanceCandidate",
    "buildTradingLabStrategyDraftClearancePreflightResult",
    "buildTradingLabStrategyDraftClearancePreflight",
    "buildAdminTradingLabStrategyDraftClearancePreflightStatus",
  ]) {
    assert.ok(scriptText.includes(term), `expected check script to contain ${term}`);
  }
});

test("Step 137 check protects admin-only exposure, mock-only scope, and fail-closed flags", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step137-admin-trading-lab-strategy-draft-clearance-preflight.cjs",
    "utf8",
  );

  for (const term of [
    "strategy draft clearance preflight endpoint must stay admin-only and read-only",
    "strategy draft clearance preflight must not be exposed on /mypage",
    "strategy draft clearance preflight must not be exposed on homepage or public router",
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
