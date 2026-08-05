import { randomUUID } from "node:crypto";

import { query as databaseQuery } from "./database.js";

export const KIS_HISTORICAL_CAPTURE_SCHEMA_VERSION = "kis-historical-capture-repository-v1";

const memoryRows = new Map();
const memoryRevisions = new Map();

function clean(value) {
  return String(value ?? "").trim();
}

function enabled(env = process.env) {
  return Boolean(clean(env.DATABASE_URL))
    && ["1", "true", "yes", "on"].includes(clean(env.FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED).toLowerCase());
}

async function persistenceStatus(queryFn = databaseQuery, env = process.env) {
  const databaseConfigured = Boolean(clean(env.DATABASE_URL));
  if (!enabled(env)) {
    return {
      databaseConfigured,
      featureEnabled: false,
      schemaReady: false,
      durable: false,
      mode: "memory_ephemeral",
      reason: databaseConfigured ? "capture_feature_flag_disabled" : "database_not_configured",
    };
  }
  const result = await queryFn(
    `SELECT
       to_regclass('public.trading_kis_market_data_minutes') AS minutes,
       to_regclass('public.trading_kis_market_data_revisions') AS revisions`,
  );
  const row = result.rows?.[0] || {};
  const schemaReady = Boolean(row.minutes && row.revisions);
  return {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady,
    durable: schemaReady,
    mode: schemaReady ? "postgres_durable" : "capture_schema_missing",
    reason: schemaReady ? null : "apply_20260805_trading_kis_historical_capture_migration",
  };
}

function minuteKey(row) {
  return `${clean(row.provider) || "KIS"}|${clean(row.symbol).toUpperCase()}|${clean(row.minuteStart)}`;
}

function mapMinuteRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    symbol: row.symbol,
    minuteStart: row.minute_start,
    minuteEnd: row.minute_end,
    sessionDate: String(row.session_date),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
    tradeCount: Number(row.trade_count),
    quote: {
      bid: Number(row.bid),
      ask: Number(row.ask),
      bidSize: row.bid_size === null ? null : Number(row.bid_size),
      askSize: row.ask_size === null ? null : Number(row.ask_size),
      spreadBps: Number(row.spread_bps),
    },
    source: row.source,
    calendarVersion: row.calendar_version,
    rowChecksum: row.row_checksum,
    capturedAt: row.captured_at,
    createdBy: row.created_by,
  };
}

function mapRevision(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    sessionDate: String(row.session_date),
    datasetId: row.dataset_id,
    sourceRevision: row.source_revision,
    rawDataChecksum: row.raw_data_checksum,
    calendarVersion: row.calendar_version,
    licensePolicyId: row.license_policy_id,
    selectedSymbols: row.selected_symbols,
    coverage: row.coverage,
    rowCount: Number(row.row_count),
    immutable: row.immutable === true,
    readyForModelResearch: row.ready_for_model_research === true,
    sealedAt: row.sealed_at,
    sealedBy: row.sealed_by,
  };
}

export function resetKisHistoricalCaptureMemoryForTest() {
  memoryRows.clear();
  memoryRevisions.clear();
}

export async function getKisHistoricalCapturePersistenceStatus(options = {}, dependencies = {}) {
  return persistenceStatus(dependencies.query ?? databaseQuery, options.env ?? dependencies.env ?? process.env);
}

export async function saveKisHistoricalMinuteRows(rows = [], options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await persistenceStatus(queryFn, env);
  const actor = clean(options.actor) || "kis_capture_runtime";
  let inserted = 0;
  let duplicates = 0;

  for (const input of rows) {
    const row = {
      id: clean(input.id) || randomUUID(),
      provider: clean(input.provider) || "KIS",
      symbol: clean(input.symbol).toUpperCase(),
      minuteStart: clean(input.minuteStart),
      minuteEnd: clean(input.minuteEnd),
      sessionDate: clean(input.sessionDate),
      open: Number(input.open),
      high: Number(input.high),
      low: Number(input.low),
      close: Number(input.close),
      volume: Number(input.volume),
      tradeCount: Number(input.tradeCount),
      quote: input.quote || {},
      source: clean(input.source),
      calendarVersion: clean(input.calendarVersion),
      rowChecksum: clean(input.rowChecksum),
      capturedAt: clean(input.capturedAt) || new Date().toISOString(),
      createdBy: actor,
    };
    const key = minuteKey(row);

    if (!persistence.schemaReady) {
      const existing = memoryRows.get(key);
      if (existing && existing.rowChecksum !== row.rowChecksum) {
        const error = new Error("KIS captured minute conflicts with an immutable existing row.");
        error.code = "KIS_CAPTURE_IMMUTABILITY_CONFLICT";
        error.statusCode = 409;
        error.details = [key];
        throw error;
      }
      if (existing) duplicates += 1;
      else {
        memoryRows.set(key, row);
        inserted += 1;
      }
      continue;
    }

    const existing = await queryFn(
      `SELECT row_checksum FROM trading_kis_market_data_minutes
       WHERE provider = $1 AND symbol = $2 AND minute_start = $3`,
      [row.provider, row.symbol, row.minuteStart],
    );
    if (existing.rows?.[0]) {
      if (clean(existing.rows[0].row_checksum) !== row.rowChecksum) {
        const error = new Error("KIS captured minute conflicts with an immutable existing row.");
        error.code = "KIS_CAPTURE_IMMUTABILITY_CONFLICT";
        error.statusCode = 409;
        error.details = [key];
        throw error;
      }
      duplicates += 1;
      continue;
    }

    await queryFn(
      `INSERT INTO trading_kis_market_data_minutes (
         id, provider, symbol, minute_start, minute_end, session_date,
         open, high, low, close, volume, trade_count,
         bid, ask, bid_size, ask_size, spread_bps,
         source, calendar_version, row_checksum, captured_at, created_by
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17,
         $18, $19, $20, $21, $22
       )`,
      [
        row.id, row.provider, row.symbol, row.minuteStart, row.minuteEnd, row.sessionDate,
        row.open, row.high, row.low, row.close, row.volume, row.tradeCount,
        row.quote.bid, row.quote.ask, row.quote.bidSize, row.quote.askSize, row.quote.spreadBps,
        row.source, row.calendarVersion, row.rowChecksum, row.capturedAt, row.createdBy,
      ],
    );
    inserted += 1;
  }

  return { inserted, duplicates, persistence };
}

export async function readKisHistoricalSessionRows(sessionDate, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await persistenceStatus(queryFn, env);
  const normalizedDate = clean(sessionDate);

  if (!persistence.schemaReady) {
    const rows = [...memoryRows.values()]
      .filter((row) => row.sessionDate === normalizedDate)
      .sort((left, right) => left.minuteStart.localeCompare(right.minuteStart) || left.symbol.localeCompare(right.symbol));
    return { rows, persistence };
  }

  const result = await queryFn(
    `SELECT * FROM trading_kis_market_data_minutes
     WHERE provider = 'KIS' AND session_date = $1
     ORDER BY minute_start ASC, symbol ASC`,
    [normalizedDate],
  );
  return { rows: (result.rows || []).map(mapMinuteRow), persistence };
}

export async function saveKisHistoricalRevision(revision, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await persistenceStatus(queryFn, env);
  const actor = clean(options.actor) || "admin_console";
  const key = `KIS|${clean(revision.sessionDate)}`;

  if (!persistence.schemaReady) {
    const existing = memoryRevisions.get(key);
    if (existing && existing.rawDataChecksum !== revision.rawDataChecksum) {
      const error = new Error("A different immutable revision is already sealed for this KIS session.");
      error.code = "KIS_CAPTURE_REVISION_CONFLICT";
      error.statusCode = 409;
      throw error;
    }
    if (!existing) memoryRevisions.set(key, { ...revision, id: randomUUID(), sealedBy: actor });
    return { revision: memoryRevisions.get(key), persistence };
  }

  const existing = await queryFn(
    `SELECT * FROM trading_kis_market_data_revisions
     WHERE provider = 'KIS' AND session_date = $1`,
    [revision.sessionDate],
  );
  if (existing.rows?.[0]) {
    const mapped = mapRevision(existing.rows[0]);
    if (mapped.rawDataChecksum !== revision.rawDataChecksum) {
      const error = new Error("A different immutable revision is already sealed for this KIS session.");
      error.code = "KIS_CAPTURE_REVISION_CONFLICT";
      error.statusCode = 409;
      throw error;
    }
    return { revision: mapped, persistence };
  }

  const result = await queryFn(
    `INSERT INTO trading_kis_market_data_revisions (
       id, provider, session_date, dataset_id, source_revision, raw_data_checksum,
       calendar_version, license_policy_id, selected_symbols, coverage, row_count,
       immutable, ready_for_model_research, sealed_at, sealed_by
     ) VALUES (
       $1, 'KIS', $2, $3, $4, $5,
       $6, $7, $8::jsonb, $9::jsonb, $10,
       TRUE, $11, $12, $13
     ) RETURNING *`,
    [
      randomUUID(), revision.sessionDate, revision.datasetId, revision.sourceRevision,
      revision.rawDataChecksum, revision.calendarVersion, revision.licensePolicyId,
      JSON.stringify(revision.selectedSymbols), JSON.stringify(revision.coverage),
      revision.rowCount, revision.readyForModelResearch === true, revision.sealedAt, actor,
    ],
  );
  return { revision: mapRevision(result.rows?.[0]), persistence };
}

export async function readLatestKisHistoricalCaptureSummary(options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await persistenceStatus(queryFn, env);

  if (!persistence.schemaReady) {
    const rows = [...memoryRows.values()];
    const revisions = [...memoryRevisions.values()];
    const latestRow = rows.sort((a, b) => b.minuteStart.localeCompare(a.minuteStart))[0] || null;
    const latestRevision = revisions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0] || null;
    return {
      persistence,
      totalRows: rows.length,
      latestCapturedMinute: latestRow?.minuteStart || null,
      latestRevision,
    };
  }

  const result = await queryFn(
    `SELECT
       (SELECT COUNT(*)::int FROM trading_kis_market_data_minutes WHERE provider = 'KIS') AS total_rows,
       (SELECT MAX(minute_start) FROM trading_kis_market_data_minutes WHERE provider = 'KIS') AS latest_minute,
       (SELECT row_to_json(r) FROM (
          SELECT * FROM trading_kis_market_data_revisions
          WHERE provider = 'KIS'
          ORDER BY session_date DESC LIMIT 1
        ) r) AS latest_revision`,
  );
  const row = result.rows?.[0] || {};
  return {
    persistence,
    totalRows: Number(row.total_rows || 0),
    latestCapturedMinute: row.latest_minute || null,
    latestRevision: row.latest_revision ? mapRevision(row.latest_revision) : null,
  };
}
