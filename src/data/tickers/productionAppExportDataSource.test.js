/* global process */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

import { sha256Hex } from "../../utils/sha256.js";
import {
  buildMonthlyBaselineProjection,
  buildStep2MonthlyBaselineComparison,
  buildStep3MonthlyBaselineDetail,
} from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import {
  createInsightComparisonPortfolios,
  createRankedComparisonPortfolios,
  getChartComparisonPortfolios,
} from "../../components/portfolio/utils/portfolioCalculations.js";
import {
  LEGACY_MONTHLY_ROW_ENCODING_V1,
  MONTHLY_ROW_CONTRACT_LEGACY_V1,
  MONTHLY_ROW_CONTRACT_PROXY_AWARE_V2,
  PINNED_LEGACY_ARTIFACT_BINDING_SHA256,
  PINNED_LEGACY_PRODUCTION_RELEASE_SHA256,
  PINNED_LEGACY_SOURCE_APP_EXPORT_SHA256,
  PRODUCTION_CANDIDATE_PACKAGE_HASH,
  PRODUCTION_CANDIDATE_ZIP_SHA256,
  PRODUCTION_EXPORT_VERSION,
  PRODUCTION_RELEASE_CONTRACT_VERSION,
  PRODUCTION_SOURCE_GIT_MAIN_SHA,
  PRODUCTION_UNIVERSE_VERSION,
  assertProductionReleaseManifest,
  buildProductionCatalogPolicyByIdentity,
  decodeProductionMonthlySeries,
  getProductionAppExportRequestLog,
  isProductionAppExportConfigured,
  isProductionMonthlyScenarioArtifactConfigured,
  loadProductionAppExportCatalog,
  loadProductionMonthlyReturnsForIdentities,
  isPinnedLegacyProductionBinding,
  resetProductionAppExportDataSourceForTests,
} from "./productionAppExportDataSource.js";

const BASE_URL = "https://production-app-export.test/app-data/finple-universe-v2-2026-07-24";
const SOURCE_APP_EXPORT_SHA256 = "e".repeat(64);
const encoder = new TextEncoder();

function canonicalIdentities() {
  return [
    "US:QQQ",
    "US:TQQQ",
    "US:AIPI",
    "US:SPY",
    ...Array.from({ length: 3025 }, (_, index) =>
      `US:FIX${String(index).padStart(4, "0")}`),
    ...Array.from({ length: 3000 }, (_, index) =>
      `KR:${String(index).padStart(6, "0")}`),
  ];
}

function runtimeCandidateSignature(candidate) {
  return {
    identity: `${candidate.market}:${candidate.ticker}`,
    expectedCagr: candidate.expectedCagr,
    rawPriceCagr: candidate.rawPriceCagr,
    rollingCagrMedian: candidate.rollingCagrMedian,
    beta: candidate.beta,
    mdd: candidate.mdd,
    dividendYield: candidate.dividendYield,
    cashDistributionYieldTtm: candidate.cashDistributionYieldTtm,
    distributionType: candidate.distributionType,
    portfolioEligible: candidate.portfolioEligible,
    portfolioAddPolicy: candidate.portfolioAddPolicy,
    leverageMultiple: candidate.leverageMultiple,
    direction: candidate.direction,
    resetFrequency: candidate.resetFrequency,
    dataSource: candidate.dataSource,
  };
}

function jsonBytes(value) {
  return encoder.encode(`${JSON.stringify(value)}\n`);
}

function fileRecord(path, bytes) {
  return {
    path,
    sha256: sha256Hex(bytes),
    sizeBytes: bytes.byteLength,
  };
}

function distribute(total, buckets) {
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from(
    { length: buckets },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function makeFixture({
  legacyLineage = false,
  overlayRowOverrides = {},
} = {}) {
  const identities = canonicalIdentities();
  const rows = identities.map((identity) => {
    const [market, ticker] = identity.split(":");
    return {
      identity,
      market,
      ticker,
      selectedCagr: 8,
      rawPriceCagr10y: 8,
      rollingCagr10yMedian: 8,
      rollingCagr10yP25: 7,
      rollingCagr10yP75: 9,
      validRollingWindowCount10y: 24,
      cagrPolicy: "rolling_10y_median",
      selectedMdd: -20,
      mddPolicy: "full_period_actual",
      selectedBeta: 1,
      betaPolicy: "aligned_monthly_return_beta",
      dividendYield: null,
      dividendStatus: "missing",
      dataStatus: "ready",
      reviewFlag: "none",
      reviewReason: "",
      rawPriceCoverageStatus: "covered",
      metricBaseDate: "2026-07-24",
      internalPreviewReviewOnly: true,
      productionPublishReady: false,
      appExportApproved: false,
      ...(overlayRowOverrides[identity] || {}),
    };
  });
  const overlay = {
    exportVersion: PRODUCTION_EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    rows,
  };
  const overlayBytes = jsonBytes(overlay);
  const monthlyIdentities = [
    "US:QQQ",
    ...identities.filter((identity) => identity !== "US:QQQ").slice(0, 5346),
  ];
  const assetCounts = distribute(5347, 64);
  const rowCounts = distribute(701485, 64);
  const files = new Map();
  const shardInventory = Array.from({ length: 64 }, (_, index) => {
    const shardId = index.toString(16).padStart(2, "0");
    const path = `monthly-returns/monthly-returns-${shardId}.json`;
    const series = index === 0
      ? {
          "US:QQQ": [
            ["2020-01", 0.01, null, null, "USD", "US:SPY", "ready", false, ""]
              .slice(0, legacyLineage ? 7 : 9),
            ["2020-02", -0.02, null, null, "USD", "US:SPY", "ready", false, ""]
              .slice(0, legacyLineage ? 7 : 9),
          ],
        }
      : {};
    const bytes = jsonBytes({
      exportVersion: PRODUCTION_EXPORT_VERSION,
      shardId,
      series,
    });
    files.set(`${BASE_URL}/${path}`, bytes);
    return {
      shardId,
      path,
      assetCount: assetCounts[index],
      rowCount: rowCounts[index],
      sha256: sha256Hex(bytes),
      sizeBytes: bytes.byteLength,
    };
  });
  const assets = Object.fromEntries(monthlyIdentities.map((identity, index) => {
    const record = shardInventory[index % shardInventory.length];
    return [identity, {
      market: identity.split(":")[0],
      ticker: identity.split(":")[1],
      shard: identity === "US:QQQ" ? shardInventory[0].path : record.path,
      rowCount: identity === "US:QQQ" ? 2 : 0,
    }];
  }));
  const index = {
    exportVersion: PRODUCTION_EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    assetCount: 5347,
    rowCount: 701485,
    rowEncoding: legacyLineage
      ? [...LEGACY_MONTHLY_ROW_ENCODING_V1]
      : [
          "month",
          "priceReturn",
          "totalReturn",
          "fxReturn",
          "currency",
          "benchmarkId",
          "dataStatus",
          "isProxy",
          "proxyTicker",
        ],
    assets,
    shards: shardInventory,
  };
  const indexBytes = jsonBytes(index);
  const metricsOverlay = fileRecord("metrics-overlay.json", overlayBytes);
  const monthlyReturnsIndex = fileRecord("monthly-returns-index.json", indexBytes);
  const sourceManifest = {
    exportVersion: PRODUCTION_EXPORT_VERSION,
    sourceCandidatePackageHash: PRODUCTION_CANDIDATE_PACKAGE_HASH,
    metricBaseDate: "2026-07-24",
    metricDataThroughMonth: "2026-06",
    normalizationVersion: "timeseries-normalization-v2-step114-2za-dividend",
    calculationPolicyVersion: "metrics-calculation-policy-2026-06-26",
    pipelineVersion: "metrics-v3.0-step114-2d",
    candidatePackageReady: true,
    packageGlobalBlockingIssueCount: 0,
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    assetCount: 6029,
    marketAssetCounts: { KR: 3000, US: 3029 },
    rawMissingAssetCount: 16,
    monthlyReturnAssetCount: 5347,
    monthlyReturnRowCount: 701485,
    shardCount: 64,
    shardInventory,
    metricsOverlay,
    monthlyReturnsIndex,
  };
  const sourceBytes = jsonBytes(sourceManifest);
  const sourceManifestRecord = fileRecord("app-preview-manifest.json", sourceBytes);
  const release = {
    schemaVersion: 1,
    contractVersion: PRODUCTION_RELEASE_CONTRACT_VERSION,
    universeVersion: PRODUCTION_UNIVERSE_VERSION,
    candidateZipSha256: PRODUCTION_CANDIDATE_ZIP_SHA256,
    candidatePackageHash: PRODUCTION_CANDIDATE_PACKAGE_HASH,
    sourceAppExportSha256: SOURCE_APP_EXPORT_SHA256,
    sourceManifest: sourceManifestRecord,
    assetCount: 6029,
    marketAssetCounts: { KR: 3000, US: 3029 },
    priceCoveredAssetCount: 6013,
    monthlyReturnAssetCount: 5347,
    monthlyReturnRowCount: 701485,
    metricDataThroughMonth: "2026-06",
    metricsOverlay,
    monthlyReturnsIndex,
    shardCount: 64,
    shardInventory,
    productionPublishReady: true,
    appExportApproved: true,
    approvedAt: "2026-07-26T00:00:00Z",
    approvedBy: "release-approver-fixture",
    sourceGitMainSha: PRODUCTION_SOURCE_GIT_MAIN_SHA,
  };
  const releaseBytes = jsonBytes(release);
  files.set(`${BASE_URL}/production-app-export-release.json`, releaseBytes);
  files.set(`${BASE_URL}/app-preview-manifest.json`, sourceBytes);
  files.set(`${BASE_URL}/metrics-overlay.json`, overlayBytes);
  files.set(`${BASE_URL}/monthly-returns-index.json`, indexBytes);
  return {
    files,
    release,
    releaseBytes,
    sourceManifest,
    overlay,
  };
}

function createFetch(files, requestCounts = new Map()) {
  return async (url) => {
    requestCounts.set(url, (requestCounts.get(url) || 0) + 1);
    const bytes = files.get(url);
    return new Response(bytes || "missing", { status: bytes ? 200 : 404 });
  };
}

function options(fixture, overrides = {}) {
  return {
    enabled: true,
    baseUrl: BASE_URL,
    manifestName: "production-app-export-release.json",
    releaseManifestSha256: sha256Hex(fixture.releaseBytes),
    sourceAppExportSha256: SOURCE_APP_EXPORT_SHA256,
    fetchImpl: createFetch(fixture.files),
    disableCache: true,
    ...overrides,
  };
}

test("exact production release and source review manifest are mutually non-substitutable", () => {
  const fixture = makeFixture();
  assert.equal(assertProductionReleaseManifest(fixture.release), fixture.release);
  assert.throws(
    () => assertProductionReleaseManifest(fixture.sourceManifest),
    /exact contract/,
  );
  for (const [field, value] of [
    ["candidateZipSha256", "0".repeat(64)],
    ["sourceAppExportSha256", "not-a-hash"],
    ["assetCount", 6028],
  ]) {
    const malformed = { ...fixture.release, [field]: value };
    assert.throws(() => assertProductionReleaseManifest(malformed));
  }
});

test("pinned legacy Production identity requires every release and artifact binding", () => {
  const exact = {
    releaseManifestSha256: PINNED_LEGACY_PRODUCTION_RELEASE_SHA256,
    sourceAppExportSha256: PINNED_LEGACY_SOURCE_APP_EXPORT_SHA256,
    contractVersion: PRODUCTION_RELEASE_CONTRACT_VERSION,
    sourceGitMainSha: PRODUCTION_SOURCE_GIT_MAIN_SHA,
    candidateZipSha256: PRODUCTION_CANDIDATE_ZIP_SHA256,
    candidatePackageHash: PRODUCTION_CANDIDATE_PACKAGE_HASH,
    artifactBindingSha256: PINNED_LEGACY_ARTIFACT_BINDING_SHA256,
  };
  assert.equal(isPinnedLegacyProductionBinding(exact), true);
  for (const field of Object.keys(exact)) {
    assert.equal(
      isPinnedLegacyProductionBinding({ ...exact, [field]: "0".repeat(64) }),
      false,
      field,
    );
  }
});

test("legacy rows decode as unproven without inventing non-proxy defaults", () => {
  const rows = decodeProductionMonthlySeries(
    "US:QQQ",
    [["2020-01", 0.01, null, null, "USD", "US:SPY", "ready"]],
    LEGACY_MONTHLY_ROW_ENCODING_V1,
    MONTHLY_ROW_CONTRACT_LEGACY_V1,
  );
  assert.equal(rows[0].isProxy, null);
  assert.equal(rows[0].proxyTicker, null);
  assert.equal(rows[0].proxyLineageStatus, "legacy_unproven");
});

test("production catalog validates its pinned release and monthly bindings", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const catalog = await loadProductionAppExportCatalog(options(fixture));
  assert.equal(catalog.status, "production_app_export_ready");
  assert.equal(catalog.overlay.rows.length, 6029);
  assert.equal(Object.keys(catalog.index.assets).length, 5347);
  assert.equal(catalog.release.monthlyReturnRowCount, 701485);
  assert.equal(catalog.monthlyRowContract, MONTHLY_ROW_CONTRACT_PROXY_AWARE_V2);
  assert.equal(Object.keys(catalog.catalogPolicyByIdentity).length, 6029);
  assert.equal(
    catalog.catalogPolicyByIdentity["US:QQQ"].ordinaryLegacyEligible,
    true,
  );
  assert.equal(Object.isFrozen(catalog.catalogPolicyByIdentity), true);
  assert.equal(Object.isFrozen(catalog.catalogPolicyByIdentity["US:QQQ"]), true);
  assert.equal(catalog.overlay.rows[0].selectedCagr, 8);
});

test("verified overlay identity policy owns pinned legacy eligibility", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture({
    overlayRowOverrides: {
      "US:TQQQ": {
        reviewFlag: "review_required",
        reviewApprovalPolicyVersion:
          "leveraged-inverse-review-policy-v1-step114",
      },
      "US:AIPI": {
        dataStatus: "insufficient_history",
        reviewFlag: "review_required",
        exposureType: "single_stock_option_income",
      },
      "US:SPY": {
        reviewApprovalPolicyVersion: false,
      },
    },
  });
  const catalog = await loadProductionAppExportCatalog(options(fixture));
  assert.equal(
    catalog.catalogPolicyByIdentity["US:QQQ"].ordinaryLegacyEligible,
    true,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:TQQQ"].ordinaryLegacyEligible,
    false,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:TQQQ"].reviewFlag,
    "review_required",
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:AIPI"].ordinaryDistribution,
    false,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:AIPI"].ordinaryLegacyEligible,
    false,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:SPY"].policyEvidenceValid,
    false,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:SPY"].ordinaryLegacyEligible,
    false,
  );
  assert.equal(
    catalog.catalogPolicyByIdentity["US:NOT-IN-CATALOG"],
    undefined,
  );

  const rebuilt = buildProductionCatalogPolicyByIdentity(fixture.overlay);
  assert.deepEqual(rebuilt, catalog.catalogPolicyByIdentity);
});

test("an arbitrary seven-field Production artifact is rejected", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture({ legacyLineage: true });
  await assert.rejects(
    loadProductionAppExportCatalog(options(fixture)),
    /row encoding is not approved/,
  );
});

test("wrong release or source app-export hash and overlay mismatch fail closed", async () => {
  for (const scenario of ["release", "source", "overlay"]) {
    resetProductionAppExportDataSourceForTests();
    const fixture = makeFixture();
    const override = {};
    if (scenario === "release") override.releaseManifestSha256 = "0".repeat(64);
    if (scenario === "source") override.sourceAppExportSha256 = "0".repeat(64);
    if (scenario === "overlay") {
      fixture.overlay.rows.pop();
      fixture.files.set(`${BASE_URL}/metrics-overlay.json`, jsonBytes(fixture.overlay));
    }
    await assert.rejects(
      loadProductionAppExportCatalog(options(fixture, override)),
      /mismatch|SHA-256|row count/,
    );
  }
});

test("missing and extra shards are rejected by the exact release contract", () => {
  const fixture = makeFixture();
  for (const shards of [
    fixture.release.shardInventory.slice(1),
    [...fixture.release.shardInventory, fixture.release.shardInventory[0]],
  ]) {
    assert.throws(() => assertProductionReleaseManifest({
      ...fixture.release,
      shardInventory: shards,
    }), /shard inventory/);
  }
});

test("production monthly loader lazy-loads one shard and deduplicates concurrent requests", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const requestCounts = new Map();
  const shared = options(fixture, {
    fetchImpl: createFetch(fixture.files, requestCounts),
    disableCache: false,
  });
  const [first, second] = await Promise.all([
    loadProductionMonthlyReturnsForIdentities(["US:QQQ"], shared),
    loadProductionMonthlyReturnsForIdentities(["US:QQQ"], shared),
  ]);
  assert.deepEqual(first.requestedShardPaths, ["monthly-returns/monthly-returns-00.json"]);
  assert.equal(first.rowsByIdentity["US:QQQ"].length, 2);
  assert.equal(first.rowsByIdentity["US:QQQ"][0].isProxy, false);
  assert.equal(first.rowsByIdentity["US:QQQ"][0].proxyTicker, "");
  assert.equal(first.rowsByIdentity["US:QQQ"][0].proxyLineageStatus, "non_proxy_proven");
  assert.equal(
    first.catalogPolicyByIdentity["US:QQQ"].ordinaryLegacyEligible,
    true,
  );
  assert.equal(Object.keys(first.catalogPolicyByIdentity).length, 6029);
  assert.deepEqual(second.rowsByIdentity, first.rowsByIdentity);
  assert.equal(
    requestCounts.get(`${BASE_URL}/monthly-returns/monthly-returns-00.json`),
    1,
  );
  assert.equal(getProductionAppExportRequestLog().filter(
    (url) => url.includes("monthly-returns-00.json"),
  ).length, 1);
});

test("monthly artifacts can be configured without replacing the canonical catalog", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const monthlyOnly = options(fixture, { enabled: false, monthlyEnabled: true });
  assert.equal(isProductionAppExportConfigured(monthlyOnly), false);
  assert.equal(isProductionMonthlyScenarioArtifactConfigured(monthlyOnly), true);

  const result = await loadProductionMonthlyReturnsForIdentities(["US:QQQ"], monthlyOnly);
  assert.equal(result.enabled, true);
  assert.equal(result.rowsByIdentity["US:QQQ"].length, 2);
});

test("monthly artifacts stay unavailable without every verified runtime binding", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const incomplete = options(fixture, {
    enabled: false,
    monthlyEnabled: true,
    releaseManifestSha256: "",
  });
  assert.equal(isProductionMonthlyScenarioArtifactConfigured(incomplete), false);

  const result = await loadProductionMonthlyReturnsForIdentities(["US:QQQ"], incomplete);
  assert.equal(result.enabled, false);
  assert.deepEqual(result.missingIdentities, ["US:QQQ"]);
  assert.equal(getProductionAppExportRequestLog().length, 0);
});

test("missing monthly identity is unavailable without zero fill or proxy requests", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const result = await loadProductionMonthlyReturnsForIdentities(
    ["US:NOT-IN-INDEX"],
    options(fixture),
  );
  assert.deepEqual(result.missingIdentities, ["US:NOT-IN-INDEX"]);
  assert.deepEqual(result.rowsByIdentity, {});
  assert.deepEqual(result.requestedShardPaths, []);
});

test("build-time configured monthly artifacts keep the canonical catalog available while loading", async () => {
  const envKey = "VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED";
  const previous = process.env[envKey];
  process.env[envKey] = "true";
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const loader = await vite.ssrLoadModule(
      "/src/data/tickers/screenerCandidateLoader.js?configured-initial-state",
    );
    const snapshot = loader.getScreenerCandidateSnapshot();
    assert.equal(snapshot.preview.status, "production_app_export_loading");
    assert.equal(snapshot.preview.enabled, true);
    assert.ok(snapshot.candidates.length > 0);
    assert.equal(
      snapshot.candidates.length,
      snapshot.usCandidates.length + snapshot.krCandidates.length,
    );
  } finally {
    await vite.close();
    if (previous === undefined) delete process.env[envKey];
    else process.env[envKey] = previous;
  }
});

test("production monthly artifacts never hydrate canonical metrics and failures stay scenario-local", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const fixture = makeFixture();
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const portfolioFactory = await vite.ssrLoadModule(
      "/src/components/portfolio/utils/portfolioFactory.js",
    );
    const unconfigured = loader.getScreenerCandidateSnapshot();
    const canonicalSignatures = unconfigured.candidates.map(runtimeCandidateSignature);
    assert.equal(unconfigured.preview.status, "canonical_v2_ready");
    assert.equal(unconfigured.preview.operationalReasonCode, "");
    assert.equal(unconfigured.candidates.length, loader.ALL_SCREENER_CANDIDATES.length);

    const transitions = [];
    const unsubscribe = loader.subscribeScreenerCandidateSnapshot((nextSnapshot) => {
      transitions.push({
        status: nextSnapshot.preview.status,
        candidateCount: nextSnapshot.candidates.length,
      });
    });
    const productionOptions = options(fixture);
    const firstLoad = loader.loadScreenerProductionAppExport(productionOptions);
    const duplicateLoad = loader.loadScreenerProductionAppExport(productionOptions);
    const loading = loader.getScreenerCandidateSnapshot();
    assert.equal(loading.preview.status, "production_app_export_loading");
    assert.equal(loading.candidates.length, unconfigured.candidates.length);
    assert.deepEqual(loading.candidates.map(runtimeCandidateSignature), canonicalSignatures);
    const [snapshot, duplicateSnapshot] = await Promise.all([firstLoad, duplicateLoad]);
    unsubscribe();
    assert.deepEqual(duplicateSnapshot, snapshot);
    assert.equal(snapshot.preview.status, "production_app_export_ready");
    assert.deepEqual(snapshot.candidates.map(runtimeCandidateSignature), canonicalSignatures);
    assert.deepEqual(transitions, [
      {
        status: "production_app_export_loading",
        candidateCount: unconfigured.candidates.length,
      },
      {
        status: "production_app_export_ready",
        candidateCount: unconfigured.candidates.length,
      },
    ]);
    const ordinaryCandidates = snapshot.candidates.filter(
      (candidate) =>
        candidate.portfolioAddPolicy === "allow" &&
        candidate.priceMetricsStatus === "ready" &&
        Number.isFinite(candidate.expectedCagr) &&
        Number.isFinite(candidate.dividendYield),
    ).slice(0, 5);
    const distributionCandidate = snapshot.candidates.find(
      (candidate) =>
        candidate.portfolioAddPolicy === "allow" &&
        candidate.priceMetricsStatus === "ready" &&
        candidate.dividendYield === null &&
        Number.isFinite(candidate.cashDistributionYieldTtm) &&
        candidate.cashDistributionYieldTtm <= 100 &&
        candidate.simulationCashYield === candidate.cashDistributionYieldTtm &&
        candidate.distributionSimulationPolicy === "repeat_ttm_distribution",
    );
    assert.equal(ordinaryCandidates.length, 5);
    assert.ok(distributionCandidate);
    const expectations = new Map(
      [...ordinaryCandidates, distributionCandidate].map((candidate) => [
        candidate.ticker,
        {
          market: candidate.market,
          cagr: candidate.expectedCagr,
          dividendYield: candidate.dividendYield,
          distributionYield: candidate.dividendYield === null
            ? candidate.cashDistributionYieldTtm
            : undefined,
        },
      ]),
    );
    const savedAssets = new Map();
    for (const [ticker, expected] of expectations) {
      const candidate = loader.findScreenerCandidateByTicker(ticker, expected.market);
      assert.ok(candidate, ticker);
      assert.equal(candidate.expectedCagr, expected.cagr, ticker);
      const hydrated = loader.hydrateAssetFromScreenerCandidate({
        ticker,
        market: expected.market,
        quantity: 1,
        price: 100,
        targetWeight: 100,
      });
      const parsed = JSON.parse(JSON.stringify(hydrated));
      const saved = portfolioFactory.normalizeAsset(
        { ...parsed, ...normalizePersistedMetricFields(parsed) },
        savedAssets.size,
      );
      savedAssets.set(ticker, saved);
      assert.equal(saved.quantity, 1, ticker);
      assert.equal(saved.price, 100, ticker);
      assert.equal(saved.targetWeight, 100, ticker);
      assert.equal(saved.productionAppExportEnabled, false, ticker);
      assert.equal(saved.productionPublishReady, false, ticker);
      assert.equal(saved.appExportApproved, false, ticker);
      assert.equal(saved.dataSource, "finple_app_candidates_v2", ticker);
      assert.equal(saved.sourceHash, "", ticker);
      assert.equal(saved.rawSourceSha256, "", ticker);
      assert.equal(saved.normalizedSeriesHash, "", ticker);
      if (expected.distributionYield !== undefined) {
        assert.equal(saved.dividendYield, null, ticker);
        assert.equal(saved.trailingDistributionYield, expected.distributionYield, ticker);
        assert.equal(
          saved.distributionCalculationStatus,
          "confirmed_value",
          ticker,
        );
        const result = buildMonthlyBaselineProjection({
          settings: {
            startValue: 100,
            monthlyCashFlow: 0,
            years: 1,
            inflationRate: 0,
            dividendReinvest: true,
          },
          assets: [saved],
        });
        assert.equal(result.status, expected.resultStatus || "ready", ticker);
        if (expected.resultStatus === "blocked") {
          assert.match(
            result.blockReasons.join("|"),
            new RegExp(`portfolio_add_denied:${ticker}`),
            ticker,
          );
          continue;
        }
        assert.equal(
          result.assets[0].annualDividendYield,
          expected.distributionYield,
          ticker,
        );
      } else if (expected.dividendYield !== undefined) {
        assert.equal(saved.dividendYield, expected.dividendYield, ticker);
        assert.equal(saved.displayDividendYield, `${expected.dividendYield.toFixed(2)}%`, ticker);
      }
      if (expected.distributionYield === undefined) {
        const ordinaryBaseline = buildMonthlyBaselineProjection({
          settings: {
            startValue: 100,
            monthlyCashFlow: 0,
            years: 1,
            inflationRate: 0,
            dividendReinvest: true,
          },
          assets: [saved],
        });
        assert.equal(ordinaryBaseline.status, "ready", ticker);
        assert.equal(ordinaryBaseline.assets[0].annualPriceCagr, expected.cagr, ticker);
      }
    }

    const ordinaryMixedAssets = ordinaryCandidates.map((candidate) => ({
      ...savedAssets.get(candidate.ticker),
      targetWeight: 20,
    }));
    const baselineSettings = {
      startValue: 500,
      monthlyCashFlow: 10,
      years: 1,
      inflationRate: 2,
      dividendReinvest: true,
    };
    const mixedBaseline = buildMonthlyBaselineProjection({
      settings: baselineSettings,
      assets: ordinaryMixedAssets,
    });
    assert.equal(
      mixedBaseline.status,
      "ready",
      mixedBaseline.blockReasons.join("|"),
    );
    assert.equal(
      savedAssets.get(ordinaryCandidates[0].ticker).selectedCagr,
      ordinaryCandidates[0].expectedCagr,
    );

    const comparison = buildStep2MonthlyBaselineComparison({
      portfolios: [{
        id: "production-ordinary",
        name: "Production ordinary",
        assets: ordinaryMixedAssets,
      }],
      activePortfolioId: "production-ordinary",
      assets: ordinaryMixedAssets,
      settings: baselineSettings,
    });
    assert.equal(comparison.length, 1);
    assert.equal(comparison[0].result.status, "ready");
    assert.ok(comparison[0].result.monthlyBaselinePoints.length > 1);
    assert.ok(Number.isFinite(comparison[0].result.futureValue));
    const chartInput = getChartComparisonPortfolios(
      createInsightComparisonPortfolios(
        createRankedComparisonPortfolios(comparison),
      ),
    );
    assert.equal(chartInput.length, 1);
    assert.equal(chartInput[0].result.status, "ready");
    assert.ok(chartInput[0].result.monthlyBaselinePoints.length > 1);

    const detail = buildStep3MonthlyBaselineDetail({
      portfolio: { id: "production-ordinary", assets: ordinaryMixedAssets },
      settings: baselineSettings,
      assets: ordinaryMixedAssets,
    });
    assert.equal(detail.status, "ready");
    assert.ok(detail.performanceRows.length > 0);

    const failedMonthlyArtifact = await loader.loadScreenerProductionAppExport({
      ...options(fixture),
      releaseManifestSha256: "0".repeat(64),
      disableCache: true,
    });
    assert.equal(failedMonthlyArtifact.preview.status, "production_app_export_error");
    assert.equal(
      failedMonthlyArtifact.preview.operationalReasonCode,
      "production_release_manifest_unavailable",
    );
    assert.equal(
      failedMonthlyArtifact.candidates.length,
      loader.ALL_SCREENER_CANDIDATES.length,
    );
    assert.deepEqual(
      failedMonthlyArtifact.candidates.map(runtimeCandidateSignature),
      canonicalSignatures,
    );
    assert.ok(
      failedMonthlyArtifact.candidates.every(
        (candidate) => candidate.dataSource === "finple_app_candidates_v2",
      ),
    );
  } finally {
    await vite.close();
  }
});
