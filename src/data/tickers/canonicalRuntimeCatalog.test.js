import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";
import test from "node:test";

import { createServer } from "vite";

import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { formatUserFacingBaselineBlockReason } from "../../components/portfolio/utils/baselineBlockReasonLabels.js";

const RUNTIME_CSV = "src/data/tickers/finple_app_candidates_v2.csv";

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

test("canonical v2 is the only 6029-asset runtime catalog and preserves RM fields", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const candidates = loader.ALL_SCREENER_CANDIDATES;
    assert.equal(candidates.length, 6029);
    assert.equal(loader.US_SCREENER_CANDIDATES.length, 3029);
    assert.equal(loader.KR_SCREENER_CANDIDATES.length, 3000);
    assert.equal(candidates.filter((asset) => asset.simulatorReady).length, 5489);
    assert.equal(candidates.filter((asset) => asset.portfolioEligible).length, 4712);
    assert.equal(candidates.filter((asset) => asset.portfolioAddPolicy === "allow").length, 4567);
    assert.equal(candidates.filter((asset) => asset.portfolioAddPolicy === "confirm").length, 145);
    assert.equal(candidates.filter((asset) => asset.portfolioAddPolicy === "deny").length, 1317);

    const samples = new Map([
      ["KR:069500", [8.56838451, 3.19786952]],
      ["US:QQQ", [9.80545523, 12.00524973]],
      ["US:TQQQ", [40.41644564, 37.18560852]],
    ]);
    for (const [identity, [rawPriceCagr, rollingCagrMedian]] of samples) {
      const [market, ticker] = identity.split(":");
      const candidate = loader.findScreenerCandidateByTicker(ticker, market);
      assert.ok(candidate, identity);
      assert.equal(candidate.rawPriceCagr, rawPriceCagr, identity);
      assert.equal(candidate.rollingCagrMedian, rollingCagrMedian, identity);
      assert.equal(candidate.expectedCagr, rollingCagrMedian, identity);
      assert.equal(candidate.selectedCagr, rollingCagrMedian, identity);
      const hydrated = loader.hydratePortfolioAssetFromActiveCatalog({
        market,
        ticker,
        quantity: 1,
        price: 100,
      });
      assert.equal(hydrated.cagr, rollingCagrMedian, identity);
      assert.equal(hydrated.rawPriceCagr, rawPriceCagr, identity);
      assert.equal(hydrated.rollingCagrMedian, rollingCagrMedian, identity);
      assert.equal(hydrated.cagrConfidence, candidate.cagrConfidence, identity);
      assert.equal(
        hydrated.rollingCagrWindowCount,
        candidate.rollingCagrWindowCount,
        identity,
      );
    }

    const qqq = loader.hydratePortfolioAssetFromActiveCatalog({
      market: "US",
      ticker: "QQQ",
      quantity: 1,
      price: 100,
    });
    const result = buildResult(qqq);
    assert.equal(result.status, "ready");
    assert.equal(result.expectedCagr, 12.00524973);

    assert.equal(loader.findScreenerCandidateByTicker("069500", "US"), null);
    assert.equal(loader.findScreenerCandidateByTicker("DZZ", "US").resetFrequency, "monthly");
    assert.equal(loader.findScreenerCandidateByTicker("DZZ", "US").leverageMultiple, -2);
    assert.equal(loader.findScreenerCandidateByTicker("SCDL", "US").resetFrequency, "quarterly");
    assert.equal(loader.findScreenerCandidateByTicker("SCDL", "US").leverageMultiple, 2);
    assert.equal(loader.findScreenerCandidateByTicker("491220", "KR").portfolioAddPolicy, "deny");
    assert.equal(
      candidates.filter((asset) => asset.metadataVerificationStatus === "verified").length,
      211,
    );
    assert.equal(
      candidates.filter((asset) => asset.metadataVerificationStatus === "pending").length,
      0,
    );
  } finally {
    await vite.close();
  }
});

test("canonical CSV replacement is sufficient to update runtime metrics", async () => {
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const loader = await vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js");
    const currentCsv = fs.readFileSync(RUNTIME_CSV, "utf8");
    const replacementCagr = 12.12524973;
    let changed = false;
    const nextCsv = currentCsv.split(/\r?\n/).map((line) => {
      if (!line.startsWith("US,QQQ,")) return line;
      changed = true;
      return line.replaceAll("12.00524973", String(replacementCagr));
    }).join("\n");
    assert.equal(changed, true);

    const replacementCatalog = loader.createCanonicalScreenerCatalog(nextCsv);
    const replacementQqq = replacementCatalog.find(
      (candidate) => candidate.market === "US" && candidate.ticker === "QQQ",
    );
    assert.equal(replacementQqq.expectedCagr, replacementCagr);
    assert.equal(replacementQqq.rawPriceCagr, 9.80545523);
    assert.equal(replacementQqq.rollingCagrMedian, replacementCagr);

    const hydrated = loader.hydratePortfolioAssetFromActiveCatalog(
      {
        market: "US",
        ticker: "QQQ",
        quantity: 3,
        price: 100,
        targetWeight: 100,
        expectedCagr: 999,
        selectedCagr: 999,
      },
      { candidate: replacementQqq },
    );
    assert.equal(hydrated.quantity, 3);
    assert.equal(hydrated.expectedCagr, replacementCagr);
    assert.equal(hydrated.cagr, replacementCagr);
    assert.equal(hydrated.selectedCagr, replacementCagr);
    assert.equal(buildResult(hydrated).expectedCagr, replacementCagr);

    const loaderSource = fs.readFileSync(
      "src/data/tickers/screenerCandidateLoader.js",
      "utf8",
    );
    const mbtiSource = fs.readFileSync("src/components/InvestmentMbtiPage.jsx", "utf8");
    const presetSource = fs.readFileSync("src/components/portfolio/constants.js", "utf8");
    const simulatorSource = fs.readFileSync(
      "src/components/portfolio/hooks/usePortfolioSimulator.js",
      "utf8",
    );
    assert.doesNotMatch(loaderSource, /finple_app_candidates_6000_balanced_v1\.csv\?raw/);
    assert.doesNotMatch(loaderSource, /production_v1_fallback/);
    assert.doesNotMatch(loaderSource, /selectedCagr:\s*metricRow/);
    assert.match(mbtiSource, /hydrateAssetFromScreenerCandidate/);
    assert.match(presetSource, /hydrateAssetFromScreenerCandidate/);
    assert.match(simulatorSource, /hydratePortfolioAssetFromActiveCatalog/);
    assert.match(
      simulatorSource,
      /fetchTickerCandidateByTicker\(ticker,\s*\{\s*market:/,
    );
    assert.match(simulatorSource, /calculatePortfolioResult\(settings, \[\]\)/);
    assert.equal(
      formatUserFacingBaselineBlockReason("canonical_catalog_load_error"),
      "최신 자산 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
    assert.throws(
      () => loader.createCanonicalScreenerCatalog("market,ticker\nUS,QQQ\n"),
      /canonical v2 candidate contract failed/,
    );
  } finally {
    await vite.close();
  }
});
