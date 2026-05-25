const DEFAULT_KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeTicker(value = "") {
  return String(value || "").replace(/[^0-9]/g, "").padStart(6, "0").slice(-6);
}

function getKisConfig() {
  return {
    appKey: process.env.KIS_APP_KEY || "",
    appSecret: process.env.KIS_APP_SECRET || "",
    baseUrl: process.env.KIS_BASE_URL || DEFAULT_KIS_BASE_URL,
    marketDivCode: process.env.KIS_MARKET_DIV_CODE || "J",
  };
}

function isKisConfigured(config) {
  return Boolean(config.appKey && config.appSecret && config.baseUrl);
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function getKisAccessToken(config) {
  if (cachedAccessToken && cachedAccessTokenExpiresAt > Date.now() + 60_000) {
    return cachedAccessToken;
  }

  const response = await fetch(`${config.baseUrl}/oauth2/tokenP`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: config.appKey,
      appsecret: config.appSecret,
    }),
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.msg1 || "KIS access token request failed");
  }

  cachedAccessToken = payload.access_token;
  const expiresIn = Number(payload.expires_in || 0);
  cachedAccessTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;

  return cachedAccessToken;
}

function parseKisPricePayload(payload, ticker) {
  const output = payload?.output || {};
  const price = Number(String(output.stck_prpr || "").replace(/,/g, ""));

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(payload?.msg1 || `${ticker} 현재가를 확인하지 못했습니다.`);
  }

  return {
    ticker,
    displayTicker: ticker,
    providerSymbol: ticker,
    name: output.hts_kor_isnm || output.prdt_name || ticker,
    market: "KR",
    currency: "KRW",
    quoteCurrency: "KRW",
    assetType: "ETF",
    price,
    priceMode: "auto",
    metricMode: "csv",
    dataSource: "kis",
    rawPrice: price,
    rawCurrency: "KRW",
    exchangeRate: null,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchKisCurrentPrice(ticker, config) {
  const accessToken = await getKisAccessToken(config);
  const url = new URL(`${config.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", config.marketDivCode);
  url.searchParams.set("FID_INPUT_ISCD", ticker);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${accessToken}`,
      appkey: config.appKey,
      appsecret: config.appSecret,
      tr_id: "FHKST01010100",
      custtype: "P",
    },
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.rt_cd === "1") {
    throw new Error(payload?.msg1 || `${ticker} KIS 현재가 조회에 실패했습니다.`);
  }

  return parseKisPricePayload(payload, ticker);
}

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const ticker = normalizeTicker(request.query?.ticker || request.query?.code || "");

  if (!ticker) {
    response.status(400).json({ message: "한국 종목코드 6자리를 입력해주세요." });
    return;
  }

  const config = getKisConfig();

  if (!isKisConfigured(config)) {
    response.status(501).json({
      code: "KR_PRICE_DISABLED",
      message: "한국 현재가 API 환경변수가 설정되지 않아 현재가 조회를 비활성화했습니다.",
      ticker,
    });
    return;
  }

  try {
    const data = await fetchKisCurrentPrice(ticker, config);
    response.status(200).json({ data });
  } catch (error) {
    response.status(502).json({
      code: "KR_PRICE_LOOKUP_FAILED",
      message: error?.message || "한국 현재가 조회에 실패했습니다.",
      ticker,
    });
  }
}
