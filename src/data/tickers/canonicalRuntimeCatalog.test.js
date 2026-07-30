import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";
import test from "node:test";

import { createServer } from "vite";

import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";

const COLUMNS = [
  "market",
  "ticker",
  "name",
  "assetType",
  "expectedCagr",
  "beta",
  "mdd",
  "priceMetricsStatus",
  "portfolioEligible",
  "portfolioAddPolicy",
  "rawPriceCagr",
  "rollingCagrMedian",
  "rollingCagrWindowYears",
  "rollingCagrWindowCount",
  "priceHistoryStartDate",
  "usablePriceHistoryYears",
  "minimumPortfolioHistoryYears",
  "portfolioEligibilityStatus",
  "portfolioEligibilityReason",
  "cagrConfidence",
  "simulatorReady",
  "active",
  "includeInSimulator",
  "exposureType",
  "distributionType",
  "distributionFrequency",
  "dividendYield",
  "dividendStatus",
  "cashDistributionYieldTtm",
  "trailingDistributionYield",
  "reinvestmentCashYield",
  "simulationCashYield",
  "distributionSimulationPolicy",
  "distributionCalculationStatus",
  "leverageMultiple",
  "direction",
  "resetFrequency",
  "metadataVerificationStatus",
];

const BASE_ROWS = [
  {
    market: "US",
    ticker: "AAA",
    name: "Synthetic Alpha",
    assetType: "ETF",
    expectedCagr: "10",
    rawPriceCagr: "8",
    rollingCagrMedian: "10",
    rollingCagrWindowYears: "10",
    rollingCagrWindowCount: "12",
    beta: "1.1",
    mdd: "-20",
    priceMetricsStatus: "ready",
    portfolioEligible: "true",
    portfolioEligibilityStatus: "eligible",
    portfolioAddPolicy: "allow",
    cagrConfidence: "high",
    simulatorReady: "true",
    active: "true",
    includeInSimulator: "true",
    exposureType: "ordinary_etf",
    distributionType: "ordinary_cash_dividend",
    distributionFrequency: "quarterly",
    dividendYield: "2.5",
    dividendStatus: "confirmed_value",
    reinvestmentCashYield: "2.5",
    simulationCashYield: "2.5",
    distributionSimulationPolicy: "ordinary_cash_dividend",
    distributionCalculationStatus: "confirmed_value",
  },
  {
    market: "KR",
    ticker: "000001",
    name: "합성 단기이력",
    assetType: "stock",
    expectedCagr: "4",
    rawPriceCagr: "6",
    rollingCagrMedian: "4",
    rollingCagrWindowYears: "3",
    rollingCagrWindowCount: "2",
    beta: "0.8",
    mdd: "-15",
    priceMetricsStatus: "ready",
    portfolioEligible: "false",
    portfolioEligibilityStatus: "insufficient_long_horizon_history",
    portfolioEligibilityReason: "insufficient_usable_price_history",
    portfolioAddPolicy: "deny",
    cagrConfidence: "low",
    simulatorReady: "false",
    active: "true",
    includeInSimulator: "true",
    exposureType: "ordinary_equity",
    distributionType: "ordinary_cash_dividend",
    distributionFrequency: "annual",
    dividendYield: "",
    dividendStatus: "confirmed_zero",
    reinvestmentCashYield: "0",
    simulationCashYield: "0",
    distributionSimulationPolicy: "ordinary_cash_dividend",
    distributionCalculationStatus: "confirmed_zero",
  },
];

function csv(rows = BASE_ROWS, columns = COLUMNS) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
}

function buildResult(asset) {
  return buildMonthlyBaselineProjection({
    settings: {
      startValue: 100,
      monthlyCashFlow: 0,
      years: 1,
      inflationRate: 0,
      dividendReinvest: true,
    },
    assets: [{ ...asset, targetWeight: 100 }],
  });
}

async function withLoader(run) {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    await run(
      await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
      vite,
    );
  } finally {
    await vite.close();
  }
}

test("official preset and persistence hydration paths apply the manual CASH contract", async () => {
  await withLoader(async (loader, vite) => {
    const constants = await vite.ssrLoadModule("/src/components/portfolio/constants.js");
    const presetNames = [
      "DEFAULT_ASSETS",
      "DIVIDEND_ASSETS",
      "STABLE_ASSETS",
      "GROWTH_ASSETS",
      "GOLD_DEFENSE_ASSETS",
      "REIT_INCOME_ASSETS",
      "GROWTH_ZERO_ASSETS",
      "GROWTH_FOCUS_ASSETS",
      "ALL_WEATHER_ASSETS",
      "HIGH_CONVICTION_ASSETS",
    ];
    const settings = {
      startValue: 50_000_000,
      monthlyCashFlow: 1_000_000,
      years: 10,
      inflationRate: 2.5,
      dividendReinvest: true,
    };

    for (const name of presetNames) {
      const result = buildMonthlyBaselineProjection({
        settings,
        assets: constants[name],
      });
      assert.equal(result.status, "ready", `${name}:${result.blockReasons.join("|")}`);
    }

    for (const dataSource of [
      "preset-cash",
      "investment-mbti-cash",
      "manual-cash",
      "finple_manual_cash_reference",
    ]) {
      const preserved = {
        ticker: "CASH",
        market: "CASH",
        assetType: "CASH",
        dataSource,
        id: `saved-${dataSource}`,
        name: "사용자 현금",
        quantity: 7,
        price: 12345,
        targetWeight: 10,
        targetEvaluationAmount: 86415,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-02T00:00:00.000Z",
        cagr: 2.5,
        dividendYield: 2,
      };
      const hydrated = loader.hydratePortfolioFromActiveCatalog({
        assets: [{ ...preserved }],
      }).assets[0];
      assert.equal(hydrated.id, preserved.id);
      assert.equal(hydrated.name, preserved.name);
      assert.equal(hydrated.quantity, preserved.quantity);
      assert.equal(hydrated.price, preserved.price);
      assert.equal(hydrated.targetWeight, preserved.targetWeight);
      assert.equal(hydrated.targetEvaluationAmount, preserved.targetEvaluationAmount);
      assert.equal(hydrated.createdAt, preserved.createdAt);
      assert.equal(hydrated.updatedAt, preserved.updatedAt);
      assert.equal(hydrated.dataSource, "finple_manual_cash_reference");
      assert.equal(hydrated.expectedCagr, 2);
      assert.equal(hydrated.dividendYield, 0);
      assert.equal(hydrated.simulationCashYield, 0);
      assert.equal(hydrated.portfolioAddPolicy, "allow");
    }

    const rejected = {
      ticker: "CASH",
      market: "CASH",
      assetType: "CASH",
      dataSource: "user-input",
    };
    assert.strictEqual(loader.hydratePortfolioAssetFromActiveCatalog(rejected), rejected);
  });
});

test("synthetic canonical CSV parses metrics and enforces structural validity", async () => {
  await withLoader(async (loader) => {
    const candidates = loader.createCanonicalScreenerCatalog(csv());
    const aaa = loader.findScreenerCandidateInCatalog(candidates, "AAA", "US");
    const kr = loader.findScreenerCandidateInCatalog(candidates, "000001", "KR");

    assert.equal(candidates.length, 2);
    assert.equal(aaa.rawPriceCagr, 8);
    assert.equal(aaa.rollingCagrMedian, 10);
    assert.equal(aaa.expectedCagr, 10);
    assert.equal(aaa.beta, 1.1);
    assert.equal(aaa.mdd, -20);
    assert.equal(aaa.dividendYield, 2.5);
    assert.equal(kr.portfolioAddPolicy, "deny");

    const blankMetrics = loader.createCanonicalScreenerCatalog(
      csv([{ ...BASE_ROWS[0], expectedCagr: "", beta: "", mdd: "" }]),
    )[0];
    assert.equal(blankMetrics.expectedCagr, null);
    assert.equal(blankMetrics.beta, null);
    assert.equal(blankMetrics.mdd, null);

    assert.equal(
      loader.createCanonicalScreenerCatalog(
        csv([{ ...BASE_ROWS[0], expectedCagr: "11.25" }]),
      )[0].expectedCagr,
      11.25,
    );
    assert.equal(
      loader.createCanonicalScreenerCatalog(
        csv([{ ...BASE_ROWS[0], expectedCagr: "1,234.56" }]),
      )[0].expectedCagr,
      1234.56,
    );

    for (const [field, value] of [
      ["expectedCagr", "ERROR"],
      ["beta", "N/A"],
      ["mdd", "--"],
      ["dividendYield", "unknown"],
      ["leverageMultiple", "3x"],
    ]) {
      assert.throws(
        () => loader.createCanonicalScreenerCatalog(
          csv([{ ...BASE_ROWS[0], [field]: value }]),
        ),
        {
          name: "TypeError",
          message: `canonical catalog invalid numeric value at row 2: field=${field} value=${value}`,
        },
      );
    }

    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv([BASE_ROWS[0], BASE_ROWS[0]])),
      /canonical catalog duplicate identity: US:AAA/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv([{ ...BASE_ROWS[0], ticker: "" }])),
      /canonical catalog missing ticker/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv([{ ...BASE_ROWS[0], name: "" }])),
      /canonical catalog missing display name/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv([{ ...BASE_ROWS[0], market: "JP" }])),
      /canonical catalog invalid market/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv([], COLUMNS)),
      /at least one data row/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(csv(BASE_ROWS, COLUMNS.filter((field) => field !== "beta"))),
      /canonical catalog missing required header: beta/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(`${COLUMNS.join(",")}\nUS,AAA`),
      /has 2 cells; expected/,
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog(`${COLUMNS.join(",")}\n"US,AAA`),
      /unterminated quoted field/,
    );

    const ambiguous = loader.createCanonicalScreenerCatalog(
      csv([
        BASE_ROWS[0],
        { ...BASE_ROWS[1], ticker: "AAA" },
      ]),
    );
    assert.equal(loader.findScreenerCandidateInCatalog(ambiguous, "AAA"), null);
    assert.equal(loader.findScreenerCandidateInCatalog(ambiguous, "AAA", "US").market, "US");
    assert.equal(loader.findScreenerCandidateInCatalog(ambiguous, "MISSING"), null);
  });
});

test("runtime canonical catalog is relationally consistent", async () => {
  await withLoader(async (loader) => {
    const candidates = loader.ALL_SCREENER_CANDIDATES;
    const identities = candidates.map((asset) => `${asset.market}:${asset.ticker}`);
    const usable = candidates.filter(
      (asset) => asset.priceMetricsStatus === "ready" && asset.rollingCagrMedian !== null,
    );

    assert.ok(candidates.length > 0);
    assert.equal(
      candidates.length,
      loader.US_SCREENER_CANDIDATES.length + loader.KR_SCREENER_CANDIDATES.length,
    );
    assert.equal(new Set(identities).size, candidates.length);
    assert.ok(usable.length > 0);
    for (const candidate of usable) {
      assert.equal(candidate.expectedCagr, candidate.rollingCagrMedian);
      assert.equal(candidate.dataSource, "finple_app_candidates_v2");
      const hydrated = loader.hydratePortfolioAssetFromActiveCatalog({
        market: candidate.market,
        ticker: candidate.ticker,
      });
      assert.equal(hydrated.cagr, candidate.expectedCagr);
      assert.equal(hydrated.dataSource, "finple_app_candidates_v2");
    }

    const loaderSource = fs.readFileSync(
      "src/data/tickers/screenerCandidateLoader.js",
      "utf8",
    );
    assert.doesNotMatch(loaderSource, /finple_app_candidates_6000_balanced_v1\.csv\?raw/);
    assert.doesNotMatch(loaderSource, /production_v1_fallback/);
  });
});

test("Screener, direct, MBTI, and preset paths use canonical hydration", () => {
  const screener = fs.readFileSync("src/components/ScreenerPage.jsx", "utf8");
  const simulator = fs.readFileSync(
    "src/components/portfolio/hooks/usePortfolioSimulator.js",
    "utf8",
  );
  const mbti = fs.readFileSync("src/components/InvestmentMbtiPage.jsx", "utf8");
  const presets = fs.readFileSync("src/components/portfolio/constants.js", "utf8");

  assert.match(screener, /US_SCREENER_CANDIDATES/);
  assert.match(screener, /KR_SCREENER_CANDIDATES/);
  assert.match(simulator, /hydratePortfolioAssetFromActiveCatalog/);
  assert.match(
    simulator,
    /fetchTickerCandidateByTicker\(ticker,\s*\{\s*market:/,
  );
  assert.match(mbti, /hydrateAssetFromScreenerCandidate/);
  assert.match(mbti, /dataSource: isCash \? "investment-mbti-cash"/);
  assert.match(mbti, /dataSource: baseAsset\.dataSource/);
  assert.match(presets, /hydrateAssetFromScreenerCandidate/);
});

test("canonical CSV replacement and universe change update runtime without code changes", async () => {
  await withLoader(async (loader) => {
    const initial = loader.createCanonicalScreenerCatalog(csv());
    const changedCagr = 11.25;
    const replacement = loader.createCanonicalScreenerCatalog(
      csv([
        {
          ...BASE_ROWS[0],
          expectedCagr: String(changedCagr),
          rollingCagrMedian: String(changedCagr),
        },
        BASE_ROWS[1],
        { ...BASE_ROWS[0], ticker: "BBB", name: "Synthetic Beta" },
      ]),
    );
    const changed = loader.findScreenerCandidateInCatalog(replacement, "AAA", "US");
    const added = loader.findScreenerCandidateInCatalog(replacement, "BBB", "US");

    assert.equal(replacement.length, initial.length + 1);
    assert.ok(added);
    assert.equal(changed.expectedCagr, changedCagr);

    const saved = loader.hydratePortfolioAssetFromActiveCatalog(
      {
        market: "US",
        ticker: "AAA",
        name: "사용자 저장 이름",
        quantity: 7,
        targetWeight: 100,
        expectedCagr: 999,
        portfolioAddPolicy: "deny",
        leverageMultiple: -3,
        direction: "inverse",
        resetFrequency: "daily",
        metadataVerificationStatus: "verified",
      },
      { candidate: changed },
    );
    assert.equal(saved.name, "사용자 저장 이름");
    assert.equal(saved.quantity, 7);
    assert.equal(saved.targetWeight, 100);
    assert.equal(saved.expectedCagr, changedCagr);
    assert.equal(saved.portfolioAddPolicy, "allow");
    assert.equal(saved.leverageMultiple, null);
    assert.equal(saved.direction, "long");
    assert.equal(saved.resetFrequency, "not_applicable");
    assert.equal(saved.metadataVerificationStatus, "");
    assert.equal(buildResult(saved).expectedCagr, changedCagr);

    const removed = loader.createCanonicalScreenerCatalog(csv([BASE_ROWS[0]]));
    assert.equal(removed.length, 1);
    assert.equal(loader.findScreenerCandidateInCatalog(removed, "000001", "KR"), null);
  });
});
