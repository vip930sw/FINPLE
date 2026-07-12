const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestValidationReport.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step198-ai-ml-manifest-validation-report.cjs",
  "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
];

const REQUIRED_EXPORTS = [
  "STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
  "TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL",
  "buildAiMlManifestValidationReport",
  "evaluateAiMlManifestValidationReport",
  "buildAdminTradingAiMlManifestValidationReportStatus",
  "collectManifestValidationSource",
  "buildManifestValidationSummary",
  "buildManifestExceptionRegistry",
  "buildManifestNonWaivableRegistry",
  "buildManifestRemediationQueue",
  "deriveManifestValidationReportOutcome",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlDatasetBuildDryRunManifest.js",
  "STEP197_AI_ML_DATASET_BUILD_DRY_RUN_MANIFEST_FLAGS",
  "buildAiMlDatasetBuildDryRunManifest",
  "buildAdminTradingAiMlDatasetBuildDryRunManifestStatus",
  "validationChecks",
  "validationCategories",
  "manifest_design_ready_execution_blocked",
];

const REQUIRED_REPORT_SECTIONS = [
  "reportIdentity",
  "sourceManifestReference",
  "validationSummary",
  "exceptionRegistry",
  "nonWaivableRegistry",
  "remediationQueue",
  "boundaryConfirmation",
  "externalAuthorityContext",
  "reportStatus",
];

const REQUIRED_STATUS_SNIPPETS = [
  "reportMode: \"metadata_only_non_executable\"",
  "reportGenerationStatus: \"generated_in_memory\"",
  "sourceManifestStatus: \"manifest_design_ready_execution_blocked\"",
  "exceptionRegistryStatus: \"generated_not_persisted\"",
  "remediationQueueStatus: \"generated_not_persisted\"",
  "reportPersistenceStatus: \"blocked\"",
  "approvalStatus: \"not_granted\"",
  "waiverStatus: \"not_granted\"",
  "executionAuthorizationStatus: \"denied\"",
  "handoffAuthorizationStatus: \"denied\"",
  "validation_report_ready_execution_blocked",
  "invalid_source_manifest",
  "blocked_by_safety_policy",
  "manifest_exceptions_require_revision",
];

const REQUIRED_FALSE_SNIPPETS = [
  "validationExecutionAllowed: false",
  "manifestExecutionAllowed: false",
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "batchExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
  "manifestFileCreationAllowed: false",
  "reportFileCreationAllowed: false",
  "schemaMaterializationAllowed: false",
  "partitionMaterializationAllowed: false",
  "outputPathAssignmentAllowed: false",
  "reportPersistenceAllowed: false",
  "exceptionPersistenceAllowed: false",
  "remediationPersistenceAllowed: false",
  "reviewReceiptPersistenceAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "waiverGrantAllowed: false",
  "waiverPersistenceAllowed: false",
  "executionAuthorizationAllowed: false",
  "handoffExecutionAllowed: false",
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
  "modelArtifactCreationAllowed: false",
  "modelDeploymentAllowed: false",
  "modelAutoApprovalAllowed: false",
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
  "readyForSchemaMaterialization: false",
  "readyForPartitionMaterialization: false",
  "readyForModelTraining: false",
  "readyForModelDeployment: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "validationExecutionAllowed: true",
  "manifestExecutionAllowed: true",
  "reportFileCreationAllowed: true",
  "reportPersistenceAllowed: true",
  "exceptionPersistenceAllowed: true",
  "remediationPersistenceAllowed: true",
  "waiverGrantAllowed: true",
  "waiverPersistenceAllowed: true",
  "approvalStatus: \"approved\"",
  "waiverStatus: \"granted\"",
  "executionAuthorizationStatus: \"granted\"",
  "handoffAuthorizationStatus: \"granted\"",
  "dryRunExecutionAllowed: true",
  "schemaMaterializationAllowed: true",
  "partitionMaterializationAllowed: true",
  "outputPathAssignmentAllowed: true",
  "dbReadAllowed: true",
  "dbWriteAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
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
];

const REQUIRED_UI_TEXT = [
  "metadata-only validation report",
  "source manifest was not executed",
  "exceptions are not waivers",
  "no exception grants approval or execution",
  "report and exception registry are not persisted",
  "dry-run and materialization remain blocked",
  "DB/provider/KIS access blocked",
  "training and deployment blocked",
  "order and live trading blocked",
  "admin-only visibility",
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
const service = read("server/src/services/tradingAiMlManifestValidationReport.js");
const serviceTest = read("server/src/services/tradingAiMlManifestValidationReport.test.js");
const step197Service = read("server/src/services/tradingAiMlDatasetBuildDryRunManifest.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [service, shell, panel].join("\n");
const combined = [packageJson, service, serviceTest, shell, panel, css].join("\n");

assertIncludes(packageJson, "\"check:trading-step198-ai-ml-manifest-validation-report\"", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlManifestValidationReport.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs", "package script");

for (const snippet of REQUIRED_EXPORTS) assertIncludes(service, snippet, "service export");
for (const snippet of REQUIRED_SOURCE_REFERENCES) assertIncludes(service, snippet, "Step197 source reference");
for (const snippet of REQUIRED_REPORT_SECTIONS) assertIncludes(service, snippet, "report section");
for (const snippet of REQUIRED_STATUS_SNIPPETS) assertIncludes(service, snippet, "status snippet");
for (const snippet of REQUIRED_FALSE_SNIPPETS) assertIncludes(service, snippet, "false guard");
for (const snippet of REQUIRED_SCENARIOS) assertIncludes(service, snippet, "scenario");
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in service: ${snippet}`);
}

for (const snippet of [
  "exceptionId: `step198_exception_${check.checkId}`",
  "sourceCheckId",
  "exceptionClass",
  "waiverEligibility",
  "waiverStatus",
  "dispositionStatus",
  "ownerRole",
  "nonWaivableReason",
  "doesNotGrantApproval: true",
  "doesNotGrantExecution: true",
  "remediationItemId: `step198_remediation_${exception.sourceCheckId}`",
  "completionStatus: \"not_started\"",
  "persistenceStatus: \"not_persisted\"",
  "executionStatus: \"not_executed\"",
]) {
  assertIncludes(service, snippet, "registry/remediation structure");
}

assert(!step197Service.includes("Step198"), "Step197 service must not be modified to know Step198");
assert(!step197Service.includes("ManifestValidationReport"), "Step197 service must not import or reference Step198");

assertIncludes(shell, "buildAdminTradingAiMlManifestValidationReportStatus", "dashboard shell status import");
assertIncludes(shell, "aiMlManifestValidationReportStatus", "dashboard shell status return");
assertIncludes(shell, "TRADING_AI_ML_MANIFEST_VALIDATION_REPORT_MODEL", "dashboard shell model");

assertIncludes(panel, "data-admin-panel-key=\"ai-ml-manifest-validation-report\"", "admin panel key");
assert(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"), "Step195 must precede Step196");
assert(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"), "Step196 must precede Step197");
assert(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-manifest-validation-report"), "Step197 must precede Step198");
assert(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-strategy-management-console"), "Step198 must precede Step191 details");
for (const snippet of REQUIRED_UI_TEXT) assertIncludes(panel, snippet, "Step198 UI warning text");
for (const selector of [
  ".tradingLabAiMlManifestValidationReport",
  ".tradingLabAiMlManifestValidationStatusGrid",
  ".tradingLabAiMlManifestValidationContractGrid",
  ".tradingLabAiMlManifestValidationCheckGrid",
  ".tradingLabAiMlManifestValidationSafetyGrid",
]) {
  assertIncludes(css, selector, "Step198 CSS selector");
}

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!runtime.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
}
for (const forbiddenUi of [
  "report download",
  "report save",
  "exception edit",
  "waiver button",
  "approval button",
  "execution button",
  "handoff button",
  "manifest execution button",
  "credential input",
]) {
  assert(!panel.includes(forbiddenUi), `forbidden Step198 UI affordance: ${forbiddenUi}`);
}

assert(!combined.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!combined.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ManifestValidationReport"), "Step198 must not add a runtime route");
}
for (const forbiddenMethod of ["router.post", "router.put", "router.patch", "router.delete", "app.post", "app.put", "app.patch", "app.delete"]) {
  assert(!service.includes(forbiddenMethod), `Step198 service must not add a mutating endpoint: ${forbiddenMethod}`);
}

console.log("[check-trading-step198-ai-ml-manifest-validation-report] ok");
