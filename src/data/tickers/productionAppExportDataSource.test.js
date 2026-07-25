import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createServer } from "vite";

import { sha256Hex } from "../../utils/sha256.js";
import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import {
  PRODUCTION_CANDIDATE_PACKAGE_HASH,
  PRODUCTION_CANDIDATE_ZIP_SHA256,
  PRODUCTION_EXPORT_VERSION,
  PRODUCTION_RELEASE_CONTRACT_VERSION,
  PRODUCTION_SOURCE_GIT_MAIN_SHA,
  PRODUCTION_UNIVERSE_VERSION,
  assertProductionReleaseManifest,
  getProductionAppExportRequestLog,
  loadProductionAppExportCatalog,
  loadProductionMonthlyReturnsForIdentities,
  resetProductionAppExportDataSourceForTests,
} from "./productionAppExportDataSource.js";

const BASE_URL = "https://production-app-export.test/app-data/finple-universe-v2-2026-07-24";
const SOURCE_APP_EXPORT_SHA256 = "e".repeat(64);
const encoder = new TextEncoder();

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function canonicalIdentities() {
  const lines = fs.readFileSync(
    new URL("./finple_app_candidates_v2.csv", import.meta.url),
    "utf8",
  ).trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, ""));
  const marketIndex = headers.indexOf("market");
  const tickerIndex = headers.indexOf("ticker");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return `${values[marketIndex]}:${values[tickerIndex]}`;
  });
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

function makeFixture() {
  const identities = canonicalIdentities();
  assert.equal(identities.length, 6029);
  const dividendYields = new Map([
    ["US:AIPI", 34.98],
    ["US:MSFY", 28.30],
    ["US:TSLP", 28.11],
    ["US:QYLG", 16.26],
    ["US:QQQ", 0.41],
    ["US:SPY", 1.01],
    ["US:GLD", 0],
  ]);
  const rows = identities.map((identity) => {
    const [market, ticker] = identity.split(":");
    const qqq = identity === "US:QQQ";
    return {
      identity,
      market,
      ticker,
      selectedCagr: qqq ? 17.11 : 8,
      rawPriceCagr10y: qqq ? 21.21 : 8,
      rollingCagr10yMedian: qqq ? 17.11 : 8,
      rollingCagr10yP25: qqq ? 15.62 : 7,
      rollingCagr10yP75: qqq ? 18.59 : 9,
      validRollingWindowCount10y: qqq ? 120 : 24,
      cagrPolicy: "rolling_10y_median",
      selectedMdd: -20,
      mddPolicy: "full_period_actual",
      selectedBeta: 1,
      betaPolicy: "aligned_monthly_return_beta",
      dividendYield: dividendYields.get(identity) ?? null,
      dividendStatus: ticker === "GLD"
        ? "confirmed_zero"
        : dividendYields.has(identity) ? "available" : "missing",
      dataStatus: "ready",
      reviewFlag: "none",
      reviewReason: "",
      rawPriceCoverageStatus: "covered",
      metricBaseDate: "2026-07-24",
      internalPreviewReviewOnly: true,
      productionPublishReady: false,
      appExportApproved: false,
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
            ["2020-01", 0.01, null, null, "USD", "US:SPY", "ready"],
            ["2020-02", -0.02, null, null, "USD", "US:SPY", "ready"],
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
    rowEncoding: [
      "month",
      "priceReturn",
      "totalReturn",
      "fxReturn",
      "currency",
      "benchmarkId",
      "dataStatus",
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

test("production catalog validates 6029 rows and fixed RM/monthly bindings", async () => {
  resetProductionAppExportDataSourceForTests();
  const fixture = makeFixture();
  const catalog = await loadProductionAppExportCatalog(options(fixture));
  assert.equal(catalog.status, "production_app_export_ready");
  assert.equal(catalog.overlay.rows.length, 6029);
  assert.equal(Object.keys(catalog.index.assets).length, 5347);
  assert.equal(catalog.release.monthlyReturnRowCount, 701485);
  assert.equal(
    catalog.overlay.rows.find((row) => row.identity === "US:QQQ").selectedCagr,
    17.11,
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
  assert.deepEqual(second.rowsByIdentity, first.rowsByIdentity);
  assert.equal(
    requestCounts.get(`${BASE_URL}/monthly-returns/monthly-returns-00.json`),
    1,
  );
  assert.equal(getProductionAppExportRequestLog().filter(
    (url) => url.includes("monthly-returns-00.json"),
  ).length, 1);
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

test("production loader applies RM and distribution policy through saved hydration then atomically falls back", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const fixture = makeFixture();
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const snapshot = await loader.loadScreenerProductionAppExport(options(fixture));
    assert.equal(snapshot.preview.status, "production_app_export_ready");
    assert.equal(snapshot.candidates.length, 6029);
    const expectations = new Map([
      ["QQQ", { market: "US", cagr: 17.11, dividendYield: 0.41 }],
      ["SPY", { market: "US", cagr: 8, dividendYield: 1.01 }],
      ["VOO", { market: "US", cagr: 8 }],
      ["069500", { market: "KR", cagr: 8 }],
      ["GLD", { market: "US", cagr: 8, dividendYield: 0 }],
      ["AIPI", { market: "US", distributionYield: 34.98 }],
      ["MSFY", { market: "US", distributionYield: 28.30 }],
      ["TSLP", { market: "US", distributionYield: 28.11 }],
      ["QYLG", { market: "US", distributionYield: 16.26 }],
    ]);
    for (const [ticker, expected] of expectations) {
      const candidate = loader.findScreenerCandidateByTicker(ticker, expected.market);
      assert.ok(candidate, ticker);
      assert.equal(candidate.expectedCagr, expected.cagr ?? 8, ticker);
      const hydrated = loader.hydrateAssetFromScreenerCandidate({
        ticker,
        market: expected.market,
        quantity: 1,
        price: 100,
        targetWeight: 100,
      });
      const parsed = JSON.parse(JSON.stringify(hydrated));
      const saved = { ...parsed, ...normalizePersistedMetricFields(parsed) };
      assert.equal(saved.productionAppExportEnabled, true, ticker);
      assert.equal(saved.productionPublishReady, true, ticker);
      assert.equal(saved.appExportApproved, true, ticker);
      if (expected.distributionYield !== undefined) {
        assert.equal(saved.dividendYield, null, ticker);
        assert.equal(saved.trailingDistributionYield, expected.distributionYield, ticker);
        assert.equal(
          saved.distributionCalculationStatus,
          "review_only_no_approved_reinvestment_model",
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
        assert.equal(result.status, "blocked", ticker);
        assert.match(
          result.blockReasons.join("|"),
          /unsupported_distribution_calculation_policy/,
          ticker,
        );
      } else if (expected.dividendYield !== undefined) {
        assert.equal(saved.dividendYield, expected.dividendYield, ticker);
      }
      if (ticker === "GLD") assert.equal(saved.dividendStatus, "confirmed_zero");
      if (ticker === "QYLG") {
        assert.equal(saved.exposureType, "index_covered_call_growth");
      }
    }

    const fallback = await loader.loadScreenerProductionAppExport({
      ...options(fixture),
      releaseManifestSha256: "0".repeat(64),
      disableCache: true,
    });
    assert.equal(fallback.preview.status, "production_v1_fallback");
    assert.equal(
      fallback.preview.operationalReasonCode,
      "production_release_manifest_unavailable",
    );
    assert.equal(fallback.candidates.length, loader.ALL_SCREENER_CANDIDATES.length);
    assert.ok(fallback.candidates.length < 6029);
    const fallbackQqq = loader.hydrateAssetForProductionFallback({
      ticker: "QQQ",
      market: "US",
      productionAppExportEnabled: true,
      dataSource: "finple_production_app_export_step114_2zc",
      selectedCagr: 17.11,
    });
    assert.equal(fallbackQqq.productionAppExportEnabled, false);
    assert.notEqual(fallbackQqq.dataSource, "finple_production_app_export_step114_2zc");
  } finally {
    await vite.close();
  }
});
