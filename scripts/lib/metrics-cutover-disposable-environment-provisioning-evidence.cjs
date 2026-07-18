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
const stepJ = require("./metrics-cutover-operator-environment-class-decision.cjs");
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  evidence: "metrics-cutover-disposable-environment-provisioning-evidence-v1-step114-2x-k",
  template: "metrics-cutover-sanitized-environment-observation-intake-template-v1-step114-2x-k",
  summary: "metrics-cutover-disposable-environment-provisioning-evidence-summary-v1-step114-2x-k",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_external_disposable_environment_provisioning_evidence",
  "disposable_environment_provisioning_evidence_validated",
  "blocked",
]);

const DISPOSAL_DEADLINE_CATEGORIES = Object.freeze([
  "immediate_on_security_event",
  "within_24_hours_after_evidence_finalization",
  "within_7_days_after_run_completion",
]);

const TEMPLATE_FALSE_FIELDS = Object.freeze([
  "intakeCollected",
  "observationRequested",
  "observationApproved",
  "observationExecuted",
  "requestAuthorizesObservation",
  "requestAuthorizesConnection",
]);

const REQUIRED_FALSE_FIELDS = Object.freeze([
  "selectionDecisionRecorded",
  "humanSelectionRecorded",
  "realEnvironmentClassSelected",
  "realEnvironmentProvisioned",
  "realTargetSelected",
  "provisioningEvidenceRecorded",
  "sanitizedObservationIntakeCollected",
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
  ...stepJ.FIXED_FALSE_FIELDS,
  ...REQUIRED_FALSE_FIELDS,
])]);

const MAXIMUM_EVIDENCE_LIFETIME_SECONDS = 300;
const MAXIMUM_TEMPLATE_LIFETIME_SECONDS = 180;
const ALLOWED_CLOCK_SKEW_SECONDS = 30;

const SPECS = Object.freeze({
  evidence: Object.freeze({
    version: VERSIONS.evidence,
    idField: "provisioningEvidenceId",
    hashField: "provisioningEvidenceHash",
    prefix: "metrics-cutover-disposable-environment-provisioning-evidence",
    idDomain: "FINPLE_STEP114_2X_K_PROVISIONING_EVIDENCE_ID\0",
    hashDomain: "FINPLE_STEP114_2X_K_PROVISIONING_EVIDENCE_HASH\0",
  }),
  template: Object.freeze({
    version: VERSIONS.template,
    idField: "observationIntakeTemplateId",
    hashField: "observationIntakeTemplateHash",
    prefix: "metrics-cutover-sanitized-environment-observation-intake-template",
    idDomain: "FINPLE_STEP114_2X_K_OBSERVATION_INTAKE_TEMPLATE_ID\0",
    hashDomain: "FINPLE_STEP114_2X_K_OBSERVATION_INTAKE_TEMPLATE_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "provisioningEvidenceSummaryId",
    hashField: "provisioningEvidenceSummaryHash",
    prefix: "metrics-cutover-disposable-environment-provisioning-evidence-summary",
    idDomain: "FINPLE_STEP114_2X_K_PROVISIONING_EVIDENCE_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_K_PROVISIONING_EVIDENCE_SUMMARY_HASH\0",
  }),
});

const EVIDENCE_FIELDS = Object.freeze([
  "contractVersion", "provisioningEvidenceId",
  "stepJPreparationSummaryId", "stepJPreparationSummaryHash",
  "decisionReceiptId", "decisionReceiptHash",
  "provisioningRequestId", "provisioningRequestHash",
  "selectedCandidateClass", "stepIProvisioningRunbookId", "stepIProvisioningRunbookHash",
  "operationSequence", "operationCompletionAttestations",
  "stepJDecisionNonceHash", "stepJRequestNonceHash",
  "environmentBindingHash", "namespaceEvidenceHash", "destinationAllowlistHash",
  "migrationCredentialCategoryAttestationHash", "runtimeCredentialCategoryAttestationHash",
  "credentialExpiryAttestationHash", "credentialRotationAttestationHash",
  "credentialRevocationAttestationHash", "credentialDestructionAttestationHash",
  "runtimeDeniedPrivileges", "runtimeDeniedPrivilegeAttestationHash",
  "disposalResponsibilityAttestationHash", "disposalDeadlineCategory",
  "destinationCount", "issuedAt", "expiresAt", "evidenceNonceHash",
  "externalProvisioningAttested", "syntheticValidationOnly", "realProvisioningRecorded",
  "environmentExistenceInferred", "rawMaterialPresent", "providerSpecificMaterialPresent",
  "manualReviewRequired", "provisioningEvidenceHash",
]);

const TEMPLATE_FIELDS = Object.freeze([
  "contractVersion", "observationIntakeTemplateId",
  "provisioningEvidenceId", "provisioningEvidenceHash",
  "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
  "stepHSanitizedIntakeSchemaId", "stepHSanitizedIntakeSchemaHash",
  "selectedCandidateClass", "targetPurposeClassification", "namespaceCategory",
  "exactDestinationCount", "allowedFields", "requiredHashPlaceholders",
  "requiredTimestampPlaceholders", "credentialAttestationCategories",
  "runtimeDeniedPrivileges", "credentialProvisioningBoundaryId",
  "credentialProvisioningBoundaryHash", "disposalResponsibilityPolicyId",
  "disposalResponsibilityPolicyHash", "disposalDeadlineCategories",
  "separateLiveObservationApprovalRequired", "expiresAt", "templateNonceHash",
  "syntheticValidationOnly", "rawMaterialPresent", "manualReviewRequired",
  ...TEMPLATE_FALSE_FIELDS, "observationIntakeTemplateHash",
]);

const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "provisioningEvidenceSummaryId",
  "provisioningEvidenceId", "provisioningEvidenceHash",
  "observationIntakeTemplateId", "observationIntakeTemplateHash",
  "stepJPreparationSummaryId", "stepJPreparationSummaryHash",
  "publicState", "provisioningEvidenceValidated", "observationIntakeTemplatePrepared",
  "syntheticValidationOnly", "rawMaterialPresent",
  ...FIXED_FALSE_FIELDS, "provisioningEvidenceSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  evidence: EVIDENCE_FIELDS,
  template: TEMPLATE_FIELDS,
  summary: SUMMARY_FIELDS,
});

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
  const stepJPacket = stepJ.buildValidSyntheticPacket();
  return {
    stepJPacket,
    stepJPreparationSummary: stepJ.buildPreparationSummary(
      stepJPacket.receipt,
      stepJPacket.request,
      stepJPacket.decisionContext.upstream,
    ),
  };
}

function getStepHMaterial(upstream) {
  const stepIUpstream = upstream.stepJPacket.decisionContext.upstream.selectionPacket.upstream;
  return {
    packet: stepIUpstream.operatorObservationPacket,
    summary: stepIUpstream.operatorObservationSummary,
  };
}

function buildBindings(upstream) {
  const packet = upstream.stepJPacket;
  const summary = upstream.stepJPreparationSummary;
  const stepHMaterial = getStepHMaterial(upstream);
  const h = stepHMaterial.packet.contracts;
  return {
    stepJPreparationSummaryId: summary.preparationSummaryId,
    stepJPreparationSummaryHash: summary.preparationSummaryHash,
    decisionReceiptId: packet.receipt.decisionReceiptId,
    decisionReceiptHash: packet.receipt.decisionReceiptHash,
    provisioningRequestId: packet.request.provisioningRequestId,
    provisioningRequestHash: packet.request.provisioningRequestHash,
    selectedCandidateClass: packet.request.selectedCandidateClass,
    stepIProvisioningRunbookId: packet.request.stepIProvisioningRunbookId,
    stepIProvisioningRunbookHash: packet.request.stepIProvisioningRunbookHash,
    operationSequence: [...packet.request.operationSequence],
    stepJDecisionNonceHash: packet.receipt.decisionNonceHash,
    stepJRequestNonceHash: packet.request.requestNonceHash,
    stepJRequestExpiresAt: packet.request.expiresAt,
    stepJReceiptExpiresAt: packet.receipt.expiresAt,
    stepHSanitizedIntakeSchemaId: h.intake.sanitizedEnvironmentIntakeSchemaId,
    stepHSanitizedIntakeSchemaHash: h.intake.sanitizedEnvironmentIntakeSchemaHash,
    allowedFields: [...h.intake.allowedFields],
    requiredHashPlaceholders: [...h.intake.requiredHashPlaceholders],
    requiredTimestampPlaceholders: [...h.intake.requiredTimestampPlaceholders],
    allowedTargetPurposeClassifications: [...h.intake.allowedTargetPurposeClassifications],
    allowedNamespaceCategories: [...h.intake.allowedNamespaceCategories],
    credentialAttestationCategories: [...h.intake.credentialAttestationCategories],
    exactDestinationCount: h.intake.exactDestinationCount,
    credentialProvisioningBoundaryId: h.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash: h.credential.credentialProvisioningBoundaryHash,
    runtimeDeniedPrivileges: [...h.credential.runtimeDeniedPrivileges],
    disposalResponsibilityPolicyId: h.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: h.disposal.disposalResponsibilityPolicyHash,
    approvalRequestPolicyId: h.approval.approvalRequestPolicyId,
    approvalRequestPolicyHash: h.approval.approvalRequestPolicyHash,
    separateLiveObservationApprovalRequired:
      h.readiness.separateApprovalRequired && !h.approval.approvalGranted,
    transitiveStepIHGBindings: stepJ.buildStepIBindings(
      packet.decisionContext.upstream,
    ),
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "stepJPacket", "stepJPreparationSummary",
  ])) return ["step_j_upstream_fields_invalid"];
  const packet = upstream.stepJPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "decisionContext", "receipt", "requestContext", "request", "evaluationClockInstant",
  ])) return ["step_j_packet_fields_invalid"];
  const issues = [
    ...stepJ.validateUpstream(packet.decisionContext.upstream),
    ...stepJ.validateDecisionContext(packet.decisionContext),
    ...stepJ.validateOperatorDecisionReceipt(
      packet.receipt, packet.decisionContext, packet.evaluationClockInstant,
    ),
    ...stepJ.validateRequestContext(packet.requestContext),
    ...stepJ.validateProvisioningRequest(
      packet.request, packet.receipt, packet.requestContext, packet.evaluationClockInstant,
    ),
    ...stepJ.validatePreparationSummary(
      upstream.stepJPreparationSummary,
      packet.receipt,
      packet.request,
      packet.decisionContext.upstream,
    ),
  ];
  const evaluated = stepJ.evaluateOperatorEnvironmentClassDecision(packet);
  if (!evaluated.ok || evaluated.status !== "operator_environment_class_decision_validated") {
    issues.push("step_j_complete_package_invalid");
  }
  let expectedSummary;
  try {
    expectedSummary = stepJ.buildPreparationSummary(
      packet.receipt, packet.request, packet.decisionContext.upstream,
    );
  } catch {}
  if (!expectedSummary || !canonicalEqual(upstream.stepJPreparationSummary, expectedSummary)) {
    issues.push("step_j_preparation_summary_binding_mismatch");
  }

  let stepHMaterial;
  try { stepHMaterial = getStepHMaterial(upstream); } catch {
    issues.push("step_h_material_missing");
  }
  if (stepHMaterial) {
    const hPacket = stepHMaterial.packet;
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
        stepHMaterial.summary, hPacket.upstream, hPacket.contracts,
      ));
      let expectedH;
      try { expectedH = stepH.buildRunPackageSummary(hPacket.upstream, hPacket.contracts); } catch {}
      if (!expectedH || !canonicalEqual(stepHMaterial.summary, expectedH)) {
        issues.push("step_h_summary_binding_mismatch");
      }
    }
  }
  let binding;
  try { binding = buildBindings(upstream); } catch {
    issues.push("step_k_binding_construction_failed");
  }
  if (binding) {
    const transitive = binding.transitiveStepIHGBindings.transitiveStepHGBindings
      .transitiveExecutionPlanBindings;
    if (binding.operationSequence.length !== 11 || transitive.executionSequence.length !== 12 ||
        transitive.exactScenarioCount !== 15 || transitive.scenarioOrder.length !== 15 ||
        binding.exactDestinationCount !== 1 || binding.separateLiveObservationApprovalRequired !== true) {
      issues.push("step_j_h_g_exact_scope_invalid");
    }
  }
  return uniqueSorted(issues);
}

function validateEvidenceContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "priorEvidenceNonceHashes",
  ])) return ["evidence_context_fields_invalid"];
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...validateHashArray(context.priorEvidenceNonceHashes, "prior_evidence_nonce_hashes"),
  ]);
}

function buildSyntheticProvisioningEvidenceFixture(context) {
  const binding = buildBindings(context.upstream);
  return sealContract({
    contractVersion: VERSIONS.evidence,
    stepJPreparationSummaryId: binding.stepJPreparationSummaryId,
    stepJPreparationSummaryHash: binding.stepJPreparationSummaryHash,
    decisionReceiptId: binding.decisionReceiptId,
    decisionReceiptHash: binding.decisionReceiptHash,
    provisioningRequestId: binding.provisioningRequestId,
    provisioningRequestHash: binding.provisioningRequestHash,
    selectedCandidateClass: binding.selectedCandidateClass,
    stepIProvisioningRunbookId: binding.stepIProvisioningRunbookId,
    stepIProvisioningRunbookHash: binding.stepIProvisioningRunbookHash,
    operationSequence: binding.operationSequence,
    operationCompletionAttestations: binding.operationSequence.map((operation, index) => ({
      operation,
      completionAttestationHash: (index + 1).toString(16).repeat(64),
    })),
    stepJDecisionNonceHash: binding.stepJDecisionNonceHash,
    stepJRequestNonceHash: binding.stepJRequestNonceHash,
    environmentBindingHash: "b".repeat(64),
    namespaceEvidenceHash: "c".repeat(64),
    destinationAllowlistHash: "d".repeat(64),
    migrationCredentialCategoryAttestationHash: "e".repeat(64),
    runtimeCredentialCategoryAttestationHash: "f".repeat(64),
    credentialExpiryAttestationHash: "6".repeat(64),
    credentialRotationAttestationHash: "7".repeat(64),
    credentialRevocationAttestationHash: "8".repeat(64),
    credentialDestructionAttestationHash: "9".repeat(64),
    runtimeDeniedPrivileges: binding.runtimeDeniedPrivileges,
    runtimeDeniedPrivilegeAttestationHash: "a".repeat(64),
    disposalResponsibilityAttestationHash: "0".repeat(64),
    disposalDeadlineCategory: DISPOSAL_DEADLINE_CATEGORIES[0],
    destinationCount: 1,
    issuedAt: "2026-07-18T00:02:30.000Z",
    expiresAt: "2026-07-18T00:05:00.000Z",
    evidenceNonceHash: "5".repeat(64),
    externalProvisioningAttested: true,
    syntheticValidationOnly: true,
    realProvisioningRecorded: false,
    environmentExistenceInferred: false,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
  }, "evidence");
}

function validateProvisioningEvidence(value, context, evaluationClockInstant) {
  const contextIssues = validateEvidenceContext(context);
  const issues = [...validateEnvelope(value, "evidence"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.upstream) ||
      !Array.isArray(context.priorEvidenceNonceHashes) || contextIssues.length > 0) {
    return uniqueSorted(issues);
  }
  const binding = buildBindings(context.upstream);
  for (const field of [
    "stepJPreparationSummaryId", "stepJPreparationSummaryHash",
    "decisionReceiptId", "decisionReceiptHash", "provisioningRequestId", "provisioningRequestHash",
    "selectedCandidateClass", "stepIProvisioningRunbookId", "stepIProvisioningRunbookHash",
    "stepJDecisionNonceHash", "stepJRequestNonceHash",
  ]) {
    if (value[field] !== binding[field]) issues.push(`evidence_upstream_binding_mismatch:${field}`);
  }
  if (!canonicalEqual(value.operationSequence, binding.operationSequence)) {
    issues.push("evidence_operation_sequence_invalid");
  }
  const expectedAttestations = binding.operationSequence;
  if (!Array.isArray(value.operationCompletionAttestations) ||
      value.operationCompletionAttestations.length !== expectedAttestations.length) {
    issues.push("evidence_operation_attestations_invalid");
  } else {
    value.operationCompletionAttestations.forEach((attestation, index) => {
      if (!isRecord(attestation) || !hasExactKeys(attestation, [
        "operation", "completionAttestationHash",
      ]) || attestation.operation !== expectedAttestations[index] ||
          !isSha256(attestation.completionAttestationHash)) {
        issues.push(`evidence_operation_attestation_invalid:${index}`);
      }
    });
    const hashes = value.operationCompletionAttestations
      .map((attestation) => attestation?.completionAttestationHash);
    if (new Set(hashes).size !== hashes.length) issues.push("evidence_operation_attestation_duplicate");
  }
  for (const field of [
    "environmentBindingHash", "namespaceEvidenceHash", "destinationAllowlistHash",
    "migrationCredentialCategoryAttestationHash", "runtimeCredentialCategoryAttestationHash",
    "credentialExpiryAttestationHash", "credentialRotationAttestationHash",
    "credentialRevocationAttestationHash", "credentialDestructionAttestationHash",
    "runtimeDeniedPrivilegeAttestationHash", "disposalResponsibilityAttestationHash",
    "evidenceNonceHash",
  ]) {
    if (!isSha256(value[field])) issues.push(`evidence_hash_invalid:${field}`);
  }
  if (value.migrationCredentialCategoryAttestationHash ===
      value.runtimeCredentialCategoryAttestationHash) {
    issues.push("evidence_credential_categories_not_distinct");
  }
  if (!canonicalEqual(value.runtimeDeniedPrivileges, binding.runtimeDeniedPrivileges)) {
    issues.push("evidence_runtime_denied_privileges_invalid");
  }
  if (!DISPOSAL_DEADLINE_CATEGORIES.includes(value.disposalDeadlineCategory)) {
    issues.push("evidence_disposal_deadline_category_invalid");
  }
  if (value.destinationCount !== binding.exactDestinationCount || value.destinationCount !== 1) {
    issues.push("evidence_destination_count_invalid");
  }
  if (isSha256(value.evidenceNonceHash) &&
      context.priorEvidenceNonceHashes.includes(value.evidenceNonceHash)) {
    issues.push("evidence_nonce_replay_manual_review");
  }
  if (value.externalProvisioningAttested !== true || value.syntheticValidationOnly !== true ||
      value.realProvisioningRecorded !== false || value.environmentExistenceInferred !== false ||
      value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false) {
    issues.push("evidence_synthetic_non_inference_boundary_invalid");
  }
  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  const requestExpiry = parseCanonicalInstant(binding.stepJRequestExpiresAt);
  const receiptExpiry = parseCanonicalInstant(binding.stepJReceiptExpiresAt);
  if (issuedAt === null) issues.push("evidence_issued_at_invalid");
  if (expiresAt === null) issues.push("evidence_expires_at_invalid");
  if (evaluationClock === null) issues.push("evidence_evaluation_clock_invalid");
  if ([issuedAt, expiresAt, evaluationClock, requestExpiry, receiptExpiry]
    .every((instant) => instant !== null)) {
    const skew = ALLOWED_CLOCK_SKEW_SECONDS * 1000;
    if (issuedAt >= expiresAt) issues.push("evidence_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("evidence_future_dated");
    if (evaluationClock >= expiresAt) issues.push("evidence_expired");
    if (expiresAt - issuedAt > MAXIMUM_EVIDENCE_LIFETIME_SECONDS * 1000) {
      issues.push("evidence_lifetime_excessive");
    }
    if (expiresAt > requestExpiry || expiresAt > receiptExpiry) {
      issues.push("evidence_outlives_step_j_authority_window");
    }
  }
  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("evidence_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("evidence_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function validateTemplateContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "evidenceContext", "priorTemplateNonceHashes",
  ])) return ["template_context_fields_invalid"];
  return uniqueSorted([
    ...validateEvidenceContext(context.evidenceContext),
    ...validateHashArray(context.priorTemplateNonceHashes, "prior_template_nonce_hashes"),
  ]);
}

function buildSyntheticObservationIntakeTemplateFixture(evidence, context) {
  const binding = buildBindings(context.evidenceContext.upstream);
  return sealContract({
    contractVersion: VERSIONS.template,
    provisioningEvidenceId: evidence.provisioningEvidenceId,
    provisioningEvidenceHash: evidence.provisioningEvidenceHash,
    stepJProvisioningRequestId: binding.provisioningRequestId,
    stepJProvisioningRequestHash: binding.provisioningRequestHash,
    stepHSanitizedIntakeSchemaId: binding.stepHSanitizedIntakeSchemaId,
    stepHSanitizedIntakeSchemaHash: binding.stepHSanitizedIntakeSchemaHash,
    selectedCandidateClass: evidence.selectedCandidateClass,
    targetPurposeClassification: binding.allowedTargetPurposeClassifications[0],
    namespaceCategory: binding.allowedNamespaceCategories[0],
    exactDestinationCount: binding.exactDestinationCount,
    allowedFields: binding.allowedFields,
    requiredHashPlaceholders: binding.requiredHashPlaceholders,
    requiredTimestampPlaceholders: binding.requiredTimestampPlaceholders,
    credentialAttestationCategories: binding.credentialAttestationCategories,
    runtimeDeniedPrivileges: binding.runtimeDeniedPrivileges,
    credentialProvisioningBoundaryId: binding.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash: binding.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId: binding.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: binding.disposalResponsibilityPolicyHash,
    disposalDeadlineCategories: [...DISPOSAL_DEADLINE_CATEGORIES],
    separateLiveObservationApprovalRequired: true,
    expiresAt: "2026-07-18T00:04:30.000Z",
    templateNonceHash: "4".repeat(64),
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    manualReviewRequired: false,
    ...Object.fromEntries(TEMPLATE_FALSE_FIELDS.map((field) => [field, false])),
  }, "template");
}

function validateObservationIntakeTemplate(
  value, evidence, context, evaluationClockInstant,
) {
  const contextIssues = validateTemplateContext(context);
  const evidenceIssues = isRecord(context) && isRecord(context.evidenceContext)
    ? validateProvisioningEvidence(evidence, context.evidenceContext, evaluationClockInstant)
    : ["template_evidence_context_invalid"];
  const issues = [...validateEnvelope(value, "template"), ...contextIssues, ...evidenceIssues];
  if (!isRecord(value) || !isRecord(evidence) || !isRecord(context) ||
      !isRecord(context.evidenceContext) || !Array.isArray(context.priorTemplateNonceHashes) ||
      contextIssues.length > 0 || evidenceIssues.length > 0) return uniqueSorted(issues);
  const binding = buildBindings(context.evidenceContext.upstream);
  if (value.provisioningEvidenceId !== evidence.provisioningEvidenceId ||
      value.provisioningEvidenceHash !== evidence.provisioningEvidenceHash) {
    issues.push("template_evidence_binding_mismatch");
  }
  for (const field of [
    "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
    "stepHSanitizedIntakeSchemaId", "stepHSanitizedIntakeSchemaHash",
  ]) {
    const source = field.startsWith("stepJ")
      ? field.replace("stepJProvisioningRequest", "provisioningRequest")
      : field.replace("stepHSanitizedIntakeSchema", "stepHSanitizedIntakeSchema");
    if (value[field] !== binding[source]) issues.push(`template_upstream_binding_mismatch:${field}`);
  }
  if (value.selectedCandidateClass !== evidence.selectedCandidateClass) {
    issues.push("template_selected_candidate_binding_mismatch");
  }
  if (!binding.allowedTargetPurposeClassifications.includes(value.targetPurposeClassification) ||
      !binding.allowedNamespaceCategories.includes(value.namespaceCategory) ||
      value.exactDestinationCount !== binding.exactDestinationCount) {
    issues.push("template_classification_or_destination_invalid");
  }
  for (const field of [
    "allowedFields", "requiredHashPlaceholders", "requiredTimestampPlaceholders",
    "credentialAttestationCategories", "runtimeDeniedPrivileges",
  ]) {
    if (!canonicalEqual(value[field], binding[field])) issues.push(`template_step_h_scope_invalid:${field}`);
  }
  for (const field of [
    "credentialProvisioningBoundaryId", "credentialProvisioningBoundaryHash",
    "disposalResponsibilityPolicyId", "disposalResponsibilityPolicyHash",
  ]) {
    if (value[field] !== binding[field]) issues.push(`template_step_h_binding_mismatch:${field}`);
  }
  if (!canonicalEqual(value.disposalDeadlineCategories, DISPOSAL_DEADLINE_CATEGORIES) ||
      value.separateLiveObservationApprovalRequired !== true) {
    issues.push("template_disposal_or_approval_requirement_invalid");
  }
  if (!isSha256(value.templateNonceHash)) issues.push("template_nonce_hash_invalid");
  if (isSha256(value.templateNonceHash) &&
      context.priorTemplateNonceHashes.includes(value.templateNonceHash)) {
    issues.push("template_nonce_replay_manual_review");
  }
  if (value.syntheticValidationOnly !== true || value.rawMaterialPresent !== false) {
    issues.push("template_synthetic_or_raw_boundary_invalid");
  }
  for (const field of TEMPLATE_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`template_authority_must_be_false:${field}`);
  }
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const evidenceExpiry = parseCanonicalInstant(evidence.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (expiresAt === null) issues.push("template_expires_at_invalid");
  if ([expiresAt, evidenceExpiry, evaluationClock].every((instant) => instant !== null)) {
    if (expiresAt > evidenceExpiry) issues.push("template_outlives_evidence");
    if (evaluationClock >= expiresAt) issues.push("template_expired");
    if (expiresAt - evaluationClock > MAXIMUM_TEMPLATE_LIFETIME_SECONDS * 1000) {
      issues.push("template_lifetime_excessive");
    }
  }
  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("template_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("template_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function buildSummary(evidence, template, upstream) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    provisioningEvidenceId: evidence.provisioningEvidenceId,
    provisioningEvidenceHash: evidence.provisioningEvidenceHash,
    observationIntakeTemplateId: template.observationIntakeTemplateId,
    observationIntakeTemplateHash: template.observationIntakeTemplateHash,
    stepJPreparationSummaryId: upstream.stepJPreparationSummary.preparationSummaryId,
    stepJPreparationSummaryHash: upstream.stepJPreparationSummary.preparationSummaryHash,
    publicState: "disposable_environment_provisioning_evidence_validated",
    provisioningEvidenceValidated: true,
    observationIntakeTemplatePrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateSummary(value, evidence, template, upstream) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSummary(evidence, template, upstream); } catch {
    return uniqueSorted([...issues, "summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "provisioningEvidenceSummaryId" ||
        field === "provisioningEvidenceSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) issues.push(`summary_field_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildValidSyntheticPacket() {
  const evidenceContext = { upstream: buildUpstream(), priorEvidenceNonceHashes: [] };
  const evidence = buildSyntheticProvisioningEvidenceFixture(evidenceContext);
  const templateContext = { evidenceContext, priorTemplateNonceHashes: [] };
  return {
    evidenceContext,
    evidence,
    templateContext,
    template: buildSyntheticObservationIntakeTemplateFixture(evidence, templateContext),
    evaluationClockInstant: "2026-07-18T00:03:00.000Z",
  };
}

function safeResult(status, summary = {}, issues = []) {
  const validated = status === "disposable_environment_provisioning_evidence_validated";
  return {
    ok: validated,
    status,
    contractVersion: VERSIONS.summary,
    provisioningEvidenceValidated: validated,
    observationIntakeTemplatePrepared: validated,
    provisioningEvidenceSummary: validated ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: validated ? [
      "synthetic_shape_validation_does_not_record_provisioning_or_collect_observation_intake",
    ] : [],
  };
}

function evaluateProvisioningEvidencePackage(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_external_disposable_environment_provisioning_evidence");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "evidenceContext", "evidence", "templateContext", "template", "evaluationClockInstant",
  ])) return safeResult("blocked", {}, ["provisioning_evidence_packet_fields_invalid"]);
  try {
    const issues = [
      ...validateProvisioningEvidence(
        packet.evidence, packet.evidenceContext, packet.evaluationClockInstant,
      ),
      ...validateObservationIntakeTemplate(
        packet.template,
        packet.evidence,
        packet.templateContext,
        packet.evaluationClockInstant,
      ),
    ];
    if (issues.length > 0) return safeResult("blocked", {}, issues);
    const summary = buildSummary(
      packet.evidence, packet.template, packet.evidenceContext.upstream,
    );
    issues.push(...validateSummary(
      summary, packet.evidence, packet.template, packet.evidenceContext.upstream,
    ));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("disposable_environment_provisioning_evidence_validated", summary);
  } catch {
    return safeResult("blocked", {}, ["provisioning_evidence_validation_failed"]);
  }
}

module.exports = {
  ALLOWED_CLOCK_SKEW_SECONDS,
  DISPOSAL_DEADLINE_CATEGORIES,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  MAXIMUM_EVIDENCE_LIFETIME_SECONDS,
  MAXIMUM_TEMPLATE_LIFETIME_SECONDS,
  PUBLIC_STATES,
  REQUIRED_FALSE_FIELDS,
  SPECS,
  TEMPLATE_FALSE_FIELDS,
  VERSIONS,
  buildBindings,
  buildSummary,
  buildSyntheticObservationIntakeTemplateFixture,
  buildSyntheticProvisioningEvidenceFixture,
  buildUpstream,
  buildValidSyntheticPacket,
  evaluateProvisioningEvidencePackage,
  getStepHMaterial,
  safeResult,
  sealContract,
  validateEvidenceContext,
  validateObservationIntakeTemplate,
  validateProvisioningEvidence,
  validateSummary,
  validateTemplateContext,
  validateUpstream,
};
