const fs = require("node:fs");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlBatchContractReview.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.cjs",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
];

const REQUIRED_EXPORTS = [
  "STEP196_AI_ML_BATCH_CONTRACT_REVIEW_FLAGS",
  "TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL",
  "buildAiMlBatchContractReview",
  "evaluateAiMlBatchContractReview",
  "buildAdminTradingAiMlBatchContractReviewStatus",
  "createDeterministicMockBatchContractRequest",
  "collectBatchContractUpstreamStatuses",
  "buildBatchContractReviewChecks",
  "deriveBatchContractReviewOutcome",
  "buildBatchContractApprovalChecklist",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlReadinessGateSummary.js",
  "tradingAiMlFeaturePipelinePreflight.js",
  "buildAiMlReadinessGateSummary",
  "buildAiMlFeaturePipelinePreflight",
  "capabilityStage",
  "internalContractStatus",
  "metadataPreflightStatus",
  "executionPermissionStatus",
  "orderAuthorityStatus",
  "liveTradingStatus",
  "overallStatus",
  "nextSafeImplementationStep",
];

const REQUIRED_REQUEST_SECTIONS = [
  "requestIdentity",
  "upstreamContractReferences",
  "batchPurpose",
  "targetUniverseDeclaration",
  "predictionSchedule",
  "temporalBoundaries",
  "featureSetReference",
  "labelSpecReference",
  "datasetSpecReference",
  "splitPolicyReference",
  "normalizationPolicyReference",
  "qualityPolicyReference",
  "inputSourceDeclarations",
  "partitionPlanDeclaration",
  "outputPlanDeclaration",
  "retentionPolicyDeclaration",
  "resourceBudgetDeclaration",
  "ownershipAndReview",
  "rollbackAndCancellationPlan",
  "executionIntent",
];

const REQUIRED_CATEGORIES = [
  "upstream_readiness",
  "request_identity",
  "version_pinning",
  "batch_purpose",
  "target_universe",
  "prediction_schedule",
  "temporal_boundaries",
  "point_in_time_and_leakage",
  "feature_label_dataset_compatibility",
  "input_source_declarations",
  "partition_plan",
  "output_plan_restrictions",
  "data_governance_and_retention",
  "resource_budget_declaration",
  "ownership_and_review",
  "rollback_and_cancellation",
  "prohibited_execution_intent",
  "external_authority_context",
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
];

const REQUIRED_STATUS_SNIPPETS = [
  "reviewEligibilityStatus",
  "eligible_for_manual_review",
  "approvalStatus: \"not_granted\"",
  "approvalScope: \"dry_run_manifest_design_only\"",
  "executionAuthorizationStatus: \"denied\"",
  "batchExecutionStatus: \"blocked\"",
  "outputCreationStatus: \"blocked\"",
  "outputPathStatus: \"not_assigned\"",
  "fileCreationAuthorization: \"denied\"",
  "review_ready_execution_blocked",
  "invalid_upstream_contract",
  "blocked_by_safety_policy",
  "contract_needs_revision",
];

const REQUIRED_FALSE_SNIPPETS = [
  "actualDataDownloadAllowed: false",
  "featureGenerationAllowed: false",
  "featureFileCreationAllowed: false",
  "datasetBuildAllowed: false",
  "datasetFileCreationAllowed: false",
  "batchExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
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
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "manualApprovalPersistenceAllowed: false",
  "executionAuthorizationAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForActualDataDownload: false",
  "readyForFeatureGeneration: false",
  "readyForDatasetBuild: false",
  "readyForBatchExecution: false",
  "readyForModelTraining: false",
  "readyForModelDeployment: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "approvalStatus: \"approved\"",
  "executionAuthorizationStatus: \"granted\"",
  "batchExecutionAllowed: true",
  "dryRunExecutionAllowed: true",
  "actualDataDownloadAllowed: true",
  "featureGenerationAllowed: true",
  "datasetBuildAllowed: true",
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
  "manualApprovalPersistenceAllowed: true",
];

const FORBIDDEN_EXECUTION_CODE = [
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

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlBatchContractReview.js");
const serviceTest = read("server/src/services/tradingAiMlBatchContractReview.test.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [service, shell, panel].join("\n");
const combined = [service, serviceTest, shell, panel, css, packageJson].join("\n");

assert(packageJson.includes("\"check:trading-step196-ai-ml-batch-contract-review\""), "package script missing");
assert(packageJson.includes("server/src/services/tradingAiMlBatchContractReview.test.js"), "service test not wired");
assert(packageJson.includes("scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs"), "checker test not wired");
assert(packageJson.includes("scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs"), "Step195 checker test coupling missing");

for (const snippet of REQUIRED_EXPORTS) assert(service.includes(snippet), `missing export/helper: ${snippet}`);
for (const snippet of REQUIRED_SOURCE_REFERENCES) assert(service.includes(snippet), `missing source reference: ${snippet}`);
for (const snippet of REQUIRED_REQUEST_SECTIONS) assert(service.includes(snippet), `missing request section: ${snippet}`);
for (const snippet of REQUIRED_CATEGORIES) assert(service.includes(snippet), `missing review category: ${snippet}`);
for (const snippet of REQUIRED_SCENARIOS) assert(service.includes(snippet) && serviceTest.includes(snippet), `missing scenario: ${snippet}`);
for (const snippet of REQUIRED_STATUS_SNIPPETS) assert(service.includes(snippet), `missing status snippet: ${snippet}`);
for (const snippet of REQUIRED_FALSE_SNIPPETS) assert(service.includes(snippet), `missing fail-closed snippet: ${snippet}`);
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) assert(!service.includes(snippet), `forbidden true/granted status in service: ${snippet}`);
for (const snippet of FORBIDDEN_EXECUTION_CODE) assert(!runtime.includes(snippet), `forbidden execution code found: ${snippet}`);

assert(shell.includes("buildAdminTradingAiMlBatchContractReviewStatus"), "dashboard shell missing Step196 builder");
assert(shell.includes("aiMlBatchContractReviewStatus"), "dashboard shell missing Step196 output");
assert(shell.includes("TRADING_AI_ML_BATCH_CONTRACT_REVIEW_MODEL"), "dashboard shell missing Step196 model");

assert(panel.includes("data-admin-panel-key=\"ai-ml-readiness-gate-summary\""), "Step195 panel missing");
assert(panel.includes("data-admin-panel-key=\"ai-ml-batch-contract-review\""), "Step196 admin panel missing");
assert(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"), "Step196 panel must follow Step195 summary");
assert(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-strategy-management-console"), "Step196 panel must precede Step191 detail panel");
assert(panel.includes("metadata-only contract review"), "Step196 panel missing metadata-only warning");
assert(panel.includes("manual approval not granted"), "Step196 panel missing approval boundary");
assert(panel.includes("approval scope is manifest design only"), "Step196 panel missing scope warning");
assert(panel.includes("batch execution blocked"), "Step196 panel missing batch blocked text");
assert(panel.includes("output creation blocked"), "Step196 panel missing output blocked text");
assert(panel.includes("DB/provider/KIS access blocked"), "Step196 panel missing provider blocked text");
assert(panel.includes("training and deployment blocked"), "Step196 panel missing training blocked text");
assert(panel.includes("order and live trading blocked"), "Step196 panel missing order/live blocked text");
assert(panel.includes("ai-ml-strategy-management-console"), "Step191 detail panel missing");
assert(panel.includes("ai-ml-dataset-labeling-architecture"), "Step192 detail panel missing");
assert(panel.includes("ai-ml-feature-pipeline-architecture"), "Step193 detail panel missing");
assert(panel.includes("ai-ml-feature-pipeline-preflight"), "Step194 detail panel missing");
assert(!panel.includes("<button") || !panel.includes("ai-ml-batch-contract-review-button"), "Step196 must not add approval or execution buttons");
assert(!panel.includes("mypageAiMlBatch"), "unexpected My Page batch exposure marker");
assert(!panel.includes("publicAiMlBatch"), "unexpected public batch exposure marker");

assert(css.includes(".tradingLabAiMlBatchContractReview"), "CSS missing Step196 class");
assert(css.includes(".tradingLabAiMlBatchReviewStatusGrid"), "CSS missing Step196 status grid");
assert(css.includes(".tradingLabAiMlBatchReviewChecklistGrid"), "CSS missing Step196 checklist grid");

const routeFiles = fs.readdirSync("server/src/routes").join("\n");
assert(!routeFiles.includes("aiMlBatchContract"), "new runtime endpoint route detected");
assert(!combined.includes("scenario_monthly_returns.csv"), "scenario monthly returns file reference should not be added");
assert(!combined.includes("calculatePortfolioResult"), "portfolio calculation logic should remain untouched");

console.log("[check-trading-step196-ai-ml-batch-contract-review] ok");
