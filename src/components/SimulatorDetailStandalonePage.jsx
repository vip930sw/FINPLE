import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";

function safeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function safeFormatNumber(formatNumber, value) {
  if (typeof formatNumber === "function") return formatNumber(value);
  return Math.floor(safeNumber(value)).toLocaleString();
}

function safeFileName(reportPdfFileName, activePortfolio) {
  if (typeof reportPdfFileName === "function") {
    try {
      return reportPdfFileName();
    } catch (error) {
      return "FINPLE-report.pdf";
    }
  }

  if (typeof reportPdfFileName === "string" && reportPdfFileName.trim()) return reportPdfFileName;
  return `${String(activePortfolio?.name || "FINPLE-report").replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
}

function goTo(path) {
  window.location.href = path;
}

export default function SimulatorDetailStandalonePage() {
  const {
    activePortfolio,
    settings,
    assets,
    futureValue,
    inflationAdjustedFutureValue,
    expectedCagr,
    expectedDividendYield,
    expectedBeta,
    simpleMdd,
    expectedCalmar,
    expectedAnnualDividend,
    formatNumber,
    saveReportPdf,
    printReport,
    reportPdfFileName,
    copyReportSummary,
  } = usePortfolioSimulator();

  const safeAssets = Array.isArray(assets) ? assets : [];
  const fileName = safeFileName(reportPdfFileName, activePortfolio);
  const validAssets = safeAssets.filter((asset) => String(asset?.ticker || "").trim());
  const validAssetCount = validAssets.length;

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

      <section id="detail" className="section calculatorSection simulatorSection detailPanel" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="tabSectionHeader tabSectionHeaderRow">
          <div>
            <p className="sectionLabel">Step 3. Detail</p>
            <h2>상세분석</h2>
            <p>
              시뮬레이터 Step 1/2와 분리된 상세분석 전용 화면입니다. PDF 저장과 인쇄 기능을 우선 점검합니다.
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
            <p className="pdfFileNameHint">저장 권장 파일명: {fileName}</p>
          </div>
        </div>

        <div className="simulatorTabNav threeStepNav" style={{ marginBottom: 28 }}>
          <button type="button" className="simulatorTabButton" onClick={() => goTo("/simulator")}><span>STEP 1</span><strong>시뮬레이터</strong></button>
          <button type="button" className="simulatorTabButton" onClick={() => goTo("/simulator")}><span>STEP 2</span><strong>포트폴리오</strong></button>
          <button type="button" className="simulatorTabButton active"><span>STEP 3</span><strong>상세분석</strong></button>
        </div>

        <div className="detailHeroGrid">
          <article className="detailHeroMain">
            <p className="sectionLabel">Projection</p>
            <h3>{safeNumber(settings?.years, 0)}년 후 예상 자산</h3>
            <strong>{safeFormatNumber(formatNumber, futureValue)}원</strong>
            <span>물가 반영 실질가치 {safeFormatNumber(formatNumber, inflationAdjustedFutureValue)}원</span>
          </article>

          <article className="detailHeroProfile">
            <p className="sectionLabel">Portfolio</p>
            <h3>{activePortfolio?.name || "포트폴리오"}</h3>
            <span>현재 자산 {validAssetCount}개 기준으로 상세분석을 표시합니다.</span>
            <div className="portfolioProfileTags">
              <i>CAGR {safeNumber(expectedCagr).toFixed(2)}%</i>
              <i>BETA {safeNumber(expectedBeta).toFixed(2)}</i>
              <i>MDD {safeNumber(simpleMdd).toFixed(2)}%</i>
            </div>
          </article>
        </div>

        <div className="detailMetricSection">
          <div className="detailMetricHeader"><div><p className="sectionLabel">Summary</p><h4>핵심 지표</h4></div></div>
          <div className="detailMetricGrid">
            <article><span>예상 CAGR</span><strong>{safeNumber(expectedCagr).toFixed(2)}%</strong><p>자산 비중 가중 평균</p></article>
            <article><span>예상 배당률</span><strong>{safeNumber(expectedDividendYield).toFixed(2)}%</strong><p>포트폴리오 기준</p></article>
            <article><span>예상 BETA</span><strong>{safeNumber(expectedBeta).toFixed(2)}</strong><p>시장 민감도</p></article>
            <article><span>예상 MDD</span><strong>{safeNumber(simpleMdd).toFixed(2)}%</strong><p>최대 하락폭</p></article>
            <article><span>예상 Calmar</span><strong>{safeNumber(expectedCalmar).toFixed(2)}</strong><p>수익 대비 낙폭 효율</p></article>
            <article><span>예상 연배당금</span><strong>{safeFormatNumber(formatNumber, expectedAnnualDividend)}원</strong><p>현재 평가금액 기준</p></article>
          </div>
        </div>

        <div className="portfolioDetailReport">
          <div className="portfolioDetailReportHeader"><div><p className="sectionLabel">Assets</p><h4>자산 목록</h4></div></div>
          <div className="calculatorTableWrap">
            <table className="calculatorTable alignedAssetTable">
              <thead><tr><th>티커</th><th>자산명</th><th className="numberHeader">수량</th><th className="numberHeader">현재가</th><th className="numberHeader">평가금액</th></tr></thead>
              <tbody>
                {validAssets.map((asset, index) => {
                  const quantity = safeNumber(asset.quantity);
                  const price = safeNumber(asset.price);
                  const value = quantity * price;
                  return (
                    <tr key={`${asset.ticker || "asset"}-${index}`}>
                      <td>{asset.ticker || "-"}</td>
                      <td>{asset.name || "-"}</td>
                      <td className="numberCell tableNumberCell">{quantity.toFixed(4)}</td>
                      <td className="numberCell tableNumberCell">{safeFormatNumber(formatNumber, price)}</td>
                      <td className="numberCell tableNumberCell">{safeFormatNumber(formatNumber, value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detailReportActions" style={{ marginTop: 24 }}>
          <button type="button" onClick={() => goTo("/simulator")}>시뮬레이터로 돌아가기</button>
          <button type="button" className="primaryReportAction" onClick={saveReportPdf}>PDF 저장 다시 시도</button>
        </div>
      </section>

      <footer className="footer siteFooter">
        <div className="siteFooterBrandBlock"><strong>FINPLE Portfolio Lab</strong><span>© 2026 FINPLE. Beta service.</span></div>
        <p className="siteFooterNotice">FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며, 특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.</p>
      </footer>
    </main>
  );
}
