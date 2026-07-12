const assert = require("node:assert/strict");
const test = require("node:test");
const {
  AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  classifyProtectedFlags,
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
  assert.equal(audit.expectedStageCount, 6);
  assert.equal(audit.migratedStageCount, 6);
  assert.deepEqual(audit.stageOrder, AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS);
  assert.deepEqual(audit.stageAudits.map((stage) => stage.stepId), AI_ML_PRIMITIVE_MIGRATION_STAGES.map((stage) => stage.stepId));
});

test("Scenario B: correct inheritance chain", async () => {
  const audit = await getAudit();
  assert.ok(audit.stageAudits.every((stage) => stage.inheritanceOk));
  assert.deepEqual(audit.stageAudits.map((stage) => stage.inheritedFlagExport), [
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
  assert.equal(audit.singleFlagSourceStageCount, 6);
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
  assert.equal(audit.explicitAllowlistStageCount, 6);
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
  assert.ok(audit.stageAudits.every((stage) => stage.outputCompatibilityStatus === "complete"));
  assert.ok(audit.stageAudits.every((stage) => stage.scenarioCoverageStatus === "complete"));
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
