import assert from "node:assert/strict";
import fs from "node:fs";
import test, { after, before } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { createManualCashAsset } from "../src/data/tickers/manualCashAsset.js";
import {
  isProductionAppExportConfigured,
  isProductionMonthlyScenarioArtifactConfigured,
  loadProductionMonthlyReturnsForIdentities,
} from "../src/data/tickers/productionAppExportDataSource.js";
import {
  APP_EXPORT_SCENARIO_ERROR_CODES,
  buildAppExportScenarioResult,
} from "../src/components/portfolio/utils/appPreviewScenarioService.js";
import {
  getProbabilityPortfolioFingerprint,
} from "../src/components/portfolio/utils/probabilityScenarioAdapter.js";
import {
  formatUserFacingBaselineBlockReasons,
} from "../src/components/portfolio/utils/baselineBlockReasonLabels.js";
import { calculatePortfolioResult } from "../src/components/portfolio/utils/portfolioCalculations.js";
import { getStep4ScenarioAssets } from "../src/components/portfolio/utils/portfolioFormatters.js";
import {
  STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
  STEP114_2G_FIXTURE_REVIEW_ASSETS,
  STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
  STEP114_2G_FIXTURE_REVIEW_SETTINGS,
  STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
} from "../src/components/portfolio/fixtures/probabilityScenarioResultFixture.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hookSource = read("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const simulatorSource = read("../src/components/PortfolioSimulator.jsx");
const panelSource = read("../src/components/portfolio/components/ProbabilityAnalysisPanel.jsx");
const scenarioSource = read("../src/components/portfolio/utils/appPreviewScenarioService.js");
const fingerprintSource = read("../src/components/portfolio/utils/probabilityScenarioAdapter.js");
const productionSource = read("../src/data/tickers/productionAppExportDataSource.js");
const canonicalLoaderSource = read("../src/data/tickers/screenerCandidateLoader.js");
const canonicalCsvSource = read("../src/data/tickers/finple_app_candidates_v2.csv");

let vite;
let ProbabilityAnalysisPanel;

before(async () => {
  vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ProbabilityAnalysisPanel = (await vite.ssrLoadModule(
    "/src/components/portfolio/components/ProbabilityAnalysisPanel.jsx",
  )).default;
});

after(async () => {
  await vite?.close();
});

const manifest = {
  sourceCandidatePackageId: "finple-p3-test",
  sourceCandidatePackageHash: "a".repeat(64),
  normalizationVersion: "normalization-v1",
  calculationPolicyVersion: "metrics-calculation-policy-2026-06-26",
  metricDataThroughMonth: "2024-08",
};
const release = {
  contractVersion: "finple-production-app-export-release-v1-step114-2zc",
  universeVersion: "finple-universe-v2-2026-07-24",
  sourceAppExportSha256: "e".repeat(64),
  metricDataThroughMonth: "2026-06",
};
const settings = { startValue: 10_000, monthlyCashFlow: 0, years: 5, inflationRate: 0 };

function monthEnd(index) {
  const date = new Date(Date.UTC(2018, index + 1, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function qqqRows() {
  return rowsForTicker("QQQ");
}

function rowsForTicker(ticker) {
  return Array.from({ length: 80 }, (_, index) => ({
    market: "US",
    ticker,
    month: monthEnd(index),
    priceReturn: index % 2 === 0 ? 0.02 : -0.01,
    totalReturn: index % 2 === 0 ? 0.03 : 0,
    currency: "USD",
    dataStatus: "candidate",
    isProxy: false,
    proxyTicker: "",
  }));
}

function buildScenario(assets) {
  return buildAppExportScenarioResult({
    activePortfolio: { id: "p3", name: "P3" },
    assets,
    settings,
    rowsByIdentity: { "US:QQQ": qqqRows() },
    manifest,
    release,
    runtimeMode: "production_app_export_ready",
    simulationCount: 24,
  });
}

function clone(value) {
  return structuredClone(value);
}

function renderStep4({
  scenarioResult = STEP114_2G_PROBABILITY_FIXTURE_RESULT,
  scenarioLoadStatus = "ready",
  scenarioLoadError = "",
  currentSettings = STEP114_2G_FIXTURE_REVIEW_SETTINGS,
} = {}) {
  return renderToStaticMarkup(React.createElement(ProbabilityAnalysisPanel, {
    activePortfolio: STEP114_2G_FIXTURE_REVIEW_PORTFOLIO,
    assets: STEP114_2G_FIXTURE_REVIEW_ASSETS,
    settings: currentSettings,
    result: STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
    fixtureBaselineResult: STEP114_2G_PRECOMPUTED_BASELINE_FIXTURE,
    scenarioResult,
    scenarioLoadStatus,
    scenarioLoadError,
    expectedInputHash: STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
    expectedOutputHash: STEP114_2G_FIXTURE_EXPECTED_OUTPUT_HASH,
    enableFixtureReview: true,
  }));
}

test("one Step 4 asset helper owns shard, scenario, fingerprint, and display inputs", () => {
  const qqq = { market: "US", ticker: "QQQ", targetWeight: 100 };
  const bnd = { market: "US", ticker: "BND", targetWeight: 0 };
  const empty = { ticker: "", name: "", quantity: 0, price: 0, cagr: 0, beta: 0, mdd: 0, dividendYield: 0 };
  assert.deepEqual(getStep4ScenarioAssets([qqq, bnd, empty]), [qqq]);
  for (const source of [hookSource, scenarioSource, fingerprintSource, panelSource]) {
    assert.match(source, /getStep4ScenarioAssets/);
  }
  assert.equal(
    getProbabilityPortfolioFingerprint({ portfolioId: "p3", settings, assets: [qqq, bnd] }),
    getProbabilityPortfolioFingerprint({ portfolioId: "p3", settings, assets: [qqq] }),
  );
});

test("canonical v2 stays at 6,029 assets while monthly configuration is independent", () => {
  assert.equal(canonicalCsvSource.trim().split(/\r?\n/).length - 1, 6029);
  assert.match(canonicalLoaderSource, /canonical_v2_ready/);
  const monthlyOnly = {
    enabled: false,
    monthlyEnabled: true,
    baseUrl: "https://monthly.test",
    releaseManifestSha256: "a".repeat(64),
    sourceAppExportSha256: "b".repeat(64),
  };
  assert.equal(isProductionAppExportConfigured(monthlyOnly), false);
  assert.equal(isProductionMonthlyScenarioArtifactConfigured(monthlyOnly), true);
});

test("disabled or incomplete monthly configuration performs no network request", async () => {
  let fetchCount = 0;
  const result = await loadProductionMonthlyReturnsForIdentities(["US:QQQ"], {
    monthlyEnabled: true,
    baseUrl: "https://monthly.test",
    releaseManifestSha256: "",
    sourceAppExportSha256: "b".repeat(64),
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error("must not fetch");
    },
  });
  assert.equal(fetchCount, 0);
  assert.equal(result.enabled, false);
  assert.deepEqual(result.requestedShardPaths, []);
  assert.match(productionSource, /shardPromises/);
  assert.match(productionSource, /new Set\([\s\S]*requestedShardPaths/);
});

test("QQQ 100 plus BND 0 is identical to QQQ 100 and never enters result identities", () => {
  const qqqOnly = buildScenario([{ market: "US", ticker: "QQQ", targetWeight: 100 }]);
  const withZeroWeightBnd = buildScenario([
    { market: "US", ticker: "QQQ", targetWeight: 100 },
    { market: "US", ticker: "BND", targetWeight: 0 },
  ]);
  assert.equal(withZeroWeightBnd.status, "ready");
  assert.deepEqual(withZeroWeightBnd.productionAppExportContext.identities, ["US:QQQ"]);
  assert.deepEqual(withZeroWeightBnd.assets, qqqOnly.assets);
  assert.equal(withZeroWeightBnd.outputHash, qqqOnly.outputHash);
});

test("QQQ 90 plus manual CASH 10 preserves weights and reduces scenario MDD", () => {
  const qqqOnly = buildScenario([{ market: "US", ticker: "QQQ", targetWeight: 100 }]);
  const withCash = buildScenario([
    { market: "US", ticker: "QQQ", targetWeight: 90 },
    createManualCashAsset({ targetWeight: 10 }),
  ]);
  assert.deepEqual(withCash.productionAppExportContext.identities, ["US:QQQ"]);
  assert.deepEqual(withCash.scenarioAssetWeights, [
    { identity: "US:QQQ", targetWeight: 0.9 },
    { identity: "CASH:CASH", targetWeight: 0.1 },
  ]);
  assert.notEqual(withCash.outputHash, qqqOnly.outputHash);
  assert.ok(withCash.scenarioMdd.p50 > qqqOnly.scenarioMdd.p50);

  assert.throws(
    () => buildScenario([
      { market: "US", ticker: "QQQ", targetWeight: 90 },
      { market: "CASH", ticker: "CASH", targetWeight: 10, dataSource: "unknown" },
    ]),
    (error) => error.code === APP_EXPORT_SCENARIO_ERROR_CODES.IDENTITY_UNAVAILABLE,
  );
});

test("baseline blocks before the monthly loader and user copy is specific", () => {
  const gateIndex = hookSource.indexOf("if (step4BaselineBlockMessage)");
  const configIndex = hookSource.indexOf("isProductionMonthlyScenarioArtifactConfigured()", gateIndex);
  const loaderIndex = hookSource.indexOf("loadProductionMonthlyReturnsForIdentities", gateIndex);
  assert.ok(gateIndex >= 0 && gateIndex < configIndex && configIndex < loaderIndex);
  assert.deepEqual(
    formatUserFacingBaselineBlockReasons([
      "missing_ticker:asset-1",
      "duplicate_asset_identity:US:QQQ",
      "portfolio_add_denied:US:DENY",
      "invalid_target_weights:targetWeight values must sum to 100",
    ]),
    [
      "티커가 없는 미완성 자산 행이 있습니다. 행을 완성하거나 정리해 주세요.",
      "US:QQQ: 같은 자산이 중복되어 있습니다. 중복 행을 제거해 주세요.",
      "US:DENY: 포트폴리오에 사용할 수 없는 자산입니다.",
      "목표비중 합계를 100%로 맞춰 주세요.",
    ],
  );
});

test("Step 4 uses the displayed simulation start value for gate, scenario, and fingerprint", () => {
  const assets = [
    { market: "US", ticker: "QQQ", targetWeight: 60, targetEvaluationAmount: 24_000_000 },
    { market: "US", ticker: "SCHD", targetWeight: 40, targetEvaluationAmount: 16_000_000 },
  ];
  const rowsByIdentity = {
    "US:QQQ": rowsForTicker("QQQ"),
    "US:SCHD": rowsForTicker("SCHD"),
  };
  const buildWithStartValue = (rawStartValue) => {
    const rawSettings = { ...settings, startValue: rawStartValue };
    const baseline = calculatePortfolioResult(rawSettings, assets);
    const effectiveSettings = { ...rawSettings, startValue: baseline.simulationStartValue };
    const scenario = buildAppExportScenarioResult({
      activePortfolio: { id: "p3-start-value", name: "P3 start value" },
      assets,
      settings: effectiveSettings,
      rowsByIdentity,
      manifest,
      release,
      runtimeMode: "production_app_export_ready",
      simulationCount: 24,
    });
    const fingerprint = JSON.parse(getProbabilityPortfolioFingerprint({
      portfolioId: "p3-start-value",
      settings: effectiveSettings,
      assets,
    }));
    return { baseline, scenario, fingerprint };
  };

  const fallback = buildWithStartValue(0);
  assert.equal(fallback.baseline.simulationStartValue, 40_000_000);
  assert.equal(fallback.scenario.monthlyBands[0].p50Nominal, 40_000_000);
  assert.equal(fallback.fingerprint.settings.startValue, 40_000_000);

  const explicit = buildWithStartValue(50_000_000);
  assert.equal(explicit.baseline.simulationStartValue, 50_000_000);
  assert.equal(explicit.scenario.monthlyBands[0].p50Nominal, 50_000_000);
  assert.equal(explicit.fingerprint.settings.startValue, 50_000_000);

  const zeroBaseline = calculatePortfolioResult(
    { ...settings, startValue: 0 },
    assets.map((asset) => ({ ...asset, targetEvaluationAmount: 0 })),
  );
  assert.equal(zeroBaseline.simulationStartValue, 0);
  assert.notEqual(zeroBaseline.status, "ready");
  assert.match(hookSource, /Number\(effectiveStep4Settings\.startValue\) > 0/);
  assert.ok(
    hookSource.indexOf("if (step4BaselineBlockMessage)") <
      hookSource.indexOf("loadProductionMonthlyReturnsForIdentities", hookSource.indexOf("if (step4BaselineBlockMessage)")),
  );
  assert.match(hookSource, /settings: effectiveStep4Settings/);
  assert.match(hookSource, /return \{ portfolioList,[^\n]+effectiveStep4Settings/);
  assert.match(simulatorSource, /<ProbabilityAnalysisPanel[\s\S]*settings=\{effectiveStep4Settings\}/);
});

test("runtime changes cancel the previous Step 4 request and recalculate automatically", () => {
  assert.match(hookSource, /return \(\) => \{\s*cancelled = true;\s*\};/);
  assert.match(hookSource, /\[\s*activePortfolio,[\s\S]*assets,[\s\S]*effectiveStep4Settings,[\s\S]*step4BaselineBlockMessage,[\s\S]*\]/);
});

test("cash-only and monthly load statuses replace idle and precomputed UI copy", () => {
  for (const text of [
    "현금성 자산 단독 포트폴리오입니다.",
    "연 2.0% 내부 기준수익률이 적용되는 확정 경로이므로",
    "확률 밴드 대신 Step 3 기준전망을 확인해 주세요.",
    "월간 데이터 연결 필요",
    "검증된 월간 수익률 데이터가 연결되지 않았습니다.",
    "월간 데이터 확인 중",
    "분석 준비 완료",
    "검증된 월간 데이터",
    "월간 데이터 부족",
  ]) assert.match(panelSource, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(panelSource, /precomputed 연결 대기|production data|verified 6,029 app export|>IDLE</i);
  assert.match(panelSource, /scenarioLoadStatus === "ready" && !isReady/);
  assert.match(hookSource, /scenarioAssets\.every\(isManualCashAsset\)/);
  assert.match(hookSource, /status: "cash_only"/);
});

test("Step 4 SSR gives non-ready view-model states priority over loader ready", () => {
  const insufficient = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  insufficient.status = "insufficient_data";
  insufficient.monthlyBands = [];
  insufficient.terminalValue = null;
  insufficient.dataQuality = { status: "insufficient_data", blockReasons: ["insufficient_common_history"] };
  const insufficientHtml = renderStep4({ scenarioResult: insufficient });
  assert.match(insufficientHtml, /월간 데이터 기간 부족/);
  assert.match(insufficientHtml, /확률 밴드를 만들 만큼 공통 월별 이력이 충분하지 않습니다/);
  assert.doesNotMatch(insufficientHtml, /분석 준비 완료/);

  assert.equal((insufficientHtml.match(/class="probabilityStatusPanel/g) || []).length, 1);

  const blocked = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  blocked.status = "blocked";
  blocked.monthlyBands = [];
  blocked.terminalValue = null;
  blocked.dataQuality = { status: "blocked", blockReasons: ["fixture_gate_blocked"] };
  const blockedHtml = renderStep4({ scenarioResult: blocked });
  assert.match(blockedHtml, /확률분석 보류/);
  assert.doesNotMatch(blockedHtml, /검증된 월간 데이터/);

  const staleHtml = renderStep4({
    currentSettings: { ...STEP114_2G_FIXTURE_REVIEW_SETTINGS, monthlyCashFlow: 600_000 },
  });
  assert.match(staleHtml, /결과 재계산 필요/);
  assert.match(staleHtml, /현재 포트폴리오 또는 설정과 기존 결과가 일치하지 않습니다/);

  const error = clone(STEP114_2G_PROBABILITY_FIXTURE_RESULT);
  error.status = "error";
  error.monthlyBands = [];
  const errorHtml = renderStep4({ scenarioResult: error });
  assert.match(errorHtml, /확률분석 오류/);
  assert.doesNotMatch(errorHtml, /분석 준비 완료/);

  const readyHtml = renderStep4();
  assert.match(readyHtml, /분석 준비 완료/);
  assert.match(readyHtml, /검증된 월간 데이터/);
});

test("Step 4 SSR keeps one loader-state panel for unconfigured, cash-only, and baseline blocked", () => {
  for (const fixture of [
    { scenarioLoadStatus: "unconfigured", expected: "월간 데이터 연결 필요" },
    { scenarioLoadStatus: "cash_only", expected: "현금성 자산 단독 포트폴리오입니다." },
    { scenarioLoadStatus: "blocked", scenarioLoadError: "구체적인 baseline 보류 사유", expected: "구체적인 baseline 보류 사유" },
  ]) {
    const html = renderStep4({ ...fixture, scenarioResult: null });
    assert.match(html, new RegExp(fixture.expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal((html.match(/class="probabilityStatusPanel/g) || []).length, 1);
  }
});
