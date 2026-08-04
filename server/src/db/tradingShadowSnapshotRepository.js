import { createHash, randomUUID } from "node:crypto";

import {
  isDatabaseConfigured,
  query as databaseQuery,
  withTransaction as databaseWithTransaction,
} from "./database.js";

export const TRADING_SHADOW_RUNTIME_SCHEMA_VERSION = "trading-shadow-runtime-schema-v1";

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function clean(value) {
  return String(value ?? "").trim();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function runtimeEnabled() {
  return isDatabaseConfigured() && normalizeBoolean(process.env.FINPLE_TRADING_SHADOW_RUNTIME_ENABLED, false);
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    strategyKey: row.strategy_key,
    strategyVersionId: row.strategy_version_id,
    strategyVersionNumber: Number(row.strategy_version_number),
    strategyChecksum: row.strategy_checksum,
    status: row.status,
    initialCash: Number(row.initial_cash),
    startedAt: row.started_at,
    stoppedAt: row.stopped_at,
    stopReason: row.stop_reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSnapshot(row) {
  if (!row) return null;
  return {
    id: row.id,
    runId: row.run_id,
    sequenceNumber: Number(row.sequence_number),
    asOf: row.as_of,
    status: row.worker_status,
    observationSessions: Number(row.observation_sessions),
    cycleCount: Number(row.cycle_count),
    metrics: row.metrics,
    promotion: row.promotion_assessment,
    ledger: {
      positions: row.positions,
      orders: row.recent_orders,
      fills: row.recent_fills,
      trades: row.recent_trades,
      equityCurve: row.equity_curve,
      dailyPnl: row.daily_pnl,
      rollingWindows: row.rolling_windows,
      breakdown: row.performance_breakdown,
    },
    checksum: row.snapshot_checksum,
    createdAt: row.created_at,
    mode: "shadow",
    ok: true,
    safety: {
      virtualOnly: true,
      orderSubmissionAllowed: false,
      rawProviderPayloadStored: false,
      accountIdentifierStored: false,
    },
  };
}

async function schemaStatus(queryFn = databaseQuery) {
  if (!runtimeEnabled()) {
    return {
      databaseConfigured: isDatabaseConfigured(),
      featureEnabled: false,
      schemaReady: false,
      mode: "memory_shadow",
      reason: isDatabaseConfigured() ? "shadow_runtime_feature_flag_disabled" : "database_not_configured",
    };
  }
  const result = await queryFn(
    `SELECT
       to_regclass('public.trading_shadow_runs') AS runs,
       to_regclass('public.trading_shadow_snapshots') AS snapshots`,
  );
  const row = result.rows?.[0] || {};
  const ready = Boolean(row.runs && row.snapshots);
  return {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady: ready,
    mode: ready ? "postgres_shadow" : "shadow_schema_missing",
    reason: ready ? null : "apply_20260805_trading_shadow_runtime_migration",
  };
}

const memory = {
  runs: new Map(),
  snapshots: new Map(),
};

export function resetTradingShadowMemoryForTest() {
  memory.runs.clear();
  memory.snapshots.clear();
}

export async function getTradingShadowRuntimeStatus(dependencies = {}) {
  return schemaStatus(dependencies.query ?? databaseQuery);
}

export async function createTradingShadowRun(input = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const status = await schemaStatus(queryFn);
  const run = {
    id: clean(input.id) || randomUUID(),
    strategyKey: clean(input.strategyKey) || "leveraged-etf-scalping-v1",
    strategyVersionId: clean(input.strategyVersionId),
    strategyVersionNumber: Number(input.strategyVersionNumber),
    strategyChecksum: clean(input.strategyChecksum),
    status: "running",
    initialCash: Number(input.initialCash),
    startedAt: input.startedAt || new Date().toISOString(),
    stoppedAt: null,
    stopReason: null,
    createdBy: clean(input.createdBy) || "admin_console",
  };
  if (!run.strategyVersionId || !run.strategyChecksum || !Number.isFinite(run.initialCash) || run.initialCash <= 0) {
    const error = new Error("Shadow run 생성 입력이 유효하지 않습니다.");
    error.code = "INVALID_SHADOW_RUN_INPUT";
    error.statusCode = 400;
    throw error;
  }

  if (!status.schemaReady) {
    memory.runs.set(run.id, { ...run, createdAt: run.startedAt, updatedAt: run.startedAt });
    memory.snapshots.set(run.id, []);
    return { run: memory.runs.get(run.id), persistence: status };
  }

  const result = await queryFn(
    `INSERT INTO trading_shadow_runs (
       id, strategy_key, strategy_version_id, strategy_version_number,
       strategy_checksum, status, initial_cash, started_at, created_by
     ) VALUES ($1, $2, $3, $4, $5, 'running', $6, $7, $8)
     RETURNING *`,
    [
      run.id,
      run.strategyKey,
      run.strategyVersionId,
      run.strategyVersionNumber,
      run.strategyChecksum,
      run.initialCash,
      run.startedAt,
      run.createdBy,
    ],
  );
  return { run: mapRun(result.rows?.[0]), persistence: status };
}

export async function saveTradingShadowSnapshot(snapshot = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const transaction = dependencies.withTransaction ?? databaseWithTransaction;
  const status = await schemaStatus(queryFn);
  const runId = clean(snapshot.runId);
  if (!runId) {
    const error = new Error("Shadow snapshot runId가 필요합니다.");
    error.code = "SHADOW_RUN_ID_REQUIRED";
    error.statusCode = 400;
    throw error;
  }
  const sanitized = {
    runId,
    asOf: snapshot.asOf || null,
    status: clean(snapshot.status) || "running",
    observationSessions: Number(snapshot.observationSessions || 0),
    cycleCount: Number(snapshot.cycleCount || 0),
    metrics: snapshot.metrics || {},
    promotion: snapshot.promotion || {},
    positions: snapshot.ledger?.positions || {},
    orders: (snapshot.ledger?.orders || []).slice(-200),
    fills: (snapshot.ledger?.fills || []).slice(-200),
    trades: (snapshot.ledger?.trades || []).slice(-200),
    equityCurve: (snapshot.ledger?.equityCurve || []).slice(-2000),
    dailyPnl: snapshot.ledger?.dailyPnl || [],
    rollingWindows: snapshot.ledger?.rollingWindows || [],
    breakdown: snapshot.ledger?.breakdown || {},
  };
  const snapshotChecksum = checksum(sanitized);

  if (!status.schemaReady) {
    const rows = memory.snapshots.get(runId) || [];
    const row = {
      id: randomUUID(),
      ...sanitized,
      sequenceNumber: rows.length,
      checksum: snapshotChecksum,
      createdAt: new Date().toISOString(),
      mode: "shadow",
      ok: true,
      safety: {
        virtualOnly: true,
        orderSubmissionAllowed: false,
        rawProviderPayloadStored: false,
        accountIdentifierStored: false,
      },
    };
    rows.push(row);
    memory.snapshots.set(runId, rows);
    return { snapshot: row, persistence: status };
  }

  return transaction(async (tx) => {
    const sequenceResult = await tx(
      `SELECT COALESCE(MAX(sequence_number), -1) + 1 AS next_sequence
       FROM trading_shadow_snapshots
       WHERE run_id = $1
       FOR UPDATE`,
      [runId],
    );
    const sequence = Number(sequenceResult.rows?.[0]?.next_sequence ?? 0);
    const result = await tx(
      `INSERT INTO trading_shadow_snapshots (
         id, run_id, sequence_number, as_of, worker_status,
         observation_sessions, cycle_count, metrics, promotion_assessment,
         positions, recent_orders, recent_fills, recent_trades, equity_curve,
         daily_pnl, rolling_windows, performance_breakdown, snapshot_checksum
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb,
         $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18
       ) RETURNING *`,
      [
        randomUUID(),
        runId,
        sequence,
        sanitized.asOf,
        sanitized.status,
        sanitized.observationSessions,
        sanitized.cycleCount,
        JSON.stringify(sanitized.metrics),
        JSON.stringify(sanitized.promotion),
        JSON.stringify(sanitized.positions),
        JSON.stringify(sanitized.orders),
        JSON.stringify(sanitized.fills),
        JSON.stringify(sanitized.trades),
        JSON.stringify(sanitized.equityCurve),
        JSON.stringify(sanitized.dailyPnl),
        JSON.stringify(sanitized.rollingWindows),
        JSON.stringify(sanitized.breakdown),
        snapshotChecksum,
      ],
    );
    return { snapshot: mapSnapshot(result.rows?.[0]), persistence: status };
  });
}

export async function stopTradingShadowRun(runId, input = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const status = await schemaStatus(queryFn);
  const stoppedAt = input.stoppedAt || new Date().toISOString();
  const reason = clean(input.reason) || "operator_stop";
  if (!status.schemaReady) {
    const run = memory.runs.get(runId);
    if (!run) return { run: null, persistence: status };
    const next = { ...run, status: "stopped", stoppedAt, stopReason: reason, updatedAt: stoppedAt };
    memory.runs.set(runId, next);
    return { run: next, persistence: status };
  }
  const result = await queryFn(
    `UPDATE trading_shadow_runs
     SET status = 'stopped', stopped_at = $2, stop_reason = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [runId, stoppedAt, reason],
  );
  return { run: mapRun(result.rows?.[0]), persistence: status };
}

export async function getLatestTradingShadowSnapshot(options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const status = await schemaStatus(queryFn);
  if (!status.schemaReady) {
    const runId = clean(options.runId);
    let rows = runId ? memory.snapshots.get(runId) || [] : [...memory.snapshots.values()].flat();
    rows = [...rows].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    return { snapshot: rows[0] || null, persistence: status };
  }
  const params = [];
  let where = "";
  if (options.runId) {
    params.push(options.runId);
    where = "WHERE run_id = $1";
  }
  const result = await queryFn(
    `SELECT * FROM trading_shadow_snapshots
     ${where}
     ORDER BY created_at DESC, sequence_number DESC
     LIMIT 1`,
    params,
  );
  return { snapshot: mapSnapshot(result.rows?.[0]), persistence: status };
}
