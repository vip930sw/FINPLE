import usScreenerCandidatesCsv from "./us_screener_candidates.csv?raw";
import usScreenerCandidatesExtraCsv from "./us_screener_candidates_extra.csv?raw";
import krScreenerCandidatesCsv from "./kr_screener_candidates.csv?raw";
import krStockCandidatesCsv from "./kr_stock_candidates.csv?raw";
import {
  METRICS_POLICY_NOTE_V2_2_3,
  METRICS_ROWS_V2_2_3,
} from "./metricsOverridesV223";

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

function toBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function splitPipe(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAssetType(assetType = "") {
  const value = String(assetType || "").trim().toLowerCase();
  if (value === "stock" || value === "single_stock") return "stock";
  return "ETF";
}

function normalizeCandidateTicker(ticker = "") {
  return stripBom(ticker).trim().toUpperCase();
}

function normalizeMarket(market = "") {
  return String(market || "US").trim().toUpperCase();
}

function makeMetricKey(market = "", ticker = "") {
  const normalizedMarket = normalizeMarket(market);
  const normalizedTicker = normalizeCandidateTicker(ticker);
  return normalizedMarket && normalizedTicker ? `${normalizedMarket}:${normalizedTicker}` : "";
}

function buildMetricsOverrideMap(rowsText = "") {
  const overrideMap = new Map();

  String(rowsText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [market, ticker, expectedCagr, beta, mdd, dividendYield] = line.split("\t");
      const key = makeMetricKey(market, ticker);
      if (!key) return;

      const override = {
        expectedCagr: toNullableNumber(expectedCagr),
        beta: toNullableNumber(beta),
        mdd: toNullableNumber(mdd),
        dividendYield: toNullableNumber(dividendYield),
      };

      overrideMap.set(key, override);
    });

  return overrideMap;
}

const METRICS_OVERRIDES_V2_2_3 = buildMetricsOverrideMap(METRICS_ROWS_V2_2_3);

export const SCREENER_METRICS_POLICY_NOTE = METRICS_POLICY_NOTE_V2_2_3;

function getMetricsOverride(candidate = {}) {
  return METRICS_OVERRIDES_V2_2_3.get(makeMetricKey(candidate.market, candidate.ticker)) || null;
}

function appendMetricNote(notes = "", extraNote = "") {
  const current = String(notes || "").trim();
  const extra = String(extraNote || "").trim();
  if (!extra) return current;
  if (current.includes(extra)) return current;
  return [current, extra].filter(Boolean).join("; ");
}

function applyMetricsOverride(candidate = {}) {
  const override = getMetricsOverride(candidate);
  if (!override) return candidate;

  return {
    ...candidate,
    expectedCagr: override.expectedCagr ?? candidate.expectedCagr,
    beta: override.beta ?? candidate.beta,
    mdd: override.mdd ?? candidate.mdd,
    dividendYield: override.dividendYield ?? candidate.dividendYield,
    metricMode: "v2_2_3_price_close",
    dataSource: "csv_v2_2_3",
    notes: appendMetricNote(
      candidate.notes,
      "metrics v2.2.3 price-close calibrated; dividendYield separate; KR representative index may use rolling median"
    ),
  };
}

function uniqueByTicker(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const ticker = normalizeCandidateTicker(candidate?.ticker || "");
    if (!ticker || seen.has(ticker)) return false;
    seen.add(ticker);
    return true;
  });
}

export function normalizeScreenerCandidate(row = {}) {
  const assetType = normalizeAssetType(row.assetType);
  const market = row.market || "US";

  return {
    ticker: stripBom(row.ticker || "").trim(),
    koreanName: row.nameKr || row.koreanName || row.name || "",
    nameKr: row.nameKr || row.koreanName || row.name || "",
    market,
    currency: row.currency || "KRW",
    quoteCurrency: row.quoteCurrency || (market === "KR" ? "KRW" : "USD"),
    type: assetType,
    assetType,
    strategy: row.strategy || "core",
    riskLevel: row.riskLevel || "medium",
    expectedCagr: toNullableNumber(row.expectedCagr),
    beta: toNullableNumber(row.beta),
    mdd: toNullableNumber(row.mdd),
    dividendYield: toNullableNumber(row.dividendYield),
    goals: splitPipe(row.goals),
    beginnerFit: toBoolean(row.beginnerFit),
    tags: splitPipe(row.tags),
    notes: row.notes || "",
    metricMode: "csv",
    dataSource: "csv",
  };
}

export function loadScreenerCandidatesFromCsv(csvText = "") {
  return parseCsv(csvText)
    .map(normalizeScreenerCandidate)
    .map(applyMetricsOverride)
    .filter((candidate) => candidate.ticker && candidate.koreanName);
}

export const US_CORE_CANDIDATES = loadScreenerCandidatesFromCsv(usScreenerCandidatesCsv);
export const US_EXTRA_CANDIDATES = loadScreenerCandidatesFromCsv(usScreenerCandidatesExtraCsv);
export const US_SCREENER_CANDIDATES = uniqueByTicker([...US_CORE_CANDIDATES, ...US_EXTRA_CANDIDATES]);
export const KR_ETF_CANDIDATES = loadScreenerCandidatesFromCsv(krScreenerCandidatesCsv);
export const KR_STOCK_CANDIDATES = loadScreenerCandidatesFromCsv(krStockCandidatesCsv);
export const KR_SCREENER_CANDIDATES = [...KR_ETF_CANDIDATES, ...KR_STOCK_CANDIDATES];
export const ALL_SCREENER_CANDIDATES = uniqueByTicker([
  ...US_SCREENER_CANDIDATES,
  ...KR_SCREENER_CANDIDATES,
]);

export function findScreenerCandidateByTicker(ticker, market = "") {
  const normalizedTicker = normalizeCandidateTicker(ticker);
  const normalizedMarket = String(market || "").trim().toUpperCase();
  if (!normalizedTicker) return null;

  return (
    ALL_SCREENER_CANDIDATES.find((candidate) => {
      const candidateTicker = normalizeCandidateTicker(candidate?.ticker);
      const candidateMarket = String(candidate?.market || "").trim().toUpperCase();
      return candidateTicker === normalizedTicker && (!normalizedMarket || candidateMarket === normalizedMarket);
    }) ||
    ALL_SCREENER_CANDIDATES.find((candidate) => normalizeCandidateTicker(candidate?.ticker) === normalizedTicker) ||
    null
  );
}

export function createAssetPatchFromScreenerCandidate(candidate = {}) {
  if (!candidate?.ticker) return {};

  return {
    ticker: candidate.ticker,
    displayTicker: candidate.ticker,
    providerSymbol: candidate.ticker,
    name: candidate.koreanName || candidate.nameKr || candidate.ticker,
    market: candidate.market,
    currency: candidate.currency || "KRW",
    quoteCurrency: candidate.quoteCurrency || (candidate.market === "KR" ? "KRW" : "USD"),
    assetType: candidate.assetType || candidate.type || "ETF",
    cagr: candidate.expectedCagr,
    beta: candidate.beta,
    mdd: candidate.mdd,
    dividendYield: candidate.dividendYield,
    metricMode: candidate.metricMode || "csv",
    dataSource: candidate.dataSource || "csv",
  };
}

export function hydrateAssetFromScreenerCandidate(asset = {}) {
  const candidate = findScreenerCandidateByTicker(asset?.ticker, asset?.market);
  if (!candidate) return asset;
  const patch = createAssetPatchFromScreenerCandidate(candidate);

  return {
    ...asset,
    ...patch,
    name: asset.name || patch.name,
    quantity: asset.quantity ?? 0,
    price: asset.price ?? 0,
    priceMode: asset.priceMode || "manual",
    cagr: patch.cagr ?? asset.cagr ?? 0,
    beta: patch.beta ?? asset.beta ?? 0,
    mdd: patch.mdd ?? asset.mdd ?? 0,
    dividendYield: patch.dividendYield ?? asset.dividendYield ?? null,
  };
}

export const SCREENER_CANDIDATE_COUNTS = {
  US: US_SCREENER_CANDIDATES.length,
  US_CORE: US_CORE_CANDIDATES.length,
  US_EXTRA: US_EXTRA_CANDIDATES.length,
  KR: KR_SCREENER_CANDIDATES.length,
  KR_ETF: KR_ETF_CANDIDATES.length,
  KR_STOCK: KR_STOCK_CANDIDATES.length,
};
