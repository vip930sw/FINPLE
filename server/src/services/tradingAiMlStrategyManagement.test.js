import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS,
  TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL,
  buildAdminTradingAiMlStrategyManagementStatus,
  buildAiMlStrategyManagementRegistry,
} from "./tradingAiMlStrategyManagement.js";

test("Step191 registry is deterministic design-only and redacted", () => {
  const first = buildAiMlStrategyManagementRegistry();
  const second = buildAiMlStrategyManagementRegistry();

  assert.deepEqual(second, first);
  assert.equal(first.registryId, "step191_admin_ai_ml_strategy_management_registry");
  assert.equal(first.scope, "admin_ai_ml_strategy_lab");
  assert.equal(first.source, "deterministic_mock_registry");
  assert.equal(first.status, "design_only");
  assert.equal(first.redacted, true);
  assert.equal(TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL.nextImplementationStep, "ai_ml_training_pipeline_preflight_contract");
});

test("Step191 includes all required AI ML strategy model domains", () => {
  const registry = buildAiMlStrategyManagementRegistry();
  const modelTypes = registry.models.map((model) => model.modelType);

  for (const modelType of [
    "market_regime_classifier",
    "portfolio_risk_score_model",
    "downside_probability_model",
    "volatility_forecast_model",
    "rebalancing_necessity_model",
  ]) {
    assert.equal(modelTypes.includes(modelType), true);
  }
  assert.equal(registry.modelCount, 5);
});

test("Step191 model versions keep training deployment and auto approval blocked", () => {
  const registry = buildAiMlStrategyManagementRegistry();

  for (const model of registry.models) {
    assert.equal(model.redacted, true);
    assert.equal(model.deploymentStatus, "blocked");
    assert.equal(model.trainedAt, "placeholder_only");
    assert.equal(model.approvedAt, "placeholder_only");
  }
  assert.equal(STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS.modelTrainingAllowed, false);
  assert.equal(STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS.modelDeploymentAllowed, false);
  assert.equal(STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS.modelAutoApprovalAllowed, false);
});

test("Step191 dataset feature and evaluation contracts are admin mock only", () => {
  const registry = buildAiMlStrategyManagementRegistry();

  assert.equal(registry.datasetCount, 5);
  assert.equal(registry.featureSetCount, 5);
  assert.equal(registry.evaluationProfileCount, 5);
  assert.equal(registry.datasets.every((dataset) => dataset.scope === "mock_lab_admin_only"), true);
  assert.equal(registry.datasets.every((dataset) => dataset.storageStatus === "not_persisted"), true);
  assert.equal(registry.featureSets.every((featureSet) => featureSet.redacted === true), true);
  assert.equal(registry.evaluationProfiles.every((profile) => profile.approvalThresholdStatus === "not_approved"), true);
});

test("Step191 evaluation contracts include backtest walk-forward and shadow boundaries", () => {
  const registry = buildAiMlStrategyManagementRegistry();

  for (const profile of registry.evaluationProfiles) {
    assert.match(profile.backtestContract, /backtest|snapshot|series/);
    assert.match(profile.walkForwardContract, /rolling|forward|window/);
    assert.equal(typeof profile.shadowEvaluationContract, "string");
    assert.equal(profile.redacted, true);
  }
});

test("Step191 approval workflow records lifecycle without enabling auto approval", () => {
  const registry = buildAiMlStrategyManagementRegistry();

  assert.deepEqual(registry.approvalWorkflow.lifecycle, [
    "draft",
    "training_candidate",
    "evaluated",
    "backtest_reviewed",
    "walk_forward_reviewed",
    "shadow_candidate",
    "approved_for_internal_analysis",
    "retired",
  ]);
  assert.equal(registry.approvalWorkflow.modelAutoApprovalAllowed, false);
  assert.equal(registry.approvalWorkflow.retirementPolicy, "retire_or_archive_without_public_output");
});

test("Step191 implementation contracts define future work without running training", () => {
  const registry = buildAiMlStrategyManagementRegistry();

  assert.equal(registry.implementationContracts.length, 4);
  assert.equal(registry.implementationContracts[0].step, "Step 192");
  assert.equal(registry.implementationContracts.every((contract) => contract.allowedScope.includes("no_")), true);
  assert.equal(registry.trainingStatus, "blocked");
  assert.equal(registry.deploymentStatus, "blocked");
  assert.equal(registry.dbWriteStatus, "blocked");
});

test("Step191 validation blocks missing model types and unsafe deployment states", () => {
  const unsafeModels = buildAiMlStrategyManagementRegistry().models.slice(0, 4).map((model, index) => (
    index === 0 ? { ...model, deploymentStatus: "ready" } : model
  ));
  const registry = buildAiMlStrategyManagementRegistry({ models: unsafeModels });

  assert.equal(registry.validation.validationStatus, "blocked");
  assert.equal(registry.validation.blockers.includes("aiml-regime-classifier-v0_deployment_not_blocked"), true);
  assert.equal(registry.validation.blockers.some((blocker) => blocker.startsWith("missing_model_types:")), true);
});

test("Step191 status keeps provider order live and DB gates blocked", () => {
  const status = buildAdminTradingAiMlStrategyManagementStatus();

  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.modelTrainingAttempted, false);
  assert.equal(status.blockedConfirmation.pythonTrainingJobAttempted, false);
  assert.equal(status.blockedConfirmation.modelFileCreatedOrUploaded, false);
  assert.equal(status.blockedConfirmation.modelRegistryDbWriteAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseSelectAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(status.blockedConfirmation.providerCallAttempted, false);
  assert.equal(status.blockedConfirmation.orderSubmissionAttempted, false);
  assert.equal(status.blockedConfirmation.modelAutoApprovalAttempted, false);
  assert.equal(status.modelTrainingAllowed, false);
  assert.equal(status.modelDeploymentAllowed, false);
  assert.equal(status.modelAutoApprovalAllowed, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.dbWriteAllowed, false);
});

test("Step191 registry excludes sensitive raw identifiers and trading payloads", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlStrategyManagementStatus());

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
