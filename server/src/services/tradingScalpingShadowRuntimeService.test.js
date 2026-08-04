import test from "node:test";
import assert from "node:assert/strict";

import {
  ingestScalpingShadowCycle,
  readScalpingShadowRuntimeStatus,
  resetScalpingShadowRuntimeForTest,
  startScalpingShadowRuntime,
  stopScalpingShadowRuntime,
} from "./tradingScalpingShadowRuntimeService.js";

function approvedVersion() {
  return {
    id: "approved-v1",
    versionNumber: 1,
    status: "approved",
    checksum: "checksum-v1",
    strategy: { allowedSymbols: ["TQQQ", "SOXL"] },
    objectives: { targetNetReturnPct: 3 },
    portfolioConstraints: {
      maxConcurrentPositions: 2,
      maximumNewIntentsPerCycle: 1,
      maxGrossExposureFraction: 0.7,
      maxAggregateRiskFraction: 0.02,
      allowOpposingPairSimultaneously: false,
      allowDuplicatePendingSymbol: false,
    },
  };
}

function runtimeDependencies(overrides = {}) {
  let snapshot = {
    ok: true,
    mode: "shadow",
    runId: "run-test-1",
    status: "running_no_market_data",
    asOf: "2026-08-05T00:00:00.000Z",
    metrics: { trades: 0 },
    promotion: { status: "insufficient_evidence" },
    ledger: { positions: {}, orders: [], fills: [], trades: [], equityCurve: [] },
    safety: { orderSubmissionAllowed: false },
  };
  const persisted = [];
  const stopped = [];
  const dependencies = {
    getRegistrySnapshot: async () => ({ versions: [approvedVersion()] }),
    getRuntimeStatus: async () => ({ mode: "memory_shadow", schemaReady: false }),
    getLatestSnapshot: async () => ({ snapshot: null, persistence: { mode: "memory_shadow" } }),
    createRun: async (input) => ({ run: input, persistence: { mode: "memory_shadow" } }),
    saveSnapshot: async (value) => {
      persisted.push(value);
      return { snapshot: value, persistence: { mode: "memory_shadow" } };
    },
    stopRun: async (runId, input) => {
      stopped.push({ runId, input });
      return { run: { id: runId, status: "stopped" }, persistence: { mode: "memory_shadow" } };
    },
    workerFactory: () => ({
      start() {
        return snapshot;
      },
      async ingestCycle() {
        snapshot = { ...snapshot, asOf: "2026-08-05T00:01:00.000Z", cycleCount: 1 };
        persisted.push(snapshot);
        return snapshot;
      },
      async stop(reason) {
        snapshot = { ...snapshot, status: "stopped", stopReason: reason };
        persisted.push(snapshot);
        return snapshot;
      },
      getSnapshot() {
        return snapshot;
      },
    }),
    now: () => "2026-08-05T00:00:00.000Z",
    ...overrides,
  };
  return { dependencies, persisted, stopped };
}

test.beforeEach(() => {
  resetScalpingShadowRuntimeForTest();
});

test("requires an immutable approved strategy version", async () => {
  await assert.rejects(
    () => startScalpingShadowRuntime({ initialCash: 100000 }, {}, {
      getRegistrySnapshot: async () => ({ versions: [] }),
    }),
    (error) => error.code === "APPROVED_SCALPING_VERSION_REQUIRED" && error.statusCode === 409,
  );
});

test("starts, ingests private cycles, reports status, and stops without an order adapter", async () => {
  const { dependencies, persisted, stopped } = runtimeDependencies();
  const started = await startScalpingShadowRuntime(
    { runId: "run-test-1", initialCash: 100000 },
    { actor: "test_admin", startedAt: "2026-08-05T00:00:00.000Z" },
    dependencies,
  );
  assert.equal(started.active, true);
  assert.equal(started.safety.brokerOrderAdapterPresent, false);
  assert.equal(started.safety.orderSubmissionAllowed, false);
  assert.equal(persisted.length, 1);

  const cycle = await ingestScalpingShadowCycle({ bars: [{ symbol: "TQQQ" }] }, dependencies);
  assert.equal(cycle.snapshot.cycleCount, 1);
  assert.equal(cycle.active, true);

  const status = await readScalpingShadowRuntimeStatus({}, dependencies);
  assert.equal(status.active, true);
  assert.equal(status.snapshot.runId, "run-test-1");

  const ended = await stopScalpingShadowRuntime(
    { reason: "operator_test_stop" },
    { actor: "test_admin", stoppedAt: "2026-08-05T00:02:00.000Z" },
    dependencies,
  );
  assert.equal(ended.active, false);
  assert.equal(ended.snapshot.status, "stopped");
  assert.equal(stopped[0].runId, "run-test-1");

  const inactive = await readScalpingShadowRuntimeStatus({}, dependencies);
  assert.equal(inactive.active, false);
});

test("rejects duplicate start and stop without active runtime", async () => {
  const { dependencies } = runtimeDependencies();
  await startScalpingShadowRuntime({ runId: "run-test-1", initialCash: 100000 }, {}, dependencies);
  await assert.rejects(
    () => startScalpingShadowRuntime({ runId: "run-test-2", initialCash: 100000 }, {}, dependencies),
    (error) => error.code === "SHADOW_RUNTIME_ALREADY_ACTIVE" && error.statusCode === 409,
  );
  await stopScalpingShadowRuntime({ reason: "first_stop" }, {}, dependencies);
  await assert.rejects(
    () => stopScalpingShadowRuntime({ reason: "second_stop" }, {}, dependencies),
    (error) => error.code === "SHADOW_RUNTIME_NOT_ACTIVE" && error.statusCode === 409,
  );
});
