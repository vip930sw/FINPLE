import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  MONTHLY_BASELINE_ENGINE_VERSION,
  annualPercentToMonthlyRate,
  buildMonthlyBaselineProjection,
  buildStep2MonthlyBaselineComparison,
  buildStep3MonthlyBaselineDetail,
} from "./monthlyBaselineEngine.js";
import {
  createComparisonPortfolios,
  createInsightComparisonPortfolios,
  createRankedComparisonPortfolios,
  getChartComparisonPortfolios,
} from "./portfolioCalculations.js";

const BASE_SETTINGS = Object.freeze({
  startValue: 1200,
  monthlyCashFlow: 0,
  years: 1,
  inflationRate: 0,
  dividendReinvest: false,
});

function asset(overrides = {}) {
  return {
    ticker: "AAA",
    market: "US",
    targetWeight: 100,
    cagr: 12,
    dividendYield: 0,
    beta: 1.5,
    mdd: -50,
    dataStatus: "ready",
    metricsStatus: "ready",
    reviewFlag: "none",
    overlayStatus: "app_ready",
    productionPublishReady: true,
    appExportApproved: true,
    metricBaseDate: "2026-06-30",
    metricsSource: "fixture_app_ready",
    sourceHash: "fixture-source-hash",
    calculationPolicyVersion: "monthly-baseline-fixture-v1-step114-2e",
    ...overrides,
  };
}

function assertClose(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} is not close to ${expected}`);
}

test("annual CAGR and inflation use monthly compounding, not annual / 12", () => {
  const monthly = annualPercentToMonthlyRate(12);
  assert.notEqual(monthly, 0.12 / 12);
  assertClose((1 + monthly) ** 12 - 1, 0.12);
});

test("one asset positive 12-month price baseline compounds to annual CAGR", () => {
  const result = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ cagr: 12 })],
  });
  assert.equal(result.status, "ready");
  assert.equal(result.baselineEngineVersion, MONTHLY_BASELINE_ENGINE_VERSION);
  assert.equal(result.monthlyBaselinePoints.length, 13);
  assertClose(result.futureValue, 1344);
  assertClose(result.monthlyBaselinePoints[0].portfolioValueNominal, 1200);
  assertClose(result.monthlyBaselinePoints[12].contributionExcludedIndex, 112);
});

test("zero and negative CAGR fixtures are handled deterministically", () => {
  const zero = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ cagr: 0 })],
  });
  assertClose(zero.futureValue, 1200);
  assertClose(zero.summary.contributionExcludedIndex, 100);

  const negative = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ cagr: -12 })],
  });
  assertClose(negative.futureValue, 1056);
  assertClose(negative.summary.contributionExcludedIndex, 88);
});

test("month-start contribution is separated from contribution-excluded performance", () => {
  const result = buildMonthlyBaselineProjection({
    settings: {
      ...BASE_SETTINGS,
      startValue: 1000,
      monthlyCashFlow: 100,
      investmentMonths: 1,
    },
    assets: [asset({ cagr: 12 })],
  });
  const monthlyRate = annualPercentToMonthlyRate(12);
  assertClose(result.futureValue, 1100 * (1 + monthlyRate));
  assertClose(result.summary.cumulativeContributions, 1100);
  assertClose(result.summary.contributionExcludedIndex, 100 * (1 + monthlyRate));
});

test("two-asset weighted baseline uses target weights and keeps beta/MDD out of returns", () => {
  const conservativeRisk = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      asset({ ticker: "AAA", targetWeight: 60, cagr: 12, beta: 0.1, mdd: -5 }),
      asset({ ticker: "BBB", targetWeight: 40, cagr: 0, beta: 0.2, mdd: -10 }),
    ],
  });
  const highRiskSameReturns = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      asset({ ticker: "AAA", targetWeight: 60, cagr: 12, beta: 5, mdd: -95 }),
      asset({ ticker: "BBB", targetWeight: 40, cagr: 0, beta: 8, mdd: -99 }),
    ],
  });
  assert.equal(conservativeRisk.status, "ready");
  assertClose(conservativeRisk.expectedCagr, 7.2);
  assertClose(conservativeRisk.futureValue, highRiskSameReturns.futureValue);
  assert.notEqual(conservativeRisk.simpleMdd, highRiskSameReturns.simpleMdd);
  assert.notEqual(conservativeRisk.expectedBeta, highRiskSameReturns.expectedBeta);
});

test("inflation annual rate is converted with the same monthly compounding policy", () => {
  const result = buildMonthlyBaselineProjection({
    settings: {
      ...BASE_SETTINGS,
      startValue: 1120,
      inflationRate: 12,
    },
    assets: [asset({ cagr: 0 })],
  });
  assertClose(result.futureValue, 1120);
  assertClose(result.inflationAdjustedFutureValue, 1000);
});

test("dividend reinvestment is separate from price CAGR and can be disabled", () => {
  const reinvested = buildMonthlyBaselineProjection({
    settings: {
      ...BASE_SETTINGS,
      dividendReinvest: true,
    },
    assets: [asset({ cagr: 0, dividendYield: 12 })],
  });
  const cashFlowOnly = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ cagr: 0, dividendYield: 12 })],
  });
  assertClose(reinvested.futureValue, 1344);
  assertClose(cashFlowOnly.futureValue, 1200);
  assertClose(cashFlowOnly.cumulativeDividendResult, 1200 * annualPercentToMonthlyRate(12) * 12);
  assertClose(reinvested.cumulativePriceGainResult, 0);
  assertClose(cashFlowOnly.cumulativePriceGainResult, 0);
  assertClose(reinvested.performanceRows[0].annualProfit, 0);
  assertClose(reinvested.performanceRows[0].cumulativeProfit, 0);
  assertClose(reinvested.performanceRows[0].annualDividend, reinvested.cumulativeDividendResult);
});

test("missing dividend is not inferred as zero", () => {
  const blocked = buildMonthlyBaselineProjection({
    settings: {
      ...BASE_SETTINGS,
      dividendReinvest: true,
    },
    assets: [asset({ dividendYield: null })],
  });
  assert.equal(blocked.status, "blocked");
  assert.match(blocked.blockReasons.join("|"), /missing_dividend_yield_for_reinvestment/);

  const priceOnly = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ dividendYield: null })],
  });
  assert.equal(priceOnly.status, "ready");
  assert.equal(priceOnly.expectedDividendYield, null);
  assert.equal(priceOnly.expectedAnnualDividend, null);
});

test("blocked and review-only metric sources fail closed", () => {
  for (const blockedAsset of [
    asset({ ticker: "BAD1", dataStatus: "review_required" }),
    asset({ ticker: "BAD2", metricsStatus: "review_only" }),
    asset({ ticker: "BAD3", reviewFlag: "review_required" }),
    asset({ ticker: "BAD4", productionPublishReady: false }),
    asset({ ticker: "BAD5", appExportApproved: false }),
    asset({ ticker: "BAD6", productionPublishReady: "false" }),
    asset({ ticker: "BAD7", appExportApproved: 0 }),
    asset({ ticker: "BAD8", dataStatus: "stale" }),
    asset({ ticker: "BAD9", dataStatus: "limited_history" }),
    asset({ ticker: "BAD10", metricsStatus: "error" }),
    asset({ ticker: "BAD11", reviewFlag: "missing" }),
    asset({ ticker: "BAD12", dataStatus: "" }),
  ]) {
    const result = buildMonthlyBaselineProjection({
      settings: BASE_SETTINGS,
      assets: [blockedAsset],
    });
    assert.equal(result.status, "blocked", blockedAsset.ticker);
  }
});

test("approved metric lineage is required and unknown CAGR fallback is blocked", () => {
  const missingMetadata = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      {
        ticker: "NOPE",
        market: "US",
        targetWeight: 100,
        cagr: 12,
        dividendYield: 0,
      },
    ],
  });
  assert.equal(missingMetadata.status, "blocked");
  assert.match(missingMetadata.blockReasons.join("|"), /missing_metric_status|missing_metric_lineage/);
  assert.equal(missingMetadata.expectedCagr, null);
  assert.equal(missingMetadata.futureValue, null);

  const missingPolicy = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [asset({ calculationPolicyVersion: "" })],
  });
  assert.equal(missingPolicy.status, "blocked");
  assert.match(missingPolicy.blockReasons.join("|"), /missing_metric_lineage|unsupported_calculation_policy_version/);
});

test("legacy May app-ready source is accepted only through compatibility adapter", () => {
  const result = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      {
        ticker: "SPY",
        market: "US",
        targetWeight: 100,
        cagr: 7,
        dividendYield: 1,
        metricsSource: "us_price_metrics_overlay_20260528_app_ready",
      },
    ],
  });
  assert.equal(result.status, "ready");
  assert.equal(
    result.assets[0].metricLineage.calculationPolicyVersion,
    "legacy-may-app-ready-compat-v1-step114-2e",
  );
  assert.equal(result.assets[0].metricLineage.metricBaseDate, "2026-05-28");
  assert.match(result.assets[0].metricLineage.sourceHash, /^[0-9a-f]{64}$/);
});

test("KR leading-zero tickers are preserved in normalized baseline assets", () => {
  const result = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      asset({ ticker: "005930", market: "KR", targetWeight: 50, cagr: 5, dividendYield: 1 }),
      asset({ ticker: "069500", market: "KR", targetWeight: 50, cagr: 4, dividendYield: 1 }),
    ],
  });
  assert.deepEqual(result.assets.map((item) => item.ticker), ["005930", "069500"]);
});

test("contributionExcludedIndex follows actual no-rebalance sleeve drift", () => {
  const result = buildMonthlyBaselineProjection({
    settings: {
      ...BASE_SETTINGS,
      investmentMonths: 3,
    },
    assets: [
      asset({ ticker: "AAA", targetWeight: 60, cagr: 12, dividendYield: 0 }),
      asset({ ticker: "BBB", targetWeight: 40, cagr: 0, dividendYield: 0 }),
    ],
  });
  const monthlyRate = annualPercentToMonthlyRate(12);
  let sleeveA = 1200 * 0.6;
  let sleeveB = 1200 * 0.4;
  let expectedIndex = 100;
  for (let month = 1; month <= 3; month += 1) {
    const denominator = sleeveA + sleeveB;
    const priceGain = sleeveA * monthlyRate;
    expectedIndex *= 1 + priceGain / denominator;
    sleeveA += priceGain;
  }
  const fixedWeightIndex = 100 * (1 + 0.6 * monthlyRate) ** 3;
  assertClose(result.summary.contributionExcludedIndex, expectedIndex);
  assert.notEqual(result.summary.contributionExcludedIndex.toFixed(10), fixedWeightIndex.toFixed(10));
  assertClose(sleeveA + sleeveB, result.futureValue);
});

test("invalid inputs return blocked result instead of throwing", () => {
  for (const input of [
    { settings: { ...BASE_SETTINGS, investmentMonths: -1 }, assets: [asset()] },
    { settings: { ...BASE_SETTINGS, inflationRate: -100 }, assets: [asset()] },
    { settings: BASE_SETTINGS, assets: [asset({ cagr: -100 })] },
    { settings: BASE_SETTINGS, assets: [asset({ dividendYield: -1 })] },
    { settings: BASE_SETTINGS, assets: [asset({ targetWeight: -10 })] },
    { settings: BASE_SETTINGS, assets: [asset({ targetWeight: "bad" })] },
    { settings: BASE_SETTINGS, assets: null },
  ]) {
    assert.doesNotThrow(() => buildMonthlyBaselineProjection(input));
    assert.equal(buildMonthlyBaselineProjection(input).status, "blocked");
  }
});

test("stable ordering is independent from input portfolio and asset order", () => {
  const assetsA = [
    asset({ ticker: "BBB", market: "US", targetWeight: 40, cagr: 4, dividendYield: 0 }),
    asset({ ticker: "005930", market: "KR", targetWeight: 60, cagr: 6, dividendYield: 1 }),
  ];
  const assetsB = [assetsA[1], assetsA[0]];
  const resultA = buildMonthlyBaselineProjection({ settings: BASE_SETTINGS, assets: assetsA });
  const resultB = buildMonthlyBaselineProjection({ settings: BASE_SETTINGS, assets: assetsB });
  assert.deepEqual(resultA, resultB);
  assert.deepEqual(resultA.assets.map((item) => `${item.market}:${item.ticker}`), ["KR:005930", "US:BBB"]);

  const portfolios = [
    { id: "z", assets: [asset({ ticker: "ZZZ" })] },
    { id: "a", assets: [asset({ ticker: "AAA" })] },
  ];
  const comparison = buildStep2MonthlyBaselineComparison({ portfolios, settings: BASE_SETTINGS });
  assert.deepEqual(comparison.map((portfolio) => portfolio.id), ["a", "z"]);
});

test("Step 2 comparison and Step 3 detail consume the same monthly baseline object", () => {
  const portfolio = {
    id: "p1",
    name: "fixture",
    assets: [asset({ ticker: "AAA", cagr: 8, dividendYield: 2 })],
  };
  const step2 = buildStep2MonthlyBaselineComparison({
    portfolios: [portfolio],
    activePortfolioId: "p1",
    assets: portfolio.assets,
    settings: BASE_SETTINGS,
  })[0].result;
  const step3 = buildStep3MonthlyBaselineDetail({
    portfolio,
    settings: BASE_SETTINGS,
  });
  assert.deepEqual(step2, step3);
});

test("blocked portfolio is excluded from ranks, charts, and insight comparison", () => {
  const portfolios = [
    { id: "ready", name: "ready", assets: [asset({ ticker: "AAA" })] },
    {
      id: "blocked",
      name: "blocked",
      assets: [asset({ ticker: "BAD", dataStatus: "review_required" })],
    },
  ];
  const comparison = createComparisonPortfolios(portfolios, "", [], BASE_SETTINGS);
  const ranked = createRankedComparisonPortfolios(comparison);
  const withInsight = createInsightComparisonPortfolios(ranked);
  const ready = withInsight.find((portfolio) => portfolio.id === "ready");
  const blocked = withInsight.find((portfolio) => portfolio.id === "blocked");
  assert.equal(ready.realValueRank, 1);
  assert.equal(blocked.realValueRank, "-");
  assert.equal(blocked.growthRank, "-");
  assert.equal(blocked.result.expectedCagr, null);
  assert.equal(blocked.insight.type, "Baseline blocked");
  assert.deepEqual(getChartComparisonPortfolios(withInsight).map((portfolio) => portfolio.id), ["ready"]);
});

test("review overlay is not connected to the production loader pointer", () => {
  const loader = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loader, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loader, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.doesNotMatch(loader, /step114-2d-review-overlay|finple_review_overlay_/);
});
