import finpleAppCandidates2000Csv from "./finple_app_candidates_2000_final_v1.csv?raw";
import krEtfDividendOverlayCsv from "./kr_etf_dividend_overlay_20260525.csv?raw";
import krStockDividendOverlayCsv from "./kr_stock_dividend_overlay_20260525.csv?raw";
import usDividendOverlayCsv from "./us_dividend_overlay_20260527.csv?raw";
import usPriceMetricsOverlayCsv from "./us_price_metrics_overlay_20260528_app_ready.csv?raw";
import krPriceMetricsOverlayCsv from "./kr_price_metrics_overlay_20260528_app_ready.csv?raw";

const NUMERIC_FIELDS = new Set([
  "expectedCagr",
  "priceCagr10y",
  "beta",
  "mdd",
  "dataYears",
  "dividendYield",
  "marketCap",
  "aum",
]);

const PIPE_FIELDS = new Set(["goals", "tags"]);
const BOOLEAN_FIELDS = new Set(["beginnerFit"]);

const OVERLAY_FIELDS = [
  "providerSymbol",
  "sourceUniverse",
  "tier",
  "strategy",
  "riskLevel",
  "expectedCagr",
  "beta",
  "mdd",
  "dividendYield",
  "displayDividendYield",
  "dividendPolicy",
  "dividendSource",
  "marketCap",
  "aum",
  "sizeSource",
  "dataStatus",
  "reviewTag",
  "reviewReason",
  "metricsSource",
  "goals",
  "beginnerFit",
  "tags",
  "notes",
];

const PRICE_METRICS_FIELDS = [
  "expectedCagr",
  "priceCagr10y",
  "mdd",
  "beta",
  "dataYears",
  "benchmarkTicker",
  "metricsSource",
  "reviewReason",
];

function stripBom(value = "") {
  return String(value || "").replace(/^\uFEFF/, "");
}

function parseCsvLine(line = "") {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => stripBom(cell).trim());
}

function parseCsv(csvText = "") {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function splitPipe(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== "";
}

function normalizeTicker(ticker = "") {
  return stripBom(ticker).trim().toUpperCase();
}

function normalizeMarket(market = "") {
  return String(market || "").trim().toUpperCase() || "US";
}

function overlayKey(row = {}) {
  const ticker = normalizeTicker(row.ticker);
  const market = normalizeMarket(row.market);
  return ticker ? `${market}:${ticker}` : "";
}

function coerceOverlayValue(field, value) {
  if (!hasValue(value)) return undefined;
  if (NUMERIC_FIELDS.has(field)) return toNullableNumber(value);
  if (PIPE_FIELDS.has(field)) return splitPipe(value);
  if (BOOLEAN_FIELDS.has(field)) return toBoolean(value);
  return value;
}

function formatDividendYield(value) {
  const numericValue = toNullableNumber(value);
  if (numericValue === null) return "";
  return `${numericValue.toFixed(2)}%`;
}

function createFinal2000Overlay(row = {}) {
  const overlay = {};

  if (hasValue(row.nameKr)) {
    overlay.nameKr = row.nameKr;
    overlay.koreanName = row.nameKr;
  }

  OVERLAY_FIELDS.forEach((field) => {
    const value = coerceOverlayValue(field, row[field]);
    if (hasValue(value)) overlay[field] = value;
  });

  if (hasValue(overlay.metricsSource)) {
    overlay.metricMode = "final_2000_overlay_price_close";
  }

  overlay.dataSource = "finple_app_candidates_6000_balanced_v1+final_2000_overlay";
  return overlay;
}

function createKrDividendOverlay(row = {}, sourceName = "kr_dividend_overlay_20260525") {
  const dividendYield = toNullableNumber(row.dividendYield);
  if (dividendYield === null) return null;

  return {
    dividendYield,
    displayDividendYield: row.displayDividendYield || formatDividendYield(row.dividendYield),
    dividendPolicy: row.dividendPolicy || "dividend_confirmed",
    dividendSource: row.dividendSource || sourceName,
    dataSource: `finple_app_candidates_6000_balanced_v1+final_2000_overlay+${sourceName}`,
  };
}

function createUsDividendOverlay(row = {}, sourceName = "us_dividend_overlay_20260527") {
  const dividendYield = toNullableNumber(row.dividendYield);
  const dividendPolicy = String(row.dividendPolicy || "").trim();
  const yieldStatus = String(row.yieldStatus || "").trim();

  if (dividendYield === null) return null;
  if (yieldStatus && yieldStatus !== "ready") return null;
  if (dividendPolicy === "dividend_review_required") return null;

  return {
    dividendYield,
    displayDividendYield: row.displayDividendYield || formatDividendYield(row.dividendYield),
    dividendPolicy: dividendPolicy || "dividend_confirmed",
    dividendSource: row.dividendSource || sourceName,
    dataSource: `finple_app_candidates_6000_balanced_v1+final_2000_overlay+${sourceName}`,
  };
}

function createPriceMetricsOverlay(
  row = {},
  sourceName = "price_metrics_overlay",
  metricMode = "price_metrics_overlay_price_close"
) {
  const overlay = {};

  PRICE_METRICS_FIELDS.forEach((field) => {
    const value = coerceOverlayValue(field, row[field]);
    if (hasValue(value)) overlay[field] = value;
  });

  if (!Object.keys(overlay).length) return null;

  const metricsStatus = String(row.metricsStatus || "").trim();
  if (hasValue(metricsStatus)) {
    overlay.dataStatus = metricsStatus;
    overlay.reviewTag = metricsStatus === "ready" ? "" : metricsStatus;
  }

  overlay.metricMode = metricMode;
  overlay.metricsSource = overlay.metricsSource || sourceName;
  overlay.dataSource = `finple_app_candidates_6000_balanced_v1+final_2000_overlay+${sourceName}`;

  return overlay;
}

function buildOverlayMap(csvText = "", createOverlay = createFinal2000Overlay) {
  return parseCsv(csvText).reduce((map, row) => {
    const key = overlayKey(row);
    if (!key) return map;

    const overlay = createOverlay(row);
    if (!overlay) return map;

    map.set(key, overlay);
    return map;
  }, new Map());
}

const final2000OverlayMap = buildOverlayMap(finpleAppCandidates2000Csv, createFinal2000Overlay);
const krEtfDividendOverlayMap = buildOverlayMap(krEtfDividendOverlayCsv, (row) =>
  createKrDividendOverlay(row, "k_etf_rank_dividend_yield_20260525")
);
const krStockDividendOverlayMap = buildOverlayMap(krStockDividendOverlayCsv, (row) =>
  createKrDividendOverlay(row, "kr_stock_dividend_yield_20260525")
);
const usDividendOverlayMap = buildOverlayMap(usDividendOverlayCsv, (row) =>
  createUsDividendOverlay(row, "us_dividend_overlay_20260527")
);
const usPriceMetricsOverlayMap = buildOverlayMap(usPriceMetricsOverlayCsv, (row) =>
  createPriceMetricsOverlay(
    row,
    "us_price_metrics_overlay_20260528_app_ready",
    "us_price_metrics_overlay_price_close"
  )
);
const krPriceMetricsOverlayMap = buildOverlayMap(krPriceMetricsOverlayCsv, (row) =>
  createPriceMetricsOverlay(
    row,
    "kr_price_metrics_overlay_20260528_app_ready",
    "kr_price_metrics_overlay_price_close"
  )
);

export function isPriceMetricsAppReadyCandidate(candidate = {}) {
  const key = overlayKey(candidate);
  return usPriceMetricsOverlayMap.has(key) || krPriceMetricsOverlayMap.has(key);
}

export function applyScreenerCandidateOverlays(candidates = []) {
  return candidates.map((candidate) => {
    const key = overlayKey(candidate);
    const final2000Overlay = final2000OverlayMap.get(key);
    const krEtfDividendOverlay = krEtfDividendOverlayMap.get(key);
    const krStockDividendOverlay = krStockDividendOverlayMap.get(key);
    const usDividendOverlay = usDividendOverlayMap.get(key);
    const usPriceMetricsOverlay = usPriceMetricsOverlayMap.get(key);
    const krPriceMetricsOverlay = krPriceMetricsOverlayMap.get(key);

    if (
      !final2000Overlay &&
      !krEtfDividendOverlay &&
      !krStockDividendOverlay &&
      !usDividendOverlay &&
      !usPriceMetricsOverlay &&
      !krPriceMetricsOverlay
    ) return candidate;

    const mergedCandidate = {
      ...candidate,
      ...(final2000Overlay || {}),
      ...(krEtfDividendOverlay || {}),
      ...(krStockDividendOverlay || {}),
      ...(usDividendOverlay || {}),
      ...(usPriceMetricsOverlay || {}),
      ...(krPriceMetricsOverlay || {}),
    };

    return {
      ...mergedCandidate,
      ticker: candidate.ticker,
      market: candidate.market,
      providerSymbol:
        mergedCandidate.providerSymbol || candidate.providerSymbol || candidate.ticker,
    };
  });
}

export const SCREENER_CANDIDATE_OVERLAY_COUNTS = {
  FINAL_2000: final2000OverlayMap.size,
  KR_ETF_DIVIDEND_20260525: krEtfDividendOverlayMap.size,
  KR_STOCK_DIVIDEND_20260525: krStockDividendOverlayMap.size,
  KR_DIVIDEND_20260525:
    krEtfDividendOverlayMap.size + krStockDividendOverlayMap.size,
  US_DIVIDEND_20260527: usDividendOverlayMap.size,
  US_PRICE_METRICS_20260528: usPriceMetricsOverlayMap.size,
  KR_PRICE_METRICS_20260528: krPriceMetricsOverlayMap.size,
  PRICE_METRICS_APP_READY_20260528:
    usPriceMetricsOverlayMap.size + krPriceMetricsOverlayMap.size,
};
