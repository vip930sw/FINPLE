import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT,
  assertNoStep235ASensitiveMaterial,
  buildStep235ALeakageChecks,
  buildStep235AOfflineFeatureDataset,
  buildStep235AOfflineFeatureSummary,
  buildStep235ASyntheticMonthlyFixture,
} from "./tradingAiMlOfflineFeatureBuilder.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function byTimestampMarket(records, timestamp, market) {
  return records.find((record) => record.featureTimestamp === timestamp && record.market === market);
}

function shuffledFixture() {
  return clone(buildStep235ASyntheticMonthlyFixture()).reverse();
}

test("Step235A offline feature output exposes exact schema and safe usage flags", () => {
  const dataset = buildStep235AOfflineFeatureDataset();

  assert.deepEqual(Object.keys(dataset), STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.outputTopLevelKeys);
  assert.equal(dataset.schemaVersion, "1.0.0");
  assert.equal(dataset.featureContractVersion, "1.0.0");
  assert.equal(dataset.mode, "offline_synthetic_feature_pilot");
  assert.deepEqual(Object.keys(dataset.leakageChecks), STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.leakageCheckKeys);
  assert.deepEqual(Object.keys(dataset.usage), STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.usageKeys);
  assert.deepEqual(dataset.usage, {
    modelTrainingAllowed: false,
    backtestClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  });
});

test("Step235A feature calculations are exact for known synthetic windows", () => {
  const dataset = buildStep235AOfflineFeatureDataset();
  const usDecember = byTimestampMarket(dataset.records, "2020-12-31T00:00:00.000Z", "US");
  const krMarch = byTimestampMarket(dataset.records, "2021-03-31T00:00:00.000Z", "KR");

  assert.deepEqual(usDecember.features, {
    return1m: -0.008,
    return3m: 0.023982,
    return6m: 0.059922,
    return12m: 0.08066,
    volatility3m: 0.011776,
    volatility6m: 0.013247,
    drawdown12m: -0.02,
    trend3mVs12m: -0.056678,
    observationCount: 12,
    featureTimestamp: "2020-12-31T00:00:00.000Z",
  });
  assert.deepEqual(krMarch.label, {
    forwardReturn1m: -0.018,
    labelTimestamp: "2021-04-30T00:00:00.000Z",
    labelWindowStart: "2021-04-30T00:00:00.000Z",
    labelWindowEnd: "2021-04-30T00:00:00.000Z",
    labelClass: "neutral",
    labelPolicyVersion: "1.0.0",
    labelPurpose: "research_validation_only",
  });
});

test("Step235A marks unavailable features when observation history is insufficient", () => {
  const dataset = buildStep235AOfflineFeatureDataset();
  const early = byTimestampMarket(dataset.records, "2020-03-31T00:00:00.000Z", "US");

  assert.equal(early.features.return3m, 0.019898);
  assert.equal(early.features.return6m, null);
  assert.equal(early.features.return12m, null);
  assert.equal(early.features.volatility6m, null);
  assert.equal(early.features.drawdown12m, null);
  assert.equal(early.features.trend3mVs12m, null);
  assert.equal(early.featureAvailability.return6m, false);
  assert.equal(early.featureAvailability.return12m, false);
});

test("Step235A future value changes do not affect prior features", () => {
  const base = buildStep235AOfflineFeatureDataset();
  const changedFixture = clone(buildStep235ASyntheticMonthlyFixture());
  const future = changedFixture.find((row) => row.assetKey === "synthetic-us-core" && row.timestamp === "2021-08-31T00:00:00.000Z");
  future.monthlyReturn = 0.99;
  future.close = 999;

  const changed = buildStep235AOfflineFeatureDataset({ fixture: changedFixture });
  assert.deepEqual(
    byTimestampMarket(changed.records, "2020-12-31T00:00:00.000Z", "US").features,
    byTimestampMarket(base.records, "2020-12-31T00:00:00.000Z", "US").features,
  );
});

test("Step235A label value changes do not affect feature values", () => {
  const base = buildStep235AOfflineFeatureDataset();
  const changedFixture = clone(buildStep235ASyntheticMonthlyFixture());
  const labelMonth = changedFixture.find((row) => row.assetKey === "synthetic-us-core" && row.timestamp === "2021-01-31T00:00:00.000Z");
  labelMonth.monthlyReturn = -0.5;

  const changed = buildStep235AOfflineFeatureDataset({ fixture: changedFixture });
  assert.deepEqual(
    byTimestampMarket(changed.records, "2020-12-31T00:00:00.000Z", "US").features,
    byTimestampMarket(base.records, "2020-12-31T00:00:00.000Z", "US").features,
  );
  assert.notEqual(
    byTimestampMarket(changed.records, "2020-12-31T00:00:00.000Z", "US").label.forwardReturn1m,
    byTimestampMarket(base.records, "2020-12-31T00:00:00.000Z", "US").label.forwardReturn1m,
  );
});

test("Step235A leakage checks enforce feature label and split chronology", () => {
  const dataset = buildStep235AOfflineFeatureDataset();

  assert.deepEqual(dataset.leakageChecks, {
    featureUsesFutureData: false,
    featureLabelOverlap: false,
    crossSplitOverlap: false,
    normalizationLeakage: false,
  });
  for (const record of dataset.records) {
    assert.equal(Date.parse(record.featureSourceWindow.end) <= Date.parse(record.featureTimestamp), true);
    assert.equal(Date.parse(record.featureTimestamp) < Date.parse(record.label.labelWindowStart), true);
    assert.equal(Date.parse(record.label.labelWindowStart) <= Date.parse(record.label.labelWindowEnd), true);
  }
  assert.equal(Date.parse(dataset.splits.train.end) < Date.parse(dataset.splits.validation.start), true);
  assert.equal(Date.parse(dataset.splits.validation.end) < Date.parse(dataset.splits.test.start), true);
});

test("Step235A leakage validator catches failure fixtures", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());

  const futureData = clone(dataset);
  futureData.records[0].featureSourceWindow.end = "2022-01-31T00:00:00.000Z";
  assert.equal(buildStep235ALeakageChecks(futureData.records, futureData.splits).featureUsesFutureData, true);

  const overlap = clone(dataset);
  overlap.records[0].label.labelWindowStart = overlap.records[0].featureTimestamp;
  assert.equal(buildStep235ALeakageChecks(overlap.records, overlap.splits).featureLabelOverlap, true);

  const crossSplit = clone(dataset);
  crossSplit.splits.validation.labelWindowStart = crossSplit.splits.train.labelWindowEnd;
  assert.equal(buildStep235ALeakageChecks(crossSplit.records, crossSplit.splits).crossSplitOverlap, true);

  assert.equal(buildStep235ALeakageChecks(dataset.records, dataset.splits, "full_dataset").normalizationLeakage, true);
});

test("Step235A output is deterministic canonical and input order independent", () => {
  const first = buildStep235AOfflineFeatureDataset();
  const second = buildStep235AOfflineFeatureDataset();
  const shuffled = buildStep235AOfflineFeatureDataset({ fixture: shuffledFixture() });

  assert.deepEqual(first, second);
  assert.deepEqual(first, shuffled);
});

test("Step235A builder does not mutate input fixture or output", () => {
  const fixture = clone(buildStep235ASyntheticMonthlyFixture());
  const before = JSON.stringify(fixture);
  const dataset = buildStep235AOfflineFeatureDataset({ fixture });

  assert.equal(JSON.stringify(fixture), before);
  assert.throws(() => {
    dataset.usage.modelTrainingAllowed = true;
  }, /Cannot assign/);
});

test("Step235A summary hides asset keys and source row lists", () => {
  const summary = buildStep235AOfflineFeatureSummary();
  const serialized = JSON.stringify(summary);

  assert.equal(serialized.includes("assetKey"), false);
  assert.equal(serialized.includes("synthetic-us-core"), false);
  assert.equal(serialized.includes("synthetic-kr-core"), false);
  assert.deepEqual(summary.recordCounts, {
    total: 28,
    train: 20,
    validation: 4,
    test: 4,
  });
});

test("Step235A output excludes sensitive provider payload and order material", () => {
  const dataset = buildStep235AOfflineFeatureDataset();
  const summary = buildStep235AOfflineFeatureSummary();

  assert.doesNotThrow(() => assertNoStep235ASensitiveMaterial(dataset));
  assert.doesNotThrow(() => assertNoStep235ASensitiveMaterial(summary));
});
