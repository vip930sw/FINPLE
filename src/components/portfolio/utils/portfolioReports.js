import { analyzePortfolioProfile } from "./portfolioAnalysis.js";
import { formatNumber, formatPercent, getAssetValue, getAssetWeight } from "./portfolioFormatters.js";
import {
  getDistributionFrequencyLabel,
  isNonOrdinaryDistribution,
} from "../../../data/tickers/distributionPolicy.js";
import { formatUserFacingBaselineBlockReasons } from "./baselineBlockReasonLabels.js";

function formatNullablePercent(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${numberValue.toFixed(digits)}%` : "-";
}

function formatNullableDecimal(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "-";
}

function formatNullableCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${formatNumber(numberValue)}원` : "-";
}

function isBlockedResult(result = {}) {
  return result?.status === "blocked" || result?.ready === false;
}

function createReportAnalysis(assets, result, blocked) {
  if (!blocked) return analyzePortfolioProfile({ assets, result });
  return {
    profileSummary: "기준 계산 보류",
    allocationSummary: "-",
    riskPoints: ["승인된 계산 계약을 충족하지 않아 기준 계산을 보류했습니다."],
    suggestions: ["차단 사유와 자산별 분배 정책을 검토한 뒤 다시 계산하세요."],
  };
}

function createBlockReasonLines(result, blocked) {
  if (!blocked) return [];
  const reasons = Array.isArray(result?.blockReasons) ? result.blockReasons : [];
  return [
    "",
    "차단 사유",
    ...(reasons.length > 0
      ? formatUserFacingBaselineBlockReasons(reasons).map((reason) => `- ${reason}`)
      : ["- 확인 필요"]),
  ];
}

function createNonOrdinaryDistributionLines(assets) {
  const distributionAssets = assets.filter(isNonOrdinaryDistribution);
  if (distributionAssets.length === 0) return [];
  return [
    "",
    "비일반 분배 정보",
    ...distributionAssets.map(
      (asset) => `${asset.ticker || "-"} / ${describeAssetDistribution(asset)}`,
    ),
  ];
}

function formatRank(value, blocked) {
  if (blocked || value === null || value === undefined || value === "" || value === "-") return "-";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${numberValue}위` : "-";
}

export function describeAssetDistribution(asset = {}) {
  if (!isNonOrdinaryDistribution(asset)) {
    return `일반 배당률 ${formatNullablePercent(asset.dividendYield)}`;
  }
  return [
    `최근 12개월 분배율 ${formatNullablePercent(asset.trailingDistributionYield)}`,
    `${getDistributionFrequencyLabel(asset.distributionFrequency)} 분배`,
    "일반 배당수익률·총수익률과 다름",
    "옵션 프리미엄 및 원금환급 가능성 있음",
  ].join(" / ");
}

export function createPortfolioReportText({
  activePortfolio,
  detailReport,
  result = {},
  assets = [],
  detailPortfolio,
} = {}) {
  const safeAssets = Array.isArray(assets) ? assets : [];
  const blocked = isBlockedResult(result);
  const portfolioAnalysis = createReportAnalysis(safeAssets, result, blocked);

  return [
    `FINPLE 포트폴리오 리포트`,
    ``,
    `포트폴리오명: ${activePortfolio?.name || "포트폴리오"}`,
    `유형: ${detailReport?.type || "-"}`,
    `계산 상태: ${blocked ? "기준 계산 보류" : "계산 완료"}`,
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
    ...createBlockReasonLines(result, blocked),
    ``,
    `핵심 지표`,
    `시작 평가금액: ${formatNullableCurrency(result.simulationStartValue)}`,
    `연간 투자금: ${formatNullableCurrency(result.yearlyContribution)}`,
    `예상 CAGR: ${blocked ? "-" : formatNullablePercent(result.expectedCagr)}`,
    `예상 BETA: ${blocked ? "-" : formatNullableDecimal(result.expectedBeta)}`,
    `예상 MDD: ${blocked ? "-" : formatNullablePercent(result.simpleMdd)}`,
    `예상 일반 배당률: ${blocked ? "-" : formatNullablePercent(result.expectedDividendYield)}`,
    `예상 연배당금: ${blocked ? "-" : formatNullableCurrency(result.expectedAnnualDividend)}`,
    `최종 예상 평가금액: ${blocked ? "-" : formatNullableCurrency(result.futureValue)}`,
    `물가 반영 실질 평가금액: ${blocked ? "-" : formatNullableCurrency(result.inflationAdjustedFutureValue)}`,
    ``,
    `자산 구성`,
    ...safeAssets.map((asset) => {
      const assetValue = getAssetValue(asset);
      const weight = getAssetWeight(asset, result.totalAssetValue);
      const cagr = blocked ? "-" : `${Number(asset.cagr || 0).toFixed(1)}%`;
      const beta = blocked ? "-" : Number(asset.beta || 0).toFixed(2);
      const mdd = blocked ? "-" : `${Number(asset.mdd || 0).toFixed(1)}%`;

      return `${asset.ticker || "-"} / ${asset.name || "-"} / 평가금액 ${formatNumber(
        assetValue
      )}원 / 비중 ${formatPercent(weight)} / CAGR ${cagr} / BETA ${beta} / MDD ${mdd} / ${describeAssetDistribution(asset)}`;
    }),
    ...createNonOrdinaryDistributionLines(safeAssets),
    ``,
    `비교 순위`,
    `실질가치 순위: ${formatRank(detailPortfolio?.realValueRank, blocked)}`,
    `성장성 순위: ${formatRank(detailPortfolio?.growthRank, blocked)}`,
    `안정성 순위: ${formatRank(detailPortfolio?.stabilityRank, blocked)}`,
    `배당 순위: ${formatRank(detailPortfolio?.dividendRank, blocked)}`,
    ``,
    `유의사항`,
    `본 리포트는 사용자가 입력한 CAGR, BETA, MDD, 일반 배당률과 공통 조건을 기준으로 계산한 시뮬레이션 결과입니다. 실제 투자 수익률을 보장하지 않습니다.`,
  ].join("\n");
}
export function createReportSummaryText({
  activePortfolio,
  detailReport,
  result = {},
  assets = [],
} = {}) {
  const safeAssets = Array.isArray(assets) ? assets : [];
  const blocked = isBlockedResult(result);
  const portfolioAnalysis = createReportAnalysis(safeAssets, result, blocked);

  return [
    `[FINPLE 포트폴리오 리포트]`,
    `포트폴리오: ${activePortfolio?.name || "포트폴리오"}`,
    `유형: ${detailReport?.type || "-"}`,
    `계산 상태: ${blocked ? "기준 계산 보류" : "계산 완료"}`,
    `핵심 키워드: ${
      detailReport?.tags?.map((tag) => `#${tag}`).join(" ") || "-"
    }`,
    ``,
    `요약: ${detailReport?.summary || "-"}`,
    `성격 진단: ${portfolioAnalysis.profileSummary}`,
    ...createBlockReasonLines(result, blocked),
    ``,
    `시작 평가금액: ${formatNullableCurrency(result.simulationStartValue)}`,
    `연간 투자금: ${formatNullableCurrency(result.yearlyContribution)}`,
    `예상 CAGR: ${blocked ? "-" : formatNullablePercent(result.expectedCagr)}`,
    `예상 BETA: ${blocked ? "-" : formatNullableDecimal(result.expectedBeta)}`,
    `예상 MDD: ${blocked ? "-" : formatNullablePercent(result.simpleMdd)}`,
    `예상 일반 배당률: ${blocked ? "-" : formatNullablePercent(result.expectedDividendYield)}`,
    `예상 연배당금: ${blocked ? "-" : formatNullableCurrency(result.expectedAnnualDividend)}`,
    `최종 예상 평가금액: ${blocked ? "-" : formatNullableCurrency(result.futureValue)}`,
    `물가 반영 실질 평가금액: ${blocked ? "-" : formatNullableCurrency(result.inflationAdjustedFutureValue)}`,
    ...createNonOrdinaryDistributionLines(safeAssets),
  ].join("\n");
}
