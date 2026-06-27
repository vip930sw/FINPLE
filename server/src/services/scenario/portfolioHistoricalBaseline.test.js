import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHistoricalRollingBaseline,
  buildHistoricalRollingWindows,
} from "./portfolioHistoricalBaseline.js";
import { calculatePortfolioMonthlyReturns } from "./portfolioRiskMetrics.js";

function assertClose(actual, expected, tolerance = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function months(count, returns) {
  return Array.from({ length: count }, (_, index) => {
    const year = 2020 + Math.floor(index / 12);
    const month = (index % 12) + 1;
    return {
      month: `${year}-${String(month).padStart(2, "0")}-28`,
      return: returns[index] ?? 0,
    };
  });
}

test("builds horizon windows from explicit monthly portfolio returns", () => {
  const windows = buildHistoricalRollingWindows({
    horizonMonths: 3,
    monthlyReturns: months(5, [0.1, -0.1, 0.2, -0.2, 0.05]),
  });

  assert.equal(windows.length, 3);
  assert.equal(windows[0].startMonth, "2020-01-28");
  assert.equal(windows[0].endMonth, "2020-03-28");
  assertClose(windows[0].terminalReturn, 1.1 * 0.9 * 1.2 - 1);
  assertClose(windows[0].mdd, -0.1);
  assert.equal(windows[0].recoveryMonth, "2020-03-28");
});

test("returns no windows when horizon is longer than available observations", () => {
  const windows = buildHistoricalRollingWindows({
    horizonMonths: 12,
    monthlyReturns: months(3, [0.01, 0.01, 0.01]),
  });

  assert.deepEqual(windows, []);
});

test("summarizes 1y, 3y, 5y, and 10y rolling baseline horizons", () => {
  const baseline = buildHistoricalRollingBaseline({
    targetWeights: { A: 60, B: 40 },
    horizons: [12, 36, 60, 120],
    assetReturnSeries: {
      A: months(132, Array(132).fill(0.01)),
      B: months(132, Array(132).fill(0)),
    },
  });

  assert.equal(baseline.method, "historical_rolling_windows");
  assert.equal(baseline.inputObservationCount, 132);
  assert.equal(baseline.horizons["12m"].windowCount, 121);
  assert.equal(baseline.horizons["36m"].windowCount, 97);
  assert.equal(baseline.horizons["60m"].windowCount, 73);
  assert.equal(baseline.horizons["120m"].windowCount, 13);
  assert.equal(baseline.horizons["12m"].lossProbability, 0);
  assert.equal(baseline.meta.betaApplied, false);
  assert.equal(baseline.meta.cashflowIncludedInMdd, false);
});

test("uses common-month portfolio returns and does not zero-fill missing months", () => {
  const monthlyReturns = calculatePortfolioMonthlyReturns({
    targetWeights: { A: 0.5, B: 0.5 },
    assetReturnSeries: {
      A: months(4, [0.1, 0.1, 0.1, 0.1]),
      B: months(4, [0.2, 0.2, 0.2, 0.2]).slice(1),
    },
  });

  const baseline = buildHistoricalRollingBaseline({
    targetWeights: { A: 0.5, B: 0.5 },
    horizons: [2],
    assetReturnSeries: {
      A: months(4, [0.1, 0.1, 0.1, 0.1]),
      B: months(4, [0.2, 0.2, 0.2, 0.2]).slice(1),
    },
  });

  assert.equal(monthlyReturns.length, 3);
  assert.equal(monthlyReturns[0].month, "2020-02-28");
  assert.equal(baseline.inputObservationCount, 3);
  assert.equal(baseline.horizons["2m"].windowCount, 2);
});

test("summarizes terminal loss probabilities, MDD, and recovery state", () => {
  const baseline = buildHistoricalRollingBaseline({
    targetWeights: { A: 1 },
    horizons: [3],
    lossThresholds: [-0.1, -0.2],
    assetReturnSeries: {
      A: months(5, [0.5, -0.4, -0.1, 0.6, -0.5]),
    },
  });

  const horizon = baseline.horizons["3m"];
  assert.equal(horizon.windowCount, 3);
  assert.equal(horizon.lossProbability, 1);
  assert.equal(horizon.lossThresholdProbabilities["-0.1"], 1);
  assert.equal(horizon.mddThresholdProbabilities["-0.2"], 2 / 3);
  assert.equal(horizon.unrecoveredWindowCount, 2);
  assertClose(horizon.mddWorst, -0.5);
});

test("rejects invalid horizons and non-negative loss thresholds", () => {
  assert.throws(
    () => buildHistoricalRollingWindows({ horizonMonths: 0, monthlyReturns: months(3, []) }),
    /horizonMonths must be a positive integer/,
  );
  assert.throws(
    () =>
      buildHistoricalRollingBaseline({
        targetWeights: { A: 1 },
        horizons: [1],
        lossThresholds: [0],
        assetReturnSeries: { A: months(3, []) },
      }),
    /lossThreshold values must be negative/,
  );
});
