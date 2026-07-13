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
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP223_SCRIPT = "check:trading-step223-ai-ml-contract-primitives-step192-pilot";
const STEP192_MODULE = "server/src/services/tradingAiMlDatasetArchitecture.js";
const STEP192_TEST = "server/src/services/tradingAiMlDatasetArchitecture.test.js";
const STEP223_CHECKER = "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs";
const STEP223_TEST = "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP192_MODULE,
  STEP192_TEST,
  STEP223_CHECKER,
  STEP223_TEST,
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
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  ...REQUIRED_FILES,
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
]);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
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
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
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
  const start = source.indexOf("export const STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS");
  const end = source.indexOf("const STEP192_STATIC_COMPATIBILITY_MARKERS", start);
  return start < 0 || end < 0 ? "" : source.slice(start, end);
}

function getFunctionSegment(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  const exportStart = source.indexOf(`export function ${functionName}`);
  const actualStart = start >= 0 ? start : exportStart;
  if (actualStart < 0) return "";
  const nextFunction = source.indexOf("\nfunction ", actualStart + 1);
  const nextExport = source.indexOf("\nexport function ", actualStart + 1);
  const candidates = [nextFunction, nextExport].filter((index) => index > actualStart);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;
  return source.slice(actualStart, end);
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
  const service = read(STEP192_MODULE);
  const serviceTest = read(STEP192_TEST);
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const runner = read("scripts/run-trading-ai-ml-primitives-migration-regression.cjs");
  const runnerTest = read("scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs");

  assertIncludes(packageJson, `"${STEP223_SCRIPT}"`, "package Step223 script");
  assertIncludes(packageJson, STEP223_CHECKER, "package Step223 checker link");
  assertIncludes(packageJson, STEP223_TEST, "package Step223 checker test link");
  assertIncludes(packageJson, STEP192_TEST, "package Step192 service test link");

  for (const importName of [
    "buildAiMlFailClosedFlags",
    "cloneAiMlMetadata",
    "normalizeAiMlMetadataArray",
    "sanitizeAiMlMetadataArray",
    "sanitizeAiMlMetadataValue",
    "sortAiMlMetadataByKey",
  ]) {
    assertIncludes(service, importName, "Step192 shared primitive import/use");
  }

  const flagSegment = getFlagDefinitionSegment(service);
  assertIncludes(service, "export const STEP192_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({});", "Step192 empty metadata allowlist");
  assertIncludes(service, "export const STEP192_ADDITIONAL_FALSE_FLAGS = Object.freeze({", "Step192 additional false flags");
  for (const key of [
    "modelAutoApprovalAllowed",
    "runtimeRouteAllowed",
    "publicUiAllowed",
    "modelArtifactCreationAllowed",
  ]) {
    assertIncludes(service, `${key}: false`, "Step192 additional false flag");
  }
  assert(countMatches(service, /export const STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS\b/g) === 1, "Step192 flag export must appear once");
  assert(countMatches(flagSegment, /buildAiMlFailClosedFlags\(/g) === 1, "Step192 builder call must appear once");
  assertIncludes(flagSegment, "inheritedFlags: STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS", "Step192 inherited flags");
  assertIncludes(flagSegment, "allowedMetadataFlags: STEP192_METADATA_ONLY_ALLOWED_FLAGS", "Step192 metadata allowlist builder input");
  assertIncludes(flagSegment, "additionalFalseFlags: STEP192_ADDITIONAL_FALSE_FLAGS", "Step192 additional false builder input");
  assertNotIncludes(flagSegment, "...STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS", "Step192 legacy spread");

  assertIncludes(service, "export function normalizeStep192DatasetArchitectureSnapshotForAdmin(snapshot)", "Step192 admin snapshot normalizer");
  assertIncludes(service, "const sourceInput = cloneAiMlMetadata(input) || {};", "Step192 builder input clone");
  assertIncludes(service, "const options = cloneAiMlMetadata(input) || {};", "Step192 admin input clone");
  assertIncludes(service, "options.datasetArchitecture", "Step192 supplied architecture branch");
  assertIncludes(service, "normalizeStep192DatasetArchitectureSnapshotForAdmin(options.datasetArchitecture)", "Step192 supplied architecture normalization");
  assertNotIncludes(service, "input.datasetArchitecture || buildAiMlDatasetArchitecture(input)", "Step192 raw supplied architecture shortcut");

  const snapshotSegment = getFunctionSegment(service, "normalizeStep192DatasetArchitectureSnapshotForAdmin");
  for (const field of [
    "datasetFamilies",
    "labelDefinitions",
    "featureTimestampRules",
    "pointInTimeRules",
    "splitPolicies",
    "walkForwardPolicies",
    "leakageControls",
    "versioningPolicy",
    "lineagePolicy",
    "retentionPolicy",
  ]) {
    assertIncludes(snapshotSegment, `"${field}"`, "Step192 known snapshot field");
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
    assertNotIncludes(snapshotSegment, `"${forbidden}"`, "Step192 untrusted snapshot field");
  }

  for (const functionName of [
    "sanitizeDatasetFamilies",
    "sanitizeLabelDefinitions",
  ]) {
    const segment = getFunctionSegment(service, functionName);
    assert(segment, `missing sanitizer segment: ${functionName}`);
    assertIncludes(segment, "sanitizeAiMlMetadataValue(", `${functionName} value sanitizer`);
    assertIncludes(segment, "sanitizeAiMlMetadataArray(", `${functionName} array sanitizer`);
    assertIncludes(segment, "redacted: true", `${functionName} redacted marker`);
  }
  const featureRuleSegment = getFunctionSegment(service, "sanitizeFeatureTimestampRules");
  assert(featureRuleSegment, "missing sanitizer segment: sanitizeFeatureTimestampRules");
  assertIncludes(featureRuleSegment, "sanitizeAiMlMetadataValue(", "sanitizeFeatureTimestampRules value sanitizer");
  assertIncludes(featureRuleSegment, "redacted: true", "sanitizeFeatureTimestampRules redacted marker");
  for (const functionName of ["sanitizeSplitPolicies", "sanitizeWalkForwardPolicies"]) {
    const segment = getFunctionSegment(service, functionName);
    assert(segment, `missing sanitizer segment: ${functionName}`);
    assertIncludes(segment, "sanitizeAiMlMetadataValue(", `${functionName} value sanitizer`);
    assertIncludes(segment, "redacted: true", `${functionName} redacted marker`);
  }

  for (const scenario of [
    "Step192 shared flag compatibility",
    "Step192 inherited execution conflict",
    "Step192 explicit metadata allowlist",
    "Step192 shared helper compatibility",
    "Step192 full default output compatibility",
    "Step192 mutation resistance",
    "Step192 admin snapshot redaction",
    "Step192 supplied readiness ignored",
  ]) {
    assertIncludes(serviceTest, scenario, "Step192 migration regression test");
  }
  for (const snippet of [
    "datasetFamilyCount, 5",
    "labelDefinitionCount, 5",
    "featureTimestampRuleCount, 10",
    "leakageControlCount, 11",
    "splitPolicyCount, 1",
    "walkForwardPolicyCount, 1",
    "serialized.includes(\"api key value\"), false",
    "serialized.includes(\"private path\"), false",
    "status.orderSubmissionAllowed, false",
    "status.readyForOrderSubmission, false",
  ]) {
    assertIncludes(serviceTest, snippet, "Step192 output compatibility test");
  }

  const step192 = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((stage) => stage.stepId === "step192");
  assert(step192, "Step192 audit stage missing");
  assert(step192.stageId === "step192_dataset_labeling_architecture", "Step192 audit stage id mismatch");
  assert(step192.serviceFile === STEP192_MODULE, "Step192 audit service file mismatch");
  assert(step192.metadataAllowlistExport === "STEP192_METADATA_ONLY_ALLOWED_FLAGS", "Step192 audit allowlist export mismatch");
  assert(step192.additionalFalseFlagsExport === "STEP192_ADDITIONAL_FALSE_FLAGS", "Step192 audit additional false export mismatch");
  assert(step192.runtimeFlagExport === "STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS", "Step192 audit runtime flag export mismatch");
  assert(step192.requiredProtectedFlags.length === AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, "Step192 required protected flag count mismatch");
  assert(step192.notApplicableProtectedFlags.length === 0, "Step192 not-applicable protected flag count must be zero");
  assertStrict.deepEqual(step192.expectedContractScenarioMarkers, []);
  assertStrict.deepEqual(step192.expectedMigrationRegressionTestMarkers, [
    "Step192 shared flag compatibility",
    "Step192 inherited execution conflict",
    "Step192 explicit metadata allowlist",
    "Step192 shared helper compatibility",
    "Step192 full default output compatibility",
    "Step192 mutation resistance",
    "Step192 admin snapshot redaction",
    "Step192 supplied readiness ignored",
  ]);

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `audit validation failed: ${auditValidation.errors.join(", ")}`);
  assert(validateAiMlProtectedFlagStageRegistry().ok, "protected flag registry validation failed");
  assert(audit.scope === "step192_to_step200", "audit scope mismatch");
  assert(audit.expectedStageCount === 9, "audit expected stage count mismatch");
  assert(audit.migratedStageCount === 9, "audit migrated stage count mismatch");
  assertStrict.deepEqual(audit.stageOrder, ["step192", "step193", "step194", "step195", "step196", "step197", "step198", "step199", "step200"]);
  assert(audit.legacySpreadCount === 0, "legacy spread count must be zero");
  assert(audit.unexpectedTruePermissionCount === 0, "unexpected true permission count must be zero");
  assert(audit.migrationRegressionCoverageStatus === "complete", "migration regression coverage must be complete");

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  assert(regressionValidation.ok, `regression plan invalid: ${regressionValidation.errors.join(", ")}`);
  assert(regressionPlan.sourceCheckerCount === 13, "source checker count mismatch");
  assert(regressionPlan.uniqueServiceTestCount === 10, "service test count mismatch");
  assert(regressionPlan.uniqueMigrationCheckerTestCount === 14, "migration checker test count mismatch");
  assert(regressionPlan.uniqueSupportingTestCount === 11, "supporting test count mismatch");
  assert(regressionPlan.uniqueCheckerTestCount === 25, "checker test count mismatch");
  assert(regressionPlan.uniqueTestFileCount === 35, "test file count mismatch");
  assert(regressionPlan.duplicateFileCount === 0, "duplicate file count must be zero");
  assert(regressionPlan.sourceCheckers.includes(STEP223_CHECKER), "Step223 checker missing from runner");
  assert(regressionPlan.testFiles.includes(STEP192_TEST), "Step192 service test missing from runner");
  assert(regressionPlan.testFiles.includes(STEP223_TEST), "Step223 checker test missing from runner");
  assert(buildAiMlPrimitivesMigrationRegressionPublicSummary({ ...regressionPlan, passed: true, status: "ok" }).uniqueCheckerTestCount === 25, "public summary checker count mismatch");

  for (const snippet of [
    STEP223_CHECKER,
    STEP192_TEST,
    STEP223_TEST,
    "sourceCheckerCount, 13",
    "uniqueServiceTestCount, 10",
    "uniqueMigrationCheckerTestCount, 14",
    "uniqueSupportingTestCount, 11",
    "uniqueCheckerTestCount, 25",
    "uniqueTestFileCount, 35",
  ]) {
    assertIncludes(runner + runnerTest, snippet, "runner Step223 coverage");
  }

  for (const snippet of [
    "step192_to_step200",
    "expectedStageCount, 9",
    "migratedStageCount, 9",
    "Step192 shared flag compatibility",
    "Step192 supplied readiness ignored",
  ]) {
    assertIncludes(auditScript + auditTest, snippet, "audit Step192 coverage");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step223 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step223 touched file: ${file}`);
  }
  const combinedSource = [
    service,
    STEP223_CHECKER,
    STEP223_TEST,
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  ].map((fileOrSource) => (fs.existsSync(fileOrSource) ? read(fileOrSource) : fileOrSource)).join("\n");
  const combinedSourceWithoutGuardLists = combinedSource.replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assert(!combinedSourceWithoutGuardLists.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
  }

  console.log("[check-trading-step223-ai-ml-contract-primitives-step192-pilot] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
