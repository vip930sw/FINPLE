import {
  resolveDistributionDisplayPolicy,
  resolveDividendYieldDisplay,
} from "../../../data/tickers/distributionPolicy";

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

function getDisplayedTargetWeight(asset, index, targetWeightDrafts = {}) {
  const key = getAssetDraftKey(asset, index);
  if (Object.prototype.hasOwnProperty.call(targetWeightDrafts, key)) return targetWeightDrafts[key];
  return formatTargetWeightInput(asset?.targetWeight);
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
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";
  const roundedToThousand = Math.round(numberValue / 1000) * 1000;
  return roundedToThousand.toLocaleString();
}

function getPlannedEvaluationAmount(startValue, targetWeightValue) {
  const startAmount = Number(startValue || 0);
  const targetWeight = Number(targetWeightValue || 0);
  if (!Number.isFinite(startAmount) || !Number.isFinite(targetWeight)) return 0;
  return startAmount * (targetWeight / 100);
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
  const distribution = resolveDistributionDisplayPolicy(asset);
  if (distribution.kind !== "ordinary") {
    const cashYield = asset.cashDistributionYieldTtm ?? asset.trailingDistributionYield;
    return (
      <span className="assetTextValue numberTextValue" title={distribution.title}>
        {isZeroOrEmptyMetric(cashYield) ? "-" : `${formatDecimal(cashYield, 2)}%`}
      </span>
    );
  }
  const display = resolveDividendYieldDisplay(asset);
  const pendingClass = ["missing", "review_required"].includes(display.kind)
    ? " pendingMetricText"
    : "";
  return (
    <span className={`assetTextValue numberTextValue${pendingClass}`}>
      {display.text}
    </span>
  );
}

export default function AssetInputTable({
  assets,
  targetWeightDrafts,
  simulationStartValue,
  isEmptyAssetRow,
  isAutoAsset,
  formatDecimal,
  updateAsset,
  updateTargetWeightDraft,
  recentlyAddedAssetId,
  resolveTickerCandidate,
  moveAsset,
  removeAsset,
}) {
  const moveAssetRow = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= assets.length) return;
    moveAsset?.(index, direction);
  };

  const handleTickerEnter = (event, index) => {
    if (event.key !== "Enter") return;
    const ticker = String(event.currentTarget.value || "").trim().toUpperCase();
    if (!ticker) return;
    event.preventDefault();

    if (updateAsset(index, "ticker", ticker) === false) return;
    resolveTickerCandidate?.(index, { ticker });
  };

  const renderTickerControl = (asset, index) => {
    const isFirstRow = index <= 0;
    const isLastRow = index >= assets.length - 1;

    return (
      <div className="tickerCellStack">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flex: "0 0 18px" }}>
            <RowMoveIconButton disabled={isFirstRow} onClick={() => moveAssetRow(index, -1)} label={`${asset.ticker || "자산"} 위로 이동`}>▲</RowMoveIconButton>
            <RowMoveIconButton disabled={isLastRow} onClick={() => moveAssetRow(index, 1)} label={`${asset.ticker || "자산"} 아래로 이동`}>▼</RowMoveIconButton>
          </div>
          <input
            value={asset.ticker}
            onChange={(e) => updateAsset(index, "ticker", e.target.value.toUpperCase())}
            onBlur={(e) => resolveTickerCandidate?.(index, { ticker: e.currentTarget.value })}
            onKeyDown={(e) => handleTickerEnter(e, index)}
          />
        </div>
        <button type="button" className="removeTextButton" onClick={() => removeAsset(index)}>삭제</button>
      </div>
    );
  };

  const renderAssetName = (asset, index, emptyRow) => {
    if (emptyRow) return <span className="emptyTextValue">-</span>;
    const displayName = getDisplayAssetName(asset);
    return isAutoAsset(asset)
      ? <span className="assetTextValue">{displayName}</span>
      : <input value={displayName} onChange={(e) => updateAsset(index, "name", e.target.value)} />;
  };

  const renderTargetWeight = (asset, index, emptyRow, targetWeightValue) => {
    if (emptyRow) return <span className="emptyTextValue numberTextValue">-</span>;
    return <div className="weightInputWrap targetWeightInputWrap"><input type="text" inputMode="decimal" value={targetWeightValue} onChange={(e) => { const sanitized = sanitizeTargetWeightInput(e.target.value); if (sanitized !== null) updateTargetWeightDraft?.(index, sanitized); }} onBlur={() => updateTargetWeightDraft?.(index, formatTargetWeightInput(targetWeightValue))} aria-label="목표비중 입력" /></div>;
  };

  return (
    <div className="calculatorTableWrap">
      <table className="calculatorTable alignedAssetTable" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col className="tickerColumn" style={{ width: "96px" }} />
          <col className="assetNameColumn" style={{ width: "245px" }} />
          <col className="valueColumn" style={{ width: "142px" }} />
          <col className="targetWeightColumn" style={{ width: "122px" }} />
          <col className="metricColumn" style={{ width: "82px" }} />
          <col className="metricColumn" style={{ width: "74px" }} />
          <col className="metricColumn" style={{ width: "82px" }} />
          <col className="metricColumn" style={{ width: "78px" }} />
        </colgroup>
        <thead><tr><th>티커</th><th style={{ paddingLeft: 22 }}>자산명</th><th className="numberHeader">평가금액 (원, KRW)</th><th className="numberHeader">목표비중 (%)</th><th className="numberHeader">CAGR (%)</th><th className="numberHeader">BETA</th><th className="numberHeader">MDD (%)</th><th className="numberHeader">배당/현금분배율 (%)</th></tr></thead>
        <tbody>
          {assets.map((asset, index) => {
            const emptyRow = isEmptyAssetRow(asset);
            const isNewlyAdded = recentlyAddedAssetId && asset.id === recentlyAddedAssetId;
            const targetWeightValue = getDisplayedTargetWeight(asset, index, targetWeightDrafts);
            const displayedValue = getPlannedEvaluationAmount(simulationStartValue, targetWeightValue);
            const rowClassName = isNewlyAdded ? "newAssetRow" : "";

            return (
              <tr key={asset.id || index} className={rowClassName}>
                <td className="tickerCell">{renderTickerControl(asset, index)}</td>
                <td className="assetNameCell" style={{ paddingLeft: 22 }}>{renderAssetName(asset, index, emptyRow)}</td>
                <td className="numberCell tableNumberCell">{formatEvaluationAmount(displayedValue)}</td>
                <td className="targetWeightCell">{renderTargetWeight(asset, index, emptyRow, targetWeightValue)}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.cagr} formatDecimal={formatDecimal} />}</td>
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
