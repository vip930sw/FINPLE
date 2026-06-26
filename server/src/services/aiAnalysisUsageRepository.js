import { randomUUID } from "node:crypto";

import { isDatabaseConfigured, query as defaultQuery } from "../db/database.js";
import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import {
  getAiAnalysisUsageActor,
  getAiAnalysisUsageLimitForUser,
  getAiAnalysisUsageWindowMs,
  isAiAnalysisUsageLimitDisabled,
} from "./aiAnalysisUsageControl.js";

let schemaEnsured = false;

function toIsoDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function getRequestHeader(request, name) {
  return request?.get?.(name) || "";
}

export function buildAiAnalysisUsageMetadata({ payload, mode, provider } = {}) {
  return {
    assetCount: Array.isArray(payload?.assets) ? payload.assets.length : 0,
    portfolioId: payload?.portfolio?.id || payload?.portfolioId || null,
    mode: mode || null,
    provider: provider || null,
  };
}

export async function ensureAiAnalysisUsageSchema(runQuery = defaultQuery) {
  if (runQuery === defaultQuery && schemaEnsured) return;

  await runQuery(`
    CREATE TABLE IF NOT EXISTS ai_analysis_usage_events (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_key TEXT NOT NULL,
      actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'ip')),
      plan TEXT NOT NULL DEFAULT 'guest',
      mode TEXT,
      provider TEXT,
      portfolio_id TEXT,
      input_hash TEXT,
      status TEXT NOT NULL CHECK (status IN ('reserved', 'succeeded', 'failed', 'canceled')),
      reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      window_started_at TIMESTAMPTZ NOT NULL,
      window_ends_at TIMESTAMPTZ NOT NULL,
      request_ip TEXT,
      user_agent TEXT,
      error_code TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_actor_window
      ON ai_analysis_usage_events(actor_key, reserved_at DESC, status)
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_user_reserved
      ON ai_analysis_usage_events(user_id, reserved_at DESC)
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_status_reserved
      ON ai_analysis_usage_events(status, reserved_at DESC)
  `);

  if (runQuery === defaultQuery) schemaEnsured = true;
}

export async function getAiAnalysisUsagePersistenceStatus({ queryFn = defaultQuery } = {}) {
  if (queryFn === defaultQuery && !isDatabaseConfigured()) {
    return {
      preferred: "postgres",
      fallback: "memory",
      configured: false,
      available: false,
      table: "ai_analysis_usage_events",
    };
  }

  try {
    await ensureAiAnalysisUsageSchema(queryFn);
    await queryFn("SELECT 1 FROM ai_analysis_usage_events LIMIT 1");
    return {
      preferred: "postgres",
      fallback: "memory",
      configured: true,
      available: true,
      table: "ai_analysis_usage_events",
    };
  } catch (error) {
    return {
      preferred: "postgres",
      fallback: "memory",
      configured: queryFn !== defaultQuery || isDatabaseConfigured(),
      available: false,
      table: "ai_analysis_usage_events",
      reason: "migration_pending",
    };
  }
}

export async function getAiAnalysisUsageSnapshot({
  request,
  user,
  now = Date.now(),
  queryFn = defaultQuery,
} = {}) {
  if (isAiAnalysisUsageLimitDisabled()) {
    return {
      limited: false,
      limit: null,
      used: 0,
      remaining: null,
      resetAt: null,
      storage: "disabled",
    };
  }
  if (queryFn === defaultQuery && !isDatabaseConfigured()) return null;

  const limit = getAiAnalysisUsageLimitForUser(user);
  const windowMs = getAiAnalysisUsageWindowMs();
  const actor = getAiAnalysisUsageActor({ request, user });
  const checkedAt = toIsoDate(now);
  const windowStartedAt = new Date(checkedAt.getTime() - windowMs);

  await ensureAiAnalysisUsageSchema(queryFn);

  const result = await queryFn(
    `SELECT COUNT(*)::int AS count, MIN(reserved_at) AS oldest_reserved_at
     FROM ai_analysis_usage_events
     WHERE actor_key = $1
       AND reserved_at >= $2
       AND status IN ('reserved', 'succeeded')`,
    [actor.key, windowStartedAt]
  );
  const used = Number(result.rows?.[0]?.count || 0);
  const oldestReservedAt = result.rows?.[0]?.oldest_reserved_at
    ? new Date(result.rows[0].oldest_reserved_at).getTime()
    : checkedAt.getTime();

  return {
    limited: true,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    resetAt: oldestReservedAt + windowMs,
    storage: "postgres",
  };
}

export async function getAiAnalysisUsageAdminSummary({ queryFn = defaultQuery } = {}) {
  if (queryFn === defaultQuery && !isDatabaseConfigured()) {
    return {
      configured: false,
      available: false,
      total24h: 0,
      total7d: 0,
      statusBreakdown24h: [],
      planBreakdown24h: [],
      recentEvents: [],
    };
  }

  await ensureAiAnalysisUsageSchema(queryFn);

  const [totalsResult, statusResult, planResult, recentResult] = await Promise.all([
    queryFn(
      `SELECT
         COUNT(*) FILTER (WHERE reserved_at >= NOW() - INTERVAL '24 hours')::int AS total_24h,
         COUNT(*) FILTER (WHERE reserved_at >= NOW() - INTERVAL '7 days')::int AS total_7d
       FROM ai_analysis_usage_events`
    ),
    queryFn(
      `SELECT status, COUNT(*)::int AS count
       FROM ai_analysis_usage_events
       WHERE reserved_at >= NOW() - INTERVAL '24 hours'
       GROUP BY status
       ORDER BY count DESC, status ASC`
    ),
    queryFn(
      `SELECT plan, COUNT(*)::int AS count
       FROM ai_analysis_usage_events
       WHERE reserved_at >= NOW() - INTERVAL '24 hours'
       GROUP BY plan
       ORDER BY count DESC, plan ASC`
    ),
    queryFn(
      `SELECT id, user_id, actor_type, plan, mode, provider, status, reserved_at, completed_at, request_ip
       FROM ai_analysis_usage_events
       ORDER BY reserved_at DESC
       LIMIT 25`
    ),
  ]);

  const totals = totalsResult.rows?.[0] || {};

  return {
    configured: true,
    available: true,
    total24h: Number(totals.total_24h || 0),
    total7d: Number(totals.total_7d || 0),
    statusBreakdown24h: (statusResult.rows || []).map((row) => ({
      status: row.status,
      count: Number(row.count || 0),
    })),
    planBreakdown24h: (planResult.rows || []).map((row) => ({
      plan: row.plan || "guest",
      count: Number(row.count || 0),
    })),
    recentEvents: (recentResult.rows || []).map((row) => ({
      id: row.id,
      userId: row.user_id || null,
      actorType: row.actor_type,
      plan: row.plan || "guest",
      mode: row.mode || null,
      provider: row.provider || null,
      status: row.status,
      reservedAt: row.reserved_at,
      completedAt: row.completed_at || null,
      requestIp: row.request_ip || null,
    })),
  };
}

export async function reservePersistentAiAnalysisUsage({
  request,
  user,
  payload,
  mode,
  provider,
  now = Date.now(),
  queryFn = defaultQuery,
} = {}) {
  if (isAiAnalysisUsageLimitDisabled()) return null;
  if (queryFn === defaultQuery && !isDatabaseConfigured()) return null;

  const limit = getAiAnalysisUsageLimitForUser(user);
  const windowMs = getAiAnalysisUsageWindowMs();
  const actor = getAiAnalysisUsageActor({ request, user });
  const reservedAt = toIsoDate(now);
  const windowStartedAt = new Date(reservedAt.getTime() - windowMs);
  const windowEndsAt = new Date(reservedAt.getTime() + windowMs);

  await ensureAiAnalysisUsageSchema(queryFn);

  const usageResult = await queryFn(
    `SELECT COUNT(*)::int AS count, MIN(reserved_at) AS oldest_reserved_at
     FROM ai_analysis_usage_events
     WHERE actor_key = $1
       AND reserved_at >= $2
       AND status IN ('reserved', 'succeeded')`,
    [actor.key, windowStartedAt]
  );
  const count = Number(usageResult.rows?.[0]?.count || 0);
  const oldestReservedAt = usageResult.rows?.[0]?.oldest_reserved_at
    ? new Date(usageResult.rows[0].oldest_reserved_at).getTime()
    : reservedAt.getTime();

  if (count >= limit) {
    const resetAt = oldestReservedAt + windowMs;
    const error = createHttpError(429, "AI analysis usage limit reached.", [
      `limit=${limit}`,
      `resetAt=${new Date(resetAt).toISOString()}`,
      "storage=postgres",
    ]);
    error.usage = { limit, remaining: 0, resetAt, key: actor.key, storage: "postgres" };
    throw error;
  }

  const id = randomUUID();
  const metadata = buildAiAnalysisUsageMetadata({ payload, mode, provider });

  await queryFn(
    `INSERT INTO ai_analysis_usage_events (
       id, user_id, actor_key, actor_type, plan, mode, provider, portfolio_id,
       input_hash, status, reserved_at, window_started_at, window_ends_at,
       request_ip, user_agent, metadata
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, 'reserved', $10, $11, $12,
       $13, $14, $15::jsonb
     )`,
    [
      id,
      actor.userId,
      actor.key,
      actor.type,
      String(user?.plan || "guest").trim().toLowerCase() || "guest",
      mode || null,
      provider || null,
      metadata.portfolioId,
      null,
      reservedAt,
      windowStartedAt,
      windowEndsAt,
      actor.requestIp,
      getRequestHeader(request, "user-agent") || null,
      JSON.stringify(metadata),
    ]
  );

  let committed = false;
  let canceled = false;
  let persistenceError = null;

  return {
    limited: true,
    limit,
    remaining: Math.max(limit - count - 1, 0),
    resetAt: oldestReservedAt + windowMs,
    key: actor.key,
    storage: "postgres",
    reserved: true,
    get committed() {
      return committed;
    },
    get canceled() {
      return canceled;
    },
    get persistenceError() {
      return persistenceError;
    },
    async commit() {
      if (canceled || committed) return this;
      try {
        await queryFn(
          `UPDATE ai_analysis_usage_events
           SET status = 'succeeded', completed_at = NOW()
           WHERE id = $1`,
          [id]
        );
      } catch (error) {
        persistenceError = error;
      }
      committed = true;
      return this;
    },
    async cancel(error = null) {
      if (committed || canceled) return this;
      try {
        await queryFn(
          `UPDATE ai_analysis_usage_events
           SET status = $2, completed_at = NOW(), error_code = $3
           WHERE id = $1`,
          [id, error ? "failed" : "canceled", error?.code || error?.statusCode || null]
        );
      } catch (cancelError) {
        persistenceError = cancelError;
      }
      canceled = true;
      return this;
    },
  };
}
