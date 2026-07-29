import assert from "node:assert/strict";
import test from "node:test";

import {
  getPortfolioAddDecision,
  isLeveragedOrInverse,
} from "./portfolioEligibilityPolicy.js";
import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import { createPortfolioReportText } from "../../components/portfolio/utils/portfolioReports.js";

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

test("price and rolling history produce accurate deny reasons at the configured minimum", () => {
  for (const [asset, reasonCode, message] of [
    [{
      ...readyAsset,
      usablePriceHistoryYears: 2.9,
      rollingCagrWindowYears: 3,
      portfolioEligibleAfterDate: "2027-09-01",
    }, "insufficient_usable_price_history", /가격 이력 2\.9년, 최소 3년 필요/],
    [{
      ...readyAsset,
      usablePriceHistoryYears: 3.1,
      rollingCagrWindowYears: 1,
    }, "insufficient_rolling_window_history", /적용 RM 1년, 최소 3년 필요/],
  ]) {
    const decision = getPortfolioAddDecision(asset);
    assert.equal(decision.policy, "deny");
    assert.equal(decision.reasonCode, reasonCode);
    assert.match(decision.message, message);
    assert.doesNotMatch(decision.message, /3\.1년.*최소 3년/);
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
    assert.deepEqual(result.portfolioEligibilityBlocks, [{
      market: "US",
      ticker: "SPY",
      reasonCode,
      usablePriceHistoryYears: asset.usablePriceHistoryYears,
      rollingCagrWindowYears: asset.rollingCagrWindowYears,
      minimumPortfolioHistoryYears: 3,
      portfolioEligibleAfterDate: asset.portfolioEligibleAfterDate || "",
    }]);
  }
});

test("custom minimum history years controls both history checks", () => {
  const decision = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 4.9,
    rollingCagrWindowYears: 4,
    minimumPortfolioHistoryYears: 5,
  });
  assert.equal(decision.reasonCode, "insufficient_price_and_rolling_history");
  assert.match(decision.message, /최소 5년 필요/);
});

test("history availability text names the metric that is still insufficient", () => {
  const priceOnly = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 2.9,
    rollingCagrWindowYears: 3,
  });
  assert.match(
    priceOnly.message,
    /충분한 가격 이력이 확보된 이후 사용할 수 있습니다\./,
  );

  const rmOnly = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 3.1,
    rollingCagrWindowYears: 1,
  });
  assert.match(
    rmOnly.message,
    /충분한 장기 RM 표본이 확보된 이후 사용할 수 있습니다\./,
  );
  assert.doesNotMatch(
    rmOnly.message,
    /충분한 가격 이력이 확보된 이후/,
  );

  const both = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 2.9,
    rollingCagrWindowYears: 1,
  });
  assert.match(
    both.message,
    /가격 이력과 장기 RM 표본이 모두 확보된 이후 사용할 수 있습니다\./,
  );
});

test("multiple blocked assets are retained once each after persisted reload", () => {
  const assets = ["AAA", "BBB"].map((ticker) => {
    const source = {
      ...readyAsset,
      ticker,
      targetWeight: 50,
      usablePriceHistoryYears: 3.1,
      rollingCagrWindowYears: 1,
    };
    return { ...source, ...normalizePersistedMetricFields(JSON.parse(JSON.stringify(source))) };
  });
  const result = buildMonthlyBaselineProjection({
    settings: {
      startValue: 1000,
      years: 1,
      monthlyCashFlow: 0,
      inflationRate: 0,
      dividendReinvest: true,
    },
    assets,
  });
  assert.deepEqual(
    result.portfolioEligibilityBlocks.map((block) => `${block.market}:${block.ticker}`),
    ["US:AAA", "US:BBB"],
  );
  const report = createPortfolioReportText({ result, assets });
  assert.equal(report.match(/US:AAA:/g)?.length, 1);
  assert.equal(report.match(/US:BBB:/g)?.length, 1);
  assert.match(report, /제거하거나 이용 가능한 자산으로 교체/);
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
  assert.equal(decision.reasonCode, "insufficient_price_and_rolling_history");
});
