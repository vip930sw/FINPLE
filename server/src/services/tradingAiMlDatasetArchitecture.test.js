import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP192_ADDITIONAL_FALSE_FLAGS,
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  STEP192_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL,
  buildAdminTradingAiMlDatasetArchitectureStatus,
  buildAiMlDatasetArchitecture,
  normalizeStep192DatasetArchitectureSnapshotForAdmin,
} from "./tradingAiMlDatasetArchitecture.js";
import { STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS } from "./tradingAiMlStrategyManagement.js";
import { buildAiMlFailClosedFlags } from "./tradingAiMlContractPrimitives.js";

const EXPECTED_LABEL_KEYS = [
  "labelId",
  "modelType",
  "labelName",
  "horizon",
  "formula",
  "threshold",
  "positiveClass",
  "neutralClass",
  "missingLabelPolicy",
  "embargoPeriod",
  "redacted",
];

const EXPECTED_SPLIT_POLICY_KEYS = [
  "splitPolicyId",
  "policyType",
  "randomSplitAllowed",
  "trainWindow",
  "validationWindow",
  "testWindow",
  "finalHoldoutPolicy",
  "embargoRule",
  "purgeRule",
  "imputationRule",
  "redacted",
];

const EXPECTED_WALK_FORWARD_POLICY_KEYS = [
  "walkForwardPolicyId",
  "windowType",
  "trainWindowMinimum",
  "validationWindow",
  "testWindow",
  "stepSize",
  "embargoRule",
  "foldLeakageCheck",
  "redacted",
];

const EXPECTED_VERSIONING_POLICY_KEYS = [
  "policyId",
  "datasetVersionFormat",
  "labelChangeCreatesNewDatasetVersion",
  "featureChangeCreatesNewDatasetVersion",
  "splitChangeCreatesNewDatasetVersion",
  "immutableAfterReview",
  "status",
  "redacted",
];

const EXPECTED_LINEAGE_POLICY_KEYS = [
  "policyId",
  "lineageFields",
  "rawValueStorageAllowed",
  "privatePathStorageAllowed",
  "digestStorageAllowed",
  "status",
  "redacted",
];

const EXPECTED_RETENTION_POLICY_KEYS = [
  "policyId",
  "retentionScope",
  "datasetFileRetention",
  "redactionRequired",
  "forbiddenValueClasses",
  "publicExposureAllowed",
  "mypageExposureAllowed",
  "redacted",
];

const STEP192_ACCIDENTAL_LABEL_KEYS = [
  "predictionHorizon",
  "labelWindowStart",
  "labelWindowEnd",
  "targetDefinition",
  "positiveClassDefinition",
  "binningPolicy",
  "leakageControls",
  "status",
];

const EXPECTED_LABEL_DEFINITIONS = [
  {
    labelId: "downside_1m_negative",
    modelType: "downside_probability_model",
    labelName: "one month negative forward return",
    horizon: "1m",
    formula: "forward_return_1m < 0",
    threshold: 0,
    positiveClass: "negative_forward_return",
    neutralClass: "non_negative_forward_return",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "1m",
    redacted: true,
  },
  {
    labelId: "downside_3m_below_minus_5pct",
    modelType: "downside_probability_model",
    labelName: "three month downside threshold breach",
    horizon: "3m",
    formula: "forward_return_3m < -5pct",
    threshold: "-5pct",
    positiveClass: "below_threshold",
    neutralClass: "at_or_above_threshold",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "3m",
    redacted: true,
  },
  {
    labelId: "forward_volatility_20d",
    modelType: "volatility_forecast_model",
    labelName: "future realized volatility twenty day",
    horizon: "20d",
    formula: "realized_volatility_over_label_window",
    threshold: "continuous_target",
    positiveClass: "not_applicable_continuous",
    neutralClass: "not_applicable_continuous",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "20d",
    redacted: true,
  },
  {
    labelId: "future_drawdown_bucket_60d",
    modelType: "portfolio_risk_score_model",
    labelName: "future drawdown bucket sixty day",
    horizon: "60d",
    formula: "max_drawdown_over_label_window_bucket",
    threshold: "bucketed_thresholds",
    positiveClass: "high_drawdown_bucket",
    neutralClass: "low_or_medium_drawdown_bucket",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "60d",
    redacted: true,
  },
  {
    labelId: "market_regime_20d",
    modelType: "market_regime_classifier",
    labelName: "twenty day market regime",
    horizon: "20d",
    formula: "future_return_and_volatility_bucket_after_prediction_time",
    threshold: "deterministic_bucket_rules",
    positiveClass: "regime_bucket",
    neutralClass: "sideways_bucket",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "20d",
    redacted: true,
  },
];

const EXPECTED_SPLIT_POLICY = {
  splitPolicyId: "chronological-split-v0",
  policyType: "chronological",
  randomSplitAllowed: false,
  trainWindow: "2015-01-01_to_2021-12-31",
  validationWindow: "2022-01-01_to_2023-12-31",
  testWindow: "2024-01-01_to_2025-12-31",
  finalHoldoutPolicy: "preserve_unseen_holdout",
  embargoRule: "label_horizon_sized_embargo",
  purgeRule: "purge_overlapping_samples",
  imputationRule: "fit_with_train_split_only",
  redacted: true,
};

const EXPECTED_WALK_FORWARD_POLICY = {
  walkForwardPolicyId: "walk-forward-expanding-v0",
  windowType: "expanding_train_rolling_validation",
  trainWindowMinimum: "36m",
  validationWindow: "6m",
  testWindow: "6m",
  stepSize: "3m",
  embargoRule: "apply_label_horizon_embargo_each_fold",
  foldLeakageCheck: "required_before_training",
  redacted: true,
};

const EXPECTED_VERSIONING_POLICY = {
  policyId: "dataset-versioning-policy-v0",
  datasetVersionFormat: "dataset_family_id:label_version:feature_version:split_version",
  labelChangeCreatesNewDatasetVersion: true,
  featureChangeCreatesNewDatasetVersion: true,
  splitChangeCreatesNewDatasetVersion: true,
  immutableAfterReview: true,
  status: "design_only",
  redacted: true,
};

const EXPECTED_LINEAGE_POLICY = {
  policyId: "dataset-lineage-policy-v0",
  lineageFields: ["sourceRegistryId", "datasetFamilyId", "labelDefinitionId", "featureSetVersion", "splitPolicyId", "walkForwardPolicyId", "createdByAdminPlaceholder"],
  rawValueStorageAllowed: false,
  privatePathStorageAllowed: false,
  digestStorageAllowed: false,
  status: "placeholder_only",
  redacted: true,
};

const EXPECTED_RETENTION_POLICY = {
  policyId: "dataset-retention-redaction-policy-v0",
  retentionScope: "metadata_contract_only",
  datasetFileRetention: "not_applicable_no_file_created",
  redactionRequired: true,
  forbiddenValueClasses: ["redacted_metadata", "account linkage values", "provider packets", "order packets", "private filesystem references", "redacted_metadata"],
  publicExposureAllowed: false,
  mypageExposureAllowed: false,
  redacted: true,
};

test("Step192 dataset architecture is deterministic design-only and redacted", () => {
  const first = buildAiMlDatasetArchitecture();
  const second = buildAiMlDatasetArchitecture();

  assert.deepEqual(second, first);
  assert.equal(first.datasetArchitectureId, "step192_admin_ai_ml_dataset_architecture");
  assert.equal(first.scope, "admin_ai_ml_strategy_lab");
  assert.equal(first.status, "design_only");
  assert.equal(first.source, "deterministic_mock_dataset_registry");
  assert.equal(first.redacted, true);
  assert.equal(TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL.nextImplementationStep, "ai_ml_feature_pipeline_design_gate");
});

test("Step192 includes all required dataset families", () => {
  const architecture = buildAiMlDatasetArchitecture();
  const modelTypes = architecture.datasetFamilies.map((family) => family.modelType);

  for (const modelType of [
    "market_regime_classifier",
    "portfolio_risk_score_model",
    "downside_probability_model",
    "volatility_forecast_model",
    "rebalancing_necessity_model",
  ]) {
    assert.equal(modelTypes.includes(modelType), true);
  }
  assert.equal(architecture.datasetFamilyCount, 5);
});

test("Step192 label definitions include deterministic horizons and embargo", () => {
  const architecture = buildAiMlDatasetArchitecture();
  const labelIds = architecture.labelDefinitions.map((label) => label.labelId);

  for (const labelId of [
    "downside_1m_negative",
    "downside_3m_below_minus_5pct",
    "forward_volatility_20d",
    "future_drawdown_bucket_60d",
    "market_regime_20d",
  ]) {
    assert.equal(labelIds.includes(labelId), true);
  }
  assert.equal(architecture.labelDefinitions.every((label) => label.embargoPeriod && label.redacted === true), true);
});

test("Step192 feature timestamp rules carry availableAt and leakage contracts", () => {
  const architecture = buildAiMlDatasetArchitecture();
  const featureIds = architecture.featureTimestampRules.map((feature) => feature.featureId);

  for (const featureId of [
    "return_5d",
    "return_20d",
    "volatility_20d",
    "drawdown_60d",
    "momentum_120d",
    "beta_252d",
    "allocation_drift",
    "concentration_hhi",
    "fx_change_20d",
    "rate_change_20d",
  ]) {
    assert.equal(featureIds.includes(featureId), true);
  }
  assert.equal(architecture.featureTimestampRules.every((feature) => feature.availableAtRule && feature.version === "feature_timestamp_v0"), true);
});

test("Step192 point-in-time rules require prediction and label timestamps", () => {
  const architecture = buildAiMlDatasetArchitecture();

  for (const fieldName of ["observationTime", "availableAt", "predictionTime", "labelStartTime", "labelEndTime", "marketTimezone", "dataRevisionPolicy"]) {
    assert.equal(architecture.pointInTimeRules.requiredFields.includes(fieldName), true);
  }
  assert.equal(architecture.pointInTimeRules.status, "design_only");
});

test("Step192 split and walk-forward policies block random split and enforce embargo", () => {
  const architecture = buildAiMlDatasetArchitecture();
  const split = architecture.splitPolicies[0];
  const walkForward = architecture.walkForwardPolicies[0];

  assert.equal(split.policyType, "chronological");
  assert.equal(split.randomSplitAllowed, false);
  assert.equal(split.trainWindow, "2015-01-01_to_2021-12-31");
  assert.equal(split.validationWindow, "2022-01-01_to_2023-12-31");
  assert.equal(split.testWindow, "2024-01-01_to_2025-12-31");
  assert.match(split.embargoRule, /label_horizon/);
  assert.match(walkForward.embargoRule, /label_horizon/);
});

test("Step192 leakage controls cover lookahead target and revision leakage", () => {
  const architecture = buildAiMlDatasetArchitecture();
  const controls = architecture.leakageControls.join(" | ");

  assert.match(controls, /future return feature blocked/);
  assert.match(controls, /random shuffle split blocked/);
  assert.match(controls, /lookahead bias review required/);
  assert.match(controls, /target leakage review required/);
  assert.match(controls, /corporate action revision leakage review required/);
});

test("Step192 versioning lineage and retention policies stay metadata-only", () => {
  const architecture = buildAiMlDatasetArchitecture();

  assert.equal(architecture.versioningPolicy.labelChangeCreatesNewDatasetVersion, true);
  assert.equal(architecture.versioningPolicy.immutableAfterReview, true);
  assert.equal(architecture.lineagePolicy.rawValueStorageAllowed, false);
  assert.equal(architecture.lineagePolicy.privatePathStorageAllowed, false);
  assert.equal(architecture.lineagePolicy.digestStorageAllowed, false);
  assert.equal(architecture.retentionPolicy.datasetFileRetention, "not_applicable_no_file_created");
  assert.equal(architecture.retentionPolicy.publicExposureAllowed, false);
});

test("Step192 validation blocks unsafe dataset architecture changes", () => {
  const unsafeFamilies = buildAiMlDatasetArchitecture().datasetFamilies.slice(0, 4).map((family, index) => (
    index === 0 ? { ...family, pointInTimeRequired: false } : family
  ));
  const architecture = buildAiMlDatasetArchitecture({ datasetFamilies: unsafeFamilies });

  assert.equal(architecture.validation.validationStatus, "blocked");
  assert.equal(architecture.validation.blockers.includes("dataset-family-market-regime-v0_point_in_time_not_required"), true);
  assert.equal(architecture.validation.blockers.some((blocker) => blocker.startsWith("missing_dataset_families:")), true);
});

test("Step192 status keeps dataset feature training provider order live and DB gates blocked", () => {
  const status = buildAdminTradingAiMlDatasetArchitectureStatus();

  assert.equal(status.status, "admin_only_ai_ml_dataset_architecture_design_only");
  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.actualDataDownloadAttempted, false);
  assert.equal(status.blockedConfirmation.externalFinancialApiCallAttempted, false);
  assert.equal(status.blockedConfirmation.providerCallAttempted, false);
  assert.equal(status.blockedConfirmation.pythonTrainingJobAttempted, false);
  assert.equal(status.blockedConfirmation.modelTrainingAttempted, false);
  assert.equal(status.blockedConfirmation.datasetFileCreated, false);
  assert.equal(status.blockedConfirmation.csvOrParquetCreated, false);
  assert.equal(status.blockedConfirmation.supabaseSelectAttempted, false);
  assert.equal(status.blockedConfirmation.dbMigrationAttempted, false);
  assert.equal(status.blockedConfirmation.persistentDbWriteAttempted, false);
  assert.equal(status.datasetBuildAllowed, false);
  assert.equal(status.featureGenerationAllowed, false);
  assert.equal(status.modelTrainingAllowed, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.dbWriteAllowed, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
});

test("Step192 dataset architecture excludes sensitive raw identifiers and payloads", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlDatasetArchitectureStatus());

  for (const forbidden of [
    "account_number",
    "account_identifier",
    "credential",
    "provider_payload",
    "order_payload",
    "raw_provider_response",
    "private_path",
    "hash_value",
    "digest_value",
    "kis_token",
    "app_secret",
    "actual_order_id",
    "actual_fill_id",
    "actual_execution_id",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("Step192 flags keep build generation training deployment and public gates false", () => {
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.datasetBuildAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.featureGenerationAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.modelTrainingAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.modelDeploymentAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.modelAutoApprovalAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.publicUiAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.dbWriteAllowed, false);
});

test("Step192 shared flag compatibility", () => {
  const rebuilt = buildAiMlFailClosedFlags({
    inheritedFlags: STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS,
    allowedMetadataFlags: STEP192_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP192_ADDITIONAL_FALSE_FLAGS,
  });

  assert.deepEqual(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS, rebuilt);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.datasetBuildAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.providerCallsAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForOrderSubmission, false);
});

test("Step192 inherited execution conflict", () => {
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: {
      ...STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS,
      datasetBuildAllowed: true,
      orderSubmissionAllowed: true,
      readyForLiveGuardedTrading: true,
    },
    allowedMetadataFlags: STEP192_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP192_ADDITIONAL_FALSE_FLAGS,
  });

  assert.equal(flags.datasetBuildAllowed, false);
  assert.equal(flags.orderSubmissionAllowed, false);
  assert.equal(flags.readyForLiveGuardedTrading, false);
});

test("Step192 explicit metadata allowlist", () => {
  const trueKeys = Object.entries(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  assert.deepEqual(STEP192_METADATA_ONLY_ALLOWED_FLAGS, {});
  assert.deepEqual(trueKeys, []);
});

test("Step192 shared helper compatibility", () => {
  const architecture = buildAiMlDatasetArchitecture({
    datasetFamilies: [{
      datasetFamilyId: "dataset-family-sensitive-v0",
      modelType: "api key value",
      purpose: "private path C:\\secret\\packet.json",
      inputFamilies: ["token value", "market_return"],
      labelFamilies: ["provider raw response"],
      pointInTimeRequired: true,
      leakageReviewStatus: "required_before_build",
      leakageRisks: ["account id value"],
      leakageControls: ["future return feature blocked"],
      blockedReasons: ["dataset_build_blocked"],
    }],
  });
  const serialized = JSON.stringify(architecture);

  assert.equal(serialized.includes("api key value"), false);
  assert.equal(serialized.includes("C:\\secret\\packet.json"), false);
  assert.equal(serialized.includes("token value"), false);
  assert.equal(serialized.includes("provider raw response"), false);
  assert.equal(serialized.includes("account id value"), false);
  assert.equal(serialized.includes("redacted_metadata"), true);
});

test("Step192 full default output compatibility", () => {
  const architecture = buildAiMlDatasetArchitecture();

  assert.equal(architecture.datasetArchitectureId, "step192_admin_ai_ml_dataset_architecture");
  assert.equal(architecture.scope, "admin_ai_ml_strategy_lab");
  assert.equal(architecture.status, "design_only");
  assert.equal(architecture.source, "deterministic_mock_dataset_registry");
  assert.equal(architecture.nextImplementationStep, "ai_ml_feature_pipeline_design_gate");
  assert.equal(architecture.datasetFamilyCount, 5);
  assert.equal(architecture.labelDefinitionCount, 5);
  assert.equal(architecture.featureTimestampRuleCount, 10);
  assert.equal(architecture.leakageControlCount, 11);
  assert.equal(architecture.splitPolicyCount, 1);
  assert.equal(architecture.walkForwardPolicyCount, 1);
  assert.equal(architecture.validation.validationStatus, "design_ready");
  assert.equal(architecture.validation.blockers.length, 0);
  assert.equal(architecture.datasetBuildStatus, "blocked");
  assert.equal(architecture.featureGenerationStatus, "blocked");
  assert.equal(architecture.trainingStatus, "blocked");
  assert.equal(architecture.dbWriteStatus, "blocked");
  assert.equal(architecture.providerOrderLiveStatus, "blocked");
  assert.deepEqual(architecture.labelDefinitions, EXPECTED_LABEL_DEFINITIONS);
  assert.equal(typeof architecture.labelDefinitions[0].threshold, "number");
  assert.deepEqual(Object.keys(architecture.labelDefinitions[0]), EXPECTED_LABEL_KEYS);
  for (const label of architecture.labelDefinitions) {
    assert.deepEqual(Object.keys(label), EXPECTED_LABEL_KEYS);
    for (const accidentalKey of STEP192_ACCIDENTAL_LABEL_KEYS) {
      assert.equal(Object.hasOwn(label, accidentalKey), false, accidentalKey);
    }
  }
  assert.deepEqual(architecture.splitPolicies, [EXPECTED_SPLIT_POLICY]);
  assert.deepEqual(Object.keys(architecture.splitPolicies[0]), EXPECTED_SPLIT_POLICY_KEYS);
  assert.equal(Object.hasOwn(architecture.splitPolicies[0], "purgeOverlapRequired"), false);
  assert.deepEqual(architecture.walkForwardPolicies, [EXPECTED_WALK_FORWARD_POLICY]);
  assert.deepEqual(Object.keys(architecture.walkForwardPolicies[0]), EXPECTED_WALK_FORWARD_POLICY_KEYS);
  assert.equal(Object.hasOwn(architecture.walkForwardPolicies[0], "leakageReviewRequired"), false);
  assert.deepEqual(architecture.versioningPolicy, EXPECTED_VERSIONING_POLICY);
  assert.deepEqual(Object.keys(architecture.versioningPolicy), EXPECTED_VERSIONING_POLICY_KEYS);
  assert.deepEqual(architecture.lineagePolicy, EXPECTED_LINEAGE_POLICY);
  assert.deepEqual(Object.keys(architecture.lineagePolicy), EXPECTED_LINEAGE_POLICY_KEYS);
  assert.deepEqual(architecture.retentionPolicy, EXPECTED_RETENTION_POLICY);
  assert.deepEqual(Object.keys(architecture.retentionPolicy), EXPECTED_RETENTION_POLICY_KEYS);
});

test("Step192 mutation resistance", () => {
  const input = {
    labelDefinitions: [{
      labelId: "custom_label",
      modelType: "downside_probability_model",
      labelName: "custom label",
      horizon: "1m",
      formula: "forward_return_1m < 0",
      threshold: 0,
      positiveClass: "negative_forward_return",
      neutralClass: "non_negative_forward_return",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "20d",
      unknownNestedKey: "remove me",
    }],
  };
  const architecture = buildAiMlDatasetArchitecture(input);
  input.labelDefinitions[0].labelId = "mutated_label";
  input.labelDefinitions[0].threshold = "credential";

  assert.equal(architecture.labelDefinitions[0].labelId, "custom_label");
  assert.equal(architecture.labelDefinitions[0].threshold, 0);
  assert.equal(Object.hasOwn(architecture.labelDefinitions[0], "unknownNestedKey"), false);
});

test("Step192 custom overrides keep legacy dataset contract vocabulary", () => {
  const architecture = buildAiMlDatasetArchitecture({
    labelDefinitions: [{
      labelId: "custom_legacy_label",
      modelType: "downside_probability_model",
      labelName: "custom legacy label",
      horizon: "2m",
      formula: "forward_return_2m < -3pct",
      threshold: "-3pct",
      positiveClass: "below_custom_threshold",
      neutralClass: "at_or_above_custom_threshold",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "2m",
      predictionHorizon: "should_not_survive",
      targetDefinition: "should_not_survive",
    }],
    splitPolicies: [{
      splitPolicyId: "custom-split-v0",
      policyType: "chronological",
      randomSplitAllowed: true,
      trainWindow: "2018_to_2021",
      validationWindow: "2022",
      testWindow: "2023",
      finalHoldoutPolicy: "custom_holdout",
      embargoRule: "custom_embargo",
      purgeRule: "custom_purge",
      imputationRule: "custom_imputation",
      purgeOverlapRequired: true,
    }],
    walkForwardPolicies: [{
      walkForwardPolicyId: "custom-walk-forward-v0",
      windowType: "rolling",
      trainWindowMinimum: "24m",
      validationWindow: "3m",
      testWindow: "3m",
      stepSize: "1m",
      embargoRule: "custom_fold_embargo",
      foldLeakageCheck: "custom_fold_check",
      leakageReviewRequired: true,
    }],
    versioningPolicy: {
      ...EXPECTED_VERSIONING_POLICY,
      unknownPolicyKey: "remove me",
    },
    lineagePolicy: {
      ...EXPECTED_LINEAGE_POLICY,
      rawValueStorageAllowed: true,
      privatePathStorageAllowed: true,
      digestStorageAllowed: true,
      unknownPolicyKey: "remove me",
    },
    retentionPolicy: {
      ...EXPECTED_RETENTION_POLICY,
      redactionRequired: false,
      publicExposureAllowed: true,
      mypageExposureAllowed: true,
      unknownPolicyKey: "remove me",
    },
  });

  assert.deepEqual(Object.keys(architecture.labelDefinitions[0]), EXPECTED_LABEL_KEYS);
  assert.equal(architecture.labelDefinitions[0].threshold, "-3pct");
  assert.equal(Object.hasOwn(architecture.labelDefinitions[0], "predictionHorizon"), false);
  assert.deepEqual(Object.keys(architecture.splitPolicies[0]), EXPECTED_SPLIT_POLICY_KEYS);
  assert.equal(architecture.splitPolicies[0].randomSplitAllowed, false);
  assert.equal(Object.hasOwn(architecture.splitPolicies[0], "purgeOverlapRequired"), false);
  assert.deepEqual(Object.keys(architecture.walkForwardPolicies[0]), EXPECTED_WALK_FORWARD_POLICY_KEYS);
  assert.equal(Object.hasOwn(architecture.walkForwardPolicies[0], "leakageReviewRequired"), false);
  assert.deepEqual(Object.keys(architecture.versioningPolicy), EXPECTED_VERSIONING_POLICY_KEYS);
  assert.deepEqual(Object.keys(architecture.lineagePolicy), EXPECTED_LINEAGE_POLICY_KEYS);
  assert.equal(architecture.lineagePolicy.rawValueStorageAllowed, false);
  assert.equal(architecture.lineagePolicy.privatePathStorageAllowed, false);
  assert.equal(architecture.lineagePolicy.digestStorageAllowed, false);
  assert.deepEqual(Object.keys(architecture.retentionPolicy), EXPECTED_RETENTION_POLICY_KEYS);
  assert.equal(architecture.retentionPolicy.redactionRequired, true);
  assert.equal(architecture.retentionPolicy.publicExposureAllowed, false);
  assert.equal(architecture.retentionPolicy.mypageExposureAllowed, false);
  assert.equal(JSON.stringify(architecture).includes("unknownPolicyKey"), false);
});

test("Step192 sensitive strings are redacted while safe scalars keep type", () => {
  const architecture = buildAiMlDatasetArchitecture({
    labelDefinitions: [{
      labelId: "scalar_label",
      modelType: "downside_probability_model",
      labelName: "custom label",
      horizon: "1m",
      formula: "api key value",
      threshold: true,
      positiveClass: "account id value",
      neutralClass: "non_negative_forward_return",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "20d",
    }],
  });
  const label = architecture.labelDefinitions[0];
  const serialized = JSON.stringify(label);

  assert.equal(label.threshold, true);
  assert.equal(serialized.includes("api key value"), false);
  assert.equal(serialized.includes("account id value"), false);
  assert.equal(serialized.includes("redacted_metadata"), true);
});

test("Step192 admin snapshot redaction", () => {
  const normalized = normalizeStep192DatasetArchitectureSnapshotForAdmin({
    strategyRegistryId: "private path C:\\owner\\registry.json",
    datasetFamilies: [{
      datasetFamilyId: "dataset-family-sensitive-v0",
      modelType: "secret value",
      purpose: "api key value",
      inputFamilies: ["market_return"],
      labelFamilies: ["token value"],
      pointInTimeRequired: true,
      leakageReviewStatus: "required_before_build",
      leakageRisks: ["hash value"],
      leakageControls: ["future return feature blocked"],
      blockedReasons: ["dataset_build_blocked"],
    }],
    labelDefinitions: [{
      labelId: "snapshot_label",
      modelType: "downside_probability_model",
      labelName: "snapshot label",
      horizon: "1m",
      formula: "forward_return_1m < 0",
      threshold: 0,
      positiveClass: "negative_forward_return",
      neutralClass: "non_negative_forward_return",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "1m",
      targetDefinition: "should_not_survive",
    }],
    splitPolicies: [{
      splitPolicyId: "snapshot-split",
      policyType: "chronological",
      randomSplitAllowed: true,
      trainWindow: "2018_to_2021",
      validationWindow: "2022",
      testWindow: "2023",
      finalHoldoutPolicy: "holdout",
      embargoRule: "embargo",
      purgeRule: "purge",
      imputationRule: "impute",
      purgeOverlapRequired: true,
    }],
    walkForwardPolicies: [{
      walkForwardPolicyId: "snapshot-walk",
      windowType: "rolling",
      trainWindowMinimum: "24m",
      validationWindow: "3m",
      testWindow: "3m",
      stepSize: "1m",
      embargoRule: "embargo",
      foldLeakageCheck: "required",
      leakageReviewRequired: true,
    }],
    validationStatus: "ready",
    readyForOrderSubmission: true,
    orderSubmissionAllowed: true,
    credential: "raw credential",
  });
  const serialized = JSON.stringify(normalized);

  assert.equal(serialized.includes("private path"), false);
  assert.equal(serialized.includes("secret value"), false);
  assert.equal(serialized.includes("api key value"), false);
  assert.equal(serialized.includes("token value"), false);
  assert.equal(serialized.includes("hash value"), false);
  assert.equal(serialized.includes("credential"), false);
  assert.equal(serialized.includes("redacted_metadata"), true);
  assert.equal(normalized.readyForOrderSubmission, undefined);
  assert.equal(normalized.orderSubmissionAllowed, undefined);
  assert.deepEqual(Object.keys(normalized.labelDefinitions[0]), EXPECTED_LABEL_KEYS);
  assert.equal(Object.hasOwn(normalized.labelDefinitions[0], "targetDefinition"), false);
  assert.deepEqual(Object.keys(normalized.splitPolicies[0]), EXPECTED_SPLIT_POLICY_KEYS);
  assert.equal(normalized.splitPolicies[0].randomSplitAllowed, false);
  assert.equal(Object.hasOwn(normalized.splitPolicies[0], "purgeOverlapRequired"), false);
  assert.deepEqual(Object.keys(normalized.walkForwardPolicies[0]), EXPECTED_WALK_FORWARD_POLICY_KEYS);
  assert.equal(Object.hasOwn(normalized.walkForwardPolicies[0], "leakageReviewRequired"), false);
});

test("Step192 supplied readiness ignored", () => {
  const status = buildAdminTradingAiMlDatasetArchitectureStatus({
    datasetArchitecture: {
      readyForOrderSubmission: true,
      readyForLiveGuardedTrading: true,
      orderSubmissionAllowed: true,
      providerCallsAllowed: true,
      datasetBuildStatus: "ready",
      validation: { validationStatus: "ready", blockers: [] },
    },
    readyForOrderSubmission: true,
  });

  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.datasetArchitecture.datasetBuildStatus, "blocked");
  assert.notEqual(status.datasetArchitecture.validation.validationStatus, "ready");
});
