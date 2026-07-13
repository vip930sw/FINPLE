const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const STEP230_SCRIPT = "check:trading-step230-offline-dataset-quality-batch-summary";
const STEP230_SERVICE = "server/src/services/tradingAiMlDatasetQualityBatchSummary.js";
const STEP230_TEST = "server/src/services/tradingAiMlDatasetQualityBatchSummary.test.js";
const STEP230_CHECKER = "scripts/check-trading-step230-offline-dataset-quality-batch-summary.cjs";
const STEP230_CHECKER_TEST = "scripts/check-trading-step230-offline-dataset-quality-batch-summary.test.cjs";
const STEP229_SERVICE = "server/src/services/tradingAiMlDatasetQualityProfile.js";
const STEP229_CHECKER = "scripts/check-trading-step229-offline-dataset-quality-profile.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP230_SERVICE,
  STEP230_TEST,
  STEP230_CHECKER,
  STEP230_CHECKER_TEST,
  STEP229_SERVICE,
  STEP229_CHECKER,
  SNAPSHOT_PATH,
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP230_SERVICE,
  STEP230_TEST,
  STEP230_CHECKER,
  STEP230_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  STEP229_SERVICE,
  STEP229_CHECKER,
  "server/src/services/tradingAiMlDatasetQualityProfile.test.js",
  "data/processed/trading-ai-ml/step192_contract_hardening_snapshot.json",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "docs/trading-ai-ml/FINPLE_STEP192_CONTRACT_HARDENING_HANDOFF.md",
  "scripts/snapshot-trading-step192-contract-hardening-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/report-trading-ai-ml-audit-summary.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "scripts/check-trading-step228-contract-hardening-handoff.cjs",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/index.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  ".github/workflows",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "createWriteStream",
  "spawn(",
  "exec(",
  "runPython(",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "xgboost",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForLiveGuardedTrading: true",
];

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "summaryMode",
  "sourceProfileSchemaVersion",
  "fixtureCounts",
  "recordCounts",
  "issueCounts",
  "fixtureResults",
  "overallStatus",
];

const EXPECTED_ISSUE_COUNTS = {
  missingRequiredFields: 1,
  duplicateRecordIds: 2,
  crossSplitDuplicates: 1,
  temporalOverlap: 1,
  futureLeakage: 2,
  invalidWalkForward: 1,
  metadataIncomplete: 0,
  sensitivePayload: 1,
  thresholdTypeViolation: 1,
  labelImbalance: 1,
};

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

function getStatus() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .sort();
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return [...new Set([...tracked, ...getStatus()])].map((file) => file.replace(/\\/g, "/")).sort();
}

function assertStep228SnapshotUnchanged() {
  const snapshot = JSON.parse(read(SNAPSHOT_PATH));
  assertStrict.deepEqual(Object.keys(snapshot), SNAPSHOT_TOP_LEVEL_KEYS);
  assert(snapshot.baselineCommit === BASELINE_COMMIT, "Step228 baselineCommit changed");
  assertStrict.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert(snapshot.coreAudit.expectedStageCount === 9, "Step228 core stage count changed");
  assert(snapshot.coreAudit.counts.sourceCheckerCount === 13, "Step228 source checker count changed");
  assert(snapshot.coreAudit.counts.uniqueTestFileCount === 35, "Step228 unique test file count changed");
  assert(snapshot.supplementalGuards.count === 1, "Step228 supplemental count changed");
  assert(snapshot.totals.totalSourceCheckerCount === 14, "Step228 total source checker count changed");
  assert(snapshot.totals.totalUniqueCheckerTestCount === 26, "Step228 checker test count changed");
  assert(snapshot.totals.totalUniqueTestFileCount === 37, "Step228 total test file count changed");
  assert(snapshot.duplicates.duplicateFileCount === 0, "Step228 duplicate file count changed");
  assert(snapshot.readiness.actualLiveTradingReady === false, "Step228 readiness changed");
  assert(snapshot.readiness.state === "blocked", "Step228 readiness state changed");
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const service = read(STEP230_SERVICE);
  const serviceTest = read(STEP230_TEST);
  const step229Service = read(STEP229_SERVICE);

  assertIncludes(packageJson, `"${STEP230_SCRIPT}"`, "package Step230 script");
  assertIncludes(packageJson, STEP230_CHECKER, "package Step230 checker link");
  assertIncludes(packageJson, STEP230_CHECKER_TEST, "package Step230 checker test link");
  assertIncludes(packageJson, STEP230_TEST, "package Step230 service test link");
  assertIncludes(packageJson, `"check:trading-step229-offline-dataset-quality-profile"`, "package Step229 standalone checker");

  for (const snippet of [
    "buildStep229OfflineDatasetQualityProfile",
    "buildStep229OfflineDatasetQualityFixture",
    "buildStep230OfflineDatasetQualityBatchSummary",
    "buildStep230OfflineDatasetQualityFixtureCatalog",
    "fixtureCounts",
    "issueCounts",
    "fixtureResults",
    "overallStatusFromFixtureCounts",
    "duplicate fixtureKey",
  ]) {
    assertIncludes(service, snippet, "Step230 service source");
  }
  assertIncludes(step229Service, "STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION", "Step229 service schema export");

  for (const forbidden of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(service, forbidden, "Step230 service runtime code");
  }

  for (const snippet of [
    "exposes exact top-level and nested key sets",
    "fixture counts and status counts match the required catalog",
    "aggregate record counts and issue counts match Step229 profiles",
    "overall status prioritizes blocked then review_required then pass",
    "rejects duplicate fixture keys and empty input",
    "canonical output ignores fixture input order",
    "does not mutate fixture input or Step229 profile output",
    "excludes raw record IDs, raw labels, provider payload, and sensitive values",
    "numeric and string threshold fixtures preserve Step229 policy",
    "Step230 contract exports exact keys",
  ]) {
    assertIncludes(serviceTest, snippet, "Step230 test source");
  }

  const moduleUrl = pathToFileURL(`${process.cwd()}/${STEP230_SERVICE}`).href;
  const step230 = await import(`${moduleUrl}?check=${Date.now()}`);
  const catalog = step230.buildStep230OfflineDatasetQualityFixtureCatalog();
  const summary = step230.buildStep230OfflineDatasetQualityBatchSummary(catalog);

  assertStrict.deepEqual(Object.keys(summary), EXPECTED_TOP_LEVEL_KEYS);
  assert(summary.schemaVersion === "1.0.0", "schemaVersion mismatch");
  assert(summary.summaryMode === "offline_fixture_batch", "summaryMode mismatch");
  assert(summary.sourceProfileSchemaVersion === "1.0.0", "source profile schema mismatch");
  assertStrict.deepEqual(summary.fixtureCounts, {
    total: 12,
    pass: 3,
    reviewRequired: 1,
    blocked: 8,
  });
  assertStrict.deepEqual(summary.recordCounts, {
    total: 72,
    train: 36,
    validation: 24,
    test: 12,
  });
  assertStrict.deepEqual(summary.issueCounts, EXPECTED_ISSUE_COUNTS);
  assert(summary.fixtureResults.length === 12, "fixture result count mismatch");
  assert(summary.overallStatus === "blocked", "overall status mismatch");
  assertStrict.deepEqual(summary.fixtureResults.map((result) => result.fixtureKey), [...summary.fixtureResults.map((result) => result.fixtureKey)].sort());
  assert(summary.fixtureResults.every((result) => Object.keys(result).join(",") === "fixtureKey,status"), "fixture result surface too wide");

  const shuffled = step230.buildStep230OfflineDatasetQualityBatchSummary([...catalog].reverse());
  assertStrict.deepEqual(shuffled, summary);
  assertStrict.deepEqual(step230.buildStep230OfflineDatasetQualityBatchSummary(catalog), summary);
  assertStrict.throws(() => step230.buildStep230OfflineDatasetQualityBatchSummary([]), /at least one fixture/);
  const duplicate = JSON.parse(JSON.stringify(catalog));
  duplicate[1].fixtureKey = duplicate[0].fixtureKey;
  assertStrict.throws(() => step230.buildStep230OfflineDatasetQualityBatchSummary(duplicate), /duplicate fixtureKey/);

  const serializedSummary = JSON.stringify(summary);
  for (const forbidden of [
    "step229-record-001",
    "step229-record-006",
    "downside",
    "stable",
    "upside",
    "secret token value",
    "rawProviderPayload",
    "provider payload",
    "raw metadata",
    "account",
    "order data",
    "hash",
    "digest",
    "fingerprint",
    "credential",
    "token",
  ]) {
    assert(!serializedSummary.includes(forbidden), `summary leaks forbidden material: ${forbidden}`);
  }

  assertStep228SnapshotUnchanged();

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step230 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step230 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step230 check modified the working tree");

  console.log("[check-trading-step230-offline-dataset-quality-batch-summary] ok");
  console.log(JSON.stringify({
    schemaVersion: summary.schemaVersion,
    summaryMode: summary.summaryMode,
    sourceProfileSchemaVersion: summary.sourceProfileSchemaVersion,
    fixtureCounts: summary.fixtureCounts,
    recordCounts: summary.recordCounts,
    issueCounts: summary.issueCounts,
    overallStatus: summary.overallStatus,
    step228BaselineCommit: BASELINE_COMMIT,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
