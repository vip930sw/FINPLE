const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  DEFAULT_REGISTRY,
  SOURCE_CHECKERS,
  SERVICE_TEST_FILES,
  MIGRATION_CHECKER_TEST_FILES,
  SUPPORTING_TEST_FILES,
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  validateAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

function createLightweightRegistryFixture(options = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step216-runner-"));
  const sourceCheckers = Array.from({ length: 10 }, (_, index) => `checker-${index}.cjs`);
  const serviceTestFiles = Array.from({ length: 8 }, (_, index) => `service-${index}.test.cjs`);
  const migrationCheckerTestFiles = Array.from({ length: 11 }, (_, index) => `migration-${index}.test.cjs`);
  const supportingTestFiles = Array.from({ length: 9 }, (_, index) => `support-${index}.test.cjs`);

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

test("Step215 runner builds a complete explicit regression plan", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan();
  const validation = validateAiMlPrimitivesMigrationRegressionPlan(plan);

  assert.equal(validation.ok, true);
  assert.equal(plan.sourceCheckerCount, SOURCE_CHECKERS.length);
  assert.equal(plan.uniqueServiceTestCount, SERVICE_TEST_FILES.length);
  assert.equal(plan.uniqueMigrationCheckerTestCount, MIGRATION_CHECKER_TEST_FILES.length);
  assert.equal(plan.uniqueSupportingTestCount, SUPPORTING_TEST_FILES.length);
  assert.equal(plan.uniqueCheckerTestCount, 20);
  assert.equal(plan.duplicateFileCount, 0);
  assert.deepEqual(plan.missingFiles, []);
  assert.equal(plan.sourceCheckers.includes("scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs"), true);
  assert.equal(plan.testFiles.includes("server/src/services/tradingAiMlFeaturePipelinePreflight.test.js"), true);
  assert.equal(plan.testFiles.includes("scripts/trading-ai-ml-primitives-migration-audit.test.cjs"), true);
});

test("Step215 runner dry-run preserves immutable plan output", () => {
  const result = runAiMlPrimitivesMigrationRegression({ dryRun: true });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.executed, false);
  assert.equal(result.passed, false);
  assert.equal(result.status, "ai_ml_primitives_migration_regression_planned_not_executed");
  assert.throws(() => {
    result.plan.sourceCheckers.push("scripts/not-allowed.cjs");
  }, /object is not extensible|Cannot add property/);
});

test("Step215 runner rejects duplicate test files before execution", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan({
    registry: {
      ...DEFAULT_REGISTRY,
      supportingTestFiles: [
        ...SUPPORTING_TEST_FILES,
        SERVICE_TEST_FILES[0],
      ],
    },
  });
  const validation = validateAiMlPrimitivesMigrationRegressionPlan(plan);

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /duplicate test file/);
});

test("Step215 runner rejects missing files before execution", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan({
    registry: {
      sourceCheckers: ["scripts/not-a-real-step215-checker.cjs"],
      serviceTestFiles: SERVICE_TEST_FILES,
      migrationCheckerTestFiles: MIGRATION_CHECKER_TEST_FILES,
      supportingTestFiles: SUPPORTING_TEST_FILES,
    },
  });
  const validation = validateAiMlPrimitivesMigrationRegressionPlan(plan);

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /missing file/);
});

test("Step215 runner propagates child checker failures", () => {
  const { tempDir, registry } = createLightweightRegistryFixture({ failFirstChecker: true });

  try {
    assert.throws(() => {
      runAiMlPrimitivesMigrationRegression({
        repoRoot: tempDir,
        registry,
        stdio: "pipe",
      });
    }, /AI\/ML primitives migration regression failed/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("Scenario F: successful result contract", () => {
  const { tempDir, registry } = createLightweightRegistryFixture();

  try {
    const result = runAiMlPrimitivesMigrationRegression({
      repoRoot: tempDir,
      registry,
      stdio: "pipe",
    });

    assert.equal(result.ok, true);
    assert.equal(result.executed, true);
    assert.equal(result.passed, true);
    assert.equal(result.status, "ai_ml_primitives_migration_regression_complete");
    assert.equal(result.sourceCheckerCount, 10);
    assert.equal(result.uniqueServiceTestCount, 8);
    assert.equal(result.uniqueMigrationCheckerTestCount, 11);
    assert.equal(result.uniqueSupportingTestCount, 9);
    assert.equal(result.uniqueCheckerTestCount, 20);
    assert.equal(result.uniqueTestFileCount, 28);
    assert.equal(result.duplicateFileCount, 0);
    assert.equal(result.plan.repoRoot, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("Scenario G: dry-run is not pass", () => {
  const result = runAiMlPrimitivesMigrationRegression({ dryRun: true });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.executed, false);
  assert.equal(result.passed, false);
  assert.equal(result.status, "ai_ml_primitives_migration_regression_planned_not_executed");
  assert.equal(result.uniqueCheckerTestCount, 20);
});

test("Scenario H: checker test count", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan();

  assert.equal(plan.uniqueMigrationCheckerTestCount, 11);
  assert.equal(plan.uniqueSupportingTestCount, 9);
  assert.equal(plan.uniqueCheckerTestCount, 20);
  assert.equal(plan.duplicateFileCount, 0);
});

test("Scenario I: child failure result", () => {
  const { tempDir, registry } = createLightweightRegistryFixture({ failFirstChecker: true });

  try {
    assert.throws(() => {
      runAiMlPrimitivesMigrationRegression({
        repoRoot: tempDir,
        registry,
        stdio: "pipe",
      });
    }, (error) => {
      assert.equal(error.result.executed, true);
      assert.equal(error.result.passed, false);
      assert.equal(error.result.status, "ai_ml_primitives_migration_regression_failed");
      assert.equal(error.result.uniqueCheckerTestCount, 20);
      assert.equal(JSON.stringify(error.result).includes(tempDir), false);
      return true;
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("Scenario J: CLI public summary", () => {
  const result = runAiMlPrimitivesMigrationRegression({ dryRun: true });
  const summary = buildAiMlPrimitivesMigrationRegressionPublicSummary({
    ...result,
    passed: true,
    status: "ai_ml_primitives_migration_regression_complete",
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.passed, true);
  assert.equal(summary.uniqueCheckerTestCount, 20);
  assert.equal(serialized.includes("repoRoot"), false);
  assert.equal(serialized.includes(process.cwd()), false);
});
