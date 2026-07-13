const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DEFAULT_REGISTRY,
  buildAiMlPrimitivesMigrationRegressionPlan,
  buildAiMlPrimitivesMigrationRegressionResult,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");
const {
  buildAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  EXPECTED_AUDIT_REPORTING_BASELINE,
  SUMMARY_TOP_LEVEL_KEYS,
  assertNoSensitiveReportMaterial,
  buildTradingAiMlAuditSummary,
  formatTradingAiMlAuditConsoleSummary,
  validateTradingAiMlAuditSummary,
} = require("./report-trading-ai-ml-audit-summary.cjs");

let auditPromise;
function getAudit() {
  if (!auditPromise) auditPromise = buildAiMlPrimitivesMigrationAudit();
  return auditPromise;
}

async function buildSummaryFromCurrentPlan() {
  const audit = await getAudit();
  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionResult = buildAiMlPrimitivesMigrationRegressionResult(regressionPlan);
  return buildTradingAiMlAuditSummary({ audit, regressionPlan, regressionResult });
}

test("Step227 summary exposes exact top-level schema and baseline counts", async () => {
  const summary = await buildSummaryFromCurrentPlan();
  const validation = validateTradingAiMlAuditSummary(summary);

  assert.deepEqual(Object.keys(summary), SUMMARY_TOP_LEVEL_KEYS);
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.equal(summary.schemaVersion, "1.0.0");
  assert.deepEqual(summary.coreAudit, EXPECTED_AUDIT_REPORTING_BASELINE.coreAudit);
  assert.deepEqual(summary.supplementalGuards, EXPECTED_AUDIT_REPORTING_BASELINE.supplementalGuards);
  assert.deepEqual(summary.totals, EXPECTED_AUDIT_REPORTING_BASELINE.totals);
  assert.deepEqual(summary.duplicates, EXPECTED_AUDIT_REPORTING_BASELINE.duplicates);
});

test("Step227 summary is deterministic for identical audit and regression state", async () => {
  const first = await buildSummaryFromCurrentPlan();
  const second = await buildSummaryFromCurrentPlan();

  assert.deepEqual(first, second);
});

test("Step227 summary remains canonical when registry order changes", async () => {
  const audit = await getAudit();
  const baselinePlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const reversedPlan = buildAiMlPrimitivesMigrationRegressionPlan({
    registry: {
      sourceCheckers: [...DEFAULT_REGISTRY.sourceCheckers].reverse(),
      serviceTestFiles: [...DEFAULT_REGISTRY.serviceTestFiles].reverse(),
      migrationCheckerTestFiles: [...DEFAULT_REGISTRY.migrationCheckerTestFiles].reverse(),
      supportingTestFiles: [...DEFAULT_REGISTRY.supportingTestFiles].reverse(),
      supplementalContractGuards: [...DEFAULT_REGISTRY.supplementalContractGuards].reverse(),
    },
  });
  const baselineSummary = buildTradingAiMlAuditSummary({
    audit,
    regressionPlan: baselinePlan,
    regressionResult: buildAiMlPrimitivesMigrationRegressionResult(baselinePlan),
  });
  const reversedSummary = buildTradingAiMlAuditSummary({
    audit,
    regressionPlan: reversedPlan,
    regressionResult: buildAiMlPrimitivesMigrationRegressionResult(reversedPlan),
  });

  assert.deepEqual(reversedSummary, baselineSummary);
});

test("Step227 summary does not treat unexecuted supplemental guards as passing", async () => {
  const audit = await getAudit();
  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const unexecutedSummary = buildTradingAiMlAuditSummary({
    audit,
    regressionPlan,
    regressionResult: buildAiMlPrimitivesMigrationRegressionResult(regressionPlan, {
      executed: false,
      passed: false,
      status: "ai_ml_primitives_migration_regression_planned_not_executed",
    }),
  });
  const validation = validateTradingAiMlAuditSummary(unexecutedSummary);

  assert.equal(unexecutedSummary.execution.supplementalGuardsExecuted, false);
  assert.equal(unexecutedSummary.execution.regressionPassed, false);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /supplemental guards not executed/);
});

test("Step227 summary keeps live trading readiness false", async () => {
  const summary = await buildSummaryFromCurrentPlan();

  assert.equal(summary.readiness.actualLiveTradingReady, false);
  assert.equal(summary.readiness.state, "blocked");
});

test("Step227 summary and console output exclude sensitive material", async () => {
  const summary = await buildSummaryFromCurrentPlan();
  const consoleOutput = formatTradingAiMlAuditConsoleSummary(summary);
  const sensitive = assertNoSensitiveReportMaterial(summary);

  assert.equal(sensitive.ok, true);
  for (const forbidden of [
    "secret",
    "credential",
    "token",
    "provider payload",
    "raw metadata",
    "hash value",
    "digest value",
    "fingerprint",
  ]) {
    assert.equal(consoleOutput.toLowerCase().includes(forbidden), false, forbidden);
  }
});

test("Step227 console output separates core supplemental totals duplicates and readiness", async () => {
  const summary = await buildSummaryFromCurrentPlan();
  const output = formatTradingAiMlAuditConsoleSummary(summary);

  assert.match(output, /^FINPLE AI\/ML AUDIT SUMMARY/);
  assert.match(output, /Core scope: step192_to_step200/);
  assert.match(output, /Core stages: 9/);
  assert.match(output, /Core checkers\/tests\/files: 13 \/ 25 \/ 35/);
  assert.match(output, /Supplemental guards: 1/);
  assert.match(output, /Total checkers\/tests\/files: 14 \/ 26 \/ 37/);
  assert.match(output, /Duplicates: 0/);
  assert.match(output, /Live trading readiness: blocked/);
});
