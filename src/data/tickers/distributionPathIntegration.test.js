import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";

import { createServer } from "vite";

import { sha256Hex } from "../../utils/sha256.js";
import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import {
  createPortfolioReportText,
  createReportSummaryText,
} from "../../components/portfolio/utils/portfolioReports.js";

const BASE_URL = "http://distribution-path.test";
const EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z";
const STALE_OVERLAY_VALUE = 987.654321;
const SYNTHETIC_COLUMNS = [
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
];

const SYNTHETIC_ROWS = [
  {
    market: "US",
    ticker: "OPT",
    name: "Synthetic Option Income",
    assetType: "ETF",
    expectedCagr: "9",
    rawPriceCagr: "7",
    rollingCagrMedian: "9",
    rollingCagrWindowYears: "5",
    rollingCagrWindowCount: "10",
    beta: "1.2",
    mdd: "-30",
    priceMetricsStatus: "ready",
    portfolioEligible: "true",
    portfolioEligibilityStatus: "eligible",
    portfolioAddPolicy: "allow",
    cagrConfidence: "medium",
    simulatorReady: "true",
    active: "true",
    includeInSimulator: "true",
    exposureType: "index_covered_call",
    distributionType: "mixed_distribution",
    distributionFrequency: "monthly",
    dividendYield: "",
    dividendStatus: "confirmed_value",
    cashDistributionYieldTtm: "17.25",
    trailingDistributionYield: "17.25",
    reinvestmentCashYield: "17.25",
    simulationCashYield: "17.25",
    distributionSimulationPolicy: "repeat_ttm_distribution",
    distributionCalculationStatus: "confirmed_value",
  },
  {
    market: "US",
    ticker: "NEW",
    name: "Synthetic Short History",
    assetType: "ETF",
    expectedCagr: "5",
    rawPriceCagr: "5",
    rollingCagrMedian: "5",
    rollingCagrWindowYears: "1",
    rollingCagrWindowCount: "1",
    beta: "0.9",
    mdd: "-12",
    priceMetricsStatus: "ready",
    portfolioEligible: "false",
    portfolioEligibilityStatus: "insufficient_long_horizon_history",
    portfolioEligibilityReason: "insufficient_usable_price_history",
    portfolioAddPolicy: "deny",
    cagrConfidence: "low",
    simulatorReady: "false",
    active: "true",
    includeInSimulator: "true",
    exposureType: "ordinary_etf",
    distributionType: "ordinary_cash_dividend",
    distributionFrequency: "quarterly",
    dividendYield: "1",
    dividendStatus: "confirmed_value",
    reinvestmentCashYield: "1",
    simulationCashYield: "1",
    distributionSimulationPolicy: "ordinary_cash_dividend",
    distributionCalculationStatus: "confirmed_value",
  },
];

function syntheticCsv() {
  return [
    SYNTHETIC_COLUMNS.join(","),
    ...SYNTHETIC_ROWS.map((row) =>
      SYNTHETIC_COLUMNS.map((column) => row[column] ?? "").join(","),
    ),
  ].join("\n");
}

function jsonBytes(value) {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

function createFixture(candidates) {
  const overlay = {
    exportVersion: EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    rows: candidates.map((candidate) => ({
      identity: `${candidate.market}:${candidate.ticker}`,
      market: candidate.market,
      ticker: candidate.ticker,
      selectedCagr: STALE_OVERLAY_VALUE,
      rawPriceCagr10y: STALE_OVERLAY_VALUE,
      rollingCagr10yMedian: STALE_OVERLAY_VALUE,
      rollingCagr10yP25: STALE_OVERLAY_VALUE,
      rollingCagr10yP75: STALE_OVERLAY_VALUE,
      validRollingWindowCount10y: 2,
      cagrPolicy: "rolling_10y_median",
      selectedMdd: -99,
      mddPolicy: "full_period_actual",
      selectedBeta: 9,
      betaPolicy: "aligned_monthly_return_beta",
      dividendYield: STALE_OVERLAY_VALUE,
      dividendStatus: "available",
      dataStatus: "ready",
      reviewFlag: "none",
      reviewReason: "",
      metricBaseDate: "2026-07-22",
      rawPriceCoverageStatus: "covered",
      internalPreviewReviewOnly: true,
      productionPublishReady: false,
      appExportApproved: false,
      sourceHash: "stale-overlay-source",
    })),
  };
  const overlayBytes = jsonBytes(overlay);
  const marketAssetCounts = candidates.reduce((counts, candidate) => {
    counts[candidate.market] = (counts[candidate.market] || 0) + 1;
    return counts;
  }, {});
  const manifest = {
    exportVersion: EXPORT_VERSION,
    candidatePackageReady: true,
    packageGlobalBlockingIssueCount: 0,
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    assetCount: candidates.length,
    activeAssetCount: candidates.length,
    inactiveAssetCount: 0,
    marketAssetCounts,
    monthlyReturnAssetCount: 0,
    monthlyReturnRowCount: 0,
    shardCount: 64,
    shardInventory: Array.from({ length: 64 }, (_, index) => ({
      path: `monthly-returns/monthly-returns-${index.toString(16).padStart(2, "0")}.json`,
      sha256: "0".repeat(64),
      assetCount: 0,
      rowCount: 0,
    })),
    metricBaseDate: "2026-07-22",
    metricDataThroughMonth: "2026-06",
    sourceCandidatePackageHash: "distribution-path-fixture-package",
    pipelineVersion: "metrics-v3.0-step114-2d",
    calculationPolicyVersion: "metrics-calculation-policy-2026-06-26",
    metricsOverlay: {
      path: "metrics-overlay.json",
      sha256: sha256Hex(overlayBytes),
    },
    monthlyReturnsIndex: {
      path: "monthly-returns-index.json",
      sha256: "0".repeat(64),
    },
  };
  return new Map([
    [`${BASE_URL}/app-preview-manifest.json`, jsonBytes(manifest)],
    [`${BASE_URL}/metrics-overlay.json`, overlayBytes],
  ]);
}

function createFetch(files) {
  return async (url) => {
    const bytes = files.get(url);
    return new Response(bytes || "missing", {
      status: bytes ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };
}

function roundTripSavedAsset(asset) {
  const parsed = JSON.parse(JSON.stringify(asset));
  return { ...parsed, ...normalizePersistedMetricFields(parsed) };
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

function reportTexts(asset, result) {
  const input = {
    activePortfolio: { name: asset.ticker },
    detailReport: { type: "canonical", tags: [], summary: "canonical" },
    result,
    assets: [asset],
    detailPortfolio: {
      realValueRank: 1,
      growthRank: 1,
      stabilityRank: 1,
      dividendRank: 1,
    },
  };
  return [createPortfolioReportText(input), createReportSummaryText(input)];
}

test("synthetic distribution and short-history contracts flow through persistence and baseline", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const [optionCandidate, shortHistoryCandidate] =
      loader.createCanonicalScreenerCatalog(syntheticCsv());
    const option = roundTripSavedAsset(
      loader.hydratePortfolioAssetFromActiveCatalog(
        { market: "US", ticker: "OPT", quantity: 1, targetWeight: 100 },
        { candidate: optionCandidate },
      ),
    );

    assert.equal(option.dividendYield, null);
    assert.equal(option.cashDistributionYieldTtm, 17.25);
    assert.equal(option.trailingDistributionYield, 17.25);
    assert.equal(option.reinvestmentCashYield, 17.25);
    assert.equal(option.simulationCashYield, 17.25);
    assert.equal(option.distributionSimulationPolicy, "repeat_ttm_distribution");
    const optionResult = buildResult(option);
    assert.equal(optionResult.status, "ready");
    assert.equal(optionResult.expectedDividendYield, 17.25);
    for (const report of reportTexts(option, optionResult)) {
      assert.match(report, /17\.25%/);
    }

    const shortHistory = loader.hydratePortfolioAssetFromActiveCatalog(
      { market: "US", ticker: "NEW", quantity: 1, targetWeight: 100 },
      { candidate: shortHistoryCandidate },
    );
    const blocked = buildResult(roundTripSavedAsset(shortHistory));
    assert.equal(blocked.status, "blocked");
    assert.match(blocked.blockReasons.join("|"), /portfolio_add_denied:NEW/);
  } finally {
    await vite.close();
  }
});

test("runtime canonical values beat a stale artifact through hydration, persistence, calculation, and report", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const before = await loader.loadCanonicalV2ScreenerCandidates();
    const eligible = (candidate) =>
      candidate.portfolioAddPolicy === "allow" &&
      candidate.priceMetricsStatus === "ready" &&
      Number.isFinite(candidate.expectedCagr) &&
      Number.isFinite(candidate.beta) &&
      Number.isFinite(candidate.mdd);
    const nonOrdinary = before.find(
      (candidate) =>
        eligible(candidate) &&
        candidate.dividendYield === null &&
        Number.isFinite(candidate.cashDistributionYieldTtm) &&
        candidate.cashDistributionYieldTtm <= 100 &&
        candidate.simulationCashYield === candidate.cashDistributionYieldTtm &&
        candidate.distributionSimulationPolicy === "repeat_ttm_distribution",
    );
    const ordinary = before.find(
      (candidate) => eligible(candidate) && Number.isFinite(candidate.dividendYield),
    );
    assert.ok(nonOrdinary);
    assert.ok(ordinary);

    const sourceByIdentity = new Map(
      [nonOrdinary, ordinary].map((candidate) => [
        `${candidate.market}:${candidate.ticker}`,
        {
          expectedCagr: candidate.expectedCagr,
          beta: candidate.beta,
          mdd: candidate.mdd,
          dividendYield: candidate.dividendYield,
          cashDistributionYieldTtm: candidate.cashDistributionYieldTtm,
          distributionType: candidate.distributionType,
          portfolioAddPolicy: candidate.portfolioAddPolicy,
          dataSource: candidate.dataSource,
        },
      ]),
    );

    const snapshot = await loader.loadScreenerAppPreview({
      enabled: true,
      baseUrl: BASE_URL,
      fetchImpl: createFetch(createFixture(before)),
      disableCache: true,
    });
    assert.equal(snapshot.preview.status, "internal_preview_review_only");

    for (const source of [nonOrdinary, ordinary]) {
      const identity = `${source.market}:${source.ticker}`;
      const candidate = loader.findScreenerCandidateByTicker(source.ticker, source.market);
      const expected = sourceByIdentity.get(identity);
      assert.deepEqual(
        {
          expectedCagr: candidate.expectedCagr,
          beta: candidate.beta,
          mdd: candidate.mdd,
          dividendYield: candidate.dividendYield,
          cashDistributionYieldTtm: candidate.cashDistributionYieldTtm,
          distributionType: candidate.distributionType,
          portfolioAddPolicy: candidate.portfolioAddPolicy,
          dataSource: candidate.dataSource,
        },
        expected,
      );
      assert.notEqual(candidate.expectedCagr, STALE_OVERLAY_VALUE);

      const hydrated = loader.hydratePortfolioAssetFromActiveCatalog({
        market: source.market,
        ticker: source.ticker,
        name: "saved name",
        quantity: 3,
        targetWeight: 100,
        expectedCagr: STALE_OVERLAY_VALUE,
      });
      const persisted = roundTripSavedAsset(hydrated);
      assert.equal(persisted.name, "saved name");
      assert.equal(persisted.quantity, 3);
      assert.equal(persisted.cagr, expected.expectedCagr);
      assert.equal(persisted.beta, expected.beta);
      assert.equal(persisted.mdd, expected.mdd);
      assert.equal(persisted.dataSource, "finple_app_candidates_v2");

      const result = buildResult(persisted);
      assert.equal(result.status, "ready");
      assert.equal(result.expectedCagr, expected.expectedCagr);
      const cashYield = expected.dividendYield ?? expected.cashDistributionYieldTtm;
      assert.equal(result.expectedDividendYield, cashYield);
      for (const report of reportTexts(persisted, result)) {
        assert.match(report, new RegExp(`${cashYield.toFixed(2)}%`));
      }
    }
  } finally {
    await vite.close();
  }
});
