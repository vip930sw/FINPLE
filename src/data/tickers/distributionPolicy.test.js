import assert from "node:assert/strict";
import test from "node:test";

import {
  TRAILING_DISTRIBUTION_YIELD_POLICY,
  isNonOrdinaryDistribution,
  resolveDistributionYieldFields,
} from "./distributionPolicy.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import { describeAssetDistribution } from "../../components/portfolio/utils/portfolioReports.js";

const OPTION_FIXTURES = [
  {
    ticker: "AIPI",
    exposureType: "single_stock_option_income",
    distributionType: "mixed_distribution",
    distributionFrequency: "weekly",
    metricDividendYield: 34.98,
  },
  {
    ticker: "MSFY",
    exposureType: "single_stock_weekly_income",
    distributionType: "mixed_distribution",
    distributionFrequency: "weekly",
    metricDividendYield: 28.30,
  },
  {
    ticker: "TSLP",
    exposureType: "single_stock_weekly_income",
    distributionType: "mixed_distribution",
    distributionFrequency: "weekly",
    metricDividendYield: 28.11,
  },
  {
    ticker: "QYLG",
    exposureType: "index_covered_call_growth",
    distributionType: "mixed_distribution",
    distributionFrequency: "monthly",
    metricDividendYield: 16.26,
  },
];

test("AIPI, MSFY, TSLP, and QYLG preserve trailing distributions without ordinary dividends", () => {
  for (const fixture of OPTION_FIXTURES) {
    const resolved = {
      ...fixture,
      ...resolveDistributionYieldFields(fixture, fixture.metricDividendYield),
    };
    assert.equal(isNonOrdinaryDistribution(resolved), true, fixture.ticker);
    assert.equal(resolved.trailingDistributionYield, fixture.metricDividendYield, fixture.ticker);
    assert.equal(resolved.cashDistributionYieldTtm, fixture.metricDividendYield, fixture.ticker);
    assert.equal(resolved.dividendYield, null, fixture.ticker);
    assert.equal(resolved.displayDividendYield, "", fixture.ticker);
    assert.equal(resolved.distributionYieldPolicy, TRAILING_DISTRIBUTION_YIELD_POLICY, fixture.ticker);
    assert.equal(
      resolved.distributionCalculationStatus,
      "review_only_no_approved_reinvestment_model",
      fixture.ticker,
    );
  }
  assert.equal(OPTION_FIXTURES.at(-1).exposureType, "index_covered_call_growth");
});

test("QQQ and SPY keep ordinary dividends while GLD keeps confirmed zero distinct from missing", () => {
  for (const [ticker, dividendYield] of [["QQQ", 0.41], ["SPY", 1.01]]) {
    const fixture = {
      ticker,
      exposureType: "ordinary_etf",
      distributionType: "ordinary_cash_dividend",
    };
    const resolved = resolveDistributionYieldFields(fixture, dividendYield);
    assert.equal(isNonOrdinaryDistribution(fixture), false);
    assert.equal(resolved.dividendYield, dividendYield);
    assert.equal(resolved.displayDividendYield, `${dividendYield.toFixed(2)}%`);
    assert.equal(resolved.trailingDistributionYield, null);
  }

  const gld = {
    ticker: "GLD",
    exposureType: "ordinary_etf",
    distributionType: "none",
    dividendStatus: "confirmed_zero",
    ...resolveDistributionYieldFields(
      { exposureType: "ordinary_etf", distributionType: "none" },
      0,
    ),
  };
  assert.equal(gld.dividendYield, 0);
  assert.equal(gld.displayDividendYield, "0.00%");
  assert.equal(gld.dividendStatus, "confirmed_zero");
  assert.notEqual(gld.dividendYield, null);
});

test("saved portfolio reload and report text preserve non-ordinary distribution semantics", () => {
  const source = {
    ticker: "AIPI",
    exposureType: "single_stock_option_income",
    distributionType: "mixed_distribution",
    distributionFrequency: "weekly",
    trailingDistributionYield: 34.98,
    cashDistributionYieldTtm: 34.98,
    distributionYieldPolicy: TRAILING_DISTRIBUTION_YIELD_POLICY,
    distributionCalculationStatus: "review_only_no_approved_reinvestment_model",
    dividendYield: null,
  };
  const reloaded = normalizePersistedMetricFields(JSON.parse(JSON.stringify(source)));
  assert.equal(reloaded.exposureType, source.exposureType);
  assert.equal(reloaded.distributionType, source.distributionType);
  assert.equal(reloaded.distributionFrequency, source.distributionFrequency);
  assert.equal(reloaded.trailingDistributionYield, 34.98);
  assert.equal(reloaded.cashDistributionYieldTtm, 34.98);
  assert.equal(reloaded.distributionYieldPolicy, TRAILING_DISTRIBUTION_YIELD_POLICY);
  assert.equal(reloaded.dividendYield, null);

  const pdfLine = describeAssetDistribution(reloaded);
  assert.match(pdfLine, /최근 12개월 분배율 34\.98%/);
  assert.match(pdfLine, /주간 분배/);
  assert.match(pdfLine, /일반 배당수익률·총수익률과 다름/);
  assert.match(pdfLine, /원금환급 가능성/);
  assert.doesNotMatch(pdfLine, /일반 배당률 34\.98%/);
});
