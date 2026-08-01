import {
  createPortfolioPersistenceEnvelope,
  decodePortfolioPersistenceEnvelope,
  encodePortfolioPersistenceEnvelope,
  normalizePortfolioPersistenceAsset,
  normalizePortfolioPersistenceGlobalSettings,
  normalizePortfolioPersistencePortfolio,
  normalizePortfolioPersistenceSnapshot,
  PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
} from "../../../src/components/portfolio/utils/portfolioPersistenceContract.js";

function numberOr(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function createPortfolioPersistenceStorageModel(input = {}) {
  const conditions = input.commonConditions || input.conditions || {};
  const globalSettings = normalizePortfolioPersistenceGlobalSettings(
    input.globalSettings || {
      startValue: conditions.startValue,
      monthlyCashFlow: conditions.monthlyInvestment,
      years: conditions.investmentYears,
      inflationRate: conditions.inflationRate,
      dividendReinvest: conditions.dividendReinvest,
    },
  );
  const persistencePortfolio = normalizePortfolioPersistencePortfolio(
    input.persistencePortfolio || input,
    Number(input.sortOrder || 0),
  );

  return {
    persistencePortfolio,
    globalSettings,
    activePortfolioId: input.activePortfolioId || persistencePortfolio.id,
    encodedDescription: encodePortfolioPersistenceEnvelope({
      portfolio: persistencePortfolio,
      activePortfolioId: input.activePortfolioId || persistencePortfolio.id,
      globalSettings,
    }),
  };
}

export function hydratePortfolioPersistenceRow(row = {}, relationalAssets = []) {
  const envelope = decodePortfolioPersistenceEnvelope(row.description);
  if (envelope?.portfolio) {
    return {
      ...envelope.portfolio,
      serverId: row.id || null,
      persistenceSchemaVersion: envelope.schemaVersion,
      createdAt: envelope.portfolio.createdAt || row.created_at || null,
      updatedAt: envelope.portfolio.updatedAt || row.updated_at || null,
      __persistenceEnvelope: envelope,
    };
  }

  return {
    id: row.id,
    serverId: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || "",
    monthlyInvestment: numberOr(row.monthly_investment, 0),
    investmentYears: numberOr(row.investment_years, 0),
    inflationRate: numberOr(row.inflation_rate, 0),
    dividendReinvest: Boolean(row.dividend_reinvest),
    sortOrder: numberOr(row.sort_order, 0),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    assets: relationalAssets.map((asset, index) =>
      normalizePortfolioPersistenceAsset(
        {
          ...asset,
          cagr: nullableNumber(asset.cagr),
          beta: nullableNumber(asset.beta),
          mdd: nullableNumber(asset.mdd),
          dividendYield: nullableNumber(asset.dividendYield ?? asset.dividend_yield),
        },
        index,
      ),
    ),
    persistenceSchemaVersion: 1,
    __persistenceEnvelope: envelope,
  };
}

export function createPortfolioApiSnapshot(portfolios = [], fallbackEnvelope = null) {
  const persistenceEnvelope =
    portfolios.find((portfolio) => portfolio?.__persistenceEnvelope)
      ?.__persistenceEnvelope || fallbackEnvelope;
  const publicPortfolios = portfolios.map((portfolio) => {
    const publicPortfolio = { ...portfolio };
    delete publicPortfolio.__persistenceEnvelope;
    return publicPortfolio;
  });
  const legacyPortfolio = publicPortfolios[0] || {};
  const activePortfolioId =
    persistenceEnvelope?.activePortfolioId &&
    publicPortfolios.some(
      (portfolio) => portfolio.id === persistenceEnvelope.activePortfolioId,
    )
      ? persistenceEnvelope.activePortfolioId
      : publicPortfolios[0]?.id || null;

  return normalizePortfolioPersistenceSnapshot({
    schemaVersion:
      persistenceEnvelope?.schemaVersion || PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
    portfolios: publicPortfolios,
    activePortfolioId,
    globalSettings: normalizePortfolioPersistenceGlobalSettings(
      persistenceEnvelope?.globalSettings || {
        startValue: legacyPortfolio.startValue,
        monthlyCashFlow:
          legacyPortfolio.monthlyCashFlow ?? legacyPortfolio.monthlyInvestment,
        years: legacyPortfolio.years ?? legacyPortfolio.investmentYears,
        inflationRate: legacyPortfolio.inflationRate,
        dividendReinvest: legacyPortfolio.dividendReinvest,
      },
    ),
  });
}

export function encodeEmptyPortfolioPersistenceSnapshot(input = {}) {
  return encodePortfolioPersistenceEnvelope(
    createPortfolioPersistenceEnvelope({
      portfolio: null,
      activePortfolioId: null,
      globalSettings: input.globalSettings,
    }),
  );
}
