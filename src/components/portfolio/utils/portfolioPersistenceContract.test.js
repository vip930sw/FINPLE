import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

import {
  normalizePortfolioPersistenceSnapshot,
  PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
} from "./portfolioPersistenceContract.js";
import {
  createPortfolioApiSnapshot,
  createPortfolioPersistenceStorageModel,
  hydratePortfolioPersistenceRow,
} from "../../../../server/src/services/portfolioPersistenceModel.js";

export const QA_GLOBAL_SETTINGS = Object.freeze({
  startValue: 73500000,
  monthlyCashFlow: 1350000,
  years: 17,
  inflationRate: 3.1,
  dividendReinvest: false,
});

function asset({
  ticker,
  targetEvaluationAmount,
  dividendYield,
  dividendStatus,
  ...extra
}) {
  return {
    id: `qa-${ticker.toLowerCase()}`,
    market: "US",
    ticker,
    name: ticker,
    quantity: 1.25,
    price: 100,
    currency: "USD",
    targetEvaluationAmount,
    cagr: ticker === "GLD" ? 8.2 : 17.11,
    selectedCagr: ticker === "GLD" ? 8.2 : 17.11,
    cagrPolicy: "rolling_10y_median",
    beta: ticker === "GLD" ? 0.12 : 1.08,
    selectedBeta: ticker === "GLD" ? 0.12 : 1.08,
    betaPolicy: "monthly_returns",
    mdd: ticker === "GLD" ? -20.1 : -35.2,
    selectedMdd: ticker === "GLD" ? -20.1 : -35.2,
    mddPolicy: "monthly_returns",
    dividendYield,
    dividendStatus,
    metricDataThroughMonth: "2026-06",
    metricsSource: "production_app_export",
    productionAppExportEnabled: true,
    productionPublishReady: true,
    appExportApproved: true,
    productionReleaseContractVersion: "finple-production-app-export-release-v1",
    ...extra,
  };
}

export function createQaAipiLifecycleSnapshot() {
  return normalizePortfolioPersistenceSnapshot({
    schemaVersion: PORTFOLIO_PERSISTENCE_SCHEMA_VERSION,
    activePortfolioId: "qa-aipi-lifecycle",
    globalSettings: QA_GLOBAL_SETTINGS,
    portfolios: [
      {
        id: "qa-aipi-lifecycle",
        name: "QA AIPI lifecycle",
        description: "lossless server round-trip fixture",
        createdAt: "2026-07-26T00:00:00.000Z",
        updatedAt: "2026-07-26T01:00:00.000Z",
        sortOrder: 0,
        assets: [
          asset({
            ticker: "AIPI",
            targetEvaluationAmount: 15000000,
            dividendYield: null,
            dividendStatus: "reported",
            exposureType: "thematic_equity_premium_income",
            distributionType: "option_income",
            distributionFrequency: "weekly",
            trailingDistributionYield: 34.98,
            cashDistributionYieldTtm: 34.98,
            distributionYieldPolicy:
              "trailing_12m_cash_distribution_not_ordinary_dividend",
            distributionCalculationStatus:
              "review_only_no_approved_reinvestment_model",
          }),
          asset({
            ticker: "QYLG",
            targetEvaluationAmount: 14500000,
            dividendYield: null,
            dividendStatus: "reported",
            exposureType: "index_covered_call_growth",
            distributionType: "covered_call",
            distributionFrequency: "monthly",
            trailingDistributionYield: 16.26,
            cashDistributionYieldTtm: 16.26,
            distributionYieldPolicy:
              "trailing_12m_cash_distribution_not_ordinary_dividend",
            distributionCalculationStatus:
              "review_only_no_approved_reinvestment_model",
          }),
          asset({
            ticker: "QQQ",
            targetEvaluationAmount: 16000000,
            dividendYield: 0.41,
            dividendStatus: "reported",
            distributionType: "ordinary_cash_dividend",
          }),
          asset({
            ticker: "SPY",
            targetEvaluationAmount: 17000000,
            dividendYield: 1.01,
            dividendStatus: "reported",
            distributionType: "ordinary_cash_dividend",
          }),
          asset({
            ticker: "GLD",
            targetEvaluationAmount: 11000000,
            dividendYield: 0,
            dividendStatus: "confirmed_zero",
            distributionType: "none",
          }),
        ],
      },
    ],
  });
}

test("QA AIPI lifecycle survives local, storage model, DB row, API, and JSON round-trip", () => {
  const localSnapshot = createQaAipiLifecycleSnapshot();
  const storageModel = createPortfolioPersistenceStorageModel({
    persistencePortfolio: localSnapshot.portfolios[0],
    globalSettings: localSnapshot.globalSettings,
    activePortfolioId: localSnapshot.activePortfolioId,
  });
  const dbRow = {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    name: localSnapshot.portfolios[0].name,
    description: storageModel.encodedDescription,
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T01:00:00.000Z",
  };
  const dbRead = hydratePortfolioPersistenceRow(dbRow, []);
  const apiResponse = createPortfolioApiSnapshot([dbRead]);
  const jsonRoundTrip = JSON.parse(JSON.stringify(apiResponse));

  assert.equal(jsonRoundTrip.schemaVersion, PORTFOLIO_PERSISTENCE_SCHEMA_VERSION);
  assert.equal(jsonRoundTrip.activePortfolioId, "qa-aipi-lifecycle");
  assert.deepEqual(jsonRoundTrip.globalSettings, QA_GLOBAL_SETTINGS);
  assert.equal(jsonRoundTrip.portfolios[0].name, "QA AIPI lifecycle");
  assert.deepEqual(
    jsonRoundTrip.portfolios[0].assets.map(({ market, ticker }) => `${market}:${ticker}`),
    ["US:AIPI", "US:QYLG", "US:QQQ", "US:SPY", "US:GLD"],
  );
  assert.deepEqual(
    jsonRoundTrip.portfolios[0].assets.map((item) => item.targetEvaluationAmount),
    [15000000, 14500000, 16000000, 17000000, 11000000],
  );

  const total = jsonRoundTrip.portfolios[0].assets.reduce(
    (sum, item) => sum + item.targetEvaluationAmount,
    0,
  );
  assert.deepEqual(
    jsonRoundTrip.portfolios[0].assets.map((item) =>
      Number(((item.targetEvaluationAmount / total) * 100).toFixed(6)),
    ),
    [20.408163, 19.727891, 21.768707, 23.129252, 14.965986],
  );

  const [aipi, qylg, qqq, spy, gld] = jsonRoundTrip.portfolios[0].assets;
  assert.equal(aipi.dividendYield, null);
  assert.equal(aipi.trailingDistributionYield, 34.98);
  assert.equal(aipi.productionAppExportEnabled, true);
  assert.equal(
    aipi.distributionCalculationStatus,
    "review_only_no_approved_reinvestment_model",
  );
  assert.equal(qylg.exposureType, "index_covered_call_growth");
  assert.equal(qqq.dividendYield, 0.41);
  assert.equal(spy.dividendYield, 1.01);
  assert.equal(gld.dividendYield, 0);
  assert.equal(gld.dividendStatus, "confirmed_zero");
});

test("missing metric values remain null while confirmed zero remains numeric zero", () => {
  const snapshot = createQaAipiLifecycleSnapshot();
  const [aipi, , , , gld] = snapshot.portfolios[0].assets;
  assert.equal(aipi.dividendYield, null);
  assert.equal(gld.dividendYield, 0);
  assert.notEqual(aipi.dividendYield, gld.dividendYield);
});

test("browser loadPortfolioState hydrates the exact server snapshot without recreating defaults", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const factory = await vite.ssrLoadModule(
      "/src/components/portfolio/utils/portfolioFactory.js",
    );
    const snapshot = createQaAipiLifecycleSnapshot();
    const restored = factory.loadPortfolioState({
      portfolioList: snapshot.portfolios,
      activePortfolioId: snapshot.activePortfolioId,
      globalSettings: snapshot.globalSettings,
    });

    assert.equal(restored.portfolioList.length, 1);
    assert.equal(restored.activePortfolio.name, "QA AIPI lifecycle");
    assert.deepEqual(restored.globalSettings, QA_GLOBAL_SETTINGS);
    assert.deepEqual(
      restored.activePortfolio.assets.map((item) => item.targetEvaluationAmount),
      [15000000, 14500000, 16000000, 17000000, 11000000],
    );
    assert.equal(restored.activePortfolio.assets[0].dividendYield, null);
    assert.equal(restored.activePortfolio.assets[0].trailingDistributionYield, 34.98);
    assert.equal(restored.activePortfolio.assets[4].dividendYield, 0);
    assert.equal(restored.activePortfolio.assets[4].dividendStatus, "confirmed_zero");

    const empty = factory.loadPortfolioState({
      portfolioList: [],
      activePortfolioId: null,
      globalSettings: snapshot.globalSettings,
    });
    assert.deepEqual(empty.portfolioList, []);
    assert.equal(empty.activePortfolioId, null);
    assert.equal(empty.activePortfolio, null);
  } finally {
    await vite.close();
  }
});
