import test from "node:test";
import assert from "node:assert/strict";

import { createKisHistoricalCaptureRunner } from "./tradingKisHistoricalCaptureRunner.js";

function fakeAggregator() {
  return {
    ingest(event) {
      return { accepted: true, completedBars: event.completedBars || [] };
    },
    flush() {
      return [];
    },
  };
}

test("capture runner connects market data only and persists complete cycles", async () => {
  let handlers;
  let feedConfig;
  const captured = [];
  const intervals = [];
  const minuteStartMs = Date.parse("2026-08-04T13:30:00.000Z");
  const runner = createKisHistoricalCaptureRunner(
    {
      selectedSymbols: ["TQQQ", "SQQQ"],
      approval: {
        ready: true,
        baseUrlEnvironment: "live",
        credentialEnvironment: "live",
        websocketEnvironment: "live",
        environmentWebsocketMatch: true,
      },
      flushIntervalMs: 1000,
    },
    {
      now: () => minuteStartMs + 70_000,
      aggregatorFactory: fakeAggregator,
      marketSessionResolver: () => ({
        calendarSupported: true,
        state: "REGULAR",
        sessionDate: "2026-08-04",
        calendarVersion: "nyse-calendar-2026-v1",
        earlyClose: false,
      }),
      accumulator: {
        ingestCycle: async ({ bars }) => {
          captured.push(bars);
          return { accepted: true };
        },
        status: () => ({ acceptedCycles: captured.length }),
      },
      feedFactory: () => ({
        connect: async (config, nextHandlers) => {
          feedConfig = config;
          handlers = nextHandlers;
          return { connected: true, close() {} };
        },
      }),
      setIntervalImpl: (fn) => {
        intervals.push(fn);
        return 1;
      },
      clearIntervalImpl: () => {},
    },
  );

  const started = await runner.start({ appKey: "x", appSecret: "y" });
  assert.equal(started.active, true);
  assert.equal(feedConfig.baseUrlEnvironment, "live");
  assert.equal(feedConfig.credentialEnvironment, "live");
  assert.equal(feedConfig.websocketEnvironment, "live");
  assert.equal(feedConfig.environmentWebsocketMatch, true);

  const makeBar = (symbol) => ({
    symbol,
    minuteStartMs,
    minuteEndMs: minuteStartMs + 60_000,
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 10,
    tradeCount: 2,
    quote: { bid: 100.4, ask: 100.6, eventTimeMs: minuteStartMs + 59_000 },
  });
  handlers.onEvent({ completedBars: [makeBar("TQQQ"), makeBar("SQQQ")] });
  await runner.flush();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].length, 2);
  assert.equal(runner.status().safety.orderSubmissionAllowed, false);
  await runner.stop();
});
