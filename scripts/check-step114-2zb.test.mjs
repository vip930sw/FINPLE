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

test("production selector and immutable public v1 CSV stay unchanged", () => {
  const loader = fs.readFileSync(
    path.join(root, "src/data/tickers/screenerCandidateLoader.js"),
    "utf8",
  );
  assert.match(loader, /RAW_SCREENER_CANDIDATES = loadScreenerCandidatesFromCsv\(finpleAppCandidates6000Csv\)/);
  assert.match(loader, /APP_PREVIEW_SCREENER_CANDIDATES = loadScreenerCandidatesFromCsv\(finpleAppCandidatesV2Csv\)/);
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
    "underlyingTicker", "exposureType", "distributionType", "officialSourceUrl",
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

function manifestFromV2() {
  return readJson("src/data/tickers/finple_universe_v2_manifest.json");
}
