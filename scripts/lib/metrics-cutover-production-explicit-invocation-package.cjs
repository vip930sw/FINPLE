"use strict";

const {
  createHash, createPublicKey, verify,
} = require("node:crypto");
const stepY = require("./metrics-cutover-production-approval-envelope.cjs");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./metrics-cutover-production-runtime-ceremony.cjs");

const MERGED_MAIN_SHA = "07117880d21adee760c145f7ae865703532c210c";
const VERSION = "finple.step114-2x-zb.production-explicit-invocation-package.v1";
const ROLE = "metrics_production_cutover_operator";
const SCOPE = "invoke_exactly_one_verified_production_metrics_csv_cutover";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS = 300;
const PUBLIC_STATES = Object.freeze([
  "awaiting_explicit_production_cutover_invocation_authorization",
  "explicit_production_cutover_invocation_package_verified",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_step_za_validation",
  "blocked_during_invocation_identity_validation",
  "blocked_during_operator_authorization_verification",
  "blocked_during_command_boundary_validation",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "productionCutoverExecuted", "cutoverExecutorInvoked", "capabilityMethodInvoked",
  "envelopeClaimAcquired", "envelopeClaimTerminalized", "cutoverReceiptPersisted",
  "productionWritePerformed", "selectorMutationPerformed", "rollbackInvoked",
  "loaderActivationPerformed", "deploymentPerformed", "providerAccessAllowed",
  "databaseAccessAllowed", "networkAccessAllowed", "credentialAccessAllowed",
  "sqlExecutionAllowed", "migrationAllowed", "scenarioAccessAllowed",
  "automaticInvocationAllowed", "automaticRetryAllowed",
  "secondCutoverAttemptAllowed", "fallbackAllowed", "runtimeRouteAdded",
  "cronAdded", "workerAdded", "triggerAdded", "workflowAdded",
  "rawMaterialPresent",
]);
const INPUT_FIELDS = Object.freeze([
  "mergedMainSha", "stepZAPacket", "stepZAResult",
  "productionCutoverOperatorAllowlist", "signedOperatorAuthorization",
  "priorAuthorizationNonceHashes", "evaluationClockInstant",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId", "signerSanitizedIdentityHash", "publicKeyPem",
  "publicKeyFingerprintSha256", "allowedRole", "allowedScope",
  "validFrom", "validUntil", "revoked",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "entries", "syntheticValidationOnly", "rawMaterialPresent",
  "operatorAllowlistId", "operatorAllowlistHash",
]);
const AUTHORIZATION_BODY_FIELDS = Object.freeze([
  "contractVersion", "mergedMainSha", "stepZAHandoffId", "stepZAHandoffHash",
  "invocationPackageId", "invocationPackageHash", "singleUseClaimNamespaceHash",
  "authorizationNonceHash", "priorAuthorizationNonceContextDigest",
  "upstreamNonceContextDigest", "issuedAt", "expiresAt", "effectiveExpiresAt",
  "evaluationClockInstant", "signerKeyId", "signerSanitizedIdentityHash",
  "signerPublicKeyFingerprintSha256", "role", "scope", "signatureAlgorithm",
  "syntheticValidationOnly", ...FIXED_FALSE_FIELDS,
]);
const AUTHORIZATION_FIELDS = Object.freeze([
  AUTHORIZATION_BODY_FIELDS[0], "operatorAuthorizationId",
  ...AUTHORIZATION_BODY_FIELDS.slice(1), "signatureBase64", "operatorAuthorizationHash",
]);
const PACKAGE_CORE_FIELDS = Object.freeze([
  "contractVersion", "mergedMainSha", "stepZAMergedMainSha", "stepZContractVersion",
  "stepZAHandoffId", "stepZAHandoffHash", "runtimeMaterialInventoryId",
  "runtimeMaterialInventoryHash", "chainIdentities", "capabilityInventory",
  "targetReadiness", "executionTrace", "executionTraceHash", "oneRunOperationPlan",
  "oneRunOperationPlanHash", "singleUseClaimNamespaceHash", "oneRunCommandIdentity",
  "expectedSanitizedArgumentsSchema", "fixedCapabilityTimeoutMilliseconds",
  "rollbackPreimageRestorationRequired", "receiptPersistenceRequired",
  "claimTerminalizationRequired", "effectiveExpiry", "singleUse",
  "explicitInvocationRequired", "dryValidationCompleted", ...FIXED_FALSE_FIELDS,
]);
const INVOCATION_PACKAGE_FIELDS = Object.freeze([
  PACKAGE_CORE_FIELDS[0], "invocationPackageId",
  ...PACKAGE_CORE_FIELDS.slice(1), "invocationPackageHash",
  "operatorAuthorizationId", "operatorAuthorizationHash",
  "operatorSignatureDigest", "operatorSignerIdentity",
  "sealedInvocationPackageHash",
]);
const EXPLICIT_DEPENDENCY_NAMES = Object.freeze([
  "invocationPackage", ...stepZ.CAPABILITY_NAMES,
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
  return typeof value === "string" && /^[a-z0-9][a-z0-9._:-]{7,255}$/.test(value);
}
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function exactKeys(value, fields) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...fields].sort());
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
function emptyInvocationCounts() {
  return Object.fromEntries(stepZ.CAPABILITY_NAMES.map((name) => [name, 0]));
}
function zeroCounts() {
  return {
    capabilityInvocationCounts: emptyInvocationCounts(),
    commandConstructionCount: 0, envelopeClaimAcquisitionCount: 0,
    envelopeClaimTerminalizationCount: 0, productionCsvReplacementCount: 0,
    selectorMutationCount: 0, cutoverReceiptPersistenceCount: 0,
    rollbackInvocationCount: 0,
  };
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: overrides.blockingIssues || [], manualReviewRequired: false,
    stepZADirectlyValidated: overrides.stepZADirectlyValidated === true,
    completeStepZAZYXWVUTSChainValidated:
      overrides.completeStepZAZYXWVUTSChainValidated === true,
    invocationIdentityValidated: overrides.invocationIdentityValidated === true,
    operatorAuthorizationVerified: overrides.operatorAuthorizationVerified === true,
    signerSeparationValidated: overrides.signerSeparationValidated === true,
    nonceValidated: overrides.nonceValidated === true,
    chronologyValidated: overrides.chronologyValidated === true,
    dryValidationCompleted: overrides.dryValidationCompleted === true,
    signedOperatorAuthorization: overrides.signedOperatorAuthorization || {},
    invocationPackage: overrides.invocationPackage || {},
    commandBoundary: overrides.commandBoundary || {},
    ...zeroCounts(), ...fixedFalse(),
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

function buildProductionCutoverOperatorAllowlist(publicKeyPem, overrides = {}) {
  const { fingerprint } = publicKeyMaterial(publicKeyPem);
  const entry = {
    signerKeyId: "synthetic-step-zb-production-cutover-operator-key",
    signerSanitizedIdentityHash: hashContract(
      "FINPLE_STEP114_2X_ZB_SYNTHETIC_OPERATOR_IDENTITY\0", "operator"),
    publicKeyPem, publicKeyFingerprintSha256: fingerprint,
    allowedRole: ROLE, allowedScope: SCOPE,
    validFrom: "2026-07-18T00:03:28.000Z",
    validUntil: "2026-07-18T00:04:00.000Z", revoked: false,
    ...(overrides.entry || {}),
  };
  const body = {
    contractVersion: "finple.step114-2x-zb.operator-allowlist.v1",
    entries: overrides.entries || [entry], syntheticValidationOnly: true,
    rawMaterialPresent: false, ...(overrides.contract || {}),
  };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_ID\0", body);
  const withId = { ...body,
    operatorAllowlistId: `step114-2x-zb-operator-allowlist-${idHash}` };
  return deepFreeze({ ...withId, operatorAllowlistHash: hashContract(
    "FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_HASH\0", withId) });
}

function normalizeOperatorAllowlist(value) {
  const issues = [];
  if (!exactKeys(value, ALLOWLIST_FIELDS)) {
    return { issues: ["operator_allowlist_fields_invalid"], entries: [] };
  }
  const body = Object.fromEntries(ALLOWLIST_FIELDS.slice(0, 4).map((field) =>
    [field, value[field]]));
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_ID\0", body);
  const expectedId = `step114-2x-zb-operator-allowlist-${idHash}`;
  if (value.operatorAllowlistId !== expectedId ||
      value.operatorAllowlistHash !== hashContract(
        "FINPLE_STEP114_2X_ZB_OPERATOR_ALLOWLIST_HASH\0",
        { ...body, operatorAllowlistId: expectedId })) {
    issues.push("operator_allowlist_seal_invalid");
  }
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false ||
      !Array.isArray(value.entries) || value.entries.length !== 1) {
    issues.push("operator_allowlist_exact_resolution_invalid");
  }
  const ids = new Set(); const identities = new Set(); const fingerprints = new Set();
  const entries = [];
  for (const [index, entry] of (Array.isArray(value.entries) ? value.entries : []).entries()) {
    const prefix = `operator_allowlist_entry_${index}`;
    if (!exactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`); continue;
    }
    if (!isSafeId(entry.signerKeyId) || ids.has(entry.signerKeyId) ||
        entry.signerKeyId.includes("*")) {
      issues.push(`${prefix}_key_id_invalid_duplicate_or_wildcard`);
    } else ids.add(entry.signerKeyId);
    if (!isSha(entry.signerSanitizedIdentityHash) ||
        identities.has(entry.signerSanitizedIdentityHash)) {
      issues.push(`${prefix}_identity_invalid_or_duplicate`);
    } else identities.add(entry.signerSanitizedIdentityHash);
    let material = null;
    try { material = publicKeyMaterial(entry.publicKeyPem); }
    catch { issues.push(`${prefix}_public_key_invalid_or_not_ed25519`); }
    if (!material || material.fingerprint !== entry.publicKeyFingerprintSha256 ||
        fingerprints.has(entry.publicKeyFingerprintSha256)) {
      issues.push(`${prefix}_fingerprint_invalid_or_duplicate`);
    } else fingerprints.add(entry.publicKeyFingerprintSha256);
    if (entry.allowedRole !== ROLE || entry.allowedScope !== SCOPE ||
        entry.allowedRole.includes("*") || entry.allowedScope.includes("*")) {
      issues.push(`${prefix}_role_scope_or_wildcard_invalid`);
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

function validateStepZA(stepZAPacket, stepZAResult) {
  const issues = [];
  if (!exactKeys(stepZAPacket, stepZA.INPUT_FIELDS)) {
    return { issues: ["step_za_packet_fields_invalid"] };
  }
  let rebuilt;
  try { rebuilt = stepZA.evaluateProductionCutoverRuntimeCeremony(stepZAPacket); }
  catch { return { issues: ["step_za_evaluation_failed"] }; }
  if (!rebuilt.ok || rebuilt.status !== stepZA.PUBLIC_STATES[1] ||
      !canonicalEqual(rebuilt, stepZAResult)) {
    return { issues: ["step_za_packet_or_result_canonical_mismatch"], rebuilt };
  }
  if (stepZAPacket.mergedMainSha !== stepZA.MERGED_MAIN_SHA ||
      rebuilt.explicitExecutionHandoff?.mergedMainSha !== stepZA.MERGED_MAIN_SHA) {
    issues.push("step_za_merged_main_binding_invalid");
  }
  const stepZValidation = stepZA.validateStepZPacket(stepZAPacket.stepZPacket);
  issues.push(...stepZValidation.issues.map((issue) => `step_za:${issue}`));
  issues.push(...stepZA.validateMergedStepZContract().map((issue) => `step_z:${issue}`));
  const handoff = rebuilt.explicitExecutionHandoff;
  const inventory = rebuilt.runtimeMaterialInventory;
  if (!isRecord(handoff) || !isSafeId(handoff.explicitExecutionHandoffId) ||
      !isSha(handoff.explicitExecutionHandoffHash) || handoff.nonExecuting !== true ||
      handoff.explicitInvocationRequired !== true ||
      handoff.runtimeMaterialValidated !== true || handoff.rawMaterialPresent !== false) {
    issues.push("step_za_handoff_invalid");
  }
  if (!isRecord(inventory) || inventory.capabilityCount !== stepZ.CAPABILITY_NAMES.length ||
      inventory.noCapabilityInvoked !== true || inventory.rawMaterialPresent !== false ||
      !canonicalEqual(inventory.executorTrace, stepZ.EXECUTION_TRACE) ||
      inventory.capabilities?.some((entry, index) =>
        entry.capabilityName !== stepZ.CAPABILITY_NAMES[index] ||
        entry.descriptorHash !== stepZ.buildCapabilityDescriptor(
          stepZ.CAPABILITY_NAMES[index]).descriptorHash ||
        entry.methodInvocationCount !== 0)) {
    issues.push("step_za_runtime_inventory_invalid");
  }
  if (!canonicalEqual(inventory.targetReadiness?.targets?.map((target) => target.market),
    ["US", "KR"]) || inventory.targetReadiness?.currentPreimagesAttested !== true ||
      inventory.targetReadiness?.selectorPreimageAttested !== true ||
      inventory.targetReadiness?.candidateIdentitiesAttested !== true ||
      inventory.targetReadiness?.repositoryNoDriftAttested !== true) {
    issues.push("step_za_target_or_preimage_readiness_invalid");
  }
  if (rebuilt.operatorChecklist?.completion?.stepYEnvelopeUnconsumedAndUnexpired !== true ||
      rebuilt.operatorChecklist?.checklistComplete !== true ||
      handoff.effectiveExpiry !== inventory.effectiveExpiry ||
      parseInstant(handoff.effectiveExpiry) === null) {
    issues.push("step_za_envelope_or_expiry_attestation_invalid");
  }
  for (const field of stepZA.FIXED_FALSE_FIELDS) {
    if (rebuilt[field] !== false) issues.push(`step_za_fixed_false_invalid:${field}`);
  }
  return { issues: uniqueSorted(issues), rebuilt, handoff, inventory,
    stepZDirect: stepZValidation.direct };
}

function buildSingleUseClaimNamespaceHash(handoff) {
  return hashContract("FINPLE_STEP114_2X_ZB_SINGLE_USE_CLAIM_NAMESPACE\0", {
    stepZAHandoffId: handoff.explicitExecutionHandoffId,
    stepZAHandoffHash: handoff.explicitExecutionHandoffHash,
    stepYEnvelopeId: handoff.chainIdentities.stepYEnvelopeId,
    stepYEnvelopeHash: handoff.chainIdentities.stepYEnvelopeHash,
  });
}

function buildInvocationPackageCore(stepZAResult) {
  const handoff = stepZAResult.explicitExecutionHandoff;
  const inventory = stepZAResult.runtimeMaterialInventory;
  const operationPlan = inventory.operationPlan.map((entry) => ({ ...entry }));
  const claimNamespaceHash = buildSingleUseClaimNamespaceHash(handoff);
  const commandIdentity = hashContract("FINPLE_STEP114_2X_ZB_ONE_RUN_COMMAND_IDENTITY\0", {
    mergedMainSha: MERGED_MAIN_SHA,
    stepZAHandoffHash: handoff.explicitExecutionHandoffHash,
    operationPlanHash: inventory.operationPlanHash,
    singleUseClaimNamespaceHash: claimNamespaceHash,
  });
  const body = {
    contractVersion: "finple.step114-2x-zb.invocation-package.v1",
    mergedMainSha: MERGED_MAIN_SHA, stepZAMergedMainSha: stepZA.MERGED_MAIN_SHA,
    stepZContractVersion: stepZ.VERSION,
    stepZAHandoffId: handoff.explicitExecutionHandoffId,
    stepZAHandoffHash: handoff.explicitExecutionHandoffHash,
    runtimeMaterialInventoryId: inventory.runtimeMaterialInventoryId,
    runtimeMaterialInventoryHash: inventory.runtimeMaterialInventoryHash,
    chainIdentities: handoff.chainIdentities,
    capabilityInventory: inventory.capabilities.map((entry) => ({
      capabilityName: entry.capabilityName, descriptorHash: entry.descriptorHash,
      methodNames: entry.methodNames, hardTimeoutMilliseconds: 100,
      namespacePolicy: entry.namespacePolicy, idempotencyPolicy: entry.idempotencyPolicy,
      timeoutPolicy: entry.timeoutPolicy, cancellationPolicy: entry.cancellationPolicy,
      reconciliationPolicy: entry.reconciliationPolicy,
      sanitizationPolicy: entry.sanitizationPolicy, materialPresent: true,
      methodInvocationCount: 0,
    })),
    targetReadiness: inventory.targetReadiness,
    executionTrace: [...stepZ.EXECUTION_TRACE],
    executionTraceHash: inventory.executorTraceHash,
    oneRunOperationPlan: operationPlan,
    oneRunOperationPlanHash: inventory.operationPlanHash,
    singleUseClaimNamespaceHash: claimNamespaceHash,
    oneRunCommandIdentity: commandIdentity,
    expectedSanitizedArgumentsSchema: [...EXPLICIT_DEPENDENCY_NAMES],
    fixedCapabilityTimeoutMilliseconds: 100,
    rollbackPreimageRestorationRequired: true,
    receiptPersistenceRequired: true, claimTerminalizationRequired: true,
    effectiveExpiry: handoff.effectiveExpiry, singleUse: true,
    explicitInvocationRequired: true, dryValidationCompleted: true,
    ...fixedFalse(),
  };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_INVOCATION_PACKAGE_ID\0", body);
  const withId = { contractVersion: body.contractVersion,
    invocationPackageId: `step114-2x-zb-invocation-package-${idHash}`,
    ...Object.fromEntries(PACKAGE_CORE_FIELDS.slice(1).map((field) =>
      [field, body[field]])) };
  return deepFreeze({ ...withId, invocationPackageHash: hashContract(
    "FINPLE_STEP114_2X_ZB_INVOCATION_PACKAGE_HASH\0", withId) });
}

function buildUpstreamSignerIdentities(stepZAPacket) {
  const stepYPacket = stepZAPacket.stepZPacket.stepYPacket;
  const identities = stepY.buildUpstreamSignerIdentities(stepYPacket.stepXPacket);
  const approval = stepYPacket.signedProductionCutoverApproval;
  identities.push({
    role: "step_y_production_cutover_approver", keyId: approval.signerKeyId,
    identityHash: approval.signerSanitizedIdentityHash,
    fingerprint: approval.signerPublicKeyFingerprintSha256,
  });
  if (identities.length !== 6 || identities.some((entry) =>
    !isSafeId(entry.keyId) || !isSha(entry.identityHash) || !isSha(entry.fingerprint))) {
    throw new TypeError("upstream_signer_identity_unavailable");
  }
  return identities;
}

function buildOperatorAuthorizationBody(stepZAPacket, invocationCore, signer,
  priorAuthorizationNonceHashes, evaluationClockInstant, overrides = {}) {
  const handoff = stepZAPacket && stepZA.evaluateProductionCutoverRuntimeCeremony(
    stepZAPacket).explicitExecutionHandoff;
  const body = {
    contractVersion: "finple.step114-2x-zb.operator-authorization.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepZAHandoffId: handoff.explicitExecutionHandoffId,
    stepZAHandoffHash: handoff.explicitExecutionHandoffHash,
    invocationPackageId: invocationCore.invocationPackageId,
    invocationPackageHash: invocationCore.invocationPackageHash,
    singleUseClaimNamespaceHash: invocationCore.singleUseClaimNamespaceHash,
    authorizationNonceHash: hashContract(
      "FINPLE_STEP114_2X_ZB_SYNTHETIC_FRESH_AUTHORIZATION_NONCE\0", {
        invocationPackageHash: invocationCore.invocationPackageHash,
        signerKeyId: signer.signerKeyId,
      }),
    priorAuthorizationNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZB_PRIOR_AUTHORIZATION_NONCE_CONTEXT\0",
      priorAuthorizationNonceHashes),
    upstreamNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZB_UPSTREAM_NONCE_CONTEXT\0",
      stepY.collectUpstreamNonceHashes(stepZAPacket)),
    issuedAt: "2026-07-18T00:03:28.500Z",
    expiresAt: "2026-07-18T00:03:34.000Z", effectiveExpiresAt: null,
    evaluationClockInstant, signerKeyId: signer.signerKeyId,
    signerSanitizedIdentityHash: signer.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: signer.publicKeyFingerprintSha256,
    role: ROLE, scope: SCOPE, signatureAlgorithm: SIGNATURE_ALGORITHM,
    syntheticValidationOnly: true, ...fixedFalse(), ...overrides,
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, "effectiveExpiresAt")) {
    body.effectiveExpiresAt = new Date(Math.min(Date.parse(body.expiresAt),
      Date.parse(invocationCore.effectiveExpiry))).toISOString();
  }
  return body;
}

function sealUnsignedOperatorAuthorization(body) {
  if (!exactKeys(body, AUTHORIZATION_BODY_FIELDS)) {
    throw new TypeError("operator_authorization_body_fields_invalid");
  }
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_OPERATOR_AUTHORIZATION_ID\0", body);
  return {
    contractVersion: body.contractVersion,
    operatorAuthorizationId: `step114-2x-zb-operator-authorization-${idHash}`,
    ...Object.fromEntries(AUTHORIZATION_BODY_FIELDS.slice(1).map((field) =>
      [field, body[field]])),
  };
}
function buildOperatorAuthorizationSignaturePayload(unsignedAuthorization) {
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_ZB_OPERATOR_AUTHORIZATION_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedAuthorization), "utf8"),
  ]);
}
function sealSignedOperatorAuthorization(unsignedAuthorization, signatureBase64) {
  const signed = { ...unsignedAuthorization, signatureBase64 };
  return deepFreeze({ ...signed, operatorAuthorizationHash: hashContract(
    "FINPLE_STEP114_2X_ZB_OPERATOR_AUTHORIZATION_HASH\0", signed) });
}

function validatePriorAuthorizationNonces(prior, fresh, stepZAPacket) {
  const issues = [];
  if (!Array.isArray(prior) || prior.some((item) => !isSha(item))) {
    issues.push("prior_authorization_nonce_context_invalid");
  } else {
    if (new Set(prior).size !== prior.length) {
      issues.push("prior_authorization_nonce_context_duplicate");
    }
    if (!canonicalEqual(prior, [...prior].sort())) {
      issues.push("prior_authorization_nonce_context_unsorted");
    }
  }
  if (!isSha(fresh) || prior?.includes(fresh)) {
    issues.push("operator_authorization_nonce_invalid_or_replayed");
  }
  if (stepY.collectUpstreamNonceHashes(stepZAPacket).includes(fresh)) {
    issues.push("operator_authorization_nonce_matches_upstream_nonce");
  }
  return uniqueSorted(issues);
}

function validateSignedOperatorAuthorization(value, allowlist, stepZAPacket,
  invocationCore, priorAuthorizationNonceHashes, evaluationClockInstant) {
  const issues = [];
  if (!exactKeys(value, AUTHORIZATION_FIELDS)) {
    return { issues: ["signed_operator_authorization_fields_invalid"] };
  }
  const normalized = normalizeOperatorAllowlist(allowlist);
  issues.push(...normalized.issues);
  const matches = normalized.entries.filter((entry) =>
    entry.signerKeyId === value.signerKeyId &&
    entry.signerSanitizedIdentityHash === value.signerSanitizedIdentityHash &&
    entry.fingerprint === value.signerPublicKeyFingerprintSha256 &&
    entry.allowedRole === value.role && entry.allowedScope === value.scope &&
    entry.revoked === false);
  if (matches.length !== 1 || normalized.entries.length !== 1) {
    issues.push("operator_exact_allowlist_resolution_failed");
  }
  let expectedUnsigned = null;
  try {
    const body = buildOperatorAuthorizationBody(stepZAPacket, invocationCore, {
      signerKeyId: value.signerKeyId,
      signerSanitizedIdentityHash: value.signerSanitizedIdentityHash,
      publicKeyFingerprintSha256: value.signerPublicKeyFingerprintSha256,
    }, priorAuthorizationNonceHashes, evaluationClockInstant, {
      authorizationNonceHash: value.authorizationNonceHash,
      issuedAt: value.issuedAt, expiresAt: value.expiresAt,
      effectiveExpiresAt: value.effectiveExpiresAt,
    });
    expectedUnsigned = sealUnsignedOperatorAuthorization(body);
  } catch { issues.push("operator_authorization_reconstruction_failed"); }
  const suppliedUnsigned = Object.fromEntries(AUTHORIZATION_FIELDS.slice(0, -2).map(
    (field) => [field, value[field]]));
  if (!expectedUnsigned || !canonicalEqual(suppliedUnsigned, expectedUnsigned)) {
    issues.push("operator_authorization_binding_mismatch");
  }
  if (value.operatorAuthorizationHash !== hashContract(
    "FINPLE_STEP114_2X_ZB_OPERATOR_AUTHORIZATION_HASH\0",
    { ...suppliedUnsigned, signatureBase64: value.signatureBase64 })) {
    issues.push("operator_authorization_hash_invalid");
  }
  const signature = decodeCanonicalBase64(value.signatureBase64);
  if (!signature || !expectedUnsigned || matches.length !== 1) {
    issues.push("operator_authorization_signature_invalid");
  } else {
    try {
      if (!verify(null, buildOperatorAuthorizationSignaturePayload(expectedUnsigned),
        matches[0].publicKey, signature)) {
        issues.push("operator_authorization_signature_invalid");
      }
    } catch { issues.push("operator_authorization_signature_invalid"); }
  }
  const nonceIssues = validatePriorAuthorizationNonces(priorAuthorizationNonceHashes,
    value.authorizationNonceHash, stepZAPacket);
  issues.push(...nonceIssues);
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const effective = parseInstant(value.effectiveExpiresAt);
  const evaluation = parseInstant(evaluationClockInstant);
  const upstreamExpiry = parseInstant(invocationCore.effectiveExpiry);
  if ([issued, expires, effective, evaluation, upstreamExpiry].includes(null) ||
      issued > evaluation || evaluation >= effective || issued >= expires ||
      effective !== Math.min(expires, upstreamExpiry) ||
      expires - issued > MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS * 1000 ||
      value.evaluationClockInstant !== evaluationClockInstant) {
    issues.push("operator_authorization_chronology_or_expiry_invalid");
  }
  if (matches.length === 1 && (issued < matches[0].validFromMs ||
      expires > matches[0].validUntilMs || evaluation < matches[0].validFromMs ||
      evaluation >= matches[0].validUntilMs)) {
    issues.push("operator_signer_outside_validity_interval");
  }
  try {
    const upstream = buildUpstreamSignerIdentities(stepZAPacket);
    if (upstream.some((entry) => entry.keyId === value.signerKeyId ||
        entry.identityHash === value.signerSanitizedIdentityHash ||
        entry.fingerprint === value.signerPublicKeyFingerprintSha256)) {
      issues.push("operator_signer_upstream_separation_failed");
    }
  } catch { issues.push("upstream_signer_separation_validation_failed"); }
  if (value.role !== ROLE || value.scope !== SCOPE ||
      value.signatureAlgorithm !== SIGNATURE_ALGORITHM ||
      value.syntheticValidationOnly !== true) {
    issues.push("operator_authorization_role_scope_or_algorithm_invalid");
  }
  for (const field of FIXED_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`operator_authorization_fixed_false_invalid:${field}`);
  }
  return { issues: uniqueSorted(issues), normalized, matches, expectedUnsigned,
    nonceValidated: nonceIssues.length === 0 };
}

function sanitizedAuthorizationSummary(authorization) {
  const signature = decodeCanonicalBase64(authorization.signatureBase64);
  return deepFreeze({
    operatorAuthorizationId: authorization.operatorAuthorizationId,
    operatorAuthorizationHash: authorization.operatorAuthorizationHash,
    operatorSignatureDigest: signature ? sha256(signature) : null,
    signerKeyId: authorization.signerKeyId,
    signerSanitizedIdentityHash: authorization.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: authorization.signerPublicKeyFingerprintSha256,
    role: authorization.role, scope: authorization.scope,
    issuedAt: authorization.issuedAt,
    effectiveExpiresAt: authorization.effectiveExpiresAt,
  });
}

function buildFinalInvocationPackage(core, authorization) {
  const summary = sanitizedAuthorizationSummary(authorization);
  const body = {
    ...core,
    operatorAuthorizationId: summary.operatorAuthorizationId,
    operatorAuthorizationHash: summary.operatorAuthorizationHash,
    operatorSignatureDigest: summary.operatorSignatureDigest,
    operatorSignerIdentity: {
      signerKeyId: summary.signerKeyId,
      signerSanitizedIdentityHash: summary.signerSanitizedIdentityHash,
      signerPublicKeyFingerprintSha256: summary.signerPublicKeyFingerprintSha256,
      role: summary.role, scope: summary.scope,
    },
  };
  return deepFreeze({ ...body, sealedInvocationPackageHash: hashContract(
    "FINPLE_STEP114_2X_ZB_SEALED_INVOCATION_PACKAGE_HASH\0", body) });
}

function validateInvocationPackageSeal(value) {
  const issues = [];
  if (!exactKeys(value, INVOCATION_PACKAGE_FIELDS)) {
    return ["invocation_package_fields_invalid"];
  }
  const coreBody = Object.fromEntries(PACKAGE_CORE_FIELDS.map((field) =>
    [field, value[field]]));
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_INVOCATION_PACKAGE_ID\0", coreBody);
  const expectedId = `step114-2x-zb-invocation-package-${idHash}`;
  const withId = { contractVersion: coreBody.contractVersion,
    invocationPackageId: expectedId,
    ...Object.fromEntries(PACKAGE_CORE_FIELDS.slice(1).map((field) =>
      [field, coreBody[field]])) };
  if (value.invocationPackageId !== expectedId ||
      value.invocationPackageHash !== hashContract(
        "FINPLE_STEP114_2X_ZB_INVOCATION_PACKAGE_HASH\0", withId)) {
    issues.push("invocation_package_core_seal_invalid");
  }
  const finalBody = { ...value };
  delete finalBody.sealedInvocationPackageHash;
  if (value.sealedInvocationPackageHash !== hashContract(
    "FINPLE_STEP114_2X_ZB_SEALED_INVOCATION_PACKAGE_HASH\0", finalBody)) {
    issues.push("sealed_invocation_package_hash_invalid");
  }
  if (value.mergedMainSha !== MERGED_MAIN_SHA || value.singleUse !== true ||
      value.explicitInvocationRequired !== true || value.dryValidationCompleted !== true ||
      value.fixedCapabilityTimeoutMilliseconds !== 100 ||
      value.rollbackPreimageRestorationRequired !== true ||
      value.receiptPersistenceRequired !== true || value.claimTerminalizationRequired !== true ||
      !canonicalEqual(value.executionTrace, stepZ.EXECUTION_TRACE) ||
      !canonicalEqual(value.expectedSanitizedArgumentsSchema, EXPLICIT_DEPENDENCY_NAMES)) {
    issues.push("invocation_package_constraints_invalid");
  }
  for (const field of FIXED_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`invocation_package_fixed_false_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function evaluateExplicitProductionCutoverInvocation(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, INPUT_FIELDS)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: ["step_zb_packet_fields_invalid"],
  });
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: ["merged_main_sha_invalid"],
  });
  const direct = validateStepZA(packet.stepZAPacket, packet.stepZAResult);
  if (direct.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: direct.issues,
  });
  let core;
  try { core = buildInvocationPackageCore(direct.rebuilt); }
  catch { return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1],
    blockingIssues: ["invocation_package_identity_construction_failed"],
    stepZADirectlyValidated: true,
    completeStepZAZYXWVUTSChainValidated: true,
  }); }
  const authorization = validateSignedOperatorAuthorization(
    packet.signedOperatorAuthorization, packet.productionCutoverOperatorAllowlist,
    packet.stepZAPacket, core, packet.priorAuthorizationNonceHashes,
    packet.evaluationClockInstant);
  if (authorization.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[2],
    blockingIssues: authorization.issues, stepZADirectlyValidated: true,
    completeStepZAZYXWVUTSChainValidated: true, invocationIdentityValidated: true,
  });
  const invocationPackage = buildFinalInvocationPackage(core,
    packet.signedOperatorAuthorization);
  const packageIssues = validateInvocationPackageSeal(invocationPackage);
  if (packageIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1], blockingIssues: packageIssues,
    stepZADirectlyValidated: true, completeStepZAZYXWVUTSChainValidated: true,
    invocationIdentityValidated: true, operatorAuthorizationVerified: true,
    signerSeparationValidated: true, nonceValidated: true, chronologyValidated: true,
  });
  return safeResult(PUBLIC_STATES[1], {
    stepZADirectlyValidated: true, completeStepZAZYXWVUTSChainValidated: true,
    invocationIdentityValidated: true, operatorAuthorizationVerified: true,
    signerSeparationValidated: true, nonceValidated: true, chronologyValidated: true,
    dryValidationCompleted: true,
    signedOperatorAuthorization: sanitizedAuthorizationSummary(
      packet.signedOperatorAuthorization),
    invocationPackage,
  });
}

function dryValidateOneRunInvocation(input) {
  if (input === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(input, EXPLICIT_DEPENDENCY_NAMES)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[3],
    blockingIssues: ["explicit_command_dependencies_invalid"],
  });
  const packageIssues = validateInvocationPackageSeal(input.invocationPackage);
  const capabilityIssues = stepZ.CAPABILITY_NAMES.flatMap((name) =>
    stepZ.validateCapability(name, input[name]));
  if (packageIssues.length || capabilityIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[3],
    blockingIssues: uniqueSorted([...packageIssues, ...capabilityIssues]),
  });
  const inventory = new Map(input.invocationPackage.capabilityInventory.map((entry) =>
    [entry.capabilityName, entry]));
  for (const name of stepZ.CAPABILITY_NAMES) {
    if (inventory.get(name)?.descriptorHash !== input[name].descriptor.descriptorHash) {
      return safeResult(PUBLIC_STATES[2], {
        failureClassification: FAILURE_CLASSIFICATIONS[3],
        blockingIssues: [`explicit_command_capability_binding_invalid:${name}`],
      });
    }
  }
  const commandBoundary = deepFreeze({
    contractVersion: "finple.step114-2x-zb.non-executing-command-boundary.v1",
    invocationPackageId: input.invocationPackage.invocationPackageId,
    invocationPackageHash: input.invocationPackage.invocationPackageHash,
    oneRunCommandIdentity: input.invocationPackage.oneRunCommandIdentity,
    explicitDependencyNames: [...EXPLICIT_DEPENDENCY_NAMES],
    dryValidationCompleted: true, commandConstructed: false,
    executionPerformed: false, executorInvoked: false,
    capabilityMethodInvoked: false, rawMaterialPresent: false,
  });
  return safeResult(PUBLIC_STATES[1], {
    invocationIdentityValidated: true, operatorAuthorizationVerified: true,
    signerSeparationValidated: true, nonceValidated: true, chronologyValidated: true,
    dryValidationCompleted: true, invocationPackage: input.invocationPackage,
    commandBoundary,
  });
}

function prepareOneRunInvocationCommand(input) {
  return dryValidateOneRunInvocation(input);
}

module.exports = {
  ALLOWLIST_ENTRY_FIELDS, ALLOWLIST_FIELDS, AUTHORIZATION_BODY_FIELDS,
  AUTHORIZATION_FIELDS, EXPLICIT_DEPENDENCY_NAMES, FAILURE_CLASSIFICATIONS,
  FIXED_FALSE_FIELDS, INPUT_FIELDS, INVOCATION_PACKAGE_FIELDS,
  MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS, MERGED_MAIN_SHA, PACKAGE_CORE_FIELDS,
  PUBLIC_STATES, ROLE, SCOPE, SIGNATURE_ALGORITHM, VERSION,
  buildFinalInvocationPackage, buildInvocationPackageCore,
  buildOperatorAuthorizationBody, buildOperatorAuthorizationSignaturePayload,
  buildProductionCutoverOperatorAllowlist, buildSingleUseClaimNamespaceHash,
  buildUpstreamSignerIdentities, canonicalJson, deepFreeze,
  dryValidateOneRunInvocation, evaluateExplicitProductionCutoverInvocation,
  hashContract, normalizeOperatorAllowlist, prepareOneRunInvocationCommand,
  safeResult, sanitizedAuthorizationSummary, sealSignedOperatorAuthorization,
  sealUnsignedOperatorAuthorization, validateInvocationPackageSeal,
  validatePriorAuthorizationNonces, validateSignedOperatorAuthorization,
  validateStepZA,
};
