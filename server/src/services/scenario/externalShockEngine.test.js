import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  EXTERNAL_SHOCK_METHOD,
  EXTERNAL_SHOCK_SCENARIO_VERSION,
  buildExternalShockScenario,
  stableSerializeExternalShockValue,
} from "./externalShockEngine.js";

const FIXTURE_DIR = path.resolve("data/fixtures/scenario-external-shock");

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseInput(scenarioName = "directAsset", overrides = {}) {
  const payload = fixture("kr_two_asset_external_shock_base.json");
  return {
    ...clone(payload),
    scenario: clone(payload.scenarios[scenarioName]),
    scenarios: undefined,
    ...overrides,
  };
}

function assertReady(result) {
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
}

function assertBlocked(result, pattern) {
  assert.notEqual(result.status, "ready");
  assert.match(result.dataQuality.blockReasons.join("|"), pattern);
  assert.match(result.inputHash, /^[a-f0-9]{64}$/);
  assert.match(result.outputHash, /^[a-f0-9]{64}$/);
}

function assertClose(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} !== ${expected}`);
}

test("same fixture input returns byte-deterministic output and hashes", () => {
  const first = buildExternalShockScenario(baseInput());
  const second = buildExternalShockScenario(baseInput());
  assertReady(first);
  assert.equal(stableSerializeExternalShockValue(first), stableSerializeExternalShockValue(second));
  assert.equal(first.outputHash, second.outputHash);
  assert.equal(first.scenarioVersion, EXTERNAL_SHOCK_SCENARIO_VERSION);
  assert.equal(first.method, EXTERNAL_SHOCK_METHOD);
  assert.equal(first.cagrCalibrationApplied, false);
  assert.equal(first.historicalMddApplied, false);
});

test("direct_asset shock uses multiplicative baseline and shock return formula", () => {
  const result = buildExternalShockScenario(baseInput());
  assertReady(result);
  const shocked = result.trace.find((point) => point.monthIndex === 4);
  assertClose(shocked.baselineReturns["KR:005930"], -0.08);
  assertClose(shocked.assetShockReturns["KR:005930"], -0.2);
  assertClose(shocked.stressedReturns["KR:005930"], (1 - 0.08) * (1 - 0.2) - 1);
  assertClose(shocked.stressedReturns["KR:069500"], (1 - 0.03) * (1 - 0.1) - 1);
  assert.equal(result.betaApplied, false);
});

test("market_beta shock derives asset shock return from beta and market factor", () => {
  const result = buildExternalShockScenario(baseInput("marketBeta"));
  assertReady(result);
  const shocked = result.trace.find((point) => point.monthIndex === 4);
  assertClose(shocked.assetShockReturns["KR:005930"], 1.1 * -0.12);
  assertClose(shocked.assetShockReturns["KR:069500"], 0.8 * -0.12);
  assertClose(shocked.stressedReturns["KR:005930"], (1 - 0.08) * (1 + (1.1 * -0.12)) - 1);
  assert.equal(result.betaApplied, true);
});

test("month-start contribution affects valuation path but not risk NAV MDD", () => {
  const withContribution = buildExternalShockScenario(baseInput("directAsset"));
  const withoutContribution = buildExternalShockScenario(baseInput("directAsset", {
    settings: { ...baseInput().settings, monthlyContribution: 0 },
  }));
  assertReady(withContribution);
  assertReady(withoutContribution);
  assert.notEqual(withContribution.stressedPath.at(-1).portfolioValue, withoutContribution.stressedPath.at(-1).portfolioValue);
  assert.equal(withContribution.summary.stressedMdd, withoutContribution.summary.stressedMdd);
  assert.equal(withContribution.contributionSeries[1].cumulativeContributions, 12500000);
});

test("annual rebalance changes path relative to no rebalance", () => {
  const extended = baseInput();
  extended.settings.investmentMonths = 13;
  extended.baselineReturnMatrix.push(
    { "month": "2025-01-31", "market": "KR", "ticker": "005930", "returnBasis": "price_return", "currencyMode": "KRW", "baselineReturn": 0.05, "sourceHash": "fixture-row-source-a" },
    { "month": "2025-01-31", "market": "KR", "ticker": "069500", "returnBasis": "price_return", "currencyMode": "KRW", "baselineReturn": -0.02, "sourceHash": "fixture-row-source-b" },
  );
  const none = buildExternalShockScenario(extended);
  const annual = buildExternalShockScenario({
    ...extended,
    settings: { ...extended.settings, rebalanceFrequency: "annual" },
  });
  assertReady(none);
  assertReady(annual);
  assert.notEqual(none.outputHash, annual.outputHash);
  assert.notEqual(none.summary.stressedTerminalValue, annual.summary.stressedTerminalValue);
});

test("MDD and recovery are computed from stressed contribution-excluded risk NAV", () => {
  const result = buildExternalShockScenario(baseInput());
  assertReady(result);
  assert.ok(result.summary.stressedMdd <= result.summary.baselineMdd);
  assert.ok(result.summary.stressedMdd >= -1 && result.summary.stressedMdd <= 0);
  assert.ok(result.summary.longestRecoveryMonths >= 0);
  assert.equal(typeof result.summary.unrecovered, "boolean");
});

test("asset impact summary reconciles to terminal delta", () => {
  const result = buildExternalShockScenario(baseInput());
  assertReady(result);
  const impactSum = result.assetImpactSummary.reduce((sum, row) => sum + row.deltaValue, 0);
  assertClose(impactSum, result.summary.terminalDeltaValue, 1e-6);
  assert.deepEqual(result.assetImpactSummary.map((row) => row.ticker), ["005930", "069500"]);
});

test("source hash changes propagate to input and output hashes", () => {
  const first = buildExternalShockScenario(baseInput());
  const changed = baseInput();
  changed.metadata.sourceHashes = ["fixture-external-shock-source-v2"];
  const second = buildExternalShockScenario(changed);
  assertReady(first);
  assertReady(second);
  assert.notEqual(first.inputHash, second.inputHash);
  assert.notEqual(first.outputHash, second.outputHash);
});

test("unsorted asset and row inputs normalize deterministically", () => {
  const input = baseInput();
  const sorted = buildExternalShockScenario(input);
  const unsorted = buildExternalShockScenario({
    ...input,
    assets: [...input.assets].reverse(),
    baselineReturnMatrix: [...input.baselineReturnMatrix].reverse(),
  });
  assertReady(sorted);
  assert.equal(stableSerializeExternalShockValue(sorted), stableSerializeExternalShockValue(unsorted));
});

test("missing source lineage fails closed", () => {
  const input = baseInput();
  input.metadata.sourceHashes = [];
  input.baselineReturnMatrix = input.baselineReturnMatrix.map((row) => ({ ...row, sourceHash: "" }));
  assertBlocked(buildExternalShockScenario(input), /sourceHashes:required|row_sourceHash_required/);
});

test("same calendar month duplicate fails closed even if day differs", () => {
  const input = baseInput();
  input.baselineReturnMatrix.push({
    ...input.baselineReturnMatrix[0],
    month: "2024-01-01",
    baselineReturn: 0.01,
  });
  assertBlocked(buildExternalShockScenario(input), /same_calendar_month_duplicate/);
});

test("invalid month and missing calendar month fail closed", () => {
  const invalid = baseInput();
  invalid.baselineReturnMatrix[0].month = "2024-13-31";
  assertBlocked(buildExternalShockScenario(invalid), /invalid_calendar_month/);

  const missing = baseInput();
  missing.baselineReturnMatrix = missing.baselineReturnMatrix.filter((row) => !String(row.month).startsWith("2024-06"));
  assertBlocked(buildExternalShockScenario(missing), /insufficient_data|missing_calendar_month/);
});

test("mixed price and total return basis is blocked", () => {
  const input = baseInput();
  input.baselineReturnMatrix[0].returnBasis = "total_return";
  assertBlocked(buildExternalShockScenario(input), /mixed_return_basis/);
});

test("missing direct shock coverage and duplicate shock months fail closed", () => {
  const missingCoverage = baseInput();
  missingCoverage.scenario.shockEvents[0].assetShocks = missingCoverage.scenario.shockEvents[0].assetShocks.slice(0, 1);
  assertBlocked(buildExternalShockScenario(missingCoverage), /direct_asset_shock_coverage_invalid/);

  const duplicateMonth = baseInput();
  duplicateMonth.scenario.shockEvents[1].monthIndex = duplicateMonth.scenario.shockEvents[0].monthIndex;
  assertBlocked(buildExternalShockScenario(duplicateMonth), /duplicate_shock_month/);
});

test("missing beta, mixed shock payload and shock <= -100% fail closed", () => {
  const missingBeta = baseInput("marketBeta");
  missingBeta.scenario.assetBetas = missingBeta.scenario.assetBetas.slice(0, 1);
  missingBeta.assets = missingBeta.assets.map((asset) => ({ ...asset, beta: null }));
  assertBlocked(buildExternalShockScenario(missingBeta), /market_beta_coverage_invalid/);

  const mixedPayload = baseInput("marketBeta");
  mixedPayload.scenario.shockEvents[0].assetShocks = [{ market: "KR", ticker: "005930", shockReturn: -0.1 }];
  assertBlocked(buildExternalShockScenario(mixedPayload), /mixed_shock_payload/);

  const invalidDirect = baseInput();
  invalidDirect.scenario.shockEvents[0].assetShocks[0].shockReturn = -1;
  assertBlocked(buildExternalShockScenario(invalidDirect), /less_than_or_equal_minus_100/);
});

test("insufficient history returns explicit insufficient_data without fabricated paths", () => {
  const input = baseInput();
  input.settings.investmentMonths = 18;
  const result = buildExternalShockScenario(input);
  assert.equal(result.status, "insufficient_data");
  assert.deepEqual(result.baselinePath, []);
  assert.deepEqual(result.stressedPath, []);
});

test("engine and fixture sources do not use Math.random, providers, APIs, or scenario_monthly_returns", () => {
  const engineSource = fs.readFileSync("server/src/services/scenario/externalShockEngine.js", "utf8");
  const fixtureSource = fs.readFileSync(path.join(FIXTURE_DIR, "kr_two_asset_external_shock_base.json"), "utf8");
  const combined = `${engineSource}\n${fixtureSource}`;
  assert.doesNotMatch(combined, /Math\.random/);
  assert.doesNotMatch(combined, /KIS|KRX|data\.go\.kr|\/api\/scenario|scenario_monthly_returns/);
});

test("fixture manifest is review-only and separated from production publish", () => {
  const manifest = fixture("manifest.json");
  assert.equal(manifest.fixtureOnly, true);
  assert.equal(manifest.productionPublishReady, false);
  assert.equal(manifest.appExportApproved, false);
  assert.match(JSON.stringify(manifest), /direct_asset/);
  assert.match(JSON.stringify(manifest), /market_beta/);
});
