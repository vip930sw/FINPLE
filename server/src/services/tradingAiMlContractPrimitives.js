export const AI_ML_CONTRACT_STATUS = Object.freeze({
  BLOCKED: "blocked",
  DENIED: "denied",
  NOT_GRANTED: "not_granted",
  NOT_STARTED: "not_started",
  NOT_IMPLEMENTED: "not_implemented",
  NOT_ASSIGNED: "not_assigned",
  GENERATED_IN_MEMORY: "generated_in_memory",
  GENERATED_NOT_PERSISTED: "generated_not_persisted",
  METADATA_ONLY_NON_EXECUTABLE: "metadata_only_non_executable",
  ADMIN_ONLY: "admin_only",
  EXTERNAL_BLOCKER: "external_blocker",
  CONSOLIDATION_REQUIRED: "consolidation_required",
  CONSOLIDATE_BEFORE_RUNTIME: "consolidate_before_runtime",
});

export const AI_ML_STAGE_IDS = Object.freeze({
  STEP_191_STRATEGY_MANAGEMENT: "step191_strategy_management",
  STEP_192_DATASET_LABELING_ARCHITECTURE: "step192_dataset_labeling_architecture",
  STEP_193_FEATURE_PIPELINE_ARCHITECTURE: "step193_feature_pipeline_architecture",
  STEP_194_FEATURE_PIPELINE_PREFLIGHT: "step194_feature_pipeline_preflight",
  STEP_195_READINESS_GATE_SUMMARY: "step195_readiness_gate_summary",
  STEP_196_BATCH_CONTRACT_REVIEW: "step196_batch_contract_review",
  STEP_197_DATASET_BUILD_MANIFEST: "step197_dataset_build_manifest",
  STEP_198_MANIFEST_VALIDATION_REPORT: "step198_manifest_validation_report",
  STEP_199_MANIFEST_HANDOFF_ELIGIBILITY: "step199_manifest_handoff_eligibility",
});

export const AI_ML_COMMON_FAIL_CLOSED_FLAGS = Object.freeze({
  architectureMutationAllowed: false,
  automaticRefactorAllowed: false,
  contractMigrationAllowed: false,
  handoffExecutionAllowed: false,
  handoffTransmissionAllowed: false,
  handoffPersistenceAllowed: false,
  targetPreflightAuthorizationAllowed: false,
  targetPreflightExecutionAllowed: false,
  validationExecutionAllowed: false,
  manifestExecutionAllowed: false,
  dryRunExecutionAllowed: false,
  actualDataDownloadAllowed: false,
  featureGenerationAllowed: false,
  datasetBuildAllowed: false,
  batchExecutionAllowed: false,
  schemaMaterializationAllowed: false,
  partitionMaterializationAllowed: false,
  outputPathAssignmentAllowed: false,
  reportPersistenceAllowed: false,
  exceptionPersistenceAllowed: false,
  remediationPersistenceAllowed: false,
  approvalPersistenceAllowed: false,
  waiverGrantAllowed: false,
  executionAuthorizationAllowed: false,
  dbMigrationAllowed: false,
  dbReadAllowed: false,
  dbWriteAllowed: false,
  persistentStorageAllowed: false,
  providerCallsAllowed: false,
  quoteCallsAllowed: false,
  kisCallsAllowed: false,
  kisTokenIssuanceAllowed: false,
  pythonFeatureJobAllowed: false,
  modelTrainingAllowed: false,
  modelDeploymentAllowed: false,
  orderSubmissionAllowed: false,
  liveTradingAllowed: false,
  publicUiExposureAllowed: false,
  myPageExposureAllowed: false,
});

export const AI_ML_COMMON_READINESS_FALSE_FLAGS = Object.freeze({
  readyForValidationExecution: false,
  readyForManifestExecution: false,
  readyForActualDataDownload: false,
  readyForFeatureGeneration: false,
  readyForDatasetBuild: false,
  readyForBatchExecution: false,
  readyForDryRunExecution: false,
  readyForSchemaMaterialization: false,
  readyForPartitionMaterialization: false,
  readyForModelTraining: false,
  readyForModelDeployment: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const AI_ML_SENSITIVE_METADATA_PATTERNS = Object.freeze([
  /api\s*key/i,
  /secret/i,
  /token/i,
  /credential/i,
  /account\s*id/i,
  /provider raw response/i,
  /environment value/i,
  /private path/i,
  /artifact path/i,
  /dataset path/i,
  /raw source code/i,
  /raw status payload/i,
  /hash/i,
  /digest/i,
  /checksum/i,
  /actual market data/i,
  /account data/i,
  /[A-Za-z]:\\/,
  /\\\\/,
]);

export function normalizeAiMlMetadataArray(value) {
  return Array.isArray(value) ? value : [];
}

export function sanitizeAiMlMetadataValue(value, fallback = "metadata") {
  const text = String(value ?? fallback);
  return AI_ML_SENSITIVE_METADATA_PATTERNS.some((pattern) => pattern.test(text))
    ? "redacted_metadata"
    : text;
}

export function sanitizeAiMlMetadataArray(values) {
  return Object.freeze(normalizeAiMlMetadataArray(values).map((item) => sanitizeAiMlMetadataValue(item)).sort());
}

export function sortAiMlMetadataByKey(items, key) {
  return Object.freeze([...normalizeAiMlMetadataArray(items)].sort((a, b) => {
    const left = String(a?.[key] ?? "");
    const right = String(b?.[key] ?? "");
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }));
}

export function cloneAiMlMetadata(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export function buildAiMlFailClosedFlags({
  inheritedFlags = {},
  allowedMetadataFlags = {},
  additionalFalseFlags = {},
} = {}) {
  const inherited = cloneAiMlMetadata(inheritedFlags) || {};
  const allowed = cloneAiMlMetadata(allowedMetadataFlags) || {};
  const additionalFalse = cloneAiMlMetadata(additionalFalseFlags) || {};
  const protectedFalse = {
    ...AI_ML_COMMON_FAIL_CLOSED_FLAGS,
    ...AI_ML_COMMON_READINESS_FALSE_FLAGS,
    ...additionalFalse,
  };
  const protectedFalseKeys = new Set(Object.keys(protectedFalse));
  const result = {};

  for (const [key, value] of Object.entries(inherited)) {
    if (protectedFalseKeys.has(key)) continue;
    if (value === true && allowed[key] !== true) continue;
    result[key] = value;
  }

  for (const key of Object.keys(protectedFalse)) {
    result[key] = false;
  }

  for (const [key, value] of Object.entries(allowed)) {
    if (protectedFalseKeys.has(key)) continue;
    if (value === true) result[key] = true;
  }

  return Object.freeze(result);
}
