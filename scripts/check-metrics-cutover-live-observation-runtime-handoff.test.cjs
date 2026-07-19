"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { generateKeyPairSync, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const stepM = require("./lib/metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./lib/metrics-cutover-live-observation-invocation.cjs");
const stepO = require("./lib/metrics-cutover-live-observation-executor-preflight.cjs");
const stepP = require("./lib/metrics-cutover-live-observation-executor-shell.cjs");
const stepQ = require("./lib/metrics-cutover-live-observation-operator-run-package.cjs");
const subject = require("./lib/metrics-cutover-live-observation-runtime-handoff.cjs");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function withoutEnvelope(value, name) {
  const spec = subject.SPECS[name];
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    ![spec.idField, spec.hashField].includes(key)));
}
function reseal(value, name, overrides = {}) {
  return subject.sealContract({ ...withoutEnvelope(value, name), ...overrides }, name);
}

const APPROVER_KEYS = generateKeyPairSync("ed25519");
const INVOKER_KEYS = generateKeyPairSync("ed25519");
const OPERATOR_KEYS = generateKeyPairSync("ed25519");
const APPROVER_PEM = APPROVER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const INVOKER_PEM = INVOKER_KEYS.publicKey.export({ type: "spki", format: "pem" });
const OPERATOR_PEM = OPERATOR_KEYS.publicKey.export({ type: "spki", format: "pem" });

function buildStepPUpstream() {
  const mUpstream = stepM.buildUpstream();
  const mContext = {
    upstream: mUpstream,
    approverAllowlist: stepM.buildApproverAllowlist(APPROVER_PEM),
    verificationPolicy: stepM.buildVerificationPolicy(mUpstream),
    priorResponseNonceHashes: [],
  };
  const unsignedResponse = stepM.buildUnsignedApprovalResponse(mUpstream);
  const approvalResponse = stepM.sealSignedApprovalResponse(
    unsignedResponse,
    sign(null, stepM.buildApprovalSignaturePayload(unsignedResponse),
      APPROVER_KEYS.privateKey).toString("base64"),
  );
  const stepMPacket = { context: mContext, approvalResponse,
    evaluationClockInstant: "2026-07-18T00:03:10.000Z" };
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
  const invocation = stepN.sealSignedInvocation(
    unsignedInvocation,
    sign(null, stepN.buildInvocationSignaturePayload(unsignedInvocation),
      INVOKER_KEYS.privateKey).toString("base64"),
  );
  const stepNPacket = { context: nContext, invocation,
    evaluationClockInstant: "2026-07-18T00:03:15.000Z" };
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
  const evaluationClockInstant = "2026-07-18T00:03:15.000Z";
  const dependencyBundle = stepP.buildDependencyBundle(
    pUpstream, claimStoreInterface, adapterInterface, receiptStoreInterface,
    evaluationClockInstant,
  );
  const pPacket = {
    context: pContext,
    dependencyBundle,
    claimOutcome: "acquired",
    adapterOutcome: "completed",
    adapterOutput: stepP.buildSyntheticAdapterOutput(pUpstream, evaluationClockInstant),
    executionPlan: stepP.buildExecutionPlan(pUpstream, dependencyBundle),
    evaluationClockInstant,
  };
  const pReceipt = stepP.buildReceiptCandidate(
    pUpstream, dependencyBundle, pPacket.executionPlan, adapterInterface,
    pPacket.adapterOutput,
  );
  const pSummary = stepP.buildSummary(
    pUpstream, dependencyBundle, pPacket.executionPlan, pReceipt,
  );
  return stepQ.buildUpstream(pPacket, pReceipt, pSummary);
}

function buildStepQUpstream() {
  const qUpstream = buildStepPUpstream();
  const context = {
    upstream: qUpstream,
    operatorAllowlist: stepQ.buildOperatorAllowlist(OPERATOR_PEM),
    verificationPolicy: stepQ.buildVerificationPolicy(qUpstream),
    priorOperatorAuthorizationNonceHashes: [],
  };
  const manifest = stepQ.buildAdapterArtifactManifest(qUpstream);
  const unsigned = stepQ.buildUnsignedOperatorAuthorization(qUpstream, manifest);
  const authorization = stepQ.sealSignedOperatorAuthorization(
    unsigned,
    sign(null, stepQ.buildOperatorAuthorizationSignaturePayload(unsigned),
      OPERATOR_KEYS.privateKey).toString("base64"),
  );
  const qPacket = { context, operatorAuthorization: authorization,
    adapterArtifactManifest: manifest,
    evaluationClockInstant: "2026-07-18T00:03:20.000Z" };
  const binding = stepQ.buildOneRunAdapterBinding(authorization, context, manifest);
  const summary = stepQ.buildSummary(authorization, context, manifest, binding);
  return subject.buildUpstream(qPacket, binding, summary);
}

const BASE_UPSTREAM = buildStepQUpstream();
function fixture(inputOverrides = {}) {
  return subject.buildValidSyntheticPacket(clone(BASE_UPSTREAM), inputOverrides);
}
function expectBlocked(packet, issuePart) {
  const result = subject.evaluateRuntimeHandoffPreflight(packet);
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.blockingIssues.some((issue) => issue.includes(issuePart)),
    JSON.stringify(result.blockingIssues));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  return result;
}

test("public states are exact and zero input plus CLI default await", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_live_observation_runtime_handoff_inputs",
    "live_observation_runtime_handoff_prepared",
    "blocked",
  ]);
  const result = subject.evaluateRuntimeHandoffPreflight();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
  const cli = path.join(__dirname,
    "check-metrics-cutover-live-observation-runtime-handoff.cjs");
  assert.equal(JSON.parse(execFileSync(process.execPath, [cli], {
    encoding: "utf8",
  })).status, subject.PUBLIC_STATES[0]);
  const denied = spawnSync(process.execPath, [cli, "forbidden"], { encoding: "utf8" });
  assert.equal(denied.status, 2);
  assert.equal(JSON.parse(denied.stdout).status, "blocked");
});

test("valid synthetic runtime handoff passes every direct validator", () => {
  const packet = fixture();
  assert.deepEqual(subject.validateDirectUpstreamChain(packet.upstream), []);
  assert.deepEqual(subject.validateRuntimeHandoffInput(
    packet.runtimeHandoffInput, packet.upstream), []);
  assert.deepEqual(subject.validateAdapterLoaderPolicy(
    packet.adapterLoaderPolicy, packet.upstream, packet.runtimeHandoffInput), []);
  assert.deepEqual(subject.validateRuntimeDependencyPolicy(
    packet.runtimeDependencyPolicy, packet.upstream, packet.runtimeHandoffInput), []);
  const result = subject.evaluateRuntimeHandoffPreflight(packet);
  assert.equal(result.ok, true, JSON.stringify(result.blockingIssues));
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  assert.deepEqual(result.oneRunExecutionHandoff.handoffSequence,
    subject.HANDOFF_SEQUENCE);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false);
});

test("all six runtime contracts enforce exact keys, IDs, hashes, and versions", () => {
  for (const [field, name] of [
    ["runtimeHandoffInput", "input"],
    ["adapterLoaderPolicy", "loader"],
    ["runtimeDependencyPolicy", "dependency"],
    ["runtimePreconditionManifest", "precondition"],
    ["oneRunExecutionHandoff", "handoff"],
    ["runtimeHandoffSummary", "summary"],
  ]) {
    const missing = fixture(); delete missing[field].contractVersion;
    expectBlocked(missing, `${name}_fields_invalid`);
    const extra = fixture(); extra[field].endpoint = "forbidden";
    expectBlocked(extra, `${name}_fields_invalid`);
    const id = fixture(); id[field][subject.SPECS[name].idField] = "wrong";
    expectBlocked(id, `${name}_id_invalid`);
    const hash = fixture(); hash[field][subject.SPECS[name].hashField] = "0".repeat(64);
    expectBlocked(hash, `${name}_hash_invalid`);
    const version = fixture(); version[field].contractVersion = "other";
    expectBlocked(version, `${name}_contract_version_invalid`);
  }
});

test("Step Q authorization, manifest, binding, summary, and signature drift block", () => {
  const cases = [
    [(packet) => { packet.upstream.stepQOperatorRunSummary.operatorRunSummaryHash = "0".repeat(64); }, "step_q"],
    [(packet) => { packet.upstream.stepQOneRunAdapterBinding.oneRunAdapterBindingHash = "0".repeat(64); }, "step_q"],
    [(packet) => { packet.upstream.stepQPacket.operatorAuthorization.operatorAuthorizationHash = "0".repeat(64); }, "authorization"],
    [(packet) => { packet.upstream.stepQPacket.operatorAuthorization.signatureBase64 = Buffer.alloc(64).toString("base64"); }, "signature"],
    [(packet) => { packet.upstream.stepQPacket.adapterArtifactManifest.adapterArtifactSha256 = "9".repeat(64); }, "manifest"],
  ];
  for (const [mutate, issue] of cases) {
    const packet = fixture(); mutate(packet); expectBlocked(packet, issue);
  }
});

test("resealed P O N M L and H upstream material blocks direct validation", () => {
  const cases = [
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket
      .dependencyBundle.executionDependencyBundleHash = "0".repeat(64); },
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket.context
      .upstream.stepOPacket.context.consumptionPolicy.singleUseConsumptionPolicyHash =
        "0".repeat(64); },
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket.context
      .upstream.stepOPacket.context.upstream.stepNPacket.invocation.invocationHash =
        "0".repeat(64); },
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket.context
      .upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
      .stepMPacket.approvalResponse.approvalResponseHash = "0".repeat(64); },
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket.context
      .upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
      .stepMPacket.context.upstream.stepLSummary.approvalRequestPreparationSummaryHash =
        "0".repeat(64); },
    (packet) => { packet.upstream.stepQPacket.context.upstream.stepPPacket.context
      .upstream.stepOPacket.context.upstream.stepNPacket.context.upstream
      .stepMPacket.context.upstream.stepLPacket.approvalRequest.approvalRequestHash =
        "0".repeat(64); },
  ];
  for (const mutate of cases) {
    const packet = fixture(); mutate(packet); expectBlocked(packet, "invalid");
  }
});

test("runtime input exact descriptor keys and non-executing flags are enforced", () => {
  const extra = fixture();
  extra.runtimeHandoffInput.adapterLoaderPolicyDescriptor.modulePath = "forbidden";
  extra.runtimeHandoffInput = reseal(extra.runtimeHandoffInput, "input", {
    adapterLoaderPolicyDescriptor:
      extra.runtimeHandoffInput.adapterLoaderPolicyDescriptor,
  });
  expectBlocked(extra, "loader_descriptor_fields_invalid");
  for (const [field, value] of [
    ["syntheticValidationOnly", false], ["nonExecuting", false],
    ["realRuntimeDependencyBound", true], ["adapterArtifactBytesRead", true],
    ["adapterArtifactDigestVerified", true], ["adapterRuntimeLoaded", true],
    ["operatorAuthorizationConsumed", true], ["invocationConsumed", true],
    ["claimRequested", true], ["claimPersisted", true], ["adapterInvoked", true],
    ["rawMaterialPresent", true], ["providerSpecificMaterialPresent", true],
    ["manualReviewRequired", true],
  ]) {
    const packet = fixture();
    packet.runtimeHandoffInput = reseal(packet.runtimeHandoffInput, "input", {
      [field]: value,
    });
    expectBlocked(packet, `runtime_handoff_input_field_invalid:${field}`);
  }
});

test("runtime handoff nonce differs from all six earlier nonces", () => {
  const base = fixture();
  for (const field of ["requestNonceHash", "intakeNonceHash",
    "approvalResponseNonceHash", "invocationNonceHash", "claimNonceHash",
    "operatorAuthorizationNonceHash"]) {
    expectBlocked(fixture({ runtimeHandoffNonceHash:
      base.runtimeHandoffInput[field] }), "runtime_handoff_nonce_not_distinct");
  }
});

test("prior runtime nonce context is SHA-256 sorted unique and replay protected", () => {
  expectBlocked(fixture({ priorRuntimeHandoffNonceHashes: ["bad"] }),
    "prior_runtime_handoff_nonce_hashes_hash_invalid");
  expectBlocked(fixture({ priorRuntimeHandoffNonceHashes:
    ["1".repeat(64), "1".repeat(64)] }),
  "prior_runtime_handoff_nonce_hashes_duplicate");
  expectBlocked(fixture({ priorRuntimeHandoffNonceHashes:
    ["2".repeat(64), "1".repeat(64)] }),
  "prior_runtime_handoff_nonce_hashes_not_sorted");
  expectBlocked(fixture({ priorRuntimeHandoffNonceHashes: ["8".repeat(64)] }),
    "runtime_handoff_nonce_replay");
});

test("runtime evaluation clock is canonical and bound to the half-open window", () => {
  const reference = fixture();
  const startsAt = reference.runtimeHandoffInput.observationWindowStartsAt;
  const expiresAt = reference.runtimePreconditionManifest.earliestExpiry;
  const beforeStart = new Date(Date.parse(startsAt) - 1).toISOString();
  const justBeforeExpiry = new Date(Date.parse(expiresAt) - 1).toISOString();
  expectBlocked(fixture({ evaluationClockInstant: beforeStart }),
    "runtime_handoff_evaluation_clock_invalid");
  expectBlocked(fixture({ evaluationClockInstant: expiresAt }),
    "runtime_handoff_evaluation_clock_invalid");
  expectBlocked(fixture({ evaluationClockInstant: "2026-07-18T00:04:00.000Z" }),
    "runtime_handoff_evaluation_clock_invalid");
  expectBlocked(fixture({ evaluationClockInstant: "not-an-instant" }),
    "runtime_handoff_evaluation_clock_invalid");
  assert.equal(subject.evaluateRuntimeHandoffPreflight(fixture({
    evaluationClockInstant: justBeforeExpiry,
  })).ok, true);
});

test("adapter loader substitution, fallback, counts, discovery, retry, and activity block", () => {
  const cases = [
    ["adapterArtifactSha256", "9".repeat(64)],
    ["adapterSourceTreeSha256", "9".repeat(64)],
    ["adapterCapabilityManifestSha256", "9".repeat(64)],
    ["adapterInterfaceVersion", "other"], ["maximumArtifactCount", 2],
    ["maximumLoadAttemptCount", 2], ["fallbackArtifactAllowed", true],
    ["versionSubstitutionAllowed", true], ["hashSubstitutionAllowed", true],
    ["dynamicDiscoveryAllowed", true], ["automaticRetryAllowed", true],
    ["ambiguousOutcomeRetryAllowed", true], ["operatorReviewRequiredOnUncertainty", false],
    ["artifactBytesRead", true], ["artifactDigestVerified", true],
    ["moduleResolved", true], ["adapterRuntimeLoaded", true], ["loaderInvoked", true],
  ];
  for (const [field, value] of cases) {
    const packet = fixture();
    packet.adapterLoaderPolicy = reseal(packet.adapterLoaderPolicy, "loader", {
      [field]: value,
    });
    expectBlocked(packet, `adapter_loader_policy_field_invalid:${field}`);
  }
});

test("claim atomicity, namespace, expiry, retry, replay, and access flags block", () => {
  const cases = [
    ["claimKeyHash", "9".repeat(64)], ["claimNonceHash", "9".repeat(64)],
    ["atomicClaimPrimitive", "non_atomic"], ["claimStoreNamespace", "other"],
    ["claimExpiresAt", "2026-07-18T00:04:00.000Z"],
    ["maximumSuccessfulAcquisitions", 2], ["duplicateRejected", false],
    ["replayRejected", false], ["automaticRetryAllowed", true],
    ["ambiguousOutcomeRetryAllowed", true], ["failedOutcomeRetryAllowed", true],
    ["runtimeBound", true], ["storeAccessed", true], ["claimRequested", true],
    ["claimPersisted", true],
  ];
  for (const [field, value] of cases) {
    const packet = fixture();
    packet.runtimeDependencyPolicy = reseal(
      packet.runtimeDependencyPolicy, "dependency", {
        claimStoreBinding: {
          ...packet.runtimeDependencyPolicy.claimStoreBinding,
          [field]: value,
        },
      },
    );
    expectBlocked(packet, "runtime_dependency_policy_field_invalid:claimStoreBinding");
  }
});

test("read-only transport order, counts, capabilities, retry, and binding flags block", () => {
  const cases = [
    ["stepPAdapterInterfaceHash", "9".repeat(64)],
    ["stepOAdapterCapabilityPolicyHash", "9".repeat(64)],
    ["transportClass", "other"], ["destinationCount", 2],
    ["observationCount", 2], ["operationOrder", ["other"]],
    ["observationCategoryOrder", ["other"]],
    ["requiredHashOutputFields", ["other"]],
    ["requiredTimestampOutputFields", ["other"]], ["readOnly", false],
    ["writesAllowed", true], ["ddlAllowed", true], ["dmlAllowed", true],
    ["mutationAllowed", true], ["migrationAllowed", true], ["scenarioAllowed", true],
    ["productionAccessAllowed", true], ["providerMutationAllowed", true],
    ["credentialEchoAllowed", true], ["credentialPersistenceAllowed", true],
    ["rawOutputAllowed", true], ["automaticRetryAllowed", true],
    ["ambiguousOutcomeRetryAllowed", true], ["externalTransportBound", true],
    ["connectionOpened", true], ["adapterInvoked", true],
  ];
  for (const [field, value] of cases) {
    const packet = fixture();
    packet.runtimeDependencyPolicy = reseal(
      packet.runtimeDependencyPolicy, "dependency", {
        readOnlyTransportBinding: {
          ...packet.runtimeDependencyPolicy.readOnlyTransportBinding,
          [field]: value,
        },
      },
    );
    expectBlocked(packet,
      "runtime_dependency_policy_field_invalid:readOnlyTransportBinding");
  }
});

test("receipt evidence and disposal namespaces stay distinct and inactive", () => {
  const cases = [
    ["executionReceiptBinding", "namespace", subject.EVIDENCE_NAMESPACE],
    ["evidenceFinalizationBinding", "namespace", subject.DISPOSAL_NAMESPACE],
    ["environmentDisposalBinding", "namespace", subject.EVIDENCE_NAMESPACE],
    ["executionReceiptBinding", "runtimeBound", true],
    ["executionReceiptBinding", "storeAccessed", true],
    ["executionReceiptBinding", "persistenceExecuted", true],
    ["evidenceFinalizationBinding", "runtimeBound", true],
    ["evidenceFinalizationBinding", "coordinatorAccessed", true],
    ["evidenceFinalizationBinding", "finalizationExecuted", true],
    ["environmentDisposalBinding", "runtimeBound", true],
    ["environmentDisposalBinding", "coordinatorAccessed", true],
    ["environmentDisposalBinding", "disposalExecuted", true],
  ];
  for (const [binding, field, value] of cases) {
    const packet = fixture();
    packet.runtimeDependencyPolicy = reseal(
      packet.runtimeDependencyPolicy, "dependency", {
        [binding]: { ...packet.runtimeDependencyPolicy[binding], [field]: value },
      },
    );
    expectBlocked(packet, "runtime_dependency");
  }
});

test("precondition manifest binds all packages, counts, orders, and later duties", () => {
  const cases = [
    ["stepQOperatorAuthorizationHash", "9".repeat(64)],
    ["runtimeHandoffInputHash", "9".repeat(64)],
    ["adapterLoaderPolicyHash", "9".repeat(64)],
    ["runtimeDependencyPolicyHash", "9".repeat(64)],
    ["runtimeHandoffNonceHash", "9".repeat(64)],
    ["earliestExpiry", "2026-07-18T00:04:00.000Z"],
    ["operationOrder", ["other"]], ["observationCategoryOrder", ["other"]],
    ["executionStateSequence", ["other"]], ["maximumArtifactCount", 2],
    ["maximumClaimAcquisitionCount", 2], ["maximumAdapterLoadAttemptCount", 2],
    ["destinationCount", 2], ["observationCount", 2],
    ["artifactDigestVerificationRequiredLater", false],
    ["claimAcquisitionRequiredLater", false], ["adapterLoadingRequiredLater", false],
    ["observationRequiredLater", false], ["receiptPersistenceRequiredLater", false],
    ["evidenceFinalizationRequiredLater", false],
    ["environmentDisposalRequiredLater", false],
  ];
  for (const [field, value] of cases) {
    const packet = fixture();
    packet.runtimePreconditionManifest = reseal(
      packet.runtimePreconditionManifest, "precondition", { [field]: value },
    );
    expectBlocked(packet, `runtime_precondition_field_invalid:${field}`);
  }
});

test("handoff sequence skip reorder duplicate and extension all block", () => {
  const sequence = [...subject.HANDOFF_SEQUENCE];
  const cases = [
    sequence.slice(1),
    [sequence[1], sequence[0], ...sequence.slice(2)],
    [sequence[0], sequence[0], ...sequence.slice(1)],
    [...sequence, "extension"],
  ];
  for (const handoffSequence of cases) {
    const packet = fixture();
    packet.oneRunExecutionHandoff = reseal(
      packet.oneRunExecutionHandoff, "handoff", { handoffSequence },
    );
    expectBlocked(packet, "one_run_handoff_field_invalid:handoffSequence");
  }
});

test("handoff execution flags and every fixed-false authority reject drift", () => {
  for (const field of ["automaticRetryAllowed", "artifactBytesInspected",
    "artifactDigestVerified", "loaderInvoked", "storeInvoked", "transportInvoked",
    "adapterInvoked", "evidenceSinkInvoked", "receiptSinkInvoked",
    "disposalCoordinatorInvoked"]) {
    const packet = fixture();
    packet.oneRunExecutionHandoff = reseal(
      packet.oneRunExecutionHandoff, "handoff", { [field]: true },
    );
    expectBlocked(packet, `one_run_handoff_field_invalid:${field}`);
  }
  for (const field of subject.FIXED_FALSE_FIELDS) {
    const handoff = fixture();
    handoff.oneRunExecutionHandoff = reseal(
      handoff.oneRunExecutionHandoff, "handoff", { [field]: true },
    );
    expectBlocked(handoff, `one_run_handoff_field_invalid:${field}`);
    const summary = fixture();
    summary.runtimeHandoffSummary = reseal(
      summary.runtimeHandoffSummary, "summary", { [field]: true },
    );
    expectBlocked(summary, `runtime_handoff_summary_field_invalid:${field}`);
  }
});

test("forbidden raw identity and capability fields block at every descriptor boundary", () => {
  for (const field of ["endpoint", "hostname", "ip", "port", "url",
    "database", "schema", "table", "credential", "certificate", "provider",
    "account", "project", "service", "operatorIdentity", "path", "modulePath",
    "command", "sql", "screenshot", "rawSource", "rawEvidence"]) {
    const packet = fixture();
    const descriptor = { ...packet.runtimeHandoffInput.readOnlyAdapterTransportBinding,
      [field]: "forbidden" };
    packet.runtimeHandoffInput = reseal(packet.runtimeHandoffInput, "input", {
      readOnlyAdapterTransportBinding: descriptor,
    });
    expectBlocked(packet, "transport_descriptor_fields_invalid");
  }
});

test("packet exceptions and all blocked results preserve fixed-false authority", () => {
  expectBlocked({ ...fixture(), unexpected: true }, "packet_fields_invalid");
  const malformed = fixture(); malformed.upstream = null;
  expectBlocked(malformed, "step_q_upstream_fields_invalid");
});

test("production source has no ambient filesystem network DB loader store or signing capability", () => {
  const source = readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-live-observation-runtime-handoff.cjs"), "utf8");
  assert.match(source, /require\("node:crypto"\)/);
  for (const forbidden of [
    /process\.env/, /Date\.now/, /new Date\(\)/, /node:fs/, /node:net/,
    /node:tls/, /node:http/, /node:https/, /node:dns/, /node:child_process/,
    /require\(["']pg["']\)/, /require\.resolve/, /\bimport\s*\(/,
    /createPrivateKey/, /generateKeyPair/, /\bsign\s*\(/, /adapterLoader\s*\(/,
    /durableStoreClient/, /deploymentApi/,
  ]) assert.doesNotMatch(source, forbidden);
});
