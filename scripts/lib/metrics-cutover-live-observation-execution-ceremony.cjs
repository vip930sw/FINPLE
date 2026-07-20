"use strict";

const { createHash } = require("node:crypto");
const stepT = require("./metrics-cutover-live-observation-controlled-runner.cjs");

const MERGED_MAIN_SHA = "beb440556d4946008bf33e91f1dc3621c7d599e6";
const VERSION = "finple.step114-2x-u.execution-ceremony.v1";
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_runtime_material",
  "ready_for_explicit_external_execution",
  "blocked",
]);
const RUNTIME_MATERIAL_INVENTORY = Object.freeze([
  "runtimeArtifactSource",
  "runnerArtifactLoader",
  "adapterArtifactLoader",
  "singleUseExecutionLeaseStore",
  "atomicClaimStore",
  "readOnlyObservationTransport",
  "executionReceiptStore",
  "evidenceFinalizer",
  "environmentDisposalCoordinator",
  "executionClock",
]);
const OPERATION_NAMES = Object.freeze([
  "executionLeaseAcquisition",
  "claimAcquisition",
  "executionConfirmationConsumption",
  "operatorAuthorizationConsumption",
  "invocationConsumption",
  "readOnlyObservation",
  "receiptPersistence",
  "evidencePersistence",
  "environmentDisposal",
  "executionLeaseTerminalization",
]);
const CHECKLIST_TRUE_FIELDS = Object.freeze([
  "targetDisposableIsolatedNonProduction",
  "observationReadOnly",
  "destinationCountOne",
  "observationCountOne",
  "stepSEffectiveExpiryUnexpired",
  "executionConfirmationUnused",
  "operatorAuthorizationUnused",
  "invocationUnused",
  "executionLeaseUnused",
  "claimUnused",
  "runnerArtifactBytesAvailable",
  "adapterArtifactBytesAvailable",
  "automaticRetryDisabled",
  "fallbackDisabled",
  "killSwitchAvailable",
  "killSwitchInitiallySafe",
  "receiptStoreAvailable",
  "evidenceStoreAvailable",
  "disposalCoordinatorAvailable",
  "leaseTerminalizationAvailable",
  "providerMutationAuthorityAbsent",
  "productionMutationAuthorityAbsent",
  "externalApprovalNotInferredFromMergeOrCi",
]);
const CHECKLIST_FALSE_FIELDS = Object.freeze([
  "externalExecutionApproved",
  "mergeOrCiImpliesExternalApproval",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "externalExecutionApproved",
  "externalExecutionInvoked",
  "stepTRunnerInvoked",
  "capabilityMethodInvoked",
  "providerCallsAllowed",
  "providerMutationAllowed",
  "productionMutationAllowed",
  "networkAccessAllowed",
  "databaseConnectionAllowed",
  "credentialAccessAllowed",
  "sqlExecutionAllowed",
  "ddlAllowed",
  "dmlAllowed",
  "migrationAllowed",
  "scenarioExecutionAllowed",
  "productionCsvWriteAllowed",
  "loaderPointerMutationAllowed",
  "step456BehaviorChanged",
  "runtimeRouteAdded",
  "cronAdded",
  "workerAdded",
  "deploymentWorkflowChanged",
  "automaticTriggerAllowed",
  "automaticRetryAllowed",
  "fallbackAllowed",
  "rawMaterialPresent",
]);
const EXPECTED_STEP_T_SPECS = Object.freeze({
  runtimeArtifactSource: ["readRunnerArtifactBytes", "readAdapterArtifactBytes",
    "reconcileOperationOutcome"],
  runnerArtifactLoader: ["loadRunner", "reconcileOperationOutcome"],
  adapterArtifactLoader: ["loadAdapter", "reconcileOperationOutcome"],
  singleUseExecutionLeaseStore: ["acquireExecutionLease", "consumeExecutionConfirmation",
    "consumeOperatorAuthorization", "consumeInvocation", "finalizeExecutionLease",
    "reconcileOperationOutcome"],
  atomicClaimStore: ["acquireClaim", "reconcileOperationOutcome"],
  readOnlyObservationTransport: ["checkKillSwitch", "invokeReadOnlyObservation",
    "reconcileOperationOutcome"],
  executionReceiptStore: ["persistSanitizedReceipt", "reconcileOperationOutcome"],
  evidenceFinalizer: ["finalizeSanitizedEvidence", "reconcileOperationOutcome"],
  environmentDisposalCoordinator: ["disposeEnvironment", "reconcileOperationOutcome"],
  executionClock: ["now", "reconcileOperationOutcome"],
});

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
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}
function exactKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...keys].sort());
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
function nested(stepSPackage) {
  const stepRPacket = stepSPackage.inputPacket.context.upstream;
  const stepQPacket = stepRPacket.upstream.stepQPacket;
  const stepPPacket = stepQPacket.context.upstream.stepPPacket;
  const stepOPacket = stepPPacket.context.upstream.stepOPacket;
  const stepNPacket = stepOPacket.context.upstream.stepNPacket;
  return { stepRPacket, stepQPacket, stepOPacket, stepNPacket };
}
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function safeResult(status, overrides = {}) {
  return deepFreeze({
    ok: status === PUBLIC_STATES[1],
    status,
    contractVersion: VERSION,
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: status === PUBLIC_STATES[2],
    mergedMainShaBound: overrides.mergedMainShaBound || false,
    stepSValidated: overrides.stepSValidated || false,
    stepTContractValidated: overrides.stepTContractValidated || false,
    runtimeMaterialInventory: overrides.runtimeMaterialInventory || {},
    operatorChecklist: overrides.operatorChecklist || {},
    evidenceHandoffManifest: overrides.evidenceHandoffManifest || {},
    ...fixedFalse(),
  });
}

function validateMergedStepTContract() {
  const issues = [];
  if (stepT.VERSION !== "finple.step114-2x-t.controlled-runner.v1") {
    issues.push("step_t_contract_version_mismatch");
  }
  if (!canonicalEqual(stepT.CAPABILITY_NAMES, RUNTIME_MATERIAL_INVENTORY)) {
    issues.push("step_t_capability_inventory_mismatch");
  }
  if (!canonicalEqual(stepT.CAPABILITY_SPECS, EXPECTED_STEP_T_SPECS)) {
    issues.push("step_t_capability_specs_mismatch");
  }
  if (!canonicalEqual(stepT.PUBLIC_STATES, [
    "awaiting_external_controlled_live_observation_execution",
    "controlled_live_observation_execution_completed",
    "blocked",
  ])) issues.push("step_t_public_states_mismatch");
  for (const name of RUNTIME_MATERIAL_INVENTORY) {
    const descriptor = stepT.buildCapabilityDescriptor(name);
    if (descriptor.cooperativeCancellationRequired !== true ||
        descriptor.deadlineEnforcementRequired !== true ||
        descriptor.postTimeoutOutcomeReconciliationRequired !== true ||
        descriptor.automaticRetryAllowed !== false || descriptor.fallbackAllowed !== false ||
        descriptor.productionAccessAllowed !== false || !isSha(descriptor.descriptorHash)) {
      issues.push(`step_t_descriptor_contract_mismatch:${name}`);
    }
  }
  return uniqueSorted(issues);
}

function validateRuntimeCapabilities(value) {
  const issues = [...stepT.validateCapabilityBundle(value)];
  if (!isRecord(value)) return uniqueSorted(issues);
  for (const name of RUNTIME_MATERIAL_INVENTORY) {
    const descriptor = value[name]?.descriptor;
    if (!descriptor || !canonicalEqual(descriptor, stepT.buildCapabilityDescriptor(name))) {
      issues.push(`runtime_capability_descriptor_mismatch:${name}`);
    }
  }
  return uniqueSorted(issues);
}

function validatePriorNonceHashes(value) {
  if (!Array.isArray(value) || value.some((item) => !isSha(item)) ||
      new Set(value).size !== value.length ||
      !canonicalEqual(value, [...value].sort())) {
    return ["prior_ceremony_nonce_hashes_invalid"];
  }
  return [];
}

function validateRuntimeMaterial(value, stepSPackage, runtimeCapabilities,
  evaluationClockInstant, priorNonceHashes) {
  const keys = ["contractVersion", "runtimeMaterialState", "ceremonyNonceHash",
    "effectiveExpiry", "destinationCount", "observationCount", "singleUseIdentities",
    "operationIdentities", "availability", "authority"];
  if (!exactKeys(value, keys)) return ["runtime_material_fields_invalid"];
  const issues = [];
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  const { stepQPacket, stepOPacket, stepNPacket } = nested(stepSPackage);
  if (value.contractVersion !== "finple.step114-2x-u.runtime-material.v1") {
    issues.push("runtime_material_version_invalid");
  }
  if (value.runtimeMaterialState !== "complete") issues.push("runtime_material_state_ambiguous");
  if (!isSha(value.ceremonyNonceHash)) issues.push("runtime_material_nonce_invalid");
  if (priorNonceHashes.includes(value.ceremonyNonceHash)) issues.push("runtime_material_nonce_replayed");
  const clock = parseInstant(evaluationClockInstant);
  const expiry = parseInstant(value.effectiveExpiry);
  if (expiry === null || value.effectiveExpiry !== launch.earliestExpiry ||
      clock === null || clock >= expiry) issues.push("runtime_material_expired");
  if (value.destinationCount !== 1) issues.push("runtime_material_destination_count_invalid");
  if (value.observationCount !== 1) issues.push("runtime_material_observation_count_invalid");

  const identityKeys = ["executionConfirmationId", "executionConfirmationHash",
    "operatorAuthorizationId", "operatorAuthorizationHash", "invocationId",
    "invocationHash", "claimKeyHash", "executionLeaseRequestId", "claimRequestId",
    "executionConfirmationUnused", "operatorAuthorizationUnused", "invocationUnused",
    "executionLeaseUnused", "claimUnused"];
  const identities = value.singleUseIdentities;
  if (!exactKeys(identities, identityKeys)) issues.push("single_use_identities_fields_invalid");
  else {
    const expected = {
      executionConfirmationId: launch.executionConfirmationId,
      executionConfirmationHash: launch.executionConfirmationHash,
      operatorAuthorizationId: stepQPacket.operatorAuthorization.operatorAuthorizationId,
      operatorAuthorizationHash: stepQPacket.operatorAuthorization.operatorAuthorizationHash,
      invocationId: stepNPacket.invocation.invocationId,
      invocationHash: stepNPacket.invocation.invocationHash,
      claimKeyHash: stepOPacket.executorInput.claimKeyHash,
    };
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (identities[field] !== expectedValue) issues.push(`single_use_identity_mismatch:${field}`);
    }
    if (!isSafeId(identities.executionLeaseRequestId) ||
        !isSafeId(identities.claimRequestId) ||
        identities.executionLeaseRequestId === identities.claimRequestId) {
      issues.push("single_use_request_identities_invalid");
    }
    for (const field of ["executionConfirmationUnused", "operatorAuthorizationUnused",
      "invocationUnused", "executionLeaseUnused", "claimUnused"]) {
      if (identities[field] !== true) issues.push(`single_use_identity_not_unused:${field}`);
    }
  }

  if (!exactKeys(value.operationIdentities, OPERATION_NAMES)) {
    issues.push("operation_identities_fields_invalid");
  } else {
    const operationIds = []; const idempotencyKeys = [];
    for (const name of OPERATION_NAMES) {
      const operation = value.operationIdentities[name];
      if (!exactKeys(operation, ["operationId", "idempotencyKey"]) ||
          !isSafeId(operation?.operationId) || !isSha(operation?.idempotencyKey)) {
        issues.push(`operation_identity_invalid:${name}`); continue;
      }
      operationIds.push(operation.operationId); idempotencyKeys.push(operation.idempotencyKey);
    }
    if (new Set(operationIds).size !== OPERATION_NAMES.length ||
        new Set(idempotencyKeys).size !== OPERATION_NAMES.length) {
      issues.push("operation_identities_not_unique");
    }
  }

  const availabilityKeys = ["runnerArtifactBytesAvailable", "adapterArtifactBytesAvailable",
    "killSwitchAvailable", "killSwitchInitiallySafe", "receiptStoreAvailable",
    "evidenceStoreAvailable", "disposalCoordinatorAvailable",
    "leaseTerminalizationAvailable"];
  if (!exactKeys(value.availability, availabilityKeys) ||
      Object.values(value.availability || {}).some((item) => item !== true)) {
    issues.push("runtime_material_availability_incomplete");
  }
  const authorityKeys = ["providerMutationAllowed", "productionMutationAllowed",
    "automaticRetryAllowed", "fallbackAllowed", "automaticTriggerAllowed",
    "runtimeRouteAllowed", "cronAllowed", "workerAllowed", "deploymentWorkflowAllowed",
    "externalExecutionApproved"];
  if (!exactKeys(value.authority, authorityKeys) ||
      Object.values(value.authority || {}).some((item) => item !== false)) {
    issues.push("runtime_material_authority_not_fixed_false");
  }
  for (const name of RUNTIME_MATERIAL_INVENTORY) {
    if (runtimeCapabilities[name]?.descriptor?.automaticRetryAllowed !== false ||
        runtimeCapabilities[name]?.descriptor?.fallbackAllowed !== false ||
        runtimeCapabilities[name]?.descriptor?.productionAccessAllowed !== false ||
        runtimeCapabilities[name]?.descriptor?.mutabilityPolicy?.productionMutationAllowed !== false ||
        runtimeCapabilities[name]?.descriptor?.mutabilityPolicy?.providerMutationAllowed !== false) {
      issues.push(`runtime_capability_authority_invalid:${name}`);
    }
  }
  return uniqueSorted(issues);
}

function validateChecklistConfirmations(value) {
  const keys = [...CHECKLIST_TRUE_FIELDS, ...CHECKLIST_FALSE_FIELDS];
  if (!exactKeys(value, keys)) return ["operator_checklist_fields_invalid"];
  const issues = [];
  for (const field of CHECKLIST_TRUE_FIELDS) {
    if (value[field] !== true) issues.push(`operator_checklist_incomplete:${field}`);
  }
  for (const field of CHECKLIST_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`operator_checklist_forbidden:${field}`);
  }
  return uniqueSorted(issues);
}

function buildRuntimeMaterialInventory(stepSPackage, runtimeCapabilities, runtimeMaterial) {
  const manifest = stepSPackage.inputPacket.runnerImplementationManifest;
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  const capabilities = RUNTIME_MATERIAL_INVENTORY.map((capabilityName) => ({
    capabilityName,
    descriptorHash: runtimeCapabilities[capabilityName].descriptor.descriptorHash,
    present: true,
    descriptorValidated: true,
    methodInvocationCount: 0,
  }));
  return {
    contractVersion: "finple.step114-2x-u.runtime-material-inventory.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepTContractVersion: stepT.VERSION,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    effectiveExpiry: runtimeMaterial.effectiveExpiry,
    destinationCount: 1,
    observationCount: 1,
    capabilityCount: capabilities.length,
    capabilities,
    allMaterialPresent: true,
    allDescriptorsValidated: true,
    allOperationIdentitiesValidated: true,
    allSingleUseIdentitiesUnused: true,
    noCapabilityInvoked: true,
    rawMaterialPresent: false,
  };
}

function buildOperatorChecklist(confirmations) {
  return {
    contractVersion: "finple.step114-2x-u.operator-checklist.v1",
    completion: Object.fromEntries([
      ...CHECKLIST_TRUE_FIELDS.map((field) => [field, true]),
      ...CHECKLIST_FALSE_FIELDS.map((field) => [field, false]),
    ]),
    checklistComplete: true,
    externalExecutionApprovalInferred: false,
    externalExecutionApproved: false,
    rawMaterialPresent: false,
  };
}

function buildEvidenceHandoffManifest(stepSPackage, inventory, checklist) {
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  const manifest = stepSPackage.inputPacket.runnerImplementationManifest;
  const { stepRPacket, stepQPacket, stepOPacket, stepNPacket } = nested(stepSPackage);
  const body = {
    contractVersion: "finple.step114-2x-u.evidence-handoff.v1",
    mergedMainSha: MERGED_MAIN_SHA,
    stepTContractVersion: stepT.VERSION,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    executionConfirmationId: launch.executionConfirmationId,
    executionConfirmationHash: launch.executionConfirmationHash,
    operatorAuthorizationId: stepQPacket.operatorAuthorization.operatorAuthorizationId,
    operatorAuthorizationHash: stepQPacket.operatorAuthorization.operatorAuthorizationHash,
    invocationId: stepNPacket.invocation.invocationId,
    invocationHash: stepNPacket.invocation.invocationHash,
    claimKeyHash: stepOPacket.executorInput.claimKeyHash,
    runtimePreconditionManifestId:
      stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestId,
    runtimePreconditionManifestHash:
      stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestHash,
    effectiveExpiry: inventory.effectiveExpiry,
    destinationCount: 1,
    observationCount: 1,
    capabilityCount: inventory.capabilityCount,
    checklistCompletion: checklist.completion,
    checklistComplete: true,
    providerMutationAllowed: false,
    productionMutationAllowed: false,
    automaticRetryAllowed: false,
    fallbackAllowed: false,
    automaticTriggerAllowed: false,
    externalExecutionApproved: false,
    stepTRunnerInvoked: false,
    capabilityMethodInvoked: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_U_EVIDENCE_HANDOFF_ID\0", body);
  const withId = { ...body,
    evidenceHandoffManifestId: `step114-2x-u-evidence-handoff-${idHash}` };
  return { ...withId, evidenceHandoffManifestHash:
    hashContract("FINPLE_STEP114_2X_U_EVIDENCE_HANDOFF_HASH\0", withId) };
}

function evaluateExecutionCeremony(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, ["mergedMainSha", "stepSPackage", "runtimeCapabilities",
    "runtimeMaterial", "operatorChecklistConfirmations", "evaluationClockInstant",
    "priorCeremonyNonceHashes"])) {
    return safeResult(PUBLIC_STATES[2], { blockingIssues: ["ceremony_packet_fields_invalid"] });
  }
  const issues = [];
  if (packet.mergedMainSha !== MERGED_MAIN_SHA) issues.push("merged_main_sha_mismatch");
  issues.push(...validateMergedStepTContract());
  issues.push(...stepT.validateDirectStepSPackage(packet.stepSPackage)
    .map((issue) => `step_s:${issue}`));
  issues.push(...validateRuntimeCapabilities(packet.runtimeCapabilities));
  issues.push(...validatePriorNonceHashes(packet.priorCeremonyNonceHashes));
  if (parseInstant(packet.evaluationClockInstant) === null) {
    issues.push("evaluation_clock_invalid");
  }
  if (!issues.length) {
    issues.push(...validateRuntimeMaterial(packet.runtimeMaterial, packet.stepSPackage,
      packet.runtimeCapabilities, packet.evaluationClockInstant,
      packet.priorCeremonyNonceHashes));
    issues.push(...validateChecklistConfirmations(packet.operatorChecklistConfirmations));
  }
  const uniqueIssues = uniqueSorted(issues);
  if (uniqueIssues.length) return safeResult(PUBLIC_STATES[2], {
    blockingIssues: uniqueIssues,
    mergedMainShaBound: packet.mergedMainSha === MERGED_MAIN_SHA,
    stepTContractValidated: validateMergedStepTContract().length === 0,
  });
  const inventory = buildRuntimeMaterialInventory(packet.stepSPackage,
    packet.runtimeCapabilities, packet.runtimeMaterial);
  const checklist = buildOperatorChecklist(packet.operatorChecklistConfirmations);
  const evidenceHandoffManifest = buildEvidenceHandoffManifest(
    packet.stepSPackage, inventory, checklist);
  return safeResult(PUBLIC_STATES[1], {
    mergedMainShaBound: true,
    stepSValidated: true,
    stepTContractValidated: true,
    runtimeMaterialInventory: inventory,
    operatorChecklist: checklist,
    evidenceHandoffManifest,
  });
}

module.exports = {
  CHECKLIST_FALSE_FIELDS,
  CHECKLIST_TRUE_FIELDS,
  FIXED_FALSE_FIELDS,
  MERGED_MAIN_SHA,
  OPERATION_NAMES,
  PUBLIC_STATES,
  RUNTIME_MATERIAL_INVENTORY,
  VERSION,
  buildEvidenceHandoffManifest,
  buildOperatorChecklist,
  buildRuntimeMaterialInventory,
  canonicalJson,
  evaluateExecutionCeremony,
  hashContract,
  validateChecklistConfirmations,
  validateMergedStepTContract,
  validateRuntimeCapabilities,
  validateRuntimeMaterial,
};
