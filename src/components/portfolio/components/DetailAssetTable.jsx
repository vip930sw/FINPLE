import {
  resolveDistributionDisplayPolicy,
} from "../../../data/tickers/distributionPolicy";
import {
  getAssetEvaluationValue,
  getAssetEvaluationWeight,
} from "../utils/portfolioFormatters";

function toSafeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isZeroValue(value) {
  return Math.abs(toSafeNumber(value)) < 0.0000001;
}

function formatDashWhenZero(value, formatter) {
  return isZeroValue(value) ? "-" : formatter(value);
}

function formatQuantity(value) {
  return formatDashWhenZero(value, (numberValue) => toSafeNumber(numberValue).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));
}

function formatRoundedThousand(value) {
  const roundedValue = Math.round(toSafeNumber(value) / 1000) * 1000;
  return formatDashWhenZero(roundedValue, (numberValue) => Math.max(0, Math.floor(toSafeNumber(numberValue))).toLocaleString());
}

function formatMetric(value, formatter) {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? formatter(numberValue) : "-";
}

export default function DetailAssetTable({
  assets,
  totalAssetValue,
  formatNumber,
  formatPercent,
  formatDecimal,
  formatWholeNumber,
}) {
  const formatAssetValue = typeof formatWholeNumber === "function"
    ? (value) => formatRoundedThousand(value)
    : formatRoundedThousand;

  return (
    <div className="detailAssetTableWrap">
      <table className="detailAssetTable">
        <thead>
          <tr>
            <th>티커</th>
            <th>자산명</th>
            <th>수량</th>
            <th>현재가 (원)</th>
            <th>평가금액 (원)</th>
            <th>비중</th>
            <th>CAGR (%)</th>
            <th>BETA</th>
            <th>MDD (%)</th>
            <th>배당/현금분배율 (%)</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const assetValue = getAssetEvaluationValue(asset);
            const weight = getAssetEvaluationWeight(asset, totalAssetValue);
            const cagrValue = asset.cagr;
            const distributionDisplay = resolveDistributionDisplayPolicy(asset);
            const cashYield = distributionDisplay.kind === "ordinary"
              ? asset.dividendYield
              : distributionDisplay.kind === "provider_error"
                ? null
                : asset.trailingDistributionYield;

            return (
              <tr key={`${asset.ticker || "asset"}-${index}`}>
                <td>{asset.ticker || "-"}</td>
                <td>{asset.name || "-"}</td>
                <td>{formatQuantity(asset.quantity)}</td>
                <td>{formatDashWhenZero(asset.price, formatNumber)}</td>
                <td>{formatAssetValue(assetValue)}</td>
                <td>{formatDashWhenZero(weight, formatPercent)}</td>
                <td>{formatMetric(cagrValue, (value) => formatDecimal(value, 2))}</td>
                <td>{formatMetric(asset.beta, (value) => formatDecimal(value, 2))}</td>
                <td>{formatMetric(asset.mdd, (value) => formatDecimal(value, 2))}</td>
                <td title={distributionDisplay.title}>{formatMetric(cashYield, (value) => formatDecimal(value, 2))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
