const MONTH_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;
const EPSILON = 1e-10;

function assertFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return number;
}

function normalizeMonth(value, label = "month") {
  const month = String(value || "").trim();
  if (!MONTH_PATTERN.test(month)) {
    throw new TypeError(`${label} must be YYYY-MM or YYYY-MM-DD`);
  }
  return month.length === 7 ? `${month}-01` : month;
}

function toWeightEntries(targetWeights) {
  if (Array.isArray(targetWeights)) {
    return targetWeights.map((item) => [item.ticker, item.weight]);
  }
  if (targetWeights && typeof targetWeights === "object") {
    return Object.entries(targetWeights);
  }
  throw new TypeError("targetWeights must be an object or an array");
}

export function normalizeTargetWeights(targetWeights) {
  const entries = toWeightEntries(targetWeights);
  if (entries.length === 0) {
    throw new TypeError("targetWeights must not be empty");
  }

  const weights = new Map();
  for (const [rawTicker, rawWeight] of entries) {
    const ticker = String(rawTicker || "").trim().toUpperCase();
    if (!ticker) {
      throw new TypeError("targetWeights contains an empty ticker");
    }
    if (weights.has(ticker)) {
      throw new TypeError(`duplicate target weight ticker: ${ticker}`);
    }
    const weight = assertFiniteNumber(rawWeight, `targetWeights.${ticker}`);
    if (weight < 0) {
      throw new RangeError(`targetWeights.${ticker} must be non-negative`);
    }
    weights.set(ticker, weight);
  }

  const rawTotal = Array.from(weights.values()).reduce((sum, weight) => sum + weight, 0);
  const divisor = rawTotal > 1.5 && rawTotal <= 100 + EPSILON ? 100 : 1;
  const total = rawTotal / divisor;
  if (Math.abs(total - 1) > 0.000001) {
    throw new RangeError(`targetWeights must sum to 1 or 100, got ${rawTotal}`);
  }

  return new Map(Array.from(weights, ([ticker, weight]) => [ticker, weight / divisor]));
}

function normalizeReturnSeries(assetReturnSeries, requiredTickers) {
  if (!assetReturnSeries || typeof assetReturnSeries !== "object" || Array.isArray(assetReturnSeries)) {
    throw new TypeError("assetReturnSeries must be an object keyed by ticker");
  }

  const normalized = new Map();
  for (const ticker of requiredTickers) {
    const rawSeries = assetReturnSeries[ticker] || assetReturnSeries[ticker.toLowerCase()];
    if (!Array.isArray(rawSeries) || rawSeries.length === 0) {
      throw new TypeError(`assetReturnSeries.${ticker} must be a non-empty array`);
    }

    const byMonth = new Map();
    for (const [index, rawPoint] of rawSeries.entries()) {
      const month = normalizeMonth(rawPoint.month, `assetReturnSeries.${ticker}[${index}].month`);
      if (byMonth.has(month)) {
        throw new TypeError(`assetReturnSeries.${ticker} has duplicate month ${month}`);
      }
      const monthlyReturn = assertFiniteNumber(
        rawPoint.return ?? rawPoint.monthlyReturn,
        `assetReturnSeries.${ticker}[${index}].return`,
      );
      if (monthlyReturn < -1) {
        throw new RangeError(`assetReturnSeries.${ticker}[${index}].return must be >= -1`);
      }
      byMonth.set(month, monthlyReturn);
    }
    normalized.set(ticker, byMonth);
  }
  return normalized;
}

function getCommonMonths(seriesByTicker) {
  const allMonthSets = Array.from(seriesByTicker.values(), (series) => new Set(series.keys()));
  const [firstSet, ...restSets] = allMonthSets;
  return Array.from(firstSet)
    .filter((month) => restSets.every((set) => set.has(month)))
    .sort();
}

function shouldRebalance(rebalanceFrequency, previousMonth, currentMonth) {
  if (!previousMonth) {
    return true;
  }
  if (rebalanceFrequency === "none") {
    return false;
  }
  if (rebalanceFrequency === "annual") {
    return previousMonth.slice(0, 4) !== currentMonth.slice(0, 4);
  }
  throw new TypeError(`Unsupported rebalanceFrequency: ${rebalanceFrequency}`);
}

export function calculatePortfolioMonthlyReturns({
  assetReturnSeries,
  targetWeights,
  rebalanceFrequency = "annual",
}) {
  const targetWeightMap = normalizeTargetWeights(targetWeights);
  const tickers = Array.from(targetWeightMap.keys());
  const seriesByTicker = normalizeReturnSeries(assetReturnSeries, tickers);
  const commonMonths = getCommonMonths(seriesByTicker);
  if (commonMonths.length === 0) {
    throw new RangeError("assetReturnSeries has no common months across target assets");
  }

  let currentWeights = new Map(targetWeightMap);
  let previousMonth = "";

  return commonMonths.map((month) => {
    if (shouldRebalance(rebalanceFrequency, previousMonth, month)) {
      currentWeights = new Map(targetWeightMap);
    }

    const assetReturns = {};
    let grossReturn = 0;
    for (const ticker of tickers) {
      const monthlyReturn = seriesByTicker.get(ticker).get(month);
      assetReturns[ticker] = monthlyReturn;
      grossReturn += currentWeights.get(ticker) * (1 + monthlyReturn);
    }

    const portfolioReturn = grossReturn - 1;
    if (grossReturn <= 0) {
      currentWeights = new Map(tickers.map((ticker) => [ticker, 0]));
    } else {
      currentWeights = new Map(
        tickers.map((ticker) => [
          ticker,
          (currentWeights.get(ticker) * (1 + assetReturns[ticker])) / grossReturn,
        ]),
      );
    }

    previousMonth = month;
    return {
      month,
      return: portfolioReturn,
      assetReturns,
    };
  });
}

export function buildNavSeries({ monthlyReturns, initialNav = 100 }) {
  if (!Array.isArray(monthlyReturns) || monthlyReturns.length === 0) {
    throw new TypeError("monthlyReturns must be a non-empty array");
  }
  let nav = assertFiniteNumber(initialNav, "initialNav");
  if (nav <= 0) {
    throw new RangeError("initialNav must be greater than 0");
  }

  return monthlyReturns.map((point, index) => {
    const month = normalizeMonth(point.month, `monthlyReturns[${index}].month`);
    const monthlyReturn = assertFiniteNumber(point.return, `monthlyReturns[${index}].return`);
    if (monthlyReturn < -1) {
      throw new RangeError(`monthlyReturns[${index}].return must be >= -1`);
    }
    nav *= 1 + monthlyReturn;
    return {
      month,
      return: monthlyReturn,
      nav,
    };
  });
}

function monthDiff(startMonth, endMonth) {
  const start = normalizeMonth(startMonth);
  const end = normalizeMonth(endMonth);
  const startYear = Number(start.slice(0, 4));
  const startMonthNumber = Number(start.slice(5, 7));
  const endYear = Number(end.slice(0, 4));
  const endMonthNumber = Number(end.slice(5, 7));
  return (endYear - startYear) * 12 + (endMonthNumber - startMonthNumber);
}

export function calculateDrawdownMetrics(navSeries) {
  if (!Array.isArray(navSeries) || navSeries.length === 0) {
    throw new TypeError("navSeries must be a non-empty array");
  }

  let peakNav = -Infinity;
  let peakMonth = "";
  let maxDrawdown = 0;
  let maxDrawdownPeakNav = 0;
  let maxDrawdownPeakMonth = "";
  let troughMonth = "";
  let troughIndex = -1;

  const drawdownSeries = navSeries.map((point, index) => {
    const month = normalizeMonth(point.month, `navSeries[${index}].month`);
    const nav = assertFiniteNumber(point.nav, `navSeries[${index}].nav`);
    if (nav < 0) {
      throw new RangeError(`navSeries[${index}].nav must be non-negative`);
    }

    if (nav > peakNav) {
      peakNav = nav;
      peakMonth = month;
    }

    const drawdown = peakNav === 0 ? 0 : nav / peakNav - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPeakNav = peakNav;
      maxDrawdownPeakMonth = peakMonth;
      troughMonth = month;
      troughIndex = index;
    }

    return {
      month,
      nav,
      runningPeak: peakNav,
      drawdown,
    };
  });

  let recoveryMonth = null;
  let recoveryMonths = null;
  if (troughIndex >= 0) {
    for (let index = troughIndex + 1; index < navSeries.length; index += 1) {
      const point = navSeries[index];
      const nav = assertFiniteNumber(point.nav, `navSeries[${index}].nav`);
      if (nav >= maxDrawdownPeakNav) {
        recoveryMonth = normalizeMonth(point.month, `navSeries[${index}].month`);
        recoveryMonths = monthDiff(maxDrawdownPeakMonth, recoveryMonth);
        break;
      }
    }
  }

  return {
    mdd: maxDrawdown,
    peakMonth: maxDrawdownPeakMonth || null,
    troughMonth: troughMonth || null,
    recoveryMonth,
    recoveryMonths,
    drawdownSeries,
  };
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

export function calculateRollingLossMetrics({ monthlyReturns, windowMonths = 12 }) {
  if (!Array.isArray(monthlyReturns) || monthlyReturns.length === 0) {
    throw new TypeError("monthlyReturns must be a non-empty array");
  }
  if (!Number.isInteger(windowMonths) || windowMonths <= 0) {
    throw new RangeError("windowMonths must be a positive integer");
  }
  if (monthlyReturns.length < windowMonths) {
    return {
      windowMonths,
      observationCount: 0,
      negativeObservationCount: 0,
      lossProbability: null,
      loss10Probability: null,
      loss20Probability: null,
      loss30Probability: null,
      averageNegativeReturn: null,
      medianNegativeReturn: null,
      worstReturn: null,
      rollingReturns: [],
    };
  }

  const normalized = monthlyReturns.map((point, index) => ({
    month: normalizeMonth(point.month, `monthlyReturns[${index}].month`),
    return: assertFiniteNumber(point.return, `monthlyReturns[${index}].return`),
  }));
  for (const [index, point] of normalized.entries()) {
    if (point.return < -1) {
      throw new RangeError(`monthlyReturns[${index}].return must be >= -1`);
    }
  }

  const rollingReturns = [];
  for (let endIndex = windowMonths - 1; endIndex < normalized.length; endIndex += 1) {
    const window = normalized.slice(endIndex - windowMonths + 1, endIndex + 1);
    const compoundedReturn = window.reduce((gross, point) => gross * (1 + point.return), 1) - 1;
    rollingReturns.push({
      startMonth: window[0].month,
      endMonth: window[window.length - 1].month,
      return: compoundedReturn,
    });
  }

  const observationCount = rollingReturns.length;
  const returns = rollingReturns.map((point) => point.return);
  const negativeReturns = returns.filter((value) => value < 0);
  const countAtOrBelow = (threshold) => returns.filter((value) => value <= threshold).length;

  return {
    windowMonths,
    observationCount,
    negativeObservationCount: negativeReturns.length,
    lossProbability: negativeReturns.length / observationCount,
    loss10Probability: countAtOrBelow(-0.1) / observationCount,
    loss20Probability: countAtOrBelow(-0.2) / observationCount,
    loss30Probability: countAtOrBelow(-0.3) / observationCount,
    averageNegativeReturn:
      negativeReturns.length === 0
        ? null
        : negativeReturns.reduce((sum, value) => sum + value, 0) / negativeReturns.length,
    medianNegativeReturn: median(negativeReturns),
    worstReturn: Math.min(...returns),
    rollingReturns,
  };
}
