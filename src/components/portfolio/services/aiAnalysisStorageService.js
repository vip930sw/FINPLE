import {
  getPortfolioStorageScope,
  getScopedPortfolioStorageKey,
} from "../utils/portfolioStorageScope";

const AI_ANALYSIS_CACHE_BASE_KEY = "finple-ai-analysis-cache-v1";
const AI_ANALYSIS_CACHE_SCHEMA_VERSION = 1;

function normalizeStorageId(value = "") {
  return String(value || "default")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120) || "default";
}

export function getAiAnalysisCacheKey(portfolioId) {
  return `${AI_ANALYSIS_CACHE_BASE_KEY}:${normalizeStorageId(portfolioId)}`;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getScopedAiAnalysisCacheKey(portfolioId) {
  return getScopedPortfolioStorageKey(
    getAiAnalysisCacheKey(portfolioId),
    getPortfolioStorageScope()
  );
}

export function loadAiAnalysisCache(portfolioId) {
  if (!canUseLocalStorage()) return null;

  const cacheKey = getScopedAiAnalysisCacheKey(portfolioId);
  const rawValue = window.localStorage.getItem(cacheKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed?.schemaVersion !== AI_ANALYSIS_CACHE_SCHEMA_VERSION || !parsed.analysis) {
      return null;
    }

    return parsed;
  } catch (error) {
    window.localStorage.removeItem(cacheKey);
    return null;
  }
}

export function saveAiAnalysisCache({ portfolioId, inputSignature, analysis }) {
  if (!analysis) return null;

  const record = {
    schemaVersion: AI_ANALYSIS_CACHE_SCHEMA_VERSION,
    portfolioId: String(portfolioId || "default"),
    inputSignature: String(inputSignature || ""),
    analysis,
    savedAt: new Date().toISOString(),
  };

  if (canUseLocalStorage()) {
    window.localStorage.setItem(
      getScopedAiAnalysisCacheKey(portfolioId),
      JSON.stringify(record)
    );
  }

  return record;
}
