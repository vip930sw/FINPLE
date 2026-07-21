"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const subject = require("./lib/metrics-cutover-production-approval-envelope.cjs");
const fixture = require("./test-support/metrics-cutover-production-approval-envelope-fixture.cjs");

const BASE = fixture.buildFixture();
function packetWith(overrides = {}) { return { ...BASE.packet, ...overrides }; }
function approvalPacket(approval, allowlist = BASE.allowlist, overrides = {}) {
  return packetWith({ productionCutoverApproverAllowlist: allowlist,
    signedProductionCutoverApproval: approval, ...overrides });
}

test("zero input and zero-argument CLI return the exact awaiting state", () => {
  const result = subject.evaluateProductionCutoverApproval();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-approval-envelope.cjs")], { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, subject.PUBLIC_STATES[0]);
});

test("one exact signed synthetic approval seals a single-use non-executing envelope", () => {
  const result = subject.evaluateProductionCutoverApproval(BASE.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(result.stepXDirectlyValidated, true);
  assert.equal(result.productionCutoverIdentityReconciled, true);
  assert.equal(result.approvalVerified, true);
  assert.equal(result.signerSeparationValidated, true);
  assert.equal(result.singleUseProductionCutoverEnvelope.singleUse, true);
  assert.equal(result.singleUseProductionCutoverEnvelope
    .productionWriteAuthorizedForLaterExplicitInvocation, true);
  assert.equal(result.singleUseProductionCutoverEnvelope.explicitInvocationRequired, true);
  assert.equal(result.singleUseProductionCutoverEnvelope.separateReviewRequired, true);
  assert.deepEqual(BASE.stepXFixture.stepWFixture.envelopeStore.calls, []);
  assert.deepEqual(BASE.stepXFixture.stepWFixture.runnerCalls, []);
});

test("the complete Step X and W/V/U/T/S chain is directly reconstructed", () => {
  const direct = subject.directValidateStepX(BASE.packet.stepXPacket,
    BASE.packet.stepXResult);
  assert.deepEqual(direct.issues, []);
  assert.equal(direct.chain.expectedPlan.length, 21);
  assert.equal(direct.cutover.expectedIdentities.datasets.length, 2);
  const bindings = subject.buildCriticalBindings(BASE.packet.stepXPacket,
    BASE.packet.stepXResult, direct);
  assert.deepEqual(bindings.productionCsvTargets.map((target) => target.market),
    ["US", "KR"]);
  assert.equal(bindings.futureCutoverOperationOrder.length, 10);
  assert.equal(bindings.maximumProductionCsvReplacementCount, 2);
  assert.equal(bindings.maximumSelectorMutationCount, 1);
});

test("Step X packet, result, manifest, readiness, or summary tampering blocks", () => {
  const cases = [];
  const packet = fixture.clone(BASE.packet.stepXPacket);
  packet.envelopeClaimTerminalizationHash = "1".repeat(64);
  cases.push(packetWith({ stepXPacket: packet }));
  for (const field of ["reconciledEvidenceManifest",
    "productionCutoverReadinessPackage", "productionCutoverReadinessSummary"]) {
    const result = fixture.clone(BASE.packet.stepXResult);
    result[field][Object.keys(result[field]).at(-1)] = "2".repeat(64);
    cases.push(packetWith({ stepXResult: result }));
  }
  for (const candidate of cases) {
    const result = subject.evaluateProductionCutoverApproval(candidate);
    assert.equal(result.status, "blocked");
    assert.equal(result.failureClassification, "blocked_before_step_x_validation");
  }
});

test("candidate, selector, repository, authority, invocation, and attestation drift block", () => {
  const paths = [
    ["candidatePackage", "candidatePackageHash"],
    ["selector", "selectorPreimageSha256"],
    ["repository", "repositoryTreeSha"],
    ["authority", "authorityPackageHash"],
    ["invocation", "invocationHash"],
    ["attestations", "noDriftAttestationHash"],
  ];
  for (const [group, field] of paths) {
    const packet = fixture.clone(BASE.packet.stepXPacket);
    packet.productionCutoverEvidence.productionCutoverIdentities[group][field] =
      "3".repeat(field.includes("Tree") ? 40 : 64);
    assert.equal(subject.evaluateProductionCutoverApproval(
      packetWith({ stepXPacket: packet })).status, "blocked", `${group}.${field}`);
  }
});

test("missing, extra, reordered, partial, or mistyped approval material blocks", () => {
  const missing = fixture.clone(BASE.approval); delete missing.role;
  const extra = { ...BASE.approval, unknownAuthority: true };
  const reordered = Object.fromEntries(Object.entries(BASE.approval).reverse());
  const mistyped = { ...BASE.approval, maximumSelectorMutationCount: "1" };
  const partial = { contractVersion: BASE.approval.contractVersion };
  for (const approval of [missing, extra, reordered, mistyped, partial]) {
    assert.equal(subject.evaluateProductionCutoverApproval(
      approvalPacket(approval)).status, "blocked");
  }
});

test("invalid Base64, signature, key substitution, role, and scope block", () => {
  const invalidBase64 = { ...BASE.approval, signatureBase64: "not-base64" };
  const invalidSignature = { ...BASE.approval,
    signatureBase64: Buffer.alloc(64, 1).toString("base64") };
  const wrongRole = fixture.resealApproval(BASE.approval, { role: "wrong_role" });
  const wrongScope = fixture.resealApproval(BASE.approval, { scope: "wrong_scope" });
  for (const approval of [invalidBase64, invalidSignature, wrongRole, wrongScope]) {
    const result = subject.evaluateProductionCutoverApproval(approvalPacket(approval));
    assert.equal(result.status, "blocked");
    assert.equal(result.failureClassification, "blocked_during_approval_verification");
  }
});

test("allowlist must resolve exactly one active, unique, exact-role signer", () => {
  const duplicate = fixture.resealAllowlist({ ...BASE.allowlist,
    entries: [fixture.clone(BASE.allowlist.entries[0]),
      fixture.clone(BASE.allowlist.entries[0])] });
  const revoked = subject.buildProductionCutoverApproverAllowlist(fixture.pem(), {
    entry: { revoked: true },
  });
  const future = subject.buildProductionCutoverApproverAllowlist(fixture.pem(), {
    entry: { validFrom: "2026-07-18T00:03:30.000Z" },
  });
  const wildcard = subject.buildProductionCutoverApproverAllowlist(fixture.pem(), {
    entry: { signerKeyId: "*" },
  });
  for (const allowlist of [duplicate, revoked, future, wildcard]) {
    assert.equal(subject.evaluateProductionCutoverApproval(
      approvalPacket(BASE.approval, allowlist)).status, "blocked");
  }
});

test("Step Y signer is separated from Step M/N/Q/S/V by key, identity, and fingerprint", () => {
  const upstream = subject.buildUpstreamSignerIdentities(BASE.packet.stepXPacket);
  assert.deepEqual(upstream.map((entry) => entry.role), [
    "step_m_approver", "step_n_invoker", "step_q_operator",
    "step_s_execution_confirmer", "step_v_external_observation_approver",
  ]);
  for (const entry of upstream) {
    const allowlist = subject.buildProductionCutoverApproverAllowlist(fixture.pem(), {
      entry: { signerKeyId: entry.keyId,
        signerSanitizedIdentityHash: entry.identityHash },
    });
    const body = subject.buildApprovalBody(BASE.packet.stepXPacket,
      BASE.packet.stepXResult, fixture.signerFromAllowlist(allowlist), [],
      fixture.EVALUATION_CLOCK);
    const approval = fixture.signApprovalBody(body);
    const result = subject.evaluateProductionCutoverApproval(
      approvalPacket(approval, allowlist));
    assert.equal(result.status, "blocked", entry.role);
    assert.ok(result.blockingIssues.includes(
      "production_cutover_approver_upstream_separation_failed"), entry.role);
  }
});

test("nonce context rejects malformed, duplicate, unsorted, replayed, and upstream-equal values", () => {
  const upstreamNonce = subject.collectUpstreamNonceHashes(BASE.packet.stepXPacket)[0];
  const cases = [
    { priorApprovalNonceHashes: ["bad"] },
    { priorApprovalNonceHashes: ["1".repeat(64), "1".repeat(64)] },
    { priorApprovalNonceHashes: ["2".repeat(64), "1".repeat(64)] },
    { priorApprovalNonceHashes: [BASE.approval.approvalNonceHash] },
  ];
  for (const overrides of cases) {
    const result = subject.evaluateProductionCutoverApproval(packetWith(overrides));
    assert.equal(result.status, "blocked");
    assert.equal(result.manualReviewRequired, true);
  }
  const replayed = fixture.resealApproval(BASE.approval,
    { approvalNonceHash: upstreamNonce });
  const upstreamResult = subject.evaluateProductionCutoverApproval(
    approvalPacket(replayed));
  assert.equal(upstreamResult.status, "blocked");
  assert.equal(upstreamResult.manualReviewRequired, true);
});

test("chronology, lifetime, skew, and equality-at-expiry fail closed", () => {
  const cases = [
    { issuedAt: "2026-07-18T00:03:27.001Z" },
    { expiresAt: "2026-07-18T00:09:00.000Z",
      effectiveCutoverExpiresAt: BASE.approval.upstreamEffectiveExpiresAt },
    { expiresAt: fixture.EVALUATION_CLOCK,
      effectiveCutoverExpiresAt: fixture.EVALUATION_CLOCK },
  ];
  for (const overrides of cases) {
    const approval = fixture.resealApproval(BASE.approval, overrides);
    const result = subject.evaluateProductionCutoverApproval(approvalPacket(approval));
    assert.equal(result.status, "blocked");
    assert.equal(result.manualReviewRequired, true);
  }
});

test("normally resealed target, selector, or repository drift still blocks", () => {
  const targetDrift = fixture.clone(BASE.approval.productionCsvTargets);
  targetDrift[0].contentSha256 = "4".repeat(64);
  const identityDrift = fixture.clone(BASE.approval.productionCutoverIdentityManifest);
  identityDrift.selector.selectorExpectedPostimageSha256 = "5".repeat(64);
  const cases = [
    fixture.resealApproval(BASE.approval, { productionCsvTargets: targetDrift }),
    fixture.resealApproval(BASE.approval,
      { productionCutoverIdentityManifest: identityDrift }),
    fixture.resealApproval(BASE.approval, { repositoryHeadSha: "6".repeat(40) }),
  ];
  for (const approval of cases) {
    assert.equal(subject.evaluateProductionCutoverApproval(
      approvalPacket(approval)).status, "blocked");
  }
});

test("merge, CI, Vercel, readiness, and repository ownership cannot imply approval", () => {
  for (const extra of [{ mergeSucceeded: true }, { ciSucceeded: true },
    { vercelSucceeded: true }, { repositoryOwnerApproved: true },
    { readinessImpliesApproval: true }]) {
    assert.equal(subject.evaluateProductionCutoverApproval(
      { ...BASE.packet, ...extra }).status, "blocked");
  }
});

test("envelope canonical reconstruction rejects tampering", () => {
  const result = subject.evaluateProductionCutoverApproval(BASE.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  const direct = subject.directValidateStepX(BASE.packet.stepXPacket,
    BASE.packet.stepXResult);
  assert.deepEqual(subject.validateSingleUseProductionCutoverEnvelope(
    result.singleUseProductionCutoverEnvelope, BASE.packet.stepXPacket,
    BASE.packet.stepXResult, BASE.approval, BASE.allowlist, direct), []);
  const tampered = fixture.clone(result.singleUseProductionCutoverEnvelope);
  tampered.maximumSelectorMutationCount = 2;
  assert.notDeepEqual(subject.validateSingleUseProductionCutoverEnvelope(
    tampered, BASE.packet.stepXPacket, BASE.packet.stepXResult,
    BASE.approval, BASE.allowlist, direct), []);
});

test("output is deterministic, recursively frozen, sanitized, and mutation counts stay zero", () => {
  const first = subject.evaluateProductionCutoverApproval(BASE.packet);
  const second = subject.evaluateProductionCutoverApproval(BASE.packet);
  assert.equal(subject.canonicalJson(first), subject.canonicalJson(second));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.singleUseProductionCutoverEnvelope));
  assert.ok(Object.isFrozen(first.singleUseProductionCutoverEnvelope.criticalBindings));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(first[field], false);
  for (const field of ["cutoverExecutorInvocationCount",
    "productionCsvReplacementCount", "selectorMutationCount",
    "loaderActivationCount", "deploymentCount"]) assert.equal(first[field], 0);
  assert.equal("signatureBase64" in first.singleUseProductionCutoverEnvelope, false);
});

test("production source exposes no ambient filesystem, network, DB, process, or executor capability", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-production-approval-envelope.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:http", "node:https", "node:net",
    "node:tls", "node:child_process", "process.env", "process.stdin",
    "runControlledLiveObservation(", "executeSignedEnvelopeOnce(",
    "runMetricsCutoverGuardedExecutor(", "acquireExecutionEnvelopeClaim(",
    "finalizeExecutionEnvelopeClaim(", "postgres", "SELECT ", "INSERT ",
    "UPDATE ", "DELETE "]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.deepEqual(BASE.stepXFixture.stepWFixture.envelopeStore.calls, []);
  assert.deepEqual(BASE.stepXFixture.stepWFixture.runnerCalls, []);
});

test("CLI arguments are forbidden and cannot discover a packet", () => {
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-approval-envelope.cjs"), "packet.json"],
  { encoding: "utf8" });
  assert.equal(cli.status, 1);
  assert.deepEqual(JSON.parse(cli.stdout).blockingIssues, ["cli_arguments_forbidden"]);
});
