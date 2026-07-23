import { sha256Hex } from "../../utils/sha256.js";

const EXPECTED_EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z";
const DEFAULT_MANIFEST_NAME = "app-preview-manifest.json";
const buildEnv = import.meta.env || {};

let catalogPromise = null;
let monthlyIndexPromise = null;
const shardPromises = new Map();
const requestLog = [];

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
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return `${baseUrl}/${normalizedPath}`;
}

function assertManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("app preview manifest must be an object");
  }
  const expected = {
    exportVersion: EXPECTED_EXPORT_VERSION,
    candidatePackageReady: true,
    packageGlobalBlockingIssueCount: 0,
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    assetCount: 6000,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (manifest[field] !== value) {
      throw new TypeError(`app preview manifest ${field} mismatch`);
    }
  }
  if (!/^\d{4}-\d{2}$/.test(String(manifest.metricDataThroughMonth || ""))) {
    throw new TypeError("app preview manifest metricDataThroughMonth is invalid");
  }
  if (!manifest.metricsOverlay?.path || !manifest.monthlyReturnsIndex?.path) {
    throw new TypeError("app preview manifest file pointers are missing");
  }
}

function assertMetricsOverlay(overlay, manifest) {
  if (!Array.isArray(overlay?.rows) || overlay.rows.length !== 6000) {
    throw new TypeError("app preview metrics overlay must contain exactly 6000 rows");
  }
  const identities = new Set();
  for (const row of overlay.rows) {
    const identity = normalizeIdentity(row?.identity || `${row?.market || ""}:${row?.ticker || ""}`);
    if (!identity || identities.has(identity)) {
      throw new TypeError(`invalid or duplicate app preview identity: ${identity || "<blank>"}`);
    }
    identities.add(identity);
    if (row.internalPreviewReviewOnly !== true ||
        row.productionPublishReady !== false ||
        row.appExportApproved !== false) {
      throw new TypeError(`review-only gates mismatch for ${identity}`);
    }
    for (const field of [
      "selectedCagr",
      "rawPriceCagr10y",
      "rollingCagr10yMedian",
      "rollingCagr10yP25",
      "rollingCagr10yP75",
      "validRollingWindowCount10y",
      "selectedMdd",
      "selectedBeta",
      "dividendYield",
    ]) {
      const value = row[field];
      if (value !== null && value !== undefined && !Number.isFinite(Number(value))) {
        throw new TypeError(`non-finite app preview metric ${identity}.${field}`);
      }
    }
  }
  const qqq = overlay.rows.find((row) => normalizeIdentity(row.identity) === "US:QQQ");
  if (!qqq ||
      qqq.cagrPolicy !== "rolling_10y_median" ||
      Number(qqq.selectedCagr) !== Number(qqq.rollingCagr10yMedian) ||
      Number(qqq.validRollingWindowCount10y) <= 1 ||
      qqq.mddPolicy !== "full_period_actual" ||
      qqq.betaPolicy !== "aligned_monthly_return_beta") {
    throw new TypeError("QQQ app preview metric policy mismatch");
  }
  if (overlay.metricDataThroughMonth !== manifest.metricDataThroughMonth) {
    throw new TypeError("app preview metric cutoff mismatch");
  }
}

async function fetchVerifiedJson({ fetchImpl, url, expectedSha256 = "" }) {
  requestLog.push(url);
  const response = await fetchImpl(url, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`app preview request failed (${response.status}): ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (expectedSha256 && sha256Hex(bytes) !== expectedSha256) {
    throw new Error(`app preview SHA-256 mismatch: ${url}`);
  }
  return JSON.parse(new TextDecoder("utf-8").decode(bytes));
}

export function getAppPreviewRuntimeConfig(overrides = {}) {
  const enabled = overrides.enabled ??
    normalizeBoolean(buildEnv.VITE_FINPLE_APP_PREVIEW_ENABLED);
  const baseUrl = normalizeBaseUrl(
    overrides.baseUrl ?? buildEnv.VITE_FINPLE_APP_PREVIEW_BASE_URL,
  );
  const manifestName = String(
    overrides.manifestName ??
    buildEnv.VITE_FINPLE_APP_PREVIEW_MANIFEST ??
    DEFAULT_MANIFEST_NAME,
  ).trim();
  return {
    enabled: Boolean(enabled),
    baseUrl,
    manifestName: manifestName || DEFAULT_MANIFEST_NAME,
  };
}

export function isAppPreviewRuntimeEnabled(overrides = {}) {
  const config = getAppPreviewRuntimeConfig(overrides);
  return config.enabled && Boolean(config.baseUrl);
}

export function isLocalAppPreviewQaEnabled(overrides = {}) {
  const config = getAppPreviewRuntimeConfig(overrides);
  if (!config.enabled || !config.baseUrl || typeof window === "undefined") return false;
  try {
    const assetHost = new URL(config.baseUrl).hostname.toLowerCase();
    const appHost = String(window.location?.hostname || "").toLowerCase();
    const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    return loopbackHosts.has(assetHost) && loopbackHosts.has(appHost);
  } catch (error) {
    return false;
  }
}

export async function loadAppPreviewCatalog(options = {}) {
  const config = getAppPreviewRuntimeConfig(options);
  if (!config.enabled) {
    return { enabled: false, status: "production_fallback", manifest: null, overlay: null };
  }
  if (!config.baseUrl) {
    throw new Error("VITE_FINPLE_APP_PREVIEW_BASE_URL is required when app preview is enabled");
  }
  if (!catalogPromise || options.disableCache === true) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw new TypeError("fetch is unavailable");
    catalogPromise = (async () => {
      const manifest = await fetchVerifiedJson({
        fetchImpl,
        url: buildUrl(config.baseUrl, config.manifestName),
      });
      assertManifest(manifest);
      const overlay = await fetchVerifiedJson({
        fetchImpl,
        url: buildUrl(config.baseUrl, manifest.metricsOverlay.path),
        expectedSha256: manifest.metricsOverlay.sha256,
      });
      assertMetricsOverlay(overlay, manifest);
      return {
        enabled: true,
        status: "internal_preview_review_only",
        config,
        manifest,
        overlay,
      };
    })().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

async function loadMonthlyIndex(catalog, options = {}) {
  if (!monthlyIndexPromise || options.disableCache === true) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    monthlyIndexPromise = fetchVerifiedJson({
      fetchImpl,
      url: buildUrl(catalog.config.baseUrl, catalog.manifest.monthlyReturnsIndex.path),
      expectedSha256: catalog.manifest.monthlyReturnsIndex.sha256,
    }).then((index) => {
      if (index.exportVersion !== EXPECTED_EXPORT_VERSION ||
          index.metricDataThroughMonth !== catalog.manifest.metricDataThroughMonth ||
          !index.assets ||
          !Array.isArray(index.shards)) {
        throw new TypeError("app preview monthly-return index mismatch");
      }
      return index;
    }).catch((error) => {
      monthlyIndexPromise = null;
      throw error;
    });
  }
  return monthlyIndexPromise;
}

async function loadShard(catalog, index, shardPath, options = {}) {
  if (!shardPromises.has(shardPath) || options.disableCache === true) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    const record = index.shards.find((item) => item.path === shardPath);
    if (!record) throw new TypeError(`monthly-return shard is not inventoried: ${shardPath}`);
    const promise = fetchVerifiedJson({
      fetchImpl,
      url: buildUrl(catalog.config.baseUrl, shardPath),
      expectedSha256: record.sha256,
    }).then((payload) => {
      if (payload.exportVersion !== EXPECTED_EXPORT_VERSION || !payload.series) {
        throw new TypeError(`monthly-return shard contract mismatch: ${shardPath}`);
      }
      return payload;
    }).catch((error) => {
      shardPromises.delete(shardPath);
      throw error;
    });
    shardPromises.set(shardPath, promise);
  }
  return shardPromises.get(shardPath);
}

function decodeSeries(identity, encodedRows, rowEncoding) {
  const [market, ticker] = identity.split(":", 2);
  return (Array.isArray(encodedRows) ? encodedRows : []).map((encodedRow) => {
    const values = Object.fromEntries(rowEncoding.map((field, index) => [field, encodedRow[index] ?? null]));
    for (const field of ["priceReturn", "totalReturn", "fxReturn"]) {
      if (values[field] !== null && !Number.isFinite(Number(values[field]))) {
        throw new TypeError(`non-finite monthly return ${identity}.${field}`);
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

export async function loadMonthlyReturnsForIdentities(identities = [], options = {}) {
  const normalizedIdentities = [...new Set(
    identities.map(normalizeIdentity).filter(Boolean),
  )].sort();
  const catalog = await loadAppPreviewCatalog(options);
  if (!catalog.enabled) {
    return {
      enabled: false,
      rowsByIdentity: {},
      missingIdentities: normalizedIdentities,
      requestedShardPaths: [],
    };
  }
  const index = await loadMonthlyIndex(catalog, options);
  const missingIdentities = normalizedIdentities.filter((identity) => !index.assets[identity]);
  const requestedShardPaths = [...new Set(
    normalizedIdentities
      .map((identity) => index.assets[identity]?.shard)
      .filter(Boolean),
  )].sort();
  const shardPayloads = await Promise.all(
    requestedShardPaths.map((path) => loadShard(catalog, index, path, options)),
  );
  const shardByPath = new Map(
    requestedShardPaths.map((path, indexValue) => [path, shardPayloads[indexValue]]),
  );
  const rowsByIdentity = {};
  for (const identity of normalizedIdentities) {
    const assetRecord = index.assets[identity];
    if (!assetRecord) continue;
    const encodedRows = shardByPath.get(assetRecord.shard)?.series?.[identity];
    rowsByIdentity[identity] = decodeSeries(identity, encodedRows, index.rowEncoding);
  }
  return {
    enabled: true,
    manifest: catalog.manifest,
    index,
    rowsByIdentity,
    missingIdentities,
    requestedShardPaths,
  };
}

export function getAppPreviewRequestLog() {
  return [...requestLog];
}

export function resetAppPreviewDataSourceForTests() {
  catalogPromise = null;
  monthlyIndexPromise = null;
  shardPromises.clear();
  requestLog.length = 0;
}
