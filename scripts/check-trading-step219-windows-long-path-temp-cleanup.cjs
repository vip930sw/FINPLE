const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP219_SCRIPT = "check:trading-step219-windows-long-path-temp-cleanup";

const REQUIRED_FILES = [
  "package.json",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.test.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.test.cjs",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_RUNTIME_SNIPPETS = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
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

(function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const guard = read("scripts/finple-test-temp-guard.cjs");
  const guardTest = read("scripts/finple-test-temp-guard.test.cjs");
  const step206Checker = read("scripts/check-trading-step206-finple-test-temp-guard.cjs");
  const step206CheckerTest = read("scripts/check-trading-step206-finple-test-temp-guard.test.cjs");

  assertIncludes(packageJson, `"${STEP219_SCRIPT}"`, "package Step219 script");
  assertIncludes(packageJson, "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs", "package Step219 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step219-windows-long-path-temp-cleanup.test.cjs", "package Step219 checker test link");
  assertIncludes(packageJson, "scripts/finple-test-temp-guard.test.cjs", "package guard test link");
  assertIncludes(packageJson, "scripts/check-trading-step206-finple-test-temp-guard.test.cjs", "package Step206 test link");

  for (const snippet of [
    "function cleanupOwnedFinpleTempRoot",
    "cleanupOwnedTempRoot",
    "function toCleanupPath",
    "path.toNamespacedPath",
    "OWNED_TEMP_MARKER",
    ".finple-test-guard-owned",
    "expectedOwnedRoot",
    "validateCleanupTarget(ownedRoot, expectedOwnedRoot",
    "markerValidated",
    "exactOwnedRootValidated",
    "cleanupPathMode",
    "windows_namespaced",
    "standard",
    "retryCount",
    "DEFAULT_CLEANUP_MAX_RETRIES",
    "DEFAULT_CLEANUP_RETRY_DELAY_MS",
    "Math.min(Number(maxRetries) || 0, 5)",
    "ownedRootExistsAfter",
    "globalFinpleCountDelta",
    "childPassed",
    "configuredTimeoutMs",
    "FULL_REPOSITORY_TIMEOUT_MS = 260000",
    "shell: false",
  ]) {
    assertIncludes(guard, snippet, "Step219 guard hardening");
  }

  for (const forbidden of [
    "rmSync(os.tmpdir()",
    "rmSync(tmpDir",
    "shell: true",
    "process.argv.join",
    "commandString",
    "cleanupSucceeded = true; } catch",
  ]) {
    assertNotIncludes(guard, forbidden, "Step219 forbidden cleanup pattern");
  }

  for (const scenario of [
    "Scenario M: shallow owned root cleanup helper removes marked root",
    "Scenario N: deep nested owned root cleanup uses long-path safe removal",
    "Scenario O: marker missing rejects cleanup without deleting root",
    "Scenario P: unsafe cleanup targets are rejected",
    "Scenario Q: cleanup retry succeeds after controlled transient failure",
    "Scenario R: permanent cleanup failure is not converted to success",
    "Scenario S: timeout result remains failed even when cleanup succeeds",
    "Scenario T: cleanup failure keeps overall guard result failed",
    "Scenario G: pre-existing finple-* artifact in temp fixture is preserved",
    "Scenario H: isolated guarded run has global count delta 0",
  ]) {
    assertIncludes(guardTest, scenario, "Step219 guard scenario");
  }

  for (const snippet of [
    "path.toNamespacedPath",
    "markerValidated, false",
    "wrongRoot.cleanupSucceeded, false",
    "retryCount, 1",
    "retryCount, 2",
    "result.timedOut, true",
    "result.childPassed, false",
    "result.globalFinpleCountDelta, 0",
    "result.ok, false",
    "fs.existsSync(preExisting), true",
  ]) {
    assertIncludes(guardTest, snippet, "Step219 guard assertion");
  }

  for (const snippet of [
    "path.toNamespacedPath",
    "OWNED_TEMP_MARKER",
    "cleanupOwnedFinpleTempRoot",
    "Scenario N: deep nested owned root cleanup",
    "Scenario Q: cleanup retry succeeds",
    "Scenario S: timeout result remains failed",
    "Scenario T: cleanup failure keeps overall guard result failed",
  ]) {
    assertIncludes(step206Checker, snippet, "Step206 strengthened checker");
  }
  assertIncludes(step206CheckerTest, "Step206 checker passes against repository source", "Step206 self test preserved");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step219 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step219 touched file: ${file}`);
  }

  const combinedGuardSource = [guard, packageJson].join("\n");
  for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
    assertNotIncludes(combinedGuardSource, snippet, "Step219 runtime/provider guard");
  }

  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    for (const entry of fs.readdirSync(routeDir)) {
      const routePath = `${routeDir}/${entry}`;
      if (!fs.statSync(routePath).isFile()) continue;
      const source = read(routePath);
      assertNotIncludes(source, "windows-long-path-temp-cleanup", "Step219 endpoint guard");
      assertNotIncludes(source, "finple-test-temp-guard", "Step219 endpoint guard");
    }
  }

  console.log("[check-trading-step219-windows-long-path-temp-cleanup] ok");
})()
