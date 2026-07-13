import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT,
  STEP236A_RULE_POLICY_V1,
  assertNoStep236AEligibilitySensitiveMaterial,
  buildStep236ARulesBasedTradingEligibilityReport,
  formatStep236ARulesBasedTradingEligibilityReport,
  validateStep236AEligibilityReport,
} from "./tradingAiMlRulesBasedTradingEligibility.js";
import {
  buildStep235AOfflineFeatureDataset,
  buildStep235ASyntheticMonthlyFixture,
} from "./tradingAiMlOfflineFeatureBuilder.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shuffledDataset() {
  return buildStep235AOfflineFeatureDataset({ fixture: clone(buildStep235ASyntheticMonthlyFixture()).reverse() });
}

function firstSufficientRecord(dataset) {
  return dataset.records.find((record) => record.features.observationCount >= STEP236A_RULE_POLICY_V1.minimumObservationCount);
}

function makeSufficientEligible(features) {
  Object.assign(features, {
    return3m: 0.04,
    return6m: 0.05,
    return12m: 0.03,
    volatility3m: 0.01,
    volatility6m: 0.012,
    drawdown12m: -0.01,
    trend3mVs12m: 0.01,
    observationCount: 13,
  });
}

function reportCountSum(report) {
  return report.recordCounts.eligibleForResearch +
    report.recordCounts.hold +
    report.recordCounts.riskOff +
    report.recordCounts.insufficientHistory +
    report.recordCounts.blockedByDataQuality;
}

test("Step236A report exposes exact schema key sets and fixed policy", () => {
  const report = buildStep236ARulesBasedTradingEligibilityReport();

  assert.deepEqual(Object.keys(report), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.recordCounts), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.recordCountKeys);
  assert.deepEqual(Object.keys(report.decisionDistribution[0]), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.decisionDistributionKeys);
  assert.deepEqual(Object.keys(report.coverageRequirements), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.coverageRequirementKeys);
  assert.deepEqual(Object.keys(report.safety), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.safetyKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.readinessKeys);
  assert.deepEqual(report.decisionDistribution.map((entry) => entry.decision), STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.decisionOrder);
  assert.deepEqual(report.coverageRequirements, {
    minimumObservationCount: 13,
    nullFeatureImputationAllowed: false,
  });
});

test("Step236A default baseline is deterministic and count totals are canonical", () => {
  const first = buildStep236ARulesBasedTradingEligibilityReport();
  const second = buildStep236ARulesBasedTradingEligibilityReport();
  const shuffled = buildStep236ARulesBasedTradingEligibilityReport({ dataset: shuffledDataset() });

  assert.deepEqual(first, second);
  assert.deepEqual(first, shuffled);
  assert.equal(first.recordCounts.total, 28);
  assert.equal(reportCountSum(first), first.recordCounts.total);
  assert.equal(first.recordCounts.insufficientHistory >= 18, true);
  for (const entry of first.decisionDistribution) {
    assert.equal(entry.ratio, first.recordCounts.total === 0 ? 0 : Number((entry.count / first.recordCounts.total).toFixed(6)));
  }
});

test("Step236A labels and forward returns are not decision inputs", () => {
  const base = buildStep236ARulesBasedTradingEligibilityReport();
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  for (const record of dataset.records) {
    record.label.forwardReturn1m = record.label.forwardReturn1m === 0.99 ? -0.99 : 0.99;
    record.label.labelClass = "negative";
  }

  const changed = buildStep236ARulesBasedTradingEligibilityReport({ dataset });
  assert.deepEqual(changed, base);
});

test("Step236A data-quality blocked state takes priority over every rule", () => {
  const report = buildStep236ARulesBasedTradingEligibilityReport({ dataQualityStatus: "blocked" });

  assert.equal(report.recordCounts.blockedByDataQuality, report.recordCounts.total);
  assert.equal(report.recordCounts.eligibleForResearch, 0);
  assert.equal(report.recordCounts.riskOff, 0);
  assert.equal(report.recordCounts.insufficientHistory, 0);
});

test("Step236A observation shortage and null feature coverage are insufficient history, not zero-imputed", () => {
  const base = buildStep236ARulesBasedTradingEligibilityReport();
  assert.equal(base.recordCounts.insufficientHistory >= 18, true);

  const dataset = clone(buildStep235AOfflineFeatureDataset());
  const record = firstSufficientRecord(dataset);
  makeSufficientEligible(record.features);
  record.features.return12m = null;
  record.features.trend3mVs12m = 0.2;

  const report = buildStep236ARulesBasedTradingEligibilityReport({ dataset });
  assert.equal(report.recordCounts.insufficientHistory, base.recordCounts.insufficientHistory + 1);
});

test("Step236A risk-off has priority over eligible research trend", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  const record = firstSufficientRecord(dataset);
  makeSufficientEligible(record.features);
  record.features.drawdown12m = -0.2;
  record.features.volatility3m = 0.03;

  const report = buildStep236ARulesBasedTradingEligibilityReport({ dataset });
  assert.equal(report.recordCounts.riskOff >= 1, true);
});

test("Step236A eligible hold and review-required decisions follow policy", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  const eligibleRecord = firstSufficientRecord(dataset);
  makeSufficientEligible(eligibleRecord.features);
  const holdRecord = dataset.records.find((record) => record !== eligibleRecord && record.features.observationCount >= 13);
  Object.assign(holdRecord.features, {
    return3m: -0.01,
    return6m: 0.01,
    return12m: 0.02,
    volatility3m: 0.01,
    volatility6m: 0.012,
    drawdown12m: -0.01,
    trend3mVs12m: -0.03,
    observationCount: 13,
  });

  const pass = buildStep236ARulesBasedTradingEligibilityReport({ dataset, dataQualityStatus: "pass" });
  const review = buildStep236ARulesBasedTradingEligibilityReport({ dataset, dataQualityStatus: "review_required" });

  assert.equal(pass.recordCounts.eligibleForResearch >= 1, true);
  assert.equal(pass.recordCounts.hold >= 1, true);
  assert.equal(review.recordCounts.eligibleForResearch, 0);
});

test("Step236A inputs policy and output remain mutation resistant", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());
  const policy = clone(STEP236A_RULE_POLICY_V1);
  const beforeDataset = JSON.stringify(dataset);
  const beforePolicy = JSON.stringify(policy);
  const report = buildStep236ARulesBasedTradingEligibilityReport({ dataset, policy });

  assert.equal(JSON.stringify(dataset), beforeDataset);
  assert.equal(JSON.stringify(policy), beforePolicy);
  assert.throws(() => {
    report.safety.modelTrainingAllowed = true;
  }, /Cannot assign/);
});

test("Step236A public report and console text are redacted and fail closed", () => {
  const report = buildStep236ARulesBasedTradingEligibilityReport();
  const text = formatStep236ARulesBasedTradingEligibilityReport(report);

  assert.doesNotThrow(() => validateStep236AEligibilityReport(report));
  assert.doesNotThrow(() => assertNoStep236AEligibilitySensitiveMaterial(report));
  assert.doesNotThrow(() => assertNoStep236AEligibilitySensitiveMaterial(text));
  assert.deepEqual(report.safety, {
    modelTrainingAllowed: false,
    performanceClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  });
  assert.deepEqual(report.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
  assert.match(text, /FINPLE OFFLINE RULES-BASED RESEARCH ELIGIBILITY/);
  assert.match(text, /Model training allowed: No/);
  assert.match(text, /Performance claim allowed: No/);
  assert.match(text, /Order submission allowed: No/);
  assert.match(text, /Live trading readiness: Blocked/);
});

test("Step236A failure fixtures reject unsafe or invalid inputs", () => {
  const dataset = clone(buildStep235AOfflineFeatureDataset());

  const badSchema = clone(dataset);
  badSchema.schemaVersion = "0.0.0";
  assert.throws(() => buildStep236ARulesBasedTradingEligibilityReport({ dataset: badSchema }), /invalid feature schema/);

  const unknownPolicy = clone(STEP236A_RULE_POLICY_V1);
  unknownPolicy.policyVersion = "9.9.9";
  assert.throws(() => buildStep236ARulesBasedTradingEligibilityReport({ policy: unknownPolicy }), /unknown policy version/);

  const missingSafety = clone(buildStep236ARulesBasedTradingEligibilityReport());
  delete missingSafety.safety.liveTradingAllowed;
  assert.throws(() => validateStep236AEligibilityReport(missingSafety), /safety key set mismatch/);

  const missingFeature = clone(dataset);
  delete missingFeature.records[0].features.return3m;
  assert.throws(() => buildStep236ARulesBasedTradingEligibilityReport({ dataset: missingFeature }), /required feature missing/);

  const sensitive = clone(dataset);
  sensitive.records[0].rawProviderPayload = { value: "redacted secret token" };
  assert.throws(() => buildStep236ARulesBasedTradingEligibilityReport({ dataset: sensitive }), /sensitive/);

  const blocked = buildStep236ARulesBasedTradingEligibilityReport({ dataQualityStatus: "blocked" });
  assert.equal(blocked.recordCounts.eligibleForResearch, 0);
});
