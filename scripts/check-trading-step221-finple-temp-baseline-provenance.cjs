const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP221_SCRIPT = "check:trading-step221-finple-temp-baseline-provenance";

const REQUIRED_FILES = [
  "package.json",
  "scripts/finple-temp-baseline-audit.cjs",
  "scripts/finple-temp-baseline-audit.test.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "scripts/finple-test-temp-guard.cjs",
  "scripts/finple-test-temp-guard.test.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_AUDIT_SNIPPETS = [
  "fs.rm",
  "fs.unlink",
  "fs.rmdir",
  "fs.writeFile",
  "fs.mkdir",
  "fs.rename",
  "require(\"node:child_process\")",
  "process.argv[2]",
  "--delete",
  "--path",
  "--command",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForReadOnlyProviderCalls: true",
  "readyForOrderSubmission: true",
  "readyForLiveGuardedTrading: true",
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
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
  const audit = read("scripts/finple-temp-baseline-audit.cjs");
  const auditTest = read("scripts/finple-temp-baseline-audit.test.cjs");
  const checkerTest = read("scripts/check-trading-step221-finple-temp-baseline-provenance.test.cjs");

  assertIncludes(packageJson, "\"diagnose:finple-temp-baseline\"", "package baseline diagnose script");
  assertIncludes(packageJson, `"${STEP221_SCRIPT}"`, "package Step221 script");
  assertIncludes(packageJson, "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs", "package Step221 checker link");
  assertIncludes(packageJson, "scripts/finple-temp-baseline-audit.test.cjs", "package Step221 audit test link");

  for (const snippet of [
    "function classifyFinpleTempEntry",
    "function buildFinpleTempBaselineAudit",
    "function diffFinpleTempBaselineAudits",
    "function buildFinpleTempBaselinePublicSummary",
    "guard_owned_prefix",
    "step_runner_prefix",
    "test_fixture_prefix",
    "other_known_finple_prefix",
    "unclassified_finple_prefix",
    "less_than_1_hour",
    "1_to_24_hours",
    "1_to_7_days",
    "7_to_30_days",
    "more_than_30_days",
    "markerPresentCount",
    "markerMissingCount",
    "guardPrefixWithMarkerCount",
    "guardPrefixWithoutMarkerCount",
    "unmanagedEntryCount",
    "rawNamesExposed: false",
    "absolutePathsExposed: false",
    "deletionAttempted: false",
    "redacted: true",
  ]) {
    assertIncludes(audit, snippet, "Step221 audit source");
  }

  for (const snippet of FORBIDDEN_AUDIT_SNIPPETS) {
    assertNotIncludes(audit, snippet, "Step221 read-only audit");
  }

  for (const scenario of [
    "Scenario A: family classification",
    "Scenario B: marker classification",
    "Scenario C: age buckets",
    "Scenario D: public summary exposes no raw path",
    "Scenario E: snapshot increase",
    "Scenario F: identical snapshots",
    "Scenario G: audit source has no deletion or write capability",
    "Scenario H: mutation resistance",
  ]) {
    assertIncludes(auditTest, scenario, "Step221 audit test scenario");
  }

  for (const snippet of [
    "totalCountDelta, 2",
    "status, \"increased\"",
    "status, \"stable\"",
    "serialized.includes(fixture), false",
    "serialized.includes(rawName), false",
    "unmanagedEntryCount, 2",
  ]) {
    assertIncludes(auditTest, snippet, "Step221 audit assertion");
  }

  for (const snippet of [
    "Step221 checker passes against repository source",
    "diagnose:finple-temp-baseline",
    "stays scoped to read-only TEMP baseline provenance",
  ]) {
    assertIncludes(checkerTest, snippet, "Step221 checker test");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step221 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step221 touched file: ${file}`);
  }

  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    for (const entry of fs.readdirSync(routeDir)) {
      const routePath = `${routeDir}/${entry}`;
      if (!fs.statSync(routePath).isFile()) continue;
      const source = read(routePath);
      assertNotIncludes(source, "finple-temp-baseline", "Step221 endpoint guard");
    }
  }

  console.log("[check-trading-step221-finple-temp-baseline-provenance] ok");
})()
