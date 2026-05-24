import usScreenerCandidatesCsv from "./us_screener_candidates.csv?raw";
import usScreenerCandidatesExtraCsv from "./us_screener_candidates_extra.csv?raw";
import krScreenerCandidatesCsv from "./kr_screener_candidates.csv?raw";
import krStockCandidatesCsv from "./kr_stock_candidates.csv?raw";

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

function uniqueByTicker(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const ticker = stripBom(candidate?.ticker || "").trim().toUpperCase();
    if (!ticker || seen.has(ticker)) return false;
    seen.add(ticker);
    return true;
  });
}

export function normalizeScreenerCandidate(row = {}) {
  const assetType = normalizeAssetType(row.assetType);

  return {
    ticker: stripBom(row.ticker || "").trim(),
    koreanName: row.nameKr || row.koreanName || row.name || "",
    nameKr: row.nameKr || row.koreanName || row.name || "",
    market: row.market || "US",
    currency: row.currency || "KRW",
    quoteCurrency: row.quoteCurrency || (row.market === "KR" ? "KRW" : "USD"),
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
    dataSource: "csv",
  };
}

export function loadScreenerCandidatesFromCsv(csvText = "") {
  return parseCsv(csvText)
    .map(normalizeScreenerCandidate)
    .filter((candidate) => candidate.ticker && candidate.koreanName);
}

export const US_CORE_CANDIDATES = loadScreenerCandidatesFromCsv(usScreenerCandidatesCsv);
export const US_EXTRA_CANDIDATES = loadScreenerCandidatesFromCsv(usScreenerCandidatesExtraCsv);
export const US_SCREENER_CANDIDATES = uniqueByTicker([...US_CORE_CANDIDATES, ...US_EXTRA_CANDIDATES]);
export const KR_ETF_CANDIDATES = loadScreenerCandidatesFromCsv(krScreenerCandidatesCsv);
export const KR_STOCK_CANDIDATES = loadScreenerCandidatesFromCsv(krStockCandidatesCsv);
export const KR_SCREENER_CANDIDATES = [...KR_ETF_CANDIDATES, ...KR_STOCK_CANDIDATES];

export const SCREENER_CANDIDATE_COUNTS = {
  US: US_SCREENER_CANDIDATES.length,
  US_CORE: US_CORE_CANDIDATES.length,
  US_EXTRA: US_EXTRA_CANDIDATES.length,
  KR: KR_SCREENER_CANDIDATES.length,
  KR_ETF: KR_ETF_CANDIDATES.length,
  KR_STOCK: KR_STOCK_CANDIDATES.length,
};
