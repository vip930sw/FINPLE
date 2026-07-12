const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.cjs",
  "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
];

const REQUIRED_EXPORTS = [
  "STEP199_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_FLAGS",
  "TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL",
  "buildAiMlManifestHandoffEligibility",
  "evaluateAiMlManifestHandoffEligibility",
  "buildAdminTradingAiMlManifestHandoffEligibilityStatus",
  "collectManifestHandoffSource",
  "buildManifestHandoffReferenceSet",
  "buildManifestHandoffEligibilityChecks",
  "buildManifestHandoffApprovalRequirements",
  "buildManifestHandoffPackage",
  "deriveManifestHandoffOutcome",
];

const REQUIRED_SOURCE_REFERENCES = [
  "tradingAiMlManifestValidationReport.js",
  "STEP198_AI_ML_MANIFEST_VALIDATION_REPORT_FLAGS",
  "buildAiMlManifestValidationReport",
  "buildAdminTradingAiMlManifestValidationReportStatus",
  "reportIdentity",
  "sourceManifestReference",
  "exceptionRegistry",
  "nonWaivableRegistry",
  "remediationQueue",
  "boundaryConfirmation",
  "externalAuthorityContext",
  "reportStatus",
  "validation_report_ready_execution_blocked",
];

const REQUIRED_PACKAGE_SECTIONS = [
  "handoffPackageIdentity",
  "sourceReferenceSet",
  "targetStageDeclaration",
  "eligibilitySummary",
  "exceptionSummary",
  "approvalRequirements",
  "boundaryConfirmation",
  "externalAuthorityContext",
  "packageStatus",
];

const REQUIRED_CHECK_CATEGORIES = [
  "source_report_status",
  "source_report_boundary",
  "reference_completeness",
  "version_pinning",
  "exception_clearance",
  "non_waivable_boundary",
  "manual_approval_requirements",
  "target_stage_declaration",
  "handoff_package_boundary",
  "persistence_and_transmission_boundary",
  "execution_boundary",
  "external_authority_context",
  "prohibited_handoff_intent",
];

const REQUIRED_REFERENCE_FIELDS = [
  "sourceReportId",
  "sourceReportVersion",
  "sourceManifestId",
  "sourceManifestVersion",
  "sourceBatchContractReviewId",
  "datasetSpecId",
  "datasetSpecVersion",
  "featureSetId",
  "featureSetVersion",
  "labelSpecId",
  "labelSpecVersion",
  "splitPolicyId",
  "splitPolicyVersion",
  "normalizationPolicyId",
  "normalizationPolicyVersion",
  "qualityPolicyId",
  "qualityPolicyVersion",
  "sourceMappingId",
  "sourceMappingVersion",
  "referenceMode: \"explicit_version_pinning\"",
  "referenceMutationAllowed: false",
  "cryptographicVerificationStatus: \"not_performed\"",
];

const REQUIRED_STATUS_SNIPPETS = [
  "handoffMode: \"metadata_only_non_executable\"",
  "sourceReportStatus: \"validation_report_ready_execution_blocked\"",
  "handoffEligibilityStatus: \"eligible_for_manual_review\"",
  "handoffPackageStatus: \"generated_in_memory\"",
  "handoffApprovalStatus: \"not_granted\"",
  "approvalScope: \"handoff_candidate_review_only\"",
  "handoffAuthorizationStatus: \"denied\"",
  "handoffExecutionStatus: \"blocked\"",
  "handoffPersistenceStatus: \"blocked\"",
  "handoffTransmissionStatus: \"blocked\"",
  "targetPreflightAuthorizationStatus: \"denied\"",
  "targetPreflightExecutionStatus: \"blocked\"",
  "handoff_candidate_ready_execution_blocked",
  "invalid_source_report",
  "blocked_by_safety_policy",
  "handoff_requirements_incomplete",
];

const REQUIRED_FALSE_SNIPPETS = [
  "handoffExecutionAllowed: false",
  "handoffTransmissionAllowed: false",
  "handoffPersistenceAllowed: false",
  "handoffPackageFileCreationAllowed: false",
  "targetPreflightAuthorizationAllowed: false",
  "targetPreflightExecutionAllowed: false",
  "validationExecutionAllowed: false",
  "manifestExecutionAllowed: false",
  "dryRunExecutionAllowed: false",
  "datasetBuildAllowed: false",
  "dbReadAllowed: false",
  "dbWriteAllowed: false",
  "providerCallsAllowed: false",
  "kisCallsAllowed: false",
  "orderSubmissionAllowed: false",
  "liveTradingAllowed: false",
  "publicUiExposureAllowed: false",
  "myPageExposureAllowed: false",
  "readyForHandoffExecution: false",
  "readyForTargetPreflightExecution: false",
  "readyForReadOnlyProviderCalls: false",
  "readyForOrderSubmission: false",
  "readyForLiveGuardedTrading: false",
];

const FORBIDDEN_TRUE_SNIPPETS = [
  "handoffExecutionAllowed: true",
  "handoffTransmissionAllowed: true",
  "handoffPersistenceAllowed: true",
  "handoffPackageFileCreationAllowed: true",
  "targetPreflightAuthorizationAllowed: true",
  "targetPreflightExecutionAllowed: true",
  "handoffApprovalStatus: \"approved\"",
  "handoffAuthorizationStatus: \"granted\"",
  "handoffExecutionStatus: \"executed\"",
  "targetPreflightAuthorizationStatus: \"granted\"",
  "targetPreflightExecutionStatus: \"executed\"",
  "waiverStatus: \"granted\"",
  "validationExecutionAllowed: true",
  "manifestExecutionAllowed: true",
  "dryRunExecutionAllowed: true",
  "datasetBuildAllowed: true",
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
];

const REQUIRED_UI_TEXT = [
  "metadata-only handoff eligibility",
  "handoff package is not persisted or transmitted",
  "manual approval is not granted",
  "handoff authorization denied",
  "handoff execution blocked",
  "target preflight authorization denied",
  "target preflight execution blocked",
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
const service = read("server/src/services/tradingAiMlManifestHandoffEligibility.js");
const serviceTest = read("server/src/services/tradingAiMlManifestHandoffEligibility.test.js");
const step198Service = read("server/src/services/tradingAiMlManifestValidationReport.js");
const shell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");
const runtime = [service, shell, panel].join("\n");
const combined = [packageJson, service, serviceTest, shell, panel, css].join("\n");

assertIncludes(packageJson, "\"check:trading-step199-ai-ml-manifest-handoff-eligibility\"", "package script");
assertIncludes(packageJson, "server/src/services/tradingAiMlManifestHandoffEligibility.test.js", "package script");
assertIncludes(packageJson, "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs", "package script");
assertIncludes(packageJson, "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs", "package script");

for (const snippet of REQUIRED_EXPORTS) assertIncludes(service, snippet, "service export");
for (const snippet of REQUIRED_SOURCE_REFERENCES) assertIncludes(service, snippet, "Step198 source reference");
for (const snippet of REQUIRED_PACKAGE_SECTIONS) assertIncludes(service, snippet, "handoff package section");
for (const snippet of REQUIRED_CHECK_CATEGORIES) assertIncludes(service, snippet, "eligibility check category");
for (const snippet of REQUIRED_REFERENCE_FIELDS) assertIncludes(service, snippet, "immutable reference set");
for (const snippet of REQUIRED_STATUS_SNIPPETS) assertIncludes(service, snippet, "status snippet");
for (const snippet of REQUIRED_FALSE_SNIPPETS) assertIncludes(service, snippet, "false guard");
for (const snippet of REQUIRED_SCENARIOS) assertIncludes(service, snippet, "scenario");
for (const snippet of FORBIDDEN_TRUE_SNIPPETS) {
  assert(!service.includes(snippet), `forbidden true permission in service: ${snippet}`);
}

for (const snippet of [
  "targetStageId: \"ai_ml_dataset_build_preflight_design\"",
  "targetStageType: \"metadata_contract_review\"",
  "targetExecutionMode: \"non_executable\"",
  "targetAuthorizationStatus: \"denied\"",
  "targetExecutionStatus: \"blocked\"",
  "aiMlArchitectureOwner",
  "dataContractOwner",
  "dataQualityReviewer",
  "modelRiskReviewer",
  "securityPrivacyReviewer",
  "complianceLegalReviewer",
  "operationsReviewer",
  "finalManualApprover",
  "status: \"manual_review_required\"",
]) {
  assertIncludes(service, snippet, "target/approval requirement structure");
}

assert(!step198Service.includes("Step199"), "Step198 service must not be modified to know Step199");
assert(!step198Service.includes("ManifestHandoffEligibility"), "Step198 service must not import or reference Step199");

assertIncludes(shell, "buildAdminTradingAiMlManifestHandoffEligibilityStatus", "dashboard shell status import");
assertIncludes(shell, "aiMlManifestHandoffEligibilityStatus", "dashboard shell status return");
assertIncludes(shell, "TRADING_AI_ML_MANIFEST_HANDOFF_ELIGIBILITY_MODEL", "dashboard shell model");

assertIncludes(panel, "data-admin-panel-key=\"ai-ml-manifest-handoff-eligibility\"", "admin panel key");
assert(panel.indexOf("ai-ml-readiness-gate-summary") < panel.indexOf("ai-ml-batch-contract-review"), "Step195 must precede Step196");
assert(panel.indexOf("ai-ml-batch-contract-review") < panel.indexOf("ai-ml-dataset-build-dry-run-manifest"), "Step196 must precede Step197");
assert(panel.indexOf("ai-ml-dataset-build-dry-run-manifest") < panel.indexOf("ai-ml-manifest-validation-report"), "Step197 must precede Step198");
assert(panel.indexOf("ai-ml-manifest-validation-report") < panel.indexOf("ai-ml-manifest-handoff-eligibility"), "Step198 must precede Step199");
assert(panel.indexOf("ai-ml-manifest-handoff-eligibility") < panel.indexOf("ai-ml-strategy-management-console"), "Step199 must precede Step191 details");
for (const snippet of REQUIRED_UI_TEXT) assertIncludes(panel, snippet, "Step199 UI warning text");
for (const selector of [
  ".tradingLabAiMlManifestHandoffEligibility",
  ".tradingLabAiMlManifestHandoffStatusGrid",
  ".tradingLabAiMlManifestHandoffContractGrid",
  ".tradingLabAiMlManifestHandoffSafetyGrid",
]) {
  assertIncludes(css, selector, "Step199 CSS selector");
}

for (const snippet of FORBIDDEN_RUNTIME_CODE) {
  assert(!runtime.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
}
for (const forbiddenUi of [
  "approval button",
  "waiver button",
  "handoff button",
  "transmit button",
  "save button",
  "download button",
  "execute button",
  "target preflight execute",
  "dry-run button",
  "credential input",
]) {
  assert(!panel.includes(forbiddenUi), `forbidden Step199 UI affordance: ${forbiddenUi}`);
}

assert(!combined.includes("scenario_monthly_returns.csv"), "scenario_monthly_returns.csv must not be referenced");
assert(!combined.includes("calculatePortfolioResult"), "scenario calculation core must not be touched");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("ManifestHandoffEligibility"), "Step199 must not add a runtime route");
}
for (const forbiddenMethod of ["router.post", "router.put", "router.patch", "router.delete", "app.post", "app.put", "app.patch", "app.delete"]) {
  assert(!service.includes(forbiddenMethod), `Step199 service must not add a mutating endpoint: ${forbiddenMethod}`);
}

console.log("[check-trading-step199-ai-ml-manifest-handoff-eligibility] ok");
