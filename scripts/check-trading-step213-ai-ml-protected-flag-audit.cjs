const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const {
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  AI_ML_PRIMITIVE_MIGRATION_STAGES,
  buildAiMlPrimitivesMigrationAudit,
  classifyProtectedFlags,
  validateAiMlMigrationScenarioTaxonomy,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");

const REQUIRED_FILES = [
  "package.json",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs",
  "scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs",
  "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.cjs",
  "scripts/check-trading-step215-ai-ml-migration-regression-consolidation.test.cjs",
  "scripts/check-trading-step214-ai-ml-contract-primitives-step194-pilot.cjs",
  "scripts/check-trading-step216-ai-ml-migration-runner-result-contract.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.cjs",
  "scripts/check-trading-step217-ai-ml-contract-primitives-step193-pilot.test.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.cjs",
  "scripts/check-trading-step218-step193-admin-snapshot-redaction.test.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs",
];

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "data/processed/scenario_monthly_returns.csv",
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

function extractStageObjectSource(source, stepId) {
  const marker = `stepId: "${stepId}"`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return "";
  const start = source.lastIndexOf("Object.freeze({", markerIndex);
  const next = source.indexOf("\n  Object.freeze({", markerIndex + marker.length);
  const end = next < 0 ? source.indexOf("\n]);", markerIndex) : next;
  return start < 0 || end < 0 ? "" : source.slice(start, end);
}

function getTouchedFiles() {
  const output = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean).map((file) => file.replace(/\\/g, "/"));
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const auditScript = read("scripts/trading-ai-ml-primitives-migration-audit.cjs");
  const auditTest = read("scripts/trading-ai-ml-primitives-migration-audit.test.cjs");
  const step212Checker = read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.cjs");
  const step212CheckerTest = read("scripts/check-trading-step212-ai-ml-primitives-migration-milestone.test.cjs");
  const step213Checker = read("scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs");
  const step213CheckerTest = read("scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs");

  assertIncludes(packageJson, "\"check:trading-step213-ai-ml-protected-flag-audit\"", "package script");
  assertIncludes(packageJson, "scripts/check-trading-step213-ai-ml-protected-flag-audit.cjs", "package script");
  assertIncludes(packageJson, "scripts/check-trading-step213-ai-ml-protected-flag-audit.test.cjs", "package script");

  for (const stage of AI_ML_PRIMITIVE_MIGRATION_STAGES) {
    assert(Array.isArray(stage.requiredProtectedFlags), `${stage.stepId} requiredProtectedFlags missing`);
    assert(Array.isArray(stage.notApplicableProtectedFlags), `${stage.stepId} notApplicableProtectedFlags missing`);
    const source = extractStageObjectSource(auditScript, stage.stepId);
    assertIncludes(source, "requiredProtectedFlags: Object.freeze([", `${stage.stepId} literal required registry`);
    assertIncludes(source, "notApplicableProtectedFlags: Object.freeze([", `${stage.stepId} literal not-applicable registry`);
    assertNotIncludes(source, "...AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS", `${stage.stepId} dynamic protected registry`);
    assertNotIncludes(source, "Object.keys(", `${stage.stepId} dynamic key extraction`);
    assert(stage.requiredProtectedFlags.length + stage.notApplicableProtectedFlags.length === AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, `${stage.stepId} protected registry partition incomplete`);
  }

  const registryValidation = validateAiMlProtectedFlagStageRegistry();
  assert(registryValidation.ok, `registry validation failed: ${registryValidation.errors.join(", ")}`);
  assertIncludes(auditScript, "function validateAiMlProtectedFlagStageRegistry", "registry validator");
  assertIncludes(auditScript, "function validateAiMlMigrationScenarioTaxonomy", "taxonomy validator");
  assertIncludes(auditScript, "expectedContractScenarioMarkers", "contract taxonomy");
  assertIncludes(auditScript, "expectedMigrationRegressionTestMarkers", "migration taxonomy");
  assertIncludes(auditScript, "missing_unexpectedly", "required missing return path");
  assertIncludes(auditScript, "unexpected_applicable_flag", "unexpected applicable return path");
  assertIncludes(auditScript, "unclassified_protected_flag", "unclassified return path");

  for (const scenario of [
    "Scenario A: complete stage coverage",
    "Scenario B: correct inheritance chain",
    "Scenario C: single flag source",
    "Scenario D: no legacy duplicate",
    "Scenario E: explicit allowlist",
    "Scenario F: protected false coverage",
    "Scenario G: output compatibility coverage",
    "Scenario H: helper adoption",
    "Scenario I: deterministic audit output",
    "Scenario J: mutation resistance",
    "Scenario K: Step195 duplicate key cleanup",
    "Scenario L: no runtime authority change",
    "Scenario O: synthetic required missing is missing unexpectedly",
    "Scenario Q: synthetic not applicable present is unexpected applicable",
    "Scenario R: registry partition overlap fails validation",
    "Scenario S: registry coverage missing fails validation",
    "Scenario T: unknown registry key fails validation",
  ]) {
    assertIncludes(auditTest, scenario, "audit scenario");
  }

  for (const snippet of [
    "validateAiMlProtectedFlagStageRegistry",
    "unexpectedApplicableFlagCount",
    "unclassifiedProtectedFlagCount",
    "protectedFlagRegistryStatus",
  ]) {
    assertIncludes(step212Checker, snippet, "Step212 checker hardening");
  }
  assertIncludes(step212CheckerTest, "Step212 checker passes against repository source", "Step212 checker test");
  assertIncludes(step213CheckerTest, "Step213 checker passes against repository source", "Step213 checker test");

  const classifiedMissing = classifyProtectedFlags({}, {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.filter((flag) => flag !== "providerCallsAllowed"),
  });
  assert(classifiedMissing.some((item) => item.flag === "providerCallsAllowed" && item.status === "missing_unexpectedly"), "required missing fixture did not fail");

  const classifiedUnexpectedApplicable = classifyProtectedFlags({ providerCallsAllowed: false, orderSubmissionAllowed: false }, {
    requiredProtectedFlags: ["providerCallsAllowed"],
    notApplicableProtectedFlags: AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.filter((flag) => flag !== "providerCallsAllowed"),
  });
  assert(classifiedUnexpectedApplicable.some((item) => item.flag === "orderSubmissionAllowed" && item.status === "unexpected_applicable_flag"), "not-applicable present fixture did not fail");

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const taxonomyValidation = validateAiMlMigrationScenarioTaxonomy();
  assert(taxonomyValidation.ok, `taxonomy validation failed: ${taxonomyValidation.errors.join(", ")}`);
  const validation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(validation.ok, `Step212 audit validation failed: ${validation.errors.join(", ")}`);
  assert(audit.missingProtectedFlagCount === 0, "missing protected count must remain zero");
  assert(audit.unexpectedApplicableFlagCount === 0, "unexpected applicable count must remain zero");
  assert(audit.unclassifiedProtectedFlagCount === 0, "unclassified count must remain zero");
  assert(audit.protectedFlagRegistryStatus === "complete", "protected registry must be complete");
  assert(audit.migrationScenarioTaxonomyStatus === "separated_and_complete", "taxonomy must be separated");
  assert(audit.contractScenarioCoverageStatus === "complete", "contract scenario coverage must be complete");
  assert(audit.migrationRegressionCoverageStatus === "complete", "migration regression coverage must be complete");
  assert(audit.scope === "step192_to_step200", "Step213 audit scope must include Step192 after Step223");
  assert(audit.expectedStageCount === 9, "Step213 audit stage count must include Step192 after Step223");

  const touchedFiles = getTouchedFiles();
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step213 touched file: ${file}`);
  }

  const combinedStep213Source = [auditScript, step212Checker, step213Checker]
    .join("\n")
    .replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(combinedStep213Source, snippet, "Step213 script runtime guard");
  }

  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
    assert(!routeFiles.includes("protected-flag-audit"), "Step213 must not add an endpoint");
  }
  assertNotIncludes(auditScript, "scenario_monthly_returns.csv", "scenario data guard");
  assertNotIncludes(auditScript, "calculatePortfolioResult", "scenario calculation guard");
  console.log("[check-trading-step213-ai-ml-protected-flag-audit] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
