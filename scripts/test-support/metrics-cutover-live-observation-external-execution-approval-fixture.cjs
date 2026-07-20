"use strict";

const { generateKeyPairSync, sign } = require("node:crypto");
const stepU = require("../lib/metrics-cutover-live-observation-execution-ceremony.cjs");
const stepUFixture = require("./metrics-cutover-live-observation-execution-ceremony-fixture.cjs");
const subject = require("../lib/metrics-cutover-live-observation-external-execution-approval.cjs");

const CLOCK = "2026-07-18T00:03:24.000Z";
const EXTERNAL_APPROVER_KEYS = generateKeyPairSync("ed25519");
const pem = (keys) => keys.publicKey.export({ type: "spki", format: "pem" });

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function signerFromAllowlist(allowlist) {
  const entry = allowlist.entries[0];
  return { signerKeyId: entry.signerKeyId,
    signerSanitizedIdentityHash: entry.signerSanitizedIdentityHash,
    publicKeyFingerprintSha256: entry.publicKeyFingerprintSha256 };
}
function signApprovalBody(body, privateKey = EXTERNAL_APPROVER_KEYS.privateKey) {
  const unsigned = subject.sealUnsignedApprovalBody(body);
  return subject.sealSignedExternalExecutionApproval(unsigned,
    sign(null, subject.buildApprovalSignaturePayload(unsigned), privateKey)
      .toString("base64"));
}
function resealApproval(approval, overrides = {}, options = {}) {
  const body = Object.fromEntries(subject.APPROVAL_BODY_FIELDS.map((field) =>
    [field, Object.prototype.hasOwnProperty.call(overrides, field)
      ? overrides[field] : approval[field]]));
  return signApprovalBody(body, options.privateKey || EXTERNAL_APPROVER_KEYS.privateKey);
}
function rehashApprovalWithoutResigning(approval, overrides = {}) {
  const body = Object.fromEntries(subject.APPROVAL_BODY_FIELDS.map((field) =>
    [field, Object.prototype.hasOwnProperty.call(overrides, field)
      ? overrides[field] : approval[field]]));
  const unsigned = subject.sealUnsignedApprovalBody(body);
  return subject.sealSignedExternalExecutionApproval(unsigned, approval.signatureBase64);
}
function resealAllowlist(allowlist, overrides = {}) {
  const body = { ...clone(allowlist), ...overrides };
  delete body.externalExecutionApproverAllowlistHash;
  return { ...body, externalExecutionApproverAllowlistHash: subject.hashContract(
    "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVER_ALLOWLIST_HASH\0", body) };
}
function buildFixture(options = {}) {
  const stepUBuilt = stepUFixture.buildFixture(options.stepUOptions || {});
  const stepUCeremonyResult = options.stepUCeremonyResult ||
    stepU.evaluateExecutionCeremony(stepUBuilt.packet);
  if (!stepUCeremonyResult.ok) throw new Error(JSON.stringify(
    stepUCeremonyResult.blockingIssues));
  const allowlist = options.externalExecutionApproverAllowlist ||
    subject.buildExternalExecutionApproverAllowlist(pem(EXTERNAL_APPROVER_KEYS),
      options.allowlistOverrides || {});
  const body = subject.buildApprovalBody(stepUBuilt.packet, stepUCeremonyResult,
    signerFromAllowlist(allowlist), {
      evaluationClockInstant: options.evaluationClockInstant || CLOCK,
      ...(options.approvalOverrides || {}),
    });
  const approval = options.externalExecutionApproval || signApprovalBody(body);
  const packet = {
    mergedMainSha: options.mergedMainSha || subject.MERGED_MAIN_SHA,
    stepUPacket: options.stepUPacket || stepUBuilt.packet,
    stepUCeremonyResult,
    externalExecutionApproverAllowlist: allowlist,
    externalExecutionApproval: approval,
    priorApprovalNonceHashes: options.priorApprovalNonceHashes || [],
    evaluationClockInstant: options.evaluationClockInstant || CLOCK,
  };
  return { packet, calls: stepUBuilt.calls, stepSPackage: stepUBuilt.stepSPackage,
    externalApproverKeys: EXTERNAL_APPROVER_KEYS };
}

module.exports = {
  CLOCK, EXTERNAL_APPROVER_KEYS, buildFixture, clone, pem,
  rehashApprovalWithoutResigning, resealAllowlist, resealApproval,
  signApprovalBody, signerFromAllowlist,
};
