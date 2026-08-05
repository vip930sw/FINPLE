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

test.beforeEach(() => resetKisShadowFeedRuntimeForTest());

test("status remains blocked until explicit start but shows configuration readiness", async () => {
  const result = await readKisShadowFeedRuntimeStatus(
    { env, receipt: receipt(), nowMs: Date.parse("2026-08-05T00:00:00Z") },
    {
      readShadowStatus: async () => shadow(true),
      getRegistrySnapshot: async () => registry(),
    },
  );
  assert.equal(result.active, false);
  assert.equal(result.preflight.providerCallsAllowed, false);
  assert.equal(result.preflight.startEligible, true);
  assert.deepEqual(result.preflight.blockingReasons, []);
  assert.equal(result.strategy.tradeSignalGenerationExpected, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
});

test("starts an approved market-data-only runner and never exposes credentials", async () => {
  let startInput = null;
  const fakeRunner = {
    async start(input) {
      startInput = input;
      return { active: true, state: "connected", safety: { orderSubmissionAllowed: false } };
    },
    async stop() {
      return { active: false, state: "closed" };
    },
    status() {
      return { active: true, state: "connected", completedCycleCount: 0 };
    },
  };
  const dependencies = {
    env,
    readShadowStatus: async () => shadow(true),
    getRegistrySnapshot: async () => registry(),
    runnerFactory: () => fakeRunner,
  };
  const result = await startKisShadowFeedRuntime(
    { receipt: receipt() },
    { env, nowMs: Date.parse("2026-08-05T00:00:00Z"), actor: "admin" },
    dependencies,
  );
  assert.equal(result.active, true);
  assert.equal(startInput.appKey, "ephemeral-key");
  assert.equal(startInput.appSecret, "ephemeral-secret");
  assert.doesNotMatch(JSON.stringify(result), /ephemeral-key|ephemeral-secret/);
  assert.equal(result.safety.accountCallsAllowed, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
});

test("blocks start when the Shadow run is inactive", async () => {
  await assert.rejects(
    () => startKisShadowFeedRuntime(
      { receipt: receipt() },
      { env, nowMs: Date.parse("2026-08-05T00:00:00Z") },
      {
        env,
        readShadowStatus: async () => shadow(false),
        getRegistrySnapshot: async () => registry(),
      },
    ),
    (error) => error.code === "ACTIVE_SHADOW_RUN_REQUIRED",
  );
});

test("stops the active feed without touching the Shadow worker", async () => {
  let stoppedReason = null;
  const fakeRunner = {
    async start() { return { active: true, state: "connected" }; },
    async stop(reason) { stoppedReason = reason; return { active: false, state: "closed" }; },
    status() { return { active: true, state: "connected" }; },
  };
  const dependencies = {
    env,
    readShadowStatus: async () => shadow(true),
    getRegistrySnapshot: async () => registry(),
    runnerFactory: () => fakeRunner,
  };
  await startKisShadowFeedRuntime(
    { receipt: receipt() },
    { env, nowMs: Date.parse("2026-08-05T00:00:00Z") },
    dependencies,
  );
  const result = await stopKisShadowFeedRuntime(
    { reason: "operator_stop" },
    { env, nowMs: Date.parse("2026-08-05T00:00:00Z") },
    dependencies,
  );
  assert.equal(stoppedReason, "operator_stop");
  assert.equal(result.active, false);
  assert.equal(result.runner.state, "closed");
});
