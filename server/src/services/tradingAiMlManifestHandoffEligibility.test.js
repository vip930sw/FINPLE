import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP199_ADDITIONAL_FALSE_FLAGS,
  STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS,
  STEP199_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL,
  buildAdminTradingAiMlManifestHandoffEligibilityStatus,
  buildAiMlManifestHandoffEligibility,
  buildManifestHandoffApprovalRequirements,
  buildManifestHandoffEligibilityChecks,
  buildManifestHandoffPackage,
  buildManifestHandoffReferenceSet,
  collectManifestHandoffSource,
  deriveManifestHandoffOutcome,
  evaluateAiMlManifestHandoffEligibility,
} from "./tradingAiMlManifestHandoffEligibility.js";
import {
  buildAiMlManifestValidationReport,
} from "./tradingAiMlManifestValidationReport.js";
import {
  buildAiMlFailClosedFlags,
} from "./tradingAiMlContractPrimitives.js";

const SCENARIOS = [
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
];

const FALSE_PERMISSION_KEYS = [
  "handoffExecutionAllowed",
  "handoffTransmissionAllowed",
  "handoffPersistenceAllowed",
  "handoffPackageFileCreationAllowed",
  "targetPreflightAuthorizationAllowed",
  "targetPreflightExecutionAllowed",
  "validationExecutionAllowed",
  "manifestExecutionAllowed",
  "dryRunExecutionAllowed",
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "batchExecutionAllowed",
  "schemaMaterializationAllowed",
  "partitionMaterializationAllowed",
  "outputPathAssignmentAllowed",
  "reportPersistenceAllowed",
  "exceptionPersistenceAllowed",
  "remediationPersistenceAllowed",
  "reviewReceiptPersistenceAllowed",
  "manualApprovalPersistenceAllowed",
  "waiverGrantAllowed",
  "waiverPersistenceAllowed",
  "executionAuthorizationAllowed",
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
  "modelArtifactCreationAllowed",
  "modelDeploymentAllowed",
  "modelAutoApprovalAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForHandoffExecution",
  "readyForTargetPreflightExecution",
  "readyForValidationExecution",
  "readyForManifestExecution",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForBatchExecution",
  "readyForDryRunExecution",
  "readyForSchemaMaterialization",
  "readyForPartitionMaterialization",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

const STEP199_METADATA_TRUE_FLAGS = [
  "adminReadOnlyManifestValidationReportAllowed",
  "deterministicInMemoryReportAllowed",
  "deterministicExceptionClassificationAllowed",
  "metadataOnlyRemediationQueueAllowed",
  "adminReadOnlyHandoffEligibilityAllowed",
  "deterministicInMemoryHandoffPackageAllowed",
  "metadataOnlyApprovalRequirementDeclarationAllowed",
];

function sourceWith(overrides = {}) {
  return {
    ...buildAiMlManifestValidationReport(),
    ...overrides,
  };
}

test("Step199 aggregates Step198 report without reclassifying exceptions", () => {
  const source = collectManifestHandoffSource();
  const handoff = buildAiMlManifestHandoffEligibility({ sourceReport: source.report });
  assert.equal(source.sourceStep, "step198");
  assert.equal(handoff.sourceReportStatus, source.report.overallStatus);
  assert.equal(handoff.sourceReferenceSet.sourceReportId, source.report.reportIdentity.reportId);
  assert.equal(handoff.sourceReferenceSet.sourceReportVersion, source.report.reportIdentity.reportVersion);
  assert.equal(handoff.exceptionSummary.externalAuthorityContextCount, source.report.exceptionRegistry.filter((item) => item.category === "external_authority_context").length);
  assert.equal(handoff.exceptionSummary.safetyBoundaryExceptionCount, 0);
});

test("Step199 scenario A valid candidate is eligible for manual review while execution stays blocked", () => {
  const handoff = buildAiMlManifestHandoffEligibility();
  assert.equal(handoff.handoffMode, "metadata_only_non_executable");
  assert.equal(handoff.sourceReportStatus, "validation_report_ready_execution_blocked");
  assert.equal(handoff.handoffEligibilityStatus, "eligible_for_manual_review");
  assert.equal(handoff.handoffPackageStatus, "generated_in_memory");
  assert.equal(handoff.handoffApprovalStatus, "not_granted");
  assert.equal(handoff.handoffAuthorizationStatus, "denied");
  assert.equal(handoff.handoffExecutionStatus, "blocked");
  assert.equal(handoff.handoffPersistenceStatus, "blocked");
  assert.equal(handoff.handoffTransmissionStatus, "blocked");
  assert.equal(handoff.targetPreflightAuthorizationStatus, "denied");
  assert.equal(handoff.targetPreflightExecutionStatus, "blocked");
  assert.equal(handoff.overallStatus, "handoff_candidate_ready_execution_blocked");
});

test("Step199 deterministic handoff package, reference, check, and approval ordering are stable", () => {
  const first = evaluateAiMlManifestHandoffEligibility();
  const second = evaluateAiMlManifestHandoffEligibility();
  assert.deepEqual(first, second);
  assert.deepEqual(first.scenarioCatalog, SCENARIOS);
  assert.deepEqual(Object.keys(first.sourceReferenceSet).sort(), Object.keys(second.sourceReferenceSet).sort());
  assert.deepEqual(first.eligibilityChecks.map((check) => check.checkId), [...first.eligibilityChecks.map((check) => check.checkId)].sort());
  assert.deepEqual(first.approvalRequirements.map((item) => item.requirementId), [...first.approvalRequirements.map((item) => item.requirementId)].sort());
});

test("Step199 scenario B invalid source report fails closed", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    sourceReport: sourceWith({ overallStatus: "invalid_source_manifest" }),
  });
  assert.equal(handoff.overallStatus, "invalid_source_report");
});

test("Step199 scenario C source safety block fails closed", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    sourceReport: sourceWith({ overallStatus: "blocked_by_safety_policy" }),
  });
  assert.equal(handoff.overallStatus, "blocked_by_safety_policy");
});

test("Step199 scenario D source revision required is incomplete", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    sourceReport: sourceWith({ overallStatus: "manifest_exceptions_require_revision" }),
  });
  assert.equal(handoff.overallStatus, "handoff_requirements_incomplete");
});

test("Step199 scenario E non-waivable safety exception blocks handoff", () => {
  const source = sourceWith({
    exceptionRegistry: [
      {
        exceptionId: "step198_exception_14_execution_boundary",
        sourceCheckId: "14_execution_boundary",
        category: "execution_boundary",
        exceptionClass: "safety_boundary_exception",
        sourceStatus: "blocked",
        severity: "critical",
        blocking: true,
        manualReviewRequired: false,
        waiverEligibility: "prohibited",
        waiverStatus: "not_granted",
        dispositionStatus: "open_metadata_only",
        message: "execution boundary opened",
        evidence: ["execution:opened"],
        remediation: "restore execution boundary",
        ownerRole: "operations_reviewer",
        redacted: true,
      },
    ],
    nonWaivableRegistry: [{ exceptionId: "step198_exception_14_execution_boundary" }],
  });
  const handoff = buildAiMlManifestHandoffEligibility({ sourceReport: source });
  assert.equal(handoff.overallStatus, "blocked_by_safety_policy");
  assert.equal(handoff.exceptionSummary.safetyBoundaryExceptionCount, 1);
});

test("Step199 scenario F missing immutable reference is incomplete", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    referenceOverrides: { datasetSpecVersion: "" },
  });
  assert.equal(handoff.overallStatus, "handoff_requirements_incomplete");
  assert.ok(handoff.eligibilityChecks.some((check) => check.category === "version_pinning" && check.status === "fail"));
});

test("Step199 scenario G missing approval role is incomplete", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    approvalRequirementOverrides: {
      roleOverrides: {
        finalManualApprover: { status: "missing" },
      },
    },
  });
  assert.equal(handoff.overallStatus, "handoff_requirements_incomplete");
  assert.ok(handoff.eligibilityChecks.some((check) => check.category === "manual_approval_requirements" && check.status === "fail"));
});

test("Step199 scenario H approval or waiver grant attempts are safety blocked", () => {
  for (const controls of [
    { handoffApprovalStatus: "approved" },
    { waiverStatus: "granted" },
    { handoffAuthorizationStatus: "granted" },
  ]) {
    const handoff = buildAiMlManifestHandoffEligibility({ handoffControls: controls });
    assert.equal(handoff.overallStatus, "blocked_by_safety_policy");
    assert.equal(handoff.safetyConflict.grantAttempted, true);
  }
});

test("Step199 scenario I handoff persistence or transmission attempts are safety blocked", () => {
  for (const controls of [
    { handoffPersistenceAttempted: true },
    { handoffTransmissionAttempted: true },
    { handoffPackageFileCreationAllowed: true },
  ]) {
    const handoff = buildAiMlManifestHandoffEligibility({ handoffControls: controls });
    assert.equal(handoff.overallStatus, "blocked_by_safety_policy");
    assert.equal(handoff.safetyConflict.persistenceOrTransmissionAttempted, true);
  }
});

test("Step199 scenario J target preflight authorization or execution attempts are safety blocked", () => {
  for (const controls of [
    { targetPreflightAuthorizationStatus: "granted" },
    { targetPreflightExecutionStatus: "executed" },
    { targetPreflightExecutionAttempted: true },
  ]) {
    const handoff = buildAiMlManifestHandoffEligibility({ handoffControls: controls });
    assert.equal(handoff.overallStatus, "blocked_by_safety_policy");
    assert.equal(handoff.safetyConflict.targetPreflightAttempted, true);
  }
});

test("Step199 scenario K external authority context stays separate from execution authority", () => {
  const handoff = buildAiMlManifestHandoffEligibility();
  assert.equal(handoff.externalAuthorityContext.externalAuthorityStatus, "external_blocker");
  assert.equal(handoff.externalAuthorityContext.liveTradingStatus, "blocked");
  assert.equal(handoff.overallStatus, "handoff_candidate_ready_execution_blocked");
  assert.equal(handoff.handoffAuthorizationStatus, "denied");
  assert.equal(handoff.targetPreflightAuthorizationStatus, "denied");
});

test("Step199 scenario L ordering survives shuffled source exceptions", () => {
  const source = buildAiMlManifestValidationReport();
  const shuffled = {
    ...source,
    exceptionRegistry: [...source.exceptionRegistry].reverse(),
    nonWaivableRegistry: [...source.nonWaivableRegistry].reverse(),
  };
  const first = buildAiMlManifestHandoffEligibility({ sourceReport: source });
  const second = buildAiMlManifestHandoffEligibility({ sourceReport: shuffled });
  assert.deepEqual(first.eligibilityChecks.map((check) => check.checkId), second.eligibilityChecks.map((check) => check.checkId));
  assert.deepEqual(first.approvalRequirements.map((item) => item.requirementId), second.approvalRequirements.map((item) => item.requirementId));
});

test("Step199 scenario M does not mutate source report or override objects", () => {
  const source = buildAiMlManifestValidationReport();
  const referenceOverrides = { datasetSpecVersion: "v1" };
  const approvalRequirementOverrides = {
    roleOverrides: { finalManualApprover: { message: "manual review remains required" } },
  };
  const beforeSource = JSON.stringify(source);
  const beforeRefs = JSON.stringify(referenceOverrides);
  const beforeApproval = JSON.stringify(approvalRequirementOverrides);
  buildAiMlManifestHandoffEligibility({ sourceReport: source, referenceOverrides, approvalRequirementOverrides });
  assert.equal(JSON.stringify(source), beforeSource);
  assert.equal(JSON.stringify(referenceOverrides), beforeRefs);
  assert.equal(JSON.stringify(approvalRequirementOverrides), beforeApproval);
});

test("Step199 scenario N sensitive values are redacted from references and checks", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    referenceOverrides: {
      datasetSpecId: "secret token C:\\private\\dataset",
      featureSetId: "provider raw response",
      labelSpecId: "hash value",
      sourceMappingId: "digest value",
    },
  });
  const text = JSON.stringify({
    sourceReferenceSet: handoff.sourceReferenceSet,
    eligibilityChecks: handoff.eligibilityChecks,
    handoffPackage: handoff.handoffPackage,
  }).toLowerCase();
  for (const forbidden of ["secret token", "c:\\private", "provider raw response", "hash value", "digest value"]) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
  assert.match(text, /redacted_metadata/);
});

test("Step202 scenario O shared flag output compatibility preserves true and protected false flags", () => {
  const status = buildAdminTradingAiMlManifestHandoffEligibilityStatus();
  assert.deepEqual(Object.keys(STEP199_METADATA_ONLY_ALLOWED_FLAGS).sort(), STEP199_METADATA_TRUE_FLAGS.sort());
  for (const key of STEP199_METADATA_TRUE_FLAGS) {
    assert.equal(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS[key], true, key);
    assert.equal(status.flags[key], true, key);
  }
  for (const key of [
    ...FALSE_PERMISSION_KEYS,
    ...Object.keys(STEP199_ADDITIONAL_FALSE_FLAGS),
  ]) {
    assert.equal(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
  assert.equal(Object.keys(status.flags).length, Object.keys(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS).length);
});

test("Step202 scenario P inherited true execution conflict is forced false", () => {
  const conflictedFlags = buildAiMlFailClosedFlags({
    inheritedFlags: {
      ...STEP199_METADATA_ONLY_ALLOWED_FLAGS,
      providerCallsAllowed: true,
      handoffExecutionAllowed: true,
      targetPreflightExecutionAllowed: true,
      readyForOrderSubmission: true,
      unknownRuntimePermissionAllowed: true,
    },
    allowedMetadataFlags: STEP199_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP199_ADDITIONAL_FALSE_FLAGS,
  });
  for (const key of ["providerCallsAllowed", "handoffExecutionAllowed", "targetPreflightExecutionAllowed", "readyForOrderSubmission"]) {
    assert.equal(conflictedFlags[key], false, key);
  }
  assert.equal(conflictedFlags.unknownRuntimePermissionAllowed, undefined);
});

test("Step202 scenario Q metadata true allowlist is explicit and limited", () => {
  const actualTrueFlags = Object.entries(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  assert.deepEqual(actualTrueFlags, [...STEP199_METADATA_TRUE_FLAGS].sort());
});

test("Step202 scenario R shared helper compatibility keeps deterministic ordering and redaction", () => {
  const handoff = buildAiMlManifestHandoffEligibility({
    sourceReport: sourceWith({
      exceptionRegistry: [
        {
          exceptionId: "z_sensitive",
          category: "external_authority_context",
          exceptionClass: "external_authority_context",
          severity: "warning",
          blocking: false,
          evidence: ["api key should redact"],
          redacted: true,
        },
        {
          exceptionId: "a_manual",
          category: "manual_review",
          exceptionClass: "manual_review_item",
          severity: "warning",
          blocking: false,
          evidence: ["benign metadata"],
          redacted: true,
        },
      ],
    }),
    referenceOverrides: {
      datasetSpecId: "secret provider raw response",
      featureSetId: "feature-set-step193-core-v0",
    },
  });
  assert.deepEqual(handoff.eligibilityChecks.map((check) => check.checkId), [...handoff.eligibilityChecks.map((check) => check.checkId)].sort());
  assert.deepEqual(handoff.approvalRequirements.map((item) => item.requirementId), [...handoff.approvalRequirements.map((item) => item.requirementId)].sort());
  assert.equal(handoff.sourceReferenceSet.datasetSpecId, "redacted_metadata");
});

test("Step202 scenario S full default output remains compatible", () => {
  const handoff = buildAiMlManifestHandoffEligibility();
  assert.deepEqual({
    handoffMode: handoff.handoffMode,
    sourceReportStatus: handoff.sourceReportStatus,
    handoffEligibilityStatus: handoff.handoffEligibilityStatus,
    handoffPackageStatus: handoff.handoffPackageStatus,
    handoffApprovalStatus: handoff.handoffApprovalStatus,
    handoffAuthorizationStatus: handoff.handoffAuthorizationStatus,
    handoffExecutionStatus: handoff.handoffExecutionStatus,
    handoffPersistenceStatus: handoff.handoffPersistenceStatus,
    handoffTransmissionStatus: handoff.handoffTransmissionStatus,
    targetPreflightAuthorizationStatus: handoff.targetPreflightAuthorizationStatus,
    targetPreflightExecutionStatus: handoff.targetPreflightExecutionStatus,
    overallStatus: handoff.overallStatus,
  }, {
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
  });
  assert.equal(handoff.referenceCoverage, 19);
  assert.equal(handoff.requiredReferenceCount, undefined);
  assert.equal(handoff.eligibilitySummary.requiredReferenceCount, 19);
  assert.equal(handoff.approvalRequirements.length, 8);
  assert.equal(handoff.eligibilityChecks.length, 13);
});

test("Step202 scenario T shared clone use prevents input mutation", () => {
  const source = buildAiMlManifestValidationReport();
  const input = {
    sourceReport: source,
    referenceOverrides: { sourceReportVersion: "v1" },
    approvalRequirementOverrides: {
      roleOverrides: {
        operationsReviewer: { message: "manual review remains required" },
      },
    },
    handoffControls: { requestedIntents: ["declare_handoff_candidate_metadata"] },
  };
  const before = JSON.stringify(input);
  buildAiMlManifestHandoffEligibility(input);
  assert.equal(JSON.stringify(input), before);
});

test("Step199 helper functions construct deterministic package pieces", () => {
  const source = buildAiMlManifestValidationReport();
  const referenceSet = buildManifestHandoffReferenceSet(source);
  const approvalRequirements = buildManifestHandoffApprovalRequirements();
  const eligibilityChecks = buildManifestHandoffEligibilityChecks({
    sourceReport: source,
    referenceSet,
    targetStageDeclaration: {
      targetStageId: "ai_ml_dataset_build_preflight_design",
      targetStageType: "metadata_contract_review",
      targetExecutionMode: "non_executable",
      targetAuthorizationStatus: "denied",
      targetExecutionStatus: "blocked",
    },
    approvalRequirements,
    exceptionSummary: {
      blockingExceptionCount: 0,
      criticalExceptionCount: 0,
      nonWaivableCount: 1,
      openContractRevisionExceptionCount: 0,
      manualReviewItemCount: 1,
      externalAuthorityContextCount: 1,
      safetyBoundaryExceptionCount: 0,
    },
    boundaryConfirmation: {
      handoffAuthorizationStatus: "denied",
      handoffExecutionStatus: "blocked",
      handoffPersistenceStatus: "blocked",
      handoffTransmissionStatus: "blocked",
      targetPreflightAuthorizationStatus: "denied",
      targetPreflightExecutionStatus: "blocked",
      dryRunExecutionStatus: "blocked",
      materializationStatus: "blocked",
      outputPathStatus: "not_assigned",
    },
  });
  const handoffPackage = buildManifestHandoffPackage({
    packageIdentity: {
      handoffPackageId: "step199_handoff_package_test_v1",
      handoffPackageVersion: "v1",
      handoffPackageType: "manifest_to_preflight_contract_package",
      handoffMode: "metadata_only_non_executable",
    },
    referenceSet,
    targetStageDeclaration: { targetStageId: "ai_ml_dataset_build_preflight_design" },
    eligibilitySummary: { sourceReportStatus: "validation_report_ready_execution_blocked" },
    exceptionSummary: { externalAuthorityContextCount: 1 },
    approvalRequirements,
    boundaryConfirmation: { handoffExecutionStatus: "blocked" },
    externalAuthorityContext: { externalAuthorityStatus: "external_blocker" },
  });
  assert.equal(referenceSet.referenceMode, "explicit_version_pinning");
  assert.equal(referenceSet.referenceMutationAllowed, false);
  assert.equal(referenceSet.cryptographicVerificationStatus, "not_performed");
  assert.equal(approvalRequirements.length, 8);
  assert.deepEqual(eligibilityChecks.map((check) => check.checkId), [...eligibilityChecks.map((check) => check.checkId)].sort());
  assert.equal(handoffPackage.packageStatus.handoffPackageStatus, "generated_in_memory");
});

test("Step199 outcome precedence keeps invalid source before safety and incomplete states", () => {
  const outcome = deriveManifestHandoffOutcome({
    sourceReport: { overallStatus: "invalid_source_manifest" },
    exceptionSummary: { openContractRevisionExceptionCount: 1 },
    eligibilityChecks: [{ status: "blocked" }],
    safetyConflict: {
      sourceSafetyBlocked: true,
      safetyBoundaryExceptionPresent: true,
      blockedOrCriticalExceptionPresent: true,
      grantAttempted: true,
      persistenceOrTransmissionAttempted: true,
      targetPreflightAttempted: true,
      boundaryOpened: true,
      prohibitedIntents: ["execute_handoff"],
    },
  });
  assert.equal(outcome, "invalid_source_report");
});

test("Step199 prohibited handoff intents are safety blocked", () => {
  for (const intent of ["execute_handoff", "transmit_handoff", "persist_handoff", "invoke_target_preflight", "execute_target_preflight", "run_python", "submit_order"]) {
    const handoff = buildAiMlManifestHandoffEligibility({
      handoffControls: { requestedIntents: [intent] },
    });
    assert.equal(handoff.overallStatus, "blocked_by_safety_policy", intent);
  }
});

test("Step199 admin status construction keeps all readiness and execution flags false", () => {
  const status = buildAdminTradingAiMlManifestHandoffEligibilityStatus();
  assert.equal(TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL.defaultStatus.handoffMode, "metadata_only_non_executable");
  assert.equal(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS.adminReadOnlyHandoffEligibilityAllowed, true);
  assert.equal(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS.deterministicInMemoryHandoffPackageAllowed, true);
  assert.equal(STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS.metadataOnlyApprovalRequirementDeclarationAllowed, true);
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(status[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
  for (const [key, value] of Object.entries(status.blockedConfirmation)) {
    if (key === "redacted") continue;
    if (typeof value === "boolean") assert.equal(value, false, key);
  }
});
