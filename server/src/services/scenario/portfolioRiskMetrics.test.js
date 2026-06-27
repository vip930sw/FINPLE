import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNavSeries,
  calculateDrawdownMetrics,
  calculatePortfolioMonthlyReturns,
  calculateRollingLossMetrics,
  normalizeTargetWeights,
} from "./portfolioRiskMetrics.js";

function assertClose(actual, expected, tolerance = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("normalizes decimal and percent target weights", () => {
  assert.deepEqual(Array.from(normalizeTargetWeights({ QQQ: 0.4, BND: 0.6 })), [
    ["QQQ", 0.4],
    ["BND", 0.6],
  ]);
  assert.deepEqual(Array.from(normalizeTargetWeights({ QQQ: 40, BND: 60 })), [
    ["QQQ", 0.4],
    ["BND", 0.6],
  ]);
});

test("calculates monthly portfolio returns on common months without zero filling", () => {
  const result = calculatePortfolioMonthlyReturns({
    targetWeights: { QQQ: 0.5, BND: 0.5 },
    rebalanceFrequency: "annual",
    assetReturnSeries: {
      QQQ: [
        { month: "2025-01-31", return: 0.1 },
        { month: "2025-02-28", return: 0.2 },
      ],
      BND: [{ month: "2025-02-28", return: -0.1 }],
    },
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].month, "2025-02-28");
  assertClose(result[0].return, 0.05);
});

test("annual rebalancing restores target weights at the first observed month of a new year", () => {
  const result = calculatePortfolioMonthlyReturns({
    targetWeights: { A: 0.5, B: 0.5 },
    rebalanceFrequency: "annual",
    assetReturnSeries: {
      A: [
        { month: "2025-12-31", return: 1 },
        { month: "2026-01-31", return: 0.1 },
      ],
      B: [
        { month: "2025-12-31", return: 0 },
        { month: "2026-01-31", return: 0 },
      ],
    },
  });

  assert.equal(result[0].return, 0.5);
  assertClose(result[1].return, 0.05);
});

test("builds NAV from monthly returns without cashflow effects", () => {
  const nav = buildNavSeries({
    initialNav: 100,
    monthlyReturns: [
      { month: "2025-01-31", return: 0 },
      { month: "2025-02-28", return: 0.1 },
      { month: "2025-03-31", return: -0.1 },
    ],
  });

  assert.equal(nav[0].nav, 100);
  assertClose(nav[1].nav, 110);
  assertClose(nav[2].nav, 99);
});

test("calculates MDD peak, trough, and recovery months from NAV series", () => {
  const metrics = calculateDrawdownMetrics([
    { month: "2024-01-31", nav: 100 },
    { month: "2024-07-31", nav: 120 },
    { month: "2024-11-30", nav: 90 },
    { month: "2025-05-31", nav: 120 },
  ]);

  assert.equal(metrics.mdd, -0.25);
  assert.equal(metrics.peakMonth, "2024-07-31");
  assert.equal(metrics.troughMonth, "2024-11-30");
  assert.equal(metrics.recoveryMonth, "2025-05-31");
  assert.equal(metrics.recoveryMonths, 10);
});

test("leaves recovery fields null when the drawdown has not recovered", () => {
  const metrics = calculateDrawdownMetrics([
    { month: "2025-01-31", nav: 100 },
    { month: "2025-02-28", nav: 80 },
    { month: "2025-03-31", nav: 90 },
  ]);

  assertClose(metrics.mdd, -0.2);
  assert.equal(metrics.recoveryMonth, null);
  assert.equal(metrics.recoveryMonths, null);
});

test("calculates rolling loss probability and loss magnitude from compounded returns", () => {
  const metrics = calculateRollingLossMetrics({
    windowMonths: 2,
    monthlyReturns: [
      { month: "2025-01-31", return: -0.1 },
      { month: "2025-02-28", return: -0.1 },
      { month: "2025-03-31", return: 0.2 },
      { month: "2025-04-30", return: -0.2 },
    ],
  });

  assert.equal(metrics.observationCount, 3);
  assert.equal(metrics.negativeObservationCount, 2);
  assert.equal(metrics.lossProbability, 2 / 3);
  assert.equal(metrics.loss10Probability, 1 / 3);
  assertClose(metrics.averageNegativeReturn, -0.115);
  assertClose(metrics.medianNegativeReturn, -0.115);
  assertClose(metrics.worstReturn, -0.19);
});

test("returns empty rolling metrics when there are not enough observations", () => {
  const metrics = calculateRollingLossMetrics({
    windowMonths: 12,
    monthlyReturns: [{ month: "2025-01-31", return: 0.01 }],
  });

  assert.equal(metrics.observationCount, 0);
  assert.equal(metrics.lossProbability, null);
  assert.deepEqual(metrics.rollingReturns, []);
});

test("rejects invalid inputs instead of fabricating results", () => {
  assert.throws(
    () => normalizeTargetWeights({ QQQ: 0.6, BND: 0.6 }),
    /targetWeights must sum/,
  );
  assert.throws(
    () =>
      calculatePortfolioMonthlyReturns({
        targetWeights: { QQQ: 1 },
        assetReturnSeries: {
          QQQ: [
            { month: "2025-01-31", return: 0.1 },
            { month: "2025-01-31", return: 0.2 },
          ],
        },
      }),
    /duplicate month/,
  );
  assert.throws(
    () =>
      calculatePortfolioMonthlyReturns({
        targetWeights: { QQQ: 0.5, BND: 0.5 },
        assetReturnSeries: {
          QQQ: [{ month: "2025-01-31", return: 0.1 }],
          BND: [{ month: "2025-02-28", return: 0.1 }],
        },
      }),
    /no common months/,
  );
});
