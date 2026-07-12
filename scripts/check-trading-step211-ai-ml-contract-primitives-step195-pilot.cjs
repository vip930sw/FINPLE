const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.cjs",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs",
  "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.cjs",
  "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs",
];

const UNTOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
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
  "export const STEP195_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({",
  "export const STEP195_ADDITIONAL_FALSE_FLAGS = Object.freeze({",
  "export const STEP195_AI_ML_READINESS_GATE_FLAGS = buildAiMlFailClosedFlags({",
  "inheritedFlags: STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS",
  "allowedMetadataFlags: STEP195_METADATA_ONLY_ALLOWED_FLAGS",
  "additionalFalseFlags: STEP195_ADDITIONAL_FALSE_FLAGS",
  "metadataOnlyPreflightEvaluationAllowed: true",
  "adminReadOnlyReadinessAggregationAllowed: true",
  "deterministicStatusCompositionAllowed: true",
  "featureFileCreationAllowed: false",
  "datasetFileCreationAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelAutoApprovalAllowed: false",
];

const REQUIRED_STATUS_VOCABULARY = [
  "AI_ML_CONTRACT_STATUS.BLOCKED",
  "AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER",
  "admin_only_readiness_gate_summary",
  "contract_preflight_only",
  "documented_and_validated",
  "internal_contracts_incomplete",
  "invalid_internal_contract",
  "blocked_by_safety_policy",
  "internal_contracts_valid_execution_blocked",
];

const REQUIRED_STAGE_SNIPPETS = [
  "AI_ML_STAGE_IDS.STEP_191_STRATEGY_MANAGEMENT",
  "AI_ML_STAGE_IDS.STEP_192_DATASET_LABELING_ARCHITECTURE",
  "AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE",
  "AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT",
  "AI_ML_STAGE_IDS.STEP_195_READINESS_GATE_SUMMARY",
];

const REQUIRED_SOURCE_IDS = [
  "step191_ai_ml_strategy_management",
  "step192_ai_ml_dataset_architecture",
  "step193_ai_ml_feature_pipeline_architecture",
  "step194_ai_ml_feature_pipeline_preflight",
];

const REQUIRED_GATE_CATEGORIES = [
  "strategy_management_contract",
  "dataset_labeling_contract",
  "feature_pipeline_contract",
  "feature_pipeline_preflight",
  "data_access_permission",
  "feature_generation_permission",
  "dataset_build_permission",
  "model_training_permission",
  "model_deployment_permission",
  "provider_connectivity_permission",
  "order_authority",
  "live_trading_permission",
  "public_exposure_permission",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_current_valid_internal_contracts",
  "scenario_b_missing_source_contract",
  "scenario_c_invalid_preflight",
  "scenario_d_prohibited_permission_conflict",
  "scenario_e_public_exposure_conflict",
  "scenario_f_external_order_authority_blocker",
  "scenario_g_deterministic_ordering",
  "scenario_h_mutation_resistance",
  "scenario_i_shared_flag_compatibility",
  "scenario_j_inherited_execution_conflict",
  "scenario_k_explicit_metadata_allowlist",
  "scenario_l_shared_helper_compatibility",
  "scenario_m_full_default_output_compatibility",
  "scenario_n_mutation_resistance",
];

const REQUIRED_TEST_NAMES = [
  "Step195 scenario I shared flag compatibility",
  "Step195 scenario J inherited execution conflict",
  "Step195 scenario K explicit metadata allowlist",
  "Step195 scenario L shared helper compatibility",
  "Step195 scenario M full default output remains compatible",
  "Step195 scenario N shared clone use prevents source, overrides, and options mutation",
];

const PROTECTED_FALSE_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
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
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "datasetBuildAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForActualDataDownload: true",
  "readyForFeatureGeneration: true",
  "readyForDatasetBuild: true",
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

const OBJECT_FREEZE_OBJECT_PATTERN = /Object\.freeze\(\{[\s\S]*?\n\}\);/g;
const LEGACY_FULL_FALSE_OBJECT_KEYS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "datasetBuildAllowed: false",
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
const service = read("server/src/services/tradingAiMlReadinessGateSummary.js");
const serviceTest = read("server/src/services/tradingAiMlReadinessGateSummary.test.js");
const step201Checker = read("scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs");
const step210Checker = read("scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.cjs");
const checkerTest = read("scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs");

assertIncludes(packageJson, "\"check:trading-step211-ai-ml-contract-primitives-step195-pilot\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlReadinessGateSummary.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step210-ai-ml-contract-primitives-step196-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package script");

for (const snippet of REQUIRED_PRIMITIVE_REFERENCES) assertIncludes(service, snippet, "Step195 shared primitive use");
for (const snippet of REQUIRED_FLAG_SNIPPETS) assertIncludes(service, snippet, "Step195 flag migration");
for (const snippet of REQUIRED_STATUS_VOCABULARY) assertIncludes(service, snippet, "Step195 status vocabulary");
for (const snippet of REQUIRED_STAGE_SNIPPETS) assertIncludes(service, snippet, "Step195 stage id use");
for (const sourceId of REQUIRED_SOURCE_IDS) assertIncludes(service, sourceId, "Step195 source ID");
for (const category of REQUIRED_GATE_CATEGORIES) assertIncludes(service, category, "Step195 gate category");

assert(count(service, /export const STEP195_AI_ML_READINESS_GATE_FLAGS/g) === 1, "Step195 flag export must be defined exactly once");
assert(count(service, /buildAiMlFailClosedFlags\(/g) === 1, "Step195 service must call buildAiMlFailClosedFlags exactly once");
const flagDefinition = service.slice(
  service.indexOf("export const STEP195_AI_ML_READINESS_GATE_FLAGS"),
  service.indexOf("export const TRADING_AI_ML_READINESS_GATE_MODEL"),
);
assert(!flagDefinition.includes("...STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS"), "legacy spread flag object remains in Step195 flag definition");

const objectFreezeObjects = service.match(OBJECT_FREEZE_OBJECT_PATTERN) || [];
assert(
  !objectFreezeObjects.some((block) => LEGACY_FULL_FALSE_OBJECT_KEYS.every((key) => block.includes(key))),
  "legacy anonymous full false-flag Object.freeze block remains in Step195 service",
);

for (const helper of ["function sortById", "localeCompare"]) {
  assert(!service.includes(helper), `duplicate helper remains in Step195 service: ${helper}`);
}
for (const helper of [
  "cloneAiMlMetadata(",
  "normalizeAiMlMetadataArray(",
  "sanitizeAiMlMetadataArray(",
  "sanitizeAiMlMetadataValue(",
  "sortAiMlMetadataByKey(",
]) {
  assertIncludes(service, helper, "Step195 shared helper");
}

for (const scenario of REQUIRED_SCENARIOS) {
  assertIncludes(service, scenario, "Step195 scenario catalog");
  assertIncludes(serviceTest, scenario, "Step195 scenario test catalog");
}
for (const testName of REQUIRED_TEST_NAMES) assertIncludes(serviceTest, testName, "Step211 scenario test");
for (const key of PROTECTED_FALSE_KEYS) assertIncludes(serviceTest, `"${key}"`, "Step195 protected false test key");

for (const snippet of [
  'capabilityStage: "contract_preflight_only"',
  "internalContractStatus",
  "metadataPreflightStatus",
  "executionPermissionStatus: AI_ML_CONTRACT_STATUS.BLOCKED",
  "dataAccessStatus: AI_ML_CONTRACT_STATUS.BLOCKED",
  "orderAuthorityStatus: AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER",
  "overallStatus",
  "passCount: statusCounts.pass",
  "blockedCount: statusCounts.blocked",
  "externalBlockerCount: statusCounts.external_blocker",
  "sourceCount: sourceRegistry.sourceCount",
  "requiredSourceCount: sourceRegistry.requiredSourceCount",
]) {
  assertIncludes(service, snippet, "Step195 output compatibility");
}

for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in Step195 service: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step195 service: ${snippet}`);
}

assert(!step201Checker.includes("\"server/src/services/tradingAiMlReadinessGateSummary.js\","), "Step201 checker still treats Step195 as unmigrated");
assert(!step210Checker.includes("\"server/src/services/tradingAiMlReadinessGateSummary.js\","), "Step210 checker still treats Step195 as untouched");
assertIncludes(checkerTest, "Step211 checker passes against repository source", "checker test self coverage");

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step211"), `Step211 marker must not leak into untouched file: ${file}`);
  assert(!source.includes("STEP195_METADATA_ONLY_ALLOWED_FLAGS"), `Step195 allowlist leaked into untouched file: ${file}`);
  assert(!source.includes("STEP195_ADDITIONAL_FALSE_FLAGS"), `Step195 false flags leaked into untouched file: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ReadinessGateSummary"), "Step211 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

execFileSync(process.execPath, ["scripts/check-trading-step195-ai-ml-readiness-gate-summary.cjs"], { stdio: "pipe" });

console.log("[check-trading-step211-ai-ml-contract-primitives-step195-pilot] ok");
