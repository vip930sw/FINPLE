function isLookupRequiredAsset(asset, emptyRow) {
  const ticker = String(asset?.ticker || "").trim();
  const price = Number(asset?.price || 0);
  const source = String(asset?.dataSource || "manual").toLowerCase();
  const priceMode = String(asset?.priceMode || "manual").toLowerCase();

  return Boolean(ticker) && !emptyRow && price <= 0 && (
    source.includes("ticker-master") || source.includes("csv") || priceMode === "lookup-required"
  );
}

const CANONICAL_ETF_NAME_MAP = {
  QQQ: "Invesco QQQ Trust ETF",
  SCHD: "Schwab U.S. Dividend Equity ETF",
  TLT: "iShares 20+ Year Treasury Bond ETF",
  VNQ: "Vanguard Real Estate ETF",
  GLD: "SPDR Gold Shares ETF",
  SPY: "SPDR S&P 500 ETF Trust",
  VOO: "Vanguard S&P 500 ETF",
  IVV: "iShares Core S&P 500 ETF",
  VTI: "Vanguard Total Stock Market ETF",
  DIA: "SPDR Dow Jones Industrial Average ETF Trust",
  IWM: "iShares Russell 2000 ETF",
  BND: "Vanguard Total Bond Market ETF",
};

const CANONICAL_STOCK_NAME_MAP = {
  "005930": "삼성전자",
  AAPL: "Apple Inc.",
  NVDA: "NVIDIA Corporation",
  TSLA: "Tesla, Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  GOOG: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc.",
  META: "Meta Platforms, Inc.",
  O: "Realty Income Corporation",
  T: "AT&T Inc.",
};

function isCashAsset(asset = {}) {
  return String(asset?.ticker || "").trim().toUpperCase() === "CASH";
}

function isKnownEtfTicker(ticker = "") {
  return Boolean(CANONICAL_ETF_NAME_MAP[String(ticker || "").trim().toUpperCase()]);
}

function getDisplayAssetName(asset = {}) {
  const ticker = String(asset?.ticker || "").trim().toUpperCase();
  const name = String(asset?.name || "").trim();

  if (isCashAsset(asset) && name === "현금 / 대기자금") return "현금 / 대기자금(예적금)";
  if (CANONICAL_STOCK_NAME_MAP[ticker]) return CANONICAL_STOCK_NAME_MAP[ticker];
  if (CANONICAL_ETF_NAME_MAP[ticker]) return CANONICAL_ETF_NAME_MAP[ticker];
  if (name && isKnownEtfTicker(ticker) && !/ETF/i.test(name)) return `${name} ETF`;
  return name || "-";
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
    <button type="button" className={lookupRequired ? "inlineLookupTextButton needsLookup" : "inlineLookupTextButton"} onClick={onClick} disabled={isLookingUp || isBulkAssetLookupLoading}>
      {isLookingUp ? "조회 중" : "조회"}
    </button>
  );
}

function RowMoveIconButton({ children, disabled, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: 18,
        height: 18,
        border: "none",
        background: "transparent",
        color: disabled ? "#cbd5e1" : "#64748b",
        padding: 0,
        margin: 0,
        lineHeight: "16px",
        fontSize: 13,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function LookupRequiredValue() {
  return <div className="assetInfoStack alignRight lookupRequiredStack"><span className="lookupRequiredText">조회 필요</span></div>;
}

function PriceTextValue({ asset, formatDecimal }) {
  return formatDecimal(asset.price, 2);
}

function isZeroOrEmptyMetric(value) {
  if (value === null || value === undefined || value === "") return true;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue === 0;
}

function MetricTextValue({ value, formatDecimal }) {
  if (isZeroOrEmptyMetric(value)) return <span className="assetTextValue numberTextValue">-</span>;
  return <span className="assetTextValue numberTextValue">{formatDecimal(value, 2)}</span>;
}

function DividendYieldTextValue({ asset, formatDecimal }) {
  const displayValue = String(asset?.displayDividendYield || "").trim();
  const policy = String(asset?.dividendPolicy || "").trim();

  if (displayValue) {
    const normalizedDisplayValue = displayValue === "0.00%" || policy === "no_dividend" ? "-" : displayValue;
    return <span className="assetTextValue numberTextValue">{normalizedDisplayValue}</span>;
  }
  if (policy === "no_dividend") return <span className="assetTextValue numberTextValue">-</span>;
  if (policy === "review_required") return <span className="assetTextValue numberTextValue pendingMetricText">확인 필요</span>;
  if (asset?.dividendYield === null || asset?.dividendYield === undefined || asset?.dividendYield === "") return <span className="assetTextValue numberTextValue pendingMetricText">확인 중</span>;
  if (Number(asset?.dividendYield) === 0) return <span className="assetTextValue numberTextValue">-</span>;
  return <MetricTextValue value={asset.dividendYield} formatDecimal={formatDecimal} />;
}

export default function AssetInputTable({
  assets,
  targetWeightDrafts,
  totalAssetValue,
  simulationStartValue,
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
  const triggerAssetTableRerender = (index) => {
    const asset = assets[index];
    if (!asset) return;
    updateAsset(index, "name", asset.name || "");
  };

  const moveAssetRow = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= assets.length || isBulkAssetLookupLoading) return;
    const nextAssets = assets;
    [nextAssets[index], nextAssets[targetIndex]] = [nextAssets[targetIndex], nextAssets[index]];
    triggerAssetTableRerender(targetIndex);
  };

  const handleTickerEnter = (event, index) => {
    if (event.key !== "Enter") return;
    const ticker = String(event.currentTarget.value || "").trim().toUpperCase();
    if (!ticker) return;
    event.preventDefault();

    const currentAsset = assets[index];
    if (currentAsset) {
      currentAsset.ticker = ticker;
      currentAsset.name = "";
      currentAsset.price = 0;
      currentAsset.targetEvaluationAmount = null;
      currentAsset.cagr = 0;
      currentAsset.beta = 0;
      currentAsset.mdd = 0;
      currentAsset.dividendYield = null;
      currentAsset.priceMode = "manual";
      currentAsset.metricMode = "manual";
      currentAsset.dataSource = "manual";
      currentAsset.cacheMode = null;
      currentAsset.rawPrice = null;
      currentAsset.rawCurrency = null;
      currentAsset.exchangeRate = null;
      currentAsset.lastUpdatedAt = null;
    }

    updateAsset(index, "ticker", ticker);
    event.currentTarget.blur();
    window.setTimeout(() => fetchAssetData(index), 160);
  };

  const renderTickerControl = (asset, index) => {
    const isFirstRow = index <= 0;
    const isLastRow = index >= assets.length - 1;

    return (
      <div className="tickerCellStack">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flex: "0 0 18px" }}>
            <RowMoveIconButton disabled={isBulkAssetLookupLoading || isFirstRow} onClick={() => moveAssetRow(index, -1)} label={`${asset.ticker || "자산"} 위로 이동`}>▲</RowMoveIconButton>
            <RowMoveIconButton disabled={isBulkAssetLookupLoading || isLastRow} onClick={() => moveAssetRow(index, 1)} label={`${asset.ticker || "자산"} 아래로 이동`}>▼</RowMoveIconButton>
          </div>
          <input
            value={asset.ticker}
            onChange={(e) => updateAsset(index, "ticker", e.target.value.toUpperCase())}
            onBlur={(e) => resolveTickerCandidate?.(index, { ticker: e.currentTarget.value })}
            onKeyDown={(e) => handleTickerEnter(e, index)}
            disabled={isBulkAssetLookupLoading}
          />
        </div>
        <button type="button" className="removeTextButton" onClick={() => removeAsset(index)} disabled={isBulkAssetLookupLoading}>삭제</button>
      </div>
    );
  };

  const renderAssetNameWithLookup = (asset, index, emptyRow, isLookingUp, lookupRequired) => {
    if (emptyRow) return <span className="emptyTextValue">-</span>;
    const displayName = getDisplayAssetName(asset);
    return (
      <div className="assetNameLookupStack">
        {isAutoAsset(asset) ? <span className="assetTextValue">{displayName}</span> : <input value={displayName} onChange={(e) => updateAsset(index, "name", e.target.value)} disabled={isBulkAssetLookupLoading} />}
        <div className="assetRowActionGroup" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <InlineLookupButton isLookingUp={isLookingUp} lookupRequired={lookupRequired} isBulkAssetLookupLoading={isBulkAssetLookupLoading} onClick={() => fetchAssetData(index)} />
        </div>
      </div>
    );
  };

  const renderPrice = (asset, emptyRow, lookupRequired) => {
    if (emptyRow) return "-";
    if (lookupRequired) return <LookupRequiredValue />;
    return <PriceTextValue asset={asset} formatDecimal={formatDecimal} />;
  };

  const renderTargetWeight = (asset, index, emptyRow, targetWeightValue) => {
    if (emptyRow) return <span className="emptyTextValue numberTextValue">-</span>;
    return <div className="weightInputWrap targetWeightInputWrap"><input type="text" inputMode="decimal" value={targetWeightValue} onChange={(e) => { const sanitized = sanitizeTargetWeightInput(e.target.value); if (sanitized !== null) updateTargetWeightDraft?.(index, sanitized); }} onBlur={() => updateTargetWeightDraft?.(index, formatTargetWeightInput(targetWeightValue))} disabled={isBulkAssetLookupLoading} aria-label="목표비중 입력" /></div>;
  };

  return (
    <div className="calculatorTableWrap">
      <table className="calculatorTable alignedAssetTable" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col className="tickerColumn" style={{ width: "96px" }} />
          <col className="assetNameColumn" style={{ width: "245px" }} />
          <col className="quantityColumn" style={{ width: "112px" }} />
          <col className="priceColumn" style={{ width: "132px" }} />
          <col className="valueColumn" style={{ width: "142px" }} />
          <col className="targetWeightColumn" style={{ width: "122px" }} />
          <col className="metricColumn" style={{ width: "82px" }} />
          <col className="metricColumn" style={{ width: "74px" }} />
          <col className="metricColumn" style={{ width: "82px" }} />
          <col className="metricColumn" style={{ width: "78px" }} />
        </colgroup>
        <thead><tr><th>티커</th><th style={{ paddingLeft: 22 }}>자산명</th><th className="numberHeader">수량</th><th className="numberHeader">현재가 (원, KRW)</th><th className="numberHeader">평가금액 (원, KRW)</th><th className="numberHeader">목표비중 (%)</th><th className="numberHeader">CAGR (%)</th><th className="numberHeader">BETA</th><th className="numberHeader">MDD (%)</th><th className="numberHeader">배당률 (%)</th></tr></thead>
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
            const rowClassName = [isNewlyAdded ? "newAssetRow" : "", lookupRequired ? "lookupRequiredRow" : "", quantityMissing ? "quantityMissingRow" : ""].filter(Boolean).join(" ");
            const valueCellClassName = lookupRequired && displayedValue > 0 ? "numberCell tableNumberCell plannedValueCell" : "numberCell tableNumberCell";
            const cagrDisplayValue = isCashAsset(asset) ? 0 : asset.cagr;

            return (
              <tr key={asset.id || index} className={rowClassName}>
                <td className="tickerCell">{renderTickerControl(asset, index)}</td>
                <td className="assetNameCell" style={{ paddingLeft: 22 }}>{renderAssetNameWithLookup(asset, index, emptyRow, isLookingUp, lookupRequired)}</td>
                <td className="numberCell tableNumberCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : formatDecimal(asset.quantity, 4)}</td>
                <td className="numberCell tableNumberCell priceCell">{renderPrice(asset, emptyRow, lookupRequired)}</td>
                <td className={valueCellClassName}>{formatEvaluationAmount(displayedValue)}</td>
                <td className="targetWeightCell">{renderTargetWeight(asset, index, emptyRow, targetWeightValue)}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={cagrDisplayValue} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.beta} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.mdd} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <DividendYieldTextValue asset={asset} formatDecimal={formatDecimal} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
