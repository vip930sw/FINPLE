import { analyzePortfolioProfile } from "./portfolioCalculations";
import { formatNumber, formatPercent, getAssetValue, getAssetWeight } from "./portfolioFormatters";

export function createPortfolioReportText({
  activePortfolio,
  detailReport,
  result,
  assets,
  detailPortfolio,
}) {
  const portfolioAnalysis = analyzePortfolioProfile({ assets, result });

  return [
    `FINPLE 포트폴리오 리포트`,
    ``,
    `포트폴리오명: ${activePortfolio?.name || "포트폴리오"}`,
    `유형: ${detailReport?.type || "-"}`,
    `핵심 키워드: ${
      detailReport?.tags?.map((tag) => `#${tag}`).join(" ") || "-"
    }`,
    `생성일: ${new Date().toLocaleDateString("ko-KR")}`,
    ``,
    `요약`,
    `${detailReport?.summary || "-"}`,
    ``,
    `성장성`,
    `${detailReport?.growthText || "-"}`,
    ``,
    `위험도`,
    `${detailReport?.riskText || "-"}`,
    ``,
    `배당`,
    `${detailReport?.dividendText || "-"}`,
    ``,
    `활용 방향`,
    `${detailReport?.directionText || "-"}`,
    ``,
    `포트폴리오 성격 진단`,
    `${portfolioAnalysis.profileSummary}`,
    `상위 자산: ${portfolioAnalysis.allocationSummary || "-"}`,
    ``,
    `리스크 진단`,
    ...portfolioAnalysis.riskPoints.map((item, index) => `${index + 1}. ${item}`),
    ``,
    `개선 제안`,
    ...portfolioAnalysis.suggestions.map((item, index) => `${index + 1}. ${item}`),
    ``,
    `핵심 지표`,
    `시작 평가금액: ${formatNumber(result.simulationStartValue)}원`,
    `연간 투자금: ${formatNumber(result.yearlyContribution)}원`,
    `예상 CAGR: ${result.expectedCagr.toFixed(2)}%`,
    `예상 BETA: ${result.expectedBeta.toFixed(2)}`,
    `예상 MDD: ${result.simpleMdd.toFixed(2)}%`,
    `예상 배당률: ${result.expectedDividendYield.toFixed(2)}%`,
    `예상 연배당금: ${formatNumber(result.expectedAnnualDividend)}원`,
    `최종 예상 평가금액: ${formatNumber(result.futureValue)}원`,
    `물가 반영 실질 평가금액: ${formatNumber(
      result.inflationAdjustedFutureValue
    )}원`,
    ``,
    `자산 구성`,
    ...assets.map((asset) => {
      const assetValue = getAssetValue(asset);
      const weight = getAssetWeight(asset, result.totalAssetValue);

      return `${asset.ticker || "-"} / ${asset.name || "-"} / 평가금액 ${formatNumber(
        assetValue
      )}원 / 비중 ${formatPercent(weight)} / CAGR ${Number(
        asset.cagr || 0
      ).toFixed(1)}% / BETA ${Number(asset.beta || 0).toFixed(
        2
      )} / MDD ${Number(asset.mdd || 0).toFixed(1)}% / 배당률 ${Number(
        asset.dividendYield || 0
      ).toFixed(1)}%`;
    }),
    ``,
    `비교 순위`,
    `실질가치 순위: ${detailPortfolio?.realValueRank || "-"}위`,
    `성장성 순위: ${detailPortfolio?.growthRank || "-"}위`,
    `안정성 순위: ${detailPortfolio?.stabilityRank || "-"}위`,
    `배당 순위: ${detailPortfolio?.dividendRank || "-"}위`,
    ``,
    `유의사항`,
    `본 리포트는 사용자가 입력한 CAGR, BETA, MDD, 배당률과 공통 조건을 기준으로 계산한 시뮬레이션 결과입니다. 실제 투자 수익률을 보장하지 않습니다.`,
  ].join("\n");
}
export function createReportSummaryText({ activePortfolio, detailReport, result, assets = [] }) {
  const portfolioAnalysis = analyzePortfolioProfile({ assets, result });

  return [
    `[FINPLE 포트폴리오 리포트]`,
    `포트폴리오: ${activePortfolio?.name || "포트폴리오"}`,
    `유형: ${detailReport?.type || "-"}`,
    `핵심 키워드: ${
      detailReport?.tags?.map((tag) => `#${tag}`).join(" ") || "-"
    }`,
    ``,
    `요약: ${detailReport?.summary || "-"}`,
    `성격 진단: ${portfolioAnalysis.profileSummary}`,
    ``,
    `시작 평가금액: ${formatNumber(result.simulationStartValue)}원`,
    `연간 투자금: ${formatNumber(result.yearlyContribution)}원`,
    `예상 CAGR: ${result.expectedCagr.toFixed(2)}%`,
    `예상 BETA: ${result.expectedBeta.toFixed(2)}`,
    `예상 MDD: ${result.simpleMdd.toFixed(2)}%`,
    `예상 배당률: ${result.expectedDividendYield.toFixed(2)}%`,
    `최종 예상 평가금액: ${formatNumber(result.futureValue)}원`,
    `물가 반영 실질 평가금액: ${formatNumber(
      result.inflationAdjustedFutureValue
    )}원`,
  ].join("\n");
}
