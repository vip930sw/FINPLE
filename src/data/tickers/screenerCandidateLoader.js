import finpleAppCandidates6000Csv from "./finple_app_candidates_6000_balanced_v1.csv?raw";
import finpleAppCandidatesV2Csv from "./finple_app_candidates_v2.csv?raw";
import {
  applyScreenerCandidateOverlays,
  isPriceMetricsAppReadyCandidate,
} from "./screenerCandidateOverlay";
import {
  isAppPreviewRuntimeEnabled,
  loadAppPreviewCatalog,
} from "./appPreviewDataSource";

const stripBom = (value = "") => String(value || "").replace(/^\uFEFF/, "");
const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : null;
};
const toBoolean = (value) => String(value || "").trim().toLowerCase() === "true";
const splitPipe = (value) => String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
const normalizeTicker = (ticker = "") => stripBom(ticker).trim().toUpperCase();
const normalizeMarket = (market = "") => String(market || "US").trim().toUpperCase();
const normalizeAssetType = (assetType = "") => {
  const value = String(assetType || "").trim().toLowerCase();
  return value === "stock" || value === "single_stock" ? "stock" : "ETF";
};

function parseCsvLine(line = "") {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => stripBom(cell).trim());
}

function parseCsv(csvText = "") {
  const lines = String(csvText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => ({ ...row, [header]: cells[index] || "" }), {});
  });
}

function uniqueByMarketTicker(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${normalizeMarket(candidate?.market)}:${normalizeTicker(candidate?.ticker)}`;
    if (!candidate?.ticker || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const SCREENER_METRICS_POLICY_NOTE =
  "FINPLE app-ready candidate universe: only assets with verified price metrics are exposed in screener and simulator.";

export function normalizeScreenerCandidate(row = {}) {
  const market = normalizeMarket(row.market || "US");
  const assetType = normalizeAssetType(row.assetType);
  const marketCap = toNumber(row.marketCap);
  const aum = toNumber(row.aum);
  const sizeMetric = assetType === "ETF" ? aum ?? marketCap : marketCap ?? aum;
  const nameKr = row.nameKr || row.koreanName || row.name || "";

  return {
    ticker: stripBom(row.ticker || "").trim(),
    providerSymbol: row.providerSymbol || row.ticker || "",
    koreanName: nameKr,
    nameKr,
    market,
    currency: row.currency || "KRW",
    quoteCurrency: row.quoteCurrency || (market === "KR" ? "KRW" : "USD"),
    type: assetType,
    assetType,
    sourceUniverse: row.sourceUniverse || "",
    tier: row.tier || "",
    strategy: row.strategy || "core",
    riskLevel: row.riskLevel || "medium",
    expectedCagr: toNumber(row.expectedCagr),
    beta: toNumber(row.beta),
    mdd: toNumber(row.mdd),
    dividendYield: toNumber(row.dividendYield),
    displayDividendYield: row.displayDividendYield || "",
    dividendPolicy: row.dividendPolicy || "",
    dividendSource: row.dividendSource || "",
    marketCap,
    aum,
    sizeMetric,
    sizeSource: row.sizeSource || "",
    dataStatus: row.dataStatus || "",
    reviewTag: row.reviewTag || "",
    reviewReason: row.reviewReason || "",
    metricsSource: row.metricsSource || "",
    goals: splitPipe(row.goals),
    beginnerFit: toBoolean(row.beginnerFit),
    tags: splitPipe(row.tags),
    notes: row.notes || "",
    underlyingTicker: row.underlyingTicker || "",
    exposureType: row.exposureType || (assetType === "stock" ? "ordinary_equity" : "ordinary_etf"),
    leverageMultiple: toNumber(row.leverageMultiple),
    direction: row.direction || "long",
    resetFrequency: row.resetFrequency || "not_applicable",
    optionCoverageRatio: toNumber(row.optionCoverageRatio),
    distributionFrequency: row.distributionFrequency || "unknown",
    distributionType: row.distributionType || "unknown",
    issuer: row.issuer || "",
    inceptionDate: row.inceptionDate || "",
    listingStatus: row.listingStatus || "active",
    active: row.active === "" || row.active === undefined ? true : toBoolean(row.active),
    firstListedDate: row.firstListedDate || "",
    lastTradingDate: row.lastTradingDate || "",
    sourceCheckedAt: row.sourceCheckedAt || "",
    officialSourceUrl: row.officialSourceUrl || "",
    sourceId: row.sourceId || "",
    cagrPolicy: row.cagrPolicy || "",
    metricMode: row.sourceUniverse === "official_issuer_verified_20260724"
      ? "candidate_universe_v2_pending_delta"
      : "candidate_6000_balanced_v1",
    dataSource: row.sourceUniverse === "official_issuer_verified_20260724"
      ? "finple_app_candidates_v2"
      : "finple_app_candidates_6000_balanced_v1",
  };
}

export function loadScreenerCandidatesFromCsv(csvText = "") {
  return uniqueByMarketTicker(
    parseCsv(csvText).map(normalizeScreenerCandidate).filter((candidate) => candidate.ticker && candidate.koreanName)
  );
}

export const RAW_SCREENER_CANDIDATES = loadScreenerCandidatesFromCsv(finpleAppCandidates6000Csv);
export const RAW_SCREENER_CANDIDATE_COUNT = RAW_SCREENER_CANDIDATES.length;
export const APP_PREVIEW_SCREENER_CANDIDATES = loadScreenerCandidatesFromCsv(finpleAppCandidatesV2Csv);

export const ALL_SCREENER_CANDIDATES = applyScreenerCandidateOverlays(
  RAW_SCREENER_CANDIDATES.filter(isPriceMetricsAppReadyCandidate)
);
export const US_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter((candidate) => candidate.market === "US");
export const KR_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter((candidate) => candidate.market === "KR");
export const US_CORE_CANDIDATES = US_SCREENER_CANDIDATES.filter((candidate) => candidate.tier === "core");
export const US_EXTRA_CANDIDATES = US_SCREENER_CANDIDATES.filter((candidate) => candidate.tier !== "core");
export const US_EXPANSION_CANDIDATES = US_EXTRA_CANDIDATES;
export const KR_ETF_CANDIDATES = KR_SCREENER_CANDIDATES.filter((candidate) => candidate.type === "ETF");
export const KR_STOCK_CANDIDATES = KR_SCREENER_CANDIDATES.filter((candidate) => candidate.type === "stock");

let activeScreenerCandidates = ALL_SCREENER_CANDIDATES;
let activeScreenerCandidateMap = new Map(
  activeScreenerCandidates.map((candidate) => [
    `${normalizeMarket(candidate.market)}:${normalizeTicker(candidate.ticker)}`,
    candidate,
  ]),
);
let appPreviewState = {
  enabled: false,
  status: "production_fallback",
  manifest: null,
  error: null,
};
let appPreviewLoadPromise = null;
const appPreviewSubscribers = new Set();

function notifyAppPreviewSubscribers() {
  const snapshot = getScreenerCandidateSnapshot();
  appPreviewSubscribers.forEach((subscriber) => subscriber(snapshot));
}

function createAppPreviewCandidate(baseCandidate, metricRow, manifest) {
  const rawMissing = metricRow.rawPriceCoverageStatus === "missing";
  return {
    ...baseCandidate,
    expectedCagr: metricRow.selectedCagr,
    priceCagr10y: metricRow.rawPriceCagr10y,
    rawPriceCagr10y: metricRow.rawPriceCagr10y,
    rollingCagr10yMedian: metricRow.rollingCagr10yMedian,
    rollingCagr10yP25: metricRow.rollingCagr10yP25,
    rollingCagr10yP75: metricRow.rollingCagr10yP75,
    validRollingWindowCount10y: metricRow.validRollingWindowCount10y,
    selectedCagr: metricRow.selectedCagr,
    cagrPolicy: metricRow.cagrPolicy,
    beta: metricRow.selectedBeta,
    selectedBeta: metricRow.selectedBeta,
    betaPolicy: metricRow.betaPolicy,
    mdd: metricRow.selectedMdd,
    selectedMdd: metricRow.selectedMdd,
    mddPolicy: metricRow.mddPolicy,
    dividendYield: metricRow.dividendYield,
    displayDividendYield:
      metricRow.dividendYield === null || metricRow.dividendYield === undefined
        ? ""
        : `${Number(metricRow.dividendYield).toFixed(2)}%`,
    dividendStatus: metricRow.dividendStatus,
    dividendPolicy: metricRow.dividendStatus,
    dataStatus: metricRow.dataStatus,
    metricsStatus: metricRow.dataStatus,
    reviewFlag: metricRow.reviewFlag,
    reviewTag: metricRow.reviewFlag,
    reviewReason: metricRow.reviewReason || "",
    rawPriceCoverageStatus: metricRow.rawPriceCoverageStatus,
    priceUnavailable: rawMissing,
    metricBaseDate: metricRow.metricBaseDate || manifest.metricBaseDate,
    metricDataThroughMonth: manifest.metricDataThroughMonth,
    metricsSource: "finple_app_preview_export_step114_2z",
    sourceHash: metricRow.sourceHash || manifest.sourceCandidatePackageHash,
    rawSourceSha256: metricRow.rawSourceSha256 || "",
    normalizationVersion: metricRow.normalizationVersion || "",
    normalizedSeriesHash: metricRow.normalizedSeriesHash || "",
    rollingMetricVersion: metricRow.rollingMetricVersion || "",
    pipelineVersion: manifest.pipelineVersion || "",
    calculationPolicyVersion: manifest.calculationPolicyVersion || "",
    overlayStatus: "internal_preview_review_only",
    internalPreviewReviewOnly: true,
    previewLoaderEnabled: true,
    productionPublishReady: false,
    appExportApproved: false,
    metricMode: "candidate_app_preview_price_return",
    dataSource: "finple_app_preview_export_step114_2z",
  };
}

function activateAppPreviewCatalog(catalog) {
  const metricMap = new Map(
    catalog.overlay.rows.map((row) => [
      `${normalizeMarket(row.market)}:${normalizeTicker(row.ticker)}`,
      row,
    ]),
  );
  const canonicalCandidates =
    catalog.manifest.assetCount === APP_PREVIEW_SCREENER_CANDIDATES.length
      ? APP_PREVIEW_SCREENER_CANDIDATES
      : catalog.manifest.assetCount === RAW_SCREENER_CANDIDATES.length
        ? RAW_SCREENER_CANDIDATES
        : null;
  if (!canonicalCandidates) {
    throw new TypeError("app preview manifest does not match a supported canonical universe");
  }
  const nextCandidates = canonicalCandidates.map((candidate) => {
    const key = `${normalizeMarket(candidate.market)}:${normalizeTicker(candidate.ticker)}`;
    const metricRow = metricMap.get(key);
    if (!metricRow) throw new TypeError(`app preview metric identity missing: ${key}`);
    return createAppPreviewCandidate(candidate, metricRow, catalog.manifest);
  });
  if (nextCandidates.length !== catalog.manifest.assetCount ||
      metricMap.size !== catalog.manifest.assetCount) {
    throw new TypeError("app preview candidate reconciliation must match manifest assetCount");
  }
  activeScreenerCandidates = nextCandidates;
  activeScreenerCandidateMap = new Map(
    nextCandidates.map((candidate) => [
      `${normalizeMarket(candidate.market)}:${normalizeTicker(candidate.ticker)}`,
      candidate,
    ]),
  );
  appPreviewState = {
    enabled: true,
    status: "internal_preview_review_only",
    manifest: catalog.manifest,
    error: null,
  };
  notifyAppPreviewSubscribers();
  return getScreenerCandidateSnapshot();
}

export async function loadScreenerAppPreview(options = {}) {
  if (!isAppPreviewRuntimeEnabled(options)) return getScreenerCandidateSnapshot();
  if (!appPreviewLoadPromise || options.disableCache === true) {
    appPreviewLoadPromise = loadAppPreviewCatalog(options)
      .then(activateAppPreviewCatalog)
      .catch((error) => {
        appPreviewState = {
          enabled: true,
          status: "preview_load_error",
          manifest: null,
          error: error?.message || String(error),
        };
        notifyAppPreviewSubscribers();
        appPreviewLoadPromise = null;
        throw error;
      });
  }
  return appPreviewLoadPromise;
}

export function getScreenerCandidateSnapshot() {
  return {
    candidates: activeScreenerCandidates,
    usCandidates: activeScreenerCandidates.filter((candidate) => candidate.market === "US"),
    krCandidates: activeScreenerCandidates.filter((candidate) => candidate.market === "KR"),
    preview: { ...appPreviewState },
  };
}

export function subscribeScreenerCandidateSnapshot(subscriber) {
  if (typeof subscriber !== "function") return () => {};
  appPreviewSubscribers.add(subscriber);
  return () => appPreviewSubscribers.delete(subscriber);
}

export function findScreenerCandidateByTicker(ticker, market = "") {
  const normalizedTicker = normalizeTicker(ticker);
  const normalizedMarket = String(market || "").trim().toUpperCase();
  if (!normalizedTicker) return null;
  if (normalizedMarket) {
    const exact = activeScreenerCandidateMap.get(`${normalizedMarket}:${normalizedTicker}`);
    if (exact) return exact;
  }
  return (
    activeScreenerCandidates.find((candidate) => normalizeTicker(candidate?.ticker) === normalizedTicker && (!normalizedMarket || normalizeMarket(candidate?.market) === normalizedMarket)) ||
    activeScreenerCandidates.find((candidate) => normalizeTicker(candidate?.ticker) === normalizedTicker) ||
    null
  );
}

export function createAssetPatchFromScreenerCandidate(candidate = {}) {
  if (!candidate?.ticker) return {};
  return {
    ticker: candidate.ticker,
    displayTicker: candidate.ticker,
    providerSymbol: candidate.providerSymbol || candidate.ticker,
    name: candidate.koreanName || candidate.nameKr || candidate.ticker,
    market: candidate.market,
    currency: candidate.currency || "KRW",
    quoteCurrency: candidate.quoteCurrency || (candidate.market === "KR" ? "KRW" : "USD"),
    assetType: candidate.assetType || candidate.type || "ETF",
    cagr: candidate.expectedCagr,
    beta: candidate.beta,
    mdd: candidate.mdd,
    dividendYield: candidate.dividendYield,
    displayDividendYield: candidate.displayDividendYield,
    dividendPolicy: candidate.dividendPolicy,
    dividendSource: candidate.dividendSource,
    marketCap: candidate.marketCap,
    aum: candidate.aum,
    sizeMetric: candidate.sizeMetric,
    sizeSource: candidate.sizeSource,
    reviewTag: candidate.reviewTag,
    reviewReason: candidate.reviewReason,
    underlyingTicker: candidate.underlyingTicker,
    exposureType: candidate.exposureType,
    leverageMultiple: candidate.leverageMultiple,
    direction: candidate.direction,
    resetFrequency: candidate.resetFrequency,
    optionCoverageRatio: candidate.optionCoverageRatio,
    distributionFrequency: candidate.distributionFrequency,
    distributionType: candidate.distributionType,
    issuer: candidate.issuer,
    inceptionDate: candidate.inceptionDate,
    listingStatus: candidate.listingStatus,
    active: candidate.active,
    firstListedDate: candidate.firstListedDate,
    lastTradingDate: candidate.lastTradingDate,
    sourceCheckedAt: candidate.sourceCheckedAt,
    officialSourceUrl: candidate.officialSourceUrl,
    sourceId: candidate.sourceId,
    metricMode: candidate.metricMode || "candidate_6000_balanced_v1",
    dataSource: candidate.dataSource || "finple_app_candidates_6000_balanced_v1",
    priceCagr10y: candidate.priceCagr10y,
    rawPriceCagr10y: candidate.rawPriceCagr10y,
    rollingCagr10yMedian: candidate.rollingCagr10yMedian,
    rollingCagr10yP25: candidate.rollingCagr10yP25,
    rollingCagr10yP75: candidate.rollingCagr10yP75,
    validRollingWindowCount10y: candidate.validRollingWindowCount10y,
    selectedCagr: candidate.selectedCagr,
    cagrPolicy: candidate.cagrPolicy,
    selectedBeta: candidate.selectedBeta,
    betaPolicy: candidate.betaPolicy,
    selectedMdd: candidate.selectedMdd,
    mddPolicy: candidate.mddPolicy,
    dividendStatus: candidate.dividendStatus,
    dataStatus: candidate.dataStatus,
    metricsStatus: candidate.metricsStatus,
    reviewFlag: candidate.reviewFlag,
    rawPriceCoverageStatus: candidate.rawPriceCoverageStatus,
    priceUnavailable: candidate.priceUnavailable,
    metricBaseDate: candidate.metricBaseDate,
    metricDataThroughMonth: candidate.metricDataThroughMonth,
    metricsSource: candidate.metricsSource,
    sourceHash: candidate.sourceHash,
    rawSourceSha256: candidate.rawSourceSha256,
    normalizationVersion: candidate.normalizationVersion,
    normalizedSeriesHash: candidate.normalizedSeriesHash,
    rollingMetricVersion: candidate.rollingMetricVersion,
    pipelineVersion: candidate.pipelineVersion,
    calculationPolicyVersion: candidate.calculationPolicyVersion,
    overlayStatus: candidate.overlayStatus,
    internalPreviewReviewOnly: candidate.internalPreviewReviewOnly,
    previewLoaderEnabled: candidate.previewLoaderEnabled,
    productionPublishReady: candidate.productionPublishReady,
    appExportApproved: candidate.appExportApproved,
  };
}

export function hydrateAssetFromScreenerCandidate(asset = {}) {
  const candidate = findScreenerCandidateByTicker(asset?.ticker, asset?.market);
  if (!candidate) return asset;
  const patch = createAssetPatchFromScreenerCandidate(candidate);
  return {
    ...asset,
    ...patch,
    name: asset.name || patch.name,
    quantity: asset.quantity ?? 0,
    price: asset.price ?? 0,
    priceMode: asset.priceMode || "manual",
    cagr: patch.cagr !== undefined ? patch.cagr : asset.cagr,
    beta: patch.beta !== undefined ? patch.beta : asset.beta,
    mdd: patch.mdd !== undefined ? patch.mdd : asset.mdd,
    dividendYield: patch.internalPreviewReviewOnly
      ? patch.dividendYield
      : patch.dividendYield ?? asset.dividendYield ?? null,
    displayDividendYield: patch.displayDividendYield || asset.displayDividendYield || "",
    dividendPolicy: patch.dividendPolicy || asset.dividendPolicy || "",
    dividendSource: patch.dividendSource || asset.dividendSource || "",
    marketCap: patch.marketCap ?? asset.marketCap ?? null,
    aum: patch.aum ?? asset.aum ?? null,
    sizeMetric: patch.sizeMetric ?? asset.sizeMetric ?? null,
    sizeSource: patch.sizeSource || asset.sizeSource || "",
    reviewTag: patch.reviewTag || asset.reviewTag || "",
    reviewReason: patch.reviewReason || asset.reviewReason || "",
  };
}

export const SCREENER_CANDIDATE_COUNTS = {
  US: US_SCREENER_CANDIDATES.length,
  US_CORE: US_CORE_CANDIDATES.length,
  US_EXTRA: US_EXTRA_CANDIDATES.length,
  US_EXPANSION: US_EXPANSION_CANDIDATES.length,
  KR: KR_SCREENER_CANDIDATES.length,
  KR_ETF: KR_ETF_CANDIDATES.length,
  KR_STOCK: KR_STOCK_CANDIDATES.length,
  ALL: ALL_SCREENER_CANDIDATES.length,
  RAW_ALL: RAW_SCREENER_CANDIDATE_COUNT,
  EXCLUDED_BY_PRICE_METRICS:
    RAW_SCREENER_CANDIDATE_COUNT - ALL_SCREENER_CANDIDATES.length,
};
