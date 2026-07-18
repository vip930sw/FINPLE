"use strict";

const { createHash, createPublicKey, verify: verifySignature } = require("node:crypto");
const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const stepM = require("./metrics-cutover-live-observation-approval-response.cjs");
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  invocation: "metrics-cutover-live-observation-invocation-v1-step114-2x-n",
  allowlist: "metrics-cutover-live-observation-invoker-allowlist-v1-step114-2x-n",
  policy: "metrics-cutover-live-observation-invocation-verification-policy-v1-step114-2x-n",
  receipt: "metrics-cutover-live-observation-invocation-receipt-candidate-v1-step114-2x-n",
  summary: "metrics-cutover-live-observation-invocation-verification-summary-v1-step114-2x-n",
});
const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_live_observation_invocation",
  "signed_live_observation_invocation_verified",
  "blocked",
]);
const APPROVAL_SCOPE = "single_sanitized_disposable_environment_observation";
const INVOKER_ROLE = "metrics_live_observation_invoker";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_INVOCATION_LIFETIME_SECONDS = 45;
const ALLOWED_CLOCK_SKEW_SECONDS = 30;

const ATTESTATION_FIELDS = Object.freeze([
  "authorityPackageReviewed", "approvalSignatureBindingReviewed",
  "observationWindowReviewed", "singleUseNonceReviewed", "oneDestinationReviewed",
  "observationOnlyScopeReviewed", "noCredentialDisclosureConfirmed",
  "noConnectionPerformed", "noSqlExecutionPerformed", "noMigrationPerformed",
  "noScenarioExecutionPerformed", "noEvidenceCollectionStarted", "noDisposalPerformed",
]);
const REQUIRED_FALSE_FIELDS = Object.freeze([
  "selectionDecisionRecorded", "humanSelectionRecorded", "realEnvironmentClassSelected",
  "realEnvironmentProvisioned", "realTargetSelected", "provisioningEvidenceRecorded",
  "sanitizedObservationIntakeCollected", "sanitizedObservationIntakeRecorded",
  "liveObservationApprovalRequestSent", "liveObservationApprovalRecorded",
  "liveObservationApprovalResponseRecorded", "liveObservationApprovalSignatureConsumed",
  "liveObservationInvocationRecorded", "liveObservationInvocationSignatureConsumed",
  "liveObservationInvocationConsumed", "liveObservationAuthorityActivated",
  "providerResearchAuthorized", "providerSelectionAuthorized",
  "providerAccountAccessAuthorized", "realTargetSelectionAuthorized",
  "environmentProvisioningAuthorized", "environmentProvisioningExecuted",
  "credentialProvisioningAuthorized", "credentialProvisioningExecuted",
  "credentialUseAuthorized", "credentialInjected", "environmentObservationAuthorized",
  "environmentObservationExecuted", "providerConnectionAuthorized",
  "testDatabaseConnectionAuthorized", "productionDatabaseConnectionAuthorized",
  "oneTimeAuthorizationIssueAuthorized", "oneTimeAuthorizationIssued",
  "provisioningRunbookActivated", "sqlExecutionAuthorized", "migrationAuthorized",
  "scenarioExecutionAuthorized", "evidenceCollectionStarted",
  "environmentDisposalAuthorized", "environmentDisposalExecuted", "commitAuthorized",
  "pushAuthorized", "mergeAuthorized", "deploymentAuthorized",
  "productionPublicationAuthorized", "realInvocationRecorded", "invocationConsumed",
]);
const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepM.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const SPECS = Object.freeze({
  invocation: Object.freeze({ version: VERSIONS.invocation, idField: "invocationId", hashField: "invocationHash", prefix: "metrics-cutover-live-observation-invocation", idDomain: "FINPLE_STEP114_2X_N_LIVE_OBSERVATION_INVOCATION_ID\0", hashDomain: "FINPLE_STEP114_2X_N_LIVE_OBSERVATION_INVOCATION_HASH\0" }),
  allowlist: Object.freeze({ version: VERSIONS.allowlist, idField: "invokerAllowlistId", hashField: "invokerAllowlistHash", prefix: "metrics-cutover-live-observation-invoker-allowlist", idDomain: "FINPLE_STEP114_2X_N_INVOKER_ALLOWLIST_ID\0", hashDomain: "FINPLE_STEP114_2X_N_INVOKER_ALLOWLIST_HASH\0" }),
  policy: Object.freeze({ version: VERSIONS.policy, idField: "invocationVerificationPolicyId", hashField: "invocationVerificationPolicyHash", prefix: "metrics-cutover-live-observation-invocation-verification-policy", idDomain: "FINPLE_STEP114_2X_N_INVOCATION_VERIFICATION_POLICY_ID\0", hashDomain: "FINPLE_STEP114_2X_N_INVOCATION_VERIFICATION_POLICY_HASH\0" }),
  receipt: Object.freeze({ version: VERSIONS.receipt, idField: "invocationReceiptCandidateId", hashField: "invocationReceiptCandidateHash", prefix: "metrics-cutover-live-observation-invocation-receipt-candidate", idDomain: "FINPLE_STEP114_2X_N_LIVE_OBSERVATION_RECEIPT_CANDIDATE_ID\0", hashDomain: "FINPLE_STEP114_2X_N_LIVE_OBSERVATION_RECEIPT_CANDIDATE_HASH\0" }),
  summary: Object.freeze({ version: VERSIONS.summary, idField: "invocationVerificationSummaryId", hashField: "invocationVerificationSummaryHash", prefix: "metrics-cutover-live-observation-invocation-verification-summary", idDomain: "FINPLE_STEP114_2X_N_INVOCATION_VERIFICATION_SUMMARY_ID\0", hashDomain: "FINPLE_STEP114_2X_N_INVOCATION_VERIFICATION_SUMMARY_HASH\0" }),
});

const TRANSITIVE_BINDING_FIELDS = Object.freeze([
  "stepLApprovalRequestPreparationSummaryId", "stepLApprovalRequestPreparationSummaryHash",
  "sanitizedObservationIntakeRecordId", "sanitizedObservationIntakeRecordHash",
  "approvalRequestId", "approvalRequestHash",
  "stepKProvisioningEvidenceSummaryId", "stepKProvisioningEvidenceSummaryHash",
  "stepKProvisioningEvidenceId", "stepKProvisioningEvidenceHash",
  "stepKObservationIntakeTemplateId", "stepKObservationIntakeTemplateHash",
  "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
  "stepHRunPackageSummaryId", "stepHRunPackageSummaryHash",
  "stepHReadinessChecklistId", "stepHReadinessChecklistHash",
  "stepHSanitizedEnvironmentIntakeSchemaId", "stepHSanitizedEnvironmentIntakeSchemaHash",
  "stepHCredentialProvisioningBoundaryId", "stepHCredentialProvisioningBoundaryHash",
  "stepHDisposalResponsibilityPolicyId", "stepHDisposalResponsibilityPolicyHash",
  "stepHApprovalRequestPolicyId", "stepHApprovalRequestPolicyHash",
]);
const BINDING_FIELDS = Object.freeze([
  "stepMApprovalVerificationSummaryId", "stepMApprovalVerificationSummaryHash",
  "stepMObservationAuthorityPackageId", "stepMObservationAuthorityPackageHash",
  "stepMApprovalResponseId", "stepMApprovalResponseHash",
  "stepMApproverAllowlistId", "stepMApproverAllowlistHash",
  "stepMVerificationPolicyId", "stepMVerificationPolicyHash",
  ...TRANSITIVE_BINDING_FIELDS,
]);
const INVOCATION_FIELDS = Object.freeze([
  "contractVersion", "invocationId", ...BINDING_FIELDS,
  "approverSignerKeyId", "approverSignerIdentityHash", "approverSignatureDigest",
  "requestNonceHash", "intakeNonceHash", "approvalResponseNonceHash",
  "invocationNonceHash", "approvalScope", "invocationRole", "requestedOperationSet",
  "maximumObservationCount", "destinationCount", "observationWindowStartsAt",
  "observationWindowExpiresAt", "issuedAt", "expiresAt", "invokerKeyId",
  "invokerIdentityHash", "signatureAlgorithm", "attestations",
  "syntheticValidationOnly", "realInvocationRecorded", "invocationConsumed",
  "liveObservationAuthorityActivated", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "manualReviewRequired", "signatureBase64",
  "invocationHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "invokerKeyId", "invokerIdentityHash", "publicKeyPem", "allowedScopes",
  "allowedRoles", "revoked", "validFrom", "validUntil",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "invokerAllowlistId", "entries", "syntheticValidationOnly",
  "rawMaterialPresent", "invokerAllowlistHash",
]);
const POLICY_FIELDS = Object.freeze([
  "contractVersion", "invocationVerificationPolicyId", ...BINDING_FIELDS,
  "requiredApprovalScope", "requiredInvocationRole", "requiredOperationSet",
  "maximumObservationCount", "destinationCount", "requiredAttestations",
  "signatureAlgorithm", "maximumInvocationLifetimeSeconds", "allowedClockSkewSeconds",
  "distinctSignerRequired", "distinctNonceHashesRequired",
  "invocationNonceReplayProtectionRequired", "nonExecutingReceiptRequired",
  "authorityFalseFields", "rawMaterialPresent", "invocationVerificationPolicyHash",
]);
const RECEIPT_FIELDS = Object.freeze([
  "contractVersion", "invocationReceiptCandidateId", ...BINDING_FIELDS,
  "invocationId", "invocationHash", "invokerAllowlistId", "invokerAllowlistHash",
  "invocationVerificationPolicyId", "invocationVerificationPolicyHash",
  "invokerKeyId", "invokerIdentityHash", "invocationSignatureDigest",
  "approvalScope", "invocationRole", "requestedOperationSet",
  "maximumObservationCount", "destinationCount", "observationWindowStartsAt",
  "observationWindowExpiresAt", "requestNonceHash", "approvalResponseNonceHash",
  "invocationNonceHash", "issuedAt", "expiresAt", "syntheticValidationOnly",
  "nonExecuting", "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "invocationReceiptCandidateHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "invocationVerificationSummaryId", ...BINDING_FIELDS,
  "invocationId", "invocationHash", "invokerAllowlistId", "invokerAllowlistHash",
  "invocationVerificationPolicyId", "invocationVerificationPolicyHash",
  "invocationReceiptCandidateId", "invocationReceiptCandidateHash", "publicState",
  "signedInvocationVerified", "invokerAllowlistValidated", "signerSeparationValidated",
  "nonceAndExpiryValidated", "nonExecutingReceiptCandidatePrepared",
  "syntheticValidationOnly", "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "invocationVerificationSummaryHash",
]);
const FIELD_SETS = Object.freeze({ invocation: INVOCATION_FIELDS, allowlist: ALLOWLIST_FIELDS, policy: POLICY_FIELDS, receipt: RECEIPT_FIELDS, summary: SUMMARY_FIELDS });

function without(value, fields) {
  const excluded = new Set(Array.isArray(fields) ? fields : [fields]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key)));
}
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function sealContract(value, name) {
  const spec = SPECS[name];
  const withId = { ...value, [spec.idField]: `${spec.prefix}-${hashWithDomain(spec.idDomain, value)}` };
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}
function validateEnvelope(value, name) {
  const spec = SPECS[name];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) return [`${name}_fields_invalid`];
  const issues = [];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const body = name === "invocation"
    ? without(value, [spec.idField, "signatureBase64", spec.hashField])
    : without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const hashBody = name === "invocation"
    ? without(value, ["signatureBase64", spec.hashField])
    : { ...body, [spec.idField]: expectedId };
  if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, hashBody)) issues.push(`${name}_hash_invalid`);
  return issues;
}
function parseInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function validateHashArray(value, prefix) {
  if (!Array.isArray(value)) return [`${prefix}_invalid`];
  if (value.some((item) => !isSha256(item))) return [`${prefix}_hash_invalid`];
  if (new Set(value).size !== value.length) return [`${prefix}_duplicate`];
  if (!canonicalEqual(value, [...value].sort())) return [`${prefix}_not_sorted`];
  return [];
}
function decodeCanonicalBase64(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  return bytes.toString("base64") === value ? bytes : null;
}

function buildUpstream(stepMPacket, stepMObservationAuthorityPackage, stepMApprovalVerificationSummary) {
  return { stepMPacket, stepMObservationAuthorityPackage, stepMApprovalVerificationSummary };
}
function buildBindings(upstream) {
  const packet = upstream.stepMPacket;
  const authority = upstream.stepMObservationAuthorityPackage;
  const summary = upstream.stepMApprovalVerificationSummary;
  return {
    stepMApprovalVerificationSummaryId: summary.approvalVerificationSummaryId,
    stepMApprovalVerificationSummaryHash: summary.approvalVerificationSummaryHash,
    stepMObservationAuthorityPackageId: authority.observationAuthorityPackageId,
    stepMObservationAuthorityPackageHash: authority.observationAuthorityPackageHash,
    stepMApprovalResponseId: packet.approvalResponse.approvalResponseId,
    stepMApprovalResponseHash: packet.approvalResponse.approvalResponseHash,
    stepMApproverAllowlistId: packet.context.approverAllowlist.approverAllowlistId,
    stepMApproverAllowlistHash: packet.context.approverAllowlist.approverAllowlistHash,
    stepMVerificationPolicyId: packet.context.verificationPolicy.verificationPolicyId,
    stepMVerificationPolicyHash: packet.context.verificationPolicy.verificationPolicyHash,
    ...stepM.buildBindings(packet.context.upstream),
  };
}
function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, ["stepMPacket", "stepMObservationAuthorityPackage", "stepMApprovalVerificationSummary"])) return ["step_m_upstream_fields_invalid"];
  const p = upstream.stepMPacket;
  if (!isRecord(p) || !hasExactKeys(p, ["context", "approvalResponse", "evaluationClockInstant"])) return ["step_m_packet_fields_invalid"];
  const mContext = p.context;
  const lUpstream = mContext?.upstream;
  const lPacket = lUpstream?.stepLPacket;
  if (!isRecord(lPacket)) return ["step_l_packet_missing"];
  const issues = [
    ...stepM.validateUpstream(lUpstream),
    ...stepM.validateApprovalContext(mContext),
    ...stepM.validateSignedApprovalResponse(p.approvalResponse, mContext, p.evaluationClockInstant),
    ...stepM.validateObservationAuthorityPackage(upstream.stepMObservationAuthorityPackage, p.approvalResponse, mContext),
    ...stepM.validateVerificationPolicy(mContext.verificationPolicy, lUpstream),
    ...stepM.validateSummary(upstream.stepMApprovalVerificationSummary, p.approvalResponse, mContext, upstream.stepMObservationAuthorityPackage),
    ...stepL.validateUpstream(lPacket.intakeContext.upstream),
    ...stepL.validateIntakeContext(lPacket.intakeContext),
    ...stepL.validateSanitizedObservationIntake(lPacket.intake, lPacket.intakeContext, lPacket.evaluationClockInstant),
    ...stepL.validateApprovalRequestEnvelope(lPacket.approvalRequest, lPacket.intake, lPacket.intakeContext, lPacket.requestContext, lPacket.evaluationClockInstant),
    ...stepL.validateSummary(lUpstream.stepLSummary, lPacket.intake, lPacket.approvalRequest, lPacket.intakeContext.upstream),
    ...stepH.validateRequestContext(lPacket.requestContext),
    ...stepH.validateLiveObservationApprovalRequest(lPacket.approvalRequest, lPacket.requestContext, lPacket.evaluationClockInstant),
  ];
  let expectedAuthority; let expectedSummary;
  try {
    expectedAuthority = stepM.buildObservationAuthorityPackage(p.approvalResponse, mContext);
    expectedSummary = stepM.buildSummary(p.approvalResponse, mContext, expectedAuthority);
  } catch {}
  if (!expectedAuthority || !canonicalEqual(expectedAuthority, upstream.stepMObservationAuthorityPackage)) issues.push("step_m_authority_binding_mismatch");
  if (!expectedSummary || !canonicalEqual(expectedSummary, upstream.stepMApprovalVerificationSummary)) issues.push("step_m_summary_binding_mismatch");
  return uniqueSorted(issues);
}

function buildInvokerAllowlist(publicKeyPem, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.allowlist,
    entries: [{
      invokerKeyId: "synthetic-live-observation-invoker-key",
      invokerIdentityHash: "d".repeat(64), publicKeyPem,
      allowedScopes: [APPROVAL_SCOPE], allowedRoles: [INVOKER_ROLE], revoked: false,
      validFrom: "2026-07-18T00:03:00.000Z", validUntil: "2026-07-18T00:04:00.000Z",
      ...(overrides.entry || {}),
    }],
    syntheticValidationOnly: true, rawMaterialPresent: false, ...overrides.contract,
  }, "allowlist");
}
function normalizeInvokerAllowlist(value, upstream) {
  const issues = [...validateEnvelope(value, "allowlist")];
  if (!isRecord(value) || !Array.isArray(value.entries) || value.entries.length === 0) return { ok: false, entries: [], issues: uniqueSorted([...issues, "invoker_allowlist_entries_invalid"]) };
  if (value.entries.length !== 1) issues.push("invoker_allowlist_entries_invalid");
  const ids = new Set(); const identities = new Set(); const keys = new Set(); const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `invoker_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) { issues.push(`${prefix}_fields_invalid`); return; }
    if (!isSafeIdentity(entry.invokerKeyId) || entry.invokerKeyId === "*") issues.push(`${prefix}_key_id_invalid`);
    else if (ids.has(entry.invokerKeyId)) issues.push("invoker_allowlist_key_id_duplicate"); else ids.add(entry.invokerKeyId);
    if (!isSha256(entry.invokerIdentityHash)) issues.push(`${prefix}_identity_hash_invalid`);
    else if (identities.has(entry.invokerIdentityHash)) issues.push("invoker_allowlist_identity_duplicate"); else identities.add(entry.invokerIdentityHash);
    if (!canonicalEqual(entry.allowedScopes, [APPROVAL_SCOPE])) issues.push(`${prefix}_scope_invalid`);
    if (!canonicalEqual(entry.allowedRoles, [INVOKER_ROLE])) issues.push(`${prefix}_role_invalid`);
    if (entry.revoked !== false) issues.push(`${prefix}_revoked`);
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (from === null || until === null || until <= from) issues.push(`${prefix}_validity_invalid`);
    let publicKey = null; let fingerprint = "";
    try {
      publicKey = createPublicKey(entry.publicKeyPem);
      if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519") issues.push(`${prefix}_public_key_not_ed25519`);
      else {
        fingerprint = createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
        if (keys.has(fingerprint)) issues.push("invoker_allowlist_public_key_duplicate"); else keys.add(fingerprint);
      }
    } catch { issues.push(`${prefix}_public_key_invalid`); }
    entries.push({ ...entry, publicKey, fingerprint, validFromMs: from, validUntilMs: until });
  });
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false) issues.push("invoker_allowlist_synthetic_boundary_invalid");
  if (isRecord(upstream)) {
    const approver = upstream.stepMObservationAuthorityPackage;
    const approverNormalized = stepM.normalizeApproverAllowlist(upstream.stepMPacket?.context?.approverAllowlist);
    for (const entry of entries) {
      if (entry.invokerKeyId === approver?.signerKeyId) issues.push("invoker_approver_key_id_must_differ");
      if (entry.invokerIdentityHash === approver?.signerIdentityHash) issues.push("invoker_approver_identity_hash_must_differ");
      if (approverNormalized.entries.some((candidate) => candidate.fingerprint === entry.fingerprint)) issues.push("invoker_approver_public_key_must_differ");
    }
  }
  return { ok: issues.length === 0, entries: issues.length === 0 ? entries : [], issues: uniqueSorted(issues) };
}

function buildVerificationPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.policy, ...buildBindings(upstream),
    requiredApprovalScope: APPROVAL_SCOPE, requiredInvocationRole: INVOKER_ROLE,
    requiredOperationSet: [...stepH.REQUESTED_OPERATION_SET], maximumObservationCount: 1,
    destinationCount: 1, requiredAttestations: [...ATTESTATION_FIELDS],
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    maximumInvocationLifetimeSeconds: MAXIMUM_INVOCATION_LIFETIME_SECONDS,
    allowedClockSkewSeconds: ALLOWED_CLOCK_SKEW_SECONDS, distinctSignerRequired: true,
    distinctNonceHashesRequired: true, invocationNonceReplayProtectionRequired: true,
    nonExecutingReceiptRequired: true, authorityFalseFields: [...FIXED_FALSE_FIELDS],
    rawMaterialPresent: false,
  }, "policy");
}
function validateVerificationPolicy(value, upstream) {
  const issues = [...validateEnvelope(value, "policy")];
  let expected; try { expected = buildVerificationPolicy(upstream); } catch { return uniqueSorted([...issues, "invocation_policy_expected_construction_failed"]); }
  for (const field of POLICY_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`invocation_policy_field_invalid:${field}`);
  return uniqueSorted(issues);
}
function validateInvocationContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, ["upstream", "invokerAllowlist", "verificationPolicy", "priorInvocationNonceHashes"])) return ["invocation_context_fields_invalid"];
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...normalizeInvokerAllowlist(context.invokerAllowlist, context.upstream).issues,
    ...validateVerificationPolicy(context.verificationPolicy, context.upstream),
    ...validateHashArray(context.priorInvocationNonceHashes, "prior_invocation_nonce_hashes"),
  ]);
}

function buildUnsignedInvocation(upstream, overrides = {}) {
  const packet = upstream.stepMPacket;
  const authority = upstream.stepMObservationAuthorityPackage;
  const lPacket = packet.context.upstream.stepLPacket;
  const body = {
    contractVersion: VERSIONS.invocation, ...buildBindings(upstream),
    approverSignerKeyId: authority.signerKeyId,
    approverSignerIdentityHash: authority.signerIdentityHash,
    approverSignatureDigest: authority.signatureDigest,
    requestNonceHash: authority.requestNonceHash,
    intakeNonceHash: lPacket.intake.intakeNonceHash,
    approvalResponseNonceHash: authority.responseNonceHash,
    invocationNonceHash: "c".repeat(64), approvalScope: APPROVAL_SCOPE,
    invocationRole: INVOKER_ROLE, requestedOperationSet: [...stepH.REQUESTED_OPERATION_SET],
    maximumObservationCount: 1, destinationCount: 1,
    observationWindowStartsAt: authority.observationWindowStartsAt,
    observationWindowExpiresAt: authority.observationWindowExpiresAt,
    issuedAt: "2026-07-18T00:03:10.000Z", expiresAt: "2026-07-18T00:03:45.000Z",
    invokerKeyId: "synthetic-live-observation-invoker-key",
    invokerIdentityHash: "d".repeat(64), signatureAlgorithm: SIGNATURE_ALGORITHM,
    attestations: Object.fromEntries(ATTESTATION_FIELDS.map((field) => [field, true])),
    syntheticValidationOnly: true, realInvocationRecorded: false,
    invocationConsumed: false, liveObservationAuthorityActivated: false,
    rawMaterialPresent: false, providerSpecificMaterialPresent: false,
    manualReviewRequired: false, ...overrides,
  };
  const withId = { ...body, invocationId: `${SPECS.invocation.prefix}-${hashWithDomain(SPECS.invocation.idDomain, body)}` };
  return { ...withId, invocationHash: hashWithDomain(SPECS.invocation.hashDomain, withId) };
}
function buildInvocationSignaturePayload(unsignedInvocation) {
  if (!isRecord(unsignedInvocation) || !hasExactKeys(unsignedInvocation, INVOCATION_FIELDS.filter((field) => field !== "signatureBase64"))) throw new TypeError("unsigned_invocation_fields_invalid");
  return Buffer.concat([
    Buffer.from("FINPLE_STEP114_2X_N_LIVE_OBSERVATION_INVOCATION_SIGNATURE\0", "utf8"),
    Buffer.from(canonicalJson(unsignedInvocation), "utf8"),
  ]);
}
function sealSignedInvocation(unsignedInvocation, signatureBase64) {
  return { ...unsignedInvocation, signatureBase64 };
}
function validateInvocationShape(value) {
  const issues = [...validateEnvelope(value, "invocation")];
  if (!isRecord(value)) return uniqueSorted(issues);
  for (const field of ["approverSignerIdentityHash", "approverSignatureDigest", "requestNonceHash", "intakeNonceHash", "approvalResponseNonceHash", "invocationNonceHash", "invokerIdentityHash"]) if (!isSha256(value[field])) issues.push(`invocation_hash_invalid:${field}`);
  if (!isSafeIdentity(value.approverSignerKeyId) || !isSafeIdentity(value.invokerKeyId) || value.invokerKeyId === "*") issues.push("invocation_signer_key_id_invalid");
  if (value.approvalScope !== APPROVAL_SCOPE || value.invocationRole !== INVOKER_ROLE) issues.push("invocation_scope_role_invalid");
  if (!canonicalEqual(value.requestedOperationSet, stepH.REQUESTED_OPERATION_SET) || value.maximumObservationCount !== 1 || value.destinationCount !== 1) issues.push("invocation_operation_scope_invalid");
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) issues.push("invocation_signature_algorithm_invalid");
  if (!hasExactKeys(value.attestations, ATTESTATION_FIELDS) || ATTESTATION_FIELDS.some((field) => value.attestations?.[field] !== true)) issues.push("invocation_attestations_invalid");
  if (value.syntheticValidationOnly !== true || value.realInvocationRecorded !== false || value.invocationConsumed !== false || value.liveObservationAuthorityActivated !== false || value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false || value.manualReviewRequired !== false) issues.push("invocation_synthetic_boundary_invalid");
  const signature = decodeCanonicalBase64(value.signatureBase64);
  if (!signature || signature.length !== 64) issues.push("invocation_signature_encoding_invalid");
  return uniqueSorted(issues);
}
function validateSignedInvocation(value, context, evaluationClockInstant) {
  const contextIssues = validateInvocationContext(context);
  const issues = [...validateInvocationShape(value), ...contextIssues];
  if (!isRecord(value) || contextIssues.length > 0) return uniqueSorted(issues);
  const upstream = context.upstream; const authority = upstream.stepMObservationAuthorityPackage;
  const mPacket = upstream.stepMPacket; const lPacket = mPacket.context.upstream.stepLPacket;
  const bindings = buildBindings(upstream);
  for (const field of BINDING_FIELDS) if (value[field] !== bindings[field]) issues.push(`invocation_upstream_binding_mismatch:${field}`);
  for (const [field, expected] of Object.entries({
    approverSignerKeyId: authority.signerKeyId,
    approverSignerIdentityHash: authority.signerIdentityHash,
    approverSignatureDigest: authority.signatureDigest,
    requestNonceHash: authority.requestNonceHash,
    intakeNonceHash: lPacket.intake.intakeNonceHash,
    approvalResponseNonceHash: authority.responseNonceHash,
    observationWindowStartsAt: authority.observationWindowStartsAt,
    observationWindowExpiresAt: authority.observationWindowExpiresAt,
  })) if (value[field] !== expected) issues.push(`invocation_authority_binding_mismatch:${field}`);
  if (value.invokerKeyId === authority.signerKeyId) issues.push("invocation_approver_invoker_key_id_equal");
  if (value.invokerIdentityHash === authority.signerIdentityHash) issues.push("invocation_approver_invoker_identity_hash_equal");
  const boundNonces = [value.requestNonceHash, value.intakeNonceHash, value.approvalResponseNonceHash, value.invocationNonceHash];
  if (new Set(boundNonces).size !== boundNonces.length) issues.push("invocation_nonce_not_distinct");
  if (context.priorInvocationNonceHashes.includes(value.invocationNonceHash)) issues.push("invocation_nonce_replay");
  const normalized = normalizeInvokerAllowlist(context.invokerAllowlist, upstream);
  const matches = normalized.entries.filter((entry) => entry.invokerKeyId === value.invokerKeyId && entry.invokerIdentityHash === value.invokerIdentityHash && entry.allowedScopes.includes(value.approvalScope) && entry.allowedRoles.includes(value.invocationRole) && entry.revoked === false);
  if (matches.length !== 1) issues.push("invocation_invoker_resolution_failed");
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const now = parseInstant(evaluationClockInstant); const authorityIssued = parseInstant(authority.issuedAt);
  const authorityExpires = parseInstant(authority.expiresAt);
  const responseIssued = parseInstant(mPacket.approvalResponse.issuedAt);
  const requestIssued = parseInstant(lPacket.approvalRequest.issuedAt);
  const requestExpires = parseInstant(lPacket.approvalRequest.expiresAt);
  const intakeExpires = parseInstant(lPacket.intake.expiresAt);
  const templateExpires = parseInstant(lPacket.intakeContext.upstream.stepKPacket.template.expiresAt);
  const windowStart = parseInstant(authority.observationWindowStartsAt);
  const windowExpires = parseInstant(authority.observationWindowExpiresAt);
  if ([issued, expires, now, authorityIssued, authorityExpires, responseIssued, requestIssued, requestExpires, intakeExpires, templateExpires, windowStart, windowExpires].some((instant) => instant === null)) issues.push("invocation_time_invalid");
  else {
    if (expires <= issued || expires - issued > MAXIMUM_INVOCATION_LIFETIME_SECONDS * 1000) issues.push("invocation_lifetime_invalid");
    if (issued < Math.max(authorityIssued, responseIssued, requestIssued, windowStart - ALLOWED_CLOCK_SKEW_SECONDS * 1000)) issues.push("invocation_issued_before_authority_or_window");
    if (expires > Math.min(authorityExpires, requestExpires, intakeExpires, templateExpires, windowExpires)) issues.push("invocation_outlives_authority_or_window");
    if (now < issued - ALLOWED_CLOCK_SKEW_SECONDS * 1000 || now >= expires) issues.push("invocation_evaluation_time_invalid");
    if (matches.length === 1 && (issued < matches[0].validFromMs || expires > matches[0].validUntilMs)) issues.push("invocation_invoker_validity_mismatch");
  }
  if (issues.length === 0 && matches.length === 1) {
    let verified = false;
    try { verified = verifySignature(null, buildInvocationSignaturePayload(without(value, "signatureBase64")), matches[0].publicKey, decodeCanonicalBase64(value.signatureBase64)); } catch {}
    if (!verified) issues.push("invocation_signature_invalid");
  }
  return uniqueSorted(issues);
}

function buildReceiptCandidate(invocation, context) {
  return sealContract({
    contractVersion: VERSIONS.receipt, ...buildBindings(context.upstream),
    invocationId: invocation.invocationId, invocationHash: invocation.invocationHash,
    invokerAllowlistId: context.invokerAllowlist.invokerAllowlistId,
    invokerAllowlistHash: context.invokerAllowlist.invokerAllowlistHash,
    invocationVerificationPolicyId: context.verificationPolicy.invocationVerificationPolicyId,
    invocationVerificationPolicyHash: context.verificationPolicy.invocationVerificationPolicyHash,
    invokerKeyId: invocation.invokerKeyId, invokerIdentityHash: invocation.invokerIdentityHash,
    invocationSignatureDigest: createHash("sha256").update(decodeCanonicalBase64(invocation.signatureBase64)).digest("hex"),
    approvalScope: APPROVAL_SCOPE, invocationRole: INVOKER_ROLE,
    requestedOperationSet: [...stepH.REQUESTED_OPERATION_SET], maximumObservationCount: 1,
    destinationCount: 1, observationWindowStartsAt: invocation.observationWindowStartsAt,
    observationWindowExpiresAt: invocation.observationWindowExpiresAt,
    requestNonceHash: invocation.requestNonceHash,
    approvalResponseNonceHash: invocation.approvalResponseNonceHash,
    invocationNonceHash: invocation.invocationNonceHash,
    issuedAt: invocation.issuedAt, expiresAt: invocation.expiresAt,
    syntheticValidationOnly: true, nonExecuting: true, rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "receipt");
}
function validateReceiptCandidate(value, invocation, context) {
  const issues = [...validateEnvelope(value, "receipt")];
  let expected; try { expected = buildReceiptCandidate(invocation, context); } catch { return uniqueSorted([...issues, "receipt_candidate_expected_construction_failed"]); }
  for (const field of RECEIPT_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`receipt_candidate_field_invalid:${field}`);
  return uniqueSorted(issues);
}
function buildSummary(invocation, context, receipt) {
  return sealContract({
    contractVersion: VERSIONS.summary, ...buildBindings(context.upstream),
    invocationId: invocation.invocationId, invocationHash: invocation.invocationHash,
    invokerAllowlistId: context.invokerAllowlist.invokerAllowlistId,
    invokerAllowlistHash: context.invokerAllowlist.invokerAllowlistHash,
    invocationVerificationPolicyId: context.verificationPolicy.invocationVerificationPolicyId,
    invocationVerificationPolicyHash: context.verificationPolicy.invocationVerificationPolicyHash,
    invocationReceiptCandidateId: receipt.invocationReceiptCandidateId,
    invocationReceiptCandidateHash: receipt.invocationReceiptCandidateHash,
    publicState: "signed_live_observation_invocation_verified",
    signedInvocationVerified: true, invokerAllowlistValidated: true,
    signerSeparationValidated: true, nonceAndExpiryValidated: true,
    nonExecutingReceiptCandidatePrepared: true, syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}
function validateSummary(value, invocation, context, receipt) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected; try { expected = buildSummary(invocation, context, receipt); } catch { return uniqueSorted([...issues, "invocation_summary_expected_construction_failed"]); }
  for (const field of SUMMARY_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`invocation_summary_field_invalid:${field}`);
  return uniqueSorted(issues);
}
function safeResult(status, summary = {}, receipt = {}, issues = []) {
  const verified = status === "signed_live_observation_invocation_verified";
  return {
    ok: verified, status, contractVersion: VERSIONS.summary,
    signedInvocationVerified: verified, nonExecutingReceiptCandidatePrepared: verified,
    invocationVerificationSummary: verified ? summary : {},
    invocationReceiptCandidate: verified ? receipt : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues), manualReviewRequired: status === "blocked",
    warningIssues: verified ? ["synthetic_verification_does_not_send_consume_record_activate_observe_connect_execute_collect_dispose_or_persist"] : [],
  };
}
function evaluateSignedLiveObservationInvocationPackage(packet) {
  if (packet === undefined || packet === null) return safeResult("awaiting_external_signed_live_observation_invocation");
  if (!isRecord(packet) || !hasExactKeys(packet, ["context", "invocation", "evaluationClockInstant"])) return safeResult("blocked", {}, {}, ["signed_invocation_packet_fields_invalid"]);
  try {
    const issues = validateSignedInvocation(packet.invocation, packet.context, packet.evaluationClockInstant);
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    const receipt = buildReceiptCandidate(packet.invocation, packet.context);
    issues.push(...validateReceiptCandidate(receipt, packet.invocation, packet.context));
    const summary = buildSummary(packet.invocation, packet.context, receipt);
    issues.push(...validateSummary(summary, packet.invocation, packet.context, receipt));
    canonicalJson(receipt); canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues)
      : safeResult("signed_live_observation_invocation_verified", summary, receipt);
  } catch { return safeResult("blocked", {}, {}, ["signed_live_observation_invocation_validation_failed"]); }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS, APPROVAL_SCOPE, ATTESTATION_FIELDS, BINDING_FIELDS,
  FIELD_SETS, FIXED_FALSE_FIELDS, INVOKER_ROLE, MAXIMUM_INVOCATION_LIFETIME_SECONDS,
  PUBLIC_STATES, REQUIRED_FALSE_FIELDS, SIGNATURE_ALGORITHM, SPECS, VERSIONS,
  buildBindings, buildInvocationSignaturePayload, buildInvokerAllowlist,
  buildReceiptCandidate, buildSummary, buildUnsignedInvocation, buildUpstream,
  buildVerificationPolicy, evaluateSignedLiveObservationInvocationPackage,
  normalizeInvokerAllowlist, safeResult, sealContract, sealSignedInvocation,
  validateInvocationContext, validateInvocationShape, validateReceiptCandidate,
  validateSignedInvocation, validateSummary, validateUpstream, validateVerificationPolicy,
};
