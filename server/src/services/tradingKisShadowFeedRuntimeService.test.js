import test from "node:test";
import assert from "node:assert/strict";

import {
  readKisShadowFeedRuntimeStatus,
  resetKisShadowFeedRuntimeForTest,
  startKisShadowFeedRuntime,
  stopKisShadowFeedRuntime,
} from "./tradingKisShadowFeedRuntimeService.js";

function receipt() {
  return {
    approvalId: "approval-1",
    approvedBy: "operator",
    approvedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    scope: "trading_read_only_market_data",
    environment: "virtual_shadow",
    baseUrl: "https://openapi.koreainvestment.com:9443",
    accountIdHash: "not_applicable_market_data_only",
    allowedReadScopes: ["current_quotes", "market_session_state", "provider_rate_limit_state"],
    forbiddenActions: [
      "order_submission",
      "order_cancellation",
      "position_mutation",
      "live_trading_endpoint",
      "raw_provider_response_persistence",
    ],
    evidenceTicket: "ISSUE-441",
    revocationPlan: "disable feature flag",
    redactionVersion: "v1",
  };
}

const env = {
  FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
  KIS_TRADING_APP_KEY: "ephemeral-key",
  KIS_TRADING_APP_SECRET: "ephemeral-secret",
};

const regularSessionMs = Date.parse("2026-08-05T13:35:00Z");

function registry() {
  return {
    versions: [{
      id: "version-1",
      versionNumber: 1,
      status: "approved",
      checksum: "checksum-1",
      strategy: {
        allowedSymbols: ["TQQQ", "SQQQ"],
        requireModelSignal: true,
      },
    }],
  };
}

function shadow(active = true) {
  return {
    active,
    snapshot: active ? {
      runId: "run-1",
      strategyVersionId: "version-1",
      strategyVersionNumber: 1,
    } : null,
  };
}

function noRecovery() {
  return {
    recovery: {
      checkpointAvailable: false,
      manualResumeRequired: false,
      automaticResumeAllowed: false,
    },
    persistence: { mode: "memory_checkpoint" },
  };
}

function createSupervisorHarness(runner) {
  let operational = {
    active: false,
    runner: runner.status(),
    guard: { state: "created", alerts: [] },
    checkpoint: { manualResumeRequired: true, automaticResumeAllowed: false },
  };
  let startInput = null;
  let stoppedReason = null;
  return {
    factory() {
      return {
        async start(input) {
          startInput = input;
          operational = {
            ...operational,
            active: true,
            runner: await runner.start(input),
            guard: { state: "healthy", alerts: [] },
          };
          return operational;
        },
        async stop(reason) {
          stoppedReason = reason;
          operational = {
            ...operational,
            active: false,
            runner: await runner.stop(reason),
            guard: { state: "stopped", alerts: [] },
          };
          return operational;
        },
        status() {
          return operational;
        },
      };
    },
    get startInput() { return startInput; },
    get stoppedReason() { return stoppedReason; },
  };
}

test.beforeEach(() => resetKisShadowFeedRuntimeForTest());

test("status remains blocked until explicit start but shows market-session readiness", async () => {
  const result = await readKisShadowFeedRuntimeStatus(
    { env, receipt: receipt(), nowMs: regularSessionMs },
    {
      readShadowStatus: async () => shadow(true),
      getRegistrySnapshot: async () => registry(),
      readRecoveryState: async () => noRecovery(),
    },
  );
  assert.equal(result.active, false);
  assert.equal(result.preflight.providerCallsAllowed, false);
  assert.equal(result.preflight.startEligible, true);
  assert.deepEqual(result.preflight.blockingReasons, []);
  assert.equal(result.preflight.marketSession.state, "REGULAR");
  assert.equal(result.strategy.tradeSignalGenerationExpected, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
  assert.equal(result.safety.automaticRestartAllowed, false);
});

test("status blocks feed start on an official exchange holiday", async () => {
  const result = await readKisShadowFeedRuntimeStatus(
    { env, receipt: receipt(), nowMs: Date.parse("2026-07-03T15:00:00Z") },
    {
      readShadowStatus: async () => shadow(true),
      getRegistrySnapshot: async () => registry(),
      readRecoveryState: async () => noRecovery(),
    },
  );
  assert.equal(result.preflight.startEligible, false);
  assert.ok(result.preflight.blockingReasons.includes("market_session_not_open_for_feed_start"));
  assert.equal(result.preflight.marketSession.holidayName, "independence_day_observed");
});

test("starts an approved supervised market-data-only runner and never exposes credentials", async () => {
  const fakeRunner = {
    async start() {
      return {
        active: true,
        state: "connected",
        lastProviderEventAt: new Date(regularSessionMs).toISOString(),
        lastCompletedMinute: new Date(regularSessionMs - 60_000).toISOString(),
      };
    },
    async stop() { return { active: false, state: "closed" }; },
    status() { return { active: false, state: "created" }; },
  };
  const harness = createSupervisorHarness(fakeRunner);
  const dependencies = {
    env,
    now: () => regularSessionMs,
    readShadowStatus: async () => shadow(true),
    getRegistrySnapshot: async () => registry(),
    runnerFactory: () => fakeRunner,
    supervisorFactory: harness.factory,
    readRecoveryState: async () => noRecovery(),
  };
  const result = await startKisShadowFeedRuntime(
    { receipt: receipt() },
    { env, nowMs: regularSessionMs, actor: "admin" },
    dependencies,
  );
  assert.equal(result.active, true);
  assert.equal(harness.startInput.appKey, "ephemeral-key");
  assert.equal(harness.startInput.appSecret, "ephemeral-secret");
  assert.doesNotMatch(JSON.stringify(result), /ephemeral-key|ephemeral-secret/);
  assert.equal(result.operations.guard.state, "healthy");
  assert.equal(result.safety.accountCallsAllowed, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
});

test("blocks start when the Shadow run is inactive", async () => {
  await assert.rejects(
    () => startKisShadowFeedRuntime(
      { receipt: receipt() },
      { env, nowMs: regularSessionMs },
      {
        env,
        readShadowStatus: async () => shadow(false),
        getRegistrySnapshot: async () => registry(),
      },
    ),
    (error) => error.code === "ACTIVE_SHADOW_RUN_REQUIRED",
  );
});

test("stops the active supervisor without touching the Shadow worker", async () => {
  const fakeRunner = {
    async start() { return { active: true, state: "connected" }; },
    async stop(reason) { return { active: false, state: "closed", stopReason: reason }; },
    status() { return { active: false, state: "created" }; },
  };
  const harness = createSupervisorHarness(fakeRunner);
  const dependencies = {
    env,
    now: () => regularSessionMs,
    readShadowStatus: async () => shadow(true),
    getRegistrySnapshot: async () => registry(),
    runnerFactory: () => fakeRunner,
    supervisorFactory: harness.factory,
    readRecoveryState: async () => noRecovery(),
  };
  await startKisShadowFeedRuntime(
    { receipt: receipt() },
    { env, nowMs: regularSessionMs },
    dependencies,
  );
  const result = await stopKisShadowFeedRuntime(
    { reason: "operator_stop" },
    { env, nowMs: regularSessionMs },
    dependencies,
  );
  assert.equal(harness.stoppedReason, "operator_stop");
  assert.equal(result.active, false);
  assert.equal(result.runner.state, "closed");
  assert.equal(result.operations.checkpoint.automaticResumeAllowed, false);
});

test("returns restart-safe checkpoint recovery without automatic resume", async () => {
  const result = await readKisShadowFeedRuntimeStatus(
    { env, receipt: receipt(), nowMs: regularSessionMs },
    {
      readShadowStatus: async () => shadow(true),
      getRegistrySnapshot: async () => registry(),
      readRecoveryState: async () => ({
        recovery: {
          checkpointAvailable: true,
          manualResumeRequired: true,
          automaticResumeAllowed: false,
          priorOperationalState: "tripped",
          priorStopReason: "circuit_breaker:provider_heartbeat_stale",
          checkpointAt: "2026-08-05T13:30:00Z",
        },
        persistence: { mode: "postgres_checkpoint" },
      }),
    },
  );
  assert.equal(result.recovery.checkpointAvailable, true);
  assert.equal(result.recovery.automaticResumeAllowed, false);
  assert.equal(result.operations.checkpoint.persistence.mode, "postgres_checkpoint");
});
