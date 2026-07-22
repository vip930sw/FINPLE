"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepZ = require("./lib/metrics-cutover-production-single-use-executor.cjs");
const {
  CAPABILITY_NAMES, buildProductionAdapterManifest,
  createProductionCapabilityAdapters, hashContract, sha256,
} = require("./lib/metrics-cutover-production-capability-adapters.cjs");
const { runCli } = require("./check-metrics-cutover-production-capability-adapters.cjs");
const {
  context, csvIdentity, csvPayload, expectedPreimages, makeFixture,
} = require("./test-support/metrics-cutover-production-capability-adapters-fixture.cjs");

test("zero-argument capability CLI remains awaiting and non-executing", () => {
  let output = "";
  assert.equal(runCli([], (value) => { output = value; }), 0);
  const result = JSON.parse(output);
  assert.equal(result.status, "awaiting_production_adapter_and_provenance_material");
  assert.equal(result.capabilityMethodInvoked, false);
  assert.equal(result.productionConfigured, false);
});

test("factories expose exact Step Z descriptors and methods", (t) => {
  const fixture = makeFixture(t);
  assert.deepEqual(Object.keys(fixture.adapters), CAPABILITY_NAMES);
  for (const name of CAPABILITY_NAMES) {
    assert.deepEqual(fixture.adapters[name].descriptor, stepZ.buildCapabilityDescriptor(name));
    assert.deepEqual(Object.keys(fixture.adapters[name]).sort(),
      ["descriptor", ...stepZ.CAPABILITY_METHODS[name]].sort());
    assert.equal(fixture.adapters[name].descriptor.hardTimeoutMilliseconds, 100);
  }
});

test("explicit approved roots reject aliases, escapes, and junction traversal", (t) => {
  const fixture = makeFixture(t);
  const escaped = { ...fixture.construction,
    targetPaths: fixture.construction.targetPaths.map((entry, index) => index === 0
      ? { ...entry, path: path.join(fixture.root, "escape.csv") } : entry) };
  assert.throws(() => createProductionCapabilityAdapters(escaped),
    /approved_root_escape_or_alias/);
  const aliased = { ...fixture.construction,
    targetPaths: fixture.construction.targetPaths.map((entry, index) => index === 1
      ? { ...entry, publicPath: fixture.construction.targetPaths[0].publicPath } : entry) };
  assert.throws(() => createProductionCapabilityAdapters(aliased), /public_path_aliasing/);
  const outside = path.join(fixture.root, "outside");
  const junction = path.join(fixture.approvedRoot, "junction");
  fs.mkdirSync(outside);
  try {
    fs.symlinkSync(outside, junction, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    t.skip(`symlink fixture unavailable: ${error.code}`); return;
  }
  const junctionInput = { ...fixture.construction,
    targetPaths: fixture.construction.targetPaths.map((entry, index) => index === 0
      ? { ...entry, path: path.join(junction, "us.csv") } : entry) };
  assert.throws(() => createProductionCapabilityAdapters(junctionInput),
    /symlink_or_junction_forbidden|realpath_escape_forbidden/);
});

test("clock requires exact deterministic instant, deadline, and AbortSignal", async (t) => {
  const fixture = makeFixture(t);
  const clock = fixture.adapters.cutoverClock;
  assert.deepEqual(await clock.readCutoverClock(
    { expectedInstant: "2026-07-22T02:00:00.000Z",
      effectiveExpiry: "2026-07-22T02:05:00.000Z" }, context(fixture, "clock")),
  { instant: "2026-07-22T02:00:00.000Z" });
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(clock.readCutoverClock(
    { expectedInstant: "2026-07-22T02:00:00.000Z",
      effectiveExpiry: "2026-07-22T02:05:00.000Z" },
    context(fixture, "clock", { abortSignal: aborted.signal })), /operation_cancelled/);
  await assert.rejects(clock.readCutoverClock(
    { expectedInstant: "2026-07-22T02:00:00.000Z",
      effectiveExpiry: "2026-07-22T02:05:00.000Z" },
    context(fixture, "clock", { deadline: "2026-07-22T02:00:00.101Z" })),
  /fixed_deadline_invalid/);
});

test("read-only preimage identity reports exact absence and selector binding", async (t) => {
  const fixture = makeFixture(t);
  const expected = expectedPreimages(fixture);
  const result = await fixture.adapters.cutoverPreimageReader.readBoundPreimages(
    { envelopeId: "envelope", expectedPreimages: expected,
      verificationPurpose: "immediate_pre_mutation_no_drift" },
    context(fixture, "preimage"));
  assert.deepEqual(result, expected);
  fs.writeFileSync(fixture.usPath, fixture.bytes.us);
  await assert.rejects(fixture.adapters.cutoverPreimageReader.readBoundPreimages(
    { envelopeId: "envelope", expectedPreimages: expected,
      verificationPurpose: "immediate_pre_mutation_no_drift" },
    context(fixture, "preimage")), /target_existence_drift/);
});

test("atomic CSV replacement enforces US then KR, staged identities, and no retry", async (t) => {
  const fixture = makeFixture(t);
  const replacer = fixture.adapters.atomicProductionCsvReplacer;
  await assert.rejects(replacer.replaceProductionCsvAtomically(
    csvPayload("KR", fixture.bytes.kr, 2), context(fixture, "replace-kr")),
  /us_before_kr_order_required/);
  const bad = { ...csvPayload("US", fixture.bytes.us, 1), expectedByteCount: 1 };
  await assert.rejects(replacer.replaceProductionCsvAtomically(bad,
    context(fixture, "replace-us")), /candidate_identity_invalid/);
  assert.equal(fs.existsSync(fixture.usPath), false);
  const us = await replacer.replaceProductionCsvAtomically(
    csvPayload("US", fixture.bytes.us, 1), context(fixture, "replace-us"));
  const kr = await replacer.replaceProductionCsvAtomically(
    csvPayload("KR", fixture.bytes.kr, 2), context(fixture, "replace-kr"));
  assert.equal(us.outcome, "replaced"); assert.equal(kr.outcome, "replaced");
  assert.deepEqual(fs.readFileSync(fixture.usPath), fixture.bytes.us);
  assert.deepEqual(fs.readFileSync(fixture.krPath), fixture.bytes.kr);
  await assert.rejects(replacer.replaceProductionCsvAtomically(
    csvPayload("US", fixture.bytes.us, 1), context(fixture, "replace-us")),
  /create_only_target_exists/);
});

test("CSV identity and selector mutation are exact and sanitized", async (t) => {
  const fixture = makeFixture(t);
  await fixture.adapters.atomicProductionCsvReplacer.replaceProductionCsvAtomically(
    csvPayload("US", fixture.bytes.us, 1), context(fixture, "replace-us"));
  await fixture.adapters.atomicProductionCsvReplacer.replaceProductionCsvAtomically(
    csvPayload("KR", fixture.bytes.kr, 2), context(fixture, "replace-kr"));
  const expectedUs = csvIdentity("US", fixture.bytes.us);
  assert.deepEqual(await fixture.adapters.cutoverPreimageReader.readProductionCsvIdentity(
    { market: "US", targetPath: "synthetic/us.csv", expectedIdentity: expectedUs },
    context(fixture, "verify-us")), expectedUs);
  const payload = { selectorPath: "synthetic/selector.js",
    selectorPreimageBase64: fixture.bytes.selectorBefore.toString("base64"),
    selectorPreimageSha256: sha256(fixture.bytes.selectorBefore),
    selectorPostimageBase64: fixture.bytes.selectorAfter.toString("base64"),
    selectorExpectedPostimageSha256: sha256(fixture.bytes.selectorAfter),
    exactReplacementCount: 2, selectorMutationCountLimit: 1,
    atomicStagingRenameRequired: true, rawMaterialOutputAllowed: false };
  const result = await fixture.adapters.selectorMutationCoordinator.mutateSelectorExactlyOnce(
    payload, context(fixture, "selector"));
  assert.equal(result.outcome, "mutated");
  assert.equal(JSON.stringify(result).includes("Base64"), false);
  await assert.rejects(fixture.adapters.selectorMutationCoordinator.mutateSelectorExactlyOnce(
    payload, context(fixture, "selector")), /selector_preimage_drift/);
});

test("claim journal is durable, exact-once, terminalized once, and restart-reconcilable", async (t) => {
  const fixture = makeFixture(t);
  const store = fixture.adapters.singleUseCutoverEnvelopeStore;
  const payload = { envelopeId: "envelope-1", envelopeHash: sha256("envelope"),
    approvalNonceHash: sha256("nonce"), effectiveCutoverExpiresAt: "2026-07-22T02:05:00.000Z",
    singleUse: true, automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false };
  const acquired = await store.acquireEnvelopeClaim(payload, context(fixture, "claim"));
  assert.equal(acquired.outcome, "acquired");
  assert.deepEqual(await store.acquireEnvelopeClaim(payload, context(fixture, "claim")),
    { outcome: "already_consumed", claimHash: null });
  const restarted = createProductionCapabilityAdapters(fixture.construction);
  assert.deepEqual(await restarted.singleUseCutoverEnvelopeStore.reconcileOperationOutcome(
    { operationId: "claim", idempotencyKey: context(fixture, "claim").idempotencyKey },
    context(fixture, "claim")), { outcome: "committed", resourceHash: acquired.claimHash });
  const terminal = await store.terminalizeEnvelopeClaim({ envelopeId: "envelope-1",
    envelopeHash: payload.envelopeHash, claimHash: acquired.claimHash,
    terminalState: "completed", cutoverReceiptId: null, cutoverReceiptHash: null,
    automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false }, context(fixture, "terminalize"));
  assert.equal(terminal.outcome, "terminalized");
  await assert.rejects(store.terminalizeEnvelopeClaim({ envelopeId: "envelope-1",
    envelopeHash: payload.envelopeHash, claimHash: acquired.claimHash,
    terminalState: "completed", cutoverReceiptId: null, cutoverReceiptHash: null,
    automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false }, context(fixture, "terminalize")),
  /claim_terminalization_invalid/);
});

test("receipt persistence is exclusive, sanitized, and read-only reconciled", async (t) => {
  const fixture = makeFixture(t);
  const receipt = { cutoverReceiptId: "receipt-1", cutoverReceiptHash: sha256("receipt"),
    selectorPath: "synthetic/selector.js", rawMaterialPresent: false };
  const result = await fixture.adapters.cutoverReceiptStore.persistCutoverReceipt(
    receipt, context(fixture, "receipt"));
  assert.equal(result.outcome, "persisted");
  await assert.rejects(fixture.adapters.cutoverReceiptStore.persistCutoverReceipt(
    receipt, context(fixture, "receipt")), /receipt_replay_forbidden/);
  assert.deepEqual(await fixture.adapters.cutoverReceiptStore.reconcileOperationOutcome(
    { operationId: "receipt", idempotencyKey: context(fixture, "receipt").idempotencyKey },
    context(fixture, "receipt")), { outcome: "committed", resourceHash: result.receiptStoreHash });
  await assert.rejects(fixture.adapters.cutoverReceiptStore.persistCutoverReceipt(
    { ...receipt, cutoverReceiptId: "receipt-2", signatureBase64: "raw" },
    context(fixture, "receipt")), /raw_receipt_material_forbidden/);
});

test("rollback restores original absence and selector preimage and verifies result", async (t) => {
  const fixture = makeFixture(t);
  fs.writeFileSync(fixture.usPath, fixture.bytes.us);
  fs.writeFileSync(fixture.krPath, fixture.bytes.kr);
  fs.writeFileSync(fixture.selectorPath, fixture.bytes.selectorAfter);
  const result = await fixture.adapters.rollbackCoordinator.restoreBoundPreimages({
    failureStage: "mutate_selector", envelopeId: "envelope",
    envelopeHash: sha256("envelope"), exactPreimages: expectedPreimages(fixture),
    restoreUsTarget: true, restoreKrTarget: true, restoreSelector: true,
    receiptMayExist: false, rawMaterialPresent: false,
  }, context(fixture, "rollback"));
  assert.equal(result.outcome, "restored");
  assert.equal(fs.existsSync(fixture.usPath), false);
  assert.equal(fs.existsSync(fixture.krPath), false);
  assert.deepEqual(fs.readFileSync(fixture.selectorPath), fixture.bytes.selectorBefore);
});

test("receipt or terminalization ambiguity requires manual review and no closeout", async (t) => {
  const fixture = makeFixture(t);
  const result = await fixture.adapters.rollbackCoordinator.restoreBoundPreimages({
    failureStage: "terminalize_envelope_claim", envelopeId: "envelope",
    envelopeHash: sha256("envelope"), exactPreimages: expectedPreimages(fixture),
    restoreUsTarget: false, restoreKrTarget: false, restoreSelector: false,
    receiptMayExist: true, rawMaterialPresent: false,
  }, context(fixture, "rollback"));
  assert.deepEqual(result, { outcome: "ambiguous", restorationHash: null,
    manualReviewRequired: true });
});

test("adapter manifest is deterministic, frozen, sanitized, and zero-count", () => {
  const input = { adapterSourceIdentities: [
    { moduleRole: "production_capability_adapters",
      sourcePathIdentityHash: sha256("adapter-path"),
      sourceBlobIdentityHash: sha256("adapter-blob"),
      sourceContentSha256: sha256("adapter-content") },
    { moduleRole: "current_main_provenance_bridge",
      sourcePathIdentityHash: sha256("bridge-path"),
      sourceBlobIdentityHash: sha256("bridge-blob"),
      sourceContentSha256: sha256("bridge-content") }],
  approvedRootPolicyIdentity: sha256("root-policy"),
  platformCapabilities: { atomicSameDirectoryRename: true, exclusiveCreate: true,
    fileFsync: true, directoryFsync: false, crossDeviceFallbackAllowed: false },
  claimStateSchemaIdentity: sha256("claim"), receiptStateSchemaIdentity: sha256("receipt"),
  rollbackStateSchemaIdentity: sha256("rollback") };
  const left = buildProductionAdapterManifest(input);
  const right = buildProductionAdapterManifest(input);
  assert.deepEqual(left, right);
  assert.equal(Object.isFrozen(left), true);
  assert.equal(left.productionCapable, true);
  assert.equal(left.productionConfigured, false);
  assert.equal(left.rawMaterialPresent, false);
  assert.deepEqual(Object.values(left.capabilityInvocationCounts), Array(7).fill(0));
  assert.equal(JSON.stringify(left).includes("candidateContentBase64"), false);
  assert.equal(left.adapterManifestHash,
    hashContract("FINPLE_STEP114_2X_ZB_P_ADAPTER_MANIFEST_HASH\0",
      Object.fromEntries(Object.entries(left).filter(([key]) => key !== "adapterManifestHash"))));
});
