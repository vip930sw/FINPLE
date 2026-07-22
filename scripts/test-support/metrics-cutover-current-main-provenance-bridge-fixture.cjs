"use strict";

const {
  buildProductionAdapterManifest,
} = require("../lib/metrics-cutover-production-capability-adapters.cjs");
const {
  SOURCE_ROLES, buildCurrentPreimageManifest, buildHistoricalContracts, hashContract,
} = require("../lib/metrics-cutover-current-main-provenance-bridge.cjs");

const EXECUTION_MAIN_SHA = "abcdefabcdefabcdefabcdefabcdefabcdefabcd";
const TREE_SHA = "1234512345123451234512345123451234512345";
const EVALUATION = "2026-07-22T03:00:10.000Z";

function h(label) {
  return hashContract("FINPLE_STEP114_2X_ZB_P_TEST_IDENTITY\0", label);
}
function sourceIdentities() {
  return SOURCE_ROLES.map((role) => ({ role,
    sourcePathIdentityHash: h(`${role}:path`),
    sourceBlobIdentityHash: h(`${role}:blob`),
    sourceContentSha256: h(`${role}:content`),
  }));
}
function adapterManifest() {
  const sources = sourceIdentities().filter((entry) =>
    ["production_capability_adapters", "current_main_provenance_bridge"].includes(entry.role));
  return buildProductionAdapterManifest({
    adapterSourceIdentities: sources.map((entry) => ({ moduleRole: entry.role,
      sourcePathIdentityHash: entry.sourcePathIdentityHash,
      sourceBlobIdentityHash: entry.sourceBlobIdentityHash,
      sourceContentSha256: entry.sourceContentSha256 })),
    approvedRootPolicyIdentity: h("approved-root-policy"),
    platformCapabilities: { atomicSameDirectoryRename: true, exclusiveCreate: true,
      fileFsync: true, directoryFsync: false, crossDeviceFallbackAllowed: false },
    claimStateSchemaIdentity: h("claim-schema"),
    receiptStateSchemaIdentity: h("receipt-schema"),
    rollbackStateSchemaIdentity: h("rollback-schema"),
  });
}
function validPacket() {
  const sources = sourceIdentities();
  const targetPathIdentities = [
    { market: "US", approvedRootPolicyHash: h("approved-root-policy"),
      approvedPathIdentityHash: h("us-approved-path") },
    { market: "KR", approvedRootPolicyHash: h("approved-root-policy"),
      approvedPathIdentityHash: h("kr-approved-path") },
  ];
  const selectorPathIdentity = { approvedRootPolicyHash: h("approved-root-policy"),
    approvedPathIdentityHash: h("selector-approved-path") };
  const currentPreimageManifest = buildCurrentPreimageManifest({
    repositoryHeadSha: EXECUTION_MAIN_SHA, repositoryTreeSha: TREE_SHA,
    targetPreimageIdentities: targetPathIdentities.map((entry) => ({ market: entry.market,
      pathIdentityHash: entry.approvedPathIdentityHash, exists: false,
      contentIdentityHash: null, byteCount: 0, rowCount: 0 })),
    selectorPreimageIdentity: { pathIdentityHash: selectorPathIdentity.approvedPathIdentityHash,
      contentIdentityHash: h("selector-preimage"), byteCount: 31 },
  });
  return {
    executionMainSha: EXECUTION_MAIN_SHA,
    repositorySnapshot: { headSha: EXECUTION_MAIN_SHA, treeSha: TREE_SHA,
      snapshotIdentityHash: hashContract("FINPLE_STEP114_2X_ZB_P_REPOSITORY_SNAPSHOT\0",
        { headSha: EXECUTION_MAIN_SHA, treeSha: TREE_SHA }) },
    reviewedSourceIdentities: sources,
    observedSourceIdentities: JSON.parse(JSON.stringify(sources)),
    historicalContracts: buildHistoricalContracts(),
    targetPathIdentities, selectorPathIdentity,
    adapterManifest: adapterManifest(), currentPreimageManifest,
    operatorMaterialIdentities: null,
    provenanceNonceContext: { priorNonceHashes: [h("prior-a"), h("prior-b")].sort(),
      provenanceNonceHash: h("fresh-provenance"),
      upstreamNonceHashes: [h("upstream-a"), h("upstream-b")].sort() },
    issuedAt: "2026-07-22T03:00:00.000Z",
    effectiveExpiresAt: "2026-07-22T03:05:00.000Z",
    evaluationClockInstant: EVALUATION,
    authoritySignals: { merge: false, ci: false, vercel: false,
      healthCheck: false, repositoryOwnership: false },
  };
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = { EVALUATION, EXECUTION_MAIN_SHA, TREE_SHA, adapterManifest,
  clone, h, sourceIdentities, validPacket };
