import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after, before } from "node:test";

import { createServer } from "vite";

import { FINPLE_PLAN_CONFIGS } from "../src/components/portfolio/config/planConfig.js";
import { getPortfolioCreationDecision } from "../src/components/portfolio/utils/portfolioLifecycle.js";
import { importServerPortfoliosToBrowser } from "../src/components/portfolio/services/serverPortfolioService.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hookSource = read("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const menuSource = read("../src/components/portfolio/components/NewPortfolioMenu.jsx");
const managerSource = read("../src/components/portfolio/components/PortfolioManagerPanel.jsx");
const mbtiSource = read("../src/components/InvestmentMbtiPage.jsx");
const pricingSource = read("../src/components/AccountPages.jsx");
const serverRouteSource = read("../server/src/routes/portfolioDbRoutes.js");

let vite;
let mbtiPage;
let factory;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  [mbtiPage, factory] = await Promise.all([
    vite.ssrLoadModule("/src/components/InvestmentMbtiPage.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/utils/portfolioFactory.js"),
  ]);
});

after(async () => {
  delete globalThis.window;
  await vite?.close();
});

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function portfolio(id, extras = {}) {
  return {
    id,
    name: `포트폴리오 ${id}`,
    order: id,
    userNote: `메모 ${id}`,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T01:00:00.000Z",
    customField: `custom-${id}`,
    assets: [],
    ...extras,
  };
}

function mbtiResult(market) {
  return {
    calculatedRiskProfile: "중립투자형",
    riskScore: 50,
    axes: {},
    axisScores: {},
    type: {
      typeId: `Plan-A-${market}`,
      nickname: `Plan-A ${market}`,
      finpleType: `Plan-A ${market}`,
      preset: { growthStock: 100 },
      defaults: { monthlyContribution: 1_000_000, years: 10, inflationRate: 2.5 },
    },
  };
}

test("Free 3, Personal 30, and the Plan-B capability matrix are explicit", () => {
  assert.equal(FINPLE_PLAN_CONFIGS.free.limits.portfolios, 3);
  assert.equal(FINPLE_PLAN_CONFIGS.personal.limits.portfolios, 30);
  assert.deepEqual(FINPLE_PLAN_CONFIGS.free.features, {
    basicAnalysis: true,
    probabilityAnalysis: false,
    externalShockAnalysis: false,
    aiAnalysis: false,
    savedPortfolios: true,
  });
  assert.ok(Object.values(FINPLE_PLAN_CONFIGS.personal.features).every(Boolean));
  assert.match(FINPLE_PLAN_CONFIGS.free.items.join(" "), /포트폴리오 3개 저장/);
  assert.match(FINPLE_PLAN_CONFIGS.free.items.join(" "), /Step 1~3 기본분석 제공/);
  assert.match(FINPLE_PLAN_CONFIGS.free.items.join(" "), /Step 7 브라우저 저장/);
  assert.match(FINPLE_PLAN_CONFIGS.personal.items.join(" "), /Step 1~6 전체분석 제공/);
  assert.match(FINPLE_PLAN_CONFIGS.personal.items.join(" "), /Step 7 서버 저장 및 불러오기/);
});

test("one shared decision allows the third and thirtieth, then blocks growth", () => {
  assert.equal(getPortfolioCreationDecision({ portfolioCount: 2, portfolioLimit: 3 }).allowed, true);
  assert.equal(getPortfolioCreationDecision({ portfolioCount: 3, portfolioLimit: 3 }).allowed, false);
  assert.equal(getPortfolioCreationDecision({ portfolioCount: 29, portfolioLimit: 30 }).allowed, true);
  assert.equal(getPortfolioCreationDecision({ portfolioCount: 30, portfolioLimit: 30 }).allowed, false);
  assert.equal(getPortfolioCreationDecision({ portfolioCount: 5, portfolioLimit: 3, requestedCount: 0 }).allowed, true);
});

test("downgrade and legacy snapshots preserve every portfolio and the active id", () => {
  for (const count of [5, 30]) {
    const portfolios = Array.from({ length: count }, (_, index) => portfolio(`p-${index + 1}`));
    const activePortfolioId = portfolios.at(-1).id;
    const loaded = factory.loadPortfolioState({ portfolioList: portfolios, activePortfolioId });
    assert.equal(loaded.portfolioList.length, count);
    assert.equal(loaded.activePortfolioId, activePortfolioId);
    assert.equal(loaded.activePortfolio.customField, `custom-${activePortfolioId}`);
    assert.doesNotMatch(JSON.stringify(loaded), /NaN|undefined/);
  }
  assert.doesNotMatch(hookSource, /portfolioList\.slice\(0,\s*limit\)/);
  assert.match(hookSource, /hydrateLoadedPortfolioState\(\s*loadPortfolioState\(\)/);
});

test("template, preset, duplicate, backup, menu, and MBTI use the shared decision", () => {
  assert.match(hookSource, /function createPortfolioFromTemplate[\s\S]*?canIncreasePortfolioCount\(\)/);
  assert.match(hookSource, /function duplicateActivePortfolio[\s\S]*?canIncreasePortfolioCount\(\)/);
  assert.match(hookSource, /function restorePortfolioBackup[\s\S]*?canIncreasePortfolioCount\(requestedCount\)/);
  assert.match(hookSource, /getPortfolioCreationDecision/);
  assert.match(menuSource, /canCreatePortfolio/);
  assert.match(mbtiSource, /getPortfolioCreationDecision/);
});

test("Investment MBTI US and KR allow three portfolios and preserve state on the fourth", async () => {
  const storage = createStorage();
  for (const [index, market] of ["US", "KR", "US"].entries()) {
    assert.equal(mbtiPage.saveResultToSimulator(mbtiResult(market), market, {
      storage,
      id: `mbti-${index + 1}`,
      planKey: "free",
      saveProfileToServer() {},
    }), true);
  }
  const before = storage.getItem("finple-portfolio-list");
  const activeBefore = storage.getItem("finple-active-portfolio-id");
  let blocked = 0;
  assert.equal(mbtiPage.saveResultToSimulator(mbtiResult("KR"), "KR", {
    storage,
    id: "mbti-4",
    planKey: "free",
    onPlanLimit() { blocked += 1; },
    saveProfileToServer() {},
  }), false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(blocked, 1);
  assert.equal(storage.getItem("finple-portfolio-list"), before);
  assert.equal(storage.getItem("finple-active-portfolio-id"), activeBefore);
});

test("server replace never slices and merge growth is fail-closed", () => {
  const storage = createStorage();
  globalThis.window = { localStorage: storage, dispatchEvent() {}, FINPLE_ASSET_DATA_CONFIG: {} };
  const three = [portfolio("one"), portfolio("two"), portfolio("three")];
  const replaced = importServerPortfoliosToBrowser({ portfolios: three, activePortfolioId: "three" }, {
    mode: "replace",
    portfolioLimit: 3,
  });
  assert.equal(replaced.totalCount, 3);
  assert.equal(replaced.activePortfolioId, "three");
  const before = storage.getItem("finple-portfolio-list");
  assert.throws(() => importServerPortfoliosToBrowser({ portfolios: [portfolio("four")] }, {
    mode: "merge",
    portfolioLimit: 3,
  }), /portfolio_plan_limit_reached/);
  assert.equal(storage.getItem("finple-portfolio-list"), before);
});

test("Step 7 keeps browser backup for Free and server controls for Personal", () => {
  assert.match(managerSource, /canUseServerStorage \? <div className="portfolioBackupPanel">/);
  assert.match(managerSource, /백업 다운로드/);
  assert.match(managerSource, /백업 불러오기/);
  assert.match(pricingSource, /portfolioLimit: currentPlan\.limits\.portfolios/);
});

test("Plan-A does not invent server authority or schema enforcement", () => {
  assert.match(serverRouteSource, /getRequestUserId/);
  assert.doesNotMatch(serverRouteSource, /FINPLE_PLAN_CONFIGS|portfolio_plan_limit_reached|ALTER TABLE/);
  assert.match(pricingSource, /getEffectiveStoredPlanKey/);
  assert.match(pricingSource, /isEducationAuthUser/);
});
