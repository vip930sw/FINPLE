const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs",
  "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs",
  "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs",
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
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
];

const REQUIRED_OUTPUT_MARKERS = [
  'manifestMode: "metadata_only_non_executable"',
  'manifestDesignStatus: "complete"',
  'reviewReceiptStatus: "generated_not_persisted"',
  'reviewDecision: "design_contract_record_only"',
  'approvalStatus: "not_granted"',
  'approvalScope: "dry_run_manifest_design_only"',
  'executionAuthorizationStatus: "denied"',
  'dryRunExecutionStatus: "blocked"',
  'materializationStatus: "blocked"',
  'outputCreationStatus: "blocked"',
  'outputPathStatus: "not_assigned"',
  "manifest_design_ready_execution_blocked",
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

const PROTECTED_FALSE_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "datasetBuildAllowed",
  "dryRunExecutionAllowed",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "readyForLiveGuardedTrading",
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
];

const OBJECT_FREEZE_OBJECT_PATTERN = /Object\.freeze\(\{[\s\S]*?\n\}\);/g;

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
const service = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.js");
const serviceTest = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js");
const step208Checker = read("scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs");
const step209CheckerTest = read("scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs");

assertIncludes(packageJson, "\"check:trading-step209-step197-legacy-flag-cleanup\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step209-step197-legacy-flag-cleanup.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step209-step197-legacy-flag-cleanup.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step207-ai-ml-contract-primitives-step198-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package script");

assertIncludes(service, "buildAiMlFailClosedFlags({", "Step197 shared builder");
assertIncludes(service, "export const STEP197_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({", "Step197 metadata allowlist");
assertIncludes(service, "export const STEP197_ADDITIONAL_FALSE_FLAGS = Object.freeze({", "Step197 additional false flags");
assertIncludes(service, "export const STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS = buildAiMlFailClosedFlags({", "Step197 single flag export");
assertIncludes(service, "STEP197_STATIC_COMPATIBILITY_MARKERS", "Step197 compatibility marker");

assert(count(service, /export const STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS/g) === 1, "Step197 flag export must be defined exactly once");
assert(count(service, /buildAiMlFailClosedFlags\(/g) === 1, "Step197 service must call buildAiMlFailClosedFlags exactly once");
assert(!service.includes("...STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS"), "legacy spread flag definition remains");
const objectFreezeObjects = service.match(OBJECT_FREEZE_OBJECT_PATTERN) || [];
assert(
  !objectFreezeObjects.some((block) => PROTECTED_FALSE_KEYS.every((key) => block.includes(`${key}: false`))),
  "legacy anonymous full false-flag Object.freeze block remains",
);

for (const key of PROTECTED_FALSE_KEYS) {
  assert(service.includes(`"${key}: false"`), `compatibility marker missing protected key: ${key}`);
  assert(!service.includes(`${key}: true`), `protected key enabled: ${key}`);
}
for (const snippet of REQUIRED_OUTPUT_MARKERS) assertIncludes(service, snippet, "Step197 output marker");
for (const scenario of REQUIRED_SCENARIOS) {
  assertIncludes(service, scenario, "Step197 scenario catalog");
  assertIncludes(serviceTest, scenario, "Step197 scenario test catalog");
}

assertIncludes(step208Checker, "LEGACY_FULL_FALSE_OBJECT_KEYS", "Step208 legacy duplicate assertion");
assertIncludes(step208Checker, "legacy anonymous full false-flag Object.freeze block remains", "Step208 legacy duplicate failure message");
assertIncludes(step208Checker, "buildAiMlFailClosedFlags exactly once", "Step208 single builder assertion");
assertIncludes(step208Checker, "Step197 flag export must be defined exactly once", "Step208 single flag export assertion");
assertIncludes(step208Checker, "...STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS", "Step208 legacy spread assertion");
assertIncludes(step209CheckerTest, "Step209 checker passes against repository source", "Step209 checker test self coverage");

execFileSync(process.execPath, ["scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs"], {
  stdio: "pipe",
});

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step209"), `Step209 marker must not leak into untouched file: ${file}`);
  assert(!source.includes("STEP209"), `STEP209 marker must not leak into untouched file: ${file}`);
}

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step197 service: ${snippet}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("DatasetBuildDryRunManifest"), "Step209 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

console.log("[check-trading-step209-step197-legacy-flag-cleanup] ok");
