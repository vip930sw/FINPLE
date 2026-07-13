const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE_CHECKERS = Object.freeze([
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.cjs",
  "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs",
  "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
]);

const SERVICE_TEST_FILES = Object.freeze([
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
  "server/src/services/tradingAiMlManifestValidationReport.test.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "server/src/services/tradingAiMlBatchContractReview.test.js",
  "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
]);

const MIGRATION_CHECKER_TEST_FILES = Object.freeze([
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
  "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs",
  "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs",
]);

const SUPPORTING_TEST_FILES = Object.freeze([
  "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
  "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
  "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
  "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
  "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs",
  "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
]);

const DEFAULT_REGISTRY = Object.freeze({
  sourceCheckers: SOURCE_CHECKERS,
  serviceTestFiles: SERVICE_TEST_FILES,
  migrationCheckerTestFiles: MIGRATION_CHECKER_TEST_FILES,
  supportingTestFiles: SUPPORTING_TEST_FILES,
});

function unique(values) {
  return [...new Set(values)];
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function normalizeRegistry(registry = DEFAULT_REGISTRY) {
  return {
    sourceCheckers: [...(registry.sourceCheckers || [])],
    serviceTestFiles: [...(registry.serviceTestFiles || [])],
    migrationCheckerTestFiles: [...(registry.migrationCheckerTestFiles || [])],
    supportingTestFiles: [...(registry.supportingTestFiles || [])],
  };
}

function buildAiMlPrimitivesMigrationRegressionPlan(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const registry = normalizeRegistry(options.registry);
  const checkerTestFiles = unique([
    ...registry.migrationCheckerTestFiles,
    ...registry.supportingTestFiles,
  ]);
  const testFiles = unique([
    ...registry.serviceTestFiles,
    ...checkerTestFiles,
  ]);
  const duplicateTestFiles = findDuplicates([
    ...registry.serviceTestFiles,
    ...registry.migrationCheckerTestFiles,
    ...registry.supportingTestFiles,
  ]);
  const allFiles = [...registry.sourceCheckers, ...testFiles];
  const missingFiles = allFiles.filter((file) => !fs.existsSync(path.join(repoRoot, file)));

  return Object.freeze({
    repoRoot,
    sourceCheckers: Object.freeze(registry.sourceCheckers),
    serviceTestFiles: Object.freeze(registry.serviceTestFiles),
    migrationCheckerTestFiles: Object.freeze(registry.migrationCheckerTestFiles),
    supportingTestFiles: Object.freeze(registry.supportingTestFiles),
    testFiles: Object.freeze(testFiles),
    duplicateTestFiles: Object.freeze(duplicateTestFiles),
    missingFiles: Object.freeze(missingFiles),
    sourceCheckerCount: registry.sourceCheckers.length,
    uniqueServiceTestCount: unique(registry.serviceTestFiles).length,
    uniqueMigrationCheckerTestCount: unique(registry.migrationCheckerTestFiles).length,
    uniqueSupportingTestCount: unique(registry.supportingTestFiles).length,
    uniqueCheckerTestCount: checkerTestFiles.length,
    uniqueTestFileCount: testFiles.length,
    duplicateFileCount: duplicateTestFiles.length,
  });
}

function buildAiMlPrimitivesMigrationRegressionResult(plan, overrides = {}) {
  return Object.freeze({
    ok: overrides.ok === undefined ? true : overrides.ok,
    dryRun: overrides.dryRun === undefined ? false : overrides.dryRun,
    executed: overrides.executed === undefined ? true : overrides.executed,
    passed: overrides.passed === undefined ? true : overrides.passed,
    status: overrides.status || "ai_ml_primitives_migration_regression_complete",
    sourceCheckerCount: plan.sourceCheckerCount,
    uniqueServiceTestCount: plan.uniqueServiceTestCount,
    uniqueCheckerTestCount: plan.uniqueCheckerTestCount,
    uniqueMigrationCheckerTestCount: plan.uniqueMigrationCheckerTestCount,
    uniqueSupportingTestCount: plan.uniqueSupportingTestCount,
    uniqueTestFileCount: plan.uniqueTestFileCount,
    duplicateFileCount: plan.duplicateFileCount,
    plan,
  });
}

function buildAiMlPrimitivesMigrationRegressionPublicSummary(result) {
  return Object.freeze({
    passed: result.passed === true,
    status: result.status,
    sourceCheckerCount: result.sourceCheckerCount,
    uniqueServiceTestCount: result.uniqueServiceTestCount,
    uniqueCheckerTestCount: result.uniqueCheckerTestCount,
    uniqueMigrationCheckerTestCount: result.uniqueMigrationCheckerTestCount,
    uniqueSupportingTestCount: result.uniqueSupportingTestCount,
    uniqueTestFileCount: result.uniqueTestFileCount,
    duplicateFileCount: result.duplicateFileCount,
  });
}

function validateAiMlPrimitivesMigrationRegressionPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object") errors.push("plan missing");
  if ((plan?.sourceCheckers || []).length !== new Set(plan?.sourceCheckers || []).size) {
    errors.push("duplicate source checker");
  }
  if ((plan?.duplicateTestFiles || []).length > 0) {
    errors.push(`duplicate test file: ${plan.duplicateTestFiles.join(", ")}`);
  }
  if ((plan?.missingFiles || []).length > 0) {
    errors.push(`missing file: ${plan.missingFiles.join(", ")}`);
  }
  if ((plan?.sourceCheckers || []).length < 10) errors.push("source checker coverage too small");
  if ((plan?.serviceTestFiles || []).length < 8) errors.push("service test coverage too small");
  if ((plan?.migrationCheckerTestFiles || []).length < 11) errors.push("migration checker test coverage too small");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function runNodeFile(repoRoot, file, stdio) {
  execFileSync(process.execPath, [file], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    stdio,
  });
}

function runNodeTests(repoRoot, testFiles, stdio) {
  if (testFiles.length === 0) return;
  execFileSync(process.execPath, ["--test", ...testFiles], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    stdio,
  });
}

function runAiMlPrimitivesMigrationRegression(options = {}) {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan(options);
  const validation = validateAiMlPrimitivesMigrationRegressionPlan(plan);
  if (!validation.ok) {
    const error = new Error(`AI/ML primitives migration regression plan invalid: ${validation.errors.join("; ")}`);
    error.validation = validation;
    error.plan = plan;
    throw error;
  }
  if (options.dryRun) {
    return buildAiMlPrimitivesMigrationRegressionResult(plan, {
      dryRun: true,
      executed: false,
      passed: false,
      status: "ai_ml_primitives_migration_regression_planned_not_executed",
    });
  }

  const stdio = options.stdio || "inherit";
  try {
    for (const checker of plan.sourceCheckers) {
      runNodeFile(plan.repoRoot, checker, stdio);
    }
    runNodeTests(plan.repoRoot, plan.testFiles, stdio);
  } catch (childError) {
    const error = new Error("AI/ML primitives migration regression failed");
    error.result = Object.freeze({
      executed: true,
      passed: false,
      status: "ai_ml_primitives_migration_regression_failed",
      sourceCheckerCount: plan.sourceCheckerCount,
      uniqueServiceTestCount: plan.uniqueServiceTestCount,
      uniqueCheckerTestCount: plan.uniqueCheckerTestCount,
      uniqueMigrationCheckerTestCount: plan.uniqueMigrationCheckerTestCount,
      uniqueSupportingTestCount: plan.uniqueSupportingTestCount,
      uniqueTestFileCount: plan.uniqueTestFileCount,
      duplicateFileCount: plan.duplicateFileCount,
    });
    error.exitCode = typeof childError.status === "number" ? childError.status : 1;
    throw error;
  }

  return buildAiMlPrimitivesMigrationRegressionResult(plan);
}

if (require.main === module) {
  try {
    const result = runAiMlPrimitivesMigrationRegression();
    console.log("[run-trading-ai-ml-primitives-migration-regression] ok");
    console.log(JSON.stringify(buildAiMlPrimitivesMigrationRegressionPublicSummary(result), null, 2));
  } catch (error) {
    if (error.result) {
      console.error(JSON.stringify(error.result, null, 2));
    } else {
      console.error(JSON.stringify({
        passed: false,
        status: "ai_ml_primitives_migration_regression_plan_invalid",
        errors: error.validation?.errors || ["unexpected runner failure"],
      }, null, 2));
    }
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_REGISTRY,
  SOURCE_CHECKERS,
  SERVICE_TEST_FILES,
  MIGRATION_CHECKER_TEST_FILES,
  SUPPORTING_TEST_FILES,
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  validateAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
};
