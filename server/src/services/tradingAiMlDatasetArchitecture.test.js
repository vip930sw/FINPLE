import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  TRADING_AI_ML_DATASET_ARCHITECTURE_MODEL,
  buildAdminTradingAiMlDatasetArchitectureStatus,
  buildAiMlDatasetArchitecture,
} from "./tradingAiMlDatasetArchitecture.js";

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
