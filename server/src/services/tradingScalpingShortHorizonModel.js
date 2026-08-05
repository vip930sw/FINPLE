import { createHash } from "node:crypto";

export const SCALPING_SHORT_HORIZON_FEATURE_CONTRACT_VERSION = "scalping-short-horizon-features-v1";
export const SCALPING_SHORT_HORIZON_DATASET_VERSION = "scalping-short-horizon-dataset-v1";
export const SCALPING_SHORT_HORIZON_TRAINING_CONTRACT_VERSION = "scalping-short-horizon-training-v1";
export const SCALPING_SHORT_HORIZON_ARTIFACT_VERSION = "scalping-short-horizon-artifact-v1";
export const SCALPING_SHORT_HORIZON_MODEL_ID = "finple-scalping-linear-baseline-v1";
export const SCALPING_MODEL_SIGNAL_SCHEMA_VERSION = "scalping-model-signal-v1";
export const SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION = "scalping-model-signal-replay-fixture-v1";

export const SCALPING_SHORT_HORIZON_FEATURE_NAMES = Object.freeze([
  "return1Bps",
  "return3Bps",
  "return5Bps",
  "emaSpreadBps",
  "vwapDeviationBps",
  "realizedVolatilityBps",
  "rangeBps",
  "volumeZScore",
  "spreadBps",
  "orderBookImbalance",
  "minutesSinceOpenScaled",
  "minutesToCloseScaled",
  "isInverseEtf",
]);

const INVERSE_SYMBOLS = new Set(["SQQQ", "SOXS", "SPXU", "TZA"]);
const DEFAULT_MODEL_POLICY = Object.freeze({
  minimumBars: 30,
  horizonMinutes: 3,
  positiveReturnThresholdBps: 8,
  trainFraction: 0.6,
  validationFraction: 0.2,
  embargoSessions: 1,
  minimumTrainingRows: 200,
  classifierIterations: 300,
  classifierLearningRate: 0.03,
  returnIterations: 300,
  returnLearningRate: 0.002,
  l2: 0.001,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positive(value) {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
}

function iso(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function round(value, digits = 8) {
  const number = finite(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function modelError(code, message, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 409;
  error.details = details;
  return error;
}

function normalizedPolicy(input = {}) {
  const merged = { ...DEFAULT_MODEL_POLICY, ...input };
  return {
    minimumBars: Math.max(20, Math.floor(finite(merged.minimumBars) ?? DEFAULT_MODEL_POLICY.minimumBars)),
    horizonMinutes: Math.max(1, Math.floor(finite(merged.horizonMinutes) ?? DEFAULT_MODEL_POLICY.horizonMinutes)),
    positiveReturnThresholdBps: finite(merged.positiveReturnThresholdBps) ?? DEFAULT_MODEL_POLICY.positiveReturnThresholdBps,
    trainFraction: Math.min(0.8, Math.max(0.4, finite(merged.trainFraction) ?? DEFAULT_MODEL_POLICY.trainFraction)),
    validationFraction: Math.min(0.3, Math.max(0.1, finite(merged.validationFraction) ?? DEFAULT_MODEL_POLICY.validationFraction)),
    embargoSessions: Math.max(0, Math.floor(finite(merged.embargoSessions) ?? DEFAULT_MODEL_POLICY.embargoSessions)),
    minimumTrainingRows: Math.max(10, Math.floor(finite(merged.minimumTrainingRows) ?? DEFAULT_MODEL_POLICY.minimumTrainingRows)),
    classifierIterations: Math.max(10, Math.floor(finite(merged.classifierIterations) ?? DEFAULT_MODEL_POLICY.classifierIterations)),
    classifierLearningRate: Math.max(0.0001, finite(merged.classifierLearningRate) ?? DEFAULT_MODEL_POLICY.classifierLearningRate),
    returnIterations: Math.max(10, Math.floor(finite(merged.returnIterations) ?? DEFAULT_MODEL_POLICY.returnIterations)),
    returnLearningRate: Math.max(0.00001, finite(merged.returnLearningRate) ?? DEFAULT_MODEL_POLICY.returnLearningRate),
    l2: Math.max(0, finite(merged.l2) ?? DEFAULT_MODEL_POLICY.l2),
  };
}

function validateProvenance(input = {}) {
  const provenance = {
    datasetId: clean(input.datasetId),
    sourceRevision: clean(input.sourceRevision),
    rawDataChecksum: clean(input.rawDataChecksum),
    calendarVersion: clean(input.calendarVersion),
    licensePolicyId: clean(input.licensePolicyId),
    immutable: input.immutable === true,
  };
  const reasons = [
    provenance.datasetId ? null : "dataset_id_missing",
    provenance.sourceRevision ? null : "source_revision_missing",
    provenance.rawDataChecksum ? null : "raw_data_checksum_missing",
    provenance.calendarVersion ? null : "calendar_version_missing",
    provenance.licensePolicyId ? null : "license_policy_id_missing",
    provenance.immutable ? null : "dataset_not_immutable",
  ].filter(Boolean);
  if (reasons.length > 0) {
    throw modelError("INVALID_SCALPING_MODEL_DATASET_PROVENANCE", "모델 데이터셋 provenance가 유효하지 않습니다.", reasons);
  }
  return provenance;
}

function normalizeBars(input = []) {
  if (!Array.isArray(input)) throw modelError("INVALID_SCALPING_MODEL_BARS", "1분봉 배열이 필요합니다.");
  const rows = input.map((bar, index) => {
    const timestamp = iso(bar?.timestamp);
    const open = positive(bar?.open);
    const high = positive(bar?.high);
    const low = positive(bar?.low);
    const close = positive(bar?.close);
    const volume = finite(bar?.volume);
    const sessionDate = clean(bar?.sessionDate || bar?.session?.sessionDate || timestamp?.slice(0, 10));
    const bid = positive(bar?.quote?.bid);
    const ask = positive(bar?.quote?.ask);
    const bidSize = finite(bar?.quote?.bidSize);
    const askSize = finite(bar?.quote?.askSize);
    const minutesSinceOpen = finite(bar?.session?.minutesSinceOpen ?? bar?.minutesSinceOpen);
    const minutesToClose = finite(bar?.session?.minutesToClose ?? bar?.minutesToClose);
    const reasons = [
      timestamp ? null : `timestamp_invalid_${index}`,
      open === null ? `open_invalid_${index}` : null,
      high === null ? `high_invalid_${index}` : null,
      low === null ? `low_invalid_${index}` : null,
      close === null ? `close_invalid_${index}` : null,
      volume === null || volume < 0 ? `volume_invalid_${index}` : null,
      high !== null && low !== null && high < low ? `high_below_low_${index}` : null,
      high !== null && open !== null && high < open ? `high_below_open_${index}` : null,
      high !== null && close !== null && high < close ? `high_below_close_${index}` : null,
      low !== null && open !== null && low > open ? `low_above_open_${index}` : null,
      low !== null && close !== null && low > close ? `low_above_close_${index}` : null,
      sessionDate ? null : `session_date_missing_${index}`,
      minutesSinceOpen === null || minutesSinceOpen < 0 ? `minutes_since_open_invalid_${index}` : null,
      minutesToClose === null || minutesToClose < 0 ? `minutes_to_close_invalid_${index}` : null,
      bid !== null && ask !== null && ask < bid ? `quote_crossed_${index}` : null,
    ].filter(Boolean);
    if (reasons.length > 0) throw modelError("INVALID_SCALPING_MODEL_BAR", "유효하지 않은 모델 입력 1분봉입니다.", reasons);
    return {
      symbol: clean(bar?.symbol).toUpperCase(),
      timestamp,
      epoch: Date.parse(timestamp),
      minuteStartMs: Date.parse(timestamp),
      minuteEndMs: Date.parse(timestamp) + 60_000,
      sessionDate,
      open,
      high,
      low,
      close,
      volume,
      quote: { bid, ask, bidSize, askSize },
      session: { minutesSinceOpen, minutesToClose },
    };
  });
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index].epoch <= rows[index - 1].epoch) {
      throw modelError("SCALPING_MODEL_BARS_NOT_STRICTLY_INCREASING", "1분봉 시각은 엄격히 증가해야 합니다.", [String(index)]);
    }
  }
  return rows;
}

function average(values) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function ema(values, period) {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let result = average(values.slice(0, period));
  for (const value of values.slice(period)) result = value * multiplier + result * (1 - multiplier);
  return result;
}

function trailingReturnBps(bars, lookback) {
  const current = bars.at(-1)?.close;
  const reference = bars.at(-(lookback + 1))?.close;
  if (!current || !reference) return 0;
  return (current / reference - 1) * 10_000;
}

function realizedVolatilityBps(bars, lookback) {
  const selected = bars.slice(-(lookback + 1));
  const returns = [];
  for (let index = 1; index < selected.length; index += 1) {
    returns.push(selected[index].close / selected[index - 1].close - 1);
  }
  return standardDeviation(returns) * 10_000;
}

function volumeZScore(bars, lookback) {
  const selected = bars.slice(-(lookback + 1));
  const current = selected.at(-1)?.volume ?? 0;
  const history = selected.slice(0, -1).map((bar) => bar.volume);
  const deviation = standardDeviation(history);
  if (deviation === 0) return current > average(history) ? 1 : 0;
  return (current - average(history)) / deviation;
}

function vwap(bars, lookback) {
  const selected = bars.slice(-lookback);
  let volume = 0;
  let notional = 0;
  for (const bar of selected) {
    const typical = (bar.high + bar.low + bar.close) / 3;
    volume += bar.volume;
    notional += typical * bar.volume;
  }
  return volume > 0 ? notional / volume : selected.at(-1)?.close ?? null;
}

export function extractScalpingShortHorizonFeatures(input = {}, options = {}) {
  const policy = normalizedPolicy(options.policy || options);
  const bars = normalizeBars(input.bars || []);
  if (bars.length < policy.minimumBars) {
    throw modelError("INSUFFICIENT_SCALPING_MODEL_BARS", "단기 모델 feature 계산에 필요한 1분봉이 부족합니다.", [
      `required_${policy.minimumBars}`,
      `actual_${bars.length}`,
    ]);
  }
  const symbol = clean(input.symbol || bars.at(-1)?.symbol).toUpperCase();
  const current = bars.at(-1);
  const closes = bars.map((bar) => bar.close);
  const fastEma = ema(closes, 5);
  const slowEma = ema(closes, 20);
  const currentVwap = vwap(bars, 20);
  const quote = input.quote || current.quote || {};
  const bid = positive(quote.bid);
  const ask = positive(quote.ask);
  const midpoint = bid !== null && ask !== null ? (bid + ask) / 2 : current.close;
  const spreadBps = bid !== null && ask !== null && ask >= bid
    ? ((ask - bid) / midpoint) * 10_000
    : 4;
  const bidSize = Math.max(0, finite(quote.bidSize) ?? 0);
  const askSize = Math.max(0, finite(quote.askSize) ?? 0);
  const orderBookImbalance = bidSize + askSize > 0 ? (bidSize - askSize) / (bidSize + askSize) : 0;
  const minutesSinceOpen = finite(input.session?.minutesSinceOpen ?? current.session.minutesSinceOpen);
  const minutesToClose = finite(input.session?.minutesToClose ?? current.session.minutesToClose);
  if (minutesSinceOpen === null || minutesToClose === null) {
    throw modelError("SCALPING_MODEL_SESSION_METADATA_REQUIRED", "모델 feature에 미국 정규장 경과·잔여시간이 필요합니다.");
  }
  const values = {
    return1Bps: trailingReturnBps(bars, 1),
    return3Bps: trailingReturnBps(bars, 3),
    return5Bps: trailingReturnBps(bars, 5),
    emaSpreadBps: fastEma && slowEma ? (fastEma / slowEma - 1) * 10_000 : 0,
    vwapDeviationBps: currentVwap ? (current.close / currentVwap - 1) * 10_000 : 0,
    realizedVolatilityBps: realizedVolatilityBps(bars, 20),
    rangeBps: ((current.high - current.low) / current.close) * 10_000,
    volumeZScore: volumeZScore(bars, 20),
    spreadBps,
    orderBookImbalance,
    minutesSinceOpenScaled: minutesSinceOpen / 390,
    minutesToCloseScaled: minutesToClose / 390,
    isInverseEtf: INVERSE_SYMBOLS.has(symbol) ? 1 : 0,
  };
  return {
    featureContractVersion: SCALPING_SHORT_HORIZON_FEATURE_CONTRACT_VERSION,
    symbol,
    timestamp: current.timestamp,
    dataCutoff: new Date(current.minuteEndMs).toISOString(),
    featureNames: [...SCALPING_SHORT_HORIZON_FEATURE_NAMES],
    values: Object.fromEntries(SCALPING_SHORT_HORIZON_FEATURE_NAMES.map((name) => [name, round(values[name], 10)])),
    safety: {
      usesOnlyBarsAtOrBeforePrediction: true,
      futureLabelUsedAsFeature: false,
      rawProviderPayloadStored: false,
    },
  };
}

export function buildScalpingShortHorizonDataset(input = {}, options = {}) {
  const policy = normalizedPolicy(options.policy || options);
  const provenance = validateProvenance(input.provenance || {});
  const seriesBySymbol = input.seriesBySymbol || {};
  const rows = [];
  for (const [rawSymbol, rawBars] of Object.entries(seriesBySymbol)) {
    const symbol = clean(rawSymbol).toUpperCase();
    const bars = normalizeBars(rawBars).map((bar) => ({ ...bar, symbol: bar.symbol || symbol }));
    for (let index = policy.minimumBars - 1; index + policy.horizonMinutes < bars.length; index += 1) {
      const current = bars[index];
      const future = bars[index + policy.horizonMinutes];
      if (current.sessionDate !== future.sessionDate) continue;
      const history = bars.slice(0, index + 1);
      const features = extractScalpingShortHorizonFeatures({
        symbol,
        bars: history,
        quote: current.quote,
        session: current.session,
      }, policy);
      const forwardReturnBps = (future.close / current.close - 1) * 10_000;
      rows.push({
        rowVersion: "scalping-short-horizon-row-v1",
        symbol,
        timestamp: current.timestamp,
        sessionDate: current.sessionDate,
        minuteStartMs: current.minuteStartMs,
        minuteEndMs: current.minuteEndMs,
        dataCutoff: new Date(current.minuteEndMs).toISOString(),
        labelEnd: new Date(future.minuteEndMs).toISOString(),
        request: {
          symbol,
          timestamp: current.timestamp,
          minuteStartMs: current.minuteStartMs,
          minuteEndMs: current.minuteEndMs,
          open: current.open,
          high: current.high,
          low: current.low,
          close: current.close,
          volume: current.volume,
          quote: clone(current.quote),
          session: {
            name: "REGULAR",
            state: "REGULAR",
            sessionDate: current.sessionDate,
            minutesSinceOpen: current.session.minutesSinceOpen,
            minutesToClose: current.session.minutesToClose,
          },
        },
        features: clone(features.values),
        label: {
          horizonMinutes: policy.horizonMinutes,
          forwardReturnBps: round(forwardReturnBps, 8),
          positive: forwardReturnBps > policy.positiveReturnThresholdBps ? 1 : 0,
          thresholdBps: policy.positiveReturnThresholdBps,
        },
      });
    }
  }
  rows.sort((left, right) => left.minuteStartMs - right.minuteStartMs || left.symbol.localeCompare(right.symbol));
  const duplicateKeys = new Set();
  for (const row of rows) {
    const key = `${row.symbol}|${row.timestamp}`;
    if (duplicateKeys.has(key)) throw modelError("DUPLICATE_SCALPING_MODEL_DATASET_ROW", "동일 종목·시각 모델 행이 중복되었습니다.", [key]);
    duplicateKeys.add(key);
    if (Date.parse(row.dataCutoff) > Date.parse(row.labelEnd)) {
      throw modelError("SCALPING_MODEL_LABEL_PRECEDES_FEATURE", "모델 label 시간이 feature cutoff보다 빠릅니다.", [key]);
    }
  }
  return {
    datasetVersion: SCALPING_SHORT_HORIZON_DATASET_VERSION,
    featureContractVersion: SCALPING_SHORT_HORIZON_FEATURE_CONTRACT_VERSION,
    trainingContractVersion: SCALPING_SHORT_HORIZON_TRAINING_CONTRACT_VERSION,
    provenance,
    policy: {
      minimumBars: policy.minimumBars,
      horizonMinutes: policy.horizonMinutes,
      positiveReturnThresholdBps: policy.positiveReturnThresholdBps,
      chronologicalSplitOnly: true,
      randomSplitAllowed: false,
    },
    rows,
    summary: {
      rows: rows.length,
      symbols: [...new Set(rows.map((row) => row.symbol))].sort(),
      sessions: [...new Set(rows.map((row) => row.sessionDate))].sort(),
      positiveRate: rows.length ? round(average(rows.map((row) => row.label.positive)), 8) : null,
    },
    safety: {
      futureLeakageAllowed: false,
      randomSplitAllowed: false,
      externalDataDownloadPerformed: false,
      datasetPersisted: false,
    },
  };
}

function splitChronologically(dataset, policy) {
  const sessions = [...new Set(dataset.rows.map((row) => row.sessionDate))].sort();
  if (sessions.length < 5) throw modelError("INSUFFICIENT_SCALPING_MODEL_SESSIONS", "시간순 train/validation/test 분할에 거래일이 부족합니다.");
  const trainEnd = Math.max(1, Math.floor(sessions.length * policy.trainFraction));
  const validationStart = trainEnd + policy.embargoSessions;
  const targetValidationEnd = Math.floor(sessions.length * (policy.trainFraction + policy.validationFraction));
  const validationEnd = Math.max(validationStart + 1, targetValidationEnd);
  const testStart = validationEnd + policy.embargoSessions;
  if (testStart >= sessions.length) throw modelError("SCALPING_MODEL_SPLIT_LEAVES_NO_TEST", "Embargo 적용 후 test 거래일이 남지 않습니다.");
  const trainSessions = sessions.slice(0, trainEnd);
  const validationSessions = sessions.slice(validationStart, Math.min(validationEnd, sessions.length));
  const testSessions = sessions.slice(testStart);
  const select = (selected) => dataset.rows.filter((row) => selected.includes(row.sessionDate));
  return {
    train: select(trainSessions),
    validation: select(validationSessions),
    test: select(testSessions),
    sessions: { train: trainSessions, validation: validationSessions, test: testSessions },
    embargoSessions: policy.embargoSessions,
  };
}

function fitScaler(rows) {
  const means = {};
  const deviations = {};
  for (const name of SCALPING_SHORT_HORIZON_FEATURE_NAMES) {
    const values = rows.map((row) => finite(row.features?.[name]) ?? 0);
    means[name] = average(values);
    deviations[name] = standardDeviation(values) || 1;
  }
  return {
    fitScope: "train_only",
    means: Object.fromEntries(SCALPING_SHORT_HORIZON_FEATURE_NAMES.map((name) => [name, round(means[name], 12)])),
    deviations: Object.fromEntries(SCALPING_SHORT_HORIZON_FEATURE_NAMES.map((name) => [name, round(deviations[name], 12)])),
  };
}

function vector(row, scaler) {
  return SCALPING_SHORT_HORIZON_FEATURE_NAMES.map((name) => {
    const value = finite(row.features?.[name]) ?? 0;
    return (value - scaler.means[name]) / scaler.deviations[name];
  });
}

function sigmoid(value) {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

function dot(weights, values) {
  return weights.reduce((sum, weight, index) => sum + weight * values[index], 0);
}

function fitLogistic(rows, scaler, policy) {
  const weights = Array(SCALPING_SHORT_HORIZON_FEATURE_NAMES.length).fill(0);
  let intercept = 0;
  for (let iteration = 0; iteration < policy.classifierIterations; iteration += 1) {
    const gradient = Array(weights.length).fill(0);
    let interceptGradient = 0;
    for (const row of rows) {
      const values = vector(row, scaler);
      const prediction = sigmoid(intercept + dot(weights, values));
      const error = prediction - row.label.positive;
      interceptGradient += error;
      for (let index = 0; index < weights.length; index += 1) gradient[index] += error * values[index];
    }
    const divisor = Math.max(1, rows.length);
    intercept -= policy.classifierLearningRate * interceptGradient / divisor;
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= policy.classifierLearningRate * (gradient[index] / divisor + policy.l2 * weights[index]);
    }
  }
  return { intercept: round(intercept, 12), weights: weights.map((value) => round(value, 12)) };
}

function fitReturnRegression(rows, scaler, policy) {
  const weights = Array(SCALPING_SHORT_HORIZON_FEATURE_NAMES.length).fill(0);
  let intercept = average(rows.map((row) => row.label.forwardReturnBps));
  for (let iteration = 0; iteration < policy.returnIterations; iteration += 1) {
    const gradient = Array(weights.length).fill(0);
    let interceptGradient = 0;
    for (const row of rows) {
      const values = vector(row, scaler);
      const prediction = intercept + dot(weights, values);
      const error = prediction - row.label.forwardReturnBps;
      interceptGradient += error;
      for (let index = 0; index < weights.length; index += 1) gradient[index] += error * values[index];
    }
    const divisor = Math.max(1, rows.length);
    intercept -= policy.returnLearningRate * interceptGradient / divisor;
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= policy.returnLearningRate * (gradient[index] / divisor + policy.l2 * weights[index]);
    }
  }
  return { intercept: round(intercept, 12), weights: weights.map((value) => round(value, 12)) };
}

function scoreRow(artifact, row) {
  const values = vector(row, artifact.scaler);
  return {
    probabilityUp: sigmoid(artifact.classifier.intercept + dot(artifact.classifier.weights, values)),
    expectedReturnBps: artifact.returnRegressor.intercept + dot(artifact.returnRegressor.weights, values),
  };
}

function metrics(artifact, rows) {
  if (!rows.length) return { samples: 0, accuracy: null, brierScore: null, logLoss: null, expectedReturnMaeBps: null, positiveRate: null };
  let correct = 0;
  let brier = 0;
  let logLoss = 0;
  let mae = 0;
  for (const row of rows) {
    const prediction = scoreRow(artifact, row);
    const probability = Math.min(1 - 1e-9, Math.max(1e-9, prediction.probabilityUp));
    const target = row.label.positive;
    if ((probability >= 0.5 ? 1 : 0) === target) correct += 1;
    brier += (probability - target) ** 2;
    logLoss += -(target * Math.log(probability) + (1 - target) * Math.log(1 - probability));
    mae += Math.abs(prediction.expectedReturnBps - row.label.forwardReturnBps);
  }
  return {
    samples: rows.length,
    accuracy: round(correct / rows.length, 8),
    brierScore: round(brier / rows.length, 8),
    logLoss: round(logLoss / rows.length, 8),
    expectedReturnMaeBps: round(mae / rows.length, 8),
    positiveRate: round(average(rows.map((row) => row.label.positive)), 8),
  };
}

function fitArtifact(dataset, split, options, policy) {
  if (split.train.length < policy.minimumTrainingRows) {
    throw modelError("INSUFFICIENT_SCALPING_MODEL_TRAINING_ROWS", "모델 학습 행이 최소 기준보다 부족합니다.", [
      `required_${policy.minimumTrainingRows}`,
      `actual_${split.train.length}`,
    ]);
  }
  const scaler = fitScaler(split.train);
  const classifier = fitLogistic(split.train, scaler, policy);
  const returnRegressor = fitReturnRegression(split.train, scaler, policy);
  const latestLabelEnd = dataset.rows.reduce((latest, row) => Date.parse(row.labelEnd) > Date.parse(latest) ? row.labelEnd : latest, dataset.rows[0]?.labelEnd || new Date(0).toISOString());
  const artifactWithoutChecksum = {
    artifactVersion: SCALPING_SHORT_HORIZON_ARTIFACT_VERSION,
    modelId: clean(options.modelId) || SCALPING_SHORT_HORIZON_MODEL_ID,
    modelVersion: clean(options.modelVersion) || "1.0.0-research",
    createdAt: iso(options.createdAt) || latestLabelEnd,
    featureContractVersion: SCALPING_SHORT_HORIZON_FEATURE_CONTRACT_VERSION,
    datasetVersion: dataset.datasetVersion,
    trainingContractVersion: SCALPING_SHORT_HORIZON_TRAINING_CONTRACT_VERSION,
    signalSchemaVersion: SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
    featureNames: [...SCALPING_SHORT_HORIZON_FEATURE_NAMES],
    label: {
      horizonMinutes: policy.horizonMinutes,
      positiveReturnThresholdBps: policy.positiveReturnThresholdBps,
    },
    scaler,
    classifier,
    returnRegressor,
    provenance: clone(dataset.provenance),
    split: clone(split.sessions),
    embargoSessions: split.embargoSessions,
    trainingRows: split.train.length,
    validationRows: split.validation.length,
    testRows: split.test.length,
    researchOnly: true,
    runtimeApproved: false,
  };
  const artifact = {
    ...artifactWithoutChecksum,
    modelChecksum: checksum(artifactWithoutChecksum),
  };
  artifact.metrics = {
    train: metrics(artifact, split.train),
    validation: metrics(artifact, split.validation),
    test: metrics(artifact, split.test),
  };
  artifact.status = "research_candidate";
  artifact.safety = {
    automaticApprovalAllowed: false,
    runtimeRegistrationAllowed: false,
    orderSubmissionAllowed: false,
    liveActivationAllowed: false,
    scalerFitOnTrainOnly: true,
    randomSplitUsed: false,
    futureLeakageAllowed: false,
  };
  return artifact;
}

export function trainScalpingShortHorizonModel(dataset = {}, options = {}) {
  if (dataset.datasetVersion !== SCALPING_SHORT_HORIZON_DATASET_VERSION || !Array.isArray(dataset.rows)) {
    throw modelError("INVALID_SCALPING_MODEL_DATASET", "단기 예측 모델 데이터셋 계약이 유효하지 않습니다.");
  }
  const policy = normalizedPolicy({ ...dataset.policy, ...options.policy });
  const split = splitChronologically(dataset, policy);
  return fitArtifact(dataset, split, options, policy);
}

export function scoreScalpingShortHorizonModel(artifact = {}, input = {}, options = {}) {
  if (artifact.artifactVersion !== SCALPING_SHORT_HORIZON_ARTIFACT_VERSION || !clean(artifact.modelChecksum)) {
    throw modelError("INVALID_SCALPING_MODEL_ARTIFACT", "유효한 단기 예측 모델 artifact가 필요합니다.");
  }
  const featureEnvelope = input.features
    ? {
        symbol: clean(input.symbol).toUpperCase(),
        timestamp: iso(input.timestamp),
        dataCutoff: iso(input.dataCutoff) || (iso(input.timestamp) ? new Date(Date.parse(input.timestamp) + 60_000).toISOString() : null),
        values: clone(input.features),
      }
    : extractScalpingShortHorizonFeatures(input, { minimumBars: options.minimumBars || 30 });
  if (!featureEnvelope.timestamp || !featureEnvelope.dataCutoff) {
    throw modelError("INVALID_SCALPING_MODEL_SCORE_TIME", "모델 점수 산출 시각과 cutoff가 필요합니다.");
  }
  const row = { features: featureEnvelope.values, label: { positive: 0, forwardReturnBps: 0 } };
  const prediction = scoreRow(artifact, row);
  const probabilityUp = Math.min(1, Math.max(0, prediction.probabilityUp));
  const generatedAt = iso(options.generatedAt) || new Date(Date.parse(featureEnvelope.dataCutoff) + 1_000).toISOString();
  const regime = probabilityUp >= 0.6 && prediction.expectedReturnBps > 0
    ? "intraday_bull"
    : probabilityUp <= 0.4 && prediction.expectedReturnBps < 0
      ? "intraday_bear"
      : "intraday_neutral";
  return {
    signalVersion: SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
    symbol: featureEnvelope.symbol,
    timestamp: featureEnvelope.timestamp,
    probabilityUp: round(probabilityUp, 8),
    expectedReturnBps: round(prediction.expectedReturnBps, 8),
    confidence: round(Math.abs(probabilityUp - 0.5) * 2, 8),
    horizonMinutes: artifact.label.horizonMinutes,
    regime,
    modelId: artifact.modelId,
    modelVersion: artifact.modelVersion,
    modelChecksum: artifact.modelChecksum,
    generatedAt,
    dataCutoff: featureEnvelope.dataCutoff,
    provenanceId: artifact.provenance.datasetId,
  };
}

export function buildImmutableScalpingModelSignalFixtures(input = {}) {
  const artifact = input.artifact;
  const observations = Array.isArray(input.observations) ? input.observations : [];
  return observations.map((observation) => {
    const request = clone(observation.request || {});
    const signal = scoreScalpingShortHorizonModel(artifact, {
      symbol: observation.symbol || request.symbol,
      timestamp: observation.timestamp || request.timestamp,
      dataCutoff: observation.dataCutoff || new Date(Number(request.minuteEndMs)).toISOString(),
      features: observation.features,
    }, {
      generatedAt: new Date(Number(request.minuteEndMs) + 1_000).toISOString(),
    });
    const fixtureBody = {
      request,
      signal,
      datasetId: artifact.provenance.datasetId,
      sourceRevision: artifact.provenance.sourceRevision,
      modelChecksum: artifact.modelChecksum,
    };
    return {
      fixtureVersion: SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION,
      request,
      signal,
      provenance: {
        datasetId: artifact.provenance.datasetId,
        sourceRevision: artifact.provenance.sourceRevision,
        modelChecksum: artifact.modelChecksum,
        fixtureChecksum: checksum(fixtureBody),
        immutable: true,
      },
    };
  });
}

export function runScalpingShortHorizonWalkForward(dataset = {}, options = {}) {
  if (dataset.datasetVersion !== SCALPING_SHORT_HORIZON_DATASET_VERSION || !Array.isArray(dataset.rows)) {
    throw modelError("INVALID_SCALPING_MODEL_DATASET", "Walk-forward 데이터셋 계약이 유효하지 않습니다.");
  }
  const policy = normalizedPolicy({ ...dataset.policy, ...options.policy });
  const sessions = [...new Set(dataset.rows.map((row) => row.sessionDate))].sort();
  const trainSessionsCount = Math.max(4, Math.floor(finite(options.trainSessions) ?? 8));
  const testSessionsCount = Math.max(1, Math.floor(finite(options.testSessions) ?? 2));
  const stepSessions = Math.max(1, Math.floor(finite(options.stepSessions) ?? testSessionsCount));
  const embargoSessions = Math.max(0, Math.floor(finite(options.embargoSessions) ?? policy.embargoSessions));
  const folds = [];
  for (let testStart = trainSessionsCount + embargoSessions; testStart + testSessionsCount <= sessions.length; testStart += stepSessions) {
    const trainStart = Math.max(0, testStart - embargoSessions - trainSessionsCount);
    const trainSessionList = sessions.slice(trainStart, testStart - embargoSessions);
    const testSessionList = sessions.slice(testStart, testStart + testSessionsCount);
    const validationCount = Math.max(1, Math.floor(trainSessionList.length * 0.2));
    const validationSessions = trainSessionList.slice(-validationCount);
    const actualTrainSessions = trainSessionList.slice(0, -validationCount);
    const select = (selected) => dataset.rows.filter((row) => selected.includes(row.sessionDate));
    const split = {
      train: select(actualTrainSessions),
      validation: select(validationSessions),
      test: select(testSessionList),
      sessions: { train: actualTrainSessions, validation: validationSessions, test: testSessionList },
      embargoSessions,
    };
    if (split.train.length < policy.minimumTrainingRows) continue;
    const artifact = fitArtifact(dataset, split, {
      ...options,
      modelVersion: `${clean(options.modelVersion) || "1.0.0-research"}-fold${folds.length + 1}`,
      createdAt: dataset.rows.find((row) => row.sessionDate === testSessionList.at(-1))?.labelEnd,
    }, policy);
    folds.push({
      fold: folds.length + 1,
      trainSessions: actualTrainSessions,
      validationSessions,
      testSessions: testSessionList,
      trainEnd: actualTrainSessions.at(-1),
      testStart: testSessionList[0],
      embargoSessions,
      modelChecksum: artifact.modelChecksum,
      metrics: artifact.metrics,
      safety: {
        chronological: true,
        trainEndsBeforeTestStarts: actualTrainSessions.at(-1) < testSessionList[0],
        futureLeakageAllowed: false,
      },
    });
  }
  return {
    version: "scalping-short-horizon-walk-forward-v1",
    folds,
    summary: {
      folds: folds.length,
      meanTestAccuracy: folds.length ? round(average(folds.map((fold) => fold.metrics.test.accuracy)), 8) : null,
      meanTestBrierScore: folds.length ? round(average(folds.map((fold) => fold.metrics.test.brierScore)), 8) : null,
      meanTestExpectedReturnMaeBps: folds.length ? round(average(folds.map((fold) => fold.metrics.test.expectedReturnMaeBps)), 8) : null,
    },
    safety: {
      chronologicalOnly: true,
      randomSplitAllowed: false,
      futureLeakageAllowed: false,
      modelAutoApprovalAllowed: false,
      orderSubmissionAllowed: false,
    },
  };
}
