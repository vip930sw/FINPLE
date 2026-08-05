import test from "node:test";
import assert from "node:assert/strict";

import {
  acknowledgeScalpingModelSignalCircuitBreaker,
  readScalpingModelSignalRuntimeStatus,
  registerScalpingModelSignalProvider,
  resetScalpingModelSignalRuntimeForTest,
  startScalpingModelSignalRuntime,
  stopScalpingModelSignalRuntime,
} from "./tradingScalpingModelSignalRuntimeService.js";

const NOW = Date.parse("2026-08-05T13:36:03.000Z");

function env(overrides = {}) {
  return {
    FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED: "true",
    FINPLE_TRADING_SCALPING_MODEL_ID: "finple-scalper",
    FINPLE_TRADING_SCALPING_MODEL_VERSION: "v1",
    FINPLE_TRADING_SCALPING_MODEL_CHECKSUM: "sha256:model-v1",
    FINPLE_TRADING_SCALPING_MODEL_SIGNAL_SCHEMA_VERSION: "scalping-model-signal-v1",
    FINPLE_TRADING_SCALPING_MODEL_APPROVAL_ID: "model-approval-1",
    FINPLE_TRADING_SCALPING_MODEL_APPROVED_BY: "representative",
    FINPLE_TRADING_SCALPING_MODEL_APPROVED_AT: "2026-08-05T00:00:00.000Z",
    FINPLE_TRADING_SCALPING_MODEL_EXPIRES_AT: "2026-08-06T00:00:00.000Z",
    FINPLE_TRADING_SCALPING_MODEL_ALLOWED_SYMBOLS: "TQQQ,SQQQ",
    ...overrides,
  };
}

function request(symbol = "TQQQ", timestamp = "2026-08-05T13:35:00.000Z") {
  return {
    symbol,
    timestamp,
    minuteStartMs: Date.parse(timestamp),
    minuteEndMs: Date.parse(timestamp) + 60_000,
    open: 50,
    high: 50.2,
    low: 49.9,
    close: 50.1,
    volume: 1000,
    quote: { bid: 50.09, ask: 50.11, bidSize: 100, askSize: 100 },
    session: { name: "REGULAR", state: "REGULAR", sessionDate: "2026-08-05" },
  };
}

function signal(input, overrides = {}) {
  return {
    signalVersion: "scalping-model-signal-v1",
    symbol: input.symbol,
    timestamp: input.timestamp,
    probabilityUp: 0.68,
    expectedReturnBps: 22,
    confidence: 0.77,
    horizonMinutes: 5,
    regime: "intraday_bull",
    modelId: "finple-scalper",
    modelVersion: "v1",
    modelChecksum: "sha256:model-v1",
    generatedAt: "2026-08-05T13:36:01.000Z",
    dataCutoff: "2026-08-05T13:36:00.000Z",
    provenanceId: "fixture-1",
    ...overrides,
  };
}

test.beforeEach(() => resetScalpingModelSignalRuntimeForTest());

test("reports fail-closed unavailable state without approved provider", async () => {
  const status = await readScalpingModelSignalRuntimeStatus(
    { env: env({ FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED: "false" }), nowMs: NOW, selectedSymbols: ["TQQQ"] },
  );
  assert.equal(status.active, false);
  assert.equal(status.entrySignalAvailable, false);
  assert.ok(status.blockingReasons.includes("model_signal_feature_disabled"));
  assert.ok(status.blockingReasons.includes("model_signal_provider_unavailable"));
  assert.equal(status.safety.orderSubmissionAllowed, false);
});

test("wraps a registered provider and exposes accepted per-symbol health", async () => {
  registerScalpingModelSignalProvider(async (input) => signal(input), { source: "test_provider" });
  const started = await startScalpingModelSignalRuntime(
    { selectedSymbols: ["TQQQ", "SQQQ"] },
    { env: env(), nowMs: NOW },
    { now: () => NOW },
  );
  assert.equal(started.status.active, true);
  assert.equal(started.status.entrySignalAvailable, true);

  const accepted = await started.provider(request("TQQQ"));
  assert.equal(accepted.modelVersion, "v1");
  const status = await readScalpingModelSignalRuntimeStatus();
  assert.equal(status.state, "healthy");
  assert.equal(status.perSymbol.TQQQ.accepted, 1);
  assert.equal(status.adapter.counters.accepted, 1);
  assert.doesNotMatch(JSON.stringify(status), /rawPayload|secret|token/i);
});

test("blocks a provider whose model identity does not match the approval", async () => {
  registerScalpingModelSignalProvider(async (input) => signal(input, { modelVersion: "v2" }));
  const started = await startScalpingModelSignalRuntime(
    { selectedSymbols: ["TQQQ"] },
    { env: env(), nowMs: NOW },
    { now: () => NOW },
  );
  assert.equal(await started.provider(request()), null);
  const status = await readScalpingModelSignalRuntimeStatus();
  assert.equal(status.adapter.counters.modelIdentityMismatches, 1);
  assert.equal(status.perSymbol.TQQQ.rejected, 1);
});

test("trips after repeated missing signals and requires manual acknowledgement", async () => {
  registerScalpingModelSignalProvider(async () => null);
  const started = await startScalpingModelSignalRuntime(
    {
      selectedSymbols: ["TQQQ"],
      approval: { maximumConsecutiveFailures: 2 },
    },
    { env: env(), nowMs: NOW },
    { now: () => NOW },
  );
  await started.provider(request("TQQQ", "2026-08-05T13:35:00.000Z"));
  await started.provider(request("TQQQ", "2026-08-05T13:36:00.000Z"));
  let status = await readScalpingModelSignalRuntimeStatus();
  assert.equal(status.state, "tripped");
  assert.equal(status.acknowledgementRequired, true);
  assert.equal(status.entrySignalAvailable, false);

  status = await acknowledgeScalpingModelSignalCircuitBreaker({ nowMs: NOW + 1000 });
  assert.equal(status.acknowledgementRequired, false);
  assert.equal(status.state, "standby");
  assert.equal(status.recentAlerts[0].code, "model_signal_circuit_breaker_acknowledged");
});

test("rejects strategy symbols outside the approved model scope", async () => {
  registerScalpingModelSignalProvider(async (input) => signal(input));
  const started = await startScalpingModelSignalRuntime(
    { selectedSymbols: ["SOXL"] },
    { env: env(), nowMs: NOW },
    { now: () => NOW },
  );
  assert.equal(started.provider, null);
  assert.ok(started.status.blockingReasons.includes("model_symbol_scope_mismatch"));
  assert.deepEqual(started.status.selectedSymbols, ["SOXL"]);
});

test("stops the runtime without enabling automatic recovery or orders", async () => {
  registerScalpingModelSignalProvider(async (input) => signal(input));
  await startScalpingModelSignalRuntime(
    { selectedSymbols: ["TQQQ"] },
    { env: env(), nowMs: NOW },
    { now: () => NOW },
  );
  const stopped = await stopScalpingModelSignalRuntime({ env: env(), nowMs: NOW + 2000, selectedSymbols: ["TQQQ"] });
  assert.equal(stopped.active, false);
  assert.equal(stopped.safety.automaticLiveActivationAllowed, false);
  assert.equal(stopped.safety.orderSubmissionAllowed, false);
});
