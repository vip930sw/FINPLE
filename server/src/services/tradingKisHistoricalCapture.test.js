import test from "node:test";
import assert from "node:assert/strict";

import {
  buildKisHistoricalSessionRevision,
  createKisHistoricalCaptureAccumulator,
  normalizeKisHistoricalCompletedCycle,
} from "./tradingKisHistoricalCapture.js";

function bar(symbol, minuteStartMs = Date.parse("2026-08-04T13:30:00.000Z")) {
  return {
    symbol,
    minuteStartMs,
    minuteEndMs: minuteStartMs + 60_000,
    sessionDate: "2026-08-04",
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 500,
    tradeCount: 10,
    quote: {
      bid: 100.4,
      ask: 100.6,
      bidSize: 20,
      askSize: 25,
      eventTimeMs: minuteStartMs + 59_000,
    },
    session: {
      name: "REGULAR",
      sessionDate: "2026-08-04",
      calendarVersion: "nyse-calendar-2026-v1",
    },
    calendarVersion: "nyse-calendar-2026-v1",
    source: "kis_realtime_completed_1m",
  };
}

test("normalizes a complete KIS minute cycle without raw provider payloads", () => {
  const result = normalizeKisHistoricalCompletedCycle({
    selectedSymbols: ["TQQQ", "SQQQ"],
    bars: [bar("TQQQ"), bar("SQQQ")],
  });
  assert.equal(result.valid, true);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].provider, "KIS");
  assert.equal(result.rows[0].rawProviderPayloadStored, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
  assert.match(result.rows[0].rowChecksum, /^[a-f0-9]{64}$/);
});

test("rejects incomplete cycles instead of forward filling", () => {
  const result = normalizeKisHistoricalCompletedCycle({
    selectedSymbols: ["TQQQ", "SQQQ"],
    bars: [bar("TQQQ")],
  });
  assert.equal(result.valid, false);
  assert.ok(result.reasons.some((reason) => reason.includes("completed_cycle_symbols_missing")));
  assert.equal(result.safety.forwardFillUsed, false);
});

test("builds a TSC-4G-compatible immutable KIS revision", () => {
  const cycle = normalizeKisHistoricalCompletedCycle({
    selectedSymbols: ["TQQQ", "SQQQ"],
    bars: [bar("TQQQ"), bar("SQQQ")],
  });
  const result = buildKisHistoricalSessionRevision({
    rows: cycle.rows,
    selectedSymbols: ["TQQQ", "SQQQ"],
    sessionDate: "2026-08-04",
    expectedMinutes: 1,
    minimumCoverageRatio: 1,
    persistenceDurable: true,
    sealedAt: "2026-08-05T00:00:00.000Z",
  });
  assert.equal(result.valid, true);
  assert.equal(result.revision.readyForModelResearch, true);
  assert.equal(result.revision.readyForRuntime, false);
  assert.equal(result.revision.modelDatasetProvenance.immutable, true);
  assert.equal(result.revision.modelDatasetProvenance.licensePolicyId, "kis-open-api-internal-read-only-market-data-v1");
  assert.match(result.revision.rawDataChecksum, /^[a-f0-9]{64}$/);
});

test("memory-only revisions remain blocked for model research", () => {
  const cycle = normalizeKisHistoricalCompletedCycle({
    selectedSymbols: ["TQQQ", "SQQQ"],
    bars: [bar("TQQQ"), bar("SQQQ")],
  });
  const result = buildKisHistoricalSessionRevision({
    rows: cycle.rows,
    selectedSymbols: ["TQQQ", "SQQQ"],
    sessionDate: "2026-08-04",
    expectedMinutes: 1,
    minimumCoverageRatio: 1,
    persistenceDurable: false,
  });
  assert.equal(result.revision.readyForModelResearch, false);
  assert.equal(result.revision.coverage.durablePersistence, false);
});

test("accumulator persists complete cycles and seals manually", async () => {
  const stored = [];
  const accumulator = createKisHistoricalCaptureAccumulator(
    { selectedSymbols: ["TQQQ", "SQQQ"], env: {} },
    {
      saveRows: async (rows) => {
        stored.push(...rows);
        return { inserted: rows.length, duplicates: 0, persistence: { durable: true } };
      },
      readRows: async () => ({ rows: stored, persistence: { durable: true } }),
      saveRevision: async (revision) => ({ revision, persistence: { durable: true } }),
    },
  );
  const ingested = await accumulator.ingestCycle({ bars: [bar("TQQQ"), bar("SQQQ")] });
  assert.equal(ingested.accepted, true);
  const sealed = await accumulator.sealSession({
    sessionDate: "2026-08-04",
    expectedMinutes: 1,
    minimumCoverageRatio: 1,
  });
  assert.equal(sealed.sealed, true);
  assert.equal(sealed.revision.readyForModelResearch, true);
  assert.equal(accumulator.status().acceptedCycles, 1);
});
