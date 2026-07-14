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
    pipelineVersion: "monthly-baseline-fixture-pipeline-v1-step114-2e",
    ...overrides,
  };
}

function legacyMayLoaderAsset(overrides = {}) {
  const market = overrides.market || "US";
  const ticker = overrides.ticker || "GSST";
  const isKr = market === "KR";
  const marker = isKr ? "kr_price_metrics_overlay_20260528_app_ready" : "us_price_metrics_overlay_20260528_app_ready";
  const metricMode = isKr ? "kr_price_metrics_overlay_price_close" : "us_price_metrics_overlay_price_close";
  const providerMetricsSource = isKr ? "yfinance_kr_close_price_20260528" : "yfinance_close_price_20260528";
  return {
    ticker,
    market,
    targetWeight: 100,
    cagr: 7,
    dividendYield: 1,
    beta: 1,
    mdd: -20,
    metricsSource: providerMetricsSource,
    metricMode,
    dataSource: `finple_app_candidates_6000_balanced_v1+final_2000_overlay+${marker}`,
    legacyMayAppReadyEligibility: true,
    legacyMayAppReadyEligibilityKey: `${market}:${ticker}`,
    legacyMayAppReadyMetricMode: metricMode,
    legacyMayAppReadySourceName: marker,
    legacyMayAppReadyProviderMetricsSource: providerMetricsSource,
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
  assertClose(cashFlowOnly.expectedAnnualDividend, cashFlowOnly.cumulativeDividendResult);
  assertClose(cashFlowOnly.summary.endingValuePlusExternalDividends, 1200 + cashFlowOnly.cumulativeDividendResult);
  assertClose(reinvested.summary.endingValuePlusExternalDividends, reinvested.futureValue);
  assertClose(reinvested.summary.totalReturnContributionExcludedIndex, cashFlowOnly.summary.totalReturnContributionExcludedIndex);
  assertClose(cashFlowOnly.summary.priceOnlyContributionExcludedIndex, 100);
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

test("legacy May app-ready compatibility requires real loader-shaped eligibility evidence", () => {
  const sourceOnlySpoof = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      {
        ticker: "FAKE",
        market: "US",
        targetWeight: 100,
        cagr: 7,
        dividendYield: 1,
        metricsSource: "yfinance_close_price_20260528",
      },
    ],
  });
  assert.equal(sourceOnlySpoof.status, "blocked");
  assert.match(sourceOnlySpoof.blockReasons.join("|"), /missing_metric_status|missing_metric_lineage/);

  const evidenceOnly = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      {
        ticker: "FAKE",
        market: "US",
        targetWeight: 100,
        cagr: 7,
        dividendYield: 1,
        metricsSource: "yfinance_close_price_20260528",
        legacyAppReadyEvidence: true,
      },
    ],
  });
  assert.equal(evidenceOnly.status, "blocked");

  const arbitraryCombo = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      {
        ...legacyMayLoaderAsset({ ticker: "FAKE" }),
        legacyMayAppReadyEligibilityKey: "US:GSST",
      },
    ],
  });
  assert.equal(arbitraryCombo.status, "blocked");

  const us = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [legacyMayLoaderAsset({ ticker: "GSST", market: "US" })],
  });
  assert.equal(us.status, "ready");
  assert.equal(
    us.assets[0].metricLineage.compatibilityAdapter,
    "legacy-may-app-ready-compat-v1-step114-2e",
  );
  assert.equal(us.assets[0].metricLineage.metricsSource, "yfinance_close_price_20260528");
  assert.equal(us.assets[0].metricLineage.pipelineVersion, "legacy-may-app-ready-loader-v1");
  assert.equal(us.assets[0].metricLineage.metricBaseDate, "2026-05-28");
  assert.match(us.assets[0].metricLineage.sourceHash, /^[0-9a-f]{64}$/);

  const kr = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [legacyMayLoaderAsset({ ticker: "069500", market: "KR", cagr: 18.43 })],
  });
  assert.equal(kr.status, "ready");
  assert.equal(kr.assets[0].ticker, "069500");
  assert.equal(kr.assets[0].metricLineage.metricsSource, "yfinance_kr_close_price_20260528");
});

test("KR leading-zero tickers are preserved in normalized baseline assets", () => {
  const result = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      legacyMayLoaderAsset({ ticker: "005930", market: "KR", targetWeight: 50, cagr: 28.23 }),
      legacyMayLoaderAsset({ ticker: "069500", market: "KR", targetWeight: 50, cagr: 18.43 }),
    ],
  });
  assert.deepEqual(result.assets.map((item) => item.ticker), ["005930", "069500"]);
});

test("total-return contribution index is independent from dividend reinvest setting", () => {
  const dividendAsset = asset({ ticker: "DIV", targetWeight: 50, cagr: 0, dividendYield: 12 });
  const noDividendAsset = asset({ ticker: "NODIV", targetWeight: 50, cagr: 0, dividendYield: 0 });
  const reinvested = buildMonthlyBaselineProjection({
    settings: { ...BASE_SETTINGS, dividendReinvest: true },
    assets: [dividendAsset, noDividendAsset],
  });
  const externalCash = buildMonthlyBaselineProjection({
    settings: { ...BASE_SETTINGS, dividendReinvest: false },
    assets: [dividendAsset, noDividendAsset],
  });

  assert.equal(reinvested.status, "ready");
  assert.equal(externalCash.status, "ready");
  assertClose(
    reinvested.summary.totalReturnContributionExcludedIndex,
    externalCash.summary.totalReturnContributionExcludedIndex,
  );
  assertClose(reinvested.summary.contributionExcludedIndex, reinvested.summary.totalReturnContributionExcludedIndex);
  assertClose(externalCash.summary.contributionExcludedIndex, externalCash.summary.totalReturnContributionExcludedIndex);
  assert.notEqual(reinvested.futureValue, externalCash.futureValue);
  assertClose(
    externalCash.summary.endingValuePlusExternalDividends,
    externalCash.futureValue + externalCash.cumulativeExternalDividendResult,
  );
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
    { settings: { ...BASE_SETTINGS, investmentMonths: 1.5 }, assets: [asset()] },
    { settings: { ...BASE_SETTINGS, investmentMonths: Number.NaN }, assets: [asset()] },
    { settings: { ...BASE_SETTINGS, investmentMonths: Number.POSITIVE_INFINITY }, assets: [asset()] },
    { settings: { ...BASE_SETTINGS, startValue: -1 }, assets: [asset()] },
    { settings: { ...BASE_SETTINGS, startValue: "bad" }, assets: [asset()] },
    { settings: null, assets: [asset()] },
    { settings: BASE_SETTINGS, assets: [null] },
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

  const stringFalse = buildMonthlyBaselineProjection({
    settings: { ...BASE_SETTINGS, dividendReinvest: "false" },
    assets: [asset({ dividendYield: null })],
  });
  assert.equal(stringFalse.status, "ready");
  assert.equal(stringFalse.settings.dividendReinvest, false);
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
    {
      id: "m",
      assets: [
        asset({ ticker: "BBB", market: "US", targetWeight: 40, cagr: 4, dividendYield: 0 }),
        asset({ ticker: "005930", market: "KR", targetWeight: 60, cagr: 6, dividendYield: 1 }),
      ],
    },
    { id: "a", assets: [asset({ ticker: "AAA" })] },
  ];
  const comparison = buildStep2MonthlyBaselineComparison({ portfolios, settings: BASE_SETTINGS });
  assert.deepEqual(comparison.map((portfolio) => portfolio.id), ["a", "m", "z"]);

  const reversedComparison = buildStep2MonthlyBaselineComparison({
    portfolios: [...portfolios].reverse().map((portfolio) => ({
      ...portfolio,
      assets: [...portfolio.assets].reverse(),
    })),
    settings: BASE_SETTINGS,
  });
  assert.equal(JSON.stringify(comparison), JSON.stringify(reversedComparison));
  assert.deepEqual(comparison[0].assets.map((item) => item.ticker), ["AAA"]);
  assert.deepEqual(comparison[1].assets.map((item) => `${item.market}:${item.ticker}`), ["KR:005930", "US:BBB"]);
});

test("duplicate portfolio IDs and duplicate market/ticker assets fail closed", () => {
  const duplicatePortfolios = buildStep2MonthlyBaselineComparison({
    portfolios: [
      { id: "dup", assets: [asset({ ticker: "AAA" })] },
      { id: "dup", assets: [asset({ ticker: "BBB" })] },
    ],
    settings: BASE_SETTINGS,
  });
  assert.equal(duplicatePortfolios[0].result.status, "blocked");
  assert.match(duplicatePortfolios[0].result.blockReasons.join("|"), /duplicate_portfolio_id:dup/);

  const duplicateAsset = buildMonthlyBaselineProjection({
    settings: BASE_SETTINGS,
    assets: [
      asset({ ticker: "AAA", market: "US", targetWeight: 50 }),
      asset({ ticker: "AAA", market: "US", targetWeight: 50 }),
    ],
  });
  assert.equal(duplicateAsset.status, "blocked");
  assert.match(duplicateAsset.blockReasons.join("|"), /duplicate_asset_identity:US:AAA/);
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
  assert.equal(blocked.insight.type, "기준 계산 보류");
  assert.deepEqual(getChartComparisonPortfolios(withInsight).map((portfolio) => portfolio.id), ["ready"]);
});

test("ready portfolios with missing dividend and risk metrics keep unknown ranks", () => {
  const portfolios = [
    { id: "ready", name: "ready", assets: [asset({ ticker: "AAA", dividendYield: 1, mdd: -10, beta: 1 })] },
    {
      id: "missing",
      name: "missing",
      assets: [asset({ ticker: "BBB", dividendYield: null, mdd: null, beta: null })],
    },
  ];
  const comparison = createComparisonPortfolios(portfolios, "", [], BASE_SETTINGS);
  const ranked = createRankedComparisonPortfolios(comparison);
  const missing = ranked.find((portfolio) => portfolio.id === "missing");
  assert.equal(missing.result.status, "ready");
  assert.equal(missing.result.expectedDividendYield, null);
  assert.equal(missing.result.simpleMdd, null);
  assert.equal(missing.dividendRank, "-");
  assert.equal(missing.stabilityRank, "-");

  const comparePanelSource = fs.readFileSync("src/components/portfolio/components/ComparePanel.jsx", "utf8");
  assert.match(comparePanelSource, /return "미확인"/);
  assert.match(comparePanelSource, /예시\\s\*포트폴리오|예시/);
});

test("review overlay is not connected to the production loader pointer", () => {
  const loader = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loader, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loader, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.doesNotMatch(loader, /step114-2d-review-overlay|finple_review_overlay_/);
});
