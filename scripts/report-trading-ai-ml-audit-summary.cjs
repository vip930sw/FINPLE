const {
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionResult,
  runAiMlPrimitivesMigrationRegression,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const AUDIT_SUMMARY_SCHEMA_VERSION = "1.0.0";

const EXPECTED_AUDIT_REPORTING_BASELINE = Object.freeze({
  coreAudit: Object.freeze({
    scope: "step192_to_step200",
    expectedStageCount: 9,
    counts: Object.freeze({
      sourceCheckerCount: 13,
      uniqueServiceTestCount: 10,
      uniqueMigrationCheckerTestCount: 14,
      uniqueSupportingTestCount: 11,
      uniqueCheckerTestCount: 25,
      uniqueTestFileCount: 35,
    }),
  }),
  supplementalGuards: Object.freeze({
    count: 1,
    checks: Object.freeze(["step225_step192_dataset_contract_manifest"]),
  }),
  totals: Object.freeze({
    totalSourceCheckerCount: 14,
    totalUniqueCheckerTestCount: 26,
    totalUniqueTestFileCount: 37,
  }),
  duplicates: Object.freeze({
    duplicateFileCount: 0,
    duplicateSourceCheckers: Object.freeze([]),
  }),
});

const SUMMARY_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "coreAudit",
  "supplementalGuards",
  "totals",
  "duplicates",
  "execution",
  "readiness",
]);

const SENSITIVE_REPORT_PATTERNS = Object.freeze([
  /secret/i,
  /credential/i,
  /token/i,
  /provider payload/i,
  /raw metadata/i,
  /hash value/i,
  /digest value/i,
  /fingerprint/i,
  /account/i,
  /order payload/i,
  /runtime label values/i,
  /split window values/i,
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function sortStrings(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function inferActualLiveTradingReady(audit) {
  return audit?.runtimeCapabilityStatus === "implemented"
    && audit?.executionReadinessStatus === "ready"
    && audit?.orderAuthorityStatus === "approved";
}

function buildTradingAiMlAuditSummary({ audit, regressionPlan, regressionResult } = {}) {
  if (!audit) throw new Error("audit is required");
  if (!regressionPlan) throw new Error("regression plan is required");

  const supplementalChecks = sortStrings(audit.supplementalGuards?.checks || []);
  const duplicateSourceCheckers = sortStrings(regressionPlan.duplicateSourceCheckers || []);
  const regressionExecuted = regressionResult?.executed === true;
  const regressionPassed = regressionResult?.passed === true;
  const supplementalGuardsExecuted = regressionExecuted
    && regressionPassed
    && regressionPlan.supplementalSourceCheckerCount === audit.supplementalGuards?.count
    && regressionPlan.supplementalGuardCount === audit.supplementalGuards?.count;

  return deepFreeze({
    schemaVersion: AUDIT_SUMMARY_SCHEMA_VERSION,
    coreAudit: {
      scope: audit.coreAudit?.scope,
      expectedStageCount: audit.coreAudit?.expectedStageCount,
      counts: {
        sourceCheckerCount: regressionPlan.sourceCheckerCount,
        uniqueServiceTestCount: regressionPlan.uniqueServiceTestCount,
        uniqueMigrationCheckerTestCount: regressionPlan.uniqueMigrationCheckerTestCount,
        uniqueSupportingTestCount: regressionPlan.uniqueSupportingTestCount,
        uniqueCheckerTestCount: regressionPlan.uniqueCheckerTestCount,
        uniqueTestFileCount: regressionPlan.uniqueTestFileCount,
      },
    },
    supplementalGuards: {
      count: audit.supplementalGuards?.count,
      checks: supplementalChecks,
    },
    totals: {
      totalSourceCheckerCount: regressionPlan.totalSourceCheckerCount,
      totalUniqueCheckerTestCount: regressionPlan.totalUniqueCheckerTestCount,
      totalUniqueTestFileCount: regressionPlan.totalUniqueTestFileCount,
    },
    duplicates: {
      duplicateFileCount: regressionPlan.duplicateFileCount,
      duplicateSourceCheckers,
    },
    execution: {
      supplementalGuardsExecuted,
      regressionPassed,
      status: regressionResult?.status || "not_executed",
    },
    readiness: {
      actualLiveTradingReady: inferActualLiveTradingReady(audit),
      state: inferActualLiveTradingReady(audit) ? "ready" : "blocked",
    },
  });
}

function assertNoSensitiveReportMaterial(summary) {
  const serialized = JSON.stringify(summary);
  const violations = SENSITIVE_REPORT_PATTERNS
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => pattern.source);
  return deepFreeze({
    ok: violations.length === 0,
    violations,
  });
}

function validateTradingAiMlAuditSummary(summary, baseline = EXPECTED_AUDIT_REPORTING_BASELINE) {
  const errors = [];
  if (!summary || typeof summary !== "object") errors.push("summary missing");
  if (JSON.stringify(Object.keys(summary || {})) !== JSON.stringify([...SUMMARY_TOP_LEVEL_KEYS])) errors.push("top-level key set mismatch");
  if (summary?.schemaVersion !== AUDIT_SUMMARY_SCHEMA_VERSION) errors.push("schema version mismatch");
  if (summary?.coreAudit?.scope !== baseline.coreAudit.scope) errors.push("core audit scope mismatch");
  if (summary?.coreAudit?.expectedStageCount !== baseline.coreAudit.expectedStageCount) errors.push("core expected stage count mismatch");
  for (const [key, value] of Object.entries(baseline.coreAudit.counts)) {
    if (summary?.coreAudit?.counts?.[key] !== value) errors.push(`core count mismatch: ${key}`);
  }
  if (summary?.supplementalGuards?.count !== baseline.supplementalGuards.count) errors.push("supplemental guard count mismatch");
  if (JSON.stringify(summary?.supplementalGuards?.checks || []) !== JSON.stringify([...baseline.supplementalGuards.checks])) errors.push("supplemental checks mismatch");
  for (const [key, value] of Object.entries(baseline.totals)) {
    if (summary?.totals?.[key] !== value) errors.push(`total count mismatch: ${key}`);
  }
  if (summary?.duplicates?.duplicateFileCount !== baseline.duplicates.duplicateFileCount) errors.push("duplicate file count mismatch");
  if (JSON.stringify(summary?.duplicates?.duplicateSourceCheckers || []) !== JSON.stringify([...baseline.duplicates.duplicateSourceCheckers])) errors.push("duplicate source checker mismatch");
  if (summary?.execution?.supplementalGuardsExecuted !== true) errors.push("supplemental guards not executed");
  if (summary?.execution?.regressionPassed !== true) errors.push("regression did not pass");
  if (summary?.readiness?.actualLiveTradingReady !== false) errors.push("live trading readiness changed");
  const sensitive = assertNoSensitiveReportMaterial(summary);
  for (const violation of sensitive.violations) errors.push(`sensitive report material: ${violation}`);
  return deepFreeze({ ok: errors.length === 0, errors });
}

async function buildCurrentTradingAiMlAuditSummary(options = {}) {
  const audit = await buildAiMlPrimitivesMigrationAudit({ repoRoot: options.repoRoot });
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  if (!auditValidation.ok) throw new Error(`audit validation failed: ${auditValidation.errors.join("; ")}`);

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan({ repoRoot: options.repoRoot });
  const planValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  if (!planValidation.ok) throw new Error(`regression plan validation failed: ${planValidation.errors.join("; ")}`);

  const regressionResult = options.executeRegression
    ? runAiMlPrimitivesMigrationRegression({ repoRoot: options.repoRoot, stdio: options.stdio || "pipe" })
    : options.regressionResult || buildAiMlPrimitivesMigrationRegressionResult(regressionPlan);

  return buildTradingAiMlAuditSummary({ audit, regressionPlan, regressionResult });
}

function formatTradingAiMlAuditConsoleSummary(summary) {
  return [
    "FINPLE AI/ML AUDIT SUMMARY",
    `Core scope: ${summary.coreAudit.scope}`,
    `Core stages: ${summary.coreAudit.expectedStageCount}`,
    `Core checkers/tests/files: ${summary.coreAudit.counts.sourceCheckerCount} / ${summary.coreAudit.counts.uniqueCheckerTestCount} / ${summary.coreAudit.counts.uniqueTestFileCount}`,
    `Supplemental guards: ${summary.supplementalGuards.count}`,
    `Supplemental checks: ${summary.supplementalGuards.checks.join(", ")}`,
    `Total checkers/tests/files: ${summary.totals.totalSourceCheckerCount} / ${summary.totals.totalUniqueCheckerTestCount} / ${summary.totals.totalUniqueTestFileCount}`,
    `Duplicates: ${summary.duplicates.duplicateFileCount}`,
    `Regression: ${summary.execution.regressionPassed ? "passed" : "not_passed"}`,
    `Supplemental execution: ${summary.execution.supplementalGuardsExecuted ? "executed" : "not_executed"}`,
    `Live trading readiness: ${summary.readiness.state}`,
  ].join("\n");
}

async function main() {
  const summary = await buildCurrentTradingAiMlAuditSummary({ executeRegression: true, stdio: "pipe" });
  const validation = validateTradingAiMlAuditSummary(summary);
  if (!validation.ok) {
    console.error(JSON.stringify({ ok: false, errors: validation.errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(formatTradingAiMlAuditConsoleSummary(summary));
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  AUDIT_SUMMARY_SCHEMA_VERSION,
  EXPECTED_AUDIT_REPORTING_BASELINE,
  SUMMARY_TOP_LEVEL_KEYS,
  buildCurrentTradingAiMlAuditSummary,
  buildTradingAiMlAuditSummary,
  assertNoSensitiveReportMaterial,
  formatTradingAiMlAuditConsoleSummary,
  validateTradingAiMlAuditSummary,
};
