import test from "node:test";
import assert from "node:assert/strict";

import {
  assessScalpingShadowPromotion,
  DEFAULT_SCALPING_PROMOTION_POLICY,
} from "./tradingScalpingPromotionPolicy.js";

test("requires sufficient sessions and trades before candidate status", () => {
  const result = assessScalpingShadowPromotion({
    observationSessions: 20,
    metrics: {
      trades: 30,
      totalReturnPct: 3,
      maxDrawdownPct: 2,
      profitFactor: 1.5,
      fillRatePct: 80,
      averageSlippageBps: 3,
      maxConsecutiveLosses: 3,
    },
    rollingWindows: [{ netReturnPct: 1 }, { netReturnPct: 1 }, { netReturnPct: 1 }],
    dailyPnl: [{ pnl: 100 }, { pnl: 100 }, { pnl: 100 }],
    breakdown: { bySymbol: { TQQQ: { netPnl: 100 }, SOXL: { netPnl: 100 } } },
  });
  assert.equal(result.status, "insufficient_evidence");
  assert.equal(result.automaticLiveActivationAllowed, false);
});

test("blocks concentrated performance even when headline return is positive", () => {
  const result = assessScalpingShadowPromotion({
    observationSessions: 60,
    metrics: {
      trades: 120,
      totalReturnPct: 5,
      maxDrawdownPct: 4,
      profitFactor: 1.4,
      fillRatePct: 80,
      averageSlippageBps: 3,
      maxConsecutiveLosses: 4,
    },
    rollingWindows: [{ netReturnPct: 2 }, { netReturnPct: 1 }, { netReturnPct: -0.5 }],
    dailyPnl: [{ pnl: 900 }, { pnl: 50 }, { pnl: 50 }],
    breakdown: { bySymbol: { TQQQ: { netPnl: 900 }, SOXL: { netPnl: 100 } } },
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.gates.find((gate) => gate.label === "단일일 수익기여도").status, "missed");
});

test("promotes only diversified and repeatable shadow evidence to candidate", () => {
  const result = assessScalpingShadowPromotion({
    observationSessions: 65,
    metrics: {
      trades: 130,
      totalReturnPct: 3.2,
      maxDrawdownPct: 3.5,
      profitFactor: 1.35,
      fillRatePct: 78,
      averageSlippageBps: 3.4,
      maxConsecutiveLosses: 5,
    },
    rollingWindows: [{ netReturnPct: 1.2 }, { netReturnPct: 0.9 }, { netReturnPct: -0.2 }],
    dailyPnl: [{ pnl: 250 }, { pnl: 220 }, { pnl: 200 }, { pnl: 180 }],
    breakdown: {
      bySymbol: {
        TQQQ: { netPnl: 500 },
        SOXL: { netPnl: 300 },
        UPRO: { netPnl: -50 },
      },
    },
  });
  assert.equal(result.status, "shadow_candidate");
  assert.equal(result.summary.missed, 0);
  assert.equal(result.manualReviewRequired, true);
});

test("default policy uses longer evidence than a single 20-session target", () => {
  assert.equal(DEFAULT_SCALPING_PROMOTION_POLICY.minimumObservationSessions, 60);
  assert.equal(DEFAULT_SCALPING_PROMOTION_POLICY.minimumCompletedTrades, 100);
  assert.equal(DEFAULT_SCALPING_PROMOTION_POLICY.rollingWindowCount, 3);
});
