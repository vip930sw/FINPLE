import AssetFinderPanel from "./portfolio/components/AssetFinderPanel";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";
import "./ScreenerPage.css";

function ScreenerPage({ onBack, onHome, onOpenSimulator }) {
  const {
    portfolioList,
    activePortfolioId,
    activePortfolio,
    assets,
    isBulkAssetLookupLoading,
    assetLookupSummary,
    recentlyAddedAssetId,
    isPortfolioDropdownOpen,
    setIsPortfolioDropdownOpen,
    selectPortfolioFromFloating,
    addAssetFromTickerCandidate,
    formatNumber,
    isEmptyAssetRow,
  } = usePortfolioSimulator();

  const activeAssetCount = assets.filter((asset) => !isEmptyAssetRow(asset)).length;
  const activePortfolioValue = assets.reduce(
    (sum, asset) => sum + Number(asset.price || 0) * Number(asset.quantity || 0),
    0
  );

  return (
    <main className="page screenerPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>

          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Asset Screener</span>
          </div>
        </button>

        <div className="headerActions">
          <button type="button" className="secondaryHeaderButton" onClick={onBack}>
            시작 메뉴
          </button>
          <button type="button" className="secondaryHeaderButton" onClick={onOpenSimulator}>
            시뮬레이터
          </button>
          <button type="button" className="headerButton" onClick={onHome}>
            홈으로
          </button>
        </div>
      </header>

      <section className="screenerHero">
        <p className="badge">Separate Asset Screener</p>
        <h1>자산 후보를 먼저 탐색하세요.</h1>
        <p>
          스크리너는 시뮬레이터 입력 화면과 분리된 탐색 공간입니다. ETF와 자산 후보를 먼저 찾아보고,
          필요한 항목만 현재 포트폴리오에 담은 뒤 시뮬레이터에서 수량과 비중을 정리할 수 있습니다.
        </p>

        <div className="screenerSummaryGrid">
          <article>
            <span>현재 추가 대상</span>
            <strong>{activePortfolio?.name || "포트폴리오"}</strong>
          </article>
          <article>
            <span>현재 자산</span>
            <strong>{activeAssetCount}개</strong>
          </article>
          <article>
            <span>평가금액</span>
            <strong>{formatNumber(activePortfolioValue)}원</strong>
          </article>
        </div>
      </section>

      <section className="section calculatorSection screenerStandaloneSection">
        <div className="tabSectionHeader">
          <p className="sectionLabel">Asset Screener</p>
          <h2>후보 자산을 탐색하고 포트폴리오에 담습니다.</h2>
          <p>
            추가한 자산은 현재 선택된 포트폴리오에 저장됩니다. 수량, 현재가, CAGR, BETA, MDD 등은
            시뮬레이터 화면에서 이어서 정리하면 됩니다.
          </p>
        </div>

        <div className="screenerStatusBox">
          <strong>최근 상태</strong>
          <p>{assetLookupSummary}</p>
          {recentlyAddedAssetId ? <span>방금 추가한 후보 자산이 있습니다.</span> : null}
        </div>

        <AssetFinderPanel
          assets={assets}
          addAssetFromTickerCandidate={addAssetFromTickerCandidate}
          isBulkAssetLookupLoading={isBulkAssetLookupLoading}
        />
      </section>

      <section className="screenerNextStep" role="note">
        <div>
          <strong>다음 단계</strong>
          <p>
            후보 자산을 담았다면 시뮬레이터에서 수량과 투자 조건을 입력하고 장기 성과를 확인하세요.
          </p>
        </div>
        <button type="button" onClick={onOpenSimulator}>
          시뮬레이터에서 비중 정리
        </button>
      </section>

      <FloatingPortfolioDropdown
        activePortfolio={activePortfolio}
        portfolioList={portfolioList}
        activePortfolioId={activePortfolioId}
        isPortfolioDropdownOpen={isPortfolioDropdownOpen}
        setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen}
        selectPortfolioFromFloating={selectPortfolioFromFloating}
        contextLabel="현재 추가 대상"
      />

      <button
        className="floatingTopButton"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="스크리너 상단으로 이동"
      >
        ↑ TOP
      </button>
    </main>
  );
}

export default ScreenerPage;
