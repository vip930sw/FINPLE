export const AI_ANALYSIS_REGRESSION_FIXTURE_VERSION = "ai-analysis-regression-fixtures-v3";

export const AI_ANALYSIS_EVALUATION_CRITERIA = {
  minimumFixtureCount: 6,
  requiredMarkets: ["US", "KR"],
  requiredDataStatuses: ["ready_with_metrics", "short_history", "limited_manual_input"],
  requiredRiskFocus: [
    "growth concentration",
    "KR ticker validation",
    "cashflow interpretation",
    "duration risk",
    "data warnings",
    "live sample alignment",
  ],
  requiredOutputChecks: [
    "request schema validation",
    "mock output validation",
    "diagnostic section count",
    "asset role coverage",
    "forbidden investment language",
    "numeric hallucination guard",
    "live sample fixture alignment",
  ],
};

export const AI_ANALYSIS_REGRESSION_FIXTURES = [
  {
    id: "us-etf-core",
    label: "US ETF-only core portfolio",
    evaluationFocus: {
      scenario: "미국 ETF 중심 성장·배당·채권·금 혼합 포트폴리오",
      mustCheck: ["role coverage", "risk balance", "gold hedge interpretation"],
    },
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
    evaluationFocus: {
      scenario: "한국 숫자 ticker와 미국식 ticker가 다른 검증 경로를 타는 포트폴리오",
      mustCheck: ["numeric ticker preservation", "KR market context", "asset role coverage"],
    },
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
    evaluationFocus: {
      scenario: "배당률과 현금흐름 해석이 강하게 드러나는 인컴 포트폴리오",
      mustCheck: ["cashflow interpretation", "income concentration", "no yield recommendation"],
    },
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
    evaluationFocus: {
      scenario: "장기채·금·리츠가 함께 있는 방어형 포트폴리오",
      mustCheck: ["duration risk", "real asset sensitivity", "defensive balance"],
    },
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
    evaluationFocus: {
      scenario: "상장 이력 짧음과 수동 입력 자산이 섞인 데이터 제한 포트폴리오",
      mustCheck: ["data warnings", "short history", "manual input boundary"],
    },
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
  {
    id: "live-balanced-growth-sample",
    label: "Live sample balanced growth portfolio",
    evaluationFocus: {
      scenario: "운영 live OpenAI 샘플에서 반복 확인된 성장 ETF 중심의 균형형 포트폴리오",
      mustCheck: ["growth concentration", "cash buffer interpretation", "no repeated generic summary"],
    },
    riskFocus: ["live sample alignment", "growth concentration", "duration risk", "cashflow interpretation"],
    request: {
      portfolioId: "fixture-live-balanced-growth",
      metrics: {
        cagr: 12.46,
        beta: 0.76,
        mdd: -32.12,
        calmar: 0.39,
        dividendYield: 2.15,
        futureValue: 867721421,
        inflationAdjustedFutureValue: 582000000,
      },
      assets: [
        { ticker: "QQQ", market: "US", name: "Invesco QQQ Trust", weight: 45, cagr: 12.1, beta: 1.08, mdd: -35.2, dividendYield: 0.6, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "SCHD", market: "US", name: "Schwab US Dividend Equity ETF", weight: 22, cagr: 9.1, beta: 0.78, mdd: -22.4, dividendYield: 3.4, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "BND", market: "US", name: "Vanguard Total Bond Market ETF", weight: 8, cagr: 2.4, beta: 0.18, mdd: -13.7, dividendYield: 3.3, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "TLT", market: "US", name: "iShares 20+ Year Treasury Bond ETF", weight: 4, cagr: 1.8, beta: 0.35, mdd: -31.5, dividendYield: 3.8, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "VNQ", market: "US", name: "Vanguard Real Estate ETF", weight: 7, cagr: 4.2, beta: 0.92, mdd: -34.5, dividendYield: 4.1, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "GLD", market: "US", name: "SPDR Gold Shares", weight: 8, cagr: 6.2, beta: 0.12, mdd: -18.3, dividendYield: 0, dataYears: 10, dataStatus: "ready_with_metrics" },
        { ticker: "CASH", market: "US", name: "Cash", weight: 6, cagr: 0, beta: 0, mdd: 0, dividendYield: 0, dataYears: 0, dataStatus: "limited_manual_input" },
      ],
    },
  },
];
