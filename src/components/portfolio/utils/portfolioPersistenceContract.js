import { normalizePersistedMetricFields } from "./portfolioAssetPersistence.js";

export const PORTFOLIO_PERSISTENCE_SCHEMA_VERSION = 3;
export const PORTFOLIO_PERSISTENCE_ENVELOPE_PREFIX = "FINPLE_PORTFOLIO_V3:";
export const PORTFOLIO_PERSISTENCE_ALIAS_CONFLICT_REASON =
  "portfolio_persistence_alias_conflict";

const DEFAULT_GLOBAL_SETTINGS = Object.freeze({
  startValue: 0,
  monthlyCashFlow: 1000000,
  years: 10,
  inflationRate: 2.5,
  dividendReinvest: true,
});

function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

export function migrateLegacyPortfolioValuation(portfolio = {}, globalSettings = {}) {
  const assets = Array.isArray(portfolio.assets) ? portfolio.assets : [];
  const legacyAssets = assets.filter((asset) => String(asset?.ticker || "").trim());
  if (
    legacyAssets.length === 0 ||
    legacyAssets.some((asset) => hasValue(asset.targetWeight) || hasValue(asset.targetEvaluationAmount))
  ) return portfolio;

  const legacyValues = legacyAssets.map((asset) => Number(asset.quantity) * Number(asset.price));
  if (legacyValues.some((value) => !Number.isFinite(value) || value <= 0)) return portfolio;

  const totalValue = legacyValues.reduce((sum, value) => sum + value, 0);
  const portfolioStartValue = Number(portfolio.settings?.startValue ?? portfolio.startValue);
  const globalStartValue = Number(globalSettings.startValue);
  const startValue = portfolioStartValue > 0 ? portfolioStartValue : globalStartValue > 0 ? globalStartValue : 0;
  const migratedByAsset = new Map();
  let assignedWeight = 0;
  legacyAssets.forEach((asset, index) => {
    const targetWeight = index === legacyAssets.length - 1
      ? Number((100 - assignedWeight).toFixed(6))
      : Number((legacyValues[index] / totalValue * 100).toFixed(6));
    assignedWeight += targetWeight;
    migratedByAsset.set(asset, {
      ...asset,
      targetWeight,
      ...(startValue > 0
        ? { targetEvaluationAmount: Number((startValue * targetWeight / 100).toFixed(0)) }
        : {}),
    });
  });

  return {
    ...portfolio,
    assets: assets.map((asset) => migratedByAsset.get(asset) || asset),
  };
}

export function normalizePortfolioPersistenceGlobalSettings(settings = {}) {
  const source = safeObject(settings);
  return {
    startValue: finiteNumber(source.startValue, DEFAULT_GLOBAL_SETTINGS.startValue),
    monthlyCashFlow: finiteNumber(
      source.monthlyCashFlow,
      DEFAULT_GLOBAL_SETTINGS.monthlyCashFlow,
    ),
    years: finiteNumber(source.years, DEFAULT_GLOBAL_SETTINGS.years),
    inflationRate: finiteNumber(
      source.inflationRate,
      DEFAULT_GLOBAL_SETTINGS.inflationRate,
    ),
    dividendReinvest:
      source.dividendReinvest === undefined
        ? DEFAULT_GLOBAL_SETTINGS.dividendReinvest
        : source.dividendReinvest === true,
  };
}

export function normalizePortfolioPersistenceAsset(asset = {}, index = 0) {
  const source = safeObject(asset);
  const normalizedMetricFields = normalizePersistedMetricFields(source);

  return {
    ...source,
    id: source.id || `persisted-asset-${index}`,
    market: source.market || "",
    ticker: String(source.ticker || ""),
    name: source.name || "",
    quantity: finiteNumber(source.quantity, 0),
    price: finiteNumber(source.price, 0),
    currency: source.currency || "",
    targetEvaluationAmount: nullableNumber(source.targetEvaluationAmount),
    targetWeight: nullableNumber(source.targetWeight),
    ...normalizedMetricFields,
    sortOrder: finiteNumber(source.sortOrder, index),
  };
}

export function normalizePortfolioPersistencePortfolio(portfolio = {}, index = 0) {
  const source = safeObject(portfolio);
  return {
    ...source,
    id: source.id || `persisted-portfolio-${index}`,
    name: source.name || source.title || `포트폴리오 ${index + 1}`,
    description: source.description || "",
    assets: Array.isArray(source.assets)
      ? source.assets.map(normalizePortfolioPersistenceAsset)
      : [],
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
    sortOrder: finiteNumber(source.sortOrder, index),
  };
}

function stableJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = stableJsonValue(value[key]);
      return result;
    }, {});
}

function normalizedPortfolioListsMatch(left, right) {
  const normalizedLeft = left.map(normalizePortfolioPersistencePortfolio);
  const normalizedRight = right.map(normalizePortfolioPersistencePortfolio);
  return (
    JSON.stringify(stableJsonValue(normalizedLeft)) ===
    JSON.stringify(stableJsonValue(normalizedRight))
  );
}

export function detectPortfolioPersistenceAliasConflict(snapshot = {}) {
  const source = safeObject(snapshot);
  if (
    !Array.isArray(source.portfolios) ||
    !Array.isArray(source.portfolioList) ||
    normalizedPortfolioListsMatch(source.portfolios, source.portfolioList)
  ) {
    return null;
  }

  return {
    reason: PORTFOLIO_PERSISTENCE_ALIAS_CONFLICT_REASON,
    canonicalPortfolioCount: source.portfolios.length,
    legacyPortfolioCount: source.portfolioList.length,
  };
}

export function createCanonicalPortfolioPersistenceSyncSnapshot(
  snapshot = {},
  { portfolios = [], activePortfolioId = null } = {},
) {
  const source = safeObject(snapshot);
  const envelope = { ...source };
  delete envelope.portfolios;
  delete envelope.portfolioList;
  delete envelope.activePortfolioId;

  return {
    ...envelope,
    portfolios: Array.isArray(portfolios) ? portfolios : [],
    activePortfolioId: activePortfolioId || null,
  };
}

export function normalizePortfolioPersistenceSnapshot(snapshot = {}) {
  const source = safeObject(snapshot);
  const aliasConflict = detectPortfolioPersistenceAliasConflict(source);
  if (aliasConflict) {
    const error = new Error(aliasConflict.reason);
    error.code = aliasConflict.reason;
    error.aliasConflict = aliasConflict;
    throw error;
  }
  const sourcePortfolios = Array.isArray(source.portfolios)
    ? source.portfolios
    : Array.isArray(source.portfolioList)
      ? source.portfolioList
      : [];
  const globalSettings = normalizePortfolioPersistenceGlobalSettings(source.globalSettings);
  const portfolios = sourcePortfolios
    .map((portfolio) => migrateLegacyPortfolioValuation(portfolio, globalSettings))
    .map(normalizePortfolioPersistencePortfolio);
  const requestedActiveId = source.activePortfolioId || null;
  const activePortfolioId = portfolios.some(
    (portfolio) => portfolio.id === requestedActiveId,
  )
    ? requestedActiveId
    : portfolios[0]?.id || null;

  return {
    schemaVersion: PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
    portfolios,
    activePortfolioId,
    globalSettings,
  };
}

export function createPortfolioPersistenceEnvelope({
  portfolio = null,
  activePortfolioId = null,
  globalSettings = {},
} = {}) {
  return {
    schemaVersion: PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
    activePortfolioId: activePortfolioId || null,
    globalSettings: normalizePortfolioPersistenceGlobalSettings(globalSettings),
    portfolio: portfolio ? normalizePortfolioPersistencePortfolio(portfolio) : null,
  };
}

export function encodePortfolioPersistenceEnvelope(input = {}) {
  return `${PORTFOLIO_PERSISTENCE_ENVELOPE_PREFIX}${JSON.stringify(
    createPortfolioPersistenceEnvelope(input),
  )}`;
}

export function decodePortfolioPersistenceEnvelope(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith(PORTFOLIO_PERSISTENCE_ENVELOPE_PREFIX)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(value.slice(PORTFOLIO_PERSISTENCE_ENVELOPE_PREFIX.length));
    if (parsed?.schemaVersion !== PORTFOLIO_PERSISTENCE_SCHEMA_VERSION) return null;
    return createPortfolioPersistenceEnvelope(parsed);
  } catch {
    return null;
  }
}
