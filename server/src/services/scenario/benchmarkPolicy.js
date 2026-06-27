import { normalizeTargetWeights } from "./portfolioRiskMetrics.js";

export const BENCHMARK_POLICY_VERSION = "scenario-benchmark-policy-v0.1";
export const DOMINANT_MARKET_THRESHOLD = 0.8;

export const BENCHMARK_DEFINITIONS = Object.freeze({
  SP500_TR: Object.freeze({
    id: "SP500_TR",
    label: "S&P 500 Total Return",
    market: "US",
    fallbackIds: Object.freeze(["SPY"]),
  }),
  KOSPI200_TR: Object.freeze({
    id: "KOSPI200_TR",
    label: "KOSPI 200 Total Return",
    market: "KR",
    fallbackIds: Object.freeze(["069500", "102110", "148020", "105190", "152100", "278530"]),
  }),
});

export const KR_KOSPI200_REPRESENTATIVE_TICKERS = Object.freeze([
  "069500",
  "102110",
  "148020",
  "105190",
  "152100",
  "278530",
]);

const KR_KOSPI200_REPRESENTATIVES = new Set(KR_KOSPI200_REPRESENTATIVE_TICKERS);

function normalizeTicker(value, label = "ticker") {
  const ticker = String(value || "").trim().toUpperCase();
  if (!ticker) {
    throw new TypeError(`${label} must not be empty`);
  }
  return ticker;
}

function normalizeMarket(value, label = "market") {
  const market = String(value || "").trim().toUpperCase();
  if (market !== "US" && market !== "KR") {
    throw new TypeError(`${label} must be US or KR`);
  }
  return market;
}

function normalizeWeight(value, label) {
  const weight = Number(value);
  if (!Number.isFinite(weight)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  if (weight < 0) {
    throw new RangeError(`${label} must be non-negative`);
  }
  return weight;
}

function resolveHoldingWeight(holding, index) {
  return normalizeWeight(
    holding.weight ?? holding.allocation ?? holding.targetWeight,
    `holdings[${index}].weight`,
  );
}

function normalizeHoldings(holdings) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    throw new TypeError("holdings must be a non-empty array");
  }

  const normalized = holdings.map((holding, index) => ({
    ticker: normalizeTicker(holding.ticker, `holdings[${index}].ticker`),
    market: normalizeMarket(holding.market, `holdings[${index}].market`),
    weight: resolveHoldingWeight(holding, index),
  }));

  const rawTotal = normalized.reduce((sum, holding) => sum + holding.weight, 0);
  const divisor = rawTotal > 1.5 && rawTotal <= 100.000001 ? 100 : 1;
  const total = rawTotal / divisor;
  if (Math.abs(total - 1) > 0.000001) {
    throw new RangeError(`holdings weights must sum to 1 or 100, got ${rawTotal}`);
  }

  return normalized.map((holding) => ({ ...holding, weight: holding.weight / divisor }));
}

function getAssetMarketWeights(assets, targetWeights) {
  if (!Array.isArray(assets) || assets.length === 0) {
    throw new TypeError("assets must be a non-empty array");
  }

  const weightMap = normalizeTargetWeights(targetWeights);
  const marketWeights = { US: 0, KR: 0 };
  for (const [index, asset] of assets.entries()) {
    const ticker = normalizeTicker(asset.ticker, `assets[${index}].ticker`);
    const market = normalizeMarket(asset.market, `assets[${index}].market`);
    const weight = weightMap.get(ticker);
    if (weight === undefined) {
      throw new TypeError(`targetWeights is missing ${ticker}`);
    }
    marketWeights[market] += weight;
  }
  return marketWeights;
}

function dominantBenchmarkForMarketWeights(marketWeights, threshold = DOMINANT_MARKET_THRESHOLD) {
  if (marketWeights.US >= threshold) {
    return {
      benchmarkId: "SP500_TR",
      benchmarkType: "single",
      components: [{ benchmarkId: "SP500_TR", weight: 1 }],
    };
  }

  if (marketWeights.KR >= threshold) {
    return {
      benchmarkId: "KOSPI200_TR",
      benchmarkType: "single",
      components: [{ benchmarkId: "KOSPI200_TR", weight: 1 }],
    };
  }

  return {
    benchmarkId: "COMPOSITE_US_KR",
    benchmarkType: "composite",
    components: [
      { benchmarkId: "SP500_TR", weight: marketWeights.US },
      { benchmarkId: "KOSPI200_TR", weight: marketWeights.KR },
    ].filter((component) => component.weight > 0),
  };
}

export function selectPortfolioBenchmark({ holdings, assets, targetWeights, threshold = DOMINANT_MARKET_THRESHOLD }) {
  let marketWeights;
  if (holdings) {
    marketWeights = normalizeHoldings(holdings).reduce(
      (weights, holding) => {
        weights[holding.market] += holding.weight;
        return weights;
      },
      { US: 0, KR: 0 },
    );
  } else {
    marketWeights = getAssetMarketWeights(assets, targetWeights);
  }

  const selection = dominantBenchmarkForMarketWeights(marketWeights, threshold);
  return {
    policyVersion: BENCHMARK_POLICY_VERSION,
    dominantMarketThreshold: threshold,
    marketWeights,
    ...selection,
  };
}

export function classifyAssetBenchmarkPolicy(row) {
  const ticker = normalizeTicker(row.ticker);
  const market = normalizeMarket(row.market);
  const actualBenchmarkId = String(row.benchmarkId || "").trim().toUpperCase();

  if (market === "US") {
    return {
      policyVersion: BENCHMARK_POLICY_VERSION,
      ticker,
      market,
      expectedBenchmarkId: "SP500_TR",
      acceptedFallbackIds: [...BENCHMARK_DEFINITIONS.SP500_TR.fallbackIds],
      actualBenchmarkId,
      status: actualBenchmarkId === "SP500_TR" || actualBenchmarkId === "SPY"
        ? "proxy_refetch_required"
        : "benchmark_mismatch",
      reasonCode: actualBenchmarkId === "SP500_TR" || actualBenchmarkId === "SPY"
        ? "sp500_total_return_series_not_committed"
        : "us_asset_benchmark_should_use_sp500_policy",
    };
  }

  if (KR_KOSPI200_REPRESENTATIVES.has(ticker)) {
    const acceptedFallbackIds = [...BENCHMARK_DEFINITIONS.KOSPI200_TR.fallbackIds];
    const usesKospi200Policy =
      actualBenchmarkId === "KOSPI200_TR" || acceptedFallbackIds.includes(actualBenchmarkId);
    return {
      policyVersion: BENCHMARK_POLICY_VERSION,
      ticker,
      market,
      expectedBenchmarkId: "KOSPI200_TR",
      acceptedFallbackIds,
      actualBenchmarkId,
      status: usesKospi200Policy
        ? "proxy_refetch_required"
        : "blocked_policy_benchmark_should_be_kospi200",
      reasonCode: usesKospi200Policy
        ? "kospi200_total_return_series_not_committed"
        : "kr_kospi200_etf_must_not_use_kospi_or_kosdaq_beta",
    };
  }

  return {
    policyVersion: BENCHMARK_POLICY_VERSION,
    ticker,
    market,
    expectedBenchmarkId: "KOSPI_OR_KOSDAQ_POLICY_REVIEW",
    acceptedFallbackIds: [],
    actualBenchmarkId,
    status: "manual_review_required",
    reasonCode: "kr_non_representative_asset_benchmark_policy_not_finalized",
  };
}

export function evaluateBenchmarkInputReadiness({ benchmarkSelection, benchmarkMonthlyReturns }) {
  if (!benchmarkSelection || !Array.isArray(benchmarkSelection.components)) {
    throw new TypeError("benchmarkSelection.components must be an array");
  }
  if (!benchmarkMonthlyReturns || typeof benchmarkMonthlyReturns !== "object") {
    throw new TypeError("benchmarkMonthlyReturns must be an object keyed by benchmark id");
  }

  const missingBenchmarkIds = benchmarkSelection.components
    .map((component) => component.benchmarkId)
    .filter((benchmarkId) => !Array.isArray(benchmarkMonthlyReturns[benchmarkId]));

  return {
    policyVersion: BENCHMARK_POLICY_VERSION,
    benchmarkId: benchmarkSelection.benchmarkId,
    ready: missingBenchmarkIds.length === 0,
    missingBenchmarkIds,
    status: missingBenchmarkIds.length === 0
      ? "ready"
      : "blocked_missing_benchmark_monthly_returns",
  };
}
