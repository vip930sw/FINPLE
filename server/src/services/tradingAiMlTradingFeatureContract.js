export const STEP235A_TRADING_FEATURE_CONTRACT_SCHEMA_VERSION = "1.0.0";
export const STEP235A_TRADING_FEATURE_CONTRACT_VERSION = "1.0.0";
export const STEP235A_TRADING_FEATURE_MODE = "offline_synthetic_feature_pilot";
export const STEP235A_LABEL_POLICY_VERSION = "1.0.0";
export const STEP235A_LABEL_PURPOSE = "research_validation_only";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "featureContractVersion",
  "mode",
  "inputContract",
  "featureDefinitions",
  "labelContract",
  "splitPolicy",
  "leakagePolicy",
  "usage",
]);

const FEATURE_NAMES = Object.freeze([
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

const USAGE_KEYS = Object.freeze([
  "modelTrainingAllowed",
  "backtestClaimAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
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

function buildFeatureDefinition(name, windowMonths, minObservations, formula) {
  return {
    name,
    windowMonths,
    minObservations,
    formula,
    sourceWindowEndPolicy: "feature_window_end_lte_featureTimestamp",
    usesFutureData: false,
    usesLabelWindow: false,
  };
}

export function buildStep235ATradingFeatureContract() {
  return deepFreeze({
    schemaVersion: STEP235A_TRADING_FEATURE_CONTRACT_SCHEMA_VERSION,
    featureContractVersion: STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
    mode: STEP235A_TRADING_FEATURE_MODE,
    inputContract: {
      fixtureType: "deterministic_synthetic_monthly_price_return",
      requiredFields: ["assetKey", "market", "timestamp"],
      valueFields: ["close", "monthlyReturn"],
      optionalFields: ["volume"],
      externalProviderAllowed: false,
      currentTimeAllowed: false,
      randomAllowed: false,
    },
    featureDefinitions: [
      buildFeatureDefinition("return1m", 1, 1, "monthly_return_at_feature_timestamp"),
      buildFeatureDefinition("return3m", 3, 3, "compounded_monthly_return_last_3_observations"),
      buildFeatureDefinition("return6m", 6, 6, "compounded_monthly_return_last_6_observations"),
      buildFeatureDefinition("return12m", 12, 12, "compounded_monthly_return_last_12_observations"),
      buildFeatureDefinition("volatility3m", 3, 3, "population_standard_deviation_last_3_monthly_returns"),
      buildFeatureDefinition("volatility6m", 6, 6, "population_standard_deviation_last_6_monthly_returns"),
      buildFeatureDefinition("drawdown12m", 12, 12, "minimum_close_to_prior_peak_drawdown_last_12_observations"),
      buildFeatureDefinition("trend3mVs12m", 12, 12, "return3m_minus_return12m"),
      buildFeatureDefinition("observationCount", 0, 1, "count_observations_lte_feature_timestamp"),
      buildFeatureDefinition("featureTimestamp", 0, 1, "timestamp_of_latest_feature_observation"),
    ],
    labelContract: {
      purpose: STEP235A_LABEL_PURPOSE,
      labelPolicyVersion: STEP235A_LABEL_POLICY_VERSION,
      fields: ["forwardReturn1m", "labelTimestamp", "labelWindowStart", "labelWindowEnd", "labelClass"],
      classPolicy: {
        positiveGte: 0.02,
        negativeLte: -0.02,
        neutralOtherwise: true,
      },
      investmentInstructionAllowed: false,
      orderInstructionAllowed: false,
      labelWindowPolicy: "label_window_strictly_after_featureTimestamp",
    },
    splitPolicy: {
      type: "walk_forward_chronological",
      randomSplitAllowed: false,
      splitOrder: ["train", "validation", "test"],
      overlapAllowed: false,
    },
    leakagePolicy: {
      featureWindowEndLteFeatureTimestamp: true,
      featureTimestampBeforeLabelWindowStart: true,
      labelWindowStartLteEnd: true,
      crossSplitLabelWindowOverlapAllowed: false,
      futureReturnInFeaturesAllowed: false,
      normalizationMode: "none",
      fullDatasetFitAllowed: false,
    },
    usage: {
      modelTrainingAllowed: false,
      backtestClaimAllowed: false,
      providerAccessAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
    },
  });
}

export const STEP235A_TRADING_FEATURE_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  featureNames: FEATURE_NAMES,
  usageKeys: USAGE_KEYS,
  labelPurpose: STEP235A_LABEL_PURPOSE,
  labelPolicyVersion: STEP235A_LABEL_POLICY_VERSION,
  featureContractVersion: STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
  mode: STEP235A_TRADING_FEATURE_MODE,
  redacted: true,
});

export function getStep235ATradingFeatureContractSnapshot() {
  return deepFreeze(clonePlain(buildStep235ATradingFeatureContract()));
}
