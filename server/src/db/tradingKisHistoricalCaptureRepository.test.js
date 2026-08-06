import test from "node:test";
import assert from "node:assert/strict";

import {
  getKisHistoricalCapturePersistenceStatus,
  readLatestKisHistoricalCaptureSummary,
  readKisHistoricalSessionRows,
  resetKisHistoricalCaptureMemoryForTest,
  saveKisHistoricalMinuteRows,
  saveKisHistoricalRevision,
} from "./tradingKisHistoricalCaptureRepository.js";

function row(checksum = "a".repeat(64)) {
  return {
    provider: "KIS",
    symbol: "TQQQ",
    minuteStart: "2026-08-04T13:30:00.000Z",
    minuteEnd: "2026-08-04T13:31:00.000Z",
    sessionDate: "2026-08-04",
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 500,
    tradeCount: 10,
    quote: { bid: 100.4, ask: 100.6, bidSize: 20, askSize: 25, spreadBps: 19.9 },
    source: "kis_realtime_completed_1m",
    calendarVersion: "nyse-calendar-2026-v1",
    rowChecksum: checksum,
  };
}

test("uses explicit ephemeral memory mode when durable schema is unavailable", async () => {
  resetKisHistoricalCaptureMemoryForTest();
  const status = await getKisHistoricalCapturePersistenceStatus({ env: {} });
  assert.equal(status.mode, "memory_ephemeral");
  assert.equal(status.durable, false);
  const saved = await saveKisHistoricalMinuteRows([row()], { env: {} });
  assert.equal(saved.inserted, 1);
  const read = await readKisHistoricalSessionRows("2026-08-04", { env: {} });
  assert.equal(read.rows.length, 1);
});

test("idempotent duplicate rows do not replace immutable data", async () => {
  resetKisHistoricalCaptureMemoryForTest();
  const first = await saveKisHistoricalMinuteRows([row()], { env: {} });
  const second = await saveKisHistoricalMinuteRows([row()], { env: {} });
  assert.equal(first.inserted, 1);
  assert.equal(second.duplicates, 1);
  await assert.rejects(
    saveKisHistoricalMinuteRows([row("b".repeat(64))], { env: {} }),
    (error) => error.code === "KIS_CAPTURE_IMMUTABILITY_CONFLICT",
  );
});

test("session revision is immutable in memory fallback", async () => {
  resetKisHistoricalCaptureMemoryForTest();
  const revision = {
    provider: "KIS",
    sessionDate: "2026-08-04",
    datasetId: "kis-us-equity-completed-1m-2026-08-04",
    sourceRevision: "kis:2026-08-04:abc",
    rawDataChecksum: "c".repeat(64),
    calendarVersion: "nyse-calendar-2026-v1",
    licensePolicyId: "kis-open-api-internal-read-only-market-data-v1",
    selectedSymbols: ["TQQQ"],
    coverage: { coverageRatio: 1 },
    rowCount: 1,
    immutable: true,
    readyForModelResearch: false,
    sealedAt: "2026-08-05T00:00:00.000Z",
  };
  const first = await saveKisHistoricalRevision(revision, { env: {} });
  assert.equal(first.revision.rawDataChecksum, revision.rawDataChecksum);
  await assert.rejects(
    saveKisHistoricalRevision({ ...revision, rawDataChecksum: "d".repeat(64) }, { env: {} }),
    (error) => error.code === "KIS_CAPTURE_REVISION_CONFLICT",
  );
});

test("latest summary reuses a supplied persistence status", async () => {
  let queryCount = 0;
  const persistence = {
    databaseConfigured: true,
    schemaReady: true,
    durable: true,
    mode: "postgres",
  };
  const result = await readLatestKisHistoricalCaptureSummary({ env: {}, persistence }, {
    query: async () => {
      queryCount += 1;
      return { rows: [{ total_rows: 0, latest_minute: null, latest_revision: null }] };
    },
  });

  assert.equal(queryCount, 1);
  assert.equal(result.persistence, persistence);
});
