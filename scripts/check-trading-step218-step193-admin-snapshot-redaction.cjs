const { execFileSync } = require("node:child_process");
const assertStrict = require("node:assert/strict");
const fs = require("node:fs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionPublicSummary,
  buildAiMlPrimitivesMigrationRegressionResult,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP218_SCRIPT = "check:trading-step218-step193-admin-snapshot-redaction";
const STEP193_MODULE = "server/src/services/tradingAiMlFeaturePipelineArchitecture.js";
const STEP193_TEST = "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js";
const STEP217_CHECKER = "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs";
const STEP218_CHECKER = "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs";
const STEP218_TEST = "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP193_MODULE,
  STEP193_TEST,
  STEP217_CHECKER,
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  STEP218_CHECKER,
  STEP218_TEST,
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
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

function getFunctionSegment(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  if (start < 0) return "";
  const nextFunction = source.indexOf("\nfunction ", start + 1);
  const nextExport = source.indexOf("\nexport function ", start + 1);
  const candidates = [nextFunction, nextExport].filter((index) => index > start);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
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

(function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const service = read(STEP193_MODULE);
  const serviceTest = read(STEP193_TEST);
  const step217Checker = read(STEP217_CHECKER);
  const step215Checker = read("scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs");
  const step216Checker = read("scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs");
  const runner = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const runnerTest = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");

  assertIncludes(packageJson, `"${STEP218_SCRIPT}"`, "package Step218 script");
  assertIncludes(packageJson, STEP218_CHECKER, "package Step218 checker link");
  assertIncludes(packageJson, STEP218_TEST, "package Step218 checker test link");
  assertIncludes(packageJson, "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js", "package Step193 service test link");

  assertIncludes(service, "export function normalizeStep193ArchitectureSnapshotForAdmin(snapshot)", "Step218 snapshot normalizer export");
  assertIncludes(service, "const clonedSnapshot = cloneAiMlMetadata(snapshot) || {};", "Step218 snapshot clone");
  assertIncludes(service, "datasetArchitectureId: sanitizeAiMlMetadataValue(clonedSnapshot.datasetArchitectureId", "Step218 dataset architecture id preservation");
  assertIncludes(service, "const options = cloneAiMlMetadata(input) || {};", "Step218 admin input clone");
  assertIncludes(service, "options.featurePipelineArchitecture", "Step218 supplied architecture branch");
  assertIncludes(service, "normalizeStep193ArchitectureSnapshotForAdmin(options.featurePipelineArchitecture)", "Step218 supplied architecture normalization");
  assertNotIncludes(service, "input.featurePipelineArchitecture || buildAiMlFeaturePipelineArchitecture(input)", "Step218 raw supplied architecture shortcut");

  const snapshotSegment = getFunctionSegment(service, "normalizeStep193ArchitectureSnapshotForAdmin");
  for (const field of [
    "featureSourceMappings",
    "pointInTimeJoinPolicy",
    "rollingFeatureContracts",
    "missingValuePolicy",
    "trainOnlyNormalizationPolicy",
    "featureVersioningLineage",
    "leakageGuards",
    "featureQualityValidation",
    "datasetTrainingInterfaces",
    "futureFeatureStoreContract",
  ]) {
    assertIncludes(snapshotSegment, `"${field}"`, "Step218 known snapshot field");
  }
  for (const forbidden of [
    "validationStatus",
    "readyForOrderSubmission",
    "orderSubmissionAllowed",
    "providerOrderLiveStatus",
    "blockedConfirmation",
    "credential",
    "rawPayload",
  ]) {
    assertNotIncludes(snapshotSegment, `"${forbidden}"`, "Step218 untrusted snapshot field");
  }

  for (const [functionName, forbiddenSpread] of [
    ["sanitizeFeatureSourceMappings", "...cloneAiMlMetadata(mapping)"],
    ["sanitizeRollingFeatureContracts", "...cloneAiMlMetadata(contract)"],
    ["sanitizeLeakageGuards", "...cloneAiMlMetadata(guard)"],
    ["sanitizeFutureFeatureStoreContract", "...contract"],
  ]) {
    const segment = getFunctionSegment(service, functionName);
    assert(segment, `missing sanitizer segment: ${functionName}`);
    assertNotIncludes(segment, forbiddenSpread, `Step218 ${functionName} raw spread`);
    assertIncludes(segment, "sanitizeAiMlMetadataValue(", `Step218 ${functionName} sanitizer`);
    assertIncludes(segment, "redacted: true", `Step218 ${functionName} redacted marker`);
  }

  for (const scenario of [
    "Step193 direct admin snapshot redaction rebuilds supplied architecture",
    "Step193 admin snapshot ignores untrusted computed and permission fields",
    "Step193 admin snapshot removes unknown top-level fields",
    "Step193 admin snapshot normalization resists mutation",
    "Step193 admin status default compatibility",
  ]) {
    assertIncludes(serviceTest, scenario, "Step218 service regression test");
  }
  for (const snippet of [
    "api key value",
    "private path",
    "secret value",
    "provider raw response",
    "account id value",
    "redacted_metadata",
    "serialized.includes(\"credential\"), false",
    "serialized.includes(\"rawProviderResponse\"), false",
    "status.orderSubmissionAllowed, false",
    "status.readyForOrderSubmission, false",
  ]) {
    assertIncludes(serviceTest, snippet, "Step218 redaction and permission fixture");
  }

  for (const snippet of [
    "normalizeStep193ArchitectureSnapshotForAdmin",
    "input.featurePipelineArchitecture ||",
    "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
    "sourceCheckerCount === 12",
    "uniqueMigrationCheckerTestCount === 13",
    "uniqueCheckerTestCount === 23",
  ]) {
    assertIncludes(step217Checker, snippet, "Step217 hardening link");
  }

  const plan = buildAiMlPrimitivesMigrationRegressionPlan();
  const planValidation = validateAiMlPrimitivesMigrationRegressionPlan(plan);
  assert(planValidation.ok, `regression plan invalid: ${planValidation.errors.join(", ")}`);
  assert(plan.sourceCheckerCount === 12, "source checker count mismatch");
  assert(plan.uniqueServiceTestCount === 9, "service test count mismatch");
  assert(plan.uniqueMigrationCheckerTestCount === 13, "migration checker test count mismatch");
  assert(plan.uniqueSupportingTestCount === 10, "supporting test count mismatch");
  assert(plan.uniqueCheckerTestCount === 23, "checker test count mismatch");
  assert(plan.uniqueTestFileCount === 32, "test file count mismatch");
  assert(plan.duplicateFileCount === 0, "duplicate file count must be zero");
  assert(plan.sourceCheckers.includes(STEP218_CHECKER), "Step218 checker missing from runner");
  assert(plan.testFiles.includes(STEP218_TEST), "Step218 checker test missing from runner");
  assert(plan.testFiles.includes(STEP193_TEST), "Step193 service test must be reused");
  assertStrict.equal(plan.serviceTestFiles.filter((file) => file === STEP193_TEST).length, 1);

  const successResult = buildAiMlPrimitivesMigrationRegressionResult(plan);
  const publicSummary = buildAiMlPrimitivesMigrationRegressionPublicSummary(successResult);
  assert(successResult.passed === true, "success result must pass");
  assert(publicSummary.uniqueCheckerTestCount === 23, "public summary checker count mismatch");
  assertNotIncludes(JSON.stringify(publicSummary), "repoRoot", "public summary");
  assertIncludes(runner, STEP218_CHECKER, "runner Step218 checker");
  assertIncludes(runnerTest, "sourceCheckerCount, 12", "runner source count test");
  assertIncludes(runnerTest, "uniqueTestFileCount, 32", "runner test file count");

  for (const snippet of [
    "sourceCheckerCount === 12",
    "uniqueServiceTestCount === 9",
    "uniqueMigrationCheckerTestCount === 13",
    "uniqueSupportingTestCount === 10",
    "uniqueCheckerTestCount === 23",
  ]) {
    assertIncludes(step215Checker, snippet, "Step215 count linkage");
    assertIncludes(step216Checker, snippet, "Step216 count linkage");
  }
  for (const snippet of [
    "dryRunResult.passed === false",
    "public summary must not include repoRoot",
    "ai_ml_primitives_migration_regression_planned_not_executed",
    "ai_ml_primitives_migration_regression_failed",
  ]) {
    assertIncludes(step216Checker, snippet, "Step216 result contract preservation");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step218 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step218 touched file: ${file}`);
  }

  const serviceAndRunner = [service, runner].join("\n");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(serviceAndRunner, snippet, "Step218 runtime guard");
  }
  assertNotIncludes(serviceAndRunner, "scenario_monthly_returns.csv", "Step218 scenario data guard");
  assertNotIncludes(serviceAndRunner, "calculatePortfolioResult", "Step218 scenario calculation guard");
  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    const routeFiles = fs.readdirSync(routeDir).join("\n");
    assert(!routeFiles.includes("step193-admin-snapshot-redaction"), "Step218 must not add endpoint");
  }

  console.log("[check-trading-step218-step193-admin-snapshot-redaction] ok");
})()
