"use strict";

const { generateKeyPairSync, sign } = require("node:crypto");
const stepX = require("../lib/metrics-cutover-controlled-observation-evidence-reconciliation.cjs");
const stepXFixture = require("./metrics-cutover-controlled-observation-evidence-reconciliation-fixture.cjs");
const subject = require("../lib/metrics-cutover-production-approval-envelope.cjs");

const EVALUATION_CLOCK = "2026-07-18T00:03:27.000Z";
const APPROVER_KEYS = generateKeyPairSync("ed25519");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function pem(keys = APPROVER_KEYS) {
  return keys.publicKey.export({ type: "spki", format: "pem" });
}
function signerFromAllowlist(allowlist) {
  const entry = allowlist.entries[0];
  return { signerKeyId: entry.signerKeyId,
    signerSanitizedIdentityHash: entry.signerSanitizedIdentityHash,
    publicKeyFingerprintSha256: entry.publicKeyFingerprintSha256 };
}
function signApprovalBody(body, privateKey = APPROVER_KEYS.privateKey) {
  const unsigned = subject.sealUnsignedApprovalBody(body);
  const signatureBase64 = sign(null,
    subject.buildApprovalSignaturePayload(unsigned), privateKey).toString("base64");
  return subject.sealSignedProductionCutoverApproval(unsigned, signatureBase64);
}
function resealApproval(approval, overrides = {}, privateKey = APPROVER_KEYS.privateKey) {
  const body = Object.fromEntries(subject.APPROVAL_BODY_FIELDS.map((field) =>
    [field, Object.prototype.hasOwnProperty.call(overrides, field)
      ? overrides[field] : clone(approval[field])]));
  return signApprovalBody(body, privateKey);
}
function resealAllowlist(allowlist) {
  const body = Object.fromEntries(subject.ALLOWLIST_FIELDS.slice(0, 4).map(
    (field) => [field, clone(allowlist[field])]));
  const idHash = subject.hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_ID\0", body);
  const withId = { ...body,
    productionCutoverApproverAllowlistId: `step114-2x-y-cutover-allowlist-${idHash}` };
  return { ...withId, productionCutoverApproverAllowlistHash: subject.hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_HASH\0", withId) };
}

let cached;
function buildFixture() {
  if (cached) return cached;
  const x = stepXFixture.buildFixture();
  const stepXResult = stepX.evaluateControlledObservationEvidence(x.packet);
  if (stepXResult.status !== stepX.PUBLIC_STATES[1]) {
    throw new Error(`step_x_fixture_invalid:${stepXResult.blockingIssues.join(",")}`);
  }
  const allowlist = subject.buildProductionCutoverApproverAllowlist(pem());
  const body = subject.buildApprovalBody(x.packet, stepXResult,
    signerFromAllowlist(allowlist), [], EVALUATION_CLOCK);
  const approval = signApprovalBody(body);
  const packet = {
    mergedMainSha: subject.MERGED_MAIN_SHA,
    stepXPacket: x.packet, stepXResult,
    productionCutoverApproverAllowlist: allowlist,
    signedProductionCutoverApproval: approval,
    priorApprovalNonceHashes: [], evaluationClockInstant: EVALUATION_CLOCK,
  };
  cached = { packet, stepXFixture: x, stepXResult, allowlist, approval,
    approverKeys: APPROVER_KEYS };
  return cached;
}

module.exports = {
  APPROVER_KEYS, EVALUATION_CLOCK, buildFixture, clone, pem,
  resealAllowlist, resealApproval, signApprovalBody, signerFromAllowlist,
};
