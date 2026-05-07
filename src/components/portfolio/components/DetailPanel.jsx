import PerformanceChart from "../../PerformanceChart";
import DetailAssetTable from "./DetailAssetTable";
import { analyzePortfolioProfile } from "../utils/portfolioCalculations";

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
  const portfolioAnalysis = analyzePortfolioProfile({ assets, result });
  const monthlyDividend = Math.floor(Number(expectedAnnualDividend || 0) / 12);

  return (
    <div id="detail" className="simulatorTabPanel detailPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 4. Detail</p>
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
            <button type="button" className="primaryReportAction" onClick={saveReportPdf}>
              PDF 저장
            </button>

            <button type="button" onClick={printReport}>
              인쇄
            </button>

            <button type="button" onClick={copyReportSummary}>
              공유 문구 복사
            </button>
          </div>

          <p className="pdfFileNameHint">
            저장 권장 파일명: {reportPdfFileName}
          </p>
        </div>
      </div>

      {detailReport && (
        <div className="portfolioDetailReport">
          <div className="portfolioDetailReportHeader">
            <div>
              <p className="sectionLabel">Summary Report</p>
              <h4>포트폴리오 요약 리포트</h4>
            </div>

            <div className="portfolioDetailReportMeta">
              <span className="portfolioDetailTypeBadge">{detailReport.type}</span>

              {detailReport.tags && detailReport.tags.length > 0 && (
                <div className="portfolioDetailTags">
                  {detailReport.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="portfolioDetailReportLead">{detailReport.summary}</p>

          <div className="portfolioDetailReportGrid">
            <div>
              <strong>성장성</strong>
              <p>{detailReport.growthText}</p>
            </div>

            <div>
              <strong>위험도</strong>
              <p>{detailReport.riskText}</p>
            </div>

            <div>
              <strong>배당</strong>
              <p>{detailReport.dividendText}</p>
            </div>

            <div>
              <strong>활용 방향</strong>
              <p>{detailReport.directionText}</p>
            </div>
          </div>
        </div>
      )}

      <div className="detailExecutiveSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Executive Summary</p>
          <h4>핵심 요약</h4>
          <span>현재 자산 비중과 기대지표를 기준으로 포트폴리오의 성격과 주요 리스크를 요약합니다.</span>
        </div>

        <div className="detailMetricGrid">
          <div className="detailMetricCard primaryMetricCard">
            <span>총 평가금액</span>
            <strong>{formatNumber(result.totalAssetValue)}원</strong>
            <p>현재 보유 수량과 현재가 기준</p>
          </div>

          <div className="detailMetricCard">
            <span>예상 CAGR</span>
            <strong>{expectedCagr.toFixed(2)}%</strong>
            <p>자산 비중 가중 평균</p>
          </div>

          <div className="detailMetricCard dangerMetricCard">
            <span>예상 MDD</span>
            <strong>{simpleMdd.toFixed(2)}%</strong>
            <p>하락장 손실폭 참고 지표</p>
          </div>

          <div className="detailMetricCard">
            <span>예상 배당률</span>
            <strong>{expectedDividendYield.toFixed(2)}%</strong>
            <p>현재 평가금액 기준</p>
          </div>

          <div className="detailMetricCard">
            <span>월 예상 배당금</span>
            <strong>{formatNumber(monthlyDividend)}원</strong>
            <p>연 예상 배당금의 월 환산</p>
          </div>

          <div className="detailMetricCard primaryMetricCard">
            <span>{settings.years}년 후 예상 자산</span>
            <strong>{formatNumber(futureValue)}원</strong>
            <p>물가 반영 전 장기 예상값</p>
          </div>
        </div>

        <div className="detailNarrativeGrid">
          <div className="detailNarrativeCard wideNarrativeCard">
            <div className="detailNarrativeTitleRow">
              <strong>포트폴리오 성격 요약</strong>
              <span className="detailRiskBadge">리스크 {portfolioAnalysis.riskLevel}</span>
            </div>
            <p>{portfolioAnalysis.profileSummary}</p>
            {portfolioAnalysis.allocationSummary && (
              <span className="detailMiniNote">상위 자산: {portfolioAnalysis.allocationSummary}</span>
            )}
          </div>

          <div className="detailNarrativeCard">
            <strong>자산 역할 비중</strong>
            <div className="detailRoleList">
              {portfolioAnalysis.roleBreakdown.map((role) => (
                <div key={role.key} className="detailRoleItem">
                  <span>{role.label}</span>
                  <strong>{role.weight.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="detailDiagnosisGrid">
        <div className="detailDiagnosisCard">
          <div className="detailInfoHeader compactDetailHeader">
            <p className="sectionLabel">Risk Check</p>
            <h4>리스크 진단</h4>
          </div>
          <ul>
            {portfolioAnalysis.riskPoints.map((item, index) => (
              <li key={`risk-${index}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="detailDiagnosisCard suggestionDiagnosisCard">
          <div className="detailInfoHeader compactDetailHeader">
            <p className="sectionLabel">Suggestions</p>
            <h4>개선 제안</h4>
          </div>
          <ul>
            {portfolioAnalysis.suggestions.map((item, index) => (
              <li key={`suggestion-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="detailInfoSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Analysis Conditions</p>
          <h4>분석 조건</h4>
          <span>
            월 투자금, 투자기간, 물가상승률, 배당재투자 여부를 공통 조건으로 적용합니다.
          </span>
        </div>

        <div className="detailConditionGrid">
          <div>
            <span>월 투자금</span>
            <strong>{formatNumber(settings.monthlyCashFlow)}원</strong>
          </div>

          <div>
            <span>투자기간</span>
            <strong>{settings.years}년</strong>
          </div>

          <div>
            <span>물가상승률</span>
            <strong>{settings.inflationRate}%</strong>
          </div>

          <div>
            <span>배당재투자</span>
            <strong>{settings.dividendReinvest ? "적용" : "미적용"}</strong>
          </div>
        </div>

        <div className="detailModelNotice">
          <strong>계산 방식 안내</strong>

          <p className="screenOnlyNoticeText">
            월 투자금은 매월 적립한다고 가정한 금액이며, 시뮬레이션에서는
            연간 합산 금액으로 계산됩니다. 투자금은 특정 자산에 개별 배분되는
            방식이 아니라, 현재 자산 비중으로 산출한 포트폴리오 평균 CAGR,
            배당률, BETA, MDD를 기준으로 전체 포트폴리오에 반영합니다.
          </p>

          <p className="screenOnlyNoticeText">
            현재 버전은 자산별 개별 매수·매도, 매년 리밸런싱, 자산별 가격 경로를
            직접 계산하지 않습니다.
          </p>

          <p className="printOnlyNoticeText">
            본 시뮬레이션은 자산별 개별 매수·매도나 매년 리밸런싱을 반영하지 않으며,
            현재 자산 비중으로 계산한 포트폴리오 평균 지표를 기준으로 장기 성과를 추정합니다.
          </p>
        </div>
      </div>

      <div className="calculatorSummary expectedSummary">
        <div className="summaryCard">
          <p>시작 평가금액</p>
          <strong>{Math.floor(simulationStartValue).toLocaleString()}원</strong>
        </div>

        <div className="summaryCard">
          <p>연간 투자금</p>
          <strong>{Math.floor(yearlyContribution).toLocaleString()}원</strong>
        </div>

        <div className="summaryCard">
          <p>예상 연배당금</p>
          <strong>{expectedAnnualDividend.toLocaleString()}원</strong>
        </div>

        <div className="summaryCard">
          <p>예상 배당률</p>
          <strong>{expectedDividendYield.toFixed(2)}%</strong>
        </div>

        <div className="summaryCard">
          <p>예상 CAGR</p>
          <strong>{expectedCagr.toFixed(2)}%</strong>
        </div>

        <div className="summaryCard">
          <p>예상 BETA</p>
          <strong>{expectedBeta.toFixed(2)}</strong>
        </div>

        <div className="summaryCard">
          <p>예상 CALMAR</p>
          <strong>{expectedCalmar.toFixed(2)}</strong>
        </div>

        <div className="summaryCard">
          <p>예상 MDD</p>
          <strong>{simpleMdd.toFixed(2)}%</strong>
        </div>
      </div>

      <div className="finalValueRow">
        <div className="summaryCard finalValueCard">
          <p>{settings.years}년 후 예상 평가금액</p>
          <strong>{futureValue.toLocaleString()}원</strong>
        </div>

        <div className="summaryCard finalValueCard realValueCard">
          <p>물가 반영 예상 평가금액</p>
          <strong>{inflationAdjustedFutureValue.toLocaleString()}원</strong>
        </div>
      </div>

      <div className="detailInfoSection">
        <div className="detailInfoHeader">
          <p className="sectionLabel">Assets</p>
          <h4>자산 구성</h4>
          <span>
            현재 선택 포트폴리오를 구성하는 자산별 평가금액, 비중, 기대지표입니다.
          </span>
        </div>

        <DetailAssetTable
          assets={assets}
          totalAssetValue={result.totalAssetValue}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
          formatDecimal={formatDecimal}
        />
      </div>

      <PerformanceChart rows={performanceRows} />

      <div className="performanceSection">
        <div className="performanceHeader">
          <div>
            <p className="sectionLabel">Annual Performance</p>
            <h3>연차별 예상 성과</h3>
          </div>

          <p>
            현재 평가금액과 연간 투자금, 포트폴리오 평균 CAGR, 배당률을 기준으로
            계산한 연차별 예상 흐름입니다.
          </p>
        </div>

        <div className="performanceTableWrap">
          <table className="performanceTable">
            <thead>
              <tr>
                <th>연차</th>
                <th>연 투자금</th>
                <th>연 배당금</th>
                <th>연 수익금</th>
                <th>누적 투자금</th>
                <th>누적 배당금</th>
                <th>누적 수익금</th>
                <th>예상 평가금액</th>
                <th>물가 반영 평가금액</th>
              </tr>
            </thead>

            <tbody>
              {performanceRows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}년차</td>
                  <td>{Math.floor(row.annualContribution).toLocaleString()}원</td>
                  <td>{Math.floor(row.annualDividend).toLocaleString()}원</td>
                  <td>{Math.floor(row.annualProfit).toLocaleString()}원</td>
                  <td>{Math.floor(row.cumulativeContribution).toLocaleString()}원</td>
                  <td>{Math.floor(row.cumulativeDividend).toLocaleString()}원</td>
                  <td>{Math.floor(row.cumulativeProfit).toLocaleString()}원</td>
                  <td className="strongCell">
                    {Math.floor(row.endingValue).toLocaleString()}원
                  </td>
                  <td className="strongCell realValueCell">
                    {Math.floor(row.inflationAdjustedValue).toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="calculatorNotice">
        현재 버전은 사용자가 입력한 자산 구성과 기대지표를 기준으로 계산합니다.
        실시간 가격, 배당, 변동성 데이터는 이후 API 연동 단계에서 자동 반영할 수 있습니다.
      </p>
    </div>
  );
}
