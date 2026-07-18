"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const subject = require("./lib/metrics-cutover-live-observation-approval-response.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
const BASE_UPSTREAM = subject.buildUpstream();
const SYNTHETIC_KEY_PAIR = generateKeyPairSync("ed25519");
const SYNTHETIC_PUBLIC_KEY_PEM = SYNTHETIC_KEY_PAIR.publicKey.export({
  type: "spki", format: "pem",
});
function sealAllowlist(value) {
  const body = Object.fromEntries(Object.entries(value).filter(([key]) =>
    !["approverAllowlistId", "approverAllowlistHash"].includes(key)));
  return subject.sealContract(body, "allowlist");
}
function signedFixture({ responseOverrides = {}, allowlistEntryOverrides = {} } = {}) {
  const privateKey = SYNTHETIC_KEY_PAIR.privateKey;
  const upstream = clone(BASE_UPSTREAM);
  const approverAllowlist = subject.buildApproverAllowlist(SYNTHETIC_PUBLIC_KEY_PEM, { entry: allowlistEntryOverrides });
  const verificationPolicy = subject.buildVerificationPolicy(upstream);
  const context = { upstream, approverAllowlist, verificationPolicy, priorResponseNonceHashes: [] };
  const unsigned = subject.buildUnsignedApprovalResponse(upstream, responseOverrides);
  const signatureBase64 = sign(null, subject.buildApprovalSignaturePayload(unsigned), privateKey).toString("base64");
  return {
    packet: {
      context,
      approvalResponse: subject.sealSignedApprovalResponse(unsigned, signatureBase64),
      evaluationClockInstant: "2026-07-18T00:03:10.000Z",
    },
    privateKey,
  };
}
function resign(fixture, mutate) {
  const unsigned = Object.fromEntries(Object.entries(fixture.packet.approvalResponse)
    .filter(([key]) => !["approvalResponseId", "signatureBase64", "approvalResponseHash"].includes(key)));
  mutate(unsigned);
  const rebuilt = subject.buildUnsignedApprovalResponse(fixture.packet.context.upstream, unsigned);
  const signature = sign(null, subject.buildApprovalSignaturePayload(rebuilt), fixture.privateKey).toString("base64");
  fixture.packet.approvalResponse = subject.sealSignedApprovalResponse(rebuilt, signature);
}
function expectBlocked(packet, issuePart) {
  const result = subject.evaluateSignedLiveObservationApprovalPackage(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)), JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
}

test("public states are exact and ordered", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_signed_live_observation_approval_response",
    "signed_live_observation_approval_response_verified",
    "blocked",
  ]);
});

test("zero input is fail-closed awaiting external signed response", () => {
  const result = subject.evaluateSignedLiveObservationApprovalPackage();
  assert.equal(result.ok, false);
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.deepEqual(result.blockingIssues, []);
});

test("CLI default is the exact awaiting state", () => {
  const output = execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-approval-response.cjs")], { encoding: "utf8" });
  assert.equal(JSON.parse(output).status, subject.PUBLIC_STATES[0]);
});

test("CLI rejects all arguments without consuming material", () => {
  let error;
  try {
    execFileSync(process.execPath, [path.join(__dirname,
      "check-metrics-cutover-live-observation-approval-response.cjs"), "forbidden"],
    { encoding: "utf8" });
  } catch (caught) { error = caught; }
  assert.equal(error.status, 1);
  const result = JSON.parse(error.stdout);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
});

test("valid in-memory Ed25519 response prepares non-executing authority", () => {
  const { packet } = signedFixture();
  const result = subject.evaluateSignedLiveObservationApprovalPackage(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.equal(result.observationAuthorityPackage.nonExecuting, true);
  assert.equal(result.observationAuthorityPackage.approvalScope, subject.APPROVAL_SCOPE);
  assert.equal(result.observationAuthorityPackage.approverRole, subject.APPROVER_ROLE);
  for (const field of subject.FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false);
    assert.equal(result.observationAuthorityPackage[field], false);
    assert.equal(result.approvalVerificationSummary[field], false);
  }
});

test("Step L packet and summary are directly revalidated", () => {
  const { packet } = signedFixture();
  packet.context.upstream.stepLSummary.publicState = "blocked";
  expectBlocked(packet, "step_l");
});

test("Step H request is directly revalidated", () => {
  const { packet } = signedFixture();
  packet.context.upstream.stepLPacket.approvalRequest.maximumObservationCount = 2;
  expectBlocked(packet, "approval_request");
});

test("missing response field is rejected", () => {
  const { packet } = signedFixture(); delete packet.approvalResponse.attestations;
  expectBlocked(packet, "response_fields_invalid");
});

test("extra response field is rejected", () => {
  const { packet } = signedFixture(); packet.approvalResponse.extra = false;
  expectBlocked(packet, "response_fields_invalid");
});

test("signature tampering is rejected", () => {
  const { packet } = signedFixture();
  const bytes = Buffer.from(packet.approvalResponse.signatureBase64, "base64"); bytes[0] ^= 1;
  const unsigned = Object.fromEntries(Object.entries(packet.approvalResponse)
    .filter(([key]) => key !== "signatureBase64"));
  packet.approvalResponse = subject.sealSignedApprovalResponse(unsigned, bytes.toString("base64"));
  expectBlocked(packet, "signature_invalid");
});

test("invalid Base64 signature is rejected", () => {
  const { packet } = signedFixture(); packet.approvalResponse.signatureBase64 = "not-base64";
  expectBlocked(packet, "signature_encoding_invalid");
});

test("wrong signature algorithm is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.signatureAlgorithm = "other"; });
  expectBlocked(fixture.packet, "signature_algorithm_invalid");
});

test("a different synthetic signer key cannot verify the response", () => {
  const fixture = signedFixture();
  const replacement = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" });
  fixture.packet.context.approverAllowlist = subject.buildApproverAllowlist(replacement);
  expectBlocked(fixture.packet, "signature_invalid");
});

test("revoked signer is rejected", () => {
  const fixture = signedFixture({ allowlistEntryOverrides: { revoked: true } });
  expectBlocked(fixture.packet, "revoked");
});

test("wrong allowlisted scope is rejected", () => {
  const fixture = signedFixture({ allowlistEntryOverrides: { allowedScopes: ["other"] } });
  expectBlocked(fixture.packet, "scope_invalid");
});

test("wrong allowlisted role is rejected", () => {
  const fixture = signedFixture({ allowlistEntryOverrides: { allowedRoles: ["other"] } });
  expectBlocked(fixture.packet, "role_invalid");
});

test("wildcard signer key ID is rejected", () => {
  const fixture = signedFixture({ allowlistEntryOverrides: { signerKeyId: "*" } });
  expectBlocked(fixture.packet, "signer_key_id_invalid");
});

test("duplicate active signer entries are rejected", () => {
  const fixture = signedFixture();
  const value = clone(fixture.packet.context.approverAllowlist);
  value.entries.push(clone(value.entries[0]));
  fixture.packet.context.approverAllowlist = sealAllowlist(value);
  expectBlocked(fixture.packet, "duplicate");
});

test("signer validity beginning after response is rejected", () => {
  const fixture = signedFixture({ allowlistEntryOverrides: { validFrom: "2026-07-18T00:03:30.000Z" } });
  expectBlocked(fixture.packet, "signer_validity_mismatch");
});

test("response nonce must differ from request nonce", () => {
  const fixture = signedFixture();
  resign(fixture, (value) => { value.responseNonceHash = value.requestNonceHash; });
  expectBlocked(fixture.packet, "nonce_not_distinct");
});

test("response nonce must differ from intake nonce", () => {
  const fixture = signedFixture();
  resign(fixture, (value) => { value.responseNonceHash = value.intakeNonceHash; });
  expectBlocked(fixture.packet, "nonce_not_distinct");
});

test("prior response nonce replay is rejected", () => {
  const fixture = signedFixture();
  fixture.packet.context.priorResponseNonceHashes = [fixture.packet.approvalResponse.responseNonceHash];
  expectBlocked(fixture.packet, "nonce_replay");
});

test("duplicate prior response nonce context is rejected", () => {
  const fixture = signedFixture();
  fixture.packet.context.priorResponseNonceHashes = ["1".repeat(64), "1".repeat(64)];
  expectBlocked(fixture.packet, "prior_response_nonce_hashes_duplicate");
});

test("unsorted prior response nonce context is rejected", () => {
  const fixture = signedFixture();
  fixture.packet.context.priorResponseNonceHashes = ["2".repeat(64), "1".repeat(64)];
  expectBlocked(fixture.packet, "prior_response_nonce_hashes_not_sorted");
});

test("response cannot outlive request, intake, template, or observation window", () => {
  const fixture = signedFixture();
  resign(fixture, (value) => { value.expiresAt = "2026-07-18T00:04:21.000Z"; });
  expectBlocked(fixture.packet, "outlives_upstream_window");
});

test("response lifetime is bounded", () => {
  const fixture = signedFixture();
  resign(fixture, (value) => { value.expiresAt = "2026-07-18T00:04:10.000Z"; });
  expectBlocked(fixture.packet, "lifetime_invalid");
});

test("inverted response chronology is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.expiresAt = "2026-07-18T00:03:04.000Z"; });
  expectBlocked(fixture.packet, "lifetime_invalid");
});

test("observation window drift is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.observationWindowStartsAt = "2026-07-18T00:03:01.000Z"; });
  expectBlocked(fixture.packet, "observation_window_binding_mismatch");
});

test("expired response is rejected", () => {
  const fixture = signedFixture(); fixture.packet.evaluationClockInstant = "2026-07-18T00:04:00.000Z";
  expectBlocked(fixture.packet, "evaluation_time_invalid");
});

test("denied decision cannot produce authority", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.decision = "denied"; });
  expectBlocked(fixture.packet, "decision_scope_role_invalid");
});

test("wrong response scope is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.approvalScope = "other"; });
  expectBlocked(fixture.packet, "decision_scope_role_invalid");
});

test("wrong response role is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.approverRole = "other"; });
  expectBlocked(fixture.packet, "decision_scope_role_invalid");
});

test("operation order drift is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.requestedOperationSet.reverse(); });
  expectBlocked(fixture.packet, "operation_scope_invalid");
});

test("observation count drift is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.maximumObservationCount = 2; });
  expectBlocked(fixture.packet, "operation_scope_invalid");
});

test("false attestation is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.attestations.noSqlAuthorityGranted = false; });
  expectBlocked(fixture.packet, "attestations_invalid");
});

test("missing attestation is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { delete value.attestations.requestReviewed; });
  expectBlocked(fixture.packet, "attestations_invalid");
});

test("extra attestation is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.attestations.extra = true; });
  expectBlocked(fixture.packet, "attestations_invalid");
});

test("malformed signer identity hash is rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.signerIdentityHash = "invalid"; });
  expectBlocked(fixture.packet, "hash_invalid:signerIdentityHash");
});

test("recording or raw-material claims are rejected", () => {
  const fixture = signedFixture(); resign(fixture, (value) => { value.realApprovalRecorded = true; });
  expectBlocked(fixture.packet, "synthetic_boundary_invalid");
});

test("verification policy tampering is rejected", () => {
  const { packet } = signedFixture(); packet.context.verificationPolicy.maximumObservationCount = 2;
  expectBlocked(packet, "verification_policy");
});

test("authority and summary seal all authorities false", () => {
  const { packet } = signedFixture();
  const result = subject.evaluateSignedLiveObservationApprovalPackage(packet);
  const authority = clone(result.observationAuthorityPackage);
  authority.sqlExecutionAuthorized = true;
  assert.ok(subject.validateObservationAuthorityPackage(authority, packet.approvalResponse, packet.context)
    .some((issue) => issue.includes("sqlExecutionAuthorized")));
  const summary = clone(result.approvalVerificationSummary);
  summary.environmentObservationAuthorized = true;
  assert.ok(subject.validateSummary(summary, packet.approvalResponse, packet.context,
    result.observationAuthorityPackage).some((issue) => issue.includes("environmentObservationAuthorized")));
});

test("core has no signing, filesystem, environment, network, DB, or execution capability", () => {
  const source = readFileSync(path.join(__dirname,
    "lib/metrics-cutover-live-observation-approval-response.cjs"), "utf8");
  assert.doesNotMatch(source, /generateKeyPair|\bsign\s*[:(]|node:fs|process\.env|fetch\s*\(|https?:\/\/|postgres|child_process|execFile|spawn\s*\(/i);
  assert.match(source, /createPublicKey/);
  assert.match(source, /verifySignature/);
});
