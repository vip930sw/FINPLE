import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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
import { getStep4ScenarioAssets } from "../src/components/portfolio/utils/portfolioFormatters.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const hookSource = read("../src/components/portfolio/hooks/usePortfolioSimulator.js");
const panelSource = read("../src/components/portfolio/components/ProbabilityAnalysisPanel.jsx");
const scenarioSource = read("../src/components/portfolio/utils/appPreviewScenarioService.js");
const fingerprintSource = read("../src/components/portfolio/utils/probabilityScenarioAdapter.js");
const productionSource = read("../src/data/tickers/productionAppExportDataSource.js");
const canonicalLoaderSource = read("../src/data/tickers/screenerCandidateLoader.js");
const canonicalCsvSource = read("../src/data/tickers/finple_app_candidates_v2.csv");

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
  return Array.from({ length: 80 }, (_, index) => ({
    market: "US",
    ticker: "QQQ",
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
