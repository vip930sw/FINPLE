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

export const DEFAULT_ASSETS = hydratePresetAssets([
    {
      ticker: "QQQ",
      name: "나스닥100 ETF",
      quantity: 50,
      price: 430000,
    },
    {
      ticker: "SCHD",
      name: "배당성장 ETF",
      quantity: 100,
      price: 110000,
    },
    {
      ticker: "TLT",
      name: "미국 장기채",
      quantity: 80,
      price: 125000,
    },
    {
      ticker: "GLD",
      name: "금 ETF",
      quantity: 25,
      price: 300000,
    },
  ]);
export const DIVIDEND_ASSETS = hydratePresetAssets([
    {
      ticker: "SCHD",
      name: "배당성장 ETF",
      quantity: 220,
      price: 110000,
    },
    {
      ticker: "QQQ",
      name: "나스닥100 ETF",
      quantity: 25,
      price: 430000,
    },
    {
      ticker: "TLT",
      name: "미국 장기채",
      quantity: 70,
      price: 125000,
    },
    {
      ticker: "GLD",
      name: "금 ETF",
      quantity: 20,
      price: 300000,
    },
  ]);
export const STABLE_ASSETS = hydratePresetAssets([
    {
      ticker: "TLT",
      name: "미국 장기채",
      quantity: 180,
      price: 125000,
    },
    {
      ticker: "GLD",
      name: "금 ETF",
      quantity: 45,
      price: 300000,
    },
    {
      ticker: "SCHD",
      name: "배당성장 ETF",
      quantity: 90,
      price: 110000,
    },
    {
      ticker: "QQQ",
      name: "나스닥100 ETF",
      quantity: 10,
      price: 430000,
    },
  ]);
export const GROWTH_ASSETS = hydratePresetAssets([
    {
      ticker: "QQQ",
      name: "나스닥100 ETF",
      quantity: 75,
      price: 430000,
    },
    {
      ticker: "SCHD",
      name: "배당성장 ETF",
      quantity: 70,
      price: 110000,
    },
    {
      ticker: "GLD",
      name: "금 ETF",
      quantity: 25,
      price: 300000,
    },
  ]);
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
    TLT: {
      name: "미국 장기채",
      market: "US",
      currency: "KRW",
      price: 125000,
    },
    GLD: {
      name: "금 ETF",
      market: "US",
      currency: "KRW",
      price: 300000,
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
