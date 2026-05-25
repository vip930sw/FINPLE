import { useEffect, useState } from "react";
import AssetInputTable from "./AssetInputTable";
import "./TargetWeightControls.css";

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

  const START_VALUE_UNIT = 1000;
  const floorToStartValueUnit = (value) => {
    const numberValue = Number(value || 0);
    if (!Number.isFinite(numberValue)) return 0;
    return Math.max(0, Math.floor(numberValue / START_VALUE_UNIT) * START_VALUE_UNIT);
  };

  const [inflationInput, setInflationInput] = useState(formatDecimal(settings.inflationRate, 1));
  const [startValueInput, setStartValueInput] = useState(formatNumber(floorToStartValueUnit(simulationStartValue)));

  useEffect(() => {
    setInflationInput(formatDecimal(settings.inflationRate, 1));
  }, [settings.inflationRate]);

  useEffect(() => {
    setStartValueInput(formatNumber(floorToStartValueUnit(simulationStartValue)));
  }, [simulationStartValue]);

  const toOneDecimal = (value) => {
    const numberValue = Number(value || 0);
    if (!Number.isFinite(numberValue)) return 0;
    return Math.round(numberValue * 10) / 10;
  };

  const handleStartValueInputChange = (value) => {
    const digitsOnly = String(value).replace(/[^0-9]/g, "");
    setStartValueInput(digitsOnly ? formatNumber(Number(digitsOnly)) : "");
  };

  const commitStartValue = () => {
    const normalized = floorToStartValueUnit(toNumber(startValueInput));
    updateSetting("startValue", normalized);
    setStartValueInput(formatNumber(normalized));
  };

  const handleInflationInputChange = (value) => {
    const sanitized = String(value)
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    if (/^\d{0,2}(\.\d{0,1})?$/.test(sanitized)) {
      setInflationInput(sanitized);
    }
  };

  const commitInflationRate = () => {
    const normalized = toOneDecimal(toNumber(inflationInput));
    updateSetting("inflationRate", normalized);
    setInflationInput(formatDecimal(normalized, 1));
  };

  const TooltipLabel = ({ children, tooltip, label }) => (
    <div className="fieldLabelWithTooltip">
      <p>{children}</p>
      <span className="infoTooltipIcon" tabIndex={0} aria-label={`${label || children} 안내`}>?</span>
      <span className="infoTooltipBubble" role="tooltip">{tooltip}</span>
    </div>
  );

  return (
    <div className="simulatorTabPanel settingsPanel">
      <div className="tabSectionHeader">
        <p className="sectionLabel">Step 2. Simulator</p>
        <h3>시뮬레이터 설정</h3>
        <p>선택한 자산의 목표비중과 투자 조건을 입력해 장기 성과를 계산합니다.</p>
      </div>

      <div className="simulatorControls">
        <div className="summaryCard">
          <TooltipLabel
            label="월 투자금"
            tooltip="월 근로소득·사업소득·금융소득 등 정기 현금흐름의 10~50% 범위에서 설정하는 것을 권장합니다. 고정비와 비상자금을 먼저 확보한 뒤 지속 가능한 금액으로 입력해 주세요."
          >
            월 투자금 (원)
          </TooltipLabel>
          <input
            type="text"
            value={formatNumber(settings.monthlyCashFlow)}
            onChange={(e) => updateSetting("monthlyCashFlow", toNumber(e.target.value))}
          />
        </div>

        <div className="summaryCard">
          <TooltipLabel
            label="투자기간"
            tooltip="투자기간은 5~30년 범위를 권장합니다. 기간이 길어질수록 월 투자금 적립의 지속가능성, 중도 인출 가능성, 물가상승률을 함께 고려해야 합니다."
          >
            투자기간 (년)
          </TooltipLabel>
          <input type="number" value={settings.years} onChange={(e) => updateSetting("years", Number(e.target.value))} />
        </div>

        <div className="summaryCard">
          <TooltipLabel
            label="물가상승률"
            tooltip="기본값은 2.5%입니다. 일반적으로 1.0%~5.0% 범위에서 설정할 수 있으며, 보수적으로 검토할 때는 4.0% 수준을 권장합니다. 물가를 고려하지 않으실 경우 0.0%를 입력하세요."
          >
            물가상승률 (%)
          </TooltipLabel>
          <input
            type="text"
            inputMode="decimal"
            value={inflationInput}
            onChange={(e) => handleInflationInputChange(e.target.value)}
            onBlur={commitInflationRate}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </div>

        <div className="summaryCard">
          <TooltipLabel
            label="배당재투자"
            tooltip="배당주의 배당금을 회수하지 않고 다시 투자하는 조건입니다. 배당주기는 월 지급 기준으로 환산해 적용하며, 분기 배당도 월 단위로 환산하여 계산합니다."
          >
            배당재투자
          </TooltipLabel>
          <button className={settings.dividendReinvest ? "toggleButton active" : "toggleButton"} onClick={() => updateSetting("dividendReinvest", !settings.dividendReinvest)}>
            {settings.dividendReinvest ? "적용 중" : "미적용"}
          </button>
        </div>
      </div>

      {assetLookupSummary && <div className="assetLookupSummary" role="status">{assetLookupSummary}</div>}

      <div className="mobileDesktopNotice">
        모바일에서는 자산 입력 표를 좌우로 밀어 확인할 수 있습니다. 먼저 목표비중을 입력하면 시작 평가금액 기준 평가금액을 계산하고, 현재가는 필요할 때 선택적으로 조회합니다.
      </div>

      <AssetInputTable
        assets={assets}
        targetWeightDrafts={targetWeightDrafts}
        totalAssetValue={totalAssetValue}
        simulationStartValue={simulationStartValue}
        targetWeightSummary={targetWeightSummary}
        startValueInput={startValueInput}
        handleStartValueInputChange={handleStartValueInputChange}
        commitStartValue={commitStartValue}
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

      <div className="tableActionRow simulatorTableActionRow">
        <div className="tableActionLeftGroup">
          <button className="addButton" onClick={addAsset} disabled={isBulkAssetLookupLoading}>자산 추가</button>
          <button className="resetPortfolioButton secondary" onClick={cleanEmptyAssetRows} disabled={isBulkAssetLookupLoading}>빈 행 정리</button>
          <button className="resetPortfolioButton secondary" onClick={fetchAllAssetData} disabled={isBulkAssetLookupLoading}>{isBulkAssetLookupLoading ? "전체 조회 중" : "전체 조회"}</button>
          <button className="resetPortfolioButton" onClick={resetActivePortfolioAssets} disabled={isBulkAssetLookupLoading}>자산 초기화</button>
        </div>
        <button className="calculateWeightButton tableCalculateButton" type="button" onClick={applyTargetWeights} disabled={isBulkAssetLookupLoading || summary.isApplyDisabled}>계산</button>
      </div>
    </div>
  );
} 