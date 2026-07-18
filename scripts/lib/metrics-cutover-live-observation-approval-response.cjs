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
const stepL = require("./metrics-cutover-sanitized-observation-intake.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  response: "metrics-cutover-live-observation-approval-response-v1-step114-2x-m",
  allowlist: "metrics-cutover-live-observation-approver-allowlist-v1-step114-2x-m",
  policy: "metrics-cutover-live-observation-approval-verification-policy-v1-step114-2x-m",
  authority: "metrics-cutover-live-observation-authority-package-v1-step114-2x-m",
  summary: "metrics-cutover-live-observation-approval-verification-summary-v1-step114-2x-m",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_signed_live_observation_approval_response",
  "signed_live_observation_approval_response_verified",
  "blocked",
]);
const APPROVAL_SCOPE = "single_sanitized_disposable_environment_observation";
const APPROVER_ROLE = "metrics_live_observation_approver";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_RESPONSE_LIFETIME_SECONDS = 60;
const ALLOWED_CLOCK_SKEW_SECONDS = 30;

const ATTESTATION_FIELDS = Object.freeze([
  "requestReviewed",
  "sanitizedIntakeBindingsReviewed",
  "observationWindowReviewed",
  "oneDestinationReviewed",
  "observationOnlyScopeReviewed",
  "noCredentialDisclosureConfirmed",
  "noConnectionAuthorityGranted",
  "noSqlAuthorityGranted",
  "noMigrationAuthorityGranted",
  "noScenarioAuthorityGranted",
  "noDisposalAuthorityGranted",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
  "selectionDecisionRecorded", "humanSelectionRecorded", "realEnvironmentClassSelected",
  "realEnvironmentProvisioned", "realTargetSelected", "provisioningEvidenceRecorded",
  "sanitizedObservationIntakeCollected", "sanitizedObservationIntakeRecorded",
  "liveObservationApprovalRequestSent", "liveObservationApprovalRecorded",
  "liveObservationApprovalResponseRecorded", "liveObservationApprovalSignatureConsumed",
  "approvalRequestSent", "realApprovalRecorded", "approvalResponseRecorded",
  "liveObservationAuthorityActivated", "providerResearchAuthorized",
  "providerSelectionAuthorized", "providerAccountAccessAuthorized",
  "realTargetSelectionAuthorized", "environmentProvisioningAuthorized",
  "environmentProvisioningExecuted", "credentialProvisioningAuthorized",
  "credentialProvisioningExecuted", "credentialUseAuthorized", "credentialInjected",
  "environmentObservationAuthorized", "environmentObservationExecuted",
  "providerConnectionAuthorized", "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized", "oneTimeAuthorizationIssueAuthorized",
  "oneTimeAuthorizationIssued", "provisioningRunbookActivated", "sqlExecutionAuthorized",
  "migrationAuthorized", "scenarioExecutionAuthorized", "evidenceCollectionStarted",
  "environmentDisposalAuthorized", "environmentDisposalExecuted", "commitAuthorized",
  "pushAuthorized", "mergeAuthorized", "deploymentAuthorized",
  "productionPublicationAuthorized",
]);
const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepL.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const SPECS = Object.freeze({
  response: Object.freeze({ version: VERSIONS.response, idField: "approvalResponseId", hashField: "approvalResponseHash", prefix: "metrics-cutover-live-observation-approval-response", idDomain: "FINPLE_STEP114_2X_M_LIVE_OBSERVATION_APPROVAL_RESPONSE_ID\0", hashDomain: "FINPLE_STEP114_2X_M_LIVE_OBSERVATION_APPROVAL_RESPONSE_HASH\0" }),
  allowlist: Object.freeze({ version: VERSIONS.allowlist, idField: "approverAllowlistId", hashField: "approverAllowlistHash", prefix: "metrics-cutover-live-observation-approver-allowlist", idDomain: "FINPLE_STEP114_2X_M_APPROVER_ALLOWLIST_ID\0", hashDomain: "FINPLE_STEP114_2X_M_APPROVER_ALLOWLIST_HASH\0" }),
  policy: Object.freeze({ version: VERSIONS.policy, idField: "verificationPolicyId", hashField: "verificationPolicyHash", prefix: "metrics-cutover-live-observation-approval-verification-policy", idDomain: "FINPLE_STEP114_2X_M_VERIFICATION_POLICY_ID\0", hashDomain: "FINPLE_STEP114_2X_M_VERIFICATION_POLICY_HASH\0" }),
  authority: Object.freeze({ version: VERSIONS.authority, idField: "observationAuthorityPackageId", hashField: "observationAuthorityPackageHash", prefix: "metrics-cutover-live-observation-authority-package", idDomain: "FINPLE_STEP114_2X_M_OBSERVATION_AUTHORITY_PACKAGE_ID\0", hashDomain: "FINPLE_STEP114_2X_M_OBSERVATION_AUTHORITY_PACKAGE_HASH\0" }),
  summary: Object.freeze({ version: VERSIONS.summary, idField: "approvalVerificationSummaryId", hashField: "approvalVerificationSummaryHash", prefix: "metrics-cutover-live-observation-approval-verification-summary", idDomain: "FINPLE_STEP114_2X_M_APPROVAL_VERIFICATION_SUMMARY_ID\0", hashDomain: "FINPLE_STEP114_2X_M_APPROVAL_VERIFICATION_SUMMARY_HASH\0" }),
});

const BINDING_FIELDS = Object.freeze([
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
const RESPONSE_FIELDS = Object.freeze([
  "contractVersion", "approvalResponseId", ...BINDING_FIELDS,
  "requestNonceHash", "intakeNonceHash", "responseNonceHash", "decision",
  "approvalScope", "approverRole", "requestedOperationSet", "maximumObservationCount",
  "destinationCount",
  "observationWindowStartsAt", "observationWindowExpiresAt", "issuedAt", "expiresAt",
  "signerKeyId", "signerIdentityHash",
  "signatureAlgorithm", "attestations", "syntheticValidationOnly", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "manualReviewRequired", "realApprovalRecorded",
  "approvalRequestSent",
  "signatureBase64", "approvalResponseHash",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId", "signerIdentityHash", "publicKeyPem", "allowedScopes",
  "allowedRoles", "revoked", "validFrom", "validUntil",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "approverAllowlistId", "entries", "syntheticValidationOnly",
  "rawMaterialPresent", "approverAllowlistHash",
]);
const POLICY_FIELDS = Object.freeze([
  "contractVersion", "verificationPolicyId", ...BINDING_FIELDS,
  "allowedDecisions", "requiredApprovalScope", "requiredApproverRole",
  "requiredOperationSet", "maximumObservationCount", "requiredAttestations",
  "requiredDestinationCount",
  "signatureAlgorithm", "maximumResponseLifetimeSeconds", "allowedClockSkewSeconds",
  "distinctNonceHashesRequired", "responseNonceReplayProtectionRequired",
  "nonExecutingAuthorityRequired", "authorityFalseFields", "rawMaterialPresent",
  "verificationPolicyHash",
]);
const AUTHORITY_FIELDS = Object.freeze([
  "contractVersion", "observationAuthorityPackageId", ...BINDING_FIELDS,
  "approvalResponseId", "approvalResponseHash", "approverAllowlistId",
  "approverAllowlistHash", "verificationPolicyId", "verificationPolicyHash",
  "signerKeyId", "signerIdentityHash", "signatureDigest", "approvalScope",
  "approverRole", "authorizedOperationSet", "maximumObservationCount",
  "destinationCount",
  "observationWindowStartsAt", "observationWindowExpiresAt", "requestNonceHash",
  "responseNonceHash", "issuedAt", "expiresAt", "nonExecuting", "rawMaterialPresent",
  "syntheticValidationOnly",
  ...FIXED_FALSE_FIELDS, "observationAuthorityPackageHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "approvalVerificationSummaryId", ...BINDING_FIELDS,
  "approvalResponseId", "approvalResponseHash", "approverAllowlistId",
  "approverAllowlistHash", "verificationPolicyId", "verificationPolicyHash",
  "observationAuthorityPackageId", "observationAuthorityPackageHash", "publicState",
  "signedApprovalResponseVerified", "approverAllowlistValidated",
  "nonceAndExpiryValidated", "nonExecutingObservationAuthorityPrepared",
  "syntheticValidationOnly", "rawMaterialPresent", ...FIXED_FALSE_FIELDS,
  "approvalVerificationSummaryHash",
]);
const FIELD_SETS = Object.freeze({ response: RESPONSE_FIELDS, allowlist: ALLOWLIST_FIELDS, policy: POLICY_FIELDS, authority: AUTHORITY_FIELDS, summary: SUMMARY_FIELDS });

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
  const body = name === "response"
    ? without(value, [spec.idField, "signatureBase64", spec.hashField])
    : without(value, [spec.idField, spec.hashField]);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, body)}`;
  if (value[spec.idField] !== expectedId) issues.push(`${name}_id_invalid`);
  const hashBody = name === "response"
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
function buildBindings(upstream) {
  const packet = upstream.stepLPacket;
  const summary = upstream.stepLSummary;
  const contracts = packet.requestContext.contracts;
  const hSummary = packet.requestContext.runPackageSummary;
  return {
    stepLApprovalRequestPreparationSummaryId: summary.approvalRequestPreparationSummaryId,
    stepLApprovalRequestPreparationSummaryHash: summary.approvalRequestPreparationSummaryHash,
    sanitizedObservationIntakeRecordId: packet.intake.sanitizedObservationIntakeRecordId,
    sanitizedObservationIntakeRecordHash: packet.intake.sanitizedObservationIntakeRecordHash,
    approvalRequestId: packet.approvalRequest.approvalRequestId,
    approvalRequestHash: packet.approvalRequest.approvalRequestHash,
    stepKProvisioningEvidenceSummaryId: packet.intake.stepKProvisioningEvidenceSummaryId,
    stepKProvisioningEvidenceSummaryHash: packet.intake.stepKProvisioningEvidenceSummaryHash,
    stepKProvisioningEvidenceId: packet.intake.stepKProvisioningEvidenceId,
    stepKProvisioningEvidenceHash: packet.intake.stepKProvisioningEvidenceHash,
    stepKObservationIntakeTemplateId: packet.intake.stepKObservationIntakeTemplateId,
    stepKObservationIntakeTemplateHash: packet.intake.stepKObservationIntakeTemplateHash,
    stepJProvisioningRequestId: packet.intake.stepJProvisioningRequestId,
    stepJProvisioningRequestHash: packet.intake.stepJProvisioningRequestHash,
    stepHRunPackageSummaryId: hSummary.runPackageSummaryId,
    stepHRunPackageSummaryHash: hSummary.runPackageSummaryHash,
    stepHReadinessChecklistId: contracts.readiness.readinessChecklistId,
    stepHReadinessChecklistHash: contracts.readiness.readinessChecklistHash,
    stepHSanitizedEnvironmentIntakeSchemaId: contracts.intake.sanitizedEnvironmentIntakeSchemaId,
    stepHSanitizedEnvironmentIntakeSchemaHash: contracts.intake.sanitizedEnvironmentIntakeSchemaHash,
    stepHCredentialProvisioningBoundaryId: contracts.credential.credentialProvisioningBoundaryId,
    stepHCredentialProvisioningBoundaryHash: contracts.credential.credentialProvisioningBoundaryHash,
    stepHDisposalResponsibilityPolicyId: contracts.disposal.disposalResponsibilityPolicyId,
    stepHDisposalResponsibilityPolicyHash: contracts.disposal.disposalResponsibilityPolicyHash,
    stepHApprovalRequestPolicyId: contracts.approval.approvalRequestPolicyId,
    stepHApprovalRequestPolicyHash: contracts.approval.approvalRequestPolicyHash,
  };
}
function buildUpstream() {
  const stepLPacket = stepL.buildValidSyntheticPacket();
  return { stepLPacket, stepLSummary: stepL.buildSummary(stepLPacket.intake, stepLPacket.approvalRequest, stepLPacket.intakeContext.upstream) };
}
function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, ["stepLPacket", "stepLSummary"])) return ["step_l_upstream_fields_invalid"];
  const p = upstream.stepLPacket;
  if (!isRecord(p) || !hasExactKeys(p, ["intakeContext", "intake", "requestContext", "approvalRequest", "evaluationClockInstant"])) return ["step_l_packet_fields_invalid"];
  const issues = [
    ...stepL.validateUpstream(p.intakeContext.upstream),
    ...stepL.validateIntakeContext(p.intakeContext),
    ...stepL.validateSanitizedObservationIntake(p.intake, p.intakeContext, p.evaluationClockInstant),
    ...stepL.validateApprovalRequestEnvelope(p.approvalRequest, p.intake, p.intakeContext, p.requestContext, p.evaluationClockInstant),
    ...stepL.validateSummary(upstream.stepLSummary, p.intake, p.approvalRequest, p.intakeContext.upstream),
    ...stepH.validateRequestContext(p.requestContext),
    ...stepH.validateLiveObservationApprovalRequest(p.approvalRequest, p.requestContext, p.evaluationClockInstant),
  ];
  let expected;
  try { expected = stepL.buildSummary(p.intake, p.approvalRequest, p.intakeContext.upstream); } catch {}
  if (!expected || !canonicalEqual(expected, upstream.stepLSummary)) issues.push("step_l_summary_binding_mismatch");
  return uniqueSorted(issues);
}

function buildApproverAllowlist(publicKeyPem, overrides = {}) {
  return sealContract({
    contractVersion: VERSIONS.allowlist,
    entries: [{
      signerKeyId: "synthetic-observation-approver-key",
      signerIdentityHash: "a".repeat(64),
      publicKeyPem,
      allowedScopes: [APPROVAL_SCOPE],
      allowedRoles: [APPROVER_ROLE],
      revoked: false,
      validFrom: "2026-07-18T00:02:00.000Z",
      validUntil: "2026-07-18T00:05:00.000Z",
      ...(overrides.entry || {}),
    }],
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...overrides.contract,
  }, "allowlist");
}
function normalizeApproverAllowlist(value) {
  const issues = [...validateEnvelope(value, "allowlist")];
  if (!isRecord(value) || !Array.isArray(value.entries) || value.entries.length === 0) return { ok: false, entries: [], issues: uniqueSorted([...issues, "approver_allowlist_entries_invalid"]) };
  if (value.entries.length !== 1) issues.push("approver_allowlist_entries_invalid");
  const ids = new Set(); const identities = new Set(); const keys = new Set(); const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `approver_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) { issues.push(`${prefix}_fields_invalid`); return; }
    if (!isSafeIdentity(entry.signerKeyId) || entry.signerKeyId === "*") issues.push(`${prefix}_signer_key_id_invalid`);
    else if (ids.has(entry.signerKeyId)) issues.push("approver_allowlist_signer_key_id_duplicate"); else ids.add(entry.signerKeyId);
    if (!isSha256(entry.signerIdentityHash)) issues.push(`${prefix}_signer_identity_hash_invalid`);
    else if (identities.has(entry.signerIdentityHash)) issues.push("approver_allowlist_signer_identity_duplicate"); else identities.add(entry.signerIdentityHash);
    if (!canonicalEqual(entry.allowedScopes, [APPROVAL_SCOPE])) issues.push(`${prefix}_scope_invalid`);
    if (!canonicalEqual(entry.allowedRoles, [APPROVER_ROLE])) issues.push(`${prefix}_role_invalid`);
    if (entry.revoked !== false) issues.push(`${prefix}_revoked`);
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (from === null || until === null || until <= from) issues.push(`${prefix}_validity_invalid`);
    let publicKey = null; let fingerprint = "";
    try {
      publicKey = createPublicKey(entry.publicKeyPem);
      if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519") issues.push(`${prefix}_public_key_not_ed25519`);
      else { fingerprint = createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex"); if (keys.has(fingerprint)) issues.push("approver_allowlist_public_key_duplicate"); else keys.add(fingerprint); }
    } catch { issues.push(`${prefix}_public_key_invalid`); }
    entries.push({ ...entry, publicKey, fingerprint, validFromMs: from, validUntilMs: until });
  });
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false) issues.push("approver_allowlist_synthetic_boundary_invalid");
  return { ok: issues.length === 0, entries: issues.length === 0 ? entries : [], issues: uniqueSorted(issues) };
}

function buildVerificationPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.policy, ...buildBindings(upstream),
    allowedDecisions: ["approved", "denied"], requiredApprovalScope: APPROVAL_SCOPE,
    requiredApproverRole: APPROVER_ROLE, requiredOperationSet: [...stepH.REQUESTED_OPERATION_SET],
    maximumObservationCount: 1, requiredAttestations: [...ATTESTATION_FIELDS],
    requiredDestinationCount: 1,
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    maximumResponseLifetimeSeconds: MAXIMUM_RESPONSE_LIFETIME_SECONDS,
    allowedClockSkewSeconds: ALLOWED_CLOCK_SKEW_SECONDS,
    distinctNonceHashesRequired: true, responseNonceReplayProtectionRequired: true,
    nonExecutingAuthorityRequired: true, authorityFalseFields: [...FIXED_FALSE_FIELDS],
    rawMaterialPresent: false,
  }, "policy");
}
function validateVerificationPolicy(value, upstream) {
  const issues = [...validateEnvelope(value, "policy")];
  let expected; try { expected = buildVerificationPolicy(upstream); } catch { return uniqueSorted([...issues, "verification_policy_expected_construction_failed"]); }
  for (const field of POLICY_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`verification_policy_field_invalid:${field}`);
  return uniqueSorted(issues);
}

function responseIdentityBody(value) { return without(value, ["approvalResponseId", "signatureBase64", "approvalResponseHash"]); }
function buildUnsignedApprovalResponse(upstream, overrides = {}) {
  const p = upstream.stepLPacket;
  const body = {
    contractVersion: VERSIONS.response, ...buildBindings(upstream),
    requestNonceHash: p.approvalRequest.requestNonceHash,
    intakeNonceHash: p.intake.intakeNonceHash,
    responseNonceHash: "b".repeat(64), decision: "approved", approvalScope: APPROVAL_SCOPE,
    approverRole: APPROVER_ROLE, requestedOperationSet: [...stepH.REQUESTED_OPERATION_SET],
    maximumObservationCount: 1, destinationCount: 1,
    observationWindowStartsAt: p.intake.observationWindowStartsAt,
    observationWindowExpiresAt: p.intake.observationWindowExpiresAt,
    issuedAt: "2026-07-18T00:03:05.000Z",
    expiresAt: "2026-07-18T00:04:00.000Z", signerKeyId: "synthetic-observation-approver-key",
    signerIdentityHash: "a".repeat(64), signatureAlgorithm: SIGNATURE_ALGORITHM,
    attestations: Object.fromEntries(ATTESTATION_FIELDS.map((field) => [field, true])),
    syntheticValidationOnly: true, rawMaterialPresent: false,
    providerSpecificMaterialPresent: false, manualReviewRequired: false,
    realApprovalRecorded: false, approvalRequestSent: false, ...overrides,
  };
  const withId = { ...body, approvalResponseId: `${SPECS.response.prefix}-${hashWithDomain(SPECS.response.idDomain, body)}` };
  return { ...withId, approvalResponseHash: hashWithDomain(SPECS.response.hashDomain, withId) };
}
function buildApprovalSignaturePayload(unsignedResponse) {
  if (!isRecord(unsignedResponse) || !hasExactKeys(unsignedResponse, RESPONSE_FIELDS.filter((field) => field !== "signatureBase64"))) throw new TypeError("approval_response_unsigned_fields_invalid");
  return Buffer.concat([Buffer.from("FINPLE_STEP114_2X_M_LIVE_OBSERVATION_APPROVAL_SIGNATURE\0", "utf8"), Buffer.from(canonicalJson(unsignedResponse), "utf8")]);
}
function sealSignedApprovalResponse(unsignedResponse, signatureBase64) {
  return { ...unsignedResponse, signatureBase64 };
}
function validateResponseShape(value) {
  const issues = [...validateEnvelope(value, "response")];
  if (!isRecord(value)) return uniqueSorted(issues);
  if (!BINDING_FIELDS.every((field) => isSafeIdentity(value[field]) || isSha256(value[field]))) issues.push("approval_response_binding_format_invalid");
  for (const field of ["requestNonceHash", "intakeNonceHash", "responseNonceHash", "signerIdentityHash"]) if (!isSha256(value[field])) issues.push(`approval_response_hash_invalid:${field}`);
  if (!isSafeIdentity(value.signerKeyId) || value.signerKeyId === "*") issues.push("approval_response_signer_key_id_invalid");
  if (!canonicalEqual(value.requestedOperationSet, stepH.REQUESTED_OPERATION_SET) ||
      value.maximumObservationCount !== 1 || value.destinationCount !== 1) {
    issues.push("approval_response_operation_scope_invalid");
  }
  if (value.decision !== "approved" || value.approvalScope !== APPROVAL_SCOPE || value.approverRole !== APPROVER_ROLE) issues.push("approval_response_decision_scope_role_invalid");
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) issues.push("approval_response_signature_algorithm_invalid");
  if (!hasExactKeys(value.attestations, ATTESTATION_FIELDS) || ATTESTATION_FIELDS.some((field) => value.attestations?.[field] !== true)) issues.push("approval_response_attestations_invalid");
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false ||
      value.providerSpecificMaterialPresent !== false || value.manualReviewRequired !== false ||
      value.realApprovalRecorded !== false || value.approvalRequestSent !== false) {
    issues.push("approval_response_synthetic_boundary_invalid");
  }
  const signature = decodeCanonicalBase64(value.signatureBase64); if (!signature || signature.length !== 64) issues.push("approval_response_signature_encoding_invalid");
  const expectedId = `${SPECS.response.prefix}-${hashWithDomain(SPECS.response.idDomain, responseIdentityBody(value))}`;
  if (value.approvalResponseId !== expectedId) issues.push("approval_response_id_invalid");
  return uniqueSorted(issues);
}

function validateApprovalContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, ["upstream", "approverAllowlist", "verificationPolicy", "priorResponseNonceHashes"])) return ["approval_context_fields_invalid"];
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...normalizeApproverAllowlist(context.approverAllowlist).issues,
    ...validateVerificationPolicy(context.verificationPolicy, context.upstream),
    ...validateHashArray(context.priorResponseNonceHashes, "prior_response_nonce_hashes"),
  ]);
}
function validateSignedApprovalResponse(value, context, evaluationClockInstant) {
  const contextIssues = validateApprovalContext(context);
  const issues = [...validateResponseShape(value), ...contextIssues];
  if (!isRecord(value) || contextIssues.length > 0) return uniqueSorted(issues);
  const p = context.upstream.stepLPacket; const bindings = buildBindings(context.upstream);
  for (const field of BINDING_FIELDS) if (value[field] !== bindings[field]) issues.push(`approval_response_upstream_binding_mismatch:${field}`);
  if (value.requestNonceHash !== p.approvalRequest.requestNonceHash || value.intakeNonceHash !== p.intake.intakeNonceHash) issues.push("approval_response_nonce_binding_mismatch");
  if (value.observationWindowStartsAt !== p.intake.observationWindowStartsAt ||
      value.observationWindowExpiresAt !== p.intake.observationWindowExpiresAt) {
    issues.push("approval_response_observation_window_binding_mismatch");
  }
  if (value.responseNonceHash === value.requestNonceHash || value.responseNonceHash === value.intakeNonceHash) issues.push("approval_response_nonce_not_distinct");
  if (context.priorResponseNonceHashes.includes(value.responseNonceHash)) issues.push("approval_response_nonce_replay");
  const normalized = normalizeApproverAllowlist(context.approverAllowlist);
  const matches = normalized.entries.filter((entry) => entry.signerKeyId === value.signerKeyId && entry.signerIdentityHash === value.signerIdentityHash && entry.allowedScopes.includes(value.approvalScope) && entry.allowedRoles.includes(value.approverRole) && entry.revoked === false);
  if (matches.length !== 1) issues.push("approval_response_approver_resolution_failed");
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt); const now = parseInstant(evaluationClockInstant);
  const requestIssued = parseInstant(p.approvalRequest.issuedAt); const requestExpires = parseInstant(p.approvalRequest.expiresAt);
  const intakeExpires = parseInstant(p.intake.expiresAt); const templateExpires = parseInstant(p.intakeContext.upstream.stepKPacket.template.expiresAt);
  const windowStart = parseInstant(p.intake.observationWindowStartsAt); const windowExpires = parseInstant(p.intake.observationWindowExpiresAt);
  if ([issued, expires, now, requestIssued, requestExpires, intakeExpires, templateExpires, windowStart, windowExpires].some((instant) => instant === null)) issues.push("approval_response_time_invalid");
  else {
    if (expires <= issued || expires - issued > MAXIMUM_RESPONSE_LIFETIME_SECONDS * 1000) issues.push("approval_response_lifetime_invalid");
    if (issued < requestIssued || issued < windowStart - ALLOWED_CLOCK_SKEW_SECONDS * 1000) issues.push("approval_response_issued_before_request_or_window");
    if (expires > Math.min(requestExpires, intakeExpires, templateExpires, windowExpires)) issues.push("approval_response_outlives_upstream_window");
    if (now < issued - ALLOWED_CLOCK_SKEW_SECONDS * 1000 || now >= expires) issues.push("approval_response_evaluation_time_invalid");
    if (matches.length === 1 && (issued < matches[0].validFromMs || expires > matches[0].validUntilMs)) issues.push("approval_response_signer_validity_mismatch");
  }
  if (issues.length === 0 && matches.length === 1) {
    let verified = false;
    try { verified = verifySignature(null, buildApprovalSignaturePayload(without(value, "signatureBase64")), matches[0].publicKey, decodeCanonicalBase64(value.signatureBase64)); } catch {}
    if (!verified) issues.push("approval_response_signature_invalid");
  }
  return uniqueSorted(issues);
}

function buildObservationAuthorityPackage(response, context) {
  const p = context.upstream.stepLPacket;
  return sealContract({
    contractVersion: VERSIONS.authority, ...buildBindings(context.upstream),
    approvalResponseId: response.approvalResponseId, approvalResponseHash: response.approvalResponseHash,
    approverAllowlistId: context.approverAllowlist.approverAllowlistId, approverAllowlistHash: context.approverAllowlist.approverAllowlistHash,
    verificationPolicyId: context.verificationPolicy.verificationPolicyId, verificationPolicyHash: context.verificationPolicy.verificationPolicyHash,
    signerKeyId: response.signerKeyId, signerIdentityHash: response.signerIdentityHash,
    signatureDigest: createHash("sha256").update(decodeCanonicalBase64(response.signatureBase64)).digest("hex"),
    approvalScope: APPROVAL_SCOPE, approverRole: APPROVER_ROLE,
    authorizedOperationSet: [...stepH.REQUESTED_OPERATION_SET], maximumObservationCount: 1,
    destinationCount: 1,
    observationWindowStartsAt: p.intake.observationWindowStartsAt,
    observationWindowExpiresAt: p.intake.observationWindowExpiresAt,
    requestNonceHash: response.requestNonceHash, responseNonceHash: response.responseNonceHash,
    issuedAt: response.issuedAt, expiresAt: response.expiresAt, nonExecuting: true,
    rawMaterialPresent: false, syntheticValidationOnly: true,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "authority");
}
function validateObservationAuthorityPackage(value, response, context) {
  const issues = [...validateEnvelope(value, "authority")];
  let expected; try { expected = buildObservationAuthorityPackage(response, context); } catch { return uniqueSorted([...issues, "observation_authority_expected_construction_failed"]); }
  for (const field of AUTHORITY_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`observation_authority_field_invalid:${field}`);
  return uniqueSorted(issues);
}
function buildSummary(response, context, authority) {
  return sealContract({
    contractVersion: VERSIONS.summary, ...buildBindings(context.upstream),
    approvalResponseId: response.approvalResponseId, approvalResponseHash: response.approvalResponseHash,
    approverAllowlistId: context.approverAllowlist.approverAllowlistId, approverAllowlistHash: context.approverAllowlist.approverAllowlistHash,
    verificationPolicyId: context.verificationPolicy.verificationPolicyId, verificationPolicyHash: context.verificationPolicy.verificationPolicyHash,
    observationAuthorityPackageId: authority.observationAuthorityPackageId, observationAuthorityPackageHash: authority.observationAuthorityPackageHash,
    publicState: "signed_live_observation_approval_response_verified",
    signedApprovalResponseVerified: true, approverAllowlistValidated: true,
    nonceAndExpiryValidated: true, nonExecutingObservationAuthorityPrepared: true,
    syntheticValidationOnly: true, rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}
function validateSummary(value, response, context, authority) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected; try { expected = buildSummary(response, context, authority); } catch { return uniqueSorted([...issues, "summary_expected_construction_failed"]); }
  for (const field of SUMMARY_FIELDS) if (!canonicalEqual(value?.[field], expected[field])) issues.push(`summary_field_invalid:${field}`);
  return uniqueSorted(issues);
}
function safeResult(status, summary = {}, authority = {}, issues = []) {
  const verified = status === "signed_live_observation_approval_response_verified";
  return {
    ok: verified, status, contractVersion: VERSIONS.summary,
    signedApprovalResponseVerified: verified,
    nonExecutingObservationAuthorityPrepared: verified,
    approvalVerificationSummary: verified ? summary : {},
    observationAuthorityPackage: verified ? authority : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    manualReviewRequired: status === "blocked",
    warningIssues: verified ? ["synthetic_verification_does_not_send_request_record_approval_create_signature_observe_connect_or_execute"] : [],
  };
}
function evaluateSignedLiveObservationApprovalPackage(packet) {
  if (packet === undefined || packet === null) return safeResult("awaiting_external_signed_live_observation_approval_response");
  if (!isRecord(packet) || !hasExactKeys(packet, ["context", "approvalResponse", "evaluationClockInstant"])) return safeResult("blocked", {}, {}, ["signed_approval_packet_fields_invalid"]);
  try {
    const issues = validateSignedApprovalResponse(packet.approvalResponse, packet.context, packet.evaluationClockInstant);
    if (issues.length > 0) return safeResult("blocked", {}, {}, issues);
    const authority = buildObservationAuthorityPackage(packet.approvalResponse, packet.context);
    issues.push(...validateObservationAuthorityPackage(authority, packet.approvalResponse, packet.context));
    const summary = buildSummary(packet.approvalResponse, packet.context, authority);
    issues.push(...validateSummary(summary, packet.approvalResponse, packet.context, authority));
    canonicalJson(summary); canonicalJson(authority);
    return issues.length > 0 ? safeResult("blocked", {}, {}, issues) : safeResult("signed_live_observation_approval_response_verified", summary, authority);
  } catch { return safeResult("blocked", {}, {}, ["signed_live_observation_approval_validation_failed"]); }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS, APPROVAL_SCOPE, APPROVER_ROLE, ATTESTATION_FIELDS,
  FIELD_SETS, FIXED_FALSE_FIELDS, MAXIMUM_RESPONSE_LIFETIME_SECONDS, PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS, SIGNATURE_ALGORITHM, SPECS, VERSIONS,
  buildApprovalSignaturePayload, buildApproverAllowlist, buildBindings,
  buildObservationAuthorityPackage, buildSummary, buildUnsignedApprovalResponse,
  buildUpstream, buildVerificationPolicy, evaluateSignedLiveObservationApprovalPackage,
  normalizeApproverAllowlist, safeResult, sealContract, sealSignedApprovalResponse,
  validateApprovalContext, validateObservationAuthorityPackage, validateSignedApprovalResponse,
  validateSummary, validateUpstream, validateVerificationPolicy,
};
