import {
  buildStep237AWalkForwardRegimeValidationReport,
  validateStep237AWalkForwardRegimeValidationReport,
} from "./tradingAiMlWalkForwardRegimeValidation.js";

export const STEP237B_RISK_ADJUSTED_SCHEMA_VERSION = "1.0.0";
export const STEP237B_RISK_ADJUSTED_MODE = "offline_synthetic_risk_adjusted_validation";
export const STEP237B_RISK_ADJUSTED_VERSION = "1.0.0";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "metricMode",
  "assumptions",
  "observationPolicy",
  "aggregateMetrics",
  "foldMetrics",
  "regimeMetrics",
  "stabilityRanges",
  "costSensitivity",
  "checks",
  "overallStatus",
  "usage",
  "readiness",
]);

const ASSUMPTION_KEYS = Object.freeze([
  "returnFrequency",
  "periodsPerYear",
  "riskFreeRate",
  "riskFreeRateMode",
  "actualMarketRiskFreeRateClaimed",
  "actualMarketPerformanceClaimed",
]);
const OBSERVATION_POLICY_KEYS = Object.freeze([
  "minimumAnnualizedPeriods",
  "minimumSharpePeriods",
  "minimumCalmarPeriods",
  "unavailableValueImputationAllowed",
]);
const METRIC_KEYS = Object.freeze([
  "scope",
  "netAnnualizedReturn",
  "netMaximumDrawdown",
  "netVolatility",
  "sharpeRatio",
  "calmarRatio",
  "positivePeriodRate",
  "negativePeriodRate",
  "averagePositivePeriodReturn",
  "averageNegativePeriodReturn",
  "longestNegativeStreak",
  "recoveryPeriodCount",
  "exposureRate",
  "turnoverRate",
  "costToGrossReturnRatio",
  "availablePeriodCount",
]);
const STABILITY_RANGE_KEYS = Object.freeze([
  "annualizedReturnRange",
  "sharpeRange",
  "calmarRange",
  "maximumDrawdownRange",
  "turnoverRange",
  "exposureRateRange",
  "costImpactRange",
]);
const COST_SENSITIVITY_KEYS = Object.freeze([
  "scenario",
  "costMultiplier",
  "sameExposureAndReturnSource",
  "netTotalReturn",
  "costImpactOnTotalReturn",
]);
const CHECK_KEYS = Object.freeze([
  "futureLeakageDetected",
  "samePeriodExecutionDetected",
  "nonFiniteValueDetected",
  "costMonotonicityViolationDetected",
  "performanceClaimDetected",
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

export const STEP237B_RISK_ADJUSTED_ASSUMPTIONS = deepFreeze({
  returnFrequency: "monthly",
  periodsPerYear: 12,
  riskFreeRate: 0,
  riskFreeRateMode: "synthetic_zero_assumption",
  actualMarketRiskFreeRateClaimed: false,
  actualMarketPerformanceClaimed: false,
});

export const STEP237B_OBSERVATION_POLICY = deepFreeze({
  minimumAnnualizedPeriods: 12,
  minimumSharpePeriods: 12,
  minimumCalmarPeriods: 12,
  unavailableValueImputationAllowed: false,
});

const COST_SCENARIOS = deepFreeze([
  { scenario: "zero_cost", costMultiplier: 0 },
  { scenario: "base_synthetic_cost", costMultiplier: 1 },
  { scenario: "elevated_synthetic_cost", costMultiplier: 3 },
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
  /real account return/i,
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

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Step237B ${label} must be finite`);
  }
}

function assertAssumptions(assumptions) {
  if (!sameKeys(assumptions, ASSUMPTION_KEYS)) {
    throw new TypeError("Step237B assumption key set mismatch");
  }
  if (
    assumptions.returnFrequency !== "monthly" ||
    assumptions.periodsPerYear !== 12 ||
    assumptions.riskFreeRate !== 0 ||
    assumptions.riskFreeRateMode !== "synthetic_zero_assumption" ||
    assumptions.actualMarketRiskFreeRateClaimed !== false ||
    assumptions.actualMarketPerformanceClaimed !== false
  ) {
    throw new TypeError("Step237B synthetic risk-free assumptions changed");
  }
}

function assertObservationPolicy(policy) {
  if (!sameKeys(policy, OBSERVATION_POLICY_KEYS)) {
    throw new TypeError("Step237B observation policy key set mismatch");
  }
  if (
    policy.minimumAnnualizedPeriods !== 12 ||
    policy.minimumSharpePeriods !== 12 ||
    policy.minimumCalmarPeriods !== 12 ||
    policy.unavailableValueImputationAllowed !== false
  ) {
    throw new TypeError("Step237B observation policy changed");
  }
}

function assertNoPerformanceClaim(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step237B prohibited performance claim detected: ${pattern}`);
    }
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
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step237B prohibited material detected: ${pattern}`);
    }
  }
}

function range(values) {
  const usable = values.filter((value) => value !== null && value !== undefined);
  if (usable.length < 2) return null;
  return round6(Math.max(...usable) - Math.min(...usable));
}

function metricSourceToRiskAdjustedMetrics(scope, sourceMetrics, assumptions, policy) {
  for (const key of [
    "totalPeriods",
    "exposedPeriods",
    "flatPeriods",
    "totalTurnover",
    "grossTotalReturn",
    "netMaximumDrawdown",
    "netVolatility",
    "annualizedReturn",
    "costImpactOnTotalReturn",
    "positivePeriodRate",
    "negativePeriodRate",
    "averagePositivePeriodReturn",
    "averageNegativePeriodReturn",
    "longestNegativeStreak",
    "recoveryPeriodCount",
  ]) {
    assertFiniteNumber(sourceMetrics[key], `${scope} ${key}`);
  }
  const periods = sourceMetrics.totalPeriods;
  assertFiniteNumber(periods, `${scope} totalPeriods`);
  const annualizedAvailable = periods >= policy.minimumAnnualizedPeriods;
  const netAnnualizedReturn = annualizedAvailable ? sourceMetrics.annualizedReturn : null;
  const annualizedVolatility = annualizedAvailable
    ? round6(sourceMetrics.netVolatility * Math.sqrt(assumptions.periodsPerYear))
    : null;
  const sharpeRatio = (
    periods >= policy.minimumSharpePeriods &&
    annualizedVolatility !== null &&
    annualizedVolatility !== 0 &&
    netAnnualizedReturn !== null
  )
    ? round6((netAnnualizedReturn - assumptions.riskFreeRate) / annualizedVolatility)
    : null;
  const calmarRatio = (
    periods >= policy.minimumCalmarPeriods &&
    sourceMetrics.netMaximumDrawdown !== 0 &&
    netAnnualizedReturn !== null
  )
    ? round6(netAnnualizedReturn / Math.abs(sourceMetrics.netMaximumDrawdown))
    : null;
  const costToGrossReturnRatio = sourceMetrics.grossTotalReturn === 0
    ? null
    : round6(Math.abs(sourceMetrics.costImpactOnTotalReturn) / Math.abs(sourceMetrics.grossTotalReturn));
  const metric = {
    scope,
    netAnnualizedReturn,
    netMaximumDrawdown: round6(sourceMetrics.netMaximumDrawdown),
    netVolatility: round6(sourceMetrics.netVolatility),
    sharpeRatio,
    calmarRatio,
    positivePeriodRate: round6(sourceMetrics.positivePeriodRate),
    negativePeriodRate: round6(sourceMetrics.negativePeriodRate),
    averagePositivePeriodReturn: round6(sourceMetrics.averagePositivePeriodReturn),
    averageNegativePeriodReturn: round6(sourceMetrics.averageNegativePeriodReturn),
    longestNegativeStreak: sourceMetrics.longestNegativeStreak,
    recoveryPeriodCount: sourceMetrics.recoveryPeriodCount,
    exposureRate: periods === 0 ? null : round6(sourceMetrics.exposedPeriods / periods),
    turnoverRate: periods === 0 ? null : round6(sourceMetrics.totalTurnover / periods),
    costToGrossReturnRatio,
    availablePeriodCount: periods,
  };
  validateMetric(metric);
  return metric;
}

export function calculateStep237BRiskAdjustedMetric(scope, sourceMetrics, options = {}) {
  const assumptions = clonePlain(options.assumptions ?? STEP237B_RISK_ADJUSTED_ASSUMPTIONS);
  const policy = clonePlain(options.observationPolicy ?? STEP237B_OBSERVATION_POLICY);
  assertAssumptions(assumptions);
  assertObservationPolicy(policy);
  return deepFreeze(metricSourceToRiskAdjustedMetrics(scope, clonePlain(sourceMetrics), assumptions, policy));
}

function foldMetricsFromValidationReport(validationReport, assumptions, policy) {
  const base = validationReport.aggregateMetrics;
  const totalFolds = validationReport.foldCounts.total;
  const netRange = validationReport.foldStability.netReturnRange;
  const turnoverRange = validationReport.foldStability.turnoverRange;
  const costRange = validationReport.foldStability.costImpactRange;
  const offsets = totalFolds === 3 ? [-0.5, 0, 0.5] : Array.from({ length: totalFolds }, (_, index) => index - ((totalFolds - 1) / 2));
  return offsets.map((offset, index) => {
    const sourceMetrics = {
      ...base,
      totalPeriods: Math.round(base.totalPeriods / totalFolds),
      exposedPeriods: Math.round(base.exposedPeriods / totalFolds),
      flatPeriods: Math.round(base.flatPeriods / totalFolds),
      totalTurnover: round6((base.totalTurnover / totalFolds) + (turnoverRange * offset)),
      costImpactOnTotalReturn: round6(base.costImpactOnTotalReturn + (costRange * offset)),
      grossTotalReturn: round6(base.grossTotalReturn + (netRange * offset)),
      netTotalReturn: round6(base.netTotalReturn + (netRange * offset)),
      annualizedReturn: round6(base.annualizedReturn + (netRange * offset)),
    };
    return metricSourceToRiskAdjustedMetrics(`fold_${index + 1}`, sourceMetrics, assumptions, policy);
  });
}

function regimeMetricsFromValidationReport(validationReport, assumptions, policy) {
  return clonePlain(validationReport.regimeResults)
    .sort((left, right) => REGIME_ORDER.indexOf(left.regime) - REGIME_ORDER.indexOf(right.regime))
    .map((result) => metricSourceToRiskAdjustedMetrics(result.regime, result.metrics, assumptions, policy));
}

function stabilityRangesFrom(metrics, validationReport) {
  return {
    annualizedReturnRange: range(metrics.map((item) => item.netAnnualizedReturn)),
    sharpeRange: range(metrics.map((item) => item.sharpeRatio)),
    calmarRange: range(metrics.map((item) => item.calmarRatio)),
    maximumDrawdownRange: validationReport.foldStability.maximumDrawdownRange,
    turnoverRange: validationReport.foldStability.turnoverRange,
    exposureRateRange: range(metrics.map((item) => item.exposureRate)),
    costImpactRange: validationReport.foldStability.costImpactRange,
  };
}

function buildCostSensitivity(validationReport, overrides = {}) {
  const source = validationReport.aggregateMetrics;
  const scenarios = clonePlain(overrides.costScenarios ?? COST_SCENARIOS);
  const rows = scenarios.map((scenario) => {
    assertFiniteNumber(scenario.costMultiplier, "cost multiplier");
    if (!["zero_cost", "base_synthetic_cost", "elevated_synthetic_cost"].includes(scenario.scenario)) {
      throw new TypeError("Step237B unknown cost scenario");
    }
    const costImpact = round6(source.costImpactOnTotalReturn * scenario.costMultiplier);
    return {
      scenario: scenario.scenario,
      costMultiplier: scenario.costMultiplier,
      sameExposureAndReturnSource: true,
      netTotalReturn: round6(source.grossTotalReturn - costImpact),
      costImpactOnTotalReturn: costImpact,
    };
  }).sort((left, right) => COST_SCENARIOS.findIndex((item) => item.scenario === left.scenario) -
    COST_SCENARIOS.findIndex((item) => item.scenario === right.scenario));
  validateCostSensitivity(rows);
  return rows;
}

function buildChecks(validationReport, costSensitivity, performanceClaimDetected) {
  const zero = costSensitivity.find((item) => item.scenario === "zero_cost");
  const base = costSensitivity.find((item) => item.scenario === "base_synthetic_cost");
  const elevated = costSensitivity.find((item) => item.scenario === "elevated_synthetic_cost");
  const costMonotonicityViolationDetected = !(
    zero.netTotalReturn >= base.netTotalReturn &&
    base.netTotalReturn >= elevated.netTotalReturn
  );
  return {
    futureLeakageDetected: validationReport.checks.futureLeakageDetected === true,
    samePeriodExecutionDetected: validationReport.checks.samePeriodExecutionDetected === true,
    nonFiniteValueDetected: validationReport.checks.nonFiniteValueDetected === true,
    costMonotonicityViolationDetected,
    performanceClaimDetected,
  };
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

function overallStatusFrom(validationReport, aggregateMetrics, foldMetrics, regimeMetrics, stabilityRanges, checks) {
  if (Object.values(checks).some(Boolean) || validationReport.overallStatus === "blocked") return "blocked";
  if (validationReport.overallStatus === "unstable") return "unstable";
  if (regimeMetrics.some((metric) => metric.sharpeRatio === null || metric.calmarRatio === null)) return "review_required";
  if (foldMetrics.some((metric) => metric.sharpeRatio === null || metric.calmarRatio === null)) return "review_required";
  if (aggregateMetrics.sharpeRatio === null || aggregateMetrics.calmarRatio === null) return "review_required";
  if (stabilityRanges.sharpeRange === null || stabilityRanges.calmarRange === null) return "review_required";
  if (validationReport.overallStatus === "review_required") return "review_required";
  return "stable_for_further_offline_research";
}

export function buildStep237BRiskAdjustedValidationReport(input = {}) {
  const source = clonePlain(input);
  assertNoProhibitedMaterial(source.publicSummaryProbe ?? {});
  let performanceClaimDetected = false;
  try {
    assertNoPerformanceClaim(source);
  } catch (error) {
    if (source.blockOnPerformanceClaim === false) {
      performanceClaimDetected = true;
    } else {
      throw error;
    }
  }
  const assumptions = clonePlain(source.assumptions ?? STEP237B_RISK_ADJUSTED_ASSUMPTIONS);
  const observationPolicy = clonePlain(source.observationPolicy ?? STEP237B_OBSERVATION_POLICY);
  assertAssumptions(assumptions);
  assertObservationPolicy(observationPolicy);
  const validationReport = clonePlain(source.validationReport ?? buildStep237AWalkForwardRegimeValidationReport());
  validateStep237AWalkForwardRegimeValidationReport(validationReport);
  const aggregateMetrics = metricSourceToRiskAdjustedMetrics(
    "aggregate",
    validationReport.aggregateMetrics,
    assumptions,
    observationPolicy,
  );
  const foldMetrics = foldMetricsFromValidationReport(validationReport, assumptions, observationPolicy);
  const regimeMetrics = regimeMetricsFromValidationReport(validationReport, assumptions, observationPolicy);
  const stabilityRanges = stabilityRangesFrom([...foldMetrics, ...regimeMetrics], validationReport);
  const costSensitivity = buildCostSensitivity(validationReport, source);
  const checks = buildChecks(validationReport, costSensitivity, performanceClaimDetected);
  const report = {
    schemaVersion: STEP237B_RISK_ADJUSTED_SCHEMA_VERSION,
    metricMode: STEP237B_RISK_ADJUSTED_MODE,
    assumptions,
    observationPolicy,
    aggregateMetrics,
    foldMetrics,
    regimeMetrics,
    stabilityRanges,
    costSensitivity,
    checks,
    overallStatus: overallStatusFrom(validationReport, aggregateMetrics, foldMetrics, regimeMetrics, stabilityRanges, checks),
    usage: buildUsage(),
    readiness: buildReadiness(),
  };
  validateStep237BRiskAdjustedValidationReport(report);
  assertNoStep237BPublicSensitiveMaterial(report);
  return deepFreeze(report);
}

export function formatStep237BRiskAdjustedValidationReport(
  report = buildStep237BRiskAdjustedValidationReport(),
) {
  const lines = [
    "FINPLE RISK-ADJUSTED OFFLINE VALIDATION",
    "",
    "Synthetic offline calculation",
    "Risk-free rate uses synthetic zero assumption",
    "Actual market results are unknown",
    "Additional validation required",
    `Overall status: ${report.overallStatus}`,
    `Risk-free rate: ${report.assumptions.riskFreeRate}`,
    `Periods per year: ${report.assumptions.periodsPerYear}`,
    `Aggregate Sharpe: ${report.aggregateMetrics.sharpeRatio ?? "unavailable"}`,
    `Aggregate Calmar: ${report.aggregateMetrics.calmarRatio ?? "unavailable"}`,
    `Fold metrics: ${report.foldMetrics.length}`,
    `Regime metrics: ${report.regimeMetrics.length}`,
    `Cost scenarios: ${report.costSensitivity.length}`,
    `Performance claim allowed: ${report.usage.performanceClaimAllowed ? "Yes" : "No"}`,
    `Paper trading allowed: ${report.usage.paperTradingAllowed ? "Yes" : "No"}`,
    `Shadow trading allowed: ${report.usage.shadowTradingAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  const text = `${lines.join("\n")}\n`;
  assertNoPerformanceClaim(text);
  assertNoStep237BPublicSensitiveMaterial(text);
  return text;
}

function validateMetric(metric) {
  if (!sameKeys(metric, METRIC_KEYS)) throw new TypeError("Step237B metric key set mismatch");
  if (typeof metric.scope !== "string" || metric.scope.length === 0) throw new TypeError("Step237B metric scope missing");
  for (const key of METRIC_KEYS.filter((item) => item !== "scope")) {
    const value = metric[key];
    if (value !== null) assertFiniteNumber(value, key);
  }
  if (metric.availablePeriodCount < STEP237B_OBSERVATION_POLICY.minimumAnnualizedPeriods && metric.netAnnualizedReturn !== null) {
    throw new TypeError("Step237B annualized metric must be unavailable below minimum periods");
  }
  if (metric.availablePeriodCount < STEP237B_OBSERVATION_POLICY.minimumSharpePeriods && metric.sharpeRatio !== null) {
    throw new TypeError("Step237B Sharpe must be unavailable below minimum periods");
  }
  if (metric.availablePeriodCount < STEP237B_OBSERVATION_POLICY.minimumCalmarPeriods && metric.calmarRatio !== null) {
    throw new TypeError("Step237B Calmar must be unavailable below minimum periods");
  }
  if (metric.netVolatility === 0 && metric.sharpeRatio !== null) {
    throw new TypeError("Step237B Sharpe must be unavailable when volatility is zero");
  }
  if (metric.netMaximumDrawdown === 0 && metric.calmarRatio !== null) {
    throw new TypeError("Step237B Calmar must be unavailable when maximum drawdown is zero");
  }
}

function validateCostSensitivity(rows) {
  if (!Array.isArray(rows) || rows.length !== 3) throw new TypeError("Step237B cost scenario count mismatch");
  for (const row of rows) {
    if (!sameKeys(row, COST_SENSITIVITY_KEYS)) throw new TypeError("Step237B cost scenario key set mismatch");
    if (row.sameExposureAndReturnSource !== true) throw new TypeError("Step237B cost scenario source changed");
    assertFiniteNumber(row.costMultiplier, "cost multiplier");
    assertFiniteNumber(row.netTotalReturn, "cost scenario net result");
    assertFiniteNumber(row.costImpactOnTotalReturn, "cost scenario impact");
  }
}

export function validateStep237BRiskAdjustedValidationReport(report) {
  if (!sameKeys(report, TOP_LEVEL_KEYS)) throw new TypeError("Step237B top-level key set mismatch");
  assertAssumptions(report.assumptions);
  assertObservationPolicy(report.observationPolicy);
  validateMetric(report.aggregateMetrics);
  if (!Array.isArray(report.foldMetrics) || report.foldMetrics.length !== 3) throw new TypeError("Step237B fold metric count mismatch");
  if (!Array.isArray(report.regimeMetrics) || report.regimeMetrics.length !== REGIME_ORDER.length) {
    throw new TypeError("Step237B regime metric count mismatch");
  }
  for (const metric of [...report.foldMetrics, ...report.regimeMetrics]) validateMetric(metric);
  if (!sameKeys(report.stabilityRanges, STABILITY_RANGE_KEYS)) throw new TypeError("Step237B stability range key set mismatch");
  for (const value of Object.values(report.stabilityRanges)) {
    if (value !== null) assertFiniteNumber(value, "stability range");
  }
  validateCostSensitivity(report.costSensitivity);
  if (!sameKeys(report.checks, CHECK_KEYS)) throw new TypeError("Step237B check key set mismatch");
  if (!sameKeys(report.usage, USAGE_KEYS)) throw new TypeError("Step237B usage key set mismatch");
  if (!sameKeys(report.readiness, READINESS_KEYS)) throw new TypeError("Step237B readiness key set mismatch");
  if (!STATUS_ORDER.includes(report.overallStatus)) throw new TypeError("Step237B unknown status");
  if (report.usage.researchOnly !== true) throw new TypeError("Step237B researchOnly must be true");
  for (const key of USAGE_KEYS.filter((item) => item !== "researchOnly")) {
    if (report.usage[key] !== false) throw new TypeError(`Step237B usage opened: ${key}`);
  }
  if (report.readiness.actualLiveTradingReady !== false || report.readiness.state !== "blocked") {
    throw new TypeError("Step237B readiness opened");
  }
  const zero = report.costSensitivity.find((item) => item.scenario === "zero_cost");
  const base = report.costSensitivity.find((item) => item.scenario === "base_synthetic_cost");
  const elevated = report.costSensitivity.find((item) => item.scenario === "elevated_synthetic_cost");
  if (!(zero.netTotalReturn >= base.netTotalReturn && base.netTotalReturn >= elevated.netTotalReturn)) {
    throw new TypeError("Step237B cost monotonicity violation");
  }
  if (Object.values(report.checks).some(Boolean) && report.overallStatus !== "blocked") {
    throw new TypeError("Step237B true check must block status");
  }
}

export function assertNoStep237BPublicSensitiveMaterial(value) {
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
      throw new TypeError(`Step237B public report leaked prohibited material: ${pattern}`);
    }
  }
  assertNoPerformanceClaim(serialized);
}

export const STEP237B_RISK_ADJUSTED_VALIDATION_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  assumptionKeys: ASSUMPTION_KEYS,
  observationPolicyKeys: OBSERVATION_POLICY_KEYS,
  metricKeys: METRIC_KEYS,
  stabilityRangeKeys: STABILITY_RANGE_KEYS,
  costSensitivityKeys: COST_SENSITIVITY_KEYS,
  checkKeys: CHECK_KEYS,
  usageKeys: USAGE_KEYS,
  readinessKeys: READINESS_KEYS,
  schemaVersion: STEP237B_RISK_ADJUSTED_SCHEMA_VERSION,
  metricMode: STEP237B_RISK_ADJUSTED_MODE,
  version: STEP237B_RISK_ADJUSTED_VERSION,
  assumptions: STEP237B_RISK_ADJUSTED_ASSUMPTIONS,
  observationPolicy: STEP237B_OBSERVATION_POLICY,
  redactedPublicReport: true,
  syntheticOnly: true,
});
