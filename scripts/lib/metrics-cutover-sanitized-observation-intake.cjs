"use strict";

const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const stepK = require("./metrics-cutover-disposable-environment-provisioning-evidence.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  intake: "metrics-cutover-sanitized-environment-observation-intake-record-v1-step114-2x-l",
  summary: "metrics-cutover-sanitized-observation-approval-request-preparation-summary-v1-step114-2x-l",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_sanitized_observation_intake",
  "sanitized_observation_intake_validated",
  "blocked",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
  "selectionDecisionRecorded",
  "humanSelectionRecorded",
  "realEnvironmentClassSelected",
  "realEnvironmentProvisioned",
  "realTargetSelected",
  "provisioningEvidenceRecorded",
  "sanitizedObservationIntakeCollected",
  "sanitizedObservationIntakeRecorded",
  "liveObservationApprovalRequestSent",
  "liveObservationApprovalRecorded",
  "providerResearchAuthorized",
  "providerSelectionAuthorized",
  "providerAccountAccessAuthorized",
  "realTargetSelectionAuthorized",
  "environmentProvisioningAuthorized",
  "environmentProvisioningExecuted",
  "credentialProvisioningAuthorized",
  "credentialProvisioningExecuted",
  "credentialUseAuthorized",
  "credentialInjected",
  "environmentObservationAuthorized",
  "environmentObservationExecuted",
  "providerConnectionAuthorized",
  "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized",
  "oneTimeAuthorizationIssueAuthorized",
  "oneTimeAuthorizationIssued",
  "provisioningRunbookActivated",
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
  ...stepK.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const MAXIMUM_INTAKE_LIFETIME_SECONDS = 120;
const ALLOWED_CLOCK_SKEW_SECONDS = 30;

const SPECS = Object.freeze({
  intake: Object.freeze({
    version: VERSIONS.intake,
    idField: "sanitizedObservationIntakeRecordId",
    hashField: "sanitizedObservationIntakeRecordHash",
    prefix: "metrics-cutover-sanitized-environment-observation-intake-record",
    idDomain: "FINPLE_STEP114_2X_L_SANITIZED_OBSERVATION_INTAKE_RECORD_ID\0",
    hashDomain: "FINPLE_STEP114_2X_L_SANITIZED_OBSERVATION_INTAKE_RECORD_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "approvalRequestPreparationSummaryId",
    hashField: "approvalRequestPreparationSummaryHash",
    prefix: "metrics-cutover-sanitized-observation-approval-request-preparation-summary",
    idDomain: "FINPLE_STEP114_2X_L_APPROVAL_REQUEST_PREPARATION_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_L_APPROVAL_REQUEST_PREPARATION_SUMMARY_HASH\0",
  }),
});

const INTAKE_FIELDS = Object.freeze([
  "contractVersion", "sanitizedObservationIntakeRecordId",
  "stepKProvisioningEvidenceSummaryId", "stepKProvisioningEvidenceSummaryHash",
  "stepKProvisioningEvidenceId", "stepKProvisioningEvidenceHash",
  "stepKObservationIntakeTemplateId", "stepKObservationIntakeTemplateHash",
  "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
  "stepHSanitizedIntakeSchemaId", "stepHSanitizedIntakeSchemaHash",
  "stepHCredentialBoundaryId", "stepHCredentialBoundaryHash",
  "stepHDisposalPolicyId", "stepHDisposalPolicyHash",
  "selectedCandidateClass", "targetPurposeClassification", "namespaceCategory",
  "destinationCount", "allowedFields", "requiredHashPlaceholders",
  "requiredTimestampPlaceholders", "credentialAttestationCategories",
  "environmentBindingHash", "namespaceEvidenceHash", "destinationAllowlistHash",
  "databaseFingerprintHash", "certificateFingerprintHash", "observerAttestationHash",
  "migrationCredentialCategoryAttestationHash", "runtimeCredentialCategoryAttestationHash",
  "credentialExpiryAttestationHash", "credentialRotationAttestationHash",
  "credentialRevocationAttestationHash", "credentialDestructionAttestationHash",
  "disposalResponsibilityAttestationHash", "runtimeDeniedPrivileges",
  "disposalDeadlineCategory", "observationWindowStartsAt", "observationWindowExpiresAt",
  "issuedAt", "expiresAt", "intakeNonceHash", "externalSanitizedIntakeAttested",
  "syntheticValidationOnly", "realIntakeRecorded", "observationPerformed",
  "rawMaterialPresent", "providerSpecificMaterialPresent", "manualReviewRequired",
  "sanitizedObservationIntakeRecordHash",
]);

const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "approvalRequestPreparationSummaryId",
  "sanitizedObservationIntakeRecordId", "sanitizedObservationIntakeRecordHash",
  "approvalRequestId", "approvalRequestHash",
  "stepKProvisioningEvidenceSummaryId", "stepKProvisioningEvidenceSummaryHash",
  "stepKProvisioningEvidenceId", "stepKProvisioningEvidenceHash",
  "stepKObservationIntakeTemplateId", "stepKObservationIntakeTemplateHash",
  "publicState", "sanitizedObservationIntakeValidated",
  "approvalRequestEnvelopePrepared", "syntheticValidationOnly", "rawMaterialPresent",
  ...FIXED_FALSE_FIELDS, "approvalRequestPreparationSummaryHash",
]);

const FIELD_SETS = Object.freeze({ intake: INTAKE_FIELDS, summary: SUMMARY_FIELDS });

function without(value, field) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function sealContract(value, name) {
  const spec = SPECS[name];
  const withId = { ...value };
  withId[spec.idField] = `${spec.prefix}-${hashWithDomain(spec.idDomain, value)}`;
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}

function validateEnvelope(value, name) {
  const spec = SPECS[name];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) {
    return [`${name}_fields_invalid`];
  }
  const issues = [];
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const idInput = without(without(value, spec.idField), spec.hashField);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, idInput)}`;
  if (!isSafeIdentity(value[spec.idField]) || value[spec.idField] !== expectedId) {
    issues.push(`${name}_id_mismatch`);
  }
  const expectedHash = hashWithDomain(spec.hashDomain, without(value, spec.hashField));
  if (!isSha256(value[spec.hashField]) || value[spec.hashField] !== expectedHash) {
    issues.push(`${name}_hash_mismatch`);
  }
  return issues;
}

function parseCanonicalInstant(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value
    ? milliseconds : null;
}

function validateHashArray(value, label) {
  if (!Array.isArray(value)) return [`${label}_invalid`];
  const issues = [];
  value.forEach((hash, index) => {
    if (!isSha256(hash)) issues.push(`${label}_hash_invalid:${index}`);
  });
  if (new Set(value).size !== value.length) issues.push(`${label}_duplicate`);
  if (!canonicalEqual(value, [...value].sort())) issues.push(`${label}_unsorted`);
  return uniqueSorted(issues);
}

function buildUpstream() {
  const stepKPacket = stepK.buildValidSyntheticPacket();
  return {
    stepKPacket,
    stepKSummary: stepK.buildSummary(
      stepKPacket.evidence,
      stepKPacket.template,
      stepKPacket.evidenceContext.upstream,
    ),
  };
}

function getStepHMaterial(upstream) {
  return stepK.getStepHMaterial(upstream.stepKPacket.evidenceContext.upstream);
}

function buildBindings(upstream) {
  const k = upstream.stepKPacket;
  const kSummary = upstream.stepKSummary;
  const hMaterial = getStepHMaterial(upstream);
  const h = hMaterial.packet.contracts;
  const jRequest = k.evidenceContext.upstream.stepJPacket.request;
  return {
    stepKProvisioningEvidenceSummaryId: kSummary.provisioningEvidenceSummaryId,
    stepKProvisioningEvidenceSummaryHash: kSummary.provisioningEvidenceSummaryHash,
    stepKProvisioningEvidenceId: k.evidence.provisioningEvidenceId,
    stepKProvisioningEvidenceHash: k.evidence.provisioningEvidenceHash,
    stepKObservationIntakeTemplateId: k.template.observationIntakeTemplateId,
    stepKObservationIntakeTemplateHash: k.template.observationIntakeTemplateHash,
    stepJProvisioningRequestId: jRequest.provisioningRequestId,
    stepJProvisioningRequestHash: jRequest.provisioningRequestHash,
    stepHSanitizedIntakeSchemaId: h.intake.sanitizedEnvironmentIntakeSchemaId,
    stepHSanitizedIntakeSchemaHash: h.intake.sanitizedEnvironmentIntakeSchemaHash,
    stepHCredentialBoundaryId: h.credential.credentialProvisioningBoundaryId,
    stepHCredentialBoundaryHash: h.credential.credentialProvisioningBoundaryHash,
    stepHDisposalPolicyId: h.disposal.disposalResponsibilityPolicyId,
    stepHDisposalPolicyHash: h.disposal.disposalResponsibilityPolicyHash,
    selectedCandidateClass: k.template.selectedCandidateClass,
    targetPurposeClassification: k.template.targetPurposeClassification,
    namespaceCategory: k.template.namespaceCategory,
    destinationCount: k.template.exactDestinationCount,
    allowedFields: [...k.template.allowedFields],
    requiredHashPlaceholders: [...k.template.requiredHashPlaceholders],
    requiredTimestampPlaceholders: [...k.template.requiredTimestampPlaceholders],
    credentialAttestationCategories: [...k.template.credentialAttestationCategories],
    runtimeDeniedPrivileges: [...k.template.runtimeDeniedPrivileges],
    disposalDeadlineCategories: [...k.template.disposalDeadlineCategories],
    templateExpiresAt: k.template.expiresAt,
    templateNonceHash: k.template.templateNonceHash,
    hPacket: hMaterial.packet,
    hSummary: hMaterial.summary,
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, ["stepKPacket", "stepKSummary"])) {
    return ["step_k_upstream_fields_invalid"];
  }
  const packet = upstream.stepKPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "evidenceContext", "evidence", "templateContext", "template", "evaluationClockInstant",
  ])) return ["step_k_packet_fields_invalid"];
  const issues = [
    ...stepK.validateUpstream(packet.evidenceContext.upstream),
    ...stepK.validateEvidenceContext(packet.evidenceContext),
    ...stepK.validateProvisioningEvidence(
      packet.evidence, packet.evidenceContext, packet.evaluationClockInstant,
    ),
    ...stepK.validateTemplateContext(packet.templateContext),
    ...stepK.validateObservationIntakeTemplate(
      packet.template, packet.evidence, packet.templateContext, packet.evaluationClockInstant,
    ),
    ...stepK.validateSummary(
      upstream.stepKSummary, packet.evidence, packet.template, packet.evidenceContext.upstream,
    ),
  ];
  const evaluated = stepK.evaluateProvisioningEvidencePackage(packet);
  if (!evaluated.ok || evaluated.status !==
      "disposable_environment_provisioning_evidence_validated") {
    issues.push("step_k_complete_package_invalid");
  }
  let expectedKSummary;
  try {
    expectedKSummary = stepK.buildSummary(
      packet.evidence, packet.template, packet.evidenceContext.upstream,
    );
  } catch {}
  if (!expectedKSummary || !canonicalEqual(upstream.stepKSummary, expectedKSummary)) {
    issues.push("step_k_summary_binding_mismatch");
  }
  let binding;
  try { binding = buildBindings(upstream); } catch {
    issues.push("step_l_binding_construction_failed");
  }
  if (binding) {
    const hPacket = binding.hPacket;
    if (!isRecord(hPacket) || !hasExactKeys(hPacket, ["upstream", "contracts"]) ||
        !isRecord(hPacket.contracts) || !hasExactKeys(hPacket.contracts, [
          "readiness", "intake", "credential", "disposal", "approval",
        ])) {
      issues.push("step_h_packet_fields_invalid");
    } else {
      issues.push(...stepH.validateUpstream(hPacket.upstream));
      for (const name of ["readiness", "intake", "credential", "disposal", "approval"]) {
        issues.push(...stepH.validateContract(
          hPacket.contracts[name], name, hPacket.upstream, hPacket.contracts,
        ));
      }
      issues.push(...stepH.validateRunPackageSummary(
        binding.hSummary, hPacket.upstream, hPacket.contracts,
      ));
    }
    const transitive = stepK.buildBindings(packet.evidenceContext.upstream)
      .transitiveStepIHGBindings.transitiveStepHGBindings.transitiveExecutionPlanBindings;
    if (packet.evidence.operationSequence.length !== 11 ||
        transitive.executionSequence.length !== 12 ||
        transitive.exactScenarioCount !== 15 || transitive.scenarioOrder.length !== 15 ||
        binding.destinationCount !== 1 || packet.template.separateLiveObservationApprovalRequired !== true) {
      issues.push("step_k_j_i_h_g_exact_scope_invalid");
    }
  }
  return uniqueSorted(issues);
}

function validateIntakeContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "priorIntakeNonceHashes",
  ])) return ["intake_context_fields_invalid"];
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...validateHashArray(context.priorIntakeNonceHashes, "prior_intake_nonce_hashes"),
  ]);
}

function buildSyntheticSanitizedObservationIntakeFixture(context) {
  const binding = buildBindings(context.upstream);
  return sealContract({
    contractVersion: VERSIONS.intake,
    stepKProvisioningEvidenceSummaryId: binding.stepKProvisioningEvidenceSummaryId,
    stepKProvisioningEvidenceSummaryHash: binding.stepKProvisioningEvidenceSummaryHash,
    stepKProvisioningEvidenceId: binding.stepKProvisioningEvidenceId,
    stepKProvisioningEvidenceHash: binding.stepKProvisioningEvidenceHash,
    stepKObservationIntakeTemplateId: binding.stepKObservationIntakeTemplateId,
    stepKObservationIntakeTemplateHash: binding.stepKObservationIntakeTemplateHash,
    stepJProvisioningRequestId: binding.stepJProvisioningRequestId,
    stepJProvisioningRequestHash: binding.stepJProvisioningRequestHash,
    stepHSanitizedIntakeSchemaId: binding.stepHSanitizedIntakeSchemaId,
    stepHSanitizedIntakeSchemaHash: binding.stepHSanitizedIntakeSchemaHash,
    stepHCredentialBoundaryId: binding.stepHCredentialBoundaryId,
    stepHCredentialBoundaryHash: binding.stepHCredentialBoundaryHash,
    stepHDisposalPolicyId: binding.stepHDisposalPolicyId,
    stepHDisposalPolicyHash: binding.stepHDisposalPolicyHash,
    selectedCandidateClass: binding.selectedCandidateClass,
    targetPurposeClassification: binding.targetPurposeClassification,
    namespaceCategory: binding.namespaceCategory,
    destinationCount: binding.destinationCount,
    allowedFields: binding.allowedFields,
    requiredHashPlaceholders: binding.requiredHashPlaceholders,
    requiredTimestampPlaceholders: binding.requiredTimestampPlaceholders,
    credentialAttestationCategories: binding.credentialAttestationCategories,
    environmentBindingHash: "1".repeat(64),
    namespaceEvidenceHash: "2".repeat(64),
    destinationAllowlistHash: "3".repeat(64),
    databaseFingerprintHash: "4".repeat(64),
    certificateFingerprintHash: "5".repeat(64),
    observerAttestationHash: "6".repeat(64),
    migrationCredentialCategoryAttestationHash: "7".repeat(64),
    runtimeCredentialCategoryAttestationHash: "8".repeat(64),
    credentialExpiryAttestationHash: "9".repeat(64),
    credentialRotationAttestationHash: "a".repeat(64),
    credentialRevocationAttestationHash: "b".repeat(64),
    credentialDestructionAttestationHash: "c".repeat(64),
    disposalResponsibilityAttestationHash: "d".repeat(64),
    runtimeDeniedPrivileges: binding.runtimeDeniedPrivileges,
    disposalDeadlineCategory: binding.disposalDeadlineCategories[0],
    observationWindowStartsAt: "2026-07-18T00:03:00.000Z",
    observationWindowExpiresAt: "2026-07-18T00:04:25.000Z",
    issuedAt: "2026-07-18T00:02:50.000Z",
    expiresAt: "2026-07-18T00:04:20.000Z",
    intakeNonceHash: "e".repeat(64),
    externalSanitizedIntakeAttested: true,
    syntheticValidationOnly: true,
    realIntakeRecorded: false,
    observationPerformed: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
  }, "intake");
}

function validateSanitizedObservationIntake(value, context, evaluationClockInstant) {
  const contextIssues = validateIntakeContext(context);
  const issues = [...validateEnvelope(value, "intake"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.upstream) ||
      !Array.isArray(context.priorIntakeNonceHashes) || contextIssues.length > 0) {
    return uniqueSorted(issues);
  }
  const binding = buildBindings(context.upstream);
  for (const field of [
    "stepKProvisioningEvidenceSummaryId", "stepKProvisioningEvidenceSummaryHash",
    "stepKProvisioningEvidenceId", "stepKProvisioningEvidenceHash",
    "stepKObservationIntakeTemplateId", "stepKObservationIntakeTemplateHash",
    "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
    "stepHSanitizedIntakeSchemaId", "stepHSanitizedIntakeSchemaHash",
    "stepHCredentialBoundaryId", "stepHCredentialBoundaryHash",
    "stepHDisposalPolicyId", "stepHDisposalPolicyHash", "selectedCandidateClass",
    "targetPurposeClassification", "namespaceCategory", "destinationCount",
  ]) {
    if (value[field] !== binding[field]) issues.push(`intake_upstream_binding_mismatch:${field}`);
  }
  for (const field of [
    "allowedFields", "requiredHashPlaceholders", "requiredTimestampPlaceholders",
    "credentialAttestationCategories", "runtimeDeniedPrivileges",
  ]) {
    if (!canonicalEqual(value[field], binding[field])) issues.push(`intake_scope_invalid:${field}`);
  }
  for (const field of binding.requiredHashPlaceholders) {
    if (!isSha256(value[field])) issues.push(`intake_hash_placeholder_invalid:${field}`);
  }
  if (!isSha256(value.intakeNonceHash)) {
    issues.push("intake_nonce_hash_invalid");
  } else if (context.priorIntakeNonceHashes.includes(value.intakeNonceHash)) {
    issues.push("intake_nonce_replay_manual_review");
  }
  if (value.migrationCredentialCategoryAttestationHash ===
      value.runtimeCredentialCategoryAttestationHash) {
    issues.push("intake_credential_categories_not_distinct");
  }
  if (value.destinationCount !== 1 ||
      !binding.disposalDeadlineCategories.includes(value.disposalDeadlineCategory)) {
    issues.push("intake_destination_or_disposal_scope_invalid");
  }
  if (value.externalSanitizedIntakeAttested !== true ||
      value.syntheticValidationOnly !== true || value.realIntakeRecorded !== false ||
      value.observationPerformed !== false || value.rawMaterialPresent !== false ||
      value.providerSpecificMaterialPresent !== false) {
    issues.push("intake_synthetic_non_recording_boundary_invalid");
  }
  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const windowStartsAt = parseCanonicalInstant(value.observationWindowStartsAt);
  const windowExpiresAt = parseCanonicalInstant(value.observationWindowExpiresAt);
  const templateExpiresAt = parseCanonicalInstant(binding.templateExpiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (issuedAt === null) issues.push("intake_issued_at_invalid");
  if (expiresAt === null) issues.push("intake_expires_at_invalid");
  if (windowStartsAt === null) issues.push("intake_window_starts_at_invalid");
  if (windowExpiresAt === null) issues.push("intake_window_expires_at_invalid");
  if (evaluationClock === null) issues.push("intake_evaluation_clock_invalid");
  if ([issuedAt, expiresAt, windowStartsAt, windowExpiresAt, templateExpiresAt, evaluationClock]
    .every((instant) => instant !== null)) {
    const skew = ALLOWED_CLOCK_SKEW_SECONDS * 1000;
    if (issuedAt >= expiresAt) issues.push("intake_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("intake_future_dated");
    if (evaluationClock >= expiresAt) issues.push("intake_expired");
    if (expiresAt - issuedAt > MAXIMUM_INTAKE_LIFETIME_SECONDS * 1000) {
      issues.push("intake_lifetime_excessive");
    }
    if (windowStartsAt >= windowExpiresAt) issues.push("intake_observation_window_inversion");
    if (issuedAt > windowStartsAt || expiresAt > windowExpiresAt) {
      issues.push("intake_outside_observation_window");
    }
    if (expiresAt > templateExpiresAt || windowExpiresAt > templateExpiresAt) {
      issues.push("intake_outlives_step_k_template");
    }
  }
  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("intake_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("intake_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function buildStepHRequestContext(upstream, priorRequestNonceHashes = []) {
  const binding = buildBindings(upstream);
  return {
    upstream: binding.hPacket.upstream,
    contracts: binding.hPacket.contracts,
    runPackageSummary: binding.hSummary,
    priorRequestNonceHashes: [...priorRequestNonceHashes],
  };
}

function buildSyntheticApprovalRequestEnvelope(intake, requestContext) {
  const upstreamBindings = stepH.buildUpstreamBindings(requestContext.upstream);
  const c = requestContext.contracts;
  const s = requestContext.runPackageSummary;
  const copiedIntake = Object.fromEntries(stepH.INTAKE_ALLOWED_FIELDS.map(
    (field) => [field, intake[field]],
  ));
  copiedIntake.disposalDeadlineCategory = "within_operator_approved_window";
  return stepH.sealContract({
    contractVersion: stepH.VERSIONS.request,
    runPackageSummaryId: s.runPackageSummaryId,
    runPackageSummaryHash: s.runPackageSummaryHash,
    readinessChecklistId: c.readiness.readinessChecklistId,
    readinessChecklistHash: c.readiness.readinessChecklistHash,
    sanitizedEnvironmentIntakeSchemaId: c.intake.sanitizedEnvironmentIntakeSchemaId,
    sanitizedEnvironmentIntakeSchemaHash: c.intake.sanitizedEnvironmentIntakeSchemaHash,
    approvalRequestPolicyId: c.approval.approvalRequestPolicyId,
    approvalRequestPolicyHash: c.approval.approvalRequestPolicyHash,
    credentialProvisioningBoundaryId: c.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash: c.credential.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId: c.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: c.disposal.disposalResponsibilityPolicyHash,
    executionPreflightSummaryId: upstreamBindings.executionPreflightSummaryId,
    executionPreflightSummaryHash: upstreamBindings.executionPreflightSummaryHash,
    targetSelectionPolicyId: upstreamBindings.targetSelectionPolicyId,
    targetSelectionPolicyHash: upstreamBindings.targetSelectionPolicyHash,
    sequencePolicyId: upstreamBindings.sequencePolicyId,
    sequencePolicyHash: upstreamBindings.sequencePolicyHash,
    rollbackPolicyId: upstreamBindings.rollbackPolicyId,
    rollbackPolicyHash: upstreamBindings.rollbackPolicyHash,
    evidenceCollectionPlanId: upstreamBindings.evidenceCollectionPlanId,
    evidenceCollectionPlanHash: upstreamBindings.evidenceCollectionPlanHash,
    ...copiedIntake,
    requestedOperationSet: [...stepH.REQUESTED_OPERATION_SET],
    maximumObservationCount: 1,
    runtimeDeniedPrivileges: [...c.credential.runtimeDeniedPrivileges],
    categoriesDistinct: true,
    migrationCredentialUsedForObservation: false,
    sanitizedApproverIdentityHash: "f".repeat(64),
    requestNonceHash: "0".repeat(64),
    issuedAt: "2026-07-18T00:03:00.000Z",
    expiresAt: "2026-07-18T00:04:15.000Z",
    approvalRequested: false,
    approvalGranted: false,
  }, "request");
}

function validateApprovalRequestEnvelope(
  value, intake, intakeContext, requestContext, evaluationClockInstant,
) {
  const intakeIssues = validateSanitizedObservationIntake(
    intake, intakeContext, evaluationClockInstant,
  );
  const requestContextIssues = stepH.validateRequestContext(requestContext);
  const issues = [
    ...intakeIssues,
    ...requestContextIssues,
    ...stepH.validateLiveObservationApprovalRequest(
      value, requestContext, evaluationClockInstant,
    ),
  ];
  if (!isRecord(value) || !isRecord(intake) || intakeIssues.length > 0 ||
      requestContextIssues.length > 0 || !isRecord(requestContext) ||
      !Array.isArray(requestContext.priorRequestNonceHashes)) return uniqueSorted(issues);
  const expected = buildBindings(intakeContext.upstream);
  if (!canonicalEqual(requestContext.upstream, expected.hPacket.upstream) ||
      !canonicalEqual(requestContext.contracts, expected.hPacket.contracts) ||
      !canonicalEqual(requestContext.runPackageSummary, expected.hSummary)) {
    issues.push("approval_request_step_h_context_binding_mismatch");
  }
  for (const [requestField, intakeField] of [
    ["sanitizedEnvironmentIntakeSchemaId", "stepHSanitizedIntakeSchemaId"],
    ["sanitizedEnvironmentIntakeSchemaHash", "stepHSanitizedIntakeSchemaHash"],
    ["credentialProvisioningBoundaryId", "stepHCredentialBoundaryId"],
    ["credentialProvisioningBoundaryHash", "stepHCredentialBoundaryHash"],
    ["disposalResponsibilityPolicyId", "stepHDisposalPolicyId"],
    ["disposalResponsibilityPolicyHash", "stepHDisposalPolicyHash"],
  ]) {
    if (value[requestField] !== intake[intakeField]) {
      issues.push(`approval_request_step_k_h_binding_mismatch:${requestField}`);
    }
  }
  for (const field of stepH.INTAKE_ALLOWED_FIELDS) {
    if (field === "disposalDeadlineCategory") continue;
    if (!canonicalEqual(value[field], intake[field])) {
      issues.push(`approval_request_intake_binding_mismatch:${field}`);
    }
  }
  if (value.disposalDeadlineCategory !== "within_operator_approved_window") {
    issues.push("approval_request_disposal_deadline_mapping_invalid");
  }
  if (value.requestNonceHash === intake.intakeNonceHash) {
    issues.push("approval_request_nonce_must_differ_from_intake_nonce");
  }
  if (value.approvalRequested !== false || value.approvalGranted !== false ||
      value.rawMaterialPresent !== false) {
    issues.push("approval_request_non_authorizing_boundary_invalid");
  }
  const requestExpiry = parseCanonicalInstant(value.expiresAt);
  const intakeExpiry = parseCanonicalInstant(intake.expiresAt);
  const templateExpiry = parseCanonicalInstant(expected.templateExpiresAt);
  if ([requestExpiry, intakeExpiry, templateExpiry].every((instant) => instant !== null) &&
      (requestExpiry > intakeExpiry || requestExpiry > templateExpiry)) {
    issues.push("approval_request_outlives_intake_or_template");
  }
  return uniqueSorted(issues);
}

function buildSummary(intake, approvalRequest, upstream) {
  const binding = buildBindings(upstream);
  return sealContract({
    contractVersion: VERSIONS.summary,
    sanitizedObservationIntakeRecordId: intake.sanitizedObservationIntakeRecordId,
    sanitizedObservationIntakeRecordHash: intake.sanitizedObservationIntakeRecordHash,
    approvalRequestId: approvalRequest.approvalRequestId,
    approvalRequestHash: approvalRequest.approvalRequestHash,
    stepKProvisioningEvidenceSummaryId: binding.stepKProvisioningEvidenceSummaryId,
    stepKProvisioningEvidenceSummaryHash: binding.stepKProvisioningEvidenceSummaryHash,
    stepKProvisioningEvidenceId: binding.stepKProvisioningEvidenceId,
    stepKProvisioningEvidenceHash: binding.stepKProvisioningEvidenceHash,
    stepKObservationIntakeTemplateId: binding.stepKObservationIntakeTemplateId,
    stepKObservationIntakeTemplateHash: binding.stepKObservationIntakeTemplateHash,
    publicState: "sanitized_observation_intake_validated",
    sanitizedObservationIntakeValidated: true,
    approvalRequestEnvelopePrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateSummary(value, intake, approvalRequest, upstream) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(intake, approvalRequest, upstream); } catch {
    return uniqueSorted([...issues, "summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "approvalRequestPreparationSummaryId" ||
        field === "approvalRequestPreparationSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) issues.push(`summary_field_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildValidSyntheticPacket() {
  const upstream = buildUpstream();
  const intakeContext = { upstream, priorIntakeNonceHashes: [] };
  const intake = buildSyntheticSanitizedObservationIntakeFixture(intakeContext);
  const requestContext = buildStepHRequestContext(upstream, []);
  return {
    intakeContext,
    intake,
    requestContext,
    approvalRequest: buildSyntheticApprovalRequestEnvelope(intake, requestContext),
    evaluationClockInstant: "2026-07-18T00:03:00.000Z",
  };
}

function safeResult(status, summary = {}, issues = []) {
  const validated = status === "sanitized_observation_intake_validated";
  return {
    ok: validated,
    status,
    contractVersion: VERSIONS.summary,
    sanitizedObservationIntakeValidated: validated,
    approvalRequestEnvelopePrepared: validated,
    approvalRequestPreparationSummary: validated ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: validated ? [
      "synthetic_validation_does_not_collect_intake_send_request_grant_approval_or_observe",
    ] : [],
  };
}

function evaluateSanitizedObservationIntakePackage(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_external_sanitized_observation_intake");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "intakeContext", "intake", "requestContext", "approvalRequest",
    "evaluationClockInstant",
  ])) return safeResult("blocked", {}, ["sanitized_observation_packet_fields_invalid"]);
  try {
    const issues = [
      ...validateSanitizedObservationIntake(
        packet.intake, packet.intakeContext, packet.evaluationClockInstant,
      ),
      ...validateApprovalRequestEnvelope(
        packet.approvalRequest,
        packet.intake,
        packet.intakeContext,
        packet.requestContext,
        packet.evaluationClockInstant,
      ),
    ];
    if (issues.length > 0) return safeResult("blocked", {}, issues);
    const summary = buildSummary(
      packet.intake, packet.approvalRequest, packet.intakeContext.upstream,
    );
    issues.push(...validateSummary(
      summary, packet.intake, packet.approvalRequest, packet.intakeContext.upstream,
    ));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("sanitized_observation_intake_validated", summary);
  } catch {
    return safeResult("blocked", {}, ["sanitized_observation_intake_validation_failed"]);
  }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  MAXIMUM_INTAKE_LIFETIME_SECONDS,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  SPECS,
  VERSIONS,
  buildBindings,
  buildStepHRequestContext,
  buildSummary,
  buildSyntheticApprovalRequestEnvelope,
  buildSyntheticSanitizedObservationIntakeFixture,
  buildUpstream,
  buildValidSyntheticPacket,
  evaluateSanitizedObservationIntakePackage,
  getStepHMaterial,
  safeResult,
  sealContract,
  validateApprovalRequestEnvelope,
  validateIntakeContext,
  validateSanitizedObservationIntake,
  validateSummary,
  validateUpstream,
};
