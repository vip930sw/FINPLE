import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLeveragedEtfScalpingDecision,
  DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG,
} from "./tradingLeveragedEtfScalpingStrategy.js";

function buildBars({ count = 40, start = 50, step = 0.08, finalVolumeMultiplier = 1.8 } = {}) {
  const bars = [];
  const startTime = Date.parse("2026-08-04T14:35:00.000Z");
  for (let index = 0; index < count; index += 1) {
    const close = start + step * index;
    const volume = 1_000_000 + (index % 5) * 10_000;
    bars.push({
      timestamp: new Date(startTime + index * 60_000).toISOString(),
      open: close - 0.03,
      high: close + 0.08,
      low: close - 0.08,
      close,
      volume: index === count - 1 ? volume * finalVolumeMultiplier : volume,
    });
  }
  return bars;
}

function strongInput(overrides = {}) {
  const bars = overrides.bars ?? buildBars();
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
    ...overrides,
  };
}

test("creates a bounded buy intent for a strong leveraged ETF scalp", () => {
  const result = buildLeveragedEtfScalpingDecision(strongInput());
  assert.equal(result.action, "buy");
  assert.equal(result.orderIntent.symbol, "TQQQ");
  assert.equal(result.orderIntent.side, "buy");
  assert.equal(result.orderIntent.orderType, "limit");
  assert.equal(result.orderIntent.executionPolicy.marketOrderFallbackAllowed, false);
  assert.ok(result.orderIntent.quantity > 0);
  assert.ok(result.sizing.maximumPositionNotional <= 3_500);
  assert.ok(result.positionPlan.stopPrice < result.positionPlan.entryPrice);
  assert.ok(result.positionPlan.takeProfitPrice > result.positionPlan.entryPrice);
});

test("allows inverse leveraged ETFs as long instruments", () => {
  const result = buildLeveragedEtfScalpingDecision(strongInput({ symbol: "SOXS" }));
  assert.equal(result.action, "buy");
  assert.equal(result.orderIntent.symbol, "SOXS");
});

test("blocks symbols outside the configured scalping universe", () => {
  const result = buildLeveragedEtfScalpingDecision(strongInput({ symbol: "AAPL" }));
  assert.equal(result.action, "blocked");
  assert.ok(result.reasonCodes.includes("symbol_not_in_scalping_universe"));
});

test("does not enter when the spread is wider than the configured limit", () => {
  const input = strongInput();
  const close = input.bars.at(-1).close;
  const result = buildLeveragedEtfScalpingDecision({
    ...input,
    quote: { bid: close - 0.1, ask: close + 0.1, timestamp: input.bars.at(-1).timestamp },
  });
  assert.equal(result.action, "flat");
  assert.ok(result.reasonCodes.includes("spread_exceeds_limit"));
});

test("requires an external model signal by default", () => {
  const input = strongInput();
  delete input.modelSignal;
  const result = buildLeveragedEtfScalpingDecision(input);
  assert.equal(result.action, "flat");
  assert.ok(result.reasonCodes.includes("external_model_signal_required"));
});

test("supports deterministic baseline only when explicitly enabled", () => {
  const input = strongInput({
    config: { ...DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG, requireModelSignal: false },
  });
  delete input.modelSignal;
  const result = buildLeveragedEtfScalpingDecision(input);
  assert.equal(result.model.source, "deterministic_baseline");
  assert.notEqual(result.action, "blocked");
});

test("exits the full position when the trailing stop is triggered", () => {
  const bars = buildBars({ start: 55, step: -0.05, finalVolumeMultiplier: 1 });
  const close = bars.at(-1).close;
  const result = buildLeveragedEtfScalpingDecision(strongInput({
    bars,
    quote: { bid: close - 0.01, ask: close + 0.01, timestamp: bars.at(-1).timestamp },
    position: {
      quantity: 20,
      averagePrice: 55,
      highestPriceSinceEntry: 55.5,
      barsHeld: 4,
      stopPrice: 54.2,
      takeProfitPrice: 56.2,
    },
    modelSignal: {
      probabilityUp: 0.2,
      expectedReturnBps: -30,
      confidence: 0.8,
      regime: "intraday_bear",
      modelVersion: "test-model-v1",
    },
  }));
  assert.equal(result.action, "sell");
  assert.equal(result.orderIntent.quantity, 20);
  assert.ok(result.reasonCodes.includes("stop_or_trailing_stop_triggered"));
});

test("forces an exit in the market close buffer", () => {
  const input = strongInput({
    session: { name: "REGULAR", minutesSinceOpen: 370, minutesToClose: 10 },
    position: {
      quantity: 10,
      averagePrice: 51,
      highestPriceSinceEntry: 53,
      barsHeld: 3,
      stopPrice: 49,
      takeProfitPrice: 60,
    },
  });
  const result = buildLeveragedEtfScalpingDecision(input);
  assert.equal(result.action, "sell");
  assert.ok(result.reasonCodes.includes("market_close_exit_window"));
});

test("produces a stable idempotency key for the same bar and action", () => {
  const first = buildLeveragedEtfScalpingDecision(strongInput());
  const second = buildLeveragedEtfScalpingDecision(strongInput());
  assert.equal(first.orderIntent.idempotencyKey, second.orderIntent.idempotencyKey);
});

test("fails closed on malformed intraday bars", () => {
  const bars = buildBars();
  bars[10] = { ...bars[10], high: bars[10].low - 1 };
  const result = buildLeveragedEtfScalpingDecision(strongInput({ bars }));
  assert.equal(result.action, "blocked");
  assert.ok(result.reasonCodes.includes("high_below_low_10"));
});
