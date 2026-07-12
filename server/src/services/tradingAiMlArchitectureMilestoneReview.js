import {
  TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL,
} from "./tradingAiMlStrategyManagement.js";
import {
  TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL,
} from "./tradingAiMlDatasetArchitecture.js";
import {
  TRADING_AI_ML_FEATURE_PIPELINE_MODEL,
} from "./tradingAiMlFeaturePipelineArchitecture.js";
import {
  TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL,
} from "./tradingAiMlFeaturePipelinePreflight.js";
import {
  TRADING_AI_ML_READINESS_GATE_MODEL,
  buildAdminTradingAiMlReadinessGateStatus,
} from "./tradingAiMlReadinessGateSummary.js";
import {
  TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL,
  buildAdminTradingAiMlBatchContractReviewStatus,
} from "./tradingAiMlBatchContractReview.js";
import {
  TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL,
  buildAdminTradingAiMlDatasetBuildDryRunManifestStatus,
} from "./tradingAiMlDatasetBuildDryRunManifest.js";
import {
  TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL,
  buildAdminTradingAiMlManifestValidationReportStatus,
} from "./tradingAiMlManifestValidationReport.js";
import {
  STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS,
  TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL,
  buildAdminTradingAiMlManifestHandoffEligibilityStatus,
} from "./tradingAiMlManifestHandoffEligibility.js";
import {
  AI_ML_COMMON_FAIL_CLOSED_FLAGS,
  AI_ML_COMMON_READINESS_FALSE_FLAGS,
  AI_ML_CONTRACT_STATUS,
  AI_ML_STAGE_IDS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
  normalizeAiMlMetadataArray,
  sanitizeAiMlMetadataArray,
  sanitizeAiMlMetadataValue,
  sortAiMlMetadataByKey,
} from "./tradingAiMlContractPrimitives.js";

export const STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS = buildAiMlFailClosedFlags({
  inheritedFlags: STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS,
  allowedMetadataFlags: {
    adminReadOnlyMilestoneReviewAllowed: true,
    deterministicArchitectureInventoryAllowed: true,
    deterministicConsolidationPlanningAllowed: true,
    metadataOnlyRuntimePrerequisiteDeclarationAllowed: true,
  },
});

export const TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL = Object.freeze({
  milestoneId: "step200_ai_ml_architecture_milestone",
  milestoneScope: "step191_to_step199",
  stageInventory: "deterministic_step191_to_step199_stage_registry",
  dependencyReview: "metadata_only_dependency_review",
  safetyConsistencyReview: "fail_closed_safety_consistency_review",
  maintenanceFindings: "architecture_chain_maintenance_finding[]",
  consolidationPlan: "not_started_consolidation_recommendation[]",
  runtimePrerequisites: "actual_implementation_prerequisite[]",
  nextPhaseDecision: "consolidate_before_runtime",
  defaultStatus: {
    architectureChainStatus: "contract_chain_complete",
    safetyBoundaryStatus: "fail_closed_consistent",
    runtimeCapabilityStatus: AI_ML_CONTRACT_STATUS.NOT_IMPLEMENTED,
    actualDataCapabilityStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    executionReadinessStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    maintenanceReviewStatus: AI_ML_CONTRACT_STATUS.CONSOLIDATION_REQUIRED,
    nextPhaseDecision: AI_ML_CONTRACT_STATUS.CONSOLIDATE_BEFORE_RUNTIME,
    overallStatus: "architecture_milestone_complete_execution_blocked",
    redacted: true,
  },
  redacted: true,
});

const REQUIRED_STAGE_IDS = Object.freeze(Object.values(AI_ML_STAGE_IDS));

const STAGE_MODEL_REFERENCES = Object.freeze({
  [AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT]: TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL,
  [AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE]: TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL,
  [AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE]: TRADING_AI_ML_FEATURE_PIPELINE_MODEL,
  [AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT]: TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL,
  [AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY]: TRADING_AI_ML_READINESS_GATE_MODEL,
  [AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW]: TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL,
  [AI_ML_STAGE_IDS.STEP_197_DATASET_BUILD_MANIFEST]: TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL,
  [AI_ML_STAGE_IDS.STEP_198_MANIFEST_VALIDATION_REPORT]: TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL,
  [AI_ML_STAGE_IDS.STEP_199_MANIFEST_HANDOFF_ELIGIBILITY]: TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL,
});

const REQUIRED_FALSE_FLAG_KEYS = Object.freeze([
  ...Object.keys(AI_ML_COMMON_FAIL_CLOSED_FLAGS),
  ...Object.keys(AI_ML_COMMON_READINESS_FALSE_FLAGS),
]);

const STEP200_STATIC_COMPATIBILITY_MARKERS = Object.freeze({
  stageIds: [
    "step191_strategy_management",
    "step192_dataset_labeling_architecture",
    "step193_feature_pipeline_architecture",
    "step194_feature_pipeline_preflight",
    "step195_readiness_gate_summary",
    "step196_batch_contract_review",
    "step197_dataset_build_manifest",
    "step198_manifest_validation_report",
    "step199_manifest_handoff_eligibility",
  ],
  defaultStatus: {
    runtimeCapabilityStatus: "not_implemented",
    actualDataCapabilityStatus: "blocked",
    executionReadinessStatus: "blocked",
    maintenanceReviewStatus: "consolidation_required",
    nextPhaseDecision: "consolidate_before_runtime",
  },
  falseGuards: {
    architectureMutationAllowed: false,
    automaticRefactorAllowed: false,
    contractMigrationAllowed: false,
    handoffExecutionAllowed: false,
    targetPreflightExecutionAllowed: false,
    validationExecutionAllowed: false,
    manifestExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    datasetBuildAllowed: false,
    modelTrainingAllowed: false,
    providerCallsAllowed: false,
    kisCallsAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
  },
});

const SCENARIO_CATALOG = Object.freeze([
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
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_milestone_source",
  "blocked_by_safety_policy",
  "milestone_review_requires_revision",
  "architecture_milestone_complete_execution_blocked",
]);

function stageStepNumber(stageId) {
  const match = String(stageId).match(/^step(\d+)/);
  return match ? Number(match[1]) : 0;
}

function makeReview({ reviewId, category, status = "pass", severity = "info", message, evidence = [], remediation = "none", blockingBeforeRuntime = false }) {
  return Object.freeze({
    reviewId,
    category,
    status,
    severity,
    message: sanitizeAiMlMetadataValue(message, "review"),
    evidence: sanitizeAiMlMetadataArray(evidence),
    remediation: sanitizeAiMlMetadataValue(remediation, "none"),
    blockingBeforeRuntime,
    redacted: true,
  });
}

function makeFinding({ findingId, category, severity = "medium", affectedStepIds = [], summary, risk, recommendation, blockingBeforeRuntime = true }) {
  return Object.freeze({
    findingId,
    category,
    severity,
    affectedStepIds: sanitizeAiMlMetadataArray(affectedStepIds),
    summary: sanitizeAiMlMetadataValue(summary),
    risk: sanitizeAiMlMetadataValue(risk),
    recommendation: sanitizeAiMlMetadataValue(recommendation),
    blockingBeforeRuntime,
    redacted: true,
  });
}

export function collectAiMlMilestoneStageInventory(input = {}) {
  const base = [
    {
      stepId: "Step 191",
      stageId: AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT,
      stageName: "AI/ML strategy management console",
      stageType: "admin_metadata_registry",
      servicePath: "server/src/services/tradingAiMlStrategyManagement.js",
      panelKey: "ai-ml-strategy-management-console",
      primaryResponsibility: "strategy registry governance model",
      sourceOfTruth: "TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL",
      dependsOnStepIds: [],
      maintenanceClass: "foundation_registry",
    },
    {
      stepId: "Step 192",
      stageId: AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE,
      stageName: "AI/ML dataset and labeling architecture",
      stageType: "admin_metadata_architecture",
      servicePath: "server/src/services/tradingAiMlDatasetArchitecture.js",
      panelKey: "ai-ml-dataset-labeling-architecture",
      primaryResponsibility: "dataset label and leakage contract",
      sourceOfTruth: "TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT],
      maintenanceClass: "architecture_contract",
    },
    {
      stepId: "Step 193",
      stageId: AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
      stageName: "AI/ML feature pipeline architecture",
      stageType: "admin_metadata_architecture",
      servicePath: "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
      panelKey: "ai-ml-feature-pipeline-architecture",
      primaryResponsibility: "feature pipeline and quality contract",
      sourceOfTruth: "TRADING_AI_ML_FEATURE_PIPELINE_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE],
      maintenanceClass: "architecture_contract",
    },
    {
      stepId: "Step 194",
      stageId: AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT,
      stageName: "AI/ML feature pipeline preflight",
      stageType: "admin_metadata_preflight",
      servicePath: "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
      panelKey: "ai-ml-feature-pipeline-preflight",
      primaryResponsibility: "feature pipeline preflight readiness",
      sourceOfTruth: "TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE],
      maintenanceClass: "preflight_contract",
    },
    {
      stepId: "Step 195",
      stageId: AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY,
      stageName: "AI/ML readiness gate summary",
      stageType: "admin_metadata_summary",
      servicePath: "server/src/services/tradingAiMlReadinessGateSummary.js",
      panelKey: "ai-ml-readiness-gate-summary",
      primaryResponsibility: "readiness gate rollup",
      sourceOfTruth: "TRADING_AI_ML_READINESS_GATE_MODEL",
      dependsOnStepIds: [
        AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT,
        AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE,
        AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
        AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT,
      ],
      maintenanceClass: "gate_summary",
    },
    {
      stepId: "Step 196",
      stageId: AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW,
      stageName: "AI/ML batch contract review",
      stageType: "admin_metadata_contract_review",
      servicePath: "server/src/services/tradingAiMlBatchContractReview.js",
      panelKey: "ai-ml-batch-contract-review",
      primaryResponsibility: "batch contract review and manual checklist",
      sourceOfTruth: "TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY],
      maintenanceClass: "contract_review",
    },
    {
      stepId: "Step 197",
      stageId: AI_ML_STAGE_IDS.STEP_197_DATASET_BUILD_MANIFEST,
      stageName: "AI/ML dataset build dry-run manifest",
      stageType: "admin_metadata_manifest",
      servicePath: "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
      panelKey: "ai-ml-dataset-build-dry-run-manifest",
      primaryResponsibility: "dry-run manifest design without execution",
      sourceOfTruth: "TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW],
      maintenanceClass: "manifest_contract",
    },
    {
      stepId: "Step 198",
      stageId: AI_ML_STAGE_IDS.STEP_198_MANIFEST_VALIDATION_REPORT,
      stageName: "AI/ML manifest validation report",
      stageType: "admin_metadata_validation_report",
      servicePath: "server/src/services/tradingAiMlManifestValidationReport.js",
      panelKey: "ai-ml-manifest-validation-report",
      primaryResponsibility: "manifest validation exception registry",
      sourceOfTruth: "TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_197_DATASET_BUILD_MANIFEST],
      maintenanceClass: "validation_report",
    },
    {
      stepId: "Step 199",
      stageId: AI_ML_STAGE_IDS.STEP_199_MANIFEST_HANDOFF_ELIGIBILITY,
      stageName: "AI/ML manifest handoff eligibility",
      stageType: "admin_metadata_handoff_candidate",
      servicePath: "server/src/services/tradingAiMlManifestHandoffEligibility.js",
      panelKey: "ai-ml-manifest-handoff-eligibility",
      primaryResponsibility: "metadata-only handoff eligibility package",
      sourceOfTruth: "TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL",
      dependsOnStepIds: [AI_ML_STAGE_IDS.STEP_198_MANIFEST_VALIDATION_REPORT],
      maintenanceClass: "handoff_contract",
    },
  ].map((stage) => Object.freeze({
    ...stage,
    executionCapability: AI_ML_CONTRACT_STATUS.BLOCKED,
    persistenceCapability: AI_ML_CONTRACT_STATUS.BLOCKED,
    publicExposure: AI_ML_CONTRACT_STATUS.ADMIN_ONLY,
    modelReferencePresent: Boolean(STAGE_MODEL_REFERENCES[stage.stageId]),
    redacted: true,
  }));

  const stageOverrides = input.stageOverrides || {};
  const stageInventory = base
    .filter((stage) => !normalizeAiMlMetadataArray(input.omitStageIds).includes(stage.stageId))
    .map((stage) => Object.freeze({
      ...stage,
      ...(stageOverrides[stage.stageId] || {}),
      stageId: sanitizeAiMlMetadataValue((stageOverrides[stage.stageId] || {}).stageId || stage.stageId),
      servicePath: sanitizeAiMlMetadataValue((stageOverrides[stage.stageId] || {}).servicePath || stage.servicePath),
      sourceOfTruth: sanitizeAiMlMetadataValue((stageOverrides[stage.stageId] || {}).sourceOfTruth || stage.sourceOfTruth),
    }));

  const ordered = input.preserveInputOrder ? stageInventory : sortAiMlMetadataByKey(stageInventory, "stageId");
  return Object.freeze(ordered);
}

export function buildAiMlMilestoneDependencyReview(stageInventory = [], input = {}) {
  const stages = normalizeAiMlMetadataArray(stageInventory);
  const stageIds = stages.map((stage) => stage.stageId);
  const missingStageIds = REQUIRED_STAGE_IDS.filter((stageId) => !stageIds.includes(stageId));
  const stepNumbers = stages.map((stage) => stageStepNumber(stage.stageId));
  const continuous = missingStageIds.length === 0 && stepNumbers.every((step, index) => step === 191 + index);
  const forwardDependencies = stages.flatMap((stage) => normalizeAiMlMetadataArray(stage.dependsOnStepIds).filter((dependencyId) => stageStepNumber(dependencyId) >= stageStepNumber(stage.stageId)));
  const selfDependencies = stages.flatMap((stage) => normalizeAiMlMetadataArray(stage.dependsOnStepIds).filter((dependencyId) => dependencyId === stage.stageId));
  const panelKeys = stages.map((stage) => stage.panelKey);
  const uniquePanelKeyCount = new Set(panelKeys).size;
  const duplicatePanels = uniquePanelKeyCount !== panelKeys.length;

  return Object.freeze([
    makeReview({
      reviewId: "step200_dependency_01_required_stages_present",
      category: "stage_inventory",
      status: missingStageIds.length === 0 ? "pass" : "fail",
      severity: missingStageIds.length === 0 ? "info" : "critical",
      message: "all required stages present",
      evidence: missingStageIds.length === 0 ? REQUIRED_STAGE_IDS : missingStageIds,
      remediation: missingStageIds.length === 0 ? "none" : "restore missing stage metadata",
      blockingBeforeRuntime: missingStageIds.length > 0,
    }),
    makeReview({
      reviewId: "step200_dependency_02_step_order_continuous",
      category: "dependency_order",
      status: continuous ? "pass" : "fail",
      severity: continuous ? "info" : "high",
      message: "step order continuous",
      evidence: stageIds,
      remediation: continuous ? "none" : "restore deterministic Step 191 to Step 199 ordering",
      blockingBeforeRuntime: !continuous,
    }),
    makeReview({
      reviewId: "step200_dependency_03_no_forward_dependency",
      category: "dependency_direction",
      status: forwardDependencies.length === 0 ? "pass" : "fail",
      severity: forwardDependencies.length === 0 ? "info" : "high",
      message: "no forward dependency",
      evidence: forwardDependencies.length === 0 ? ["no_forward_dependency"] : forwardDependencies,
      remediation: forwardDependencies.length === 0 ? "none" : "move dependency to earlier source of truth",
      blockingBeforeRuntime: forwardDependencies.length > 0,
    }),
    makeReview({
      reviewId: "step200_dependency_04_no_circular_dependency",
      category: "dependency_direction",
      status: selfDependencies.length === 0 ? "pass" : "fail",
      severity: selfDependencies.length === 0 ? "info" : "high",
      message: "no circular dependency",
      evidence: selfDependencies.length === 0 ? ["no_circular_dependency"] : selfDependencies,
      remediation: selfDependencies.length === 0 ? "none" : "remove self dependency",
      blockingBeforeRuntime: selfDependencies.length > 0,
    }),
    makeReview({
      reviewId: "step200_dependency_05_source_of_truth_direction_preserved",
      category: "source_of_truth",
      status: input.sourceOfTruthDirectionConflict ? "fail" : "pass",
      severity: input.sourceOfTruthDirectionConflict ? "high" : "info",
      message: "source-of-truth direction preserved",
      evidence: ["Step 195 to Step 199 read prior stage metadata only"],
      remediation: input.sourceOfTruthDirectionConflict ? "remove reverse source dependency" : "none",
      blockingBeforeRuntime: Boolean(input.sourceOfTruthDirectionConflict),
    }),
    makeReview({
      reviewId: "step200_dependency_06_later_stage_does_not_mutate_earlier_stage",
      category: "source_mutation",
      status: input.sourceMutationAttempted ? "fail" : "pass",
      severity: input.sourceMutationAttempted ? "critical" : "info",
      message: "later stage does not mutate earlier stage",
      evidence: ["metadata clone only"],
      remediation: input.sourceMutationAttempted ? "remove mutation path" : "none",
      blockingBeforeRuntime: Boolean(input.sourceMutationAttempted),
    }),
    makeReview({
      reviewId: "step200_dependency_07_later_stage_does_not_reimplement_earlier_validation",
      category: "validation_ownership",
      status: input.validationReimplementationDetected ? "fail" : "pass",
      severity: input.validationReimplementationDetected ? "high" : "info",
      message: "later stage does not reimplement earlier validation",
      evidence: ["status and model metadata only"],
      remediation: input.validationReimplementationDetected ? "move duplicated validation to source stage" : "none",
      blockingBeforeRuntime: Boolean(input.validationReimplementationDetected),
    }),
    makeReview({
      reviewId: "step200_dependency_08_admin_shell_includes_each_stage_once",
      category: "admin_shell_coverage",
      status: duplicatePanels ? "fail" : "pass",
      severity: duplicatePanels ? "high" : "info",
      message: "admin shell includes each stage exactly once",
      evidence: panelKeys,
      remediation: duplicatePanels ? "deduplicate admin panel registration" : "none",
      blockingBeforeRuntime: duplicatePanels,
    }),
  ]);
}

export function buildAiMlMilestoneSafetyReview(stageInventory = [], input = {}) {
  const flags = { ...STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS, ...(input.permissionOverrides || {}) };
  const openFalseFlags = REQUIRED_FALSE_FLAG_KEYS.filter((key) => flags[key] !== false);
  const publicExposureConflicts = normalizeAiMlMetadataArray(stageInventory).filter((stage) => ["public", "mypage", "my_page", "public_or_mypage"].includes(stage.publicExposure));
  const categoryMap = [
    ["step200_safety_01_data_access_permissions_false", "data_access", ["actualDataDownloadAllowed", "dbReadAllowed", "dbWriteAllowed", "providerCallsAllowed", "quoteCallsAllowed", "kisCallsAllowed", "kisTokenIssuanceAllowed"]],
    ["step200_safety_02_feature_dataset_execution_permissions_false", "feature_dataset_execution", ["featureGenerationAllowed", "datasetBuildAllowed", "batchExecutionAllowed", "dryRunExecutionAllowed", "schemaMaterializationAllowed", "partitionMaterializationAllowed", "outputPathAssignmentAllowed"]],
    ["step200_safety_03_training_deployment_permissions_false", "training_deployment", ["pythonFeatureJobAllowed", "modelTrainingAllowed", "modelDeploymentAllowed"]],
    ["step200_safety_04_provider_kis_permissions_false", "provider_kis", ["providerCallsAllowed", "quoteCallsAllowed", "kisCallsAllowed", "kisTokenIssuanceAllowed"]],
    ["step200_safety_05_order_live_permissions_false", "order_live_trading", ["orderSubmissionAllowed", "liveTradingAllowed"]],
    ["step200_safety_06_persistence_permissions_false", "persistence", ["reportPersistenceAllowed", "exceptionPersistenceAllowed", "remediationPersistenceAllowed", "approvalPersistenceAllowed", "persistentStorageAllowed"]],
    ["step200_safety_07_public_mypage_permissions_false", "ui_exposure", ["publicUiExposureAllowed", "myPageExposureAllowed"]],
    ["step200_safety_08_target_preflight_permissions_false", "target_preflight", ["targetPreflightAuthorizationAllowed", "targetPreflightExecutionAllowed"]],
    ["step200_safety_09_readiness_flags_false", "readiness_flags", ["readyForValidationExecution", "readyForManifestExecution", "readyForActualDataDownload", "readyForFeatureGeneration", "readyForDatasetBuild", "readyForBatchExecution", "readyForDryRunExecution", "readyForModelTraining", "readyForModelDeployment", "readyForReadOnlyProviderCalls", "readyForOrderSubmission", "readyForLiveGuardedTrading"]],
  ];

  const reviews = categoryMap.map(([reviewId, category, keys]) => {
    const conflicts = keys.filter((key) => flags[key] !== false);
    return makeReview({
      reviewId,
      category,
      status: conflicts.length === 0 ? "pass" : "fail",
      severity: conflicts.length === 0 ? "info" : "critical",
      message: `${category} false guard`,
      evidence: conflicts.length === 0 ? keys : conflicts,
      remediation: conflicts.length === 0 ? "none" : "restore false guard",
      blockingBeforeRuntime: conflicts.length > 0,
    });
  });

  return Object.freeze([
    ...reviews,
    makeReview({
      reviewId: "step200_safety_10_stage_public_exposure_blocked",
      category: "stage_public_exposure",
      status: publicExposureConflicts.length === 0 ? "pass" : "fail",
      severity: publicExposureConflicts.length === 0 ? "info" : "critical",
      message: "stage exposure remains admin_only",
      evidence: publicExposureConflicts.length === 0 ? [AI_ML_CONTRACT_STATUS.ADMIN_ONLY] : publicExposureConflicts.map((stage) => stage.stageId),
      remediation: publicExposureConflicts.length === 0 ? "none" : "remove public or My Page exposure",
      blockingBeforeRuntime: publicExposureConflicts.length > 0,
    }),
    makeReview({
      reviewId: "step200_safety_11_all_required_execution_flags_false",
      category: "required_false_flag_coverage",
      status: openFalseFlags.length === 0 ? "pass" : "fail",
      severity: openFalseFlags.length === 0 ? "info" : "critical",
      message: "all execution and readiness flags false",
      evidence: openFalseFlags.length === 0 ? REQUIRED_FALSE_FLAG_KEYS : openFalseFlags,
      remediation: openFalseFlags.length === 0 ? "none" : "restore fail-closed default",
      blockingBeforeRuntime: openFalseFlags.length > 0,
    }),
  ]);
}

export function buildAiMlMilestoneMaintenanceFindings() {
  return Object.freeze(sortAiMlMetadataByKey([
    makeFinding({
      findingId: "step200_finding_a_repeated_safety_flags",
      category: "repeated_safety_flags",
      severity: "medium",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "Step 191 to Step 199 repeat the same false safety flags.",
      risk: "maintenance drift can open inconsistent readiness language.",
      recommendation: "future shared safety flag primitive or immutable base contract review",
    }),
    makeFinding({
      findingId: "step200_finding_b_repeated_status_vocabulary",
      category: "repeated_status_vocabulary",
      severity: "medium",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "not_granted, denied, blocked, generated_in_memory, generated_not_persisted, and metadata_only_non_executable repeat across stages.",
      risk: "manual status vocabulary edits can diverge.",
      recommendation: "future common status enum or constants review",
    }),
    makeFinding({
      findingId: "step200_finding_c_repeated_redaction_logic",
      category: "repeated_redaction_logic",
      severity: "medium",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "sensitive metadata redaction pattern is distributed across services.",
      risk: "redaction behavior can become inconsistent across admin-only metadata layers.",
      recommendation: "future shared redaction utility candidate",
    }),
    makeFinding({
      findingId: "step200_finding_d_service_responsibility_growth",
      category: "service_responsibility_growth",
      severity: "high",
      affectedStepIds: ["step196_batch_contract_review", "step197_dataset_build_manifest", "step198_manifest_validation_report", "step199_manifest_handoff_eligibility"],
      summary: "Step 196 to Step 199 services combine model constants, builders, checks, admin projection, and scenarios.",
      risk: "review and extension cost increases before runtime implementation.",
      recommendation: "future split into model constants, deterministic builders, validation, admin projection, and fixtures",
    }),
    makeFinding({
      findingId: "step200_finding_e_checker_chain_growth",
      category: "checker_chain_growth",
      severity: "medium",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "each checker links the previous checker test and grows cumulative validation time.",
      risk: "full regression remains useful but can become expensive.",
      recommendation: "future milestone checker or grouped regression command design",
    }),
    makeFinding({
      findingId: "step200_finding_f_admin_ui_density",
      category: "admin_ui_density",
      severity: "medium",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "Step 191 to Step 199 detailed panels accumulate in the admin AI/ML area.",
      risk: "operators may miss current blockers among dense metadata panels.",
      recommendation: "future milestone summary with collapsed architecture stages and selected-stage expansion",
    }),
    makeFinding({
      findingId: "step200_finding_g_runtime_gap",
      category: "runtime_gap",
      severity: "high",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "actual data connector, point-in-time materialization, feature runtime, dataset builder, training pipeline, model evaluation, shadow inference, and paper trading integration are not implemented.",
      risk: "contract validation must not be confused with production runtime readiness.",
      recommendation: "keep consolidate_before_runtime as the next phase decision",
    }),
    makeFinding({
      findingId: "step200_finding_h_external_authority_gap",
      category: "external_authority_gap",
      severity: "high",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "order authority and live trading clearance remain external blockers.",
      risk: "internal metadata readiness cannot grant live trading authority.",
      recommendation: "complete authority, legal, and risk prerequisites before any runtime decision",
    }),
    makeFinding({
      findingId: "step200_finding_i_source_of_truth_depth",
      category: "source_of_truth_depth",
      severity: "low",
      affectedStepIds: REQUIRED_STAGE_IDS,
      summary: "later metadata stages depend on a deep source-of-truth chain.",
      risk: "debugging requires following several deterministic admin projections.",
      recommendation: "future source-of-truth index for AI/ML contract stages",
      blockingBeforeRuntime: false,
    }),
  ], "findingId"));
}

export function buildAiMlMilestoneConsolidationPlan() {
  return Object.freeze([
    {
      planItemId: "step200_plan_01_shared_contract_primitives",
      priority: 1,
      scope: "safety_flags_status_vocabulary_sorting_redaction_stage_identifiers",
      affectedStepIds: REQUIRED_STAGE_IDS,
      proposedChange: "design shared contract primitives",
      expectedBenefit: "reduce repeated fail-closed constants and vocabulary drift",
      risk: "shared primitive must preserve existing fail-closed behavior",
      prerequisites: ["contract inventory review"],
      executionStatus: "not_started",
      redacted: true,
    },
    {
      planItemId: "step200_plan_02_service_responsibility_split",
      priority: 2,
      scope: "step196_to_step199_service_boundaries",
      affectedStepIds: ["step196_batch_contract_review", "step197_dataset_build_manifest", "step198_manifest_validation_report", "step199_manifest_handoff_eligibility"],
      proposedChange: "split model constants, deterministic builders, classification, admin projection, and scenario fixtures",
      expectedBenefit: "lower maintenance risk before runtime work",
      risk: "refactor must not alter public admin status contracts",
      prerequisites: ["shared contract primitives design"],
      executionStatus: "not_started",
      redacted: true,
    },
    {
      planItemId: "step200_plan_03_admin_ui_consolidation",
      priority: 3,
      scope: "admin_ai_ml_panel_density",
      affectedStepIds: REQUIRED_STAGE_IDS,
      proposedChange: "design milestone summary, blocker summary, next safe step summary, collapsed stages, and expanded selected stage",
      expectedBenefit: "make current blockers easier to scan",
      risk: "must retain all existing panels until replacement is explicitly approved",
      prerequisites: ["admin UX consolidation proposal"],
      executionStatus: "not_started",
      redacted: true,
    },
    {
      planItemId: "step200_plan_04_checker_consolidation",
      priority: 4,
      scope: "step191_to_step200_regression_commands",
      affectedStepIds: REQUIRED_STAGE_IDS,
      proposedChange: "design milestone checker or grouped regression command",
      expectedBenefit: "keeps checker coverage while controlling cumulative runtime",
      risk: "coverage loss if grouped checks omit safety boundaries",
      prerequisites: ["checker coverage map"],
      executionStatus: "not_started",
      redacted: true,
    },
    {
      planItemId: "step200_plan_05_runtime_entry_criteria",
      priority: 5,
      scope: "actual_implementation_prerequisites",
      affectedStepIds: REQUIRED_STAGE_IDS,
      proposedChange: "define runtime entry criteria before provider or data implementation",
      expectedBenefit: "keeps contract milestone separate from executable runtime",
      risk: "external authority dependencies may remain blocked",
      prerequisites: ["runtime prerequisite registry review"],
      executionStatus: "not_started",
      redacted: true,
    },
  ]);
}

export function buildAiMlMilestoneRuntimePrerequisites() {
  const items = [
    ["data_source_legal_review", "legal", "review_required", "legalReviewer", "actual_data_access"],
    ["provider_terms_review", "legal", "review_required", "providerOwner", "provider_connection"],
    ["data_license_confirmation", "legal", "external_blocker", "dataOwner", "actual_data_access"],
    ["point_in_time_storage_design", "data_architecture", "design_required", "dataArchitect", "dataset_runtime"],
    ["data_quality_acceptance_criteria", "data_quality", "review_required", "dataQualityReviewer", "dataset_runtime"],
    ["feature_formula_review", "feature_engineering", "review_required", "featureOwner", "feature_runtime"],
    ["dataset_reproducibility_plan", "data_architecture", "design_required", "dataArchitect", "dataset_runtime"],
    ["training_environment_selection", "model_engineering", "design_required", "modelOwner", "training_runtime"],
    ["model_risk_policy", "risk", "review_required", "modelRiskReviewer", "model_runtime"],
    ["walk_forward_evaluation_plan", "model_evaluation", "design_required", "modelOwner", "model_runtime"],
    ["shadow_inference_plan", "model_runtime", "design_required", "operationsReviewer", "shadow_runtime"],
    ["paper_trading_boundary", "trading_safety", "review_required", "operationsReviewer", "paper_trading"],
    ["kill_switch_design", "trading_safety", "design_required", "riskOwner", "paper_trading"],
    ["loss_limit_policy", "risk", "review_required", "riskOwner", "paper_trading"],
    ["manual_approval_authority", "operations", "review_required", "finalManualApprover", "runtime_authorization"],
    ["order_authority_external_clearance", "external_authority", "external_blocker", "externalAuthorityOwner", "live_trading"],
    ["privacy_security_review", "security", "review_required", "securityPrivacyReviewer", "actual_data_access"],
    ["cost_budget_approval", "operations", "review_required", "budgetOwner", "runtime_operations"],
  ];

  return Object.freeze(items.map(([prerequisiteId, category, status, ownerRole, requiredBeforePhase]) => Object.freeze({
    prerequisiteId,
    category,
    status,
    ownerRole,
    requiredBeforePhase,
    blocking: true,
    evidenceRequired: "documented_manual_review_required",
    notes: "not approved or completed in Step 200",
    redacted: true,
  })));
}

export function deriveAiMlMilestoneOutcome({ dependencyReview = [], safetyReview = [], runtimeCapabilityStatus = "not_implemented" } = {}) {
  const hasInvalidSource = normalizeAiMlMetadataArray(dependencyReview).some((review) => review.reviewId === "step200_dependency_01_required_stages_present" && review.status !== "pass");
  const hasSafetyConflict = normalizeAiMlMetadataArray(safetyReview).some((review) => review.status === "fail");
  const hasDependencyRevision = normalizeAiMlMetadataArray(dependencyReview).some((review) => review.status === "fail");
  if (hasInvalidSource) return "invalid_milestone_source";
  if (hasSafetyConflict) return "blocked_by_safety_policy";
  if (hasDependencyRevision || runtimeCapabilityStatus === "implemented") return "milestone_review_requires_revision";
  return "architecture_milestone_complete_execution_blocked";
}

export function buildAiMlArchitectureMilestoneReview(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input);
  const stageInventory = collectAiMlMilestoneStageInventory(sourceInput);
  const dependencyReview = buildAiMlMilestoneDependencyReview(stageInventory, sourceInput);
  const safetyReview = buildAiMlMilestoneSafetyReview(stageInventory, sourceInput);
  const maintenanceFindings = buildAiMlMilestoneMaintenanceFindings();
  const consolidationPlan = buildAiMlMilestoneConsolidationPlan();
  const runtimePrerequisites = buildAiMlMilestoneRuntimePrerequisites();
  const requestedRuntimeCapabilityStatus = sanitizeAiMlMetadataValue(sourceInput.runtimeCapabilityStatus || AI_ML_CONTRACT_STATUS.NOT_IMPLEMENTED);
  const runtimeCapabilityStatus = AI_ML_CONTRACT_STATUS.NOT_IMPLEMENTED;
  const actualDataCapabilityStatus = AI_ML_CONTRACT_STATUS.BLOCKED;
  const executionReadinessStatus = AI_ML_CONTRACT_STATUS.BLOCKED;
  const overallStatus = deriveAiMlMilestoneOutcome({ dependencyReview, safetyReview, runtimeCapabilityStatus: requestedRuntimeCapabilityStatus });
  const highRiskFindingCount = maintenanceFindings.filter((finding) => ["high", "critical"].includes(finding.severity)).length;
  const blockingPrerequisiteCount = runtimePrerequisites.filter((item) => item.blocking).length;
  const externalBlockerCount = runtimePrerequisites.filter((item) => item.status === "external_blocker").length;

  const aiMlReadinessGateSummaryStatus = sourceInput.aiMlReadinessGateSummaryStatus || buildAdminTradingAiMlReadinessGateStatus(sourceInput, options);
  const aiMlBatchContractReviewStatus = sourceInput.aiMlBatchContractReviewStatus || buildAdminTradingAiMlBatchContractReviewStatus({ ...sourceInput, aiMlReadinessGateSummaryStatus }, options);
  const aiMlDatasetBuildDryRunManifestStatus = sourceInput.aiMlDatasetBuildDryRunManifestStatus || buildAdminTradingAiMlDatasetBuildDryRunManifestStatus({ ...sourceInput, aiMlReadinessGateSummaryStatus, aiMlBatchContractReviewStatus }, options);
  const aiMlManifestValidationReportStatus = sourceInput.aiMlManifestValidationReportStatus || buildAdminTradingAiMlManifestValidationReportStatus({ ...sourceInput, aiMlDatasetBuildDryRunManifestStatus }, options);
  const aiMlManifestHandoffEligibilityStatus = sourceInput.aiMlManifestHandoffEligibilityStatus || buildAdminTradingAiMlManifestHandoffEligibilityStatus({ ...sourceInput, aiMlManifestValidationReportStatus }, options);

  return Object.freeze({
    milestoneId: "step200_ai_ml_architecture_milestone",
    milestoneScope: "step191_to_step199",
    architectureChainStatus: dependencyReview.every((review) => review.status === "pass") ? "contract_chain_complete" : "requires_revision",
    safetyBoundaryStatus: safetyReview.every((review) => review.status === "pass") ? "fail_closed_consistent" : "inconsistent",
    runtimeCapabilityStatus,
    actualDataCapabilityStatus,
    executionReadinessStatus,
    maintenanceReviewStatus: AI_ML_CONTRACT_STATUS.CONSOLIDATION_REQUIRED,
    nextPhaseDecision: AI_ML_CONTRACT_STATUS.CONSOLIDATE_BEFORE_RUNTIME,
    overallStatus,
    stageCoverage: `${stageInventory.length} / ${REQUIRED_STAGE_IDS.length}`,
    stageCount: stageInventory.length,
    requiredStageCount: REQUIRED_STAGE_IDS.length,
    dependencyReviewStatus: dependencyReview.every((review) => review.status === "pass") ? "pass" : "requires_revision",
    safetyReviewStatus: safetyReview.every((review) => review.status === "pass") ? "pass" : "blocked",
    highRiskFindingCount,
    consolidationPlanCount: consolidationPlan.length,
    runtimePrerequisiteCount: runtimePrerequisites.length,
    blockingPrerequisiteCount,
    externalBlockerCount,
    nextRecommendedImplementation: "shared_contract_primitives_design",
    stageInventory,
    dependencyReview,
    safetyReview,
    maintenanceFindings,
    consolidationPlan,
    runtimePrerequisites,
    scenarioCatalog: SCENARIO_CATALOG,
    sourceStatuses: {
      aiMlReadinessGateSummaryStatus: aiMlReadinessGateSummaryStatus?.summary?.overallStatus || aiMlReadinessGateSummaryStatus?.status || "metadata_available",
      aiMlBatchContractReviewStatus: aiMlBatchContractReviewStatus?.review?.overallStatus || aiMlBatchContractReviewStatus?.status || "metadata_available",
      aiMlDatasetBuildDryRunManifestStatus: aiMlDatasetBuildDryRunManifestStatus?.manifest?.overallStatus || aiMlDatasetBuildDryRunManifestStatus?.status || "metadata_available",
      aiMlManifestValidationReportStatus: aiMlManifestValidationReportStatus?.report?.overallStatus || aiMlManifestValidationReportStatus?.status || "metadata_available",
      aiMlManifestHandoffEligibilityStatus: aiMlManifestHandoffEligibilityStatus?.handoff?.overallStatus || aiMlManifestHandoffEligibilityStatus?.status || "metadata_available",
      redacted: true,
    },
    falseFlagKeys: REQUIRED_FALSE_FLAG_KEYS,
    falseFlagSnapshot: Object.freeze(Object.fromEntries(REQUIRED_FALSE_FLAG_KEYS.map((key) => [key, STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS[key]]))),
    failClosedPrecedence: FAIL_CLOSED_PRECEDENCE,
    boundaryLanguage: [
      "architecture chain complete is not production architecture complete",
      "contracts validated is not runtime implemented",
      "handoff eligible is not handoff executed",
      "safety flags consistent is not actual data quality verified",
      "admin panels present is not operational workflow usable",
    ],
    warnings: [
      "architecture contract milestone only",
      "runtime is not implemented",
      "actual data access remains blocked",
      "feature and dataset execution remain blocked",
      "training and deployment remain blocked",
      "provider/KIS/order remain blocked",
      "consolidation required before runtime",
      "admin-only visibility",
    ],
    redacted: true,
  });
}

export function evaluateAiMlArchitectureMilestoneReview(input = {}, options = {}) {
  return buildAiMlArchitectureMilestoneReview(input, options);
}

export function buildAdminTradingAiMlArchitectureMilestoneStatus(input = {}, options = {}) {
  const review = evaluateAiMlArchitectureMilestoneReview(input, options);
  return Object.freeze({
    ok: review.overallStatus === "architecture_milestone_complete_execution_blocked",
    status: review.overallStatus,
    milestoneReview: review,
    blockedConfirmation: {
      architectureMutationAllowed: STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS.architectureMutationAllowed,
      automaticRefactorAllowed: STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS.automaticRefactorAllowed,
      contractMigrationAllowed: STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS.contractMigrationAllowed,
      runtimeImplemented: false,
      actualDataAccessEnabled: false,
      featureDatasetExecutionEnabled: false,
      trainingDeploymentEnabled: false,
      providerKisOrderEnabled: false,
      publicMyPageExposureEnabled: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      redacted: true,
    },
    flags: { ...STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS },
    model: TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL,
    redacted: true,
  });
}
