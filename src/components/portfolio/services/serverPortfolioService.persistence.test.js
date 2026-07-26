import assert from "node:assert/strict";
import test from "node:test";

import {
  getLocalPortfolioSnapshot,
  importServerPortfoliosToBrowser,
  syncLocalPortfoliosToServer,
} from "./serverPortfolioService.js";
import { deletePortfolioWithServerSync } from "../utils/portfolioLifecycle.js";
import { createPortfolioApiSnapshot } from "../../../../server/src/services/portfolioPersistenceModel.js";

const QA_GLOBAL_SETTINGS = {
  startValue: 73500000,
  monthlyCashFlow: 1350000,
  years: 17,
  inflationRate: 3.1,
  dividendReinvest: false,
};

function createQaAipiLifecycleSnapshot() {
  const values = [
    ["AIPI", 15000000, null, "reported", 34.98],
    ["QYLG", 14500000, null, "reported", 16.26],
    ["QQQ", 16000000, 0.41, "reported", null],
    ["SPY", 17000000, 1.01, "reported", null],
    ["GLD", 11000000, 0, "confirmed_zero", null],
  ];
  return {
    schemaVersion: 3,
    activePortfolioId: "qa-aipi-lifecycle",
    globalSettings: QA_GLOBAL_SETTINGS,
    portfolios: [
      {
        id: "qa-aipi-lifecycle",
        name: "QA AIPI lifecycle",
        assets: values.map(
          ([ticker, targetEvaluationAmount, dividendYield, dividendStatus, trailing]) => ({
            id: `qa-${ticker.toLowerCase()}`,
            market: "US",
            ticker,
            name: ticker,
            quantity: 1,
            price: 100,
            currency: "USD",
            targetEvaluationAmount,
            dividendYield,
            dividendStatus,
            distributionType:
              trailing === null ? "ordinary_cash_dividend" : "covered_call",
            trailingDistributionYield: trailing,
            cashDistributionYieldTtm: trailing,
            productionAppExportEnabled: true,
          }),
        ),
      },
    ],
  };
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

function installWindow() {
  const localStorage = createStorage();
  globalThis.window = {
    localStorage,
    dispatchEvent() {},
    FINPLE_ASSET_DATA_CONFIG: {},
  };
  return localStorage;
}

test("authoritative replace restores exact server settings and five assets", () => {
  const storage = installWindow();
  storage.setItem(
    "finple-global-settings",
    JSON.stringify({ ...QA_GLOBAL_SETTINGS, startValue: 1, monthlyCashFlow: 2 }),
  );
  const serverSnapshot = createQaAipiLifecycleSnapshot();

  const result = importServerPortfoliosToBrowser(serverSnapshot, { mode: "replace" });
  const restored = getLocalPortfolioSnapshot();

  assert.equal(result.totalCount, 1);
  assert.equal(restored.portfolioList[0].name, "QA AIPI lifecycle");
  assert.deepEqual(restored.globalSettings, QA_GLOBAL_SETTINGS);
  assert.deepEqual(
    restored.portfolioList[0].assets.map((item) => item.targetEvaluationAmount),
    [15000000, 14500000, 16000000, 17000000, 11000000],
  );
});

test("authoritative replace hydrates catalog fields without changing user portfolio values", () => {
  installWindow();
  const serverSnapshot = createQaAipiLifecycleSnapshot();
  const result = importServerPortfoliosToBrowser(serverSnapshot, {
    mode: "replace",
    hydratePortfolio(portfolio) {
      return {
        ...portfolio,
        assets: portfolio.assets.map((item) => ({
          ...item,
          dataStatus: "ready",
          metricsStatus: "ready",
          overlayStatus: "production_app_export_approved",
        })),
      };
    },
  });
  const [restored] = getLocalPortfolioSnapshot().portfolioList;

  assert.equal(result.totalCount, 1);
  assert.equal(restored.name, "QA AIPI lifecycle");
  assert.equal(restored.assets[0].quantity, 1);
  assert.equal(restored.assets[0].price, 100);
  assert.equal(restored.assets[0].targetEvaluationAmount, 15000000);
  assert.equal(restored.assets[0].dataStatus, "ready");
  assert.equal(restored.assets[0].metricsStatus, "ready");
  assert.equal(restored.assets[0].overlayStatus, "production_app_export_approved");
});

test("authoritative empty replace stores [] and null active id without default recreation data", () => {
  const storage = installWindow();
  const result = importServerPortfoliosToBrowser(
    {
      schemaVersion: 3,
      portfolios: [],
      activePortfolioId: null,
      globalSettings: QA_GLOBAL_SETTINGS,
    },
    { mode: "replace" },
  );

  assert.equal(result.totalCount, 0);
  assert.equal(result.activePortfolioId, null);
  assert.equal(storage.getItem("finple-portfolio-list"), "[]");
  assert.equal(storage.getItem("finple-active-portfolio-id"), null);
  assert.deepEqual(getLocalPortfolioSnapshot().portfolioList, []);
  assert.equal(getLocalPortfolioSnapshot().activePortfolioId, null);
});

test("canonical frontend deletion reaches the server transport as authoritative empty state", async () => {
  const storage = installWindow();
  storage.setItem(
    "finple-trial-auth-user",
    JSON.stringify({ id: "qa-user", email: "redacted@example.invalid" }),
  );
  window.FINPLE_ASSET_DATA_CONFIG.apiBaseUrl = "https://qa.invalid/api";

  const stalePortfolio = {
    id: "qa-aipi-lifecycle",
    name: "QA AIPI lifecycle",
    assets: [{ id: "qa-aipi", market: "US", ticker: "AIPI" }],
  };
  const snapshot = {
    schemaVersion: 3,
    portfolios: [stalePortfolio],
    portfolioList: [stalePortfolio],
    activePortfolioId: stalePortfolio.id,
    globalSettings: QA_GLOBAL_SETTINGS,
  };
  let serverPortfolios = [stalePortfolio];
  let archivedStaleCount = 0;
  let requestBody = null;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    if (requestBody.portfolioList.length === 0) {
      archivedStaleCount = serverPortfolios.length;
      serverPortfolios = [];
    }
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          archivedStaleCount,
          ...createPortfolioApiSnapshot(serverPortfolios),
        };
      },
    };
  };

  try {
    const result = await deletePortfolioWithServerSync({
      portfolioList: snapshot.portfolioList,
      portfolioId: stalePortfolio.id,
      snapshot,
      syncSnapshot: syncLocalPortfoliosToServer,
    });

    assert.deepEqual(result.portfolioList, []);
    assert.deepEqual(requestBody.portfolioList, []);
    assert.equal(requestBody.activePortfolioId, null);
    assert.deepEqual(requestBody.globalSettings, QA_GLOBAL_SETTINGS);
    assert.equal(archivedStaleCount, 1);
    assert.deepEqual(createPortfolioApiSnapshot(serverPortfolios).portfolios, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
