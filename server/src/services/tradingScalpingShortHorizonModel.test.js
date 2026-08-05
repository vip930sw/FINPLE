import test from "node:test";
import assert from "node:assert/strict";

import { validateReplayModelSignalFixture } from "./tradingScalpingModelSignalAdapter.js";
import {
  buildImmutableScalpingModelSignalFixtures,
  buildScalpingShortHorizonDataset,
  extractScalpingShortHorizonFeatures,
  runScalpingShortHorizonWalkForward,
  scoreScalpingShortHorizonModel,
  trainScalpingShortHorizonModel,
} from "./tradingScalpingShortHorizonModel.js";

function tradingDates(count) {
  const dates = [];
  const cursor = new Date("2026-01-05T00:00:00Z");
  while (dates.length < count) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function series(symbol, sessionCount = 18, barsPerSession = 48) {
  const dates = tradingDates(sessionCount);
  const rows = [];
  let price = symbol.startsWith("S") || symbol.startsWith("TZA") ? 32 : 50;
  for (let sessionIndex = 0; sessionIndex < dates.length; sessionIndex += 1) {
    const direction = sessionIndex % 4 < 2 ? 1 : -1;
    for (let minute = 0; minute < barsPerSession; minute += 1) {
      const timestamp = Date.parse(`${dates[sessionIndex]}T14:30:00.000Z`) + minute * 60_000;
      const impulse = direction * 0.0007 + Math.sin((sessionIndex * 7 + minute) / 5) * 0.00025;
      const open = price;
      const close = Math.max(1, open * (1 + impulse));
      const high = Math.max(open, close) * 1.0005;
      const low = Math.min(open, close) * 0.9995;
      const spread = close * 0.0003;
      rows.push({
        symbol,
        timestamp: new Date(timestamp).toISOString(),
        sessionDate: dates[sessionIndex],
        open,
        high,
        low,
        close,
        volume: 100_000 + sessionIndex * 2_000 + minute * 150 + (minute % 7) * 500,
        quote: {
          bid: close - spread / 2,
          ask: close + spread / 2,
          bidSize: 900 + minute * 3,
          askSize: 800 + (barsPerSession - minute) * 2,
        },
        session: {
          sessionDate: dates[sessionIndex],
          minutesSinceOpen: minute,
          minutesToClose: 390 - minute,
        },
      });
      price = close;
    }
  }
  return rows;
}

function dataset() {
  return buildScalpingShortHorizonDataset({
    provenance: {
      datasetId: "dataset-scalping-research-2026q1",
      sourceRevision: "fixture-source-r1",
      rawDataChecksum: "raw-checksum-001",
      calendarVersion: "nyse-equity-calendar-2026-2028-v1",
      licensePolicyId: "repository-test-fixture-only",
      immutable: true,
    },
    seriesBySymbol: {
      TQQQ: series("TQQQ"),
      SQQQ: series("SQQQ"),
    },
  }, {
    minimumBars: 30,
    horizonMinutes: 3,
    positiveReturnThresholdBps: 5,
  });
}

const trainingOptions = {
  modelVersion: "1.0.0-test",
  policy: {
    minimumTrainingRows: 100,
    classifierIterations: 120,
    returnIterations: 120,
    embargoSessions: 1,
  },
};

test("feature extraction is deterministic and uses only completed history", () => {
  const rows = series("TQQQ", 1, 40);
  const first = extractScalpingShortHorizonFeatures({
    symbol: "TQQQ",
    bars: rows.slice(0, 30),
    quote: rows[29].quote,
    session: rows[29].session,
  });
  const changedFuture = rows.map((row, index) => index > 29 ? { ...row, close: row.close * 100 } : row);
  const second = extractScalpingShortHorizonFeatures({
    symbol: "TQQQ",
    bars: changedFuture.slice(0, 30),
    quote: changedFuture[29].quote,
    session: changedFuture[29].session,
  });
  assert.deepEqual(first.values, second.values);
  assert.equal(first.safety.usesOnlyBarsAtOrBeforePrediction, true);
  assert.equal(first.safety.futureLabelUsedAsFeature, false);
});

test("dataset uses immutable provenance and labels strictly after feature cutoff", () => {
  const result = dataset();
  assert.ok(result.rows.length > 300);
  assert.deepEqual(result.summary.symbols, ["SQQQ", "TQQQ"]);
  assert.equal(result.provenance.immutable, true);
  assert.equal(result.policy.randomSplitAllowed, false);
  assert.ok(result.rows.every((row) => Date.parse(row.labelEnd) > Date.parse(row.dataCutoff)));
  assert.ok(result.rows.every((row) => row.label.horizonMinutes === 3));
});

test("training is deterministic, chronological, and produces a research-only checksum", () => {
  const input = dataset();
  const first = trainScalpingShortHorizonModel(input, trainingOptions);
  const second = trainScalpingShortHorizonModel(input, trainingOptions);
  assert.equal(first.modelChecksum, second.modelChecksum);
  assert.match(first.modelChecksum, /^[a-f0-9]{64}$/);
  assert.equal(first.status, "research_candidate");
  assert.equal(first.runtimeApproved, false);
  assert.equal(first.safety.randomSplitUsed, false);
  assert.equal(first.scaler.fitScope, "train_only");
  assert.ok(first.metrics.test.samples > 0);
  assert.ok(Number.isFinite(first.metrics.test.brierScore));
  assert.ok(first.split.train.at(-1) < first.split.test[0]);
});

test("scoring emits the typed causal model signal contract", () => {
  const input = dataset();
  const artifact = trainScalpingShortHorizonModel(input, trainingOptions);
  const observation = input.rows.at(-1);
  const signal = scoreScalpingShortHorizonModel(artifact, {
    symbol: observation.symbol,
    timestamp: observation.timestamp,
    dataCutoff: observation.dataCutoff,
    features: observation.features,
  });
  assert.equal(signal.signalVersion, "scalping-model-signal-v1");
  assert.equal(signal.modelChecksum, artifact.modelChecksum);
  assert.equal(signal.dataCutoff, observation.dataCutoff);
  assert.ok(Date.parse(signal.generatedAt) >= Date.parse(signal.dataCutoff));
  assert.ok(signal.probabilityUp >= 0 && signal.probabilityUp <= 1);
  assert.equal(signal.horizonMinutes, 3);
});

test("immutable fixtures validate through the TSC-4F adapter contract", () => {
  const input = dataset();
  const artifact = trainScalpingShortHorizonModel(input, trainingOptions);
  const fixtures = buildImmutableScalpingModelSignalFixtures({
    artifact,
    observations: input.rows.slice(-4),
  });
  assert.equal(fixtures.length, 4);
  for (const fixture of fixtures) {
    const validation = validateReplayModelSignalFixture(fixture, {
      expectedModelId: artifact.modelId,
      expectedModelVersion: artifact.modelVersion,
      expectedModelChecksum: artifact.modelChecksum,
    });
    assert.equal(validation.valid, true, validation.reasons.join(","));
    assert.equal(validation.provenance.immutable, true);
  }
});

test("walk-forward folds preserve an embargo and never train on test sessions", () => {
  const input = dataset();
  const result = runScalpingShortHorizonWalkForward(input, {
    modelVersion: "1.0.0-walk-forward",
    trainSessions: 8,
    testSessions: 2,
    stepSessions: 2,
    embargoSessions: 1,
    policy: {
      minimumTrainingRows: 60,
      classifierIterations: 80,
      returnIterations: 80,
    },
  });
  assert.ok(result.folds.length >= 3);
  assert.equal(result.safety.randomSplitAllowed, false);
  assert.equal(result.safety.futureLeakageAllowed, false);
  for (const fold of result.folds) {
    assert.equal(fold.safety.chronological, true);
    assert.equal(fold.safety.trainEndsBeforeTestStarts, true);
    assert.ok(fold.trainEnd < fold.testStart);
    assert.equal(fold.embargoSessions, 1);
    assert.ok(Number.isFinite(fold.metrics.test.brierScore));
  }
});

test("invalid or mutable provenance is rejected fail-closed", () => {
  assert.throws(
    () => buildScalpingShortHorizonDataset({
      provenance: { datasetId: "x", immutable: false },
      seriesBySymbol: { TQQQ: series("TQQQ", 1, 40) },
    }),
    (error) => error.code === "INVALID_SCALPING_MODEL_DATASET_PROVENANCE" && error.details.includes("dataset_not_immutable"),
  );
});
