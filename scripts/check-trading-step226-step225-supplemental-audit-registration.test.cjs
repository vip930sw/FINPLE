const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");
const {
  buildAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");

test("Step226 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step226-step225-supplemental-audit-registration.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step226-step225-supplemental-audit-registration\] ok/);
  assert.match(output, /"sourceCheckerCountDelta": 0/);
  assert.match(output, /"uniqueCheckerTestCountDelta": 1/);
  assert.match(output, /"uniqueTestFileCountDelta": 2/);
});

test("Step226 package script links supplemental registration coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step226-step225-supplemental-audit-registration/);
  assert.match(packageJson, /scripts\/check-trading-step226-step225-supplemental-audit-registration\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step226-step225-supplemental-audit-registration\.test\.cjs/);
  assert.match(packageJson, /scripts\/run-trading-ai-ml-primitives-migration-regression\.test\.cjs/);
  assert.match(packageJson, /scripts\/trading-ai-ml-primitives-migration-audit\.test\.cjs/);
});

test("Step226 keeps core counts fixed and exposes supplemental deltas", () => {
  const plan = buildAiMlPrimitivesMigrationRegressionPlan();

  assert.equal(plan.sourceCheckerCount, 13);
  assert.equal(plan.uniqueServiceTestCount, 10);
  assert.equal(plan.uniqueMigrationCheckerTestCount, 14);
  assert.equal(plan.uniqueSupportingTestCount, 11);
  assert.equal(plan.uniqueCheckerTestCount, 25);
  assert.equal(plan.uniqueTestFileCount, 35);
  assert.equal(plan.totalUniqueCheckerTestCount, 26);
  assert.equal(plan.totalUniqueTestFileCount, 37);
  assert.equal(plan.sourceCheckerCountDelta, 0);
  assert.equal(plan.uniqueServiceTestCountDelta, 0);
  assert.equal(plan.uniqueMigrationCheckerTestCountDelta, 0);
  assert.equal(plan.uniqueSupportingTestCountDelta, 0);
  assert.equal(plan.uniqueCheckerTestCountDelta, 1);
  assert.equal(plan.uniqueTestFileCountDelta, 2);
  assert.equal(plan.duplicateFileCount, 0);
  assert.equal(plan.supplementalGuardCount, 1);
  assert.equal(plan.supplementalSourceCheckerCount, 1);
  assert.equal(plan.supplementalServiceTestCount, 1);
  assert.equal(plan.supplementalCheckerTestCount, 1);
  assert.equal(plan.totalSourceCheckerCount, 14);
});

test("Step226 audit preserves core scope while registering Step225 supplemental guard", async () => {
  const audit = await buildAiMlPrimitivesMigrationAudit();

  assert.deepEqual(audit.coreAudit, {
    scope: "step192_to_step200",
    expectedStageCount: 9,
  });
  assert.equal(audit.scope, "step192_to_step200");
  assert.equal(audit.expectedStageCount, 9);
  assert.equal(audit.supplementalGuards.count, 1);
  assert.deepEqual(audit.supplementalGuards.checks, ["step225_step192_dataset_contract_manifest"]);
  assert.deepEqual(audit.supplementalGuards.missingFiles, []);
  assert.equal(audit.supplementalGuards.status, "registered");
});

test("Step226 remains registration-only without runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
  for (const forbidden of [
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
    "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
    "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
    "scripts/check-trading-step225-step192-dataset-contract-manifest.test.cjs",
    "server/src/index.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});
