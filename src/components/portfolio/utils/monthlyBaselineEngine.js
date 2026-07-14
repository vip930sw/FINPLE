export const MONTHLY_BASELINE_ENGINE_VERSION = "monthly-baseline-v1-step114-2e";
export const LEGACY_MAY_APP_READY_COMPATIBILITY_VERSION = "legacy-may-app-ready-compat-v1-step114-2e";

const EPSILON = 1e-9;
const APPROVED_CALCULATION_POLICY_VERSIONS = new Set([
  "monthly-baseline-fixture-v1-step114-2e",
  "metrics-calculation-policy-2026-06-26",
]);
const APPROVED_PIPELINE_VERSIONS = new Set([
  "monthly-baseline-fixture-pipeline-v1-step114-2e",
  "metrics-v3.0-step114-2d",
  "legacy-may-app-ready-loader-v1",
  LEGACY_MAY_APP_READY_COMPATIBILITY_VERSION,
]);

const LEGACY_MAY_APP_READY_SOURCES = new Map([
  [
    "us_price_metrics_overlay_20260528_app_ready",
    {
      market: "US",
      metricMode: "us_price_metrics_overlay_price_close",
      pipelineVersion: "legacy-may-app-ready-loader-v1",
      sourceHash: "9df1ffa8f19b68f41b63699e3e8bd1d82c7720c1acc9786b48b28040ed56ceec",
    },
  ],
  [
    "kr_price_metrics_overlay_20260528_app_ready",
    {
      market: "KR",
      metricMode: "kr_price_metrics_overlay_price_close",
      pipelineVersion: "legacy-may-app-ready-loader-v1",
      sourceHash: "4e683d29181f9deb49dbea74faea1c6af573a67e2beb0909c1ce11e66ca19002",
    },
  ],
]);

function toFiniteNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasOwnValue(object, field) {
  return Object.prototype.hasOwnProperty.call(Object(object), field);
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeMarket(value) {
  return String(value || "").trim().toUpperCase();
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function addBlockReason(reasons, code, detail = "") {
  reasons.push(detail ? `${code}:${detail}` : code);
}

function parseBooleanLike(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return null;
}

function hasLegacyMayLoaderEvidence(asset = {}, legacy) {
  const metricMode = String(asset.metricMode || "").trim();
  const dataSource = String(asset.dataSource || "");
  const explicitEvidence = parseBooleanLike(asset.legacyAppReadyEvidence) === true;
  return (
    explicitEvidence ||
    (metricMode === legacy.metricMode && dataSource.includes(String(asset.metricsSource || "").trim()))
  );
}

function isLegacyMayAppReadySource(asset = {}) {
  const source = String(asset.metricsSource || "").trim();
  const legacy = LEGACY_MAY_APP_READY_SOURCES.get(source);
  if (!legacy) return false;
  const market = normalizeMarket(asset.market);
  return (!market || market === legacy.market) && hasLegacyMayLoaderEvidence(asset, legacy);
}

function adaptMetricMetadata(asset = {}) {
  if (!isLegacyMayAppReadySource(asset)) {
    return { ...asset, compatibilityAdapter: "" };
  }

  const source = String(asset.metricsSource || "").trim();
  const legacy = LEGACY_MAY_APP_READY_SOURCES.get(source);
  return {
    ...asset,
    dataStatus: asset.dataStatus || "ready",
    metricsStatus: asset.metricsStatus || "ready",
    reviewFlag: asset.reviewFlag || asset.reviewTag || "none",
    reviewTag: asset.reviewTag || "none",
    overlayStatus: asset.overlayStatus || "app_ready",
    productionPublishReady: asset.productionPublishReady ?? true,
    appExportApproved: asset.appExportApproved ?? true,
    metricBaseDate: asset.metricBaseDate || "2026-05-28",
    sourceHash: asset.sourceHash || legacy.sourceHash,
    pipelineVersion: asset.pipelineVersion || legacy.pipelineVersion,
    calculationPolicyVersion: asset.calculationPolicyVersion || "metrics-calculation-policy-2026-06-26",
    compatibilityAdapter: LEGACY_MAY_APP_READY_COMPATIBILITY_VERSION,
  };
}

function validateReadyStatus(metadata, field, allowedValues, reasons, ticker) {
  const value = normalizeStatus(metadata[field]);
  if (!value) {
    addBlockReason(reasons, "missing_metric_status", `${ticker}.${field}`);
    return;
  }
  if (!allowedValues.has(value)) {
    addBlockReason(reasons, "unsupported_metric_status", `${ticker}.${field}=${value}`);
  }
}

function validateRequiredLineage(metadata, reasons, ticker) {
  for (const field of ["metricBaseDate", "metricsSource", "calculationPolicyVersion", "pipelineVersion"]) {
    if (isBlank(metadata[field])) addBlockReason(reasons, "missing_metric_lineage", `${ticker}.${field}`);
  }

  if (isBlank(metadata.sourceHash) && isBlank(metadata.normalizedSeriesHash)) {
    addBlockReason(reasons, "missing_metric_lineage", `${ticker}.sourceHash_or_normalizedSeriesHash`);
  }

  if (!APPROVED_CALCULATION_POLICY_VERSIONS.has(String(metadata.calculationPolicyVersion || "").trim())) {
    addBlockReason(
      reasons,
      "unsupported_calculation_policy_version",
      `${ticker}.${metadata.calculationPolicyVersion || "missing"}`,
    );
  }

  if (!APPROVED_PIPELINE_VERSIONS.has(String(metadata.pipelineVersion || "").trim())) {
    addBlockReason(
      reasons,
      "unsupported_pipeline_version",
      `${ticker}.${metadata.pipelineVersion || "missing"}`,
    );
  }
}

function validatePublishApproval(metadata, reasons, ticker) {
  const productionPublishReady = parseBooleanLike(metadata.productionPublishReady);
  const appExportApproved = parseBooleanLike(metadata.appExportApproved);
  if (productionPublishReady !== true) {
    addBlockReason(reasons, "metric_source_not_publish_approved", `${ticker}.productionPublishReady`);
  }
  if (appExportApproved !== true) {
    addBlockReason(reasons, "metric_source_not_publish_approved", `${ticker}.appExportApproved`);
  }
}

function validateAnnualPercentValue(value, label, reasons, allowNull = false) {
  const number = toFiniteNumber(value);
  if (number === null) {
    if (!allowNull) addBlockReason(reasons, "invalid_rate", `${label}=missing`);
    return null;
  }
  if (number <= -100) {
    addBlockReason(reasons, "invalid_rate", `${label}=${number}`);
    return null;
  }
  return number;
}

function validateRawFiniteNumber(value, label, reasons, { required = false, min = -Infinity, integer = false } = {}) {
  if (isBlank(value)) {
    if (required) addBlockReason(reasons, "invalid_setting", `${label}=missing`);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    addBlockReason(reasons, "invalid_setting", `${label}=${String(value)}`);
    return null;
  }
  if (number < min) {
    addBlockReason(reasons, "invalid_setting", `${label}=${number}`);
    return null;
  }
  if (integer && !Number.isInteger(number)) {
    addBlockReason(reasons, "invalid_setting", `${label}=${number}`);
    return null;
  }
  return number;
}

export function annualPercentToMonthlyRate(annualPercent, label = "annualPercent") {
  const value = toFiniteNumber(annualPercent);
  if (value === null) {
    throw new TypeError(`${label} must be a finite number`);
  }
  const annualRate = value / 100;
  if (annualRate <= -1) {
    throw new RangeError(`${label} must be greater than -100`);
  }
  return (1 + annualRate) ** (1 / 12) - 1;
}

function getAssetActualValue(asset = {}) {
  const quantity = toFiniteNumber(asset.quantity, 0);
  const price = toFiniteNumber(asset.price, 0);
  const value = quantity * price;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetPlannedValue(asset = {}) {
  const value = toFiniteNumber(asset.targetEvaluationAmount, 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAssetWeightValue(asset = {}) {
  return getAssetPlannedValue(asset) || getAssetActualValue(asset);
}

function getAnnualCagr(asset = {}) {
  return toFiniteNumber(
    asset.selectedCagrAnnual ?? asset.selectedCagr ?? asset.expectedCagr ?? asset.cagr ?? asset.priceCagr10y,
  );
}

function getAnnualDividendYield(asset = {}) {
  return toFiniteNumber(asset.dividendYieldAnnual ?? asset.dividendYield);
}

function isDividendMissing(asset = {}) {
  return isBlank(asset.dividendYieldAnnual ?? asset.dividendYield);
}

function sortAssetsForDeterminism(assets) {
  return [...assets].sort((a, b) => {
    const marketCompare = normalizeMarket(a?.market).localeCompare(normalizeMarket(b?.market));
    if (marketCompare !== 0) return marketCompare;
    const tickerCompare = normalizeTicker(a?.ticker).localeCompare(normalizeTicker(b?.ticker));
    if (tickerCompare !== 0) return tickerCompare;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
}

function hasAnyTargetWeightField(assets) {
  return assets.some((asset) => !isBlank(asset?.targetWeight));
}

function normalizeTargetShares(assets, weightBaseValue) {
  if (hasAnyTargetWeightField(assets)) {
    const rawWeights = assets.map((asset, index) => {
      const weight = toFiniteNumber(asset.targetWeight);
      if (weight === null) {
        throw new RangeError(`targetWeight[${index}] must be finite`);
      }
      if (weight < 0) {
        throw new RangeError(`targetWeight[${index}] must be non-negative`);
      }
      return weight;
    });
    const rawTotal = rawWeights.reduce((sum, value) => sum + value, 0);
    const divisor = rawTotal > 1.5 ? 100 : 1;
    const total = rawTotal / divisor;
    if (Math.abs(total - 1) > 0.000001) {
      throw new RangeError(`targetWeight values must sum to 1 or 100, got ${rawTotal}`);
    }
    return rawWeights.map((value) => value / divisor);
  }

  if (weightBaseValue > 0) {
    return assets.map((asset) => getAssetWeightValue(asset) / weightBaseValue);
  }

  throw new RangeError("target weights require explicit weights or positive asset values");
}

function validateAssetMetricSource(rawAsset, index, dividendReinvest) {
  const reasons = [];
  const metadata = adaptMetricMetadata(rawAsset || {});
  const ticker = normalizeTicker(metadata.ticker) || `asset_${index}`;

  if (isBlank(metadata.ticker)) {
    addBlockReason(reasons, "missing_ticker", `asset_${index}`);
  }

  validateReadyStatus(metadata, "dataStatus", new Set(["ready"]), reasons, ticker);
  validateReadyStatus(metadata, "metricsStatus", new Set(["ready"]), reasons, ticker);
  validateReadyStatus(metadata, "reviewFlag", new Set(["none"]), reasons, ticker);
  validateReadyStatus(metadata, "overlayStatus", new Set(["app_ready", "ready"]), reasons, ticker);
  validatePublishApproval(metadata, reasons, ticker);
  validateRequiredLineage(metadata, reasons, ticker);

  if (getAnnualCagr(metadata) === null) {
    addBlockReason(reasons, "missing_selected_cagr", ticker);
  }

  validateAnnualPercentValue(getAnnualCagr(metadata), `${ticker}.selectedCagrAnnual`, reasons);

  const dividendYield = getAnnualDividendYield(metadata);
  if (dividendReinvest && isDividendMissing(metadata)) {
    addBlockReason(reasons, "missing_dividend_yield_for_reinvestment", ticker);
  } else if (dividendYield !== null) {
    validateAnnualPercentValue(dividendYield, `${ticker}.dividendYieldAnnual`, reasons);
    if (dividendYield < 0) addBlockReason(reasons, "invalid_dividend_yield", `${ticker}=${dividendYield}`);
  }

  return { reasons, metadata };
}

function normalizeAssetInput(asset, index, targetWeight, dividendReinvest) {
  const ticker = normalizeTicker(asset.ticker);
  const annualPriceCagr = getAnnualCagr(asset);
  const annualDividendYield = getAnnualDividendYield(asset);
  const dividendYieldForCalculation = annualDividendYield === null ? null : annualDividendYield;

  return {
    ticker,
    displayTicker: String(asset.displayTicker || asset.ticker || ticker),
    market: normalizeMarket(asset.market),
    targetWeight,
    annualPriceCagr,
    annualDividendYield: dividendYieldForCalculation,
    monthlyPriceRate: annualPercentToMonthlyRate(annualPriceCagr, `assets[${index}].selectedCagrAnnual`),
    monthlyDividendRate:
      dividendYieldForCalculation === null
        ? null
        : annualPercentToMonthlyRate(dividendYieldForCalculation, `assets[${index}].dividendYieldAnnual`),
    beta: toFiniteNumber(asset.beta ?? asset.selectedBeta, null),
    mdd: toFiniteNumber(asset.mdd ?? asset.selectedMdd, null),
    dividendIncludedInReturn: Boolean(dividendReinvest && dividendYieldForCalculation !== null),
    metricLineage: {
      compatibilityAdapter: asset.compatibilityAdapter || "",
      metricMode: asset.metricMode || "",
      dataSource: asset.dataSource || "",
      metricsSource: asset.metricsSource || "",
      sourceHash: asset.sourceHash || "",
      rawSourceSha256: asset.rawSourceSha256 || "",
      normalizationVersion: asset.normalizationVersion || "",
      normalizedSeriesHash: asset.normalizedSeriesHash || "",
      rollingMetricVersion: asset.rollingMetricVersion || "",
      pipelineVersion: asset.pipelineVersion || "",
      metricBaseDate: asset.metricBaseDate || "",
      calculationPolicyVersion: asset.calculationPolicyVersion || "",
    },
  };
}

function createBlockedResult({ settings, assets, blockReasons, totalAssetValue, simulationStartValue, weightBaseValue }) {
  return {
    baselineEngineVersion: MONTHLY_BASELINE_ENGINE_VERSION,
    status: "blocked",
    ready: false,
    blockReasons,
    settings,
    assets,
    totalAssetValue,
    simulationStartValue,
    weightBaseValue,
    yearlyContribution: Number(settings.monthlyCashFlow || 0) * 12,
    expectedCagr: null,
    expectedDividendYield: null,
    expectedBeta: null,
    simpleMdd: null,
    expectedCalmar: null,
    expectedAnnualDividend: null,
    monthlyBaselinePoints: [],
    performanceRows: [],
    futureValue: null,
    inflationAdjustedFutureValue: null,
    cumulativeDividendResult: null,
    cumulativePriceGainResult: null,
    summary: {
      initialInvestment: simulationStartValue,
      monthlyContribution: Number(settings.monthlyCashFlow || 0),
      cumulativeContributions: simulationStartValue,
      endingValueNominal: null,
      endingValueReal: null,
      investmentGainNominal: null,
      cumulativePriceGain: null,
      cumulativeDividendCashFlow: null,
      cumulativeExternalDividendCashFlow: null,
      endingValuePlusExternalDividends: null,
      contributionExcludedIndex: null,
      priceOnlyContributionExcludedIndex: null,
      totalReturnContributionExcludedIndex: null,
      blocked: true,
    },
    step3BlockedState: {
      status: "blocked",
      operatorAction: "review_metric_source_before_baseline",
      userFacingState: "baseline_unavailable",
    },
  };
}

function monthLabel(monthIndex) {
  return monthIndex === 0 ? "M0" : `M${monthIndex}`;
}

function roundNumber(value, digits = 6) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(digits));
}

function buildAnnualRows(points, monthlyContribution) {
  const rows = [];
  let previousDividend = 0;
  let previousExternalDividend = 0;
  let previousPriceGain = 0;
  let previousTotalGain = 0;

  for (const point of points) {
    if (point.monthIndex === 0 || point.monthIndex % 12 !== 0) continue;
    const year = point.monthIndex / 12;
    const annualDividend = point.cumulativeDividendCashFlow - previousDividend;
    const annualExternalDividend = point.cumulativeExternalDividendCashFlow - previousExternalDividend;
    const annualProfit = point.cumulativePriceGain - previousPriceGain;
    const annualTotalInvestmentGain = point.investmentGainNominal - previousTotalGain;
    rows.push({
      year,
      annualContribution: monthlyContribution * 12,
      annualDividend,
      annualExternalDividend,
      annualProfit,
      annualPriceGain: annualProfit,
      annualTotalInvestmentGain,
      cumulativeContribution: point.cumulativeContributions,
      cumulativeDividend: point.cumulativeDividendCashFlow,
      cumulativeExternalDividend: point.cumulativeExternalDividendCashFlow,
      cumulativeProfit: point.cumulativePriceGain,
      cumulativePriceGain: point.cumulativePriceGain,
      cumulativeTotalInvestmentGain: point.investmentGainNominal,
      endingValue: point.portfolioValueNominal,
      inflationAdjustedValue: point.portfolioValueReal,
      baselineMonthIndex: point.monthIndex,
    });
    previousDividend = point.cumulativeDividendCashFlow;
    previousExternalDividend = point.cumulativeExternalDividendCashFlow;
    previousPriceGain = point.cumulativePriceGain;
    previousTotalGain = point.investmentGainNominal;
  }

  return rows;
}

function sortPortfoliosForDeterminism(portfolios) {
  return [...portfolios].sort((a, b) => String(a?.id || "").localeCompare(String(b?.id || "")));
}

function findDuplicatePortfolioIds(portfolios) {
  const seen = new Set();
  const duplicates = new Set();
  for (const portfolio of portfolios) {
    const id = String(portfolio?.id || "").trim();
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return duplicates;
}

function normalizeRawSettings(settings = {}) {
  const settingsIsObject = settings && typeof settings === "object" && !Array.isArray(settings);
  const safeSettings = settingsIsObject ? settings : {};
  const validationReasons = [];
  if (!settingsIsObject) addBlockReason(validationReasons, "invalid_settings", "settings must be an object");

  const hasInvestmentMonths = hasOwnValue(safeSettings, "investmentMonths");
  const hasYears = hasOwnValue(safeSettings, "years");
  const hasMonthlyContribution = hasOwnValue(safeSettings, "monthlyCashFlow");
  const hasInflationRate = hasOwnValue(safeSettings, "inflationRate");
  const hasStartValue = hasOwnValue(safeSettings, "startValue");
  let rawInvestmentMonths = 0;
  if (hasInvestmentMonths) {
    rawInvestmentMonths = validateRawFiniteNumber(safeSettings.investmentMonths, "investmentMonths", validationReasons, { min: 0, integer: true });
  } else if (hasYears) {
    const years = validateRawFiniteNumber(safeSettings.years, "years", validationReasons, { min: 0 });
    rawInvestmentMonths = years === null ? null : years * 12;
    if (rawInvestmentMonths !== null && !Number.isInteger(rawInvestmentMonths)) {
      addBlockReason(validationReasons, "invalid_setting", `investmentMonths=${rawInvestmentMonths}`);
    }
  }
  const rawMonthlyContribution = hasMonthlyContribution
    ? validateRawFiniteNumber(safeSettings.monthlyCashFlow, "monthlyCashFlow", validationReasons, { min: 0 })
    : 0;
  const rawInflationRate = hasInflationRate
    ? validateRawFiniteNumber(safeSettings.inflationRate, "inflationRate", validationReasons)
    : 0;
  const rawStartValue = hasStartValue
    ? validateRawFiniteNumber(safeSettings.startValue, "startValue", validationReasons, { min: 0 })
    : 0;
  const dividendReinvest =
    safeSettings.dividendReinvest !== undefined ? parseBooleanLike(safeSettings.dividendReinvest) : true;
  if (dividendReinvest === null) {
    addBlockReason(validationReasons, "invalid_setting", `dividendReinvest=${String(safeSettings.dividendReinvest)}`);
  }

  return {
    validationReasons,
    hasStartValue,
    rawInvestmentMonths,
    rawMonthlyContribution,
    rawInflationRate,
    rawStartValue,
    dividendReinvest: dividendReinvest ?? true,
  };
}

export function buildMonthlyBaselineProjection({
  portfolioId = "",
  settings = {},
  assets = [],
  forcedBlockReasons = [],
} = {}) {
  const rawSettings = normalizeRawSettings(settings);
  const assetList = Array.isArray(assets) ? sortAssetsForDeterminism(assets) : [];
  const totalAssetValue = assetList.reduce((sum, asset) => sum + getAssetWeightValue(asset || {}), 0);
  const simulationStartValue = rawSettings.rawStartValue > 0 ? rawSettings.rawStartValue : totalAssetValue;
  const weightBaseValue = totalAssetValue > 0 ? totalAssetValue : simulationStartValue;
  const investmentMonths = rawSettings.rawInvestmentMonths === null ? 0 : rawSettings.rawInvestmentMonths;
  const monthlyContribution = rawSettings.rawMonthlyContribution ?? 0;

  const baseSettings = {
    portfolioId,
    investmentMonths,
    monthlyCashFlow: monthlyContribution,
    years: investmentMonths / 12,
    dividendReinvest: rawSettings.dividendReinvest,
    inflationRate: rawSettings.rawInflationRate,
    startValue: simulationStartValue,
  };

  const blockReasons = [...forcedBlockReasons, ...rawSettings.validationReasons];
  if (!Array.isArray(assets)) addBlockReason(blockReasons, "invalid_assets", "assets must be an array");
  if (assetList.length === 0) addBlockReason(blockReasons, "missing_assets");
  if (assetList.some((asset) => !asset || typeof asset !== "object" || Array.isArray(asset))) {
    addBlockReason(blockReasons, "invalid_asset_entry", "assets must contain objects");
  }
  if (simulationStartValue <= 0) addBlockReason(blockReasons, "missing_initial_investment");
  if (rawSettings.hasStartValue && (rawSettings.rawStartValue === null || rawSettings.rawStartValue <= 0)) {
    addBlockReason(blockReasons, "invalid_start_value", String(rawSettings.rawStartValue));
  }
  if (rawSettings.rawInvestmentMonths === null || rawSettings.rawInvestmentMonths < 0) {
    addBlockReason(blockReasons, "invalid_investment_months", String(rawSettings.rawInvestmentMonths));
  }
  if (rawSettings.rawInvestmentMonths !== null && !Number.isInteger(rawSettings.rawInvestmentMonths)) {
    addBlockReason(blockReasons, "invalid_investment_months", String(rawSettings.rawInvestmentMonths));
  }
  if (rawSettings.rawMonthlyContribution === null || rawSettings.rawMonthlyContribution < 0) {
    addBlockReason(blockReasons, "invalid_monthly_contribution", String(rawSettings.rawMonthlyContribution));
  }
  validateAnnualPercentValue(rawSettings.rawInflationRate, "inflationRate", blockReasons);

  const validatedAssets = [];
  const assetIdentitySet = new Set();
  for (const [index, asset] of assetList.entries()) {
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) continue;
    const validation = validateAssetMetricSource(asset, index, rawSettings.dividendReinvest);
    blockReasons.push(...validation.reasons);
    const identity = `${normalizeMarket(validation.metadata.market)}:${normalizeTicker(validation.metadata.ticker)}`;
    if (assetIdentitySet.has(identity)) {
      addBlockReason(blockReasons, "duplicate_asset_identity", identity);
    }
    assetIdentitySet.add(identity);
    validatedAssets.push(validation.metadata);
  }

  let targetShares = [];
  if (blockReasons.length === 0) {
    try {
      targetShares = normalizeTargetShares(validatedAssets, weightBaseValue);
    } catch (error) {
      addBlockReason(blockReasons, "invalid_target_weights", error.message);
    }
  }

  if (blockReasons.length > 0) {
    return createBlockedResult({
      settings: baseSettings,
      assets: validatedAssets.length > 0 ? validatedAssets : assetList,
      blockReasons,
      totalAssetValue,
      simulationStartValue,
      weightBaseValue,
    });
  }

  const normalizedAssets = validatedAssets.map((asset, index) =>
    normalizeAssetInput(asset, index, targetShares[index], rawSettings.dividendReinvest),
  );

  const monthlyInflationRate = annualPercentToMonthlyRate(baseSettings.inflationRate, "inflationRate");
  const expectedCagr = normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.annualPriceCagr, 0);
  const hasMissingDividendYield = normalizedAssets.some((asset) => asset.annualDividendYield === null);
  const expectedDividendYield = hasMissingDividendYield
    ? null
    : normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.annualDividendYield, 0);
  const expectedBeta = normalizedAssets.some((asset) => asset.beta === null)
    ? null
    : normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.beta, 0);
  const simpleMdd = normalizedAssets.some((asset) => asset.mdd === null)
    ? null
    : normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.mdd, 0);
  const expectedCalmar = simpleMdd !== null && Math.abs(simpleMdd) > EPSILON ? expectedCagr / Math.abs(simpleMdd) : null;
  const expectedMonthlyDividendOnInitial =
    expectedDividendYield === null ? null : normalizedAssets.reduce((sum, asset) => {
      if (asset.monthlyDividendRate === null) return sum;
      return sum + simulationStartValue * asset.targetWeight * asset.monthlyDividendRate;
    }, 0);
  const expectedAnnualDividend =
    expectedMonthlyDividendOnInitial === null ? null : expectedMonthlyDividendOnInitial * 12;

  const sleeveValues = normalizedAssets.map((asset) => simulationStartValue * asset.targetWeight);
  let cumulativeContributions = simulationStartValue;
  let cumulativeDividendCashFlow = 0;
  let cumulativeExternalDividendCashFlow = 0;
  let cumulativePriceGain = 0;
  let priceOnlyContributionExcludedIndex = 100;
  let totalReturnContributionExcludedIndex = 100;
  const monthlyBaselinePoints = [];

  monthlyBaselinePoints.push({
    monthIndex: 0,
    periodLabel: monthLabel(0),
    portfolioValueNominal: roundNumber(simulationStartValue),
    portfolioValueReal: roundNumber(simulationStartValue),
    cumulativeContributions: roundNumber(cumulativeContributions),
    investmentGainNominal: 0,
    cumulativePriceGain: 0,
    contributionExcludedIndex: 100,
    priceOnlyContributionExcludedIndex: 100,
    totalReturnContributionExcludedIndex: 100,
    monthlyContributionApplied: 0,
    monthlyPriceReturnApplied: 0,
    monthlyPriceReturnRate: 0,
    monthlyContributionExcludedReturn: 0,
    monthlyPriceOnlyContributionExcludedReturn: 0,
    monthlyTotalReturnContributionExcludedReturn: 0,
    monthlyDividendCashFlow: 0,
    cumulativeDividendCashFlow: 0,
    monthlyExternalDividendCashFlow: 0,
    cumulativeExternalDividendCashFlow: 0,
  });

  for (let monthIndex = 1; monthIndex <= investmentMonths; monthIndex += 1) {
    for (const [index, asset] of normalizedAssets.entries()) {
      sleeveValues[index] += monthlyContribution * asset.targetWeight;
    }

    const startValueAfterContribution = sleeveValues.reduce((sum, value) => sum + value, 0);
    let monthlyPriceReturnAmount = 0;
    let monthlyDividendCashFlow = 0;
    let monthlyExternalDividendCashFlow = 0;

    for (const [index, asset] of normalizedAssets.entries()) {
      const baseValue = sleeveValues[index];
      const priceReturn = baseValue * asset.monthlyPriceRate;
      const dividendFlow = asset.monthlyDividendRate === null ? 0 : baseValue * asset.monthlyDividendRate;
      monthlyPriceReturnAmount += priceReturn;
      monthlyDividendCashFlow += dividendFlow;
      if (!asset.dividendIncludedInReturn) monthlyExternalDividendCashFlow += dividendFlow;
      sleeveValues[index] += priceReturn + (asset.dividendIncludedInReturn ? dividendFlow : 0);
    }

    cumulativeContributions += monthlyContribution;
    cumulativeDividendCashFlow += monthlyDividendCashFlow;
    cumulativeExternalDividendCashFlow += monthlyExternalDividendCashFlow;
    cumulativePriceGain += monthlyPriceReturnAmount;
    const monthlyPriceOnlyContributionExcludedReturn =
      startValueAfterContribution > 0
        ? monthlyPriceReturnAmount / startValueAfterContribution
        : 0;
    const monthlyTotalReturnContributionExcludedReturn =
      startValueAfterContribution > 0
        ? (monthlyPriceReturnAmount + monthlyDividendCashFlow) / startValueAfterContribution
        : 0;
    priceOnlyContributionExcludedIndex *= 1 + monthlyPriceOnlyContributionExcludedReturn;
    totalReturnContributionExcludedIndex *= 1 + monthlyTotalReturnContributionExcludedReturn;

    const portfolioValueNominal = sleeveValues.reduce((sum, value) => sum + value, 0);
    const inflationDivisor = (1 + monthlyInflationRate) ** monthIndex;
    const portfolioValueReal = portfolioValueNominal / inflationDivisor;
    const investmentGainNominal = portfolioValueNominal - cumulativeContributions;

    monthlyBaselinePoints.push({
      monthIndex,
      periodLabel: monthLabel(monthIndex),
      portfolioValueNominal: roundNumber(portfolioValueNominal),
      portfolioValueReal: roundNumber(portfolioValueReal),
      cumulativeContributions: roundNumber(cumulativeContributions),
      investmentGainNominal: roundNumber(investmentGainNominal),
      cumulativePriceGain: roundNumber(cumulativePriceGain),
      contributionExcludedIndex: roundNumber(totalReturnContributionExcludedIndex),
      priceOnlyContributionExcludedIndex: roundNumber(priceOnlyContributionExcludedIndex),
      totalReturnContributionExcludedIndex: roundNumber(totalReturnContributionExcludedIndex),
      monthlyContributionApplied: roundNumber(monthlyContribution),
      monthlyPriceReturnApplied: roundNumber(monthlyPriceReturnAmount),
      monthlyPriceReturnRate: roundNumber(monthlyPriceReturnAmount / startValueAfterContribution, 10),
      monthlyContributionExcludedReturn: roundNumber(monthlyTotalReturnContributionExcludedReturn, 10),
      monthlyPriceOnlyContributionExcludedReturn: roundNumber(monthlyPriceOnlyContributionExcludedReturn, 10),
      monthlyTotalReturnContributionExcludedReturn: roundNumber(monthlyTotalReturnContributionExcludedReturn, 10),
      monthlyDividendCashFlow: roundNumber(monthlyDividendCashFlow),
      cumulativeDividendCashFlow: roundNumber(cumulativeDividendCashFlow),
      monthlyExternalDividendCashFlow: roundNumber(monthlyExternalDividendCashFlow),
      cumulativeExternalDividendCashFlow: roundNumber(cumulativeExternalDividendCashFlow),
    });
  }

  const performanceRows = buildAnnualRows(monthlyBaselinePoints, monthlyContribution);
  const lastPoint = monthlyBaselinePoints[monthlyBaselinePoints.length - 1];
  const expectedAnnualDividendResult =
    expectedDividendYield === null ? null : performanceRows[0]?.annualDividend ?? expectedAnnualDividend;

  return {
    baselineEngineVersion: MONTHLY_BASELINE_ENGINE_VERSION,
    status: "ready",
    ready: true,
    blockReasons: [],
    settings: baseSettings,
    assets: normalizedAssets,
    totalAssetValue,
    simulationStartValue,
    weightBaseValue,
    yearlyContribution: monthlyContribution * 12,
    expectedCagr,
    expectedDividendYield,
    expectedBeta,
    simpleMdd,
    expectedCalmar,
    expectedAnnualDividend: expectedAnnualDividendResult,
    monthlyBaselinePoints,
    performanceRows,
    futureValue: lastPoint.portfolioValueNominal,
    inflationAdjustedFutureValue: lastPoint.portfolioValueReal,
    cumulativeDividendResult: lastPoint.cumulativeDividendCashFlow,
    cumulativePriceGainResult: lastPoint.cumulativePriceGain,
    cumulativeExternalDividendResult: lastPoint.cumulativeExternalDividendCashFlow,
    endingValuePlusExternalDividends: roundNumber(lastPoint.portfolioValueNominal + lastPoint.cumulativeExternalDividendCashFlow),
    summary: {
      initialInvestment: simulationStartValue,
      monthlyContribution,
      cumulativeContributions: lastPoint.cumulativeContributions,
      endingValueNominal: lastPoint.portfolioValueNominal,
      endingValueReal: lastPoint.portfolioValueReal,
      investmentGainNominal: lastPoint.investmentGainNominal,
      cumulativePriceGain: lastPoint.cumulativePriceGain,
      cumulativeDividendCashFlow: lastPoint.cumulativeDividendCashFlow,
      cumulativeExternalDividendCashFlow: lastPoint.cumulativeExternalDividendCashFlow,
      endingValuePlusExternalDividends: roundNumber(lastPoint.portfolioValueNominal + lastPoint.cumulativeExternalDividendCashFlow),
      contributionExcludedIndex: lastPoint.contributionExcludedIndex,
      priceOnlyContributionExcludedIndex: lastPoint.priceOnlyContributionExcludedIndex,
      totalReturnContributionExcludedIndex: lastPoint.totalReturnContributionExcludedIndex,
      baselineAnnualAssumption: expectedCagr,
      baselineDividendAssumption: expectedDividendYield,
      mddReference: simpleMdd,
      betaReference: expectedBeta,
    },
  };
}

export function buildStep2MonthlyBaselineComparison({ portfolios = [], activePortfolioId = "", assets = [], settings = {} } = {}) {
  const portfolioList = Array.isArray(portfolios) ? portfolios : [];
  const duplicatePortfolioIds = findDuplicatePortfolioIds(portfolioList);
  return sortPortfoliosForDeterminism(portfolioList).map((portfolio) => {
    const portfolioAssets = portfolio.id === activePortfolioId ? assets : portfolio.assets;
    const sortedPortfolioAssets = Array.isArray(portfolioAssets) ? sortAssetsForDeterminism(portfolioAssets) : portfolioAssets;
    const forcedBlockReasons = duplicatePortfolioIds.has(String(portfolio?.id || "").trim())
      ? [`duplicate_portfolio_id:${String(portfolio?.id || "").trim()}`]
      : [];
    return {
      ...portfolio,
      settings,
      assets: sortedPortfolioAssets,
      result: buildMonthlyBaselineProjection({
        portfolioId: portfolio.id,
        settings,
        assets: sortedPortfolioAssets,
        forcedBlockReasons,
      }),
    };
  });
}

export function buildStep3MonthlyBaselineDetail({ portfolio = {}, settings = {}, assets = null } = {}) {
  const portfolioAssets = Array.isArray(assets) ? assets : portfolio.assets;
  return buildMonthlyBaselineProjection({
    portfolioId: portfolio.id,
    settings,
    assets: portfolioAssets,
  });
}
