import AssetInputTable from "./AssetInputTable";

export default function SettingsPanel({
  settings,
  totalAssetValue,
  simulationStartValue,
  assets,
  targetWeightDrafts,
  targetWeightSummary,
  formatNumber,
  formatDecimal,
  toNumber,
  updateSetting,
  updateAsset,
  updateTargetWeightDraft,
  applyTargetWeights,
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
}) {
  const summary = targetWeightSummary || {
    total: 0,
    remaining: 0,
    overAmount: 0,
    unsupportedCount: 0,
    isApplyDisabled: true,
  };

  const weightNoticeText = summary.overAmount > 0
    ? `목표비중이 100%를 ${formatDecimal(summary.overAmount, 2)}% 초과했습니다.`
    : summary.remaining > 0
      ? `목표비중 합계가 ${formatDecimal(summary.remaining, 2)}% 부족합니다. 계산 전 100%로 맞춰 주세요.`
      : "목표비중 합계가 100%입니다. 계산 버튼을 누르면 수량이 한 번에 재계산됩니다.";

  const toNaturalNumber = (value) => Math.max(0, Math.floor(Number(value || 0)));
  const toOneDecimal = (value) => {
    const numberValue = Number(value || 0);
    if (!Number.isFinite(numberValue)) return 0;
    return Math.round(numberValue * 10) / 10;
  };

  const handleStartValueChange = (value) => {
    updateSetting("startValue", toNaturalNumber(toNumber(value)));
  };

  const handleInflationRateChange = (value) => {
    updateSetting("inflationRate", toOneDecimal(toNumber(value)));
  };

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
          <div className="fieldLabelWithTooltip">
            <p>물가상승률 (%)</p>
            <span className="infoTooltipIcon" tabIndex={0} aria-label="물가상승률 입력 안내">?</span>
            <span className="infoTooltipBubble" role="tooltip">
              기본값은 2.5%입니다. 일반적으로 1.0%~5.0% 범위에서 설정할 수 있으며, 보수적으로 검토할 때는 4.0% 수준을 권장합니다.
            </span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={formatDecimal(settings.inflationRate, 1)}
            onChange={(e) => handleInflationRateChange(e.target.value)}
          />
        </div>

        <div className="summaryCard">
          <p>배당재투자</p>
          <button className={settings.dividendReinvest ? "toggleButton active" : "toggleButton"} onClick={() => updateSetting("dividendReinvest", !settings.dividendReinvest)}>
            {settings.dividendReinvest ? "적용 중" : "미적용"}
          </button>
        </div>
      </div>

      <div className={summary.overAmount > 0 ? "calculationControlPanel warning" : "calculationControlPanel"}>
        <div className="assetValueNotice editableStartValueBox mergedStartValueBox">
          <div>
            <p>시작 평가금액 (원)</p>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(toNaturalNumber(simulationStartValue))}
              onChange={(e) => handleStartValueChange(e.target.value)}
              aria-label="시작 평가금액 입력"
            />
          </div>
          <div>
            <span>시뮬레이션의 기준 평가금액입니다.</span>
            <small>현재 자산 합계는 {Math.floor(totalAssetValue).toLocaleString()}원입니다. 목표비중 계산 시 시작 평가금액을 기준으로 수량이 재계산됩니다.</small>
          </div>
        </div>

        <div className="targetWeightPanel compact mergedTargetWeightPanel">
          <div className="targetWeightSummaryGrid twoColumns">
            <div>
              <p>목표비중 합계</p>
              <strong>{formatDecimal(summary.total, 2)}%</strong>
            </div>
            <div>
              <p>{summary.overAmount > 0 ? "초과 비중" : "남은 비중"}</p>
              <strong>{summary.overAmount > 0 ? formatDecimal(summary.overAmount, 2) : formatDecimal(summary.remaining, 2)}%</strong>
            </div>
          </div>
          <div className="targetWeightApplyRow">
            <p className="targetWeightNoticeText">{weightNoticeText}</p>
            <button className="addButton" type="button" onClick={applyTargetWeights} disabled={isBulkAssetLookupLoading || summary.isApplyDisabled}>계산</button>
          </div>
          {summary.unsupportedCount > 0 && (
            <p className="targetWeightNoticeText warningText">현재가가 없는 자산 {summary.unsupportedCount}개는 목표비중 계산 전에 조회가 필요합니다.</p>
          )}
        </div>
      </div>

      {assetLookupSummary && <div className="assetLookupSummary" role="status">{assetLookupSummary}</div>}

      <div className="mobileDesktopNotice">
        모바일에서는 자산 입력 표를 좌우로 밀어 확인할 수 있습니다. 현재가·CAGR·MDD·배당률은 조회값 또는 기준값을 사용하고, 사용자는 목표비중을 조정합니다.
      </div>

      <AssetInputTable
        assets={assets}
        targetWeightDrafts={targetWeightDrafts}
        totalAssetValue={totalAssetValue}
        isEmptyAssetRow={isEmptyAssetRow}
        isAutoAsset={isAutoAsset}
        isAutoPriceAsset={isAutoPriceAsset}
        isAutoMetricAsset={isAutoMetricAsset}
        formatDecimal={formatDecimal}
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
        <button className="addButton" onClick={addAsset} disabled={isBulkAssetLookupLoading}>자산 추가</button>
        <button className="resetPortfolioButton secondary" onClick={cleanEmptyAssetRows} disabled={isBulkAssetLookupLoading}>빈 행 정리</button>
        <button className="resetPortfolioButton secondary" onClick={fetchAllAssetData} disabled={isBulkAssetLookupLoading}>{isBulkAssetLookupLoading ? "전체 조회 중" : "전체 조회"}</button>
        <button className="resetPortfolioButton" onClick={resetActivePortfolioAssets} disabled={isBulkAssetLookupLoading}>자산 초기화</button>
      </div>
    </div>
  );
}
