const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const STEP236B_SCRIPT = "check:trading-step236b-offline-research-position-policy";
const STEP236B_SERVICE = "server/src/services/tradingAiMlResearchPositionPolicy.js";
const STEP236B_SERVICE_TEST = "server/src/services/tradingAiMlResearchPositionPolicy.test.js";
const STEP236B_CHECKER = "scripts/check-trading-step236b-offline-research-position-policy.cjs";
const STEP236B_CHECKER_TEST = "scripts/check-trading-step236b-offline-research-position-policy.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP236B_SERVICE,
  STEP236B_SERVICE_TEST,
  STEP236B_CHECKER,
  STEP236B_CHECKER_TEST,
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
  "scripts/check-trading-step236a-rules-based-trading-eligibility.cjs",
  "scripts/check-trading-step235b-offline-feature-coverage.cjs",
  "scripts/check-trading-step235a-offline-trading-feature-contract.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP236B_SERVICE,
  STEP236B_SERVICE_TEST,
  STEP236B_CHECKER,
  STEP236B_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "server/src/services/tradingAiMlTradingFeatureContract.js",
  "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
  "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
  "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
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
  const serviceSource = read(STEP236B_SERVICE);
  const serviceTest = read(STEP236B_SERVICE_TEST);

  for (const snippet of [
    `"${STEP236B_SCRIPT}"`,
    STEP236B_SERVICE_TEST,
    STEP236B_CHECKER,
    STEP236B_CHECKER_TEST,
  ]) {
    assertIncludes(packageJson, snippet, "package Step236B script");
  }

  for (const snippet of [
    "offline_research_position_policy",
    "buildStep236ARulesBasedTradingEligibilityReport",
    "validateStep236AEligibilityReport",
    "initialExposure: 0",
    "minimumExposure: 0",
    "maximumExposure: 1",
    "samePeriodExecutionAllowed: false",
    "leverageAllowed: false",
    "shortExposureAllowed: false",
    "performanceClaimAllowed: false",
    "providerAccessAllowed: false",
    "orderSubmissionAllowed: false",
    "liveTradingAllowed: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
    "eligible_for_research: 1",
    "hold: \"previous_effective_exposure\"",
    "risk_off: 0",
    "insufficient_history: 0",
    "blocked_by_data_quality: 0",
    "applied_next_period",
    "unapplied_no_next_period",
  ]) {
    assertIncludes(serviceSource, snippet, "Step236B service source");
  }

  for (const snippet of [
    "transition fixture applies decisions from the next period only",
    "transition and exposure counts match the fixture ledger",
    "uses Step236A aggregate output as the default source",
    "deterministic canonical and input order independent",
    "does not mutate Step236A output",
    "failure fixtures reject invalid status policy exposure timing labels and sensitive input",
  ]) {
    assertIncludes(serviceTest, snippet, "Step236B service test");
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
    "samePeriodExecutionAllowed: true",
    "leverageAllowed: true",
    "shortExposureAllowed: true",
    "performanceClaimAllowed: true",
    "providerAccessAllowed: true",
    "orderSubmissionAllowed: true",
    "liveTradingAllowed: true",
  ]) {
    assertNotIncludes(serviceSource, forbidden, "Step236B source");
  }

  const service = await import(`${pathToFileURL(`${process.cwd()}/${STEP236B_SERVICE}`).href}?check=${process.pid}`);
  const report = service.buildStep236BResearchPositionPolicyReport();
  const ledger = service.buildStep236BResearchPositionTransitionLedger();
  const text = service.formatStep236BResearchPositionPolicyReport(report);

  assertStrict.deepEqual(Object.keys(report), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.topLevelKeys);
  assertStrict.deepEqual(Object.keys(report.recordCounts), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.recordCountKeys);
  assertStrict.deepEqual(Object.keys(report.decisionCounts), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.decisionCountKeys);
  assertStrict.deepEqual(Object.keys(report.transitionCounts), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.transitionCountKeys);
  assertStrict.deepEqual(Object.keys(report.exposureSummary), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.exposureSummaryKeys);
  assertStrict.deepEqual(Object.keys(report.safety), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.safetyKeys);
  assertStrict.deepEqual(Object.keys(report.readiness), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.readinessKeys);
  assertStrict.deepEqual(Object.keys(ledger[0]), service.STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.ledgerKeys);
  assert(report.recordCounts.totalDecisions === 28, "default decision count changed");
  assert(report.recordCounts.appliedTransitions === 27, "default applied transition count changed");
  assert(report.recordCounts.unappliedFinalDecisions === 1, "default final unapplied count changed");
  assert(report.exposureSummary.initialExposure === 0, "initial exposure changed");
  assert(report.exposureSummary.minimumExposure === 0, "minimum exposure changed");
  assert(report.exposureSummary.maximumExposure === 1, "maximum exposure changed");
  assert(report.safety.samePeriodExecutionAllowed === false, "same-period execution opened");
  assert(report.safety.leverageAllowed === false, "leverage opened");
  assert(report.safety.shortExposureAllowed === false, "short exposure opened");
  assert(report.safety.performanceClaimAllowed === false, "performance claim opened");
  assert(report.safety.providerAccessAllowed === false, "provider access opened");
  assert(report.safety.orderSubmissionAllowed === false, "order submission opened");
  assert(report.safety.liveTradingAllowed === false, "live trading opened");
  assert(report.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(report.readiness.state === "blocked", "readiness state changed");
  service.validateStep236BResearchPositionPolicyReport(report);
  service.validateStep236BTransitionLedger(ledger);
  service.assertNoStep236BPublicSensitiveMaterial(report);
  service.assertNoStep236BPublicSensitiveMaterial(text);

  for (const snippet of [
    "FINPLE OFFLINE RESEARCH POSITION POLICY",
    "Decisions: 28",
    "Applied transitions: 27",
    "Unapplied final decisions: 1",
    "Policy: 1.0.0",
    "Same-period execution allowed: No",
    "Performance claim allowed: No",
    "Order submission allowed: No",
    "Live trading readiness: Blocked",
  ]) {
    assertIncludes(text, snippet, "Step236B console report");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step236B touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step236B touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step236B checker modified the working tree");

  console.log("[check-trading-step236b-offline-research-position-policy] ok");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    policyVersion: report.policyVersion,
    mode: report.mode,
    recordCounts: report.recordCounts,
    decisionCounts: report.decisionCounts,
    transitionCounts: report.transitionCounts,
    exposureSummary: report.exposureSummary,
    safety: report.safety,
    readiness: report.readiness,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
