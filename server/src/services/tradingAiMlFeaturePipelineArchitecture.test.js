import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP193_AI_ML_FEATURE_PIPELINE_FLAGS,
  TRADING_AI_ML_FEATURE_PIPELINE_MODEL,
  buildAdminTradingAiMlFeaturePipelineStatus,
  buildAiMlFeaturePipelineArchitecture,
} from "./tradingAiMlFeaturePipelineArchitecture.js";

test("Step193 feature pipeline architecture is deterministic design-only and redacted", () => {
  const first = buildAiMlFeaturePipelineArchitecture();
  const second = buildAiMlFeaturePipelineArchitecture();

  assert.deepEqual(second, first);
  assert.equal(first.featurePipelineArchitectureId, "step193_admin_ai_ml_feature_pipeline_architecture");
  assert.equal(first.scope, "admin_ai_ml_strategy_lab");
  assert.equal(first.status, "design_only");
  assert.equal(first.source, "deterministic_mock_feature_pipeline_registry");
  assert.equal(first.redacted, true);
  assert.equal(TRADING_AI_ML_FEATURE_PIPELINE_MODEL.nextImplementationStep, "ai_ml_feature_pipeline_preflight_gate");
});

test("Step193 maps all required feature source categories", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();
  const sourceTypes = architecture.featureSourceMappings.map((mapping) => mapping.sourceType);

  for (const sourceType of [
    "asset master",
    "daily price",
    "monthly return",
    "dividend",
    "benchmark",
    "foreign exchange",
    "market regime",
    "portfolio snapshot",
    "dataset label registry",
  ]) {
    assert.equal(sourceTypes.includes(sourceType), true);
  }
  assert.equal(architecture.featureSourceMappings.every((mapping) => mapping.availableAtField && mapping.eventTimeField && mapping.redacted === true), true);
});

test("Step193 point-in-time join contract blocks future records and label leakage", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();
  const rules = architecture.pointInTimeJoinPolicy.requiredRules;

  assert.equal(rules.includes("feature.availableAt <= predictionTime"), true);
  assert.equal(rules.includes("feature.eventTime <= featureCutoffTime"), true);
  assert.equal(rules.includes("featureCutoffTime <= predictionTime"), true);
  assert.equal(rules.includes("labelStartTime > predictionTime"), true);
  assert.equal(architecture.pointInTimeJoinPolicy.duplicateTimestampRejection, true);
  assert.equal(architecture.pointInTimeJoinPolicy.futureRecordRejection, true);
});

test("Step193 rolling contracts define required features without calculation", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();
  const featureKeys = architecture.rollingFeatureContracts.map((contract) => contract.featureKey);

  for (const featureKey of [
    "return_1d",
    "return_20d",
    "momentum_60d",
    "volatility_20d",
    "downside_volatility_20d",
    "rolling_drawdown_60d",
    "rolling_mdd_252d",
    "volume_zscore_20d",
    "beta_252d",
    "correlation_to_benchmark_252d",
    "dividend_yield_ttm",
    "fx_return_20d",
  ]) {
    assert.equal(featureKeys.includes(featureKey), true);
  }
  assert.equal(architecture.rollingFeatureContracts.every((contract) => contract.calculationExecutedNow === false), true);
});

test("Step193 missing value and normalization policies forbid zero fill and full-dataset fit", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();

  for (const status of ["observed", "confirmed_zero", "not_applicable", "missing_source", "insufficient_history", "stale", "invalid"]) {
    assert.equal(architecture.missingValuePolicy.statuses.includes(status), true);
  }
  assert.equal(architecture.missingValuePolicy.noUnconditionalZeroFill, true);
  assert.equal(architecture.missingValuePolicy.imputationFitScope, "training_split_only");
  assert.equal(architecture.trainOnlyNormalizationPolicy.rules.normalizerFitScope, "training_split_only");
  assert.equal(architecture.trainOnlyNormalizationPolicy.rules.fullDatasetNormalization, "forbidden");
  assert.equal(architecture.trainOnlyNormalizationPolicy.rules.splitSpecificRefit, "forbidden");
  assert.equal(architecture.trainOnlyNormalizationPolicy.scalerFitExecutedNow, false);
  assert.equal(architecture.trainOnlyNormalizationPolicy.featureTransformExecutedNow, false);
});

test("Step193 versioning and lineage define immutable metadata-only contracts", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();

  for (const fieldName of [
    "featureSetId",
    "featureSetVersion",
    "featureDefinitionVersion",
    "sourceSnapshotId",
    "datasetVersion",
    "labelDefinitionVersion",
    "codeCommitSha",
    "transformationGraphId",
    "parentArtifactIds",
    "normalizationManifestId",
    "qualityReportId",
  ]) {
    assert.equal(architecture.featureVersioningLineage.lineageFields.includes(fieldName), true);
  }
  assert.equal(architecture.featureVersioningLineage.artifactCreatedNow, false);
});

test("Step193 leakage guards include blocking future, normalization, split and overlap guards", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();
  const guardKeys = architecture.leakageGuards.map((guard) => guard.guardKey);

  for (const guardKey of [
    "future_availability_guard",
    "future_event_time_guard",
    "label_boundary_guard",
    "label_overlap_guard",
    "normalization_fit_scope_guard",
    "random_split_guard",
    "entity_time_duplicate_guard",
    "revised_data_guard",
    "survivorship_bias_guard",
    "universe_membership_guard",
    "cross_split_contamination_guard",
    "lookback_lookforward_overlap_guard",
  ]) {
    assert.equal(guardKeys.includes(guardKey), true);
  }
  assert.equal(architecture.leakageGuards.filter((guard) => guard.severity === "blocking").every((guard) => guard.blocking === true), true);
});

test("Step193 feature quality and pipeline interfaces remain schema-only", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();

  for (const rule of [
    "schema_validation",
    "type_validation",
    "finite_number_validation",
    "range_validation",
    "missing_rate_validation",
    "staleness_validation",
    "duplicate_validation",
    "timestamp_order_validation",
    "join_match_rate_validation",
    "coverage_validation",
    "cardinality_validation",
    "distribution_validation",
    "drift_validation",
    "constant_feature_validation",
  ]) {
    assert.equal(architecture.featureQualityValidation.rules.includes(rule), true);
  }
  assert.equal(architecture.featureQualityValidation.validationExecutedNow, false);
  for (const contractName of [
    "FeatureBatchRequest",
    "FeatureBatchManifest",
    "FeatureQualityReport",
    "DatasetBuilderFeatureInput",
    "TrainingPipelineFeatureInput",
    "InferenceFeatureRequest",
  ]) {
    assert.ok(architecture.datasetTrainingInterfaces.requestContracts[contractName]);
  }
  assert.equal(architecture.datasetTrainingInterfaces.datasetBuilderImplementedNow, false);
  assert.equal(architecture.datasetTrainingInterfaces.trainingProcessImplementedNow, false);
});

test("Step193 future feature store contract stays provider-neutral and disconnected", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();

  for (const interfaceName of [
    "getOfflineFeaturesContract",
    "getOnlineFeaturesContract",
    "getPointInTimeFeaturesContract",
    "validateFeatureFreshnessContract",
  ]) {
    assert.ok(architecture.futureFeatureStoreContract.adapterInterfaces[interfaceName]);
  }
  assert.equal(architecture.futureFeatureStoreContract.dbConnectedNow, false);
  assert.equal(architecture.futureFeatureStoreContract.redisConnectedNow, false);
  assert.equal(architecture.futureFeatureStoreContract.supabaseConnectedNow, false);
  assert.equal(architecture.futureFeatureStoreContract.featureStoreProductConnectedNow, false);
});

test("Step193 status keeps every execution and persistence attempt false", () => {
  const status = buildAdminTradingAiMlFeaturePipelineStatus();

  for (const [key, value] of Object.entries(status.blockedConfirmation)) {
    if (key === "redacted") {
      assert.equal(value, true);
    } else {
      assert.equal(value, false, `${key} should stay false`);
    }
  }
  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "featureFileCreationAllowed",
    "datasetBuildAllowed",
    "pythonFeatureJobAllowed",
    "modelTrainingAllowed",
    "modelArtifactCreationAllowed",
    "modelDeploymentAllowed",
    "modelAutoApprovalAllowed",
    "dbMigrationAllowed",
    "dbReadAllowed",
    "dbWriteAllowed",
    "persistentStorageAllowed",
    "providerCallsAllowed",
    "quoteCallsAllowed",
    "kisCallsAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "publicUiExposureAllowed",
    "myPageExposureAllowed",
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(status[key], false, `${key} should stay false`);
    assert.equal(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS[key], false, `${key} flag should stay false`);
  }
});

test("Step193 feature pipeline excludes sensitive raw identifiers and payloads", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlFeaturePipelineStatus());

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
