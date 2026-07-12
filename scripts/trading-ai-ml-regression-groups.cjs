const fs = require("node:fs");

const AI_ML_REQUIRED_REGRESSION_STEPS = Object.freeze([
  "step191",
  "step192",
  "step193",
  "step194",
  "step195",
  "step196",
  "step197",
  "step198",
  "step199",
  "step200",
  "step201",
  "step202",
]);

const AI_ML_REQUIRED_SERVICE_TESTS = Object.freeze([
  "server/src/services/tradingAiMlStrategyManagement.test.js",
  "server/src/services/tradingAiMlDatasetArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
  "server/src/services/tradingAiMlReadinessGateSummary.test.js",
  "server/src/services/tradingAiMlBatchContractReview.test.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
  "server/src/services/tradingAiMlManifestValidationReport.test.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
]);

const AI_ML_REQUIRED_CHECKER_TESTS = Object.freeze([
  "scripts/check-trading-step191-ai-ml-strategy-management-console.test.cjs",
  "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
  "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
  "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
  "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
  "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
  "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
  "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
  "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
  "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs",
  "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
  "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
]);

const AI_ML_REGRESSION_GROUPS = Object.freeze([
  Object.freeze({
    groupId: "architecture-foundation",
    description: "Step 191 through Step 195 AI/ML architecture foundation regression",
    coveredStepIds: Object.freeze(["step191", "step192", "step193", "step194", "step195"]),
    serviceTestFiles: Object.freeze([
      "server/src/services/tradingAiMlStrategyManagement.test.js",
      "server/src/services/tradingAiMlDatasetArchitecture.test.js",
      "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
      "server/src/services/tradingAiMlFeaturePipelinePreflight.test.js",
      "server/src/services/tradingAiMlReadinessGateSummary.test.js",
    ]),
    checkerTestFiles: Object.freeze([
      "scripts/check-trading-step191-ai-ml-strategy-management-console.test.cjs",
      "scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.test.cjs",
      "scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.test.cjs",
      "scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.test.cjs",
      "scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs",
    ]),
    additionalTestFiles: Object.freeze([]),
  }),
  Object.freeze({
    groupId: "contract-chain",
    description: "Step 196 through Step 199 AI/ML contract chain regression",
    coveredStepIds: Object.freeze(["step196", "step197", "step198", "step199"]),
    serviceTestFiles: Object.freeze([
      "server/src/services/tradingAiMlBatchContractReview.test.js",
      "server/src/services/tradingAiMlDatasetBuildDryRunManifest.test.js",
      "server/src/services/tradingAiMlManifestValidationReport.test.js",
      "server/src/services/tradingAiMlManifestHandoffEligibility.test.js",
    ]),
    checkerTestFiles: Object.freeze([
      "scripts/check-trading-step196-ai-ml-batch-contract-review.test.cjs",
      "scripts/check-trading-step197-ai-ml-dataset-build-dry-run-manifest.test.cjs",
      "scripts/check-trading-step198-ai-ml-manifest-validation-report.test.cjs",
      "scripts/check-trading-step199-ai-ml-manifest-handoff-eligibility.test.cjs",
    ]),
    additionalTestFiles: Object.freeze([]),
  }),
  Object.freeze({
    groupId: "consolidation-primitives",
    description: "Step 200 through Step 202 AI/ML consolidation and shared primitive regression",
    coveredStepIds: Object.freeze(["step200", "step201", "step202"]),
    serviceTestFiles: Object.freeze([
      "server/src/services/tradingAiMlArchitectureMilestoneReview.test.js",
      "server/src/services/tradingAiMlContractPrimitives.test.js",
    ]),
    checkerTestFiles: Object.freeze([
      "scripts/check-trading-step200-ai-ml-architecture-milestone-review.test.cjs",
      "scripts/check-trading-step201-ai-ml-contract-primitives-pilot.test.cjs",
      "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs",
    ]),
    additionalTestFiles: Object.freeze([]),
  }),
]);

function cloneGroup(group) {
  return Object.freeze({
    groupId: group.groupId,
    description: group.description,
    coveredStepIds: Object.freeze([...group.coveredStepIds]),
    serviceTestFiles: Object.freeze([...group.serviceTestFiles]),
    checkerTestFiles: Object.freeze([...group.checkerTestFiles]),
    additionalTestFiles: Object.freeze([...group.additionalTestFiles]),
  });
}

function listAiMlRegressionGroups() {
  return Object.freeze(AI_ML_REGRESSION_GROUPS.map(cloneGroup));
}

function getAiMlRegressionGroup(groupId) {
  const group = AI_ML_REGRESSION_GROUPS.find((item) => item.groupId === groupId);
  if (!group) return null;
  return cloneGroup(group);
}

function collectGroupTestFiles(group) {
  return Object.freeze([
    ...group.serviceTestFiles,
    ...group.checkerTestFiles,
    ...group.additionalTestFiles,
  ]);
}

function validateAiMlRegressionCoverage({ repoRoot = process.cwd() } = {}) {
  const groups = listAiMlRegressionGroups();
  const errors = [];
  const groupIds = groups.map((group) => group.groupId);
  const expectedGroupIds = ["architecture-foundation", "contract-chain", "consolidation-primitives"];
  const coveredSteps = groups.flatMap((group) => group.coveredStepIds);
  const serviceTests = groups.flatMap((group) => group.serviceTestFiles);
  const checkerTests = groups.flatMap((group) => group.checkerTestFiles);
  const allTestFiles = groups.flatMap(collectGroupTestFiles);
  const duplicateTestFiles = allTestFiles.filter((file, index) => allTestFiles.indexOf(file) !== index);

  if (JSON.stringify(groupIds) !== JSON.stringify(expectedGroupIds)) errors.push("group order mismatch");
  if (JSON.stringify(coveredSteps) !== JSON.stringify([...AI_ML_REQUIRED_REGRESSION_STEPS])) errors.push("step coverage mismatch");
  for (const stepId of AI_ML_REQUIRED_REGRESSION_STEPS) {
    if (!coveredSteps.includes(stepId)) errors.push(`missing step coverage: ${stepId}`);
  }
  for (const file of AI_ML_REQUIRED_SERVICE_TESTS) {
    if (!serviceTests.includes(file)) errors.push(`missing service test: ${file}`);
  }
  for (const file of AI_ML_REQUIRED_CHECKER_TESTS) {
    if (!checkerTests.includes(file)) errors.push(`missing checker test: ${file}`);
  }
  for (const file of duplicateTestFiles) errors.push(`duplicate test file: ${file}`);
  for (const file of allTestFiles) {
    if (/[?*[\]{}]/.test(file)) errors.push(`wildcard test path is not allowed: ${file}`);
    if (!fs.existsSync(`${repoRoot}/${file}`)) errors.push(`missing test path: ${file}`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    groupIds: Object.freeze(groupIds),
    coveredSteps: Object.freeze(coveredSteps),
    serviceTests: Object.freeze(serviceTests),
    checkerTests: Object.freeze(checkerTests),
    allTestFiles: Object.freeze(allTestFiles),
  });
}

module.exports = {
  AI_ML_REGRESSION_GROUPS,
  AI_ML_REQUIRED_REGRESSION_STEPS,
  AI_ML_REQUIRED_SERVICE_TESTS,
  AI_ML_REQUIRED_CHECKER_TESTS,
  collectGroupTestFiles,
  getAiMlRegressionGroup,
  listAiMlRegressionGroups,
  validateAiMlRegressionCoverage,
};
