import PerformanceChart from "../../PerformanceChart";
import DetailAssetTable from "./DetailAssetTable";
import { analyzePortfolioProfile } from "../utils/portfolioCalculations";

function MetricTooltip({ label, children }) {
  return (
    <span className="detailMetricHelpItem" tabIndex={0}>
      <span>{label}</span>
      <em>?</em>
      <strong>{children}</strong>
    </span>
  );
}

function safeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function safeFixed(value, digits = 2) {
  return safeNumber(value).toFixed(digits);
}

function getSafeReportFileName(reportPdfFileName, activePortfolio) {
  if (typeof reportPdfFileName === "function") {
    try {
      return reportPdfFileName();
    } catch (error) {
      return "FINPLE-report.pdf";
    }
  }

  if (typeof reportPdfFileName === "string" && reportPdfFileName.trim()) {
    return reportPdfFileName;
  }

  const portfolioName = String(activePortfolio?.name || "FINPLE-report")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim();

  return `${portfolioName || "FINPLE-report"}.pdf`;
}

export default function DetailPanel({
  activePortfolio,
  detailReport,
  settings,
  result,
  yearlyContribution,
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
  assets,
  formatNumber,
  formatPercent,
  formatDecimal,
  downloadReportText,
  saveReportPdf,
  printReport,
  reportPdfFileName,
  copyReportSummary,
}) {
  const safeSettings = settings || {};
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safePerformanceRows = Array.isArray(performanceRows) ? performanceRows : [];
  const safeReport = detailReport || null;
  const safeFormatNumber = typeof formatNumber === "function" ? formatNumber : (value) => Math.floor(safeNumber(value)).toLocaleString();
  const safeFormatPercent = typeof formatPercent === "function" ? formatPercent : (value) => `${safeFixed(value)}%`;
  const safeReportFileName = getSafeReportFileName(reportPdfFileName, activePortfolio);

  const rawPortfolioAnalysis = analyzePortfolioProfile({ assets: safeAssets, result }) || {};
  const portfolioAnalysis = {
    title: rawPortfolioAnalysis.title || "포트폴리오 분석",
    description: rawPortfolioAnalysis.description || "계산 결과를 기준으로 포트폴리오 특성을 확인합니다.",
    tags: Array.isArray(rawPortfolioAnalysis.tags) ? rawPortfolioAnalysis.tags : [],
  };
  const monthlyDividend = Math.floor(safeNumber(expectedAnnualDividend) / 12);
  const investmentYears = safeNumber(safeSettings.years, 0);
  const cumulativeContribution = safeNumber(simulationStartValue) + safeNumber(yearlyContribution) * investmentYears;
  const cumulativeProfit = Math.max(0, safeNumber(futureValue) - cumulativeContribution);

  const performanceMetrics = [
    { label: "시작 평가금액", value: `${Math.floor(safeNumber(simulationStartValue)).toLocaleString()}원`, note: "시뮬레이션 기준 금액" },
    { label: `${investmentYears}년 후 예상 자산`, value: `${safeFormatNumber(futureValue)}원`, note: "물가 반영 전 예상값" },
    { label: "물가 반영 실질가치", value: `${safeFormatNumber(inflationAdjustedFutureValue)}원`, note: "구매력 기준 예상값" },
    { label: "예상 CAGR", value: `${safeFixed(expectedCagr)}%`, note: "자산 비중 가중 평균" },
    { label: "누적 투자금", value: `${Math.floor(cumulativeContribution).toLocaleString()}원`, note: "시작금액 + 월 투자금" },
    { label: "누적 수익금", value: `${Math.floor(cumulativeProfit).toLocaleString()}원`, note: "예상 자산 - 누적 투자금" },
  ];

  const riskMetrics = [
    { label: "예상 BETA", value: safeFixed(expectedBeta), note: "시장 대비 변동 민감도" },
    { label: "예상 MDD", value: `${safeFixed(simpleMdd)}%`, note: "최대 하락폭 참고 지표" },
    { label: "예상 Calmar", value: safeFixed(expectedCalmar), note: "CAGR 대비 MDD 효율" },
    { label: "Sharpe", value: "준비 중", note: "변동성 데이터 연동 후 제공" },
  ];

  const dividendMetrics = [
    { label: "예상 연배당금", value: `${Math.floor(safeNumber(expectedAnnualDividend)).toLocaleString()}원`, note: "현재 평가금액 기준" },
    { label: "월 예상 배당금", value: `${safeFormatNumber(monthlyDividend)}원`, note: "연배당금의 월 환산" },
    { label: "예상 배당률", value: `${safeFixed(expectedDividendYield)}%`, note: "포트폴리오 가중 평균" },
    { label: "배당재투자", value: safeSettings.dividendReinvest ? "적용" : "미적용", note: "장기 복리 효과 반영 여부" },
  ];

  const reportInsights = Array.isArray(safeReport?.insights) ? safeReport.insights : [];
  const reportTags = Array.isArray(safeReport?.tags) ? safeReport.tags : [];

  return (
    <div id="detail" className="simulatorTabPanel detailPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 3. Detail</p>
          <h3>선택 포트폴리오 상세 분석</h3>
          <p>
            선택한 포트폴리오의 요약 리포트, 분석 조건, 핵심 지표, 자산 구성과
            장기 예상 흐름을 확인합니다.
          </p>
        </div>

        <div className="detailHeaderRight">
          <div className="selectedPortfolioBadge">
            <span>선택 중</span>
            <strong>{activePortfolio?.name || "포트폴리오"}</strong>
          </div>

          <div className="detailReportActions">
            <button type="button" className="primaryReportAction" onClick={saveReportPdf}>PDF 저장</button>
            <button type="button" onClick={printReport}>인쇄</button>
            <button type="button" onClick={copyReportSummary}>공유 문구 복사</button>
          </div>

          <p className="pdfFileNameHint">저장 권장 파일명: {safeReportFileName}</p>
        </div>
      </div>

      {safeReport ? (
        <div className="portfolioDetailReport">
          <div className="portfolioDetailReportHeader">
            <div>
              <p className="sectionLabel">Summary Report</p>
              <h4>포트폴리오 요약 리포트</h4>
            </div>
            <div className="portfolioDetailReportMeta">
              <span className="portfolioDetailTypeBadge">{safeReport.type || "분석"}</span>
              {reportTags.length > 0 ? (
                <div className="portfolioDetailTags">{reportTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              ) : null}
            </div>
          </div>
          <p>{safeReport.summary || "계산 버튼을 누르면 포트폴리오 요약 리포트가 표시됩니다."}</p>
          {reportInsights.length > 0 ? (
            <div className="portfolioDetailInsightGrid">
              {reportInsights.map((insight) => (
                <article key={insight.title || insight.text}>
                  <strong>{insight.title || "분석 항목"}</strong>
                  <span>{insight.text || "-"}</span>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="detailHeroGrid">
        <article className="detailHeroMain">
          <p className="sectionLabel">Long Term Projection</p>
          <h3>{investmentYears}년 후 예상 자산</h3>
          <strong>{safeFormatNumber(futureValue)}원</strong>
          <span>물가 반영 실질가치 {safeFormatNumber(inflationAdjustedFutureValue)}원</span>
        </article>
        <article className="detailHeroProfile">
          <p className="sectionLabel">Portfolio Profile</p>
          <h3>{portfolioAnalysis.title}</h3>
          <span>{portfolioAnalysis.description}</span>
          <div className="portfolioProfileTags">{portfolioAnalysis.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
        </article>
      </div>

      <div className="detailMetricSection">
        <div className="detailMetricHeader"><div><p className="sectionLabel">Performance</p><h4>성과 지표</h4></div><MetricTooltip label="CAGR">연평균 성장률입니다. 여러 자산의 CAGR을 목표비중으로 가중 평균해 계산합니다.</MetricTooltip></div>
        <div className="detailMetricGrid">{performanceMetrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p></article>)}</div>
      </div>

      <div className="detailMetricSection">
        <div className="detailMetricHeader"><div><p className="sectionLabel">Risk</p><h4>위험 지표</h4></div><MetricTooltip label="BETA / MDD / Calmar">BETA는 시장 민감도, MDD는 과거 최대낙폭, Calmar는 수익 대비 낙폭 효율입니다.</MetricTooltip></div>
        <div className="detailMetricGrid">{riskMetrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p></article>)}</div>
      </div>

      <div className="detailMetricSection">
        <div className="detailMetricHeader"><div><p className="sectionLabel">Dividend</p><h4>배당 지표</h4></div><MetricTooltip label="Dividend Yield">현재 평가금액 기준 예상 배당률입니다. 배당 데이터가 없는 자산은 0으로 반영될 수 있습니다.</MetricTooltip></div>
        <div className="detailMetricGrid">{dividendMetrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p></article>)}</div>
      </div>

      <div className="detailChartSection"><div className="detailMetricHeader"><div><p className="sectionLabel">Chart</p><h4>장기 예상 흐름</h4></div></div><PerformanceChart data={safePerformanceRows} /></div>
      <DetailAssetTable assets={safeAssets} formatNumber={safeFormatNumber} formatPercent={safeFormatPercent} />
    </div>
  );
}
