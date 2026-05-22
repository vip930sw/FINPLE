import AssetInputTable from "./AssetInputTable";

export default function SettingsPanel({
  settings,
  totalAssetValue,
  assets,
  targetWeightDrafts,
  targetWeightSummary,
  formatNumber,
  formatDecimal,
  formatPercent,
  toNumber,
  updateSetting,
  updateAsset,
  updateTargetWeightDraft,
  applyTargetWeights,
  resetTargetWeights,
  equalizeTargetWeights,
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
  const summary = targetWeightSummary || {
    total: 0,
    remaining: 0,
    overAmount: 0,
    hasCash: false,
    unsupportedCount: 0,
    isApplyDisabled: true,
  };

  const weightNoticeText = summary.overAmount > 0
    ? `목표비중이 100%를 ${formatDecimal(summary.overAmount, 2)}% 초과했습니다.`
    : summary.remaining > 0 && summary.hasCash
      ? `남은 ${formatDecimal(summary.remaining, 2)}%는 적용 시 현금 자산에 자동 배정됩니다.`
      : summary.remaining > 0
        ? `목표비중 합계가 ${formatDecimal(summary.remaining, 2)}% 부족합니다. 현금 자산이 없으면 100%로 맞춰야 합니다.`
        : "목표비중 합계가 100%입니다. 적용 버튼을 누르면 수량이 한 번에 재계산됩니다.";

  return (
    <div className="simulatorTabPanel settingsPanel">
      <div className="tabSectionHeader">
        <p className="sectionLabel">Step 2. Simulator</p>
        <h3>시뮬레이터 설정</h3>
        <p>선택한 자산의 목표비중과 투자 조건을 입력해 장기 성과를 계산합니다.</p>
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
          <small>목표비중은 입력 중에는 고정됩니다. 적용 버튼을 누를 때 수량과 평가금액을 한 번에 재계산합니다.</small>
        </div>
      </div>

      {assetLookupSummary && <div className="assetLookupSummary" role="status">{assetLookupSummary}</div>}

      <div className="mobileDesktopNotice">
        모바일에서는 자산 입력 표를 좌우로 밀어 확인할 수 있습니다. 현재가·CAGR·MDD·배당률은 조회값 또는 기준값을 사용하고, 사용자는 목표비중을 조정합니다.
      </div>

      <div className={summary.overAmount > 0 ? "targetWeightPanel warning" : "targetWeightPanel"}>
        <div className="targetWeightSummaryGrid">
          <div>
            <p>목표비중 합계</p>
            <strong>{formatDecimal(summary.total, 2)}%</strong>
          </div>
          <div>
            <p>{summary.overAmount > 0 ? "초과 비중" : "남은 비중"}</p>
            <strong>{summary.overAmount > 0 ? formatDecimal(summary.overAmount, 2) : formatDecimal(summary.remaining, 2)}%</strong>
          </div>
          <div>
            <p>현금 자동배정</p>
            <strong>{summary.hasCash ? "가능" : "없음"}</strong>
          </div>
        </div>
        <p className="targetWeightNoticeText">{weightNoticeText}</p>
        {summary.unsupportedCount > 0 && (
          <p className="targetWeightNoticeText warningText">현재가가 없는 자산 {summary.unsupportedCount}개는 목표비중 적용 전에 조회가 필요합니다.</p>
        )}
      </div>

      <AssetInputTable
        assets={assets}
        targetWeightDrafts={targetWeightDrafts}
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
        updateTargetWeightDraft={updateTargetWeightDraft}
        assetLookupStatus={assetLookupStatus}
        recentlyAddedAssetId={recentlyAddedAssetId}
        isBulkAssetLookupLoading={isBulkAssetLookupLoading}
        fetchAssetData={fetchAssetData}
        resolveTickerCandidate={resolveTickerCandidate}
        removeAsset={removeAsset}
      />

      <div className="tableActionRow">
        <button className="addButton" onClick={applyTargetWeights} disabled={isBulkAssetLookupLoading || summary.isApplyDisabled}>목표비중 적용</button>
        <button className="resetPortfolioButton secondary" onClick={equalizeTargetWeights} disabled={isBulkAssetLookupLoading}>균등분배</button>
        <button className="resetPortfolioButton secondary" onClick={resetTargetWeights} disabled={isBulkAssetLookupLoading}>비중 되돌리기</button>
        <button className="addButton" onClick={addAsset} disabled={isBulkAssetLookupLoading}>자산 추가</button>
        <button className="resetPortfolioButton secondary" onClick={cleanEmptyAssetRows} disabled={isBulkAssetLookupLoading}>빈 행 정리</button>
        <button className="resetPortfolioButton secondary" onClick={fetchAllAssetData} disabled={isBulkAssetLookupLoading}>{isBulkAssetLookupLoading ? "전체 조회 중" : "전체 조회"}</button>
        <button className="resetPortfolioButton" onClick={resetActivePortfolioAssets} disabled={isBulkAssetLookupLoading}>자산 초기화</button>
        <button className="resetPortfolioButton secondary" onClick={resetGlobalSettings} disabled={isBulkAssetLookupLoading}>공통 조건 초기화</button>
      </div>
    </div>
  );
}