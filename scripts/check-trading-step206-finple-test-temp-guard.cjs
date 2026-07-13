const fs = require("node:fs");

const REQUIRED_FILES = [
  "package.json",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.test.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.test.cjs",
];

const REQUIRED_PACKAGE_SCRIPTS = [
  "\"check:finple-temp-guard:ai-ml\"",
  "\"diagnose:finple-temp-guard:full\"",
  "\"check:trading-step206-finple-test-temp-guard\"",
  "\"check:trading-step219-windows-long-path-temp-cleanup\"",
  "\"check:trading-step220-platform-correct-temp-root-identity\"",
  "scripts/finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step205-ai-ml-collapsed-summary-polish.test.cjs",
  "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs",
];

const REQUIRED_MODES = [
  "\"ai-ml-architecture\"",
  "\"ai-ml-contracts\"",
  "\"ai-ml-consolidation\"",
  "\"ai-ml-all\"",
  "\"full-repository-diagnostic\"",
];

const REQUIRED_MODE_COMMANDS = [
  "[\"scripts/run-trading-ai-ml-regression-group.cjs\", \"--group\", \"architecture-foundation\"]",
  "[\"scripts/run-trading-ai-ml-regression-group.cjs\", \"--group\", \"contract-chain\"]",
  "[\"scripts/run-trading-ai-ml-regression-group.cjs\", \"--group\", \"consolidation-primitives\"]",
  "[\"scripts/run-trading-ai-ml-regression-group.cjs\", \"--all\"]",
  "[\"--test\", \"--test-reporter=dot\"]",
];

const REQUIRED_GUARD_SNIPPETS = [
  "process.execPath",
  "spawnSync",
  "shell: false",
  "TEMP: ownedRoot",
  "TMP: ownedRoot",
  "TMPDIR: ownedRoot",
  "fs.mkdtempSync",
  "path.join(tmpDir, OWNED_TEMP_PREFIX)",
  "finally",
  "cleanupOwnedTempRoot",
  "cleanupOwnedFinpleTempRoot",
  "normalizePathForIdentity",
  "platform === \"win32\" ? resolved.toLowerCase() : resolved",
  "function isSamePath(a, b, platform = process.platform)",
  "validateCleanupTarget",
  "fs.rmSync",
  "path.toNamespacedPath",
  "OWNED_TEMP_MARKER",
  ".finple-test-guard-owned",
  "expectedOwnedRoot",
  "markerValidated",
  "exactOwnedRootValidated",
  "retryCount",
  "cleanupPathMode",
  "ownedRootExistsAfter",
  "FULL_REPOSITORY_TIMEOUT_MS = 260000",
  "timed_out",
  "ETIMEDOUT",
  "globalFinpleCountDelta",
  "tempRootLabel",
  "finple-test-guard-owned",
];

const REQUIRED_TEST_SCENARIOS = [
  "Scenario A: owned TEMP root",
  "Scenario B: child environment isolates",
  "Scenario C: successful child cleanup",
  "Scenario D: failed child cleanup",
  "Scenario E: timeout cleanup",
  "Scenario F: cleanup path rejection",
  "Scenario M: shallow owned root cleanup helper",
  "Scenario N: deep nested owned root cleanup",
  "Scenario O: marker missing",
  "Scenario P: unsafe cleanup targets",
  "Scenario Q: cleanup retry succeeds",
  "Scenario R: permanent cleanup failure",
  "Scenario S: timeout result remains failed",
  "Scenario T: cleanup failure keeps overall guard result failed",
  "Scenario U: POSIX case-sensitive sibling mismatch",
  "Scenario V: Windows case-insensitive identity",
  "Scenario W: exact same path cleanup",
  "Scenario X: dot-segment path",
  "Scenario Y: POSIX case-only unsafe sibling",
  "Scenario Z: namespaced cleanup path",
  "Scenario G: pre-existing finple-* artifact",
  "Scenario H: isolated guarded run has global count delta 0",
  "Scenario I: unknown mode",
  "Scenario J: plan mode",
  "Scenario K: child exit code propagates",
  "Scenario L: command definitions and options resist mutation",
];

const FORBIDDEN_GUARD_SNIPPETS = [
  "shell: true",
  "execSync",
  "execFileSync",
  "eval(",
  "process.env.",
  "rmSync(os.tmpdir()",
  "rmSync(tmpDir",
  "finple-*",
  "credential",
  "secret",
  "password",
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
];

const UNTOUCHED_FILES = [
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
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

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const guard = read("scripts/finple-test-temp-guard.cjs");
const guardTest = read("scripts/finple-test-temp-guard.test.cjs");
const checkerTest = read("scripts/check-trading-step206-finple-test-temp-guard.test.cjs");

for (const snippet of REQUIRED_PACKAGE_SCRIPTS) assertIncludes(packageJson, snippet, "package script");
for (const mode of REQUIRED_MODES) assertIncludes(guard, mode, "allowlisted mode");
for (const command of REQUIRED_MODE_COMMANDS) assertIncludes(guard, command, "allowlisted command mapping");
for (const snippet of REQUIRED_GUARD_SNIPPETS) assertIncludes(guard, snippet, "guard implementation");
for (const scenario of REQUIRED_TEST_SCENARIOS) assertIncludes(guardTest, scenario, "guard test scenario");

assert(!guard.includes("process.argv.join"), "guard must not accept arbitrary command string");
assert(!guard.includes("commandString"), "guard must not build command strings");
assertIncludes(guard, "unknown mode", "unknown mode rejection");
assertIncludes(guard, "buildPlan", "plan mode support");
assertIncludes(guard, "globalCleanupProhibited", "global cleanup prohibition metadata");
assertIncludes(guard, "readdirSync(tmpDir", "read-only global temp inventory");
assertIncludes(guardTest, "fs.existsSync(preExisting), true", "pre-existing artifact preservation test");
assertIncludes(guardTest, "ETIMEDOUT", "timeout cleanup test");
assertIncludes(guardTest, "childExitCode, 7", "failure propagation test");
assertIncludes(guardTest, "exitCode, 42", "child exit propagation test");
assertIncludes(guardTest, "path.toNamespacedPath", "long-path fixture");
assertIncludes(guardTest, "markerValidated, false", "marker missing rejection test");
assertIncludes(guardTest, "retryCount, 1", "retry success test");
assertIncludes(guardTest, "cleanupSucceeded, false", "cleanup failure remains failed");
assertIncludes(guardTest, "isSamePath(expected, target, \"linux\"), false", "POSIX case-sensitive path identity");
assertIncludes(guardTest, "isSamePath(left, right, \"win32\"), true", "Windows case-insensitive path identity");
assertIncludes(guardTest, "dot-segment path normalizes", "dot segment normalization test");
assertIncludes(checkerTest, "Step206 checker passes against repository source", "checker self test");

for (const snippet of FORBIDDEN_GUARD_SNIPPETS) {
  assert(!guard.includes(snippet), `forbidden guard snippet: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
  assert(!guard.includes(snippet), `forbidden runtime/provider snippet in guard: ${snippet}`);
}

for (const file of UNTOUCHED_FILES) {
  const source = read(file);
  assert(!source.includes("Step206"), `Step206 marker must not touch existing source: ${file}`);
  assert(!source.includes("finple-test-temp-guard"), `temp guard marker must not touch existing source: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  for (const entry of fs.readdirSync(routeDir)) {
    const routePath = `${routeDir}/${entry}`;
    if (!fs.statSync(routePath).isFile()) continue;
    const source = read(routePath);
    assert(!source.includes("Step206"), `Step206 must not add endpoint marker: ${routePath}`);
    assert(!source.includes("finple-test-temp-guard"), `temp guard must not touch endpoint source: ${routePath}`);
  }
}

console.log("[check-trading-step206-finple-test-temp-guard] ok");
