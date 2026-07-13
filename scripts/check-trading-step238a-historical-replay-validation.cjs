const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP238A_SCRIPT = "check:trading-step238a-historical-replay-validation";
const STEP238A_DOC = "docs/trading-ai-ml/FINPLE_STEP238A_HISTORICAL_REPLAY_SOURCE_AUDIT.md";
const STEP238A_CHECKER = "scripts/check-trading-step238a-historical-replay-validation.cjs";
const STEP238A_CHECKER_TEST = "scripts/check-trading-step238a-historical-replay-validation.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP238A_DOC,
  STEP238A_CHECKER,
  STEP238A_CHECKER_TEST,
  "scripts/check-trading-step237b-risk-adjusted-validation.cjs",
  "scripts/check-trading-step237a-walk-forward-regime-validation.cjs",
  "scripts/check-trading-step236c-cost-aware-offline-backtest.cjs",
  "scripts/check-trading-step235a-offline-trading-feature-contract.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP238A_DOC,
  STEP238A_CHECKER,
  STEP238A_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
  "server/src/services/tradingAiMlResearchPositionPolicy.js",
  "server/src/services/tradingAiMlBacktestCostPolicy.js",
  "server/src/services/tradingAiMlOfflineBacktest.js",
  "server/src/services/tradingAiMlWalkForwardRegimeValidation.js",
  "server/src/services/tradingAiMlRiskAdjustedValidation.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlRealFormatDatasetAdapter.js",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "server/src/index.js",
  "server/db/migrations",
];

const REQUIRED_CANDIDATE_FIELDS = [
  "repositoryRelativePath",
  "dataType",
  "market",
  "frequency",
  "rowCount",
  "firstTimestamp",
  "lastTimestamp",
  "priceFieldType",
  "adjustedPriceKnown",
  "sourceDocumented",
  "licenseStatus",
  "sensitiveDataDetected",
  "providerPayloadDetected",
  "recommendedStatus",
];

const REQUIRED_TOP_LEVEL_SCHEMA_KEYS = [
  "schemaVersion",
  "replayMode",
  "sourcePolicy",
  "dataCoverage",
  "walkForward",
  "featureCoverage",
  "backtestMetrics",
  "riskAdjustedMetrics",
  "checks",
  "overallStatus",
  "usage",
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

function parseReplayDecision(doc) {
  const marker = "```json";
  const start = doc.indexOf(marker);
  assert(start !== -1, "missing replay decision JSON block");
  const jsonStart = start + marker.length;
  const end = doc.indexOf("```", jsonStart);
  assert(end !== -1, "unterminated replay decision JSON block");
  return JSON.parse(doc.slice(jsonStart, end).trim());
}

async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const doc = read(STEP238A_DOC);

  assertIncludes(packageJson, `"${STEP238A_SCRIPT}"`, "package Step238A script");
  assertIncludes(packageJson, STEP238A_CHECKER, "package Step238A checker");
  assertIncludes(packageJson, STEP238A_CHECKER_TEST, "package Step238A checker test");

  for (const snippet of [
    "Step238A audits repository-local, static, non-sensitive historical time-series candidates",
    "eligible_for_internal_historical_replay",
    "requires_provenance_review",
    "requires_license_review",
    "requires_adapter",
    "prohibited",
    "blocked_by_source_policy",
    "No audited candidate contains committed daily or monthly historical rows",
    "eligibleCandidateCount` is `0`",
    "does not build `tradingAiMlHistoricalReplayAdapter.js`",
    "or `tradingAiMlHistoricalReplayValidation.js`",
    "provider refetch requirements",
    "monthly data file is absent",
    "externalRedistributionAllowed",
    "performanceClaimAllowed",
    "actualLiveTradingReady",
  ]) {
    assertIncludes(doc, snippet, "Step238A source audit");
  }

  for (const field of REQUIRED_CANDIDATE_FIELDS) {
    assertIncludes(doc, field, "Step238A candidate field");
  }

  for (const candidatePath of [
    "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv",
    "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
    "data/processed/scenario_data_coverage.csv",
    "data/processed/scenario_monthly_returns.schema.csv",
    "data/processed/scenario_p0_source_policy_matrix_summary.json",
    "data/processed/ml/asset_quality_audit_latest.csv",
    "data/processed/ml/asset_anomaly_experiment_latest.csv",
  ]) {
    assertIncludes(doc, candidatePath, "Step238A candidate path");
  }

  for (const forbidden of [
    "C:\\",
    "C:/",
    "/Users/",
    "license confirmed",
    "verified profit strategy",
    "market beating strategy",
    "real account expected return",
    "safe investment",
    "loss prevention strategy",
    "buy/sell recommendation",
    "suitable strategy",
    "providerAccessAllowed\": true",
    "orderSubmissionAllowed\": true",
    "liveTradingAllowed\": true",
    "actualLiveTradingReady\": true",
    "hash value:",
    "digest value:",
    "private packet",
    "raw provider payload",
    "raw provider response copied",
  ]) {
    assertNotIncludes(doc, forbidden, "Step238A source audit");
  }

  const replayDecision = parseReplayDecision(doc);
  assertStrict.deepEqual(Object.keys(replayDecision), REQUIRED_TOP_LEVEL_SCHEMA_KEYS);
  assert(replayDecision.schemaVersion === "1.0.0", "schemaVersion changed");
  assert(replayDecision.replayMode === "read_only_historical_internal_validation", "replayMode changed");
  assert(replayDecision.sourcePolicy.status === "blocked_by_source_policy", "source policy gate opened");
  assert(replayDecision.sourcePolicy.eligibleCandidateCount === 0, "eligible candidate count changed");
  assert(replayDecision.sourcePolicy.licenseStatus === "not_confirmed_for_replay", "license status changed");
  assert(replayDecision.sourcePolicy.externalRedistributionAllowed === false, "redistribution opened");
  assert(replayDecision.dataCoverage.assetsUsed === 0, "assets were used unexpectedly");
  assert(replayDecision.walkForward.foldCount === 0, "walk-forward replay was executed unexpectedly");
  assert(replayDecision.featureCoverage.step235AFeatureBuilderExecuted === false, "Step235A feature builder executed");
  assert(replayDecision.backtestMetrics.step236CBacktestExecuted === false, "Step236C backtest executed");
  assert(replayDecision.riskAdjustedMetrics.step237BRiskAdjustedValidationExecuted === false, "Step237B metrics executed");
  assert(replayDecision.checks.futureLeakageDetected === false, "future leakage opened");
  assert(replayDecision.checks.crossSplitOverlapDetected === false, "cross split overlap opened");
  assert(replayDecision.checks.duplicateTimestampDetected === false, "duplicate timestamp opened");
  assert(replayDecision.checks.nonFiniteValueDetected === false, "non-finite opened");
  assert(replayDecision.checks.sourcePolicyViolationDetected === false, "source policy violation detected");
  assert(replayDecision.checks.performanceClaimDetected === false, "performance claim detected");
  assert(replayDecision.overallStatus === "blocked_by_source_policy", "overall status changed");
  assert(replayDecision.usage.internalResearchOnly === true, "internal research flag changed");
  assert(replayDecision.usage.performanceClaimAllowed === false, "performance claim opened");
  assert(replayDecision.usage.modelTrainingAllowed === false, "model training opened");
  assert(replayDecision.usage.paperTradingAllowed === false, "paper trading opened");
  assert(replayDecision.usage.shadowTradingAllowed === false, "shadow trading opened");
  assert(replayDecision.usage.providerAccessAllowed === false, "provider access opened");
  assert(replayDecision.usage.orderSubmissionAllowed === false, "order submission opened");
  assert(replayDecision.usage.liveTradingAllowed === false, "live trading opened");
  assert(replayDecision.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(replayDecision.readiness.state === "blocked", "readiness state changed");

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step238A touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step238A touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step238A checker modified the working tree");

  console.log("[check-trading-step238a-historical-replay-validation] ok");
  console.log(JSON.stringify({
    schemaVersion: replayDecision.schemaVersion,
    replayMode: replayDecision.replayMode,
    sourcePolicy: replayDecision.sourcePolicy,
    dataCoverage: replayDecision.dataCoverage,
    walkForward: replayDecision.walkForward,
    featureCoverage: replayDecision.featureCoverage,
    backtestMetrics: replayDecision.backtestMetrics,
    riskAdjustedMetrics: replayDecision.riskAdjustedMetrics,
    checks: replayDecision.checks,
    overallStatus: replayDecision.overallStatus,
    usage: replayDecision.usage,
    readiness: replayDecision.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
