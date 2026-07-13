const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  ARTIFACT_NAME,
  ARTIFACT_RETENTION_DAYS,
  INTEGRATION_EFFECT_KEYS,
  JSON_REPORT_FILE,
  TEXT_REPORT_FILE,
  TOP_LEVEL_KEYS,
  buildCurrentOfflineDataQualityCiReport,
  writeOfflineDataQualityCiArtifact,
} = require("./report-trading-offline-data-quality-ci.cjs");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const STEP233_SCRIPT = "check:trading-step233-non-blocking-data-quality-ci-report";
const STEP233_REPORT_SCRIPT = "report:trading-offline-data-quality-ci";
const STEP233_WORKFLOW = ".github/workflows/trading-offline-data-quality-report.yml";
const STEP233_REPORTER = "scripts/report-trading-offline-data-quality-ci.cjs";
const STEP233_REPORTER_TEST = "scripts/report-trading-offline-data-quality-ci.test.cjs";
const STEP233_CHECKER = "scripts/check-trading-step233-non-blocking-data-quality-ci-report.cjs";
const STEP233_CHECKER_TEST = "scripts/check-trading-step233-non-blocking-data-quality-ci-report.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP233_WORKFLOW,
  STEP233_REPORTER,
  STEP233_REPORTER_TEST,
  STEP233_CHECKER,
  STEP233_CHECKER_TEST,
  "scripts/check-trading-step232-offline-data-quality-gate-readiness.cjs",
  "scripts/check-trading-step231-offline-data-quality-gate.cjs",
  "scripts/check-trading-step230-offline-dataset-quality-batch-summary.cjs",
  "scripts/check-trading-step229-offline-dataset-quality-profile.cjs",
  SNAPSHOT_PATH,
];

const ALLOWED_TOUCHED_FILES = new Set([
  ".github/",
  "package.json",
  STEP233_WORKFLOW,
  STEP233_REPORTER,
  STEP233_REPORTER_TEST,
  STEP233_CHECKER,
  STEP233_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "scripts/check-trading-step232-offline-data-quality-gate-readiness.cjs",
  "scripts/check-trading-step231-offline-data-quality-gate.cjs",
  "scripts/check-trading-step230-offline-dataset-quality-batch-summary.cjs",
  "scripts/check-trading-step229-offline-dataset-quality-profile.cjs",
  "scripts/check-trading-step228-contract-hardening-handoff.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "server/src/index.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
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

function assertSnapshotUnchanged() {
  const snapshot = JSON.parse(read(SNAPSHOT_PATH));
  assert(snapshot.baselineCommit === BASELINE_COMMIT, "Step228 baselineCommit changed");
  assertStrict.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert(snapshot.coreAudit.expectedStageCount === 9, "Step228 expected stage count changed");
  assert(snapshot.coreAudit.counts.sourceCheckerCount === 13, "Step228 source checker count changed");
  assert(snapshot.coreAudit.counts.uniqueTestFileCount === 35, "Step228 unique test file count changed");
  assert(snapshot.supplementalGuards.count === 1, "Step228 supplemental count changed");
  assert(snapshot.totals.totalSourceCheckerCount === 14, "Step228 total source checker count changed");
  assert(snapshot.totals.totalUniqueCheckerTestCount === 26, "Step228 checker test count changed");
  assert(snapshot.totals.totalUniqueTestFileCount === 37, "Step228 total test file count changed");
  assert(snapshot.duplicates.duplicateFileCount === 0, "Step228 duplicate count changed");
  assert(snapshot.readiness.actualLiveTradingReady === false, "Step228 live readiness changed");
  assert(snapshot.readiness.state === "blocked", "Step228 readiness state changed");
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const workflow = read(STEP233_WORKFLOW);
  const reporter = read(STEP233_REPORTER);
  const reporterTest = read(STEP233_REPORTER_TEST);

  for (const snippet of [
    `"${STEP233_REPORT_SCRIPT}"`,
    `"${STEP233_SCRIPT}"`,
    STEP233_REPORTER,
    STEP233_REPORTER_TEST,
    STEP233_CHECKER,
    STEP233_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step233 script");
  }

  for (const snippet of [
    "name: FINPLE Offline Data-Quality Report",
    "pull_request:",
    "workflow_dispatch:",
    "permissions:",
    "contents: read",
    "continue-on-error: true",
    "npm run check:trading-step232-offline-data-quality-gate-readiness",
    "npm run check:trading-step231-offline-data-quality-gate",
    "npm run check:trading-step230-offline-dataset-quality-batch-summary",
    "npm run check:trading-step229-offline-dataset-quality-profile",
    "npm run report:trading-offline-data-quality-ci",
    "actions/upload-artifact",
    `name: ${ARTIFACT_NAME}`,
    "offline-data-quality-report.json",
    "offline-data-quality-report.txt",
    `retention-days: ${ARTIFACT_RETENTION_DAYS}`,
    "FINPLE Offline Data-Quality Report",
  ]) {
    assertIncludes(workflow, snippet, "Step233 workflow");
  }

  for (const forbidden of [
    "npm.cmd",
    "schedule:",
    "contents: write",
    "pull-requests: write",
    "issues: write",
    "deployments: write",
    "packages: write",
    "secrets.",
    "KIS",
    "TOSS",
    "OPENAI",
    "DATABASE_URL",
    "SUPABASE",
    "ADMIN_TOKEN",
    "required_status_checks",
    "branch_protection",
  ]) {
    assertNotIncludes(workflow, forbidden, "Step233 workflow");
  }

  for (const snippet of [
    "buildCurrentOfflineDataQualityCiReport",
    "buildStep230OfflineDatasetQualityBatchSummary",
    "buildStep231OfflineDataQualityGateDecision",
    "buildStep232OfflineDataQualityGateReadiness",
    "skipped_by_readiness_policy",
    "execution_error",
    "QUALITY_CHECK_EXECUTION_FAILED",
    "blocksMerge: false",
    "blocksDeployment: false",
    "startsModelTraining: false",
    "enablesProviderAccess: false",
    "enablesOrderSubmission: false",
    "enablesLiveTrading: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
    JSON_REPORT_FILE,
    TEXT_REPORT_FILE,
  ]) {
    assertIncludes(reporter, snippet, "Step233 reporter source");
  }

  for (const snippet of [
    "exact top-level and integrationEffect key sets",
    "reuses Step229 through Step232 results",
    "readiness not_ready is skipped rather than completed",
    "blocked review and pass quality statuses never become merge blocking",
    "deterministic canonical and mutation resistant",
    "fixed artifact names",
    "execution error is sanitized and non-blocking",
    "excludes sensitive material",
  ]) {
    assertIncludes(reporterTest, snippet, "Step233 reporter test");
  }

  const report = await buildCurrentOfflineDataQualityCiReport();
  assertStrict.deepEqual(Object.keys(report), TOP_LEVEL_KEYS);
  assertStrict.deepEqual(Object.keys(report.integrationEffect), INTEGRATION_EFFECT_KEYS);
  assert(report.readinessStatus === "ready_for_non_blocking_ci_evaluation", "readiness status mismatch");
  assert(report.executionStatus === "completed", "execution status mismatch");
  assert(report.qualityStatus === "blocked", "quality status mismatch");
  assert(report.gateDecision === "block_offline_promotion", "gate decision mismatch");
  assertStrict.deepEqual(report.fixtureCounts, {
    total: 12,
    pass: 3,
    reviewRequired: 1,
    blocked: 8,
  });
  assert(new Set(report.reasonCodes).size === report.reasonCodes.length, "reasonCodes contain duplicates");
  assert(report.integrationEffect.blocksMerge === false, "report blocks merge");
  assert(report.integrationEffect.blocksDeployment === false, "report blocks deployment");
  assert(report.integrationEffect.startsModelTraining === false, "report starts model training");
  assert(report.integrationEffect.enablesProviderAccess === false, "report enables provider access");
  assert(report.integrationEffect.enablesOrderSubmission === false, "report enables order submission");
  assert(report.integrationEffect.enablesLiveTrading === false, "report enables live trading");
  assert(report.readiness.actualLiveTradingReady === false, "report opens live readiness");
  assert(report.readiness.state === "blocked", "report readiness state changed");

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step233-check-"));
  try {
    const artifact = writeOfflineDataQualityCiArtifact(report, outputDir);
    assert(artifact.artifactName === ARTIFACT_NAME, "artifact name mismatch");
    assert(artifact.retentionDays === ARTIFACT_RETENTION_DAYS, "artifact retention mismatch");
    assert(fs.existsSync(path.join(outputDir, JSON_REPORT_FILE)), "json artifact missing");
    assert(fs.existsSync(path.join(outputDir, TEXT_REPORT_FILE)), "text artifact missing");
    const json = JSON.parse(read(path.join(outputDir, JSON_REPORT_FILE)));
    const text = read(path.join(outputDir, TEXT_REPORT_FILE));
    assertStrict.deepEqual(json, report);
    assertIncludes(text, "Merge blocking: No", "Step233 text artifact");
    assertIncludes(text, "Live trading readiness: Blocked", "Step233 text artifact");
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  assertSnapshotUnchanged();

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step233 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step233 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step233 check modified the working tree");

  console.log("[check-trading-step233-non-blocking-data-quality-ci-report] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    reportMode: report.reportMode,
    readinessStatus: report.readinessStatus,
    executionStatus: report.executionStatus,
    qualityStatus: report.qualityStatus,
    gateDecision: report.gateDecision,
    fixtureCounts: report.fixtureCounts,
    integrationEffect: report.integrationEffect,
    readiness: report.readiness,
    artifactName: ARTIFACT_NAME,
    retentionDays: ARTIFACT_RETENTION_DAYS,
    step228BaselineCommit: BASELINE_COMMIT,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
