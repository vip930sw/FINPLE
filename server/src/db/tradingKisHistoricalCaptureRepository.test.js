import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { setImmediate } from "node:timers";

import { queryWithDiagnostics } from "./database.js";
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

function diagnosticPool(query) {
  const client = new EventEmitter();
  const releaseArguments = [];
  const pool = {
    totalCount: 1,
    idleCount: 0,
    waitingCount: 1,
    async connect() {
      pool.waitingCount = 0;
      return client;
    },
  };
  client.query = query;
  client.release = (error) => {
    releaseArguments.push(error);
    if (error) {
      pool.totalCount = 0;
    } else {
      pool.idleCount = 1;
    }
  };
  return { client, pool, releaseArguments };
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

test("status query emits separate pool acquire and query release timings", async () => {
  const events = [];
  const persistence = {
    databaseConfigured: true,
    schemaReady: true,
    durable: true,
    mode: "postgres_durable",
  };
  await readLatestKisHistoricalCaptureSummary({ env: {}, persistence }, {
    queryWithDiagnostics: async (text, params, hooks) => {
      hooks.onPoolAcquired({ stageMs: 4, pool: { totalCount: 2, idleCount: 0, waitingCount: 1 } });
      hooks.onPoolReleased({ stageMs: 7, pool: { totalCount: 2, idleCount: 1, waitingCount: 0 } });
      return { rows: [{ total_rows: 0, latest_minute: null, latest_revision: null }] };
    },
    onLifecycleEvent: (event) => events.push(event),
  });

  assert.deepEqual(events.map((event) => [event.event, event.stageMs]), [
    ["summary_pool_acquired", 4],
    ["summary_pool_released", 7],
  ]);
  assert.equal(events[1].pool.idleCount, 1);
});

test("diagnostic query succeeds, emits timings, and releases once", async () => {
  const result = { rows: [{ ok: 1 }] };
  const { client, pool, releaseArguments } = diagnosticPool(async () => result);
  const acquired = [];
  const released = [];
  const times = [0, 4, 10, 17];

  assert.equal(await queryWithDiagnostics("SELECT 1", [], {
    pool,
    monotonicNow: () => times.shift(),
    onPoolAcquired: (event) => acquired.push(event),
    onPoolReleased: (event) => released.push(event),
  }), result);
  assert.deepEqual(releaseArguments, [undefined]);
  assert.equal(client.listenerCount("error"), 0);
  assert.equal(acquired[0].stageMs, 4);
  assert.equal(released[0].stageMs, 7);
});

test("diagnostic query propagates rejection and destroys the client once", async () => {
  const syntheticError = new Error("synthetic query failure");
  const { client, pool, releaseArguments } = diagnosticPool(async () => {
    throw syntheticError;
  });

  await assert.rejects(
    queryWithDiagnostics("SELECT 1", [], { pool }),
    syntheticError,
  );
  assert.deepEqual(releaseArguments, [syntheticError]);
  assert.equal(client.listenerCount("error"), 0);
  assert.equal(pool.totalCount, 0);
  assert.equal(pool.idleCount, 0);
});

test("diagnostic query handles an active client error without leaking details", async () => {
  const syntheticError = new Error("private connection detail");
  const { client, pool, releaseArguments } = diagnosticPool(() => new Promise(() => {}));
  const events = [];
  setImmediate(() => client.emit("error", syntheticError));

  await assert.rejects(
    queryWithDiagnostics("SELECT 1", [], {
      pool,
      onPoolAcquired: (event) => events.push(event),
      onPoolReleased: (event) => events.push(event),
    }),
    syntheticError,
  );
  assert.deepEqual(releaseArguments, [syntheticError]);
  assert.equal(client.listenerCount("error"), 0);
  assert.equal(pool.totalCount, 0);
  assert.doesNotMatch(JSON.stringify(events), /private connection detail/);
});

test("diagnostic query reports idle and waiting pool stats after release", async () => {
  const { pool } = diagnosticPool(async () => ({ rows: [] }));
  const released = [];

  await queryWithDiagnostics("SELECT 1", [], {
    pool,
    onPoolReleased: (event) => released.push(event),
  });
  assert.deepEqual(released[0].pool, {
    initialized: true,
    totalCount: 1,
    idleCount: 1,
    waitingCount: 0,
  });
});
