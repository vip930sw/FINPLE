import {
  inferMarketFromTicker,
  normalizeMarketCode,
  normalizeTickerForMarket,
} from "../config/marketConfig.js";

export const DUPLICATE_ASSET_ALERT_MESSAGE =
  "각 자산은 포트폴리오에 한 번만 추가할 수 있습니다.";

export function createPortfolioAssetIdentity({ market, ticker } = {}) {
  const rawTicker = String(ticker || "").trim().toUpperCase();
  if (!rawTicker) return "";
  const rawMarket = String(market || "").trim().toUpperCase();
  const normalizedMarket =
    rawTicker === "CASH" || rawMarket === "CASH"
      ? "CASH"
      : normalizeMarketCode(inferMarketFromTicker(rawTicker, rawMarket));
  const normalizedTicker =
    normalizedMarket === "CASH"
      ? "CASH"
      : normalizeTickerForMarket(rawTicker, normalizedMarket);
  return `${normalizedMarket}:${normalizedTicker}`;
}

export function findDuplicateAssetIndex({
  assets = [],
  ticker,
  market,
  excludeIndex = -1,
} = {}) {
  const identity = createPortfolioAssetIdentity({ market, ticker });
  if (!identity || !Array.isArray(assets)) return -1;
  return assets.findIndex(
    (asset, index) =>
      index !== excludeIndex &&
      asset &&
      typeof asset === "object" &&
      !Array.isArray(asset) &&
      createPortfolioAssetIdentity(asset) === identity,
  );
}
