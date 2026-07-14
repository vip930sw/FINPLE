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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
    .replace(/[\/:*?"<>|]/g, "-")
    .trim();

  return `${portfolioName || "FINPLE-report"}.pdf`;
}

function getAssetsTotalValue(assets = []) {
  return safeArray(assets).reduce((sum, asset) => {
    const actualValue = safeNumber(asset?.quantity) * safeNumber(asset?.price);
    const plannedValue = safeNumber(asset?.targetEvaluationAmount);
    const value = actualValue > 0 ? actualValue : plannedValue;
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
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
  const safeResult = result || {};
  const safeAssets = safeArray(assets);
  const safePerformanceRows = safeArray(performanceRows);
  const safeReport = detailReport || null;
  const safeFormatNumber = typeof formatNumber === "function" ? formatNumber : (value) => Math.floor(safeNumber(value)).toLocaleString();
  const safeFormatPercent = typeof formatPercent === "function" ? formatPercent : (value) => `${safeFixed(value)}%`;
  const safeFormatDecimal = typeof formatDecimal === "function" ? formatDecimal : (value, digits = 2) => safeFixed(value, digits);
  const safeFormatWholeNumber = (value) => Math.max(0, Math.floor(safeNumber(value))).toLocaleString();
  const safeReportFileName = getSafeReportFileName(reportPdfFileName, activePortfolio);
  const safeTotalAssetValue = safeNumber(totalAssetValue, safeNumber(safeResult.totalAssetValue, getAssetsTotalValue(safeAssets)));

  const rawPortfolioAnalysis = analyzePortfolioProfile({ assets: safeAssets, result: safeResult }) || {};
  const portfolioAnalysis = {
    riskLevel: rawPortfolioAnalysis.riskLevel || "-",
    profileSummary: rawPortfolioAnalysis.profileSummary || "계산 결과를 기준으로 포트폴리오 특성을 확인합니다.",
    allocationSummary: rawPortfolioAnalysis.allocationSummary || "",
    roleBreakdown: safeArray(rawPortfolioAnalysis.roleBreakdown),
    riskPoints: safeArray(rawPortfolioAnalysis.riskPoints),
    suggestions: safeArray(rawPortfolioAnalysis.suggestions),
  };

  const reportTags = safeArray(safeReport?.tags);
  const riskPointItems = portfolioAnalysis.riskPoints.length > 0
    ? portfolioAnalysis.riskPoints
    : ["현재 자산 비중과 기대지표를 기준으로 리스크를 점검합니다."];
  const suggestionItems = portfolioAnalysis.suggestions.length > 0
    ? portfolioAnalysis.suggestions
    : ["목표비중을 조정해 장기 성과와 하락 위험의 변화를 비교해보세요."];

  const investmentYears = safeNumber(safeSettings.years, 0);
  const monthlyDividend = Math.floor(safeNumber(expectedAnnualDividend) / 12);
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
  ];

  const dividendMetrics = [
    { label: "예상 연배당금", value: `${Math.floor(safeNumber(expectedAnnualDividend)).toLocaleString()}원`, note: "현재 평가금액 기준" },
    { label: "월 예상 배당금", value: `${safeFormatNumber(monthlyDividend)}원`, note: "연배당금의 월 환산" },
    { label: "예상 배당률", value: `${safeFixed(expectedDividendYield)}%`, note: "포트폴리오 가중 평균" },
    { label: "배당재투자", value: safeSettings.dividendReinvest ? "적용" : "미적용", note: "장기 복리 효과 반영 여부" },
  ];

  if (safeResult.ready === false || safeResult.status === "blocked") {
    return (
      <div id="detail" className="simulatorTabPanel detailPanel">
        <div className="tabSectionHeader tabSectionHeaderRow">
          <div>
            <p className="sectionLabel">Step 3. Detail</p>
            <h3>기준 계산 보류</h3>
            <p>지표 출처 확인이 끝나야 이 포트폴리오의 상세 분석을 표시할 수 있습니다.</p>
          </div>
        </div>
        <div className="detailInfoSection">
          <div className="detailInfoHeader">
            <p className="sectionLabel">Baseline Status</p>
            <h4>계산 보류</h4>
            <span>준비된 지표만 순위와 차트, 상세 분석에 포함됩니다.</span>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="portfolioIntegratedDiagnosis detailStep3ExecutiveSection">
        <div className="portfolioIntegratedHeader">
          <div>
            <p className="sectionLabel">Portfolio Diagnosis</p>
            <h4>포트폴리오 종합 진단</h4>
            <p className="portfolioIntegratedLead">
              {safeReport?.summary || portfolioAnalysis.profileSummary}
            </p>
          </div>

          {reportTags.length > 0 ? (
            <div className="portfolioDetailTags portfolioIntegratedTags">
              {reportTags.map((tag) => <span key={tag}>#{tag}</span>)}
            </div>
          ) : null}
        </div>

        <div className="portfolioIntegratedReportGrid portfolioIntegratedFocusGrid">
          <article className="portfolioIntegratedFocusCard primaryMetricCard">
            <span>{investmentYears}년 후 예상 자산</span>
            <strong>{safeFormatNumber(futureValue)}원</strong>
            <p>물가 반영 전 예상값입니다. 실질가치는 {safeFormatNumber(inflationAdjustedFutureValue)}원으로 추정됩니다.</p>
          </article>

          <article className="portfolioIntegratedFocusCard">
            <span>성장성</span>
            <strong>예상 CAGR {safeFixed(expectedCagr)}%</strong>
            <p>{safeReport?.growthText || "성장 기대치를 확인합니다."}</p>
          </article>

          <article className="portfolioIntegratedFocusCard dangerMetricCard">
            <span>위험도</span>
            <strong>예상 MDD {safeFixed(simpleMdd)}%</strong>
            <p>{safeReport?.riskText || "하락 위험을 확인합니다."}</p>
          </article>

          <article className="portfolioIntegratedFocusCard">
            <span>배당</span>
            <strong>예상 배당률 {safeFixed(expectedDividendYield)}%</strong>
            <p>{safeReport?.dividendText || "배당 현금흐름을 확인합니다."}</p>
          </article>
        </div>

        <div className="portfolioIntegratedSectionGrid portfolioIntegratedTwoColumnGrid">
          <article className="portfolioIntegratedSection portfolioIntegratedProfileSection">
            <div className="portfolioIntegratedSectionTitleRow">
              <strong>포트폴리오 성격</strong>
              <span className="detailRiskBadge">리스크 {portfolioAnalysis.riskLevel}</span>
            </div>
            <p>{portfolioAnalysis.profileSummary}</p>
            {portfolioAnalysis.allocationSummary ? (
              <span className="detailMiniNote">상위 자산: {portfolioAnalysis.allocationSummary}</span>
            ) : null}
            {portfolioAnalysis.roleBreakdown.length > 0 ? (
              <div className="detailRoleList portfolioIntegratedRoleList">
                {portfolioAnalysis.roleBreakdown.map((role) => (
                  <div key={role.key || role.label} className="detailRoleItem">
                    <span>{role.label || "-"}</span>
                    <strong>{safeFixed(role.weight, 1)}%</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <article className="portfolioIntegratedSection portfolioIntegratedActionSection">
            <strong>활용 방향 및 개선 제안</strong>

            <div className="portfolioIntegratedActionBlock">
              <span>활용 방향</span>
              <p>{safeReport?.directionText || "목표비중을 조정해 장기 성과 변화를 비교해보세요."}</p>
            </div>

            <div className="portfolioIntegratedActionBlock">
              <span>리스크 진단</span>
              <ul>
                {riskPointItems.map((item, index) => <li key={`risk-${index}`}>{item}</li>)}
              </ul>
            </div>

            <div className="portfolioIntegratedActionBlock">
              <span>개선 제안</span>
              <ul>
                {suggestionItems.map((item, index) => <li key={`suggestion-${index}`}>{item}</li>)}
              </ul>
            </div>
          </article>
        </div>
      </div>

      <div className="detailInfoSection detailConditionsSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Analysis Conditions</p>
          <h4>분석 조건</h4>
          <span>월 투자금, 투자기간, 물가상승률, 배당재투자 여부를 공통 조건으로 적용합니다.</span>
        </div>

        <div className="detailConditionGrid">
          <div><span>월 투자금</span><strong>{safeFormatNumber(safeSettings.monthlyCashFlow)}원</strong></div>
          <div><span>투자기간</span><strong>{investmentYears}년</strong></div>
          <div><span>물가상승률</span><strong>{safeNumber(safeSettings.inflationRate)}%</strong></div>
          <div><span>배당재투자</span><strong>{safeSettings.dividendReinvest ? "적용" : "미적용"}</strong></div>
        </div>

        <div className="detailModelNotice">
          <p className="screenOnlyNoticeText">
            월 투자금은 매월 적립한다고 가정한 금액이며, 시뮬레이션에서는 연간 합산 금액으로 계산됩니다.
            투자금은 특정 자산에 개별 배분되는 방식이 아니라, 현재 자산 비중으로 산출한 포트폴리오 평균 CAGR,
            배당률, BETA, MDD를 기준으로 전체 포트폴리오에 반영합니다.
          </p>
        </div>
      </div>

      <div className="detailGroupedMetricsSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Detailed Metrics</p>
          <h4>상세 지표</h4>
          <span>포트폴리오의 성과, 위험, 배당 지표를 구분해 상세 흐름을 비교합니다.</span>
        </div>

        <div className="detailGroupedMetricGrid">
          <article className="detailGroupedMetricCard">
            <div className="detailGroupedMetricHeader"><span>Performance</span><strong>성과</strong></div>
            <dl>{performanceMetrics.map((metric) => <div key={metric.label}><dt>{metric.label}<small>{metric.note}</small></dt><dd>{metric.value}</dd></div>)}</dl>
          </article>

          <article className="detailGroupedMetricCard">
            <div className="detailGroupedMetricHeader"><span>Risk</span><strong>위험</strong></div>
            <dl>{riskMetrics.map((metric) => <div key={metric.label}><dt>{metric.label}<small>{metric.note}</small></dt><dd>{metric.value}</dd></div>)}</dl>
          </article>

          <article className="detailGroupedMetricCard">
            <div className="detailGroupedMetricHeader"><span>Dividend</span><strong>배당 / 현금흐름</strong></div>
            <dl>{dividendMetrics.map((metric) => <div key={metric.label}><dt>{metric.label}<small>{metric.note}</small></dt><dd>{metric.value}</dd></div>)}</dl>
          </article>
        </div>

        <div className="detailMetricHelpBox">
          <div>
            <p className="sectionLabel">Metric Guide</p>
            <strong>주요 지표 설명</strong>
          </div>
          <div className="detailMetricHelpList">
            <MetricTooltip label="CAGR">연평균 성장률입니다. 물가상승률보다 낮으면 실질 구매력이 줄 수 있어, 최소 기준은 물가상승률 초과입니다. 장기 포트폴리오는 5~8% 이상이면 양호, 10% 이상은 높은 성장 기대와 높은 위험을 함께 점검합니다.</MetricTooltip>
            <MetricTooltip label="BETA">시장 대비 민감도입니다. 1.0은 시장 수준, 0.7 이하는 방어적, 0.8~1.2는 보통, 1.3 이상은 공격적 성향으로 봅니다. 1보다 클수록 상승·하락 모두 크게 움직일 수 있습니다.</MetricTooltip>
            <MetricTooltip label="MDD">고점 대비 최대 하락률입니다. 0~-15%는 낮은 낙폭, -15~-30%는 보통, -30~-50%는 공격형, -50% 이하는 고위험으로 봅니다. 절댓값이 작을수록 안정적입니다.</MetricTooltip>
            <MetricTooltip label="Calmar">CAGR을 MDD 절댓값으로 나눈 지표입니다. 높을수록 하락 위험 대비 수익 효율이 좋습니다. 0.5 미만은 취약, 0.5~1.0은 보통, 1.0 이상은 양호, 2.0 이상은 매우 우수로 참고합니다.</MetricTooltip>
          </div>
        </div>
      </div>

      <div className="detailInfoSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Assets</p>
          <h4>자산 구성</h4>
          <span>현재 선택 포트폴리오를 구성하는 자산별 평가금액, 비중, 기대지표입니다.</span>
        </div>
        <DetailAssetTable assets={safeAssets} totalAssetValue={safeTotalAssetValue} formatNumber={safeFormatNumber} formatPercent={safeFormatPercent} formatDecimal={safeFormatDecimal} formatWholeNumber={safeFormatWholeNumber} />
      </div>

      {safePerformanceRows.length > 0 ? <PerformanceChart rows={safePerformanceRows} /> : null}

      <div className="performanceSection">
        <div className="performanceHeader">
          <div><p className="sectionLabel">Annual Performance</p><h3>연차별 예상 성과</h3></div>
          <p>현재 평가금액, 연간 투자금, 포트폴리오 평균 지표를 기준으로 연차별 성과를 예상합니다.</p>
        </div>

        <div className="performanceTableWrap">
          <table className="performanceTable">
            <thead>
              <tr>
                <th>연차</th><th>연 투자금</th><th>연 배당금</th><th>연 수익금</th><th>누적 투자금</th><th>누적 배당금</th><th>누적 수익금</th><th>예상 평가금액</th><th>물가 반영 평가금액</th>
              </tr>
            </thead>
            <tbody>
              {safePerformanceRows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}년차</td>
                  <td>{Math.floor(safeNumber(row.annualContribution)).toLocaleString()}원</td>
                  <td>{Math.floor(safeNumber(row.annualDividend)).toLocaleString()}원</td>
                  <td>{Math.floor(safeNumber(row.annualProfit)).toLocaleString()}원</td>
                  <td>{Math.floor(safeNumber(row.cumulativeContribution)).toLocaleString()}원</td>
                  <td>{Math.floor(safeNumber(row.cumulativeDividend)).toLocaleString()}원</td>
                  <td>{Math.floor(safeNumber(row.cumulativeProfit)).toLocaleString()}원</td>
                  <td className="strongCell">{Math.floor(safeNumber(row.endingValue)).toLocaleString()}원</td>
                  <td className="strongCell realValueCell">{Math.floor(safeNumber(row.inflationAdjustedValue)).toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="calculatorNotice">
        ※ 본 결과는 포트폴리오 모델의 가정과 입력값을 바탕으로 산출한 장기 예상치이며, 실제 성과는 시장 상황, 금리, 환율, 지정학적 이슈 등에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}
