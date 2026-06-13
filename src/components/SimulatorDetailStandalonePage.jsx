import { Component } from "react";
import DetailPanel from "./portfolio/components/DetailPanel";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";

function safeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function goTo(path) {
  window.location.href = path;
}

class DetailStandaloneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "상세분석 화면을 불러오지 못했습니다.",
    };
  }

  componentDidCatch(error) {
    console.error("FINPLE standalone detail render error", error);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="portfolioDetailReport">
        <div className="portfolioDetailReportHeader">
          <div>
            <p className="sectionLabel">Render Guard</p>
            <h4>상세분석 렌더링 오류</h4>
          </div>
        </div>
        <p>{this.state.message}</p>
        <p>
          상세분석 하위 구성요소에서 오류가 발생했습니다. 시뮬레이터 데이터는 유지되며,
          오류가 발생한 세부 컴포넌트를 분리해 다시 복구하겠습니다.
        </p>
        <div className="detailReportActions" style={{ marginTop: 16 }}>
          <button type="button" onClick={() => goTo("/simulator")}>시뮬레이터로 돌아가기</button>
        </div>
      </div>
    );
  }
}

export default function SimulatorDetailStandalonePage() {
  const simulator = usePortfolioSimulator();
  const {
    activePortfolio,
    settings,
    assets,
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
    detailReport,
    formatNumber,
    formatDecimal,
    formatPercent,
    downloadReportText,
    saveReportPdf,
    printReport,
    reportPdfFileName,
    copyReportSummary,
  } = simulator;

  const safeAssets = Array.isArray(assets) ? assets : [];
  const validAssetCount = safeAssets.filter((asset) => String(asset?.ticker || "").trim()).length;
  const resetKey = `${activePortfolio?.id || "portfolio"}-${validAssetCount}-${safeNumber(futureValue)}-${safeNumber(totalAssetValue)}`;

  return (
    <main className="page personalPage">
      <header className="header">
        <button className="brandLogo resetButton" onClick={() => goTo("/")}> 
          <div className="brandIcon"><span>F</span><i /></div>
          <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>
        <nav className="headerNav">
          <button type="button" onClick={() => goTo("/simulator")}>시뮬레이터</button>
          <button type="button" onClick={() => goTo("/simulator")}>포트폴리오</button>
          <button type="button" className="active">상세분석</button>
        </nav>
        <nav className="headerNav">
          <button type="button" onClick={() => goTo("/")}>홈</button>
          <button type="button" className="primaryButton" onClick={() => goTo("/start")}>시작하기</button>
          <button type="button" onClick={() => goTo("/pricing")}>요금제</button>
          <button type="button" onClick={() => goTo("/support")}>문의사항</button>
          <button type="button" onClick={() => goTo("/mypage")}>MY PAGE</button>
        </nav>
      </header>

      <section id="detail" className="section calculatorSection simulatorSection" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="simulatorTabNav threeStepNav" style={{ marginBottom: 28 }}>
          <button type="button" className="simulatorTabButton" onClick={() => goTo("/simulator")}><span>STEP 1</span><strong>시뮬레이터</strong></button>
          <button type="button" className="simulatorTabButton" onClick={() => goTo("/simulator")}><span>STEP 2</span><strong>포트폴리오</strong></button>
          <button type="button" className="simulatorTabButton active"><span>STEP 3</span><strong>상세분석</strong></button>
        </div>

        <DetailStandaloneErrorBoundary resetKey={resetKey}>
          <DetailPanel
            activePortfolio={activePortfolio}
            detailReport={detailReport}
            settings={settings}
            result={result}
            yearlyContribution={yearlyContribution}
            simulationStartValue={simulationStartValue}
            expectedCagr={expectedCagr}
            expectedDividendYield={expectedDividendYield}
            expectedBeta={expectedBeta}
            simpleMdd={simpleMdd}
            expectedCalmar={expectedCalmar}
            expectedAnnualDividend={expectedAnnualDividend}
            performanceRows={performanceRows}
            futureValue={futureValue}
            inflationAdjustedFutureValue={inflationAdjustedFutureValue}
            assets={safeAssets}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
            formatDecimal={formatDecimal}
            downloadReportText={downloadReportText}
            saveReportPdf={saveReportPdf}
            printReport={printReport}
            reportPdfFileName={reportPdfFileName}
            copyReportSummary={copyReportSummary}
          />
        </DetailStandaloneErrorBoundary>

        <div className="detailReportActions" style={{ marginTop: 24 }}>
          <button type="button" onClick={() => goTo("/simulator")}>시뮬레이터로 돌아가기</button>
        </div>
      </section>

      <footer className="footer siteFooter">
        <div className="siteFooterBrandBlock"><strong>FINPLE Portfolio Lab</strong><span>© 2026 FINPLE.</span></div>
        <p className="siteFooterNotice">FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며, 특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.</p>
      </footer>
    </main>
  );
}
