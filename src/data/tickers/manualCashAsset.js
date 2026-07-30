const MANUAL_CASH_SOURCES = new Set([
  "preset-cash",
  "investment-mbti-cash",
  "manual-cash",
  "finple_manual_cash_reference",
]);

const normalize = (value) => String(value || "").trim().toUpperCase();

export function isManualCashAsset(asset = {}) {
  return (
    normalize(asset.ticker) === "CASH" &&
    (normalize(asset.market) === "CASH" || normalize(asset.assetType) === "CASH") &&
    MANUAL_CASH_SOURCES.has(String(asset.dataSource || "").trim())
  );
}

export function createManualCashAssetPatch() {
  return {
    ticker: "CASH",
    market: "CASH",
    assetType: "CASH",
    expectedCagr: 2.5,
    cagr: 2.5,
    selectedCagr: 2.5,
    beta: 0,
    selectedBeta: 0,
    mdd: 0,
    selectedMdd: 0,
    dividendYield: 0,
    displayDividendYield: "0.00%",
    simulationCashYield: 0,
    reinvestmentCashYield: 0,
    dividendStatus: "confirmed_zero",
    distributionType: "none",
    dataStatus: "ready",
    metricsStatus: "ready",
    reviewFlag: "none",
    overlayStatus: "manual_cash_ready",
    metricMode: "manual_cash_reference",
    dataSource: "finple_manual_cash_reference",
    portfolioEligible: true,
    portfolioEligibilityStatus: "eligible",
    portfolioAddPolicy: "allow",
    simulatorReady: true,
    includeInSimulator: true,
    active: true,
    priceUnavailable: false,
  };
}

export function hydrateManualCashAsset(asset = {}) {
  return isManualCashAsset(asset)
    ? { ...asset, ...createManualCashAssetPatch() }
    : asset;
}
