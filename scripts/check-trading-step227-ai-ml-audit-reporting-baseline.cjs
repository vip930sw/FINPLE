const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const {
  buildAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionResult,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");
const {
  buildTradingAiMlAuditSummary,
  formatTradingAiMlAuditConsoleSummary,
  validateTradingAiMlAuditSummary,
} = require("./report-trading-ai-ml-audit-summary.cjs");

const STEP227_SCRIPT = "check:trading-step227-ai-ml-audit-reporting-baseline";
const STEP227_REPORT_SCRIPT = "report:trading-ai-ml-audit-summary";

const REQUIRED_FILES = [
  "package.json",
  "scripts/report-trading-ai-ml-audit-summary.cjs",
  "scripts/report-trading-ai-ml-audit-summary.test.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.test.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  "scripts/report-trading-ai-ml-audit-summary.cjs",
  "scripts/report-trading-ai-ml-audit-summary.test.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.test.cjs",
]);

const FORBIDDEN_TOUCHED_FILES = [
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/index.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
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
  const reportSource = read("scripts/report-trading-ai-ml-audit-summary.cjs");
  const reportTest = read("scripts/report-trading-ai-ml-audit-summary.test.cjs");

  assertIncludes(packageJson, `"${STEP227_REPORT_SCRIPT}"`, "package report script");
  assertIncludes(packageJson, `"${STEP227_SCRIPT}"`, "package Step227 checker script");
  assertIncludes(packageJson, "scripts/report-trading-ai-ml-audit-summary.cjs", "package report link");
  assertIncludes(packageJson, "scripts/report-trading-ai-ml-audit-summary.test.cjs", "package report test link");
  assertIncludes(packageJson, "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs", "package Step227 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.test.cjs", "package Step227 checker test link");

  for (const snippet of [
    "EXPECTED_AUDIT_REPORTING_BASELINE",
    "buildAiMlPrimitivesMigrationAudit",
    "buildAiMlPrimitivesMigrationRegressionPlan",
    "runAiMlPrimitivesMigrationRegression",
    "buildTradingAiMlAuditSummary",
    "validateTradingAiMlAuditSummary",
    "formatTradingAiMlAuditConsoleSummary",
    "supplementalGuardsExecuted",
    "actualLiveTradingReady",
  ]) {
    assertIncludes(reportSource, snippet, "Step227 report source");
  }

  for (const scenario of [
    "exact top-level schema and baseline counts",
    "deterministic for identical audit",
    "canonical when registry order changes",
    "does not treat unexecuted supplemental guards as passing",
    "console output separates core supplemental totals duplicates and readiness",
  ]) {
    assertIncludes(reportTest, scenario, "Step227 report test");
  }

  assertNotIncludes(reportSource, "SUPPLEMENTAL_CONTRACT_GUARDS = Object.freeze", "Step227 must not add a registry group");
  assertNotIncludes(reportSource, "sourceCheckers:", "Step227 must not define checker registry");

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionResult = buildAiMlPrimitivesMigrationRegressionResult(regressionPlan);
  const summary = buildTradingAiMlAuditSummary({ audit, regressionPlan, regressionResult });
  const validation = validateTradingAiMlAuditSummary(summary);
  assert(validation.ok, `summary validation failed: ${validation.errors.join(", ")}`);
  assert(summary.coreAudit.scope === "step192_to_step200", "core audit scope mismatch");
  assert(summary.coreAudit.expectedStageCount === 9, "core expected stage count mismatch");
  assert(summary.coreAudit.counts.sourceCheckerCount === 13, "source checker count mismatch");
  assert(summary.coreAudit.counts.uniqueCheckerTestCount === 25, "core checker test count mismatch");
  assert(summary.coreAudit.counts.uniqueTestFileCount === 35, "core test file count mismatch");
  assert(summary.supplementalGuards.count === 1, "supplemental guard count mismatch");
  assert(summary.supplementalGuards.checks[0] === "step225_step192_dataset_contract_manifest", "supplemental guard id mismatch");
  assert(summary.totals.totalSourceCheckerCount === 14, "total source checker count mismatch");
  assert(summary.totals.totalUniqueCheckerTestCount === 26, "total checker test count mismatch");
  assert(summary.totals.totalUniqueTestFileCount === 37, "total test file count mismatch");
  assert(summary.duplicates.duplicateFileCount === 0, "duplicate file count mismatch");
  assert(summary.duplicates.duplicateSourceCheckers.length === 0, "duplicate source checker count mismatch");
  assert(summary.execution.supplementalGuardsExecuted === true, "supplemental execution marker mismatch");
  assert(summary.execution.regressionPassed === true, "regression pass marker mismatch");
  assert(summary.readiness.actualLiveTradingReady === false, "live trading readiness changed");

  const unexecutedSummary = buildTradingAiMlAuditSummary({
    audit,
    regressionPlan,
    regressionResult: buildAiMlPrimitivesMigrationRegressionResult(regressionPlan, {
      executed: false,
      passed: false,
      status: "ai_ml_primitives_migration_regression_planned_not_executed",
    }),
  });
  const unexecutedValidation = validateTradingAiMlAuditSummary(unexecutedSummary);
  assert(unexecutedSummary.execution.supplementalGuardsExecuted === false, "unexecuted supplemental guard must not pass");
  assert(unexecutedValidation.ok === false, "unexecuted summary validation must fail");

  const consoleOutput = formatTradingAiMlAuditConsoleSummary(summary);
  for (const snippet of [
    "FINPLE AI/ML AUDIT SUMMARY",
    "Core scope: step192_to_step200",
    "Supplemental guards: 1",
    "Total checkers/tests/files: 14 / 26 / 37",
    "Duplicates: 0",
    "Live trading readiness: blocked",
  ]) {
    assertIncludes(consoleOutput, snippet, "Step227 console output");
  }
  for (const forbidden of [
    "credential",
    "provider payload",
    "raw metadata",
    "hash value",
    "digest value",
    "fingerprint",
  ]) {
    assertNotIncludes(JSON.stringify(summary).toLowerCase(), forbidden, "Step227 summary");
    assertNotIncludes(consoleOutput.toLowerCase(), forbidden, "Step227 console output");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step227 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step227 touched file: ${file}`);
  }

  console.log("[check-trading-step227-ai-ml-audit-reporting-baseline] ok");
  console.log(JSON.stringify({
    coreScope: summary.coreAudit.scope,
    coreExpectedStageCount: summary.coreAudit.expectedStageCount,
    coreCounts: summary.coreAudit.counts,
    supplementalGuards: summary.supplementalGuards,
    totals: summary.totals,
    duplicates: summary.duplicates,
    execution: summary.execution,
    readiness: summary.readiness,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
