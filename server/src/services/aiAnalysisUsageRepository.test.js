import assert from "node:assert/strict";
import test from "node:test";

import {
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

    assert.equal(calls.length, 3);
    assert.match(calls[1].text, /INSERT INTO ai_analysis_usage_events/);
    assert.match(calls[2].text, /status = 'succeeded'/);
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
