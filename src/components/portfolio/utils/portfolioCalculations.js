import {
  buildMonthlyBaselineProjection,
  buildStep2MonthlyBaselineComparison,
} from "./monthlyBaselineEngine.js";

function getAssetActualValue(asset = {}) {
  const quantity = Number(asset.quantity || 0);
  const price = Number(asset.price || 0);
  const value = quantity * price;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetPlannedValue(asset = {}) {
  const plannedValue = Number(asset.targetEvaluationAmount || 0);
  return Number.isFinite(plannedValue) && plannedValue > 0 ? plannedValue : 0;
}

function getAssetWeightValue(asset = {}) {
  return getAssetPlannedValue(asset) || getAssetActualValue(asset);
}

function isReadyPortfolio(portfolio = {}) {
  return portfolio?.result?.ready === true && portfolio?.result?.status === "ready";
}

function isFiniteMetricValue(value) {
  if (value === null || value === undefined || value === "") return false;
  return Number.isFinite(Number(value));
}

function toMetricNumber(value) {
  return isFiniteMetricValue(value) ? Number(value) : null;
}

export function calculatePortfolioResult(settings = {}, assets) {
  const safeSettings = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  const safeAssets = Array.isArray(assets) ? assets : [];
  const totalAssetValue = safeAssets.reduce((sum, asset) => sum + getAssetWeightValue(asset || {}), 0);
  const configuredStartValue = toMetricNumber(safeSettings.startValue);
  const simulationStartValue = configuredStartValue !== null && configuredStartValue > 0 ? configuredStartValue : totalAssetValue;
  const investmentMonths =
    safeSettings.investmentMonths !== undefined
      ? safeSettings.investmentMonths
      : Number(safeSettings.years || 0) * 12;

  return buildMonthlyBaselineProjection({
    settings: {
      ...safeSettings,
      startValue: safeSettings.startValue ?? simulationStartValue,
      investmentMonths,
    },
    assets: safeAssets,
  });
}

export function getRank(portfolios, targetId, selector, direction = "desc") {
  const targetPortfolio = portfolios.find((portfolio) => portfolio.id === targetId);
  if (!targetPortfolio || !isReadyPortfolio(targetPortfolio)) return "-";

  const targetValue = selector(targetPortfolio);
  if (!isFiniteMetricValue(targetValue)) return "-";
  const numericTargetValue = Number(targetValue);

  const betterCount = portfolios.filter((portfolio) => {
    if (!isReadyPortfolio(portfolio)) return false;
    const value = selector(portfolio);
    if (!isFiniteMetricValue(value)) return false;
    const numericValue = Number(value);
    return direction === "asc" ? numericValue < numericTargetValue : numericValue > numericTargetValue;
  }).length;

  return betterCount + 1;
}

export function getActivePortfolioById(portfolioList, activePortfolioId) {
  return portfolioList.find((portfolio) => portfolio.id === activePortfolioId) || portfolioList[0];
}

export function getDetailPortfolioById(rankedComparisonPortfolios, activePortfolioId) {
  return rankedComparisonPortfolios.find((portfolio) => portfolio.id === activePortfolioId) || rankedComparisonPortfolios[0];
}

export function createComparisonPortfolios(portfolioList, activePortfolioId, assets, settings) {
  return buildStep2MonthlyBaselineComparison({
    portfolios: portfolioList,
    activePortfolioId,
    assets,
    settings,
  });
}

export function createStep2BaselineComparison(portfolioList, activePortfolioId, assets, settings) {
  return createComparisonPortfolios(portfolioList, activePortfolioId, assets, settings);
}

export function createStep3BaselineDetail(settings, assets) {
  return calculatePortfolioResult(settings, assets);
}

export function createRankedComparisonPortfolios(comparisonPortfolios) {
  return comparisonPortfolios.map((portfolio) => ({
    ...portfolio,
    realValueRank: getRank(comparisonPortfolios, portfolio.id, (item) => item.result.inflationAdjustedFutureValue),
    growthRank: getRank(comparisonPortfolios, portfolio.id, (item) => item.result.expectedCagr),
    stabilityRank: getRank(comparisonPortfolios, portfolio.id, (item) => item.result.simpleMdd),
    dividendRank: getRank(comparisonPortfolios, portfolio.id, (item) => item.result.expectedDividendYield),
  }));
}

export function createInsightComparisonPortfolios(rankedComparisonPortfolios) {
  return rankedComparisonPortfolios.map((portfolio) => ({
    ...portfolio,
    insight: getPortfolioInsight(portfolio, rankedComparisonPortfolios),
  }));
}

export function getChartComparisonPortfolios(insightComparisonPortfolios) {
  return [...insightComparisonPortfolios]
    .filter(isReadyPortfolio)
    .sort((a, b) => Number(b.result.inflationAdjustedFutureValue) - Number(a.result.inflationAdjustedFutureValue))
    .filter((portfolio) => portfolio.realValueRank <= 3);
}

export function getPortfolioInsight(portfolio, allPortfolios) {
  const result = portfolio.result;
  if (!isReadyPortfolio(portfolio)) {
    return {
      type: "기준 계산 보류",
      text: "지표 출처 확인이 끝나야 이 포트폴리오를 순위와 차트에 포함할 수 있습니다.",
    };
  }

  const cagr = toMetricNumber(result.expectedCagr);
  const mdd = toMetricNumber(result.simpleMdd);
  const dividendYield = toMetricNumber(result.expectedDividendYield);
  const realValue = toMetricNumber(result.inflationAdjustedFutureValue) ?? 0;
  const readyPortfolios = allPortfolios.filter(isReadyPortfolio);
  const realValues = readyPortfolios
    .map((item) => toMetricNumber(item.result.inflationAdjustedFutureValue))
    .filter((value) => value !== null);
  const bestRealValue = realValues.length > 0 ? Math.max(...realValues) : 0;
  const realValueGapRate = bestRealValue > 0 ? ((bestRealValue - realValue) / bestRealValue) * 100 : 0;

  const cagrValues = readyPortfolios.map((item) => toMetricNumber(item.result.expectedCagr)).filter((value) => value !== null);
  const mddValues = readyPortfolios.map((item) => toMetricNumber(item.result.simpleMdd)).filter((value) => value !== null);
  const dividendValues = readyPortfolios
    .map((item) => toMetricNumber(item.result.expectedDividendYield))
    .filter((value) => value !== null);

  const maxCagr = cagrValues.length > 0 ? Math.max(...cagrValues) : null;
  const maxMdd = mddValues.length > 0 ? Math.max(...mddValues) : null;
  const maxDividend = dividendValues.length > 0 ? Math.max(...dividendValues) : null;

  const isRealValueSimilarToBest = realValueGapRate <= 5;
  const isCagrSimilar = maxCagr !== null && cagr !== null && Math.abs(maxCagr - cagr) <= 0.5;
  const isMddSimilar = maxMdd !== null && mdd !== null && Math.abs(maxMdd - mdd) <= 3;
  const isDividendSimilar = maxDividend !== null && dividendYield !== null && Math.abs(maxDividend - dividendYield) <= 0.3;

  let type = "균형형";
  let text = "";

  if (portfolio.realValueRank === 1) {
    type = "실질가치 우위";
    text = "물가를 반영한 장기 실질가치 기준으로 가장 앞선 포트폴리오입니다.";
  } else if (portfolio.growthRank === 1) {
    type = "성장성 우위";
    text = "예상 CAGR이 높아 장기 성장성 측면에서 강점이 있습니다.";
  } else if (portfolio.stabilityRank === 1) {
    type = "안정성 우위";
    text = "MDD 기준 하락 위험이 상대적으로 낮아 방어력이 좋습니다.";
  } else if (portfolio.dividendRank === 1) {
    type = "배당 매력";
    text = "예상 배당률이 높아 현금흐름 측면에서 매력이 있습니다.";
  } else if (isRealValueSimilarToBest && isCagrSimilar && isMddSimilar && isDividendSimilar) {
    type = "유사 균형형";
    text = "상위 포트폴리오와 주요 지표 차이가 크지 않은 균형형 조합입니다.";
  } else {
    text = "성장성, 안정성, 배당 매력을 함께 비교해 조정 여지를 확인해보세요.";
  }

  return { type, text };
}

export { analyzePortfolioProfile, getPortfolioDetailReport } from "./portfolioAnalysis.js";
