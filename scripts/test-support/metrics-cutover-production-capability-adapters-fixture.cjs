"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  createProductionCapabilityAdapters, hashContract, sha256,
} = require("../lib/metrics-cutover-production-capability-adapters.cjs");

const NOW = "2026-07-22T02:00:00.000Z";
const HEAD_SHA = "64fbcb599ec60e0423abc1b0aa382da6eb8c1bc7";
const TREE_SHA = "1234567890abcdef1234567890abcdef12345678";
const US_PUBLIC = "synthetic/us.csv";
const KR_PUBLIC = "synthetic/kr.csv";
const SELECTOR_PUBLIC = "synthetic/selector.js";
const US_BYTES = Buffer.from("market,ticker,value\nUS,AAA,1\n");
const KR_BYTES = Buffer.from("market,ticker,value\nKR,000001,2\n");
const SELECTOR_BEFORE = Buffer.from("export const selected = 'before';\n");
const SELECTOR_AFTER = Buffer.from("export const selected = 'after';\n");

const OPERATIONS = Object.freeze([
  ["cutoverClock", "readCutoverClock", "clock"],
  ["singleUseCutoverEnvelopeStore", "acquireEnvelopeClaim", "claim"],
  ["cutoverPreimageReader", "readBoundPreimages", "preimage"],
  ["atomicProductionCsvReplacer", "replaceProductionCsvAtomically", "replace-us"],
  ["cutoverPreimageReader", "readProductionCsvIdentity", "verify-us"],
  ["atomicProductionCsvReplacer", "replaceProductionCsvAtomically", "replace-kr"],
  ["cutoverPreimageReader", "readProductionCsvIdentity", "verify-kr"],
  ["selectorMutationCoordinator", "mutateSelectorExactlyOnce", "selector"],
  ["cutoverPreimageReader", "readPostCutoverState", "post-state"],
  ["cutoverReceiptStore", "persistCutoverReceipt", "receipt"],
  ["singleUseCutoverEnvelopeStore", "terminalizeEnvelopeClaim", "terminalize"],
  ["rollbackCoordinator", "restoreBoundPreimages", "rollback"],
  ["cutoverPreimageReader", "readBoundPreimages", "restore-verify"],
]);

function operationBindings() {
  return OPERATIONS.map(([capabilityName, methodName, operationId]) => ({
    capabilityName, methodName, operationId,
    idempotencyKey: hashContract("FINPLE_STEP114_2X_ZB_P_TEST_OPERATION\0",
      { capabilityName, methodName, operationId }),
  }));
}

function makeFixture(testContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "finple-zb-p-adapters-"));
  const approvedRoot = path.join(root, "approved");
  const stateRoot = path.join(root, "state");
  fs.mkdirSync(approvedRoot);
  fs.mkdirSync(stateRoot);
  const usPath = path.join(approvedRoot, "us.csv");
  const krPath = path.join(approvedRoot, "kr.csv");
  const selectorPath = path.join(approvedRoot, "selector.js");
  fs.writeFileSync(selectorPath, SELECTOR_BEFORE);
  const bindings = operationBindings();
  const construction = {
    filesystem: fs, pathApi: path, approvedRoot, stateRoot,
    targetPaths: [
      { market: "US", path: usPath, publicPath: US_PUBLIC },
      { market: "KR", path: krPath, publicPath: KR_PUBLIC },
    ],
    selectorPath: { path: selectorPath, publicPath: SELECTOR_PUBLIC },
    clock: { now: () => NOW }, operationBindings: bindings,
    platformCapabilities: { atomicSameDirectoryRename: true, exclusiveCreate: true,
      fileFsync: true, directoryFsync: false, crossDeviceFallbackAllowed: false },
    repositoryIdentity: { headSha: HEAD_SHA, treeSha: TREE_SHA },
    restorationMaterial: {
      targets: [
        { market: "US", path: usPath, existed: false, contentBase64: "" },
        { market: "KR", path: krPath, existed: false, contentBase64: "" },
      ],
      selector: { path: selectorPath, contentBase64: SELECTOR_BEFORE.toString("base64") },
    },
  };
  const fixture = {
    root, approvedRoot, stateRoot, usPath, krPath, selectorPath, construction,
    adapters: createProductionCapabilityAdapters(construction), bindings,
    bytes: { us: US_BYTES, kr: KR_BYTES, selectorBefore: SELECTOR_BEFORE,
      selectorAfter: SELECTOR_AFTER },
  };
  if (testContext) testContext.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return fixture;
}

function binding(fixture, operationId) {
  return fixture.bindings.find((entry) => entry.operationId === operationId);
}
function context(fixture, operationId, overrides = {}) {
  const entry = binding(fixture, operationId);
  return { operationId, idempotencyKey: entry.idempotencyKey,
    deadline: "2026-07-22T02:00:00.100Z", abortSignal: new AbortController().signal,
    ...overrides };
}
function expectedPreimages(fixture) {
  return {
    repositoryPreimageSha256: sha256("repository-preimage"),
    repositoryHeadSha: HEAD_SHA, repositoryTreeSha: TREE_SHA,
    trackedPathsSha256: sha256("tracked-paths"),
    targetAbsenceAttestationHash: sha256("target-absence"),
    noDriftAttestationHash: sha256("no-drift"),
    selectorPath: SELECTOR_PUBLIC, selectorPreimageSha256: sha256(SELECTOR_BEFORE),
    targets: [
      { market: "US", targetPath: US_PUBLIC, exists: false, preimageSha256: null },
      { market: "KR", targetPath: KR_PUBLIC, exists: false, preimageSha256: null },
    ],
  };
}
function csvPayload(market, bytes, sequence) {
  return { market, targetPath: market === "US" ? US_PUBLIC : KR_PUBLIC,
    candidateContentBase64: bytes.toString("base64"), expectedContentSha256: sha256(bytes),
    expectedByteCount: bytes.length, expectedRowCount: 1,
    expectedSchemaVersion: "synthetic.v1", requireCreateOnlyPreimage: true,
    stagingRenameAtomicityRequired: true, replaceCountLimit: 2, sequence,
    rawMaterialOutputAllowed: false };
}
function csvIdentity(market, bytes) {
  return { market, targetPath: market === "US" ? US_PUBLIC : KR_PUBLIC,
    contentSha256: sha256(bytes), schemaVersion: "synthetic.v1",
    schemaIdentitySha256: sha256("market,ticker,value"),
    datasetIdentityHash: sha256(`${market}-dataset`), rowCount: 1,
    byteCount: bytes.length };
}

module.exports = {
  HEAD_SHA, KR_PUBLIC, NOW, SELECTOR_PUBLIC, TREE_SHA, US_PUBLIC,
  binding, context, csvIdentity, csvPayload, expectedPreimages, makeFixture,
  operationBindings,
};
