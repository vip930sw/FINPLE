import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAppPreviewScenarioResult,
  longestContiguousMonthSegment,
} from "./appPreviewScenarioService.js";

function monthEnd(index) {
  const date = new Date(Date.UTC(2018, index + 1, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function rows(market, ticker, count = 80, omitted = new Set()) {
  return Array.from({ length: count }, (_, index) => ({
    market,
    ticker,
    month: monthEnd(index),
    priceReturn: index % 2 === 0 ? 0.02 : -0.01,
    totalReturn: index % 2 === 0 ? 0.03 : 0,
    currency: "USD",
  })).filter((_, index) => !omitted.has(index));
}

const manifest = {
  sourceCandidatePackageId: "finple-candidate-test",
  sourceCandidatePackageHash: "a".repeat(64),
  sourceCandidatePackageVersion: "candidate-v1",
  normalizationVersion: "normalization-v1",
  calculationPolicyVersion: "metrics-calculation-policy-2026-06-26",
  metricDataThroughMonth: "2024-08",
};

test("longestContiguousMonthSegment never fills missing months", () => {
  assert.deepEqual(
    longestContiguousMonthSegment(["2024-01", "2024-02", "2024-04", "2024-05", "2024-06"]),
    ["2024-04", "2024-05", "2024-06"],
  );
});

test("preview scenario consumes aligned price-return rows from the longest observed segment", () => {
  const assets = [
    { market: "US", ticker: "QQQ", targetEvaluationAmount: 6000 },
    { market: "US", ticker: "SPY", targetEvaluationAmount: 4000 },
  ];
  const result = buildAppPreviewScenarioResult({
    activePortfolio: { id: "portfolio-preview", name: "Preview" },
    assets,
    settings: {
      startValue: 0,
      monthlyCashFlow: 100,
      years: 5,
      inflationRate: 2,
    },
    rowsByIdentity: {
      "US:QQQ": rows("US", "QQQ", 80, new Set([5])),
      "US:SPY": rows("US", "SPY", 80),
    },
    manifest,
    simulationCount: 24,
  });
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
  assert.equal(result.contributionSeries[0].cumulativeContributions, 10000);
  assert.equal(result.returnBasis, "price_return");
  assert.equal(result.internalPreviewContext.gapsForwardFilled, false);
  assert.equal(result.internalPreviewContext.commonObservedMonthCount, 79);
  assert.equal(result.internalPreviewContext.contiguousObservedMonthCount, 74);
  assert.deepEqual(result.internalPreviewContext.identities, ["US:QQQ", "US:SPY"]);
  assert.equal(result.productionPublishReady, false);
  assert.equal(result.appExportApproved, false);
});

test("missing asset series stays blocked instead of receiving zero rows", () => {
  const result = buildAppPreviewScenarioResult({
    activePortfolio: { id: "portfolio-preview", name: "Preview" },
    assets: [{ market: "US", ticker: "QQQ", targetEvaluationAmount: 10000 }],
    settings: {
      startValue: 10000,
      monthlyCashFlow: 0,
      years: 5,
      inflationRate: 0,
    },
    rowsByIdentity: {},
    manifest,
    simulationCount: 24,
  });
  assert.notEqual(result.status, "ready");
  assert.equal(result.internalPreviewContext.contiguousObservedMonthCount, 0);
});
