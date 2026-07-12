const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.cjs",
  "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
];

const REQUIRED_EXPORTS = [
  "STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
  "TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL",
  "buildAiMlDatasetBuildDryRunManifest",
  "evaluateAiMlDatasetBuildDryRunManifest",
  "buildAdminTradingAiMlDatasetBuildDryRunManifestStatus",
  "createDeterministicMockDatasetBuildManifestRequest",
  "collectDatasetBuildManifestUpstreamStatuses",
  "buildDatasetBuildManifestSections",
  "buildDatasetBuildManifestValidationChecks",
  "deriveDatasetBuildManifestOutcome",
  "buildDatasetBuildManifestReviewReceipt",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlBatchContractReview.js",
  "tradingAiMlReadinessGateSummary.js",
  "buildAiMlBatchContractReview",
  "buildAiMlReadinessGateSummary",
  "review_ready_execution_blocked",
  "internal_contracts_valid_execution_blocked",
  "orderAuthorityStatus",
  "liveTradingStatus",
];

const REQUIRED_MANIFEST_SECTIONS = [
  "manifestIdentity",
  "upstreamReviewReference",
  "datasetContractReference",
  "featureSetReference",
  "labelSpecReference",
  "splitPolicyReference",
  "normalizationPolicyReference",
  "qualityPolicyReference",
  "sourceMappingReference",
  "logicalInputInventory",
  "temporalBoundaryPlan",
  "logicalPartitionPlan",
  "logicalSchemaPlan",
  "logicalOutputPlan",
  "qualityValidationPlan",
  "lineagePlan",
  "governanceAndRetentionPlan",
  "resourceEnvelope",
  "reviewReceiptRequest",
  "executionIntent",
];

const REQUIRED_CATEGORIES = [
  "upstream_batch_contract_review",
  "manifest_identity",
  "contract_reference_pinning",
  "logical_input_inventory",
  "temporal_boundary_plan",
  "logical_partition_plan",
  "logical_schema_plan",
  "logical_output_restrictions",
  "quality_validation_plan",
  "lineage_plan",
  "governance_and_retention",
  "resource_envelope",
  "review_receipt_boundary",
  "execution_boundary",
  "external_authority_context",
  "prohibited_execution_intent",
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
];

const REQUIRED_STATUS_SNIPPETS = [
  "manifestMode: \"metadata_only_non_executable\"",
  "manifestDesignStatus: \"complete\"",
  "reviewReceiptStatus: \"generated_not_persisted\"",
  "reviewDecision: \"design_contract_record_only\"",
  "approvalStatus: \"not_granted\"",
  "approvalScope: \"dry_run_manifest_design_only\"",
  "executionAuthorizationStatus: \"denied\"",
  "dryRunExecutionStatus: \"blocked\"",
  "materializationStatus: \"blocked\"",
  "outputCreationStatus: \"blocked\"",
  "outputPathStatus: \"not_assigned\"",
  "manifest_design_ready_execution_blocked",
  "invalid_upstream_review",
  "blocked_by_safety_policy",
  "manifest_needs_revision",
];

const REQUIRED_FALSE_SNIPPETS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "batchExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
  "manifestFileCreationAllowed: false",
  "schemaMaterializationAllowed: false",
  "partitionMaterializationAllowed: false",
  "outputPathAssignmentAllowed: false",
  "pythonFeatureJobAllowed: false",
  "modelTrainingAllowed: false",
  "modelArtifactCreationAllowed: false",
  "modelDeploymentAllowed: false",
  "modelAutoApprovalAllowed: false",
  "dbMigrationAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "persistentStorageAllowed: false",
  "providerCallsAllowed: false",
  "quoteCallsAllowed: false",
  "kisCallsAllowed: false",
  "kisTokenIssuanceAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "reviewReceiptPersistenceAllowed: false",
  "executionAuthorizationAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForDryRunExecution: false",
  "readyForSchemaMaterialization: false",
  "readyForPartitionMaterialization: false",
  "readyForModelTraining: false",
  "readyForModelDeployment: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "dryRunExecutionAllowed: true",
  "manifestFileCreationAllowed: true",
  "schemaMaterializationAllowed: true",
  "partitionMaterializationAllowed: true",
  "outputPathAssignmentAllowed: true",
  "datasetBuildAllowed: true",
  "datasetFileCreationAllowed: true",
  "modelTrainingAllowed: true",
  "modelDeploymentAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
  "reviewReceiptPersistenceAllowed: true",
  "executionAuthorizationAllowed: true",
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

const FORBIDDEN_NONDETERMINISM = [
  "Date.now(",
  "new Date(",
  "performance.now(",
  "Math.random(",
  "randomUUID(",
  "node:crypto",
  "createHash(",
  ".digest(",
];

const REQUIRED_UI_TEXT = [
  "metadata-only non-executable manifest",
  "review receipt is not an approval",
  "manifest is not persisted or downloadable",
  "dry-run execution blocked",
  "schema and partition materialization blocked",
  "output path not assigned",
  "dataset and file creation blocked",
  "DB/provider/KIS access blocked",
  "training and deployment blocked",
  "order and live trading blocked",
  "admin-only visibility",
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
const service = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.js");
const serviceTest = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [service, shell, panel].join("\n");
const combined = [packageJson, service, serviceTest, shell, panel, css].join("\n");

assertIncludes(packageJson, "\"check:trading-step197-ai-ml-dataset-build-dry-run-manifest\"", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs", "package script");

for (const snippet of REQUIRED_EXPORTS) assertIncludes(service, snippet, "service export");
for (const snippet of REQUIRED_SOURCE_REFERENCES) assertIncludes(service, snippet, "upstream source reference");
for (const snippet of REQUIRED_MANIFEST_SECTIONS) assertIncludes(service, snippet, "manifest section");
for (const snippet of REQUIRED_CATEGORIES) assertIncludes(service, snippet, "validation category");
for (const snippet of REQUIRED_SCENARIOS) assertIncludes(service, snippet, "scenario");
for (const snippet of REQUIRED_STATUS_SNIPPETS) assertIncludes(service, snippet, "status snippet");
for (const snippet of REQUIRED_FALSE_SNIPPETS) assertIncludes(service, snippet, "false guard");
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in service: ${snippet}`);
}

assertIncludes(service, "detectReviewReceiptBoundaryAttempt", "receipt boundary attempt guard");
assertIncludes(service, "attemptsApproval", "receipt approval attempt guard");
assertIncludes(service, "attemptsPersistence", "receipt persistence attempt guard");
assertIncludes(service, "attemptsExecutionAuthority", "receipt execution authority attempt guard");

assertIncludes(shell, "buildAdminTradingAiMlDatasetBuildDryRunManifestStatus", "dashboard shell status import");
assertIncludes(shell, "aiMlDatasetBuildDryRunManifestStatus", "dashboard shell status return");
assertIncludes(shell, "TRADING_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_MODEL", "dashboard shell model");

assertIncludes(panel, "data-admin-panel-key=\"ai-ml-dataset-build-dry-run-manifest\"", "admin panel key");
assert(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"), "Step195 panel must precede Step196");
assert(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"), "Step196 panel must precede Step197");
assert(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-strategy-management-console"), "Step197 panel must precede Step191 details");
for (const snippet of REQUIRED_UI_TEXT) assertIncludes(panel, snippet, "Step197 UI warning text");
for (const selector of [
  ".tradingLabAiMlDatasetBuildDryRunManifest",
  ".tradingLabAiMlDatasetBuildManifestStatusGrid",
  ".tradingLabAiMlDatasetBuildManifestContractGrid",
  ".tradingLabAiMlDatasetBuildManifestCheckGrid",
  ".tradingLabAiMlDatasetBuildManifestSafetyGrid",
]) {
  assertIncludes(css, selector, "Step197 CSS selector");
}

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!runtime.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
}
for (const snippet of FORBIDDEN_NONDETERMINISM) {
  assert(!runtime.includes(snippet), `forbidden nondeterminism or digest generation code: ${snippet}`);
}

assert(!combined.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!combined.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");
assert(!panel.includes("manifest download"), "Step197 UI must not expose manifest download affordance");
assert(!panel.includes("execute dry-run"), "Step197 UI must not expose dry-run execution affordance");
assert(!panel.includes("approval input"), "Step197 UI must not expose approval input affordance");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("DatasetBuildDryRunManifest"), "Step197 must not add a runtime route");
}
for (const forbiddenMethod of ["router.post", "router.put", "router.patch", "router.delete", "app.post", "app.put", "app.patch", "app.delete"]) {
  assert(!service.includes(forbiddenMethod), `Step197 service must not add a mutating endpoint: ${forbiddenMethod}`);
}

console.log("[check-trading-step197-ai-ml-dataset-build-dry-run-manifest] ok");
