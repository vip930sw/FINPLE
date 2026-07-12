import {
  STEP195_AI_ML_READINESS_GATE_FLAGS,
  buildAiMlReadinessGateSummary,
} from "./tradingAiMlReadinessGateSummary.js";
import {
  buildAiMlFeaturePipelinePreflight,
} from "./tradingAiMlFeaturePipelinePreflight.js";
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

export const STEP196_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({
  adminReadOnlyReadinessAggregationAllowed: true,
  deterministicStatusCompositionAllowed: true,
  metadataOnlyPreflightEvaluationAllowed: true,
  adminReadOnlyBatchContractReviewAllowed: true,
  deterministicMetadataChecklistAllowed: true,
});

export const STEP196_ADDITIONAL_FALSE_FLAGS = Object.freeze({
  featureFileCreationAllowed: false,
  datasetFileCreationAllowed: false,
  manualApprovalPersistenceAllowed: false,
  modelArtifactCreationAllowed: false,
  modelAutoApprovalAllowed: false,
});

export const STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS = buildAiMlFailClosedFlags({
  inheritedFlags: STEP195_AI_ML_READINESS_GATE_FLAGS,
  allowedMetadataFlags: STEP196_METADATA_ONLY_ALLOWED_FLAGS,
  additionalFalseFlags: STEP196_ADDITIONAL_FALSE_FLAGS,
});

export const TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL = Object.freeze({
  reviewId: "string",
  scope: "admin_ai_ml_strategy_lab",
  status: "metadata_only_batch_contract_review",
  source: "deterministic_step195_readiness_and_step194_preflight_composition",
  redacted: true,
  requestContract: "ai_ml_batch_contract_request_metadata",
  reviewChecks: "ai_ml_batch_contract_review_check[]",
  approvalChecklist: "ai_ml_batch_contract_approval_checklist_item[]",
  reviewEligibilityStatus: "eligible_for_manual_review | not_eligible",
  approvalStatus: "not_granted",
  approvalScope: "dry_run_manifest_design_only",
  executionAuthorizationStatus: "denied",
  batchExecutionStatus: "blocked",
  outputCreationStatus: "blocked",
  overallStatus: "invalid_upstream_contract | blocked_by_safety_policy | contract_needs_revision | review_ready_execution_blocked",
  nextSafeImplementationStep: "dry_run_manifest_contract_design",
  sourceStageId: AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY,
  reviewStageId: AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW,
  defaultStatus: {
    approvalStatus: AI_ML_CONTRACT_STATUS.NOT_GRANTED,
    executionAuthorizationStatus: AI_ML_CONTRACT_STATUS.DENIED,
    batchExecutionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    outputCreationStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    externalAuthorityStatus: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
    reviewMode: AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE,
    redacted: true,
  },
});

const REQUIRED_REQUEST_SECTIONS = Object.freeze([
  "requestIdentity",
  "upstreamContractReferences",
  "batchPurpose",
  "targetUniverseDeclaration",
  "predictionSchedule",
  "temporalBoundaries",
  "featureSetReference",
  "labelSpecReference",
  "datasetSpecReference",
  "splitPolicyReference",
  "normalizationPolicyReference",
  "qualityPolicyReference",
  "inputSourceDeclarations",
  "partitionPlanDeclaration",
  "outputPlanDeclaration",
  "retentionPolicyDeclaration",
  "resourceBudgetDeclaration",
  "ownershipAndReview",
  "rollbackAndCancellationPlan",
  "executionIntent",
]);

const REVIEW_CATEGORIES = Object.freeze([
  "upstream_readiness",
  "request_identity",
  "version_pinning",
  "batch_purpose",
  "target_universe",
  "prediction_schedule",
  "temporal_boundaries",
  "point_in_time_and_leakage",
  "feature_label_dataset_compatibility",
  "input_source_declarations",
  "partition_plan",
  "output_plan_restrictions",
  "data_governance_and_retention",
  "resource_budget_declaration",
  "ownership_and_review",
  "rollback_and_cancellation",
  "prohibited_execution_intent",
  "external_authority_context",
]);

const ALLOWED_BATCH_PURPOSES = Object.freeze([
  "dry_run_manifest_design",
  "batch_contract_review",
  "partition_plan_review",
  "lineage_plan_review",
  "quality_gate_plan_review",
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
  "create_feature_file",
  "create_dataset_file",
  "build_dataset",
  "generate_features",
  "run_python",
  "train_model",
  "create_model_artifact",
  "deploy_model",
  "submit_order",
  "enable_live_trading",
  "persist_approval",
  "grant_execution_authority",
]);

const PROHIBITED_OUTPUT_INTENTS = Object.freeze([
  "create_csv",
  "create_parquet",
  "write_feature_file",
  "write_dataset_file",
  "write_model_artifact",
  "upload_dataset",
  "persist_to_database",
]);

const REQUIRED_REVIEW_ROLES = Object.freeze([
  "requestOwner",
  "dataOwner",
  "featureOwner",
  "modelRiskReviewer",
  "securityPrivacyReviewer",
  "complianceLegalReviewer",
  "operationsReviewer",
  "finalManualReviewer",
]);

const REQUIRED_TEMPORAL_RULES = Object.freeze([
  "feature.availableAt <= predictionTime",
  "feature.eventTime <= featureCutoffTime",
  "featureCutoffTime <= predictionTime",
  "labelStartTime > predictionTime",
  "labelEndTime >= labelStartTime",
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_upstream_contract",
  "blocked_by_safety_policy",
  "contract_needs_revision",
  "review_ready_execution_blocked",
]);

const SCENARIO_CATALOG = Object.freeze([
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

function makeCheck({ checkId, category, status = "pass", severity = "info", message, evidence = [], remediation = "none", blocking = false, manualReviewRequired = false }) {
  return Object.freeze({
    checkId,
    category,
    status,
    severity,
    message: sanitizeAiMlMetadataValue(message, "metadata check"),
    evidence: sanitizeAiMlMetadataArray(evidence),
    remediation: sanitizeAiMlMetadataValue(remediation, "none"),
    blocking,
    manualReviewRequired,
    redacted: true,
  });
}

function getNested(input, path) {
  return path.split(".").reduce((value, key) => value?.[key], input);
}

function mergeObject(base, override) {
  const baseClone = cloneAiMlMetadata(base) || {};
  const overrideClone = cloneAiMlMetadata(override);
  if (!overrideClone || typeof overrideClone !== "object" || Array.isArray(overrideClone)) return baseClone;
  return Object.entries(overrideClone).reduce((next, [key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      return { ...next, [key]: mergeObject(next[key], value) };
    }
    return { ...next, [key]: value };
  }, baseClone);
}

export function createDeterministicMockBatchContractRequest(overrides = {}) {
  const request = {
    requestIdentity: {
      batchContractId: "step196_ai_ml_batch_contract_review_v1",
      batchContractVersion: "v1",
      requestMode: "metadata_only_contract_review",
      requestedByRole: "admin_ai_ml_batch_reviewer",
    },
    upstreamContractReferences: {
      readinessSummaryId: "step195_ai_ml_readiness_gate_summary",
      readinessSummaryVersion: "v1",
      featurePipelinePreflightId: "step194_ai_ml_feature_pipeline_preflight",
      featurePipelinePreflightVersion: "v1",
    },
    batchPurpose: {
      purposeType: "dry_run_manifest_design",
      purposeVersion: "v1",
      allowedPurposeOnly: true,
    },
    targetUniverseDeclaration: {
      markets: ["KR", "US"],
      assetClasses: ["equity", "etf"],
      currencies: ["KRW", "USD"],
      benchmarkReference: "global_equity_benchmark_metadata_v1",
      universeMode: "declared_metadata_only",
      inclusionPolicy: "eligible_assets_declared_by_contract_only",
      exclusionPolicy: "exclude_halted_delisted_or_unreviewed_assets_by_policy",
      survivorshipBiasPolicy: "prediction_time_membership_required",
      delistingPolicy: "delisting_status_as_of_prediction_time",
      corporateActionPolicy: "availability_time_based_adjustment_policy",
    },
    predictionSchedule: {
      predictionTime: "2026-01-05T09:00:00Z",
      featureCutoffTime: "2026-01-05T09:00:00Z",
      scheduleType: "single_batch_manifest_review",
      timezone: "UTC",
      cutoffConvention: "feature_cutoff_at_or_before_prediction_time",
      holidayCalendarPolicy: "declared_market_calendar_policy_only",
      lateArrivingDataPolicy: "exclude_until_future_versioned_manifest",
      revisedDataPolicy: "new_snapshot_version_required",
    },
    temporalBoundaries: {
      batchObservationStart: "2025-01-01T00:00:00Z",
      batchObservationEnd: "2026-01-05T09:00:00Z",
      labelStartTime: "2026-01-06T00:00:00Z",
      labelEndTime: "2026-02-06T00:00:00Z",
      purgeWindow: "1m",
      embargoWindow: "1m",
      temporalRules: [...REQUIRED_TEMPORAL_RULES],
    },
    featureSetReference: {
      featureSetId: "feature-set-step193-core-v0",
      featureSetVersion: "v1",
    },
    labelSpecReference: {
      labelSpecId: "downside_1m_negative",
      labelSpecVersion: "v1",
    },
    datasetSpecReference: {
      datasetSpecId: "dataset-family-downside-probability-v0",
      datasetSpecVersion: "v1",
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
    inputSourceDeclarations: [
      {
        sourceId: "daily_price_contract_v0",
        sourceType: "daily_price",
        sourceContractVersion: "v1",
        declaredFields: ["asset_id", "event_time", "available_at", "adjusted_close"],
        eventTimeField: "event_time",
        availableAtField: "available_at",
        freshnessPolicy: "block_after_declared_staleness_threshold",
        missingPolicy: "missing_source_not_zero",
        accessStatus: "blocked",
        redacted: true,
      },
      {
        sourceId: "feature_registry_contract_v0",
        sourceType: "feature_registry",
        sourceContractVersion: "v1",
        declaredFields: ["feature_key", "feature_version", "lineage_reference"],
        eventTimeField: "feature_event_time",
        availableAtField: "feature_available_at",
        freshnessPolicy: "metadata_review_only",
        missingPolicy: "block_missing_required_feature_metadata",
        accessStatus: "blocked",
        redacted: true,
      },
    ],
    partitionPlanDeclaration: {
      partitionKeys: ["market", "prediction_date"],
      declaredPartitionCount: 4,
      declaredEstimatedRows: 1200,
      declaredBatchWindow: "2025-01-01_to_2026-01-05",
      declaredSortKeys: ["asset_id", "prediction_time"],
      declaredUniqueKeys: ["asset_id", "prediction_time", "feature_set_version"],
      deduplicationPolicy: "reject_duplicate_unique_keys",
      partitionOverlapPolicy: "reject_overlapping_partition_windows",
      emptyPartitionPolicy: "manual_review_required",
      lateDataHandlingPolicy: "future_manifest_version_only",
    },
    outputPlanDeclaration: {
      proposedOutputFormat: "manifest_metadata_only",
      proposedLogicalDatasetId: "step196_dry_run_manifest_design",
      proposedPartitionLayout: "market_prediction_date",
      proposedSchemaVersion: "v1",
      proposedRetentionClass: "metadata_review_only",
      outputCreationStatus: "blocked",
      outputPathStatus: "not_assigned",
      fileCreationAuthorization: "denied",
      requestedOutputIntents: ["declare_manifest_shape"],
    },
    retentionPolicyDeclaration: {
      dataClassification: "metadata_contract_only",
      piiPresenceDeclaration: "none_declared",
      credentialExclusionDeclaration: "excluded",
      rawAccountDataDeclaration: "excluded",
      retentionClass: "metadata_review_only",
      deletionPolicy: "delete_review_metadata_by_policy",
      accessRoleDeclaration: "admin_review_only",
      redactionPolicy: "status_and_contract_ids_only",
      lineageRetention: "lineage_reference_only",
      auditMetadataPolicy: "redacted_status_only",
      retentionStatus: "declaration_only",
      persistenceStatus: "blocked",
    },
    resourceBudgetDeclaration: {
      declaredMaxRows: 5000,
      declaredMaxFeatures: 64,
      declaredMaxPartitions: 8,
      declaredMemoryClass: "small_review_only",
      declaredRuntimeClass: "not_executed",
      declaredConcurrency: 1,
      declaredRetryPolicy: "manual_retry_review_only",
    },
    ownershipAndReview: {
      requestOwner: "admin_ai_ml_request_owner",
      dataOwner: "admin_data_owner",
      featureOwner: "admin_feature_owner",
      modelRiskReviewer: "admin_model_risk_reviewer",
      securityPrivacyReviewer: "admin_security_privacy_reviewer",
      complianceLegalReviewer: "admin_compliance_legal_reviewer",
      operationsReviewer: "admin_operations_reviewer",
      finalManualReviewer: "admin_final_manual_reviewer",
    },
    rollbackAndCancellationPlan: {
      cancellationPolicy: "cancel_before_any_execution",
      partialOutputPolicy: "not_applicable_no_output_created",
      retryPolicy: "new_review_request_required",
      duplicateRunPolicy: "idempotent_contract_id_required",
      idempotencyPolicy: "batch_contract_id_and_version",
      rollbackOwner: "admin_operations_reviewer",
      incidentEscalationRole: "admin_security_privacy_reviewer",
    },
    executionIntent: {
      intentType: "metadata_only_review",
      requestedActions: ["review_batch_contract_metadata"],
    },
  };

  return mergeObject(request, overrides);
}

export function collectBatchContractUpstreamStatuses(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const upstreamInput = {
    aiMlStrategyManagementStatus: sourceInput.aiMlStrategyManagementStatus,
    aiMlDatasetArchitectureStatus: sourceInput.aiMlDatasetArchitectureStatus,
    aiMlFeaturePipelineStatus: sourceInput.aiMlFeaturePipelineStatus,
    aiMlFeaturePipelinePreflightStatus: sourceInput.aiMlFeaturePipelinePreflightStatus,
    aiMlReadinessGateSummaryStatus: sourceInput.aiMlReadinessGateSummaryStatus,
  };
  const readinessSummary = mergeObject(
    sourceInput.readinessSummary || sourceInput.aiMlReadinessGateSummaryStatus?.summary || buildAiMlReadinessGateSummary(upstreamInput, sourceOptions),
    sourceInput.readinessSummaryOverrides,
  );
  const preflight = cloneAiMlMetadata(sourceInput.preflight || sourceInput.aiMlFeaturePipelinePreflightStatus?.preflight || buildAiMlFeaturePipelinePreflight(upstreamInput));
  return {
    readinessSummary,
    preflight,
    expectedReadiness: {
      capabilityStage: "contract_preflight_only",
      internalContractStatus: "documented_and_validated",
      metadataPreflightStatus: "valid",
      executionPermissionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
      overallStatus: "internal_contracts_valid_execution_blocked",
      orderAuthorityStatus: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
      liveTradingStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    },
    redacted: true,
  };
}

export function buildBatchContractApprovalChecklist(request) {
  return sortAiMlMetadataByKey(REQUIRED_REVIEW_ROLES.map((role) => {
    const declared = Boolean(request?.ownershipAndReview?.[role]);
    return Object.freeze({
      checklistItemId: `approval_${role}`,
      role,
      required: true,
      status: declared ? "declared" : "missing",
      scope: "dry_run_manifest_design_only",
      message: sanitizeAiMlMetadataValue(declared ? "review role declared; manual approval is not granted" : "required review role is missing"),
      redacted: true,
    });
  }), "checklistItemId");
}

export function buildBatchContractReviewChecks(request, upstreamStatuses = collectBatchContractUpstreamStatuses()) {
  const checks = [];
  const readiness = upstreamStatuses.readinessSummary || {};
  const expected = upstreamStatuses.expectedReadiness || {};
  const upstreamOk = Object.entries(expected).every(([key, value]) => readiness[key] === value);

  checks.push(makeCheck({
    checkId: "01_upstream_readiness",
    category: "upstream_readiness",
    status: upstreamOk ? "pass" : "fail",
    severity: upstreamOk ? "info" : "critical",
    message: upstreamOk ? "Step 195 readiness summary supports metadata-only batch review" : "Step 195 readiness summary is invalid or incomplete",
    evidence: Object.keys(expected).map((key) => `${key}:${readiness[key] || "missing"}`),
    remediation: upstreamOk ? "none" : "restore Step 195 readiness before reviewing batch contracts",
    blocking: !upstreamOk,
  }));

  const missingSections = REQUIRED_REQUEST_SECTIONS.filter((section) => !request?.[section]);
  const identityOk = Boolean(request?.requestIdentity?.batchContractId && isPinnedVersion(request?.requestIdentity?.batchContractVersion));
  checks.push(makeCheck({
    checkId: "02_request_identity",
    category: "request_identity",
    status: missingSections.length === 0 && identityOk ? "pass" : "fail",
    severity: missingSections.length === 0 && identityOk ? "info" : "error",
    message: missingSections.length === 0 && identityOk ? "batch contract identity and required sections are declared" : "batch contract identity or sections are incomplete",
    evidence: missingSections.length === 0 ? [request?.requestIdentity?.batchContractId || "missing_batch_contract_id"] : missingSections,
    remediation: missingSections.length === 0 && identityOk ? "none" : "declare all required metadata-only request sections",
    blocking: missingSections.length > 0 || !identityOk,
  }));

  const versionPaths = [
    "requestIdentity.batchContractVersion",
    "datasetSpecReference.datasetSpecVersion",
    "featureSetReference.featureSetVersion",
    "labelSpecReference.labelSpecVersion",
    "splitPolicyReference.splitPolicyVersion",
    "normalizationPolicyReference.normalizationPolicyVersion",
    "qualityPolicyReference.qualityPolicyVersion",
    "upstreamContractReferences.readinessSummaryVersion",
    "upstreamContractReferences.featurePipelinePreflightVersion",
  ];
  const unpinnedVersions = versionPaths.filter((path) => !isPinnedVersion(getNested(request, path)));
  checks.push(makeCheck({
    checkId: "03_version_pinning",
    category: "version_pinning",
    status: unpinnedVersions.length === 0 ? "pass" : "fail",
    severity: unpinnedVersions.length === 0 ? "info" : "error",
    message: unpinnedVersions.length === 0 ? "all major contract references are version pinned" : "one or more contract references are not pinned",
    evidence: unpinnedVersions.length === 0 ? versionPaths : unpinnedVersions,
    remediation: unpinnedVersions.length === 0 ? "none" : "replace latest/current/auto/unversioned references with explicit v-prefixed versions",
    blocking: unpinnedVersions.length > 0,
  }));

  const purpose = request?.batchPurpose?.purposeType;
  const purposeOk = ALLOWED_BATCH_PURPOSES.includes(purpose);
  checks.push(makeCheck({
    checkId: "04_batch_purpose",
    category: "batch_purpose",
    status: purposeOk ? "pass" : AI_ML_CONTRACT_STATUS.BLOCKED,
    severity: purposeOk ? "info" : "critical",
    message: purposeOk ? "batch purpose is metadata review only" : "batch purpose implies prohibited execution",
    evidence: [purpose || "missing_purpose"],
    remediation: purposeOk ? "none" : "use dry_run_manifest_design or another review-only purpose",
    blocking: !purposeOk,
  }));

  const universe = request?.targetUniverseDeclaration || {};
  const universeFields = ["markets", "assetClasses", "currencies", "benchmarkReference", "inclusionPolicy", "exclusionPolicy", "survivorshipBiasPolicy", "delistingPolicy", "corporateActionPolicy"];
  const missingUniverse = universeFields.filter((field) => Array.isArray(universe[field]) ? universe[field].length === 0 : !universe[field]);
  const universeOk = universe.universeMode === "declared_metadata_only" && missingUniverse.length === 0;
  checks.push(makeCheck({
    checkId: "05_target_universe",
    category: "target_universe",
    status: universeOk ? "pass" : "fail",
    severity: universeOk ? "info" : "error",
    message: universeOk ? "target universe is declared as metadata only" : "target universe declaration is incomplete",
    evidence: universeOk ? ["declared_metadata_only", ...(universe.markets || []), ...(universe.assetClasses || [])] : missingUniverse,
    remediation: universeOk ? "none" : "declare market, asset, currency, benchmark, and bias policies without provider lookup",
    blocking: !universeOk,
  }));

  const schedule = request?.predictionSchedule || {};
  const scheduleFields = ["predictionTime", "featureCutoffTime", "timezone", "cutoffConvention", "holidayCalendarPolicy", "lateArrivingDataPolicy", "revisedDataPolicy"];
  const missingSchedule = scheduleFields.filter((field) => !schedule[field]);
  checks.push(makeCheck({
    checkId: "06_prediction_schedule",
    category: "prediction_schedule",
    status: missingSchedule.length === 0 ? "pass" : "fail",
    severity: missingSchedule.length === 0 ? "info" : "error",
    message: missingSchedule.length === 0 ? "prediction schedule metadata is declared" : "prediction schedule metadata is incomplete",
    evidence: missingSchedule.length === 0 ? scheduleFields : missingSchedule,
    remediation: missingSchedule.length === 0 ? "none" : "declare schedule, timezone, cutoff, calendar, late-data, and revision policy",
    blocking: missingSchedule.length > 0,
  }));

  const temporal = request?.temporalBoundaries || {};
  const temporalOk = Boolean(temporal.batchObservationStart && temporal.batchObservationEnd && temporal.purgeWindow && temporal.embargoWindow)
    && compareTime(schedule.featureCutoffTime, "<=", schedule.predictionTime)
    && compareTime(temporal.labelStartTime, ">", schedule.predictionTime)
    && compareTime(temporal.labelEndTime, ">=", temporal.labelStartTime);
  checks.push(makeCheck({
    checkId: "07_temporal_boundaries",
    category: "temporal_boundaries",
    status: temporalOk ? "pass" : "fail",
    severity: temporalOk ? "info" : "critical",
    message: temporalOk ? "temporal boundaries, purge, and embargo declarations are valid" : "temporal boundary declaration is invalid",
    evidence: temporalOk ? REQUIRED_TEMPORAL_RULES : ["temporal_boundary_invalid"],
    remediation: temporalOk ? "none" : "separate feature cutoff and future label windows with purge and embargo",
    blocking: !temporalOk,
  }));

  const declaredRules = normalizeAiMlMetadataArray(temporal.temporalRules);
  const missingTemporalRules = REQUIRED_TEMPORAL_RULES.filter((rule) => !declaredRules.includes(rule));
  checks.push(makeCheck({
    checkId: "08_point_in_time_and_leakage",
    category: "point_in_time_and_leakage",
    status: missingTemporalRules.length === 0 ? "pass" : "fail",
    severity: missingTemporalRules.length === 0 ? "info" : "critical",
    message: missingTemporalRules.length === 0 ? "PIT and leakage invariants are declared" : "PIT or leakage invariants are missing",
    evidence: missingTemporalRules.length === 0 ? REQUIRED_TEMPORAL_RULES : missingTemporalRules,
    remediation: missingTemporalRules.length === 0 ? "none" : "declare PIT invariants before manifest design review",
    blocking: missingTemporalRules.length > 0,
  }));

  const compatibilityOk = Boolean(request?.featureSetReference?.featureSetId && request?.labelSpecReference?.labelSpecId && request?.datasetSpecReference?.datasetSpecId);
  checks.push(makeCheck({
    checkId: "09_feature_label_dataset_compatibility",
    category: "feature_label_dataset_compatibility",
    status: compatibilityOk ? "pass" : "fail",
    severity: compatibilityOk ? "info" : "error",
    message: compatibilityOk ? "feature, label, and dataset references are present" : "feature, label, or dataset reference is missing",
    evidence: [request?.featureSetReference?.featureSetId || "missing_feature_set", request?.labelSpecReference?.labelSpecId || "missing_label", request?.datasetSpecReference?.datasetSpecId || "missing_dataset"],
    remediation: compatibilityOk ? "none" : "declare feature set, label spec, and dataset spec references",
    blocking: !compatibilityOk,
  }));

  const sourceDeclarations = normalizeAiMlMetadataArray(request?.inputSourceDeclarations);
  const badSources = sourceDeclarations.filter((source) => !source.sourceId || !source.sourceType || !isPinnedVersion(source.sourceContractVersion) || !source.eventTimeField || !source.availableAtField || source.accessStatus !== "blocked");
  checks.push(makeCheck({
    checkId: "10_input_source_declarations",
    category: "input_source_declarations",
    status: sourceDeclarations.length > 0 && badSources.length === 0 ? "pass" : "fail",
    severity: sourceDeclarations.length > 0 && badSources.length === 0 ? "info" : "error",
    message: sourceDeclarations.length > 0 && badSources.length === 0 ? "input sources are metadata declarations with blocked access" : "input source declaration is incomplete or access is not blocked",
    evidence: badSources.length === 0 ? sourceDeclarations.map((source) => `${source.sourceId}:${source.accessStatus}`) : badSources.map((source) => source.sourceId || "missing_source_id"),
    remediation: sourceDeclarations.length > 0 && badSources.length === 0 ? "none" : "declare source metadata with blocked access and timestamp fields",
    blocking: sourceDeclarations.length === 0 || badSources.length > 0,
  }));

  const partition = request?.partitionPlanDeclaration || {};
  const partitionOk = Array.isArray(partition.partitionKeys) && partition.partitionKeys.length > 0
    && Array.isArray(partition.declaredUniqueKeys) && partition.declaredUniqueKeys.length > 0
    && Array.isArray(partition.declaredSortKeys) && partition.declaredSortKeys.length > 0
    && Boolean(partition.partitionOverlapPolicy)
    && Boolean(partition.emptyPartitionPolicy)
    && Boolean(partition.lateDataHandlingPolicy);
  checks.push(makeCheck({
    checkId: "11_partition_plan",
    category: "partition_plan",
    status: partitionOk ? "pass" : "fail",
    severity: partitionOk ? "info" : "error",
    message: partitionOk ? "partition plan is declared without calculating real rows" : "partition plan declaration is incomplete",
    evidence: partitionOk ? ["partition_keys_declared", "unique_keys_declared", "overlap_policy_declared"] : ["partition_plan_incomplete"],
    remediation: partitionOk ? "none" : "declare keys, deterministic ordering, duplicate policy, overlap policy, and late data policy",
    blocking: !partitionOk,
  }));

  const output = request?.outputPlanDeclaration || {};
  const requestedOutputIntents = normalizeAiMlMetadataArray(output.requestedOutputIntents);
  const prohibitedOutputIntents = requestedOutputIntents.filter((intent) => PROHIBITED_OUTPUT_INTENTS.includes(intent));
  const outputOk = output.outputCreationStatus === "blocked"
    && output.outputPathStatus === "not_assigned"
    && output.fileCreationAuthorization === "denied"
    && prohibitedOutputIntents.length === 0;
  checks.push(makeCheck({
    checkId: "12_output_plan_restrictions",
    category: "output_plan_restrictions",
    status: outputOk ? "pass" : AI_ML_CONTRACT_STATUS.BLOCKED,
    severity: outputOk ? "info" : "critical",
    message: outputOk ? "output plan is manifest metadata only and file creation is denied" : "output plan includes prohibited creation or persistence intent",
    evidence: outputOk ? [output.outputCreationStatus, output.outputPathStatus, output.fileCreationAuthorization] : prohibitedOutputIntents,
    remediation: outputOk ? "none" : "remove CSV, parquet, file, upload, artifact, and database persistence intents",
    blocking: !outputOk,
  }));

  const governance = request?.retentionPolicyDeclaration || {};
  const governanceOk = governance.piiPresenceDeclaration === "none_declared"
    && governance.credentialExclusionDeclaration === "excluded"
    && governance.rawAccountDataDeclaration === "excluded"
    && governance.retentionStatus === "declaration_only"
    && governance.persistenceStatus === "blocked"
    && Boolean(governance.redactionPolicy)
    && Boolean(governance.auditMetadataPolicy);
  checks.push(makeCheck({
    checkId: "13_data_governance_and_retention",
    category: "data_governance_and_retention",
    status: governanceOk ? "pass" : "fail",
    severity: governanceOk ? "info" : "error",
    message: governanceOk ? "governance and retention declarations exclude sensitive data and persistence" : "governance or retention declaration is incomplete",
    evidence: [governance.piiPresenceDeclaration || "missing_pii", governance.credentialExclusionDeclaration || "missing_credential_policy", governance.persistenceStatus || "missing_persistence"],
    remediation: governanceOk ? "none" : "declare classification, PII, credential exclusion, redaction, audit, and persistence status",
    blocking: !governanceOk,
  }));

  const budget = request?.resourceBudgetDeclaration || {};
  const budgetFields = ["declaredMaxRows", "declaredMaxFeatures", "declaredMaxPartitions", "declaredMemoryClass", "declaredRuntimeClass", "declaredConcurrency", "declaredRetryPolicy"];
  const missingBudget = budgetFields.filter((field) => budget[field] === undefined || budget[field] === null || budget[field] === "");
  checks.push(makeCheck({
    checkId: "14_resource_budget_declaration",
    category: "resource_budget_declaration",
    status: missingBudget.length === 0 ? "pass" : "manual_review_required",
    severity: missingBudget.length === 0 ? "info" : "warning",
    message: missingBudget.length === 0 ? "resource budget metadata is declared without runtime estimation" : "resource budget declaration needs manual review",
    evidence: missingBudget.length === 0 ? budgetFields : missingBudget,
    remediation: missingBudget.length === 0 ? "none" : "declare budget ceilings before manifest review",
    blocking: missingBudget.length > 0,
    manualReviewRequired: true,
  }));

  const checklist = buildBatchContractApprovalChecklist(request);
  const missingReviewRoles = checklist.filter((item) => item.status === "missing").map((item) => item.role);
  checks.push(makeCheck({
    checkId: "15_ownership_and_review",
    category: "ownership_and_review",
    status: missingReviewRoles.length === 0 ? "manual_review_required" : "fail",
    severity: missingReviewRoles.length === 0 ? "warning" : "error",
    message: missingReviewRoles.length === 0 ? "all review roles are declared; approval is still not granted" : "one or more required review roles are missing",
    evidence: missingReviewRoles.length === 0 ? checklist.map((item) => item.role) : missingReviewRoles,
    remediation: missingReviewRoles.length === 0 ? "manual reviewers must review outside this metadata-only status" : "declare missing review roles",
    blocking: missingReviewRoles.length > 0,
    manualReviewRequired: true,
  }));

  const rollback = request?.rollbackAndCancellationPlan || {};
  const rollbackFields = ["cancellationPolicy", "partialOutputPolicy", "retryPolicy", "duplicateRunPolicy", "idempotencyPolicy", "rollbackOwner", "incidentEscalationRole"];
  const missingRollback = rollbackFields.filter((field) => !rollback[field]);
  checks.push(makeCheck({
    checkId: "16_rollback_and_cancellation",
    category: "rollback_and_cancellation",
    status: missingRollback.length === 0 ? "pass" : "fail",
    severity: missingRollback.length === 0 ? "info" : "error",
    message: missingRollback.length === 0 ? "rollback and cancellation metadata is declared without a job controller" : "rollback or cancellation declaration is incomplete",
    evidence: missingRollback.length === 0 ? rollbackFields : missingRollback,
    remediation: missingRollback.length === 0 ? "none" : "declare cancellation, retry, duplicate, idempotency, rollback, and escalation metadata",
    blocking: missingRollback.length > 0,
  }));

  const requestedActions = normalizeAiMlMetadataArray(request?.executionIntent?.requestedActions);
  const prohibitedActions = requestedActions.filter((action) => PROHIBITED_EXECUTION_INTENTS.includes(action));
  checks.push(makeCheck({
    checkId: "17_prohibited_execution_intent",
    category: "prohibited_execution_intent",
    status: prohibitedActions.length === 0 ? "pass" : AI_ML_CONTRACT_STATUS.BLOCKED,
    severity: prohibitedActions.length === 0 ? "info" : "critical",
    message: prohibitedActions.length === 0 ? "execution intent is metadata-only review" : "prohibited execution intent is blocked",
    evidence: prohibitedActions.length === 0 ? ["review_batch_contract_metadata"] : prohibitedActions,
    remediation: prohibitedActions.length === 0 ? "none" : "remove execution, data, DB, provider, file, training, approval persistence, and order intents",
    blocking: prohibitedActions.length > 0,
  }));

  checks.push(makeCheck({
    checkId: "18_external_authority_context",
    category: "external_authority_context",
    status: readiness.orderAuthorityStatus === AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER && readiness.liveTradingStatus === AI_ML_CONTRACT_STATUS.BLOCKED ? "manual_review_required" : "fail",
    severity: readiness.orderAuthorityStatus === AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER && readiness.liveTradingStatus === AI_ML_CONTRACT_STATUS.BLOCKED ? "warning" : "critical",
    message: "external order authority remains separate from batch metadata review",
    evidence: [`orderAuthorityStatus:${readiness.orderAuthorityStatus || "missing"}`, `liveTradingStatus:${readiness.liveTradingStatus || "missing"}`],
    remediation: "do not infer order or live authority from batch review eligibility",
    blocking: false,
    manualReviewRequired: true,
  }));

  return sortAiMlMetadataByKey(checks, "checkId");
}

export function deriveBatchContractReviewOutcome(checks) {
  const upstreamInvalid = checks.some((check) => check.category === "upstream_readiness" && check.status === "fail");
  if (upstreamInvalid) return "invalid_upstream_contract";
  const safetyBlocked = checks.some((check) => check.status === AI_ML_CONTRACT_STATUS.BLOCKED);
  if (safetyBlocked) return "blocked_by_safety_policy";
  const needsRevision = checks.some((check) => check.status === "fail");
  if (needsRevision) return "contract_needs_revision";
  return "review_ready_execution_blocked";
}

export function evaluateAiMlBatchContractReview(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const request = sourceInput.request ? cloneAiMlMetadata(sourceInput.request) : createDeterministicMockBatchContractRequest(sourceInput.requestOverrides || {});
  const upstreamStatuses = collectBatchContractUpstreamStatuses(sourceInput, sourceOptions);
  const reviewChecks = buildBatchContractReviewChecks(request, upstreamStatuses);
  const approvalChecklist = buildBatchContractApprovalChecklist(request);
  const overallStatus = deriveBatchContractReviewOutcome(reviewChecks);
  const failedCount = reviewChecks.filter((check) => check.status === "fail").length;
  const blockedCount = reviewChecks.filter((check) => check.status === AI_ML_CONTRACT_STATUS.BLOCKED).length;
  const passCount = reviewChecks.filter((check) => check.status === "pass").length;
  const manualReviewRequiredCount = reviewChecks.filter((check) => check.status === "manual_review_required" || check.manualReviewRequired).length;
  const reviewEligibilityStatus = overallStatus === "review_ready_execution_blocked" ? "eligible_for_manual_review" : "not_eligible";

  return {
    reviewId: "step196_ai_ml_batch_contract_review",
    scope: "admin_ai_ml_strategy_lab",
    reviewStatus: "metadata_only_batch_contract_review",
    source: "deterministic_step195_readiness_and_step194_preflight_composition",
    reviewEligibilityStatus,
    approvalStatus: AI_ML_CONTRACT_STATUS.NOT_GRANTED,
    approvalScope: "dry_run_manifest_design_only",
    manualReviewRequired: true,
    executionAuthorizationStatus: AI_ML_CONTRACT_STATUS.DENIED,
    batchExecutionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    outputCreationStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    outputPathStatus: AI_ML_CONTRACT_STATUS.NOT_ASSIGNED,
    fileCreationAuthorization: AI_ML_CONTRACT_STATUS.DENIED,
    overallStatus,
    upstreamReadinessStatus: upstreamStatuses.readinessSummary?.overallStatus || "missing",
    upstreamCapabilityStage: upstreamStatuses.readinessSummary?.capabilityStage || "missing",
    upstreamMetadataPreflightStatus: upstreamStatuses.readinessSummary?.metadataPreflightStatus || "missing",
    externalAuthorityStatus: upstreamStatuses.readinessSummary?.orderAuthorityStatus || AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
    liveTradingStatus: upstreamStatuses.readinessSummary?.liveTradingStatus || AI_ML_CONTRACT_STATUS.BLOCKED,
    requestContractSummary: {
      batchContractId: request.requestIdentity?.batchContractId || "missing",
      batchContractVersion: request.requestIdentity?.batchContractVersion || "missing",
      batchPurpose: request.batchPurpose?.purposeType || "missing",
      datasetSpecId: request.datasetSpecReference?.datasetSpecId || "missing",
      datasetSpecVersion: request.datasetSpecReference?.datasetSpecVersion || "missing",
      featureSetId: request.featureSetReference?.featureSetId || "missing",
      featureSetVersion: request.featureSetReference?.featureSetVersion || "missing",
      labelSpecId: request.labelSpecReference?.labelSpecId || "missing",
      labelSpecVersion: request.labelSpecReference?.labelSpecVersion || "missing",
      splitPolicyId: request.splitPolicyReference?.splitPolicyId || "missing",
      normalizationPolicyId: request.normalizationPolicyReference?.normalizationPolicyId || "missing",
      qualityPolicyId: request.qualityPolicyReference?.qualityPolicyId || "missing",
      redacted: true,
    },
    targetUniverseSummary: {
      markets: sanitizeAiMlMetadataArray(request.targetUniverseDeclaration?.markets),
      assetClasses: sanitizeAiMlMetadataArray(request.targetUniverseDeclaration?.assetClasses),
      currencies: sanitizeAiMlMetadataArray(request.targetUniverseDeclaration?.currencies),
      universeMode: request.targetUniverseDeclaration?.universeMode || "missing",
      redacted: true,
    },
    partitionPlanSummary: {
      partitionKeys: sanitizeAiMlMetadataArray(request.partitionPlanDeclaration?.partitionKeys),
      declaredPartitionCount: request.partitionPlanDeclaration?.declaredPartitionCount || 0,
      declaredEstimatedRows: request.partitionPlanDeclaration?.declaredEstimatedRows || 0,
      uniqueKeyCount: request.partitionPlanDeclaration?.declaredUniqueKeys?.length || 0,
      redacted: true,
    },
    outputRestrictionSummary: {
      outputCreationStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
      outputPathStatus: AI_ML_CONTRACT_STATUS.NOT_ASSIGNED,
      fileCreationAuthorization: AI_ML_CONTRACT_STATUS.DENIED,
      proposedOutputFormat: request.outputPlanDeclaration?.proposedOutputFormat || "missing",
      redacted: true,
    },
    governanceSummary: {
      pii: request.retentionPolicyDeclaration?.piiPresenceDeclaration || "missing",
      credentials: request.retentionPolicyDeclaration?.credentialExclusionDeclaration || "missing",
      rawAccountData: request.retentionPolicyDeclaration?.rawAccountDataDeclaration || "missing",
      retentionStatus: request.retentionPolicyDeclaration?.retentionStatus || "missing",
      persistenceStatus: request.retentionPolicyDeclaration?.persistenceStatus || AI_ML_CONTRACT_STATUS.BLOCKED,
      redacted: true,
    },
    reviewCategories: [...REVIEW_CATEGORIES],
    reviewChecks,
    approvalChecklist,
    passCount,
    failCount: failedCount,
    blockedCount,
    manualReviewRequiredCount,
    failClosedPrecedence: [...FAIL_CLOSED_PRECEDENCE],
    scenarioCatalog: [...SCENARIO_CATALOG],
    nextSafeImplementationStep: "dry_run_manifest_contract_design",
    readyForActualDataDownload: false,
    readyForFeatureGeneration: false,
    readyForDatasetBuild: false,
    readyForBatchExecution: false,
    readyForModelTraining: false,
    readyForModelDeployment: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}

export function buildAiMlBatchContractReview(input = {}, options = {}) {
  return evaluateAiMlBatchContractReview(input, options);
}

export function buildAdminTradingAiMlBatchContractReviewStatus(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const review = sourceInput.review ? cloneAiMlMetadata(sourceInput.review) : buildAiMlBatchContractReview(sourceInput, sourceOptions);
  return {
    ok: true,
    step: "Step 196: Add AI/ML batch contract review",
    status: "admin_only_ai_ml_batch_contract_review_read_only",
    sourceStep: "step196",
    batchContractReviewModel: TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL,
    review,
    blockedConfirmation: {
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      featureFileCreated: false,
      datasetBuildAttempted: false,
      datasetFileCreated: false,
      batchExecutionAttempted: false,
      dryRunExecutionAttempted: false,
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
      orderSubmissionAttempted: false,
      liveTradingAttempted: false,
      approvalPersistenceAttempted: false,
      executionAuthorizationGranted: false,
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS },
    adminReadOnlyBatchContractReviewAllowed: true,
    deterministicMetadataChecklistAllowed: true,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
    batchExecutionAllowed: false,
    dryRunExecutionAllowed: false,
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
    manualApprovalPersistenceAllowed: false,
    executionAuthorizationAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
    readyForActualDataDownload: false,
    readyForFeatureGeneration: false,
    readyForDatasetBuild: false,
    readyForBatchExecution: false,
    readyForModelTraining: false,
    readyForModelDeployment: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}
