function isLookupRequiredAsset(asset, emptyRow) {
  const ticker = String(asset?.ticker || "").trim();
  const price = Number(asset?.price || 0);
  const source = String(asset?.dataSource || "manual").toLowerCase();
  const priceMode = String(asset?.priceMode || "manual").toLowerCase();

  return Boolean(ticker) && !emptyRow && price <= 0 && (
    source.includes("ticker-master") || source.includes("csv") || priceMode === "lookup-required"
  );
}

function getAssetDraftKey(asset, index) {
  return asset?.id || `${String(asset?.ticker || "asset").trim().toUpperCase()}-${index}`;
}

function getDisplayedTargetWeight(asset, index, actualWeight, targetWeightDrafts = {}) {
  const key = getAssetDraftKey(asset, index);
  if (Object.prototype.hasOwnProperty.call(targetWeightDrafts, key)) return targetWeightDrafts[key];
  return Number.isFinite(actualWeight) ? actualWeight.toFixed(2) : "0.00";
}

function sanitizeTargetWeightInput(value) {
  const sanitized = String(value)
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1");

  if (/^\d{0,3}(\.\d{0,2})?$/.test(sanitized)) return sanitized;
  return null;
}

function formatTargetWeightInput(value) {
  if (value === "" || value === null || value === undefined) return "0.00";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0.00";
  return Math.max(0, Math.min(100, numberValue)).toFixed(2);
}

function formatEvaluationAmount(value) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return "0";
  const roundedToThousand = Math.round(numberValue / 1000) * 1000;
  return roundedToThousand.toLocaleString();
}

function getPlannedEvaluationAmount(startValue, targetWeightValue) {
  const startAmount = Number(startValue || 0);
  const targetWeight = Number(targetWeightValue || 0);
  if (!Number.isFinite(startAmount) || !Number.isFinite(targetWeight)) return 0;
  return startAmount * (targetWeight / 100);
}

function getAssetActualValue(asset = {}) {
  const value = Number(asset.quantity || 0) * Number(asset.price || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetPlannedValue(asset = {}) {
  const value = Number(asset.targetEvaluationAmount || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetWeightValue(asset = {}) {
  return getAssetActualValue(asset) || getAssetPlannedValue(asset);
}

function InlineLookupButton({ isLookingUp, lookupRequired, isBulkAssetLookupLoading, onClick }) {
  return (
    <button
      type="button"
      className={lookupRequired ? "inlineLookupTextButton needsLookup" : "inlineLookupTextButton"}
      onClick={onClick}
      disabled={isLookingUp || isBulkAssetLookupLoading}
    >
      {isLookingUp ? "조회 중" : lookupRequired ? "현재가 조회" : "조회"}
    </button>
  );
}

function LookupRequiredValue({ quantity }) {
  const quantityMissing = Number(quantity || 0) <= 0;

  return (
    <div className="assetInfoStack alignRight lookupRequiredStack">
      <span className="lookupRequiredText">조회 필요</span>
      <small className="lookupRequiredHint">
        {quantityMissing ? "선택 사항" : "현재가 반영 필요"}
      </small>
    </div>
  );
}

function PriceTextValue({ asset, formatDecimal }) {
  return formatDecimal(asset.price, 2);
}

function MetricTextValue({ value, formatDecimal }) {
  return <span className="assetTextValue numberTextValue">{formatDecimal(value, 2)}</span>;
}

function DividendYieldTextValue({ value, formatDecimal }) {
  if (value === null || value === undefined || value === "") {
    return <span className="assetTextValue numberTextValue pendingMetricText">확인 중</span>;
  }

  return <MetricTextValue value={value} formatDecimal={formatDecimal} />;
}

export default function AssetInputTable({
  assets,
  targetWeightDrafts,
  totalAssetValue,
  simulationStartValue,
  targetWeightSummary,
  isEmptyAssetRow,
  isAutoAsset,
  formatDecimal,
  updateAsset,
  updateTargetWeightDraft,
  assetLookupStatus,
  recentlyAddedAssetId,
  isBulkAssetLookupLoading,
  fetchAssetData,
  resolveTickerCandidate,
  removeAsset,
}) {
  const renderTickerControl = (asset, index, emptyRow) => (
    <div className="tickerCellStack">
      <input
        value={asset.ticker}
        onChange={(e) => updateAsset(index, "ticker", e.target.value.toUpperCase())}
        onBlur={(e) => resolveTickerCandidate?.(index, { ticker: e.currentTarget.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        disabled={isBulkAssetLookupLoading}
      />
      {!emptyRow && (
        <button type="button" className="removeTextButton" onClick={() => removeAsset(index)} disabled={isBulkAssetLookupLoading}>삭제</button>
      )}
    </div>
  );

  const renderAssetNameWithLookup = (asset, index, emptyRow, isLookingUp, lookupRequired) => {
    if (emptyRow) return <span className="emptyTextValue">-</span>;

    return (
      <div className="assetNameLookupStack">
        {isAutoAsset(asset) ? (
          <span className="assetTextValue">{asset.name || "-"}</span>
        ) : (
          <input value={asset.name} onChange={(e) => updateAsset(index, "name", e.target.value)} disabled={isBulkAssetLookupLoading} />
        )}
        <InlineLookupButton
          isLookingUp={isLookingUp}
          lookupRequired={lookupRequired}
          isBulkAssetLookupLoading={isBulkAssetLookupLoading}
          onClick={() => fetchAssetData(index)}
        />
      </div>
    );
  };

  const renderPrice = (asset, emptyRow, lookupRequired) => {
    if (emptyRow) return "-";
    if (lookupRequired) return <LookupRequiredValue quantity={asset.quantity} />;
    return <PriceTextValue asset={asset} formatDecimal={formatDecimal} />;
  };

  const renderTargetWeight = (asset, index, emptyRow, targetWeightValue) => {
    if (emptyRow) return <span className="emptyTextValue numberTextValue">-</span>;

    return (
      <div className="weightInputWrap targetWeightInputWrap">
        <input
          type="text"
          inputMode="decimal"
          value={targetWeightValue}
          onChange={(e) => {
            const sanitized = sanitizeTargetWeightInput(e.target.value);
            if (sanitized !== null) updateTargetWeightDraft?.(index, sanitized);
          }}
          onBlur={() => updateTargetWeightDraft?.(index, formatTargetWeightInput(targetWeightValue))}
          disabled={isBulkAssetLookupLoading}
          aria-label="목표비중 입력"
        />
      </div>
    );
  };

  const summary = targetWeightSummary || { total: 0 };
  const tableTotalValue = assets.reduce((sum, asset) => {
    if (isEmptyAssetRow(asset)) return sum;
    return sum + getAssetWeightValue(asset);
  }, 0);

  return (
    <div className="calculatorTableWrap">
      <table className="calculatorTable alignedAssetTable">
        <colgroup>
          <col className="tickerColumn" />
          <col className="assetNameColumn" />
          <col className="quantityColumn" />
          <col className="priceColumn" />
          <col className="valueColumn" />
          <col className="targetWeightColumn" />
          <col className="metricColumn" />
          <col className="metricColumn" />
          <col className="metricColumn" />
          <col className="metricColumn" />
        </colgroup>
        <thead>
          <tr>
            <th>티커</th>
            <th>자산명</th>
            <th className="numberHeader">수량</th>
            <th className="numberHeader">현재가 (원, KRW)</th>
            <th className="numberHeader">평가금액 (원, KRW)</th>
            <th className="numberHeader">목표비중 (%)</th>
            <th className="numberHeader">CAGR (%)</th>
            <th className="numberHeader">BETA</th>
            <th className="numberHeader">MDD (%)</th>
            <th className="numberHeader">배당률 (%)</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const value = getAssetActualValue(asset);
            const weight = totalAssetValue > 0 ? (getAssetWeightValue(asset) / totalAssetValue) * 100 : 0;
            const emptyRow = isEmptyAssetRow(asset);
            const lookupKey = asset.id || String(index);
            const lookupStatus = assetLookupStatus?.[lookupKey];
            const isLookingUp = lookupStatus?.status === "loading";
            const lookupRequired = isLookupRequiredAsset(asset, emptyRow);
            const quantityMissing = !emptyRow && Number(asset.quantity || 0) <= 0;
            const isNewlyAdded = recentlyAddedAssetId && asset.id === recentlyAddedAssetId;
            const targetWeightValue = getDisplayedTargetWeight(asset, index, weight, targetWeightDrafts);
            const plannedValue = getPlannedEvaluationAmount(simulationStartValue, targetWeightValue);
            const savedPlannedValue = getAssetPlannedValue(asset);
            const displayedValue = value > 0 ? value : savedPlannedValue || plannedValue;
            const rowClassName = [
              isNewlyAdded ? "newAssetRow" : "",
              lookupRequired ? "lookupRequiredRow" : "",
              quantityMissing ? "quantityMissingRow" : "",
            ].filter(Boolean).join(" ");
            const valueCellClassName = lookupRequired && displayedValue > 0 ? "numberCell tableNumberCell plannedValueCell" : "numberCell tableNumberCell";

            return (
              <tr key={asset.id || index} className={rowClassName}>
                <td className="tickerCell">{renderTickerControl(asset, index, emptyRow)}</td>
                <td className="assetNameCell">{renderAssetNameWithLookup(asset, index, emptyRow, isLookingUp, lookupRequired)}</td>
                <td className="numberCell tableNumberCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : formatDecimal(asset.quantity, 4)}</td>
                <td className="numberCell tableNumberCell priceCell">{renderPrice(asset, emptyRow, lookupRequired)}</td>
                <td className={valueCellClassName}>{formatEvaluationAmount(displayedValue)}</td>
                <td className="targetWeightCell">{renderTargetWeight(asset, index, emptyRow, targetWeightValue)}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.cagr} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.beta} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.mdd} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <DividendYieldTextValue value={asset.dividendYield} formatDecimal={formatDecimal} />}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="assetTableSummaryRow">
            <td colSpan="4">합계</td>
            <td className="numberCell tableNumberCell">{formatEvaluationAmount(tableTotalValue)}</td>
            <td className="numberCell tableNumberCell">{formatDecimal(summary.total || 0, 2)}%</td>
            <td colSpan="4" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}