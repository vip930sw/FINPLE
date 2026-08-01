import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";
import test, { after, before } from "node:test";

import { createServer } from "vite";

const START_VALUE = 50_000_000;
const SETTINGS = Object.freeze({
  startValue: START_VALUE,
  monthlyCashFlow: 1_000_000,
  years: 10,
  inflationRate: 2.5,
  dividendReinvest: true,
});
const PORTFOLIO_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const LEGACY_STORAGE_KEY = "finple-portfolio-simulator";
const MBTI_STORAGE_KEY = "finple-mbti-simulator-preset";
const MARKET_TICKERS = Object.freeze({
  US: Object.freeze({
    growthStock: "QQQ",
    valueStock: "SCHD",
    bond: "BND",
    longBond: "TLT",
    reit: "VNQ",
    gold: "GLD",
    crypto: "BLOK",
    cash: "CASH",
  }),
  KR: Object.freeze({
    growthStock: "069500",
    valueStock: "161510",
    bond: "273130",
    longBond: "148070",
    reit: "329200",
    gold: "132030",
    crypto: "305720",
    cash: "CASH",
  }),
});
const CANONICAL_FIELDS = Object.freeze([
  "ticker",
  "market",
  "name",
  "assetType",
  "expectedCagr",
  "selectedCagr",
  "beta",
  "mdd",
  "dividendYield",
  "trailingDistributionYield",
  "cashDistributionYieldTtm",
  "distributionType",
  "distributionFrequency",
  "exposureType",
  "portfolioAddPolicy",
  "portfolioEligible",
  "priceMetricsStatus",
  "metricMode",
  "dataSource",
]);
const source = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const mbtiPageSource = source("../src/components/InvestmentMbtiPage.jsx");
const simulatorHookSource = source("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const settingsPanelSource = source("../src/components/portfolio/components/SettingsPanel.jsx");

let vite;
let mbtiPage;
let mbtiStorage;
let loader;
let baseline;
let factory;
let persistence;
let serverPersistence;

function createStorage(initial = {}, failOnceOnKey = "") {
  const values = new Map(Object.entries(initial));
  let failed = false;
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (!failed && key === failOnceOnKey) {
        failed = true;
        throw new Error(`storage write failed: ${key}`);
      }
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

function createResult(typeId, preset) {
  return {
    calculatedRiskProfile: typeId.includes("성장") ? "공격투자형" : "안정추구형",
    riskScore: 50,
    axes: {},
    axisScores: {},
    type: {
      typeId,
      nickname: `P4 ${typeId}`,
      finpleType: typeId,
      preset,
      defaults: {
        monthlyContribution: 1_000_000,
        years: 10,
        inflationRate: 2.5,
      },
    },
  };
}

function assertFiniteTree(value, label = "value") {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), label);
    return;
  }
  if (typeof value === "string") {
    assert.doesNotMatch(value, /NaN|Infinity|undefined/, label);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteTree(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => assertFiniteTree(item, `${label}.${key}`));
  }
}

function assertCash(asset, label) {
  assert.equal(asset.dataSource, "finple_manual_cash_reference", `${label}:dataSource`);
  assert.equal(asset.market, "CASH", `${label}:market`);
  assert.equal(asset.assetType, "CASH", `${label}:assetType`);
  assert.equal(asset.expectedCagr, 2, `${label}:expectedCagr`);
  assert.equal(asset.selectedCagr, 2, `${label}:selectedCagr`);
  assert.equal(asset.beta, 0, `${label}:beta`);
  assert.equal(asset.mdd, 0, `${label}:mdd`);
  assert.equal(asset.dividendYield, 0, `${label}:dividendYield`);
  assert.equal(asset.simulationCashYield, 0, `${label}:simulationCashYield`);
  assert.equal(asset.reinvestmentCashYield, 0, `${label}:reinvestmentCashYield`);
  assert.equal(asset.portfolioAddPolicy, "allow", `${label}:portfolioAddPolicy`);
}

function assertCanonicalAsset(asset, expectedTicker, market, label) {
  if (expectedTicker === "CASH") {
    assertCash(asset, label);
    return;
  }
  const candidate = loader.findScreenerCandidateByTicker(expectedTicker, market);
  assert.ok(candidate, `${label}:candidate`);
  assert.equal(candidate.portfolioAddPolicy, "allow", `${label}:catalog-policy`);
  const patch = loader.createAssetPatchFromScreenerCandidate(candidate);
  for (const field of CANONICAL_FIELDS) {
    assert.deepEqual(asset[field], patch[field], `${label}:${field}`);
  }
}

function assertReadyPaths(typeId, market, assets) {
  const baselineResult = baseline.buildMonthlyBaselineProjection({ settings: SETTINGS, assets });
  assert.equal(baselineResult.status, "ready", `${market}:${typeId}:baseline:${baselineResult.blockReasons.join("|")}`);
  const portfolio = { id: `${market}-${typeId}`, name: typeId, settings: SETTINGS, assets };
  const step2 = baseline.buildStep2MonthlyBaselineComparison({
    portfolios: [portfolio],
    activePortfolioId: portfolio.id,
    assets,
    settings: SETTINGS,
  })[0].result;
  const step3 = baseline.buildStep3MonthlyBaselineDetail({ portfolio, settings: SETTINGS, assets });
  assert.equal(step2.status, "ready", `${market}:${typeId}:step2`);
  assert.equal(step3.status, "ready", `${market}:${typeId}:step3`);
  assertFiniteTree({ baselineResult, step2, step3 }, `${market}:${typeId}`);
}

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  [mbtiPage, mbtiStorage, loader, baseline, factory, persistence, serverPersistence] = await Promise.all([
    vite.ssrLoadModule("/src/components/InvestmentMbtiPage.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/utils/mbtiProfileStorage.js"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyBaselineEngine.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioFactory.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioPersistenceContract.js"),
    vite.ssrLoadModule("/server/src/services/portfolioPersistenceModel.js"),
  ]);
  await loader.loadScreenerCandidateRuntime();
});

after(async () => {
  await vite?.close();
});

test("Investment MBTI canonical apply matrix: US 16 and KR 16", async (t) => {
  const entries = Object.entries(mbtiStorage.MBTI_PRESET_MAP);
  assert.equal(entries.length, 16);
  const counts = { US: 0, KR: 0 };

  for (const market of ["US", "KR"]) {
    for (const [typeId, preset] of entries) {
      await t.test(`${market}:${typeId}`, () => {
        const assets = mbtiPage.buildAssetsFromPreset(preset, START_VALUE, market);
        const positiveEntries = Object.entries(preset).filter(([, weight]) => Number(weight) > 0);
        assert.equal(assets.length, positiveEntries.length);
        assert.equal(assets.reduce((sum, asset) => sum + asset.targetWeight, 0), 100);
        assert.equal(assets.reduce((sum, asset) => sum + asset.targetEvaluationAmount, 0), START_VALUE);
        assert.equal(new Set(assets.map((asset) => `${asset.market}:${asset.ticker}`)).size, assets.length);
        assert.ok(assets.every((asset) => asset.ticker && Number(asset.targetWeight) > 0));

        assets.forEach((asset, index) => {
          const [assetKey, weight] = positiveEntries[index];
          const ticker = MARKET_TICKERS[market][assetKey];
          assert.equal(asset.quantity, 0, `${market}:${typeId}:${ticker}:quantity`);
          assert.equal(asset.targetEvaluationAmount, START_VALUE * Number(weight) / 100);
          if (market === "KR" && ticker !== "CASH") assert.match(asset.ticker, /^\d{6}$/);
          assertCanonicalAsset(asset, ticker, market, `${market}:${typeId}:${ticker}`);
        });

        assertReadyPaths(typeId, market, assets);
        counts[market] += 1;
      });
    }
  }

  assert.deepEqual(counts, { US: 16, KR: 16 });
  process.stdout.write(`\nP4 canonical apply paths: US ${counts.US}/16, KR ${counts.KR}/16, total ${counts.US + counts.KR}/32\n`);
});

test("canonical hydration overrides template metrics while preserving user-owned fields", () => {
  const candidate = loader.findScreenerCandidateByTicker("QQQ", "US");
  const sourceAsset = {
    id: "user-id",
    market: "US",
    ticker: "QQQ",
    name: "사용자 이름",
    targetWeight: 60,
    targetEvaluationAmount: 30_000_000,
    userNote: "keep-me",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    expectedCagr: 999,
    beta: 999,
    mdd: -999,
  };
  const hydrated = loader.hydrateAssetFromScreenerCandidate(sourceAsset);
  const patch = loader.createAssetPatchFromScreenerCandidate(candidate);
  for (const field of ["id", "name", "targetWeight", "targetEvaluationAmount", "userNote", "createdAt", "updatedAt"]) {
    assert.equal(hydrated[field], sourceAsset[field], field);
  }
  for (const field of ["expectedCagr", "selectedCagr", "beta", "mdd", "dataSource", "portfolioAddPolicy"]) {
    assert.deepEqual(hydrated[field], patch[field], field);
  }
});

test("Investment MBTI apply source stays local-canonical and quote-free", () => {
  assert.match(mbtiPageSource, /hydrateAssetFromScreenerCandidate/);
  assert.match(mbtiPageSource, /findScreenerCandidateByTicker/);
  assert.doesNotMatch(mbtiPageSource, /scheduleSimulatorAutoLookup|pendingTemplateAutoLookupRef|fetchAssetDataByTicker|fetchAssetDataBatch|fetchAllAssetData|shouldAutoLookup\s*[:=]\s*true|lookupDisabled|button\.textContent[\s\S]*?\.click\(|전체 조회|현재가 조회 중/i);
  assert.doesNotMatch(simulatorHookSource, /fetchAssetDataByTicker|fetchAssetDataBatch|pendingTemplateAutoLookupRef/);
  assert.doesNotMatch(settingsPanelSource, />전체 조회</);
  assert.match(mbtiPageSource, /if \(saveResultToSimulator\(result, marketMode\)\) onNavigate\?\.\("personal"\)/);
});

for (const market of ["US", "KR"]) {
  test(`${market} apply persists current, legacy, profile, reload, server snapshot, backup, and clone contracts`, async () => {
    const [typeId, preset] = Object.entries(mbtiStorage.MBTI_PRESET_MAP)[market === "US" ? 0 : 15];
    const result = createResult(typeId, preset);
    const storage = createStorage();
    const id = `p4-${market.toLowerCase()}`;
    let serverCalls = 0;
    assert.equal(mbtiPage.saveResultToSimulator(result, market, {
      storage,
      id,
      now: "2026-08-01T00:00:00.000Z",
      saveProfileToServer: async () => { serverCalls += 1; throw new Error("offline"); },
    }), true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(serverCalls, 1);

    const list = JSON.parse(storage.getItem(PORTFOLIO_STORAGE_KEY));
    const settings = JSON.parse(storage.getItem(GLOBAL_SETTINGS_STORAGE_KEY));
    const legacy = JSON.parse(storage.getItem(LEGACY_STORAGE_KEY));
    const profile = JSON.parse(storage.getItem(MBTI_STORAGE_KEY));
    assert.equal(list[0].id, id);
    assert.equal(storage.getItem(ACTIVE_PORTFOLIO_STORAGE_KEY), id);
    assert.equal(legacy.activePortfolioId, id);
    assert.equal(profile.typeId, typeId);
    assert.equal(profile.marketMode, market);
    assert.deepEqual(settings, list[0].settings);

    const reloaded = factory.loadPortfolioState({
      portfolioList: list,
      activePortfolioId: id,
      globalSettings: settings,
    });
    const active = loader.hydratePortfolioFromActiveCatalog(reloaded.activePortfolio);
    assert.equal(reloaded.activePortfolioId, id);
    assert.equal(active.mbti.typeId, typeId);
    assert.equal(active.mbti.marketMode, market);
    assert.equal(active.assets.reduce((sum, asset) => sum + asset.targetWeight, 0), 100);
    assert.equal(active.assets.reduce((sum, asset) => sum + asset.targetEvaluationAmount, 0), START_VALUE);
    assert.ok(active.assets.every((asset) => asset.quantity === 0));
    assertReadyPaths(typeId, market, active.assets);

    const backup = persistence.normalizePortfolioPersistenceSnapshot({
      portfolioList: structuredClone(list),
      activePortfolioId: id,
      globalSettings: settings,
    });
    const server = serverPersistence.createPortfolioApiSnapshot(backup.portfolios, backup);
    const clone = structuredClone(active);
    for (const snapshot of [backup, server]) {
      assert.equal(snapshot.activePortfolioId, id);
      assert.equal(snapshot.portfolios[0].mbti.typeId, typeId);
      assert.equal(snapshot.portfolios[0].assets.reduce((sum, asset) => sum + asset.targetWeight, 0), 100);
      assert.equal(snapshot.portfolios[0].assets.reduce((sum, asset) => sum + asset.targetEvaluationAmount, 0), START_VALUE);
    }
    assert.equal(clone.mbti.typeId, typeId);
    assert.deepEqual(clone.assets, active.assets);
  });
}

test("repeated apply is atomic and server profile failure never rolls back local success", async () => {
  const [typeId, preset] = Object.entries(mbtiStorage.MBTI_PRESET_MAP)[0];
  const result = createResult(typeId, preset);
  const storage = createStorage();
  for (const id of ["first", "second"]) {
    assert.equal(mbtiPage.saveResultToSimulator(result, "US", {
      storage,
      id,
      now: `2026-08-01T00:00:0${id === "first" ? 1 : 2}.000Z`,
      saveProfileToServer: () => Promise.reject(new Error("server unavailable")),
    }), true);
  }
  await new Promise((resolve) => setImmediate(resolve));
  const list = JSON.parse(storage.getItem(PORTFOLIO_STORAGE_KEY));
  assert.deepEqual(list.slice(0, 2).map((portfolio) => portfolio.id), ["second", "first"]);
  assert.equal(storage.getItem(ACTIVE_PORTFOLIO_STORAGE_KEY), "second");
});

test("malformed JSON and partial storage writes fail without partial state", () => {
  const [typeId, preset] = Object.entries(mbtiStorage.MBTI_PRESET_MAP)[0];
  const result = createResult(typeId, preset);
  const malformed = createStorage({
    [PORTFOLIO_STORAGE_KEY]: "{broken",
    [ACTIVE_PORTFOLIO_STORAGE_KEY]: "old",
  });
  const malformedBefore = malformed.snapshot();
  const partial = createStorage({
    [PORTFOLIO_STORAGE_KEY]: "[]",
    [ACTIVE_PORTFOLIO_STORAGE_KEY]: "old",
    [GLOBAL_SETTINGS_STORAGE_KEY]: "{\"startValue\":1}",
  }, ACTIVE_PORTFOLIO_STORAGE_KEY);
  const partialBefore = partial.snapshot();
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(mbtiPage.saveResultToSimulator(result, "US", { storage: malformed, saveProfileToServer() {} }), false);
    assert.deepEqual(malformed.snapshot(), malformedBefore);
    assert.equal(mbtiPage.saveResultToSimulator(result, "US", { storage: partial, saveProfileToServer() {} }), false);
    assert.deepEqual(partial.snapshot(), partialBefore);
  } finally {
    console.error = originalError;
  }
});

test("missing canonical, deny, and unknown-source CASH stay fail-closed", () => {
  const missing = [{
    id: "missing",
    market: "US",
    ticker: "NOT-CANONICAL",
    name: "static fallback",
    targetWeight: 100,
    targetEvaluationAmount: START_VALUE,
    expectedCagr: 9,
    cagr: 9,
    selectedCagr: 9,
    beta: 1,
    mdd: -20,
    dividendYield: 0,
    metricMode: "canonical_v2_price_return",
    dataSource: "investment-mbti+canonical-v2",
  }];
  const deniedCandidate = loader.findScreenerCandidateByTicker("0000D0", "KR");
  assert.ok(deniedCandidate);
  const denied = [loader.hydrateAssetFromScreenerCandidate({
    ...deniedCandidate,
    targetWeight: 100,
    targetEvaluationAmount: START_VALUE,
  })];
  const unknownCash = [{
    id: "unknown-cash",
    market: "CASH",
    ticker: "CASH",
    assetType: "CASH",
    dataSource: "unknown",
    targetWeight: 100,
    targetEvaluationAmount: START_VALUE,
    expectedCagr: 2,
    cagr: 2,
    selectedCagr: 2,
    beta: 0,
    mdd: 0,
    dividendYield: 0,
  }];
  for (const [label, assets] of [["missing", missing], ["deny", denied], ["unknown-cash", unknownCash]]) {
    const result = baseline.buildMonthlyBaselineProjection({ settings: SETTINGS, assets });
    assert.equal(result.status, "blocked", `${label}:${result.blockReasons.join("|")}`);
  }
});
