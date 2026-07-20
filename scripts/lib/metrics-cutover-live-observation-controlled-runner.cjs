"use strict";

const { createHash } = require("node:crypto");
const stepS = require("./metrics-cutover-live-observation-runner-launch-package.cjs");

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_controlled_live_observation_execution",
  "controlled_live_observation_execution_completed",
  "blocked",
]);
const RUNTIME_SEQUENCE = Object.freeze([
  "step_s_package_revalidated",
  "runtime_capabilities_validated",
  "runner_artifact_bytes_read",
  "runner_artifact_digest_verified",
  "adapter_artifact_bytes_read",
  "adapter_artifact_digest_verified",
  "runtime_dependencies_bound",
  "single_use_execution_lease_acquired",
  "single_use_claim_acquired",
  "execution_confirmation_consumed",
  "operator_authorization_consumed",
  "invocation_consumed",
  "runner_loaded",
  "adapter_loaded",
  "read_only_observation_invoked_once",
  "sanitized_observation_validated",
  "sanitized_execution_receipt_persisted",
  "sanitized_evidence_finalized",
  "environment_disposal_completed",
  "controlled_live_observation_execution_completed",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_runtime_binding", "blocked_before_lease",
  "blocked_before_observation", "blocked_after_observation", "disposal_uncertain",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "automaticRetryAllowed", "fallbackAllowed", "duplicateInvocationAllowed",
  "providerDiscoveryAllowed", "providerCallsAllowed", "networkAccessAllowed",
  "databaseConnectionAllowed", "sqlExecutionAllowed", "ddlAllowed", "dmlAllowed",
  "migrationAllowed", "scenarioExecutionAllowed", "productionAccessAllowed",
  "sharedEnvironmentAccessAllowed", "credentialEchoAllowed", "rawMaterialPresent",
  "runtimeRouteAdded", "cronAdded", "workerAdded", "deploymentWorkflowChanged",
]);
const CAPABILITY_SPECS = Object.freeze({
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
const CAPABILITY_NAMES = Object.freeze(Object.keys(CAPABILITY_SPECS));
const CAPABILITY_MUTABILITY_POLICIES = Object.freeze({
  runtimeArtifactSource: "immutable_artifact_read_only",
  runnerArtifactLoader: "immutable_runtime_load_only",
  adapterArtifactLoader: "immutable_runtime_load_only",
  singleUseExecutionLeaseStore: "exact_atomic_namespace_mutation_only",
  atomicClaimStore: "exact_atomic_namespace_mutation_only",
  readOnlyObservationTransport: "external_target_read_only",
  executionReceiptStore: "sanitized_named_namespace_persistence_only",
  evidenceFinalizer: "sanitized_named_namespace_persistence_only",
  environmentDisposalCoordinator: "bound_disposable_environment_mutation_only",
  executionClock: "no_mutation",
});
const TRANSPORT_CLASS = "disposable_environment_read_only_observer";
const VERSION = "finple.step114-2x-t.controlled-runner.v1";
const directStepSValidationCache = new WeakMap();
const CAPABILITY_TIMEOUT = Symbol("capability_timeout");

class RunnerFailure {
  constructor(issueCode, details = {}) {
    this.issueCode = issueCode;
    this.operationId = details.operationId || null;
    this.terminalOutcome = details.terminalOutcome || null;
    this.acknowledgment = details.acknowledgment || null;
    this.resourceHash = details.resourceHash || null;
  }
}
function fail(issueCode) { throw new RunnerFailure(issueCode); }
function deriveOperationIdentity(seed, stage, sequence) {
  const digest = hashContract("FINPLE_STEP114_2X_T_RUNTIME_OPERATION\0",
    { seed, stage, sequence });
  return { operationId: `step114-2x-t-operation-${digest}`,
    idempotencyKey: digest };
}
function computeCapabilityDeadline(capability, currentClockInstant, effectiveExpiry) {
  const current = parseInstant(currentClockInstant);
  const expiry = parseInstant(effectiveExpiry);
  const declared = capability?.descriptor?.hardTimeoutMilliseconds;
  if (current === null || expiry === null || !Number.isInteger(declared) ||
      declared <= 0 || current >= expiry) return null;
  const duration = Math.min(declared, expiry - current);
  return { deadline: new Date(current + duration).toISOString(),
    timeoutMilliseconds: duration };
}
function validateReconciliation(value) {
  return exactKeys(value, ["outcome", "acknowledgment", "resourceHash"]) &&
    ["aborted", "not_committed", "committed", "ambiguous"].includes(value.outcome) &&
    ["aborted", "settled"].includes(value.acknowledgment) &&
    (value.outcome === "committed" ? isSha(value.resourceHash) :
      (value.outcome === "ambiguous"
        ? (value.resourceHash === null || isSha(value.resourceHash))
        : value.resourceHash === null));
}
async function reconcileTimedOutOperation(capability, operationContext, timing, stage) {
  const reconciliationAbortController = new AbortController();
  const reconciliationContext = { ...operationContext,
    abortSignal: reconciliationAbortController.signal };
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => capability.reconcileOperationOutcome(
        { operationId: operationContext.operationId,
          idempotencyKey: operationContext.idempotencyKey },
        reconciliationContext)),
      new Promise((unused, reject) => {
        timer = setTimeout(() => reject(CAPABILITY_TIMEOUT),
          timing.timeoutMilliseconds);
      }),
    ]);
  } catch {
    reconciliationAbortController.abort("reconciliation_deadline_exceeded");
    throw new RunnerFailure(`${stage}_timeout_ambiguous`, {
      operationId: operationContext.operationId,
      terminalOutcome: "ambiguous",
    });
  } finally { clearTimeout(timer); }
}
async function callCapability(capability, method, args, stage, timingContext) {
  const timing = computeCapabilityDeadline(capability,
    timingContext.currentClockInstant, timingContext.effectiveExpiry);
  if (!timing) fail(`${stage}_deadline_expired`);
  const identity = deriveOperationIdentity(timingContext.operationSeed,
    stage, timingContext.operationSequence);
  const abortController = new AbortController();
  const operationContext = { ...identity, deadline: timing.deadline,
    abortSignal: abortController.signal };
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => capability[method](...args, operationContext)),
      new Promise((unused, reject) => {
        timer = setTimeout(() => reject(CAPABILITY_TIMEOUT), timing.timeoutMilliseconds);
      }),
    ]);
  } catch (error) {
    if (error !== CAPABILITY_TIMEOUT) {
      throw new RunnerFailure(`${stage}_failed`, { operationId: identity.operationId });
    }
    abortController.abort("capability_deadline_exceeded");
    let reconciled;
    try {
      reconciled = await reconcileTimedOutOperation(capability, operationContext,
        timing, stage);
    } catch (reconciliationFailure) { throw reconciliationFailure; }
    if (!validateReconciliation(reconciled)) {
      throw new RunnerFailure(`${stage}_timeout_ambiguous`, {
        operationId: identity.operationId, terminalOutcome: "ambiguous" });
    }
    throw new RunnerFailure(`${stage}_timeout_${reconciled.outcome}`, {
      operationId: identity.operationId,
      terminalOutcome: reconciled.outcome,
      acknowledgment: reconciled.acknowledgment,
      resourceHash: reconciled.resourceHash,
    });
  } finally {
    clearTimeout(timer);
  }
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}
function canonicalEqual(left, right) { return canonicalJson(left) === canonicalJson(right); }
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
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
function orderedKeys(value, keys) {
  return isRecord(value) && canonicalEqual(Object.keys(value), keys);
}
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function parseInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value ? ms : null;
}
function buildMutabilityPolicy(capabilityName) {
  const mode = CAPABILITY_MUTABILITY_POLICIES[capabilityName];
  return {
    mode,
    externalTargetReadOnly: mode === "external_target_read_only",
    atomicNamespaceMutationOnly: mode === "exact_atomic_namespace_mutation_only",
    sanitizedNamedNamespacePersistenceOnly:
      mode === "sanitized_named_namespace_persistence_only",
    boundDisposableEnvironmentMutationOnly:
      mode === "bound_disposable_environment_mutation_only",
    productionMutationAllowed: false,
    providerMutationAllowed: false,
    unboundedMutationAllowed: false,
  };
}
function nested(stepSPacket) {
  const stepRPacket = stepSPacket.inputPacket.context.upstream;
  const qPacket = stepRPacket.upstream.stepQPacket;
  const pPacket = qPacket.context.upstream.stepPPacket;
  const oPacket = pPacket.context.upstream.stepOPacket;
  const nPacket = oPacket.context.upstream.stepNPacket;
  return { stepRPacket, qPacket, pPacket, oPacket, nPacket };
}
function safeResult(status, overrides = {}) {
  const completed = status === PUBLIC_STATES[1];
  return {
    ok: completed,
    status,
    contractVersion: VERSION,
    failureClassification: completed ? null : (overrides.failureClassification || null),
    executionTerminalState: completed ? "completed" :
      (overrides.executionTerminalState || null),
    blockingIssues: overrides.blockingIssues || [],
    manualReviewRequired: status === "blocked",
    runtimeStateSequence: overrides.runtimeStateSequence || [],
    capabilityInvocationCounts: overrides.capabilityInvocationCounts || {},
    adapterInvocationCount: overrides.adapterInvocationCount || 0,
    disposalAttempted: overrides.disposalAttempted || false,
    disposalCompleted: overrides.disposalCompleted || false,
    sanitizedExecutionReceipt: overrides.sanitizedExecutionReceipt || {},
    sanitizedEvidence: overrides.sanitizedEvidence || {},
    sanitizedExecutionClosureReceipt: overrides.sanitizedExecutionClosureReceipt || {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  };
}

function validateDirectStepSPackage(value) {
  if (isRecord(value) && Object.isFrozen(value) && directStepSValidationCache.has(value)) {
    return [...directStepSValidationCache.get(value)];
  }
  if (!exactKeys(value, ["inputPacket", "oneRunRunnerLaunchPackage", "runnerLaunchSummary"])) {
    return ["step_s_package_fields_invalid"];
  }
  const packet = value.inputPacket;
  if (!exactKeys(packet, ["context", "executionConfirmation", "runnerImplementationManifest",
    "evaluationClockInstant"])) return ["step_s_input_packet_fields_invalid"];
  const context = packet.context;
  const issues = [];
  try {
    issues.push(...stepS.validateDirectStepRPackage(context.upstream));
    issues.push(...stepS.validateExecutionConfirmationContext(context, packet.runnerImplementationManifest));
    issues.push(...stepS.validateRunnerImplementationManifest(packet.runnerImplementationManifest,
      context.upstream));
    const normalized = stepS.normalizeExecutionConfirmerAllowlist(
      context.executionConfirmerAllowlist, context.upstream);
    issues.push(...normalized.issues);
    issues.push(...stepS.validateExecutionConfirmationPolicy(context.verificationPolicy,
      context.upstream, context.executionConfirmerAllowlist, packet.runnerImplementationManifest));
    issues.push(...stepS.validateExecutionConfirmationShape(packet.executionConfirmation,
      context.upstream, context.executionConfirmerAllowlist, context.verificationPolicy,
      packet.runnerImplementationManifest));
    issues.push(...stepS.validateSignedExecutionConfirmation(packet.executionConfirmation,
      context, packet.runnerImplementationManifest, packet.evaluationClockInstant));
    issues.push(...stepS.validateOneRunRunnerLaunchPackage(value.oneRunRunnerLaunchPackage,
      context.upstream, packet.executionConfirmation, context.executionConfirmerAllowlist,
      context.verificationPolicy, packet.runnerImplementationManifest,
      packet.evaluationClockInstant, context.priorExecutionConfirmationNonceHashes));
    issues.push(...stepS.validateSummary(value.runnerLaunchSummary, context.upstream,
      packet.executionConfirmation, context.executionConfirmerAllowlist,
      context.verificationPolicy, packet.runnerImplementationManifest,
      value.oneRunRunnerLaunchPackage));
    const evaluated = stepS.evaluateRunnerLaunchPackage(packet);
    if (!evaluated.ok) issues.push(...evaluated.blockingIssues.map((issue) => `step_s:${issue}`));
    if (!canonicalEqual(evaluated.oneRunRunnerLaunchPackage,
      value.oneRunRunnerLaunchPackage)) issues.push("step_s_launch_canonical_mismatch");
    if (!canonicalEqual(evaluated.runnerLaunchSummary, value.runnerLaunchSummary)) {
      issues.push("step_s_summary_canonical_mismatch");
    }
  } catch { issues.push("step_s_direct_revalidation_failed"); }
  const result = [...new Set(issues)].sort();
  if (Object.isFrozen(value)) directStepSValidationCache.set(value, result);
  return [...result];
}

function validateCapabilityBundle(value) {
  if (!exactKeys(value, CAPABILITY_NAMES)) return ["runtime_capability_bundle_fields_invalid"];
  const issues = [];
  for (const [name, methods] of Object.entries(CAPABILITY_SPECS)) {
    const capability = value[name];
    if (!isRecord(capability) || !exactKeys(capability, ["descriptor", ...methods])) {
      issues.push(`runtime_capability_fields_invalid:${name}`); continue;
    }
    const descriptor = capability.descriptor;
    const descriptorKeys = ["capabilityName", "capabilityClass", "contractVersion",
      "methodNames", "maximumInvocationCount", "hardTimeoutMilliseconds",
      "cooperativeCancellationRequired", "deadlineEnforcementRequired",
      "postTimeoutOutcomeReconciliationRequired", "lateCompletionForbidden",
      "lateOutcomePolicy", "terminalOutcomes", "invocationContextFields",
      "automaticRetryAllowed", "fallbackAllowed", "externalDiscoveryAllowed",
      "productionAccessAllowed", "maximumDestinationCount",
      "maximumObservationCount", "mutabilityPolicy", "sanitizationPolicy",
      "descriptorHash"];
    if (!exactKeys(descriptor, descriptorKeys)) {
      issues.push(`runtime_capability_descriptor_fields_invalid:${name}`); continue;
    }
    const body = { ...descriptor }; delete body.descriptorHash;
    if (descriptor.capabilityName !== name ||
        descriptor.capabilityClass !== `finple_step114_2x_t_${name}` ||
        descriptor.contractVersion !== VERSION ||
        !canonicalEqual(descriptor.methodNames, methods) ||
        descriptor.maximumInvocationCount !== methods.length ||
        descriptor.hardTimeoutMilliseconds !== 5000 ||
        descriptor.cooperativeCancellationRequired !== true ||
        descriptor.deadlineEnforcementRequired !== true ||
        descriptor.postTimeoutOutcomeReconciliationRequired !== true ||
        descriptor.lateCompletionForbidden !== false ||
        descriptor.lateOutcomePolicy !==
          "read_only_terminal_outcome_reconciliation_required" ||
        !canonicalEqual(descriptor.terminalOutcomes,
          ["aborted", "not_committed", "committed", "ambiguous"]) ||
        !canonicalEqual(descriptor.invocationContextFields,
          ["operationId", "idempotencyKey", "deadline", "abortSignal"]) ||
        descriptor.automaticRetryAllowed !== false ||
        descriptor.fallbackAllowed !== false || descriptor.externalDiscoveryAllowed !== false ||
        descriptor.productionAccessAllowed !== false ||
        descriptor.maximumDestinationCount !==
          (name === "readOnlyObservationTransport" ? 1 : 0) ||
        descriptor.maximumObservationCount !==
          (name === "readOnlyObservationTransport" ? 1 : 0) ||
        !canonicalEqual(descriptor.mutabilityPolicy, buildMutabilityPolicy(name)) ||
        !canonicalEqual(descriptor.sanitizationPolicy, {
          sanitizedOutputOnly: true, rawMaterialForbidden: true,
          credentialEchoForbidden: true, persistenceOutsideNamedStoreForbidden: true,
        }) ||
        descriptor.descriptorHash !== hashContract("FINPLE_STEP114_2X_T_CAPABILITY_DESCRIPTOR\0", body)) {
      issues.push(`runtime_capability_descriptor_invalid:${name}`);
    }
    for (const method of methods) if (typeof capability[method] !== "function") {
      issues.push(`runtime_capability_method_invalid:${name}.${method}`);
    }
  }
  return [...new Set(issues)].sort();
}

function validateSanitizedObservation(value, stepSPackage, clockInstant) {
  const keys = ["transportClass", "observationSequence", "observationCategories",
    "hashOutputs", "timestampOutputs", "destinationCount", "observationCount",
    "completedAt", "sanitizedOnly", "rawMaterialPresent"];
  if (!exactKeys(value, keys)) return ["sanitized_observation_fields_invalid"];
  const { qPacket, oPacket } = nested(stepSPackage);
  const manifest = qPacket.adapterArtifactManifest;
  const hashFields = oPacket.executorInput.requiredHashPlaceholders;
  const timeFields = oPacket.executorInput.requiredTimestampPlaceholders;
  const issues = [];
  if (value.transportClass !== TRANSPORT_CLASS ||
      !canonicalEqual(value.observationSequence, manifest.operationOrder) ||
      !canonicalEqual(value.observationCategories, manifest.observationCategoryOrder)) {
    issues.push("sanitized_observation_order_invalid");
  }
  if (!orderedKeys(value.hashOutputs, hashFields) ||
      Object.values(value.hashOutputs || {}).some((item) => !isSha(item))) {
    issues.push("sanitized_observation_hash_outputs_invalid");
  }
  if (!orderedKeys(value.timestampOutputs, timeFields) ||
      Object.values(value.timestampOutputs || {}).some((item) => parseInstant(item) === null)) {
    issues.push("sanitized_observation_timestamp_outputs_invalid");
  }
  const completed = parseInstant(value.completedAt);
  const starts = parseInstant(oPacket.executorInput.observationWindowStartsAt);
  const expires = parseInstant(oPacket.executorInput.observationWindowExpiresAt);
  const clock = parseInstant(clockInstant);
  if ([completed, starts, expires, clock].includes(null) || completed < starts ||
      completed > clock || completed >= expires) issues.push("sanitized_observation_chronology_invalid");
  if (value.destinationCount !== 1 || value.observationCount !== 1 ||
      value.sanitizedOnly !== true || value.rawMaterialPresent !== false) {
    issues.push("sanitized_observation_boundary_invalid");
  }
  return [...new Set(issues)].sort();
}

function makePreDisposalReceipt(stepSPackage, observation, clockInstant,
  executionLeaseHash, claimReceiptHash) {
  const { stepRPacket, qPacket, oPacket, nPacket } = nested(stepSPackage);
  const launch = stepSPackage.oneRunRunnerLaunchPackage;
  const body = {
    contractVersion: "finple.step114-2x-t.sanitized-receipt.v1",
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    executionConfirmationId: launch.executionConfirmationId,
    executionConfirmationHash: launch.executionConfirmationHash,
    operatorAuthorizationId: qPacket.operatorAuthorization.operatorAuthorizationId,
    operatorAuthorizationHash: qPacket.operatorAuthorization.operatorAuthorizationHash,
    invocationId: nPacket.invocation.invocationId,
    invocationHash: nPacket.invocation.invocationHash,
    claimKeyHash: oPacket.executorInput.claimKeyHash,
    runtimePreconditionManifestId: stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestId,
    runtimePreconditionManifestHash: stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestHash,
    observationDigest: hashContract("FINPLE_STEP114_2X_T_SANITIZED_OBSERVATION\0", observation),
    completedAt: clockInstant,
    executionLeaseHash, claimReceiptHash,
    runnerArtifactDigestVerified: true, adapterArtifactDigestVerified: true,
    runtimeStateTrace: RUNTIME_SEQUENCE.slice(0, 17),
    runtimeStateTraceHash: hashContract("FINPLE_STEP114_2X_T_RUNTIME_TRACE\0",
      RUNTIME_SEQUENCE.slice(0, 17)),
    executionStartedAt: stepSPackage.inputPacket.evaluationClockInstant,
    executionEndedAt: clockInstant,
    effectiveExpiry: launch.earliestExpiry,
    adapterInvocationCount: 1,
    receiptPhase: "pre_disposal_candidate",
    disposalCompletionRequired: true,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_T_RECEIPT_ID\0", body);
  const withId = { ...body, sanitizedExecutionReceiptId: `step114-2x-t-receipt-${idHash}` };
  return { ...withId,
    sanitizedExecutionReceiptHash: hashContract("FINPLE_STEP114_2X_T_RECEIPT_HASH\0", withId) };
}
function makeEvidence(stepSPackage, receipt, clockInstant) {
  const body = {
    contractVersion: "finple.step114-2x-t.sanitized-evidence.v1",
    oneRunRunnerLaunchPackageId: stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
    sanitizedExecutionReceiptId: receipt.sanitizedExecutionReceiptId,
    sanitizedExecutionReceiptHash: receipt.sanitizedExecutionReceiptHash,
    runtimeStateSequence: RUNTIME_SEQUENCE.slice(0, 18),
    finalizedAt: clockInstant,
    disposalRequired: true,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_T_EVIDENCE_ID\0", body);
  const withId = { ...body, sanitizedEvidenceId: `step114-2x-t-evidence-${idHash}` };
  return { ...withId, sanitizedEvidenceHash:
    hashContract("FINPLE_STEP114_2X_T_EVIDENCE_HASH\0", withId) };
}
function makeExecutionClosureReceipt(stepSPackage, receipt, evidence,
  disposalReceiptHash, leaseTerminalState, completeTrace, clockInstant) {
  const body = {
    contractVersion: "finple.step114-2x-t.execution-closure-receipt.v1",
    oneRunRunnerLaunchPackageId:
      stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash:
      stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
    sanitizedExecutionReceiptId: receipt.sanitizedExecutionReceiptId,
    sanitizedExecutionReceiptHash: receipt.sanitizedExecutionReceiptHash,
    sanitizedEvidenceId: evidence.sanitizedEvidenceId,
    sanitizedEvidenceHash: evidence.sanitizedEvidenceHash,
    disposalStatus: "completed",
    disposalReceiptHash,
    leaseTerminalState,
    runtimeStateTrace: [...completeTrace],
    runtimeStateTraceHash: hashContract(
      "FINPLE_STEP114_2X_T_COMPLETE_RUNTIME_TRACE\0", completeTrace),
    adapterInvocationCount: 1,
    completedAt: clockInstant,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_T_EXECUTION_CLOSURE_ID\0", body);
  const withId = { ...body,
    executionClosureReceiptId: `step114-2x-t-closure-${idHash}` };
  return { ...withId, executionClosureReceiptHash:
    hashContract("FINPLE_STEP114_2X_T_EXECUTION_CLOSURE_HASH\0", withId) };
}

async function runControlledLiveObservation(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  const counts = Object.fromEntries(CAPABILITY_NAMES.map((name) => [name, 0]));
  const trace = [];
  let bound = false; let leaseAcquired = false; let observationInvoked = false;
  let observationAbortAcknowledged = false;
  let leaseHash = null; let claimReceiptHash = null;
  let disposalReceiptHash = null;
  let disposalAttempted = false; let disposalCompleted = false;
  let receipt = {}; let evidence = {}; let closureReceipt = {};
  let executionTerminalState = null;
  let disposalIssue = null;
  const block = (classification, issue) => safeResult("blocked", {
    failureClassification: classification, blockingIssues: [issue],
    runtimeStateSequence: [...trace], capabilityInvocationCounts: { ...counts },
    executionTerminalState: executionTerminalState ||
      (classification === "disposal_uncertain" ? "disposal_uncertain" :
        (observationInvoked ? "failed_after_invocation" : "failed_before_invocation")),
    adapterInvocationCount: observationInvoked ? 1 : 0,
    disposalAttempted, disposalCompleted, sanitizedExecutionReceipt: receipt,
    sanitizedEvidence: evidence, sanitizedExecutionClosureReceipt: closureReceipt,
  });
  if (!exactKeys(packet, ["stepSPackage", "runtimeCapabilities", "executionClockInstant"])) {
    return block("blocked_before_runtime_binding", "controlled_runner_packet_fields_invalid");
  }
  const stepSIssues = validateDirectStepSPackage(packet.stepSPackage);
  if (stepSIssues.length) return safeResult("blocked", {
    failureClassification: "blocked_before_runtime_binding", blockingIssues: stepSIssues,
    capabilityInvocationCounts: counts,
  });
  trace.push(RUNTIME_SEQUENCE[0]);
  const capabilityIssues = validateCapabilityBundle(packet.runtimeCapabilities);
  if (capabilityIssues.length) return block("blocked_before_runtime_binding", capabilityIssues[0]);
  trace.push(RUNTIME_SEQUENCE[1]);
  const caps = packet.runtimeCapabilities;
  const effectiveExpiry = packet.stepSPackage.oneRunRunnerLaunchPackage.earliestExpiry;
  let currentClockInstant = packet.executionClockInstant;
  let operationSequence = 0;
  const operationSeed = packet.stepSPackage.oneRunRunnerLaunchPackage
    .oneRunRunnerLaunchPackageHash;
  const invoke = async (capabilityName, method, args, stage) => {
    counts[capabilityName]++;
    return callCapability(caps[capabilityName], method, args, stage, {
      currentClockInstant, effectiveExpiry, operationSeed,
      operationSequence: ++operationSequence,
    });
  };
  const refreshExecutionClock = async (stage) => {
    const observedClock = await invoke("executionClock", "now", [], stage);
    if (parseInstant(observedClock) === null ||
        parseInstant(observedClock) < parseInstant(currentClockInstant) ||
        parseInstant(observedClock) >= parseInstant(effectiveExpiry)) {
      fail(`${stage}_effective_expiry_reached`);
    }
    currentClockInstant = observedClock;
  };
  let primaryIssue = null; let classification = "blocked_before_lease";
  try {
    if (parseInstant(packet.executionClockInstant) === null ||
        parseInstant(packet.executionClockInstant) >= parseInstant(effectiveExpiry)) {
      return block("blocked_before_runtime_binding", "controlled_runner_execution_clock_invalid");
    }
    const now = await invoke("executionClock", "now", [], "execution_clock");
    if (now !== packet.executionClockInstant || parseInstant(now) === null) {
      return block("blocked_before_runtime_binding", "controlled_runner_execution_clock_invalid");
    }
    const runnerArtifact = await invoke("runtimeArtifactSource",
      "readRunnerArtifactBytes", [], "runner_artifact_read");
    trace.push(RUNTIME_SEQUENCE[2]);
    const runnerManifest = packet.stepSPackage.inputPacket.runnerImplementationManifest;
    if (!isRecord(runnerArtifact) || !exactKeys(runnerArtifact, ["artifactBytes",
      "artifactId", "sourceTreeSha256", "capabilityManifestSha256"]) ||
      !Buffer.isBuffer(runnerArtifact.artifactBytes) ||
      runnerArtifact.artifactId !== runnerManifest.runnerArtifactId ||
      sha256(runnerArtifact.artifactBytes) !== runnerManifest.runnerArtifactSha256 ||
      runnerArtifact.sourceTreeSha256 !== runnerManifest.runnerSourceTreeSha256 ||
      runnerArtifact.capabilityManifestSha256 !== runnerManifest.runnerCapabilityManifestSha256) {
      return block("blocked_before_runtime_binding", "runner_artifact_digest_mismatch");
    }
    trace.push(RUNTIME_SEQUENCE[3]);
    const adapterArtifact = await invoke("runtimeArtifactSource",
      "readAdapterArtifactBytes", [], "adapter_artifact_read");
    trace.push(RUNTIME_SEQUENCE[4]);
    const { qPacket, oPacket, nPacket } = nested(packet.stepSPackage);
    const adapterManifest = qPacket.adapterArtifactManifest;
    if (!isRecord(adapterArtifact) || !exactKeys(adapterArtifact, ["artifactBytes",
      "artifactId", "sourceTreeSha256", "capabilityManifestSha256"]) ||
      !Buffer.isBuffer(adapterArtifact.artifactBytes) ||
      adapterArtifact.artifactId !== adapterManifest.adapterArtifactId ||
      sha256(adapterArtifact.artifactBytes) !== adapterManifest.adapterArtifactSha256 ||
      adapterArtifact.sourceTreeSha256 !== adapterManifest.adapterSourceTreeSha256 ||
      adapterArtifact.capabilityManifestSha256 !==
        adapterManifest.adapterCapabilityManifestSha256) {
      return block("blocked_before_runtime_binding", "adapter_artifact_digest_mismatch");
    }
    trace.push(RUNTIME_SEQUENCE[5], RUNTIME_SEQUENCE[6]); bound = true;
    await refreshExecutionClock("pre_execution_lease_clock");
    let lease;
    try {
      lease = await invoke("singleUseExecutionLeaseStore", "acquireExecutionLease", [{
      launchPackageId: packet.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageId,
      launchPackageHash: packet.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
      executionConfirmationId: packet.stepSPackage.inputPacket.executionConfirmation.executionConfirmationId,
      executionConfirmationHash: packet.stepSPackage.inputPacket.executionConfirmation.executionConfirmationHash,
      executionConfirmationNonceHash:
        packet.stepSPackage.inputPacket.executionConfirmation.executionConfirmationNonceHash,
      operatorAuthorizationId: qPacket.operatorAuthorization.operatorAuthorizationId,
      operatorAuthorizationHash: qPacket.operatorAuthorization.operatorAuthorizationHash,
      operatorAuthorizationNonceHash: qPacket.operatorAuthorization.operatorAuthorizationNonceHash,
      invocationId: nPacket.invocation.invocationId,
      invocationHash: nPacket.invocation.invocationHash,
      invocationNonceHash: nPacket.invocation.invocationNonceHash,
      claimKeyHash: oPacket.executorInput.claimKeyHash,
      claimNonceHash: oPacket.executorInput.claimNonceHash,
      expiresAt: packet.stepSPackage.oneRunRunnerLaunchPackage.earliestExpiry,
      destinationCount: 1, observationCount: 1,
      }], "execution_lease_acquisition");
    } catch (error) {
      if (error instanceof RunnerFailure && error.terminalOutcome === "committed" &&
          isSha(error.resourceHash)) {
        leaseAcquired = true;
        leaseHash = error.resourceHash;
      }
      throw error;
    }
    if (!exactKeys(lease, ["outcome", "leaseHash"]) || lease.outcome !== "acquired" ||
        !isSha(lease.leaseHash)) fail("single_use_execution_lease_not_acquired");
    leaseAcquired = true; leaseHash = lease.leaseHash;
    trace.push(RUNTIME_SEQUENCE[7]); classification = "blocked_before_observation";
    await refreshExecutionClock("pre_claim_clock");
    const claim = await invoke("atomicClaimStore", "acquireClaim", [{
      claimKeyHash: oPacket.executorInput.claimKeyHash,
      claimNonceHash: oPacket.executorInput.claimNonceHash,
      expiresAt: packet.stepSPackage.oneRunRunnerLaunchPackage.earliestExpiry,
      }], "claim_acquisition");
    if (!exactKeys(claim, ["outcome", "claimReceiptHash"]) || claim.outcome !== "acquired" ||
        !isSha(claim.claimReceiptHash)) fail("single_use_claim_not_acquired");
    claimReceiptHash = claim.claimReceiptHash;
    trace.push(RUNTIME_SEQUENCE[8]);
    for (const [method, state, item] of [
      ["consumeExecutionConfirmation", RUNTIME_SEQUENCE[9], packet.stepSPackage.inputPacket.executionConfirmation],
      ["consumeOperatorAuthorization", RUNTIME_SEQUENCE[10], qPacket.operatorAuthorization],
      ["consumeInvocation", RUNTIME_SEQUENCE[11], nPacket.invocation],
    ]) {
      const stage = method === "consumeExecutionConfirmation"
        ? "execution_confirmation_consumption"
        : method === "consumeOperatorAuthorization"
          ? "operator_authorization_consumption" : "invocation_consumption";
      const consumed = await invoke("singleUseExecutionLeaseStore", method, [{
        id: item.executionConfirmationId || item.operatorAuthorizationId || item.invocationId,
        hash: item.executionConfirmationHash || item.operatorAuthorizationHash || item.invocationHash,
        leaseHash: lease.leaseHash,
      }], stage);
      if (!exactKeys(consumed, ["outcome"]) || consumed.outcome !== "consumed") {
        fail(`${stage}_not_consumed`);
      }
      trace.push(state);
    }
    const runner = await invoke("runnerArtifactLoader", "loadRunner",
      [runnerArtifact.artifactBytes], "runner_load");
    if (!exactKeys(runner, ["outcome", "runnerHandleHash"]) || runner.outcome !== "loaded" ||
        !isSha(runner.runnerHandleHash)) fail("runner_load_invalid_outcome");
    trace.push(RUNTIME_SEQUENCE[12]);
    const adapter = await invoke("adapterArtifactLoader", "loadAdapter",
      [adapterArtifact.artifactBytes], "adapter_load");
    if (!exactKeys(adapter, ["outcome", "adapterHandleHash"]) || adapter.outcome !== "loaded" ||
        !isSha(adapter.adapterHandleHash)) fail("adapter_load_invalid_outcome");
    trace.push(RUNTIME_SEQUENCE[13]);
    await refreshExecutionClock("pre_observation_clock");
    const killSwitch = await invoke("readOnlyObservationTransport", "checkKillSwitch", [{
      launchPackageHash: packet.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
      executionClockInstant: currentClockInstant,
      }], "kill_switch_check");
    if (!exactKeys(killSwitch, ["outcome", "checkedAt"]) ||
        killSwitch.outcome !== "clear" || killSwitch.checkedAt !== currentClockInstant) {
      fail("read_only_observation_kill_switch_not_clear");
    }
    observationInvoked = true;
    let observation;
    try {
      observation = await invoke("readOnlyObservationTransport",
        "invokeReadOnlyObservation", [{
          transportClass: TRANSPORT_CLASS,
          runnerHandleHash: runner.runnerHandleHash,
          adapterHandleHash: adapter.adapterHandleHash,
          operationOrder: qPacket.adapterArtifactManifest.operationOrder,
          observationCategoryOrder: qPacket.adapterArtifactManifest.observationCategoryOrder,
          destinationCount: 1, observationCount: 1, readOnly: true,
        }], "read_only_observation");
      observationAbortAcknowledged = true;
    } catch (error) {
      if (error instanceof RunnerFailure) {
        observationAbortAcknowledged = error.issueCode.includes("_timeout_")
          ? ["aborted", "settled"].includes(error.acknowledgment) : true;
      }
      throw error;
    }
    trace.push(RUNTIME_SEQUENCE[14]); classification = "blocked_after_observation";
    const observationIssues = validateSanitizedObservation(
      observation, packet.stepSPackage, currentClockInstant);
    if (observationIssues.length) fail(observationIssues[0]);
    trace.push(RUNTIME_SEQUENCE[15]);
    await refreshExecutionClock("pre_receipt_persistence_clock");
    receipt = makePreDisposalReceipt(packet.stepSPackage, observation,
      currentClockInstant,
      leaseHash, claimReceiptHash);
    const persisted = await invoke("executionReceiptStore",
      "persistSanitizedReceipt", [receipt], "sanitized_receipt_persistence");
    if (!exactKeys(persisted, ["outcome", "persistedReceiptHash"]) ||
        persisted.outcome !== "persisted" || persisted.persistedReceiptHash !==
        receipt.sanitizedExecutionReceiptHash) fail("sanitized_receipt_persistence_invalid_outcome");
    trace.push(RUNTIME_SEQUENCE[16]);
    await refreshExecutionClock("pre_evidence_persistence_clock");
    evidence = makeEvidence(packet.stepSPackage, receipt, currentClockInstant);
    const finalized = await invoke("evidenceFinalizer",
      "finalizeSanitizedEvidence", [evidence], "sanitized_evidence_finalization");
    if (!exactKeys(finalized, ["outcome", "finalizedEvidenceHash"]) ||
        finalized.outcome !== "finalized" || finalized.finalizedEvidenceHash !==
        evidence.sanitizedEvidenceHash) fail("sanitized_evidence_finalization_invalid_outcome");
    trace.push(RUNTIME_SEQUENCE[17]);
  } catch (error) {
    primaryIssue = error instanceof RunnerFailure
      ? error.issueCode : "controlled_runner_execution_failed";
  } finally {
    if (bound && (!observationInvoked || observationAbortAcknowledged)) {
      disposalAttempted = true;
      try {
        const disposed = await invoke("environmentDisposalCoordinator",
          "disposeEnvironment", [{
            launchPackageHash: packet.stepSPackage.oneRunRunnerLaunchPackage.oneRunRunnerLaunchPackageHash,
            leaseAcquired, observationInvoked, receiptHash: receipt.sanitizedExecutionReceiptHash || null,
            evidenceHash: evidence.sanitizedEvidenceHash || null,
          }], "environment_disposal");
        disposalCompleted = exactKeys(disposed, ["outcome", "disposalReceiptHash"]) &&
          disposed.outcome === "completed" && isSha(disposed.disposalReceiptHash);
        if (disposalCompleted) {
          disposalReceiptHash = disposed.disposalReceiptHash;
          if (!primaryIssue) trace.push(RUNTIME_SEQUENCE[18]);
        } else {
          disposalIssue = "environment_disposal_invalid_outcome";
        }
      } catch (error) {
        disposalCompleted = false;
        disposalIssue = error instanceof RunnerFailure
          ? error.issueCode : "environment_disposal_failed";
      }
    } else if (bound && observationInvoked && !observationAbortAcknowledged) {
      disposalIssue = primaryIssue || "observation_abort_acknowledgment_missing";
    }
    if (leaseAcquired) {
      executionTerminalState = !disposalCompleted ? "disposal_uncertain" :
        (primaryIssue ? (observationInvoked ? "failed_after_invocation" :
          "failed_before_invocation") : "completed");
      try {
        const terminal = await invoke("singleUseExecutionLeaseStore",
          "finalizeExecutionLease", [{ leaseHash, terminalState: executionTerminalState,
            adapterInvocationCount: observationInvoked ? 1 : 0,
            disposalCompleted }], "execution_lease_terminalization");
        if (!exactKeys(terminal, ["outcome", "terminalState"]) ||
            terminal.outcome !== "finalized" ||
            terminal.terminalState !== executionTerminalState) {
          primaryIssue ||= "execution_lease_terminalization_invalid_outcome";
        }
      } catch (error) {
        primaryIssue ||= error instanceof RunnerFailure
          ? error.issueCode : "execution_lease_terminalization_failed";
      }
    }
  }
  if (!disposalCompleted && bound) {
    return block("disposal_uncertain",
      disposalIssue || primaryIssue || "environment_disposal_uncertain");
  }
  if (primaryIssue) return block(classification, primaryIssue);
  if (!canonicalEqual(trace, RUNTIME_SEQUENCE.slice(0, 19)) ||
      !observationInvoked || counts.readOnlyObservationTransport !== 2) {
    return block("blocked_after_observation", "runtime_state_sequence_invalid");
  }
  trace.push(RUNTIME_SEQUENCE[19]);
  closureReceipt = makeExecutionClosureReceipt(packet.stepSPackage, receipt, evidence,
    disposalReceiptHash, executionTerminalState, trace, currentClockInstant);
  return safeResult(PUBLIC_STATES[1], {
    executionTerminalState: "completed",
    runtimeStateSequence: trace, capabilityInvocationCounts: counts,
    adapterInvocationCount: 1, disposalAttempted, disposalCompleted,
    sanitizedExecutionReceipt: receipt, sanitizedEvidence: evidence,
    sanitizedExecutionClosureReceipt: closureReceipt,
  });
}

function buildCapabilityDescriptor(capabilityName) {
  const body = {
    capabilityName, capabilityClass: `finple_step114_2x_t_${capabilityName}`,
    contractVersion: VERSION,
    methodNames: [...CAPABILITY_SPECS[capabilityName]],
    maximumInvocationCount: CAPABILITY_SPECS[capabilityName].length,
    hardTimeoutMilliseconds: 5000,
    cooperativeCancellationRequired: true,
    deadlineEnforcementRequired: true,
    postTimeoutOutcomeReconciliationRequired: true,
    lateCompletionForbidden: false,
    lateOutcomePolicy: "read_only_terminal_outcome_reconciliation_required",
    terminalOutcomes: ["aborted", "not_committed", "committed", "ambiguous"],
    invocationContextFields: ["operationId", "idempotencyKey", "deadline", "abortSignal"],
    automaticRetryAllowed: false, fallbackAllowed: false,
    externalDiscoveryAllowed: false,
    productionAccessAllowed: false,
    maximumDestinationCount: capabilityName === "readOnlyObservationTransport" ? 1 : 0,
    maximumObservationCount: capabilityName === "readOnlyObservationTransport" ? 1 : 0,
    mutabilityPolicy: buildMutabilityPolicy(capabilityName),
    sanitizationPolicy: { sanitizedOutputOnly: true, rawMaterialForbidden: true,
      credentialEchoForbidden: true, persistenceOutsideNamedStoreForbidden: true },
  };
  return { ...body, descriptorHash:
    hashContract("FINPLE_STEP114_2X_T_CAPABILITY_DESCRIPTOR\0", body) };
}

module.exports = {
  CAPABILITY_MUTABILITY_POLICIES, CAPABILITY_NAMES, CAPABILITY_SPECS,
  FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS,
  PUBLIC_STATES, RUNTIME_SEQUENCE, TRANSPORT_CLASS, VERSION,
  buildCapabilityDescriptor, buildMutabilityPolicy, canonicalJson, hashContract,
  runControlledLiveObservation,
  sha256, validateCapabilityBundle, validateDirectStepSPackage,
  validateSanitizedObservation,
};
