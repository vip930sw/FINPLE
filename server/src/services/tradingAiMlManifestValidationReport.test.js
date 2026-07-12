import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP198_ADDITIONAL_FALSE_FLAGS,
  STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS,
  STEP198_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL,
  buildAdminTradingAiMlManifestValidationReportStatus,
  buildAiMlManifestValidationReport,
  buildManifestExceptionRegistry,
  buildManifestNonWaivableRegistry,
  buildManifestRemediationQueue,
  buildManifestValidationSummary,
  collectManifestValidationSource,
  deriveManifestValidationReportOutcome,
  evaluateAiMlManifestValidationReport,
} from "./tradingAiMlManifestValidationReport.js";
import {
  buildAiMlDatasetBuildDryRunManifest,
} from "./tradingAiMlDatasetBuildDryRunManifest.js";
import {
  AI_ML_CONTRACT_STATUS,
  buildAiMlFailClosedFlags,
} from "./tradingAiMlContractPrimitives.js";

const FALSE_PERMISSION_KEYS = [
  "validationExecutionAllowed",
  "manifestExecutionAllowed",
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "batchExecutionAllowed",
  "dryRunExecutionAllowed",
  "manifestFileCreationAllowed",
  "reportFileCreationAllowed",
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
  "handoffExecutionAllowed",
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

const SCENARIOS = [
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
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sourceWith(overrides = {}) {
  return {
    ...buildAiMlDatasetBuildDryRunManifest(),
    ...overrides,
  };
}

test("Step198 aggregates Step197 result without copying raw manifest request", () => {
  const source = collectManifestValidationSource();
  const report = buildAiMlManifestValidationReport({ sourceManifest: source.manifest });
  assert.equal(source.sourceStep, "step197");
  assert.equal(report.sourceManifestReference.manifestId, source.manifest.manifestId);
  assert.equal(report.sourceManifestReference.manifestVersion, source.manifest.manifestVersion);
  assert.equal(report.validationSummary.totalCheckCount, source.manifest.validationChecks.length);
  assert.equal(report.validationSummary.passCount, source.manifest.passCount);
  assert.equal(report.validationSummary.failCount, source.manifest.failCount);
  assert.equal(report.validationSummary.blockedCount, source.manifest.blockedCount);
  assert.equal(report.reportStatus.overallStatus, "validation_report_ready_execution_blocked");
  assert.equal(Object.hasOwn(report, "request"), false);
  assert.equal(Object.hasOwn(report, "rawManifestPayload"), false);
});

test("Step198 scenario A valid Step197 source creates report while execution remains denied", () => {
  const report = buildAiMlManifestValidationReport();
  assert.equal(report.reportMode, "metadata_only_non_executable");
  assert.equal(report.reportGenerationStatus, "generated_in_memory");
  assert.equal(report.sourceManifestStatus, "manifest_design_ready_execution_blocked");
  assert.equal(report.exceptionRegistryStatus, "generated_not_persisted");
  assert.equal(report.remediationQueueStatus, "generated_not_persisted");
  assert.equal(report.approvalStatus, "not_granted");
  assert.equal(report.waiverStatus, "not_granted");
  assert.equal(report.executionAuthorizationStatus, "denied");
  assert.equal(report.handoffAuthorizationStatus, "denied");
  assert.equal(report.overallStatus, "validation_report_ready_execution_blocked");
});

test("Step198 deterministic report, exception ordering, non-waivable ordering, and remediation ordering are stable", () => {
  const first = evaluateAiMlManifestValidationReport();
  const second = evaluateAiMlManifestValidationReport();
  assert.deepEqual(first, second);
  assert.deepEqual(first.scenarioCatalog, SCENARIOS);
  assert.deepEqual(first.exceptionRegistry.map((item) => item.exceptionId), [...first.exceptionRegistry.map((item) => item.exceptionId)].sort());
  assert.deepEqual(first.nonWaivableRegistry.map((item) => item.exceptionId), [...first.nonWaivableRegistry.map((item) => item.exceptionId)].sort());
  assert.deepEqual(first.remediationQueue.map((item) => item.remediationItemId), [...first.remediationQueue.map((item) => item.remediationItemId)].sort());
});

test("Step198 scenario B invalid source manifest fails closed", () => {
  const report = buildAiMlManifestValidationReport({
    sourceManifest: sourceWith({ overallStatus: "invalid_upstream_review" }),
  });
  assert.equal(report.overallStatus, "invalid_source_manifest");
});

test("Step198 scenario C source safety block is safety blocked", () => {
  const report = buildAiMlManifestValidationReport({
    sourceManifest: sourceWith({ overallStatus: "blocked_by_safety_policy" }),
  });
  assert.equal(report.overallStatus, "blocked_by_safety_policy");
});

test("Step198 scenario D source needs revision creates revision-required report", () => {
  const source = sourceWith({
    overallStatus: "manifest_needs_revision",
    validationChecks: [
      {
        checkId: "03_contract_reference_pinning",
        category: "contract_reference_pinning",
        status: "fail",
        severity: "error",
        blocking: true,
        manualReviewRequired: false,
        message: "contract version missing",
        evidence: ["datasetSpecVersion:missing"],
        remediation: "pin contract version",
      },
    ],
    passCount: 0,
    failCount: 1,
    blockedCount: 0,
    manualReviewRequiredCount: 0,
  });
  const report = buildAiMlManifestValidationReport({ sourceManifest: source });
  assert.equal(report.overallStatus, "manifest_exceptions_require_revision");
  assert.equal(report.exceptionRegistry[0].exceptionClass, "contract_revision_exception");
});

test("Step198 scenario E critical boundary exception is non-waivable and safety blocked", () => {
  const source = sourceWith({
    validationChecks: [
      {
        checkId: "14_execution_boundary",
        category: "execution_boundary",
        status: "blocked",
        severity: "critical",
        blocking: true,
        manualReviewRequired: false,
        message: "execution boundary opened",
        evidence: ["execution:opened"],
        remediation: "restore denied execution",
      },
    ],
    passCount: 0,
    failCount: 0,
    blockedCount: 1,
    manualReviewRequiredCount: 0,
  });
  const report = buildAiMlManifestValidationReport({ sourceManifest: source });
  assert.equal(report.overallStatus, "blocked_by_safety_policy");
  assert.equal(report.nonWaivableRegistry[0].waiverEligibility, "prohibited");
  assert.equal(report.nonWaivableRegistry[0].doesNotGrantApproval, true);
  assert.equal(report.nonWaivableRegistry[0].doesNotGrantExecution, true);
});

test("Step198 scenario F manual review item only remains report-ready and execution blocked", () => {
  const report = buildAiMlManifestValidationReport();
  assert.ok(report.exceptionRegistry.some((item) => item.exceptionClass === "external_authority_context"));
  assert.ok(report.exceptionRegistry.some((item) => item.manualReviewRequired === true));
  assert.equal(report.overallStatus, "validation_report_ready_execution_blocked");
  assert.equal(report.executionAuthorizationStatus, "denied");
});

test("Step198 scenario G waiver grant attempts are safety blocked", () => {
  const report = buildAiMlManifestValidationReport({
    registryOverrides: {
      exceptionOverrides: {
        "15_external_authority_context": { waiverStatus: "granted" },
      },
    },
  });
  assert.equal(report.overallStatus, "blocked_by_safety_policy");
  assert.equal(report.safetyConflict.waiverGrantedAttempt, true);
});

test("Step198 scenario H persistence attempts are safety blocked", () => {
  const report = buildAiMlManifestValidationReport({
    reportControls: {
      reportPersistenceAttempted: true,
      exceptionPersistenceAttempted: true,
      remediationPersistenceAttempted: true,
    },
  });
  assert.equal(report.overallStatus, "blocked_by_safety_policy");
  assert.equal(report.safetyConflict.persistenceEnabled, true);
});

test("Step198 scenario I ordering stays stable with shuffled source checks", () => {
  const source = buildAiMlDatasetBuildDryRunManifest();
  const shuffled = {
    ...source,
    validationChecks: [...source.validationChecks].reverse(),
  };
  const first = buildAiMlManifestValidationReport({ sourceManifest: source });
  const second = buildAiMlManifestValidationReport({ sourceManifest: shuffled });
  assert.deepEqual(first.exceptionRegistry.map((item) => item.exceptionId), second.exceptionRegistry.map((item) => item.exceptionId));
  assert.deepEqual(first.remediationQueue.map((item) => item.remediationItemId), second.remediationQueue.map((item) => item.remediationItemId));
});

test("Step198 scenario J does not mutate source object or override objects", () => {
  const source = buildAiMlDatasetBuildDryRunManifest();
  const overrides = {
    exceptionOverrides: {
      "15_external_authority_context": { dispositionStatus: "manual_review_only" },
    },
  };
  const beforeSource = JSON.stringify(source);
  const beforeOverrides = JSON.stringify(overrides);
  buildAiMlManifestValidationReport({ sourceManifest: source, registryOverrides: overrides });
  assert.equal(JSON.stringify(source), beforeSource);
  assert.equal(JSON.stringify(overrides), beforeOverrides);
});

test("Step198 scenario K redacts sensitive evidence from exception and remediation outputs", () => {
  const source = sourceWith({
    validationChecks: [
      {
        checkId: "07_logical_schema_plan",
        category: "logical_schema_plan",
        status: "fail",
        severity: "error",
        blocking: true,
        manualReviewRequired: false,
        message: "secret token C:\\private\\packet digest",
        evidence: ["api key", "bucket path", "hash value", "safe_status:blocked"],
        remediation: "remove account ID and private filesystem path",
      },
    ],
    passCount: 0,
    failCount: 1,
    blockedCount: 0,
    manualReviewRequiredCount: 0,
  });
  const report = buildAiMlManifestValidationReport({ sourceManifest: source });
  const text = JSON.stringify({
    exceptionRegistry: report.exceptionRegistry,
    remediationQueue: report.remediationQueue,
  }).toLowerCase();
  for (const forbidden of ["api key", "secret token", "c:\\private", "bucket path", "hash value", "account id", "private filesystem path"]) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }
  assert.match(text, /redacted_evidence/);
});

test("Step198 scenario L shared flag output compatibility", () => {
  const status = buildAdminTradingAiMlManifestValidationReportStatus();
  for (const key of Object.keys(STEP198_METADATA_ONLY_ALLOWED_FLAGS)) {
    assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS[key], true, key);
    assert.equal(status.flags[key], true, key);
  }
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
});

test("Step198 scenario M inherited true execution conflict is forced fail-closed", () => {
  const inheritedConflict = {
    adminReadOnlyManifestValidationReportAllowed: true,
    deterministicInMemoryReportAllowed: true,
    validationExecutionAllowed: true,
    dryRunExecutionAllowed: true,
    dbReadAllowed: true,
    providerCallsAllowed: true,
    orderSubmissionAllowed: true,
    readyForOrderSubmission: true,
    publicUiExposureAllowed: true,
    unapprovedMetadataOnlyAllowed: true,
  };
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: inheritedConflict,
    allowedMetadataFlags: STEP198_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP198_ADDITIONAL_FALSE_FLAGS,
  });
  assert.equal(flags.adminReadOnlyManifestValidationReportAllowed, true);
  assert.equal(flags.deterministicInMemoryReportAllowed, true);
  assert.equal(flags.validationExecutionAllowed, false);
  assert.equal(flags.dryRunExecutionAllowed, false);
  assert.equal(flags.dbReadAllowed, false);
  assert.equal(flags.providerCallsAllowed, false);
  assert.equal(flags.orderSubmissionAllowed, false);
  assert.equal(flags.readyForOrderSubmission, false);
  assert.equal(flags.publicUiExposureAllowed, false);
  assert.equal(Object.hasOwn(flags, "unapprovedMetadataOnlyAllowed"), false);
});

test("Step198 scenario N metadata true allowlist matches actual true flags", () => {
  const actualTrueFlags = Object.entries(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  const allowedTrueFlags = Object.keys(STEP198_METADATA_ONLY_ALLOWED_FLAGS).sort();
  assert.deepEqual(actualTrueFlags, allowedTrueFlags);
});

test("Step198 scenario O shared helper compatibility keeps deterministic registry ordering", () => {
  const source = sourceWith({
    validationChecks: [
      {
        checkId: "z_late",
        category: "logical_schema_plan",
        status: "fail",
        severity: "warning",
        evidence: ["safe z", "safe a"],
      },
      {
        checkId: "a_early",
        category: "execution_boundary",
        status: "blocked",
        severity: "critical",
        evidence: ["hash value", "safe evidence"],
      },
    ],
    passCount: 0,
    failCount: 1,
    blockedCount: 1,
    manualReviewRequiredCount: 0,
  });
  const report = buildAiMlManifestValidationReport({ sourceManifest: source });
  assert.deepEqual(report.exceptionRegistry.map((item) => item.exceptionId), [
    "step198_exception_a_early",
    "step198_exception_z_late",
  ]);
  assert.deepEqual(report.exceptionRegistry[0].evidence, ["redacted_evidence", "safe evidence"]);
  assert.deepEqual(report.exceptionRegistry[1].evidence, ["safe a", "safe z"]);
});

test("Step198 scenario P full default output remains compatible", () => {
  const report = buildAiMlManifestValidationReport();
  assert.equal(report.reportMode, AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE);
  assert.equal(report.reportGenerationStatus, AI_ML_CONTRACT_STATUS.GENERATED_IN_MEMORY);
  assert.equal(report.exceptionRegistryStatus, AI_ML_CONTRACT_STATUS.GENERATED_NOT_PERSISTED);
  assert.equal(report.remediationQueueStatus, AI_ML_CONTRACT_STATUS.GENERATED_NOT_PERSISTED);
  assert.equal(report.reportPersistenceStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(report.approvalStatus, AI_ML_CONTRACT_STATUS.NOT_GRANTED);
  assert.equal(report.executionAuthorizationStatus, AI_ML_CONTRACT_STATUS.DENIED);
  assert.equal(report.reportStatus.reportMode, "metadata_only_non_executable");
  assert.equal(report.reportStatus.reportGenerationStatus, "generated_in_memory");
  assert.equal(report.reportStatus.reportPersistenceStatus, "blocked");
  assert.equal(report.sourceManifestReference.sourceStep, "step197");
  assert.equal(report.scenarioCatalog.length, SCENARIOS.length);
});

test("Step198 scenario Q shared clone use prevents report control and override mutation", () => {
  const source = buildAiMlDatasetBuildDryRunManifest();
  const registryOverrides = {
    exceptionOverrides: {
      "15_external_authority_context": { dispositionStatus: "manual_review_only" },
    },
  };
  const reportControls = {
    requestedIntents: ["persist_report"],
  };
  const before = clone({ registryOverrides, reportControls });
  const report = buildAiMlManifestValidationReport({ sourceManifest: source, registryOverrides, reportControls });
  assert.equal(report.overallStatus, "blocked_by_safety_policy");
  assert.deepEqual({ registryOverrides, reportControls }, before);
});

test("Step198 summary, registry, non-waivable registry, and remediation helpers are deterministic", () => {
  const source = buildAiMlDatasetBuildDryRunManifest();
  const summary = buildManifestValidationSummary(source);
  const exceptions = buildManifestExceptionRegistry(source);
  const nonWaivable = buildManifestNonWaivableRegistry(exceptions);
  const queue = buildManifestRemediationQueue(exceptions);
  assert.equal(summary.sourceIntegrityStatus, "valid");
  assert.ok(exceptions.length >= 1);
  assert.ok(nonWaivable.length >= 1);
  assert.equal(queue.length, exceptions.length);
});

test("Step198 outcome precedence keeps invalid source before other states", () => {
  const outcome = deriveManifestValidationReportOutcome({
    sourceManifest: { overallStatus: "invalid_upstream_review" },
    validationSummary: { failCount: 1 },
    exceptionRegistry: [{ sourceStatus: "blocked" }],
    safetyConflict: { sourceSafetyBlocked: true, prohibitedIntents: ["execute_handoff"] },
  });
  assert.equal(outcome, "invalid_source_manifest");
});

test("Step198 prohibited report intents are safety blocked", () => {
  for (const intent of ["execute_validation", "persist_report", "grant_waiver", "execute_handoff", "run_python", "submit_order"]) {
    const report = buildAiMlManifestValidationReport({
      reportControls: { requestedIntents: [intent] },
    });
    assert.equal(report.overallStatus, "blocked_by_safety_policy", intent);
    assert.deepEqual(report.safetyConflict.prohibitedIntents, [intent]);
  }
});

test("Step198 admin status construction keeps all readiness and execution flags false", () => {
  const status = buildAdminTradingAiMlManifestValidationReportStatus();
  assert.equal(TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL.defaultStatus.reportMode, "metadata_only_non_executable");
  assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS.adminReadOnlyManifestValidationReportAllowed, true);
  assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS.deterministicInMemoryReportAllowed, true);
  assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS.deterministicExceptionClassificationAllowed, true);
  assert.equal(STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS.metadataOnlyRemediationQueueAllowed, true);
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(status[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
  for (const [key, value] of Object.entries(status.blockedConfirmation)) {
    if (key === "redacted") continue;
    if (typeof value === "boolean") assert.equal(value, false, key);
  }
});
