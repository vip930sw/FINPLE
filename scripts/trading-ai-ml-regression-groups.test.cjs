const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const {
  AI_ML_REQUIRED_REGRESSION_STEPS,
  collectGroupTestFiles,
  listAiMlRegressionGroups,
  validateAiMlRegressionCoverage,
} = require("./trading-ai-ml-regression-groups.cjs");

test("Scenario A: AI/ML regression groups are listed in deterministic order", () => {
  assert.deepEqual(listAiMlRegressionGroups().map((group) => group.groupId), [
    "architecture-foundation",
    "contract-chain",
    "consolidation-primitives",
  ]);
});

test("Scenario B: Step 191 through Step 202 coverage is complete", () => {
  const coverage = validateAiMlRegressionCoverage();
  assert.equal(coverage.ok, true, coverage.errors.join("\n"));
  assert.deepEqual(coverage.coveredSteps, [...AI_ML_REQUIRED_REGRESSION_STEPS]);
});

test("Scenario C: no test file is duplicated across groups", () => {
  const allFiles = listAiMlRegressionGroups().flatMap(collectGroupTestFiles);
  assert.equal(new Set(allFiles).size, allFiles.length);
});

test("Scenario D: all manifest paths exist", () => {
  const allFiles = listAiMlRegressionGroups().flatMap(collectGroupTestFiles);
  for (const file of allFiles) {
    assert.equal(fs.existsSync(file), true, file);
  }
});

test("Scenario E: group, step, and file ordering stay deterministic", () => {
  const groups = listAiMlRegressionGroups();
  assert.deepEqual(groups[0].coveredStepIds, ["step191", "step192", "step193", "step194", "step195"]);
  assert.deepEqual(groups[1].coveredStepIds, ["step196", "step197", "step198", "step199"]);
  assert.deepEqual(groups[2].coveredStepIds, ["step200", "step201", "step202"]);
  assert.deepEqual(groups[0].serviceTestFiles, [
    "server/src/services/tradingAiMlStrategyManagement.test.js",
    "server/src/services/tradingAiMlDatasetArchitecture.test.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
    "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  ]);
  assert.deepEqual(groups[1].checkerTestFiles, [
    "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
    "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
    "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
    "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
  ]);
});

test("Scenario J: returned manifest objects do not mutate the source manifest", () => {
  const before = JSON.stringify(listAiMlRegressionGroups());
  const groups = listAiMlRegressionGroups();
  assert.throws(() => groups[0].coveredStepIds.push("step999"), TypeError);
  assert.equal(JSON.stringify(listAiMlRegressionGroups()), before);
});
