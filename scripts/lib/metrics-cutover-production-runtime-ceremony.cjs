"use strict";

const { createHash } = require("node:crypto");
const stepY = require("./metrics-cutover-production-approval-envelope.cjs");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");

const MERGED_MAIN_SHA = "6fee85ba9e676336b4fa458880b15d9c8918795a";
const VERSION = "finple.step114-2x-za.production-cutover-runtime-ceremony.v1";
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_production_cutover_runtime_material",
  "ready_for_explicit_production_cutover_execution",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_runtime_material_validation",
  "blocked_during_runtime_material_validation",
  "blocked_during_operator_checklist_validation",
]);
const RUNTIME_MATERIAL_INVENTORY = Object.freeze([...stepZ.CAPABILITY_NAMES]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "cutoverExecutorInvoked", "capabilityMethodInvoked", "envelopeClaimAcquired",
  "envelopeClaimTerminalized", "cutoverReceiptPersisted",
  "productionWritePerformed", "selectorMutationPerformed",
  "loaderActivationPerformed", "deploymentPerformed", "providerAccessAllowed",
  "databaseAccessAllowed", "networkAccessAllowed", "credentialAccessAllowed",
  "sqlExecutionAllowed", "migrationAllowed", "scenarioAccessAllowed",
  "automaticRetryAllowed", "secondCutoverAttemptAllowed", "runtimeRouteAdded",
  "cronAdded", "workerAdded", "triggerAdded", "rawMaterialPresent",
]);
const CHECKLIST_TRUE_FIELDS = Object.freeze([
  "mergedMainAndStepZYIdentitiesCurrent",
  "stepYEnvelopeUnconsumedAndUnexpired",
  "productionCsvTargetsMatchBoundPreimageOrAbsence",
  "selectorMatchesBoundPreimage",
  "usCandidateMatchesSealedIdentities",
  "krCandidateMatchesSealedIdentities",
  "rollbackMaterialAvailable",
  "restorationVerificationAvailable",
  "atomicReplacementIsolatedToBoundTargets",
  "selectorMutationIsolatedToBoundSelector",
  "automaticRetryDisabled",
  "secondCutoverAttemptDisabled",
  "loaderActivationDisabled",
  "deploymentDisabled",
  "receiptPersistenceAvailable",
  "claimTerminalizationAvailable",
  "separateExplicitOperatorInvocationRequired",
]);
const CHECKLIST_FALSE_FIELDS = Object.freeze([
  "executionApprovalInferredFromReadiness",
  "executionApprovalInferredFromMergeCiVercelOrOwnership",
  "executionAlreadyInvoked",
]);
const INPUT_FIELDS = Object.freeze([
  "mergedMainSha", "stepZPacket", "runtimeMaterial",
  "operatorChecklistConfirmations", "evaluationClockInstant",
  "priorCeremonyNonceHashes",
]);
const RUNTIME_MATERIAL_FIELDS = Object.freeze([
  "contractVersion", "materialState", "ceremonyNonceHash", "effectiveExpiry",
  "destinationSetCount", "maximumProductionCsvReplacementCount",
  "maximumSelectorMutationCount", "capabilityBindings", "operationPlan",
  "targetReadiness", "availability", "authority",
]);
const CAPABILITY_BINDING_FIELDS = Object.freeze([
  "capabilityName", "descriptorHash", "methodNames", "methodSetHash",
  "runtimeArtifactSha256", "sourceTreeSha256", "capabilityManifestSha256",
  "namespacePolicy", "idempotencyPolicy", "timeoutPolicy",
  "cancellationPolicy", "reconciliationPolicy", "sanitizationPolicy",
  "materialPresent",
]);
const OPERATION_PLAN_FIELDS = Object.freeze([
  "sequence", "stage", "capabilityName", "methodName", "operationId",
  "idempotencyKey",
]);
const OPERATION_BINDINGS = Object.freeze([
  ["singleUseCutoverEnvelopeStore", "acquireEnvelopeClaim"],
  ["cutoverPreimageReader", "readBoundPreimages"],
  ["atomicProductionCsvReplacer", "replaceProductionCsvAtomically"],
  ["cutoverPreimageReader", "readProductionCsvIdentity"],
  ["atomicProductionCsvReplacer", "replaceProductionCsvAtomically"],
  ["cutoverPreimageReader", "readProductionCsvIdentity"],
  ["selectorMutationCoordinator", "mutateSelectorExactlyOnce"],
  ["cutoverPreimageReader", "readPostCutoverState"],
  ["cutoverReceiptStore", "persistCutoverReceipt"],
  ["singleUseCutoverEnvelopeStore", "terminalizeEnvelopeClaim"],
  ["rollbackCoordinator", "restoreBoundPreimages"],
  ["cutoverPreimageReader", "readBoundPreimages"],
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
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isGitSha(value) { return typeof value === "string" && /^[0-9a-f]{40}$/.test(value); }
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
  return Object.fromEntries(RUNTIME_MATERIAL_INVENTORY.map((name) => [name, 0]));
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1], status, contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: false,
    mergedMainShaBound: overrides.mergedMainShaBound === true,
    stepZContractValidated: overrides.stepZContractValidated === true,
    completeStepZYXWVUTSChainValidated:
      overrides.completeStepZYXWVUTSChainValidated === true,
    runtimeMaterialValidated: overrides.runtimeMaterialValidated === true,
    operatorChecklistValidated: overrides.operatorChecklistValidated === true,
    nonExecuting: true,
    explicitInvocationRequired: true,
    capabilityInvocationCounts: emptyInvocationCounts(),
    runtimeMaterialInventory: overrides.runtimeMaterialInventory || {},
    operatorChecklist: overrides.operatorChecklist || {},
    explicitExecutionHandoff: overrides.explicitExecutionHandoff || {},
    ...fixedFalse(),
  });
}

function buildOperationPlan(envelopeHash) {
  return deepFreeze(stepZ.buildOperationPlan(envelopeHash).map((operation, index) => ({
    sequence: operation.sequence,
    stage: operation.stage,
    capabilityName: OPERATION_BINDINGS[index][0],
    methodName: OPERATION_BINDINGS[index][1],
    operationId: operation.operationId,
    idempotencyKey: operation.idempotencyKey,
  })));
}

function validateMergedStepZContract() {
  const issues = [];
  if (stepZ.VERSION !== "finple.step114-2x-z.production-single-use-cutover-executor.v1") {
    issues.push("step_z_contract_version_mismatch");
  }
  if (!canonicalEqual(stepZ.PUBLIC_STATES, [
    "awaiting_explicit_single_use_production_cutover_execution",
    "single_use_production_cutover_execution_completed", "blocked",
  ])) issues.push("step_z_public_states_mismatch");
  if (!canonicalEqual(stepZ.CAPABILITY_NAMES, RUNTIME_MATERIAL_INVENTORY) ||
      !canonicalEqual(stepZ.OPERATION_STAGES,
        buildOperationPlan("0".repeat(64)).map((entry) => entry.stage))) {
    issues.push("step_z_operation_or_capability_contract_mismatch");
  }
  if (stepZ.EXECUTION_TRACE.length !== 11 || stepZ.OPERATION_STAGES.length !== 12) {
    issues.push("step_z_execution_trace_contract_mismatch");
  }
  for (const name of RUNTIME_MATERIAL_INVENTORY) {
    const descriptor = stepZ.buildCapabilityDescriptor(name);
    if (!canonicalEqual(descriptor.methodNames, stepZ.CAPABILITY_METHODS[name]) ||
        descriptor.hardTimeoutMilliseconds !== 100 ||
        descriptor.cooperativeCancellationRequired !== true ||
        descriptor.deadlineEnforcementRequired !== true ||
        descriptor.automaticRetryAllowed !== false || descriptor.fallbackAllowed !== false ||
        descriptor.dynamicDiscoveryAllowed !== false ||
        descriptor.ambientFilesystemLookupAllowed !== false ||
        descriptor.providerAccessAllowed !== false ||
        descriptor.databaseAccessAllowed !== false ||
        descriptor.networkAccessAllowed !== false ||
        descriptor.loaderActivationAllowed !== false ||
        descriptor.deploymentAllowed !== false ||
        descriptor.rawMaterialOutputAllowed !== false || !isSha(descriptor.descriptorHash)) {
      issues.push(`step_z_capability_descriptor_mismatch:${name}`);
    }
  }
  return uniqueSorted(issues);
}

function validateStepZPacket(stepZPacket) {
  const issues = [];
  if (!exactKeys(stepZPacket, stepZ.INPUT_FIELDS)) return {
    issues: ["step_z_packet_fields_invalid"], direct: null,
  };
  if (stepZPacket.mergedMainSha !== stepZ.MERGED_MAIN_SHA) {
    issues.push("step_z_merged_main_sha_mismatch");
  }
  issues.push(...stepZ.validateAllCapabilities(stepZPacket));
  let direct = null;
  try { direct = stepZ.directValidateStepY(stepZPacket); }
  catch { issues.push("step_z_direct_validation_failed"); }
  if (direct) issues.push(...direct.issues.map((issue) => `step_z:${issue}`));
  return { issues: uniqueSorted(issues), direct };
}

function validatePriorNonceHashes(value, upstreamNonceHashes, fresh) {
  const issues = [];
  if (!Array.isArray(value) || value.some((item) => !isSha(item)) ||
      new Set(value).size !== value.length ||
      !canonicalEqual(value, [...value].sort())) {
    issues.push("prior_ceremony_nonce_hashes_invalid");
  } else if (value.includes(fresh)) issues.push("runtime_ceremony_nonce_replayed");
  if (upstreamNonceHashes.includes(fresh)) {
    issues.push("runtime_ceremony_nonce_matches_upstream_nonce");
  }
  return uniqueSorted(issues);
}

function expectedCapabilityBinding(name, material = {}) {
  const descriptor = stepZ.buildCapabilityDescriptor(name);
  const methodSetHash = hashContract(
    "FINPLE_STEP114_2X_ZA_CAPABILITY_METHOD_SET\0",
    { capabilityName: name, methodNames: descriptor.methodNames });
  const runtimeArtifactSha256 = material.runtimeArtifactSha256 || hashContract(
    "FINPLE_STEP114_2X_ZA_SYNTHETIC_RUNTIME_ARTIFACT\0", name);
  const sourceTreeSha256 = material.sourceTreeSha256 || hashContract(
    "FINPLE_STEP114_2X_ZA_SYNTHETIC_SOURCE_TREE\0", name);
  const capabilityManifestSha256 = hashContract(
    "FINPLE_STEP114_2X_ZA_CAPABILITY_MANIFEST\0", {
      capabilityName: name, descriptorHash: descriptor.descriptorHash,
      methodSetHash, runtimeArtifactSha256, sourceTreeSha256,
    });
  return {
    capabilityName: name,
    descriptorHash: descriptor.descriptorHash,
    methodNames: [...descriptor.methodNames],
    methodSetHash, runtimeArtifactSha256, sourceTreeSha256,
    capabilityManifestSha256,
    namespacePolicy: descriptor.namespacePolicy,
    idempotencyPolicy: descriptor.idempotencyPolicy,
    timeoutPolicy: descriptor.timeoutPolicy,
    cancellationPolicy: descriptor.cancellationPolicy,
    reconciliationPolicy: descriptor.reconciliationPolicy,
    sanitizationPolicy: descriptor.sanitizationPolicy,
    materialPresent: true,
  };
}

function buildTargetReadiness(direct) {
  const bindings = direct.envelope.criticalBindings;
  const identities = bindings.productionCutoverIdentityManifest;
  return {
    destinationSetIdentityHash: hashContract(
      "FINPLE_STEP114_2X_ZA_DESTINATION_SET_IDENTITY\0",
      bindings.productionCsvTargets.map((target) => ({
        market: target.market, targetPath: target.targetPath,
      }))),
    targets: bindings.productionCsvTargets.map((target, index) => ({
      market: target.market,
      targetIdentityHash: hashContract(
        "FINPLE_STEP114_2X_ZA_TARGET_PATH_IDENTITY\0",
        { market: target.market, targetPath: target.targetPath }),
      preimageState: "absent",
      contentSha256: target.contentSha256,
      schemaVersion: target.schemaVersion,
      schemaIdentitySha256: target.schemaIdentitySha256,
      datasetIdentityHash: target.datasetIdentityHash,
      candidatePackageHash: identities.candidatePackage.candidatePackageHash,
      datasetPackageHash: identities.datasetPackageHash,
      rowCount: target.rowCount,
      byteCount: target.byteCount,
      order: index + 1,
    })),
    selector: {
      selectorIdentityHash: hashContract(
        "FINPLE_STEP114_2X_ZA_SELECTOR_PATH_IDENTITY\0",
        identities.selector.selectorPath),
      preimageSha256: bindings.selectorPreimageSha256,
      expectedPostimageSha256: bindings.selectorExpectedPostimageSha256,
    },
    repository: {
      repositoryPreimageSha256: bindings.repositoryPreimageSha256,
      repositoryTreeSha: bindings.repositoryTreeSha,
      repositoryHeadSha: bindings.repositoryHeadSha,
      repositoryIdentityHash: identities.repository.repositoryIdentityHash,
      trackedPathsSha256: identities.repository.trackedPathsSha256,
      targetAbsenceAttestationHash: bindings.targetAbsenceAttestationHash,
      noDriftAttestationHash: bindings.noDriftAttestationHash,
    },
    currentPreimagesAttested: true,
    selectorPreimageAttested: true,
    candidateIdentitiesAttested: true,
    repositoryNoDriftAttested: true,
    rawPathsPresent: false,
    rawBytesPresent: false,
  };
}

function validateRuntimeMaterial(value, packet, direct) {
  if (!exactKeys(value, RUNTIME_MATERIAL_FIELDS)) {
    return ["runtime_material_fields_invalid"];
  }
  const issues = [];
  if (value.contractVersion !== "finple.step114-2x-za.runtime-material.v1") {
    issues.push("runtime_material_contract_version_invalid");
  }
  if (value.materialState !== "complete") issues.push("runtime_material_incomplete");
  if (!isSha(value.ceremonyNonceHash)) issues.push("runtime_ceremony_nonce_invalid");
  const clock = parseInstant(packet.evaluationClockInstant);
  const stepZClock = parseInstant(packet.stepZPacket.executionClockInstant);
  const expiry = parseInstant(value.effectiveExpiry);
  if (clock === null || stepZClock === null || expiry === null || clock !== stepZClock ||
      value.effectiveExpiry !== direct.envelope.effectiveCutoverExpiresAt ||
      clock >= expiry) issues.push("runtime_material_chronology_or_expiry_invalid");
  const upstreamNonces = uniqueSorted(stepY.collectUpstreamNonceHashes(
    packet.stepZPacket.stepYPacket));
  issues.push(...validatePriorNonceHashes(packet.priorCeremonyNonceHashes,
    upstreamNonces, value.ceremonyNonceHash));
  if (value.destinationSetCount !== 1 ||
      value.maximumProductionCsvReplacementCount !== 2 ||
      value.maximumSelectorMutationCount !== 1) {
    issues.push("runtime_material_cardinality_invalid");
  }
  if (!Array.isArray(value.capabilityBindings) ||
      value.capabilityBindings.length !== RUNTIME_MATERIAL_INVENTORY.length) {
    issues.push("runtime_capability_bindings_invalid");
  } else {
    for (let index = 0; index < RUNTIME_MATERIAL_INVENTORY.length; index++) {
      const binding = value.capabilityBindings[index];
      if (!exactKeys(binding, CAPABILITY_BINDING_FIELDS) ||
          !isSha(binding.runtimeArtifactSha256) ||
          !isSha(binding.sourceTreeSha256) ||
          !isSha(binding.capabilityManifestSha256) ||
          !canonicalEqual(binding,
            expectedCapabilityBinding(RUNTIME_MATERIAL_INVENTORY[index], binding))) {
        issues.push(`runtime_capability_binding_invalid:${RUNTIME_MATERIAL_INVENTORY[index]}`);
      }
    }
  }
  const expectedPlan = buildOperationPlan(direct.envelope
    .singleUseProductionCutoverEnvelopeHash);
  if (!Array.isArray(value.operationPlan) || value.operationPlan.some((entry) =>
    !exactKeys(entry, OPERATION_PLAN_FIELDS)) ||
    !canonicalEqual(value.operationPlan, expectedPlan)) {
    issues.push("runtime_operation_plan_invalid");
  }
  if (!canonicalEqual(value.targetReadiness, buildTargetReadiness(direct))) {
    issues.push("runtime_target_preimage_or_candidate_readiness_invalid");
  }
  const expectedAvailability = {
    envelopeClaimAvailable: true, cutoverClockAvailable: true,
    preimageReadAndVerificationAvailable: true,
    atomicReplacementAvailable: true, selectorMutationAvailable: true,
    rollbackAvailable: true, restorationVerificationAvailable: true,
    receiptPersistenceAvailable: true, claimTerminalizationAvailable: true,
  };
  if (!canonicalEqual(value.availability, expectedAvailability)) {
    issues.push("runtime_material_availability_incomplete");
  }
  const expectedAuthority = {
    executionApprovedByCeremony: false,
    executionAuthorityInferredFromMerge: false,
    executionAuthorityInferredFromCi: false,
    executionAuthorityInferredFromVercel: false,
    executionAuthorityInferredFromRepositoryOwnership: false,
    automaticInvocationAllowed: false,
    automaticRetryAllowed: false,
    secondCutoverAttemptAllowed: false,
    loaderActivationAllowed: false,
    deploymentAllowed: false,
    providerAccessAllowed: false,
    databaseAccessAllowed: false,
    networkAccessAllowed: false,
  };
  if (!canonicalEqual(value.authority, expectedAuthority)) {
    issues.push("runtime_material_authority_not_fixed_false");
  }
  return uniqueSorted(issues);
}

function validateChecklistConfirmations(value) {
  const fields = [...CHECKLIST_TRUE_FIELDS, ...CHECKLIST_FALSE_FIELDS];
  if (!exactKeys(value, fields)) return ["operator_checklist_fields_invalid"];
  const issues = [];
  for (const field of CHECKLIST_TRUE_FIELDS) {
    if (value[field] !== true) issues.push(`operator_checklist_incomplete:${field}`);
  }
  for (const field of CHECKLIST_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`operator_checklist_forbidden:${field}`);
  }
  return uniqueSorted(issues);
}

function buildRuntimeMaterialInventory(runtimeMaterial, direct) {
  const capabilities = runtimeMaterial.capabilityBindings.map((binding) => ({
    ...binding, descriptorValidated: true, methodInvocationCount: 0,
  }));
  const body = {
    contractVersion: "finple.step114-2x-za.runtime-material-inventory.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepZContractVersion: stepZ.VERSION,
    stepZMergedMainSha: stepZ.MERGED_MAIN_SHA,
    singleUseProductionCutoverEnvelopeId:
      direct.envelope.singleUseProductionCutoverEnvelopeId,
    singleUseProductionCutoverEnvelopeHash:
      direct.envelope.singleUseProductionCutoverEnvelopeHash,
    effectiveExpiry: runtimeMaterial.effectiveExpiry,
    destinationSetCount: 1,
    maximumProductionCsvReplacementCount: 2,
    maximumSelectorMutationCount: 1,
    capabilityCount: capabilities.length,
    capabilities,
    operationPlan: runtimeMaterial.operationPlan,
    operationPlanHash: hashContract(
      "FINPLE_STEP114_2X_ZA_OPERATION_PLAN\0", runtimeMaterial.operationPlan),
    executorTrace: [...stepZ.EXECUTION_TRACE],
    executorTraceHash: hashContract(
      "FINPLE_STEP114_2X_ZA_EXECUTOR_TRACE\0", stepZ.EXECUTION_TRACE),
    targetReadiness: runtimeMaterial.targetReadiness,
    allMaterialPresent: true,
    allDescriptorsValidated: true,
    allPreimagesAndCandidatesAttested: true,
    noCapabilityInvoked: true,
    rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZA_RUNTIME_MATERIAL_INVENTORY_ID\0", body);
  const withId = { ...body,
    runtimeMaterialInventoryId:
      `step114-2x-za-runtime-material-inventory-${idHash}` };
  return deepFreeze({ ...withId, runtimeMaterialInventoryHash: hashContract(
    "FINPLE_STEP114_2X_ZA_RUNTIME_MATERIAL_INVENTORY_HASH\0", withId) });
}

function buildOperatorChecklist(confirmations) {
  const body = {
    contractVersion: "finple.step114-2x-za.operator-checklist.v1",
    completion: { ...confirmations },
    checklistComplete: true,
    readinessIsExecutionApproval: false,
    explicitOperatorInvocationStillRequired: true,
    rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZA_OPERATOR_CHECKLIST_ID\0", body);
  const withId = { ...body,
    operatorChecklistId: `step114-2x-za-operator-checklist-${idHash}` };
  return deepFreeze({ ...withId, operatorChecklistHash: hashContract(
    "FINPLE_STEP114_2X_ZA_OPERATOR_CHECKLIST_HASH\0", withId) });
}

function buildChainIdentities(direct) {
  const bindings = direct.envelope.criticalBindings;
  return {
    stepZContractVersion: stepZ.VERSION,
    stepZMergedMainSha: stepZ.MERGED_MAIN_SHA,
    stepYApprovalId: direct.rebuilt.productionCutoverApproval.productionCutoverApprovalId,
    stepYApprovalHash: direct.rebuilt.productionCutoverApproval.productionCutoverApprovalHash,
    stepYEnvelopeId: direct.envelope.singleUseProductionCutoverEnvelopeId,
    stepYEnvelopeHash: direct.envelope.singleUseProductionCutoverEnvelopeHash,
    stepXReconciledEvidenceManifestId: bindings.stepXReconciledEvidenceManifestId,
    stepXReconciledEvidenceManifestHash: bindings.stepXReconciledEvidenceManifestHash,
    stepXReadinessPackageId: bindings.stepXProductionCutoverReadinessPackageId,
    stepXReadinessPackageHash: bindings.stepXProductionCutoverReadinessPackageHash,
    stepXReadinessSummaryId: bindings.stepXProductionCutoverReadinessSummaryId,
    stepXReadinessSummaryHash: bindings.stepXProductionCutoverReadinessSummaryHash,
    stepWCloseoutReceiptId: bindings.stepWCloseoutReceiptId,
    stepWCloseoutReceiptHash: bindings.stepWCloseoutReceiptHash,
    stepVApprovalId: bindings.stepVApprovalId,
    stepVApprovalHash: bindings.stepVApprovalHash,
    stepVEnvelopeId: bindings.stepVEnvelopeId,
    stepVEnvelopeHash: bindings.stepVEnvelopeHash,
    stepUEvidenceHandoffId: bindings.stepUEvidenceHandoffId,
    stepUEvidenceHandoffHash: bindings.stepUEvidenceHandoffHash,
    stepURuntimeMaterialManifestId: bindings.stepURuntimeMaterialManifestId,
    stepURuntimeMaterialManifestHash: bindings.stepURuntimeMaterialManifestHash,
    stepTReceiptId: bindings.stepTReceiptId,
    stepTReceiptHash: bindings.stepTReceiptHash,
    stepTEvidenceId: bindings.stepTEvidenceId,
    stepTEvidenceHash: bindings.stepTEvidenceHash,
    stepTClosureId: bindings.stepTClosureId,
    stepTClosureHash: bindings.stepTClosureHash,
    stepSLaunchPackageId: bindings.stepSLaunchPackageId,
    stepSLaunchPackageHash: bindings.stepSLaunchPackageHash,
  };
}

function buildExplicitExecutionHandoff(packet, direct, inventory, checklist) {
  const upstreamNonces = uniqueSorted(stepY.collectUpstreamNonceHashes(
    packet.stepZPacket.stepYPacket));
  const body = {
    contractVersion: "finple.step114-2x-za.explicit-execution-handoff.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    chainIdentities: buildChainIdentities(direct),
    runtimeMaterialInventoryId: inventory.runtimeMaterialInventoryId,
    runtimeMaterialInventoryHash: inventory.runtimeMaterialInventoryHash,
    capabilityInventoryHash: hashContract(
      "FINPLE_STEP114_2X_ZA_CAPABILITY_INVENTORY\0", inventory.capabilities),
    targetReadinessHash: hashContract(
      "FINPLE_STEP114_2X_ZA_TARGET_READINESS\0", inventory.targetReadiness),
    operationPlanHash: inventory.operationPlanHash,
    executorTraceHash: inventory.executorTraceHash,
    operatorChecklistId: checklist.operatorChecklistId,
    operatorChecklistHash: checklist.operatorChecklistHash,
    ceremonyNonceHash: packet.runtimeMaterial.ceremonyNonceHash,
    priorCeremonyNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZA_PRIOR_CEREMONY_NONCE_CONTEXT\0",
      packet.priorCeremonyNonceHashes),
    upstreamNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZA_UPSTREAM_NONCE_CONTEXT\0", upstreamNonces),
    evaluationClockInstant: packet.evaluationClockInstant,
    effectiveExpiry: packet.runtimeMaterial.effectiveExpiry,
    destinationSetCount: 1,
    maximumProductionCsvReplacementCount: 2,
    maximumSelectorMutationCount: 1,
    checklistComplete: true,
    nonExecuting: true,
    explicitInvocationRequired: true,
    runtimeMaterialValidated: true,
    cutoverExecutorInvoked: false,
    capabilityMethodInvoked: false,
    productionWritePerformed: false,
    selectorMutationPerformed: false,
    loaderActivationPerformed: false,
    deploymentPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZA_EXPLICIT_EXECUTION_HANDOFF_ID\0", body);
  const withId = { ...body,
    explicitExecutionHandoffId:
      `step114-2x-za-explicit-execution-handoff-${idHash}` };
  return deepFreeze({ ...withId, explicitExecutionHandoffHash: hashContract(
    "FINPLE_STEP114_2X_ZA_EXPLICIT_EXECUTION_HANDOFF_HASH\0", withId) });
}

function evaluateProductionCutoverRuntimeCeremony(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, INPUT_FIELDS)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: ["runtime_ceremony_packet_fields_invalid"],
  });
  const issues = [];
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) issues.push("merged_main_sha_mismatch");
  issues.push(...validateMergedStepZContract());
  const stepZValidation = validateStepZPacket(packet.stepZPacket);
  issues.push(...stepZValidation.issues);
  if (parseInstant(packet.evaluationClockInstant) === null) {
    issues.push("evaluation_clock_invalid");
  }
  if (issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: uniqueSorted(issues),
    mergedMainShaBound: packet.mergedMainSha === MERGED_MAIN_SHA,
    stepZContractValidated: validateMergedStepZContract().length === 0,
  });
  const runtimeIssues = validateRuntimeMaterial(packet.runtimeMaterial, packet,
    stepZValidation.direct);
  if (runtimeIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1],
    blockingIssues: runtimeIssues, mergedMainShaBound: true,
    stepZContractValidated: true, completeStepZYXWVUTSChainValidated: true,
  });
  const checklistIssues = validateChecklistConfirmations(
    packet.operatorChecklistConfirmations);
  if (checklistIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[2],
    blockingIssues: checklistIssues, mergedMainShaBound: true,
    stepZContractValidated: true, completeStepZYXWVUTSChainValidated: true,
    runtimeMaterialValidated: true,
  });
  const inventory = buildRuntimeMaterialInventory(packet.runtimeMaterial,
    stepZValidation.direct);
  const checklist = buildOperatorChecklist(packet.operatorChecklistConfirmations);
  const handoff = buildExplicitExecutionHandoff(packet, stepZValidation.direct,
    inventory, checklist);
  return safeResult(PUBLIC_STATES[1], {
    mergedMainShaBound: true, stepZContractValidated: true,
    completeStepZYXWVUTSChainValidated: true, runtimeMaterialValidated: true,
    operatorChecklistValidated: true, runtimeMaterialInventory: inventory,
    operatorChecklist: checklist, explicitExecutionHandoff: handoff,
  });
}

module.exports = {
  CAPABILITY_BINDING_FIELDS, CHECKLIST_FALSE_FIELDS, CHECKLIST_TRUE_FIELDS,
  FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS, INPUT_FIELDS, MERGED_MAIN_SHA,
  OPERATION_BINDINGS, OPERATION_PLAN_FIELDS, PUBLIC_STATES,
  RUNTIME_MATERIAL_FIELDS, RUNTIME_MATERIAL_INVENTORY, VERSION,
  buildExplicitExecutionHandoff, buildOperationPlan, buildOperatorChecklist,
  buildRuntimeMaterialInventory, buildTargetReadiness, canonicalJson, deepFreeze,
  evaluateProductionCutoverRuntimeCeremony, expectedCapabilityBinding,
  hashContract, safeResult, validateChecklistConfirmations,
  validateMergedStepZContract, validateRuntimeMaterial, validateStepZPacket,
};
