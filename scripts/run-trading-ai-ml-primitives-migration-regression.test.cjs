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
  validateAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

test("Step215 runner builds a complete explicit regression plan", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan();
  const validation = validateAiMlPrimitivesMigrationRegressionPlan(plan);

  assert.equal(validation.ok, true);
  assert.equal(plan.sourceCheckerCount, SOURCE_CHECKERS.length);
  assert.equal(plan.uniqueServiceTestCount, SERVICE_TEST_FILES.length);
  assert.equal(plan.uniqueMigrationCheckerTestCount, MIGRATION_CHECKER_TEST_FILES.length);
  assert.equal(plan.uniqueSupportingTestCount, SUPPORTING_TEST_FILES.length);
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step215-runner-"));
  const sourceCheckers = Array.from({ length: 10 }, (_, index) => `checker-${index}.cjs`);
  const serviceTestFiles = Array.from({ length: 8 }, (_, index) => `service-${index}.test.cjs`);
  const migrationCheckerTestFiles = Array.from({ length: 11 }, (_, index) => `migration-${index}.test.cjs`);
  const supportingTestFiles = Array.from({ length: 9 }, (_, index) => `support-${index}.test.cjs`);
  fs.writeFileSync(path.join(tempDir, sourceCheckers[0]), "process.exitCode = 7;\n", "utf8");
  for (const file of sourceCheckers.slice(1)) fs.writeFileSync(path.join(tempDir, file), "process.exitCode = 0;\n", "utf8");
  for (const file of [...serviceTestFiles, ...migrationCheckerTestFiles, ...supportingTestFiles]) {
    fs.writeFileSync(path.join(tempDir, file), "require('node:test')('noop', () => {});\n", "utf8");
  }

  try {
    assert.throws(() => {
      runAiMlPrimitivesMigrationRegression({
        repoRoot: tempDir,
        registry: {
          sourceCheckers,
          serviceTestFiles,
          migrationCheckerTestFiles,
          supportingTestFiles,
        },
        stdio: "pipe",
      });
    }, /Command failed/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
