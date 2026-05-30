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

  if (typeof reportPdfFileName === "string" && reportPdfFileName.trim()) return reportPdfFileName;

  const portfolioName = String(activePortfolio?.name || "FINPLE-report")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim();

  return `${portfolioName || "FINPLE-report"}.pdf`;
}

function getAssetsTotalValue(assets = []) {
  return assets.reduce((sum, asset) => {
    const value = safeNumber(asset?.quantity) * safeNumber(asset?.price);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
}

function getRiskTone({ expectedBeta, simpleMdd, expectedCagr }) {
  const beta = safeNumber(expectedBeta);
  const mdd = Math.abs(safeNumber(simpleMdd));
  const cagr = safeNumber(expectedCagr);

  if (mdd >= 45 || beta >= 1.4) return "공격형 변동성 주의";
  if (mdd >= 30 || beta >= 1.05) return "중립형 리스크 관리";
  if (cagr < 4) return "방어형 수익성 점검";
  return "균형형 관리 가능";
}

function MetricRows({ rows }) {
  return (
    <dl>
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}<small>{row.note}</small></dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function DetailPanel({
  activePortfolio,
  detailReport,
  settings,
  result,
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
  const safeFormatDecimal = typeof formatDecimal === "function" ? formatDecimal : (value, digits = 2) => safeFixed(value, digits);
  const safeReportFileName = getSafeReportFileName(reportPdfFileName, activePortfolio);
  const safeTotalAssetValue = safeNumber(totalAssetValue, getAssetsTotalValue(safeAssets));

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
  const riskTone = getRiskTone({ expectedBeta, simpleMdd, expectedCagr });
  const reportInsights = Array.isArray(safeReport?.insights) ? safeReport.insights : [];
  const reportTags = Array.isArray(safeReport?.tags) ? safeReport.tags : [];

  const heroMetrics = [
    { label: "예상 총액", value: `${safeFormatNumber(futureValue)}원`, note: `${investmentYears}년 후 명목 기준`, className: "primaryMetricCard" },
    { label: "실질가치", value: `${safeFormatNumber(inflationAdjustedFutureValue)}원`, note: "물가 반영 구매력 기준" },
    { label: "누적 투자금", value: `${Math.floor(cumulativeContribution).toLocaleString()}원`, note: "시작금액 + 월 투자금" },
    { label: "예상 수익금", value: `${Math.floor(cumulativeProfit).toLocaleString()}원`, note: "예상 자산 - 누적 투자금", className: safeNumber(simpleMdd) < -40 ? "dangerMetricCard" : "" },
  ];

  const groupedMetricCards = [
    {
      label: "Performance",
      title: "성과 지표",
      rows: [
        { label: "예상 CAGR", value: `${safeFixed(expectedCagr)}%`, note: "자산 비중 가중 평균" },
        { label: "시작 평가금액", value: `${Math.floor(safeNumber(simulationStartValue)).toLocaleString()}원`, note: "시뮬레이션 기준 금액" },
        { label: "누적 수익금", value: `${Math.floor(cumulativeProfit).toLocaleString()}원`, note: "예상 자산 - 누적 투자금" },
      ],
    },
    {
      label: "Risk",
      title: "위험 지표",
      rows: [
        { label: "예상 BETA", value: safeFixed(expectedBeta), note: "시장 대비 변동 민감도" },
        { label: "예상 MDD", value: `${safeFixed(simpleMdd)}%`, note: "최대 하락폭 참고 지표" },
        { label: "예상 Calmar", value: safeFixed(expectedCalmar), note: "CAGR 대비 MDD 효율" },
      ],
    },
    {
      label: "Dividend",
      title: "배당 지표",
      rows: [
        { label: "예상 연배당금", value: `${Math.floor(safeNumber(expectedAnnualDividend)).toLocaleString()}원`, note: "현재 평가금액 기준" },
        { label: "월 예상 배당금", value: `${safeFormatNumber(monthlyDividend)}원`, note: "연배당금 월 환산" },
        { label: "예상 배당률", value: `${safeFixed(expectedDividendYield)}%`, note: "포트폴리오 가중 평균" },
      ],
    },
  ];

  return (
    <div id="detail" className="simulatorTabPanel detailPanel">
      <div className="tabSectionHeader tabSectionHeaderRow compactDetailHeader">
        <div>
          <p className="sectionLabel">Step 3. Detail</p>
          <h3>선택 포트폴리오 상세 분석</h3>
          <p>선택한 포트폴리오의 요약 리포트, 분석 조건, 핵심 지표, 자산 구성과 장기 예상 흐름을 확인합니다.</p>
        </div>

        <div className="detailHeaderRight">
          <div className="selectedPortfolioBadge"><span>선택 중</span><strong>{activePortfolio?.name || "포트폴리오"}</strong></div>
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
            <div><p className="sectionLabel">Summary Report</p><h4>포트폴리오 요약 리포트</h4></div>
            <div className="portfolioDetailReportMeta">
              <span className="portfolioDetailTypeBadge">{safeReport.type || "분석"}</span>
              {reportTags.length > 0 ? <div className="portfolioDetailTags">{reportTags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
            </div>
          </div>
          <p>{safeReport.summary || "계산 버튼을 누르면 포트폴리오 요약 리포트가 표시됩니다."}</p>
          {reportInsights.length > 0 ? (
            <div className="portfolioDetailInsightGrid">
              {reportInsights.map((insight) => <article key={insight.title || insight.text}><strong>{insight.title || "분석 항목"}</strong><span>{insight.text || "-"}</span></article>)}
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="detailStep3ExecutiveSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Long Term Projection</p>
          <h4>{investmentYears}년 장기 예상과 포트폴리오 진단</h4>
        </div>
        <div className="detailHeroMetricGrid">
          {heroMetrics.map((metric) => (
            <article key={metric.label} className={`detailHeroMetricCard ${metric.className || ""}`}>
              <span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p>
            </article>
          ))}
        </div>
        <div className="detailNarrativeGrid">
          <article className="detailNarrativeCard">
            <div className="detailNarrativeTitleRow"><strong>{portfolioAnalysis.title}</strong><span className="detailRiskBadge">{riskTone}</span></div>
            <p>{portfolioAnalysis.description}</p>
            <span className="detailMiniNote">실질가치와 MDD를 함께 보면서 장기 유지 가능성을 점검하는 것이 좋습니다.</span>
          </article>
          <article className="detailDiagnosisCard">
            <h4>주의점 및 리스크</h4>
            <ul>
              <li>MDD가 클수록 하락 구간에서 포트폴리오 유지 난도가 높아집니다.</li>
              <li>BETA가 1을 초과하면 시장 하락 시 낙폭이 커질 수 있습니다.</li>
              <li>배당률은 장기 현금흐름 보조 지표이며, 총수익률과 함께 보셔야 합니다.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="detailGroupedMetricsSection">
        <div className="detailInfoHeader"><p className="sectionLabel">Portfolio Profile</p><h4>핵심 지표 표</h4></div>
        <div className="detailGroupedMetricGrid">
          {groupedMetricCards.map((card) => (
            <article key={card.label} className="detailGroupedMetricCard">
              <div className="detailGroupedMetricHeader"><span>{card.label}</span><strong>{card.title}</strong></div>
              <MetricRows rows={card.rows} />
            </article>
          ))}
        </div>
        <div className="detailMetricHelpBox">
          <div><span className="sectionLabel">Metric Guide</span><strong>지표 해석 기준</strong></div>
          <div className="detailMetricHelpList">
            <MetricTooltip label="CAGR">연평균 성장률입니다. 장기 수익률의 대표값으로 사용합니다.</MetricTooltip>
            <MetricTooltip label="BETA">시장 변동에 대한 민감도입니다. 1보다 크면 시장보다 민감합니다.</MetricTooltip>
            <MetricTooltip label="MDD">과거 최대 하락폭입니다. 투자자가 견뎌야 할 손실폭의 참고값입니다.</MetricTooltip>
            <MetricTooltip label="Calmar">CAGR을 MDD로 나눈 값으로, 수익 대비 낙폭 효율을 봅니다.</MetricTooltip>
          </div>
        </div>
      </section>

      {safePerformanceRows.length > 0 ? <PerformanceChart rows={safePerformanceRows} /> : null}
      <DetailAssetTable assets={safeAssets} totalAssetValue={safeTotalAssetValue} formatNumber={safeFormatNumber} formatPercent={safeFormatPercent} formatDecimal={safeFormatDecimal} />
    </div>
  );
}
