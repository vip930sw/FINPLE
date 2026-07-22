"use strict";

const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepZ = require("./lib/metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./lib/metrics-cutover-production-runtime-ceremony.cjs");
const stepZB = require("./lib/metrics-cutover-production-explicit-invocation-package.cjs");
const adapters = require("./lib/metrics-cutover-production-capability-adapters.cjs");
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
function sealedManifestWithDirectoryFsync(fixture, directoryFsync) {
  const manifest = fixture.readOnlyBuilderInput.adapterManifest;
  return adapters.buildProductionAdapterManifest({
    adapterSourceIdentities: manifest.adapterSourceIdentities,
    approvedRootPolicyIdentity: manifest.approvedRootPolicyIdentity,
    platformCapabilities: { ...manifest.platformCapabilities, directoryFsync },
    claimStateSchemaIdentity: manifest.claimStateSchemaIdentity,
    receiptStateSchemaIdentity: manifest.receiptStateSchemaIdentity,
    rollbackStateSchemaIdentity: manifest.rollbackStateSchemaIdentity,
  });
}
function filesystemWithDirectoryFsync(probeRoot, supported) {
  const sentinel = 0x7fffff;
  return { ...fs,
    openSync(value, flags, ...rest) {
      if (value === probeRoot && flags === "r") return sentinel;
      return fs.openSync(value, flags, ...rest);
    },
    fsyncSync(handle) {
      if (handle === sentinel) {
        if (supported) return undefined;
        throw new Error("synthetic_directory_fsync_unsupported");
      }
      return fs.fsyncSync(handle);
    },
    closeSync(handle) {
      if (handle === sentinel) return undefined;
      return fs.closeSync(handle);
    },
  };
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

test("runtime bundle and approved no-op sources require exact Git tree/blob provenance", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const runtimeSources = fixture.readOnlyBuilderInput.provenancePacket
    .observedSourceIdentities.filter((entry) => entry.role.startsWith("production_"));
  assert.ok(runtimeSources.some((entry) => entry.role === "production_runtime_bundle"));
  assert.ok(runtimeSources.some((entry) =>
    entry.role === "production_no_op_fault_injector"));
  const packet = fixtureSupport.clone(fixture.readOnlyBuilderInput.provenancePacket);
  packet.reviewedSourceIdentities = packet.reviewedSourceIdentities.filter(
    (entry) => entry.role !== "production_runtime_bundle");
  packet.observedSourceIdentities = packet.observedSourceIdentities.filter(
    (entry) => entry.role !== "production_runtime_bundle");
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { provenancePacket: packet })
  })).status, "blocked");
  const runtimeBlob = runtimeSources.find((entry) =>
    entry.role === "production_runtime_bundle").sourceGitBlobSha;
  const originalGit = fixture.readOnlyBuilderInput.gitExecFileSync;
  const gitExecFileSync = (...args) => {
    if (args[1][2] === "cat-file" && args[1][4] === runtimeBlob) {
      return Buffer.from("forged runtime source\n");
    }
    return originalGit(...args);
  };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { gitExecFileSync })
  })).status, "blocked");
  const valid = subject.evaluateProductionRuntimeBundle(fixture.packet);
  assert.equal(typeof valid.productionConfigurationManifest.runtimeSourceIdentityHash,
    "string");
  assert.equal(valid.productionInvocationBundle.runtimeSourceProvenanceIdentity
    .runtimeSourceIdentityHash,
  valid.productionConfigurationManifest.runtimeSourceIdentityHash);
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

test("historical Step Z target and selector paths bind directly before manifest creation", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const differentTargets = fixture.targetPaths.map((entry, index) => index === 0
    ? { ...entry, publicPath: `${entry.publicPath}.different`,
      approvedPathIdentityHash: subject.pathIdentity(entry.market,
        `${entry.publicPath}.different`) } : entry);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { targetPaths: differentTargets })
  })).status, "blocked");
  const selector = { ...fixture.readOnlyBuilderInput.selectorPath,
    publicPath: `${fixture.readOnlyBuilderInput.selectorPath.publicPath}.different` };
  selector.pathIdentityHash = subject.pathIdentity("selector", selector.publicPath);
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { selectorPath: selector })
  })).status, "blocked");
  const postimage = Buffer.from(fixture.readOnlyBuilderInput.selectorExpectedPostimageBytes);
  postimage[postimage.length - 1] ^= 1;
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { selectorExpectedPostimageBytes: postimage })
  })).status, "blocked");
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
  const approved = fixture.readOnlyBuilderInput.noOpProductionFaultInjector;
  for (const noOpProductionFaultInjector of [
    { descriptor: approved.descriptor, hit() {} },
    { descriptor: { ...approved.descriptor }, hit() { throw new Error("forbidden"); } },
  ]) assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture,
      { noOpProductionFaultInjector }) })).status, "blocked");
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: { ...fixture.readOnlyBuilderInput,
      platformAttestation: { atomicSameDirectoryRename: true, exclusiveCreate: true,
        fileFsync: true, directoryFsync: true, attestationHash: subject.sha256("forged") }
    } })).status, "blocked");
});

test("isolated platform probe performs exclusive create fsync rename content and cleanup", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const valid = subject.evaluateProductionRuntimeBundle(fixture.packet);
  assert.equal(valid.status, "production_runtime_invocation_bundle_verified");
  assert.equal(fs.readdirSync(fixture.platformProbeRoot)
    .some((name) => name.startsWith(".finple-zb-r-probe-")), false);
  const failures = [
    { openSync(value, flags) {
      if (String(value).includes(".finple-zb-r-probe-") && flags === "wx") {
        const error = new Error("synthetic exclusive failure"); error.code = "EACCES";
        throw error;
      }
      return fs.openSync(value, flags);
    } },
    { fsyncSync() { throw new Error("synthetic fsync failure"); } },
    { renameSync() { throw new Error("synthetic rename failure"); } },
    { readFileSync(value, ...args) {
      if (String(value).endsWith(".renamed")) return Buffer.from("mismatch");
      return fs.readFileSync(value, ...args);
    } },
  ];
  for (const overrides of failures) {
    const filesystem = { ...fs, ...overrides };
    assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      readOnlyBuilderInput: builderInputWith(fixture, { filesystem })
    })).status, "blocked");
    assert.equal(fs.readdirSync(fixture.platformProbeRoot)
      .some((name) => name.startsWith(".finple-zb-r-probe-")), false);
  }
  const platformProbe = { probeRoot: fixture.approvedRoot,
    probeRootPolicyIdentity: subject.rootPolicyIdentity(
      "isolated_platform_probe_root", fs.realpathSync(fixture.approvedRoot)) };
  assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
    readOnlyBuilderInput: builderInputWith(fixture, { platformProbe })
  })).status, "blocked");
});

test("actual platform probe capabilities must exactly equal the sealed adapter manifest", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const valid = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const actual = Object.fromEntries(adapters.PLATFORM_FIELDS.map((field) =>
    [field, valid.productionConfigurationManifest.platformAttestation[field]]));
  assert.deepEqual(actual, fixture.readOnlyBuilderInput.adapterManifest
    .platformCapabilities);

  for (const [manifestDirectoryFsync, actualDirectoryFsync] of [
    [true, false], [false, true],
  ]) {
    const adapterManifest = sealedManifestWithDirectoryFsync(
      fixture, manifestDirectoryFsync);
    const filesystem = filesystemWithDirectoryFsync(
      fixture.platformProbeRoot, actualDirectoryFsync);
    const result = subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      readOnlyBuilderInput: builderInputWith(fixture,
        { adapterManifest, filesystem })
    }));
    assert.equal(result.status, "blocked");
    assert.deepEqual(result.blockingIssues,
      ["adapter_manifest_platform_capabilities_mismatch"]);
    assert.equal(result.productionAuthorizationVerified, false);
    assert.equal(result.productionInvocationBundleId, undefined);
  }
});

test("restoration identity is derived from exact absent targets and selector preimage", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const valid = subject.evaluateProductionRuntimeBundle(fixture.packet);
  assert.equal(typeof valid.productionConfigurationManifest.restorationMaterialIdentity
    .restorationMaterialIdentityHash, "string");
  const base = fixture.readOnlyBuilderInput.restorationMaterial;
  const cases = [
    { ...base, forgedRestorationHash: subject.sha256("forged") },
    { ...base, selector: { ...base.selector,
      contentBase64: Buffer.from("selector drift").toString("base64") } },
    { ...base, selector: { ...base.selector, path: fixture.targetPaths[0].path } },
    { ...base, targets: base.targets.map((entry, index) => index === 0
      ? { ...entry, exists: true } : entry) },
    { ...base, targets: base.targets.map((entry, index) => index === 0
      ? { ...entry, path: fixture.selectorPath } : entry) },
  ];
  for (const restorationMaterial of cases) {
    assert.equal(subject.evaluateProductionRuntimeBundle(packetWith(fixture, {
      readOnlyBuilderInput: builderInputWith(fixture, { restorationMaterial })
    })).status, "blocked");
  }
});

test("later boundary rejects a self-resealed forged bundle and later expiry", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const result = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const forged = resealBundle(result.productionInvocationBundle, {
    operatorSignatureDigest: subject.sha256("forged-signature-digest") });
  const blocked = subject.validateLaterExecutionBoundary(fixtureSupport.laterInput(
    result, fixture, { productionInvocationBundle: forged }));
  assert.deepEqual(blocked.blockingIssues, ["phase_a_bundle_canonical_mismatch"]);
  const expired = subject.validateLaterExecutionBoundary(fixtureSupport.laterInput(
    result, fixture, { currentEvaluationClockInstant:
      fixture.authorization.effectiveExpiresAt }));
  assert.equal(expired.status, "blocked");
});

test("Phase A requires every explicit dependency and revalidates private material", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const result = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const phaseAInput = fixtureSupport.laterInput(result, fixture);
  const missing = { ...phaseAInput }; delete missing.filesystem;
  assert.deepEqual(subject.validatePhaseAPreConstructionBoundary(missing).blockingIssues,
    ["phase_a_fields_invalid"]);
  const privateMaterial = { ...phaseAInput.privateProductionConfigurationMaterial,
    selectorExpectedPostimageBytes: Buffer.from("forged selector postimage\n") };
  assert.equal(subject.validatePhaseAPreConstructionBoundary({ ...phaseAInput,
    privateProductionConfigurationMaterial: privateMaterial }).status, "blocked");
  const immutable = { ...phaseAInput.stepZImmutableExecutionMaterial,
    stepZExecutionMaterialDescriptor: { ...phaseAInput.stepZImmutableExecutionMaterial
      .stepZExecutionMaterialDescriptor,
    stepZExecutionMaterialDescriptorHash: subject.sha256("forged") } };
  assert.deepEqual(subject.validatePhaseAPreConstructionBoundary({ ...phaseAInput,
    stepZImmutableExecutionMaterial: immutable }).blockingIssues,
  ["phase_a_step_z_immutable_material_mismatch"]);
});

test("Phase B binds the complete Step Z packet and seven identical capability objects", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const bundle = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const phaseA = subject.validatePhaseAPreConstructionBoundary(
    fixtureSupport.laterInput(bundle, fixture));
  assert.equal(phaseA.phaseAPreConstructionValidated, true);
  const validInput = fixtureSupport.phaseBInput(phaseA, fixture);
  const aliased = { ...validInput,
    singleUseCutoverEnvelopeStore: {
      ...validInput.singleUseCutoverEnvelopeStore } };
  assert.ok(subject.validatePhaseBPostConstructionBoundary(aliased).blockingIssues
    .includes("phase_b_capability_object_identity_mismatch:singleUseCutoverEnvelopeStore"));
  const changedPacket = { ...validInput.completeStepZPacket,
    executionClockInstant: "2026-07-18T00:03:29.000Z" };
  const changed = { ...validInput, completeStepZPacket: changedPacket,
    ...Object.fromEntries(stepZ.CAPABILITY_NAMES.map((name) =>
      [name, changedPacket[name]])) };
  assert.equal(subject.validatePhaseBPostConstructionBoundary(changed).status, "blocked");
  const invalidCapability = { ...validInput.cutoverClock,
    descriptor: { ...validInput.cutoverClock.descriptor, methodNames: [] } };
  const invalidPacket = { ...validInput.completeStepZPacket,
    cutoverClock: invalidCapability };
  assert.equal(subject.validatePhaseBPostConstructionBoundary({ ...validInput,
    completeStepZPacket: invalidPacket, cutoverClock: invalidCapability }).status,
  "blocked");
});

test("Phase B accepts only one exact approved factory adapter set and binding", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const bundle = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const phaseA = subject.validatePhaseAPreConstructionBoundary(
    fixtureSupport.laterInput(bundle, fixture));
  assert.equal(phaseA.phaseAPreConstructionValidated, true);
  const baseConstruction = fixtureSupport.productionAdapterConstruction(
    phaseA, fixture);
  const baseSet = adapters.createProductionCapabilityAdapters(baseConstruction);
  const binding = adapters.getVerifiedProductionAdapterConstructionBinding(baseSet);
  assert.deepEqual(binding,
    phaseA.productionConfigurationManifest.adapterConstructionBinding);
  assert.equal(Object.isFrozen(binding), true);
  const serializedBinding = JSON.stringify(binding);
  assert.equal(serializedBinding.includes(fixture.approvedRoot), false);
  assert.equal(serializedBinding.includes(fixture.stateRootParent), false);

  const historicalPacket = fixture.readOnlyBuilderInput.stepZAPacket.stepZPacket;
  const historicalInput = { phaseAPreConstructionResult: phaseA,
    completeStepZPacket: historicalPacket,
    ...Object.fromEntries(stepZ.CAPABILITY_NAMES.map((name) =>
      [name, historicalPacket[name]])) };
  assert.ok(subject.validatePhaseBPostConstructionBoundary(historicalInput)
    .blockingIssues.includes("phase_b_adapter_factory_provenance_invalid"));

  const handCraftedSet = { ...baseSet,
    cutoverClock: { ...baseSet.cutoverClock } };
  assert.ok(subject.validatePhaseBPostConstructionBoundary(
    fixtureSupport.phaseBInput(phaseA, fixture,
      { adapterSet: handCraftedSet })).blockingIssues
    .includes("phase_b_adapter_factory_provenance_invalid"));

  const alternateStateRoot = path.join(fixture.stateRootParent, "alternate-state");
  fs.mkdirSync(alternateStateRoot);
  const secondSet = adapters.createProductionCapabilityAdapters({
    ...baseConstruction, stateRoot: alternateStateRoot });
  const mixedSet = { ...baseSet, cutoverClock: secondSet.cutoverClock };
  assert.ok(subject.validatePhaseBPostConstructionBoundary(
    fixtureSupport.phaseBInput(phaseA, fixture,
      { adapterSet: mixedSet })).blockingIssues
    .includes("phase_b_adapter_factory_provenance_invalid"));

  const changedOperationPlan = baseConstruction.operationBindings.map(
    (entry, index) => index === 0
      ? { ...entry, idempotencyKey: subject.sha256("different-operation") }
      : entry);
  const changedRestoration = { ...baseConstruction.restorationMaterial,
    selector: { ...baseConstruction.restorationMaterial.selector,
      contentBase64: Buffer.from("different restoration\n").toString("base64") } };
  const changedNoOp = { descriptor: baseConstruction.faultInjector.descriptor,
    hit() { throw new Error("must_not_be_called"); } };
  const selectorAltPath = path.join(fixture.approvedRoot, "selector-alt.js");
  fs.writeFileSync(selectorAltPath, Buffer.from(
    baseConstruction.restorationMaterial.selector.contentBase64, "base64"));
  const selectorAltPublic = `${baseConstruction.selectorPath.publicPath}.alt`;
  const changedSelectorRestoration = {
    ...baseConstruction.restorationMaterial,
    selector: { ...baseConstruction.restorationMaterial.selector,
      path: selectorAltPath, publicPath: selectorAltPublic },
  };
  const targetAltPublic = `${baseConstruction.targetPaths[0].publicPath}.alt.csv`;
  const targetAltPath = path.join(fixture.approvedRoot, "versioned-us-alt.csv");
  const changedTargets = baseConstruction.targetPaths.map((entry, index) => index === 0
    ? { ...entry, path: targetAltPath, publicPath: targetAltPublic } : entry);
  const oldReference = `./${baseConstruction.targetPaths[0]
    .publicPath.split("/").at(-1)}?raw`;
  const newReference = `./${targetAltPublic.split("/").at(-1)}?raw`;
  const changedTargetPostimage = Buffer.from(baseConstruction
    .selectorExpectedPostimageBytes.toString("utf8").replace(oldReference, newReference));
  const changedTargetRestoration = {
    ...baseConstruction.restorationMaterial,
    targets: baseConstruction.restorationMaterial.targets.map((entry, index) =>
      index === 0 ? { ...entry, path: targetAltPath, publicPath: targetAltPublic }
        : entry),
  };
  const alternateApprovedRoot = path.join(fixture.root, "alternate-approved");
  fs.mkdirSync(alternateApprovedRoot);
  const alternateRootTargets = baseConstruction.targetPaths.map((entry) => ({
    ...entry, path: path.join(alternateApprovedRoot, path.basename(entry.path)) }));
  const alternateRootSelectorPath = path.join(alternateApprovedRoot, "selector.js");
  fs.writeFileSync(alternateRootSelectorPath, Buffer.from(
    baseConstruction.restorationMaterial.selector.contentBase64, "base64"));
  const alternateRootRestoration = {
    ...baseConstruction.restorationMaterial,
    targets: baseConstruction.restorationMaterial.targets.map((entry, index) => ({
      ...entry, path: alternateRootTargets[index].path })),
    selector: { ...baseConstruction.restorationMaterial.selector,
      path: alternateRootSelectorPath },
  };
  const variantConstructions = [
    { ...baseConstruction, stateRoot: alternateStateRoot },
    { ...baseConstruction, repositoryIdentity: {
      mainSha: "f".repeat(40), headSha: "f".repeat(40), treeSha: "e".repeat(40) } },
    { ...baseConstruction, operationBindings: changedOperationPlan },
    { ...baseConstruction, restorationMaterial: changedRestoration },
    { ...baseConstruction, faultInjector: changedNoOp },
    { ...baseConstruction,
      selectorPath: { path: selectorAltPath, publicPath: selectorAltPublic },
      restorationMaterial: changedSelectorRestoration },
    { ...baseConstruction, targetPaths: changedTargets,
      selectorExpectedPostimageBytes: changedTargetPostimage,
      restorationMaterial: changedTargetRestoration },
    { ...baseConstruction, approvedRoot: alternateApprovedRoot,
      targetPaths: alternateRootTargets,
      selectorPath: { ...baseConstruction.selectorPath,
        path: alternateRootSelectorPath },
      restorationMaterial: alternateRootRestoration },
  ];
  for (const construction of variantConstructions) {
    const adapterSet = adapters.createProductionCapabilityAdapters(construction);
    const blocked = subject.validatePhaseBPostConstructionBoundary(
      fixtureSupport.phaseBInput(phaseA, fixture, { adapterSet }));
    assert.ok(blocked.blockingIssues.includes(
      "phase_b_adapter_construction_binding_mismatch"));
    assert.deepEqual(Object.values(blocked.capabilityInvocationCounts), Array(7).fill(0));
  }
});

test("valid Phase A and Phase B return frozen sanitized descriptors with zero calls", (t) => {
  const fixture = fixtureSupport.buildFixture(t);
  const result = subject.evaluateProductionRuntimeBundle(fixture.packet);
  const later = subject.validateLaterExecutionBoundary(
    fixtureSupport.laterInput(result, fixture));
  assert.equal(later.status, "production_runtime_invocation_bundle_verified");
  assert.equal(later.laterExecutionBoundaryValidated, true);
  assert.equal(later.phaseAPreConstructionValidated, true);
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
  const phaseB = subject.validatePhaseBPostConstructionBoundary(
    fixtureSupport.phaseBInput(later, fixture));
  assert.equal(phaseB.status, "production_runtime_invocation_bundle_verified");
  assert.equal(phaseB.phaseBPostConstructionValidated, true);
  assert.equal(phaseB.sanitizedCommandDescriptor.commandConstructed, true);
  assert.equal(phaseB.sanitizedCommandDescriptor.executorInvoked, false);
  assert.deepEqual(Object.values(phaseB.capabilityInvocationCounts), Array(7).fill(0));
});

test("production runtime source cannot execute, construct adapters, create state, or discover ambient inputs", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "lib/metrics-cutover-production-runtime-bundle.cjs"), "utf8");
  for (const forbidden of ["executeSingleUseProductionCutover(",
    "createProductionCapabilityAdapters(", "mkdirSync(",
    "process.cwd(", "process.env", "Date.now(", "fetch(", "child_process"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
