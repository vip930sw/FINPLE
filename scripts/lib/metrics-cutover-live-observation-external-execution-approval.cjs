"use strict";

const { createHash, createPublicKey, verify } = require("node:crypto");
const stepT = require("./metrics-cutover-live-observation-controlled-runner.cjs");
const stepU = require("./metrics-cutover-live-observation-execution-ceremony.cjs");

const MERGED_MAIN_SHA = "d35aa87ff381343ce386609ac3f5a0a81fd4b46f";
const VERSION = "finple.step114-2x-v.external-execution-approval.v1";
const ROLE = "metrics_live_observation_external_execution_approver";
const SCOPE = "authorize_exactly_one_controlled_read_only_observation_execution";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_APPROVAL_LIFETIME_SECONDS = 300;
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_execution_approval",
  "signed_single_use_external_execution_envelope_verified",
  "blocked",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "externalExecutionPerformed", "runnerInvoked", "capabilityMethodInvoked",
  "providerMutationAllowed", "productionMutationAllowed", "automaticRetryAllowed",
  "fallbackAllowed", "automaticTriggerAllowed", "runtimeRouteAdded", "cronAdded",
  "workerAdded", "deploymentWorkflowChanged", "rawMaterialPresent",
]);
const APPROVAL_BODY_FIELDS = Object.freeze([
  "contractVersion", "mergedMainSha", "stepUEvidenceHandoffManifestId",
  "stepUEvidenceHandoffManifestHash", "stepURuntimeMaterialManifestId",
  "stepURuntimeMaterialManifestHash", "stepURuntimeMaterialInventoryId",
  "stepURuntimeMaterialInventoryHash", "operationPlan", "operationPlanHash",
  "oneRunRunnerLaunchPackageId", "oneRunRunnerLaunchPackageHash",
  "ceremonyNonceHash", "priorNonceContextDigest", "executionConfirmationId",
  "executionConfirmationHash", "operatorAuthorizationId", "operatorAuthorizationHash",
  "invocationId", "invocationHash", "executionLeaseRequestId", "claimRequestId",
  "destinationCount", "observationCount", "approvalRole", "approvalScope",
  "signerKeyId", "signerSanitizedIdentityHash", "signerPublicKeyFingerprintSha256",
  "approvalNonceHash", "issuedAt", "expiresAt", "evaluationClockInstant",
  "upstreamEffectiveExpiresAt", "effectiveExecutionExpiresAt", "automaticRetryAllowed",
  "fallbackAllowed", "automaticTriggerAllowed", "runtimeRouteAllowed", "cronAllowed",
  "workerAllowed", "deploymentWorkflowAllowed", "providerMutationAllowed",
  "productionMutationAllowed", "rawMaterialPresent",
]);
const APPROVAL_FIELDS = Object.freeze([
  ...APPROVAL_BODY_FIELDS.slice(0, 1), "externalExecutionApprovalId",
  ...APPROVAL_BODY_FIELDS.slice(1), "signatureAlgorithm", "signatureBase64",
  "externalExecutionApprovalHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId", "signerSanitizedIdentityHash", "publicKeyPem",
  "publicKeyFingerprintSha256", "allowedRole", "allowedScope",
  "signatureAlgorithm", "revoked", "validFrom", "validUntil",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "externalExecutionApproverAllowlistId", "entries",
  "exactlyOneSignerRequired", "rawMaterialPresent",
  "externalExecutionApproverAllowlistHash",
]);

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
function canonicalEqual(left, right) { return canonicalJson(left) === canonicalJson(right); }
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}
function exactKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...keys].sort());
}
function exactOrderedKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value), keys);
}
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isSafeId(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._:-]{7,159}$/.test(value);
}
function parseInstant(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value
    ? milliseconds : null;
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function zeroCapabilityCounts() {
  return Object.fromEntries(stepT.CAPABILITY_NAMES.map((name) => [name, 0]));
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: status === PUBLIC_STATES[2],
    stepUValidated: overrides.stepUValidated || false,
    stepTValidated: overrides.stepTValidated || false,
    stepSValidated: overrides.stepSValidated || false,
    signatureVerified: overrides.signatureVerified || false,
    signerSeparationValidated: overrides.signerSeparationValidated || false,
    nonceValidated: overrides.nonceValidated || false,
    chronologyValidated: overrides.chronologyValidated || false,
    capabilityInvocationCounts: zeroCapabilityCounts(),
    singleUseExecutionEnvelope: overrides.singleUseExecutionEnvelope || {},
    executionEnvelopeSummary: overrides.executionEnvelopeSummary || {},
    ...fixedFalse(),
  });
}
function nested(stepSPackage) {
  const stepRPacket = stepSPackage.inputPacket.context.upstream;
  const stepQPacket = stepRPacket.upstream.stepQPacket;
  const stepPPacket = stepQPacket.context.upstream.stepPPacket;
  const stepOPacket = stepPPacket.context.upstream.stepOPacket;
  const stepNPacket = stepOPacket.context.upstream.stepNPacket;
  return { stepQPacket, stepNPacket };
}
function publicKeyMaterial(publicKeyPem) {
  const publicKey = createPublicKey(publicKeyPem);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("not_ed25519");
  const der = publicKey.export({ type: "spki", format: "der" });
  return { publicKey, fingerprint: sha256(der) };
}
function decodeCanonicalBase64(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.toString("base64") === value ? decoded : null;
  } catch { return null; }
}

function buildExternalExecutionApproverAllowlist(publicKeyPem, overrides = {}) {
  const { fingerprint } = publicKeyMaterial(publicKeyPem);
  const entry = {
    signerKeyId: "synthetic-step-v-external-execution-approver-key",
    signerSanitizedIdentityHash: "f".repeat(64), publicKeyPem,
    publicKeyFingerprintSha256: fingerprint, allowedRole: ROLE, allowedScope: SCOPE,
    signatureAlgorithm: SIGNATURE_ALGORITHM, revoked: false,
    validFrom: "2026-07-18T00:00:00.000Z", validUntil: "2026-07-18T00:10:00.000Z",
    ...(overrides.entry || {}),
  };
  const body = {
    contractVersion: "finple.step114-2x-v.external-execution-approver-allowlist.v1",
    externalExecutionApproverAllowlistId:
      "step114-2x-v-external-execution-approver-allowlist",
    entries: [entry], exactlyOneSignerRequired: true, rawMaterialPresent: false,
    ...overrides,
  };
  delete body.entry;
  return { ...body, externalExecutionApproverAllowlistHash: hashContract(
    "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVER_ALLOWLIST_HASH\0", body) };
}

function normalizeApproverAllowlist(value) {
  const issues = [];
  if (!exactOrderedKeys(value, ALLOWLIST_FIELDS)) {
    return { entries: [], issues: ["external_execution_approver_allowlist_fields_invalid"] };
  }
  const hashBody = { ...value }; delete hashBody.externalExecutionApproverAllowlistHash;
  if (value.contractVersion !==
      "finple.step114-2x-v.external-execution-approver-allowlist.v1" ||
      !isSafeId(value.externalExecutionApproverAllowlistId) ||
      value.externalExecutionApproverAllowlistHash !== hashContract(
        "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVER_ALLOWLIST_HASH\0", hashBody)) {
    issues.push("external_execution_approver_allowlist_seal_invalid");
  }
  if (!Array.isArray(value.entries) || value.entries.length !== 1 ||
      value.exactlyOneSignerRequired !== true || value.rawMaterialPresent !== false) {
    issues.push("external_execution_approver_allowlist_policy_invalid");
  }
  const entries = [];
  for (const entry of Array.isArray(value.entries) ? value.entries : []) {
    if (!exactOrderedKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push("external_execution_approver_allowlist_entry_fields_invalid"); continue;
    }
    let material = null;
    try { material = publicKeyMaterial(entry.publicKeyPem); }
    catch { issues.push("external_execution_approver_public_key_invalid"); }
    const validFrom = parseInstant(entry.validFrom); const validUntil = parseInstant(entry.validUntil);
    if (!isSafeId(entry.signerKeyId) || !isSha(entry.signerSanitizedIdentityHash) ||
        !isSha(entry.publicKeyFingerprintSha256) ||
        material?.fingerprint !== entry.publicKeyFingerprintSha256 ||
        entry.allowedRole !== ROLE || entry.allowedScope !== SCOPE ||
        entry.signatureAlgorithm !== SIGNATURE_ALGORITHM || entry.revoked !== false ||
        validFrom === null || validUntil === null || validFrom >= validUntil) {
      issues.push("external_execution_approver_allowlist_entry_invalid");
    }
    if (material) entries.push({ ...entry, ...material, validFromMs: validFrom,
      validUntilMs: validUntil });
  }
  return { entries: issues.length ? [] : entries, issues: uniqueSorted(issues) };
}

function directValidateStepU(stepUPacket, suppliedResult) {
  const issues = [];
  const rebuilt = stepU.evaluateExecutionCeremony(stepUPacket);
  if (rebuilt.status !== stepU.PUBLIC_STATES[1] || !rebuilt.ok) {
    issues.push(...rebuilt.blockingIssues.map((issue) => `step_u:${issue}`));
  }
  if (!canonicalEqual(rebuilt, suppliedResult)) issues.push("step_u_result_canonical_mismatch");
  issues.push(...stepU.validateMergedStepTContract());
  issues.push(...stepT.validateDirectStepSPackage(stepUPacket.stepSPackage)
    .map((issue) => `step_s:${issue}`));
  issues.push(...stepU.validateRuntimeCapabilities(stepUPacket.runtimeCapabilities));
  issues.push(...stepU.validateRuntimeMaterial(stepUPacket.runtimeMaterial,
    stepUPacket.stepSPackage, stepUPacket.runtimeCapabilities,
    stepUPacket.evaluationClockInstant, stepUPacket.priorCeremonyNonceHashes));
  issues.push(...stepU.validateChecklistConfirmations(
    stepUPacket.operatorChecklistConfirmations));
  issues.push(...stepU.validateRuntimeMaterialInventory(suppliedResult.runtimeMaterialInventory,
    stepUPacket.stepSPackage, stepUPacket.runtimeCapabilities, stepUPacket.runtimeMaterial));
  issues.push(...stepU.validateRuntimeMaterialManifest(suppliedResult.runtimeMaterialManifest,
    stepUPacket.stepSPackage, stepUPacket.runtimeMaterial,
    suppliedResult.runtimeMaterialInventory, stepUPacket.priorCeremonyNonceHashes));
  const expectedChecklist = stepU.buildOperatorChecklist(
    stepUPacket.operatorChecklistConfirmations);
  if (!canonicalEqual(suppliedResult.operatorChecklist, expectedChecklist)) {
    issues.push("step_u_operator_checklist_canonical_mismatch");
  }
  const expectedEvidence = stepU.buildEvidenceHandoffManifest(stepUPacket.stepSPackage,
    suppliedResult.runtimeMaterialInventory, suppliedResult.runtimeMaterialManifest,
    expectedChecklist);
  if (!canonicalEqual(suppliedResult.evidenceHandoffManifest, expectedEvidence)) {
    issues.push("step_u_evidence_handoff_canonical_mismatch");
  }
  const expectedPlan = stepT.buildOperationPlan(stepUPacket.stepSPackage
    .oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash);
  const expectedPlanHash = stepT.hashOperationPlan(expectedPlan);
  if (expectedPlan.length !== 21 ||
      !canonicalEqual(stepUPacket.runtimeMaterial.operationPlan, expectedPlan) ||
      suppliedResult.runtimeMaterialManifest.operationPlanHash !== expectedPlanHash ||
      suppliedResult.runtimeMaterialInventory.operationPlanHash !== expectedPlanHash ||
      suppliedResult.evidenceHandoffManifest.operationPlanHash !== expectedPlanHash) {
    issues.push("step_t_operation_plan_binding_invalid");
  }
  return { issues: uniqueSorted(issues), rebuilt, expectedPlan, expectedPlanHash };
}

function buildApprovalBody(stepUPacket, stepUResult, signer, overrides = {}) {
  const launch = stepUPacket.stepSPackage.oneRunRunnerLaunchPackage;
  const identities = stepUPacket.runtimeMaterial.singleUseIdentities;
  const material = stepUResult.runtimeMaterialManifest;
  const inventory = stepUResult.runtimeMaterialInventory;
  const evidence = stepUResult.evidenceHandoffManifest;
  const body = {
    contractVersion: "finple.step114-2x-v.signed-external-execution-approval.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepUEvidenceHandoffManifestId: evidence.evidenceHandoffManifestId,
    stepUEvidenceHandoffManifestHash: evidence.evidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: material.runtimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: material.runtimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: inventory.runtimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: inventory.runtimeMaterialInventoryHash,
    operationPlan: stepUPacket.runtimeMaterial.operationPlan,
    operationPlanHash: material.operationPlanHash,
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    ceremonyNonceHash: material.ceremonyNonceHash,
    priorNonceContextDigest: material.priorNonceContextDigest,
    executionConfirmationId: identities.executionConfirmationId,
    executionConfirmationHash: identities.executionConfirmationHash,
    operatorAuthorizationId: identities.operatorAuthorizationId,
    operatorAuthorizationHash: identities.operatorAuthorizationHash,
    invocationId: identities.invocationId, invocationHash: identities.invocationHash,
    executionLeaseRequestId: identities.executionLeaseRequestId,
    claimRequestId: identities.claimRequestId,
    destinationCount: 1, observationCount: 1, approvalRole: ROLE, approvalScope: SCOPE,
    signerKeyId: signer.signerKeyId,
    signerSanitizedIdentityHash: signer.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: signer.publicKeyFingerprintSha256,
    approvalNonceHash: "b".repeat(64), issuedAt: "2026-07-18T00:03:23.000Z",
    expiresAt: "2026-07-18T00:03:40.000Z",
    evaluationClockInstant: "2026-07-18T00:03:24.000Z",
    upstreamEffectiveExpiresAt: material.effectiveExpiry,
    effectiveExecutionExpiresAt: null, automaticRetryAllowed: false,
    fallbackAllowed: false, automaticTriggerAllowed: false, runtimeRouteAllowed: false,
    cronAllowed: false, workerAllowed: false, deploymentWorkflowAllowed: false,
    providerMutationAllowed: false, productionMutationAllowed: false,
    rawMaterialPresent: false, ...overrides,
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, "effectiveExecutionExpiresAt")) {
    body.effectiveExecutionExpiresAt = new Date(Math.min(Date.parse(body.expiresAt),
      Date.parse(body.upstreamEffectiveExpiresAt))).toISOString();
  }
  return body;
}
function sealUnsignedApprovalBody(body) {
  const externalExecutionApprovalId = `step114-2x-v-external-execution-approval-${
    hashContract("FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVAL_ID\0", body)}`;
  return { contractVersion: body.contractVersion, externalExecutionApprovalId,
    ...Object.fromEntries(APPROVAL_BODY_FIELDS.slice(1).map((field) => [field, body[field]])) };
}
function buildApprovalSignaturePayload(unsignedApproval) {
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVAL_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedApproval), "utf8"),
  ]);
}
function sealSignedExternalExecutionApproval(unsignedApproval, signatureBase64) {
  const signed = { ...unsignedApproval, signatureAlgorithm: SIGNATURE_ALGORITHM,
    signatureBase64 };
  return { ...signed, externalExecutionApprovalHash: hashContract(
    "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVAL_HASH\0", signed) };
}

function expectedApprovalBody(stepUPacket, stepUResult, approval, evaluationClockInstant) {
  const fields = Object.fromEntries(APPROVAL_BODY_FIELDS.map((field) =>
    [field, approval[field]]));
  return buildApprovalBody(stepUPacket, stepUResult, {
    signerKeyId: approval.signerKeyId,
    signerSanitizedIdentityHash: approval.signerSanitizedIdentityHash,
    publicKeyFingerprintSha256: approval.signerPublicKeyFingerprintSha256,
  }, {
    approvalNonceHash: approval.approvalNonceHash, issuedAt: approval.issuedAt,
    expiresAt: approval.expiresAt, evaluationClockInstant,
  });
}

function validateSignedExternalExecutionApproval(value, allowlist, stepUPacket,
  stepUResult, priorApprovalNonceHashes, evaluationClockInstant) {
  const issues = [];
  if (!exactOrderedKeys(value, APPROVAL_FIELDS)) {
    return ["external_execution_approval_fields_or_order_invalid"];
  }
  const normalized = normalizeApproverAllowlist(allowlist);
  issues.push(...normalized.issues);
  const body = expectedApprovalBody(stepUPacket, stepUResult, value,
    evaluationClockInstant);
  if (!canonicalEqual(Object.fromEntries(APPROVAL_BODY_FIELDS.map((field) =>
    [field, value[field]])), body)) issues.push("external_execution_approval_upstream_binding_mismatch");
  const expectedUnsigned = sealUnsignedApprovalBody(body);
  const actualUnsigned = { ...value };
  delete actualUnsigned.signatureAlgorithm; delete actualUnsigned.signatureBase64;
  delete actualUnsigned.externalExecutionApprovalHash;
  if (!canonicalEqual(actualUnsigned, expectedUnsigned)) {
    issues.push("external_execution_approval_id_or_binding_invalid");
  }
  const signed = { ...value }; delete signed.externalExecutionApprovalHash;
  if (value.externalExecutionApprovalHash !== hashContract(
    "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVAL_HASH\0", signed)) {
    issues.push("external_execution_approval_hash_invalid");
  }
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    issues.push("external_execution_approval_algorithm_invalid");
  }
  const matches = normalized.entries.filter((entry) =>
    entry.signerKeyId === value.signerKeyId &&
    entry.signerSanitizedIdentityHash === value.signerSanitizedIdentityHash &&
    entry.fingerprint === value.signerPublicKeyFingerprintSha256 &&
    entry.allowedRole === value.approvalRole && entry.allowedScope === value.approvalScope &&
    entry.revoked === false);
  if (matches.length !== 1) issues.push("external_execution_approval_signer_resolution_failed");
  const signature = decodeCanonicalBase64(value.signatureBase64);
  let signatureValid = false;
  if (signature?.length === 64 && matches.length === 1) {
    try { signatureValid = verify(null, buildApprovalSignaturePayload(expectedUnsigned),
      matches[0].publicKey, signature); } catch { signatureValid = false; }
  }
  if (!signatureValid) {
    issues.push("external_execution_approval_signature_invalid");
  }
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const evaluation = parseInstant(evaluationClockInstant);
  const upstreamEvaluation = parseInstant(stepUPacket.evaluationClockInstant);
  const upstreamExpiry = parseInstant(stepUResult.runtimeMaterialManifest.effectiveExpiry);
  if (issued === null || expires === null || evaluation === null || upstreamEvaluation === null ||
      upstreamExpiry === null || issued < upstreamEvaluation || issued > evaluation ||
      evaluation >= expires || evaluation >= upstreamExpiry || issued >= expires ||
      expires - issued > MAXIMUM_APPROVAL_LIFETIME_SECONDS * 1000 ||
      value.evaluationClockInstant !== evaluationClockInstant ||
      value.upstreamEffectiveExpiresAt !== stepUResult.runtimeMaterialManifest.effectiveExpiry ||
      value.effectiveExecutionExpiresAt !== new Date(Math.min(expires, upstreamExpiry))
        .toISOString()) {
    issues.push("external_execution_approval_chronology_or_expiry_invalid");
  }
  if (matches.length === 1 && (issued < matches[0].validFromMs ||
      expires > matches[0].validUntilMs)) {
    issues.push("external_execution_approval_signer_validity_invalid");
  }
  if (!Array.isArray(priorApprovalNonceHashes) ||
      priorApprovalNonceHashes.some((item) => !isSha(item)) ||
      new Set(priorApprovalNonceHashes).size !== priorApprovalNonceHashes.length ||
      !canonicalEqual(priorApprovalNonceHashes, [...priorApprovalNonceHashes].sort())) {
    issues.push("prior_external_execution_approval_nonce_context_invalid");
  } else if (!isSha(value.approvalNonceHash) ||
      priorApprovalNonceHashes.includes(value.approvalNonceHash) ||
      value.approvalNonceHash === stepUResult.runtimeMaterialManifest.ceremonyNonceHash) {
    issues.push("external_execution_approval_nonce_invalid_or_replayed");
  }
  const { stepQPacket, stepNPacket } = nested(stepUPacket.stepSPackage);
  const operator = stepQPacket.operatorAuthorization;
  const confirmation = stepUPacket.stepSPackage.inputPacket.executionConfirmation;
  const invocation = stepNPacket.invocation;
  let invokerFingerprint = null;
  try {
    const invokerEntry = stepNPacket.context.invokerAllowlist.entries.find((entry) =>
      entry.invokerKeyId === invocation.invokerKeyId);
    invokerFingerprint = publicKeyMaterial(invokerEntry.publicKeyPem).fingerprint;
  } catch { issues.push("step_n_invoker_fingerprint_unavailable"); }
  if (value.signerKeyId === invocation.invokerKeyId ||
      value.signerSanitizedIdentityHash === invocation.invokerIdentityHash ||
      value.signerPublicKeyFingerprintSha256 === invokerFingerprint) {
    issues.push("external_execution_approver_invoker_separation_failed");
  }
  if (value.signerKeyId === operator.operatorKeyId ||
      value.signerSanitizedIdentityHash === operator.operatorIdentityHash ||
      value.signerPublicKeyFingerprintSha256 ===
        confirmation.executionOperatorPublicKeyFingerprint ||
      value.signerKeyId === confirmation.operatorKeyId ||
      value.signerSanitizedIdentityHash === confirmation.operatorIdentityHash) {
    issues.push("external_execution_approver_operator_separation_failed");
  }
  return uniqueSorted(issues);
}

function buildSingleUseExecutionEnvelope(stepUPacket, stepUResult, approval, allowlist) {
  const launch = stepUPacket.stepSPackage.oneRunRunnerLaunchPackage;
  const identities = stepUPacket.runtimeMaterial.singleUseIdentities;
  const body = {
    contractVersion: "finple.step114-2x-v.single-use-execution-envelope.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    externalExecutionApprovalId: approval.externalExecutionApprovalId,
    externalExecutionApprovalHash: approval.externalExecutionApprovalHash,
    externalExecutionApproverAllowlistId: allowlist.externalExecutionApproverAllowlistId,
    externalExecutionApproverAllowlistHash: allowlist.externalExecutionApproverAllowlistHash,
    approvalRole: approval.approvalRole, approvalScope: approval.approvalScope,
    signerKeyId: approval.signerKeyId,
    signerSanitizedIdentityHash: approval.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: approval.signerPublicKeyFingerprintSha256,
    stepUEvidenceHandoffManifestId: approval.stepUEvidenceHandoffManifestId,
    stepUEvidenceHandoffManifestHash: approval.stepUEvidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: approval.stepURuntimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: approval.stepURuntimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: approval.stepURuntimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: approval.stepURuntimeMaterialInventoryHash,
    operationPlan: approval.operationPlan, operationPlanHash: approval.operationPlanHash,
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    ceremonyNonceHash: approval.ceremonyNonceHash,
    priorNonceContextDigest: approval.priorNonceContextDigest,
    approvalNonceHash: approval.approvalNonceHash,
    executionConfirmationId: identities.executionConfirmationId,
    executionConfirmationHash: identities.executionConfirmationHash,
    operatorAuthorizationId: identities.operatorAuthorizationId,
    operatorAuthorizationHash: identities.operatorAuthorizationHash,
    invocationId: identities.invocationId, invocationHash: identities.invocationHash,
    executionLeaseRequestId: identities.executionLeaseRequestId,
    claimRequestId: identities.claimRequestId,
    destinationCount: 1, observationCount: 1,
    approvalIssuedAt: approval.issuedAt, approvalExpiresAt: approval.expiresAt,
    approvalEvaluationClockInstant: approval.evaluationClockInstant,
    upstreamEffectiveExpiresAt: stepUResult.runtimeMaterialManifest.effectiveExpiry,
    effectiveExecutionExpiresAt: approval.effectiveExecutionExpiresAt,
    singleUse: true, externalExecutionPerformed: false, runnerInvoked: false,
    capabilityMethodInvoked: false, providerMutationAllowed: false,
    productionMutationAllowed: false, automaticRetryAllowed: false,
    fallbackAllowed: false, automaticTriggerAllowed: false, runtimeRouteAdded: false,
    cronAdded: false, workerAdded: false, deploymentWorkflowChanged: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_V_SINGLE_USE_EXECUTION_ENVELOPE_ID\0",
    body);
  const withId = { contractVersion: body.contractVersion,
    singleUseExecutionEnvelopeId: `step114-2x-v-single-use-execution-envelope-${idHash}`,
    ...Object.fromEntries(Object.entries(body).slice(1)) };
  return { ...withId, singleUseExecutionEnvelopeHash: hashContract(
    "FINPLE_STEP114_2X_V_SINGLE_USE_EXECUTION_ENVELOPE_HASH\0", withId) };
}
function validateSingleUseExecutionEnvelope(value, stepUPacket, stepUResult, approval,
  allowlist) {
  return canonicalEqual(value, buildSingleUseExecutionEnvelope(stepUPacket, stepUResult,
    approval, allowlist)) ? [] : ["single_use_execution_envelope_invalid"];
}
function buildExecutionEnvelopeSummary(envelope) {
  const body = {
    contractVersion: "finple.step114-2x-v.execution-envelope-summary.v1",
    singleUseExecutionEnvelopeId: envelope.singleUseExecutionEnvelopeId,
    singleUseExecutionEnvelopeHash: envelope.singleUseExecutionEnvelopeHash,
    externalExecutionApprovalId: envelope.externalExecutionApprovalId,
    externalExecutionApprovalHash: envelope.externalExecutionApprovalHash,
    operationPlanHash: envelope.operationPlanHash,
    effectiveExecutionExpiresAt: envelope.effectiveExecutionExpiresAt,
    destinationCount: 1, observationCount: 1, stepUValidated: true,
    stepTValidated: true, stepSValidated: true, signatureVerified: true,
    signerSeparationValidated: true, nonceValidated: true, chronologyValidated: true,
    singleUse: true, externalExecutionPerformed: false, runnerInvoked: false,
    capabilityMethodInvoked: false, providerMutationAllowed: false,
    productionMutationAllowed: false, automaticRetryAllowed: false,
    fallbackAllowed: false, automaticTriggerAllowed: false, runtimeRouteAdded: false,
    cronAdded: false, workerAdded: false, deploymentWorkflowChanged: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_V_EXECUTION_ENVELOPE_SUMMARY_ID\0", body);
  const withId = { ...body,
    executionEnvelopeSummaryId: `step114-2x-v-execution-envelope-summary-${idHash}` };
  return { ...withId, executionEnvelopeSummaryHash: hashContract(
    "FINPLE_STEP114_2X_V_EXECUTION_ENVELOPE_SUMMARY_HASH\0", withId) };
}
function validateExecutionEnvelopeSummary(value, envelope) {
  return canonicalEqual(value, buildExecutionEnvelopeSummary(envelope))
    ? [] : ["execution_envelope_summary_invalid"];
}

function evaluateExternalExecutionApproval(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, ["mergedMainSha", "stepUPacket", "stepUCeremonyResult",
    "externalExecutionApproverAllowlist", "externalExecutionApproval",
    "priorApprovalNonceHashes", "evaluationClockInstant"])) {
    return safeResult(PUBLIC_STATES[2], { blockingIssues: ["step_v_packet_fields_invalid"] });
  }
  const issues = [];
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) issues.push("merged_main_sha_mismatch");
  const direct = directValidateStepU(packet.stepUPacket, packet.stepUCeremonyResult);
  issues.push(...direct.issues);
  const approvalIssues = direct.issues.length ? [] : validateSignedExternalExecutionApproval(
    packet.externalExecutionApproval, packet.externalExecutionApproverAllowlist,
    packet.stepUPacket, packet.stepUCeremonyResult, packet.priorApprovalNonceHashes,
    packet.evaluationClockInstant);
  issues.push(...approvalIssues);
  const uniqueIssues = uniqueSorted(issues);
  if (uniqueIssues.length) return safeResult(PUBLIC_STATES[2], {
    blockingIssues: uniqueIssues,
    stepUValidated: direct.issues.length === 0,
    stepTValidated: direct.issues.length === 0,
    stepSValidated: direct.issues.length === 0,
  });
  const envelope = buildSingleUseExecutionEnvelope(packet.stepUPacket,
    packet.stepUCeremonyResult, packet.externalExecutionApproval,
    packet.externalExecutionApproverAllowlist);
  const envelopeIssues = validateSingleUseExecutionEnvelope(envelope, packet.stepUPacket,
    packet.stepUCeremonyResult, packet.externalExecutionApproval,
    packet.externalExecutionApproverAllowlist);
  const summary = buildExecutionEnvelopeSummary(envelope);
  const summaryIssues = validateExecutionEnvelopeSummary(summary, envelope);
  if (envelopeIssues.length || summaryIssues.length) return safeResult(PUBLIC_STATES[2], {
    blockingIssues: [...envelopeIssues, ...summaryIssues], stepUValidated: true,
    stepTValidated: true, stepSValidated: true,
  });
  return safeResult(PUBLIC_STATES[1], {
    stepUValidated: true, stepTValidated: true, stepSValidated: true,
    signatureVerified: true, signerSeparationValidated: true,
    nonceValidated: true, chronologyValidated: true,
    singleUseExecutionEnvelope: envelope, executionEnvelopeSummary: summary,
  });
}

module.exports = {
  ALLOWLIST_ENTRY_FIELDS, ALLOWLIST_FIELDS, APPROVAL_BODY_FIELDS, APPROVAL_FIELDS,
  FIXED_FALSE_FIELDS, MAXIMUM_APPROVAL_LIFETIME_SECONDS, MERGED_MAIN_SHA,
  PUBLIC_STATES, ROLE, SCOPE, SIGNATURE_ALGORITHM, VERSION,
  buildApprovalBody, buildApprovalSignaturePayload,
  buildExecutionEnvelopeSummary, buildExternalExecutionApproverAllowlist,
  buildSingleUseExecutionEnvelope, canonicalJson, directValidateStepU,
  evaluateExternalExecutionApproval, hashContract, normalizeApproverAllowlist,
  safeResult, sealSignedExternalExecutionApproval, sealUnsignedApprovalBody,
  validateExecutionEnvelopeSummary, validateSignedExternalExecutionApproval,
  validateSingleUseExecutionEnvelope,
};
