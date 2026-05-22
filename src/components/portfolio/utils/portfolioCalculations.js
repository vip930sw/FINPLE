export function calculatePortfolioResult(settings, assets) {
  const yearlyContribution = Number(settings.monthlyCashFlow || 0) * 12;

  const totalAssetValue = assets.reduce((sum, asset) => {
    return sum + Number(asset.quantity || 0) * Number(asset.price || 0);
  }, 0);

  const configuredStartValue = Number(settings.startValue || 0);
  const simulationStartValue = configuredStartValue > 0 ? configuredStartValue : totalAssetValue;
  const weightBaseValue = totalAssetValue > 0 ? totalAssetValue : simulationStartValue;

  const expectedCagr = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = weightBaseValue > 0 ? value / weightBaseValue : 0;
    return sum + weight * Number(asset.cagr || 0);
  }, 0);

  const expectedDividendYield = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = weightBaseValue > 0 ? value / weightBaseValue : 0;
    return sum + weight * Number(asset.dividendYield || 0);
  }, 0);

  const expectedBeta = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = weightBaseValue > 0 ? value / weightBaseValue : 0;
    return sum + weight * Number(asset.beta || 0);
  }, 0);

  const simpleMdd = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = weightBaseValue > 0 ? value / weightBaseValue : 0;
    return sum + weight * Number(asset.mdd || 0);
  }, 0);

  const expectedCalmar =
    Math.abs(simpleMdd) > 0 ? expectedCagr / Math.abs(simpleMdd) : 0;

  const expectedAnnualDividend = Math.floor(
    simulationStartValue * (expectedDividendYield / 100)
  );

  const performanceRows = [];

  let portfolioValue = simulationStartValue;
  let cumulativeContribution = simulationStartValue;
  let cumulativeDividend = 0;
  let cumulativeProfit = 0;

  for (let year = 1; year <= Number(settings.years || 0); year++) {
    const annualContribution = yearlyContribution;

    const annualDividend = Math.floor(
      portfolioValue * (expectedDividendYield / 100)
    );

    const baseForGrowth =
      portfolioValue +
      annualContribution +
      (settings.dividendReinvest ? annualDividend : 0);

    const annualProfit = Math.floor(baseForGrowth * (expectedCagr / 100));
    const endingValue = Math.floor(baseForGrowth + annualProfit);

    const inflationFactor = Math.pow(
      1 + Number(settings.inflationRate || 0) / 100,
      year
    );

    const inflationAdjustedValue = Math.floor(endingValue / inflationFactor);

    cumulativeContribution += annualContribution;
    cumulativeDividend += annualDividend;
    cumulativeProfit += annualProfit;

    performanceRows.push({
      year,
      annualContribution,
      annualDividend,
      annualProfit,
      cumulativeContribution,
      cumulativeDividend,
      cumulativeProfit,
      endingValue,
      inflationAdjustedValue,
    });

    portfolioValue = endingValue;
  }

  const lastPerformanceRow =
    performanceRows.length > 0
      ? performanceRows[performanceRows.length - 1]
      : null;

  const futureValue = lastPerformanceRow
    ? lastPerformanceRow.endingValue
    : simulationStartValue;

  const inflationAdjustedFutureValue = lastPerformanceRow
    ? lastPerformanceRow.inflationAdjustedValue
    : simulationStartValue;

  const cumulativeDividendResult = lastPerformanceRow
    ? lastPerformanceRow.cumulativeDividend
    : 0;

  return {
    yearlyContribution,
    totalAssetValue,
    simulationStartValue,
    expectedCagr,
    expectedDividendYield,
    expectedBeta,
    simpleMdd,
    expectedCalmar,
    expectedAnnualDividend,
    performanceRows,
    futureValue,
    inflationAdjustedFutureValue,
    cumulativeDividendResult,
  };
}
export function getRank(portfolios, targetId, selector, direction = "desc") {
    const targetPortfolio = portfolios.find(
      (portfolio) => portfolio.id === targetId
    );

    if (!targetPortfolio) return "-";

    const targetValue = selector(targetPortfolio);

    const betterCount = portfolios.filter((portfolio) => {
      const value = selector(portfolio);

      return direction === "asc"
        ? value < targetValue
        : value > targetValue;
    }).length;

    return betterCount + 1;
  }



/* =========================
   Pure Helpers / Formatters
========================= */
export function getActivePortfolioById(portfolioList, activePortfolioId) {
  return (
    portfolioList.find((portfolio) => portfolio.id === activePortfolioId) ||
    portfolioList[0]
  );
}
export function getDetailPortfolioById(rankedComparisonPortfolios, activePortfolioId) {
  return (
    rankedComparisonPortfolios.find(
      (portfolio) => portfolio.id === activePortfolioId
    ) || rankedComparisonPortfolios[0]
  );
}
export function createComparisonPortfolios(portfolioList, activePortfolioId, assets, settings) {
  return portfolioList.map((portfolio) => {
    const portfolioAssets =
      portfolio.id === activePortfolioId ? assets : portfolio.assets;

    return {
      ...portfolio,
      settings,
      assets: portfolioAssets,
      result: calculatePortfolioResult(settings, portfolioAssets),
    };
  });
}
export function createRankedComparisonPortfolios(comparisonPortfolios) {
  return comparisonPortfolios.map((portfolio) => {
    return {
      ...portfolio,
      realValueRank: getRank(
        comparisonPortfolios,
        portfolio.id,
        (item) => item.result.inflationAdjustedFutureValue
      ),
      growthRank: getRank(
        comparisonPortfolios,
        portfolio.id,
        (item) => item.result.expectedCagr
      ),
      stabilityRank: getRank(
        comparisonPortfolios,
        portfolio.id,
        (item) => item.result.simpleMdd
      ),
      dividendRank: getRank(
        comparisonPortfolios,
        portfolio.id,
        (item) => item.result.expectedDividendYield
      ),
    };
  });
}
export function createInsightComparisonPortfolios(rankedComparisonPortfolios) {
  return rankedComparisonPortfolios.map((portfolio) => {
    return {
      ...portfolio,
      insight: getPortfolioInsight(portfolio, rankedComparisonPortfolios),
    };
  });
}
export function getChartComparisonPortfolios(insightComparisonPortfolios) {
  return [...insightComparisonPortfolios]
    .sort(
      (a, b) =>
        b.result.inflationAdjustedFutureValue -
        a.result.inflationAdjustedFutureValue
    )
    .filter((portfolio) => portfolio.realValueRank <= 3);
}
export function getPortfolioInsight(portfolio, allPortfolios) {
    const result = portfolio.result;

    const cagr = Number(result.expectedCagr || 0);
    const mdd = Number(result.simpleMdd || 0);
    const dividendYield = Number(result.expectedDividendYield || 0);
    const beta = Number(result.expectedBeta || 0);
    const realValue = Number(result.inflationAdjustedFutureValue || 0);

    const bestRealValue = Math.max(
      ...allPortfolios.map(
        (item) => item.result.inflationAdjustedFutureValue || 0
      )
    );

    const realValueGapRate =
      bestRealValue > 0 ? ((bestRealValue - realValue) / bestRealValue) * 100 : 0;

    const cagrValues = allPortfolios.map((item) => item.result.expectedCagr);
    const mddValues = allPortfolios.map((item) => item.result.simpleMdd);
    const dividendValues = allPortfolios.map(
      (item) => item.result.expectedDividendYield
    );

    const maxCagr = Math.max(...cagrValues);
    const maxMdd = Math.max(...mddValues); // MDD는 -15가 -30보다 안정적
    const maxDividend = Math.max(...dividendValues);

    const isRealValueSimilarToBest = realValueGapRate <= 5;
    const isCagrSimilar = Math.abs(maxCagr - cagr) <= 0.5;
    const isMddSimilar = Math.abs(maxMdd - mdd) <= 3;
    const isDividendSimilar = Math.abs(maxDividend - dividendYield) <= 0.3;

    const isTopRealValue = portfolio.realValueRank === 1;
    const isTopGrowth = portfolio.growthRank === 1;
    const isTopStability = portfolio.stabilityRank === 1;
    const isTopDividend = portfolio.dividendRank === 1;

    let type = "균형형";
    let text = "";

    if (isTopRealValue) {
      type = "실질가치 우위";
      text = "물가를 반영한 장기 실질가치 기준으로 가장 앞서는 포트폴리오입니다.";
    } else if (isTopGrowth) {
      type = "성장성 우위";
      text = "예상 CAGR이 높아 장기 성장성 측면에서 강점이 있습니다.";
    } else if (isTopStability) {
      type = "안정성 우위";
      text = "MDD 기준 하락 위험이 상대적으로 낮아 방어력이 우수합니다.";
    } else if (isTopDividend) {
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