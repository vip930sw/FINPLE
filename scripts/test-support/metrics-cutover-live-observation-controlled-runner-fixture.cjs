"use strict";

const { generateKeyPairSync, sign } = require("node:crypto");
const stepM = require("../lib/metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("../lib/metrics-cutover-live-observation-invocation.cjs");
const stepO = require("../lib/metrics-cutover-live-observation-executor-preflight.cjs");
const stepP = require("../lib/metrics-cutover-live-observation-executor-shell.cjs");
const stepQ = require("../lib/metrics-cutover-live-observation-operator-run-package.cjs");
const stepR = require("../lib/metrics-cutover-live-observation-runtime-handoff.cjs");
const stepS = require("../lib/metrics-cutover-live-observation-runner-launch-package.cjs");
const subject = require("../lib/metrics-cutover-live-observation-controlled-runner.cjs");

const RUNNER_BYTES = Buffer.from("FINPLE deterministic synthetic Step T runner artifact v1", "utf8");
const ADAPTER_BYTES = Buffer.from("FINPLE deterministic synthetic Step T adapter artifact v1", "utf8");
const CLOCK = "2026-07-18T00:03:22.000Z";
const HASH = "d".repeat(64);
const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const OPERATOR_KEYS = generateKeyPairSync("ed25519");
const pem = (keys) => keys.publicKey.export({ type: "spki", format: "pem" });

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
function buildStepQUpstream() {
  const mUpstream = stepM.buildUpstream();
  const mContext = { upstream: mUpstream,
    approverAllowlist: stepM.buildApproverAllowlist(pem(APPROVER_KEYS)),
    verificationPolicy: stepM.buildVerificationPolicy(mUpstream),
    priorResponseNonceHashes: [] };
  const unsignedResponse = stepM.buildUnsignedApprovalResponse(mUpstream);
  const approvalResponse = stepM.sealSignedApprovalResponse(unsignedResponse,
    sign(null, stepM.buildApprovalSignaturePayload(unsignedResponse),
      APPROVER_KEYS.privateKey).toString("base64"));
  const stepMPacket = { context: mContext, approvalResponse,
    evaluationClockInstant: "2026-07-18T00:03:10.000Z" };
  const authority = stepM.buildObservationAuthorityPackage(approvalResponse, mContext);
  const mSummary = stepM.buildSummary(approvalResponse, mContext, authority);
  const nUpstream = stepN.buildUpstream(stepMPacket, authority, mSummary);
  const nContext = { upstream: nUpstream,
    invokerAllowlist: stepN.buildInvokerAllowlist(pem(INVOKER_KEYS)),
    verificationPolicy: stepN.buildVerificationPolicy(nUpstream),
    priorInvocationNonceHashes: [] };
  const unsignedInvocation = stepN.buildUnsignedInvocation(nUpstream);
  const invocation = stepN.sealSignedInvocation(unsignedInvocation,
    sign(null, stepN.buildInvocationSignaturePayload(unsignedInvocation),
      INVOKER_KEYS.privateKey).toString("base64"));
  const stepNPacket = { context: nContext, invocation,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
  const nReceipt = stepN.buildReceiptCandidate(invocation, nContext);
  const nSummary = stepN.buildSummary(invocation, nContext, nReceipt);
  const oUpstream = stepO.buildUpstream(stepNPacket, nReceipt, nSummary);
  const oContext = { upstream: oUpstream,
    consumptionPolicy: stepO.buildConsumptionPolicy(oUpstream),
    adapterCapabilityPolicy: stepO.buildAdapterCapabilityPolicy(oUpstream),
    adapterDescriptor: stepO.buildAdapterDescriptor(), priorClaimNonceHashes: [],
    priorInvocationNonceHashes: [] };
  const executorInput = stepO.buildExecutorInput(oUpstream);
  const stepOPacket = { context: oContext, executorInput,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
  const oManifest = stepO.buildEvidenceManifest(executorInput, oContext);
  const oSummary = stepO.buildSummary(executorInput, oContext, oManifest);
  const pUpstream = clone(stepP.buildUpstream(stepOPacket, oManifest, oSummary));
  const claimStoreInterface = stepP.buildClaimStoreInterface(pUpstream);
  const adapterInterface = stepP.buildAdapterInterface(pUpstream);
  const receiptStoreInterface = stepP.buildReceiptStoreInterface(pUpstream);
  const pContext = { upstream: pUpstream, claimStoreInterface, adapterInterface,
    receiptStoreInterface };
  const dependencyBundle = stepP.buildDependencyBundle(pUpstream,
    claimStoreInterface, adapterInterface, receiptStoreInterface,
    "2026-07-18T00:03:15.000Z");
  const adapterOutput = stepP.buildSyntheticAdapterOutput(
    pUpstream, "2026-07-18T00:03:15.000Z");
  const executionPlan = stepP.buildExecutionPlan(pUpstream, dependencyBundle);
  const pPacket = { context: pContext, dependencyBundle, claimOutcome: "acquired",
    adapterOutcome: "completed", adapterOutput, executionPlan,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
  const pReceipt = stepP.buildReceiptCandidate(pUpstream, dependencyBundle,
    executionPlan, adapterInterface, adapterOutput);
  const pSummary = stepP.buildSummary(pUpstream, dependencyBundle, executionPlan, pReceipt);
  const qUpstream = stepQ.buildUpstream(pPacket, pReceipt, pSummary);
  const qContext = { upstream: qUpstream,
    operatorAllowlist: stepQ.buildOperatorAllowlist(pem(OPERATOR_KEYS)),
    verificationPolicy: stepQ.buildVerificationPolicy(qUpstream),
    priorOperatorAuthorizationNonceHashes: [] };
  const manifest = stepQ.buildAdapterArtifactManifest(qUpstream, {
    adapterArtifactSha256: subject.sha256(ADAPTER_BYTES),
  });
  const unsigned = stepQ.buildUnsignedOperatorAuthorization(qUpstream, manifest);
  const authorization = stepQ.sealSignedOperatorAuthorization(unsigned,
    sign(null, stepQ.buildOperatorAuthorizationSignaturePayload(unsigned),
      OPERATOR_KEYS.privateKey).toString("base64"));
  const qPacket = { context: qContext, operatorAuthorization: authorization,
    adapterArtifactManifest: manifest,
    evaluationClockInstant: "2026-07-18T00:03:20.000Z" };
  const binding = stepQ.buildOneRunAdapterBinding(authorization, qContext, manifest);
  return stepR.buildUpstream(qPacket, binding,
    stepQ.buildSummary(authorization, qContext, manifest, binding));
}

function buildStepSPackage() {
  const upstream = stepR.buildValidSyntheticPacket(buildStepQUpstream());
  const runnerImplementationManifest = stepS.buildRunnerImplementationManifest(upstream, {
    runnerArtifactSha256: subject.sha256(RUNNER_BYTES),
  });
  const executionConfirmerAllowlist = stepS.buildExecutionConfirmerAllowlist(
    upstream, pem(OPERATOR_KEYS));
  const verificationPolicy = stepS.buildExecutionConfirmationPolicy(
    upstream, executionConfirmerAllowlist, runnerImplementationManifest);
  const normalized = stepS.normalizeExecutionConfirmerAllowlist(
    executionConfirmerAllowlist, upstream);
  const unsigned = stepS.buildUnsignedExecutionConfirmation(upstream,
    executionConfirmerAllowlist, verificationPolicy, runnerImplementationManifest,
    normalized.entries[0].fingerprint);
  const executionConfirmation = stepS.sealSignedExecutionConfirmation(unsigned,
    sign(null, stepS.buildExecutionConfirmationSignaturePayload(unsigned),
      OPERATOR_KEYS.privateKey).toString("base64"));
  const inputPacket = { context: { upstream, executionConfirmerAllowlist,
    verificationPolicy, priorExecutionConfirmationNonceHashes: [] },
  executionConfirmation, runnerImplementationManifest, evaluationClockInstant: CLOCK };
  const evaluated = stepS.evaluateRunnerLaunchPackage(inputPacket);
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated.blockingIssues));
  return { inputPacket, oneRunRunnerLaunchPackage: evaluated.oneRunRunnerLaunchPackage,
    runnerLaunchSummary: evaluated.runnerLaunchSummary };
}

function buildObservation(stepSPackage, overrides = {}) {
  const qPacket = stepSPackage.inputPacket.context.upstream.upstream.stepQPacket;
  const pPacket = qPacket.context.upstream.stepPPacket;
  const oPacket = pPacket.context.upstream.stepOPacket;
  return {
    transportClass: subject.TRANSPORT_CLASS,
    observationSequence: [...qPacket.adapterArtifactManifest.operationOrder],
    observationCategories: [...qPacket.adapterArtifactManifest.observationCategoryOrder],
    hashOutputs: Object.fromEntries(oPacket.executorInput.requiredHashPlaceholders
      .map((field) => [field, HASH])),
    timestampOutputs: Object.fromEntries(oPacket.executorInput.requiredTimestampPlaceholders
      .map((field) => [field, CLOCK])),
    destinationCount: 1, observationCount: 1, completedAt: CLOCK,
    sanitizedOnly: true, rawMaterialPresent: false, ...overrides,
  };
}

function buildCapabilities(stepSPackage, options = {}) {
  const calls = [];
  const outcome = (name, fallback) => options[name] || fallback;
  const wrap = (name, fn) => async (...args) => { calls.push(name); return fn(...args); };
  const cap = (name, methods) => ({ descriptor: subject.buildCapabilityDescriptor(name), ...methods });
  const capabilities = {
    runtimeArtifactSource: cap("runtimeArtifactSource", {
      readRunnerArtifactBytes: wrap("readRunnerArtifactBytes", () => ({
        artifactBytes: options.runnerBytes || RUNNER_BYTES,
        artifactId: stepSPackage.inputPacket.runnerImplementationManifest.runnerArtifactId,
        sourceTreeSha256: options.runnerSourceTreeSha256 ||
          stepSPackage.inputPacket.runnerImplementationManifest.runnerSourceTreeSha256,
        capabilityManifestSha256: options.runnerCapabilityManifestSha256 ||
          stepSPackage.inputPacket.runnerImplementationManifest.runnerCapabilityManifestSha256,
      })),
      readAdapterArtifactBytes: wrap("readAdapterArtifactBytes", () => {
        const manifest = stepSPackage.inputPacket.context.upstream.upstream.stepQPacket
          .adapterArtifactManifest;
        return { artifactBytes: options.adapterBytes || ADAPTER_BYTES,
          artifactId: manifest.adapterArtifactId,
          sourceTreeSha256: options.adapterSourceTreeSha256 || manifest.adapterSourceTreeSha256,
          capabilityManifestSha256: options.adapterCapabilityManifestSha256 ||
            manifest.adapterCapabilityManifestSha256 };
      }),
    }),
    runnerArtifactLoader: cap("runnerArtifactLoader", { loadRunner: wrap("loadRunner",
      () => outcome("runnerLoad", { outcome: "loaded", runnerHandleHash: "1".repeat(64) })) }),
    adapterArtifactLoader: cap("adapterArtifactLoader", { loadAdapter: wrap("loadAdapter",
      () => outcome("adapterLoad", { outcome: "loaded", adapterHandleHash: "2".repeat(64) })) }),
    singleUseExecutionLeaseStore: cap("singleUseExecutionLeaseStore", {
      acquireExecutionLease: wrap("acquireExecutionLease", () => outcome("lease",
        { outcome: "acquired", leaseHash: "3".repeat(64) })),
      consumeExecutionConfirmation: wrap("consumeExecutionConfirmation", () => outcome("confirmation",
        { outcome: "consumed" })),
      consumeOperatorAuthorization: wrap("consumeOperatorAuthorization", () => outcome("authorization",
        { outcome: "consumed" })),
      consumeInvocation: wrap("consumeInvocation", () => outcome("invocation", { outcome: "consumed" })),
      finalizeExecutionLease: wrap("finalizeExecutionLease", (value) => outcome("terminal",
        { outcome: "finalized", terminalState: value.terminalState })),
    }),
    atomicClaimStore: cap("atomicClaimStore", { acquireClaim: wrap("acquireClaim",
      () => outcome("claim", { outcome: "acquired", claimReceiptHash: "4".repeat(64) })) }),
    readOnlyObservationTransport: cap("readOnlyObservationTransport", {
      checkKillSwitch: wrap("checkKillSwitch", () => outcome("killSwitch",
        { outcome: "clear", checkedAt: options.clock || CLOCK })),
      invokeReadOnlyObservation: wrap("invokeReadOnlyObservation",
        () => outcome("observation", buildObservation(stepSPackage))),
    }),
    executionReceiptStore: cap("executionReceiptStore", {
      persistSanitizedReceipt: wrap("persistSanitizedReceipt", (receipt) => outcome("receipt",
        { outcome: "persisted", persistedReceiptHash: receipt.sanitizedExecutionReceiptHash })),
    }),
    evidenceFinalizer: cap("evidenceFinalizer", {
      finalizeSanitizedEvidence: wrap("finalizeSanitizedEvidence", (evidence) => outcome("evidence",
        { outcome: "finalized", finalizedEvidenceHash: evidence.sanitizedEvidenceHash })),
    }),
    environmentDisposalCoordinator: cap("environmentDisposalCoordinator", {
      disposeEnvironment: wrap("disposeEnvironment", () => outcome("disposal",
        { outcome: "completed", disposalReceiptHash: "5".repeat(64) })),
    }),
    executionClock: cap("executionClock", { now: wrap("now", () => options.clock || CLOCK) }),
  };
  return { capabilities, calls };
}

let cachedStepSPackage;
function buildFixture(options = {}) {
  if (!cachedStepSPackage) cachedStepSPackage = deepFreeze(buildStepSPackage());
  const stepSPackage = options.stepSPackage || cachedStepSPackage;
  const { capabilities, calls } = buildCapabilities(stepSPackage, options);
  return { packet: { stepSPackage, runtimeCapabilities: capabilities,
    executionClockInstant: options.clock || CLOCK }, calls, stepSPackage };
}

module.exports = { ADAPTER_BYTES, CLOCK, RUNNER_BYTES, buildCapabilities,
  buildFixture, buildObservation, buildStepSPackage, clone };
