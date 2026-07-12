const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.cjs",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
];

const UNTOUCHED_SERVICE_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
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
  "export const STEP199_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({",
  "export const STEP199_ADDITIONAL_FALSE_FLAGS = Object.freeze({",
  "inheritedFlags: STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
  "allowedMetadataFlags: STEP199_METADATA_ONLY_ALLOWED_FLAGS",
  "additionalFalseFlags: STEP199_ADDITIONAL_FALSE_FLAGS",
  "adminReadOnlyHandoffEligibilityAllowed: true",
  "deterministicInMemoryHandoffPackageAllowed: true",
  "metadataOnlyApprovalRequirementDeclarationAllowed: true",
  "handoffPackageFileCreationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetFileCreationAllowed: false",
  "reviewReceiptPersistenceAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "waiverPersistenceAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelAutoApprovalAllowed: false",
  "readyForHandoffExecution: false",
  "readyForTargetPreflightExecution: false",
];

const REQUIRED_STATUS_VOCABULARY = [
  "AI_ML_CONTRACT_STATUS.BLOCKED",
  "AI_ML_CONTRACT_STATUS.DENIED",
  "AI_ML_CONTRACT_STATUS.NOT_GRANTED",
  "AI_ML_CONTRACT_STATUS.GENERATED_IN_MEMORY",
  "AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE",
  "AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER",
  "eligible_for_manual_review",
  "not_eligible",
  "handoff_candidate_ready_execution_blocked",
  "handoff_requirements_incomplete",
  "invalid_source_report",
  "blocked_by_safety_policy",
];

const REQUIRED_STAGE_SNIPPETS = [
  "AI_ML_STAGE_IDS.STEP_198_MANIFEST_VALIDATION_REPORT",
  "AI_ML_STAGE_IDS.STEP_199_MANIFEST_HANDOFF_ELIGIBILITY",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_valid_handoff_candidate",
  "scenario_b_invalid_source_report",
  "scenario_c_source_safety_block",
  "scenario_d_source_revision_required",
  "scenario_e_non_waivable_safety_exception",
  "scenario_f_missing_immutable_reference",
  "scenario_g_missing_approval_role",
  "scenario_h_approval_or_waiver_grant_attempt",
  "scenario_i_handoff_persistence_or_transmission_attempt",
  "scenario_j_target_preflight_execution_attempt",
  "scenario_k_external_authority_context",
  "scenario_l_deterministic_ordering",
  "scenario_m_mutation_resistance",
  "scenario_n_sensitive_data_redaction",
  "scenario_o_shared_flag_output_compatibility",
  "scenario_p_inherited_true_execution_conflict",
  "scenario_q_metadata_true_allowlist",
  "scenario_r_shared_helper_deterministic_compatibility",
  "scenario_s_full_default_output_compatibility",
  "scenario_t_input_mutation_resistance",
];

const REQUIRED_TEST_NAMES = [
  "Step202 scenario O shared flag output compatibility",
  "Step202 scenario P inherited true execution conflict",
  "Step202 scenario Q metadata true allowlist",
  "Step202 scenario R shared helper compatibility",
  "Step202 scenario S full default output remains compatible",
  "Step202 scenario T shared clone use prevents input mutation",
];

const FORBIDDEN_DUPLICATE_HELPERS = [
  "function safeArray",
  "function sortByKey",
  "function sanitizeMetadataValue",
  "function cloneMetadata",
  "localeCompare",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "handoffExecutionAllowed: true",
  "handoffTransmissionAllowed: true",
  "handoffPersistenceAllowed: true",
  "targetPreflightAuthorizationAllowed: true",
  "targetPreflightExecutionAllowed: true",
  "validationExecutionAllowed: true",
  "manifestExecutionAllowed: true",
  "dryRunExecutionAllowed: true",
  "datasetBuildAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "modelTrainingAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "readyForHandoffExecution: true",
  "readyForTargetPreflightExecution: true",
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

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlManifestHandoffEligibility.js");
const serviceTest = read("server/src/services/tradingAiMlManifestHandoffEligibility.test.js");
const checkerTest = read("scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs");

assertIncludes(packageJson, "\"check:trading-step202-ai-ml-contract-primitives-step199-pilot\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.cjs", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlManifestHandoffEligibility.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs", "package script");

for (const snippet of REQUIRED_PRIMITIVE_REFERENCES) assertIncludes(service, snippet, "Step199 shared primitive use");
for (const snippet of REQUIRED_FLAG_SNIPPETS) assertIncludes(service, snippet, "Step199 flag migration");
for (const snippet of REQUIRED_STATUS_VOCABULARY) assertIncludes(service, snippet, "Step199 status vocabulary");
for (const snippet of REQUIRED_STAGE_SNIPPETS) assertIncludes(service, snippet, "Step199 stage id use");
for (const snippet of REQUIRED_SCENARIOS) {
  assertIncludes(service, snippet, "Step199 scenario catalog");
  assertIncludes(serviceTest, snippet, "Step199 scenario test catalog");
}
for (const testName of REQUIRED_TEST_NAMES) assertIncludes(serviceTest, testName, "Step202 scenario test");

for (const helper of FORBIDDEN_DUPLICATE_HELPERS) {
  assert(!service.includes(helper), `duplicate helper remains in Step199 service: ${helper}`);
}
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in Step199 service: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!service.includes(snippet), `forbidden runtime implementation code in Step199 service: ${snippet}`);
}

for (const file of UNTOUCHED_SERVICE_FILES) {
  const source = read(file);
  assert(!source.includes("Step202"), `Step202 marker must not leak into untouched file: ${file}`);
  if (!file.endsWith("tradingAiMlContractPrimitives.js") && !file.endsWith("tradingAiMlContractPrimitives.test.js")) {
    assert(!source.includes("STEP199_METADATA_ONLY_ALLOWED_FLAGS"), `Step199 pilot flag allowlist leaked into: ${file}`);
    assert(!source.includes("STEP199_ADDITIONAL_FALSE_FLAGS"), `Step199 pilot false flags leaked into: ${file}`);
  }
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ManifestHandoffEligibility"), "Step202 must not add a runtime route");
}

assert(!service.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!service.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");
assertIncludes(checkerTest, "Step202 checker passes against repository source", "checker test self coverage");

console.log("[check-trading-step202-ai-ml-contract-primitives-step199-pilot] ok");
