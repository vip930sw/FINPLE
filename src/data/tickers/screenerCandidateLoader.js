import finpleAppCandidates6000Csv from "./finple_app_candidates_6000_balanced_v1.csv?raw";

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

function uniqueByMarketTicker(candidates = []) {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const market = normalizeMarket(candidate?.market);
    const ticker = normalizeCandidateTicker(candidate?.ticker || "");
    const key = `${market}:${ticker}`;
    if (!ticker || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const SCREENER_METRICS_POLICY_NOTE =
  "FINPLE 6,000 balanced candidate CSV v1: expanded universe. Metrics may remain pending until separately verified.";

export function normalizeScreenerCandidate(row = {}) {
  const market = normalizeMarket(row.market || "US");
  const assetType = normalizeAssetType(row.assetType);
  const marketCap = toNullableNumber(row.marketCap);
  const aum = toNullableNumber(row.aum);
  const sizeMetric = assetType === "ETF" ? aum ?? marketCap : marketCap ?? aum;

  return {
    ticker: stripBom(row.ticker || "").trim(),
    providerSymbol: row.providerSymbol || row.ticker || "",
    koreanName: row.nameKr || row.koreanName || row.name || "",
    nameKr: row.nameKr || row.koreanName || row.name || "",
    market,
    currency: row.currency || "KRW",
    quoteCurrency: row.quoteCurrency || (market === "KR" ? "KRW" : "USD"),
    type: assetType,
    assetType,
    sourceUniverse: row.sourceUniverse || "",
    tier: row.tier || "",
    strategy: row.strategy || "core",
    riskLevel: row.riskLevel || "medium",
    expectedCagr: toNullableNumber(row.expectedCagr),
    beta: toNullableNumber(row.beta),
    mdd: toNullableNumber(row.mdd),
    dividendYield: toNullableNumber(row.dividendYield),
    displayDividendYield: row.displayDividendYield || "",
    dividendPolicy: row.dividendPolicy || "",
    dividendSource: row.dividendSource || "",
    marketCap,
    aum,
    sizeMetric,
    sizeSource: row.sizeSource || "",
    dataStatus: row.dataStatus || "",
    reviewTag: row.reviewTag || "",
    reviewReason: row.reviewReason || "",
    metricsSource: row.metricsSource || "",
    goals: splitPipe(row.goals),
    beginnerFit: toBoolean(row.beginnerFit),
    tags: splitPipe(row.tags),
    notes: row.notes || "",
    metricMode: "candidate_6000_balanced_v1",
    dataSource: "finple_app_candidates_6000_balanced_v1",
  };
}

export function loadScreenerCandidatesFromCsv(csvText = "") {
  return uniqueByMarketTicker(
    parseCsv(csvText)
      .map(normalizeScreenerCandidate)
      .filter((candidate) => candidate.ticker && candidate.koreanName)
  );
}

export const ALL_SCREENER_CANDIDATES = loadScreenerCandidatesFromCsv(finpleAppCandidates6000Csv);

export const US_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.market === "US"
);

export const KR_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.market === "KR"
);

export const US_CORE_CANDIDATES = US_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.tier === "core"
);

export const US_EXTRA_CANDIDATES = US_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.tier !== "core"
);

export const US_EXPANSION_CANDIDATES = US_EXTRA_CANDIDATES;

export const KR_ETF_CANDIDATES = KR_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.type === "ETF"
);

export const KR_STOCK_CANDIDATES = KR_SCREENER_CANDIDATES.filter(
  (candidate) => candidate.type === "stock"
);

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
    providerSymbol: candidate.providerSymbol || candidate.ticker,
    name: candidate.koreanName || candidate.nameKr || candidate.ticker,
    market: candidate.market,
    currency: candidate.currency || "KRW",
    quoteCurrency: candidate.quoteCurrency || (candidate.market === "KR" ? "KRW" : "USD"),
    assetType: candidate.assetType || candidate.type || "ETF",
    cagr: candidate.expectedCagr,
    beta: candidate.beta,
    mdd: candidate.mdd,
    dividendYield: candidate.dividendYield,
    displayDividendYield: candidate.displayDividendYield,
    dividendPolicy: candidate.dividendPolicy,
    dividendSource: candidate.dividendSource,
    marketCap: candidate.marketCap,
    aum: candidate.aum,
    sizeMetric: candidate.sizeMetric,
    sizeSource: candidate.sizeSource,
    reviewTag: candidate.reviewTag,
    reviewReason: candidate.reviewReason,
    metricMode: candidate.metricMode || "candidate_6000_balanced_v1",
    dataSource: candidate.dataSource || "finple_app_candidates_6000_balanced_v1",
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
    displayDividendYield: patch.displayDividendYield || asset.displayDividendYield || "",
    dividendPolicy: patch.dividendPolicy || asset.dividendPolicy || "",
    dividendSource: patch.dividendSource || asset.dividendSource || "",
    marketCap: patch.marketCap ?? asset.marketCap ?? null,
    aum: patch.aum ?? asset.aum ?? null,
    sizeMetric: patch.sizeMetric ?? asset.sizeMetric ?? null,
    sizeSource: patch.sizeSource || asset.sizeSource || "",
    reviewTag: patch.reviewTag || asset.reviewTag || "",
    reviewReason: patch.reviewReason || asset.reviewReason || "",
  };
}
