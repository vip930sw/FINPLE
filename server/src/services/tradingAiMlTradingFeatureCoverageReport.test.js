import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT,
  assertNoStep235BReportSensitiveMaterial,
  buildStep235BOfflineFeatureCoverageReport,
  formatStep235BOfflineFeatureCoverageReport,
} from "./tradingAiMlTradingFeatureCoverageReport.js";
import {
  buildStep235AOfflineFeatureDataset,
  buildStep235ASyntheticMonthlyFixture,
} from "./tradingAiMlOfflineFeatureBuilder.js";
import { buildStep235ATradingFeatureContract } from "./tradingAiMlTradingFeatureContract.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shuffledDataset() {
  return buildStep235AOfflineFeatureDataset({ fixture: clone(buildStep235ASyntheticMonthlyFixture()).reverse() });
}

test("Step235B report exposes exact top-level and nested key sets", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();

  assert.deepEqual(Object.keys(report), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.recordCounts), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.recordCountKeys);
  assert.deepEqual(Object.keys(report.featureCoverage[0]), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.featureCoverageKeys);
  assert.deepEqual(Object.keys(report.labelCoverage), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.labelCoverageKeys);
  assert.deepEqual(Object.keys(report.splitCoverage.train), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.splitCoverageKeys);
  assert.deepEqual(Object.keys(report.leakageChecks), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.leakageCheckKeys);
  assert.deepEqual(Object.keys(report.usage), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.usageKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.readinessKeys);
});

test("Step235B feature coverage follows Step235A contract canonical order", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();

  assert.deepEqual(
    report.featureCoverage.map((entry) => entry.feature),
    STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT.featureOrder,
  );
  for (const entry of report.featureCoverage) {
    assert.equal(entry.availableCount + entry.unavailableCount, report.recordCounts.total);
  }
});

test("Step235B coverage rates and observation-shortage counts are deterministic", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();
  const byFeature = Object.fromEntries(report.featureCoverage.map((entry) => [entry.feature, entry]));

  assert.deepEqual(byFeature.return1m, {
    feature: "return1m",
    availableCount: 28,
    unavailableCount: 0,
    coverageRate: 1,
  });
  assert.deepEqual(byFeature.return6m, {
    feature: "return6m",
    availableCount: 22,
    unavailableCount: 6,
    coverageRate: 0.785714,
  });
  assert.deepEqual(byFeature.return12m, {
    feature: "return12m",
    availableCount: 10,
    unavailableCount: 18,
    coverageRate: 0.357143,
  });
  assert.deepEqual(byFeature.trend3mVs12m, {
    feature: "trend3mVs12m",
    availableCount: 10,
    unavailableCount: 18,
    coverageRate: 0.357143,
  });
});

test("Step235B split and label coverage add up to record totals", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();

  assert.deepEqual(report.recordCounts, { total: 28, train: 20, validation: 4, test: 4 });
  const splitTotal = Object.values(report.splitCoverage).reduce((sum, split) => sum + split.recordCount, 0);
  const labelAvailableTotal = Object.values(report.splitCoverage).reduce((sum, split) => sum + split.labelAvailableCount, 0);
  assert.equal(splitTotal, report.recordCounts.total);
  assert.equal(labelAvailableTotal, report.labelCoverage.forwardReturn1mAvailableCount);
  assert.equal(
    report.labelCoverage.positiveCount + report.labelCoverage.neutralCount + report.labelCoverage.negativeCount,
    report.labelCoverage.forwardReturn1mAvailableCount,
  );
  assert.deepEqual(report.labelCoverage, {
    labelPurpose: "research_validation_only",
    forwardReturn1mAvailableCount: 28,
    forwardReturn1mUnavailableCount: 0,
    positiveCount: 5,
    neutralCount: 22,
    negativeCount: 1,
  });
});

test("Step235B leakage and usage flags remain fail-closed except offline inspection", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();

  assert.deepEqual(report.leakageChecks, {
    featureUsesFutureData: false,
    featureLabelOverlap: false,
    crossSplitOverlap: false,
    normalizationLeakage: false,
  });
  assert.deepEqual(report.usage, {
    modelTrainingAllowed: false,
    performanceClaimAllowed: false,
    runtimeServingAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    offlineFeatureInspectionAllowed: true,
  });
  assert.deepEqual(report.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
});

test("Step235B report is deterministic and canonical for shuffled Step235A input", () => {
  const first = buildStep235BOfflineFeatureCoverageReport();
  const second = buildStep235BOfflineFeatureCoverageReport();
  const shuffled = buildStep235BOfflineFeatureCoverageReport({ dataset: shuffledDataset() });

  assert.deepEqual(first, second);
  assert.deepEqual(first, shuffled);
});

test("Step235B does not mutate Step235A dataset or fixture inputs", () => {
  const fixture = clone(buildStep235ASyntheticMonthlyFixture());
  const dataset = buildStep235AOfflineFeatureDataset({ fixture });
  const beforeFixture = JSON.stringify(fixture);
  const beforeDataset = JSON.stringify(dataset);
  const report = buildStep235BOfflineFeatureCoverageReport({ dataset });

  assert.equal(JSON.stringify(fixture), beforeFixture);
  assert.equal(JSON.stringify(dataset), beforeDataset);
  assert.throws(() => {
    report.usage.modelTrainingAllowed = true;
  }, /Cannot assign/);
});

test("Step235B report and console text do not expose asset keys raw rows or timestamps", () => {
  const report = buildStep235BOfflineFeatureCoverageReport();
  const text = formatStep235BOfflineFeatureCoverageReport(report);

  assert.doesNotThrow(() => assertNoStep235BReportSensitiveMaterial(report));
  assert.doesNotThrow(() => assertNoStep235BReportSensitiveMaterial(text));
  assert.match(text, /FINPLE OFFLINE FEATURE COVERAGE/);
  assert.match(text, /Records: 28/);
  assert.match(text, /Train \/ Validation \/ Test: 20 \/ 4 \/ 4/);
  assert.match(text, /Feature contract: 1\.0\.0/);
  assert.match(text, /Leakage detected: No/);
  assert.match(text, /Model training allowed: No/);
  assert.match(text, /Order submission allowed: No/);
  assert.match(text, /Live trading readiness: Blocked/);
});

test("Step235B failure fixtures reject invalid inputs without opening permissions", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  const contract = clone(buildStep235ATradingFeatureContract());

  const schemaMismatch = clone(dataset);
  schemaMismatch.schemaVersion = "0.0.0";
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ dataset: schemaMismatch }), /schema version mismatch/);

  const splitMismatch = clone(dataset);
  splitMismatch.splits.train.recordCount += 1;
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ dataset: splitMismatch }), /split count mismatch/);

  const missingFeatureContract = clone(contract);
  missingFeatureContract.featureDefinitions = missingFeatureContract.featureDefinitions.slice(1);
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ contract: missingFeatureContract }), /canonical feature list mismatch/);

  const missingFeatureRecord = clone(dataset);
  delete missingFeatureRecord.records[0].features.return1m;
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ dataset: missingFeatureRecord }), /feature record key set mismatch/);

  const badLabel = clone(dataset);
  badLabel.records[0].label.labelClass = "unknown";
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ dataset: badLabel }), /label class mismatch/);

  const sensitive = clone(dataset);
  sensitive.records[0].rawProviderPayload = { value: "secret token" };
  assert.throws(() => buildStep235BOfflineFeatureCoverageReport({ dataset: sensitive }), /sensitive/);
});

test("Step235B leakage-true input is reported while permissions stay false", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  dataset.leakageChecks.featureUsesFutureData = true;
  const report = buildStep235BOfflineFeatureCoverageReport({ dataset });

  assert.equal(report.leakageChecks.featureUsesFutureData, true);
  assert.equal(report.usage.modelTrainingAllowed, false);
  assert.equal(report.usage.performanceClaimAllowed, false);
  assert.equal(report.usage.providerAccessAllowed, false);
  assert.equal(report.usage.orderSubmissionAllowed, false);
  assert.equal(report.usage.liveTradingAllowed, false);
  assert.equal(report.readiness.actualLiveTradingReady, false);
  assert.equal(report.readiness.state, "blocked");
});
