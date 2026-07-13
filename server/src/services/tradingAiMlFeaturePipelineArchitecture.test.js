import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP193_ADDITIONAL_FALSE_FLAGS,
  STEP193_AI_ML_FEATURE_PIPELINE_FLAGS,
  STEP193_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_FEATURE_PIPELINE_MODEL,
  buildAdminTradingAiMlFeaturePipelineStatus,
  buildAiMlFeaturePipelineArchitecture,
  normalizeStep193ArchitectureSnapshotForAdmin,
} from "./tradingAiMlFeaturePipelineArchitecture.js";
import { STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS } from "./tradingAiMlDatasetArchitecture.js";
import {
  AI_ML_CONTRACT_STATUS,
  buildAiMlFailClosedFlags,
} from "./tradingAiMlContractPrimitives.js";

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

  assert.equal(status.status, "admin_only_ai_ml_feature_pipeline_architecture_design_only");
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

test("Step193 shared flag compatibility preserves empty metadata allowlist and protected false flags", () => {
  const trueFlags = Object.entries(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  assert.deepEqual(STEP193_METADATA_ONLY_ALLOWED_FLAGS, {});
  assert.deepEqual(trueFlags, []);
  assert.equal(Object.isFrozen(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS), true);
  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "featureFileCreationAllowed",
    "datasetBuildAllowed",
    "dbReadAllowed",
    "providerCallsAllowed",
    "kisCallsAllowed",
    "modelTrainingAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS[key], false, key);
  }
});

test("Step193 inherited execution conflict is forced closed", () => {
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: {
      ...STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
      actualDataDownloadAllowed: true,
      featureGenerationAllowed: true,
      datasetBuildAllowed: true,
      dbReadAllowed: true,
      providerCallsAllowed: true,
      kisCallsAllowed: true,
      modelTrainingAllowed: true,
      orderSubmissionAllowed: true,
      liveTradingAllowed: true,
      readyForOrderSubmission: true,
      readyForLiveGuardedTrading: true,
      unknownExecutionPermissionAllowed: true,
    },
    allowedMetadataFlags: STEP193_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP193_ADDITIONAL_FALSE_FLAGS,
  });

  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "datasetBuildAllowed",
    "dbReadAllowed",
    "providerCallsAllowed",
    "kisCallsAllowed",
    "modelTrainingAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(flags[key], false, key);
  }
  assert.equal(Object.hasOwn(flags, "unknownExecutionPermissionAllowed"), false);
});

test("Step193 explicit metadata allowlist remains empty until a real true flag exists", () => {
  assert.deepEqual(Object.keys(STEP193_METADATA_ONLY_ALLOWED_FLAGS), []);
  assert.deepEqual(
    Object.entries(STEP193_AI_ML_FEATURE_PIPELINE_FLAGS)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    [],
  );
});

test("Step193 shared helper compatibility sorts custom metadata and redacts sensitive fields", () => {
  const input = {
    featureSourceMappings: [
      {
        featureKey: "z_feature",
        sourceId: "api key value",
        sourceType: "daily price",
        sourceField: "private path",
        entityKey: "asset_id",
        eventTimeField: "event_time",
        availableAtField: "available_at",
        allowedUses: ["z_use", "a_use"],
      },
      {
        featureKey: "a_feature",
        sourceId: "safe_source",
        sourceType: "asset master",
        sourceField: "safe_field",
        entityKey: "asset_id",
        eventTimeField: "event_time",
        availableAtField: "available_at",
        allowedUses: ["b_use", "a_use"],
      },
    ],
    rollingFeatureContracts: [
      { featureKey: "z_roll", inputField: "daily_price_adjusted_close", calculationExecutedNow: false },
      { featureKey: "a_roll", inputField: "daily_price_adjusted_close", calculationExecutedNow: false },
    ],
    leakageGuards: [
      { guardKey: "z_guard", description: "api key value", severity: "blocking", blocking: true, failureCode: "private path" },
      { guardKey: "a_guard", description: "safe", severity: "blocking", blocking: true, failureCode: "SAFE" },
    ],
  };

  const architecture = buildAiMlFeaturePipelineArchitecture(input);
  const serialized = JSON.stringify(architecture);

  assert.deepEqual(architecture.featureSourceMappings.map((mapping) => mapping.featureKey), ["a_feature", "z_feature"]);
  assert.deepEqual(architecture.rollingFeatureContracts.map((contract) => contract.featureKey), ["a_roll", "z_roll"]);
  assert.deepEqual(architecture.leakageGuards.map((guard) => guard.guardKey), ["a_guard", "z_guard"]);
  assert.equal(serialized.includes("api key value"), false);
  assert.equal(serialized.includes("private path"), false);
  assert.equal(serialized.includes("redacted_metadata"), true);
  assert.deepEqual(input.featureSourceMappings.map((mapping) => mapping.featureKey), ["z_feature", "a_feature"]);
});

test("Step193 full default output compatibility", () => {
  const architecture = buildAiMlFeaturePipelineArchitecture();

  assert.equal(architecture.featurePipelineArchitectureId, "step193_admin_ai_ml_feature_pipeline_architecture");
  assert.equal(architecture.scope, "admin_ai_ml_strategy_lab");
  assert.equal(architecture.status, "design_only");
  assert.equal(architecture.source, "deterministic_mock_feature_pipeline_registry");
  assert.equal(architecture.nextImplementationStep, "ai_ml_feature_pipeline_preflight_gate");
  assert.equal(architecture.featureSourceMappingCount, 9);
  assert.equal(architecture.rollingFeatureContractCount, 12);
  assert.equal(architecture.leakageGuardCount, 12);
  assert.equal(architecture.qualityRuleCount, 14);
  assert.equal(architecture.interfaceContractCount, 6);
  assert.equal(architecture.validation.validationStatus, "design_ready");
  assert.equal(architecture.validation.blockers.length, 0);
  assert.equal(architecture.featureGenerationStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.datasetBuildStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.trainingStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.featureFileCreationStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.dbReadWriteStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.providerOrderLiveStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.publicExposureStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
});

test("Step193 direct admin snapshot redaction rebuilds supplied architecture", () => {
  const supplied = JSON.parse(JSON.stringify(buildAiMlFeaturePipelineArchitecture()));
  supplied.featureSourceMappings[0] = {
    ...supplied.featureSourceMappings[0],
    featureKey: "safe_snapshot_feature",
    sourceId: "api key value",
    sourceField: "private path",
    credential: "secret value",
    rawProviderResponse: "provider raw response",
  };

  const status = buildAdminTradingAiMlFeaturePipelineStatus({
    featurePipelineArchitecture: supplied,
  });
  const architecture = status.featurePipelineArchitecture;
  const serialized = JSON.stringify(status);

  assert.equal(serialized.includes("api key value"), false);
  assert.equal(serialized.includes("private path"), false);
  assert.equal(serialized.includes("secret value"), false);
  assert.equal(serialized.includes("provider raw response"), false);
  assert.equal(serialized.includes("credential"), false);
  assert.equal(serialized.includes("rawProviderResponse"), false);
  assert.equal(serialized.includes("redacted_metadata"), true);
  assert.equal(architecture.featureSourceMappings[8].featureKey, "safe_snapshot_feature");
  assert.equal(architecture.featureSourceMappingCount, 9);
  assert.equal(architecture.rollingFeatureContractCount, 12);
  assert.equal(architecture.leakageGuardCount, 12);
  assert.equal(architecture.qualityRuleCount, 14);
  assert.equal(architecture.interfaceContractCount, 6);
  assert.equal(architecture.validation.validationStatus, "design_ready");
  assert.equal(architecture.providerOrderLiveStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForOrderSubmission, false);
});

test("Step193 admin snapshot ignores untrusted computed and permission fields", () => {
  const supplied = {
    ...JSON.parse(JSON.stringify(buildAiMlFeaturePipelineArchitecture())),
    validationStatus: "ready",
    featureGenerationStatus: "ready",
    providerOrderLiveStatus: "ready",
    readyForOrderSubmission: true,
    orderSubmissionAllowed: true,
    validation: { validationStatus: "ready", blockers: [] },
  };

  const status = buildAdminTradingAiMlFeaturePipelineStatus({
    featurePipelineArchitecture: supplied,
  });
  const architecture = status.featurePipelineArchitecture;

  assert.equal(architecture.validationStatus, undefined);
  assert.equal(architecture.validation.validationStatus, "design_ready");
  assert.equal(architecture.featureGenerationStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.datasetBuildStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.trainingStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(architecture.providerOrderLiveStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.orderSubmissionAllowed, false);
});

test("Step193 admin snapshot removes unknown top-level fields", () => {
  const status = buildAdminTradingAiMlFeaturePipelineStatus({
    featurePipelineArchitecture: {
      ...JSON.parse(JSON.stringify(buildAiMlFeaturePipelineArchitecture())),
      credential: "secret value",
      privatePath: "private path",
      rawPayload: "provider raw response",
      accountId: "account id value",
    },
  });
  const serialized = JSON.stringify(status.featurePipelineArchitecture);

  assert.equal(serialized.includes("credential"), false);
  assert.equal(serialized.includes("privatePath"), false);
  assert.equal(serialized.includes("rawPayload"), false);
  assert.equal(serialized.includes("accountId"), false);
  assert.equal(serialized.includes("secret value"), false);
  assert.equal(serialized.includes("private path"), false);
  assert.equal(serialized.includes("provider raw response"), false);
  assert.equal(serialized.includes("account id value"), false);
});

test("Step193 admin snapshot normalization resists mutation", () => {
  const supplied = JSON.parse(JSON.stringify(buildAiMlFeaturePipelineArchitecture()));
  supplied.featureSourceMappings[0] = {
    ...supplied.featureSourceMappings[0],
    credential: "secret value",
  };
  supplied.futureFeatureStoreContract = {
    ...supplied.futureFeatureStoreContract,
    rawProviderResponse: "provider raw response",
  };
  const before = JSON.stringify(supplied);

  const architecture = normalizeStep193ArchitectureSnapshotForAdmin(supplied);

  assert.equal(JSON.stringify(supplied), before);
  assert.notEqual(architecture.featureSourceMappings, supplied.featureSourceMappings);
  assert.notEqual(architecture.futureFeatureStoreContract, supplied.futureFeatureStoreContract);
  assert.equal(JSON.stringify(architecture).includes("secret value"), false);
  assert.equal(JSON.stringify(architecture).includes("provider raw response"), false);
});

test("Step193 admin status default compatibility", () => {
  const status = buildAdminTradingAiMlFeaturePipelineStatus();
  const architecture = status.featurePipelineArchitecture;

  assert.equal(status.status, "admin_only_ai_ml_feature_pipeline_architecture_design_only");
  assert.equal(architecture.featureSourceMappingCount, 9);
  assert.equal(architecture.rollingFeatureContractCount, 12);
  assert.equal(architecture.leakageGuardCount, 12);
  assert.equal(architecture.qualityRuleCount, 14);
  assert.equal(architecture.interfaceContractCount, 6);
  assert.equal(architecture.validation.validationStatus, "design_ready");
  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "featureFileCreationAllowed",
    "datasetBuildAllowed",
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(status[key], false, key);
  }
});

test("Step193 mutation resistance keeps source and nested overrides unchanged", () => {
  const input = {
    datasetArchitecture: { datasetArchitectureId: "dataset_override" },
    featureSourceMappings: [{
      featureKey: "custom_feature",
      sourceId: "safe_source",
      sourceType: "daily price",
      sourceField: "safe_field",
      entityKey: "asset_id",
      eventTimeField: "event_time",
      availableAtField: "available_at",
      allowedUses: ["safe_use"],
    }],
    futureFeatureStoreContract: {
      contractId: "safe_contract",
      concepts: ["online_feature_retrieval"],
      adapterInterfaces: { getOnlineFeaturesContract: "blocked" },
      supabaseConnectedNow: false,
    },
  };
  const before = JSON.stringify(input);
  const architecture = buildAiMlFeaturePipelineArchitecture(input);

  assert.equal(architecture.datasetArchitectureId, "dataset_override");
  assert.equal(JSON.stringify(input), before);
  assert.notEqual(architecture.featureSourceMappings, input.featureSourceMappings);
  assert.notEqual(architecture.futureFeatureStoreContract, input.futureFeatureStoreContract);
});
