export const MONTHLY_BASELINE_ENGINE_VERSION = "monthly-baseline-v1-step114-2e";

const EPSILON = 1e-9;
const BLOCKED_STATUS_VALUES = new Set([
  "blocked",
  "excluded",
  "insufficient_history",
  "review_only",
  "review_required",
  "short_history",
]);

const READY_STATUS_VALUES = new Set(["", "none", "ready", "approved", "app_ready"]);

function toFiniteNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTicker(value) {
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

function hasExplicitTargetWeights(assets) {
  return assets.some((asset) => toFiniteNumber(asset.targetWeight, 0) > 0);
}

function normalizeTargetShares(assets, weightBaseValue) {
  if (hasExplicitTargetWeights(assets)) {
    const rawWeights = assets.map((asset) => toFiniteNumber(asset.targetWeight, 0));
    const rawTotal = rawWeights.reduce((sum, value) => sum + Math.max(0, value), 0);
    const divisor = rawTotal > 1.5 ? 100 : 1;
    const total = rawTotal / divisor;
    if (Math.abs(total - 1) > 0.000001) {
      throw new RangeError(`targetWeight values must sum to 1 or 100, got ${rawTotal}`);
    }
    return rawWeights.map((value) => Math.max(0, value) / divisor);
  }

  if (weightBaseValue > 0) {
    return assets.map((asset) => getAssetWeightValue(asset) / weightBaseValue);
  }

  const equalWeight = assets.length > 0 ? 1 / assets.length : 0;
  return assets.map(() => equalWeight);
}

function validateAssetMetricSource(asset, index, dividendReinvest) {
  const reasons = [];
  const ticker = normalizeTicker(asset?.ticker) || `asset_${index}`;
  const statuses = [
    ["metricsStatus", asset.metricsStatus],
    ["dataStatus", asset.dataStatus],
    ["reviewFlag", asset.reviewFlag],
    ["reviewTag", asset.reviewTag],
    ["overlayStatus", asset.overlayStatus],
  ];

  for (const [field, rawValue] of statuses) {
    const value = normalizeStatus(rawValue);
    if (!value || READY_STATUS_VALUES.has(value)) continue;
    if (BLOCKED_STATUS_VALUES.has(value) || value.includes("review") || value.includes("blocked")) {
      addBlockReason(reasons, "metric_source_blocked", `${ticker}.${field}=${value}`);
    }
  }

  if (asset.productionPublishReady === false || asset.appExportApproved === false) {
    addBlockReason(reasons, "metric_source_not_publish_approved", ticker);
  }

  if (isBlank(asset.ticker)) {
    addBlockReason(reasons, "missing_ticker", `asset_${index}`);
  }

  if (getAnnualCagr(asset) === null) {
    addBlockReason(reasons, "missing_selected_cagr", ticker);
  }

  if (dividendReinvest && isDividendMissing(asset)) {
    addBlockReason(reasons, "missing_dividend_yield_for_reinvestment", ticker);
  }

  return reasons;
}

function normalizeAssetInput(asset, index, targetWeight, dividendReinvest) {
  const ticker = normalizeTicker(asset.ticker);
  const annualPriceCagr = getAnnualCagr(asset);
  const annualDividendYield = getAnnualDividendYield(asset);
  const dividendYieldForCalculation = annualDividendYield === null ? null : annualDividendYield;

  return {
    ticker,
    displayTicker: String(asset.displayTicker || asset.ticker || ticker),
    market: String(asset.market || "").trim().toUpperCase(),
    targetWeight,
    annualPriceCagr,
    annualDividendYield: dividendYieldForCalculation,
    monthlyPriceRate: annualPercentToMonthlyRate(annualPriceCagr, `assets[${index}].selectedCagrAnnual`),
    monthlyDividendRate:
      dividendYieldForCalculation === null
        ? null
        : annualPercentToMonthlyRate(dividendYieldForCalculation, `assets[${index}].dividendYieldAnnual`),
    beta: toFiniteNumber(asset.beta ?? asset.selectedBeta, 0),
    mdd: toFiniteNumber(asset.mdd ?? asset.selectedMdd, 0),
    dividendIncludedInReturn: Boolean(dividendReinvest && dividendYieldForCalculation !== null),
    metricLineage: {
      metricMode: asset.metricMode || "",
      dataSource: asset.dataSource || "",
      metricsSource: asset.metricsSource || "",
      sourceHash: asset.sourceHash || "",
      rawSourceSha256: asset.rawSourceSha256 || "",
      normalizationVersion: asset.normalizationVersion || "",
      normalizedSeriesHash: asset.normalizedSeriesHash || "",
      rollingMetricVersion: asset.rollingMetricVersion || "",
      metricBaseDate: asset.metricBaseDate || "",
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
    expectedCagr: 0,
    expectedDividendYield: null,
    expectedBeta: 0,
    simpleMdd: 0,
    expectedCalmar: 0,
    expectedAnnualDividend: null,
    monthlyBaselinePoints: [],
    performanceRows: [],
    futureValue: simulationStartValue,
    inflationAdjustedFutureValue: simulationStartValue,
    cumulativeDividendResult: 0,
    summary: {
      initialInvestment: simulationStartValue,
      monthlyContribution: Number(settings.monthlyCashFlow || 0),
      cumulativeContributions: simulationStartValue,
      endingValueNominal: simulationStartValue,
      endingValueReal: simulationStartValue,
      investmentGainNominal: 0,
      contributionExcludedIndex: 100,
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
  let previousGain = 0;

  for (const point of points) {
    if (point.monthIndex === 0 || point.monthIndex % 12 !== 0) continue;
    const year = point.monthIndex / 12;
    const annualDividend = point.cumulativeDividendCashFlow - previousDividend;
    const annualProfit = point.investmentGainNominal - previousGain;
    rows.push({
      year,
      annualContribution: monthlyContribution * 12,
      annualDividend,
      annualProfit,
      cumulativeContribution: point.cumulativeContributions,
      cumulativeDividend: point.cumulativeDividendCashFlow,
      cumulativeProfit: point.investmentGainNominal,
      endingValue: point.portfolioValueNominal,
      inflationAdjustedValue: point.portfolioValueReal,
      baselineMonthIndex: point.monthIndex,
    });
    previousDividend = point.cumulativeDividendCashFlow;
    previousGain = point.investmentGainNominal;
  }

  return rows;
}

export function buildMonthlyBaselineProjection({
  portfolioId = "",
  settings = {},
  assets = [],
} = {}) {
  const investmentMonths = Math.max(
    0,
    Math.trunc(toFiniteNumber(settings.investmentMonths, null) ?? toFiniteNumber(settings.years, 0) * 12),
  );
  const monthlyContribution = Math.max(0, toFiniteNumber(settings.monthlyCashFlow, 0));
  const dividendReinvest = settings.dividendReinvest !== undefined ? Boolean(settings.dividendReinvest) : true;
  const totalAssetValue = assets.reduce((sum, asset) => sum + getAssetWeightValue(asset), 0);
  const configuredStartValue = toFiniteNumber(settings.startValue, 0);
  const simulationStartValue = configuredStartValue > 0 ? configuredStartValue : totalAssetValue;
  const weightBaseValue = totalAssetValue > 0 ? totalAssetValue : simulationStartValue;

  const baseSettings = {
    portfolioId,
    investmentMonths,
    monthlyCashFlow: monthlyContribution,
    years: investmentMonths / 12,
    dividendReinvest,
    inflationRate: toFiniteNumber(settings.inflationRate, 0),
    startValue: simulationStartValue,
  };

  const blockReasons = [];
  if (!Array.isArray(assets) || assets.length === 0) {
    addBlockReason(blockReasons, "missing_assets");
  }
  if (simulationStartValue <= 0) {
    addBlockReason(blockReasons, "missing_initial_investment");
  }
  if (investmentMonths < 0) {
    addBlockReason(blockReasons, "invalid_investment_months");
  }

  for (const [index, asset] of assets.entries()) {
    blockReasons.push(...validateAssetMetricSource(asset, index, dividendReinvest));
  }

  let targetShares = [];
  if (blockReasons.length === 0) {
    try {
      targetShares = normalizeTargetShares(assets, weightBaseValue);
    } catch (error) {
      addBlockReason(blockReasons, "invalid_target_weights", error.message);
    }
  }

  if (blockReasons.length > 0) {
    return createBlockedResult({
      settings: baseSettings,
      assets,
      blockReasons,
      totalAssetValue,
      simulationStartValue,
      weightBaseValue,
    });
  }

  const normalizedAssets = assets.map((asset, index) =>
    normalizeAssetInput(asset, index, targetShares[index], dividendReinvest),
  );

  const monthlyInflationRate = annualPercentToMonthlyRate(baseSettings.inflationRate, "inflationRate");
  const expectedCagr = normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.annualPriceCagr, 0);
  const hasMissingDividendYield = normalizedAssets.some((asset) => asset.annualDividendYield === null);
  const expectedDividendYield = hasMissingDividendYield
    ? null
    : normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.annualDividendYield, 0);
  const expectedBeta = normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.beta, 0);
  const simpleMdd = normalizedAssets.reduce((sum, asset) => sum + asset.targetWeight * asset.mdd, 0);
  const expectedCalmar = Math.abs(simpleMdd) > EPSILON ? expectedCagr / Math.abs(simpleMdd) : 0;
  const expectedAnnualDividend =
    expectedDividendYield === null ? null : simulationStartValue * (expectedDividendYield / 100);

  const sleeveValues = normalizedAssets.map((asset) => simulationStartValue * asset.targetWeight);
  let cumulativeContributions = simulationStartValue;
  let cumulativeDividendCashFlow = 0;
  let contributionExcludedIndex = 100;
  const monthlyBaselinePoints = [];

  monthlyBaselinePoints.push({
    monthIndex: 0,
    periodLabel: monthLabel(0),
    portfolioValueNominal: roundNumber(simulationStartValue),
    portfolioValueReal: roundNumber(simulationStartValue),
    cumulativeContributions: roundNumber(cumulativeContributions),
    investmentGainNominal: 0,
    contributionExcludedIndex,
    monthlyContributionApplied: 0,
    monthlyPriceReturnApplied: 0,
    monthlyPriceReturnRate: 0,
    monthlyDividendCashFlow: 0,
    cumulativeDividendCashFlow: 0,
  });

  for (let monthIndex = 1; monthIndex <= investmentMonths; monthIndex += 1) {
    let monthlyPriceReturnAmount = 0;
    let monthlyDividendCashFlow = 0;
    let weightedPriceRate = 0;
    let weightedTotalRateForIndex = 0;

    for (const [index, asset] of normalizedAssets.entries()) {
      const contributionForAsset = monthlyContribution * asset.targetWeight;
      sleeveValues[index] += contributionForAsset;
      const baseValue = sleeveValues[index];
      const priceReturn = baseValue * asset.monthlyPriceRate;
      const dividendFlow = asset.monthlyDividendRate === null ? 0 : baseValue * asset.monthlyDividendRate;
      monthlyPriceReturnAmount += priceReturn;
      monthlyDividendCashFlow += dividendFlow;
      weightedPriceRate += asset.targetWeight * asset.monthlyPriceRate;
      weightedTotalRateForIndex += asset.targetWeight * (
        asset.monthlyPriceRate + (asset.dividendIncludedInReturn ? asset.monthlyDividendRate ?? 0 : 0)
      );
      sleeveValues[index] += priceReturn + (asset.dividendIncludedInReturn ? dividendFlow : 0);
    }

    cumulativeContributions += monthlyContribution;
    cumulativeDividendCashFlow += monthlyDividendCashFlow;
    contributionExcludedIndex *= 1 + weightedTotalRateForIndex;

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
      contributionExcludedIndex: roundNumber(contributionExcludedIndex),
      monthlyContributionApplied: roundNumber(monthlyContribution),
      monthlyPriceReturnApplied: roundNumber(monthlyPriceReturnAmount),
      monthlyPriceReturnRate: roundNumber(weightedPriceRate, 10),
      monthlyDividendCashFlow: roundNumber(monthlyDividendCashFlow),
      cumulativeDividendCashFlow: roundNumber(cumulativeDividendCashFlow),
    });
  }

  const performanceRows = buildAnnualRows(monthlyBaselinePoints, monthlyContribution);
  const lastPoint = monthlyBaselinePoints[monthlyBaselinePoints.length - 1];

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
    expectedAnnualDividend,
    monthlyBaselinePoints,
    performanceRows,
    futureValue: lastPoint.portfolioValueNominal,
    inflationAdjustedFutureValue: lastPoint.portfolioValueReal,
    cumulativeDividendResult: lastPoint.cumulativeDividendCashFlow,
    summary: {
      initialInvestment: simulationStartValue,
      monthlyContribution,
      cumulativeContributions: lastPoint.cumulativeContributions,
      endingValueNominal: lastPoint.portfolioValueNominal,
      endingValueReal: lastPoint.portfolioValueReal,
      investmentGainNominal: lastPoint.investmentGainNominal,
      contributionExcludedIndex: lastPoint.contributionExcludedIndex,
      baselineAnnualAssumption: expectedCagr,
      baselineDividendAssumption: expectedDividendYield,
      mddReference: simpleMdd,
      betaReference: expectedBeta,
    },
  };
}

export function buildStep2MonthlyBaselineComparison({ portfolios = [], activePortfolioId = "", assets = [], settings = {} } = {}) {
  return portfolios.map((portfolio) => {
    const portfolioAssets = portfolio.id === activePortfolioId ? assets : portfolio.assets;
    return {
      ...portfolio,
      settings,
      assets: portfolioAssets,
      result: buildMonthlyBaselineProjection({
        portfolioId: portfolio.id,
        settings,
        assets: portfolioAssets,
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
