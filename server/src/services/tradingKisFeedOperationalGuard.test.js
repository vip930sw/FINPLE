import test from "node:test";
import assert from "node:assert/strict";

import {
  createKisFeedOperationalGuard,
  DEFAULT_KIS_FEED_OPERATIONAL_POLICY,
} from "./tradingKisFeedOperationalGuard.js";

function runningStatus(at, overrides = {}) {
  return {
    active: true,
    state: "connected",
    lastProviderEventAt: new Date(at - 1_000).toISOString(),
    lastCompletedMinute: new Date(at - 60_000).toISOString(),
    protocolIssueCount: 0,
    staleQuoteBarCount: 0,
    incompleteCycleCount: 0,
    ...overrides,
  };
}

test("stays in market-closed standby without stale-feed trips", () => {
  const nowMs = Date.parse("2026-07-03T15:00:00Z");
  const guard = createKisFeedOperationalGuard({}, { now: () => nowMs });
  guard.start({ approvalExpiresAt: "2026-08-01T00:00:00Z", nowMs });
  const snapshot = guard.evaluate({
    active: false,
    state: "closed",
    protocolIssueCount: 0,
    staleQuoteBarCount: 0,
    incompleteCycleCount: 0,
  }, nowMs);
  assert.equal(snapshot.state, "standby_market_closed");
  assert.equal(snapshot.tripped, false);
  assert.equal(snapshot.marketSession.holidayName, "independence_day_observed");
});

test("trips when provider heartbeat exceeds the regular-session threshold", () => {
  const startMs = Date.parse("2026-08-05T13:35:00Z");
  const guard = createKisFeedOperationalGuard({}, { now: () => startMs });
  guard.start({ approvalExpiresAt: "2026-09-01T00:00:00Z", nowMs: startMs });
  const atMs = startMs + DEFAULT_KIS_FEED_OPERATIONAL_POLICY.providerHeartbeatTripMs + 2_000;
  const snapshot = guard.evaluate(runningStatus(atMs, {
    lastProviderEventAt: new Date(startMs).toISOString(),
    lastCompletedMinute: new Date(atMs - 60_000).toISOString(),
  }), atMs);
  assert.equal(snapshot.state, "tripped");
  assert.equal(snapshot.trip.code, "provider_heartbeat_stale");
  assert.equal(snapshot.manualResetRequired, true);
  assert.equal(snapshot.safety.automaticRestartAllowed, false);
});

test("trips after repeated protocol issues inside the configured window", () => {
  const startMs = Date.parse("2026-08-05T13:35:00Z");
  const guard = createKisFeedOperationalGuard({
    policy: { maximumProtocolIssuesPerWindow: 3 },
  }, { now: () => startMs });
  guard.start({ approvalExpiresAt: "2026-09-01T00:00:00Z", nowMs: startMs });
  const snapshot = guard.evaluate(runningStatus(startMs + 2_000, {
    protocolIssueCount: 3,
  }), startMs + 2_000);
  assert.equal(snapshot.state, "tripped");
  assert.equal(snapshot.trip.code, "protocol_issue_rate_exceeded");
});

test("classifies recent isolated quality issues as degraded rather than tripped", () => {
  const startMs = Date.parse("2026-08-05T13:35:00Z");
  const guard = createKisFeedOperationalGuard({}, { now: () => startMs });
  guard.start({ approvalExpiresAt: "2026-09-01T00:00:00Z", nowMs: startMs });
  const snapshot = guard.evaluate(runningStatus(startMs + 2_000, {
    incompleteCycleCount: 1,
  }), startMs + 2_000);
  assert.equal(snapshot.state, "degraded");
  assert.equal(snapshot.tripped, false);
  assert.equal(snapshot.windows.incompleteCycles, 1);
});

test("trips immediately when the read-only approval expires", () => {
  const startMs = Date.parse("2026-08-05T13:35:00Z");
  const guard = createKisFeedOperationalGuard({}, { now: () => startMs });
  guard.start({ approvalExpiresAt: new Date(startMs + 1_000).toISOString(), nowMs: startMs });
  const snapshot = guard.evaluate(runningStatus(startMs + 2_000), startMs + 2_000);
  assert.equal(snapshot.state, "tripped");
  assert.equal(snapshot.trip.code, "read_only_approval_expired");
});

test("fails closed when the exchange calendar year is unsupported", () => {
  const startMs = Date.parse("2029-01-03T15:00:00Z");
  const guard = createKisFeedOperationalGuard({}, { now: () => startMs });
  guard.start({ approvalExpiresAt: "2029-02-01T00:00:00Z", nowMs: startMs });
  const snapshot = guard.evaluate(runningStatus(startMs), startMs);
  assert.equal(snapshot.state, "tripped");
  assert.equal(snapshot.trip.code, "calendar_unsupported");
});
