const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs",
];

const UNTOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
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
  "export const STEP197_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({",
  "export const STEP197_ADDITIONAL_FALSE_FLAGS = Object.freeze({",
  "inheritedFlags: STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS",
  "allowedMetadataFlags: STEP197_METADATA_ONLY_ALLOWED_FLAGS",
  "additionalFalseFlags: STEP197_ADDITIONAL_FALSE_FLAGS",
  "adminReadOnlyReadinessAggregationAllowed: true",
  "deterministicStatusCompositionAllowed: true",
  "metadataOnlyPreflightEvaluationAllowed: true",
  "adminReadOnlyBatchContractReviewAllowed: true",
  "deterministicMetadataChecklistAllowed: true",
  "adminReadOnlyManifestDesignAllowed: true",
  "deterministicInMemoryManifestAllowed: true",
  "metadataOnlyReviewReceiptAllowed: true",
  "featureFileCreationAllowed: false",
  "datasetFileCreationAllowed: false",
  "manifestFileCreationAllowed: false",
  "reviewReceiptPersistenceAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "schemaMaterializationAllowed: false",
  "partitionMaterializationAllowed: false",
  "outputPathAssignmentAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelAutoApprovalAllowed: false",
];

const REQUIRED_STATUS_VOCABULARY = [
  "AI_ML_CONTRACT_STATUS.BLOCKED",
  "AI_ML_CONTRACT_STATUS.DENIED",
  "AI_ML_CONTRACT_STATUS.NOT_GRANTED",
  "AI_ML_CONTRACT_STATUS.NOT_ASSIGNED",
  "AI_ML_CONTRACT_STATUS.GENERATED_NOT_PERSISTED",
  "AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE",
  "AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER",
  "manifest_design_ready_execution_blocked",
  "manifest_needs_revision",
  "invalid_upstream_review",
  "blocked_by_safety_policy",
  "design_contract_record_only",
  "dry_run_manifest_design_only",
];

const REQUIRED_STAGE_SNIPPETS = [
  "AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW",
  "AI_ML_STAGE_IDS.STEP_197_DATASET_BUILD_MANIFEST",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_valid_manifest_design",
  "scenario_b_invalid_upstream_review",
  "scenario_c_missing_contract_version",
  "scenario_d_prohibited_file_materialization",
  "scenario_e_prohibited_db_or_provider_intent",
  "scenario_f_invalid_temporal_boundary",
  "scenario_g_invalid_partition_plan",
  "scenario_h_invalid_logical_schema",
  "scenario_i_receipt_attempts_approval",
  "scenario_j_external_order_authority_blocker",
  "scenario_k_deterministic_ordering",
  "scenario_l_mutation_resistance",
  "scenario_m_shared_flag_output_compatibility",
  "scenario_n_inherited_true_execution_conflict",
  "scenario_o_metadata_true_allowlist",
  "scenario_p_shared_helper_deterministic_compatibility",
  "scenario_q_full_default_output_compatibility",
  "scenario_r_shared_clone_mutation_resistance",
];

const REQUIRED_TEST_NAMES = [
  "Step197 scenario M shared flag output compatibility",
  "Step197 scenario N inherited true execution conflict",
  "Step197 scenario O metadata true allowlist",
  "Step197 scenario P shared helper compatibility",
  "Step197 scenario Q full default output remains compatible",
  "Step197 scenario R shared clone use prevents source, overrides, and controls mutation",
];

const FORBIDDEN_DUPLICATE_HELPERS = [
  "function sortByKey",
  "localeCompare",
  "JSON.parse",
  "JSON.stringify",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "dryRunExecutionAllowed: true",
  "datasetBuildAllowed: true",
  "featureGenerationAllowed: true",
  "schemaMaterializationAllowed: true",
  "partitionMaterializationAllowed: true",
  "outputPathAssignmentAllowed: true",
  "manifestFileCreationAllowed: true",
  "reviewReceiptPersistenceAllowed: true",
  "manualApprovalPersistenceAllowed: true",
  "executionAuthorizationAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "modelTrainingAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
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
const service = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.js");
const serviceTest = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js");
const checkerTest = read("scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs");

assertIncludes(packageJson, "\"check:trading-step208-ai-ml-contract-primitives-step197-pilot\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package script");

for (const snippet of REQUIRED_PRIMITIVE_REFERENCES) assertIncludes(service, snippet, "Step197 shared primitive use");
for (const snippet of REQUIRED_FLAG_SNIPPETS) assertIncludes(service, snippet, "Step197 flag migration");
for (const snippet of REQUIRED_STATUS_VOCABULARY) assertIncludes(service, snippet, "Step197 status vocabulary");
for (const snippet of REQUIRED_STAGE_SNIPPETS) assertIncludes(service, snippet, "Step197 stage id use");
for (const scenario of REQUIRED_SCENARIOS) {
  assertIncludes(service, scenario, "Step197 scenario catalog");
  assertIncludes(serviceTest, scenario, "Step197 scenario test catalog");
}
for (const testName of REQUIRED_TEST_NAMES) assertIncludes(serviceTest, testName, "Step208 scenario test");

for (const helper of FORBIDDEN_DUPLICATE_HELPERS) {
  assert(!service.includes(helper), `duplicate helper remains in Step197 service: ${helper}`);
}
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in Step197 service: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step197 service: ${snippet}`);
}

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step208"), `Step208 marker must not leak into untouched file: ${file}`);
  assert(!source.includes("STEP197_METADATA_ONLY_ALLOWED_FLAGS"), `Step197 allowlist leaked into untouched file: ${file}`);
  assert(!source.includes("STEP197_ADDITIONAL_FALSE_FLAGS"), `Step197 false flags leaked into untouched file: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("DatasetBuildDryRunManifest"), "Step208 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");
assertIncludes(checkerTest, "Step208 checker passes against repository source", "checker test self coverage");

console.log("[check-trading-step208-ai-ml-contract-primitives-step197-pilot] ok");
