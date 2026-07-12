import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS,
  TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL,
  buildAdminTradingAiMlFeaturePipelinePreflightStatus,
  buildAiMlFeaturePipelinePreflight,
  buildFeaturePipelinePreflightCheckResults,
  createDeterministicMockFeaturePipelinePreflightRequest,
  evaluateAiMlFeaturePipelinePreflight,
  validateFeaturePipelinePreflightRequest,
} from "./tradingAiMlFeaturePipelinePreflight.js";

function withRequest(mutator) {
  const request = createDeterministicMockFeaturePipelinePreflightRequest();
  mutator(request);
  return request;
}

function checkById(preflight, checkId) {
  return preflight.checkResults.find((check) => check.checkId === checkId);
}

test("Step194 preflight output is deterministic and stable ordered", () => {
  const first = evaluateAiMlFeaturePipelinePreflight();
  const second = evaluateAiMlFeaturePipelinePreflight();

  assert.deepEqual(second, first);
  assert.equal(first.preflightId, "step194_ai_ml_feature_pipeline_preflight");
  assert.equal(first.status, "metadata_only_preflight");
  assert.equal(first.metadataOnlyPreflight, true);
  assert.equal(TRADING_AI_ML_FEATURE_PIPELINE_PREFLIGHT_MODEL.nextImplementationStep, "ai_ml_feature_batch_preflight_review");

  const checkIds = first.checkResults.map((check) => check.checkId);
  assert.deepEqual(checkIds, [...checkIds].sort());
});

test("Step194 valid metadata contract remains execution blocked", () => {
  const preflight = evaluateAiMlFeaturePipelinePreflight();

  assert.equal(preflight.contractStatus, "valid");
  assert.equal(preflight.executionStatus, "blocked");
  assert.equal(preflight.overallStatus, "valid_contract_execution_blocked");
  assert.equal(preflight.readyForFeatureGeneration, false);
  assert.equal(preflight.readyForDatasetBuild, false);
  assert.equal(preflight.readyForTraining, false);
  assert.equal(preflight.passCount, 11);
  assert.equal(preflight.failCount, 0);
  assert.equal(preflight.blockedCount, 0);
});

test("Step194 unknown feature scenario fails feature registry validation", () => {
  const request = withRequest((draft) => {
    draft.featureSetReference.requestedFeatures = [
      ...draft.featureSetReference.requestedFeatures,
      {
        featureKey: "unknown_alpha_feature",
        featureVersion: "v1",
        requestedLookback: "20d",
        availableAt: "2026-01-05T09:00:00Z",
        eventTime: "2026-01-02T21:00:00Z",
        observedPeriods: 20,
        warmupPolicy: "emit_missing_status_until_minimum_periods_met",
        insufficientHistoryPolicy: "insufficient_history_not_zero_fill",
        allowedMissingStates: ["observed", "missing_source"],
      },
    ].sort((a, b) => a.featureKey.localeCompare(b.featureKey));
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });

  assert.equal(preflight.contractStatus, "invalid");
  assert.equal(preflight.overallStatus, "invalid_contract");
  assert.equal(checkById(preflight, "02_feature_registry").status, "fail");
});

test("Step194 future availableAt leakage scenario is critical failure", () => {
  const request = withRequest((draft) => {
    draft.featureSetReference.requestedFeatures[0] = {
      ...draft.featureSetReference.requestedFeatures[0],
      availableAt: "2026-01-07T09:00:00Z",
    };
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
  const pitCheck = checkById(preflight, "04_point_in_time_validation");

  assert.equal(preflight.overallStatus, "invalid_contract");
  assert.equal(pitCheck.status, "fail");
  assert.equal(pitCheck.severity, "critical");
});

test("Step194 label overlap scenario is critical failure", () => {
  const request = withRequest((draft) => {
    draft.temporalBoundaries.labelStartTime = "2026-01-05T09:00:00Z";
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
  const labelCheck = checkById(preflight, "03_dataset_label_compatibility");

  assert.equal(preflight.contractStatus, "invalid");
  assert.equal(labelCheck.status, "fail");
  assert.equal(labelCheck.severity, "critical");
});

test("Step194 insufficient rolling history never becomes zero fill", () => {
  const request = withRequest((draft) => {
    const feature = draft.featureSetReference.requestedFeatures.find((item) => item.featureKey === "rolling_mdd_252d");
    feature.observedPeriods = 20;
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
  const rollingCheck = checkById(preflight, "05_rolling_history_requirements");

  assert.equal(preflight.contractStatus, "invalid");
  assert.equal(rollingCheck.status, "fail");
  assert.match(rollingCheck.evidence.join("|"), /rolling_mdd_252d/);
  assert.equal(JSON.stringify(preflight).includes("zero_fill_allowed"), false);
});

test("Step194 invalid normalization scope fails as critical", () => {
  for (const scope of ["all_data", "full_dataset"]) {
    const request = withRequest((draft) => {
      draft.normalizationPolicy.normalizerFitScope = scope;
    });
    const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
    const normalizationCheck = checkById(preflight, "07_train_only_normalization");

    assert.equal(preflight.overallStatus, "invalid_contract");
    assert.equal(normalizationCheck.status, "fail");
    assert.equal(normalizationCheck.severity, "critical");
  }
});

test("Step194 unconditional zero fill scenario fails missing policy", () => {
  const request = withRequest((draft) => {
    draft.missingValuePolicy.unconditionalZeroFillAllowed = true;
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
  const missingCheck = checkById(preflight, "06_missing_value_policy");

  assert.equal(preflight.contractStatus, "invalid");
  assert.equal(missingCheck.status, "fail");
});

test("Step194 missing or latest version scenario fails request identity", () => {
  for (const version of ["", "latest"]) {
    const request = withRequest((draft) => {
      draft.featureSetReference.featureSetVersion = version;
    });
    const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
    const identityCheck = checkById(preflight, "01_request_identity");

    assert.equal(preflight.contractStatus, "invalid");
    assert.equal(identityCheck.status, "fail");
  }
});

test("Step194 prohibited execution intent triggers safety block", () => {
  const request = withRequest((draft) => {
    draft.executionIntent.requestedActions = ["validate_contract_metadata", "write_database", "train_model"];
  });
  const preflight = evaluateAiMlFeaturePipelinePreflight({ request });
  const intentCheck = checkById(preflight, "11_prohibited_execution_intent");

  assert.equal(preflight.contractStatus, "invalid");
  assert.equal(preflight.executionStatus, "blocked");
  assert.equal(preflight.overallStatus, "blocked_by_safety_policy");
  assert.equal(intentCheck.status, "blocked");
  assert.equal(intentCheck.severity, "critical");
});

test("Step194 exported validators preserve Step192 and Step193 contract references", () => {
  const request = createDeterministicMockFeaturePipelinePreflightRequest();
  const checks = validateFeaturePipelinePreflightRequest(request);
  const checkResults = buildFeaturePipelinePreflightCheckResults(request);
  const preflight = buildAiMlFeaturePipelinePreflight({ request });

  assert.deepEqual(checkResults, checks);
  assert.equal(preflight.requestContractSummary.labelSpecId, "downside_1m_negative");
  assert.equal(preflight.requestContractSummary.requestedFeatureCount, 12);
  assert.equal(preflight.lineageReproducibilityStatus, "pass");
});

test("Step194 admin status keeps all readiness and execution gates false", () => {
  const status = buildAdminTradingAiMlFeaturePipelinePreflightStatus();

  assert.equal(status.ok, true);
  assert.equal(status.preflight.contractStatus, "valid");
  assert.equal(status.preflight.executionStatus, "blocked");
  assert.equal(status.metadataOnlyPreflightEvaluationAllowed, true);

  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "featureFileCreationAllowed",
    "datasetBuildAllowed",
    "datasetFileCreationAllowed",
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
    "kisTokenIssuanceAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "publicUiExposureAllowed",
    "myPageExposureAllowed",
    "readyForActualDataDownload",
    "readyForFeatureGeneration",
    "readyForDatasetBuild",
    "readyForModelTraining",
    "readyForModelDeployment",
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(status[key], false, `${key} should stay false`);
    assert.equal(STEP194_AI_ML_FEATURE_PIPELINE_PREFLIGHT_FLAGS[key], false, `${key} flag should stay false`);
  }
});

test("Step194 status excludes sensitive raw values", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlFeaturePipelinePreflightStatus());

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
