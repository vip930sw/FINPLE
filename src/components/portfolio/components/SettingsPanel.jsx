import AssetInputTable from "./AssetInputTable";

export default function SettingsPanel({
  settings,
  totalAssetValue,
  assets,
  formatNumber,
  formatDecimal,
  formatPercent,
  toNumber,
  updateSetting,
  updateAsset,
  isEmptyAssetRow,
  isAutoAsset,
  isAutoPriceAsset,
  isAutoMetricAsset,
  assetLookupStatus,
  isBulkAssetLookupLoading,
  assetLookupSummary,
  recentlyAddedAssetId,
  fetchAssetData,
  fetchAllAssetData,
  resolveTickerCandidate,
  removeAsset,
  addAsset,
  cleanEmptyAssetRows,
  resetActivePortfolioAssets,
  resetGlobalSettings,
}) {
  return (
    <div className="simulatorTabPanel settingsPanel">
      <div className="tabSectionHeader">
        <p className="sectionLabel">Step 2. Simulator</p>
        <h3>시뮬레이터 설정</h3>
        <p>선택한 자산의 수량과 투자 조건을 입력해 장기 성과를 계산합니다.</p>
      </div>

      <div className="simulatorControls">
        <div className="summaryCard">
          <p>월 투자금 (원)</p>
          <input
            type="text"
            value={formatNumber(settings.monthlyCashFlow)}
            onChange={(e) => updateSetting("monthlyCashFlow", toNumber(e.target.value))}
          />
        </div>

        <div className="summaryCard">
          <p>투자기간 (년)</p>
          <input type="number" value={settings.years} onChange={(e) => updateSetting("years", Number(e.target.value))} />
        </div>

        <div className="summaryCard">
          <p>물가상승률 (%)</p>
          <input
            type="number"
            value={settings.inflationRate}
            onChange={(e) => updateSetting("inflationRate", Number(e.target.value))}
            step="0.1"
          />
        </div>

        <div className="summaryCard">
          <p>배당재투자</p>
          <button className={settings.dividendReinvest ? "toggleButton active" : "toggleButton"} onClick={() => updateSetting("dividendReinvest", !settings.dividendReinvest)}>
            {settings.dividendReinvest ? "적용 중" : "미적용"}
          </button>
        </div>
      </div>

      <div className="assetValueNotice">
        <div>
          <p>시작 평가금액</p>
          <strong>{Math.floor(totalAssetValue).toLocaleString()}원</strong>
        </div>
        <div>
          <span>현재 선택 포트폴리오의 자산 합계를 시작 평가금액으로 사용합니다.</span>
          <small>포트폴리오별 자산 합계가 다르면 시작 평가금액도 달라집니다. 비교 탭에서는 동일한 월 투자금, 투자기간, 물가상승률 조건을 적용합니다.</small>
        </div>
      </div>

      {assetLookupSummary && <div className="assetLookupSummary" role="status">{assetLookupSummary}</div>}

      <div className="mobileDesktopNotice">
        모바일에서는 자산 입력 표를 좌우로 밀어 확인할 수 있습니다. 수량·현재가·CAGR·MDD 등을 많이 수정할 때는 PC 화면 사용을 권장합니다.
      </div>

      <AssetInputTable
        assets={assets}
        totalAssetValue={totalAssetValue}
        isEmptyAssetRow={isEmptyAssetRow}
        isAutoAsset={isAutoAsset}
        isAutoPriceAsset={isAutoPriceAsset}
        isAutoMetricAsset={isAutoMetricAsset}
        formatNumber={formatNumber}
        formatDecimal={formatDecimal}
        formatPercent={formatPercent}
        toNumber={toNumber}
        updateAsset={updateAsset}
        assetLookupStatus={assetLookupStatus}
        recentlyAddedAssetId={recentlyAddedAssetId}
        isBulkAssetLookupLoading={isBulkAssetLookupLoading}
        fetchAssetData={fetchAssetData}
        resolveTickerCandidate={resolveTickerCandidate}
        removeAsset={removeAsset}
      />

      <div className="tableActionRow">
        <button className="addButton" onClick={addAsset} disabled={isBulkAssetLookupLoading}>자산 추가</button>
        <button className="resetPortfolioButton secondary" onClick={cleanEmptyAssetRows} disabled={isBulkAssetLookupLoading}>빈 행 정리</button>
        <button className="resetPortfolioButton secondary" onClick={fetchAllAssetData} disabled={isBulkAssetLookupLoading}>{isBulkAssetLookupLoading ? "전체 조회 중" : "전체 조회"}</button>
        <button className="resetPortfolioButton" onClick={resetActivePortfolioAssets} disabled={isBulkAssetLookupLoading}>자산 초기화</button>
        <button className="resetPortfolioButton secondary" onClick={resetGlobalSettings} disabled={isBulkAssetLookupLoading}>공통 조건 초기화</button>
      </div>
    </div>
  );
}