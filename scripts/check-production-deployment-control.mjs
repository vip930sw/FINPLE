import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const documentPath = "docs/operations/FINPLE_VERCEL_PRODUCTION_DEPLOYMENT_CONTROL.md";
const document = fs.readFileSync(documentPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const productionDataSource = fs.readFileSync(
  "src/data/tickers/productionAppExportDataSource.js",
  "utf8",
);
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

test("keeps filesystem and non-SPA artifact routing", () => {
  assert.deepEqual(vercel.routes[0], { handle: "filesystem" });
  assert.deepEqual(vercel.routes[1], {
    src: "/app-data/(.*)",
    dest: "/app-data/404.txt",
    status: 404,
  });
  assert.deepEqual(vercel.routes.at(-1), { src: "/(.*)", dest: "/index.html" });
});

test("exposes the dedicated read-only check command", () => {
  assert.equal(
    packageJson.scripts["check:production-deployment-control"],
    "node --test scripts/check-production-deployment-control.mjs",
  );
});

test("records immutable deployment identities", () => {
  assert.match(document, /dpl_[A-Za-z0-9]+/);
  assert.match(document, /\b[0-9a-f]{40}\b/);
});

test("separates merge from production promotion", () => {
  assert.match(document, /main 병합과 Production 배포는 서로 다른 승인 단계/);
  assert.match(document, /backend-first/);
});

test("documents fail-closed operational boundaries", () => {
  for (const contract of [
    "wildcard CORS 금지",
    "환경변수 scope 변경은 별도 승인",
    "rollback deployment 삭제 금지",
    "alias/domain 변경 금지",
  ]) {
    assert.ok(document.includes(contract), `missing contract: ${contract}`);
  }
});

test("documents the direct fast-forward enforcement limit", () => {
  assert.match(document, /독립 fast-forward commit까지 완전히 차단하지 않는다/);
  assert.match(document, /git push origin <APPROVED_MAIN_SHA>:refs\/heads\/production/);
});

test("keeps production artifact configuration visible", () => {
  for (const name of [
    "VITE_FINPLE_MONTHLY_SCENARIO_ARTIFACT_ENABLED",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256",
    "VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256",
  ]) {
    assert.ok(document.includes(name), `missing production setting: ${name}`);
    assert.ok(productionDataSource.includes(name), `missing runtime setting: ${name}`);
  }
});

test("compares every audited deployment model", () => {
  for (const label of ["A안", "B안", "C안", "D안", "E안"]) {
    assert.ok(document.includes(label), `missing alternative: ${label}`);
  }
});
