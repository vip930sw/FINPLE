import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPortfolioAssetIdentityChanged,
  reconcileIdentityScopedAssetMetadata,
  resetIdentityScopedAssetMetadata,
} from "./portfolioAssetIdentityMetadata.js";

const REVIEW_POLICY = "leveraged-inverse-review-policy-v1-step114";
const GAP_POLICY = "initial-gap-review-policy-v1-step114";

function reviewAsset(overrides = {}) {
  return {
    id: "asset-row-1",
    market: "US",
    ticker: "TQQQ",
    name: "TQQQ",
    quantity: 12,
    price: 55,
    targetEvaluationAmount: 660,
    targetWeight: 25,
    reviewTag: "metric_review",
    reviewReason: "threshold review",
    reviewApprovalPolicyVersion: REVIEW_POLICY,
    reviewApprovalStatus: "ready",
    reviewApprovalReason: "approved",
    reviewApprovalReasonCodes: ["approved_reason"],
    reviewApprovalAudit: { source: "TQQQ" },
    sourceHash: "old-source",
    rawSourceSha256: "old-raw-source",
    normalizedSeriesHash: "old-series",
    proxyLineageStatus: "non_proxy_proven",
    isProxy: false,
    proxyTicker: "",
    productionAppExportEnabled: true,
    productionPublishReady: true,
    appExportApproved: true,
    ...overrides,
  };
}

test("ticker replacement clears stale review policy and lineage while preserving user values", () => {
  const previous = reviewAsset();
  const replacement = reconcileIdentityScopedAssetMetadata(
    previous,
    { market: "US", ticker: "QQQ" },
    {
      market: "US",
      ticker: "QQQ",
      dataStatus: "ready",
      metricsStatus: "ready",
    },
  );

  assert.equal(replacement.ticker, "QQQ");
  assert.equal(replacement.reviewApprovalPolicyVersion, "");
  assert.equal(replacement.reviewApprovalStatus, "");
  assert.equal(replacement.reviewApprovalReason, "");
  assert.deepEqual(replacement.reviewApprovalReasonCodes, []);
  assert.equal(replacement.reviewApprovalAudit, null);
  assert.equal(replacement.sourceHash, "");
  assert.equal(replacement.rawSourceSha256, "");
  assert.equal(replacement.normalizedSeriesHash, "");
  assert.equal(replacement.proxyLineageStatus, "");
  assert.equal(replacement.isProxy, undefined);
  assert.equal(replacement.proxyTicker, undefined);
  assert.equal(replacement.quantity, 12);
  assert.equal(replacement.price, 55);
  assert.equal(replacement.targetEvaluationAmount, 660);
  assert.equal(replacement.targetWeight, 25);
});

test("unsupported identity replacement clears stale policy state", () => {
  const previous = reviewAsset({
    reviewApprovalPolicyVersion: "unsupported-product-policy",
    reviewApprovalStatus: "blocked",
    reviewApprovalReasonCodes: ["unsupported_product_policy"],
  });
  const replacement = reconcileIdentityScopedAssetMetadata(
    previous,
    { market: "US", ticker: "SPY" },
    { market: "US", ticker: "SPY" },
  );

  assert.equal(replacement.reviewApprovalPolicyVersion, "");
  assert.equal(replacement.reviewApprovalStatus, "");
  assert.deepEqual(replacement.reviewApprovalReasonCodes, []);
});

test("review-gated replacement applies only the new candidate policy", () => {
  const replacement = reconcileIdentityScopedAssetMetadata(
    reviewAsset(),
    { market: "KR", ticker: "069500" },
    {
      market: "KR",
      ticker: "069500",
      reviewApprovalPolicyVersion: GAP_POLICY,
      reviewApprovalStatus: "ready",
      reviewApprovalReason: "initial gap reconciled",
      reviewApprovalReasonCodes: [],
      reviewApprovalAudit: { source: "069500" },
      sourceHash: "new-source",
    },
  );

  assert.equal(replacement.reviewApprovalPolicyVersion, GAP_POLICY);
  assert.equal(replacement.reviewApprovalReason, "initial gap reconciled");
  assert.deepEqual(replacement.reviewApprovalAudit, { source: "069500" });
  assert.equal(replacement.sourceHash, "new-source");
});

test("same market and ticker preserves policy metadata for quantity price and weight edits", () => {
  const previous = reviewAsset();
  const edited = {
    ...previous,
    quantity: 20,
    price: 60,
    targetWeight: 35,
  };
  const reconciled = reconcileIdentityScopedAssetMetadata(
    edited,
    { market: "US", ticker: "tqqq" },
  );

  assert.equal(hasPortfolioAssetIdentityChanged(previous, reconciled), false);
  assert.equal(reconciled.reviewApprovalPolicyVersion, REVIEW_POLICY);
  assert.deepEqual(reconciled.reviewApprovalAudit, { source: "TQQQ" });
  assert.equal(reconciled.quantity, 20);
  assert.equal(reconciled.price, 60);
  assert.equal(reconciled.targetWeight, 35);
});

test("market-only identity replacement clears prior policy metadata", () => {
  const previous = reviewAsset({ ticker: "069500", market: "US" });
  assert.equal(
    hasPortfolioAssetIdentityChanged(previous, {
      market: "KR",
      ticker: "069500",
    }),
    true,
  );
  const replacement = reconcileIdentityScopedAssetMetadata(
    previous,
    { market: "KR", ticker: "069500" },
    { market: "KR", ticker: "069500" },
  );
  assert.equal(replacement.reviewApprovalPolicyVersion, "");
  assert.equal(replacement.sourceHash, "");
});

test("save and hard reload cannot resurrect cleared identity metadata", () => {
  const replacement = reconcileIdentityScopedAssetMetadata(
    reviewAsset(),
    { market: "US", ticker: "QQQ" },
    { market: "US", ticker: "QQQ" },
  );
  const reloaded = JSON.parse(JSON.stringify(replacement));
  const hydrated = reconcileIdentityScopedAssetMetadata(
    reloaded,
    { market: "US", ticker: "QQQ" },
  );

  assert.equal(hydrated.reviewApprovalPolicyVersion, "");
  assert.equal(hydrated.reviewApprovalStatus, "");
  assert.deepEqual(hydrated.reviewApprovalReasonCodes, []);
  assert.equal(hydrated.sourceHash, "");
  assert.equal(hydrated.proxyLineageStatus, "");
});

test("explicit reset does not remove user-owned portfolio fields", () => {
  const reset = resetIdentityScopedAssetMetadata(reviewAsset());
  assert.equal(reset.id, "asset-row-1");
  assert.equal(reset.name, "TQQQ");
  assert.equal(reset.quantity, 12);
  assert.equal(reset.price, 55);
  assert.equal(reset.targetEvaluationAmount, 660);
  assert.equal(reset.targetWeight, 25);
});
