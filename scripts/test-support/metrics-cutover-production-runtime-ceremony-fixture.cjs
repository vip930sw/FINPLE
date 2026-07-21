"use strict";

const stepZFixture = require("./metrics-cutover-production-single-use-executor-fixture.cjs");
const subject = require("../lib/metrics-cutover-production-runtime-ceremony.cjs");

const EVALUATION_CLOCK = stepZFixture.EXECUTION_CLOCK;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function buildChecklist(overrides = {}) {
  return {
    ...Object.fromEntries(subject.CHECKLIST_TRUE_FIELDS.map((field) => [field, true])),
    ...Object.fromEntries(subject.CHECKLIST_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  };
}
function buildRuntimeMaterial(stepZBase, overrides = {}) {
  const direct = subject.validateStepZPacket(stepZBase.packet).direct;
  return {
    contractVersion: "finple.step114-2x-za.runtime-material.v1",
    materialState: "complete",
    ceremonyNonceHash: subject.hashContract(
      "FINPLE_STEP114_2X_ZA_SYNTHETIC_FRESH_CEREMONY_NONCE\0", {
        envelopeHash: stepZBase.envelope.singleUseProductionCutoverEnvelopeHash,
        evaluationClockInstant: EVALUATION_CLOCK,
      }),
    effectiveExpiry: stepZBase.envelope.effectiveCutoverExpiresAt,
    destinationSetCount: 1,
    maximumProductionCsvReplacementCount: 2,
    maximumSelectorMutationCount: 1,
    capabilityBindings: subject.RUNTIME_MATERIAL_INVENTORY.map((name) =>
      subject.expectedCapabilityBinding(name)),
    operationPlan: clone(subject.buildOperationPlan(
      stepZBase.envelope.singleUseProductionCutoverEnvelopeHash)),
    targetReadiness: subject.buildTargetReadiness(direct),
    availability: {
      envelopeClaimAvailable: true,
      cutoverClockAvailable: true,
      preimageReadAndVerificationAvailable: true,
      atomicReplacementAvailable: true,
      selectorMutationAvailable: true,
      rollbackAvailable: true,
      restorationVerificationAvailable: true,
      receiptPersistenceAvailable: true,
      claimTerminalizationAvailable: true,
    },
    authority: {
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
    },
    ...overrides,
  };
}

function buildFixture(options = {}) {
  const stepZBase = stepZFixture.buildFixture();
  const runtimeMaterial = options.runtimeMaterial ||
    buildRuntimeMaterial(stepZBase, options.runtimeMaterialOverrides);
  const packet = {
    mergedMainSha: options.mergedMainSha || subject.MERGED_MAIN_SHA,
    stepZPacket: options.stepZPacket || stepZBase.packet,
    runtimeMaterial,
    operatorChecklistConfirmations: options.operatorChecklistConfirmations ||
      buildChecklist(options.checklistOverrides),
    evaluationClockInstant: options.evaluationClockInstant || EVALUATION_CLOCK,
    priorCeremonyNonceHashes: options.priorCeremonyNonceHashes || [],
  };
  return { packet, calls: stepZBase.calls, stepZBase };
}

module.exports = {
  EVALUATION_CLOCK, buildChecklist, buildFixture, buildRuntimeMaterial, clone,
};
