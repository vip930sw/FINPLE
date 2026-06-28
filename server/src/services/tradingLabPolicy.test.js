import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TRADING_MODE,
  evaluateKillSwitch,
  getTradingModePolicy,
  normalizeTradingMode,
  validateOrderIntent,
  validateRiskLimits,
} from "./tradingLabPolicy.js";

function validLimits(overrides = {}) {
  return {
    maxAccountCapitalAllocated: 10000,
    maxCashDepletionPerDay: 1000,
    maxSingleSymbolExposure: 3000,
    maxSingleOrderNotional: 1000,
    maxDailyTurnover: 2000,
    maxOrderAttemptsPerDay: 5,
    maxConsecutiveFailedOrderAttempts: 2,
    maxSlippageTolerance: 0.01,
    allowedMarketSessions: ["US_REGULAR"],
    allowedSymbols: ["SPY", "QQQ"],
    blockedInstruments: ["UVXY"],
    ...overrides,
  };
}

function clearLiveGuardState(overrides = {}) {
  return {
    mode: "live_guarded",
    globalTradingDisabled: false,
    dailyLossLimitBreached: false,
    dailyOrderCountLimitBreached: false,
    symbolAllowlisted: true,
    quoteFresh: true,
    fxFresh: true,
    accountStateMatched: true,
    kisAuthOk: true,
    kisRateLimited: false,
    strategyReviewed: true,
    auditLoggerReady: true,
    manualOperatorStop: false,
    ...overrides,
  };
}

test("normalizes unknown modes to fail-closed live_blocked", () => {
  assert.equal(DEFAULT_TRADING_MODE, "live_blocked");
  assert.equal(normalizeTradingMode("LIVE_GUARDED"), "live_guarded");
  assert.equal(normalizeTradingMode("unexpected"), "live_blocked");
  assert.equal(getTradingModePolicy("unexpected").externalOrderCall, false);
});

test("kill switch fails closed by default", () => {
  const result = evaluateKillSwitch();

  assert.equal(result.mode, "live_blocked");
  assert.equal(result.blocked, true);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.match(result.reasons.join("|"), /global_trading_disabled/);
  assert.match(result.reasons.join("|"), /mode_not_live_guarded/);
  assert.match(result.reasons.join("|"), /manual_operator_stop/);
});

test("kill switch opens only for fully reviewed live_guarded state", () => {
  const result = evaluateKillSwitch(clearLiveGuardState());

  assert.equal(result.blocked, false);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.orderSubmissionAllowed, true);
});

test("risk limits require every category and reject inconsistent caps", () => {
  const missing = validateRiskLimits({ maxAccountCapitalAllocated: 10000 });

  assert.equal(missing.valid, false);
  assert.match(missing.reasons.join("|"), /missing_allowedSymbols/);

  const inconsistent = validateRiskLimits(validLimits({ maxSingleOrderNotional: 12000 }));

  assert.equal(inconsistent.valid, false);
  assert.match(inconsistent.reasons.join("|"), /maxSingleOrderNotional_exceeds_maxAccountCapitalAllocated/);
});

test("risk limits accept conservative complete config", () => {
  const result = validateRiskLimits(validLimits());

  assert.equal(result.valid, true);
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.limits.allowedSymbols, ["SPY", "QQQ"]);
});

test("order intent validator never permits submission directly", () => {
  const result = validateOrderIntent(
    {
      symbol: "SPY",
      side: "buy",
      quantity: 2,
      estimatedPrice: 400,
      estimatedFxRate: 1,
    },
    validLimits(),
    clearLiveGuardState(),
  );

  assert.equal(result.valid, true);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.normalizedIntent.notional, 800);
  assert.equal(result.killSwitch.orderSubmissionAllowed, true);
});

test("order intent blocks disallowed symbols, blocked instruments, and oversize notional", () => {
  const disallowed = validateOrderIntent(
    { symbol: "AAPL", side: "buy", quantity: 1, estimatedPrice: 100, estimatedFxRate: 1 },
    validLimits(),
    clearLiveGuardState(),
  );
  assert.equal(disallowed.valid, false);
  assert.match(disallowed.reasons.join("|"), /symbol_not_in_allowedSymbols/);

  const blocked = validateOrderIntent(
    { symbol: "UVXY", side: "buy", quantity: 1, estimatedPrice: 100, estimatedFxRate: 1 },
    validLimits({ allowedSymbols: ["UVXY"] }),
    clearLiveGuardState(),
  );
  assert.equal(blocked.valid, false);
  assert.match(blocked.reasons.join("|"), /symbol_in_blockedInstruments/);

  const oversize = validateOrderIntent(
    { symbol: "SPY", side: "buy", quantity: 10, estimatedPrice: 400, estimatedFxRate: 1 },
    validLimits(),
    clearLiveGuardState(),
  );
  assert.equal(oversize.valid, false);
  assert.match(oversize.reasons.join("|"), /notional_exceeds_maxSingleOrderNotional/);
});
