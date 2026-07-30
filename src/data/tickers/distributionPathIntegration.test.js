import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";

import { createServer } from "vite";

import { sha256Hex } from "../../utils/sha256.js";
import {
  buildMonthlyBaselineProjection,
} from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import {
  createRankedComparisonPortfolios,
} from "../../components/portfolio/utils/portfolioCalculations.js";
import {
  normalizePersistedMetricFields,
} from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import {
  createPortfolioReportText,
  createReportSummaryText,
} from "../../components/portfolio/utils/portfolioReports.js";

const BASE_URL = "http://distribution-path.test";
const EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z";
const DISTRIBUTION_POLICY =
  "trailing_12m_cash_distribution_not_ordinary_dividend";
const DISTRIBUTION_STATUS = "confirmed_value";
const TARGETS = new Map([
  ["AIPI", {
    yield: 38.30069456,
    fixtureYield: 34.98,
    option: true,
    resultStatus: "blocked",
  }],
  ["MSFY", {
    yield: 27.09069567,
    fixtureYield: 28.30,
    option: true,
    resultStatus: "blocked",
  }],
  ["TSLP", {
    yield: 40.40466564,
    fixtureYield: 28.11,
    option: true,
    resultStatus: "blocked",
  }],
  ["QYLG", { yield: 18.26314253, fixtureYield: 16.26, option: true }],
  ["QQQ", { yield: 0.45849517, fixtureYield: 0.41, option: false }],
  ["TQQQ", {
    yield: 0.65454545,
    fixtureYield: 0.47,
    option: false,
    reviewPolicy: true,
  }],
  ["SPY", { yield: 1.03158498, fixtureYield: 1.01, option: false }],
  ["GLD", { yield: 0, option: false, dividendStatus: "confirmed_zero" }],
]);

function jsonBytes(value) {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

function createMetricRow(candidate) {
  const target = TARGETS.get(candidate.ticker);
  return {
    identity: `${candidate.market}:${candidate.ticker}`,
    market: candidate.market,
    ticker: candidate.ticker,
    selectedCagr: 10,
    rawPriceCagr10y: 10,
    rollingCagr10yMedian: 10,
    rollingCagr10yP25: 9,
    rollingCagr10yP75: 11,
    validRollingWindowCount10y: 24,
    cagrPolicy: "rolling_10y_median",
    selectedMdd: -20,
    mddPolicy: "full_period_actual",
    selectedBeta: 1,
    betaPolicy: "aligned_monthly_return_beta",
    dividendYield: target?.fixtureYield ?? target?.yield ?? null,
    dividendStatus: target?.dividendStatus || (target ? "available" : "missing"),
    dataStatus: "ready",
    reviewFlag: "none",
    reviewReason: "",
    metricBaseDate: "2026-07-22",
    rawPriceCoverageStatus: "covered",
    internalPreviewReviewOnly: true,
    productionPublishReady: false,
    appExportApproved: false,
    sourceHash: "distribution-path-fixture-source",
    ...(target?.reviewPolicy
      ? {
        exposureType: "leveraged_etf",
        leverageMultiple: 3,
        direction: "long",
        resetFrequency: "daily",
        underlyingTicker: "NDX",
        inceptionDate: "2010-02-09",
        officialSourceUrl: "https://www.proshares.com/our-etfs/leveraged-and-inverse/tqqq",
        sourceCheckedAt: "2026-07-27",
        reviewApprovalPolicyVersion: "leveraged-inverse-review-policy-v1-step114",
        reviewApprovalStatus: "ready",
        reviewApprovalReason: "daily_reset_geared_metrics_reproduced_and_coherent",
        reviewApprovalReasonCodes: [],
        reviewApprovalAudit: { validRollingWindowCount10y: 77 },
      }
      : {}),
  };
}

function createFixture(candidates) {
  const rows = candidates.map(createMetricRow);
  const overlay = {
    exportVersion: EXPORT_VERSION,
    metricDataThroughMonth: "2026-06",
    rows,
  };
  const overlayBytes = jsonBytes(overlay);
  const marketAssetCounts = candidates.reduce((counts, candidate) => {
    counts[candidate.market] = (counts[candidate.market] || 0) + 1;
    return counts;
  }, {});
  const shardInventory = Array.from({ length: 64 }, (_, index) => ({
    path: `monthly-returns/monthly-returns-${index.toString(16).padStart(2, "0")}.json`,
    sha256: "0".repeat(64),
    assetCount: 0,
    rowCount: 0,
  }));
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
    shardInventory,
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
  return {
    ...parsed,
    ...normalizePersistedMetricFields(parsed),
  };
}

function assertOptionDistributionContract(asset, expectedYield) {
  assert.equal(asset.dividendYield, null);
  assert.equal(asset.displayDividendYield, "");
  assert.equal(asset.trailingDistributionYield, expectedYield);
  assert.equal(asset.cashDistributionYieldTtm, expectedYield);
  assert.equal(asset.distributionYieldPolicy, DISTRIBUTION_POLICY);
  assert.equal(asset.distributionCalculationStatus, DISTRIBUTION_STATUS);
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

test("monthly artifact never overrides the canonical catalog through save, reload, and baseline", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const candidates = await loader.loadCanonicalV2ScreenerCandidates();
    assert.equal(candidates.length, 6029);
    const snapshot = await loader.loadScreenerAppPreview({
      enabled: true,
      baseUrl: BASE_URL,
      fetchImpl: createFetch(createFixture(candidates)),
      disableCache: true,
    });
    assert.equal(snapshot.preview.status, "internal_preview_review_only");

    const kodeX200Candidate = loader.findScreenerCandidateByTicker(
      "069500",
      "KR",
    );
    assert.ok(kodeX200Candidate);
    const correctedKodeX200 = loader.hydratePortfolioAssetFromActiveCatalog(
      {
        id: "persisted-market-mismatch",
        ticker: "069500",
        market: "US",
        quantity: 7,
        price: 42_000,
        targetEvaluationAmount: 294_000,
        targetWeight: 20,
        reviewApprovalPolicyVersion: "stale-us-policy",
        reviewApprovalStatus: "blocked",
        reviewApprovalAudit: { source: "US:069500" },
        sourceHash: "stale-us-source",
        proxyLineageStatus: "legacy_unproven",
        isProxy: true,
        proxyTicker: "SPY",
        productionAppExportEnabled: true,
        productionReleaseContractVersion: "stale-production-release",
        productionPublishReady: true,
        appExportApproved: true,
      },
      { candidate: kodeX200Candidate },
    );
    assert.equal(correctedKodeX200.market, "KR");
    assert.equal(correctedKodeX200.ticker, "069500");
    assert.equal(correctedKodeX200.quantity, 7);
    assert.equal(correctedKodeX200.price, 42_000);
    assert.equal(correctedKodeX200.targetEvaluationAmount, 294_000);
    assert.equal(correctedKodeX200.targetWeight, 20);
    assert.notEqual(
      correctedKodeX200.reviewApprovalPolicyVersion,
      "stale-us-policy",
    );
    assert.notDeepEqual(correctedKodeX200.reviewApprovalAudit, {
      source: "US:069500",
    });
    assert.notEqual(correctedKodeX200.sourceHash, "stale-us-source");
    assert.notEqual(correctedKodeX200.proxyLineageStatus, "legacy_unproven");
    assert.notEqual(correctedKodeX200.proxyTicker, "SPY");
    assert.notEqual(
      correctedKodeX200.productionReleaseContractVersion,
      "stale-production-release",
    );
    const reloadedCorrectedKodeX200 =
      loader.hydratePortfolioAssetFromActiveCatalog(
        roundTripSavedAsset(correctedKodeX200),
      );
    assert.equal(reloadedCorrectedKodeX200.market, "KR");
    assert.equal(reloadedCorrectedKodeX200.ticker, "069500");
    assert.notEqual(
      reloadedCorrectedKodeX200.reviewApprovalPolicyVersion,
      "stale-us-policy",
    );
    assert.notEqual(reloadedCorrectedKodeX200.sourceHash, "stale-us-source");
    assert.notEqual(reloadedCorrectedKodeX200.proxyTicker, "SPY");

    for (const [ticker, expected] of TARGETS) {
      const candidate = loader.findScreenerCandidateByTicker(ticker, "US");
      assert.ok(candidate, ticker);
      const patch = loader.createAssetPatchFromScreenerCandidate(candidate);
      const hydrated = loader.hydrateAssetFromScreenerCandidate({
        ticker,
        market: "US",
        quantity: 1,
        price: 100,
        targetWeight: 100,
      });
      const reloaded = roundTripSavedAsset(hydrated);
      const result = buildResult(reloaded);

      assert.equal(patch.dividendYield, expected.option ? null : expected.yield, ticker);
      assert.equal(reloaded.dividendYield, expected.option ? null : expected.yield, ticker);

      if (expected.option) {
        assertOptionDistributionContract(candidate, expected.yield);
        assertOptionDistributionContract(patch, expected.yield);
        assertOptionDistributionContract(hydrated, expected.yield);
        assertOptionDistributionContract(reloaded, expected.yield);
        assert.equal(result.status, expected.resultStatus || "ready", ticker);
        if (expected.resultStatus === "blocked") {
          assert.match(
            result.blockReasons.join("|"),
            new RegExp(`portfolio_add_denied:${ticker}`),
            ticker,
          );
          continue;
        }
        assert.equal(result.expectedDividendYield, expected.yield, ticker);
        assert.equal(result.assets[0].annualDividendYield, expected.yield, ticker);
        assert.ok(result.monthlyBaselinePoints.length > 1, ticker);
        assert.ok(result.performanceRows.length > 0, ticker);
        const [ranked] = createRankedComparisonPortfolios([
          { id: ticker, name: ticker, assets: [reloaded], result },
        ]);
        assert.equal(ranked.dividendRank, 1, ticker);
      } else {
        assert.equal(result.status, "ready", ticker);
        assert.equal(
          result.expectedDividendYield,
          expected.yield,
          ticker,
        );
        assert.equal(
          result.assets[0].annualDividendYield,
          expected.yield,
          ticker,
        );
        if (expected.reviewPolicy) {
          assert.equal(reloaded.exposureType, "index_leveraged", ticker);
          assert.equal(reloaded.leverageMultiple, 3, ticker);
          assert.equal(reloaded.portfolioAddPolicy, "confirm", ticker);
          assert.equal(reloaded.dataSource, "finple_app_candidates_v2", ticker);
        }
      }

      if (ticker === "GLD") {
        assert.equal(candidate.dividendStatus, "confirmed_zero");
        assert.equal(reloaded.dividendStatus, "confirmed_zero");
        assert.notEqual(reloaded.dividendYield, null);
      }
      if (ticker === "QYLG") {
        assert.equal(reloaded.exposureType, "index_covered_call_growth");
      }
    }

    const aipi = roundTripSavedAsset(
      loader.hydrateAssetFromScreenerCandidate({
        ticker: "AIPI",
        market: "US",
        quantity: 1,
        price: 100,
        targetWeight: 100,
      }),
    );
    const blocked = buildResult(aipi);
    const reportInput = {
      activePortfolio: { name: "AIPI blocked contract" },
      detailReport: { type: "검토 필요", tags: [], summary: "분배 계약 검토" },
      result: blocked,
      assets: [aipi],
      detailPortfolio: {
        realValueRank: 1,
        growthRank: 1,
        stabilityRank: 1,
        dividendRank: 1,
      },
    };
    const fullReport = createPortfolioReportText(reportInput);
    const summaryReport = createReportSummaryText(reportInput);
    for (const report of [fullReport, summaryReport]) {
      assert.match(report, /기준 계산 보류/);
      assert.match(report, /예상 CAGR: -/);
      assert.match(report, /예상 BETA: -/);
      assert.match(report, /예상 MDD: -/);
      assert.match(report, /시뮬레이션 적용 현금분배율: -/);
      assert.doesNotMatch(report, /unsupported_distribution_calculation_policy/);
      assert.match(report, /최근 12개월 분배율 38\.30%/);
      assert.match(report, /주간 분배/);
      assert.match(report, /옵션분배/);
      assert.match(report, /ROC\(원금환급\) 포함 가능/);
      assert.doesNotMatch(report, /예상 배당률|예상 연배당금|배당 순위|배당 매력/);
    }
    assert.match(fullReport, /현금흐름 순위: -/);
    assert.match(fullReport, /CAGR - \/ BETA - \/ MDD -/);

    const spy = roundTripSavedAsset(
      loader.hydrateAssetFromScreenerCandidate({
        ticker: "SPY",
        market: "US",
        quantity: 1,
        price: 100,
        targetWeight: 100,
      }),
    );
    const ordinary = buildResult(spy);
    const ordinaryFullReport = createPortfolioReportText({
      activePortfolio: { name: "SPY ordinary contract" },
      detailReport: { type: "일반 배당", tags: [], summary: "ordinary" },
      result: ordinary,
      assets: [spy],
      detailPortfolio: { dividendRank: 1 },
    });
    const ordinarySummary = createReportSummaryText({
      activePortfolio: { name: "SPY ordinary contract" },
      detailReport: { type: "일반 배당", tags: [], summary: "ordinary" },
      result: ordinary,
      assets: [spy],
    });
    assert.match(ordinaryFullReport, /예상 배당률: 1\.03%/);
    assert.match(ordinaryFullReport, /일반 배당률 1\.03%/);
    assert.match(ordinaryFullReport, /배당 순위: 1위/);
    assert.match(ordinarySummary, /예상 배당률: 1\.03%/);
    assert.doesNotMatch(ordinaryFullReport, /기준 계산 보류/);
  } finally {
    await vite.close();
  }
});
