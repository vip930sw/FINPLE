"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepZ = require("./lib/metrics-cutover-production-single-use-executor.cjs");
const {
  CAPABILITY_NAMES, buildProductionAdapterManifest,
  createProductionCapabilityAdapters,
  getVerifiedProductionAdapterConstructionBinding, hashContract, sha256,
} = require("./lib/metrics-cutover-production-capability-adapters.cjs");
const { runCli } = require("./check-metrics-cutover-production-capability-adapters.cjs");
const {
  context, csvIdentity, csvPayload, expectedPreimages, makeFixture,
} = require("./test-support/metrics-cutover-production-capability-adapters-fixture.cjs");

function claimPayload() {
  return { envelopeId: "envelope-1", envelopeHash: sha256("envelope"),
    approvalNonceHash: sha256("nonce"), effectiveCutoverExpiresAt: "2026-07-22T02:05:00.000Z",
    singleUse: true, automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false };
}
function terminalPayload(claimHash) {
  return { envelopeId: "envelope-1", envelopeHash: sha256("envelope"), claimHash,
    terminalState: "completed", cutoverReceiptId: null, cutoverReceiptHash: null,
    automaticRetryAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false };
}
function selectorPayload(fixture) {
  return { selectorPath: "synthetic/selector.js",
    selectorPreimageBase64: fixture.bytes.selectorBefore.toString("base64"),
    selectorPreimageSha256: sha256(fixture.bytes.selectorBefore),
    selectorPostimageBase64: fixture.bytes.selectorAfter.toString("base64"),
    selectorExpectedPostimageSha256: sha256(fixture.bytes.selectorAfter),
    exactReplacementCount: 2, selectorMutationCountLimit: 1,
    atomicStagingRenameRequired: true, rawMaterialOutputAllowed: false };
}
function receiptPayload() {
  return { cutoverReceiptId: "receipt-1", cutoverReceiptHash: sha256("receipt"),
    selectorPath: "synthetic/selector.js", rawMaterialPresent: false };
}
function rollbackPayload(fixture, receiptMayExist = false) {
  return { failureStage: "mutate_selector", envelopeId: "envelope",
    envelopeHash: sha256("envelope"), exactPreimages: expectedPreimages(fixture),
    restoreUsTarget: true, restoreKrTarget: true, restoreSelector: true,
    receiptMayExist, rawMaterialPresent: false };
}

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

test("factory construction binding is private, complete, and set-specific", (t) => {
  const first = makeFixture(t);
  const second = makeFixture(t);
  const binding = getVerifiedProductionAdapterConstructionBinding(first.adapters);
  assert.equal(typeof binding.adapterConstructionBindingHash, "string");
  assert.equal(Object.isFrozen(binding), true);
  assert.equal(JSON.stringify(binding).includes(first.approvedRoot), false);
  assert.equal(getVerifiedProductionAdapterConstructionBinding({
    ...first.adapters, cutoverClock: { ...first.adapters.cutoverClock } }), null);
  assert.equal(getVerifiedProductionAdapterConstructionBinding({
    ...first.adapters, cutoverClock: second.adapters.cutoverClock }), null);
});

test("factory binding distinguishes approved-relative actual paths without exposing them", (t) => {
  const fixture = makeFixture(t);
  const original = getVerifiedProductionAdapterConstructionBinding(fixture.adapters);
  assert.equal(JSON.stringify(original).includes(fixture.approvedRoot), false);
  for (const [index, target] of original.targetContracts.entries()) {
    assert.equal(typeof target.publicPathIdentityHash, "string");
    assert.equal(typeof target.approvedRelativePathIdentityHash, "string");
    assert.equal(target.approvedRelativePathIdentityHash,
      original.restorationMaterialIdentity.targets[index]
        .approvedRelativePathIdentityHash);
  }
  assert.equal(original.selectorBinding.approvedRelativePathIdentityHash,
    original.restorationMaterialIdentity.selector.approvedRelativePathIdentityHash);

  const variants = fixture.construction.targetPaths.map((_, changedIndex) => {
    const targetPaths = fixture.construction.targetPaths.map((entry, index) =>
      index === changedIndex ? { ...entry, path: path.join(fixture.approvedRoot,
        `${entry.market.toLowerCase()}-alternate.csv`) } : entry);
    return { ...fixture.construction, targetPaths,
      restorationMaterial: { ...fixture.construction.restorationMaterial,
        targets: fixture.construction.restorationMaterial.targets.map((entry, index) =>
          ({ ...entry, path: targetPaths[index].path })) } };
  });
  const alternateSelectorPath = path.join(fixture.approvedRoot,
    "selector-alternate.js");
  fs.writeFileSync(alternateSelectorPath, fixture.bytes.selectorBefore);
  variants.push({ ...fixture.construction,
    selectorPath: { ...fixture.construction.selectorPath,
      path: alternateSelectorPath },
    restorationMaterial: { ...fixture.construction.restorationMaterial,
      selector: { ...fixture.construction.restorationMaterial.selector,
        path: alternateSelectorPath } } });

  for (const construction of variants) {
    const adapterSet = createProductionCapabilityAdapters(construction);
    const binding = getVerifiedProductionAdapterConstructionBinding(adapterSet);
    assert.notEqual(binding.adapterConstructionBindingHash,
      original.adapterConstructionBindingHash);
  }

  const restorationTargetDrift = {
    ...fixture.construction.restorationMaterial,
    targets: fixture.construction.restorationMaterial.targets.map((entry, index) =>
      index === 0 ? { ...entry,
        path: path.join(fixture.approvedRoot, "restoration-us-drift.csv") } : entry),
  };
  assert.throws(() => createProductionCapabilityAdapters({
    ...fixture.construction, restorationMaterial: restorationTargetDrift,
  }), /restoration_target_binding_invalid/);
  const restorationSelectorDriftPath = path.join(fixture.approvedRoot,
    "restoration-selector-drift.js");
  fs.writeFileSync(restorationSelectorDriftPath, fixture.bytes.selectorBefore);
  assert.throws(() => createProductionCapabilityAdapters({
    ...fixture.construction,
    restorationMaterial: { ...fixture.construction.restorationMaterial,
      selector: { ...fixture.construction.restorationMaterial.selector,
        path: restorationSelectorDriftPath } },
  }), /restoration_selector_binding_invalid/);

  const dotAlias = `${fixture.approvedRoot}${path.sep}.${path.sep}${path.basename(
    fixture.usPath)}`;
  assert.throws(() => createProductionCapabilityAdapters({
    ...fixture.construction,
    targetPaths: fixture.construction.targetPaths.map((entry, index) => index === 0
      ? { ...entry, path: dotAlias } : entry),
    restorationMaterial: { ...fixture.construction.restorationMaterial,
      targets: fixture.construction.restorationMaterial.targets.map((entry, index) =>
        index === 0 ? { ...entry, path: dotAlias } : entry) },
  }), /approved_root_escape_or_alias|actual_path_canonicalization_or_root_invalid/);
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
  const payload = selectorPayload(fixture);
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
  const payload = claimPayload();
  const acquired = await store.acquireEnvelopeClaim(payload, context(fixture, "claim"));
  assert.equal(acquired.outcome, "acquired");
  assert.deepEqual(await store.acquireEnvelopeClaim(payload, context(fixture, "claim")),
    { outcome: "already_consumed", claimHash: null });
  const restarted = createProductionCapabilityAdapters(fixture.construction);
  assert.deepEqual(await restarted.singleUseCutoverEnvelopeStore.reconcileOperationOutcome(
    { operationId: "claim", idempotencyKey: context(fixture, "claim").idempotencyKey },
    context(fixture, "claim")), { outcome: "committed", resourceHash: acquired.claimHash });
  const terminal = await store.terminalizeEnvelopeClaim(terminalPayload(acquired.claimHash),
    context(fixture, "terminalize"));
  assert.equal(terminal.outcome, "terminalized");
  await assert.rejects(store.terminalizeEnvelopeClaim(terminalPayload(acquired.claimHash),
    context(fixture, "terminalize")),
  /claim_terminalization_invalid/);
});

test("receipt persistence is exclusive, sanitized, and read-only reconciled", async (t) => {
  const fixture = makeFixture(t);
  const receipt = receiptPayload();
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

test("prepared journal reconciles exact preimage, postimage, and mismatch", async (t) => {
  const preimage = makeFixture(t);
  preimage.fault.stage = "csv_us_after_prepare_before_resource";
  await assert.rejects(preimage.adapters.atomicProductionCsvReplacer
    .replaceProductionCsvAtomically(csvPayload("US", preimage.bytes.us, 1),
      context(preimage, "replace-us")), /synthetic_crash/);
  preimage.fault.stage = null;
  assert.deepEqual(await createProductionCapabilityAdapters(preimage.construction)
    .atomicProductionCsvReplacer.reconcileOperationOutcome(
      { operationId: "replace-us", idempotencyKey: context(preimage, "replace-us").idempotencyKey },
      context(preimage, "replace-us")), { outcome: "not_committed", resourceHash: null });

  const postimage = makeFixture(t);
  postimage.fault.stage = "csv_us_after_resource_before_journal_commit";
  await assert.rejects(postimage.adapters.atomicProductionCsvReplacer
    .replaceProductionCsvAtomically(csvPayload("US", postimage.bytes.us, 1),
      context(postimage, "replace-us")), /synthetic_crash/);
  postimage.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(postimage.construction)
    .atomicProductionCsvReplacer.reconcileOperationOutcome(
      { operationId: "replace-us", idempotencyKey: context(postimage, "replace-us").idempotencyKey },
      context(postimage, "replace-us"))).outcome, "committed");

  const mismatch = makeFixture(t);
  mismatch.fault.stage = "csv_us_after_prepare_before_resource";
  await assert.rejects(mismatch.adapters.atomicProductionCsvReplacer
    .replaceProductionCsvAtomically(csvPayload("US", mismatch.bytes.us, 1),
      context(mismatch, "replace-us")), /synthetic_crash/);
  fs.writeFileSync(mismatch.usPath, Buffer.from("partial"));
  mismatch.fault.stage = null;
  assert.deepEqual(await createProductionCapabilityAdapters(mismatch.construction)
    .atomicProductionCsvReplacer.reconcileOperationOutcome(
      { operationId: "replace-us", idempotencyKey: context(mismatch, "replace-us").idempotencyKey },
      context(mismatch, "replace-us")), { outcome: "ambiguous", resourceHash: null });
});

test("claim created before journal commit crash reconciles committed", async (t) => {
  const fixture = makeFixture(t);
  fixture.fault.stage = "claim_after_resource_before_journal_commit";
  await assert.rejects(fixture.adapters.singleUseCutoverEnvelopeStore.acquireEnvelopeClaim(
    claimPayload(), context(fixture, "claim")), /synthetic_crash/);
  fixture.fault.stage = null;
  const result = await createProductionCapabilityAdapters(fixture.construction)
    .singleUseCutoverEnvelopeStore.reconcileOperationOutcome(
      { operationId: "claim", idempotencyKey: context(fixture, "claim").idempotencyKey },
      context(fixture, "claim"));
  assert.equal(result.outcome, "committed");
});

test("selector rename and receipt persistence crashes reconcile committed", async (t) => {
  const selector = makeFixture(t);
  selector.fault.stage = "selector_after_resource_before_journal_commit";
  await assert.rejects(selector.adapters.selectorMutationCoordinator.mutateSelectorExactlyOnce(
    selectorPayload(selector), context(selector, "selector")), /synthetic_crash/);
  selector.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(selector.construction)
    .selectorMutationCoordinator.reconcileOperationOutcome(
      { operationId: "selector", idempotencyKey: context(selector, "selector").idempotencyKey },
      context(selector, "selector"))).outcome, "committed");

  const receipt = makeFixture(t);
  receipt.fault.stage = "receipt_after_resource_before_journal_commit";
  await assert.rejects(receipt.adapters.cutoverReceiptStore.persistCutoverReceipt(
    receiptPayload(), context(receipt, "receipt")), /synthetic_crash/);
  receipt.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(receipt.construction)
    .cutoverReceiptStore.reconcileOperationOutcome(
      { operationId: "receipt", idempotencyKey: context(receipt, "receipt").idempotencyKey },
      context(receipt, "receipt"))).outcome, "committed");
});

test("terminalization resource update crash reconciles committed", async (t) => {
  const fixture = makeFixture(t);
  const acquired = await fixture.adapters.singleUseCutoverEnvelopeStore.acquireEnvelopeClaim(
    claimPayload(), context(fixture, "claim"));
  fixture.fault.stage = "terminalization_after_resource_before_journal_commit";
  await assert.rejects(fixture.adapters.singleUseCutoverEnvelopeStore.terminalizeEnvelopeClaim(
    terminalPayload(acquired.claimHash), context(fixture, "terminalize")), /synthetic_crash/);
  fixture.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(fixture.construction)
    .singleUseCutoverEnvelopeStore.reconcileOperationOutcome(
      { operationId: "terminalize",
        idempotencyKey: context(fixture, "terminalize").idempotencyKey },
      context(fixture, "terminalize"))).outcome, "committed");
});

test("concurrent terminalization has exact-one successful transition", async (t) => {
  const fixture = makeFixture(t);
  const acquired = await fixture.adapters.singleUseCutoverEnvelopeStore.acquireEnvelopeClaim(
    claimPayload(), context(fixture, "claim"));
  const payload = terminalPayload(acquired.claimHash);
  const outcomes = await Promise.allSettled([
    fixture.adapters.singleUseCutoverEnvelopeStore.terminalizeEnvelopeClaim(
      payload, context(fixture, "terminalize")),
    fixture.adapters.singleUseCutoverEnvelopeStore.terminalizeEnvelopeClaim(
      payload, context(fixture, "terminalize")),
  ]);
  assert.equal(outcomes.filter((entry) => entry.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((entry) => entry.status === "rejected").length, 1);
});

test("rollback middle crash is ambiguous and completed restoration before journal commit reconciles", async (t) => {
  const middle = makeFixture(t);
  fs.writeFileSync(middle.usPath, middle.bytes.us);
  fs.writeFileSync(middle.krPath, middle.bytes.kr);
  fs.writeFileSync(middle.selectorPath, middle.bytes.selectorAfter);
  middle.fault.stage = "rollback_after_us_restore";
  await assert.rejects(middle.adapters.rollbackCoordinator.restoreBoundPreimages(
    rollbackPayload(middle), context(middle, "rollback")), /synthetic_crash/);
  middle.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(middle.construction)
    .rollbackCoordinator.reconcileOperationOutcome(
      { operationId: "rollback", idempotencyKey: context(middle, "rollback").idempotencyKey },
      context(middle, "rollback"))).outcome, "ambiguous");

  const completed = makeFixture(t);
  fs.writeFileSync(completed.usPath, completed.bytes.us);
  fs.writeFileSync(completed.krPath, completed.bytes.kr);
  fs.writeFileSync(completed.selectorPath, completed.bytes.selectorAfter);
  completed.fault.stage = "rollback_after_resource_before_journal_commit";
  await assert.rejects(completed.adapters.rollbackCoordinator.restoreBoundPreimages(
    rollbackPayload(completed), context(completed, "rollback")), /synthetic_crash/);
  completed.fault.stage = null;
  assert.equal((await createProductionCapabilityAdapters(completed.construction)
    .rollbackCoordinator.reconcileOperationOutcome(
      { operationId: "rollback", idempotencyKey: context(completed, "rollback").idempotencyKey },
      context(completed, "rollback"))).outcome, "committed");
});

test("actual CSV bytes derive and enforce header, schema, and dataset identities", async (t) => {
  const wrongHeader = makeFixture(t);
  const bytes = Buffer.from("wrong,ticker,value\nUS,AAA,1\n");
  const payload = { ...csvPayload("US", bytes, 1),
    expectedContentSha256: wrongHeader.construction.targetPaths[0].expectedContentSha256,
    expectedByteCount: wrongHeader.construction.targetPaths[0].expectedByteCount };
  await assert.rejects(wrongHeader.adapters.atomicProductionCsvReplacer
    .replaceProductionCsvAtomically(payload, context(wrongHeader, "replace-us")),
  /csv_header_contract_mismatch/);

  const forgedSchema = makeFixture(t);
  forgedSchema.construction.targetPaths[0].schemaIdentitySha256 = sha256("forged-schema");
  assert.throws(() => createProductionCapabilityAdapters(forgedSchema.construction),
    /target_paths_invalid/);
  const forgedDataset = makeFixture(t);
  forgedDataset.construction.targetPaths[0].expectedDatasetIdentityHash =
    sha256("forged-dataset");
  assert.throws(() => createProductionCapabilityAdapters(forgedDataset.construction),
    /target_paths_invalid/);

  const valid = makeFixture(t);
  await valid.adapters.atomicProductionCsvReplacer.replaceProductionCsvAtomically(
    csvPayload("US", valid.bytes.us, 1), context(valid, "replace-us"));
  const expected = csvIdentity("US", valid.bytes.us);
  assert.deepEqual(await valid.adapters.cutoverPreimageReader.readProductionCsvIdentity(
    { market: "US", targetPath: "synthetic/us.csv", expectedIdentity: expected },
    context(valid, "verify-us")), expected);
});

test("adapter manifest is deterministic, frozen, sanitized, and zero-count", () => {
  const input = { adapterSourceIdentities: [
    { moduleRole: "production_capability_adapters",
      sourcePath: "scripts/lib/metrics-cutover-production-capability-adapters.cjs",
      sourcePathIdentityHash: sha256("adapter-path"),
      sourceGitBlobSha: "1".repeat(40),
      sourceContentSha256: sha256("adapter-content") },
    { moduleRole: "current_main_provenance_bridge",
      sourcePath: "scripts/lib/metrics-cutover-current-main-provenance-bridge.cjs",
      sourcePathIdentityHash: sha256("bridge-path"),
      sourceGitBlobSha: "2".repeat(40),
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
