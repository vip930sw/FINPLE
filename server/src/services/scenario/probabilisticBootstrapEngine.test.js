import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  PROBABILISTIC_PRNG_ALGORITHM,
  PROBABILISTIC_SCENARIO_VERSION,
  buildProbabilisticBootstrapScenario,
  sampleJointBlockPath,
  stableSerialize,
} from "./probabilisticBootstrapEngine.js";

const FIXTURE_DIR = path.resolve("data/fixtures/scenario-probabilistic");

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8"));
}

function monthEnd(index) {
  const date = new Date(Date.UTC(2018, index + 1, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function makeRows({ count = 72, assets, returnsFor, returnBasis = "price_return", currencyMode = "USD" }) {
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    for (const asset of assets) {
      rows.push({
        month: monthEnd(index),
        market: asset.market,
        ticker: asset.ticker,
        returnBasis,
        currencyMode,
        return: returnsFor(index, asset),
        sourceHash: "unit-fixture-source-hash",
      });
    }
  }
  return rows;
}

function baseInput(overrides = {}) {
  const payload = fixture("synchronized_two_asset_monthly_matrix.json");
  return {
    portfolioId: "p-fixture",
    assets: payload.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    settings: {
      initialInvestment: 1200,
      monthlyContribution: 100,
      investmentMonths: 24,
      inflationRateAnnual: 0,
      rebalanceFrequency: "none",
    },
    scenario: {
      method: "joint_block_bootstrap",
      simulationCount: 24,
      blockMonths: 6,
      randomSeed: 1142,
      percentiles: [0.1, 0.25, 0.5, 0.75, 0.9],
    },
    monthlyReturnMatrix: payload.monthlyReturnMatrix,
    metadata: payload.metadata,
    ...overrides,
  };
}

function assertReady(result) {
  assert.equal(result.status, "ready", JSON.stringify(result.dataQuality));
}

function assertPercentileOrder(object) {
  assert.ok(object.p10 <= object.p25);
  assert.ok(object.p25 <= object.p50);
  assert.ok(object.p50 <= object.p75);
  assert.ok(object.p75 <= object.p90);
}

test("same seed returns byte-identical serialized output and output hash", () => {
  const first = buildProbabilisticBootstrapScenario(baseInput());
  const second = buildProbabilisticBootstrapScenario(baseInput());
  assertReady(first);
  assert.equal(stableSerialize(first), stableSerialize(second));
  assert.equal(first.outputHash, second.outputHash);
  assert.equal(first.scenarioVersion, PROBABILISTIC_SCENARIO_VERSION);
  assert.equal(first.prngAlgorithm, PROBABILISTIC_PRNG_ALGORITHM);
});

test("different seed changes trace and output hash", () => {
  const first = buildProbabilisticBootstrapScenario(baseInput({ scenario: { ...baseInput().scenario, randomSeed: 1142 } }));
  const second = buildProbabilisticBootstrapScenario(baseInput({ scenario: { ...baseInput().scenario, randomSeed: 2244 } }));
  assertReady(first);
  assertReady(second);
  assert.notEqual(first.outputHash, second.outputHash);
  assert.notDeepEqual(first.trace.sampledBlockStarts, second.trace.sampledBlockStarts);
});

test("engine does not use Math.random", () => {
  const source = fs.readFileSync("server/src/services/scenario/probabilisticBootstrapEngine.js", "utf8");
  assert.doesNotMatch(source, /Math\.random/);
});

test("6-month and 12-month block policies keep exact block lengths", () => {
  for (const blockMonths of [6, 12]) {
    const result = buildProbabilisticBootstrapScenario(baseInput({
      settings: { ...baseInput().settings, investmentMonths: blockMonths * 2 },
      scenario: { ...baseInput().scenario, blockMonths, simulationCount: 1 },
    }));
    assertReady(result);
    assert.deepEqual(
      result.trace.sampledBlockStarts[0].sampledBlockStarts.map((block) => block.blockLength),
      [blockMonths, blockMonths],
    );
  }
});

test("final sampled block truncates exactly to the requested horizon", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput({
    settings: { ...baseInput().settings, investmentMonths: 14 },
    scenario: { ...baseInput().scenario, blockMonths: 6, simulationCount: 1 },
  }));
  assertReady(result);
  assert.deepEqual(
    result.trace.sampledBlockStarts[0].sampledBlockStarts.map((block) => block.blockLength),
    [6, 6, 2],
  );
  assert.equal(result.trace.sampledBlockStarts[0].sampledRows.length, 14);
});

test("sampleJointBlockPath chooses one block start and applies it to all assets", () => {
  const matrix = Array.from({ length: 10 }, (_, index) => ({
    month: monthEnd(index),
    assetReturns: {
      "US:AAA": index / 100,
      "US:BBB": index / 50,
    },
  }));
  const sample = sampleJointBlockPath({
    matrix,
    blockMonths: 6,
    investmentMonths: 8,
    nextRandom: () => 0,
  });
  assert.deepEqual(sample.sampledBlockStarts.map((block) => block.startIndex), [0, 0]);
  assert.deepEqual(sample.sampledRows.map((row) => row.month), [
    monthEnd(0),
    monthEnd(1),
    monthEnd(2),
    monthEnd(3),
    monthEnd(4),
    monthEnd(5),
    monthEnd(0),
    monthEnd(1),
  ]);
});

test("joint sampling preserves exact cross-asset relation after bootstrap", () => {
  const relation = fixture("joint_relation_asset_b_2x_asset_a.json");
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: relation.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    monthlyReturnMatrix: relation.monthlyReturnMatrix,
    metadata: relation.metadata,
    scenario: { ...baseInput().scenario, simulationCount: 3 },
  }));
  assertReady(result);
  for (const row of result.trace.sampledBlockStarts[0].sampledRows) {
    assert.equal(row.assetReturns["US:BBB"], 2 * row.assetReturns["US:AAA"]);
  }
});

test("unsorted asset and row input normalizes deterministically", () => {
  const input = baseInput();
  const sorted = buildProbabilisticBootstrapScenario(input);
  const unsorted = buildProbabilisticBootstrapScenario({
    ...input,
    assets: [...input.assets].reverse(),
    monthlyReturnMatrix: [...input.monthlyReturnMatrix].reverse(),
  });
  assertReady(sorted);
  assert.equal(stableSerialize(sorted), stableSerialize(unsorted));
});

test("duplicate month fails closed", () => {
  const input = baseInput();
  const duplicate = { ...input.monthlyReturnMatrix[0] };
  const result = buildProbabilisticBootstrapScenario({
    ...input,
    monthlyReturnMatrix: [duplicate, ...input.monthlyReturnMatrix],
  });
  assert.equal(result.status, "blocked");
  assert.match(result.dataQuality.blockReasons.join("|"), /duplicate monthly return row/);
});

test("missing synchronized month fails closed", () => {
  const missing = fixture("missing_month_matrix.json");
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: missing.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    monthlyReturnMatrix: missing.monthlyReturnMatrix,
    metadata: missing.metadata,
  }));
  assert.equal(result.status, "blocked");
  assert.match(result.dataQuality.blockReasons.join("|"), /missing monthly return row/);
});

test("missing return is not replaced with zero", () => {
  const input = baseInput();
  const rows = input.monthlyReturnMatrix.map((row, index) => (index === 0 ? { ...row, return: "" } : row));
  const result = buildProbabilisticBootstrapScenario({ ...input, monthlyReturnMatrix: rows });
  assert.equal(result.status, "blocked");
  assert.match(result.dataQuality.blockReasons.join("|"), /finite number/);
});

test("target weights must sum to 1 or 100", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: baseInput().assets.map((asset) => ({ ...asset, targetWeight: 60 })),
  }));
  assert.equal(result.status, "blocked");
  assert.match(result.dataQuality.blockReasons.join("|"), /target weights must sum/);
});

test("month-start contribution is applied before sampled return", () => {
  const assets = [{ market: "US", ticker: "AAA" }];
  const input = baseInput({
    assets: [{ ...assets[0], targetWeight: 100 }],
    settings: { ...baseInput().settings, initialInvestment: 1000, monthlyContribution: 100, investmentMonths: 1 },
    scenario: { ...baseInput().scenario, simulationCount: 1, blockMonths: 6 },
    monthlyReturnMatrix: makeRows({
      count: 72,
      assets,
      returnsFor: () => 0.1,
    }),
  });
  const result = buildProbabilisticBootstrapScenario(input);
  assertReady(result);
  assert.equal(result.monthlyBands[1].p50Nominal, 1210);
  assert.equal(result.contributionSeries[1].cumulativeContributions, 1100);
});

test("none and annual rebalancing produce different valuation paths", () => {
  const assets = [{ market: "US", ticker: "AAA" }, { market: "US", ticker: "BBB" }];
  const rows = makeRows({
    count: 72,
    assets,
    returnsFor: (index, asset) => (asset.ticker === "AAA" ? (index % 2 === 0 ? 0.2 : -0.1) : 0),
  });
  const noRebalance = buildProbabilisticBootstrapScenario(baseInput({
    assets: assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    settings: { ...baseInput().settings, rebalanceFrequency: "none", investmentMonths: 24 },
    scenario: { ...baseInput().scenario, simulationCount: 4, blockMonths: 12, randomSeed: 7 },
    monthlyReturnMatrix: rows,
  }));
  const annual = buildProbabilisticBootstrapScenario(baseInput({
    assets: assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    settings: { ...baseInput().settings, rebalanceFrequency: "annual", investmentMonths: 24 },
    scenario: { ...baseInput().scenario, simulationCount: 4, blockMonths: 12, randomSeed: 7 },
    monthlyReturnMatrix: rows,
  }));
  assertReady(noRebalance);
  assertReady(annual);
  assert.notEqual(noRebalance.terminalValue.p50, annual.terminalValue.p50);
});

test("valuation path and risk NAV are separated from contributions", () => {
  const assets = [{ market: "US", ticker: "AAA" }];
  const rows = makeRows({ count: 72, assets, returnsFor: () => 0 });
  const lowContribution = buildProbabilisticBootstrapScenario(baseInput({
    assets: [{ ...assets[0], targetWeight: 100 }],
    settings: { ...baseInput().settings, monthlyContribution: 0, investmentMonths: 24 },
    monthlyReturnMatrix: rows,
  }));
  const highContribution = buildProbabilisticBootstrapScenario(baseInput({
    assets: [{ ...assets[0], targetWeight: 100 }],
    settings: { ...baseInput().settings, monthlyContribution: 1000, investmentMonths: 24 },
    monthlyReturnMatrix: rows,
  }));
  assertReady(lowContribution);
  assertReady(highContribution);
  assert.notEqual(lowContribution.terminalValue.p50, highContribution.terminalValue.p50);
  assert.equal(lowContribution.scenarioMdd.p50, highContribution.scenarioMdd.p50);
});

test("scenario MDD and recovery metrics are calculated from risk NAV", () => {
  const drawdown = fixture("drawdown_recovery_matrix.json");
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: drawdown.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    monthlyReturnMatrix: drawdown.monthlyReturnMatrix,
    metadata: drawdown.metadata,
    scenario: { ...baseInput().scenario, simulationCount: 12, randomSeed: 2026 },
    settings: { ...baseInput().settings, investmentMonths: 36 },
  }));
  assertReady(result);
  assert.ok(result.scenarioMdd.p50 < 0);
  assert.ok(result.recovery.longestRecoveryMonths >= result.recovery.medianRecoveryMonths);
  assert.ok(result.recovery.unrecoveredScenarioRatio >= 0 && result.recovery.unrecoveredScenarioRatio <= 1);
});

test("percentile bands and terminal values are ordered", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput());
  assertReady(result);
  assertPercentileOrder(result.terminalValue);
  assertPercentileOrder(result.scenarioMdd);
  for (const point of result.monthlyBands) {
    assert.ok(point.p10Nominal <= point.p25Nominal);
    assert.ok(point.p25Nominal <= point.p50Nominal);
    assert.ok(point.p50Nominal <= point.p75Nominal);
    assert.ok(point.p75Nominal <= point.p90Nominal);
    assert.ok(point.p10Real <= point.p25Real);
    assert.ok(point.p25Real <= point.p50Real);
    assert.ok(point.p50Real <= point.p75Real);
    assert.ok(point.p75Real <= point.p90Real);
  }
});

test("principal shortfall probabilities are in range", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput({
    settings: { ...baseInput().settings, investmentMonths: 60 },
  }));
  assertReady(result);
  for (const value of Object.values(result.principalShortfallProbability)) {
    assert.ok(value === null || (value >= 0 && value <= 1));
  }
});

test("short horizons return null for unavailable 12/36/60 month metrics", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput({
    settings: { ...baseInput().settings, investmentMonths: 10 },
  }));
  assertReady(result);
  assert.deepEqual(result.principalShortfallProbability, {
    month12: null,
    month36: null,
    month60: null,
  });
});

test("selected CAGR, beta, and historical MDD do not affect bootstrap output", () => {
  const input = baseInput();
  const first = buildProbabilisticBootstrapScenario(input);
  const second = buildProbabilisticBootstrapScenario({
    ...input,
    assets: input.assets.map((asset) => ({
      ...asset,
      selectedCagr: 999,
      beta: 99,
      historicalMdd: -0.99,
    })),
  });
  assertReady(first);
  assert.equal(stableSerialize(first), stableSerialize(second));
  assert.equal(first.betaApplied, false);
  assert.equal(first.cagrCalibrationApplied, false);
  assert.equal(first.historicalMddApplied, false);
});

test("price and total return basis cannot be mixed", () => {
  const input = baseInput();
  const rows = input.monthlyReturnMatrix.map((row, index) => (index === 0 ? { ...row, returnBasis: "total_return" } : row));
  const result = buildProbabilisticBootstrapScenario({ ...input, monthlyReturnMatrix: rows });
  assert.equal(result.status, "blocked");
  assert.match(result.dataQuality.blockReasons.join("|"), /mixed return basis/);
});

test("insufficient history returns insufficient_data without precise probabilities", () => {
  const insufficient = fixture("insufficient_history_matrix.json");
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: insufficient.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    monthlyReturnMatrix: insufficient.monthlyReturnMatrix,
    metadata: insufficient.metadata,
  }));
  assert.equal(result.status, "insufficient_data");
  assert.equal(result.terminalValue, null);
  assert.equal(result.principalShortfallProbability.month12, null);
});

test("KR leading-zero tickers are preserved", () => {
  const kr = fixture("kr_leading_zero_matrix.json");
  const result = buildProbabilisticBootstrapScenario(baseInput({
    assets: kr.assets.map((asset) => ({ ...asset, targetWeight: 50 })),
    monthlyReturnMatrix: kr.monthlyReturnMatrix,
    metadata: kr.metadata,
  }));
  assertReady(result);
  assert.deepEqual(result.assets.map((asset) => asset.ticker), ["005930", "069500"]);
});

test("required metadata and hashes are emitted", () => {
  const result = buildProbabilisticBootstrapScenario(baseInput());
  assertReady(result);
  assert.equal(result.returnBasis, "price_return");
  assert.equal(result.currencyMode, "USD");
  assert.deepEqual(result.sourceHashes, ["synthetic-scenario-probabilistic-fixture-sha"]);
  assert.equal(result.normalizationVersion, "scenario-probabilistic-fixture-normalization-v1");
  assert.equal(result.calculationPolicyVersion, "scenario-probabilistic-policy-v1-step114-2f");
  assert.equal(result.pipelineVersion, "scenario-probabilistic-fixture-pipeline-v1-step114-2f");
  assert.match(result.inputHash, /^[a-f0-9]{64}$/);
  assert.match(result.outputHash, /^[a-f0-9]{64}$/);
});

test("existing production loader pointer remains unchanged", () => {
  const loader = fs.readFileSync("src/data/tickers/screenerCandidateOverlay.js", "utf8");
  assert.match(loader, /us_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.match(loader, /kr_price_metrics_overlay_20260528_app_ready\.csv/);
  assert.doesNotMatch(loader, /scenario-probabilistic|step114-2f/);
});

test("Step 4, Step 5, Step 6 UI/API surfaces are not wired by this fixture engine", () => {
  const simulator = fs.readFileSync("src/components/PortfolioSimulator.jsx", "utf8");
  const serverIndex = fs.readFileSync("server/src/index.js", "utf8");
  assert.doesNotMatch(simulator, /probabilisticBootstrap|joint_block_bootstrap|ScenarioBandChart/);
  assert.doesNotMatch(serverIndex, /probabilisticBootstrap|joint_block_bootstrap|scenario-probabilistic/);
});
