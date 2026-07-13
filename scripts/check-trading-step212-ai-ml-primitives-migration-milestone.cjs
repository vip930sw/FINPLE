const fs = require("node:fs");
const path = require("node:path");
const {
  AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlMigrationScenarioTaxonomy,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");

const REQUIRED_FILES = [
  "package.json",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
  "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs",
  "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
];

const UNTOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
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

function extractArrayBlock(source, name) {
  const start = source.indexOf(`const ${name} = Object.freeze([`);
  if (start < 0) return "";
  const end = source.indexOf("]);", start);
  return end < 0 ? "" : source.slice(start, end);
}

(async function main() {
  for (const file of [...REQUIRED_FILES, ...UNTOUCHED_FILES]) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }
  for (const stage of AI_ML_PRIMITIVE_MIGRATION_STAGES) {
    for (const file of [stage.serviceFile, stage.testFile, stage.checkerFile, stage.checkerTestFile]) {
      assert(fs.existsSync(file), `missing stage file: ${file}`);
    }
  }

  const packageJson = read("package.json");
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const checkerTest = read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs");
  const step195Service = read("server/src/services/tradingAiMlReadinessGateSummary.js");

  assertIncludes(packageJson, "\"check:trading-step212-ai-ml-primitives-migration-milestone\"", "package script");
  assertIncludes(packageJson, "scripts/trading-ai-ml-primitives-migration-audit.test.cjs", "package script");
  assertIncludes(packageJson, "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs", "package script");
  for (const testFile of [
    "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs",
    "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs",
    "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs",
    "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs",
    "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs",
    "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
    "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
    "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
  ]) {
    assertIncludes(packageJson, testFile, "package regression link");
  }

  for (const exportName of [
    "AI_ML_PRIMITIVE_MIGRATION_STAGES",
    "AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS",
    "AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS",
    "classifyProtectedFlags",
    "buildAiMlPrimitivesMigrationAudit",
    "validateAiMlMigrationScenarioTaxonomy",
    "validateAiMlProtectedFlagStageRegistry",
    "validateAiMlPrimitivesMigrationAudit",
  ]) {
    assertIncludes(auditScript, exportName, "audit export");
  }
  assertIncludes(auditScript, "expectedContractScenarioMarkers", "audit contract scenario taxonomy");
  assertIncludes(auditScript, "expectedMigrationRegressionTestMarkers", "audit migration regression taxonomy");
  assertIncludes(auditScript, "contractScenarioCoverageStatus", "audit contract scenario coverage");
  assertIncludes(auditScript, "migrationRegressionCoverageStatus", "audit migration regression coverage");
  assertIncludes(packageJson, "check:trading-ai-ml-primitives-migration-regression", "package consolidated regression script");
  assertIncludes(packageJson, "check:trading-step215-ai-ml-migration-regression-consolidation", "package Step215 script");
  for (const stage of AI_ML_PRIMITIVE_MIGRATION_STAGES) {
    assert(Array.isArray(stage.requiredProtectedFlags), `${stage.stepId} required protected flags missing`);
    assert(Array.isArray(stage.notApplicableProtectedFlags), `${stage.stepId} not-applicable protected flags missing`);
    assert(stage.requiredProtectedFlags.length + stage.notApplicableProtectedFlags.length === 39, `${stage.stepId} protected flag registry partition incomplete`);
  }
  for (const stepId of AI_ML_PRIMITIVE_MIGRATION_REQUIRED_STAGE_IDS) assertIncludes(auditScript, stepId, "audit stage");
  for (const scenario of [
    "Scenario A: complete stage coverage",
    "Scenario B: correct inheritance chain",
    "Scenario C: single flag source",
    "Scenario D: no legacy duplicate",
    "Scenario E: explicit allowlist",
    "Scenario F: protected false coverage",
    "Scenario G: output compatibility coverage",
    "Scenario H: helper adoption",
    "Scenario I: deterministic audit output",
    "Scenario J: mutation resistance",
    "Scenario K: Step195 duplicate key cleanup",
    "Scenario L: no runtime authority change",
    "Scenario O: synthetic required missing is missing unexpectedly",
    "Scenario Q: synthetic not applicable present is unexpected applicable",
    "Scenario R: registry partition overlap fails validation",
    "Scenario S: registry coverage missing fails validation",
    "Scenario T: unknown registry key fails validation",
  ]) {
    assertIncludes(auditTest, scenario, "audit scenario");
  }
  assertIncludes(checkerTest, "Step212 checker passes against repository source", "checker test self coverage");

  const forbiddenBlock = extractArrayBlock(step195Service, "FORBIDDEN_PERMISSION_KEYS");
  assert((forbiddenBlock.match(/"dbWriteAllowed"/g) || []).length === 1, "Step195 FORBIDDEN_PERMISSION_KEYS must contain dbWriteAllowed exactly once");

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const taxonomyValidation = validateAiMlMigrationScenarioTaxonomy();
  assert(taxonomyValidation.ok, `taxonomy validation failed: ${taxonomyValidation.errors.join(", ")}`);
  const registryValidation = validateAiMlProtectedFlagStageRegistry();
  assert(registryValidation.ok, `protected flag registry failed: ${registryValidation.errors.join(", ")}`);
  const validation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(validation.ok, `migration audit failed: ${validation.errors.join(", ")}`);
  assert(audit.scope === "step194_to_step200", "audit scope mismatch");
  assert(audit.expectedStageCount === 7, "audit expected stage count mismatch");
  assert(audit.migratedStageCount === 7, "audit migrated stage count mismatch");
  assert(audit.singleFlagSourceStageCount === 7, "audit single flag source stage count mismatch");
  assert(audit.explicitAllowlistStageCount === 7, "audit allowlist stage count mismatch");
  assert(audit.legacySpreadCount === 0, "legacy spread count must be zero");
  assert(audit.anonymousDuplicateFlagObjectCount === 0, "anonymous duplicate flag object count must be zero");
  assert(audit.unexpectedTruePermissionCount === 0, "unexpected true permission count must be zero");
  assert(audit.missingProtectedFlagCount === 0, "missing protected flag count must be zero");
  assert(audit.unexpectedApplicableFlagCount === 0, "unexpected applicable flag count must be zero");
  assert(audit.unclassifiedProtectedFlagCount === 0, "unclassified protected flag count must be zero");
  assert(audit.protectedFlagRegistryStatus === "complete", "protected flag registry must be complete");
  assert(audit.outputCompatibilityCoverageStatus === "complete", "output compatibility coverage must be complete");
  assert(audit.migrationScenarioTaxonomyStatus === "separated_and_complete", "migration scenario taxonomy must be separated");
  assert(audit.contractScenarioCoverageStatus === "complete", "contract scenario coverage must be complete");
  assert(audit.migrationRegressionCoverageStatus === "complete", "migration regression coverage must be complete");
  assert(audit.groupedRegressionStatus === "externally_validated", "grouped regression status mismatch");
  assert(audit.runtimeCapabilityStatus === "not_implemented", "runtime capability must remain not implemented");
  assert(audit.executionReadinessStatus === "blocked", "execution readiness must remain blocked");
  assert(audit.orderAuthorityStatus === "external_blocker", "order authority must remain external blocker");
  assert(audit.checkerConsolidationStatus === "eligible_for_post_step194_review", "checker consolidation must be post Step194 eligible");

  const combinedScriptSource = [auditScript, read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs")]
    .join("\n")
    .replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assert(!combinedScriptSource.includes(snippet), `forbidden runtime implementation code in Step212 scripts: ${snippet}`);
  }
  for (const file of UNTOUCHED_FILES) {
    const source = read(file);
    assert(!source.includes("Step212"), `Step212 marker must not leak into untouched file: ${file}`);
    assert(!source.includes("AI_ML_PRIMITIVE_MIGRATION_STAGES"), `Step212 audit registry must not leak into untouched file: ${file}`);
  }
  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
    assert(!routeFiles.includes("PrimitivesMigration"), "Step212 must not add a runtime route");
  }
  assert(!auditScript.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
  assert(!auditScript.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");
  console.log("[check-trading-step212-ai-ml-primitives-migration-milestone] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
