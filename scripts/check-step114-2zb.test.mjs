import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const readCsv = (relative) => fs.readFileSync(path.join(root, relative), "utf8").trim().split(/\r?\n/);

test("canonical v2 is over 6000 and reconciles without removing v1 identities", () => {
  const manifest = readJson("src/data/tickers/finple_universe_v2_manifest.json");
  const reconciliation = readJson("src/data/tickers/finple_universe_v2_reconciliation.json");
  assert.equal(manifest.assetCount, 6029);
  assert.deepEqual(manifest.marketAssetCounts, { KR: 3000, US: 3029 });
  assert.equal(reconciliation.existingIdentityCount, 6000);
  assert.equal(reconciliation.removedExistingIdentityCount, 0);
  assert.equal(reconciliation.duplicateIdentityCount, 0);
  assert.equal(readCsv("src/data/tickers/finple_app_candidates_v2.csv").length - 1, 6029);
});

test("production selector imports canonical v2 directly without the legacy runtime CSV", () => {
  const loader = fs.readFileSync(
    path.join(root, "src/data/tickers/screenerCandidateLoader.js"),
    "utf8",
  );
  assert.match(loader, /^import finpleCanonicalV2Csv from "\.\/finple_app_candidates_v2\.csv\?raw"/m);
  assert.doesNotMatch(loader, /finple_app_candidates_6000_balanced_v1\.csv\?raw/);
  assert.doesNotMatch(loader, /production_v1_fallback/);
  assert.equal(readCsv("src/data/tickers/finple_app_candidates_6000_balanced_v1.csv").length - 1, 6000);
  assert.equal(manifestFromV2().productionSelectorChanged, false);
  assert.equal(manifestFromV2().publicCsvChanged, false);
});

test("manifest-driven loader accepts 64, 128, and 256 shard inventories", () => {
  const loader = fs.readFileSync(
    path.join(root, "src/data/tickers/appPreviewDataSource.js"),
    "utf8",
  );
  assert.match(loader, /!\[64, 128, 256\]\.includes\(manifest\.shardCount\)/);
  assert.doesNotMatch(loader, /overlay\.rows\.length !== 6000/);
  assert.match(loader, /overlay\.rows\.length !== manifest\.assetCount/);
});

test("lifecycle metadata survives candidate-to-saved-asset hydration", () => {
  const loader = fs.readFileSync(
    path.join(root, "src/data/tickers/screenerCandidateLoader.js"),
    "utf8",
  );
  for (const field of [
    "listingStatus", "active", "firstListedDate", "lastTradingDate",
    "underlyingTicker", "exposureType", "distributionType", "distributionFrequency",
    "trailingDistributionYield", "distributionYieldPolicy", "officialSourceUrl",
  ]) {
    assert.match(loader, new RegExp(`${field}: candidate\\.${field}`));
  }
  for (const status of ["active", "inactive", "delisted", "suspended", "pending_review"]) {
    assert.match(
      fs.readFileSync(path.join(root, "scripts/finple_universe_v2.py"), "utf8"),
      new RegExp(`"${status}"`),
    );
  }
});

test("canonical dividends are routed through the non-ordinary distribution contract", () => {
  const loader = fs.readFileSync(
    path.join(root, "src/data/tickers/screenerCandidateLoader.js"),
    "utf8",
  );
  const baseline = fs.readFileSync(
    path.join(root, "src/components/portfolio/utils/monthlyBaselineEngine.js"),
    "utf8",
  );
  const screener = fs.readFileSync(
    path.join(root, "src/components/ScreenerPage.jsx"),
    "utf8",
  );
  const distributionPolicy = fs.readFileSync(
    path.join(root, "src/data/tickers/distributionPolicy.js"),
    "utf8",
  );
  const screenerCss = fs.readFileSync(
    path.join(root, "src/components/ScreenerPage.css"),
    "utf8",
  );
  const detailPanel = fs.readFileSync(
    path.join(root, "src/components/portfolio/components/DetailPanel.jsx"),
    "utf8",
  );
  const reports = fs.readFileSync(
    path.join(root, "src/components/portfolio/utils/portfolioReports.js"),
    "utf8",
  );
  assert.match(loader, /resolveDistributionYieldFields\(\s*\{\s*\.\.\.row/);
  assert.doesNotMatch(loader, /selectedCagr:\s*metricRow/);
  assert.match(baseline, /isCanonicalV2MetricSource/);
  assert.match(screener, /최근 12개월 분배율/);
  assert.match(screener, /distributionDisplay\.notices\.map/);
  assert.match(distributionPolicy, /ROC\(원금환급\) 포함 가능/);
  assert.doesNotMatch(screener, /배당 \{formatPercentValue\(item\.trailingDistributionYield/);
  assert.match(screenerCss, /\.tickerResultDistributionNotice/);
  assert.match(screenerCss, /@media \(max-width: 640px\)[\s\S]*\.tickerResultDistributionNotice/);
  assert.match(screenerCss, /overflow-wrap: anywhere/);
  assert.match(detailPanel, /일반 배당과 분리된 분배 정보/);
  assert.match(detailPanel, /배당 순위에서 제외됩니다/);
  assert.match(reports, /describeAssetDistribution/);
  assert.match(reports, /일반 배당률/);
});

function manifestFromV2() {
  return readJson("src/data/tickers/finple_universe_v2_manifest.json");
}
