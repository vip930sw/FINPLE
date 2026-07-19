"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const stepM = require("./lib/metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./lib/metrics-cutover-live-observation-invocation.cjs");
const stepO = require("./lib/metrics-cutover-live-observation-executor-preflight.cjs");
const subject = require("./lib/metrics-cutover-live-observation-executor-shell.cjs");
const {
  hashWithDomain,
} = require("./lib/metrics-cutover-guarded-executor-contracts.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepOUpstream() {
  const mUpstream = stepM.buildUpstream();
  const mContext = {
    upstream: mUpstream,
    approverAllowlist: stepM.buildApproverAllowlist(APPROVER_PEM),
    verificationPolicy: stepM.buildVerificationPolicy(mUpstream),
    priorResponseNonceHashes: [],
  };
  const unsignedResponse = stepM.buildUnsignedApprovalResponse(mUpstream);
  const responseSignature = sign(
    null, stepM.buildApprovalSignaturePayload(unsignedResponse), APPROVER_KEYS.privateKey,
  ).toString("base64");
  const approvalResponse = stepM.sealSignedApprovalResponse(
    unsignedResponse, responseSignature,
  );
  const stepMPacket = {
    context: mContext,
    approvalResponse,
    evaluationClockInstant: "2026-07-18T00:03:10.000Z",
  };
  const authority = stepM.buildObservationAuthorityPackage(approvalResponse, mContext);
  const mSummary = stepM.buildSummary(approvalResponse, mContext, authority);
  const nUpstream = stepN.buildUpstream(stepMPacket, authority, mSummary);
  const nContext = {
    upstream: nUpstream,
    invokerAllowlist: stepN.buildInvokerAllowlist(INVOKER_PEM),
    verificationPolicy: stepN.buildVerificationPolicy(nUpstream),
    priorInvocationNonceHashes: [],
  };
  const unsignedInvocation = stepN.buildUnsignedInvocation(nUpstream);
  const invocationSignature = sign(
    null, stepN.buildInvocationSignaturePayload(unsignedInvocation), INVOKER_KEYS.privateKey,
  ).toString("base64");
  const invocation = stepN.sealSignedInvocation(unsignedInvocation, invocationSignature);
  const stepNPacket = {
    context: nContext,
    invocation,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z",
  };
  const nReceipt = stepN.buildReceiptCandidate(invocation, nContext);
  const nSummary = stepN.buildSummary(invocation, nContext, nReceipt);
  const oUpstream = stepO.buildUpstream(stepNPacket, nReceipt, nSummary);
  const oContext = {
    upstream: oUpstream,
    consumptionPolicy: stepO.buildConsumptionPolicy(oUpstream),
    adapterCapabilityPolicy: stepO.buildAdapterCapabilityPolicy(oUpstream),
    adapterDescriptor: stepO.buildAdapterDescriptor(),
    priorClaimNonceHashes: [],
    priorInvocationNonceHashes: [],
  };
  const executorInput = stepO.buildExecutorInput(oUpstream);
  const stepOPacket = {
    context: oContext,
    executorInput,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z",
  };
  const manifest = stepO.buildEvidenceManifest(executorInput, oContext);
  const oSummary = stepO.buildSummary(executorInput, oContext, manifest);
  return subject.buildUpstream(stepOPacket, manifest, oSummary);
}

const BASE_UPSTREAM = buildStepOUpstream();

function fixture({ claimOverrides = {}, adapterOverrides = {},
  receiptStoreOverrides = {}, claimOutcome = "acquired",
  adapterOutcome = "completed", outputOverrides = {} } = {}) {
  const upstream = clone(BASE_UPSTREAM);
  const claimStoreInterface = subject.buildClaimStoreInterface(upstream, claimOverrides);
  const adapterInterface = subject.buildAdapterInterface(upstream, adapterOverrides);
  const receiptStoreInterface = subject.buildReceiptStoreInterface(
    upstream, receiptStoreOverrides,
  );
  const context = {
    upstream,
    claimStoreInterface,
    adapterInterface,
    receiptStoreInterface,
  };
  const evaluationClockInstant = "2026-07-18T00:03:15.000Z";
  const dependencyBundle = subject.buildDependencyBundle(
    upstream, claimStoreInterface, adapterInterface, receiptStoreInterface,
    evaluationClockInstant,
  );
  return {
    context,
    dependencyBundle,
    claimOutcome,
    adapterOutcome,
    adapterOutput: subject.buildSyntheticAdapterOutput(
      upstream, evaluationClockInstant, outputOverrides,
    ),
    executionPlan: subject.buildExecutionPlan(upstream, dependencyBundle),
    evaluationClockInstant,
  };
}

function rebuildForClock(packet, evaluationClockInstant,
  completedAt = "2026-07-18T00:03:15.000Z") {
  packet.evaluationClockInstant = evaluationClockInstant;
  packet.dependencyBundle = subject.buildDependencyBundle(
    packet.context.upstream,
    packet.context.claimStoreInterface,
    packet.context.adapterInterface,
    packet.context.receiptStoreInterface,
    evaluationClockInstant,
  );
  packet.executionPlan = subject.buildExecutionPlan(
    packet.context.upstream, packet.dependencyBundle,
  );
  packet.adapterOutput = subject.buildSyntheticAdapterOutput(
    packet.context.upstream, completedAt,
  );
  return packet;
}

function reseal(value, name, idField, hashField) {
  return subject.sealContract(
    Object.fromEntries(Object.entries(value).filter(([key]) =>
      ![idField, hashField].includes(key))), name,
  );
}

function expectBlocked(packet, issuePart, adapterInvocationCount) {
  const result = subject.evaluateLiveObservationExecutorShell(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)),
    JSON.stringify(result.blockingIssues));
  if (adapterInvocationCount !== undefined) {
    assert.equal(result.syntheticAdapterInvocationCount, adapterInvocationCount);
  }
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
}

test("public states are exact and ordered", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_live_observation_execution_dependencies",
    "live_observation_executor_shell_validated",
    "blocked",
  ]);
});

test("zero input awaits execution dependencies with every authority false", () => {
  const result = subject.evaluateLiveObservationExecutorShell();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  assert.equal(result.syntheticAdapterInvocationCount, 0);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("CLI default awaits and arguments fail closed", () => {
  const cli = path.join(__dirname,
    "check-metrics-cutover-live-observation-executor-shell.cjs");
  const output = execFileSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(JSON.parse(output).status, subject.PUBLIC_STATES[0]);
  let error;
  try { execFileSync(process.execPath, [cli, "forbidden"], { encoding: "utf8" }); }
  catch (caught) { error = caught; }
  assert.equal(error.status, 1);
  assert.equal(JSON.parse(error.stdout).status, "blocked");
});

test("valid synthetic doubles validate shell and prepare only in-memory receipt", () => {
  const packet = fixture();
  const result = subject.evaluateLiveObservationExecutorShell(packet);
  assert.equal(result.ok, true, JSON.stringify(result.blockingIssues));
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.deepEqual(result.executionStateTrace, subject.EXECUTION_STATE_SEQUENCE);
  assert.equal(result.syntheticAdapterInvocationCount, 1);
  assert.equal(result.executionReceiptCandidate.nonPersistent, true);
  assert.equal(result.executionReceiptCandidate.realClaimPersisted, false);
  assert.equal(result.executionReceiptCandidate.realAdapterInvoked, false);
  assert.equal(result.executionReceiptCandidate.executionReceiptPersisted, false);
  for (const field of subject.FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false);
    assert.equal(result.executorShellSummary[field], false);
    assert.equal(result.executionReceiptCandidate[field], false);
  }
});

test("tampered Step O summary input policy adapter and manifest block", () => {
  const variants = [
    ["stepOExecutorPreflightSummary", "publicState", "blocked", "step_o"],
    ["stepOPacket.executorInput", "destinationCount", 2, "input"],
    ["stepOPacket.context.consumptionPolicy", "maximumAtomicClaimCount", 2,
      "consumption"],
    ["stepOPacket.context.adapterCapabilityPolicy", "writesAllowed", true,
      "adapter"],
    ["stepOEvidenceManifest", "evidenceCollected", true, "manifest"],
  ];
  for (const [pathText, field, value, issue] of variants) {
    const packet = fixture();
    const target = pathText.split(".").reduce((current, key) => current[key],
      packet.context.upstream);
    target[field] = value;
    expectBlocked(packet, issue);
  }
});

test("tampered Step N M L and H material block direct revalidation", () => {
  const n = fixture();
  n.context.upstream.stepOPacket.context.upstream.stepNPacket.invocation.destinationCount = 2;
  expectBlocked(n, "invocation");
  const m = fixture();
  m.context.upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
    .stepMObservationAuthorityPackage.nonExecuting = false;
  expectBlocked(m, "authority");
  const l = fixture();
  l.context.upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
    .stepMPacket.context.upstream.stepLPacket.intake.destinationCount = 2;
  expectBlocked(l, "intake");
  const h = fixture();
  h.context.upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
    .stepMPacket.context.upstream.stepLPacket.approvalRequest.maximumObservationCount = 2;
  expectBlocked(h, "approval_request");
});

test("dependency bundle exact keys reject missing extra and raw fields", () => {
  const missing = fixture(); delete missing.dependencyBundle.realDependencyBound;
  expectBlocked(missing, "dependencies_fields_invalid");
  for (const field of ["endpoint", "credential", "provider", "sql", "filesystemPath"]){
    const packet = fixture(); packet.dependencyBundle[field] = "forbidden";
    expectBlocked(packet, "dependencies_fields_invalid");
  }
});

test("claim key is independently recomputed from Step O domain and ordered fields", () => {
  const packet = fixture();
  const descriptor = packet.context.claimStoreInterface;
  const invocation = packet.context.upstream.stepOPacket.context.upstream
    .stepNPacket.invocation;
  const payload = Object.fromEntries(
    descriptor.claimKeyInputFields.map((field) => [field, invocation[field]]),
  );
  assert.equal(descriptor.claimKeyDerivationDomain,
    stepO.CLAIM_KEY_DERIVATION_DOMAIN);
  assert.equal(Buffer.from(descriptor.claimKeyDerivationDomain).at(-1), 0);
  assert.equal(hashWithDomain(descriptor.claimKeyDerivationDomain, payload),
    descriptor.claimKeyHash);
});

test("claim-key domain input order and hash drift block", () => {
  for (const overrides of [
    { claimKeyDerivationDomain: "FINPLE_STEP114_2X_O_SINGLE_USE_CLAIM_KEY" },
    { claimKeyInputFields: [...stepO.CLAIM_KEY_INPUT_FIELDS].reverse() },
    { claimKeyHash: "0".repeat(64) },
  ]) expectBlocked(fixture({ claimOverrides: overrides }), "claim_store_interface", 0);
});

test("claim store requires atomic one-use acquisition and expiry enforcement", () => {
  for (const [field, value] of [
    ["atomicClaimPrimitive", "best_effort"],
    ["maximumSuccessfulAcquisitions", 2],
    ["duplicateInvocationRejected", false],
    ["replayedInvocationRejected", false],
    ["expiryEnforced", false],
  ]) expectBlocked(fixture({ claimOverrides: { [field]: value } }), field, 0);
});

test("claim and receipt namespaces remain distinct", () => {
  expectBlocked(fixture({ claimOverrides: {
    executionReceiptNamespace: stepO.CLAIM_NAMESPACE,
  } }), "executionReceiptNamespace", 0);
  expectBlocked(fixture({ receiptStoreOverrides: {
    claimStoreNamespace: stepO.EXECUTION_RECEIPT_NAMESPACE,
  } }), "claimStoreNamespace", 0);
});

test("claim store has exact deterministic outcomes", () => {
  expectBlocked(fixture({ claimOverrides: {
    deterministicOutcomes: [...subject.CLAIM_OUTCOMES].reverse(),
  } }), "deterministicOutcomes", 0);
});

test("all non-acquired claim outcomes block before adapter invocation", () => {
  for (const outcome of ["already_exists", "expired", "ambiguous", "failed"]) {
    const packet = fixture({ claimOutcome: outcome });
    const result = subject.evaluateLiveObservationExecutorShell(packet);
    assert.equal(result.status, "blocked");
    assert.equal(result.syntheticAdapterInvocationCount, 0);
    assert.deepEqual(result.executionStateTrace, [
      "preflight_revalidated", "claim_acquisition_requested",
    ]);
    assert.ok(result.blockingIssues.includes(`claim_store_outcome_blocks_adapter:${outcome}`));
  }
});

test("unknown claim outcome blocks before adapter invocation", () => {
  expectBlocked(fixture({ claimOutcome: "unknown" }), "claim_store_outcome_invalid", 0);
});

test("claim ambiguity failure and general retry remain disabled", () => {
  for (const [field, value] of [
    ["automaticRetryAllowed", true],
    ["ambiguousOutcomeRetryAllowed", true],
    ["durableStoreAccessed", true],
    ["realDependencyBound", true],
  ]) expectBlocked(fixture({ claimOverrides: { [field]: value } }), field, 0);
});

test("adapter interface keeps exact Step O order and one invocation", () => {
  for (const [field, value] of [
    ["observationSequence", [...stepO.ADAPTER_OBSERVATION_SEQUENCE].reverse()],
    ["requiredObservationCategories", [...stepO.OBSERVATION_CATEGORIES].reverse()],
    ["maximumInvocationCount", 2],
    ["destinationCount", 2],
  ]) expectBlocked(fixture({ adapterOverrides: { [field]: value } }), field, 0);
});

test("adapter write mutation production credential and raw capabilities block", () => {
  for (const field of [
    "writesSupported", "ddlSupported", "dmlSupported", "stateMutationSupported",
    "migrationSupported", "scenarioExecutionSupported", "providerMutationSupported",
    "productionAccessSupported", "credentialEchoSupported",
    "credentialPersistenceSupported", "rawEndpointOutputSupported",
    "rawCertificateOutputSupported", "rawCredentialOutputSupported",
  ]) expectBlocked(fixture({ adapterOverrides: { [field]: true } }), field, 0);
});

test("adapter retry external binding and raw material block", () => {
  for (const field of [
    "automaticRetrySupported", "ambiguousOutcomeRetrySupported",
    "externalAdapterBound", "realDependencyBound", "rawMaterialPresent",
  ]) expectBlocked(fixture({ adapterOverrides: { [field]: true } }), field, 0);
});

test("blocked ambiguous and failed adapter outcomes block receipt with one synthetic attempt", () => {
  for (const outcome of ["blocked", "ambiguous", "failed"]) {
    const result = subject.evaluateLiveObservationExecutorShell(
      fixture({ adapterOutcome: outcome }),
    );
    assert.equal(result.status, "blocked");
    assert.equal(result.syntheticAdapterInvocationCount, 1);
    assert.deepEqual(result.executionStateTrace, [
      "preflight_revalidated", "claim_acquisition_requested", "claim_acquired",
      "adapter_invocation_requested",
    ]);
    assert.deepEqual(result.executionReceiptCandidate, {});
  }
});

test("unknown adapter outcome does not count an invocation", () => {
  expectBlocked(fixture({ adapterOutcome: "unknown" }), "adapter_outcome_invalid", 0);
});

test("adapter output exact keys and raw material boundary block", () => {
  const missing = fixture(); delete missing.adapterOutput.destinationCount;
  expectBlocked(missing, "adapter_output_fields_invalid", 1);
  const extra = fixture(); extra.adapterOutput.endpoint = "forbidden";
  expectBlocked(extra, "adapter_output_fields_invalid", 1);
  expectBlocked(fixture({ outputOverrides: { rawMaterialPresent: true } }),
    "sanitization_invalid", 1);
});

test("adapter hash outputs reject missing extra and malformed values", () => {
  const missing = fixture();
  delete missing.adapterOutput.hashOutputs[
    Object.keys(missing.adapterOutput.hashOutputs)[0]
  ];
  expectBlocked(missing, "hashes_invalid", 1);
  const extra = fixture(); extra.adapterOutput.hashOutputs.rawEvidence = "a".repeat(64);
  expectBlocked(extra, "hashes_invalid", 1);
  const malformed = fixture();
  malformed.adapterOutput.hashOutputs[
    Object.keys(malformed.adapterOutput.hashOutputs)[0]
  ] = "invalid";
  expectBlocked(malformed, "hashes_invalid", 1);
});

test("adapter timestamp outputs require exact canonical fields", () => {
  const malformed = fixture();
  malformed.adapterOutput.timestampOutputs[
    Object.keys(malformed.adapterOutput.timestampOutputs)[0]
  ] = "2026-07-18";
  expectBlocked(malformed, "timestamps_invalid", 1);
  const future = fixture({ outputOverrides: {
    completedAt: "2026-07-18T00:03:16.000Z",
  } });
  expectBlocked(future, "chronology_invalid", 1);
});

test("adapter output operation and category drift block", () => {
  expectBlocked(fixture({ outputOverrides: {
    observationSequence: [...stepO.ADAPTER_OBSERVATION_SEQUENCE].reverse(),
  } }), "order_invalid", 1);
  expectBlocked(fixture({ outputOverrides: {
    observationCategories: [...stepO.OBSERVATION_CATEGORIES].reverse(),
  } }), "order_invalid", 1);
});

test("state machine skip reorder duplicate and extension block", () => {
  const variants = [
    subject.EXECUTION_STATE_SEQUENCE.slice(1),
    [...subject.EXECUTION_STATE_SEQUENCE].reverse(),
    [...subject.EXECUTION_STATE_SEQUENCE, "completed"],
    [...subject.EXECUTION_STATE_SEQUENCE, "extended"],
  ];
  for (const trace of variants) {
    const packet = fixture();
    packet.executionPlan.executionStateSequence = trace;
    packet.executionPlan = reseal(packet.executionPlan, "plan",
      "executionPlanId", "executionPlanHash");
    expectBlocked(packet, "executionStateSequence", 1);
  }
});

test("state trace hash and maximum invocation count reject drift", () => {
  for (const [field, value] of [
    ["stateMachineTraceHash", "0".repeat(64)],
    ["maximumAdapterInvocationCount", 2],
    ["syntheticAdapterInvocationCount", 2],
    ["automaticRetryAllowed", true],
  ]) {
    const packet = fixture(); packet.executionPlan[field] = value;
    packet.executionPlan = reseal(packet.executionPlan, "plan",
      "executionPlanId", "executionPlanHash");
    expectBlocked(packet, field, 1);
  }
});

test("resealed execution clock binds to observation and minimum expiry half-open interval", () => {
  const base = fixture();
  const input = base.context.upstream.stepOPacket.executorInput;
  const invocation = base.context.upstream.stepOPacket.context.upstream
    .stepNPacket.invocation;
  const beforeStart = new Date(
    Date.parse(input.observationWindowStartsAt) - 1,
  ).toISOString();
  expectBlocked(rebuildForClock(fixture(), beforeStart),
    "evaluation_clock_before_observation_window", 0);

  expectBlocked(rebuildForClock(fixture(), input.claimExpiresAt),
    "evaluation_clock_expired", 0);

  const afterInvocationExpiry = new Date(
    Date.parse(invocation.expiresAt) + 1,
  ).toISOString();
  expectBlocked(rebuildForClock(fixture(), afterInvocationExpiry),
    "evaluation_clock_expired", 0);

  const minimumExpiry = Math.min(
    Date.parse(input.claimExpiresAt),
    Date.parse(input.expiresAt),
    Date.parse(invocation.expiresAt),
    Date.parse(input.observationWindowExpiresAt),
  );
  const immediatelyBeforeExpiry = new Date(minimumExpiry - 1).toISOString();
  const valid = subject.evaluateLiveObservationExecutorShell(
    rebuildForClock(fixture(), immediatelyBeforeExpiry, immediatelyBeforeExpiry),
  );
  assert.equal(valid.status, "live_observation_executor_shell_validated",
    JSON.stringify(valid.blockingIssues));
  assert.equal(valid.syntheticAdapterInvocationCount, 1);

  const malformed = fixture(); malformed.evaluationClockInstant = "invalid";
  expectBlocked(malformed, "evaluation", 0);
});

test("receipt-store interface cannot persist or retry", () => {
  for (const [field, value] of [
    ["durablePersistenceAllowed", true],
    ["automaticRetryAllowed", true],
    ["storeAccessed", true],
    ["acceptsNonPersistentCandidateOnly", false],
    ["realDependencyBound", true],
  ]) expectBlocked(fixture({ receiptStoreOverrides: { [field]: value } }), field, 0);
});

test("receipt candidate bindings hashes timestamps and false fields reject drift", () => {
  const packet = fixture();
  const result = subject.evaluateLiveObservationExecutorShell(packet);
  const receipt = clone(result.executionReceiptCandidate);
  for (const [field, value] of [
    ["claimKeyHash", "0".repeat(64)],
    ["stateMachineTraceHash", "0".repeat(64)],
    ["destinationCount", 2],
    ["separateFinalizationRequired", false],
    ["separateDisposalRequired", false],
    ["realAdapterInvoked", true],
  ]) {
    const drift = clone(receipt); drift[field] = value;
    const issues = subject.validateReceiptCandidate(
      drift, packet.context.upstream, packet.dependencyBundle, packet.executionPlan,
      packet.context.adapterInterface, packet.adapterOutput,
    );
    assert.ok(issues.some((issue) => issue.includes(field)), JSON.stringify(issues));
  }
});

test("summary bindings and fixed-false authority reject drift", () => {
  const packet = fixture();
  const result = subject.evaluateLiveObservationExecutorShell(packet);
  const summary = clone(result.executorShellSummary);
  summary.liveObservationClaimCreated = true;
  const issues = subject.validateSummary(
    summary, packet.context.upstream, packet.dependencyBundle, packet.executionPlan,
    result.executionReceiptCandidate,
  );
  assert.ok(issues.some((issue) => issue.includes("liveObservationClaimCreated")));
});

test("waiting blocked and validated results preserve all fixed-false authority", () => {
  for (const result of [
    subject.evaluateLiveObservationExecutorShell(),
    subject.evaluateLiveObservationExecutorShell({ invalid: true }),
    subject.evaluateLiveObservationExecutorShell(fixture()),
  ]) for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("core source has no ambient network database store or process capability", () => {
  const source = readFileSync(path.join(__dirname,
    "lib/metrics-cutover-live-observation-executor-shell.cjs"), "utf8");
  for (const forbidden of [
    "node:fs", "node:http", "node:https", "node:net", "node:tls", "node:dns",
    "child_process", "process.env", "Date.now(", "new Date()", "require(\"pg\")",
    "require('pg')", "fetch(", "createConnection(", "createSocket(",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
