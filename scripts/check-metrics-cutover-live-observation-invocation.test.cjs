"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const stepM = require("./lib/metrics-cutover-live-observation-approval-response.cjs");
const subject = require("./lib/metrics-cutover-live-observation-invocation.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepMUpstream() {
  const upstream = stepM.buildUpstream();
  const approverAllowlist = stepM.buildApproverAllowlist(APPROVER_PEM);
  const verificationPolicy = stepM.buildVerificationPolicy(upstream);
  const context = { upstream, approverAllowlist, verificationPolicy, priorResponseNonceHashes: [] };
  const unsigned = stepM.buildUnsignedApprovalResponse(upstream);
  const signature = sign(null, stepM.buildApprovalSignaturePayload(unsigned), APPROVER_KEYS.privateKey).toString("base64");
  const approvalResponse = stepM.sealSignedApprovalResponse(unsigned, signature);
  const stepMPacket = { context, approvalResponse, evaluationClockInstant: "2026-07-18T00:03:10.000Z" };
  const authority = stepM.buildObservationAuthorityPackage(approvalResponse, context);
  const summary = stepM.buildSummary(approvalResponse, context, authority);
  return subject.buildUpstream(stepMPacket, authority, summary);
}
const BASE_UPSTREAM = buildStepMUpstream();

function fixture({ invocationOverrides = {}, allowlistEntryOverrides = {} } = {}) {
  const upstream = clone(BASE_UPSTREAM);
  const invokerAllowlist = subject.buildInvokerAllowlist(INVOKER_PEM, { entry: allowlistEntryOverrides });
  const verificationPolicy = subject.buildVerificationPolicy(upstream);
  const context = { upstream, invokerAllowlist, verificationPolicy, priorInvocationNonceHashes: [] };
  const unsigned = subject.buildUnsignedInvocation(upstream, invocationOverrides);
  const signature = sign(null, subject.buildInvocationSignaturePayload(unsigned), INVOKER_KEYS.privateKey).toString("base64");
  return {
    packet: {
      context,
      invocation: subject.sealSignedInvocation(unsigned, signature),
      evaluationClockInstant: "2026-07-18T00:03:15.000Z",
    },
    privateKey: INVOKER_KEYS.privateKey,
  };
}
function resign(value, mutate, privateKey = value.privateKey) {
  const body = Object.fromEntries(Object.entries(value.packet.invocation)
    .filter(([key]) => !["invocationId", "signatureBase64", "invocationHash"].includes(key)));
  mutate(body);
  const unsigned = subject.buildUnsignedInvocation(value.packet.context.upstream, body);
  const signature = sign(null, subject.buildInvocationSignaturePayload(unsigned), privateKey).toString("base64");
  value.packet.invocation = subject.sealSignedInvocation(unsigned, signature);
}
function expectBlocked(packet, issuePart) {
  const result = subject.evaluateSignedLiveObservationInvocationPackage(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)), JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
}
function expectShapeBlocked(invocation, issuePart) {
  const issues = subject.validateInvocationShape(invocation);
  assert.ok(issues.some((issue) => issue.includes(issuePart)), JSON.stringify(issues));
}
function resealAllowlist(value) {
  const body = Object.fromEntries(Object.entries(value).filter(([key]) =>
    !["invokerAllowlistId", "invokerAllowlistHash"].includes(key)));
  return subject.sealContract(body, "allowlist");
}

test("public states are exact and ordered", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_signed_live_observation_invocation",
    "signed_live_observation_invocation_verified",
    "blocked",
  ]);
});
test("zero input awaits an external invocation with all authority false", () => {
  const result = subject.evaluateSignedLiveObservationInvocationPackage();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});
test("CLI default is exact awaiting state", () => {
  const output = execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-invocation.cjs")], { encoding: "utf8" });
  assert.equal(JSON.parse(output).status, subject.PUBLIC_STATES[0]);
});
test("CLI rejects arguments without consuming material", () => {
  let error;
  try { execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-invocation.cjs"), "forbidden"], { encoding: "utf8" }); }
  catch (caught) { error = caught; }
  assert.equal(error.status, 1);
  assert.equal(JSON.parse(error.stdout).status, "blocked");
});
test("valid synthetic Ed25519 invocation prepares non-executing receipt", () => {
  const { packet } = fixture();
  const result = subject.evaluateSignedLiveObservationInvocationPackage(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.equal(result.invocationReceiptCandidate.nonExecuting, true);
  assert.equal(result.invocationReceiptCandidate.invokerKeyId,
    packet.invocation.invokerKeyId);
  assert.notEqual(packet.invocation.invokerKeyId,
    packet.context.upstream.stepMObservationAuthorityPackage.signerKeyId);
  assert.notEqual(packet.invocation.invokerIdentityHash,
    packet.context.upstream.stepMObservationAuthorityPackage.signerIdentityHash);
  for (const field of subject.FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false);
    assert.equal(result.invocationReceiptCandidate[field], false);
    assert.equal(result.invocationVerificationSummary[field], false);
  }
});
test("tampered Step M summary blocks", () => {
  const { packet } = fixture(); packet.context.upstream.stepMApprovalVerificationSummary.publicState = "blocked";
  expectBlocked(packet, "step_m");
});
test("tampered Step M authority package blocks", () => {
  const { packet } = fixture(); packet.context.upstream.stepMObservationAuthorityPackage.nonExecuting = false;
  expectBlocked(packet, "observation_authority");
});
test("tampered Step L intake blocks direct revalidation", () => {
  const { packet } = fixture();
  packet.context.upstream.stepMPacket.context.upstream.stepLPacket.intake.destinationCount = 2;
  expectBlocked(packet, "intake");
});
test("tampered Step H approval request blocks direct revalidation", () => {
  const { packet } = fixture();
  packet.context.upstream.stepMPacket.context.upstream.stepLPacket.approvalRequest.maximumObservationCount = 2;
  expectBlocked(packet, "approval_request");
});
test("missing invocation field blocks exact shape", () => {
  const { packet } = fixture(); delete packet.invocation.attestations;
  expectShapeBlocked(packet.invocation, "invocation_fields_invalid");
});
test("extra invocation field blocks exact shape", () => {
  const { packet } = fixture(); packet.invocation.endpoint = "forbidden";
  expectShapeBlocked(packet.invocation, "invocation_fields_invalid");
});
test("wrong scope and role block", () => {
  const f = fixture(); resign(f, (value) => { value.approvalScope = "other"; });
  expectShapeBlocked(f.packet.invocation, "scope_role_invalid");
  const g = fixture(); resign(g, (value) => { value.invocationRole = "other"; });
  expectShapeBlocked(g.packet.invocation, "scope_role_invalid");
});
test("operation order, observation count, and destination count drift block", () => {
  const f = fixture(); resign(f, (value) => { value.requestedOperationSet.reverse(); });
  expectShapeBlocked(f.packet.invocation, "operation_scope_invalid");
  const g = fixture(); resign(g, (value) => { value.maximumObservationCount = 2; });
  expectShapeBlocked(g.packet.invocation, "operation_scope_invalid");
  const h = fixture(); resign(h, (value) => { value.destinationCount = 2; });
  expectShapeBlocked(h.packet.invocation, "operation_scope_invalid");
});
test("approver and invoker key IDs must differ", () => {
  const f = fixture();
  const approver = f.packet.context.upstream.stepMObservationAuthorityPackage;
  f.packet.context.invokerAllowlist = subject.buildInvokerAllowlist(INVOKER_PEM,
    { entry: { invokerKeyId: approver.signerKeyId } });
  resign(f, (value) => { value.invokerKeyId = approver.signerKeyId; });
  expectBlocked(f.packet, "key_id_must_differ");
});
test("approver and invoker sanitized identities must differ", () => {
  const f = fixture();
  const approver = f.packet.context.upstream.stepMObservationAuthorityPackage;
  f.packet.context.invokerAllowlist = subject.buildInvokerAllowlist(INVOKER_PEM,
    { entry: { invokerIdentityHash: approver.signerIdentityHash } });
  resign(f, (value) => { value.invokerIdentityHash = approver.signerIdentityHash; });
  expectBlocked(f.packet, "identity_hash_must_differ");
});
test("approver and invoker public keys must differ", () => {
  const f = fixture();
  f.packet.context.invokerAllowlist = subject.buildInvokerAllowlist(APPROVER_PEM);
  expectBlocked(f.packet, "public_key_must_differ");
});
test("missing, extra, or false attestations block", () => {
  const f = fixture(); resign(f, (value) => { delete value.attestations.authorityPackageReviewed; });
  expectShapeBlocked(f.packet.invocation, "attestations_invalid");
  const g = fixture(); resign(g, (value) => { value.attestations.extra = true; });
  expectShapeBlocked(g.packet.invocation, "attestations_invalid");
  const h = fixture(); resign(h, (value) => { value.attestations.noSqlExecutionPerformed = false; });
  expectShapeBlocked(h.packet.invocation, "attestations_invalid");
});
test("invalid Base64 and wrong signature algorithm block", () => {
  const f = fixture(); f.packet.invocation.signatureBase64 = "invalid";
  expectShapeBlocked(f.packet.invocation, "signature_encoding_invalid");
  const g = fixture(); resign(g, (value) => { value.signatureAlgorithm = "other"; });
  expectShapeBlocked(g.packet.invocation, "signature_algorithm_invalid");
});
test("signature tampering blocks even with a valid invocation hash", () => {
  const f = fixture(); const bytes = Buffer.from(f.packet.invocation.signatureBase64, "base64"); bytes[0] ^= 1;
  f.packet.invocation = subject.sealSignedInvocation(
    Object.fromEntries(Object.entries(f.packet.invocation).filter(([key]) => key !== "signatureBase64")),
    bytes.toString("base64"));
  expectBlocked(f.packet, "signature_invalid");
});
test("wrong invoker key blocks signature verification", () => {
  const f = fixture(); const wrong = generateKeyPairSync("ed25519").privateKey;
  resign(f, () => {}, wrong);
  expectBlocked(f.packet, "signature_invalid");
});
test("revoked, wrong-scope, wrong-role, wildcard, and duplicate allowlists block", () => {
  for (const [override, issue] of [
    [{ revoked: true }, "revoked"],
    [{ allowedScopes: ["other"] }, "scope_invalid"],
    [{ allowedRoles: ["other"] }, "role_invalid"],
    [{ invokerKeyId: "*" }, "key_id_invalid"],
  ]) {
    const f = fixture();
    const value = subject.buildInvokerAllowlist(INVOKER_PEM, { entry: override });
    assert.ok(subject.normalizeInvokerAllowlist(value, f.packet.context.upstream).issues
      .some((item) => item.includes(issue)));
  }
  const f = fixture(); const value = clone(f.packet.context.invokerAllowlist);
  value.entries.push(clone(value.entries[0]));
  assert.ok(subject.normalizeInvokerAllowlist(resealAllowlist(value), f.packet.context.upstream)
    .issues.some((item) => item.includes("duplicate")));
  const unrelated = fixture();
  const unrelatedValue = clone(unrelated.packet.context.invokerAllowlist);
  const otherKeys = generateKeyPairSync("ed25519");
  unrelatedValue.entries.push({
    ...clone(unrelatedValue.entries[0]),
    invokerKeyId: "unrelated-invoker-key",
    invokerIdentityHash: "9".repeat(64),
    publicKeyPem: otherKeys.publicKey.export({ type: "spki", format: "pem" }),
  });
  assert.ok(subject.normalizeInvokerAllowlist(
    resealAllowlist(unrelatedValue), unrelated.packet.context.upstream,
  ).issues.includes("invoker_allowlist_entries_invalid"));
});
test("malformed invoker key ID and identity hash block", () => {
  const f = fixture(); resign(f, (value) => { value.invokerKeyId = "*"; });
  expectShapeBlocked(f.packet.invocation, "signer_key_id_invalid");
  const g = fixture(); resign(g, (value) => { value.invokerIdentityHash = "invalid"; });
  expectShapeBlocked(g.packet.invocation, "hash_invalid:invokerIdentityHash");
});
test("invocation nonce must differ from request, intake, and response nonces", () => {
  for (const field of ["requestNonceHash", "intakeNonceHash", "approvalResponseNonceHash"]) {
    const f = fixture(); resign(f, (value) => { value.invocationNonceHash = value[field]; });
    expectBlocked(f.packet, "nonce_not_distinct");
  }
});
test("replayed invocation nonce blocks", () => {
  const f = fixture();
  f.packet.context.priorInvocationNonceHashes = [f.packet.invocation.invocationNonceHash];
  expectBlocked(f.packet, "nonce_replay");
});
test("malformed, duplicate, and unsorted prior nonce contexts block", () => {
  for (const [values, issue] of [
    [["invalid"], "hash_invalid"],
    [["1".repeat(64), "1".repeat(64)], "duplicate"],
    [["2".repeat(64), "1".repeat(64)], "not_sorted"],
  ]) {
    const f = fixture(); f.packet.context.priorInvocationNonceHashes = values;
    expectBlocked(f.packet, issue);
  }
});
test("observation window binding drift blocks", () => {
  const f = fixture(); resign(f, (value) => { value.observationWindowStartsAt = "2026-07-18T00:03:11.000Z"; });
  expectBlocked(f.packet, "authority_binding_mismatch:observationWindowStartsAt");
});
test("inverted or excessive lifetime blocks", () => {
  const f = fixture(); resign(f, (value) => { value.expiresAt = "2026-07-18T00:03:09.000Z"; });
  expectBlocked(f.packet, "lifetime_invalid");
  const g = fixture(); resign(g, (value) => { value.expiresAt = "2026-07-18T00:03:56.000Z"; });
  expectBlocked(g.packet, "lifetime_invalid");
});
test("invocation cannot outlive authority or observation window", () => {
  const f = fixture(); resign(f, (value) => { value.expiresAt = "2026-07-18T00:04:01.000Z"; });
  expectBlocked(f.packet, "outlives_authority_or_window");
});
test("expired and future-skewed invocations block", () => {
  const f = fixture(); f.packet.evaluationClockInstant = "2026-07-18T00:03:45.000Z";
  expectBlocked(f.packet, "evaluation_time_invalid");
  const g = fixture(); g.packet.evaluationClockInstant = "2026-07-18T00:02:30.000Z";
  expectBlocked(g.packet, "evaluation_time_invalid");
});
test("invoker validity must contain the invocation", () => {
  const f = fixture({ allowlistEntryOverrides: { validFrom: "2026-07-18T00:03:20.000Z" } });
  expectBlocked(f.packet, "invoker_validity_mismatch");
  const g = fixture({ allowlistEntryOverrides: { validUntil: "2026-07-18T00:03:30.000Z" } });
  expectBlocked(g.packet, "invoker_validity_mismatch");
});
test("recording, consumption, activation, provider, and raw material claims block", () => {
  for (const field of ["realInvocationRecorded", "invocationConsumed",
    "liveObservationAuthorityActivated", "rawMaterialPresent", "providerSpecificMaterialPresent"]) {
    const f = fixture(); resign(f, (value) => { value[field] = true; });
    expectShapeBlocked(f.packet.invocation, "synthetic_boundary_invalid");
  }
});
test("verification policy tampering blocks", () => {
  const { packet } = fixture(); packet.context.verificationPolicy.distinctSignerRequired = false;
  expectBlocked(packet, "invocation_policy");
});
test("receipt and summary reject binding, operation, expiry, and fixed-false drift", () => {
  const { packet } = fixture();
  const result = subject.evaluateSignedLiveObservationInvocationPackage(packet);
  const receipt = clone(result.invocationReceiptCandidate);
  receipt.invocationConsumed = true;
  assert.ok(subject.validateReceiptCandidate(receipt, packet.invocation, packet.context)
    .some((issue) => issue.includes("invocationConsumed")));
  const order = clone(result.invocationReceiptCandidate);
  order.requestedOperationSet.reverse();
  assert.ok(subject.validateReceiptCandidate(order, packet.invocation, packet.context)
    .some((issue) => issue.includes("requestedOperationSet")));
  const expiry = clone(result.invocationReceiptCandidate);
  expiry.expiresAt = "2026-07-18T00:04:01.000Z";
  assert.ok(subject.validateReceiptCandidate(expiry, packet.invocation, packet.context)
    .some((issue) => issue.includes("expiresAt")));
  const summary = clone(result.invocationVerificationSummary);
  summary.liveObservationAuthorityActivated = true;
  assert.ok(subject.validateSummary(summary, packet.invocation, packet.context,
    result.invocationReceiptCandidate).some((issue) =>
    issue.includes("liveObservationAuthorityActivated")));
});
test("core has no ambient, filesystem, network, DB, signing, durable-store, or deployment capability", () => {
  const source = readFileSync(path.join(__dirname,
    "lib/metrics-cutover-live-observation-invocation.cjs"), "utf8");
  assert.doesNotMatch(source, /generateKeyPair|\bsign\s*[:(]|node:fs|process\.|fetch\s*\(|https?:\/\/|postgres|child_process|execFile|spawn\s*\(|writeFile|mkdir|claimStore|receiptStore|deploy\s*\(/i);
  assert.match(source, /createPublicKey/);
  assert.match(source, /verifySignature/);
});
