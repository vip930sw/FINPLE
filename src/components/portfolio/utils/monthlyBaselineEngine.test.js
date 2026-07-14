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
    reviewFlag: "none",
    metricsSource: "fixture_app_ready",
    sourceHash: "fixture-source-hash",
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
  ]) {
    const result = buildMonthlyBaselineProjection({
      settings: BASE_SETTINGS,
      assets: [blockedAsset],
    });
    assert.equal(result.status, "blocked", blockedAsset.ticker);
  }
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

test("review overlay is not connected to the production loader pointer", () => {
  const loader = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loader, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loader, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.doesNotMatch(loader, /step114-2d-review-overlay|finple_review_overlay_/);
});
