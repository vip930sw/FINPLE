import finpleCanonicalV2Csv from "./finple_app_candidates_v2.csv?raw";
import {
  isAppPreviewRuntimeEnabled,
  loadAppPreviewCatalog,
} from "./appPreviewDataSource";
import {
  isProductionAppExportConfigured,
  loadProductionAppExportCatalog,
} from "./productionAppExportDataSource";
import {
  isNonOrdinaryDistribution,
  resolveDistributionYieldFields,
} from "./distributionPolicy";
import { reconcileIdentityScopedAssetMetadata } from "./portfolioAssetIdentityMetadata";

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
const REQUIRED_CANONICAL_HEADERS = [
  "market",
  "ticker",
  "name",
  "assetType",
  "expectedCagr",
  "beta",
  "mdd",
  "priceMetricsStatus",
  "portfolioEligible",
  "portfolioAddPolicy",
];
const OPTIONAL_NUMERIC_HEADERS = [
  "marketCap",
  "aum",
  "expectedCagr",
  "rawPriceCagr",
  "rollingCagrMedian",
  "rollingCagrWindowYears",
  "rollingCagrWindowCount",
  "beta",
  "mdd",
  "annualizedVolatility",
  "volatilityObservationCount",
  "dividendYield",
  "trailingDistributionYield",
  "cashDistributionYieldTtm",
  "reinvestmentCashYield",
  "simulationCashYield",
  "usablePriceHistoryYears",
  "minimumPortfolioHistoryYears",
  "leverageMultiple",
  "optionCoverageRatio",
];

function validateOptionalNumericValue(value, field, rowNumber) {
  if (value === "" || value === null || value === undefined) return;
  const normalized = String(value).replaceAll(",", "").trim();
  if (!Number.isFinite(Number(normalized))) {
    throw new TypeError(
      `canonical catalog invalid numeric value at row ${rowNumber}: field=${field} value=${value}`,
    );
  }
}

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

  if (insideQuotes) {
    throw new TypeError("canonical catalog CSV parse error: unterminated quoted field");
  }
  cells.push(current);
  return cells.map((cell) => stripBom(cell).trim());
}

function parseCsv(csvText = "") {
  const lines = String(csvText || "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    throw new TypeError("canonical catalog must contain at least one data row");
  }
  const headers = parseCsvLine(lines[0]);
  const missingHeaders = REQUIRED_CANONICAL_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new TypeError(`canonical catalog missing required header: ${missingHeaders.join(", ")}`);
  }
  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    if (cells.length !== headers.length) {
      throw new TypeError(
        `canonical catalog CSV row ${index + 2} has ${cells.length} cells; expected ${headers.length}`,
      );
    }
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

export const SCREENER_METRICS_POLICY_NOTE =
  "FINPLE canonical v2 candidate universe: all assets are visible and portfolio eligibility controls addition.";

export function normalizeScreenerCandidate(row = {}) {
  const market = normalizeMarket(row.market || "US");
  const assetType = normalizeAssetType(row.assetType);
  const marketCap = toNumber(row.marketCap);
  const aum = toNumber(row.aum);
  const sizeMetric = assetType === "ETF" ? aum ?? marketCap : marketCap ?? aum;
  const nameKr = row.nameKr || row.koreanName || row.name || "";
  const expectedCagr = toNumber(row.expectedCagr);
  const rawPriceCagr = toNumber(row.rawPriceCagr);
  const rollingCagrMedian = toNumber(row.rollingCagrMedian);
  const rollingCagrWindowCount = toNumber(row.rollingCagrWindowCount);
  const beta = toNumber(row.beta);
  const mdd = toNumber(row.mdd);
  const priceMetricsStatus = row.priceMetricsStatus || "";
  const priceMetricsReady = priceMetricsStatus === "ready";
  const distributionFields = resolveDistributionYieldFields(
    {
      ...row,
      exposureType: row.exposureType || (assetType === "stock" ? "ordinary_equity" : "ordinary_etf"),
      distributionType: row.distributionType || "unknown",
    },
    row.dividendYield,
    String(row.dividendStatus || "").startsWith("confirmed_")
      ? ""
      : row.displayDividendYield,
  );

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
    expectedCagr,
    rawPriceCagr,
    rollingCagrMedian,
    rollingCagrWindowYears: toNumber(row.rollingCagrWindowYears),
    rollingCagrWindowCount,
    beta,
    mdd,
    annualizedVolatility: toNumber(row.annualizedVolatility),
    volatilityObservationCount: toNumber(row.volatilityObservationCount),
    priceDataEndDate: row.priceDataEndDate || "",
    priceBasis: row.priceBasis || "",
    priceMetricsStatus,
    reasonCode: row.reasonCode || "",
    reasonMessage: row.reasonMessage || "",
    ...distributionFields,
    dividendStatus: row.dividendStatus || "",
    dividendPolicy: row.dividendPolicy || "",
    dividendSource: row.dividendSource || "",
    marketCap,
    aum,
    sizeMetric,
    sizeSource: row.sizeSource || "",
    dataStatus: priceMetricsStatus,
    metricsStatus: priceMetricsStatus,
    reviewFlag: priceMetricsReady ? "none" : row.reviewTag || "",
    reviewTag: row.reviewTag || "",
    reviewReason: row.reviewReason || "",
    goals: splitPipe(row.goals),
    beginnerFit: toBoolean(row.beginnerFit),
    tags: splitPipe(row.tags),
    notes: row.notes || "",
    underlyingTicker: row.underlyingTicker || "",
    exposureType: row.exposureType || (assetType === "stock" ? "ordinary_equity" : "ordinary_etf"),
    leverageMultiple: toNumber(row.leverageMultiple),
    direction: row.direction || "long",
    resetFrequency: row.resetFrequency || "not_applicable",
    metadataVerificationStatus: row.metadataVerificationStatus || "",
    metadataVerificationSource: row.metadataVerificationSource || "",
    metadataVerifiedBy: row.metadataVerifiedBy || "",
    metadataVerifiedAt: row.metadataVerifiedAt || "",
    metadataVerificationReason: row.metadataVerificationReason || "",
    exposureScope: row.exposureScope || "",
    diversificationTier: row.diversificationTier || "",
    leverageRiskTier: row.leverageRiskTier || "",
    longTermSuitability: row.longTermSuitability || "",
    portfolioWarningSeverity: row.portfolioWarningSeverity || "",
    confirmationMode: row.confirmationMode || "",
    leverageWarningLabelKo: row.leverageWarningLabelKo || "",
    referenceSourceUrl: row.referenceSourceUrl || "",
    leverageMetadataRegistryActive: row.leverageMetadataRegistryActive || "",
    leverageMetadataRegistryApplied: row.leverageMetadataRegistryApplied || "",
    leverageMetadataRegistryValues: row.leverageMetadataRegistryValues || "",
    leverageMetadataRegistryFingerprint: row.leverageMetadataRegistryFingerprint || "",
    optionCoverageRatio: toNumber(row.optionCoverageRatio),
    distributionFrequency: row.distributionFrequency || "unknown",
    distributionType: row.distributionType || "unknown",
    priceHistoryStartDate: row.priceHistoryStartDate || "",
    usablePriceHistoryYears: toNumber(row.usablePriceHistoryYears),
    minimumPortfolioHistoryYears: toNumber(row.minimumPortfolioHistoryYears),
    portfolioEligible: row.portfolioEligible === "" || row.portfolioEligible === undefined
      ? undefined
      : toBoolean(row.portfolioEligible),
    portfolioEligibilityStatus: row.portfolioEligibilityStatus || "",
    portfolioEligibilityReason: row.portfolioEligibilityReason || "",
    portfolioEligibleAfterDate: row.portfolioEligibleAfterDate || "",
    cagrConfidence: row.cagrConfidence || "",
    portfolioAddPolicy: row.portfolioAddPolicy || "",
    portfolioWarningCodes: splitPipe(row.portfolioWarningCodes),
    simulationCashYield: distributionFields.simulationCashYield,
    reinvestmentCashYield: distributionFields.reinvestmentCashYield,
    distributionSimulationPolicy: distributionFields.distributionSimulationPolicy,
    cashEventBasis: row.cashEventBasis || "",
    cashEventNormalizationStatus: row.cashEventNormalizationStatus || "",
    cashEventNormalizationMethod: row.cashEventNormalizationMethod || "",
    distributionDataQualityStatus: row.distributionDataQualityStatus || "",
    distributionDataQualityReason: row.distributionDataQualityReason || "",
    issuer: row.issuer || "",
    inceptionDate: row.inceptionDate || "",
    listingStatus: row.listingStatus || "active",
    active: row.active === "" || row.active === undefined ? true : toBoolean(row.active),
    includeInSimulator:
      row.includeInSimulator === "" || row.includeInSimulator === undefined
        ? undefined
        : toBoolean(row.includeInSimulator),
    simulatorReady:
      row.simulatorReady === "" || row.simulatorReady === undefined
        ? undefined
        : toBoolean(row.simulatorReady),
    firstListedDate: row.firstListedDate || "",
    lastTradingDate: row.lastTradingDate || "",
    sourceCheckedAt: row.sourceCheckedAt || "",
    officialSourceUrl: row.officialSourceUrl || "",
    sourceId: row.sourceId || "",
    cagrPolicy: row.cagrPolicy || "",
    priceCagr10y: rawPriceCagr,
    rawPriceCagr10y: rawPriceCagr,
    rollingCagr10yMedian: rollingCagrMedian,
    validRollingWindowCount10y: rollingCagrWindowCount,
    selectedCagr: expectedCagr,
    selectedBeta: beta,
    selectedMdd: mdd,
    rawPriceCoverageStatus: priceMetricsReady ? "covered" : "missing",
    priceUnavailable: !priceMetricsReady,
    overlayStatus: priceMetricsReady
      ? "canonical_v2_ready"
      : "canonical_catalog_metric_unavailable",
    metricsSource: "finple_app_candidates_v2",
    metricMode: "canonical_v2_price_return",
    dataSource: "finple_app_candidates_v2",
    internalPreviewReviewOnly: false,
    previewLoaderEnabled: false,
    productionAppExportEnabled: false,
    productionPublishReady: false,
    appExportApproved: false,
  };
}

export function loadScreenerCandidatesFromCsv(csvText = "") {
  const seen = new Set();
  return parseCsv(csvText).map((row, index) => {
    const market = String(row.market || "").trim().toUpperCase();
    const ticker = normalizeTicker(row.ticker);
    const name = String(row.nameKr || row.koreanName || row.name || "").trim();
    if (market !== "KR" && market !== "US") {
      throw new TypeError(`canonical catalog invalid market at row ${index + 2}: ${row.market}`);
    }
    if (!ticker) throw new TypeError(`canonical catalog missing ticker at row ${index + 2}`);
    if (!name) throw new TypeError(`canonical catalog missing display name at row ${index + 2}`);
    const identity = `${market}:${ticker}`;
    if (seen.has(identity)) {
      throw new TypeError(`canonical catalog duplicate identity: ${identity}`);
    }
    seen.add(identity);
    for (const field of OPTIONAL_NUMERIC_HEADERS) {
      validateOptionalNumericValue(row[field], field, index + 2);
    }
    return normalizeScreenerCandidate({ ...row, market, ticker });
  });
}

export function createCanonicalScreenerCatalog(csvText = "") {
  return loadScreenerCandidatesFromCsv(csvText);
}

let canonicalCatalogError = null;
export const CANONICAL_SCREENER_CANDIDATES = (() => {
  try {
    return createCanonicalScreenerCatalog(finpleCanonicalV2Csv);
  } catch (error) {
    canonicalCatalogError = error;
    console.error("[FINPLE canonical catalog load error]", error);
    return [];
  }
})();

export async function loadCanonicalV2ScreenerCandidates() {
  if (canonicalCatalogError) throw canonicalCatalogError;
  return CANONICAL_SCREENER_CANDIDATES;
}

export const ALL_SCREENER_CANDIDATES = CANONICAL_SCREENER_CANDIDATES;
export const US_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter((candidate) => candidate.market === "US");
export const KR_SCREENER_CANDIDATES = ALL_SCREENER_CANDIDATES.filter((candidate) => candidate.market === "KR");
export const US_CORE_CANDIDATES = US_SCREENER_CANDIDATES.filter((candidate) => candidate.tier === "core");
export const US_EXTRA_CANDIDATES = US_SCREENER_CANDIDATES.filter((candidate) => candidate.tier !== "core");
export const US_EXPANSION_CANDIDATES = US_EXTRA_CANDIDATES;
export const KR_ETF_CANDIDATES = KR_SCREENER_CANDIDATES.filter((candidate) => candidate.type === "ETF");
export const KR_STOCK_CANDIDATES = KR_SCREENER_CANDIDATES.filter((candidate) => candidate.type === "stock");

export const PRODUCTION_APP_EXPORT_LOADING_STATUS = "production_app_export_loading";

const productionAppExportConfiguredAtStartup = isProductionAppExportConfigured();
let activeScreenerCandidates = ALL_SCREENER_CANDIDATES;
let activeScreenerCandidateMap = new Map(
  activeScreenerCandidates.map((candidate) => [
    `${normalizeMarket(candidate.market)}:${normalizeTicker(candidate.ticker)}`,
    candidate,
  ]),
);
let appExportState = {
  enabled: productionAppExportConfiguredAtStartup,
  status: canonicalCatalogError
    ? "canonical_catalog_load_error"
    : productionAppExportConfiguredAtStartup
      ? PRODUCTION_APP_EXPORT_LOADING_STATUS
      : "canonical_v2_ready",
  manifest: null,
  release: null,
  error: canonicalCatalogError?.message || null,
  operationalReasonCode: canonicalCatalogError
    ? "canonical_catalog_load_error"
    : "",
};
let appPreviewLoadPromise = null;
let productionAppExportLoadPromise = null;
const appPreviewSubscribers = new Set();

function notifyAppPreviewSubscribers() {
  const snapshot = getScreenerCandidateSnapshot();
  appPreviewSubscribers.forEach((subscriber) => subscriber(snapshot));
}

function beginProductionAppExportLoading() {
  appExportState = {
    enabled: true,
    status: PRODUCTION_APP_EXPORT_LOADING_STATUS,
    manifest: null,
    release: null,
    error: null,
    operationalReasonCode: "",
  };
  notifyAppPreviewSubscribers();
  return getScreenerCandidateSnapshot();
}

function activateAppExportState(catalog, release = null) {
  const manifest = catalog.manifest || catalog.sourceManifest;
  appExportState = {
    enabled: true,
    status: release ? "production_app_export_ready" : "internal_preview_review_only",
    manifest,
    release,
    error: null,
    operationalReasonCode: "",
  };
  notifyAppPreviewSubscribers();
  return getScreenerCandidateSnapshot();
}

export async function loadScreenerAppPreview(options = {}) {
  if (canonicalCatalogError) return getScreenerCandidateSnapshot();
  if (!isAppPreviewRuntimeEnabled(options)) return getScreenerCandidateSnapshot();
  if (!appPreviewLoadPromise || options.disableCache === true) {
    appPreviewLoadPromise = loadAppPreviewCatalog(options)
      .then((catalog) => activateAppExportState(catalog))
      .catch((error) => {
        appExportState = {
          enabled: true,
          status: "preview_load_error",
          manifest: null,
          release: null,
          error: error?.message || String(error),
          operationalReasonCode: "preview_load_error",
        };
        notifyAppPreviewSubscribers();
        appPreviewLoadPromise = null;
        throw error;
      });
  }
  return appPreviewLoadPromise;
}

function activateProductionAppExportError(
  reasonCode = "production_app_export_validation_failed",
) {
  const safeReasonCode = /^production_[a-z0-9_]+$/.test(String(reasonCode || ""))
    ? String(reasonCode)
    : "production_app_export_validation_failed";
  appExportState = {
    enabled: true,
    status: "production_app_export_error",
    manifest: null,
    release: null,
    error: safeReasonCode,
    operationalReasonCode: safeReasonCode,
  };
  console.error(`[FINPLE production app-export error] ${safeReasonCode}`);
  notifyAppPreviewSubscribers();
  return getScreenerCandidateSnapshot();
}

export async function loadScreenerProductionAppExport(options = {}) {
  if (canonicalCatalogError) return getScreenerCandidateSnapshot();
  if (!isProductionAppExportConfigured(options)) return getScreenerCandidateSnapshot();
  const shouldStartLoad =
    !productionAppExportLoadPromise ||
    (options.disableCache === true &&
      appExportState.status !== PRODUCTION_APP_EXPORT_LOADING_STATUS);
  if (shouldStartLoad) {
    if (appExportState.status !== PRODUCTION_APP_EXPORT_LOADING_STATUS ||
        activeScreenerCandidates.length !== 0) {
      beginProductionAppExportLoading();
    }
    productionAppExportLoadPromise = loadProductionAppExportCatalog(options)
      .then((catalog) => activateAppExportState(catalog, catalog.release))
      .catch((error) => {
        productionAppExportLoadPromise = null;
        activateProductionAppExportError(
          error?.code || "production_app_export_validation_failed",
        );
        return getScreenerCandidateSnapshot();
      });
  }
  return productionAppExportLoadPromise;
}

export async function loadScreenerCandidateRuntime(options = {}) {
  if (isProductionAppExportConfigured(options)) {
    return loadScreenerProductionAppExport(options);
  }
  return loadScreenerAppPreview(options);
}

export function getScreenerCandidateSnapshot() {
  return {
    candidates: activeScreenerCandidates,
    usCandidates: activeScreenerCandidates.filter((candidate) => candidate.market === "US"),
    krCandidates: activeScreenerCandidates.filter((candidate) => candidate.market === "KR"),
    preview: { ...appExportState },
    productionAppExport: { ...appExportState },
  };
}

export function subscribeScreenerCandidateSnapshot(subscriber) {
  if (typeof subscriber !== "function") return () => {};
  appPreviewSubscribers.add(subscriber);
  return () => appPreviewSubscribers.delete(subscriber);
}

export function findScreenerCandidateInCatalog(candidates = [], ticker, market = "") {
  const normalizedTicker = normalizeTicker(ticker);
  const normalizedMarket = String(market || "").trim().toUpperCase();
  if (!normalizedTicker) return null;
  const matches = candidates.filter(
    (candidate) =>
      normalizeTicker(candidate?.ticker) === normalizedTicker &&
      (!normalizedMarket || normalizeMarket(candidate?.market) === normalizedMarket),
  );
  return matches.length === 1 ? matches[0] : null;
}

export function findScreenerCandidateByTicker(ticker, market = "") {
  const normalizedTicker = normalizeTicker(ticker);
  const normalizedMarket = String(market || "").trim().toUpperCase();
  if (!normalizedTicker) return null;
  if (normalizedMarket) {
    return activeScreenerCandidateMap.get(`${normalizedMarket}:${normalizedTicker}`) || null;
  }
  return findScreenerCandidateInCatalog(activeScreenerCandidates, normalizedTicker);
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
    expectedCagr: candidate.expectedCagr,
    rawPriceCagr: candidate.rawPriceCagr,
    rollingCagrMedian: candidate.rollingCagrMedian,
    rollingCagrWindowCount: candidate.rollingCagrWindowCount,
    cagr: candidate.expectedCagr,
    beta: candidate.beta,
    mdd: candidate.mdd,
    annualizedVolatility: candidate.annualizedVolatility,
    volatilityObservationCount: candidate.volatilityObservationCount,
    priceDataEndDate: candidate.priceDataEndDate,
    priceBasis: candidate.priceBasis,
    priceMetricsStatus: candidate.priceMetricsStatus,
    reasonCode: candidate.reasonCode,
    reasonMessage: candidate.reasonMessage,
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
    metadataVerificationStatus: candidate.metadataVerificationStatus,
    metadataVerificationSource: candidate.metadataVerificationSource,
    metadataVerifiedBy: candidate.metadataVerifiedBy,
    metadataVerifiedAt: candidate.metadataVerifiedAt,
    metadataVerificationReason: candidate.metadataVerificationReason,
    exposureScope: candidate.exposureScope,
    diversificationTier: candidate.diversificationTier,
    leverageRiskTier: candidate.leverageRiskTier,
    longTermSuitability: candidate.longTermSuitability,
    portfolioWarningSeverity: candidate.portfolioWarningSeverity,
    confirmationMode: candidate.confirmationMode,
    leverageWarningLabelKo: candidate.leverageWarningLabelKo,
    referenceSourceUrl: candidate.referenceSourceUrl,
    leverageMetadataRegistryActive: candidate.leverageMetadataRegistryActive,
    leverageMetadataRegistryApplied: candidate.leverageMetadataRegistryApplied,
    leverageMetadataRegistryValues: candidate.leverageMetadataRegistryValues,
    leverageMetadataRegistryFingerprint: candidate.leverageMetadataRegistryFingerprint,
    optionCoverageRatio: candidate.optionCoverageRatio,
    distributionFrequency: candidate.distributionFrequency,
    distributionType: candidate.distributionType,
    trailingDistributionYield: candidate.trailingDistributionYield,
    cashDistributionYieldTtm: candidate.cashDistributionYieldTtm,
    distributionYieldPolicy: candidate.distributionYieldPolicy,
    distributionCalculationStatus: candidate.distributionCalculationStatus,
    priceHistoryStartDate: candidate.priceHistoryStartDate,
    usablePriceHistoryYears: candidate.usablePriceHistoryYears,
    rollingCagrWindowYears: candidate.rollingCagrWindowYears,
    minimumPortfolioHistoryYears: candidate.minimumPortfolioHistoryYears,
    portfolioEligible: candidate.portfolioEligible,
    portfolioEligibilityStatus: candidate.portfolioEligibilityStatus,
    portfolioEligibilityReason: candidate.portfolioEligibilityReason,
    portfolioEligibleAfterDate: candidate.portfolioEligibleAfterDate,
    cagrConfidence: candidate.cagrConfidence,
    portfolioAddPolicy: candidate.portfolioAddPolicy,
    portfolioWarningCodes: candidate.portfolioWarningCodes,
    simulationCashYield: candidate.simulationCashYield,
    reinvestmentCashYield: candidate.reinvestmentCashYield,
    distributionSimulationPolicy: candidate.distributionSimulationPolicy,
    cashEventBasis: candidate.cashEventBasis,
    cashEventNormalizationStatus: candidate.cashEventNormalizationStatus,
    cashEventNormalizationMethod: candidate.cashEventNormalizationMethod,
    distributionDataQualityStatus: candidate.distributionDataQualityStatus,
    distributionDataQualityReason: candidate.distributionDataQualityReason,
    includeInSimulator: candidate.includeInSimulator,
    simulatorReady: candidate.simulatorReady,
    issuer: candidate.issuer,
    inceptionDate: candidate.inceptionDate,
    listingStatus: candidate.listingStatus,
    active: candidate.active,
    firstListedDate: candidate.firstListedDate,
    lastTradingDate: candidate.lastTradingDate,
    sourceCheckedAt: candidate.sourceCheckedAt,
    officialSourceUrl: candidate.officialSourceUrl,
    sourceId: candidate.sourceId,
    reviewApprovalPolicyVersion: candidate.reviewApprovalPolicyVersion,
    reviewApprovalStatus: candidate.reviewApprovalStatus,
    reviewApprovalReason: candidate.reviewApprovalReason,
    reviewApprovalReasonCodes: candidate.reviewApprovalReasonCodes,
    reviewApprovalAudit: candidate.reviewApprovalAudit,
    metricMode: candidate.metricMode || "canonical_v2_price_return",
    dataSource: candidate.dataSource || "finple_app_candidates_v2",
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
    productionAppExportEnabled: candidate.productionAppExportEnabled,
    productionReleaseContractVersion: candidate.productionReleaseContractVersion,
    productionReleaseApprovedAt: candidate.productionReleaseApprovedAt,
    productionReleaseApprovedBy: candidate.productionReleaseApprovedBy,
    productionPublishReady: candidate.productionPublishReady,
    appExportApproved: candidate.appExportApproved,
  };
}

const ACTIVE_CATALOG_PORTFOLIO_FIELDS = Object.freeze([
  "displayTicker",
  "providerSymbol",
  "market",
  "currency",
  "quoteCurrency",
  "assetType",
  "expectedCagr",
  "rawPriceCagr",
  "rollingCagrMedian",
  "rollingCagrWindowCount",
  "cagr",
  "beta",
  "mdd",
  "annualizedVolatility",
  "volatilityObservationCount",
  "priceDataEndDate",
  "priceBasis",
  "priceMetricsStatus",
  "reasonCode",
  "reasonMessage",
  "dividendYield",
  "displayDividendYield",
  "dividendPolicy",
  "dividendSource",
  "exposureType",
  "distributionType",
  "distributionFrequency",
  "trailingDistributionYield",
  "cashDistributionYieldTtm",
  "distributionYieldPolicy",
  "distributionCalculationStatus",
  "priceHistoryStartDate",
  "usablePriceHistoryYears",
  "rollingCagrWindowYears",
  "minimumPortfolioHistoryYears",
  "portfolioEligible",
  "portfolioEligibilityStatus",
  "portfolioEligibilityReason",
  "portfolioEligibleAfterDate",
  "cagrConfidence",
  "portfolioAddPolicy",
  "portfolioWarningCodes",
  "simulationCashYield",
  "reinvestmentCashYield",
  "distributionSimulationPolicy",
  "cashEventBasis",
  "cashEventNormalizationStatus",
  "cashEventNormalizationMethod",
  "distributionDataQualityStatus",
  "distributionDataQualityReason",
  "includeInSimulator",
  "simulatorReady",
  "reviewTag",
  "reviewReason",
  "reviewApprovalPolicyVersion",
  "reviewApprovalStatus",
  "reviewApprovalReason",
  "reviewApprovalReasonCodes",
  "reviewApprovalAudit",
  "underlyingTicker",
  "leverageMultiple",
  "direction",
  "resetFrequency",
  "metadataVerificationStatus",
  "metadataVerificationSource",
  "metadataVerifiedBy",
  "metadataVerifiedAt",
  "metadataVerificationReason",
  "exposureScope",
  "diversificationTier",
  "leverageRiskTier",
  "longTermSuitability",
  "portfolioWarningSeverity",
  "confirmationMode",
  "leverageWarningLabelKo",
  "referenceSourceUrl",
  "leverageMetadataRegistryActive",
  "leverageMetadataRegistryApplied",
  "leverageMetadataRegistryValues",
  "leverageMetadataRegistryFingerprint",
  "inceptionDate",
  "officialSourceUrl",
  "sourceCheckedAt",
  "priceCagr10y",
  "rawPriceCagr10y",
  "rollingCagr10yMedian",
  "rollingCagr10yP25",
  "rollingCagr10yP75",
  "validRollingWindowCount10y",
  "selectedCagr",
  "cagrPolicy",
  "selectedBeta",
  "betaPolicy",
  "selectedMdd",
  "mddPolicy",
  "dividendStatus",
  "dataStatus",
  "metricsStatus",
  "reviewFlag",
  "rawPriceCoverageStatus",
  "priceUnavailable",
  "metricBaseDate",
  "metricDataThroughMonth",
  "metricsSource",
  "normalizationVersion",
  "rollingMetricVersion",
  "pipelineVersion",
  "calculationPolicyVersion",
  "overlayStatus",
  "internalPreviewReviewOnly",
  "previewLoaderEnabled",
  "productionAppExportEnabled",
  "productionReleaseContractVersion",
  "productionReleaseApprovedAt",
  "productionReleaseApprovedBy",
  "productionPublishReady",
  "appExportApproved",
  "metricMode",
  "dataSource",
]);

export function hydratePortfolioAssetFromActiveCatalog(
  asset = {},
  options = {},
) {
  const candidate = options.candidate ||
    findScreenerCandidateByTicker(asset?.ticker, asset?.market);
  if (!candidate) return asset;
  const patch = createAssetPatchFromScreenerCandidate(candidate);
  const catalogFields = Object.fromEntries(
    ACTIVE_CATALOG_PORTFOLIO_FIELDS
      .filter((field) => patch[field] !== undefined)
      .map((field) => [field, patch[field]]),
  );
  const identityHydratedAsset = reconcileIdentityScopedAssetMetadata(
    asset,
    {
      market: patch.market || asset?.market,
      ticker: patch.ticker || asset?.ticker,
    },
    catalogFields,
  );
  return {
    ...identityHydratedAsset,
    dividendYield: isNonOrdinaryDistribution(patch)
      ? null
      : patch.dividendYield,
    displayDividendYield: isNonOrdinaryDistribution(patch)
      ? ""
      : patch.displayDividendYield || "",
  };
}

export function hydratePortfolioFromActiveCatalog(portfolio = {}) {
  if (!portfolio || typeof portfolio !== "object" || Array.isArray(portfolio)) {
    return portfolio;
  }
  return {
    ...portfolio,
    assets: Array.isArray(portfolio.assets)
      ? portfolio.assets.map((asset) =>
          hydratePortfolioAssetFromActiveCatalog(asset)
        )
      : [],
  };
}

export function hydratePortfolioListFromActiveCatalog(portfolioList = []) {
  return Array.isArray(portfolioList)
    ? portfolioList.map(hydratePortfolioFromActiveCatalog)
    : [];
}

export function hydrateAssetFromScreenerCandidate(asset = {}) {
  return hydratePortfolioAssetFromActiveCatalog(asset);
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
  RAW_ALL: ALL_SCREENER_CANDIDATES.length,
  EXCLUDED_BY_PRICE_METRICS: 0,
};
