const DEFAULT_KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";
const DEFAULT_KIS_MARKET_DIV_CODE = "J";
const DEFAULT_OVERSEAS_EXCHANGE = "NAS";
const KIS_TOKEN_CACHE_SAFETY_MS = 60 * 1000;
const KIS_PRICE_CACHE_TTL_MS = Number(process.env.KIS_PRICE_CACHE_TTL_MS || 30 * 1000);
const KIS_TIMEOUT_MS = Number(process.env.KIS_TIMEOUT_MS || 10000);

let kisTokenCache = {
  accessToken: "",
  expiresAt: 0,
};

const kisPriceCache = new Map();

export function normalizeKrTicker(ticker = "") {
  const rawTicker = String(ticker || "").trim().toUpperCase().replace(/^A/, "");
  const digits = rawTicker.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return digits.padStart(6, "0").slice(-6);
}

export function normalizeUsTicker(ticker = "") {
  return String(ticker || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function hasKisConfig() {
  return Boolean(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);
}

export function isKisOverseasEnabled() {
  return String(process.env.KIS_OVERSEAS_PRICE_ENABLED || "true").toLowerCase() !== "false";
}

function getKisBaseUrl() {
  return String(process.env.KIS_BASE_URL || DEFAULT_KIS_BASE_URL).replace(/\/$/, "");
}

function getKisMarketDivCode() {
  const rawCode = String(process.env.KIS_MARKET_DIV_CODE || DEFAULT_KIS_MARKET_DIV_CODE)
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .toUpperCase();

  if (["J", "W"].includes(rawCode)) return rawCode;
  return DEFAULT_KIS_MARKET_DIV_CODE;
}

function normalizeKisExchangeCode(exchange = "") {
  const raw = String(exchange || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .toUpperCase();

  const exchangeMap = {
    NASDAQ: "NAS",
    NASD: "NAS",
    NAS: "NAS",
    NYSE: "NYS",
    NYS: "NYS",
    AMEX: "AMS",
    AMERICAN: "AMS",
    ARCA: "AMS",
    NYSEARCA: "AMS",
    NYSE_ARCA: "AMS",
    BATS: "AMS",
    CBOE: "AMS",
    AMS: "AMS",
  };

  return exchangeMap[raw] || raw || DEFAULT_OVERSEAS_EXCHANGE;
}

function getKisOverseasExchangeCandidates(exchange = "", ticker = "") {
  const primary = normalizeKisExchangeCode(exchange || process.env.KIS_OVERSEAS_EXCHANGE_DEFAULT || "");
  const normalizedTicker = normalizeUsTicker(ticker);
  const candidates = [primary];

  // 미국 ETF는 KIS에서 AMEX/ARCA 계열(AMS)로 잡히는 경우가 많고,
  // 개별주는 NAS/NYS가 많으므로 후보 거래소를 순차 시도합니다.
  if (["SPY", "VOO", "IVV", "SCHD", "TLT", "GLD", "VNQ", "DIA", "IWM", "BND"].includes(normalizedTicker)) {
    candidates.push("AMS", "NAS", "NYS");
  } else {
    candidates.push("NAS", "NYS", "AMS");
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function getKisErrorSummary(payload = {}) {
  const rtCd = payload?.rt_cd ?? payload?.rtCd ?? "";
  const msgCd = payload?.msg_cd ?? payload?.msgCd ?? "";
  const msg = payload?.msg1 ?? payload?.message ?? payload?.msg ?? "";
  return [rtCd ? `rt_cd=${rtCd}` : "", msgCd ? `msg_cd=${msgCd}` : "", msg ? `msg=${msg}` : ""]
    .filter(Boolean)
    .join(", ");
}

function getCachedPrice(cacheKey) {
  const cached = kisPriceCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > KIS_PRICE_CACHE_TTL_MS) {
    kisPriceCache.delete(cacheKey);
    return null;
  }
  return {
    ...cached.data,
    cacheMode: "hit",
    dataSource: `${cached.data.dataSource}-cache`,
  };
}

function setCachedPrice(cacheKey, data) {
  kisPriceCache.set(cacheKey, {
    data,
    cachedAt: Date.now(),
  });
}

async function requestKisJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KIS_TIMEOUT_MS);

  try {
    const response = await fetch(`${getKisBaseUrl()}${path}`, {
      ...options,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const summary = getKisErrorSummary(payload);
      const error = new Error(
        payload?.msg1 ||
        payload?.message ||
        (summary ? `한국투자증권 API 요청 실패: ${summary}` : `한국투자증권 API 요청 실패: ${response.status}`)
      );
      error.statusCode = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("한국투자증권 API 응답 시간이 초과되었습니다. 잠시 후 다시 조회해주세요.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getKisAccessToken() {
  if (!hasKisConfig()) {
    const error = new Error("KIS_APP_KEY 또는 KIS_APP_SECRET이 서버 환경변수에 설정되어 있지 않습니다.");
    error.statusCode = 500;
    throw error;
  }

  if (kisTokenCache.accessToken && kisTokenCache.expiresAt - KIS_TOKEN_CACHE_SAFETY_MS > Date.now()) {
    return kisTokenCache.accessToken;
  }

  const payload = await requestKisJson("/oauth2/tokenP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
    }),
  });

  const accessToken = payload?.access_token;
  if (!accessToken) {
    const summary = getKisErrorSummary(payload);
    const error = new Error(summary ? `한국투자증권 접근토큰 발급 실패: ${summary}` : "한국투자증권 접근토큰을 발급받지 못했습니다.");
    error.statusCode = 502;
    error.payload = payload;
    throw error;
  }

  const expiresInSeconds = Number(payload?.expires_in || 24 * 60 * 60);
  kisTokenCache = {
    accessToken,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds) * 1000,
  };

  return accessToken;
}

function normalizeKisDomesticPricePayload(ticker, payload = {}) {
  const output = payload?.output || payload?.output1 || {};
  const rawPrice = Number(String(output?.stck_prpr || output?.stck_prdy_clpr || "0").replace(/,/g, ""));

  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    const summary = getKisErrorSummary(payload);
    const error = new Error(
      summary
        ? `한국투자증권 API에서 ${ticker} 현재가를 찾지 못했습니다. (${summary})`
        : `한국투자증권 API에서 ${ticker} 현재가를 찾지 못했습니다.`
    );
    error.statusCode = 404;
    error.payload = payload;
    throw error;
  }

  return {
    ticker,
    displayTicker: ticker,
    providerSymbol: ticker,
    name: ticker,
    market: "KR",
    currency: "KRW",
    quoteCurrency: "KRW",
    price: rawPrice,
    cagr: null,
    beta: null,
    mdd: null,
    dividendYield: null,
    priceMode: "auto",
    metricMode: "price-only",
    dataSource: "kis-domestic-price",
    rawPrice,
    rawCurrency: "KRW",
    exchangeRate: 1,
    fetchedAt: new Date().toISOString(),
    kis: {
      marketDivCode: getKisMarketDivCode(),
      priceChange: output?.prdy_vrss || null,
      priceChangeRate: output?.prdy_ctrt || null,
      tradeVolume: output?.acml_vol || null,
      tradeAmount: output?.acml_tr_pbmn || null,
    },
  };
}

function normalizeKisOverseasPricePayload(ticker, exchangeCode, payload = {}) {
  const output = payload?.output || payload?.output1 || {};
  const rawPrice = Number(String(
    output?.last ||
    output?.ovrs_nmix_prpr ||
    output?.stck_prpr ||
    output?.base ||
    "0"
  ).replace(/,/g, ""));

  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    const summary = getKisErrorSummary(payload);
    const error = new Error(
      summary
        ? `한국투자증권 해외 API에서 ${ticker} 현재가를 찾지 못했습니다. (${summary})`
        : `한국투자증권 해외 API에서 ${ticker} 현재가를 찾지 못했습니다.`
    );
    error.statusCode = 404;
    error.payload = payload;
    throw error;
  }

  return {
    ticker,
    displayTicker: ticker,
    providerSymbol: ticker,
    name: output?.name || output?.hts_kor_isnm || ticker,
    market: "US",
    exchange: exchangeCode,
    currency: "KRW",
    quoteCurrency: "USD",
    price: rawPrice,
    cagr: null,
    beta: null,
    mdd: null,
    dividendYield: null,
    priceMode: "auto",
    metricMode: "price-only",
    dataSource: "kis-overseas-price",
    rawPrice,
    rawCurrency: "USD",
    exchangeRate: null,
    fetchedAt: new Date().toISOString(),
    kis: {
      exchangeCode,
      priceChange: output?.diff || output?.prdy_vrss || null,
      priceChangeRate: output?.rate || output?.prdy_ctrt || null,
      tradeVolume: output?.tvol || output?.acml_vol || null,
    },
  };
}

export async function getKisDomesticPrice(ticker) {
  const normalizedTicker = normalizeKrTicker(ticker);

  if (!normalizedTicker) {
    const error = new Error("국내주식 종목코드 6자리를 입력해주세요.");
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = `KR:${normalizedTicker}`;
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  const accessToken = await getKisAccessToken();
  const query = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: getKisMarketDivCode(),
    FID_INPUT_ISCD: normalizedTicker,
  });

  const payload = await requestKisJson(`/uapi/domestic-stock/v1/quotations/inquire-price?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
      tr_id: process.env.KIS_DOMESTIC_PRICE_TR_ID || "FHKST01010100",
    },
  });

  const data = normalizeKisDomesticPricePayload(normalizedTicker, payload);
  setCachedPrice(cacheKey, data);
  return data;
}

export async function getKisOverseasPrice(ticker, { exchange = "" } = {}) {
  const normalizedTicker = normalizeUsTicker(ticker);

  if (!normalizedTicker) {
    const error = new Error("해외주식 티커를 입력해주세요.");
    error.statusCode = 400;
    throw error;
  }

  const exchangeCandidates = getKisOverseasExchangeCandidates(exchange, normalizedTicker);
  const accessToken = await getKisAccessToken();
  const errors = [];

  for (const exchangeCode of exchangeCandidates) {
    const cacheKey = `US:${exchangeCode}:${normalizedTicker}`;
    const cached = getCachedPrice(cacheKey);
    if (cached) return cached;

    const query = new URLSearchParams({
      AUTH: "",
      EXCD: exchangeCode,
      SYMB: normalizedTicker,
    });

    try {
      const payload = await requestKisJson(`/uapi/overseas-price/v1/quotations/price-detail?${query.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
          authorization: `Bearer ${accessToken}`,
          appkey: process.env.KIS_APP_KEY,
          appsecret: process.env.KIS_APP_SECRET,
          tr_id: process.env.KIS_OVERSEAS_PRICE_TR_ID || "HHDFS76200200",
        },
      });

      const data = normalizeKisOverseasPricePayload(normalizedTicker, exchangeCode, payload);
      setCachedPrice(cacheKey, data);
      return data;
    } catch (error) {
      errors.push(`${exchangeCode}: ${error?.message || "조회 실패"}`);
    }
  }

  const error = new Error(`한국투자증권 해외 API에서 ${normalizedTicker} 현재가를 찾지 못했습니다. (${errors.join(" / ")})`);
  error.statusCode = 404;
  throw error;
}
