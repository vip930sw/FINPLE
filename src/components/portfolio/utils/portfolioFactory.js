import {
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  DEFAULT_ASSETS,
  DEFAULT_SETTINGS,
  DIVIDEND_ASSETS,
  EMPTY_ASSETS,
  GLOBAL_SETTINGS_STORAGE_KEY,
  GROWTH_ASSETS,
  LEGACY_STORAGE_KEY,
  PORTFOLIO_LIST_STORAGE_KEY,
  STABLE_ASSETS,
} from "../constants";

export function createId() {
    return `portfolio-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
export function createAssetId(index = 0) {
    return `asset-${Date.now()}-${index}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }
export function normalizeAsset(asset, index = 0) {
    return {
      id: asset.id || createAssetId(index),
      ticker: asset.ticker || "",
      name: asset.name || "",

      market: asset.market || "US",
      currency: asset.currency || "KRW",

      quantity: Number(asset.quantity || 0),
      price: Number(asset.price || 0),
      cagr: Number(asset.cagr || 0),
      beta: Number(asset.beta || 0),
      mdd: Number(asset.mdd || 0),
      dividendYield: Number(asset.dividendYield || 0),

      priceMode: asset.priceMode || "manual",
      metricMode: asset.metricMode || "manual",
      dataSource: asset.dataSource || "manual",
      cacheMode: asset.cacheMode || null,
      rawPrice:
        asset.rawPrice === null || asset.rawPrice === undefined
          ? null
          : Number(asset.rawPrice),
      rawCurrency: asset.rawCurrency || null,
      exchangeRate:
        asset.exchangeRate === null || asset.exchangeRate === undefined
          ? null
          : Number(asset.exchangeRate),
      lastUpdatedAt: asset.lastUpdatedAt || null,
    };
  }
export function cloneAssets(assets) {
    return assets.map((asset, index) => normalizeAsset(asset, index));
  }
export function createPortfolio({
  id = createId(),
  name = "새 포트폴리오",
  settings = DEFAULT_SETTINGS,
  assets = DEFAULT_ASSETS,
} = {}) {
  return {
    id,
    name,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    assets: cloneAssets(assets),
    updatedAt: new Date().toISOString(),
  };
}
export function normalizePortfolio(portfolio, index = 0) {
    return {
      id: portfolio.id || createId(),
      name: portfolio.name || `포트폴리오 ${index + 1}`,
      settings: normalizeGlobalSettings(portfolio.settings || DEFAULT_SETTINGS),
      assets: cloneAssets(
        Array.isArray(portfolio.assets) ? portfolio.assets : DEFAULT_ASSETS
      ),
      updatedAt: portfolio.updatedAt || new Date().toISOString(),
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
    };
  }
export function loadGlobalSettings() {
    try {
      const savedGlobalSettings = localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);

      if (savedGlobalSettings) {
        return normalizeGlobalSettings(JSON.parse(savedGlobalSettings));
      }

      const legacySavedData = localStorage.getItem(LEGACY_STORAGE_KEY);

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
      createPortfolio({
        name: "포트폴리오 2",
        assets: DIVIDEND_ASSETS,
      }),
      createPortfolio({
        name: "포트폴리오 3",
        assets: STABLE_ASSETS,
      }),
    ];
  }
export function ensureMinimumPortfolios(portfolioList) {
    const normalizedPortfolioList = normalizePortfolioList(portfolioList);

    if (normalizedPortfolioList.length >= 3) {
      return normalizedPortfolioList;
    }

    const defaultPortfolioList = createDefaultPortfolioList();

    return [
      ...normalizedPortfolioList,
      ...defaultPortfolioList.slice(normalizedPortfolioList.length),
    ];
  }
export function loadPortfolioState() {
  try {
    const savedList = localStorage.getItem(PORTFOLIO_LIST_STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_PORTFOLIO_STORAGE_KEY);

    if (savedList) {
      const parsedList = JSON.parse(savedList);

      if (Array.isArray(parsedList) && parsedList.length > 0) {
        const normalizedList = ensureMinimumPortfolios(parsedList);

        const activePortfolio =
          normalizedList.find((portfolio) => portfolio.id === savedActiveId) ||
          normalizedList[0];

          return {
            portfolioList: normalizedList,
            activePortfolioId: activePortfolio.id,
            activePortfolio,
            globalSettings: loadGlobalSettings(),
          };
      }
    }

    const legacySavedData = localStorage.getItem(LEGACY_STORAGE_KEY);

    if (legacySavedData) {
      const parsedLegacyData = JSON.parse(legacySavedData);

      const migratedPortfolio = createPortfolio({
        name: "포트폴리오 1",
        settings: parsedLegacyData.settings || DEFAULT_SETTINGS,
        assets: parsedLegacyData.assets || DEFAULT_ASSETS,
      });

      const normalizedPortfolioList = ensureMinimumPortfolios([migratedPortfolio]);

        return {
        portfolioList: normalizedPortfolioList,
        activePortfolioId: migratedPortfolio.id,
        activePortfolio: migratedPortfolio,
        globalSettings: normalizeGlobalSettings(parsedLegacyData.settings || {}),
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
