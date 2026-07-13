import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP236C_OFFLINE_BACKTEST_CONTRACT,
  assertNoStep236CBacktestPublicSensitiveMaterial,
  buildStep236COfflineBacktestLedger,
  buildStep236COfflineBacktestReport,
  formatStep236COfflineBacktestReport,
  validateStep236COfflineBacktestLedger,
  validateStep236COfflineBacktestReport,
} from "./tradingAiMlOfflineBacktest.js";
import {
  buildStep236BResearchPositionTransitionLedger,
} from "./tradingAiMlResearchPositionPolicy.js";
import {
  buildStep236ARulesBasedTradingEligibilityReport,
} from "./tradingAiMlRulesBasedTradingEligibility.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function transitionDecisions() {
  return [
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-01-31T00:00:00.000Z" },
    { decisionStatus: "hold", decisionTimestamp: "2024-02-29T00:00:00.000Z" },
    { decisionStatus: "risk_off", decisionTimestamp: "2024-03-31T00:00:00.000Z" },
    { decisionStatus: "hold", decisionTimestamp: "2024-04-30T00:00:00.000Z" },
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-05-31T00:00:00.000Z" },
    { decisionStatus: "blocked_by_data_quality", decisionTimestamp: "2024-06-30T00:00:00.000Z" },
    { decisionStatus: "insufficient_history", decisionTimestamp: "2024-07-31T00:00:00.000Z" },
    { decisionStatus: "risk_off", decisionTimestamp: "2024-08-31T00:00:00.000Z" },
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-09-30T00:00:00.000Z" },
  ];
}

function transitionLedger() {
  return buildStep236BResearchPositionTransitionLedger({ eligibilityDecisions: transitionDecisions() });
}

function transitionReturns() {
  return [
    { sequence: 1, effectiveFrom: "2024-02-29T00:00:00.000Z", researchPeriodReturn: 0.02 },
    { sequence: 2, effectiveFrom: "2024-03-31T00:00:00.000Z", researchPeriodReturn: -0.01 },
    { sequence: 3, effectiveFrom: "2024-04-30T00:00:00.000Z", researchPeriodReturn: 0.03 },
    { sequence: 4, effectiveFrom: "2024-05-31T00:00:00.000Z", researchPeriodReturn: 0.01 },
    { sequence: 5, effectiveFrom: "2024-06-30T00:00:00.000Z", researchPeriodReturn: -0.02 },
    { sequence: 6, effectiveFrom: "2024-07-31T00:00:00.000Z", researchPeriodReturn: 0.015 },
    { sequence: 7, effectiveFrom: "2024-08-31T00:00:00.000Z", researchPeriodReturn: 0.005 },
    { sequence: 8, effectiveFrom: "2024-09-30T00:00:00.000Z", researchPeriodReturn: 0.01 },
  ];
}

function costZero() {
  return { commissionBps: 0, slippageBps: 0, taxBps: 0 };
}

test("Step236C report exposes exact public schema and fail-closed usage", () => {
  const report = buildStep236COfflineBacktestReport();

  assert.deepEqual(Object.keys(report), STEP236C_OFFLINE_BACKTEST_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.recordCounts), STEP236C_OFFLINE_BACKTEST_CONTRACT.recordCountKeys);
  assert.deepEqual(Object.keys(report.turnover), STEP236C_OFFLINE_BACKTEST_CONTRACT.turnoverKeys);
  assert.deepEqual(Object.keys(report.costs), STEP236C_OFFLINE_BACKTEST_CONTRACT.costKeys);
  assert.deepEqual(Object.keys(report.performance), STEP236C_OFFLINE_BACKTEST_CONTRACT.performanceKeys);
  assert.deepEqual(Object.keys(report.baselines), STEP236C_OFFLINE_BACKTEST_CONTRACT.baselineKeys);
  assert.deepEqual(Object.keys(report.checks), STEP236C_OFFLINE_BACKTEST_CONTRACT.checkKeys);
  assert.deepEqual(Object.keys(report.usage), STEP236C_OFFLINE_BACKTEST_CONTRACT.usageKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP236C_OFFLINE_BACKTEST_CONTRACT.readinessKeys);
  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.backtestMode, "offline_synthetic_cost_aware_pilot");
  assert.deepEqual(report.usage, {
    researchOnly: true,
    performanceClaimAllowed: false,
    modelTrainingAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  });
  assert.deepEqual(report.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
});

test("Step236C default Step236B all-flat exposure produces zero strategy returns and costs", () => {
  const eligibility = buildStep236ARulesBasedTradingEligibilityReport();
  const report = buildStep236COfflineBacktestReport();

  assert.equal(report.recordCounts.totalPeriods, eligibility.recordCounts.total - 1);
  assert.equal(report.recordCounts.exposedPeriods, 0);
  assert.equal(report.recordCounts.flatPeriods, report.recordCounts.totalPeriods);
  assert.equal(report.turnover.totalTurnover, 0);
  assert.equal(report.costs.totalCostRate, 0);
  assert.equal(report.performance.grossTotalReturn, 0);
  assert.equal(report.performance.netTotalReturn, 0);
  assert.equal(report.performance.grossVolatility, 0);
  assert.equal(report.performance.netVolatility, 0);
});

test("Step236C applies exposure only to aligned future research return periods", () => {
  const ledger = buildStep236COfflineBacktestLedger({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: costZero(),
  });

  assert.deepEqual(Object.keys(ledger[0]), STEP236C_OFFLINE_BACKTEST_CONTRACT.ledgerKeys);
  assert.equal(ledger[0].effectiveExposure, 1);
  assert.equal(ledger[0].researchPeriodReturn, 0.02);
  assert.equal(ledger[0].grossPeriodReturn, 0.02);
  assert.equal(ledger[0].netPeriodReturn, 0.02);
  assert.equal(ledger[1].effectiveExposure, 1);
  assert.equal(ledger[1].grossPeriodReturn, -0.01);
  assert.equal(ledger[2].effectiveExposure, 0);
  assert.equal(ledger[2].grossPeriodReturn, 0);
  assert.equal(ledger.length, 8);
});

test("Step236C zero-cost gross and net calculations match exact compounding metrics", () => {
  const report = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: costZero(),
  });

  assert.deepEqual(report.recordCounts, {
    totalPeriods: 8,
    exposedPeriods: 3,
    flatPeriods: 5,
    transitionCount: 4,
  });
  assert.deepEqual(report.turnover, {
    totalTurnover: 4,
    averageTurnover: 0.5,
  });
  assert.deepEqual(report.costs, {
    totalCostRate: 0,
    costImpactOnTotalReturn: 0,
  });
  assert.deepEqual(report.performance, {
    grossTotalReturn: -0.010396,
    netTotalReturn: -0.010396,
    grossAnnualizedReturn: null,
    netAnnualizedReturn: null,
    grossMaximumDrawdown: -0.0298,
    netMaximumDrawdown: -0.0298,
    grossVolatility: 0.010533,
    netVolatility: 0.010533,
  });
});

test("Step236C positive costs reduce net return and capture cost impact", () => {
  const gross = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: costZero(),
  });
  const net = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: { commissionBps: 5, slippageBps: 5, taxBps: 0 },
  });

  assert.equal(net.costs.totalCostRate, 0.004);
  assert.equal(net.performance.netTotalReturn <= net.performance.grossTotalReturn, true);
  assert.equal(net.performance.netTotalReturn < gross.performance.netTotalReturn, true);
  assert.equal(net.costs.costImpactOnTotalReturn > 0, true);
});

test("Step236C always-flat and always-exposed baselines use the same deterministic fixture", () => {
  const report = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: costZero(),
  });

  assert.equal(report.baselines.alwaysFlat.performance.netTotalReturn, 0);
  assert.equal(report.baselines.alwaysFlat.recordCounts.exposedPeriods, 0);
  assert.equal(report.baselines.alwaysExposed.recordCounts.exposedPeriods, 8);
  assert.equal(report.baselines.alwaysExposed.performance.netTotalReturn, 0.060653);
});

test("Step236C annualized returns require at least twelve monthly periods", () => {
  const shortReport = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    costPolicy: costZero(),
  });
  const longReport = buildStep236COfflineBacktestReport({ costPolicy: costZero() });

  assert.equal(shortReport.performance.grossAnnualizedReturn, null);
  assert.notEqual(longReport.performance.grossAnnualizedReturn, null);
});

test("Step236C is deterministic canonical and input order independent", () => {
  const first = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
  });
  const second = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
  });
  const shuffled = buildStep236COfflineBacktestReport({
    positionLedger: clone(transitionLedger()).reverse(),
    returnFixture: clone(transitionReturns()).reverse(),
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first, shuffled);
});

test("Step236C label changes do not affect backtest because labels are not inputs", () => {
  const first = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
  });
  const second = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
    positionInput: { label: { forwardReturn1m: 0.99 } },
  });

  assert.deepEqual(second, first);
});

test("Step236C mutation resistance freezes input policy fixture and outputs", () => {
  const ledger = clone(transitionLedger());
  const returns = clone(transitionReturns());
  const costPolicy = { commissionBps: 5, slippageBps: 5, taxBps: 0 };
  const beforeLedger = JSON.stringify(ledger);
  const beforeReturns = JSON.stringify(returns);
  const beforeCostPolicy = JSON.stringify(costPolicy);
  const outputLedger = buildStep236COfflineBacktestLedger({ positionLedger: ledger, returnFixture: returns, costPolicy });
  const report = buildStep236COfflineBacktestReport({ positionLedger: ledger, returnFixture: returns, costPolicy });

  assert.equal(JSON.stringify(ledger), beforeLedger);
  assert.equal(JSON.stringify(returns), beforeReturns);
  assert.equal(JSON.stringify(costPolicy), beforeCostPolicy);
  assert.throws(() => {
    outputLedger[0].netEquity = 0;
  }, /Cannot assign/);
  assert.throws(() => {
    report.usage.liveTradingAllowed = true;
  }, /Cannot assign/);
});

test("Step236C public report and console text avoid sensitive material and performance claims", () => {
  const report = buildStep236COfflineBacktestReport({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
  });
  const text = formatStep236COfflineBacktestReport(report);

  assert.doesNotThrow(() => validateStep236COfflineBacktestReport(report));
  assert.doesNotThrow(() => assertNoStep236CBacktestPublicSensitiveMaterial(report));
  assert.doesNotThrow(() => assertNoStep236CBacktestPublicSensitiveMaterial(text));
  assert.equal(JSON.stringify(report).includes("researchPeriodReturn"), false);
  assert.match(text, /Synthetic research result/);
  assert.match(text, /Actual results are unknown/);
  assert.match(text, /Not investment judgment material/);
  assert.match(text, /Performance claim allowed: No/);
});

test("Step236C failure fixtures reject alignment exposure non-finite cost label and claim risks", () => {
  const ledger = clone(transitionLedger());
  const returns = clone(transitionReturns());

  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: returns.slice(1),
  }), /period count mismatch/);

  const samePeriod = clone(returns);
  samePeriod[0].effectiveFrom = ledger[0].decisionTimestamp;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: samePeriod,
  }), /same-period return application/);

  const highExposure = clone(ledger);
  highExposure[0].effectiveExposure = 1.5;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: highExposure,
    returnFixture: returns,
  }), /exposure above one|target exposure exceeds maximum/);

  const negativeExposure = clone(ledger);
  negativeExposure[0].effectiveExposure = -0.1;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: negativeExposure,
    returnFixture: returns,
  }), /negative exposure/);

  const nanReturn = clone(returns);
  nanReturn[0].researchPeriodReturn = Number.NaN;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: nanReturn,
  }), /researchPeriodReturn must be finite/);

  const wipedOut = clone(returns);
  wipedOut[0].researchPeriodReturn = -1;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: wipedOut,
    costPolicy: costZero(),
  }), /less than or equal to -100%/);

  assert.throws(() => buildStep236COfflineBacktestReport({
    costPolicy: { version: "9.9.9" },
  }), /unknown cost model version/);
  assert.throws(() => buildStep236COfflineBacktestReport({
    costPolicy: { commissionBps: -1 },
  }), /commissionBps cannot be negative/);
  assert.throws(() => buildStep236COfflineBacktestReport({
    costPolicy: { actualMarketCostClaimed: true },
  }), /actual market cost claim/);

  const labelReturn = clone(returns);
  labelReturn[0].forwardReturn1m = 0.99;
  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: labelReturn,
  }), /prohibited material|label return source/);

  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: returns,
    note: "guaranteed return",
  }), /prohibited performance claim/);

  assert.throws(() => buildStep236COfflineBacktestReport({
    positionLedger: ledger,
    returnFixture: returns,
    rawProviderPayload: { value: "secret token" },
  }), /prohibited material/);
});

test("Step236C ledger validator rejects malformed rows", () => {
  const ledger = clone(buildStep236COfflineBacktestLedger({
    positionLedger: transitionLedger(),
    returnFixture: transitionReturns(),
  }));
  delete ledger[0].netEquity;
  assert.throws(() => validateStep236COfflineBacktestLedger(ledger), /key set mismatch/);
});
