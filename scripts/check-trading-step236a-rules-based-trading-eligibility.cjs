const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP236A_SCRIPT = "check:trading-step236a-rules-based-trading-eligibility";
const STEP236A_SERVICE = "server/src/services/tradingAiMlRulesBasedTradingEligibility.js";
const STEP236A_SERVICE_TEST = "server/src/services/tradingAiMlRulesBasedTradingEligibility.test.js";
const STEP236A_CHECKER = "scripts/check-trading-step236a-rules-based-trading-eligibility.cjs";
const STEP236A_CHECKER_TEST = "scripts/check-trading-step236a-rules-based-trading-eligibility.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP236A_SERVICE,
  STEP236A_SERVICE_TEST,
  STEP236A_CHECKER,
  STEP236A_CHECKER_TEST,
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "scripts/check-trading-step235a-offline-trading-feature-contract.cjs",
  "scripts/check-trading-step235b-offline-feature-coverage.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP236A_SERVICE,
  STEP236A_SERVICE_TEST,
  STEP236A_CHECKER,
  STEP236A_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
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

async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const serviceSource = read(STEP236A_SERVICE);
  const serviceTest = read(STEP236A_SERVICE_TEST);

  for (const snippet of [
    `"${STEP236A_SCRIPT}"`,
    STEP236A_SERVICE_TEST,
    STEP236A_CHECKER,
    STEP236A_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step236A script");
  }

  for (const snippet of [
    "offline_rules_based_research_baseline",
    "buildStep235AOfflineFeatureDataset",
    "buildStep235BOfflineFeatureCoverageReport",
    "minimumObservationCount: 13",
    "nullFeatureImputationAllowed: false",
    "manualReviewRequiredForReviewStatus: true",
    "return3mGt: 0",
    "return12mGt: 0",
    "trend3mVs12mGt: 0",
    "drawdown12mLte: -0.05",
    "volatility3mGte: 0.025",
    "blocked_by_data_quality",
    "insufficient_history",
    "risk_off",
    "eligible_for_research",
    "modelTrainingAllowed: false",
    "performanceClaimAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(serviceSource, snippet, "Step236A service source");
  }

  for (const snippet of [
    "labels and forward returns are not decision inputs",
    "data-quality blocked state takes priority",
    "null feature coverage are insufficient history",
    "risk-off has priority over eligible research trend",
    "eligible hold and review-required decisions follow policy",
    "failure fixtures reject unsafe or invalid inputs",
  ]) {
    assertIncludes(serviceTest, snippet, "Step236A service test");
  }

  for (const forbidden of [
    "fet" + "ch(",
    "axi" + "os",
    "create" + "Client(",
    "supabase" + ".from(",
    "write" + "File",
    "append" + "File",
    "create" + "Write" + "Stream",
    "Date" + ".now",
    "new Date()",
    "Math" + ".random",
    "forwardReturn1m >",
    "labelClass ===",
    "kis" + "Token",
    "kis" + "Quote",
    "model" + "Training" + "Allowed: true",
    "performance" + "Claim" + "Allowed: true",
    "provider" + "Access" + "Allowed: true",
    "order" + "Submission" + "Allowed: true",
    "live" + "Trading" + "Allowed: true",
  ]) {
    assertNotIncludes(serviceSource, forbidden, "Step236A source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP236A_SERVICE}`).href}?check=${process.pid}`);
  const report = service.buildStep236ARulesBasedTradingEligibilityReport();
  const text = service.formatStep236ARulesBasedTradingEligibilityReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(Object.keys(report.recordCounts), service.STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.recordCountKeys);
  assertStrict.deepEqual(report.decisionDistribution.map((entry) => entry.decision), service.STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT.decisionOrder);
  assertStrict.deepEqual(report.coverageRequirements, {
    minimumObservationCount: 13,
    nullFeatureImputationAllowed: false,
  });
  assert(report.recordCounts.total === 28, "record count changed");
  assert(
    report.recordCounts.total ===
      report.recordCounts.eligibleForResearch +
      report.recordCounts.hold +
      report.recordCounts.riskOff +
      report.recordCounts.insufficientHistory +
      report.recordCounts.blockedByDataQuality,
    "decision counts do not add up",
  );
  assert(report.recordCounts.insufficientHistory >= 18, "observation shortage not reflected");
  assert(report.safety.modelTrainingAllowed === false, "model training opened");
  assert(report.safety.performanceClaimAllowed === false, "performance claim opened");
  assert(report.safety.providerAccessAllowed === false, "provider access opened");
  assert(report.safety.orderSubmissionAllowed === false, "order submission opened");
  assert(report.safety.liveTradingAllowed === false, "live trading opened");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  service.validateStep236AEligibilityReport(report);
  service.assertNoStep236AEligibilitySensitiveMaterial(report);
  service.assertNoStep236AEligibilitySensitiveMaterial(text);

  for (const snippet of [
    "FINPLE OFFLINE RULES-BASED RESEARCH ELIGIBILITY",
    "Records: 28",
    "Policy: 1.0.0",
    "Minimum observations: 13",
    "Null imputation: Blocked",
    "Model training allowed: No",
    "Performance claim allowed: No",
    "Order submission allowed: No",
    "Live trading readiness: Blocked",
  ]) {
    assertIncludes(text, snippet, "Step236A console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step236A touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step236A touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step236A checker modified the working tree");

  console.log("[check-trading-step236a-rules-based-trading-eligibility] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    policyVersion: report.policyVersion,
    mode: report.mode,
    recordCounts: report.recordCounts,
    decisionDistribution: report.decisionDistribution,
    coverageRequirements: report.coverageRequirements,
    safety: report.safety,
    readiness: report.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
