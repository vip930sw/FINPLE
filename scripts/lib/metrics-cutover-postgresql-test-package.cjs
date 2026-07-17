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
  validatePreparationSummary,
} = require("./metrics-cutover-production-execution-preparation.cjs");
const {
  CLAIM_ADAPTER_METHODS,
  REPOSITORY_LOCK_ADAPTER_METHODS,
  validateClaimStoreAdapterProtocol,
  validateRepositoryLockAdapterProtocol,
} = require("./metrics-cutover-adapter-conformance.cjs");
const {
  buildSummary: buildStep114_2x_dSummary,
  buildValidPreflightPacket,
  validateCredential,
  validateDecision,
  validateRunbook,
  validateSchema,
  validateSummary: validateStep114_2x_dSummary,
  validateTransaction,
} = require("./metrics-cutover-real-adapter-implementation-preflight.cjs");

const MIGRATION_SPEC_CONTRACT_VERSION =
  "metrics-cutover-postgresql-migration-spec-v1-step114-2x-e";
const QUERY_SPEC_CONTRACT_VERSION =
  "metrics-cutover-postgresql-query-spec-v1-step114-2x-e";
const INTROSPECTION_SPEC_CONTRACT_VERSION =
  "metrics-cutover-postgresql-introspection-spec-v1-step114-2x-e";
const TEST_DATABASE_GATE_CONTRACT_VERSION =
  "metrics-cutover-postgresql-test-database-gate-v1-step114-2x-e";
const FUTURE_EVIDENCE_SPEC_CONTRACT_VERSION =
  "metrics-cutover-postgresql-test-evidence-spec-v1-step114-2x-e";
const SCENARIO_EVIDENCE_CONTRACT_VERSION =
  "metrics-cutover-postgresql-test-scenario-evidence-v1-step114-2x-e";
const RUN_EVIDENCE_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-postgresql-test-run-evidence-summary-v1-step114-2x-e";
const PACKAGE_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-postgresql-package-summary-v1-step114-2x-e";
const ZERO_HASH = "0".repeat(64);

const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized", "fileWriteAuthorized", "productionClaimEligible",
  "realProviderAdapterValidated", "realRepositoryLockValidated",
  "providerConnectionAuthorized", "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized", "sqlExecutionAuthorized",
  "schemaMutationAuthorized", "migrationAuthorized", "credentialUseAuthorized",
  "claimMutationAuthorized", "repositoryLockMutationAuthorized",
  "receiptConsumptionAuthorized", "commitAuthorized", "pushAuthorized",
  "mergeAuthorized", "deploymentAuthorized", "productionPublicationAuthorized",
  "appExportActivated", "pointerMutationExecuted", "rollbackExecuted",
  "loaderActivated",
]);

const LOGICAL_RESOURCES = Object.freeze(["claim_record", "repository_lock_record"]);
const MIGRATION_OPERATIONS = Object.freeze([
  "create_logical_namespace_boundary",
  "define_claim_record_resource",
  "define_repository_lock_record_resource",
  "add_exact_state_constraints",
  "add_exact_unique_constraints",
  "add_immutable_field_protections",
  "add_conditional_transition_support_indexes",
  "record_schema_package_version_and_hash",
  "verify_no_destructive_operation",
]);
const QUERY_OPERATIONS = Object.freeze([
  ...CLAIM_ADAPTER_METHODS,
  ...REPOSITORY_LOCK_ADAPTER_METHODS,
]);
const FORBIDDEN_CALLABLE_METHODS = Object.freeze([
  "execute", "connect", "query", "migrate", "apply", "runSql",
]);
const CLAIM_STATES = Object.freeze([
  "claim_in_progress", "consumed_success", "consumed_failed_manual_review",
]);
const LOCK_STATES = Object.freeze(["lock_held", "lock_released"]);
const DESTRUCTIVE_OPERATIONS = Object.freeze([
  "DROP", "TRUNCATE", "DELETE", "down_migration", "reset", "cleanup",
  "extension_install", "superuser_operation", "advisory_lock_only",
]);
const FUTURE_SCENARIOS = Object.freeze([
  "new_disposable_database_migration",
  "repeat_migration_deterministic_behavior",
  "schema_introspection_verification",
  "concurrent_claim_acquisition_single_winner",
  "concurrent_repository_lock_acquisition_single_winner",
  "concurrent_terminal_transition_single_winner",
  "release_racing_terminal_persistence",
  "duplicate_and_replay_behavior",
  "commit_ambiguity_manual_review",
  "serialization_or_deadlock_retry_before_proven_mutation_only",
  "session_loss_while_lock_held",
  "runtime_role_privilege_denial",
  "migration_runtime_role_separation",
  "backup_restore_rehearsal",
  "evidence_retention_after_test_completion",
]);
const FUTURE_SCENARIO_EXPECTATIONS = Object.freeze([
  { expectedResultCategory: "migration_applied", expectedAffectedRows: "schema_package_created", winnerCount: 1, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "repeat_migration_deterministic", expectedAffectedRows: "zero_additional_schema_mutations", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "schema_introspection_matches", expectedAffectedRows: "read_only", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "claim_acquisition_single_winner", expectedAffectedRows: "exactly_one", winnerCount: 1, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "lock_acquisition_single_winner", expectedAffectedRows: "exactly_one", winnerCount: 1, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "terminal_transition_single_winner", expectedAffectedRows: "exactly_one", winnerCount: 1, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "release_after_terminal_persistence", expectedAffectedRows: "exactly_one", winnerCount: 1, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "duplicate_replay_blocked", expectedAffectedRows: "zero", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "commit_ambiguity_manual_review", expectedAffectedRows: "unknown", winnerCount: 0, mutationObserved: false, manualReviewRequired: true },
  { expectedResultCategory: "retry_before_proven_mutation_only", expectedAffectedRows: "zero", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "held_lock_persists_after_session_loss", expectedAffectedRows: "read_only", winnerCount: 0, mutationObserved: false, manualReviewRequired: true },
  { expectedResultCategory: "runtime_privilege_denied", expectedAffectedRows: "zero", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "migration_runtime_roles_separated", expectedAffectedRows: "read_only", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
  { expectedResultCategory: "backup_restore_verified", expectedAffectedRows: "disposable_restore_only", winnerCount: 0, mutationObserved: true, manualReviewRequired: false },
  { expectedResultCategory: "evidence_retained", expectedAffectedRows: "read_only", winnerCount: 0, mutationObserved: false, manualReviewRequired: false },
].map((expectation, index) => Object.freeze({
  scenarioSequence: index + 1,
  scenarioClass: FUTURE_SCENARIOS[index],
  ...expectation,
})));

const DOMAINS = Object.freeze({
  migrationId: "FINPLE_STEP114_2X_E_MIGRATION_ID\0",
  migrationHash: "FINPLE_STEP114_2X_E_MIGRATION_HASH\0",
  queryId: "FINPLE_STEP114_2X_E_QUERY_ID\0",
  queryHash: "FINPLE_STEP114_2X_E_QUERY_HASH\0",
  operationHash: "FINPLE_STEP114_2X_E_QUERY_OPERATION_HASH\0",
  introspectionId: "FINPLE_STEP114_2X_E_INTROSPECTION_ID\0",
  introspectionHash: "FINPLE_STEP114_2X_E_INTROSPECTION_HASH\0",
  gateId: "FINPLE_STEP114_2X_E_GATE_ID\0",
  gateHash: "FINPLE_STEP114_2X_E_GATE_HASH\0",
  evidenceId: "FINPLE_STEP114_2X_E_EVIDENCE_ID\0",
  evidenceHash: "FINPLE_STEP114_2X_E_EVIDENCE_HASH\0",
  scenarioEvidenceId: "FINPLE_STEP114_2X_E_SCENARIO_EVIDENCE_ID\0",
  scenarioEvidenceHash: "FINPLE_STEP114_2X_E_SCENARIO_EVIDENCE_HASH\0",
  runEvidenceSummaryId: "FINPLE_STEP114_2X_E_RUN_EVIDENCE_SUMMARY_ID\0",
  runEvidenceSummaryHash: "FINPLE_STEP114_2X_E_RUN_EVIDENCE_SUMMARY_HASH\0",
  summaryId: "FINPLE_STEP114_2X_E_SUMMARY_ID\0",
  summaryHash: "FINPLE_STEP114_2X_E_SUMMARY_HASH\0",
});

const UPSTREAM_BINDING_FIELDS = Object.freeze([
  "preparationSummaryId", "preparationSummaryHash",
  "claimStoreProtocolHash", "repositoryLockProtocolHash",
  "decisionId", "decisionHash", "schemaPlanId", "schemaPlanHash",
  "transactionPlanId", "transactionPlanHash", "credentialPlanId",
  "credentialPlanHash", "runbookId", "runbookHash", "preflightId",
  "preflightSummaryHash",
]);
const PACKAGE_BINDING_FIELDS = Object.freeze([
  "upstreamBindings", "migrationSpecId", "migrationSpecHash",
  "querySpecId", "querySpecHash", "introspectionSpecId",
  "introspectionSpecHash",
]);
const FUTURE_PACKAGE_BINDING_FIELDS = Object.freeze([
  ...PACKAGE_BINDING_FIELDS, "testDatabaseGateId", "testDatabaseGateHash",
]);

const MIGRATION_FIELDS = Object.freeze([
  "contractVersion", "migrationSpecId", "upstreamBindings", "logicalResources",
  "resourceDefinitions", "orderedOperations", "destructiveOperationVocabulary",
  "destructiveOperationsAllowed", "downMigrationAllowed", "extensionInstallAllowed",
  "superuserOperationAllowed", "advisoryLockOnlyAllowed", "sqlPreviews",
  "callableMethods", "inertStructuredManifestOnly", "migrationSpecHash",
]);
const RESOURCE_FIELDS = Object.freeze([
  "logicalName", "columns", "states", "uniqueConstraints", "immutableFields",
  "supportIndexes", "forbiddenBehaviors",
]);
const QUERY_FIELDS = Object.freeze([
  "contractVersion", "querySpecId", "upstreamBindings", "operationOrder",
  "operations", "callableMethods",
  "executableSqlIncluded", "structuredManifestOnly", "querySpecHash",
]);
const OPERATION_FIELDS = Object.freeze([
  "operation", "adapterInputFields", "storageParameters",
  "inputToParameterMapping", "derivedParameterRules", "transactionBoundary",
  "affectedRows", "resultCategories", "stateVersionHashPredicates",
  "immutableBindingPredicates", "durableCommitAcknowledgement",
  "ambiguousOutcomePolicy", "retryClassification", "operationSpecHash",
]);
const MAPPING_FIELDS = Object.freeze(["source", "destination"]);
const INTROSPECTION_FIELDS = Object.freeze([
  "contractVersion", "introspectionSpecId", "upstreamBindings",
  "expectedMigrationSpecId", "expectedMigrationSpecHash",
  "expectedSchemaPackageVersion", "expectedLogicalResources",
  "expectedStateConstraints", "expectedUniqueConstraints",
  "expectedImmutableFieldSets", "expectedSupportIndexes",
  "runtimeDeniedPrivileges", "runtimeSchemaOwner",
  "runtimeSuperuser", "migrationRuntimeRolesDistinct", "utcTimezoneRequired",
  "transactionIsolationRequirement", "backupRestoreCapabilityDeclarationRequired",
  "deleteResetReuseAbsent", "ttlEvictionAbsent", "advisoryLockOnlyAbsent",
  "catalogQueryExecutionAllowed", "expectedEvidenceOnly", "introspectionSpecHash",
]);
const GATE_FIELDS = Object.freeze([
  "contractVersion", "testDatabaseGateId", "packageBindings",
  "testDatabasePurpose", "production", "staging", "sharedDevelopment",
  "applicationDataStorage", "namespaceRequirement", "migrationCredentialCategory",
  "runtimeCredentialCategory", "credentialCategoriesDistinct",
  "futureSecretInjectionRequired", "credentialFallbackAllowed",
  "laterObservations", "laterSanitizedOperatorApprovalHashRequired",
  "laterExpirationWindowRequired", "laterOneTimeAuthorizationRequired",
  "cleanupPolicy", ...FIXED_FALSE_FIELDS, "testDatabaseGateHash",
]);
const EVIDENCE_FIELDS = Object.freeze([
  "contractVersion", "futureEvidenceSpecId", "packageBindings", "scenarioClasses",
  "exactScenarioCount", "scenarioExpectations", "scenarioEvidenceContract",
  "runEvidenceSummaryContract",
  "evidenceProduced", "executionOccurred", "databaseConnected",
  "futureEvidenceOnly", "rawMaterialAllowed",
  "futureEvidenceSpecHash",
]);
const EVIDENCE_CONTRACT_DEFINITION_FIELDS = Object.freeze([
  "contractVersion", "exactFields", "exactOrderRequired", "exactKeyValidationRequired",
  "canonicalHashValidationRequired", "rawMaterialForbidden", "hashChainGenesis",
  "fieldRules",
]);
const SCENARIO_EXPECTATION_FIELDS = Object.freeze([
  "scenarioSequence", "scenarioClass", "expectedResultCategory",
  "expectedAffectedRows", "winnerCount", "mutationObserved",
  "manualReviewRequired",
]);
const SCENARIO_EVIDENCE_FIELDS = Object.freeze([
  "contractVersion", "scenarioEvidenceId", "scenarioSequence", "scenarioClass",
  "packageSummaryId", "packageSummaryHash", "testDatabaseGateId",
  "testDatabaseGateHash", "sanitizedDatabaseFingerprintHash",
  "expectedResultCategory", "observedResultCategory", "expectedAffectedRows",
  "observedAffectedRows", "winnerCount", "mutationObserved", "priorStateHash",
  "resultingStateHash", "manualReviewRequired", "previousEvidenceHash",
  "evidenceHash",
]);
const RUN_EVIDENCE_SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "runEvidenceSummaryId", "packageSummaryId",
  "packageSummaryHash", "testDatabaseGateId", "testDatabaseGateHash",
  "exactScenarioCount", "scenarioOrder", "firstEvidenceHash",
  "lastEvidenceHash", "hashChainValidationRequired", "allEvidenceComplete",
  "rawMaterialForbidden", "executionOccurred", "databaseConnected",
  ...FIXED_FALSE_FIELDS, "runEvidenceSummaryHash",
]);
const SCENARIO_EVIDENCE_FIELD_RULES = Object.freeze({
  scenarioEvidenceId: "domain_separated_identity_from_exact_canonical_fields",
  scenarioSequence: "one_based_exact_future_scenario_order",
  scenarioClass: "exact_future_scenario_class_at_sequence",
  packageSummaryId: "safe_identity_exact_run_package_binding",
  packageSummaryHash: "sha256_exact_run_package_binding",
  testDatabaseGateId: "safe_identity_exact_run_gate_binding",
  testDatabaseGateHash: "sha256_exact_run_gate_binding",
  sanitizedDatabaseFingerprintHash: "sha256_sanitized_fingerprint_only",
  expectedResultCategory: "exact_scenario_expectation",
  observedResultCategory: "safe_identity_observation_or_manual_review_category",
  expectedAffectedRows: "exact_scenario_expectation",
  observedAffectedRows: "non_negative_integer_or_approved_symbolic_observation",
  winnerCount: "non_negative_integer_exact_scenario_expectation",
  mutationObserved: "boolean_exact_scenario_expectation",
  priorStateHash: "sha256_or_zero_hash_when_no_prior_state",
  resultingStateHash: "sha256_or_zero_hash_when_no_resulting_state",
  manualReviewRequired: "boolean_exact_scenario_expectation",
  previousEvidenceHash: "zero_hash_for_first_else_previous_scenario_evidence_hash",
  evidenceHash: "domain_separated_canonical_sha256_excluding_evidence_hash",
});
const RUN_EVIDENCE_SUMMARY_FIELD_RULES = Object.freeze({
  runEvidenceSummaryId: "domain_separated_identity_from_exact_canonical_fields",
  packageSummaryId: "safe_identity_exact_package_binding",
  packageSummaryHash: "sha256_exact_package_binding",
  testDatabaseGateId: "safe_identity_exact_gate_binding",
  testDatabaseGateHash: "sha256_exact_gate_binding",
  exactScenarioCount: "exact_future_scenario_count",
  scenarioOrder: "exact_future_scenario_order",
  firstEvidenceHash: "sha256_exact_first_scenario_evidence_hash",
  lastEvidenceHash: "sha256_exact_last_scenario_evidence_hash",
  hashChainValidationRequired: "exact_true",
  allEvidenceComplete: "exact_true_before_summary_acceptance",
  rawMaterialForbidden: "exact_true",
  executionOccurred: "future_observation_boolean_not_authority",
  databaseConnected: "future_observation_boolean_not_authority",
  authorityFields: "all_fixed_false",
  runEvidenceSummaryHash: "domain_separated_canonical_sha256_excluding_summary_hash",
});
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "packageSummaryId", "upstreamBindings",
  "migrationSpecId", "migrationSpecHash",
  "querySpecId", "querySpecHash", "introspectionSpecId", "introspectionSpecHash",
  "testDatabaseGateId", "testDatabaseGateHash", "futureEvidenceSpecId",
  "futureEvidenceSpecHash", "logicalResourceCount", "queryOperationCount",
  "futureScenarioCount", ...FIXED_FALSE_FIELDS, "packageSummaryHash",
]);

const SPECS = Object.freeze({
  migration: { version: MIGRATION_SPEC_CONTRACT_VERSION, fields: MIGRATION_FIELDS,
    idField: "migrationSpecId", hashField: "migrationSpecHash",
    prefix: "metrics-cutover-postgresql-migration-spec",
    idDomain: DOMAINS.migrationId, hashDomain: DOMAINS.migrationHash },
  query: { version: QUERY_SPEC_CONTRACT_VERSION, fields: QUERY_FIELDS,
    idField: "querySpecId", hashField: "querySpecHash",
    prefix: "metrics-cutover-postgresql-query-spec",
    idDomain: DOMAINS.queryId, hashDomain: DOMAINS.queryHash },
  introspection: { version: INTROSPECTION_SPEC_CONTRACT_VERSION,
    fields: INTROSPECTION_FIELDS, idField: "introspectionSpecId",
    hashField: "introspectionSpecHash",
    prefix: "metrics-cutover-postgresql-introspection-spec",
    idDomain: DOMAINS.introspectionId, hashDomain: DOMAINS.introspectionHash },
  gate: { version: TEST_DATABASE_GATE_CONTRACT_VERSION, fields: GATE_FIELDS,
    idField: "testDatabaseGateId", hashField: "testDatabaseGateHash",
    prefix: "metrics-cutover-postgresql-test-database-gate",
    idDomain: DOMAINS.gateId, hashDomain: DOMAINS.gateHash },
  evidence: { version: FUTURE_EVIDENCE_SPEC_CONTRACT_VERSION,
    fields: EVIDENCE_FIELDS, idField: "futureEvidenceSpecId",
    hashField: "futureEvidenceSpecHash",
    prefix: "metrics-cutover-postgresql-test-evidence-spec",
    idDomain: DOMAINS.evidenceId, hashDomain: DOMAINS.evidenceHash },
  scenarioEvidence: { version: SCENARIO_EVIDENCE_CONTRACT_VERSION,
    fields: SCENARIO_EVIDENCE_FIELDS, idField: "scenarioEvidenceId",
    hashField: "evidenceHash",
    prefix: "metrics-cutover-postgresql-test-scenario-evidence",
    idDomain: DOMAINS.scenarioEvidenceId,
    hashDomain: DOMAINS.scenarioEvidenceHash },
  runEvidenceSummary: { version: RUN_EVIDENCE_SUMMARY_CONTRACT_VERSION,
    fields: RUN_EVIDENCE_SUMMARY_FIELDS, idField: "runEvidenceSummaryId",
    hashField: "runEvidenceSummaryHash",
    prefix: "metrics-cutover-postgresql-test-run-evidence-summary",
    idDomain: DOMAINS.runEvidenceSummaryId,
    hashDomain: DOMAINS.runEvidenceSummaryHash },
  summary: { version: PACKAGE_SUMMARY_CONTRACT_VERSION, fields: SUMMARY_FIELDS,
    idField: "packageSummaryId", hashField: "packageSummaryHash",
    prefix: "metrics-cutover-postgresql-package-summary",
    idDomain: DOMAINS.summaryId, hashDomain: DOMAINS.summaryHash },
});

function without(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function exactArray(value, expected) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function canonicalEqual(value, expected) {
  try {
    return canonicalJson(value) === canonicalJson(expected);
  } catch {
    return false;
  }
}

function buildEvidenceContractDefinition(contractVersion, exactFields, fieldRules) {
  return {
    contractVersion,
    exactFields: [...exactFields],
    exactOrderRequired: true,
    exactKeyValidationRequired: true,
    canonicalHashValidationRequired: true,
    rawMaterialForbidden: true,
    hashChainGenesis: ZERO_HASH,
    fieldRules: structuredClone(fieldRules),
  };
}

function validateEvidenceContractDefinition(
  value, version, fields, fieldRules, label,
) {
  const expected = buildEvidenceContractDefinition(version, fields, fieldRules);
  return isRecord(value) &&
    hasExactKeys(value, EVIDENCE_CONTRACT_DEFINITION_FIELDS) &&
    canonicalEqual(value, expected)
    ? []
    : [`${label}_contract_definition_invalid`];
}

function validateScenarioExpectations(value) {
  if (!Array.isArray(value) ||
      value.length !== FUTURE_SCENARIO_EXPECTATIONS.length) {
    return ["future_evidence_scenario_expectations_invalid"];
  }
  const issues = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry) || !hasExactKeys(entry, SCENARIO_EXPECTATION_FIELDS)) {
      issues.push(`future_evidence_scenario_expectation_fields_invalid:${index + 1}`);
    } else if (!canonicalEqual(entry, FUTURE_SCENARIO_EXPECTATIONS[index])) {
      issues.push(`future_evidence_scenario_expectation_mismatch:${index + 1}`);
    }
  });
  return uniqueSorted(issues);
}

function sealContract(value, spec) {
  const sealed = structuredClone(value);
  delete sealed[spec.idField];
  delete sealed[spec.hashField];
  sealed[spec.idField] = `${spec.prefix}-${hashWithDomain(spec.idDomain, sealed)}`;
  sealed[spec.hashField] = hashWithDomain(spec.hashDomain, without(sealed, spec.hashField));
  return sealed;
}

function validateEnvelope(value, spec, label) {
  const issues = [];
  if (!isRecord(value)) return [`${label}_not_object`];
  if (!hasExactKeys(value, spec.fields)) issues.push(`${label}_fields_invalid`);
  if (value.contractVersion !== spec.version) issues.push(`${label}_contract_version_invalid`);
  if (!isSafeIdentity(value[spec.idField]) || !value[spec.idField].startsWith(`${spec.prefix}-`)) issues.push(`${label}_id_invalid`);
  if (!isSha256(value[spec.hashField])) issues.push(`${label}_hash_invalid`);
  try {
    const idPayload = without(without(value, spec.idField), spec.hashField);
    if (value[spec.idField] !== `${spec.prefix}-${hashWithDomain(spec.idDomain, idPayload)}`) issues.push(`${label}_id_mismatch`);
    if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, without(value, spec.hashField))) issues.push(`${label}_hash_mismatch`);
  } catch {
    issues.push(`${label}_canonicalization_failed`);
  }
  return issues;
}

function buildUpstreamArtifacts() {
  const packet = buildValidPreflightPacket();
  return {
    ...packet,
    preflightSummary: buildStep114_2x_dSummary(packet),
  };
}

function buildUpstreamBindings(upstream) {
  return {
    preparationSummaryId: upstream.preparationSummary.preparationId,
    preparationSummaryHash: upstream.preparationSummary.summaryHash,
    claimStoreProtocolHash: upstream.claimStoreProtocol.protocolHash,
    repositoryLockProtocolHash: upstream.repositoryLockProtocol.protocolHash,
    decisionId: upstream.persistenceDecision.decisionId,
    decisionHash: upstream.persistenceDecision.decisionHash,
    schemaPlanId: upstream.schemaPlan.schemaPlanId,
    schemaPlanHash: upstream.schemaPlan.schemaPlanHash,
    transactionPlanId: upstream.transactionPlan.transactionPlanId,
    transactionPlanHash: upstream.transactionPlan.transactionPlanHash,
    credentialPlanId: upstream.credentialPlan.credentialPlanId,
    credentialPlanHash: upstream.credentialPlan.credentialPlanHash,
    runbookId: upstream.migrationRunbook.runbookId,
    runbookHash: upstream.migrationRunbook.runbookHash,
    preflightId: upstream.preflightSummary.preflightId,
    preflightSummaryHash: upstream.preflightSummary.summaryHash,
  };
}

function validateUpstreamBindings(value, upstream, label) {
  if (!isRecord(value) || !hasExactKeys(value, UPSTREAM_BINDING_FIELDS)) {
    return [`${label}_upstream_binding_fields_invalid`];
  }
  const issues = [];
  for (const field of UPSTREAM_BINDING_FIELDS) {
    if (field.endsWith("Id") && !isSafeIdentity(value[field])) {
      issues.push(`${label}_upstream_id_invalid:${field}`);
    }
    if (field.endsWith("Hash") && !isSha256(value[field])) {
      issues.push(`${label}_upstream_hash_invalid:${field}`);
    }
  }
  try {
    const expected = buildUpstreamBindings(upstream);
    for (const field of UPSTREAM_BINDING_FIELDS) {
      if (value[field] !== expected[field]) {
        issues.push(`${label}_upstream_binding_mismatch:${field}`);
      }
    }
  } catch {
    issues.push(`${label}_upstream_binding_construction_failed`);
  }
  return uniqueSorted(issues);
}

function validateUpstreamArtifacts(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "preparationSummary", "claimStoreProtocol", "repositoryLockProtocol",
    "persistenceDecision", "schemaPlan", "transactionPlan", "credentialPlan",
    "migrationRunbook", "preflightSummary",
  ])) return ["upstream_artifacts_fields_invalid"];
  const issues = [
    ...validatePreparationSummary(upstream.preparationSummary).map((issue) => `step114_2x_b_${issue}`),
    ...validateClaimStoreAdapterProtocol(upstream.claimStoreProtocol).map((issue) => `step114_2x_c_${issue}`),
    ...validateRepositoryLockAdapterProtocol(upstream.repositoryLockProtocol).map((issue) => `step114_2x_c_${issue}`),
    ...validateDecision(upstream.persistenceDecision, upstream.preparationSummary).map((issue) => `step114_2x_d_${issue}`),
    ...validateSchema(upstream.schemaPlan, upstream.persistenceDecision, upstream.preparationSummary).map((issue) => `step114_2x_d_${issue}`),
    ...validateTransaction(
      upstream.transactionPlan, upstream.persistenceDecision, upstream.schemaPlan,
      upstream.preparationSummary, upstream.claimStoreProtocol,
      upstream.repositoryLockProtocol,
    ).map((issue) => `step114_2x_d_${issue}`),
    ...validateCredential(
      upstream.credentialPlan, upstream.persistenceDecision,
      upstream.schemaPlan, upstream.preparationSummary,
    ).map((issue) => `step114_2x_d_${issue}`),
    ...validateRunbook(upstream.migrationRunbook, upstream).map((issue) => `step114_2x_d_${issue}`),
    ...validateStep114_2x_dSummary(upstream.preflightSummary, upstream).map((issue) => `step114_2x_d_${issue}`),
  ];
  return uniqueSorted(issues);
}

function claimDefinition() {
  return {
    logicalName: "claim_record",
    columns: [
      "claim_id:immutable_identity", "receipt_identity_hash:sha256",
      "receipt_binding_hash:sha256", "state:claim_state", "version:positive_integer",
      "created_at:immutable_utc_instant", "terminal_at:nullable_utc_instant",
      "terminal_evidence_hash:nullable_sha256", "record_hash:sha256",
    ],
    states: [...CLAIM_STATES],
    uniqueConstraints: ["receipt_identity_hash"],
    immutableFields: ["claim_id", "receipt_identity_hash", "receipt_binding_hash", "created_at"],
    supportIndexes: ["receipt_identity_state_version_record_hash"],
    forbiddenBehaviors: ["terminal_to_terminal_update", "delete", "reset", "release", "reuse", "overwrite"],
  };
}

function lockDefinition() {
  return {
    logicalName: "repository_lock_record",
    columns: [
      "lock_id:immutable_identity", "repository_identity_hash:sha256",
      "head_hash:git_sha", "tree_hash:git_sha", "branch_hash:sha256",
      "tracked_paths_hash:sha256", "receipt_identity_hash:sha256",
      "receipt_binding_hash:sha256", "owner_liveness_hash:sha256",
      "state:lock_state", "version:positive_integer",
      "acquired_at:immutable_utc_instant", "released_at:nullable_utc_instant",
      "terminal_claim_evidence_hash:nullable_sha256", "record_hash:sha256",
    ],
    states: [...LOCK_STATES],
    uniqueConstraints: ["repository_identity_hash"],
    immutableFields: [
      "lock_id", "repository_identity_hash", "head_hash", "tree_hash",
      "branch_hash", "tracked_paths_hash", "receipt_identity_hash",
      "receipt_binding_hash", "owner_liveness_hash", "acquired_at",
    ],
    supportIndexes: ["repository_identity_state_version_record_hash_terminal_claim"],
    forbiddenBehaviors: ["steal", "reacquire", "delete", "reset", "overwrite", "ttl", "eviction", "automatic_stale_recovery"],
  };
}

function buildMigrationSpec(upstream) {
  return sealContract({
    contractVersion: MIGRATION_SPEC_CONTRACT_VERSION,
    upstreamBindings: buildUpstreamBindings(upstream),
    logicalResources: [...LOGICAL_RESOURCES],
    resourceDefinitions: [claimDefinition(), lockDefinition()],
    orderedOperations: [...MIGRATION_OPERATIONS],
    destructiveOperationVocabulary: [...DESTRUCTIVE_OPERATIONS],
    destructiveOperationsAllowed: false, downMigrationAllowed: false,
    extensionInstallAllowed: false, superuserOperationAllowed: false,
    advisoryLockOnlyAllowed: false, sqlPreviews: [], callableMethods: [],
    inertStructuredManifestOnly: true,
  }, SPECS.migration);
}

const QUERY_DEFINITIONS = Object.freeze({
  acquireClaim: {
    adapterInputFields: ["receiptIdentityHash", "receiptBindingHash", "testClockInstant"],
    storageParameters: [
      "receiptIdentityHash", "receiptBindingHash", "claimId", "state", "version",
      "createdAt", "terminalAt", "terminalEvidenceHash", "claimHash",
    ],
    inputToParameterMapping: [
      { source: "receiptIdentityHash", destination: "receiptIdentityHash" },
      { source: "receiptBindingHash", destination: "receiptBindingHash" },
      { source: "testClockInstant", destination: "createdAt" },
    ],
    derivedParameterRules: [
      "claimId_from_validated_immutable_receipt_identity_and_binding",
      "state_exact_claim_in_progress", "version_exact_one",
      "terminalAt_exact_empty", "terminalEvidenceHash_exact_zero_hash",
      "claimHash_from_validated_immutable_fields_state_version_and_createdAt",
    ],
    transactionBoundary: "single_atomic_insert_unique_conflict_transaction",
    affectedRows: "exactly_one_winner_or_zero_conflict",
    resultCategories: ["claim_acquired", "already_claimed_read_only"],
    stateVersionHashPredicates: ["initial_state_claim_in_progress", "version_one", "record_hash_exact"],
    immutableBindingPredicates: ["receipt_identity_hash", "receipt_binding_hash", "claim_id", "created_at"],
  },
  readClaim: {
    adapterInputFields: ["receiptIdentityHash"],
    storageParameters: ["receiptIdentityHash"],
    inputToParameterMapping: [
      { source: "receiptIdentityHash", destination: "receiptIdentityHash" },
    ],
    derivedParameterRules: [],
    transactionBoundary: "strong_read_after_write_read_only",
    affectedRows: "zero_or_one_read_only", resultCategories: ["claim_found", "claim_not_found"],
    stateVersionHashPredicates: ["record_hash_returned_for_validation"],
    immutableBindingPredicates: ["receipt_identity_hash"],
  },
  transitionClaimTerminal: {
    adapterInputFields: [
      "receiptIdentityHash", "expectedState", "expectedVersion",
      "expectedClaimHash", "terminalState", "terminalEvidenceHash",
      "testClockInstant",
    ],
    storageParameters: [
      "receiptIdentityHash", "expectedState", "expectedVersion",
      "expectedClaimHash", "terminalState", "terminalEvidenceHash",
      "terminalAt", "nextVersion", "nextClaimHash",
    ],
    inputToParameterMapping: [
      { source: "receiptIdentityHash", destination: "receiptIdentityHash" },
      { source: "expectedState", destination: "expectedState" },
      { source: "expectedVersion", destination: "expectedVersion" },
      { source: "expectedClaimHash", destination: "expectedClaimHash" },
      { source: "terminalState", destination: "terminalState" },
      { source: "terminalEvidenceHash", destination: "terminalEvidenceHash" },
      { source: "testClockInstant", destination: "terminalAt" },
    ],
    derivedParameterRules: [
      "nextVersion_exact_expectedVersion_plus_one",
      "nextClaimHash_from_validated_immutable_fields_terminalState_nextVersion_terminalAt_and_terminalEvidenceHash",
    ],
    transactionBoundary: "single_conditional_terminal_update_transaction",
    affectedRows: "exactly_one_or_zero_stale_conflict_replay",
    resultCategories: ["terminal_transition_persisted", "stale_conflict_or_replay"],
    stateVersionHashPredicates: ["state_claim_in_progress", "expected_version", "expected_record_hash", "approved_terminal_state"],
    immutableBindingPredicates: ["receipt_identity_hash", "receipt_binding_hash", "claim_id", "created_at"],
  },
  acquireLock: {
    adapterInputFields: [
      "repositoryIdentityHash", "repositoryHeadSha", "repositoryTreeSha",
      "repositoryBranchName", "trackedPathsSha256", "ownerLivenessHash",
      "receiptIdentityHash", "receiptBindingHash", "testClockInstant",
    ],
    storageParameters: [
      "repositoryIdentityHash", "repositoryHeadSha", "repositoryTreeSha",
      "repositoryBranchName", "trackedPathsSha256", "ownerLivenessHash",
      "receiptIdentityHash", "receiptBindingHash", "lockId", "state", "version",
      "acquiredAt", "releasedAt", "terminalClaimEvidenceHash", "lockHash",
    ],
    inputToParameterMapping: [
      { source: "repositoryIdentityHash", destination: "repositoryIdentityHash" },
      { source: "repositoryHeadSha", destination: "repositoryHeadSha" },
      { source: "repositoryTreeSha", destination: "repositoryTreeSha" },
      { source: "repositoryBranchName", destination: "repositoryBranchName" },
      { source: "trackedPathsSha256", destination: "trackedPathsSha256" },
      { source: "ownerLivenessHash", destination: "ownerLivenessHash" },
      { source: "receiptIdentityHash", destination: "receiptIdentityHash" },
      { source: "receiptBindingHash", destination: "receiptBindingHash" },
      { source: "testClockInstant", destination: "acquiredAt" },
    ],
    derivedParameterRules: [
      "lockId_from_validated_immutable_repository_receipt_and_owner_bindings",
      "state_exact_lock_held", "version_exact_one", "releasedAt_exact_empty",
      "terminalClaimEvidenceHash_exact_zero_hash",
      "lockHash_from_validated_immutable_fields_state_version_and_acquiredAt",
    ],
    transactionBoundary: "single_atomic_insert_unique_repository_transaction",
    affectedRows: "exactly_one_winner_or_zero_conflict",
    resultCategories: ["lock_acquired", "existing_lock_manual_review"],
    stateVersionHashPredicates: ["initial_state_lock_held", "version_one", "record_hash_exact"],
    immutableBindingPredicates: ["repository_identity_hash", "head_hash", "tree_hash", "branch_hash", "tracked_paths_hash", "receipt_identity_hash", "receipt_binding_hash", "owner_liveness_hash", "lock_id", "acquired_at"],
  },
  readLock: {
    adapterInputFields: ["repositoryIdentityHash"],
    storageParameters: ["repositoryIdentityHash"],
    inputToParameterMapping: [
      { source: "repositoryIdentityHash", destination: "repositoryIdentityHash" },
    ],
    derivedParameterRules: [],
    transactionBoundary: "strong_read_after_write_read_only",
    affectedRows: "zero_or_one_read_only", resultCategories: ["lock_found", "lock_not_found"],
    stateVersionHashPredicates: ["record_hash_returned_for_validation"],
    immutableBindingPredicates: ["repository_identity_hash"],
  },
  releaseLock: {
    adapterInputFields: [
      "repositoryIdentityHash", "expectedState", "expectedVersion",
      "expectedLockHash", "expectedTerminalClaimHash",
      "expectedReceiptIdentityHash", "expectedReceiptBindingHash",
      "terminalClaim", "testClockInstant",
    ],
    storageParameters: [
      "repositoryIdentityHash", "expectedState", "expectedVersion",
      "expectedLockHash", "terminalClaimHash", "receiptIdentityHash",
      "receiptBindingHash", "terminalClaimAt", "releasedAt", "nextState",
      "nextVersion", "nextLockHash",
    ],
    inputToParameterMapping: [
      { source: "repositoryIdentityHash", destination: "repositoryIdentityHash" },
      { source: "expectedState", destination: "expectedState" },
      { source: "expectedVersion", destination: "expectedVersion" },
      { source: "expectedLockHash", destination: "expectedLockHash" },
      { source: "expectedTerminalClaimHash", destination: "terminalClaimHash" },
      { source: "expectedReceiptIdentityHash", destination: "receiptIdentityHash" },
      { source: "expectedReceiptBindingHash", destination: "receiptBindingHash" },
      { source: "terminalClaim.claimHash", destination: "terminalClaimHash" },
      { source: "terminalClaim.receiptIdentityHash", destination: "receiptIdentityHash" },
      { source: "terminalClaim.receiptBindingHash", destination: "receiptBindingHash" },
      { source: "terminalClaim.terminalAt", destination: "terminalClaimAt" },
      { source: "testClockInstant", destination: "releasedAt" },
    ],
    derivedParameterRules: [
      "expected_and_terminal_claim_hashes_must_match",
      "expected_and_terminal_claim_receipt_identity_hashes_must_match",
      "expected_and_terminal_claim_receipt_binding_hashes_must_match",
      "nextState_exact_lock_released",
      "nextVersion_exact_expectedVersion_plus_one",
      "nextLockHash_from_validated_immutable_fields_nextState_nextVersion_releasedAt_and_terminalClaimHash",
    ],
    transactionBoundary: "single_conditional_release_after_terminal_persistence_transaction",
    affectedRows: "exactly_one_or_zero_stale_conflict_replay",
    resultCategories: ["lock_release_persisted", "repeated_release_read_only", "manual_review_required"],
    stateVersionHashPredicates: ["state_lock_held", "expected_version", "expected_lock_hash", "terminal_claim_durably_observed", "released_after_acquired_and_terminal"],
    immutableBindingPredicates: ["repository_identity_hash", "receipt_identity_hash", "receipt_binding_hash", "terminal_claim_hash"],
  },
});

function buildQueryOperation(operation) {
  const value = {
    operation,
    ...structuredClone(QUERY_DEFINITIONS[operation]),
    durableCommitAcknowledgement: operation.startsWith("read") ? "not_applicable_read_only" : "required_before_success",
    ambiguousOutcomePolicy: operation.startsWith("read") ? "fail_closed_without_mutation" : "manual_review_no_automatic_retry",
    retryClassification: operation.startsWith("read") ? "read_only_retry_after_identity_revalidation" : "retry_only_when_no_commit_and_no_mutation_proven",
  };
  value.operationSpecHash = hashWithDomain(DOMAINS.operationHash, value);
  return value;
}

function buildQuerySpec(upstream) {
  return sealContract({
    contractVersion: QUERY_SPEC_CONTRACT_VERSION,
    upstreamBindings: buildUpstreamBindings(upstream),
    operationOrder: [...QUERY_OPERATIONS],
    operations: QUERY_OPERATIONS.map(buildQueryOperation),
    callableMethods: [], executableSqlIncluded: false, structuredManifestOnly: true,
  }, SPECS.query);
}

function buildIntrospectionSpec(upstream, migrationSpec) {
  return sealContract({
    contractVersion: INTROSPECTION_SPEC_CONTRACT_VERSION,
    upstreamBindings: buildUpstreamBindings(upstream),
    expectedMigrationSpecId: migrationSpec.migrationSpecId,
    expectedMigrationSpecHash: migrationSpec.migrationSpecHash,
    expectedSchemaPackageVersion: MIGRATION_SPEC_CONTRACT_VERSION,
    expectedLogicalResources: [...LOGICAL_RESOURCES],
    expectedStateConstraints: [
      { logicalName: "claim_record", states: [...CLAIM_STATES] },
      { logicalName: "repository_lock_record", states: [...LOCK_STATES] },
    ],
    expectedUniqueConstraints: [
      { logicalName: "claim_record", uniqueConstraints: [...claimDefinition().uniqueConstraints] },
      { logicalName: "repository_lock_record", uniqueConstraints: [...lockDefinition().uniqueConstraints] },
    ],
    expectedImmutableFieldSets: [
      { logicalName: "claim_record", immutableFields: [...claimDefinition().immutableFields] },
      { logicalName: "repository_lock_record", immutableFields: [...lockDefinition().immutableFields] },
    ],
    expectedSupportIndexes: [
      { logicalName: "claim_record", supportIndexes: [...claimDefinition().supportIndexes] },
      { logicalName: "repository_lock_record", supportIndexes: [...lockDefinition().supportIndexes] },
    ],
    runtimeDeniedPrivileges: ["ALTER", "DELETE", "DROP", "TRUNCATE", "SCHEMA_OWNER", "SUPERUSER"],
    runtimeSchemaOwner: false, runtimeSuperuser: false,
    migrationRuntimeRolesDistinct: true, utcTimezoneRequired: true,
    transactionIsolationRequirement: "serializable_or_equivalent_single_winner",
    backupRestoreCapabilityDeclarationRequired: true,
    deleteResetReuseAbsent: true, ttlEvictionAbsent: true,
    advisoryLockOnlyAbsent: true, catalogQueryExecutionAllowed: false,
    expectedEvidenceOnly: true,
  }, SPECS.introspection);
}

function packageBindings(
  upstream, migrationSpec, querySpec, introspectionSpec,
  testDatabaseGate = null,
) {
  const bindings = {
    upstreamBindings: buildUpstreamBindings(upstream),
    migrationSpecId: migrationSpec.migrationSpecId,
    migrationSpecHash: migrationSpec.migrationSpecHash,
    querySpecId: querySpec.querySpecId,
    querySpecHash: querySpec.querySpecHash,
    introspectionSpecId: introspectionSpec.introspectionSpecId,
    introspectionSpecHash: introspectionSpec.introspectionSpecHash,
  };
  if (testDatabaseGate) {
    bindings.testDatabaseGateId = testDatabaseGate.testDatabaseGateId;
    bindings.testDatabaseGateHash = testDatabaseGate.testDatabaseGateHash;
  }
  return bindings;
}

function buildTestDatabaseGate(upstream, migrationSpec, querySpec, introspectionSpec) {
  return sealContract({
    contractVersion: TEST_DATABASE_GATE_CONTRACT_VERSION,
    packageBindings: packageBindings(upstream, migrationSpec, querySpec, introspectionSpec),
    testDatabasePurpose: "disposable_isolated_conformance_only",
    production: false, staging: false, sharedDevelopment: false,
    applicationDataStorage: false,
    namespaceRequirement: "new_empty_or_human_approved_disposable_namespace",
    migrationCredentialCategory: "future_dedicated_migration_credential_category",
    runtimeCredentialCategory: "future_dedicated_runtime_credential_category",
    credentialCategoriesDistinct: true, futureSecretInjectionRequired: true,
    credentialFallbackAllowed: false,
    laterObservations: ["network_destination_allowlist", "database_fingerprint", "certificate_fingerprint"],
    laterSanitizedOperatorApprovalHashRequired: true,
    laterExpirationWindowRequired: true, laterOneTimeAuthorizationRequired: true,
    cleanupPolicy: "manual_evidence_preserving_no_automatic_delete_on_ambiguity",
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, SPECS.gate);
}

function buildFutureEvidenceSpec(
  upstream, migrationSpec, querySpec, introspectionSpec, testDatabaseGate,
) {
  return sealContract({
    contractVersion: FUTURE_EVIDENCE_SPEC_CONTRACT_VERSION,
    packageBindings: packageBindings(
      upstream, migrationSpec, querySpec, introspectionSpec, testDatabaseGate,
    ),
    scenarioClasses: [...FUTURE_SCENARIOS], exactScenarioCount: FUTURE_SCENARIOS.length,
    scenarioExpectations: structuredClone(FUTURE_SCENARIO_EXPECTATIONS),
    scenarioEvidenceContract: buildEvidenceContractDefinition(
      SCENARIO_EVIDENCE_CONTRACT_VERSION, SCENARIO_EVIDENCE_FIELDS,
      SCENARIO_EVIDENCE_FIELD_RULES,
    ),
    runEvidenceSummaryContract: buildEvidenceContractDefinition(
      RUN_EVIDENCE_SUMMARY_CONTRACT_VERSION, RUN_EVIDENCE_SUMMARY_FIELDS,
      RUN_EVIDENCE_SUMMARY_FIELD_RULES,
    ),
    evidenceProduced: false, executionOccurred: false, databaseConnected: false,
    futureEvidenceOnly: true, rawMaterialAllowed: false,
  }, SPECS.evidence);
}

function buildValidPostgresqlTestPackage() {
  const upstreamArtifacts = buildUpstreamArtifacts();
  const migrationSpec = buildMigrationSpec(upstreamArtifacts);
  const querySpec = buildQuerySpec(upstreamArtifacts);
  const introspectionSpec = buildIntrospectionSpec(upstreamArtifacts, migrationSpec);
  const testDatabaseGate = buildTestDatabaseGate(
    upstreamArtifacts, migrationSpec, querySpec, introspectionSpec,
  );
  const futureEvidenceSpec = buildFutureEvidenceSpec(
    upstreamArtifacts, migrationSpec, querySpec, introspectionSpec,
    testDatabaseGate,
  );
  return { upstreamArtifacts, migrationSpec, querySpec, introspectionSpec, testDatabaseGate, futureEvidenceSpec };
}

function validateResourceDefinition(value, expected, label) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, RESOURCE_FIELDS)) return [`${label}_fields_invalid`];
  for (const field of RESOURCE_FIELDS) {
    if (field === "logicalName") {
      if (value[field] !== expected[field]) issues.push(`${label}_${field}_invalid`);
    } else if (!exactArray(value[field], expected[field])) issues.push(`${label}_${field}_invalid`);
  }
  return issues;
}

function validateMigrationSpec(value, upstream) {
  const issues = validateEnvelope(value, SPECS.migration, "migration_spec");
  if (!isRecord(value)) return issues;
  issues.push(...validateUpstreamBindings(value.upstreamBindings, upstream, "migration"));
  if (!exactArray(value.logicalResources, LOGICAL_RESOURCES)) issues.push("migration_logical_resources_invalid");
  if (!Array.isArray(value.resourceDefinitions) || value.resourceDefinitions.length !== 2) issues.push("migration_resource_definitions_invalid");
  else {
    issues.push(...validateResourceDefinition(value.resourceDefinitions[0], claimDefinition(), "claim_resource"));
    issues.push(...validateResourceDefinition(value.resourceDefinitions[1], lockDefinition(), "lock_resource"));
  }
  if (!exactArray(value.orderedOperations, MIGRATION_OPERATIONS)) issues.push("migration_operation_order_invalid");
  if (!exactArray(value.destructiveOperationVocabulary, DESTRUCTIVE_OPERATIONS)) issues.push("migration_destructive_vocabulary_invalid");
  for (const field of ["destructiveOperationsAllowed", "downMigrationAllowed", "extensionInstallAllowed", "superuserOperationAllowed", "advisoryLockOnlyAllowed"]) if (value[field] !== false) issues.push(`migration_forbidden_behavior:${field}`);
  if (!exactArray(value.sqlPreviews, []) || !exactArray(value.callableMethods, []) || value.inertStructuredManifestOnly !== true) issues.push("migration_inert_boundary_invalid");
  return uniqueSorted(issues);
}

function validateQueryMapping(value, expected, operation) {
  const issues = [];
  if (!Array.isArray(value)) return [`query_operation_mapping_invalid:${operation}`];
  const seen = new Map();
  const allowedSources = new Set(expected.map((entry) => entry.source));
  const allowedDestinations = new Set(
    QUERY_DEFINITIONS[operation].storageParameters,
  );
  for (const entry of value) {
    if (!isRecord(entry) || !hasExactKeys(entry, MAPPING_FIELDS) ||
        !isSafeIdentity(entry.source.replaceAll(".", "_")) ||
        !isSafeIdentity(entry.destination)) {
      issues.push(`query_operation_mapping_entry_invalid:${operation}`);
      continue;
    }
    if (!allowedSources.has(entry.source)) {
      issues.push(`query_operation_mapping_unknown_source:${operation}`);
    }
    if (!allowedDestinations.has(entry.destination)) {
      issues.push(`query_operation_mapping_unknown_destination:${operation}`);
    }
    if (seen.has(entry.source)) {
      issues.push(
        seen.get(entry.source) === entry.destination
          ? `query_operation_mapping_duplicate_source:${operation}`
          : `query_operation_mapping_conflicting_source:${operation}`,
      );
    }
    seen.set(entry.source, entry.destination);
  }
  if (!canonicalEqual(value, expected)) {
    issues.push(`query_operation_mapping_exactness_invalid:${operation}`);
  }
  return uniqueSorted(issues);
}

function validateQueryOperation(value, operation, upstream) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, OPERATION_FIELDS)) return [`query_operation_fields_invalid:${operation}`];
  const expected = buildQueryOperation(operation);
  for (const field of OPERATION_FIELDS) {
    if (field === "operationSpecHash" || field === "inputToParameterMapping") continue;
    if (Array.isArray(expected[field])) {
      if (!exactArray(value[field], expected[field])) issues.push(`query_operation_${field}_invalid:${operation}`);
    } else if (value[field] !== expected[field]) issues.push(`query_operation_${field}_invalid:${operation}`);
  }
  issues.push(...validateQueryMapping(
    value.inputToParameterMapping,
    expected.inputToParameterMapping,
    operation,
  ));
  if (operation === "releaseLock" && !exactArray(
    value.adapterInputFields,
    upstream?.repositoryLockProtocol?.releaseInputFields || [],
  )) issues.push("query_release_input_fields_protocol_mismatch");
  if (!isSha256(value.operationSpecHash) || value.operationSpecHash !== hashWithDomain(DOMAINS.operationHash, without(value, "operationSpecHash"))) issues.push(`query_operation_hash_mismatch:${operation}`);
  return issues;
}

function validateQuerySpec(value, upstream) {
  const issues = validateEnvelope(value, SPECS.query, "query_spec");
  if (!isRecord(value)) return issues;
  issues.push(...validateUpstreamBindings(value.upstreamBindings, upstream, "query"));
  if (!exactArray(value.operationOrder, QUERY_OPERATIONS)) issues.push("query_operation_order_invalid");
  if (!Array.isArray(value.operations) || value.operations.length !== QUERY_OPERATIONS.length) issues.push("query_operations_invalid");
  else value.operations.forEach((operation, index) => issues.push(...validateQueryOperation(operation, QUERY_OPERATIONS[index], upstream)));
  if (!exactArray(value.callableMethods, []) || value.executableSqlIncluded !== false || value.structuredManifestOnly !== true) issues.push("query_inert_boundary_invalid");
  return uniqueSorted(issues);
}

function validateIntrospectionSpec(value, upstream, migrationSpec) {
  const issues = validateEnvelope(value, SPECS.introspection, "introspection_spec");
  if (!isRecord(value)) return issues;
  issues.push(...validateUpstreamBindings(value.upstreamBindings, upstream, "introspection"));
  const expected = buildIntrospectionSpec(upstream, migrationSpec);
  for (const field of [
    "expectedMigrationSpecId", "expectedMigrationSpecHash",
    "expectedSchemaPackageVersion", "expectedLogicalResources",
    "expectedStateConstraints", "expectedUniqueConstraints",
    "expectedImmutableFieldSets", "expectedSupportIndexes",
  ]) {
    if (!canonicalEqual(value[field], expected[field])) {
      issues.push(`introspection_expected_value_invalid:${field}`);
    }
  }
  if (!exactArray(value.runtimeDeniedPrivileges, ["ALTER", "DELETE", "DROP", "TRUNCATE", "SCHEMA_OWNER", "SUPERUSER"])) issues.push("introspection_runtime_privileges_invalid");
  for (const field of ["runtimeSchemaOwner", "runtimeSuperuser", "catalogQueryExecutionAllowed"]) if (value[field] !== false) issues.push(`introspection_forbidden_state:${field}`);
  for (const field of ["migrationRuntimeRolesDistinct", "utcTimezoneRequired", "backupRestoreCapabilityDeclarationRequired", "deleteResetReuseAbsent", "ttlEvictionAbsent", "advisoryLockOnlyAbsent", "expectedEvidenceOnly"]) if (value[field] !== true) issues.push(`introspection_required_evidence_missing:${field}`);
  if (value.transactionIsolationRequirement !== "serializable_or_equivalent_single_winner") issues.push("introspection_isolation_invalid");
  return uniqueSorted(issues);
}

function validateBindings(
  value, upstream, migrationSpec, querySpec, introspectionSpec,
  testDatabaseGate = null,
) {
  const fields = testDatabaseGate
    ? FUTURE_PACKAGE_BINDING_FIELDS
    : PACKAGE_BINDING_FIELDS;
  if (!isRecord(value) || !hasExactKeys(value, fields)) return false;
  return canonicalEqual(
    value,
    packageBindings(
      upstream, migrationSpec, querySpec, introspectionSpec, testDatabaseGate,
    ),
  );
}

function validateTestDatabaseGate(value, upstream, migrationSpec, querySpec, introspectionSpec) {
  const issues = validateEnvelope(value, SPECS.gate, "test_database_gate");
  if (!isRecord(value)) return issues;
  if (!validateBindings(value.packageBindings, upstream, migrationSpec, querySpec, introspectionSpec)) issues.push("test_database_gate_binding_mismatch");
  if (value.testDatabasePurpose !== "disposable_isolated_conformance_only" || value.namespaceRequirement !== "new_empty_or_human_approved_disposable_namespace") issues.push("test_database_gate_purpose_invalid");
  for (const field of ["production", "staging", "sharedDevelopment", "applicationDataStorage", "credentialFallbackAllowed"]) if (value[field] !== false) issues.push(`test_database_gate_forbidden_state:${field}`);
  if (value.migrationCredentialCategory !== "future_dedicated_migration_credential_category" || value.runtimeCredentialCategory !== "future_dedicated_runtime_credential_category" || value.credentialCategoriesDistinct !== true || value.futureSecretInjectionRequired !== true) issues.push("test_database_gate_credential_boundary_invalid");
  if (!exactArray(value.laterObservations, ["network_destination_allowlist", "database_fingerprint", "certificate_fingerprint"]) || value.laterSanitizedOperatorApprovalHashRequired !== true || value.laterExpirationWindowRequired !== true || value.laterOneTimeAuthorizationRequired !== true) issues.push("test_database_gate_later_authorization_invalid");
  if (value.cleanupPolicy !== "manual_evidence_preserving_no_automatic_delete_on_ambiguity") issues.push("test_database_gate_cleanup_policy_invalid");
  for (const field of FIXED_FALSE_FIELDS) if (value[field] !== false) issues.push(`test_database_gate_fixed_false_invalid:${field}`);
  return uniqueSorted(issues);
}

function validateFutureEvidenceSpec(
  value, upstream, migrationSpec, querySpec, introspectionSpec,
  testDatabaseGate,
) {
  const issues = validateEnvelope(value, SPECS.evidence, "future_evidence_spec");
  if (!isRecord(value)) return issues;
  if (!validateBindings(
    value.packageBindings, upstream, migrationSpec, querySpec,
    introspectionSpec, testDatabaseGate,
  )) issues.push("future_evidence_binding_mismatch");
  if (!exactArray(value.scenarioClasses, FUTURE_SCENARIOS) || value.exactScenarioCount !== FUTURE_SCENARIOS.length) issues.push("future_evidence_scenarios_invalid");
  issues.push(...validateScenarioExpectations(value.scenarioExpectations));
  issues.push(...validateEvidenceContractDefinition(
    value.scenarioEvidenceContract,
    SCENARIO_EVIDENCE_CONTRACT_VERSION,
    SCENARIO_EVIDENCE_FIELDS,
    SCENARIO_EVIDENCE_FIELD_RULES,
    "scenario_evidence",
  ));
  issues.push(...validateEvidenceContractDefinition(
    value.runEvidenceSummaryContract,
    RUN_EVIDENCE_SUMMARY_CONTRACT_VERSION,
    RUN_EVIDENCE_SUMMARY_FIELDS,
    RUN_EVIDENCE_SUMMARY_FIELD_RULES,
    "run_evidence_summary",
  ));
  for (const field of ["evidenceProduced", "executionOccurred", "databaseConnected", "rawMaterialAllowed"]) if (value[field] !== false) issues.push(`future_evidence_forbidden_state:${field}`);
  if (value.futureEvidenceOnly !== true) issues.push("future_evidence_boundary_invalid");
  return uniqueSorted(issues);
}

function buildPackageSummary(packet) {
  return sealContract({
    contractVersion: PACKAGE_SUMMARY_CONTRACT_VERSION,
    upstreamBindings: buildUpstreamBindings(packet.upstreamArtifacts),
    migrationSpecId: packet.migrationSpec.migrationSpecId,
    migrationSpecHash: packet.migrationSpec.migrationSpecHash,
    querySpecId: packet.querySpec.querySpecId, querySpecHash: packet.querySpec.querySpecHash,
    introspectionSpecId: packet.introspectionSpec.introspectionSpecId,
    introspectionSpecHash: packet.introspectionSpec.introspectionSpecHash,
    testDatabaseGateId: packet.testDatabaseGate.testDatabaseGateId,
    testDatabaseGateHash: packet.testDatabaseGate.testDatabaseGateHash,
    futureEvidenceSpecId: packet.futureEvidenceSpec.futureEvidenceSpecId,
    futureEvidenceSpecHash: packet.futureEvidenceSpec.futureEvidenceSpecHash,
    logicalResourceCount: LOGICAL_RESOURCES.length,
    queryOperationCount: QUERY_OPERATIONS.length,
    futureScenarioCount: FUTURE_SCENARIOS.length,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, SPECS.summary);
}

function validatePackageSummary(value, packet) {
  const issues = validateEnvelope(value, SPECS.summary, "package_summary");
  if (!isRecord(value)) return issues;
  const expected = buildPackageSummary(packet);
  for (const field of SUMMARY_FIELDS) {
    if (field === "packageSummaryId" || field === "packageSummaryHash") continue;
    if (!canonicalEqual(value[field], expected[field])) issues.push(`package_summary_binding_invalid:${field}`);
  }
  for (const field of FIXED_FALSE_FIELDS) if (value[field] !== false) issues.push(`package_summary_fixed_false_invalid:${field}`);
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "postgresql_test_package_ready";
  return {
    ok: ready, status, contractVersion: PACKAGE_SUMMARY_CONTRACT_VERSION,
    packageReady: ready, upstreamArtifactsValidated: ready,
    migrationSpecValidated: ready, querySpecValidated: ready,
    introspectionSpecValidated: ready, testDatabaseGateValidated: ready,
    futureEvidenceSpecValidated: ready,
    packageSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? ["package_ready_is_not_database_connection_or_sql_execution_authority"] : [],
  };
}

function evaluateMetricsCutoverPostgresqlTestPackage(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "upstreamArtifacts", "migrationSpec", "querySpec", "introspectionSpec",
    "testDatabaseGate", "futureEvidenceSpec",
  ])) return safeResult("blocked", {}, ["postgresql_test_package_fields_invalid"]);
  const issues = [
    ...validateUpstreamArtifacts(packet.upstreamArtifacts),
    ...validateMigrationSpec(packet.migrationSpec, packet.upstreamArtifacts),
    ...validateQuerySpec(packet.querySpec, packet.upstreamArtifacts),
    ...validateIntrospectionSpec(packet.introspectionSpec, packet.upstreamArtifacts, packet.migrationSpec),
    ...validateTestDatabaseGate(packet.testDatabaseGate, packet.upstreamArtifacts, packet.migrationSpec, packet.querySpec, packet.introspectionSpec),
    ...validateFutureEvidenceSpec(
      packet.futureEvidenceSpec, packet.upstreamArtifacts, packet.migrationSpec,
      packet.querySpec, packet.introspectionSpec, packet.testDatabaseGate,
    ),
  ];
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  try {
    const summary = buildPackageSummary(packet);
    issues.push(...validatePackageSummary(summary, packet));
    canonicalJson(summary);
    return issues.length > 0
      ? safeResult("blocked", {}, issues)
      : safeResult("postgresql_test_package_ready", summary);
  } catch {
    return safeResult("blocked", {}, ["postgresql_test_package_summary_construction_failed"]);
  }
}

module.exports = {
  DESTRUCTIVE_OPERATIONS,
  FIXED_FALSE_FIELDS,
  FORBIDDEN_CALLABLE_METHODS,
  FUTURE_EVIDENCE_SPEC_CONTRACT_VERSION,
  FUTURE_SCENARIO_EXPECTATIONS,
  FUTURE_SCENARIOS,
  INTROSPECTION_SPEC_CONTRACT_VERSION,
  LOGICAL_RESOURCES,
  MIGRATION_OPERATIONS,
  MIGRATION_SPEC_CONTRACT_VERSION,
  PACKAGE_SUMMARY_CONTRACT_VERSION,
  QUERY_OPERATIONS,
  QUERY_SPEC_CONTRACT_VERSION,
  RUN_EVIDENCE_SUMMARY_CONTRACT_VERSION,
  RUN_EVIDENCE_SUMMARY_FIELDS,
  SCENARIO_EVIDENCE_CONTRACT_VERSION,
  SCENARIO_EVIDENCE_FIELDS,
  SPECS,
  TEST_DATABASE_GATE_CONTRACT_VERSION,
  ZERO_HASH,
  buildFutureEvidenceSpec,
  buildIntrospectionSpec,
  buildMigrationSpec,
  buildPackageSummary,
  buildQueryOperation,
  buildQuerySpec,
  buildTestDatabaseGate,
  buildUpstreamArtifacts,
  buildValidPostgresqlTestPackage,
  evaluateMetricsCutoverPostgresqlTestPackage,
  safeResult,
  sealContract,
  validateFutureEvidenceSpec,
  validateIntrospectionSpec,
  validateMigrationSpec,
  validatePackageSummary,
  validateQuerySpec,
  validateTestDatabaseGate,
  validateUpstreamArtifacts,
};
