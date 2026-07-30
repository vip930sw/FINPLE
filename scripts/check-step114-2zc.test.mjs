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

test("Production monthly artifacts stay separate from the canonical v2 runtime catalog", () => {
  const loader = read("src/data/tickers/screenerCandidateLoader.js");
  const production = read("src/data/tickers/productionAppExportDataSource.js");
  assert.match(
    loader,
    /^import finpleCanonicalV2Csv from "\.\/finple_app_candidates_v2\.csv\?raw"/m,
  );
  assert.doesNotMatch(loader, /finple_app_candidates_6000_balanced_v1\.csv\?raw/);
  assert.match(loader, /PRODUCTION_APP_EXPORT_LOADING_STATUS = "production_app_export_loading"/);
  assert.match(loader, /activeScreenerCandidates = ALL_SCREENER_CANDIDATES/);
  assert.match(loader, /beginProductionAppExportLoading/);
  assert.doesNotMatch(loader, /production_v1_fallback/);
  assert.doesNotMatch(loader, /selectedCagr:\s*metricRow/);
  assert.match(loader, /production_app_export_ready/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256/);
  assert.match(production, /VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256/);
  assert.doesNotMatch(production, /VITE_FINPLE_APP_PREVIEW_ENABLED/);
});

test("Production initialization keeps canonical metrics available while monthly artifacts load", () => {
  const screener = read("src/components/ScreenerPage.jsx");
  const hook = read("src/components/portfolio/hooks/usePortfolioSimulator.js");
  const styles = read("src/App.css");
  assert.match(screener, /canonical_catalog_load_error/);
  assert.match(screener, /최신 자산 데이터를 불러오지 못했습니다/);
  assert.match(screener, /role="alert"/);
  assert.doesNotMatch(hook, /createProductionCatalogLoadingResult/);
  assert.doesNotMatch(hook, /production_v1_fallback/);
  assert.match(hook, /calculatePortfolioResult\(settings, assets\)/);
  assert.match(styles, /@media \(max-width: 480px\)/);
});

test("user-facing baseline reasons do not expose raw approval codes", () => {
  const labels = read("src/components/portfolio/utils/baselineBlockReasonLabels.js");
  const detail = read("src/components/portfolio/components/DetailPanel.jsx");
  const compare = read("src/components/portfolio/components/ComparePanel.jsx");
  for (const copy of [
    "승인된 지표 상태를 확인할 수 없습니다.",
    "이 상품의 분배금은 일반 배당 재투자 방식으로 계산할 수 없습니다.",
    "지표 출처 정보가 부족합니다.",
  ]) {
    assert.match(labels, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(detail, /formatUserFacingBaselineBlockReason/);
  assert.match(compare, /formatUserFacingBaselineBlockReason/);
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
  const scenario = read("src/components/portfolio/utils/appPreviewScenarioService.js");
  const loader = read("src/data/tickers/screenerCandidateLoader.js");
  const identityMetadata = read(
    "src/data/tickers/portfolioAssetIdentityMetadata.js",
  );
  const simulator = read("src/components/PortfolioSimulator.jsx");
  const personal = read("src/components/PersonalPage.jsx");
  assert.match(hook, /loadProductionMonthlyReturnsForIdentities/);
  assert.match(hook, /resolveAppExportScenarioState/);
  assert.doesNotMatch(hook, /activateProductionAppExportFallback/);
  assert.doesNotMatch(scenario, /activateCatalogFallback/);
  assert.match(scenario, /failureDomain: identityUnavailable \? "identity_unavailable" : "scenario_loader"/);
  assert.match(scenario, /production_monthly_identity_unavailable/);
  assert.match(hook, /reconcileIdentityScopedAssetMetadata/);
  assert.match(
    hook,
    /hydratePortfolioAssetFromActiveCatalog\(\s*currentAsset,\s*\{\s*candidate\s*\}/,
  );
  assert.doesNotMatch(hook, /identityAppliedAsset/);
  assert.match(loader, /reconcileIdentityScopedAssetMetadata/);
  assert.match(identityMetadata, /previousIdentity\.market !== nextIdentity\.market/);
  assert.match(identityMetadata, /previousIdentity\.ticker !== nextIdentity\.ticker/);
  assert.match(identityMetadata, /reviewApprovalPolicyVersion: ""/);
  assert.match(identityMetadata, /sourceHash: ""/);
  assert.match(identityMetadata, /proxyLineageStatus: ""/);
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
    "fd90a57997ff08e213042915c6f0812f165e860f7643ccfc6d82f1ffb4f19004",
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
  assert.match(stager, /"--api-base-url", required=True/);
  assert.match(stager, /"VITE_FINPLE_API_BASE_URL": normalized_api_base_url/);
  assert.match(stager, /explicit_required_https_api_base/);
  assert.match(stager, /validate_production_bundle/);
  assert.match(stager, /localhost:5050/);
  assert.match(stager, /\/preview-api/);
  assert.match(stager, /staging directory must be outside/);
  assert.doesNotMatch(stager, /vercel deploy|vercel promote|--prod/);
  const runbook = read(
    "docs/portfolio-ml/FINPLE_STEP114_2ZC_PRODUCTION_APP_EXPORT_CUTOVER_RUNBOOK.md",
  );
  assert.match(runbook, /python -B -m scripts\.stage_production_app_export_vercel/i);
  assert.match(runbook, /--api-base-url \$ProductionApiBaseUrl/);
  assert.match(runbook, /VITE_FINPLE_API_BASE_URL=<approved HTTPS Production API base ending in \/api>/);
  const qaTemplate = read(
    "docs/portfolio-ml/FINPLE_STEP114_2ZC_PRODUCTION_CUTOVER_QA_TEMPLATE.md",
  );
  assert.match(qaTemplate, /Production API base URL is explicit HTTPS/);
  assert.match(qaTemplate, /compiled bundle contains no `localhost:5050` or `\/preview-api`/);
  assert.match(qaTemplate, /previous `VITE_FINPLE_API_BASE_URL`/);
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

test("release and source receipt schemas match the conditional operator runbook", () => {
  const schema = JSON.parse(
    read("docs/portfolio-ml/contracts/finple-production-app-export-release-manifest.schema.json"),
  );
  const receiptSchema = JSON.parse(
    read("docs/portfolio-ml/contracts/finple-production-source-artifact-receipt.schema.json"),
  );
  const runbook = read(
    "docs/portfolio-ml/FINPLE_STEP114_2ZC_PRODUCTION_APP_EXPORT_CUTOVER_RUNBOOK.md",
  );
  const qaTemplate = read(
    "docs/portfolio-ml/FINPLE_STEP114_2ZC_PRODUCTION_CUTOVER_QA_TEMPLATE.md",
  );
  const sourceRecovery = read("scripts/recover_production_app_export_source.py");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.assetCount.const, 6029);
  assert.equal(schema.properties.monthlyReturnAssetCount.const, 5347);
  assert.equal(schema.properties.monthlyReturnRowCount.const, 701485);
  assert.equal(schema.properties.productionPublishReady.const, true);
  assert.equal(schema.properties.appExportApproved.const, true);
  assert.equal(receiptSchema.additionalProperties, false);
  assert.equal(
    receiptSchema.properties.sourceGitMainSha.const,
    "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef",
  );
  assert.equal(
    receiptSchema.properties.candidateZipSha256.const,
    "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e",
  );
  assert.equal(
    receiptSchema.properties.candidatePackageHash.const,
    "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276",
  );
  assert.equal(
    receiptSchema.properties.exporterCommand.const,
    "python -B -m scripts.export_finple_app_preview --input-package <candidate-zip> --output-dir <empty-output> --shard-count 64 --max-rows-per-shard 12000 --target-shard-bytes 1048576",
  );
  assert.equal(receiptSchema.properties.deterministicMatch.const, true);
  assert.equal(receiptSchema.properties.completeShardInventory.minItems, 64);
  assert.equal(receiptSchema.properties.completeShardInventory.maxItems, 64);
  for (const field of [
    "exporterCommand",
    "exporterVersion",
    "runAZipSha256",
    "runBZipSha256",
    "sourceManifestSha256",
    "metricsOverlaySha256",
    "monthlyIndexSha256",
    "completeShardInventory",
    "completeFileInventoryHash",
    "generatedAt",
    "operatorId",
    "deterministicMatch",
  ]) {
    assert.ok(receiptSchema.required.includes(field), field);
    assert.match(runbook, new RegExp(field, "i"), field);
  }
  assert.match(runbook, /git -C \$Repo worktree add --detach \$SourceWorktree \$SourceGitSha/);
  assert.match(runbook, /\$Python -B -m scripts\.recover_production_app_export_source/);
  assert.match(runbook, /python -B -m scripts\.export_finple_app_preview/);
  for (const flag of [
    "--source-worktree",
    "--candidate-zip",
    "--run-a-dir",
    "--run-b-dir",
    "--receipt-output",
    "--operator-id",
    "--expected-source-git-sha",
    "--expected-candidate-zip-sha256",
    "--expected-candidate-package-hash",
  ]) {
    assert.match(runbook, new RegExp(flag), flag);
    assert.match(sourceRecovery, new RegExp(flag), flag);
  }
  assert.match(sourceRecovery, /def atomic_write_receipt\(/);
  assert.match(sourceRecovery, /def compare_artifacts\(/);
  assert.match(sourceRecovery, /"PYTHONDONTWRITEBYTECODE": "1"/);
  assert.match(
    sourceRecovery,
    /sys\.executable,\s*"-B",\s*"-m",\s*"scripts\.export_finple_app_preview"/,
  );
  assert.match(sourceRecovery, /source_worktree_not_detached/);
  assert.match(sourceRecovery, /candidate_zip_sha256_mismatch/);
  assert.doesNotMatch(
    sourceRecovery,
    /requests\.|urllib\.request|google\.colab|googleapiclient|yfinance|vercel deploy|vercel promote/,
  );
  assert.match(runbook, /과거 protected Preview와\s+byte-identical하다고 주장하지 않는다/);
  assert.match(runbook, /Production-mode\s+Preview QA 전체를 다시 통과/);
  assert.match(runbook, /receipt와 raw artifact는 Git에 추가하거나/);
  assert.doesNotMatch(runbook, /비교할 수 없으므로 exporter를 재실행하지 않는다/);
  assert.match(qaTemplate, /deterministicMatch=true/);
  assert.match(qaTemplate, /recover_production_app_export_source/);
  assert.match(qaTemplate, /same sanitized environment and no retry/);
  assert.match(qaTemplate, /PYTHONDONTWRITEBYTECODE=1/);
  assert.match(qaTemplate, /failure stdout contains only safe status\/reason fields/);
  assert.match(qaTemplate, /no claim of byte identity with the historical protected Preview/);
});
