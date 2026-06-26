import assert from "node:assert/strict";
import test from "node:test";

import {
  getAiAnalysisUsageAdminSummary,
  getAiAnalysisUsageSnapshot,
  getAiAnalysisUsagePersistenceStatus,
  reservePersistentAiAnalysisUsage,
} from "./aiAnalysisUsageRepository.js";

function mockRequest(ip = "203.0.113.10") {
  return {
    ip,
    get(header) {
      if (header.toLowerCase() === "x-forwarded-for") return ip;
      if (header.toLowerCase() === "user-agent") return "node-test";
      return "";
    },
  };
}

test("reservePersistentAiAnalysisUsage records reservation and commit through query adapter", async () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  const previousWindow = process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "2";
  process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = "1000";

  const calls = [];
  const queryFn = async (text, params) => {
    calls.push({ text, params });
    if (text.includes("COUNT(*)")) {
      return { rows: [{ count: 0, oldest_reserved_at: null }] };
    }
    return { rows: [] };
  };

  try {
    const reservation = await reservePersistentAiAnalysisUsage({
      request: mockRequest(),
      payload: { assets: [{ ticker: "QQQ" }] },
      now: 1000,
      queryFn,
    });

    assert.equal(reservation.storage, "postgres");
    assert.equal(reservation.remaining, 1);
    await reservation.commit();

    assert.ok(calls.some((call) => /CREATE TABLE IF NOT EXISTS ai_analysis_usage_events/.test(call.text)));
    assert.ok(calls.some((call) => /INSERT INTO ai_analysis_usage_events/.test(call.text)));
    assert.ok(calls.some((call) => /status = 'succeeded'/.test(call.text)));
  } finally {
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
    if (previousWindow === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = previousWindow;
  }
});

test("reservePersistentAiAnalysisUsage blocks when the rolling DB window is exhausted", async () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  const previousWindow = process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "1";
  process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = "1000";

  const queryFn = async () => ({
    rows: [{ count: 1, oldest_reserved_at: new Date(500) }],
  });

  try {
    await assert.rejects(
      () =>
        reservePersistentAiAnalysisUsage({
          request: mockRequest(),
          now: 1000,
          queryFn,
        }),
      (error) =>
        error.statusCode === 429 &&
        error.usage?.storage === "postgres" &&
        error.details?.includes("storage=postgres")
    );
  } finally {
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
    if (previousWindow === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = previousWindow;
  }
});

test("getAiAnalysisUsagePersistenceStatus reports pending migration when table is missing", async () => {
  const status = await getAiAnalysisUsagePersistenceStatus({
    queryFn: async () => {
      throw new Error("relation does not exist");
    },
  });

  assert.deepEqual(status, {
    preferred: "postgres",
    fallback: "memory",
    configured: true,
    available: false,
    table: "ai_analysis_usage_events",
    reason: "migration_pending",
  });
});

test("getAiAnalysisUsagePersistenceStatus reports available when schema can be ensured", async () => {
  const calls = [];
  const status = await getAiAnalysisUsagePersistenceStatus({
    queryFn: async (text) => {
      calls.push(text);
      return { rows: [{ "?column?": 1 }] };
    },
  });

  assert.equal(status.available, true);
  assert.equal(status.configured, true);
  assert.equal(status.table, "ai_analysis_usage_events");
  assert.ok(calls.some((text) => /CREATE TABLE IF NOT EXISTS ai_analysis_usage_events/.test(text)));
});

test("getAiAnalysisUsageSnapshot returns rolling usage for the actor", async () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  const previousWindow = process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "5";
  process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = "1000";

  const queryFn = async (text) => {
    if (text.includes("COUNT(*)")) {
      return { rows: [{ count: 2, oldest_reserved_at: new Date(700) }] };
    }
    return { rows: [] };
  };

  try {
    const snapshot = await getAiAnalysisUsageSnapshot({
      request: mockRequest(),
      now: 1000,
      queryFn,
    });

    assert.equal(snapshot.storage, "postgres");
    assert.equal(snapshot.limit, 5);
    assert.equal(snapshot.used, 2);
    assert.equal(snapshot.remaining, 3);
    assert.equal(snapshot.resetAt, 1700);
  } finally {
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
    if (previousWindow === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = previousWindow;
  }
});

test("getAiAnalysisUsageAdminSummary maps operational usage aggregates", async () => {
  const queryFn = async (text) => {
    if (text.includes("total_24h")) {
      return { rows: [{ total_24h: 3, total_7d: 8 }] };
    }
    if (text.includes("GROUP BY status")) {
      return { rows: [{ status: "succeeded", count: 2 }, { status: "failed", count: 1 }] };
    }
    if (text.includes("GROUP BY plan")) {
      return { rows: [{ plan: "personal", count: 2 }, { plan: "guest", count: 1 }] };
    }
    if (text.includes("ORDER BY reserved_at DESC")) {
      return {
        rows: [
          {
            id: "event-a",
            user_id: "user-a",
            actor_type: "user",
            plan: "personal",
            mode: "live",
            provider: "openai",
            status: "succeeded",
            reserved_at: "2026-06-26T00:00:00.000Z",
            completed_at: "2026-06-26T00:00:02.000Z",
            request_ip: "203.0.113.10",
          },
        ],
      };
    }
    return { rows: [] };
  };

  const summary = await getAiAnalysisUsageAdminSummary({ queryFn });

  assert.equal(summary.available, true);
  assert.equal(summary.total24h, 3);
  assert.deepEqual(summary.statusBreakdown24h[0], { status: "succeeded", count: 2 });
  assert.deepEqual(summary.planBreakdown24h[0], { plan: "personal", count: 2 });
  assert.equal(summary.recentEvents[0].id, "event-a");
});
