import test from "node:test";
import assert from "node:assert/strict";

import {
  createDeterministicModelSignalFixtureProvider,
  createScalpingModelSignalAdapter,
  SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION,
  SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
  validateReplayModelSignalFixture,
  validateScalpingModelSignalEnvelope,
} from "./tradingScalpingModelSignalAdapter.js";

const minuteStart = "2026-08-05T13:35:00.000Z";
const minuteEnd = "2026-08-05T13:36:00.000Z";
const generatedAt = "2026-08-05T13:36:01.000Z";

function request(overrides = {}) {
  return {
    symbol: "TQQQ",
    timestamp: minuteStart,
    minuteStartMs: Date.parse(minuteStart),
    minuteEndMs: Date.parse(minuteEnd),
    open: 50,
    high: 50.2,
    low: 49.9,
    close: 50.1,
    volume: 100_000,
    quote: { bid: 50.09, ask: 50.11 },
    session: { name: "REGULAR", sessionDate: "2026-08-05" },
    ...overrides,
  };
}

function signal(overrides = {}) {
  return {
    signalVersion: SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
    symbol: "TQQQ",
    timestamp: minuteStart,
    probabilityUp: 0.67,
    expectedReturnBps: 18,
    confidence: 0.74,
    horizonMinutes: 5,
    regime: "intraday_bull",
    modelId: "finple-scalping-model",
    modelVersion: "model-v1",
    modelChecksum: "sha256:model-v1",
    generatedAt,
    dataCutoff: minuteEnd,
    provenanceId: "signal-receipt-1",
    ...overrides,
  };
}

test("accepts a causally aligned typed model signal", () => {
  const result = validateScalpingModelSignalEnvelope(signal(), request(), {
    nowMs: Date.parse("2026-08-05T13:36:02.000Z"),
    expectedModelVersion: "model-v1",
    expectedModelChecksum: "sha256:model-v1",
  });

  assert.equal(result.valid, true);
  assert.equal(result.signal.probabilityUp, 0.67);
  assert.equal(result.diagnostics.signalLatencyMs, 1_000);
  assert.equal(result.diagnostics.futureDataUsed, false);
  assert.equal(result.diagnostics.rawPayloadStored, false);
});

test("rejects future data cutoffs and excessive latency", () => {
  const future = validateScalpingModelSignalEnvelope(
    signal({
      dataCutoff: "2026-08-05T13:36:02.000Z",
      generatedAt: "2026-08-05T13:36:08.000Z",
    }),
    request(),
    { nowMs: Date.parse("2026-08-05T13:36:09.000Z"), maximumSignalLatencyMs: 5_000 },
  );

  assert.equal(future.valid, false);
  assert.ok(future.reasons.includes("future_data_cutoff"));
  assert.ok(future.reasons.includes("signal_latency_exceeded"));
});

test("rejects symbol, timestamp, and pinned model identity mismatches", () => {
  const result = validateScalpingModelSignalEnvelope(
    signal({ symbol: "SQQQ", timestamp: "2026-08-05T13:34:00.000Z", modelVersion: "model-v2" }),
    request(),
    {
      nowMs: Date.parse("2026-08-05T13:36:02.000Z"),
      expectedModelId: "finple-scalping-model",
      expectedModelVersion: "model-v1",
      expectedModelChecksum: "sha256:model-v1",
    },
  );

  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("signal_symbol_mismatch"));
  assert.ok(result.reasons.includes("signal_timestamp_mismatch"));
  assert.ok(result.reasons.includes("model_version_mismatch"));
});

test("adapter returns no substitute when the provider is unavailable", async () => {
  const adapter = createScalpingModelSignalAdapter({}, { now: () => Date.parse("2026-08-05T13:36:02.000Z") });
  const result = await adapter.getSignal(request());
  const status = adapter.status();

  assert.equal(result, null);
  assert.equal(status.state, "unavailable");
  assert.equal(status.counters.missing, 1);
  assert.equal(status.safety.missingSignalSubstitutionAllowed, false);
  assert.equal(status.safety.heuristicFallbackAllowed, false);
});

test("adapter accepts a valid signal and rejects duplicate or out-of-order requests", async () => {
  let nowMs = Date.parse("2026-08-05T13:36:02.000Z");
  const adapter = createScalpingModelSignalAdapter(
    { expectedModelVersion: "model-v1", expectedModelChecksum: "sha256:model-v1" },
    {
      now: () => nowMs,
      provider: async (input) => signal({ symbol: input.symbol, timestamp: input.timestamp, generatedAt }),
    },
  );

  assert.ok(await adapter.getSignal(request()));
  assert.equal(await adapter.getSignal(request()), null);
  nowMs += 1_000;
  assert.equal(await adapter.getSignal(request({ timestamp: "2026-08-05T13:34:00.000Z", minuteStartMs: Date.parse("2026-08-05T13:34:00.000Z"), minuteEndMs: Date.parse("2026-08-05T13:35:00.000Z") })), null);

  const status = adapter.status();
  assert.equal(status.counters.accepted, 1);
  assert.equal(status.counters.duplicateOrOutOfOrder, 2);
  assert.equal(status.state, "degraded");
});

test("adapter trips after repeated invalid signals and requires manual reset", async () => {
  let calls = 0;
  let nowMs = Date.parse("2026-08-05T13:36:02.000Z");
  const adapter = createScalpingModelSignalAdapter(
    { policy: { maximumConsecutiveFailures: 3 } },
    {
      now: () => nowMs,
      provider: async () => {
        calls += 1;
        return null;
      },
    },
  );

  for (let index = 0; index < 3; index += 1) {
    const startMs = Date.parse(minuteStart) + index * 60_000;
    const endMs = startMs + 60_000;
    nowMs = endMs + 1_000;
    assert.equal(await adapter.getSignal(request({
      timestamp: new Date(startMs).toISOString(),
      minuteStartMs: startMs,
      minuteEndMs: endMs,
    })), null);
  }
  assert.equal(adapter.status().state, "tripped");

  const nextStartMs = Date.parse(minuteStart) + 3 * 60_000;
  assert.equal(await adapter.getSignal(request({
    timestamp: new Date(nextStartMs).toISOString(),
    minuteStartMs: nextStartMs,
    minuteEndMs: nextStartMs + 60_000,
  })), null);
  assert.equal(calls, 3);
  assert.equal(adapter.status().counters.blockedByCircuitBreaker, 1);

  assert.equal(adapter.acknowledgeAndReset().state, "standby");
});

test("replay fixtures require immutable provenance and preserve causal validation", async () => {
  const fixture = {
    fixtureVersion: SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION,
    request: request(),
    signal: signal(),
    provenance: {
      datasetId: "dataset-2026-08",
      sourceRevision: "bars-v1",
      modelChecksum: "sha256:model-v1",
      fixtureChecksum: "sha256:fixture-1",
      immutable: true,
    },
  };
  const valid = validateReplayModelSignalFixture(fixture);
  assert.equal(valid.valid, true);

  const invalid = validateReplayModelSignalFixture({
    ...fixture,
    provenance: { ...fixture.provenance, immutable: false },
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.reasons.includes("replay_fixture_not_immutable"));

  const provider = createDeterministicModelSignalFixtureProvider([fixture]);
  assert.deepEqual(await provider(request()), valid.signal);
  assert.equal(await provider(request({ symbol: "SQQQ" })), null);
});
