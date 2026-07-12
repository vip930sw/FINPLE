import {
  STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS,
  buildAdminTradingAiMlDatasetBuildDryRunManifestStatus,
  buildAiMlDatasetBuildDryRunManifest,
} from "./tradingAiMlDatasetBuildDryRunManifest.js";

export const STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS = Object.freeze({
  ...STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS,
  adminReadOnlyManifestValidationReportAllowed: true,
  deterministicInMemoryReportAllowed: true,
  deterministicExceptionClassificationAllowed: true,
  metadataOnlyRemediationQueueAllowed: true,
  validationExecutionAllowed: false,
  manifestExecutionAllowed: false,
  actualDataDownloadAllowed: false,
  featureGenerationAllowed: false,
  featureFileCreationAllowed: false,
  datasetBuildAllowed: false,
  datasetFileCreationAllowed: false,
  batchExecutionAllowed: false,
  dryRunExecutionAllowed: false,
  manifestFileCreationAllowed: false,
  reportFileCreationAllowed: false,
  schemaMaterializationAllowed: false,
  partitionMaterializationAllowed: false,
  outputPathAssignmentAllowed: false,
  reportPersistenceAllowed: false,
  exceptionPersistenceAllowed: false,
  remediationPersistenceAllowed: false,
  reviewReceiptPersistenceAllowed: false,
  manualApprovalPersistenceAllowed: false,
  waiverGrantAllowed: false,
  waiverPersistenceAllowed: false,
  executionAuthorizationAllowed: false,
  handoffExecutionAllowed: false,
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
  modelArtifactCreationAllowed: false,
  modelDeploymentAllowed: false,
  modelAutoApprovalAllowed: false,
  orderSubmissionAllowed: false,
  liveTradingAllowed: false,
  publicUiExposureAllowed: false,
  myPageExposureAllowed: false,
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

export const TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL = Object.freeze({
  reportIdentity: "manifest_validation_metadata_report_identity",
  sourceManifestReference: "source_manifest_status_reference",
  validationSummary: "aggregated_step197_validation_summary",
  exceptionRegistry: "metadata_only_exception_registry[]",
  nonWaivableRegistry: "metadata_only_non_waivable_boundary[]",
  remediationQueue: "metadata_only_remediation_queue[]",
  boundaryConfirmation: "fail_closed_report_boundary_confirmation",
  externalAuthorityContext: "external_order_authority_context",
  reportStatus: "metadata_only_report_status",
  defaultStatus: {
    reportMode: "metadata_only_non_executable",
    reportGenerationStatus: "generated_in_memory",
    sourceManifestStatus: "manifest_design_ready_execution_blocked",
    exceptionRegistryStatus: "generated_not_persisted",
    remediationQueueStatus: "generated_not_persisted",
    approvalStatus: "not_granted",
    waiverStatus: "not_granted",
    executionAuthorizationStatus: "denied",
    handoffAuthorizationStatus: "denied",
    overallStatus: "validation_report_ready_execution_blocked",
    redacted: true,
  },
  redacted: true,
});

const OWNER_ROLE_BY_CATEGORY = Object.freeze({
  upstream_batch_contract_review: "ai_ml_architecture_owner",
  manifest_identity: "batch_contract_owner",
  contract_reference_pinning: "data_contract_owner",
  logical_input_inventory: "data_owner",
  temporal_boundary_plan: "model_risk_reviewer",
  logical_partition_plan: "data_engineering_reviewer",
  logical_schema_plan: "data_contract_owner",
  logical_output_restrictions: "security_operations_reviewer",
  quality_validation_plan: "data_quality_reviewer",
  lineage_plan: "governance_reviewer",
  governance_and_retention: "security_privacy_reviewer",
  resource_envelope: "operations_reviewer",
  review_receipt_boundary: "compliance_legal_reviewer",
  execution_boundary: "operations_reviewer",
  external_authority_context: "compliance_legal_reviewer",
  prohibited_execution_intent: "security_operations_reviewer",
});

const NON_WAIVABLE_CATEGORIES = Object.freeze([
  "upstream_batch_contract_review",
  "review_receipt_boundary",
  "execution_boundary",
  "logical_output_restrictions",
  "prohibited_execution_intent",
  "external_authority_context",
]);

const PROHIBITED_REPORT_INTENTS = Object.freeze([
  "execute_validation",
  "execute_manifest",
  "download_data",
  "query_provider",
  "query_kis",
  "read_database",
  "write_database",
  "create_report_file",
  "download_report",
  "persist_report",
  "persist_exception",
  "persist_remediation",
  "grant_waiver",
  "persist_waiver",
  "grant_approval",
  "persist_approval",
  "grant_execution_authority",
  "execute_handoff",
  "assign_output_path",
  "materialize_schema",
  "materialize_partition",
  "execute_dry_run",
  "build_dataset",
  "generate_features",
  "run_python",
  "train_model",
  "deploy_model",
  "submit_order",
  "enable_live_trading",
]);

const SCENARIO_CATALOG = Object.freeze([
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
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_source_manifest",
  "blocked_by_safety_policy",
  "manifest_exceptions_require_revision",
  "validation_report_ready_execution_blocked",
]);

function sortByKey(items, key) {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeEvidenceValue(value) {
  const text = String(value ?? "missing");
  if (/api\s*key|secret|credential|token|account\s*id|provider raw response|environment value|private filesystem path|bucket path|artifact path|dataset path|raw request payload|raw manifest payload|hash|digest|checksum|actual price data|account data|[A-Za-z]:\\|\\\\/i.test(text)) {
    return "redacted_evidence";
  }
  return text;
}

function sanitizeEvidence(evidence) {
  return safeArray(evidence).map(sanitizeEvidenceValue).sort();
}

function classifyException(check) {
  if (check.category === "external_authority_context") return "external_authority_context";
  if (check.status === "blocked" || check.severity === "critical") return "safety_boundary_exception";
  if (check.status === "fail") return "contract_revision_exception";
  if (check.status === "manual_review_required" || check.manualReviewRequired === true) return "manual_review_item";
  return "informational_exception";
}

function getOwnerRole(category) {
  return OWNER_ROLE_BY_CATEGORY[category] || "operations_reviewer";
}

function isNonWaivableException(exception) {
  return NON_WAIVABLE_CATEGORIES.includes(exception.category)
    || exception.sourceStatus === "blocked"
    || exception.severity === "critical"
    || exception.exceptionClass === "safety_boundary_exception";
}

function buildReportIdentity(sourceManifest) {
  const sourceManifestId = sourceManifest.manifestId || "missing_manifest";
  const sourceManifestVersion = sourceManifest.manifestVersion || "missing_version";
  return {
    reportId: `step198_manifest_validation_report_${sourceManifestId}_${sourceManifestVersion}`,
    reportVersion: "v1",
    reportType: "manifest_validation_metadata_report",
    reportMode: "metadata_only_non_executable",
    sourceManifestId,
    sourceManifestVersion,
    redacted: true,
  };
}

export function collectManifestValidationSource(input = {}, options = {}) {
  const sourceManifest = input.sourceManifest
    || input.manifest
    || input.aiMlManifestValidationSource?.manifest
    || input.aiMlDatasetBuildDryRunManifestStatus?.manifest
    || buildAiMlDatasetBuildDryRunManifest(input.sourceInput || input, options);
  return {
    manifest: sourceManifest,
    adminStatus: input.aiMlDatasetBuildDryRunManifestStatus
      || buildAdminTradingAiMlDatasetBuildDryRunManifestStatus({ ...input, manifest: sourceManifest }, options),
    sourceStep: "step197",
    redacted: true,
  };
}

export function buildManifestValidationSummary(sourceManifest) {
  const checks = safeArray(sourceManifest.validationChecks);
  const countBy = (predicate) => checks.filter(predicate).length;
  const summary = {
    totalCheckCount: checks.length,
    passCount: countBy((check) => check.status === "pass"),
    failCount: countBy((check) => check.status === "fail"),
    blockedCount: countBy((check) => check.status === "blocked"),
    manualReviewRequiredCount: countBy((check) => check.status === "manual_review_required" || check.manualReviewRequired === true),
    criticalCount: countBy((check) => check.severity === "critical"),
    errorCount: countBy((check) => check.severity === "error"),
    warningCount: countBy((check) => check.severity === "warning"),
    blockingCount: countBy((check) => check.blocking === true),
    sourceOverallStatus: sourceManifest.overallStatus || "missing",
    redacted: true,
  };
  const sourceCountsMatch = (sourceManifest.passCount === undefined || sourceManifest.passCount === summary.passCount)
    && (sourceManifest.failCount === undefined || sourceManifest.failCount === summary.failCount)
    && (sourceManifest.blockedCount === undefined || sourceManifest.blockedCount === summary.blockedCount)
    && (sourceManifest.manualReviewRequiredCount === undefined || sourceManifest.manualReviewRequiredCount === summary.manualReviewRequiredCount);
  return {
    ...summary,
    sourceCountsMatch,
    sourceIntegrityStatus: sourceCountsMatch ? "valid" : "count_mismatch",
    contractStatusSummary: {
      manifestDesignStatus: sourceManifest.manifestDesignStatus || "missing",
      reviewReceiptStatus: sourceManifest.reviewReceiptStatus || "missing",
      approvalStatus: sourceManifest.approvalStatus || "not_granted",
      redacted: true,
    },
    boundaryStatusSummary: {
      executionAuthorizationStatus: sourceManifest.executionAuthorizationStatus || "denied",
      dryRunExecutionStatus: sourceManifest.dryRunExecutionStatus || "blocked",
      redacted: true,
    },
    materializationStatusSummary: {
      materializationStatus: sourceManifest.materializationStatus || "blocked",
      outputCreationStatus: sourceManifest.outputCreationStatus || "blocked",
      outputPathStatus: sourceManifest.outputPathStatus || "not_assigned",
      redacted: true,
    },
    receiptBoundarySummary: {
      reviewDecision: sourceManifest.reviewDecision || "design_contract_record_only",
      reviewReceiptStatus: sourceManifest.reviewReceiptStatus || "generated_not_persisted",
      approvalStatus: sourceManifest.approvalStatus || "not_granted",
      redacted: true,
    },
    externalAuthoritySummary: {
      externalAuthorityStatus: sourceManifest.externalAuthorityStatus || "external_blocker",
      liveTradingStatus: sourceManifest.liveTradingStatus || "blocked",
      redacted: true,
    },
  };
}

export function buildManifestExceptionRegistry(sourceManifest, overrides = {}) {
  const exceptionOverrides = overrides.exceptionOverrides || {};
  const checks = safeArray(sourceManifest.validationChecks).filter((check) => (
    check.status === "fail"
    || check.status === "blocked"
    || check.status === "manual_review_required"
    || check.manualReviewRequired === true
  ));
  return sortByKey(checks.map((check) => {
    const exceptionClass = classifyException(check);
    const base = {
      exceptionId: `step198_exception_${check.checkId}`,
      sourceCheckId: check.checkId,
      category: check.category,
      exceptionClass,
      sourceStatus: check.status,
      severity: check.severity || "info",
      blocking: check.blocking === true,
      manualReviewRequired: check.manualReviewRequired === true || check.status === "manual_review_required",
      waiverEligibility: "review_only",
      waiverStatus: "not_granted",
      dispositionStatus: "open_metadata_only",
      message: sanitizeEvidenceValue(check.message || "metadata review item"),
      evidence: sanitizeEvidence(check.evidence),
      remediation: sanitizeEvidenceValue(check.remediation || "review metadata boundary"),
      ownerRole: getOwnerRole(check.category),
      redacted: true,
    };
    const withWaiver = {
      ...base,
      waiverEligibility: isNonWaivableException(base) ? "prohibited" : "review_only",
    };
    return {
      ...withWaiver,
      ...(exceptionOverrides[check.checkId] || {}),
      exceptionId: withWaiver.exceptionId,
      sourceCheckId: withWaiver.sourceCheckId,
      category: withWaiver.category,
      redacted: true,
    };
  }), "exceptionId");
}

export function buildManifestNonWaivableRegistry(exceptionRegistry) {
  return sortByKey(exceptionRegistry.filter(isNonWaivableException).map((exception) => ({
    exceptionId: exception.exceptionId,
    sourceCheckId: exception.sourceCheckId,
    nonWaivableReason: NON_WAIVABLE_CATEGORIES.includes(exception.category)
      ? `category:${exception.category}`
      : `boundary:${exception.exceptionClass}`,
    waiverEligibility: "prohibited",
    waiverStatus: "not_granted",
    doesNotGrantApproval: true,
    doesNotGrantExecution: true,
    redacted: true,
  })), "exceptionId");
}

export function buildManifestRemediationQueue(exceptionRegistry) {
  return sortByKey(exceptionRegistry.map((exception) => ({
    remediationItemId: `step198_remediation_${exception.sourceCheckId}`,
    sourceExceptionId: exception.exceptionId,
    priority: exception.exceptionClass === "safety_boundary_exception" ? "critical" : exception.severity,
    ownerRole: exception.ownerRole,
    actionType: exception.exceptionClass === "contract_revision_exception" ? "contract_revision_metadata" : "manual_review_metadata",
    remediation: exception.remediation,
    completionStatus: "not_started",
    persistenceStatus: "not_persisted",
    executionStatus: "not_executed",
    redacted: true,
  })), "remediationItemId");
}

function buildBoundaryConfirmation(sourceManifest) {
  return {
    sourceManifestMode: sourceManifest.manifestMode || "missing",
    approvalStatus: sourceManifest.approvalStatus || "not_granted",
    executionAuthorizationStatus: sourceManifest.executionAuthorizationStatus || "denied",
    dryRunExecutionStatus: sourceManifest.dryRunExecutionStatus || "blocked",
    materializationStatus: sourceManifest.materializationStatus || "blocked",
    outputPathStatus: sourceManifest.outputPathStatus || "not_assigned",
    reportPersistenceStatus: "blocked",
    exceptionPersistenceStatus: "blocked",
    remediationPersistenceStatus: "blocked",
    waiverGrantStatus: "blocked",
    handoffAuthorizationStatus: "denied",
    redacted: true,
  };
}

function detectReportSafetyConflict({ sourceManifest, validationSummary, exceptionRegistry, reportControls = {} }) {
  const intents = safeArray(reportControls.requestedIntents || reportControls.prohibitedIntents);
  const prohibitedIntents = intents.filter((intent) => PROHIBITED_REPORT_INTENTS.includes(intent));
  return {
    sourceSafetyBlocked: sourceManifest.overallStatus === "blocked_by_safety_policy",
    sourceCountMismatch: validationSummary.sourceCountsMatch === false,
    blockedValidationCheck: exceptionRegistry.some((exception) => exception.sourceStatus === "blocked"),
    approvalGrantedAttempt: reportControls.approvalStatus === "approved",
    executionAuthorityGrantedAttempt: reportControls.executionAuthorizationStatus === "granted",
    handoffGrantedAttempt: reportControls.handoffAuthorizationStatus === "granted",
    materializationEnabled: sourceManifest.materializationStatus !== "blocked" || sourceManifest.outputPathStatus !== "not_assigned",
    persistenceEnabled: reportControls.reportPersistenceAttempted === true
      || reportControls.exceptionPersistenceAttempted === true
      || reportControls.remediationPersistenceAttempted === true
      || reportControls.reportPersistenceAllowed === true
      || reportControls.exceptionPersistenceAllowed === true
      || reportControls.remediationPersistenceAllowed === true,
    waiverGrantedAttempt: reportControls.waiverStatus === "granted"
      || reportControls.waiverGrantAttempted === true
      || reportControls.waiverPersistenceAttempted === true
      || exceptionRegistry.some((exception) => exception.waiverStatus === "granted"),
    prohibitedIntents,
    redacted: true,
  };
}

export function deriveManifestValidationReportOutcome({
  sourceManifest,
  validationSummary,
  exceptionRegistry,
  safetyConflict,
}) {
  if (sourceManifest.overallStatus === "invalid_upstream_review") return "invalid_source_manifest";
  if (safetyConflict.sourceSafetyBlocked
    || safetyConflict.sourceCountMismatch
    || safetyConflict.blockedValidationCheck
    || safetyConflict.approvalGrantedAttempt
    || safetyConflict.executionAuthorityGrantedAttempt
    || safetyConflict.handoffGrantedAttempt
    || safetyConflict.materializationEnabled
    || safetyConflict.persistenceEnabled
    || safetyConflict.waiverGrantedAttempt
    || safetyConflict.prohibitedIntents.length > 0) {
    return "blocked_by_safety_policy";
  }
  if (sourceManifest.overallStatus === "manifest_needs_revision"
    || validationSummary.failCount > 0
    || exceptionRegistry.some((exception) => exception.sourceStatus === "fail")) {
    return "manifest_exceptions_require_revision";
  }
  return "validation_report_ready_execution_blocked";
}

export function buildAiMlManifestValidationReport(input = {}, options = {}) {
  return evaluateAiMlManifestValidationReport(input, options);
}

export function evaluateAiMlManifestValidationReport(input = {}, options = {}) {
  const source = collectManifestValidationSource(input, options);
  const sourceManifest = source.manifest;
  const reportIdentity = buildReportIdentity(sourceManifest);
  const validationSummary = buildManifestValidationSummary(sourceManifest);
  const exceptionRegistry = buildManifestExceptionRegistry(sourceManifest, input.registryOverrides || {});
  const nonWaivableRegistry = buildManifestNonWaivableRegistry(exceptionRegistry);
  const remediationQueue = buildManifestRemediationQueue(exceptionRegistry);
  const boundaryConfirmation = buildBoundaryConfirmation(sourceManifest);
  const reportControls = input.reportControls || {};
  const safetyConflict = detectReportSafetyConflict({
    sourceManifest,
    validationSummary,
    exceptionRegistry,
    reportControls,
  });
  const overallStatus = deriveManifestValidationReportOutcome({
    sourceManifest,
    validationSummary,
    exceptionRegistry,
    safetyConflict,
  });

  return {
    reportIdentity,
    sourceManifestReference: {
      sourceStep: "step197",
      manifestId: sourceManifest.manifestId || "missing_manifest",
      manifestVersion: sourceManifest.manifestVersion || "missing_version",
      manifestMode: sourceManifest.manifestMode || "missing",
      manifestDesignStatus: sourceManifest.manifestDesignStatus || "missing",
      reviewReceiptStatus: sourceManifest.reviewReceiptStatus || "missing",
      approvalStatus: sourceManifest.approvalStatus || "not_granted",
      executionAuthorizationStatus: sourceManifest.executionAuthorizationStatus || "denied",
      dryRunExecutionStatus: sourceManifest.dryRunExecutionStatus || "blocked",
      materializationStatus: sourceManifest.materializationStatus || "blocked",
      outputPathStatus: sourceManifest.outputPathStatus || "not_assigned",
      overallStatus: sourceManifest.overallStatus || "missing",
      validationCategoryCount: safeArray(sourceManifest.validationCategories).length,
      nextSafeImplementationStep: sourceManifest.nextSafeImplementationStep || "manifest_validation_report_review",
      redacted: true,
    },
    validationSummary,
    exceptionRegistry,
    nonWaivableRegistry,
    remediationQueue,
    boundaryConfirmation,
    externalAuthorityContext: {
      externalAuthorityStatus: sourceManifest.externalAuthorityStatus || "external_blocker",
      liveTradingStatus: sourceManifest.liveTradingStatus || "blocked",
      classification: "external_authority_context",
      doesNotGrantApproval: true,
      doesNotGrantExecution: true,
      redacted: true,
    },
    reportStatus: {
      reportMode: "metadata_only_non_executable",
      reportGenerationStatus: "generated_in_memory",
      sourceManifestStatus: sourceManifest.overallStatus || "missing",
      exceptionRegistryStatus: "generated_not_persisted",
      remediationQueueStatus: "generated_not_persisted",
      reportPersistenceStatus: "blocked",
      approvalStatus: "not_granted",
      waiverStatus: "not_granted",
      executionAuthorizationStatus: "denied",
      handoffAuthorizationStatus: "denied",
      overallStatus,
      redacted: true,
    },
    safetyConflict,
    reportMode: "metadata_only_non_executable",
    reportGenerationStatus: "generated_in_memory",
    sourceManifestStatus: sourceManifest.overallStatus || "missing",
    exceptionRegistryStatus: "generated_not_persisted",
    remediationQueueStatus: "generated_not_persisted",
    reportPersistenceStatus: "blocked",
    exceptionPersistenceStatus: "blocked",
    remediationPersistenceStatus: "blocked",
    approvalStatus: "not_granted",
    waiverStatus: "not_granted",
    executionAuthorizationStatus: "denied",
    handoffAuthorizationStatus: "denied",
    overallStatus,
    exceptionCount: exceptionRegistry.length,
    nonWaivableCount: nonWaivableRegistry.length,
    remediationQueueCount: remediationQueue.length,
    criticalExceptionCount: exceptionRegistry.filter((exception) => exception.severity === "critical").length,
    failClosedPrecedence: [...FAIL_CLOSED_PRECEDENCE],
    scenarioCatalog: [...SCENARIO_CATALOG],
    nextSafeImplementationStep: "manifest_validation_report_manual_review_context",
    validationExecutionAllowed: false,
    manifestExecutionAllowed: false,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
    batchExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    reportFileCreationAllowed: false,
    reportPersistenceAllowed: false,
    exceptionPersistenceAllowed: false,
    remediationPersistenceAllowed: false,
    waiverGrantAllowed: false,
    waiverPersistenceAllowed: false,
    executionAuthorizationAllowed: false,
    handoffExecutionAllowed: false,
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
    redacted: true,
  };
}

export function buildAdminTradingAiMlManifestValidationReportStatus(input = {}, options = {}) {
  const report = input.report || buildAiMlManifestValidationReport(input, options);
  return {
    ok: true,
    step: "Step 198: Add AI/ML manifest validation report and exception registry",
    status: "admin_only_ai_ml_manifest_validation_report_read_only",
    sourceStep: "step198",
    reportModel: TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL,
    report,
    blockedConfirmation: {
      validationExecutionAttempted: false,
      manifestExecutionAttempted: false,
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      featureFileCreated: false,
      datasetBuildAttempted: false,
      datasetFileCreated: false,
      batchExecutionAttempted: false,
      dryRunExecutionAttempted: false,
      manifestFileCreated: false,
      reportFileCreated: false,
      schemaMaterializationAttempted: false,
      partitionMaterializationAttempted: false,
      outputPathAssigned: false,
      reportPersisted: false,
      exceptionPersisted: false,
      remediationPersisted: false,
      reviewReceiptPersisted: false,
      approvalPersistenceAttempted: false,
      waiverGrantAttempted: false,
      waiverPersistenceAttempted: false,
      executionAuthorizationGranted: false,
      handoffExecutionAttempted: false,
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
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS },
    adminReadOnlyManifestValidationReportAllowed: true,
    deterministicInMemoryReportAllowed: true,
    deterministicExceptionClassificationAllowed: true,
    metadataOnlyRemediationQueueAllowed: true,
    validationExecutionAllowed: false,
    manifestExecutionAllowed: false,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
    batchExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    manifestFileCreationAllowed: false,
    reportFileCreationAllowed: false,
    schemaMaterializationAllowed: false,
    partitionMaterializationAllowed: false,
    outputPathAssignmentAllowed: false,
    reportPersistenceAllowed: false,
    exceptionPersistenceAllowed: false,
    remediationPersistenceAllowed: false,
    reviewReceiptPersistenceAllowed: false,
    manualApprovalPersistenceAllowed: false,
    waiverGrantAllowed: false,
    waiverPersistenceAllowed: false,
    executionAuthorizationAllowed: false,
    handoffExecutionAllowed: false,
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
    modelArtifactCreationAllowed: false,
    modelDeploymentAllowed: false,
    modelAutoApprovalAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    publicUiExposureAllowed: false,
    myPageExposureAllowed: false,
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
    redacted: true,
  };
}
