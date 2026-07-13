import { STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS, buildAiMlDatasetArchitecture } from "./tradingAiMlDatasetArchitecture.js";
import {
  AI_ML_CONTRACT_STATUS,
  AI_ML_STAGE_IDS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
  normalizeAiMlMetadataArray,
  sanitizeAiMlMetadataArray,
  sanitizeAiMlMetadataValue,
  sortAiMlMetadataByKey,
} from "./tradingAiMlContractPrimitives.js";

export const STEP193_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({});

export const STEP193_ADDITIONAL_FALSE_FLAGS = Object.freeze({
  featureFileCreationAllowed: false,
  modelArtifactCreationAllowed: false,
  modelAutoApprovalAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
});

export const STEP193_AI_ML_FEATURE_PIPELINE_FLAGS = buildAiMlFailClosedFlags({
  inheritedFlags: STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  allowedMetadataFlags: STEP193_METADATA_ONLY_ALLOWED_FLAGS,
  additionalFalseFlags: STEP193_ADDITIONAL_FALSE_FLAGS,
});

const STEP193_STATIC_COMPATIBILITY_MARKERS = Object.freeze([
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
]);

export const TRADING_AI_ML_FEATURE_PIPELINE_MODEL = Object.freeze({
  featurePipelineArchitectureId: "string",
  scope: "admin_ai_ml_strategy_lab",
  status: "design_only",
  source: "deterministic_mock_feature_pipeline_registry",
  redacted: true,
  featureSourceMappings: "feature_source_mapping_contract[]",
  pointInTimeJoinPolicy: "point_in_time_join_contract",
  rollingFeatureContracts: "rolling_feature_calculation_contract[]",
  missingValuePolicy: "missing_value_policy_contract",
  trainOnlyNormalizationPolicy: "train_only_normalization_contract",
  featureVersioningLineage: "feature_versioning_lineage_contract",
  leakageGuards: "leakage_guard_contract[]",
  featureQualityValidation: "feature_quality_validation_contract",
  datasetTrainingInterfaces: "dataset_training_pipeline_interface_contract",
  futureFeatureStoreContract: "provider_neutral_feature_store_contract",
  executionSafety: "blocked_execution_and_persistence_status",
  nextImplementationStep: "ai_ml_feature_pipeline_preflight_gate",
  stageReferences: Object.freeze({
    sourceDatasetArchitecture: AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE,
    featurePipelineArchitecture: AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
  }),
  sharedStatusVocabulary: Object.freeze({
    featureGenerationStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    datasetBuildStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    trainingStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
  }),
});

const FEATURE_SOURCE_MAPPINGS = Object.freeze([
  {
    featureKey: "asset_master_listing_status",
    featureGroup: "asset_master",
    sourceId: "asset_master_contract_v0",
    sourceType: "asset master",
    sourceField: "listing_status",
    entityKey: "asset_id",
    eventTimeField: "listing_event_time",
    availableAtField: "listing_available_at",
    timezone: "exchange_local",
    availabilityLag: "source_declared_lag",
    revisionPolicy: "as_of_prediction_time_only",
    stalenessPolicy: "block_if_asset_master_snapshot_missing",
    allowedUses: ["universe_membership", "eligibility_filter"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "daily_price_adjusted_close",
    featureGroup: "price_return",
    sourceId: "daily_price_contract_v0",
    sourceType: "daily price",
    sourceField: "adjusted_close",
    entityKey: "asset_id",
    eventTimeField: "price_date_market_close",
    availableAtField: "price_available_at",
    timezone: "exchange_local",
    availabilityLag: "market_close_plus_vendor_lag_placeholder",
    revisionPolicy: "latest_known_before_prediction",
    stalenessPolicy: "warn_after_one_market_session_block_after_three",
    allowedUses: ["rolling_return", "volatility", "drawdown"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "monthly_total_return",
    featureGroup: "return_history",
    sourceId: "monthly_return_contract_v0",
    sourceType: "monthly return",
    sourceField: "total_return",
    entityKey: "asset_id",
    eventTimeField: "month_end",
    availableAtField: "monthly_return_available_at",
    timezone: "UTC",
    availabilityLag: "post_import_validation_required",
    revisionPolicy: "immutable_snapshot_after_review",
    stalenessPolicy: "block_if_post_import_validation_missing",
    allowedUses: ["dataset_label_alignment", "long_horizon_features"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "dividend_cashflow_ttm",
    featureGroup: "income",
    sourceId: "dividend_contract_v0",
    sourceType: "dividend",
    sourceField: "cash_dividend_amount",
    entityKey: "asset_id",
    eventTimeField: "ex_dividend_date",
    availableAtField: "dividend_available_at",
    timezone: "exchange_local",
    availabilityLag: "declared_timestamp_required",
    revisionPolicy: "revised_data_kept_in_new_snapshot",
    stalenessPolicy: "missing_source_not_zero",
    allowedUses: ["dividend_yield_ttm"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "benchmark_daily_return",
    featureGroup: "benchmark",
    sourceId: "benchmark_contract_v0",
    sourceType: "benchmark",
    sourceField: "benchmark_return",
    entityKey: "benchmark_id",
    eventTimeField: "benchmark_market_close",
    availableAtField: "benchmark_available_at",
    timezone: "benchmark_exchange_local",
    availabilityLag: "market_close_plus_vendor_lag_placeholder",
    revisionPolicy: "latest_known_before_prediction",
    stalenessPolicy: "block_if_benchmark_calendar_misaligned",
    allowedUses: ["beta_252d", "correlation_to_benchmark_252d"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "fx_daily_return",
    featureGroup: "foreign_exchange",
    sourceId: "foreign_exchange_contract_v0",
    sourceType: "foreign exchange",
    sourceField: "fx_return",
    entityKey: "currency_pair",
    eventTimeField: "fx_fixing_time",
    availableAtField: "fx_available_at",
    timezone: "UTC",
    availabilityLag: "fixing_publication_lag_placeholder",
    revisionPolicy: "release_timestamp_required",
    stalenessPolicy: "warn_after_one_business_day_block_after_three",
    allowedUses: ["fx_return_20d", "currency_risk_context"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "market_regime_state",
    featureGroup: "market_regime",
    sourceId: "market_regime_contract_v0",
    sourceType: "market regime",
    sourceField: "regime_bucket",
    entityKey: "market_id",
    eventTimeField: "regime_observation_time",
    availableAtField: "regime_available_at",
    timezone: "UTC",
    availabilityLag: "derived_after_inputs_available",
    revisionPolicy: "derived_versioned_snapshot_only",
    stalenessPolicy: "block_if_any_required_input_future_dated",
    allowedUses: ["regime_context_feature"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "portfolio_snapshot_allocation",
    featureGroup: "portfolio_snapshot",
    sourceId: "portfolio_snapshot_contract_v0",
    sourceType: "portfolio snapshot",
    sourceField: "target_and_current_weight_placeholder",
    entityKey: "portfolio_id",
    eventTimeField: "snapshot_event_time",
    availableAtField: "snapshot_available_at",
    timezone: "Asia/Seoul",
    availabilityLag: "admin_mock_snapshot_only",
    revisionPolicy: "no_live_account_values",
    stalenessPolicy: "block_if_snapshot_after_prediction_time",
    allowedUses: ["allocation_drift_context"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
  {
    featureKey: "dataset_label_registry_boundary",
    featureGroup: "label_registry",
    sourceId: "dataset_label_registry_contract_v0",
    sourceType: "dataset label registry",
    sourceField: "label_definition_id",
    entityKey: "label_id",
    eventTimeField: "label_start_time",
    availableAtField: "label_available_at",
    timezone: "UTC",
    availabilityLag: "label_window_must_complete_first",
    revisionPolicy: "label_definition_versioned",
    stalenessPolicy: "block_if_label_boundary_overlaps_feature_window",
    allowedUses: ["label_alignment_only"],
    owner: "admin_ai_ml_architecture",
    redacted: true,
  },
]);

const POINT_IN_TIME_JOIN_POLICY = Object.freeze({
  policyId: "point_in_time_join_policy_v0",
  requiredRules: [
    "feature.availableAt <= predictionTime",
    "feature.eventTime <= featureCutoffTime",
    "featureCutoffTime <= predictionTime",
    "labelStartTime > predictionTime",
  ],
  latestKnownRecordSelection: "select max availableAt then max eventTime where both are <= prediction time",
  lateArrivingDataHandling: "late records only enter future versioned snapshots",
  revisedDataHandling: "revisions require sourceSnapshotId change and cannot mutate prior training view",
  timezoneNormalization: "normalize to UTC for joins while preserving exchange local market-close metadata",
  marketCloseAvailability: "daily market data is unavailable until after close plus source-declared lag",
  weekendHolidayAlignment: "align to previous valid market session without crossing prediction time",
  duplicateTimestampRejection: true,
  futureRecordRejection: true,
  redacted: true,
});

const ROLLING_FEATURE_CONTRACTS = Object.freeze([
  ["return_1d", "1d", 1, "daily_price_adjusted_close", "decimal_return"],
  ["return_20d", "20d", 20, "daily_price_adjusted_close", "decimal_return"],
  ["momentum_60d", "60d", 40, "daily_price_adjusted_close", "decimal_return"],
  ["volatility_20d", "20d", 20, "daily_price_adjusted_close", "annualized_volatility"],
  ["downside_volatility_20d", "20d", 20, "daily_price_adjusted_close", "annualized_downside_volatility"],
  ["rolling_drawdown_60d", "60d", 40, "daily_price_adjusted_close", "drawdown_ratio"],
  ["rolling_mdd_252d", "252d", 180, "daily_price_adjusted_close", "max_drawdown_ratio"],
  ["volume_zscore_20d", "20d", 20, "daily_price_volume", "zscore"],
  ["beta_252d", "252d", 180, "daily_price_adjusted_close_and_benchmark_return", "beta"],
  ["correlation_to_benchmark_252d", "252d", 180, "daily_price_adjusted_close_and_benchmark_return", "correlation"],
  ["dividend_yield_ttm", "12m", 4, "dividend_cashflow_ttm", "ratio"],
  ["fx_return_20d", "20d", 20, "fx_daily_return", "decimal_return"],
].map(([featureKey, windowSize, minimumPeriods, inputField, outputType]) => Object.freeze({
  featureKey,
  windowType: windowSize.endsWith("m") ? "calendar_month_trailing" : "market_session_trailing",
  windowSize,
  minimumPeriods,
  anchorTime: "prediction_time_feature_cutoff",
  includeCurrentObservation: false,
  closedBoundary: "left_closed_right_open",
  sortOrder: "entity_event_time_ascending",
  groupingKey: featureKey.startsWith("fx_") ? "currency_pair" : "asset_id",
  inputField,
  outputType,
  warmupPolicy: "emit_missing_status_until_minimum_periods_met",
  insufficientHistoryPolicy: "insufficient_history_not_zero_fill",
  calculationExecutedNow: false,
  redacted: true,
})));

const MISSING_VALUE_POLICY = Object.freeze({
  policyId: "missing_value_policy_v0",
  statuses: ["observed", "confirmed_zero", "not_applicable", "missing_source", "insufficient_history", "stale", "invalid"],
  noUnconditionalZeroFill: true,
  missingIndicatorSupport: true,
  featureSpecificImputation: true,
  groupAwareTrainMedianOption: "fit_on_training_split_only",
  dropRowPolicy: "allowed_for_missing_required_label_or_blocking_feature",
  dropFeaturePolicy: "allowed_when_training_missing_rate_exceeds_blocking_threshold",
  blockingThreshold: "feature_specific_contract_required",
  warningThreshold: "feature_specific_contract_required",
  labelMissingRejection: true,
  imputationFitScope: "training_split_only",
  redacted: true,
});

const TRAIN_ONLY_NORMALIZATION_POLICY = Object.freeze({
  policyId: "train_only_normalization_policy_v0",
  rules: {
    normalizerFitScope: "training_split_only",
    validationTestInferenceScope: "frozen_training_parameters_only",
    fullDatasetNormalization: "forbidden",
    splitSpecificRefit: "forbidden",
  },
  normalizerContracts: ["none", "standard_scaler", "robust_scaler", "min_max_scaler", "winsorization", "log_transform", "rank_gaussian_transform"],
  manifestSchema: {
    normalizerType: "string",
    fitDatasetVersion: "string",
    fitSplitId: "string",
    featureDefinitionVersion: "string",
    parameterDigest: "field_defined_no_value_generated",
    fittedAt: "field_defined_no_current_time_generated",
    fittedBy: "admin_or_job_identity_reference",
  },
  scalerFitExecutedNow: false,
  featureTransformExecutedNow: false,
  redacted: true,
});

const FEATURE_VERSIONING_LINEAGE = Object.freeze({
  policyId: "feature_versioning_lineage_policy_v0",
  lineageFields: [
    "featureSetId",
    "featureSetVersion",
    "featureDefinitionVersion",
    "sourceSnapshotId",
    "datasetVersion",
    "labelDefinitionVersion",
    "codeCommitSha",
    "transformationGraphId",
    "parentArtifactIds",
    "normalizationManifestId",
    "qualityReportId",
  ],
  policies: [
    "immutable_published_version",
    "semantic_versioning",
    "breaking_change_detection",
    "no_in_place_mutation",
    "reproducible_lineage",
    "content_digest_field_defined_no_value_generated",
    "rollback_reference",
  ],
  artifactCreatedNow: false,
  redacted: true,
});

const LEAKAGE_GUARDS = Object.freeze([
  ["future_availability_guard", "blocks features whose availableAt is after predictionTime", "blocking", "point_in_time_join", "FEATURE_AVAILABLE_AFTER_PREDICTION"],
  ["future_event_time_guard", "blocks features whose eventTime exceeds featureCutoffTime", "blocking", "point_in_time_join", "FEATURE_EVENT_AFTER_CUTOFF"],
  ["label_boundary_guard", "requires labelStartTime after predictionTime", "blocking", "label_join", "LABEL_START_NOT_AFTER_PREDICTION"],
  ["label_overlap_guard", "blocks overlapping lookback and lookforward windows without purge", "blocking", "split_construction", "LABEL_FEATURE_WINDOW_OVERLAP"],
  ["normalization_fit_scope_guard", "blocks validation test or inference refit", "blocking", "normalization", "NORMALIZER_FIT_SCOPE_INVALID"],
  ["random_split_guard", "blocks random shuffle split for time-series features", "blocking", "split_construction", "RANDOM_SPLIT_FORBIDDEN"],
  ["entity_time_duplicate_guard", "rejects duplicate entity timestamp keys", "blocking", "quality_validation", "DUPLICATE_ENTITY_TIMESTAMP"],
  ["revised_data_guard", "requires revised data to publish as a new source snapshot", "blocking", "source_snapshot", "REVISION_MUTATED_PRIOR_VIEW"],
  ["survivorship_bias_guard", "requires prediction-time universe membership", "warning", "source_mapping", "UNIVERSE_MEMBERSHIP_REVIEW_REQUIRED"],
  ["universe_membership_guard", "blocks post-hoc universe filters", "blocking", "source_mapping", "UNIVERSE_FILTER_AFTER_OUTCOME"],
  ["cross_split_contamination_guard", "blocks entity-time leakage across train validation test", "blocking", "split_construction", "CROSS_SPLIT_CONTAMINATION"],
  ["lookback_lookforward_overlap_guard", "requires embargo when lookback and label horizons overlap", "blocking", "split_construction", "LOOKBACK_LOOKFORWARD_OVERLAP"],
].map(([guardKey, description, severity, checkStage, failureCode]) => Object.freeze({
  guardKey,
  description,
  severity,
  blocking: severity === "blocking",
  checkStage,
  failureCode,
  remediation: "block_pipeline_and_publish_redacted_quality_report_before_retry",
  redacted: true,
})));

const FEATURE_QUALITY_VALIDATION = Object.freeze({
  policyId: "feature_quality_validation_policy_v0",
  outputStatuses: ["pass", "warning", "block"],
  rules: [
    "schema_validation",
    "type_validation",
    "finite_number_validation",
    "range_validation",
    "missing_rate_validation",
    "staleness_validation",
    "duplicate_validation",
    "timestamp_order_validation",
    "join_match_rate_validation",
    "coverage_validation",
    "cardinality_validation",
    "distribution_validation",
    "drift_validation",
    "constant_feature_validation",
  ],
  reportSchema: {
    reportId: "string",
    featureSetVersion: "string",
    ruleResults: "feature_quality_rule_result[]",
    blockingRuleCount: "number",
    warningRuleCount: "number",
    generatedAt: "field_defined_no_current_time_generated",
  },
  validationExecutedNow: false,
  redacted: true,
});

const DATASET_TRAINING_INTERFACES = Object.freeze({
  interfaceId: "dataset_training_pipeline_interface_contract_v0",
  requestContracts: {
    FeatureBatchRequest: ["datasetDefinition", "labelDefinition", "splitPolicy", "pointInTimePolicy", "featureSetVersion"],
    FeatureBatchManifest: ["featureSetVersion", "normalizationManifest", "qualityReport", "lineageManifest", "leakageReport"],
    FeatureQualityReport: ["ruleResults", "passWarningBlockStatus", "redactedSummary"],
    DatasetBuilderFeatureInput: ["featureBatchManifest", "featureMatrixReference", "labelDefinition", "splitPolicy"],
    TrainingPipelineFeatureInput: ["datasetVersion", "featureSetVersion", "normalizationManifest", "qualityReport"],
    InferenceFeatureRequest: ["entityKeys", "predictionTime", "featureSetVersion", "pointInTimePolicy"],
  },
  requiredLinkages: [
    "dataset_definition",
    "label_definition",
    "split_policy",
    "point_in_time_policy",
    "feature_set_version",
    "normalization_manifest",
    "quality_report",
    "lineage_manifest",
    "leakage_report",
  ],
  datasetBuilderImplementedNow: false,
  trainingProcessImplementedNow: false,
  inferenceProcessImplementedNow: false,
  redacted: true,
});

const FUTURE_FEATURE_STORE_CONTRACT = Object.freeze({
  contractId: "provider_neutral_future_feature_store_contract_v0",
  concepts: [
    "offline_feature_retrieval",
    "online_feature_retrieval",
    "point_in_time_historical_retrieval",
    "feature_freshness",
    "feature_key",
    "entity_key",
    "event_timestamp",
    "available_timestamp",
    "feature_set_version",
    "lineage_reference",
  ],
  adapterInterfaces: {
    getOfflineFeaturesContract: "returns point-in-time eligible offline feature batch contract only",
    getOnlineFeaturesContract: "returns online lookup contract only with provider calls blocked",
    getPointInTimeFeaturesContract: "returns historical retrieval contract constrained by available timestamp",
    validateFeatureFreshnessContract: "returns freshness validation contract without DB or cache calls",
  },
  dbConnectedNow: false,
  redisConnectedNow: false,
  supabaseConnectedNow: false,
  featureStoreProductConnectedNow: false,
  redacted: true,
});

const EXECUTION_SAFETY_STATUS = Object.freeze({
  actualDataDownloadAttempted: false,
  featureGenerationAttempted: false,
  datasetBuildAttempted: false,
  pythonJobAttempted: false,
  modelTrainingAttempted: false,
  modelArtifactCreated: false,
  csvCreated: false,
  parquetCreated: false,
  featureFileCreated: false,
  supabaseSelectAttempted: false,
  supabaseInsertAttempted: false,
  supabaseUpdateAttempted: false,
  supabaseDeleteAttempted: false,
  persistentDbWriteAttempted: false,
  providerCallAttempted: false,
  quoteCallAttempted: false,
  kisCallAttempted: false,
  orderSubmissionAttempted: false,
  redacted: true,
});

const BLOCKED_OPERATIONS = Object.freeze([
  "actual_data_download_blocked",
  "feature_generation_blocked",
  "feature_file_creation_blocked",
  "dataset_build_blocked",
  "python_feature_job_blocked",
  "model_training_blocked",
  "model_artifact_creation_blocked",
  "model_deployment_blocked",
  "db_read_write_blocked",
  "persistent_storage_blocked",
  "provider_kis_quote_order_blocked",
  "public_and_mypage_ui_exposure_blocked",
]);

function validateFeaturePipelineArchitecture(architecture) {
  const blockers = [];
  const expectedSourceTypes = new Set([
    "asset master",
    "daily price",
    "monthly return",
    "dividend",
    "benchmark",
    "foreign exchange",
    "market regime",
    "portfolio snapshot",
    "dataset label registry",
  ]);
  for (const mapping of architecture.featureSourceMappings) {
    expectedSourceTypes.delete(mapping.sourceType);
    if (!mapping.availableAtField || !mapping.eventTimeField) blockers.push(`${mapping.featureKey}_timestamp_contract_missing`);
    if (mapping.redacted !== true) blockers.push(`${mapping.featureKey}_not_redacted`);
  }
  if (expectedSourceTypes.size > 0) blockers.push(`missing_source_types:${Array.from(expectedSourceTypes).join(",")}`);
  for (const rule of POINT_IN_TIME_JOIN_POLICY.requiredRules) {
    if (!architecture.pointInTimeJoinPolicy.requiredRules.includes(rule)) blockers.push(`missing_point_in_time_rule:${rule}`);
  }
  if (architecture.rollingFeatureContracts.some((contract) => contract.calculationExecutedNow !== false)) blockers.push("rolling_calculation_execution_enabled");
  if (architecture.missingValuePolicy.noUnconditionalZeroFill !== true) blockers.push("missing_policy_allows_zero_fill");
  if (architecture.trainOnlyNormalizationPolicy.rules.normalizerFitScope !== "training_split_only") blockers.push("normalizer_fit_scope_not_train_only");
  if (architecture.leakageGuards.some((guard) => guard.severity === "blocking" && guard.blocking !== true)) blockers.push("blocking_leakage_guard_not_blocking");
  if (architecture.featureQualityValidation.validationExecutedNow !== false) blockers.push("feature_quality_validation_executed");
  if (architecture.futureFeatureStoreContract.supabaseConnectedNow !== false) blockers.push("future_feature_store_connected");

  return {
    validationStatus: blockers.length > 0 ? AI_ML_CONTRACT_STATUS.BLOCKED : "design_ready",
    blockers,
    warnings: ["feature_generation_not_started", "dataset_builder_not_started", "training_pipeline_not_started", "feature_store_not_connected"],
    redacted: true,
  };
}

function maybeSortByKey(items, key, shouldSort) {
  return shouldSort ? sortAiMlMetadataByKey(items, key) : Object.freeze([...items]);
}

function sanitizeFeatureSourceMappings(value, shouldSort = false) {
  const mapped = normalizeAiMlMetadataArray(value).map((mapping) => Object.freeze({
    ...cloneAiMlMetadata(mapping),
    featureKey: sanitizeAiMlMetadataValue(mapping?.featureKey, "feature_key"),
    sourceId: sanitizeAiMlMetadataValue(mapping?.sourceId, "source_id"),
    sourceField: sanitizeAiMlMetadataValue(mapping?.sourceField, "source_field"),
    allowedUses: sanitizeAiMlMetadataArray(mapping?.allowedUses),
    redacted: true,
  }));
  return maybeSortByKey(mapped, "featureKey", shouldSort);
}

function sanitizeRollingFeatureContracts(value, shouldSort = false) {
  const mapped = normalizeAiMlMetadataArray(value).map((contract) => Object.freeze({
    ...cloneAiMlMetadata(contract),
    featureKey: sanitizeAiMlMetadataValue(contract?.featureKey, "feature_key"),
    inputField: sanitizeAiMlMetadataValue(contract?.inputField, "input_field"),
    redacted: true,
  }));
  return maybeSortByKey(mapped, "featureKey", shouldSort);
}

function sanitizeLeakageGuards(value, shouldSort = false) {
  const mapped = normalizeAiMlMetadataArray(value).map((guard) => Object.freeze({
    ...cloneAiMlMetadata(guard),
    guardKey: sanitizeAiMlMetadataValue(guard?.guardKey, "guard_key"),
    description: sanitizeAiMlMetadataValue(guard?.description, "guard"),
    failureCode: sanitizeAiMlMetadataValue(guard?.failureCode, "failure_code"),
    redacted: true,
  }));
  return maybeSortByKey(mapped, "guardKey", shouldSort);
}

function sanitizePointInTimeJoinPolicy(value) {
  const policy = cloneAiMlMetadata(value) || {};
  return Object.freeze({
    ...policy,
    requiredRules: Object.freeze(normalizeAiMlMetadataArray(policy.requiredRules).map((rule) => sanitizeAiMlMetadataValue(rule))),
    redacted: true,
  });
}

function sanitizeFeatureVersioningLineage(value) {
  const lineage = cloneAiMlMetadata(value) || {};
  return Object.freeze({
    ...lineage,
    lineageFields: Object.freeze(normalizeAiMlMetadataArray(lineage.lineageFields).map((field) => sanitizeAiMlMetadataValue(field))),
    policies: Object.freeze(normalizeAiMlMetadataArray(lineage.policies).map((policy) => sanitizeAiMlMetadataValue(policy))),
    redacted: true,
  });
}

function sanitizeFutureFeatureStoreContract(value) {
  const contract = cloneAiMlMetadata(value) || {};
  return Object.freeze({
    ...contract,
    contractId: sanitizeAiMlMetadataValue(contract.contractId, "feature_store_contract"),
    concepts: sanitizeAiMlMetadataArray(contract.concepts),
    redacted: true,
  });
}

export function buildAiMlFeaturePipelineArchitecture(input = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const datasetArchitecture = sourceInput.datasetArchitecture
    ? cloneAiMlMetadata(sourceInput.datasetArchitecture)
    : buildAiMlDatasetArchitecture(sourceInput);
  const architecture = {
    featurePipelineArchitectureId: "step193_admin_ai_ml_feature_pipeline_architecture",
    scope: "admin_ai_ml_strategy_lab",
    status: "design_only",
    source: "deterministic_mock_feature_pipeline_registry",
    datasetArchitectureId: datasetArchitecture.datasetArchitectureId,
    redacted: true,
    featureSourceMappings: sanitizeFeatureSourceMappings(sourceInput.featureSourceMappings || FEATURE_SOURCE_MAPPINGS, Boolean(sourceInput.featureSourceMappings)),
    pointInTimeJoinPolicy: sanitizePointInTimeJoinPolicy(sourceInput.pointInTimeJoinPolicy || POINT_IN_TIME_JOIN_POLICY),
    rollingFeatureContracts: sanitizeRollingFeatureContracts(sourceInput.rollingFeatureContracts || ROLLING_FEATURE_CONTRACTS, Boolean(sourceInput.rollingFeatureContracts)),
    missingValuePolicy: Object.freeze(cloneAiMlMetadata(sourceInput.missingValuePolicy || MISSING_VALUE_POLICY)),
    trainOnlyNormalizationPolicy: Object.freeze(cloneAiMlMetadata(sourceInput.trainOnlyNormalizationPolicy || TRAIN_ONLY_NORMALIZATION_POLICY)),
    featureVersioningLineage: sanitizeFeatureVersioningLineage(sourceInput.featureVersioningLineage || FEATURE_VERSIONING_LINEAGE),
    leakageGuards: sanitizeLeakageGuards(sourceInput.leakageGuards || LEAKAGE_GUARDS, Boolean(sourceInput.leakageGuards)),
    featureQualityValidation: Object.freeze(cloneAiMlMetadata(sourceInput.featureQualityValidation || FEATURE_QUALITY_VALIDATION)),
    datasetTrainingInterfaces: Object.freeze(cloneAiMlMetadata(sourceInput.datasetTrainingInterfaces || DATASET_TRAINING_INTERFACES)),
    futureFeatureStoreContract: sanitizeFutureFeatureStoreContract(sourceInput.futureFeatureStoreContract || FUTURE_FEATURE_STORE_CONTRACT),
    executionSafetyStatus: EXECUTION_SAFETY_STATUS,
    blockedOperations: [...BLOCKED_OPERATIONS],
    nextImplementationStep: "ai_ml_feature_pipeline_preflight_gate",
  };

  return {
    ...architecture,
    featureSourceMappingCount: architecture.featureSourceMappings.length,
    rollingFeatureContractCount: architecture.rollingFeatureContracts.length,
    leakageGuardCount: architecture.leakageGuards.length,
    qualityRuleCount: architecture.featureQualityValidation.rules.length,
    interfaceContractCount: Object.keys(architecture.datasetTrainingInterfaces.requestContracts).length,
    validation: validateFeaturePipelineArchitecture(architecture),
    featureGenerationStatus: "blocked",
    datasetBuildStatus: "blocked",
    trainingStatus: "blocked",
    featureFileCreationStatus: "blocked",
    dbReadWriteStatus: "blocked",
    providerOrderLiveStatus: "blocked",
    publicExposureStatus: "blocked",
  };
}

export function buildAdminTradingAiMlFeaturePipelineStatus(input = {}) {
  const featurePipelineArchitecture = input.featurePipelineArchitecture || buildAiMlFeaturePipelineArchitecture(input);
  return {
    ok: true,
    step: "Step 193: Design AI/ML feature pipeline architecture",
    status: "admin_only_ai_ml_feature_pipeline_architecture_design_only",
    sourceStep: "step193",
    featurePipelineModel: TRADING_AI_ML_FEATURE_PIPELINE_MODEL,
    featurePipelineArchitecture,
    blockedConfirmation: { ...EXECUTION_SAFETY_STATUS },
    flags: { ...STEP193_AI_ML_FEATURE_PIPELINE_FLAGS },
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
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
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}
