const HASH_A = "1111111111111111111111111111111111111111111111111111111111111111";
const HASH_B = "2222222222222222222222222222222222222222222222222222222222222222";

function band(monthIndex, p50) {
  return {
    monthIndex,
    p10Nominal: Math.round(p50 * 0.82),
    p25Nominal: Math.round(p50 * 0.92),
    p50Nominal: Math.round(p50),
    p75Nominal: Math.round(p50 * 1.08),
    p90Nominal: Math.round(p50 * 1.18),
    p10Real: Math.round(p50 * 0.78),
    p25Real: Math.round(p50 * 0.88),
    p50Real: Math.round(p50 * 0.96),
    p75Real: Math.round(p50 * 1.03),
    p90Real: Math.round(p50 * 1.12),
  };
}

export const STEP114_2G_PROBABILITY_FIXTURE_RESULT = Object.freeze({
  status: "ready",
  scenarioVersion: "probabilistic-scenario-v1-step114-2f",
  method: "joint_block_bootstrap",
  prngAlgorithm: "xorshift32-v1",
  randomSeed: 1142,
  simulationCount: 240,
  blockMonths: 6,
  rebalanceFrequency: "none",
  returnBasis: "price_return",
  currencyMode: "KRW",
  dataStartDate: "2018-01",
  dataEndDate: "2023-12",
  sourceHashes: ["synthetic-step114-2g-fixture-source"],
  normalizationVersion: "scenario-probabilistic-fixture-normalization-v1",
  calculationPolicyVersion: "scenario-probabilistic-policy-v1-step114-2f",
  pipelineVersion: "scenario-probabilistic-fixture-pipeline-v1-step114-2f",
  betaApplied: false,
  cagrCalibrationApplied: false,
  historicalMddApplied: false,
  inputHash: HASH_A,
  outputHash: HASH_B,
  dataQuality: {
    status: "ready",
    commonHistoryMonths: 72,
    minimumCommonHistoryMonths: 60,
    validBlockStartCount: 67,
  },
  monthlyBands: Array.from({ length: 61 }, (_, monthIndex) => (
    band(monthIndex, 12000000 + ((23800000 - 12000000) / 60) * monthIndex)
  )),
  terminalValue: {
    p10: 19516000,
    p25: 21896000,
    p50: 23800000,
    p75: 25704000,
    p90: 28084000,
  },
  principalShortfallProbability: {
    month12: 0.0833333333,
    month36: 0.1541666667,
    month60: 0.2125,
  },
  scenarioMdd: {
    p10: -0.318,
    p25: -0.246,
    p50: -0.171,
    p75: -0.102,
    p90: -0.061,
  },
  recovery: {
    medianRecoveryMonths: 11,
    longestRecoveryMonths: 27,
    unrecoveredScenarioRatio: 0.1875,
  },
  contributionSeries: Array.from({ length: 61 }, (_, monthIndex) => ({
    monthIndex,
    cumulativeContributions: 12000000 + 500000 * monthIndex,
  })),
  trace: {
    sampledBlockStarts: [],
  },
});

export const STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH = HASH_A;

export const STEP114_2G_FIXTURE_REVIEW_ASSETS = Object.freeze([
  { market: "KR", ticker: "005930", targetWeight: 50 },
  { market: "KR", ticker: "069500", targetWeight: 50 },
]);
