"use strict";

const { createHash } = require("node:crypto");

const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./metrics-cutover-live-observation-invocation.cjs");
const stepO = require("./metrics-cutover-live-observation-executor-preflight.cjs");
const stepP = require("./metrics-cutover-live-observation-executor-shell.cjs");
const stepQ = require("./metrics-cutover-live-observation-operator-run-package.cjs");

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_live_observation_runtime_handoff_inputs",
  "live_observation_runtime_handoff_prepared",
  "blocked",
]);
const VERSIONS = Object.freeze({
  input: "metrics-cutover-live-observation-runtime-handoff-input-v1-step114-2x-r",
  loader: "metrics-cutover-live-observation-adapter-loader-policy-v1-step114-2x-r",
  dependency: "metrics-cutover-live-observation-runtime-dependency-policy-v1-step114-2x-r",
  precondition: "metrics-cutover-live-observation-runtime-precondition-manifest-v1-step114-2x-r",
  handoff: "metrics-cutover-live-observation-one-run-execution-handoff-v1-step114-2x-r",
  summary: "metrics-cutover-live-observation-runtime-handoff-summary-v1-step114-2x-r",
});
const HANDOFF_SEQUENCE = Object.freeze([
  "step_q_package_revalidated",
  "runtime_handoff_input_validated",
  "adapter_loader_policy_validated",
  "runtime_dependency_policy_validated",
  "artifact_identity_attestation_prepared",
  "single_use_claim_binding_prepared",
  "read_only_transport_binding_prepared",
  "receipt_persistence_binding_prepared",
  "evidence_finalization_binding_prepared",
  "environment_disposal_binding_prepared",
  "one_run_runtime_handoff_prepared",
]);
const EVIDENCE_NAMESPACE = "metrics_live_observation_evidence_finalization_v1";
const DISPOSAL_NAMESPACE = "metrics_live_observation_environment_disposal_v1";
const REQUIRED_FALSE_FIELDS = Object.freeze([
  "liveObservationRuntimeHandoffRecorded",
  "liveObservationRuntimeDependenciesBound",
  "liveObservationAdapterArtifactBytesRead",
  "liveObservationAdapterArtifactDigestVerified",
  "liveObservationAdapterLoaderInvoked",
  "liveObservationAdapterArtifactLoaded",
  "liveObservationClaimAcquisitionRequested",
  "liveObservationClaimCreated",
  "liveObservationClaimPersisted",
  "liveObservationOperatorAuthorizationConsumed",
  "liveObservationInvocationConsumed",
  "liveObservationAdapterInvoked",
  "liveObservationEvidenceCollected",
  "liveObservationExecutionReceiptPersisted",
  "liveObservationEnvironmentDisposalRequested",
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
  ...stepQ.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const SPECS = Object.freeze({
  input: Object.freeze({ version: VERSIONS.input,
    idField: "runtimeHandoffInputId", hashField: "runtimeHandoffInputHash",
    prefix: "metrics-cutover-live-observation-runtime-handoff-input",
    idDomain: "FINPLE_STEP114_2X_R_RUNTIME_HANDOFF_INPUT_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_RUNTIME_HANDOFF_INPUT_HASH\0" }),
  loader: Object.freeze({ version: VERSIONS.loader,
    idField: "adapterLoaderPolicyId", hashField: "adapterLoaderPolicyHash",
    prefix: "metrics-cutover-live-observation-adapter-loader-policy",
    idDomain: "FINPLE_STEP114_2X_R_ADAPTER_LOADER_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_ADAPTER_LOADER_POLICY_HASH\0" }),
  dependency: Object.freeze({ version: VERSIONS.dependency,
    idField: "runtimeDependencyPolicyId", hashField: "runtimeDependencyPolicyHash",
    prefix: "metrics-cutover-live-observation-runtime-dependency-policy",
    idDomain: "FINPLE_STEP114_2X_R_RUNTIME_DEPENDENCY_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_RUNTIME_DEPENDENCY_POLICY_HASH\0" }),
  precondition: Object.freeze({ version: VERSIONS.precondition,
    idField: "runtimePreconditionManifestId", hashField: "runtimePreconditionManifestHash",
    prefix: "metrics-cutover-live-observation-runtime-precondition-manifest",
    idDomain: "FINPLE_STEP114_2X_R_RUNTIME_PRECONDITION_MANIFEST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_RUNTIME_PRECONDITION_MANIFEST_HASH\0" }),
  handoff: Object.freeze({ version: VERSIONS.handoff,
    idField: "oneRunExecutionHandoffId", hashField: "oneRunExecutionHandoffHash",
    prefix: "metrics-cutover-live-observation-one-run-execution-handoff",
    idDomain: "FINPLE_STEP114_2X_R_ONE_RUN_EXECUTION_HANDOFF_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_ONE_RUN_EXECUTION_HANDOFF_HASH\0" }),
  summary: Object.freeze({ version: VERSIONS.summary,
    idField: "runtimeHandoffSummaryId", hashField: "runtimeHandoffSummaryHash",
    prefix: "metrics-cutover-live-observation-runtime-handoff-summary",
    idDomain: "FINPLE_STEP114_2X_R_RUNTIME_HANDOFF_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_R_RUNTIME_HANDOFF_SUMMARY_HASH\0" }),
});

const UPSTREAM_BINDING_FIELDS = Object.freeze([
  "stepQOperatorRunSummaryId", "stepQOperatorRunSummaryHash",
  "stepQOneRunAdapterBindingId", "stepQOneRunAdapterBindingHash",
  "stepQOperatorAuthorizationId", "stepQOperatorAuthorizationHash",
  "stepQOperatorAuthorizationSignatureDigest", "stepQOperatorAllowlistId",
  "stepQOperatorAllowlistHash", "stepQVerificationPolicyId",
  "stepQVerificationPolicyHash", "stepQAdapterArtifactManifestId",
  "stepQAdapterArtifactManifestHash", "adapterArtifactId",
  "adapterArtifactSha256", "adapterSourceTreeSha256",
  "adapterCapabilityManifestSha256", "operatorKeyId", "operatorIdentityHash",
  "operatorScope", "operatorRole", "operatorOperationOrder",
  "maximumClaimAcquisitionCount", "maximumAdapterInvocationCount",
  "destinationCount", "observationCount", "observationWindowStartsAt",
  "observationWindowExpiresAt", "operatorAuthorizationExpiresAt",
  "requestNonceHash", "intakeNonceHash", "approvalResponseNonceHash",
  "invocationNonceHash", "claimNonceHash", "operatorAuthorizationNonceHash",
  "claimKeyHash", "stepPExecutorShellSummaryId", "stepPExecutorShellSummaryHash",
  "stepPExecutionReceiptCandidateId", "stepPExecutionReceiptCandidateHash",
  "stepPExecutionDependencyBundleId", "stepPExecutionDependencyBundleHash",
  "stepPExecutionPlanId", "stepPExecutionPlanHash", "stepPClaimStoreInterfaceHash",
  "stepPAdapterInterfaceHash", "stepPReceiptStoreInterfaceHash",
  "stepPStateMachineSequence", "stepPStateMachineTraceHash",
  "stepOExecutorInputId", "stepOExecutorInputHash", "stepOExecutorInputExpiresAt",
  "stepOClaimExpiresAt", "stepOSingleUseConsumptionPolicyId",
  "stepOSingleUseConsumptionPolicyHash", "stepOAdapterCapabilityPolicyId",
  "stepOAdapterCapabilityPolicyHash", "stepOEvidenceManifestId",
  "stepOEvidenceManifestHash", "stepNInvocationId", "stepNInvocationHash",
  "stepNInvocationExpiresAt", "stepNInvocationReceiptCandidateId",
  "stepNInvocationReceiptCandidateHash", "stepNInvokerAllowlistId",
  "stepNInvokerAllowlistHash", "stepNVerificationPolicyId",
  "stepNVerificationPolicyHash", "stepNVerificationSummaryId",
  "stepNVerificationSummaryHash", "stepMApprovalResponseId",
  "stepMApprovalResponseHash", "stepMObservationAuthorityPackageId",
  "stepMObservationAuthorityPackageHash", "stepMApproverAllowlistId",
  "stepMApproverAllowlistHash", "stepMVerificationPolicyId",
  "stepMVerificationPolicyHash", "stepMVerificationSummaryId",
  "stepMVerificationSummaryHash", "stepLApprovalRequestPreparationSummaryId",
  "stepLApprovalRequestPreparationSummaryHash", "inheritedBindingHash",
]);

const LOADER_DESCRIPTOR_FIELDS = Object.freeze([
  "descriptorVersion", "loaderClass", "immutableArtifactRequired",
  "digestVerificationBeforeLoadRequired", "maximumArtifactCount",
  "maximumLoadAttemptCount", "fallbackArtifactAllowed",
  "versionSubstitutionAllowed", "hashSubstitutionAllowed",
  "dynamicDiscoveryAllowed", "automaticRetryAllowed",
  "ambiguousOutcomeRetryAllowed", "operatorReviewRequiredOnUncertainty",
]);
const CLAIM_DESCRIPTOR_FIELDS = Object.freeze([
  "descriptorVersion", "atomicClaimPrimitive", "claimStoreNamespace",
  "claimExpiresAt", "maximumSuccessfulAcquisitions", "duplicateRejected",
  "replayRejected", "automaticRetryAllowed", "ambiguousOutcomeRetryAllowed",
  "failedOutcomeRetryAllowed", "runtimeBound", "storeAccessed",
  "claimRequested", "claimPersisted",
]);
const TRANSPORT_DESCRIPTOR_FIELDS = Object.freeze([
  "descriptorVersion", "transportClass", "destinationCount", "observationCount",
  "operationOrder", "observationCategoryOrder", "requiredHashOutputFields",
  "requiredTimestampOutputFields", "readOnly", "writesAllowed", "ddlAllowed",
  "dmlAllowed", "mutationAllowed", "migrationAllowed", "scenarioAllowed",
  "productionAccessAllowed", "providerMutationAllowed", "credentialEchoAllowed",
  "credentialPersistenceAllowed", "rawOutputAllowed", "automaticRetryAllowed",
  "ambiguousOutcomeRetryAllowed", "externalTransportBound", "connectionOpened",
  "adapterInvoked",
]);
const LATER_STAGE_DESCRIPTOR_FIELDS = Object.freeze([
  "descriptorVersion", "namespace", "laterStageAuthorizationRequired",
  "runtimeBound", "coordinatorAccessed", "executed",
]);

const INPUT_FIELDS = Object.freeze([
  "contractVersion", "runtimeHandoffInputId", ...UPSTREAM_BINDING_FIELDS,
  "adapterLoaderPolicyDescriptor", "atomicClaimStoreRuntimeBinding",
  "readOnlyAdapterTransportBinding", "executionReceiptStoreBinding",
  "evidenceFinalizationBinding", "environmentDisposalBinding",
  "evaluationClockInstant", "runtimeHandoffNonceHash",
  "priorRuntimeHandoffNonceHashes", "syntheticValidationOnly", "nonExecuting",
  "realRuntimeDependencyBound", "adapterArtifactBytesRead",
  "adapterArtifactDigestVerified", "adapterRuntimeLoaded",
  "operatorAuthorizationConsumed", "invocationConsumed", "claimRequested",
  "claimPersisted", "adapterInvoked", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "manualReviewRequired",
  "runtimeHandoffInputHash",
]);
const LOADER_FIELDS = Object.freeze([
  "contractVersion", "adapterLoaderPolicyId", ...UPSTREAM_BINDING_FIELDS,
  "runtimeHandoffInputId", "runtimeHandoffInputHash", "adapterInterfaceVersion",
  ...LOADER_DESCRIPTOR_FIELDS.filter((field) => field !== "descriptorVersion"),
  "artifactBytesRead", "artifactDigestVerified", "moduleResolved",
  "adapterRuntimeLoaded", "loaderInvoked", "syntheticValidationOnly",
  "rawMaterialPresent", "adapterLoaderPolicyHash",
]);
const DEPENDENCY_FIELDS = Object.freeze([
  "contractVersion", "runtimeDependencyPolicyId", ...UPSTREAM_BINDING_FIELDS,
  "runtimeHandoffInputId", "runtimeHandoffInputHash", "claimStoreBinding",
  "readOnlyTransportBinding", "executionReceiptBinding",
  "evidenceFinalizationBinding", "environmentDisposalBinding",
  "namespacesPairwiseDistinct", "syntheticValidationOnly", "nonExecuting",
  "realRuntimeDependencyBound", "rawMaterialPresent", "runtimeDependencyPolicyHash",
]);
const PRECONDITION_FIELDS = Object.freeze([
  "contractVersion", "runtimePreconditionManifestId", ...UPSTREAM_BINDING_FIELDS,
  "runtimeHandoffInputId", "runtimeHandoffInputHash", "adapterLoaderPolicyId",
  "adapterLoaderPolicyHash", "runtimeDependencyPolicyId",
  "runtimeDependencyPolicyHash", "runtimeHandoffNonceHash",
  "priorRuntimeHandoffNonceHashes", "evaluationClockInstant", "earliestExpiry",
  "operationOrder", "observationCategoryOrder", "executionStateSequence",
  "maximumArtifactCount", "maximumAdapterLoadAttemptCount",
  "artifactDigestVerificationRequiredLater", "claimAcquisitionRequiredLater",
  "adapterLoadingRequiredLater", "observationRequiredLater",
  "receiptPersistenceRequiredLater", "evidenceFinalizationRequiredLater",
  "environmentDisposalRequiredLater", "syntheticValidationOnly", "nonExecuting",
  "rawMaterialPresent", "runtimePreconditionManifestHash",
]);
const HANDOFF_FIELDS = Object.freeze([
  "contractVersion", "oneRunExecutionHandoffId", ...UPSTREAM_BINDING_FIELDS,
  "runtimeHandoffInputId", "runtimeHandoffInputHash", "adapterLoaderPolicyId",
  "adapterLoaderPolicyHash", "runtimeDependencyPolicyId",
  "runtimeDependencyPolicyHash", "runtimePreconditionManifestId",
  "runtimePreconditionManifestHash", "handoffSequence", "evaluationClockInstant",
  "runtimeHandoffNonceHash", "automaticRetryAllowed", "artifactBytesInspected",
  "artifactDigestVerified", "loaderInvoked", "storeInvoked", "transportInvoked",
  "adapterInvoked", "evidenceSinkInvoked", "receiptSinkInvoked",
  "disposalCoordinatorInvoked", "syntheticValidationOnly", "nonExecuting",
  "rawMaterialPresent", ...FIXED_FALSE_FIELDS, "oneRunExecutionHandoffHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "runtimeHandoffSummaryId", ...UPSTREAM_BINDING_FIELDS,
  "runtimeHandoffInputId", "runtimeHandoffInputHash", "adapterLoaderPolicyId",
  "adapterLoaderPolicyHash", "runtimeDependencyPolicyId",
  "runtimeDependencyPolicyHash", "runtimePreconditionManifestId",
  "runtimePreconditionManifestHash", "oneRunExecutionHandoffId",
  "oneRunExecutionHandoffHash", "publicState", "stepQPackageValidated",
  "directUpstreamValidatorsPassed", "runtimeHandoffInputValidated",
  "runtimeHandoffNonceReplayAndChronologyValidated",
  "adapterLoaderPolicyValidated", "runtimeDependencyPolicyValidated",
  "runtimePreconditionManifestPrepared", "handoffSequenceValidated",
  "nonExecutingOneRunHandoffPrepared", "syntheticValidationOnly",
  "rawMaterialPresent", ...FIXED_FALSE_FIELDS, "runtimeHandoffSummaryHash",
]);
const FIELD_SETS = Object.freeze({ input: INPUT_FIELDS, loader: LOADER_FIELDS,
  dependency: DEPENDENCY_FIELDS, precondition: PRECONDITION_FIELDS,
  handoff: HANDOFF_FIELDS, summary: SUMMARY_FIELDS });

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys(value, fields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, canonicalize(value[key])]));
  if ([null, true, false].includes(value) || typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value))) return value;
  throw new TypeError("non_canonical_value");
}
function canonicalJson(value) { return JSON.stringify(canonicalize(value)); }
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function hashWithDomain(domain, value) {
  return createHash("sha256").update(Buffer.from(domain, "utf8"))
    .update(Buffer.from(canonicalJson(value), "utf8")).digest("hex");
}
function isSha256(value) { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function parseInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function without(value, fields) {
  const denied = new Set(Array.isArray(fields) ? fields : [fields]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !denied.has(key)));
}
function sealContract(body, name) {
  const spec = SPECS[name];
  const withId = { ...body, [spec.idField]: `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}` };
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}
function validateEnvelope(value, name) {
  const spec = SPECS[name]; const fields = FIELD_SETS[name]; const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, fields)) return [`${name}_fields_invalid`];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const body = without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const hashBody = { ...body, [spec.idField]: expectedId };
  if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, hashBody)) {
    issues.push(`${name}_hash_invalid`);
  }
  return issues;
}
function validateHashArray(value, label) {
  if (!Array.isArray(value)) return [`${label}_not_array`];
  if (value.some((item) => !isSha256(item))) return [`${label}_hash_invalid`];
  if (new Set(value).size !== value.length) return [`${label}_duplicate`];
  if (!canonicalEqual(value, [...value].sort())) return [`${label}_not_sorted`];
  return [];
}

function buildUpstream(stepQPacket, stepQOneRunAdapterBinding,
  stepQOperatorRunSummary) {
  return { stepQPacket, stepQOneRunAdapterBinding, stepQOperatorRunSummary };
}
function getMaterial(upstream) {
  const qPacket = upstream.stepQPacket;
  const qContext = qPacket.context;
  const qUpstream = qContext.upstream;
  const pPacket = qUpstream.stepPPacket;
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
  return { qPacket, qContext, qUpstream, pPacket, pContext, pUpstream,
    oPacket, oContext, oUpstream, nPacket, nContext, nUpstream,
    mPacket, mContext, lUpstream, lPacket };
}
function buildBindings(upstream) {
  const { qPacket, qContext, pPacket, pContext, pUpstream, oPacket, oContext,
    oUpstream, nPacket, nContext, nUpstream, mPacket, mContext, lUpstream } =
    getMaterial(upstream);
  const authorization = qPacket.operatorAuthorization;
  const manifest = qPacket.adapterArtifactManifest;
  const qBinding = upstream.stepQOneRunAdapterBinding;
  const qSummary = upstream.stepQOperatorRunSummary;
  const pReceipt = qContext.upstream.stepPExecutionReceiptCandidate;
  const pSummary = qContext.upstream.stepPExecutorShellSummary;
  const oManifest = pUpstream.stepOEvidenceManifest;
  const nReceipt = oUpstream.stepNInvocationReceiptCandidate;
  const nSummary = oUpstream.stepNInvocationVerificationSummary;
  const mAuthority = nUpstream.stepMObservationAuthorityPackage;
  const mSummary = nUpstream.stepMApprovalVerificationSummary;
  const inheritedBindingHash = hashWithDomain(
    "FINPLE_STEP114_2X_R_INHERITED_PROVISIONING_EXECUTION_SCENARIO_BINDING\0",
    without(oPacket.executorInput, ["executorInputId", "executorInputHash"]),
  );
  return {
    stepQOperatorRunSummaryId: qSummary.operatorRunSummaryId,
    stepQOperatorRunSummaryHash: qSummary.operatorRunSummaryHash,
    stepQOneRunAdapterBindingId: qBinding.oneRunAdapterBindingId,
    stepQOneRunAdapterBindingHash: qBinding.oneRunAdapterBindingHash,
    stepQOperatorAuthorizationId: authorization.operatorAuthorizationId,
    stepQOperatorAuthorizationHash: authorization.operatorAuthorizationHash,
    stepQOperatorAuthorizationSignatureDigest:
      qBinding.operatorAuthorizationSignatureDigest,
    stepQOperatorAllowlistId: qContext.operatorAllowlist.operatorAllowlistId,
    stepQOperatorAllowlistHash: qContext.operatorAllowlist.operatorAllowlistHash,
    stepQVerificationPolicyId:
      qContext.verificationPolicy.operatorVerificationPolicyId,
    stepQVerificationPolicyHash:
      qContext.verificationPolicy.operatorVerificationPolicyHash,
    stepQAdapterArtifactManifestId: manifest.adapterArtifactManifestId,
    stepQAdapterArtifactManifestHash: manifest.adapterArtifactManifestHash,
    adapterArtifactId: manifest.adapterArtifactId,
    adapterArtifactSha256: manifest.adapterArtifactSha256,
    adapterSourceTreeSha256: manifest.adapterSourceTreeSha256,
    adapterCapabilityManifestSha256: manifest.adapterCapabilityManifestSha256,
    operatorKeyId: authorization.operatorKeyId,
    operatorIdentityHash: authorization.operatorIdentityHash,
    operatorScope: authorization.operatorScope,
    operatorRole: authorization.operatorRole,
    operatorOperationOrder: [...authorization.orderedOperations],
    maximumClaimAcquisitionCount: authorization.maximumClaimAcquisitionCount,
    maximumAdapterInvocationCount: authorization.maximumAdapterInvocationCount,
    destinationCount: authorization.destinationCount,
    observationCount: authorization.observationCount,
    observationWindowStartsAt: authorization.observationWindowStartsAt,
    observationWindowExpiresAt: authorization.observationWindowExpiresAt,
    operatorAuthorizationExpiresAt: authorization.expiresAt,
    requestNonceHash: authorization.requestNonceHash,
    intakeNonceHash: authorization.intakeNonceHash,
    approvalResponseNonceHash: authorization.approvalResponseNonceHash,
    invocationNonceHash: authorization.invocationNonceHash,
    claimNonceHash: authorization.claimNonceHash,
    operatorAuthorizationNonceHash: authorization.operatorAuthorizationNonceHash,
    claimKeyHash: authorization.claimKeyHash,
    stepPExecutorShellSummaryId: pSummary.executorShellSummaryId,
    stepPExecutorShellSummaryHash: pSummary.executorShellSummaryHash,
    stepPExecutionReceiptCandidateId: pReceipt.executionReceiptCandidateId,
    stepPExecutionReceiptCandidateHash: pReceipt.executionReceiptCandidateHash,
    stepPExecutionDependencyBundleId:
      pPacket.dependencyBundle.executionDependencyBundleId,
    stepPExecutionDependencyBundleHash:
      pPacket.dependencyBundle.executionDependencyBundleHash,
    stepPExecutionPlanId: pPacket.executionPlan.executionPlanId,
    stepPExecutionPlanHash: pPacket.executionPlan.executionPlanHash,
    stepPClaimStoreInterfaceHash: pContext.claimStoreInterface.claimStoreInterfaceHash,
    stepPAdapterInterfaceHash: pContext.adapterInterface.adapterInterfaceHash,
    stepPReceiptStoreInterfaceHash: pContext.receiptStoreInterface.receiptStoreInterfaceHash,
    stepPStateMachineSequence: [...pPacket.executionPlan.executionStateSequence],
    stepPStateMachineTraceHash: pPacket.executionPlan.stateMachineTraceHash,
    stepOExecutorInputId: oPacket.executorInput.executorInputId,
    stepOExecutorInputHash: oPacket.executorInput.executorInputHash,
    stepOExecutorInputExpiresAt: oPacket.executorInput.expiresAt,
    stepOClaimExpiresAt: oPacket.executorInput.claimExpiresAt,
    stepOSingleUseConsumptionPolicyId:
      oContext.consumptionPolicy.singleUseConsumptionPolicyId,
    stepOSingleUseConsumptionPolicyHash:
      oContext.consumptionPolicy.singleUseConsumptionPolicyHash,
    stepOAdapterCapabilityPolicyId:
      oContext.adapterCapabilityPolicy.adapterCapabilityPolicyId,
    stepOAdapterCapabilityPolicyHash:
      oContext.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
    stepOEvidenceManifestId: oManifest.evidenceManifestId,
    stepOEvidenceManifestHash: oManifest.evidenceManifestHash,
    stepNInvocationId: nPacket.invocation.invocationId,
    stepNInvocationHash: nPacket.invocation.invocationHash,
    stepNInvocationExpiresAt: nPacket.invocation.expiresAt,
    stepNInvocationReceiptCandidateId: nReceipt.invocationReceiptCandidateId,
    stepNInvocationReceiptCandidateHash: nReceipt.invocationReceiptCandidateHash,
    stepNInvokerAllowlistId: nContext.invokerAllowlist.invokerAllowlistId,
    stepNInvokerAllowlistHash: nContext.invokerAllowlist.invokerAllowlistHash,
    stepNVerificationPolicyId:
      nContext.verificationPolicy.invocationVerificationPolicyId,
    stepNVerificationPolicyHash:
      nContext.verificationPolicy.invocationVerificationPolicyHash,
    stepNVerificationSummaryId: nSummary.invocationVerificationSummaryId,
    stepNVerificationSummaryHash: nSummary.invocationVerificationSummaryHash,
    stepMApprovalResponseId: mPacket.approvalResponse.approvalResponseId,
    stepMApprovalResponseHash: mPacket.approvalResponse.approvalResponseHash,
    stepMObservationAuthorityPackageId: mAuthority.observationAuthorityPackageId,
    stepMObservationAuthorityPackageHash: mAuthority.observationAuthorityPackageHash,
    stepMApproverAllowlistId: mContext.approverAllowlist.approverAllowlistId,
    stepMApproverAllowlistHash: mContext.approverAllowlist.approverAllowlistHash,
    stepMVerificationPolicyId: mContext.verificationPolicy.verificationPolicyId,
    stepMVerificationPolicyHash: mContext.verificationPolicy.verificationPolicyHash,
    stepMVerificationSummaryId: mSummary.approvalVerificationSummaryId,
    stepMVerificationSummaryHash: mSummary.approvalVerificationSummaryHash,
    stepLApprovalRequestPreparationSummaryId:
      lUpstream.stepLSummary.approvalRequestPreparationSummaryId,
    stepLApprovalRequestPreparationSummaryHash:
      lUpstream.stepLSummary.approvalRequestPreparationSummaryHash,
    inheritedBindingHash,
  };
}

const DIRECT_UPSTREAM_VALIDATION_CACHE_LIMIT = 64;
const directUpstreamValidationCache = new Map();

function validateDirectUpstreamChain(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "stepQPacket", "stepQOneRunAdapterBinding", "stepQOperatorRunSummary",
  ])) return ["step_q_upstream_fields_invalid"];
  const cacheKey = hashWithDomain(
    "FINPLE_STEP114_2X_R_DIRECT_UPSTREAM_VALIDATION_CACHE_KEY\0",
    upstream,
  );
  const cachedIssues = directUpstreamValidationCache.get(cacheKey);
  if (cachedIssues) return [...cachedIssues];
  let material;
  try { material = getMaterial(upstream); } catch {
    return ["step_q_nested_material_invalid"];
  }
  const { qPacket, qContext, qUpstream, pPacket, pContext, pUpstream,
    oPacket, oContext, oUpstream, nPacket, nContext, nUpstream,
    mPacket, mContext, lUpstream, lPacket } = material;
  if (!isRecord(qPacket) || !hasExactKeys(qPacket, [
    "context", "operatorAuthorization", "adapterArtifactManifest",
    "evaluationClockInstant",
  ])) return ["step_q_packet_fields_invalid"];
  const authorization = qPacket.operatorAuthorization;
  const manifest = qPacket.adapterArtifactManifest;
  const issues = [
    ...stepQ.validateUpstream(qUpstream),
    ...stepQ.validateAuthorizationContext(qContext),
    ...stepQ.validateAuthorizationShape(authorization),
    ...stepQ.normalizeOperatorAllowlist(qContext.operatorAllowlist, qUpstream).issues,
    ...stepQ.validateVerificationPolicy(qContext.verificationPolicy, qUpstream),
    ...stepQ.validateAdapterArtifactManifest(manifest, qUpstream),
    ...stepQ.validateSignedOperatorAuthorization(
      authorization, qContext, manifest, qPacket.evaluationClockInstant,
    ),
    ...stepQ.validateOneRunAdapterBinding(
      upstream.stepQOneRunAdapterBinding, authorization, qContext, manifest,
    ),
    ...stepQ.validateSummary(
      upstream.stepQOperatorRunSummary, authorization, qContext, manifest,
      upstream.stepQOneRunAdapterBinding,
    ),
    ...stepP.validateClaimStoreInterface(pContext.claimStoreInterface, pUpstream),
    ...stepP.validateAdapterInterface(pContext.adapterInterface, pUpstream),
    ...stepP.validateReceiptStoreInterface(pContext.receiptStoreInterface, pUpstream),
    ...stepP.validateDependencyBundle(
      pPacket.dependencyBundle, pContext, pPacket.evaluationClockInstant,
    ),
    ...stepP.validateExecutionPlan(
      pPacket.executionPlan, pUpstream, pPacket.dependencyBundle,
    ),
    ...stepP.validateAdapterOutput(
      pPacket.adapterOutput, pUpstream, pPacket.evaluationClockInstant,
    ),
    ...stepP.validateReceiptCandidate(
      qUpstream.stepPExecutionReceiptCandidate, pUpstream, pPacket.dependencyBundle,
      pPacket.executionPlan, pContext.adapterInterface, pPacket.adapterOutput,
    ),
    ...stepP.validateSummary(
      qUpstream.stepPExecutorShellSummary, pUpstream, pPacket.dependencyBundle,
      pPacket.executionPlan, qUpstream.stepPExecutionReceiptCandidate,
    ),
    ...stepO.validateConsumptionPolicy(oContext.consumptionPolicy, oUpstream),
    ...stepO.validateAdapterDescriptor(oContext.adapterDescriptor),
    ...stepO.validateAdapterCapabilityPolicy(oContext.adapterCapabilityPolicy, oUpstream),
    ...stepO.validateEvidenceManifest(
      pUpstream.stepOEvidenceManifest, oPacket.executorInput, oContext,
    ),
    ...stepO.validateSummary(
      pUpstream.stepOExecutorPreflightSummary, oPacket.executorInput, oContext,
      pUpstream.stepOEvidenceManifest,
    ),
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
  ];
  const qResult = stepQ.evaluateSignedOperatorRunPackage(qPacket);
  if (!qResult.ok || qResult.status !== stepQ.PUBLIC_STATES[1] ||
      !canonicalEqual(qResult.oneRunAdapterBindingPackage,
        upstream.stepQOneRunAdapterBinding) ||
      !canonicalEqual(qResult.operatorRunSummary, upstream.stepQOperatorRunSummary)) {
    issues.push("step_q_package_evaluation_mismatch");
  }
  const result = uniqueSorted(issues);
  if (directUpstreamValidationCache.size >= DIRECT_UPSTREAM_VALIDATION_CACHE_LIMIT) {
    directUpstreamValidationCache.delete(
      directUpstreamValidationCache.keys().next().value,
    );
  }
  directUpstreamValidationCache.set(cacheKey, [...result]);
  return result;
}

function buildLoaderDescriptor(overrides = {}) {
  return {
    descriptorVersion: "adapter-loader-policy-descriptor-v1-step114-2x-r",
    loaderClass: "sanitized_immutable_adapter_artifact_loader",
    immutableArtifactRequired: true,
    digestVerificationBeforeLoadRequired: true,
    maximumArtifactCount: 1,
    maximumLoadAttemptCount: 1,
    fallbackArtifactAllowed: false,
    versionSubstitutionAllowed: false,
    hashSubstitutionAllowed: false,
    dynamicDiscoveryAllowed: false,
    automaticRetryAllowed: false,
    ambiguousOutcomeRetryAllowed: false,
    operatorReviewRequiredOnUncertainty: true,
    ...overrides,
  };
}
function buildClaimDescriptor(claimExpiresAt, overrides = {}) {
  return {
    descriptorVersion: "atomic-claim-store-runtime-binding-v1-step114-2x-r",
    atomicClaimPrimitive: stepO.CLAIM_ATOMICITY,
    claimStoreNamespace: stepO.CLAIM_NAMESPACE,
    claimExpiresAt,
    maximumSuccessfulAcquisitions: 1,
    duplicateRejected: true,
    replayRejected: true,
    automaticRetryAllowed: false,
    ambiguousOutcomeRetryAllowed: false,
    failedOutcomeRetryAllowed: false,
    runtimeBound: false,
    storeAccessed: false,
    claimRequested: false,
    claimPersisted: false,
    ...overrides,
  };
}
function buildTransportDescriptor(adapter, manifest, overrides = {}) {
  return {
    descriptorVersion: "read-only-adapter-transport-binding-v1-step114-2x-r",
    transportClass: stepQ.TRANSPORT_CLASS,
    destinationCount: 1,
    observationCount: 1,
    operationOrder: [...manifest.operationOrder],
    observationCategoryOrder: [...manifest.observationCategoryOrder],
    requiredHashOutputFields: [...adapter.requiredHashOutputFields],
    requiredTimestampOutputFields: [...adapter.requiredTimestampOutputFields],
    readOnly: true,
    writesAllowed: false,
    ddlAllowed: false,
    dmlAllowed: false,
    mutationAllowed: false,
    migrationAllowed: false,
    scenarioAllowed: false,
    productionAccessAllowed: false,
    providerMutationAllowed: false,
    credentialEchoAllowed: false,
    credentialPersistenceAllowed: false,
    rawOutputAllowed: false,
    automaticRetryAllowed: false,
    ambiguousOutcomeRetryAllowed: false,
    externalTransportBound: false,
    connectionOpened: false,
    adapterInvoked: false,
    ...overrides,
  };
}
function buildLaterStageDescriptor(descriptorVersion, namespace, overrides = {}) {
  return {
    descriptorVersion,
    namespace,
    laterStageAuthorizationRequired: true,
    runtimeBound: false,
    coordinatorAccessed: false,
    executed: false,
    ...overrides,
  };
}
function buildRuntimeHandoffInput(upstream, overrides = {}) {
  const { qPacket, pContext, oPacket } = getMaterial(upstream);
  const manifest = qPacket.adapterArtifactManifest;
  const adapter = pContext.adapterInterface;
  const evaluationClockInstant = overrides.evaluationClockInstant ||
    "2026-07-18T00:03:20.000Z";
  const runtimeHandoffNonceHash = overrides.runtimeHandoffNonceHash || "8".repeat(64);
  const priorRuntimeHandoffNonceHashes = overrides.priorRuntimeHandoffNonceHashes || [];
  return sealContract({
    contractVersion: VERSIONS.input,
    ...buildBindings(upstream),
    adapterLoaderPolicyDescriptor: buildLoaderDescriptor(
      overrides.adapterLoaderPolicyDescriptor,
    ),
    atomicClaimStoreRuntimeBinding: buildClaimDescriptor(
      oPacket.executorInput.claimExpiresAt,
      overrides.atomicClaimStoreRuntimeBinding,
    ),
    readOnlyAdapterTransportBinding: buildTransportDescriptor(
      adapter, manifest, overrides.readOnlyAdapterTransportBinding,
    ),
    executionReceiptStoreBinding: buildLaterStageDescriptor(
      "execution-receipt-store-binding-v1-step114-2x-r",
      stepO.EXECUTION_RECEIPT_NAMESPACE,
      overrides.executionReceiptStoreBinding,
    ),
    evidenceFinalizationBinding: buildLaterStageDescriptor(
      "evidence-finalization-binding-v1-step114-2x-r",
      EVIDENCE_NAMESPACE,
      overrides.evidenceFinalizationBinding,
    ),
    environmentDisposalBinding: buildLaterStageDescriptor(
      "environment-disposal-binding-v1-step114-2x-r",
      DISPOSAL_NAMESPACE,
      overrides.environmentDisposalBinding,
    ),
    evaluationClockInstant,
    runtimeHandoffNonceHash,
    priorRuntimeHandoffNonceHashes: [...priorRuntimeHandoffNonceHashes],
    syntheticValidationOnly: true,
    nonExecuting: true,
    realRuntimeDependencyBound: false,
    adapterArtifactBytesRead: false,
    adapterArtifactDigestVerified: false,
    adapterRuntimeLoaded: false,
    operatorAuthorizationConsumed: false,
    invocationConsumed: false,
    claimRequested: false,
    claimPersisted: false,
    adapterInvoked: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
    ...(overrides.contract || {}),
  }, "input");
}
function validateRuntimeHandoffInput(value, upstream) {
  const issues = [...validateEnvelope(value, "input")];
  if (!isRecord(value)) return uniqueSorted(issues);
  let bindings;
  let expected;
  try {
    bindings = buildBindings(upstream);
    expected = buildRuntimeHandoffInput(upstream, {
      evaluationClockInstant: value.evaluationClockInstant,
      runtimeHandoffNonceHash: value.runtimeHandoffNonceHash,
      priorRuntimeHandoffNonceHashes: value.priorRuntimeHandoffNonceHashes,
    });
  } catch {
    return uniqueSorted([...issues, "runtime_handoff_input_upstream_invalid"]);
  }
  for (const field of UPSTREAM_BINDING_FIELDS) {
    if (!canonicalEqual(value[field], bindings[field])) {
      issues.push(`runtime_handoff_input_upstream_binding_mismatch:${field}`);
    }
  }
  for (const field of INPUT_FIELDS.filter((field) =>
    !["runtimeHandoffInputId", "runtimeHandoffInputHash", "evaluationClockInstant",
      "runtimeHandoffNonceHash", "priorRuntimeHandoffNonceHashes",
      ...UPSTREAM_BINDING_FIELDS].includes(field))) {
    if (!canonicalEqual(value[field], expected[field])) {
      issues.push(`runtime_handoff_input_field_invalid:${field}`);
    }
  }
  if (!hasExactKeys(value.adapterLoaderPolicyDescriptor, LOADER_DESCRIPTOR_FIELDS)) {
    issues.push("runtime_handoff_loader_descriptor_fields_invalid");
  }
  if (!hasExactKeys(value.atomicClaimStoreRuntimeBinding, CLAIM_DESCRIPTOR_FIELDS)) {
    issues.push("runtime_handoff_claim_descriptor_fields_invalid");
  }
  if (!hasExactKeys(value.readOnlyAdapterTransportBinding, TRANSPORT_DESCRIPTOR_FIELDS)) {
    issues.push("runtime_handoff_transport_descriptor_fields_invalid");
  }
  for (const [label, descriptor] of [
    ["receipt", value.executionReceiptStoreBinding],
    ["evidence", value.evidenceFinalizationBinding],
    ["disposal", value.environmentDisposalBinding],
  ]) {
    if (!hasExactKeys(descriptor, LATER_STAGE_DESCRIPTOR_FIELDS)) {
      issues.push(`runtime_handoff_${label}_descriptor_fields_invalid`);
    }
  }
  issues.push(...validateHashArray(
    value.priorRuntimeHandoffNonceHashes, "prior_runtime_handoff_nonce_hashes",
  ));
  if (!isSha256(value.runtimeHandoffNonceHash)) {
    issues.push("runtime_handoff_nonce_hash_invalid");
  }
  const earlierNonces = [bindings.requestNonceHash, bindings.intakeNonceHash,
    bindings.approvalResponseNonceHash, bindings.invocationNonceHash,
    bindings.claimNonceHash, bindings.operatorAuthorizationNonceHash];
  if (earlierNonces.includes(value.runtimeHandoffNonceHash)) {
    issues.push("runtime_handoff_nonce_not_distinct");
  }
  if (Array.isArray(value.priorRuntimeHandoffNonceHashes) &&
      value.priorRuntimeHandoffNonceHashes.includes(value.runtimeHandoffNonceHash)) {
    issues.push("runtime_handoff_nonce_replay");
  }
  const now = parseInstant(value.evaluationClockInstant);
  const start = parseInstant(bindings.observationWindowStartsAt);
  const expiries = [bindings.operatorAuthorizationExpiresAt,
    bindings.stepOClaimExpiresAt, bindings.stepOExecutorInputExpiresAt,
    bindings.stepNInvocationExpiresAt, bindings.observationWindowExpiresAt]
    .map(parseInstant);
  if (now === null || start === null || expiries.some((item) => item === null) ||
      now < start || now >= Math.min(...expiries)) {
    issues.push("runtime_handoff_evaluation_clock_invalid");
  }
  return uniqueSorted(issues);
}

function buildAdapterLoaderPolicy(upstream, input, overrides = {}) {
  const { qPacket } = getMaterial(upstream);
  const manifest = qPacket.adapterArtifactManifest;
  const descriptor = input.adapterLoaderPolicyDescriptor;
  return sealContract({
    contractVersion: VERSIONS.loader,
    ...buildBindings(upstream),
    runtimeHandoffInputId: input.runtimeHandoffInputId,
    runtimeHandoffInputHash: input.runtimeHandoffInputHash,
    adapterInterfaceVersion: manifest.adapterInterfaceVersion,
    loaderClass: descriptor.loaderClass,
    immutableArtifactRequired: descriptor.immutableArtifactRequired,
    digestVerificationBeforeLoadRequired:
      descriptor.digestVerificationBeforeLoadRequired,
    maximumArtifactCount: descriptor.maximumArtifactCount,
    maximumLoadAttemptCount: descriptor.maximumLoadAttemptCount,
    fallbackArtifactAllowed: descriptor.fallbackArtifactAllowed,
    versionSubstitutionAllowed: descriptor.versionSubstitutionAllowed,
    hashSubstitutionAllowed: descriptor.hashSubstitutionAllowed,
    dynamicDiscoveryAllowed: descriptor.dynamicDiscoveryAllowed,
    automaticRetryAllowed: descriptor.automaticRetryAllowed,
    ambiguousOutcomeRetryAllowed: descriptor.ambiguousOutcomeRetryAllowed,
    operatorReviewRequiredOnUncertainty:
      descriptor.operatorReviewRequiredOnUncertainty,
    artifactBytesRead: false,
    artifactDigestVerified: false,
    moduleResolved: false,
    adapterRuntimeLoaded: false,
    loaderInvoked: false,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...overrides,
  }, "loader");
}
function validateAdapterLoaderPolicy(value, upstream, input) {
  const issues = [...validateEnvelope(value, "loader")];
  let expected;
  try { expected = buildAdapterLoaderPolicy(upstream, input); } catch {
    return uniqueSorted([...issues, "adapter_loader_policy_expected_construction_failed"]);
  }
  for (const field of LOADER_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`adapter_loader_policy_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildRuntimeDependencyPolicy(upstream, input, overrides = {}) {
  const { pContext, oContext } = getMaterial(upstream);
  const claim = input.atomicClaimStoreRuntimeBinding;
  const transport = input.readOnlyAdapterTransportBinding;
  const receipt = input.executionReceiptStoreBinding;
  const evidence = input.evidenceFinalizationBinding;
  const disposal = input.environmentDisposalBinding;
  return sealContract({
    contractVersion: VERSIONS.dependency,
    ...buildBindings(upstream),
    runtimeHandoffInputId: input.runtimeHandoffInputId,
    runtimeHandoffInputHash: input.runtimeHandoffInputHash,
    claimStoreBinding: {
      claimKeyHash: input.claimKeyHash,
      claimNonceHash: input.claimNonceHash,
      stepPClaimStoreInterfaceHash: input.stepPClaimStoreInterfaceHash,
      atomicClaimPrimitive: claim.atomicClaimPrimitive,
      claimStoreNamespace: claim.claimStoreNamespace,
      claimExpiresAt: claim.claimExpiresAt,
      maximumSuccessfulAcquisitions: claim.maximumSuccessfulAcquisitions,
      duplicateRejected: claim.duplicateRejected,
      replayRejected: claim.replayRejected,
      automaticRetryAllowed: claim.automaticRetryAllowed,
      ambiguousOutcomeRetryAllowed: claim.ambiguousOutcomeRetryAllowed,
      failedOutcomeRetryAllowed: claim.failedOutcomeRetryAllowed,
      runtimeBound: false,
      storeAccessed: false,
      claimRequested: false,
      claimPersisted: false,
    },
    readOnlyTransportBinding: {
      stepPAdapterInterfaceHash: pContext.adapterInterface.adapterInterfaceHash,
      stepOAdapterCapabilityPolicyId:
        oContext.adapterCapabilityPolicy.adapterCapabilityPolicyId,
      stepOAdapterCapabilityPolicyHash:
        oContext.adapterCapabilityPolicy.adapterCapabilityPolicyHash,
      adapterInterfaceVersion: pContext.adapterInterface.adapterInterfaceVersion,
      transportClass: transport.transportClass,
      destinationCount: transport.destinationCount,
      observationCount: transport.observationCount,
      operationOrder: [...transport.operationOrder],
      observationCategoryOrder: [...transport.observationCategoryOrder],
      requiredHashOutputFields: [...transport.requiredHashOutputFields],
      requiredTimestampOutputFields: [...transport.requiredTimestampOutputFields],
      readOnly: transport.readOnly,
      writesAllowed: false,
      ddlAllowed: false,
      dmlAllowed: false,
      mutationAllowed: false,
      migrationAllowed: false,
      scenarioAllowed: false,
      productionAccessAllowed: false,
      providerMutationAllowed: false,
      credentialEchoAllowed: false,
      credentialPersistenceAllowed: false,
      rawOutputAllowed: false,
      automaticRetryAllowed: false,
      ambiguousOutcomeRetryAllowed: false,
      externalTransportBound: false,
      connectionOpened: false,
      adapterInvoked: false,
    },
    executionReceiptBinding: {
      stepPReceiptStoreInterfaceHash: input.stepPReceiptStoreInterfaceHash,
      namespace: receipt.namespace,
      claimStoreNamespace: claim.claimStoreNamespace,
      laterStageAuthorizationRequired: true,
      runtimeBound: false,
      storeAccessed: false,
      persistenceExecuted: false,
    },
    evidenceFinalizationBinding: {
      namespace: evidence.namespace,
      claimStoreNamespace: claim.claimStoreNamespace,
      executionReceiptNamespace: receipt.namespace,
      laterStageAuthorizationRequired: true,
      runtimeBound: false,
      coordinatorAccessed: false,
      finalizationExecuted: false,
    },
    environmentDisposalBinding: {
      namespace: disposal.namespace,
      claimStoreNamespace: claim.claimStoreNamespace,
      executionReceiptNamespace: receipt.namespace,
      evidenceNamespace: evidence.namespace,
      laterStageAuthorizationRequired: true,
      runtimeBound: false,
      coordinatorAccessed: false,
      disposalExecuted: false,
    },
    namespacesPairwiseDistinct: true,
    syntheticValidationOnly: true,
    nonExecuting: true,
    realRuntimeDependencyBound: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "dependency");
}
function validateRuntimeDependencyPolicy(value, upstream, input) {
  const issues = [...validateEnvelope(value, "dependency")];
  let expected;
  try { expected = buildRuntimeDependencyPolicy(upstream, input); } catch {
    return uniqueSorted([...issues, "runtime_dependency_policy_expected_construction_failed"]);
  }
  for (const field of DEPENDENCY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`runtime_dependency_policy_field_invalid:${field}`);
    }
  }
  if (isRecord(value)) {
    const namespaces = [value.claimStoreBinding?.claimStoreNamespace,
      value.executionReceiptBinding?.namespace,
      value.evidenceFinalizationBinding?.namespace,
      value.environmentDisposalBinding?.namespace];
    if (namespaces.some((item) => typeof item !== "string") ||
        new Set(namespaces).size !== namespaces.length) {
      issues.push("runtime_dependency_namespaces_not_distinct");
    }
  }
  return uniqueSorted(issues);
}

function earliestExpiry(bindings) {
  const values = [bindings.operatorAuthorizationExpiresAt,
    bindings.stepOClaimExpiresAt, bindings.stepOExecutorInputExpiresAt,
    bindings.stepNInvocationExpiresAt, bindings.observationWindowExpiresAt];
  const parsed = values.map(parseInstant);
  if (parsed.some((item) => item === null)) throw new TypeError("expiry_invalid");
  return new Date(Math.min(...parsed)).toISOString();
}
function buildRuntimePreconditionManifest(upstream, input, loader, dependency,
  overrides = {}) {
  const { qPacket } = getMaterial(upstream);
  const bindings = buildBindings(upstream);
  return sealContract({
    contractVersion: VERSIONS.precondition,
    ...bindings,
    runtimeHandoffInputId: input.runtimeHandoffInputId,
    runtimeHandoffInputHash: input.runtimeHandoffInputHash,
    adapterLoaderPolicyId: loader.adapterLoaderPolicyId,
    adapterLoaderPolicyHash: loader.adapterLoaderPolicyHash,
    runtimeDependencyPolicyId: dependency.runtimeDependencyPolicyId,
    runtimeDependencyPolicyHash: dependency.runtimeDependencyPolicyHash,
    runtimeHandoffNonceHash: input.runtimeHandoffNonceHash,
    priorRuntimeHandoffNonceHashes: [...input.priorRuntimeHandoffNonceHashes],
    evaluationClockInstant: input.evaluationClockInstant,
    earliestExpiry: earliestExpiry(bindings),
    operationOrder: [...qPacket.operatorAuthorization.orderedOperations],
    observationCategoryOrder:
      [...qPacket.adapterArtifactManifest.observationCategoryOrder],
    executionStateSequence: [...HANDOFF_SEQUENCE],
    maximumArtifactCount: 1,
    maximumClaimAcquisitionCount: 1,
    maximumAdapterLoadAttemptCount: 1,
    destinationCount: 1,
    observationCount: 1,
    artifactDigestVerificationRequiredLater: true,
    claimAcquisitionRequiredLater: true,
    adapterLoadingRequiredLater: true,
    observationRequiredLater: true,
    receiptPersistenceRequiredLater: true,
    evidenceFinalizationRequiredLater: true,
    environmentDisposalRequiredLater: true,
    syntheticValidationOnly: true,
    nonExecuting: true,
    rawMaterialPresent: false,
    ...overrides,
  }, "precondition");
}
function validateRuntimePreconditionManifest(value, upstream, input, loader,
  dependency) {
  const issues = [...validateEnvelope(value, "precondition")];
  let expected;
  try {
    expected = buildRuntimePreconditionManifest(upstream, input, loader, dependency);
  } catch {
    return uniqueSorted([...issues, "runtime_precondition_expected_construction_failed"]);
  }
  for (const field of PRECONDITION_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`runtime_precondition_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildOneRunExecutionHandoff(upstream, input, loader, dependency,
  precondition, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.handoff,
    ...buildBindings(upstream),
    runtimeHandoffInputId: input.runtimeHandoffInputId,
    runtimeHandoffInputHash: input.runtimeHandoffInputHash,
    adapterLoaderPolicyId: loader.adapterLoaderPolicyId,
    adapterLoaderPolicyHash: loader.adapterLoaderPolicyHash,
    runtimeDependencyPolicyId: dependency.runtimeDependencyPolicyId,
    runtimeDependencyPolicyHash: dependency.runtimeDependencyPolicyHash,
    runtimePreconditionManifestId: precondition.runtimePreconditionManifestId,
    runtimePreconditionManifestHash: precondition.runtimePreconditionManifestHash,
    handoffSequence: [...HANDOFF_SEQUENCE],
    evaluationClockInstant: input.evaluationClockInstant,
    runtimeHandoffNonceHash: input.runtimeHandoffNonceHash,
    automaticRetryAllowed: false,
    artifactBytesInspected: false,
    artifactDigestVerified: false,
    loaderInvoked: false,
    storeInvoked: false,
    transportInvoked: false,
    adapterInvoked: false,
    evidenceSinkInvoked: false,
    receiptSinkInvoked: false,
    disposalCoordinatorInvoked: false,
    syntheticValidationOnly: true,
    nonExecuting: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  }, "handoff");
}
function validateOneRunExecutionHandoff(value, upstream, input, loader,
  dependency, precondition) {
  const issues = [...validateEnvelope(value, "handoff")];
  let expected;
  try {
    expected = buildOneRunExecutionHandoff(
      upstream, input, loader, dependency, precondition,
    );
  } catch {
    return uniqueSorted([...issues, "one_run_handoff_expected_construction_failed"]);
  }
  for (const field of HANDOFF_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`one_run_handoff_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildSummary(upstream, input, loader, dependency, precondition,
  handoff, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    ...buildBindings(upstream),
    runtimeHandoffInputId: input.runtimeHandoffInputId,
    runtimeHandoffInputHash: input.runtimeHandoffInputHash,
    adapterLoaderPolicyId: loader.adapterLoaderPolicyId,
    adapterLoaderPolicyHash: loader.adapterLoaderPolicyHash,
    runtimeDependencyPolicyId: dependency.runtimeDependencyPolicyId,
    runtimeDependencyPolicyHash: dependency.runtimeDependencyPolicyHash,
    runtimePreconditionManifestId: precondition.runtimePreconditionManifestId,
    runtimePreconditionManifestHash: precondition.runtimePreconditionManifestHash,
    oneRunExecutionHandoffId: handoff.oneRunExecutionHandoffId,
    oneRunExecutionHandoffHash: handoff.oneRunExecutionHandoffHash,
    publicState: PUBLIC_STATES[1],
    stepQPackageValidated: true,
    directUpstreamValidatorsPassed: true,
    runtimeHandoffInputValidated: true,
    runtimeHandoffNonceReplayAndChronologyValidated: true,
    adapterLoaderPolicyValidated: true,
    runtimeDependencyPolicyValidated: true,
    runtimePreconditionManifestPrepared: true,
    handoffSequenceValidated: true,
    nonExecutingOneRunHandoffPrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  }, "summary");
}
function validateSummary(value, upstream, input, loader, dependency,
  precondition, handoff) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try {
    expected = buildSummary(
      upstream, input, loader, dependency, precondition, handoff,
    );
  } catch {
    return uniqueSorted([...issues, "runtime_handoff_summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`runtime_handoff_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildValidSyntheticPacket(upstream, inputOverrides = {}) {
  const runtimeHandoffInput = buildRuntimeHandoffInput(upstream, inputOverrides);
  const adapterLoaderPolicy = buildAdapterLoaderPolicy(
    upstream, runtimeHandoffInput,
  );
  const runtimeDependencyPolicy = buildRuntimeDependencyPolicy(
    upstream, runtimeHandoffInput,
  );
  const runtimePreconditionManifest = buildRuntimePreconditionManifest(
    upstream, runtimeHandoffInput, adapterLoaderPolicy, runtimeDependencyPolicy,
  );
  const oneRunExecutionHandoff = buildOneRunExecutionHandoff(
    upstream, runtimeHandoffInput, adapterLoaderPolicy, runtimeDependencyPolicy,
    runtimePreconditionManifest,
  );
  const runtimeHandoffSummary = buildSummary(
    upstream, runtimeHandoffInput, adapterLoaderPolicy, runtimeDependencyPolicy,
    runtimePreconditionManifest, oneRunExecutionHandoff,
  );
  return { upstream, runtimeHandoffInput, adapterLoaderPolicy,
    runtimeDependencyPolicy, runtimePreconditionManifest,
    oneRunExecutionHandoff, runtimeHandoffSummary };
}
function safeResult(status, summary = {}, handoff = {}, precondition = {}, issues = []) {
  const prepared = status === PUBLIC_STATES[1];
  return {
    ok: prepared,
    status,
    contractVersion: VERSIONS.summary,
    stepQPackageValidated: prepared,
    directUpstreamValidatorsPassed: prepared,
    runtimeHandoffInputValidated: prepared,
    runtimeHandoffNonceReplayAndChronologyValidated: prepared,
    adapterLoaderPolicyValidated: prepared,
    runtimeDependencyPolicyValidated: prepared,
    runtimePreconditionManifestPrepared: prepared,
    handoffSequenceValidated: prepared,
    nonExecutingOneRunHandoffPrepared: prepared,
    runtimeHandoffSummary: prepared ? summary : {},
    oneRunExecutionHandoff: prepared ? handoff : {},
    runtimePreconditionManifest: prepared ? precondition : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: prepared ? [
      "synthetic_preflight_does_not_consume_inspect_load_bind_claim_invoke_observe_connect_execute_persist_dispose_or_deploy",
    ] : [],
  };
}
function evaluateRuntimeHandoffPreflight(packet) {
  if (packet === undefined || packet === null) return safeResult(PUBLIC_STATES[0]);
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "upstream", "runtimeHandoffInput", "adapterLoaderPolicy",
    "runtimeDependencyPolicy", "runtimePreconditionManifest",
    "oneRunExecutionHandoff", "runtimeHandoffSummary",
  ])) return safeResult("blocked", {}, {}, {}, ["runtime_handoff_packet_fields_invalid"]);
  try {
    const issues = validateDirectUpstreamChain(packet.upstream);
    if (issues.length > 0) return safeResult("blocked", {}, {}, {}, issues);
    issues.push(...validateRuntimeHandoffInput(
      packet.runtimeHandoffInput, packet.upstream,
    ));
    issues.push(...validateAdapterLoaderPolicy(
      packet.adapterLoaderPolicy, packet.upstream, packet.runtimeHandoffInput,
    ));
    issues.push(...validateRuntimeDependencyPolicy(
      packet.runtimeDependencyPolicy, packet.upstream, packet.runtimeHandoffInput,
    ));
    issues.push(...validateRuntimePreconditionManifest(
      packet.runtimePreconditionManifest, packet.upstream,
      packet.runtimeHandoffInput, packet.adapterLoaderPolicy,
      packet.runtimeDependencyPolicy,
    ));
    issues.push(...validateOneRunExecutionHandoff(
      packet.oneRunExecutionHandoff, packet.upstream,
      packet.runtimeHandoffInput, packet.adapterLoaderPolicy,
      packet.runtimeDependencyPolicy, packet.runtimePreconditionManifest,
    ));
    issues.push(...validateSummary(
      packet.runtimeHandoffSummary, packet.upstream,
      packet.runtimeHandoffInput, packet.adapterLoaderPolicy,
      packet.runtimeDependencyPolicy, packet.runtimePreconditionManifest,
      packet.oneRunExecutionHandoff,
    ));
    if (issues.length > 0) return safeResult("blocked", {}, {}, {}, issues);
    canonicalJson(packet.runtimePreconditionManifest);
    canonicalJson(packet.oneRunExecutionHandoff);
    canonicalJson(packet.runtimeHandoffSummary);
    return safeResult(PUBLIC_STATES[1], packet.runtimeHandoffSummary,
      packet.oneRunExecutionHandoff, packet.runtimePreconditionManifest);
  } catch {
    return safeResult("blocked", {}, {}, {}, ["runtime_handoff_preflight_validation_failed"]);
  }
}

module.exports = {
  DISPOSAL_NAMESPACE,
  EVIDENCE_NAMESPACE,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  HANDOFF_SEQUENCE,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  SPECS,
  UPSTREAM_BINDING_FIELDS,
  VERSIONS,
  buildAdapterLoaderPolicy,
  buildBindings,
  buildClaimDescriptor,
  buildLaterStageDescriptor,
  buildLoaderDescriptor,
  buildOneRunExecutionHandoff,
  buildRuntimeDependencyPolicy,
  buildRuntimeHandoffInput,
  buildRuntimePreconditionManifest,
  buildSummary,
  buildTransportDescriptor,
  buildUpstream,
  buildValidSyntheticPacket,
  canonicalJson,
  evaluateRuntimeHandoffPreflight,
  safeResult,
  sealContract,
  validateAdapterLoaderPolicy,
  validateDirectUpstreamChain,
  validateOneRunExecutionHandoff,
  validateRuntimeDependencyPolicy,
  validateRuntimeHandoffInput,
  validateRuntimePreconditionManifest,
  validateSummary,
};
