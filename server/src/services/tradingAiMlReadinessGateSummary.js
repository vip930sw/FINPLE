import {
  STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS,
  buildAdminTradingAiMlStrategyManagementStatus,
} from "./tradingAiMlStrategyManagement.js";
import {
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  buildAdminTradingAiMlDatasetArchitectureStatus,
} from "./tradingAiMlDatasetArchitecture.js";
import {
  STEP193_AI_ML_FEATURE_PIPELINE_FLAGS,
  buildAdminTradingAiMlFeaturePipelineStatus,
} from "./tradingAiMlFeaturePipelineArchitecture.js";
import {
  STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS,
  buildAdminTradingAiMlFeaturePipelinePreflightStatus,
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

export const STEP195_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({
  metadataOnlyPreflightEvaluationAllowed: true,
  adminReadOnlyReadinessAggregationAllowed: true,
  deterministicStatusCompositionAllowed: true,
});

export const STEP195_ADDITIONAL_FALSE_FLAGS = Object.freeze({
  featureFileCreationAllowed: false,
  datasetFileCreationAllowed: false,
  modelArtifactCreationAllowed: false,
  modelAutoApprovalAllowed: false,
});

export const STEP195_AI_ML_READINESS_GATE_FLAGS = buildAiMlFailClosedFlags({
  inheritedFlags: STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS,
  allowedMetadataFlags: STEP195_METADATA_ONLY_ALLOWED_FLAGS,
  additionalFalseFlags: STEP195_ADDITIONAL_FALSE_FLAGS,
});

export const TRADING_AI_ML_READINESS_GATE_MODEL = Object.freeze({
  summaryId: "string",
  scope: "admin_ai_ml_strategy_lab",
  status: "admin_only_readiness_gate_summary",
  source: "deterministic_step191_to_step194_status_composition",
  redacted: true,
  sourceRegistry: "ai_ml_readiness_source_status[]",
  gateResults: "ai_ml_readiness_gate_result[]",
  capabilityStage: "contract_preflight_only",
  internalContractStatus: "documented_and_validated | incomplete | invalid",
  metadataPreflightStatus: "valid | invalid",
  executionPermissionStatus: "blocked",
  orderAuthorityStatus: "external_blocker",
  liveTradingStatus: "blocked",
  overallStatus: "invalid_internal_contract | blocked_by_safety_policy | internal_contracts_incomplete | internal_contracts_valid_execution_blocked",
  nextImplementationStep: "admin_only_ai_ml_batch_contract_review",
  sourceStageReferences: Object.freeze({
    step191: AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT,
    step192: AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE,
    step193: AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE,
    step194: AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT,
    step195: AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY,
  }),
  defaultStatus: Object.freeze({
    executionPermissionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    orderAuthorityStatus: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
    liveTradingStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    redacted: true,
  }),
});

const REQUIRED_SOURCE_STEPS = Object.freeze([
  "step191_ai_ml_strategy_management",
  "step192_ai_ml_dataset_architecture",
  "step193_ai_ml_feature_pipeline_architecture",
  "step194_ai_ml_feature_pipeline_preflight",
]);

const GATE_CATEGORIES = Object.freeze([
  "strategy_management_contract",
  "dataset_labeling_contract",
  "feature_pipeline_contract",
  "feature_pipeline_preflight",
  "data_access_permission",
  "feature_generation_permission",
  "dataset_build_permission",
  "model_training_permission",
  "model_deployment_permission",
  "provider_connectivity_permission",
  "order_authority",
  "live_trading_permission",
  "public_exposure_permission",
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_internal_contract",
  "blocked_by_safety_policy",
  "internal_contracts_incomplete",
  "internal_contracts_valid_execution_blocked",
]);

const FORBIDDEN_PERMISSION_KEYS = Object.freeze([
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "pythonFeatureJobAllowed",
  "modelTrainingAllowed",
  "modelArtifactCreationAllowed",
  "modelDeploymentAllowed",
  "modelAutoApprovalAllowed",
  "dbMigrationAllowed",
  "dbReadAllowed",
  "dbWriteAllowed",
  "persistentStorageAllowed",
  "providerCallsAllowed",
  "quoteCallsAllowed",
  "kisCallsAllowed",
  "kisTokenIssuanceAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "publicUiAllowed",
  "dbWriteAllowed",
]);

const READY_FLAG_KEYS = Object.freeze([
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
]);

const SOURCE_DEFINITIONS = Object.freeze([
  {
    sourceStepId: "step191_ai_ml_strategy_management",
    sourceName: "Step 191 AI/ML Strategy Management Console",
    sourceContractType: "strategy_management_contract",
    sourceVersion: "step191_strategy_management_contract_v1",
    buildStatus(input, options) {
      return input.aiMlStrategyManagementStatus || buildAdminTradingAiMlStrategyManagementStatus(input, options);
    },
    getContract(status) {
      return status?.registry;
    },
    getValidationStatus(status) {
      return status?.registry?.validation?.validationStatus;
    },
    validStatuses: ["design_ready", "design_ready_with_warning"],
    evidence(status) {
      return [
        status?.registry?.registryId || "missing_registry",
        status?.registry?.validation?.validationStatus || "missing_validation",
        status?.status || "missing_status",
      ];
    },
  },
  {
    sourceStepId: "step192_ai_ml_dataset_architecture",
    sourceName: "Step 192 AI/ML Dataset and Labeling Architecture",
    sourceContractType: "dataset_labeling_contract",
    sourceVersion: "step192_dataset_labeling_contract_v1",
    buildStatus(input, options, statuses) {
      return input.aiMlDatasetArchitectureStatus || buildAdminTradingAiMlDatasetArchitectureStatus(
        { ...input, strategyRegistry: statuses.step191_ai_ml_strategy_management?.registry },
        options,
      );
    },
    getContract(status) {
      return status?.datasetArchitecture;
    },
    getValidationStatus(status) {
      return status?.datasetArchitecture?.validation?.validationStatus;
    },
    validStatuses: ["design_ready"],
    evidence(status) {
      return [
        status?.datasetArchitecture?.datasetArchitectureId || "missing_dataset_architecture",
        status?.datasetArchitecture?.validation?.validationStatus || "missing_validation",
        status?.status || "missing_status",
      ];
    },
  },
  {
    sourceStepId: "step193_ai_ml_feature_pipeline_architecture",
    sourceName: "Step 193 AI/ML Feature Pipeline Architecture",
    sourceContractType: "feature_pipeline_contract",
    sourceVersion: "step193_feature_pipeline_contract_v1",
    buildStatus(input, options, statuses) {
      return input.aiMlFeaturePipelineStatus || buildAdminTradingAiMlFeaturePipelineStatus(
        { ...input, datasetArchitecture: statuses.step192_ai_ml_dataset_architecture?.datasetArchitecture },
        options,
      );
    },
    getContract(status) {
      return status?.featurePipelineArchitecture;
    },
    getValidationStatus(status) {
      return status?.featurePipelineArchitecture?.validation?.validationStatus;
    },
    validStatuses: ["design_ready"],
    evidence(status) {
      return [
        status?.featurePipelineArchitecture?.featurePipelineArchitectureId || "missing_feature_pipeline",
        status?.featurePipelineArchitecture?.validation?.validationStatus || "missing_validation",
        status?.status || "missing_status",
      ];
    },
  },
  {
    sourceStepId: "step194_ai_ml_feature_pipeline_preflight",
    sourceName: "Step 194 AI/ML Feature Pipeline Preflight",
    sourceContractType: "feature_pipeline_preflight",
    sourceVersion: "step194_feature_pipeline_preflight_contract_v1",
    buildStatus(input, options, statuses) {
      return input.aiMlFeaturePipelinePreflightStatus || buildAdminTradingAiMlFeaturePipelinePreflightStatus(
        { ...input, featurePipelineArchitecture: statuses.step193_ai_ml_feature_pipeline_architecture?.featurePipelineArchitecture },
        options,
      );
    },
    getContract(status) {
      return status?.preflight;
    },
    getValidationStatus(status) {
      return status?.preflight?.contractStatus;
    },
    validStatuses: ["valid"],
    evidence(status) {
      return [
        status?.preflight?.preflightId || "missing_preflight",
        status?.preflight?.contractStatus || "missing_contract_status",
        status?.preflight?.executionStatus || "missing_execution_status",
        status?.preflight?.overallStatus || "missing_overall_status",
      ];
    },
  },
]);

function countByStatus(items) {
  return ["pass", "fail", AI_ML_CONTRACT_STATUS.BLOCKED, AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER, "not_applicable", "not_evaluated"].reduce((counts, status) => ({
    ...counts,
    [status]: items.filter((item) => item.status === status).length,
  }), {});
}

function hasForbiddenTrue(status) {
  const flags = status?.flags || {};
  return FORBIDDEN_PERMISSION_KEYS.some((key) => status?.[key] === true || flags?.[key] === true)
    || READY_FLAG_KEYS.some((key) => status?.[key] === true || flags?.[key] === true);
}

function hasPublicExposure(status) {
  const flags = status?.flags || {};
  return status?.publicUiAllowed === true
    || status?.publicUiExposureAllowed === true
    || status?.myPageExposureAllowed === true
    || flags.publicUiAllowed === true
    || flags.publicUiExposureAllowed === true
    || flags.myPageExposureAllowed === true;
}

function makeGate({ gateId, category, status, severity = "info", sourceStepIds = [], message, evidence = [], remediation = "none", blocking = false }) {
  return Object.freeze({
    gateId,
    category,
    status,
    severity,
    sourceStepIds: sanitizeAiMlMetadataArray(sourceStepIds),
    message: sanitizeAiMlMetadataValue(message, "readiness gate"),
    evidence: sanitizeAiMlMetadataArray(evidence),
    remediation: sanitizeAiMlMetadataValue(remediation, "none"),
    blocking,
    redacted: true,
  });
}

function applySourceOverrides(source, overrides = {}) {
  const cleanSource = cloneAiMlMetadata(source) || {};
  const cleanOverrides = cloneAiMlMetadata(overrides) || {};
  const sourceOverride = cleanOverrides[cleanSource.sourceStepId] || {};
  const merged = { ...cleanSource, ...sourceOverride };
  return {
    ...merged,
    evidence: sanitizeAiMlMetadataArray(merged.evidence),
  };
}

export function collectAiMlReadinessSourceStatuses(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const omitSourceStepIds = new Set(normalizeAiMlMetadataArray(sourceInput.omitSourceStepIds));
  const sourceStatusOverrides = cloneAiMlMetadata(sourceInput.sourceStatusOverrides) || {};
  const rawStatuses = {};
  const sources = [];

  for (const definition of SOURCE_DEFINITIONS) {
    if (omitSourceStepIds.has(definition.sourceStepId)) {
      sources.push(applySourceOverrides({
        sourceStepId: definition.sourceStepId,
        sourceName: definition.sourceName,
        sourceContractType: definition.sourceContractType,
        sourceStatus: "missing",
        sourceVersion: definition.sourceVersion,
        adminOnly: true,
        executionAllowed: false,
        critical: true,
        contractPresent: false,
        contractValid: false,
        evidence: ["source_contract_missing"],
        redacted: true,
      }, sourceStatusOverrides));
      continue;
    }

    const status = cloneAiMlMetadata(definition.buildStatus(sourceInput, sourceOptions, rawStatuses));
    rawStatuses[definition.sourceStepId] = status;
    const contract = definition.getContract(status);
    const validationStatus = definition.getValidationStatus(status);
    const contractPresent = Boolean(status?.ok && contract);
    const contractValid = contractPresent && definition.validStatuses.includes(validationStatus);
    const executionAllowed = hasForbiddenTrue(status);
    const sourceStatus = !contractPresent ? "incomplete" : contractValid ? "valid" : "invalid";

    sources.push(applySourceOverrides({
      sourceStepId: definition.sourceStepId,
      sourceName: definition.sourceName,
      sourceContractType: definition.sourceContractType,
      sourceStatus,
      sourceVersion: definition.sourceVersion,
      adminOnly: true,
      executionAllowed,
      critical: true,
      contractPresent,
      contractValid,
      evidence: sanitizeAiMlMetadataArray(definition.evidence(status)),
      publicExposureConflict: hasPublicExposure(status),
      redacted: true,
    }, sourceStatusOverrides));
  }

  const sourceStatuses = sortAiMlMetadataByKey(sources, "sourceStepId");
  const missingSourceStepIds = REQUIRED_SOURCE_STEPS.filter((sourceStepId) => {
    const source = sourceStatuses.find((item) => item.sourceStepId === sourceStepId);
    return !source || source.sourceStatus === "missing" || source.contractPresent === false;
  });

  return {
    sourceStatuses,
    requiredSourceStepIds: [...REQUIRED_SOURCE_STEPS],
    sourceCount: sourceStatuses.length,
    requiredSourceCount: REQUIRED_SOURCE_STEPS.length,
    missingSourceStepIds: sanitizeAiMlMetadataArray(missingSourceStepIds),
    rawStatuses,
    redacted: true,
  };
}

export function buildAiMlReadinessGateResults(sourceRegistry) {
  const sources = sourceRegistry.sourceStatuses || [];
  const sourceById = new Map(sources.map((source) => [source.sourceStepId, source]));
  const step191 = sourceById.get("step191_ai_ml_strategy_management");
  const step192 = sourceById.get("step192_ai_ml_dataset_architecture");
  const step193 = sourceById.get("step193_ai_ml_feature_pipeline_architecture");
  const step194 = sourceById.get("step194_ai_ml_feature_pipeline_preflight");
  const permissionConflictSources = sources.filter((source) => source.executionAllowed === true).map((source) => source.sourceStepId);
  const publicExposureConflictSources = sources.filter((source) => source.publicExposureConflict === true).map((source) => source.sourceStepId);

  const contractGate = (gateId, category, source) => makeGate({
    gateId,
    category,
    status: source?.sourceStatus === "valid" ? "pass" : source?.sourceStatus === "missing" || source?.sourceStatus === "incomplete" ? "not_evaluated" : "fail",
    severity: source?.sourceStatus === "valid" ? "info" : source?.sourceStatus === "missing" || source?.sourceStatus === "incomplete" ? "warning" : "critical",
    sourceStepIds: source ? [source.sourceStepId] : [],
    message: source?.sourceStatus === "valid" ? "internal contract is documented and validated" : "internal source contract is missing or invalid",
    evidence: source?.evidence || ["missing_source"],
    remediation: source?.sourceStatus === "valid" ? "none" : "restore the source contract status before enabling later gates",
    blocking: source?.sourceStatus !== "valid",
  });

  const gateResults = [
    contractGate("01_strategy_management_contract", "strategy_management_contract", step191),
    contractGate("02_dataset_labeling_contract", "dataset_labeling_contract", step192),
    contractGate("03_feature_pipeline_contract", "feature_pipeline_contract", step193),
    contractGate("04_feature_pipeline_preflight", "feature_pipeline_preflight", step194),
    makeGate({
      gateId: "05_data_access_permission",
      category: "data_access_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      severity: permissionConflictSources.length > 0 ? "critical" : "info",
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "actual data download, DB read, and provider data access remain blocked",
      evidence: permissionConflictSources.length > 0 ? permissionConflictSources : ["actualDataDownloadAllowed=false", "dbReadAllowed=false"],
      remediation: permissionConflictSources.length > 0 ? "remove prohibited data access permission from source status" : "none",
      blocking: true,
    }),
    makeGate({
      gateId: "06_feature_generation_permission",
      category: "feature_generation_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      sourceStepIds: ["step193_ai_ml_feature_pipeline_architecture", "step194_ai_ml_feature_pipeline_preflight"],
      message: "feature generation and feature file creation are blocked",
      evidence: ["featureGenerationAllowed=false", "featureFileCreationAllowed=false"],
      blocking: true,
    }),
    makeGate({
      gateId: "07_dataset_build_permission",
      category: "dataset_build_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      sourceStepIds: ["step192_ai_ml_dataset_architecture", "step194_ai_ml_feature_pipeline_preflight"],
      message: "dataset build and dataset file creation are blocked",
      evidence: ["datasetBuildAllowed=false", "datasetFileCreationAllowed=false"],
      blocking: true,
    }),
    makeGate({
      gateId: "08_model_training_permission",
      category: "model_training_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "model training and training jobs are blocked",
      evidence: ["modelTrainingAllowed=false", "pythonFeatureJobAllowed=false"],
      blocking: true,
    }),
    makeGate({
      gateId: "09_model_deployment_permission",
      category: "model_deployment_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      sourceStepIds: ["step191_ai_ml_strategy_management"],
      message: "model deployment and artifact creation are blocked",
      evidence: ["modelDeploymentAllowed=false", "modelArtifactCreationAllowed=false"],
      blocking: true,
    }),
    makeGate({
      gateId: "10_provider_connectivity_permission",
      category: "provider_connectivity_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      severity: permissionConflictSources.length > 0 ? "critical" : "info",
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "provider, quote, KIS, and token issuance paths are blocked",
      evidence: permissionConflictSources.length > 0 ? permissionConflictSources : ["providerCallsAllowed=false", "kisCallsAllowed=false", "kisTokenIssuanceAllowed=false"],
      remediation: permissionConflictSources.length > 0 ? "remove provider or KIS permission conflicts" : "none",
      blocking: true,
    }),
    makeGate({
      gateId: "11_order_authority",
      category: "order_authority",
      status: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
      severity: "critical",
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "order authority is an external blocker and is not implied by internal contract validity",
      evidence: ["orderSubmissionAllowed=false", "orderAuthorityStatus=external_blocker"],
      remediation: "obtain separate explicit external order authority before any future live work",
      blocking: true,
    }),
    makeGate({
      gateId: "12_live_trading_permission",
      category: "live_trading_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      severity: "critical",
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "live trading remains blocked regardless of internal AI/ML contract validity",
      evidence: ["liveTradingAllowed=false", "readyForLiveGuardedTrading=false"],
      blocking: true,
    }),
    makeGate({
      gateId: "13_public_exposure_permission",
      category: "public_exposure_permission",
      status: AI_ML_CONTRACT_STATUS.BLOCKED,
      severity: publicExposureConflictSources.length > 0 ? "critical" : "info",
      sourceStepIds: REQUIRED_SOURCE_STEPS,
      message: "public and My Page AI/ML trading exposure are blocked",
      evidence: publicExposureConflictSources.length > 0 ? publicExposureConflictSources : ["publicUiExposureAllowed=false", "myPageExposureAllowed=false"],
      remediation: publicExposureConflictSources.length > 0 ? "remove public or My Page exposure conflict" : "none",
      blocking: true,
    }),
  ];

  return sortAiMlMetadataByKey(gateResults, "gateId");
}

export function deriveAiMlReadinessOverallStatus({ sourceRegistry, gateResults }) {
  const sources = sourceRegistry.sourceStatuses || [];
  const invalidContract = sources.some((source) => source.sourceStatus === "invalid")
    || gateResults.some((gate) => ["strategy_management_contract", "dataset_labeling_contract", "feature_pipeline_contract", "feature_pipeline_preflight"].includes(gate.category) && gate.status === "fail");
  if (invalidContract) return "invalid_internal_contract";
  const safetyConflict = sources.some((source) => source.executionAllowed === true || source.publicExposureConflict === true);
  if (safetyConflict) return "blocked_by_safety_policy";
  const incomplete = sources.some((source) => source.sourceStatus === "missing" || source.sourceStatus === "incomplete")
    || sourceRegistry.missingSourceStepIds.length > 0;
  if (incomplete) return "internal_contracts_incomplete";
  return "internal_contracts_valid_execution_blocked";
}

export function evaluateAiMlReadinessGates(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const sourceRegistry = collectAiMlReadinessSourceStatuses(sourceInput, sourceOptions);
  const gateResults = buildAiMlReadinessGateResults(sourceRegistry);
  const overallStatus = deriveAiMlReadinessOverallStatus({ sourceRegistry, gateResults });
  const statusCounts = countByStatus(gateResults);
  const contractSources = sourceRegistry.sourceStatuses.filter((source) => source.sourceContractType.endsWith("_contract") || source.sourceContractType === "feature_pipeline_preflight");
  const internalContractStatus = overallStatus === "invalid_internal_contract"
    ? "invalid"
    : overallStatus === "internal_contracts_incomplete"
      ? "incomplete"
      : "documented_and_validated";
  const metadataPreflightStatus = sourceRegistry.sourceStatuses.find((source) => source.sourceStepId === "step194_ai_ml_feature_pipeline_preflight")?.sourceStatus === "valid"
    ? "valid"
    : "invalid";
  const criticalBlockers = gateResults
    .filter((gate) => gate.blocking === true && ["critical", "error"].includes(gate.severity))
    .map((gate) => gate.gateId);

  return {
    summaryId: "step195_ai_ml_readiness_gate_summary",
    scope: "admin_ai_ml_strategy_lab",
    status: "admin_only_readiness_gate_summary",
    source: "deterministic_step191_to_step194_status_composition",
    capabilityStage: "contract_preflight_only",
    internalContractStatus,
    metadataPreflightStatus,
    executionPermissionStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    dataAccessStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    featureGenerationStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    datasetBuildStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    modelTrainingStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    modelDeploymentStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    providerConnectivityStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    externalAuthorityStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    orderAuthorityStatus: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER,
    liveTradingStatus: AI_ML_CONTRACT_STATUS.BLOCKED,
    overallStatus,
    failClosedPrecedence: [...FAIL_CLOSED_PRECEDENCE],
    sourceRegistry: {
      requiredSourceStepIds: sourceRegistry.requiredSourceStepIds,
      sourceCoverageStatus: sourceRegistry.missingSourceStepIds.length === 0 ? "complete" : "incomplete",
      sourceCount: sourceRegistry.sourceCount,
      requiredSourceCount: sourceRegistry.requiredSourceCount,
      missingSourceStepIds: sourceRegistry.missingSourceStepIds,
      sources: sourceRegistry.sourceStatuses,
      redacted: true,
    },
    gateCategories: [...GATE_CATEGORIES],
    gateResults,
    passCount: statusCounts.pass,
    failCount: statusCounts.fail,
    blockedCount: statusCounts.blocked,
    externalBlockerCount: statusCounts.external_blocker,
    notEvaluatedCount: statusCounts.not_evaluated,
    criticalBlockers,
    criticalBlockerCount: criticalBlockers.length,
    contractSourceCount: contractSources.length,
    nextSafeImplementationStep: "admin_only_ai_ml_batch_contract_review",
    scenarioCatalog: [
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
    ],
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

export function buildAiMlReadinessGateSummary(input = {}, options = {}) {
  return evaluateAiMlReadinessGates(input, options);
}

export function buildAdminTradingAiMlReadinessGateStatus(input = {}, options = {}) {
  const sourceInput = cloneAiMlMetadata(input) || {};
  const sourceOptions = cloneAiMlMetadata(options) || {};
  const summary = sourceInput.summary ? cloneAiMlMetadata(sourceInput.summary) : buildAiMlReadinessGateSummary(sourceInput, sourceOptions);
  return {
    ok: true,
    step: "Step 195: Add AI/ML readiness gate summary",
    status: "admin_only_ai_ml_readiness_gate_summary_read_only",
    sourceStep: "step195",
    readinessGateModel: TRADING_AI_ML_READINESS_GATE_MODEL,
    summary,
    blockedConfirmation: {
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      featureFileCreated: false,
      datasetBuildAttempted: false,
      datasetFileCreated: false,
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
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP195_AI_ML_READINESS_GATE_FLAGS },
    sourceFlagReferences: {
      step191: { ...STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS },
      step192: { ...STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS },
      step193: { ...STEP193_AI_ML_FEATURE_PIPELINE_FLAGS },
      step194: { ...STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS },
      redacted: true,
    },
    metadataOnlyPreflightEvaluationAllowed: true,
    adminReadOnlyReadinessAggregationAllowed: true,
    deterministicStatusCompositionAllowed: true,
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
