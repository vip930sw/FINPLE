const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP222_SCRIPT = "check:trading-step222-finple-temp-producer-attribution";

const REQUIRED_FILES = [
  "package.json",
  "scripts/finple-temp-baseline-audit.cjs",
  "scripts/finple-temp-baseline-audit.test.cjs",
  "scripts/finple-temp-producer-attribution.cjs",
  "scripts/finple-temp-producer-attribution.test.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.test.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.test.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);

const FORBIDDEN_TOUCHED_FILES = [
  "scripts/finple-test-temp-guard.cjs",
  "scripts/check-trading-step206-finple-test-temp-guard.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/run-trading-ai-ml-regression-group.cjs",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_PRODUCTION_SNIPPETS = [
  "fs.rm",
  "fs.unlink",
  "fs.rmdir",
  "fs.writeFile",
  "fs.mkdir",
  "fs.rename",
  "fs.copyFile",
  "fs.chmod",
  "require(\"node:child_process\")",
  "spawn",
  "exec(",
  "fork(",
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
  const baseline = read("scripts/finple-temp-baseline-audit.cjs");
  const producer = read("scripts/finple-temp-producer-attribution.cjs");
  const producerTest = read("scripts/finple-temp-producer-attribution.test.cjs");
  const step221Checker = read("scripts/check-trading-step221-finple-temp-baseline-provenance.cjs");
  const checkerTest = read("scripts/check-trading-step222-finple-temp-producer-attribution.test.cjs");

  assertIncludes(packageJson, "\"diagnose:finple-temp-producers\"", "package producer diagnose script");
  assertIncludes(packageJson, `"${STEP222_SCRIPT}"`, "package Step222 script");
  assertIncludes(packageJson, "scripts/finple-temp-producer-attribution.test.cjs", "package producer test link");

  for (const snippet of [
    "buildFinpleTempProducerRegistry",
    "classifyFinpleTempEntryProducer",
    "buildFinpleTempProducerAttributionAudit",
    "diffFinpleTempProducerAttributionAudits",
    "buildFinpleTempProducerAttributionPublicSummary",
    "SOURCE_ROOTS = Object.freeze([\"scripts\", \"server/src\", \"src\"])",
    "SOURCE_EXTENSIONS",
    "matched_source_producer",
    "ambiguous_source_producer",
    "unmatched_runtime_shape",
    "guard_owned_current_contract",
    "exact_literal_prefix",
    "normalized_literal_prefix",
    "multiple_source_candidates",
    "no_source_candidate",
    "unmatched_shape_",
    "sourceMatched",
    "createdDuringControlledRun",
    "countStableAcrossControlledRun",
    "cleanupEligibility: \"not_assessed\"",
    "deletionApproved: false",
    "deletionAttempted: false",
    "rawNamesExposed: false",
    "absolutePathsExposed: false",
  ]) {
    assertIncludes(producer, snippet, "Step222 producer source");
  }

  for (const snippet of ["snapshotStatus: \"complete\"", "status: \"snapshot_complete\"", "collectFinpleTempInventory"]) {
    assertIncludes(baseline, snippet, "Step221 baseline compatibility");
  }

  for (const snippet of FORBIDDEN_PRODUCTION_SNIPPETS) {
    assertNotIncludes(producer, snippet, "Step222 read-only producer audit");
  }

  for (const scenario of [
    "Scenario A: exact source producer match",
    "Scenario B: normalized suffix match",
    "Scenario C: ambiguous producer",
    "Scenario D: unmatched shape",
    "Scenario E: deterministic producer IDs",
    "Scenario F: no raw identity exposure",
    "Scenario G: source allowlist",
    "Scenario H: source scan reads text without code execution",
    "Scenario I: production source has no deletion capability",
    "Scenario J: snapshot stable",
    "Scenario K: new producer entry",
    "Scenario L: mutation resistance",
  ]) {
    assertIncludes(producerTest, scenario, "Step222 producer test scenario");
  }

  for (const snippet of [
    "Step222 checker passes against repository source",
    "diagnose:finple-temp-producers",
    "stays scoped to producer attribution",
  ]) {
    assertIncludes(checkerTest, snippet, "Step222 checker test");
  }

  assertIncludes(step221Checker, "scripts/finple-temp-producer-attribution.cjs", "Step221 checker Step222 compatibility");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step222 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step222 touched file: ${file}`);
  }

  for (const routeDir of ["server/src/routes", "server/routes"]) {
    if (!fs.existsSync(routeDir)) continue;
    for (const entry of fs.readdirSync(routeDir)) {
      const routePath = `${routeDir}/${entry}`;
      if (!fs.statSync(routePath).isFile()) continue;
      const source = read(routePath);
      assertNotIncludes(source, "finple-temp-producers", "Step222 endpoint guard");
    }
  }

  console.log("[check-trading-step222-finple-temp-producer-attribution] ok");
})()
