import test from "node:test";
import assert from "node:assert/strict";

import {
  coordinateLeveragedEtfScalpingDecisions,
  DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
  getLeveragedEtfPairGroup,
  rankScalpingEntryCandidates,
  validateScalpingPortfolioConstraints,
} from "./tradingLeveragedEtfPortfolioCoordinator.js";

function buyDecision(symbol, overrides = {}) {
  const price = overrides.price ?? 100;
  const quantity = overrides.quantity ?? 100;
  return {
    ok: true,
    symbol,
    action: "buy",
    model: {
      probabilityUp: overrides.probabilityUp ?? 0.7,
      expectedReturnBps: overrides.expectedReturnBps ?? 30,
      confidence: overrides.confidence ?? 0.8,
    },
    quote: { spreadBps: overrides.spreadBps ?? 2 },
    sizing: { riskBudget: overrides.riskBudget ?? 1000 },
    positionPlan: { entryPrice: price, stopPrice: price - 1 },
    orderIntent: {
      symbol,
      side: "buy",
      quantity,
      estimatedPrice: price,
      signalSnapshot: {
        expectedNetEdgeBps: overrides.expectedNetEdgeBps ?? 20,
        probabilityUp: overrides.probabilityUp ?? 0.7,
        spreadBps: overrides.spreadBps ?? 2,
      },
    },
  };
}

function sellDecision(symbol) {
  return {
    ok: true,
    symbol,
    action: "sell",
    orderIntent: { symbol, side: "sell", quantity: 10, estimatedPrice: 100 },
  };
}

test("recognizes the four leveraged/inverse ETF pair groups", () => {
  assert.equal(getLeveragedEtfPairGroup("TQQQ"), "nasdaq_3x");
  assert.equal(getLeveragedEtfPairGroup("SQQQ"), "nasdaq_3x");
  assert.equal(getLeveragedEtfPairGroup("SOXL"), "semiconductor_3x");
  assert.equal(getLeveragedEtfPairGroup("SPXU"), "sp500_3x");
  assert.equal(getLeveragedEtfPairGroup("TZA"), "russell2000_3x");
});

test("supports multiple selected symbols but ranks entry candidates by edge", () => {
  const ranked = rankScalpingEntryCandidates([
    buyDecision("TQQQ", { expectedNetEdgeBps: 12 }),
    buyDecision("SOXL", { expectedNetEdgeBps: 28 }),
    buyDecision("UPRO", { expectedNetEdgeBps: 18 }),
  ]);
  assert.deepEqual(ranked.map((item) => item.symbol), ["SOXL", "UPRO", "TQQQ"]);
});

test("accepts multiple independent symbols within account-level limits", () => {
  const result = coordinateLeveragedEtfScalpingDecisions({
    account: { equity: 100000, openPositions: [], pendingSymbols: [] },
    constraints: {
      ...DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
      maxConcurrentPositions: 3,
      maximumNewIntentsPerCycle: 2,
      maxGrossExposureFraction: 0.8,
      maxAggregateRiskFraction: 0.05,
    },
    decisions: [
      buyDecision("TQQQ", { quantity: 100, expectedNetEdgeBps: 20, riskBudget: 1000 }),
      buyDecision("SOXL", { quantity: 100, expectedNetEdgeBps: 25, riskBudget: 1000 }),
      buyDecision("UPRO", { quantity: 100, expectedNetEdgeBps: 10, riskBudget: 1000 }),
    ],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.accepted.map((item) => item.symbol), ["SOXL", "TQQQ"]);
  assert.equal(result.rejected[0].symbol, "UPRO");
  assert.ok(result.rejected[0].reasonCodes.includes("maximum_new_intents_per_cycle_reached"));
  assert.equal(result.orderSubmissionAllowed, false);
});

test("blocks simultaneous bullish and inverse exposure for the same underlying pair", () => {
  const result = coordinateLeveragedEtfScalpingDecisions({
    account: { equity: 100000, openPositions: [{ symbol: "TQQQ", notional: 10000, riskAmount: 500 }] },
    constraints: {
      ...DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
      maxConcurrentPositions: 4,
      maximumNewIntentsPerCycle: 4,
      maxGrossExposureFraction: 1,
      maxAggregateRiskFraction: 0.1,
    },
    decisions: [buyDecision("SQQQ", { quantity: 50, riskBudget: 500 })],
  });
  assert.equal(result.accepted.length, 0);
  assert.ok(result.rejected[0].reasonCodes.includes("opposing_leveraged_pair_conflict"));
});

test("allows opposing pair exposure only with an explicit research override", () => {
  const result = coordinateLeveragedEtfScalpingDecisions({
    account: { equity: 100000, openPositions: [{ symbol: "TQQQ", notional: 10000, riskAmount: 500 }] },
    constraints: {
      ...DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
      allowOpposingPairSimultaneously: true,
      maxConcurrentPositions: 4,
      maximumNewIntentsPerCycle: 4,
      maxGrossExposureFraction: 1,
      maxAggregateRiskFraction: 0.1,
    },
    decisions: [buyDecision("SQQQ", { quantity: 50, riskBudget: 500 })],
  });
  assert.deepEqual(result.accepted.map((item) => item.symbol), ["SQQQ"]);
});

test("blocks candidates when projected gross exposure or aggregate risk exceeds limits", () => {
  const result = coordinateLeveragedEtfScalpingDecisions({
    account: { equity: 100000, openPositions: [{ symbol: "UPRO", notional: 45000, riskAmount: 1500 }] },
    constraints: {
      ...DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
      maxConcurrentPositions: 4,
      maximumNewIntentsPerCycle: 4,
      maxGrossExposureFraction: 0.5,
      maxAggregateRiskFraction: 0.02,
    },
    decisions: [buyDecision("SOXL", { quantity: 100, price: 100, riskBudget: 1000 })],
  });
  assert.equal(result.accepted.length, 0);
  assert.ok(result.rejected[0].reasonCodes.includes("max_gross_exposure_exceeded"));
  assert.ok(result.rejected[0].reasonCodes.includes("max_aggregate_risk_exceeded"));
});

test("risk-reducing exits bypass new-entry capacity limits", () => {
  const result = coordinateLeveragedEtfScalpingDecisions({
    account: {
      equity: 100000,
      openPositions: [
        { symbol: "TQQQ", notional: 20000, riskAmount: 1000 },
        { symbol: "SOXL", notional: 20000, riskAmount: 1000 },
      ],
    },
    constraints: {
      ...DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS,
      maxConcurrentPositions: 2,
      maximumNewIntentsPerCycle: 1,
    },
    decisions: [sellDecision("TQQQ"), buyDecision("UPRO")],
  });
  assert.equal(result.passthroughExits.length, 1);
  assert.equal(result.passthroughExits[0].symbol, "TQQQ");
  assert.equal(result.accepted.length, 0);
  assert.ok(result.rejected[0].reasonCodes.includes("max_concurrent_positions_reached"));
});

test("rejects invalid portfolio constraints fail-closed", () => {
  const validation = validateScalpingPortfolioConstraints({
    maxConcurrentPositions: 0,
    maximumNewIntentsPerCycle: 9,
    maxGrossExposureFraction: 1.2,
    maxAggregateRiskFraction: 0.5,
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.reasons.includes("max_concurrent_positions_out_of_range"));
  assert.ok(validation.reasons.includes("maximum_new_intents_per_cycle_out_of_range"));
  assert.ok(validation.reasons.includes("max_gross_exposure_fraction_out_of_range"));
  assert.ok(validation.reasons.includes("max_aggregate_risk_fraction_out_of_range"));
});
