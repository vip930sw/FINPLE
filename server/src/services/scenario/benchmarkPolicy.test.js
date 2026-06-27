import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyAssetBenchmarkPolicy,
  evaluateBenchmarkInputReadiness,
  selectPortfolioBenchmark,
} from "./benchmarkPolicy.js";

test("selects S&P 500 TR for US-dominant portfolios", () => {
  const selection = selectPortfolioBenchmark({
    holdings: [
      { ticker: "SPY", market: "US", weight: 80 },
      { ticker: "069500", market: "KR", weight: 20 },
    ],
  });

  assert.equal(selection.benchmarkId, "SP500_TR");
  assert.equal(selection.benchmarkType, "single");
  assert.deepEqual(selection.components, [{ benchmarkId: "SP500_TR", weight: 1 }]);
  assert.equal(selection.marketWeights.US, 0.8);
});

test("selects KOSPI 200 TR for KR-dominant portfolios", () => {
  const selection = selectPortfolioBenchmark({
    holdings: [
      { ticker: "SPY", market: "US", weight: 0.1 },
      { ticker: "069500", market: "KR", weight: 0.9 },
    ],
  });

  assert.equal(selection.benchmarkId, "KOSPI200_TR");
  assert.equal(selection.benchmarkType, "single");
  assert.deepEqual(selection.components, [{ benchmarkId: "KOSPI200_TR", weight: 1 }]);
});

test("selects weighted composite benchmark for mixed US/KR portfolios", () => {
  const selection = selectPortfolioBenchmark({
    assets: [
      { ticker: "SPY", market: "US" },
      { ticker: "069500", market: "KR" },
    ],
    targetWeights: { SPY: 0.55, "069500": 0.45 },
  });

  assert.equal(selection.benchmarkId, "COMPOSITE_US_KR");
  assert.equal(selection.benchmarkType, "composite");
  assert.deepEqual(selection.components, [
    { benchmarkId: "SP500_TR", weight: 0.55 },
    { benchmarkId: "KOSPI200_TR", weight: 0.45 },
  ]);
});

test("flags KR representative ETF beta when the overlay uses KOSPI instead of KOSPI 200", () => {
  const result = classifyAssetBenchmarkPolicy({
    ticker: "069500",
    market: "KR",
    benchmarkId: "^KS11",
  });

  assert.equal(result.expectedBenchmarkId, "KOSPI200_TR");
  assert.equal(result.status, "blocked_policy_benchmark_should_be_kospi200");
  assert.equal(result.reasonCode, "kr_kospi200_etf_must_not_use_kospi_or_kosdaq_beta");
});

test("allows US SPY fallback only as a refetch-required proxy", () => {
  const result = classifyAssetBenchmarkPolicy({
    ticker: "VOO",
    market: "US",
    benchmarkId: "SPY",
  });

  assert.equal(result.expectedBenchmarkId, "SP500_TR");
  assert.equal(result.status, "proxy_refetch_required");
  assert.equal(result.reasonCode, "sp500_total_return_series_not_committed");
});

test("blocks benchmark scenario inputs when monthly benchmark returns are missing", () => {
  const selection = selectPortfolioBenchmark({
    holdings: [
      { ticker: "SPY", market: "US", weight: 0.6 },
      { ticker: "069500", market: "KR", weight: 0.4 },
    ],
  });
  const readiness = evaluateBenchmarkInputReadiness({
    benchmarkSelection: selection,
    benchmarkMonthlyReturns: {
      SP500_TR: [{ month: "2025-01-31", return: 0.02 }],
    },
  });

  assert.equal(readiness.ready, false);
  assert.equal(readiness.status, "blocked_missing_benchmark_monthly_returns");
  assert.deepEqual(readiness.missingBenchmarkIds, ["KOSPI200_TR"]);
});

test("accepts benchmark inputs only when every selected component has monthly returns", () => {
  const selection = selectPortfolioBenchmark({
    holdings: [
      { ticker: "SPY", market: "US", weight: 0.6 },
      { ticker: "069500", market: "KR", weight: 0.4 },
    ],
  });
  const readiness = evaluateBenchmarkInputReadiness({
    benchmarkSelection: selection,
    benchmarkMonthlyReturns: {
      SP500_TR: [{ month: "2025-01-31", return: 0.02 }],
      KOSPI200_TR: [{ month: "2025-01-31", return: -0.01 }],
    },
  });

  assert.equal(readiness.ready, true);
  assert.equal(readiness.status, "ready");
  assert.deepEqual(readiness.missingBenchmarkIds, []);
});
