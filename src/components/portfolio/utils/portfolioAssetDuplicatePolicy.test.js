import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  DUPLICATE_ASSET_ALERT_MESSAGE,
  createPortfolioAssetIdentity,
  findDuplicateAssetIndex,
} from "./portfolioAssetDuplicatePolicy.js";

const hookSource = fs.readFileSync(
  new URL("../hooks/usePortfolioSimulator.js", import.meta.url),
  "utf8",
);
const tableSource = fs.readFileSync(
  new URL("../components/AssetInputTable.jsx", import.meta.url),
  "utf8",
);

function functionSource(name, nextName) {
  const start = hookSource.indexOf(`function ${name}`);
  const end = hookSource.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0 && end > start, `${name} source`);
  return hookSource.slice(start, end);
}

test("duplicate identity uses normalized market and ticker with current-row exclusion", () => {
  const assets = [
    { market: "us", ticker: " tqqq " },
    { market: "KR", ticker: "069500" },
    { market: "CASH", ticker: "CASH" },
  ];

  assert.equal(createPortfolioAssetIdentity(assets[0]), "US:TQQQ");
  assert.equal(createPortfolioAssetIdentity(assets[1]), "KR:069500");
  assert.equal(createPortfolioAssetIdentity(assets[2]), "CASH:CASH");
  assert.equal(findDuplicateAssetIndex({ assets, market: "US", ticker: "TQQQ" }), 0);
  assert.equal(findDuplicateAssetIndex({ assets, market: "US", ticker: "TQQQ", excludeIndex: 0 }), -1);
  assert.equal(findDuplicateAssetIndex({ assets, market: "KR", ticker: "TQQQ" }), -1);
});

test("Asset Finder candidate add blocks duplicate identity", () => {
  const source = functionSource("addAssetFromTickerCandidate", "confirmPortfolioAssetAdd");
  assert.match(source, /findDuplicateAssetIndex/);
  assert.ok(source.indexOf("findDuplicateAssetIndex") < source.indexOf("getPortfolioAddDecision"));
});

test("candidate commit blocks duplicate identity", () => {
  const source = functionSource("commitTickerCandidate", "addAssetFromTickerCandidate");
  assert.match(source, /findDuplicateAssetIndex/);
  assert.match(source, /rejectDuplicateAsset/);
});

test("confirmed candidate add blocks duplicate identity", () => {
  const source = functionSource("confirmPortfolioAssetAdd", "discardPendingExistingAsset");
  assert.match(source, /findDuplicateAssetIndex/);
  assert.match(source, /rejectDuplicateAsset/);
});

test("direct ticker blur blocks duplicates before candidate lookup", () => {
  const source = functionSource("resolveTickerCandidate", "applyFetchedAssetData");
  assert.match(tableSource, /onBlur=\{\(e\) => resolveTickerCandidate/);
  assert.ok(source.indexOf("findDuplicateAssetIndex") < source.indexOf("fetchTickerCandidateByTicker"));
});

test("direct ticker Enter stops when the immutable update rejects a duplicate", () => {
  assert.match(
    tableSource,
    /if \(updateAsset\(index, "ticker", ticker\) === false\) return;/,
  );
  assert.doesNotMatch(tableSource, /currentAsset\.ticker\s*=/);
});

test("individual lookup detects duplicates before provider lookup", () => {
  const source = functionSource("fetchAssetData", "fetchAllAssetData");
  assert.ok(source.indexOf("findDuplicateAssetIndex") < source.indexOf("fetchAssetDataByTicker"));
});

test("CASH duplicate is blocked and first CASH add has no success alert", () => {
  const source = functionSource("addCashAsset", "addAsset");
  assert.match(source, /findDuplicateAssetIndex/);
  assert.match(source, /setAssetLookupSummary\(message\)/);
  assert.doesNotMatch(source, /window\.alert\(message\)/);
});

test("every duplicate alert uses the common user message", () => {
  assert.equal(
    DUPLICATE_ASSET_ALERT_MESSAGE,
    "각 자산은 포트폴리오에 한 번만 추가할 수 있습니다.",
  );
  assert.match(hookSource, /window\.alert\(DUPLICATE_ASSET_ALERT_MESSAGE\)/);
  assert.doesNotMatch(hookSource, /현금 자산은 포트폴리오에 한 번만/);
  assert.doesNotMatch(hookSource, /이미 현재 포트폴리오에 추가되어 있습니다/);
});
