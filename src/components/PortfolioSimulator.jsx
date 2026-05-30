import { Component, forwardRef, useEffect, useImperativeHandle } from "react";

import PortfolioManagerPanel from "./portfolio/components/PortfolioManagerPanel";
import SimulatorTabNav from "./portfolio/components/SimulatorTabNav";
import ComparePanel from "./portfolio/components/ComparePanel";
import SettingsPanel from "./portfolio/components/SettingsPanel";
import DetailPanel from "./portfolio/components/DetailPanel";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";

const PORTFOLIO_SIMULATOR_TABS = ["settings", "compare", "detail"];

class DetailErrorBoundary extends Component {
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
    console.error("FINPLE detail panel render error", error);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div id="detail" className="simulatorTabPanel detailPanel">
        <div className="tabSectionHeader">
          <p className="sectionLabel">Step 3. Detail</p>
          <h3>상세분석 화면을 준비 중입니다</h3>
          <p>
            현재 포트폴리오 계산값은 유지되고 있으나, 상세분석 하위 구성요소에서 렌더링 오류가 발생했습니다.
            시뮬레이터와 포트폴리오 탭은 계속 사용할 수 있습니다.
          </p>
        </div>
        <div className="portfolioDetailReport">
          <div className="portfolioDetailReportHeader">
            <div>
              <p className="sectionLabel">Render Guard</p>
              <h4>상세분석 보호 화면</h4>
            </div>
          </div>
          <p>{this.state.message}</p>
          <p>
            PDF 검수는 상세분석 렌더링 오류를 제거한 뒤 다시 진행하는 것이 안전합니다.
          </p>
        </div>
      </div>
    );
  }
}

const PortfolioSimulator = forwardRef(function PortfolioSimulator(props, ref) {
  const {
    initialTab = "settings",
  } = props || {};

  const {
    portfolioList,
    activePortfolioId,
    activePortfolio,
    settings,
    assets,
    targetWeightDrafts,
    targetWeightSummary,
    assetLookupStatus,
    isBulkAssetLookupLoading,
    assetLookupSummary,
    recentlyAddedAssetId,
    dataManagementSummary,
    activeSimulatorTab,
    isPortfolioDropdownOpen,
    setIsPortfolioDropdownOpen,
    isNewPortfolioMenuOpen,
    setIsNewPortfolioMenuOpen,
    backupFileInputRef,
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
    insightComparisonPortfolios,
    chartComparisonPortfolios,
    detailReport,
    updateSetting,
    updateAsset,
    updateTargetWeightDraft,
    applyTargetWeights,
    resetTargetWeights,
    equalizeTargetWeights,
    fetchAssetData,
    fetchAllAssetData,
    resolveTickerCandidate,
    addAsset,
    removeAsset,
    cleanEmptyAssetRows,
    selectPortfolio,
    createPortfolioFromTemplate,
    duplicateActivePortfolio,
    downloadPortfolioBackup,
    openPortfolioBackupFile,
    restorePortfolioBackup,
    downloadReportText,
    saveReportPdf,
    printReport,
    reportPdfFileName,
    copyReportSummary,
    renameActivePortfolio,
    deleteActivePortfolio,
    resetActivePortfolioAssets,
    resetGlobalSettings,
    changeSimulatorTab,
    scrollToPortfolioTop,
    selectPortfolioFromFloating,
    formatNumber,
    formatDecimal,
    formatPercent,
    toNumber,
    isAutoAsset,
    isAutoPriceAsset,
    isAutoMetricAsset,
    isEmptyAssetRow
  } = usePortfolioSimulator();

  const effectiveInitialTab = PORTFOLIO_SIMULATOR_TABS.includes(initialTab)
    ? initialTab
    : "settings";

  const effectiveActiveSimulatorTab = PORTFOLIO_SIMULATOR_TABS.includes(activeSimulatorTab)
    ? activeSimulatorTab
    : effectiveInitialTab;

  useEffect(() => {
    if (effectiveInitialTab !== activeSimulatorTab) {
      changeSimulatorTab(effectiveInitialTab);
    }
  }, [effectiveInitialTab]);

  function scrollToSimulatorTop() {
    window.setTimeout(() => {
      document.getElementById("simulator")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function scrollToSimulatorTab(nextTab) {
    const anchorMap = {
      settings: "settings",
      compare: "compare",
      detail: "detail",
    };

    const anchorId = anchorMap[nextTab] || "simulator";

    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function handleSimulatorTabChange(nextTab, options = {}) {
    changeSimulatorTab(nextTab);

    if (options.scroll !== false) {
      scrollToSimulatorTab(nextTab);
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      changeTab(nextTab, options = {}) {
        handleSimulatorTabChange(nextTab, options);
      },
      scrollToTop() {
        scrollToSimulatorTop();
      },
    }),
    [changeSimulatorTab]
  );

  const shouldShowFloatingPortfolioDropdown = ["settings", "detail"].includes(
    effectiveActiveSimulatorTab
  );

  const floatingPortfolioContextLabel =
    effectiveActiveSimulatorTab === "settings" ? "현재 편집 중" : "현재 분석 중";

  return (
    <section id="simulator" className="section calculatorSection simulatorSection">
      <p className="sectionLabel">Portfolio Simulator</p>
      <h2>FINPLE 포트폴리오 시뮬레이터</h2>
      <p className="simulatorIntroText">
        국내·해외 자산의 현재가를 조회하고, CSV 기반 CAGR, BETA, MDD,
        배당률을 결합해 장기 포트폴리오 성과와 실질가치를 계산합니다.
      </p>

      <SimulatorTabNav
        activeSimulatorTab={effectiveActiveSimulatorTab}
        changeSimulatorTab={handleSimulatorTabChange}
      />

      {effectiveActiveSimulatorTab === "compare" && (
        <div id="compare" className="simulatorTabAnchor">
          <ComparePanel
            insightComparisonPortfolios={insightComparisonPortfolios}
            chartComparisonPortfolios={chartComparisonPortfolios}
          />
        </div>
      )}

      {effectiveActiveSimulatorTab === "settings" && (
        <div id="settings" className="simulatorTabAnchor">
          <SettingsPanel
            settings={settings}
            totalAssetValue={totalAssetValue}
            simulationStartValue={simulationStartValue}
            assets={assets}
            targetWeightDrafts={targetWeightDrafts}
            targetWeightSummary={targetWeightSummary}
            formatNumber={formatNumber}
            formatDecimal={formatDecimal}
            formatPercent={formatPercent}
            toNumber={toNumber}
            updateSetting={updateSetting}
            updateAsset={updateAsset}
            updateTargetWeightDraft={updateTargetWeightDraft}
            applyTargetWeights={applyTargetWeights}
            resetTargetWeights={resetTargetWeights}
            equalizeTargetWeights={equalizeTargetWeights}
            isEmptyAssetRow={isEmptyAssetRow}
            isAutoAsset={isAutoAsset}
            isAutoPriceAsset={isAutoPriceAsset}
            isAutoMetricAsset={isAutoMetricAsset}
            assetLookupStatus={assetLookupStatus}
            isBulkAssetLookupLoading={isBulkAssetLookupLoading}
            assetLookupSummary={assetLookupSummary}
            recentlyAddedAssetId={recentlyAddedAssetId}
            fetchAssetData={fetchAssetData}
            fetchAllAssetData={fetchAllAssetData}
            resolveTickerCandidate={resolveTickerCandidate}
            removeAsset={removeAsset}
            addAsset={addAsset}
            cleanEmptyAssetRows={cleanEmptyAssetRows}
            resetActivePortfolioAssets={resetActivePortfolioAssets}
            resetGlobalSettings={resetGlobalSettings}
          />
        </div>
      )}

      {effectiveActiveSimulatorTab === "detail" && (
        <div id="detail" className="simulatorTabAnchor">
          <DetailErrorBoundary resetKey={`${activePortfolioId}-${assets.length}-${futureValue}`}>
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
              assets={assets}
              formatNumber={formatNumber}
              formatPercent={formatPercent}
              formatDecimal={formatDecimal}
              downloadReportText={downloadReportText}
              saveReportPdf={saveReportPdf}
              printReport={printReport}
              reportPdfFileName={reportPdfFileName}
              copyReportSummary={copyReportSummary}
            />
          </DetailErrorBoundary>
        </div>
      )}

      <div id="portfolio" className="portfolioAnchor">
        <PortfolioManagerPanel
          portfolioList={portfolioList}
          activePortfolioId={activePortfolioId}
          activePortfolio={activePortfolio}
          isNewPortfolioMenuOpen={isNewPortfolioMenuOpen}
          setIsNewPortfolioMenuOpen={setIsNewPortfolioMenuOpen}
          createPortfolioFromTemplate={createPortfolioFromTemplate}
          duplicateActivePortfolio={duplicateActivePortfolio}
          selectPortfolio={selectPortfolio}
          renameActivePortfolio={renameActivePortfolio}
          deleteActivePortfolio={deleteActivePortfolio}
          downloadPortfolioBackup={downloadPortfolioBackup}
          openPortfolioBackupFile={openPortfolioBackupFile}
          backupFileInputRef={backupFileInputRef}
          restorePortfolioBackup={restorePortfolioBackup}
          dataManagementSummary={dataManagementSummary}
          scrollToPortfolioTop={scrollToPortfolioTop}
        />
      </div>

      {shouldShowFloatingPortfolioDropdown ? (
        <FloatingPortfolioDropdown
          activePortfolio={activePortfolio}
          portfolioList={portfolioList}
          activePortfolioId={activePortfolioId}
          isPortfolioDropdownOpen={isPortfolioDropdownOpen}
          setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen}
          selectPortfolioFromFloating={selectPortfolioFromFloating}
          contextLabel={floatingPortfolioContextLabel}
        />
      ) : null}

      <button
        className="floatingTopButton"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="시뮬레이터 상단으로 이동"
      >
        ↑ TOP
      </button>
    </section>
  );
});

export default PortfolioSimulator;
