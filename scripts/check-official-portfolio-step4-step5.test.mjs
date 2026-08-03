import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import process from "node:process";
import test, { after, before } from "node:test";

import { createServer } from "vite";

const DATA_BASE_URL = "/app-data/finple-universe-v2-2026-07-24";
const DATA_REPO_ROOT = `public${DATA_BASE_URL}`;
const PRESETS = [
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
const POLICY_BLOCKED_IDENTITIES = new Set(["US:VNQ", "US:BLOK", "KR:069500"]);
const HORIZONS = [5, 10, 20];
const CONTRIBUTIONS = [0, 1_000_000];
const START_VALUE = 50_000_000;

let vite;
let modules;

function identity(asset = {}) {
  return `${String(asset.market || "").trim().toUpperCase()}:${String(asset.ticker || "").trim().toUpperCase()}`;
}

function settings(years, monthlyCashFlow) {
  return {
    startValue: START_VALUE,
    monthlyCashFlow,
    years,
    inflationRate: 2.5,
    dividendReinvest: true,
  };
}

async function localFetch(url) {
  const relative = String(url).split("?")[0].replace(DATA_BASE_URL, "").replace(/^\/+/, "");
  if (!relative || relative.split("/").includes("..")) return new Response(null, { status: 403 });
  try {
    return new Response(execFileSync("git", ["show", `HEAD:${DATA_REPO_ROOT}/${relative}`], {
      maxBuffer: 64 * 1024 * 1024,
    }), { status: 200 });
  } catch {
    return new Response(null, { status: 404 });
  }
}

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  const [constants, mbtiPage, mbtiStorage, catalog, production, baseline, step4, step5, adapter] = await Promise.all([
    vite.ssrLoadModule("/src/components/portfolio/constants.js"),
    vite.ssrLoadModule("/src/components/InvestmentMbtiPage.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/utils/mbtiProfileStorage.js"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/data/tickers/productionAppExportDataSource.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyBaselineEngine.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/appPreviewScenarioService.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/step5ProductionScenarioService.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/externalShockScenarioAdapter.js"),
  ]);
  await catalog.loadScreenerCandidateRuntime();
  modules = { constants, mbtiPage, mbtiStorage, production, baseline, step4, step5, adapter };
});

after(async () => {
  await vite?.close();
});

function fixtures() {
  const official = PRESETS.map((name) => ({
    sourceType: "official",
    name,
    assets: structuredClone(modules.constants[name]),
  }));
  const mbti = ["US", "KR"].flatMap((market) =>
    Object.entries(modules.mbtiStorage.MBTI_PRESET_MAP).map(([name, preset]) => ({
      sourceType: `MBTI-${market}`,
      name,
      assets: modules.mbtiPage.buildAssetsFromPreset(preset, START_VALUE, market),
    })),
  );
  return [...official, ...mbti];
}

function commonHistoryMonths(identities, monthlyReturns) {
  const common = identities.length === 0
    ? []
    : monthlyReturns.rowsByIdentity[identities[0]]
      .map((row) => row.month)
      .filter((month) => identities.every((item) =>
        monthlyReturns.rowsByIdentity[item].some((row) => row.month === month)
      ));
  return modules.step4.longestContiguousMonthSegment(common).length;
}

function step4State(fixture, scenarioSettings, monthlyReturns) {
  try {
    modules.step4.buildAppExportScenarioResult({
      activePortfolio: { id: fixture.name, name: fixture.name },
      assets: fixture.assets,
      settings: scenarioSettings,
      rowsByIdentity: monthlyReturns.rowsByIdentity,
      manifest: monthlyReturns.sourceManifest,
      release: monthlyReturns.release,
      runtimeMode: "production_app_export_ready",
      monthlyRowContract: monthlyReturns.monthlyRowContract,
      legacyProductionBindingVerified: monthlyReturns.legacyProductionBindingVerified,
      catalogPolicyByIdentity: monthlyReturns.catalogPolicyByIdentity,
      simulationCount: 10,
    });
    return { status: "ready", reason: "ready" };
  } catch (error) {
    return {
      status: "expected_blocked",
      reason: modules.step4.getAppExportScenarioErrorMessage(error),
      identity: error.identity,
      code: error.code,
    };
  }
}

test("official portfolios and MBTI Step 4/5 matrix distinguishes ready from expected policy blocks", async () => {
  const cases = fixtures();
  const identities = [...new Set(cases.flatMap((item) =>
    modules.step5.getStep5MonthlyArtifactIdentities(item.assets)
  ))].sort();
  const monthlyReturns = await modules.production.loadProductionMonthlyReturnsForIdentities(identities, {
    enabled: true,
    monthlyEnabled: true,
    baseUrl: DATA_BASE_URL,
    releaseManifestSha256: modules.production.PINNED_LEGACY_PRODUCTION_RELEASE_SHA256,
    sourceAppExportSha256: modules.production.PINNED_LEGACY_SOURCE_APP_EXPORT_SHA256,
    fetchImpl: localFetch,
  });
  assert.deepEqual(monthlyReturns.missingIdentities, []);

  const report = [];
  for (const fixture of cases) {
    const artifactIdentities = modules.step5.getStep5MonthlyArtifactIdentities(fixture.assets);
    const expectedBlocked = artifactIdentities.some((item) => POLICY_BLOCKED_IDENTITIES.has(item));
    const commonHistory = commonHistoryMonths(artifactIdentities, monthlyReturns);
    const step5ByHorizon = new Map();
    let firstStep3;
    let firstStep4;

    for (const years of HORIZONS) {
      for (const monthlyCashFlow of CONTRIBUTIONS) {
        const scenarioSettings = settings(years, monthlyCashFlow);
        const portfolio = { id: fixture.name, name: fixture.name, settings: scenarioSettings, assets: fixture.assets };
        const step3 = modules.baseline.buildStep3MonthlyBaselineDetail({
          portfolio,
          assets: fixture.assets,
          settings: scenarioSettings,
        });
        assert.equal(step3.status, "ready", `${fixture.sourceType}:${fixture.name}:Step3`);
        firstStep3 ||= step3.status;

        const step4 = step4State(fixture, scenarioSettings, monthlyReturns);
        assert.equal(step4.status, expectedBlocked ? "expected_blocked" : "ready", `${fixture.sourceType}:${fixture.name}:Step4`);
        if (expectedBlocked) {
          assert.ok(POLICY_BLOCKED_IDENTITIES.has(step4.identity), `${fixture.name}:${step4.identity}`);
          assert.match(step4.code, /monthly_return_proxy_status|proxy_monthly_return/);
        }
        firstStep4 ||= step4;

        const step5 = modules.step5.buildStep5ProductionScenarioState({
          activePortfolio: portfolio,
          assets: fixture.assets,
          settings: scenarioSettings,
          monthlyReturns,
          monthlyArtifactIdentityFingerprint: modules.step5.getStep5MonthlyArtifactIdentityFingerprint(fixture.assets),
        });
        assert.equal(step5.status, expectedBlocked ? "blocked" : "ready", `${fixture.sourceType}:${fixture.name}:Step5:${years}y`);
        if (expectedBlocked) {
          assert.match(step5.error, /monthly_return_proxy_status|proxy_monthly_return/);
          assert.doesNotMatch(step5.error, /insufficient_data/);
        } else {
          assert.deepEqual(step5.results.map((result) => result.status), ["ready", "ready"]);
          assert.equal(step5.result.pathReplayApplied, commonHistory < years * 12);
        }
        const state = expectedBlocked ? {
          moderate: "expected_blocked",
          severe: "expected_blocked",
          replay: false,
          reason: modules.adapter.formatExternalShockBlockReason(step5.error),
        } : {
          moderate: step5.results[0].status,
          severe: step5.results[1].status,
          replay: step5.result.pathReplayApplied,
          reason: "ready",
        };
        if (step5ByHorizon.has(years)) assert.deepEqual(step5ByHorizon.get(years), state);
        else step5ByHorizon.set(years, state);
      }
    }

    report.push({
      "source type": fixture.sourceType,
      "portfolio / MBTI": fixture.name,
      identities: artifactIdentities.join(","),
      "common history": commonHistory,
      "policy status": expectedBlocked ? "blocked" : "allowed",
      "Step 3": firstStep3,
      "Step 4": firstStep4.status,
      "Step 4 expected state/reason": firstStep4.reason,
      "Step 5 moderate": HORIZONS.map((years) => `${years}y:${step5ByHorizon.get(years).moderate}`).join(" "),
      "Step 5 severe": HORIZONS.map((years) => `${years}y:${step5ByHorizon.get(years).severe}`).join(" "),
      "replay applied": HORIZONS.map((years) => `${years}y:${step5ByHorizon.get(years).replay}`).join(" "),
      "Step 5 reason": step5ByHorizon.get(20).reason,
    });
  }

  assert.ok(report.some((row) => row["policy status"] === "allowed"));
  assert.ok(report.some((row) => row["policy status"] === "blocked"));
  assert.ok(cases.some((item) => item.assets.some((asset) => asset.ticker === "CASH")));
  assert.ok(cases.some((item) => item.assets.every((asset) => asset.ticker !== "CASH")));
  console.table(report);
});
