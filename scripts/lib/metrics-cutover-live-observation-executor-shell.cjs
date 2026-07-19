"use strict";

const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const stepO = require("./metrics-cutover-live-observation-executor-preflight.cjs");
const stepN = require("./metrics-cutover-live-observation-invocation.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  dependencies: "metrics-cutover-live-observation-execution-dependency-bundle-v1-step114-2x-p",
  claimStore: "metrics-cutover-live-observation-claim-store-interface-v1-step114-2x-p",
  adapter: "metrics-cutover-live-observation-adapter-interface-v1-step114-2x-p",
  receiptStore: "metrics-cutover-live-observation-receipt-store-interface-v1-step114-2x-p",
  plan: "metrics-cutover-live-observation-execution-plan-v1-step114-2x-p",
  receipt: "metrics-cutover-live-observation-execution-receipt-candidate-v1-step114-2x-p",
  summary: "metrics-cutover-live-observation-executor-shell-summary-v1-step114-2x-p",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_live_observation_execution_dependencies",
  "live_observation_executor_shell_validated",
  "blocked",
]);

const CLAIM_OUTCOMES = Object.freeze([
  "acquired", "already_exists", "expired", "ambiguous", "failed",
]);
const ADAPTER_OUTCOMES = Object.freeze([
  "completed", "blocked", "ambiguous", "failed",
]);
const EXECUTION_STATE_SEQUENCE = Object.freeze([
  "preflight_revalidated",
  "claim_acquisition_requested",
  "claim_acquired",
  "adapter_invocation_requested",
  "adapter_completed",
  "receipt_candidate_prepared",
  "completed",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
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
  ...stepO.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const CLAIM_STORE_INTERFACE_VERSION =
  "transport-neutral-atomic-claim-store-interface-v1-step114-2x-p";
const RECEIPT_STORE_INTERFACE_VERSION =
  "transport-neutral-non-persistent-receipt-store-interface-v1-step114-2x-p";
const TRACE_HASH_DOMAIN = "FINPLE_STEP114_2X_P_EXECUTION_STATE_TRACE_HASH\0";
const upstreamValidationCache = new Map();
const stepOValidationCache = new Map();

const SPECS = Object.freeze({
  dependencies: Object.freeze({
    version: VERSIONS.dependencies,
    idField: "executionDependencyBundleId",
    hashField: "executionDependencyBundleHash",
    prefix: "metrics-cutover-live-observation-execution-dependency-bundle",
    idDomain: "FINPLE_STEP114_2X_P_EXECUTION_DEPENDENCY_BUNDLE_ID\0",
    hashDomain: "FINPLE_STEP114_2X_P_EXECUTION_DEPENDENCY_BUNDLE_HASH\0",
  }),
  plan: Object.freeze({
    version: VERSIONS.plan,
    idField: "executionPlanId",
    hashField: "executionPlanHash",
    prefix: "metrics-cutover-live-observation-execution-plan",
    idDomain: "FINPLE_STEP114_2X_P_EXECUTION_PLAN_ID\0",
    hashDomain: "FINPLE_STEP114_2X_P_EXECUTION_PLAN_HASH\0",
  }),
  receipt: Object.freeze({
    version: VERSIONS.receipt,
    idField: "executionReceiptCandidateId",
    hashField: "executionReceiptCandidateHash",
    prefix: "metrics-cutover-live-observation-execution-receipt-candidate",
    idDomain: "FINPLE_STEP114_2X_P_EXECUTION_RECEIPT_CANDIDATE_ID\0",
    hashDomain: "FINPLE_STEP114_2X_P_EXECUTION_RECEIPT_CANDIDATE_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "executorShellSummaryId",
    hashField: "executorShellSummaryHash",
    prefix: "metrics-cutover-live-observation-executor-shell-summary",
    idDomain: "FINPLE_STEP114_2X_P_EXECUTOR_SHELL_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_P_EXECUTOR_SHELL_SUMMARY_HASH\0",
  }),
});

const STEP_O_BINDING_FIELDS = Object.freeze([
  "stepOExecutorPreflightSummaryId", "stepOExecutorPreflightSummaryHash",
  "stepOExecutorInputId", "stepOExecutorInputHash",
  "stepOSingleUseConsumptionPolicyId", "stepOSingleUseConsumptionPolicyHash",
  "stepOAdapterCapabilityPolicyId", "stepOAdapterCapabilityPolicyHash",
  "stepOEvidenceManifestId", "stepOEvidenceManifestHash",
  "stepNInvocationId", "stepNInvocationHash",
  "stepNInvocationReceiptCandidateId", "stepNInvocationReceiptCandidateHash",
]);

const CLAIM_STORE_FIELDS = Object.freeze([
  "contractVersion", "claimStoreInterfaceVersion", "transportNeutral",
  "atomicClaimPrimitive", "claimKeyDerivationDomain", "claimKeyInputFields",
  "claimKeyHash", "maximumSuccessfulAcquisitions", "deterministicOutcomes",
  "duplicateInvocationRejected", "replayedInvocationRejected", "expiryEnforced",
  "claimStoreNamespace", "executionReceiptNamespace", "namespacesDistinct",
  "automaticRetryAllowed", "ambiguousOutcomeRetryAllowed", "durableStoreAccessed",
  "syntheticInMemoryOnly", "realDependencyBound", "rawMaterialPresent",
  "claimStoreInterfaceHash",
]);
const ADAPTER_FIELDS = Object.freeze([
  "contractVersion", "adapterInterfaceVersion", "transportNeutral",
  "destinationCount", "readOnly", "observationSequence",
  "requiredObservationCategories", "maximumInvocationCount", "deterministicOutcomes",
  "requiredHashOutputFields", "requiredTimestampOutputFields", "writesSupported",
  "ddlSupported", "dmlSupported", "stateMutationSupported", "migrationSupported",
  "scenarioExecutionSupported", "providerMutationSupported", "productionAccessSupported",
  "credentialEchoSupported", "credentialPersistenceSupported", "rawEndpointOutputSupported",
  "rawCertificateOutputSupported", "rawCredentialOutputSupported",
  "automaticRetrySupported", "ambiguousOutcomeRetrySupported", "externalAdapterBound",
  "syntheticInMemoryOnly", "realDependencyBound", "rawMaterialPresent",
  "adapterInterfaceHash",
]);
const RECEIPT_STORE_FIELDS = Object.freeze([
  "contractVersion", "receiptStoreInterfaceVersion", "transportNeutral",
  "executionReceiptNamespace", "claimStoreNamespace", "namespacesDistinct",
  "acceptsNonPersistentCandidateOnly", "durablePersistenceAllowed",
  "automaticRetryAllowed", "storeAccessed", "syntheticInMemoryOnly",
  "realDependencyBound", "rawMaterialPresent", "receiptStoreInterfaceHash",
]);
const DEPENDENCY_FIELDS = Object.freeze([
  "contractVersion", "executionDependencyBundleId", ...STEP_O_BINDING_FIELDS,
  "claimStoreInterfaceHash", "adapterInterfaceHash", "receiptStoreInterfaceHash",
  "evaluationClockInstant", "syntheticValidationOnly", "realDependencyBound",
  "rawMaterialPresent", "providerSpecificMaterialPresent", "manualReviewRequired",
  "executionDependencyBundleHash",
]);
const PLAN_FIELDS = Object.freeze([
  "contractVersion", "executionPlanId", ...STEP_O_BINDING_FIELDS,
  "executionDependencyBundleId", "executionDependencyBundleHash",
  "claimKeyHash", "claimNonceHash", "claimExpiresAt", "claimOutcome",
  "adapterOutcome", "executionStateSequence", "maximumAdapterInvocationCount",
  "syntheticAdapterInvocationCount", "automaticRetryAllowed",
  "stateMachineTraceHash", "syntheticValidationOnly", "realExecutionPlanned",
  "rawMaterialPresent", "executionPlanHash",
]);
const ADAPTER_OUTPUT_FIELDS = Object.freeze([
  "observationSequence", "observationCategories", "hashOutputs",
  "timestampOutputs", "destinationCount", "observationCount", "completedAt",
  "sanitizedOnly", "rawMaterialPresent",
]);
const RECEIPT_FIELDS = Object.freeze([
  "contractVersion", "executionReceiptCandidateId", ...STEP_O_BINDING_FIELDS,
  "executionDependencyBundleId", "executionDependencyBundleHash",
  "executionPlanId", "executionPlanHash", "claimKeyHash", "claimNonceHash",
  "claimOutcome", "adapterInterfaceHash", "adapterCapabilityPolicyId",
  "adapterCapabilityPolicyHash", "observationSequence", "observationCategories",
  "sanitizedHashOutputs", "canonicalTimestampOutputs", "destinationCount",
  "observationCount", "stateMachineTraceHash", "observationWindowStartsAt",
  "observationWindowExpiresAt", "completedAt", "separateFinalizationRequired",
  "separateDisposalRequired", "syntheticValidationOnly", "nonPersistent",
  "realClaimPersisted", "realInvocationConsumed", "realAdapterInvoked",
  "realObservationCompleted", "executionReceiptPersisted", "rawMaterialPresent",
  ...FIXED_FALSE_FIELDS, "executionReceiptCandidateHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "executorShellSummaryId", ...STEP_O_BINDING_FIELDS,
  "executionDependencyBundleId", "executionDependencyBundleHash",
  "executionPlanId", "executionPlanHash", "executionReceiptCandidateId",
  "executionReceiptCandidateHash", "publicState", "stepOPackageValidated",
  "executionDependenciesValidated", "claimStoreInterfaceValidated",
  "adapterInterfaceValidated", "receiptStoreInterfaceValidated",
  "singleUseStateMachineValidated", "sanitizedReceiptCandidatePrepared",
  "syntheticValidationOnly", "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "executorShellSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  claimStore: CLAIM_STORE_FIELDS,
  adapter: ADAPTER_FIELDS,
  receiptStore: RECEIPT_STORE_FIELDS,
  dependencies: DEPENDENCY_FIELDS,
  plan: PLAN_FIELDS,
  adapterOutput: ADAPTER_OUTPUT_FIELDS,
  receipt: RECEIPT_FIELDS,
  summary: SUMMARY_FIELDS,
});

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
function sealDescriptor(value, domain, hashField) {
  return { ...value, [hashField]: hashWithDomain(domain, value) };
}
function validateDescriptorEnvelope(value, fields, domain, hashField, prefix) {
  if (!isRecord(value) || !hasExactKeys(value, fields)) return [`${prefix}_fields_invalid`];
  const expected = hashWithDomain(domain, without(value, hashField));
  return value[hashField] === expected ? [] : [`${prefix}_hash_invalid`];
}

function buildUpstream(stepOPacket, stepOEvidenceManifest,
  stepOExecutorPreflightSummary) {
  return { stepOPacket, stepOEvidenceManifest, stepOExecutorPreflightSummary };
}

function getMaterial(upstream) {
  const oPacket = upstream.stepOPacket;
  const oContext = oPacket.context;
  const oUpstream = oContext.upstream;
  const nPacket = oUpstream.stepNPacket;
  const nContext = nPacket.context;
  const nUpstream = nContext.upstream;
  const mPacket = nUpstream.stepMPacket;
  const mContext = mPacket.context;
  const lUpstream = mContext.upstream;
  const lPacket = lUpstream.stepLPacket;
  return { oPacket, oContext, oUpstream, nPacket, nContext, nUpstream,
    mPacket, mContext, lUpstream, lPacket };
}

function buildBindings(upstream) {
  const { oPacket, oContext, nPacket } = getMaterial(upstream);
  const oSummary = upstream.stepOExecutorPreflightSummary;
  const manifest = upstream.stepOEvidenceManifest;
  const input = oPacket.executorInput;
  const consumption = oContext.consumptionPolicy;
  const adapter = oContext.adapterCapabilityPolicy;
  const nReceipt = oContext.upstream.stepNInvocationReceiptCandidate;
  return {
    stepOExecutorPreflightSummaryId: oSummary.executorPreflightSummaryId,
    stepOExecutorPreflightSummaryHash: oSummary.executorPreflightSummaryHash,
    stepOExecutorInputId: input.executorInputId,
    stepOExecutorInputHash: input.executorInputHash,
    stepOSingleUseConsumptionPolicyId: consumption.singleUseConsumptionPolicyId,
    stepOSingleUseConsumptionPolicyHash: consumption.singleUseConsumptionPolicyHash,
    stepOAdapterCapabilityPolicyId: adapter.adapterCapabilityPolicyId,
    stepOAdapterCapabilityPolicyHash: adapter.adapterCapabilityPolicyHash,
    stepOEvidenceManifestId: manifest.evidenceManifestId,
    stepOEvidenceManifestHash: manifest.evidenceManifestHash,
    stepNInvocationId: nPacket.invocation.invocationId,
    stepNInvocationHash: nPacket.invocation.invocationHash,
    stepNInvocationReceiptCandidateId: nReceipt.invocationReceiptCandidateId,
    stepNInvocationReceiptCandidateHash: nReceipt.invocationReceiptCandidateHash,
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "stepOPacket", "stepOEvidenceManifest", "stepOExecutorPreflightSummary",
  ])) return ["step_o_upstream_fields_invalid"];
  const p = upstream.stepOPacket;
  if (!isRecord(p) || !hasExactKeys(p, [
    "context", "executorInput", "evaluationClockInstant",
  ])) return ["step_o_packet_fields_invalid"];
  let cacheKey;
  try {
    cacheKey = hashWithDomain(
      "FINPLE_STEP114_2X_P_UPSTREAM_VALIDATION_CACHE_KEY\0", upstream,
    );
    if (upstreamValidationCache.has(cacheKey)) {
      return [...upstreamValidationCache.get(cacheKey)];
    }
  } catch {
    return ["step_o_upstream_canonicalization_invalid"];
  }
  let material;
  try { material = getMaterial(upstream); } catch {
    return ["step_o_nested_material_invalid"];
  }
  const { oContext, oUpstream, nPacket, nContext, nUpstream, mPacket, mContext,
    lUpstream, lPacket } = material;
  const issues = [];
  function cachedStepOValidation(label, value, validator) {
    const key = `${label}:${hashWithDomain(
      "FINPLE_STEP114_2X_P_STEP_O_VALIDATION_CACHE_KEY\0", value,
    )}`;
    if (!stepOValidationCache.has(key)) {
      if (stepOValidationCache.size >= 64) stepOValidationCache.clear();
      stepOValidationCache.set(key, uniqueSorted(validator()));
    }
    return [...stepOValidationCache.get(key)];
  }
  issues.push(...cachedStepOValidation("upstream", oUpstream,
    () => stepO.validateUpstream(oUpstream)));
  if (issues.length > 0) {
    const result = uniqueSorted(issues);
    upstreamValidationCache.set(cacheKey, result);
    return [...result];
  }
  issues.push(...cachedStepOValidation("context", oContext,
    () => stepO.validateContext(oContext)));
  if (issues.length > 0) {
    const result = uniqueSorted(issues);
    upstreamValidationCache.set(cacheKey, result);
    return [...result];
  }
  issues.push(...cachedStepOValidation("input", {
    executorInput: p.executorInput,
    context: oContext,
    evaluationClockInstant: p.evaluationClockInstant,
  }, () => stepO.validateExecutorInput(
    p.executorInput, oContext, p.evaluationClockInstant,
  )));
  if (issues.length > 0) {
    const result = uniqueSorted(issues);
    upstreamValidationCache.set(cacheKey, result);
    return [...result];
  }
  issues.push(...stepO.validateConsumptionPolicy(oContext.consumptionPolicy, oUpstream));
  issues.push(...stepO.validateAdapterDescriptor(oContext.adapterDescriptor));
  issues.push(...stepO.validateAdapterCapabilityPolicy(oContext.adapterCapabilityPolicy, oUpstream));
  issues.push(...stepO.validateEvidenceManifest(
      upstream.stepOEvidenceManifest, p.executorInput, oContext,
    ));
  issues.push(...stepO.validateSummary(
      upstream.stepOExecutorPreflightSummary, p.executorInput, oContext,
      upstream.stepOEvidenceManifest,
    ));
  issues.push(
    ...stepN.validateUpstream(nUpstream),
    ...stepN.validateInvocationContext(nContext),
    ...stepN.validateSignedInvocation(
      nPacket.invocation, nContext, nPacket.evaluationClockInstant,
    ),
    ...stepN.validateReceiptCandidate(
      oUpstream.stepNInvocationReceiptCandidate, nPacket.invocation, nContext,
    ),
    ...stepN.validateVerificationPolicy(nContext.verificationPolicy, nUpstream),
    ...stepN.validateSummary(
      oUpstream.stepNInvocationVerificationSummary, nPacket.invocation, nContext,
      oUpstream.stepNInvocationReceiptCandidate,
    ),
    ...stepM.validateUpstream(lUpstream),
    ...stepM.validateApprovalContext(mContext),
    ...stepM.validateSignedApprovalResponse(
      mPacket.approvalResponse, mContext, mPacket.evaluationClockInstant,
    ),
    ...stepM.validateObservationAuthorityPackage(
      nUpstream.stepMObservationAuthorityPackage, mPacket.approvalResponse, mContext,
    ),
    ...stepL.validateUpstream(lPacket.intakeContext.upstream),
    ...stepL.validateIntakeContext(lPacket.intakeContext),
    ...stepL.validateSanitizedObservationIntake(
      lPacket.intake, lPacket.intakeContext, lPacket.evaluationClockInstant,
    ),
    ...stepH.validateRequestContext(lPacket.requestContext),
    ...stepH.validateLiveObservationApprovalRequest(
      lPacket.approvalRequest, lPacket.requestContext, lPacket.evaluationClockInstant,
    ),
  );
  let expectedManifest;
  let expectedSummary;
  try {
    expectedManifest = stepO.buildEvidenceManifest(p.executorInput, oContext);
    expectedSummary = stepO.buildSummary(p.executorInput, oContext, expectedManifest);
  } catch {}
  if (!expectedManifest || !canonicalEqual(expectedManifest, upstream.stepOEvidenceManifest)) {
    issues.push("step_o_evidence_manifest_binding_mismatch");
  }
  if (!expectedSummary || !canonicalEqual(
    expectedSummary, upstream.stepOExecutorPreflightSummary,
  )) issues.push("step_o_summary_binding_mismatch");
  const result = uniqueSorted(issues);
  if (upstreamValidationCache.size >= 64) upstreamValidationCache.clear();
  upstreamValidationCache.set(cacheKey, result);
  return [...result];
}

function buildClaimStoreInterface(upstream, overrides = {}) {
  const { oContext } = getMaterial(upstream);
  const policy = oContext.consumptionPolicy;
  return sealDescriptor({
    contractVersion: VERSIONS.claimStore,
    claimStoreInterfaceVersion: CLAIM_STORE_INTERFACE_VERSION,
    transportNeutral: true,
    atomicClaimPrimitive: stepO.CLAIM_ATOMICITY,
    claimKeyDerivationDomain: stepO.CLAIM_KEY_DERIVATION_DOMAIN,
    claimKeyInputFields: [...stepO.CLAIM_KEY_INPUT_FIELDS],
    claimKeyHash: policy.claimKeyHash,
    maximumSuccessfulAcquisitions: 1,
    deterministicOutcomes: [...CLAIM_OUTCOMES],
    duplicateInvocationRejected: true,
    replayedInvocationRejected: true,
    expiryEnforced: true,
    claimStoreNamespace: stepO.CLAIM_NAMESPACE,
    executionReceiptNamespace: stepO.EXECUTION_RECEIPT_NAMESPACE,
    namespacesDistinct: true,
    automaticRetryAllowed: false,
    ambiguousOutcomeRetryAllowed: false,
    durableStoreAccessed: false,
    syntheticInMemoryOnly: true,
    realDependencyBound: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "FINPLE_STEP114_2X_P_CLAIM_STORE_INTERFACE_HASH\0", "claimStoreInterfaceHash");
}

function buildAdapterInterface(upstream, overrides = {}) {
  const { oPacket, oContext } = getMaterial(upstream);
  return sealDescriptor({
    contractVersion: VERSIONS.adapter,
    adapterInterfaceVersion: stepO.ADAPTER_INTERFACE_VERSION,
    transportNeutral: true,
    destinationCount: 1,
    readOnly: true,
    observationSequence: [...stepO.ADAPTER_OBSERVATION_SEQUENCE],
    requiredObservationCategories: [...stepO.OBSERVATION_CATEGORIES],
    maximumInvocationCount: 1,
    deterministicOutcomes: [...ADAPTER_OUTCOMES],
    requiredHashOutputFields: [...oPacket.executorInput.requiredHashPlaceholders],
    requiredTimestampOutputFields: [...oPacket.executorInput.requiredTimestampPlaceholders],
    writesSupported: false,
    ddlSupported: false,
    dmlSupported: false,
    stateMutationSupported: false,
    migrationSupported: false,
    scenarioExecutionSupported: false,
    providerMutationSupported: false,
    productionAccessSupported: false,
    credentialEchoSupported: false,
    credentialPersistenceSupported: false,
    rawEndpointOutputSupported: false,
    rawCertificateOutputSupported: false,
    rawCredentialOutputSupported: false,
    automaticRetrySupported: false,
    ambiguousOutcomeRetrySupported: false,
    externalAdapterBound: false,
    syntheticInMemoryOnly: true,
    realDependencyBound: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "FINPLE_STEP114_2X_P_ADAPTER_INTERFACE_HASH\0", "adapterInterfaceHash");
}

function buildReceiptStoreInterface(upstream, overrides = {}) {
  const { oContext } = getMaterial(upstream);
  return sealDescriptor({
    contractVersion: VERSIONS.receiptStore,
    receiptStoreInterfaceVersion: RECEIPT_STORE_INTERFACE_VERSION,
    transportNeutral: true,
    executionReceiptNamespace: oContext.consumptionPolicy.executionReceiptNamespace,
    claimStoreNamespace: oContext.consumptionPolicy.claimStoreNamespace,
    namespacesDistinct: true,
    acceptsNonPersistentCandidateOnly: true,
    durablePersistenceAllowed: false,
    automaticRetryAllowed: false,
    storeAccessed: false,
    syntheticInMemoryOnly: true,
    realDependencyBound: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "FINPLE_STEP114_2X_P_RECEIPT_STORE_INTERFACE_HASH\0", "receiptStoreInterfaceHash");
}

function validateClaimStoreInterface(value, upstream) {
  const issues = validateDescriptorEnvelope(value, CLAIM_STORE_FIELDS,
    "FINPLE_STEP114_2X_P_CLAIM_STORE_INTERFACE_HASH\0",
    "claimStoreInterfaceHash", "claim_store_interface");
  let expected;
  try { expected = buildClaimStoreInterface(upstream); } catch {
    return uniqueSorted([...issues, "claim_store_interface_expected_construction_failed"]);
  }
  for (const field of CLAIM_STORE_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`claim_store_interface_field_invalid:${field}`);
    }
  }
  const invocation = getMaterial(upstream).nPacket.invocation;
  const policy = getMaterial(upstream).oContext.consumptionPolicy;
  const payload = Object.fromEntries(
    value?.claimKeyInputFields?.map((field) => [field, invocation[field]]) || [],
  );
  let derived;
  try { derived = hashWithDomain(value.claimKeyDerivationDomain, payload); } catch {}
  if (derived !== value?.claimKeyHash || derived !== policy.claimKeyHash) {
    issues.push("claim_store_interface_claim_key_recalculation_mismatch");
  }
  return uniqueSorted(issues);
}

function validateAdapterInterface(value, upstream) {
  const issues = validateDescriptorEnvelope(value, ADAPTER_FIELDS,
    "FINPLE_STEP114_2X_P_ADAPTER_INTERFACE_HASH\0", "adapterInterfaceHash",
    "adapter_interface");
  let expected;
  try { expected = buildAdapterInterface(upstream); } catch {
    return uniqueSorted([...issues, "adapter_interface_expected_construction_failed"]);
  }
  for (const field of ADAPTER_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`adapter_interface_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function validateReceiptStoreInterface(value, upstream) {
  const issues = validateDescriptorEnvelope(value, RECEIPT_STORE_FIELDS,
    "FINPLE_STEP114_2X_P_RECEIPT_STORE_INTERFACE_HASH\0",
    "receiptStoreInterfaceHash", "receipt_store_interface");
  let expected;
  try { expected = buildReceiptStoreInterface(upstream); } catch {
    return uniqueSorted([...issues, "receipt_store_interface_expected_construction_failed"]);
  }
  for (const field of RECEIPT_STORE_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`receipt_store_interface_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildDependencyBundle(upstream, claimStoreInterface, adapterInterface,
  receiptStoreInterface, evaluationClockInstant) {
  return sealContract({
    contractVersion: VERSIONS.dependencies,
    ...buildBindings(upstream),
    claimStoreInterfaceHash: claimStoreInterface.claimStoreInterfaceHash,
    adapterInterfaceHash: adapterInterface.adapterInterfaceHash,
    receiptStoreInterfaceHash: receiptStoreInterface.receiptStoreInterfaceHash,
    evaluationClockInstant,
    syntheticValidationOnly: true,
    realDependencyBound: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
  }, "dependencies");
}

function validateDependencyBundle(value, context, evaluationClockInstant) {
  const issues = [...validateEnvelope(value, "dependencies")];
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "claimStoreInterface", "adapterInterface", "receiptStoreInterface",
  ])) return uniqueSorted([...issues, "execution_dependency_context_fields_invalid"]);
  issues.push(...validateClaimStoreInterface(context.claimStoreInterface, context.upstream));
  issues.push(...validateAdapterInterface(context.adapterInterface, context.upstream));
  issues.push(...validateReceiptStoreInterface(context.receiptStoreInterface, context.upstream));
  let expected;
  try {
    expected = buildDependencyBundle(context.upstream, context.claimStoreInterface,
      context.adapterInterface, context.receiptStoreInterface, evaluationClockInstant);
  } catch {
    return uniqueSorted([...issues, "execution_dependency_bundle_expected_construction_failed"]);
  }
  for (const field of DEPENDENCY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`execution_dependency_bundle_field_invalid:${field}`);
    }
  }
  if (parseInstant(evaluationClockInstant) === null) {
    issues.push("execution_dependency_evaluation_clock_invalid");
  }
  if (issues.length === 0) {
    issues.push(...validateUpstream(context.upstream));
  }
  return uniqueSorted(issues);
}

function buildExecutionPlan(upstream, dependencyBundle,
  claimOutcome = "acquired", adapterOutcome = "completed") {
  const { oPacket } = getMaterial(upstream);
  const trace = [...EXECUTION_STATE_SEQUENCE];
  return sealContract({
    contractVersion: VERSIONS.plan,
    ...buildBindings(upstream),
    executionDependencyBundleId: dependencyBundle.executionDependencyBundleId,
    executionDependencyBundleHash: dependencyBundle.executionDependencyBundleHash,
    claimKeyHash: oPacket.executorInput.claimKeyHash,
    claimNonceHash: oPacket.executorInput.claimNonceHash,
    claimExpiresAt: oPacket.executorInput.claimExpiresAt,
    claimOutcome,
    adapterOutcome,
    executionStateSequence: trace,
    maximumAdapterInvocationCount: 1,
    syntheticAdapterInvocationCount: 1,
    automaticRetryAllowed: false,
    stateMachineTraceHash: hashWithDomain(TRACE_HASH_DOMAIN, trace),
    syntheticValidationOnly: true,
    realExecutionPlanned: false,
    rawMaterialPresent: false,
  }, "plan");
}

function validateExecutionPlan(value, upstream, dependencyBundle) {
  const issues = [...validateEnvelope(value, "plan")];
  let expected;
  try { expected = buildExecutionPlan(upstream, dependencyBundle); } catch {
    return uniqueSorted([...issues, "execution_plan_expected_construction_failed"]);
  }
  for (const field of PLAN_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`execution_plan_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildSyntheticAdapterOutput(upstream, completedAt, overrides = {}) {
  const { oPacket } = getMaterial(upstream);
  return {
    observationSequence: [...stepO.ADAPTER_OBSERVATION_SEQUENCE],
    observationCategories: [...stepO.OBSERVATION_CATEGORIES],
    hashOutputs: Object.fromEntries(
      oPacket.executorInput.requiredHashPlaceholders.map((field) => [field, "a".repeat(64)]),
    ),
    timestampOutputs: Object.fromEntries(
      oPacket.executorInput.requiredTimestampPlaceholders.map((field) => [field, completedAt]),
    ),
    destinationCount: 1,
    observationCount: 1,
    completedAt,
    sanitizedOnly: true,
    rawMaterialPresent: false,
    ...overrides,
  };
}

function validateAdapterOutput(value, upstream, evaluationClockInstant) {
  if (!isRecord(value) || !hasExactKeys(value, ADAPTER_OUTPUT_FIELDS)) {
    return ["adapter_output_fields_invalid"];
  }
  const issues = [];
  const { oPacket } = getMaterial(upstream);
  const expectedHashFields = oPacket.executorInput.requiredHashPlaceholders;
  const expectedTimestampFields = oPacket.executorInput.requiredTimestampPlaceholders;
  if (!canonicalEqual(value.observationSequence, stepO.ADAPTER_OBSERVATION_SEQUENCE) ||
      !canonicalEqual(value.observationCategories, stepO.OBSERVATION_CATEGORIES)) {
    issues.push("adapter_output_order_invalid");
  }
  if (!isRecord(value.hashOutputs) ||
      !hasExactKeys(value.hashOutputs, expectedHashFields) ||
      Object.values(value.hashOutputs).some((item) => !isSha256(item))) {
    issues.push("adapter_output_hashes_invalid");
  }
  if (!isRecord(value.timestampOutputs) ||
      !hasExactKeys(value.timestampOutputs, expectedTimestampFields) ||
      Object.values(value.timestampOutputs).some((item) => parseInstant(item) === null)) {
    issues.push("adapter_output_timestamps_invalid");
  }
  if (value.destinationCount !== 1 || value.observationCount !== 1 ||
      value.sanitizedOnly !== true || value.rawMaterialPresent !== false) {
    issues.push("adapter_output_sanitization_invalid");
  }
  const completed = parseInstant(value.completedAt);
  const starts = parseInstant(oPacket.executorInput.observationWindowStartsAt);
  const expires = parseInstant(oPacket.executorInput.observationWindowExpiresAt);
  const now = parseInstant(evaluationClockInstant);
  if ([completed, starts, expires, now].some((item) => item === null) ||
      completed < starts || completed > now || completed >= expires) {
    issues.push("adapter_output_chronology_invalid");
  }
  return uniqueSorted(issues);
}

function buildReceiptCandidate(upstream, dependencyBundle, executionPlan,
  adapterInterface, adapterOutput) {
  const { oPacket, oContext } = getMaterial(upstream);
  return sealContract({
    contractVersion: VERSIONS.receipt,
    ...buildBindings(upstream),
    executionDependencyBundleId: dependencyBundle.executionDependencyBundleId,
    executionDependencyBundleHash: dependencyBundle.executionDependencyBundleHash,
    executionPlanId: executionPlan.executionPlanId,
    executionPlanHash: executionPlan.executionPlanHash,
    claimKeyHash: oPacket.executorInput.claimKeyHash,
    claimNonceHash: oPacket.executorInput.claimNonceHash,
    claimOutcome: "acquired",
    adapterInterfaceHash: adapterInterface.adapterInterfaceHash,
    adapterCapabilityPolicyId: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    adapterCapabilityPolicyHash: oContext.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    observationSequence: [...adapterOutput.observationSequence],
    observationCategories: [...adapterOutput.observationCategories],
    sanitizedHashOutputs: { ...adapterOutput.hashOutputs },
    canonicalTimestampOutputs: { ...adapterOutput.timestampOutputs },
    destinationCount: 1,
    observationCount: 1,
    stateMachineTraceHash: executionPlan.stateMachineTraceHash,
    observationWindowStartsAt: oPacket.executorInput.observationWindowStartsAt,
    observationWindowExpiresAt: oPacket.executorInput.observationWindowExpiresAt,
    completedAt: adapterOutput.completedAt,
    separateFinalizationRequired: true,
    separateDisposalRequired: true,
    syntheticValidationOnly: true,
    nonPersistent: true,
    realClaimPersisted: false,
    realInvocationConsumed: false,
    realAdapterInvoked: false,
    realObservationCompleted: false,
    executionReceiptPersisted: false,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "receipt");
}

function validateReceiptCandidate(value, upstream, dependencyBundle, executionPlan,
  adapterInterface, adapterOutput) {
  const issues = [...validateEnvelope(value, "receipt")];
  let expected;
  try {
    expected = buildReceiptCandidate(upstream, dependencyBundle, executionPlan,
      adapterInterface, adapterOutput);
  } catch {
    return uniqueSorted([...issues, "execution_receipt_expected_construction_failed"]);
  }
  for (const field of RECEIPT_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`execution_receipt_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildSummary(upstream, dependencyBundle, executionPlan, receiptCandidate) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    ...buildBindings(upstream),
    executionDependencyBundleId: dependencyBundle.executionDependencyBundleId,
    executionDependencyBundleHash: dependencyBundle.executionDependencyBundleHash,
    executionPlanId: executionPlan.executionPlanId,
    executionPlanHash: executionPlan.executionPlanHash,
    executionReceiptCandidateId: receiptCandidate.executionReceiptCandidateId,
    executionReceiptCandidateHash: receiptCandidate.executionReceiptCandidateHash,
    publicState: "live_observation_executor_shell_validated",
    stepOPackageValidated: true,
    executionDependenciesValidated: true,
    claimStoreInterfaceValidated: true,
    adapterInterfaceValidated: true,
    receiptStoreInterfaceValidated: true,
    singleUseStateMachineValidated: true,
    sanitizedReceiptCandidatePrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateSummary(value, upstream, dependencyBundle, executionPlan,
  receiptCandidate) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(upstream, dependencyBundle, executionPlan, receiptCandidate); }
  catch { return uniqueSorted([...issues, "executor_shell_summary_expected_construction_failed"]); }
  for (const field of SUMMARY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`executor_shell_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, receipt = {}, issues = [], trace = [],
  adapterInvocationCount = 0) {
  const validated = status === "live_observation_executor_shell_validated";
  return {
    ok: validated,
    status,
    contractVersion: VERSIONS.summary,
    executorShellValidated: validated,
    executionDependenciesValidated: validated,
    singleUseStateMachineValidated: validated,
    sanitizedReceiptCandidatePrepared: validated,
    executorShellSummary: validated ? summary : {},
    executionReceiptCandidate: validated ? receipt : {},
    executionStateTrace: [...trace],
    syntheticAdapterInvocationCount: adapterInvocationCount,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: validated ? [
      "synthetic_shell_validation_does_not_claim_consume_invoke_observe_connect_persist_dispose_or_deploy",
    ] : [],
  };
}

function evaluateLiveObservationExecutorShell(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_external_live_observation_execution_dependencies");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "context", "dependencyBundle", "claimOutcome", "adapterOutcome",
    "adapterOutput", "executionPlan", "evaluationClockInstant",
  ])) return safeResult("blocked", {}, {}, ["executor_shell_packet_fields_invalid"]);
  const initialTrace = ["preflight_revalidated", "claim_acquisition_requested"];
  try {
    const issues = validateDependencyBundle(
      packet.dependencyBundle, packet.context, packet.evaluationClockInstant,
    );
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    if (!CLAIM_OUTCOMES.includes(packet.claimOutcome)) {
      return safeResult("blocked", {}, {}, ["claim_store_outcome_invalid"], initialTrace);
    }
    if (packet.claimOutcome !== "acquired") {
      return safeResult("blocked", {}, {},
        [`claim_store_outcome_blocks_adapter:${packet.claimOutcome}`], initialTrace);
    }
    const adapterRequestedTrace = [...initialTrace, "claim_acquired",
      "adapter_invocation_requested"];
    if (!ADAPTER_OUTCOMES.includes(packet.adapterOutcome)) {
      return safeResult("blocked", {}, {}, ["adapter_outcome_invalid"],
        adapterRequestedTrace, 0);
    }
    if (packet.adapterOutcome !== "completed") {
      return safeResult("blocked", {}, {},
        [`adapter_outcome_blocks_receipt:${packet.adapterOutcome}`],
        adapterRequestedTrace, 1);
    }
    issues.push(...validateExecutionPlan(
      packet.executionPlan, packet.context.upstream, packet.dependencyBundle,
    ));
    issues.push(...validateAdapterOutput(
      packet.adapterOutput, packet.context.upstream, packet.evaluationClockInstant,
    ));
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues,
      adapterRequestedTrace, 1);
    const receipt = buildReceiptCandidate(
      packet.context.upstream, packet.dependencyBundle, packet.executionPlan,
      packet.context.adapterInterface, packet.adapterOutput,
    );
    issues.push(...validateReceiptCandidate(
      receipt, packet.context.upstream, packet.dependencyBundle, packet.executionPlan,
      packet.context.adapterInterface, packet.adapterOutput,
    ));
    const summary = buildSummary(
      packet.context.upstream, packet.dependencyBundle, packet.executionPlan, receipt,
    );
    issues.push(...validateSummary(
      summary, packet.context.upstream, packet.dependencyBundle, packet.executionPlan,
      receipt,
    ));
    canonicalJson(receipt);
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues,
      adapterRequestedTrace, 1) : safeResult(
        "live_observation_executor_shell_validated", summary, receipt, [],
        EXECUTION_STATE_SEQUENCE, 1,
      );
  } catch {
    return safeResult("blocked", {}, {}, ["live_observation_executor_shell_validation_failed"]);
  }
}

module.exports = {
  ADAPTER_OUTCOMES,
  CLAIM_OUTCOMES,
  CLAIM_STORE_INTERFACE_VERSION,
  EXECUTION_STATE_SEQUENCE,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  PUBLIC_STATES,
  RECEIPT_STORE_INTERFACE_VERSION,
  REQUIRED_FALSE_FIELDS,
  SPECS,
  STEP_O_BINDING_FIELDS,
  TRACE_HASH_DOMAIN,
  VERSIONS,
  buildAdapterInterface,
  buildBindings,
  buildClaimStoreInterface,
  buildDependencyBundle,
  buildExecutionPlan,
  buildReceiptCandidate,
  buildReceiptStoreInterface,
  buildSummary,
  buildSyntheticAdapterOutput,
  buildUpstream,
  evaluateLiveObservationExecutorShell,
  safeResult,
  sealContract,
  validateAdapterInterface,
  validateAdapterOutput,
  validateClaimStoreInterface,
  validateDependencyBundle,
  validateExecutionPlan,
  validateReceiptCandidate,
  validateReceiptStoreInterface,
  validateSummary,
  validateUpstream,
};
