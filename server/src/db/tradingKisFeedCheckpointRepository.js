import { randomUUID } from "node:crypto";

import {
  isDatabaseConfigured,
  query as databaseQuery,
} from "./database.js";

export const KIS_SHADOW_FEED_CHECKPOINT_KEY = "leveraged-etf-scalping-kis-shadow-feed-v1";
export const KIS_SHADOW_FEED_CHECKPOINT_SCHEMA_VERSION = "kis-shadow-feed-checkpoint-v1";

const memory = [];
const SENSITIVE_KEY_PATTERN = /(secret|token|password|approval_key|appkey|app_key|account|raw|payload|credential)/i;

function clean(value) {
  return String(value ?? "").trim();
}

function enabled(env = process.env) {
  return isDatabaseConfigured() && ["1", "true", "yes", "on"].includes(clean(env.FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED).toLowerCase());
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .map(([key, next]) => [key, sanitize(next)]),
  );
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    feedKey: row.feed_key,
    shadowRunId: row.shadow_run_id,
    strategyVersionId: row.strategy_version_id,
    strategyVersionNumber: row.strategy_version_number === null ? null : Number(row.strategy_version_number),
    operationalState: row.operational_state,
    runner: row.runner_state,
    guard: row.guard_state,
    approval: row.approval_metadata,
    selectedSymbols: row.selected_symbols,
    stopReason: row.stop_reason,
    manualResumeRequired: row.manual_resume_required === true,
    createdBy: row.created_by,
    createdAt: row.created_at,
    schemaVersion: KIS_SHADOW_FEED_CHECKPOINT_SCHEMA_VERSION,
  };
}

async function status(queryFn = databaseQuery, env = process.env) {
  if (!enabled(env)) {
    return {
      databaseConfigured: isDatabaseConfigured(),
      featureEnabled: false,
      schemaReady: false,
      mode: "memory_checkpoint",
      reason: isDatabaseConfigured() ? "checkpoint_feature_flag_disabled" : "database_not_configured",
    };
  }
  const result = await queryFn(
    "SELECT to_regclass('public.trading_kis_shadow_feed_checkpoints') AS checkpoints",
  );
  const schemaReady = Boolean(result.rows?.[0]?.checkpoints);
  return {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady,
    mode: schemaReady ? "postgres_checkpoint" : "checkpoint_schema_missing",
    reason: schemaReady ? null : "apply_20260805_trading_kis_shadow_feed_checkpoints_migration",
  };
}

export function resetKisFeedCheckpointMemoryForTest() {
  memory.length = 0;
}

export async function getKisFeedCheckpointStatus(options = {}, dependencies = {}) {
  return status(dependencies.query ?? databaseQuery, options.env ?? dependencies.env ?? process.env);
}

export async function saveKisFeedCheckpoint(input = {}, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await status(queryFn, env);
  const row = {
    id: clean(input.id) || randomUUID(),
    feedKey: clean(input.feedKey) || KIS_SHADOW_FEED_CHECKPOINT_KEY,
    shadowRunId: clean(input.shadowRunId) || null,
    strategyVersionId: clean(input.strategyVersionId) || null,
    strategyVersionNumber: Number.isFinite(Number(input.strategyVersionNumber)) ? Number(input.strategyVersionNumber) : null,
    operationalState: clean(input.operationalState) || "unknown",
    runner: sanitize(input.runner || {}),
    guard: sanitize(input.guard || {}),
    approval: sanitize({
      approvalId: input.approval?.approvalId || null,
      expiresAt: input.approval?.expiresAt || null,
      scope: input.approval?.scope || null,
      environment: input.approval?.environment || null,
    }),
    selectedSymbols: [...new Set((input.selectedSymbols || []).map((symbol) => clean(symbol).toUpperCase()).filter(Boolean))],
    stopReason: clean(input.stopReason) || null,
    manualResumeRequired: input.manualResumeRequired !== false,
    createdBy: clean(options.actor) || "system",
    createdAt: options.createdAt || new Date().toISOString(),
  };

  if (!persistence.schemaReady) {
    memory.push({ ...row, schemaVersion: KIS_SHADOW_FEED_CHECKPOINT_SCHEMA_VERSION });
    if (memory.length > 100) memory.splice(0, memory.length - 100);
    return { checkpoint: memory.at(-1), persistence };
  }

  const result = await queryFn(
    `INSERT INTO trading_kis_shadow_feed_checkpoints (
       id, feed_key, shadow_run_id, strategy_version_id, strategy_version_number,
       operational_state, runner_state, guard_state, approval_metadata,
       selected_symbols, stop_reason, manual_resume_required, created_by, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb,
       $10::jsonb, $11, $12, $13, $14
     ) RETURNING *`,
    [
      row.id,
      row.feedKey,
      row.shadowRunId,
      row.strategyVersionId,
      row.strategyVersionNumber,
      row.operationalState,
      JSON.stringify(row.runner),
      JSON.stringify(row.guard),
      JSON.stringify(row.approval),
      JSON.stringify(row.selectedSymbols),
      row.stopReason,
      row.manualResumeRequired,
      row.createdBy,
      row.createdAt,
    ],
  );
  return { checkpoint: mapRow(result.rows?.[0]), persistence };
}

export async function getLatestKisFeedCheckpoint(options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const env = options.env ?? dependencies.env ?? process.env;
  const persistence = await status(queryFn, env);
  const feedKey = clean(options.feedKey) || KIS_SHADOW_FEED_CHECKPOINT_KEY;

  if (!persistence.schemaReady) {
    const checkpoint = [...memory].reverse().find((row) => row.feedKey === feedKey) || null;
    return { checkpoint, persistence };
  }

  const result = await queryFn(
    `SELECT * FROM trading_kis_shadow_feed_checkpoints
     WHERE feed_key = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [feedKey],
  );
  return { checkpoint: mapRow(result.rows?.[0]), persistence };
}
