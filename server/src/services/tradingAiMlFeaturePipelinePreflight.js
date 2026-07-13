import { buildAiMlDatasetArchitecture } from "./tradingAiMlDatasetArchitecture.js";
import {
  STEP193_AI_ML_FEATURE_PIPELINE_FLAGS,
  buildAiMlFeaturePipelineArchitecture,
} from "./tradingAiMlFeaturePipelineArchitecture.js";
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

export const STEP194_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({
  metadataOnlyPreflightEvaluationAllowed: true,
});

export const STEP194_ADDITIONAL_FALSE_FLAGS = Object.freeze({
  featureFileCreationAllowed: false,
  datasetFileCreationAllowed: false,
  modelArtifactCreationAllowed: false,
  modelAutoApprovalAllowed: false,
});

export const STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS = buildAiMlFailClosedFlags({
  inheritedFlags: STEP193_AI_ML_FEATURE_PIPELINE_FLAGS,
  allowedMetadataFlags: STEP194_METADATA_ONLY_ALLOWED_FLAGS,
  additionalFalseFlags: STEP194_ADDITIONAL_FALSE_FLAGS,
});

const STEP194_STATIC_COMPATIBILITY_MARKERS = Object.freeze([
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "modelDeploymentAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "kisTokenIssuanceAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForFeatureGeneration: false",
  "readyForDatasetBuild: false",
  "readyForModelTraining: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
]);

export const TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL = Object.freeze({
  preflightId: "string",
  scope: "admin_ai_ml_strategy_lab",
  status: "metadata_only_preflight",
  source: "deterministic_mock_feature_pipeline_preflight",
  redacted: true,
  requestContract: "feature_pipeline_preflight_request_contract",
  validationCategories: "feature_pipeline_preflight_validation_category[]",
  checkResult: "feature_pipeline_preflight_check_result[]",
  scenarioCatalog: "deterministic_mock_preflight_scenario[]",
  contractStatus: "valid | invalid",
  executionStatus: "blocked",
  overallStatus: "valid_contract_execution_blocked | invalid_contract | blocked_by_safety_policy",
  nextImplementationStep: "ai_ml_feature_batch_preflight_review",
  stageReferences: Object.freeze({
    sourceFeaturePipeline: AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
    preflight: AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT,
  }),
  sharedStatusVocabulary: Object.freeze({
    executionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    contractBoundary: AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE,
  }),
});

const REQUIRED_FEATURE_KEYS = Object.freeze([
  "return_1d",
  "return_20d",
  "momentum_60d",
  "volatility_20d",
  "downside_volatility_20d",
  "rolling_drawdown_60d",
  "rolling_mdd_252d",
  "volume_zscore_20d",
  "beta_252d",
  "correlation_to_benchmark_252d",
  "dividend_yield_ttm",
  "fx_return_20d",
]);

const VALIDATION_CATEGORIES = Object.freeze([
  "request_identity",
  "feature_registry",
  "dataset_label_compatibility",
  "point_in_time_validation",
  "rolling_history_requirements",
  "missing_value_policy",
  "train_only_normalization",
  "split_and_leakage_policy",
  "feature_quality_gate_configuration",
  "lineage_and_reproducibility",
  "prohibited_execution_intent",
]);

const PROHIBITED_EXECUTION_INTENTS = Object.freeze([
  "download_data",
  "query_provider",
  "query_kis",
  "issue_kis_token",
  "read_database",
  "write_database",
  "generate_features",
  "create_csv",
  "create_parquet",
  "create_feature_file",
  "build_dataset",
  "create_dataset_file",
  "run_python",
  "train_model",
  "create_model_artifact",
  "deploy_model",
  "submit_order",
  "enable_live_trading",
]);

const TEMPORAL_INVARIANTS = Object.freeze([
  "feature.availableAt <= predictionTime",
  "feature.eventTime <= featureCutoffTime",
  "featureCutoffTime <= predictionTime",
  "labelStartTime > predictionTime",
  "labelEndTime >= labelStartTime",
]);

const QUALITY_GATE_REQUIREMENTS = Object.freeze([
  "schema_validation",
  "dtype_validation",
  "range_validation",
  "finite_value_validation",
  "missing_rate_threshold",
  "staleness_threshold",
  "coverage_threshold",
  "duplicate_key_validation",
  "monotonic_timestamp_validation",
  "feature_drift_placeholder",
  "distribution_shift_placeholder",
]);

const MISSING_VALUE_STATUSES = Object.freeze([
  "observed",
  "confirmed_zero",
  "not_applicable",
  "missing_source",
  "insufficient_history",
  "stale",
  "invalid",
]);

const FORBIDDEN_NORMALIZATION_SCOPES = Object.freeze([
  "all_data",
  "full_dataset",
  "train_and_validation",
  "global_before_split",
]);

const SCENARIO_CATALOG = Object.freeze([
  { scenarioId: "scenario_a_valid_metadata_contract", expectedOverallStatus: "valid_contract_execution_blocked", redacted: true },
  { scenarioId: "scenario_b_unknown_feature", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_c_future_available_at_leakage", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_d_label_overlap", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_e_insufficient_rolling_history", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_f_invalid_normalization_scope", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_g_unconditional_zero_fill", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_h_unpinned_version", expectedOverallStatus: "invalid_contract", redacted: true },
  { scenarioId: "scenario_i_prohibited_execution_intent", expectedOverallStatus: "blocked_by_safety_policy", redacted: true },
]);

function makeCheck({ checkId, category, status = "pass", severity = "info", message, evidence = [], remediation = "none" }) {
  return Object.freeze({
    checkId,
    category,
    status,
    severity,
    message: sanitizeAiMlMetadataValue(message, "preflight_check"),
    evidence: sanitizeAiMlMetadataArray(evidence),
    remediation: sanitizeAiMlMetadataValue(remediation, "none"),
    redacted: true,
  });
}

function isPinnedVersion(value) {
  return typeof value === "string" && value.trim() !== "" && value !== "latest" && /^v\d+(\.\d+){0,2}$/.test(value);
}

function compareTime(left, operator, right) {
  if (!left || !right) return false;
  if (operator === "<=") return left <= right;
  if (operator === ">") return left > right;
  if (operator === ">=") return left >= right;
  return false;
}

function sortByCheckId(results) {
  return sortAiMlMetadataByKey(results, "checkId");
}

export function createDeterministicMockFeaturePipelinePreflightRequest(overrides = {}) {
  const requestedFeatures = [...sortAiMlMetadataByKey(REQUIRED_FEATURE_KEYS.map((featureKey) => ({
    featureKey,
    featureVersion: "v1",
    requestedLookback: featureKey === "dividend_yield_ttm" ? "12m" : featureKey.includes("252d") ? "252d" : featureKey.includes("60d") ? "60d" : featureKey.includes("20d") ? "20d" : "1d",
    availableAt: "2026-01-05T09:00:00Z",
    eventTime: "2026-01-02T21:00:00Z",
    observedPeriods: featureKey === "dividend_yield_ttm" ? 4 : featureKey.includes("252d") ? 252 : featureKey.includes("60d") ? 60 : featureKey.includes("20d") ? 20 : 1,
    warmupPolicy: "emit_missing_status_until_minimum_periods_met",
    insufficientHistoryPolicy: "insufficient_history_not_zero_fill",
    allowedMissingStates: ["observed", "confirmed_zero", "not_applicable", "missing_source", "insufficient_history", "stale", "invalid"],
  })), "featureKey")];

  return {
    requestIdentity: {
      preflightRequestId: "step194_feature_pipeline_preflight_request_v1",
      requestMode: "metadata_only",
      requestedBy: "admin_ai_ml_preflight",
    },
    datasetSpecReference: {
      datasetSpecId: "dataset-family-downside-probability-v0",
      datasetSpecVersion: "v1",
    },
    featureSetReference: {
      featureSetId: "feature-set-step193-core-v0",
      featureSetVersion: "v1",
      requestedFeatures,
    },
    labelSpecReference: {
      labelSpecId: "downside_1m_negative",
      labelSpecVersion: "v1",
      labelHorizon: "1m",
    },
    predictionSchedule: {
      predictionTime: "2026-01-05T09:00:00Z",
      featureCutoffTime: "2026-01-05T09:00:00Z",
      timezone: "UTC",
    },
    temporalBoundaries: {
      labelStartTime: "2026-01-06T00:00:00Z",
      labelEndTime: "2026-02-06T00:00:00Z",
    },
    splitPolicy: {
      splitPolicyId: "chronological-split-v0",
      splitPolicyVersion: "v1",
      policyType: "chronological",
      trainBoundary: "2015-01-01_to_2021-12-31",
      validationBoundary: "2022-01-01_to_2023-12-31",
      testBoundary: "2024-01-01_to_2025-12-31",
      purgeWindow: "1m",
      embargoWindow: "1m",
      preventEntityLeakage: true,
      preventDuplicateObservation: true,
      forbidTargetDerivedFeature: true,
      forbidFutureBenchmarkConstituentInfo: true,
      forbidPostEventRevisionUse: true,
    },
    missingValuePolicy: {
      missingValuePolicyId: "missing_value_policy_v0",
      missingValuePolicyVersion: "v1",
      allowedStates: ["observed", "confirmed_zero", "not_applicable", "missing_source", "insufficient_history", "stale", "invalid"],
      unconditionalZeroFillAllowed: false,
      distinguishMissingSourceFromConfirmedZero: true,
      staleDataPolicy: "warn_then_block_by_feature_threshold",
      invalidDataPolicy: "block_affected_feature_or_row",
    },
    normalizationPolicy: {
      normalizationPolicyId: "train_only_normalization_policy_v0",
      normalizationPolicyVersion: "v1",
      normalizerFitScope: "training_split_only",
      transformScope: "validation_test_inference_use_frozen_training_parameters",
      featureNormalizers: REQUIRED_FEATURE_KEYS.map((featureKey) => ({
        featureKey,
        normalizerType: featureKey.includes("return") ? "robust_scaler" : "none",
        normalizerVersion: "v1",
        fitMetadataLineage: "training_split_manifest_reference",
      })),
    },
    qualityGatePolicy: {
      qualityGatePolicyId: "feature_quality_gate_policy_v0",
      qualityGatePolicyVersion: "v1",
      requiredRules: [...QUALITY_GATE_REQUIREMENTS],
      driftExecutionStatus: "placeholder_only",
      distributionShiftExecutionStatus: "placeholder_only",
    },
    lineagePolicy: {
      lineagePolicyId: "feature_lineage_reproducibility_policy_v0",
      lineagePolicyVersion: "v1",
      sourceMappingVersion: "v1",
      architectureReference: "step193_admin_ai_ml_feature_pipeline_architecture",
      deterministicFingerprintContract: "field_defined_no_value_generated",
      parentContractReference: "step193_feature_pipeline_architecture",
    },
    executionIntent: {
      intentType: "metadata_only",
      requestedActions: ["validate_contract_metadata"],
    },
    ...cloneAiMlMetadata(overrides),
  };
}

export function validateFeaturePipelinePreflightRequest(request, architecture = buildAiMlFeaturePipelineArchitecture()) {
  const datasetArchitecture = buildAiMlDatasetArchitecture();
  const checks = [];
  const requestId = request?.requestIdentity?.preflightRequestId;
  const datasetSpecId = request?.datasetSpecReference?.datasetSpecId;
  const featureSetId = request?.featureSetReference?.featureSetId;
  const labelSpecId = request?.labelSpecReference?.labelSpecId;
  const requestedFeatures = normalizeAiMlMetadataArray(request?.featureSetReference?.requestedFeatures).map((feature) => cloneAiMlMetadata(feature));
  const requestedFeatureKeys = requestedFeatures.map((feature) => feature.featureKey);
  const knownFeatureKeys = new Set(architecture.rollingFeatureContracts.map((feature) => feature.featureKey));
  const knownLabels = new Set(datasetArchitecture.labelDefinitions.map((label) => label.labelId));
  const versionsToCheck = [
    request?.datasetSpecReference?.datasetSpecVersion,
    request?.featureSetReference?.featureSetVersion,
    request?.labelSpecReference?.labelSpecVersion,
    request?.splitPolicy?.splitPolicyVersion,
    request?.normalizationPolicy?.normalizationPolicyVersion,
    request?.qualityGatePolicy?.qualityGatePolicyVersion,
    request?.lineagePolicy?.lineagePolicyVersion,
    request?.lineagePolicy?.sourceMappingVersion,
  ];

  const identityOk = Boolean(requestId && datasetSpecId && featureSetId && labelSpecId)
    && versionsToCheck.every(isPinnedVersion)
    && request?.executionIntent?.intentType === "metadata_only"
    && new Set([requestId, datasetSpecId, featureSetId, labelSpecId]).size === 4;
  checks.push(makeCheck({
    checkId: "01_request_identity",
    category: "request_identity",
    status: identityOk ? "pass" : "fail",
    severity: identityOk ? "info" : "error",
    message: identityOk ? "request identity and version pins are deterministic" : "request identity or version pinning is invalid",
    evidence: [requestId || "missing_request_id", datasetSpecId || "missing_dataset_spec", featureSetId || "missing_feature_set", labelSpecId || "missing_label_spec"],
    remediation: identityOk ? "none" : "pin all IDs and use metadata_only intent",
  }));

  const unknownFeatures = requestedFeatureKeys.filter((featureKey) => !knownFeatureKeys.has(featureKey));
  const duplicateFeatures = requestedFeatureKeys.filter((featureKey, index) => requestedFeatureKeys.indexOf(featureKey) !== index);
  const deterministicOrdering = requestedFeatureKeys.join("|") === [...requestedFeatureKeys].sort().join("|");
  const unpinnedFeatureVersions = requestedFeatures.filter((feature) => !isPinnedVersion(feature.featureVersion)).map((feature) => feature.featureKey);
  const featureRegistryOk = unknownFeatures.length === 0 && duplicateFeatures.length === 0 && deterministicOrdering && unpinnedFeatureVersions.length === 0;
  checks.push(makeCheck({
    checkId: "02_feature_registry",
    category: "feature_registry",
    status: featureRegistryOk ? "pass" : "fail",
    severity: featureRegistryOk ? "info" : "error",
    message: featureRegistryOk ? "requested features exist, are pinned, and are stable ordered" : "feature registry request is invalid",
    evidence: [
      `unknown:${unknownFeatures.join(",") || "none"}`,
      `duplicates:${duplicateFeatures.join(",") || "none"}`,
      `unpinned:${unpinnedFeatureVersions.join(",") || "none"}`,
      `stable_order:${deterministicOrdering}`,
    ],
    remediation: featureRegistryOk ? "none" : "use only supported Step193 feature keys with pinned versions in sorted order",
  }));

  const predictionTime = request?.predictionSchedule?.predictionTime;
  const featureCutoffTime = request?.predictionSchedule?.featureCutoffTime;
  const labelStartTime = request?.temporalBoundaries?.labelStartTime;
  const labelEndTime = request?.temporalBoundaries?.labelEndTime;
  const temporalOk = knownLabels.has(labelSpecId)
    && compareTime(featureCutoffTime, "<=", predictionTime)
    && compareTime(labelStartTime, ">", predictionTime)
    && compareTime(labelEndTime, ">=", labelStartTime);
  checks.push(makeCheck({
    checkId: "03_dataset_label_compatibility",
    category: "dataset_label_compatibility",
    status: temporalOk ? "pass" : "fail",
    severity: temporalOk ? "info" : "critical",
    message: temporalOk ? "dataset, label, prediction, cutoff, and horizon boundaries are compatible" : "dataset or label temporal boundaries are incompatible",
    evidence: [labelSpecId || "missing_label", ...TEMPORAL_INVARIANTS, `prediction:${predictionTime || "missing"}`, `cutoff:${featureCutoffTime || "missing"}`, `labelStart:${labelStartTime || "missing"}`, `labelEnd:${labelEndTime || "missing"}`],
    remediation: temporalOk ? "none" : "separate feature cutoff from future label window",
  }));

  const futureAvailableFeatures = requestedFeatures
    .filter((feature) => !compareTime(feature.availableAt, "<=", predictionTime) || !compareTime(feature.eventTime, "<=", featureCutoffTime))
    .map((feature) => feature.featureKey);
  checks.push(makeCheck({
    checkId: "04_point_in_time_validation",
    category: "point_in_time_validation",
    status: futureAvailableFeatures.length === 0 ? "pass" : "fail",
    severity: futureAvailableFeatures.length === 0 ? "info" : "critical",
    message: futureAvailableFeatures.length === 0 ? "event and available timestamps respect point-in-time policy" : "future available or event timestamp detected",
    evidence: futureAvailableFeatures.length === 0 ? ["feature.availableAt <= predictionTime", "feature.eventTime <= featureCutoffTime"] : futureAvailableFeatures,
    remediation: futureAvailableFeatures.length === 0 ? "none" : "exclude future available features from the request",
  }));

  const rollingByKey = new Map(architecture.rollingFeatureContracts.map((feature) => [feature.featureKey, feature]));
  const insufficientHistory = requestedFeatures
    .filter((feature) => Number(feature.observedPeriods || 0) < Number(rollingByKey.get(feature.featureKey)?.minimumPeriods || 0))
    .map((feature) => feature.featureKey);
  const missingHistoryPolicy = requestedFeatures
    .filter((feature) => !feature.requestedLookback || !feature.warmupPolicy || feature.insufficientHistoryPolicy !== "insufficient_history_not_zero_fill")
    .map((feature) => feature.featureKey);
  const rollingOk = insufficientHistory.length === 0 && missingHistoryPolicy.length === 0;
  checks.push(makeCheck({
    checkId: "05_rolling_history_requirements",
    category: "rolling_history_requirements",
    status: rollingOk ? "pass" : "fail",
    severity: rollingOk ? "info" : "error",
    message: rollingOk ? "rolling history metadata satisfies minimum period contracts" : "rolling history metadata is insufficient or lacks zero-fill guard",
    evidence: [`insufficient:${insufficientHistory.join(",") || "none"}`, `policy_missing:${missingHistoryPolicy.join(",") || "none"}`],
    remediation: rollingOk ? "none" : "add warm-up and insufficient-history metadata without zero fill",
  }));

  const allowedStates = normalizeAiMlMetadataArray(request?.missingValuePolicy?.allowedStates);
  const missingStateSet = new Set(allowedStates);
  const missingPolicyOk = MISSING_VALUE_STATUSES.every((status) => missingStateSet.has(status))
    && request?.missingValuePolicy?.unconditionalZeroFillAllowed === false
    && request?.missingValuePolicy?.distinguishMissingSourceFromConfirmedZero === true
    && Boolean(request?.missingValuePolicy?.staleDataPolicy)
    && Boolean(request?.missingValuePolicy?.invalidDataPolicy);
  checks.push(makeCheck({
    checkId: "06_missing_value_policy",
    category: "missing_value_policy",
    status: missingPolicyOk ? "pass" : "fail",
    severity: missingPolicyOk ? "info" : "error",
    message: missingPolicyOk ? "missing value states are explicit and zero fill is forbidden" : "missing value policy allows unsafe or ambiguous handling",
    evidence: [`states:${allowedStates.join(",")}`, `zero_fill:${request?.missingValuePolicy?.unconditionalZeroFillAllowed}`],
    remediation: missingPolicyOk ? "none" : "separate missing source, true zero, stale, invalid, and insufficient history states",
  }));

  const normalizationScope = request?.normalizationPolicy?.normalizerFitScope;
  const featureNormalizers = normalizeAiMlMetadataArray(request?.normalizationPolicy?.featureNormalizers);
  const normalizationOk = normalizationScope === "training_split_only"
    && !FORBIDDEN_NORMALIZATION_SCOPES.includes(normalizationScope)
    && featureNormalizers.length === requestedFeatures.length
    && featureNormalizers.every((normalizer) => normalizer.featureKey && normalizer.normalizerType && isPinnedVersion(normalizer.normalizerVersion) && normalizer.fitMetadataLineage);
  checks.push(makeCheck({
    checkId: "07_train_only_normalization",
    category: "train_only_normalization",
    status: normalizationOk ? "pass" : "fail",
    severity: normalizationOk ? "info" : "critical",
    message: normalizationOk ? "normalization fit scope is train-only with pinned feature methods" : "normalization scope or metadata is unsafe",
    evidence: [normalizationScope || "missing_scope", `feature_normalizers:${featureNormalizers.length}`],
    remediation: normalizationOk ? "none" : "fit only on training split and pin normalizer metadata",
  }));

  const split = request?.splitPolicy || {};
  const splitOk = split.policyType === "chronological"
    && Boolean(split.trainBoundary)
    && Boolean(split.validationBoundary)
    && Boolean(split.testBoundary)
    && Boolean(split.purgeWindow)
    && Boolean(split.embargoWindow)
    && split.preventEntityLeakage === true
    && split.preventDuplicateObservation === true
    && split.forbidTargetDerivedFeature === true
    && split.forbidFutureBenchmarkConstituentInfo === true
    && split.forbidPostEventRevisionUse === true;
  checks.push(makeCheck({
    checkId: "08_split_and_leakage_policy",
    category: "split_and_leakage_policy",
    status: splitOk ? "pass" : "fail",
    severity: splitOk ? "info" : "critical",
    message: splitOk ? "chronological split, purge, embargo, and leakage guards are configured" : "split or leakage policy is incomplete",
    evidence: [split.policyType || "missing_policy", `purge:${split.purgeWindow || "missing"}`, `embargo:${split.embargoWindow || "missing"}`],
    remediation: splitOk ? "none" : "configure chronological split with purge, embargo, and leakage controls",
  }));

  const qualityRules = normalizeAiMlMetadataArray(request?.qualityGatePolicy?.requiredRules);
  const missingQualityRules = QUALITY_GATE_REQUIREMENTS.filter((rule) => !qualityRules.includes(rule));
  const qualityOk = missingQualityRules.length === 0
    && request?.qualityGatePolicy?.driftExecutionStatus === "placeholder_only"
    && request?.qualityGatePolicy?.distributionShiftExecutionStatus === "placeholder_only";
  checks.push(makeCheck({
    checkId: "09_feature_quality_gate_configuration",
    category: "feature_quality_gate_configuration",
    status: qualityOk ? "pass" : "fail",
    severity: qualityOk ? "info" : "error",
    message: qualityOk ? "quality gate configuration is complete and drift checks remain placeholder-only" : "quality gate configuration is incomplete",
    evidence: missingQualityRules.length === 0 ? QUALITY_GATE_REQUIREMENTS : missingQualityRules,
    remediation: qualityOk ? "none" : "define required quality gates without executing data validation",
  }));

  const lineage = request?.lineagePolicy || {};
  const lineageOk = isPinnedVersion(lineage.lineagePolicyVersion)
    && isPinnedVersion(lineage.sourceMappingVersion)
    && Boolean(lineage.architectureReference)
    && Boolean(lineage.deterministicFingerprintContract)
    && Boolean(lineage.parentContractReference);
  checks.push(makeCheck({
    checkId: "10_lineage_and_reproducibility",
    category: "lineage_and_reproducibility",
    status: lineageOk ? "pass" : "fail",
    severity: lineageOk ? "info" : "error",
    message: lineageOk ? "lineage references are pinned and reproducibility contract is metadata-only" : "lineage or reproducibility metadata is incomplete",
    evidence: [lineage.architectureReference || "missing_architecture", lineage.parentContractReference || "missing_parent"],
    remediation: lineageOk ? "none" : "pin lineage policy, source mapping, architecture, and parent contract references",
  }));

  const requestedActions = normalizeAiMlMetadataArray(request?.executionIntent?.requestedActions);
  const prohibitedActions = requestedActions.filter((action) => PROHIBITED_EXECUTION_INTENTS.includes(action));
  checks.push(makeCheck({
    checkId: "11_prohibited_execution_intent",
    category: "prohibited_execution_intent",
    status: prohibitedActions.length === 0 ? "pass" : "blocked",
    severity: prohibitedActions.length === 0 ? "info" : "critical",
    message: prohibitedActions.length === 0 ? "execution intent is metadata-only" : "prohibited execution intent detected and blocked",
    evidence: prohibitedActions.length === 0 ? ["validate_contract_metadata"] : prohibitedActions,
    remediation: prohibitedActions.length === 0 ? "none" : "remove execution, provider, DB, file, training, deployment, and order intents",
  }));

  return sortByCheckId(checks);
}

export function buildFeaturePipelinePreflightCheckResults(request, architecture) {
  return validateFeaturePipelinePreflightRequest(request, architecture);
}

export function evaluateAiMlFeaturePipelinePreflight(input = {}) {
  const options = cloneAiMlMetadata(input) || {};
  const featurePipelineArchitecture = options.featurePipelineArchitecture || buildAiMlFeaturePipelineArchitecture(options);
  const request = options.request || createDeterministicMockFeaturePipelinePreflightRequest(options.requestOverrides || {});
  const checkResults = buildFeaturePipelinePreflightCheckResults(request, featurePipelineArchitecture);
  const failedCount = checkResults.filter((check) => check.status === "fail").length;
  const blockedCount = checkResults.filter((check) => check.status === "blocked").length;
  const passCount = checkResults.filter((check) => check.status === "pass").length;
  const contractStatus = failedCount === 0 && blockedCount === 0 ? "valid" : "invalid";
  const overallStatus = blockedCount > 0 ? "blocked_by_safety_policy" : contractStatus === "valid" ? "valid_contract_execution_blocked" : "invalid_contract";

  return {
    preflightId: "step194_ai_ml_feature_pipeline_preflight",
    scope: "admin_ai_ml_strategy_lab",
    status: "metadata_only_preflight",
    source: "deterministic_mock_feature_pipeline_preflight",
    contractStatus,
    executionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    overallStatus,
    metadataOnlyPreflight: true,
    contractBoundary: AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE,
    sourceStageId: AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
    stageId: AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT,
    validationCategories: [...VALIDATION_CATEGORIES],
    checkResults,
    passCount,
    failCount: failedCount,
    blockedCount,
    notApplicableCount: checkResults.filter((check) => check.status === "not_applicable").length,
    versionPinningStatus: checkResults.find((check) => check.checkId === "01_request_identity")?.status || "fail",
    pointInTimeValidationStatus: checkResults.find((check) => check.checkId === "04_point_in_time_validation")?.status || "fail",
    rollingHistoryContractStatus: checkResults.find((check) => check.checkId === "05_rolling_history_requirements")?.status || "fail",
    missingValuePolicyStatus: checkResults.find((check) => check.checkId === "06_missing_value_policy")?.status || "fail",
    trainOnlyNormalizationStatus: checkResults.find((check) => check.checkId === "07_train_only_normalization")?.status || "fail",
    leakageGuardStatus: checkResults.find((check) => check.checkId === "08_split_and_leakage_policy")?.status || "fail",
    qualityGateConfigurationStatus: checkResults.find((check) => check.checkId === "09_feature_quality_gate_configuration")?.status || "fail",
    lineageReproducibilityStatus: checkResults.find((check) => check.checkId === "10_lineage_and_reproducibility")?.status || "fail",
    scenarioCatalog: [...SCENARIO_CATALOG],
    requestContractSummary: {
      preflightRequestId: request.requestIdentity?.preflightRequestId || "missing",
      datasetSpecId: request.datasetSpecReference?.datasetSpecId || "missing",
      datasetSpecVersion: request.datasetSpecReference?.datasetSpecVersion || "missing",
      featureSetId: request.featureSetReference?.featureSetId || "missing",
      featureSetVersion: request.featureSetReference?.featureSetVersion || "missing",
      labelSpecId: request.labelSpecReference?.labelSpecId || "missing",
      labelSpecVersion: request.labelSpecReference?.labelSpecVersion || "missing",
      splitPolicyId: request.splitPolicy?.splitPolicyId || "missing",
      normalizationPolicyId: request.normalizationPolicy?.normalizationPolicyId || "missing",
      qualityGatePolicyId: request.qualityGatePolicy?.qualityGatePolicyId || "missing",
      requestedFeatureCount: Array.isArray(request.featureSetReference?.requestedFeatures) ? request.featureSetReference.requestedFeatures.length : 0,
      redacted: true,
    },
    readyForFeatureGeneration: false,
    readyForDatasetBuild: false,
    readyForTraining: false,
    redacted: true,
  };
}

export function buildAiMlFeaturePipelinePreflight(input = {}) {
  return evaluateAiMlFeaturePipelinePreflight(input);
}

export function buildAdminTradingAiMlFeaturePipelinePreflightStatus(input = {}) {
  const preflight = input.preflight || evaluateAiMlFeaturePipelinePreflight(input);
  return {
    ok: true,
    step: "Step 194: Add AI/ML feature pipeline preflight contract",
    status: "admin_only_ai_ml_feature_pipeline_preflight_metadata_only",
    sourceStep: "step194",
    preflightModel: TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL,
    preflight,
    blockedConfirmation: {
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      datasetBuildAttempted: false,
      pythonJobAttempted: false,
      modelTrainingAttempted: false,
      modelArtifactCreated: false,
      csvCreated: false,
      parquetCreated: false,
      featureFileCreated: false,
      datasetFileCreated: false,
      dbReadAttempted: false,
      dbWriteAttempted: false,
      persistentDbWriteAttempted: false,
      providerCallAttempted: false,
      quoteCallAttempted: false,
      kisCallAttempted: false,
      kisTokenIssuanceAttempted: false,
      orderSubmissionAttempted: false,
      liveTradingAttempted: false,
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS },
    metadataOnlyPreflightEvaluationAllowed: true,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
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
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
    readyForActualDataDownload: false,
    readyForFeatureGeneration: false,
    readyForDatasetBuild: false,
    readyForModelTraining: false,
    readyForModelDeployment: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}
