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
  const outcome = (name, fallback, ...args) => {
    const selected = Object.prototype.hasOwnProperty.call(options, name)
      ? options[name] : fallback;
    return typeof selected === "function" ? selected(...args) : selected;
  };
  const wrap = (name, fn) => async (...args) => {
    calls.push(name);
    const context = args.at(-1);
    if (Array.isArray(options.operationContexts) && context &&
        typeof context.operationId === "string" &&
        typeof context.idempotencyKey === "string") {
      options.operationContexts.push({ name, operationId: context.operationId,
        idempotencyKey: context.idempotencyKey });
    }
    return fn(...args);
  };
  const cap = (name, methods) => ({ descriptor: subject.buildCapabilityDescriptor(name), ...methods });
  const reconcile = (callName, optionName, fallback = {
    outcome: "aborted", acknowledgment: "aborted", resourceHash: null,
  }) => wrap(callName, (...args) => outcome(optionName, fallback, ...args));
  const clockSequence = Array.isArray(options.clockSequence)
    ? [...options.clockSequence] : null;
  let clockIndex = 0;
  const currentClock = () => clockSequence
    ? clockSequence[Math.min(clockIndex++, clockSequence.length - 1)]
    : (options.clock || CLOCK);
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
      reconcileOperationOutcome: reconcile("reconcileRuntimeArtifactSource",
        "runtimeArtifactReconciliation"),
    }),
    runnerArtifactLoader: cap("runnerArtifactLoader", { loadRunner: wrap("loadRunner",
      (...args) => outcome("runnerLoad", { outcome: "loaded", runnerHandleHash: "1".repeat(64) },
        ...args)),
      reconcileOperationOutcome: reconcile("reconcileRunnerArtifactLoader",
        "runnerLoaderReconciliation") }),
    adapterArtifactLoader: cap("adapterArtifactLoader", { loadAdapter: wrap("loadAdapter",
      (...args) => outcome("adapterLoad", { outcome: "loaded", adapterHandleHash: "2".repeat(64) },
        ...args)),
      reconcileOperationOutcome: reconcile("reconcileAdapterArtifactLoader",
        "adapterLoaderReconciliation") }),
    singleUseExecutionLeaseStore: cap("singleUseExecutionLeaseStore", {
      acquireExecutionLease: wrap("acquireExecutionLease", (...args) => outcome("lease",
        { outcome: "acquired", leaseHash: "3".repeat(64) }, ...args)),
      consumeExecutionConfirmation: wrap("consumeExecutionConfirmation", (...args) => outcome("confirmation",
        { outcome: "consumed" }, ...args)),
      consumeOperatorAuthorization: wrap("consumeOperatorAuthorization", (...args) => outcome("authorization",
        { outcome: "consumed" }, ...args)),
      consumeInvocation: wrap("consumeInvocation", (...args) => outcome("invocation",
        { outcome: "consumed" }, ...args)),
      finalizeExecutionLease: wrap("finalizeExecutionLease", (value, context) => outcome("terminal",
        { outcome: "finalized", terminalState: value.terminalState }, value, context)),
      reconcileOperationOutcome: reconcile("reconcileExecutionLeaseStore",
        "leaseStoreReconciliation"),
    }),
    atomicClaimStore: cap("atomicClaimStore", { acquireClaim: wrap("acquireClaim",
      (...args) => outcome("claim", { outcome: "acquired", claimReceiptHash: "4".repeat(64) },
        ...args)),
      reconcileOperationOutcome: reconcile("reconcileAtomicClaimStore",
        "claimReconciliation") }),
    readOnlyObservationTransport: cap("readOnlyObservationTransport", {
      checkKillSwitch: wrap("checkKillSwitch", (...args) => outcome("killSwitch",
        { outcome: "clear", checkedAt: options.clock || CLOCK }, ...args)),
      invokeReadOnlyObservation: wrap("invokeReadOnlyObservation",
        (...args) => outcome("observation", buildObservation(stepSPackage), ...args)),
      reconcileOperationOutcome: reconcile("reconcileObservationTransport",
        "observationReconciliation"),
    }),
    executionReceiptStore: cap("executionReceiptStore", {
      persistSanitizedReceipt: wrap("persistSanitizedReceipt", (receipt, context) => outcome("receipt",
        { outcome: "persisted", persistedReceiptHash: receipt.sanitizedExecutionReceiptHash },
      receipt, context)),
      reconcileOperationOutcome: reconcile("reconcileExecutionReceiptStore",
        "receiptReconciliation"),
    }),
    evidenceFinalizer: cap("evidenceFinalizer", {
      finalizeSanitizedEvidence: wrap("finalizeSanitizedEvidence", (evidence, context) => outcome("evidence",
        { outcome: "finalized", finalizedEvidenceHash: evidence.sanitizedEvidenceHash },
      evidence, context)),
      reconcileOperationOutcome: reconcile("reconcileEvidenceFinalizer",
        "evidenceReconciliation"),
    }),
    environmentDisposalCoordinator: cap("environmentDisposalCoordinator", {
      disposeEnvironment: wrap("disposeEnvironment", (...args) => outcome("disposal",
        { outcome: "completed", disposalReceiptHash: "5".repeat(64) }, ...args)),
      reconcileOperationOutcome: reconcile("reconcileEnvironmentDisposal",
        "disposalReconciliation"),
    }),
    executionClock: cap("executionClock", {
      now: wrap("now", () => currentClock()),
      reconcileOperationOutcome: reconcile("reconcileExecutionClock",
        "clockReconciliation"),
    }),
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
