const assert = require("node:assert/strict");
const test = require("node:test");
const {
  AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
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
  for (const stage of audit.stageAudits) {
    assert.deepEqual(stage.protectedUnexpectedTrue, [], stage.stepId);
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
