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
const PACKAGE_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-postgresql-package-summary-v1-step114-2x-e";

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
  summaryId: "FINPLE_STEP114_2X_E_SUMMARY_ID\0",
  summaryHash: "FINPLE_STEP114_2X_E_SUMMARY_HASH\0",
});

const MIGRATION_FIELDS = Object.freeze([
  "contractVersion", "migrationSpecId", "upstreamPreflightSummaryHash",
  "upstreamDecisionHash", "upstreamSchemaPlanHash", "logicalResources",
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
  "contractVersion", "querySpecId", "upstreamPreflightSummaryHash",
  "upstreamTransactionPlanHash", "claimStoreProtocolHash",
  "repositoryLockProtocolHash", "operationOrder", "operations", "callableMethods",
  "executableSqlIncluded", "structuredManifestOnly", "querySpecHash",
]);
const OPERATION_FIELDS = Object.freeze([
  "operation", "parameters", "transactionBoundary", "affectedRows",
  "resultCategories", "stateVersionHashPredicates", "immutableBindingPredicates",
  "durableCommitAcknowledgement", "ambiguousOutcomePolicy",
  "retryClassification", "querySpecHash",
]);
const INTROSPECTION_FIELDS = Object.freeze([
  "contractVersion", "introspectionSpecId", "migrationSpecId",
  "migrationSpecHash", "upstreamSchemaPlanHash", "schemaPackageEvidence",
  "resourceEvidence", "runtimeDeniedPrivileges", "runtimeSchemaOwner",
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
  "exactScenarioCount", "evidenceProduced", "executionOccurred",
  "databaseConnected", "futureEvidenceOnly", "rawMaterialAllowed",
  "futureEvidenceSpecHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "packageSummaryId", "upstreamPreparationSummaryHash",
  "upstreamClaimStoreProtocolHash", "upstreamRepositoryLockProtocolHash",
  "upstreamPreflightSummaryHash", "migrationSpecId", "migrationSpecHash",
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
    upstreamPreflightSummaryHash: upstream.preflightSummary.summaryHash,
    upstreamDecisionHash: upstream.persistenceDecision.decisionHash,
    upstreamSchemaPlanHash: upstream.schemaPlan.schemaPlanHash,
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
    parameters: ["receiptIdentityHash", "receiptBindingHash", "claimId", "createdAt", "recordHash"],
    transactionBoundary: "single_atomic_insert_unique_conflict_transaction",
    affectedRows: "exactly_one_winner_or_zero_conflict",
    resultCategories: ["claim_acquired", "already_claimed_read_only"],
    stateVersionHashPredicates: ["initial_state_claim_in_progress", "version_one", "record_hash_exact"],
    immutableBindingPredicates: ["receipt_identity_hash", "receipt_binding_hash", "claim_id", "created_at"],
  },
  readClaim: {
    parameters: ["receiptIdentityHash"], transactionBoundary: "strong_read_after_write_read_only",
    affectedRows: "zero_or_one_read_only", resultCategories: ["claim_found", "claim_not_found"],
    stateVersionHashPredicates: ["record_hash_returned_for_validation"],
    immutableBindingPredicates: ["receipt_identity_hash"],
  },
  transitionClaimTerminal: {
    parameters: ["receiptIdentityHash", "expectedState", "expectedVersion", "expectedRecordHash", "terminalState", "terminalAt", "terminalEvidenceHash", "nextRecordHash"],
    transactionBoundary: "single_conditional_terminal_update_transaction",
    affectedRows: "exactly_one_or_zero_stale_conflict_replay",
    resultCategories: ["terminal_transition_persisted", "stale_conflict_or_replay"],
    stateVersionHashPredicates: ["state_claim_in_progress", "expected_version", "expected_record_hash", "approved_terminal_state"],
    immutableBindingPredicates: ["receipt_identity_hash", "receipt_binding_hash", "claim_id", "created_at"],
  },
  acquireLock: {
    parameters: ["repositoryIdentityHash", "headHash", "treeHash", "branchHash", "trackedPathsHash", "receiptIdentityHash", "receiptBindingHash", "ownerLivenessHash", "lockId", "acquiredAt", "recordHash"],
    transactionBoundary: "single_atomic_insert_unique_repository_transaction",
    affectedRows: "exactly_one_winner_or_zero_conflict",
    resultCategories: ["lock_acquired", "existing_lock_manual_review"],
    stateVersionHashPredicates: ["initial_state_lock_held", "version_one", "record_hash_exact"],
    immutableBindingPredicates: ["repository_identity_hash", "head_hash", "tree_hash", "branch_hash", "tracked_paths_hash", "receipt_identity_hash", "receipt_binding_hash", "owner_liveness_hash", "lock_id", "acquired_at"],
  },
  readLock: {
    parameters: ["repositoryIdentityHash"], transactionBoundary: "strong_read_after_write_read_only",
    affectedRows: "zero_or_one_read_only", resultCategories: ["lock_found", "lock_not_found"],
    stateVersionHashPredicates: ["record_hash_returned_for_validation"],
    immutableBindingPredicates: ["repository_identity_hash"],
  },
  releaseLock: {
    parameters: ["repositoryIdentityHash", "expectedState", "expectedVersion", "expectedLockHash", "receiptIdentityHash", "receiptBindingHash", "terminalClaimHash", "terminalClaimAt", "releasedAt", "nextLockHash"],
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
  value.querySpecHash = hashWithDomain(DOMAINS.operationHash, value);
  return value;
}

function buildQuerySpec(upstream) {
  return sealContract({
    contractVersion: QUERY_SPEC_CONTRACT_VERSION,
    upstreamPreflightSummaryHash: upstream.preflightSummary.summaryHash,
    upstreamTransactionPlanHash: upstream.transactionPlan.transactionPlanHash,
    claimStoreProtocolHash: upstream.claimStoreProtocol.protocolHash,
    repositoryLockProtocolHash: upstream.repositoryLockProtocol.protocolHash,
    operationOrder: [...QUERY_OPERATIONS],
    operations: QUERY_OPERATIONS.map(buildQueryOperation),
    callableMethods: [], executableSqlIncluded: false, structuredManifestOnly: true,
  }, SPECS.query);
}

function buildIntrospectionSpec(upstream, migrationSpec) {
  return sealContract({
    contractVersion: INTROSPECTION_SPEC_CONTRACT_VERSION,
    migrationSpecId: migrationSpec.migrationSpecId,
    migrationSpecHash: migrationSpec.migrationSpecHash,
    upstreamSchemaPlanHash: upstream.schemaPlan.schemaPlanHash,
    schemaPackageEvidence: ["schema_package_version", "schema_package_hash"],
    resourceEvidence: [claimDefinition(), lockDefinition()],
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

function packageBindings(upstream, migrationSpec, querySpec, introspectionSpec = null) {
  return {
    upstreamPreflightSummaryHash: upstream.preflightSummary.summaryHash,
    migrationSpecHash: migrationSpec.migrationSpecHash,
    querySpecHash: querySpec.querySpecHash,
    introspectionSpecHash: introspectionSpec?.introspectionSpecHash || "0".repeat(64),
  };
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

function buildFutureEvidenceSpec(upstream, migrationSpec, querySpec, introspectionSpec) {
  return sealContract({
    contractVersion: FUTURE_EVIDENCE_SPEC_CONTRACT_VERSION,
    packageBindings: packageBindings(upstream, migrationSpec, querySpec, introspectionSpec),
    scenarioClasses: [...FUTURE_SCENARIOS], exactScenarioCount: FUTURE_SCENARIOS.length,
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
  if (value.upstreamPreflightSummaryHash !== upstream?.preflightSummary?.summaryHash ||
      value.upstreamDecisionHash !== upstream?.persistenceDecision?.decisionHash ||
      value.upstreamSchemaPlanHash !== upstream?.schemaPlan?.schemaPlanHash) issues.push("migration_upstream_binding_mismatch");
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

function validateQueryOperation(value, operation) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, OPERATION_FIELDS)) return [`query_operation_fields_invalid:${operation}`];
  const expected = buildQueryOperation(operation);
  for (const field of OPERATION_FIELDS) {
    if (field === "querySpecHash") continue;
    if (Array.isArray(expected[field])) {
      if (!exactArray(value[field], expected[field])) issues.push(`query_operation_${field}_invalid:${operation}`);
    } else if (value[field] !== expected[field]) issues.push(`query_operation_${field}_invalid:${operation}`);
  }
  if (!isSha256(value.querySpecHash) || value.querySpecHash !== hashWithDomain(DOMAINS.operationHash, without(value, "querySpecHash"))) issues.push(`query_operation_hash_mismatch:${operation}`);
  return issues;
}

function validateQuerySpec(value, upstream) {
  const issues = validateEnvelope(value, SPECS.query, "query_spec");
  if (!isRecord(value)) return issues;
  if (value.upstreamPreflightSummaryHash !== upstream?.preflightSummary?.summaryHash ||
      value.upstreamTransactionPlanHash !== upstream?.transactionPlan?.transactionPlanHash ||
      value.claimStoreProtocolHash !== upstream?.claimStoreProtocol?.protocolHash ||
      value.repositoryLockProtocolHash !== upstream?.repositoryLockProtocol?.protocolHash) issues.push("query_upstream_binding_mismatch");
  if (!exactArray(value.operationOrder, QUERY_OPERATIONS)) issues.push("query_operation_order_invalid");
  if (!Array.isArray(value.operations) || value.operations.length !== QUERY_OPERATIONS.length) issues.push("query_operations_invalid");
  else value.operations.forEach((operation, index) => issues.push(...validateQueryOperation(operation, QUERY_OPERATIONS[index])));
  if (!exactArray(value.callableMethods, []) || value.executableSqlIncluded !== false || value.structuredManifestOnly !== true) issues.push("query_inert_boundary_invalid");
  return uniqueSorted(issues);
}

function validateIntrospectionSpec(value, upstream, migrationSpec) {
  const issues = validateEnvelope(value, SPECS.introspection, "introspection_spec");
  if (!isRecord(value)) return issues;
  if (value.migrationSpecId !== migrationSpec?.migrationSpecId || value.migrationSpecHash !== migrationSpec?.migrationSpecHash || value.upstreamSchemaPlanHash !== upstream?.schemaPlan?.schemaPlanHash) issues.push("introspection_binding_mismatch");
  if (!exactArray(value.schemaPackageEvidence, ["schema_package_version", "schema_package_hash"])) issues.push("introspection_package_evidence_invalid");
  if (!Array.isArray(value.resourceEvidence) || value.resourceEvidence.length !== 2) issues.push("introspection_resources_invalid");
  else {
    issues.push(...validateResourceDefinition(value.resourceEvidence[0], claimDefinition(), "introspection_claim"));
    issues.push(...validateResourceDefinition(value.resourceEvidence[1], lockDefinition(), "introspection_lock"));
  }
  if (!exactArray(value.runtimeDeniedPrivileges, ["ALTER", "DELETE", "DROP", "TRUNCATE", "SCHEMA_OWNER", "SUPERUSER"])) issues.push("introspection_runtime_privileges_invalid");
  for (const field of ["runtimeSchemaOwner", "runtimeSuperuser", "catalogQueryExecutionAllowed"]) if (value[field] !== false) issues.push(`introspection_forbidden_state:${field}`);
  for (const field of ["migrationRuntimeRolesDistinct", "utcTimezoneRequired", "backupRestoreCapabilityDeclarationRequired", "deleteResetReuseAbsent", "ttlEvictionAbsent", "advisoryLockOnlyAbsent", "expectedEvidenceOnly"]) if (value[field] !== true) issues.push(`introspection_required_evidence_missing:${field}`);
  if (value.transactionIsolationRequirement !== "serializable_or_equivalent_single_winner") issues.push("introspection_isolation_invalid");
  return uniqueSorted(issues);
}

function validateBindings(value, upstream, migrationSpec, querySpec, introspectionSpec) {
  return isRecord(value) && hasExactKeys(value, ["upstreamPreflightSummaryHash", "migrationSpecHash", "querySpecHash", "introspectionSpecHash"]) &&
    value.upstreamPreflightSummaryHash === upstream?.preflightSummary?.summaryHash &&
    value.migrationSpecHash === migrationSpec?.migrationSpecHash &&
    value.querySpecHash === querySpec?.querySpecHash &&
    value.introspectionSpecHash === introspectionSpec?.introspectionSpecHash;
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

function validateFutureEvidenceSpec(value, upstream, migrationSpec, querySpec, introspectionSpec) {
  const issues = validateEnvelope(value, SPECS.evidence, "future_evidence_spec");
  if (!isRecord(value)) return issues;
  if (!validateBindings(value.packageBindings, upstream, migrationSpec, querySpec, introspectionSpec)) issues.push("future_evidence_binding_mismatch");
  if (!exactArray(value.scenarioClasses, FUTURE_SCENARIOS) || value.exactScenarioCount !== FUTURE_SCENARIOS.length) issues.push("future_evidence_scenarios_invalid");
  for (const field of ["evidenceProduced", "executionOccurred", "databaseConnected", "rawMaterialAllowed"]) if (value[field] !== false) issues.push(`future_evidence_forbidden_state:${field}`);
  if (value.futureEvidenceOnly !== true) issues.push("future_evidence_boundary_invalid");
  return uniqueSorted(issues);
}

function buildPackageSummary(packet) {
  return sealContract({
    contractVersion: PACKAGE_SUMMARY_CONTRACT_VERSION,
    upstreamPreparationSummaryHash: packet.upstreamArtifacts.preparationSummary.summaryHash,
    upstreamClaimStoreProtocolHash: packet.upstreamArtifacts.claimStoreProtocol.protocolHash,
    upstreamRepositoryLockProtocolHash: packet.upstreamArtifacts.repositoryLockProtocol.protocolHash,
    upstreamPreflightSummaryHash: packet.upstreamArtifacts.preflightSummary.summaryHash,
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
    if (value[field] !== expected[field]) issues.push(`package_summary_binding_invalid:${field}`);
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
    ...validateFutureEvidenceSpec(packet.futureEvidenceSpec, packet.upstreamArtifacts, packet.migrationSpec, packet.querySpec, packet.introspectionSpec),
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
  FUTURE_SCENARIOS,
  INTROSPECTION_SPEC_CONTRACT_VERSION,
  LOGICAL_RESOURCES,
  MIGRATION_OPERATIONS,
  MIGRATION_SPEC_CONTRACT_VERSION,
  PACKAGE_SUMMARY_CONTRACT_VERSION,
  QUERY_OPERATIONS,
  QUERY_SPEC_CONTRACT_VERSION,
  SPECS,
  TEST_DATABASE_GATE_CONTRACT_VERSION,
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
