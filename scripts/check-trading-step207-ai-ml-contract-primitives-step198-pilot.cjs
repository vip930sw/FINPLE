const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestValidationReport.test.js",
  "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.cjs",
  "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs",
];

const UNTOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
];

const REQUIRED_PRIMITIVE_REFERENCES = [
  "from \"./tradingAiMlContractPrimitives.js\"",
  "AI_ML_CONTRACT_STATUS",
  "AI_ML_STAGE_IDS",
  "buildAiMlFailClosedFlags",
  "cloneAiMlMetadata",
  "normalizeAiMlMetadataArray",
  "sanitizeAiMlMetadataArray",
  "sanitizeAiMlMetadataValue",
  "sortAiMlMetadataByKey",
];

const REQUIRED_FLAG_SNIPPETS = [
  "export const STEP198_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({",
  "export const STEP198_ADDITIONAL_FALSE_FLAGS = Object.freeze({",
  "inheritedFlags: STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
  "allowedMetadataFlags: STEP198_METADATA_ONLY_ALLOWED_FLAGS",
  "additionalFalseFlags: STEP198_ADDITIONAL_FALSE_FLAGS",
  "adminReadOnlyManifestDesignAllowed: true",
  "deterministicInMemoryManifestAllowed: true",
  "metadataOnlyReviewReceiptAllowed: true",
  "adminReadOnlyManifestValidationReportAllowed: true",
  "deterministicInMemoryReportAllowed: true",
  "deterministicExceptionClassificationAllowed: true",
  "metadataOnlyRemediationQueueAllowed: true",
  "featureFileCreationAllowed: false",
  "datasetFileCreationAllowed: false",
  "manifestFileCreationAllowed: false",
  "reportFileCreationAllowed: false",
  "reviewReceiptPersistenceAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "waiverPersistenceAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelAutoApprovalAllowed: false",
];

const REQUIRED_STATUS_VOCABULARY = [
  "AI_ML_CONTRACT_STATUS.BLOCKED",
  "AI_ML_CONTRACT_STATUS.DENIED",
  "AI_ML_CONTRACT_STATUS.NOT_GRANTED",
  "AI_ML_CONTRACT_STATUS.GENERATED_IN_MEMORY",
  "AI_ML_CONTRACT_STATUS.GENERATED_NOT_PERSISTED",
  "AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE",
  "validation_report_ready_execution_blocked",
  "manifest_exceptions_require_revision",
  "invalid_source_manifest",
  "blocked_by_safety_policy",
];

const REQUIRED_STAGE_SNIPPETS = [
  "AI_ML_STAGE_IDS.STEP_197_DATASET_BUILD_MANIFEST",
  "AI_ML_STAGE_IDS.STEP_198_MANIFEST_VALIDATION_REPORT",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_valid_step197_source",
  "scenario_b_invalid_source_manifest",
  "scenario_c_source_safety_block",
  "scenario_d_source_needs_revision",
  "scenario_e_critical_boundary_exception",
  "scenario_f_manual_review_item_only",
  "scenario_g_waiver_grant_attempt",
  "scenario_h_persistence_attempt",
  "scenario_i_deterministic_ordering",
  "scenario_j_mutation_resistance",
  "scenario_k_sensitive_data_redaction",
  "scenario_l_shared_flag_output_compatibility",
  "scenario_m_inherited_true_execution_conflict",
  "scenario_n_metadata_true_allowlist",
  "scenario_o_shared_helper_deterministic_compatibility",
  "scenario_p_full_default_output_compatibility",
  "scenario_q_shared_clone_mutation_resistance",
];

const REQUIRED_TEST_NAMES = [
  "Step198 scenario L shared flag output compatibility",
  "Step198 scenario M inherited true execution conflict",
  "Step198 scenario N metadata true allowlist",
  "Step198 scenario O shared helper compatibility",
  "Step198 scenario P full default output remains compatible",
  "Step198 scenario Q shared clone use prevents report control and override mutation",
];

const FORBIDDEN_DUPLICATE_HELPERS = [
  "function safeArray",
  "function sortByKey",
  "function sanitizeEvidenceValue",
  "function sanitizeEvidence(",
  "localeCompare",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "validationExecutionAllowed: true",
  "manifestExecutionAllowed: true",
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "featureFileCreationAllowed: true",
  "datasetBuildAllowed: true",
  "datasetFileCreationAllowed: true",
  "batchExecutionAllowed: true",
  "dryRunExecutionAllowed: true",
  "manifestFileCreationAllowed: true",
  "reportFileCreationAllowed: true",
  "schemaMaterializationAllowed: true",
  "partitionMaterializationAllowed: true",
  "outputPathAssignmentAllowed: true",
  "reportPersistenceAllowed: true",
  "exceptionPersistenceAllowed: true",
  "remediationPersistenceAllowed: true",
  "reviewReceiptPersistenceAllowed: true",
  "manualApprovalPersistenceAllowed: true",
  "waiverGrantAllowed: true",
  "waiverPersistenceAllowed: true",
  "executionAuthorizationAllowed: true",
  "handoffExecutionAllowed: true",
  "dbMigrationAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "persistentStorageAllowed: true",
  "providerCallsAllowed: true",
  "quoteCallsAllowed: true",
  "kisCallsAllowed: true",
  "kisTokenIssuanceAllowed: true",
  "pythonFeatureJobAllowed: true",
  "modelTrainingAllowed: true",
  "modelArtifactCreationAllowed: true",
  "modelDeploymentAllowed: true",
  "modelAutoApprovalAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForValidationExecution: true",
  "readyForManifestExecution: true",
  "readyForActualDataDownload: true",
  "readyForFeatureGeneration: true",
  "readyForDatasetBuild: true",
  "readyForBatchExecution: true",
  "readyForDryRunExecution: true",
  "readyForSchemaMaterialization: true",
  "readyForPartitionMaterialization: true",
  "readyForModelTraining: true",
  "readyForModelDeployment: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.select(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "mkdir",
  "createWriteStream",
  "child_process",
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
  "Date.now(",
  "new Date(",
  "Math.random(",
  "randomUUID(",
  "node:crypto",
  "createHash(",
  ".digest(",
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

for (const file of [...REQUIRED_FILES, ...UNTOUCHED_FILES]) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlManifestValidationReport.js");
const serviceTest = read("server/src/services/tradingAiMlManifestValidationReport.test.js");
const checkerTest = read("scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs");

assertIncludes(packageJson, "\"check:trading-step207-ai-ml-contract-primitives-step198-pilot\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.cjs", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlManifestValidationReport.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package script");

for (const snippet of REQUIRED_PRIMITIVE_REFERENCES) assertIncludes(service, snippet, "Step198 shared primitive use");
for (const snippet of REQUIRED_FLAG_SNIPPETS) assertIncludes(service, snippet, "Step198 flag migration");
for (const snippet of REQUIRED_STATUS_VOCABULARY) assertIncludes(service, snippet, "Step198 status vocabulary");
for (const snippet of REQUIRED_STAGE_SNIPPETS) assertIncludes(service, snippet, "Step198 stage id use");

for (const scenario of REQUIRED_SCENARIOS) {
  assertIncludes(service, scenario, "Step198 scenario catalog");
  assertIncludes(serviceTest, scenario, "Step198 scenario test catalog");
}
for (const testName of REQUIRED_TEST_NAMES) assertIncludes(serviceTest, testName, "Step207 scenario test");

for (const helper of FORBIDDEN_DUPLICATE_HELPERS) {
  assert(!service.includes(helper), `duplicate helper remains in Step198 service: ${helper}`);
}
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in Step198 service: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step198 service: ${snippet}`);
}

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step207"), `Step207 marker must not leak into untouched file: ${file}`);
  assert(!source.includes("STEP198_METADATA_ONLY_ALLOWED_FLAGS"), `Step198 allowlist leaked into untouched file: ${file}`);
  assert(!source.includes("STEP198_ADDITIONAL_FALSE_FLAGS"), `Step198 false flags leaked into untouched file: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ManifestValidationReport"), "Step207 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");
assertIncludes(checkerTest, "Step207 checker passes against repository source", "checker test self coverage");

console.log("[check-trading-step207-ai-ml-contract-primitives-step198-pilot] ok");
