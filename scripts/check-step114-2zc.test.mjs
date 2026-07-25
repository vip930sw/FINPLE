import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function sha256(relative) {
  return crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root, relative)))
    .digest("hex");
}

test("Production loader stays separate from Preview and keeps v1 as atomic fallback", () => {
  const loader = read("src/data/tickers/screenerCandidateLoader.js");
  const production = read("src/data/tickers/productionAppExportDataSource.js");
  assert.match(
    loader,
    /import finpleAppCandidates6000Csv from "\.\/finple_app_candidates_6000_balanced_v1\.csv\?raw"/,
  );
  assert.match(loader, /import\("\.\/finple_app_candidates_v2\.csv\?raw"\)/);
  assert.doesNotMatch(loader, /^import finpleAppCandidatesV2Csv/m);
  assert.match(loader, /status: "production_v1_fallback"/);
  assert.match(loader, /activeScreenerCandidates = ALL_SCREENER_CANDIDATES/);
  assert.match(loader, /production_app_export_ready/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256/);
  assert.doesNotMatch(production, /VITE_FINPLE_APP_PREVIEW_ENABLED/);
});

test("fixed Production release bindings and exact counts are fail-closed", () => {
  const production = read("src/data/tickers/productionAppExportDataSource.js");
  for (const value of [
    "finple-production-app-export-release-v1-step114-2zc",
    "finple-universe-v2-2026-07-24",
    "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e",
    "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276",
    "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef",
    "assetCount: 6029",
    "priceCoveredAssetCount: 6013",
    "monthlyReturnAssetCount: 5347",
    "monthlyReturnRowCount: 701485",
    'metricDataThroughMonth: "2026-06"',
  ]) {
    assert.match(production, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(production, /productionPublishReady: true/);
  assert.match(production, /appExportApproved: true/);
  assert.match(production, /source review gates changed/);
});

test("Step 4 is Production-enabled while Step 5 and Step 6 provider boundary stay unchanged", () => {
  const hook = read("src/components/portfolio/hooks/usePortfolioSimulator.js");
  const simulator = read("src/components/PortfolioSimulator.jsx");
  const personal = read("src/components/PersonalPage.jsx");
  assert.match(hook, /loadProductionMonthlyReturnsForIdentities/);
  assert.match(hook, /production_monthly_identity_unavailable/);
  assert.match(simulator, /enableProductionAppExport/);
  assert.doesNotMatch(
    personal,
    /scenarioContextInputs\s*=\s*\{[^}]*previewScenarioResult/,
  );
  assert.equal(
    sha256("src/components/portfolio/components/ExternalShockAnalysisPanel.jsx"),
    "3e9ad8e3021f97f959c1610a674dbfcb3268618dfd45289b9eda49fda2f41596",
  );
  assert.equal(
    sha256("src/components/portfolio/utils/externalShockScenarioAdapter.js"),
    "41956f523e2be5857cee1138cc8e4e6616c1d2096032492581e3e20a70b485c2",
  );
  assert.equal(
    sha256("src/components/PersonalPage.jsx"),
    "2235dc9718080c01c4b763fbe615c8a60781129d4c94e6672144e6aed085fdd7",
  );
});

test("public v1 and supplied canonical v2 artifacts remain byte unchanged", () => {
  assert.equal(
    sha256("src/data/tickers/finple_app_candidates_6000_balanced_v1.csv"),
    "79c7a504d6769c2829b7f6d3e689f327585234a6ce7a294abbe06dce00a44faf",
  );
  assert.equal(
    sha256("src/data/tickers/finple_app_candidates_v2.csv"),
    "5df224b508c178d87a7e82d1881b24e0b58ff3ff678ae1448e1dafe91c77472e",
  );
  assert.equal(
    sha256("src/data/tickers/finple_universe_v2_manifest.json"),
    "73d0e6a1f2d7a0334738d595ae03d727149524e2fda22031085ef875a572565b",
  );
  assert.equal(
    sha256("src/data/tickers/finple_universe_v2_reconciliation.json"),
    "31e31508c26fccef1998eaf20fd79a983703bb452b8eb343f35d93e45881c85f",
  );
});

test("Production stager is external, versioned, inventory-bound, and never deploys", () => {
  const stager = read("scripts/stage_production_app_export_vercel.py");
  assert.match(stager, /\/app-data\/\{target_segment\}/);
  assert.match(stager, /production-build-output-inventory\.json/);
  assert.match(stager, /production-cutover-qa-template\.json/);
  assert.match(stager, /"previewApiRewriteIncluded": False/);
  assert.match(stager, /"productionDeployPromoteExecuted": False/);
  assert.match(stager, /staging directory must be outside/);
  assert.doesNotMatch(stager, /vercel deploy|vercel promote|--prod/);
});

test("desktop/mobile and PDF print share controls remain wired", () => {
  const detail = read("src/components/portfolio/components/DetailPanel.jsx");
  const hook = read("src/components/portfolio/hooks/usePortfolioSimulator.js");
  const navigationCss = [
    read("src/App.css"),
    read("src/MobileUxHotfix.css"),
    read("src/SimulatorNavComparePolish.css"),
  ].join("\n");
  for (const label of ["PDF 저장", "인쇄", "공유 문구 복사"]) {
    assert.match(detail, new RegExp(label));
  }
  assert.match(hook, /function saveReportPdf\(\) \{ window\.print\(\); \}/);
  assert.match(hook, /function printReport\(\) \{ window\.print\(\); \}/);
  assert.match(hook, /navigator\.clipboard\?\.writeText\(createReportSummaryText/);
  assert.match(navigationCss, /@media \(max-width: 640px\)/);
  assert.match(navigationCss, /\.simulatorTabNav/);
});

test("release JSON Schema parses and forbids extra top-level fields", () => {
  const schema = JSON.parse(
    read("docs/portfolio-ml/contracts/finple-production-app-export-release-manifest.schema.json"),
  );
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.assetCount.const, 6029);
  assert.equal(schema.properties.monthlyReturnAssetCount.const, 5347);
  assert.equal(schema.properties.monthlyReturnRowCount.const, 701485);
  assert.equal(schema.properties.productionPublishReady.const, true);
  assert.equal(schema.properties.appExportApproved.const, true);
});
