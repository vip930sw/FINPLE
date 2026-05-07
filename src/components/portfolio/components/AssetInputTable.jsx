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

  if (source.includes("cache") || cacheMode === "hit") {
    return {
      label: "캐시값",
      className: "cache",
    };
  }

  if (source.includes("alpha-vantage") || source.includes("alpha_vantage")) {
    return {
      label: "Alpha Vantage",
      className: "alpha",
    };
  }

  if (source.includes("mock")) {
    return {
      label: "Mock",
      className: "mock",
    };
  }

  if (source.includes("ticker-master")) {
    return {
      label: "마스터",
      className: "master",
    };
  }

  return {
    label: "수동값",
    className: "manual",
  };
}

function getPriceBasisText(asset, formatDecimal) {
  const rawPrice = Number(asset?.rawPrice || 0);
  const exchangeRate = Number(asset?.exchangeRate || 0);
  const rawCurrency = asset?.rawCurrency || "USD";
  const currency = asset?.currency || "KRW";

  if (rawCurrency && currency === rawCurrency && rawPrice > 0) {
    return `${rawCurrency} ${formatDecimal(rawPrice, 2)}`;
  }

  if (rawPrice > 0 && exchangeRate > 0) {
    return `${rawCurrency} ${formatDecimal(rawPrice, 2)} × ${Math.round(exchangeRate).toLocaleString()}원`;
  }

  if (currency) {
    return `${currency} 기준`;
  }

  return "";
}

function shouldShowReadOnlyValue(asset) {
  const source = String(asset?.dataSource || "manual").toLowerCase();

  return source !== "manual";
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

function LookupRequiredValue({ quantity }) {
  const quantityMissing = Number(quantity || 0) <= 0;

  return (
    <div className="assetInfoStack alignRight lookupRequiredStack">
      <span className="lookupRequiredText">조회 필요</span>
      <small className="lookupRequiredHint">
        {quantityMissing ? "수량 입력 후 조회" : "조회 버튼으로 현재가 반영"}
      </small>
    </div>
  );
}

function MetricTextValue({ value, formatDecimal }) {
  return (
    <span className="assetTextValue numberTextValue">
      {formatDecimal(value, 2)}
    </span>
  );
}

export default function AssetInputTable({
  assets,
  totalAssetValue,
  isEmptyAssetRow,
  isAutoAsset,
  isAutoPriceAsset,
  isAutoMetricAsset,
  formatNumber,
  formatDecimal,
  formatPercent,
  toNumber,
  updateAsset,
  assetLookupStatus,
  recentlyAddedAssetId,
  isBulkAssetLookupLoading,
  fetchAssetData,
  resolveTickerCandidate,
  removeAsset,
}) {
  return (
    <div className="calculatorTableWrap">
      <table className="calculatorTable">
        <thead>
          <tr>
            <th>티커</th>
            <th>자산명</th>
            <th className="numberHeader">수량</th>
            <th className="numberHeader">현재가</th>
            <th className="numberHeader">평가금액</th>
            <th className="numberHeader">비중</th>
            <th className="numberHeader">CAGR (%)</th>
            <th className="numberHeader">BETA</th>
            <th className="numberHeader">MDD (%)</th>
            <th className="numberHeader">배당률 (%)</th>
            <th>조회</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const value = Number(asset.quantity || 0) * Number(asset.price || 0);
            const weight = totalAssetValue > 0 ? (value / totalAssetValue) * 100 : 0;
            const emptyRow = isEmptyAssetRow(asset);
            const lookupKey = asset.id || String(index);
            const lookupStatus = assetLookupStatus?.[lookupKey];
            const isLookingUp = lookupStatus?.status === "loading";
            const sourceInfo = getDataSourceInfo(asset);
            const lookupTime = formatLookupTime(asset.lastUpdatedAt);
            const priceBasisText = getPriceBasisText(asset, formatDecimal);
            const readOnlyFetchedAsset = shouldShowReadOnlyValue(asset);
            const lookupRequired = isLookupRequiredAsset(asset, emptyRow);
            const quantityMissing = !emptyRow && Number(asset.quantity || 0) <= 0;
            const isNewlyAdded = recentlyAddedAssetId && asset.id === recentlyAddedAssetId;
            const rowClassName = [
              isNewlyAdded ? "newAssetRow" : "",
              lookupRequired ? "lookupRequiredRow" : "",
              quantityMissing ? "quantityMissingRow" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const valueCellClassName = quantityMissing || lookupRequired
              ? "numberCell pendingValueCell"
              : "numberCell";
            const fetchButtonClassName = lookupRequired
              ? "fetchAssetButton needsLookup"
              : "fetchAssetButton";

            return (
              <tr key={asset.id || index} className={rowClassName}>
                <td>
                  <input
                    value={asset.ticker}
                    onChange={(e) =>
                      updateAsset(index, "ticker", e.target.value.toUpperCase())
                    }
                    onBlur={(e) =>
                      resolveTickerCandidate?.(index, { ticker: e.currentTarget.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    disabled={isBulkAssetLookupLoading}
                  />
                </td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue">-</span>
                  ) : isAutoAsset(asset) ? (
                    <div className="assetInfoStack">
                      <span className="assetTextValue">{asset.name || "-"}</span>
                    </div>
                  ) : (
                    <input
                      value={asset.name}
                      onChange={(e) => updateAsset(index, "name", e.target.value)}
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td>
                  <input
                    type="number"
                    value={asset.quantity}
                    onChange={(e) =>
                      updateAsset(index, "quantity", Number(e.target.value))
                    }
                    disabled={isBulkAssetLookupLoading}
                  />
                </td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue numberTextValue">-</span>
                  ) : lookupRequired ? (
                    <LookupRequiredValue quantity={asset.quantity} />
                  ) : isAutoPriceAsset(asset) ? (
                    <div className="assetInfoStack alignRight">
                      <span className="assetTextValue numberTextValue">
                        {formatDecimal(asset.price, 2)}
                      </span>

                      <span className="assetMetaLine">
                        <span className={`dataSourceBadge ${sourceInfo.className}`}>
                          {sourceInfo.label}
                        </span>

                        {lookupTime && (
                          <span className="lookupTimeText">{lookupTime}</span>
                        )}
                      </span>

                      {priceBasisText && (
                        <small className="priceBasisText">{priceBasisText}</small>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formatNumber(asset.price)}
                      onChange={(e) =>
                        updateAsset(index, "price", toNumber(e.target.value))
                      }
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td className={valueCellClassName}>{Math.floor(value).toLocaleString()}원</td>
                <td className={valueCellClassName}>{formatPercent(weight)}</td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue numberTextValue">-</span>
                  ) : readOnlyFetchedAsset || isAutoMetricAsset(asset) ? (
                    <MetricTextValue value={asset.cagr} formatDecimal={formatDecimal} />
                  ) : (
                    <input
                      type="number"
                      value={asset.cagr}
                      onChange={(e) =>
                        updateAsset(index, "cagr", Number(e.target.value))
                      }
                      step="0.01"
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue numberTextValue">-</span>
                  ) : readOnlyFetchedAsset || isAutoMetricAsset(asset) ? (
                    <MetricTextValue value={asset.beta} formatDecimal={formatDecimal} />
                  ) : (
                    <input
                      type="number"
                      value={asset.beta}
                      onChange={(e) =>
                        updateAsset(index, "beta", Number(e.target.value))
                      }
                      step="0.01"
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue numberTextValue">-</span>
                  ) : readOnlyFetchedAsset || isAutoMetricAsset(asset) ? (
                    <MetricTextValue value={asset.mdd} formatDecimal={formatDecimal} />
                  ) : (
                    <input
                      type="number"
                      value={asset.mdd}
                      onChange={(e) =>
                        updateAsset(index, "mdd", Number(e.target.value))
                      }
                      step="0.01"
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td>
                  {emptyRow ? (
                    <span className="emptyTextValue numberTextValue">-</span>
                  ) : readOnlyFetchedAsset || isAutoMetricAsset(asset) ? (
                    <MetricTextValue value={asset.dividendYield} formatDecimal={formatDecimal} />
                  ) : (
                    <input
                      type="number"
                      value={asset.dividendYield}
                      onChange={(e) =>
                        updateAsset(index, "dividendYield", Number(e.target.value))
                      }
                      step="0.01"
                      disabled={isBulkAssetLookupLoading}
                    />
                  )}
                </td>

                <td>
                  <button
                    type="button"
                    className={fetchButtonClassName}
                    onClick={() => fetchAssetData(index)}
                    disabled={isLookingUp || isBulkAssetLookupLoading}
                  >
                    {isLookingUp ? "조회 중" : lookupRequired ? "조회 필요" : "조회"}
                  </button>
                </td>

                <td>
                  <button
                    type="button"
                    className="removeButton"
                    onClick={() => removeAsset(index)}
                    disabled={isBulkAssetLookupLoading}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
