import {
  STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
} from "./tradingAiMlTradingFeatureContract.js";
import {
  STEP236A_POLICY_VERSION,
} from "./tradingAiMlRulesBasedTradingEligibility.js";
import {
  STEP236B_POSITION_POLICY_VERSION,
  buildStep236BResearchPositionTransitionLedger,
  validateStep236BTransitionLedger,
} from "./tradingAiMlResearchPositionPolicy.js";
import {
  STEP236C_COST_MODEL_VERSION,
} from "./tradingAiMlBacktestCostPolicy.js";
import {
  buildStep236COfflineBacktestLedger,
  buildStep236COfflineBacktestReport,
  validateStep236COfflineBacktestReport,
} from "./tradingAiMlOfflineBacktest.js";

export const STEP237A_VALIDATION_SCHEMA_VERSION = "1.0.0";
export const STEP237A_VALIDATION_VERSION = "1.0.0";
export const STEP237A_VALIDATION_MODE = "offline_synthetic_walk_forward_regime_pilot";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "validationMode",
  "policyVersions",
  "foldCounts",
  "regimeCounts",
  "aggregateMetrics",
  "foldStability",
  "regimeResults",
  "checks",
  "overallStatus",
  "usage",
  "readiness",
]);

const POLICY_VERSION_KEYS = Object.freeze(["feature", "eligibility", "position", "cost", "validation"]);
const FOLD_COUNT_KEYS = Object.freeze(["total", "completed", "blocked"]);
const REGIME_COUNT_KEYS = Object.freeze(["total", "completed", "reviewRequired", "unstable", "blocked"]);
const METRIC_KEYS = Object.freeze([
  "totalPeriods",
  "exposedPeriods",
  "flatPeriods",
  "transitionCount",
  "totalTurnover",
  "totalCostRate",
  "grossTotalReturn",
  "netTotalReturn",
  "grossMaximumDrawdown",
  "netMaximumDrawdown",
  "grossVolatility",
  "netVolatility",
  "annualizedReturn",
  "costImpactOnTotalReturn",
  "positivePeriodRate",
  "negativePeriodRate",
  "averagePositivePeriodReturn",
  "averageNegativePeriodReturn",
  "longestNegativeStreak",
  "recoveryPeriodCount",
]);
const FOLD_STABILITY_KEYS = Object.freeze([
  "netReturnRange",
  "maximumDrawdownRange",
  "turnoverRange",
  "costImpactRange",
]);
const REGIME_RESULT_KEYS = Object.freeze(["regime", "status", "metrics"]);
const CHECK_KEYS = Object.freeze([
  "futureLeakageDetected",
  "crossFoldOverlapDetected",
  "crossSplitOverlapDetected",
  "samePeriodExecutionDetected",
  "policyOptimizationDetected",
  "nonFiniteValueDetected",
]);
const USAGE_KEYS = Object.freeze([
  "researchOnly",
  "performanceClaimAllowed",
  "modelTrainingAllowed",
  "paperTradingAllowed",
  "shadowTradingAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
]);
const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const REGIME_ORDER = Object.freeze([
  "rising_market",
  "falling_market",
  "sideways_market",
  "high_volatility_market",
  "event_shock_market",
]);

const STATUS_ORDER = Object.freeze([
  "stable_for_further_offline_research",
  "review_required",
  "unstable",
  "blocked",
]);

const DECISION_STATUSES = Object.freeze([
  "eligible_for_research",
  "hold",
  "risk_off",
  "insufficient_history",
  "blocked_by_data_quality",
]);

const FOLDS = deepFreeze([
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
  {
    fold: "fold_3",
    train: { startIndex: 0, endIndex: 13 },
    validation: { startIndex: 14, endIndex: 15 },
    test: { startIndex: 16, endIndex: 18 },
  },
]);

const REGIME_FIXTURES = deepFreeze([
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
]);

const PROHIBITED_CLAIM_PATTERNS = Object.freeze([
  /guaranteed return/i,
  /expected excess return/i,
  /safe strategy/i,
  /validated alpha/i,
  /market beating/i,
  /outperform/i,
  /no loss/i,
  /buy recommendation/i,
  /sell recommendation/i,
  /suitable for users/i,
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function round6(value) {
  if (value === null || value === undefined) return null;
  return Number(value.toFixed(6));
}

function average(values) {
  if (values.length === 0) return 0;
  return round6(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function range(values) {
  if (values.length === 0) return 0;
  return round6(Math.max(...values) - Math.min(...values));
}

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Step237A ${label} must be finite`);
  }
}

function assertNoProhibitedMaterial(value) {
  const serialized = JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
    /recordId/i,
    /rawProviderPayload/i,
    /providerPayload/i,
    /orderPayload/i,
    /rawResponse/i,
    /credential/i,
    /secret/i,
    /token/i,
    /account/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /close/i,
    /monthlyReturn/i,
    /forwardReturn1m/i,
    /labelClass/i,
    /targetWeight/i,
    /paperTrading/i,
    /shadowTrading/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step237A prohibited material detected: ${pattern}`);
    }
  }
}

function assertNoPerformanceClaim(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step237A prohibited performance claim detected: ${pattern}`);
    }
  }
}

function timestampFor(index) {
  const year = 2022 + Math.floor(index / 12);
  const month = String((index % 12) + 1).padStart(2, "0");
  return `${year}-${month}-28T00:00:00.000Z`;
}

function assertKnownRegime(regime) {
  if (!REGIME_ORDER.includes(regime)) {
    throw new TypeError("Step237A unknown regime");
  }
}

function normalizeRegimes(regimes = REGIME_FIXTURES) {
  const rows = clonePlain(regimes).sort((left, right) => {
    return REGIME_ORDER.indexOf(left.regime) - REGIME_ORDER.indexOf(right.regime);
  });
  if (rows.length !== REGIME_ORDER.length) {
    throw new TypeError("Step237A regime result missing");
  }
  const names = new Set();
  for (const regime of rows) {
    assertKnownRegime(regime.regime);
    if (names.has(regime.regime)) throw new TypeError("Step237A duplicate regime");
    names.add(regime.regime);
    if (!Array.isArray(regime.monthlyReturns) || regime.monthlyReturns.length < 20) {
      throw new TypeError("Step237A regime return fixture is incomplete");
    }
    if (!Array.isArray(regime.decisions) || regime.decisions.length < 21) {
      throw new TypeError("Step237A regime decision fixture is incomplete");
    }
    for (const value of regime.monthlyReturns) {
      assertFiniteNumber(value, "regime return");
    }
    for (const status of regime.decisions) {
      if (!DECISION_STATUSES.includes(status)) throw new TypeError("Step237A unknown decision status");
    }
  }
  return rows;
}

function normalizeFolds(folds = FOLDS) {
  const rows = clonePlain(folds).sort((left, right) => String(left.fold).localeCompare(String(right.fold)));
  if (rows.length < 3) {
    throw new TypeError("Step237A requires at least three folds");
  }
  const testWindows = new Set();
  for (const fold of rows) {
    const windows = [fold.train, fold.validation, fold.test];
    for (const window of windows) {
      if (!Number.isInteger(window.startIndex) || !Number.isInteger(window.endIndex) || window.startIndex > window.endIndex) {
        throw new TypeError("Step237A invalid fold window");
      }
    }
    if (fold.validation.startIndex <= fold.train.endIndex || fold.test.startIndex <= fold.validation.endIndex) {
      throw new TypeError("Step237A fold split overlap");
    }
    const testKey = `${fold.test.startIndex}:${fold.test.endIndex}`;
    if (testWindows.has(testKey)) throw new TypeError("Step237A duplicate test fold window");
    testWindows.add(testKey);
  }
  return rows;
}

function decisionsForFold(regime, fold) {
  const start = fold.train.startIndex;
  const end = fold.test.endIndex + 1;
  return regime.decisions.slice(start, end + 1).map((decisionStatus, index) => ({
    sequence: index + 1,
    decisionStatus,
    decisionTimestamp: timestampFor(start + index),
  }));
}

function returnsForFold(regime, fold) {
  const start = fold.train.startIndex;
  const end = fold.test.endIndex;
  const returns = [];
  for (let index = start; index <= end; index += 1) {
    returns.push({
      sequence: returns.length + 1,
      effectiveFrom: timestampFor(index + 1),
      researchPeriodReturn: regime.monthlyReturns[index + 1],
    });
  }
  return returns;
}

function buildFoldRun(regime, fold) {
  const positionLedger = buildStep236BResearchPositionTransitionLedger({
    eligibilityDecisions: decisionsForFold(regime, fold),
  });
  validateStep236BTransitionLedger(positionLedger);
  const returnFixture = returnsForFold(regime, fold);
  const backtestInput = { positionLedger, returnFixture };
  const report = buildStep236COfflineBacktestReport(backtestInput);
  const ledger = buildStep236COfflineBacktestLedger(backtestInput);
  validateStep236COfflineBacktestReport(report);
  return { report, ledger };
}

function additionalMetrics(ledger) {
  const netReturns = ledger.map((row) => row.netPeriodReturn);
  const positives = netReturns.filter((value) => value > 0);
  const negatives = netReturns.filter((value) => value < 0);
  let longestNegativeStreak = 0;
  let currentNegativeStreak = 0;
  let underwater = false;
  let recoveryPeriodCount = 0;
  for (const row of ledger) {
    if (row.netPeriodReturn < 0) {
      currentNegativeStreak += 1;
      longestNegativeStreak = Math.max(longestNegativeStreak, currentNegativeStreak);
    } else {
      currentNegativeStreak = 0;
    }
    if (row.netEquity < 1) underwater = true;
    if (underwater && row.netEquity >= 1) {
      recoveryPeriodCount += 1;
      underwater = false;
    }
  }
  return {
    positivePeriodRate: ledger.length === 0 ? 0 : round6(positives.length / ledger.length),
    negativePeriodRate: ledger.length === 0 ? 0 : round6(negatives.length / ledger.length),
    averagePositivePeriodReturn: positives.length === 0 ? 0 : average(positives),
    averageNegativePeriodReturn: negatives.length === 0 ? 0 : average(negatives),
    longestNegativeStreak,
    recoveryPeriodCount,
  };
}

function metricsFromRun(run) {
  const summary = run.report;
  const extra = additionalMetrics(run.ledger);
  return {
    totalPeriods: summary.recordCounts.totalPeriods,
    exposedPeriods: summary.recordCounts.exposedPeriods,
    flatPeriods: summary.recordCounts.flatPeriods,
    transitionCount: summary.recordCounts.transitionCount,
    totalTurnover: summary.turnover.totalTurnover,
    totalCostRate: summary.costs.totalCostRate,
    grossTotalReturn: summary.performance.grossTotalReturn,
    netTotalReturn: summary.performance.netTotalReturn,
    grossMaximumDrawdown: summary.performance.grossMaximumDrawdown,
    netMaximumDrawdown: summary.performance.netMaximumDrawdown,
    grossVolatility: summary.performance.grossVolatility,
    netVolatility: summary.performance.netVolatility,
    annualizedReturn: summary.performance.netAnnualizedReturn,
    costImpactOnTotalReturn: summary.costs.costImpactOnTotalReturn,
    ...extra,
  };
}

function aggregateMetrics(metrics) {
  return {
    totalPeriods: metrics.reduce((sum, item) => sum + item.totalPeriods, 0),
    exposedPeriods: metrics.reduce((sum, item) => sum + item.exposedPeriods, 0),
    flatPeriods: metrics.reduce((sum, item) => sum + item.flatPeriods, 0),
    transitionCount: metrics.reduce((sum, item) => sum + item.transitionCount, 0),
    totalTurnover: round6(metrics.reduce((sum, item) => sum + item.totalTurnover, 0)),
    totalCostRate: round6(metrics.reduce((sum, item) => sum + item.totalCostRate, 0)),
    grossTotalReturn: average(metrics.map((item) => item.grossTotalReturn)),
    netTotalReturn: average(metrics.map((item) => item.netTotalReturn)),
    grossMaximumDrawdown: average(metrics.map((item) => item.grossMaximumDrawdown)),
    netMaximumDrawdown: average(metrics.map((item) => item.netMaximumDrawdown)),
    grossVolatility: average(metrics.map((item) => item.grossVolatility)),
    netVolatility: average(metrics.map((item) => item.netVolatility)),
    annualizedReturn: average(metrics.map((item) => item.annualizedReturn).filter((value) => value !== null)),
    costImpactOnTotalReturn: average(metrics.map((item) => item.costImpactOnTotalReturn)),
    positivePeriodRate: average(metrics.map((item) => item.positivePeriodRate)),
    negativePeriodRate: average(metrics.map((item) => item.negativePeriodRate)),
    averagePositivePeriodReturn: average(metrics.map((item) => item.averagePositivePeriodReturn)),
    averageNegativePeriodReturn: average(metrics.map((item) => item.averageNegativePeriodReturn)),
    longestNegativeStreak: Math.max(...metrics.map((item) => item.longestNegativeStreak)),
    recoveryPeriodCount: metrics.reduce((sum, item) => sum + item.recoveryPeriodCount, 0),
  };
}

function stabilityFromFoldMetrics(foldMetrics) {
  return {
    netReturnRange: range(foldMetrics.map((item) => item.netTotalReturn)),
    maximumDrawdownRange: range(foldMetrics.map((item) => item.netMaximumDrawdown)),
    turnoverRange: range(foldMetrics.map((item) => item.totalTurnover)),
    costImpactRange: range(foldMetrics.map((item) => item.costImpactOnTotalReturn)),
  };
}

function regimeStatus(regime, metrics, dataQualityStatus) {
  if (dataQualityStatus === "blocked") return "blocked";
  if (metrics.length === 0) return "unstable";
  if (regime.regime === "event_shock_market") {
    const shockIndex = 8;
    const nextStatus = regime.decisions[shockIndex + 1];
    if (nextStatus !== "risk_off") return "unstable";
  }
  if (regime.regime === "sideways_market") return "review_required";
  return "stable_for_further_offline_research";
}

function buildChecks(options) {
  return {
    futureLeakageDetected: options.futureLeakageDetected === true,
    crossFoldOverlapDetected: options.crossFoldOverlapDetected === true,
    crossSplitOverlapDetected: options.crossSplitOverlapDetected === true,
    samePeriodExecutionDetected: options.samePeriodExecutionDetected === true,
    policyOptimizationDetected: options.policyOptimizationDetected === true,
    nonFiniteValueDetected: options.nonFiniteValueDetected === true,
  };
}

function overallStatusFrom(regimeResults, checks) {
  if (Object.values(checks).some(Boolean)) return "blocked";
  if (regimeResults.some((item) => item.status === "blocked")) return "blocked";
  if (regimeResults.some((item) => item.status === "unstable")) return "unstable";
  if (regimeResults.some((item) => item.status === "review_required")) return "review_required";
  return "stable_for_further_offline_research";
}

function buildUsage() {
  return {
    researchOnly: true,
    performanceClaimAllowed: false,
    modelTrainingAllowed: false,
    paperTradingAllowed: false,
    shadowTradingAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  };
}

function buildReadiness() {
  return {
    actualLiveTradingReady: false,
    state: "blocked",
  };
}

export function buildStep237AWalkForwardRegimeValidationReport(input = {}) {
  const source = clonePlain(input);
  assertNoProhibitedMaterial(source.publicSummaryProbe ?? {});
  assertNoPerformanceClaim(source);
  const regimes = normalizeRegimes(source.regimes ?? REGIME_FIXTURES);
  const folds = normalizeFolds(source.folds ?? FOLDS);
  const dataQualityStatus = source.dataQualityStatus ?? "pass";
  if (!["pass", "review_required", "blocked"].includes(dataQualityStatus)) {
    throw new TypeError("Step237A unknown data quality status");
  }
  const checks = buildChecks(source.checks ?? {});
  const allRunMetrics = [];
  const foldMetricBuckets = new Map(folds.map((fold) => [fold.fold, []]));
  const regimeResults = regimes.map((regime) => {
    const regimeMetrics = [];
    for (const fold of folds) {
      const run = buildFoldRun(regime, fold);
      const metrics = metricsFromRun(run);
      regimeMetrics.push(metrics);
      allRunMetrics.push(metrics);
      foldMetricBuckets.get(fold.fold).push(metrics);
    }
    return {
      regime: regime.regime,
      status: regimeStatus(regime, regimeMetrics, dataQualityStatus),
      metrics: aggregateMetrics(regimeMetrics),
    };
  });
  const foldAggregates = [...foldMetricBuckets.values()].map(aggregateMetrics);
  const overallStatus = overallStatusFrom(regimeResults, checks);
  const report = {
    schemaVersion: STEP237A_VALIDATION_SCHEMA_VERSION,
    validationMode: STEP237A_VALIDATION_MODE,
    policyVersions: {
      feature: STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
      eligibility: STEP236A_POLICY_VERSION,
      position: STEP236B_POSITION_POLICY_VERSION,
      cost: STEP236C_COST_MODEL_VERSION,
      validation: STEP237A_VALIDATION_VERSION,
    },
    foldCounts: {
      total: folds.length,
      completed: overallStatus === "blocked" ? 0 : folds.length,
      blocked: overallStatus === "blocked" ? folds.length : 0,
    },
    regimeCounts: {
      total: regimes.length,
      completed: regimeResults.filter((item) => item.status !== "blocked").length,
      reviewRequired: regimeResults.filter((item) => item.status === "review_required").length,
      unstable: regimeResults.filter((item) => item.status === "unstable").length,
      blocked: regimeResults.filter((item) => item.status === "blocked").length,
    },
    aggregateMetrics: aggregateMetrics(allRunMetrics),
    foldStability: stabilityFromFoldMetrics(foldAggregates),
    regimeResults,
    checks,
    overallStatus,
    usage: buildUsage(),
    readiness: buildReadiness(),
  };
  validateStep237AWalkForwardRegimeValidationReport(report);
  assertNoStep237APublicSensitiveMaterial(report);
  return deepFreeze(report);
}

export function formatStep237AWalkForwardRegimeValidationReport(
  report = buildStep237AWalkForwardRegimeValidationReport(),
) {
  const lines = [
    "FINPLE WALK-FORWARD REGIME VALIDATION PILOT",
    "",
    "Synthetic offline calculation",
    "Walk-forward fixture result",
    "Regime-specific research result",
    "Calculated under synthetic cost assumptions",
    "Actual market results are unknown",
    "Additional validation required",
    `Folds: ${report.foldCounts.completed}/${report.foldCounts.total}`,
    `Regimes: ${report.regimeCounts.completed}/${report.regimeCounts.total}`,
    `Overall status: ${report.overallStatus}`,
    `Total periods: ${report.aggregateMetrics.totalPeriods}`,
    `Total turnover: ${report.aggregateMetrics.totalTurnover}`,
    `Total synthetic cost rate: ${report.aggregateMetrics.totalCostRate}`,
    `Average net result: ${report.aggregateMetrics.netTotalReturn}`,
    `Average net maximum drawdown: ${report.aggregateMetrics.netMaximumDrawdown}`,
    `Performance claim allowed: ${report.usage.performanceClaimAllowed ? "Yes" : "No"}`,
    `Paper trading allowed: ${report.usage.paperTradingAllowed ? "Yes" : "No"}`,
    `Shadow trading allowed: ${report.usage.shadowTradingAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  const text = `${lines.join("\n")}\n`;
  assertNoPerformanceClaim(text);
  assertNoStep237APublicSensitiveMaterial(text);
  return text;
}

export function validateStep237AWalkForwardRegimeValidationReport(report) {
  if (!sameKeys(report, TOP_LEVEL_KEYS)) throw new TypeError("Step237A top-level key set mismatch");
  if (!sameKeys(report.policyVersions, POLICY_VERSION_KEYS)) throw new TypeError("Step237A policy version key set mismatch");
  if (!sameKeys(report.foldCounts, FOLD_COUNT_KEYS)) throw new TypeError("Step237A fold count key set mismatch");
  if (!sameKeys(report.regimeCounts, REGIME_COUNT_KEYS)) throw new TypeError("Step237A regime count key set mismatch");
  if (!sameKeys(report.aggregateMetrics, METRIC_KEYS)) throw new TypeError("Step237A aggregate metric key set mismatch");
  if (!sameKeys(report.foldStability, FOLD_STABILITY_KEYS)) throw new TypeError("Step237A fold stability key set mismatch");
  if (!Array.isArray(report.regimeResults) || report.regimeResults.length !== REGIME_ORDER.length) {
    throw new TypeError("Step237A regime result count mismatch");
  }
  for (const result of report.regimeResults) {
    if (!sameKeys(result, REGIME_RESULT_KEYS)) throw new TypeError("Step237A regime result key set mismatch");
    assertKnownRegime(result.regime);
    if (!STATUS_ORDER.includes(result.status)) throw new TypeError("Step237A unknown stability status");
    if (!sameKeys(result.metrics, METRIC_KEYS)) throw new TypeError("Step237A regime metric key set mismatch");
  }
  if (!sameKeys(report.checks, CHECK_KEYS)) throw new TypeError("Step237A check key set mismatch");
  if (!sameKeys(report.usage, USAGE_KEYS)) throw new TypeError("Step237A usage key set mismatch");
  if (!sameKeys(report.readiness, READINESS_KEYS)) throw new TypeError("Step237A readiness key set mismatch");
  if (!STATUS_ORDER.includes(report.overallStatus)) throw new TypeError("Step237A unknown overall status");
  if (report.usage.researchOnly !== true) throw new TypeError("Step237A researchOnly must be true");
  for (const key of USAGE_KEYS.filter((item) => item !== "researchOnly")) {
    if (report.usage[key] !== false) throw new TypeError(`Step237A usage opened: ${key}`);
  }
  if (report.readiness.actualLiveTradingReady !== false || report.readiness.state !== "blocked") {
    throw new TypeError("Step237A readiness opened");
  }
  for (const value of [
    ...Object.values(report.aggregateMetrics),
    ...Object.values(report.foldStability),
    ...report.regimeResults.flatMap((item) => Object.values(item.metrics)),
  ]) {
    if (value !== null) assertFiniteNumber(value, "public metric");
  }
}

export function assertNoStep237APublicSensitiveMaterial(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
    /recordId/i,
    /rawProviderPayload/i,
    /providerPayload/i,
    /orderPayload/i,
    /rawResponse/i,
    /credential/i,
    /secret/i,
    /token/i,
    /account/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /close/i,
    /monthlyReturn/i,
    /forwardReturn1m/i,
    /labelClass/i,
    /targetWeight/i,
    /2022-\d{2}-\d{2}T/i,
    /2023-\d{2}-\d{2}T/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step237A public report leaked prohibited material: ${pattern}`);
    }
  }
  assertNoPerformanceClaim(serialized);
}

export const STEP237A_WALK_FORWARD_REGIME_VALIDATION_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  policyVersionKeys: POLICY_VERSION_KEYS,
  foldCountKeys: FOLD_COUNT_KEYS,
  regimeCountKeys: REGIME_COUNT_KEYS,
  metricKeys: METRIC_KEYS,
  foldStabilityKeys: FOLD_STABILITY_KEYS,
  regimeResultKeys: REGIME_RESULT_KEYS,
  checkKeys: CHECK_KEYS,
  usageKeys: USAGE_KEYS,
  readinessKeys: READINESS_KEYS,
  regimeOrder: REGIME_ORDER,
  statusOrder: STATUS_ORDER,
  schemaVersion: STEP237A_VALIDATION_SCHEMA_VERSION,
  validationMode: STEP237A_VALIDATION_MODE,
  validationVersion: STEP237A_VALIDATION_VERSION,
  redactedPublicReport: true,
  syntheticOnly: true,
});
