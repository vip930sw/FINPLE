const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step200-ai-ml-architecture-milestone-review.cjs",
  "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs",
];

const STEP_191_TO_199_SERVICE_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
];

const REQUIRED_EXPORTS = [
  "STEP200_AI_ML_ARCHITECTURE_MILESTONE_FLAGS",
  "TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL",
  "buildAiMlArchitectureMilestoneReview",
  "evaluateAiMlArchitectureMilestoneReview",
  "buildAdminTradingAiMlArchitectureMilestoneStatus",
  "collectAiMlMilestoneStageInventory",
  "buildAiMlMilestoneDependencyReview",
  "buildAiMlMilestoneSafetyReview",
  "buildAiMlMilestoneMaintenanceFindings",
  "buildAiMlMilestoneConsolidationPlan",
  "buildAiMlMilestoneRuntimePrerequisites",
  "deriveAiMlMilestoneOutcome",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlReadinessGateSummary.js",
  "tradingAiMlBatchContractReview.js",
  "tradingAiMlDatasetBuildDryRunManifest.js",
  "tradingAiMlManifestValidationReport.js",
  "tradingAiMlManifestHandoffEligibility.js",
  "buildAdminTradingAiMlReadinessGateStatus",
  "buildAdminTradingAiMlBatchContractReviewStatus",
  "buildAdminTradingAiMlDatasetBuildDryRunManifestStatus",
  "buildAdminTradingAiMlManifestValidationReportStatus",
  "buildAdminTradingAiMlManifestHandoffEligibilityStatus",
];

const REQUIRED_STAGE_IDS = [
  "step191_strategy_management",
  "step192_dataset_labeling_architecture",
  "step193_feature_pipeline_architecture",
  "step194_feature_pipeline_preflight",
  "step195_readiness_gate_summary",
  "step196_batch_contract_review",
  "step197_dataset_build_manifest",
  "step198_manifest_validation_report",
  "step199_manifest_handoff_eligibility",
];

const REQUIRED_REVIEW_SNIPPETS = [
  "all required stages present",
  "step order continuous",
  "no forward dependency",
  "no circular dependency",
  "source-of-truth direction preserved",
  "later stage does not mutate earlier stage",
  "later stage does not reimplement earlier validation",
  "admin shell includes each stage exactly once",
  "all execution and readiness flags false",
  "stage exposure remains admin_only",
];

const REQUIRED_FINDING_CATEGORIES = [
  "repeated_safety_flags",
  "repeated_status_vocabulary",
  "repeated_redaction_logic",
  "service_responsibility_growth",
  "checker_chain_growth",
  "admin_ui_density",
  "source_of_truth_depth",
  "runtime_gap",
  "external_authority_gap",
];

const REQUIRED_PLAN_ITEMS = [
  "step200_plan_01_shared_contract_primitives",
  "step200_plan_02_service_responsibility_split",
  "step200_plan_03_admin_ui_consolidation",
  "step200_plan_04_checker_consolidation",
  "step200_plan_05_runtime_entry_criteria",
  "executionStatus: \"not_started\"",
];

const REQUIRED_PREREQUISITES = [
  "data_source_legal_review",
  "provider_terms_review",
  "data_license_confirmation",
  "point_in_time_storage_design",
  "data_quality_acceptance_criteria",
  "feature_formula_review",
  "dataset_reproducibility_plan",
  "training_environment_selection",
  "model_risk_policy",
  "walk_forward_evaluation_plan",
  "shadow_inference_plan",
  "paper_trading_boundary",
  "kill_switch_design",
  "loss_limit_policy",
  "manual_approval_authority",
  "order_authority_external_clearance",
  "privacy_security_review",
  "cost_budget_approval",
];

const REQUIRED_SCENARIOS = [
  "scenario_a_current_step191_to_step199_chain",
  "scenario_b_missing_stage",
  "scenario_c_dependency_order_conflict",
  "scenario_d_safety_permission_conflict",
  "scenario_e_public_exposure_conflict",
  "scenario_f_runtime_falsely_marked_implemented",
  "scenario_g_consolidation_plan_coverage",
  "scenario_h_runtime_prerequisite_coverage",
  "scenario_i_deterministic_ordering",
  "scenario_j_mutation_resistance",
  "scenario_k_sensitive_data_redaction",
];

const REQUIRED_STATUS_SNIPPETS = [
  "architectureChainStatus: \"contract_chain_complete\"",
  "safetyBoundaryStatus: \"fail_closed_consistent\"",
  "runtimeCapabilityStatus: \"not_implemented\"",
  "actualDataCapabilityStatus: \"blocked\"",
  "executionReadinessStatus: \"blocked\"",
  "maintenanceReviewStatus: \"consolidation_required\"",
  "nextPhaseDecision: \"consolidate_before_runtime\"",
  "overallStatus: \"architecture_milestone_complete_execution_blocked\"",
  "invalid_milestone_source",
  "blocked_by_safety_policy",
  "milestone_review_requires_revision",
];

const REQUIRED_FALSE_SNIPPETS = [
  "architectureMutationAllowed: false",
  "automaticRefactorAllowed: false",
  "contractMigrationAllowed: false",
  "handoffExecutionAllowed: false",
  "targetPreflightExecutionAllowed: false",
  "validationExecutionAllowed: false",
  "manifestExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
  "datasetBuildAllowed: false",
  "modelTrainingAllowed: false",
  "providerCallsAllowed: false",
  "kisCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_STATUS_SNIPPETS = [
  "runtimeCapabilityStatus: \"implemented\"",
  "executionReadinessStatus: \"ready\"",
  "actualDataCapabilityStatus: \"enabled\"",
  "nextPhaseDecision: \"execute_runtime\"",
  "architectureMutationAllowed: true",
  "automaticRefactorAllowed: true",
  "handoffExecutionAllowed: true",
  "targetPreflightExecutionAllowed: true",
  "validationExecutionAllowed: true",
  "manifestExecutionAllowed: true",
  "dryRunExecutionAllowed: true",
  "datasetBuildAllowed: true",
  "modelTrainingAllowed: true",
  "providerCallsAllowed: true",
  "kisCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "liveTradingAllowed: true",
  "publicUiExposureAllowed: true",
  "myPageExposureAllowed: true",
];

const REQUIRED_UI_TEXT = [
  "architecture contract milestone only",
  "runtime is not implemented",
  "actual data access remains blocked",
  "feature and dataset execution remain blocked",
  "training and deployment remain blocked",
  "provider/KIS/order remain blocked",
  "consolidation required before runtime",
  "admin-only visibility",
  "high and critical findings",
  "top consolidation plan",
  "blocking prerequisites",
  "next-phase decision",
];

const FORBIDDEN_UI_TEXT = [
  "approval button",
  "waiver button",
  "handoff button",
  "runtime enable button",
  "provider connect button",
  "data download button",
  "dataset build button",
  "training button",
  "order button",
  "credential input",
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

for (const file of [...REQUIRED_FILES, ...STEP_191_TO_199_SERVICE_FILES]) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const service = read("server/src/services/tradingAiMlArchitectureMilestoneReview.js");
const serviceTest = read("server/src/services/tradingAiMlArchitectureMilestoneReview.test.js");
const step199Service = read("server/src/services/tradingAiMlManifestHandoffEligibility.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [service, shell, panel].join("\n");
const combined = [packageJson, service, serviceTest, shell, panel, css].join("\n");

assertIncludes(packageJson, "\"check:trading-step200-ai-ml-architecture-milestone-review\"", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs", "package script");

for (const snippet of REQUIRED_EXPORTS) assertIncludes(service, snippet, "service export");
for (const snippet of REQUIRED_SOURCE_REFERENCES) assertIncludes(service, snippet, "source-of-truth reference");
for (const snippet of REQUIRED_STAGE_IDS) assertIncludes(service, snippet, "stage inventory");
for (const snippet of REQUIRED_REVIEW_SNIPPETS) assertIncludes(service, snippet, "dependency or safety review");
for (const snippet of REQUIRED_FINDING_CATEGORIES) assertIncludes(service, snippet, "maintenance finding");
for (const snippet of REQUIRED_PLAN_ITEMS) assertIncludes(service, snippet, "consolidation plan");
for (const snippet of REQUIRED_PREREQUISITES) assertIncludes(service, snippet, "runtime prerequisite");
for (const snippet of REQUIRED_SCENARIOS) assertIncludes(service, snippet, "deterministic scenario");
for (const snippet of REQUIRED_STATUS_SNIPPETS) assertIncludes(service, snippet, "status snippet");
for (const snippet of REQUIRED_FALSE_SNIPPETS) assertIncludes(service, snippet, "false guard");
for (const snippet of FORBIDDEN_STATUS_SNIPPETS) assert(!service.includes(snippet), `forbidden status or true permission in service: ${snippet}`);

assert(!step199Service.includes("Step200"), "Step199 service must not be modified to know Step200");
assert(!step199Service.includes("ArchitectureMilestoneReview"), "Step199 service must not import or reference Step200");

assertIncludes(shell, "buildAdminTradingAiMlArchitectureMilestoneStatus", "dashboard shell status import");
assertIncludes(shell, "aiMlArchitectureMilestoneStatus", "dashboard shell status return");
assertIncludes(shell, "TRADING_AI_ML_ARCHITECTURE_MILESTONE_MODEL", "dashboard shell model");

assertIncludes(panel, "data-admin-panel-key=\"ai-ml-architecture-milestone-review\"", "admin panel key");
assert(panel.indexOf("ai-ml-architecture-milestone-review") < panel.indexOf("ai-ml-readiness-gate-summary"), "Step200 must precede Step195");
assert(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"), "Step195 must precede Step196");
assert(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"), "Step196 must precede Step197");
assert(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-manifest-validation-report"), "Step197 must precede Step198");
assert(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-manifest-handoff-eligibility"), "Step198 must precede Step199");
assert(panel.indexOf("ai-ml-manifest-handoff-eligibility") < panel.indexOf("ai-ml-strategy-management-console"), "Step199 must precede Step191 details");
for (const snippet of REQUIRED_UI_TEXT) assertIncludes(panel, snippet, "Step200 UI warning text");
for (const snippet of FORBIDDEN_UI_TEXT) assert(!panel.includes(snippet), `forbidden Step200 UI affordance: ${snippet}`);

for (const selector of [
  ".tradingLabAiMlArchitectureMilestoneReview",
  ".tradingLabAiMlArchitectureMilestoneBody",
  ".tradingLabAiMlArchitectureMilestoneStatusGrid",
  ".tradingLabAiMlArchitectureMilestoneContractGrid",
]) {
  assertIncludes(css, selector, "Step200 CSS selector");
}

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!runtime.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
}

assert(!combined.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!combined.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ArchitectureMilestoneReview"), "Step200 must not add a runtime route");
}
for (const forbiddenMethod of ["router.post", "router.put", "router.patch", "router.delete", "app.post", "app.put", "app.patch", "app.delete"]) {
  assert(!service.includes(forbiddenMethod), `Step200 service must not add a mutating endpoint: ${forbiddenMethod}`);
}

for (const file of STEP_191_TO_199_SERVICE_FILES) {
  const lines = read(file).split(/\r?\n/).length;
  const level = lines >= 800 ? "split strongly recommended" : lines >= 500 ? "review recommended" : "ok";
  console.log(`[check-trading-step200-ai-ml-architecture-milestone-review] maintenance signal ${file} lines=${lines} ${level}`);
}

console.log("[check-trading-step200-ai-ml-architecture-milestone-review] ok");
