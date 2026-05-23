function formatLookupTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getDataSourceInfo(asset) {
  const source = String(asset?.dataSource || "manual").toLowerCase();
  const cacheMode = String(asset?.cacheMode || "").toLowerCase();

  if (source.includes("cache") || cacheMode === "hit") return { label: "캐시값", className: "cache" };
  if (source.includes("alpha-vantage") || source.includes("alpha_vantage")) return { label: "Alpha Vantage", className: "alpha" };
  if (source.includes("mock")) return { label: "Mock", className: "mock" };
  if (source.includes("ticker-master")) return { label: "마스터", className: "master" };
  return { label: "수동값", className: "manual" };
}

function isLookupRequiredAsset(asset, emptyRow) {
  const ticker = String(asset?.ticker || "").trim();
  const price = Number(asset?.price || 0);
  const source = String(asset?.dataSource || "manual").toLowerCase();
  const priceMode = String(asset?.priceMode || "manual").toLowerCase();

  return Boolean(ticker) && !emptyRow && price <= 0 && (
    source.includes("ticker-master") || priceMode === "lookup-required"
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
  if (!Number.isFinite(numberValue)) return "0원";
  const roundedToThousand = Math.round(numberValue / 1000) * 1000;
  return `${roundedToThousand.toLocaleString()}원`;
}

function InlineLookupButton({ isLookingUp, lookupRequired, isBulkAssetLookupLoading, onClick }) {
  return (
    <button
      type="button"
      className={lookupRequired ? "inlineLookupTextButton needsLookup" : "inlineLookupTextButton"}
      onClick={onClick}
      disabled={isLookingUp || isBulkAssetLookupLoading}
    >
      {isLookingUp ? "조회 중" : lookupRequired ? "조회 필요" : "조회"}
    </button>
  );
}

function LookupRequiredValue({ quantity }) {
  const quantityMissing = Number(quantity || 0) <= 0;

  return (
    <div className="assetInfoStack alignRight lookupRequiredStack">
      <span className="lookupRequiredText">조회 필요</span>
      <small className="lookupRequiredHint">
        {quantityMissing ? "비중 입력 후 조회" : "현재가 반영 필요"}
      </small>
    </div>
  );
}

function PriceTextValue({ asset, formatDecimal }) {
  const sourceInfo = getDataSourceInfo(asset);
  const lookupTime = formatLookupTime(asset.lastUpdatedAt);

  return (
    <div className="assetInfoStack alignRight">
      <span className="assetTextValue numberTextValue">{formatDecimal(asset.price, 2)}</span>
      <span className="assetMetaLine">
        <span className={`dataSourceBadge ${sourceInfo.className}`}>{sourceInfo.label}</span>
        {lookupTime && <span className="lookupTimeText">{lookupTime}</span>}
      </span>
    </div>
  );
}

function MetricTextValue({ value, formatDecimal }) {
  return <span className="assetTextValue numberTextValue">{formatDecimal(value, 2)}</span>;
}

export default function AssetInputTable({
  assets,
  targetWeightDrafts,
  totalAssetValue,
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
  const getRowState = (asset, index) => {
    const value = Number(asset.quantity || 0) * Number(asset.price || 0);
    const weight = totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0;
    const emptyRow = isEmptyAssetRow(asset);
    const lookupKey = asset.id || String(index);
    const lookupStatus = assetLookupStatus?.[lookupKey];
    const isLookingUp = lookupStatus?.status === "loading";
    const lookupRequired = isLookupRequiredAsset(asset, emptyRow);
    const quantityMissing = !emptyRow && Number(asset.quantity || 0) <= 0;
    const isNewlyAdded = recentlyAddedAssetId && asset.id === recentlyAddedAssetId;
    const targetWeightValue = getDisplayedTargetWeight(asset, index, weight, targetWeightDrafts);
    const rowClassName = [
      isNewlyAdded ? "newAssetRow" : "",
      lookupRequired ? "lookupRequiredRow" : "",
      quantityMissing ? "quantityMissingRow" : "",
    ].filter(Boolean).join(" ");
    const valueCellClassName = quantityMissing || lookupRequired ? "numberCell tableNumberCell pendingValueCell" : "numberCell tableNumberCell";

    return { value, emptyRow, isLookingUp, lookupRequired, targetWeightValue, rowClassName, valueCellClassName };
  };

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
    if (emptyRow) return <span className="emptyTextValue numberTextValue">-</span>;
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
          disabled={isBulkAssetLookupLoading || Number(asset.price || 0) <= 0}
          aria-label="목표비중 입력"
        />
        <span>%</span>
      </div>
    );
  };

  const renderMobileAssetCard = (asset, index) => {
    const state = getRowState(asset, index);
    const { value, emptyRow, isLookingUp, lookupRequired, targetWeightValue, rowClassName } = state;

    return (
      <article key={asset.id || index} className={`mobileAssetCard ${rowClassName}`}>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">티커</span>
          <div className="mobileAssetCardValue">{renderTickerControl(asset, index, emptyRow)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">자산명</span>
          <div className="mobileAssetCardValue">{renderAssetNameWithLookup(asset, index, emptyRow, isLookingUp, lookupRequired)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">수량</span>
          <div className="mobileAssetCardValue numberTextValue">{emptyRow ? "-" : formatDecimal(asset.quantity, 4)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">현재가</span>
          <div className="mobileAssetCardValue">{renderPrice(asset, emptyRow, lookupRequired)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">평가금액</span>
          <div className="mobileAssetCardValue numberTextValue">{formatEvaluationAmount(value)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">목표비중</span>
          <div className="mobileAssetCardValue">{renderTargetWeight(asset, index, emptyRow, targetWeightValue)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">CAGR</span>
          <div className="mobileAssetCardValue numberTextValue">{emptyRow ? "-" : formatDecimal(asset.cagr, 2)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">BETA</span>
          <div className="mobileAssetCardValue numberTextValue">{emptyRow ? "-" : formatDecimal(asset.beta, 2)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">MDD</span>
          <div className="mobileAssetCardValue numberTextValue">{emptyRow ? "-" : formatDecimal(asset.mdd, 2)}</div>
        </div>
        <div className="mobileAssetCardRow">
          <span className="mobileAssetCardLabel">배당률</span>
          <div className="mobileAssetCardValue numberTextValue">{emptyRow ? "-" : formatDecimal(asset.dividendYield, 2)}</div>
        </div>
      </article>
    );
  };

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
            <th className="numberHeader">평가금액</th>
            <th className="numberHeader">목표비중</th>
            <th className="numberHeader">CAGR (%)</th>
            <th className="numberHeader">BETA</th>
            <th className="numberHeader">MDD (%)</th>
            <th className="numberHeader">배당률 (%)</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const state = getRowState(asset, index);
            const { value, emptyRow, isLookingUp, lookupRequired, targetWeightValue, rowClassName, valueCellClassName } = state;

            return (
              <tr key={asset.id || index} className={rowClassName}>
                <td className="tickerCell">{renderTickerControl(asset, index, emptyRow)}</td>
                <td className="assetNameCell">{renderAssetNameWithLookup(asset, index, emptyRow, isLookingUp, lookupRequired)}</td>
                <td className="numberCell tableNumberCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : formatDecimal(asset.quantity, 4)}</td>
                <td className="numberCell priceCell">{renderPrice(asset, emptyRow, lookupRequired)}</td>
                <td className={valueCellClassName}>{formatEvaluationAmount(value)}</td>
                <td className="targetWeightCell">{renderTargetWeight(asset, index, emptyRow, targetWeightValue)}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.cagr} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.beta} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.mdd} formatDecimal={formatDecimal} />}</td>
                <td className="numberCell tableNumberCell metricCell">{emptyRow ? <span className="emptyTextValue numberTextValue">-</span> : <MetricTextValue value={asset.dividendYield} formatDecimal={formatDecimal} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mobileAssetCards">
        {assets.map((asset, index) => renderMobileAssetCard(asset, index))}
      </div>
    </div>
  );
}
