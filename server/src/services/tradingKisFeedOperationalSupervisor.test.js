import test from "node:test";
import assert from "node:assert/strict";

import {
  buildKisFeedRecoveryState,
  createKisFeedOperationalSupervisor,
} from "./tradingKisFeedOperationalSupervisor.js";

function createRunner(nowRef) {
  let state = {
    active: false,
    state: "created",
    lastProviderEventAt: null,
    lastCompletedMinute: null,
    protocolIssueCount: 0,
    staleQuoteBarCount: 0,
    incompleteCycleCount: 0,
  };
  return {
    async start() {
      state = {
        ...state,
        active: true,
        state: "connected",
        lastProviderEventAt: new Date(nowRef.value).toISOString(),
        lastCompletedMinute: new Date(nowRef.value - 60_000).toISOString(),
      };
      return { ...state };
    },
    async stop(reason) {
      state = { ...state, active: false, state: "closed", stopReason: reason };
      return { ...state };
    },
    status() {
      return { ...state };
    },
    set(next) {
      state = { ...state, ...next };
    },
  };
}

function options(runner) {
  return {
    runner,
    shadowRunId: "run-1",
    strategyVersionId: "version-1",
    strategyVersionNumber: 1,
    selectedSymbols: ["TQQQ", "SQQQ"],
    approval: {
      receipt: {
        approvalId: "approval-1",
        expiresAt: "2026-09-01T00:00:00Z",
        scope: "trading_read_only_market_data",
        environment: "virtual_shadow",
      },
    },
    watchdogIntervalMs: 1_000,
    checkpointIntervalMs: 1_000,
    guardPolicy: {
      providerHeartbeatTripMs: 5_000,
      providerHeartbeatWarningMs: 2_000,
    },
  };
}

test("starts only during an approved market session and persists a sanitized checkpoint", async () => {
  const nowRef = { value: Date.parse("2026-08-05T13:35:00Z") };
  const runner = createRunner(nowRef);
  const checkpoints = [];
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => {
      checkpoints.push(payload);
      return { checkpoint: payload, persistence: { mode: "memory_checkpoint" } };
    },
  });

  const status = await supervisor.start({ appKey: "ephemeral", appSecret: "ephemeral-secret" });
  assert.equal(status.active, true);
  assert.equal(status.guard.state, "healthy");
  assert.equal(checkpoints.length, 1);
  assert.equal(checkpoints[0].manualResumeRequired, true);
  assert.doesNotMatch(JSON.stringify(checkpoints[0]), /ephemeral-secret/);
});

test("circuit breaker stops the runner and requires manual resume", async () => {
  const nowRef = { value: Date.parse("2026-08-05T13:35:00Z") };
  const runner = createRunner(nowRef);
  const checkpoints = [];
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => {
      checkpoints.push(payload);
      return { checkpoint: payload, persistence: { mode: "memory_checkpoint" } };
    },
  });
  await supervisor.start({ appKey: "key", appSecret: "secret" });

  nowRef.value += 8_000;
  const status = await supervisor.tick();
  assert.equal(status.active, false);
  assert.equal(status.guard.tripped, true);
  assert.equal(status.guard.trip.code, "provider_heartbeat_stale");
  assert.match(status.stoppedReason, /^circuit_breaker:/);
  assert.equal(status.checkpoint.automaticResumeAllowed, false);
  assert.ok(checkpoints.length >= 2);
});

test("blocks start on an exchange holiday", async () => {
  const nowRef = { value: Date.parse("2026-07-03T15:00:00Z") };
  const runner = createRunner(nowRef);
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => ({ checkpoint: payload, persistence: { mode: "memory_checkpoint" } }),
  });

  await assert.rejects(
    supervisor.start({ appKey: "key", appSecret: "secret" }),
    (error) => error.code === "KIS_FEED_MARKET_SESSION_CLOSED" && error.details.includes("exchange_holiday"),
  );
});

test("recovery state never enables automatic restart", () => {
  const recovery = buildKisFeedRecoveryState({
    operationalState: "tripped",
    stopReason: "circuit_breaker:provider_heartbeat_stale",
    createdAt: "2026-08-05T14:00:00Z",
    shadowRunId: "run-1",
    strategyVersionId: "version-1",
    selectedSymbols: ["TQQQ"],
    manualResumeRequired: true,
  });
  assert.equal(recovery.checkpointAvailable, true);
  assert.equal(recovery.manualResumeRequired, true);
  assert.equal(recovery.automaticResumeAllowed, false);
  assert.equal(recovery.priorOperationalState, "tripped");
});
