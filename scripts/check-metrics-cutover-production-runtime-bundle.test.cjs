"use strict";

const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepZ = require("./lib/metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./lib/metrics-cutover-production-runtime-ceremony.cjs");
const stepZB = require("./lib/metrics-cutover-production-explicit-invocation-package.cjs");
const subject = require("./lib/metrics-cutover-production-runtime-bundle.cjs");
const { runCli } = require("./check-metrics-cutover-production-runtime-bundle.cjs");
const fixtureSupport = require(
  "./test-support/metrics-cutover-production-runtime-bundle-fixture.cjs");

function packetWith(fixture, overrides = {}) {
  return { ...fixture.packet, ...overrides };
}
function builderInputWith(fixture, overrides = {}) {
  return { ...fixture.readOnlyBuilderInput, ...overrides };
}
function authForAllowlist(fixture, allowlist, privateKey, overrides = {}) {
  const entry = allowlist.entries[0];
  return fixtureSupport.resealAuthorization(fixture.authorization, {
    signerKeyId: entry.signerKeyId,
    signerSanitizedIdentityHash: entry.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: entry.publicKeyFingerprintSha256,
    environmentIdentityHash: entry.environmentIdentityHash,
    ...overrides,
  }, privateKey);
}
function resealBundle(bundle, overrides = {}) {
  const body = { ...fixtureSupport.clone(bundle), ...overrides };
  delete body.productionInvocationBundleId;
  delete body.productionInvocationBundleHash;
  const id = `step114-2x-zb-r-bundle-${subject.hashContract(
    "FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_ID\0", body)}`;
  const withId = { ...body, productionInvocationBundleId: id };
  return { ...withId, productionInvocationBundleHash: subject.hashContract(
    "FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_HASH\0", withId) };
}

test("zero input and zero-argument CLI return exact awaiting state", () => {
  assert.equal(subject.evaluateProductionRuntimeBundle().status,
    "awaiting_production_runtime_configuration_material");
  let output = "";
  assert.equal(runCli([], (value) => { output = value; }), 0);
  const parsed = JSON.parse(output);
  assert.equal(parsed.status, "awaiting_production_runtime_configuration_material");
  assert.equal(parsed.productionExecutionPerformed, false);
  assert.equal(runCli(["--execute"], () => {}), 1);
});

test("exact production runtime material seals a deterministic non-executing bundle", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const left = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const right = subject.evaluateProductionRuntimeBundle(fixture.packet);
  assert.equal(left.status, "production_runtime_invocation_bundle_verified");
  assert.deepEqual(left, right);
  assert.equal(Object.isFrozen(left), true);
  assert.equal(Object.isFrozen(left.productionInvocationBundle), true);
  assert.equal(left.productionConfigurationValidated, true);
  assert.equal(left.productionAuthorizationVerified, true);
  assert.equal(left.productionConfigurationManifest.productionCapable, true);
  assert.equal(left.productionConfigurationManifest.productionConfigurationValidated, true);
  assert.equal(left.productionConfigurationManifest
    .productionConfiguredForLaterExplicitInvocation, true);
  assert.equal(left.productionConfigurationManifest.productionExecutionPerformed, false);
  assert.deepEqual(Object.values(left.capabilityInvocationCounts), Array(7).fill(0));
  assert.equal(left.adapterConstructionCount, 0);
  assert.equal(fs.existsSync(fixture.readOnlyBuilderInput.futureStateRootPath), false);
  const serialized = JSON.stringify(left);
  for (const forbidden of [fixture.approvedRoot, fixture.stateRootParent,
    "signatureBase64", "candidateContents", "selectorExpectedPostimageBytes",
    "publicKeyPem"]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("historical Step Z, ZA, and synthetic-only ZB contracts remain unchanged", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  assert.equal(stepZ.MERGED_MAIN_SHA, "c9dec6491643c03d2b7a14c0c91986a1c88351e7");
  assert.equal(stepZA.MERGED_MAIN_SHA, "6fee85ba9e676336b4fa458880b15d9c8918795a");
  assert.equal(stepZB.MERGED_MAIN_SHA, "07117880d21adee760c145f7ae865703532c210c");
  assert.equal(fixture.historicalBuilt.packet.signedOperatorAuthorization
    .syntheticValidationOnly, true);
  const blocked = subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    signedProductionAuthorization:
      fixture.historicalBuilt.packet.signedOperatorAuthorization }));
  assert.deepEqual(blocked.blockingIssues,
    ["historical_synthetic_authorization_not_production_authority"]);
});

test("production authorization requires an authentic production-mode Ed25519 signature", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture,
    { signedProductionAuthorization: null })).status, "blocked");
  const tampered = fixtureSupport.clone(fixture.authorization);
  tampered.signatureBase64 = tampered.signatureBase64.replace(/^./, (value) =>
    value === "A" ? "B" : "A");
  const result = subject.evaluateProductionRuntimeBundle(packetWith(fixture,
    { signedProductionAuthorization: tampered }));
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("authorization_signature_invalid"));
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.throws(() => subject.buildProductionOperatorAllowlist(
    rsa.publicKey.export({ type: "spki", format: "pem" }),
    fixture.configurationManifest.environmentIdentityHash), /not_ed25519/);
  const malformedTime = { ...fixture.authorization, expiresAt: "not-an-instant" };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    signedProductionAuthorization: malformedTime })).status, "blocked");
});

test("signer separation rejects key ID, identity, and actual fingerprint collisions", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const upstream = stepZB.buildUpstreamSignerIdentities(
    fixture.readOnlyBuilderInput.stepZAPacket);
  for (const dimension of ["key", "identity"]) {
    const override = dimension === "key" ? { signerKeyId: upstream[0].keyId } :
      { signerSanitizedIdentityHash: upstream[0].identityHash };
    const allowlist = subject.buildProductionOperatorAllowlist(
      fixtureSupport.productionPem(), fixture.configurationManifest.environmentIdentityHash,
      { entry: { validFrom: "2026-07-18T00:03:28.000Z",
        validUntil: "2026-07-18T00:03:30.000Z", ...override } });
    const authorization = authForAllowlist(fixture, allowlist,
      fixture.productionKeys.privateKey);
    const result = subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      productionOperatorAllowlist: allowlist,
      signedProductionAuthorization: authorization }));
    assert.ok(result.blockingIssues.includes(
      "production_operator_signer_upstream_separation_failed"), dimension);
  }
  const historicalKeys = fixture.historicalBuilt.operatorKeys;
  const historicalPem = historicalKeys.publicKey.export({ type: "spki", format: "pem" });
  const allowlist = subject.buildProductionOperatorAllowlist(historicalPem,
    fixture.configurationManifest.environmentIdentityHash, { entry: {
      signerKeyId: "production-distinct-historical-fingerprint-key",
      signerSanitizedIdentityHash: subject.sha256("distinct-production-identity"),
      validFrom: "2026-07-18T00:03:28.000Z",
      validUntil: "2026-07-18T00:03:30.000Z" } });
  const authorization = authForAllowlist(fixture, allowlist, historicalKeys.privateKey);
  const result = subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    productionOperatorAllowlist: allowlist,
    signedProductionAuthorization: authorization }));
  assert.ok(result.blockingIssues.includes(
    "production_operator_signer_upstream_separation_failed"));
});

test("allowlist is exact, active, non-wildcard, non-revoked, and environment-bound", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  for (const entryOverride of [{ revoked: true }, { allowedScope: "*" },
    { validFrom: "2026-07-18T00:03:30.000Z" },
    { environmentIdentityHash: subject.sha256("other-environment") }]) {
    const allowlist = subject.buildProductionOperatorAllowlist(
      fixtureSupport.productionPem(), fixture.configurationManifest.environmentIdentityHash,
      { entry: { validFrom: "2026-07-18T00:03:28.000Z",
        validUntil: "2026-07-18T00:03:30.000Z", ...entryOverride } });
    const authorization = authForAllowlist(fixture, allowlist,
      fixture.productionKeys.privateKey);
    assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      productionOperatorAllowlist: allowlist,
      signedProductionAuthorization: authorization })).status, "blocked");
  }
  const duplicate = fixtureSupport.clone(fixture.allowlist);
  duplicate.entries.push(fixtureSupport.clone(duplicate.entries[0]));
  const resealed = fixtureSupport.resealAllowlist(duplicate);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture,
    { productionOperatorAllowlist: resealed })).status, "blocked");
});

test("nonce replay, upstream collision, expiry equality, and maximum lifetime fail closed", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const replay = subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    priorAuthorizationNonceHashes: [fixture.authorization.authorizationNonceHash] }));
  assert.ok(replay.blockingIssues.includes("authorization_nonce_replay_or_upstream_collision"));
  const collisionAuthorization = fixtureSupport.resealAuthorization(fixture.authorization, {
    authorizationNonceHash:
      fixture.historicalBuilt.packet.signedOperatorAuthorization.authorizationNonceHash });
  assert.ok(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    signedProductionAuthorization: collisionAuthorization })).blockingIssues.includes(
    "authorization_nonce_replay_or_upstream_collision"));
  const initial = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const expired = subject.validateLaterExecutionBoundary(fixtureSupport.laterInput(
    initial, fixture, { currentEvaluationClockInstant: fixture.authorization.effectiveExpiresAt }));
  assert.ok(expired.blockingIssues.includes("authorization_chronology_or_expiry_invalid"));
  const long = fixtureSupport.resealAuthorization(fixture.authorization, {
    expiresAt: "2026-07-18T00:08:30.000Z" });
  assert.ok(subject.evaluateProductionRuntimeBundle(packetWith(fixture,
    { signedProductionAuthorization: long })).blockingIssues.includes(
    "authorization_chronology_or_expiry_invalid"));
});

test("provenance bridge and adapter manifest drift are rejected before authorization", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const provenanceResult = fixtureSupport.clone(
    fixture.readOnlyBuilderInput.provenanceResult);
  provenanceResult.provenanceBridge.provenanceBridgeHash = subject.sha256("drift");
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { provenanceResult }) })).status,
  "blocked");
  const adapterManifest = fixtureSupport.clone(fixture.readOnlyBuilderInput.adapterManifest);
  adapterManifest.adapterManifestHash = subject.sha256("drift");
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { adapterManifest }) })).status,
  "blocked");
});

test("predecessor drift and an existing versioned target fail closed", (t) => {
  const drift = fixtureSupport.buildFixture(t);
  fs.appendFileSync(drift.predecessorPaths[0].path, "US,DRIFT,1\n");
  assert.equal(subject.evaluateProductionRuntimeBundle(drift.packet).status, "blocked");
  const existing = fixtureSupport.buildFixture(t);
  fs.writeFileSync(existing.targetPaths[0].path, "unexpected");
  assert.ok(subject.evaluateProductionRuntimeBundle(existing.packet).blockingIssues.includes(
    "versioned_target_exists"));
});

test("root escape, path alias, and symlink traversal are rejected read-only", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const escapedTargets = fixture.targetPaths.map((entry, index) => index === 0
    ? { ...entry, path: path.join(fixture.root, "escape.csv") } : entry);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { targetPaths: escapedTargets })
  })).status, "blocked");
  const aliasedTargets = fixture.targetPaths.map((entry, index) => index === 0
    ? { ...entry, path: fixture.predecessorPaths[0].path } : entry);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { targetPaths: aliasedTargets })
  })).status, "blocked");
  const wrappedFilesystem = {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    realpathSync: fs.realpathSync,
    lstatSync(value) {
      if (value === fixture.predecessorPaths[0].path) {
        return { isSymbolicLink: () => true, isFile: () => true };
      }
      return fs.lstatSync(value);
    },
  };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { filesystem: wrappedFilesystem })
  })).status, "blocked");
});

test("actual candidate header, schema, content, dataset, row, and byte identities are exact", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const malformedBytes = Buffer.from("wrong,header\nUS,AAA\n");
  const malformedContents = fixture.readOnlyBuilderInput.candidateContents.map(
    (entry, index) => index === 0 ? { market: entry.market, bytes: malformedBytes } : entry);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { candidateContents: malformedContents }) })).status, "blocked");
  for (const [field, value] of [["schemaIdentitySha256", subject.sha256("schema")],
    ["expectedContentSha256", subject.sha256("content")],
    ["expectedDatasetIdentityHash", subject.sha256("dataset")],
    ["expectedRowCount", 999], ["expectedByteCount", 999]]) {
    const targets = fixture.targetPaths.map((entry, index) => index === 0
      ? { ...entry, [field]: value } : entry);
    assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      readOnlyBuilderInput: builderInputWith(fixture, { targetPaths: targets })
    })).status, "blocked", field);
  }
});

test("selector preimage and postimage reference constraints are exact", (t) => {
  const preimage = fixtureSupport.buildFixture(t);
  fs.appendFileSync(preimage.selectorPath, "// drift\n");
  assert.equal(subject.evaluateProductionRuntimeBundle(preimage.packet).status, "blocked");
  const base = fixtureSupport.buildFixture(t);
  const paths = base.targetPaths.map((entry) => entry.publicPath);
  const predecessor = base.predecessorPaths[0].publicPath;
  for (const bytes of [Buffer.from(`export const x = [${JSON.stringify(paths[0])}];\n`),
    Buffer.from(`export const x = [${JSON.stringify(paths[0])}, ${JSON.stringify(paths[0])}, ${JSON.stringify(paths[1])}];\n`),
    Buffer.from(`export const x = [${JSON.stringify(paths[0])}, ${JSON.stringify(paths[1])}, ${JSON.stringify(predecessor)}];\n`)]) {
    assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(base, {
      readOnlyBuilderInput: builderInputWith(base,
        { selectorExpectedPostimageBytes: bytes }) })).status, "blocked");
  }
});

test("no-op fault injector and isolated platform attestation are mandatory", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const noOp = { ...fixture.readOnlyBuilderInput.noOpFaultInjectorContract,
    mode: "throw_on_hit" };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { noOpFaultInjectorContract: noOp }) })).status, "blocked");
  const platform = { ...fixture.readOnlyBuilderInput.platformAttestation,
    actualProductionPathUsed: true };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { platformAttestation: platform }) })).status, "blocked");
});

test("later boundary rejects a self-resealed forged bundle and later expiry", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const result = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const forged = resealBundle(result.productionInvocationBundle, {
    operatorSignatureDigest: subject.sha256("forged-signature-digest") });
  const blocked = subject.validateLaterExecutionBoundary(fixtureSupport.laterInput(
    result, fixture, { productionInvocationBundle: forged }));
  assert.deepEqual(blocked.blockingIssues, ["later_boundary_bundle_canonical_mismatch"]);
  const expired = subject.validateLaterExecutionBoundary(fixtureSupport.laterInput(
    result, fixture, { currentEvaluationClockInstant:
      fixture.authorization.effectiveExpiresAt }));
  assert.equal(expired.status, "blocked");
});

test("valid later boundary returns only a frozen sanitized dependency descriptor", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const result = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const later = subject.validateLaterExecutionBoundary(
    fixtureSupport.laterInput(result, fixture));
  assert.equal(later.status, "production_runtime_invocation_bundle_verified");
  assert.equal(later.laterExecutionBoundaryValidated, true);
  assert.equal(Object.isFrozen(later.sanitizedDependencyDescriptor), true);
  assert.deepEqual(later.sanitizedDependencyDescriptor.postConstructionDependencyNames,
    stepZ.CAPABILITY_NAMES);
  assert.equal(later.sanitizedDependencyDescriptor
    .validationMustPrecedeAdapterConstruction, true);
  assert.equal(later.sanitizedDependencyDescriptor.actualAdapterConstructionPerformed, false);
  assert.equal(typeof later.sanitizedDependencyDescriptor
    .stepZExecutionMaterialDescriptorHash, "string");
  const assembler = subject.buildLaterExecutionAssemblerContract();
  assert.equal(assembler.preConstructionValidationRequired, true);
  assert.deepEqual(assembler.postConstructionAssemblyDependencies,
    stepZ.CAPABILITY_NAMES);
  assert.equal(assembler.assemblerInvoked, false);
  assert.deepEqual(later.productionInvocationBundle.stepZExecutionMaterialDescriptor
    .exactInputFields, stepZ.INPUT_FIELDS);
  assert.deepEqual(Object.values(later.capabilityInvocationCounts), Array(7).fill(0));
});

test("production runtime source cannot execute, construct adapters, create state, or discover ambient inputs", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "lib/metrics-cutover-production-runtime-bundle.cjs"), "utf8");
  for (const forbidden of ["executeSingleUseProductionCutover(",
    "createProductionCapabilityAdapters(", "mkdirSync(", "writeFileSync(",
    "process.cwd(", "process.env", "Date.now(", "fetch(", "child_process"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
