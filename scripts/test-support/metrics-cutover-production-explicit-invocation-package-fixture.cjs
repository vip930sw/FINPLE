"use strict";

const { generateKeyPairSync, sign } = require("node:crypto");
const stepZA = require("../lib/metrics-cutover-production-runtime-ceremony.cjs");
const stepZAFixture = require("./metrics-cutover-production-runtime-ceremony-fixture.cjs");
const subject = require("../lib/metrics-cutover-production-explicit-invocation-package.cjs");

const EVALUATION_CLOCK = "2026-07-18T00:03:29.000Z";
const OPERATOR_KEYS = generateKeyPairSync("ed25519");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function pem(keys = OPERATOR_KEYS) {
  return keys.publicKey.export({ type: "spki", format: "pem" });
}
function signerFromAllowlist(allowlist) {
  const entry = allowlist.entries[0];
  return {
    signerKeyId: entry.signerKeyId,
    signerSanitizedIdentityHash: entry.signerSanitizedIdentityHash,
    publicKeyFingerprintSha256: entry.publicKeyFingerprintSha256,
  };
}
function signAuthorizationBody(body, privateKey = OPERATOR_KEYS.privateKey) {
  const unsigned = subject.sealUnsignedOperatorAuthorization(body);
  const signatureBase64 = sign(null,
    subject.buildOperatorAuthorizationSignaturePayload(unsigned), privateKey)
    .toString("base64");
  return subject.sealSignedOperatorAuthorization(unsigned, signatureBase64);
}
function resealAuthorization(authorization, overrides = {},
  privateKey = OPERATOR_KEYS.privateKey) {
  const body = Object.fromEntries(subject.AUTHORIZATION_BODY_FIELDS.map((field) =>
    [field, Object.prototype.hasOwnProperty.call(overrides, field)
      ? overrides[field] : clone(authorization[field])]));
  return signAuthorizationBody(body, privateKey);
}
function resealAllowlist(allowlist) {
  const body = Object.fromEntries(subject.ALLOWLIST_FIELDS.slice(0, 4).map((field) =>
    [field, clone(allowlist[field])]));
  const idHash = subject.hashContract(
    "FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_ID\0", body);
  const withId = { ...body,
    operatorAllowlistId: `step114-2x-zb-operator-allowlist-${idHash}` };
  return { ...withId, operatorAllowlistHash: subject.hashContract(
    "FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_HASH\0", withId) };
}

let cachedZA;
function baseZA() {
  if (cachedZA) return cachedZA;
  const za = stepZAFixture.buildFixture();
  const result = stepZA.evaluateProductionCutoverRuntimeCeremony(za.packet);
  if (result.status !== stepZA.PUBLIC_STATES[1]) {
    throw new Error(`step_za_fixture_invalid:${result.blockingIssues.join(",")}`);
  }
  cachedZA = { za, result };
  return cachedZA;
}

function buildFixture(options = {}) {
  const { za, result } = baseZA();
  const stepZAPacket = options.stepZAPacket || za.packet;
  const stepZAResult = options.stepZAResult || result;
  const operatorKeys = options.operatorKeys || OPERATOR_KEYS;
  const allowlist = options.allowlist || subject.buildProductionCutoverOperatorAllowlist(
    pem(operatorKeys), options.allowlistOverrides);
  const core = subject.buildInvocationPackageCore(stepZAResult);
  const priorAuthorizationNonceHashes = options.priorAuthorizationNonceHashes || [];
  const evaluationClockInstant = options.evaluationClockInstant || EVALUATION_CLOCK;
  const body = subject.buildOperatorAuthorizationBody(stepZAPacket, core,
    signerFromAllowlist(allowlist), priorAuthorizationNonceHashes,
    evaluationClockInstant, options.authorizationOverrides);
  const authorization = options.authorization ||
    signAuthorizationBody(body, operatorKeys.privateKey);
  const packet = {
    mergedMainSha: options.mergedMainSha || subject.MERGED_MAIN_SHA,
    stepZAPacket, stepZAResult,
    productionCutoverOperatorAllowlist: allowlist,
    signedOperatorAuthorization: authorization,
    priorAuthorizationNonceHashes, evaluationClockInstant,
  };
  return { packet, calls: za.calls, zaBase: za, stepZAResult: result,
    allowlist, authorization, operatorKeys, core };
}

function commandInput(result, built) {
  const stepZExecutionPacket = built.packet.stepZAPacket.stepZPacket;
  return {
    invocationPackage: result.invocationPackage,
    signedOperatorAuthorization: built.packet.signedOperatorAuthorization,
    productionCutoverOperatorAllowlist:
      built.packet.productionCutoverOperatorAllowlist,
    priorAuthorizationNonceHashes: built.packet.priorAuthorizationNonceHashes,
    evaluationClockInstant: built.packet.evaluationClockInstant,
    stepZAPacket: built.packet.stepZAPacket,
    stepZExecutionPacket,
    ...Object.fromEntries(subject.EXPLICIT_DEPENDENCY_NAMES.slice(7).map((name) =>
      [name, stepZExecutionPacket[name]])),
  };
}

function resealInvocationPackage(invocationPackage, overrides = {}) {
  const body = { ...clone(invocationPackage), ...overrides };
  delete body.sealedInvocationPackageHash;
  return { ...body, sealedInvocationPackageHash: subject.hashContract(
    "FINPLE_STEP114_2X_ZB_SEALED_INVOCATION_PACKAGE_HASH\0", body) };
}

module.exports = {
  EVALUATION_CLOCK, OPERATOR_KEYS, baseZA, buildFixture, clone, commandInput, pem,
  resealAllowlist, resealAuthorization, resealInvocationPackage,
  signAuthorizationBody, signerFromAllowlist,
};
