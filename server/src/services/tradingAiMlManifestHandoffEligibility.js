import {
  STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS,
  buildAdminTradingAiMlManifestValidationReportStatus,
  buildAiMlManifestValidationReport,
} from "./tradingAiMlManifestValidationReport.js";

export const STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS = Object.freeze({
  ...STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS,
  adminReadOnlyHandoffEligibilityAllowed: true,
  deterministicInMemoryHandoffPackageAllowed: true,
  metadataOnlyApprovalRequirementDeclarationAllowed: true,
  handoffExecutionAllowed: false,
  handoffTransmissionAllowed: false,
  handoffPersistenceAllowed: false,
  handoffPackageFileCreationAllowed: false,
  targetPreflightAuthorizationAllowed: false,
  targetPreflightExecutionAllowed: false,
  validationExecutionAllowed: false,
  manifestExecutionAllowed: false,
  dryRunExecutionAllowed: false,
  actualDataDownloadAllowed: false,
  featureGenerationAllowed: false,
  featureFileCreationAllowed: false,
  datasetBuildAllowed: false,
  datasetFileCreationAllowed: false,
  batchExecutionAllowed: false,
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
  readyForHandoffExecution: false,
  readyForTargetPreflightExecution: false,
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

export const TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL = Object.freeze({
  handoffPackageIdentity: "manifest_to_preflight_contract_package_identity",
  sourceReferenceSet: "explicit_version_pinning_reference_set",
  targetStageDeclaration: "metadata_contract_review_target_stage",
  eligibilityChecks: "metadata_only_handoff_eligibility_check[]",
  approvalRequirements: "manual_review_requirement[]",
  handoffPackage: "metadata_only_handoff_package",
  boundaryConfirmation: "fail_closed_handoff_boundary_confirmation",
  externalAuthorityContext: "external_order_authority_context",
  defaultStatus: {
    handoffMode: "metadata_only_non_executable",
    sourceReportStatus: "validation_report_ready_execution_blocked",
    handoffEligibilityStatus: "eligible_for_manual_review",
    handoffPackageStatus: "generated_in_memory",
    handoffApprovalStatus: "not_granted",
    handoffAuthorizationStatus: "denied",
    handoffExecutionStatus: "blocked",
    handoffPersistenceStatus: "blocked",
    handoffTransmissionStatus: "blocked",
    targetPreflightAuthorizationStatus: "denied",
    targetPreflightExecutionStatus: "blocked",
    overallStatus: "handoff_candidate_ready_execution_blocked",
    redacted: true,
  },
  redacted: true,
});

const REQUIRED_REFERENCE_FIELDS = Object.freeze([
  "sourceReportId",
  "sourceReportVersion",
  "sourceManifestId",
  "sourceManifestVersion",
  "sourceBatchContractReviewId",
  "datasetSpecId",
  "datasetSpecVersion",
  "featureSetId",
  "featureSetVersion",
  "labelSpecId",
  "labelSpecVersion",
  "splitPolicyId",
  "splitPolicyVersion",
  "normalizationPolicyId",
  "normalizationPolicyVersion",
  "qualityPolicyId",
  "qualityPolicyVersion",
  "sourceMappingId",
  "sourceMappingVersion",
]);

const REQUIRED_APPROVAL_ROLES = Object.freeze([
  "aiMlArchitectureOwner",
  "dataContractOwner",
  "dataQualityReviewer",
  "modelRiskReviewer",
  "securityPrivacyReviewer",
  "complianceLegalReviewer",
  "operationsReviewer",
  "finalManualApprover",
]);

const REQUIRED_CHECK_CATEGORIES = Object.freeze([
  "source_report_status",
  "source_report_boundary",
  "reference_completeness",
  "version_pinning",
  "exception_clearance",
  "non_waivable_boundary",
  "manual_approval_requirements",
  "target_stage_declaration",
  "handoff_package_boundary",
  "persistence_and_transmission_boundary",
  "execution_boundary",
  "external_authority_context",
  "prohibited_handoff_intent",
]);

const PROHIBITED_HANDOFF_INTENTS = Object.freeze([
  "execute_handoff",
  "transmit_handoff",
  "persist_handoff",
  "create_handoff_file",
  "invoke_target_preflight",
  "authorize_target_preflight",
  "execute_target_preflight",
  "grant_handoff_approval",
  "persist_handoff_approval",
  "grant_waiver",
  "persist_waiver",
  "grant_execution_authority",
  "execute_validation",
  "execute_manifest",
  "execute_dry_run",
  "download_data",
  "query_provider",
  "query_kis",
  "read_database",
  "write_database",
  "assign_output_path",
  "materialize_schema",
  "materialize_partition",
  "build_dataset",
  "generate_features",
  "run_python",
  "train_model",
  "deploy_model",
  "submit_order",
  "enable_live_trading",
]);

const SCENARIO_CATALOG = Object.freeze([
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
]);

const FAIL_CLOSED_PRECEDENCE = Object.freeze([
  "invalid_source_report",
  "blocked_by_safety_policy",
  "handoff_requirements_incomplete",
  "handoff_candidate_ready_execution_blocked",
]);

function sortByKey(items, key) {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeMetadataValue(value, fallback = "missing") {
  const text = String(value ?? fallback);
  if (/api\s*key|secret|credential|token|account\s*id|provider raw response|environment value|private path|bucket path|artifact path|dataset path|raw report payload|raw manifest payload|hash|digest|checksum|signature|content hash|integrity artifact|actual market data|account data|[A-Za-z]:\\|\\\\/i.test(text)) {
    return "redacted_metadata";
  }
  return text;
}

function isPinnedVersion(value) {
  return typeof value === "string" && /^v\d+(\.\d+){0,2}$/.test(value);
}

function makeCheck({ checkId, category, status = "pass", severity = "info", message, evidence = [], remediation = "none", blocking = false, manualReviewRequired = false }) {
  return Object.freeze({
    checkId,
    category,
    status,
    severity,
    message: sanitizeMetadataValue(message, "metadata check"),
    evidence: safeArray(evidence).map((item) => sanitizeMetadataValue(item)).sort(),
    remediation: sanitizeMetadataValue(remediation, "review metadata"),
    blocking,
    manualReviewRequired,
    redacted: true,
  });
}

export function collectManifestHandoffSource(input = {}, options = {}) {
  const sourceReport = input.sourceReport
    || input.report
    || input.aiMlManifestHandoffSource?.report
    || input.aiMlManifestValidationReportStatus?.report
    || buildAiMlManifestValidationReport(input.sourceInput || input, options);
  return {
    report: sourceReport,
    adminStatus: input.aiMlManifestValidationReportStatus
      || buildAdminTradingAiMlManifestValidationReportStatus({ ...input, report: sourceReport }, options),
    sourceStep: "step198",
    redacted: true,
  };
}

export function buildManifestHandoffReferenceSet(sourceReport, overrides = {}) {
  const reportIdentity = sourceReport.reportIdentity || {};
  const sourceManifestReference = sourceReport.sourceManifestReference || {};
  const referenceSet = {
    sourceReportId: reportIdentity.reportId || "missing_report",
    sourceReportVersion: reportIdentity.reportVersion || "missing_version",
    sourceManifestId: sourceManifestReference.manifestId || reportIdentity.sourceManifestId || "missing_manifest",
    sourceManifestVersion: sourceManifestReference.manifestVersion || reportIdentity.sourceManifestVersion || "missing_version",
    sourceBatchContractReviewId: "step196_ai_ml_batch_contract_review",
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
    qualityPolicyId: "dataset-build-quality-policy-v0",
    qualityPolicyVersion: "v1",
    sourceMappingId: "logical-source-mapping-step197-v0",
    sourceMappingVersion: "v1",
    referenceMode: "explicit_version_pinning",
    referenceMutationAllowed: false,
    cryptographicVerificationStatus: "not_performed",
    redacted: true,
  };
  return Object.fromEntries(Object.entries({ ...referenceSet, ...overrides }).map(([key, value]) => [key, typeof value === "string" ? sanitizeMetadataValue(value) : value]));
}

function buildTargetStageDeclaration(overrides = {}) {
  return {
    targetStageId: "ai_ml_dataset_build_preflight_design",
    targetStageType: "metadata_contract_review",
    targetExecutionMode: "non_executable",
    targetAuthorizationStatus: "denied",
    targetExecutionStatus: "blocked",
    redacted: true,
    ...overrides,
  };
}

export function buildManifestHandoffApprovalRequirements(overrides = {}) {
  const roleOverrides = overrides.roleOverrides || {};
  return REQUIRED_APPROVAL_ROLES.map((role) => ({
    requirementId: `step199_approval_requirement_${role}`,
    role,
    required: true,
    scope: "handoff_candidate_review_only",
    status: "manual_review_required",
    message: `${role} manual review declaration required before any future handoff approval`,
    ...(roleOverrides[role] || {}),
    redacted: true,
  })).sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

function summarizeExceptions(sourceReport) {
  const exceptions = safeArray(sourceReport.exceptionRegistry);
  return {
    blockingExceptionCount: exceptions.filter((item) => item.blocking === true).length,
    criticalExceptionCount: exceptions.filter((item) => item.severity === "critical").length,
    nonWaivableCount: safeArray(sourceReport.nonWaivableRegistry).length,
    remediationQueueCount: safeArray(sourceReport.remediationQueue).length,
    openContractRevisionExceptionCount: exceptions.filter((item) => item.exceptionClass === "contract_revision_exception" && item.dispositionStatus !== "closed").length,
    manualReviewItemCount: exceptions.filter((item) => item.exceptionClass === "manual_review_item" || item.manualReviewRequired === true).length,
    externalAuthorityContextCount: exceptions.filter((item) => item.exceptionClass === "external_authority_context" || item.category === "external_authority_context").length,
    safetyBoundaryExceptionCount: exceptions.filter((item) => item.exceptionClass === "safety_boundary_exception" || item.sourceStatus === "blocked").length,
    redacted: true,
  };
}

function buildBoundaryConfirmation(sourceReport) {
  return {
    sourceReportExecutionStatus: "blocked",
    sourceManifestExecutionStatus: sourceReport.sourceManifestReference?.dryRunExecutionStatus || "blocked",
    approvalStatus: sourceReport.approvalStatus || "not_granted",
    waiverStatus: sourceReport.waiverStatus || "not_granted",
    handoffAuthorizationStatus: "denied",
    handoffExecutionStatus: "blocked",
    handoffPersistenceStatus: "blocked",
    handoffTransmissionStatus: "blocked",
    targetPreflightAuthorizationStatus: "denied",
    targetPreflightExecutionStatus: "blocked",
    dryRunExecutionStatus: sourceReport.sourceManifestReference?.dryRunExecutionStatus || "blocked",
    materializationStatus: sourceReport.sourceManifestReference?.materializationStatus || "blocked",
    outputPathStatus: sourceReport.sourceManifestReference?.outputPathStatus || "not_assigned",
    redacted: true,
  };
}

function detectHandoffSafetyConflict({ sourceReport, exceptionSummary, boundaryConfirmation, targetStageDeclaration, controls = {} }) {
  const intents = safeArray(controls.requestedIntents || controls.prohibitedIntents);
  const prohibitedIntents = intents.filter((intent) => PROHIBITED_HANDOFF_INTENTS.includes(intent));
  return {
    sourceSafetyBlocked: sourceReport.overallStatus === "blocked_by_safety_policy",
    safetyBoundaryExceptionPresent: exceptionSummary.safetyBoundaryExceptionCount > 0,
    blockedOrCriticalExceptionPresent: exceptionSummary.blockingExceptionCount > 0 || exceptionSummary.criticalExceptionCount > 0,
    grantAttempted: controls.handoffApprovalStatus === "approved"
      || controls.waiverStatus === "granted"
      || controls.handoffAuthorizationStatus === "granted"
      || controls.executionAuthorizationStatus === "granted",
    persistenceOrTransmissionAttempted: controls.handoffPersistenceAttempted === true
      || controls.handoffTransmissionAttempted === true
      || controls.handoffPersistenceAllowed === true
      || controls.handoffTransmissionAllowed === true
      || controls.handoffPackageFileCreationAllowed === true,
    targetPreflightAttempted: controls.targetPreflightAuthorizationStatus === "granted"
      || controls.targetPreflightExecutionStatus === "executed"
      || controls.targetPreflightAuthorizationAttempted === true
      || controls.targetPreflightExecutionAttempted === true
      || targetStageDeclaration.targetAuthorizationStatus !== "denied"
      || targetStageDeclaration.targetExecutionStatus !== "blocked",
    boundaryOpened: boundaryConfirmation.handoffAuthorizationStatus !== "denied"
      || boundaryConfirmation.handoffExecutionStatus !== "blocked"
      || boundaryConfirmation.handoffPersistenceStatus !== "blocked"
      || boundaryConfirmation.handoffTransmissionStatus !== "blocked"
      || boundaryConfirmation.targetPreflightAuthorizationStatus !== "denied"
      || boundaryConfirmation.targetPreflightExecutionStatus !== "blocked"
      || boundaryConfirmation.dryRunExecutionStatus !== "blocked"
      || boundaryConfirmation.materializationStatus !== "blocked"
      || boundaryConfirmation.outputPathStatus !== "not_assigned",
    prohibitedIntents,
    redacted: true,
  };
}

export function buildManifestHandoffEligibilityChecks({ sourceReport, referenceSet, targetStageDeclaration, approvalRequirements, exceptionSummary, boundaryConfirmation, controls = {} }) {
  const checks = [];
  const sourceReady = sourceReport.overallStatus === "validation_report_ready_execution_blocked";
  checks.push(makeCheck({
    checkId: "01_source_report_status",
    category: "source_report_status",
    status: sourceReady ? "pass" : "fail",
    severity: sourceReady ? "info" : "critical",
    message: sourceReady ? "source report is a handoff candidate" : "source report is not eligible for handoff candidate review",
    evidence: [sourceReport.overallStatus || "missing"],
    remediation: sourceReady ? "none" : "restore validation report ready execution blocked source status",
    blocking: !sourceReady,
  }));

  const sourceBoundaryOk = sourceReport.reportMode === "metadata_only_non_executable"
    && sourceReport.reportGenerationStatus === "generated_in_memory"
    && (sourceReport.reportPersistenceStatus || sourceReport.reportStatus?.reportPersistenceStatus) === "blocked"
    && (sourceReport.approvalStatus || sourceReport.reportStatus?.approvalStatus) === "not_granted"
    && (sourceReport.waiverStatus || sourceReport.reportStatus?.waiverStatus) === "not_granted"
    && (sourceReport.executionAuthorizationStatus || sourceReport.reportStatus?.executionAuthorizationStatus) === "denied"
    && (sourceReport.handoffAuthorizationStatus || sourceReport.reportStatus?.handoffAuthorizationStatus) === "denied";
  checks.push(makeCheck({
    checkId: "02_source_report_boundary",
    category: "source_report_boundary",
    status: sourceBoundaryOk ? "pass" : "blocked",
    severity: sourceBoundaryOk ? "info" : "critical",
    message: sourceBoundaryOk ? "source report remains metadata-only with authorization denied" : "source report boundary attempts authorization or persistence",
    evidence: [sourceReport.reportMode, sourceReport.reportGenerationStatus, sourceReport.reportPersistenceStatus, sourceReport.approvalStatus, sourceReport.waiverStatus, sourceReport.executionAuthorizationStatus, sourceReport.handoffAuthorizationStatus],
    remediation: sourceBoundaryOk ? "none" : "restore source report boundary to not_granted denied blocked states",
    blocking: !sourceBoundaryOk,
  }));

  const missingReferences = REQUIRED_REFERENCE_FIELDS.filter((field) => !referenceSet[field] || String(referenceSet[field]).startsWith("missing"));
  checks.push(makeCheck({
    checkId: "03_reference_completeness",
    category: "reference_completeness",
    status: missingReferences.length === 0 ? "pass" : "fail",
    severity: missingReferences.length === 0 ? "info" : "error",
    message: missingReferences.length === 0 ? "immutable metadata reference set is complete" : "immutable metadata reference set is missing required references",
    evidence: missingReferences.length === 0 ? ["referenceMode:explicit_version_pinning"] : missingReferences,
    remediation: missingReferences.length === 0 ? "none" : "declare all source report, manifest, batch, dataset, feature, label, split, normalization, quality, and source mapping references",
    blocking: missingReferences.length > 0,
  }));

  const versionFields = REQUIRED_REFERENCE_FIELDS.filter((field) => field.endsWith("Version"));
  const unpinnedVersions = versionFields.filter((field) => !isPinnedVersion(referenceSet[field]));
  checks.push(makeCheck({
    checkId: "04_version_pinning",
    category: "version_pinning",
    status: unpinnedVersions.length === 0 && referenceSet.referenceMode === "explicit_version_pinning" && referenceSet.referenceMutationAllowed === false ? "pass" : "fail",
    severity: unpinnedVersions.length === 0 ? "info" : "error",
    message: unpinnedVersions.length === 0 ? "references use explicit version pinning only" : "one or more references are not version pinned",
    evidence: unpinnedVersions.length === 0 ? ["referenceMutationAllowed:false", referenceSet.cryptographicVerificationStatus || "not_performed"] : unpinnedVersions,
    remediation: unpinnedVersions.length === 0 ? "none" : "pin every version field and keep mutation disabled",
    blocking: unpinnedVersions.length > 0,
  }));

  const exceptionClear = exceptionSummary.safetyBoundaryExceptionCount === 0 && exceptionSummary.openContractRevisionExceptionCount === 0;
  checks.push(makeCheck({
    checkId: "05_exception_clearance",
    category: "exception_clearance",
    status: exceptionClear ? "manual_review_required" : "fail",
    severity: exceptionClear ? "warning" : "error",
    message: exceptionClear ? "only manual review or external authority context remains" : "blocking or contract revision exceptions remain unresolved",
    evidence: [`contractRevision:${exceptionSummary.openContractRevisionExceptionCount}`, `safety:${exceptionSummary.safetyBoundaryExceptionCount}`, `manual:${exceptionSummary.manualReviewItemCount}`],
    remediation: exceptionClear ? "manual review declaration required" : "resolve contract revision and safety exceptions before handoff candidate review",
    blocking: !exceptionClear,
    manualReviewRequired: true,
  }));

  const nonWaivableSafetyClear = exceptionSummary.safetyBoundaryExceptionCount === 0 && exceptionSummary.criticalExceptionCount === 0;
  checks.push(makeCheck({
    checkId: "06_non_waivable_boundary",
    category: "non_waivable_boundary",
    status: nonWaivableSafetyClear ? "manual_review_required" : "blocked",
    severity: nonWaivableSafetyClear ? "warning" : "critical",
    message: nonWaivableSafetyClear ? "non-waivable registry is limited to review context" : "non-waivable safety exception blocks handoff",
    evidence: [`nonWaivable:${exceptionSummary.nonWaivableCount}`, `critical:${exceptionSummary.criticalExceptionCount}`],
    remediation: nonWaivableSafetyClear ? "keep external authority separate from execution authorization" : "remove safety boundary exception before handoff candidate review",
    blocking: !nonWaivableSafetyClear,
    manualReviewRequired: true,
  }));

  const missingApprovalRoles = approvalRequirements.filter((item) => item.required !== true || !item.role || item.status !== "manual_review_required");
  checks.push(makeCheck({
    checkId: "07_manual_approval_requirements",
    category: "manual_approval_requirements",
    status: missingApprovalRoles.length === 0 ? "manual_review_required" : "fail",
    severity: missingApprovalRoles.length === 0 ? "warning" : "error",
    message: missingApprovalRoles.length === 0 ? "manual approval requirements are declared but not granted" : "manual approval requirement declarations are incomplete",
    evidence: missingApprovalRoles.length === 0 ? [`roles:${approvalRequirements.length}`] : missingApprovalRoles.map((item) => item.requirementId || "missing_requirement"),
    remediation: missingApprovalRoles.length === 0 ? "manual approval remains not granted" : "declare every required handoff candidate review role",
    blocking: missingApprovalRoles.length > 0,
    manualReviewRequired: true,
  }));

  const targetOk = targetStageDeclaration.targetStageId === "ai_ml_dataset_build_preflight_design"
    && targetStageDeclaration.targetStageType === "metadata_contract_review"
    && targetStageDeclaration.targetExecutionMode === "non_executable"
    && targetStageDeclaration.targetAuthorizationStatus === "denied"
    && targetStageDeclaration.targetExecutionStatus === "blocked";
  checks.push(makeCheck({
    checkId: "08_target_stage_declaration",
    category: "target_stage_declaration",
    status: targetOk ? "pass" : "blocked",
    severity: targetOk ? "info" : "critical",
    message: targetOk ? "target stage is declared as non-executable metadata review" : "target stage attempts authorization or execution",
    evidence: [targetStageDeclaration.targetStageId, targetStageDeclaration.targetExecutionMode, targetStageDeclaration.targetAuthorizationStatus, targetStageDeclaration.targetExecutionStatus],
    remediation: targetOk ? "none" : "restore denied and blocked target preflight status",
    blocking: !targetOk,
  }));

  checks.push(makeCheck({
    checkId: "09_handoff_package_boundary",
    category: "handoff_package_boundary",
    status: "pass",
    severity: "info",
    message: "handoff package is generated in memory and non-executable",
    evidence: ["handoffPackageStatus:generated_in_memory", "handoffMode:metadata_only_non_executable"],
    remediation: "none",
  }));

  const persistenceOk = controls.handoffPersistenceAttempted !== true && controls.handoffTransmissionAttempted !== true && controls.handoffPackageFileCreationAllowed !== true;
  checks.push(makeCheck({
    checkId: "10_persistence_and_transmission_boundary",
    category: "persistence_and_transmission_boundary",
    status: persistenceOk ? "pass" : "blocked",
    severity: persistenceOk ? "info" : "critical",
    message: persistenceOk ? "handoff package persistence and transmission remain blocked" : "handoff persistence or transmission attempted",
    evidence: ["handoffPersistenceStatus:blocked", "handoffTransmissionStatus:blocked"],
    remediation: persistenceOk ? "none" : "remove handoff persistence, transmission, and file creation attempts",
    blocking: !persistenceOk,
  }));

  const executionOk = boundaryConfirmation.handoffAuthorizationStatus === "denied"
    && boundaryConfirmation.handoffExecutionStatus === "blocked"
    && boundaryConfirmation.targetPreflightAuthorizationStatus === "denied"
    && boundaryConfirmation.targetPreflightExecutionStatus === "blocked"
    && boundaryConfirmation.dryRunExecutionStatus === "blocked"
    && boundaryConfirmation.materializationStatus === "blocked"
    && boundaryConfirmation.outputPathStatus === "not_assigned";
  checks.push(makeCheck({
    checkId: "11_execution_boundary",
    category: "execution_boundary",
    status: executionOk ? "pass" : "blocked",
    severity: executionOk ? "info" : "critical",
    message: executionOk ? "handoff, target preflight, dry-run, and materialization execution remain blocked" : "execution boundary opened",
    evidence: [boundaryConfirmation.handoffAuthorizationStatus, boundaryConfirmation.handoffExecutionStatus, boundaryConfirmation.targetPreflightAuthorizationStatus, boundaryConfirmation.targetPreflightExecutionStatus, boundaryConfirmation.dryRunExecutionStatus, boundaryConfirmation.materializationStatus, boundaryConfirmation.outputPathStatus],
    remediation: executionOk ? "none" : "restore denied, blocked, and not assigned execution boundaries",
    blocking: !executionOk,
  }));

  checks.push(makeCheck({
    checkId: "12_external_authority_context",
    category: "external_authority_context",
    status: "manual_review_required",
    severity: "warning",
    message: "external order authority remains separate from handoff eligibility",
    evidence: [`externalAuthorityContext:${exceptionSummary.externalAuthorityContextCount}`],
    remediation: "do not infer order or live authority from handoff eligibility",
    manualReviewRequired: true,
  }));

  const intents = safeArray(controls.requestedIntents || controls.prohibitedIntents);
  const prohibitedIntents = intents.filter((intent) => PROHIBITED_HANDOFF_INTENTS.includes(intent));
  checks.push(makeCheck({
    checkId: "13_prohibited_handoff_intent",
    category: "prohibited_handoff_intent",
    status: prohibitedIntents.length === 0 ? "pass" : "blocked",
    severity: prohibitedIntents.length === 0 ? "info" : "critical",
    message: prohibitedIntents.length === 0 ? "handoff intent is metadata review only" : "prohibited handoff intent is blocked",
    evidence: prohibitedIntents.length === 0 ? ["declare_handoff_candidate_metadata"] : prohibitedIntents,
    remediation: prohibitedIntents.length === 0 ? "none" : "remove handoff, preflight, provider, DB, dry-run, training, order, and live execution intents",
    blocking: prohibitedIntents.length > 0,
  }));

  return sortByKey(checks, "checkId");
}

export function deriveManifestHandoffOutcome({ sourceReport, exceptionSummary, eligibilityChecks, safetyConflict }) {
  if (sourceReport.overallStatus === "invalid_source_manifest") return "invalid_source_report";
  if (sourceReport.overallStatus === "blocked_by_safety_policy"
    || safetyConflict.sourceSafetyBlocked
    || safetyConflict.safetyBoundaryExceptionPresent
    || safetyConflict.blockedOrCriticalExceptionPresent
    || safetyConflict.grantAttempted
    || safetyConflict.persistenceOrTransmissionAttempted
    || safetyConflict.targetPreflightAttempted
    || safetyConflict.boundaryOpened
    || safetyConflict.prohibitedIntents.length > 0
    || eligibilityChecks.some((check) => check.status === "blocked")) {
    return "blocked_by_safety_policy";
  }
  if (sourceReport.overallStatus === "manifest_exceptions_require_revision"
    || exceptionSummary.openContractRevisionExceptionCount > 0
    || eligibilityChecks.some((check) => check.status === "fail")) {
    return "handoff_requirements_incomplete";
  }
  return "handoff_candidate_ready_execution_blocked";
}

export function buildManifestHandoffPackage({ packageIdentity, referenceSet, targetStageDeclaration, eligibilitySummary, exceptionSummary, approvalRequirements, boundaryConfirmation, externalAuthorityContext }) {
  return {
    handoffPackageIdentity: packageIdentity,
    sourceReferenceSet: referenceSet,
    targetStageDeclaration,
    eligibilitySummary,
    exceptionSummary,
    approvalRequirements,
    boundaryConfirmation,
    externalAuthorityContext,
    packageStatus: {
      handoffPackageStatus: "generated_in_memory",
      handoffPersistenceStatus: "blocked",
      handoffTransmissionStatus: "blocked",
      handoffApprovalStatus: "not_granted",
      handoffAuthorizationStatus: "denied",
      handoffExecutionStatus: "blocked",
      targetPreflightAuthorizationStatus: "denied",
      targetPreflightExecutionStatus: "blocked",
      redacted: true,
    },
    redacted: true,
  };
}

export function evaluateAiMlManifestHandoffEligibility(input = {}, options = {}) {
  const source = collectManifestHandoffSource(input, options);
  const sourceReport = source.report;
  const referenceSet = buildManifestHandoffReferenceSet(sourceReport, input.referenceOverrides || {});
  const targetStageDeclaration = buildTargetStageDeclaration(input.targetStageOverrides || {});
  const approvalRequirements = buildManifestHandoffApprovalRequirements(input.approvalRequirementOverrides || {});
  const exceptionSummary = summarizeExceptions(sourceReport);
  const boundaryConfirmation = buildBoundaryConfirmation(sourceReport);
  const controls = input.handoffControls || {};
  const eligibilityChecks = buildManifestHandoffEligibilityChecks({
    sourceReport,
    referenceSet,
    targetStageDeclaration,
    approvalRequirements,
    exceptionSummary,
    boundaryConfirmation,
    controls,
  });
  const safetyConflict = detectHandoffSafetyConflict({
    sourceReport,
    exceptionSummary,
    boundaryConfirmation,
    targetStageDeclaration,
    controls,
  });
  const overallStatus = deriveManifestHandoffOutcome({
    sourceReport,
    exceptionSummary,
    eligibilityChecks,
    safetyConflict,
  });
  const handoffEligibilityStatus = overallStatus === "handoff_candidate_ready_execution_blocked"
    ? "eligible_for_manual_review"
    : "not_eligible";
  const packageIdentity = {
    handoffPackageId: `step199_handoff_package_${referenceSet.sourceReportId}_${referenceSet.sourceReportVersion}`,
    handoffPackageVersion: "v1",
    handoffPackageType: "manifest_to_preflight_contract_package",
    handoffMode: "metadata_only_non_executable",
    redacted: true,
  };
  const externalAuthorityContext = {
    externalAuthorityStatus: sourceReport.externalAuthorityContext?.externalAuthorityStatus || "external_blocker",
    liveTradingStatus: sourceReport.externalAuthorityContext?.liveTradingStatus || "blocked",
    orderAuthorityNotGranted: true,
    liveTradingNotGranted: true,
    redacted: true,
  };
  const eligibilitySummary = {
    sourceReportStatus: sourceReport.overallStatus || "missing",
    handoffEligibilityStatus,
    referenceCoverage: REQUIRED_REFERENCE_FIELDS.length - REQUIRED_REFERENCE_FIELDS.filter((field) => !referenceSet[field] || String(referenceSet[field]).startsWith("missing")).length,
    requiredReferenceCount: REQUIRED_REFERENCE_FIELDS.length,
    blockingExceptionCount: exceptionSummary.blockingExceptionCount,
    nonWaivableCount: exceptionSummary.nonWaivableCount,
    manualApprovalRequirementCount: approvalRequirements.length,
    approvalScope: "handoff_candidate_review_only",
    redacted: true,
  };
  const handoffPackage = buildManifestHandoffPackage({
    packageIdentity,
    referenceSet,
    targetStageDeclaration,
    eligibilitySummary,
    exceptionSummary,
    approvalRequirements,
    boundaryConfirmation,
    externalAuthorityContext,
  });

  return {
    handoffMode: "metadata_only_non_executable",
    sourceReportStatus: sourceReport.overallStatus || "missing",
    handoffEligibilityStatus,
    handoffPackageStatus: "generated_in_memory",
    handoffApprovalStatus: "not_granted",
    approvalPersistenceStatus: "blocked",
    approvalScope: "handoff_candidate_review_only",
    waiverStatus: "not_granted",
    handoffAuthorizationStatus: "denied",
    handoffExecutionStatus: "blocked",
    handoffPersistenceStatus: "blocked",
    handoffTransmissionStatus: "blocked",
    targetPreflightAuthorizationStatus: "denied",
    targetPreflightExecutionStatus: "blocked",
    overallStatus,
    handoffPackageIdentity: packageIdentity,
    sourceReferenceSet: referenceSet,
    targetStageDeclaration,
    eligibilitySummary,
    exceptionSummary,
    approvalRequirements,
    boundaryConfirmation,
    externalAuthorityContext,
    eligibilityChecks,
    handoffPackage,
    safetyConflict,
    referenceCoverage: eligibilitySummary.referenceCoverage,
    blockingExceptionCount: exceptionSummary.blockingExceptionCount,
    nonWaivableCount: exceptionSummary.nonWaivableCount,
    manualApprovalRequirementCount: approvalRequirements.length,
    failClosedPrecedence: [...FAIL_CLOSED_PRECEDENCE],
    checkCategories: [...REQUIRED_CHECK_CATEGORIES],
    scenarioCatalog: [...SCENARIO_CATALOG],
    nextSafeImplementationStep: "manifest_handoff_manual_review_receipt_contract",
    handoffExecutionAllowed: false,
    handoffTransmissionAllowed: false,
    handoffPersistenceAllowed: false,
    handoffPackageFileCreationAllowed: false,
    targetPreflightAuthorizationAllowed: false,
    targetPreflightExecutionAllowed: false,
    validationExecutionAllowed: false,
    manifestExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    datasetBuildAllowed: false,
    batchExecutionAllowed: false,
    readyForHandoffExecution: false,
    readyForTargetPreflightExecution: false,
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

export function buildAiMlManifestHandoffEligibility(input = {}, options = {}) {
  return evaluateAiMlManifestHandoffEligibility(input, options);
}

export function buildAdminTradingAiMlManifestHandoffEligibilityStatus(input = {}, options = {}) {
  const handoff = input.handoff || buildAiMlManifestHandoffEligibility(input, options);
  return {
    ok: true,
    step: "Step 199: Add AI/ML manifest handoff eligibility contract",
    status: "admin_only_ai_ml_manifest_handoff_eligibility_read_only",
    sourceStep: "step199",
    handoffModel: TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL,
    handoff,
    blockedConfirmation: {
      handoffExecutionAttempted: false,
      handoffTransmissionAttempted: false,
      handoffPersistenceAttempted: false,
      handoffPackageFileCreated: false,
      targetPreflightAuthorizationAttempted: false,
      targetPreflightExecutionAttempted: false,
      validationExecutionAttempted: false,
      manifestExecutionAttempted: false,
      dryRunExecutionAttempted: false,
      actualDataDownloadAttempted: false,
      featureGenerationAttempted: false,
      featureFileCreated: false,
      datasetBuildAttempted: false,
      datasetFileCreated: false,
      batchExecutionAttempted: false,
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
      dbMigrationAttempted: false,
      dbReadAttempted: false,
      dbWriteAttempted: false,
      persistentStorageAttempted: false,
      providerCallAttempted: false,
      quoteCallAttempted: false,
      kisCallAttempted: false,
      kisTokenIssuanceAttempted: false,
      pythonJobAttempted: false,
      modelTrainingAttempted: false,
      modelArtifactCreated: false,
      modelDeploymentAttempted: false,
      orderSubmissionAttempted: false,
      liveTradingAttempted: false,
      publicUiExposed: false,
      myPageUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS },
    adminReadOnlyHandoffEligibilityAllowed: true,
    deterministicInMemoryHandoffPackageAllowed: true,
    metadataOnlyApprovalRequirementDeclarationAllowed: true,
    handoffExecutionAllowed: false,
    handoffTransmissionAllowed: false,
    handoffPersistenceAllowed: false,
    handoffPackageFileCreationAllowed: false,
    targetPreflightAuthorizationAllowed: false,
    targetPreflightExecutionAllowed: false,
    validationExecutionAllowed: false,
    manifestExecutionAllowed: false,
    dryRunExecutionAllowed: false,
    actualDataDownloadAllowed: false,
    featureGenerationAllowed: false,
    featureFileCreationAllowed: false,
    datasetBuildAllowed: false,
    datasetFileCreationAllowed: false,
    batchExecutionAllowed: false,
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
    readyForHandoffExecution: false,
    readyForTargetPreflightExecution: false,
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
