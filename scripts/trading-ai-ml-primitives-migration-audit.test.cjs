const assert = require("node:assert/strict");
const test = require("node:test");
const {
  AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS,
  buildAiMlPrimitivesMigrationAudit,
  classifyProtectedFlags,
  validateAiMlMigrationScenarioTaxonomy,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");

let auditPromise;
function getAudit() {
  if (!auditPromise) auditPromise = buildAiMlPrimitivesMigrationAudit();
  return auditPromise;
}

test("Scenario A: complete stage coverage", async () => {
  const audit = await getAudit();
  assert.equal(audit.scope, "step192_to_step200");
  assert.equal(audit.expectedStageCount, 9);
  assert.equal(audit.migratedStageCount, 9);
  assert.deepEqual(audit.stageOrder, AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS);
  assert.deepEqual(audit.stageAudits.map((stage) => stage.stepId), AI_ML_PRIMITIVE_MIGRATION_STAGES.map((stage) => stage.stepId));
});

test("Scenario A2: Step225 manifest is registered as supplemental guard only", async () => {
  const audit = await getAudit();

  assert.deepEqual(audit.coreAudit, {
    scope: "step192_to_step200",
    expectedStageCount: 9,
  });
  assert.equal(audit.scope, "step192_to_step200");
  assert.equal(audit.expectedStageCount, 9);
  assert.equal(audit.supplementalGuards.category, "supplemental_contract_guard");
  assert.equal(audit.supplementalGuards.count, AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS.length);
  assert.deepEqual(audit.supplementalGuards.checks, ["step225_step192_dataset_contract_manifest"]);
  assert.deepEqual(audit.supplementalGuards.missingFiles, []);
  assert.equal(audit.supplementalGuards.status, "registered");
  assert.equal(audit.stageOrder.includes("step225"), false);
});

test("Scenario B: correct inheritance chain", async () => {
  const audit = await getAudit();
  assert.ok(audit.stageAudits.every((stage) => stage.inheritanceOk));
  assert.deepEqual(audit.stageAudits.map((stage) => stage.inheritedFlagExport), [
    "STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS",
    "STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS",
    "STEP193_AI_ML_FEATURE_PIPELINE_FLAGS",
    "STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS",
    "STEP195_AI_ML_READINESS_GATE_FLAGS",
    "STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS",
    "STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
    "STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
    "STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS",
  ]);
});

test("Scenario C: single flag source", async () => {
  const audit = await getAudit();
  assert.equal(audit.singleFlagSourceStageCount, 9);
  for (const stage of audit.stageAudits) {
    assert.equal(stage.flagExportCount, 1, stage.stepId);
    assert.equal(stage.builderCallCount, 1, stage.stepId);
    assert.equal(stage.singleFlagSource, true, stage.stepId);
  }
});

test("Scenario D: no legacy duplicate", async () => {
  const audit = await getAudit();
  assert.equal(audit.legacySpreadCount, 0);
  assert.equal(audit.anonymousDuplicateFlagObjectCount, 0);
  assert.ok(audit.stageAudits.every((stage) => stage.legacySpreadCount === 0));
  assert.ok(audit.stageAudits.every((stage) => stage.anonymousDuplicateFlagObjectCount === 0));
});

test("Scenario E: explicit allowlist", async () => {
  const audit = await getAudit();
  assert.equal(audit.explicitAllowlistStageCount, 9);
  for (const stage of audit.stageAudits) {
    assert.equal(stage.actualTrueKeyCount, stage.allowlistKeyCount, stage.stepId);
    assert.deepEqual(stage.unexpectedTrueKeys, [], stage.stepId);
    assert.deepEqual(stage.missingAllowedKeys, [], stage.stepId);
  }
});

test("Scenario F: protected false coverage", async () => {
  const audit = await getAudit();
  assert.equal(audit.unexpectedTruePermissionCount, 0);
  assert.equal(audit.missingProtectedFlagCount, 0);
  assert.equal(audit.unexpectedApplicableFlagCount, 0);
  assert.equal(audit.unclassifiedProtectedFlagCount, 0);
  assert.equal(audit.protectedFlagRegistryStatus, "complete");
  for (const stage of audit.stageAudits) {
    assert.deepEqual(stage.protectedUnexpectedTrue, [], stage.stepId);
    assert.deepEqual(stage.missingUnexpectedProtectedFlags, [], stage.stepId);
    assert.deepEqual(stage.unexpectedApplicableFlags, [], stage.stepId);
    assert.deepEqual(stage.unclassifiedProtectedFlags, [], stage.stepId);
    assert.equal(stage.requiredProtectedFlagCount + stage.notApplicableProtectedFlagCount, 39, stage.stepId);
  }
});

test("Scenario G: output compatibility coverage", async () => {
  const audit = await getAudit();
  assert.equal(audit.outputCompatibilityCoverageStatus, "complete");
  assert.equal(audit.contractScenarioCoverageStatus, "complete");
  assert.equal(audit.migrationRegressionCoverageStatus, "complete");
  assert.equal(audit.migrationScenarioTaxonomyStatus, "separated_and_complete");
  assert.ok(audit.stageAudits.every((stage) => stage.outputCompatibilityStatus === "complete"));
  assert.ok(audit.stageAudits.every((stage) => stage.scenarioCoverageStatus === "complete"));
  assert.ok(audit.stageAudits.every((stage) => stage.contractScenarioCoverageStatus === "complete"));
  assert.ok(audit.stageAudits.every((stage) => stage.migrationRegressionCoverageStatus === "complete"));
  const step192 = audit.stageAudits.find((stage) => stage.stepId === "step192");
  const step194 = audit.stageAudits.find((stage) => stage.stepId === "step194");
  const step193 = audit.stageAudits.find((stage) => stage.stepId === "step193");
  assert.equal(step192.contractScenarioExpectedCount, 0);
  assert.equal(step192.migrationRegressionTestExpectedCount, 8);
  assert.equal(step192.contractScenarioCoveredCount, 0);
  assert.equal(step192.migrationRegressionTestCoveredCount, 8);
  assert.equal(step193.contractScenarioExpectedCount, 0);
  assert.equal(step193.migrationRegressionTestExpectedCount, 6);
  assert.equal(step193.contractScenarioCoveredCount, 0);
  assert.equal(step193.migrationRegressionTestCoveredCount, 6);
  assert.equal(step194.contractScenarioExpectedCount, 9);
  assert.equal(step194.migrationRegressionTestExpectedCount, 6);
  assert.equal(step194.contractScenarioCoveredCount, 9);
  assert.equal(step194.migrationRegressionTestCoveredCount, 6);
});

test("Scenario H: helper adoption", async () => {
  const audit = await getAudit();
  assert.equal(audit.helperLegacyRemainingCount, 0);
  const step198 = audit.stageAudits.find((stage) => stage.stepId === "step198");
  assert.ok(step198.helperAdoption.legacyHelpers.some((helper) => helper.status === "stage_specific_output_adapter"));
});

test("Scenario I: deterministic audit output", async () => {
  const first = await buildAiMlPrimitivesMigrationAudit();
  const second = await buildAiMlPrimitivesMigrationAudit();
  assert.deepEqual(first, second);
  assert.equal(validateAiMlPrimitivesMigrationAudit(first).ok, true);
});

test("Scenario J: mutation resistance", async () => {
  const options = { repoRoot: process.cwd(), nested: { ignored: true } };
  const before = JSON.stringify(options);
  const audit = await buildAiMlPrimitivesMigrationAudit(options);
  assert.equal(audit.overallStatus, "shared_primitives_migration_milestone_complete_execution_blocked");
  assert.equal(JSON.stringify(options), before);
});

test("Scenario K: Step195 duplicate key cleanup", () => {
  const step195 = require("node:fs").readFileSync("server/src/services/tradingAiMlReadinessGateSummary.js", "utf8");
  const start = step195.indexOf("const FORBIDDEN_PERMISSION_KEYS = Object.freeze([");
  const end = step195.indexOf("]);", start);
  const block = step195.slice(start, end);
  assert.equal((block.match(/"dbWriteAllowed"/g) || []).length, 1);
});

test("Scenario L: no runtime authority change", async () => {
  const audit = await getAudit();
  assert.equal(audit.runtimeCapabilityStatus, "not_implemented");
  assert.equal(audit.executionReadinessStatus, "blocked");
  assert.equal(audit.orderAuthorityStatus, "external_blocker");
  assert.equal(audit.checkerConsolidationStatus, "eligible_for_post_step193_review");
  assert.equal(audit.nextRecommendedImplementation, "post_step193_checker_and_marker_consolidation_review");
  assert.equal(audit.overallStatus, "shared_primitives_migration_milestone_complete_execution_blocked");
});

test("Scenario M: synthetic required false is protected false", () => {
  const stage = {
    requiredProtectedFlags: ["providerCallsAllowed", "orderSubmissionAllowed"],
    notApplicableProtectedFlags: [
      "actualDataDownloadAllowed",
      "featureGenerationAllowed",
      "datasetBuildAllowed",
      "batchExecutionAllowed",
      "dryRunExecutionAllowed",
      "schemaMaterializationAllowed",
      "partitionMaterializationAllowed",
      "outputPathAssignmentAllowed",
      "reportPersistenceAllowed",
      "exceptionPersistenceAllowed",
      "remediationPersistenceAllowed",
      "handoffExecutionAllowed",
      "handoffTransmissionAllowed",
      "handoffPersistenceAllowed",
      "dbMigrationAllowed",
      "dbReadAllowed",
      "dbWriteAllowed",
      "persistentStorageAllowed",
      "quoteCallsAllowed",
      "kisCallsAllowed",
      "kisTokenIssuanceAllowed",
      "pythonFeatureJobAllowed",
      "modelTrainingAllowed",
      "modelDeploymentAllowed",
      "liveTradingAllowed",
      "publicUiExposureAllowed",
      "myPageExposureAllowed",
      "readyForActualDataDownload",
      "readyForFeatureGeneration",
      "readyForDatasetBuild",
      "readyForBatchExecution",
      "readyForDryRunExecution",
      "readyForModelTraining",
      "readyForModelDeployment",
      "readyForReadOnlyProviderCalls",
      "readyForOrderSubmission",
      "readyForLiveGuardedTrading",
    ],
  };
  const classified = classifyProtectedFlags({ providerCallsAllowed: false, orderSubmissionAllowed: false }, stage);
  assert.equal(classified.find((item) => item.flag === "providerCallsAllowed").status, "protected_false");
  assert.equal(classified.find((item) => item.flag === "orderSubmissionAllowed").status, "protected_false");
});

test("Scenario N: synthetic required true is unexpected true", () => {
  const stage = {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags.filter((flag) => flag !== "providerCallsAllowed"),
  };
  const classified = classifyProtectedFlags({ providerCallsAllowed: true }, stage);
  assert.equal(classified.find((item) => item.flag === "providerCallsAllowed").status, "unexpected_true");
});

test("Scenario O: synthetic required missing is missing unexpectedly", () => {
  const stage = {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags.filter((flag) => flag !== "providerCallsAllowed"),
  };
  const classified = classifyProtectedFlags({}, stage);
  assert.equal(classified.find((item) => item.flag === "providerCallsAllowed").status, "missing_unexpectedly");
  assert.equal(classified.filter((item) => item.status === "missing_unexpectedly").length, 1);
});

test("Scenario P: synthetic not applicable missing remains not applicable", () => {
  const stage = {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags.filter((flag) => flag !== "providerCallsAllowed"),
  };
  const classified = classifyProtectedFlags({ providerCallsAllowed: false }, stage);
  assert.equal(classified.find((item) => item.flag === "orderSubmissionAllowed").status, "not_applicable_to_stage");
});

test("Scenario Q: synthetic not applicable present is unexpected applicable", () => {
  const stage = {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags.filter((flag) => flag !== "providerCallsAllowed"),
  };
  const classified = classifyProtectedFlags({ providerCallsAllowed: false, orderSubmissionAllowed: false }, stage);
  assert.equal(classified.find((item) => item.flag === "orderSubmissionAllowed").status, "unexpected_applicable_flag");
});

test("Scenario R: registry partition overlap fails validation", () => {
  const stage = {
    stepId: "step195",
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags,
  };
  const validation = validateAiMlProtectedFlagStageRegistry([stage]);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /partition overlap/);
});

test("Scenario S: registry coverage missing fails validation", () => {
  const stage = {
    stepId: "step195",
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: [],
  };
  const validation = validateAiMlProtectedFlagStageRegistry([stage]);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /partition incomplete/);
});

test("Scenario T: unknown registry key fails validation", () => {
  const stage = {
    stepId: "step195",
    requiredProtectedFlags: [...AI_ML_PRIMITIVE_MIGRATION_STAGES[0].requiredProtectedFlags, "unknownAllowed"],
    notApplicableProtectedFlags: [],
  };
  const validation = validateAiMlProtectedFlagStageRegistry([stage]);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /unknown required protected flag/);
});

test("Scenario U: migration scenario taxonomy rejects overlap", () => {
  const stage = {
    stepId: "step194",
    expectedContractScenarioMarkers: ["scenario_a_valid_metadata_contract"],
    expectedMigrationRegressionTestMarkers: ["scenario_a_valid_metadata_contract"],
  };
  const validation = validateAiMlMigrationScenarioTaxonomy([stage]);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /contract\/migration marker overlap/);
});

test("Scenario V: migration scenario taxonomy rejects duplicate and empty markers", () => {
  const stage = {
    stepId: "step194",
    expectedContractScenarioMarkers: ["scenario_a_valid_metadata_contract", "scenario_a_valid_metadata_contract", ""],
    expectedMigrationRegressionTestMarkers: ["scenario J shared flag compatibility"],
  };
  const validation = validateAiMlMigrationScenarioTaxonomy([stage]);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /duplicate contract marker/);
  assert.match(validation.errors.join("\n"), /empty contract marker/);
});

test("Scenario W: Step194 contract and migration marker lists stay separated", () => {
  const stage = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((candidate) => candidate.stepId === "step194");
  assert.equal(validateAiMlMigrationScenarioTaxonomy().ok, true);
  assert.equal(stage.expectedContractScenarioMarkers.length, 9);
  assert.equal(stage.expectedMigrationRegressionTestMarkers.length, 6);
  assert.deepEqual(stage.expectedContractScenarioMarkers, [
    "scenario_a_valid_metadata_contract",
    "scenario_b_unknown_feature",
    "scenario_c_future_available_at_leakage",
    "scenario_d_label_overlap",
    "scenario_e_insufficient_rolling_history",
    "scenario_f_invalid_normalization_scope",
    "scenario_g_unconditional_zero_fill",
    "scenario_h_unpinned_version",
    "scenario_i_prohibited_execution_intent",
  ]);
  assert.ok(stage.expectedMigrationRegressionTestMarkers.every((marker) => !marker.startsWith("scenario_")));
});

test("Scenario X: Step193 migration taxonomy is regression-only", () => {
  const stage = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((candidate) => candidate.stepId === "step193");
  assert.equal(validateAiMlMigrationScenarioTaxonomy().ok, true);
  assert.deepEqual(stage.expectedContractScenarioMarkers, []);
  assert.deepEqual(stage.expectedMigrationRegressionTestMarkers, [
    "Step193 shared flag compatibility",
    "Step193 inherited execution conflict",
    "Step193 explicit metadata allowlist",
    "Step193 shared helper compatibility",
    "Step193 full default output compatibility",
    "Step193 mutation resistance",
  ]);
  assert.deepEqual(stage.expectedAllowlistKeys, []);
});
