import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeReplayBars,
  runLeveragedEtfScalpingReplay,
  runLeveragedEtfWalkForward,
  simulateMarketableLimitFill,
} from "./tradingLeveragedEtfScalpingReplay.js";

function bar(index, overrides = {}) {
  const timestamp = new Date(Date.UTC(2026, 0, 2, 14, 30 + index)).toISOString();
  return {
    symbol: "TQQQ",
    timestamp,
    sessionDate: timestamp.slice(0, 10),
    open: 100 + index,
    high: 101 + index,
    low: 99 + index,
    close: 100.5 + index,
    volume: 10_000,
    quote: { bid: 100.45 + index, ask: 100.55 + index },
    session: { name: "REGULAR", minutesSinceOpen: index, minutesToClose: 390 - index },
    regime: "bull",
    ...overrides,
  };
}

function order(side, quantity = 100, limitPrice = side === "buy" ? 101 : 99) {
  return { symbol: "TQQQ", side, quantity, estimatedPrice: limitPrice, limitPrice };
}

test("normalization rejects duplicate symbol timestamps", () => {
  const result = normalizeReplayBars([bar(0), bar(0)]);
  assert.equal(result.valid, false);
  assert.ok(result.reasons.some((reason) => reason.startsWith("duplicate_symbol_timestamp")));
});

test("marketable limit fill respects participation and reports partial fill", () => {
  const result = simulateMarketableLimitFill(order("buy", 1000, 101), bar(0, { volume: 1000 }), {
    maximumParticipationRate: 0.1,
    minimumFillQuantity: 1,
  });
  assert.equal(result.status, "partial");
  assert.equal(result.fill.quantity, 100);
  assert.equal(result.unfilledQuantity, 900);
  assert.ok(result.fill.price <= 101);
});

test("marketable limit misses when price is not reached", () => {
  const result = simulateMarketableLimitFill(order("buy", 10, 95), bar(0));
  assert.equal(result.status, "missed");
  assert.equal(result.fill, null);
});

test("replay executes signals on the next bar and completes a profitable trade", () => {
  const strategyEvaluator = ({ bars, position }) => {
    if (bars.length === 1 && !position.quantity) {
      return {
        action: "buy",
        reasonCodes: ["test_entry"],
        positionPlan: { stopPrice: 95, takeProfitPrice: 110 },
        orderIntent: { symbol: "TQQQ", side: "buy", quantity: 10, estimatedPrice: 102, limitPrice: 102, idempotencyKey: "buy-1" },
      };
    }
    if (bars.length === 3 && position.quantity > 0) {
      return {
        action: "sell",
        reasonCodes: ["test_exit"],
        positionPlan: null,
        orderIntent: { symbol: "TQQQ", side: "sell", quantity: position.quantity, estimatedPrice: 102, limitPrice: 102, idempotencyKey: "sell-1" },
      };
    }
    return { action: position.quantity ? "hold" : "flat", reasonCodes: [], orderIntent: null };
  };
  const result = runLeveragedEtfScalpingReplay({
    initialCash: 10_000,
    bars: [bar(0), bar(1), bar(2), bar(3)],
    executionConfig: { maximumParticipationRate: 0.5, forceLiquidateAtEnd: false, commissionBpsPerSide: 0 },
  }, { strategyEvaluator });
  assert.equal(result.ok, true);
  assert.equal(result.ledger.orders[0].fillTimestamp, bar(1).timestamp);
  assert.equal(result.ledger.trades.length, 1);
  assert.ok(result.ledger.trades[0].netPnl > 0);
  assert.equal(result.metrics.filledOrders, 2);
});

test("replay records missed orders without inventing fills", () => {
  const strategyEvaluator = ({ bars }) => bars.length === 1 ? {
    action: "buy",
    reasonCodes: ["entry"],
    orderIntent: { symbol: "TQQQ", side: "buy", quantity: 10, estimatedPrice: 90, limitPrice: 90, idempotencyKey: "miss" },
  } : { action: "flat", reasonCodes: [], orderIntent: null };
  const result = runLeveragedEtfScalpingReplay({ initialCash: 10_000, bars: [bar(0), bar(1)], executionConfig: { forceLiquidateAtEnd: false } }, { strategyEvaluator });
  assert.equal(result.metrics.missedOrders, 1);
  assert.equal(result.ledger.fills.length, 0);
  assert.equal(result.metrics.trades, 0);
});

test("force liquidation closes residual position at replay end", () => {
  const strategyEvaluator = ({ bars, position }) => bars.length === 1 && !position.quantity ? {
    action: "buy",
    reasonCodes: ["entry"],
    positionPlan: { stopPrice: 95, takeProfitPrice: 110 },
    orderIntent: { symbol: "TQQQ", side: "buy", quantity: 10, estimatedPrice: 102, limitPrice: 102, idempotencyKey: "buy" },
  } : { action: position.quantity ? "hold" : "flat", reasonCodes: [], orderIntent: null };
  const result = runLeveragedEtfScalpingReplay({ initialCash: 10_000, bars: [bar(0), bar(1), bar(2)] }, { strategyEvaluator });
  assert.equal(Object.keys(result.ledger.positions).length, 0);
  assert.equal(result.ledger.trades.length, 1);
  assert.equal(result.ledger.trades[0].forced, true);
});

test("metrics expose symbol, regime, and entry-hour breakdowns", () => {
  const strategyEvaluator = ({ bars, position }) => {
    if (bars.length === 1 && !position.quantity) return {
      action: "buy", reasonCodes: ["entry"], positionPlan: {},
      orderIntent: { symbol: "TQQQ", side: "buy", quantity: 5, estimatedPrice: 102, limitPrice: 102, idempotencyKey: "b" },
    };
    if (bars.length === 2 && position.quantity) return {
      action: "sell", reasonCodes: ["exit"],
      orderIntent: { symbol: "TQQQ", side: "sell", quantity: position.quantity, estimatedPrice: 100, limitPrice: 100, idempotencyKey: "s" },
    };
    return { action: "flat", reasonCodes: [], orderIntent: null };
  };
  const result = runLeveragedEtfScalpingReplay({ initialCash: 10_000, bars: [bar(0), bar(1), bar(2)] }, { strategyEvaluator });
  assert.equal(result.metrics.breakdown.bySymbol.TQQQ.trades, 1);
  assert.equal(result.metrics.breakdown.byRegime.bull.trades, 1);
  assert.ok(Object.keys(result.metrics.breakdown.byEntryHour).length === 1);
});

test("walk-forward uses prior sessions only as warmup and emits deterministic windows", () => {
  const bars = [];
  for (let day = 0; day < 5; day += 1) {
    for (let minute = 0; minute < 2; minute += 1) {
      const timestamp = new Date(Date.UTC(2026, 0, 2 + day, 14, 30 + minute)).toISOString();
      bars.push(bar(minute, { timestamp, sessionDate: timestamp.slice(0, 10) }));
    }
  }
  const strategyEvaluator = () => ({ action: "flat", reasonCodes: [], orderIntent: null });
  const result = runLeveragedEtfWalkForward({ initialCash: 10_000, bars, trainSessions: 2, testSessions: 1, stepSessions: 1 }, { strategyEvaluator });
  assert.equal(result.ok, true);
  assert.equal(result.windows.length, 3);
  assert.equal(result.aggregate.successfulWindows, 3);
  assert.equal(result.aggregate.totalTrades, 0);
});

test("walk-forward blocks when there are not enough sessions", () => {
  const result = runLeveragedEtfWalkForward({ initialCash: 10_000, bars: [bar(0)], trainSessions: 2, testSessions: 1 });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("insufficient_sessions_for_walk_forward"));
});
