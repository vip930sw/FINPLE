const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const {
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");

const STEP214_SCRIPT = "check:trading-step214-ai-ml-contract-primitives-step194-pilot";
const STEP194_MODULE = "server/src/services/tradingAiMlFeaturePipelinePreflight.js";

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  STEP194_MODULE,
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.test.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
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
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "createWriteStream",
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
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
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

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function getFlagDefinitionSegment(source) {
  const start = source.indexOf("export const STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS");
  const end = source.indexOf("export const TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL", start);
  return start < 0 || end < 0 ? "" : source.slice(start, end);
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const status = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...status])].map((file) => file.replace(/\\/g, "/"));
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const service = read(STEP194_MODULE);
  const serviceTest = read("server/src/services/tradingAiMlFeaturePipelinePreflight.test.js");
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const step212CheckerTest = read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs");
  const step213CheckerTest = read("scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs");

  assertIncludes(packageJson, `"${STEP214_SCRIPT}"`, "package Step214 script");
  for (const requiredLink of [
    "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
    "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.test.cjs",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
    "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
    "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
    "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
    "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
    "scripts/check-trading-step211-ai-ml-contract-primitives-step195-pilot.test.cjs",
    "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
    "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
    "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  ]) {
    assertIncludes(packageJson, requiredLink, "package Step214 regression link");
  }

  for (const importName of [
    "AI_ML_CONTRACT_STATUS",
    "AI_ML_STAGE_IDS",
    "buildAiMlFailClosedFlags",
    "cloneAiMlMetadata",
    "normalizeAiMlMetadataArray",
    "sanitizeAiMlMetadataArray",
    "sanitizeAiMlMetadataValue",
    "sortAiMlMetadataByKey",
  ]) {
    assertIncludes(service, importName, "Step194 shared primitive import/use");
  }

  const flagSegment = getFlagDefinitionSegment(service);
  assertIncludes(service, "export const STEP194_METADATA_ONLY_ALLOWED_FLAGS = Object.freeze({", "Step194 metadata allowlist");
  assertIncludes(service, "metadataOnlyPreflightEvaluationAllowed: true", "Step194 metadata allowlist");
  assertIncludes(service, "export const STEP194_ADDITIONAL_FALSE_FLAGS = Object.freeze({", "Step194 additional false flags");
  for (const key of ["featureFileCreationAllowed", "datasetFileCreationAllowed", "modelArtifactCreationAllowed", "modelAutoApprovalAllowed"]) {
    assertIncludes(service, `${key}: false`, "Step194 additional false flag");
  }
  assert(countMatches(service, /export const STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS\b/g) === 1, "Step194 flag export must appear once");
  assert(countMatches(flagSegment, /buildAiMlFailClosedFlags\(/g) === 1, "Step194 builder call must appear once");
  assertIncludes(flagSegment, "inheritedFlags: STEP193_AI_ML_FEATURE_PIPELINE_FLAGS", "Step194 inherited flags");
  assertIncludes(flagSegment, "allowedMetadataFlags: STEP194_METADATA_ONLY_ALLOWED_FLAGS", "Step194 allowlist builder input");
  assertIncludes(flagSegment, "additionalFalseFlags: STEP194_ADDITIONAL_FALSE_FLAGS", "Step194 additional false builder input");
  assertNotIncludes(flagSegment, "...STEP193_AI_ML_FEATURE_PIPELINE_FLAGS", "Step194 legacy spread");
  assertNotIncludes(service, "Object.entries(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS)", "Step194 dynamic true allowlist extraction");

  for (const snippet of [
    "metadata_only_preflight",
    "valid",
    "invalid",
    "valid_contract_execution_blocked",
    "invalid_contract",
    "blocked_by_safety_policy",
    "ai_ml_feature_batch_preflight_review",
    "AI_ML_CONTRACT_STATUS.BLOCKED",
    "AI_ML_CONTRACT_STATUS.METADATA_ONLY_NON_EXECUTABLE",
    "AI_ML_STAGE_IDS.STEP_193_FEATURE_PIPELINE_ARCHITECTURE",
    "AI_ML_STAGE_IDS.STEP_194_FEATURE_PIPELINE_PREFLIGHT",
  ]) {
    assertIncludes(service, snippet, "Step194 output vocabulary");
  }

  for (const scenario of [
    "scenario_a_valid_metadata_contract",
    "scenario_b_unknown_feature",
    "scenario_c_future_available_at_leakage",
    "scenario_d_label_overlap",
    "scenario_e_insufficient_rolling_history",
    "scenario_f_invalid_normalization_scope",
    "scenario_g_unconditional_zero_fill",
    "scenario_h_unpinned_version",
    "scenario_i_prohibited_execution_intent",
    "scenario J shared flag compatibility",
    "scenario K inherited true execution conflict",
    "scenario L explicit metadata allowlist",
    "scenario M shared helper compatibility",
    "scenario N full default output remains compatible",
    "scenario O shared clone use prevents input",
  ]) {
    assertIncludes(serviceTest, scenario, "Step194 scenario coverage");
  }

  for (const action of [
    "download_data",
    "query_provider",
    "query_kis",
    "issue_kis_token",
    "read_database",
    "write_database",
    "generate_features",
    "create_feature_file",
    "build_dataset",
    "create_dataset_file",
    "run_python",
    "train_model",
    "create_model_artifact",
    "deploy_model",
    "submit_order",
    "enable_live_trading",
  ]) {
    assertIncludes(service, action, "Step194 safety precedence action");
  }

  const step194 = AI_ML_PRIMITIVE_MIGRATION_STAGES.find((stage) => stage.stepId === "step194");
  assert(step194, "Step194 audit stage missing");
  assert(step194.requiredProtectedFlags.length === AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, "Step194 required protected flag count mismatch");
  assert(step194.notApplicableProtectedFlags.length === 0, "Step194 not-applicable protected flag count must be zero");
  assert(step194.requiredProtectedFlags.length + step194.notApplicableProtectedFlags.length === AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, "Step194 protected registry partition incomplete");

  const registryValidation = validateAiMlProtectedFlagStageRegistry();
  assert(registryValidation.ok, `protected registry validation failed: ${registryValidation.errors.join(", ")}`);
  const audit = await buildAiMlPrimitivesMigrationAudit();
  const validation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(validation.ok, `migration audit failed: ${validation.errors.join(", ")}`);
  assert(audit.scope === "step193_to_step200", "audit scope must be Step193 to Step200");
  assert(audit.expectedStageCount === 8, "audit expected stage count must be 8");
  assert(audit.migratedStageCount === 8, "audit migrated stage count must be 8");
  assert(audit.singleFlagSourceStageCount === 8, "audit single source count must be 8");
  assert(audit.explicitAllowlistStageCount === 8, "audit allowlist count must be 8");
  assert(
    JSON.stringify(audit.stageOrder) === JSON.stringify(["step193", "step194", "step195", "step196", "step197", "step198", "step199", "step200"]),
    "audit stage order mismatch",
  );
  assert(audit.protectedFlagRegistryStatus === "complete", "audit protected registry must be complete");
  assert(audit.migrationScenarioTaxonomyStatus === "separated_and_complete", "audit scenario taxonomy must be separated");
  assert(audit.contractScenarioCoverageStatus === "complete", "audit contract scenario coverage must be complete");
  assert(audit.migrationRegressionCoverageStatus === "complete", "audit migration regression coverage must be complete");
  assert(audit.checkerConsolidationStatus === "eligible_for_post_step193_review", "checker consolidation status mismatch");
  assert(audit.nextRecommendedImplementation === "post_step193_checker_and_marker_consolidation_review", "next recommendation mismatch");

  assertIncludes(auditScript, "step194_feature_pipeline_preflight", "audit Step194 registry entry");
  assertIncludes(auditTest, "scope, \"step193_to_step200\"", "audit test Step193 scope");
  assertIncludes(step212CheckerTest, "Step212 checker passes against repository source", "Step212 checker test linkage");
  assertIncludes(step213CheckerTest, "Step213 checker passes against repository source", "Step213 checker test linkage");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step214 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step214 touched file: ${file}`);
  }

  const combinedStep214Source = [
    service,
    auditScript,
    read("scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs"),
  ].join("\n").replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(combinedStep214Source, snippet, "Step214 runtime guard");
  }
  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    const routeFiles = fs.readdirSync(routeDir).join("\n");
    assert(!routeFiles.includes("feature-pipeline-preflight-runtime"), "Step214 must not add endpoint");
  }
  assertNotIncludes(auditScript, "scenario_monthly_returns.csv", "scenario monthly data guard");
  assertNotIncludes(auditScript, "calculatePortfolioResult", "scenario calculation guard");

  console.log("[check-trading-step214-ai-ml-contract-primitives-step194-pilot] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
