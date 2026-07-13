const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const STEP231_SCRIPT = "check:trading-step231-offline-data-quality-gate";
const STEP231_SERVICE = "server/src/services/tradingAiMlDatasetQualityGate.js";
const STEP231_TEST = "server/src/services/tradingAiMlDatasetQualityGate.test.js";
const STEP231_CHECKER = "scripts/check-trading-step231-offline-data-quality-gate.cjs";
const STEP231_CHECKER_TEST = "scripts/check-trading-step231-offline-data-quality-gate.test.cjs";
const STEP230_SERVICE = "server/src/services/tradingAiMlDatasetQualityBatchSummary.js";
const STEP230_CHECKER = "scripts/check-trading-step230-offline-dataset-quality-batch-summary.cjs";
const STEP229_SERVICE = "server/src/services/tradingAiMlDatasetQualityProfile.js";

const REQUIRED_FILES = [
  "package.json",
  STEP231_SERVICE,
  STEP231_TEST,
  STEP231_CHECKER,
  STEP231_CHECKER_TEST,
  STEP230_SERVICE,
  STEP230_CHECKER,
  STEP229_SERVICE,
  SNAPSHOT_PATH,
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP231_SERVICE,
  STEP231_TEST,
  STEP231_CHECKER,
  STEP231_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  STEP230_SERVICE,
  STEP230_CHECKER,
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.test.js",
  STEP229_SERVICE,
  "server/src/services/tradingAiMlDatasetQualityProfile.test.js",
  "scripts/check-trading-step229-offline-dataset-quality-profile.cjs",
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
  "modelTraining: true",
  "runtimeServing: true",
  "providerAccess: true",
  "orderSubmission: true",
  "liveTrading: true",
  "actualLiveTradingReady: true",
];

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "gateMode",
  "sourceSummarySchemaVersion",
  "policyVersion",
  "observedStatus",
  "decision",
  "approval",
  "reasonCodes",
  "allowedActions",
  "readiness",
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
  const service = read(STEP231_SERVICE);
  const serviceTest = read(STEP231_TEST);

  assertIncludes(packageJson, `"${STEP231_SCRIPT}"`, "package Step231 script");
  assertIncludes(packageJson, STEP231_CHECKER, "package Step231 checker link");
  assertIncludes(packageJson, STEP231_CHECKER_TEST, "package Step231 checker test link");
  assertIncludes(packageJson, STEP231_TEST, "package Step231 service test link");
  assertIncludes(packageJson, `"check:trading-step230-offline-dataset-quality-batch-summary"`, "package Step230 standalone checker");

  for (const snippet of [
    "buildStep230OfflineDatasetQualityBatchSummary",
    "buildStep231OfflineDataQualityGateDecision",
    "offline_dataset_promotion",
    "allow_offline_promotion",
    "manual_review_required",
    "block_offline_promotion",
    "MISSING_REQUIRED_FIELDS",
    "LABEL_IMBALANCE",
    "modelTraining: false",
    "runtimeServing: false",
    "providerAccess: false",
    "orderSubmission: false",
    "liveTrading: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(service, snippet, "Step231 service source");
  }

  for (const forbidden of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(service, forbidden, "Step231 service runtime code");
  }

  for (const snippet of [
    "pass summary allows only offline promotion",
    "review_required without approval requires manual review",
    "review_required with valid approval allows offline promotion only",
    "rejects invalid approval scope, missing fields, and disallowed roles",
    "blocked summary remains blocked even with approval input",
    "rejects empty or malformed batch summaries",
    "reason codes are unique and canonical",
    "does not mutate batch summary, approval input, or Step230 summary output",
    "keeps all non-offline actions false and live readiness blocked",
  ]) {
    assertIncludes(serviceTest, snippet, "Step231 test source");
  }

  const moduleUrl = pathToFileURL(`${process.cwd()}/${STEP231_SERVICE}`).href;
  const step231 = await import(`${moduleUrl}?check=${Date.now()}`);
  const step230Url = pathToFileURL(`${process.cwd()}/${STEP230_SERVICE}`).href;
  const step230 = await import(`${step230Url}?check=${Date.now()}`);
  const catalog = step230.buildStep230OfflineDatasetQualityFixtureCatalog();
  const entries = new Map(JSON.parse(JSON.stringify(catalog)).map((entry) => [entry.fixtureKey, entry]));
  const validApproval = {
    approved: true,
    scope: "offline_dataset_promotion",
    approvedByRole: "data_quality_reviewer",
    approvedAt: "2026-07-13T00:00:00.000Z",
    rationaleCode: "LABEL_IMBALANCE_REVIEWED",
  };
  const summaryFor = (keys) => step230.buildStep230OfflineDatasetQualityBatchSummary(keys.map((key) => entries.get(key)));

  const passDecision = step231.buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryFor(["balanced_valid"]),
  });
  const reviewDecision = step231.buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryFor(["balanced_valid", "label_imbalance"]),
  });
  const approvedDecision = step231.buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryFor(["balanced_valid", "label_imbalance"]),
    approval: validApproval,
  });
  const blockedDecision = step231.buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryFor(["balanced_valid", "future_leakage"]),
    approval: validApproval,
  });

  assertStrict.deepEqual(Object.keys(passDecision), EXPECTED_TOP_LEVEL_KEYS);
  assert(passDecision.decision === "allow_offline_promotion", "pass decision mismatch");
  assert(passDecision.allowedActions.offlineDatasetPromotion === true, "pass offline promotion mismatch");
  assert(reviewDecision.decision === "manual_review_required", "review decision mismatch");
  assert(reviewDecision.approval.required === true && reviewDecision.approval.accepted === false, "review approval mismatch");
  assertStrict.deepEqual(reviewDecision.reasonCodes, ["LABEL_IMBALANCE"]);
  assert(approvedDecision.decision === "allow_offline_promotion", "approved review decision mismatch");
  assert(approvedDecision.approval.required === true && approvedDecision.approval.accepted === true, "approved review approval mismatch");
  assert(blockedDecision.decision === "block_offline_promotion", "blocked decision mismatch");
  assert(blockedDecision.approval.required === false && blockedDecision.approval.accepted === false, "blocked approval mismatch");
  assert(blockedDecision.allowedActions.offlineDatasetPromotion === false, "blocked offline promotion mismatch");

  for (const decision of [passDecision, reviewDecision, approvedDecision, blockedDecision]) {
    assert(decision.allowedActions.modelTraining === false, "modelTraining opened");
    assert(decision.allowedActions.runtimeServing === false, "runtimeServing opened");
    assert(decision.allowedActions.providerAccess === false, "providerAccess opened");
    assert(decision.allowedActions.orderSubmission === false, "orderSubmission opened");
    assert(decision.allowedActions.liveTrading === false, "liveTrading opened");
    assert(decision.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
    assert(decision.readiness.state === "blocked", "readiness state changed");
  }

  const fullDecision = step231.buildStep231OfflineDataQualityGateDecision({
    batchSummary: step230.buildStep230OfflineDatasetQualityBatchSummary(),
  });
  assertStrict.deepEqual(fullDecision.reasonCodes, [
    "MISSING_REQUIRED_FIELDS",
    "DUPLICATE_RECORD_IDS",
    "CROSS_SPLIT_DUPLICATES",
    "TEMPORAL_OVERLAP",
    "FUTURE_LEAKAGE",
    "INVALID_WALK_FORWARD",
    "SENSITIVE_PAYLOAD",
    "THRESHOLD_TYPE_VIOLATION",
    "LABEL_IMBALANCE",
  ]);
  assert(new Set(fullDecision.reasonCodes).size === fullDecision.reasonCodes.length, "reason codes contain duplicates");

  const serialized = JSON.stringify(fullDecision);
  for (const forbidden of [
    "step229-record-001",
    "downside",
    "stable",
    "upside",
    "secret token value",
    "rawProviderPayload",
    "provider payload",
    "raw metadata",
    "account identifier",
    "order payload",
    "hash",
    "digest",
    "fingerprint",
    "credential",
    "token",
    "data_quality_reviewer",
    "2026-07-13T00:00:00.000Z",
  ]) {
    assert(!serialized.includes(forbidden), `gate output leaks forbidden material: ${forbidden}`);
  }

  assertStep228SnapshotUnchanged();

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step231 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step231 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step231 check modified the working tree");

  console.log("[check-trading-step231-offline-data-quality-gate] ok");
  console.log(JSON.stringify({
    schemaVersion: fullDecision.schemaVersion,
    gateMode: fullDecision.gateMode,
    sourceSummarySchemaVersion: fullDecision.sourceSummarySchemaVersion,
    policyVersion: fullDecision.policyVersion,
    observedStatus: fullDecision.observedStatus,
    decision: fullDecision.decision,
    reasonCodes: fullDecision.reasonCodes,
    allowedActions: fullDecision.allowedActions,
    readiness: fullDecision.readiness,
    step228BaselineCommit: BASELINE_COMMIT,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
