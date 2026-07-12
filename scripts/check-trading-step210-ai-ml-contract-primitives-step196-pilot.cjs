const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlBatchContractReview.test.js",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.cjs",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs",
];

const UNTOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
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
  "export const STEP196_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({",
  "export const STEP196_ADDITIONAL_FALSE_FLAGS = Object.freeze({",
  "export const STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS = buildAiMlFailClosedFlags({",
  "inheritedFlags: STEP195_AI_ML_READINESS_GATE_FLAGS",
  "allowedMetadataFlags: STEP196_METADATA_ONLY_ALLOWED_FLAGS",
  "additionalFalseFlags: STEP196_ADDITIONAL_FALSE_FLAGS",
  "adminReadOnlyReadinessAggregationAllowed: true",
  "deterministicStatusCompositionAllowed: true",
  "metadataOnlyPreflightEvaluationAllowed: true",
  "adminReadOnlyBatchContractReviewAllowed: true",
  "deterministicMetadataChecklistAllowed: true",
  "featureFileCreationAllowed: false",
  "datasetFileCreationAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelAutoApprovalAllowed: false",
];

const REQUIRED_STATUS_VOCABULARY = [
  "AI_ML_CONTRACT_STATUS.BLOCKED",
  "AI_ML_CONTRACT_STATUS.DENIED",
  "AI_ML_CONTRACT_STATUS.NOT_GRANTED",
  "AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER",
  "AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE",
  "metadata_only_batch_contract_review",
  "eligible_for_manual_review",
  "not_eligible",
  "dry_run_manifest_design_only",
  "invalid_upstream_contract",
  "blocked_by_safety_policy",
  "contract_needs_revision",
  "review_ready_execution_blocked",
];

const REQUIRED_STAGE_SNIPPETS = [
  "AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY",
  "AI_ML_STAGE_IDS.STEP_196_BATCH_CONTRACT_REVIEW",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_review_ready_metadata_contract",
  "scenario_b_invalid_upstream_readiness",
  "scenario_c_missing_version_pin",
  "scenario_d_prohibited_output_intent",
  "scenario_e_provider_or_db_intent",
  "scenario_f_missing_required_reviewer",
  "scenario_g_invalid_partition_declaration",
  "scenario_h_external_order_authority_blocker",
  "scenario_i_deterministic_ordering",
  "scenario_j_mutation_resistance",
  "scenario_k_shared_flag_compatibility",
  "scenario_l_inherited_true_execution_conflict",
  "scenario_m_explicit_metadata_allowlist",
  "scenario_n_shared_helper_compatibility",
  "scenario_o_full_default_output_compatibility",
  "scenario_p_mutation_resistance",
];

const REQUIRED_TEST_NAMES = [
  "Step196 scenario K shared flag compatibility",
  "Step196 scenario L inherited true execution conflict",
  "Step196 scenario M explicit metadata allowlist",
  "Step196 scenario N shared helper compatibility",
  "Step196 scenario O full default output remains compatible",
  "Step196 scenario P shared clone use prevents source, overrides, and controls mutation",
];

const PROTECTED_FALSE_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "batchExecutionAllowed",
  "dryRunExecutionAllowed",
  "pythonFeatureJobAllowed",
  "modelTrainingAllowed",
  "modelArtifactCreationAllowed",
  "modelDeploymentAllowed",
  "modelAutoApprovalAllowed",
  "dbMigrationAllowed",
  "dbReadAllowed",
  "dbWriteAllowed",
  "persistentStorageAllowed",
  "providerCallsAllowed",
  "quoteCallsAllowed",
  "kisCallsAllowed",
  "kisTokenIssuanceAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "manualApprovalPersistenceAllowed",
  "executionAuthorizationAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForBatchExecution",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "batchExecutionAllowed: true",
  "datasetBuildAllowed: true",
  "featureGenerationAllowed: true",
  "featureFileCreationAllowed: true",
  "datasetFileCreationAllowed: true",
  "manualApprovalPersistenceAllowed: true",
  "executionAuthorizationAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "modelTrainingAllowed: true",
  "modelArtifactCreationAllowed: true",
  "modelDeploymentAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForBatchExecution: true",
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

const OBJECT_FREEZE_OBJECT_PATTERN = /Object\.freeze\(\{[\s\S]*?\n\}\);/g;
const LEGACY_FULL_FALSE_OBJECT_KEYS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "datasetBuildAllowed: false",
  "batchExecutionAllowed: false",
  "providerCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "readyForLiveGuardedTrading: false",
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

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

for (const file of [...REQUIRED_FILES, ...UNTOUCHED_FILES]) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlBatchContractReview.js");
const serviceTest = read("server/src/services/tradingAiMlBatchContractReview.test.js");
const step201Checker = read("scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs");
const step208Checker = read("scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs");
const step209Checker = read("scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs");
const checkerTest = read("scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs");

assertIncludes(packageJson, "\"check:trading-step210-ai-ml-contract-primitives-step196-pilot\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlBatchContractReview.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package script");

for (const snippet of REQUIRED_PRIMITIVE_REFERENCES) assertIncludes(service, snippet, "Step196 shared primitive use");
for (const snippet of REQUIRED_FLAG_SNIPPETS) assertIncludes(service, snippet, "Step196 flag migration");
for (const snippet of REQUIRED_STATUS_VOCABULARY) assertIncludes(service, snippet, "Step196 status vocabulary");
for (const snippet of REQUIRED_STAGE_SNIPPETS) assertIncludes(service, snippet, "Step196 stage id use");

assert(count(service, /export const STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS/g) === 1, "Step196 flag export must be defined exactly once");
assert(count(service, /buildAiMlFailClosedFlags\(/g) === 1, "Step196 service must call buildAiMlFailClosedFlags exactly once");
assert(!service.includes("...STEP195_AI_ML_READINESS_GATE_FLAGS"), "legacy spread flag object remains in Step196 service");

const objectFreezeObjects = service.match(OBJECT_FREEZE_OBJECT_PATTERN) || [];
assert(
  !objectFreezeObjects.some((block) => LEGACY_FULL_FALSE_OBJECT_KEYS.every((key) => block.includes(key))),
  "legacy anonymous full false-flag Object.freeze block remains in Step196 service",
);

for (const helper of ["function sortByCheckId", "localeCompare"]) {
  assert(!service.includes(helper), `duplicate helper remains in Step196 service: ${helper}`);
}
for (const helper of [
  "cloneAiMlMetadata(",
  "normalizeAiMlMetadataArray(",
  "sanitizeAiMlMetadataArray(",
  "sanitizeAiMlMetadataValue(",
  "sortAiMlMetadataByKey(",
]) {
  assertIncludes(service, helper, "Step196 shared helper");
}

for (const scenario of REQUIRED_SCENARIOS) {
  assertIncludes(service, scenario, "Step196 scenario catalog");
  assertIncludes(serviceTest, scenario, "Step196 scenario test catalog");
}
for (const testName of REQUIRED_TEST_NAMES) assertIncludes(serviceTest, testName, "Step210 scenario test");
for (const key of PROTECTED_FALSE_KEYS) assertIncludes(serviceTest, `"${key}"`, "Step196 protected false test key");

for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in Step196 service: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step196 service: ${snippet}`);
}

assert(!step201Checker.includes("\"server/src/services/tradingAiMlBatchContractReview.js\","), "Step201 checker still treats Step196 as unmigrated");
assertIncludes(step208Checker, "Step197 shared primitive use", "Step208 checker linkage");
assertIncludes(step209Checker, "Step197 single flag export", "Step209 checker linkage");
assertIncludes(checkerTest, "Step210 checker passes against repository source", "checker test self coverage");

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step210"), `Step210 marker must not leak into untouched file: ${file}`);
  assert(!source.includes("STEP196_METADATA_ONLY_ALLOWED_FLAGS"), `Step196 allowlist leaked into untouched file: ${file}`);
  assert(!source.includes("STEP196_ADDITIONAL_FALSE_FLAGS"), `Step196 false flags leaked into untouched file: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("BatchContractReview"), "Step210 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

execFileSync(process.execPath, ["scripts/check-trading-step196-ai-ml-batch-contract-review.cjs"], { stdio: "pipe" });

console.log("[check-trading-step210-ai-ml-contract-primitives-step196-pilot] ok");
