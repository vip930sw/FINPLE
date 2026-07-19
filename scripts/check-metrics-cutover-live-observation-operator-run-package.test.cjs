"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const stepM = require("./lib/metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./lib/metrics-cutover-live-observation-invocation.cjs");
const stepO = require("./lib/metrics-cutover-live-observation-executor-preflight.cjs");
const stepP = require("./lib/metrics-cutover-live-observation-executor-shell.cjs");
const subject = require("./lib/metrics-cutover-live-observation-operator-run-package.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const OPERATOR_KEYS = generateKeyPairSync("ed25519");
const OTHER_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const OPERATOR_PEM = OPERATOR_KEYS.publicKey.export({ type: "spki", format: "pem" });
const OTHER_PEM = OTHER_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepPUpstream() {
  const mUpstream = stepM.buildUpstream();
  const mContext = {
    upstream: mUpstream,
    approverAllowlist: stepM.buildApproverAllowlist(APPROVER_PEM),
    verificationPolicy: stepM.buildVerificationPolicy(mUpstream),
    priorResponseNonceHashes: [],
  };
  const unsignedResponse = stepM.buildUnsignedApprovalResponse(mUpstream);
  const approvalResponse = stepM.sealSignedApprovalResponse(
    unsignedResponse,
    sign(null, stepM.buildApprovalSignaturePayload(unsignedResponse),
      APPROVER_KEYS.privateKey).toString("base64"),
  );
  const stepMPacket = {
    context: mContext,
    approvalResponse,
    evaluationClockInstant: "2026-07-18T00:03:10.000Z",
  };
  const authority = stepM.buildObservationAuthorityPackage(approvalResponse, mContext);
  const mSummary = stepM.buildSummary(approvalResponse, mContext, authority);
  const nUpstream = stepN.buildUpstream(stepMPacket, authority, mSummary);
  const nContext = {
    upstream: nUpstream,
    invokerAllowlist: stepN.buildInvokerAllowlist(INVOKER_PEM),
    verificationPolicy: stepN.buildVerificationPolicy(nUpstream),
    priorInvocationNonceHashes: [],
  };
  const unsignedInvocation = stepN.buildUnsignedInvocation(nUpstream);
  const invocation = stepN.sealSignedInvocation(
    unsignedInvocation,
    sign(null, stepN.buildInvocationSignaturePayload(unsignedInvocation),
      INVOKER_KEYS.privateKey).toString("base64"),
  );
  const stepNPacket = {
    context: nContext,
    invocation,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z",
  };
  const nReceipt = stepN.buildReceiptCandidate(invocation, nContext);
  const nSummary = stepN.buildSummary(invocation, nContext, nReceipt);
  const oUpstream = stepO.buildUpstream(stepNPacket, nReceipt, nSummary);
  const oContext = {
    upstream: oUpstream,
    consumptionPolicy: stepO.buildConsumptionPolicy(oUpstream),
    adapterCapabilityPolicy: stepO.buildAdapterCapabilityPolicy(oUpstream),
    adapterDescriptor: stepO.buildAdapterDescriptor(),
    priorClaimNonceHashes: [],
    priorInvocationNonceHashes: [],
  };
  const executorInput = stepO.buildExecutorInput(oUpstream);
  const stepOPacket = {
    context: oContext,
    executorInput,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z",
  };
  const oManifest = stepO.buildEvidenceManifest(executorInput, oContext);
  const oSummary = stepO.buildSummary(executorInput, oContext, oManifest);
  const pUpstream = clone(stepP.buildUpstream(stepOPacket, oManifest, oSummary));
  const claimStoreInterface = stepP.buildClaimStoreInterface(pUpstream);
  const adapterInterface = stepP.buildAdapterInterface(pUpstream);
  const receiptStoreInterface = stepP.buildReceiptStoreInterface(pUpstream);
  const pContext = { upstream: pUpstream, claimStoreInterface, adapterInterface,
    receiptStoreInterface };
  const evaluationClockInstant = "2026-07-18T00:03:15.000Z";
  const dependencyBundle = stepP.buildDependencyBundle(
    pUpstream, claimStoreInterface, adapterInterface, receiptStoreInterface,
    evaluationClockInstant,
  );
  const pPacket = {
    context: pContext,
    dependencyBundle,
    claimOutcome: "acquired",
    adapterOutcome: "completed",
    adapterOutput: stepP.buildSyntheticAdapterOutput(pUpstream, evaluationClockInstant),
    executionPlan: stepP.buildExecutionPlan(pUpstream, dependencyBundle),
    evaluationClockInstant,
  };
  const executionReceiptCandidate = stepP.buildReceiptCandidate(
    pUpstream, dependencyBundle, pPacket.executionPlan, adapterInterface,
    pPacket.adapterOutput,
  );
  const executorShellSummary = stepP.buildSummary(
    pUpstream, dependencyBundle, pPacket.executionPlan, executionReceiptCandidate,
  );
  return subject.buildUpstream(
    pPacket, executionReceiptCandidate, executorShellSummary,
  );
}

const BASE_UPSTREAM = buildStepPUpstream();

function fixture({ allowlistPem = OPERATOR_PEM, allowlistOverrides = {},
  authorizationOverrides = {}, signingKey = OPERATOR_KEYS.privateKey,
  manifestOverrides = {}, priorNonceHashes = [],
  evaluationClockInstant = "2026-07-18T00:03:20.000Z" } = {}) {
  const upstream = clone(BASE_UPSTREAM);
  const context = {
    upstream,
    operatorAllowlist: subject.buildOperatorAllowlist(
      allowlistPem, allowlistOverrides,
    ),
    verificationPolicy: subject.buildVerificationPolicy(upstream),
    priorOperatorAuthorizationNonceHashes: priorNonceHashes,
  };
  const adapterArtifactManifest = subject.buildAdapterArtifactManifest(
    upstream, manifestOverrides,
  );
  const unsigned = subject.buildUnsignedOperatorAuthorization(
    upstream, adapterArtifactManifest, authorizationOverrides,
  );
  const operatorAuthorization = subject.sealSignedOperatorAuthorization(
    unsigned,
    sign(null, subject.buildOperatorAuthorizationSignaturePayload(unsigned),
      signingKey).toString("base64"),
  );
  return {
    context,
    operatorAuthorization,
    adapterArtifactManifest,
    evaluationClockInstant,
  };
}

function rebuildAuthorization(packet, overrides = {}, signingKey = OPERATOR_KEYS.privateKey) {
  const unsigned = subject.buildUnsignedOperatorAuthorization(
    packet.context.upstream, packet.adapterArtifactManifest, overrides,
  );
  packet.operatorAuthorization = subject.sealSignedOperatorAuthorization(
    unsigned,
    sign(null, subject.buildOperatorAuthorizationSignaturePayload(unsigned),
      signingKey).toString("base64"),
  );
  return packet;
}

function resealManifest(packet, overrides = {}) {
  const body = Object.fromEntries(Object.entries(packet.adapterArtifactManifest)
    .filter(([key]) => !["adapterArtifactManifestId",
      "adapterArtifactManifestHash"].includes(key)));
  packet.adapterArtifactManifest = subject.sealContract({ ...body, ...overrides }, "manifest");
  return packet;
}

function expectBlocked(packet, issuePart) {
  const result = subject.evaluateSignedOperatorRunPackage(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)),
    JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  return result;
}

test("public states are exact and ordered", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_signed_live_observation_operator_authorization",
    "signed_live_observation_operator_run_package_verified",
    "blocked",
  ]);
});

test("zero input and CLI default await authorization with fixed-false authority", () => {
  const result = subject.evaluateSignedOperatorRunPackage();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  const cli = path.join(__dirname,
    "check-metrics-cutover-live-observation-operator-run-package.cjs");
  const output = execFileSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(JSON.parse(output).status, subject.PUBLIC_STATES[0]);
  const denied = spawnSync(process.execPath, [cli, "forbidden"], { encoding: "utf8" });
  assert.notEqual(denied.status, 0);
  assert.equal(JSON.parse(denied.stdout).status, "blocked");
});

test("valid synthetic operator authorization and one-run binding pass", () => {
  const packet = fixture();
  const result = subject.evaluateSignedOperatorRunPackage(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.equal(result.operatorAuthorizationVerified, true);
  assert.equal(result.threeWaySignerSeparationValidated, true);
  assert.equal(result.adapterArtifactManifestValidated, true);
  assert.equal(result.nonExecutingOneRunBindingPrepared, true);
  assert.deepEqual(result.oneRunAdapterBindingPackage.orderedOperations,
    subject.OPERATOR_OPERATIONS);
  assert.equal(result.oneRunAdapterBindingPackage.nonExecuting, true);
  for (const field of subject.FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false);
    assert.equal(result.operatorRunSummary[field], false);
    assert.equal(result.oneRunAdapterBindingPackage[field], false);
  }
});

test("complete Step P material is directly revalidated", () => {
  const packet = fixture();
  packet.context.upstream.stepPExecutorShellSummary.executorShellSummaryHash =
    "0".repeat(64);
  expectBlocked(packet, "step_p");
});

test("authorization exact keys, ID, hash, and signature encoding are enforced", () => {
  const missing = fixture(); delete missing.operatorAuthorization.operatorRole;
  expectBlocked(missing, "authorization_fields_invalid");
  const extra = fixture(); extra.operatorAuthorization.endpoint = "forbidden";
  expectBlocked(extra, "authorization_fields_invalid");
  const id = fixture(); id.operatorAuthorization.operatorAuthorizationId = "wrong";
  expectBlocked(id, "authorization_id_invalid");
  const hash = fixture(); hash.operatorAuthorization.operatorAuthorizationHash = "0".repeat(64);
  expectBlocked(hash, "authorization_hash_invalid");
  const encoding = fixture(); encoding.operatorAuthorization.signatureBase64 = "not-base64";
  expectBlocked(encoding, "signature_encoding_invalid");
});

test("wrong signature, wrong key, algorithm drift, and payload tampering block", () => {
  const wrongSignature = fixture({ signingKey: OTHER_KEYS.privateKey });
  expectBlocked(wrongSignature, "signature_invalid");
  const wrongKey = fixture({ allowlistPem: OTHER_PEM });
  expectBlocked(wrongKey, "signature_invalid");
  const algorithm = rebuildAuthorization(fixture(), { signatureAlgorithm: "RSA" });
  expectBlocked(algorithm, "signature_algorithm_invalid");
  const payload = fixture(); payload.operatorAuthorization.destinationCount = 2;
  expectBlocked(payload, "authorization_hash_invalid");
});

test("scope, role, operation order, counts, and state trace are exact", () => {
  const cases = [
    [{ operatorScope: "other" }, "scope_role_invalid"],
    [{ operatorRole: "other" }, "scope_role_invalid"],
    [{ orderedOperations: [...subject.OPERATOR_OPERATIONS].reverse() }, "operation_bounds_invalid"],
    [{ maximumClaimAcquisitionCount: 2 }, "operation_bounds_invalid"],
    [{ maximumAdapterInvocationCount: 2 }, "operation_bounds_invalid"],
    [{ destinationCount: 2 }, "operation_bounds_invalid"],
    [{ observationCount: 2 }, "operation_bounds_invalid"],
    [{ executionStateSequence: [...stepP.EXECUTION_STATE_SEQUENCE].slice(1) },
      "state_sequence_invalid"],
  ];
  for (const [overrides, issue] of cases) {
    expectBlocked(rebuildAuthorization(fixture(), overrides), issue);
  }
});

test("operator signer is separated from approver by key, identity, and fingerprint", () => {
  const byKey = fixture({
    allowlistPem: OPERATOR_PEM,
    allowlistOverrides: { entry: { operatorKeyId: "synthetic-observation-approver-key" } },
    authorizationOverrides: { operatorKeyId: "synthetic-observation-approver-key" },
  });
  expectBlocked(byKey, "operator_approver_key_id");
  const byIdentity = fixture({
    allowlistOverrides: { entry: { operatorIdentityHash: "a".repeat(64) } },
    authorizationOverrides: { operatorIdentityHash: "a".repeat(64) },
  });
  expectBlocked(byIdentity, "operator_approver_identity");
  const byFingerprint = fixture({
    allowlistPem: APPROVER_PEM,
    signingKey: APPROVER_KEYS.privateKey,
  });
  expectBlocked(byFingerprint, "operator_approver_public_key");
});

test("operator signer is separated from invoker by key, identity, and fingerprint", () => {
  const byKey = fixture({
    allowlistOverrides: { entry: { operatorKeyId: "synthetic-live-observation-invoker-key" } },
    authorizationOverrides: { operatorKeyId: "synthetic-live-observation-invoker-key" },
  });
  expectBlocked(byKey, "operator_invoker_key_id");
  const byIdentity = fixture({
    allowlistOverrides: { entry: { operatorIdentityHash: "d".repeat(64) } },
    authorizationOverrides: { operatorIdentityHash: "d".repeat(64) },
  });
  expectBlocked(byIdentity, "operator_invoker_identity");
  const byFingerprint = fixture({
    allowlistPem: INVOKER_PEM,
    signingKey: INVOKER_KEYS.privateKey,
  });
  expectBlocked(byFingerprint, "operator_invoker_public_key");
});

test("revoked, expired, future, wrong-scope, wrong-role, and wildcard allowlists block", () => {
  const cases = [
    [{ revoked: true }, "revoked"],
    [{ validUntil: "2026-07-18T00:03:30.000Z" }, "key_validity_mismatch"],
    [{ validFrom: "2026-07-18T00:03:30.000Z" }, "key_validity_mismatch"],
    [{ allowedScopes: ["other"] }, "scope_invalid"],
    [{ allowedRoles: ["other"] }, "role_invalid"],
    [{ operatorKeyId: "*" }, "key_id_invalid"],
  ];
  for (const [entry, issue] of cases) {
    const packet = fixture({ allowlistOverrides: { entry } });
    expectBlocked(packet, issue);
  }
});

test("duplicate and unrelated allowlist entries block", () => {
  const duplicate = fixture();
  const entry = clone(duplicate.context.operatorAllowlist.entries[0]);
  duplicate.context.operatorAllowlist = subject.sealContract({
    contractVersion: subject.VERSIONS.allowlist,
    entries: [entry, entry],
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
  }, "allowlist");
  expectBlocked(duplicate, "entries_invalid");
  const unrelated = fixture({
    allowlistOverrides: { entry: {
      operatorKeyId: "unrelated-operator-key",
      operatorIdentityHash: "9".repeat(64),
    } },
  });
  expectBlocked(unrelated, "operator_resolution_failed");
});

test("operator key ID, identity hash, and public key must be canonical", () => {
  expectBlocked(fixture({
    allowlistOverrides: { entry: { operatorKeyId: "bad key" } },
  }), "key_id_invalid");
  expectBlocked(fixture({
    allowlistOverrides: { entry: { operatorIdentityHash: "bad" } },
  }), "identity_hash_invalid");
  expectBlocked(fixture({ allowlistPem: "not-a-public-key" }), "public_key_invalid");
});

test("all request through operator nonces must be distinct", () => {
  const packet = fixture();
  const invocationNonce = packet.operatorAuthorization.invocationNonceHash;
  expectBlocked(rebuildAuthorization(packet, {
    operatorAuthorizationNonceHash: invocationNonce,
  }), "nonce_not_distinct");
});

test("prior nonce context rejects replay, malformed, duplicate, and unsorted hashes", () => {
  expectBlocked(fixture({ priorNonceHashes: ["7".repeat(64)] }), "nonce_replay");
  expectBlocked(fixture({ priorNonceHashes: ["bad"] }), "hash_invalid");
  expectBlocked(fixture({ priorNonceHashes: ["8".repeat(64), "8".repeat(64)] }),
    "duplicate");
  expectBlocked(fixture({ priorNonceHashes: ["9".repeat(64), "8".repeat(64)] }),
    "not_sorted");
});

test("chronology, bounded lifetime, earliest expiry, and evaluation clock are enforced", () => {
  expectBlocked(rebuildAuthorization(fixture(), {
    issuedAt: "2026-07-18T00:03:14.999Z",
  }), "issued_before_bound_material");
  expectBlocked(rebuildAuthorization(fixture(), {
    issuedAt: "2026-07-18T00:03:16.000Z",
    expiresAt: "2026-07-18T00:03:46.000Z",
  }), "expiry_window_invalid");
  expectBlocked(rebuildAuthorization(fixture(), {
    issuedAt: "2026-07-18T00:03:16.000Z",
    expiresAt: "2026-07-18T00:03:46.001Z",
  }), "lifetime_invalid");
  expectBlocked(fixture({
    evaluationClockInstant: "2026-07-18T00:03:40.000Z",
  }), "evaluation_time_invalid");
  expectBlocked(fixture({
    evaluationClockInstant: "2026-07-18T00:02:59.999Z",
  }), "evaluation_time_invalid");
});

test("adapter manifest exact keys and SHA-256 identities are enforced", () => {
  const missing = fixture(); delete missing.adapterArtifactManifest.adapterArtifactId;
  expectBlocked(missing, "manifest_fields_invalid");
  const extra = fixture(); extra.adapterArtifactManifest.modulePath = "forbidden";
  expectBlocked(extra, "manifest_fields_invalid");
  const malformed = fixture({ manifestOverrides: { adapterArtifactSha256: "bad" } });
  expectBlocked(malformed, "adapter_manifest_hash_invalid");
  const unsafeId = fixture({ manifestOverrides: { adapterArtifactId: "bad id" } });
  expectBlocked(unsafeId, "artifact_id_invalid");
});

test("adapter artifact, source-tree, and capability hash tampering block", () => {
  for (const field of ["adapterArtifactSha256", "adapterSourceTreeSha256",
    "adapterCapabilityManifestSha256"]) {
    const packet = fixture();
    packet.adapterArtifactManifest[field] = "9".repeat(64);
    expectBlocked(packet, "manifest_hash_invalid");
  }
});

test("an existing signature cannot authorize a different valid resealed manifest", () => {
  const packet = fixture();
  resealManifest(packet, {
    adapterArtifactId: "synthetic-sanitized-read-only-observer-artifact-replacement",
  });
  expectBlocked(packet, "operator_authorization_adapter_manifest_binding_mismatch");
});

test("resealed artifact, source-tree, and capability hash replacement blocks", () => {
  for (const field of ["adapterArtifactSha256", "adapterSourceTreeSha256",
    "adapterCapabilityManifestSha256"]) {
    const packet = fixture();
    resealManifest(packet, { [field]: "9".repeat(64) });
    expectBlocked(packet, `operator_authorization_adapter_manifest_binding_mismatch:${field}`);
  }
});

test("manifest ID and hash tampering block before authorization validation", () => {
  const id = fixture();
  id.adapterArtifactManifest.adapterArtifactManifestId = "wrong";
  expectBlocked(id, "manifest_id_invalid");
  const hash = fixture();
  hash.adapterArtifactManifest.adapterArtifactManifestHash = "9".repeat(64);
  expectBlocked(hash, "manifest_hash_invalid");
});

test("a changed valid manifest passes only after it is included and re-signed", () => {
  const packet = fixture();
  resealManifest(packet, {
    adapterArtifactId: "synthetic-sanitized-read-only-observer-artifact-resigned",
    adapterArtifactSha256: "9".repeat(64),
    adapterSourceTreeSha256: "8".repeat(64),
    adapterCapabilityManifestSha256: "6".repeat(64),
  });
  rebuildAuthorization(packet);
  const result = subject.evaluateSignedOperatorRunPackage(packet);
  assert.equal(result.ok, true, JSON.stringify(result.blockingIssues));
  assert.equal(result.status, "signed_live_observation_operator_run_package_verified");
  assert.equal(result.oneRunAdapterBindingPackage.adapterArtifactManifestId,
    packet.adapterArtifactManifest.adapterArtifactManifestId);
  assert.equal(result.oneRunAdapterBindingPackage.adapterArtifactManifestHash,
    packet.adapterArtifactManifest.adapterArtifactManifestHash);
});

test("adapter interface, operation, category, outputs, and counts stay bound", () => {
  const cases = [
    [{ adapterInterfaceVersion: "other" }, "adapterInterfaceVersion"],
    [{ operationOrder: ["other"] }, "operationOrder"],
    [{ observationCategoryOrder: ["other"] }, "observationCategoryOrder"],
    [{ requiredHashOutputFields: ["other"] }, "requiredHashOutputFields"],
    [{ requiredTimestampOutputFields: ["other"] }, "requiredTimestampOutputFields"],
    [{ destinationCount: 2 }, "destinationCount"],
    [{ observationCount: 2 }, "observationCount"],
  ];
  for (const [overrides, issue] of cases) {
    expectBlocked(fixture({ manifestOverrides: overrides }), issue);
  }
});

test("adapter manifest remains immutable, unloaded, unbound, and non-invocable", () => {
  const cases = [
    [{ immutableArtifactRequired: false }, "immutableArtifactRequired"],
    [{ runtimeLoaded: true }, "runtimeLoaded"],
    [{ externalAdapterBound: true }, "externalAdapterBound"],
    [{ adapterInvocable: true }, "adapterInvocable"],
    [{ providerSpecificMaterialPresent: true }, "providerSpecificMaterialPresent"],
    [{ rawMaterialPresent: true }, "rawMaterialPresent"],
  ];
  for (const [overrides, issue] of cases) {
    expectBlocked(fixture({ manifestOverrides: overrides }), issue);
  }
});

test("verification policy rejects weakening even after resealing", () => {
  const packet = fixture();
  packet.context.verificationPolicy = subject.sealContract({
    ...Object.fromEntries(Object.entries(packet.context.verificationPolicy)
      .filter(([key]) => !["operatorVerificationPolicyId",
        "operatorVerificationPolicyHash"].includes(key))),
    threeWaySignerSeparationRequired: false,
  }, "policy");
  expectBlocked(packet, "operator_policy_field_invalid");
});

test("one-run binding ties authorization, manifest, nonce, trace, and later duties", () => {
  const packet = fixture();
  const binding = subject.buildOneRunAdapterBinding(
    packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
  );
  assert.deepEqual(subject.validateOneRunAdapterBinding(
    binding, packet.operatorAuthorization, packet.context,
    packet.adapterArtifactManifest,
  ), []);
  for (const field of ["operatorAuthorizationHash", "adapterArtifactManifestHash",
    "operatorAuthorizationNonceHash", "stepPStateMachineTraceHash",
    "claimAcquisitionRequired", "environmentDisposalRequired"]) {
    const tampered = clone(binding);
    tampered[field] = typeof tampered[field] === "boolean"
      ? !tampered[field] : "0".repeat(64);
    assert.ok(subject.validateOneRunAdapterBinding(
      tampered, packet.operatorAuthorization, packet.context,
      packet.adapterArtifactManifest,
    ).some((issue) => issue.includes(field)));
  }
});

test("binding and summary reject every fixed-false authority drift", () => {
  const packet = fixture();
  const binding = subject.buildOneRunAdapterBinding(
    packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
  );
  const summary = subject.buildSummary(
    packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
    binding,
  );
  for (const field of subject.FIXED_FALSE_FIELDS) {
    const badBinding = clone(binding); badBinding[field] = true;
    assert.ok(subject.validateOneRunAdapterBinding(
      badBinding, packet.operatorAuthorization, packet.context,
      packet.adapterArtifactManifest,
    ).length > 0, field);
    const badSummary = clone(summary); badSummary[field] = true;
    assert.ok(subject.validateSummary(
      badSummary, packet.operatorAuthorization, packet.context,
      packet.adapterArtifactManifest, binding,
    ).length > 0, field);
  }
});

test("packet exact keys and exceptions fail closed", () => {
  expectBlocked({ ...fixture(), unexpected: true }, "packet_fields_invalid");
  const malformed = fixture(); malformed.context.upstream = null;
  expectBlocked(malformed, "adapter_manifest_upstream_invalid");
});

test("production source exposes only crypto verification and no ambient capability", () => {
  const sourcePath = path.join(__dirname, "lib",
    "metrics-cutover-live-observation-operator-run-package.cjs");
  const source = readFileSync(sourcePath, "utf8");
  assert.match(source, /require\("node:crypto"\)/);
  for (const forbidden of [
    /process\.env/, /node:fs/, /node:net/, /node:tls/, /node:http/,
    /node:https/, /node:dns/, /node:child_process/, /require\(["']pg["']\)/,
    /createPrivateKey/, /generateKeyPair/, /\bsign\s*:/, /adapterLoader/,
    /durableStoreClient/, /deploymentApi/,
  ]) assert.doesNotMatch(source, forbidden);
});
