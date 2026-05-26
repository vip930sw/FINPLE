import { MOCK_ASSET_DATA } from "../constants/mockAssetData.js";
import { getTickerMasterItem } from "./tickerMasterService.js";
import {
  getKisDomesticPrice,
  getKisOverseasPrice,
  hasKisConfig,
  isKisOverseasEnabled,
  normalizeKrTicker,
  normalizeUsTicker,
} from "./kisPriceService.js";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const DEFAULT_USD_KRW_RATE = Number(process.env.DEFAULT_USD_KRW_RATE || 1350);
const DEFAULT_CACHE_TTL_MS = Number(process.env.ASSET_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const ALPHA_VANTAGE_TIMEOUT_MS = Number(process.env.ALPHA_VANTAGE_TIMEOUT_MS || 10000);
const FX_RATE_CACHE_TTL_MS = Number(process.env.FX_RATE_CACHE_TTL_MS || 10 * 60 * 1000);
const FX_RATE_TIMEOUT_MS = Number(process.env.FX_RATE_TIMEOUT_MS || 7000);
const assetDataCache = new Map();
let usdKrwRateCache = {
  rate: null,
  cachedAt: 0,
  source: "",
};

export function normalizeTicker(ticker) {
  return String(ticker || "").trim().toUpperCase();
}

function isKrTickerLike(ticker = "") {
  return /^A?\d{6}[A-Z]?$/.test(String(ticker || "").trim().toUpperCase());
}

function isUsTickerLike(ticker = "") {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(String(ticker || "").trim().toUpperCase());
}

export function getSelectedProvider() {
  return process.env.ASSET_DATA_PROVIDER || "mock";
}

export function getSupportedTickers() {
  return Array.from(new Set([
    ...Object.keys(MOCK_ASSET_DATA),
  ])).sort();
}

export async function getAssetDataByTicker(ticker) {
  const normalizedTicker = normalizeTicker(ticker);

  if (!normalizedTicker) {
    const error = new Error("티커를 입력해주세요.");
    error.statusCode = 400;
    throw error;
  }

  if (isKrTickerLike(normalizedTicker) && hasKisConfig()) {
    return getKisAssetData(normalizedTicker);
  }

  if (isUsTickerLike(normalizedTicker) && hasKisConfig() && isKisOverseasEnabled()) {
    try {
      return await getKisOverseasAssetData(normalizedTicker);
    } catch (error) {
      if (String(process.env.KIS_OVERSEAS_FALLBACK_TO_ALPHA || "true").toLowerCase() === "false") {
        throw error;
      }
      console.warn(`KIS 해외 현재가 조회 실패. Alpha Vantage fallback을 시도합니다: ${normalizedTicker}`, error.message);
    }
  }

  const provider = getSelectedProvider();

  if (provider === "alpha_vantage") {
    return getAlphaVantageAssetData(normalizedTicker);
  }

  if (provider !== "mock") {
    const error = new Error(
      `아직 연결되지 않은 자산 데이터 공급자입니다: ${provider}`
    );
    error.statusCode = 501;
    throw error;
  }

  return getMockAssetData(normalizedTicker);
}

export async function getAssetDataBatch(tickers = []) {
  const uniqueTickers = Array.from(new Set(tickers.map(normalizeTicker).filter(Boolean)));

  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        return {
          ticker,
          status: "success",
          data: await getAssetDataByTicker(ticker),
        };
      } catch (error) {
        return {
          ticker,
          status: "error",
          message: error.message,
          error: error.message,
        };
      }
    })
  );

  return results;
}

async function getKisAssetData(ticker) {
  const normalizedTicker = normalizeKrTicker(ticker);
  const masterItem = getTickerMasterItem(normalizedTicker);
  const kisPriceData = await getKisDomesticPrice(normalizedTicker);

  return normalizeAssetData({
    ...kisPriceData,
    ticker: normalizedTicker,
    name: masterItem?.koreanName || masterItem?.name || kisPriceData.name || normalizedTicker,
    market: "KR",
    currency: "KRW",
    quoteCurrency: "KRW",
    priceMode: "auto",
    metricMode: "price-only",
    dataSource: kisPriceData.dataSource || "kis-domestic-price",
    fetchedAt: kisPriceData.fetchedAt || new Date().toISOString(),
  });
}

async function getKisOverseasAssetData(ticker) {
  const normalizedTicker = normalizeUsTicker(ticker);
  const masterItem = getTickerMasterItem(normalizedTicker);
  const kisPriceData = await getKisOverseasPrice(normalizedTicker, {
    exchange: masterItem?.exchange || masterItem?.market || "",
  });
  const targetCurrency = process.env.ASSET_PRICE_CURRENCY || "KRW";
  const usdKrwRateInfo = targetCurrency === "KRW" ? await getUsdKrwRateInfo() : { rate: 1, source: "none" };
  const usdKrwRate = usdKrwRateInfo.rate;
  const rawUsdPrice = Number(kisPriceData.rawPrice || kisPriceData.price || 0);
  const convertedPrice = targetCurrency === "KRW" ? Math.round(rawUsdPrice * usdKrwRate) : rawUsdPrice;

  return normalizeAssetData({
    ...kisPriceData,
    ticker: normalizedTicker,
    name: masterItem?.koreanName || masterItem?.name || kisPriceData.name || normalizedTicker,
    market: "US",
    currency: targetCurrency,
    quoteCurrency: "USD",
    price: convertedPrice,
    priceMode: "auto",
    metricMode: "price-only",
    dataSource: kisPriceData.dataSource || "kis-overseas-price",
    rawPrice: rawUsdPrice,
    rawCurrency: "USD",
    exchangeRate: usdKrwRate,
    exchangeRateSource: usdKrwRateInfo.source,
    fetchedAt: kisPriceData.fetchedAt || new Date().toISOString(),
  });
}

function getMockAssetData(ticker) {
  const mockData = MOCK_ASSET_DATA[ticker];

  if (!mockData) {
    const error = new Error(
      `등록되지 않은 티커입니다. 테스트 가능 티커: ${getSupportedTickers().join(", ")}`
    );
    error.statusCode = 404;
    throw error;
  }

  const masterItem = getTickerMasterItem(ticker);

  return normalizeAssetData({
    ticker,
    ...masterItem,
    ...mockData,
    name: mockData.name || masterItem?.koreanName || masterItem?.name || ticker,
    priceMode: "auto",
    metricMode: "auto",
    dataSource: "backend-mock",
    fetchedAt: new Date().toISOString(),
  });
}

function getCachedAssetData(cacheKey) {
  const cached = assetDataCache.get(cacheKey);

  if (!cached) return null;

  const isFresh = Date.now() - cached.cachedAt < DEFAULT_CACHE_TTL_MS;

  if (!isFresh) {
    assetDataCache.delete(cacheKey);
    return null;
  }

  return {
    ...cached.data,
    dataSource: `${cached.data.dataSource}-cache`,
    cacheMode: "hit",
  };
}

function setCachedAssetData(cacheKey, data) {
  assetDataCache.set(cacheKey, {
    data,
    cachedAt: Date.now(),
  });
}

async function getAlphaVantageAssetData(ticker) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const targetCurrency = process.env.ASSET_PRICE_CURRENCY || "KRW";
  const cacheKey = `${ticker}:${targetCurrency}`;
  const cachedData = getCachedAssetData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  if (!apiKey) {
    const error = new Error("ALPHA_VANTAGE_API_KEY가 .env에 설정되어 있지 않습니다.");
    error.statusCode = 500;
    throw error;
  }

  const quotePayload = await requestAlphaVantage({
    function: "GLOBAL_QUOTE",
    symbol: ticker,
    apikey: apiKey,
  });

  const quote = quotePayload?.["Global Quote"] || {};
  const rawUsdPrice = Number(quote?.["05. price"] || 0);

  if (!Number.isFinite(rawUsdPrice) || rawUsdPrice <= 0) {
    const error = new Error(`Alpha Vantage에서 ${ticker} 현재가를 찾지 못했습니다.`);
    error.statusCode = 404;
    throw error;
  }

  let overview = {};

  if (String(process.env.ALPHA_VANTAGE_FETCH_OVERVIEW || "false") === "true") {
    overview = await requestAlphaVantage({
      function: "OVERVIEW",
      symbol: ticker,
      apikey: apiKey,
    });
  }

  const usdKrwRateInfo = targetCurrency === "KRW"
    ? await getUsdKrwRateInfo(apiKey)
    : { rate: 1, source: "none" };
  const usdKrwRate = usdKrwRateInfo.rate;
  const convertedPrice = targetCurrency === "KRW"
    ? rawUsdPrice * usdKrwRate
    : rawUsdPrice;

  const masterItem = getTickerMasterItem(ticker);

  const normalizedData = normalizeAssetData({
    ticker,
    name: masterItem?.koreanName || overview?.Name || ticker,
    market: masterItem?.market || overview?.Exchange || "US",
    currency: targetCurrency,
    price: Math.round(convertedPrice),
    cagr: null,
    beta: normalizeNullableNumber(overview?.Beta),
    mdd: null,
    dividendYield: normalizeDividendYield(overview?.DividendYield),
    priceMode: "auto",
    metricMode: overview?.Name ? "partial-auto" : "manual",
    dataSource: "alpha-vantage",
    rawPrice: rawUsdPrice,
    rawCurrency: "USD",
    exchangeRate: usdKrwRate,
    exchangeRateSource: usdKrwRateInfo.source,
    fetchedAt: new Date().toISOString(),
  });

  setCachedAssetData(cacheKey, normalizedData);

  return normalizedData;
}

async function getUsdKrwRateInfo(apiKey = process.env.ALPHA_VANTAGE_API_KEY) {
  const envRate = normalizeNullableNumber(process.env.USD_KRW_RATE);
  if (envRate && envRate > 0) {
    return { rate: envRate, source: "env-USD_KRW_RATE" };
  }

  if (usdKrwRateCache.rate && Date.now() - usdKrwRateCache.cachedAt < FX_RATE_CACHE_TTL_MS) {
    return { rate: usdKrwRateCache.rate, source: `${usdKrwRateCache.source}-cache` };
  }

  if (String(process.env.FX_RATE_PROVIDER || "live").toLowerCase() !== "live") {
    return { rate: DEFAULT_USD_KRW_RATE, source: "default" };
  }

  try {
    const liveRate = await fetchOpenExchangeUsdKrwRate();
    usdKrwRateCache = {
      rate: liveRate,
      cachedAt: Date.now(),
      source: "open-er-api",
    };
    return { rate: liveRate, source: "open-er-api" };
  } catch (error) {
    console.warn("실시간 USD/KRW 환율 조회 실패. 보조 환율 조회를 시도합니다.", error.message);
  }

  if (apiKey && String(process.env.ALPHA_VANTAGE_FETCH_FX || "false") === "true") {
    try {
      const fxPayload = await requestAlphaVantage({
        function: "CURRENCY_EXCHANGE_RATE",
        from_currency: "USD",
        to_currency: "KRW",
        apikey: apiKey,
      });

      const fx = fxPayload?.["Realtime Currency Exchange Rate"] || {};
      const exchangeRate = Number(fx?.["5. Exchange Rate"] || 0);

      if (Number.isFinite(exchangeRate) && exchangeRate > 0) {
        usdKrwRateCache = {
          rate: exchangeRate,
          cachedAt: Date.now(),
          source: "alpha-vantage-fx",
        };
        return { rate: exchangeRate, source: "alpha-vantage-fx" };
      }
    } catch (error) {
      console.warn("Alpha Vantage USD/KRW 환율 조회 실패. 기본 환율을 사용합니다.", error.message);
    }
  }

  return { rate: DEFAULT_USD_KRW_RATE, source: "default" };
}

async function fetchOpenExchangeUsdKrwRate() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FX_RATE_TIMEOUT_MS);

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`환율 API 요청 실패: ${response.status}`);
    }

    const payload = await response.json();
    const rate = Number(payload?.rates?.KRW || 0);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("환율 API에서 USD/KRW 값을 찾지 못했습니다.");
    }

    return rate;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getUsdKrwRate(apiKey = process.env.ALPHA_VANTAGE_API_KEY) {
  return (await getUsdKrwRateInfo(apiKey)).rate;
}

async function requestAlphaVantage(params) {
  const url = new URL(ALPHA_VANTAGE_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ALPHA_VANTAGE_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    const requestError = new Error(
      error?.name === "AbortError"
        ? "Alpha Vantage 응답 시간이 초과되었습니다. 잠시 후 다시 조회해주세요."
        : `Alpha Vantage 요청 중 오류가 발생했습니다: ${error?.message || "알 수 없는 오류"}`
    );
    requestError.statusCode = 504;
    throw requestError;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const error = new Error(`Alpha Vantage 요청 실패: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  const payload = await response.json();

  if (payload?.Note || payload?.Information) {
    const error = new Error(
      "Alpha Vantage 무료 호출량 제한입니다. 오늘은 기존 조회값을 유지하고, 내일 다시 조회하거나 프리미엄/다른 데이터 소스를 사용해주세요."
    );
    error.statusCode = 429;
    throw error;
  }

  if (payload?.["Error Message"]) {
    const error = new Error(payload["Error Message"]);
    error.statusCode = 400;
    throw error;
  }

  return payload;
}

function normalizeAssetData(data = {}) {
  return {
    ticker: normalizeTicker(data.ticker),
    displayTicker: data.displayTicker || normalizeTicker(data.ticker),
    providerSymbol: data.providerSymbol || normalizeTicker(data.ticker),
    name: data.name || data.ticker,
    market: data.market || "US",
    currency: data.currency || "KRW",
    quoteCurrency: data.quoteCurrency || data.currency || "KRW",
    price: normalizeNullableNumber(data.price) ?? 0,
    cagr: normalizeNullableNumber(data.cagr),
    beta: normalizeNullableNumber(data.beta),
    mdd: normalizeNullableNumber(data.mdd),
    dividendYield: normalizeNullableNumber(data.dividendYield),
    priceMode: data.priceMode || "auto",
    metricMode: data.metricMode || "manual",
    dataSource: data.dataSource || "backend",
    rawPrice: data.rawPrice ?? null,
    rawCurrency: data.rawCurrency || null,
    exchangeRate: data.exchangeRate ?? null,
    exchangeRateSource: data.exchangeRateSource || null,
    fetchedAt: data.fetchedAt || new Date().toISOString(),
  };
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "" || value === "None") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDividendYield(value) {
  const dividendYield = normalizeNullableNumber(value);

  if (dividendYield === null) return null;

  return dividendYield <= 1 ? dividendYield * 100 : dividendYield;
}
