import test from "node:test";
import assert from "node:assert/strict";
import {
  STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT,
  assertNoStep237APublicSensitiveMaterial,
  buildStep237AWalkForwardRegimeValidationReport,
  formatStep237AWalkForwardRegimeValidationReport,
  validateStep237AWalkForwardRegimeValidationReport,
} from "./tradingAiMlWalkForwardRegimeValidation.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const CUSTOM_REGIMES = [
  {
    regime: "event_shock_market",
    monthlyReturns: [
      0.007, 0.008, 0.006, 0.009, 0.01, 0.008, 0.011, 0.007, -0.14, -0.052,
      0.018, 0.014, 0.012, 0.009, 0.007, 0.011, 0.008, 0.01, 0.006, 0.009,
    ],
    decisions: [
      "insufficient_history", "insufficient_history", "insufficient_history", "insufficient_history",
      "eligible_for_research", "eligible_for_research", "eligible_for_research", "eligible_for_research",
      "eligible_for_research", "risk_off", "risk_off", "hold",
      "hold", "eligible_for_research", "eligible_for_research", "hold",
      "eligible_for_research", "eligible_for_research", "hold", "eligible_for_research",
      "hold",
    ],
  },
  {
    regime: "high_volatility_market",
    monthlyReturns: [
      0.018, -0.021, 0.026, -0.024, 0.031, -0.028, 0.034, -0.032, 0.027, -0.029,
      0.036, -0.035, 0.03, -0.033, 0.028, -0.031, 0.026, -0.027, 0.024, -0.025,
    ],
    decisions: [
      "insufficient_history", "insufficient_history", "insufficient_history", "insufficient_history",
      "eligible_for_research", "risk_off", "risk_off", "hold",
      "risk_off", "hold", "risk_off", "risk_off",
      "hold", "risk_off", "hold", "risk_off",
      "risk_off", "hold", "risk_off", "hold",
      "risk_off",
    ],
  },
  {
    regime: "sideways_market",
    monthlyReturns: [
      0.006, -0.005, 0.004, -0.004, 0.005, -0.006, 0.003, -0.003, 0.004, -0.004,
      0.006, -0.005, 0.005, -0.006, 0.004, -0.004, 0.003, -0.003, 0.004, -0.004,
    ],
    decisions: [
      "insufficient_history", "insufficient_history", "insufficient_history", "insufficient_history",
      "hold", "eligible_for_research", "hold", "eligible_for_research",
      "hold", "eligible_for_research", "hold", "eligible_for_research",
      "hold", "eligible_for_research", "hold", "eligible_for_research",
      "hold", "eligible_for_research", "hold", "eligible_for_research",
      "hold",
    ],
  },
  {
    regime: "falling_market",
    monthlyReturns: [
      0.002, -0.004, -0.006, -0.008, -0.011, -0.014, -0.018, -0.022, -0.019, -0.017,
      -0.024, -0.02, -0.016, -0.018, -0.021, -0.015, -0.012, -0.01, -0.009, -0.006,
    ],
    decisions: [
      "insufficient_history", "insufficient_history", "insufficient_history", "insufficient_history",
      "eligible_for_research", "eligible_for_research", "risk_off", "risk_off",
      "risk_off", "hold", "risk_off", "risk_off",
      "hold", "risk_off", "risk_off", "hold",
      "risk_off", "risk_off", "hold", "risk_off",
      "risk_off",
    ],
  },
  {
    regime: "rising_market",
    monthlyReturns: [
      0.004, 0.006, 0.005, 0.007, 0.009, 0.011, 0.008, 0.012, 0.01, 0.014,
      0.009, 0.013, 0.015, 0.012, 0.016, 0.01, 0.018, 0.014, 0.017, 0.012,
    ],
    decisions: [
      "insufficient_history", "insufficient_history", "insufficient_history", "insufficient_history",
      "hold", "eligible_for_research", "eligible_for_research", "eligible_for_research",
      "hold", "eligible_for_research", "eligible_for_research", "hold",
      "eligible_for_research", "eligible_for_research", "eligible_for_research", "hold",
      "eligible_for_research", "eligible_for_research", "eligible_for_research", "hold",
      "eligible_for_research",
    ],
  },
];

const CUSTOM_FOLDS = [
  {
    fold: "fold_3",
    train: { startIndex: 0, endIndex: 13 },
    validation: { startIndex: 14, endIndex: 15 },
    test: { startIndex: 16, endIndex: 18 },
  },
  {
    fold: "fold_1",
    train: { startIndex: 0, endIndex: 7 },
    validation: { startIndex: 8, endIndex: 9 },
    test: { startIndex: 10, endIndex: 12 },
  },
  {
    fold: "fold_2",
    train: { startIndex: 0, endIndex: 10 },
    validation: { startIndex: 11, endIndex: 12 },
    test: { startIndex: 13, endIndex: 15 },
  },
];

test("Step237A report exposes exact public schema and policy versions", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport();
  assert.deepEqual(Object.keys(report), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.policyVersions), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.policyVersionKeys);
  assert.deepEqual(Object.keys(report.foldCounts), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.foldCountKeys);
  assert.deepEqual(Object.keys(report.regimeCounts), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.regimeCountKeys);
  assert.deepEqual(Object.keys(report.aggregateMetrics), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.metricKeys);
  assert.deepEqual(Object.keys(report.foldStability), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.foldStabilityKeys);
  assert.deepEqual(Object.keys(report.checks), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.checkKeys);
  assert.deepEqual(Object.keys(report.usage), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.usageKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT.readinessKeys);
  assert.equal(report.validationMode, "offline_synthetic_walk_forward_regime_pilot");
  assert.deepEqual(report.policyVersions, {
    feature: "1.0.0",
    eligibility: "1.0.0",
    position: "1.0.0",
    cost: "1.0.0",
    validation: "1.0.0",
  });
  validateStep237AWalkForwardRegimeValidationReport(report);
});

test("Step237A runs three folds and five required regimes without opening permissions", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport();
  assert.deepEqual(report.foldCounts, { total: 3, completed: 3, blocked: 0 });
  assert.deepEqual(report.regimeResults.map((item) => item.regime), [
    "rising_market",
    "falling_market",
    "sideways_market",
    "high_volatility_market",
    "event_shock_market",
  ]);
  assert.equal(report.regimeCounts.total, 5);
  assert.equal(report.regimeCounts.completed, 5);
  assert.equal(report.regimeCounts.blocked, 0);
  assert.equal(report.overallStatus, "review_required");
  assert.equal(report.usage.researchOnly, true);
  for (const key of Object.keys(report.usage).filter((item) => item !== "researchOnly")) {
    assert.equal(report.usage[key], false);
  }
  assert.equal(report.readiness.actualLiveTradingReady, false);
  assert.equal(report.readiness.state, "blocked");
});

test("Step237A state fixtures include eligible hold risk-off and insufficient history", () => {
  const statuses = new Set(CUSTOM_REGIMES.flatMap((regime) => regime.decisions));
  assert.equal(statuses.has("eligible_for_research"), true);
  assert.equal(statuses.has("hold"), true);
  assert.equal(statuses.has("risk_off"), true);
  assert.equal(statuses.has("insufficient_history"), true);
});

test("Step237A cost-aware fold and regime metrics are deterministic research calculations", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport();
  assert.equal(report.aggregateMetrics.totalPeriods, 240);
  assert.equal(report.aggregateMetrics.exposedPeriods, 99);
  assert.equal(report.aggregateMetrics.flatPeriods, 141);
  assert.equal(report.aggregateMetrics.transitionCount, 26);
  assert.equal(report.aggregateMetrics.totalTurnover, 26);
  assert.equal(report.aggregateMetrics.totalCostRate, 0.026);
  assert.equal(report.aggregateMetrics.netTotalReturn, -0.01251);
  assert.equal(report.aggregateMetrics.costImpactOnTotalReturn, 0.001668);
  assert.equal(report.aggregateMetrics.longestNegativeStreak, 3);
  assert.equal(report.aggregateMetrics.recoveryPeriodCount, 14);
  assert.equal(report.foldStability.netReturnRange, 0.028281);
  assert.equal(report.regimeResults.find((item) => item.regime === "sideways_market").status, "review_required");
});

test("Step237A event shock waits until the next decision period for risk-off handling", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport({ regimes: CUSTOM_REGIMES, folds: CUSTOM_FOLDS });
  const shock = report.regimeResults.find((item) => item.regime === "event_shock_market");
  assert.equal(shock.status, "stable_for_further_offline_research");
  assert.equal(report.checks.samePeriodExecutionDetected, false);
  assert.equal(report.checks.futureLeakageDetected, false);
  assert.equal(report.checks.policyOptimizationDetected, false);
});

test("Step237A missing risk-off after the shock is unstable rather than silently passing", () => {
  const regimes = clone(CUSTOM_REGIMES);
  const shock = regimes.find((item) => item.regime === "event_shock_market");
  shock.decisions[9] = "hold";
  const report = buildStep237AWalkForwardRegimeValidationReport({ regimes, folds: CUSTOM_FOLDS });
  const shockResult = report.regimeResults.find((item) => item.regime === "event_shock_market");
  assert.equal(shockResult.status, "unstable");
  assert.equal(report.overallStatus, "unstable");
});

test("Step237A blocked failure flags close the validation without changing policy", () => {
  for (const check of [
    "futureLeakageDetected",
    "crossFoldOverlapDetected",
    "crossSplitOverlapDetected",
    "samePeriodExecutionDetected",
    "policyOptimizationDetected",
    "nonFiniteValueDetected",
  ]) {
    const report = buildStep237AWalkForwardRegimeValidationReport({ checks: { [check]: true } });
    assert.equal(report.checks[check], true);
    assert.equal(report.overallStatus, "blocked");
    assert.equal(report.usage.performanceClaimAllowed, false);
    assert.equal(report.usage.orderSubmissionAllowed, false);
    assert.equal(report.readiness.actualLiveTradingReady, false);
  }
});

test("Step237A data-quality blocked fixture blocks every regime", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport({ dataQualityStatus: "blocked" });
  assert.equal(report.overallStatus, "blocked");
  assert.equal(report.regimeCounts.blocked, 5);
  assert.equal(report.foldCounts.blocked, 3);
});

test("Step237A rejects malformed walk-forward and regime failure fixtures", () => {
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({
    folds: [
      { fold: "fold_1", train: { startIndex: 0, endIndex: 5 }, validation: { startIndex: 5, endIndex: 6 }, test: { startIndex: 7, endIndex: 8 } },
      { fold: "fold_2", train: { startIndex: 0, endIndex: 6 }, validation: { startIndex: 7, endIndex: 8 }, test: { startIndex: 9, endIndex: 10 } },
      { fold: "fold_3", train: { startIndex: 0, endIndex: 7 }, validation: { startIndex: 8, endIndex: 9 }, test: { startIndex: 11, endIndex: 12 } },
    ],
  }), /split overlap/);
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({
    folds: [
      { fold: "fold_1", train: { startIndex: 0, endIndex: 5 }, validation: { startIndex: 6, endIndex: 7 }, test: { startIndex: 8, endIndex: 9 } },
      { fold: "fold_2", train: { startIndex: 0, endIndex: 5 }, validation: { startIndex: 6, endIndex: 7 }, test: { startIndex: 8, endIndex: 9 } },
      { fold: "fold_3", train: { startIndex: 0, endIndex: 7 }, validation: { startIndex: 8, endIndex: 9 }, test: { startIndex: 10, endIndex: 11 } },
    ],
  }), /duplicate test fold/);
  const unknownRegime = clone(CUSTOM_REGIMES);
  unknownRegime[0].regime = "unknown_market";
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({ regimes: unknownRegime }), /unknown regime/);
  const missingRegime = clone(CUSTOM_REGIMES).slice(0, 4);
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({ regimes: missingRegime }), /regime result missing/);
  const nonFinite = clone(CUSTOM_REGIMES);
  nonFinite[0].monthlyReturns[3] = Number.NaN;
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({ regimes: nonFinite }), /must be finite|incomplete/);
});

test("Step237A output is canonical for shuffled fold and regime input", () => {
  const baseline = buildStep237AWalkForwardRegimeValidationReport();
  const shuffled = buildStep237AWalkForwardRegimeValidationReport({
    regimes: CUSTOM_REGIMES,
    folds: CUSTOM_FOLDS,
  });
  assert.deepEqual(shuffled, baseline);
});

test("Step237A does not mutate input fixtures and freezes output", () => {
  const regimes = clone(CUSTOM_REGIMES);
  const folds = clone(CUSTOM_FOLDS);
  const before = JSON.stringify({ regimes, folds });
  const report = buildStep237AWalkForwardRegimeValidationReport({ regimes, folds });
  assert.equal(JSON.stringify({ regimes, folds }), before);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.aggregateMetrics), true);
  assert.equal(Object.isFrozen(report.regimeResults[0]), true);
});

test("Step237A public report and console text avoid sensitive material and performance claims", () => {
  const report = buildStep237AWalkForwardRegimeValidationReport();
  const text = formatStep237AWalkForwardRegimeValidationReport(report);
  assertNoStep237APublicSensitiveMaterial(report);
  assertNoStep237APublicSensitiveMaterial(text);
  for (const forbidden of [
    "assetKey",
    "ticker",
    "monthlyReturn",
    "2022-",
    "guaranteed return",
    "market beating",
    "buy recommendation",
    "sell recommendation",
    "suitable for users",
  ]) {
    assert.equal(JSON.stringify(report).includes(forbidden), false);
    assert.equal(text.includes(forbidden), false);
  }
});

test("Step237A rejects sensitive or performance-claim input probes", () => {
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({
    publicSummaryProbe: { assetKey: "unsafe" },
  }), /prohibited material/);
  assert.throws(() => buildStep237AWalkForwardRegimeValidationReport({
    note: "guaranteed return",
  }), /prohibited performance claim/);
});
