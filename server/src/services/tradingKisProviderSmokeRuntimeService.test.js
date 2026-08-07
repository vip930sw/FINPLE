import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";

import { requireAdminStartAccess } from "../middleware/adminGuard.js";
import { readKisConnectionLease } from "./tradingKisConnectionLease.js";
import { KIS_READ_ONLY_BASE_URLS } from "./tradingKisReadOnlyApproval.js";
import {
  KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS,
  readKisProviderSmokeRuntimeStatus,
  resetKisProviderSmokeRuntimeForTest,
  startKisProviderSmokeRuntime,
  stopKisProviderSmokeRuntime,
} from "./tradingKisProviderSmokeRuntimeService.js";

const nowMs = Date.parse("2026-08-05T00:00:00Z");
const secretSentinels = ["SENSITIVE_APP_KEY", "SENSITIVE_APP_SECRET", "SENSITIVE_APPROVAL_ID"];

function adminStartAuthorization() {
  const previous = process.env.FINPLE_ADMIN_TOKEN;
  process.env.FINPLE_ADMIN_TOKEN = "test-admin-token";
  let authorization;
  try {
    requireAdminStartAccess(
      { get: (name) => name === "x-finple-admin-token" ? "test-admin-token" : "" },
      { status() { return this; }, json(payload) { assert.fail(payload.code); } },
      (value) => { authorization = value; },
    );
  } finally {
    if (previous === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previous;
  }
  return authorization;
}

function liveEnv(overrides = {}) {
  return {
    FINPLE_TRADING_KIS_PROVIDER_SMOKE_ENABLED: "true",
    FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "false",
    FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "false",
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
    FINPLE_TRADING_ALLOWED_SYMBOLS: "TQQQ",
    KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    KIS_TRADING_APP_KEY: secretSentinels[0],
    KIS_TRADING_APP_SECRET: secretSentinels[1],
    FINPLE_TRADING_READ_ONLY_APPROVAL_ID: secretSentinels[2],
    FINPLE_TRADING_READ_ONLY_APPROVED_BY: "SENSITIVE_APPROVER",
    FINPLE_TRADING_READ_ONLY_APPROVED_AT: "2026-08-01T00:00:00Z",
    FINPLE_TRADING_READ_ONLY_EXPIRES_AT: "2026-09-01T00:00:00Z",
    FINPLE_TRADING_READ_ONLY_SCOPE: "trading_read_only_market_data",
    FINPLE_TRADING_READ_ONLY_ENVIRONMENT: "production_live",
    FINPLE_TRADING_READ_ONLY_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    FINPLE_TRADING_READ_ONLY_ACCOUNT_ID_HASH: "SENSITIVE_ACCOUNT_HASH",
    FINPLE_TRADING_READ_ONLY_ALLOWED_SCOPES: "current_quotes,market_session_state,provider_rate_limit_state",
    FINPLE_TRADING_READ_ONLY_FORBIDDEN_ACTIONS: "order_submission,order_cancellation,position_mutation,live_trading_endpoint,raw_provider_response_persistence",
    FINPLE_TRADING_READ_ONLY_EVIDENCE_TICKET: "SENSITIVE_EVIDENCE",
    FINPLE_TRADING_READ_ONLY_REVOCATION_PLAN: "SENSITIVE_REVOCATION",
    FINPLE_TRADING_READ_ONLY_REDACTION_VERSION: "v1",
    ...overrides,
  };
}

function makeTradePayload() {
  return [
    "TQQQ", "4", "20260805", "20260804", "103001", "20260805", "233001", "80", "82", "79",
    "81.25", "2", "1.2", "1.5", "81.24", "81.26", "100", "120", "15", "1000015",
    "81000000", "500", "600", "112.5", "1",
  ].join("^");
}

function providerHarness({ emitMessage = true } = {}) {
  let socket;
  let closeCount = 0;
  const handlers = {};
  return {
    dependencies: {
      env: liveEnv(),
      now: () => nowMs,
      fetchImpl: async () => ({ ok: true, json: async () => ({ approval_key: "SENSITIVE_EPHEMERAL_KEY" }) }),
      webSocketFactory: () => {
        socket = {
          readyState: 1,
          on(name, handler) { handlers[name] = handler; },
          send() {},
          close() { closeCount += 1; handlers.close?.(); },
        };
        queueMicrotask(() => {
          handlers.open?.();
          handlers.message?.({ data: JSON.stringify({ body: { rt_cd: "0" }, header: { tr_id: "HDFSCNT0" } }) });
          if (emitMessage) handlers.message?.({ data: `0|HDFSCNT0|1|${makeTradePayload()}` });
        });
        return socket;
      },
    },
    closeCount: () => closeCount,
  };
}

test.beforeEach(() => resetKisProviderSmokeRuntimeForTest());
test.afterEach(() => resetKisProviderSmokeRuntimeForTest());

test("feature defaults disabled and consumes the genuine proof without provider I/O", async () => {
  let fetchCalls = 0;
  const authorization = adminStartAuthorization();
  await assert.rejects(
    startKisProviderSmokeRuntime(
      { adminStartAuthorization: authorization, nowMs },
      { env: liveEnv({ FINPLE_TRADING_KIS_PROVIDER_SMOKE_ENABLED: "" }), fetchImpl: async () => { fetchCalls += 1; } },
    ),
    (error) => error.code === "KIS_PROVIDER_SMOKE_FEATURE_DISABLED",
  );
  assert.equal(fetchCalls, 0);
  await assert.rejects(
    startKisProviderSmokeRuntime(
      { adminStartAuthorization: authorization, nowMs },
      { env: liveEnv(), fetchImpl: async () => { fetchCalls += 1; } },
    ),
    (error) => error.code === "KIS_ADMIN_START_AUTHORIZATION_REQUIRED",
  );
  assert.equal(readKisProviderSmokeRuntimeStatus().state, "IDLE");
});

test("successful smoke uses one symbol, one approval request and one socket then closes redacted", async () => {
  const harness = providerHarness();
  await startKisProviderSmokeRuntime(
    { adminStartAuthorization: adminStartAuthorization(), nowMs },
    harness.dependencies,
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  const result = readKisProviderSmokeRuntimeStatus({ env: harness.dependencies.env });
  assert.equal(result.state, "STOPPED");
  assert.deepEqual(result.lifecycle, ["AUTHORIZED", "CONNECTING", "SUBSCRIBED", "MESSAGE_VALIDATED", "STOPPED"]);
  assert.equal(result.active, false);
  assert.equal(result.selectedSymbolCount, 1);
  assert.equal(result.approvalKeyRequestCount, 1);
  assert.equal(result.approvalKeyRequestSucceeded, true);
  assert.equal(result.websocketConnectionCount, 1);
  assert.equal(result.websocketConnected, true);
  assert.equal(result.subscriptionAccepted, true);
  assert.equal(result.messageCount, 1);
  assert.equal(result.schemaAccepted, true);
  assert.equal(result.cleanShutdown, true);
  assert.equal(harness.closeCount(), 1);
  assert.equal(readKisConnectionLease(), null);
  assert.equal(result.safety.shadowRuntimeStarted, false);
  assert.equal(result.safety.captureRuntimeStarted, false);
  assert.equal(result.safety.modelRuntimeStarted, false);
  assert.equal(result.safety.accountCallsAllowed, false);
  assert.equal(result.safety.orderSubmissionAllowed, false);
  assert.equal(result.safety.liveActivationAllowed, false);
  const serialized = JSON.stringify(result);
  for (const sentinel of [...secretSentinels, "SENSITIVE_EPHEMERAL_KEY", makeTradePayload()]) {
    assert.equal(serialized.includes(sentinel), false);
  }
});

test("plain, JSON and generic caller assertions cannot reach provider I/O", async () => {
  let calls = 0;
  for (const authorization of [true, {}, JSON.parse(JSON.stringify({ proof: true }))]) {
    await assert.rejects(
      startKisProviderSmokeRuntime(
        { adminStartAuthorization: authorization, nowMs, approval: { ready: true } },
        {
          env: liveEnv(),
          fetchImpl: async () => { calls += 1; },
          webSocketFactory: () => { calls += 1; },
        },
      ),
      (error) => error.code === "KIS_ADMIN_START_AUTHORIZATION_REQUIRED",
    );
  }
  assert.equal(calls, 0);
});

test("non-allowlisted symbols fail closed before provider I/O", async () => {
  let calls = 0;
  await assert.rejects(
    startKisProviderSmokeRuntime(
      { adminStartAuthorization: adminStartAuthorization(), nowMs },
      {
        env: liveEnv({ FINPLE_TRADING_ALLOWED_SYMBOLS: "SPY,*" }),
        fetchImpl: async () => { calls += 1; },
        webSocketFactory: () => { calls += 1; },
      },
    ),
    (error) => error.code === "KIS_PROVIDER_SMOKE_SYMBOL_BLOCKED",
  );
  assert.equal(calls, 0);
});

test("single-flight, bounded timeout and operator stop close the only socket", async () => {
  const harness = providerHarness({ emitMessage: false });
  let timeoutMs;
  const dependencies = {
    ...harness.dependencies,
    setTimeoutImpl(callback, delay) { timeoutMs = delay; return { callback }; },
    clearTimeoutImpl() {},
  };
  const started = await startKisProviderSmokeRuntime(
    { adminStartAuthorization: adminStartAuthorization(), nowMs },
    dependencies,
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(started.active, true);
  assert.ok(timeoutMs <= KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS);
  await assert.rejects(
    startKisProviderSmokeRuntime(
      { adminStartAuthorization: adminStartAuthorization(), nowMs },
      dependencies,
    ),
    (error) => error.code === "KIS_PROVIDER_SMOKE_ALREADY_ACTIVE",
  );
  const stopped = stopKisProviderSmokeRuntime("operator_stop");
  assert.equal(stopped.state, "STOPPED");
  assert.equal(stopped.cleanShutdown, true);
  assert.equal(harness.closeCount(), 1);
});

test("timeout is capped at 60 seconds, disables reconnect and closes cleanly", async () => {
  let timeoutCallback;
  let timeoutMs;
  let closed = 0;
  let feedConfig;
  await startKisProviderSmokeRuntime(
    { adminStartAuthorization: adminStartAuthorization(), nowMs },
    {
      env: liveEnv(),
      fetchImpl: async () => ({ ok: true }),
      webSocketFactory: () => ({}),
      timeoutMs: 120_000,
      setTimeoutImpl(callback, delay) { timeoutCallback = callback; timeoutMs = delay; return 1; },
      clearTimeoutImpl() {},
      feedFactory: () => ({
        async connect(config) {
          feedConfig = config;
          return { connected: true, close() { closed += 1; } };
        },
      }),
    },
  );
  assert.equal(timeoutMs, KIS_PROVIDER_SMOKE_MAX_RUNTIME_MS);
  assert.equal(feedConfig.symbols.length, 1);
  assert.equal(feedConfig.maxReconnectAttempts, 0);
  timeoutCallback();
  const result = readKisProviderSmokeRuntimeStatus();
  assert.equal(result.state, "STOPPED");
  assert.equal(result.reason, "provider_smoke_timeout");
  assert.equal(result.cleanShutdown, true);
  assert.equal(closed, 1);
});

test("protocol exception always ends STOPPED and closes the socket", async () => {
  let closed = 0;
  const result = await startKisProviderSmokeRuntime(
    { adminStartAuthorization: adminStartAuthorization(), nowMs },
    {
      env: liveEnv(),
      fetchImpl: async () => ({ ok: true, json: async () => ({ approval_key: "ephemeral" }) }),
      webSocketFactory: () => ({}),
      feedFactory: () => ({
        async connect(config, handlers) {
          const connection = { connected: true, close() { closed += 1; } };
          queueMicrotask(() => handlers.onProtocolIssue({ kind: "socket_error", reasons: ["websocket_error"] }));
          return connection;
        },
      }),
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(result.state === "CONNECTING" || result.state === "STOPPED", true);
  assert.equal(readKisProviderSmokeRuntimeStatus().state, "STOPPED");
  assert.equal(readKisProviderSmokeRuntimeStatus().reason, "websocket_error");
  assert.deepEqual(readKisProviderSmokeRuntimeStatus().lifecycle, ["AUTHORIZED", "CONNECTING", "STOPPED"]);
  assert.equal(readKisProviderSmokeRuntimeStatus().cleanShutdown, true);
  assert.equal(closed, 1);
});
