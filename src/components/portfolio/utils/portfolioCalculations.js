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

export function calculatePortfolioResult(settings, assets) {
  const safeAssets = Array.isArray(assets) ? assets : [];
  const totalAssetValue = safeAssets.reduce((sum, asset) => {
    return sum + getAssetWeightValue(asset);
  }, 0);

  const configuredStartValue = Number(settings.startValue || 0);
  const simulationStartValue = configuredStartValue > 0 ? configuredStartValue : totalAssetValue;
  return buildMonthlyBaselineProjection({
    settings: {
      ...settings,
      startValue: simulationStartValue,
      investmentMonths: Number(settings.years || 0) * 12,
    },
    assets: safeAssets,
  });
}

function isReadyPortfolio(portfolio = {}) {
  return portfolio?.result?.ready === true && portfolio?.result?.status === "ready";
}

export function getRank(portfolios, targetId, selector, direction = "desc") {
  const targetPortfolio = portfolios.find((portfolio) => portfolio.id === targetId);
  if (!targetPortfolio || !isReadyPortfolio(targetPortfolio)) return "-";

  const targetValue = selector(targetPortfolio);
  if (!Number.isFinite(Number(targetValue))) return "-";

  const betterCount = portfolios.filter((portfolio) => {
    if (!isReadyPortfolio(portfolio)) return false;
    const value = selector(portfolio);
    if (!Number.isFinite(Number(value))) return false;
    return direction === "asc" ? value < targetValue : value > targetValue;
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
    .sort((a, b) => b.result.inflationAdjustedFutureValue - a.result.inflationAdjustedFutureValue)
    .filter((portfolio) => portfolio.realValueRank <= 3);
}

export function getPortfolioInsight(portfolio, allPortfolios) {
  const result = portfolio.result;
  if (!isReadyPortfolio(portfolio)) {
    return {
      type: "Baseline blocked",
      text: "Metric source review is required before this portfolio can be ranked or charted.",
    };
  }

  const cagr = Number(result.expectedCagr || 0);
  const mdd = Number(result.simpleMdd || 0);
  const dividendYield = Number(result.expectedDividendYield || 0);
  const realValue = Number(result.inflationAdjustedFutureValue || 0);
  const readyPortfolios = allPortfolios.filter(isReadyPortfolio);
  const bestRealValue = Math.max(...readyPortfolios.map((item) => item.result.inflationAdjustedFutureValue || 0));
  const realValueGapRate = bestRealValue > 0 ? ((bestRealValue - realValue) / bestRealValue) * 100 : 0;

  const cagrValues = readyPortfolios.map((item) => item.result.expectedCagr);
  const mddValues = readyPortfolios.map((item) => item.result.simpleMdd);
  const dividendValues = readyPortfolios.map((item) => item.result.expectedDividendYield);

  const maxCagr = Math.max(...cagrValues);
  const maxMdd = Math.max(...mddValues);
  const maxDividend = Math.max(...dividendValues);

  const isRealValueSimilarToBest = realValueGapRate <= 5;
  const isCagrSimilar = Math.abs(maxCagr - cagr) <= 0.5;
  const isMddSimilar = Math.abs(maxMdd - mdd) <= 3;
  const isDividendSimilar = Math.abs(maxDividend - dividendYield) <= 0.3;

  let type = "균형형";
  let text = "";

  if (portfolio.realValueRank === 1) {
    type = "실질가치 우위";
    text = "물가를 반영한 장기 실질가치 기준으로 가장 앞서는 포트폴리오입니다.";
  } else if (portfolio.growthRank === 1) {
    type = "성장성 우위";
    text = "예상 CAGR이 높아 장기 성장성 측면에서 강점이 있습니다.";
  } else if (portfolio.stabilityRank === 1) {
    type = "안정성 우위";
    text = "MDD 기준 하락 위험이 상대적으로 낮아 방어력이 우수합니다.";
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
