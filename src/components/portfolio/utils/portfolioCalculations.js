export function calculatePortfolioResult(settings, assets) {
  const yearlyContribution = Number(settings.monthlyCashFlow || 0) * 12;

  const totalAssetValue = assets.reduce((sum, asset) => {
    return sum + Number(asset.quantity || 0) * Number(asset.price || 0);
  }, 0);

  const simulationStartValue = totalAssetValue;

  const expectedCagr = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = totalAssetValue > 0 ? value / totalAssetValue : 0;
    return sum + weight * Number(asset.cagr || 0);
  }, 0);

  const expectedDividendYield = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = totalAssetValue > 0 ? value / totalAssetValue : 0;
    return sum + weight * Number(asset.dividendYield || 0);
  }, 0);

  const expectedBeta = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = totalAssetValue > 0 ? value / totalAssetValue : 0;
    return sum + weight * Number(asset.beta || 0);
  }, 0);

  const simpleMdd = assets.reduce((sum, asset) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = totalAssetValue > 0 ? value / totalAssetValue : 0;
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

    /*
      1. 유사 균형형
      - 수치 차이가 작을 때 순위 해석 과장 방지
    */
    if (
      isRealValueSimilarToBest &&
      isCagrSimilar &&
      isMddSimilar &&
      isDividendSimilar
    ) {
      return {
        type: "유사 균형형",
        text: "상위 포트폴리오들과 핵심 지표 차이가 크지 않습니다. 수익률보다 자산 구성, 배당 선호도, 변동성 감내 수준을 기준으로 비교하기 좋습니다.",
      };
    }

    /*
      2. 공격 성장형
      - 높은 CAGR, 높은 MDD
    */
    if (cagr >= 10 && mdd <= -30) {
      type = "공격 성장형";

      if (isTopRealValue || isTopGrowth) {
        text =
          "장기 실질가치와 성장성이 돋보이는 포트폴리오입니다. 다만 MDD가 큰 편이라 하락장에서는 변동성을 크게 체감할 수 있습니다.";
      } else {
        text =
          "성장 기대는 높은 편이지만 하락 위험도 함께 큰 포트폴리오입니다. 공격적인 투자 성향에 적합합니다.";
      }

      return { type, text };
    }

    /*
      3. 배당 성장형
      - 배당률이 높고 성장성도 일정 수준 이상
    */
    if (dividendYield >= 3 && cagr >= 6) {
      type = "배당 성장형";

      if (isTopDividend) {
        text =
          "배당 현금흐름이 돋보이면서 성장성도 함께 기대할 수 있는 포트폴리오입니다. 장기 보유와 배당재투자 효과를 함께 고려하기 좋습니다.";
      } else {
        text =
          "배당과 성장성을 함께 고려한 포트폴리오입니다. 시세차익만큼 현금흐름 안정성도 중요하게 보는 구성입니다.";
      }

      return { type, text };
    }

    /*
      4. 균형 성장형
      - 성장성이 높지만 공격형보다는 완만
    */
    if (cagr >= 8 && mdd > -30) {
      type = "균형 성장형";

      if (isTopRealValue) {
        text =
          "실질가치 기준으로 강점이 있는 성장형 포트폴리오입니다. 성장성을 유지하면서도 과도한 변동성은 일부 줄인 구성입니다.";
      } else {
        text =
          "성장성을 유지하면서도 과도한 변동성은 피하려는 구성입니다. 공격형과 안정형의 중간 성격에 가깝습니다.";
      }

      return { type, text };
    }

    /*
      5. 방어 균형형
      - 낮은 BETA, 비교적 낮은 MDD
    */
    if (beta <= 0.55 && mdd > -25 && cagr >= 5) {
      type = "방어 균형형";

      if (isTopStability) {
        text =
          "시장 변동에 상대적으로 덜 민감한 방어적 균형형 포트폴리오입니다. 장기 수익률보다는 안정성, 배당, 자산 분산 목적을 함께 고려하는 구성입니다.";
      } else {
        text =
          "변동성 관리에 강점이 있는 방어적 구성입니다. 큰 수익률보다는 손실폭 관리와 장기 유지 가능성을 중시하는 투자자에게 적합합니다.";
      }

      return { type, text };
    }

    /*
      6. 배당 균형형
      - 배당률이 중상위이고 성장성도 일정 수준
    */
    if (dividendYield >= 2.3 && cagr >= 6) {
      type = "배당 균형형";

      if (isTopDividend) {
        text =
          "배당 매력이 상대적으로 높은 균형형 포트폴리오입니다. 장기 보유와 현금흐름, 배당재투자 효과를 함께 고려하기 좋습니다.";
      } else {
        text =
          "성장성, 안정성, 배당 매력이 비교적 고르게 분포된 포트폴리오입니다. 배당 현금흐름도 함께 고려할 수 있는 균형형 구성입니다.";
      }

      return { type, text };
    }

    /*
      7. 안정 균형형
      - BETA와 MDD가 낮은 편이지만 방어형보다는 성장성 있음
    */
    if (beta <= 0.7 && mdd > -27 && cagr >= 6) {
      type = "안정 균형형";

      if (isTopStability) {
        text =
          "안정성 측면의 장점이 있는 균형형 포트폴리오입니다. 성장성은 유지하되 변동성을 낮추는 데 초점을 둔 구성입니다.";
      } else {
        text =
          "성장성과 안정성의 균형을 맞춘 포트폴리오입니다. 공격적인 수익률보다 변동성 관리와 꾸준한 장기 운용에 적합합니다.";
      }

      return { type, text };
    }

    /*
      8. 방어형
      - 성장성보다 하락 방어 중심
    */
    if (mdd > -20 && beta <= 0.6) {
      type = "방어형";

      if (isTopStability) {
        text =
          "하락 위험이 상대적으로 낮은 안정형 포트폴리오입니다. 큰 수익보다 변동성 관리에 강점이 있습니다.";
      } else {
        text =
          "시장 변동에 비교적 덜 민감한 구성입니다. 다만 장기 성장성은 성장형 포트폴리오보다 낮을 수 있습니다.";
      }

      return { type, text };
    }

    /*
      9. 보수형
      - 성장성이 낮은 편
    */
    if (cagr < 5) {
      type = "보수형";

      if (isTopStability) {
        text =
          "성장성은 낮지만 안정성 측면에서는 장점이 있는 포트폴리오입니다. 원금 변동 부담을 줄이고 싶은 경우에 적합합니다.";
      } else {
        text =
          "장기 성장성은 제한적일 수 있습니다. 안정성을 우선하되, 실질가치 하락 가능성도 함께 점검할 필요가 있습니다.";
      }

      return { type, text };
    }

    /*
      10. 기타 균형형
    */
    type = "균형형";

    if (isTopRealValue && !isRealValueSimilarToBest) {
      text =
        "실질가치 기준으로 우위가 있는 포트폴리오입니다. 수익성과 위험 수준이 한쪽으로 크게 치우치지는 않습니다.";
    } else if (isTopStability && !isMddSimilar) {
      text =
        "안정성 측면에서 강점이 있습니다. 성장성보다는 하락 위험 관리에 더 적합한 구성입니다.";
    } else if (isTopDividend && !isDividendSimilar) {
      text =
        "배당 매력이 상대적으로 높습니다. 장기 보유 시 현금흐름을 중시하는 투자자에게 적합합니다.";
    } else if (portfolio.realValueRank >= 4 && !isRealValueSimilarToBest) {
      text =
        "실질가치 기준으로는 상위 포트폴리오와 차이가 있습니다. 안정성, 배당, 자산 배분 목적을 함께 고려해 비교하는 것이 좋습니다.";
    } else {
      text =
        "성장성, 안정성, 배당 매력이 비교적 고르게 분포된 포트폴리오입니다. 특정 지표에 과도하게 치우치지 않은 구성이 장점입니다.";
    }

    return { type, text };
  }
export function getPortfolioDetailReport(portfolio, allPortfolios) {
    const result = portfolio.result;

    const cagr = Number(result.expectedCagr || 0);
    const mdd = Number(result.simpleMdd || 0);
    const beta = Number(result.expectedBeta || 0);
    const dividendYield = Number(result.expectedDividendYield || 0);
    const realValueRank = portfolio.realValueRank;
    const growthRank = portfolio.growthRank;
    const stabilityRank = portfolio.stabilityRank;
    const dividendRank = portfolio.dividendRank;

    const insight = getPortfolioInsight(portfolio, allPortfolios);

    let growthText = "";
    let riskText = "";
    let dividendText = "";
    let directionText = "";
    let tags = [];

    if (cagr >= 10) {
      growthText = `예상 CAGR은 ${cagr.toFixed(
        1
      )}%로 높은 편이며, 장기 평가금액 확대를 우선하는 구성입니다. 실질가치 기준 순위는 ${realValueRank}위입니다.`;
    } else if (cagr >= 7) {
      growthText = `예상 CAGR은 ${cagr.toFixed(
        1
      )}%로 중상위 수준입니다. 성장성을 확보하면서도 과도한 공격성은 일부 줄인 구성으로 볼 수 있습니다.`;
    } else if (cagr >= 4) {
      growthText = `예상 CAGR은 ${cagr.toFixed(
        1
      )}%로 완만한 성장형에 가깝습니다. 장기 수익률보다는 안정성이나 배당, 자산 분산 목적을 함께 고려하는 구성이 적합합니다.`;
    } else {
      growthText = `예상 CAGR은 ${cagr.toFixed(
        1
      )}%로 낮은 편입니다. 물가상승률을 감안하면 실질가치 방어 여부를 함께 점검할 필요가 있습니다.`;
    }

    if (mdd <= -30 || beta >= 1.1) {
      riskText = `예상 MDD는 ${mdd.toFixed(
        1
      )}%이고 BETA는 ${beta.toFixed(
        2
      )}입니다. 하락장에서는 변동성을 크게 체감할 수 있으므로 투자기간과 리밸런싱 기준이 중요합니다.`;
    } else if (mdd <= -20 || beta >= 0.8) {
      riskText = `예상 MDD는 ${mdd.toFixed(
        1
      )}%이고 BETA는 ${beta.toFixed(
        2
      )}입니다. 시장 변동을 어느 정도 반영하는 중간 위험 수준의 포트폴리오로 볼 수 있습니다.`;
    } else {
      riskText = `예상 MDD는 ${mdd.toFixed(
        1
      )}%이고 BETA는 ${beta.toFixed(
        2
      )}입니다. 상대적으로 하락 방어와 변동성 관리에 강점이 있는 구성입니다.`;
    }

    if (dividendYield >= 3) {
      dividendText = `예상 배당률은 ${dividendYield.toFixed(
        1
      )}%로 배당 매력이 있는 편입니다. 배당재투자를 적용하면 장기 복리 효과를 기대할 수 있습니다.`;
    } else if (dividendYield >= 1) {
      dividendText = `예상 배당률은 ${dividendYield.toFixed(
        1
      )}%로 중간 수준입니다. 배당 현금흐름보다는 성장성과 안정성의 균형을 함께 보는 구성이 적합합니다.`;
    } else {
      dividendText = `예상 배당률은 ${dividendYield.toFixed(
        1
      )}%로 낮은 편입니다. 정기 현금흐름보다는 자본차익 중심의 포트폴리오로 해석하는 것이 자연스럽습니다.`;
    }

    if (growthRank === 1 && realValueRank === 1) {
      directionText =
        "현재 비교군 안에서는 성장성과 실질가치가 모두 돋보입니다. 다만 높은 성장성은 대체로 변동성 부담을 동반하므로 하락 시 대응 기준을 함께 정해두는 편이 좋습니다.";
    } else if (stabilityRank === 1) {
      directionText =
        "현재 비교군 안에서는 안정성 측면의 장점이 두드러집니다. 큰 수익률보다 손실폭 관리와 장기 유지 가능성을 중요하게 보는 투자자에게 어울립니다.";
    } else if (dividendRank === 1) {
      directionText =
        "현재 비교군 안에서는 배당 매력이 상대적으로 높습니다. 장기 보유와 현금흐름, 배당재투자 효과를 함께 고려하기 좋습니다.";
    } else {
      directionText =
        "특정 지표 하나에 치우치기보다는 성장성, 변동성, 배당, 실질가치를 함께 비교해 판단하는 것이 좋습니다.";
    }

    if (insight.type === "공격 성장형") {
        tags = ["하락장대응", "리밸런싱", "장기투자"];
      } else if (insight.type === "배당 균형형") {
        tags = ["현금흐름", "배당재투자", "장기보유"];
      } else if (insight.type === "방어 균형형") {
        tags = ["손실폭관리", "안정성", "자산분산"];
      } else if (insight.type === "균형 성장형") {
        tags = ["성장성", "위험절충", "중장기운용"];
      } else if (insight.type === "안정 균형형") {
        tags = ["꾸준한운용", "낮은변동성", "장기유지"];
      } else if (insight.type === "배당 성장형") {
        tags = ["배당성장", "복리효과", "장기보유"];
      } else if (insight.type === "방어형") {
        tags = ["하락방어", "변동성관리", "안정운용"];
      } else if (insight.type === "보수형") {
        tags = ["원금변동완화", "안정성우선", "실질가치점검"];
      } else {
        tags = ["균형배분", "지표비교", "장기운용"];
      }

      if (insight.type === "공격 성장형") {
        growthText = `예상 CAGR은 ${cagr.toFixed(
          1
        )}%로 높은 편입니다. 장기 실질가치 확대를 기대할 수 있지만, 성과가 나타나기까지 충분한 투자기간을 전제로 보는 것이 좋습니다.`;

        riskText = `예상 MDD는 ${mdd.toFixed(
          1
        )}%이고 BETA는 ${beta.toFixed(
          2
        )}입니다. 하락장에서는 손실폭이 크게 나타날 수 있으므로 분할매수, 리밸런싱, 하락 대응 기준을 미리 정해두는 편이 좋습니다.`;

        dividendText = `예상 배당률은 ${dividendYield.toFixed(
          1
        )}%입니다. 배당 현금흐름보다는 자본차익 중심의 포트폴리오로 해석하는 것이 자연스럽습니다.`;

        directionText =
          "공격 성장형 포트폴리오는 단기 변동성보다 장기 성장성을 우선하는 투자자에게 적합합니다. 목표 비중과 리밸런싱 기준을 함께 설정하면 하락장에서도 운용 원칙을 유지하기 좋습니다.";
      } else if (insight.type === "배당 균형형") {
        growthText = `예상 CAGR은 ${cagr.toFixed(
          1
        )}%로 중상위 수준입니다. 고성장 포트폴리오보다는 완만하지만, 배당과 함께 장기 복리 효과를 기대할 수 있는 구성입니다.`;

        riskText = `예상 MDD는 ${mdd.toFixed(
          1
        )}%이고 BETA는 ${beta.toFixed(
          2
        )}입니다. 시장 변동을 어느 정도 반영하지만, 성장 자산과 배당 자산이 함께 있어 변동성 부담을 일부 완화하는 구조입니다.`;

        dividendText = `예상 배당률은 ${dividendYield.toFixed(
          1
        )}%입니다. 정기 현금흐름과 배당재투자 효과를 함께 고려하기 좋으며, 장기 보유 시 복리 효과가 중요한 포인트가 됩니다.`;

        directionText =
          "배당 균형형 포트폴리오는 성장성과 현금흐름을 함께 보고 싶은 투자자에게 적합합니다. 배당을 재투자할지, 현금흐름으로 사용할지에 따라 장기 결과가 달라질 수 있습니다.";
      } else if (insight.type === "방어 균형형") {
        growthText = `예상 CAGR은 ${cagr.toFixed(
          1
        )}%로 완만한 성장형에 가깝습니다. 높은 수익률보다는 안정성, 배당, 자산 분산 목적을 함께 고려하는 구성이 적합합니다.`;

        riskText = `예상 MDD는 ${mdd.toFixed(
          1
        )}%이고 BETA는 ${beta.toFixed(
          2
        )}입니다. 시장 변동에 상대적으로 덜 민감한 편이어서 손실폭 관리와 변동성 완화에 강점이 있습니다.`;

        dividendText = `예상 배당률은 ${dividendYield.toFixed(
          1
        )}%입니다. 배당이 포트폴리오의 주된 목적은 아니더라도, 안정적인 운용을 보조하는 현금흐름 역할을 할 수 있습니다.`;

        directionText =
          "방어 균형형 포트폴리오는 큰 수익률보다 손실폭 관리와 장기 유지 가능성을 중요하게 보는 투자자에게 어울립니다. 주식, 채권, 금 등 자산 분산 목적을 함께 점검하기 좋습니다.";
      } else if (insight.type === "균형 성장형") {
        growthText = `예상 CAGR은 ${cagr.toFixed(
          1
        )}%로 중상위 수준입니다. 성장성을 유지하면서도 공격 성장형보다 변동성 부담을 일부 낮추려는 구성으로 볼 수 있습니다.`;

        riskText = `예상 MDD는 ${mdd.toFixed(
          1
        )}%이고 BETA는 ${beta.toFixed(
          2
        )}입니다. 위험이 낮은 포트폴리오는 아니지만, 성장성과 위험 사이의 절충을 시도하는 구조입니다.`;

        dividendText = `예상 배당률은 ${dividendYield.toFixed(
          1
        )}%입니다. 배당보다는 성장성과 안정성의 균형이 더 중요한 포트폴리오이며, 배당은 보조적인 역할로 보는 것이 자연스럽습니다.`;

        directionText =
          "균형 성장형 포트폴리오는 성장성을 포기하지 않으면서 과도한 공격성은 피하고 싶은 투자자에게 적합합니다. 특정 지표 하나보다 CAGR, MDD, BETA, 실질가치를 함께 비교하는 것이 좋습니다.";
      } else if (insight.type === "안정 균형형") {
        growthText = `예상 CAGR은 ${cagr.toFixed(
          1
        )}%로 중상위 수준입니다. 폭발적인 성장보다는 꾸준한 장기 운용을 통해 성과를 누적하는 방식에 가깝습니다.`;

        riskText = `예상 MDD는 ${mdd.toFixed(
          1
        )}%이고 BETA는 ${beta.toFixed(
          2
        )}입니다. 시장 변동을 어느 정도 반영하지만, 공격형 포트폴리오보다 변동성 부담을 낮추는 데 초점을 둔 구성입니다.`;

        dividendText = `예상 배당률은 ${dividendYield.toFixed(
          1
        )}%입니다. 배당 매력은 중간 수준이며, 현금흐름보다는 안정적인 장기 운용을 보조하는 요소로 보는 것이 좋습니다.`;

        directionText =
          "안정 균형형 포트폴리오는 꾸준한 운용, 낮은 변동성, 장기 유지 가능성을 중요하게 보는 투자자에게 적합합니다. 수익률과 안정성 사이의 균형을 확인하며 운용하기 좋습니다.";
      }

      return {
        type: insight.type,
        summary: insight.text,
        growthText,
        riskText,
        dividendText,
        directionText,
        tags,
      };
  }

/* =========================
   Detail Report Analysis Helpers
========================= */
function getAssetDisplayName(asset) {
  return asset?.name || asset?.ticker || "자산";
}

function getActiveAnalysisAssets(assets = []) {
  return assets
    .filter((asset) => {
      const quantity = Number(asset?.quantity || 0);
      const price = Number(asset?.price || 0);
      return asset?.ticker && quantity > 0 && price > 0;
    })
    .map((asset) => ({
      ...asset,
      value: Number(asset.quantity || 0) * Number(asset.price || 0),
    }));
}

function classifyAssetRole(asset) {
  const ticker = String(asset?.ticker || "").toUpperCase();
  const name = String(asset?.name || "").toLowerCase();
  const cagr = Number(asset?.cagr || 0);
  const beta = Number(asset?.beta || 0);
  const dividendYield = Number(asset?.dividendYield || 0);

  const defensiveTickers = ["TLT", "IEF", "SHY", "BIL", "SGOV", "AGG", "BND", "GLD", "IAU"];
  const coreTickers = ["SPY", "VOO", "IVV", "VTI", "VT"];
  const growthTickers = ["QQQ", "TQQQ", "QLD", "VGT", "XLK", "SMH", "SOXX", "NVDA", "TSLA", "AAPL", "MSFT"];

  if (
    defensiveTickers.includes(ticker) ||
    name.includes("bond") ||
    name.includes("treasury") ||
    name.includes("채권") ||
    name.includes("gold") ||
    name.includes("금 etf") ||
    name.includes("금 ")
  ) {
    return { key: "defensive", label: "방어/헤지" };
  }

  if (dividendYield >= 2.5 || name.includes("dividend") || name.includes("배당")) {
    return { key: "dividend", label: "배당/현금흐름" };
  }

  if (coreTickers.includes(ticker) || name.includes("s&p500") || name.includes("s&p 500") || name.includes("전체시장")) {
    return { key: "core", label: "시장대표" };
  }

  if (growthTickers.includes(ticker) || cagr >= 9 || beta >= 1.2 || name.includes("growth") || name.includes("성장")) {
    return { key: "growth", label: "성장" };
  }

  return { key: "satellite", label: "위성/기타" };
}

function getRiskLevelLabel({ mdd, beta, topWeight, defensiveWeight }) {
  const mddAbs = Math.abs(Number(mdd || 0));
  const betaValue = Number(beta || 0);

  if (mddAbs >= 35 || betaValue >= 1.25 || topWeight >= 60) return "높음";
  if (mddAbs >= 28 || betaValue >= 1.05 || topWeight >= 45 || defensiveWeight < 10) return "중간~높음";
  if (mddAbs >= 18 || betaValue >= 0.75) return "중간";
  return "낮음~중간";
}

export function analyzePortfolioProfile({ assets = [], result = {} }) {
  const activeAssets = getActiveAnalysisAssets(assets);
  const totalValue = Number(result?.totalAssetValue || 0);
  const expectedCagr = Number(result?.expectedCagr || 0);
  const expectedDividendYield = Number(result?.expectedDividendYield || 0);
  const expectedBeta = Number(result?.expectedBeta || 0);
  const simpleMdd = Number(result?.simpleMdd || 0);

  if (!activeAssets.length || totalValue <= 0) {
    return {
      riskLevel: "분석 대기",
      profileSummary: "수량과 현재가가 입력된 자산이 있어야 포트폴리오 성격을 분석할 수 있습니다.",
      allocationSummary: "분석 가능한 자산이 아직 없습니다.",
      topAssets: [],
      roleBreakdown: [],
      riskPoints: ["수량과 현재가를 입력하거나 조회한 뒤 다시 확인해 주세요."],
      suggestions: ["스크리너에서 후보 자산을 추가한 뒤 수량을 입력하고 현재가를 조회하면 상세 분석이 활성화됩니다."],
    };
  }

  const assetsWithWeight = activeAssets
    .map((asset) => ({
      ...asset,
      weight: totalValue > 0 ? (asset.value / totalValue) * 100 : 0,
      role: classifyAssetRole(asset),
    }))
    .sort((a, b) => b.value - a.value);

  const roleMap = assetsWithWeight.reduce((acc, asset) => {
    const key = asset.role.key;
    if (!acc[key]) {
      acc[key] = { key, label: asset.role.label, weight: 0, assets: [] };
    }
    acc[key].weight += asset.weight;
    acc[key].assets.push(asset.ticker);
    return acc;
  }, {});

  const roleBreakdown = Object.values(roleMap).sort((a, b) => b.weight - a.weight);
  const topAsset = assetsWithWeight[0];
  const topWeight = topAsset?.weight || 0;
  const topThree = assetsWithWeight.slice(0, 3);
  const defensiveWeight = Number(roleMap.defensive?.weight || 0);
  const dividendWeight = Number(roleMap.dividend?.weight || 0);
  const growthWeight = Number(roleMap.growth?.weight || 0);
  const coreWeight = Number(roleMap.core?.weight || 0);
  const dominantRole = roleBreakdown[0];
  const riskLevel = getRiskLevelLabel({
    mdd: simpleMdd,
    beta: expectedBeta,
    topWeight,
    defensiveWeight,
  });

  const rolePhrase = dominantRole
    ? `${dominantRole.label} 자산 비중이 ${dominantRole.weight.toFixed(1)}%로 가장 높습니다`
    : "특정 자산군이 두드러지지 않습니다";

  const profileSummary = `${rolePhrase}. 예상 CAGR은 ${expectedCagr.toFixed(
    2
  )}%, 예상 MDD는 ${simpleMdd.toFixed(2)}%, 예상 배당률은 ${expectedDividendYield.toFixed(
    2
  )}%입니다. 현재 기준 리스크 등급은 ${riskLevel}으로 볼 수 있습니다.`;

  const allocationSummary = topThree
    .map((asset) => `${asset.ticker} ${asset.weight.toFixed(1)}%`)
    .join(" · ");

  const riskPoints = [];

  if (topAsset && topWeight >= 50) {
    riskPoints.push(`${topAsset.ticker} 비중이 ${topWeight.toFixed(1)}%로 높아 특정 자산 흐름에 민감할 수 있습니다.`);
  }

  if (Math.abs(simpleMdd) >= 30) {
    riskPoints.push(`예상 MDD가 ${simpleMdd.toFixed(2)}%로 큰 편입니다. 하락장에서 평가금액 변동폭이 커질 수 있습니다.`);
  }

  if (expectedBeta >= 1.15) {
    riskPoints.push(`예상 BETA가 ${expectedBeta.toFixed(2)}로 시장 평균보다 민감한 편입니다.`);
  }

  if (defensiveWeight < 10) {
    riskPoints.push("방어/헤지 자산 비중이 낮아 급락장 완충 장치가 부족할 수 있습니다.");
  }

  if (expectedDividendYield < 1.5) {
    riskPoints.push("예상 배당률이 낮아 현금흐름보다는 자본차익 중심의 구조입니다.");
  }

  if (!riskPoints.length) {
    riskPoints.push("현재 입력값 기준으로 과도하게 두드러지는 위험 신호는 크지 않습니다.");
  }

  const suggestions = [];

  if (topAsset && topWeight >= 50) {
    suggestions.push("상위 자산 비중이 높다면 시장대표 ETF, 배당 ETF, 방어형 자산으로 분산하는 방안을 검토할 수 있습니다.");
  }

  if (Math.abs(simpleMdd) >= 30 || defensiveWeight < 10) {
    suggestions.push("MDD를 낮추고 싶다면 금, 장기채, 단기채 등 방어/헤지 성격의 자산 비중을 점검할 수 있습니다.");
  }

  if (expectedDividendYield < 1.5 && dividendWeight < 20) {
    suggestions.push("현금흐름을 높이고 싶다면 SCHD, VYM, DGRO 등 배당 성격의 ETF를 비교 검토할 수 있습니다.");
  }

  if (growthWeight < 25 && expectedCagr < 6) {
    suggestions.push("장기 성장성을 높이고 싶다면 시장대표 ETF나 성장형 ETF를 일부 편입하는 방안을 검토할 수 있습니다.");
  }

  if (coreWeight < 20) {
    suggestions.push("초보자 친화적인 구조를 원한다면 SPY, VOO, IVV, VTI 같은 시장대표 자산을 중심축으로 둘 수 있습니다.");
  }

  if (!suggestions.length) {
    suggestions.push("현재 구조는 비교적 균형적입니다. 큰 변경보다는 비중과 수량 조정을 통해 목표 위험도에 맞추는 방향이 좋습니다.");
  }

  return {
    riskLevel,
    profileSummary,
    allocationSummary,
    topAssets: topThree.map((asset) => ({
      ticker: asset.ticker,
      name: getAssetDisplayName(asset),
      weight: asset.weight,
      value: asset.value,
    })),
    roleBreakdown,
    riskPoints,
    suggestions,
  };
}

