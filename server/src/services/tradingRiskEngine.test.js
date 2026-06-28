import assert from "node:assert/strict";
import test from "node:test";

import {
  RISK_GATE_STATUSES,
  buildTradingRiskEvent,
  evaluateTradingRiskGate,
} from "./tradingRiskEngine.js";

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

function safeRuntime(overrides = {}) {
  return {
    mode: "paper",
    currentSession: "US_REGULAR",
    dailyLossAmount: 0,
    dailyCashDepletion: 0,
    dailyTurnover: 0,
    dailyOrderAttempts: 0,
    consecutiveFailedOrderAttempts: 0,
    allocatedCapital: 1000,
    currentSymbolExposure: 500,
    estimatedSlippage: 0,
    globalTradingDisabled: false,
    dailyLossLimitBreached: false,
    dailyOrderCountLimitBreached: false,
    symbolAllowlisted: true,
    quoteFresh: true,
    fxFresh: true,
    accountStateMatched: true,
    kisAuthOk: false,
    kisRateLimited: false,
    strategyReviewed: true,
    auditLoggerReady: true,
    manualOperatorStop: false,
    ...overrides,
  };
}

function buyIntent(overrides = {}) {
  return {
    symbol: "SPY",
    side: "buy",
    quantity: 1,
    estimatedPrice: 400,
    estimatedFxRate: 1,
    ...overrides,
  };
}

test("risk gate fails closed by default", () => {
  const result = evaluateTradingRiskGate();

  assert.equal(result.valid, false);
  assert.equal(result.status, RISK_GATE_STATUSES.blocked);
  assert.equal(result.intentPromotionAllowed, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.providerCallsAllowed, false);
  assert.match(result.reasons.join("|"), /mode_live_blocked/);
  assert.match(result.reasons.join("|"), /risk_missing_/);
  assert.match(result.reasons.join("|"), /missing_currentSession/);
});

test("paper mode can pass risk gate without provider calls or order submission", () => {
  const result = evaluateTradingRiskGate(buyIntent(), validLimits(), safeRuntime());

  assert.equal(result.valid, true);
  assert.equal(result.status, RISK_GATE_STATUSES.approvedForPaper);
  assert.equal(result.intentPromotionAllowed, true);
  assert.equal(result.paperFillAllowed, true);
  assert.equal(result.shadowRecordAllowed, false);
  assert.equal(result.liveOrderIntentEligible, false);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.providerCallsAllowed, false);
  assert.deepEqual(result.reasons, []);
});

test("manual kill switch blocks paper mode promotion", () => {
  const result = evaluateTradingRiskGate(buyIntent(), validLimits(), safeRuntime({ manualOperatorStop: true }));

  assert.equal(result.valid, false);
  assert.equal(result.status, RISK_GATE_STATUSES.blocked);
  assert.equal(result.paperFillAllowed, false);
  assert.match(result.reasons.join("|"), /kill_switch_manual_operator_stop/);
});

test("live guarded mode is only eligible for review, never direct order submission", () => {
  const result = evaluateTradingRiskGate(
    buyIntent(),
    validLimits(),
    safeRuntime({ mode: "live_guarded", kisAuthOk: true }),
  );

  assert.equal(result.valid, true);
  assert.equal(result.status, RISK_GATE_STATUSES.liveReviewRequired);
  assert.equal(result.liveOrderIntentEligible, true);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.killSwitch.orderSubmissionAllowed, true);
});

test("shadow mode records intent only and remains provider-free", () => {
  const result = evaluateTradingRiskGate(buyIntent(), validLimits(), safeRuntime({ mode: "shadow" }));

  assert.equal(result.valid, true);
  assert.equal(result.status, RISK_GATE_STATUSES.approvedForShadow);
  assert.equal(result.shadowRecordAllowed, true);
  assert.equal(result.orderSubmissionAllowed, false);
  assert.equal(result.providerCallsAllowed, false);
});

test("runtime limits block cash depletion, turnover, and exposure breaches", () => {
  const cash = evaluateTradingRiskGate(
    buyIntent({ quantity: 2, estimatedPrice: 400 }),
    validLimits(),
    safeRuntime({ dailyCashDepletion: 300 }),
  );
  assert.equal(cash.valid, false);
  assert.match(cash.reasons.join("|"), /cash_depletion_exceeds_maxCashDepletionPerDay/);

  const turnover = evaluateTradingRiskGate(
    buyIntent({ quantity: 2, estimatedPrice: 400 }),
    validLimits(),
    safeRuntime({ dailyTurnover: 1300 }),
  );
  assert.equal(turnover.valid, false);
  assert.match(turnover.reasons.join("|"), /turnover_exceeds_maxDailyTurnover/);

  const exposure = evaluateTradingRiskGate(
    buyIntent({ quantity: 3, estimatedPrice: 400 }),
    validLimits({ maxSingleOrderNotional: 2000 }),
    safeRuntime({ currentSymbolExposure: 2000 }),
  );
  assert.equal(exposure.valid, false);
  assert.match(exposure.reasons.join("|"), /symbol_exposure_exceeds_maxSingleSymbolExposure/);
});

test("session, slippage, attempts, and failed attempts fail closed", () => {
  const result = evaluateTradingRiskGate(
    buyIntent(),
    validLimits(),
    safeRuntime({
      currentSession: "US_CLOSED",
      estimatedSlippage: 0.02,
      dailyOrderAttempts: 5,
      consecutiveFailedOrderAttempts: 2,
    }),
  );

  assert.equal(result.valid, false);
  assert.match(result.reasons.join("|"), /session_not_allowed/);
  assert.match(result.reasons.join("|"), /slippage_exceeds_maxSlippageTolerance/);
  assert.match(result.reasons.join("|"), /order_attempts_exceed_or_equal_maxOrderAttemptsPerDay/);
  assert.match(result.reasons.join("|"), /consecutive_failures_exceed_or_equal_maxConsecutiveFailedOrderAttempts/);
});

test("unknown mode is normalized to live_blocked and blocked", () => {
  const result = evaluateTradingRiskGate(buyIntent(), validLimits(), safeRuntime({ mode: "experimental_live" }));

  assert.equal(result.mode, "live_blocked");
  assert.equal(result.status, RISK_GATE_STATUSES.blocked);
  assert.match(result.reasons.join("|"), /unknown_mode_normalized_to_live_blocked/);
  assert.match(result.reasons.join("|"), /mode_live_blocked/);
});

test("risk event snapshot is deterministic and submission-free", () => {
  const result = evaluateTradingRiskGate(buyIntent(), validLimits(), safeRuntime({ manualOperatorStop: true }));
  const event = buildTradingRiskEvent(result, { eventId: "risk-test-1" });

  assert.equal(event.eventId, "risk-test-1");
  assert.equal(event.eventType, "trading_risk_gate");
  assert.equal(event.severity, "block");
  assert.equal(event.symbol, "SPY");
  assert.equal(event.orderSubmissionAllowed, false);
  assert.equal(event.providerCallsAllowed, false);
  assert.match(event.reasons.join("|"), /manual_operator_stop/);
});
