"use strict";

const {
  createHash,
  createPublicKey,
  verify: verifySignature,
} = require("node:crypto");

const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepN = require("./metrics-cutover-live-observation-invocation.cjs");
const stepO = require("./metrics-cutover-live-observation-executor-preflight.cjs");
const stepP = require("./metrics-cutover-live-observation-executor-shell.cjs");
const stepQ = require("./metrics-cutover-live-observation-operator-run-package.cjs");
const stepR = require("./metrics-cutover-live-observation-runtime-handoff.cjs");

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_live_observation_execution_confirmation",
  "signed_live_observation_runner_launch_package_verified",
  "blocked",
]);
const EXECUTION_OPERATOR_ROLE = "metrics_live_observation_execution_operator";
const EXECUTION_CONFIRMATION_SCOPE =
  "confirm_single_sanitized_disposable_environment_observation_launch";
const RUNNER_CLASS =
  "guarded_disposable_environment_read_only_observation_runner";
const RUNNER_INTERFACE_VERSION =
  "guarded-disposable-environment-read-only-observation-runner-interface-v1";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_CONFIRMATION_LIFETIME_SECONDS = 20;
const ALLOWED_CLOCK_SKEW_SECONDS = 2;
const CONFIRMATION_SEQUENCE = Object.freeze([
  "revalidate_runtime_handoff",
  "verify_runner_implementation_manifest",
  "require_runtime_artifact_digest_verification",
  "require_single_use_claim_acquisition",
  "require_bound_read_only_observation_once",
  "require_sanitized_receipt_evidence_and_disposal",
  "prepare_one_run_runner_launch",
]);
const ATTESTATION_FIELDS = Object.freeze([
  "runtimeHandoffRevalidated",
  "runnerImplementationManifestVerified",
  "runtimeArtifactDigestVerificationRequired",
  "singleUseClaimAcquisitionRequired",
  "boundReadOnlyObservationOnceRequired",
  "sanitizedReceiptEvidenceAndDisposalRequired",
  "nonExecutingLaunchOnly",
  "manualReviewOnAmbiguityRequired",
  "rawMaterialForbidden",
  "providerSpecificMaterialForbidden",
]);
const VERSIONS = Object.freeze({
  confirmation:
    "metrics-cutover-live-observation-execution-confirmation-v1-step114-2x-s",
  allowlist:
    "metrics-cutover-live-observation-execution-confirmer-allowlist-v1-step114-2x-s",
  policy:
    "metrics-cutover-live-observation-execution-confirmation-policy-v1-step114-2x-s",
  manifest:
    "metrics-cutover-live-observation-runner-implementation-manifest-v1-step114-2x-s",
  launch:
    "metrics-cutover-live-observation-one-run-runner-launch-v1-step114-2x-s",
  summary:
    "metrics-cutover-live-observation-runner-launch-summary-v1-step114-2x-s",
});
const REQUIRED_FALSE_FIELDS = Object.freeze([
  "liveObservationExecutionConfirmationRecorded",
  "liveObservationExecutionConfirmationConsumed",
  "liveObservationRunnerArtifactBytesRead",
  "liveObservationRunnerArtifactDigestVerified",
  "liveObservationRunnerModuleResolved",
  "liveObservationRunnerLoaded",
  "liveObservationRunnerInvoked",
  "liveObservationRuntimeDependenciesBound",
  "liveObservationAdapterArtifactBytesRead",
  "liveObservationAdapterArtifactDigestVerified",
  "liveObservationAdapterLoaderInvoked",
  "liveObservationAdapterArtifactLoaded",
  "liveObservationClaimAcquisitionRequested",
  "liveObservationClaimCreated",
  "liveObservationClaimPersisted",
  "liveObservationOperatorAuthorizationConsumed",
  "liveObservationInvocationConsumed",
  "liveObservationAdapterInvoked",
  "liveObservationEvidenceCollected",
  "liveObservationExecutionReceiptPersisted",
  "liveObservationEnvironmentDisposalRequested",
  "liveObservationAuthorityActivated",
  "environmentObservationAuthorized",
  "environmentObservationExecuted",
  "providerConnectionAuthorized",
  "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized",
  "credentialUseAuthorized",
  "credentialInjected",
  "sqlExecutionAuthorized",
  "migrationAuthorized",
  "scenarioExecutionAuthorized",
  "evidenceCollectionStarted",
  "environmentDisposalAuthorized",
  "environmentDisposalExecuted",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
]);
const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepR.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);
const SPECS = Object.freeze({
  confirmation: Object.freeze({ version: VERSIONS.confirmation,
    idField: "executionConfirmationId", hashField: "executionConfirmationHash",
    prefix: "metrics-cutover-live-observation-execution-confirmation",
    idDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_HASH\0" }),
  allowlist: Object.freeze({ version: VERSIONS.allowlist,
    idField: "executionConfirmerAllowlistId", hashField: "executionConfirmerAllowlistHash",
    prefix: "metrics-cutover-live-observation-execution-confirmer-allowlist",
    idDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMER_ALLOWLIST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMER_ALLOWLIST_HASH\0" }),
  policy: Object.freeze({ version: VERSIONS.policy,
    idField: "executionConfirmationPolicyId", hashField: "executionConfirmationPolicyHash",
    prefix: "metrics-cutover-live-observation-execution-confirmation-policy",
    idDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_POLICY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_POLICY_HASH\0" }),
  manifest: Object.freeze({ version: VERSIONS.manifest,
    idField: "runnerImplementationManifestId", hashField: "runnerImplementationManifestHash",
    prefix: "metrics-cutover-live-observation-runner-implementation-manifest",
    idDomain: "FINPLE_STEP114_2X_S_RUNNER_IMPLEMENTATION_MANIFEST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_RUNNER_IMPLEMENTATION_MANIFEST_HASH\0" }),
  launch: Object.freeze({ version: VERSIONS.launch,
    idField: "oneRunRunnerLaunchPackageId", hashField: "oneRunRunnerLaunchPackageHash",
    prefix: "metrics-cutover-live-observation-one-run-runner-launch",
    idDomain: "FINPLE_STEP114_2X_S_ONE_RUN_RUNNER_LAUNCH_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_ONE_RUN_RUNNER_LAUNCH_HASH\0" }),
  summary: Object.freeze({ version: VERSIONS.summary,
    idField: "runnerLaunchSummaryId", hashField: "runnerLaunchSummaryHash",
    prefix: "metrics-cutover-live-observation-runner-launch-summary",
    idDomain: "FINPLE_STEP114_2X_S_RUNNER_LAUNCH_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_S_RUNNER_LAUNCH_SUMMARY_HASH\0" }),
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys(value, fields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return actual.length === expected.length && actual.every(
    (field, index) => field === expected[index]);
}
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort()
    .map((key) => [key, canonicalize(value[key])]));
  return value;
}
function canonicalJson(value) { return JSON.stringify(canonicalize(value)); }
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function hashWithDomain(domain, value) {
  return createHash("sha256").update(domain, "utf8")
    .update(canonicalJson(value), "utf8").digest("hex");
}
function isSha256(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isSafeIdentity(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]{2,127}$/.test(value);
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function without(value, fields) {
  const blocked = new Set(Array.isArray(fields) ? fields : [fields]);
  return Object.fromEntries(Object.entries(value || {}).filter(([key]) => !blocked.has(key)));
}
function parseInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) return null;
  return parsed;
}
function decodeCanonicalBase64(value) {
  if (typeof value !== "string" || value.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.toString("base64") === value ? decoded : null;
  } catch { return null; }
}
function publicKeyMaterial(publicKeyPem) {
  const publicKey = createPublicKey(publicKeyPem);
  if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519") {
    throw new TypeError("execution_confirmer_public_key_not_ed25519");
  }
  const fingerprint = createHash("sha256")
    .update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
  return { publicKey, fingerprint };
}
function validateHashArray(value, label) {
  if (!Array.isArray(value)) return [`${label}_not_array`];
  if (value.some((entry) => !isSha256(entry))) return [`${label}_entry_invalid`];
  if (new Set(value).size !== value.length) return [`${label}_duplicate`];
  if (!canonicalEqual(value, [...value].sort())) return [`${label}_not_sorted`];
  return [];
}
function sealContract(body, name) {
  const spec = SPECS[name];
  if (!spec) throw new TypeError("runner_launch_contract_spec_invalid");
  const id = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  const withId = { ...body, [spec.idField]: id };
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}

const R_BINDING_FIELDS = Object.freeze([
  ...stepR.UPSTREAM_BINDING_FIELDS,
  "stepRRuntimeHandoffSummaryId", "stepRRuntimeHandoffSummaryHash",
  "stepROneRunExecutionHandoffId", "stepROneRunExecutionHandoffHash",
  "stepRRuntimePreconditionManifestId", "stepRRuntimePreconditionManifestHash",
  "stepRRuntimeHandoffInputId", "stepRRuntimeHandoffInputHash",
  "stepRAdapterLoaderPolicyId", "stepRAdapterLoaderPolicyHash",
  "stepRRuntimeDependencyPolicyId", "stepRRuntimeDependencyPolicyHash",
  "stepRRuntimeHandoffNonceHash", "stepRPriorRuntimeHandoffNonceContextDigest",
  "stepREvaluationClockInstant", "stepREarliestExpiry", "stepRHandoffSequence",
]);
function getMaterial(stepRPacket) {
  const rUpstream = stepRPacket.upstream;
  const qPacket = rUpstream.stepQPacket;
  const qContext = qPacket.context;
  const qUpstream = qContext.upstream;
  const pPacket = qUpstream.stepPPacket;
  const pContext = pPacket.context;
  const pUpstream = pContext.upstream;
  const oPacket = pUpstream.stepOPacket;
  const oContext = oPacket.context;
  const oUpstream = oContext.upstream;
  const nPacket = oUpstream.stepNPacket;
  const nContext = nPacket.context;
  const nUpstream = nContext.upstream;
  const mPacket = nUpstream.stepMPacket;
  const mContext = mPacket.context;
  const lUpstream = mContext.upstream;
  const lPacket = lUpstream.stepLPacket;
  return { rUpstream, qPacket, qContext, qUpstream, pPacket, pContext,
    pUpstream, oPacket, oContext, oUpstream, nPacket, nContext, nUpstream,
    mPacket, mContext, lUpstream, lPacket };
}
function buildBindings(stepRPacket) {
  return {
    ...stepR.buildBindings(stepRPacket.upstream),
    stepRRuntimeHandoffSummaryId:
      stepRPacket.runtimeHandoffSummary.runtimeHandoffSummaryId,
    stepRRuntimeHandoffSummaryHash:
      stepRPacket.runtimeHandoffSummary.runtimeHandoffSummaryHash,
    stepROneRunExecutionHandoffId:
      stepRPacket.oneRunExecutionHandoff.oneRunExecutionHandoffId,
    stepROneRunExecutionHandoffHash:
      stepRPacket.oneRunExecutionHandoff.oneRunExecutionHandoffHash,
    stepRRuntimePreconditionManifestId:
      stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestId,
    stepRRuntimePreconditionManifestHash:
      stepRPacket.runtimePreconditionManifest.runtimePreconditionManifestHash,
    stepRRuntimeHandoffInputId: stepRPacket.runtimeHandoffInput.runtimeHandoffInputId,
    stepRRuntimeHandoffInputHash: stepRPacket.runtimeHandoffInput.runtimeHandoffInputHash,
    stepRAdapterLoaderPolicyId: stepRPacket.adapterLoaderPolicy.adapterLoaderPolicyId,
    stepRAdapterLoaderPolicyHash: stepRPacket.adapterLoaderPolicy.adapterLoaderPolicyHash,
    stepRRuntimeDependencyPolicyId:
      stepRPacket.runtimeDependencyPolicy.runtimeDependencyPolicyId,
    stepRRuntimeDependencyPolicyHash:
      stepRPacket.runtimeDependencyPolicy.runtimeDependencyPolicyHash,
    stepRRuntimeHandoffNonceHash:
      stepRPacket.runtimeHandoffInput.runtimeHandoffNonceHash,
    stepRPriorRuntimeHandoffNonceContextDigest: hashWithDomain(
      "FINPLE_STEP114_2X_S_PRIOR_RUNTIME_HANDOFF_NONCE_CONTEXT\0",
      stepRPacket.runtimeHandoffInput.priorRuntimeHandoffNonceHashes,
    ),
    stepREvaluationClockInstant:
      stepRPacket.runtimeHandoffInput.evaluationClockInstant,
    stepREarliestExpiry: stepRPacket.runtimePreconditionManifest.earliestExpiry,
    stepRHandoffSequence: [...stepRPacket.oneRunExecutionHandoff.handoffSequence],
  };
}

const directStepRCache = new Map();
function validateDirectStepRPackage(stepRPacket) {
  if (!isRecord(stepRPacket) || !hasExactKeys(stepRPacket, [
    "upstream", "runtimeHandoffInput", "adapterLoaderPolicy",
    "runtimeDependencyPolicy", "runtimePreconditionManifest",
    "oneRunExecutionHandoff", "runtimeHandoffSummary",
  ])) return ["step_r_packet_fields_invalid"];
  let cacheKey;
  try {
    cacheKey = hashWithDomain("FINPLE_STEP114_2X_S_STEP_R_VALIDATION_CACHE_KEY\0", stepRPacket);
    if (directStepRCache.has(cacheKey)) return [...directStepRCache.get(cacheKey)];
  } catch { return ["step_r_packet_canonicalization_invalid"]; }
  let material;
  try { material = getMaterial(stepRPacket); } catch {
    return ["step_r_nested_material_invalid"];
  }
  const { qPacket, qContext, pPacket, pContext, oPacket, oContext, oUpstream,
    nPacket, nContext, nUpstream, mPacket, mContext, lUpstream, lPacket } = material;
  const issues = [
    ...stepR.validateDirectUpstreamChain(stepRPacket.upstream),
    ...stepR.validateRuntimeHandoffInput(
      stepRPacket.runtimeHandoffInput, stepRPacket.upstream),
    ...stepR.validateAdapterLoaderPolicy(
      stepRPacket.adapterLoaderPolicy, stepRPacket.upstream,
      stepRPacket.runtimeHandoffInput),
    ...stepR.validateRuntimeDependencyPolicy(
      stepRPacket.runtimeDependencyPolicy, stepRPacket.upstream,
      stepRPacket.runtimeHandoffInput),
    ...stepR.validateRuntimePreconditionManifest(
      stepRPacket.runtimePreconditionManifest, stepRPacket.upstream,
      stepRPacket.runtimeHandoffInput, stepRPacket.adapterLoaderPolicy,
      stepRPacket.runtimeDependencyPolicy),
    ...stepR.validateOneRunExecutionHandoff(
      stepRPacket.oneRunExecutionHandoff, stepRPacket.upstream,
      stepRPacket.runtimeHandoffInput, stepRPacket.adapterLoaderPolicy,
      stepRPacket.runtimeDependencyPolicy, stepRPacket.runtimePreconditionManifest),
    ...stepR.validateSummary(
      stepRPacket.runtimeHandoffSummary, stepRPacket.upstream,
      stepRPacket.runtimeHandoffInput, stepRPacket.adapterLoaderPolicy,
      stepRPacket.runtimeDependencyPolicy, stepRPacket.runtimePreconditionManifest,
      stepRPacket.oneRunExecutionHandoff),
    ...stepQ.validateSignedOperatorAuthorization(
      qPacket.operatorAuthorization, qContext, qPacket.adapterArtifactManifest,
      qPacket.evaluationClockInstant),
    ...stepP.validateDependencyBundle(
      pPacket.dependencyBundle, pContext, pPacket.evaluationClockInstant),
    ...stepO.validateConsumptionPolicy(oContext.consumptionPolicy, oUpstream),
    ...stepN.validateSignedInvocation(
      nPacket.invocation, nContext, nPacket.evaluationClockInstant),
    ...stepM.validateSignedApprovalResponse(
      mPacket.approvalResponse, mContext, mPacket.evaluationClockInstant),
    ...stepL.validateSummary(
      lUpstream.stepLSummary, lPacket.intake, lPacket.approvalRequest,
      lPacket.intakeContext.upstream),
    ...stepH.validateLiveObservationApprovalRequest(
      lPacket.approvalRequest, lPacket.requestContext,
      lPacket.evaluationClockInstant),
  ];
  const evaluated = stepR.evaluateRuntimeHandoffPreflight(stepRPacket);
  if (!evaluated.ok || evaluated.status !== stepR.PUBLIC_STATES[1] ||
      !canonicalEqual(evaluated.runtimeHandoffSummary, stepRPacket.runtimeHandoffSummary) ||
      !canonicalEqual(evaluated.oneRunExecutionHandoff,
        stepRPacket.oneRunExecutionHandoff) ||
      !canonicalEqual(evaluated.runtimePreconditionManifest,
        stepRPacket.runtimePreconditionManifest)) {
    issues.push("step_r_package_evaluation_mismatch");
  }
  const result = uniqueSorted(issues);
  if (directStepRCache.size >= 64) directStepRCache.clear();
  directStepRCache.set(cacheKey, result);
  return [...result];
}

const MANIFEST_FIELDS = Object.freeze([
  "contractVersion", "runnerImplementationManifestId", ...R_BINDING_FIELDS,
  "runnerArtifactId", "runnerArtifactSha256", "runnerSourceTreeSha256",
  "runnerCapabilityManifestSha256", "runnerInterfaceVersion", "runnerClass",
  "supportedLaunchSequence", "maximumRunnerLaunchCount",
  "maximumArtifactLoadAttemptCount",
  "immutableArtifactRequired", "runtimeLoaded", "moduleResolved",
  "runnerInvocable", "adapterInvocable", "externalDependencyBound",
  "providerSpecificMaterialPresent", "rawMaterialPresent",
  "runnerImplementationManifestHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "operatorKeyId", "operatorIdentityHash", "publicKeyPem", "allowedScopes",
  "allowedRoles", "revoked", "validFrom", "validUntil",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "executionConfirmerAllowlistId",
  "stepQOperatorAuthorizationId", "stepQOperatorAuthorizationHash",
  "operatorKeyId", "operatorIdentityHash", "entries",
  "syntheticValidationOnly", "rawMaterialPresent",
  "executionConfirmerAllowlistHash",
]);
const POLICY_FIELDS = Object.freeze([
  "contractVersion", "executionConfirmationPolicyId", ...R_BINDING_FIELDS,
  "executionConfirmerAllowlistId", "executionConfirmerAllowlistHash",
  "runnerImplementationManifestId", "runnerImplementationManifestHash",
  "runnerArtifactId", "runnerArtifactSha256", "runnerSourceTreeSha256",
  "runnerCapabilityManifestSha256", "requiredOperatorPublicKeyFingerprint",
  "requiredScope", "requiredRole", "requiredConfirmationSequence",
  "maximumRunnerLaunchCount", "maximumArtifactLoadAttemptCount",
  "requiredDestinationCount", "requiredObservationCount",
  "maximumConfirmationLifetimeSeconds", "allowedClockSkewSeconds",
  "operatorContinuityRequired", "approverInvokerSeparationRequired",
  "distinctNonceHashesRequired", "priorNonceContextSortedUniqueRequired",
  "nonceReplayProtectionRequired", "earliestExpiryBindingRequired",
  "observationWindowBindingRequired", "nonExecutingLaunchRequired",
  "fixedFalseAuthorityFields", "syntheticValidationOnly", "rawMaterialPresent",
  "executionConfirmationPolicyHash",
]);
const CONFIRMATION_FIELDS = Object.freeze([
  "contractVersion", "executionConfirmationId", ...R_BINDING_FIELDS,
  "executionConfirmerAllowlistId", "executionConfirmerAllowlistHash",
  "executionConfirmationPolicyId", "executionConfirmationPolicyHash",
  "runnerImplementationManifestId", "runnerImplementationManifestHash",
  "runnerArtifactId", "runnerArtifactSha256", "runnerSourceTreeSha256",
  "runnerCapabilityManifestSha256", "executionOperatorPublicKeyFingerprint",
  "confirmationScope", "orderedConfirmations",
  "maximumRunnerLaunchCount", "maximumArtifactLoadAttemptCount",
  "executionConfirmationNonceHash", "issuedAt", "expiresAt",
  "signatureAlgorithm", "attestations", "syntheticValidationOnly",
  "realExecutionConfirmationRecorded", "executionConfirmationConsumed",
  "operatorAuthorizationConsumed", "realRuntimeDependencyBound",
  "runnerRuntimeLoaded", "adapterRuntimeLoaded", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "manualReviewRequired",
  "executionConfirmationHash", "signatureBase64",
]);

const FIELD_SETS = {
  confirmation: CONFIRMATION_FIELDS,
  allowlist: ALLOWLIST_FIELDS,
  policy: POLICY_FIELDS,
  manifest: MANIFEST_FIELDS,
};
function validateEnvelope(value, name) {
  const spec = SPECS[name];
  const fields = FIELD_SETS[name];
  if (!isRecord(value) || !hasExactKeys(value, fields)) return [`${name}_fields_invalid`];
  const issues = [];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const body = name === "confirmation"
    ? without(value, [spec.idField, "signatureBase64", spec.hashField])
    : without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const hashBody = name === "confirmation"
    ? without(value, ["signatureBase64", spec.hashField])
    : { ...body, [spec.idField]: expectedId };
  const expectedHash = hashWithDomain(spec.hashDomain, hashBody);
  if (value[spec.hashField] !== expectedHash) issues.push(`${name}_hash_invalid`);
  return uniqueSorted(issues);
}

function buildRunnerImplementationManifest(stepRPacket, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.manifest,
    ...buildBindings(stepRPacket),
    runnerArtifactId: "synthetic-guarded-live-observation-runner-artifact",
    runnerArtifactSha256: "a".repeat(64),
    runnerSourceTreeSha256: "b".repeat(64),
    runnerCapabilityManifestSha256: "c".repeat(64),
    runnerInterfaceVersion: RUNNER_INTERFACE_VERSION,
    runnerClass: RUNNER_CLASS,
    supportedLaunchSequence: [...CONFIRMATION_SEQUENCE],
    maximumRunnerLaunchCount: 1,
    maximumArtifactLoadAttemptCount: 1,
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    destinationCount: 1,
    observationCount: 1,
    immutableArtifactRequired: true,
    runtimeLoaded: false,
    moduleResolved: false,
    runnerInvocable: false,
    adapterInvocable: false,
    externalDependencyBound: false,
    providerSpecificMaterialPresent: false,
    rawMaterialPresent: false,
    ...overrides,
  }, "manifest");
}
function validateRunnerImplementationManifest(value, stepRPacket) {
  const issues = [...validateEnvelope(value, "manifest")];
  if (!isRecord(value)) return uniqueSorted(issues);
  let expected;
  try {
    expected = buildRunnerImplementationManifest(stepRPacket, {
      runnerArtifactId: value.runnerArtifactId,
      runnerArtifactSha256: value.runnerArtifactSha256,
      runnerSourceTreeSha256: value.runnerSourceTreeSha256,
      runnerCapabilityManifestSha256: value.runnerCapabilityManifestSha256,
    });
  } catch { return uniqueSorted([...issues, "runner_manifest_expected_construction_failed"]); }
  for (const field of MANIFEST_FIELDS) {
    if (!canonicalEqual(value[field], expected[field])) issues.push(`runner_manifest_field_invalid:${field}`);
  }
  if (!isSafeIdentity(value.runnerArtifactId)) issues.push("runner_manifest_artifact_id_invalid");
  for (const field of ["runnerArtifactSha256", "runnerSourceTreeSha256",
    "runnerCapabilityManifestSha256"]) {
    if (!isSha256(value[field])) issues.push(`runner_manifest_hash_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildExecutionConfirmerAllowlist(stepRPacket, publicKeyPem, overrides = {}) {
  const auth = getMaterial(stepRPacket).qPacket.operatorAuthorization;
  return sealContract({
    contractVersion: VERSIONS.allowlist,
    stepQOperatorAuthorizationId: auth.operatorAuthorizationId,
    stepQOperatorAuthorizationHash: auth.operatorAuthorizationHash,
    operatorKeyId: auth.operatorKeyId,
    operatorIdentityHash: auth.operatorIdentityHash,
    entries: [{
      operatorKeyId: auth.operatorKeyId,
      operatorIdentityHash: auth.operatorIdentityHash,
      publicKeyPem,
      allowedScopes: [EXECUTION_CONFIRMATION_SCOPE],
      allowedRoles: [EXECUTION_OPERATOR_ROLE],
      revoked: false,
      validFrom: "2026-07-18T00:03:00.000Z",
      validUntil: "2026-07-18T00:04:00.000Z",
      ...(overrides.entry || {}),
    }],
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...overrides.contract,
  }, "allowlist");
}
function normalizeExecutionConfirmerAllowlist(value, stepRPacket) {
  const issues = [...validateEnvelope(value, "allowlist")];
  if (!isRecord(value) || !Array.isArray(value.entries) || value.entries.length < 1) {
    return { ok: false, entries: [], issues: uniqueSorted([
      ...issues, "execution_confirmer_allowlist_entries_invalid",
    ]) };
  }
  let material;
  try { material = getMaterial(stepRPacket); } catch {
    return { ok: false, entries: [], issues: uniqueSorted([
      ...issues, "execution_confirmer_allowlist_upstream_invalid",
    ]) };
  }
  const { qPacket, qContext, nPacket, nContext, nUpstream, mContext } = material;
  const auth = qPacket.operatorAuthorization;
  if (value.stepQOperatorAuthorizationId !== auth.operatorAuthorizationId ||
      value.stepQOperatorAuthorizationHash !== auth.operatorAuthorizationHash ||
      value.operatorKeyId !== auth.operatorKeyId ||
      value.operatorIdentityHash !== auth.operatorIdentityHash) {
    issues.push("execution_confirmer_allowlist_operator_binding_mismatch");
  }
  const qEntries = stepQ.normalizeOperatorAllowlist(
    qContext.operatorAllowlist, qContext.upstream).entries;
  const approverEntries = stepM.normalizeApproverAllowlist(
    mContext.approverAllowlist).entries;
  const invokerEntries = stepN.normalizeInvokerAllowlist(
    nContext.invokerAllowlist, nContext.upstream).entries;
  const ids = new Set(); const identities = new Set(); const keys = new Set();
  const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `execution_confirmer_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`); return;
    }
    if (!isSafeIdentity(entry.operatorKeyId) || entry.operatorKeyId === "*") {
      issues.push(`${prefix}_key_id_invalid`);
    } else if (ids.has(entry.operatorKeyId)) issues.push("execution_confirmer_key_id_duplicate");
    else ids.add(entry.operatorKeyId);
    if (!isSha256(entry.operatorIdentityHash)) issues.push(`${prefix}_identity_hash_invalid`);
    else if (identities.has(entry.operatorIdentityHash)) issues.push("execution_confirmer_identity_duplicate");
    else identities.add(entry.operatorIdentityHash);
    if (!canonicalEqual(entry.allowedScopes, [EXECUTION_CONFIRMATION_SCOPE])) issues.push(`${prefix}_scope_invalid`);
    if (!canonicalEqual(entry.allowedRoles, [EXECUTION_OPERATOR_ROLE])) issues.push(`${prefix}_role_invalid`);
    if (entry.revoked !== false) issues.push(`${prefix}_revoked`);
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (from === null || until === null || until <= from) issues.push(`${prefix}_validity_invalid`);
    let key = null; let fingerprint = "";
    try {
      ({ publicKey: key, fingerprint } = publicKeyMaterial(entry.publicKeyPem));
      if (keys.has(fingerprint)) issues.push("execution_confirmer_public_key_duplicate");
      else keys.add(fingerprint);
    } catch { issues.push(`${prefix}_public_key_invalid`); }
    entries.push({ ...entry, publicKey: key, fingerprint, validFromMs: from,
      validUntilMs: until });
  });
  const matches = entries.filter((entry) =>
    entry.operatorKeyId === auth.operatorKeyId &&
    entry.operatorIdentityHash === auth.operatorIdentityHash &&
    entry.revoked === false);
  if (matches.length !== 1 || entries.length !== 1) {
    issues.push("execution_confirmer_allowlist_exact_operator_resolution_failed");
  }
  if (matches.length === 1 && !qEntries.some((entry) =>
    entry.operatorKeyId === matches[0].operatorKeyId &&
    entry.operatorIdentityHash === matches[0].operatorIdentityHash &&
    entry.fingerprint === matches[0].fingerprint)) {
    issues.push("execution_confirmer_step_q_operator_continuity_failed");
  }
  if (matches.length === 1 && approverEntries.some((entry) =>
    entry.fingerprint === matches[0].fingerprint)) {
    issues.push("execution_confirmer_approver_public_key_equal");
  }
  if (matches.length === 1 && invokerEntries.some((entry) =>
    entry.fingerprint === matches[0].fingerprint)) {
    issues.push("execution_confirmer_invoker_public_key_equal");
  }
  const approver = nUpstream.stepMObservationAuthorityPackage;
  const invocation = nPacket.invocation;
  if (matches.some((entry) => entry.operatorKeyId === approver.signerKeyId ||
      entry.operatorIdentityHash === approver.signerIdentityHash)) {
    issues.push("execution_confirmer_approver_identity_equal");
  }
  if (matches.some((entry) => entry.operatorKeyId === invocation.invokerKeyId ||
      entry.operatorIdentityHash === invocation.invokerIdentityHash)) {
    issues.push("execution_confirmer_invoker_identity_equal");
  }
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false) {
    issues.push("execution_confirmer_allowlist_synthetic_boundary_invalid");
  }
  return { ok: issues.length === 0, entries: issues.length === 0 ? entries : [],
    issues: uniqueSorted(issues) };
}

function buildExecutionConfirmationPolicy(stepRPacket, allowlist, manifest) {
  const normalized = normalizeExecutionConfirmerAllowlist(allowlist, stepRPacket);
  if (!normalized.ok || normalized.entries.length !== 1) {
    throw new TypeError("execution_confirmation_policy_allowlist_invalid");
  }
  return sealContract({
    contractVersion: VERSIONS.policy,
    ...buildBindings(stepRPacket),
    executionConfirmerAllowlistId: allowlist.executionConfirmerAllowlistId,
    executionConfirmerAllowlistHash: allowlist.executionConfirmerAllowlistHash,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    requiredOperatorPublicKeyFingerprint: normalized.entries[0].fingerprint,
    requiredScope: EXECUTION_CONFIRMATION_SCOPE,
    requiredRole: EXECUTION_OPERATOR_ROLE,
    requiredConfirmationSequence: [...CONFIRMATION_SEQUENCE],
    maximumRunnerLaunchCount: 1,
    maximumArtifactLoadAttemptCount: 1,
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    requiredDestinationCount: 1,
    requiredObservationCount: 1,
    maximumConfirmationLifetimeSeconds: MAXIMUM_CONFIRMATION_LIFETIME_SECONDS,
    allowedClockSkewSeconds: ALLOWED_CLOCK_SKEW_SECONDS,
    operatorContinuityRequired: true,
    approverInvokerSeparationRequired: true,
    distinctNonceHashesRequired: true,
    priorNonceContextSortedUniqueRequired: true,
    nonceReplayProtectionRequired: true,
    earliestExpiryBindingRequired: true,
    observationWindowBindingRequired: true,
    nonExecutingLaunchRequired: true,
    fixedFalseAuthorityFields: [...FIXED_FALSE_FIELDS],
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
  }, "policy");
}
function validateExecutionConfirmationPolicy(value, stepRPacket, allowlist, manifest) {
  const issues = [...validateEnvelope(value, "policy")];
  let expected;
  try { expected = buildExecutionConfirmationPolicy(stepRPacket, allowlist, manifest); }
  catch { return uniqueSorted([...issues, "execution_confirmation_policy_expected_construction_failed"]); }
  for (const field of POLICY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`execution_confirmation_policy_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildUnsignedExecutionConfirmation(stepRPacket, allowlist, policy,
  manifest, executionOperatorPublicKeyFingerprint, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.confirmation,
    ...buildBindings(stepRPacket),
    executionConfirmerAllowlistId: allowlist.executionConfirmerAllowlistId,
    executionConfirmerAllowlistHash: allowlist.executionConfirmerAllowlistHash,
    executionConfirmationPolicyId: policy.executionConfirmationPolicyId,
    executionConfirmationPolicyHash: policy.executionConfirmationPolicyHash,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    executionOperatorPublicKeyFingerprint,
    confirmationScope: EXECUTION_CONFIRMATION_SCOPE,
    operatorRole: EXECUTION_OPERATOR_ROLE,
    orderedConfirmations: [...CONFIRMATION_SEQUENCE],
    maximumRunnerLaunchCount: 1,
    maximumArtifactLoadAttemptCount: 1,
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    destinationCount: 1,
    observationCount: 1,
    executionConfirmationNonceHash: "9".repeat(64),
    issuedAt: "2026-07-18T00:03:21.000Z",
    expiresAt: "2026-07-18T00:03:39.000Z",
    operatorKeyId: buildBindings(stepRPacket).operatorKeyId,
    operatorIdentityHash: buildBindings(stepRPacket).operatorIdentityHash,
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    attestations: Object.fromEntries(ATTESTATION_FIELDS.map((field) => [field, true])),
    syntheticValidationOnly: true,
    realExecutionConfirmationRecorded: false,
    executionConfirmationConsumed: false,
    operatorAuthorizationConsumed: false,
    realRuntimeDependencyBound: false,
    runnerRuntimeLoaded: false,
    adapterRuntimeLoaded: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
    ...overrides,
  }, "confirmation");
}
function buildExecutionConfirmationSignaturePayload(unsignedConfirmation) {
  if (!isRecord(unsignedConfirmation) || !hasExactKeys(unsignedConfirmation,
    CONFIRMATION_FIELDS.filter((field) => field !== "signatureBase64"))) {
    throw new TypeError("unsigned_execution_confirmation_fields_invalid");
  }
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedConfirmation), "utf8"),
  ]);
}
function sealSignedExecutionConfirmation(unsignedConfirmation, signatureBase64) {
  return { ...unsignedConfirmation, signatureBase64 };
}
function validateExecutionConfirmationShape(value) {
  const issues = [...validateEnvelope(value, "confirmation")];
  if (!isRecord(value)) return uniqueSorted(issues);
  for (const field of [
    "runnerImplementationManifestHash", "runnerArtifactSha256",
    "runnerSourceTreeSha256", "runnerCapabilityManifestSha256",
    "executionOperatorPublicKeyFingerprint", "executionConfirmationNonceHash",
    "operatorIdentityHash",
  ]) if (!isSha256(value[field])) issues.push(`execution_confirmation_hash_invalid:${field}`);
  if (!isSafeIdentity(value.operatorKeyId)) issues.push("execution_confirmation_operator_key_id_invalid");
  if (value.confirmationScope !== EXECUTION_CONFIRMATION_SCOPE ||
      value.operatorRole !== EXECUTION_OPERATOR_ROLE) {
    issues.push("execution_confirmation_scope_role_invalid");
  }
  if (!canonicalEqual(value.orderedConfirmations, CONFIRMATION_SEQUENCE) ||
      value.maximumRunnerLaunchCount !== 1 ||
      value.maximumArtifactLoadAttemptCount !== 1 ||
      value.maximumClaimAcquisitionCount !== 1 ||
      value.maximumAdapterInvocationCount !== 1 || value.destinationCount !== 1 ||
      value.observationCount !== 1) {
    issues.push("execution_confirmation_order_or_bounds_invalid");
  }
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    issues.push("execution_confirmation_signature_algorithm_invalid");
  }
  if (!hasExactKeys(value.attestations, ATTESTATION_FIELDS) ||
      ATTESTATION_FIELDS.some((field) => value.attestations?.[field] !== true)) {
    issues.push("execution_confirmation_attestations_invalid");
  }
  if (value.syntheticValidationOnly !== true ||
      value.realExecutionConfirmationRecorded !== false ||
      value.executionConfirmationConsumed !== false ||
      value.operatorAuthorizationConsumed !== false ||
      value.realRuntimeDependencyBound !== false || value.runnerRuntimeLoaded !== false ||
      value.adapterRuntimeLoaded !== false || value.rawMaterialPresent !== false ||
      value.providerSpecificMaterialPresent !== false ||
      value.manualReviewRequired !== false) {
    issues.push("execution_confirmation_synthetic_boundary_invalid");
  }
  const signature = decodeCanonicalBase64(value.signatureBase64);
  if (!signature || signature.length !== 64) issues.push("execution_confirmation_signature_encoding_invalid");
  return uniqueSorted(issues);
}
function validateExecutionConfirmationContext(context, manifest) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "executionConfirmerAllowlist", "verificationPolicy",
    "priorExecutionConfirmationNonceHashes",
  ])) return ["execution_confirmation_context_fields_invalid"];
  return uniqueSorted([
    ...validateDirectStepRPackage(context.upstream),
    ...validateRunnerImplementationManifest(manifest, context.upstream),
    ...normalizeExecutionConfirmerAllowlist(
      context.executionConfirmerAllowlist, context.upstream).issues,
    ...validateExecutionConfirmationPolicy(
      context.verificationPolicy, context.upstream,
      context.executionConfirmerAllowlist, manifest),
    ...validateHashArray(context.priorExecutionConfirmationNonceHashes,
      "prior_execution_confirmation_nonce_hashes"),
  ]);
}
function validateSignedExecutionConfirmation(value, context, manifest,
  evaluationClockInstant) {
  const issues = [...validateExecutionConfirmationShape(value)];
  const contextIssues = validateExecutionConfirmationContext(context, manifest);
  issues.push(...contextIssues);
  if (!isRecord(value) || contextIssues.length > 0) return uniqueSorted(issues);
  const bindings = buildBindings(context.upstream);
  for (const field of R_BINDING_FIELDS) {
    if (!canonicalEqual(value[field], bindings[field])) {
      issues.push(`execution_confirmation_upstream_binding_mismatch:${field}`);
    }
  }
  const allowlist = context.executionConfirmerAllowlist;
  const policy = context.verificationPolicy;
  const expected = {
    executionConfirmerAllowlistId: allowlist.executionConfirmerAllowlistId,
    executionConfirmerAllowlistHash: allowlist.executionConfirmerAllowlistHash,
    executionConfirmationPolicyId: policy.executionConfirmationPolicyId,
    executionConfirmationPolicyHash: policy.executionConfirmationPolicyHash,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    operatorKeyId: bindings.operatorKeyId,
    operatorIdentityHash: bindings.operatorIdentityHash,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (value[field] !== expectedValue) issues.push(`execution_confirmation_binding_mismatch:${field}`);
  }
  const normalized = normalizeExecutionConfirmerAllowlist(allowlist, context.upstream);
  const matches = normalized.entries.filter((entry) =>
    entry.operatorKeyId === value.operatorKeyId &&
    entry.operatorIdentityHash === value.operatorIdentityHash &&
    entry.fingerprint === value.executionOperatorPublicKeyFingerprint &&
    entry.allowedScopes.includes(value.confirmationScope) &&
    entry.allowedRoles.includes(value.operatorRole) && entry.revoked === false);
  if (matches.length !== 1) issues.push("execution_confirmation_operator_resolution_failed");
  const priorNonces = [bindings.requestNonceHash, bindings.intakeNonceHash,
    bindings.approvalResponseNonceHash, bindings.invocationNonceHash,
    bindings.claimNonceHash, bindings.operatorAuthorizationNonceHash,
    bindings.stepRRuntimeHandoffNonceHash];
  if (!isSha256(value.executionConfirmationNonceHash) ||
      priorNonces.includes(value.executionConfirmationNonceHash)) {
    issues.push("execution_confirmation_nonce_not_distinct");
  }
  if (context.priorExecutionConfirmationNonceHashes.includes(
    value.executionConfirmationNonceHash)) {
    issues.push("execution_confirmation_nonce_replay");
  }
  const issued = parseInstant(value.issuedAt);
  const expires = parseInstant(value.expiresAt);
  const now = parseInstant(evaluationClockInstant);
  const handoffClock = parseInstant(bindings.stepREvaluationClockInstant);
  const windowStart = parseInstant(bindings.observationWindowStartsAt);
  const windowExpires = parseInstant(bindings.observationWindowExpiresAt);
  const earliestExpiry = parseInstant(bindings.stepREarliestExpiry);
  if ([issued, expires, now, handoffClock, windowStart, windowExpires,
    earliestExpiry].some((instant) => instant === null)) {
    issues.push("execution_confirmation_time_invalid");
  } else {
    if (expires <= issued ||
        expires - issued > MAXIMUM_CONFIRMATION_LIFETIME_SECONDS * 1000) {
      issues.push("execution_confirmation_lifetime_invalid");
    }
    if (issued < handoffClock || issued < windowStart) {
      issues.push("execution_confirmation_issued_before_runtime_handoff");
    }
    if (expires > earliestExpiry || expires > windowExpires) {
      issues.push("execution_confirmation_expiry_binding_invalid");
    }
    if (now < handoffClock || now < windowStart || now >= earliestExpiry ||
        now >= windowExpires ||
        now < issued - ALLOWED_CLOCK_SKEW_SECONDS * 1000 || now >= expires) {
      issues.push("execution_confirmation_evaluation_time_invalid");
    }
    if (matches.length === 1 &&
        (issued < matches[0].validFromMs || expires > matches[0].validUntilMs)) {
      issues.push("execution_confirmation_key_validity_mismatch");
    }
  }
  if (issues.length === 0 && matches.length === 1) {
    let verified = false;
    try {
      verified = verifySignature(null,
        buildExecutionConfirmationSignaturePayload(without(value, "signatureBase64")),
        matches[0].publicKey, decodeCanonicalBase64(value.signatureBase64));
    } catch {}
    if (!verified) issues.push("execution_confirmation_signature_invalid");
  }
  return uniqueSorted(issues);
}

const LAUNCH_FIELDS = Object.freeze([
  "contractVersion", "oneRunRunnerLaunchPackageId", ...R_BINDING_FIELDS,
  "executionConfirmationId", "executionConfirmationHash",
  "executionConfirmationSignatureDigest", "executionConfirmerAllowlistId",
  "executionConfirmerAllowlistHash", "executionConfirmationPolicyId",
  "executionConfirmationPolicyHash", "runnerImplementationManifestId",
  "runnerImplementationManifestHash", "runnerArtifactId", "runnerArtifactSha256",
  "runnerSourceTreeSha256", "runnerCapabilityManifestSha256",
  "executionOperatorPublicKeyFingerprint", "confirmationScope",
  "orderedConfirmations", "handoffSequence", "evaluationClockInstant",
  "earliestExpiry", "executionConfirmationNonceHash",
  "priorExecutionConfirmationNonceContextDigest", "artifactRequirements",
  "claimRequirements", "transportRequirements", "receiptRequirements",
  "evidenceRequirements", "disposalRequirements", "maximumRunnerLaunchCount",
  "maximumArtifactLoadAttemptCount",
  "runtimeArtifactDigestVerificationRequiredLater",
  "executionConfirmationConsumptionRequiredLater",
  "operatorAuthorizationConsumptionRequiredLater",
  "runtimeDependencyBindingRequiredLater", "claimAcquisitionRequiredLater",
  "runnerAndAdapterLoadingRequiredLater", "adapterInvocationRequiredLater",
  "receiptPersistenceRequiredLater", "evidenceFinalizationRequiredLater",
  "environmentDisposalRequiredLater", "syntheticValidationOnly", "nonExecuting",
  "realExecutionConfirmationRecorded", "executionConfirmationConsumed",
  "operatorAuthorizationConsumed", "realRuntimeDependencyBound",
  "runnerRuntimeLoaded", "adapterRuntimeLoaded", "realClaimRequested",
  "realClaimPersisted", "realInvocationConsumed", "realAdapterInvoked",
  "realObservationCompleted", "evidencePersisted", "executionReceiptPersisted",
  "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "oneRunRunnerLaunchPackageHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "runnerLaunchSummaryId", ...R_BINDING_FIELDS,
  "executionConfirmationId", "executionConfirmationHash",
  "executionConfirmerAllowlistId", "executionConfirmerAllowlistHash",
  "executionConfirmationPolicyId", "executionConfirmationPolicyHash",
  "runnerImplementationManifestId", "runnerImplementationManifestHash",
  "oneRunRunnerLaunchPackageId", "oneRunRunnerLaunchPackageHash",
  "publicState", "stepRPackageRevalidated", "directUpstreamValidatorsPassed",
  "operatorContinuityValidated", "signatureValidated",
  "nonceReplayAndChronologyValidated", "runnerManifestValidated",
  "nonExecutingLaunchPackagePrepared", "syntheticValidationOnly",
  "rawMaterialPresent", ...FIXED_FALSE_FIELDS, "runnerLaunchSummaryHash",
]);
FIELD_SETS.launch = LAUNCH_FIELDS;
FIELD_SETS.summary = SUMMARY_FIELDS;

function buildOneRunRunnerLaunchPackage(stepRPacket, confirmation, allowlist,
  policy, manifest, evaluationClockInstant, priorNonceHashes) {
  const input = stepRPacket.runtimeHandoffInput;
  const loader = stepRPacket.adapterLoaderPolicy;
  const dependency = stepRPacket.runtimeDependencyPolicy;
  return sealContract({
    contractVersion: VERSIONS.launch,
    ...buildBindings(stepRPacket),
    executionConfirmationId: confirmation.executionConfirmationId,
    executionConfirmationHash: confirmation.executionConfirmationHash,
    executionConfirmationSignatureDigest: hashWithDomain(
      "FINPLE_STEP114_2X_S_EXECUTION_CONFIRMATION_SIGNATURE_DIGEST\0",
      confirmation.signatureBase64),
    executionConfirmerAllowlistId: allowlist.executionConfirmerAllowlistId,
    executionConfirmerAllowlistHash: allowlist.executionConfirmerAllowlistHash,
    executionConfirmationPolicyId: policy.executionConfirmationPolicyId,
    executionConfirmationPolicyHash: policy.executionConfirmationPolicyHash,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    runnerArtifactId: manifest.runnerArtifactId,
    runnerArtifactSha256: manifest.runnerArtifactSha256,
    runnerSourceTreeSha256: manifest.runnerSourceTreeSha256,
    runnerCapabilityManifestSha256: manifest.runnerCapabilityManifestSha256,
    executionOperatorPublicKeyFingerprint:
      confirmation.executionOperatorPublicKeyFingerprint,
    confirmationScope: confirmation.confirmationScope,
    operatorRole: confirmation.operatorRole,
    orderedConfirmations: [...confirmation.orderedConfirmations],
    handoffSequence: [...stepRPacket.oneRunExecutionHandoff.handoffSequence],
    evaluationClockInstant,
    earliestExpiry: stepRPacket.runtimePreconditionManifest.earliestExpiry,
    executionConfirmationNonceHash: confirmation.executionConfirmationNonceHash,
    priorExecutionConfirmationNonceContextDigest: hashWithDomain(
      "FINPLE_STEP114_2X_S_PRIOR_EXECUTION_CONFIRMATION_NONCE_CONTEXT\0",
      priorNonceHashes),
    artifactRequirements: {
      adapterArtifactManifestId: loader.stepQAdapterArtifactManifestId,
      adapterArtifactManifestHash: loader.stepQAdapterArtifactManifestHash,
      runnerImplementationManifestId: manifest.runnerImplementationManifestId,
      runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
      immutableArtifactRequired: true,
      digestVerificationBeforeLoadRequired: true,
      maximumArtifactLoadAttemptCount: 1,
    },
    claimRequirements: { ...dependency.claimStoreBinding },
    transportRequirements: { ...dependency.readOnlyTransportBinding },
    receiptRequirements: { ...dependency.executionReceiptBinding },
    evidenceRequirements: { ...dependency.evidenceFinalizationBinding },
    disposalRequirements: { ...dependency.environmentDisposalBinding },
    maximumRunnerLaunchCount: 1,
    maximumArtifactLoadAttemptCount: 1,
    maximumClaimAcquisitionCount: 1,
    maximumAdapterInvocationCount: 1,
    destinationCount: 1,
    observationCount: 1,
    runtimeArtifactDigestVerificationRequiredLater: true,
    executionConfirmationConsumptionRequiredLater: true,
    operatorAuthorizationConsumptionRequiredLater: true,
    runtimeDependencyBindingRequiredLater: true,
    claimAcquisitionRequiredLater: true,
    runnerAndAdapterLoadingRequiredLater: true,
    adapterInvocationRequiredLater: true,
    receiptPersistenceRequiredLater: true,
    evidenceFinalizationRequiredLater: true,
    environmentDisposalRequiredLater: true,
    syntheticValidationOnly: true,
    nonExecuting: true,
    realExecutionConfirmationRecorded: false,
    executionConfirmationConsumed: false,
    operatorAuthorizationConsumed: false,
    realRuntimeDependencyBound: false,
    runnerRuntimeLoaded: false,
    adapterRuntimeLoaded: false,
    realClaimRequested: false,
    realClaimPersisted: false,
    realInvocationConsumed: false,
    realAdapterInvoked: false,
    realObservationCompleted: false,
    evidencePersisted: false,
    executionReceiptPersisted: false,
    environmentDisposalExecuted: false,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "launch");
}
function validateOneRunRunnerLaunchPackage(value, stepRPacket, confirmation,
  allowlist, policy, manifest, evaluationClockInstant, priorNonceHashes) {
  const issues = [...validateEnvelope(value, "launch")];
  let expected;
  try {
    expected = buildOneRunRunnerLaunchPackage(stepRPacket, confirmation, allowlist,
      policy, manifest, evaluationClockInstant, priorNonceHashes);
  } catch { return uniqueSorted([...issues, "runner_launch_expected_construction_failed"]); }
  for (const field of LAUNCH_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`runner_launch_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}
function buildSummary(stepRPacket, confirmation, allowlist, policy, manifest,
  launch) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    ...buildBindings(stepRPacket),
    executionConfirmationId: confirmation.executionConfirmationId,
    executionConfirmationHash: confirmation.executionConfirmationHash,
    executionConfirmerAllowlistId: allowlist.executionConfirmerAllowlistId,
    executionConfirmerAllowlistHash: allowlist.executionConfirmerAllowlistHash,
    executionConfirmationPolicyId: policy.executionConfirmationPolicyId,
    executionConfirmationPolicyHash: policy.executionConfirmationPolicyHash,
    runnerImplementationManifestId: manifest.runnerImplementationManifestId,
    runnerImplementationManifestHash: manifest.runnerImplementationManifestHash,
    oneRunRunnerLaunchPackageId: launch.oneRunRunnerLaunchPackageId,
    oneRunRunnerLaunchPackageHash: launch.oneRunRunnerLaunchPackageHash,
    publicState: PUBLIC_STATES[1],
    stepRPackageRevalidated: true,
    directUpstreamValidatorsPassed: true,
    operatorContinuityValidated: true,
    signatureValidated: true,
    nonceReplayAndChronologyValidated: true,
    runnerManifestValidated: true,
    nonExecutingLaunchPackagePrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}
function validateSummary(value, stepRPacket, confirmation, allowlist, policy,
  manifest, launch) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(stepRPacket, confirmation, allowlist, policy, manifest, launch); }
  catch { return uniqueSorted([...issues, "runner_launch_summary_expected_construction_failed"]); }
  for (const field of SUMMARY_FIELDS) {
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`runner_launch_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}
function safeResult(status, summary = {}, launch = {}, issues = []) {
  const verified = status === PUBLIC_STATES[1];
  return {
    ok: verified,
    status,
    contractVersion: VERSIONS.summary,
    stepRPackageRevalidated: verified,
    directUpstreamValidatorsPassed: verified,
    operatorContinuityValidated: verified,
    signatureValidated: verified,
    nonceReplayAndChronologyValidated: verified,
    runnerManifestValidated: verified,
    nonExecutingLaunchPackagePrepared: verified,
    runnerLaunchSummary: verified ? summary : {},
    oneRunRunnerLaunchPackage: verified ? launch : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: verified ? [
      "synthetic_verification_does_not_record_consume_inspect_hash_resolve_load_bind_claim_invoke_observe_connect_execute_persist_dispose_or_deploy",
    ] : [],
  };
}
function evaluateRunnerLaunchPackage(packet) {
  if (packet === undefined || packet === null) return safeResult(PUBLIC_STATES[0]);
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "context", "executionConfirmation", "runnerImplementationManifest",
    "evaluationClockInstant",
  ])) return safeResult("blocked", {}, {}, ["runner_launch_packet_fields_invalid"]);
  try {
    const context = packet.context;
    const manifestIssues = validateRunnerImplementationManifest(
      packet.runnerImplementationManifest, context?.upstream);
    if (manifestIssues.length > 0) return safeResult("blocked", {}, {}, manifestIssues);
    const issues = validateSignedExecutionConfirmation(
      packet.executionConfirmation, context, packet.runnerImplementationManifest,
      packet.evaluationClockInstant);
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    const launch = buildOneRunRunnerLaunchPackage(
      context.upstream, packet.executionConfirmation,
      context.executionConfirmerAllowlist, context.verificationPolicy,
      packet.runnerImplementationManifest, packet.evaluationClockInstant,
      context.priorExecutionConfirmationNonceHashes);
    issues.push(...validateOneRunRunnerLaunchPackage(
      launch, context.upstream, packet.executionConfirmation,
      context.executionConfirmerAllowlist, context.verificationPolicy,
      packet.runnerImplementationManifest, packet.evaluationClockInstant,
      context.priorExecutionConfirmationNonceHashes));
    const summary = buildSummary(context.upstream, packet.executionConfirmation,
      context.executionConfirmerAllowlist, context.verificationPolicy,
      packet.runnerImplementationManifest, launch);
    issues.push(...validateSummary(summary, context.upstream,
      packet.executionConfirmation, context.executionConfirmerAllowlist,
      context.verificationPolicy, packet.runnerImplementationManifest, launch));
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues)
      : safeResult(PUBLIC_STATES[1], summary, launch);
  } catch {
    return safeResult("blocked", {}, {}, ["runner_launch_package_validation_failed"]);
  }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS,
  ATTESTATION_FIELDS,
  CONFIRMATION_SEQUENCE,
  EXECUTION_CONFIRMATION_SCOPE,
  EXECUTION_OPERATOR_ROLE,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  MAXIMUM_CONFIRMATION_LIFETIME_SECONDS,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  R_BINDING_FIELDS,
  RUNNER_CLASS,
  RUNNER_INTERFACE_VERSION,
  SIGNATURE_ALGORITHM,
  SPECS,
  VERSIONS,
  buildBindings,
  buildExecutionConfirmationPolicy,
  buildExecutionConfirmationSignaturePayload,
  buildExecutionConfirmerAllowlist,
  buildOneRunRunnerLaunchPackage,
  buildRunnerImplementationManifest,
  buildSummary,
  buildUnsignedExecutionConfirmation,
  canonicalJson,
  evaluateRunnerLaunchPackage,
  normalizeExecutionConfirmerAllowlist,
  safeResult,
  sealContract,
  sealSignedExecutionConfirmation,
  validateDirectStepRPackage,
  validateExecutionConfirmationContext,
  validateExecutionConfirmationPolicy,
  validateExecutionConfirmationShape,
  validateOneRunRunnerLaunchPackage,
  validateRunnerImplementationManifest,
  validateSignedExecutionConfirmation,
  validateSummary,
};
