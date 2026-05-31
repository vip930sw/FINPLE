import { hydrateAssetFromScreenerCandidate } from "../../data/tickers/screenerCandidateLoader";

export const PORTFOLIO_LIST_STORAGE_KEY = "finple-portfolio-list";
export const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
export const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
export const LEGACY_STORAGE_KEY = "finple-portfolio-simulator";
export const DEFAULT_SETTINGS = {
    monthlyCashFlow: 1000000,
    years: 10,
    dividendReinvest: true,
    inflationRate: 2.5,
    startValue: 0,
  };

function hydratePresetAssets(assets = []) {
  return assets.map((asset) => hydrateAssetFromScreenerCandidate(asset));
}

const PRESET_ASSET_CATALOG = {
  QQQ: { ticker: "QQQ", name: "나스닥100 ETF", price: 430000, market: "US" },
  SCHD: { ticker: "SCHD", name: "배당성장 ETF", price: 110000, market: "US" },
  BND: { ticker: "BND", name: "미국 종합채권 ETF", price: 110000, market: "US" },
  TLT: { ticker: "TLT", name: "미국 장기채", price: 125000, market: "US" },
  VNQ: { ticker: "VNQ", name: "미국 리츠 ETF", price: 120000, market: "US" },
  GLD: { ticker: "GLD", name: "금 ETF", price: 300000, market: "US" },
  BLOK: { ticker: "BLOK", name: "블록체인 테마 ETF", price: 45000, market: "US", cagr: 9, beta: 1.4, mdd: -65, dividendYield: 1.0 },
  CASH: { ticker: "CASH", name: "현금 / 대기자금", price: 10000, market: "CASH", cagr: 2.5, beta: 0, mdd: 0, dividendYield: 2.0 },
};

function createWeightedPresetAssets(weights = {}, initialAmount = 50000000) {
  return hydratePresetAssets(Object.entries(weights).map(([ticker, weight], index) => {
    const template = PRESET_ASSET_CATALOG[ticker] || PRESET_ASSET_CATALOG.CASH;
    const price = Number(template.price || 1);
    const targetEvaluationAmount = Math.round(Number(initialAmount) * Number(weight || 0) / 100);
    return {
      ...template,
      id: `preset-${String(ticker).toLowerCase()}-${index}`,
      quantity: price > 0 ? Number((targetEvaluationAmount / price).toFixed(6)) : 0,
      price,
      targetEvaluationAmount,
      priceMode: template.ticker === "CASH" ? "manual" : "final_csv_v1_price_close",
      metricMode: template.ticker === "CASH" ? "manual" : "manual",
      dataSource: template.ticker === "CASH" ? "preset-cash" : "preset-weighted",
      lookupDisabled: template.ticker === "CASH",
      shouldAutoLookup: template.ticker !== "CASH",
    };
  }));
}

export const DEFAULT_ASSETS = createWeightedPresetAssets({ QQQ: 43, SCHD: 22, TLT: 20, GLD: 15 });
export const DIVIDEND_ASSETS = createWeightedPresetAssets({ SCHD: 50, QQQ: 20, TLT: 18, GLD: 12 });
export const STABLE_ASSETS = createWeightedPresetAssets({ TLT: 45, GLD: 27, SCHD: 20, QQQ: 8 });
export const GROWTH_ASSETS = createWeightedPresetAssets({ QQQ: 70, SCHD: 15, GLD: 15 });

export const GOLD_DEFENSE_ASSETS = createWeightedPresetAssets({ GLD: 35, TLT: 30, SCHD: 20, CASH: 15 });
export const REIT_INCOME_ASSETS = createWeightedPresetAssets({ VNQ: 35, SCHD: 30, BND: 15, GLD: 10, CASH: 10 });
export const GROWTH_ZERO_ASSETS = createWeightedPresetAssets({ SCHD: 40, BND: 35, GLD: 15, CASH: 10 });
export const GROWTH_FOCUS_ASSETS = createWeightedPresetAssets({ QQQ: 90, CASH: 10 });
export const ALL_WEATHER_ASSETS = createWeightedPresetAssets({ QQQ: 25, SCHD: 25, BND: 25, GLD: 15, CASH: 10 });
export const HIGH_CONVICTION_ASSETS = createWeightedPresetAssets({ QQQ: 75, BLOK: 15, CASH: 10 });

export const EMPTY_ASSETS = [
    {
      ticker: "",
      name: "",
      quantity: 0,
      price: 0,
      cagr: 0,
      beta: 0,
      mdd: 0,
      dividendYield: null,
    },
  ];

// 개발/백엔드 장애 시의 조회용 fallback입니다.
// 기본·MBTI·스크리너 프리셋은 final candidate CSV를 우선 사용합니다.
export const MOCK_ASSET_DATA = {
    QQQ: {
      name: "나스닥100 ETF",
      market: "US",
      currency: "KRW",
      price: 430000,
    },
    SCHD: {
      name: "배당성장 ETF",
      market: "US",
      currency: "KRW",
      price: 110000,
    },
    BND: {
      name: "미국 종합채권 ETF",
      market: "US",
      currency: "KRW",
      price: 110000,
    },
    TLT: {
      name: "미국 장기채",
      market: "US",
      currency: "KRW",
      price: 125000,
    },
    VNQ: {
      name: "미국 리츠 ETF",
      market: "US",
      currency: "KRW",
      price: 120000,
    },
    GLD: {
      name: "금 ETF",
      market: "US",
      currency: "KRW",
      price: 300000,
    },
    BLOK: {
      name: "블록체인 테마 ETF",
      market: "US",
      currency: "KRW",
      price: 45000,
      cagr: 9,
      beta: 1.4,
      mdd: -65,
      dividendYield: 1,
    },
    BTC: {
      name: "비트코인",
      market: "CRYPTO",
      currency: "KRW",
      price: 1000000,
      cagr: 12,
      beta: 2.2,
      mdd: -75,
      dividendYield: 0,
    },
    CASH: {
      name: "현금 / 대기자금",
      market: "KR",
      currency: "KRW",
      price: 10000,
      cagr: 2.5,
      beta: 0,
      mdd: 0,
      dividendYield: 2,
    },
  };