const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const {
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlMigrationScenarioTaxonomy,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  buildAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP215_SCRIPT = "check:trading-step215-ai-ml-migration-regression-consolidation";

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
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
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const runner = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const runnerTest = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");
  const step194Test = read("server/src/services/tradingAiMlFeaturePipelinePreflight.test.js");

  assertIncludes(packageJson, `"${STEP215_SCRIPT}"`, "package Step215 script");
  assertIncludes(packageJson, "\"check:trading-ai-ml-primitives-migration-regression\"", "package consolidated runner script");
  assertIncludes(packageJson, "scripts/run-trading-ai-ml-primitives-migration-regression.cjs", "package runner link");
  assertIncludes(packageJson, "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs", "package runner test link");
  assertIncludes(packageJson, "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs", "package Step217 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs", "package Step218 checker test link");

  assertIncludes(auditScript, "expectedContractScenarioMarkers", "contract scenario taxonomy");
  assertIncludes(auditScript, "expectedMigrationRegressionTestMarkers", "migration regression taxonomy");
  assertIncludes(auditScript, "validateAiMlMigrationScenarioTaxonomy", "taxonomy validator");
  assertIncludes(auditScript, "contractScenarioCoverageStatus", "contract coverage status");
  assertIncludes(auditScript, "migrationRegressionCoverageStatus", "migration regression coverage status");
  assertNotIncludes(auditScript, "expectedScenarioMarkers", "mixed legacy scenario taxonomy");

  const taxonomyValidation = validateAiMlMigrationScenarioTaxonomy();
  assert(taxonomyValidation.ok, `taxonomy validation failed: ${taxonomyValidation.errors.join(", ")}`);
  const step194 = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((stage) => stage.stepId === "step194");
  assert(step194.expectedContractScenarioMarkers.length === 9, "Step194 contract marker count mismatch");
  assert(step194.expectedMigrationRegressionTestMarkers.length === 6, "Step194 migration marker count mismatch");
  for (const marker of step194.expectedMigrationRegressionTestMarkers) {
    assert(!step194.expectedContractScenarioMarkers.includes(marker), `Step194 taxonomy overlap: ${marker}`);
  }

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `audit validation failed: ${auditValidation.errors.join(", ")}`);
  assert(audit.contractScenarioCoverageStatus === "complete", "contract scenario coverage incomplete");
  assert(audit.migrationRegressionCoverageStatus === "complete", "migration regression coverage incomplete");
  assert(audit.migrationScenarioTaxonomyStatus === "separated_and_complete", "taxonomy status mismatch");
  assert(audit.runtimeCapabilityStatus === "not_implemented", "runtime capability must remain not implemented");
  assert(audit.executionReadinessStatus === "blocked", "execution readiness must remain blocked");
  assert(audit.orderAuthorityStatus === "external_blocker", "order authority must remain external blocker");

  for (const snippet of [
    "api key value",
    "redacted_metadata",
    "serialized.includes(\"api key value\"), false",
    "02_feature_registry",
    "11_prohibited_execution_intent",
  ]) {
    assertIncludes(step194Test, snippet, "Step194 redaction fixture");
  }

  for (const snippet of [
    "SOURCE_CHECKERS",
    "SERVICE_TEST_FILES",
    "MIGRATION_CHECKER_TEST_FILES",
    "SUPPORTING_TEST_FILES",
    "process.execPath",
    "shell: false",
    "duplicateFileCount",
    "missingFiles",
    "passed",
    "executed",
    "uniqueCheckerTestCount",
    "buildAiMlPrimitivesMigrationRegressionPublicSummary",
    "ai_ml_primitives_migration_regression_failed",
    "ai_ml_primitives_migration_regression_planned_not_executed",
  ]) {
    assertIncludes(runner, snippet, "Step215 runner");
  }
  assertNotIncludes(runner, "process.argv.slice", "Step215 runner arbitrary argument parsing");
  assertNotIncludes(runner, "glob", "Step215 runner wildcard discovery");
  assertNotIncludes(runner, "shell: true", "Step215 runner shell execution");

  for (const scenario of [
    "Step215 runner builds a complete explicit regression plan",
    "Step215 runner dry-run preserves immutable plan output",
    "Step215 runner rejects duplicate test files before execution",
    "Step215 runner rejects missing files before execution",
    "Step215 runner propagates child checker failures",
    "Scenario F: successful result contract",
    "Scenario G: dry-run is not pass",
    "Scenario H: checker test count",
    "Scenario I: child failure result",
    "Scenario J: CLI public summary",
  ]) {
    assertIncludes(runnerTest, scenario, "Step215 runner test");
  }
  for (const scenario of [
    "Scenario U: migration scenario taxonomy rejects overlap",
    "Scenario V: migration scenario taxonomy rejects duplicate and empty markers",
    "Scenario W: Step194 contract and migration marker lists stay separated",
  ]) {
    assertIncludes(auditTest, scenario, "Step215 taxonomy audit test");
  }

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionPlanValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  assert(regressionPlanValidation.ok, `regression plan invalid: ${regressionPlanValidation.errors.join(", ")}`);
  assert(regressionPlan.duplicateFileCount === 0, "regression plan must not duplicate test files");
  assert(regressionPlan.sourceCheckerCount >= 10, "regression plan source checker count too small");
  assert(regressionPlan.sourceCheckerCount === 13, "regression plan source checker count mismatch");
  assert(regressionPlan.uniqueServiceTestCount === 10, "regression plan service test count mismatch");
  assert(regressionPlan.uniqueMigrationCheckerTestCount === 14, "regression plan migration checker count mismatch");
  assert(regressionPlan.uniqueSupportingTestCount === 11, "regression plan supporting test count mismatch");
  assert(regressionPlan.uniqueCheckerTestCount === 25, "regression plan checker test count mismatch");
  assert(regressionPlan.uniqueTestFileCount >= 35, "regression plan test file coverage too small");
  const successResult = buildAiMlPrimitivesMigrationRegressionResult(regressionPlan);
  const dryRunResult = runAiMlPrimitivesMigrationRegression({ dryRun: true });
  const publicSummary = buildAiMlPrimitivesMigrationRegressionPublicSummary(successResult);
  assert(successResult.passed === true, "runner success result must pass");
  assert(successResult.executed === true, "runner success result must execute");
  assert(dryRunResult.passed === false, "runner dry-run result must not pass");
  assert(dryRunResult.executed === false, "runner dry-run result must not execute");
  assert(publicSummary.uniqueCheckerTestCount === 25, "public summary checker count mismatch");
  assert(!JSON.stringify(publicSummary).includes("repoRoot"), "public summary must not include repoRoot");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step215 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step215 touched file: ${file}`);
  }

  for (const forbidden of [
    "scenario_monthly_returns.csv",
    "calculatePortfolioResult",
    "kisTokenClient",
    "kisQuoteAdapter",
    "kisOrderAdapter",
    "providerClient",
    "supabase.from(",
  ]) {
    assertNotIncludes([auditScript, runner].join("\n"), forbidden, "Step215 forbidden runtime/data guard");
  }

  console.log("[check-trading-step215-ai-ml-migration-regression-consolidation] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
