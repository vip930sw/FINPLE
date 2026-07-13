const { execFileSync } = require("node:child_process");
const assertStrict = require("node:assert/strict");
const fs = require("node:fs");
const {
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP217_SCRIPT = "check:trading-step217-ai-ml-contract-primitives-step193-pilot";
const STEP193_MODULE = "server/src/services/tradingAiMlFeaturePipelineArchitecture.js";
const STEP193_TEST = "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js";

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  STEP193_MODULE,
  STEP193_TEST,
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "createWriteStream",
  "spawn(",
  "exec(",
  "runPython(",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "xgboost",
  "lightgbm",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function getFlagDefinitionSegment(source) {
  const start = source.indexOf("export const STEP193_AI_ML_FEATURE_PIPELINE_FLAGS");
  const end = source.indexOf("const STEP193_STATIC_COMPATIBILITY_MARKERS", start);
  return start < 0 || end < 0 ? "" : source.slice(start, end);
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const status = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...status])].map((file) => file.replace(/\\/g, "/"));
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const service = read(STEP193_MODULE);
  const serviceTest = read(STEP193_TEST);
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const runner = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const runnerTest = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");
  const step212Checker = read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs");
  const step213Checker = read("scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs");
  const step214Checker = read("scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs");
  const step215Checker = read("scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs");
  const step216Checker = read("scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs");

  assertIncludes(packageJson, `"${STEP217_SCRIPT}"`, "package Step217 script");
  assertIncludes(packageJson, "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs", "package Step217 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs", "package Step217 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs", "package Step218 checker test link");

  for (const importName of [
    "AI_ML_CONTRACT_STATUS",
    "AI_ML_STAGE_IDS",
    "buildAiMlFailClosedFlags",
    "cloneAiMlMetadata",
    "normalizeAiMlMetadataArray",
    "sanitizeAiMlMetadataArray",
    "sanitizeAiMlMetadataValue",
    "sortAiMlMetadataByKey",
  ]) {
    assertIncludes(service, importName, "Step193 shared primitive import/use");
  }

  const flagSegment = getFlagDefinitionSegment(service);
  assertIncludes(service, "export const STEP193_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({});", "Step193 empty metadata allowlist");
  assertIncludes(service, "export const STEP193_ADDITIONAL_FALSE_FLAGS = Object.freeze({", "Step193 additional false flags");
  for (const key of [
    "featureFileCreationAllowed",
    "modelArtifactCreationAllowed",
    "modelAutoApprovalAllowed",
    "runtimeRouteAllowed",
    "publicUiAllowed",
  ]) {
    assertIncludes(service, `${key}: false`, "Step193 additional false flag");
  }
  assert(countMatches(service, /export const STEP193_AI_ML_FEATURE_PIPELINE_FLAGS\b/g) === 1, "Step193 flag export must appear once");
  assert(countMatches(flagSegment, /buildAiMlFailClosedFlags\(/g) === 1, "Step193 builder call must appear once");
  assertIncludes(flagSegment, "inheritedFlags: STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS", "Step193 inherited flags");
  assertIncludes(flagSegment, "allowedMetadataFlags: STEP193_METADATA_ONLY_ALLOWED_FLAGS", "Step193 metadata allowlist builder input");
  assertIncludes(flagSegment, "additionalFalseFlags: STEP193_ADDITIONAL_FALSE_FLAGS", "Step193 additional false builder input");
  assertNotIncludes(flagSegment, "...STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS", "Step193 legacy spread");
  assertNotIncludes(service, "Object.entries(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS)", "Step193 dynamic true allowlist extraction");
  assertIncludes(service, "const STEP193_STATIC_COMPATIBILITY_MARKERS = Object.freeze([", "Step193 checker-only compatibility markers");

  for (const snippet of [
    "AI_ML_CONTRACT_STATUS.BLOCKED",
    "AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE",
    "AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE",
    "design_only",
    "design_ready",
    "blocked",
    "ai_ml_feature_pipeline_preflight_gate",
    "admin_only_ai_ml_feature_pipeline_architecture_design_only",
  ]) {
    assertIncludes(service, snippet, "Step193 status and stage vocabulary");
  }

  for (const snippet of [
    "cloneAiMlMetadata(input)",
    "normalizeStep193ArchitectureSnapshotForAdmin",
    "normalizeAiMlMetadataArray(",
    "sanitizeAiMlMetadataArray(",
    "sanitizeAiMlMetadataValue(",
    "sortAiMlMetadataByKey(",
  ]) {
    assertIncludes(service, snippet, "Step193 helper migration");
  }
  assertIncludes(service, "const options = cloneAiMlMetadata(input) || {};", "Step193 admin input clone");
  assertIncludes(service, "options.featurePipelineArchitecture", "Step193 supplied architecture branch");
  assertIncludes(service, "normalizeStep193ArchitectureSnapshotForAdmin(", "Step193 supplied architecture normalizer");
  assertNotIncludes(service, "input.featurePipelineArchitecture ||", "Step193 raw supplied architecture return");
  assertIncludes(serviceTest, "redacted_metadata", "Step193 redaction fixture");

  for (const scenario of [
    "Step193 shared flag compatibility",
    "Step193 inherited execution conflict",
    "Step193 explicit metadata allowlist",
    "Step193 shared helper compatibility",
    "Step193 full default output compatibility",
    "Step193 mutation resistance",
  ]) {
    assertIncludes(serviceTest, scenario, "Step193 migration regression test");
  }
  for (const snippet of [
    "featureSourceMappingCount, 9",
    "rollingFeatureContractCount, 12",
    "leakageGuardCount, 12",
    "qualityRuleCount, 14",
    "interfaceContractCount, 6",
    "serialized.includes(\"api key value\"), false",
    "serialized.includes(\"private path\"), false",
  ]) {
    assertIncludes(serviceTest, snippet, "Step193 output compatibility test");
  }

  const step193 = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((stage) => stage.stepId === "step193");
  assert(step193, "Step193 audit stage missing");
  assert(step193.stageId === "step193_feature_pipeline_architecture", "Step193 audit stage id mismatch");
  assert(step193.serviceFile === STEP193_MODULE, "Step193 audit service file mismatch");
  assert(step193.metadataAllowlistExport === "STEP193_METADATA_ONLY_ALLOWED_FLAGS", "Step193 audit allowlist export mismatch");
  assert(step193.additionalFalseFlagsExport === "STEP193_ADDITIONAL_FALSE_FLAGS", "Step193 audit additional false export mismatch");
  assert(step193.runtimeFlagExport === "STEP193_AI_ML_FEATURE_PIPELINE_FLAGS", "Step193 audit runtime flag export mismatch");
  assert(step193.requiredProtectedFlags.length === AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, "Step193 required protected flag count mismatch");
  assert(step193.notApplicableProtectedFlags.length === 0, "Step193 not-applicable protected flag count must be zero");
  assertStrict.deepEqual(step193.expectedContractScenarioMarkers, []);
  assertStrict.deepEqual(step193.expectedMigrationRegressionTestMarkers, [
    "Step193 shared flag compatibility",
    "Step193 inherited execution conflict",
    "Step193 explicit metadata allowlist",
    "Step193 shared helper compatibility",
    "Step193 full default output compatibility",
    "Step193 mutation resistance",
  ]);

  const registryValidation = validateAiMlProtectedFlagStageRegistry();
  assert(registryValidation.ok, `protected registry validation failed: ${registryValidation.errors.join(", ")}`);
  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `migration audit failed: ${auditValidation.errors.join(", ")}`);
  assert(audit.scope === "step192_to_step200", "audit scope mismatch");
  assert(audit.expectedStageCount === 9, "audit expected stage count mismatch");
  assert(audit.migratedStageCount === 9, "audit migrated stage count mismatch");
  assert(audit.singleFlagSourceStageCount === 9, "audit single source count mismatch");
  assert(audit.explicitAllowlistStageCount === 9, "audit allowlist count mismatch");
  assertStrict.deepEqual(audit.stageOrder, ["step192", "step193", "step194", "step195", "step196", "step197", "step198", "step199", "step200"]);
  assert(audit.protectedFlagRegistryStatus === "complete", "protected registry must remain complete");
  assert(audit.migrationScenarioTaxonomyStatus === "separated_and_complete", "taxonomy must remain separated");
  assert(audit.contractScenarioCoverageStatus === "complete", "contract scenario coverage must remain complete");
  assert(audit.migrationRegressionCoverageStatus === "complete", "migration regression coverage must remain complete");
  assert(audit.runtimeCapabilityStatus === "not_implemented", "runtime capability must remain not implemented");
  assert(audit.executionReadinessStatus === "blocked", "execution readiness must remain blocked");
  assert(audit.orderAuthorityStatus === "external_blocker", "order authority must remain external blocker");

  for (const snippet of [
    "step193_feature_pipeline_architecture",
    "requiredProtectedFlags: Object.freeze([",
    "notApplicableProtectedFlags: Object.freeze([])",
    "expectedContractScenarioMarkers: Object.freeze([])",
    "expectedMigrationRegressionTestMarkers",
  ]) {
    assertIncludes(auditScript, snippet, "Step193 audit registry source");
  }
  assertIncludes(auditTest, "Scenario X: Step193 migration taxonomy is regression-only", "audit Step193 taxonomy test");

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionPlanValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  assert(regressionPlanValidation.ok, `regression plan invalid: ${regressionPlanValidation.errors.join(", ")}`);
  assert(regressionPlan.sourceCheckerCount === 13, "source checker count mismatch");
  assert(regressionPlan.uniqueServiceTestCount === 10, "service test count mismatch");
  assert(regressionPlan.uniqueMigrationCheckerTestCount === 14, "migration checker test count mismatch");
  assert(regressionPlan.uniqueSupportingTestCount === 11, "supporting test count mismatch");
  assert(regressionPlan.uniqueCheckerTestCount === 25, "checker test count mismatch");
  assert(regressionPlan.uniqueTestFileCount === 35, "test file count mismatch");
  assert(regressionPlan.duplicateFileCount === 0, "duplicate file count must be zero");
  assert(regressionPlan.sourceCheckers.includes("scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs"), "Step217 checker missing from runner");
  assert(regressionPlan.sourceCheckers.includes("scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs"), "Step218 checker missing from runner");
  assert(regressionPlan.testFiles.includes(STEP193_TEST), "Step193 service test missing from runner");
  assert(regressionPlan.testFiles.includes("scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs"), "Step193 original checker test missing from runner");
  const successResult = buildAiMlPrimitivesMigrationRegressionResult(regressionPlan);
  const publicSummary = buildAiMlPrimitivesMigrationRegressionPublicSummary(successResult);
  assert(successResult.passed === true, "success result must pass");
  assert(publicSummary.uniqueCheckerTestCount === 25, "public summary checker count mismatch");
  assertNotIncludes(JSON.stringify(publicSummary), "repoRoot", "public summary");
  assertIncludes(runner, "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs", "runner Step217 source checker");
  assertIncludes(runner, "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs", "runner Step218 source checker");
  assertIncludes(runnerTest, "uniqueTestFileCount, 35", "runner test count");

  for (const snippet of [
    "step192_to_step200",
    "expectedStageCount === 9",
    "eligible_for_post_step193_review",
  ]) {
    assertIncludes(step212Checker, snippet, "Step212 checker Step193 scope");
  }
  for (const snippet of [
    "step192_to_step200",
    "expectedStageCount === 9",
  ]) {
    assertIncludes(step213Checker, snippet, "Step213 checker Step193 scope");
  }
  for (const snippet of [
    "Step192 to Step200",
    "expectedStageCount === 9",
    "post_step193_checker_and_marker_consolidation_review",
  ]) {
    assertIncludes(step214Checker, snippet, "Step214 checker Step193 scope");
  }
  for (const snippet of [
    "sourceCheckerCount === 13",
    "uniqueServiceTestCount === 10",
    "uniqueMigrationCheckerTestCount === 14",
    "uniqueSupportingTestCount === 11",
    "uniqueCheckerTestCount === 25",
  ]) {
    assertIncludes(step215Checker, snippet, "Step215 checker count");
  }
  for (const snippet of [
    "sourceCheckerCount === 13",
    "uniqueServiceTestCount === 10",
    "uniqueMigrationCheckerTestCount === 14",
    "uniqueSupportingTestCount === 11",
    "uniqueCheckerTestCount === 25",
  ]) {
    assertIncludes(step216Checker, snippet, "Step216 checker count");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step217 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step217 touched file: ${file}`);
  }

  const combinedStep217Source = [
    service,
    auditScript,
    runner,
  ].join("\n").replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(combinedStep217Source, snippet, "Step217 runtime guard");
  }
  assertNotIncludes(combinedStep217Source, "scenario_monthly_returns.csv", "scenario monthly data guard");
  assertNotIncludes(combinedStep217Source, "calculatePortfolioResult", "scenario calculation guard");
  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    const routeFiles = fs.readdirSync(routeDir).join("\n");
    assert(!routeFiles.includes("ai-ml-contract-primitives-step193"), "Step217 must not add endpoint");
  }

  console.log("[check-trading-step217-ai-ml-contract-primitives-step193-pilot] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
