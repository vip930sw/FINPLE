import assert from "node:assert/strict";
import process from "node:process";
import test, { after, before } from "node:test";

import { createServer } from "vite";

import { buildMonthlyBaselineProjection } from "../src/components/portfolio/utils/monthlyBaselineEngine.js";

const SETTINGS = Object.freeze({
  startValue: 50_000_000,
  monthlyCashFlow: 1_000_000,
  years: 10,
  inflationRate: 2.5,
  dividendReinvest: true,
});
const GENERIC_BLOCK_REASONS =
  /missing_metric_lineage|invalid_production_metric_approval|metric_source_not_publish_approved|unsupported_calculation_policy_version|unsupported_pipeline_version/;
const PRESET_NAMES = [
  "DEFAULT_ASSETS",
  "DIVIDEND_ASSETS",
  "STABLE_ASSETS",
  "GROWTH_ASSETS",
  "GOLD_DEFENSE_ASSETS",
  "REIT_INCOME_ASSETS",
  "GROWTH_ZERO_ASSETS",
  "GROWTH_FOCUS_ASSETS",
  "ALL_WEATHER_ASSETS",
  "HIGH_CONVICTION_ASSETS",
];
const MBTI_TICKERS = Object.freeze({
  growthStock: "QQQ",
  valueStock: "SCHD",
  bond: "BND",
  longBond: "TLT",
  reit: "VNQ",
  gold: "GLD",
  crypto: "BLOK",
  cash: "CASH",
});
const PRESERVED_FIELDS = [
  "id",
  "name",
  "quantity",
  "price",
  "targetWeight",
  "targetEvaluationAmount",
  "userNote",
  "createdAt",
  "updatedAt",
];

let vite;
let constants;
let mbti;
let loader;
let persistence;
let serverPersistence;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  [constants, mbti, loader, persistence, serverPersistence] =
    await Promise.all([
      vite.ssrLoadModule("/src/components/portfolio/constants.js"),
      vite.ssrLoadModule("/src/components/portfolio/utils/mbtiProfileStorage.js"),
      vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
      vite.ssrLoadModule("/src/components/portfolio/utils/portfolioPersistenceContract.js"),
      vite.ssrLoadModule("/server/src/services/portfolioPersistenceModel.js"),
    ]);
});

after(async () => {
  await vite?.close();
});

function assertCashContract(asset, label) {
  assert.equal(asset.dataSource, "finple_manual_cash_reference", label);
  for (const field of ["expectedCagr", "cagr", "selectedCagr"]) {
    assert.equal(asset[field], 2.5, `${label}:${field}`);
  }
  for (const field of [
    "dividendYield",
    "simulationCashYield",
    "reinvestmentCashYield",
  ]) {
    assert.equal(asset[field], 0, `${label}:${field}`);
  }
  assert.equal(asset.portfolioAddPolicy, "allow", label);
}

function assertReady(label, assets) {
  const cash = assets.find((asset) => asset.ticker === "CASH");
  if (cash) assertCashContract(cash, label);
  const result = buildMonthlyBaselineProjection({ settings: SETTINGS, assets });
  assert.equal(result.status, "ready", `${label}:${result.blockReasons.join("|")}`);
  assert.doesNotMatch(result.blockReasons.join("|"), GENERIC_BLOCK_REASONS, label);
}

for (const name of PRESET_NAMES) {
  test(`official preset: ${name}`, () => {
    assertReady(name, constants[name]);
  });
}

test("Investment MBTI: 16/16 presets", () => {
  const entries = Object.entries(mbti.MBTI_PRESET_MAP);
  assert.equal(entries.length, 16);
  for (const [name, preset] of entries) {
    const assets = Object.entries(preset)
      .filter(([, weight]) => Number(weight) > 0)
      .map(([key, weight]) => {
        const ticker = MBTI_TICKERS[key];
        assert.ok(ticker, `${name}:${key}`);
        return ticker === "CASH"
          ? loader.hydrateAssetFromScreenerCandidate({
              ticker,
              market: "CASH",
              assetType: "CASH",
              dataSource: "investment-mbti-cash",
              targetWeight: weight,
            })
          : {
              ...loader.findScreenerCandidateByTicker(ticker, "US"),
              targetWeight: weight,
            };
      });
    assertReady(name, assets);
  }
});

function savedCash() {
  return {
    ticker: "CASH",
    market: "CASH",
    assetType: "CASH",
    dataSource: "manual-cash",
    id: "saved-cash",
    name: "사용자 현금",
    quantity: 7,
    price: 12_345,
    targetWeight: 100,
    targetEvaluationAmount: 86_415,
    userNote: "keep-me",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  };
}

const persistencePaths = {
  "localStorage legacy": (cash) =>
    JSON.parse(JSON.stringify({ assets: [cash] })).assets,
  "localStorage current": (cash) =>
    persistence.normalizePortfolioPersistenceSnapshot({
      portfolioList: [{ id: "current", assets: [cash] }],
    }).portfolios[0].assets,
  "server snapshot": (cash) =>
    serverPersistence.createPortfolioApiSnapshot([
      { id: "server", assets: [cash] },
    ]).portfolios[0].assets,
  "backup restore": (cash) =>
    persistence.normalizePortfolioPersistenceSnapshot(
      JSON.parse(JSON.stringify({
        portfolioList: [{ id: "backup", assets: [cash] }],
      })),
    ).portfolios[0].assets,
  "portfolio clone": (cash) => structuredClone([cash]),
};

for (const [name, restore] of Object.entries(persistencePaths)) {
  test(`persistence: ${name}`, () => {
    const original = savedCash();
    const assets = loader.hydratePortfolioFromActiveCatalog({
      assets: restore(original),
    }).assets;
    const cash = assets[0];
    for (const field of PRESERVED_FIELDS) {
      assert.equal(cash[field], original[field], `${name}:${field}`);
    }
    assertReady(name, assets);
  });
}

test("unknown-source CASH remains blocked", () => {
  const result = buildMonthlyBaselineProjection({
    settings: SETTINGS,
    assets: [{
      ...savedCash(),
      dataSource: "user-input",
      cagr: null,
      selectedCagr: null,
      dividendYield: null,
    }],
  });
  assert.equal(result.status, "blocked");
  assert.match(result.blockReasons.join("|"), GENERIC_BLOCK_REASONS);
});

test("an actual portfolioAddPolicy=deny asset remains blocked", () => {
  const denied = loader.findScreenerCandidateByTicker("0000D0", "KR");
  assert.equal(denied.portfolioAddPolicy, "deny");
  const result = buildMonthlyBaselineProjection({
    settings: SETTINGS,
    assets: [{ ...denied, targetWeight: 100 }],
  });
  assert.equal(result.status, "blocked");
});
