const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE_CHECKERS = Object.freeze([
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
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
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs",
]);

const SERVICE_TEST_FILES = Object.freeze([
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
  "server/src/services/tradingAiMlManifestValidationReport.test.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "server/src/services/tradingAiMlBatchContractReview.test.js",
  "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
]);

const MIGRATION_CHECKER_TEST_FILES = Object.freeze([
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs",
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
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
]);

const SUPPORTING_TEST_FILES = Object.freeze([
  "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
  "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
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

const SUPPLEMENTAL_CONTRACT_GUARDS = Object.freeze([
  Object.freeze({
    guardId: "step225_step192_dataset_contract_manifest",
    sourceChecker: "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
    checkerTestFile: "scripts/check-trading-step225-step192-dataset-contract-manifest.test.cjs",
    serviceTestFile: "server/src/services/tradingAiMlDatasetContractManifest.test.js",
    category: "supplemental_contract_guard",
  }),
]);

const DEFAULT_REGISTRY = Object.freeze({
  sourceCheckers: SOURCE_CHECKERS,
  serviceTestFiles: SERVICE_TEST_FILES,
  migrationCheckerTestFiles: MIGRATION_CHECKER_TEST_FILES,
  supportingTestFiles: SUPPORTING_TEST_FILES,
  supplementalContractGuards: SUPPLEMENTAL_CONTRACT_GUARDS,
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
    supplementalContractGuards: [...(registry.supplementalContractGuards || [])],
  };
}

function buildAiMlPrimitivesMigrationRegressionPlan(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const registry = normalizeRegistry(options.registry);
  const supplementalSourceCheckers = registry.supplementalContractGuards.map((guard) => guard.sourceChecker).filter(Boolean);
  const supplementalCheckerTestFiles = registry.supplementalContractGuards.map((guard) => guard.checkerTestFile).filter(Boolean);
  const supplementalServiceTestFiles = registry.supplementalContractGuards.map((guard) => guard.serviceTestFile).filter(Boolean);
  const coreCheckerTestFiles = unique([
    ...registry.migrationCheckerTestFiles,
    ...registry.supportingTestFiles,
  ]);
  const checkerTestFiles = unique([
    ...coreCheckerTestFiles,
    ...supplementalCheckerTestFiles,
  ]);
  const coreTestFiles = unique([
    ...registry.serviceTestFiles,
    ...coreCheckerTestFiles,
  ]);
  const testFiles = unique([
    ...coreTestFiles,
    ...supplementalServiceTestFiles,
    ...supplementalCheckerTestFiles,
  ]);
  const duplicateTestFiles = findDuplicates([
    ...registry.serviceTestFiles,
    ...registry.migrationCheckerTestFiles,
    ...registry.supportingTestFiles,
    ...supplementalCheckerTestFiles,
    ...supplementalServiceTestFiles,
  ]);
  const allSourceCheckers = [
    ...registry.sourceCheckers,
    ...supplementalSourceCheckers,
  ];
  const duplicateSourceCheckers = findDuplicates(allSourceCheckers);
  const allFiles = [...allSourceCheckers, ...testFiles];
  const missingFiles = allFiles.filter((file) => !fs.existsSync(path.join(repoRoot, file)));

  return Object.freeze({
    repoRoot,
    sourceCheckers: Object.freeze(registry.sourceCheckers),
    supplementalContractGuards: Object.freeze(registry.supplementalContractGuards.map((guard) => Object.freeze({ ...guard }))),
    supplementalSourceCheckers: Object.freeze(supplementalSourceCheckers),
    supplementalCheckerTestFiles: Object.freeze(supplementalCheckerTestFiles),
    supplementalServiceTestFiles: Object.freeze(supplementalServiceTestFiles),
    allSourceCheckers: Object.freeze(allSourceCheckers),
    coreCheckerTestFiles: Object.freeze(coreCheckerTestFiles),
    coreTestFiles: Object.freeze(coreTestFiles),
    serviceTestFiles: Object.freeze(registry.serviceTestFiles),
    migrationCheckerTestFiles: Object.freeze(registry.migrationCheckerTestFiles),
    supportingTestFiles: Object.freeze(registry.supportingTestFiles),
    testFiles: Object.freeze(testFiles),
    duplicateTestFiles: Object.freeze(duplicateTestFiles),
    duplicateSourceCheckers: Object.freeze(duplicateSourceCheckers),
    missingFiles: Object.freeze(missingFiles),
    sourceCheckerCount: registry.sourceCheckers.length,
    supplementalGuardCount: registry.supplementalContractGuards.length,
    supplementalSourceCheckerCount: unique(supplementalSourceCheckers).length,
    supplementalServiceTestCount: unique(supplementalServiceTestFiles).length,
    supplementalCheckerTestCount: unique(supplementalCheckerTestFiles).length,
    totalSourceCheckerCount: unique(allSourceCheckers).length,
    sourceCheckerCountDelta: 0,
    uniqueServiceTestCountDelta: 0,
    uniqueMigrationCheckerTestCountDelta: 0,
    uniqueSupportingTestCountDelta: 0,
    uniqueServiceTestCount: unique(registry.serviceTestFiles).length,
    uniqueMigrationCheckerTestCount: unique(registry.migrationCheckerTestFiles).length,
    uniqueSupportingTestCount: unique(registry.supportingTestFiles).length,
    uniqueCheckerTestCount: coreCheckerTestFiles.length,
    uniqueTestFileCount: coreTestFiles.length,
    totalUniqueCheckerTestCount: checkerTestFiles.length,
    totalUniqueTestFileCount: testFiles.length,
    uniqueCheckerTestCountDelta: checkerTestFiles.length - coreCheckerTestFiles.length,
    uniqueTestFileCountDelta: testFiles.length - coreTestFiles.length,
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
    supplementalGuardCount: plan.supplementalGuardCount,
    supplementalSourceCheckerCount: plan.supplementalSourceCheckerCount,
    supplementalServiceTestCount: plan.supplementalServiceTestCount,
    supplementalCheckerTestCount: plan.supplementalCheckerTestCount,
    totalSourceCheckerCount: plan.totalSourceCheckerCount,
    sourceCheckerCountDelta: plan.sourceCheckerCountDelta,
    uniqueServiceTestCountDelta: plan.uniqueServiceTestCountDelta,
    uniqueMigrationCheckerTestCountDelta: plan.uniqueMigrationCheckerTestCountDelta,
    uniqueSupportingTestCountDelta: plan.uniqueSupportingTestCountDelta,
    totalUniqueCheckerTestCount: plan.totalUniqueCheckerTestCount,
    totalUniqueTestFileCount: plan.totalUniqueTestFileCount,
    uniqueCheckerTestCountDelta: plan.uniqueCheckerTestCountDelta,
    uniqueTestFileCountDelta: plan.uniqueTestFileCountDelta,
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
    supplementalGuardCount: result.supplementalGuardCount,
    supplementalSourceCheckerCount: result.supplementalSourceCheckerCount,
    supplementalServiceTestCount: result.supplementalServiceTestCount,
    supplementalCheckerTestCount: result.supplementalCheckerTestCount,
    totalSourceCheckerCount: result.totalSourceCheckerCount,
    sourceCheckerCountDelta: result.sourceCheckerCountDelta,
    uniqueServiceTestCountDelta: result.uniqueServiceTestCountDelta,
    uniqueMigrationCheckerTestCountDelta: result.uniqueMigrationCheckerTestCountDelta,
    uniqueSupportingTestCountDelta: result.uniqueSupportingTestCountDelta,
    totalUniqueCheckerTestCount: result.totalUniqueCheckerTestCount,
    totalUniqueTestFileCount: result.totalUniqueTestFileCount,
    uniqueCheckerTestCountDelta: result.uniqueCheckerTestCountDelta,
    uniqueTestFileCountDelta: result.uniqueTestFileCountDelta,
    duplicateFileCount: result.duplicateFileCount,
  });
}

function validateAiMlPrimitivesMigrationRegressionPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object") errors.push("plan missing");
  if ((plan?.sourceCheckers || []).length !== new Set(plan?.sourceCheckers || []).size) {
    errors.push("duplicate source checker");
  }
  if ((plan?.duplicateSourceCheckers || []).length > 0) {
    errors.push(`duplicate supplemental source checker: ${plan.duplicateSourceCheckers.join(", ")}`);
  }
  if ((plan?.duplicateTestFiles || []).length > 0) {
    errors.push(`duplicate test file: ${plan.duplicateTestFiles.join(", ")}`);
  }
  if ((plan?.missingFiles || []).length > 0) {
    errors.push(`missing file: ${plan.missingFiles.join(", ")}`);
  }
  if ((plan?.sourceCheckers || []).length < 11) errors.push("source checker coverage too small");
  if ((plan?.serviceTestFiles || []).length < 9) errors.push("service test coverage too small");
  if ((plan?.migrationCheckerTestFiles || []).length < 12) errors.push("migration checker test coverage too small");
  for (const guard of plan?.supplementalContractGuards || []) {
    if (!guard.guardId) errors.push("supplemental guard id missing");
    if (!guard.sourceChecker) errors.push(`supplemental guard source checker missing: ${guard.guardId || "unknown"}`);
    if (!guard.checkerTestFile) errors.push(`supplemental guard checker test missing: ${guard.guardId || "unknown"}`);
    if (!guard.serviceTestFile) errors.push(`supplemental guard service test missing: ${guard.guardId || "unknown"}`);
  }
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
    for (const checker of plan.supplementalSourceCheckers) {
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
      supplementalGuardCount: plan.supplementalGuardCount,
      supplementalSourceCheckerCount: plan.supplementalSourceCheckerCount,
      supplementalServiceTestCount: plan.supplementalServiceTestCount,
      supplementalCheckerTestCount: plan.supplementalCheckerTestCount,
      totalSourceCheckerCount: plan.totalSourceCheckerCount,
      sourceCheckerCountDelta: plan.sourceCheckerCountDelta,
      uniqueServiceTestCountDelta: plan.uniqueServiceTestCountDelta,
      uniqueMigrationCheckerTestCountDelta: plan.uniqueMigrationCheckerTestCountDelta,
      uniqueSupportingTestCountDelta: plan.uniqueSupportingTestCountDelta,
      totalUniqueCheckerTestCount: plan.totalUniqueCheckerTestCount,
      totalUniqueTestFileCount: plan.totalUniqueTestFileCount,
      uniqueCheckerTestCountDelta: plan.uniqueCheckerTestCountDelta,
      uniqueTestFileCountDelta: plan.uniqueTestFileCountDelta,
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
  SUPPLEMENTAL_CONTRACT_GUARDS,
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  validateAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
};
