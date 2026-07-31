export function formatNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  return Number(String(value).replace(/,/g, "") || 0).toLocaleString();
}
export function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, ""));
}
export function formatDecimal(value, digits = 2) {
  return Number(value || 0).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
export function formatPercent(value) {
  return `${formatDecimal(value, 2)}%`;
}
export const READ_ONLY_PROVIDER_ERROR_TEXT = "확인 필요";
export function formatReadOnlyMetric(value, {
  status = "",
  missingText = "-",
  formatter = (numberValue) => numberValue.toFixed(2),
} = {}) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (["provider_error", "provider_event_error"].includes(normalizedStatus)) {
    return READ_ONLY_PROVIDER_ERROR_TEXT;
  }
  if (value === null || value === undefined || value === "") return missingText;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return missingText;
  return Math.abs(numberValue) < 0.0000001 ? "-" : formatter(numberValue);
}
export function isFetchedAsset(asset) {
  return Boolean(asset?.dataSource && asset.dataSource !== "manual");
}

export function isAutoAsset(asset) {
  return isFetchedAsset(asset);
}

export function isAutoPriceAsset(asset) {
  return asset?.priceMode === "auto" || isFetchedAsset(asset);
}

export function isAutoMetricAsset(asset) {
  return asset?.metricMode === "auto" || asset?.dataSource === "mock" || asset?.dataSource === "backend-mock";
}
export function isEmptyAssetRow(asset) {
  return (
    !asset.ticker &&
    !asset.name &&
    Number(asset.quantity || 0) === 0 &&
    Number(asset.price || 0) === 0 &&
    Number(asset.cagr || 0) === 0 &&
    Number(asset.beta || 0) === 0 &&
    Number(asset.mdd || 0) === 0 &&
    Number(asset.dividendYield || 0) === 0
  );
}
export function getAssetEvaluationValue(asset = {}, simulationStartValue = null) {
  const startValue = Number(simulationStartValue);
  const targetWeight = Number(asset.targetWeight);
  const hasTargetWeight = asset.targetWeight !== null && asset.targetWeight !== undefined && asset.targetWeight !== "";
  if (hasTargetWeight && Number.isFinite(startValue) && startValue > 0 && Number.isFinite(targetWeight) && targetWeight >= 0) {
    return startValue * targetWeight / 100;
  }
  const plannedValue = Number(asset.targetEvaluationAmount || 0);
  return Number.isFinite(plannedValue) && plannedValue > 0 ? plannedValue : 0;
}
export function getAssetEvaluationWeight(asset, totalAssetValue, simulationStartValue = null) {
  const assetValue = getAssetEvaluationValue(asset, simulationStartValue);
  return Number.isFinite(Number(totalAssetValue)) && Number(totalAssetValue) > 0
    ? (assetValue / Number(totalAssetValue)) * 100
    : 0;
}
export function createSafeFileName(name, fallback = "portfolio") {
  return (name || fallback).replace(/[\\/:*?"<>|]/g, "-").trim();
}
