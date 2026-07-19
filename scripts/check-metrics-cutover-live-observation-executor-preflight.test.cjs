"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const stepM = require("./lib/metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./lib/metrics-cutover-live-observation-invocation.cjs");
const subject = require("./lib/metrics-cutover-live-observation-executor-preflight.cjs");
const {
  hashWithDomain,
} = require("./lib/metrics-cutover-guarded-executor-contracts.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepNUpstream() {
  const mUpstream = stepM.buildUpstream();
  const approverAllowlist = stepM.buildApproverAllowlist(APPROVER_PEM);
  const mVerificationPolicy = stepM.buildVerificationPolicy(mUpstream);
  const mContext = {
    upstream: mUpstream,
    approverAllowlist,
    verificationPolicy: mVerificationPolicy,
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
  const invokerAllowlist = stepN.buildInvokerAllowlist(INVOKER_PEM);
  const nVerificationPolicy = stepN.buildVerificationPolicy(nUpstream);
  const nContext = {
    upstream: nUpstream,
    invokerAllowlist,
    verificationPolicy: nVerificationPolicy,
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
  const receipt = stepN.buildReceiptCandidate(invocation, nContext);
  const nSummary = stepN.buildSummary(invocation, nContext, receipt);
  return subject.buildUpstream(stepNPacket, receipt, nSummary);
}

const BASE_UPSTREAM = buildStepNUpstream();

function fixture({ inputOverrides = {}, descriptorOverrides = {} } = {}) {
  const upstream = clone(BASE_UPSTREAM);
  const context = {
    upstream,
    consumptionPolicy: subject.buildConsumptionPolicy(upstream),
    adapterCapabilityPolicy: subject.buildAdapterCapabilityPolicy(upstream),
    adapterDescriptor: subject.buildAdapterDescriptor(descriptorOverrides),
    priorClaimNonceHashes: [],
    priorInvocationNonceHashes: [],
  };
  return {
    context,
    executorInput: subject.buildExecutorInput(upstream, inputOverrides),
    evaluationClockInstant: "2026-07-18T00:03:15.000Z",
  };
}

let validEvaluationCache;
function validEvaluation() {
  if (!validEvaluationCache) {
    const packet = fixture();
    validEvaluationCache = {
      packet,
      result: subject.evaluateLiveObservationExecutorPreflight(packet),
    };
  }
  return clone(validEvaluationCache);
}

function reseal(value, name, idField, hashField) {
  return subject.sealContract(
    Object.fromEntries(Object.entries(value).filter(([key]) =>
      ![idField, hashField].includes(key))),
    name,
  );
}

function expectBlocked(packet, issuePart) {
  const result = subject.evaluateLiveObservationExecutorPreflight(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)),
    JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
}

test("public states are exact and ordered", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_live_observation_executor_inputs",
    "live_observation_executor_preflight_prepared",
    "blocked",
  ]);
});

test("zero input awaits external executor inputs with every authority false", () => {
  const result = subject.evaluateLiveObservationExecutorPreflight();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("CLI default is awaiting and arguments fail closed", () => {
  const cli = path.join(__dirname,
    "check-metrics-cutover-live-observation-executor-preflight.cjs");
  const output = execFileSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(JSON.parse(output).status, subject.PUBLIC_STATES[0]);
  let error;
  try { execFileSync(process.execPath, [cli, "forbidden"], { encoding: "utf8" }); }
  catch (caught) { error = caught; }
  assert.equal(error.status, 1);
  assert.equal(JSON.parse(error.stdout).status, "blocked");
});

test("valid synthetic input prepares only a non-executing manifest", () => {
  const { result } = validEvaluation();
  assert.equal(result.ok, true, JSON.stringify(result.blockingIssues));
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.equal(result.executorPreflightSummary.singleUseClaimProtocolValidated, true);
  assert.equal(result.evidenceManifestTemplate.outputValuesPopulated, false);
  assert.equal(result.evidenceManifestTemplate.adapterInvoked, false);
  assert.equal(result.evidenceManifestTemplate.claimCreated, false);
  assert.deepEqual(result.evidenceManifestTemplate.requiredObservationCategories,
    subject.OBSERVATION_CATEGORIES);
  for (const field of subject.FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false);
    assert.equal(result.executorPreflightSummary[field], false);
    assert.equal(result.evidenceManifestTemplate[field], false);
  }
});

test("tampered Step N summary, receipt, and invocation block", () => {
  const summary = fixture();
  summary.context.upstream.stepNInvocationVerificationSummary.publicState = "blocked";
  expectBlocked(summary, "step_n");
  const receipt = fixture();
  receipt.context.upstream.stepNInvocationReceiptCandidate.nonExecuting = false;
  expectBlocked(receipt, "receipt");
  const invocation = fixture();
  invocation.context.upstream.stepNPacket.invocation.destinationCount = 2;
  expectBlocked(invocation, "invocation");
});

test("tampered Step M, Step L, and Step H material block direct revalidation", () => {
  const m = fixture();
  m.context.upstream.stepNPacket.context.upstream
    .stepMObservationAuthorityPackage.nonExecuting = false;
  expectBlocked(m, "observation_authority");
  const l = fixture();
  l.context.upstream.stepNPacket.context.upstream.stepMPacket.context.upstream
    .stepLPacket.intake.destinationCount = 2;
  expectBlocked(l, "intake");
  const h = fixture();
  h.context.upstream.stepNPacket.context.upstream.stepMPacket.context.upstream
    .stepLPacket.approvalRequest.maximumObservationCount = 2;
  expectBlocked(h, "approval_request");
});

test("executor input exact keys reject missing and extra fields", () => {
  const missing = fixture(); delete missing.executorInput.namespaceCategory;
  expectBlocked(missing, "input_fields_invalid");
  const extra = fixture(); extra.executorInput.endpoint = "forbidden";
  expectBlocked(extra, "input_fields_invalid");
});

test("claim nonce must differ from every bound nonce", () => {
  for (const field of [
    "requestNonceHash", "intakeNonceHash", "approvalResponseNonceHash",
    "invocationNonceHash",
  ]) {
    const packet = fixture();
    packet.executorInput = subject.buildExecutorInput(packet.context.upstream, {
      claimNonceHash: packet.context.upstream.stepNPacket.invocation[field],
    });
    expectBlocked(packet, "nonce_not_distinct");
  }
});

test("claim and invocation replay contexts block", () => {
  const claim = fixture();
  claim.context.priorClaimNonceHashes = [claim.executorInput.claimNonceHash];
  expectBlocked(claim, "claim_nonce_replay");
  const invocation = fixture();
  invocation.context.priorInvocationNonceHashes = [invocation.executorInput.invocationNonceHash];
  expectBlocked(invocation, "invocation_nonce_replay");
});

test("malformed duplicate and unsorted claim contexts block", () => {
  for (const [values, issue] of [
    [["invalid"], "hash_invalid"],
    [["1".repeat(64), "1".repeat(64)], "duplicate"],
    [["2".repeat(64), "1".repeat(64)], "not_sorted"],
  ]) {
    const packet = fixture(); packet.context.priorClaimNonceHashes = values;
    expectBlocked(packet, issue);
  }
});

test("malformed duplicate and unsorted invocation contexts block", () => {
  for (const [values, issue] of [
    [["invalid"], "hash_invalid"],
    [["1".repeat(64), "1".repeat(64)], "duplicate"],
    [["2".repeat(64), "1".repeat(64)], "not_sorted"],
  ]) {
    const packet = fixture(); packet.context.priorInvocationNonceHashes = values;
    expectBlocked(packet, issue);
  }
});

test("environment class purpose namespace and destination drift block", () => {
  for (const [field, value] of [
    ["selectedCandidateClass", "other"],
    ["targetPurposeClassification", "other"],
    ["namespaceCategory", "other"],
    ["destinationCount", 2],
  ]) {
    const packet = fixture({ inputOverrides: { [field]: value } });
    expectBlocked(packet, "executor_input");
  }
});

test("observation category and Step H placeholder order drift block", () => {
  for (const field of [
    "requiredObservationCategories", "requiredHashPlaceholders",
    "requiredTimestampPlaceholders", "runtimeDeniedPrivileges",
    "credentialAttestationCategories",
  ]) {
    const packet = fixture();
    packet.executorInput = subject.buildExecutorInput(packet.context.upstream, {
      [field]: [...packet.executorInput[field]].reverse(),
    });
    expectBlocked(packet, "executor_input");
  }
});

test("credential category separation cannot be weakened", () => {
  const packet = fixture({ inputOverrides: { credentialCategoriesDistinct: false } });
  expectBlocked(packet, "executor_input_scope_invalid");
});

test("chronology expiry and observation window failures block", () => {
  const expired = fixture(); expired.evaluationClockInstant = expired.executorInput.expiresAt;
  expectBlocked(expired, "evaluation_time_invalid");
  const before = fixture(); before.evaluationClockInstant = "2026-07-18T00:02:59.000Z";
  expectBlocked(before, "evaluation_time_invalid");
  const outlives = fixture({ inputOverrides: {
    expiresAt: "2026-07-18T00:04:01.000Z",
  } });
  expectBlocked(outlives, "executor_input_field_invalid:expiresAt");
  const claimOutlives = fixture({ inputOverrides: {
    claimExpiresAt: "2026-07-18T00:04:01.000Z",
  } });
  expectBlocked(claimOutlives, "claimExpiresAt");
});

test("claim key binds invocation ID hash and nonce", () => {
  const packet = fixture();
  assert.equal(packet.executorInput.claimKeyHash,
    subject.deriveClaimKeyHash(packet.context.upstream));
  const drift = fixture({ inputOverrides: { claimKeyHash: "0".repeat(64) } });
  expectBlocked(drift, "executor_input_field_invalid:claimKeyHash");
});

test("policy-declared domain bytes and input fields independently reproduce claim key", () => {
  const packet = fixture();
  const policy = packet.context.consumptionPolicy;
  const invocation = packet.context.upstream.stepNPacket.invocation;
  const payload = Object.fromEntries(
    policy.claimKeyInputFields.map((field) => [field, invocation[field]]),
  );
  assert.equal(policy.claimKeyDerivationDomain, subject.CLAIM_KEY_DERIVATION_DOMAIN);
  assert.equal(Buffer.from(policy.claimKeyDerivationDomain, "utf8").at(-1), 0);
  assert.deepEqual(policy.claimKeyInputFields, subject.CLAIM_KEY_INPUT_FIELDS);
  assert.equal(hashWithDomain(policy.claimKeyDerivationDomain, payload),
    policy.claimKeyHash);
});

test("claim-key domain separator and input-field tampering block", () => {
  for (const domain of [
    "FINPLE_STEP114_2X_O_SINGLE_USE_CLAIM_KEY",
    "FINPLE_STEP114_2X_O_SINGLE_USE_CLAIM_KEY\0\0",
  ]) {
    const packet = fixture();
    packet.context.consumptionPolicy.claimKeyDerivationDomain = domain;
    packet.context.consumptionPolicy = reseal(
      packet.context.consumptionPolicy, "consumption",
      "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
    );
    expectBlocked(packet, "claimKeyDerivationDomain");
  }
  const fields = fixture();
  fields.context.consumptionPolicy.claimKeyInputFields.reverse();
  fields.context.consumptionPolicy = reseal(
    fields.context.consumptionPolicy, "consumption",
    "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
  );
  expectBlocked(fields, "claimKeyInputFields");
});

test("single-use policy requires one atomic claim and compare-and-set equivalence", () => {
  for (const [field, value] of [
    ["maximumAtomicClaimCount", 2],
    ["atomicClaimPrimitive", "best_effort"],
    ["duplicateInvocationRejected", false],
    ["replayedInvocationRejected", false],
  ]) {
    const packet = fixture();
    packet.context.consumptionPolicy[field] = value;
    packet.context.consumptionPolicy = reseal(
      packet.context.consumptionPolicy, "consumption",
      "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
    );
    expectBlocked(packet, `consumption_policy_field_invalid:${field}`);
  }
});

test("claim and execution receipt namespaces must remain separate", () => {
  const packet = fixture();
  packet.context.consumptionPolicy.executionReceiptNamespace =
    packet.context.consumptionPolicy.claimStoreNamespace;
  packet.context.consumptionPolicy = reseal(
    packet.context.consumptionPolicy, "consumption",
    "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
  );
  expectBlocked(packet, "executionReceiptNamespace");
});

test("claim failure, ambiguity, and adapter ambiguity never auto retry", () => {
  for (const [field, value] of [
    ["claimFailureBlocksBeforeAdapterInvocation", false],
    ["automaticRetryAllowed", true],
    ["ambiguousClaimOutcomeRetryAllowed", true],
    ["ambiguousAdapterOutcomeRetryAllowed", true],
    ["operatorReviewRequiredOnUncertainty", false],
    ["claimExpiryBoundToInvocationAndObservationWindow", false],
    ["claimExpiresAt", "2026-07-18T00:04:01.000Z"],
  ]) {
    const packet = fixture(); packet.context.consumptionPolicy[field] = value;
    packet.context.consumptionPolicy = reseal(
      packet.context.consumptionPolicy, "consumption",
      "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
    );
    expectBlocked(packet, `consumption_policy_field_invalid:${field}`);
  }
});

test("preflight policy never accesses a durable store or creates a claim", () => {
  for (const field of ["durableStoreAccessed", "claimCreated", "claimPersisted"]) {
    const packet = fixture(); packet.context.consumptionPolicy[field] = true;
    packet.context.consumptionPolicy = reseal(
      packet.context.consumptionPolicy, "consumption",
      "singleUseConsumptionPolicyId", "singleUseConsumptionPolicyHash",
    );
    expectBlocked(packet, `consumption_policy_field_invalid:${field}`);
  }
});

test("adapter operation skip reorder duplicate and extension block", () => {
  const variants = [
    subject.ADAPTER_OBSERVATION_SEQUENCE.slice(1),
    [...subject.ADAPTER_OBSERVATION_SEQUENCE].reverse(),
    [...subject.ADAPTER_OBSERVATION_SEQUENCE, subject.ADAPTER_OBSERVATION_SEQUENCE[0]],
    [...subject.ADAPTER_OBSERVATION_SEQUENCE, "observe_sanitized_extra"],
  ];
  for (const observationSequence of variants) {
    const packet = fixture();
    packet.context.adapterCapabilityPolicy.observationSequence = observationSequence;
    packet.context.adapterCapabilityPolicy = reseal(
      packet.context.adapterCapabilityPolicy, "adapter",
      "adapterCapabilityPolicyId", "adapterCapabilityPolicyHash",
    );
    expectBlocked(packet, "adapter_policy_field_invalid:observationSequence");
  }
});

test("adapter write multi-destination raw production and retry capabilities block", () => {
  for (const [field, value] of [
    ["writesAllowed", true], ["ddlAllowed", true], ["dmlAllowed", true],
    ["stateMutationAllowed", true], ["migrationAllowed", true],
    ["scenarioExecutionAllowed", true], ["providerMutationAllowed", true],
    ["credentialEchoAllowed", true], ["credentialPersistenceAllowed", true],
    ["rawEndpointOutputAllowed", true], ["rawCertificateOutputAllowed", true],
    ["rawCredentialOutputAllowed", true], ["productionDatabaseAccessAllowed", true],
    ["automaticRetryAllowed", true], ["ambiguousOutcomeRetryAllowed", true],
    ["adapterInvocationAllowed", true], ["adapterInvoked", true],
    ["destinationCount", 2],
  ]) {
    const packet = fixture(); packet.context.adapterCapabilityPolicy[field] = value;
    packet.context.adapterCapabilityPolicy = reseal(
      packet.context.adapterCapabilityPolicy, "adapter",
      "adapterCapabilityPolicyId", "adapterCapabilityPolicyHash",
    );
    expectBlocked(packet, `adapter_policy_field_invalid:${field}`);
  }
});

test("transport-neutral descriptor rejects executable capabilities", () => {
  for (const [field, value] of [
    ["transportNeutral", false], ["readOnly", false], ["writesSupported", true],
    ["credentialEchoSupported", true], ["rawCredentialOutputSupported", true],
    ["productionDatabaseAccessSupported", true], ["automaticRetrySupported", true],
    ["invocationSupportedInPreflight", true], ["destinationCount", 2],
  ]) {
    const packet = fixture({ descriptorOverrides: { [field]: value } });
    expectBlocked(packet, `adapter_descriptor_field_invalid:${field}`);
  }
});

test("context exact keys reject missing and extra material", () => {
  const missing = fixture(); delete missing.context.adapterDescriptor;
  expectBlocked(missing, "executor_context_fields_invalid");
  const extra = fixture(); extra.context.claimStore = {};
  expectBlocked(extra, "executor_context_fields_invalid");
});

test("evidence manifest binds input policy categories order and fixed-false fields", () => {
  const { packet, result } = validEvaluation();
  const binding = clone(result.evidenceManifestTemplate);
  binding.executorInputHash = "0".repeat(64);
  assert.ok(subject.validateEvidenceManifest(binding, packet.executorInput, packet.context)
    .some((issue) => issue.includes("executorInputHash")));
  const order = clone(result.evidenceManifestTemplate);
  order.requiredObservationCategories.reverse();
  assert.ok(subject.validateEvidenceManifest(order, packet.executorInput, packet.context)
    .some((issue) => issue.includes("requiredObservationCategories")));
  const authority = clone(result.evidenceManifestTemplate);
  authority.liveObservationAdapterInvoked = true;
  assert.ok(subject.validateEvidenceManifest(authority, packet.executorInput, packet.context)
    .some((issue) => issue.includes("liveObservationAdapterInvoked")));
});

test("manifest rejects collection observation claim consumption and receipt drift", () => {
  const { packet, result } = validEvaluation();
  for (const field of [
    "outputValuesPopulated", "evidenceCollected", "adapterInvoked",
    "observationStarted", "observationCompleted", "claimCreated",
    "invocationConsumed", "executionReceiptPersisted",
  ]) {
    const manifest = clone(result.evidenceManifestTemplate); manifest[field] = true;
    assert.ok(subject.validateEvidenceManifest(manifest, packet.executorInput, packet.context)
      .some((issue) => issue.includes(field)));
  }
});

test("summary bindings and fixed-false fields reject drift", () => {
  const { packet, result } = validEvaluation();
  const manifest = result.evidenceManifestTemplate;
  const binding = clone(result.executorPreflightSummary);
  binding.evidenceManifestHash = "0".repeat(64);
  assert.ok(subject.validateSummary(binding, packet.executorInput, packet.context, manifest)
    .some((issue) => issue.includes("evidenceManifestHash")));
  const authority = clone(result.executorPreflightSummary);
  authority.environmentObservationExecuted = true;
  assert.ok(subject.validateSummary(authority, packet.executorInput, packet.context, manifest)
    .some((issue) => issue.includes("environmentObservationExecuted")));
});

test("idle blocked CLI failure and exceptions preserve fixed-false fields", () => {
  for (const result of [
    subject.evaluateLiveObservationExecutorPreflight(),
    subject.evaluateLiveObservationExecutorPreflight({}),
    subject.evaluateLiveObservationExecutorPreflight({
      context: null, executorInput: null, evaluationClockInstant: null,
    }),
  ]) for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("core has no ambient external adapter store signing or deployment capability", () => {
  const source = readFileSync(path.join(__dirname,
    "lib/metrics-cutover-live-observation-executor-preflight.cjs"), "utf8");
  assert.doesNotMatch(source,
    /require\(["'](?:node:fs|node:net|node:tls|node:http|node:https|node:child_process|pg)["']\)|process\.|fetch\s*\(|createConnection|new\s+(?:Client|Pool)\s*\(|generateKeyPair|\bsign\s*\(|writeFile|readFile|execFile|spawn\s*\(/i);
  assert.match(source, /validateSignedInvocation/);
  assert.match(source, /claimFailureBlocksBeforeAdapterInvocation/);
  assert.match(source, /adapterInvocationAllowed:\s*false/);
});
