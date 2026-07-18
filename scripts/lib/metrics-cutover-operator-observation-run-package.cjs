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
const stepG = require("./metrics-cutover-disposable-test-database-execution-plan.cjs");
const { FUTURE_SCENARIOS } = require("./metrics-cutover-postgresql-test-package.cjs");

const VERSIONS = Object.freeze({
  readiness: "metrics-cutover-operator-observation-readiness-checklist-v1-step114-2x-h",
  intake: "metrics-cutover-sanitized-environment-intake-schema-v1-step114-2x-h",
  approval: "metrics-cutover-live-observation-approval-request-policy-v1-step114-2x-h",
  credential: "metrics-cutover-credential-provisioning-boundary-v1-step114-2x-h",
  disposal: "metrics-cutover-environment-disposal-responsibility-policy-v1-step114-2x-h",
  request: "metrics-cutover-live-observation-approval-request-envelope-v1-step114-2x-h",
  summary: "metrics-cutover-operator-observation-run-package-summary-v1-step114-2x-h",
});

const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepG.FIXED_FALSE_FIELDS,
  "environmentObservationAuthorized", "credentialProvisioningAuthorized",
  "oneTimeAuthorizationIssueAuthorized", "executionClaimAuthorized",
  "scenarioExecutionAuthorized", "receiptCreationAuthorized",
  "environmentDisposalAuthorized", "environmentDisposalExecuted",
])]);

const REQUESTED_OPERATION_SET = Object.freeze([
  "observe_one_sanitized_disposable_environment",
  "validate_observation_package_offline",
  "prepare_one_time_authorization_request",
]);

const REQUIRED_DECISION_ITEMS = Object.freeze([
  "disposable_environment_exists_outside_source_control",
  "non_production_non_staging_non_shared_non_analytics_non_application",
  "no_application_or_unrelated_data",
  "exactly_one_destination",
  "namespace_new_empty_or_separately_approved_disposable",
  "dedicated_migration_and_runtime_credentials_external",
  "sensitive_values_never_committed_or_emitted",
  "runtime_privileges_exclude_mutation_ownership_and_superuser",
  "migration_credentials_not_reused_for_observation",
  "credential_expiry_revocation_and_disposal_responsibility_assigned",
  "separate_explicit_approval_required_before_live_observation",
]);

const RUNTIME_DENIED_PRIVILEGES = Object.freeze([
  "ALTER", "DELETE", "DROP", "TRUNCATE", "schema_owner", "superuser",
]);

const INTAKE_ALLOWED_FIELDS = Object.freeze([
  "targetPurposeClassification", "namespaceCategory", "destinationCount",
  "environmentBindingHash",
  "namespaceEvidenceHash", "destinationAllowlistHash",
  "databaseFingerprintHash", "certificateFingerprintHash",
  "observerAttestationHash", "migrationCredentialCategoryAttestationHash",
  "runtimeCredentialCategoryAttestationHash", "credentialExpiryAttestationHash",
  "credentialRotationAttestationHash", "credentialRevocationAttestationHash",
  "credentialDestructionAttestationHash", "disposalResponsibilityAttestationHash",
  "disposalDeadlineCategory",
  "observationWindowStartsAt", "observationWindowExpiresAt",
  "manualReviewRequired", "rawMaterialPresent",
]);

const DOMAINS = Object.freeze(Object.fromEntries(
  Object.keys(VERSIONS).flatMap((name) => [
    [`${name}Id`, `FINPLE_STEP114_2X_H_${name.toUpperCase()}_ID\0`],
    [`${name}Hash`, `FINPLE_STEP114_2X_H_${name.toUpperCase()}_HASH\0`],
  ]),
));

const SPECS = Object.freeze({
  readiness: Object.freeze({
    version: VERSIONS.readiness, idField: "readinessChecklistId",
    hashField: "readinessChecklistHash", prefix: "metrics-cutover-operator-observation-readiness",
    idDomain: DOMAINS.readinessId, hashDomain: DOMAINS.readinessHash,
  }),
  intake: Object.freeze({
    version: VERSIONS.intake, idField: "sanitizedEnvironmentIntakeSchemaId",
    hashField: "sanitizedEnvironmentIntakeSchemaHash", prefix: "metrics-cutover-sanitized-environment-intake",
    idDomain: DOMAINS.intakeId, hashDomain: DOMAINS.intakeHash,
  }),
  approval: Object.freeze({
    version: VERSIONS.approval, idField: "approvalRequestPolicyId",
    hashField: "approvalRequestPolicyHash", prefix: "metrics-cutover-live-observation-approval-policy",
    idDomain: DOMAINS.approvalId, hashDomain: DOMAINS.approvalHash,
  }),
  credential: Object.freeze({
    version: VERSIONS.credential, idField: "credentialProvisioningBoundaryId",
    hashField: "credentialProvisioningBoundaryHash", prefix: "metrics-cutover-credential-provisioning-boundary",
    idDomain: DOMAINS.credentialId, hashDomain: DOMAINS.credentialHash,
  }),
  disposal: Object.freeze({
    version: VERSIONS.disposal, idField: "disposalResponsibilityPolicyId",
    hashField: "disposalResponsibilityPolicyHash", prefix: "metrics-cutover-environment-disposal-responsibility",
    idDomain: DOMAINS.disposalId, hashDomain: DOMAINS.disposalHash,
  }),
  request: Object.freeze({
    version: VERSIONS.request, idField: "approvalRequestId",
    hashField: "approvalRequestHash", prefix: "metrics-cutover-live-observation-approval-request",
    idDomain: DOMAINS.requestId, hashDomain: DOMAINS.requestHash,
  }),
  summary: Object.freeze({
    version: VERSIONS.summary, idField: "runPackageSummaryId",
    hashField: "runPackageSummaryHash", prefix: "metrics-cutover-operator-observation-run-package-summary",
    idDomain: DOMAINS.summaryId, hashDomain: DOMAINS.summaryHash,
  }),
});

const READINESS_FIELDS = Object.freeze([
  "contractVersion", "readinessChecklistId", "upstreamBindings",
  "requiredDecisionItems", "operatorConfirmationRequired",
  "decisionsMustRemainOutsideSourceControl", "separateApprovalRequired",
  "operatorDecisionsRecorded", "targetCreated", "targetSelected",
  "observationStarted", "readinessChecklistHash",
]);
const INTAKE_FIELDS = Object.freeze([
  "contractVersion", "sanitizedEnvironmentIntakeSchemaId", "upstreamBindings",
  "allowedFields", "requiredHashPlaceholders", "requiredTimestampPlaceholders",
  "allowedTargetPurposeClassifications", "allowedNamespaceCategories",
  "credentialAttestationCategories", "exactDestinationCount",
  "rawMaterialAllowed", "intakeCollected", "sanitizedEnvironmentIntakeSchemaHash",
]);
const CREDENTIAL_FIELDS = Object.freeze([
  "contractVersion", "credentialProvisioningBoundaryId", "upstreamBindings",
  "credentialCategories", "categoriesDistinct", "externalInjectionOnly",
  "forbiddenInputChannels", "applicationCredentialReuseAllowed",
  "migrationCredentialReuseForObservationAllowed", "runtimeDeniedPrivileges",
  "runtimeSchemaOwnerAllowed", "runtimeSuperuserAllowed",
  "leastPrivilegeRequired", "expiryAttestationRequired",
  "rotationAttestationRequired", "revocationAttestationRequired",
  "postRunDestructionAttestationRequired", "credentialProvisioned",
  "credentialInjected", "credentialProvisioningBoundaryHash",
]);
const DISPOSAL_FIELDS = Object.freeze([
  "contractVersion", "disposalResponsibilityPolicyId", "upstreamBindings",
  "safeReversiblePackageAvailable", "environmentDisposalRequired",
  "disposalAfterCredentialRevocationRequired", "disposalAfterEvidenceFinalizationRequired",
  "emergencySecurityRevocationException", "responsibilityAttestationHashRequired",
  "disposalDeadlineCategoryRequired", "destructiveSharedCleanupAllowed",
  "applicationSystemCleanupAllowed", "unrelatedSystemCleanupAllowed",
  "environmentDisposalAuthorized", "environmentDisposalExecuted",
  "disposalResponsibilityPolicyHash",
]);
const APPROVAL_FIELDS = Object.freeze([
  "contractVersion", "approvalRequestPolicyId", "upstreamBindings",
  "readinessChecklistId", "readinessChecklistHash",
  "sanitizedEnvironmentIntakeSchemaId", "sanitizedEnvironmentIntakeSchemaHash",
  "credentialProvisioningBoundaryId", "credentialProvisioningBoundaryHash",
  "disposalResponsibilityPolicyId", "disposalResponsibilityPolicyHash",
  "requestContractVersion", "requestedOperationSet", "maximumObservationCount",
  "maximumRequestLifetimeSeconds", "allowedClockSkewSeconds",
  "approverIdentityHashRequired", "requestNonceHashRequired",
  "issuedAtRequired", "expiresAtRequired", "replayPolicy", "ambiguityPolicy",
  "connectionAuthorityAllowed", "sqlAuthorityAllowed", "migrationAuthorityAllowed",
  "scenarioAuthorityAllowed", "claimAuthorityAllowed", "receiptAuthorityAllowed",
  "rollbackAuthorityAllowed", "disposalAuthorityAllowed",
  "approvalRequested", "approvalGranted", "approvalRequestPolicyHash",
]);
const REQUEST_FIELDS = Object.freeze([
  "contractVersion", "approvalRequestId", "runPackageSummaryId", "runPackageSummaryHash",
  "readinessChecklistId", "readinessChecklistHash",
  "sanitizedEnvironmentIntakeSchemaId", "sanitizedEnvironmentIntakeSchemaHash",
  "approvalRequestPolicyId", "approvalRequestPolicyHash",
  "credentialProvisioningBoundaryId", "credentialProvisioningBoundaryHash",
  "disposalResponsibilityPolicyId", "disposalResponsibilityPolicyHash",
  "executionPreflightSummaryId", "executionPreflightSummaryHash",
  "targetSelectionPolicyId", "targetSelectionPolicyHash",
  "sequencePolicyId", "sequencePolicyHash", "rollbackPolicyId", "rollbackPolicyHash",
  "evidenceCollectionPlanId", "evidenceCollectionPlanHash",
  ...INTAKE_ALLOWED_FIELDS,
  "requestedOperationSet", "maximumObservationCount", "runtimeDeniedPrivileges",
  "categoriesDistinct", "migrationCredentialUsedForObservation",
  "sanitizedApproverIdentityHash", "requestNonceHash", "issuedAt", "expiresAt",
  "approvalRequested", "approvalGranted", "approvalRequestHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "runPackageSummaryId", "upstreamBindings",
  "readinessChecklistId", "readinessChecklistHash",
  "sanitizedEnvironmentIntakeSchemaId", "sanitizedEnvironmentIntakeSchemaHash",
  "approvalRequestPolicyId", "approvalRequestPolicyHash",
  "credentialProvisioningBoundaryId", "credentialProvisioningBoundaryHash",
  "disposalResponsibilityPolicyId", "disposalResponsibilityPolicyHash",
  "futureApprovalRequestContractVersion", "requestedOperationCount",
  "packagePrepared", "operatorDecisionsRecorded", "intakeCollected",
  "approvalRequestGenerated", "approvalRequested", "approvalGranted",
  "credentialProvisioned", "credentialInjected",
  ...FIXED_FALSE_FIELDS, "runPackageSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  readiness: READINESS_FIELDS, intake: INTAKE_FIELDS, approval: APPROVAL_FIELDS,
  credential: CREDENTIAL_FIELDS, disposal: DISPOSAL_FIELDS,
  request: REQUEST_FIELDS, summary: SUMMARY_FIELDS,
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

function buildUpstream() {
  const executionPlanPacket = stepG.buildValidPreparationPacket();
  return {
    executionPlanPacket,
    executionPreflightSummary: stepG.buildExecutionPreflightSummary(
      executionPlanPacket.upstream, executionPlanPacket.contracts,
    ),
  };
}

function buildUpstreamBindings(upstream) {
  const packet = upstream.executionPlanPacket;
  const summary = upstream.executionPreflightSummary;
  return {
    executionPreflightSummaryId: summary.executionPreflightSummaryId,
    executionPreflightSummaryHash: summary.executionPreflightSummaryHash,
    targetSelectionPolicyId: packet.contracts.targetSelection.targetSelectionPolicyId,
    targetSelectionPolicyHash: packet.contracts.targetSelection.targetSelectionPolicyHash,
    sequencePolicyId: packet.contracts.sequence.sequencePolicyId,
    sequencePolicyHash: packet.contracts.sequence.sequencePolicyHash,
    rollbackPolicyId: packet.contracts.rollback.rollbackPolicyId,
    rollbackPolicyHash: packet.contracts.rollback.rollbackPolicyHash,
    evidenceCollectionPlanId: packet.contracts.evidence.evidenceCollectionPlanId,
    evidenceCollectionPlanHash: packet.contracts.evidence.evidenceCollectionPlanHash,
    executionManifestContractVersion: stepG.VERSIONS.manifest,
    stepGUpstreamBindings: stepG.buildUpstreamBindings(packet.upstream),
    exactScenarioCount: FUTURE_SCENARIOS.length,
    scenarioOrder: [...FUTURE_SCENARIOS],
    executionSequence: [...stepG.EXECUTION_SEQUENCE],
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "executionPlanPacket", "executionPreflightSummary",
  ])) return ["upstream_fields_invalid"];
  const packet = upstream.executionPlanPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "targetSelection", "sequence", "rollback", "evidence",
      ])) return ["step_g_execution_plan_packet_fields_invalid"];
  const issues = [...stepG.validateUpstream(packet.upstream)];
  for (const name of ["targetSelection", "sequence", "rollback", "evidence"]) {
    issues.push(...stepG.validateContract(packet.contracts[name], name, packet.upstream));
  }
  issues.push(...stepG.validateExecutionPreflightSummary(
    upstream.executionPreflightSummary, packet.upstream, packet.contracts,
  ));
  let expectedSummary;
  try {
    expectedSummary = stepG.buildExecutionPreflightSummary(packet.upstream, packet.contracts);
  } catch {}
  if (!expectedSummary || !canonicalEqual(upstream.executionPreflightSummary, expectedSummary)) {
    issues.push("step_g_execution_preflight_summary_binding_mismatch");
  }
  if (!canonicalEqual(packet.contracts.sequence.operationSequence, stepG.EXECUTION_SEQUENCE)) {
    issues.push("step_g_execution_sequence_binding_mismatch");
  }
  if (packet.contracts.targetSelection.exactDestinationCount !== 1 ||
      packet.contracts.targetSelection.targetSelected !== false) {
    issues.push("step_g_target_selection_boundary_invalid");
  }
  return uniqueSorted(issues);
}

function buildReadinessChecklist(upstream) {
  return sealContract({
    contractVersion: VERSIONS.readiness,
    upstreamBindings: buildUpstreamBindings(upstream),
    requiredDecisionItems: [...REQUIRED_DECISION_ITEMS],
    operatorConfirmationRequired: true,
    decisionsMustRemainOutsideSourceControl: true,
    separateApprovalRequired: true,
    operatorDecisionsRecorded: false,
    targetCreated: false,
    targetSelected: false,
    observationStarted: false,
  }, "readiness");
}

function buildSanitizedIntakeSchema(upstream) {
  const targetSelection = upstream.executionPlanPacket.contracts.targetSelection;
  return sealContract({
    contractVersion: VERSIONS.intake,
    upstreamBindings: buildUpstreamBindings(upstream),
    allowedFields: [...INTAKE_ALLOWED_FIELDS],
    requiredHashPlaceholders: [
      "environmentBindingHash", "namespaceEvidenceHash", "destinationAllowlistHash",
      "databaseFingerprintHash", "certificateFingerprintHash", "observerAttestationHash",
      "migrationCredentialCategoryAttestationHash", "runtimeCredentialCategoryAttestationHash",
      "credentialExpiryAttestationHash", "credentialRotationAttestationHash",
      "credentialRevocationAttestationHash", "credentialDestructionAttestationHash",
      "disposalResponsibilityAttestationHash",
    ],
    requiredTimestampPlaceholders: [
      "observationWindowStartsAt", "observationWindowExpiresAt",
    ],
    allowedTargetPurposeClassifications: ["disposable_isolated_conformance_only"],
    allowedNamespaceCategories: [...targetSelection.allowedNamespaceCategories],
    credentialAttestationCategories: ["future_migration", "future_runtime"],
    exactDestinationCount: 1,
    rawMaterialAllowed: false,
    intakeCollected: false,
  }, "intake");
}

function buildCredentialBoundary(upstream) {
  return sealContract({
    contractVersion: VERSIONS.credential,
    upstreamBindings: buildUpstreamBindings(upstream),
    credentialCategories: ["future_migration", "future_runtime"],
    categoriesDistinct: true,
    externalInjectionOnly: true,
    forbiddenInputChannels: [
      "committed_artifact", "change_request_text", "command_argument",
      "standard_input", "ambient_environment", "screen_capture", "log_output",
      "application_variable_reuse",
    ],
    applicationCredentialReuseAllowed: false,
    migrationCredentialReuseForObservationAllowed: false,
    runtimeDeniedPrivileges: [...RUNTIME_DENIED_PRIVILEGES],
    runtimeSchemaOwnerAllowed: false,
    runtimeSuperuserAllowed: false,
    leastPrivilegeRequired: true,
    expiryAttestationRequired: true,
    rotationAttestationRequired: true,
    revocationAttestationRequired: true,
    postRunDestructionAttestationRequired: true,
    credentialProvisioned: false,
    credentialInjected: false,
  }, "credential");
}

function buildDisposalPolicy(upstream) {
  const rollback = upstream.executionPlanPacket.contracts.rollback;
  return sealContract({
    contractVersion: VERSIONS.disposal,
    upstreamBindings: buildUpstreamBindings(upstream),
    safeReversiblePackageAvailable: rollback.safeReversibleMigrationAvailable,
    environmentDisposalRequired: true,
    disposalAfterCredentialRevocationRequired: true,
    disposalAfterEvidenceFinalizationRequired: true,
    emergencySecurityRevocationException: true,
    responsibilityAttestationHashRequired: true,
    disposalDeadlineCategoryRequired: true,
    destructiveSharedCleanupAllowed: false,
    applicationSystemCleanupAllowed: false,
    unrelatedSystemCleanupAllowed: false,
    environmentDisposalAuthorized: false,
    environmentDisposalExecuted: false,
  }, "disposal");
}

function buildApprovalPolicy(upstream, supportingContracts) {
  return sealContract({
    contractVersion: VERSIONS.approval,
    upstreamBindings: buildUpstreamBindings(upstream),
    readinessChecklistId: supportingContracts.readiness.readinessChecklistId,
    readinessChecklistHash: supportingContracts.readiness.readinessChecklistHash,
    sanitizedEnvironmentIntakeSchemaId:
      supportingContracts.intake.sanitizedEnvironmentIntakeSchemaId,
    sanitizedEnvironmentIntakeSchemaHash:
      supportingContracts.intake.sanitizedEnvironmentIntakeSchemaHash,
    credentialProvisioningBoundaryId:
      supportingContracts.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash:
      supportingContracts.credential.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId:
      supportingContracts.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash:
      supportingContracts.disposal.disposalResponsibilityPolicyHash,
    requestContractVersion: VERSIONS.request,
    requestedOperationSet: [...REQUESTED_OPERATION_SET],
    maximumObservationCount: 1,
    maximumRequestLifetimeSeconds: 600,
    allowedClockSkewSeconds: 30,
    approverIdentityHashRequired: true,
    requestNonceHashRequired: true,
    issuedAtRequired: true,
    expiresAtRequired: true,
    replayPolicy: "duplicate_nonce_manual_review_fail_closed",
    ambiguityPolicy: "manual_review_fail_closed",
    connectionAuthorityAllowed: false,
    sqlAuthorityAllowed: false,
    migrationAuthorityAllowed: false,
    scenarioAuthorityAllowed: false,
    claimAuthorityAllowed: false,
    receiptAuthorityAllowed: false,
    rollbackAuthorityAllowed: false,
    disposalAuthorityAllowed: false,
    approvalRequested: false,
    approvalGranted: false,
  }, "approval");
}

function buildContracts(upstream) {
  const supportingContracts = {
    readiness: buildReadinessChecklist(upstream),
    intake: buildSanitizedIntakeSchema(upstream),
    credential: buildCredentialBoundary(upstream),
    disposal: buildDisposalPolicy(upstream),
  };
  return {
    ...supportingContracts,
    approval: buildApprovalPolicy(upstream, supportingContracts),
  };
}

function expectedContract(name, upstream, contracts) {
  if (name === "readiness") return buildReadinessChecklist(upstream);
  if (name === "intake") return buildSanitizedIntakeSchema(upstream);
  if (name === "credential") return buildCredentialBoundary(upstream);
  if (name === "disposal") return buildDisposalPolicy(upstream);
  return buildApprovalPolicy(upstream, contracts);
}

function validateContract(value, name, upstream, contracts) {
  const issues = [...validateEnvelope(value, name)];
  let expected;
  try { expected = expectedContract(name, upstream, contracts); } catch {
    return uniqueSorted([...issues, `${name}_expected_contract_failed`]);
  }
  for (const field of FIELD_SETS[name]) {
    if (field === SPECS[name].idField || field === SPECS[name].hashField) continue;
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`${name}_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildRunPackageSummary(upstream, contracts) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    upstreamBindings: buildUpstreamBindings(upstream),
    readinessChecklistId: contracts.readiness.readinessChecklistId,
    readinessChecklistHash: contracts.readiness.readinessChecklistHash,
    sanitizedEnvironmentIntakeSchemaId:
      contracts.intake.sanitizedEnvironmentIntakeSchemaId,
    sanitizedEnvironmentIntakeSchemaHash:
      contracts.intake.sanitizedEnvironmentIntakeSchemaHash,
    approvalRequestPolicyId: contracts.approval.approvalRequestPolicyId,
    approvalRequestPolicyHash: contracts.approval.approvalRequestPolicyHash,
    credentialProvisioningBoundaryId:
      contracts.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash:
      contracts.credential.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId: contracts.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: contracts.disposal.disposalResponsibilityPolicyHash,
    futureApprovalRequestContractVersion: VERSIONS.request,
    requestedOperationCount: REQUESTED_OPERATION_SET.length,
    packagePrepared: true,
    operatorDecisionsRecorded: false,
    intakeCollected: false,
    approvalRequestGenerated: false,
    approvalRequested: false,
    approvalGranted: false,
    credentialProvisioned: false,
    credentialInjected: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateRunPackageSummary(value, upstream, contracts) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildRunPackageSummary(upstream, contracts); } catch {
    return uniqueSorted([...issues, "run_package_summary_expected_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "runPackageSummaryId" || field === "runPackageSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`run_package_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
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

function validateRequestContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "contracts", "runPackageSummary", "priorRequestNonceHashes",
  ])) return ["approval_request_context_fields_invalid"];
  const issues = [...validateUpstream(context.upstream)];
  if (!isRecord(context.contracts) || !hasExactKeys(context.contracts, [
    "readiness", "intake", "credential", "disposal", "approval",
  ])) {
    issues.push("approval_request_contracts_fields_invalid");
  }
  for (const name of ["readiness", "intake", "credential", "disposal", "approval"]) {
    issues.push(...validateContract(
      context.contracts?.[name], name, context.upstream, context.contracts,
    ));
  }
  issues.push(...validateRunPackageSummary(
    context.runPackageSummary, context.upstream, context.contracts,
  ));
  issues.push(...validateHashArray(
    context.priorRequestNonceHashes, "prior_request_nonce_hashes",
  ));
  return uniqueSorted(issues);
}

function validateLiveObservationApprovalRequest(value, context, evaluationClockInstant) {
  const contextIssues = validateRequestContext(context);
  const issues = [...validateEnvelope(value, "request"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.contracts) ||
      !isRecord(context.runPackageSummary) ||
      !Array.isArray(context.priorRequestNonceHashes)) return uniqueSorted(issues);
  if (contextIssues.length > 0) return uniqueSorted(issues);

  const contracts = context.contracts;
  const summary = context.runPackageSummary;
  const upstreamBindings = buildUpstreamBindings(context.upstream);
  for (const field of ["runPackageSummaryId", "runPackageSummaryHash"]) {
    if (value[field] !== summary[field]) {
      issues.push(`approval_request_summary_binding_mismatch:${field}`);
    }
  }
  for (const [name, idField, hashField] of [
    ["readiness", "readinessChecklistId", "readinessChecklistHash"],
    ["intake", "sanitizedEnvironmentIntakeSchemaId", "sanitizedEnvironmentIntakeSchemaHash"],
    ["approval", "approvalRequestPolicyId", "approvalRequestPolicyHash"],
    ["credential", "credentialProvisioningBoundaryId", "credentialProvisioningBoundaryHash"],
    ["disposal", "disposalResponsibilityPolicyId", "disposalResponsibilityPolicyHash"],
  ]) {
    if (value[idField] !== contracts[name][idField] ||
        value[hashField] !== contracts[name][hashField]) {
      issues.push(`approval_request_contract_binding_mismatch:${name}`);
    }
  }
  for (const field of [
    "executionPreflightSummaryId", "executionPreflightSummaryHash",
    "targetSelectionPolicyId", "targetSelectionPolicyHash",
    "sequencePolicyId", "sequencePolicyHash", "rollbackPolicyId",
    "rollbackPolicyHash", "evidenceCollectionPlanId", "evidenceCollectionPlanHash",
  ]) {
    if (value[field] !== upstreamBindings[field]) {
      issues.push(`approval_request_upstream_binding_mismatch:${field}`);
    }
  }

  for (const field of contracts.intake.requiredHashPlaceholders) {
    if (!isSha256(value[field])) issues.push(`approval_request_hash_placeholder_invalid:${field}`);
  }
  if (!isSha256(value.sanitizedApproverIdentityHash)) {
    issues.push("approval_request_approver_hash_invalid");
  }
  if (!isSha256(value.requestNonceHash)) {
    issues.push("approval_request_nonce_hash_invalid");
  } else if (context.priorRequestNonceHashes.includes(value.requestNonceHash)) {
    issues.push("approval_request_nonce_replay_manual_review");
  }

  if (!canonicalEqual(value.requestedOperationSet, REQUESTED_OPERATION_SET) ||
      value.maximumObservationCount !== 1) {
    issues.push("approval_request_operation_scope_invalid");
  }
  if (value.targetPurposeClassification !== "disposable_isolated_conformance_only" ||
      !contracts.intake.allowedNamespaceCategories.includes(value.namespaceCategory) ||
      value.destinationCount !== 1 ||
      value.disposalDeadlineCategory !== "within_operator_approved_window") {
    issues.push("approval_request_target_classification_invalid");
  }
  if (!canonicalEqual(value.runtimeDeniedPrivileges, RUNTIME_DENIED_PRIVILEGES) ||
      value.categoriesDistinct !== true ||
      value.migrationCredentialUsedForObservation !== false) {
    issues.push("approval_request_credential_boundary_invalid");
  }
  if (value.rawMaterialPresent !== false) {
    issues.push("approval_request_raw_material_boundary_invalid");
  }
  if (value.approvalRequested !== false || value.approvalGranted !== false) {
    issues.push("approval_request_authority_boundary_invalid");
  }

  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const windowStartsAt = parseCanonicalInstant(value.observationWindowStartsAt);
  const windowExpiresAt = parseCanonicalInstant(value.observationWindowExpiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (issuedAt === null) issues.push("approval_request_issued_at_invalid");
  if (expiresAt === null) issues.push("approval_request_expires_at_invalid");
  if (windowStartsAt === null) issues.push("approval_request_window_starts_at_invalid");
  if (windowExpiresAt === null) issues.push("approval_request_window_expires_at_invalid");
  if (evaluationClock === null) issues.push("approval_request_evaluation_clock_invalid");
  if ([issuedAt, expiresAt, windowStartsAt, windowExpiresAt, evaluationClock]
    .every((instant) => instant !== null)) {
    const skew = contracts.approval.allowedClockSkewSeconds * 1000;
    const maximumLifetime = contracts.approval.maximumRequestLifetimeSeconds * 1000;
    if (issuedAt >= expiresAt) issues.push("approval_request_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("approval_request_future_dated");
    if (evaluationClock >= expiresAt) issues.push("approval_request_expired");
    if (expiresAt - issuedAt > maximumLifetime) {
      issues.push("approval_request_lifetime_excessive");
    }
    if (windowStartsAt >= windowExpiresAt) {
      issues.push("approval_request_observation_window_inversion");
    }
    if (issuedAt > windowStartsAt || expiresAt > windowExpiresAt) {
      issues.push("approval_request_outside_observation_window");
    }
  }

  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("approval_request_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("approval_request_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function buildValidPreparationPacket() {
  const upstream = buildUpstream();
  return { upstream, contracts: buildContracts(upstream) };
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "operator_observation_run_package_prepared";
  return {
    ok: ready,
    status,
    contractVersion: VERSIONS.summary,
    packagePrepared: ready,
    upstreamValidated: ready,
    readinessChecklistValidated: ready,
    sanitizedIntakeSchemaValidated: ready,
    approvalRequestPolicyValidated: ready,
    credentialBoundaryValidated: ready,
    disposalResponsibilityValidated: ready,
    runPackageSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? [
      "package_prepared_is_not_target_observation_credential_authorization_or_execution_authority",
    ] : [],
  };
}

function evaluateOperatorObservationRunPackage(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "readiness", "intake", "credential", "disposal", "approval",
      ])) return safeResult("blocked", {}, ["operator_observation_packet_fields_invalid"]);
  const issues = [...validateUpstream(packet.upstream)];
  for (const name of ["readiness", "intake", "credential", "disposal", "approval"]) {
    issues.push(...validateContract(
      packet.contracts[name], name, packet.upstream, packet.contracts,
    ));
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  try {
    const summary = buildRunPackageSummary(packet.upstream, packet.contracts);
    issues.push(...validateRunPackageSummary(summary, packet.upstream, packet.contracts));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("operator_observation_run_package_prepared", summary);
  } catch {
    return safeResult("blocked", {}, ["operator_observation_summary_construction_failed"]);
  }
}

module.exports = {
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  INTAKE_ALLOWED_FIELDS,
  REQUESTED_OPERATION_SET,
  REQUIRED_DECISION_ITEMS,
  RUNTIME_DENIED_PRIVILEGES,
  SPECS,
  VERSIONS,
  buildApprovalPolicy,
  buildContracts,
  buildCredentialBoundary,
  buildDisposalPolicy,
  buildReadinessChecklist,
  buildRunPackageSummary,
  buildSanitizedIntakeSchema,
  buildUpstream,
  buildUpstreamBindings,
  buildValidPreparationPacket,
  evaluateOperatorObservationRunPackage,
  safeResult,
  sealContract,
  validateContract,
  validateLiveObservationApprovalRequest,
  validateRequestContext,
  validateRunPackageSummary,
  validateUpstream,
};
