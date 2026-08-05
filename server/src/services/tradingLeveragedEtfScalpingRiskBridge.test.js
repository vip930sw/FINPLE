import assert from "node:assert/strict";
import test from "node:test";

import { evaluateLeveragedEtfScalpingCycle } from "./tradingLeveragedEtfScalpingRiskBridge.js";

function buildBars() {
  const bars = [];
  const startTime = Date.parse("2026-08-04T14:35:00.000Z");
  for (let index = 0; index < 40; index += 1) {
    const close = 50 + index * 0.08;
    bars.push({
      timestamp: new Date(startTime + index * 60_000).toISOString(),
      open: close - 0.03,
      high: close + 0.08,
      low: close - 0.08,
      close,
      volume: index === 39 ? 2_000_000 : 1_000_000 + (index % 5) * 10_000,
    });
  }
  return bars;
}

function riskLimits() {
  return {
    maxAccountCapitalAllocated: 10_000,
    maxCashDepletionPerDay: 4_000,
    maxSingleSymbolExposure: 3_500,
    maxSingleOrderNotional: 3_500,
    maxDailyTurnover: 25_000,
    maxOrderAttemptsPerDay: 30,
    maxConsecutiveFailedOrderAttempts: 2,
    maxSlippageTolerance: 0.002,
    allowedMarketSessions: ["REGULAR"],
    allowedSymbols: ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"],
    blockedInstruments: ["OPTIONS", "FUTURES", "SINGLE_STOCK_LEVERAGED"],
  };
}

function runtime(mode) {
  return {
    mode,
    globalTradingDisabled: false,
    dailyLossLimitBreached: false,
    dailyOrderCountLimitBreached: false,
    symbolAllowlisted: true,
    quoteFresh: true,
    fxFresh: true,
    accountStateMatched: true,
    kisAuthOk: mode === "live_guarded",
    kisRateLimited: false,
    strategyReviewed: true,
    auditLoggerReady: true,
    manualOperatorStop: false,
    dailyLossAmount: 0,
    dailyCashDepletion: 0,
    dailyTurnover: 0,
    dailyOrderAttempts: 0,
    consecutiveFailedOrderAttempts: 0,
    allocatedCapital: 0,
    currentSymbolExposure: 0,
    estimatedSlippage: 0.0005,
  };
}

function input(mode) {
  const bars = buildBars();
  const close = bars.at(-1).close;
  return {
    symbol: "TQQQ",
    bars,
    quote: { bid: close - 0.01, ask: close + 0.01, timestamp: bars.at(-1).timestamp },
    session: { name: "REGULAR", minutesSinceOpen: 45, minutesToClose: 300 },
    account: { equity: 10_000 },
    position: { quantity: 0 },
    modelSignal: {
      probabilityUp: 0.72,
      expectedReturnBps: 45,
      confidence: 0.78,
      regime: "intraday_bull",
      modelVersion: "test-model-v1",
    },
    riskLimits: riskLimits(),
    runtime: runtime(mode),
  };
}

test("promotes a valid strategy intent to the existing paper risk gate", () => {
  const result = evaluateLeveragedEtfScalpingCycle(input("paper"));
  assert.equal(result.action, "buy");
  assert.equal(result.riskGate.status, "approved_for_paper");
  assert.equal(result.execution.paperFillAllowed, true);
  assert.equal(result.execution.orderSubmissionAllowed, false);
});

test("promotes a valid strategy intent to live eligibility without submitting it", () => {
  const result = evaluateLeveragedEtfScalpingCycle(input("live_guarded"));
  assert.equal(result.action, "buy");
  assert.equal(result.riskGate.status, "live_review_required");
  assert.equal(result.execution.liveOrderIntentEligible, true);
  assert.equal(result.execution.orderSubmissionAllowed, false);
  assert.equal(result.execution.providerCallsAllowed, false);
});

test("does not invoke the risk gate when no order intent exists", () => {
  const candidate = input("paper");
  candidate.modelSignal.expectedReturnBps = 1;
  const result = evaluateLeveragedEtfScalpingCycle(candidate);
  assert.equal(result.action, "flat");
  assert.equal(result.riskGate, null);
});
