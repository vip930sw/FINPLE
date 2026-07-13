const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const STEP229_SCRIPT = "check:trading-step229-offline-dataset-quality-profile";
const STEP229_SERVICE = "server/src/services/tradingAiMlDatasetQualityProfile.js";
const STEP229_TEST = "server/src/services/tradingAiMlDatasetQualityProfile.test.js";
const STEP229_CHECKER = "scripts/check-trading-step229-offline-dataset-quality-profile.cjs";
const STEP229_CHECKER_TEST = "scripts/check-trading-step229-offline-dataset-quality-profile.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP229_SERVICE,
  STEP229_TEST,
  STEP229_CHECKER,
  STEP229_CHECKER_TEST,
  SNAPSHOT_PATH,
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP229_SERVICE,
  STEP229_TEST,
  STEP229_CHECKER,
  STEP229_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  "data/processed/trading-ai-ml/step192_contract_hardening_snapshot.json",
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
  "modelTrainingAllowed: true",
  "providerCallsAllowed: true",
  "orderSubmissionAllowed: true",
  "readyForLiveGuardedTrading: true",
];

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "profileMode",
  "sourceContract",
  "recordCounts",
  "labelDistribution",
  "qualityChecks",
  "thresholdPolicy",
  "status",
];

const EXPECTED_QUALITY_CHECK_KEYS = [
  "missingRequiredFields",
  "duplicateRecordIds",
  "crossSplitDuplicates",
  "temporalOverlapDetected",
  "invalidWalkForwardWindows",
  "futureLeakageDetected",
  "metadataComplete",
  "retentionPolicyPresent",
  "labelImbalanceDetected",
  "sensitivePayloadDetected",
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

function mutable(value) {
  return JSON.parse(JSON.stringify(value));
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
  const service = read(STEP229_SERVICE);
  const testSource = read(STEP229_TEST);

  assertIncludes(packageJson, `"${STEP229_SCRIPT}"`, "package Step229 script");
  assertIncludes(packageJson, STEP229_CHECKER, "package Step229 checker link");
  assertIncludes(packageJson, STEP229_CHECKER_TEST, "package Step229 checker test link");
  assertIncludes(packageJson, STEP229_TEST, "package Step229 service test link");

  for (const snippet of [
    "buildStep229OfflineDatasetQualityProfile",
    "buildStep229OfflineDatasetQualityFixture",
    "STEP229_OFFLINE_DATASET_QUALITY_REQUIRED_RECORD_FIELDS",
    "missingRequiredFields",
    "crossSplitDuplicates",
    "temporalOverlapDetected",
    "futureLeakageDetected",
    "metadataComplete",
    "sensitivePayloadDetected",
    "numericThresholdZeroPreserved",
    "stringThresholdTypePreserved",
    "runtimePayloadUnchanged: true",
    "readyForLiveGuardedTrading === false",
  ]) {
    assertIncludes(service, snippet, "Step229 service source");
  }

  for (const forbidden of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(service, forbidden, "Step229 service runtime code");
  }

  for (const snippet of [
    "normal offline fixture produces a pass profile",
    "blocks missing required record fields",
    "blocks cross split duplicates",
    "blocks temporal overlap and future leakage",
    "requires review for label imbalance",
    "deterministic across repeated calls and shuffled input",
    "does not mutate the input fixture or Step192 runtime output",
    "blocks sensitive strings and raw payload-like fields",
    "preserves threshold type policy",
  ]) {
    assertIncludes(testSource, snippet, "Step229 test source");
  }

  const moduleUrl = pathToFileURL(`${process.cwd()}/${STEP229_SERVICE}`).href;
  const step229 = await import(`${moduleUrl}?check=${Date.now()}`);
  const fixture = step229.buildStep229OfflineDatasetQualityFixture();
  const profile = step229.buildStep229OfflineDatasetQualityProfile(fixture);

  assertStrict.deepEqual(Object.keys(profile), EXPECTED_TOP_LEVEL_KEYS);
  assertStrict.deepEqual(Object.keys(profile.qualityChecks), EXPECTED_QUALITY_CHECK_KEYS);
  assert(profile.schemaVersion === "1.0.0", "schemaVersion mismatch");
  assert(profile.profileMode === "offline_fixture", "profileMode mismatch");
  assertStrict.deepEqual(profile.recordCounts, { total: 6, train: 3, validation: 2, test: 1 });
  assert(profile.status === "pass", "default fixture should pass");
  assert(profile.qualityChecks.missingRequiredFields === 0, "default fixture has missing fields");
  assert(profile.qualityChecks.crossSplitDuplicates === 0, "default fixture has cross split duplicates");
  assert(profile.qualityChecks.temporalOverlapDetected === false, "default fixture has temporal overlap");
  assert(profile.qualityChecks.futureLeakageDetected === false, "default fixture has future leakage");
  assert(profile.qualityChecks.metadataComplete === true, "default fixture metadata incomplete");
  assert(profile.qualityChecks.sensitivePayloadDetected === false, "default fixture sensitive payload detected");
  assert(profile.thresholdPolicy.numericThresholdZeroPreserved === true, "numeric threshold zero not preserved");
  assert(profile.thresholdPolicy.numericThresholdType === "number", "numeric threshold type mismatch");
  assert(profile.thresholdPolicy.stringThresholdTypePreserved === true, "string threshold type not preserved");
  assert(profile.thresholdPolicy.stringThresholdType === "string", "string threshold type mismatch");
  assert(profile.sourceContract.runtimePayloadUnchanged === true, "runtime payload policy changed");
  assert(profile.sourceContract.readinessUnchanged === true, "readiness policy changed");

  const missingFixture = mutable(fixture);
  delete missingFixture.records[0].label;
  assert(step229.buildStep229OfflineDatasetQualityProfile(missingFixture).status === "blocked", "missing required fields should block");

  const duplicateFixture = mutable(fixture);
  duplicateFixture.records[5].recordId = duplicateFixture.records[0].recordId;
  assert(step229.buildStep229OfflineDatasetQualityProfile(duplicateFixture).status === "blocked", "cross split duplicates should block");

  const leakageFixture = mutable(fixture);
  leakageFixture.records[1].featureTimestamp = "2024-08-31T00:00:00.000Z";
  leakageFixture.records[1].labelTimestamp = "2024-07-31T00:00:00.000Z";
  assert(step229.buildStep229OfflineDatasetQualityProfile(leakageFixture).status === "blocked", "future leakage should block");

  const imbalanceFixture = mutable(fixture);
  for (const record of imbalanceFixture.records) record.label = "downside";
  assert(step229.buildStep229OfflineDatasetQualityProfile(imbalanceFixture).status === "review_required", "label imbalance should require review");

  const sensitiveFixture = mutable(fixture);
  sensitiveFixture.records[0].rawProviderPayload = "secret token value";
  assert(step229.buildStep229OfflineDatasetQualityProfile(sensitiveFixture).status === "blocked", "sensitive payload should block");

  const fixtureBefore = JSON.stringify(fixture);
  const first = step229.buildStep229OfflineDatasetQualityProfile(fixture);
  const second = step229.buildStep229OfflineDatasetQualityProfile(fixture);
  assertStrict.deepEqual(second, first);
  assert(JSON.stringify(fixture) === fixtureBefore, "profile generation mutated fixture");

  const serializedProfile = JSON.stringify(profile);
  for (const forbidden of [
    "credential",
    "secret",
    "token",
    "provider payload",
    "order payload",
    "raw provider",
    "hash",
    "digest",
    "fingerprint",
  ]) {
    assert(!serializedProfile.toLowerCase().includes(forbidden), `profile leaks forbidden material: ${forbidden}`);
  }

  assertStep228SnapshotUnchanged();

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step229 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step229 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step229 check modified the working tree");

  console.log("[check-trading-step229-offline-dataset-quality-profile] ok");
  console.log(JSON.stringify({
    schemaVersion: profile.schemaVersion,
    profileMode: profile.profileMode,
    recordCounts: profile.recordCounts,
    qualityChecks: profile.qualityChecks,
    thresholdPolicy: profile.thresholdPolicy,
    status: profile.status,
    step228BaselineCommit: BASELINE_COMMIT,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
