import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAiAnalysisUsageAllowed,
  getAiAnalysisUsagePolicy,
  reserveAiAnalysisUsage,
  resetAiAnalysisUsageBuckets,
} from "./aiAnalysisUsageControl.js";

function mockRequest(ip = "203.0.113.10") {
  return {
    ip,
    get(header) {
      if (header.toLowerCase() === "x-forwarded-for") return ip;
      return "";
    },
  };
}

test("assertAiAnalysisUsageAllowed limits public callers by request IP", () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  const previousWindow = process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
  const previousDisabled = process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;

  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "2";
  process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = "1000";
  delete process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;
  resetAiAnalysisUsageBuckets();

  try {
    const request = mockRequest();
    assert.equal(assertAiAnalysisUsageAllowed({ request, now: 1000 }).remaining, 1);
    assert.equal(assertAiAnalysisUsageAllowed({ request, now: 1001 }).remaining, 0);
    assert.throws(
      () => assertAiAnalysisUsageAllowed({ request, now: 1002 }),
      (error) => error.statusCode === 429 && error.details?.some((detail) => detail.includes("limit=2"))
    );
    assert.equal(assertAiAnalysisUsageAllowed({ request, now: 2101 }).remaining, 1);
  } finally {
    resetAiAnalysisUsageBuckets();
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
    if (previousWindow === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = previousWindow;
    if (previousDisabled === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED = previousDisabled;
  }
});

test("assertAiAnalysisUsageAllowed gives Personal users their own bucket", () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW;
  process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW = "1";
  resetAiAnalysisUsageBuckets();

  try {
    const request = mockRequest();
    assert.equal(
      assertAiAnalysisUsageAllowed({
        request,
        user: { id: "user-a", plan: "personal" },
        now: 1000,
      }).remaining,
      0
    );
    assert.equal(
      assertAiAnalysisUsageAllowed({
        request,
        user: { id: "user-b", plan: "personal" },
        now: 1001,
      }).remaining,
      0
    );
  } finally {
    resetAiAnalysisUsageBuckets();
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW = previousLimit;
  }
});

test("reserveAiAnalysisUsage releases the slot when provider work fails", () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "1";
  resetAiAnalysisUsageBuckets();

  try {
    const request = mockRequest();
    const reservation = reserveAiAnalysisUsage({ request, now: 1000 });

    assert.equal(reservation.remaining, 0);
    assert.equal(reservation.reserved, true);
    assert.equal(reservation.committed, false);

    reservation.cancel();

    assert.equal(reservation.canceled, true);
    assert.equal(reservation.remaining, 1);
    assert.equal(reserveAiAnalysisUsage({ request, now: 1001 }).remaining, 0);
  } finally {
    resetAiAnalysisUsageBuckets();
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
  }
});

test("reserveAiAnalysisUsage keeps the slot after commit", () => {
  const previousLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "1";
  resetAiAnalysisUsageBuckets();

  try {
    const request = mockRequest();
    const reservation = reserveAiAnalysisUsage({ request, now: 1000 });

    reservation.commit();
    reservation.cancel();

    assert.equal(reservation.committed, true);
    assert.equal(reservation.canceled, false);
    assert.throws(
      () => reserveAiAnalysisUsage({ request, now: 1001 }),
      (error) => error.statusCode === 429 && error.usage?.remaining === 0
    );
  } finally {
    resetAiAnalysisUsageBuckets();
    if (previousLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousLimit;
  }
});

test("getAiAnalysisUsagePolicy exposes safe operational limits", () => {
  const previousPublicLimit = process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
  const previousPersonalLimit = process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW;
  const previousWindow = process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
  const previousDisabled = process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;

  process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = "3";
  process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW = "9";
  process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = "60000";
  delete process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;
  resetAiAnalysisUsageBuckets();

  try {
    const guestPolicy = getAiAnalysisUsagePolicy();
    const personalPolicy = getAiAnalysisUsagePolicy({ id: "user-a", plan: "personal" });

    assert.equal(guestPolicy.limited, true);
    assert.equal(guestPolicy.windowMs, 60000);
    assert.equal(guestPolicy.publicLimit, 3);
    assert.equal(guestPolicy.personalLimit, 9);
    assert.equal(guestPolicy.effectiveLimit, 3);
    assert.equal(personalPolicy.effectiveLimit, 9);
  } finally {
    resetAiAnalysisUsageBuckets();
    if (previousPublicLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW = previousPublicLimit;
    if (previousPersonalLimit === undefined) delete process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW;
    else process.env.FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW = previousPersonalLimit;
    if (previousWindow === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS = previousWindow;
    if (previousDisabled === undefined) delete process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED;
    else process.env.FINPLE_AI_ANALYSIS_LIMIT_DISABLED = previousDisabled;
  }
});
