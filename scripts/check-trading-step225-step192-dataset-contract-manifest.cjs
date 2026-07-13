const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP225_SCRIPT = "check:trading-step225-step192-dataset-contract-manifest";
const STEP225_SERVICE = "server/src/services/tradingAiMlDatasetContractManifest.js";
const STEP225_TEST = "server/src/services/tradingAiMlDatasetContractManifest.test.js";
const STEP225_CHECKER = "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs";
const STEP225_CHECKER_TEST = "scripts/check-trading-step225-step192-dataset-contract-manifest.test.cjs";
const STEP192_MODULE = "server/src/services/tradingAiMlDatasetArchitecture.js";
const STEP223_CHECKER = "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs";
const STEP224_CHECKER = "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP225_SERVICE,
  STEP225_TEST,
  STEP225_CHECKER,
  STEP225_CHECKER_TEST,
  STEP192_MODULE,
  STEP223_CHECKER,
  STEP224_CHECKER,
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP225_SERVICE,
  STEP225_TEST,
  STEP225_CHECKER,
  STEP225_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  STEP192_MODULE,
  STEP223_CHECKER,
  STEP224_CHECKER,
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "src/App.jsx",
  "server/src/index.js",
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

const EXPECTED_TOP_LEVEL_KEYS = [
  "manifestVersion",
  "sourceContract",
  "compatibility",
  "surfaces",
  "redacted",
];

const EXPECTED_COMPATIBILITY_KEYS = [
  "legacyExactKeySet",
  "numericThresholdPreserved",
  "stringThresholdPreserved",
  "sensitiveStringPolicy",
];

const EXPECTED_SURFACE_NAMES = [
  "label",
  "split",
  "walkForward",
  "versioningPolicy",
  "lineagePolicy",
  "retentionPolicy",
];

const EXPECTED_LABEL_KEYS = [
  "labelId",
  "modelType",
  "labelName",
  "horizon",
  "formula",
  "threshold",
  "positiveClass",
  "neutralClass",
  "missingLabelPolicy",
  "embargoPeriod",
  "redacted",
];

const EXPECTED_SPLIT_KEYS = [
  "splitPolicyId",
  "policyType",
  "randomSplitAllowed",
  "trainWindow",
  "validationWindow",
  "testWindow",
  "finalHoldoutPolicy",
  "embargoRule",
  "purgeRule",
  "imputationRule",
  "redacted",
];

const EXPECTED_WALK_FORWARD_KEYS = [
  "walkForwardPolicyId",
  "windowType",
  "trainWindowMinimum",
  "validationWindow",
  "testWindow",
  "stepSize",
  "embargoRule",
  "foldLeakageCheck",
  "redacted",
];

const EXPECTED_VERSIONING_KEYS = [
  "policyId",
  "datasetVersionFormat",
  "labelChangeCreatesNewDatasetVersion",
  "featureChangeCreatesNewDatasetVersion",
  "splitChangeCreatesNewDatasetVersion",
  "immutableAfterReview",
  "status",
  "redacted",
];

const EXPECTED_LINEAGE_KEYS = [
  "policyId",
  "lineageFields",
  "rawValueStorageAllowed",
  "privatePathStorageAllowed",
  "digestStorageAllowed",
  "status",
  "redacted",
];

const EXPECTED_RETENTION_KEYS = [
  "policyId",
  "retentionScope",
  "datasetFileRetention",
  "redactionRequired",
  "forbiddenValueClasses",
  "publicExposureAllowed",
  "mypageExposureAllowed",
  "redacted",
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

function assertUnique(values, label) {
  assert(new Set(values).size === values.length, `${label} contains duplicate keys`);
}

function assertSurface(manifest, name, expectedKeys) {
  assertStrict.deepEqual(Object.keys(manifest.surfaces[name]), ["keys"]);
  assertStrict.deepEqual(manifest.surfaces[name].keys, expectedKeys);
  assertUnique(manifest.surfaces[name].keys, name);
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const service = read(STEP225_SERVICE);
  const serviceTest = read(STEP225_TEST);

  assertIncludes(packageJson, `"${STEP225_SCRIPT}"`, "package Step225 script");
  assertIncludes(packageJson, STEP225_CHECKER, "package Step225 checker link");
  assertIncludes(packageJson, STEP225_CHECKER_TEST, "package Step225 checker test link");
  assertIncludes(packageJson, STEP225_TEST, "package Step225 service test link");

  for (const snippet of [
    "buildStep192DatasetContractManifest",
    "buildAiMlDatasetArchitecture",
    "legacyExactKeySet: true",
    "numericThresholdPreserved: true",
    "stringThresholdPreserved: true",
    "sensitiveStringPolicy: \"redacted_metadata\"",
    "keysOf(architecture.labelDefinitions[0])",
    "keysOf(architecture.splitPolicies[0])",
    "keysOf(architecture.walkForwardPolicies[0])",
    "keysOf(architecture.versioningPolicy)",
    "keysOf(architecture.lineagePolicy)",
    "keysOf(architecture.retentionPolicy)",
  ]) {
    assertIncludes(service, snippet, "Step225 service source");
  }

  for (const snippet of [
    "Step225 manifest exposes exact read-only schema keys",
    "Step225 manifest surfaces match Step192 legacy runtime key sets",
    "Step225 manifest remains value-free and excludes sensitive material",
    "Step225 manifest is deterministic and mutation-resistant",
    "Step225 manifest does not change Step192 readiness or execution gates",
  ]) {
    assertIncludes(serviceTest, snippet, "Step225 service test coverage");
  }

  const manifestModule = await import(pathToFileURL(`${process.cwd()}/${STEP225_SERVICE}`).href);
  const architectureModule = await import(pathToFileURL(`${process.cwd()}/${STEP192_MODULE}`).href);
  const manifest = manifestModule.buildStep192DatasetContractManifest();
  const architecture = architectureModule.buildAiMlDatasetArchitecture();

  assertStrict.deepEqual(Object.keys(manifest), EXPECTED_TOP_LEVEL_KEYS);
  assertStrict.deepEqual(Object.keys(manifest.compatibility), EXPECTED_COMPATIBILITY_KEYS);
  assertStrict.deepEqual(Object.keys(manifest.surfaces), EXPECTED_SURFACE_NAMES);
  assertStrict.deepEqual(manifest.compatibility, {
    legacyExactKeySet: true,
    numericThresholdPreserved: true,
    stringThresholdPreserved: true,
    sensitiveStringPolicy: "redacted_metadata",
  });
  assertSurface(manifest, "label", EXPECTED_LABEL_KEYS);
  assertSurface(manifest, "split", EXPECTED_SPLIT_KEYS);
  assertSurface(manifest, "walkForward", EXPECTED_WALK_FORWARD_KEYS);
  assertSurface(manifest, "versioningPolicy", EXPECTED_VERSIONING_KEYS);
  assertSurface(manifest, "lineagePolicy", EXPECTED_LINEAGE_KEYS);
  assertSurface(manifest, "retentionPolicy", EXPECTED_RETENTION_KEYS);
  assertStrict.deepEqual(manifest.surfaces.label.keys, Object.keys(architecture.labelDefinitions[0]));
  assertStrict.equal(typeof architecture.labelDefinitions[0].threshold, "number");
  assertStrict.deepEqual(manifest, manifestModule.buildStep192DatasetContractManifest());

  const manifestJson = JSON.stringify(manifest);
  for (const forbidden of [
    "downside_1m_negative",
    "chronological-split-v0",
    "walk-forward-expanding-v0",
    "forward_return_1m",
    "2015-01-01",
    "credential",
    "secret",
    "token",
    "provider_payload",
    "order_payload",
    "raw_provider_response",
    "private_path",
    "hash_value",
    "digest_value",
    "fingerprint_value",
  ]) {
    assert(!manifestJson.includes(forbidden), `manifest leaked forbidden value: ${forbidden}`);
  }

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `audit validation failed: ${auditValidation.errors.join(", ")}`);
  assertStrict.equal(AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, 39);
  assertStrict.equal(audit.scope, "step192_to_step200");
  assertStrict.equal(audit.expectedStageCount, 9);
  assertStrict.equal(audit.migratedStageCount, 9);
  assertStrict.equal(audit.unexpectedTruePermissionCount, 0);

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  assert(regressionValidation.ok, `regression plan invalid: ${regressionValidation.errors.join(", ")}`);
  assertStrict.equal(regressionPlan.sourceCheckerCount, 13);
  assertStrict.equal(regressionPlan.uniqueServiceTestCount, 10);
  assertStrict.equal(regressionPlan.uniqueMigrationCheckerTestCount, 14);
  assertStrict.equal(regressionPlan.uniqueSupportingTestCount, 11);
  assertStrict.equal(regressionPlan.uniqueCheckerTestCount, 25);
  assertStrict.equal(regressionPlan.uniqueTestFileCount, 35);
  assertStrict.equal(regressionPlan.duplicateFileCount, 0);

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step225 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step225 touched file: ${file}`);
  }

  const combinedChangedSource = [STEP225_SERVICE, STEP225_TEST, STEP225_CHECKER, STEP225_CHECKER_TEST]
    .map(read)
    .join("\n")
    .replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "")
    .replace(/const FORBIDDEN_TOUCHED_FILES = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assert(!combinedChangedSource.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
  }

  console.log("[check-trading-step225-step192-dataset-contract-manifest] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
