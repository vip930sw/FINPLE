export const AI_ANALYSIS_REGRESSION_FIXTURE_VERSION = "ai-analysis-regression-fixtures-v1";

export const AI_ANALYSIS_REGRESSION_FIXTURES = [
  {
    id: "us-etf-core",
    label: "US ETF-only core portfolio",
    riskFocus: ["growth concentration", "bond ballast", "gold hedge"],
    request: {
      portfolioId: "fixture-us-etf-core",
      metrics: {
        cagr: 8.4,
        beta: 0.82,
        mdd: -24.6,
        calmar: 0.34,
        dividendYield: 1.7,
        futureValue: 742000000,
        inflationAdjustedFutureValue: 498000000,
      },
      assets: [
        { ticker: "QQQ", market: "US", name: "Invesco QQQ Trust", weight: 40, cagr: 12.1, beta: 1.08, mdd: -35.2, dividendYield: 0.6, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "SCHD", market: "US", name: "Schwab US Dividend Equity ETF", weight: 30, cagr: 9.1, beta: 0.78, mdd: -22.4, dividendYield: 3.4, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "TLT", market: "US", name: "iShares 20+ Year Treasury Bond ETF", weight: 20, cagr: 1.8, beta: 0.35, mdd: -31.5, dividendYield: 3.8, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "GLD", market: "US", name: "SPDR Gold Shares", weight: 10, cagr: 6.2, beta: 0.12, mdd: -18.3, dividendYield: 0, dataYears: 10, dataStatus: "ready_with_metrics" },
      ],
    },
  },
  {
    id: "kr-numeric-tickers",
    label: "KR numeric ticker portfolio",
    riskFocus: ["KR ticker validation", "local equity and bond mix"],
    request: {
      portfolioId: "fixture-kr-numeric",
      metrics: {
        cagr: 6.7,
        beta: 0.74,
        mdd: -21.2,
        calmar: 0.32,
        dividendYield: 2.4,
        futureValue: 615000000,
        inflationAdjustedFutureValue: 413000000,
      },
      assets: [
        { ticker: "069500", market: "KR", name: "KODEX 200", weight: 45, cagr: 7.2, beta: 1.01, mdd: -28.4, dividendYield: 1.8, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "091160", market: "KR", name: "KODEX 반도체", weight: 20, cagr: 10.4, beta: 1.24, mdd: -36.8, dividendYield: 0.7, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "148070", market: "KR", name: "KOSEF 국고채10년", weight: 25, cagr: 2.1, beta: 0.2, mdd: -9.6, dividendYield: 2.9, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "132030", market: "KR", name: "KODEX 골드선물(H)", weight: 10, cagr: 5.4, beta: 0.16, mdd: -17.2, dividendYield: 0, dataYears: 10, dataStatus: "ready_with_metrics" },
      ],
    },
  },
  {
    id: "income-cashflow",
    label: "Dividend and cashflow portfolio",
    riskFocus: ["cashflow interpretation", "income concentration"],
    request: {
      portfolioId: "fixture-income-cashflow",
      metrics: {
        cagr: 5.9,
        beta: 0.61,
        mdd: -18.9,
        calmar: 0.31,
        dividendYield: 4.2,
        futureValue: 536000000,
        inflationAdjustedFutureValue: 360000000,
      },
      assets: [
        { ticker: "SCHD", market: "US", name: "Schwab US Dividend Equity ETF", weight: 35, cagr: 9.1, beta: 0.78, mdd: -22.4, dividendYield: 3.4, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "JEPI", market: "US", name: "JPMorgan Equity Premium Income ETF", weight: 25, cagr: 6.6, beta: 0.58, mdd: -15.1, dividendYield: 7.8, dataYears: 5, dataStatus: "ready_with_metrics" },
        { ticker: "BND", market: "US", name: "Vanguard Total Bond Market ETF", weight: 25, cagr: 2.4, beta: 0.18, mdd: -13.7, dividendYield: 3.3, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "VNQ", market: "US", name: "Vanguard Real Estate ETF", weight: 15, cagr: 4.2, beta: 0.92, mdd: -34.5, dividendYield: 4.1, dataYears: 10, dataStatus: "ready_with_metrics" },
      ],
    },
  },
  {
    id: "defensive-bond-gold-reit",
    label: "Long bond, gold, and REIT defensive portfolio",
    riskFocus: ["duration risk", "real asset sensitivity", "defensive balance"],
    request: {
      portfolioId: "fixture-defensive-bond-gold-reit",
      metrics: {
        cagr: 4.8,
        beta: 0.48,
        mdd: -20.4,
        calmar: 0.24,
        dividendYield: 3.1,
        futureValue: 452000000,
        inflationAdjustedFutureValue: 304000000,
      },
      assets: [
        { ticker: "TLT", market: "US", name: "iShares 20+ Year Treasury Bond ETF", weight: 35, cagr: 1.8, beta: 0.35, mdd: -31.5, dividendYield: 3.8, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "BND", market: "US", name: "Vanguard Total Bond Market ETF", weight: 25, cagr: 2.4, beta: 0.18, mdd: -13.7, dividendYield: 3.3, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "GLD", market: "US", name: "SPDR Gold Shares", weight: 25, cagr: 6.2, beta: 0.12, mdd: -18.3, dividendYield: 0, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "VNQ", market: "US", name: "Vanguard Real Estate ETF", weight: 15, cagr: 4.2, beta: 0.92, mdd: -34.5, dividendYield: 4.1, dataYears: 10, dataStatus: "ready_with_metrics" },
      ],
    },
  },
  {
    id: "missing-data-review",
    label: "Data-limited review portfolio",
    riskFocus: ["data warnings", "limited metrics", "new listing"],
    request: {
      portfolioId: "fixture-missing-data-review",
      metrics: {
        cagr: 7.1,
        beta: 0.9,
        mdd: -26.3,
        calmar: 0.27,
        dividendYield: 1.1,
        futureValue: 594000000,
        inflationAdjustedFutureValue: 399000000,
      },
      assets: [
        { ticker: "QQQ", market: "US", name: "Invesco QQQ Trust", weight: 45, cagr: 12.1, beta: 1.08, mdd: -35.2, dividendYield: 0.6, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "QQQM", market: "US", name: "Invesco NASDAQ 100 ETF", weight: 20, cagr: 11.4, beta: 1.05, mdd: -27.8, dividendYield: 0.7, dataYears: 4, dataStatus: "short_history" },
        { ticker: "CASH", market: "US", name: "Cash", weight: 20, cagr: 0, beta: 0, mdd: 0, dividendYield: 0, dataYears: 0, dataStatus: "limited_manual_input" },
        { ticker: "SCHD", market: "US", name: "Schwab US Dividend Equity ETF", weight: 15, cagr: 9.1, beta: 0.78, mdd: -22.4, dividendYield: 3.4, dataYears: 10, dataStatus: "ready_with_metrics" },
      ],
    },
  },
];
