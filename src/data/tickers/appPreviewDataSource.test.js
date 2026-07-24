import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../../utils/sha256.js";
import {
  getAppPreviewRequestLog,
  isLocalAppPreviewQaEnabled,
  loadAppPreviewCatalog,
  loadMonthlyReturnsForIdentities,
  resetAppPreviewDataSourceForTests,
} from "./appPreviewDataSource.js";

const BASE_URL = "http://preview.test";
const EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z";

function jsonBytes(value) {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

function metricRow(market, ticker, overrides = {}) {
  return {
    identity: `${market}:${ticker}`,
    market,
    ticker,
    selectedCagr: null,
    rawPriceCagr10y: null,
    rollingCagr10yMedian: null,
    rollingCagr10yP25: null,
    rollingCagr10yP75: null,
    validRollingWindowCount10y: null,
    cagrPolicy: "insufficient",
    selectedMdd: null,
    mddPolicy: "full_period_actual",
    selectedBeta: null,
    betaPolicy: "aligned_monthly_return_beta",
    dividendYield: null,
    dataStatus: "review_required",
    reviewFlag: "review_required",
    reviewReason: "normalized_source_missing",
    metricBaseDate: "2026-07-22",
    rawPriceCoverageStatus: "covered",
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    ...overrides,
  };
}

function fixture() {
  const rows = [
    metricRow("KR", "069500"),
    metricRow("KR", "0086C0"),
    metricRow("US", "QQQ", {
      selectedCagr: 17.11,
      rawPriceCagr10y: 21.21,
      rollingCagr10yMedian: 17.11,
      rollingCagr10yP25: 15.62,
      rollingCagr10yP75: 18.59,
      validRollingWindowCount10y: 120,
      cagrPolicy: "rolling_10y_median",
      selectedMdd: -49.97,
      selectedBeta: 1.1098,
      dividendYield: 0,
      dataStatus: "ready",
      reviewFlag: "none",
      reviewReason: null,
    }),
  ];
  let krIndex = 0;
  while (rows.filter((row) => row.market === "KR").length < 3000) {
    const ticker = `${krIndex}`.padStart(6, "0");
    krIndex += 1;
    if (rows.some((row) => row.identity === `KR:${ticker}`)) continue;
    rows.push(metricRow("KR", ticker));
  }
  let usIndex = 0;
  while (rows.filter((row) => row.market === "US").length < 3000) {
    const ticker = `U${String(usIndex).padStart(4, "0")}`;
    usIndex += 1;
    rows.push(metricRow("US", ticker));
  }
  const overlay = {
    exportVersion: EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    rows,
  };
  const shardA = {
    exportVersion: EXPORT_VERSION,
    series: {
      "US:QQQ": [["2026-05-31", 0.03, 0.03, 0, "USD", "US_SPY", "candidate"]],
    },
  };
  const shardB = {
    exportVersion: EXPORT_VERSION,
    series: {
      "KR:069500": [["2026-05-31", 0.01, 0.01, 0, "KRW", "KR_KOSPI", "candidate"]],
      "KR:0086C0": [["2026-05-31", -0.02, -0.02, 0, "KRW", "KR_KOSPI", "candidate"]],
    },
  };
  const shardABytes = jsonBytes(shardA);
  const shardBBytes = jsonBytes(shardB);
  const index = {
    exportVersion: EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    rowEncoding: ["month", "priceReturn", "totalReturn", "fxReturn", "currency", "benchmarkId", "dataStatus"],
    assets: {
      "US:QQQ": { shard: "monthly-returns/monthly-returns-00.json" },
      "KR:069500": { shard: "monthly-returns/monthly-returns-01.json" },
      "KR:0086C0": { shard: "monthly-returns/monthly-returns-01.json" },
    },
    shards: [
      { path: "monthly-returns/monthly-returns-00.json", sha256: sha256Hex(shardABytes) },
      { path: "monthly-returns/monthly-returns-01.json", sha256: sha256Hex(shardBBytes) },
    ],
  };
  const overlayBytes = jsonBytes(overlay);
  const indexBytes = jsonBytes(index);
  const manifest = {
    exportVersion: EXPORT_VERSION,
    candidatePackageReady: true,
    packageGlobalBlockingIssueCount: 0,
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    assetCount: 6000,
    metricDataThroughMonth: "2026-06",
    metricsOverlay: { path: "metrics-overlay.json", sha256: sha256Hex(overlayBytes) },
    monthlyReturnsIndex: { path: "monthly-returns-index.json", sha256: sha256Hex(indexBytes) },
  };
  return new Map([
    [`${BASE_URL}/app-preview-manifest.json`, jsonBytes(manifest)],
    [`${BASE_URL}/metrics-overlay.json`, overlayBytes],
    [`${BASE_URL}/monthly-returns-index.json`, indexBytes],
    [`${BASE_URL}/monthly-returns/monthly-returns-00.json`, shardABytes],
    [`${BASE_URL}/monthly-returns/monthly-returns-01.json`, shardBBytes],
  ]);
}

function createFetch(files, calls) {
  return async (url) => {
    calls.push(url);
    const bytes = files.get(url);
    return new Response(bytes || "missing", {
      status: bytes ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };
}

test("disabled preview uses existing loader fallback without requests", async () => {
  resetAppPreviewDataSourceForTests();
  const calls = [];
  const result = await loadAppPreviewCatalog({
    enabled: false,
    fetchImpl: createFetch(fixture(), calls),
  });
  assert.equal(result.enabled, false);
  assert.equal(result.status, "production_fallback");
  assert.deepEqual(calls, []);
});

test("same-origin root-relative preview base requests the versioned protected path", async () => {
  resetAppPreviewDataSourceForTests();
  const calls = [];
  const relativeBaseUrl = "/app-preview-data/2026-07-22";
  const relativeFiles = new Map(
    [...fixture()].map(([url, bytes]) => [
      url.replace(BASE_URL, relativeBaseUrl),
      bytes,
    ]),
  );
  const result = await loadAppPreviewCatalog({
    enabled: true,
    baseUrl: relativeBaseUrl,
    fetchImpl: createFetch(relativeFiles, calls),
  });
  assert.equal(result.overlay.rows.length, 6000);
  assert.deepEqual(calls, [
    `${relativeBaseUrl}/app-preview-manifest.json`,
    `${relativeBaseUrl}/metrics-overlay.json`,
  ]);
});

test("local QA access requires both app and asset hosts to be loopback", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { hostname: "127.0.0.1" } };
  try {
    assert.equal(isLocalAppPreviewQaEnabled({
      enabled: true,
      baseUrl: "http://127.0.0.1:8765",
    }), true);
    assert.equal(isLocalAppPreviewQaEnabled({
      enabled: true,
      baseUrl: "https://private-preview.example.com",
    }), false);
    globalThis.window.location.hostname = "preview.example.com";
    assert.equal(isLocalAppPreviewQaEnabled({
      enabled: true,
      baseUrl: "http://127.0.0.1:8765",
    }), false);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("catalog preserves 6000 identities, KR tickers, nulls, and QQQ policy", async () => {
  resetAppPreviewDataSourceForTests();
  const calls = [];
  const result = await loadAppPreviewCatalog({
    enabled: true,
    baseUrl: BASE_URL,
    fetchImpl: createFetch(fixture(), calls),
  });
  assert.equal(result.overlay.rows.length, 6000);
  const byIdentity = new Map(result.overlay.rows.map((row) => [row.identity, row]));
  assert.equal(byIdentity.get("KR:069500").ticker, "069500");
  assert.equal(byIdentity.get("KR:0086C0").ticker, "0086C0");
  assert.equal(byIdentity.get("KR:0086C0").selectedCagr, null);
  assert.equal(byIdentity.get("US:QQQ").selectedCagr, 17.11);
  assert.deepEqual(calls, [
    `${BASE_URL}/app-preview-manifest.json`,
    `${BASE_URL}/metrics-overlay.json`,
  ]);
});

test("monthly returns request only target shards and deduplicate concurrent loads", async () => {
  resetAppPreviewDataSourceForTests();
  const calls = [];
  const options = {
    enabled: true,
    baseUrl: BASE_URL,
    fetchImpl: createFetch(fixture(), calls),
  };
  const [first, second] = await Promise.all([
    loadMonthlyReturnsForIdentities(["US:QQQ"], options),
    loadMonthlyReturnsForIdentities(["US:QQQ"], options),
  ]);
  assert.equal(first.rowsByIdentity["US:QQQ"][0].priceReturn, 0.03);
  assert.equal(second.rowsByIdentity["US:QQQ"][0].ticker, "QQQ");
  assert.deepEqual(first.requestedShardPaths, ["monthly-returns/monthly-returns-00.json"]);
  assert.equal(
    calls.filter((url) => url.endsWith("monthly-returns-00.json")).length,
    1,
  );
  assert.equal(
    calls.filter((url) => url.endsWith("monthly-returns-01.json")).length,
    0,
  );
  assert.equal(getAppPreviewRequestLog().filter((url) => url.endsWith("monthly-returns-00.json")).length, 1);
});

test("missing monthly-return identity remains unavailable and is not zero-filled", async () => {
  resetAppPreviewDataSourceForTests();
  const calls = [];
  const result = await loadMonthlyReturnsForIdentities(["US:UNKNOWN"], {
    enabled: true,
    baseUrl: BASE_URL,
    fetchImpl: createFetch(fixture(), calls),
  });
  assert.deepEqual(result.rowsByIdentity, {});
  assert.deepEqual(result.missingIdentities, ["US:UNKNOWN"]);
  assert.deepEqual(result.requestedShardPaths, []);
});
