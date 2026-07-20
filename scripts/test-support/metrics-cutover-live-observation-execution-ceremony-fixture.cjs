"use strict";

const stepTFixture = require("./metrics-cutover-live-observation-controlled-runner-fixture.cjs");
const subject = require("../lib/metrics-cutover-live-observation-execution-ceremony.cjs");

const CLOCK = "2026-07-18T00:03:22.000Z";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function nested(stepSPackage) {
  const stepRPacket = stepSPackage.inputPacket.context.upstream;
  const stepQPacket = stepRPacket.upstream.stepQPacket;
  const stepPPacket = stepQPacket.context.upstream.stepPPacket;
  const stepOPacket = stepPPacket.context.upstream.stepOPacket;
  const stepNPacket = stepOPacket.context.upstream.stepNPacket;
  return { stepQPacket, stepOPacket, stepNPacket };
}
function buildOperationIdentities() {
  return Object.fromEntries(subject.OPERATION_NAMES.map((name, index) => [name, {
    operationId: `step114-2x-u-${name.replace(/[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`)}-operation`,
    idempotencyKey: subject.hashContract("FINPLE_STEP114_2X_U_SYNTHETIC_OPERATION\0",
      { name, index }),
  }]));
}
function buildRuntimeMaterial(stepSPackage, overrides = {}) {
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  const { stepQPacket, stepOPacket, stepNPacket } = nested(stepSPackage);
  return {
    contractVersion: "finple.step114-2x-u.runtime-material.v1",
    runtimeMaterialState: "complete",
    ceremonyNonceHash: "a".repeat(64),
    effectiveExpiry: launch.earliestExpiry,
    destinationCount: 1,
    observationCount: 1,
    singleUseIdentities: {
      executionConfirmationId: launch.executionConfirmationId,
      executionConfirmationHash: launch.executionConfirmationHash,
      operatorAuthorizationId: stepQPacket.operatorAuthorization.operatorAuthorizationId,
      operatorAuthorizationHash: stepQPacket.operatorAuthorization.operatorAuthorizationHash,
      invocationId: stepNPacket.invocation.invocationId,
      invocationHash: stepNPacket.invocation.invocationHash,
      claimKeyHash: stepOPacket.executorInput.claimKeyHash,
      executionLeaseRequestId: "step114-2x-u-synthetic-execution-lease-request",
      claimRequestId: "step114-2x-u-synthetic-claim-request",
      executionConfirmationUnused: true,
      operatorAuthorizationUnused: true,
      invocationUnused: true,
      executionLeaseUnused: true,
      claimUnused: true,
    },
    operationIdentities: buildOperationIdentities(),
    availability: {
      runnerArtifactBytesAvailable: true,
      adapterArtifactBytesAvailable: true,
      killSwitchAvailable: true,
      killSwitchInitiallySafe: true,
      receiptStoreAvailable: true,
      evidenceStoreAvailable: true,
      disposalCoordinatorAvailable: true,
      leaseTerminalizationAvailable: true,
    },
    authority: {
      providerMutationAllowed: false,
      productionMutationAllowed: false,
      automaticRetryAllowed: false,
      fallbackAllowed: false,
      automaticTriggerAllowed: false,
      runtimeRouteAllowed: false,
      cronAllowed: false,
      workerAllowed: false,
      deploymentWorkflowAllowed: false,
      externalExecutionApproved: false,
    },
    ...overrides,
  };
}
function buildChecklist(overrides = {}) {
  return {
    ...Object.fromEntries(subject.CHECKLIST_TRUE_FIELDS.map((field) => [field, true])),
    ...Object.fromEntries(subject.CHECKLIST_FALSE_FIELDS.map((field) => [field, false])),
    ...overrides,
  };
}
function buildFixture(options = {}) {
  const stepT = stepTFixture.buildFixture();
  const runtimeMaterial = options.runtimeMaterial ||
    buildRuntimeMaterial(stepT.stepSPackage, options.runtimeMaterialOverrides);
  const packet = {
    mergedMainSha: options.mergedMainSha || subject.MERGED_MAIN_SHA,
    stepSPackage: options.stepSPackage || stepT.stepSPackage,
    runtimeCapabilities: options.runtimeCapabilities || stepT.packet.runtimeCapabilities,
    runtimeMaterial,
    operatorChecklistConfirmations: options.operatorChecklistConfirmations ||
      buildChecklist(options.checklistOverrides),
    evaluationClockInstant: options.evaluationClockInstant || CLOCK,
    priorCeremonyNonceHashes: options.priorCeremonyNonceHashes || [],
  };
  return { packet, calls: stepT.calls, stepSPackage: stepT.stepSPackage };
}

module.exports = {
  CLOCK,
  buildChecklist,
  buildFixture,
  buildOperationIdentities,
  buildRuntimeMaterial,
  clone,
};
