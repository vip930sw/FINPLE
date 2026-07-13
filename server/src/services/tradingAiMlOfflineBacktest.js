import {
  STEP236B_POSITION_POLICY_VERSION,
  buildStep236BResearchPositionTransitionLedger,
  validateStep236BTransitionLedger,
} from "./tradingAiMlResearchPositionPolicy.js";
import {
  buildStep236CCostModel,
  validateStep236CCostModel,
} from "./tradingAiMlBacktestCostPolicy.js";

export const STEP236C_OFFLINE_BACKTEST_SCHEMA_VERSION = "1.0.0";
export const STEP236C_OFFLINE_BACKTEST_MODE = "offline_synthetic_cost_aware_pilot";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "backtestMode",
  "positionPolicyVersion",
  "costModel",
  "recordCounts",
  "turnover",
  "costs",
  "performance",
  "baselines",
  "checks",
  "usage",
  "readiness",
]);

const RECORD_COUNT_KEYS = Object.freeze(["totalPeriods", "exposedPeriods", "flatPeriods", "transitionCount"]);
const TURNOVER_KEYS = Object.freeze(["totalTurnover", "averageTurnover"]);
const COST_KEYS = Object.freeze(["totalCostRate", "costImpactOnTotalReturn"]);
const PERFORMANCE_KEYS = Object.freeze([
  "grossTotalReturn",
  "netTotalReturn",
  "grossAnnualizedReturn",
  "netAnnualizedReturn",
  "grossMaximumDrawdown",
  "netMaximumDrawdown",
  "grossVolatility",
  "netVolatility",
]);
const BASELINE_KEYS = Object.freeze(["alwaysFlat", "alwaysExposed"]);
const CHECK_KEYS = Object.freeze([
  "samePeriodExecutionDetected",
  "exposureOutOfRangeDetected",
  "returnAlignmentErrorDetected",
  "labelUsedForDecisionDetected",
  "nonFiniteValueDetected",
]);
const USAGE_KEYS = Object.freeze([
  "researchOnly",
  "performanceClaimAllowed",
  "modelTrainingAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
]);
const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);
const LEDGER_KEYS = Object.freeze([
  "sequence",
  "effectiveExposure",
  "researchPeriodReturn",
  "turnover",
  "transactionCostRate",
  "grossPeriodReturn",
  "netPeriodReturn",
  "grossEquity",
  "netEquity",
]);

const SYNTHETIC_MONTHLY_RETURNS = Object.freeze([
  0.012, -0.006, 0.018, 0.004, -0.011, 0.015, 0.007, -0.009, 0.013,
  0.005, -0.004, 0.01, 0.016, -0.012, 0.006, 0.009, -0.007, 0.014,
  0.003, -0.01, 0.011, 0.008, -0.005, 0.012, 0.004, -0.006, 0.009,
]);

const PROHIBITED_CLAIM_PATTERNS = Object.freeze([
  /guaranteed return/i,
  /expected excess return/i,
  /safe strategy/i,
  /validated alpha/i,
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
  if (value === null) return null;
  return Number(value.toFixed(6));
}

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Step236C ${label} must be finite`);
  }
}

function timestampValue(value) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError("Step236C invalid timestamp");
  }
  return parsed;
}

function assertNoProhibitedInputMaterial(value, options = {}) {
  const serialized = JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
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
    ...(options.allowLabelMetadata ? [] : [/forwardReturn1m/i, /labelClass/i]),
    /broker/i,
    /orderId/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236C prohibited material detected: ${pattern}`);
    }
  }
}

function assertNoPerformanceClaim(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236C prohibited performance claim detected: ${pattern}`);
    }
  }
}

function appliedLedgerRows(ledger) {
  validateStep236BTransitionLedger(ledger);
  return ledger
    .filter((entry) => entry.applicationState === "applied_next_period")
    .sort((left, right) => left.sequence - right.sequence);
}

function defaultReturnFixture(appliedRows) {
  return appliedRows.map((row, index) => ({
    sequence: index + 1,
    effectiveFrom: row.effectiveFrom,
    researchPeriodReturn: SYNTHETIC_MONTHLY_RETURNS[index % SYNTHETIC_MONTHLY_RETURNS.length],
  }));
}

function normalizeReturnFixture(returnFixture, appliedRows) {
  const fixture = clonePlain(returnFixture ?? defaultReturnFixture(appliedRows))
    .sort((left, right) => Number(left.sequence ?? 0) - Number(right.sequence ?? 0));
  if (fixture.length !== appliedRows.length) {
    throw new TypeError("Step236C exposure and return period count mismatch");
  }
  return fixture.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new TypeError("Step236C return fixture row must be an object");
    }
    if ("forwardReturn1m" in row || "label" in row || "labelClass" in row) {
      throw new TypeError("Step236C label return source is not allowed");
    }
    assertFiniteNumber(row.researchPeriodReturn, "researchPeriodReturn");
    if (row.effectiveFrom !== appliedRows[index].effectiveFrom) {
      if (row.effectiveFrom === appliedRows[index].decisionTimestamp) {
        throw new TypeError("Step236C same-period return application is not allowed");
      }
      throw new TypeError("Step236C return alignment error");
    }
    if (timestampValue(row.effectiveFrom) <= timestampValue(appliedRows[index].decisionTimestamp)) {
      throw new TypeError("Step236C same-period execution detected");
    }
    return {
      sequence: index + 1,
      effectiveFrom: String(row.effectiveFrom),
      researchPeriodReturn: row.researchPeriodReturn,
    };
  });
}

function assertExposure(exposure) {
  assertFiniteNumber(exposure, "effectiveExposure");
  if (exposure < 0) throw new TypeError("Step236C negative exposure is not allowed");
  if (exposure > 1) throw new TypeError("Step236C exposure above one is not allowed");
}

function buildBacktestLedger(appliedRows, returns, costModel) {
  let grossEquity = 1;
  let netEquity = 1;
  const costBps = costModel.commissionBps + costModel.slippageBps + costModel.taxBps;
  const ledger = appliedRows.map((row, index) => {
    assertExposure(row.effectiveExposure);
    assertExposure(row.priorExposure);
    const researchPeriodReturn = returns[index].researchPeriodReturn;
    assertFiniteNumber(researchPeriodReturn, "researchPeriodReturn");
    const turnover = Math.abs(row.effectiveExposure - row.priorExposure);
    const transactionCostRate = turnover * costBps / 10000;
    const grossPeriodReturn = row.effectiveExposure * researchPeriodReturn;
    const netPeriodReturn = grossPeriodReturn - transactionCostRate;
    if (netPeriodReturn <= -1) {
      throw new TypeError("Step236C net period return cannot be less than or equal to -100%");
    }
    grossEquity *= (1 + grossPeriodReturn);
    netEquity *= (1 + netPeriodReturn);
    for (const value of [turnover, transactionCostRate, grossPeriodReturn, netPeriodReturn, grossEquity, netEquity]) {
      assertFiniteNumber(value, "computed value");
    }
    return {
      sequence: index + 1,
      effectiveExposure: row.effectiveExposure,
      researchPeriodReturn: round6(researchPeriodReturn),
      turnover: round6(turnover),
      transactionCostRate: round6(transactionCostRate),
      grossPeriodReturn: round6(grossPeriodReturn),
      netPeriodReturn: round6(netPeriodReturn),
      grossEquity: round6(grossEquity),
      netEquity: round6(netEquity),
    };
  });
  return ledger;
}

function equityDrawdown(values) {
  let peak = 1;
  let maxDrawdown = 0;
  for (const value of values) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, (value / peak) - 1);
  }
  return round6(maxDrawdown);
}

function volatility(returns) {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / returns.length;
  return round6(Math.sqrt(variance));
}

function annualizedReturn(totalReturn, periods) {
  if (periods < 12) return null;
  return round6(((1 + totalReturn) ** (12 / periods)) - 1);
}

function summarizeLedger(ledger) {
  const totalPeriods = ledger.length;
  const exposedPeriods = ledger.filter((row) => row.effectiveExposure === 1).length;
  const flatPeriods = ledger.filter((row) => row.effectiveExposure === 0).length;
  const transitionCount = ledger.filter((row) => row.turnover > 0).length;
  const totalTurnover = ledger.reduce((sum, row) => sum + row.turnover, 0);
  const totalCostRate = ledger.reduce((sum, row) => sum + row.transactionCostRate, 0);
  const grossEquities = ledger.map((row) => row.grossEquity);
  const netEquities = ledger.map((row) => row.netEquity);
  const grossPeriodReturns = ledger.map((row) => row.grossPeriodReturn);
  const netPeriodReturns = ledger.map((row) => row.netPeriodReturn);
  const grossTotalReturn = totalPeriods === 0 ? 0 : grossEquities[grossEquities.length - 1] - 1;
  const netTotalReturn = totalPeriods === 0 ? 0 : netEquities[netEquities.length - 1] - 1;
  return {
    recordCounts: {
      totalPeriods,
      exposedPeriods,
      flatPeriods,
      transitionCount,
    },
    turnover: {
      totalTurnover: round6(totalTurnover),
      averageTurnover: totalPeriods === 0 ? 0 : round6(totalTurnover / totalPeriods),
    },
    costs: {
      totalCostRate: round6(totalCostRate),
      costImpactOnTotalReturn: round6(grossTotalReturn - netTotalReturn),
    },
    performance: {
      grossTotalReturn: round6(grossTotalReturn),
      netTotalReturn: round6(netTotalReturn),
      grossAnnualizedReturn: annualizedReturn(grossTotalReturn, totalPeriods),
      netAnnualizedReturn: annualizedReturn(netTotalReturn, totalPeriods),
      grossMaximumDrawdown: equityDrawdown([1, ...grossEquities]),
      netMaximumDrawdown: equityDrawdown([1, ...netEquities]),
      grossVolatility: volatility(grossPeriodReturns),
      netVolatility: volatility(netPeriodReturns),
    },
  };
}

function buildBaseline(appliedRows, returns, costModel, exposure) {
  const rows = appliedRows.map((row) => ({
    ...row,
    priorExposure: exposure,
    effectiveExposure: exposure,
  }));
  return summarizeLedger(buildBacktestLedger(rows, returns, costModel));
}

function buildChecks() {
  return {
    samePeriodExecutionDetected: false,
    exposureOutOfRangeDetected: false,
    returnAlignmentErrorDetected: false,
    labelUsedForDecisionDetected: false,
    nonFiniteValueDetected: false,
  };
}

function buildUsage() {
  return {
    researchOnly: true,
    performanceClaimAllowed: false,
    modelTrainingAllowed: false,
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

export function buildStep236COfflineBacktestLedger(input = {}) {
  const source = clonePlain(input);
  assertNoProhibitedInputMaterial(source, { allowLabelMetadata: true });
  assertNoPerformanceClaim(source);
  const costModel = buildStep236CCostModel(source.costPolicy ?? source.costModel ?? {});
  const positionLedger = source.positionLedger ?? buildStep236BResearchPositionTransitionLedger(source.positionInput ?? {});
  const appliedRows = appliedLedgerRows(positionLedger);
  const returns = normalizeReturnFixture(source.returnFixture, appliedRows);
  const ledger = buildBacktestLedger(appliedRows, returns, costModel);
  validateStep236COfflineBacktestLedger(ledger);
  return deepFreeze(ledger);
}

export function buildStep236COfflineBacktestReport(input = {}) {
  const source = clonePlain(input);
  assertNoProhibitedInputMaterial(source, { allowLabelMetadata: true });
  assertNoPerformanceClaim(source);
  const costModel = buildStep236CCostModel(source.costPolicy ?? source.costModel ?? {});
  validateStep236CCostModel(costModel);
  const positionLedger = source.positionLedger ?? buildStep236BResearchPositionTransitionLedger(source.positionInput ?? {});
  const appliedRows = appliedLedgerRows(positionLedger);
  const returns = normalizeReturnFixture(source.returnFixture, appliedRows);
  const ledger = buildBacktestLedger(appliedRows, returns, costModel);
  const summary = summarizeLedger(ledger);
  const report = {
    schemaVersion: STEP236C_OFFLINE_BACKTEST_SCHEMA_VERSION,
    backtestMode: STEP236C_OFFLINE_BACKTEST_MODE,
    positionPolicyVersion: STEP236B_POSITION_POLICY_VERSION,
    costModel,
    recordCounts: summary.recordCounts,
    turnover: summary.turnover,
    costs: summary.costs,
    performance: summary.performance,
    baselines: {
      alwaysFlat: buildBaseline(appliedRows, returns, costModel, 0),
      alwaysExposed: buildBaseline(appliedRows, returns, costModel, 1),
    },
    checks: buildChecks(),
    usage: buildUsage(),
    readiness: buildReadiness(),
  };
  validateStep236COfflineBacktestReport(report);
  assertNoStep236CBacktestPublicSensitiveMaterial(report);
  return deepFreeze(report);
}

export function formatStep236COfflineBacktestReport(report = buildStep236COfflineBacktestReport()) {
  const lines = [
    "FINPLE OFFLINE COST-AWARE BACKTEST PILOT",
    "",
    "Synthetic research result",
    "Offline calculation result",
    "Deterministic fixture result",
    "Calculated under synthetic cost assumptions",
    "Actual results are unknown",
    "Not investment judgment material",
    `Periods: ${report.recordCounts.totalPeriods}`,
    `Exposed periods: ${report.recordCounts.exposedPeriods}`,
    `Flat periods: ${report.recordCounts.flatPeriods}`,
    `Transitions: ${report.recordCounts.transitionCount}`,
    `Total turnover: ${report.turnover.totalTurnover}`,
    `Total synthetic cost rate: ${report.costs.totalCostRate}`,
    `Gross total return: ${report.performance.grossTotalReturn}`,
    `Net total return: ${report.performance.netTotalReturn}`,
    `Gross maximum drawdown: ${report.performance.grossMaximumDrawdown}`,
    `Net maximum drawdown: ${report.performance.netMaximumDrawdown}`,
    `Gross volatility: ${report.performance.grossVolatility}`,
    `Net volatility: ${report.performance.netVolatility}`,
    `Performance claim allowed: ${report.usage.performanceClaimAllowed ? "Yes" : "No"}`,
    `Order submission allowed: ${report.usage.orderSubmissionAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  const text = `${lines.join("\n")}\n`;
  assertNoPerformanceClaim(text);
  return text;
}

export function validateStep236COfflineBacktestLedger(ledger) {
  if (!Array.isArray(ledger)) {
    throw new TypeError("Step236C backtest ledger must be an array");
  }
  for (const row of ledger) {
    if (!sameKeys(row, LEDGER_KEYS)) {
      throw new TypeError("Step236C backtest ledger key set mismatch");
    }
    assertExposure(row.effectiveExposure);
    for (const key of LEDGER_KEYS.filter((item) => item !== "sequence")) {
      assertFiniteNumber(row[key], key);
    }
    if (row.netPeriodReturn <= -1) {
      throw new TypeError("Step236C net period return cannot be less than or equal to -100%");
    }
  }
}

export function validateStep236COfflineBacktestReport(report) {
  if (!sameKeys(report, TOP_LEVEL_KEYS)) {
    throw new TypeError("Step236C report top-level key set mismatch");
  }
  validateStep236CCostModel(report.costModel);
  if (!sameKeys(report.recordCounts, RECORD_COUNT_KEYS)) {
    throw new TypeError("Step236C record count key set mismatch");
  }
  if (!sameKeys(report.turnover, TURNOVER_KEYS)) {
    throw new TypeError("Step236C turnover key set mismatch");
  }
  if (!sameKeys(report.costs, COST_KEYS)) {
    throw new TypeError("Step236C cost key set mismatch");
  }
  if (!sameKeys(report.performance, PERFORMANCE_KEYS)) {
    throw new TypeError("Step236C performance key set mismatch");
  }
  if (!sameKeys(report.baselines, BASELINE_KEYS)) {
    throw new TypeError("Step236C baseline key set mismatch");
  }
  if (!sameKeys(report.checks, CHECK_KEYS)) {
    throw new TypeError("Step236C check key set mismatch");
  }
  if (!sameKeys(report.usage, USAGE_KEYS)) {
    throw new TypeError("Step236C usage key set mismatch");
  }
  if (!sameKeys(report.readiness, READINESS_KEYS)) {
    throw new TypeError("Step236C readiness key set mismatch");
  }
  if (report.recordCounts.exposedPeriods + report.recordCounts.flatPeriods !== report.recordCounts.totalPeriods) {
    throw new TypeError("Step236C exposure period count mismatch");
  }
  if (report.usage.performanceClaimAllowed !== false || report.readiness.actualLiveTradingReady !== false) {
    throw new TypeError("Step236C usage or readiness opened");
  }
}

export function assertNoStep236CBacktestPublicSensitiveMaterial(value) {
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
    /2024-\d{2}-\d{2}T/i,
    /2025-\d{2}-\d{2}T/i,
    /broker/i,
    /orderId/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236C public report leaked prohibited material: ${pattern}`);
    }
  }
  assertNoPerformanceClaim(serialized);
}

export const STEP236C_OFFLINE_BACKTEST_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  turnoverKeys: TURNOVER_KEYS,
  costKeys: COST_KEYS,
  performanceKeys: PERFORMANCE_KEYS,
  baselineKeys: BASELINE_KEYS,
  checkKeys: CHECK_KEYS,
  usageKeys: USAGE_KEYS,
  readinessKeys: READINESS_KEYS,
  ledgerKeys: LEDGER_KEYS,
  schemaVersion: STEP236C_OFFLINE_BACKTEST_SCHEMA_VERSION,
  backtestMode: STEP236C_OFFLINE_BACKTEST_MODE,
  positionPolicyVersion: STEP236B_POSITION_POLICY_VERSION,
  redactedPublicReport: true,
  publicPerformanceClaimsAllowed: false,
});
