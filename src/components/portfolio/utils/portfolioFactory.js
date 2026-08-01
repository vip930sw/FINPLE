import {
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  DEFAULT_ASSETS,
  DEFAULT_SETTINGS,
  LEGACY_STORAGE_KEY,
  PORTFOLIO_LIST_STORAGE_KEY,
  GLOBAL_SETTINGS_STORAGE_KEY,
} from "../constants";
import { createAssetMarketMetadata, normalizeTickerForMarket } from "../config/marketConfig";
import {
  hydratePersistedManualCashAsset,
  isManualCashAsset,
} from "../../../data/tickers/manualCashAsset";
import { normalizePersistedMetricFields } from "./portfolioAssetPersistence";
import { migrateLegacyPortfolioValuation } from "./portfolioPersistenceContract.js";
import { readScopedPortfolioStorageItem } from "./portfolioStorageScope";

export { migrateLegacyPortfolioValuation } from "./portfolioPersistenceContract.js";

export function createId() {
    return `portfolio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
export function createAssetId(index = 0) {
    return `asset-${Date.now()}-${index}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }
export function normalizeAsset(asset, index = 0) {
    const source = hydratePersistedManualCashAsset(asset);
    const manualCash = isManualCashAsset(source);
    const marketMetadata = manualCash
      ? {
          market: "CASH",
          exchange: source.exchange || "MANUAL",
          currency: source.currency || "KRW",
          rawCurrency: source.rawCurrency || source.quoteCurrency || "KRW",
          quoteCurrency: source.quoteCurrency || source.rawCurrency || "KRW",
          displayCurrency: source.displayCurrency || source.currency || "KRW",
          providerSymbol: source.providerSymbol || "CASH",
          assetType: "CASH",
        }
      : createAssetMarketMetadata(source);
    const ticker = manualCash
      ? "CASH"
      : normalizeTickerForMarket(
          source.ticker || marketMetadata.providerSymbol,
          marketMetadata.market,
        );

    return {
      ...source,
      id: source.id || createAssetId(index),
      ticker,
      displayTicker: source.displayTicker || ticker,
      providerSymbol: marketMetadata.providerSymbol || ticker,
      name: source.name || "",

      market: marketMetadata.market,
      exchange: marketMetadata.exchange,
      currency: marketMetadata.currency,
      quoteCurrency: marketMetadata.quoteCurrency,
      displayCurrency: marketMetadata.displayCurrency,
      assetType: marketMetadata.assetType,

      quantity: Number.isFinite(Number(source.quantity)) ? Number(source.quantity) : 0,
      price: Number.isFinite(Number(source.price)) ? Number(source.price) : 0,
      ...normalizePersistedMetricFields(source),

      priceMode: source.priceMode || "manual",
      metricMode: source.metricMode || "manual",
      dataSource: source.dataSource || "manual",
      cacheMode: source.cacheMode || null,
      rawPrice:
        source.rawPrice === null || source.rawPrice === undefined
          ? null
          : Number(source.rawPrice),
      rawCurrency: marketMetadata.rawCurrency || null,
      exchangeRate:
        source.exchangeRate === null || source.exchangeRate === undefined
          ? null
          : Number(source.exchangeRate),
      lastUpdatedAt: source.lastUpdatedAt || null,
    };
  }

export function cloneAssets(assets) {
    return assets.map((asset, index) => normalizeAsset(asset, index));
  }
export function createPortfolio({
  id = createId(),
  name = "새 포트폴리오",
  description = "",
  settings = DEFAULT_SETTINGS,
  assets = DEFAULT_ASSETS,
  ...customFields
} = {}) {
  const now = new Date().toISOString();
  return {
    ...customFields,
    id,
    name,
    description,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    assets: cloneAssets(assets),
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  };
}
export function duplicatePortfolio(portfolio = {}, { name, assets, settings } = {}) {
  const userFields = { ...portfolio };
  ["id", "createdAt", "updatedAt", "sortOrder", "serverId", "result"].forEach(
    (field) => delete userFields[field],
  );
  return createPortfolio({
    ...userFields,
    name: name || `${portfolio.name || "포트폴리오"} 복사본`,
    assets: assets || portfolio.assets,
    settings: settings || portfolio.settings,
  });
}
export function normalizePortfolio(portfolio, index = 0) {
    return {
      ...portfolio,
      id: portfolio.id || createId(),
      name: portfolio.name || `포트폴리오 ${index + 1}`,
      description: portfolio.description || "",
      settings: normalizeGlobalSettings(portfolio.settings || DEFAULT_SETTINGS),
      assets: cloneAssets(
        Array.isArray(portfolio.assets) ? portfolio.assets : []
      ),
      createdAt: portfolio.createdAt || null,
      updatedAt: portfolio.updatedAt || new Date().toISOString(),
      sortOrder: Number(portfolio.sortOrder ?? index),
      serverId: portfolio.serverId || null,
    };
  }
export function normalizePortfolioList(portfolioList) {
    if (!Array.isArray(portfolioList)) return [];

    return portfolioList.map((portfolio, index) =>
      normalizePortfolio(portfolio, index)
    );
  }
export function normalizeGlobalSettings(settings = {}) {
    return {
      monthlyCashFlow:
        settings.monthlyCashFlow !== undefined
          ? Number(settings.monthlyCashFlow)
          : DEFAULT_SETTINGS.monthlyCashFlow,
      years:
        settings.years !== undefined
          ? Number(settings.years)
          : DEFAULT_SETTINGS.years,
      dividendReinvest:
        settings.dividendReinvest !== undefined
          ? Boolean(settings.dividendReinvest)
          : DEFAULT_SETTINGS.dividendReinvest,
      inflationRate:
        settings.inflationRate !== undefined
          ? Number(settings.inflationRate)
          : DEFAULT_SETTINGS.inflationRate,
      startValue:
        settings.startValue !== undefined
          ? Number(settings.startValue)
          : DEFAULT_SETTINGS.startValue,
    };
  }
export function loadGlobalSettings() {
    try {
      const savedGlobalSettings = readScopedPortfolioStorageItem(GLOBAL_SETTINGS_STORAGE_KEY);

      if (savedGlobalSettings) {
        return normalizeGlobalSettings(JSON.parse(savedGlobalSettings));
      }

      const legacySavedData = readScopedPortfolioStorageItem(LEGACY_STORAGE_KEY);

      if (legacySavedData) {
        const parsedLegacyData = JSON.parse(legacySavedData);
        return normalizeGlobalSettings(parsedLegacyData.settings || {});
      }
    } catch (error) {
      console.error("공통 설정을 불러오지 못했습니다.", error);
    }

    return DEFAULT_SETTINGS;
  }
export function createDefaultPortfolioList() {
    return [
      createPortfolio({
        name: "포트폴리오 1",
        assets: DEFAULT_ASSETS,
      }),
    ];
  }
export function ensureMinimumPortfolios(portfolioList) {
    const normalizedPortfolioList = normalizePortfolioList(portfolioList);

    if (normalizedPortfolioList.length >= 1) {
      return normalizedPortfolioList;
    }

    return createDefaultPortfolioList();
  }
export function loadPortfolioState(snapshot = null) {
  try {
    const hasSnapshot = snapshot && typeof snapshot === "object";
    const savedList = hasSnapshot
      ? JSON.stringify(snapshot.portfolioList ?? snapshot.portfolios ?? [])
      : readScopedPortfolioStorageItem(PORTFOLIO_LIST_STORAGE_KEY);
    const savedActiveId = hasSnapshot
      ? snapshot.activePortfolioId || null
      : readScopedPortfolioStorageItem(ACTIVE_PORTFOLIO_STORAGE_KEY);

    if (savedList) {
      const parsedList = JSON.parse(savedList);

      if (Array.isArray(parsedList)) {
        const globalSettings = hasSnapshot
          ? normalizeGlobalSettings(snapshot.globalSettings || {})
          : loadGlobalSettings();
        const normalizedList = normalizePortfolioList(
          parsedList.map((portfolio) => migrateLegacyPortfolioValuation(portfolio, globalSettings)),
        );
        if (normalizedList.length === 0) {
          return {
            portfolioList: [],
            activePortfolioId: null,
            activePortfolio: null,
            globalSettings,
          };
        }

        const activePortfolio =
          normalizedList.find((portfolio) => portfolio.id === savedActiveId) ||
          normalizedList[0];

          return {
            portfolioList: normalizedList,
            activePortfolioId: activePortfolio.id,
            activePortfolio,
            globalSettings,
          };
      }
    }

    const legacySavedData = hasSnapshot
      ? null
      : readScopedPortfolioStorageItem(LEGACY_STORAGE_KEY);

    if (legacySavedData) {
      const parsedLegacyData = JSON.parse(legacySavedData);
      const legacySettings = normalizeGlobalSettings(parsedLegacyData.settings || {});
      const legacyPortfolio = migrateLegacyPortfolioValuation({
        settings: legacySettings,
        assets: parsedLegacyData.assets || DEFAULT_ASSETS,
      }, legacySettings);

      const migratedPortfolio = createPortfolio({
        name: "포트폴리오 1",
        settings: legacySettings,
        assets: legacyPortfolio.assets,
      });

      const normalizedPortfolioList = ensureMinimumPortfolios([migratedPortfolio]);

        return {
        portfolioList: normalizedPortfolioList,
        activePortfolioId: migratedPortfolio.id,
        activePortfolio: migratedPortfolio,
        globalSettings: legacySettings,
        };
    }
  } catch (error) {
    console.error("포트폴리오 데이터를 불러오지 못했습니다.", error);
  }

  const defaultPortfolioList = createDefaultPortfolioList();
const defaultPortfolio = defaultPortfolioList[0];

return {
    portfolioList: defaultPortfolioList,
    activePortfolioId: defaultPortfolio.id,
    activePortfolio: defaultPortfolio,
    globalSettings: DEFAULT_SETTINGS,
  };
}
