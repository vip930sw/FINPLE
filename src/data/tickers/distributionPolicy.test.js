import assert from "node:assert/strict";
import test from "node:test";

import {
  TRAILING_DISTRIBUTION_YIELD_POLICY,
  isNonOrdinaryDistribution,
  resolveDividendYieldDisplay,
  resolveDistributionDisplayPolicy,
  resolveDistributionYieldFields,
  resolvePortfolioCashFlowDisplayPolicy,
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

test("distribution display resolver distinguishes provider, special, mixed, and futures semantics", () => {
  const provider = resolveDistributionDisplayPolicy({
    distributionDataQualityStatus: "provider_event_error",
  });
  assert.equal(provider.title, "분배 데이터 확인 필요");
  assert.deepEqual(provider.notices, [
    "공급자 현금 이벤트 기준 불일치",
    "시뮬레이션 재투자 제외",
  ]);
  const providerYield = resolveDistributionYieldFields({
    distributionDataQualityStatus: "provider_event_error",
    trailingDistributionYield: 999,
  });
  assert.equal(providerYield.trailingDistributionYield, 999);
  assert.equal(providerYield.reinvestmentCashYield, 0);
  assert.equal(providerYield.simulationCashYield, 0);

  const special = resolveDistributionDisplayPolicy({
    distributionType: "special_or_liquidating_distribution",
  });
  assert.equal(special.title, "특별·청산 분배");
  assert.match(special.notices.join("|"), /자산 매각·청산 지급/);
  assert.doesNotMatch(special.notices.join("|"), /옵션/);

  const mixed = resolveDistributionDisplayPolicy({
    distributionType: "mixed_distribution",
  });
  assert.equal(mixed.title, "옵션 분배");
  assert.match(mixed.notices.join("|"), /원금환급 가능/);

  const futures = resolveDistributionDisplayPolicy({
    distributionType: "futures_mixed_distribution",
  });
  assert.equal(futures.title, "선물·파생 분배");
  assert.match(futures.notices.join("|"), /롤오버 영향/);

  assert.equal(
    resolvePortfolioCashFlowDisplayPolicy([
      { distributionType: "ordinary_cash_dividend" },
    ]).rankLabel,
    "배당 순위",
  );
  assert.equal(
    resolvePortfolioCashFlowDisplayPolicy([
      { distributionType: "mixed_distribution" },
    ]).rankLabel,
    "현금흐름 순위",
  );
  assert.equal(
    resolvePortfolioCashFlowDisplayPolicy([
      { distributionType: "ordinary_cash_dividend" },
      { distributionType: "mixed_distribution" },
    ]).yieldLabel,
    "예상 현금수익률",
  );
});

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

test("Screener and Step 1 share the explicit dividend-only display state contract", () => {
  for (const [ticker, dividendYield] of [
    ["TQQQ", 0.47],
    ["069500", 0.46],
    ["SCHD", 3.30],
  ]) {
    assert.deepEqual(
      resolveDividendYieldDisplay({
        ticker,
        distributionType: "ordinary_cash_dividend",
        dividendYield,
        dividendStatus: "confirmed_value",
        dataStatus: "review_required",
        metricsStatus: "review_required",
        reviewFlag: "review_required",
        reviewTag: "review_required",
      }),
      { kind: "confirmed_value", text: `${dividendYield.toFixed(2)}%` },
      ticker,
    );
  }

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "GLD",
      distributionType: "none",
      dividendYield: 0,
      dividendStatus: "confirmed_zero",
      displayDividendYield: "0.00%",
      dividendPolicy: "no_dividend",
    }),
    { kind: "confirmed_zero", text: "0.00%" },
  );

  for (const dividendStatus of ["", "missing", "unconfirmed", "pending", "unknown"]) {
    assert.deepEqual(
      resolveDividendYieldDisplay({
        ticker: "MISS",
        distributionType: "ordinary_cash_dividend",
        dividendYield: null,
        dividendStatus,
      }),
      { kind: "missing", text: "확인 중" },
      dividendStatus || "empty status",
    );
  }

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "REVIEW",
      distributionType: "ordinary_cash_dividend",
      dividendYield: 2.5,
      dividendStatus: "review_required",
    }),
    { kind: "review_required", text: "확인 필요" },
  );

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "POLICY-REVIEW",
      distributionType: "ordinary_cash_dividend",
      dividendYield: 2.5,
      dividendStatus: "confirmed_value",
      dividendPolicy: "review_required",
    }),
    { kind: "review_required", text: "확인 필요" },
  );

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "SOXL",
      distributionType: "ordinary_cash_dividend",
      dividendYield: 0,
      dividendStatus: "confirmed_value",
      dividendPolicy: "no_dividend",
      reviewFlag: "review_required",
    }),
    { kind: "missing", text: "확인 중" },
  );

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "NO-DIVIDEND",
      distributionType: "none",
      dividendYield: null,
      dividendStatus: "",
      dividendPolicy: "no_dividend",
    }),
    { kind: "no_dividend", text: "-" },
  );

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "MISSING-NO-DIVIDEND",
      distributionType: "ordinary_cash_dividend",
      dividendYield: null,
      dividendStatus: "missing",
      dividendPolicy: "no_dividend",
    }),
    { kind: "missing", text: "확인 중" },
  );

  for (const [ticker, trailingDistributionYield, distributionFrequency] of [
    ["AIPI", 34.98, "weekly"],
    ["QYLG", 16.26, "monthly"],
  ]) {
    assert.deepEqual(
      resolveDividendYieldDisplay({
        ticker,
        exposureType: ticker === "AIPI"
          ? "single_stock_option_income"
          : "index_covered_call_growth",
        distributionType: "mixed_distribution",
        distributionFrequency,
        dividendYield: 0,
        dividendStatus: "confirmed_zero",
        trailingDistributionYield,
      }),
      { kind: "non_ordinary", text: null },
      ticker,
    );
  }

  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "CASH",
      market: "CASH",
      dividendYield: 0,
    }),
    { kind: "cash", text: "-" },
  );
  assert.deepEqual(
    resolveDividendYieldDisplay({
      ticker: "UNCONFIRMED-ZERO",
      distributionType: "ordinary_cash_dividend",
      dividendYield: 0,
    }),
    { kind: "missing", text: "확인 중" },
  );
});

test("ordinary saved assets never replace dividendYield with trailing distribution fields", () => {
  const reloadedSpy = normalizePersistedMetricFields(JSON.parse(JSON.stringify({
    ticker: "SPY",
    exposureType: "ordinary_etf",
    distributionType: "ordinary_cash_dividend",
    dividendYield: 1.01,
    trailingDistributionYield: 9.99,
    cashDistributionYieldTtm: 8.88,
  })));
  assert.equal(reloadedSpy.dividendYield, 1.01);
  assert.equal(reloadedSpy.trailingDistributionYield, 9.99);
  assert.equal(reloadedSpy.cashDistributionYieldTtm, 8.88);

  for (const [ticker, dividendYield, distributionType] of [
    ["QQQ", 0.41, "ordinary_cash_dividend"],
    ["GLD", 0, "none"],
  ]) {
    const reloaded = normalizePersistedMetricFields({
      ticker,
      exposureType: "ordinary_etf",
      distributionType,
      dividendYield,
      trailingDistributionYield: 9.99,
    });
    assert.equal(reloaded.dividendYield, dividendYield, ticker);
    assert.equal(reloaded.trailingDistributionYield, 9.99, ticker);
  }
});

test("legacy saved ordinary assets retain their dividend value without distribution metadata", () => {
  const reloaded = normalizePersistedMetricFields(JSON.parse(JSON.stringify({
    ticker: "LEGACY",
    dividendYield: 2.5,
    displayDividendYield: "2.50%",
  })));
  assert.equal(reloaded.dividendYield, 2.5);
  assert.equal(reloaded.displayDividendYield, "2.50%");
  assert.equal(reloaded.trailingDistributionYield, null);
  assert.equal(reloaded.cashDistributionYieldTtm, null);
  assert.equal(reloaded.distributionType, "unknown");
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
  assert.equal(
    reloaded.distributionCalculationStatus,
    "review_only_no_approved_reinvestment_model",
  );
  assert.equal(reloaded.dividendYield, null);

  const pdfLine = describeAssetDistribution(reloaded);
  assert.match(pdfLine, /옵션 분배/);
  assert.match(pdfLine, /최근 12개월 분배율 34\.98%/);
  assert.match(pdfLine, /주간 분배/);
  assert.match(pdfLine, /원금환급 가능/);
  assert.match(pdfLine, /변동 분배율/);
  assert.doesNotMatch(pdfLine, /일반 배당률 34\.98%/);
});
