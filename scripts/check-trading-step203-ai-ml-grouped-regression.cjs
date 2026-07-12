const fs = require("node:fs");
const nodeAssert = require("node:assert/strict");
const path = require("node:path");
const {
  AI_ML_REQUIRED_CHECKER_TESTS,
  AI_ML_REQUIRED_REGRESSION_STEPS,
  AI_ML_REQUIRED_SERVICE_TESTS,
  listAiMlRegressionGroups,
  validateAiMlRegressionCoverage,
} = require("./trading-ai-ml-regression-groups.cjs");

const REQUIRED_FILES = [
  "package.json",
  "scripts/trading-ai-ml-regression-groups.cjs",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "scripts/trading-ai-ml-regression-groups.test.cjs",
  "scripts/run-trading-ai-ml-regression-group.test.cjs",
  "scripts/check-trading-step203-ai-ml-grouped-regression.cjs",
  "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
];

const REQUIRED_PACKAGE_SCRIPTS = [
  "\"check:trading-ai-ml-regression:architecture\"",
  "\"check:trading-ai-ml-regression:contracts\"",
  "\"check:trading-ai-ml-regression:consolidation\"",
  "\"check:trading-ai-ml-regression\"",
  "\"check:trading-step203-ai-ml-grouped-regression\"",
];

const REQUIRED_GROUP_IDS = [
  "architecture-foundation",
  "contract-chain",
  "consolidation-primitives",
];

const FORBIDDEN_RUNTIME_SNIPPETS = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "writeFile",
  "appendFile",
  "mkdir",
  "createWriteStream",
  "pandas",
  "numpy",
  "torch",
  "tensorflow",
  "xgboost",
  "lightgbm",
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

function checkerSourceForTest(testFile) {
  return testFile.replace(/\.test\.cjs$/, ".cjs");
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const manifestSource = read("scripts/trading-ai-ml-regression-groups.cjs");
const runnerSource = read("scripts/run-trading-ai-ml-regression-group.cjs");
const manifestTest = read("scripts/trading-ai-ml-regression-groups.test.cjs");
const runnerTest = read("scripts/run-trading-ai-ml-regression-group.test.cjs");
const checkerTest = read("scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs");
const dashboardShell = read("server/src/services/tradingAdminLabDashboardShell.js");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");

for (const snippet of REQUIRED_PACKAGE_SCRIPTS) assertIncludes(packageJson, snippet, "package script");
for (const groupId of REQUIRED_GROUP_IDS) assertIncludes(manifestSource, groupId, "group id");
for (const stepId of AI_ML_REQUIRED_REGRESSION_STEPS) assertIncludes(manifestSource, stepId, "required step");
for (const file of AI_ML_REQUIRED_SERVICE_TESTS) assertIncludes(manifestSource, file, "service test coverage");
for (const file of AI_ML_REQUIRED_CHECKER_TESTS) assertIncludes(manifestSource, file, "checker test coverage");

const coverage = validateAiMlRegressionCoverage();
assert(coverage.ok, coverage.errors.join("\n"));
nodeAssert.deepEqual(coverage.groupIds, REQUIRED_GROUP_IDS);
nodeAssert.deepEqual(coverage.coveredSteps, AI_ML_REQUIRED_REGRESSION_STEPS);

for (const file of coverage.allTestFiles) {
  assert(!/[?*[\]{}]/.test(file), `wildcard path is forbidden: ${file}`);
  assert(fs.existsSync(file), `missing grouped test path: ${file}`);
}
assert(new Set(coverage.allTestFiles).size === coverage.allTestFiles.length, "duplicate grouped test file found");

for (const checkerTestFile of AI_ML_REQUIRED_CHECKER_TESTS) {
  const checkerSource = checkerSourceForTest(checkerTestFile);
  assert(fs.existsSync(checkerSource), `missing checker source: ${checkerSource}`);
  const testSource = read(checkerTestFile);
  assertIncludes(testSource, path.basename(checkerSource), `checker test source link: ${checkerTestFile}`);
}

for (const snippet of [
  "process.execPath",
  "--test",
  "--test-reporter=dot",
  "shell: false",
  "unknown AI/ML regression group",
  "empty test file list is not allowed",
  "runAllGroups",
]) {
  assertIncludes(runnerSource, snippet, "runner behavior");
}
assert(!runnerSource.includes("shell: true"), "runner must not enable shell execution");
assert(!runnerSource.includes("execFileSync"), "runner should use injectable spawnSync execution");
assertIncludes(runnerTest, "Scenario I: child failure propagates", "child failure propagation test");
assertIncludes(runnerTest, "Scenario G: plan mode", "plan mode test");
assertIncludes(runnerTest, "Scenario H: command construction", "command construction test");
assertIncludes(manifestTest, "Scenario B: Step 191 through Step 202 coverage is complete", "coverage test");
assertIncludes(manifestTest, "Scenario C: no test file is duplicated across groups", "duplicate test");
assertIncludes(checkerTest, "Step203 checker passes against repository source", "checker self test");
assertIncludes(packageJson, "scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.test.cjs", "Step202 checker linkage");

for (const source of [manifestSource, runnerSource]) {
  for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
    assert(!source.includes(snippet), `forbidden runtime snippet in Step203 runtime script: ${snippet}`);
  }
}

for (const sourceFile of [
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
]) {
  assert(!read(sourceFile).includes("Step203"), `Step203 marker must not touch service source: ${sourceFile}`);
}
assert(!dashboardShell.includes("Step203"), "dashboard shell must not reference Step203");
assert(!panel.includes("Step203"), "TradingReadinessPanel must not reference Step203");
assert(!css.includes("Step203"), "App.css must not reference Step203");

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file)).join("\n");
  assert(!routeFiles.includes("step203"), "Step203 must not add routes");
  assert(!routeFiles.includes("GroupedRegression"), "Step203 must not add endpoints");
}

console.log("[check-trading-step203-ai-ml-grouped-regression] ok");
