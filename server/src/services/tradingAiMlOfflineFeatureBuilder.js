import {
  STEP235A_LABEL_POLICY_VERSION,
  STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
  STEP235A_TRADING_FEATURE_MODE,
  buildStep235ATradingFeatureContract,
} from "./tradingAiMlTradingFeatureContract.js";

export const STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION = "1.0.0";
export const STEP235A_OFFLINE_FEATURE_BUILDER_VERSION = "1.0.0";

const FEATURE_KEYS = Object.freeze([
  "return1m",
  "return3m",
  "return6m",
  "return12m",
  "volatility3m",
  "volatility6m",
  "drawdown12m",
  "trend3mVs12m",
  "observationCount",
  "featureTimestamp",
]);

const LABEL_KEYS = Object.freeze([
  "forwardReturn1m",
  "labelTimestamp",
  "labelWindowStart",
  "labelWindowEnd",
  "labelClass",
  "labelPolicyVersion",
  "labelPurpose",
]);

const LEAKAGE_CHECK_KEYS = Object.freeze([
  "featureUsesFutureData",
  "featureLabelOverlap",
  "crossSplitOverlap",
  "normalizationLeakage",
]);

const USAGE_KEYS = Object.freeze([
  "modelTrainingAllowed",
  "backtestClaimAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
]);

const OUTPUT_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "featureContractVersion",
  "mode",
  "builderVersion",
  "records",
  "splits",
  "leakageChecks",
  "usage",
]);

const SPLIT_ORDER = Object.freeze(["train", "validation", "test"]);
const SPLIT_WINDOWS = Object.freeze({
  train: { start: "2020-03-31T00:00:00.000Z", end: "2020-12-31T00:00:00.000Z" },
  validation: { start: "2021-02-28T00:00:00.000Z", end: "2021-03-31T00:00:00.000Z" },
  test: { start: "2021-05-31T00:00:00.000Z", end: "2021-06-30T00:00:00.000Z" },
});

const SYNTHETIC_SERIES = Object.freeze([
  {
    assetKey: "synthetic-us-core",
    market: "US",
    monthlyReturns: [
      0.01, 0.02, -0.01, 0.015, 0.005, -0.02, 0.03, 0.01, -0.005, 0.02,
      0.012, -0.008, 0.018, 0.006, -0.012, 0.02, 0.004, 0.011, -0.007, 0.016,
    ],
  },
  {
    assetKey: "synthetic-kr-core",
    market: "KR",
    monthlyReturns: [
      -0.005, 0.012, 0.008, -0.015, 0.02, 0.01, -0.01, 0.018, 0.004, -0.006,
      0.022, 0.009, -0.011, 0.014, 0.006, -0.018, 0.019, 0.007, -0.004, 0.012,
    ],
  },
]);

const TIMESTAMPS = Object.freeze([
  "2020-01-31T00:00:00.000Z",
  "2020-02-29T00:00:00.000Z",
  "2020-03-31T00:00:00.000Z",
  "2020-04-30T00:00:00.000Z",
  "2020-05-31T00:00:00.000Z",
  "2020-06-30T00:00:00.000Z",
  "2020-07-31T00:00:00.000Z",
  "2020-08-31T00:00:00.000Z",
  "2020-09-30T00:00:00.000Z",
  "2020-10-31T00:00:00.000Z",
  "2020-11-30T00:00:00.000Z",
  "2020-12-31T00:00:00.000Z",
  "2021-01-31T00:00:00.000Z",
  "2021-02-28T00:00:00.000Z",
  "2021-03-31T00:00:00.000Z",
  "2021-04-30T00:00:00.000Z",
  "2021-05-31T00:00:00.000Z",
  "2021-06-30T00:00:00.000Z",
  "2021-07-31T00:00:00.000Z",
  "2021-08-31T00:00:00.000Z",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function round6(value) {
  if (value === null || value === undefined) return null;
  return Number(value.toFixed(6));
}

function timestampToMs(value) {
  return Date.parse(value);
}

function compareRows(left, right) {
  const timestampDelta = String(left.timestamp).localeCompare(String(right.timestamp));
  if (timestampDelta !== 0) return timestampDelta;
  const marketDelta = String(left.market).localeCompare(String(right.market));
  if (marketDelta !== 0) return marketDelta;
  return String(left.assetKey).localeCompare(String(right.assetKey));
}

function makeCloseSeries(monthlyReturns, startingClose) {
  const closes = [];
  let close = startingClose;
  for (const monthlyReturn of monthlyReturns) {
    close *= (1 + monthlyReturn);
    closes.push(round6(close));
  }
  return closes;
}

export function buildStep235ASyntheticMonthlyFixture() {
  const rows = [];
  for (const source of SYNTHETIC_SERIES) {
    const closes = makeCloseSeries(source.monthlyReturns, source.market === "US" ? 100 : 80);
    source.monthlyReturns.forEach((monthlyReturn, index) => {
      rows.push({
        assetKey: source.assetKey,
        market: source.market,
        timestamp: TIMESTAMPS[index],
        close: closes[index],
        monthlyReturn,
      });
    });
  }
  return deepFreeze(rows.sort(compareRows));
}

function groupByAsset(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.assetKey);
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([assetKey, assetRows]) => [assetKey, assetRows.sort((left, right) => String(left.timestamp).localeCompare(String(right.timestamp)))]);
}

function compoundReturn(rows, endIndex, months) {
  if (endIndex + 1 < months) return null;
  const window = rows.slice(endIndex - months + 1, endIndex + 1);
  return round6(window.reduce((product, row) => product * (1 + row.monthlyReturn), 1) - 1);
}

function volatility(rows, endIndex, months) {
  if (endIndex + 1 < months) return null;
  const values = rows.slice(endIndex - months + 1, endIndex + 1).map((row) => row.monthlyReturn);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return round6(Math.sqrt(variance));
}

function drawdown(rows, endIndex, months) {
  if (endIndex + 1 < months) return null;
  const values = rows.slice(endIndex - months + 1, endIndex + 1).map((row) => row.close);
  let peak = values[0];
  let minDrawdown = 0;
  for (const close of values) {
    peak = Math.max(peak, close);
    minDrawdown = Math.min(minDrawdown, (close / peak) - 1);
  }
  return round6(minDrawdown);
}

function labelClass(forwardReturn1m) {
  if (forwardReturn1m >= 0.02) return "positive";
  if (forwardReturn1m <= -0.02) return "negative";
  return "neutral";
}

function splitForTimestamp(timestamp) {
  const value = timestampToMs(timestamp);
  for (const split of SPLIT_ORDER) {
    const window = SPLIT_WINDOWS[split];
    if (value >= timestampToMs(window.start) && value <= timestampToMs(window.end)) return split;
  }
  return null;
}

function buildFeatures(assetRows, index) {
  const return3m = compoundReturn(assetRows, index, 3);
  const return12m = compoundReturn(assetRows, index, 12);
  return {
    return1m: round6(assetRows[index].monthlyReturn),
    return3m,
    return6m: compoundReturn(assetRows, index, 6),
    return12m,
    volatility3m: volatility(assetRows, index, 3),
    volatility6m: volatility(assetRows, index, 6),
    drawdown12m: drawdown(assetRows, index, 12),
    trend3mVs12m: return3m === null || return12m === null ? null : round6(return3m - return12m),
    observationCount: index + 1,
    featureTimestamp: assetRows[index].timestamp,
  };
}

function buildFeatureAvailability(features) {
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, features[key] !== null]));
}

function buildRecord(assetRows, index, recordNumber) {
  const source = assetRows[index];
  const next = assetRows[index + 1];
  const features = buildFeatures(assetRows, index);
  return {
    recordId: `step235a-record-${String(recordNumber).padStart(3, "0")}`,
    split: splitForTimestamp(source.timestamp),
    market: source.market,
    featureTimestamp: source.timestamp,
    features,
    featureAvailability: buildFeatureAvailability(features),
    featureSourceWindow: {
      start: assetRows[0].timestamp,
      end: source.timestamp,
      observationCount: index + 1,
    },
    label: {
      forwardReturn1m: round6(next.monthlyReturn),
      labelTimestamp: next.timestamp,
      labelWindowStart: next.timestamp,
      labelWindowEnd: next.timestamp,
      labelClass: labelClass(next.monthlyReturn),
      labelPolicyVersion: STEP235A_LABEL_POLICY_VERSION,
      labelPurpose: "research_validation_only",
    },
  };
}

function compareRecords(left, right) {
  const splitDelta = SPLIT_ORDER.indexOf(left.split) - SPLIT_ORDER.indexOf(right.split);
  if (splitDelta !== 0) return splitDelta;
  const timestampDelta = String(left.featureTimestamp).localeCompare(String(right.featureTimestamp));
  if (timestampDelta !== 0) return timestampDelta;
  const marketDelta = String(left.market).localeCompare(String(right.market));
  if (marketDelta !== 0) return marketDelta;
  return String(left.recordId).localeCompare(String(right.recordId));
}

function buildRecords(fixture) {
  const records = [];
  for (const [, assetRows] of groupByAsset(fixture)) {
    for (let index = 0; index < assetRows.length - 1; index += 1) {
      const split = splitForTimestamp(assetRows[index].timestamp);
      if (split) records.push(buildRecord(assetRows, index, records.length + 1));
    }
  }
  return records.sort(compareRecords).map((record, index) => ({
    ...record,
    recordId: `step235a-record-${String(index + 1).padStart(3, "0")}`,
  }));
}

function buildSplitSummary(records, split) {
  const splitRecords = records.filter((record) => record.split === split);
  const featureTimestamps = splitRecords.map((record) => record.featureTimestamp).sort();
  const labelStarts = splitRecords.map((record) => record.label.labelWindowStart).sort();
  const labelEnds = splitRecords.map((record) => record.label.labelWindowEnd).sort();
  return {
    start: featureTimestamps[0] ?? null,
    end: featureTimestamps[featureTimestamps.length - 1] ?? null,
    recordCount: splitRecords.length,
    labelWindowStart: labelStarts[0] ?? null,
    labelWindowEnd: labelEnds[labelEnds.length - 1] ?? null,
  };
}

function rangesOverlap(left, right) {
  if (!left.labelWindowStart || !right.labelWindowStart) return false;
  return timestampToMs(left.labelWindowStart) <= timestampToMs(right.labelWindowEnd) &&
    timestampToMs(right.labelWindowStart) <= timestampToMs(left.labelWindowEnd);
}

export function buildStep235ALeakageChecks(records, splits, normalizationMode = "none") {
  const featureUsesFutureData = records.some((record) => (
    timestampToMs(record.featureSourceWindow.end) > timestampToMs(record.featureTimestamp)
  ));
  const featureLabelOverlap = records.some((record) => (
    timestampToMs(record.featureTimestamp) >= timestampToMs(record.label.labelWindowStart) ||
    timestampToMs(record.label.labelWindowStart) > timestampToMs(record.label.labelWindowEnd)
  ));
  const crossSplitOverlap = SPLIT_ORDER.some((leftSplit, leftIndex) => (
    SPLIT_ORDER.slice(leftIndex + 1).some((rightSplit) => rangesOverlap(splits[leftSplit], splits[rightSplit]))
  ));
  return deepFreeze({
    featureUsesFutureData,
    featureLabelOverlap,
    crossSplitOverlap,
    normalizationLeakage: normalizationMode !== "none",
  });
}

function usageFlags() {
  return {
    modelTrainingAllowed: false,
    backtestClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  };
}

export function buildStep235AOfflineFeatureDataset(input = {}) {
  const source = clonePlain(input);
  const fixture = source.fixture ?? buildStep235ASyntheticMonthlyFixture();
  const records = buildRecords(clonePlain(fixture));
  const splits = {
    train: buildSplitSummary(records, "train"),
    validation: buildSplitSummary(records, "validation"),
    test: buildSplitSummary(records, "test"),
  };
  const leakageChecks = buildStep235ALeakageChecks(records, splits, source.normalizationMode ?? "none");
  const output = {
    schemaVersion: STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION,
    featureContractVersion: STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
    mode: STEP235A_TRADING_FEATURE_MODE,
    builderVersion: STEP235A_OFFLINE_FEATURE_BUILDER_VERSION,
    records,
    splits,
    leakageChecks,
    usage: usageFlags(),
  };
  return deepFreeze(output);
}

export function buildStep235AOfflineFeatureSummary(input = {}) {
  const dataset = buildStep235AOfflineFeatureDataset(input);
  return deepFreeze({
    schemaVersion: dataset.schemaVersion,
    featureContractVersion: dataset.featureContractVersion,
    mode: dataset.mode,
    recordCounts: {
      total: dataset.records.length,
      train: dataset.splits.train.recordCount,
      validation: dataset.splits.validation.recordCount,
      test: dataset.splits.test.recordCount,
    },
    splits: dataset.splits,
    leakageChecks: dataset.leakageChecks,
    usage: dataset.usage,
  });
}

export function assertNoStep235ASensitiveMaterial(value) {
  const serialized = JSON.stringify(value);
  const forbiddenPatterns = [
    /rawProviderPayload/i,
    /providerPayload/i,
    /orderPayload/i,
    /rawResponse/i,
    /credential/i,
    /secret/i,
    /token/i,
    /account/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /buy|sell/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step235A sensitive or prohibited trading material detected: ${pattern}`);
    }
  }
}

export const STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT = deepFreeze({
  outputTopLevelKeys: OUTPUT_TOP_LEVEL_KEYS,
  featureKeys: FEATURE_KEYS,
  labelKeys: LABEL_KEYS,
  leakageCheckKeys: LEAKAGE_CHECK_KEYS,
  usageKeys: USAGE_KEYS,
  mode: STEP235A_TRADING_FEATURE_MODE,
  featureContractVersion: STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
  normalizationMode: buildStep235ATradingFeatureContract().leakagePolicy.normalizationMode,
  usage: usageFlags(),
  redacted: true,
});
