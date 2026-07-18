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
const {
  FIXED_FALSE_FIELDS: STEP_F_FIXED_FALSE_FIELDS,
  SPECS: STEP_F_SPECS,
  VERSIONS: STEP_F_VERSIONS,
  buildObservationSetHash,
  buildPreparationSummary: buildStepFPreparationSummary,
  buildValidPreparationPacket: buildStepFPreparationPacket,
  validateAuthorizationEnvelope,
  validateContract: validateStepFContract,
  validatePreparationSummary: validateStepFPreparationSummary,
  validateUpstream: validateStepFUpstream,
} = require("./metrics-cutover-test-database-execution-gate-preparation.cjs");
const {
  FUTURE_SCENARIOS,
} = require("./metrics-cutover-postgresql-test-package.cjs");

const VERSIONS = Object.freeze({
  targetSelection: "metrics-cutover-disposable-test-database-target-selection-policy-v1-step114-2x-g",
  manifest: "metrics-cutover-disposable-test-database-execution-manifest-v1-step114-2x-g",
  sequence: "metrics-cutover-disposable-test-database-sequence-policy-v1-step114-2x-g",
  rollback: "metrics-cutover-disposable-test-database-rollback-prerequisite-policy-v1-step114-2x-g",
  evidence: "metrics-cutover-disposable-test-database-evidence-collection-plan-v1-step114-2x-g",
  summary: "metrics-cutover-disposable-test-database-execution-preflight-summary-v1-step114-2x-g",
});

const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...STEP_F_FIXED_FALSE_FIELDS,
  "executionPlanActivated", "executionManifestConsumed",
  "rollbackPlanActivated", "evidenceCollectionStarted",
])]);

const EXECUTION_SEQUENCE = Object.freeze([
  "validate_bound_observation_package",
  "validate_bound_one_time_authorization",
  "validate_credential_injection_boundary",
  "acquire_single_use_execution_claim",
  "connect_once_to_disposable_test_database",
  "verify_pre_migration_namespace_state",
  "apply_exact_bound_migration_package",
  "verify_post_migration_schema_state",
  "execute_exact_15_scenario_conformance_run",
  "collect_sanitized_hash_chained_evidence",
  "revoke_and_expire_test_credentials",
  "finalize_single_use_execution_receipt",
]);

const EVIDENCE_STAGE_ORDER = Object.freeze([
  "execution_claim_placeholder",
  "pre_migration_namespace_state",
  "migration_result",
  "post_migration_schema_state",
  ...FUTURE_SCENARIOS.map((_, index) =>
    `scenario_result_${String(index + 1).padStart(2, "0")}`),
  "credential_revocation",
  "final_receipt_placeholder",
]);

const DOMAINS = Object.freeze(Object.fromEntries(
  Object.keys(VERSIONS).flatMap((name) => [
    [`${name}Id`, `FINPLE_STEP114_2X_G_${name.toUpperCase()}_ID\0`],
    [`${name}Hash`, `FINPLE_STEP114_2X_G_${name.toUpperCase()}_HASH\0`],
  ]),
));

const SPECS = Object.freeze(Object.fromEntries(Object.entries(VERSIONS).map(
  ([name, version]) => [name, Object.freeze({
    version,
    idField: name === "summary" ? "executionPreflightSummaryId"
      : name === "manifest" ? "executionManifestId"
        : `${name}PolicyId`.replace("evidencePolicy", "evidenceCollectionPlan"),
    hashField: name === "summary" ? "executionPreflightSummaryHash"
      : name === "manifest" ? "executionManifestHash"
        : `${name}PolicyHash`.replace("evidencePolicy", "evidenceCollectionPlan"),
    prefix: `metrics-cutover-disposable-test-database-${name}`,
    idDomain: DOMAINS[`${name}Id`],
    hashDomain: DOMAINS[`${name}Hash`],
  })]),
));

const UPSTREAM_BINDING_FIELDS = Object.freeze([
  "preparationSummaryId", "preparationSummaryHash",
  "environmentClassificationId", "environmentClassificationHash",
  "networkPolicyId", "networkPolicyHash", "databasePolicyId",
  "databasePolicyHash", "certificatePolicyId", "certificatePolicyHash",
  "credentialPolicyId", "credentialPolicyHash", "authorizationPolicyId",
  "authorizationPolicyHash", "migrationSpecId", "migrationSpecHash",
  "packageSummaryId", "packageSummaryHash", "testDatabaseGateId",
  "testDatabaseGateHash", "futureEvidenceSpecId", "futureEvidenceSpecHash",
  "futureObservationContractVersions", "authorizationEnvelopeContractVersion",
  "exactScenarioCount",
]);

const TARGET_FIELDS = Object.freeze([
  "contractVersion", "targetSelectionPolicyId", "upstreamBindings",
  "environmentClassificationId", "environmentClassificationHash",
  "futureEnvironmentBindingHashRequired", "futureObservationSetHashRequired",
  "futureNamespaceEvidenceHashRequired", "targetPurpose", "productionAllowed",
  "stagingAllowed", "sharedDevelopmentAllowed", "applicationStorageAllowed",
  "analyticsStorageAllowed", "exactDestinationCount",
  "allowedNamespaceCategories", "targetSubstitutionAfterAuthorizationAllowed",
  "maximumManifestAgeSeconds", "allowedClockSkewSeconds", "ambiguityPolicy",
  "targetSelected", "targetSelectionPolicyHash",
]);
const SEQUENCE_FIELDS = Object.freeze([
  "contractVersion", "sequencePolicyId", "upstreamBindings",
  "operationSequence", "parallelExecutionAllowed", "automaticRetryAllowed",
  "deleteToRetryAllowed", "secondConnectionAllowed",
  "migrationAfterScenarioStartAllowed", "scenarioBeforePostMigrationAllowed",
  "receiptBeforeEvidenceAllowed", "receiptBeforeCredentialRevocationAllowed",
  "ambiguityPolicy", "sequenceExecuted", "sequencePolicyHash",
]);
const ROLLBACK_FIELDS = Object.freeze([
  "contractVersion", "rollbackPolicyId", "upstreamBindings",
  "migrationSpecId", "migrationSpecHash", "eligibilityClassifications",
  "safeReversibleMigrationAvailable", "rollbackAvailability",
  "destructiveGenericCleanupAllowed", "applicationObjectsMayBeTouched",
  "unrelatedObjectsMayBeTouched", "deleteToRetryAllowed",
  "resetToRetryAllowed", "failureClassificationHashRequired",
  "manualApprovalHashRequired", "rollbackCreatesExecutionAuthority",
  "environmentDisposalExecuted", "rollbackPlanPrepared", "rollbackExecuted",
  "rollbackPolicyHash",
]);
const EVIDENCE_FIELDS = Object.freeze([
  "contractVersion", "evidenceCollectionPlanId", "upstreamBindings",
  "preflightSummaryBindingFields", "manifestBindingFields",
  "environmentBindingHashRequired", "observationSetHashRequired",
  "authorizationEnvelopeBindingFields", "executionClaimPlaceholderFields",
  "evidenceStageOrder", "scenarioResultCount", "hashChainRequired",
  "firstPredecessor", "successorRule", "finalReceiptPlaceholderFields",
  "rawMaterialForbidden", "evidenceCollectionStarted",
  "evidenceCollectionPlanHash",
]);
const MANIFEST_FIELDS = Object.freeze([
  "contractVersion", "executionManifestId", "preparationSummaryId",
  "preparationSummaryHash", "targetSelectionPolicyId",
  "targetSelectionPolicyHash", "sequencePolicyId", "sequencePolicyHash",
  "rollbackPolicyId", "rollbackPolicyHash", "evidenceCollectionPlanId",
  "evidenceCollectionPlanHash", "environmentClassificationId",
  "environmentClassificationHash", "environmentBindingHash",
  "observationSetHash", "networkObservationId", "networkObservationHash",
  "databaseObservationId", "databaseObservationHash",
  "certificateObservationId", "certificateObservationHash",
  "namespaceObservationId", "namespaceObservationHash",
  "namespaceEvidenceHash", "credentialPolicyId", "credentialPolicyHash",
  "authorizationPolicyId", "authorizationPolicyHash",
  "authorizationEnvelopeId", "authorizationEnvelopeHash", "packageSummaryId",
  "packageSummaryHash", "testDatabaseGateId", "testDatabaseGateHash",
  "futureEvidenceSpecId", "futureEvidenceSpecHash", "exactScenarioCount",
  "scenarioOrder", "allowedOperationOrder", "maximumExecutionCount",
  "testPurpose", "issuedAt", "expiresAt", "manifestNonceHash",
  "sanitizedPlanApproverHash", "manualReviewRequired", "rawMaterialPresent",
  "executionManifestHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "executionPreflightSummaryId", "upstreamBindings",
  "targetSelectionPolicyId", "targetSelectionPolicyHash", "sequencePolicyId",
  "sequencePolicyHash", "rollbackPolicyId", "rollbackPolicyHash",
  "evidenceCollectionPlanId", "evidenceCollectionPlanHash",
  "executionManifestContractVersion", "exactScenarioCount",
  "executionSequenceCount", "planPrepared", "targetSelected",
  "manifestGenerated", "manifestConsumed", "rollbackPlanPrepared",
  ...FIXED_FALSE_FIELDS, "executionPreflightSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  targetSelection: TARGET_FIELDS, sequence: SEQUENCE_FIELDS,
  rollback: ROLLBACK_FIELDS, evidence: EVIDENCE_FIELDS,
  manifest: MANIFEST_FIELDS, summary: SUMMARY_FIELDS,
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
  const preparationPacket = buildStepFPreparationPacket();
  return {
    preparationPacket,
    preparationSummary: buildStepFPreparationSummary(
      preparationPacket.upstream, preparationPacket.contracts,
    ),
  };
}

function buildUpstreamBindings(upstream) {
  const packet = upstream.preparationPacket;
  const contracts = packet.contracts;
  const stepE = packet.upstream.postgresqlPackage;
  return {
    preparationSummaryId: upstream.preparationSummary.preparationSummaryId,
    preparationSummaryHash: upstream.preparationSummary.preparationSummaryHash,
    environmentClassificationId: contracts.environment.environmentClassificationId,
    environmentClassificationHash: contracts.environment.environmentClassificationHash,
    networkPolicyId: contracts.network.networkPolicyId,
    networkPolicyHash: contracts.network.networkPolicyHash,
    databasePolicyId: contracts.database.databasePolicyId,
    databasePolicyHash: contracts.database.databasePolicyHash,
    certificatePolicyId: contracts.certificate.certificatePolicyId,
    certificatePolicyHash: contracts.certificate.certificatePolicyHash,
    credentialPolicyId: contracts.credential.credentialPolicyId,
    credentialPolicyHash: contracts.credential.credentialPolicyHash,
    authorizationPolicyId: contracts.authorization.authorizationPolicyId,
    authorizationPolicyHash: contracts.authorization.authorizationPolicyHash,
    migrationSpecId: stepE.migrationSpec.migrationSpecId,
    migrationSpecHash: stepE.migrationSpec.migrationSpecHash,
    packageSummaryId: packet.upstream.packageSummary.packageSummaryId,
    packageSummaryHash: packet.upstream.packageSummary.packageSummaryHash,
    testDatabaseGateId: stepE.testDatabaseGate.testDatabaseGateId,
    testDatabaseGateHash: stepE.testDatabaseGate.testDatabaseGateHash,
    futureEvidenceSpecId: stepE.futureEvidenceSpec.futureEvidenceSpecId,
    futureEvidenceSpecHash: stepE.futureEvidenceSpec.futureEvidenceSpecHash,
    futureObservationContractVersions: [
      STEP_F_VERSIONS.networkObservation, STEP_F_VERSIONS.databaseObservation,
      STEP_F_VERSIONS.certificateObservation, STEP_F_VERSIONS.namespaceObservation,
    ],
    authorizationEnvelopeContractVersion: STEP_F_VERSIONS.authorizationEnvelope,
    exactScenarioCount: FUTURE_SCENARIOS.length,
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "preparationPacket", "preparationSummary",
  ])) return ["upstream_fields_invalid"];
  const packet = upstream.preparationPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "environment", "network", "database", "certificate", "credential",
        "authorization",
      ])) return ["step_f_preparation_packet_fields_invalid"];
  const issues = [...validateStepFUpstream(packet.upstream)];
  for (const name of [
    "environment", "network", "database", "certificate", "credential",
    "authorization",
  ]) {
    issues.push(...validateStepFContract(
      packet.contracts[name], name, packet.upstream, packet.contracts,
    ));
  }
  issues.push(...validateStepFPreparationSummary(
    upstream.preparationSummary, packet.upstream, packet.contracts,
  ));
  let expectedSummary;
  try { expectedSummary = buildStepFPreparationSummary(packet.upstream, packet.contracts); } catch {}
  if (!expectedSummary || !canonicalEqual(upstream.preparationSummary, expectedSummary)) {
    issues.push("step_f_preparation_summary_binding_mismatch");
  }
  return uniqueSorted(issues);
}

function buildTargetSelectionPolicy(upstream) {
  const bindings = buildUpstreamBindings(upstream);
  const environment = upstream.preparationPacket.contracts.environment;
  return sealContract({
    contractVersion: VERSIONS.targetSelection,
    upstreamBindings: bindings,
    environmentClassificationId: environment.environmentClassificationId,
    environmentClassificationHash: environment.environmentClassificationHash,
    futureEnvironmentBindingHashRequired: true,
    futureObservationSetHashRequired: true,
    futureNamespaceEvidenceHashRequired: true,
    targetPurpose: "disposable_isolated_conformance_only",
    productionAllowed: false, stagingAllowed: false,
    sharedDevelopmentAllowed: false, applicationStorageAllowed: false,
    analyticsStorageAllowed: false, exactDestinationCount: 1,
    allowedNamespaceCategories: [...environment.allowedNamespaceCategories],
    targetSubstitutionAfterAuthorizationAllowed: false,
    maximumManifestAgeSeconds: 900, allowedClockSkewSeconds: 30,
    ambiguityPolicy: "manual_review_fail_closed", targetSelected: false,
  }, "targetSelection");
}

function buildSequencePolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.sequence, upstreamBindings: buildUpstreamBindings(upstream),
    operationSequence: [...EXECUTION_SEQUENCE], parallelExecutionAllowed: false,
    automaticRetryAllowed: false, deleteToRetryAllowed: false,
    secondConnectionAllowed: false, migrationAfterScenarioStartAllowed: false,
    scenarioBeforePostMigrationAllowed: false, receiptBeforeEvidenceAllowed: false,
    receiptBeforeCredentialRevocationAllowed: false,
    ambiguityPolicy: "manual_review_fail_closed", sequenceExecuted: false,
  }, "sequence");
}

function buildRollbackPolicy(upstream) {
  const bindings = buildUpstreamBindings(upstream);
  return sealContract({
    contractVersion: VERSIONS.rollback, upstreamBindings: bindings,
    migrationSpecId: bindings.migrationSpecId,
    migrationSpecHash: bindings.migrationSpecHash,
    eligibilityClassifications: [
      "before_scenario_execution", "classified_partial_migration_failure",
    ],
    safeReversibleMigrationAvailable: false,
    rollbackAvailability: "unavailable_environment_disposal_required",
    destructiveGenericCleanupAllowed: false,
    applicationObjectsMayBeTouched: false, unrelatedObjectsMayBeTouched: false,
    deleteToRetryAllowed: false, resetToRetryAllowed: false,
    failureClassificationHashRequired: true, manualApprovalHashRequired: true,
    rollbackCreatesExecutionAuthority: false, environmentDisposalExecuted: false,
    rollbackPlanPrepared: false, rollbackExecuted: false,
  }, "rollback");
}

function buildEvidenceCollectionPlan(upstream) {
  return sealContract({
    contractVersion: VERSIONS.evidence, upstreamBindings: buildUpstreamBindings(upstream),
    preflightSummaryBindingFields: [
      "executionPreflightSummaryId", "executionPreflightSummaryHash",
    ],
    manifestBindingFields: ["executionManifestId", "executionManifestHash"],
    environmentBindingHashRequired: true, observationSetHashRequired: true,
    authorizationEnvelopeBindingFields: [
      "authorizationEnvelopeId", "authorizationEnvelopeHash",
    ],
    executionClaimPlaceholderFields: ["executionClaimId", "executionClaimHash"],
    evidenceStageOrder: [...EVIDENCE_STAGE_ORDER],
    scenarioResultCount: FUTURE_SCENARIOS.length, hashChainRequired: true,
    firstPredecessor: "ZERO_HASH",
    successorRule: "previous_evidence_hash_equals_immediate_predecessor_hash",
    finalReceiptPlaceholderFields: ["finalReceiptId", "finalReceiptHash"],
    rawMaterialForbidden: [
      "raw_sql", "query_result", "row_data", "endpoint", "credential",
      "operator", "provider", "database_identity", "repository_path",
    ],
    evidenceCollectionStarted: false,
  }, "evidence");
}

function buildContracts(upstream) {
  return {
    targetSelection: buildTargetSelectionPolicy(upstream),
    sequence: buildSequencePolicy(upstream),
    rollback: buildRollbackPolicy(upstream),
    evidence: buildEvidenceCollectionPlan(upstream),
  };
}

function expectedContract(name, upstream) {
  if (name === "targetSelection") return buildTargetSelectionPolicy(upstream);
  if (name === "sequence") return buildSequencePolicy(upstream);
  if (name === "rollback") return buildRollbackPolicy(upstream);
  return buildEvidenceCollectionPlan(upstream);
}

function validateContract(value, name, upstream) {
  const issues = [...validateEnvelope(value, name)];
  let expected;
  try { expected = expectedContract(name, upstream); } catch {
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

function buildExecutionPreflightSummary(upstream, contracts) {
  return sealContract({
    contractVersion: VERSIONS.summary, upstreamBindings: buildUpstreamBindings(upstream),
    targetSelectionPolicyId: contracts.targetSelection.targetSelectionPolicyId,
    targetSelectionPolicyHash: contracts.targetSelection.targetSelectionPolicyHash,
    sequencePolicyId: contracts.sequence.sequencePolicyId,
    sequencePolicyHash: contracts.sequence.sequencePolicyHash,
    rollbackPolicyId: contracts.rollback.rollbackPolicyId,
    rollbackPolicyHash: contracts.rollback.rollbackPolicyHash,
    evidenceCollectionPlanId: contracts.evidence.evidenceCollectionPlanId,
    evidenceCollectionPlanHash: contracts.evidence.evidenceCollectionPlanHash,
    executionManifestContractVersion: VERSIONS.manifest,
    exactScenarioCount: FUTURE_SCENARIOS.length,
    executionSequenceCount: EXECUTION_SEQUENCE.length,
    planPrepared: true, targetSelected: false, manifestGenerated: false,
    manifestConsumed: false, rollbackPlanPrepared: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateExecutionPreflightSummary(value, upstream, contracts) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildExecutionPreflightSummary(upstream, contracts); } catch {
    return uniqueSorted([...issues, "execution_preflight_summary_expected_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "executionPreflightSummaryId" ||
        field === "executionPreflightSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`execution_preflight_summary_field_invalid:${field}`);
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
  return issues;
}

function validateManifestContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "contracts", "observations", "authorizationEnvelope",
    "priorAuthorizationNonceHashes", "priorManifestNonceHashes",
  ])) return ["execution_manifest_context_fields_invalid"];
  const issues = [...validateUpstream(context.upstream)];
  if (!isRecord(context.contracts) || !hasExactKeys(context.contracts, [
    "targetSelection", "sequence", "rollback", "evidence",
  ])) issues.push("execution_manifest_contracts_fields_invalid");
  for (const name of ["targetSelection", "sequence", "rollback", "evidence"]) {
    issues.push(...validateContract(context.contracts?.[name], name, context.upstream));
  }
  if (!isRecord(context.observations) || !hasExactKeys(context.observations, [
    "network", "database", "certificate", "namespace",
  ])) issues.push("execution_manifest_observations_fields_invalid");
  issues.push(...validateHashArray(
    context.priorAuthorizationNonceHashes, "prior_authorization_nonce_hashes",
  ));
  issues.push(...validateHashArray(
    context.priorManifestNonceHashes, "prior_manifest_nonce_hashes",
  ));
  return uniqueSorted(issues);
}

function validateExecutionManifest(value, context, evaluationClockInstant) {
  const contextIssues = validateManifestContext(context);
  const issues = [...validateEnvelope(value, "manifest"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.contracts) ||
      !isRecord(context.observations) ||
      !Array.isArray(context.priorAuthorizationNonceHashes) ||
      !Array.isArray(context.priorManifestNonceHashes)) return uniqueSorted(issues);
  if (contextIssues.length > 0) return uniqueSorted(issues);
  const packet = context.upstream.preparationPacket;
  const bindings = buildUpstreamBindings(context.upstream);
  const contracts = context.contracts;
  const observations = context.observations;
  const authorization = context.authorizationEnvelope;
  issues.push(...validateAuthorizationEnvelope(
    authorization,
    {
      upstream: packet.upstream, contracts: packet.contracts, observations,
      priorNonceHashes: context.priorAuthorizationNonceHashes,
    },
    evaluationClockInstant,
  ));
  for (const field of [
    "preparationSummaryId", "preparationSummaryHash", "environmentClassificationId",
    "environmentClassificationHash", "credentialPolicyId", "credentialPolicyHash",
    "authorizationPolicyId", "authorizationPolicyHash", "packageSummaryId",
    "packageSummaryHash", "testDatabaseGateId", "testDatabaseGateHash",
    "futureEvidenceSpecId", "futureEvidenceSpecHash",
  ]) {
    if (value[field] !== bindings[field]) issues.push(`execution_manifest_upstream_binding_mismatch:${field}`);
  }
  if (value.targetSelectionPolicyId !== contracts.targetSelection.targetSelectionPolicyId ||
      value.targetSelectionPolicyHash !== contracts.targetSelection.targetSelectionPolicyHash) {
    issues.push("execution_manifest_policy_binding_mismatch:targetSelection");
  }
  if (value.sequencePolicyId !== contracts.sequence.sequencePolicyId ||
      value.sequencePolicyHash !== contracts.sequence.sequencePolicyHash) {
    issues.push("execution_manifest_policy_binding_mismatch:sequence");
  }
  if (value.rollbackPolicyId !== contracts.rollback.rollbackPolicyId ||
      value.rollbackPolicyHash !== contracts.rollback.rollbackPolicyHash) {
    issues.push("execution_manifest_policy_binding_mismatch:rollback");
  }
  if (value.evidenceCollectionPlanId !== contracts.evidence.evidenceCollectionPlanId ||
      value.evidenceCollectionPlanHash !== contracts.evidence.evidenceCollectionPlanHash) {
    issues.push("execution_manifest_policy_binding_mismatch:evidence");
  }
  for (const name of ["network", "database", "certificate", "namespace"]) {
    if (value[`${name}ObservationId`] !== observations[name]?.observationId ||
        value[`${name}ObservationHash`] !== observations[name]?.observationHash) {
      issues.push(`execution_manifest_observation_binding_mismatch:${name}`);
    }
    if (observations[name]?.environmentBindingHash !== value.environmentBindingHash) {
      issues.push("execution_manifest_environment_binding_mismatch");
    }
  }
  if (value.environmentBindingHash !== authorization?.environmentBindingHash ||
      !isSha256(value.environmentBindingHash)) {
    issues.push("execution_manifest_environment_binding_mismatch");
  }
  let expectedObservationSetHash = null;
  try { expectedObservationSetHash = buildObservationSetHash(value.environmentBindingHash, observations); } catch {}
  if (value.observationSetHash !== expectedObservationSetHash ||
      value.observationSetHash !== authorization?.observationSetHash) {
    issues.push("execution_manifest_observation_set_mismatch");
  }
  if (value.namespaceEvidenceHash !== observations.database?.disposableNamespaceEvidenceHash ||
      value.namespaceEvidenceHash !== observations.namespace?.disposableNamespaceEvidenceHash ||
      !isSha256(value.namespaceEvidenceHash)) {
    issues.push("execution_manifest_namespace_evidence_mismatch");
  }
  if (value.authorizationEnvelopeId !== authorization?.authorizationEnvelopeId ||
      value.authorizationEnvelopeHash !== authorization?.authorizationEnvelopeHash) {
    issues.push("execution_manifest_authorization_envelope_mismatch");
  }
  if (value.exactScenarioCount !== FUTURE_SCENARIOS.length ||
      !canonicalEqual(value.scenarioOrder, FUTURE_SCENARIOS)) {
    issues.push("execution_manifest_scenario_order_invalid");
  }
  if (!canonicalEqual(value.allowedOperationOrder,
    packet.contracts.authorization.allowedOperationSet)) {
    issues.push("execution_manifest_operation_order_invalid");
  }
  if (value.maximumExecutionCount !== 1 ||
      value.testPurpose !== "exact_15_scenario_disposable_conformance_run") {
    issues.push("execution_manifest_scope_invalid");
  }
  if (!isSha256(value.manifestNonceHash)) {
    issues.push("execution_manifest_nonce_hash_invalid");
  } else if (context.priorManifestNonceHashes.includes(value.manifestNonceHash)) {
    issues.push("execution_manifest_nonce_replay_manual_review");
  }
  if (!isSha256(value.sanitizedPlanApproverHash)) {
    issues.push("execution_manifest_approver_hash_invalid");
  }
  if (value.rawMaterialPresent !== false) issues.push("execution_manifest_raw_material_boundary_invalid");
  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  const authorizationIssuedAt = parseCanonicalInstant(authorization?.issuedAt);
  const authorizationExpiresAt = parseCanonicalInstant(authorization?.expiresAt);
  if (issuedAt === null) issues.push("execution_manifest_issued_at_invalid");
  if (expiresAt === null) issues.push("execution_manifest_expires_at_invalid");
  if (evaluationClock === null) issues.push("execution_manifest_evaluation_clock_invalid");
  if (issuedAt !== null && expiresAt !== null && evaluationClock !== null) {
    const maxAge = contracts.targetSelection.maximumManifestAgeSeconds * 1000;
    const skew = contracts.targetSelection.allowedClockSkewSeconds * 1000;
    if (issuedAt >= expiresAt) issues.push("execution_manifest_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("execution_manifest_future_dated");
    if (evaluationClock >= expiresAt) issues.push("execution_manifest_expired");
    if (expiresAt - issuedAt > maxAge) issues.push("execution_manifest_lifetime_excessive");
    if (authorizationIssuedAt !== null && issuedAt < authorizationIssuedAt) {
      issues.push("execution_manifest_issued_before_authorization");
    }
    if (authorizationExpiresAt !== null && expiresAt > authorizationExpiresAt) {
      issues.push("execution_manifest_outlives_authorization");
    }
  }
  const reviewRequired = issues.some((issue) =>
    issue !== "execution_manifest_manual_review_unexpected");
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("execution_manifest_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("execution_manifest_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function buildValidPreparationPacket() {
  const upstream = buildUpstream();
  return { upstream, contracts: buildContracts(upstream) };
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "disposable_test_database_execution_plan_prepared";
  return {
    ok: ready, status, contractVersion: VERSIONS.summary,
    planPrepared: ready, upstreamValidated: ready,
    targetSelectionPolicyValidated: ready, sequencePolicyValidated: ready,
    rollbackPolicyValidated: ready, evidenceCollectionPlanValidated: ready,
    executionPreflightSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? [
      "plan_prepared_is_not_target_selection_authorization_connection_or_execution_authority",
    ] : [],
  };
}

function evaluateDisposableTestDatabaseExecutionPlan(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "targetSelection", "sequence", "rollback", "evidence",
      ])) return safeResult("blocked", {}, ["execution_plan_packet_fields_invalid"]);
  const issues = [...validateUpstream(packet.upstream)];
  for (const name of ["targetSelection", "sequence", "rollback", "evidence"]) {
    issues.push(...validateContract(packet.contracts[name], name, packet.upstream));
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  try {
    const summary = buildExecutionPreflightSummary(packet.upstream, packet.contracts);
    issues.push(...validateExecutionPreflightSummary(summary, packet.upstream, packet.contracts));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("disposable_test_database_execution_plan_prepared", summary);
  } catch {
    return safeResult("blocked", {}, ["execution_preflight_summary_construction_failed"]);
  }
}

module.exports = {
  EVIDENCE_STAGE_ORDER,
  EXECUTION_SEQUENCE,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  SPECS,
  UPSTREAM_BINDING_FIELDS,
  VERSIONS,
  buildContracts,
  buildEvidenceCollectionPlan,
  buildExecutionPreflightSummary,
  buildRollbackPolicy,
  buildSequencePolicy,
  buildTargetSelectionPolicy,
  buildUpstream,
  buildUpstreamBindings,
  buildValidPreparationPacket,
  evaluateDisposableTestDatabaseExecutionPlan,
  safeResult,
  sealContract,
  validateContract,
  validateExecutionManifest,
  validateExecutionPreflightSummary,
  validateManifestContext,
  validateUpstream,
};
