import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC_PATH = "docs/operations/FINPLE_MONTHLY_CSV_OPERATIONS.md";
const TEMPLATE_PATH = "docs/operations/templates/FINPLE_MONTHLY_CSV_RELEASE_EVIDENCE_TEMPLATE.md";

const read = (path) => readFileSync(join(ROOT, path), "utf8");
const json = (path) => JSON.parse(read(path));
const requireText = (source, values) => values.forEach((value) => assert.ok(source.includes(value), `missing contract: ${value}`));
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

test("monthly CSV operations document and evidence template exist", () => {
  assert.ok(existsSync(join(ROOT, DOC_PATH)));
  assert.ok(existsSync(join(ROOT, TEMPLATE_PATH)));
  const packageJson = json("package.json");
  assert.equal(packageJson.scripts["check:p6-monthly-csv-operations"], "node --test scripts/check-p6-monthly-csv-operations.mjs");
});

test("baseline month and partial-month policy are fail-closed", () => {
  requireText(read(DOC_PATH), [
    "마지막으로 완전히 종료된 달까지만 포함",
    "진행 중인 현재 월은 포함하지 않는다",
    "partialMonthPolicy=exclude_from_metrics",
    "KR/US 마지막 거래일",
    "2026-08-03",
    "2026-06",
    "참고 snapshot",
  ]);
});

test("provenance and immutable source evidence exclude secrets", () => {
  requireText(read(DOC_PATH), [
    "공급자",
    "수집시각",
    "이용약관·라이선스",
    "byte size와 SHA-256",
    "덮어쓰지 않는다",
    "비밀키",
    "provider credential",
    "전체 환경변수 값",
  ]);
});

test("identity, lifecycle, missing coverage and manual CASH boundaries are documented", () => {
  requireText(read(DOC_PATH), [
    "market + ticker",
    "US:QQQ",
    "KR:069500",
    "ticker 변경, 합병, 분할, 상장폐지, 신규 상장",
    "canonical catalog에는 있으나 monthly index에 없는 자산",
    "monthly 데이터에는 있으나 canonical catalog에서 확인되지 않는 identity",
    "manual CASH",
    "unknown-source CASH",
    "연 2.0%",
  ]);
});

test("monthly rows, common history and inventory validation contracts are documented", () => {
  requireText(read(DOC_PATH), [
    "날짜 파싱, 오름차순",
    "중복일",
    "누락 월은 forward-fill하지 않고",
    "NaN",
    "Infinity",
    "undefined",
    "공통 연속 이력이 최소 60개월",
    "미참조 shard",
    "존재하지 않는 shard 참조",
    "JSON content type",
    "exact byte size와 SHA",
    "release/source binding",
  ]);
});

test("previous artifact comparison separates expected change from manual review", () => {
  requireText(read(DOC_PATH), [
    "직전 Production artifact 비교",
    "US:TLT",
    "US:GLD",
    "기준월 정체·후퇴·두 달 이상 점프",
    "asset/row/coverage 급감",
    "identity 삭제·rename",
    "모든 새 hash가 동일 승인 chain",
  ]);
});

test("only existing candidate, export, review and recovery commands are referenced", () => {
  const doc = read(DOC_PATH);
  for (const path of [
    "scripts/prepare_monthly_metrics_candidate_inputs.py",
    "scripts/export_finple_app_preview.py",
    "scripts/build_review_gated_app_export.py",
    "scripts/recover_production_app_export_source.py",
    "scripts/stage_app_preview_vercel.py",
    "scripts/stage_production_app_export_vercel.py",
  ]) {
    assert.ok(existsSync(join(ROOT, path)), `missing implementation: ${path}`);
    assert.ok(doc.includes(path), `document does not reference: ${path}`);
  }
  requireText(doc, ["repo-local 단일 월간 rollover 명령은 없", "P6에서는 실행하지 않는다"]);
});

test("Preview, Production, 404 and rollback approval boundaries are documented", () => {
  requireText(read(DOC_PATH), [
    "Protected Preview",
    "missing artifact가 `index.html` 200으로 fallback하면 실패",
    "사용자·결제·포트폴리오·DB mutation",
    "main merge와 Production cutover는 별도 승인",
    "backend-first",
    "non-force fast-forward",
    "force-push",
    "환경변수, CORS, alias/domain 변경은 각각 별도 승인",
    "rollback target",
    "삭제하지 않는다",
    "vercel promote <dpl_...>",
  ]);
  const routing = json("vercel.json");
  assert.ok(routing.routes.some((route) => route.src === "/app-data/(.*)" && route.status === 404));
});

test("evidence template captures approval and rollback without secret values", () => {
  requireText(read(TEMPLATE_PATH), [
    "source identity",
    "candidate ZIP",
    "release manifest",
    "source manifest",
    "asset count",
    "monthly row count",
    "shard count",
    "Preview deployment",
    "Production deployment",
    "승인자 / 승인시각",
    "rollback target",
    "관측 한계",
    "incident",
    "비밀값",
  ]);
});

test("current P3/P3A/deployment checks and runtime settings remain present", () => {
  const packageJson = json("package.json");
  for (const name of [
    "check:p3-step4-monthly-artifact",
    "check:p3a-production-monthly-artifact-publication",
    "check:production-deployment-control",
  ]) assert.ok(packageJson.scripts[name], `missing npm script: ${name}`);

  const runtime = read("src/data/tickers/productionAppExportDataSource.js");
  for (const name of [
    "VITE_FINPLE_MONTHLY_SCENARIO_ARTIFACT_ENABLED",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256",
  ]) assert.ok(runtime.includes(name), `missing runtime setting: ${name}`);
});

test("published artifact counts and file integrity derive from manifests", () => {
  const appDataRoot = join(ROOT, "public/app-data");
  const releases = readdirSync(appDataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(appDataRoot, entry.name, "production-app-export-release.json"))
    .filter(existsSync);
  assert.ok(releases.length > 0, "no published release manifest");

  for (const releasePath of releases) {
    const base = dirname(releasePath);
    const release = JSON.parse(readFileSync(releasePath, "utf8"));
    const source = JSON.parse(readFileSync(join(base, release.sourceManifest.path), "utf8"));
    const index = JSON.parse(readFileSync(join(base, release.monthlyReturnsIndex.path), "utf8"));
    const records = [release.sourceManifest, release.metricsOverlay, release.monthlyReturnsIndex, ...release.shardInventory];

    assert.equal(release.productionPublishReady, true);
    assert.equal(release.appExportApproved, true);
    assert.equal(source.metricDataThroughMonth, release.metricDataThroughMonth);
    assert.equal(index.metricDataThroughMonth, release.metricDataThroughMonth);
    assert.equal(source.monthlyReturnAssetCount, release.monthlyReturnAssetCount);
    assert.equal(source.monthlyReturnRowCount, release.monthlyReturnRowCount);
    assert.equal(index.assetCount, release.monthlyReturnAssetCount);
    assert.equal(index.rowCount, release.monthlyReturnRowCount);
    assert.equal(index.shards.length, release.shardCount);
    assert.equal(release.shardInventory.length, release.shardCount);
    assert.equal(new Set(release.shardInventory.map((item) => item.path)).size, release.shardCount);
    assert.equal(Object.keys(index.assets).length, index.assetCount);
    assert.equal(Object.values(index.assets).reduce((sum, asset) => sum + asset.rowCount, 0), index.rowCount);
    assert.equal(index.shards.reduce((sum, shard) => sum + shard.rowCount, 0), index.rowCount);
    assert.equal(index.shards.reduce((sum, shard) => sum + shard.assetCount, 0), index.assetCount);
    assert.ok(Object.values(index.assets).every((asset) => asset.lastMonth.slice(0, 7) <= index.metricDataThroughMonth));

    const shardPaths = new Set(release.shardInventory.map((item) => item.path));
    assert.ok(Object.values(index.assets).every((asset) => shardPaths.has(asset.shard)));
    for (const record of records) {
      const file = join(base, record.path);
      assert.ok(existsSync(file), `missing artifact: ${relative(ROOT, file)}`);
      assert.equal(statSync(file).size, record.sizeBytes, `size mismatch: ${record.path}`);
      assert.equal(sha256(file), record.sha256, `SHA mismatch: ${record.path}`);
      JSON.parse(readFileSync(file, "utf8"));
    }
  }
});
