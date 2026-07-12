import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS,
  TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL,
  buildAdminTradingAiMlArchitectureMilestoneStatus,
  buildAiMlArchitectureMilestoneReview,
  buildAiMlMilestoneConsolidationPlan,
  buildAiMlMilestoneDependencyReview,
  buildAiMlMilestoneMaintenanceFindings,
  buildAiMlMilestoneRuntimePrerequisites,
  buildAiMlMilestoneSafetyReview,
  collectAiMlMilestoneStageInventory,
  deriveAiMlMilestoneOutcome,
  evaluateAiMlArchitectureMilestoneReview,
} from "./tradingAiMlArchitectureMilestoneReview.js";

const REQUIRED_STAGE_IDS = [
  "step191_strategy_management",
  "step192_dataset_labeling_architecture",
  "step193_feature_pipeline_architecture",
  "step194_feature_pipeline_preflight",
  "step195_readiness_gate_summary",
  "step196_batch_contract_review",
  "step197_dataset_build_manifest",
  "step198_manifest_validation_report",
  "step199_manifest_handoff_eligibility",
];

const FALSE_PERMISSION_KEYS = [
  "architectureMutationAllowed",
  "automaticRefactorAllowed",
  "contractMigrationAllowed",
  "handoffExecutionAllowed",
  "targetPreflightExecutionAllowed",
  "validationExecutionAllowed",
  "manifestExecutionAllowed",
  "dryRunExecutionAllowed",
  "datasetBuildAllowed",
  "modelTrainingAllowed",
  "providerCallsAllowed",
  "kisCallsAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

test("Step200 scenario A current Step 191 to Step 199 chain completes milestone while execution stays blocked", () => {
  const review = buildAiMlArchitectureMilestoneReview();
  assert.equal(review.milestoneId, "step200_ai_ml_architecture_milestone");
  assert.equal(review.milestoneScope, "step191_to_step199");
  assert.equal(review.architectureChainStatus, "contract_chain_complete");
  assert.equal(review.safetyBoundaryStatus, "fail_closed_consistent");
  assert.equal(review.runtimeCapabilityStatus, "not_implemented");
  assert.equal(review.actualDataCapabilityStatus, "blocked");
  assert.equal(review.executionReadinessStatus, "blocked");
  assert.equal(review.maintenanceReviewStatus, "consolidation_required");
  assert.equal(review.nextPhaseDecision, "consolidate_before_runtime");
  assert.equal(review.overallStatus, "architecture_milestone_complete_execution_blocked");
  assert.deepEqual(review.stageInventory.map((stage) => stage.stageId), REQUIRED_STAGE_IDS);
});

test("Step200 inventory exposes deterministic admin-only stage metadata", () => {
  const inventory = collectAiMlMilestoneStageInventory();
  assert.equal(inventory.length, 9);
  for (const stage of inventory) {
    assert.equal(stage.executionCapability, "blocked");
    assert.equal(stage.persistenceCapability, "blocked");
    assert.equal(stage.publicExposure, "admin_only");
    assert.ok(stage.servicePath.startsWith("server/src/services/"));
    assert.ok(stage.panelKey.startsWith("ai-ml-"));
    assert.equal(stage.modelReferencePresent, true);
  }
});

test("Step200 dependency review passes the current chain", () => {
  const inventory = collectAiMlMilestoneStageInventory();
  const dependencyReview = buildAiMlMilestoneDependencyReview(inventory);
  assert.ok(dependencyReview.every((item) => item.status === "pass"));
  assert.equal(deriveAiMlMilestoneOutcome({ dependencyReview, safetyReview: buildAiMlMilestoneSafetyReview(inventory) }), "architecture_milestone_complete_execution_blocked");
});

test("Step200 safety review keeps execution and readiness false", () => {
  const safetyReview = buildAiMlMilestoneSafetyReview(collectAiMlMilestoneStageInventory());
  assert.ok(safetyReview.every((item) => item.status === "pass"));
  for (const key of FALSE_PERMISSION_KEYS) {
    assert.equal(STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS[key], false, `${key} must stay false`);
  }
  assert.equal(STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS.adminReadOnlyMilestoneReviewAllowed, true);
  assert.equal(STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS.deterministicArchitectureInventoryAllowed, true);
});

test("Step200 maintenance findings include the required consolidation risks", () => {
  const findings = buildAiMlMilestoneMaintenanceFindings();
  const categories = findings.map((finding) => finding.category);
  for (const category of [
    "repeated_safety_flags",
    "repeated_status_vocabulary",
    "repeated_redaction_logic",
    "service_responsibility_growth",
    "checker_chain_growth",
    "admin_ui_density",
    "runtime_gap",
    "external_authority_gap",
  ]) {
    assert.ok(categories.includes(category), `${category} finding is required`);
  }
  assert.ok(findings.some((finding) => finding.severity === "high" && finding.category === "runtime_gap"));
});

test("Step200 consolidation plan is deterministic and not started", () => {
  const plan = buildAiMlMilestoneConsolidationPlan();
  assert.deepEqual(plan.map((item) => item.priority), [1, 2, 3, 4, 5]);
  assert.deepEqual(plan.map((item) => item.executionStatus), ["not_started", "not_started", "not_started", "not_started", "not_started"]);
  assert.equal(plan[0].planItemId, "step200_plan_01_shared_contract_primitives");
});

test("Step200 runtime prerequisite registry is complete but not approved", () => {
  const prerequisites = buildAiMlMilestoneRuntimePrerequisites();
  assert.equal(prerequisites.length, 18);
  assert.ok(prerequisites.some((item) => item.prerequisiteId === "order_authority_external_clearance" && item.status === "external_blocker"));
  assert.ok(prerequisites.every((item) => item.status !== "approved" && item.status !== "complete"));
  assert.ok(prerequisites.every((item) => item.blocking === true));
});

test("Step200 scenario B missing stage is invalid source", () => {
  const review = buildAiMlArchitectureMilestoneReview({ omitStageIds: ["step198_manifest_validation_report"] });
  assert.equal(review.overallStatus, "invalid_milestone_source");
});

test("Step200 scenario C dependency order conflict requires revision", () => {
  const review = buildAiMlArchitectureMilestoneReview({
    stageOverrides: {
      step196_batch_contract_review: {
        dependsOnStepIds: ["step199_manifest_handoff_eligibility"],
      },
    },
  });
  assert.equal(review.overallStatus, "milestone_review_requires_revision");
});

test("Step200 scenario D safety permission conflict is blocked", () => {
  const review = buildAiMlArchitectureMilestoneReview({
    permissionOverrides: { providerCallsAllowed: true },
  });
  assert.equal(review.safetyBoundaryStatus, "inconsistent");
  assert.equal(review.overallStatus, "blocked_by_safety_policy");
});

test("Step200 scenario E public exposure conflict is blocked", () => {
  const review = buildAiMlArchitectureMilestoneReview({
    stageOverrides: {
      step195_readiness_gate_summary: { publicExposure: "mypage" },
    },
  });
  assert.equal(review.overallStatus, "blocked_by_safety_policy");
});

test("Step200 scenario F runtime falsely marked implemented requires revision", () => {
  const review = buildAiMlArchitectureMilestoneReview({ runtimeCapabilityStatus: "implemented" });
  assert.equal(review.overallStatus, "milestone_review_requires_revision");
});

test("Step200 scenarios G through I keep coverage and ordering deterministic", () => {
  const first = evaluateAiMlArchitectureMilestoneReview();
  const second = evaluateAiMlArchitectureMilestoneReview({
    preserveInputOrder: false,
  });
  assert.deepEqual(first.stageInventory.map((stage) => stage.stageId), second.stageInventory.map((stage) => stage.stageId));
  assert.equal(first.consolidationPlanCount, 5);
  assert.equal(first.runtimePrerequisiteCount, 18);
  assert.deepEqual(first.scenarioCatalog, [
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
});

test("Step200 scenario J does not mutate source object", () => {
  const source = {
    stageOverrides: {
      step199_manifest_handoff_eligibility: { primaryResponsibility: "review" },
    },
    permissionOverrides: { providerCallsAllowed: false },
  };
  const before = JSON.stringify(source);
  buildAiMlArchitectureMilestoneReview(source);
  assert.equal(JSON.stringify(source), before);
});

test("Step200 scenario K redacts sensitive input values", () => {
  const review = buildAiMlArchitectureMilestoneReview({
    stageOverrides: {
      step191_strategy_management: {
        servicePath: "C:\\private\\owner\\artifact path",
        sourceOfTruth: "hash digest account ID secret",
      },
    },
  });
  const serialized = JSON.stringify(review);
  assert.doesNotMatch(serialized, /C:\\private/i);
  assert.doesNotMatch(serialized, /account ID secret/i);
  assert.match(serialized, /redacted_metadata/);
});

test("Step200 admin status projects milestone summary and model", () => {
  const status = buildAdminTradingAiMlArchitectureMilestoneStatus();
  assert.equal(status.ok, true);
  assert.equal(status.status, "architecture_milestone_complete_execution_blocked");
  assert.equal(status.milestoneReview.nextRecommendedImplementation, "shared_contract_primitives_design");
  assert.equal(status.model.defaultStatus.nextPhaseDecision, TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL.defaultStatus.nextPhaseDecision);
  assert.equal(status.blockedConfirmation.providerKisOrderEnabled, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
});
