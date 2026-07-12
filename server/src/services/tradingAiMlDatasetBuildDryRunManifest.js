import {
  STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS,
  buildAiMlBatchContractReview,
} from "./tradingAiMlBatchContractReview.js";
import {
  buildAiMlReadinessGateSummary,
} from "./tradingAiMlReadinessGateSummary.js";

export const STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS = Object.freeze({
  ...STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS,
  adminReadOnlyManifestDesignAllowed: true,
  deterministicInMemoryManifestAllowed: true,
  metadataOnlyReviewReceiptAllowed: true,
  actualDataDownloadAllowed: false,
  featureGenerationAllowed: false,
  featureFileCreationAllowed: false,
  datasetBuildAllowed: false,
  datasetFileCreationAllowed: false,
  batchExecutionAllowed: false,
  dryRunExecutionAllowed: false,
  manifestFileCreationAllowed: false,
  schemaMaterializationAllowed: false,
  partitionMaterializationAllowed: false,
  outputPathAssignmentAllowed: false,
  pythonFeatureJobAllowed: false,
  modelTrainingAllowed: false,
  modelArtifactCreationAllowed: false,
  modelDeploymentAllowed: false,
  modelAutoApprovalAllowed: false,
  dbMigrationAllowed: false,
  dbReadAllowed: false,
  dbWriteAllowed: false,
  persistentStorageAllowed: false,
  providerCallsAllowed: false,
  quoteCallsAllowed: false,
  kisCallsAllowed: false,
  kisTokenIssuanceAllowed: false,
  manualApprovalPersistenceAllowed: false,
  reviewReceiptPersistenceAllowed: false,
  executionAuthorizationAllowed: false,
  orderSubmissionAllowed: false,
  liveTradingAllowed: false,
  publicUiExposureAllowed: false,
  myPageExposureAllowed: false,
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

export const TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL = Object.freeze({
  manifestId: "string",
  scope: "admin_ai_ml_strategy_lab",
  manifestMode: "metadata_only_non_executable",
  manifestDesignStatus: "complete | needs_revision",
  reviewReceiptStatus: "generated_not_persisted",
  approvalStatus: "not_granted",
  executionAuthorizationStatus: "denied",
  dryRunExecutionStatus: "blocked",
  materializationStatus: "blocked",
  outputPathStatus: "not_assigned",
  overallStatus: "invalid_upstream_review | blocked_by_safety_policy | manifest_needs_revision | manifest_design_ready_execution_blocked",
  requestContract: "dataset_build_dry_run_manifest_request",
  manifestSections: "dataset_build_dry_run_manifest_section[]",
  validationChecks: "dataset_build_dry_run_manifest_validation_check[]",
  reviewReceipt: "metadata_only_design_review_receipt",
  defaultStatus: {
    manifestMode: "metadata_only_non_executable",
    manifestDesignStatus: "complete",
    reviewReceiptStatus: "generated_not_persisted",
    reviewDecision: "design_contract_record_only",
    approvalStatus: "not_granted",
    approvalScope: "dry_run_manifest_design_only",
    executionAuthorizationStatus: "denied",
    dryRunExecutionStatus: "blocked",
    materializationStatus: "blocked",
    outputCreationStatus: "blocked",
    outputPathStatus: "not_assigned",
    overallStatus: "manifest_design_ready_execution_blocked",
    redacted: true,
  },
  redacted: true,
});

const REQUIRED_MANIFEST_SECTIONS = Object.freeze([
  "manifestIdentity",
  "upstreamReviewReference",
  "datasetContractReference",
  "featureSetReference",
  "labelSpecReference",
  "splitPolicyReference",
  "normalizationPolicyReference",
  "qualityPolicyReference",
  "sourceMappingReference",
  "logicalInputInventory",
  "temporalBoundaryPlan",
  "logicalPartitionPlan",
  "logicalSchemaPlan",
  "logicalOutputPlan",
  "qualityValidationPlan",
  "lineagePlan",
  "governanceAndRetentionPlan",
  "resourceEnvelope",
  "reviewReceiptRequest",
  "executionIntent",
]);

const VALIDATION_CATEGORIES = Object.freeze([
  "upstream_batch_contract_review",
  "manifest_identity",
  "contract_reference_pinning",
  "logical_input_inventory",
  "temporal_boundary_plan",
  "logical_partition_plan",
  "logical_schema_plan",
  "logical_output_restrictions",
  "quality_validation_plan",
  "lineage_plan",
  "governance_and_retention",
  "resource_envelope",
  "review_receipt_boundary",
  "execution_boundary",
  "external_authority_context",
  "prohibited_execution_intent",
]);

const REQUIRED_TEMPORAL_RULES = Object.freeze([
  "feature.availableAt <= predictionTime",
  "feature.eventTime <= featureCutoffTime",
  "featureCutoffTime <= predictionTime",
  "labelStartTime > predictionTime",
  "labelEndTime >= labelStartTime",
]);

const LOGICAL_INPUT_TYPES = Object.freeze([
  "asset_master",
  "daily_price",
  "monthly_return",
  "dividend",
  "benchmark",
  "foreign_exchange",
  "market_regime",
  "portfolio_snapshot",
  "dataset_label_registry",
]);

const QUALITY_CHECK_IDS = Object.freeze([
  "schema_validation",
  "dtype_validation",
  "primary_key_validation",
  "duplicate_key_validation",
  "temporal_order_validation",
  "finite_value_validation",
  "range_validation",
  "missing_rate_threshold",
  "staleness_threshold",
  "coverage_threshold",
  "partition_overlap_validation",
  "label_leakage_validation",
  "feature_drift_placeholder",
  "distribution_shift_placeholder",
]);

const PROHIBITED_EXECUTION_INTENTS = Object.freeze([
  "download_data",
  "query_provider",
  "query_kis",
  "issue_kis_token",
  "read_database",
  "write_database",
  "create_csv",
  "create_parquet",
  "create_manifest_file",
  "create_feature_file",
  "create_dataset_file",
  "assign_output_path",
  "materialize_schema",
  "materialize_partition",
  "build_dataset",
  "generate_features",
  "execute_dry_run",
  "run_python",
  "train_model",
  "create_model_artifact",
  "deploy_model",
  "persist_review_receipt",
  "persist_approval",
  "grant_execution_authority",
  "submit_order",
  "enable_live_trading",
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_upstream_review",
  "blocked_by_safety_policy",
  "manifest_needs_revision",
  "manifest_design_ready_execution_blocked",
]);

const SCENARIO_CATALOG = Object.freeze([
  "scenario_a_valid_manifest_design",
  "scenario_b_invalid_upstream_review",
  "scenario_c_missing_contract_version",
  "scenario_d_prohibited_file_materialization",
  "scenario_e_prohibited_db_or_provider_intent",
  "scenario_f_invalid_temporal_boundary",
  "scenario_g_invalid_partition_plan",
  "scenario_h_invalid_logical_schema",
  "scenario_i_receipt_attempts_approval",
  "scenario_j_external_order_authority_blocker",
  "scenario_k_deterministic_ordering",
  "scenario_l_mutation_resistance",
]);

function isPinnedVersion(value) {
  return typeof value === "string" && /^v\d+(\.\d+){0,2}$/.test(value);
}

function compareTime(left, operator, right) {
  if (!left || !right) return false;
  if (operator === "<=") return left <= right;
  if (operator === ">") return left > right;
  if (operator === ">=") return left >= right;
  return false;
}

function sortByKey(items, key) {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

function mergeObject(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return base;
  return Object.entries(override).reduce((next, [key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      return { ...next, [key]: mergeObject(next[key], value) };
    }
    return { ...next, [key]: value };
  }, { ...base });
}

function getNested(input, path) {
  return path.split(".").reduce((value, key) => value?.[key], input);
}

function makeCheck({ checkId, category, status = "pass", severity = "info", message, evidence = [], remediation = "none", blocking = false, manualReviewRequired = false }) {
  return Object.freeze({
    checkId,
    category,
    status,
    severity,
    message,
    evidence: [...evidence].sort(),
    remediation,
    blocking,
    manualReviewRequired,
    redacted: true,
  });
}

export function createDeterministicMockDatasetBuildManifestRequest(overrides = {}) {
  const request = {
    manifestIdentity: {
      manifestId: "step197_dataset_build_dry_run_manifest_v1",
      manifestVersion: "v1",
      manifestPurpose: "dataset_build_dry_run_design",
      manifestMode: "metadata_only_non_executable",
      manifestScope: "admin_ai_ml_strategy_lab",
    },
    upstreamReviewReference: {
      reviewId: "step196_ai_ml_batch_contract_review",
      reviewVersion: "v1",
      reviewOverallStatus: "review_ready_execution_blocked",
      reviewEligibilityStatus: "eligible_for_manual_review",
      approvalStatus: "not_granted",
      approvalScope: "dry_run_manifest_design_only",
      executionAuthorizationStatus: "denied",
      batchExecutionStatus: "blocked",
      outputCreationStatus: "blocked",
    },
    datasetContractReference: {
      datasetSpecId: "dataset-family-downside-probability-v0",
      datasetSpecVersion: "v1",
    },
    featureSetReference: {
      featureSetId: "feature-set-step193-core-v0",
      featureSetVersion: "v1",
    },
    labelSpecReference: {
      labelSpecId: "downside_1m_negative",
      labelSpecVersion: "v1",
    },
    splitPolicyReference: {
      splitPolicyId: "chronological-split-v0",
      splitPolicyVersion: "v1",
    },
    normalizationPolicyReference: {
      normalizationPolicyId: "train_only_normalization_policy_v0",
      normalizationPolicyVersion: "v1",
    },
    qualityPolicyReference: {
      qualityPolicyId: "feature_quality_gate_policy_v0",
      qualityPolicyVersion: "v1",
    },
    sourceMappingReference: {
      sourceMappingId: "step193_feature_source_mapping_contract",
      sourceMappingVersion: "v1",
    },
    logicalInputInventory: LOGICAL_INPUT_TYPES.map((sourceType) => ({
      logicalInputId: `logical_input_${sourceType}`,
      sourceType,
      sourceContractId: `${sourceType}_contract_v0`,
      sourceContractVersion: "v1",
      declaredFieldNames: ["entity_id", "event_time", "available_at", "declared_value_placeholder"],
      eventTimeField: "event_time",
      availableAtField: "available_at",
      declaredPrimaryKeys: ["entity_id", "event_time"],
      freshnessPolicyReference: "freshness_policy_v1",
      missingValuePolicyReference: "missing_value_policy_v0",
      accessStatus: "blocked",
      materializationStatus: "not_materialized",
      redacted: true,
    })).sort((a, b) => a.logicalInputId.localeCompare(b.logicalInputId)),
    temporalBoundaryPlan: {
      predictionTime: "2026-01-05T09:00:00Z",
      featureCutoffTime: "2026-01-05T09:00:00Z",
      labelStartTime: "2026-01-06T00:00:00Z",
      labelEndTime: "2026-02-06T00:00:00Z",
      observationWindowDeclaration: "2025-01-01_to_2026-01-05_metadata_only",
      predictionScheduleReference: "single_batch_manifest_review_v1",
      timezone: "UTC",
      marketCalendarPolicy: "declared_market_calendar_policy_only",
      cutoffConvention: "feature_cutoff_at_or_before_prediction_time",
      lateArrivingDataPolicy: "future_manifest_version_only",
      revisedDataPolicy: "new_snapshot_version_required",
      purgeWindowPolicy: "one_month_purge_declared",
      embargoWindowPolicy: "one_month_embargo_declared",
      temporalRules: [...REQUIRED_TEMPORAL_RULES],
    },
    logicalPartitionPlan: {
      logicalPartitionKeys: ["market", "prediction_date"],
      declaredPartitionCount: 4,
      declaredEstimatedRows: 1200,
      declaredBatchWindow: "2025-01-01_to_2026-01-05",
      declaredSortKeys: ["entity_id", "prediction_time"],
      declaredUniqueKeys: ["entity_id", "prediction_time", "feature_set_version"],
      partitionOverlapPolicy: "reject_overlapping_partition_windows",
      emptyPartitionPolicy: "manual_review_required",
      lateDataHandlingPolicy: "future_manifest_version_only",
      deduplicationPolicy: "reject_duplicate_unique_keys",
      partitionMaterializationStatus: "blocked",
      actualPartitionCountStatus: "not_measured",
      actualRowCountStatus: "not_measured",
    },
    logicalSchemaPlan: {
      logicalSchemaId: "step197_logical_dataset_schema",
      logicalSchemaVersion: "v1",
      primaryKeyFields: ["entity_id", "prediction_time"],
      temporalFields: ["event_time", "available_at", "prediction_time", "label_start_time", "label_end_time"],
      featureFields: ["return_20d", "volatility_20d", "momentum_60d"],
      labelFields: ["downside_1m_negative"],
      metadataFields: ["feature_set_version", "dataset_spec_version", "lineage_reference"],
      nullablePolicy: "explicit_missing_state_only",
      missingStatePolicy: "missing_source_not_zero",
      schemaCompatibilityPolicy: "versioned_additive_change_only",
      fieldDefinitions: [
        ["available_at", "timestamp", "available_time", false, false, "source_mapping_reference", "available_time"],
        ["dataset_spec_version", "string", "metadata", false, false, "dataset_contract_reference", "not_temporal"],
        ["downside_1m_negative", "label_bucket", "label", true, true, "label_spec_reference", "label_window"],
        ["entity_id", "string", "primary_key", false, false, "logical_input_inventory", "not_temporal"],
        ["event_time", "timestamp", "event_time", false, false, "source_mapping_reference", "event_time"],
        ["feature_set_version", "string", "metadata", false, false, "feature_set_reference", "not_temporal"],
        ["label_end_time", "timestamp", "label_boundary", false, false, "label_spec_reference", "label_end_time"],
        ["label_start_time", "timestamp", "label_boundary", false, false, "label_spec_reference", "label_start_time"],
        ["lineage_reference", "string", "metadata", false, false, "lineage_plan", "not_temporal"],
        ["momentum_60d", "decimal", "feature", true, true, "feature_set_reference", "feature_window"],
        ["prediction_time", "timestamp", "prediction_time", false, false, "prediction_schedule_reference", "prediction_time"],
        ["return_20d", "decimal", "feature", true, true, "feature_set_reference", "feature_window"],
        ["volatility_20d", "decimal", "feature", true, true, "feature_set_reference", "feature_window"],
      ].map(([fieldName, logicalType, semanticRole, nullable, missingStateAllowed, sourceReference, temporalRole]) => ({
        fieldName,
        logicalType,
        semanticRole,
        nullable,
        missingStateAllowed,
        sourceReference,
        temporalRole,
        redacted: true,
      })),
    },
    logicalOutputPlan: {
      proposedLogicalDatasetId: "step197_logical_dataset_build_dry_run_manifest",
      proposedOutputFormat: "manifest_metadata_only",
      proposedSchemaVersion: "v1",
      proposedPartitionLayout: "market_prediction_date",
      proposedRetentionClass: "metadata_review_only",
      proposedCompressionClass: "not_applicable_no_file",
      materializationStatus: "blocked",
      outputCreationStatus: "blocked",
      outputPathStatus: "not_assigned",
      fileCreationAuthorization: "denied",
      databaseWriteAuthorization: "denied",
    },
    qualityValidationPlan: QUALITY_CHECK_IDS.map((qualityCheckId) => ({
      qualityCheckId,
      status: "declared_not_executed",
      executionMode: "declared_not_executed",
      thresholdDeclaration: `${qualityCheckId}_threshold_declared`,
      blocking: true,
      sourcePolicyReference: "feature_quality_gate_policy_v0",
      redacted: true,
    })).sort((a, b) => a.qualityCheckId.localeCompare(b.qualityCheckId)),
    lineagePlan: {
      parentBatchContractReviewId: "step196_ai_ml_batch_contract_review",
      datasetSpecId: "dataset-family-downside-probability-v0",
      datasetSpecVersion: "v1",
      featureSetId: "feature-set-step193-core-v0",
      featureSetVersion: "v1",
      labelSpecId: "downside_1m_negative",
      labelSpecVersion: "v1",
      splitPolicyId: "chronological-split-v0",
      splitPolicyVersion: "v1",
      normalizationPolicyId: "train_only_normalization_policy_v0",
      normalizationPolicyVersion: "v1",
      qualityPolicyId: "feature_quality_gate_policy_v0",
      qualityPolicyVersion: "v1",
      sourceMappingId: "step193_feature_source_mapping_contract",
      sourceMappingVersion: "v1",
      architectureStepReferences: ["step192_dataset_architecture", "step193_feature_pipeline", "step194_preflight", "step195_readiness", "step196_batch_review"],
      lineageMode: "pinned_contract_ids_and_versions_only",
    },
    governanceAndRetentionPlan: {
      dataClassification: "metadata_contract_only",
      piiPresenceDeclaration: "none_declared",
      credentialExclusionDeclaration: "excluded",
      rawAccountDataDeclaration: "excluded",
      retentionClass: "metadata_review_only",
      deletionPolicyReference: "metadata_review_deletion_policy_v1",
      accessRoleDeclaration: "admin_review_only",
      redactionPolicyReference: "status_and_contract_ids_only",
      auditMetadataPolicy: "redacted_status_only",
      lineageRetentionPolicy: "contract_reference_only",
      persistenceStatus: "blocked",
    },
    resourceEnvelope: {
      declaredMaxRows: 5000,
      declaredMaxFeatures: 64,
      declaredMaxPartitions: 8,
      declaredMemoryClass: "small_review_only",
      declaredRuntimeClass: "not_executed",
      declaredConcurrency: 1,
      declaredRetryLimit: 0,
      actualRowsMeasured: false,
      actualRuntimeMeasured: false,
      actualMemoryMeasured: false,
      actualCostCalculated: false,
    },
    reviewReceiptRequest: {
      receiptId: "step197_dataset_build_dry_run_manifest_v1_receipt_v1",
      receiptVersion: "v1",
      receiptType: "metadata_only_design_review_receipt",
      sourceReviewId: "step196_ai_ml_batch_contract_review",
      manifestId: "step197_dataset_build_dry_run_manifest_v1",
      reviewDecision: "design_contract_record_only",
      approvalStatus: "not_granted",
      approvalScope: "dry_run_manifest_design_only",
      executionAuthorizationStatus: "denied",
      reviewerRoleDeclarations: ["requestOwner", "dataOwner", "featureOwner", "modelRiskReviewer", "securityPrivacyReviewer", "complianceLegalReviewer", "operationsReviewer", "finalManualReviewer"],
      persisted: false,
      downloadable: false,
      doesNotGrantApproval: true,
      doesNotGrantExecution: true,
      redacted: true,
    },
    executionIntent: {
      intentType: "metadata_only_manifest_design",
      requestedActions: ["record_manifest_contract_metadata"],
    },
  };

  return mergeObject(request, overrides);
}

export function collectDatasetBuildManifestUpstreamStatuses(input = {}, options = {}) {
  const upstreamInput = {
    aiMlStrategyManagementStatus: input.aiMlStrategyManagementStatus,
    aiMlDatasetArchitectureStatus: input.aiMlDatasetArchitectureStatus,
    aiMlFeaturePipelineStatus: input.aiMlFeaturePipelineStatus,
    aiMlFeaturePipelinePreflightStatus: input.aiMlFeaturePipelinePreflightStatus,
    aiMlReadinessGateSummaryStatus: input.aiMlReadinessGateSummaryStatus,
    aiMlBatchContractReviewStatus: input.aiMlBatchContractReviewStatus,
  };
  const batchContractReview = mergeObject(
    input.batchContractReview || input.aiMlBatchContractReviewStatus?.review || buildAiMlBatchContractReview(upstreamInput, options),
    input.batchContractReviewOverrides,
  );
  const readinessSummary = input.readinessSummary || input.aiMlReadinessGateSummaryStatus?.summary || buildAiMlReadinessGateSummary(upstreamInput, options);

  return {
    batchContractReview,
    readinessSummary,
    expectedBatchReview: {
      reviewEligibilityStatus: "eligible_for_manual_review",
      approvalStatus: "not_granted",
      approvalScope: "dry_run_manifest_design_only",
      executionAuthorizationStatus: "denied",
      batchExecutionStatus: "blocked",
      outputCreationStatus: "blocked",
      overallStatus: "review_ready_execution_blocked",
      nextSafeImplementationStep: "dry_run_manifest_contract_design",
    },
    expectedReadinessSummary: {
      overallStatus: "internal_contracts_valid_execution_blocked",
      orderAuthorityStatus: "external_blocker",
      liveTradingStatus: "blocked",
    },
    redacted: true,
  };
}

export function buildDatasetBuildManifestReviewReceipt(request) {
  const receipt = request.reviewReceiptRequest || {};
  return {
    receiptId: receipt.receiptId || "missing_receipt_id",
    receiptVersion: receipt.receiptVersion || "missing_version",
    receiptType: "metadata_only_design_review_receipt",
    sourceReviewId: receipt.sourceReviewId || "missing_source_review",
    manifestId: request.manifestIdentity?.manifestId || "missing_manifest",
    reviewDecision: "design_contract_record_only",
    approvalStatus: "not_granted",
    approvalScope: "dry_run_manifest_design_only",
    executionAuthorizationStatus: "denied",
    reviewerRoleDeclarations: [...(receipt.reviewerRoleDeclarations || [])].sort(),
    persisted: false,
    downloadable: false,
    doesNotGrantApproval: true,
    doesNotGrantExecution: true,
    redacted: true,
  };
}

function detectReviewReceiptBoundaryAttempt(request) {
  const receipt = request.reviewReceiptRequest || {};
  return {
    attemptsApproval: receipt.approvalStatus === "approved" || receipt.doesNotGrantApproval === false,
    attemptsExecutionAuthority: receipt.executionAuthorizationStatus === "granted" || receipt.doesNotGrantExecution === false,
    attemptsPersistence: receipt.persisted === true,
    attemptsDownload: receipt.downloadable === true,
    attemptsReviewDecisionEscalation: receipt.reviewDecision && receipt.reviewDecision !== "design_contract_record_only",
    redacted: true,
  };
}

export function buildDatasetBuildManifestSections(request) {
  return REQUIRED_MANIFEST_SECTIONS.map((sectionId) => ({
    sectionId,
    present: Boolean(request?.[sectionId]),
    mode: "metadata_only",
    persisted: false,
    materialized: false,
    redacted: true,
  }));
}

export function buildDatasetBuildManifestValidationChecks(request, upstreamStatuses = collectDatasetBuildManifestUpstreamStatuses()) {
  const checks = [];
  const batchReview = upstreamStatuses.batchContractReview || {};
  const expected = upstreamStatuses.expectedBatchReview || {};
  const upstreamOk = Object.entries(expected).every(([key, value]) => batchReview[key] === value);

  checks.push(makeCheck({
    checkId: "01_upstream_batch_contract_review",
    category: "upstream_batch_contract_review",
    status: upstreamOk ? "pass" : "fail",
    severity: upstreamOk ? "info" : "critical",
    message: upstreamOk ? "Step 196 review supports metadata-only manifest design" : "Step 196 review is not eligible for manifest design",
    evidence: Object.keys(expected).map((key) => `${key}:${batchReview[key] || "missing"}`),
    remediation: upstreamOk ? "none" : "restore Step 196 review_ready_execution_blocked status before manifest design",
    blocking: !upstreamOk,
  }));

  const identity = request?.manifestIdentity || {};
  const identityOk = Boolean(identity.manifestId && isPinnedVersion(identity.manifestVersion))
    && identity.manifestPurpose === "dataset_build_dry_run_design"
    && identity.manifestMode === "metadata_only_non_executable"
    && identity.manifestScope === "admin_ai_ml_strategy_lab";
  checks.push(makeCheck({
    checkId: "02_manifest_identity",
    category: "manifest_identity",
    status: identityOk ? "pass" : "fail",
    severity: identityOk ? "info" : "error",
    message: identityOk ? "manifest identity is pinned and non-executable" : "manifest identity is incomplete or executable",
    evidence: [identity.manifestId || "missing_manifest_id", identity.manifestVersion || "missing_version", identity.manifestMode || "missing_mode"],
    remediation: identityOk ? "none" : "pin manifest ID/version and set metadata_only_non_executable mode",
    blocking: !identityOk,
  }));

  const versionPaths = [
    "manifestIdentity.manifestVersion",
    "upstreamReviewReference.reviewVersion",
    "datasetContractReference.datasetSpecVersion",
    "featureSetReference.featureSetVersion",
    "labelSpecReference.labelSpecVersion",
    "splitPolicyReference.splitPolicyVersion",
    "normalizationPolicyReference.normalizationPolicyVersion",
    "qualityPolicyReference.qualityPolicyVersion",
    "sourceMappingReference.sourceMappingVersion",
    "logicalSchemaPlan.logicalSchemaVersion",
    "logicalOutputPlan.proposedSchemaVersion",
    "lineagePlan.datasetSpecVersion",
    "lineagePlan.featureSetVersion",
    "lineagePlan.labelSpecVersion",
    "lineagePlan.splitPolicyVersion",
    "lineagePlan.normalizationPolicyVersion",
    "lineagePlan.qualityPolicyVersion",
    "lineagePlan.sourceMappingVersion",
    "reviewReceiptRequest.receiptVersion",
  ];
  const unpinnedVersions = versionPaths.filter((path) => !isPinnedVersion(getNested(request, path)));
  checks.push(makeCheck({
    checkId: "03_contract_reference_pinning",
    category: "contract_reference_pinning",
    status: unpinnedVersions.length === 0 ? "pass" : "fail",
    severity: unpinnedVersions.length === 0 ? "info" : "error",
    message: unpinnedVersions.length === 0 ? "manifest contract references are explicitly version pinned" : "manifest has missing or floating contract versions",
    evidence: unpinnedVersions.length === 0 ? versionPaths : unpinnedVersions,
    remediation: unpinnedVersions.length === 0 ? "none" : "replace latest/current/auto/unversioned references with explicit versions",
    blocking: unpinnedVersions.length > 0,
  }));

  const inputs = Array.isArray(request?.logicalInputInventory) ? request.logicalInputInventory : [];
  const badInputs = inputs.filter((item) => !item.logicalInputId || !item.sourceType || !isPinnedVersion(item.sourceContractVersion) || !item.eventTimeField || !item.availableAtField || item.accessStatus !== "blocked" || item.materializationStatus !== "not_materialized");
  checks.push(makeCheck({
    checkId: "04_logical_input_inventory",
    category: "logical_input_inventory",
    status: inputs.length === LOGICAL_INPUT_TYPES.length && badInputs.length === 0 ? "pass" : "fail",
    severity: inputs.length === LOGICAL_INPUT_TYPES.length && badInputs.length === 0 ? "info" : "error",
    message: inputs.length === LOGICAL_INPUT_TYPES.length && badInputs.length === 0 ? "logical input inventory is declared without materialization" : "logical input inventory is incomplete or materialized",
    evidence: badInputs.length === 0 ? inputs.map((item) => `${item.logicalInputId}:${item.accessStatus}`) : badInputs.map((item) => item.logicalInputId || "missing_input"),
    remediation: inputs.length === LOGICAL_INPUT_TYPES.length && badInputs.length === 0 ? "none" : "declare all logical inputs with blocked access and not_materialized status",
    blocking: inputs.length !== LOGICAL_INPUT_TYPES.length || badInputs.length > 0,
  }));

  const temporal = request?.temporalBoundaryPlan || {};
  const temporalOk = Boolean(temporal.observationWindowDeclaration && temporal.predictionScheduleReference && temporal.timezone && temporal.marketCalendarPolicy && temporal.cutoffConvention && temporal.lateArrivingDataPolicy && temporal.revisedDataPolicy && temporal.purgeWindowPolicy && temporal.embargoWindowPolicy)
    && compareTime(temporal.featureCutoffTime, "<=", temporal.predictionTime)
    && compareTime(temporal.labelStartTime, ">", temporal.predictionTime)
    && compareTime(temporal.labelEndTime, ">=", temporal.labelStartTime)
    && REQUIRED_TEMPORAL_RULES.every((rule) => (temporal.temporalRules || []).includes(rule));
  checks.push(makeCheck({
    checkId: "05_temporal_boundary_plan",
    category: "temporal_boundary_plan",
    status: temporalOk ? "pass" : "fail",
    severity: temporalOk ? "info" : "critical",
    message: temporalOk ? "temporal boundary plan declares PIT and leakage constraints" : "temporal boundary plan is incomplete or invalid",
    evidence: temporalOk ? REQUIRED_TEMPORAL_RULES : ["temporal_boundary_plan_invalid"],
    remediation: temporalOk ? "none" : "declare observation, prediction, cutoff, calendar, late data, revised data, purge, and embargo policies",
    blocking: !temporalOk,
  }));

  const partition = request?.logicalPartitionPlan || {};
  const partitionOk = Array.isArray(partition.logicalPartitionKeys) && partition.logicalPartitionKeys.length > 0
    && Array.isArray(partition.declaredSortKeys) && partition.declaredSortKeys.length > 0
    && Array.isArray(partition.declaredUniqueKeys) && partition.declaredUniqueKeys.length > 0
    && Boolean(partition.partitionOverlapPolicy)
    && Boolean(partition.emptyPartitionPolicy)
    && Boolean(partition.lateDataHandlingPolicy)
    && Boolean(partition.deduplicationPolicy)
    && partition.partitionMaterializationStatus === "blocked"
    && partition.actualPartitionCountStatus === "not_measured"
    && partition.actualRowCountStatus === "not_measured";
  checks.push(makeCheck({
    checkId: "06_logical_partition_plan",
    category: "logical_partition_plan",
    status: partitionOk ? "pass" : "fail",
    severity: partitionOk ? "info" : "error",
    message: partitionOk ? "logical partition plan is declared without measuring actual rows" : "logical partition plan is incomplete or materialized",
    evidence: partitionOk ? ["partitionMaterializationStatus:blocked", "actualRowCountStatus:not_measured"] : ["partition_plan_invalid"],
    remediation: partitionOk ? "none" : "declare keys, policies, and blocked/not_measured statuses",
    blocking: !partitionOk,
  }));

  const schema = request?.logicalSchemaPlan || {};
  const fields = Array.isArray(schema.fieldDefinitions) ? schema.fieldDefinitions : [];
  const fieldNames = fields.map((field) => field.fieldName);
  const duplicates = fieldNames.filter((fieldName, index) => fieldNames.indexOf(fieldName) !== index);
  const hasPrimaryKeys = Array.isArray(schema.primaryKeyFields) && schema.primaryKeyFields.length > 0 && schema.primaryKeyFields.every((fieldName) => fieldNames.includes(fieldName));
  const hasTemporalSplit = ["event_time", "available_at"].every((fieldName) => fieldNames.includes(fieldName));
  const hasFeatureAndLabelRoles = fields.some((field) => field.semanticRole === "feature") && fields.some((field) => field.semanticRole === "label");
  const labelDerivedFeature = fields.some((field) => field.semanticRole === "feature" && String(field.sourceReference || "").includes("label"));
  const forbiddenField = fields.some((field) => /credential|account|private|secret|token/i.test(field.fieldName));
  const schemaOk = isPinnedVersion(schema.logicalSchemaVersion) && duplicates.length === 0 && hasPrimaryKeys && hasTemporalSplit && hasFeatureAndLabelRoles && !labelDerivedFeature && !forbiddenField;
  checks.push(makeCheck({
    checkId: "07_logical_schema_plan",
    category: "logical_schema_plan",
    status: schemaOk ? "pass" : "fail",
    severity: schemaOk ? "info" : "error",
    message: schemaOk ? "logical schema plan separates keys, temporal fields, features, labels, and metadata" : "logical schema plan is invalid",
    evidence: schemaOk ? [schema.logicalSchemaId || "schema", `fields:${fields.length}`] : [...duplicates, labelDerivedFeature ? "label_derived_feature" : "schema_invalid"].filter(Boolean),
    remediation: schemaOk ? "none" : "remove duplicates, add keys and temporal fields, and keep label-derived values out of features",
    blocking: !schemaOk,
  }));

  const output = request?.logicalOutputPlan || {};
  const outputOk = output.materializationStatus === "blocked"
    && output.outputCreationStatus === "blocked"
    && output.outputPathStatus === "not_assigned"
    && output.fileCreationAuthorization === "denied"
    && output.databaseWriteAuthorization === "denied"
    && isPinnedVersion(output.proposedSchemaVersion);
  checks.push(makeCheck({
    checkId: "08_logical_output_restrictions",
    category: "logical_output_restrictions",
    status: outputOk ? "pass" : "blocked",
    severity: outputOk ? "info" : "critical",
    message: outputOk ? "logical output plan is declared with materialization blocked" : "logical output plan attempts materialization or path assignment",
    evidence: [output.materializationStatus || "missing_materialization", output.outputPathStatus || "missing_path", output.fileCreationAuthorization || "missing_file_auth", output.databaseWriteAuthorization || "missing_db_auth"],
    remediation: outputOk ? "none" : "deny file creation, database write, materialization, and output path assignment",
    blocking: !outputOk,
  }));

  const qualityChecks = Array.isArray(request?.qualityValidationPlan) ? request.qualityValidationPlan : [];
  const qualityIds = qualityChecks.map((item) => item.qualityCheckId);
  const missingQuality = QUALITY_CHECK_IDS.filter((qualityCheckId) => !qualityIds.includes(qualityCheckId));
  const qualityOk = missingQuality.length === 0 && qualityChecks.every((item) => item.executionMode === "declared_not_executed" && item.status === "declared_not_executed");
  checks.push(makeCheck({
    checkId: "09_quality_validation_plan",
    category: "quality_validation_plan",
    status: qualityOk ? "pass" : "fail",
    severity: qualityOk ? "info" : "error",
    message: qualityOk ? "quality validation plan is declared without execution" : "quality validation plan is incomplete or executed",
    evidence: qualityOk ? QUALITY_CHECK_IDS : missingQuality,
    remediation: qualityOk ? "none" : "declare all quality checks with declared_not_executed mode",
    blocking: !qualityOk,
  }));

  const lineage = request?.lineagePlan || {};
  const lineageVersionFields = ["datasetSpecVersion", "featureSetVersion", "labelSpecVersion", "splitPolicyVersion", "normalizationPolicyVersion", "qualityPolicyVersion", "sourceMappingVersion"];
  const lineageOk = lineageVersionFields.every((field) => isPinnedVersion(lineage[field]))
    && Boolean(lineage.parentBatchContractReviewId)
    && lineage.lineageMode === "pinned_contract_ids_and_versions_only"
    && Array.isArray(lineage.architectureStepReferences)
    && lineage.architectureStepReferences.length >= 5;
  checks.push(makeCheck({
    checkId: "10_lineage_plan",
    category: "lineage_plan",
    status: lineageOk ? "pass" : "fail",
    severity: lineageOk ? "info" : "error",
    message: lineageOk ? "lineage plan uses pinned IDs and versions only" : "lineage plan is incomplete",
    evidence: lineageOk ? lineageVersionFields : ["lineage_plan_invalid"],
    remediation: lineageOk ? "none" : "declare pinned contract references without derived values",
    blocking: !lineageOk,
  }));

  const governance = request?.governanceAndRetentionPlan || {};
  const governanceOk = governance.piiPresenceDeclaration === "none_declared"
    && governance.credentialExclusionDeclaration === "excluded"
    && governance.rawAccountDataDeclaration === "excluded"
    && governance.persistenceStatus === "blocked"
    && Boolean(governance.redactionPolicyReference)
    && Boolean(governance.auditMetadataPolicy)
    && Boolean(governance.lineageRetentionPolicy);
  checks.push(makeCheck({
    checkId: "11_governance_and_retention",
    category: "governance_and_retention",
    status: governanceOk ? "pass" : "fail",
    severity: governanceOk ? "info" : "error",
    message: governanceOk ? "governance and retention plan excludes sensitive values and persistence" : "governance and retention plan is incomplete",
    evidence: [governance.piiPresenceDeclaration || "missing_pii", governance.credentialExclusionDeclaration || "missing_credential", governance.persistenceStatus || "missing_persistence"],
    remediation: governanceOk ? "none" : "declare PII, credential, account, retention, redaction, audit, lineage, and persistence boundaries",
    blocking: !governanceOk,
  }));

  const envelope = request?.resourceEnvelope || {};
  const requiredEnvelope = ["declaredMaxRows", "declaredMaxFeatures", "declaredMaxPartitions", "declaredMemoryClass", "declaredRuntimeClass", "declaredConcurrency", "declaredRetryLimit"];
  const missingEnvelope = requiredEnvelope.filter((field) => envelope[field] === undefined || envelope[field] === null || envelope[field] === "");
  const envelopeOk = missingEnvelope.length === 0
    && envelope.actualRowsMeasured === false
    && envelope.actualRuntimeMeasured === false
    && envelope.actualMemoryMeasured === false
    && envelope.actualCostCalculated === false;
  checks.push(makeCheck({
    checkId: "12_resource_envelope",
    category: "resource_envelope",
    status: envelopeOk ? "pass" : "fail",
    severity: envelopeOk ? "info" : "warning",
    message: envelopeOk ? "resource envelope declares limits without actual measurement" : "resource envelope is incomplete or measured",
    evidence: envelopeOk ? requiredEnvelope : missingEnvelope,
    remediation: envelopeOk ? "none" : "declare limits and keep actual measurements false",
    blocking: !envelopeOk,
    manualReviewRequired: true,
  }));

  const receipt = buildDatasetBuildManifestReviewReceipt(request);
  const receiptAttempt = detectReviewReceiptBoundaryAttempt(request);
  const receiptAttemptBlocked = receiptAttempt.attemptsApproval
    || receiptAttempt.attemptsExecutionAuthority
    || receiptAttempt.attemptsPersistence
    || receiptAttempt.attemptsDownload
    || receiptAttempt.attemptsReviewDecisionEscalation;
  const receiptOk = receipt.receiptType === "metadata_only_design_review_receipt"
    && receipt.reviewDecision === "design_contract_record_only"
    && receipt.approvalStatus === "not_granted"
    && receipt.executionAuthorizationStatus === "denied"
    && receipt.persisted === false
    && receipt.downloadable === false
    && receipt.doesNotGrantApproval === true
    && receipt.doesNotGrantExecution === true
    && isPinnedVersion(receipt.receiptVersion)
    && !receiptAttemptBlocked;
  checks.push(makeCheck({
    checkId: "13_review_receipt_boundary",
    category: "review_receipt_boundary",
    status: receiptOk ? "pass" : "blocked",
    severity: receiptOk ? "info" : "critical",
    message: receiptOk ? "review receipt is generated in memory and grants no approval or execution" : "review receipt attempts persistence, download, approval, or execution",
    evidence: [
      `persisted:${receipt.persisted}`,
      `downloadable:${receipt.downloadable}`,
      `approval:${receipt.approvalStatus}`,
      `execution:${receipt.executionAuthorizationStatus}`,
      `attemptsApproval:${receiptAttempt.attemptsApproval}`,
      `attemptsExecutionAuthority:${receiptAttempt.attemptsExecutionAuthority}`,
      `attemptsPersistence:${receiptAttempt.attemptsPersistence}`,
      `attemptsDownload:${receiptAttempt.attemptsDownload}`,
    ],
    remediation: receiptOk ? "none" : "keep receipt generated_not_persisted and deny approval/execution",
    blocking: !receiptOk,
  }));

  const executionBoundaryOk = request?.manifestIdentity?.manifestMode === "metadata_only_non_executable"
    && request?.logicalPartitionPlan?.partitionMaterializationStatus === "blocked"
    && request?.logicalOutputPlan?.materializationStatus === "blocked"
    && request?.logicalOutputPlan?.outputCreationStatus === "blocked";
  checks.push(makeCheck({
    checkId: "14_execution_boundary",
    category: "execution_boundary",
    status: executionBoundaryOk ? "pass" : "blocked",
    severity: executionBoundaryOk ? "info" : "critical",
    message: executionBoundaryOk ? "manifest is non-executable and materialization is blocked" : "manifest boundary allows execution or materialization",
    evidence: [request?.manifestIdentity?.manifestMode || "missing_mode", request?.logicalOutputPlan?.materializationStatus || "missing_materialization"],
    remediation: executionBoundaryOk ? "none" : "restore non-executable manifest mode and blocked materialization",
    blocking: !executionBoundaryOk,
  }));

  const externalOk = upstreamStatuses.readinessSummary?.orderAuthorityStatus === "external_blocker" && upstreamStatuses.readinessSummary?.liveTradingStatus === "blocked";
  checks.push(makeCheck({
    checkId: "15_external_authority_context",
    category: "external_authority_context",
    status: externalOk ? "manual_review_required" : "fail",
    severity: externalOk ? "warning" : "critical",
    message: "external order authority remains separate from manifest design",
    evidence: [`orderAuthorityStatus:${upstreamStatuses.readinessSummary?.orderAuthorityStatus || "missing"}`, `liveTradingStatus:${upstreamStatuses.readinessSummary?.liveTradingStatus || "missing"}`],
    remediation: "do not infer order or live authority from manifest design",
    blocking: false,
    manualReviewRequired: true,
  }));

  const actions = request?.executionIntent?.requestedActions || [];
  const prohibitedActions = actions.filter((action) => PROHIBITED_EXECUTION_INTENTS.includes(action));
  checks.push(makeCheck({
    checkId: "16_prohibited_execution_intent",
    category: "prohibited_execution_intent",
    status: prohibitedActions.length === 0 ? "pass" : "blocked",
    severity: prohibitedActions.length === 0 ? "info" : "critical",
    message: prohibitedActions.length === 0 ? "execution intent is manifest metadata only" : "prohibited execution intent is blocked",
    evidence: prohibitedActions.length === 0 ? ["record_manifest_contract_metadata"] : prohibitedActions,
    remediation: prohibitedActions.length === 0 ? "none" : "remove data, file, DB, provider, dry-run, training, receipt persistence, approval, and order intents",
    blocking: prohibitedActions.length > 0,
  }));

  return sortByKey(checks, "checkId");
}

export function deriveDatasetBuildManifestOutcome(checks) {
  if (checks.some((check) => check.category === "upstream_batch_contract_review" && check.status === "fail")) {
    return "invalid_upstream_review";
  }
  if (checks.some((check) => check.status === "blocked")) return "blocked_by_safety_policy";
  if (checks.some((check) => check.status === "fail")) return "manifest_needs_revision";
  return "manifest_design_ready_execution_blocked";
}

export function evaluateAiMlDatasetBuildDryRunManifest(input = {}, options = {}) {
  const request = input.request || createDeterministicMockDatasetBuildManifestRequest(input.requestOverrides || {});
  const upstreamStatuses = collectDatasetBuildManifestUpstreamStatuses(input, options);
  const manifestSections = buildDatasetBuildManifestSections(request);
  const validationChecks = buildDatasetBuildManifestValidationChecks(request, upstreamStatuses);
  const reviewReceipt = buildDatasetBuildManifestReviewReceipt(request);
  const overallStatus = deriveDatasetBuildManifestOutcome(validationChecks);
  const manifestDesignStatus = overallStatus === "manifest_design_ready_execution_blocked" ? "complete" : "needs_revision";
  const passCount = validationChecks.filter((check) => check.status === "pass").length;
  const failCount = validationChecks.filter((check) => check.status === "fail").length;
  const blockedCount = validationChecks.filter((check) => check.status === "blocked").length;
  const manualReviewRequiredCount = validationChecks.filter((check) => check.status === "manual_review_required" || check.manualReviewRequired).length;

  return {
    manifestId: request.manifestIdentity?.manifestId || "missing_manifest",
    manifestVersion: request.manifestIdentity?.manifestVersion || "missing_version",
    scope: "admin_ai_ml_strategy_lab",
    manifestMode: "metadata_only_non_executable",
    manifestDesignStatus,
    reviewReceiptStatus: "generated_not_persisted",
    reviewDecision: "design_contract_record_only",
    approvalStatus: "not_granted",
    approvalScope: "dry_run_manifest_design_only",
    executionAuthorizationStatus: "denied",
    dryRunExecutionStatus: "blocked",
    materializationStatus: "blocked",
    outputCreationStatus: "blocked",
    outputPathStatus: "not_assigned",
    overallStatus,
    upstreamReviewStatus: upstreamStatuses.batchContractReview?.overallStatus || "missing",
    upstreamReviewEligibilityStatus: upstreamStatuses.batchContractReview?.reviewEligibilityStatus || "missing",
    externalAuthorityStatus: upstreamStatuses.readinessSummary?.orderAuthorityStatus || "external_blocker",
    liveTradingStatus: upstreamStatuses.readinessSummary?.liveTradingStatus || "blocked",
    manifestSummary: {
      manifestPurpose: request.manifestIdentity?.manifestPurpose || "missing",
      manifestScope: request.manifestIdentity?.manifestScope || "missing",
      logicalInputCount: request.logicalInputInventory?.length || 0,
      logicalSchemaFieldCount: request.logicalSchemaPlan?.fieldDefinitions?.length || 0,
      qualityCheckCount: request.qualityValidationPlan?.length || 0,
      redacted: true,
    },
    contractVersionCoverage: {
      datasetSpecVersion: request.datasetContractReference?.datasetSpecVersion || "missing",
      featureSetVersion: request.featureSetReference?.featureSetVersion || "missing",
      labelSpecVersion: request.labelSpecReference?.labelSpecVersion || "missing",
      splitPolicyVersion: request.splitPolicyReference?.splitPolicyVersion || "missing",
      normalizationPolicyVersion: request.normalizationPolicyReference?.normalizationPolicyVersion || "missing",
      qualityPolicyVersion: request.qualityPolicyReference?.qualityPolicyVersion || "missing",
      sourceMappingVersion: request.sourceMappingReference?.sourceMappingVersion || "missing",
      redacted: true,
    },
    logicalInputSummary: {
      logicalInputCount: request.logicalInputInventory?.length || 0,
      inputTypes: (request.logicalInputInventory || []).map((item) => item.sourceType).sort(),
      accessStatus: "blocked",
      materializationStatus: "not_materialized",
      redacted: true,
    },
    logicalPartitionSummary: {
      logicalPartitionKeys: [...(request.logicalPartitionPlan?.logicalPartitionKeys || [])].sort(),
      declaredPartitionCount: request.logicalPartitionPlan?.declaredPartitionCount || 0,
      declaredEstimatedRows: request.logicalPartitionPlan?.declaredEstimatedRows || 0,
      actualPartitionCountStatus: request.logicalPartitionPlan?.actualPartitionCountStatus || "not_measured",
      actualRowCountStatus: request.logicalPartitionPlan?.actualRowCountStatus || "not_measured",
      partitionMaterializationStatus: "blocked",
      redacted: true,
    },
    logicalSchemaSummary: {
      logicalSchemaId: request.logicalSchemaPlan?.logicalSchemaId || "missing",
      logicalSchemaVersion: request.logicalSchemaPlan?.logicalSchemaVersion || "missing",
      fieldCount: request.logicalSchemaPlan?.fieldDefinitions?.length || 0,
      primaryKeyFields: [...(request.logicalSchemaPlan?.primaryKeyFields || [])].sort(),
      featureFieldCount: request.logicalSchemaPlan?.featureFields?.length || 0,
      labelFieldCount: request.logicalSchemaPlan?.labelFields?.length || 0,
      redacted: true,
    },
    logicalOutputSummary: {
      proposedLogicalDatasetId: request.logicalOutputPlan?.proposedLogicalDatasetId || "missing",
      proposedOutputFormat: request.logicalOutputPlan?.proposedOutputFormat || "missing",
      proposedSchemaVersion: request.logicalOutputPlan?.proposedSchemaVersion || "missing",
      materializationStatus: "blocked",
      outputCreationStatus: "blocked",
      outputPathStatus: "not_assigned",
      fileCreationAuthorization: "denied",
      databaseWriteAuthorization: "denied",
      redacted: true,
    },
    governanceSummary: {
      piiPresenceDeclaration: request.governanceAndRetentionPlan?.piiPresenceDeclaration || "none_declared",
      credentialExclusionDeclaration: request.governanceAndRetentionPlan?.credentialExclusionDeclaration || "excluded",
      rawAccountDataDeclaration: request.governanceAndRetentionPlan?.rawAccountDataDeclaration || "excluded",
      persistenceStatus: request.governanceAndRetentionPlan?.persistenceStatus || "blocked",
      redacted: true,
    },
    resourceEnvelopeSummary: {
      declaredMaxRows: request.resourceEnvelope?.declaredMaxRows || 0,
      declaredMaxFeatures: request.resourceEnvelope?.declaredMaxFeatures || 0,
      declaredMaxPartitions: request.resourceEnvelope?.declaredMaxPartitions || 0,
      actualRowsMeasured: false,
      actualRuntimeMeasured: false,
      actualMemoryMeasured: false,
      actualCostCalculated: false,
      redacted: true,
    },
    lineageSummary: {
      parentBatchContractReviewId: request.lineagePlan?.parentBatchContractReviewId || "missing",
      architectureStepReferences: [...(request.lineagePlan?.architectureStepReferences || [])].sort(),
      lineageMode: request.lineagePlan?.lineageMode || "missing",
      redacted: true,
    },
    reviewReceipt,
    manifestSections,
    validationCategories: [...VALIDATION_CATEGORIES],
    validationChecks,
    passCount,
    failCount,
    blockedCount,
    manualReviewRequiredCount,
    failClosedPrecedence: [...FAIL_CLOSED_PRECEDENCE],
    scenarioCatalog: [...SCENARIO_CATALOG],
    nextSafeImplementationStep: "dataset_build_dry_run_manifest_review_receipt_contract",
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
    redacted: true,
  };
}

export function buildAiMlDatasetBuildDryRunManifest(input = {}, options = {}) {
  return evaluateAiMlDatasetBuildDryRunManifest(input, options);
}

export function buildAdminTradingAiMlDatasetBuildDryRunManifestStatus(input = {}, options = {}) {
  const manifest = input.manifest || buildAiMlDatasetBuildDryRunManifest(input, options);
  return {
    ok: true,
    step: "Step 197: Add AI/ML dataset build dry-run manifest contract",
    status: "admin_only_ai_ml_dataset_build_dry_run_manifest_read_only",
    sourceStep: "step197",
    manifestModel: TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL,
    manifest,
    blockedConfirmation: {
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      featureFileCreated: false,
      datasetBuildAttempted: false,
      datasetFileCreated: false,
      batchExecutionAttempted: false,
      dryRunExecutionAttempted: false,
      manifestFileCreated: false,
      schemaMaterializationAttempted: false,
      partitionMaterializationAttempted: false,
      outputPathAssigned: false,
      pythonJobAttempted: false,
      modelTrainingAttempted: false,
      modelArtifactCreated: false,
      modelDeploymentAttempted: false,
      dbMigrationAttempted: false,
      dbReadAttempted: false,
      dbWriteAttempted: false,
      persistentStorageAttempted: false,
      providerCallAttempted: false,
      quoteCallAttempted: false,
      kisCallAttempted: false,
      kisTokenIssuanceAttempted: false,
      reviewReceiptPersisted: false,
      approvalPersistenceAttempted: false,
      executionAuthorizationGranted: false,
      orderSubmissionAttempted: false,
      liveTradingAttempted: false,
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS },
    adminReadOnlyManifestDesignAllowed: true,
    deterministicInMemoryManifestAllowed: true,
    metadataOnlyReviewReceiptAllowed: true,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
    batchExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    manifestFileCreationAllowed: false,
    schemaMaterializationAllowed: false,
    partitionMaterializationAllowed: false,
    outputPathAssignmentAllowed: false,
    pythonFeatureJobAllowed: false,
    modelTrainingAllowed: false,
    modelArtifactCreationAllowed: false,
    modelDeploymentAllowed: false,
    modelAutoApprovalAllowed: false,
    dbMigrationAllowed: false,
    dbReadAllowed: false,
    dbWriteAllowed: false,
    persistentStorageAllowed: false,
    providerCallsAllowed: false,
    quoteCallsAllowed: false,
    kisCallsAllowed: false,
    kisTokenIssuanceAllowed: false,
    manualApprovalPersistenceAllowed: false,
    reviewReceiptPersistenceAllowed: false,
    executionAuthorizationAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
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
    redacted: true,
  };
}
