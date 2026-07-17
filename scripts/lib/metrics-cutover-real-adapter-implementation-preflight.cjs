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
  CLAIM_ADAPTER_METHODS,
  CLAIM_STORE_ADAPTER_PROTOCOL_VERSION,
  REPOSITORY_LOCK_ADAPTER_METHODS,
  REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION,
} = require("./metrics-cutover-adapter-conformance.cjs");

const PERSISTENCE_DECISION_CONTRACT_VERSION =
  "metrics-cutover-production-persistence-decision-v1-step114-2x-d";
const POSTGRESQL_SCHEMA_PLAN_CONTRACT_VERSION =
  "metrics-cutover-postgresql-schema-plan-v1-step114-2x-d";
const TRANSACTION_SEMANTICS_PLAN_CONTRACT_VERSION =
  "metrics-cutover-transaction-semantics-plan-v1-step114-2x-d";
const CREDENTIAL_BOUNDARY_PLAN_CONTRACT_VERSION =
  "metrics-cutover-credential-boundary-plan-v1-step114-2x-d";
const MIGRATION_RUNBOOK_CONTRACT_VERSION =
  "metrics-cutover-migration-runbook-v1-step114-2x-d";
const PREFLIGHT_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-real-adapter-implementation-preflight-summary-v1-step114-2x-d";

const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized", "fileWriteAuthorized", "productionClaimEligible",
  "realProviderAdapterValidated", "realRepositoryLockValidated",
  "providerConnectionAuthorized", "schemaMutationAuthorized",
  "migrationAuthorized", "credentialUseAuthorized", "commitAuthorized",
  "pushAuthorized", "mergeAuthorized", "deploymentAuthorized",
  "productionPublicationAuthorized", "appExportActivated",
  "pointerMutationExecuted", "rollbackExecuted", "loaderActivated",
]);

const CANDIDATE_CLASSES = Object.freeze([
  "dedicated_postgresql_transactional_store",
  "distributed_strongly_consistent_kv",
  "transactional_object_store",
  "redis_like_ephemeral_store",
  "local_filesystem",
]);
const CLAIM_STATES = Object.freeze([
  "claim_in_progress", "consumed_success", "consumed_failed_manual_review",
]);
const LOCK_STATES = Object.freeze(["lock_held", "lock_released"]);
const RUNBOOK_STEPS = Object.freeze([
  "human_approve_provider_class_and_isolation_topology",
  "independent_logical_schema_and_constraint_review",
  "separately_authorized_operator_creates_dedicated_role_and_schema",
  "apply_migration_to_nonproduction_test_database",
  "introspect_schema_and_verify_constraints",
  "run_concurrency_conformance_on_test_owned_database",
  "rehearse_backup_and_restoration",
  "obtain_separate_production_migration_approval",
  "execute_production_migration_under_separate_authority",
  "perform_post_migration_read_only_verification",
  "handoff_runtime_credential_and_verify_revocation",
  "confirm_no_cutover_execution_during_migration",
]);
const MANUAL_REVIEW_CASES = Object.freeze([
  "ambiguous_migration_completion", "partial_schema_creation",
  "missing_constraint_or_index", "unexpected_preexisting_object",
  "role_privilege_drift", "clock_or_timezone_mismatch",
  "backup_or_restore_failure", "provider_failover_or_replication_lag",
  "transaction_commit_ambiguity", "schema_version_drift",
]);
const CANDIDATE_FIELDS = Object.freeze([
  "candidateClass", "preferred", "accepted", "atomicCreateIfAbsent",
  "conditionalStateVersionHashUpdate", "durableCommitAcknowledgement",
  "strongReadAfterWrite", "immutableTerminalAudit",
  "tableBackedLockSurvivesSessionLoss", "ttlOrEvictionRisk",
  "deleteToRetryPath", "advisoryLockOnly", "dedicatedLeastPrivilegeBoundary",
  "backupAndMigrationCapability", "rejectionReasons",
]);
const CLAIM_RESOURCE_FIELDS = Object.freeze([
  "logicalName", "immutableIdentity", "bindingFields", "states",
  "versionStartsAt", "versionIncreases", "createdAtImmutableUtc",
  "terminalAtNullableUtc", "terminalEvidenceImmutable", "canonicalRecordHash",
  "uniqueConstraints", "conditionalTerminalFields", "terminalUpdateAllowed",
  "deleteAllowed", "resetAllowed", "releaseAllowed", "reuseAllowed",
]);
const LOCK_RESOURCE_FIELDS = Object.freeze([
  "logicalName", "immutableIdentity", "repositoryBindingFields",
  "receiptBindingFields", "ownerLivenessHash", "states", "versionStartsAt",
  "versionIncreases", "acquiredAtImmutableUtc", "releasedAtNullableUtc",
  "terminalClaimEvidenceRequired", "canonicalRecordHash", "uniqueConstraints",
  "conditionalReleaseFields", "reacquireReleasedBindingAllowed",
  "stealingAllowed", "deleteAllowed", "resetAllowed", "overwriteAllowed",
  "automaticStaleRecoveryAllowed",
]);
const CLAIM_SEMANTICS_FIELDS = Object.freeze([
  "acquireClaim", "readClaim", "transitionClaimTerminal", "zeroRowUpdate",
  "successAfter",
]);
const LOCK_SEMANTICS_FIELDS = Object.freeze([
  "acquireLock", "readLock", "releaseLock", "staleLock", "repeatedRelease",
  "successAfter",
]);

const DOMAINS = Object.freeze({
  decisionId: "FINPLE_STEP114_2X_D_DECISION_ID\0",
  decisionHash: "FINPLE_STEP114_2X_D_DECISION_HASH\0",
  schemaId: "FINPLE_STEP114_2X_D_SCHEMA_ID\0",
  schemaHash: "FINPLE_STEP114_2X_D_SCHEMA_HASH\0",
  transactionId: "FINPLE_STEP114_2X_D_TRANSACTION_ID\0",
  transactionHash: "FINPLE_STEP114_2X_D_TRANSACTION_HASH\0",
  credentialId: "FINPLE_STEP114_2X_D_CREDENTIAL_ID\0",
  credentialHash: "FINPLE_STEP114_2X_D_CREDENTIAL_HASH\0",
  runbookId: "FINPLE_STEP114_2X_D_RUNBOOK_ID\0",
  runbookHash: "FINPLE_STEP114_2X_D_RUNBOOK_HASH\0",
  summaryId: "FINPLE_STEP114_2X_D_SUMMARY_ID\0",
  summaryHash: "FINPLE_STEP114_2X_D_SUMMARY_HASH\0",
});

const SPECS = Object.freeze({
  decision: {
    version: PERSISTENCE_DECISION_CONTRACT_VERSION, idField: "decisionId",
    hashField: "decisionHash", prefix: "metrics-cutover-production-persistence-decision",
    idDomain: DOMAINS.decisionId, hashDomain: DOMAINS.decisionHash,
    fields: ["contractVersion", "decisionId", "candidateClasses", "candidates",
      "preferredCandidate", "candidateSelected", "designDecisionOnly",
      "claimAdapterProtocolVersion", "repositoryLockAdapterProtocolVersion",
      "decisionHash"],
  },
  schema: {
    version: POSTGRESQL_SCHEMA_PLAN_CONTRACT_VERSION, idField: "schemaPlanId",
    hashField: "schemaPlanHash", prefix: "metrics-cutover-postgresql-schema-plan",
    idDomain: DOMAINS.schemaId, hashDomain: DOMAINS.schemaHash,
    fields: ["contractVersion", "schemaPlanId", "decisionId", "decisionHash",
      "resources", "logicalNamesOnly", "executableSqlIncluded",
      "deployedObjectNamesIncluded", "schemaPlanHash"],
  },
  transaction: {
    version: TRANSACTION_SEMANTICS_PLAN_CONTRACT_VERSION, idField: "transactionPlanId",
    hashField: "transactionPlanHash", prefix: "metrics-cutover-transaction-semantics-plan",
    idDomain: DOMAINS.transactionId, hashDomain: DOMAINS.transactionHash,
    fields: ["contractVersion", "transactionPlanId", "decisionId", "decisionHash",
      "schemaPlanId", "schemaPlanHash", "claimAdapterProtocolVersion",
      "repositoryLockAdapterProtocolVersion", "claimMethods", "lockMethods",
      "claimSemantics", "lockSemantics", "isolationExpectation",
      "retryBeforeMutationOnly", "ambiguousPostCommitPolicy",
      "serializationOrDeadlockPolicy", "advisoryLockOnly",
      "deleteAndRetryAllowed", "lockStealingAllowed", "transactionPlanHash"],
  },
  credential: {
    version: CREDENTIAL_BOUNDARY_PLAN_CONTRACT_VERSION, idField: "credentialPlanId",
    hashField: "credentialPlanHash", prefix: "metrics-cutover-credential-boundary-plan",
    idDomain: DOMAINS.credentialId, hashDomain: DOMAINS.credentialHash,
    fields: ["contractVersion", "credentialPlanId", "decisionId", "decisionHash",
      "schemaPlanId", "schemaPlanHash", "runtimeCredentialCategory",
      "migrationCredentialCategory", "credentialsSeparated", "runtimeAccessResources",
      "runtimeDeniedPrivileges", "runtimeUnrelatedResourceAccess",
      "runtimeSchemaOwner", "runtimeSuperuser", "existingCredentialFallbackAllowed",
      "credentialInputChannels", "laterSeparateSecretInjectionRequired",
      "rotationAndRevocationRequired", "credentialPlanHash"],
  },
  runbook: {
    version: MIGRATION_RUNBOOK_CONTRACT_VERSION, idField: "runbookId",
    hashField: "runbookHash", prefix: "metrics-cutover-migration-runbook",
    idDomain: DOMAINS.runbookId, hashDomain: DOMAINS.runbookHash,
    fields: ["contractVersion", "runbookId", "decisionId", "decisionHash",
      "schemaPlanId", "schemaPlanHash", "transactionPlanId", "transactionPlanHash",
      "credentialPlanId", "credentialPlanHash", "steps", "manualReviewCases",
      "automaticRollbackAllowed", "destructiveCleanupAllowed", "dropAllowed",
      "truncateAllowed", "deleteAllowed", "resetAllowed", "forcedContinuationAllowed",
      "cutoverExecutionAllowed", "executableCommandsIncluded", "runbookHash"],
  },
  summary: {
    version: PREFLIGHT_SUMMARY_CONTRACT_VERSION, idField: "preflightId",
    hashField: "summaryHash", prefix: "metrics-cutover-real-adapter-implementation-preflight",
    idDomain: DOMAINS.summaryId, hashDomain: DOMAINS.summaryHash,
    fields: ["contractVersion", "preflightId", "decisionId", "decisionHash",
      "schemaPlanId", "schemaPlanHash", "transactionPlanId", "transactionPlanHash",
      "credentialPlanId", "credentialPlanHash", "runbookId", "runbookHash",
      "preferredCandidate", "candidateSelected", "step114_2x_cCompatible",
      "syntheticConformanceIsRealProviderValidation", ...FIXED_FALSE_FIELDS, "summaryHash"],
  },
});

function without(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
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
  if (!isSafeIdentity(value[spec.idField]) || !value[spec.idField].startsWith(`${spec.prefix}-`)) {
    issues.push(`${label}_id_invalid`);
  }
  if (!isSha256(value[spec.hashField])) issues.push(`${label}_hash_invalid`);
  try {
    const copy = structuredClone(value);
    delete copy[spec.idField];
    delete copy[spec.hashField];
    const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, copy)}`;
    if (value[spec.idField] !== expectedId) issues.push(`${label}_id_mismatch`);
    if (value[spec.hashField] !== hashWithDomain(spec.hashDomain, without(value, spec.hashField))) {
      issues.push(`${label}_hash_mismatch`);
    }
  } catch {
    issues.push(`${label}_canonicalization_failed`);
  }
  return issues;
}

function exactArray(value, expected) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry, index) => entry === expected[index]);
}

function buildCandidate(candidateClass, preferred, rejectionReasons = []) {
  const postgres = candidateClass === "dedicated_postgresql_transactional_store";
  return {
    candidateClass, preferred, accepted: postgres,
    atomicCreateIfAbsent: postgres,
    conditionalStateVersionHashUpdate: postgres,
    durableCommitAcknowledgement: postgres,
    strongReadAfterWrite: postgres,
    immutableTerminalAudit: postgres,
    tableBackedLockSurvivesSessionLoss: postgres,
    ttlOrEvictionRisk: candidateClass === "redis_like_ephemeral_store",
    deleteToRetryPath: false,
    advisoryLockOnly: false,
    dedicatedLeastPrivilegeBoundary: postgres,
    backupAndMigrationCapability: postgres,
    rejectionReasons,
  };
}

function buildPersistenceDecision() {
  return sealContract({
    contractVersion: PERSISTENCE_DECISION_CONTRACT_VERSION,
    candidateClasses: [...CANDIDATE_CLASSES],
    candidates: [
      buildCandidate(CANDIDATE_CLASSES[0], true),
      buildCandidate(CANDIDATE_CLASSES[1], false, ["implementation_evidence_not_supplied"]),
      buildCandidate(CANDIDATE_CLASSES[2], false, ["atomic_cross_resource_transaction_not_proven"]),
      buildCandidate(CANDIDATE_CLASSES[3], false, ["ttl_eviction_or_async_durability_risk"]),
      buildCandidate(CANDIDATE_CLASSES[4], false, ["not_production_durable_or_distributed"]),
    ],
    preferredCandidate: CANDIDATE_CLASSES[0],
    candidateSelected: true,
    designDecisionOnly: true,
    claimAdapterProtocolVersion: CLAIM_STORE_ADAPTER_PROTOCOL_VERSION,
    repositoryLockAdapterProtocolVersion: REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION,
  }, SPECS.decision);
}

function claimResource() {
  return {
    logicalName: "claim_record", immutableIdentity: true,
    bindingFields: ["receipt_identity_hash", "receipt_binding_hash"],
    states: [...CLAIM_STATES], versionStartsAt: 1, versionIncreases: true,
    createdAtImmutableUtc: true, terminalAtNullableUtc: true,
    terminalEvidenceImmutable: true, canonicalRecordHash: true,
    uniqueConstraints: ["receipt_identity_hash"],
    conditionalTerminalFields: ["receipt_identity_hash", "state", "version", "record_hash"],
    terminalUpdateAllowed: false, deleteAllowed: false, resetAllowed: false,
    releaseAllowed: false, reuseAllowed: false,
  };
}

function lockResource() {
  return {
    logicalName: "repository_lock_record", immutableIdentity: true,
    repositoryBindingFields: ["repository_identity_hash", "head_sha", "tree_sha", "branch_hash", "tracked_paths_hash"],
    receiptBindingFields: ["receipt_identity_hash", "receipt_binding_hash"],
    ownerLivenessHash: true, states: [...LOCK_STATES], versionStartsAt: 1,
    versionIncreases: true, acquiredAtImmutableUtc: true, releasedAtNullableUtc: true,
    terminalClaimEvidenceRequired: true, canonicalRecordHash: true,
    uniqueConstraints: ["repository_identity_hash"],
    conditionalReleaseFields: ["repository_identity_hash", "state", "version", "record_hash", "receipt_identity_hash", "receipt_binding_hash", "terminal_claim_hash"],
    reacquireReleasedBindingAllowed: false, stealingAllowed: false,
    deleteAllowed: false, resetAllowed: false, overwriteAllowed: false,
    automaticStaleRecoveryAllowed: false,
  };
}

function buildSchemaPlan(decision) {
  return sealContract({
    contractVersion: POSTGRESQL_SCHEMA_PLAN_CONTRACT_VERSION,
    decisionId: decision.decisionId, decisionHash: decision.decisionHash,
    resources: [claimResource(), lockResource()], logicalNamesOnly: true,
    executableSqlIncluded: false, deployedObjectNamesIncluded: false,
  }, SPECS.schema);
}

function buildTransactionPlan(decision, schema) {
  return sealContract({
    contractVersion: TRANSACTION_SEMANTICS_PLAN_CONTRACT_VERSION,
    decisionId: decision.decisionId, decisionHash: decision.decisionHash,
    schemaPlanId: schema.schemaPlanId, schemaPlanHash: schema.schemaPlanHash,
    claimAdapterProtocolVersion: CLAIM_STORE_ADAPTER_PROTOCOL_VERSION,
    repositoryLockAdapterProtocolVersion: REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION,
    claimMethods: [...CLAIM_ADAPTER_METHODS], lockMethods: [...REPOSITORY_LOCK_ADAPTER_METHODS],
    claimSemantics: {
      acquireClaim: "single_transaction_atomic_insert_unique_conflict_no_mutation",
      readClaim: "strong_read_after_write_exact_record",
      transitionClaimTerminal: "single_conditional_update_identity_state_version_hash_single_winner",
      zeroRowUpdate: "stale_conflict_or_replay_fail_closed",
      successAfter: "durable_commit_acknowledgement",
    },
    lockSemantics: {
      acquireLock: "atomic_insert_unique_repository_identity_no_transfer",
      readLock: "strong_read_after_write_exact_record",
      releaseLock: "conditional_update_held_version_hash_receipt_binding_terminal_claim",
      staleLock: "manual_review_only",
      repeatedRelease: "read_only_non_mutating",
      successAfter: "durable_commit_acknowledgement",
    },
    isolationExpectation: "serializable_or_equivalent_single_winner_semantics",
    retryBeforeMutationOnly: true,
    ambiguousPostCommitPolicy: "manual_review_no_automatic_retry",
    serializationOrDeadlockPolicy: "retry_only_when_provider_proves_no_commit_and_no_mutation",
    advisoryLockOnly: false, deleteAndRetryAllowed: false, lockStealingAllowed: false,
  }, SPECS.transaction);
}

function buildCredentialPlan(decision, schema) {
  return sealContract({
    contractVersion: CREDENTIAL_BOUNDARY_PLAN_CONTRACT_VERSION,
    decisionId: decision.decisionId, decisionHash: decision.decisionHash,
    schemaPlanId: schema.schemaPlanId, schemaPlanHash: schema.schemaPlanHash,
    runtimeCredentialCategory: "dedicated_cutover_runtime_least_privilege_category",
    migrationCredentialCategory: "separate_operator_migration_category",
    credentialsSeparated: true,
    runtimeAccessResources: ["claim_record", "repository_lock_record"],
    runtimeDeniedPrivileges: ["ALTER", "DELETE", "DROP", "TRUNCATE"],
    runtimeUnrelatedResourceAccess: false, runtimeSchemaOwner: false,
    runtimeSuperuser: false, existingCredentialFallbackAllowed: false,
    credentialInputChannels: ["later_separately_authorized_secret_injection_only"],
    laterSeparateSecretInjectionRequired: true, rotationAndRevocationRequired: true,
  }, SPECS.credential);
}

function buildMigrationRunbook(decision, schema, transaction, credential) {
  return sealContract({
    contractVersion: MIGRATION_RUNBOOK_CONTRACT_VERSION,
    decisionId: decision.decisionId, decisionHash: decision.decisionHash,
    schemaPlanId: schema.schemaPlanId, schemaPlanHash: schema.schemaPlanHash,
    transactionPlanId: transaction.transactionPlanId,
    transactionPlanHash: transaction.transactionPlanHash,
    credentialPlanId: credential.credentialPlanId,
    credentialPlanHash: credential.credentialPlanHash,
    steps: [...RUNBOOK_STEPS], manualReviewCases: [...MANUAL_REVIEW_CASES],
    automaticRollbackAllowed: false, destructiveCleanupAllowed: false,
    dropAllowed: false, truncateAllowed: false, deleteAllowed: false,
    resetAllowed: false, forcedContinuationAllowed: false,
    cutoverExecutionAllowed: false, executableCommandsIncluded: false,
  }, SPECS.runbook);
}

function buildValidPreflightPacket() {
  const persistenceDecision = buildPersistenceDecision();
  const schemaPlan = buildSchemaPlan(persistenceDecision);
  const transactionPlan = buildTransactionPlan(persistenceDecision, schemaPlan);
  const credentialPlan = buildCredentialPlan(persistenceDecision, schemaPlan);
  const migrationRunbook = buildMigrationRunbook(
    persistenceDecision, schemaPlan, transactionPlan, credentialPlan,
  );
  return { persistenceDecision, schemaPlan, transactionPlan, credentialPlan, migrationRunbook };
}

function validateDecision(value) {
  const issues = validateEnvelope(value, SPECS.decision, "persistence_decision");
  if (!isRecord(value)) return issues;
  if (!exactArray(value.candidateClasses, CANDIDATE_CLASSES)) issues.push("persistence_candidate_classes_invalid");
  if (!Array.isArray(value.candidates) || value.candidates.length !== CANDIDATE_CLASSES.length) {
    issues.push("persistence_candidate_comparison_invalid");
  } else {
    const preferred = value.candidates.filter((candidate) => candidate?.preferred === true);
    if (preferred.length !== 1) issues.push("persistence_preferred_candidate_count_invalid");
    value.candidates.forEach((candidate, index) => {
      if (!hasExactKeys(candidate, CANDIDATE_FIELDS) ||
          candidate.candidateClass !== CANDIDATE_CLASSES[index]) {
        issues.push("persistence_candidate_fields_or_order_invalid");
      }
    });
    const postgres = value.candidates[0];
    if (postgres?.candidateClass !== CANDIDATE_CLASSES[0] || postgres?.accepted !== true ||
        postgres?.advisoryLockOnly !== false || postgres?.tableBackedLockSurvivesSessionLoss !== true ||
        postgres?.atomicCreateIfAbsent !== true || postgres?.conditionalStateVersionHashUpdate !== true ||
        postgres?.durableCommitAcknowledgement !== true || postgres?.strongReadAfterWrite !== true ||
        postgres?.immutableTerminalAudit !== true || postgres?.ttlOrEvictionRisk !== false ||
        postgres?.deleteToRetryPath !== false || postgres?.dedicatedLeastPrivilegeBoundary !== true) {
      issues.push("postgresql_candidate_capabilities_invalid");
    }
    for (const candidateClass of CANDIDATE_CLASSES.slice(1)) {
      const candidate = value.candidates.find((entry) => entry?.candidateClass === candidateClass);
      if (!candidate || candidate.accepted !== false || !Array.isArray(candidate.rejectionReasons) || candidate.rejectionReasons.length === 0) {
        issues.push(`persistence_candidate_rejection_missing:${candidateClass}`);
      }
    }
    const redis = value.candidates.find((entry) => entry?.candidateClass === CANDIDATE_CLASSES[3]);
    if (redis?.ttlOrEvictionRisk !== true) issues.push("redis_like_risk_not_rejected");
  }
  if (value.preferredCandidate !== CANDIDATE_CLASSES[0] || value.candidateSelected !== true || value.designDecisionOnly !== true) {
    issues.push("persistence_decision_selection_invalid");
  }
  if (value.claimAdapterProtocolVersion !== CLAIM_STORE_ADAPTER_PROTOCOL_VERSION ||
      value.repositoryLockAdapterProtocolVersion !== REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION) {
    issues.push("step114_2x_c_protocol_version_mismatch");
  }
  return uniqueSorted(issues);
}

function validateSchema(value, decision) {
  const issues = validateEnvelope(value, SPECS.schema, "schema_plan");
  if (!isRecord(value)) return issues;
  if (value.decisionId !== decision?.decisionId || value.decisionHash !== decision?.decisionHash) issues.push("schema_decision_binding_mismatch");
  if (value.logicalNamesOnly !== true || value.executableSqlIncluded !== false || value.deployedObjectNamesIncluded !== false) issues.push("schema_plan_boundary_invalid");
  if (!Array.isArray(value.resources) || value.resources.length !== 2) return uniqueSorted([...issues, "schema_resources_invalid"]);
  const [claim, lock] = value.resources;
  if (!hasExactKeys(claim, CLAIM_RESOURCE_FIELDS) || claim?.logicalName !== "claim_record" || claim?.immutableIdentity !== true ||
      !exactArray(claim?.bindingFields, ["receipt_identity_hash", "receipt_binding_hash"]) ||
      !exactArray(claim?.states, CLAIM_STATES) || claim?.versionStartsAt !== 1 ||
      claim?.versionIncreases !== true || claim?.createdAtImmutableUtc !== true ||
      claim?.terminalAtNullableUtc !== true || claim?.terminalEvidenceImmutable !== true || claim?.canonicalRecordHash !== true ||
      !claim?.uniqueConstraints?.includes("receipt_identity_hash") ||
      !exactArray(claim?.conditionalTerminalFields, ["receipt_identity_hash", "state", "version", "record_hash"])) {
    issues.push("claim_schema_semantics_invalid");
  }
  for (const field of ["terminalUpdateAllowed", "deleteAllowed", "resetAllowed", "releaseAllowed", "reuseAllowed"]) {
    if (claim?.[field] !== false) issues.push(`claim_schema_forbidden_behavior:${field}`);
  }
  if (!hasExactKeys(lock, LOCK_RESOURCE_FIELDS) || lock?.logicalName !== "repository_lock_record" || lock?.immutableIdentity !== true ||
      !exactArray(lock?.repositoryBindingFields, ["repository_identity_hash", "head_sha", "tree_sha", "branch_hash", "tracked_paths_hash"]) ||
      !exactArray(lock?.receiptBindingFields, ["receipt_identity_hash", "receipt_binding_hash"]) ||
      lock?.ownerLivenessHash !== true ||
      !exactArray(lock?.states, LOCK_STATES) || lock?.versionStartsAt !== 1 ||
      lock?.versionIncreases !== true || lock?.acquiredAtImmutableUtc !== true ||
      lock?.releasedAtNullableUtc !== true ||
      lock?.terminalClaimEvidenceRequired !== true || lock?.canonicalRecordHash !== true ||
      !lock?.uniqueConstraints?.includes("repository_identity_hash") ||
      !exactArray(lock?.conditionalReleaseFields, ["repository_identity_hash", "state", "version", "record_hash", "receipt_identity_hash", "receipt_binding_hash", "terminal_claim_hash"])) {
    issues.push("repository_lock_schema_semantics_invalid");
  }
  for (const field of ["reacquireReleasedBindingAllowed", "stealingAllowed", "deleteAllowed", "resetAllowed", "overwriteAllowed", "automaticStaleRecoveryAllowed"]) {
    if (lock?.[field] !== false) issues.push(`repository_lock_schema_forbidden_behavior:${field}`);
  }
  return uniqueSorted(issues);
}

function validateTransaction(value, decision, schema) {
  const issues = validateEnvelope(value, SPECS.transaction, "transaction_plan");
  if (!isRecord(value)) return issues;
  if (value.decisionId !== decision?.decisionId || value.decisionHash !== decision?.decisionHash ||
      value.schemaPlanId !== schema?.schemaPlanId || value.schemaPlanHash !== schema?.schemaPlanHash) issues.push("transaction_cross_binding_mismatch");
  if (value.claimAdapterProtocolVersion !== CLAIM_STORE_ADAPTER_PROTOCOL_VERSION ||
      value.repositoryLockAdapterProtocolVersion !== REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION ||
      !exactArray(value.claimMethods, CLAIM_ADAPTER_METHODS) || !exactArray(value.lockMethods, REPOSITORY_LOCK_ADAPTER_METHODS)) {
    issues.push("step114_2x_c_method_or_protocol_mismatch");
  }
  if (!hasExactKeys(value.claimSemantics, CLAIM_SEMANTICS_FIELDS) ||
      !hasExactKeys(value.lockSemantics, LOCK_SEMANTICS_FIELDS)) {
    issues.push("transaction_semantics_fields_invalid");
  }
  if (value.claimSemantics?.acquireClaim !== "single_transaction_atomic_insert_unique_conflict_no_mutation") issues.push("claim_atomic_insert_semantics_missing");
  if (value.claimSemantics?.readClaim !== "strong_read_after_write_exact_record") issues.push("claim_strong_read_after_write_missing");
  if (value.claimSemantics?.transitionClaimTerminal !== "single_conditional_update_identity_state_version_hash_single_winner") issues.push("claim_conditional_update_semantics_missing");
  if (value.claimSemantics?.zeroRowUpdate !== "stale_conflict_or_replay_fail_closed") issues.push("claim_zero_row_conflict_policy_invalid");
  if (value.claimSemantics?.successAfter !== "durable_commit_acknowledgement") issues.push("claim_durable_acknowledgement_missing");
  if (value.lockSemantics?.acquireLock !== "atomic_insert_unique_repository_identity_no_transfer" ||
      value.lockSemantics?.readLock !== "strong_read_after_write_exact_record") issues.push("lock_atomic_or_read_semantics_missing");
  if (value.lockSemantics?.releaseLock !== "conditional_update_held_version_hash_receipt_binding_terminal_claim") issues.push("terminal_claim_lock_release_binding_missing");
  if (value.lockSemantics?.staleLock !== "manual_review_only" || value.lockSemantics?.repeatedRelease !== "read_only_non_mutating") issues.push("lock_stale_or_replay_policy_invalid");
  if (value.lockSemantics?.successAfter !== "durable_commit_acknowledgement") issues.push("lock_durable_acknowledgement_missing");
  if (value.isolationExpectation !== "serializable_or_equivalent_single_winner_semantics" ||
      value.serializationOrDeadlockPolicy !== "retry_only_when_provider_proves_no_commit_and_no_mutation") issues.push("transaction_isolation_or_retry_classification_invalid");
  if (value.advisoryLockOnly !== false) issues.push("advisory_lock_only_forbidden");
  if (value.retryBeforeMutationOnly !== true || value.ambiguousPostCommitPolicy !== "manual_review_no_automatic_retry") issues.push("ambiguous_commit_retry_policy_invalid");
  for (const field of ["deleteAndRetryAllowed", "lockStealingAllowed"]) if (value[field] !== false) issues.push(`transaction_forbidden_behavior:${field}`);
  return uniqueSorted(issues);
}

function validateCredential(value, decision, schema) {
  const issues = validateEnvelope(value, SPECS.credential, "credential_plan");
  if (!isRecord(value)) return issues;
  if (value.decisionId !== decision?.decisionId || value.decisionHash !== decision?.decisionHash ||
      value.schemaPlanId !== schema?.schemaPlanId || value.schemaPlanHash !== schema?.schemaPlanHash) issues.push("credential_cross_binding_mismatch");
  if (value.credentialsSeparated !== true || value.runtimeCredentialCategory === value.migrationCredentialCategory) issues.push("runtime_migration_credential_separation_missing");
  if (value.runtimeCredentialCategory !== "dedicated_cutover_runtime_least_privilege_category" ||
      value.migrationCredentialCategory !== "separate_operator_migration_category") issues.push("credential_category_invalid");
  if (!exactArray(value.runtimeAccessResources, ["claim_record", "repository_lock_record"]) || value.runtimeUnrelatedResourceAccess !== false) issues.push("runtime_resource_scope_invalid");
  if (!exactArray(value.runtimeDeniedPrivileges, ["ALTER", "DELETE", "DROP", "TRUNCATE"])) issues.push("runtime_destructive_privilege_denial_missing");
  if (value.runtimeSchemaOwner !== false || value.runtimeSuperuser !== false || value.existingCredentialFallbackAllowed !== false) issues.push("runtime_credential_privilege_boundary_invalid");
  if (!exactArray(value.credentialInputChannels, ["later_separately_authorized_secret_injection_only"]) ||
      value.laterSeparateSecretInjectionRequired !== true || value.rotationAndRevocationRequired !== true) issues.push("credential_injection_or_lifecycle_invalid");
  return uniqueSorted(issues);
}

function validateRunbook(value, packet) {
  const issues = validateEnvelope(value, SPECS.runbook, "migration_runbook");
  if (!isRecord(value)) return issues;
  for (const [idField, hashField, object, objectId, objectHash] of [
    ["decisionId", "decisionHash", packet.persistenceDecision, "decisionId", "decisionHash"],
    ["schemaPlanId", "schemaPlanHash", packet.schemaPlan, "schemaPlanId", "schemaPlanHash"],
    ["transactionPlanId", "transactionPlanHash", packet.transactionPlan, "transactionPlanId", "transactionPlanHash"],
    ["credentialPlanId", "credentialPlanHash", packet.credentialPlan, "credentialPlanId", "credentialPlanHash"],
  ]) if (value[idField] !== object?.[objectId] || value[hashField] !== object?.[objectHash]) issues.push(`migration_runbook_binding_mismatch:${idField}`);
  if (!exactArray(value.steps, RUNBOOK_STEPS)) issues.push("migration_runbook_steps_invalid");
  if (!exactArray(value.manualReviewCases, MANUAL_REVIEW_CASES)) issues.push("migration_manual_review_cases_invalid");
  for (const field of ["automaticRollbackAllowed", "destructiveCleanupAllowed", "dropAllowed", "truncateAllowed", "deleteAllowed", "resetAllowed", "forcedContinuationAllowed", "cutoverExecutionAllowed", "executableCommandsIncluded"]) {
    if (value[field] !== false) issues.push(`migration_runbook_forbidden_instruction:${field}`);
  }
  return uniqueSorted(issues);
}

function buildSummary(packet) {
  const { persistenceDecision: decision, schemaPlan: schema, transactionPlan: transaction,
    credentialPlan: credential, migrationRunbook: runbook } = packet;
  return sealContract({
    contractVersion: PREFLIGHT_SUMMARY_CONTRACT_VERSION,
    decisionId: decision.decisionId, decisionHash: decision.decisionHash,
    schemaPlanId: schema.schemaPlanId, schemaPlanHash: schema.schemaPlanHash,
    transactionPlanId: transaction.transactionPlanId, transactionPlanHash: transaction.transactionPlanHash,
    credentialPlanId: credential.credentialPlanId, credentialPlanHash: credential.credentialPlanHash,
    runbookId: runbook.runbookId, runbookHash: runbook.runbookHash,
    preferredCandidate: CANDIDATE_CLASSES[0], candidateSelected: true,
    step114_2x_cCompatible: true, syntheticConformanceIsRealProviderValidation: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, SPECS.summary);
}

function validateSummary(value, packet) {
  const issues = validateEnvelope(value, SPECS.summary, "preflight_summary");
  if (!isRecord(value)) return issues;
  for (const [idField, hashField, object, objectId, objectHash] of [
    ["decisionId", "decisionHash", packet.persistenceDecision, "decisionId", "decisionHash"],
    ["schemaPlanId", "schemaPlanHash", packet.schemaPlan, "schemaPlanId", "schemaPlanHash"],
    ["transactionPlanId", "transactionPlanHash", packet.transactionPlan, "transactionPlanId", "transactionPlanHash"],
    ["credentialPlanId", "credentialPlanHash", packet.credentialPlan, "credentialPlanId", "credentialPlanHash"],
    ["runbookId", "runbookHash", packet.migrationRunbook, "runbookId", "runbookHash"],
  ]) if (value[idField] !== object?.[objectId] || value[hashField] !== object?.[objectHash]) issues.push(`preflight_summary_binding_mismatch:${idField}`);
  if (value.preferredCandidate !== CANDIDATE_CLASSES[0] || value.candidateSelected !== true ||
      value.step114_2x_cCompatible !== true || value.syntheticConformanceIsRealProviderValidation !== false) issues.push("preflight_summary_boundary_invalid");
  for (const field of FIXED_FALSE_FIELDS) if (value[field] !== false) issues.push(`preflight_summary_fixed_false_invalid:${field}`);
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "real_adapter_implementation_preflight_ready";
  return {
    ok: ready, status, contractVersion: PREFLIGHT_SUMMARY_CONTRACT_VERSION,
    preflightReady: ready, candidateSelected: ready,
    persistenceDecisionValidated: ready, schemaPlanValidated: ready,
    transactionSemanticsValidated: ready, credentialBoundaryValidated: ready,
    migrationRunbookValidated: ready, step114_2x_cCompatible: ready,
    preflightSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? ["preflight_ready_is_not_provider_validation_or_execution_approval"] : [],
  };
}

function evaluateMetricsCutoverRealAdapterImplementationPreflight(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, ["persistenceDecision", "schemaPlan", "transactionPlan", "credentialPlan", "migrationRunbook"])) {
    return safeResult("blocked", {}, ["preflight_packet_fields_invalid"]);
  }
  const issues = [
    ...validateDecision(packet.persistenceDecision),
    ...validateSchema(packet.schemaPlan, packet.persistenceDecision),
    ...validateTransaction(packet.transactionPlan, packet.persistenceDecision, packet.schemaPlan),
    ...validateCredential(packet.credentialPlan, packet.persistenceDecision, packet.schemaPlan),
    ...validateRunbook(packet.migrationRunbook, packet),
  ];
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  let summary;
  try {
    summary = buildSummary(packet);
    issues.push(...validateSummary(summary, packet));
    canonicalJson(summary);
  } catch {
    issues.push("preflight_summary_construction_failed");
  }
  return issues.length > 0
    ? safeResult("blocked", {}, issues)
    : safeResult("real_adapter_implementation_preflight_ready", summary);
}

module.exports = {
  CANDIDATE_CLASSES,
  CLAIM_STATES,
  CREDENTIAL_BOUNDARY_PLAN_CONTRACT_VERSION,
  DOMAINS,
  FIXED_FALSE_FIELDS,
  LOCK_STATES,
  MANUAL_REVIEW_CASES,
  MIGRATION_RUNBOOK_CONTRACT_VERSION,
  PERSISTENCE_DECISION_CONTRACT_VERSION,
  POSTGRESQL_SCHEMA_PLAN_CONTRACT_VERSION,
  PREFLIGHT_SUMMARY_CONTRACT_VERSION,
  RUNBOOK_STEPS,
  SPECS,
  TRANSACTION_SEMANTICS_PLAN_CONTRACT_VERSION,
  buildCredentialPlan,
  buildMigrationRunbook,
  buildPersistenceDecision,
  buildSchemaPlan,
  buildSummary,
  buildTransactionPlan,
  buildValidPreflightPacket,
  evaluateMetricsCutoverRealAdapterImplementationPreflight,
  safeResult,
  sealContract,
  validateCredential,
  validateDecision,
  validateRunbook,
  validateSchema,
  validateSummary,
  validateTransaction,
};
