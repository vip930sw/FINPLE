const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP220_SCRIPT = "check:trading-step220-platform-correct-temp-root-identity";

const REQUIRED_FILES = [
  "package.json",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.test.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.test.cjs",
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
  const step219Checker = read("scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs");

  assertIncludes(packageJson, `"${STEP220_SCRIPT}"`, "package Step220 script");
  assertIncludes(packageJson, "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs", "package Step220 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step220-platform-correct-temp-root-identity.test.cjs", "package Step220 checker test link");

  for (const snippet of [
    "function normalizePathForIdentity(value, platform = process.platform)",
    "const resolved = path.normalize(path.resolve(value));",
    "platform === \"win32\" ? resolved.toLowerCase() : resolved",
    "function isSamePath(a, b, platform = process.platform)",
    "normalizePathForIdentity(a, platform) === normalizePathForIdentity(b, platform)",
    "validateCleanupTarget(targetRoot, ownedRoot, { tmpDir = os.tmpdir(), platform = process.platform }",
    "validateCleanupTarget(ownedRoot, expectedOwnedRoot, { tmpDir, platform })",
    "function toCleanupPath",
    "path.toNamespacedPath",
    "OWNED_TEMP_MARKER",
    "markerValidated",
    "retryCount",
    "FULL_REPOSITORY_TIMEOUT_MS = 260000",
  ]) {
    assertIncludes(guard, snippet, "Step220 guard identity hardening");
  }

  assertNotIncludes(guard, "path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()", "legacy all-platform lowercase comparison");
  assertNotIncludes(guard, "normalizePathForIdentity(path.toNamespacedPath", "namespaced path identity comparison");
  assertNotIncludes(guard, "FULL_REPOSITORY_TIMEOUT_MS = 300000", "timeout must not be changed");

  for (const scenario of [
    "Scenario U: POSIX case-sensitive sibling mismatch is rejected",
    "Scenario V: Windows case-insensitive identity stays helper-only",
    "Scenario W: exact same path cleanup is allowed",
    "Scenario X: dot-segment path normalizes to the exact owned root",
    "Scenario Y: POSIX case-only unsafe sibling is preserved",
    "Scenario Z: namespaced cleanup path remains separate from identity comparison",
    "Scenario N: deep nested owned root cleanup uses long-path safe removal",
    "Scenario Q: cleanup retry succeeds after controlled transient failure",
    "Scenario S: timeout result remains failed even when cleanup succeeds",
  ]) {
    assertIncludes(guardTest, scenario, "Step220 guard scenario");
  }

  for (const snippet of [
    "isSamePath(expected, target, \"linux\"), false",
    "isSamePath(expected, target, \"win32\"), true",
    "isSamePath(left, right, \"win32\"), true",
    "normalizePathForIdentity(left, \"win32\")",
    "normalizePathForIdentity(left, \"linux\")",
    "exactOwnedRootValidated, false",
    "targetWithDotSegment",
    "path.toNamespacedPath",
    "cleanupSucceeded, true",
    "cleanupSucceeded, false",
  ]) {
    assertIncludes(guardTest, snippet, "Step220 guard assertion");
  }

  for (const snippet of [
    "normalizePathForIdentity",
    "Scenario U: POSIX case-sensitive sibling mismatch",
    "Scenario V: Windows case-insensitive identity",
    "Scenario Y: POSIX case-only unsafe sibling",
  ]) {
    assertIncludes(step206Checker, snippet, "Step206 identity hardening");
    assertIncludes(step219Checker, snippet, "Step219 identity hardening");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step220 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step220 touched file: ${file}`);
  }

  const combinedGuardSource = [guard, packageJson].join("\n");
  for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
    assertNotIncludes(combinedGuardSource, snippet, "Step220 runtime/provider guard");
  }

  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    for (const entry of fs.readdirSync(routeDir)) {
      const routePath = `${routeDir}/${entry}`;
      if (!fs.statSync(routePath).isFile()) continue;
      const source = read(routePath);
      assertNotIncludes(source, "platform-correct-temp-root-identity", "Step220 endpoint guard");
      assertNotIncludes(source, "finple-test-temp-guard", "Step220 endpoint guard");
    }
  }

  console.log("[check-trading-step220-platform-correct-temp-root-identity] ok");
})()
