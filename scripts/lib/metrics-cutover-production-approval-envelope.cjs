"use strict";

const {
  createHash, createPublicKey, verify,
} = require("node:crypto");
const stepX = require("./metrics-cutover-controlled-observation-evidence-reconciliation.cjs");
const productionPreparation = require("./metrics-cutover-production-execution-preparation.cjs");

const MERGED_MAIN_SHA = "9964a7a5dbabb3dcacd4f3a99d2564480e93b30c";
const VERSION = "finple.step114-2x-y.production-cutover-approval-envelope.v1";
const ROLE = "metrics_production_cutover_approver";
const SCOPE = "authorize_exactly_one_bound_production_metrics_csv_cutover";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_APPROVAL_LIFETIME_SECONDS = 300;
const ALLOWED_CLOCK_SKEW_SECONDS = 0;
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_production_cutover_approval",
  "signed_single_use_production_cutover_envelope_verified",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_step_x_validation",
  "blocked_during_cutover_identity_validation",
  "blocked_during_approval_verification",
  "manual_review_required",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "cutoverExecutorInvoked", "productionWritePerformed",
  "selectorMutationPerformed", "loaderActivationAuthorized",
  "loaderActivationPerformed", "deploymentAuthorized",
  "deploymentPerformed", "automaticRetryAllowed",
  "secondCutoverAttemptAllowed", "rawMaterialPresent",
]);
const INPUT_FIELDS = Object.freeze([
  "mergedMainSha", "stepXPacket", "stepXResult",
  "productionCutoverApproverAllowlist", "signedProductionCutoverApproval",
  "priorApprovalNonceHashes", "evaluationClockInstant",
]);
const APPROVAL_BODY_FIELDS = Object.freeze([
  "contractVersion", "mergedMainSha",
  "stepXReconciledEvidenceManifestId", "stepXReconciledEvidenceManifestHash",
  "stepXProductionCutoverReadinessPackageId",
  "stepXProductionCutoverReadinessPackageHash",
  "stepXProductionCutoverReadinessSummaryId",
  "stepXProductionCutoverReadinessSummaryHash",
  "stepWCloseoutReceiptId", "stepWCloseoutReceiptHash",
  "stepWEnvelopeClaimId", "stepWEnvelopeClaimHash",
  "stepWClaimTerminalizationHash",
  "stepVApprovalId", "stepVApprovalHash", "stepVEnvelopeId", "stepVEnvelopeHash",
  "stepUEvidenceHandoffId", "stepUEvidenceHandoffHash",
  "stepURuntimeMaterialManifestId", "stepURuntimeMaterialManifestHash",
  "stepURuntimeMaterialInventoryId", "stepURuntimeMaterialInventoryHash",
  "stepTReceiptId", "stepTReceiptHash", "stepTEvidenceId", "stepTEvidenceHash",
  "stepTClosureId", "stepTClosureHash", "stepTOperationPlanHash",
  "stepSLaunchPackageId", "stepSLaunchPackageHash",
  "productionCutoverIdentityManifest", "productionCsvTargets",
  "selectorPreimageSha256", "selectorExpectedPostimageSha256",
  "repositoryPreimageSha256", "repositoryTreeSha", "repositoryHeadSha",
  "authorityPackageId", "authorityPackageHash",
  "invocationId", "invocationHash", "invocationReceiptId", "invocationReceiptHash",
  "targetAbsenceAttestationHash", "noDriftAttestationHash",
  "futureCutoverOperationOrder", "maximumProductionCsvReplacementCount",
  "maximumSelectorMutationCount", "maximumLoaderActivationCount",
  "maximumDeploymentCount", "approvalNonceHash", "priorApprovalNonceContextDigest",
  "upstreamNonceContextDigest", "issuedAt", "expiresAt",
  "evaluationClockInstant", "upstreamEffectiveExpiresAt", "effectiveCutoverExpiresAt",
  "signerKeyId", "signerSanitizedIdentityHash",
  "signerPublicKeyFingerprintSha256", "role", "scope", "signatureAlgorithm",
  "syntheticValidationOnly", ...FIXED_FALSE_FIELDS,
]);
const APPROVAL_FIELDS = Object.freeze([
  APPROVAL_BODY_FIELDS[0], "productionCutoverApprovalId",
  ...APPROVAL_BODY_FIELDS.slice(1), "signatureBase64", "productionCutoverApprovalHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId", "signerSanitizedIdentityHash", "publicKeyPem",
  "publicKeyFingerprintSha256", "allowedRole", "allowedScope",
  "validFrom", "validUntil", "revoked",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "entries", "syntheticValidationOnly", "rawMaterialPresent",
  "productionCutoverApproverAllowlistId", "productionCutoverApproverAllowlistHash",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null);
}
function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  throw new TypeError("unsupported_canonical_value");
}
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isSafeId(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._:-]{7,159}$/.test(value) &&
    value !== "*";
}
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function exactOrderedKeys(value, fields) {
  return isRecord(value) && canonicalEqual(Object.keys(value), fields);
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function zeroCounts() {
  return {
    cutoverExecutorInvocationCount: 0, productionCsvReplacementCount: 0,
    selectorMutationCount: 0, loaderActivationCount: 0, deploymentCount: 0,
  };
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: overrides.manualReviewRequired === true,
    stepXDirectlyValidated: overrides.stepXDirectlyValidated === true,
    productionCutoverIdentityReconciled:
      overrides.productionCutoverIdentityReconciled === true,
    approvalVerified: overrides.approvalVerified === true,
    signerSeparationValidated: overrides.signerSeparationValidated === true,
    nonceValidated: overrides.nonceValidated === true,
    chronologyValidated: overrides.chronologyValidated === true,
    productionCutoverApproval: overrides.productionCutoverApproval || {},
    singleUseProductionCutoverEnvelope:
      overrides.singleUseProductionCutoverEnvelope || {},
    ...zeroCounts(), ...fixedFalse(),
  });
}
function block(classification, issue, manualReviewRequired = false, overrides = {}) {
  return safeResult(PUBLIC_STATES[2], {
    ...overrides, failureClassification: classification,
    blockingIssues: [issue], manualReviewRequired,
  });
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
    return decoded.length > 0 && decoded.toString("base64") === value ? decoded : null;
  } catch { return null; }
}

function buildProductionCutoverApproverAllowlist(publicKeyPem, overrides = {}) {
  const { fingerprint } = publicKeyMaterial(publicKeyPem);
  const entry = {
    signerKeyId: "synthetic-step-y-production-cutover-approver-key",
    signerSanitizedIdentityHash: "9".repeat(64), publicKeyPem,
    publicKeyFingerprintSha256: fingerprint, allowedRole: ROLE, allowedScope: SCOPE,
    validFrom: "2026-07-18T00:03:00.000Z",
    validUntil: "2026-07-18T00:04:00.000Z", revoked: false,
    ...(overrides.entry || {}),
  };
  const body = {
    contractVersion: "finple.step114-2x-y.production-cutover-approver-allowlist.v1",
    entries: overrides.entries || [entry], syntheticValidationOnly: true,
    rawMaterialPresent: false, ...(overrides.contract || {}),
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_ID\0", body);
  const withId = { ...body,
    productionCutoverApproverAllowlistId: `step114-2x-y-cutover-allowlist-${idHash}` };
  return deepFreeze({ ...withId, productionCutoverApproverAllowlistHash: hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_HASH\0", withId) });
}

function normalizeApproverAllowlist(value) {
  const issues = [];
  if (!exactOrderedKeys(value, ALLOWLIST_FIELDS)) {
    return { issues: ["production_cutover_approver_allowlist_fields_invalid"], entries: [] };
  }
  const body = Object.fromEntries(ALLOWLIST_FIELDS.slice(0, 4).map((field) =>
    [field, value[field]]));
  const idHash = hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_ID\0", body);
  if (value.productionCutoverApproverAllowlistId !==
      `step114-2x-y-cutover-allowlist-${idHash}` ||
      value.productionCutoverApproverAllowlistHash !== hashContract(
        "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVER_ALLOWLIST_HASH\0",
        { ...body, productionCutoverApproverAllowlistId:
          `step114-2x-y-cutover-allowlist-${idHash}` })) {
    issues.push("production_cutover_approver_allowlist_seal_invalid");
  }
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false ||
      !Array.isArray(value.entries) || value.entries.length !== 1) {
    issues.push("production_cutover_approver_allowlist_exact_resolution_invalid");
  }
  const ids = new Set(); const identities = new Set(); const fingerprints = new Set();
  const entries = [];
  for (const [index, entry] of (Array.isArray(value.entries) ? value.entries : []).entries()) {
    const prefix = `production_cutover_approver_allowlist_entry_${index}`;
    if (!exactOrderedKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`); continue;
    }
    if (!isSafeId(entry.signerKeyId) || ids.has(entry.signerKeyId)) {
      issues.push(`${prefix}_key_id_invalid_or_duplicate`);
    } else ids.add(entry.signerKeyId);
    if (!isSha(entry.signerSanitizedIdentityHash) ||
        identities.has(entry.signerSanitizedIdentityHash)) {
      issues.push(`${prefix}_identity_invalid_or_duplicate`);
    } else identities.add(entry.signerSanitizedIdentityHash);
    let material = null;
    try { material = publicKeyMaterial(entry.publicKeyPem); }
    catch { issues.push(`${prefix}_public_key_invalid`); }
    if (!material || material.fingerprint !== entry.publicKeyFingerprintSha256 ||
        fingerprints.has(entry.publicKeyFingerprintSha256)) {
      issues.push(`${prefix}_public_key_fingerprint_invalid_or_duplicate`);
    } else fingerprints.add(entry.publicKeyFingerprintSha256);
    if (entry.allowedRole !== ROLE || entry.allowedScope !== SCOPE) {
      issues.push(`${prefix}_role_or_scope_invalid`);
    }
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (from === null || until === null || until <= from || entry.revoked !== false) {
      issues.push(`${prefix}_validity_or_revocation_invalid`);
    }
    entries.push({ ...entry, publicKey: material?.publicKey || null,
      fingerprint: material?.fingerprint || null, validFromMs: from, validUntilMs: until });
  }
  return { issues: uniqueSorted(issues), entries: issues.length ? [] : entries };
}

function directValidateStepX(stepXPacket, stepXResult) {
  const issues = [];
  if (!isRecord(stepXPacket) ||
      !canonicalEqual(Object.keys(stepXPacket).sort(), [...stepX.INPUT_FIELDS].sort())) {
    return { issues: ["step_x_packet_fields_invalid"] };
  }
  let chain; let observation; let cutover; let bound; let manifest; let readiness; let summary;
  try { chain = stepX.validateStepWChain(stepXPacket); }
  catch { return { issues: ["step_x_chain_validation_failed"] }; }
  issues.push(...chain.issues);
  issues.push(...stepX.validateNonceContext(stepXPacket.priorReconciliationNonceHashes,
    stepXPacket.reconciliationNonceHash, stepXPacket.stepWPacket));
  try { observation = stepX.validateObservationReconciliation(stepXPacket, chain); }
  catch { issues.push("step_x_observation_validation_failed"); }
  if (observation) issues.push(...observation.issues);
  try { cutover = stepX.validateProductionCutoverEvidence(
    stepXPacket.productionCutoverEvidence); }
  catch { issues.push("step_x_cutover_validation_failed"); }
  if (cutover) issues.push(...cutover.issues);
  if (cutover?.issues.length === 0 && cutover.expectedIdentities) {
    try {
      bound = {
        executionPackage: stepXPacket.productionCutoverEvidence.prepared
          .packageB.executionPackage,
        receipt: stepXPacket.productionCutoverEvidence.verification.invocationReceipt,
      };
      if (!canonicalEqual(stepX.buildCanonicalProductionCutoverIdentities(bound),
        cutover.expectedIdentities)) {
        issues.push("step_x_cutover_identity_reconstruction_mismatch");
      }
    } catch { issues.push("step_x_cutover_identity_reconstruction_failed"); }
  }
  try {
    manifest = stepX.buildReconciledEvidenceManifest(stepXPacket, chain, observation,
      cutover.expectedIdentities);
    readiness = stepX.buildProductionCutoverReadinessPackage(manifest);
    summary = stepX.buildReadinessSummary(readiness);
    issues.push(...stepX.validateReconciledEvidenceManifest(
      stepXResult?.reconciledEvidenceManifest, stepXPacket, chain, observation,
      cutover.expectedIdentities));
    issues.push(...stepX.validateProductionCutoverReadinessPackage(
      stepXResult?.productionCutoverReadinessPackage, manifest));
    issues.push(...stepX.validateReadinessSummary(
      stepXResult?.productionCutoverReadinessSummary, readiness));
  } catch { issues.push("step_x_canonical_result_reconstruction_failed"); }
  const expectedResult = manifest && readiness && summary ? stepX.safeResult(
    stepX.PUBLIC_STATES[1], {
      reconciledEvidenceManifest: manifest,
      productionCutoverReadinessPackage: readiness,
      productionCutoverReadinessSummary: summary,
    }) : null;
  if (!expectedResult || !canonicalEqual(stepXResult, expectedResult)) {
    issues.push("step_x_complete_result_invalid");
  }
  let evaluated;
  try { evaluated = stepX.evaluateControlledObservationEvidence(stepXPacket); }
  catch { issues.push("step_x_pure_evaluation_failed"); }
  if (!evaluated || !canonicalEqual(evaluated, expectedResult)) {
    issues.push("step_x_pure_evaluation_mismatch");
  }
  for (const field of stepX.FIXED_FALSE_FIELDS) {
    if (stepXResult?.[field] !== false) issues.push(`step_x_fixed_false_invalid:${field}`);
  }
  return { issues: uniqueSorted(issues), chain, observation, cutover, bound,
    manifest, readiness, summary };
}

function productionCsvTargets(bound, identities) {
  return bound.executionPackage.targetFiles.map((target, index) => ({
    role: target.role, market: target.market, targetPath: target.path,
    contentSha256: target.sha256, schemaVersion: target.schemaVersion,
    schemaIdentitySha256: identities.datasets[index].schemaIdentitySha256,
    datasetIdentityHash: identities.datasets[index].datasetIdentityHash,
    rowCount: target.rowCount, byteCount: target.byteSize,
    writeMode: target.writeMode,
  }));
}

function collectUpstreamNonceHashes(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectUpstreamNonceHashes(item, output);
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (/NonceHash$/.test(key) && isSha(child)) output.push(child);
      collectUpstreamNonceHashes(child, output);
    }
  }
  return uniqueSorted(output);
}

function findEntry(entries, field, value) {
  return Array.isArray(entries) ? entries.find((entry) => entry?.[field] === value) : null;
}
function entryFingerprint(entry) {
  try { return publicKeyMaterial(entry.publicKeyPem).fingerprint; } catch { return null; }
}
function buildUpstreamSignerIdentities(stepXPacket) {
  const stepVPacket = stepXPacket.stepWPacket.stepVPacket;
  const stepSPackage = stepVPacket.stepUPacket.stepSPackage;
  const stepRPacket = stepSPackage.inputPacket.context.upstream;
  const stepQPacket = stepRPacket.upstream.stepQPacket;
  const stepPPacket = stepQPacket.context.upstream.stepPPacket;
  const stepOPacket = stepPPacket.context.upstream.stepOPacket;
  const stepNPacket = stepOPacket.context.upstream.stepNPacket;
  const stepMUpstream = stepNPacket.context.upstream;
  const stepMAuthority = stepMUpstream.stepMObservationAuthorityPackage;
  const stepMEntry = findEntry(stepMUpstream.stepMPacket.context.approverAllowlist.entries,
    "signerKeyId", stepMAuthority.signerKeyId);
  const invocation = stepNPacket.invocation;
  const stepNEntry = findEntry(stepNPacket.context.invokerAllowlist.entries,
    "invokerKeyId", invocation.invokerKeyId);
  const operator = stepQPacket.operatorAuthorization;
  const stepQEntry = findEntry(stepQPacket.context.operatorAllowlist.entries,
    "operatorKeyId", operator.operatorKeyId);
  const confirmation = stepSPackage.inputPacket.executionConfirmation;
  const stepVApproval = stepVPacket.externalExecutionApproval;
  const identities = [
    { role: "step_m_approver", keyId: stepMAuthority.signerKeyId,
      identityHash: stepMAuthority.signerIdentityHash,
      fingerprint: entryFingerprint(stepMEntry) },
    { role: "step_n_invoker", keyId: invocation.invokerKeyId,
      identityHash: invocation.invokerIdentityHash,
      fingerprint: entryFingerprint(stepNEntry) },
    { role: "step_q_operator", keyId: operator.operatorKeyId,
      identityHash: operator.operatorIdentityHash,
      fingerprint: entryFingerprint(stepQEntry) },
    { role: "step_s_execution_confirmer", keyId: confirmation.operatorKeyId,
      identityHash: confirmation.operatorIdentityHash,
      fingerprint: confirmation.executionOperatorPublicKeyFingerprint },
    { role: "step_v_external_observation_approver", keyId: stepVApproval.signerKeyId,
      identityHash: stepVApproval.signerSanitizedIdentityHash,
      fingerprint: stepVApproval.signerPublicKeyFingerprintSha256 },
  ];
  if (identities.some((entry) => !isSafeId(entry.keyId) ||
      !isSha(entry.identityHash) || !isSha(entry.fingerprint))) {
    throw new TypeError("upstream_signer_identity_unavailable");
  }
  return identities;
}

function upstreamEffectiveExpiry(stepXPacket) {
  const stepWPacket = stepXPacket.stepWPacket;
  const stepVPacket = stepWPacket.stepVPacket;
  const values = [
    stepWPacket.stepVResult?.singleUseExecutionEnvelope?.effectiveExecutionExpiresAt,
    stepVPacket.stepUCeremonyResult?.runtimeMaterialManifest?.effectiveExpiry,
    stepVPacket.stepUPacket?.stepSPackage?.oneRunRunnerLaunchPackage?.earliestExpiry,
  ].filter((value) => parseInstant(value) !== null);
  if (values.length !== 3) throw new TypeError("upstream_effective_expiry_unavailable");
  return new Date(Math.min(...values.map(Date.parse))).toISOString();
}

function buildCriticalBindings(stepXPacket, stepXResult, direct) {
  const manifest = stepXResult.reconciledEvidenceManifest;
  const readiness = stepXResult.productionCutoverReadinessPackage;
  const summary = stepXResult.productionCutoverReadinessSummary;
  const identities = direct.cutover.expectedIdentities;
  return {
    stepXReconciledEvidenceManifestId: manifest.reconciledEvidenceManifestId,
    stepXReconciledEvidenceManifestHash: manifest.reconciledEvidenceManifestHash,
    stepXProductionCutoverReadinessPackageId:
      readiness.productionCutoverReadinessPackageId,
    stepXProductionCutoverReadinessPackageHash:
      readiness.productionCutoverReadinessPackageHash,
    stepXProductionCutoverReadinessSummaryId:
      summary.productionCutoverReadinessSummaryId,
    stepXProductionCutoverReadinessSummaryHash:
      summary.productionCutoverReadinessSummaryHash,
    stepWCloseoutReceiptId: manifest.stepWCloseoutReceiptId,
    stepWCloseoutReceiptHash: manifest.stepWCloseoutReceiptHash,
    stepWEnvelopeClaimId: manifest.stepWEnvelopeClaimId,
    stepWEnvelopeClaimHash: manifest.stepWEnvelopeClaimHash,
    stepWClaimTerminalizationHash: manifest.envelopeClaimTerminalizationHash,
    stepVApprovalId: manifest.externalExecutionApprovalId,
    stepVApprovalHash: manifest.externalExecutionApprovalHash,
    stepVEnvelopeId: manifest.singleUseExecutionEnvelopeId,
    stepVEnvelopeHash: manifest.singleUseExecutionEnvelopeHash,
    stepUEvidenceHandoffId: manifest.stepUEvidenceHandoffManifestId,
    stepUEvidenceHandoffHash: manifest.stepUEvidenceHandoffManifestHash,
    stepURuntimeMaterialManifestId: manifest.stepURuntimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: manifest.stepURuntimeMaterialManifestHash,
    stepURuntimeMaterialInventoryId: manifest.stepURuntimeMaterialInventoryId,
    stepURuntimeMaterialInventoryHash: manifest.stepURuntimeMaterialInventoryHash,
    stepTReceiptId: manifest.sanitizedExecutionReceiptId,
    stepTReceiptHash: manifest.sanitizedExecutionReceiptHash,
    stepTEvidenceId: manifest.sanitizedEvidenceId,
    stepTEvidenceHash: manifest.sanitizedEvidenceHash,
    stepTClosureId: manifest.executionClosureReceiptId,
    stepTClosureHash: manifest.executionClosureReceiptHash,
    stepTOperationPlanHash: manifest.operationPlanHash,
    stepSLaunchPackageId: manifest.stepSLaunchPackageId,
    stepSLaunchPackageHash: manifest.stepSLaunchPackageHash,
    productionCutoverIdentityManifest: identities,
    productionCsvTargets: productionCsvTargets(direct.bound, identities),
    selectorPreimageSha256: identities.selector.selectorPreimageSha256,
    selectorExpectedPostimageSha256: identities.selector.selectorPostimageSha256,
    repositoryPreimageSha256: identities.repository.repositoryPreimageSha256,
    repositoryTreeSha: identities.repository.repositoryTreeSha,
    repositoryHeadSha: identities.repository.repositoryHeadSha,
    authorityPackageId: identities.authority.authorityPackageId,
    authorityPackageHash: identities.authority.authorityPackageHash,
    invocationId: identities.invocation.invocationId,
    invocationHash: identities.invocation.invocationHash,
    invocationReceiptId: identities.invocation.invocationReceiptId,
    invocationReceiptHash: identities.invocation.invocationReceiptHash,
    targetAbsenceAttestationHash:
      identities.attestations.targetAbsenceAttestationHash,
    noDriftAttestationHash: identities.attestations.noDriftAttestationHash,
    futureCutoverOperationOrder: [...productionPreparation.OPERATION_ORDER],
    maximumProductionCsvReplacementCount: 2,
    maximumSelectorMutationCount: 1,
    maximumLoaderActivationCount: 0,
    maximumDeploymentCount: 0,
  };
}

function buildApprovalBody(stepXPacket, stepXResult, signer,
  priorApprovalNonceHashes, evaluationClockInstant, overrides = {}) {
  const direct = directValidateStepX(stepXPacket, stepXResult);
  if (direct.issues.length) throw new TypeError("step_x_packet_or_result_invalid");
  const upstreamExpiry = upstreamEffectiveExpiry(stepXPacket);
  const body = {
    contractVersion: "finple.step114-2x-y.production-cutover-approval.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    ...buildCriticalBindings(stepXPacket, stepXResult, direct),
    approvalNonceHash: hashContract(
      "FINPLE_STEP114_2X_Y_SYNTHETIC_FRESH_APPROVAL_NONCE\0", {
        mergedMainSha: MERGED_MAIN_SHA,
        stepXReconciledEvidenceManifestHash:
          stepXResult.reconciledEvidenceManifest.reconciledEvidenceManifestHash,
      }),
    priorApprovalNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_Y_PRIOR_APPROVAL_NONCE_CONTEXT\0", priorApprovalNonceHashes),
    upstreamNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_Y_UPSTREAM_NONCE_CONTEXT\0",
      collectUpstreamNonceHashes(stepXPacket)),
    issuedAt: "2026-07-18T00:03:26.500Z",
    expiresAt: "2026-07-18T00:03:35.000Z",
    evaluationClockInstant, upstreamEffectiveExpiresAt: upstreamExpiry,
    effectiveCutoverExpiresAt: null,
    signerKeyId: signer.signerKeyId,
    signerSanitizedIdentityHash: signer.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: signer.publicKeyFingerprintSha256,
    role: ROLE, scope: SCOPE, signatureAlgorithm: SIGNATURE_ALGORITHM,
    syntheticValidationOnly: true, ...fixedFalse(), ...overrides,
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, "effectiveCutoverExpiresAt")) {
    body.effectiveCutoverExpiresAt = new Date(Math.min(Date.parse(body.expiresAt),
      Date.parse(body.upstreamEffectiveExpiresAt))).toISOString();
  }
  return body;
}

function sealUnsignedApprovalBody(body) {
  if (!exactOrderedKeys(body, APPROVAL_BODY_FIELDS)) {
    throw new TypeError("production_cutover_approval_body_fields_invalid");
  }
  const idHash = hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVAL_ID\0", body);
  return {
    contractVersion: body.contractVersion,
    productionCutoverApprovalId: `step114-2x-y-production-cutover-approval-${idHash}`,
    ...Object.fromEntries(APPROVAL_BODY_FIELDS.slice(1).map((field) => [field, body[field]])),
  };
}
function buildApprovalSignaturePayload(unsignedApproval) {
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVAL_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedApproval), "utf8"),
  ]);
}
function sealSignedProductionCutoverApproval(unsignedApproval, signatureBase64) {
  const signed = { ...unsignedApproval, signatureBase64 };
  return deepFreeze({ ...signed, productionCutoverApprovalHash: hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVAL_HASH\0", signed) });
}

function validateNonceContext(prior, fresh, stepXPacket) {
  const issues = [];
  if (!Array.isArray(prior) || prior.some((value) => !isSha(value))) {
    issues.push("prior_step_y_approval_nonce_context_invalid");
  } else {
    if (new Set(prior).size !== prior.length) {
      issues.push("prior_step_y_approval_nonce_context_duplicate");
    }
    if (!canonicalEqual(prior, [...prior].sort())) {
      issues.push("prior_step_y_approval_nonce_context_unsorted");
    }
  }
  if (!isSha(fresh) || prior?.includes(fresh)) {
    issues.push("step_y_approval_nonce_invalid_or_replayed");
  }
  if (collectUpstreamNonceHashes(stepXPacket).includes(fresh)) {
    issues.push("step_y_approval_nonce_matches_upstream_nonce");
  }
  return uniqueSorted(issues);
}

function validateSignedProductionCutoverApproval(value, allowlist, stepXPacket,
  stepXResult, priorApprovalNonceHashes, evaluationClockInstant, direct) {
  const issues = [];
  if (!exactOrderedKeys(value, APPROVAL_FIELDS)) {
    return { issues: ["signed_production_cutover_approval_fields_invalid"] };
  }
  const normalized = normalizeApproverAllowlist(allowlist);
  issues.push(...normalized.issues);
  const matches = normalized.entries.filter((entry) =>
    entry.signerKeyId === value.signerKeyId &&
    entry.signerSanitizedIdentityHash === value.signerSanitizedIdentityHash &&
    entry.fingerprint === value.signerPublicKeyFingerprintSha256 &&
    entry.allowedRole === value.role && entry.allowedScope === value.scope &&
    entry.revoked === false);
  if (matches.length !== 1 || normalized.entries.length !== 1) {
    issues.push("production_cutover_approver_exact_resolution_failed");
  }
  let expectedBody = null; let expectedUnsigned = null;
  try {
    expectedBody = buildApprovalBody(stepXPacket, stepXResult, {
      signerKeyId: value.signerKeyId,
      signerSanitizedIdentityHash: value.signerSanitizedIdentityHash,
      publicKeyFingerprintSha256: value.signerPublicKeyFingerprintSha256,
    }, priorApprovalNonceHashes, evaluationClockInstant, {
      approvalNonceHash: value.approvalNonceHash,
      issuedAt: value.issuedAt, expiresAt: value.expiresAt,
      effectiveCutoverExpiresAt: value.effectiveCutoverExpiresAt,
    });
    expectedUnsigned = sealUnsignedApprovalBody(expectedBody);
  } catch { issues.push("production_cutover_approval_reconstruction_failed"); }
  const suppliedUnsigned = Object.fromEntries(APPROVAL_FIELDS.slice(0, -2).map(
    (field) => [field, value[field]]));
  if (!expectedUnsigned || !canonicalEqual(suppliedUnsigned, expectedUnsigned)) {
    issues.push("production_cutover_approval_binding_mismatch");
  }
  if (value.productionCutoverApprovalHash !== hashContract(
    "FINPLE_STEP114_2X_Y_PRODUCTION_CUTOVER_APPROVAL_HASH\0",
    { ...suppliedUnsigned, signatureBase64: value.signatureBase64 })) {
    issues.push("production_cutover_approval_hash_invalid");
  }
  const signature = decodeCanonicalBase64(value.signatureBase64);
  if (!signature || !expectedUnsigned || matches.length !== 1) {
    issues.push("production_cutover_approval_signature_invalid");
  } else {
    try {
      if (!verify(null, buildApprovalSignaturePayload(expectedUnsigned),
        matches[0].publicKey, signature)) {
        issues.push("production_cutover_approval_signature_invalid");
      }
    } catch { issues.push("production_cutover_approval_signature_invalid"); }
  }
  const nonceIssues = validateNonceContext(priorApprovalNonceHashes,
    value.approvalNonceHash, stepXPacket);
  issues.push(...nonceIssues);
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const evaluation = parseInstant(evaluationClockInstant);
  const upstreamExpiry = parseInstant(value.upstreamEffectiveExpiresAt);
  const effective = parseInstant(value.effectiveCutoverExpiresAt);
  if ([issued, expires, evaluation, upstreamExpiry, effective].includes(null) ||
      issued > evaluation + ALLOWED_CLOCK_SKEW_SECONDS * 1000 ||
      evaluation >= effective || effective !== Math.min(expires, upstreamExpiry) ||
      issued >= expires || expires - issued > MAXIMUM_APPROVAL_LIFETIME_SECONDS * 1000 ||
      value.evaluationClockInstant !== evaluationClockInstant) {
    issues.push("production_cutover_approval_chronology_or_expiry_invalid");
  }
  if (matches.length === 1 && (issued < matches[0].validFromMs ||
      expires > matches[0].validUntilMs || evaluation < matches[0].validFromMs ||
      evaluation >= matches[0].validUntilMs)) {
    issues.push("production_cutover_approver_outside_validity_interval");
  }
  try {
    const upstreamSigners = buildUpstreamSignerIdentities(stepXPacket);
    if (upstreamSigners.some((entry) => entry.keyId === value.signerKeyId ||
        entry.identityHash === value.signerSanitizedIdentityHash ||
        entry.fingerprint === value.signerPublicKeyFingerprintSha256)) {
      issues.push("production_cutover_approver_upstream_separation_failed");
    }
  } catch { issues.push("upstream_signer_separation_validation_failed"); }
  if (value.role !== ROLE || value.scope !== SCOPE ||
      value.signatureAlgorithm !== SIGNATURE_ALGORITHM ||
      value.syntheticValidationOnly !== true) {
    issues.push("production_cutover_approval_role_scope_or_algorithm_invalid");
  }
  for (const field of FIXED_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`production_cutover_approval_fixed_false_invalid:${field}`);
  }
  return { issues: uniqueSorted(issues), normalized, matches, expectedUnsigned,
    nonceValidated: nonceIssues.length === 0 };
}

function buildSingleUseProductionCutoverEnvelope(stepXPacket, stepXResult,
  approval, allowlist, direct) {
  const bindings = buildCriticalBindings(stepXPacket, stepXResult, direct);
  const body = {
    contractVersion: "finple.step114-2x-y.single-use-production-cutover-envelope.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    productionCutoverApprovalId: approval.productionCutoverApprovalId,
    productionCutoverApprovalHash: approval.productionCutoverApprovalHash,
    productionCutoverApprovalSignatureDigest: sha256(
      decodeCanonicalBase64(approval.signatureBase64)),
    signerPublicKeyFingerprintSha256: approval.signerPublicKeyFingerprintSha256,
    productionCutoverApproverAllowlistId:
      allowlist.productionCutoverApproverAllowlistId,
    productionCutoverApproverAllowlistHash:
      allowlist.productionCutoverApproverAllowlistHash,
    criticalBindings: bindings,
    approvalNonceHash: approval.approvalNonceHash,
    approvalNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_Y_APPROVAL_NONCE_CONTEXT\0", {
        approvalNonceHash: approval.approvalNonceHash,
        priorApprovalNonceContextDigest: approval.priorApprovalNonceContextDigest,
        upstreamNonceContextDigest: approval.upstreamNonceContextDigest,
      }),
    effectiveCutoverExpiresAt: approval.effectiveCutoverExpiresAt,
    maximumProductionCsvReplacementCount: 2, maximumSelectorMutationCount: 1,
    maximumLoaderActivationCount: 0, maximumDeploymentCount: 0,
    rollbackPreimageRestorationRequired: true, singleUse: true,
    approvalVerified: true, explicitInvocationRequired: true,
    separateReviewRequired: true, exactBoundPreimageRequired: true,
    productionWriteAuthorizedForLaterExplicitInvocation: true,
    ...zeroCounts(), ...fixedFalse(),
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_Y_SINGLE_USE_CUTOVER_ENVELOPE_ID\0", body);
  const withId = { ...body,
    singleUseProductionCutoverEnvelopeId:
      `step114-2x-y-single-use-production-cutover-envelope-${idHash}` };
  return deepFreeze({ ...withId, singleUseProductionCutoverEnvelopeHash: hashContract(
    "FINPLE_STEP114_2X_Y_SINGLE_USE_CUTOVER_ENVELOPE_HASH\0", withId) });
}
function validateSingleUseProductionCutoverEnvelope(value, stepXPacket,
  stepXResult, approval, allowlist, direct) {
  let expected;
  try { expected = buildSingleUseProductionCutoverEnvelope(stepXPacket, stepXResult,
    approval, allowlist, direct); }
  catch { return ["single_use_production_cutover_envelope_reconstruction_failed"]; }
  return canonicalEqual(value, expected) ? [] :
    ["single_use_production_cutover_envelope_invalid"];
}

function sanitizedApprovalSummary(approval) {
  return deepFreeze({
    productionCutoverApprovalId: approval.productionCutoverApprovalId,
    productionCutoverApprovalHash: approval.productionCutoverApprovalHash,
    signatureDigest: sha256(decodeCanonicalBase64(approval.signatureBase64)),
    signerPublicKeyFingerprintSha256: approval.signerPublicKeyFingerprintSha256,
    effectiveCutoverExpiresAt: approval.effectiveCutoverExpiresAt,
    role: approval.role, scope: approval.scope,
  });
}

function evaluateProductionCutoverApproval(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactOrderedKeys(packet, INPUT_FIELDS)) {
    return block(FAILURE_CLASSIFICATIONS[0], "step_y_packet_fields_invalid");
  }
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) {
    return block(FAILURE_CLASSIFICATIONS[0], "merged_main_sha_invalid");
  }
  let direct;
  try { direct = directValidateStepX(packet.stepXPacket, packet.stepXResult); }
  catch { return block(FAILURE_CLASSIFICATIONS[0], "step_x_direct_validation_failed"); }
  if (direct.issues.length) {
    return block(FAILURE_CLASSIFICATIONS[0], direct.issues[0]);
  }
  if (!direct.bound || !direct.cutover?.expectedIdentities) {
    return block(FAILURE_CLASSIFICATIONS[1], "cutover_identity_reconciliation_failed",
      false, { stepXDirectlyValidated: true });
  }
  let approval;
  try { approval = validateSignedProductionCutoverApproval(
    packet.signedProductionCutoverApproval,
    packet.productionCutoverApproverAllowlist, packet.stepXPacket,
    packet.stepXResult, packet.priorApprovalNonceHashes,
    packet.evaluationClockInstant, direct); }
  catch { return block(FAILURE_CLASSIFICATIONS[2], "approval_verification_failed",
    false, { stepXDirectlyValidated: true,
      productionCutoverIdentityReconciled: true }); }
  if (approval.issues.length) {
    const manual = approval.issues.some((issue) => /nonce|chronology|expiry/.test(issue));
    return block(manual ? FAILURE_CLASSIFICATIONS[3] : FAILURE_CLASSIFICATIONS[2],
      approval.issues[0], manual, { stepXDirectlyValidated: true,
        productionCutoverIdentityReconciled: true });
  }
  const envelope = buildSingleUseProductionCutoverEnvelope(packet.stepXPacket,
    packet.stepXResult, packet.signedProductionCutoverApproval,
    packet.productionCutoverApproverAllowlist, direct);
  const envelopeIssues = validateSingleUseProductionCutoverEnvelope(envelope,
    packet.stepXPacket, packet.stepXResult, packet.signedProductionCutoverApproval,
    packet.productionCutoverApproverAllowlist, direct);
  if (envelopeIssues.length) {
    return block(FAILURE_CLASSIFICATIONS[2], envelopeIssues[0], false,
      { stepXDirectlyValidated: true, productionCutoverIdentityReconciled: true });
  }
  return safeResult(PUBLIC_STATES[1], {
    stepXDirectlyValidated: true, productionCutoverIdentityReconciled: true,
    approvalVerified: true, signerSeparationValidated: true,
    nonceValidated: true, chronologyValidated: true,
    productionCutoverApproval: sanitizedApprovalSummary(
      packet.signedProductionCutoverApproval),
    singleUseProductionCutoverEnvelope: envelope,
  });
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS, ALLOWLIST_ENTRY_FIELDS, ALLOWLIST_FIELDS,
  APPROVAL_BODY_FIELDS, APPROVAL_FIELDS, FAILURE_CLASSIFICATIONS,
  FIXED_FALSE_FIELDS, INPUT_FIELDS, MAXIMUM_APPROVAL_LIFETIME_SECONDS,
  MERGED_MAIN_SHA, PUBLIC_STATES, ROLE, SCOPE, SIGNATURE_ALGORITHM, VERSION,
  buildApprovalBody, buildApprovalSignaturePayload, buildCriticalBindings,
  buildProductionCutoverApproverAllowlist, buildSingleUseProductionCutoverEnvelope,
  buildUpstreamSignerIdentities, canonicalJson, collectUpstreamNonceHashes,
  directValidateStepX, evaluateProductionCutoverApproval, hashContract,
  normalizeApproverAllowlist, safeResult, sanitizedApprovalSummary,
  sealSignedProductionCutoverApproval, sealUnsignedApprovalBody,
  validateNonceContext, validateSignedProductionCutoverApproval,
  validateSingleUseProductionCutoverEnvelope,
};
