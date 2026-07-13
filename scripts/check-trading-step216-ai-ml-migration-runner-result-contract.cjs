const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  runAiMlPrimitivesMigrationRegression,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP216_SCRIPT = "check:trading-step216-ai-ml-migration-runner-result-contract";

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
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

function createFixture(options = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step216-runner-"));
  const sourceCheckers = Array.from({ length: 11 }, (_, index) => `checker-${index}.cjs`);
  const serviceTestFiles = Array.from({ length: 9 }, (_, index) => `service-${index}.test.cjs`);
  const migrationCheckerTestFiles = Array.from({ length: 12 }, (_, index) => `migration-${index}.test.cjs`);
  const supportingTestFiles = Array.from({ length: 10 }, (_, index) => `support-${index}.test.cjs`);

  sourceCheckers.forEach((file, index) => {
    const exitCode = options.failFirstChecker && index === 0 ? 7 : 0;
    fs.writeFileSync(path.join(tempDir, file), `process.exitCode = ${exitCode};\n`, "utf8");
  });
  for (const file of [...serviceTestFiles, ...migrationCheckerTestFiles, ...supportingTestFiles]) {
    fs.writeFileSync(path.join(tempDir, file), "require('node:test')('noop', () => {});\n", "utf8");
  }

  return {
    tempDir,
    registry: {
      sourceCheckers,
      serviceTestFiles,
      migrationCheckerTestFiles,
      supportingTestFiles,
    },
  };
}

try {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const runner = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const runnerTest = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");
  const step215Checker = read("scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs");
  const step215CheckerTest = read("scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs");

  assertIncludes(packageJson, `"${STEP216_SCRIPT}"`, "package Step216 script");
  assertIncludes(packageJson, "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs", "package Step216 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs", "package Step216 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs", "package Step217 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs", "package Step215 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs", "package Step214 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs", "package Step213 checker test link");
  assertIncludes(packageJson, "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs", "package Step212 checker test link");
  assertIncludes(packageJson, "check:trading-step203-ai-ml-grouped-regression", "Step203 grouped regression preserved");
  assertIncludes(packageJson, "check:trading-step206-finple-test-temp-guard", "Step206 TEMP guard preserved");

  for (const snippet of [
    "passed",
    "executed",
    "buildAiMlPrimitivesMigrationRegressionResult",
    "buildAiMlPrimitivesMigrationRegressionPublicSummary",
    "uniqueCheckerTestCount",
    "ai_ml_primitives_migration_regression_complete",
    "ai_ml_primitives_migration_regression_planned_not_executed",
    "ai_ml_primitives_migration_regression_failed",
    "process.execPath",
    "shell: false",
    "duplicateFileCount",
    "missingFiles",
  ]) {
    assertIncludes(runner, snippet, "runner result contract");
  }
  assertNotIncludes(runner, "process.argv.slice", "runner arbitrary CLI argument parsing");
  assertNotIncludes(runner, "glob", "runner wildcard discovery");
  assertNotIncludes(runner, "shell: true", "runner shell execution");

  for (const scenario of [
    "Scenario F: successful result contract",
    "Scenario G: dry-run is not pass",
    "Scenario H: checker test count",
    "Scenario I: child failure result",
    "Scenario J: CLI public summary",
  ]) {
    assertIncludes(runnerTest, scenario, "Step216 runner test scenario");
  }
  for (const snippet of [
    "successResult.passed === true",
    "dryRunResult.passed === false",
    "uniqueCheckerTestCount === 22",
    "public summary must not include repoRoot",
  ]) {
    assertIncludes(step215Checker, snippet, "Step215 checker hardening");
  }
  assertIncludes(step215CheckerTest, "check:trading-step216-ai-ml-migration-runner-result-contract", "Step215 checker test package linkage");

  const plan = buildAiMlPrimitivesMigrationRegressionPlan();
  const planValidation = validateAiMlPrimitivesMigrationRegressionPlan(plan);
  assert(planValidation.ok, `plan validation failed: ${planValidation.errors.join(", ")}`);
  assert(plan.sourceCheckerCount === 11, "source checker count mismatch");
  assert(plan.uniqueServiceTestCount === 9, "service test count mismatch");
  assert(plan.uniqueMigrationCheckerTestCount === 12, "migration checker test count mismatch");
  assert(plan.uniqueSupportingTestCount === 10, "supporting checker test count mismatch");
  assert(plan.uniqueCheckerTestCount === 22, "unique checker test count mismatch");
  assert(plan.uniqueTestFileCount === 31, "unique test file count mismatch");
  assert(plan.duplicateFileCount === 0, "duplicate file count must be zero");

  const successResult = buildAiMlPrimitivesMigrationRegressionResult(plan);
  assert(successResult.executed === true, "success result must be executed");
  assert(successResult.passed === true, "success result must pass");
  assert(successResult.status === "ai_ml_primitives_migration_regression_complete", "success status mismatch");
  assert(successResult.uniqueCheckerTestCount === 22, "success checker count mismatch");

  const dryRunResult = runAiMlPrimitivesMigrationRegression({ dryRun: true });
  assert(dryRunResult.executed === false, "dry-run must not execute");
  assert(dryRunResult.passed === false, "dry-run must not pass");
  assert(dryRunResult.status === "ai_ml_primitives_migration_regression_planned_not_executed", "dry-run status mismatch");

  const publicSummary = buildAiMlPrimitivesMigrationRegressionPublicSummary(successResult);
  assert(publicSummary.passed === true, "public summary passed marker missing");
  assert(publicSummary.uniqueCheckerTestCount === 22, "public summary checker count mismatch");
  assertNotIncludes(JSON.stringify(publicSummary), "repoRoot", "public summary");
  assertNotIncludes(JSON.stringify(publicSummary), process.cwd(), "public summary absolute path");

  const failingFixture = createFixture({ failFirstChecker: true });
  try {
    let failure;
    try {
      runAiMlPrimitivesMigrationRegression({
        repoRoot: failingFixture.tempDir,
        registry: failingFixture.registry,
        stdio: "pipe",
      });
    } catch (error) {
      failure = error;
    }
    assert(failure, "child failure did not throw");
    assert(failure.result.passed === false, "failure result must not pass");
    assert(failure.result.status === "ai_ml_primitives_migration_regression_failed", "failure status mismatch");
    assert(failure.result.uniqueCheckerTestCount === 22, "failure checker count mismatch");
    assertNotIncludes(JSON.stringify(failure.result), failingFixture.tempDir, "failure public result");
  } finally {
    fs.rmSync(failingFixture.tempDir, { recursive: true, force: true });
  }

  const duplicatePlan = buildAiMlPrimitivesMigrationRegressionPlan({
    registry: {
      sourceCheckers: plan.sourceCheckers,
      serviceTestFiles: plan.serviceTestFiles,
      migrationCheckerTestFiles: plan.migrationCheckerTestFiles,
      supportingTestFiles: [...plan.supportingTestFiles, plan.migrationCheckerTestFiles[0]],
    },
  });
  assert(validateAiMlPrimitivesMigrationRegressionPlan(duplicatePlan).ok === false, "duplicate validation must fail");

  const missingPlan = buildAiMlPrimitivesMigrationRegressionPlan({
    registry: {
      sourceCheckers: ["scripts/not-a-real-step216-checker.cjs"],
      serviceTestFiles: plan.serviceTestFiles,
      migrationCheckerTestFiles: plan.migrationCheckerTestFiles,
      supportingTestFiles: plan.supportingTestFiles,
    },
  });
  assert(validateAiMlPrimitivesMigrationRegressionPlan(missingPlan).ok === false, "missing file validation must fail");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step216 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step216 touched file: ${file}`);
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
    assertNotIncludes(runner, forbidden, "Step216 forbidden runtime/data guard");
  }

  console.log("[check-trading-step216-ai-ml-migration-runner-result-contract] ok");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
