import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ARTIFACT_BINDING_SHA256,
  ARTIFACT_FILE_COUNT,
  ARTIFACT_SIZE_BYTES,
  RELEASE_SHA256,
  SOURCE_APP_EXPORT_SHA256,
  UNIVERSE_VERSION,
  artifactRoot,
  verifyPinnedArtifact,
} from "./verify-pinned-production-monthly-artifact-build.mjs";

const sourceRoot = artifactRoot("public");
const distRoot = artifactRoot("dist");
const source = verifyPinnedArtifact(sourceRoot);
const dist = verifyPinnedArtifact(distRoot, sourceRoot);
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const routes = vercel.routes;

test("pins the immutable universe identity", () => assert.equal(UNIVERSE_VERSION, "finple-universe-v2-2026-07-24"));
test("pins the exact release SHA", () => assert.equal(source.releaseSha256, RELEASE_SHA256));
test("pins the source app-export SHA", () => assert.equal(source.release.sourceAppExportSha256, SOURCE_APP_EXPORT_SHA256));
test("pins the artifact binding SHA", () => assert.equal(source.bindingSha256, ARTIFACT_BINDING_SHA256));
test("publishes the approved release manifest", () => assert.equal(source.release.productionPublishReady, true));
test("publishes the exact source manifest", () => {
  assert.equal(source.sourceManifest.internalPreviewReviewOnly, true);
  assert.equal(source.sourceManifest.files.length, 67);
});
test("publishes the exact metrics overlay", () => assert.equal(source.release.metricsOverlay.path, "metrics-overlay.json"));
test("publishes the exact monthly index", () => assert.equal(source.release.monthlyReturnsIndex.path, "monthly-returns-index.json"));
test("publishes all 64 shards", () => assert.equal(source.release.shardInventory.length, 64));
test("keeps every referenced path", () => assert.equal(source.files.length, ARTIFACT_FILE_COUNT));
test("keeps the exact total byte size", () => assert.equal(ARTIFACT_SIZE_BYTES, 54_117_941));
test("reconciles monthly asset count", () => assert.equal(source.index.assetCount, 5347));
test("reconciles monthly row count", () => assert.equal(source.index.rowCount, 701485));
test("keeps the approved row encoding", () => assert.equal(source.index.rowEncoding.length, 7));
test("keeps QQQ SCHD and GLD identities", () => ["US:QQQ", "US:SCHD", "US:GLD"].forEach((identity) => assert.ok(source.index.assets[identity])));
test("build output is byte-identical", () => assert.deepEqual(dist.files, source.files));
test("build fails closed through prebuild and postbuild verification", () => {
  assert.match(packageJson.scripts.prebuild, /--source/);
  assert.match(packageJson.scripts.build, /--dist/);
});
test("serves filesystem assets before fallbacks", () => assert.deepEqual(routes[0], { handle: "filesystem" }));
test("returns a non-SPA 404 for missing app-data", () => {
  assert.deepEqual(routes[1], { src: "/app-data/(.*)", dest: "/app-data/404.txt", status: 404 });
  assert.equal(fs.readFileSync("public/app-data/404.txt", "utf8"), "Not Found\n");
});
test("keeps normal SPA fallback without artifact generation commands", () => {
  assert.deepEqual(routes[2], { src: "/(.*)", dest: "/index.html" });
  const commands = `${packageJson.scripts.prebuild} ${packageJson.scripts.build} ${packageJson.scripts["check:p3a-production-monthly-artifact-publication"]}`;
  assert.doesNotMatch(commands, /python|colab|provider|candidate|generate/i);
});
