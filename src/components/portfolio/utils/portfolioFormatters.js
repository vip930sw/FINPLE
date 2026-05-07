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
export function getAssetValue(asset) {
  return Number(asset.quantity || 0) * Number(asset.price || 0);
}
export function getAssetWeight(asset, totalAssetValue) {
  const assetValue = getAssetValue(asset);
  return totalAssetValue > 0 ? (assetValue / totalAssetValue) * 100 : 0;
}
export function createSafeFileName(name, fallback = "portfolio") {
  return (name || fallback).replace(/[\\/:*?"<>|]/g, "-").trim();
}
