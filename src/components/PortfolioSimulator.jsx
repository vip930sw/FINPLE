import { forwardRef, useImperativeHandle } from "react";

import PortfolioManagerPanel from "./portfolio/components/PortfolioManagerPanel";
import SimulatorTabNav from "./portfolio/components/SimulatorTabNav";
import ComparePanel from "./portfolio/components/ComparePanel";
import SettingsPanel from "./portfolio/components/SettingsPanel";
import AssetFinderPanel from "./portfolio/components/AssetFinderPanel";
import DetailPanel from "./portfolio/components/DetailPanel";
import FloatingPortfolioDropdown from "./portfolio/components/FloatingPortfolioDropdown";
import usePortfolioSimulator from "./portfolio/hooks/usePortfolioSimulator";

const PortfolioSimulator = forwardRef(function PortfolioSimulator(props, ref) {
  const {
    portfolioList,
    activePortfolioId,
    activePortfolio,
    settings,
    assets,
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
    fetchAssetData,
    fetchAllAssetData,
    resolveTickerCandidate,
    addAsset,
    addAssetFromTickerCandidate,
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

  function scrollToSimulatorTab(nextTab) {
    const anchorMap = {
      screener: "screener",
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
      changeTab(nextTab) {
        handleSimulatorTabChange(nextTab);
      },
    }),
    [changeSimulatorTab]
  );

  const shouldShowFloatingPortfolioDropdown = ["screener", "settings", "detail"].includes(
    activeSimulatorTab
  );

  const floatingPortfolioContextLabel =
    activeSimulatorTab === "screener"
      ? "현재 추가 대상"
      : activeSimulatorTab === "settings"
        ? "현재 편집 중"
        : "현재 분석 중";

  return (
          <section id="simulator" className="section calculatorSection simulatorSection">
          <p className="sectionLabel">Portfolio Simulator</p>
          <h2>CAGR 기반 포트폴리오 시뮬레이터</h2>
          <p className="simulatorIntroText">
              보유 자산의 평가금액을 시작점으로 삼고, 월 투자금과 자산별 CAGR,
              MDD, 배당률을 반영해 장기 포트폴리오 성과와 실질가치를 계산합니다.
          </p>

        <SimulatorTabNav
          activeSimulatorTab={activeSimulatorTab}
          changeSimulatorTab={handleSimulatorTabChange}
        />


        {activeSimulatorTab === "screener" && (
          <div id="screener" className="simulatorTabPanel screenerPanel">
            <div className="tabSectionHeader">
              <p className="sectionLabel">Step 1. Screener</p>
              <h3>자산 스크리너</h3>
              <p>
                티커를 몰라도 목표, 위험도, 유형으로 후보 자산을 찾고 현재 포트폴리오에 추가할 수 있습니다.
              </p>
            </div>
            <AssetFinderPanel
              assets={assets}
              addAssetFromTickerCandidate={addAssetFromTickerCandidate}
              isBulkAssetLookupLoading={isBulkAssetLookupLoading}
            />
          </div>
        )}

        {activeSimulatorTab === "compare" && (
          <div id="compare" className="simulatorTabAnchor">
            <ComparePanel
              insightComparisonPortfolios={insightComparisonPortfolios}
              chartComparisonPortfolios={chartComparisonPortfolios}
            />
          </div>
        )}

        {activeSimulatorTab === "settings" && (
          <div id="settings" className="simulatorTabAnchor">
          <SettingsPanel
            settings={settings}
            totalAssetValue={totalAssetValue}
            assets={assets}
            formatNumber={formatNumber}
            formatDecimal={formatDecimal}
            formatPercent={formatPercent}
            toNumber={toNumber}
            updateSetting={updateSetting}
            updateAsset={updateAsset}
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

        {activeSimulatorTab === "detail" && (
          <div id="detail" className="simulatorTabAnchor">
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
          />
        </div>

  {shouldShowFloatingPortfolioDropdown && (
          <FloatingPortfolioDropdown
            activePortfolio={activePortfolio}
            portfolioList={portfolioList}
            activePortfolioId={activePortfolioId}
            isPortfolioDropdownOpen={isPortfolioDropdownOpen}
            setIsPortfolioDropdownOpen={setIsPortfolioDropdownOpen}
            selectPortfolioFromFloating={selectPortfolioFromFloating}
            contextLabel={floatingPortfolioContextLabel}
          />
        )}

  <button
          className="floatingTopButton"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="포트폴리오 상단으로 이동"
        >
          ↑ TOP
        </button>

      </section>
    );
});

export default PortfolioSimulator;
