import test from "node:test";
import assert from "node:assert/strict";

import { createLeveragedEtfShadowWorker } from "./tradingLeveragedEtfShadowWorker.js";

function approvedVersion(overrides = {}) {
  return {
    id: "version-1",
    versionNumber: 1,
    status: "approved",
    checksum: "abc123",
    strategy: {
      allowedSymbols: ["TQQQ", "SOXL"],
      ...overrides.strategy,
    },
    portfolioConstraints: {
      maxConcurrentPositions: 2,
      maximumNewIntentsPerCycle: 1,
      maxGrossExposureFraction: 0.7,
      maxAggregateRiskFraction: 0.02,
      allowOpposingPairSimultaneously: false,
      allowDuplicatePendingSymbol: false,
      ...overrides.portfolioConstraints,
    },
  };
}

function bar(symbol, minute, price, options = {}) {
  const timestamp = `2026-08-04T14:${String(minute).padStart(2, "0")}:00.000Z`;
  return {
    symbol,
    timestamp,
    sessionDate: "2026-08-04",
    open: price,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: 100000,
    quote: {
      bid: options.bid ?? price - 0.05,
      ask: options.ask ?? price + 0.05,
    },
    session: {
      name: "REGULAR",
      minutesSinceOpen: minute,
      minutesToClose: 390 - minute,
    },
    modelSignal: { regime: "intraday_bull" },
  };
}

function strategyEvaluator(input) {
  const price = input.quote.ask || input.bars.at(-1).close;
  if (input.position?.quantity > 0) {
    return {
      ok: true,
      symbol: input.symbol,
      action: "sell",
      reasonCodes: ["test_exit"],
      orderIntent: {
        symbol: input.symbol,
        side: "sell",
        quantity: input.position.quantity,
        estimatedPrice: input.quote.bid,
        limitPrice: input.quote.bid,
        signalTimestamp: input.bars.at(-1).timestamp,
        signalSnapshot: { expectedNetEdgeBps: 0, probabilityUp: 0.4, spreadBps: 2 },
      },
    };
  }
  const edge = input.symbol === "TQQQ" ? 20 : 10;
  return {
    ok: true,
    symbol: input.symbol,
    action: "buy",
    reasonCodes: ["test_entry"],
    sizing: { riskBudget: 100 },
    model: { probabilityUp: 0.7, expectedReturnBps: edge, confidence: 0.8 },
    positionPlan: {
      entryPrice: price,
      stopPrice: price - 1,
      takeProfitPrice: price + 2,
    },
    orderIntent: {
      symbol: input.symbol,
      side: "buy",
      quantity: 10,
      estimatedPrice: price,
      limitPrice: price,
      signalTimestamp: input.bars.at(-1).timestamp,
      signalSnapshot: { expectedNetEdgeBps: edge, probabilityUp: 0.7, spreadBps: 2 },
    },
  };
}

test("requires an immutable approved strategy version", () => {
  assert.throws(
    () => createLeveragedEtfShadowWorker({ approvedVersion: { status: "draft" }, initialCash: 100000 }),
    (error) => error.code === "INVALID_SHADOW_WORKER_CONFIGURATION",
  );
});

test("ranks multiple symbols, fills only on the next cycle, and records virtual-only ledger", async () => {
  const snapshots = [];
  const worker = createLeveragedEtfShadowWorker(
    { approvedVersion: approvedVersion(), initialCash: 100000 },
    {
      strategyEvaluator,
      idFactory: () => "run-1",
      now: () => "2026-08-05T00:00:00.000Z",
      snapshotSink: async (snapshot) => snapshots.push(snapshot),
    },
  );
  const started = worker.start();
  assert.equal(started.status, "running");
  assert.equal(started.safety.orderSubmissionAllowed, false);

  const first = await worker.ingestCycle({
    bars: [bar("TQQQ", 30, 100), bar("SOXL", 30, 50)],
  });
  assert.equal(first.metrics.ordersSubmitted, 1);
  assert.equal(first.metrics.pendingOrders, 1);
  assert.equal(first.ledger.positions.TQQQ, undefined);
  assert.equal(first.ledger.orders[0].symbol, "TQQQ");
  assert.equal(first.ledger.orders[0].status, "virtual_pending_next_cycle");

  const second = await worker.ingestCycle({
    bars: [bar("TQQQ", 31, 100, { ask: 99.95 }), bar("SOXL", 31, 50)],
  });
  assert.equal(second.ledger.positions.TQQQ.quantity, 10);
  assert.equal(second.metrics.trades, 0);
  assert.ok(second.ledger.fills.every((fill) => fill.virtual === true));
  assert.equal(second.safety.brokerOrderAdapterPresent, false);

  const third = await worker.ingestCycle({
    bars: [bar("TQQQ", 32, 101, { bid: 101.05 }), bar("SOXL", 32, 50)],
  });
  assert.equal(third.metrics.trades, 1);
  assert.equal(third.ledger.positions.TQQQ, undefined);
  assert.equal(third.metrics.netPnl > 0, true);
  assert.equal(third.promotion.status, "insufficient_evidence");
  assert.equal(snapshots.length, 3);
});

test("rejects bars outside the approved multi-select universe", async () => {
  const worker = createLeveragedEtfShadowWorker(
    { approvedVersion: approvedVersion(), initialCash: 100000 },
    { strategyEvaluator },
  );
  worker.start();
  await assert.rejects(
    () => worker.ingestCycle({ bars: [bar("SQQQ", 30, 20)] }),
    (error) => error.code === "SHADOW_SYMBOL_NOT_APPROVED",
  );
});

test("requires a single synchronized timestamp per multi-asset cycle", async () => {
  const worker = createLeveragedEtfShadowWorker(
    { approvedVersion: approvedVersion(), initialCash: 100000 },
    { strategyEvaluator },
  );
  worker.start();
  await assert.rejects(
    () => worker.ingestCycle({ bars: [bar("TQQQ", 30, 100), bar("SOXL", 31, 50)] }),
    (error) => error.code === "SHADOW_CYCLE_TIMESTAMP_MISMATCH",
  );
});

test("stop persists a sanitized snapshot without forcing a virtual liquidation", async () => {
  let persisted = null;
  const worker = createLeveragedEtfShadowWorker(
    { approvedVersion: approvedVersion(), initialCash: 100000 },
    {
      strategyEvaluator,
      snapshotSink: async (snapshot) => { persisted = snapshot; },
    },
  );
  worker.start();
  await worker.ingestCycle({ bars: [bar("TQQQ", 30, 100)] });
  await worker.ingestCycle({ bars: [bar("TQQQ", 31, 100, { ask: 99.95 })] });
  const stopped = await worker.stop("operator_test");
  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.ledger.positions.TQQQ.quantity, 10);
  assert.equal(stopped.safety.accountIdentifierStored, false);
  assert.equal(stopped.safety.rawProviderPayloadStored, false);
  assert.equal(persisted.runId, stopped.runId);
});
