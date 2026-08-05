import test from "node:test";
import assert from "node:assert/strict";

import {
  createTradingShadowRun,
  getLatestTradingShadowSnapshot,
  resetTradingShadowMemoryForTest,
  saveTradingShadowSnapshot,
  stopTradingShadowRun,
} from "./tradingShadowSnapshotRepository.js";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalRuntimeFlag = process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED;

function restoreEnvironment() {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalRuntimeFlag === undefined) delete process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED;
  else process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED = originalRuntimeFlag;
}

test.beforeEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED;
  resetTradingShadowMemoryForTest();
});

test.after(() => {
  restoreEnvironment();
});

test("memory Shadow persistence stores sanitized snapshots without broker identifiers", async () => {
  const created = await createTradingShadowRun({
    id: "run-memory-1",
    strategyVersionId: "version-1",
    strategyVersionNumber: 1,
    strategyChecksum: "abc123",
    initialCash: 100000,
    startedAt: "2026-08-05T00:00:00.000Z",
  });
  assert.equal(created.persistence.mode, "memory_shadow");

  const saved = await saveTradingShadowSnapshot({
    runId: "run-memory-1",
    asOf: "2026-08-05T00:01:00.000Z",
    status: "running",
    observationSessions: 1,
    cycleCount: 2,
    metrics: { netPnl: 100 },
    ledger: {
      positions: { TQQQ: { quantity: 5 } },
      orders: [{ symbol: "TQQQ" }],
      fills: [],
      trades: [],
      equityCurve: [{ timestamp: "2026-08-05T00:01:00.000Z", equity: 100100 }],
      dailyPnl: [{ date: "2026-08-05", pnl: 100 }],
      rollingWindows: [],
      breakdown: { bySymbol: {} },
    },
  });
  assert.equal(saved.snapshot.sequenceNumber, 0);
  assert.equal(saved.snapshot.safety.orderSubmissionAllowed, false);
  assert.equal(saved.snapshot.safety.accountIdentifierStored, false);
  assert.equal(saved.snapshot.accountId, undefined);

  const latest = await getLatestTradingShadowSnapshot({ runId: "run-memory-1" });
  assert.equal(latest.snapshot.metrics.netPnl, 100);
  const stopped = await stopTradingShadowRun("run-memory-1", {
    reason: "test_stop",
    stoppedAt: "2026-08-05T00:02:00.000Z",
  });
  assert.equal(stopped.run.status, "stopped");
  assert.equal(stopped.run.stopReason, "test_stop");
});

test("rejects invalid Shadow run input before persistence", async () => {
  await assert.rejects(
    () => createTradingShadowRun({ strategyVersionId: "", strategyChecksum: "", initialCash: 0 }),
    (error) => error.code === "INVALID_SHADOW_RUN_INPUT" && error.statusCode === 400,
  );
});

test("persistent snapshot sequence locks the parent run instead of using aggregate FOR UPDATE", async () => {
  process.env.DATABASE_URL = "postgres://test.invalid/finple";
  process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED = "true";
  const schemaQuery = async (sql) => {
    assert.match(sql, /to_regclass/);
    return { rows: [{ runs: "trading_shadow_runs", snapshots: "trading_shadow_snapshots" }] };
  };
  const calls = [];
  const withTransaction = async (callback) => callback(async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes("SELECT id FROM trading_shadow_runs")) return { rowCount: 1, rows: [{ id: "run-db-1" }] };
    if (sql.includes("MAX(sequence_number)")) return { rowCount: 1, rows: [{ next_sequence: 2 }] };
    if (sql.includes("INSERT INTO trading_shadow_snapshots")) {
      return {
        rowCount: 1,
        rows: [{
          id: "snapshot-db-1",
          run_id: "run-db-1",
          sequence_number: 2,
          as_of: "2026-08-05T00:03:00.000Z",
          worker_status: "running",
          observation_sessions: 1,
          cycle_count: 3,
          metrics: {},
          promotion_assessment: {},
          positions: {},
          recent_orders: [],
          recent_fills: [],
          recent_trades: [],
          equity_curve: [],
          daily_pnl: [],
          rolling_windows: [],
          performance_breakdown: {},
          snapshot_checksum: "checksum",
          created_at: "2026-08-05T00:03:00.000Z",
        }],
      };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const result = await saveTradingShadowSnapshot({
    runId: "run-db-1",
    asOf: "2026-08-05T00:03:00.000Z",
    metrics: {},
    ledger: {},
  }, { query: schemaQuery, withTransaction });
  assert.equal(result.snapshot.sequenceNumber, 2);
  assert.match(calls[0].sql, /trading_shadow_runs.*FOR UPDATE/s);
  assert.match(calls[1].sql, /MAX\(sequence_number\)/);
  assert.doesNotMatch(calls[1].sql, /FOR UPDATE/);
});
