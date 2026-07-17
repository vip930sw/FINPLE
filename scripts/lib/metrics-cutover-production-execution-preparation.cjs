const {
  canonicalJson,
  hashWithDomain,
  hasExactKeys,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");

const EXECUTION_POLICY_CONTRACT_VERSION =
  "metrics-cutover-production-execution-policy-v1-step114-2x-b";
const CLAIM_STORE_PROFILE_CONTRACT_VERSION =
  "metrics-cutover-production-claim-store-profile-v1-step114-2x-b";
const HOST_PROFILE_CONTRACT_VERSION =
  "metrics-cutover-production-host-profile-v1-step114-2x-b";
const REPOSITORY_LOCK_PROFILE_CONTRACT_VERSION =
  "metrics-cutover-production-repository-lock-profile-v1-step114-2x-b";
const RUNBOOK_CONTRACT_VERSION =
  "metrics-cutover-production-execution-runbook-v1-step114-2x-b";
const PREPARATION_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-production-execution-preparation-summary-v1-step114-2x-b";

const DOMAINS = Object.freeze({
  policyId: "FINPLE_STEP114_2X_B_EXECUTION_POLICY_ID\0",
  policyHash: "FINPLE_STEP114_2X_B_EXECUTION_POLICY_HASH\0",
  claimStoreId: "FINPLE_STEP114_2X_B_CLAIM_STORE_PROFILE_ID\0",
  claimStoreHash: "FINPLE_STEP114_2X_B_CLAIM_STORE_PROFILE_HASH\0",
  hostId: "FINPLE_STEP114_2X_B_HOST_PROFILE_ID\0",
  hostHash: "FINPLE_STEP114_2X_B_HOST_PROFILE_HASH\0",
  repositoryLockId: "FINPLE_STEP114_2X_B_REPOSITORY_LOCK_PROFILE_ID\0",
  repositoryLockHash: "FINPLE_STEP114_2X_B_REPOSITORY_LOCK_PROFILE_HASH\0",
  runbookId: "FINPLE_STEP114_2X_B_RUNBOOK_ID\0",
  runbookHash: "FINPLE_STEP114_2X_B_RUNBOOK_HASH\0",
  summaryId: "FINPLE_STEP114_2X_B_PREPARATION_SUMMARY_ID\0",
  summaryHash: "FINPLE_STEP114_2X_B_PREPARATION_SUMMARY_HASH\0",
});

const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized",
  "fileWriteAuthorized",
  "productionClaimEligible",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
  "appExportActivated",
  "pointerMutationExecuted",
  "rollbackExecuted",
  "loaderActivated",
]);

const INPUT_FIELDS = Object.freeze([
  "executionPolicy",
  "claimStoreProfile",
  "hostProfile",
  "repositoryLockProfile",
  "runbook",
]);
const POLICY_FIELDS = Object.freeze([
  "contractVersion", "policyId", "executionMode",
  "claimStoreProfileId", "claimStoreProfileHash",
  "hostProfileId", "hostProfileHash",
  "repositoryLockProfileId", "repositoryLockProfileHash",
  "runbookId", "runbookHash",
  "humanDecisionGateRequired",
  "productionExecutionApprovalGranted", "receiptConsumptionAuthorized",
  "repositoryWritesAuthorized", "commitAuthorized", "pushAuthorized",
  "mergeAuthorized", "deploymentAuthorized", "runtimeActivationAuthorized",
  "policyHash",
]);
const CLAIM_STORE_FIELDS = Object.freeze([
  "contractVersion", "profileId", "providerClass",
  "atomicCreateIfAbsent", "claimKeyBinding", "globallyUniqueClaimIdentity",
  "durableAcknowledgement", "durabilityDocumentationReviewed",
  "readAfterWriteConsistency", "initialState", "terminalStates",
  "conditionalTerminalTransition", "terminalStateImmutable",
  "reusableAfterTerminal", "claimDeletionAllowed", "retryByDeletionAllowed",
  "immutableAuditIdentity", "immutableTimestamps",
  "retentionPolicyDocumented", "retentionMinimumDays",
  "operatorAccessBoundary", "localFileBacked",
  "capabilityProfileOnly", "realProviderConnectionAttempted", "profileHash",
]);
const HOST_FIELDS = Object.freeze([
  "contractVersion", "profileId", "operatingSystem", "architecture",
  "filesystemDurability", "utcClockSource", "maximumClockSkewMs",
  "nodeMinimumVersion", "gitMinimumVersion", "pythonMinimumVersion",
  "nonInteractiveProcess", "leastPrivilegeOperatorRole",
  "repositoryRealpathPolicy", "workingDirectoryPolicy", "temporaryFilePolicy",
  "checkoutTrustPolicy", "sharedDirectoryProhibited",
  "networkSynchronizedDirectoryProhibited", "userDownloadDirectoryProhibited",
  "logRedactionPolicy", "artifactRetentionPolicy",
  "windowsTestEvidenceIsProductionClaimEvidence", "realMachineProbed",
  "profileHash",
]);
const LOCK_FIELDS = Object.freeze([
  "contractVersion", "profileId", "lockScope", "exclusiveProcess",
  "bindsRepositoryRealpath", "bindsRepositoryHead", "bindsRepositoryTree",
  "bindsRepositoryBranch", "bindsTrackedPathsInventory",
  "atomicAcquisitionBeforeReceiptClaim", "atomicAcquisitionBeforeWrites",
  "ownerLivenessEvidence", "ownerIdentityRedacted", "automaticLockStealing",
  "staleLockPolicy", "releaseAfterTerminalClaimPersistenceOnly",
  "retryByDeleteOrOverwrite", "syntheticAdapterOnly",
  "realCheckoutLockAcquired", "profileHash",
]);
const RUNBOOK_FIELDS = Object.freeze([
  "contractVersion", "runbookId", "artifactRegenerationOrder",
  "singleControlledSession", "noArtifactReuse",
  "approvalResponseMaximumAgeMs", "approvalResponseFutureSkewMs",
  "invocationMaximumAgeMs", "invocationFutureSkewMs",
  "invocationMaximumLifetimeMs", "signerIdentitySeparationRequired",
  "signerKeyIdSeparationRequired", "signerFingerprintSeparationRequired",
  "repositoryPreimageChecks", "targetAbsenceChecks", "selectorPreimageChecks",
  "operationOrder", "postWriteVerificationChecks",
  "terminalManualReviewStates", "humanDecisionGate",
  "automaticRetryAllowed", "automaticRollbackAllowed",
  "targetDeletionAllowed", "selectorRestorationAllowed",
  "lockStealingAllowed", "claimDeletionAllowed",
  "historyRewriteAllowed", "forcedContinuationAllowed", "runbookHash",
]);
const HUMAN_GATE_FIELDS = Object.freeze([
  "documented", "immediatelyBeforeExecution", "separateApprovalRequired",
  "prApprovalAuthorizesExecution", "receiptConsumptionAuthorized",
  "targetOrSelectorWritesAuthorized", "gitOperationsAuthorized",
  "deploymentOrActivationAuthorized",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "preparationId", "executionPolicyId", "executionPolicyHash",
  "claimStoreProfileId", "claimStoreProfileHash", "hostProfileId",
  "hostProfileHash", "repositoryLockProfileId", "repositoryLockProfileHash",
  "runbookId", "runbookHash", "humanDecisionGateRequired",
  ...FIXED_FALSE_FIELDS, "summaryHash",
]);

const TERMINAL_STATES = Object.freeze([
  "consumed_failed_manual_review",
  "consumed_success",
]);
const ARTIFACT_REGENERATION_ORDER = Object.freeze([
  "operator_bundle",
  "signed_execution_approval_response",
  "execution_approver_allowlist_observation",
  "step114_2v_authority_package",
  "signed_step114_2w_invocation",
  "invoker_allowlist_observation",
  "verified_unconsumed_step114_2w_receipt",
  "sealed_step114_2q_execution_package",
]);
const REPOSITORY_PREIMAGE_CHECKS = Object.freeze([
  "canonical_realpath", "head", "tree", "branch", "status",
  "tracked_paths_inventory", "selector_bytes", "target_absence",
]);
const TARGET_ABSENCE_CHECKS = Object.freeze([
  "us_target_untracked_and_absent", "kr_target_untracked_and_absent",
  "stable_two_observation_identity",
]);
const SELECTOR_PREIMAGE_CHECKS = Object.freeze([
  "canonical_path", "regular_non_symlink", "bytes", "sha256", "mode",
  "file_identity", "immediate_pre_rename_recheck",
]);
const OPERATION_ORDER = Object.freeze([
  "acquire_repository_lock", "verify_fresh_authority",
  "acquire_receipt_claim", "recheck_repository_preimage",
  "create_us_target", "create_kr_target", "replace_selector",
  "verify_post_write_state", "persist_terminal_claim", "release_repository_lock",
]);
const POST_WRITE_CHECKS = Object.freeze([
  "exactly_three_changed_paths", "us_target_bytes_hash_size_rows",
  "kr_target_bytes_hash_size_rows", "selector_postimage_bytes_hash_mode",
  "repository_head_tree_branch_unchanged", "no_unexpected_delete",
]);
const MANUAL_REVIEW_STATES = Object.freeze([
  "claim_acquired_no_target_written", "us_target_written_only",
  "both_targets_written_selector_unchanged",
  "selector_replaced_post_write_verification_failed",
  "terminal_claim_persistence_failed", "repository_lock_remains_held",
  "unexpected_fourth_changed_path", "target_or_selector_tampering",
  "clock_or_freshness_drift_after_verification",
]);

function without(value, field) {
  const result = { ...value };
  delete result[field];
  return result;
}

function deriveContractId(domain, prefix, value, idField, hashField) {
  const payload = { ...value };
  delete payload[idField];
  delete payload[hashField];
  return `${prefix}-${hashWithDomain(domain, payload)}`;
}

function sealContract(value, specification) {
  const sealed = structuredClone(value);
  sealed[specification.idField] = deriveContractId(
    specification.idDomain,
    specification.idPrefix,
    sealed,
    specification.idField,
    specification.hashField,
  );
  sealed[specification.hashField] = hashWithDomain(
    specification.hashDomain,
    without(sealed, specification.hashField),
  );
  return sealed;
}

const SPECS = Object.freeze({
  policy: Object.freeze({
    fields: POLICY_FIELDS, version: EXECUTION_POLICY_CONTRACT_VERSION,
    idField: "policyId", hashField: "policyHash",
    idPrefix: "metrics-cutover-production-execution-policy",
    idDomain: DOMAINS.policyId, hashDomain: DOMAINS.policyHash,
  }),
  claimStore: Object.freeze({
    fields: CLAIM_STORE_FIELDS, version: CLAIM_STORE_PROFILE_CONTRACT_VERSION,
    idField: "profileId", hashField: "profileHash",
    idPrefix: "metrics-cutover-production-claim-store-profile",
    idDomain: DOMAINS.claimStoreId, hashDomain: DOMAINS.claimStoreHash,
  }),
  host: Object.freeze({
    fields: HOST_FIELDS, version: HOST_PROFILE_CONTRACT_VERSION,
    idField: "profileId", hashField: "profileHash",
    idPrefix: "metrics-cutover-production-host-profile",
    idDomain: DOMAINS.hostId, hashDomain: DOMAINS.hostHash,
  }),
  lock: Object.freeze({
    fields: LOCK_FIELDS, version: REPOSITORY_LOCK_PROFILE_CONTRACT_VERSION,
    idField: "profileId", hashField: "profileHash",
    idPrefix: "metrics-cutover-production-repository-lock-profile",
    idDomain: DOMAINS.repositoryLockId, hashDomain: DOMAINS.repositoryLockHash,
  }),
  runbook: Object.freeze({
    fields: RUNBOOK_FIELDS, version: RUNBOOK_CONTRACT_VERSION,
    idField: "runbookId", hashField: "runbookHash",
    idPrefix: "metrics-cutover-production-execution-runbook",
    idDomain: DOMAINS.runbookId, hashDomain: DOMAINS.runbookHash,
  }),
  summary: Object.freeze({
    fields: SUMMARY_FIELDS, version: PREPARATION_SUMMARY_CONTRACT_VERSION,
    idField: "preparationId", hashField: "summaryHash",
    idPrefix: "metrics-cutover-production-execution-preparation",
    idDomain: DOMAINS.summaryId, hashDomain: DOMAINS.summaryHash,
  }),
});

function validateEnvelope(value, spec, label) {
  const issues = [];
  if (!isRecord(value)) return [`${label}_not_object`];
  if (!hasExactKeys(value, spec.fields)) issues.push(`${label}_fields_invalid`);
  if (value.contractVersion !== spec.version) issues.push(`${label}_contract_version_invalid`);
  if (!isSafeIdentity(value[spec.idField]) ||
      !value[spec.idField].startsWith(`${spec.idPrefix}-`)) {
    issues.push(`${label}_id_invalid`);
  }
  if (!isSha256(value[spec.hashField])) issues.push(`${label}_hash_invalid`);
  try {
    if (value[spec.idField] !== deriveContractId(
      spec.idDomain, spec.idPrefix, value, spec.idField, spec.hashField,
    )) issues.push(`${label}_id_mismatch`);
    if (value[spec.hashField] !== hashWithDomain(
      spec.hashDomain, without(value, spec.hashField),
    )) issues.push(`${label}_hash_mismatch`);
  } catch {
    issues.push(`${label}_canonicalization_failed`);
  }
  return issues;
}

function arrayEquals(value, expected) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => item === expected[index]);
}

function validateClaimStoreProfile(value) {
  const issues = validateEnvelope(value, SPECS.claimStore, "claim_store_profile");
  if (!isRecord(value)) return issues;
  if (!["database", "transactional_object_store", "distributed_consistent_store"].includes(value.providerClass)) {
    issues.push(value.providerClass === "local_file" || value.localFileBacked === true
      ? "local_file_claim_store_not_production_eligible"
      : "claim_store_provider_class_invalid");
  }
  const requiredTrue = [
    "atomicCreateIfAbsent", "globallyUniqueClaimIdentity",
    "durabilityDocumentationReviewed", "readAfterWriteConsistency",
    "conditionalTerminalTransition", "terminalStateImmutable",
    "immutableAuditIdentity", "immutableTimestamps",
    "retentionPolicyDocumented", "capabilityProfileOnly",
  ];
  for (const field of requiredTrue) if (value[field] !== true) issues.push(`claim_store_capability_missing:${field}`);
  if (value.claimKeyBinding !== "step114_2w_receipt_id_and_hash") issues.push("claim_store_key_binding_invalid");
  if (value.durableAcknowledgement !== "provider_documented_before_success") issues.push("claim_store_durable_acknowledgement_invalid");
  if (value.initialState !== "claim_in_progress") issues.push("claim_store_initial_state_invalid");
  if (!arrayEquals(value.terminalStates, TERMINAL_STATES)) issues.push("claim_store_terminal_states_invalid");
  for (const field of ["reusableAfterTerminal", "claimDeletionAllowed", "retryByDeletionAllowed", "localFileBacked", "realProviderConnectionAttempted"]) {
    if (value[field] !== false) issues.push(`claim_store_forbidden_capability:${field}`);
  }
  if (!Number.isInteger(value.retentionMinimumDays) || value.retentionMinimumDays < 365) issues.push("claim_store_retention_invalid");
  if (value.operatorAccessBoundary !== "named_least_privilege_manual_operators") issues.push("claim_store_operator_access_invalid");
  return uniqueSorted(issues);
}

function compareVersion(value, minimum) {
  if (typeof value !== "string" || !/^\d+\.\d+\.\d+$/.test(value)) return false;
  const actual = value.split(".").map(Number);
  const expected = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (actual[i] > expected[i]) return true;
    if (actual[i] < expected[i]) return false;
  }
  return true;
}

function validateHostProfile(value) {
  const issues = validateEnvelope(value, SPECS.host, "host_profile");
  if (!isRecord(value)) return issues;
  if (value.operatingSystem !== "linux") issues.push("host_operating_system_unsupported");
  if (!["x64", "arm64"].includes(value.architecture)) issues.push("host_architecture_unsupported");
  const exact = {
    filesystemDurability: "descriptor_and_parent_directory_sync_required",
    utcClockSource: "authenticated_utc_source",
    repositoryRealpathPolicy: "canonical_dedicated_local_checkout",
    workingDirectoryPolicy: "dedicated_non_shared_local_directory",
    temporaryFilePolicy: "same_filesystem_private_directory_no_downloads",
    checkoutTrustPolicy: "trusted_dedicated_non_synchronized_non_download",
    logRedactionPolicy: "deny_raw_authority_identity_and_host_metadata",
    artifactRetentionPolicy: "documented_restricted_access_manual_disposal",
  };
  for (const [field, expected] of Object.entries(exact)) if (value[field] !== expected) issues.push(`host_policy_invalid:${field}`);
  if (!Number.isInteger(value.maximumClockSkewMs) || value.maximumClockSkewMs < 0 || value.maximumClockSkewMs > 1000) issues.push("host_clock_skew_invalid");
  for (const [field, minimum] of [["nodeMinimumVersion", "20.0.0"], ["gitMinimumVersion", "2.40.0"], ["pythonMinimumVersion", "3.11.0"]]) {
    if (!compareVersion(value[field], minimum)) issues.push(`host_tool_version_unsupported:${field}`);
  }
  for (const field of ["nonInteractiveProcess", "leastPrivilegeOperatorRole", "sharedDirectoryProhibited", "networkSynchronizedDirectoryProhibited", "userDownloadDirectoryProhibited"]) {
    if (value[field] !== true) issues.push(`host_required_control_missing:${field}`);
  }
  for (const field of ["windowsTestEvidenceIsProductionClaimEvidence", "realMachineProbed"]) {
    if (value[field] !== false) issues.push(`host_forbidden_state:${field}`);
  }
  return uniqueSorted(issues);
}

function validateRepositoryLockProfile(value) {
  const issues = validateEnvelope(value, SPECS.lock, "repository_lock_profile");
  if (!isRecord(value)) return issues;
  if (value.lockScope !== "exact_repository_realpath") issues.push("repository_lock_scope_invalid");
  for (const field of [
    "exclusiveProcess", "bindsRepositoryRealpath", "bindsRepositoryHead",
    "bindsRepositoryTree", "bindsRepositoryBranch", "bindsTrackedPathsInventory",
    "atomicAcquisitionBeforeReceiptClaim", "atomicAcquisitionBeforeWrites",
    "ownerIdentityRedacted", "releaseAfterTerminalClaimPersistenceOnly",
    "syntheticAdapterOnly",
  ]) if (value[field] !== true) issues.push(`repository_lock_semantics_missing:${field}`);
  if (value.ownerLivenessEvidence !== "sanitized_process_liveness_without_host_identity") issues.push("repository_lock_liveness_policy_invalid");
  if (value.staleLockPolicy !== "explicit_manual_review_only") issues.push("repository_lock_stale_policy_invalid");
  for (const field of ["automaticLockStealing", "retryByDeleteOrOverwrite", "realCheckoutLockAcquired"]) {
    if (value[field] !== false) issues.push(`repository_lock_forbidden_behavior:${field}`);
  }
  return uniqueSorted(issues);
}

function validateHumanGate(value, issues) {
  if (!isRecord(value) || !hasExactKeys(value, HUMAN_GATE_FIELDS)) {
    issues.push("runbook_human_decision_gate_invalid");
    return;
  }
  for (const field of ["documented", "immediatelyBeforeExecution", "separateApprovalRequired"]) {
    if (value[field] !== true) issues.push(`runbook_human_decision_gate_missing:${field}`);
  }
  for (const field of ["prApprovalAuthorizesExecution", "receiptConsumptionAuthorized", "targetOrSelectorWritesAuthorized", "gitOperationsAuthorized", "deploymentOrActivationAuthorized"]) {
    if (value[field] !== false) issues.push(`runbook_human_decision_gate_authority_invalid:${field}`);
  }
}

function validateRunbook(value) {
  const issues = validateEnvelope(value, SPECS.runbook, "runbook");
  if (!isRecord(value)) return issues;
  const arrays = [
    ["artifactRegenerationOrder", ARTIFACT_REGENERATION_ORDER],
    ["repositoryPreimageChecks", REPOSITORY_PREIMAGE_CHECKS],
    ["targetAbsenceChecks", TARGET_ABSENCE_CHECKS],
    ["selectorPreimageChecks", SELECTOR_PREIMAGE_CHECKS],
    ["operationOrder", OPERATION_ORDER],
    ["postWriteVerificationChecks", POST_WRITE_CHECKS],
    ["terminalManualReviewStates", MANUAL_REVIEW_STATES],
  ];
  for (const [field, expected] of arrays) if (!arrayEquals(value[field], expected)) issues.push(`runbook_sequence_invalid:${field}`);
  for (const field of ["singleControlledSession", "noArtifactReuse", "signerIdentitySeparationRequired", "signerKeyIdSeparationRequired", "signerFingerprintSeparationRequired"]) {
    if (value[field] !== true) issues.push(`runbook_required_control_missing:${field}`);
  }
  const times = {
    approvalResponseMaximumAgeMs: 1800000,
    approvalResponseFutureSkewMs: 60000,
    invocationMaximumAgeMs: 600000,
    invocationFutureSkewMs: 60000,
    invocationMaximumLifetimeMs: 900000,
  };
  for (const [field, expected] of Object.entries(times)) if (value[field] !== expected) issues.push(`runbook_freshness_invalid:${field}`);
  validateHumanGate(value.humanDecisionGate, issues);
  for (const field of ["automaticRetryAllowed", "automaticRollbackAllowed", "targetDeletionAllowed", "selectorRestorationAllowed", "lockStealingAllowed", "claimDeletionAllowed", "historyRewriteAllowed", "forcedContinuationAllowed"]) {
    if (value[field] !== false) issues.push(`runbook_forbidden_instruction:${field}`);
  }
  return uniqueSorted(issues);
}

function validateExecutionPolicy(value, inputs) {
  const issues = validateEnvelope(value, SPECS.policy, "execution_policy");
  if (!isRecord(value)) return issues;
  if (value.executionMode !== "preparation_only") issues.push("execution_policy_mode_invalid");
  if (value.humanDecisionGateRequired !== true) issues.push("execution_policy_human_gate_missing");
  for (const field of ["productionExecutionApprovalGranted", "receiptConsumptionAuthorized", "repositoryWritesAuthorized", "commitAuthorized", "pushAuthorized", "mergeAuthorized", "deploymentAuthorized", "runtimeActivationAuthorized"]) {
    if (value[field] !== false) issues.push(`execution_policy_authority_must_be_false:${field}`);
  }
  for (const [policyId, policyHash, object, idField, hashField] of [
    ["claimStoreProfileId", "claimStoreProfileHash", inputs.claimStoreProfile, "profileId", "profileHash"],
    ["hostProfileId", "hostProfileHash", inputs.hostProfile, "profileId", "profileHash"],
    ["repositoryLockProfileId", "repositoryLockProfileHash", inputs.repositoryLockProfile, "profileId", "profileHash"],
    ["runbookId", "runbookHash", inputs.runbook, "runbookId", "runbookHash"],
  ]) {
    if (value[policyId] !== object?.[idField]) issues.push(`execution_policy_binding_mismatch:${policyId}`);
    if (value[policyHash] !== object?.[hashField]) issues.push(`execution_policy_binding_mismatch:${policyHash}`);
  }
  return uniqueSorted(issues);
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "production_execution_preparation_ready";
  return {
    ok: ready,
    status,
    contractVersion: PREPARATION_SUMMARY_CONTRACT_VERSION,
    preparationReady: ready,
    claimStoreCapabilityValidated: ready,
    hostProfileValidated: ready,
    repositoryLockProfileValidated: ready,
    runbookValidated: ready,
    humanDecisionGateRequired: ready,
    preparationSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready
      ? ["preparation_ready_is_not_production_execution_approval"]
      : [],
  };
}

function buildPreparationSummary(input) {
  return sealContract({
    contractVersion: PREPARATION_SUMMARY_CONTRACT_VERSION,
    executionPolicyId: input.executionPolicy.policyId,
    executionPolicyHash: input.executionPolicy.policyHash,
    claimStoreProfileId: input.claimStoreProfile.profileId,
    claimStoreProfileHash: input.claimStoreProfile.profileHash,
    hostProfileId: input.hostProfile.profileId,
    hostProfileHash: input.hostProfile.profileHash,
    repositoryLockProfileId: input.repositoryLockProfile.profileId,
    repositoryLockProfileHash: input.repositoryLockProfile.profileHash,
    runbookId: input.runbook.runbookId,
    runbookHash: input.runbook.runbookHash,
    humanDecisionGateRequired: true,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, SPECS.summary);
}

function validatePreparationSummary(value) {
  const issues = validateEnvelope(value, SPECS.summary, "preparation_summary");
  if (!isRecord(value)) return issues;
  if (value.humanDecisionGateRequired !== true) issues.push("preparation_summary_human_gate_invalid");
  for (const field of FIXED_FALSE_FIELDS) if (value[field] !== false) issues.push(`preparation_summary_fixed_false_invalid:${field}`);
  return uniqueSorted(issues);
}

function prepareMetricsCutoverProductionExecution(input) {
  if (input === undefined || input === null) return safeResult("idle");
  if (!isRecord(input) || !hasExactKeys(input, INPUT_FIELDS)) {
    return safeResult("blocked", {}, ["preparation_input_fields_invalid"]);
  }
  const issues = [
    ...validateClaimStoreProfile(input.claimStoreProfile),
    ...validateHostProfile(input.hostProfile),
    ...validateRepositoryLockProfile(input.repositoryLockProfile),
    ...validateRunbook(input.runbook),
    ...validateExecutionPolicy(input.executionPolicy, input),
  ];
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  let summary;
  try {
    summary = buildPreparationSummary(input);
    issues.push(...validatePreparationSummary(summary));
  } catch {
    issues.push("preparation_summary_construction_failed");
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  return safeResult("production_execution_preparation_ready", summary);
}

module.exports = {
  ARTIFACT_REGENERATION_ORDER,
  CLAIM_STORE_PROFILE_CONTRACT_VERSION,
  DOMAINS,
  EXECUTION_POLICY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  HOST_PROFILE_CONTRACT_VERSION,
  MANUAL_REVIEW_STATES,
  OPERATION_ORDER,
  POST_WRITE_CHECKS,
  PREPARATION_SUMMARY_CONTRACT_VERSION,
  REPOSITORY_LOCK_PROFILE_CONTRACT_VERSION,
  REPOSITORY_PREIMAGE_CHECKS,
  RUNBOOK_CONTRACT_VERSION,
  SELECTOR_PREIMAGE_CHECKS,
  SPECS,
  TARGET_ABSENCE_CHECKS,
  TERMINAL_STATES,
  buildPreparationSummary,
  prepareMetricsCutoverProductionExecution,
  safeResult,
  sealContract,
  validateClaimStoreProfile,
  validateExecutionPolicy,
  validateHostProfile,
  validatePreparationSummary,
  validateRepositoryLockProfile,
  validateRunbook,
};
