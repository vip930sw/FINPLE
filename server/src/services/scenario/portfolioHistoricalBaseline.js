import {
  buildNavSeries,
  calculateDrawdownMetrics,
  calculatePortfolioMonthlyReturns,
} from "./portfolioRiskMetrics.js";

const DEFAULT_HORIZONS = [12, 36, 60, 120];
const DEFAULT_LOSS_THRESHOLDS = [-0.1, -0.2, -0.3];

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }
  return value;
}

function assertFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return number;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function quantile(values, probability) {
  if (values.length === 0) {
    return null;
  }
  const p = assertFiniteNumber(probability, "probability");
  if (p < 0 || p > 1) {
    throw new RangeError("probability must be between 0 and 1");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function compoundReturn(monthlyReturns) {
  return monthlyReturns.reduce((gross, point) => gross * (1 + point.return), 1) - 1;
}

function summarizeWindows({ horizonMonths, windows, lossThresholds }) {
  const terminalReturns = windows.map((window) => window.terminalReturn);
  const mdds = windows.map((window) => window.mdd);
  const recovered = windows.filter((window) => window.recoveryMonth !== null);
  const recoveryMonths = recovered.map((window) => window.recoveryMonths);

  const lossThresholdProbabilities = Object.fromEntries(
    lossThresholds.map((threshold) => [
      String(threshold),
      windows.length === 0
        ? null
        : terminalReturns.filter((value) => value <= threshold).length / windows.length,
    ]),
  );
  const mddThresholdProbabilities = Object.fromEntries(
    lossThresholds.map((threshold) => [
      String(threshold),
      windows.length === 0 ? null : mdds.filter((value) => value <= threshold).length / windows.length,
    ]),
  );

  return {
    horizonMonths,
    windowCount: windows.length,
    terminalReturnP10: quantile(terminalReturns, 0.1),
    terminalReturnMedian: median(terminalReturns),
    terminalReturnP90: quantile(terminalReturns, 0.9),
    lossProbability: windows.length === 0
      ? null
      : terminalReturns.filter((value) => value < 0).length / windows.length,
    lossThresholdProbabilities,
    worstTerminalReturn: terminalReturns.length === 0 ? null : Math.min(...terminalReturns),
    mddMedian: median(mdds),
    mddWorst: mdds.length === 0 ? null : Math.min(...mdds),
    mddThresholdProbabilities,
    recoveredWindowCount: recovered.length,
    unrecoveredWindowCount: windows.length - recovered.length,
    recoveryMonthsMedian: median(recoveryMonths),
  };
}

export function buildHistoricalRollingWindows({
  monthlyReturns,
  horizonMonths,
  initialNav = 100,
}) {
  if (!Array.isArray(monthlyReturns) || monthlyReturns.length === 0) {
    throw new TypeError("monthlyReturns must be a non-empty array");
  }
  const normalizedHorizon = assertPositiveInteger(horizonMonths, "horizonMonths");
  assertFiniteNumber(initialNav, "initialNav");

  if (monthlyReturns.length < normalizedHorizon) {
    return [];
  }

  const windows = [];
  for (let startIndex = 0; startIndex <= monthlyReturns.length - normalizedHorizon; startIndex += 1) {
    const windowReturns = monthlyReturns.slice(startIndex, startIndex + normalizedHorizon);
    const navSeries = buildNavSeries({ monthlyReturns: windowReturns, initialNav });
    const drawdownMetrics = calculateDrawdownMetrics(navSeries);
    windows.push({
      startMonth: windowReturns[0].month,
      endMonth: windowReturns[windowReturns.length - 1].month,
      horizonMonths: normalizedHorizon,
      terminalReturn: compoundReturn(windowReturns),
      terminalNav: navSeries[navSeries.length - 1].nav,
      mdd: drawdownMetrics.mdd,
      peakMonth: drawdownMetrics.peakMonth,
      troughMonth: drawdownMetrics.troughMonth,
      recoveryMonth: drawdownMetrics.recoveryMonth,
      recoveryMonths: drawdownMetrics.recoveryMonths,
    });
  }
  return windows;
}

export function buildHistoricalRollingBaseline({
  assetReturnSeries,
  targetWeights,
  rebalanceFrequency = "annual",
  horizons = DEFAULT_HORIZONS,
  lossThresholds = DEFAULT_LOSS_THRESHOLDS,
  initialNav = 100,
}) {
  const monthlyReturns = calculatePortfolioMonthlyReturns({
    assetReturnSeries,
    targetWeights,
    rebalanceFrequency,
  });
  const normalizedHorizons = horizons.map((horizon) => assertPositiveInteger(horizon, "horizon"));
  const normalizedLossThresholds = lossThresholds.map((threshold) => {
    const value = assertFiniteNumber(threshold, "lossThreshold");
    if (value >= 0) {
      throw new RangeError("lossThreshold values must be negative");
    }
    return value;
  });

  const horizonsResult = Object.fromEntries(
    normalizedHorizons.map((horizonMonths) => {
      const windows = buildHistoricalRollingWindows({
        monthlyReturns,
        horizonMonths,
        initialNav,
      });
      return [
        `${horizonMonths}m`,
        {
          ...summarizeWindows({
            horizonMonths,
            windows,
            lossThresholds: normalizedLossThresholds,
          }),
          windows,
        },
      ];
    }),
  );

  return {
    analysisVersion: "historical-rolling-baseline-v0.1",
    method: "historical_rolling_windows",
    rebalanceFrequency,
    inputObservationCount: monthlyReturns.length,
    firstMonth: monthlyReturns[0]?.month ?? null,
    lastMonth: monthlyReturns[monthlyReturns.length - 1]?.month ?? null,
    horizons: horizonsResult,
    meta: {
      betaApplied: false,
      betaReason: "historical portfolio returns already include realized market sensitivity",
      cashflowIncludedInMdd: false,
      missingMonthPolicy: "intersect_common_months_only",
    },
  };
}
