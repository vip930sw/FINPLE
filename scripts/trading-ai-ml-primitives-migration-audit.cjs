const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS = Object.freeze([
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "datasetBuildAllowed",
  "batchExecutionAllowed",
  "dryRunExecutionAllowed",
  "schemaMaterializationAllowed",
  "partitionMaterializationAllowed",
  "outputPathAssignmentAllowed",
  "reportPersistenceAllowed",
  "exceptionPersistenceAllowed",
  "remediationPersistenceAllowed",
  "handoffExecutionAllowed",
  "handoffTransmissionAllowed",
  "handoffPersistenceAllowed",
  "dbMigrationAllowed",
  "dbReadAllowed",
  "dbWriteAllowed",
  "persistentStorageAllowed",
  "providerCallsAllowed",
  "quoteCallsAllowed",
  "kisCallsAllowed",
  "kisTokenIssuanceAllowed",
  "pythonFeatureJobAllowed",
  "modelTrainingAllowed",
  "modelDeploymentAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForBatchExecution",
  "readyForDryRunExecution",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
]);

const AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS = Object.freeze([
  "step194",
  "step195",
  "step196",
  "step197",
  "step198",
  "step199",
  "step200",
]);

const AI_ML_PRIMITIVE_MIGRATION_HELPERS = Object.freeze([
  "cloneAiMlMetadata",
  "normalizeAiMlMetadataArray",
  "sanitizeAiMlMetadataArray",
  "sanitizeAiMlMetadataValue",
  "sortAiMlMetadataByKey",
]);

const LEGACY_FULL_FALSE_OBJECT_KEYS = Object.freeze([
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "datasetBuildAllowed: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
]);

const LEGACY_HELPER_PATTERNS = Object.freeze([
  { helperId: "locale_compare_metadata_sort", pattern: "localeCompare", allowedStageSpecificAdapter: null },
  { helperId: "json_parse_stringify_clone", pattern: "JSON.parse(JSON.stringify", allowedStageSpecificAdapter: null },
  { helperId: "safe_array_helper", pattern: "function safeArray", allowedStageSpecificAdapter: null },
  { helperId: "duplicated_sensitive_pattern_matcher", pattern: "SENSITIVE_METADATA_PATTERNS", allowedStageSpecificAdapter: null },
  { helperId: "duplicated_metadata_sanitizer", pattern: "function sanitizeMetadata", allowedStageSpecificAdapter: null },
  { helperId: "step198_redacted_evidence_adapter", pattern: "STEP198_SENSITIVE_EVIDENCE_PATTERNS", allowedStageSpecificAdapter: "redacted_evidence_output_adapter" },
]);

const AI_ML_PRIMITIVE_MIGRATION_STAGES = Object.freeze([
  Object.freeze({
    stepId: "step194",
    label: "Step 194",
    stageId: "step194_feature_pipeline_preflight",
    serviceFile: "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
    testFile: "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
    checkerFile: "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.cjs",
    checkerTestFile: "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
    inheritedFlagExport: "STEP193_AI_ML_FEATURE_PIPELINE_FLAGS",
    metadataAllowlistExport: "STEP194_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP194_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "metadataOnlyPreflightEvaluationAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "metadata_only_preflight",
      "valid_contract_execution_blocked",
      "blocked",
      "ai_ml_feature_batch_preflight_review",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_valid_metadata_contract",
      "scenario_b_unknown_feature",
      "scenario_c_future_available_at_leakage",
      "scenario_d_label_overlap",
      "scenario_e_insufficient_rolling_history",
      "scenario_f_invalid_normalization_scope",
      "scenario_g_unconditional_zero_fill",
      "scenario_h_unpinned_version",
      "scenario_i_prohibited_execution_intent",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "scenario J shared flag compatibility",
      "scenario K inherited true execution conflict",
      "scenario L explicit metadata allowlist",
      "scenario M shared helper compatibility",
      "scenario N full default output remains compatible",
      "scenario O shared clone use prevents input",
    ]),
  }),
  Object.freeze({
    stepId: "step195",
    label: "Step 195",
    stageId: "step195_readiness_gate_summary",
    serviceFile: "server/src/services/tradingAiMlReadinessGateSummary.js",
    testFile: "server/src/services/tradingAiMlReadinessGateSummary.test.js",
    checkerFile: "scripts/check-trading-step195-ai-ml-readiness-gate-summary.cjs",
    checkerTestFile: "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
    inheritedFlagExport: "STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS",
    metadataAllowlistExport: "STEP195_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP195_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP195_AI_ML_READINESS_GATE_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "metadataOnlyPreflightEvaluationAllowed",
      "adminReadOnlyReadinessAggregationAllowed",
      "deterministicStatusCompositionAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "internal_contracts_valid_execution_blocked",
      "blocked",
      "external_blocker",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_current_valid_internal_contracts",
      "scenario_b_missing_source_contract",
      "scenario_c_invalid_preflight",
      "scenario_d_prohibited_permission_conflict",
      "scenario_e_public_exposure_conflict",
      "scenario_f_external_order_authority_blocker",
      "scenario_g_deterministic_ordering",
      "scenario_h_mutation_resistance",
      "scenario_i_shared_flag_compatibility",
      "scenario_j_inherited_execution_conflict",
      "scenario_k_explicit_metadata_allowlist",
      "scenario_l_shared_helper_compatibility",
      "scenario_m_full_default_output_compatibility",
      "scenario_n_mutation_resistance",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step195 scenario I shared flag compatibility",
      "Step195 scenario J inherited execution conflict",
      "Step195 scenario K explicit metadata allowlist",
      "Step195 scenario L shared helper compatibility",
      "Step195 scenario M full default output remains compatible",
      "Step195 scenario N shared clone use prevents source",
    ]),
  }),
  Object.freeze({
    stepId: "step196",
    label: "Step 196",
    stageId: "step196_batch_contract_review",
    serviceFile: "server/src/services/tradingAiMlBatchContractReview.js",
    testFile: "server/src/services/tradingAiMlBatchContractReview.test.js",
    checkerFile: "scripts/check-trading-step196-ai-ml-batch-contract-review.cjs",
    checkerTestFile: "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
    inheritedFlagExport: "STEP195_AI_ML_READINESS_GATE_FLAGS",
    metadataAllowlistExport: "STEP196_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP196_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "adminReadOnlyReadinessAggregationAllowed",
      "deterministicStatusCompositionAllowed",
      "metadataOnlyPreflightEvaluationAllowed",
      "adminReadOnlyBatchContractReviewAllowed",
      "deterministicMetadataChecklistAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "review_ready_execution_blocked",
      "not_granted",
      "denied",
      "blocked",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_review_ready_metadata_contract",
      "scenario_b_invalid_upstream_readiness",
      "scenario_c_missing_version_pin",
      "scenario_d_prohibited_output_intent",
      "scenario_e_provider_or_db_intent",
      "scenario_f_missing_required_reviewer",
      "scenario_g_invalid_partition_declaration",
      "scenario_h_external_order_authority_blocker",
      "scenario_i_deterministic_ordering",
      "scenario_j_mutation_resistance",
      "scenario_k_shared_flag_compatibility",
      "scenario_l_inherited_true_execution_conflict",
      "scenario_m_explicit_metadata_allowlist",
      "scenario_n_shared_helper_compatibility",
      "scenario_o_full_default_output_compatibility",
      "scenario_p_mutation_resistance",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step196 scenario K shared flag compatibility",
      "Step196 scenario L inherited true execution conflict",
      "Step196 scenario M explicit metadata allowlist",
      "Step196 scenario N shared helper compatibility",
      "Step196 scenario O full default output remains compatible",
      "Step196 scenario P shared clone use prevents source",
    ]),
  }),
  Object.freeze({
    stepId: "step197",
    label: "Step 197",
    stageId: "step197_dataset_build_manifest",
    serviceFile: "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
    testFile: "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
    checkerFile: "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.cjs",
    checkerTestFile: "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
    inheritedFlagExport: "STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS",
    metadataAllowlistExport: "STEP197_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP197_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "adminReadOnlyReadinessAggregationAllowed",
      "deterministicStatusCompositionAllowed",
      "metadataOnlyPreflightEvaluationAllowed",
      "adminReadOnlyBatchContractReviewAllowed",
      "deterministicMetadataChecklistAllowed",
      "adminReadOnlyManifestDesignAllowed",
      "deterministicInMemoryManifestAllowed",
      "metadataOnlyReviewReceiptAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "manifest_design_ready_execution_blocked",
      "generated_not_persisted",
      "not_assigned",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
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
      "scenario_m_shared_flag_output_compatibility",
      "scenario_n_inherited_true_execution_conflict",
      "scenario_o_metadata_true_allowlist",
      "scenario_p_shared_helper_deterministic_compatibility",
      "scenario_q_full_default_output_compatibility",
      "scenario_r_shared_clone_mutation_resistance",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step197 scenario M shared flag output compatibility",
      "Step197 scenario N inherited true execution conflict",
      "Step197 scenario O metadata true allowlist",
      "Step197 scenario P shared helper compatibility",
      "Step197 scenario Q full default output remains compatible",
      "Step197 scenario R shared clone use prevents source",
    ]),
  }),
  Object.freeze({
    stepId: "step198",
    label: "Step 198",
    stageId: "step198_manifest_validation_report",
    serviceFile: "server/src/services/tradingAiMlManifestValidationReport.js",
    testFile: "server/src/services/tradingAiMlManifestValidationReport.test.js",
    checkerFile: "scripts/check-trading-step198-ai-ml-manifest-validation-report.cjs",
    checkerTestFile: "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
    inheritedFlagExport: "STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
    metadataAllowlistExport: "STEP198_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP198_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "adminReadOnlyManifestDesignAllowed",
      "deterministicInMemoryManifestAllowed",
      "metadataOnlyReviewReceiptAllowed",
      "adminReadOnlyManifestValidationReportAllowed",
      "deterministicInMemoryReportAllowed",
      "deterministicExceptionClassificationAllowed",
      "metadataOnlyRemediationQueueAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "validation_report_ready_execution_blocked",
      "generated_in_memory",
      "generated_not_persisted",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_valid_step197_source",
      "scenario_b_invalid_source_manifest",
      "scenario_c_source_safety_block",
      "scenario_d_source_needs_revision",
      "scenario_e_critical_boundary_exception",
      "scenario_f_manual_review_item_only",
      "scenario_g_waiver_grant_attempt",
      "scenario_h_persistence_attempt",
      "scenario_i_deterministic_ordering",
      "scenario_j_mutation_resistance",
      "scenario_k_sensitive_data_redaction",
      "scenario_l_shared_flag_output_compatibility",
      "scenario_m_inherited_true_execution_conflict",
      "scenario_n_metadata_true_allowlist",
      "scenario_o_shared_helper_deterministic_compatibility",
      "scenario_p_full_default_output_compatibility",
      "scenario_q_shared_clone_mutation_resistance",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step198 scenario L shared flag output compatibility",
      "Step198 scenario M inherited true execution conflict",
      "Step198 scenario N metadata true allowlist",
      "Step198 scenario O shared helper compatibility",
      "Step198 scenario P full default output remains compatible",
      "Step198 scenario Q shared clone use prevents report",
    ]),
  }),
  Object.freeze({
    stepId: "step199",
    label: "Step 199",
    stageId: "step199_manifest_handoff_eligibility",
    serviceFile: "server/src/services/tradingAiMlManifestHandoffEligibility.js",
    testFile: "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
    checkerFile: "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.cjs",
    checkerTestFile: "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
    inheritedFlagExport: "STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
    metadataAllowlistExport: "STEP199_METADATA_ONLY_ALLOWED_FLAGS",
    additionalFalseFlagsExport: "STEP199_ADDITIONAL_FALSE_FLAGS",
    runtimeFlagExport: "STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "adminReadOnlyManifestValidationReportAllowed",
      "deterministicInMemoryReportAllowed",
      "deterministicExceptionClassificationAllowed",
      "metadataOnlyRemediationQueueAllowed",
      "adminReadOnlyHandoffEligibilityAllowed",
      "deterministicInMemoryHandoffPackageAllowed",
      "metadataOnlyApprovalRequirementDeclarationAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "handoff_candidate_ready_execution_blocked",
      "eligible_for_manual_review",
      "not_granted",
      "denied",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_valid_handoff_candidate",
      "scenario_b_invalid_source_report",
      "scenario_c_source_safety_block",
      "scenario_d_source_revision_required",
      "scenario_e_non_waivable_safety_exception",
      "scenario_f_missing_immutable_reference",
      "scenario_g_missing_approval_role",
      "scenario_h_approval_or_waiver_grant_attempt",
      "scenario_i_handoff_persistence_or_transmission_attempt",
      "scenario_j_target_preflight_execution_attempt",
      "scenario_k_external_authority_context",
      "scenario_l_deterministic_ordering",
      "scenario_m_mutation_resistance",
      "scenario_n_sensitive_data_redaction",
      "scenario_o_shared_flag_output_compatibility",
      "scenario_p_inherited_true_execution_conflict",
      "scenario_q_metadata_true_allowlist",
      "scenario_r_shared_helper_deterministic_compatibility",
      "scenario_s_full_default_output_compatibility",
      "scenario_t_input_mutation_resistance",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step202 scenario O shared flag output compatibility",
      "Step202 scenario P inherited true execution conflict",
      "Step202 scenario Q metadata true allowlist",
      "Step202 scenario R shared helper compatibility",
      "Step202 scenario S full default output remains compatible",
      "Step202 scenario T shared clone use prevents input",
    ]),
  }),
  Object.freeze({
    stepId: "step200",
    label: "Step 200",
    stageId: "step200_architecture_milestone_review",
    serviceFile: "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
    testFile: "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
    checkerFile: "scripts/check-trading-step200-ai-ml-architecture-milestone-review.cjs",
    checkerTestFile: "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs",
    inheritedFlagExport: "STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS",
    metadataAllowlistExport: "inline_allowedMetadataFlags",
    additionalFalseFlagsExport: "not_required_common_fail_closed_only",
    runtimeFlagExport: "STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS",
    requiredProtectedFlags: Object.freeze([
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "providerCallsAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "orderSubmissionAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ]),
    notApplicableProtectedFlags: Object.freeze([]),
    expectedAllowlistKeys: Object.freeze([
      "adminReadOnlyMilestoneReviewAllowed",
      "deterministicArchitectureInventoryAllowed",
      "deterministicConsolidationPlanningAllowed",
      "metadataOnlyRuntimePrerequisiteDeclarationAllowed",
    ]),
    expectedOutputMarkers: Object.freeze([
      "architecture_milestone_complete_execution_blocked",
      "contract_chain_complete",
      "consolidation_required",
      "consolidate_before_runtime",
    ]),
    migrationRegressionTestFiles: Object.freeze([
      "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
      "server/src/services/tradingAiMlContractPrimitives.test.js",
      "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
      "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
    ]),
    expectedContractScenarioMarkers: Object.freeze([
      "scenario_a_current_step191_to_step199_chain",
      "scenario_b_missing_stage",
      "scenario_c_dependency_order_conflict",
      "scenario_d_safety_permission_conflict",
      "scenario_e_public_exposure_conflict",
      "scenario_f_runtime_falsely_marked_implemented",
      "scenario_g_consolidation_plan_coverage",
      "scenario_h_runtime_prerequisite_coverage",
      "scenario_i_deterministic_ordering",
      "scenario_j_mutation_resistance",
      "scenario_k_sensitive_data_redaction",
    ]),
    expectedMigrationRegressionTestMarkers: Object.freeze([
      "Step201 scenario J Step 200 default output remains compatible",
      "Step201 scenario K Step 200 fail-closed override",
      "Object.values(AI_ML_STAGE_IDS)",
      "falseFlagSnapshot.providerCallsAllowed",
    ]),
  }),
]);

function read(repoRoot, filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function fileExists(repoRoot, filePath) {
  return fs.existsSync(path.join(repoRoot, filePath));
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function getFlagDefinitionSegment(source, runtimeFlagExport) {
  const start = source.indexOf(`export const ${runtimeFlagExport}`);
  if (start < 0) return "";
  const nextExport = source.indexOf("\nexport const ", start + 1);
  const nextModel = source.indexOf("\nexport function ", start + 1);
  const candidates = [nextExport, nextModel].filter((index) => index > start);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}

function listTrueKeys(flags) {
  return Object.entries(flags || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
}

function uniqueSorted(values) {
  return Object.freeze([...new Set(values)].sort());
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values || []) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return Object.freeze([...duplicates].sort());
}

function listStageMigrationSources(repoRoot, stage) {
  const files = stage.migrationRegressionTestFiles || [
    stage.testFile,
    stage.checkerTestFile,
  ];
  return files.map((file) => read(repoRoot, file)).join("\n");
}

function validateAiMlMigrationScenarioTaxonomy(stages = AI_ML_PRIMITIVE_MIGRATION_STAGES) {
  const errors = [];
  const stageOrder = (stages || []).map((stage) => stage.stepId);
  if (JSON.stringify(stageOrder) !== JSON.stringify([...AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS])) {
    errors.push("stage order mismatch");
  }

  for (const stage of stages || []) {
    const contractMarkers = stage.expectedContractScenarioMarkers;
    const migrationMarkers = stage.expectedMigrationRegressionTestMarkers;
    if (!Array.isArray(contractMarkers)) errors.push(`${stage.stepId} expectedContractScenarioMarkers missing`);
    if (!Array.isArray(migrationMarkers)) errors.push(`${stage.stepId} expectedMigrationRegressionTestMarkers missing`);
    if (!Array.isArray(contractMarkers) || !Array.isArray(migrationMarkers)) continue;

    for (const [markerType, markers] of [
      ["contract", contractMarkers],
      ["migration", migrationMarkers],
    ]) {
      for (const marker of markers) {
        if (typeof marker !== "string" || marker.trim() === "") {
          errors.push(`${stage.stepId} empty ${markerType} marker`);
        }
      }
      for (const duplicate of findDuplicates(markers)) {
        errors.push(`${stage.stepId} duplicate ${markerType} marker: ${duplicate}`);
      }
    }

    const migrationSet = new Set(migrationMarkers);
    for (const marker of contractMarkers) {
      if (migrationSet.has(marker)) {
        errors.push(`${stage.stepId} contract/migration marker overlap: ${marker}`);
      }
    }

    if (stage.stepId === "step194") {
      if (contractMarkers.length !== 9) errors.push("step194 contract scenario marker count mismatch");
      if (migrationMarkers.length !== 6) errors.push("step194 migration regression marker count mismatch");
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function validateAiMlProtectedFlagStageRegistry(stages = AI_ML_PRIMITIVE_MIGRATION_STAGES) {
  const errors = [];
  const protectedFlags = [...AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS].sort();
  const stageOrder = (stages || []).map((stage) => stage.stepId);

  if (JSON.stringify(stageOrder) !== JSON.stringify([...AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS])) {
    errors.push("stage order mismatch");
  }

  for (const stage of stages || []) {
    const required = stage.requiredProtectedFlags;
    const notApplicable = stage.notApplicableProtectedFlags;
    if (!Array.isArray(required)) errors.push(`${stage.stepId} requiredProtectedFlags missing`);
    if (!Array.isArray(notApplicable)) errors.push(`${stage.stepId} notApplicableProtectedFlags missing`);
    if (!Array.isArray(required) || !Array.isArray(notApplicable)) continue;

    for (const duplicate of findDuplicates(required)) {
      errors.push(`${stage.stepId} duplicate required protected flag: ${duplicate}`);
    }
    for (const duplicate of findDuplicates(notApplicable)) {
      errors.push(`${stage.stepId} duplicate not applicable protected flag: ${duplicate}`);
    }

    const requiredSet = new Set(required);
    const notApplicableSet = new Set(notApplicable);
    for (const flag of requiredSet) {
      if (notApplicableSet.has(flag)) errors.push(`${stage.stepId} protected flag partition overlap: ${flag}`);
      if (!AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.includes(flag)) {
        errors.push(`${stage.stepId} unknown required protected flag: ${flag}`);
      }
    }
    for (const flag of notApplicableSet) {
      if (!AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.includes(flag)) {
        errors.push(`${stage.stepId} unknown not applicable protected flag: ${flag}`);
      }
    }

    const union = uniqueSorted([...required, ...notApplicable]);
    if (JSON.stringify([...union]) !== JSON.stringify(protectedFlags)) {
      errors.push(`${stage.stepId} protected flag registry partition incomplete`);
    }
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function classifyProtectedFlags(flags, stage) {
  const safeFlags = flags || {};
  const required = new Set(stage?.requiredProtectedFlags || []);
  const notApplicable = new Set(stage?.notApplicableProtectedFlags || []);
  return AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.map((flag) => {
    const present = Object.hasOwn(safeFlags, flag);
    if (required.has(flag)) {
      if (!present) return Object.freeze({ flag, status: "missing_unexpectedly" });
      return Object.freeze({
        flag,
        status: safeFlags[flag] === false ? "protected_false" : "unexpected_true",
      });
    }
    if (notApplicable.has(flag)) {
      return Object.freeze({
        flag,
        status: present ? "unexpected_applicable_flag" : "not_applicable_to_stage",
      });
    }
    return Object.freeze({ flag, status: "unclassified_protected_flag" });
  });
}

function classifyHelperAdoption(source) {
  const helperStatus = Object.fromEntries(AI_ML_PRIMITIVE_MIGRATION_HELPERS.map((helper) => [
    helper,
    source.includes(`${helper}(`) ? "adopted" : "not_required",
  ]));
  const legacyHelpers = LEGACY_HELPER_PATTERNS
    .filter(({ pattern }) => source.includes(pattern))
    .map(({ helperId, allowedStageSpecificAdapter }) => Object.freeze({
      helperId,
      status: allowedStageSpecificAdapter ? "stage_specific_output_adapter" : "legacy_helper_remaining",
      allowedStageSpecificAdapter,
    }));
  return Object.freeze({ helperStatus: Object.freeze(helperStatus), legacyHelpers: Object.freeze(legacyHelpers) });
}

function classifyCompatibilityMarkers(source) {
  if (!source.includes("STATIC_COMPATIBILITY_MARKERS")) {
    return Object.freeze({
      markerStatus: "runtime_output_compatibility_marker",
      recommendation: "retain_until_step194_migration",
    });
  }
  return Object.freeze({
    markerStatus: "checker-only source marker",
    recommendation: "candidate_for_post_migration_consolidation",
  });
}

function auditSourceStage(repoRoot, stage, runtimeFlags) {
  const serviceSource = read(repoRoot, stage.serviceFile);
  const testSource = read(repoRoot, stage.testFile);
  const checkerSource = read(repoRoot, stage.checkerFile);
  const checkerTestSource = read(repoRoot, stage.checkerTestFile);
  const migrationRegressionTestSource = listStageMigrationSources(repoRoot, stage);
  const flagSegment = getFlagDefinitionSegment(serviceSource, stage.runtimeFlagExport);
  const objectFreezeBlocks = serviceSource.match(/Object\.freeze\(\{[\s\S]*?\n\}\);/g) || [];
  const duplicateFullFalseBlocks = objectFreezeBlocks.filter((block) => LEGACY_FULL_FALSE_OBJECT_KEYS.every((key) => block.includes(key)));
  const actualTrueKeys = listTrueKeys(runtimeFlags);
  const allowedKeys = [...stage.expectedAllowlistKeys].sort();
  const unexpectedTrueKeys = actualTrueKeys.filter((key) => !allowedKeys.includes(key));
  const missingAllowedKeys = allowedKeys.filter((key) => !actualTrueKeys.includes(key));
  const protectedFlagAudit = classifyProtectedFlags(runtimeFlags, stage);
  const protectedUnexpectedTrue = protectedFlagAudit.filter((item) => item.status === "unexpected_true").map((item) => item.flag);
  const missingProtectedFlags = protectedFlagAudit.filter((item) => item.status === "missing_unexpectedly").map((item) => item.flag);
  const unexpectedApplicableFlags = protectedFlagAudit.filter((item) => item.status === "unexpected_applicable_flag").map((item) => item.flag);
  const unclassifiedProtectedFlags = protectedFlagAudit.filter((item) => item.status === "unclassified_protected_flag").map((item) => item.flag);
  const protectedFalseFlags = protectedFlagAudit.filter((item) => item.status === "protected_false").map((item) => item.flag);
  const outputMarkersCovered = stage.expectedOutputMarkers.filter((marker) => testSource.includes(marker) || checkerTestSource.includes(marker));
  const contractScenarioMarkersCovered = stage.expectedContractScenarioMarkers.filter(
    (marker) => serviceSource.includes(marker) || testSource.includes(marker),
  );
  const migrationRegressionTestMarkersCovered = stage.expectedMigrationRegressionTestMarkers.filter((marker) => (
    migrationRegressionTestSource.includes(marker)
  ));
  const contractScenarioCoverageStatus = contractScenarioMarkersCovered.length === stage.expectedContractScenarioMarkers.length
    ? "complete"
    : "incomplete";
  const migrationRegressionCoverageStatus = migrationRegressionTestMarkersCovered.length === stage.expectedMigrationRegressionTestMarkers.length
    ? "complete"
    : "incomplete";
  const helperAdoption = classifyHelperAdoption(serviceSource);
  const builderCallCount = countMatches(flagSegment, /buildAiMlFailClosedFlags\(/g);
  const flagExportCount = countMatches(serviceSource, new RegExp(`export const ${stage.runtimeFlagExport}\\b`, "g"));
  const hasExplicitAllowlist = stage.metadataAllowlistExport === "inline_allowedMetadataFlags"
    ? flagSegment.includes("allowedMetadataFlags: {")
    : serviceSource.includes(`export const ${stage.metadataAllowlistExport}`);
  const hasAdditionalFalseFlags = stage.additionalFalseFlagsExport.startsWith("not_required")
    ? true
    : serviceSource.includes(`export const ${stage.additionalFalseFlagsExport}`);
  const inheritanceOk = flagSegment.includes(`inheritedFlags: ${stage.inheritedFlagExport}`);

  return Object.freeze({
    stepId: stage.stepId,
    stageId: stage.stageId,
    serviceFile: stage.serviceFile,
    testFile: stage.testFile,
    checkerFile: stage.checkerFile,
    checkerTestFile: stage.checkerTestFile,
    inheritedFlagExport: stage.inheritedFlagExport,
    metadataAllowlistExport: stage.metadataAllowlistExport,
    additionalFalseFlagsExport: stage.additionalFalseFlagsExport,
    runtimeFlagExport: stage.runtimeFlagExport,
    filePresenceOk: [stage.serviceFile, stage.testFile, stage.checkerFile, stage.checkerTestFile].every((file) => fileExists(repoRoot, file)),
    inheritanceOk,
    builderCallCount,
    flagExportCount,
    singleFlagSource: builderCallCount === 1 && flagExportCount === 1,
    explicitAllowlist: hasExplicitAllowlist,
    additionalFalseFlags: hasAdditionalFalseFlags,
    legacySpreadCount: flagSegment.includes(`...${stage.inheritedFlagExport}`) ? 1 : 0,
    anonymousDuplicateFlagObjectCount: duplicateFullFalseBlocks.length,
    actualTrueKeyCount: actualTrueKeys.length,
    allowlistKeyCount: allowedKeys.length,
    actualTrueKeys: Object.freeze(actualTrueKeys),
    allowlistKeys: Object.freeze(allowedKeys),
    unexpectedTrueKeys: Object.freeze(unexpectedTrueKeys),
    missingAllowedKeys: Object.freeze(missingAllowedKeys),
    unexpectedTruePermissionCount: unexpectedTrueKeys.length + protectedUnexpectedTrue.length,
    requiredProtectedFlagCount: stage.requiredProtectedFlags.length,
    notApplicableProtectedFlagCount: stage.notApplicableProtectedFlags.length,
    protectedFlagAudit: Object.freeze(protectedFlagAudit),
    protectedFalseCount: protectedFalseFlags.length,
    missingProtectedFlags: Object.freeze(missingProtectedFlags),
    missingUnexpectedProtectedFlags: Object.freeze(missingProtectedFlags),
    missingProtectedFlagCount: missingProtectedFlags.length,
    protectedUnexpectedTrue: Object.freeze(protectedUnexpectedTrue),
    unexpectedApplicableFlags: Object.freeze(unexpectedApplicableFlags),
    unexpectedApplicableFlagCount: unexpectedApplicableFlags.length,
    unclassifiedProtectedFlags: Object.freeze(unclassifiedProtectedFlags),
    unclassifiedProtectedFlagCount: unclassifiedProtectedFlags.length,
    outputMarkersCovered: Object.freeze(outputMarkersCovered),
    outputCompatibilityStatus: outputMarkersCovered.length === stage.expectedOutputMarkers.length ? "complete" : "incomplete",
    contractScenarioExpectedCount: stage.expectedContractScenarioMarkers.length,
    contractScenarioCoveredCount: contractScenarioMarkersCovered.length,
    contractScenarioMarkersCovered: Object.freeze(contractScenarioMarkersCovered),
    contractScenarioCoverageStatus,
    migrationRegressionTestExpectedCount: stage.expectedMigrationRegressionTestMarkers.length,
    migrationRegressionTestCoveredCount: migrationRegressionTestMarkersCovered.length,
    migrationRegressionTestMarkersCovered: Object.freeze(migrationRegressionTestMarkersCovered),
    migrationRegressionCoverageStatus,
    scenarioMarkersCovered: Object.freeze([
      ...contractScenarioMarkersCovered,
      ...migrationRegressionTestMarkersCovered,
    ]),
    scenarioCoverageStatus: contractScenarioCoverageStatus === "complete" && migrationRegressionCoverageStatus === "complete"
      ? "complete"
      : "incomplete",
    helperAdoption,
    compatibilityMarker: classifyCompatibilityMarkers(serviceSource),
  });
}

async function importStageFlags(repoRoot, stage) {
  const modulePath = pathToFileURL(path.join(repoRoot, stage.serviceFile)).href;
  const serviceModule = await import(`${modulePath}?step212=${Date.now()}-${stage.stepId}`);
  return serviceModule[stage.runtimeFlagExport];
}

function auditCheckerChain(repoRoot) {
  const packageJson = read(repoRoot, "package.json");
  const requiredScripts = [
    "check:trading-step194-ai-ml-feature-pipeline-preflight",
    "check:trading-step195-ai-ml-readiness-gate-summary",
    "check:trading-step196-ai-ml-batch-contract-review",
    "check:trading-step197-ai-ml-dataset-build-dry-run-manifest",
    "check:trading-step198-ai-ml-manifest-validation-report",
    "check:trading-step199-ai-ml-manifest-handoff-eligibility",
    "check:trading-step200-ai-ml-architecture-milestone-review",
    "check:trading-step203-ai-ml-grouped-regression",
    "check:trading-step206-finple-test-temp-guard",
    "check:trading-step209-step197-legacy-flag-cleanup",
    "check:trading-step211-ai-ml-contract-primitives-step195-pilot",
  ];
  const checkerTests = AI_ML_PRIMITIVE_MIGRATION_STAGES.map((stage) => stage.checkerTestFile);
  const missingRegressionLinks = requiredScripts.filter((script) => !packageJson.includes(`"${script}"`));
  const duplicateTestExecutionCandidates = checkerTests.filter((file, index) => checkerTests.indexOf(file) !== index);
  return Object.freeze({
    checkerCount: AI_ML_PRIMITIVE_MIGRATION_STAGES.length + 6,
    checkerTestCount: checkerTests.length + 6,
    duplicateTestExecutionCandidates: Object.freeze(duplicateTestExecutionCandidates),
    missingRegressionLinks: Object.freeze(missingRegressionLinks),
    postMigrationConsolidationCandidates: Object.freeze([
      "step195_to_step211_overlapping_checker_chain",
      "static_compatibility_markers_after_step194_migration",
    ]),
  });
}

async function buildAiMlPrimitivesMigrationAudit(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const stageAudits = [];
  for (const stage of AI_ML_PRIMITIVE_MIGRATION_STAGES) {
    const flags = await importStageFlags(repoRoot, stage);
    stageAudits.push(auditSourceStage(repoRoot, stage, flags));
  }

  const checkerChain = auditCheckerChain(repoRoot);
  const expectedStageCount = AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS.length;
  const migratedStageCount = stageAudits.filter((stage) => stage.filePresenceOk && stage.inheritanceOk && stage.singleFlagSource).length;
  const singleFlagSourceStageCount = stageAudits.filter((stage) => stage.singleFlagSource).length;
  const explicitAllowlistStageCount = stageAudits.filter((stage) => stage.explicitAllowlist && stage.missingAllowedKeys.length === 0 && stage.unexpectedTrueKeys.length === 0).length;
  const legacySpreadCount = stageAudits.reduce((sum, stage) => sum + stage.legacySpreadCount, 0);
  const anonymousDuplicateFlagObjectCount = stageAudits.reduce((sum, stage) => sum + stage.anonymousDuplicateFlagObjectCount, 0);
  const unexpectedTruePermissionCount = stageAudits.reduce((sum, stage) => sum + stage.unexpectedTruePermissionCount, 0);
  const missingProtectedFlagCount = stageAudits.reduce((sum, stage) => sum + stage.missingProtectedFlagCount, 0);
  const unexpectedApplicableFlagCount = stageAudits.reduce((sum, stage) => sum + stage.unexpectedApplicableFlagCount, 0);
  const unclassifiedProtectedFlagCount = stageAudits.reduce((sum, stage) => sum + stage.unclassifiedProtectedFlagCount, 0);
  const protectedFlagRegistryValidation = validateAiMlProtectedFlagStageRegistry(AI_ML_PRIMITIVE_MIGRATION_STAGES);
  const migrationScenarioTaxonomyValidation = validateAiMlMigrationScenarioTaxonomy(AI_ML_PRIMITIVE_MIGRATION_STAGES);
  const outputCompatibilityCoverageStatus = stageAudits.every((stage) => stage.outputCompatibilityStatus === "complete") ? "complete" : "incomplete";
  const contractScenarioCoverageStatus = stageAudits.every((stage) => stage.contractScenarioCoverageStatus === "complete") ? "complete" : "incomplete";
  const migrationRegressionCoverageStatus = stageAudits.every((stage) => stage.migrationRegressionCoverageStatus === "complete") ? "complete" : "incomplete";
  const helperLegacyRemainingCount = stageAudits.reduce(
    (sum, stage) => sum + stage.helperAdoption.legacyHelpers.filter((helper) => helper.status === "legacy_helper_remaining").length,
    0,
  );
  const stageOrder = stageAudits.map((stage) => stage.stepId);

  return Object.freeze({
    auditId: "step212_shared_ai_ml_primitives_migration_milestone",
    scope: "step194_to_step200",
    expectedStageCount,
    migratedStageCount,
    singleFlagSourceStageCount,
    explicitAllowlistStageCount,
    legacySpreadCount,
    anonymousDuplicateFlagObjectCount,
    unexpectedTruePermissionCount,
    missingProtectedFlagCount,
    unexpectedApplicableFlagCount,
    unclassifiedProtectedFlagCount,
    protectedFlagRegistryStatus: protectedFlagRegistryValidation.ok ? "complete" : "invalid",
    protectedFlagRegistryErrors: protectedFlagRegistryValidation.errors,
    migrationScenarioTaxonomyStatus: migrationScenarioTaxonomyValidation.ok ? "separated_and_complete" : "invalid",
    migrationScenarioTaxonomyErrors: migrationScenarioTaxonomyValidation.errors,
    outputCompatibilityCoverageStatus,
    contractScenarioCoverageStatus,
    migrationRegressionCoverageStatus,
    groupedRegressionStatus: "externally_validated",
    runtimeCapabilityStatus: "not_implemented",
    executionReadinessStatus: "blocked",
    orderAuthorityStatus: "external_blocker",
    checkerConsolidationStatus: "eligible_for_post_step194_review",
    nextRecommendedImplementation: "post_step194_checker_and_marker_consolidation_review",
    overallStatus: "shared_primitives_migration_milestone_complete_execution_blocked",
    stageOrder: Object.freeze(stageOrder),
    stageAudits: Object.freeze(stageAudits),
    checkerChain,
    compatibilityMarkerSummary: Object.freeze(stageAudits.map((stage) => Object.freeze({
      stepId: stage.stepId,
      markerStatus: stage.compatibilityMarker.markerStatus,
      recommendation: stage.compatibilityMarker.recommendation,
    }))),
    helperLegacyRemainingCount,
    redacted: true,
  });
}

function validateAiMlPrimitivesMigrationAudit(audit) {
  const errors = [];
  const protectedFlagRegistryValidation = validateAiMlProtectedFlagStageRegistry(AI_ML_PRIMITIVE_MIGRATION_STAGES);
  const migrationScenarioTaxonomyValidation = validateAiMlMigrationScenarioTaxonomy(AI_ML_PRIMITIVE_MIGRATION_STAGES);
  for (const error of protectedFlagRegistryValidation.errors) errors.push(`protected flag registry: ${error}`);
  for (const error of migrationScenarioTaxonomyValidation.errors) errors.push(`migration scenario taxonomy: ${error}`);
  if (!audit || typeof audit !== "object") errors.push("audit missing");
  if (audit?.auditId !== "step212_shared_ai_ml_primitives_migration_milestone") errors.push("audit id mismatch");
  if (audit?.scope !== "step194_to_step200") errors.push("audit scope mismatch");
  if (JSON.stringify(audit?.stageOrder || []) !== JSON.stringify([...AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS])) errors.push("stage order mismatch");
  if (audit?.expectedStageCount !== 7) errors.push("expected stage count mismatch");
  if (audit?.migratedStageCount !== 7) errors.push("migrated stage count mismatch");
  if (audit?.singleFlagSourceStageCount !== 7) errors.push("single flag source stage count mismatch");
  if (audit?.explicitAllowlistStageCount !== 7) errors.push("explicit allowlist stage count mismatch");
  if (audit?.legacySpreadCount !== 0) errors.push("legacy spread remains");
  if (audit?.anonymousDuplicateFlagObjectCount !== 0) errors.push("anonymous duplicate false object remains");
  if (audit?.unexpectedTruePermissionCount !== 0) errors.push("unexpected true permission remains");
  if (audit?.missingProtectedFlagCount !== 0) errors.push("missing protected flag remains");
  if (audit?.unexpectedApplicableFlagCount !== 0) errors.push("unexpected applicable protected flag remains");
  if (audit?.unclassifiedProtectedFlagCount !== 0) errors.push("unclassified protected flag remains");
  if (audit?.protectedFlagRegistryStatus !== "complete") errors.push("protected flag registry incomplete");
  if (audit?.migrationScenarioTaxonomyStatus !== "separated_and_complete") errors.push("migration scenario taxonomy incomplete");
  if (audit?.outputCompatibilityCoverageStatus !== "complete") errors.push("output compatibility coverage incomplete");
  if (audit?.contractScenarioCoverageStatus !== "complete") errors.push("contract scenario coverage incomplete");
  if (audit?.migrationRegressionCoverageStatus !== "complete") errors.push("migration regression coverage incomplete");
  if (audit?.runtimeCapabilityStatus !== "not_implemented") errors.push("runtime capability changed");
  if (audit?.executionReadinessStatus !== "blocked") errors.push("execution readiness changed");
  if (audit?.orderAuthorityStatus !== "external_blocker") errors.push("order authority changed");
  if (audit?.helperLegacyRemainingCount !== 0) errors.push("legacy helper remains");
  for (const stage of audit?.stageAudits || []) {
    if (stage.scenarioCoverageStatus !== "complete") errors.push(`${stage.stepId} scenario coverage incomplete`);
    if (stage.contractScenarioCoverageStatus !== "complete") errors.push(`${stage.stepId} contract scenario coverage incomplete`);
    if (stage.migrationRegressionCoverageStatus !== "complete") errors.push(`${stage.stepId} migration regression coverage incomplete`);
    if (!stage.additionalFalseFlags) errors.push(`${stage.stepId} additional false flag status missing`);
    if (stage.missingAllowedKeys.length > 0) errors.push(`${stage.stepId} allowlist missing keys`);
    if (stage.unexpectedTrueKeys.length > 0) errors.push(`${stage.stepId} unexpected true keys`);
    if (stage.missingProtectedFlagCount > 0) errors.push(`${stage.stepId} missing protected flags`);
    if (stage.unexpectedApplicableFlagCount > 0) errors.push(`${stage.stepId} unexpected applicable protected flags`);
    if (stage.unclassifiedProtectedFlagCount > 0) errors.push(`${stage.stepId} unclassified protected flags`);
  }
  if ((audit?.checkerChain?.missingRegressionLinks || []).length > 0) errors.push("checker regression link missing");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

if (require.main === module) {
  buildAiMlPrimitivesMigrationAudit()
    .then((audit) => {
      const validation = validateAiMlPrimitivesMigrationAudit(audit);
      if (!validation.ok) {
        console.error(JSON.stringify({ ok: false, errors: validation.errors, audit }, null, 2));
        process.exitCode = 1;
        return;
      }
      console.log("[trading-ai-ml-primitives-migration-audit] ok");
      console.log(JSON.stringify({
        auditId: audit.auditId,
        scope: audit.scope,
        expectedStageCount: audit.expectedStageCount,
        migratedStageCount: audit.migratedStageCount,
        legacySpreadCount: audit.legacySpreadCount,
        unexpectedTruePermissionCount: audit.unexpectedTruePermissionCount,
        missingProtectedFlagCount: audit.missingProtectedFlagCount,
        unexpectedApplicableFlagCount: audit.unexpectedApplicableFlagCount,
        unclassifiedProtectedFlagCount: audit.unclassifiedProtectedFlagCount,
        protectedFlagRegistryStatus: audit.protectedFlagRegistryStatus,
        migrationScenarioTaxonomyStatus: audit.migrationScenarioTaxonomyStatus,
        contractScenarioCoverageStatus: audit.contractScenarioCoverageStatus,
        migrationRegressionCoverageStatus: audit.migrationRegressionCoverageStatus,
        overallStatus: audit.overallStatus,
      }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS,
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  classifyProtectedFlags,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlMigrationScenarioTaxonomy,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
};
