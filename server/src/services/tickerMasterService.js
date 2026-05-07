import { TICKER_MASTER } from "../data/tickerMaster.js";

export function normalizeTicker(ticker) {
  return String(ticker || "").trim().toUpperCase();
}

export function getTickerMaster() {
  return TICKER_MASTER;
}

export function getTickerMasterItem(ticker) {
  const normalizedTicker = normalizeTicker(ticker);

  return TICKER_MASTER.find((item) => normalizeTicker(item.ticker) === normalizedTicker) || null;
}

export function getTickerFilterOptions() {
  return {
    counts: {
      total: TICKER_MASTER.length,
      stocks: TICKER_MASTER.filter((item) => item.type === "stock").length,
      etfs: TICKER_MASTER.filter((item) => item.type === "ETF").length,
    },
    markets: uniqueValues("market"),
    types: uniqueValues("type"),
    categories: uniqueValues("category"),
    strategies: uniqueValues("strategy"),
    riskLevels: uniqueValues("riskLevel"),
  };
}

export function searchTickerMaster({
  query = "",
  market = "all",
  type = "all",
  category = "all",
  riskLevel = "all",
  beginnerFit = "all",
  limit = 20,
} = {}) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const filtered = TICKER_MASTER.filter((item) => {
    if (market !== "all" && item.market !== market) return false;
    if (type !== "all" && item.type !== type) return false;
    if (category !== "all" && item.category !== category) return false;
    if (riskLevel !== "all" && item.riskLevel !== riskLevel) return false;
    if (beginnerFit !== "all" && item.beginnerFit !== beginnerFit) return false;

    if (queryTokens.length === 0) return true;

    const haystack = normalizeSearchText([
      item.ticker,
      item.name,
      item.koreanName,
      item.market,
      item.type,
      item.category,
      item.strategy,
      item.riskLevel,
      item.beginnerFit,
      item.sector,
      item.industry,
      item.assetClass,
      item.fundCategory,
      item.index,
      item.description,
      ...(item.tags || []),
    ].join(" "));

    return queryTokens.every((token) => haystack.includes(token));
  });

  return filtered
    .sort((a, b) => scoreTicker(b, normalizedQuery) - scoreTicker(a, normalizedQuery))
    .slice(0, Number(limit || 20));
}

export function screenTickerMaster({
  goal = "all",
  riskLevel = "all",
  type = "all",
  market = "all",
  minDividendYield,
  maxBeta,
  minCagr,
  maxMdd,
  beginnerOnly = false,
  limit = 30,
} = {}) {
  let filtered = TICKER_MASTER.filter((item) => {
    if (market !== "all" && item.market !== market) return false;
    if (type !== "all" && item.type !== type) return false;
    if (riskLevel !== "all" && item.riskLevel !== riskLevel) return false;
    if (beginnerOnly && item.beginnerFit !== "high") return false;

    if (goal !== "all") {
      const goalMap = {
        core: ["core", "mega-cap", "quality"],
        growth: ["growth", "mega-cap", "ai-semiconductor", "sector"],
        dividend: ["dividend", "income"],
        defensive: ["bond", "commodity", "quality"],
        aggressive: ["leveraged", "inverse", "crypto", "ai-semiconductor"],
      };
      const allowedCategories = goalMap[goal] || [];
      if (!allowedCategories.includes(item.category)) return false;
    }

    if (isFiniteFilter(minDividendYield) && Number(item.dividendYield || 0) < Number(minDividendYield)) return false;
    if (isFiniteFilter(maxBeta) && Number(item.beta || 0) > Number(maxBeta)) return false;
    if (isFiniteFilter(minCagr) && Number(item.expectedCagr || 0) < Number(minCagr)) return false;
    if (isFiniteFilter(maxMdd) && Number(item.mdd || 0) < Number(maxMdd)) return false;

    return true;
  });

  filtered = filtered.sort((a, b) => {
    if (goal === "dividend") return Number(b.dividendYield || 0) - Number(a.dividendYield || 0);
    if (goal === "growth" || goal === "aggressive") return Number(b.expectedCagr || 0) - Number(a.expectedCagr || 0);
    if (goal === "defensive") return Number(b.mdd || 0) - Number(a.mdd || 0);
    return scoreDefaultScreener(b) - scoreDefaultScreener(a);
  });

  return filtered.slice(0, Number(limit || 30));
}

function scoreDefaultScreener(item) {
  const beginnerScore = item.beginnerFit === "high" ? 100 : item.beginnerFit === "medium" ? 50 : 0;
  const typeScore = item.type === "ETF" ? 20 : 0;
  const categoryScore = item.category === "core" ? 30 : item.category === "bond" ? 18 : item.category === "dividend" ? 16 : 0;
  return beginnerScore + typeScore + categoryScore;
}

function uniqueValues(field) {
  return Array.from(new Set(TICKER_MASTER.map((item) => item[field]).filter(Boolean))).sort();
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreTicker(item, normalizedQuery) {
  if (!normalizedQuery) return scoreDefaultScreener(item);

  const ticker = normalizeSearchText(item.ticker);
  const koreanName = normalizeSearchText(item.koreanName);
  const name = normalizeSearchText(item.name);
  const tags = normalizeSearchText((item.tags || []).join(" "));

  if (ticker === normalizedQuery) return 1000;
  if (ticker.startsWith(normalizedQuery)) return 800;
  if (koreanName.includes(normalizedQuery)) return 600;
  if (name.includes(normalizedQuery)) return 500;
  if (tags.includes(normalizedQuery)) return 350;

  return scoreDefaultScreener(item);
}

function isFiniteFilter(value) {
  if (value === null || value === undefined || value === "") return false;
  return Number.isFinite(Number(value));
}
