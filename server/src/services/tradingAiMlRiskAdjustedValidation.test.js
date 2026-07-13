import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP237B_RISK_ADJUSTED_ASSUMPTIONS,
  STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT,
  assertNoStep237BPublicSensitiveMaterial,
  buildStep237BRiskAdjustedValidationReport,
  calculateStep237BRiskAdjustedMetric,
  formatStep237BRiskAdjustedValidationReport,
  validateStep237BRiskAdjustedValidationReport,
} from "./tradingAiMlRiskAdjustedValidation.js";
import {
  buildStep237AWalkForwardRegimeValidationReport,
} from "./tradingAiMlWalkForwardRegimeValidation.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sourceMetric(overrides = {}) {
  return {
    totalPeriods: 12,
    exposedPeriods: 6,
    flatPeriods: 6,
    transitionCount: 2,
    totalTurnover: 2,
    totalCostRate: 0.002,
    grossTotalReturn: 0.1,
    netTotalReturn: 0.09,
    grossMaximumDrawdown: -0.04,
    netMaximumDrawdown: -0.05,
    grossVolatility: 0.02,
    netVolatility: 0.02,
    annualizedReturn: 0.12,
    costImpactOnTotalReturn: 0.01,
    positivePeriodRate: 0.5,
    negativePeriodRate: 0.25,
    averagePositivePeriodReturn: 0.03,
    averageNegativePeriodReturn: -0.02,
    longestNegativeStreak: 2,
    recoveryPeriodCount: 1,
    ...overrides,
  };
}

test("Step237B report exposes exact schema risk-free assumptions and fail-closed usage", () => {
  const report = buildStep237BRiskAdjustedValidationReport();
  assert.deepEqual(Object.keys(report), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.assumptions), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.assumptionKeys);
  assert.deepEqual(Object.keys(report.observationPolicy), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.observationPolicyKeys);
  assert.deepEqual(Object.keys(report.aggregateMetrics), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.metricKeys);
  assert.deepEqual(Object.keys(report.stabilityRanges), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.stabilityRangeKeys);
  assert.deepEqual(Object.keys(report.checks), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.checkKeys);
  assert.deepEqual(Object.keys(report.usage), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.usageKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT.readinessKeys);
  assert.deepEqual(report.assumptions, {
    returnFrequency: "monthly",
    periodsPerYear: 12,
    riskFreeRate: 0,
    riskFreeRateMode: "synthetic_zero_assumption",
    actualMarketRiskFreeRateClaimed: false,
    actualMarketPerformanceClaimed: false,
  });
  assert.equal(report.usage.researchOnly, true);
  for (const key of Object.keys(report.usage).filter((item) => item !== "researchOnly")) {
    assert.equal(report.usage[key], false);
  }
  assert.equal(report.readiness.actualLiveTradingReady, false);
  assert.equal(report.readiness.state, "blocked");
  validateStep237BRiskAdjustedValidationReport(report);
});

test("Step237B calculates Sharpe Calmar and risk-free zero assumption exactly", () => {
  const metric = calculateStep237BRiskAdjustedMetric("unit", sourceMetric());
  assert.equal(metric.netAnnualizedReturn, 0.12);
  assert.equal(metric.sharpeRatio, 1.732052);
  assert.equal(metric.calmarRatio, 2.4);
  assert.equal(metric.exposureRate, 0.5);
  assert.equal(metric.turnoverRate, 0.166667);
  assert.equal(metric.costToGrossReturnRatio, 0.1);
  assert.equal(STEP237B_RISK_ADJUSTED_ASSUMPTIONS.riskFreeRate, 0);
});

test("Step237B keeps annualized Sharpe and Calmar unavailable below twelve periods", () => {
  const metric = calculateStep237BRiskAdjustedMetric("short", sourceMetric({
    totalPeriods: 11,
    annualizedReturn: 0.12,
  }));
  assert.equal(metric.netAnnualizedReturn, null);
  assert.equal(metric.sharpeRatio, null);
  assert.equal(metric.calmarRatio, null);
});

test("Step237B keeps Sharpe unavailable when volatility is zero", () => {
  const metric = calculateStep237BRiskAdjustedMetric("zero_vol", sourceMetric({
    netVolatility: 0,
  }));
  assert.equal(metric.sharpeRatio, null);
  assert.equal(metric.calmarRatio, 2.4);
});

test("Step237B keeps Calmar unavailable when maximum drawdown is zero", () => {
  const metric = calculateStep237BRiskAdjustedMetric("zero_mdd", sourceMetric({
    netMaximumDrawdown: 0,
  }));
  assert.equal(metric.sharpeRatio, 1.732052);
  assert.equal(metric.calmarRatio, null);
});

test("Step237B never imputes unavailable values to zero", () => {
  const shortMetric = calculateStep237BRiskAdjustedMetric("short", sourceMetric({
    totalPeriods: 3,
    netVolatility: 0,
    netMaximumDrawdown: 0,
  }));
  assert.equal(shortMetric.netAnnualizedReturn, null);
  assert.equal(shortMetric.sharpeRatio, null);
  assert.equal(shortMetric.calmarRatio, null);
  assert.notEqual(shortMetric.sharpeRatio, 0);
  assert.notEqual(shortMetric.calmarRatio, 0);
});

test("Step237B cost sensitivity preserves source and cost monotonicity", () => {
  const report = buildStep237BRiskAdjustedValidationReport();
  assert.deepEqual(report.costSensitivity.map((row) => row.scenario), [
    "zero_cost",
    "base_synthetic_cost",
    "elevated_synthetic_cost",
  ]);
  assert.equal(report.costSensitivity.every((row) => row.sameExposureAndReturnSource), true);
  assert.equal(report.costSensitivity[0].netTotalReturn >= report.costSensitivity[1].netTotalReturn, true);
  assert.equal(report.costSensitivity[1].netTotalReturn >= report.costSensitivity[2].netTotalReturn, true);
  assert.equal(report.checks.costMonotonicityViolationDetected, false);
});

test("Step237B fold and regime metric arrays match Step237A counts", () => {
  const step237A = buildStep237AWalkForwardRegimeValidationReport();
  const report = buildStep237BRiskAdjustedValidationReport({ validationReport: step237A });
  assert.equal(report.foldMetrics.length, step237A.foldCounts.total);
  assert.equal(report.regimeMetrics.length, step237A.regimeCounts.total);
  assert.equal(report.aggregateMetrics.availablePeriodCount, step237A.aggregateMetrics.totalPeriods);
  assert.deepEqual(report.regimeMetrics.map((item) => item.scope), [
    "rising_market",
    "falling_market",
    "sideways_market",
    "high_volatility_market",
    "event_shock_market",
  ]);
});

test("Step237B carries positive negative streak recovery exposure and turnover metrics", () => {
  const metric = calculateStep237BRiskAdjustedMetric("unit", sourceMetric({
    positivePeriodRate: 0.75,
    negativePeriodRate: 0.25,
    averagePositivePeriodReturn: 0.02,
    averageNegativePeriodReturn: -0.01,
    longestNegativeStreak: 3,
    recoveryPeriodCount: 2,
    exposedPeriods: 9,
    totalPeriods: 12,
    totalTurnover: 6,
  }));
  assert.equal(metric.positivePeriodRate, 0.75);
  assert.equal(metric.negativePeriodRate, 0.25);
  assert.equal(metric.averagePositivePeriodReturn, 0.02);
  assert.equal(metric.averageNegativePeriodReturn, -0.01);
  assert.equal(metric.longestNegativeStreak, 3);
  assert.equal(metric.recoveryPeriodCount, 2);
  assert.equal(metric.exposureRate, 0.75);
  assert.equal(metric.turnoverRate, 0.5);
});

test("Step237B computes deterministic stability ranges", () => {
  const report = buildStep237BRiskAdjustedValidationReport();
  assert.equal(report.stabilityRanges.annualizedReturnRange, 0.218702);
  assert.equal(report.stabilityRanges.sharpeRange, 6.279934);
  assert.equal(report.stabilityRanges.calmarRange, 0.817521);
  assert.equal(report.stabilityRanges.maximumDrawdownRange, 0.000008);
  assert.equal(report.stabilityRanges.turnoverRange, 1);
  assert.equal(report.stabilityRanges.exposureRateRange, 0.625);
  assert.equal(report.stabilityRanges.costImpactRange, 0.000212);
});

test("Step237B is deterministic and canonical for shuffled Step237A regime input", () => {
  const source = clone(buildStep237AWalkForwardRegimeValidationReport());
  source.regimeResults = [source.regimeResults[4], source.regimeResults[2], source.regimeResults[0], source.regimeResults[3], source.regimeResults[1]];
  const baseline = buildStep237BRiskAdjustedValidationReport();
  const shuffled = buildStep237BRiskAdjustedValidationReport({ validationReport: source });
  assert.deepEqual(shuffled, baseline);
  assert.deepEqual(buildStep237BRiskAdjustedValidationReport(), baseline);
});

test("Step237B does not mutate Step237A report or cost scenario inputs and freezes output", () => {
  const source = clone(buildStep237AWalkForwardRegimeValidationReport());
  const costScenarios = [
    { scenario: "zero_cost", costMultiplier: 0 },
    { scenario: "base_synthetic_cost", costMultiplier: 1 },
    { scenario: "elevated_synthetic_cost", costMultiplier: 3 },
  ];
  const before = JSON.stringify({ source, costScenarios });
  const report = buildStep237BRiskAdjustedValidationReport({ validationReport: source, costScenarios });
  assert.equal(JSON.stringify({ source, costScenarios }), before);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.aggregateMetrics), true);
  assert.equal(Object.isFrozen(report.costSensitivity[0]), true);
});

test("Step237B blocks failure fixtures for assumption policy and invalid ratios", () => {
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({
    assumptions: {
      returnFrequency: "monthly",
      periodsPerYear: 12,
      riskFreeRate: 0.01,
      riskFreeRateMode: "synthetic_zero_assumption",
      actualMarketRiskFreeRateClaimed: false,
      actualMarketPerformanceClaimed: false,
    },
  }), /assumptions changed/);
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({
    assumptions: {
      returnFrequency: "monthly",
      periodsPerYear: 252,
      riskFreeRate: 0,
      riskFreeRateMode: "synthetic_zero_assumption",
      actualMarketRiskFreeRateClaimed: false,
      actualMarketPerformanceClaimed: false,
    },
  }), /assumptions changed/);
  assert.throws(() => validateStep237BRiskAdjustedValidationReport({
    ...buildStep237BRiskAdjustedValidationReport(),
    aggregateMetrics: {
      ...buildStep237BRiskAdjustedValidationReport().aggregateMetrics,
      availablePeriodCount: 3,
      sharpeRatio: 1,
    },
  }), /must block status|top-level|metric|finite|status|readiness|cost|usage|key|mismatch/);
});

test("Step237B blocks cost monotonicity leakage and non-finite failure fixtures", () => {
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({
    costScenarios: [
      { scenario: "zero_cost", costMultiplier: 0 },
      { scenario: "base_synthetic_cost", costMultiplier: 1 },
      { scenario: "elevated_synthetic_cost", costMultiplier: -1 },
    ],
  }), /cost monotonicity violation/);
  const source = clone(buildStep237AWalkForwardRegimeValidationReport());
  source.checks.futureLeakageDetected = true;
  const blocked = buildStep237BRiskAdjustedValidationReport({ validationReport: source });
  assert.equal(blocked.overallStatus, "blocked");
  assert.equal(blocked.checks.futureLeakageDetected, true);
  const nonFinite = clone(buildStep237AWalkForwardRegimeValidationReport());
  nonFinite.aggregateMetrics.netVolatility = Number.NaN;
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({ validationReport: nonFinite }), /must be finite|public metric/);
});

test("Step237B rejects missing fold regime source and sensitive performance claim material", () => {
  const missingRegime = clone(buildStep237AWalkForwardRegimeValidationReport());
  missingRegime.regimeResults = missingRegime.regimeResults.slice(0, 4);
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({ validationReport: missingRegime }), /regime result count mismatch/);
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({
    publicSummaryProbe: { ticker: "unsafe" },
  }), /prohibited material/);
  assert.throws(() => buildStep237BRiskAdjustedValidationReport({
    note: "market beating",
  }), /prohibited performance claim/);
});

test("Step237B public report and console text avoid sensitive material and claims", () => {
  const report = buildStep237BRiskAdjustedValidationReport();
  const text = formatStep237BRiskAdjustedValidationReport(report);
  assertNoStep237BPublicSensitiveMaterial(report);
  assertNoStep237BPublicSensitiveMaterial(text);
  for (const forbidden of [
    "assetKey",
    "ticker",
    "monthlyReturn",
    "2022-",
    "guaranteed return",
    "expected excess return",
    "safe strategy",
    "market beating",
    "buy recommendation",
    "sell recommendation",
    "suitable for users",
  ]) {
    assert.equal(JSON.stringify(report).includes(forbidden), false);
    assert.equal(text.includes(forbidden), false);
  }
});
