import assert from "node:assert/strict";
import test from "node:test";

import {
  AI_ML_COMMON_FAIL_CLOSED_FLAGS,
  AI_ML_COMMON_READINESS_FALSE_FLAGS,
  AI_ML_CONTRACT_STATUS,
  AI_ML_SENSITIVE_METADATA_PATTERNS,
  AI_ML_STAGE_IDS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
  sanitizeAiMlMetadataArray,
  sanitizeAiMlMetadataValue,
  sortAiMlMetadataByKey,
} from "./tradingAiMlContractPrimitives.js";
import {
  buildAiMlArchitectureMilestoneReview,
} from "./tradingAiMlArchitectureMilestoneReview.js";

const STAGE_ID_ORDER = [
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

test("Step201 scenario A default fail-closed flags are protected false", () => {
  const flags = buildAiMlFailClosedFlags();
  for (const key of Object.keys(AI_ML_COMMON_FAIL_CLOSED_FLAGS)) {
    assert.equal(flags[key], false, `${key} must default false`);
  }
  for (const key of Object.keys(AI_ML_COMMON_READINESS_FALSE_FLAGS)) {
    assert.equal(flags[key], false, `${key} must default false`);
  }
});

test("Step201 scenario B inherited true conflict is forced false", () => {
  const inheritedFlags = { providerCallsAllowed: true, kisCallsAllowed: true, readyForOrderSubmission: true };
  const flags = buildAiMlFailClosedFlags({ inheritedFlags });
  assert.equal(flags.providerCallsAllowed, false);
  assert.equal(flags.kisCallsAllowed, false);
  assert.equal(flags.readyForOrderSubmission, false);
  assert.deepEqual(inheritedFlags, { providerCallsAllowed: true, kisCallsAllowed: true, readyForOrderSubmission: true });
});

test("Step201 scenario C metadata-only allowlist is explicit and cannot open execution", () => {
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: { unknownTruePermissionAllowed: true, orderSubmissionAllowed: true },
    allowedMetadataFlags: {
      adminReadOnlyMilestoneReviewAllowed: true,
      deterministicArchitectureInventoryAllowed: true,
      deterministicConsolidationPlanningAllowed: true,
      metadataOnlyRuntimePrerequisiteDeclarationAllowed: true,
      providerCallsAllowed: true,
    },
  });
  assert.equal(flags.adminReadOnlyMilestoneReviewAllowed, true);
  assert.equal(flags.deterministicArchitectureInventoryAllowed, true);
  assert.equal(flags.deterministicConsolidationPlanningAllowed, true);
  assert.equal(flags.metadataOnlyRuntimePrerequisiteDeclarationAllowed, true);
  assert.equal(flags.providerCallsAllowed, false);
  assert.equal(flags.orderSubmissionAllowed, false);
  assert.equal(flags.unknownTruePermissionAllowed, undefined);
});

test("Step201 scenario D fail-closed builder resists input mutation", () => {
  const inheritedFlags = { providerCallsAllowed: true, benignMetadataFlag: "metadata" };
  const allowedMetadataFlags = { adminReadOnlyMilestoneReviewAllowed: true };
  const before = JSON.stringify({ inheritedFlags, allowedMetadataFlags });
  const flags = buildAiMlFailClosedFlags({ inheritedFlags, allowedMetadataFlags });
  assert.equal(JSON.stringify({ inheritedFlags, allowedMetadataFlags }), before);
  assert.equal(Object.isFrozen(flags), true);
});

test("Step201 scenario E stage IDs stay deterministic", () => {
  assert.deepEqual(Object.values(AI_ML_STAGE_IDS), STAGE_ID_ORDER);
});

test("Step201 scenario F sorting is deterministic and does not mutate input", () => {
  const input = [{ id: "step199" }, { id: "step191" }, { id: "step195" }];
  const sorted = sortAiMlMetadataByKey(input, "id");
  assert.deepEqual(sorted.map((item) => item.id), ["step191", "step195", "step199"]);
  assert.deepEqual(input.map((item) => item.id), ["step199", "step191", "step195"]);
  assert.notEqual(sorted, input);
  assert.deepEqual(sortAiMlMetadataByKey(null, "id"), []);
});

test("Step201 scenario G sensitive value redaction covers credentials paths and digest vocabulary", () => {
  for (const value of [
    "API key configured",
    "private path C:\\owner\\packet",
    "account ID and checksum",
    "provider raw response",
    "raw status payload hash digest",
  ]) {
    assert.equal(sanitizeAiMlMetadataValue(value), "redacted_metadata");
  }
  assert.ok(AI_ML_SENSITIVE_METADATA_PATTERNS.length >= 18);
});

test("Step201 scenario H benign metadata is preserved", () => {
  assert.equal(sanitizeAiMlMetadataValue(AI_ML_STAGE_IDS.STEP_199_MANIFEST_HANDOFF_ELIGIBILITY), "step199_manifest_handoff_eligibility");
  assert.equal(sanitizeAiMlMetadataValue(AI_ML_CONTRACT_STATUS.BLOCKED), "blocked");
  assert.deepEqual(sanitizeAiMlMetadataArray(["blocked", "denied"]), ["blocked", "denied"]);
});

test("Step201 scenario I cloned metadata does not mutate source", () => {
  const source = { status: "blocked", nested: { stageId: "step200" }, list: ["a"] };
  const clone = cloneAiMlMetadata(source);
  clone.nested.stageId = "changed";
  clone.list.push("b");
  assert.equal(source.nested.stageId, "step200");
  assert.deepEqual(source.list, ["a"]);
});

test("Step201 scenario J Step 200 default output remains compatible", () => {
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
  assert.equal(review.stageCoverage, "9 / 9");
  assert.equal(review.nextRecommendedImplementation, "shared_contract_primitives_design");
});

test("Step201 scenario K Step 200 fail-closed override blocks safety while output flags remain false", () => {
  const review = buildAiMlArchitectureMilestoneReview({
    permissionOverrides: {
      providerCallsAllowed: true,
      datasetBuildAllowed: true,
      modelTrainingAllowed: true,
      orderSubmissionAllowed: true,
      liveTradingAllowed: true,
      publicUiExposureAllowed: true,
      myPageExposureAllowed: true,
      readyForReadOnlyProviderCalls: true,
      readyForOrderSubmission: true,
      readyForLiveGuardedTrading: true,
    },
    runtimeCapabilityStatus: "implemented",
    executionReadinessStatus: "ready",
    nextPhaseDecision: "execute_runtime",
  });
  assert.equal(review.overallStatus, "blocked_by_safety_policy");
  assert.equal(review.safetyBoundaryStatus, "inconsistent");
  assert.equal(review.falseFlagSnapshot.providerCallsAllowed, false);
  assert.equal(review.falseFlagSnapshot.orderSubmissionAllowed, false);
  assert.equal(review.falseFlagSnapshot.readyForLiveGuardedTrading, false);
});
