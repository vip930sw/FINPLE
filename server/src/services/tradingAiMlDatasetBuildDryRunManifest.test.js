import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP197_ADDITIONAL_FALSE_FLAGS,
  STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS,
  STEP197_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL,
  buildAdminTradingAiMlDatasetBuildDryRunManifestStatus,
  buildAiMlDatasetBuildDryRunManifest,
  buildDatasetBuildManifestSections,
  buildDatasetBuildManifestValidationChecks,
  collectDatasetBuildManifestUpstreamStatuses,
  createDeterministicMockDatasetBuildManifestRequest,
  deriveDatasetBuildManifestOutcome,
  evaluateAiMlDatasetBuildDryRunManifest,
} from "./tradingAiMlDatasetBuildDryRunManifest.js";
import {
  AI_ML_CONTRACT_STATUS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
} from "./tradingAiMlContractPrimitives.js";

const MANIFEST_SECTIONS = [
  "manifestIdentity",
  "upstreamReviewReference",
  "datasetContractReference",
  "featureSetReference",
  "labelSpecReference",
  "splitPolicyReference",
  "normalizationPolicyReference",
  "qualityPolicyReference",
  "sourceMappingReference",
  "logicalInputInventory",
  "temporalBoundaryPlan",
  "logicalPartitionPlan",
  "logicalSchemaPlan",
  "logicalOutputPlan",
  "qualityValidationPlan",
  "lineagePlan",
  "governanceAndRetentionPlan",
  "resourceEnvelope",
  "reviewReceiptRequest",
  "executionIntent",
];

const VALIDATION_CATEGORIES = [
  "upstream_batch_contract_review",
  "manifest_identity",
  "contract_reference_pinning",
  "logical_input_inventory",
  "temporal_boundary_plan",
  "logical_partition_plan",
  "logical_schema_plan",
  "logical_output_restrictions",
  "quality_validation_plan",
  "lineage_plan",
  "governance_and_retention",
  "resource_envelope",
  "review_receipt_boundary",
  "execution_boundary",
  "external_authority_context",
  "prohibited_execution_intent",
];

const SCENARIOS = [
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
];

const FALSE_PERMISSION_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "batchExecutionAllowed",
  "dryRunExecutionAllowed",
  "manifestFileCreationAllowed",
  "schemaMaterializationAllowed",
  "partitionMaterializationAllowed",
  "outputPathAssignmentAllowed",
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
  "manualApprovalPersistenceAllowed",
  "reviewReceiptPersistenceAllowed",
  "executionAuthorizationAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
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

function clone(value) {
  return cloneAiMlMetadata(value);
}

function categoryStatus(manifest, category) {
  return manifest.validationChecks.find((check) => check.category === category)?.status;
}

test("Step197 uses Step196 and Step195 upstream status as the manifest source of truth", () => {
  const upstream = collectDatasetBuildManifestUpstreamStatuses();
  assert.equal(upstream.batchContractReview.overallStatus, "review_ready_execution_blocked");
  assert.equal(upstream.batchContractReview.reviewEligibilityStatus, "eligible_for_manual_review");
  assert.equal(upstream.batchContractReview.approvalStatus, "not_granted");
  assert.equal(upstream.batchContractReview.executionAuthorizationStatus, "denied");
  assert.equal(upstream.batchContractReview.batchExecutionStatus, "blocked");
  assert.equal(upstream.readinessSummary.overallStatus, "internal_contracts_valid_execution_blocked");
  assert.equal(upstream.readinessSummary.orderAuthorityStatus, "external_blocker");
  assert.equal(upstream.readinessSummary.liveTradingStatus, "blocked");
});

test("Step197 scenario A valid manifest design is ready while execution stays blocked", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest();
  assert.equal(manifest.manifestMode, "metadata_only_non_executable");
  assert.equal(manifest.manifestDesignStatus, "complete");
  assert.equal(manifest.reviewReceiptStatus, "generated_not_persisted");
  assert.equal(manifest.reviewDecision, "design_contract_record_only");
  assert.equal(manifest.approvalStatus, "not_granted");
  assert.equal(manifest.approvalScope, "dry_run_manifest_design_only");
  assert.equal(manifest.executionAuthorizationStatus, "denied");
  assert.equal(manifest.dryRunExecutionStatus, "blocked");
  assert.equal(manifest.materializationStatus, "blocked");
  assert.equal(manifest.outputCreationStatus, "blocked");
  assert.equal(manifest.outputPathStatus, "not_assigned");
  assert.equal(manifest.overallStatus, "manifest_design_ready_execution_blocked");
});

test("Step197 deterministic output, sections, categories, and scenario catalog are stable", () => {
  const first = evaluateAiMlDatasetBuildDryRunManifest();
  const second = evaluateAiMlDatasetBuildDryRunManifest();
  assert.deepEqual(first, second);
  assert.deepEqual(first.manifestSections.map((section) => section.sectionId), MANIFEST_SECTIONS);
  assert.deepEqual(first.validationCategories, VALIDATION_CATEGORIES);
  assert.deepEqual(first.scenarioCatalog, SCENARIOS);
  assert.deepEqual(first.validationChecks.map((check) => check.checkId), [...first.validationChecks.map((check) => check.checkId)].sort());
});

test("Step197 scenario B invalid upstream review fails before manifest approval", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    batchContractReviewOverrides: {
      overallStatus: "contract_needs_revision",
      reviewEligibilityStatus: "not_eligible",
    },
  });
  assert.equal(manifest.overallStatus, "invalid_upstream_review");
  assert.equal(categoryStatus(manifest, "upstream_batch_contract_review"), "fail");
});

test("Step197 scenario C missing contract version needs manifest revision", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    requestOverrides: {
      datasetContractReference: { datasetSpecVersion: "" },
    },
  });
  assert.equal(manifest.overallStatus, "manifest_needs_revision");
  assert.equal(categoryStatus(manifest, "contract_reference_pinning"), "fail");
});

test("Step197 scenario D prohibited file materialization is safety blocked", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    requestOverrides: {
      logicalOutputPlan: {
        materializationStatus: "materialized",
        outputCreationStatus: "created",
        outputPathStatus: "assigned",
      },
      executionIntent: { requestedActions: ["create_manifest_file"] },
    },
  });
  assert.equal(manifest.overallStatus, "blocked_by_safety_policy");
  assert.equal(categoryStatus(manifest, "logical_output_restrictions"), "blocked");
  assert.equal(categoryStatus(manifest, "prohibited_execution_intent"), "blocked");
});

test("Step197 scenario E provider, KIS, DB, and Python intents are safety blocked", () => {
  for (const action of ["query_provider", "query_kis", "issue_kis_token", "read_database", "write_database", "run_python"]) {
    const manifest = buildAiMlDatasetBuildDryRunManifest({
      requestOverrides: {
        executionIntent: { requestedActions: [action] },
      },
    });
    assert.equal(manifest.overallStatus, "blocked_by_safety_policy", action);
    assert.equal(categoryStatus(manifest, "prohibited_execution_intent"), "blocked", action);
    assert.equal(manifest.executionAuthorizationStatus, "denied");
  }
});

test("Step197 scenario F invalid temporal boundary needs revision", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    requestOverrides: {
      temporalBoundaryPlan: {
        labelStartTime: "2026-01-01T00:00:00Z",
      },
    },
  });
  assert.equal(manifest.overallStatus, "manifest_needs_revision");
  assert.equal(categoryStatus(manifest, "temporal_boundary_plan"), "fail");
});

test("Step197 scenario G invalid partition plan needs revision", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    requestOverrides: {
      logicalPartitionPlan: {
        declaredUniqueKeys: [],
        partitionOverlapPolicy: "",
      },
    },
  });
  assert.equal(manifest.overallStatus, "manifest_needs_revision");
  assert.equal(categoryStatus(manifest, "logical_partition_plan"), "fail");
});

test("Step197 scenario H invalid logical schema needs revision", () => {
  const request = createDeterministicMockDatasetBuildManifestRequest();
  const mutated = clone(request);
  mutated.logicalSchemaPlan.primaryKeyFields = [];
  mutated.logicalSchemaPlan.fieldDefinitions.push({
    fieldName: "return_20d",
    semanticRole: "feature",
    sourceReference: "labelSpecReference",
  });
  const manifest = buildAiMlDatasetBuildDryRunManifest({ request: mutated });
  assert.equal(manifest.overallStatus, "manifest_needs_revision");
  assert.equal(categoryStatus(manifest, "logical_schema_plan"), "fail");
});

test("Step197 scenario I receipt attempts approval, persistence, or execution authority are safety blocked", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest({
    requestOverrides: {
      reviewReceiptRequest: {
        approvalStatus: "approved",
        executionAuthorizationStatus: "granted",
        persisted: true,
        downloadable: true,
        doesNotGrantApproval: false,
        doesNotGrantExecution: false,
      },
    },
  });
  assert.equal(manifest.overallStatus, "blocked_by_safety_policy");
  assert.equal(categoryStatus(manifest, "review_receipt_boundary"), "blocked");
  assert.equal(manifest.reviewReceipt.approvalStatus, "not_granted");
  assert.equal(manifest.reviewReceipt.executionAuthorizationStatus, "denied");
  assert.equal(manifest.reviewReceipt.persisted, false);
  assert.equal(manifest.reviewReceipt.downloadable, false);
});

test("Step197 scenario J external order authority blocker stays separate", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest();
  assert.equal(manifest.externalAuthorityStatus, "external_blocker");
  assert.equal(manifest.liveTradingStatus, "blocked");
  assert.equal(categoryStatus(manifest, "external_authority_context"), "manual_review_required");
  assert.equal(manifest.overallStatus, "manifest_design_ready_execution_blocked");
});

test("Step197 scenario K deterministic ordering survives shuffled schema and inputs", () => {
  const request = createDeterministicMockDatasetBuildManifestRequest();
  const shuffled = createDeterministicMockDatasetBuildManifestRequest({
    logicalInputInventory: [...request.logicalInputInventory].reverse(),
    logicalSchemaPlan: {
      fieldDefinitions: [...request.logicalSchemaPlan.fieldDefinitions].reverse(),
    },
  });
  const firstSections = buildDatasetBuildManifestSections(request);
  const secondSections = buildDatasetBuildManifestSections(shuffled);
  const firstChecks = buildDatasetBuildManifestValidationChecks(request);
  const secondChecks = buildDatasetBuildManifestValidationChecks(shuffled);
  assert.deepEqual(firstSections.map((section) => section.sectionId), secondSections.map((section) => section.sectionId));
  assert.deepEqual(firstChecks.map((check) => check.checkId), secondChecks.map((check) => check.checkId));
  assert.deepEqual(firstChecks.map((check) => check.category), secondChecks.map((check) => check.category));
});

test("Step197 scenario L does not mutate source request or override objects", () => {
  const request = createDeterministicMockDatasetBuildManifestRequest();
  const overrides = {
    resourceEnvelope: { declaredMaxRows: 2500 },
  };
  const beforeRequest = JSON.stringify(request);
  const beforeOverrides = JSON.stringify(overrides);
  buildAiMlDatasetBuildDryRunManifest({ request, requestOverrides: overrides });
  assert.equal(JSON.stringify(request), beforeRequest);
  assert.equal(JSON.stringify(overrides), beforeOverrides);
});

test("Step197 scenario M shared flag output compatibility preserves true and protected false flags", () => {
  const status = buildAdminTradingAiMlDatasetBuildDryRunManifestStatus();
  for (const key of Object.keys(STEP197_METADATA_ONLY_ALLOWED_FLAGS)) {
    assert.equal(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS[key], true, key);
    assert.equal(status.flags[key], true, key);
  }
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
});

test("Step197 scenario N inherited true execution conflict is forced false", () => {
  const inheritedConflict = {
    adminReadOnlyManifestDesignAllowed: true,
    deterministicInMemoryManifestAllowed: true,
    dryRunExecutionAllowed: true,
    datasetBuildAllowed: true,
    schemaMaterializationAllowed: true,
    dbReadAllowed: true,
    providerCallsAllowed: true,
    kisCallsAllowed: true,
    orderSubmissionAllowed: true,
    liveTradingAllowed: true,
    readyForDryRunExecution: true,
    unknownRuntimePermissionAllowed: true,
  };
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: inheritedConflict,
    allowedMetadataFlags: STEP197_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP197_ADDITIONAL_FALSE_FLAGS,
  });
  assert.equal(flags.adminReadOnlyManifestDesignAllowed, true);
  assert.equal(flags.deterministicInMemoryManifestAllowed, true);
  for (const key of [
    "dryRunExecutionAllowed",
    "datasetBuildAllowed",
    "schemaMaterializationAllowed",
    "dbReadAllowed",
    "providerCallsAllowed",
    "kisCallsAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForDryRunExecution",
  ]) {
    assert.equal(flags[key], false, key);
  }
  assert.equal(Object.hasOwn(flags, "unknownRuntimePermissionAllowed"), false);
});

test("Step197 scenario O metadata true allowlist exactly matches actual true flags", () => {
  const actualTrueFlags = Object.entries(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  assert.deepEqual(actualTrueFlags, Object.keys(STEP197_METADATA_ONLY_ALLOWED_FLAGS).sort());
});

test("Step197 scenario P shared helper compatibility keeps ordering and redaction deterministic", () => {
  const request = createDeterministicMockDatasetBuildManifestRequest();
  const mutated = clone(request);
  mutated.logicalInputInventory = [...mutated.logicalInputInventory].reverse();
  mutated.qualityValidationPlan = [...mutated.qualityValidationPlan].reverse();
  mutated.logicalSchemaPlan.fieldDefinitions.push({
    fieldName: "secret_token",
    semanticRole: "metadata",
    sourceReference: "private path",
  });
  const checks = buildDatasetBuildManifestValidationChecks(mutated);
  assert.deepEqual(checks.map((check) => check.checkId), [...checks.map((check) => check.checkId)].sort());
  assert.equal(categoryStatus({ validationChecks: checks }, "logical_schema_plan"), "fail");
  assert.equal(JSON.stringify(checks).includes("secret_token"), false);
  assert.match(JSON.stringify(checks), /redacted_metadata|schema_invalid/);
});

test("Step197 scenario Q full default output remains compatible", () => {
  const manifest = buildAiMlDatasetBuildDryRunManifest();
  assert.equal(manifest.manifestMode, AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE);
  assert.equal(manifest.reviewReceiptStatus, AI_ML_CONTRACT_STATUS.GENERATED_NOT_PERSISTED);
  assert.equal(manifest.approvalStatus, AI_ML_CONTRACT_STATUS.NOT_GRANTED);
  assert.equal(manifest.executionAuthorizationStatus, AI_ML_CONTRACT_STATUS.DENIED);
  assert.equal(manifest.dryRunExecutionStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(manifest.materializationStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(manifest.outputPathStatus, AI_ML_CONTRACT_STATUS.NOT_ASSIGNED);
  assert.equal(manifest.reviewDecision, "design_contract_record_only");
  assert.equal(manifest.approvalScope, "dry_run_manifest_design_only");
  assert.equal(manifest.scenarioCatalog.length, SCENARIOS.length);
  assert.equal(manifest.manifestSections.length, MANIFEST_SECTIONS.length);
  assert.equal(manifest.validationCategories.length, VALIDATION_CATEGORIES.length);
});

test("Step197 scenario R shared clone use prevents source, overrides, and controls mutation", () => {
  const request = createDeterministicMockDatasetBuildManifestRequest();
  const requestOverrides = {
    resourceEnvelope: { declaredMaxRows: 2500 },
    reviewReceiptRequest: { persisted: true },
    executionIntent: { requestedActions: ["create_manifest_file"] },
  };
  const batchContractReviewOverrides = {
    overallStatus: "contract_needs_revision",
  };
  const before = clone({ request, requestOverrides, batchContractReviewOverrides });
  const manifest = buildAiMlDatasetBuildDryRunManifest({ request, requestOverrides, batchContractReviewOverrides });
  assert.equal(manifest.overallStatus, "invalid_upstream_review");
  assert.deepEqual({ request, requestOverrides, batchContractReviewOverrides }, before);
});

test("Step197 admin status exposes only read-only allowed flags and false execution readiness", () => {
  const status = buildAdminTradingAiMlDatasetBuildDryRunManifestStatus();
  assert.equal(TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL.manifestMode, "metadata_only_non_executable");
  assert.equal(status.status, "admin_only_ai_ml_dataset_build_dry_run_manifest_read_only");
  assert.equal(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS.adminReadOnlyManifestDesignAllowed, true);
  assert.equal(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS.deterministicInMemoryManifestAllowed, true);
  assert.equal(STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS.metadataOnlyReviewReceiptAllowed, true);
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(status[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
  for (const [key, value] of Object.entries(status.blockedConfirmation)) {
    if (key === "redacted") continue;
    if (typeof value === "boolean") assert.equal(value, false);
  }
});

test("Step197 outcome precedence preserves invalid upstream before other revisions", () => {
  const checks = buildDatasetBuildManifestValidationChecks(
    createDeterministicMockDatasetBuildManifestRequest({
      datasetContractReference: { datasetSpecVersion: "" },
    }),
    collectDatasetBuildManifestUpstreamStatuses({
      batchContractReviewOverrides: { overallStatus: "contract_needs_revision" },
    }),
  );
  assert.equal(deriveDatasetBuildManifestOutcome(checks), "invalid_upstream_review");
});
