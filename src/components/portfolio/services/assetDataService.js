import { MOCK_ASSET_DATA } from "../constants";
import {
  createAssetMarketMetadata,
  getMarketQueryValue,
  normalizeMarketCode,
  normalizeTickerForMarket,
} from "../config/marketConfig";
import {
  createAssetPatchFromScreenerCandidate,
  findScreenerCandidateByTicker,
} from "../../../data/tickers/screenerCandidateLoader";

const DEFAULT_PROVIDER = "backend";
const DEFAULT_API_BASE_URL = "http://localhost:5050/api";
const DEFAULT_BACKEND_TIMEOUT_MS = 12000;
const DEFAULT_BULK_LOOKUP_DELAY_MS = 1200;
const CASH_REFERENCE_PRICE = 10000;

function getBuildTimeEnv() {
  // Vite 환경변수는 반드시 VITE_ 접두사를 사용해야 브라우저 코드에서 읽을 수 있습니다.
  return import.meta?.env || {};
}

function readNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}
const RATE_LIMIT_STORAGE_KEY = "FINPLE_ALPHA_VANTAGE_RATE_LIMIT_UNTIL";
const RATE_LIMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function delay(ms = 180) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getRuntimeAssetConfig(options = {}) {
  const runtimeConfig =
    typeof window !== "undefined" ? window.FINPLE_ASSET_DATA_CONFIG || {} : {};
  const buildEnv = getBuildTimeEnv();

  return {
    provider:
      options.provider ||
      runtimeConfig.provider ||
      buildEnv.VITE_FINPLE_ASSET_PROVIDER ||
      DEFAULT_PROVIDER,
    apiBaseUrl:
      options.apiBaseUrl ||
      runtimeConfig.apiBaseUrl ||
      buildEnv.VITE_FINPLE_API_BASE_URL ||
      DEFAULT_API_BASE_URL,
    backendTimeoutMs: readNumber(
      options.backendTimeoutMs ||
        runtimeConfig.backendTimeoutMs ||
        buildEnv.VITE_FINPLE_BACKEND_TIMEOUT_MS,
      DEFAULT_BACKEND_TIMEOUT_MS
    ),
    bulkLookupDelayMs: readNumber(
      options.bulkLookupDelayMs ||
        runtimeConfig.bulkLookupDelayMs ||
        buildEnv.VITE_FINPLE_BULK_LOOKUP_DELAY_MS,
      DEFAULT_BULK_LOOKUP_DELAY_MS
    ),
    market: normalizeMarketCode(options.market || runtimeConfig.market || buildEnv.VITE_FINPLE_MARKET || "US"),
  };
}

export function normalizeTicker(ticker, market = "US") {
  return normalizeTickerForMarket(ticker, market);
}

export function getSupportedMockTickers() {
  return Object.keys(MOCK_ASSET_DATA);
}

export function getAssetLookupHelpText() {
  return `현재 테스트 조회 가능 티커: ${getSupportedMockTickers().join(", ")}`;
}

export function getAssetDataProviderLabel(options = {}) {
  const { provider } = getRuntimeAssetConfig(options);

  if (provider === "backend") return "Backend API";
  if (provider === "mock") return "Mock Data";

  return "Auto Mode: Backend API → Mock Data";
}

function isRateLimitMessage(message = "") {
  return /Alpha Vantage|호출 제한|rate limit|premium/i.test(String(message));
}

function isCashTicker(ticker = "") {
  return String(ticker || "").trim().toUpperCase() === "CASH";
}

function createCashAssetData() {
  const now = new Date().toISOString();
  return {
    ticker: "CASH",
    displayTicker: "CASH",
    providerSymbol: "CASH",
    name: "현금 / 대기자금",
    market: "CASH",
    exchange: "MANUAL",
    currency: "KRW",
    quoteCurrency: "KRW",
    displayCurrency: "KRW",
    assetType: "CASH",
    price: CASH_REFERENCE_PRICE,
    cagr: 2.5,
    beta: 0,
    mdd: 0,
    dividendYield: 2.0,
    displayDividendYield: "2.00%",
    dividendPolicy: "cash_reference",
    dividendSource: "manual",
    reviewTag: "",
    reviewReason: "",
    priceMode: "manual",
    metricMode: "manual",
    dataSource: "manual-cash",
    cacheMode: "cash-reference",
    rawPrice: CASH_REFERENCE_PRICE,
    rawCurrency: "KRW",
    exchangeRate: 1,
    fetchedAt: now,
  };
}

function isKrTickerLike(ticker = "", market = "US") {
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  return market === "KR" || /^\d{6}[A-Z]?$/.test(normalizedTicker);
}

function getUnsupportedKrLookupMessage(ticker = "") {
  return `${ticker}는 한국 자산 후보입니다. 한국 현재가 API는 아직 연결 전이므로 현재가만 수동으로 확인해 주세요. CSV에 있는 CAGR·BETA·MDD는 먼저 적용됩니다.`;
}

function getLocalCsvCandidate(ticker, market = "") {
  return findScreenerCandidateByTicker(ticker, market);
}

function createLocalCsvAssetData(ticker, candidate, fallbackMarket = "US") {
  const patch = createAssetPatchFromScreenerCandidate(candidate || {});
  const marketMetadata = createAssetMarketMetadata({ ...patch, ticker: patch.ticker || ticker }, patch.market || fallbackMarket);
  const normalizedTicker = normalizeTicker(patch.ticker || ticker, marketMetadata.market);

  return {
    ticker: normalizedTicker,
    displayTicker: patch.displayTicker || normalizedTicker,
    providerSymbol: patch.providerSymbol || marketMetadata.providerSymbol || normalizedTicker,
    name: patch.name || normalizedTicker,
    market: marketMetadata.market,
    exchange: patch.exchange || marketMetadata.exchange,
    currency: patch.currency || marketMetadata.currency,
    quoteCurrency: patch.quoteCurrency || marketMetadata.quoteCurrency,
    displayCurrency: patch.displayCurrency || marketMetadata.displayCurrency,
    assetType: patch.assetType || marketMetadata.assetType,
    price: null,
    cagr: normalizeNullableNumber(patch.cagr),
    beta: normalizeNullableNumber(patch.beta),
    mdd: normalizeNullableNumber(patch.mdd),
    dividendYield: normalizeNullableNumber(patch.dividendYield),
    displayDividendYield: patch.displayDividendYield || "",
    dividendPolicy: patch.dividendPolicy || "",
    dividendSource: patch.dividendSource || "",
    reviewTag: patch.reviewTag || "",
    reviewReason: patch.reviewReason || "",
    priceMode: "lookup-required",
    metricMode: "csv",
    dataSource: "csv",
    cacheMode: null,
    rawPrice: null,
    rawCurrency: patch.quoteCurrency || patch.currency || marketMetadata.rawCurrency || null,
    exchangeRate: null,
    fetchedAt: new Date().toISOString(),
  };
}

function mergeCsvMetrics(assetData = {}, ticker = "", fallbackMarket = "") {
  const candidate = getLocalCsvCandidate(assetData.ticker || ticker, assetData.market || fallbackMarket);
  if (!candidate) return assetData;

  const csvData = createLocalCsvAssetData(assetData.ticker || ticker, candidate, assetData.market || fallbackMarket || candidate.market);

  return {
    ...assetData,
    name: assetData.name && assetData.name !== (assetData.ticker || ticker) ? assetData.name : csvData.name,
    market: assetData.market || csvData.market,
    currency: assetData.currency || csvData.currency,
    quoteCurrency: assetData.quoteCurrency || csvData.quoteCurrency,
    assetType: assetData.assetType || csvData.assetType,
    cagr: csvData.cagr ?? assetData.cagr,
    beta: csvData.beta ?? assetData.beta,
    mdd: csvData.mdd ?? assetData.mdd,
    dividendYield: csvData.dividendYield ?? assetData.dividendYield,
    displayDividendYield: csvData.displayDividendYield || assetData.displayDividendYield || "",
    dividendPolicy: csvData.dividendPolicy || assetData.dividendPolicy || "",
    dividendSource: csvData.dividendSource || assetData.dividendSource || "",
    reviewTag: csvData.reviewTag || assetData.reviewTag || "",
    reviewReason: csvData.reviewReason || assetData.reviewReason || "",
    metricMode: "csv",
    dataSource: assetData.dataSource ? `${assetData.dataSource}+csv` : "csv",
  };
}

async function fetchKrPriceAssetData(ticker, config, csvCandidate) {
  const requestUrl = `${config.apiBaseUrl}/assets/${encodeURIComponent(ticker)}?market=KR`;
  const response = await fetchWithTimeout(requestUrl, {
    timeoutMs: config.backendTimeoutMs,
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    const message = payload?.message || getUnsupportedKrLookupMessage(ticker);
    const error = new Error(message);
    error.code = payload?.code || "KR_PRICE_LOOKUP_FAILED";
    throw error;
  }

  const apiData = payload?.data || payload;
  const priceData = normalizeBackendAssetData(ticker, apiData, "KR");
  const merged = mergeCsvMetrics(priceData, ticker, "KR");

  return {
    ...(csvCandidate ? mergeCsvMetrics(createLocalCsvAssetData(ticker, csvCandidate, "KR"), ticker, "KR") : {}),
    ...merged,
    price: normalizeNullableNumber(apiData.price) ?? merged.price,
    priceMode: "auto",
    metricMode: "csv",
    dataSource: merged.dataSource?.includes("csv") ? merged.dataSource : "backend-kis+csv",
  };
}

function getRateLimitUntil() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY) || 0);
}

function setRateLimitCooldown() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    RATE_LIMIT_STORAGE_KEY,
    String(Date.now() + RATE_LIMIT_COOLDOWN_MS)
  );
}

function assertNotInRateLimitCooldown() {
  const rateLimitUntil = getRateLimitUntil();

  if (rateLimitUntil > Date.now()) {
    const retryAt = new Date(rateLimitUntil).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    throw new Error(
      `Alpha Vantage 무료 호출량 제한 상태입니다. 기존 값을 유지하고 ${retryAt} 이후 다시 조회해주세요.`
    );
  }
}

export async function fetchAssetDataByTicker(ticker, options = {}) {
  const config = getRuntimeAssetConfig(options);
  const normalizedTicker = normalizeTicker(ticker, config.market);

  if (!normalizedTicker) {
    throw new Error("티커를 먼저 입력해주세요.");
  }

  if (isCashTicker(normalizedTicker)) {
    return createCashAssetData();
  }

  const csvCandidate = getLocalCsvCandidate(normalizedTicker, config.market);

  if (isKrTickerLike(normalizedTicker, config.market)) {
    if (csvCandidate) {
      try {
        return await fetchKrPriceAssetData(normalizedTicker, config, csvCandidate);
      } catch (error) {
        return {
          ...createLocalCsvAssetData(normalizedTicker, csvCandidate, "KR"),
          lookupError: error?.message || getUnsupportedKrLookupMessage(normalizedTicker),
        };
      }
    }
    throw new Error(getUnsupportedKrLookupMessage(normalizedTicker));
  }

  if (config.provider === "backend") {
    assertNotInRateLimitCooldown();
    return mergeCsvMetrics(await fetchBackendAssetDataByTicker(normalizedTicker, config), normalizedTicker, config.market);
  }

  if (config.provider === "mock") {
    return mergeCsvMetrics(await fetchMockAssetDataByTicker(normalizedTicker, config), normalizedTicker, config.market);
  }

  return mergeCsvMetrics(await fetchAutoAssetDataByTicker(normalizedTicker, config), normalizedTicker, config.market);
}

export async function fetchAssetDataBatch(tickers, options = {}) {
  const config = getRuntimeAssetConfig(options);
  const uniqueTickers = Array.from(
    new Set((tickers || []).map((ticker) => normalizeTicker(ticker, config.market)).filter(Boolean))
  );

  const lookupResults = [];
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

  // 전체 조회는 순차 처리하되, 화면이 멈춘 것처럼 보이지 않도록
  // 티커별 진행 상태를 호출부로 전달합니다.
  for (let tickerIndex = 0; tickerIndex < uniqueTickers.length; tickerIndex += 1) {
    const ticker = uniqueTickers[tickerIndex];

    if (isCashTicker(ticker)) {
      const data = createCashAssetData();
      lookupResults.push({ ticker: "CASH", status: "success", data, cacheMode: "cash-reference" });
      onProgress?.({
        ticker: "CASH",
        index: tickerIndex,
        total: uniqueTickers.length,
        status: "success",
        message: "CASH 기준값 유지",
      });
      continue;
    }

    const csvCandidate = getLocalCsvCandidate(ticker, config.market);

    if (isKrTickerLike(ticker, config.market)) {
      if (csvCandidate) {
        try {
          const data = await fetchKrPriceAssetData(ticker, config, csvCandidate);
          lookupResults.push({ ticker, status: "success", data, cacheMode: "backend-kis+csv" });
          onProgress?.({
            ticker,
            index: tickerIndex,
            total: uniqueTickers.length,
            status: "success",
            message: `${ticker} 현재가 조회 완료 + CSV 지표 적용`,
          });
        } catch (error) {
          const data = {
            ...createLocalCsvAssetData(ticker, csvCandidate, "KR"),
            lookupError: error?.message || getUnsupportedKrLookupMessage(ticker),
          };
          lookupResults.push({ ticker, status: "success", data, cacheMode: "csv" });
          onProgress?.({
            ticker,
            index: tickerIndex,
            total: uniqueTickers.length,
            status: "success",
            message: `${ticker} CSV 지표 적용, 현재가는 기존 평가금액 기준 유지`,
          });
        }
        continue;
      }

      const message = getUnsupportedKrLookupMessage(ticker);
      lookupResults.push({
        ticker,
        status: "error",
        error: message,
      });
      onProgress?.({
        ticker,
        index: tickerIndex,
        total: uniqueTickers.length,
        status: "error",
        message,
      });
      continue;
    }

    if (tickerIndex > 0 && config.provider === "backend" && config.bulkLookupDelayMs > 0) {
      onProgress?.({
        ticker,
        index: tickerIndex,
        total: uniqueTickers.length,
        status: "waiting",
        message: `${ticker} 조회 대기 중`,
      });
      await delay(config.bulkLookupDelayMs);
    }

    onProgress?.({
      ticker,
      index: tickerIndex,
      total: uniqueTickers.length,
      status: "loading",
      message: `${ticker} 조회 중`,
    });

    try {
      const data = await fetchAssetDataByTicker(ticker, options);

      lookupResults.push({
        ticker,
        status: "success",
        data,
      });

      onProgress?.({
        ticker,
        index: tickerIndex,
        total: uniqueTickers.length,
        status: "success",
        message: data?.metricMode === "csv" ? `${ticker} 조회 완료 + CSV 지표 적용` : `${ticker} 조회 완료`,
      });
    } catch (error) {
      const errorMessage = error?.message || "자산 데이터를 조회하지 못했습니다.";

      lookupResults.push({
        ticker,
        status: "error",
        error: errorMessage,
      });

      onProgress?.({
        ticker,
        index: tickerIndex,
        total: uniqueTickers.length,
        status: isRateLimitMessage(errorMessage) ? "rate-limit" : "error",
        message: errorMessage,
      });

      if (isRateLimitMessage(errorMessage)) {
        setRateLimitCooldown();

        for (let nextIndex = tickerIndex + 1; nextIndex < uniqueTickers.length; nextIndex += 1) {
          lookupResults.push({
            ticker: uniqueTickers[nextIndex],
            status: "error",
            error: "Alpha Vantage 호출 제한으로 조회를 생략했습니다. 기존 값을 유지합니다.",
          });
        }

        break;
      }
    }
  }

  return lookupResults;
}

async function fetchAutoAssetDataByTicker(ticker, config) {
  try {
    return await fetchBackendAssetDataByTicker(ticker, config);
  } catch (backendError) {
    const mockData = await fetchMockAssetDataByTicker(ticker, config);

    return {
      ...mockData,
      dataSource: "mock-fallback",
      backendError: backendError?.message || "Backend API 조회 실패",
    };
  }
}

async function fetchMockAssetDataByTicker(ticker, config = {}) {
  await delay();

  const mockData = MOCK_ASSET_DATA[ticker];

  if (!mockData) {
    throw new Error(
      `아직 등록되지 않은 티커입니다. ${getAssetLookupHelpText()}`
    );
  }

  const marketMetadata = createAssetMarketMetadata({ ...mockData, ticker }, config.market);

  return {
    ticker,
    displayTicker: ticker,
    providerSymbol: marketMetadata.providerSymbol || ticker,
    ...mockData,
    ...marketMetadata,
    priceMode: "auto",
    metricMode: "auto",
    dataSource: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchBackendAssetDataByTicker(ticker, config) {
  const requestUrl = `${config.apiBaseUrl}/assets/${encodeURIComponent(ticker)}?market=${encodeURIComponent(getMarketQueryValue(config.market))}`;
  const response = await fetchWithTimeout(requestUrl, {
    timeoutMs: config.backendTimeoutMs,
  });

  if (!response.ok) {
    const errorPayload = await readJsonSafely(response);
    const message =
      errorPayload?.message ||
      "자산 데이터를 불러오지 못했습니다. API 응답을 확인해주세요.";

    if (response.status === 429 || isRateLimitMessage(message)) {
      setRateLimitCooldown();
    }

    throw new Error(message);
  }

  const responsePayload = await response.json();
  const data = responsePayload?.data || responsePayload;

  return normalizeBackendAssetData(ticker, data, config.market);
}

async function fetchWithTimeout(url, { timeoutMs }) {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
  } finally {
    window.clearTimeout(timerId);
  }
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function normalizeBackendAssetData(ticker, data = {}, fallbackMarket = "US") {
  const marketMetadata = createAssetMarketMetadata({ ...data, ticker: data.ticker || ticker }, fallbackMarket);
  const normalizedTicker = normalizeTicker(data.ticker || ticker, marketMetadata.market);

  return {
    ticker: normalizedTicker,
    displayTicker: data.displayTicker || normalizedTicker,
    providerSymbol: data.providerSymbol || marketMetadata.providerSymbol || normalizedTicker,
    name: data.name || ticker,
    market: marketMetadata.market,
    exchange: data.exchange || marketMetadata.exchange,
    currency: data.currency || marketMetadata.currency,
    quoteCurrency: data.quoteCurrency || marketMetadata.quoteCurrency,
    displayCurrency: data.displayCurrency || marketMetadata.displayCurrency,
    assetType: data.assetType || data.type || marketMetadata.assetType,
    price: normalizeNullableNumber(data.price),
    cagr: normalizeNullableNumber(data.cagr),
    beta: normalizeNullableNumber(data.beta),
    mdd: normalizeNullableNumber(data.mdd),
    dividendYield: normalizeNullableNumber(data.dividendYield),
    displayDividendYield: data.displayDividendYield || "",
    dividendPolicy: data.dividendPolicy || "",
    dividendSource: data.dividendSource || "",
    reviewTag: data.reviewTag || "",
    reviewReason: data.reviewReason || "",
    priceMode: data.priceMode || "auto",
    metricMode: data.metricMode || "auto",
    dataSource: data.dataSource || "backend",
    cacheMode: data.cacheMode || null,
    rawPrice: normalizeNullableNumber(data.rawPrice),
    rawCurrency: data.rawCurrency || marketMetadata.rawCurrency || null,
    exchangeRate: normalizeNullableNumber(data.exchangeRate),
    fetchedAt: data.fetchedAt || new Date().toISOString(),
  };
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}


export async function fetchTickerCandidateByTicker(ticker, options = {}) {
  const market = normalizeMarketCode(options.market || "US");
  const normalizedTicker = normalizeTicker(ticker, market);

  if (!normalizedTicker) {
    throw new Error("티커를 먼저 입력해주세요.");
  }

  if (isCashTicker(normalizedTicker)) {
    return createCashAssetData();
  }

  const localCandidate = getLocalCsvCandidate(normalizedTicker, market);
  if (localCandidate) return localCandidate;

  const config = getRuntimeAssetConfig({ market });
  const url = `${config.apiBaseUrl}/tickers/${encodeURIComponent(normalizedTicker)}?market=${encodeURIComponent(getMarketQueryValue(market))}`;
  const response = await fetchWithTimeout(url, {
    timeoutMs: config.backendTimeoutMs,
  });

  if (!response.ok) {
    const errorPayload = await readJsonSafely(response);
    throw new Error(errorPayload?.message || `${normalizedTicker}를 티커 마스터에서 찾지 못했습니다.`);
  }

  return response.json();
}

export async function searchTickerCandidates({
  query = "",
  market = "all",
  type = "all",
  category = "all",
  riskLevel = "all",
  beginnerFit = "all",
  limit = 20,
} = {}) {
  const config = getRuntimeAssetConfig({ market: market === "all" ? "US" : market });
  const url = new URL(`${config.apiBaseUrl}/tickers/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("market", market === "all" ? "all" : getMarketQueryValue(market));
  url.searchParams.set("type", type);
  url.searchParams.set("category", category);
  url.searchParams.set("riskLevel", riskLevel);
  url.searchParams.set("beginnerFit", String(beginnerFit));
  url.searchParams.set("limit", String(limit));

  const response = await fetchWithTimeout(url.toString(), {
    timeoutMs: config.backendTimeoutMs,
  });

  if (!response.ok) {
    const errorPayload = await readJsonSafely(response);
    throw new Error(errorPayload?.message || "티커 검색 결과를 불러오지 못했습니다.");
  }

  return response.json();
}

export async function screenTickerCandidates({
  goal = "all",
  riskLevel = "all",
  type = "all",
  market = "all",
  minDividendYield = "",
  maxBeta = "",
  minCagr = "",
  maxMdd = "",
  beginnerOnly = false,
  limit = 30,
} = {}) {
  const config = getRuntimeAssetConfig({ market: market === "all" ? "US" : market });
  const url = new URL(`${config.apiBaseUrl}/tickers/screener`);
  url.searchParams.set("goal", goal);
  url.searchParams.set("riskLevel", riskLevel);
  url.searchParams.set("type", type);
  url.searchParams.set("market", market === "all" ? "all" : getMarketQueryValue(market));
  url.searchParams.set("beginnerOnly", String(beginnerOnly));
  url.searchParams.set("limit", String(limit));

  if (minDividendYield !== "") url.searchParams.set("minDividendYield", String(minDividendYield));
  if (maxBeta !== "") url.searchParams.set("maxBeta", String(maxBeta));
  if (minCagr !== "") url.searchParams.set("minCagr", String(minCagr));
  if (maxMdd !== "") url.searchParams.set("maxMdd", String(maxMdd));

  const response = await fetchWithTimeout(url.toString(), {
    timeoutMs: config.backendTimeoutMs,
  });

  if (!response.ok) {
    const errorPayload = await readJsonSafely(response);
    throw new Error(errorPayload?.message || "스크리너 결과를 불러오지 못했습니다.");
  }

  return response.json();
}
