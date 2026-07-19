"use strict";

const { createHash, createPublicKey, verify: verifySignature } = require("node:crypto");
const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const stepP = require("./metrics-cutover-live-observation-executor-shell.cjs");
const stepO = require("./metrics-cutover-live-observation-executor-preflight.cjs");
const stepN = require("./metrics-cutover-live-observation-invocation.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  authorization: "metrics-cutover-live-observation-operator-authorization-v1-step114-2x-q",
  allowlist: "metrics-cutover-live-observation-operator-allowlist-v1-step114-2x-q",
  manifest: "metrics-cutover-live-observation-adapter-artifact-manifest-v1-step114-2x-q",
  policy: "metrics-cutover-live-observation-operator-verification-policy-v1-step114-2x-q",
  binding: "metrics-cutover-live-observation-one-run-adapter-binding-v1-step114-2x-q",
  summary: "metrics-cutover-live-observation-operator-run-summary-v1-step114-2x-q",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_live_observation_operator_authorization",
  "signed_live_observation_operator_run_package_verified",
  "blocked",
]);
const OPERATOR_SCOPE = "single_sanitized_disposable_environment_observation_run";
const OPERATOR_ROLE = "metrics_live_observation_execution_operator";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS = 30;
const ALLOWED_CLOCK_SKEW_SECONDS = 5;
const TRANSPORT_CLASS = "disposable_environment_read_only_observer";
const OPERATOR_OPERATIONS = Object.freeze([
  "acquire_single_use_claim",
  "invoke_bound_read_only_adapter_once",
  "prepare_sanitized_execution_receipt",
  "require_separate_evidence_finalization",
  "require_separate_environment_disposal",
]);
const ATTESTATION_FIELDS = Object.freeze([
  "stepPPackageReviewed",
  "singleUseClaimReviewed",
  "readOnlyAdapterReviewed",
  "oneDestinationReviewed",
  "oneObservationReviewed",
  "sanitizedOutputReviewed",
  "separateEvidenceFinalizationConfirmed",
  "separateDisposalConfirmed",
  "noCredentialDisclosureConfirmed",
  "nonExecutingAuthorizationConfirmed",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
  "liveObservationOperatorAuthorizationRecorded",
  "liveObservationOperatorAuthorizationConsumed",
  "liveObservationAdapterArtifactLoaded",
  "liveObservationRealDependencyBound",
  "liveObservationClaimCreated",
  "liveObservationClaimPersisted",
  "liveObservationInvocationConsumed",
  "liveObservationAdapterInvoked",
  "liveObservationEvidenceCollected",
  "liveObservationExecutionReceiptPersisted",
  "liveObservationAuthorityActivated",
  "environmentObservationAuthorized",
  "environmentObservationExecuted",
  "providerConnectionAuthorized",
  "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized",
  "credentialUseAuthorized",
  "credentialInjected",
  "sqlExecutionAuthorized",
  "migrationAuthorized",
  "scenarioExecutionAuthorized",
  "evidenceCollectionStarted",
  "environmentDisposalAuthorized",
  "environmentDisposalExecuted",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
]);
const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepP.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const SPECS = Object.freeze({
  authorization: Object.freeze({
    version: VERSIONS.authorization,
    idField: "operatorAuthorizationId",
    hashField: "operatorAuthorizationHash",
    prefix: "metrics-cutover-live-observation-operator-authorization",
    idDomain: "FINPLE_STEP114_2X_Q_OPERATOR_AUTHORIZATION_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_OPERATOR_AUTHORIZATION_HASH\0",
  }),
  allowlist: Object.freeze({
    version: VERSIONS.allowlist,
    idField: "operatorAllowlistId",
    hashField: "operatorAllowlistHash",
    prefix: "metrics-cutover-live-observation-operator-allowlist",
    idDomain: "FINPLE_STEP114_2X_Q_OPERATOR_ALLOWLIST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_OPERATOR_ALLOWLIST_HASH\0",
  }),
  manifest: Object.freeze({
    version: VERSIONS.manifest,
    idField: "adapterArtifactManifestId",
    hashField: "adapterArtifactManifestHash",
    prefix: "metrics-cutover-live-observation-adapter-artifact-manifest",
    idDomain: "FINPLE_STEP114_2X_Q_ADAPTER_ARTIFACT_MANIFEST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_ADAPTER_ARTIFACT_MANIFEST_HASH\0",
  }),
  policy: Object.freeze({
    version: VERSIONS.policy,
    idField: "operatorVerificationPolicyId",
    hashField: "operatorVerificationPolicyHash",
    prefix: "metrics-cutover-live-observation-operator-verification-policy",
    idDomain: "FINPLE_STEP114_2X_Q_OPERATOR_VERIFICATION_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_OPERATOR_VERIFICATION_POLICY_HASH\0",
  }),
  binding: Object.freeze({
    version: VERSIONS.binding,
    idField: "oneRunAdapterBindingId",
    hashField: "oneRunAdapterBindingHash",
    prefix: "metrics-cutover-live-observation-one-run-adapter-binding",
    idDomain: "FINPLE_STEP114_2X_Q_ONE_RUN_ADAPTER_BINDING_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_ONE_RUN_ADAPTER_BINDING_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "operatorRunSummaryId",
    hashField: "operatorRunSummaryHash",
    prefix: "metrics-cutover-live-observation-operator-run-summary",
    idDomain: "FINPLE_STEP114_2X_Q_OPERATOR_RUN_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_Q_OPERATOR_RUN_SUMMARY_HASH\0",
  }),
});

const STEP_P_BINDING_FIELDS = Object.freeze([
  "stepPExecutorShellSummaryId", "stepPExecutorShellSummaryHash",
  "stepPExecutionReceiptCandidateId", "stepPExecutionReceiptCandidateHash",
  "stepPExecutionDependencyBundleId", "stepPExecutionDependencyBundleHash",
  "stepPExecutionPlanId", "stepPExecutionPlanHash",
  "stepPClaimStoreInterfaceHash", "stepPAdapterInterfaceHash",
  "stepPReceiptStoreInterfaceHash", "stepPStateMachineTraceHash",
  "stepOExecutorInputId", "stepOExecutorInputHash",
  "stepOAdapterCapabilityPolicyId", "stepOAdapterCapabilityPolicyHash",
  "stepNInvocationId", "stepNInvocationHash",
]);
const ADAPTER_MANIFEST_AUTHORIZATION_BINDING_FIELDS = Object.freeze([
  "adapterArtifactManifestId", "adapterArtifactManifestHash",
  "adapterArtifactId", "adapterArtifactSha256", "adapterSourceTreeSha256",
  "adapterCapabilityManifestSha256",
]);

const AUTHORIZATION_FIELDS = Object.freeze([
  "contractVersion", "operatorAuthorizationId", ...STEP_P_BINDING_FIELDS,
  ...ADAPTER_MANIFEST_AUTHORIZATION_BINDING_FIELDS,
  "claimKeyHash", "requestNonceHash", "intakeNonceHash",
  "approvalResponseNonceHash", "invocationNonceHash", "claimNonceHash",
  "operatorAuthorizationNonceHash", "operatorScope", "operatorRole",
  "orderedOperations", "maximumClaimAcquisitionCount",
  "maximumAdapterInvocationCount", "destinationCount", "observationCount",
  "executionStateSequence", "observationWindowStartsAt",
  "observationWindowExpiresAt", "issuedAt", "expiresAt", "operatorKeyId",
  "operatorIdentityHash", "signatureAlgorithm", "attestations",
  "syntheticValidationOnly", "realOperatorAuthorizationRecorded",
  "operatorAuthorizationConsumed", "realDependencyBound", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "manualReviewRequired", "signatureBase64",
  "operatorAuthorizationHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "operatorKeyId", "operatorIdentityHash", "publicKeyPem", "allowedScopes",
  "allowedRoles", "revoked", "validFrom", "validUntil",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "operatorAllowlistId", "entries", "syntheticValidationOnly",
  "rawMaterialPresent", "operatorAllowlistHash",
]);
const MANIFEST_FIELDS = Object.freeze([
  "contractVersion", "adapterArtifactManifestId", "stepPAdapterInterfaceHash",
  "stepOAdapterCapabilityPolicyId", "stepOAdapterCapabilityPolicyHash",
  "adapterArtifactId", "adapterArtifactSha256", "adapterSourceTreeSha256",
  "adapterCapabilityManifestSha256", "adapterInterfaceVersion",
  "operationOrder", "observationCategoryOrder", "requiredHashOutputFields",
  "requiredTimestampOutputFields", "transportClass", "destinationCount",
  "observationCount", "immutableArtifactRequired", "runtimeLoaded",
  "externalAdapterBound", "adapterInvocable", "providerSpecificMaterialPresent",
  "rawMaterialPresent", "adapterArtifactManifestHash",
]);
const POLICY_FIELDS = Object.freeze([
  "contractVersion", "operatorVerificationPolicyId", ...STEP_P_BINDING_FIELDS,
  "requiredOperatorScope", "requiredOperatorRole", "requiredOperationOrder",
  "maximumClaimAcquisitionCount", "maximumAdapterInvocationCount",
  "requiredDestinationCount", "requiredObservationCount",
  "requiredAttestations", "signatureAlgorithm",
  "maximumAuthorizationLifetimeSeconds", "allowedClockSkewSeconds",
  "threeWaySignerSeparationRequired", "distinctNonceHashesRequired",
  "priorNonceContextSortedUniqueRequired", "nonceReplayProtectionRequired",
  "earliestExpiryBindingRequired", "observationWindowBindingRequired",
  "nonExecutingBindingRequired", "authorityFalseFields", "rawMaterialPresent",
  "operatorVerificationPolicyHash",
]);
const BINDING_FIELDS = Object.freeze([
  "contractVersion", "oneRunAdapterBindingId", ...STEP_P_BINDING_FIELDS,
  "operatorAuthorizationId", "operatorAuthorizationHash",
  "operatorAuthorizationSignatureDigest", "operatorAllowlistId",
  "operatorAllowlistHash", "operatorVerificationPolicyId",
  "operatorVerificationPolicyHash", "adapterArtifactManifestId",
  "adapterArtifactManifestHash", "adapterArtifactId", "adapterArtifactSha256",
  "adapterSourceTreeSha256", "adapterCapabilityManifestSha256", "operatorKeyId",
  "operatorIdentityHash", "claimKeyHash", "requestNonceHash", "intakeNonceHash",
  "approvalResponseNonceHash", "invocationNonceHash", "claimNonceHash",
  "operatorAuthorizationNonceHash", "operatorScope", "operatorRole",
  "orderedOperations", "maximumClaimAcquisitionCount",
  "maximumAdapterInvocationCount", "destinationCount", "observationCount",
  "executionStateSequence", "observationWindowStartsAt",
  "observationWindowExpiresAt", "expiresAt", "claimAcquisitionRequired",
  "adapterArtifactLoadingRequired", "evidenceFinalizationRequired",
  "executionReceiptPersistenceRequired", "environmentDisposalRequired",
  "syntheticValidationOnly", "nonExecuting", "realOperatorAuthorizationRecorded",
  "operatorAuthorizationConsumed", "realDependencyBound", "adapterRuntimeLoaded",
  "realClaimPersisted", "realInvocationConsumed", "realAdapterInvoked",
  "realObservationCompleted", "evidencePersisted", "executionReceiptPersisted",
  "rawMaterialPresent", ...FIXED_FALSE_FIELDS, "oneRunAdapterBindingHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "operatorRunSummaryId", ...STEP_P_BINDING_FIELDS,
  "operatorAuthorizationId", "operatorAuthorizationHash", "operatorAllowlistId",
  "operatorAllowlistHash", "operatorVerificationPolicyId",
  "operatorVerificationPolicyHash", "adapterArtifactManifestId",
  "adapterArtifactManifestHash", "oneRunAdapterBindingId",
  "oneRunAdapterBindingHash", "publicState", "stepPPackageValidated",
  "operatorSignatureVerified", "operatorAllowlistValidated",
  "threeWaySignerSeparationValidated", "nonceReplayAndChronologyValidated",
  "adapterArtifactManifestValidated", "nonExecutingOneRunBindingPrepared",
  "syntheticValidationOnly", "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "operatorRunSummaryHash",
]);
const FIELD_SETS = Object.freeze({
  authorization: AUTHORIZATION_FIELDS,
  allowlist: ALLOWLIST_FIELDS,
  manifest: MANIFEST_FIELDS,
  policy: POLICY_FIELDS,
  binding: BINDING_FIELDS,
  summary: SUMMARY_FIELDS,
});

const upstreamValidationCache = new Map();

function without(value, fields) {
  const excluded = new Set(Array.isArray(fields) ? fields : [fields]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key)));
}
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function parseInstant(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function validateHashArray(value, prefix) {
  if (!Array.isArray(value)) return [`${prefix}_invalid`];
  if (value.some((item) => !isSha256(item))) return [`${prefix}_hash_invalid`];
  if (new Set(value).size !== value.length) return [`${prefix}_duplicate`];
  if (!canonicalEqual(value, [...value].sort())) return [`${prefix}_not_sorted`];
  return [];
}
function decodeCanonicalBase64(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  return bytes.toString("base64") === value ? bytes : null;
}
function sealContract(value, name) {
  const spec = SPECS[name];
  const withId = { ...value, [spec.idField]: `${spec.prefix}-${hashWithDomain(spec.idDomain, value)}` };
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}
function validateEnvelope(value, name) {
  const spec = SPECS[name];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) return [`${name}_fields_invalid`];
  const issues = [];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const body = name === "authorization"
    ? without(value, [spec.idField, "signatureBase64", spec.hashField])
    : without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const hashBody = name === "authorization"
    ? without(value, ["signatureBase64", spec.hashField])
    : { ...body, [spec.idField]: expectedId };
  if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, hashBody)) {
    issues.push(`${name}_hash_invalid`);
  }
  return issues;
}

function buildUpstream(stepPPacket, stepPExecutionReceiptCandidate,
  stepPExecutorShellSummary) {
  return { stepPPacket, stepPExecutionReceiptCandidate, stepPExecutorShellSummary };
}
function getMaterial(upstream) {
  const pPacket = upstream.stepPPacket;
  const pContext = pPacket.context;
  const pUpstream = pContext.upstream;
  const oPacket = pUpstream.stepOPacket;
  const oContext = oPacket.context;
  const oUpstream = oContext.upstream;
  const nPacket = oUpstream.stepNPacket;
  const nContext = nPacket.context;
  const nUpstream = nContext.upstream;
  const mPacket = nUpstream.stepMPacket;
  const mContext = mPacket.context;
  const lUpstream = mContext.upstream;
  const lPacket = lUpstream.stepLPacket;
  return { pPacket, pContext, pUpstream, oPacket, oContext, oUpstream,
    nPacket, nContext, nUpstream, mPacket, mContext, lUpstream, lPacket };
}
function buildBindings(upstream) {
  const { pPacket, pContext, oPacket, oContext, nPacket } = getMaterial(upstream);
  const summary = upstream.stepPExecutorShellSummary;
  const receipt = upstream.stepPExecutionReceiptCandidate;
  return {
    stepPExecutorShellSummaryId: summary.executorShellSummaryId,
    stepPExecutorShellSummaryHash: summary.executorShellSummaryHash,
    stepPExecutionReceiptCandidateId: receipt.executionReceiptCandidateId,
    stepPExecutionReceiptCandidateHash: receipt.executionReceiptCandidateHash,
    stepPExecutionDependencyBundleId: pPacket.dependencyBundle.executionDependencyBundleId,
    stepPExecutionDependencyBundleHash: pPacket.dependencyBundle.executionDependencyBundleHash,
    stepPExecutionPlanId: pPacket.executionPlan.executionPlanId,
    stepPExecutionPlanHash: pPacket.executionPlan.executionPlanHash,
    stepPClaimStoreInterfaceHash: pContext.claimStoreInterface.claimStoreInterfaceHash,
    stepPAdapterInterfaceHash: pContext.adapterInterface.adapterInterfaceHash,
    stepPReceiptStoreInterfaceHash: pContext.receiptStoreInterface.receiptStoreInterfaceHash,
    stepPStateMachineTraceHash: pPacket.executionPlan.stateMachineTraceHash,
    stepOExecutorInputId: oPacket.executorInput.executorInputId,
    stepOExecutorInputHash: oPacket.executorInput.executorInputHash,
    stepOAdapterCapabilityPolicyId: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    stepOAdapterCapabilityPolicyHash: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    stepNInvocationId: nPacket.invocation.invocationId,
    stepNInvocationHash: nPacket.invocation.invocationHash,
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "stepPPacket", "stepPExecutionReceiptCandidate", "stepPExecutorShellSummary",
  ])) return ["step_p_upstream_fields_invalid"];
  let cacheKey;
  try {
    cacheKey = hashWithDomain("FINPLE_STEP114_2X_Q_UPSTREAM_VALIDATION_CACHE_KEY\0", upstream);
    if (upstreamValidationCache.has(cacheKey)) return [...upstreamValidationCache.get(cacheKey)];
  } catch { return ["step_p_upstream_canonicalization_invalid"]; }
  let material;
  try { material = getMaterial(upstream); } catch { return ["step_p_nested_material_invalid"]; }
  const { pPacket, pContext, pUpstream, oPacket, oContext, oUpstream, nPacket,
    nContext, nUpstream, mPacket, mContext, lUpstream, lPacket } = material;
  if (!isRecord(pPacket) || !hasExactKeys(pPacket, [
    "context", "dependencyBundle", "claimOutcome", "adapterOutcome",
    "adapterOutput", "executionPlan", "evaluationClockInstant",
  ])) return ["step_p_packet_fields_invalid"];
  const issues = [...stepP.validateUpstream(pUpstream)];
  issues.push(
    ...stepP.validateClaimStoreInterface(pContext.claimStoreInterface, pUpstream),
    ...stepP.validateAdapterInterface(pContext.adapterInterface, pUpstream),
    ...stepP.validateReceiptStoreInterface(pContext.receiptStoreInterface, pUpstream),
    ...stepP.validateDependencyBundle(
      pPacket.dependencyBundle, pContext, pPacket.evaluationClockInstant,
    ),
    ...stepP.validateExecutionPlan(pPacket.executionPlan, pUpstream, pPacket.dependencyBundle),
    ...stepP.validateAdapterOutput(
      pPacket.adapterOutput, pUpstream, pPacket.evaluationClockInstant,
    ),
    ...stepP.validateReceiptCandidate(
      upstream.stepPExecutionReceiptCandidate, pUpstream, pPacket.dependencyBundle,
      pPacket.executionPlan, pContext.adapterInterface, pPacket.adapterOutput,
    ),
    ...stepP.validateSummary(
      upstream.stepPExecutorShellSummary, pUpstream, pPacket.dependencyBundle,
      pPacket.executionPlan, upstream.stepPExecutionReceiptCandidate,
    ),
    ...stepO.validateConsumptionPolicy(oContext.consumptionPolicy, oUpstream),
    ...stepO.validateAdapterDescriptor(oContext.adapterDescriptor),
    ...stepO.validateAdapterCapabilityPolicy(oContext.adapterCapabilityPolicy, oUpstream),
    ...stepN.validateReceiptCandidate(
      oUpstream.stepNInvocationReceiptCandidate, nPacket.invocation, nContext,
    ),
    ...stepN.validateSummary(
      oUpstream.stepNInvocationVerificationSummary, nPacket.invocation, nContext,
      oUpstream.stepNInvocationReceiptCandidate,
    ),
    ...stepM.validateObservationAuthorityPackage(
      nUpstream.stepMObservationAuthorityPackage, mPacket.approvalResponse, mContext,
    ),
    ...stepM.validateSummary(
      nUpstream.stepMApprovalVerificationSummary, mPacket.approvalResponse, mContext,
      nUpstream.stepMObservationAuthorityPackage,
    ),
    ...stepL.validateSummary(
      lUpstream.stepLSummary, lPacket.intake, lPacket.approvalRequest,
      lPacket.intakeContext.upstream,
    ),
    ...stepH.validateLiveObservationApprovalRequest(
      lPacket.approvalRequest, lPacket.requestContext, lPacket.evaluationClockInstant,
    ),
  );
  let expectedReceipt;
  let expectedSummary;
  try {
    expectedReceipt = stepP.buildReceiptCandidate(
      pUpstream, pPacket.dependencyBundle, pPacket.executionPlan,
      pContext.adapterInterface, pPacket.adapterOutput,
    );
    expectedSummary = stepP.buildSummary(
      pUpstream, pPacket.dependencyBundle, pPacket.executionPlan, expectedReceipt,
    );
  } catch {}
  if (!expectedReceipt || !canonicalEqual(expectedReceipt,
    upstream.stepPExecutionReceiptCandidate)) issues.push("step_p_receipt_binding_mismatch");
  if (!expectedSummary || !canonicalEqual(expectedSummary,
    upstream.stepPExecutorShellSummary)) issues.push("step_p_summary_binding_mismatch");
  if (pPacket.claimOutcome !== "acquired" || pPacket.adapterOutcome !== "completed") {
    issues.push("step_p_success_outcomes_required");
  }
  const result = uniqueSorted(issues);
  if (upstreamValidationCache.size >= 64) upstreamValidationCache.clear();
  upstreamValidationCache.set(cacheKey, result);
  return [...result];
}

function buildOperatorAllowlist(publicKeyPem, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.allowlist,
    entries: [{
      operatorKeyId: "synthetic-live-observation-operator-key",
      operatorIdentityHash: "e".repeat(64),
      publicKeyPem,
      allowedScopes: [OPERATOR_SCOPE],
      allowedRoles: [OPERATOR_ROLE],
      revoked: false,
      validFrom: "2026-07-18T00:03:00.000Z",
      validUntil: "2026-07-18T00:04:00.000Z",
      ...(overrides.entry || {}),
    }],
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...overrides.contract,
  }, "allowlist");
}
function normalizeOperatorAllowlist(value, upstream) {
  const issues = [...validateEnvelope(value, "allowlist")];
  if (!isRecord(value) || !Array.isArray(value.entries) || value.entries.length !== 1) {
    return { ok: false, entries: [], issues: uniqueSorted([
      ...issues, "operator_allowlist_entries_invalid",
    ]) };
  }
  const ids = new Set(); const identities = new Set(); const keys = new Set();
  const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `operator_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`); return;
    }
    if (!isSafeIdentity(entry.operatorKeyId) || entry.operatorKeyId === "*") {
      issues.push(`${prefix}_key_id_invalid`);
    } else if (ids.has(entry.operatorKeyId)) issues.push("operator_allowlist_key_id_duplicate");
    else ids.add(entry.operatorKeyId);
    if (!isSha256(entry.operatorIdentityHash)) issues.push(`${prefix}_identity_hash_invalid`);
    else if (identities.has(entry.operatorIdentityHash)) issues.push("operator_allowlist_identity_duplicate");
    else identities.add(entry.operatorIdentityHash);
    if (!canonicalEqual(entry.allowedScopes, [OPERATOR_SCOPE])) issues.push(`${prefix}_scope_invalid`);
    if (!canonicalEqual(entry.allowedRoles, [OPERATOR_ROLE])) issues.push(`${prefix}_role_invalid`);
    if (entry.revoked !== false) issues.push(`${prefix}_revoked`);
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (from === null || until === null || until <= from) issues.push(`${prefix}_validity_invalid`);
    let publicKey = null; let fingerprint = "";
    try {
      publicKey = createPublicKey(entry.publicKeyPem);
      if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519") {
        issues.push(`${prefix}_public_key_not_ed25519`);
      } else {
        fingerprint = createHash("sha256")
          .update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
        if (keys.has(fingerprint)) issues.push("operator_allowlist_public_key_duplicate");
        else keys.add(fingerprint);
      }
    } catch { issues.push(`${prefix}_public_key_invalid`); }
    entries.push({ ...entry, publicKey, fingerprint, validFromMs: from, validUntilMs: until });
  });
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false) {
    issues.push("operator_allowlist_synthetic_boundary_invalid");
  }
  if (isRecord(upstream)) {
    try {
      const { nContext, nUpstream } = getMaterial(upstream);
      const approver = nUpstream.stepMObservationAuthorityPackage;
      const approverEntries = stepM.normalizeApproverAllowlist(
        nUpstream.stepMPacket.context.approverAllowlist,
      ).entries;
      const invoker = nUpstream.stepMPacket ? getMaterial(upstream).nPacket.invocation : {};
      const invokerEntries = stepN.normalizeInvokerAllowlist(nContext.invokerAllowlist, nUpstream).entries;
      for (const entry of entries) {
        if (entry.operatorKeyId === approver.signerKeyId) issues.push("operator_approver_key_id_must_differ");
        if (entry.operatorIdentityHash === approver.signerIdentityHash) issues.push("operator_approver_identity_hash_must_differ");
        if (entry.operatorKeyId === invoker.invokerKeyId) issues.push("operator_invoker_key_id_must_differ");
        if (entry.operatorIdentityHash === invoker.invokerIdentityHash) issues.push("operator_invoker_identity_hash_must_differ");
        if (approverEntries.some((candidate) => candidate.fingerprint === entry.fingerprint)) {
          issues.push("operator_approver_public_key_must_differ");
        }
        if (invokerEntries.some((candidate) => candidate.fingerprint === entry.fingerprint)) {
          issues.push("operator_invoker_public_key_must_differ");
        }
      }
    } catch { issues.push("operator_signer_separation_material_invalid"); }
  }
  return { ok: issues.length === 0, entries: issues.length === 0 ? entries : [],
    issues: uniqueSorted(issues) };
}

function buildVerificationPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.policy,
    ...buildBindings(upstream),
    requiredOperatorScope: OPERATOR_SCOPE,
    requiredOperatorRole: OPERATOR_ROLE,
    requiredOperationOrder: [...OPERATOR_OPERATIONS],
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    requiredDestinationCount: 1,
    requiredObservationCount: 1,
    requiredAttestations: [...ATTESTATION_FIELDS],
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    maximumAuthorizationLifetimeSeconds: MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS,
    allowedClockSkewSeconds: ALLOWED_CLOCK_SKEW_SECONDS,
    threeWaySignerSeparationRequired: true,
    distinctNonceHashesRequired: true,
    priorNonceContextSortedUniqueRequired: true,
    nonceReplayProtectionRequired: true,
    earliestExpiryBindingRequired: true,
    observationWindowBindingRequired: true,
    nonExecutingBindingRequired: true,
    authorityFalseFields: [...FIXED_FALSE_FIELDS],
    rawMaterialPresent: false,
  }, "policy");
}
function validateVerificationPolicy(value, upstream) {
  const issues = [...validateEnvelope(value, "policy")];
  let expected;
  try { expected = buildVerificationPolicy(upstream); } catch {
    return uniqueSorted([...issues, "operator_policy_expected_construction_failed"]);
  }
  for (const field of POLICY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`operator_policy_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildUnsignedOperatorAuthorization(upstream, manifest, overrides = {}) {
  const { pPacket, oPacket, nPacket, mPacket, lPacket } = getMaterial(upstream);
  if (!isRecord(manifest)) throw new TypeError("operator_authorization_adapter_manifest_required");
  const input = oPacket.executorInput;
  const invocation = nPacket.invocation;
  const body = {
    contractVersion: VERSIONS.authorization,
    ...buildBindings(upstream),
    ...Object.fromEntries(ADAPTER_MANIFEST_AUTHORIZATION_BINDING_FIELDS.map(
      (field) => [field, manifest[field]],
    )),
    claimKeyHash: input.claimKeyHash,
    requestNonceHash: invocation.requestNonceHash,
    intakeNonceHash: invocation.intakeNonceHash,
    approvalResponseNonceHash: invocation.approvalResponseNonceHash,
    invocationNonceHash: invocation.invocationNonceHash,
    claimNonceHash: input.claimNonceHash,
    operatorAuthorizationNonceHash: "7".repeat(64),
    operatorScope: OPERATOR_SCOPE,
    operatorRole: OPERATOR_ROLE,
    orderedOperations: [...OPERATOR_OPERATIONS],
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    destinationCount: 1,
    observationCount: 1,
    executionStateSequence: [...stepP.EXECUTION_STATE_SEQUENCE],
    observationWindowStartsAt: input.observationWindowStartsAt,
    observationWindowExpiresAt: input.observationWindowExpiresAt,
    issuedAt: "2026-07-18T00:03:16.000Z",
    expiresAt: "2026-07-18T00:03:40.000Z",
    operatorKeyId: "synthetic-live-observation-operator-key",
    operatorIdentityHash: "e".repeat(64),
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    attestations: Object.fromEntries(ATTESTATION_FIELDS.map((field) => [field, true])),
    syntheticValidationOnly: true,
    realOperatorAuthorizationRecorded: false,
    operatorAuthorizationConsumed: false,
    realDependencyBound: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
    ...overrides,
  };
  void pPacket; void mPacket; void lPacket;
  const withId = { ...body, operatorAuthorizationId:
    `${SPECS.authorization.prefix}-${hashWithDomain(SPECS.authorization.idDomain, body)}` };
  return { ...withId, operatorAuthorizationHash:
    hashWithDomain(SPECS.authorization.hashDomain, withId) };
}
function buildOperatorAuthorizationSignaturePayload(unsignedAuthorization) {
  if (!isRecord(unsignedAuthorization) || !hasExactKeys(
    unsignedAuthorization,
    AUTHORIZATION_FIELDS.filter((field) => field !== "signatureBase64"),
  )) throw new TypeError("unsigned_operator_authorization_fields_invalid");
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_Q_OPERATOR_AUTHORIZATION_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedAuthorization), "utf8"),
  ]);
}
function sealSignedOperatorAuthorization(unsignedAuthorization, signatureBase64) {
  return { ...unsignedAuthorization, signatureBase64 };
}
function validateAuthorizationShape(value) {
  const issues = [...validateEnvelope(value, "authorization")];
  if (!isRecord(value)) return uniqueSorted(issues);
  for (const field of [
    "adapterArtifactManifestHash", "adapterArtifactSha256",
    "adapterSourceTreeSha256", "adapterCapabilityManifestSha256",
    "claimKeyHash", "requestNonceHash", "intakeNonceHash",
    "approvalResponseNonceHash", "invocationNonceHash", "claimNonceHash",
    "operatorAuthorizationNonceHash", "operatorIdentityHash",
  ]) if (!isSha256(value[field])) issues.push(`operator_authorization_hash_invalid:${field}`);
  if (!isSafeIdentity(value.operatorKeyId)) issues.push("operator_authorization_key_id_invalid");
  if (value.operatorScope !== OPERATOR_SCOPE || value.operatorRole !== OPERATOR_ROLE) {
    issues.push("operator_authorization_scope_role_invalid");
  }
  if (!canonicalEqual(value.orderedOperations, OPERATOR_OPERATIONS) ||
      value.maximumClaimAcquisitionCount !== 1 ||
      value.maximumAdapterInvocationCount !== 1 || value.destinationCount !== 1 ||
      value.observationCount !== 1) issues.push("operator_authorization_operation_bounds_invalid");
  if (!canonicalEqual(value.executionStateSequence, stepP.EXECUTION_STATE_SEQUENCE)) {
    issues.push("operator_authorization_state_sequence_invalid");
  }
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    issues.push("operator_authorization_signature_algorithm_invalid");
  }
  if (!hasExactKeys(value.attestations, ATTESTATION_FIELDS) ||
      ATTESTATION_FIELDS.some((field) => value.attestations?.[field] !== true)) {
    issues.push("operator_authorization_attestations_invalid");
  }
  if (value.syntheticValidationOnly !== true ||
      value.realOperatorAuthorizationRecorded !== false ||
      value.operatorAuthorizationConsumed !== false || value.realDependencyBound !== false ||
      value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false ||
      value.manualReviewRequired !== false) {
    issues.push("operator_authorization_synthetic_boundary_invalid");
  }
  const signature = decodeCanonicalBase64(value.signatureBase64);
  if (!signature || signature.length !== 64) issues.push("operator_authorization_signature_encoding_invalid");
  return uniqueSorted(issues);
}
function validateAuthorizationContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "operatorAllowlist", "verificationPolicy",
    "priorOperatorAuthorizationNonceHashes",
  ])) return ["operator_authorization_context_fields_invalid"];
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...normalizeOperatorAllowlist(context.operatorAllowlist, context.upstream).issues,
    ...validateVerificationPolicy(context.verificationPolicy, context.upstream),
    ...validateHashArray(
      context.priorOperatorAuthorizationNonceHashes,
      "prior_operator_authorization_nonce_hashes",
    ),
  ]);
}
function validateSignedOperatorAuthorization(value, context, manifest, evaluationClockInstant) {
  const contextIssues = validateAuthorizationContext(context);
  const issues = [...validateAuthorizationShape(value), ...contextIssues];
  if (!isRecord(value) || contextIssues.length > 0) return uniqueSorted(issues);
  const upstream = context.upstream;
  const { pPacket, oPacket, nPacket, nContext, nUpstream, mPacket, lPacket } =
    getMaterial(upstream);
  const bindings = buildBindings(upstream);
  for (const field of STEP_P_BINDING_FIELDS) {
    if (value[field] !== bindings[field]) issues.push(`operator_authorization_binding_mismatch:${field}`);
  }
  for (const field of ADAPTER_MANIFEST_AUTHORIZATION_BINDING_FIELDS) {
    if (value[field] !== manifest?.[field]) {
      issues.push(`operator_authorization_adapter_manifest_binding_mismatch:${field}`);
    }
  }
  const input = oPacket.executorInput;
  const invocation = nPacket.invocation;
  const expected = {
    claimKeyHash: input.claimKeyHash,
    requestNonceHash: invocation.requestNonceHash,
    intakeNonceHash: invocation.intakeNonceHash,
    approvalResponseNonceHash: invocation.approvalResponseNonceHash,
    invocationNonceHash: invocation.invocationNonceHash,
    claimNonceHash: input.claimNonceHash,
    observationWindowStartsAt: input.observationWindowStartsAt,
    observationWindowExpiresAt: input.observationWindowExpiresAt,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) issues.push(`operator_authorization_upstream_mismatch:${field}`);
  }
  const approver = nUpstream.stepMObservationAuthorityPackage;
  if (value.operatorKeyId === approver.signerKeyId) issues.push("operator_approver_key_id_equal");
  if (value.operatorIdentityHash === approver.signerIdentityHash) issues.push("operator_approver_identity_hash_equal");
  if (value.operatorKeyId === invocation.invokerKeyId) issues.push("operator_invoker_key_id_equal");
  if (value.operatorIdentityHash === invocation.invokerIdentityHash) issues.push("operator_invoker_identity_hash_equal");
  const nonces = [value.requestNonceHash, value.intakeNonceHash,
    value.approvalResponseNonceHash, value.invocationNonceHash, value.claimNonceHash,
    value.operatorAuthorizationNonceHash];
  if (new Set(nonces).size !== nonces.length) issues.push("operator_authorization_nonce_not_distinct");
  if (context.priorOperatorAuthorizationNonceHashes.includes(
    value.operatorAuthorizationNonceHash,
  )) issues.push("operator_authorization_nonce_replay");
  const normalized = normalizeOperatorAllowlist(context.operatorAllowlist, upstream);
  const matches = normalized.entries.filter((entry) =>
    entry.operatorKeyId === value.operatorKeyId &&
    entry.operatorIdentityHash === value.operatorIdentityHash &&
    entry.allowedScopes.includes(value.operatorScope) &&
    entry.allowedRoles.includes(value.operatorRole) && entry.revoked === false);
  if (matches.length !== 1) issues.push("operator_authorization_operator_resolution_failed");
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const now = parseInstant(evaluationClockInstant);
  const windowStart = parseInstant(input.observationWindowStartsAt);
  const windowExpires = parseInstant(input.observationWindowExpiresAt);
  const claimExpires = parseInstant(input.claimExpiresAt);
  const inputExpires = parseInstant(input.expiresAt);
  const invocationExpires = parseInstant(invocation.expiresAt);
  const pClock = parseInstant(pPacket.evaluationClockInstant);
  const adapterCompleted = parseInstant(pPacket.adapterOutput.completedAt);
  const invocationIssued = parseInstant(invocation.issuedAt);
  const approvalIssued = parseInstant(mPacket.approvalResponse.issuedAt);
  const requestIssued = parseInstant(lPacket.approvalRequest.issuedAt);
  const instants = [issued, expires, now, windowStart, windowExpires, claimExpires,
    inputExpires, invocationExpires, pClock, adapterCompleted, invocationIssued,
    approvalIssued, requestIssued];
  if (instants.some((instant) => instant === null)) issues.push("operator_authorization_time_invalid");
  else {
    const earliestExpiry = Math.min(claimExpires, inputExpires, invocationExpires, windowExpires);
    const earliestIssue = Math.max(pClock, adapterCompleted, invocationIssued,
      approvalIssued, requestIssued, windowStart);
    if (expires <= issued ||
        expires - issued > MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS * 1000) {
      issues.push("operator_authorization_lifetime_invalid");
    }
    if (issued < earliestIssue) issues.push("operator_authorization_issued_before_bound_material");
    if (issued < windowStart || expires > earliestExpiry) {
      issues.push("operator_authorization_expiry_window_invalid");
    }
    if (now < windowStart || now >= earliestExpiry ||
        now < issued - ALLOWED_CLOCK_SKEW_SECONDS * 1000 || now >= expires) {
      issues.push("operator_authorization_evaluation_time_invalid");
    }
    if (matches.length === 1 &&
        (issued < matches[0].validFromMs || expires > matches[0].validUntilMs)) {
      issues.push("operator_authorization_key_validity_mismatch");
    }
  }
  if (issues.length === 0 && matches.length === 1) {
    let verified = false;
    try {
      verified = verifySignature(
        null,
        buildOperatorAuthorizationSignaturePayload(without(value, "signatureBase64")),
        matches[0].publicKey,
        decodeCanonicalBase64(value.signatureBase64),
      );
    } catch {}
    if (!verified) issues.push("operator_authorization_signature_invalid");
  }
  void nContext;
  return uniqueSorted(issues);
}

function buildAdapterArtifactManifest(upstream, overrides = {}) {
  const { pContext, oContext } = getMaterial(upstream);
  const adapter = pContext.adapterInterface;
  return sealContract({
    contractVersion: VERSIONS.manifest,
    stepPAdapterInterfaceHash: adapter.adapterInterfaceHash,
    stepOAdapterCapabilityPolicyId: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    stepOAdapterCapabilityPolicyHash: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    adapterArtifactId: "synthetic-sanitized-read-only-observer-artifact",
    adapterArtifactSha256: "1".repeat(64),
    adapterSourceTreeSha256: "2".repeat(64),
    adapterCapabilityManifestSha256: "3".repeat(64),
    adapterInterfaceVersion: adapter.adapterInterfaceVersion,
    operationOrder: [...adapter.observationSequence],
    observationCategoryOrder: [...adapter.requiredObservationCategories],
    requiredHashOutputFields: [...adapter.requiredHashOutputFields],
    requiredTimestampOutputFields: [...adapter.requiredTimestampOutputFields],
    transportClass: TRANSPORT_CLASS,
    destinationCount: 1,
    observationCount: 1,
    immutableArtifactRequired: true,
    runtimeLoaded: false,
    externalAdapterBound: false,
    adapterInvocable: false,
    providerSpecificMaterialPresent: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "manifest");
}
function validateAdapterArtifactManifest(value, upstream) {
  const issues = [...validateEnvelope(value, "manifest")];
  if (!isRecord(value)) return uniqueSorted(issues);
  let material;
  try { material = getMaterial(upstream); } catch {
    return uniqueSorted([...issues, "adapter_manifest_upstream_invalid"]);
  }
  const adapter = material.pContext.adapterInterface;
  const policy = material.oContext.adapterCapabilityPolicy;
  const expected = {
    stepPAdapterInterfaceHash: adapter.adapterInterfaceHash,
    stepOAdapterCapabilityPolicyId: policy.adapterCapabilityPolicyId,
    stepOAdapterCapabilityPolicyHash: policy.adapterCapabilityPolicyHash,
    adapterInterfaceVersion: adapter.adapterInterfaceVersion,
    operationOrder: adapter.observationSequence,
    observationCategoryOrder: adapter.requiredObservationCategories,
    requiredHashOutputFields: adapter.requiredHashOutputFields,
    requiredTimestampOutputFields: adapter.requiredTimestampOutputFields,
    transportClass: TRANSPORT_CLASS,
    destinationCount: 1,
    observationCount: 1,
    immutableArtifactRequired: true,
    runtimeLoaded: false,
    externalAdapterBound: false,
    adapterInvocable: false,
    providerSpecificMaterialPresent: false,
    rawMaterialPresent: false,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (!canonicalEqual(value[field], expectedValue)) issues.push(`adapter_manifest_field_invalid:${field}`);
  }
  if (!isSafeIdentity(value.adapterArtifactId)) issues.push("adapter_manifest_artifact_id_invalid");
  for (const field of ["adapterArtifactSha256", "adapterSourceTreeSha256",
    "adapterCapabilityManifestSha256"]) {
    if (!isSha256(value[field])) issues.push(`adapter_manifest_hash_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildOneRunAdapterBinding(authorization, context, manifest) {
  return sealContract({
    contractVersion: VERSIONS.binding,
    ...buildBindings(context.upstream),
    operatorAuthorizationId: authorization.operatorAuthorizationId,
    operatorAuthorizationHash: authorization.operatorAuthorizationHash,
    operatorAuthorizationSignatureDigest: createHash("sha256")
      .update(decodeCanonicalBase64(authorization.signatureBase64)).digest("hex"),
    operatorAllowlistId: context.operatorAllowlist.operatorAllowlistId,
    operatorAllowlistHash: context.operatorAllowlist.operatorAllowlistHash,
    operatorVerificationPolicyId: context.verificationPolicy.operatorVerificationPolicyId,
    operatorVerificationPolicyHash: context.verificationPolicy.operatorVerificationPolicyHash,
    adapterArtifactManifestId: manifest.adapterArtifactManifestId,
    adapterArtifactManifestHash: manifest.adapterArtifactManifestHash,
    adapterArtifactId: manifest.adapterArtifactId,
    adapterArtifactSha256: manifest.adapterArtifactSha256,
    adapterSourceTreeSha256: manifest.adapterSourceTreeSha256,
    adapterCapabilityManifestSha256: manifest.adapterCapabilityManifestSha256,
    operatorKeyId: authorization.operatorKeyId,
    operatorIdentityHash: authorization.operatorIdentityHash,
    claimKeyHash: authorization.claimKeyHash,
    requestNonceHash: authorization.requestNonceHash,
    intakeNonceHash: authorization.intakeNonceHash,
    approvalResponseNonceHash: authorization.approvalResponseNonceHash,
    invocationNonceHash: authorization.invocationNonceHash,
    claimNonceHash: authorization.claimNonceHash,
    operatorAuthorizationNonceHash: authorization.operatorAuthorizationNonceHash,
    operatorScope: OPERATOR_SCOPE,
    operatorRole: OPERATOR_ROLE,
    orderedOperations: [...OPERATOR_OPERATIONS],
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    destinationCount: 1,
    observationCount: 1,
    executionStateSequence: [...stepP.EXECUTION_STATE_SEQUENCE],
    observationWindowStartsAt: authorization.observationWindowStartsAt,
    observationWindowExpiresAt: authorization.observationWindowExpiresAt,
    expiresAt: authorization.expiresAt,
    claimAcquisitionRequired: true,
    adapterArtifactLoadingRequired: true,
    evidenceFinalizationRequired: true,
    executionReceiptPersistenceRequired: true,
    environmentDisposalRequired: true,
    syntheticValidationOnly: true,
    nonExecuting: true,
    realOperatorAuthorizationRecorded: false,
    operatorAuthorizationConsumed: false,
    realDependencyBound: false,
    adapterRuntimeLoaded: false,
    realClaimPersisted: false,
    realInvocationConsumed: false,
    realAdapterInvoked: false,
    realObservationCompleted: false,
    evidencePersisted: false,
    executionReceiptPersisted: false,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "binding");
}
function validateOneRunAdapterBinding(value, authorization, context, manifest) {
  const issues = [...validateEnvelope(value, "binding")];
  let expected;
  try { expected = buildOneRunAdapterBinding(authorization, context, manifest); } catch {
    return uniqueSorted([...issues, "one_run_binding_expected_construction_failed"]);
  }
  for (const field of BINDING_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`one_run_binding_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildSummary(authorization, context, manifest, binding) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    ...buildBindings(context.upstream),
    operatorAuthorizationId: authorization.operatorAuthorizationId,
    operatorAuthorizationHash: authorization.operatorAuthorizationHash,
    operatorAllowlistId: context.operatorAllowlist.operatorAllowlistId,
    operatorAllowlistHash: context.operatorAllowlist.operatorAllowlistHash,
    operatorVerificationPolicyId: context.verificationPolicy.operatorVerificationPolicyId,
    operatorVerificationPolicyHash: context.verificationPolicy.operatorVerificationPolicyHash,
    adapterArtifactManifestId: manifest.adapterArtifactManifestId,
    adapterArtifactManifestHash: manifest.adapterArtifactManifestHash,
    oneRunAdapterBindingId: binding.oneRunAdapterBindingId,
    oneRunAdapterBindingHash: binding.oneRunAdapterBindingHash,
    publicState: "signed_live_observation_operator_run_package_verified",
    stepPPackageValidated: true,
    operatorSignatureVerified: true,
    operatorAllowlistValidated: true,
    threeWaySignerSeparationValidated: true,
    nonceReplayAndChronologyValidated: true,
    adapterArtifactManifestValidated: true,
    nonExecutingOneRunBindingPrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}
function validateSummary(value, authorization, context, manifest, binding) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(authorization, context, manifest, binding); } catch {
    return uniqueSorted([...issues, "operator_run_summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`operator_run_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, binding = {}, issues = []) {
  const verified = status === "signed_live_observation_operator_run_package_verified";
  return {
    ok: verified,
    status,
    contractVersion: VERSIONS.summary,
    operatorAuthorizationVerified: verified,
    operatorAllowlistValidated: verified,
    threeWaySignerSeparationValidated: verified,
    nonceReplayAndChronologyValidated: verified,
    adapterArtifactManifestValidated: verified,
    nonExecutingOneRunBindingPrepared: verified,
    operatorRunSummary: verified ? summary : {},
    oneRunAdapterBindingPackage: verified ? binding : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: verified ? [
      "synthetic_verification_does_not_record_consume_load_bind_claim_invoke_observe_connect_execute_persist_dispose_or_deploy",
    ] : [],
  };
}
function evaluateSignedOperatorRunPackage(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_external_signed_live_observation_operator_authorization");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "context", "operatorAuthorization", "adapterArtifactManifest",
    "evaluationClockInstant",
  ])) return safeResult("blocked", {}, {}, ["operator_run_packet_fields_invalid"]);
  try {
    const issues = validateAdapterArtifactManifest(
      packet.adapterArtifactManifest, packet.context.upstream,
    );
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    issues.push(...validateSignedOperatorAuthorization(
      packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
      packet.evaluationClockInstant,
    ));
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    const binding = buildOneRunAdapterBinding(
      packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
    );
    issues.push(...validateOneRunAdapterBinding(
      binding, packet.operatorAuthorization, packet.context,
      packet.adapterArtifactManifest,
    ));
    const summary = buildSummary(
      packet.operatorAuthorization, packet.context, packet.adapterArtifactManifest,
      binding,
    );
    issues.push(...validateSummary(
      summary, packet.operatorAuthorization, packet.context,
      packet.adapterArtifactManifest, binding,
    ));
    canonicalJson(binding); canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues)
      : safeResult("signed_live_observation_operator_run_package_verified", summary, binding);
  } catch {
    return safeResult("blocked", {}, {}, ["signed_operator_run_package_validation_failed"]);
  }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS,
  ATTESTATION_FIELDS,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS,
  OPERATOR_OPERATIONS,
  OPERATOR_ROLE,
  OPERATOR_SCOPE,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  SIGNATURE_ALGORITHM,
  SPECS,
  STEP_P_BINDING_FIELDS,
  TRANSPORT_CLASS,
  VERSIONS,
  buildAdapterArtifactManifest,
  buildBindings,
  buildOneRunAdapterBinding,
  buildOperatorAllowlist,
  buildOperatorAuthorizationSignaturePayload,
  buildSummary,
  buildUnsignedOperatorAuthorization,
  buildUpstream,
  buildVerificationPolicy,
  evaluateSignedOperatorRunPackage,
  normalizeOperatorAllowlist,
  safeResult,
  sealContract,
  sealSignedOperatorAuthorization,
  validateAdapterArtifactManifest,
  validateAuthorizationContext,
  validateAuthorizationShape,
  validateOneRunAdapterBinding,
  validateSignedOperatorAuthorization,
  validateSummary,
  validateUpstream,
  validateVerificationPolicy,
};
