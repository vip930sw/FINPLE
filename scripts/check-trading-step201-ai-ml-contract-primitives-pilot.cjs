const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
];

const UNTOUCHED_STEP_191_TO_198_SERVICE_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
];

const REQUIRED_EXPORTS = [
  "AI_ML_CONTRACT_STATUS",
  "AI_ML_STAGE_IDS",
  "AI_ML_COMMON_FAIL_CLOSED_FLAGS",
  "AI_ML_COMMON_READINESS_FALSE_FLAGS",
  "AI_ML_SENSITIVE_METADATA_PATTERNS",
  "buildAiMlFailClosedFlags",
  "sortAiMlMetadataByKey",
  "cloneAiMlMetadata",
  "sanitizeAiMlMetadataValue",
  "sanitizeAiMlMetadataArray",
  "normalizeAiMlMetadataArray",
];

const REQUIRED_STATUS_VALUES = [
  "BLOCKED: \"blocked\"",
  "DENIED: \"denied\"",
  "NOT_GRANTED: \"not_granted\"",
  "NOT_STARTED: \"not_started\"",
  "NOT_IMPLEMENTED: \"not_implemented\"",
  "NOT_ASSIGNED: \"not_assigned\"",
  "GENERATED_IN_MEMORY: \"generated_in_memory\"",
  "GENERATED_NOT_PERSISTED: \"generated_not_persisted\"",
  "METADATA_ONLY_NON_EXECUTABLE: \"metadata_only_non_executable\"",
  "ADMIN_ONLY: \"admin_only\"",
  "EXTERNAL_BLOCKER: \"external_blocker\"",
  "CONSOLIDATION_REQUIRED: \"consolidation_required\"",
  "CONSOLIDATE_BEFORE_RUNTIME: \"consolidate_before_runtime\"",
];

const REQUIRED_STAGE_VALUES = [
  "STEP_191_STRATEGY_MANAGEMENT: \"step191_strategy_management\"",
  "STEP_192_DATASET_LABELING_ARCHITECTURE: \"step192_dataset_labeling_architecture\"",
  "STEP_193_FEATURE_PIPELINE_ARCHITECTURE: \"step193_feature_pipeline_architecture\"",
  "STEP_194_FEATURE_PIPELINE_PREFLIGHT: \"step194_feature_pipeline_preflight\"",
  "STEP_195_READINESS_GATE_SUMMARY: \"step195_readiness_gate_summary\"",
  "STEP_196_BATCH_CONTRACT_REVIEW: \"step196_batch_contract_review\"",
  "STEP_197_DATASET_BUILD_MANIFEST: \"step197_dataset_build_manifest\"",
  "STEP_198_MANIFEST_VALIDATION_REPORT: \"step198_manifest_validation_report\"",
  "STEP_199_MANIFEST_HANDOFF_ELIGIBILITY: \"step199_manifest_handoff_eligibility\"",
];

const REQUIRED_FALSE_FLAGS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "datasetBuildAllowed: false",
  "batchExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
  "schemaMaterializationAllowed: false",
  "partitionMaterializationAllowed: false",
  "outputPathAssignmentAllowed: false",
  "validationExecutionAllowed: false",
  "manifestExecutionAllowed: false",
  "handoffExecutionAllowed: false",
  "targetPreflightExecutionAllowed: false",
  "dbMigrationAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "persistentStorageAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "kisTokenIssuanceAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "modelDeploymentAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForValidationExecution: false",
  "readyForManifestExecution: false",
  "readyForActualDataDownload: false",
  "readyForFeatureGeneration: false",
  "readyForDatasetBuild: false",
  "readyForBatchExecution: false",
  "readyForDryRunExecution: false",
  "readyForModelTraining: false",
  "readyForModelDeployment: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const REQUIRED_REDACTION_PATTERNS = [
  "api\\s*key",
  "secret",
  "token",
  "credential",
  "account\\s*id",
  "provider raw response",
  "environment value",
  "private path",
  "artifact path",
  "dataset path",
  "raw source code",
  "raw status payload",
  "hash",
  "digest",
  "checksum",
  "actual market data",
  "account data",
  "[A-Za-z]:\\\\",
  "\\\\\\\\",
];

const REQUIRED_SCENARIOS = [
  "Step201 scenario A default fail-closed flags",
  "Step201 scenario B inherited true conflict",
  "Step201 scenario C metadata-only allowlist",
  "Step201 scenario D fail-closed builder resists input mutation",
  "Step201 scenario E stage IDs stay deterministic",
  "Step201 scenario F sorting is deterministic",
  "Step201 scenario G sensitive value redaction",
  "Step201 scenario H benign metadata is preserved",
  "Step201 scenario I cloned metadata does not mutate source",
  "Step201 scenario J Step 200 default output remains compatible",
  "Step201 scenario K Step 200 fail-closed override",
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

for (const file of [...REQUIRED_FILES, ...UNTOUCHED_STEP_191_TO_198_SERVICE_FILES]) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const primitives = read("server/src/services/tradingAiMlContractPrimitives.js");
const primitivesTest = read("server/src/services/tradingAiMlContractPrimitives.test.js");
const step200Service = read("server/src/services/tradingAiMlArchitectureMilestoneReview.js");
const step200Test = read("server/src/services/tradingAiMlArchitectureMilestoneReview.test.js");
const step200CheckerTest = read("scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [primitives, step200Service].join("\n");
const combined = [packageJson, primitives, primitivesTest, step200Service, step200Test].join("\n");

assertIncludes(packageJson, "\"check:trading-step201-ai-ml-contract-primitives-pilot\"", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlContractPrimitives.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs", "package script");

for (const exportName of REQUIRED_EXPORTS) {
  assert(
    primitives.includes(`export const ${exportName}`)
      || primitives.includes(`export function ${exportName}`),
    `primitive export missing: ${exportName}`,
  );
}
for (const snippet of REQUIRED_STATUS_VALUES) assertIncludes(primitives, snippet, "status vocabulary");
for (const snippet of REQUIRED_STAGE_VALUES) assertIncludes(primitives, snippet, "stage identifier");
for (const snippet of REQUIRED_FALSE_FLAGS) assertIncludes(primitives, snippet, "fail-closed flag");
for (const snippet of REQUIRED_REDACTION_PATTERNS) assertIncludes(primitives, snippet, "redaction pattern");

assertIncludes(step200Service, "from \"./tradingAiMlContractPrimitives.js\"", "Step200 primitive import");
assertIncludes(step200Service, "buildAiMlFailClosedFlags({", "Step200 fail-closed builder");
assertIncludes(step200Service, "Object.values(AI_ML_STAGE_IDS)", "Step200 shared stage ids");
assertIncludes(step200Service, "sortAiMlMetadataByKey(stageInventory, \"stageId\")", "Step200 shared sorting");
assertIncludes(step200Service, "cloneAiMlMetadata(input)", "Step200 shared clone");
assertIncludes(step200Service, "sanitizeAiMlMetadataValue", "Step200 shared redaction");
assertIncludes(step200Service, "normalizeAiMlMetadataArray", "Step200 shared array normalization");
assertIncludes(step200Service, "falseFlagSnapshot", "Step200 false flag output snapshot");

for (const removedHelper of [
  "function safeArray",
  "function stableString",
  "function cloneMetadata",
  "function sortById",
  "localeCompare",
]) {
  assert(!step200Service.includes(removedHelper), `Step200 duplicate helper remains: ${removedHelper}`);
}

for (const file of UNTOUCHED_STEP_191_TO_198_SERVICE_FILES) {
  const source = read(file);
  assert(!source.includes("tradingAiMlContractPrimitives"), `Step191-198 service must not be migrated in Step201: ${file}`);
  assert(!source.includes("Step201"), `Step191-198 service must not know Step201: ${file}`);
}

for (const snippet of [
  "milestoneId: \"step200_ai_ml_architecture_milestone\"",
  "milestoneScope: \"step191_to_step199\"",
  "architectureChainStatus: \"contract_chain_complete\"",
  "safetyBoundaryStatus: \"fail_closed_consistent\"",
  "runtimeCapabilityStatus: AI_ML_CONTRACT_STATUS.NOT_IMPLEMENTED",
  "actualDataCapabilityStatus: AI_ML_CONTRACT_STATUS.BLOCKED",
  "executionReadinessStatus: AI_ML_CONTRACT_STATUS.BLOCKED",
  "maintenanceReviewStatus: AI_ML_CONTRACT_STATUS.CONSOLIDATION_REQUIRED",
  "nextPhaseDecision: AI_ML_CONTRACT_STATUS.CONSOLIDATE_BEFORE_RUNTIME",
  "overallStatus: \"architecture_milestone_complete_execution_blocked\"",
  "stageCoverage: `${stageInventory.length} / ${REQUIRED_STAGE_IDS.length}`",
  "nextRecommendedImplementation: \"shared_contract_primitives_design\"",
]) {
  assertIncludes(step200Service, snippet, "Step200 output compatibility");
}

for (const snippet of [
  "adminReadOnlyMilestoneReviewAllowed: true",
  "deterministicArchitectureInventoryAllowed: true",
  "deterministicConsolidationPlanningAllowed: true",
  "metadataOnlyRuntimePrerequisiteDeclarationAllowed: true",
]) {
  assertIncludes(step200Service, snippet, "metadata-only allowlist");
}
for (const forbiddenTrue of [
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "datasetBuildAllowed: true",
  "modelTrainingAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "runtimeCapabilityStatus: \"implemented\"",
  "executionReadinessStatus: \"ready\"",
  "nextPhaseDecision: \"execute_runtime\"",
]) {
  assert(!step200Service.includes(forbiddenTrue), `forbidden true or runtime-ready output in Step200 service: ${forbiddenTrue}`);
}

for (const scenario of REQUIRED_SCENARIOS) assertIncludes(primitivesTest, scenario, "deterministic scenario test");
assertIncludes(step200Test, "Object.values(AI_ML_STAGE_IDS)", "Step200 shared ID compatibility test");
assertIncludes(step200Test, "falseFlagSnapshot.providerCallsAllowed", "Step200 false snapshot test");
assertIncludes(step200CheckerTest, "check-trading-step200-ai-ml-architecture-milestone-review", "Step200 checker test linkage");

assert(!panel.includes("Step201"), "UI file must not be modified for Step201");
assert(!panel.includes("tradingAiMlContractPrimitives"), "UI must not import primitives");
assert(!css.includes("Step201"), "CSS file must not be modified for Step201");

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!runtime.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
}
assert(!combined.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!combined.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ContractPrimitives"), "Step201 must not add a runtime route");
}
for (const forbiddenMethod of ["router.post", "router.put", "router.patch", "router.delete", "app.post", "app.put", "app.patch", "app.delete"]) {
  assert(!primitives.includes(forbiddenMethod), `Step201 primitives must not add a mutating endpoint: ${forbiddenMethod}`);
  assert(!step200Service.includes(forbiddenMethod), `Step200 pilot must not add a mutating endpoint: ${forbiddenMethod}`);
}

console.log("[check-trading-step201-ai-ml-contract-primitives-pilot] ok");
