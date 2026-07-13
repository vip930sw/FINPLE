const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  runAiMlPrimitivesMigrationRegression,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP226_SCRIPT = "check:trading-step226-step225-supplemental-audit-registration";
const STEP225_GUARD_ID = "step225_step192_dataset_contract_manifest";
const STEP225_CHECKER = "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs";
const STEP225_CHECKER_TEST = "scripts/check-trading-step225-step192-dataset-contract-manifest.test.cjs";
const STEP225_SERVICE_TEST = "server/src/services/tradingAiMlDatasetContractManifest.test.js";

const REQUIRED_FILES = [
  "package.json",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.test.cjs",
  STEP225_CHECKER,
  STEP225_CHECKER_TEST,
  STEP225_SERVICE_TEST,
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.test.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
  "server/src/index.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "src/App.jsx",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_RUNTIME_TOKENS = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
  "orderSubmissionAllowed: true",
  "providerCallsAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
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

function createSupplementalFailureFixture() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step226-runner-"));
  const sourceCheckers = Array.from({ length: 13 }, (_, index) => `checker-${index}.cjs`);
  const serviceTestFiles = Array.from({ length: 10 }, (_, index) => `service-${index}.test.cjs`);
  const migrationCheckerTestFiles = Array.from({ length: 14 }, (_, index) => `migration-${index}.test.cjs`);
  const supportingTestFiles = Array.from({ length: 11 }, (_, index) => `support-${index}.test.cjs`);
  const supplementalGuard = {
    guardId: STEP225_GUARD_ID,
    sourceChecker: "supplemental-checker.cjs",
    checkerTestFile: "supplemental-checker.test.cjs",
    serviceTestFile: "supplemental-service.test.cjs",
    category: "supplemental_contract_guard",
  };

  for (const file of sourceCheckers) fs.writeFileSync(path.join(tempDir, file), "process.exitCode = 0;\n", "utf8");
  fs.writeFileSync(path.join(tempDir, supplementalGuard.sourceChecker), "process.exitCode = 9;\n", "utf8");
  for (const file of [...serviceTestFiles, ...migrationCheckerTestFiles, ...supportingTestFiles]) {
    fs.writeFileSync(path.join(tempDir, file), "require('node:test')('noop', () => {});\n", "utf8");
  }
  fs.writeFileSync(path.join(tempDir, supplementalGuard.checkerTestFile), "require('node:test')('noop', () => {});\n", "utf8");
  fs.writeFileSync(path.join(tempDir, supplementalGuard.serviceTestFile), "require('node:test')('noop', () => {});\n", "utf8");

  return {
    tempDir,
    registry: {
      sourceCheckers,
      serviceTestFiles,
      migrationCheckerTestFiles,
      supportingTestFiles,
      supplementalContractGuards: [supplementalGuard],
    },
  };
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const auditSource = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const runnerSource = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const auditTestSource = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const runnerTestSource = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");

  assertIncludes(packageJson, `"${STEP226_SCRIPT}"`, "package Step226 script");
  assertIncludes(packageJson, "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs", "package Step226 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step226-step225-supplemental-audit-registration.test.cjs", "package Step226 checker test link");
  assertIncludes(auditSource, "AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS", "audit supplemental registry");
  assertIncludes(auditSource, "coreAudit", "audit core partition");
  assertIncludes(auditSource, "supplementalGuards", "audit supplemental surface");
  assertIncludes(runnerSource, "SUPPLEMENTAL_CONTRACT_GUARDS", "runner supplemental registry");
  assertIncludes(runnerSource, "supplementalSourceCheckers", "runner supplemental execution list");
  assertIncludes(runnerSource, "for (const checker of plan.supplementalSourceCheckers)", "runner supplemental execution");
  assertIncludes(auditTestSource, "Step225 manifest is registered as supplemental guard only", "audit supplemental test");
  assertIncludes(runnerTestSource, "runner propagates supplemental checker failures", "runner supplemental failure test");

  assert(AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS.length === 1, "supplemental guard registry count mismatch");
  assert(AI_ML_SUPPLEMENTAL_CONTRACT_GUARDS[0].guardId === STEP225_GUARD_ID, "supplemental guard id mismatch");

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `audit validation failed: ${auditValidation.errors.join(", ")}`);
  assert(audit.scope === "step192_to_step200", "audit scope changed");
  assert(audit.expectedStageCount === 9, "audit expected stage count changed");
  assert(audit.coreAudit.scope === "step192_to_step200", "core audit scope changed");
  assert(audit.coreAudit.expectedStageCount === 9, "core audit expected stage count changed");
  assert(audit.supplementalGuards.category === "supplemental_contract_guard", "supplemental guard category mismatch");
  assert(audit.supplementalGuards.count === 1, "supplemental guard count mismatch");
  assert(audit.supplementalGuards.checks.includes(STEP225_GUARD_ID), "Step225 supplemental guard not registered");
  assert(audit.supplementalGuards.missingFiles.length === 0, "supplemental guard file missing");
  assert(audit.supplementalGuards.status === "registered", "supplemental guard not registered");

  const plan = buildAiMlPrimitivesMigrationRegressionPlan();
  const planValidation = validateAiMlPrimitivesMigrationRegressionPlan(plan);
  assert(planValidation.ok, `plan validation failed: ${planValidation.errors.join(", ")}`);
  assert(plan.sourceCheckerCount === 13, "core source checker count changed");
  assert(plan.uniqueServiceTestCount === 10, "core service test count changed");
  assert(plan.uniqueMigrationCheckerTestCount === 14, "core migration checker test count changed");
  assert(plan.uniqueSupportingTestCount === 11, "core supporting test count changed");
  assert(plan.uniqueCheckerTestCount === 25, "core checker test count changed");
  assert(plan.uniqueTestFileCount === 35, "core test file count changed");
  assert(plan.totalUniqueCheckerTestCount === 26, "supplemental checker test total mismatch");
  assert(plan.totalUniqueTestFileCount === 37, "supplemental test file total mismatch");
  assert(plan.sourceCheckerCountDelta === 0, "source checker count delta mismatch");
  assert(plan.uniqueServiceTestCountDelta === 0, "service test count delta mismatch");
  assert(plan.uniqueMigrationCheckerTestCountDelta === 0, "migration checker test count delta mismatch");
  assert(plan.uniqueSupportingTestCountDelta === 0, "supporting test count delta mismatch");
  assert(plan.uniqueCheckerTestCountDelta === 1, "supplemental checker test delta missing");
  assert(plan.uniqueTestFileCountDelta === 2, "supplemental test file delta missing");
  assert(plan.duplicateFileCount === 0, "duplicate file count changed");
  assert(plan.duplicateSourceCheckers.length === 0, "duplicate source checker count changed");
  assert(plan.supplementalGuardCount === 1, "supplemental guard count mismatch");
  assert(plan.supplementalSourceCheckerCount === 1, "supplemental source checker count mismatch");
  assert(plan.supplementalServiceTestCount === 1, "supplemental service test count mismatch");
  assert(plan.supplementalCheckerTestCount === 1, "supplemental checker test count mismatch");
  assert(plan.totalSourceCheckerCount === 14, "total source checker count mismatch");
  assert(plan.supplementalSourceCheckers.includes(STEP225_CHECKER), "Step225 checker not in supplemental source list");
  assert(plan.testFiles.includes(STEP225_CHECKER_TEST), "Step225 checker test not in runner test files");
  assert(plan.testFiles.includes(STEP225_SERVICE_TEST), "Step225 service test not in runner test files");

  const failureFixture = createSupplementalFailureFixture();
  try {
    let failure;
    try {
      runAiMlPrimitivesMigrationRegression({
        repoRoot: failureFixture.tempDir,
        registry: failureFixture.registry,
        stdio: "pipe",
      });
    } catch (error) {
      failure = error;
    }
    assert(failure, "supplemental checker failure did not fail runner");
    assert(failure.result.passed === false, "supplemental failure result must not pass");
    assert(failure.result.supplementalGuardCount === 1, "supplemental failure count missing");
    assertNotIncludes(JSON.stringify(failure.result), failureFixture.tempDir, "failure public result");
  } finally {
    fs.rmSync(failureFixture.tempDir, { recursive: true, force: true });
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step226 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step226 touched file: ${file}`);
  }

  for (const source of [auditSource, runnerSource]) {
    for (const forbidden of FORBIDDEN_RUNTIME_TOKENS) {
      assertNotIncludes(source, forbidden, "Step226 audit/runner source");
    }
  }

  console.log("[check-trading-step226-step225-supplemental-audit-registration] ok");
  console.log(JSON.stringify({
    coreScope: audit.coreAudit.scope,
    coreExpectedStageCount: audit.coreAudit.expectedStageCount,
    sourceCheckerCountDelta: plan.sourceCheckerCountDelta,
    uniqueServiceTestCountDelta: plan.uniqueServiceTestCountDelta,
    uniqueMigrationCheckerTestCountDelta: plan.uniqueMigrationCheckerTestCountDelta,
    uniqueSupportingTestCountDelta: plan.uniqueSupportingTestCountDelta,
    uniqueCheckerTestCountDelta: plan.uniqueCheckerTestCountDelta,
    uniqueTestFileCountDelta: plan.uniqueTestFileCountDelta,
    totalUniqueCheckerTestCount: plan.totalUniqueCheckerTestCount,
    totalUniqueTestFileCount: plan.totalUniqueTestFileCount,
    duplicateFileCount: plan.duplicateFileCount,
    supplementalGuardCount: plan.supplementalGuardCount,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
