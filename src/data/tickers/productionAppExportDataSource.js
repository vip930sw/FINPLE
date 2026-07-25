import { sha256Hex } from "../../utils/sha256.js";

export const PRODUCTION_RELEASE_CONTRACT_VERSION =
  "finple-production-app-export-release-v1-step114-2zc";
export const PRODUCTION_EXPORT_VERSION =
  "finple-app-preview-export-v1-step114-2z";
export const PRODUCTION_UNIVERSE_VERSION =
  "finple-universe-v2-2026-07-24";
export const PRODUCTION_SOURCE_GIT_MAIN_SHA =
  "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef";
export const PRODUCTION_CANDIDATE_ZIP_SHA256 =
  "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e";
export const PRODUCTION_CANDIDATE_PACKAGE_HASH =
  "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276";

const EXPECTED_COUNTS = Object.freeze({
  assetCount: 6029,
  marketAssetCounts: Object.freeze({ KR: 3000, US: 3029 }),
  priceCoveredAssetCount: 6013,
  monthlyReturnAssetCount: 5347,
  monthlyReturnRowCount: 701485,
  metricDataThroughMonth: "2026-06",
});
const DEFAULT_RELEASE_MANIFEST_NAME = "production-app-export-release.json";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_PATH_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)[A-Za-z0-9._/-]+$/;
const RELEASE_FIELDS = Object.freeze([
  "appExportApproved",
  "approvedAt",
  "approvedBy",
  "assetCount",
  "candidatePackageHash",
  "candidateZipSha256",
  "contractVersion",
  "marketAssetCounts",
  "metricDataThroughMonth",
  "metricsOverlay",
  "monthlyReturnAssetCount",
  "monthlyReturnRowCount",
  "monthlyReturnsIndex",
  "priceCoveredAssetCount",
  "productionPublishReady",
  "schemaVersion",
  "shardCount",
  "shardInventory",
  "sourceAppExportSha256",
  "sourceGitMainSha",
  "sourceManifest",
  "universeVersion",
]);
const buildEnv = import.meta.env || {};

let catalogPromise = null;
const shardPromises = new Map();
const requestLog = [];
const failureSubscribers = new Set();

export class ProductionAppExportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProductionAppExportError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ProductionAppExportError(code, message);
}

function normalizeBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function normalizeIdentity(value) {
  const [market = "", ...tickerParts] = String(value || "").trim().split(":");
  const ticker = tickerParts.join(":").trim().toUpperCase();
  const normalizedMarket = market.trim().toUpperCase();
  return normalizedMarket && ticker ? `${normalizedMarket}:${ticker}` : "";
}

function buildUrl(baseUrl, path) {
  return `${baseUrl}/${String(path || "").replace(/^\/+/, "")}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(String(value || ""))) {
    fail("production_release_manifest_invalid", `${label} must be lowercase SHA-256`);
  }
}

function assertSafePath(value, label) {
  const path = String(value || "");
  if (!SAFE_PATH_PATTERN.test(path) || path.includes("//") || path.startsWith("preview-api/")) {
    fail("production_release_manifest_invalid", `${label} is not a safe relative path`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("production_release_manifest_invalid", `${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length ||
      actual.some((field, index) => field !== expected[index])) {
    fail("production_release_manifest_invalid", `${label} fields are not the exact contract`);
  }
}

function assertFileRecord(record, label) {
  assertExactKeys(record, ["path", "sha256", "sizeBytes"], label);
  assertSafePath(record.path, `${label}.path`);
  assertSha256(record.sha256, `${label}.sha256`);
  if (!Number.isInteger(record.sizeBytes) || record.sizeBytes <= 0) {
    fail("production_release_manifest_invalid", `${label}.sizeBytes must be positive`);
  }
}

function assertShardRecord(record, label) {
  assertExactKeys(
    record,
    ["assetCount", "path", "rowCount", "sha256", "shardId", "sizeBytes"],
    label,
  );
  assertSafePath(record.path, `${label}.path`);
  assertSha256(record.sha256, `${label}.sha256`);
  if (!String(record.shardId || "").trim() ||
      !Number.isInteger(record.assetCount) ||
      record.assetCount < 0 ||
      !Number.isInteger(record.rowCount) ||
      record.rowCount < 0 ||
      !Number.isInteger(record.sizeBytes) ||
      record.sizeBytes <= 0) {
    fail("production_release_manifest_invalid", `${label} has invalid counts or identifier`);
  }
}

export function assertProductionReleaseManifest(manifest) {
  assertExactKeys(manifest, RELEASE_FIELDS, "production release manifest");
  const expected = {
    schemaVersion: 1,
    contractVersion: PRODUCTION_RELEASE_CONTRACT_VERSION,
    universeVersion: PRODUCTION_UNIVERSE_VERSION,
    candidateZipSha256: PRODUCTION_CANDIDATE_ZIP_SHA256,
    candidatePackageHash: PRODUCTION_CANDIDATE_PACKAGE_HASH,
    assetCount: EXPECTED_COUNTS.assetCount,
    priceCoveredAssetCount: EXPECTED_COUNTS.priceCoveredAssetCount,
    monthlyReturnAssetCount: EXPECTED_COUNTS.monthlyReturnAssetCount,
    monthlyReturnRowCount: EXPECTED_COUNTS.monthlyReturnRowCount,
    metricDataThroughMonth: EXPECTED_COUNTS.metricDataThroughMonth,
    productionPublishReady: true,
    appExportApproved: true,
    sourceGitMainSha: PRODUCTION_SOURCE_GIT_MAIN_SHA,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (manifest[field] !== value) {
      fail("production_release_manifest_invalid", `${field} does not match the production contract`);
    }
  }
  if (stableJson(manifest.marketAssetCounts) !==
      stableJson(EXPECTED_COUNTS.marketAssetCounts)) {
    fail("production_release_manifest_invalid", "marketAssetCounts do not reconcile");
  }
  assertSha256(manifest.sourceAppExportSha256, "sourceAppExportSha256");
  if (!String(manifest.approvedBy || "").trim() ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(String(manifest.approvedAt || "")) ||
      Number.isNaN(Date.parse(manifest.approvedAt))) {
    fail("production_release_manifest_invalid", "approval identity or timestamp is invalid");
  }
  assertFileRecord(manifest.sourceManifest, "sourceManifest");
  assertFileRecord(manifest.metricsOverlay, "metricsOverlay");
  assertFileRecord(manifest.monthlyReturnsIndex, "monthlyReturnsIndex");
  if (![64, 128, 256].includes(manifest.shardCount) ||
      !Array.isArray(manifest.shardInventory) ||
      manifest.shardInventory.length !== manifest.shardCount) {
    fail("production_release_manifest_invalid", "complete shard inventory is required");
  }
  const paths = new Set();
  const ids = new Set();
  manifest.shardInventory.forEach((record, index) => {
    assertShardRecord(record, `shardInventory[${index}]`);
    if (paths.has(record.path) || ids.has(record.shardId)) {
      fail("production_release_manifest_invalid", "duplicate shard path or identifier");
    }
    paths.add(record.path);
    ids.add(record.shardId);
  });
  const assetTotal = manifest.shardInventory
    .reduce((sum, item) => sum + item.assetCount, 0);
  const rowTotal = manifest.shardInventory
    .reduce((sum, item) => sum + item.rowCount, 0);
  if (assetTotal !== manifest.monthlyReturnAssetCount ||
      rowTotal !== manifest.monthlyReturnRowCount) {
    fail("production_release_manifest_invalid", "shard counts do not reconcile");
  }
  return manifest;
}

function assertSourceReviewManifest(source, release) {
  const expected = {
    exportVersion: PRODUCTION_EXPORT_VERSION,
    sourceCandidatePackageHash: release.candidatePackageHash,
    assetCount: release.assetCount,
    monthlyReturnAssetCount: release.monthlyReturnAssetCount,
    monthlyReturnRowCount: release.monthlyReturnRowCount,
    metricDataThroughMonth: release.metricDataThroughMonth,
    candidatePackageReady: true,
    packageGlobalBlockingIssueCount: 0,
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (source?.[field] !== value) {
      fail("production_source_manifest_mismatch", `source review manifest ${field} mismatch`);
    }
  }
  if (source.rawMissingAssetCount !== release.assetCount - release.priceCoveredAssetCount ||
      stableJson(source.marketAssetCounts) !== stableJson(release.marketAssetCounts) ||
      source.shardCount !== release.shardCount ||
      stableJson(source.shardInventory) !== stableJson(release.shardInventory) ||
      stableJson(source.metricsOverlay) !== stableJson(release.metricsOverlay) ||
      stableJson(source.monthlyReturnsIndex) !== stableJson(release.monthlyReturnsIndex)) {
    fail("production_source_manifest_mismatch", "source review bindings do not match release");
  }
}

function assertMetricsOverlay(overlay, release) {
  if (overlay?.exportVersion !== PRODUCTION_EXPORT_VERSION ||
      overlay?.metricDataThroughMonth !== release.metricDataThroughMonth ||
      !Array.isArray(overlay?.rows) ||
      overlay.rows.length !== release.assetCount) {
    fail("production_metrics_overlay_mismatch", "metrics overlay header or row count mismatch");
  }
  const identities = new Set();
  for (const row of overlay.rows) {
    const identity = normalizeIdentity(row?.identity || `${row?.market || ""}:${row?.ticker || ""}`);
    if (!identity || identities.has(identity)) {
      fail("production_metrics_overlay_mismatch", `invalid or duplicate identity ${identity || "<blank>"}`);
    }
    identities.add(identity);
    if (row.internalPreviewReviewOnly !== true ||
        row.productionPublishReady !== false ||
        row.appExportApproved !== false) {
      fail("production_metrics_overlay_mismatch", `source review gates changed for ${identity}`);
    }
  }
  const qqq = overlay.rows.find((row) => normalizeIdentity(row.identity) === "US:QQQ");
  if (!qqq ||
      qqq.cagrPolicy !== "rolling_10y_median" ||
      Number(qqq.selectedCagr) !== Number(qqq.rollingCagr10yMedian) ||
      Number(qqq.validRollingWindowCount10y) <= 1) {
    fail("production_metrics_overlay_mismatch", "QQQ rolling-median policy mismatch");
  }
}

function assertMonthlyIndex(index, release) {
  if (index?.exportVersion !== PRODUCTION_EXPORT_VERSION ||
      index?.metricDataThroughMonth !== release.metricDataThroughMonth ||
      index?.assetCount !== release.monthlyReturnAssetCount ||
      index?.rowCount !== release.monthlyReturnRowCount ||
      !index.assets ||
      Object.keys(index.assets).length !== release.monthlyReturnAssetCount ||
      !Array.isArray(index.shards) ||
      stableJson(index.shards) !== stableJson(release.shardInventory)) {
    fail("production_monthly_index_mismatch", "monthly-return index contract mismatch");
  }
  const shardPaths = new Set(release.shardInventory.map((item) => item.path));
  for (const [identity, record] of Object.entries(index.assets)) {
    if (normalizeIdentity(identity) !== identity || !shardPaths.has(record?.shard)) {
      fail("production_monthly_index_mismatch", `invalid monthly-return identity ${identity}`);
    }
  }
}

async function fetchVerifiedJson({
  fetchImpl,
  url,
  expectedSha256,
  expectedSizeBytes = null,
  failureCode,
}) {
  requestLog.push(url);
  let response;
  try {
    response = await fetchImpl(url, { credentials: "same-origin", cache: "no-store" });
  } catch (error) {
    fail(failureCode, `request failed for ${url}`);
  }
  if (!response.ok) fail(failureCode, `request returned ${response.status} for ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (expectedSizeBytes !== null && bytes.byteLength !== expectedSizeBytes) {
    fail(failureCode, `size mismatch for ${url}`);
  }
  if (expectedSha256 && sha256Hex(bytes) !== expectedSha256) {
    fail(failureCode, `SHA-256 mismatch for ${url}`);
  }
  try {
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  } catch (error) {
    fail(failureCode, `invalid JSON for ${url}`);
  }
}

export function getProductionAppExportRuntimeConfig(overrides = {}) {
  return {
    enabled: Boolean(
      overrides.enabled ??
      normalizeBoolean(buildEnv.VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED)
    ),
    baseUrl: normalizeBaseUrl(
      overrides.baseUrl ?? buildEnv.VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL,
    ),
    manifestName: String(
      overrides.manifestName ??
      buildEnv.VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST ??
      DEFAULT_RELEASE_MANIFEST_NAME,
    ).trim() || DEFAULT_RELEASE_MANIFEST_NAME,
    releaseManifestSha256: String(
      overrides.releaseManifestSha256 ??
      buildEnv.VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256 ??
      "",
    ).trim().toLowerCase(),
    sourceAppExportSha256: String(
      overrides.sourceAppExportSha256 ??
      buildEnv.VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256 ??
      "",
    ).trim().toLowerCase(),
  };
}

export function isProductionAppExportConfigured(overrides = {}) {
  return getProductionAppExportRuntimeConfig(overrides).enabled;
}

export async function loadProductionAppExportCatalog(options = {}) {
  const config = getProductionAppExportRuntimeConfig(options);
  if (!config.enabled) {
    return { enabled: false, status: "production_v1_fallback", release: null };
  }
  if (!config.baseUrl ||
      !SHA256_PATTERN.test(config.releaseManifestSha256) ||
      !SHA256_PATTERN.test(config.sourceAppExportSha256)) {
    fail(
      "production_runtime_config_invalid",
      "production app-export base URL and release manifest SHA-256 are required",
    );
  }
  if (!catalogPromise || options.disableCache === true) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      fail("production_runtime_config_invalid", "fetch is unavailable");
    }
    catalogPromise = (async () => {
      const release = await fetchVerifiedJson({
        fetchImpl,
        url: buildUrl(config.baseUrl, config.manifestName),
        expectedSha256: config.releaseManifestSha256,
        failureCode: "production_release_manifest_unavailable",
      });
      assertProductionReleaseManifest(release);
      if (release.sourceAppExportSha256 !== config.sourceAppExportSha256) {
        fail(
          "production_source_app_export_hash_mismatch",
          "source app-export SHA-256 does not match the runtime binding",
        );
      }
      const sourceManifest = await fetchVerifiedJson({
        fetchImpl,
        url: buildUrl(config.baseUrl, release.sourceManifest.path),
        expectedSha256: release.sourceManifest.sha256,
        expectedSizeBytes: release.sourceManifest.sizeBytes,
        failureCode: "production_source_manifest_mismatch",
      });
      assertSourceReviewManifest(sourceManifest, release);
      const [overlay, index] = await Promise.all([
        fetchVerifiedJson({
          fetchImpl,
          url: buildUrl(config.baseUrl, release.metricsOverlay.path),
          expectedSha256: release.metricsOverlay.sha256,
          expectedSizeBytes: release.metricsOverlay.sizeBytes,
          failureCode: "production_metrics_overlay_mismatch",
        }),
        fetchVerifiedJson({
          fetchImpl,
          url: buildUrl(config.baseUrl, release.monthlyReturnsIndex.path),
          expectedSha256: release.monthlyReturnsIndex.sha256,
          expectedSizeBytes: release.monthlyReturnsIndex.sizeBytes,
          failureCode: "production_monthly_index_mismatch",
        }),
      ]);
      assertMetricsOverlay(overlay, release);
      assertMonthlyIndex(index, release);
      return {
        enabled: true,
        status: "production_app_export_ready",
        config,
        release,
        sourceManifest,
        overlay,
        index,
      };
    })().catch((error) => {
      catalogPromise = null;
      notifyProductionAppExportFailure(error?.code || "production_app_export_validation_failed");
      throw error;
    });
  }
  return catalogPromise;
}

function decodeSeries(identity, encodedRows, rowEncoding) {
  const [market, ticker] = identity.split(":", 2);
  return (Array.isArray(encodedRows) ? encodedRows : []).map((encodedRow) => {
    const values = Object.fromEntries(
      rowEncoding.map((field, index) => [field, encodedRow[index] ?? null]),
    );
    for (const field of ["priceReturn", "totalReturn", "fxReturn"]) {
      if (values[field] !== null && !Number.isFinite(Number(values[field]))) {
        fail("production_monthly_shard_mismatch", `non-finite ${identity}.${field}`);
      }
    }
    return {
      market,
      ticker,
      month: values.month,
      priceReturn: values.priceReturn,
      totalReturn: values.totalReturn,
      fxReturn: values.fxReturn,
      currency: values.currency,
      benchmarkId: values.benchmarkId,
      dataStatus: values.dataStatus,
      returnBasis: "price_return",
      sourceHash: null,
    };
  });
}

async function loadShard(catalog, shardPath, options) {
  if (!shardPromises.has(shardPath) || options.disableCache === true) {
    const record = catalog.release.shardInventory.find((item) => item.path === shardPath);
    if (!record) fail("production_monthly_shard_mismatch", "shard is not inventoried");
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    const promise = fetchVerifiedJson({
      fetchImpl,
      url: buildUrl(catalog.config.baseUrl, shardPath),
      expectedSha256: record.sha256,
      expectedSizeBytes: record.sizeBytes,
      failureCode: "production_monthly_shard_mismatch",
    }).then((payload) => {
      if (payload?.exportVersion !== PRODUCTION_EXPORT_VERSION || !payload.series) {
        fail("production_monthly_shard_mismatch", `shard contract mismatch for ${shardPath}`);
      }
      return payload;
    }).catch((error) => {
      shardPromises.delete(shardPath);
      notifyProductionAppExportFailure(error?.code || "production_monthly_shard_mismatch");
      throw error;
    });
    shardPromises.set(shardPath, promise);
  }
  return shardPromises.get(shardPath);
}

export async function loadProductionMonthlyReturnsForIdentities(identities = [], options = {}) {
  const normalizedIdentities = [...new Set(
    identities.map(normalizeIdentity).filter(Boolean),
  )].sort();
  const catalog = await loadProductionAppExportCatalog(options);
  if (!catalog.enabled) {
    return {
      enabled: false,
      rowsByIdentity: {},
      missingIdentities: normalizedIdentities,
      requestedShardPaths: [],
    };
  }
  const missingIdentities = normalizedIdentities
    .filter((identity) => !catalog.index.assets[identity]);
  if (missingIdentities.length > 0) {
    return {
      enabled: true,
      release: catalog.release,
      rowsByIdentity: {},
      missingIdentities,
      requestedShardPaths: [],
    };
  }
  const requestedShardPaths = [...new Set(
    normalizedIdentities.map((identity) => catalog.index.assets[identity].shard),
  )].sort();
  const shardPayloads = await Promise.all(
    requestedShardPaths.map((path) => loadShard(catalog, path, options)),
  );
  const shardByPath = new Map(
    requestedShardPaths.map((path, index) => [path, shardPayloads[index]]),
  );
  const rowsByIdentity = {};
  for (const identity of normalizedIdentities) {
    const record = catalog.index.assets[identity];
    const encodedRows = shardByPath.get(record.shard)?.series?.[identity];
    if (!Array.isArray(encodedRows) || encodedRows.length !== record.rowCount) {
      notifyProductionAppExportFailure("production_monthly_shard_mismatch");
      fail("production_monthly_shard_mismatch", `row count mismatch for ${identity}`);
    }
    rowsByIdentity[identity] = decodeSeries(identity, encodedRows, catalog.index.rowEncoding);
  }
  return {
    enabled: true,
    release: catalog.release,
    sourceManifest: catalog.sourceManifest,
    index: catalog.index,
    rowsByIdentity,
    missingIdentities: [],
    requestedShardPaths,
  };
}

export function subscribeProductionAppExportFailure(subscriber) {
  if (typeof subscriber !== "function") return () => {};
  failureSubscribers.add(subscriber);
  return () => failureSubscribers.delete(subscriber);
}

export function notifyProductionAppExportFailure(reasonCode) {
  const safeReasonCode = /^production_[a-z0-9_]+$/.test(String(reasonCode || ""))
    ? String(reasonCode)
    : "production_app_export_validation_failed";
  failureSubscribers.forEach((subscriber) => subscriber(safeReasonCode));
}

export function getProductionAppExportRequestLog() {
  return [...requestLog];
}

export function resetProductionAppExportDataSourceForTests() {
  catalogPromise = null;
  shardPromises.clear();
  requestLog.length = 0;
  failureSubscribers.clear();
}
