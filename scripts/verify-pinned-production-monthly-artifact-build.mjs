import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const UNIVERSE_VERSION = "finple-universe-v2-2026-07-24";
export const RELEASE_SHA256 = "fd2ffd18f60753b5301dddf2df3a73d46195cf7f13581c697170e6e720409fa8";
export const SOURCE_APP_EXPORT_SHA256 = "603b426e175603ccfdf836c56de791377a1d554b4cfc498350612386b161ffd8";
export const ARTIFACT_BINDING_SHA256 = "594684b2e1e7043e01171a40607a1073344a5491ee0bbdc7eaa071d6501097b8";
export const ARTIFACT_FILE_COUNT = 69;
export const ARTIFACT_SIZE_BYTES = 54_117_941;

const RELEASE_NAME = "production-app-export-release.json";
const ROW_ENCODING = [
  "month",
  "priceReturn",
  "totalReturn",
  "fxReturn",
  "currency",
  "benchmarkId",
  "dataStatus",
];

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const read = (root, relativePath) => fs.readFileSync(path.join(root, relativePath));
const readJson = (root, relativePath) => JSON.parse(read(root, relativePath));
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

function listFiles(root, current = root) {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(current, entry.name);
    return entry.isDirectory() ? listFiles(root, absolute) : path.relative(root, absolute).replaceAll("\\", "/");
  });
}

export function artifactRoot(parent) {
  return path.resolve(parent, "app-data", UNIVERSE_VERSION);
}

export function verifyPinnedArtifact(root, byteIdentityRoot = null) {
  const releaseBytes = read(root, RELEASE_NAME);
  const releaseSha256 = sha256(releaseBytes);
  assert.equal(releaseSha256, RELEASE_SHA256, "release manifest SHA-256 mismatch");
  const release = JSON.parse(releaseBytes);
  assert.equal(release.universeVersion, UNIVERSE_VERSION);
  assert.equal(release.sourceAppExportSha256, SOURCE_APP_EXPORT_SHA256);
  assert.equal(release.shardCount, 64);
  assert.equal(release.shardInventory.length, 64);
  assert.equal(release.assetCount, 6029);
  assert.equal(release.monthlyReturnAssetCount, 5347);
  assert.equal(release.monthlyReturnRowCount, 701485);
  assert.equal(release.metricDataThroughMonth, "2026-06");

  const binding = {
    sourceManifest: release.sourceManifest,
    metricsOverlay: release.metricsOverlay,
    monthlyReturnsIndex: release.monthlyReturnsIndex,
    shardCount: release.shardCount,
    shardInventory: release.shardInventory,
  };
  const bindingSha256 = sha256(Buffer.from(stableJson(binding)));
  assert.equal(bindingSha256, ARTIFACT_BINDING_SHA256, "artifact binding mismatch");

  const sourceManifestBytes = read(root, release.sourceManifest.path);
  assert.equal(sourceManifestBytes.length, release.sourceManifest.sizeBytes);
  assert.equal(sha256(sourceManifestBytes), release.sourceManifest.sha256);
  const sourceManifest = JSON.parse(sourceManifestBytes);
  assert.equal(sourceManifest.files.length, 67);
  assert.equal(sourceManifest.assetCount, 6029);
  assert.equal(sourceManifest.monthlyReturnAssetCount, 5347);
  assert.equal(sourceManifest.monthlyReturnRowCount, 701485);
  assert.equal(sourceManifest.metricDataThroughMonth, "2026-06");

  const referenced = [
    { path: RELEASE_NAME, sha256: RELEASE_SHA256, sizeBytes: releaseBytes.length },
    release.sourceManifest,
    ...sourceManifest.files,
  ];
  assert.equal(new Set(referenced.map(({ path: relativePath }) => relativePath)).size, ARTIFACT_FILE_COUNT);
  for (const file of referenced) {
    const bytes = read(root, file.path);
    assert.equal(bytes.length, file.sizeBytes, `${file.path} size mismatch`);
    assert.equal(sha256(bytes), file.sha256, `${file.path} SHA-256 mismatch`);
    if (byteIdentityRoot) assert.ok(bytes.equals(read(byteIdentityRoot, file.path)), `${file.path} byte drift`);
  }

  const actualFiles = listFiles(root).sort();
  assert.deepEqual(actualFiles, referenced.map(({ path: relativePath }) => relativePath).sort());
  assert.equal(actualFiles.reduce((sum, relativePath) => sum + read(root, relativePath).length, 0), ARTIFACT_SIZE_BYTES);

  const index = readJson(root, release.monthlyReturnsIndex.path);
  const identities = Object.keys(index.assets);
  assert.equal(index.assetCount, 5347);
  assert.equal(index.rowCount, 701485);
  assert.equal(identities.length, 5347);
  assert.equal(identities.reduce((sum, identity) => sum + index.assets[identity].rowCount, 0), 701485);
  assert.deepEqual(index.rowEncoding, ROW_ENCODING);
  for (const identity of ["US:QQQ", "US:SCHD", "US:GLD"]) assert.ok(index.assets[identity], `${identity} missing`);

  assert.equal(release.shardInventory.reduce((sum, shard) => sum + shard.assetCount, 0), 5347);
  assert.equal(release.shardInventory.reduce((sum, shard) => sum + shard.rowCount, 0), 701485);
  return { release, releaseSha256, bindingSha256, sourceManifest, index, files: actualFiles };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const mode = process.argv[2];
  assert.ok(["--source", "--dist"].includes(mode), "usage: --source | --dist");
  const sourceRoot = artifactRoot("public");
  const root = mode === "--source" ? sourceRoot : artifactRoot("dist");
  const result = verifyPinnedArtifact(root, mode === "--dist" ? sourceRoot : null);
  console.log(`pinned monthly artifact verified: ${result.files.length} exact files`);
}
