import {
  resolveDistributionDisplayPolicy,
} from "../../../data/tickers/distributionPolicy";
import {
  formatReadOnlyMetric,
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

function formatRoundedThousand(value) {
  const roundedValue = Math.round(toSafeNumber(value) / 1000) * 1000;
  return formatDashWhenZero(roundedValue, (numberValue) => Math.max(0, Math.floor(toSafeNumber(numberValue))).toLocaleString());
}

export default function DetailAssetTable({
  assets,
  totalAssetValue,
  simulationStartValue,
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
            <th>평가금액 (원)</th>
            <th>비중</th>
            <th>CAGR (%)</th>
            <th>BETA</th>
            <th>MDD (%)</th>
            <th>배당률/분배율 (%)</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset, index) => {
            const assetValue = getAssetEvaluationValue(asset, simulationStartValue);
            const weight = getAssetEvaluationWeight(asset, totalAssetValue, simulationStartValue);
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
                <td>{formatAssetValue(assetValue)}</td>
                <td>{formatDashWhenZero(weight, formatPercent)}</td>
                <td>{formatReadOnlyMetric(cagrValue, { formatter: (value) => formatDecimal(value, 2) })}</td>
                <td>{formatReadOnlyMetric(asset.beta, { formatter: (value) => formatDecimal(value, 2) })}</td>
                <td>{formatReadOnlyMetric(asset.mdd, { formatter: (value) => formatDecimal(value, 2) })}</td>
                <td title={distributionDisplay.title}>{formatReadOnlyMetric(cashYield, {
                  status: distributionDisplay.kind,
                  formatter: (value) => formatDecimal(value, 2),
                })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
