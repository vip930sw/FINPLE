import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP196_ADDITIONAL_FALSE_FLAGS,
  STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS,
  STEP196_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL,
  buildAdminTradingAiMlBatchContractReviewStatus,
  buildAiMlBatchContractReview,
  buildBatchContractApprovalChecklist,
  buildBatchContractReviewChecks,
  collectBatchContractUpstreamStatuses,
  createDeterministicMockBatchContractRequest,
  deriveBatchContractReviewOutcome,
  evaluateAiMlBatchContractReview,
} from "./tradingAiMlBatchContractReview.js";
import {
  AI_ML_CONTRACT_STATUS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
} from "./tradingAiMlContractPrimitives.js";

const REVIEW_CATEGORIES = [
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
];

const SCENARIOS = [
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
];

const FALSE_PERMISSION_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "batchExecutionAllowed",
  "dryRunExecutionAllowed",
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
  "manualApprovalPersistenceAllowed",
  "executionAuthorizationAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForBatchExecution",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

test("Step196 uses Step195 upstream status and Step194 preflight as source of truth", () => {
  const upstream = collectBatchContractUpstreamStatuses();
  assert.equal(upstream.readinessSummary.capabilityStage, "contract_preflight_only");
  assert.equal(upstream.readinessSummary.internalContractStatus, "documented_and_validated");
  assert.equal(upstream.readinessSummary.metadataPreflightStatus, "valid");
  assert.equal(upstream.readinessSummary.executionPermissionStatus, "blocked");
  assert.equal(upstream.readinessSummary.overallStatus, "internal_contracts_valid_execution_blocked");
  assert.equal(upstream.readinessSummary.orderAuthorityStatus, "external_blocker");
  assert.equal(upstream.readinessSummary.liveTradingStatus, "blocked");
  assert.equal(upstream.preflight.contractStatus, "valid");
});

test("Step196 scenario A review-ready metadata contract remains execution blocked", () => {
  const review = buildAiMlBatchContractReview();
  assert.equal(review.reviewStatus, "metadata_only_batch_contract_review");
  assert.equal(review.reviewEligibilityStatus, "eligible_for_manual_review");
  assert.equal(review.approvalStatus, "not_granted");
  assert.equal(review.approvalScope, "dry_run_manifest_design_only");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.executionAuthorizationStatus, "denied");
  assert.equal(review.batchExecutionStatus, "blocked");
  assert.equal(review.outputCreationStatus, "blocked");
  assert.equal(review.overallStatus, "review_ready_execution_blocked");
});

test("Step196 deterministic output, check ordering, and checklist ordering are stable", () => {
  const first = evaluateAiMlBatchContractReview();
  const second = evaluateAiMlBatchContractReview();
  assert.deepEqual(first, second);
  assert.deepEqual(first.reviewCategories, REVIEW_CATEGORIES);
  assert.deepEqual(first.scenarioCatalog, SCENARIOS);
  assert.deepEqual(first.reviewChecks.map((check) => check.checkId), [...first.reviewChecks.map((check) => check.checkId)].sort());
  assert.deepEqual(first.approvalChecklist.map((item) => item.checklistItemId), [...first.approvalChecklist.map((item) => item.checklistItemId)].sort());
});

test("Step196 scenario B invalid upstream readiness fails closed", () => {
  const review = buildAiMlBatchContractReview({
    readinessSummaryOverrides: {
      overallStatus: "invalid_internal_contract",
      internalContractStatus: "invalid",
    },
  });
  assert.equal(review.reviewEligibilityStatus, "not_eligible");
  assert.equal(review.overallStatus, "invalid_upstream_contract");
});

test("Step196 scenario C missing version pin needs revision", () => {
  const review = buildAiMlBatchContractReview({
    requestOverrides: {
      featureSetReference: { featureSetVersion: "" },
    },
  });
  assert.equal(review.overallStatus, "contract_needs_revision");
  assert.ok(review.reviewChecks.some((check) => check.category === "version_pinning" && check.status === "fail"));
});

test("Step196 scenario D prohibited output intent is safety blocked", () => {
  const review = buildAiMlBatchContractReview({
    requestOverrides: {
      outputPlanDeclaration: { requestedOutputIntents: ["create_csv"] },
    },
  });
  assert.equal(review.executionAuthorizationStatus, "denied");
  assert.equal(review.overallStatus, "blocked_by_safety_policy");
});

test("Step196 scenario E provider or DB intent is safety blocked", () => {
  for (const action of ["query_provider", "query_kis", "read_database", "write_database"]) {
    const review = buildAiMlBatchContractReview({
      requestOverrides: {
        executionIntent: { requestedActions: [action] },
      },
    });
    assert.equal(review.overallStatus, "blocked_by_safety_policy", action);
    assert.equal(review.executionAuthorizationStatus, "denied");
  }
});

test("Step196 scenario F missing required reviewer needs revision", () => {
  const review = buildAiMlBatchContractReview({
    requestOverrides: {
      ownershipAndReview: { finalManualReviewer: "" },
    },
  });
  assert.equal(review.overallStatus, "contract_needs_revision");
  assert.ok(review.approvalChecklist.some((item) => item.role === "finalManualReviewer" && item.status === "missing"));
});

test("Step196 scenario G invalid partition declaration needs revision", () => {
  const review = buildAiMlBatchContractReview({
    requestOverrides: {
      partitionPlanDeclaration: {
        declaredUniqueKeys: [],
        partitionOverlapPolicy: "",
      },
    },
  });
  assert.equal(review.overallStatus, "contract_needs_revision");
  assert.ok(review.reviewChecks.some((check) => check.category === "partition_plan" && check.status === "fail"));
});

test("Step196 scenario H external order authority blocker stays separate", () => {
  const review = buildAiMlBatchContractReview();
  assert.equal(review.externalAuthorityStatus, "external_blocker");
  assert.equal(review.liveTradingStatus, "blocked");
  assert.equal(review.reviewEligibilityStatus, "eligible_for_manual_review");
  assert.equal(review.executionAuthorizationStatus, "denied");
});

test("Step196 scenario I deterministic ordering survives shuffled source declarations", () => {
  const request = createDeterministicMockBatchContractRequest();
  const reversed = createDeterministicMockBatchContractRequest({
    inputSourceDeclarations: [...request.inputSourceDeclarations].reverse(),
  });
  const firstChecks = buildBatchContractReviewChecks(request);
  const secondChecks = buildBatchContractReviewChecks(reversed);
  assert.deepEqual(firstChecks.map((check) => check.checkId), secondChecks.map((check) => check.checkId));
  assert.deepEqual(firstChecks.map((check) => check.category), secondChecks.map((check) => check.category));
});

test("Step196 scenario J does not mutate source or request override objects", () => {
  const requestOverrides = {
    resourceBudgetDeclaration: { declaredMaxRows: 1000 },
  };
  const readinessSummaryOverrides = {
    nextSafeImplementationStep: "dry_run_manifest_contract_design",
  };
  const beforeRequest = JSON.stringify(requestOverrides);
  const beforeSummary = JSON.stringify(readinessSummaryOverrides);
  buildAiMlBatchContractReview({ requestOverrides, readinessSummaryOverrides });
  assert.equal(JSON.stringify(requestOverrides), beforeRequest);
  assert.equal(JSON.stringify(readinessSummaryOverrides), beforeSummary);
});

test("Step196 helper outcome preserves fail-closed precedence", () => {
  const checks = buildBatchContractReviewChecks(createDeterministicMockBatchContractRequest());
  assert.equal(deriveBatchContractReviewOutcome(checks), "review_ready_execution_blocked");
  const blocked = checks.map((check) => check.category === "prohibited_execution_intent" ? { ...check, status: "blocked" } : check);
  assert.equal(deriveBatchContractReviewOutcome(blocked), "blocked_by_safety_policy");
});

test("Step196 valid contract does not grant approval, execution, output, or readiness", () => {
  const status = buildAdminTradingAiMlBatchContractReviewStatus();
  assert.equal(status.batchContractReviewModel, TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL);
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(status[key], false, `${key} must remain false`);
    assert.equal(status.flags[key], false, `flags.${key} must remain false`);
  }
  assert.equal(STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS.batchExecutionAllowed, false);
  assert.equal(status.review.approvalStatus, "not_granted");
  assert.equal(status.review.executionAuthorizationStatus, "denied");
  assert.equal(status.review.outputCreationStatus, "blocked");
});

test("Step196 approval checklist is declared but not persisted", () => {
  const request = createDeterministicMockBatchContractRequest();
  const checklist = buildBatchContractApprovalChecklist(request);
  assert.equal(checklist.length, 8);
  assert.ok(checklist.every((item) => item.status === "declared"));
  assert.ok(checklist.every((item) => item.scope === "dry_run_manifest_design_only"));
});

test("Step196 admin status excludes sensitive values and artifact paths", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlBatchContractReviewStatus()).toLowerCase();
  for (const forbidden of ["api key", "secret", "token value", "credential value", "account id", "raw provider response", "environment variable value", "private filesystem path", "output artifact path", "dataset file path", "hash value", "digest value"]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must not be exposed`);
  }
});

test("Step196 scenario K shared flag compatibility preserves metadata true and protected false flags", () => {
  const status = buildAdminTradingAiMlBatchContractReviewStatus();
  for (const key of Object.keys(STEP196_METADATA_ONLY_ALLOWED_FLAGS)) {
    assert.equal(STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS[key], true, key);
    assert.equal(status.flags[key], true, key);
  }
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
});

test("Step196 scenario L inherited true execution conflict is forced false", () => {
  const inheritedConflict = {
    adminReadOnlyBatchContractReviewAllowed: true,
    deterministicMetadataChecklistAllowed: true,
    batchExecutionAllowed: true,
    datasetBuildAllowed: true,
    dbReadAllowed: true,
    providerCallsAllowed: true,
    kisCallsAllowed: true,
    modelTrainingAllowed: true,
    orderSubmissionAllowed: true,
    liveTradingAllowed: true,
    readyForBatchExecution: true,
    readyForOrderSubmission: true,
    unknownRuntimePermissionAllowed: true,
  };
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: inheritedConflict,
    allowedMetadataFlags: STEP196_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP196_ADDITIONAL_FALSE_FLAGS,
  });
  assert.equal(flags.adminReadOnlyBatchContractReviewAllowed, true);
  assert.equal(flags.deterministicMetadataChecklistAllowed, true);
  for (const key of [
    "batchExecutionAllowed",
    "datasetBuildAllowed",
    "dbReadAllowed",
    "providerCallsAllowed",
    "kisCallsAllowed",
    "modelTrainingAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForBatchExecution",
    "readyForOrderSubmission",
  ]) {
    assert.equal(flags[key], false, key);
  }
  assert.equal(Object.hasOwn(flags, "unknownRuntimePermissionAllowed"), false);
});

test("Step196 scenario M explicit metadata allowlist exactly matches true flags", () => {
  const actualTrueFlags = Object.entries(STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  assert.deepEqual(actualTrueFlags, Object.keys(STEP196_METADATA_ONLY_ALLOWED_FLAGS).sort());
});

test("Step196 scenario N shared helper compatibility keeps ordering and redaction deterministic", () => {
  const request = createDeterministicMockBatchContractRequest();
  const mutated = cloneAiMlMetadata(request);
  mutated.inputSourceDeclarations = [...mutated.inputSourceDeclarations].reverse();
  mutated.inputSourceDeclarations.push({
    sourceId: "secret token source",
    sourceType: "private path",
    sourceContractVersion: "latest",
    eventTimeField: "",
    availableAtField: "",
    accessStatus: "open",
  });
  const checks = buildBatchContractReviewChecks(mutated);
  assert.deepEqual(checks.map((check) => check.checkId), [...checks.map((check) => check.checkId)].sort());
  assert.equal(JSON.stringify(checks).includes("secret token source"), false);
  assert.match(JSON.stringify(checks), /redacted_metadata/);
});

test("Step196 scenario O full default output remains compatible", () => {
  const review = buildAiMlBatchContractReview();
  assert.equal(review.reviewStatus, "metadata_only_batch_contract_review");
  assert.equal(review.reviewEligibilityStatus, "eligible_for_manual_review");
  assert.equal(review.approvalStatus, AI_ML_CONTRACT_STATUS.NOT_GRANTED);
  assert.equal(review.approvalScope, "dry_run_manifest_design_only");
  assert.equal(review.executionAuthorizationStatus, AI_ML_CONTRACT_STATUS.DENIED);
  assert.equal(review.batchExecutionStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(review.outputCreationStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(review.overallStatus, "review_ready_execution_blocked");
  assert.equal(review.reviewChecks.length, REVIEW_CATEGORIES.length);
  assert.equal(review.approvalChecklist.length, 8);
  assert.equal(review.scenarioCatalog.length, SCENARIOS.length);
  assert.equal(review.reviewId, "step196_ai_ml_batch_contract_review");
});

test("Step196 scenario P shared clone use prevents source, overrides, and controls mutation", () => {
  const request = createDeterministicMockBatchContractRequest();
  const requestOverrides = {
    resourceBudgetDeclaration: { declaredMaxRows: 1000 },
    executionIntent: { requestedActions: ["create_csv"] },
  };
  const readinessSummaryOverrides = {
    overallStatus: "invalid_internal_contract",
  };
  const controls = {
    dryRunExecutionAllowed: true,
  };
  const before = cloneAiMlMetadata({ request, requestOverrides, readinessSummaryOverrides, controls });
  const review = buildAiMlBatchContractReview({ request, requestOverrides, readinessSummaryOverrides, controls });
  assert.equal(review.overallStatus, "invalid_upstream_contract");
  assert.deepEqual({ request, requestOverrides, readinessSummaryOverrides, controls }, before);
});
