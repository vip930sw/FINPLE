export const MARKET_CODES = {
  US: "US",
  KR: "KR",
};

export const DEFAULT_MARKET_CODE = MARKET_CODES.US;
export const DEFAULT_DISPLAY_CURRENCY = "KRW";

export const MARKET_CONFIGS = {
  [MARKET_CODES.US]: {
    market: MARKET_CODES.US,
    label: "미국주식",
    simulatorLabel: "미국주식 포트폴리오 시뮬레이터",
    screenerLabel: "미국",
    exchangeLabel: "NYSE / Nasdaq / Cboe 등",
    providerScope: "alpha-vantage-us",
    quoteCurrency: "USD",
    displayCurrency: DEFAULT_DISPLAY_CURRENCY,
    defaultExchange: "US",
    defaultAssetType: "ETF",
    isBeta: false,
  },
  [MARKET_CODES.KR]: {
    market: MARKET_CODES.KR,
    label: "한국주식",
    simulatorLabel: "한국주식 포트폴리오 시뮬레이터 Beta",
    screenerLabel: "한국 Beta",
    exchangeLabel: "KRX",
    providerScope: "kr-market-poc",
    quoteCurrency: "KRW",
    displayCurrency: DEFAULT_DISPLAY_CURRENCY,
    defaultExchange: "KRX",
    defaultAssetType: "stock",
    isBeta: true,
  },
};

export function normalizeMarketCode(value) {
  const market = String(value || "").trim().toUpperCase();
  return MARKET_CONFIGS[market] ? market : DEFAULT_MARKET_CODE;
}

export function getMarketConfig(value = DEFAULT_MARKET_CODE) {
  return MARKET_CONFIGS[normalizeMarketCode(value)] || MARKET_CONFIGS[DEFAULT_MARKET_CODE];
}

export function inferMarketFromTicker(ticker, fallbackMarket = DEFAULT_MARKET_CODE) {
  const normalizedTicker = String(ticker || "").trim().toUpperCase();

  if (/^\d{6}$/.test(normalizedTicker)) return MARKET_CODES.KR;
  return normalizeMarketCode(fallbackMarket);
}

export function normalizeTickerForMarket(ticker, market = DEFAULT_MARKET_CODE) {
  const normalizedMarket = normalizeMarketCode(market);
  const normalizedTicker = String(ticker || "").trim().toUpperCase();

  if (normalizedMarket === MARKET_CODES.KR) {
    return normalizedTicker.replace(/[^0-9A-Z.]/g, "");
  }

  return normalizedTicker;
}

export function createAssetMarketMetadata(asset = {}, fallbackMarket = DEFAULT_MARKET_CODE) {
  const inferredMarket = inferMarketFromTicker(asset.ticker || asset.providerSymbol, asset.market || fallbackMarket);
  const marketConfig = getMarketConfig(inferredMarket);
  const providerSymbol = normalizeTickerForMarket(asset.providerSymbol || asset.ticker, inferredMarket);

  return {
    market: inferredMarket,
    exchange: asset.exchange || marketConfig.defaultExchange,
    currency: asset.currency || marketConfig.displayCurrency,
    rawCurrency: asset.rawCurrency || asset.quoteCurrency || marketConfig.quoteCurrency,
    quoteCurrency: asset.quoteCurrency || asset.rawCurrency || marketConfig.quoteCurrency,
    displayCurrency: asset.displayCurrency || asset.currency || marketConfig.displayCurrency,
    providerSymbol,
    assetType: asset.assetType || asset.type || marketConfig.defaultAssetType,
  };
}

export function getMarketQueryValue(market = DEFAULT_MARKET_CODE) {
  return normalizeMarketCode(market).toLowerCase();
}
