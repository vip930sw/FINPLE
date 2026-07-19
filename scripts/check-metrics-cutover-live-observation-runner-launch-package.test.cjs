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
const stepQ = require("./lib/metrics-cutover-live-observation-operator-run-package.cjs");
const stepR = require("./lib/metrics-cutover-live-observation-runtime-handoff.cjs");
const subject = require("./lib/metrics-cutover-live-observation-runner-launch-package.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function withoutEnvelope(value, name) {
  const spec = subject.SPECS[name];
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    ![spec.idField, spec.hashField].includes(key)));
}
function reseal(value, name, overrides = {}) {
  return subject.sealContract({ ...withoutEnvelope(value, name), ...overrides }, name);
}

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const OPERATOR_KEYS = generateKeyPairSync("ed25519");
const OTHER_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const OPERATOR_PEM = OPERATOR_KEYS.publicKey.export({ type: "spki", format: "pem" });
const OTHER_PEM = OTHER_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepQUpstream() {
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
  const stepMPacket = { context: mContext, approvalResponse,
    evaluationClockInstant: "2026-07-18T00:03:10.000Z" };
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
  const stepNPacket = { context: nContext, invocation,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
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
  const stepOPacket = { context: oContext, executorInput,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
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
  const pReceipt = stepP.buildReceiptCandidate(
    pUpstream, dependencyBundle, pPacket.executionPlan, adapterInterface,
    pPacket.adapterOutput,
  );
  const pSummary = stepP.buildSummary(
    pUpstream, dependencyBundle, pPacket.executionPlan, pReceipt,
  );
  const qUpstream = stepQ.buildUpstream(pPacket, pReceipt, pSummary);
  const qContext = {
    upstream: qUpstream,
    operatorAllowlist: stepQ.buildOperatorAllowlist(OPERATOR_PEM),
    verificationPolicy: stepQ.buildVerificationPolicy(qUpstream),
    priorOperatorAuthorizationNonceHashes: [],
  };
  const manifest = stepQ.buildAdapterArtifactManifest(qUpstream);
  const unsigned = stepQ.buildUnsignedOperatorAuthorization(qUpstream, manifest);
  const authorization = stepQ.sealSignedOperatorAuthorization(
    unsigned,
    sign(null, stepQ.buildOperatorAuthorizationSignaturePayload(unsigned),
      OPERATOR_KEYS.privateKey).toString("base64"),
  );
  const qPacket = { context: qContext, operatorAuthorization: authorization,
    adapterArtifactManifest: manifest,
    evaluationClockInstant: "2026-07-18T00:03:20.000Z" };
  const binding = stepQ.buildOneRunAdapterBinding(authorization, qContext, manifest);
  const summary = stepQ.buildSummary(authorization, qContext, manifest, binding);
  return stepR.buildUpstream(qPacket, binding, summary);
}

const BASE_STEP_R_PACKET = stepR.buildValidSyntheticPacket(buildStepQUpstream());
function buildFixture(options = {}) {
  const upstream = clone(options.upstream || BASE_STEP_R_PACKET);
  const manifest = subject.buildRunnerImplementationManifest(
    upstream, options.manifestOverrides || {});
  const publicKeyPem = options.publicKeyPem || OPERATOR_PEM;
  const allowlist = subject.buildExecutionConfirmerAllowlist(
    upstream, publicKeyPem, options.allowlistOverrides || {});
  const policy = subject.buildExecutionConfirmationPolicy(upstream, allowlist, manifest);
  const normalized = subject.normalizeExecutionConfirmerAllowlist(allowlist, upstream);
  const fingerprint = normalized.entries[0]?.fingerprint || "0".repeat(64);
  const unsigned = subject.buildUnsignedExecutionConfirmation(
    upstream, allowlist, policy, manifest, fingerprint,
    options.confirmationOverrides || {});
  const signingKey = options.signingKey || OPERATOR_KEYS.privateKey;
  const confirmation = subject.sealSignedExecutionConfirmation(
    unsigned,
    sign(null, subject.buildExecutionConfirmationSignaturePayload(unsigned),
      signingKey).toString("base64"),
  );
  return {
    context: {
      upstream,
      executionConfirmerAllowlist: allowlist,
      verificationPolicy: policy,
      priorExecutionConfirmationNonceHashes:
        options.priorExecutionConfirmationNonceHashes || [],
    },
    executionConfirmation: confirmation,
    runnerImplementationManifest: manifest,
    evaluationClockInstant:
      options.evaluationClockInstant || "2026-07-18T00:03:22.000Z",
  };
}
function resign(packet, overrides = {}, signingKey = OPERATOR_KEYS.privateKey) {
  const normalized = subject.normalizeExecutionConfirmerAllowlist(
    packet.context.executionConfirmerAllowlist, packet.context.upstream);
  const fingerprint = normalized.entries[0]?.fingerprint || "0".repeat(64);
  const unsigned = subject.buildUnsignedExecutionConfirmation(
    packet.context.upstream, packet.context.executionConfirmerAllowlist,
    packet.context.verificationPolicy, packet.runnerImplementationManifest,
    fingerprint, overrides);
  packet.executionConfirmation = subject.sealSignedExecutionConfirmation(
    unsigned,
    sign(null, subject.buildExecutionConfirmationSignaturePayload(unsigned),
      signingKey).toString("base64"),
  );
  return packet;
}
function expectBlocked(packet, issuePart) {
  const result = subject.evaluateRunnerLaunchPackage(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  if (issuePart) assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)),
    JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  return result;
}
function nested(stepRPacket) {
  const qPacket = stepRPacket.upstream.stepQPacket;
  const pPacket = qPacket.context.upstream.stepPPacket;
  const oPacket = pPacket.context.upstream.stepOPacket;
  const nPacket = oPacket.context.upstream.stepNPacket;
  const mPacket = nPacket.context.upstream.stepMPacket;
  const lUpstream = mPacket.context.upstream;
  return { qPacket, pPacket, oPacket, nPacket, mPacket, lUpstream,
    lPacket: lUpstream.stepLPacket };
}
function withAllowlistEntry(overrides) {
  const packet = buildFixture();
  packet.context.executionConfirmerAllowlist = reseal(
    packet.context.executionConfirmerAllowlist, "allowlist", {
      entries: packet.context.executionConfirmerAllowlist.entries.map((entry) =>
        ({ ...entry, ...overrides })),
    });
  return packet;
}

test("public states are exact and zero input plus CLI default await", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_signed_live_observation_execution_confirmation",
    "signed_live_observation_runner_launch_package_verified",
    "blocked",
  ]);
  const idle = subject.evaluateRunnerLaunchPackage();
  assert.equal(idle.ok, false);
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(idle[field], false);
  const cli = JSON.parse(execFileSync(process.execPath, [
    path.join(__dirname, "check-metrics-cutover-live-observation-runner-launch-package.cjs"),
  ], { encoding: "utf8" }));
  assert.equal(cli.status, subject.PUBLIC_STATES[0]);
  const badCli = spawnSync(process.execPath, [
    path.join(__dirname, "check-metrics-cutover-live-observation-runner-launch-package.cjs"),
    "forbidden",
  ], { encoding: "utf8" });
  assert.equal(badCli.status, 2);
  assert.equal(JSON.parse(badCli.stdout).status, "blocked");
});

test("valid synthetic confirmation and all six contracts pass", () => {
  const packet = buildFixture();
  assert.deepEqual(subject.validateDirectStepRPackage(packet.context.upstream), []);
  assert.deepEqual(subject.validateRunnerImplementationManifest(
    packet.runnerImplementationManifest, packet.context.upstream), []);
  assert.deepEqual(subject.normalizeExecutionConfirmerAllowlist(
    packet.context.executionConfirmerAllowlist, packet.context.upstream).issues, []);
  assert.deepEqual(subject.validateExecutionConfirmationPolicy(
    packet.context.verificationPolicy, packet.context.upstream,
    packet.context.executionConfirmerAllowlist,
    packet.runnerImplementationManifest), []);
  assert.deepEqual(subject.validateSignedExecutionConfirmation(
    packet.executionConfirmation, packet.context,
    packet.runnerImplementationManifest, packet.evaluationClockInstant), []);
  const result = subject.evaluateRunnerLaunchPackage(packet);
  assert.equal(result.ok, true, JSON.stringify(result.blockingIssues));
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.equal(result.oneRunRunnerLaunchPackage.nonExecuting, true);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("all six contracts enforce exact keys IDs hashes and versions", () => {
  const inputContracts = [
    ["executionConfirmation", "confirmation"],
    ["runnerImplementationManifest", "manifest"],
    ["context.executionConfirmerAllowlist", "allowlist"],
    ["context.verificationPolicy", "policy"],
  ];
  function at(packet, locator) {
    return locator.split(".").reduce((value, key) => value[key], packet);
  }
  for (const [locator, name] of inputContracts) {
    const missing = buildFixture(); delete at(missing, locator).contractVersion;
    expectBlocked(missing, `${name}_fields_invalid`);
    const extra = buildFixture(); at(extra, locator).endpoint = "forbidden";
    expectBlocked(extra, `${name}_fields_invalid`);
    const id = buildFixture(); at(id, locator)[subject.SPECS[name].idField] = "wrong";
    expectBlocked(id, `${name}_id_invalid`);
    const hash = buildFixture(); at(hash, locator)[subject.SPECS[name].hashField] = "0".repeat(64);
    expectBlocked(hash, `${name}_hash_invalid`);
    const version = buildFixture(); at(version, locator).contractVersion = "other";
    expectBlocked(version, `${name}_contract_version_invalid`);
  }
  const packet = buildFixture();
  const result = subject.evaluateRunnerLaunchPackage(packet);
  for (const [name, value, validator] of [
    ["launch", result.oneRunRunnerLaunchPackage,
      (candidate) => subject.validateOneRunRunnerLaunchPackage(candidate,
        packet.context.upstream, packet.executionConfirmation,
        packet.context.executionConfirmerAllowlist, packet.context.verificationPolicy,
        packet.runnerImplementationManifest, packet.evaluationClockInstant,
        packet.context.priorExecutionConfirmationNonceHashes)],
    ["summary", result.runnerLaunchSummary,
      (candidate) => subject.validateSummary(candidate, packet.context.upstream,
        packet.executionConfirmation, packet.context.executionConfirmerAllowlist,
        packet.context.verificationPolicy, packet.runnerImplementationManifest,
        result.oneRunRunnerLaunchPackage)],
  ]) {
    const missing = clone(value); delete missing.contractVersion;
    assert.ok(validator(missing).some((issue) => issue.includes(`${name}_fields_invalid`)));
    const extra = clone(value); extra.endpoint = "forbidden";
    assert.ok(validator(extra).some((issue) => issue.includes(`${name}_fields_invalid`)));
    const id = clone(value); id[subject.SPECS[name].idField] = "wrong";
    assert.ok(validator(id).some((issue) => issue.includes(`${name}_id_invalid`)));
    const hash = clone(value); hash[subject.SPECS[name].hashField] = "0".repeat(64);
    assert.ok(validator(hash).some((issue) => issue.includes(`${name}_hash_invalid`)));
  }
});

test("malformed Step R Q P O N M L and H material blocks", () => {
  const mutations = [
    (r) => { r.runtimeHandoffSummary.runtimeHandoffSummaryHash = "0".repeat(64); },
    (r) => { nested(r).qPacket.operatorAuthorization.operatorAuthorizationHash = "0".repeat(64); },
    (r) => { nested(r).pPacket.dependencyBundle.executionDependencyBundleHash = "0".repeat(64); },
    (r) => { nested(r).oPacket.context.consumptionPolicy.singleUseConsumptionPolicyHash = "0".repeat(64); },
    (r) => { nested(r).nPacket.invocation.invocationHash = "0".repeat(64); },
    (r) => { nested(r).mPacket.approvalResponse.approvalResponseHash = "0".repeat(64); },
    (r) => { nested(r).lUpstream.stepLSummary.approvalRequestPreparationSummaryHash = "0".repeat(64); },
    (r) => { nested(r).lPacket.approvalRequest.liveObservationApprovalRequestHash = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    const upstream = clone(BASE_STEP_R_PACKET); mutate(upstream);
    expectBlocked(buildFixture({ upstream }), "step");
  }
});

test("scope role order counts and handoff sequence drift block", () => {
  for (const overrides of [
    { confirmationScope: "wrong_scope" },
    { operatorRole: "wrong_role" },
    { orderedConfirmations: [...subject.CONFIRMATION_SEQUENCE].reverse() },
    { maximumRunnerLaunchCount: 2 },
    { maximumArtifactLoadAttemptCount: 2 },
    { maximumClaimAcquisitionCount: 2 },
    { maximumAdapterInvocationCount: 2 },
    { destinationCount: 2 },
    { observationCount: 2 },
    { stepRHandoffSequence: [...stepR.HANDOFF_SEQUENCE].reverse() },
  ]) expectBlocked(buildFixture({ confirmationOverrides: overrides }), "execution_confirmation");
});

test("operator continuity and approver invoker separation are mandatory", () => {
  expectBlocked(withAllowlistEntry({ publicKeyPem: OTHER_PEM }),
    "continuity");
  expectBlocked(withAllowlistEntry({ publicKeyPem: APPROVER_PEM }), "approver");
  expectBlocked(withAllowlistEntry({ publicKeyPem: INVOKER_PEM }), "invoker");
  const keyId = buildFixture();
  keyId.context.executionConfirmerAllowlist = reseal(
    keyId.context.executionConfirmerAllowlist, "allowlist", {
      entries: keyId.context.executionConfirmerAllowlist.entries.map((entry) =>
        ({ ...entry, operatorKeyId: "other-operator-key" })),
    });
  expectBlocked(keyId, "operator");
  const identity = buildFixture();
  identity.context.executionConfirmerAllowlist = reseal(
    identity.context.executionConfirmerAllowlist, "allowlist", {
      entries: identity.context.executionConfirmerAllowlist.entries.map((entry) =>
        ({ ...entry, operatorIdentityHash: "1".repeat(64) })),
    });
  expectBlocked(identity, "operator");
});

test("signature encoding payload key algorithm and substitution failures block", () => {
  const invalidBase64 = buildFixture();
  invalidBase64.executionConfirmation.signatureBase64 = "%%%";
  expectBlocked(invalidBase64, "signature_encoding");
  const invalidSignature = buildFixture();
  invalidSignature.executionConfirmation.signatureBase64 = Buffer.alloc(64).toString("base64");
  expectBlocked(invalidSignature, "signature_invalid");
  expectBlocked(buildFixture({ signingKey: OTHER_KEYS.privateKey }), "signature_invalid");
  expectBlocked(buildFixture({ confirmationOverrides: { signatureAlgorithm: "other" } }),
    "signature_algorithm");
  const payload = buildFixture(); payload.executionConfirmation.runnerArtifactSha256 = "d".repeat(64);
  expectBlocked(payload, "confirmation");
});

test("allowlist revoked expiry future duplicates wildcard scope role and unrelated entries block", () => {
  for (const entry of [
    { revoked: true },
    { validUntil: "2026-07-18T00:03:20.000Z" },
    { validFrom: "2026-07-18T00:03:30.000Z" },
    { operatorKeyId: "*" },
    { allowedScopes: ["wrong"] },
    { allowedRoles: ["wrong"] },
    { operatorIdentityHash: "not-a-hash" },
  ]) expectBlocked(withAllowlistEntry(entry));
  const duplicate = buildFixture();
  duplicate.context.executionConfirmerAllowlist = reseal(
    duplicate.context.executionConfirmerAllowlist, "allowlist", {
      entries: [
        ...duplicate.context.executionConfirmerAllowlist.entries,
        ...clone(duplicate.context.executionConfirmerAllowlist.entries),
      ],
    });
  expectBlocked(duplicate, "duplicate");
  const unrelated = buildFixture();
  unrelated.context.executionConfirmerAllowlist = reseal(
    unrelated.context.executionConfirmerAllowlist, "allowlist", {
      entries: [...unrelated.context.executionConfirmerAllowlist.entries, {
        ...unrelated.context.executionConfirmerAllowlist.entries[0],
        operatorKeyId: "unrelated-operator-key",
        operatorIdentityHash: "1".repeat(64),
        publicKeyPem: OTHER_PEM,
      }],
    });
  expectBlocked(unrelated, "resolution");
});

test("execution confirmation nonce distinctness context strictness and replay block", () => {
  const bindings = subject.buildBindings(BASE_STEP_R_PACKET);
  for (const nonce of [bindings.requestNonceHash, bindings.intakeNonceHash,
    bindings.approvalResponseNonceHash, bindings.invocationNonceHash,
    bindings.claimNonceHash, bindings.operatorAuthorizationNonceHash,
    bindings.stepRRuntimeHandoffNonceHash]) {
    expectBlocked(buildFixture({ confirmationOverrides: {
      executionConfirmationNonceHash: nonce,
    } }), "nonce_not_distinct");
  }
  expectBlocked(buildFixture({ priorExecutionConfirmationNonceHashes: "bad" }),
    "not_array");
  expectBlocked(buildFixture({ priorExecutionConfirmationNonceHashes: ["bad"] }),
    "entry_invalid");
  expectBlocked(buildFixture({ priorExecutionConfirmationNonceHashes: [
    "2".repeat(64), "2".repeat(64),
  ] }), "duplicate");
  expectBlocked(buildFixture({ priorExecutionConfirmationNonceHashes: [
    "2".repeat(64), "1".repeat(64),
  ] }), "not_sorted");
  expectBlocked(buildFixture({ priorExecutionConfirmationNonceHashes: ["9".repeat(64)] }),
    "nonce_replay");
});

test("chronology lifetime key validity expiry and clock skew block", () => {
  for (const options of [
    { confirmationOverrides: { issuedAt: "2026-07-18T00:03:19.999Z" } },
    { confirmationOverrides: { expiresAt: "2026-07-18T00:03:40.001Z" } },
    { confirmationOverrides: { issuedAt: "2026-07-18T00:03:30.000Z" } },
    { confirmationOverrides: { issuedAt: "2026-07-18T00:03:18.000Z",
      expiresAt: "2026-07-18T00:03:39.000Z" } },
    { confirmationOverrides: { issuedAt: "not-an-instant" } },
    { evaluationClockInstant: "2026-07-18T00:03:19.999Z" },
    { evaluationClockInstant: "2026-07-18T00:03:39.000Z" },
    { allowlistOverrides: { entry: { validUntil: "2026-07-18T00:03:30.000Z" } } },
  ]) expectBlocked(buildFixture(options), "execution_confirmation");
  assert.equal(subject.evaluateRunnerLaunchPackage(buildFixture({
    evaluationClockInstant: "2026-07-18T00:03:38.999Z",
  })).ok, true);
});

test("launch expiry is the minimum of confirmation and Step R expiry", () => {
  const packet = buildFixture();
  const result = subject.evaluateRunnerLaunchPackage(packet);
  assert.equal(result.ok, true);
  assert.equal(result.oneRunRunnerLaunchPackage.executionConfirmationIssuedAt,
    packet.executionConfirmation.issuedAt);
  assert.equal(result.oneRunRunnerLaunchPackage.executionConfirmationExpiresAt,
    packet.executionConfirmation.expiresAt);
  assert.ok(Date.parse(packet.executionConfirmation.expiresAt) < Date.parse(
    packet.context.upstream.runtimePreconditionManifest.earliestExpiry));
  assert.equal(result.oneRunRunnerLaunchPackage.earliestExpiry,
    packet.executionConfirmation.expiresAt);

  const args = [packet.context.upstream, packet.executionConfirmation,
    packet.context.executionConfirmerAllowlist, packet.context.verificationPolicy,
    packet.runnerImplementationManifest, packet.evaluationClockInstant,
    packet.context.priorExecutionConfirmationNonceHashes];
  const laterStepRExpiry = reseal(result.oneRunRunnerLaunchPackage, "launch", {
    earliestExpiry:
      packet.context.upstream.runtimePreconditionManifest.earliestExpiry,
  });
  assert.ok(subject.validateOneRunRunnerLaunchPackage(laterStepRExpiry, ...args)
    .some((issue) => issue.includes("earliestExpiry")));
});

test("effective launch expiry boundary and confirmation rebinding fail closed", () => {
  expectBlocked(buildFixture({
    evaluationClockInstant: "2026-07-18T00:03:39.000Z",
  }), "evaluation_time_invalid");
  const justBefore = subject.evaluateRunnerLaunchPackage(buildFixture({
    evaluationClockInstant: "2026-07-18T00:03:38.999Z",
  }));
  assert.equal(justBefore.ok, true);
  assert.equal(justBefore.oneRunRunnerLaunchPackage.earliestExpiry,
    "2026-07-18T00:03:39.000Z");

  const earlierPacket = buildFixture({
    confirmationOverrides: { expiresAt: "2026-07-18T00:03:38.000Z" },
    evaluationClockInstant: "2026-07-18T00:03:37.999Z",
  });
  const earlier = subject.evaluateRunnerLaunchPackage(earlierPacket);
  assert.equal(earlier.ok, true);
  assert.equal(earlier.oneRunRunnerLaunchPackage.executionConfirmationExpiresAt,
    "2026-07-18T00:03:38.000Z");
  assert.equal(earlier.oneRunRunnerLaunchPackage.earliestExpiry,
    "2026-07-18T00:03:38.000Z");
  assert.notEqual(earlier.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
    justBefore.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash);

  const args = [earlierPacket.context.upstream, earlierPacket.executionConfirmation,
    earlierPacket.context.executionConfirmerAllowlist,
    earlierPacket.context.verificationPolicy,
    earlierPacket.runnerImplementationManifest,
    earlierPacket.evaluationClockInstant,
    earlierPacket.context.priorExecutionConfirmationNonceHashes];
  for (const overrides of [
    { executionConfirmationIssuedAt: "2026-07-18T00:03:21.001Z" },
    { executionConfirmationExpiresAt: "2026-07-18T00:03:38.001Z" },
    { earliestExpiry: "2026-07-18T00:03:38.001Z" },
  ]) {
    const tampered = reseal(earlier.oneRunRunnerLaunchPackage, "launch", overrides);
    assert.ok(subject.validateOneRunRunnerLaunchPackage(tampered, ...args).length > 0);
  }
});

test("runner manifest identity interface order counts and executable flags block", () => {
  const cases = [
    { runnerArtifactId: "*" },
    { runnerArtifactSha256: "bad" },
    { runnerSourceTreeSha256: "bad" },
    { runnerCapabilityManifestSha256: "bad" },
    { runnerInterfaceVersion: "other" },
    { runnerClass: "other" },
    { supportedLaunchSequence: [...subject.CONFIRMATION_SEQUENCE].reverse() },
    { maximumRunnerLaunchCount: 2 },
    { maximumArtifactLoadAttemptCount: 2 },
    { maximumClaimAcquisitionCount: 2 },
    { maximumAdapterInvocationCount: 2 },
    { destinationCount: 2 },
    { observationCount: 2 },
    { immutableArtifactRequired: false },
    { runtimeLoaded: true },
    { moduleResolved: true },
    { runnerInvocable: true },
    { adapterInvocable: true },
    { externalDependencyBound: true },
    { providerSpecificMaterialPresent: true },
    { rawMaterialPresent: true },
  ];
  for (const overrides of cases) {
    const packet = buildFixture();
    packet.runnerImplementationManifest = reseal(
      packet.runnerImplementationManifest, "manifest", overrides);
    expectBlocked(packet, "runner_manifest");
  }
});

test("a resealed runner manifest needs a new signature and then passes", () => {
  const oldSignature = buildFixture();
  oldSignature.runnerImplementationManifest = subject.buildRunnerImplementationManifest(
    oldSignature.context.upstream, {
      runnerArtifactId: "synthetic-second-runner-artifact",
      runnerArtifactSha256: "d".repeat(64),
      runnerSourceTreeSha256: "e".repeat(64),
      runnerCapabilityManifestSha256: "f".repeat(64),
    });
  expectBlocked(oldSignature, "policy_field_invalid");
  const resigned = buildFixture({ manifestOverrides: {
    runnerArtifactId: "synthetic-second-runner-artifact",
    runnerArtifactSha256: "d".repeat(64),
    runnerSourceTreeSha256: "e".repeat(64),
    runnerCapabilityManifestSha256: "f".repeat(64),
  } });
  assert.equal(subject.evaluateRunnerLaunchPackage(resigned).ok, true);
});

test("forbidden raw endpoint identity path command SQL and evidence fields block", () => {
  for (const field of ["endpoint", "hostname", "ip", "port", "url", "database",
    "schema", "table", "credential", "certificate", "provider", "account",
    "project", "service", "operatorIdentityText", "path", "modulePath",
    "command", "sql", "screenshot", "rawSource", "rawEvidence"]) {
    const manifest = buildFixture(); manifest.runnerImplementationManifest[field] = "forbidden";
    expectBlocked(manifest, "manifest_fields_invalid");
    const confirmation = buildFixture(); confirmation.executionConfirmation[field] = "forbidden";
    expectBlocked(confirmation, "confirmation_fields_invalid");
  }
});

test("launch package bindings requirements and every fixed false field reject drift", () => {
  const packet = buildFixture();
  const result = subject.evaluateRunnerLaunchPackage(packet);
  const args = [packet.context.upstream, packet.executionConfirmation,
    packet.context.executionConfirmerAllowlist, packet.context.verificationPolicy,
    packet.runnerImplementationManifest, packet.evaluationClockInstant,
    packet.context.priorExecutionConfirmationNonceHashes];
  for (const mutate of [
    (value) => { value.runnerArtifactSha256 = "0".repeat(64); },
    (value) => { value.orderedConfirmations.reverse(); },
    (value) => { value.handoffSequence.reverse(); },
    (value) => { value.artifactRequirements.maximumArtifactLoadAttemptCount = 2; },
    (value) => { value.claimRequirements.maximumSuccessfulAcquisitions = 2; },
    (value) => { value.transportRequirements.adapterInvoked = true; },
    (value) => { value.receiptRequirements.persistenceExecuted = true; },
    (value) => { value.evidenceRequirements.finalizationExecuted = true; },
    (value) => { value.disposalRequirements.disposalExecuted = true; },
  ]) {
    const candidate = clone(result.oneRunRunnerLaunchPackage); mutate(candidate);
    assert.ok(subject.validateOneRunRunnerLaunchPackage(candidate, ...args).length > 0);
  }
  for (const field of subject.FIXED_FALSE_FIELDS) {
    const candidate = clone(result.oneRunRunnerLaunchPackage); candidate[field] = true;
    assert.ok(subject.validateOneRunRunnerLaunchPackage(candidate, ...args)
      .some((issue) => issue.includes(field)), field);
    const summary = clone(result.runnerLaunchSummary); summary[field] = true;
    assert.ok(subject.validateSummary(summary, packet.context.upstream,
      packet.executionConfirmation, packet.context.executionConfirmerAllowlist,
      packet.context.verificationPolicy, packet.runnerImplementationManifest,
      result.oneRunRunnerLaunchPackage).some((issue) => issue.includes(field)), field);
  }
});

test("blocked exception and CLI failures preserve fixed false authority", () => {
  for (const packet of [{}, { context: null }, buildFixture({
    confirmationOverrides: { manualReviewRequired: true },
  })]) {
    const result = subject.evaluateRunnerLaunchPackage(packet);
    assert.equal(result.status, "blocked");
    for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  }
});

test("production core has no ambient filesystem network DB signing loader or store capability", () => {
  const source = readFileSync(path.join(__dirname,
    "lib/metrics-cutover-live-observation-runner-launch-package.cjs"), "utf8");
  for (const pattern of [
    /require\(["']node:fs["']\)/,
    /require\(["']node:child_process["']\)/,
    /process\.env/,
    /process\.stdin/,
    /Date\.now\s*\(/,
    /\bfetch\s*\(/,
    /require\(["'](?:pg|net|tls|http|https|dns)["']\)/,
    /require\.resolve\s*\(/,
    /\bimport\s*\(/,
    /\bgenerateKeyPair(?:Sync)?\s*\(/,
    /\bsign\s*\(/,
    /adapterLoader\s*\(/,
    /runnerLoader\s*\(/,
    /claimStore\s*\./,
    /receiptStore\s*\./,
    /deploymentApi\s*\./,
  ]) assert.doesNotMatch(source, pattern);
});
