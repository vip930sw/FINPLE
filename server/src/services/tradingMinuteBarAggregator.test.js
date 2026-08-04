import test from "node:test";
import assert from "node:assert/strict";
import { createOneMinuteMarketAggregator } from "./tradingMinuteBarAggregator.js";

test("aggregates trade events into one-minute OHLCV and carries latest quote", () => {
  const aggregator = createOneMinuteMarketAggregator({ allowedSymbols: ["TQQQ"] });
  aggregator.ingest({ type: "quote", symbol: "TQQQ", bid: 100, ask: 100.02, spreadBps: 2, eventTimeMs: 1_000 });
  aggregator.ingest({ type: "trade", symbol: "TQQQ", last: 100.01, eventVolume: 10, totalVolume: 1000, eventTimeMs: 2_000 });
  const second = aggregator.ingest({ type: "trade", symbol: "TQQQ", last: 100.5, eventVolume: 5, totalVolume: 1005, eventTimeMs: 30_000 });
  assert.equal(second.currentBar.open, 100.01);
  assert.equal(second.currentBar.high, 100.5);
  assert.equal(second.currentBar.low, 100.01);
  assert.equal(second.currentBar.close, 100.5);
  assert.equal(second.currentBar.volume, 15);
  assert.equal(second.currentBar.quote.ask, 100.02);
});

test("emits completed bar when a later minute arrives without forward fill", () => {
  const aggregator = createOneMinuteMarketAggregator({ allowedSymbols: ["SOXL"] });
  aggregator.ingest({ type: "trade", symbol: "SOXL", last: 40, eventVolume: 2, eventTimeMs: 59_000 });
  const result = aggregator.ingest({ type: "trade", symbol: "SOXL", last: 41, eventVolume: 3, eventTimeMs: 60_001 });
  assert.equal(result.completedBars.length, 1);
  assert.equal(result.completedBars[0].close, 40);
  assert.equal(result.currentBar.open, 41);
  assert.equal(result.completedBars[0].complete, true);
});

test("derives event volume from cumulative volume when necessary", () => {
  const aggregator = createOneMinuteMarketAggregator({ allowedSymbols: ["UPRO"] });
  aggregator.ingest({ type: "trade", symbol: "UPRO", last: 90, totalVolume: 100, eventTimeMs: 1_000 });
  const result = aggregator.ingest({ type: "trade", symbol: "UPRO", last: 91, totalVolume: 107, eventTimeMs: 2_000 });
  assert.equal(result.currentBar.volume, 7);
});

test("rejects out-of-order and non-allowlisted events", () => {
  const aggregator = createOneMinuteMarketAggregator({ allowedSymbols: ["TQQQ"] });
  aggregator.ingest({ type: "trade", symbol: "TQQQ", last: 100, eventVolume: 1, eventTimeMs: 2_000 });
  assert.equal(aggregator.ingest({ type: "trade", symbol: "TQQQ", last: 99, eventVolume: 1, eventTimeMs: 1_000 }).accepted, false);
  assert.equal(aggregator.ingest({ type: "trade", symbol: "AAPL", last: 100, eventVolume: 1, eventTimeMs: 3_000 }).accepted, false);
});

test("flush completes open bars older than current minute", () => {
  const aggregator = createOneMinuteMarketAggregator({ allowedSymbols: ["TZA"] });
  aggregator.ingest({ type: "trade", symbol: "TZA", last: 10, eventVolume: 1, eventTimeMs: 1_000 });
  const bars = aggregator.flush(60_001);
  assert.equal(bars.length, 1);
  assert.equal(bars[0].complete, true);
  assert.equal(aggregator.snapshot("TZA").currentBar, null);
});
