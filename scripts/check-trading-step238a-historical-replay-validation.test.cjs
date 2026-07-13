const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const CHECKER = "scripts/check-trading-step238a-historical-replay-validation.cjs";
const DOC = "docs/trading-ai-ml/FINPLE_STEP238A_HISTORICAL_REPLAY_SOURCE_AUDIT.md";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseReplayDecision(doc) {
  const start = doc.indexOf("```json");
  assert.notEqual(start, -1);
  const jsonStart = start + "```json".length;
  const end = doc.indexOf("```", jsonStart);
  assert.notEqual(end, -1);
  return JSON.parse(doc.slice(jsonStart, end).trim());
}

test("Step238A checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync("node", [CHECKER], { encoding: "utf8" });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  assert.equal(after, before);
  assert.match(output, /\[check-trading-step238a-historical-replay-validation\] ok/);
  assert.match(output, /"replayMode": "read_only_historical_internal_validation"/);
  assert.match(output, /"status": "blocked_by_source_policy"/);
  assert.match(output, /"eligibleCandidateCount": 0/);
  assert.doesNotMatch(output, /assetKey|ticker|monthlyReturn|forwardReturn1m|equityCurve/);
});

test("Step238A package script is dedicated to source-audit validation", () => {
  const packageJson = read("package.json");
  assert.match(packageJson, /"check:trading-step238a-historical-replay-validation"/);
  assert.match(packageJson, /check-trading-step238a-historical-replay-validation\.cjs/);
  assert.match(packageJson, /check-trading-step238a-historical-replay-validation\.test\.cjs/);
});

test("Step238A source audit records required candidate fields and classifications", () => {
  const doc = read(DOC);
  for (const field of [
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
  ]) {
    assert.equal(doc.includes(field), true, `missing field: ${field}`);
  }
  for (const status of [
    "eligible_for_internal_historical_replay",
    "requires_provenance_review",
    "requires_license_review",
    "requires_adapter",
    "prohibited",
  ]) {
    assert.equal(doc.includes(status), true, `missing status: ${status}`);
  }
});

test("Step238A replay decision is blocked and does not execute downstream pipeline stages", () => {
  const decision = parseReplayDecision(read(DOC));
  assert.equal(decision.sourcePolicy.status, "blocked_by_source_policy");
  assert.equal(decision.sourcePolicy.eligibleCandidateCount, 0);
  assert.equal(decision.sourcePolicy.externalRedistributionAllowed, false);
  assert.equal(decision.featureCoverage.step235AFeatureBuilderExecuted, false);
  assert.equal(decision.backtestMetrics.step236CBacktestExecuted, false);
  assert.equal(decision.riskAdjustedMetrics.step237BRiskAdjustedValidationExecuted, false);
  assert.equal(decision.walkForward.foldCount, 0);
  assert.equal(decision.overallStatus, "blocked_by_source_policy");
});

test("Step238A keeps public text free of sensitive data and performance claims", () => {
  const doc = read(DOC);
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
    "raw provider payload",
  ]) {
    assert.equal(doc.includes(forbidden), false, `forbidden doc snippet: ${forbidden}`);
  }
});

test("Step238A stays scoped away from Step235A through Step237B and runtime surfaces", () => {
  const touched = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const allowed = new Set([
    "package.json",
    DOC,
    CHECKER,
    "scripts/check-trading-step238a-historical-replay-validation.test.cjs",
  ]);
  for (const file of touched) {
    assert.equal(allowed.has(file), true, `unexpected touched file: ${file}`);
  }
  for (const forbidden of [
    "server/src/services/tradingAiMlTradingFeatureContract.js",
    "server/src/services/tradingAiMlOfflineFeatureBuilder.js",
    "server/src/services/tradingAiMlTradingFeatureCoverageReport.js",
    "server/src/services/tradingAiMlRulesBasedTradingEligibility.js",
    "server/src/services/tradingAiMlResearchPositionPolicy.js",
    "server/src/services/tradingAiMlBacktestCostPolicy.js",
    "server/src/services/tradingAiMlOfflineBacktest.js",
    "server/src/services/tradingAiMlWalkForwardRegimeValidation.js",
    "server/src/services/tradingAiMlRiskAdjustedValidation.js",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
    "server/src/index.js",
    ".github/workflows",
  ]) {
    assert.equal(touched.some((file) => file === forbidden || file.startsWith(`${forbidden}/`)), false);
  }
});
