const MANUAL_CASH_SOURCES = new Set([
  "preset-cash",
  "investment-mbti-cash",
  "manual-cash",
  "finple_manual_cash_reference",
]);

const LEGACY_PERSISTED_CASH_SOURCES = new Set([
  ...MANUAL_CASH_SOURCES,
  "investment-mbti",
]);

const LEGACY_CASH_NAMES = new Set([
  "현금 / 대기자금",
  "현금 / 대기자금(예적금)",
  "현금/대기자금(예적금)",
]);

export const MANUAL_CASH_POLICY_VERSION = "finple-manual-cash-v1-2pct";
export const MANUAL_CASH_REFERENCE_PRICE = 10000;
export const MANUAL_CASH_TOTAL_RETURN_PERCENT = 2.0;

const normalize = (value) => String(value || "").trim().toUpperCase();
const normalizeSource = (value) => String(value || "").trim();
const normalizeName = (value) => String(value || "").trim();

export function isManualCashAsset(asset = {}) {
  return (
    normalize(asset.ticker) === "CASH" &&
    (normalize(asset.market) === "CASH" || normalize(asset.assetType) === "CASH") &&
    MANUAL_CASH_SOURCES.has(normalizeSource(asset.dataSource))
  );
}

export function isLegacyPersistedManualCashAsset(asset = {}) {
  if (normalize(asset.ticker) !== "CASH") return false;
  if (isManualCashAsset(asset)) return true;

  const source = normalizeSource(asset.dataSource);
  if (LEGACY_PERSISTED_CASH_SOURCES.has(source)) return true;

  return (
    (!source || source === "manual") &&
    LEGACY_CASH_NAMES.has(normalizeName(asset.name)) &&
    Number(asset.price || 0) === MANUAL_CASH_REFERENCE_PRICE &&
    asset.shouldAutoLookup !== true
  );
}

export function createManualCashAssetPatch() {
  return {
    ticker: "CASH",
    market: "CASH",
    assetType: "CASH",
    expectedCagr: MANUAL_CASH_TOTAL_RETURN_PERCENT,
    cagr: MANUAL_CASH_TOTAL_RETURN_PERCENT,
    selectedCagr: MANUAL_CASH_TOTAL_RETURN_PERCENT,
    cagrPolicy: "manual_fixed_total_return_2pct",
    beta: 0,
    selectedBeta: 0,
    mdd: 0,
    selectedMdd: 0,
    dividendYield: 0,
    displayDividendYield: "0.00%",
    simulationCashYield: 0,
    reinvestmentCashYield: 0,
    dividendStatus: "confirmed_zero",
    dividendPolicy: "no_dividend",
    dividendSource: "manual_reference_policy",
    distributionType: "none",
    dataStatus: "ready",
    metricsStatus: "ready",
    reviewFlag: "none",
    overlayStatus: "manual_cash_ready",
    metricMode: "manual_cash_reference",
    dataSource: "finple_manual_cash_reference",
    manualReferencePolicyVersion: MANUAL_CASH_POLICY_VERSION,
    portfolioEligible: true,
    portfolioEligibilityStatus: "eligible",
    portfolioAddPolicy: "allow",
    simulatorReady: true,
    includeInSimulator: true,
    active: true,
    priceUnavailable: false,
  };
}

export function createManualCashAsset(overrides = {}) {
  const now = new Date().toISOString();
  return {
    ticker: "CASH",
    displayTicker: "CASH",
    providerSymbol: "CASH",
    name: "현금 / 대기자금",
    market: "CASH",
    exchange: "MANUAL",
    currency: "KRW",
    quoteCurrency: "KRW",
    displayCurrency: "KRW",
    assetType: "CASH",
    quantity: 0,
    price: MANUAL_CASH_REFERENCE_PRICE,
    targetEvaluationAmount: null,
    targetWeight: null,
    priceMode: "manual",
    cacheMode: "cash-reference",
    rawPrice: MANUAL_CASH_REFERENCE_PRICE,
    rawCurrency: "KRW",
    exchangeRate: 1,
    lookupDisabled: true,
    shouldAutoLookup: false,
    fetchedAt: now,
    lastUpdatedAt: now,
    ...overrides,
    ...createManualCashAssetPatch(),
  };
}

export function hydrateManualCashAsset(asset = {}) {
  return isManualCashAsset(asset)
    ? { ...asset, ...createManualCashAssetPatch() }
    : asset;
}

export function hydratePersistedManualCashAsset(asset = {}) {
  return isLegacyPersistedManualCashAsset(asset)
    ? { ...asset, ...createManualCashAssetPatch() }
    : asset;
}
