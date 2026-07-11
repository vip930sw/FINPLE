import { STEP190_MOCK_STRATEGY_RESTORE_CANDIDATE_FLAGS } from "./tradingMockStrategyRestoreCandidate.js";

export const STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS = Object.freeze({
  ...STEP190_MOCK_STRATEGY_RESTORE_CANDIDATE_FLAGS,
  modelTrainingAllowed: false,
  modelDeploymentAllowed: false,
  modelAutoApprovalAllowed: false,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  dbWriteAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL = Object.freeze({
  registryId: "string",
  scope: "admin_ai_ml_strategy_lab",
  source: "deterministic_mock_registry",
  status: "design_only",
  redacted: true,
  models: "ai_ml_strategy_model_version[]",
  datasets: "dataset_contract[]",
  featureSets: "feature_set_contract[]",
  evaluationProfiles: "evaluation_metric_contract[]",
  approvalWorkflow: "approval_retirement_workflow",
  blockedOperations: "blocked_operation[]",
  nextImplementationStep: "ai_ml_training_pipeline_preflight_contract",
});

const MODEL_LIFECYCLE = Object.freeze([
  "draft",
  "training_candidate",
  "evaluated",
  "backtest_reviewed",
  "walk_forward_reviewed",
  "shadow_candidate",
  "approved_for_internal_analysis",
  "retired",
]);

const BLOCKED_OPERATIONS = Object.freeze([
  "actual_ml_training",
  "python_training_job",
  "model_file_creation_or_upload",
  "model_registry_db_write",
  "supabase_select_insert_update_delete",
  "db_migration_or_schema_change",
  "kis_or_provider_call",
  "token_issuance_or_quote_query",
  "order_submission_or_live_account_query",
  "auto_strategy_approval",
  "public_or_mypage_ai_trading_ui",
]);

const MOCK_MODELS = Object.freeze([
  {
    modelId: "aiml-regime-classifier-v0",
    modelName: "Market Regime Classifier",
    modelType: "market_regime_classifier",
    modelVersion: "design-v0.1",
    algorithmFamily: "tree_ensemble_candidate",
    lifecycleStatus: "draft",
    trainingDatasetId: "dataset-market-regime-window-v0",
    featureSetId: "feature-set-market-regime-v0",
    evaluationProfileId: "eval-regime-classification-v0",
    outputContract: ["regime_label", "probability_distribution", "confidence", "data_coverage", "warning_flags"],
    trainedAt: "placeholder_only",
    reviewedAt: "placeholder_only",
    approvedAt: "placeholder_only",
    retiredAt: "placeholder_only",
    calculationVersion: "aiml_design_contract_v1",
    redacted: true,
    deploymentStatus: "blocked",
  },
  {
    modelId: "aiml-portfolio-risk-score-v0",
    modelName: "Portfolio Risk Score Model",
    modelType: "portfolio_risk_score_model",
    modelVersion: "design-v0.1",
    algorithmFamily: "regularized_regression_candidate",
    lifecycleStatus: "training_candidate",
    trainingDatasetId: "dataset-portfolio-risk-snapshot-v0",
    featureSetId: "feature-set-portfolio-risk-v0",
    evaluationProfileId: "eval-risk-score-v0",
    outputContract: ["risk_score", "concentration_risk", "volatility_risk", "drawdown_risk", "liquidity_risk", "confidence", "explanation_factors"],
    trainedAt: "placeholder_only",
    reviewedAt: "placeholder_only",
    approvedAt: "placeholder_only",
    retiredAt: "placeholder_only",
    calculationVersion: "aiml_design_contract_v1",
    redacted: true,
    deploymentStatus: "blocked",
  },
  {
    modelId: "aiml-downside-probability-v0",
    modelName: "Downside Probability Model",
    modelType: "downside_probability_model",
    modelVersion: "design-v0.1",
    algorithmFamily: "calibrated_probability_candidate",
    lifecycleStatus: "evaluated",
    trainingDatasetId: "dataset-downside-window-v0",
    featureSetId: "feature-set-downside-risk-v0",
    evaluationProfileId: "eval-downside-calibration-v0",
    outputContract: ["one_month_loss_probability", "three_month_loss_probability", "threshold_downside_probability", "confidence_interval_candidate"],
    trainedAt: "placeholder_only",
    reviewedAt: "placeholder_only",
    approvedAt: "placeholder_only",
    retiredAt: "placeholder_only",
    calculationVersion: "aiml_design_contract_v1",
    redacted: true,
    deploymentStatus: "blocked",
  },
  {
    modelId: "aiml-volatility-forecast-v0",
    modelName: "Volatility Forecast Model",
    modelType: "volatility_forecast_model",
    modelVersion: "design-v0.1",
    algorithmFamily: "time_series_volatility_candidate",
    lifecycleStatus: "backtest_reviewed",
    trainingDatasetId: "dataset-volatility-window-v0",
    featureSetId: "feature-set-volatility-v0",
    evaluationProfileId: "eval-volatility-forecast-v0",
    outputContract: ["forecast_horizon", "volatility_range", "confidence", "warning_flags"],
    trainedAt: "placeholder_only",
    reviewedAt: "placeholder_only",
    approvedAt: "placeholder_only",
    retiredAt: "placeholder_only",
    calculationVersion: "aiml_design_contract_v1",
    redacted: true,
    deploymentStatus: "blocked",
  },
  {
    modelId: "aiml-rebalance-necessity-v0",
    modelName: "Rebalancing Necessity Model",
    modelType: "rebalancing_necessity_model",
    modelVersion: "design-v0.1",
    algorithmFamily: "scoring_rule_candidate",
    lifecycleStatus: "walk_forward_reviewed",
    trainingDatasetId: "dataset-rebalance-drift-v0",
    featureSetId: "feature-set-rebalance-v0",
    evaluationProfileId: "eval-rebalance-necessity-v0",
    outputContract: ["rebalance_necessity_score", "drift_signal", "risk_change_signal", "confidence", "review_flags"],
    trainedAt: "placeholder_only",
    reviewedAt: "placeholder_only",
    approvedAt: "placeholder_only",
    retiredAt: "placeholder_only",
    calculationVersion: "aiml_design_contract_v1",
    redacted: true,
    deploymentStatus: "blocked",
  },
]);

const DATASETS = Object.freeze([
  {
    datasetId: "dataset-market-regime-window-v0",
    datasetName: "Market regime deterministic window",
    scope: "mock_lab_admin_only",
    coverage: "monthly_and_daily_mock_market_windows",
    sourceBoundary: "mock_history_and_static_contract_only",
    labelContract: ["uptrend", "sideways", "downtrend", "high_volatility"],
    storageStatus: "not_persisted",
    redacted: true,
  },
  {
    datasetId: "dataset-portfolio-risk-snapshot-v0",
    datasetName: "Portfolio risk snapshot candidate",
    scope: "mock_lab_admin_only",
    coverage: "mock_portfolio_ledger_and_risk_snapshots",
    sourceBoundary: "no_actual_account_balance",
    labelContract: ["risk_bucket", "drawdown_bucket", "concentration_bucket"],
    storageStatus: "not_persisted",
    redacted: true,
  },
  {
    datasetId: "dataset-downside-window-v0",
    datasetName: "Downside probability candidate window",
    scope: "mock_lab_admin_only",
    coverage: "deterministic_mock_return_windows",
    sourceBoundary: "scenario_runtime_untouched",
    labelContract: ["loss_probability_bucket", "threshold_breach_candidate"],
    storageStatus: "not_persisted",
    redacted: true,
  },
  {
    datasetId: "dataset-volatility-window-v0",
    datasetName: "Volatility forecast candidate window",
    scope: "mock_lab_admin_only",
    coverage: "mock_volatility_observation_windows",
    sourceBoundary: "no_provider_quote_query",
    labelContract: ["realized_volatility_band", "forecast_horizon"],
    storageStatus: "not_persisted",
    redacted: true,
  },
  {
    datasetId: "dataset-rebalance-drift-v0",
    datasetName: "Rebalance drift candidate window",
    scope: "mock_lab_admin_only",
    coverage: "mock_allocation_and_risk_drift_snapshots",
    sourceBoundary: "no_order_candidate_or_live_position",
    labelContract: ["rebalance_review_needed", "risk_change_bucket"],
    storageStatus: "not_persisted",
    redacted: true,
  },
]);

const FEATURE_SETS = Object.freeze([
  {
    featureSetId: "feature-set-market-regime-v0",
    modelTypes: ["market_regime_classifier"],
    featureFamilies: ["trend", "drawdown", "volatility", "breadth_placeholder"],
    featureSource: "deterministic_mock_market_features",
    forbiddenInputs: ["provider packet values blocked", "account linkage values blocked", "order packet values blocked"],
    redacted: true,
  },
  {
    featureSetId: "feature-set-portfolio-risk-v0",
    modelTypes: ["portfolio_risk_score_model"],
    featureFamilies: ["allocation_concentration", "mock_drawdown", "mock_volatility", "liquidity_placeholder"],
    featureSource: "mock_portfolio_snapshot_features",
    forbiddenInputs: ["live balance values blocked", "secret material blocked", "private filesystem reference blocked"],
    redacted: true,
  },
  {
    featureSetId: "feature-set-downside-risk-v0",
    modelTypes: ["downside_probability_model"],
    featureFamilies: ["trailing_return", "drawdown_depth", "volatility_band", "cash_buffer_placeholder"],
    featureSource: "mock_return_window_features",
    forbiddenInputs: ["access token values blocked", "app secret values blocked", "provider raw packet values blocked"],
    redacted: true,
  },
  {
    featureSetId: "feature-set-volatility-v0",
    modelTypes: ["volatility_forecast_model"],
    featureFamilies: ["realized_volatility", "range_proxy", "shock_flag_placeholder"],
    featureSource: "static_mock_series_features",
    forbiddenInputs: ["provider quote values blocked", "provider packet values blocked", "hash or digest material blocked"],
    redacted: true,
  },
  {
    featureSetId: "feature-set-rebalance-v0",
    modelTypes: ["rebalancing_necessity_model"],
    featureFamilies: ["allocation_drift", "risk_score_delta", "cash_reserve_gap", "turnover_placeholder"],
    featureSource: "mock_allocation_risk_features",
    forbiddenInputs: ["live order identifier blocked", "live fill identifier blocked", "live execution identifier blocked"],
    redacted: true,
  },
]);

const EVALUATION_PROFILES = Object.freeze([
  {
    evaluationProfileId: "eval-regime-classification-v0",
    evaluationType: "backtest_and_walk_forward_candidate",
    metricContract: ["balanced_accuracy", "macro_f1", "calibration_error", "coverage_warning_count"],
    backtestContract: "time_split_backtest_mock_only",
    walkForwardContract: "rolling_window_mock_only",
    shadowEvaluationContract: "admin_shadow_observation_only",
    approvalThresholdStatus: "not_approved",
    redacted: true,
  },
  {
    evaluationProfileId: "eval-risk-score-v0",
    evaluationType: "risk_score_validation_candidate",
    metricContract: ["rank_correlation", "bucket_stability", "drawdown_alignment", "explanation_coverage"],
    backtestContract: "historical_mock_ledger_snapshot_review",
    walkForwardContract: "risk_snapshot_forward_window_review",
    shadowEvaluationContract: "admin_internal_analysis_only",
    approvalThresholdStatus: "not_approved",
    redacted: true,
  },
  {
    evaluationProfileId: "eval-downside-calibration-v0",
    evaluationType: "probability_calibration_candidate",
    metricContract: ["brier_score", "calibration_slope", "threshold_recall", "false_alarm_rate"],
    backtestContract: "mock_return_threshold_backtest",
    walkForwardContract: "rolling_threshold_observation",
    shadowEvaluationContract: "blocked_from_user_output",
    approvalThresholdStatus: "not_approved",
    redacted: true,
  },
  {
    evaluationProfileId: "eval-volatility-forecast-v0",
    evaluationType: "forecast_error_candidate",
    metricContract: ["mae", "interval_coverage", "tail_error_warning_count", "stability_score"],
    backtestContract: "static_series_volatility_backtest",
    walkForwardContract: "rolling_volatility_window_review",
    shadowEvaluationContract: "admin_console_only",
    approvalThresholdStatus: "not_approved",
    redacted: true,
  },
  {
    evaluationProfileId: "eval-rebalance-necessity-v0",
    evaluationType: "decision_support_scoring_candidate",
    metricContract: ["review_precision", "review_recall", "turnover_warning_rate", "risk_delta_alignment"],
    backtestContract: "mock_allocation_drift_backtest",
    walkForwardContract: "mock_rebalance_window_review",
    shadowEvaluationContract: "no_order_or_auto_approval",
    approvalThresholdStatus: "not_approved",
    redacted: true,
  },
]);

const APPROVAL_WORKFLOW = Object.freeze({
  workflowId: "aiml_strategy_management_workflow_v0",
  lifecycle: MODEL_LIFECYCLE,
  approvalStages: [
    "architecture_review",
    "dataset_contract_review",
    "feature_contract_review",
    "evaluation_contract_review",
    "shadow_observation_review",
    "internal_analysis_approval",
    "retirement_review",
  ],
  approvalAuthority: "admin_placeholder",
  modelAutoApprovalAllowed: false,
  retirementPolicy: "retire_or_archive_without_public_output",
  redacted: true,
});

const IMPLEMENTATION_CONTRACTS = Object.freeze([
  {
    step: "Step 192",
    name: "AI/ML dataset contract preflight",
    allowedScope: "contract_only_no_training_no_db_write",
  },
  {
    step: "Step 193",
    name: "AI/ML feature pipeline design gate",
    allowedScope: "deterministic_feature_contract_no_python_job",
  },
  {
    step: "Step 194",
    name: "AI/ML evaluation profile preflight",
    allowedScope: "mock_metric_contract_no_model_file",
  },
  {
    step: "Step 195",
    name: "AI/ML approval workflow review gate",
    allowedScope: "admin_review_only_no_deployment",
  },
]);

const UNSAFE_MODEL_OUTPUT_MARKERS = Object.freeze([
  ["expected", "return"].join("_"),
  ["buy", "sell", "recommendation"].join("_"),
]);

function countByLifecycle(models) {
  return MODEL_LIFECYCLE.map((status) => ({
    lifecycleStatus: status,
    count: models.filter((model) => model.lifecycleStatus === status).length,
  }));
}

function validateRegistry(registry) {
  const blockers = [];
  const warnings = [];
  const modelIds = new Set();
  const expectedTypes = new Set([
    "market_regime_classifier",
    "portfolio_risk_score_model",
    "downside_probability_model",
    "volatility_forecast_model",
    "rebalancing_necessity_model",
  ]);

  for (const model of registry.models) {
    if (modelIds.has(model.modelId)) blockers.push("duplicate_model_id");
    modelIds.add(model.modelId);
    expectedTypes.delete(model.modelType);
    if (model.redacted !== true) blockers.push(`${model.modelId}_not_redacted`);
    if (model.deploymentStatus !== "blocked") blockers.push(`${model.modelId}_deployment_not_blocked`);
    if (!MODEL_LIFECYCLE.includes(model.lifecycleStatus)) blockers.push(`${model.modelId}_invalid_lifecycle`);
    if (model.outputContract.some((output) => UNSAFE_MODEL_OUTPUT_MARKERS.some((marker) => output.includes(marker)))) {
      blockers.push(`${model.modelId}_unsafe_output_contract`);
    }
  }
  if (expectedTypes.size > 0) blockers.push(`missing_model_types:${Array.from(expectedTypes).join(",")}`);
  if (registry.datasets.some((dataset) => dataset.storageStatus !== "not_persisted")) blockers.push("dataset_storage_not_blocked");
  if (registry.evaluationProfiles.some((profile) => profile.approvalThresholdStatus !== "not_approved")) blockers.push("evaluation_threshold_approved");
  if (registry.approvalWorkflow.modelAutoApprovalAllowed !== false) blockers.push("model_auto_approval_enabled");
  if (registry.models.some((model) => model.lifecycleStatus === "approved_for_internal_analysis")) warnings.push("internal_analysis_approval_requires_future_gate");
  if (registry.models.every((model) => model.lifecycleStatus !== "shadow_candidate")) warnings.push("shadow_candidate_not_yet_present");

  return {
    validationStatus: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "design_ready_with_warning" : "design_ready",
    blockers,
    warnings,
    redacted: true,
  };
}

export function buildAiMlStrategyManagementRegistry(input = {}) {
  const registry = {
    registryId: "step191_admin_ai_ml_strategy_management_registry",
    scope: "admin_ai_ml_strategy_lab",
    source: "deterministic_mock_registry",
    status: "design_only",
    redacted: true,
    models: input.models || MOCK_MODELS,
    datasets: input.datasets || DATASETS,
    featureSets: input.featureSets || FEATURE_SETS,
    evaluationProfiles: input.evaluationProfiles || EVALUATION_PROFILES,
    approvalWorkflow: input.approvalWorkflow || APPROVAL_WORKFLOW,
    blockedOperations: [...BLOCKED_OPERATIONS],
    nextImplementationStep: "ai_ml_training_pipeline_preflight_contract",
  };
  const validation = validateRegistry(registry);

  return {
    ...registry,
    modelCount: registry.models.length,
    datasetCount: registry.datasets.length,
    featureSetCount: registry.featureSets.length,
    evaluationProfileCount: registry.evaluationProfiles.length,
    lifecycleSummary: countByLifecycle(registry.models),
    implementationContracts: IMPLEMENTATION_CONTRACTS,
    validation,
    trainingStatus: "blocked",
    deploymentStatus: "blocked",
    dbWriteStatus: "blocked",
    providerOrderLiveStatus: "blocked",
  };
}

export function buildAdminTradingAiMlStrategyManagementStatus(input = {}) {
  const registry = input.registry || buildAiMlStrategyManagementRegistry(input);
  return {
    ok: true,
    step: "Step 191: Design AI/ML strategy management console",
    status: "admin_only_ai_ml_strategy_management_console_design_only",
    sourceStep: "step191",
    registryModel: TRADING_AI_ML_STRATEGY_MANAGEMENT_REGISTRY_MODEL,
    registry,
    blockedConfirmation: {
      endpointAdded: false,
      modelTrainingAttempted: false,
      pythonTrainingJobAttempted: false,
      modelFileCreatedOrUploaded: false,
      modelRegistryDbWriteAttempted: false,
      supabaseSelectAttempted: false,
      supabaseInsertAttempted: false,
      supabaseUpdateAttempted: false,
      supabaseDeleteAttempted: false,
      dbMigrationAttempted: false,
      dbSchemaChangeAttempted: false,
      providerCallAttempted: false,
      tokenIssuanceAttempted: false,
      quoteQueryAttempted: false,
      orderSubmissionAttempted: false,
      liveAccountBalanceQueried: false,
      actualTradingRunCreated: false,
      modelAutoApprovalAttempted: false,
      mypageAiTradingUiExposed: false,
      homepageAiTradingUiExposed: false,
      publicAiTradingUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP191_AI_ML_STRATEGY_MANAGEMENT_FLAGS },
    modelTrainingAllowed: false,
    modelDeploymentAllowed: false,
    modelAutoApprovalAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    dbWriteAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
  };
}
