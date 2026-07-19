"use strict";

const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const stepN = require("./metrics-cutover-live-observation-invocation.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  input: "metrics-cutover-live-observation-executor-input-v1-step114-2x-o",
  consumption: "metrics-cutover-live-observation-single-use-consumption-policy-v1-step114-2x-o",
  adapter: "metrics-cutover-live-observation-adapter-capability-policy-v1-step114-2x-o",
  manifest: "metrics-cutover-live-observation-evidence-manifest-v1-step114-2x-o",
  summary: "metrics-cutover-live-observation-executor-preflight-summary-v1-step114-2x-o",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_live_observation_executor_inputs",
  "live_observation_executor_preflight_prepared",
  "blocked",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
  "liveObservationInvocationRecorded",
  "liveObservationInvocationSignatureConsumed",
  "liveObservationInvocationConsumed",
  "liveObservationClaimCreated",
  "liveObservationClaimPersisted",
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
  ...stepN.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const OBSERVATION_CATEGORIES = Object.freeze([
  "environment_binding",
  "namespace_evidence",
  "destination_allowlist",
  "database_fingerprint",
  "certificate_fingerprint",
  "observer_attestation",
  "migration_credential_category_attestation",
  "runtime_credential_category_attestation",
  "credential_expiry_attestation",
  "credential_rotation_attestation",
  "credential_revocation_attestation",
  "credential_destruction_attestation",
  "disposal_responsibility_attestation",
  "observation_window",
]);

const ADAPTER_OBSERVATION_SEQUENCE = Object.freeze(
  OBSERVATION_CATEGORIES.map((category) => `observe_sanitized_${category}`),
);

const CLAIM_KEY_INPUT_FIELDS = Object.freeze([
  "invocationId", "invocationHash", "invocationNonceHash",
]);
const CLAIM_KEY_DERIVATION_DOMAIN =
  "FINPLE_STEP114_2X_O_SINGLE_USE_CLAIM_KEY\0";
const CLAIM_ATOMICITY = "compare_and_set_or_equivalent";
const CLAIM_NAMESPACE = "live_observation_single_use_claim";
const EXECUTION_RECEIPT_NAMESPACE = "live_observation_execution_receipt";
const ADAPTER_INTERFACE_VERSION =
  "transport-neutral-sanitized-read-only-observation-adapter-v1-step114-2x-o";

const SPECS = Object.freeze({
  input: Object.freeze({
    version: VERSIONS.input,
    idField: "executorInputId",
    hashField: "executorInputHash",
    prefix: "metrics-cutover-live-observation-executor-input",
    idDomain: "FINPLE_STEP114_2X_O_EXECUTOR_INPUT_ID\0",
    hashDomain: "FINPLE_STEP114_2X_O_EXECUTOR_INPUT_HASH\0",
  }),
  consumption: Object.freeze({
    version: VERSIONS.consumption,
    idField: "singleUseConsumptionPolicyId",
    hashField: "singleUseConsumptionPolicyHash",
    prefix: "metrics-cutover-live-observation-single-use-consumption-policy",
    idDomain: "FINPLE_STEP114_2X_O_SINGLE_USE_CONSUMPTION_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_O_SINGLE_USE_CONSUMPTION_POLICY_HASH\0",
  }),
  adapter: Object.freeze({
    version: VERSIONS.adapter,
    idField: "adapterCapabilityPolicyId",
    hashField: "adapterCapabilityPolicyHash",
    prefix: "metrics-cutover-live-observation-adapter-capability-policy",
    idDomain: "FINPLE_STEP114_2X_O_ADAPTER_CAPABILITY_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_O_ADAPTER_CAPABILITY_POLICY_HASH\0",
  }),
  manifest: Object.freeze({
    version: VERSIONS.manifest,
    idField: "evidenceManifestId",
    hashField: "evidenceManifestHash",
    prefix: "metrics-cutover-live-observation-evidence-manifest",
    idDomain: "FINPLE_STEP114_2X_O_EVIDENCE_MANIFEST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_O_EVIDENCE_MANIFEST_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "executorPreflightSummaryId",
    hashField: "executorPreflightSummaryHash",
    prefix: "metrics-cutover-live-observation-executor-preflight-summary",
    idDomain: "FINPLE_STEP114_2X_O_EXECUTOR_PREFLIGHT_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_O_EXECUTOR_PREFLIGHT_SUMMARY_HASH\0",
  }),
});

const STEP_N_BINDING_FIELDS = Object.freeze([
  "stepNInvocationVerificationSummaryId", "stepNInvocationVerificationSummaryHash",
  "stepNInvocationReceiptCandidateId", "stepNInvocationReceiptCandidateHash",
  "stepNInvocationId", "stepNInvocationHash",
  "stepNInvokerAllowlistId", "stepNInvokerAllowlistHash",
  "stepNInvocationVerificationPolicyId", "stepNInvocationVerificationPolicyHash",
  ...stepN.BINDING_FIELDS,
]);

const INPUT_FIELDS = Object.freeze([
  "contractVersion", "executorInputId", ...STEP_N_BINDING_FIELDS,
  "selectedCandidateClass", "targetPurposeClassification", "namespaceCategory",
  "destinationCount", "observationWindowStartsAt", "observationWindowExpiresAt",
  "expiresAt", "requiredObservationCategories", "requiredHashPlaceholders",
  "requiredTimestampPlaceholders", "runtimeDeniedPrivileges",
  "credentialAttestationCategories", "credentialCategoriesDistinct",
  "invocationNonceHash", "claimNonceHash", "claimKeyHash", "claimExpiresAt",
  "syntheticValidationOnly", "realExecutorInputRecorded", "invocationConsumed",
  "rawMaterialPresent", "providerSpecificMaterialPresent", "manualReviewRequired",
  "executorInputHash",
]);

const CONSUMPTION_FIELDS = Object.freeze([
  "contractVersion", "singleUseConsumptionPolicyId", ...STEP_N_BINDING_FIELDS,
  "claimKeyDerivationDomain", "claimKeyInputFields", "claimKeyHash",
  "claimExpiresAt",
  "maximumAtomicClaimCount", "atomicClaimPrimitive", "claimStoreNamespace",
  "executionReceiptNamespace", "namespacesDistinct",
  "duplicateInvocationRejected", "replayedInvocationRejected",
  "claimExpiryBoundToInvocationAndObservationWindow",
  "claimFailureBlocksBeforeAdapterInvocation", "automaticRetryAllowed",
  "ambiguousClaimOutcomeRetryAllowed", "ambiguousAdapterOutcomeRetryAllowed",
  "operatorReviewRequiredOnUncertainty", "durableStoreAccessed",
  "claimCreated", "claimPersisted", "rawMaterialPresent",
  "singleUseConsumptionPolicyHash",
]);

const ADAPTER_FIELDS = Object.freeze([
  "contractVersion", "adapterCapabilityPolicyId", ...STEP_N_BINDING_FIELDS,
  "adapterInterfaceVersion", "transportNeutralDescriptorRequired",
  "observationSequence", "requiredObservationCategories",
  "maximumSequenceCount", "destinationCount", "readOnlyObservationOnly",
  "writesAllowed", "ddlAllowed", "dmlAllowed", "stateMutationAllowed",
  "migrationAllowed", "scenarioExecutionAllowed", "providerMutationAllowed",
  "credentialEchoAllowed", "credentialPersistenceAllowed",
  "rawEndpointOutputAllowed", "rawCertificateOutputAllowed",
  "rawCredentialOutputAllowed", "productionDatabaseAccessAllowed",
  "automaticRetryAllowed", "ambiguousOutcomeRetryAllowed",
  "adapterInvocationAllowed", "adapterInvoked", "rawMaterialPresent",
  "adapterCapabilityPolicyHash",
]);

const DESCRIPTOR_FIELDS = Object.freeze([
  "adapterInterfaceVersion", "transportNeutral", "observationSequence",
  "requiredObservationCategories", "maximumSequenceCount", "destinationCount",
  "readOnly", "writesSupported", "ddlSupported", "dmlSupported",
  "stateMutationSupported", "migrationSupported", "scenarioExecutionSupported",
  "providerMutationSupported", "credentialEchoSupported",
  "credentialPersistenceSupported", "rawEndpointOutputSupported",
  "rawCertificateOutputSupported", "rawCredentialOutputSupported",
  "productionDatabaseAccessSupported", "automaticRetrySupported",
  "ambiguousOutcomeRetrySupported", "invocationSupportedInPreflight",
  "syntheticValidationOnly", "rawMaterialPresent", "descriptorHash",
]);

const MANIFEST_FIELDS = Object.freeze([
  "contractVersion", "evidenceManifestId", ...STEP_N_BINDING_FIELDS,
  "executorInputId", "executorInputHash", "adapterCapabilityPolicyId",
  "adapterCapabilityPolicyHash", "requiredObservationCategories",
  "requiredHashOutputFields", "requiredTimestampOutputFields",
  "observationWindowStartsAt", "observationWindowExpiresAt", "destinationCount",
  "rawMaterialForbidden", "separateEvidenceFinalizationRequired",
  "separateDisposalRequired", "outputValuesPopulated", "evidenceCollected",
  "adapterInvoked", "observationStarted", "observationCompleted", "claimCreated",
  "executionReceiptPersisted", "syntheticValidationOnly",
  ...FIXED_FALSE_FIELDS, "evidenceManifestHash",
]);

const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "executorPreflightSummaryId", ...STEP_N_BINDING_FIELDS,
  "executorInputId", "executorInputHash", "singleUseConsumptionPolicyId",
  "singleUseConsumptionPolicyHash", "adapterCapabilityPolicyId",
  "adapterCapabilityPolicyHash", "evidenceManifestId", "evidenceManifestHash",
  "publicState", "stepNPackageValidated", "executorInputsValidated",
  "singleUseClaimProtocolValidated", "adapterCapabilityPolicyValidated",
  "evidenceManifestPrepared", "syntheticValidationOnly", "rawMaterialPresent",
  ...FIXED_FALSE_FIELDS, "executorPreflightSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  input: INPUT_FIELDS,
  consumption: CONSUMPTION_FIELDS,
  adapter: ADAPTER_FIELDS,
  manifest: MANIFEST_FIELDS,
  summary: SUMMARY_FIELDS,
  descriptor: DESCRIPTOR_FIELDS,
});

function without(value, fields) {
  const excluded = new Set(Array.isArray(fields) ? fields : [fields]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key)));
}

function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function sealContract(value, name) {
  const spec = SPECS[name];
  const withId = {
    ...value,
    [spec.idField]: `${spec.prefix}-${hashWithDomain(spec.idDomain, value)}`,
  };
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}

function validateEnvelope(value, name) {
  const spec = SPECS[name];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) {
    return [`${name}_fields_invalid`];
  }
  const issues = [];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const body = without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const withId = { ...body, [spec.idField]: expectedId };
  if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, withId)) {
    issues.push(`${name}_hash_invalid`);
  }
  return issues;
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

function sealDescriptor(value) {
  return {
    ...value,
    descriptorHash: hashWithDomain(
      "FINPLE_STEP114_2X_O_TRANSPORT_NEUTRAL_ADAPTER_DESCRIPTOR_HASH\0",
      value,
    ),
  };
}

function buildUpstream(stepNPacket, stepNInvocationReceiptCandidate,
  stepNInvocationVerificationSummary) {
  return {
    stepNPacket,
    stepNInvocationReceiptCandidate,
    stepNInvocationVerificationSummary,
  };
}

function getNestedMaterial(upstream) {
  const nPacket = upstream.stepNPacket;
  const nContext = nPacket.context;
  const nUpstream = nContext.upstream;
  const mPacket = nUpstream.stepMPacket;
  const mContext = mPacket.context;
  const lUpstream = mContext.upstream;
  const lPacket = lUpstream.stepLPacket;
  const lBinding = stepL.buildBindings(lPacket.intakeContext.upstream);
  return { nPacket, nContext, nUpstream, mPacket, mContext, lUpstream, lPacket, lBinding };
}

function buildBindings(upstream) {
  const { nPacket, nContext } = getNestedMaterial(upstream);
  const summary = upstream.stepNInvocationVerificationSummary;
  const receipt = upstream.stepNInvocationReceiptCandidate;
  return {
    stepNInvocationVerificationSummaryId: summary.invocationVerificationSummaryId,
    stepNInvocationVerificationSummaryHash: summary.invocationVerificationSummaryHash,
    stepNInvocationReceiptCandidateId: receipt.invocationReceiptCandidateId,
    stepNInvocationReceiptCandidateHash: receipt.invocationReceiptCandidateHash,
    stepNInvocationId: nPacket.invocation.invocationId,
    stepNInvocationHash: nPacket.invocation.invocationHash,
    stepNInvokerAllowlistId: nContext.invokerAllowlist.invokerAllowlistId,
    stepNInvokerAllowlistHash: nContext.invokerAllowlist.invokerAllowlistHash,
    stepNInvocationVerificationPolicyId:
      nContext.verificationPolicy.invocationVerificationPolicyId,
    stepNInvocationVerificationPolicyHash:
      nContext.verificationPolicy.invocationVerificationPolicyHash,
    ...stepN.buildBindings(nContext.upstream),
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "stepNPacket", "stepNInvocationReceiptCandidate",
    "stepNInvocationVerificationSummary",
  ])) return ["step_n_upstream_fields_invalid"];
  const p = upstream.stepNPacket;
  if (!isRecord(p) || !hasExactKeys(p, [
    "context", "invocation", "evaluationClockInstant",
  ])) return ["step_n_packet_fields_invalid"];
  let material;
  try { material = getNestedMaterial(upstream); } catch {
    return ["step_n_nested_material_invalid"];
  }
  const { nContext, nUpstream, mPacket, mContext, lUpstream, lPacket } = material;
  const issues = [
    ...stepN.validateUpstream(nUpstream),
    ...stepN.validateInvocationContext(nContext),
    ...stepN.validateSignedInvocation(p.invocation, nContext, p.evaluationClockInstant),
    ...stepN.validateReceiptCandidate(
      upstream.stepNInvocationReceiptCandidate, p.invocation, nContext,
    ),
    ...stepN.validateVerificationPolicy(nContext.verificationPolicy, nUpstream),
    ...stepN.validateSummary(
      upstream.stepNInvocationVerificationSummary,
      p.invocation,
      nContext,
      upstream.stepNInvocationReceiptCandidate,
    ),
    ...stepM.validateUpstream(lUpstream),
    ...stepM.validateApprovalContext(mContext),
    ...stepM.validateSignedApprovalResponse(
      mPacket.approvalResponse, mContext, mPacket.evaluationClockInstant,
    ),
    ...stepM.validateObservationAuthorityPackage(
      nUpstream.stepMObservationAuthorityPackage, mPacket.approvalResponse, mContext,
    ),
    ...stepM.validateVerificationPolicy(mContext.verificationPolicy, lUpstream),
    ...stepM.validateSummary(
      nUpstream.stepMApprovalVerificationSummary,
      mPacket.approvalResponse,
      mContext,
      nUpstream.stepMObservationAuthorityPackage,
    ),
    ...stepL.validateUpstream(lPacket.intakeContext.upstream),
    ...stepL.validateIntakeContext(lPacket.intakeContext),
    ...stepL.validateSanitizedObservationIntake(
      lPacket.intake, lPacket.intakeContext, lPacket.evaluationClockInstant,
    ),
    ...stepL.validateApprovalRequestEnvelope(
      lPacket.approvalRequest,
      lPacket.intake,
      lPacket.intakeContext,
      lPacket.requestContext,
      lPacket.evaluationClockInstant,
    ),
    ...stepL.validateSummary(
      lUpstream.stepLSummary,
      lPacket.intake,
      lPacket.approvalRequest,
      lPacket.intakeContext.upstream,
    ),
    ...stepH.validateRequestContext(lPacket.requestContext),
    ...stepH.validateLiveObservationApprovalRequest(
      lPacket.approvalRequest, lPacket.requestContext, lPacket.evaluationClockInstant,
    ),
  ];
  let expectedReceipt;
  let expectedSummary;
  try {
    expectedReceipt = stepN.buildReceiptCandidate(p.invocation, nContext);
    expectedSummary = stepN.buildSummary(p.invocation, nContext, expectedReceipt);
  } catch {}
  if (!expectedReceipt || !canonicalEqual(
    expectedReceipt, upstream.stepNInvocationReceiptCandidate,
  )) issues.push("step_n_receipt_binding_mismatch");
  if (!expectedSummary || !canonicalEqual(
    expectedSummary, upstream.stepNInvocationVerificationSummary,
  )) issues.push("step_n_summary_binding_mismatch");
  return uniqueSorted(issues);
}

function deriveClaimKeyHash(upstream) {
  const invocation = upstream.stepNPacket.invocation;
  return hashWithDomain(
    CLAIM_KEY_DERIVATION_DOMAIN,
    {
      invocationId: invocation.invocationId,
      invocationHash: invocation.invocationHash,
      invocationNonceHash: invocation.invocationNonceHash,
    },
  );
}

function buildExecutorInput(upstream, overrides = {}) {
  const { nPacket, lPacket, lBinding } = getNestedMaterial(upstream);
  const invocation = nPacket.invocation;
  return sealContract({
    contractVersion: VERSIONS.input,
    ...buildBindings(upstream),
    selectedCandidateClass: lBinding.selectedCandidateClass,
    targetPurposeClassification: lBinding.targetPurposeClassification,
    namespaceCategory: lBinding.namespaceCategory,
    destinationCount: 1,
    observationWindowStartsAt: invocation.observationWindowStartsAt,
    observationWindowExpiresAt: invocation.observationWindowExpiresAt,
    expiresAt: invocation.expiresAt,
    requiredObservationCategories: [...OBSERVATION_CATEGORIES],
    requiredHashPlaceholders: [...lBinding.requiredHashPlaceholders],
    requiredTimestampPlaceholders: [...lBinding.requiredTimestampPlaceholders],
    runtimeDeniedPrivileges: [...lBinding.runtimeDeniedPrivileges],
    credentialAttestationCategories: [...lBinding.credentialAttestationCategories],
    credentialCategoriesDistinct: true,
    invocationNonceHash: invocation.invocationNonceHash,
    claimNonceHash: "f".repeat(64),
    claimKeyHash: deriveClaimKeyHash(upstream),
    claimExpiresAt: invocation.expiresAt,
    syntheticValidationOnly: true,
    realExecutorInputRecorded: false,
    invocationConsumed: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
    ...overrides,
  }, "input");
}

function buildConsumptionPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.consumption,
    ...buildBindings(upstream),
    claimKeyDerivationDomain: CLAIM_KEY_DERIVATION_DOMAIN,
    claimKeyInputFields: [...CLAIM_KEY_INPUT_FIELDS],
    claimKeyHash: deriveClaimKeyHash(upstream),
    claimExpiresAt: upstream.stepNPacket.invocation.expiresAt,
    maximumAtomicClaimCount: 1,
    atomicClaimPrimitive: CLAIM_ATOMICITY,
    claimStoreNamespace: CLAIM_NAMESPACE,
    executionReceiptNamespace: EXECUTION_RECEIPT_NAMESPACE,
    namespacesDistinct: true,
    duplicateInvocationRejected: true,
    replayedInvocationRejected: true,
    claimExpiryBoundToInvocationAndObservationWindow: true,
    claimFailureBlocksBeforeAdapterInvocation: true,
    automaticRetryAllowed: false,
    ambiguousClaimOutcomeRetryAllowed: false,
    ambiguousAdapterOutcomeRetryAllowed: false,
    operatorReviewRequiredOnUncertainty: true,
    durableStoreAccessed: false,
    claimCreated: false,
    claimPersisted: false,
    rawMaterialPresent: false,
  }, "consumption");
}

function buildAdapterDescriptor(overrides = {}) {
  return sealDescriptor({
    adapterInterfaceVersion: ADAPTER_INTERFACE_VERSION,
    transportNeutral: true,
    observationSequence: [...ADAPTER_OBSERVATION_SEQUENCE],
    requiredObservationCategories: [...OBSERVATION_CATEGORIES],
    maximumSequenceCount: 1,
    destinationCount: 1,
    readOnly: true,
    writesSupported: false,
    ddlSupported: false,
    dmlSupported: false,
    stateMutationSupported: false,
    migrationSupported: false,
    scenarioExecutionSupported: false,
    providerMutationSupported: false,
    credentialEchoSupported: false,
    credentialPersistenceSupported: false,
    rawEndpointOutputSupported: false,
    rawCertificateOutputSupported: false,
    rawCredentialOutputSupported: false,
    productionDatabaseAccessSupported: false,
    automaticRetrySupported: false,
    ambiguousOutcomeRetrySupported: false,
    invocationSupportedInPreflight: false,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...overrides,
  });
}

function validateAdapterDescriptor(value) {
  if (!isRecord(value) || !hasExactKeys(value, DESCRIPTOR_FIELDS)) {
    return ["adapter_descriptor_fields_invalid"];
  }
  let expected;
  try { expected = buildAdapterDescriptor(); } catch {
    return ["adapter_descriptor_expected_construction_failed"];
  }
  const issues = [];
  for (const field of DESCRIPTOR_FIELDS) {
    if (!canonicalEqual(value[field], expected[field])) {
      issues.push(`adapter_descriptor_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildAdapterCapabilityPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.adapter,
    ...buildBindings(upstream),
    adapterInterfaceVersion: ADAPTER_INTERFACE_VERSION,
    transportNeutralDescriptorRequired: true,
    observationSequence: [...ADAPTER_OBSERVATION_SEQUENCE],
    requiredObservationCategories: [...OBSERVATION_CATEGORIES],
    maximumSequenceCount: 1,
    destinationCount: 1,
    readOnlyObservationOnly: true,
    writesAllowed: false,
    ddlAllowed: false,
    dmlAllowed: false,
    stateMutationAllowed: false,
    migrationAllowed: false,
    scenarioExecutionAllowed: false,
    providerMutationAllowed: false,
    credentialEchoAllowed: false,
    credentialPersistenceAllowed: false,
    rawEndpointOutputAllowed: false,
    rawCertificateOutputAllowed: false,
    rawCredentialOutputAllowed: false,
    productionDatabaseAccessAllowed: false,
    automaticRetryAllowed: false,
    ambiguousOutcomeRetryAllowed: false,
    adapterInvocationAllowed: false,
    adapterInvoked: false,
    rawMaterialPresent: false,
  }, "adapter");
}

function validateConsumptionPolicy(value, upstream) {
  const issues = [...validateEnvelope(value, "consumption")];
  let expected;
  try { expected = buildConsumptionPolicy(upstream); } catch {
    return uniqueSorted([...issues, "consumption_policy_expected_construction_failed"]);
  }
  for (const field of CONSUMPTION_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`consumption_policy_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function validateAdapterCapabilityPolicy(value, upstream) {
  const issues = [...validateEnvelope(value, "adapter")];
  let expected;
  try { expected = buildAdapterCapabilityPolicy(upstream); } catch {
    return uniqueSorted([...issues, "adapter_policy_expected_construction_failed"]);
  }
  for (const field of ADAPTER_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`adapter_policy_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function validateContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "consumptionPolicy", "adapterCapabilityPolicy",
    "adapterDescriptor", "priorClaimNonceHashes", "priorInvocationNonceHashes",
  ])) return ["executor_context_fields_invalid"];
  const issues = [
    ...validateConsumptionPolicy(context.consumptionPolicy, context.upstream),
    ...validateAdapterCapabilityPolicy(context.adapterCapabilityPolicy, context.upstream),
    ...validateAdapterDescriptor(context.adapterDescriptor),
    ...validateHashArray(context.priorClaimNonceHashes, "prior_claim_nonce_hashes"),
    ...validateHashArray(
      context.priorInvocationNonceHashes, "prior_executor_invocation_nonce_hashes",
    ),
  ];
  if (issues.length > 0) return uniqueSorted(issues);
  issues.push(...validateUpstream(context.upstream));
  return uniqueSorted(issues);
}

function validateExecutorInputShape(value) {
  const issues = [...validateEnvelope(value, "input")];
  if (!isRecord(value)) return uniqueSorted(issues);
  for (const field of ["invocationNonceHash", "claimNonceHash", "claimKeyHash"]) {
    if (!isSha256(value[field])) issues.push(`executor_input_hash_invalid:${field}`);
  }
  if (value.destinationCount !== 1 ||
      !canonicalEqual(value.requiredObservationCategories, OBSERVATION_CATEGORIES) ||
      value.credentialCategoriesDistinct !== true) {
    issues.push("executor_input_scope_invalid");
  }
  if (value.syntheticValidationOnly !== true ||
      value.realExecutorInputRecorded !== false || value.invocationConsumed !== false ||
      value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false ||
      value.manualReviewRequired !== false) {
    issues.push("executor_input_synthetic_boundary_invalid");
  }
  return uniqueSorted(issues);
}

function validateExecutorInput(value, context, evaluationClockInstant) {
  const issues = [...validateExecutorInputShape(value)];
  if (!isRecord(value) || issues.length > 0) return uniqueSorted(issues);
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "consumptionPolicy", "adapterCapabilityPolicy",
    "adapterDescriptor", "priorClaimNonceHashes", "priorInvocationNonceHashes",
  ])) return uniqueSorted([...issues, "executor_context_fields_invalid"]);
  const nonceContextIssues = [
    ...validateHashArray(context.priorClaimNonceHashes, "prior_claim_nonce_hashes"),
    ...validateHashArray(
      context.priorInvocationNonceHashes, "prior_executor_invocation_nonce_hashes",
    ),
  ];
  if (nonceContextIssues.length > 0) return uniqueSorted([...issues, ...nonceContextIssues]);
  let expected;
  try { expected = buildExecutorInput(context.upstream, {
    claimNonceHash: value.claimNonceHash,
  }); } catch {
    return uniqueSorted([...issues, "executor_input_expected_construction_failed"]);
  }
  for (const field of INPUT_FIELDS) {
    if (!canonicalEqual(value[field], expected[field])) {
      issues.push(`executor_input_field_invalid:${field}`);
    }
  }
  const invocation = context.upstream.stepNPacket.invocation;
  const nonceSet = [
    invocation.requestNonceHash,
    invocation.intakeNonceHash,
    invocation.approvalResponseNonceHash,
    invocation.invocationNonceHash,
    value.claimNonceHash,
  ];
  if (new Set(nonceSet).size !== nonceSet.length) {
    issues.push("executor_input_nonce_not_distinct");
  }
  if (context.priorClaimNonceHashes.includes(value.claimNonceHash)) {
    issues.push("executor_input_claim_nonce_replay");
  }
  if (context.priorInvocationNonceHashes.includes(value.invocationNonceHash)) {
    issues.push("executor_input_invocation_nonce_replay");
  }
  const now = parseInstant(evaluationClockInstant);
  const starts = parseInstant(value.observationWindowStartsAt);
  const windowExpires = parseInstant(value.observationWindowExpiresAt);
  const inputExpires = parseInstant(value.expiresAt);
  const claimExpires = parseInstant(value.claimExpiresAt);
  const invocationExpires = parseInstant(invocation.expiresAt);
  if ([now, starts, windowExpires, inputExpires, claimExpires, invocationExpires]
    .some((instant) => instant === null)) {
    issues.push("executor_input_time_invalid");
  } else {
    if (starts >= windowExpires || inputExpires > windowExpires ||
        inputExpires > invocationExpires || claimExpires > inputExpires ||
        claimExpires > windowExpires || claimExpires > invocationExpires) {
      issues.push("executor_input_expiry_boundary_invalid");
    }
    if (now < starts || now >= inputExpires) issues.push("executor_input_evaluation_time_invalid");
  }
  if (issues.length > 0) return uniqueSorted(issues);
  issues.push(...validateContext(context));
  return uniqueSorted(issues);
}

function buildEvidenceManifest(executorInput, context) {
  return sealContract({
    contractVersion: VERSIONS.manifest,
    ...buildBindings(context.upstream),
    executorInputId: executorInput.executorInputId,
    executorInputHash: executorInput.executorInputHash,
    adapterCapabilityPolicyId: context.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    adapterCapabilityPolicyHash: context.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    requiredObservationCategories: [...OBSERVATION_CATEGORIES],
    requiredHashOutputFields: [...executorInput.requiredHashPlaceholders],
    requiredTimestampOutputFields: [...executorInput.requiredTimestampPlaceholders],
    observationWindowStartsAt: executorInput.observationWindowStartsAt,
    observationWindowExpiresAt: executorInput.observationWindowExpiresAt,
    destinationCount: 1,
    rawMaterialForbidden: true,
    separateEvidenceFinalizationRequired: true,
    separateDisposalRequired: true,
    outputValuesPopulated: false,
    evidenceCollected: false,
    adapterInvoked: false,
    observationStarted: false,
    observationCompleted: false,
    claimCreated: false,
    invocationConsumed: false,
    executionReceiptPersisted: false,
    syntheticValidationOnly: true,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "manifest");
}

function validateEvidenceManifest(value, executorInput, context) {
  const issues = [...validateEnvelope(value, "manifest")];
  let expected;
  try { expected = buildEvidenceManifest(executorInput, context); } catch {
    return uniqueSorted([...issues, "evidence_manifest_expected_construction_failed"]);
  }
  for (const field of MANIFEST_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`evidence_manifest_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildSummary(executorInput, context, manifest) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    ...buildBindings(context.upstream),
    executorInputId: executorInput.executorInputId,
    executorInputHash: executorInput.executorInputHash,
    singleUseConsumptionPolicyId:
      context.consumptionPolicy.singleUseConsumptionPolicyId,
    singleUseConsumptionPolicyHash:
      context.consumptionPolicy.singleUseConsumptionPolicyHash,
    adapterCapabilityPolicyId: context.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    adapterCapabilityPolicyHash: context.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    evidenceManifestId: manifest.evidenceManifestId,
    evidenceManifestHash: manifest.evidenceManifestHash,
    publicState: "live_observation_executor_preflight_prepared",
    stepNPackageValidated: true,
    executorInputsValidated: true,
    singleUseClaimProtocolValidated: true,
    adapterCapabilityPolicyValidated: true,
    evidenceManifestPrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateSummary(value, executorInput, context, manifest) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(executorInput, context, manifest); } catch {
    return uniqueSorted([...issues, "executor_summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`executor_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, manifest = {}, issues = []) {
  const prepared = status === "live_observation_executor_preflight_prepared";
  return {
    ok: prepared,
    status,
    contractVersion: VERSIONS.summary,
    executorPreflightPrepared: prepared,
    singleUseClaimProtocolValidated: prepared,
    adapterCapabilityPolicyValidated: prepared,
    evidenceManifestPrepared: prepared,
    executorPreflightSummary: prepared ? summary : {},
    evidenceManifestTemplate: prepared ? manifest : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: prepared ? [
      "preflight_prepared_does_not_claim_consume_invoke_observe_connect_execute_collect_dispose_persist_or_deploy",
    ] : [],
  };
}

function evaluateLiveObservationExecutorPreflight(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_external_live_observation_executor_inputs");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "context", "executorInput", "evaluationClockInstant",
  ])) return safeResult("blocked", {}, {}, ["executor_preflight_packet_fields_invalid"]);
  try {
    const issues = validateExecutorInput(
      packet.executorInput, packet.context, packet.evaluationClockInstant,
    );
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    const manifest = buildEvidenceManifest(packet.executorInput, packet.context);
    issues.push(...validateEvidenceManifest(manifest, packet.executorInput, packet.context));
    const summary = buildSummary(packet.executorInput, packet.context, manifest);
    issues.push(...validateSummary(summary, packet.executorInput, packet.context, manifest));
    canonicalJson(manifest);
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues)
      : safeResult("live_observation_executor_preflight_prepared", summary, manifest);
  } catch {
    return safeResult("blocked", {}, {}, ["live_observation_executor_preflight_validation_failed"]);
  }
}

module.exports = {
  ADAPTER_INTERFACE_VERSION,
  ADAPTER_OBSERVATION_SEQUENCE,
  CLAIM_ATOMICITY,
  CLAIM_KEY_DERIVATION_DOMAIN,
  CLAIM_KEY_INPUT_FIELDS,
  CLAIM_NAMESPACE,
  EXECUTION_RECEIPT_NAMESPACE,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  OBSERVATION_CATEGORIES,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  SPECS,
  STEP_N_BINDING_FIELDS,
  VERSIONS,
  buildAdapterCapabilityPolicy,
  buildAdapterDescriptor,
  buildBindings,
  buildConsumptionPolicy,
  buildEvidenceManifest,
  buildExecutorInput,
  buildSummary,
  buildUpstream,
  deriveClaimKeyHash,
  evaluateLiveObservationExecutorPreflight,
  safeResult,
  sealContract,
  validateAdapterCapabilityPolicy,
  validateAdapterDescriptor,
  validateConsumptionPolicy,
  validateContext,
  validateEvidenceManifest,
  validateExecutorInput,
  validateExecutorInputShape,
  validateSummary,
  validateUpstream,
};
