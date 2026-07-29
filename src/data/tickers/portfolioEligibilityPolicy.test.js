import assert from "node:assert/strict";
import test from "node:test";

import {
  getPortfolioAddDecision,
  isLeveragedOrInverse,
} from "./portfolioEligibilityPolicy.js";
import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";

const readyAsset = {
  ticker: "SPY",
  market: "US",
  targetWeight: 100,
  cagr: 8,
  beta: 1,
  mdd: -20,
  dividendYield: 1,
  simulationCashYield: 1,
  dataStatus: "ready",
  metricsStatus: "ready",
  reviewFlag: "none",
  overlayStatus: "ready",
};

test("2.9-year or one-year rolling history denies every portfolio ingress", () => {
  for (const asset of [
    {
      ...readyAsset,
      usablePriceHistoryYears: 2.9,
      rollingCagrWindowYears: 3,
      portfolioEligibleAfterDate: "2027-09-01",
    },
    {
      ...readyAsset,
      usablePriceHistoryYears: 3.1,
      rollingCagrWindowYears: 1,
    },
  ]) {
    const decision = getPortfolioAddDecision(asset);
    assert.equal(decision.policy, "deny");
    assert.equal(decision.reasonCode, "insufficient_long_horizon_history");
    const reloaded = {
      ...asset,
      ...normalizePersistedMetricFields(JSON.parse(JSON.stringify(asset))),
    };
    const result = buildMonthlyBaselineProjection({
      settings: {
        startValue: 1000,
        years: 1,
        monthlyCashFlow: 0,
        inflationRate: 0,
        dividendReinvest: true,
      },
      assets: [reloaded],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockReasons.join("|"), /portfolio_add_denied:SPY/);
  }
});

test("inactive and operator exclusion take priority over short history", () => {
  assert.equal(
    getPortfolioAddDecision({
      ...readyAsset,
      active: false,
      portfolioEligible: false,
      portfolioAddPolicy: "deny",
      portfolioEligibilityStatus: "inactive",
      usablePriceHistoryYears: 1,
    }).reasonCode,
    "inactive",
  );
  assert.equal(
    getPortfolioAddDecision({
      ...readyAsset,
      portfolioEligible: false,
      portfolioAddPolicy: "deny",
      portfolioEligibilityStatus: "excluded_by_operator",
      usablePriceHistoryYears: 1,
    }).reasonCode,
    "excluded_by_operator",
  );
});

test("long-history leveraged and inverse assets require one confirmation", () => {
  const asset = {
    ...readyAsset,
    ticker: "SQQQ",
    usablePriceHistoryYears: 10,
    rollingCagrWindowYears: 3,
    exposureType: "leveraged_inverse",
    leverageMultiple: -3,
    direction: "inverse",
    resetFrequency: "daily",
  };
  assert.equal(isLeveragedOrInverse(asset), true);
  const decision = getPortfolioAddDecision(asset);
  assert.equal(decision.policy, "confirm");
  assert.equal(decision.reasonCode, "leveraged_or_inverse_risk");
  assert.equal(
    getPortfolioAddDecision({
      ...asset,
      ...normalizePersistedMetricFields({
        ...asset,
        portfolioRiskConfirmed: true,
      }),
    }).policy,
    "allow",
  );
});

test("explicit short-history deny wins over leveraged confirmation", () => {
  const decision = getPortfolioAddDecision({
    ...readyAsset,
    ticker: "NEW3X",
    usablePriceHistoryYears: 1.5,
    rollingCagrWindowYears: 1,
    exposureType: "leveraged_etf",
    leverageMultiple: 3,
  });
  assert.equal(decision.policy, "deny");
  assert.equal(decision.reasonCode, "insufficient_long_horizon_history");
});
