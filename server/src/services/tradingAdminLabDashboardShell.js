import { STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS } from "./tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js";

export const STEP131_ADMIN_TRADING_LAB_DASHBOARD_FLAGS = Object.freeze({
  ...STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS = Object.freeze({
  ...STEP131_ADMIN_TRADING_LAB_DASHBOARD_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS = Object.freeze({
  ...STEP132_ADMIN_TRADING_LAB_VISUALIZATION_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS = Object.freeze({
  ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS = Object.freeze({
  ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP136_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP137_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP136_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP138_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP137_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP139_ADMIN_TRADING_LAB_MOCK_RUN_CANDIDATE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP138_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP140_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP139_ADMIN_TRADING_LAB_MOCK_RUN_CANDIDATE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP141_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP140_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP142_ADMIN_TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP141_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP143_ADMIN_TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP142_ADMIN_TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP144_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP143_ADMIN_TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP145_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP144_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP146_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP145_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP147_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP146_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP148_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_FLAGS = Object.freeze({
  ...STEP147_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_LAB_STRATEGY_CONFIG_SCHEMA = Object.freeze({
  strategyId: "string",
  strategyType: "admin_trading_lab_strategy_config",
  sourceStep: "step131",
  mode: "mock | dry_run | shadow",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
});

export const TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA = Object.freeze({
  strategyDraftId: "string",
  draftType: "admin_only_mock_strategy_config_draft",
  sourceStep: "step134",
  strategyName: "string",
  mode: "mock | dry_run | shadow",
  allowedSymbols: "placeholder_symbol[]",
  targetWeights: "target_weight_draft[]",
  rebalanceRule: "rebalance_rule_draft",
  riskLimits: "risk_limit_draft",
  status: "draft | blocked | mock_only | validation_required",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL = Object.freeze({
  symbol: "placeholder_symbol",
  weightPct: "number",
  status: "mock_only | validation_required",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL = Object.freeze({
  ruleId: "string",
  interval: "manual_review | weekly_mock | monthly_mock",
  thresholdPct: "number",
  status: "mock_only",
});

export const TRADING_LAB_RISK_LIMIT_DRAFT_MODEL = Object.freeze({
  maxOrderAmount: "number | placeholder",
  maxDailyLossPct: "number | placeholder",
  maxPositionWeightPct: "number | placeholder",
  killSwitchRequired: true,
  riskGateRequired: true,
  status: "blocked_by_default",
});

export const TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA = Object.freeze({
  comparisonId: "string",
  strategyDraftId: "string",
  sourceStep: "step135",
  baseStrategyName: "string",
  draftStrategyName: "string",
  changedSymbols: "placeholder_symbol[]",
  addedSymbols: "placeholder_symbol[]",
  removedSymbols: "placeholder_symbol[]",
  validationStatus: "blocked | validation_required | mock_only",
  reviewStatus: "blocked | validation_required | review_pending | mock_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL = Object.freeze({
  changeId: "string",
  changedAt: "placeholder_timestamp",
  changedBy: "admin_placeholder",
  changeType: "target_weight | risk_limit | mode | allowed_symbols | rebalance_rule",
  status: "draft | validation_required | blocked | reviewed",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA = Object.freeze({
  previewId: "string",
  sourceStep: "step135",
  dataSource: "mock_ledger_calculation_result",
  cumulativeReturnDeltaPct: "number",
  mddDeltaPct: "number",
  cashWeightDeltaPct: "number",
  maxPositionWeightDeltaPct: "number",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA = Object.freeze({
  reviewResultId: "string",
  sourceStep: "step135",
  status: "blocked | validation_required | review_pending | review_recorded | not_ready | mock_only",
  storageMode: "in_memory_placeholder_only",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_RECORDING_SCHEMA = Object.freeze({
  reviewResultId: "string",
  strategyDraftId: "string",
  comparisonId: "string",
  sourceStep: "step136",
  reviewStatus: "recorded | rejected | blocked | validation_required | mock_only",
  decision: "mock_review_recorded | rejected | blocked",
  reviewedAt: "placeholder_timestamp",
  reviewedBy: "admin_placeholder",
  readinessImpact: "none",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  reviewResultId: "string",
  strategyDraftId: "string",
  comparisonId: "string",
  sourceStep: "step136",
  reviewStatus: "recorded | rejected | blocked | validation_required | mock_only",
  decision: "mock_review_recorded | rejected | blocked",
  recordedAt: "placeholder_timestamp",
  blockerCount: "number",
  warningCount: "number",
  readinessImpact: "none",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_REVIEW_BLOCKER_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step136",
  blockers: "string[]",
  warnings: "string[]",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_SCHEMA = Object.freeze({
  clearancePreflightId: "string",
  strategyDraftId: "string",
  comparisonId: "string",
  reviewResultId: "string",
  receiptId: "string",
  sourceStep: "step137",
  clearanceStatus: "blocked | validation_required | mock_only_clearance_candidate | not_ready",
  clearanceScope: "mock_only",
  reviewedReceiptStatus: "recorded | validation_required | blocked | missing",
  readinessImpact: "none",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_CANDIDATE_MODEL = Object.freeze({
  candidateId: "string",
  strategyDraftId: "string",
  mode: "mock | dry_run | shadow",
  scope: "mock_only",
  status: "blocked | validation_required | candidate",
  targetWeightStatus: "mock_only | validation_required",
  riskLimitStatus: "mock_only | validation_required",
  reviewReceiptStatus: "recorded | validation_required | blocked | missing",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_BLOCKER_MODEL = Object.freeze({
  blockerSummaryId: "string",
  sourceStep: "step137",
  blockers: "string[]",
  warnings: "string[]",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  clearancePreflightId: "string",
  candidateId: "string",
  strategyDraftId: "string",
  reviewResultId: "string",
  receiptId: "string",
  clearanceStatus: "blocked | validation_required | mock_only_clearance_candidate | not_ready",
  clearanceScope: "mock_only",
  nextAllowedStep: "mock_review_only",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_RECORDING_SCHEMA = Object.freeze({
  clearanceReviewResultId: "string",
  clearancePreflightId: "string",
  candidateId: "string",
  strategyDraftId: "string",
  reviewResultId: "string",
  receiptId: "string",
  sourceStep: "step138",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_clearance_review_recorded | blocked | rejected",
  reviewedAt: "placeholder_timestamp",
  reviewedBy: "admin_placeholder",
  readinessImpact: "none",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  clearanceReviewResultId: "string",
  clearancePreflightId: "string",
  candidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_clearance_review_recorded | blocked | rejected",
  recordedAt: "placeholder_timestamp",
  blockerCount: "number",
  warningCount: "number",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_review_only",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  decisionSummaryId: "string",
  sourceStep: "step138",
  decision: "mock_clearance_review_recorded | blocked | rejected",
  summary: "string",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_BLOCKER_SUMMARY_MODEL = Object.freeze({
  blockerSummaryId: "string",
  sourceStep: "step138",
  blockers: "string[]",
  warnings: "string[]",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_CANDIDATE_MODEL = Object.freeze({
  candidateId: "string",
  sourceStep: "step139",
  strategyDraftId: "string",
  inputBundleId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_run_candidate",
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  orderCandidateCreated: false,
  orderDraftCreated: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_PREFLIGHT_MODEL = Object.freeze({
  preflightId: "string",
  sourceStep: "step139",
  candidateId: "string",
  inputBundleId: "string",
  readinessStatus: "blocked | validation_required | mock_run_candidate",
  dependencyStatus: "blocked | validation_required | ready",
  readinessImpact: "none",
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_INPUT_BUNDLE_MODEL = Object.freeze({
  inputBundleId: "string",
  sourceStep: "step139",
  strategyDraftId: "string",
  universeSnapshotId: "string",
  initialCapitalId: "string",
  scope: "mock_only",
  dataSource: "mock_ledger_calculation_result",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_MOCK_RUN_UNIVERSE_SNAPSHOT_MODEL = Object.freeze({
  universeSnapshotId: "string",
  sourceStep: "step139",
  symbols: "placeholder_symbol[]",
  priceSeriesStatus: "available | validation_required",
  providerPayload: false,
  rawProviderResponse: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_INITIAL_CAPITAL_MODEL = Object.freeze({
  initialCapitalId: "string",
  sourceStep: "step139",
  initialCapitalPlaceholder: "number",
  cashPlaceholder: "number",
  status: "placeholder_only | validation_required",
  accountIdentifier: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_READINESS_SCHEMA = Object.freeze({
  readinessId: "string",
  sourceStep: "step139",
  status: "blocked | validation_required | mock_run_candidate",
  strategyDependencyStatus: "blocked | validation_required | ready",
  priceSeriesDependencyStatus: "available | validation_required",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_MOCK_RUN_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  resultId: "string",
  sourceStep: "step139",
  candidateId: "string",
  inputBundleId: "string",
  status: "blocked | validation_required | mock_run_candidate",
  scope: "mock_only",
  nextAllowedStep: "mock_order_generation_preflight",
  orderCandidateCreated: false,
  orderDraftCreated: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_MODEL = Object.freeze({
  mockOrderGenerationPreflightId: "string",
  sourceStep: "step140",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  mode: "mock | dry_run | shadow",
  scope: "mock_only",
  status: "blocked | validation_required | mock_order_generation_candidate | not_ready",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_MOCK_ORDER_INTENT_MODEL = Object.freeze({
  mockOrderIntentId: "string",
  sourceStep: "step140",
  mockRunCandidateId: "string",
  symbol: "placeholder_symbol",
  side: "mock_buy | mock_sell | mock_hold",
  reason: "rebalance_gap | risk_limit | cash_reserve | no_action",
  targetWeight: "number",
  currentWeight: "number",
  weightGap: "number",
  mockEstimatedAmount: "number",
  mockQuantityPlaceholder: "number",
  status: "mock_only | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_REBALANCE_DELTA_MODEL = Object.freeze({
  deltaId: "string",
  sourceStep: "step140",
  symbol: "placeholder_symbol",
  targetWeight: "number",
  currentWeight: "number",
  weightGap: "number",
  direction: "overweight | underweight | aligned",
  mockAction: "mock_buy | mock_sell | mock_hold",
  mockAmountDelta: "number",
  cashImpactPlaceholder: "number",
  redacted: true,
});

export const TRADING_LAB_MOCK_TARGET_ALLOCATION_GAP_MODEL = Object.freeze({
  gapSummaryId: "string",
  sourceStep: "step140",
  status: "blocked | validation_required | mock_only",
  totalAbsoluteGap: "number",
  maxAbsoluteGap: "number",
  gapCount: "number",
  redacted: true,
});

export const TRADING_LAB_MOCK_BUY_SELL_SIGNAL_PLACEHOLDER_MODEL = Object.freeze({
  signalId: "string",
  sourceStep: "step140",
  symbol: "placeholder_symbol",
  side: "mock_buy | mock_sell | mock_hold",
  reason: "rebalance_gap | risk_limit | cash_reserve | no_action",
  status: "mock_only | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_ORDER_GENERATION_RISK_GUARD_PREFLIGHT_MODEL = Object.freeze({
  riskGuardId: "string",
  sourceStep: "step140",
  status: "blocked | validation_required | mock_only",
  maxPositionWeightStatus: "mock_only | validation_required | blocked",
  maxOrderAmountStatus: "mock_only | validation_required | blocked",
  maxDailyLossStatus: "mock_only | validation_required | blocked",
  cashReserveStatus: "mock_only | validation_required | blocked",
  killSwitchRequired: true,
  riskGateRequired: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  mockOrderGenerationPreflightId: "string",
  sourceStep: "step140",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  status: "blocked | validation_required | mock_order_generation_candidate | not_ready",
  scope: "mock_only",
  redacted: true,
  intentCount: "number",
  blockedIntentCount: "number",
  warningIntentCount: "number",
  allocationGapStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_order_generation_review",
});

export const TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_MODEL = Object.freeze({
  mockOrderGenerationReviewResultId: "string",
  sourceStep: "step141",
  mockOrderGenerationPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_order_generation_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step141",
  mockOrderGenerationReviewResultId: "string",
  mockOrderGenerationPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_order_generation_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  nextAllowedStep: "mock_execution_preflight",
});

export const TRADING_LAB_MOCK_ORDER_INTENT_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step141",
  status: "mock_only | blocked | validation_required",
  intentCount: "number",
  rows: "redacted_mock_order_intent_review_summary[]",
  actualOrderCandidateCreated: false,
  actualOrderDraftCreated: false,
  kisOrderPayloadCreated: false,
});

export const TRADING_LAB_MOCK_ORDER_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step141",
  decision: "mock_order_generation_review_recorded | blocked | rejected",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_MODEL = Object.freeze({
  mockExecutionPreflightId: "string",
  sourceStep: "step142",
  mockOrderGenerationReviewResultId: "string",
  mockOrderGenerationPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  mode: "mock | dry_run | shadow",
  scope: "mock_only",
  status: "blocked | validation_required | mock_execution_candidate | not_ready",
  executionIntentStatus: "blocked | validation_required | mock_only",
  fillPlanStatus: "blocked | validation_required | mock_only",
  cashImpactStatus: "blocked | validation_required | mock_only",
  positionImpactStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  priceSeriesStatus: "available | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_INTENT_MODEL = Object.freeze({
  mockExecutionIntentId: "string",
  sourceStep: "step142",
  mockOrderIntentId: "string",
  symbol: "placeholder_symbol",
  side: "mock_buy | mock_sell | mock_hold",
  mockQuantityPlaceholder: "number",
  mockExecutionPricePlaceholder: "number",
  mockEstimatedAmount: "number",
  mockFeePlaceholder: "number",
  mockSlippagePlaceholder: "number",
  status: "mock_only | blocked | validation_required",
  reason: "mock_rebalance | risk_guard | cash_reserve | no_action",
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_PLAN_PLACEHOLDER_MODEL = Object.freeze({
  mockFillPlanId: "string",
  sourceStep: "step142",
  mockExecutionIntentId: "string",
  symbol: "placeholder_symbol",
  side: "mock_buy | mock_sell | mock_hold",
  fillPolicy: "mock_close_price | mock_vwap_placeholder | mock_mid_price_placeholder",
  fillTiming: "mock_same_day | mock_next_open_placeholder",
  expectedFillStatus: "mock_fill_candidate | blocked | validation_required",
  mockPriceSource: "static_mock_series",
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_PREVIEW_MODEL = Object.freeze({
  previewId: "string",
  sourceStep: "step142",
  startingCashPlaceholder: "number",
  estimatedCashUsed: "number",
  estimatedCashReleased: "number",
  estimatedFee: "number",
  endingCashPlaceholder: "number",
  cashReserveStatus: "mock_only | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_PREVIEW_MODEL = Object.freeze({
  previewId: "string",
  sourceStep: "step142",
  rows: "redacted_mock_position_impact_preview[]",
  status: "mock_only | blocked | validation_required",
  actualBalanceQueried: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_RISK_GUARD_PREFLIGHT_MODEL = Object.freeze({
  riskGuardId: "string",
  sourceStep: "step142",
  status: "blocked | validation_required | mock_only",
  maxPositionWeightStatus: "mock_only | validation_required | blocked",
  maxOrderAmountStatus: "mock_only | validation_required | blocked",
  maxDailyLossStatus: "mock_only | validation_required | blocked",
  cashReserveStatus: "mock_only | validation_required | blocked",
  killSwitchRequired: true,
  riskGateRequired: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  mockExecutionPreflightId: "string",
  sourceStep: "step142",
  mockOrderGenerationReviewResultId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  status: "blocked | validation_required | mock_execution_candidate | not_ready",
  scope: "mock_only",
  redacted: true,
  executionIntentCount: "number",
  blockedExecutionIntentCount: "number",
  warningExecutionIntentCount: "number",
  fillPlanStatus: "blocked | validation_required | mock_only",
  cashImpactStatus: "blocked | validation_required | mock_only",
  positionImpactStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_execution_review",
});

export const TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_MODEL = Object.freeze({
  mockExecutionReviewResultId: "string",
  sourceStep: "step143",
  mockExecutionPreflightId: "string",
  mockOrderGenerationReviewResultId: "string",
  mockOrderGenerationPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_execution_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  executionIntentCount: "number",
  blockedExecutionIntentCount: "number",
  warningExecutionIntentCount: "number",
  fillPlanStatus: "blocked | validation_required | mock_only",
  cashImpactStatus: "blocked | validation_required | mock_only",
  positionImpactStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_EXECUTION_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step143",
  mockExecutionReviewResultId: "string",
  mockExecutionPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_execution_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  executionIntentCount: "number",
  blockedExecutionIntentCount: "number",
  warningExecutionIntentCount: "number",
  blockerCount: "number",
  warningCount: "number",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_fill_simulation_preflight",
});

export const TRADING_LAB_MOCK_EXECUTION_INTENT_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step143",
  status: "mock_only | blocked | validation_required",
  executionIntentCount: "number",
  rows: "redacted_mock_execution_intent_review_summary[]",
  actualExecutionCreated: false,
  kisExecutionPayloadCreated: false,
});

export const TRADING_LAB_MOCK_FILL_PLAN_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step143",
  status: "mock_only | blocked | validation_required",
  fillPlanCount: "number",
  rows: "redacted_mock_fill_plan_review_summary[]",
  providerQuoteQueried: false,
  kisExecutionPayloadCreated: false,
});

export const TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step143",
  status: "mock_only | blocked | validation_required",
  actualBalanceQueried: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step143",
  status: "mock_only | blocked | validation_required",
  rowCount: "number",
  actualBalanceQueried: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_EXECUTION_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step143",
  decision: "mock_execution_review_recorded | blocked | rejected",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_MODEL = Object.freeze({
  mockFillSimulationPreflightId: "string",
  sourceStep: "step144",
  mockExecutionReviewResultId: "string",
  mockExecutionPreflightId: "string",
  mockOrderGenerationReviewResultId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  mode: "mock | dry-run | shadow",
  scope: "mock_only",
  status: "blocked | validation_required | mock_fill_simulation_candidate | not_ready",
  fillPolicyStatus: "blocked | validation_required | mock_only",
  fillPriceSourceStatus: "blocked | validation_required | mock_only",
  slippageStatus: "blocked | validation_required | mock_only",
  feeStatus: "blocked | validation_required | mock_only",
  cashImpactStatus: "blocked | validation_required | mock_only",
  positionImpactStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_CANDIDATE_MODEL = Object.freeze({
  mockFillSimulationCandidateId: "string",
  sourceStep: "step144",
  mockExecutionIntentId: "string",
  symbol: "placeholder_symbol",
  side: "mock_buy | mock_sell | mock_hold",
  mockQuantityPlaceholder: "number",
  fillPolicy: "mock_close_price | mock_vwap_placeholder | mock_mid_price_placeholder",
  fillTiming: "mock_same_day | mock_next_open_placeholder",
  mockPriceSource: "static_mock_series",
  mockFillPricePlaceholder: "number",
  mockSlippagePlaceholder: "number",
  mockFeePlaceholder: "number",
  mockGrossAmount: "number",
  mockNetAmount: "number",
  status: "mock_only | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_POLICY_MODEL = Object.freeze({
  policyId: "string",
  sourceStep: "step144",
  allowedFillPolicies: "mock_close_price | mock_vwap_placeholder | mock_mid_price_placeholder",
  allowedFillTimings: "mock_same_day | mock_next_open_placeholder",
  allowedPriceSource: "static_mock_series",
  providerQuoteAllowed: false,
  kisQuoteQueryAllowed: false,
  kisExecutionPayloadAllowed: false,
  actualFillPriceLookupAllowed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_SLIPPAGE_FEE_PREVIEW_MODEL = Object.freeze({
  previewId: "string",
  sourceStep: "step144",
  mockFillPricePlaceholder: "number",
  mockSlippageRate: "number",
  mockSlippageAmount: "number",
  mockFeeRate: "number",
  mockFeeAmount: "number",
  mockGrossAmount: "number",
  mockNetAmount: "number",
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_CASH_IMPACT_VALIDATION_MODEL = Object.freeze({
  validationId: "string",
  sourceStep: "step144",
  startingCashPlaceholder: "number",
  mockGrossAmount: "number",
  mockFeeAmount: "number",
  mockNetCashImpact: "number",
  projectedCashPlaceholder: "number",
  cashReserveStatus: "mock_only | blocked | validation_required",
  actualBalanceQueried: false,
  dbWriteUsed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_POSITION_IMPACT_VALIDATION_MODEL = Object.freeze({
  validationId: "string",
  sourceStep: "step144",
  rows: "redacted_mock_fill_position_impact_validation[]",
  status: "mock_only | blocked | validation_required",
  actualBalanceQueried: false,
  actualFillRecordCreated: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  mockFillSimulationPreflightId: "string",
  sourceStep: "step144",
  mockExecutionReviewResultId: "string",
  mockExecutionPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  status: "blocked | validation_required | mock_fill_simulation_candidate | not_ready",
  scope: "mock_only",
  redacted: true,
  fillCandidateCount: "number",
  blockedFillCandidateCount: "number",
  warningFillCandidateCount: "number",
  fillPolicyStatus: "blocked | validation_required | mock_only",
  fillPriceSourceStatus: "blocked | validation_required | mock_only",
  slippageStatus: "blocked | validation_required | mock_only",
  feeStatus: "blocked | validation_required | mock_only",
  cashImpactStatus: "blocked | validation_required | mock_only",
  positionImpactStatus: "blocked | validation_required | mock_only",
  riskGuardStatus: "blocked | validation_required | mock_only",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_fill_simulation_review",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_MODEL = Object.freeze({
  fillSimulationReviewResultId: "string",
  sourceStep: "step145",
  fillSimulationPreflightId: "string",
  fillSimulationCandidateId: "string",
  mockExecutionReviewResultId: "string",
  mockOrderGenerationReviewResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_fill_review_recorded | blocked | rejected",
  reviewedAt: "placeholder_recorded_at",
  reviewedBy: "admin_placeholder",
  summary: "string",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step145",
  fillSimulationReviewResultId: "string",
  fillSimulationPreflightId: "string",
  fillSimulationCandidateId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_fill_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder_recorded_at",
  blockerCount: "number",
  warningCount: "number",
  slippageReviewStatus: "mock_only | blocked | validation_required",
  feeReviewStatus: "mock_only | blocked | validation_required",
  cashImpactReviewStatus: "mock_only | blocked | validation_required",
  positionImpactReviewStatus: "mock_only | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_fill_simulation_core_preflight | mock_portfolio_ledger_preflight",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step145",
  decision: "mock_fill_review_recorded | blocked | rejected",
  blockers: "string[]",
  warnings: "string[]",
  messages: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_IMPACT_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step145",
  slippageReviewStatus: "mock_only | blocked | validation_required",
  feeReviewStatus: "mock_only | blocked | validation_required",
  cashImpactReviewStatus: "mock_only | blocked | validation_required",
  positionImpactReviewStatus: "mock_only | blocked | validation_required",
  redacted: true,
  actualFillPriceLookupAttempted: false,
  actualFeeScheduleQueried: false,
  accountBalanceQueried: false,
  actualPositionQueried: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_MODEL = Object.freeze({
  mockFillSimulationCorePreflightId: "string",
  sourceStep: "step146",
  fillSimulationReviewResultId: "string",
  fillSimulationPreflightId: "string",
  fillSimulationCandidateId: "string",
  mockExecutionReviewResultId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  mode: "mock | dry-run | shadow",
  scope: "mock_only",
  status: "blocked | validation_required | mock_fill_core_ready | not_ready",
  inputBundleStatus: "mock_only | blocked | validation_required",
  fillScenarioStatus: "mock_only | blocked | validation_required",
  pricingPolicyStatus: "mock_only | blocked | validation_required",
  slippagePolicyStatus: "mock_only | blocked | validation_required",
  feePolicyStatus: "mock_only | blocked | validation_required",
  cashAvailabilityStatus: "mock_only | blocked | validation_required",
  positionImpactStatus: "mock_only | blocked | validation_required",
  deterministicCalculationStatus: "mock_only | blocked | validation_required",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_CORE_INPUT_BUNDLE_MODEL = Object.freeze({
  inputBundleId: "string",
  sourceStep: "step146",
  scope: "mock_only",
  mode: "mock | dry-run | shadow",
  candidateCount: "number",
  priceSource: "static_mock_series",
  cashPlaceholderStatus: "mock_only | blocked | validation_required",
  positionDependencyStatus: "mock_only | blocked | validation_required",
  redacted: true,
  providerPayloadStored: false,
  orderPayloadStored: false,
  rawProviderResponseStored: false,
});

export const TRADING_LAB_MOCK_FILL_SCENARIO_MODEL = Object.freeze({
  scenarioId: "string",
  sourceStep: "step146",
  scope: "mock_only",
  scenarioType: "mock_fill_core_preflight",
  fillCandidateCount: "number",
  fillPolicy: "mock_close_price | mock_vwap_placeholder | mock_mid_price_placeholder",
  fillTiming: "mock_same_day | mock_next_open_placeholder",
  priceSource: "static_mock_series",
  redacted: true,
  actualFillRecordCreated: false,
  actualExecutionCreated: false,
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  mockFillSimulationCorePreflightId: "string",
  sourceStep: "step146",
  fillSimulationReviewResultId: "string",
  fillSimulationPreflightId: "string",
  mockRunCandidateId: "string",
  inputBundleId: "string",
  strategyDraftId: "string",
  status: "blocked | validation_required | mock_fill_core_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  inputBundleStatus: "mock_only | blocked | validation_required",
  fillScenarioStatus: "mock_only | blocked | validation_required",
  pricingPolicyStatus: "mock_only | blocked | validation_required",
  slippagePolicyStatus: "mock_only | blocked | validation_required",
  feePolicyStatus: "mock_only | blocked | validation_required",
  cashAvailabilityStatus: "mock_only | blocked | validation_required",
  positionImpactStatus: "mock_only | blocked | validation_required",
  deterministicCalculationStatus: "mock_only | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_fill_simulation_core",
});

export const TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_MODEL = Object.freeze({
  fillCoreReviewResultId: "string",
  sourceStep: "step147",
  fillCorePreflightId: "string",
  fillCoreInputBundleId: "string",
  fillSimulationReviewResultId: "string",
  fillSimulationCandidateId: "string",
  mockExecutionReviewResultId: "string",
  mockOrderGenerationReviewResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_fill_core_review_recorded | blocked | rejected",
  reviewedAt: "placeholder_recorded_at",
  reviewedBy: "admin_placeholder",
  summary: "string",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_CORE_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step147",
  fillCoreReviewResultId: "string",
  fillCorePreflightId: "string",
  fillCoreInputBundleId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_fill_core_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder_recorded_at",
  blockerCount: "number",
  warningCount: "number",
  pricingPolicyReviewStatus: "mock_only | blocked | validation_required",
  slippagePolicyReviewStatus: "mock_only | blocked | validation_required",
  feePolicyReviewStatus: "mock_only | blocked | validation_required",
  cashAvailabilityReviewStatus: "mock_only | blocked | validation_required",
  positionImpactReviewStatus: "mock_only | blocked | validation_required",
  deterministicCalculationReviewStatus: "mock_only | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_fill_simulation_core",
});

export const TRADING_LAB_MOCK_FILL_CORE_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step147",
  decision: "mock_fill_core_review_recorded | blocked | rejected",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  blockers: "string[]",
  warnings: "string[]",
  messages: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_CORE_POLICY_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step147",
  dependencyReviewStatus: "mock_only | blocked | validation_required",
  pricingPolicyReviewStatus: "mock_only | blocked | validation_required",
  slippagePolicyReviewStatus: "mock_only | blocked | validation_required",
  feePolicyReviewStatus: "mock_only | blocked | validation_required",
  cashAvailabilityReviewStatus: "mock_only | blocked | validation_required",
  positionImpactReviewStatus: "mock_only | blocked | validation_required",
  deterministicCalculationReviewStatus: "mock_only | blocked | validation_required",
  redacted: true,
  actualFillPriceLookupAttempted: false,
  actualFeeScheduleQueried: false,
  accountBalanceQueried: false,
  actualCashUpdated: false,
  actualPositionUpdated: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
});

export const TRADING_LAB_MOCK_FILL_RESULT_MODEL = Object.freeze({
  mockFillResultId: "string",
  sourceStep: "step148",
  fillCoreReviewResultId: "string",
  fillCorePreflightId: "string",
  fillCoreInputBundleId: "string",
  fillSimulationCandidateId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  fillMode: "full_fill | partial_fill_placeholder | rejected_placeholder",
  fillStatus: "mock_filled | mock_partial | mock_rejected | blocked | validation_required",
  symbol: "string",
  side: "mock_buy | mock_sell | mock_hold",
  requestedQuantity: "number",
  filledQuantity: "number",
  mockFillPrice: "number",
  mockSlippage: "number",
  mockFee: "number",
  grossAmount: "number",
  netAmount: "number",
  cashDelta: "number",
  positionDelta: "number",
  calculationStatus: "deterministic_mock_only | blocked | validation_required",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_FILL_CALCULATION_INPUT_MODEL = Object.freeze({
  calculationInputId: "string",
  sourceStep: "step148",
  fillCoreInputBundleId: "string",
  mockExecutionPlanId: "placeholder_only",
  mockOrderId: "placeholder_only",
  symbol: "string",
  side: "mock_buy | mock_sell | mock_hold",
  requestedQuantity: "number",
  mockReferencePrice: "number",
  mockLimitPrice: "number",
  mockSlippageRate: "number",
  mockFeeRate: "number",
  cashBeforePlaceholder: "number",
  positionBeforePlaceholder: "number",
  fillMode: "full_fill | partial_fill_placeholder | rejected_placeholder",
  scope: "mock_only",
  redacted: true,
});

export const TRADING_LAB_MOCK_FILL_RESULT_SCHEMA = Object.freeze({
  mockFillResultId: "string",
  calculationInputId: "string",
  fillCoreReviewResultId: "string",
  fillStatus: "mock_filled | mock_partial | mock_rejected | blocked | validation_required",
  scope: "mock_only",
  redacted: true,
  symbol: "placeholder",
  side: "placeholder",
  requestedQuantity: "number",
  filledQuantity: "number",
  mockFillPrice: "number",
  mockSlippage: "number",
  mockFee: "number",
  grossAmount: "number",
  netAmount: "number",
  cashDelta: "number",
  positionDelta: "number",
  calculationStatus: "deterministic_mock_only | blocked | validation_required",
  deterministic: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_ledger_update_preflight",
});

export const TRADING_LAB_DAILY_RETURN_SERIES_SCHEMA = Object.freeze({
  seriesId: "string",
  seriesType: "mock_daily_return_series",
  sourceStep: "step131",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_CUMULATIVE_PERFORMANCE_SCHEMA = Object.freeze({
  performanceId: "string",
  performanceType: "mock_cumulative_performance",
  sourceStep: "step131",
  dataSource: "static_placeholder_only",
  rawProviderResponse: false,
});

export const TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA = Object.freeze({
  cardId: "string",
  cardType: "mock_kpi_summary_card",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_daily_equity_line",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_RETURN_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_return_bar_series",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA = Object.freeze({
  visualizationId: "string",
  visualizationType: "mock_allocation_table_bars",
  sourceStep: "step132",
  dataSource: "static_placeholder_only",
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_MOCK_LEDGER_SCHEMA = Object.freeze({
  ledgerId: "string",
  ledgerType: "admin_only_mock_trading_ledger",
  sourceStep: "step133",
  mode: "mock | dry_run | shadow",
  strategyId: "string",
  events: "mock_trade_event[]",
  positions: "mock_position_calculation[]",
  cash: "number",
  equitySeries: "mock_daily_equity_calculation[]",
  status: "mock_calculated_fail_closed",
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_MOCK_TRADE_EVENT_SCHEMA = Object.freeze({
  eventId: "string",
  eventType: "admin_only_mock_trade_event",
  sourceStep: "step133",
  side: "buy | sell | hold",
  source: "mock_ledger",
  status: "mock_calculation_only",
  credential: false,
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_POSITION_SNAPSHOT_SCHEMA = Object.freeze({
  snapshotId: "string",
  snapshotType: "mock_position_snapshot",
  sourceStep: "step131",
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_ORDER_CANDIDATE_SUMMARY_SCHEMA = Object.freeze({
  summaryId: "string",
  summaryType: "mock_order_candidate_summary",
  sourceStep: "step131",
  orderSubmissionAllowed: false,
  providerPayload: false,
  orderPayload: false,
});

export const TRADING_LAB_AUDIT_LOG_SUMMARY_SCHEMA = Object.freeze({
  summaryId: "string",
  summaryType: "mock_audit_log_summary",
  sourceStep: "step131",
  storageMode: "static_in_memory_placeholder_only",
  rawProviderResponse: false,
});

function makeLabRedaction(overrides = {}) {
  return {
    schema: "step131_admin_trading_lab_dashboard_shell_v1",
    metadataOnly: true,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    containsPrivatePath: false,
    containsRawReceipt: false,
    containsHashValue: false,
    containsDigestValue: false,
    containsRawProviderResponse: false,
    containsRawEnvValue: false,
    ...overrides,
  };
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function roundPct(value) {
  return Math.round((toFiniteNumber(value) + Number.EPSILON) * 10_000) / 10_000;
}

function safeRatio(numerator, denominator) {
  const safeDenominator = toFiniteNumber(denominator);
  if (safeDenominator === 0) return 0;
  return toFiniteNumber(numerator) / safeDenominator;
}

function normalizeStrategyDraftMode(mode) {
  const normalized = String(mode || "mock").toLowerCase();
  return ["mock", "dry_run", "shadow"].includes(normalized) ? normalized : "blocked";
}

function normalizePlaceholderSymbols(symbols = []) {
  const input = Array.isArray(symbols) ? symbols : String(symbols || "").split(",");
  const normalized = input
    .map((symbol) => String(symbol || "").trim().toUpperCase())
    .filter(Boolean)
    .filter((symbol) => symbol !== "*" && symbol !== "ALL" && symbol !== "ALL_SYMBOLS");
  const unique = [...new Set(normalized)];
  return unique.length > 0
    ? unique
    : ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"];
}

function normalizeTargetWeightDrafts(targetWeights = [], allowedSymbols = []) {
  const bySymbol = new Map(
    (Array.isArray(targetWeights) ? targetWeights : []).map((target) => [
      String(target?.symbol || "").trim().toUpperCase(),
      Math.max(0, toFiniteNumber(target?.weightPct)),
    ]),
  );
  return allowedSymbols.map((symbol, index) => ({
    targetWeightDraftId: `step134_target_weight_${index + 1}`,
    symbol,
    weightPct: roundPct(bySymbol.has(symbol) ? bySymbol.get(symbol) : 0),
    status: "mock_only",
    providerPayloadStored: false,
    orderPayloadStored: false,
  }));
}

function normalizeRiskLimitDraft(riskLimits = {}) {
  return {
    riskLimitDraftId: "step134_risk_limit_draft",
    maxOrderAmount: Math.max(0, toFiniteNumber(riskLimits.maxOrderAmount, 0)),
    maxDailyLossPct: Math.max(0, toFiniteNumber(riskLimits.maxDailyLossPct, 0)),
    maxPositionWeightPct: Math.max(0, toFiniteNumber(riskLimits.maxPositionWeightPct, 0)),
    killSwitchRequired: true,
    riskGateRequired: true,
    status: "blocked_by_default",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function normalizeRebalanceRuleDraft(rebalanceRule = {}) {
  const interval = String(rebalanceRule.interval || "manual_review").toLowerCase();
  const safeInterval = ["manual_review", "weekly_mock", "monthly_mock"].includes(interval) ? interval : "manual_review";
  return {
    rebalanceRuleDraftId: "step134_rebalance_rule_draft",
    interval: safeInterval,
    thresholdPct: Math.max(0, toFiniteNumber(rebalanceRule.thresholdPct, 5)),
    status: "mock_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

function buildMockEventsFromStrategyDraft(strategyDraft = {}, options = {}) {
  const priceSeries = getMockPriceSeries(options);
  const firstDate = getPriceDates(priceSeries)[0] || "2026-07-01";
  const firstPrices = priceSeries[firstDate] || {};
  const initialCash = roundMoney(options.initialCash ?? 100000);
  const deployableCash = roundMoney(initialCash * 0.75);

  return (strategyDraft.targetWeights || [])
    .filter((target) => toFiniteNumber(target.weightPct) > 0)
    .map((target, index) => {
      const mockPrice = Math.max(1, toFiniteNumber(firstPrices[target.symbol], 1000));
      const allocationAmount = roundMoney(deployableCash * safeRatio(target.weightPct, 100));
      return normalizeMockTradeEvent(
        {
          eventId: `step134_mock_recalculation_event_${index + 1}`,
          date: firstDate,
          symbol: target.symbol,
          side: "buy",
          quantity: roundQuantity(allocationAmount / mockPrice),
          mockPrice,
          fee: 0,
          mode: strategyDraft.mode || "mock",
        },
        index,
      );
    });
}

function makeTargetWeightMap(targetWeights = []) {
  return new Map((Array.isArray(targetWeights) ? targetWeights : []).map((target) => [
    String(target?.symbol || "").trim().toUpperCase(),
    toFiniteNumber(target?.weightPct),
  ]));
}

function makeStrategyDraftBaseline(options = {}) {
  return buildTradingLabStrategyConfigDraft(
    {
      strategyDraftId: "step135_admin_trading_lab_strategy_baseline",
      strategyName: "Admin mock strategy baseline",
      mode: "mock",
      allowedSymbols: ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"],
      targetWeights: [
        { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 45 },
        { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 30 },
        { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
      ],
      rebalanceRule: { interval: "manual_review", thresholdPct: 5 },
      riskLimits: { maxOrderAmount: 1000, maxDailyLossPct: 2, maxPositionWeightPct: 50 },
    },
    options,
  );
}

function buildStrategyDiffRows(baseDraft = {}, draft = {}) {
  const rows = [];
  const baseWeights = makeTargetWeightMap(baseDraft.targetWeights);
  const draftWeights = makeTargetWeightMap(draft.targetWeights);
  const symbols = [...new Set([...baseWeights.keys(), ...draftWeights.keys()])].sort();

  for (const symbol of symbols) {
    const beforeValue = roundPct(baseWeights.get(symbol) || 0);
    const afterValue = roundPct(draftWeights.get(symbol) || 0);
    const delta = roundPct(afterValue - beforeValue);
    if (delta !== 0) {
      rows.push({
        field: "target_weight",
        symbol,
        beforeValue,
        afterValue,
        deltaPctPoint: delta,
        summary: `${symbol} weight ${delta > 0 ? "+" : ""}${delta.toFixed(2)}pp`,
        status: "mock_only",
      });
    }
  }

  const compareField = (field, beforeValue, afterValue) => {
    if (String(beforeValue) !== String(afterValue)) {
      rows.push({
        field,
        beforeValue,
        afterValue,
        summary: `${field} changed from ${beforeValue} to ${afterValue}`,
        status: "mock_only",
      });
    }
  };

  compareField("mode", baseDraft.mode || "mock", draft.mode || "mock");
  compareField("rebalance_rule", baseDraft.rebalanceRule?.interval || "manual_review", draft.rebalanceRule?.interval || "manual_review");
  compareField("max_order_amount", baseDraft.riskLimits?.maxOrderAmount || 0, draft.riskLimits?.maxOrderAmount || 0);
  compareField("max_daily_loss_pct", baseDraft.riskLimits?.maxDailyLossPct || 0, draft.riskLimits?.maxDailyLossPct || 0);
  compareField("max_position_weight_pct", baseDraft.riskLimits?.maxPositionWeightPct || 0, draft.riskLimits?.maxPositionWeightPct || 0);

  return rows.length > 0
    ? rows
    : [{ field: "no_change", summary: "strategy draft has no mock comparison changes", status: "mock_only" }];
}

function containsUnsafeReviewResultInput(value, seen = new Set()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  const unsafeKeyPattern = /credential|accountIdentifier|accountNumber|providerPayload|orderPayload|rawProviderResponse|privatePath|hashValue|digestValue|token|appKey|appSecret/i;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (unsafeKeyPattern.test(key)) return true;
    if (typeof nestedValue === "string" && /APP_KEY|APP_SECRET|accountNumber|access_token/i.test(nestedValue)) return true;
    return containsUnsafeReviewResultInput(nestedValue, seen);
  });
}

function summarizeReviewBlockers(blockers = []) {
  const fallbackMessages = {
    wildcard_all_symbols_rejected: "All-symbol strategy configuration remains blocked.",
    live_or_order_submission_mode_rejected: "Live/order mode is not allowed.",
    unsupported_or_live_strategy_mode: "Unsupported strategy mode remains blocked.",
    target_weight_residual_review_required: "Target weight total requires manual review.",
    unsafe_private_or_payload_value_rejected: "Private or payload-shaped review input was rejected.",
    max_order_amount_placeholder_only: "Mock max order amount still requires review.",
    max_daily_loss_placeholder_only: "Mock daily loss limit still requires review.",
    max_position_weight_placeholder_only: "Mock position weight limit still requires review.",
  };

  return blockers.map((blocker) => fallbackMessages[blocker] || String(blocker || "review blocker"));
}

function classifyChangeType(field) {
  if (field === "target_weight") return "target_weight";
  if (field === "mode") return "mode";
  if (field === "rebalance_rule") return "rebalance_rule";
  if (field.includes("risk") || field.includes("loss") || field.includes("position") || field.includes("amount")) return "risk_limit";
  return "allowed_symbols";
}

function normalizeMockTradeEvent(event = {}, index = 0) {
  const side = String(event.side || "hold").toLowerCase();
  const quantity = Math.max(0, toFiniteNumber(event.quantity));
  const mockPrice = Math.max(0, toFiniteNumber(event.mockPrice));
  const fee = Math.max(0, toFiniteNumber(event.fee));
  const mockAmount = roundMoney(quantity * mockPrice + (side === "buy" ? fee : -fee));

  return {
    eventId: event.eventId || `step133_mock_trade_event_${index + 1}`,
    eventType: "admin_only_mock_trade_event",
    date: event.date || "2026-07-01",
    symbol: event.symbol || "SYMBOL_A_PLACEHOLDER",
    side: ["buy", "sell", "hold"].includes(side) ? side : "hold",
    quantity,
    mockPrice,
    mockAmount,
    fee,
    mode: event.mode || "mock",
    source: "mock_ledger",
    status: "mock_calculation_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_trade_event_v1" }),
  };
}

function getMockPriceSeries(options = {}) {
  return options.priceSeries || {
    "2026-07-01": {
      SYMBOL_A_PLACEHOLDER: 1008,
      SYMBOL_B_PLACEHOLDER: 1492,
      SYMBOL_C_PLACEHOLDER: 900,
    },
    "2026-07-02": {
      SYMBOL_A_PLACEHOLDER: 1012,
      SYMBOL_B_PLACEHOLDER: 1488,
      SYMBOL_C_PLACEHOLDER: 902,
    },
    "2026-07-03": {
      SYMBOL_A_PLACEHOLDER: 1015,
      SYMBOL_B_PLACEHOLDER: 1505,
      SYMBOL_C_PLACEHOLDER: 904,
    },
  };
}

function getPriceDates(priceSeries = {}) {
  return Object.keys(priceSeries).sort((left, right) => left.localeCompare(right));
}

function applyMockEventToState(state, event) {
  if (!["buy", "sell"].includes(event.side) || event.quantity <= 0 || event.mockPrice <= 0) return state;
  const current = state.positions.get(event.symbol) || {
    symbol: event.symbol,
    quantity: 0,
    averagePrice: 0,
    realizedPnl: 0,
  };

  if (event.side === "buy") {
    const totalCost = roundMoney(event.quantity * event.mockPrice + event.fee);
    const nextQuantity = roundQuantity(current.quantity + event.quantity);
    const nextCostBasis = roundMoney(current.quantity * current.averagePrice + totalCost);
    state.cash = roundMoney(state.cash - totalCost);
    state.positions.set(event.symbol, {
      ...current,
      quantity: nextQuantity,
      averagePrice: nextQuantity > 0 ? roundMoney(nextCostBasis / nextQuantity) : 0,
    });
    return state;
  }

  const sellQuantity = Math.min(current.quantity, event.quantity);
  if (sellQuantity <= 0) return state;
  const proceeds = roundMoney(sellQuantity * event.mockPrice - event.fee);
  const realizedPnl = roundMoney(proceeds - sellQuantity * current.averagePrice);
  const nextQuantity = roundQuantity(current.quantity - sellQuantity);
  state.cash = roundMoney(state.cash + proceeds);
  if (nextQuantity === 0) {
    state.positions.delete(event.symbol);
  } else {
    state.positions.set(event.symbol, {
      ...current,
      quantity: nextQuantity,
      realizedPnl: roundMoney(current.realizedPnl + realizedPnl),
    });
  }
  return state;
}

function buildPositionRows(state, priceMap = {}) {
  const totalMarketValue = [...state.positions.values()].reduce((sum, position) => {
    const currentPrice = Math.max(0, toFiniteNumber(priceMap[position.symbol] || position.averagePrice));
    return roundMoney(sum + position.quantity * currentPrice);
  }, 0);
  const totalEquity = roundMoney(state.cash + totalMarketValue);

  return [...state.positions.values()]
    .sort((left, right) => left.symbol.localeCompare(right.symbol))
    .map((position) => {
      const mockCurrentPrice = Math.max(0, toFiniteNumber(priceMap[position.symbol] || position.averagePrice));
      const marketValue = roundMoney(position.quantity * mockCurrentPrice);
      const unrealizedPnl = roundMoney(marketValue - position.quantity * position.averagePrice);
      return {
        symbol: position.symbol,
        name: `${position.symbol} mock position`,
        quantity: roundQuantity(position.quantity),
        averagePrice: roundMoney(position.averagePrice),
        mockCurrentPrice,
        marketValue,
        unrealizedPnl,
        realizedPnl: roundMoney(position.realizedPnl || 0),
        weightPct: roundPct(safeRatio(marketValue, totalEquity) * 100),
        status: "mock_calculated",
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
      };
    });
}

function calculateDailyEquityRows(inputLedger = {}, options = {}) {
  const events = Array.isArray(inputLedger.events)
    ? inputLedger.events.map(normalizeMockTradeEvent)
    : buildTradingLabMockTradeEvents(options).events;
  const priceSeries = getMockPriceSeries(options);
  const dates = getPriceDates(priceSeries);
  const initialCash = roundMoney(inputLedger.initialCash ?? options.initialCash ?? 100000);
  const state = {
    cash: initialCash,
    positions: new Map(),
  };
  const sortedEvents = events.sort((left, right) => left.date.localeCompare(right.date) || left.eventId.localeCompare(right.eventId));
  let appliedEventIndex = 0;
  let previousEquity = initialCash;
  let peakEquity = initialCash;

  return dates.map((date, index) => {
    while (appliedEventIndex < sortedEvents.length && sortedEvents[appliedEventIndex].date <= date) {
      applyMockEventToState(state, sortedEvents[appliedEventIndex]);
      appliedEventIndex += 1;
    }
    const priceMap = priceSeries[date] || {};
    const positions = buildPositionRows(state, priceMap);
    const positionsMarketValue = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
    const equity = roundMoney(state.cash + positionsMarketValue);
    const dailyReturnPct = index === 0
      ? roundPct((safeRatio(equity, initialCash) - 1) * 100)
      : roundPct((safeRatio(equity, previousEquity) - 1) * 100);
    peakEquity = Math.max(peakEquity, equity);
    const row = {
      date,
      cash: roundMoney(state.cash),
      positionsMarketValue,
      equity,
      equityPlaceholder: equity,
      dailyReturnPct,
      cumulativeReturnPct: roundPct((safeRatio(equity, initialCash) - 1) * 100),
      drawdownPct: roundPct((safeRatio(equity, peakEquity) - 1) * 100),
      benchmarkReturnPct: 0,
      positionCount: positions.length,
      status: "mock_calculated",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
    };
    previousEquity = equity;
    return row;
  });
}

export function buildTradingLabMockTradeEvents(options = {}) {
  const events = options.events || [
    { eventId: "step133_mock_trade_event_1", date: "2026-07-01", symbol: "SYMBOL_A_PLACEHOLDER", side: "buy", quantity: 12, mockPrice: 1000, fee: 12, mode: "mock" },
    { eventId: "step133_mock_trade_event_2", date: "2026-07-01", symbol: "SYMBOL_B_PLACEHOLDER", side: "buy", quantity: 8, mockPrice: 1500, fee: 12, mode: "dry_run" },
    { eventId: "step133_mock_trade_event_3", date: "2026-07-02", symbol: "SYMBOL_A_PLACEHOLDER", side: "hold", quantity: 0, mockPrice: 1012, fee: 0, mode: "shadow" },
    { eventId: "step133_mock_trade_event_4", date: "2026-07-03", symbol: "SYMBOL_C_PLACEHOLDER", side: "buy", quantity: 5, mockPrice: 900, fee: 8, mode: "mock" },
  ];

  return {
    summaryId: options.summaryId || "step133_mock_trade_event_summary",
    summaryType: "admin_only_mock_trade_events",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_input",
    events: events.map(normalizeMockTradeEvent),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_trade_events_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabPositionLedger(ledger = {}, options = {}) {
  const events = Array.isArray(ledger.events)
    ? ledger.events.map(normalizeMockTradeEvent)
    : buildTradingLabMockTradeEvents(options).events;
  const priceSeries = getMockPriceSeries(options);
  const latestDate = getPriceDates(priceSeries).at(-1);
  const state = {
    cash: roundMoney(ledger.initialCash ?? options.initialCash ?? 100000),
    positions: new Map(),
  };

  for (const event of events.sort((left, right) => left.date.localeCompare(right.date) || left.eventId.localeCompare(right.eventId))) {
    applyMockEventToState(state, event);
  }

  const positions = buildPositionRows(state, priceSeries[latestDate] || {});
  const totalMarketValue = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
  return {
    calculationId: options.calculationId || "step133_mock_position_ledger_calculation",
    calculationType: "mock_position_ledger_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    asOfDate: latestDate,
    cash: roundMoney(state.cash),
    positions,
    totalMarketValue,
    totalEquity: roundMoney(state.cash + totalMarketValue),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_position_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabDailyEquitySeries(ledger = {}, options = {}) {
  const rows = calculateDailyEquityRows(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_daily_equity_calculation",
    seriesType: "mock_daily_equity_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows,
    finalCash: rows.at(-1)?.cash ?? roundMoney(ledger.initialCash ?? options.initialCash ?? 100000),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_equity_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabDailyReturnSeries(ledger = {}, options = {}) {
  const dailyEquity = options.dailyEquity || calculateTradingLabDailyEquitySeries(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_daily_return_calculation",
    seriesType: "mock_daily_return_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows: dailyEquity.rows.map((row) => ({
      date: row.date,
      dailyReturnPct: row.dailyReturnPct,
      cumulativeReturnPct: row.cumulativeReturnPct,
      drawdownPct: row.drawdownPct,
      equity: row.equity,
      equityPlaceholder: row.equity,
      benchmarkReturnPct: row.benchmarkReturnPct,
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_return_calculation_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabCumulativeReturnSeries(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  return {
    seriesId: options.seriesId || "step133_mock_cumulative_return_calculation",
    seriesType: "mock_cumulative_return_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    rows: dailyReturns.rows.map((row) => ({
      date: row.date,
      cumulativeReturnPct: row.cumulativeReturnPct,
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_cumulative_return_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabDrawdownSummary(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  const rows = dailyReturns.rows;
  const mddPct = rows.reduce((min, row) => Math.min(min, toFiniteNumber(row.drawdownPct)), 0);
  const trough = rows.find((row) => row.drawdownPct === mddPct) || rows.at(-1) || null;
  return {
    summaryId: options.summaryId || "step133_mock_drawdown_mdd_calculation",
    summaryType: "mock_drawdown_mdd_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    mddPct: roundPct(mddPct),
    troughDate: trough?.date || null,
    rows: rows.map((row) => ({ date: row.date, drawdownPct: row.drawdownPct })),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_drawdown_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function calculateTradingLabAllocationSummary(positionLedger = calculateTradingLabPositionLedger(), options = {}) {
  const positionWeightTotalPct = roundPct(positionLedger.positions.reduce((sum, position) => sum + toFiniteNumber(position.weightPct), 0));
  const residualCashWeightPct = roundPct(Math.max(0, 100 - positionWeightTotalPct));
  return {
    summaryId: options.summaryId || "step133_mock_allocation_calculation",
    summaryType: "mock_allocation_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    allocations: [
      ...positionLedger.positions.map((position) => ({
        symbol: position.symbol,
        name: position.name,
        marketValue: position.marketValue,
        weightPct: position.weightPct,
        unrealizedPnl: position.unrealizedPnl,
        status: "mock_calculated",
      })),
      ...(residualCashWeightPct > 0 ? [{
        symbol: "CASH_PLACEHOLDER",
        name: "Mock cash residual",
        marketValue: roundMoney(positionLedger.cash),
        weightPct: residualCashWeightPct,
        unrealizedPnl: 0,
        status: "mock_calculated_residual",
      }] : []),
    ],
    positionWeightTotalPct,
    residualCashWeightPct,
    totalWeightPct: roundPct(positionWeightTotalPct + residualCashWeightPct),
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_allocation_calculation_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function calculateTradingLabPerformanceSummary(ledger = {}, options = {}) {
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(ledger, options);
  const rows = dailyReturns.rows;
  const latest = rows.at(-1) || {};
  const gains = rows.filter((row) => row.dailyReturnPct > 0).map((row) => row.dailyReturnPct);
  const losses = rows.filter((row) => row.dailyReturnPct < 0).map((row) => Math.abs(row.dailyReturnPct));
  const averageReturn = safeRatio(rows.reduce((sum, row) => sum + toFiniteNumber(row.dailyReturnPct), 0), rows.length || 1);
  const variance = safeRatio(
    rows.reduce((sum, row) => sum + (toFiniteNumber(row.dailyReturnPct) - averageReturn) ** 2, 0),
    rows.length || 1,
  );
  const mddSummary = calculateTradingLabDrawdownSummary(ledger, { ...options, dailyReturns });
  const profitFactor = losses.length > 0
    ? roundPct(gains.reduce((sum, value) => sum + value, 0) / losses.reduce((sum, value) => sum + value, 0))
    : 0;

  return {
    performanceId: options.performanceId || "step133_mock_performance_summary_calculation",
    performanceType: "mock_performance_summary_calculation",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    status: "mock_calculated",
    totalReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    cumulativeReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    periodReturnPct: roundPct(latest.cumulativeReturnPct || 0),
    dailyReturnLatestPct: roundPct(latest.dailyReturnPct || 0),
    mddPct: mddSummary.mddPct,
    volatilityPct: roundPct(Math.sqrt(variance)),
    winRatePct: roundPct(safeRatio(gains.length, rows.length || 1) * 100),
    profitFactor,
    profitLossRatio: profitFactor,
    profitFactorStatus: "mock_calculated_placeholder",
    periodStart: rows[0]?.date || null,
    periodEnd: latest.date || null,
    benchmarkStatus: "mock_static_placeholder",
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_performance_calculation_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockLedger(options = {}) {
  const events = buildTradingLabMockTradeEvents(options).events;
  const ledger = {
    ledgerId: options.ledgerId || "step133_admin_only_mock_trading_ledger",
    ledgerType: "admin_only_mock_trading_ledger",
    sourceStep: "step133",
    mode: options.mode || "mock",
    strategyId: options.strategyId || "step131_admin_trading_lab_strategy_placeholder",
    createdAt: options.createdAt || "2026-07-03T00:00:00.000Z",
    initialCash: roundMoney(options.initialCash ?? 100000),
    events,
    status: "mock_calculated_fail_closed",
  };
  const positionLedger = calculateTradingLabPositionLedger(ledger, options);
  const dailyEquity = calculateTradingLabDailyEquitySeries(ledger, options);

  return {
    ...ledger,
    cash: dailyEquity.finalCash,
    positions: positionLedger.positions,
    equitySeries: dailyEquity.rows,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_mock_ledger_v1" }),
    flags: { ...STEP133_ADMIN_TRADING_LAB_MOCK_LEDGER_CALCULATION_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyConfigDraft(input = {}, options = {}) {
  const allowedSymbols = normalizePlaceholderSymbols(input.allowedSymbols || options.allowedSymbols);
  const mode = normalizeStrategyDraftMode(input.mode || options.mode);
  const targetWeights = normalizeTargetWeightDrafts(
    input.targetWeights || options.targetWeights || [
      { symbol: "SYMBOL_A_PLACEHOLDER", weightPct: 40 },
      { symbol: "SYMBOL_B_PLACEHOLDER", weightPct: 35 },
      { symbol: "SYMBOL_C_PLACEHOLDER", weightPct: 25 },
    ],
    allowedSymbols,
  );
  const targetWeightTotalPct = roundPct(targetWeights.reduce((sum, target) => sum + toFiniteNumber(target.weightPct), 0));
  const residualWeightPct = roundPct(100 - targetWeightTotalPct);
  const riskLimits = normalizeRiskLimitDraft(input.riskLimits || options.riskLimits);
  const rebalanceRule = normalizeRebalanceRuleDraft(input.rebalanceRule || options.rebalanceRule);
  const initialStatus = mode === "blocked" ? "blocked" : Math.abs(residualWeightPct) <= 0.01 ? "mock_only" : "validation_required";

  return {
    strategyDraftId: input.strategyDraftId || options.strategyDraftId || "step134_admin_trading_lab_strategy_draft",
    draftType: "admin_only_mock_strategy_config_draft",
    sourceStep: "step134",
    strategyName: input.strategyName || options.strategyName || "Admin mock strategy draft",
    mode,
    allowedModes: ["mock", "dry_run", "shadow"],
    allowedSymbols,
    allowedSymbolsStatus: allowedSymbols.length > 0 ? "placeholder_only" : "blocked",
    targetWeights,
    targetWeightTotalPct,
    residualWeightPct,
    rebalanceRule,
    entryRulePlaceholder: input.entryRulePlaceholder || "mock_entry_rule_placeholder_only",
    exitRulePlaceholder: input.exitRulePlaceholder || "mock_exit_rule_placeholder_only",
    riskLimits,
    maxOrderAmount: riskLimits.maxOrderAmount,
    maxDailyLossPct: riskLimits.maxDailyLossPct,
    maxPositionWeightPct: riskLimits.maxPositionWeightPct,
    killSwitchRequired: true,
    riskGateRequired: true,
    status: initialStatus,
    createdAt: input.createdAt || "2026-07-04T00:00:00.000Z",
    updatedAtPlaceholder: "in_memory_preview_only",
    storageMode: "admin_only_in_memory_placeholder",
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_strategy_draft_v1" }),
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function validateTradingLabStrategyConfigDraft(draft = {}) {
  const targetWeightTotalPct = roundPct(
    (draft.targetWeights || []).reduce((sum, target) => sum + toFiniteNumber(target.weightPct), 0),
  );
  const residualWeightPct = roundPct(100 - targetWeightTotalPct);
  const blockers = [];
  const warnings = [];
  const mode = normalizeStrategyDraftMode(draft.mode);
  const allowedSymbols = normalizePlaceholderSymbols(draft.allowedSymbols);

  if (mode === "blocked") blockers.push("unsupported_or_live_strategy_mode");
  if (String(draft.mode || "").match(/live|real|production|order_submit|submit_order/i)) {
    blockers.push("live_or_order_submission_mode_rejected");
  }
  if ((draft.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if (allowedSymbols.length === 0) blockers.push("allowed_symbols_missing");
  if (Math.abs(residualWeightPct) > 0.01) warnings.push("target_weight_residual_review_required");
  if (toFiniteNumber(draft.riskLimits?.maxOrderAmount, 0) <= 0) warnings.push("max_order_amount_placeholder_only");
  if (toFiniteNumber(draft.riskLimits?.maxDailyLossPct, 0) <= 0) warnings.push("max_daily_loss_placeholder_only");
  if (toFiniteNumber(draft.riskLimits?.maxPositionWeightPct, 0) <= 0) warnings.push("max_position_weight_placeholder_only");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";
  return {
    validationId: "step134_strategy_draft_validation",
    sourceStep: "step134",
    status,
    targetWeightTotalPct,
    residualWeightPct,
    blockers,
    warnings,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readinessPromoted: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_strategy_draft_validation_v1" }),
  };
}

export function buildTradingLabMockRecalculationBoundary(strategyDraft = buildTradingLabStrategyConfigDraft(), options = {}) {
  const validation = options.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const events = validation.status === "blocked" ? [] : buildMockEventsFromStrategyDraft(strategyDraft, options);
  const mockLedger = buildTradingLabMockLedger({
    ...options,
    mode: strategyDraft.mode,
    strategyId: strategyDraft.strategyDraftId,
    events,
  });
  const dailyReturns = calculateTradingLabDailyReturnSeries(mockLedger);
  const performance = calculateTradingLabPerformanceSummary(mockLedger, { dailyReturns });

  return {
    boundaryId: "step134_mock_recalculation_boundary",
    sourceStep: "step134",
    status: validation.status === "blocked" ? "blocked" : "mock_recalculated",
    calculationMode: "strategy_draft_mock_recalculation_admin_only",
    strategyDraftId: strategyDraft.strategyDraftId,
    reflectedFields: ["targetWeights", "mode", "allowedSymbols", "riskLimits"],
    mockLedger,
    dailyReturns,
    performance,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step134_admin_trading_lab_mock_recalculation_boundary_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const mockRecalculationBoundary = input.mockRecalculationBoundary || buildTradingLabMockRecalculationBoundary(
    strategyDraft,
    { ...options, validation },
  );

  return {
    ok: true,
    step: "Step 134: Admin trading lab strategy config draft controls",
    status: "admin_only_strategy_draft_controls_fail_closed",
    strategyDraftSchema: TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA,
    targetWeightDraftModel: TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL,
    rebalanceRuleDraftModel: TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL,
    riskLimitDraftModel: TRADING_LAB_RISK_LIMIT_DRAFT_MODEL,
    strategyDraft,
    validation,
    mockRecalculationBoundary,
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      rawProviderResponseExposed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabStrategyDraftComparison(input = {}, options = {}) {
  const baseStrategyDraft = input.baseStrategyDraft || makeStrategyDraftBaseline(options);
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const diffRows = buildStrategyDiffRows(baseStrategyDraft, strategyDraft);
  const baseSymbols = normalizePlaceholderSymbols(baseStrategyDraft.allowedSymbols);
  const draftSymbols = normalizePlaceholderSymbols(strategyDraft.allowedSymbols);
  const changedSymbols = [...new Set(diffRows.filter((row) => row.symbol).map((row) => row.symbol))].sort();
  const addedSymbols = draftSymbols.filter((symbol) => !baseSymbols.includes(symbol));
  const removedSymbols = baseSymbols.filter((symbol) => !draftSymbols.includes(symbol));
  const reviewStatus = validation.status === "blocked"
    ? "blocked"
    : validation.status === "validation_required"
      ? "validation_required"
      : "review_pending";

  return {
    comparisonId: "step135_strategy_draft_comparison",
    comparisonType: "admin_only_strategy_draft_before_after_comparison",
    sourceStep: "step135",
    strategyDraftId: strategyDraft.strategyDraftId,
    baseStrategyName: baseStrategyDraft.strategyName,
    draftStrategyName: strategyDraft.strategyName,
    modeBefore: baseStrategyDraft.mode,
    modeAfter: strategyDraft.mode,
    targetWeightsBefore: baseStrategyDraft.targetWeights,
    targetWeightsAfter: strategyDraft.targetWeights,
    changedSymbols,
    addedSymbols,
    removedSymbols,
    rebalanceRuleBefore: baseStrategyDraft.rebalanceRule,
    rebalanceRuleAfter: strategyDraft.rebalanceRule,
    riskLimitBefore: baseStrategyDraft.riskLimits,
    riskLimitAfter: strategyDraft.riskLimits,
    diffRows,
    validationStatus: validation.status,
    reviewStatus,
    createdAt: "2026-07-04T00:00:00.000Z",
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_comparison_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyDraftChangeHistory(comparison = buildTradingLabStrategyDraftComparison()) {
  const changes = (comparison.diffRows || []).map((row, index) => ({
    changeId: `step135_strategy_draft_change_${index + 1}`,
    changedAt: "2026-07-04T00:00:00.000Z",
    changedBy: "admin_placeholder",
    changeType: classifyChangeType(row.field || "target_weight"),
    summary: row.summary || "mock strategy draft comparison change",
    status: comparison.reviewStatus === "blocked" ? "blocked" : "draft",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  }));

  return {
    historyId: "step135_strategy_draft_change_history",
    sourceStep: "step135",
    storageMode: "static_in_memory_placeholder_only",
    changes,
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_change_history_v1" }),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    rawProviderResponseStored: false,
  };
}

export function buildTradingLabStrategyRiskImpactPreview(input = {}, options = {}) {
  const baseStrategyDraft = input.baseStrategyDraft || makeStrategyDraftBaseline(options);
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const baseBoundary = buildTradingLabMockRecalculationBoundary(baseStrategyDraft, options);
  const draftBoundary = buildTradingLabMockRecalculationBoundary(strategyDraft, options);
  const baseAllocation = calculateTradingLabAllocationSummary(calculateTradingLabPositionLedger(baseBoundary.mockLedger), options);
  const draftAllocation = calculateTradingLabAllocationSummary(calculateTradingLabPositionLedger(draftBoundary.mockLedger), options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);

  return {
    previewId: "step135_strategy_risk_impact_preview",
    sourceStep: "step135",
    dataSource: "mock_ledger_calculation_result",
    status: validation.status === "blocked" ? "blocked" : "mock_only",
    cumulativeReturnDeltaPct: roundPct((draftBoundary.performance?.cumulativeReturnPct || 0) - (baseBoundary.performance?.cumulativeReturnPct || 0)),
    mddDeltaPct: roundPct((draftBoundary.performance?.mddPct || 0) - (baseBoundary.performance?.mddPct || 0)),
    cashWeightDeltaPct: roundPct((draftAllocation.residualCashWeightPct || 0) - (baseAllocation.residualCashWeightPct || 0)),
    maxPositionWeightDeltaPct: roundPct(
      Math.max(...(draftAllocation.allocations || []).map((item) => item.weightPct || 0), 0)
        - Math.max(...(baseAllocation.allocations || []).map((item) => item.weightPct || 0), 0),
    ),
    validationStatus: validation.status,
    riskStatus: validation.status === "blocked" ? "blocked" : "review_pending",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step135_strategy_risk_impact_preview_v1" }),
  };
}

export function buildTradingLabStrategyDraftReviewGate(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const blockers = [...(validation.blockers || [])];
  const warnings = [...(validation.warnings || [])];
  const status = blockers.length > 0
    ? "blocked"
    : warnings.length > 0
      ? "validation_required"
      : comparison.diffRows?.length > 0
        ? "review_pending"
        : "mock_only";

  return {
    reviewGateId: "step135_strategy_draft_review_gate",
    sourceStep: "step135",
    status,
    reviewStatus: status,
    blockers,
    warnings,
    comparisonId: comparison.comparisonId,
    redactedReviewResult: {
      reviewResultId: "step135_redacted_strategy_draft_review_result",
      sourceStep: "step135",
      status: status === "review_pending" ? "not_ready" : status,
      storageMode: "in_memory_placeholder_only",
      redacted: true,
      credentialStored: false,
      accountIdentifierStored: false,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
    },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step135_strategy_draft_review_gate_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftReviewStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const changeHistory = input.changeHistory || buildTradingLabStrategyDraftChangeHistory(comparison);
  const riskImpactPreview = input.riskImpactPreview || buildTradingLabStrategyRiskImpactPreview({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);

  return {
    ok: true,
    step: "Step 135: Admin trading lab strategy draft comparison review gate",
    status: "admin_only_strategy_draft_review_gate_fail_closed",
    strategyDraftComparisonSchema: TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA,
    strategyDraftChangeHistoryModel: TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL,
    strategyRiskImpactPreviewSchema: TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA,
    strategyDraftReviewResultSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA,
    comparison,
    changeHistory,
    riskImpactPreview,
    reviewGate,
    flags: { ...STEP135_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      rawProviderResponseExposed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function validateTradingLabStrategyDraftReviewResult(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const unsafeInput = containsUnsafeReviewResultInput(input.reviewResultInput || {});
  const blockers = [...(reviewGate.blockers || [])];
  const warnings = [...(reviewGate.warnings || [])];

  if (unsafeInput) blockers.push("unsafe_private_or_payload_value_rejected");
  if (reviewGate.status === "blocked" && blockers.length === 0) blockers.push("review_gate_blocked");
  if (reviewGate.status === "validation_required" && warnings.length === 0) warnings.push("review_gate_validation_required");

  const reviewStatus = blockers.length > 0
    ? "blocked"
    : warnings.length > 0
      ? "validation_required"
      : "recorded";
  const decision = reviewStatus === "recorded" ? "mock_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected";

  return {
    validationId: "step136_strategy_draft_review_result_validation",
    sourceStep: "step136",
    strategyDraftId: strategyDraft.strategyDraftId,
    comparisonId: comparison.comparisonId,
    reviewGateId: reviewGate.reviewGateId,
    reviewStatus,
    decision,
    blockers,
    warnings,
    blockerSummary: summarizeReviewBlockers(blockers),
    warningSummary: summarizeReviewBlockers(warnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step136_strategy_draft_review_result_validation_v1" }),
  };
}

export function buildTradingLabStrategyDraftReviewBlockerSummary(validation = validateTradingLabStrategyDraftReviewResult()) {
  return {
    summaryId: "step136_strategy_draft_review_blocker_summary",
    sourceStep: "step136",
    status: validation.reviewStatus,
    blockers: validation.blockers || [],
    warnings: validation.warnings || [],
    blockerMessages: validation.blockerSummary || [],
    warningMessages: validation.warningSummary || [],
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabStrategyDraftReviewDecisionSummary(validation = validateTradingLabStrategyDraftReviewResult()) {
  return {
    decisionSummaryId: "step136_strategy_draft_review_decision_summary",
    sourceStep: "step136",
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    summary: validation.reviewStatus === "recorded"
      ? "Mock review result recorded for admin-only strategy draft validation."
      : "Mock review result remains blocked or requires validation before recording.",
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readinessPromoted: false,
  };
}

export function buildTradingLabStrategyDraftReviewResult(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.reviewResultValidation || validateTradingLabStrategyDraftReviewResult({ ...input, strategyDraft }, options);

  return {
    reviewResultId: "step136_strategy_draft_review_result",
    strategyDraftId: strategyDraft.strategyDraftId,
    comparisonId: validation.comparisonId,
    sourceStep: "step136",
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "2026-07-04T00:00:00.000Z",
    reviewedBy: "admin_placeholder",
    summary: validation.reviewStatus === "recorded"
      ? "Mock review result recorded without provider, order, or readiness impact."
      : "Mock review result not recorded because review blockers or validation warnings remain.",
    blockers: validation.blockers || [],
    warnings: validation.warnings || [],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
    redaction: makeLabRedaction({ schema: "step136_strategy_draft_review_result_v1" }),
  };
}

export function buildTradingLabStrategyDraftReviewReceipt(reviewResult = buildTradingLabStrategyDraftReviewResult()) {
  return {
    receiptId: "step136_strategy_draft_review_receipt",
    reviewResultId: reviewResult.reviewResultId,
    strategyDraftId: reviewResult.strategyDraftId,
    comparisonId: reviewResult.comparisonId,
    sourceStep: "step136",
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "2026-07-04T00:00:00.000Z",
    blockerCount: Array.isArray(reviewResult.blockers) ? reviewResult.blockers.length : 0,
    warningCount: Array.isArray(reviewResult.warnings) ? reviewResult.warnings.length : 0,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabStrategyDraftReviewResultRecordingGate(input = {}, options = {}) {
  const reviewResultValidation = input.reviewResultValidation || validateTradingLabStrategyDraftReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabStrategyDraftReviewResult({ ...input, reviewResultValidation }, options);
  const receipt = input.receipt || buildTradingLabStrategyDraftReviewReceipt(reviewResult);
  const blockerSummary = input.blockerSummary || buildTradingLabStrategyDraftReviewBlockerSummary(reviewResultValidation);
  const decisionSummary = input.decisionSummary || buildTradingLabStrategyDraftReviewDecisionSummary(reviewResultValidation);

  return {
    recordingGateId: "step136_strategy_draft_review_result_recording_gate",
    sourceStep: "step136",
    status: reviewResult.reviewStatus,
    storageMode: "in_memory_placeholder_only",
    reviewResultValidation,
    reviewResult,
    receipt,
    blockerSummary,
    decisionSummary,
    mockHistory: [receipt],
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    flags: { ...STEP136_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step136_strategy_draft_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftReviewResultStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const recordingGate = input.recordingGate || buildTradingLabStrategyDraftReviewResultRecordingGate(
    { ...input, strategyDraft, validation, comparison, reviewGate },
    options,
  );

  return {
    ok: true,
    step: "Step 136: Admin trading lab strategy draft review result recording gate",
    status: "admin_only_strategy_draft_review_result_recording_gate_fail_closed",
    strategyDraftReviewResultRecordingSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_RECORDING_SCHEMA,
    strategyDraftReviewReceiptSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RECEIPT_SCHEMA,
    strategyDraftReviewBlockerSummaryModel: TRADING_LAB_STRATEGY_DRAFT_REVIEW_BLOCKER_SUMMARY_MODEL,
    recordingGate,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    blockerSummary: recordingGate.blockerSummary,
    decisionSummary: recordingGate.decisionSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP136_ADMIN_TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function validateTradingLabStrategyDraftClearancePreflight(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const reviewResultStatus = input.reviewResultStatus || buildAdminTradingLabStrategyDraftReviewResultStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate },
    options,
  );
  const reviewResult = input.reviewResult || reviewResultStatus.reviewResult || reviewResultStatus.recordingGate?.reviewResult || null;
  const receipt = input.receipt || reviewResultStatus.receipt || reviewResultStatus.recordingGate?.receipt || null;
  const blockers = [...(validation.blockers || []), ...(reviewResult?.blockers || [])];
  const warnings = [...(validation.warnings || []), ...(reviewResult?.warnings || [])];

  if (!receipt) blockers.push("review_receipt_missing");
  if (receipt && receipt.redacted !== true) blockers.push("review_receipt_not_redacted");
  if (receipt && receipt.readinessImpact !== "none") blockers.push("review_receipt_readiness_impact_not_none");
  if (receipt && receipt.providerCallImpact !== "blocked") blockers.push("review_receipt_provider_call_impact_not_blocked");
  if (receipt && receipt.orderSubmissionImpact !== "blocked") blockers.push("review_receipt_order_submission_impact_not_blocked");
  if (receipt && receipt.liveTradingImpact !== "blocked") blockers.push("review_receipt_live_trading_impact_not_blocked");
  if (reviewResult?.reviewStatus === "blocked") blockers.push("review_result_blocked");
  if (reviewResult?.reviewStatus === "validation_required" && warnings.length === 0) warnings.push("review_result_validation_required");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const clearanceStatus = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "mock_only_clearance_candidate";

  return {
    validationId: "step137_strategy_draft_clearance_preflight_validation",
    sourceStep: "step137",
    strategyDraftId: strategyDraft.strategyDraftId,
    comparisonId: comparison.comparisonId,
    reviewResultId: reviewResult?.reviewResultId || "missing_review_result",
    receiptId: receipt?.receiptId || "missing_review_receipt",
    clearanceStatus,
    clearanceScope: "mock_only",
    reviewedReceiptStatus: receipt?.reviewStatus || "missing",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step137_strategy_draft_clearance_preflight_validation_v1" }),
  };
}

export function buildTradingLabStrategyDraftClearanceBlockerSummary(validation = validateTradingLabStrategyDraftClearancePreflight()) {
  return {
    blockerSummaryId: "step137_strategy_draft_clearance_blocker_summary",
    sourceStep: "step137",
    status: validation.clearanceStatus,
    blockers: validation.blockers || [],
    warnings: validation.warnings || [],
    blockerMessages: validation.blockerSummary || [],
    warningMessages: validation.warningSummary || [],
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabStrategyDraftClearanceCandidate(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.clearanceValidation || validateTradingLabStrategyDraftClearancePreflight({ ...input, strategyDraft }, options);

  return {
    candidateId: "step137_strategy_draft_clearance_candidate",
    strategyDraftId: strategyDraft.strategyDraftId,
    mode: strategyDraft.mode || "mock",
    scope: "mock_only",
    status: validation.clearanceStatus === "mock_only_clearance_candidate" ? "candidate" : validation.clearanceStatus,
    targetWeightStatus: Math.abs(toFiniteNumber(strategyDraft.residualWeightPct, 0)) <= 0.01 ? "mock_only" : "validation_required",
    riskLimitStatus: (strategyDraft.riskLimits?.maxOrderAmount > 0
      && strategyDraft.riskLimits?.maxDailyLossPct > 0
      && strategyDraft.riskLimits?.maxPositionWeightPct > 0)
      ? "mock_only"
      : "validation_required",
    reviewReceiptStatus: validation.reviewedReceiptStatus,
    blockerSummary: validation.blockerSummary || [],
    warningSummary: validation.warningSummary || [],
    redacted: true,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabStrategyDraftClearancePreflightResult(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const clearanceValidation = input.clearanceValidation || validateTradingLabStrategyDraftClearancePreflight({ ...input, strategyDraft }, options);
  const candidate = input.candidate || buildTradingLabStrategyDraftClearanceCandidate({ ...input, strategyDraft, clearanceValidation }, options);

  return {
    clearancePreflightId: "step137_strategy_draft_clearance_preflight",
    candidateId: candidate.candidateId,
    strategyDraftId: strategyDraft.strategyDraftId,
    reviewResultId: clearanceValidation.reviewResultId,
    receiptId: clearanceValidation.receiptId,
    sourceStep: "step137",
    clearanceStatus: clearanceValidation.clearanceStatus,
    clearanceScope: "mock_only",
    redacted: true,
    blockerCount: clearanceValidation.blockerCount,
    warningCount: clearanceValidation.warningCount,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabStrategyDraftClearancePreflight(input = {}, options = {}) {
  const clearanceValidation = input.clearanceValidation || validateTradingLabStrategyDraftClearancePreflight(input, options);
  const candidate = input.candidate || buildTradingLabStrategyDraftClearanceCandidate({ ...input, clearanceValidation }, options);
  const result = input.result || buildTradingLabStrategyDraftClearancePreflightResult({ ...input, clearanceValidation, candidate }, options);
  const blockerSummary = input.blockerSummary || buildTradingLabStrategyDraftClearanceBlockerSummary(clearanceValidation);

  return {
    clearancePreflightId: result.clearancePreflightId,
    sourceStep: "step137",
    status: result.clearanceStatus,
    clearanceStatus: result.clearanceStatus,
    clearanceScope: "mock_only",
    clearanceValidation,
    candidate,
    result,
    blockerSummary,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    flags: { ...STEP137_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step137_strategy_draft_clearance_preflight_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftClearancePreflightStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const reviewResultStatus = input.reviewResultStatus || buildAdminTradingLabStrategyDraftReviewResultStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate },
    options,
  );
  const clearancePreflight = input.clearancePreflight || buildTradingLabStrategyDraftClearancePreflight(
    { ...input, strategyDraft, validation, comparison, reviewGate, reviewResultStatus },
    options,
  );

  return {
    ok: true,
    step: "Step 137: Admin trading lab strategy draft clearance preflight",
    status: "admin_only_strategy_draft_clearance_preflight_fail_closed",
    strategyDraftClearancePreflightSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_SCHEMA,
    strategyDraftClearanceCandidateModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_CANDIDATE_MODEL,
    strategyDraftClearanceBlockerModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_BLOCKER_MODEL,
    strategyDraftClearancePreflightResultSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_RESULT_SCHEMA,
    clearancePreflight,
    candidate: clearancePreflight.candidate,
    result: clearancePreflight.result,
    blockerSummary: clearancePreflight.blockerSummary,
    flags: { ...STEP137_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function validateTradingLabStrategyDraftClearanceReviewResult(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const reviewResultStatus = input.reviewResultStatus || buildAdminTradingLabStrategyDraftReviewResultStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate },
    options,
  );
  const clearancePreflightStatus = input.clearancePreflightStatus || buildAdminTradingLabStrategyDraftClearancePreflightStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate, reviewResultStatus },
    options,
  );
  const clearancePreflight = input.clearancePreflight || clearancePreflightStatus.clearancePreflight || null;
  const clearanceValidation = input.clearanceValidation || clearancePreflight?.clearanceValidation || null;
  const candidate = input.candidate || clearancePreflightStatus.candidate || clearancePreflight?.candidate || null;
  const preflightResult = input.preflightResult || clearancePreflightStatus.result || clearancePreflight?.result || null;
  const blockers = [
    ...(validation.blockers || []),
    ...(clearanceValidation?.blockers || []),
    ...(clearancePreflightStatus.blockerSummary?.blockers || []),
  ];
  const warnings = [
    ...(validation.warnings || []),
    ...(clearanceValidation?.warnings || []),
    ...(clearancePreflightStatus.blockerSummary?.warnings || []),
  ];

  if (!preflightResult) blockers.push("clearance_preflight_missing");
  if (preflightResult && preflightResult.redacted !== true) blockers.push("clearance_preflight_not_redacted");
  if (preflightResult && preflightResult.clearanceScope !== "mock_only") blockers.push("clearance_scope_not_mock_only");
  if (preflightResult && preflightResult.readinessImpact !== "none") blockers.push("clearance_readiness_impact_not_none");
  if (preflightResult && preflightResult.providerCallImpact !== "blocked") blockers.push("clearance_provider_call_impact_not_blocked");
  if (preflightResult && preflightResult.orderSubmissionImpact !== "blocked") blockers.push("clearance_order_submission_impact_not_blocked");
  if (preflightResult && preflightResult.liveTradingImpact !== "blocked") blockers.push("clearance_live_trading_impact_not_blocked");
  if (preflightResult?.clearanceStatus === "blocked") blockers.push("clearance_preflight_blocked");
  if (preflightResult?.clearanceStatus === "validation_required") warnings.push("clearance_preflight_validation_required");
  if (!candidate) blockers.push("clearance_candidate_missing");
  if (candidate && candidate.scope !== "mock_only") blockers.push("clearance_candidate_scope_not_mock_only");
  if (candidate && candidate.orderCandidateCreated !== false) blockers.push("clearance_candidate_must_not_create_order_candidate");
  if (candidate && candidate.orderDraftCreated !== false) blockers.push("clearance_candidate_must_not_create_order_draft");
  if (candidate?.status === "blocked") blockers.push("clearance_candidate_blocked");
  if (candidate?.status === "validation_required") warnings.push("clearance_candidate_validation_required");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "recorded";
  const decision = reviewStatus === "recorded"
    ? "mock_clearance_review_recorded"
    : reviewStatus === "blocked"
      ? "blocked"
      : "rejected";

  return {
    validationId: "step138_strategy_draft_clearance_review_result_validation",
    sourceStep: "step138",
    clearanceReviewResultId: "step138_strategy_draft_clearance_review_result",
    clearancePreflightId: preflightResult?.clearancePreflightId || "missing_clearance_preflight",
    candidateId: candidate?.candidateId || "missing_clearance_candidate",
    strategyDraftId: strategyDraft.strategyDraftId,
    reviewResultId: preflightResult?.reviewResultId || clearanceValidation?.reviewResultId || "missing_review_result",
    receiptId: preflightResult?.receiptId || clearanceValidation?.receiptId || "missing_review_receipt",
    reviewStatus,
    decision,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    summary: reviewStatus === "recorded"
      ? "mock-only clearance review recorded"
      : "mock-only clearance review remains blocked or requires validation",
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step138_strategy_draft_clearance_review_result_validation_v1" }),
  };
}

export function buildTradingLabStrategyDraftClearanceReviewBlockerSummary(validation = validateTradingLabStrategyDraftClearanceReviewResult()) {
  return {
    blockerSummaryId: "step138_strategy_draft_clearance_review_blocker_summary",
    sourceStep: "step138",
    status: validation.reviewStatus,
    blockers: validation.blockers || [],
    warnings: validation.warnings || [],
    blockerMessages: validation.blockerSummary || [],
    warningMessages: validation.warningSummary || [],
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabStrategyDraftClearanceReviewDecisionSummary(reviewResult = buildTradingLabStrategyDraftClearanceReviewResult()) {
  return {
    decisionSummaryId: "step138_strategy_draft_clearance_review_decision_summary",
    sourceStep: "step138",
    decision: reviewResult.decision,
    reviewStatus: reviewResult.reviewStatus,
    summary: reviewResult.summary || "mock-only clearance review recorded",
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
  };
}

export function buildTradingLabStrategyDraftClearanceReviewResult(input = {}, options = {}) {
  const validation = input.clearanceReviewValidation || validateTradingLabStrategyDraftClearanceReviewResult(input, options);

  return {
    clearanceReviewResultId: validation.clearanceReviewResultId,
    clearancePreflightId: validation.clearancePreflightId,
    candidateId: validation.candidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewResultId: validation.reviewResultId,
    receiptId: validation.receiptId,
    sourceStep: "step138",
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_timestamp",
    reviewedBy: "admin_placeholder",
    summary: validation.summary,
    blockers: validation.blockers || [],
    warnings: validation.warnings || [],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabStrategyDraftClearanceReviewReceipt(reviewResult = buildTradingLabStrategyDraftClearanceReviewResult()) {
  return {
    receiptId: "step138_strategy_draft_clearance_review_receipt",
    clearanceReviewResultId: reviewResult.clearanceReviewResultId,
    clearancePreflightId: reviewResult.clearancePreflightId,
    candidateId: reviewResult.candidateId,
    strategyDraftId: reviewResult.strategyDraftId,
    sourceStep: "step138",
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "placeholder_timestamp",
    blockerCount: Array.isArray(reviewResult.blockers) ? reviewResult.blockers.length : 0,
    warningCount: Array.isArray(reviewResult.warnings) ? reviewResult.warnings.length : 0,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_review_only",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabStrategyDraftClearanceReviewResultRecordingGate(input = {}, options = {}) {
  const clearanceReviewValidation = input.clearanceReviewValidation || validateTradingLabStrategyDraftClearanceReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabStrategyDraftClearanceReviewResult({ ...input, clearanceReviewValidation }, options);
  const receipt = input.receipt || buildTradingLabStrategyDraftClearanceReviewReceipt(reviewResult);
  const blockerSummary = input.blockerSummary || buildTradingLabStrategyDraftClearanceReviewBlockerSummary(clearanceReviewValidation);
  const decisionSummary = input.decisionSummary || buildTradingLabStrategyDraftClearanceReviewDecisionSummary(reviewResult);

  return {
    recordingGateId: "step138_strategy_draft_clearance_review_result_recording_gate",
    sourceStep: "step138",
    status: reviewResult.reviewStatus,
    storageMode: "in_memory_placeholder_only",
    clearanceReviewValidation,
    reviewResult,
    receipt,
    blockerSummary,
    decisionSummary,
    mockHistory: [receipt],
    flags: { ...STEP138_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step138_strategy_draft_clearance_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabStrategyDraftClearanceReviewResultStatus(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const comparison = input.comparison || buildTradingLabStrategyDraftComparison({ ...input, strategyDraft, validation }, options);
  const reviewGate = input.reviewGate || buildTradingLabStrategyDraftReviewGate({ ...input, strategyDraft, validation, comparison }, options);
  const reviewResultStatus = input.reviewResultStatus || buildAdminTradingLabStrategyDraftReviewResultStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate },
    options,
  );
  const clearancePreflightStatus = input.clearancePreflightStatus || buildAdminTradingLabStrategyDraftClearancePreflightStatus(
    { ...input, strategyDraft, validation, comparison, reviewGate, reviewResultStatus },
    options,
  );
  const recordingGate = input.recordingGate || buildTradingLabStrategyDraftClearanceReviewResultRecordingGate(
    { ...input, strategyDraft, validation, comparison, reviewGate, reviewResultStatus, clearancePreflightStatus },
    options,
  );

  return {
    ok: true,
    step: "Step 138: Admin trading lab strategy draft clearance review result recording gate",
    status: "admin_only_strategy_draft_clearance_review_result_recording_gate_fail_closed",
    strategyDraftClearanceReviewResultRecordingSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_RECORDING_SCHEMA,
    strategyDraftClearanceReviewReceiptSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RECEIPT_SCHEMA,
    strategyDraftClearanceReviewDecisionSummaryModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_DECISION_SUMMARY_MODEL,
    strategyDraftClearanceReviewBlockerSummaryModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_BLOCKER_SUMMARY_MODEL,
    recordingGate,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    blockerSummary: recordingGate.blockerSummary,
    decisionSummary: recordingGate.decisionSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP138_ADMIN_TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabMockRunUniverseSnapshot(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const symbols = normalizePlaceholderSymbols(strategyDraft.allowedSymbols || []);
  const priceSeriesAvailable = input.mockPriceSeriesAvailable ?? options.mockPriceSeriesAvailable ?? true;

  return {
    universeSnapshotId: "step139_mock_run_universe_snapshot",
    sourceStep: "step139",
    status: priceSeriesAvailable ? "mock_only" : "validation_required",
    scope: "mock_only",
    symbols,
    symbolCount: symbols.length,
    dataSource: "mock_ledger_calculation_result",
    mockPriceSeriesRef: "step133_mock_daily_return_series",
    mockCalendarRef: "step133_mock_trading_calendar",
    priceSeriesStatus: priceSeriesAvailable ? "available" : "validation_required",
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    redacted: true,
  };
}

export function buildTradingLabMockRunInitialCapital(input = {}, options = {}) {
  const initialCapitalPlaceholder = Number(input.initialCapitalPlaceholder ?? options.initialCapitalPlaceholder ?? 100000);
  const cashPlaceholder = Number(input.cashPlaceholder ?? options.cashPlaceholder ?? 0);
  const status = Number.isFinite(initialCapitalPlaceholder) && initialCapitalPlaceholder > 0 && Number.isFinite(cashPlaceholder)
    ? "placeholder_only"
    : "validation_required";

  return {
    initialCapitalId: "step139_mock_run_initial_capital_placeholder",
    sourceStep: "step139",
    status,
    scope: "mock_only",
    initialCapitalPlaceholder: Number.isFinite(initialCapitalPlaceholder) ? initialCapitalPlaceholder : 0,
    cashPlaceholder: Number.isFinite(cashPlaceholder) ? cashPlaceholder : 0,
    currency: "KRW_PLACEHOLDER",
    accountBalanceQueried: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    redacted: true,
  };
}

export function buildTradingLabMockRunInputBundle(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const universeSnapshot = input.universeSnapshot || buildTradingLabMockRunUniverseSnapshot({ ...input, strategyDraft }, options);
  const initialCapital = input.initialCapital || buildTradingLabMockRunInitialCapital(input, options);

  return {
    inputBundleId: "step139_mock_run_input_bundle",
    sourceStep: "step139",
    strategyDraftId: strategyDraft.strategyDraftId,
    universeSnapshotId: universeSnapshot.universeSnapshotId,
    initialCapitalId: initialCapital.initialCapitalId,
    scope: "mock_only",
    mode: strategyDraft.mode || "mock",
    dataSource: "mock_ledger_calculation_result",
    symbols: universeSnapshot.symbols || [],
    targetWeights: normalizeTargetWeightDrafts(strategyDraft.targetWeights || [], universeSnapshot.symbols || []),
    targetWeightStatus: validation.status === "blocked" ? "blocked" : validation.warnings?.length > 0 ? "validation_required" : "mock_only",
    rebalanceRule: strategyDraft.rebalanceRule || normalizeRebalanceRuleDraft(),
    riskLimits: strategyDraft.riskLimits || normalizeRiskLimitDraft(),
    initialCapitalPlaceholder: initialCapital.initialCapitalPlaceholder,
    cashPlaceholder: initialCapital.cashPlaceholder,
    priceSeriesStatus: universeSnapshot.priceSeriesStatus,
    redacted: true,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    credentialStored: false,
    accountIdentifierStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockRunCandidatePreflight(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const clearanceReviewResultStatus = input.clearanceReviewResultStatus || buildAdminTradingLabStrategyDraftClearanceReviewResultStatus(
    { ...input, strategyDraft, validation },
    options,
  );
  const reviewResult = input.clearanceReviewResult || clearanceReviewResultStatus.reviewResult || clearanceReviewResultStatus.recordingGate?.reviewResult || null;
  const receipt = input.clearanceReviewReceipt || clearanceReviewResultStatus.receipt || clearanceReviewResultStatus.recordingGate?.receipt || null;
  const universeSnapshot = input.universeSnapshot || buildTradingLabMockRunUniverseSnapshot({ ...input, strategyDraft }, options);
  const initialCapital = input.initialCapital || buildTradingLabMockRunInitialCapital(input, options);
  const inputBundle = input.inputBundle || buildTradingLabMockRunInputBundle(
    { ...input, strategyDraft, validation, universeSnapshot, initialCapital },
    options,
  );
  const blockers = [
    ...(validation.blockers || []),
    ...(clearanceReviewResultStatus.blockerSummary?.blockers || []),
  ];
  const warnings = [
    ...(validation.warnings || []),
    ...(clearanceReviewResultStatus.blockerSummary?.warnings || []),
  ];

  if (!reviewResult) blockers.push("clearance_review_result_missing");
  if (reviewResult && reviewResult.redacted !== true) blockers.push("clearance_review_result_not_redacted");
  if (reviewResult && reviewResult.readinessImpact !== "none") blockers.push("clearance_review_readiness_impact_not_none");
  if (reviewResult && reviewResult.providerCallImpact !== "blocked") blockers.push("clearance_review_provider_call_impact_not_blocked");
  if (reviewResult && reviewResult.orderSubmissionImpact !== "blocked") blockers.push("clearance_review_order_submission_impact_not_blocked");
  if (reviewResult && reviewResult.liveTradingImpact !== "blocked") blockers.push("clearance_review_live_trading_impact_not_blocked");
  if (reviewResult?.reviewStatus === "blocked") blockers.push("clearance_review_result_blocked");
  if (reviewResult?.reviewStatus === "validation_required") warnings.push("clearance_review_result_validation_required");
  if (!receipt) blockers.push("clearance_review_receipt_missing");
  if (receipt && receipt.redacted !== true) blockers.push("clearance_review_receipt_not_redacted");
  if (universeSnapshot.priceSeriesStatus !== "available") warnings.push("mock_price_series_dependency_validation_required");
  if (!Array.isArray(universeSnapshot.symbols) || universeSnapshot.symbols.length === 0) blockers.push("mock_run_universe_missing");
  if (initialCapital.status !== "placeholder_only") warnings.push("mock_initial_capital_placeholder_validation_required");
  if (inputBundle.scope !== "mock_only") blockers.push("mock_run_input_bundle_scope_not_mock_only");
  if (inputBundle.redacted !== true) blockers.push("mock_run_input_bundle_not_redacted");
  if (inputBundle.orderCandidateCreated !== false) blockers.push("mock_run_must_not_create_order_candidate");
  if (inputBundle.orderDraftCreated !== false) blockers.push("mock_run_must_not_create_order_draft");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "mock_run_candidate";

  return {
    readinessId: "step139_mock_run_candidate_preflight_readiness",
    sourceStep: "step139",
    status,
    dependencyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "ready",
    strategyDependencyStatus: validation.status === "blocked" ? "blocked" : validation.status === "validation_required" ? "validation_required" : "ready",
    priceSeriesDependencyStatus: universeSnapshot.priceSeriesStatus,
    candidateId: "step139_mock_run_candidate",
    inputBundleId: inputBundle.inputBundleId,
    strategyDraftId: strategyDraft.strategyDraftId,
    clearanceReviewResultId: reviewResult?.clearanceReviewResultId || "missing_clearance_review_result",
    clearanceReviewReceiptId: receipt?.receiptId || "missing_clearance_review_receipt",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_order_generation_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step139_mock_run_candidate_preflight_readiness_v1" }),
  };
}

export function buildTradingLabMockRunCandidate(input = {}, options = {}) {
  const readiness = input.readiness || validateTradingLabMockRunCandidatePreflight(input, options);
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const inputBundle = input.inputBundle || buildTradingLabMockRunInputBundle({ ...input, strategyDraft }, options);

  return {
    candidateId: readiness.candidateId,
    sourceStep: "step139",
    strategyDraftId: strategyDraft.strategyDraftId,
    inputBundleId: inputBundle.inputBundleId,
    status: readiness.status,
    scope: "mock_only",
    mode: strategyDraft.mode || "mock",
    symbols: inputBundle.symbols || [],
    targetWeights: inputBundle.targetWeights || [],
    targetWeightStatus: inputBundle.targetWeightStatus || "validation_required",
    rebalanceRule: inputBundle.rebalanceRule,
    riskLimits: inputBundle.riskLimits,
    initialCapitalPlaceholder: inputBundle.initialCapitalPlaceholder,
    cashPlaceholder: inputBundle.cashPlaceholder,
    dependencyStatus: readiness.dependencyStatus,
    priceSeriesStatus: readiness.priceSeriesDependencyStatus,
    strategyDependencyStatus: readiness.strategyDependencyStatus,
    blockerCount: readiness.blockerCount,
    warningCount: readiness.warningCount,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_order_generation_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockRunPreflightResult(input = {}, options = {}) {
  const readiness = input.readiness || validateTradingLabMockRunCandidatePreflight(input, options);

  return {
    resultId: "step139_mock_run_candidate_preflight_result",
    sourceStep: "step139",
    status: readiness.status,
    scope: "mock_only",
    candidateId: readiness.candidateId,
    inputBundleId: readiness.inputBundleId,
    strategyDraftId: readiness.strategyDraftId,
    clearanceReviewResultId: readiness.clearanceReviewResultId,
    dependencyStatus: readiness.dependencyStatus,
    strategyDependencyStatus: readiness.strategyDependencyStatus,
    priceSeriesDependencyStatus: readiness.priceSeriesDependencyStatus,
    blockerCount: readiness.blockerCount,
    warningCount: readiness.warningCount,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_order_generation_preflight",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockRunCandidatePreflight(input = {}, options = {}) {
  const strategyDraft = input.strategyDraft || buildTradingLabStrategyConfigDraft(input, options);
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const clearanceReviewResultStatus = input.clearanceReviewResultStatus || buildAdminTradingLabStrategyDraftClearanceReviewResultStatus(
    { ...input, strategyDraft, validation },
    options,
  );
  const universeSnapshot = input.universeSnapshot || buildTradingLabMockRunUniverseSnapshot({ ...input, strategyDraft }, options);
  const initialCapital = input.initialCapital || buildTradingLabMockRunInitialCapital(input, options);
  const inputBundle = input.inputBundle || buildTradingLabMockRunInputBundle(
    { ...input, strategyDraft, validation, universeSnapshot, initialCapital },
    options,
  );
  const readiness = input.readiness || validateTradingLabMockRunCandidatePreflight(
    { ...input, strategyDraft, validation, clearanceReviewResultStatus, universeSnapshot, initialCapital, inputBundle },
    options,
  );
  const candidate = input.candidate || buildTradingLabMockRunCandidate({ ...input, strategyDraft, inputBundle, readiness }, options);
  const result = input.result || buildTradingLabMockRunPreflightResult({ ...input, readiness }, options);

  return {
    preflightId: "step139_mock_run_candidate_preflight",
    sourceStep: "step139",
    status: readiness.status,
    dependencyStatus: readiness.dependencyStatus,
    clearanceReviewResultStatus,
    readiness,
    candidate,
    inputBundle,
    universeSnapshot,
    initialCapital,
    result,
    blockerSummary: {
      blockerSummaryId: "step139_mock_run_candidate_preflight_blocker_summary",
      sourceStep: "step139",
      status: readiness.status,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
      blockerMessages: readiness.blockerSummary,
      warningMessages: readiness.warningSummary,
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      redacted: true,
    },
    flags: { ...STEP139_ADMIN_TRADING_LAB_MOCK_RUN_CANDIDATE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step139_mock_run_candidate_preflight_v1" }),
  };
}

export function buildAdminTradingLabMockRunCandidatePreflightStatus(input = {}, options = {}) {
  const preflight = input.preflight || buildTradingLabMockRunCandidatePreflight(input, options);

  return {
    ok: true,
    step: "Step 139: Admin trading lab mock run candidate preflight",
    status: "admin_only_trading_lab_mock_run_candidate_preflight_fail_closed",
    mockRunCandidateModel: TRADING_LAB_MOCK_RUN_CANDIDATE_MODEL,
    mockRunPreflightModel: TRADING_LAB_MOCK_RUN_PREFLIGHT_MODEL,
    mockRunInputBundleModel: TRADING_LAB_MOCK_RUN_INPUT_BUNDLE_MODEL,
    mockRunUniverseSnapshotModel: TRADING_LAB_MOCK_RUN_UNIVERSE_SNAPSHOT_MODEL,
    mockRunInitialCapitalModel: TRADING_LAB_MOCK_RUN_INITIAL_CAPITAL_MODEL,
    mockRunReadinessSchema: TRADING_LAB_MOCK_RUN_READINESS_SCHEMA,
    mockRunPreflightResultSchema: TRADING_LAB_MOCK_RUN_PREFLIGHT_RESULT_SCHEMA,
    preflight,
    readiness: preflight.readiness,
    candidate: preflight.candidate,
    inputBundle: preflight.inputBundle,
    universeSnapshot: preflight.universeSnapshot,
    initialCapital: preflight.initialCapital,
    result: preflight.result,
    blockerSummary: preflight.blockerSummary,
    flags: { ...STEP139_ADMIN_TRADING_LAB_MOCK_RUN_CANDIDATE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabMockRebalanceDeltas(input = {}, options = {}) {
  const inputBundle = input.inputBundle || buildTradingLabMockRunInputBundle(input, options);
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const currentAllocations = Array.isArray(allocationSummary.allocations) ? allocationSummary.allocations : [];
  const currentWeightMap = new Map(currentAllocations.map((allocation) => [
    allocation.symbol,
    Number(allocation.weightPct || 0),
  ]));
  const targetWeights = Array.isArray(inputBundle.targetWeights) ? inputBundle.targetWeights : [];
  const targetWeightMap = new Map(targetWeights.map((target) => [
    target.symbol,
    Number(target.weightPct || 0),
  ]));
  const symbols = [...new Set([...(inputBundle.symbols || []), ...targetWeightMap.keys(), ...currentWeightMap.keys()])];
  const baseCapital = Number(inputBundle.initialCapitalPlaceholder || allocationSummary.totalEquity || 100000);

  return symbols.map((symbol, index) => {
    const targetWeight = targetWeightMap.get(symbol) ?? 0;
    const currentWeight = currentWeightMap.get(symbol) ?? 0;
    const weightGap = Number((targetWeight - currentWeight).toFixed(4));
    const absoluteGap = Math.abs(weightGap);
    const direction = absoluteGap < 0.01 ? "aligned" : weightGap > 0 ? "underweight" : "overweight";
    const mockAction = direction === "underweight" ? "mock_buy" : direction === "overweight" ? "mock_sell" : "mock_hold";
    const mockAmountDelta = Number(((baseCapital * absoluteGap) / 100).toFixed(2));

    return {
      deltaId: `step140_mock_rebalance_delta_${index + 1}`,
      sourceStep: "step140",
      symbol,
      targetWeight,
      currentWeight,
      weightGap,
      direction,
      mockAction,
      mockAmountDelta,
      cashImpactPlaceholder: mockAction === "mock_buy" ? -mockAmountDelta : mockAmountDelta,
      status: "mock_only",
      redacted: true,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
      accountIdentifierStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      actualOrderCandidateCreated: false,
      actualOrderDraftCreated: false,
      kisOrderPayloadCreated: false,
      fillCreated: false,
      accountBalanceQueried: false,
    };
  });
}

export function buildTradingLabMockTargetAllocationGapSummary(deltas = buildTradingLabMockRebalanceDeltas()) {
  const rows = Array.isArray(deltas) ? deltas : [];
  const totalAbsoluteGap = Number(rows.reduce((sum, row) => sum + Math.abs(Number(row.weightGap || 0)), 0).toFixed(4));
  const maxAbsoluteGap = Number(rows.reduce((max, row) => Math.max(max, Math.abs(Number(row.weightGap || 0))), 0).toFixed(4));
  const gapCount = rows.filter((row) => Math.abs(Number(row.weightGap || 0)) >= 0.01).length;

  return {
    gapSummaryId: "step140_mock_target_allocation_gap_summary",
    sourceStep: "step140",
    status: rows.length === 0 ? "validation_required" : "mock_only",
    totalAbsoluteGap,
    maxAbsoluteGap,
    gapCount,
    redacted: true,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockBuySellSignalPlaceholders(deltas = buildTradingLabMockRebalanceDeltas()) {
  return (Array.isArray(deltas) ? deltas : []).map((delta, index) => ({
    signalId: `step140_mock_buy_sell_signal_${index + 1}`,
    sourceStep: "step140",
    symbol: delta.symbol,
    side: delta.mockAction || "mock_hold",
    reason: delta.mockAction === "mock_hold" ? "no_action" : "rebalance_gap",
    status: delta.status || "mock_only",
    redacted: true,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
  }));
}

export function buildTradingLabMockOrderIntents(input = {}, options = {}) {
  const mockRunCandidate = input.mockRunCandidate || input.candidate || buildTradingLabMockRunCandidate(input, options);
  const deltas = input.deltas || buildTradingLabMockRebalanceDeltas(input, options);

  return (Array.isArray(deltas) ? deltas : []).map((delta, index) => ({
    mockOrderIntentId: `step140_mock_order_intent_${index + 1}`,
    sourceStep: "step140",
    mockRunCandidateId: mockRunCandidate.candidateId || "missing_mock_run_candidate",
    symbol: delta.symbol,
    side: delta.mockAction || "mock_hold",
    reason: delta.mockAction === "mock_hold" ? "no_action" : "rebalance_gap",
    targetWeight: Number(delta.targetWeight || 0),
    currentWeight: Number(delta.currentWeight || 0),
    weightGap: Number(delta.weightGap || 0),
    mockEstimatedAmount: Number(delta.mockAmountDelta || 0),
    mockQuantityPlaceholder: Number(delta.mockAmountDelta || 0) > 0 ? 1 : 0,
    status: delta.status || "mock_only",
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    credentialStored: false,
    accountIdentifierStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  }));
}

export function buildTradingLabMockOrderGenerationRiskGuardPreflight(input = {}, options = {}) {
  const inputBundle = input.inputBundle || buildTradingLabMockRunInputBundle(input, options);
  const riskLimits = inputBundle.riskLimits || normalizeRiskLimitDraft();
  const intents = input.mockOrderIntents || buildTradingLabMockOrderIntents({ ...input, inputBundle }, options);
  const cashReserve = Number(inputBundle.cashPlaceholder || 0);
  const maxOrderAmount = Number(riskLimits.maxOrderAmount || 0);
  const maxDailyLossPct = Number(riskLimits.maxDailyLossPct || 0);
  const maxPositionWeightPct = Number(riskLimits.maxPositionWeightPct || 0);
  const blockers = [];
  const warnings = [];

  if (!riskLimits.killSwitchRequired) blockers.push("kill_switch_requirement_missing");
  if (!riskLimits.riskGateRequired) blockers.push("risk_gate_requirement_missing");
  if (!Number.isFinite(maxOrderAmount) || maxOrderAmount <= 0) warnings.push("max_order_amount_placeholder_validation_required");
  if (!Number.isFinite(maxDailyLossPct) || maxDailyLossPct <= 0) warnings.push("max_daily_loss_placeholder_validation_required");
  if (!Number.isFinite(maxPositionWeightPct) || maxPositionWeightPct <= 0) warnings.push("max_position_weight_placeholder_validation_required");
  if (!Number.isFinite(cashReserve)) warnings.push("cash_reserve_placeholder_validation_required");

  const blockedIntentCount = intents.filter((intent) => intent.status === "blocked").length;
  const warningIntentCount = intents.filter((intent) => intent.status === "validation_required").length;
  if (blockedIntentCount > 0) blockers.push("mock_order_intent_blocked");
  if (warningIntentCount > 0) warnings.push("mock_order_intent_validation_required");
  if (intents.some((intent) => Number(intent.mockEstimatedAmount || 0) > maxOrderAmount && maxOrderAmount > 0)) {
    warnings.push("mock_order_amount_exceeds_placeholder_limit");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_only";

  return {
    riskGuardId: "step140_mock_order_generation_risk_guard_preflight",
    sourceStep: "step140",
    status,
    maxPositionWeightStatus: maxPositionWeightPct > 0 ? "mock_only" : "validation_required",
    maxOrderAmountStatus: maxOrderAmount > 0 ? "mock_only" : "validation_required",
    maxDailyLossStatus: maxDailyLossPct > 0 ? "mock_only" : "validation_required",
    cashReserveStatus: Number.isFinite(cashReserve) ? "mock_only" : "validation_required",
    killSwitchRequired: true,
    riskGateRequired: true,
    mockOrderIntentCount: intents.length,
    blockedIntentCount,
    warningIntentCount,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerMessages: summarizeReviewBlockers(uniqueBlockers),
    warningMessages: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockOrderGenerationPreflight(input = {}, options = {}) {
  const mockRunCandidatePreflightStatus = input.mockRunCandidatePreflightStatus || buildAdminTradingLabMockRunCandidatePreflightStatus(input, options);
  const mockRunCandidate = input.mockRunCandidate || mockRunCandidatePreflightStatus.candidate || mockRunCandidatePreflightStatus.preflight?.candidate || null;
  const inputBundle = input.inputBundle || mockRunCandidatePreflightStatus.inputBundle || mockRunCandidatePreflightStatus.preflight?.inputBundle || null;
  const strategyDraft = input.strategyDraft || (inputBundle ? buildTradingLabStrategyConfigDraft({ mode: inputBundle.mode, targetWeights: inputBundle.targetWeights, riskLimits: inputBundle.riskLimits }) : buildTradingLabStrategyConfigDraft(input, options));
  const validation = input.validation || validateTradingLabStrategyConfigDraft(strategyDraft);
  const deltas = input.deltas || buildTradingLabMockRebalanceDeltas({ ...input, inputBundle: inputBundle || undefined, strategyDraft, validation }, options);
  const allocationGapSummary = input.allocationGapSummary || buildTradingLabMockTargetAllocationGapSummary(deltas);
  const mockOrderIntents = input.mockOrderIntents || buildTradingLabMockOrderIntents({ ...input, mockRunCandidate: mockRunCandidate || undefined, inputBundle: inputBundle || undefined, deltas }, options);
  const riskGuard = input.riskGuard || buildTradingLabMockOrderGenerationRiskGuardPreflight({ ...input, inputBundle: inputBundle || undefined, mockOrderIntents }, options);
  const blockers = [
    ...(validation.blockers || []),
    ...(mockRunCandidatePreflightStatus.blockerSummary?.blockers || []),
    ...(riskGuard.blockers || []),
  ];
  const warnings = [
    ...(validation.warnings || []),
    ...(mockRunCandidatePreflightStatus.blockerSummary?.warnings || []),
    ...(riskGuard.warnings || []),
  ];

  if (!mockRunCandidate) blockers.push("mock_run_candidate_missing");
  if (mockRunCandidate && mockRunCandidate.redacted !== true) blockers.push("mock_run_candidate_not_redacted");
  if (mockRunCandidate && mockRunCandidate.scope !== "mock_only") blockers.push("mock_run_candidate_scope_not_mock_only");
  if (mockRunCandidate && mockRunCandidate.readinessImpact !== "none") blockers.push("mock_run_candidate_readiness_impact_not_none");
  if (mockRunCandidate && mockRunCandidate.providerCallImpact !== "blocked") blockers.push("mock_run_candidate_provider_call_impact_not_blocked");
  if (mockRunCandidate && mockRunCandidate.orderSubmissionImpact !== "blocked") blockers.push("mock_run_candidate_order_submission_impact_not_blocked");
  if (mockRunCandidate && mockRunCandidate.liveTradingImpact !== "blocked") blockers.push("mock_run_candidate_live_trading_impact_not_blocked");
  if (mockRunCandidate?.status === "blocked") blockers.push("mock_run_candidate_blocked");
  if (mockRunCandidate?.status === "validation_required") warnings.push("mock_run_candidate_validation_required");
  if (!inputBundle) blockers.push("mock_run_input_bundle_missing");
  if (inputBundle && inputBundle.scope !== "mock_only") blockers.push("mock_run_input_bundle_scope_not_mock_only");
  if (inputBundle && inputBundle.redacted !== true) blockers.push("mock_run_input_bundle_not_redacted");
  if (inputBundle?.priceSeriesStatus !== "available") warnings.push("mock_price_series_dependency_validation_required");
  if (input.mockAllocationAvailable === false || options.mockAllocationAvailable === false) warnings.push("mock_allocation_dependency_validation_required");
  if (allocationGapSummary.status === "validation_required") warnings.push("mock_allocation_gap_validation_required");
  if (riskGuard.status === "blocked") blockers.push("mock_order_generation_risk_guard_blocked");
  if (riskGuard.status === "validation_required") warnings.push("mock_order_generation_risk_guard_validation_required");
  if (mockOrderIntents.some((intent) => intent.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (mockOrderIntents.some((intent) => intent.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (mockOrderIntents.some((intent) => intent.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (mockOrderIntents.some((intent) => intent.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (mockOrderIntents.some((intent) => intent.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "mock_order_generation_candidate";

  return {
    validationId: "step140_mock_order_generation_preflight_validation",
    sourceStep: "step140",
    status,
    mockOrderGenerationPreflightId: "step140_mock_order_generation_preflight",
    mockRunCandidateId: mockRunCandidate?.candidateId || "missing_mock_run_candidate",
    inputBundleId: inputBundle?.inputBundleId || "missing_mock_run_input_bundle",
    strategyDraftId: inputBundle?.strategyDraftId || strategyDraft.strategyDraftId,
    mode: inputBundle?.mode || strategyDraft.mode || "mock",
    scope: "mock_only",
    targetAllocationStatus: validation.status === "blocked" ? "blocked" : validation.warnings?.length > 0 ? "validation_required" : "mock_only",
    currentAllocationStatus: input.mockAllocationAvailable === false || options.mockAllocationAvailable === false ? "validation_required" : "mock_only",
    allocationGapStatus: allocationGapSummary.status,
    rebalanceRuleStatus: inputBundle?.rebalanceRule?.status || "mock_only",
    priceSeriesStatus: inputBundle?.priceSeriesStatus || "validation_required",
    riskGuardStatus: riskGuard.status,
    intentCount: mockOrderIntents.length,
    blockedIntentCount: riskGuard.blockedIntentCount || 0,
    warningIntentCount: riskGuard.warningIntentCount || 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_order_generation_review",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step140_mock_order_generation_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockOrderGenerationPreflightResult(input = {}, options = {}) {
  const validation = input.mockOrderGenerationValidation || validateTradingLabMockOrderGenerationPreflight(input, options);

  return {
    mockOrderGenerationPreflightId: validation.mockOrderGenerationPreflightId,
    sourceStep: "step140",
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    mode: validation.mode,
    scope: "mock_only",
    redacted: true,
    intentCount: validation.intentCount,
    blockedIntentCount: validation.blockedIntentCount,
    warningIntentCount: validation.warningIntentCount,
    allocationGapStatus: validation.allocationGapStatus,
    riskGuardStatus: validation.riskGuardStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_order_generation_review",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockOrderGenerationPreflight(input = {}, options = {}) {
  const mockRunCandidatePreflightStatus = input.mockRunCandidatePreflightStatus || buildAdminTradingLabMockRunCandidatePreflightStatus(input, options);
  const inputBundle = input.inputBundle || mockRunCandidatePreflightStatus.inputBundle || mockRunCandidatePreflightStatus.preflight?.inputBundle || buildTradingLabMockRunInputBundle(input, options);
  const deltas = input.deltas || buildTradingLabMockRebalanceDeltas({ ...input, inputBundle }, options);
  const allocationGapSummary = input.allocationGapSummary || buildTradingLabMockTargetAllocationGapSummary(deltas);
  const signals = input.signals || buildTradingLabMockBuySellSignalPlaceholders(deltas);
  const mockOrderIntents = input.mockOrderIntents || buildTradingLabMockOrderIntents({ ...input, inputBundle, deltas }, options);
  const riskGuard = input.riskGuard || buildTradingLabMockOrderGenerationRiskGuardPreflight({ ...input, inputBundle, mockOrderIntents }, options);
  const mockOrderGenerationValidation = input.mockOrderGenerationValidation || validateTradingLabMockOrderGenerationPreflight(
    { ...input, mockRunCandidatePreflightStatus, inputBundle, deltas, allocationGapSummary, mockOrderIntents, riskGuard },
    options,
  );
  const result = input.result || buildTradingLabMockOrderGenerationPreflightResult({ ...input, mockOrderGenerationValidation }, options);

  return {
    mockOrderGenerationPreflightId: "step140_mock_order_generation_preflight",
    sourceStep: "step140",
    status: result.status,
    scope: "mock_only",
    mockRunCandidatePreflightStatus,
    inputBundle,
    deltas,
    allocationGapSummary,
    signals,
    mockOrderIntents,
    riskGuard,
    validation: mockOrderGenerationValidation,
    result,
    blockerSummary: {
      blockerSummaryId: "step140_mock_order_generation_preflight_blocker_summary",
      sourceStep: "step140",
      status: result.status,
      blockers: mockOrderGenerationValidation.blockers,
      warnings: mockOrderGenerationValidation.warnings,
      blockerMessages: mockOrderGenerationValidation.blockerSummary,
      warningMessages: mockOrderGenerationValidation.warningSummary,
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      redacted: true,
    },
    flags: { ...STEP140_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step140_mock_order_generation_preflight_v1" }),
  };
}

export function buildAdminTradingLabMockOrderGenerationPreflightStatus(input = {}, options = {}) {
  const preflight = input.preflight || buildTradingLabMockOrderGenerationPreflight(input, options);

  return {
    ok: true,
    step: "Step 140: Admin trading lab mock order generation preflight",
    status: "admin_only_trading_lab_mock_order_generation_preflight_fail_closed",
    mockOrderGenerationPreflightModel: TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_MODEL,
    mockOrderIntentModel: TRADING_LAB_MOCK_ORDER_INTENT_MODEL,
    mockRebalanceDeltaModel: TRADING_LAB_MOCK_REBALANCE_DELTA_MODEL,
    mockTargetAllocationGapModel: TRADING_LAB_MOCK_TARGET_ALLOCATION_GAP_MODEL,
    mockBuySellSignalPlaceholderModel: TRADING_LAB_MOCK_BUY_SELL_SIGNAL_PLACEHOLDER_MODEL,
    mockOrderGenerationRiskGuardPreflightModel: TRADING_LAB_MOCK_ORDER_GENERATION_RISK_GUARD_PREFLIGHT_MODEL,
    mockOrderGenerationPreflightResultSchema: TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_RESULT_SCHEMA,
    preflight,
    validation: preflight.validation,
    result: preflight.result,
    mockOrderIntents: preflight.mockOrderIntents,
    deltas: preflight.deltas,
    allocationGapSummary: preflight.allocationGapSummary,
    signals: preflight.signals,
    riskGuard: preflight.riskGuard,
    blockerSummary: preflight.blockerSummary,
    flags: { ...STEP140_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

export function buildTradingLabMockOrderIntentReviewSummary(input = {}, options = {}) {
  const preflightStatus = input.mockOrderGenerationPreflightStatus || buildAdminTradingLabMockOrderGenerationPreflightStatus(input, options);
  const intents = input.mockOrderIntents || preflightStatus.mockOrderIntents || preflightStatus.preflight?.mockOrderIntents || [];
  const rows = (Array.isArray(intents) ? intents : []).map((intent, index) => {
    const side = intent.side || "mock_hold";
    const direction = side === "mock_buy"
      ? "target_allocation_underweight_mock_buy_intent"
      : side === "mock_sell"
        ? "target_allocation_overweight_mock_sell_intent"
        : "target_allocation_aligned_mock_hold_intent";

    return {
      rowId: `step141_mock_order_intent_review_row_${index + 1}`,
      sourceStep: "step141",
      mockOrderIntentId: intent.mockOrderIntentId || `missing_mock_order_intent_${index + 1}`,
      symbol: intent.symbol || "SYMBOL_PLACEHOLDER",
      side,
      displaySide: side === "mock_buy" ? "mock buy intent" : side === "mock_sell" ? "mock sell intent" : "mock hold intent",
      reason: intent.reason || "no_action",
      summary: `${intent.symbol || "SYMBOL_PLACEHOLDER"}: ${direction}`,
      targetWeight: Number(intent.targetWeight || 0),
      currentWeight: Number(intent.currentWeight || 0),
      weightGap: Number(intent.weightGap || 0),
      status: intent.status || "mock_only",
      redacted: true,
      actualOrderCandidateCreated: false,
      actualOrderDraftCreated: false,
      kisOrderPayloadCreated: false,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
      accountIdentifierStored: false,
      credentialStored: false,
      privatePathStored: false,
      hashValueStored: false,
      digestValueStored: false,
    };
  });
  const blockedIntentCount = rows.filter((row) => row.status === "blocked").length;
  const warningIntentCount = rows.filter((row) => row.status === "validation_required").length;

  return {
    summaryId: "step141_mock_order_intent_review_summary",
    sourceStep: "step141",
    status: blockedIntentCount > 0 ? "blocked" : warningIntentCount > 0 ? "validation_required" : "mock_only",
    intentCount: rows.length,
    blockedIntentCount,
    warningIntentCount,
    rows,
    reviewNotes: [
      "Mock order intents only.",
      "No actual order candidate created.",
      "No order draft created.",
      "No KIS order payload created.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockOrderGenerationReviewResult(input = {}, options = {}) {
  const preflightStatus = input.mockOrderGenerationPreflightStatus || buildAdminTradingLabMockOrderGenerationPreflightStatus(input, options);
  const preflight = input.preflight || preflightStatus.preflight || null;
  const preflightResult = input.preflightResult || preflightStatus.result || preflight?.result || null;
  const preflightValidation = input.preflightValidation || preflightStatus.validation || preflight?.validation || {};
  const inputBundle = input.inputBundle || preflight?.inputBundle || null;
  const riskGuard = input.riskGuard || preflightStatus.riskGuard || preflight?.riskGuard || {};
  const intentReviewSummary = input.intentReviewSummary || buildTradingLabMockOrderIntentReviewSummary({ ...input, mockOrderGenerationPreflightStatus: preflightStatus }, options);
  const blockers = [];
  const warnings = [];

  if (!preflight) blockers.push("mock_order_generation_preflight_missing");
  if (!preflightResult) blockers.push("mock_order_generation_preflight_result_missing");
  if (preflight && preflight.redacted === false) blockers.push("mock_order_generation_preflight_not_redacted");
  if (preflightResult && preflightResult.redacted !== true) blockers.push("mock_order_generation_preflight_result_not_redacted");
  if (preflightResult && preflightResult.scope !== "mock_only") blockers.push("mock_order_generation_preflight_scope_not_mock_only");
  if (preflightResult && preflightResult.readinessImpact !== "none") blockers.push("preflight_readiness_impact_not_none");
  if (preflightResult && preflightResult.providerCallImpact !== "blocked") blockers.push("preflight_provider_call_impact_not_blocked");
  if (preflightResult && preflightResult.orderSubmissionImpact !== "blocked") blockers.push("preflight_order_submission_impact_not_blocked");
  if (preflightResult && preflightResult.liveTradingImpact !== "blocked") blockers.push("preflight_live_trading_impact_not_blocked");
  if (preflightResult?.status === "blocked") blockers.push("mock_order_generation_preflight_blocked");
  if (preflightResult?.status === "validation_required") warnings.push("mock_order_generation_preflight_validation_required");
  if (preflightValidation?.status === "blocked") blockers.push("mock_order_generation_validation_blocked");
  if (preflightValidation?.status === "validation_required") warnings.push("mock_order_generation_validation_required");
  if (inputBundle && String(inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if ((inputBundle?.symbols || inputBundle?.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if ((preflightValidation?.warnings || []).includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (riskGuard?.status === "blocked") blockers.push("mock_order_generation_risk_guard_blocked");
  if (riskGuard?.status === "validation_required") warnings.push("mock_order_generation_risk_guard_validation_required");
  if (intentReviewSummary.status === "blocked") blockers.push("mock_order_intent_review_blocked");
  if (intentReviewSummary.status === "validation_required") warnings.push("mock_order_intent_review_validation_required");

  const unsafeArtifactFlags = [
    preflight?.actualOrderCandidateCreated,
    preflight?.actualOrderDraftCreated,
    preflight?.kisOrderPayloadCreated,
    preflightResult?.actualOrderCandidateCreated,
    preflightResult?.actualOrderDraftCreated,
    preflightResult?.kisOrderPayloadCreated,
  ];
  if (unsafeArtifactFlags.some((value) => value !== false && value !== undefined)) blockers.push("actual_order_artifact_must_not_exist");
  if (containsUnsafeReviewResultInput(input.reviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "recorded";

  return {
    validationId: "step141_mock_order_generation_review_result_validation",
    sourceStep: "step141",
    reviewStatus,
    decision: reviewStatus === "recorded" ? "mock_order_generation_review_recorded" : uniqueBlockers.includes("unsafe_private_or_payload_value_rejected") ? "rejected" : "blocked",
    mockOrderGenerationReviewResultId: "step141_mock_order_generation_review_result",
    mockOrderGenerationPreflightId: preflightResult?.mockOrderGenerationPreflightId || preflight?.mockOrderGenerationPreflightId || "missing_mock_order_generation_preflight",
    mockRunCandidateId: preflightResult?.mockRunCandidateId || preflightValidation?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: preflightResult?.inputBundleId || preflightValidation?.inputBundleId || "missing_mock_run_input_bundle",
    strategyDraftId: preflightResult?.strategyDraftId || preflightValidation?.strategyDraftId || "missing_strategy_draft",
    intentCount: intentReviewSummary.intentCount || 0,
    blockedIntentCount: intentReviewSummary.blockedIntentCount || preflightResult?.blockedIntentCount || 0,
    warningIntentCount: intentReviewSummary.warningIntentCount || preflightResult?.warningIntentCount || 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step141_mock_order_generation_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockOrderGenerationReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockOrderGenerationReviewResult(input, options);
  const blockers = validation.blockers || [];
  const warnings = validation.warnings || [];

  return {
    summaryId: "step141_mock_order_generation_review_decision_summary",
    sourceStep: "step141",
    status: validation.reviewStatus,
    decision: validation.decision,
    blockers,
    warnings,
    blockerMessages: validation.blockerSummary,
    warningMessages: validation.warningSummary,
    decisionMessages: [
      validation.decision === "mock_order_generation_review_recorded" ? "mock order generation review recorded" : "mock order generation review remains blocked",
      "Mock order intents only.",
      "No actual order candidate created.",
      "No order draft created.",
      "No KIS order payload created.",
      "KIS calls and order submission remain blocked.",
      "Live trading readiness remains blocked.",
      "External order authority evidence is still required.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
}

export function buildTradingLabMockOrderGenerationReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockOrderGenerationReviewResult(input, options);
  const summary = input.intentReviewSummary || buildTradingLabMockOrderIntentReviewSummary(input, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockOrderGenerationReviewDecisionSummary({ ...input, validation }, options);

  return {
    mockOrderGenerationReviewResultId: validation.mockOrderGenerationReviewResultId,
    sourceStep: "step141",
    mockOrderGenerationPreflightId: validation.mockOrderGenerationPreflightId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "in_memory_placeholder_not_persisted",
    reviewedBy: "admin_placeholder",
    intentCount: validation.intentCount,
    blockedIntentCount: validation.blockedIntentCount,
    warningIntentCount: validation.warningIntentCount,
    summary: "Redacted mock order generation review result.",
    blockers: validation.blockers,
    warnings: validation.warnings,
    intentReviewSummary: summary,
    decisionSummary,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockOrderGenerationReviewReceipt(input = {}, options = {}) {
  const reviewResult = input.reviewResult || buildTradingLabMockOrderGenerationReviewResult(input, options);

  return {
    receiptId: "step141_mock_order_generation_review_receipt",
    sourceStep: "step141",
    mockOrderGenerationReviewResultId: reviewResult.mockOrderGenerationReviewResultId,
    mockOrderGenerationPreflightId: reviewResult.mockOrderGenerationPreflightId,
    mockRunCandidateId: reviewResult.mockRunCandidateId,
    inputBundleId: reviewResult.inputBundleId,
    strategyDraftId: reviewResult.strategyDraftId,
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "in_memory_placeholder_not_persisted",
    intentCount: reviewResult.intentCount,
    blockedIntentCount: reviewResult.blockedIntentCount,
    warningIntentCount: reviewResult.warningIntentCount,
    blockerCount: reviewResult.blockers.length,
    warningCount: reviewResult.warnings.length,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_execution_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockOrderGenerationReviewResultRecordingGate(input = {}, options = {}) {
  const mockOrderGenerationPreflightStatus = input.mockOrderGenerationPreflightStatus || buildAdminTradingLabMockOrderGenerationPreflightStatus(input, options);
  const intentReviewSummary = input.intentReviewSummary || buildTradingLabMockOrderIntentReviewSummary({ ...input, mockOrderGenerationPreflightStatus }, options);
  const validation = input.validation || validateTradingLabMockOrderGenerationReviewResult({ ...input, mockOrderGenerationPreflightStatus, intentReviewSummary }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockOrderGenerationReviewDecisionSummary({ ...input, validation }, options);
  const reviewResult = input.reviewResult || buildTradingLabMockOrderGenerationReviewResult({ ...input, validation, intentReviewSummary, decisionSummary }, options);
  const receipt = input.receipt || buildTradingLabMockOrderGenerationReviewReceipt({ ...input, reviewResult }, options);

  return {
    recordingGateId: "step141_mock_order_generation_review_result_recording_gate",
    sourceStep: "step141",
    status: validation.reviewStatus,
    mockOrderGenerationPreflightStatus,
    intentReviewSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
    blockerSummary: {
      summaryId: "step141_mock_order_generation_review_blocker_summary",
      sourceStep: "step141",
      status: validation.reviewStatus,
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    mockHistory: [
      {
        historyId: "step141_mock_order_generation_review_history_1",
        sourceStep: "step141",
        reviewStatus: reviewResult.reviewStatus,
        decision: reviewResult.decision,
        recordedAt: receipt.recordedAt,
        redacted: true,
        providerCallImpact: "blocked",
        orderSubmissionImpact: "blocked",
        liveTradingImpact: "blocked",
      },
    ],
    flags: { ...STEP141_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step141_mock_order_generation_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabMockOrderGenerationReviewResultStatus(input = {}, options = {}) {
  const recordingGate = input.recordingGate || buildTradingLabMockOrderGenerationReviewResultRecordingGate(input, options);

  return {
    ok: true,
    step: "Step 141: Admin trading lab mock order generation review result recording gate",
    status: "admin_only_trading_lab_mock_order_generation_review_result_recording_gate_fail_closed",
    mockOrderGenerationReviewResultModel: TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_MODEL,
    mockOrderGenerationReviewReceiptSchema: TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RECEIPT_SCHEMA,
    mockOrderIntentReviewSummaryModel: TRADING_LAB_MOCK_ORDER_INTENT_REVIEW_SUMMARY_MODEL,
    mockOrderReviewDecisionSummaryModel: TRADING_LAB_MOCK_ORDER_REVIEW_DECISION_SUMMARY_MODEL,
    recordingGate,
    validation: recordingGate.validation,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    intentReviewSummary: recordingGate.intentReviewSummary,
    decisionSummary: recordingGate.decisionSummary,
    blockerSummary: recordingGate.blockerSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP141_ADMIN_TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep142ReviewContext(input = {}, options = {}) {
  const reviewResultStatus = input.mockOrderGenerationReviewResultStatus || buildAdminTradingLabMockOrderGenerationReviewResultStatus(input, options);
  const recordingGate = input.recordingGate || reviewResultStatus.recordingGate || null;
  const reviewResult = input.reviewResult || reviewResultStatus.reviewResult || recordingGate?.reviewResult || null;
  const receipt = input.receipt || reviewResultStatus.receipt || recordingGate?.receipt || null;
  const preflightStatus = input.mockOrderGenerationPreflightStatus || recordingGate?.mockOrderGenerationPreflightStatus || null;
  const preflight = input.mockOrderGenerationPreflight || preflightStatus?.preflight || null;
  const inputBundle = input.inputBundle || preflight?.inputBundle || null;
  const intentReviewSummary = input.intentReviewSummary || reviewResultStatus.intentReviewSummary || recordingGate?.intentReviewSummary || null;

  return {
    reviewResultStatus,
    recordingGate,
    reviewResult,
    receipt,
    preflightStatus,
    preflight,
    inputBundle,
    intentReviewSummary,
  };
}

export function buildTradingLabMockExecutionIntents(input = {}, options = {}) {
  const context = getStep142ReviewContext(input, options);
  const intentRows = input.intentRows || context.intentReviewSummary?.rows || context.preflightStatus?.mockOrderIntents || context.preflight?.mockOrderIntents || [];
  const priceSeries = getMockPriceSeries(options);
  const latestDate = getPriceDates(priceSeries).at(-1);
  const latestPriceMap = priceSeries[latestDate] || {};

  return (Array.isArray(intentRows) ? intentRows : []).map((intent, index) => {
    const symbol = intent.symbol || "SYMBOL_PLACEHOLDER";
    const side = intent.side || "mock_hold";
    const price = Number(latestPriceMap[symbol] || 1);
    const estimatedAmount = Number(intent.mockEstimatedAmount || Math.abs(Number(intent.weightGap || 0)) * 1000 || 0);
    const quantity = estimatedAmount > 0 && price > 0 ? roundQuantity(estimatedAmount / price) : 0;
    const fee = roundMoney(estimatedAmount * 0.001);
    const slippage = roundMoney(estimatedAmount * 0.0005);
    const status = intent.status === "blocked" ? "blocked" : intent.status === "validation_required" ? "validation_required" : "mock_only";

    return {
      mockExecutionIntentId: `step142_mock_execution_intent_${index + 1}`,
      sourceStep: "step142",
      mockOrderIntentId: intent.mockOrderIntentId || intent.rowId || `step140_mock_order_intent_${index + 1}`,
      symbol,
      side,
      mockQuantityPlaceholder: quantity,
      mockExecutionPricePlaceholder: price,
      mockEstimatedAmount: roundMoney(estimatedAmount),
      mockFeePlaceholder: fee,
      mockSlippagePlaceholder: slippage,
      status,
      reason: side === "mock_hold" ? "no_action" : status === "blocked" ? "risk_guard" : "mock_rebalance",
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      providerPayloadStored: false,
      orderPayloadStored: false,
      kisOrderPayloadCreated: false,
      kisExecutionPayloadCreated: false,
      rawProviderResponseStored: false,
      credentialStored: false,
      accountIdentifierStored: false,
      privatePathStored: false,
      hashValueStored: false,
      digestValueStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      tokenIssuanceAttempted: false,
      quoteRequestAttempted: false,
      networkCallAttempted: false,
      orderSubmissionAttempted: false,
      actualOrderCandidateCreated: false,
      actualOrderDraftCreated: false,
      actualExecutionCreated: false,
      executionRecordCreated: false,
      fillCreated: false,
      accountBalanceQueried: false,
      persistentStorageUsed: false,
      dbWriteUsed: false,
    };
  });
}

export function buildTradingLabMockFillPlanPlaceholders(input = {}, options = {}) {
  const intents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents(input, options);

  return (Array.isArray(intents) ? intents : []).map((intent, index) => ({
    mockFillPlanId: `step142_mock_fill_plan_${index + 1}`,
    sourceStep: "step142",
    mockExecutionIntentId: intent.mockExecutionIntentId || `step142_mock_execution_intent_${index + 1}`,
    symbol: intent.symbol || "SYMBOL_PLACEHOLDER",
    side: intent.side || "mock_hold",
    fillPolicy: "mock_close_price",
    fillTiming: "mock_same_day",
    expectedFillStatus: intent.status === "blocked" ? "blocked" : intent.status === "validation_required" ? "validation_required" : "mock_fill_candidate",
    mockPriceSource: "static_mock_series",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    kisExecutionPayloadCreated: false,
    rawProviderResponseStored: false,
  }));
}

export function buildTradingLabMockExecutionCashImpactPreview(input = {}, options = {}) {
  const context = getStep142ReviewContext(input, options);
  const intents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents(input, options);
  const startingCash = Number(input.startingCashPlaceholder ?? context.inputBundle?.cashPlaceholder ?? 0);
  const estimatedCashUsed = roundMoney(intents
    .filter((intent) => intent.side === "mock_buy")
    .reduce((sum, intent) => sum + Number(intent.mockEstimatedAmount || 0) + Number(intent.mockFeePlaceholder || 0) + Number(intent.mockSlippagePlaceholder || 0), 0));
  const estimatedCashReleased = roundMoney(intents
    .filter((intent) => intent.side === "mock_sell")
    .reduce((sum, intent) => sum + Math.max(0, Number(intent.mockEstimatedAmount || 0) - Number(intent.mockFeePlaceholder || 0) - Number(intent.mockSlippagePlaceholder || 0)), 0));
  const estimatedFee = roundMoney(intents.reduce((sum, intent) => sum + Number(intent.mockFeePlaceholder || 0), 0));
  const endingCash = roundMoney(startingCash - estimatedCashUsed + estimatedCashReleased);
  const warnings = [];
  if (!Number.isFinite(startingCash) || startingCash <= 0) warnings.push("mock_cash_placeholder_validation_required");
  if (endingCash < 0) warnings.push("mock_cash_reserve_validation_required");

  return {
    previewId: "step142_mock_execution_cash_impact_preview",
    sourceStep: "step142",
    status: warnings.length > 0 ? "validation_required" : "mock_only",
    startingCashPlaceholder: Number.isFinite(startingCash) ? startingCash : 0,
    estimatedCashUsed,
    estimatedCashReleased,
    estimatedFee,
    endingCashPlaceholder: endingCash,
    cashReserveStatus: warnings.length > 0 ? "validation_required" : "mock_only",
    warnings,
    redacted: true,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockExecutionPositionImpactPreview(input = {}, options = {}) {
  const context = getStep142ReviewContext(input, options);
  const intents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents(input, options);
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const positionMap = new Map((positionLedger.positions || []).map((position) => [position.symbol, position]));
  const allocationMap = new Map((allocationSummary.allocations || []).map((allocation) => [allocation.symbol, allocation]));
  const targetMap = new Map((context.inputBundle?.targetWeights || []).map((target) => [target.symbol, Number(target.weightPct || 0)]));

  const rows = (Array.isArray(intents) ? intents : []).map((intent, index) => {
    const currentPosition = positionMap.get(intent.symbol) || {};
    const currentAllocation = allocationMap.get(intent.symbol) || {};
    const currentQuantity = Number(currentPosition.quantity || 0);
    const quantityDelta = intent.side === "mock_buy"
      ? Number(intent.mockQuantityPlaceholder || 0)
      : intent.side === "mock_sell"
        ? -Number(intent.mockQuantityPlaceholder || 0)
        : 0;
    const projectedQuantity = roundQuantity(Math.max(0, currentQuantity + quantityDelta));
    const currentWeight = Number(currentAllocation.weightPct || 0);
    const targetWeight = Number(targetMap.get(intent.symbol) ?? intent.targetWeight ?? currentWeight);
    const projectedWeight = roundPct(currentWeight + (quantityDelta === 0 ? 0 : Math.sign(quantityDelta) * Math.min(Math.abs(targetWeight - currentWeight), 5)));

    return {
      rowId: `step142_mock_position_impact_${index + 1}`,
      sourceStep: "step142",
      symbol: intent.symbol || "SYMBOL_PLACEHOLDER",
      currentMockQuantity: currentQuantity,
      mockQuantityDelta: quantityDelta,
      projectedMockQuantity: projectedQuantity,
      currentWeight,
      projectedWeight,
      targetWeight,
      projectedWeightGap: roundPct(targetWeight - projectedWeight),
      status: intent.status || "mock_only",
      redacted: true,
      actualBalanceQueried: false,
      accountBalanceQueried: false,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
    };
  });
  const warningCount = rows.filter((row) => row.status === "validation_required").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;

  return {
    previewId: "step142_mock_execution_position_impact_preview",
    sourceStep: "step142",
    status: blockedCount > 0 ? "blocked" : warningCount > 0 || rows.length === 0 ? "validation_required" : "mock_only",
    rows,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockExecutionRiskGuardPreflight(input = {}, options = {}) {
  const context = getStep142ReviewContext(input, options);
  const intents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents(input, options);
  const riskLimits = context.inputBundle?.riskLimits || normalizeRiskLimitDraft();
  const cashPreview = input.cashImpactPreview || buildTradingLabMockExecutionCashImpactPreview({ ...input, mockExecutionIntents: intents }, options);
  const maxOrderAmount = Number(riskLimits.maxOrderAmount || 0);
  const maxDailyLossPct = Number(riskLimits.maxDailyLossPct || 0);
  const maxPositionWeightPct = Number(riskLimits.maxPositionWeightPct || 0);
  const blockers = [];
  const warnings = [...(cashPreview.warnings || [])];

  if (!riskLimits.killSwitchRequired) blockers.push("kill_switch_requirement_missing");
  if (!riskLimits.riskGateRequired) blockers.push("risk_gate_requirement_missing");
  if (!Number.isFinite(maxOrderAmount) || maxOrderAmount <= 0) warnings.push("max_order_amount_placeholder_validation_required");
  if (!Number.isFinite(maxDailyLossPct) || maxDailyLossPct <= 0) warnings.push("max_daily_loss_placeholder_validation_required");
  if (!Number.isFinite(maxPositionWeightPct) || maxPositionWeightPct <= 0) warnings.push("max_position_weight_placeholder_validation_required");
  const blockedExecutionIntentCount = intents.filter((intent) => intent.status === "blocked").length;
  const warningExecutionIntentCount = intents.filter((intent) => intent.status === "validation_required").length;
  if (blockedExecutionIntentCount > 0) blockers.push("mock_execution_intent_blocked");
  if (warningExecutionIntentCount > 0) warnings.push("mock_execution_intent_validation_required");
  if (intents.some((intent) => Number(intent.mockEstimatedAmount || 0) > maxOrderAmount && maxOrderAmount > 0)) {
    warnings.push("mock_execution_amount_exceeds_placeholder_limit");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_only";

  return {
    riskGuardId: "step142_mock_execution_risk_guard_preflight",
    sourceStep: "step142",
    status,
    maxPositionWeightStatus: maxPositionWeightPct > 0 ? "mock_only" : "validation_required",
    maxOrderAmountStatus: maxOrderAmount > 0 ? "mock_only" : "validation_required",
    maxDailyLossStatus: maxDailyLossPct > 0 ? "mock_only" : "validation_required",
    cashReserveStatus: cashPreview.cashReserveStatus || "validation_required",
    killSwitchRequired: true,
    riskGateRequired: true,
    mockExecutionIntentCount: intents.length,
    blockedExecutionIntentCount,
    warningExecutionIntentCount,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerMessages: summarizeReviewBlockers(uniqueBlockers),
    warningMessages: summarizeReviewBlockers(uniqueWarnings),
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockExecutionPreflight(input = {}, options = {}) {
  const context = getStep142ReviewContext(input, options);
  const executionIntents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents(input, options);
  const fillPlans = input.fillPlans || buildTradingLabMockFillPlanPlaceholders({ ...input, mockExecutionIntents: executionIntents }, options);
  const cashImpactPreview = input.cashImpactPreview || buildTradingLabMockExecutionCashImpactPreview({ ...input, mockExecutionIntents: executionIntents }, options);
  const positionImpactPreview = input.positionImpactPreview || buildTradingLabMockExecutionPositionImpactPreview({ ...input, mockExecutionIntents: executionIntents }, options);
  const riskGuard = input.riskGuard || buildTradingLabMockExecutionRiskGuardPreflight({ ...input, mockExecutionIntents: executionIntents, cashImpactPreview }, options);
  const blockers = [];
  const warnings = [];

  if (!context.reviewResult) blockers.push("mock_order_generation_review_result_missing");
  if (!context.receipt) blockers.push("mock_order_generation_review_receipt_missing");
  if (context.reviewResult && context.reviewResult.redacted !== true) blockers.push("mock_order_generation_review_result_not_redacted");
  if (context.receipt && context.receipt.redacted !== true) blockers.push("mock_order_generation_review_receipt_not_redacted");
  if (context.reviewResult && context.reviewResult.readinessImpact !== "none") blockers.push("review_result_readiness_impact_not_none");
  if (context.reviewResult && context.reviewResult.providerCallImpact !== "blocked") blockers.push("review_result_provider_call_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.orderSubmissionImpact !== "blocked") blockers.push("review_result_order_submission_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.liveTradingImpact !== "blocked") blockers.push("review_result_live_trading_impact_not_blocked");
  if (context.reviewResult?.reviewStatus === "blocked") blockers.push("mock_order_generation_review_result_blocked");
  if (context.reviewResult?.reviewStatus === "validation_required") warnings.push("mock_order_generation_review_result_validation_required");
  if (context.receipt?.nextAllowedStep && context.receipt.nextAllowedStep !== "mock_execution_preflight") blockers.push("review_receipt_next_step_not_mock_execution_preflight");
  if (!context.inputBundle) blockers.push("mock_execution_input_bundle_missing");
  if (context.inputBundle?.scope !== "mock_only") blockers.push("mock_execution_input_bundle_scope_not_mock_only");
  if (context.inputBundle && String(context.inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if ((context.inputBundle?.symbols || context.inputBundle?.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if (context.inputBundle?.priceSeriesStatus !== "available") warnings.push("mock_price_series_dependency_validation_required");
  if (!Number.isFinite(Number(context.inputBundle?.cashPlaceholder)) || Number(context.inputBundle?.cashPlaceholder) <= 0) warnings.push("mock_cash_placeholder_validation_required");
  if (input.mockPositionDependencyAvailable === false || options.mockPositionDependencyAvailable === false) warnings.push("mock_position_dependency_validation_required");
  if (context.preflight?.validation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (fillPlans.some((plan) => plan.expectedFillStatus === "blocked")) blockers.push("mock_fill_plan_blocked");
  if (fillPlans.some((plan) => plan.expectedFillStatus === "validation_required")) warnings.push("mock_fill_plan_validation_required");
  if (cashImpactPreview.status === "validation_required") warnings.push("mock_cash_impact_validation_required");
  if (positionImpactPreview.status === "blocked") blockers.push("mock_position_impact_blocked");
  if (positionImpactPreview.status === "validation_required") warnings.push("mock_position_impact_validation_required");
  if (riskGuard.status === "blocked") blockers.push("mock_execution_risk_guard_blocked");
  if (riskGuard.status === "validation_required") warnings.push("mock_execution_risk_guard_validation_required");
  if (executionIntents.some((intent) => intent.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (executionIntents.some((intent) => intent.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (executionIntents.some((intent) => intent.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (executionIntents.some((intent) => intent.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (executionIntents.some((intent) => intent.actualExecutionCreated !== false || intent.executionRecordCreated !== false || intent.fillCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (executionIntents.some((intent) => intent.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "mock_execution_candidate";

  return {
    validationId: "step142_mock_execution_preflight_validation",
    sourceStep: "step142",
    status,
    mockExecutionPreflightId: "step142_mock_execution_preflight",
    mockOrderGenerationReviewResultId: context.reviewResult?.mockOrderGenerationReviewResultId || "missing_mock_order_generation_review_result",
    mockOrderGenerationPreflightId: context.reviewResult?.mockOrderGenerationPreflightId || "missing_mock_order_generation_preflight",
    mockRunCandidateId: context.reviewResult?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: context.reviewResult?.inputBundleId || context.inputBundle?.inputBundleId || "missing_input_bundle",
    strategyDraftId: context.reviewResult?.strategyDraftId || context.inputBundle?.strategyDraftId || "missing_strategy_draft",
    mode: context.inputBundle?.mode || "mock",
    scope: "mock_only",
    executionIntentStatus: executionIntents.some((intent) => intent.status === "blocked") ? "blocked" : executionIntents.some((intent) => intent.status === "validation_required") ? "validation_required" : "mock_only",
    fillPlanStatus: fillPlans.some((plan) => plan.expectedFillStatus === "blocked") ? "blocked" : fillPlans.some((plan) => plan.expectedFillStatus === "validation_required") ? "validation_required" : "mock_only",
    cashImpactStatus: cashImpactPreview.status,
    positionImpactStatus: positionImpactPreview.status,
    riskGuardStatus: riskGuard.status,
    priceSeriesStatus: context.inputBundle?.priceSeriesStatus || "validation_required",
    executionIntentCount: executionIntents.length,
    blockedExecutionIntentCount: riskGuard.blockedExecutionIntentCount || 0,
    warningExecutionIntentCount: riskGuard.warningExecutionIntentCount || 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_execution_review",
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step142_mock_execution_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockExecutionPreflightResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockExecutionPreflight(input, options);

  return {
    mockExecutionPreflightId: validation.mockExecutionPreflightId,
    sourceStep: "step142",
    mockOrderGenerationReviewResultId: validation.mockOrderGenerationReviewResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    executionIntentCount: validation.executionIntentCount,
    blockedExecutionIntentCount: validation.blockedExecutionIntentCount,
    warningExecutionIntentCount: validation.warningExecutionIntentCount,
    fillPlanStatus: validation.fillPlanStatus,
    cashImpactStatus: validation.cashImpactStatus,
    positionImpactStatus: validation.positionImpactStatus,
    riskGuardStatus: validation.riskGuardStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_execution_review",
    blockers: validation.blockers,
    warnings: validation.warnings,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockExecutionPreflight(input = {}, options = {}) {
  const mockOrderGenerationReviewResultStatus = input.mockOrderGenerationReviewResultStatus || buildAdminTradingLabMockOrderGenerationReviewResultStatus(input, options);
  const mockExecutionIntents = input.mockExecutionIntents || buildTradingLabMockExecutionIntents({ ...input, mockOrderGenerationReviewResultStatus }, options);
  const fillPlans = input.fillPlans || buildTradingLabMockFillPlanPlaceholders({ ...input, mockOrderGenerationReviewResultStatus, mockExecutionIntents }, options);
  const cashImpactPreview = input.cashImpactPreview || buildTradingLabMockExecutionCashImpactPreview({ ...input, mockOrderGenerationReviewResultStatus, mockExecutionIntents }, options);
  const positionImpactPreview = input.positionImpactPreview || buildTradingLabMockExecutionPositionImpactPreview({ ...input, mockOrderGenerationReviewResultStatus, mockExecutionIntents }, options);
  const riskGuard = input.riskGuard || buildTradingLabMockExecutionRiskGuardPreflight({ ...input, mockOrderGenerationReviewResultStatus, mockExecutionIntents, cashImpactPreview }, options);
  const validation = input.validation || validateTradingLabMockExecutionPreflight(
    { ...input, mockOrderGenerationReviewResultStatus, mockExecutionIntents, fillPlans, cashImpactPreview, positionImpactPreview, riskGuard },
    options,
  );
  const result = input.result || buildTradingLabMockExecutionPreflightResult({ ...input, validation }, options);

  return {
    mockExecutionPreflightId: "step142_mock_execution_preflight",
    sourceStep: "step142",
    status: result.status,
    scope: "mock_only",
    mockOrderGenerationReviewResultStatus,
    mockExecutionIntents,
    fillPlans,
    cashImpactPreview,
    positionImpactPreview,
    riskGuard,
    validation,
    result,
    blockerSummary: {
      blockerSummaryId: "step142_mock_execution_preflight_blocker_summary",
      sourceStep: "step142",
      status: result.status,
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    flags: { ...STEP142_ADMIN_TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step142_mock_execution_preflight_v1" }),
  };
}

export function buildAdminTradingLabMockExecutionPreflightStatus(input = {}, options = {}) {
  const preflight = input.preflight || buildTradingLabMockExecutionPreflight(input, options);

  return {
    ok: true,
    step: "Step 142: Admin trading lab mock execution preflight",
    status: "admin_only_trading_lab_mock_execution_preflight_fail_closed",
    mockExecutionPreflightModel: TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_MODEL,
    mockExecutionIntentModel: TRADING_LAB_MOCK_EXECUTION_INTENT_MODEL,
    mockFillPlanPlaceholderModel: TRADING_LAB_MOCK_FILL_PLAN_PLACEHOLDER_MODEL,
    mockExecutionRiskGuardPreflightModel: TRADING_LAB_MOCK_EXECUTION_RISK_GUARD_PREFLIGHT_MODEL,
    mockExecutionCashImpactPreviewModel: TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_PREVIEW_MODEL,
    mockExecutionPositionImpactPreviewModel: TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_PREVIEW_MODEL,
    mockExecutionPreflightResultSchema: TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_RESULT_SCHEMA,
    preflight,
    validation: preflight.validation,
    result: preflight.result,
    mockExecutionIntents: preflight.mockExecutionIntents,
    fillPlans: preflight.fillPlans,
    cashImpactPreview: preflight.cashImpactPreview,
    positionImpactPreview: preflight.positionImpactPreview,
    riskGuard: preflight.riskGuard,
    blockerSummary: preflight.blockerSummary,
    flags: { ...STEP142_ADMIN_TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep143ExecutionPreflightContext(input = {}, options = {}) {
  const mockExecutionPreflightStatus = input.mockExecutionPreflightStatus || buildAdminTradingLabMockExecutionPreflightStatus(input, options);
  const preflight = input.preflight || mockExecutionPreflightStatus.preflight || null;
  const preflightResult = input.preflightResult || mockExecutionPreflightStatus.result || preflight?.result || null;
  const validation = input.validation || mockExecutionPreflightStatus.validation || preflight?.validation || {};
  const mockExecutionIntents = input.mockExecutionIntents || mockExecutionPreflightStatus.mockExecutionIntents || preflight?.mockExecutionIntents || [];
  const fillPlans = input.fillPlans || mockExecutionPreflightStatus.fillPlans || preflight?.fillPlans || [];
  const cashImpactPreview = input.cashImpactPreview || mockExecutionPreflightStatus.cashImpactPreview || preflight?.cashImpactPreview || {};
  const positionImpactPreview = input.positionImpactPreview || mockExecutionPreflightStatus.positionImpactPreview || preflight?.positionImpactPreview || {};
  const riskGuard = input.riskGuard || mockExecutionPreflightStatus.riskGuard || preflight?.riskGuard || {};
  const mockOrderGenerationReviewResultStatus = input.mockOrderGenerationReviewResultStatus || preflight?.mockOrderGenerationReviewResultStatus || null;
  const inputBundle = input.inputBundle
    || preflight?.mockOrderGenerationReviewResultStatus?.recordingGate?.mockOrderGenerationPreflightStatus?.preflight?.inputBundle
    || mockOrderGenerationReviewResultStatus?.recordingGate?.mockOrderGenerationPreflightStatus?.preflight?.inputBundle
    || null;

  return {
    mockExecutionPreflightStatus,
    preflight,
    preflightResult,
    validation,
    mockExecutionIntents,
    fillPlans,
    cashImpactPreview,
    positionImpactPreview,
    riskGuard,
    mockOrderGenerationReviewResultStatus,
    inputBundle,
  };
}

export function buildTradingLabMockExecutionIntentReviewSummary(input = {}, options = {}) {
  const context = getStep143ExecutionPreflightContext(input, options);
  const rows = (Array.isArray(context.mockExecutionIntents) ? context.mockExecutionIntents : []).map((intent, index) => ({
    rowId: `step143_mock_execution_intent_review_${index + 1}`,
    sourceStep: "step143",
    mockExecutionIntentId: intent.mockExecutionIntentId || `step142_mock_execution_intent_${index + 1}`,
    symbol: intent.symbol || "SYMBOL_PLACEHOLDER",
    sideLabel: intent.side === "mock_buy" ? "mock buy intent" : intent.side === "mock_sell" ? "mock sell intent" : "mock hold intent",
    fillPlanBasis: "static mock price series only",
    summary: `${intent.symbol || "SYMBOL_PLACEHOLDER"} mock execution intent reviewed without live fill creation`,
    status: intent.status === "blocked" ? "blocked" : intent.status === "validation_required" ? "validation_required" : "mock_only",
    redacted: true,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    actualBalanceQueried: false,
    kisExecutionPayloadCreated: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
  }));
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const warningCount = rows.filter((row) => row.status === "validation_required").length;

  return {
    summaryId: "step143_mock_execution_intent_review_summary",
    sourceStep: "step143",
    status: blockedCount > 0 ? "blocked" : warningCount > 0 ? "validation_required" : "mock_only",
    executionIntentCount: rows.length,
    blockedExecutionIntentCount: blockedCount,
    warningExecutionIntentCount: warningCount,
    rows,
    messages: [
      "Mock execution intents only.",
      "No actual execution record created.",
      "No KIS execution payload created.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    actualBalanceQueried: false,
    kisExecutionPayloadCreated: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockFillPlanReviewSummary(input = {}, options = {}) {
  const context = getStep143ExecutionPreflightContext(input, options);
  const rows = (Array.isArray(context.fillPlans) ? context.fillPlans : []).map((plan, index) => ({
    rowId: `step143_mock_fill_plan_review_${index + 1}`,
    sourceStep: "step143",
    mockFillPlanId: plan.mockFillPlanId || `step142_mock_fill_plan_${index + 1}`,
    symbol: plan.symbol || "SYMBOL_PLACEHOLDER",
    side: plan.side || "mock_hold",
    fillPolicy: plan.fillPolicy || "mock_close_price",
    fillTiming: plan.fillTiming || "mock_same_day",
    mockPriceSource: plan.mockPriceSource || "static_mock_series",
    status: plan.expectedFillStatus === "blocked" ? "blocked" : plan.expectedFillStatus === "validation_required" ? "validation_required" : "mock_only",
    redacted: true,
    providerQuoteQueried: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    fillCreated: false,
  }));
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const warningCount = rows.filter((row) => row.status === "validation_required").length;

  return {
    summaryId: "step143_mock_fill_plan_review_summary",
    sourceStep: "step143",
    status: blockedCount > 0 ? "blocked" : warningCount > 0 ? "validation_required" : "mock_only",
    fillPlanCount: rows.length,
    blockedFillPlanCount: blockedCount,
    warningFillPlanCount: warningCount,
    rows,
    messages: [
      "Fill plan uses static mock price series only.",
      "No provider quote query.",
      "No KIS execution lookup.",
    ],
    redacted: true,
    providerQuoteQueried: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    fillCreated: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockExecutionCashImpactReviewSummary(input = {}, options = {}) {
  const context = getStep143ExecutionPreflightContext(input, options);
  const cashImpactPreview = context.cashImpactPreview || {};
  return {
    summaryId: "step143_mock_execution_cash_impact_review_summary",
    sourceStep: "step143",
    status: cashImpactPreview.status || "validation_required",
    startingCashPlaceholder: Number(cashImpactPreview.startingCashPlaceholder || 0),
    estimatedCashUsed: Number(cashImpactPreview.estimatedCashUsed || 0),
    estimatedCashReleased: Number(cashImpactPreview.estimatedCashReleased || 0),
    estimatedFee: Number(cashImpactPreview.estimatedFee || 0),
    endingCashPlaceholder: Number(cashImpactPreview.endingCashPlaceholder || 0),
    cashReserveStatus: cashImpactPreview.cashReserveStatus || "validation_required",
    messages: [
      "Mock cash impact only.",
      "No actual cash balance query.",
      "No persistent DB write.",
    ],
    redacted: true,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockExecutionPositionImpactReviewSummary(input = {}, options = {}) {
  const context = getStep143ExecutionPreflightContext(input, options);
  const positionImpactPreview = context.positionImpactPreview || {};
  const rows = Array.isArray(positionImpactPreview.rows) ? positionImpactPreview.rows : [];
  return {
    summaryId: "step143_mock_execution_position_impact_review_summary",
    sourceStep: "step143",
    status: positionImpactPreview.status || "validation_required",
    rowCount: rows.length,
    rows: rows.slice(0, 5).map((row, index) => ({
      rowId: `step143_mock_position_impact_review_${index + 1}`,
      sourceStep: "step143",
      symbol: row.symbol || "SYMBOL_PLACEHOLDER",
      projectedMockQuantity: Number(row.projectedMockQuantity || 0),
      projectedWeight: Number(row.projectedWeight || 0),
      projectedWeightGap: Number(row.projectedWeightGap || 0),
      status: row.status || "mock_only",
      redacted: true,
      actualBalanceQueried: false,
    })),
    messages: [
      "Mock position impact preview only.",
      "No actual position balance query.",
      "No live fill or execution record.",
    ],
    redacted: true,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockExecutionReviewResult(input = {}, options = {}) {
  const context = getStep143ExecutionPreflightContext(input, options);
  const intentReviewSummary = input.intentReviewSummary || buildTradingLabMockExecutionIntentReviewSummary(input, options);
  const fillPlanReviewSummary = input.fillPlanReviewSummary || buildTradingLabMockFillPlanReviewSummary(input, options);
  const cashImpactReviewSummary = input.cashImpactReviewSummary || buildTradingLabMockExecutionCashImpactReviewSummary(input, options);
  const positionImpactReviewSummary = input.positionImpactReviewSummary || buildTradingLabMockExecutionPositionImpactReviewSummary(input, options);
  const blockers = [];
  const warnings = [];

  if (!context.preflightResult) blockers.push("mock_execution_preflight_result_missing");
  if (context.preflightResult && context.preflightResult.redacted !== true) blockers.push("mock_execution_preflight_result_not_redacted");
  if (context.preflightResult && context.preflightResult.scope !== "mock_only") blockers.push("mock_execution_preflight_scope_not_mock_only");
  if (context.preflightResult && context.preflightResult.readinessImpact !== "none") blockers.push("preflight_readiness_impact_not_none");
  if (context.preflightResult && context.preflightResult.providerCallImpact !== "blocked") blockers.push("preflight_provider_call_impact_not_blocked");
  if (context.preflightResult && context.preflightResult.orderSubmissionImpact !== "blocked") blockers.push("preflight_order_submission_impact_not_blocked");
  if (context.preflightResult && context.preflightResult.liveTradingImpact !== "blocked") blockers.push("preflight_live_trading_impact_not_blocked");
  if (context.preflightResult?.status === "blocked") blockers.push("mock_execution_preflight_blocked");
  if (context.preflightResult?.status === "validation_required") warnings.push("mock_execution_preflight_validation_required");
  if (containsUnsafeReviewResultInput(input.reviewInput || input.operatorReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");
  if (context.inputBundle && String(context.inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if ((context.inputBundle?.symbols || context.inputBundle?.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if (context.validation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (context.riskGuard?.status === "blocked") blockers.push("mock_execution_risk_guard_blocked");
  if (context.riskGuard?.status === "validation_required") warnings.push("mock_execution_risk_guard_validation_required");
  if (intentReviewSummary.status === "blocked") blockers.push("mock_execution_intent_review_blocked");
  if (intentReviewSummary.status === "validation_required") warnings.push("mock_execution_intent_review_validation_required");
  if (fillPlanReviewSummary.status === "blocked") blockers.push("mock_fill_plan_review_blocked");
  if (fillPlanReviewSummary.status === "validation_required") warnings.push("mock_fill_plan_review_validation_required");
  if (cashImpactReviewSummary.status === "blocked") blockers.push("mock_cash_impact_review_blocked");
  if (cashImpactReviewSummary.status === "validation_required") warnings.push("mock_cash_impact_review_validation_required");
  if (positionImpactReviewSummary.status === "blocked") blockers.push("mock_position_impact_review_blocked");
  if (positionImpactReviewSummary.status === "validation_required") warnings.push("mock_position_impact_review_validation_required");
  if (context.mockExecutionIntents.some((intent) => intent.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (context.mockExecutionIntents.some((intent) => intent.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (context.mockExecutionIntents.some((intent) => intent.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (context.mockExecutionIntents.some((intent) => intent.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (context.mockExecutionIntents.some((intent) => intent.actualExecutionCreated !== false || intent.executionRecordCreated !== false || intent.fillCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (context.mockExecutionIntents.some((intent) => intent.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";
  const decision = reviewStatus === "recorded" ? "mock_execution_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected";

  return {
    validationId: "step143_mock_execution_review_result_validation",
    sourceStep: "step143",
    reviewStatus,
    decision,
    mockExecutionReviewResultId: "step143_mock_execution_review_result",
    mockExecutionPreflightId: context.preflightResult?.mockExecutionPreflightId || "missing_mock_execution_preflight",
    mockOrderGenerationReviewResultId: context.preflightResult?.mockOrderGenerationReviewResultId || context.validation?.mockOrderGenerationReviewResultId || "missing_mock_order_generation_review_result",
    mockOrderGenerationPreflightId: context.validation?.mockOrderGenerationPreflightId || "missing_mock_order_generation_preflight",
    mockRunCandidateId: context.preflightResult?.mockRunCandidateId || context.validation?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: context.preflightResult?.inputBundleId || context.validation?.inputBundleId || "missing_input_bundle",
    strategyDraftId: context.preflightResult?.strategyDraftId || context.validation?.strategyDraftId || "missing_strategy_draft",
    executionIntentCount: intentReviewSummary.executionIntentCount || 0,
    blockedExecutionIntentCount: context.preflightResult?.blockedExecutionIntentCount || intentReviewSummary.blockedExecutionIntentCount || 0,
    warningExecutionIntentCount: context.preflightResult?.warningExecutionIntentCount || intentReviewSummary.warningExecutionIntentCount || 0,
    fillPlanStatus: context.preflightResult?.fillPlanStatus || fillPlanReviewSummary.status || "validation_required",
    cashImpactStatus: context.preflightResult?.cashImpactStatus || cashImpactReviewSummary.status || "validation_required",
    positionImpactStatus: context.preflightResult?.positionImpactStatus || positionImpactReviewSummary.status || "validation_required",
    riskGuardStatus: context.preflightResult?.riskGuardStatus || context.riskGuard?.status || "blocked",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step143_mock_execution_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockExecutionReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockExecutionReviewResult(input, options);
  return {
    summaryId: "step143_mock_execution_review_decision_summary",
    sourceStep: "step143",
    decision: validation.decision,
    reviewStatus: validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    blockerMessages: validation.blockerSummary,
    warningMessages: validation.warningSummary,
    messages: [
      "Mock execution intents reviewed only.",
      "No actual execution record created.",
      "KIS calls and order submission remain blocked.",
      "External order authority evidence is still required.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockExecutionReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockExecutionReviewResult(input, options);
  return {
    mockExecutionReviewResultId: validation.mockExecutionReviewResultId,
    sourceStep: "step143",
    mockExecutionPreflightId: validation.mockExecutionPreflightId,
    mockOrderGenerationReviewResultId: validation.mockOrderGenerationReviewResultId,
    mockOrderGenerationPreflightId: validation.mockOrderGenerationPreflightId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_recorded_at",
    reviewedBy: "admin_placeholder",
    executionIntentCount: validation.executionIntentCount,
    blockedExecutionIntentCount: validation.blockedExecutionIntentCount,
    warningExecutionIntentCount: validation.warningExecutionIntentCount,
    fillPlanStatus: validation.fillPlanStatus,
    cashImpactStatus: validation.cashImpactStatus,
    positionImpactStatus: validation.positionImpactStatus,
    riskGuardStatus: validation.riskGuardStatus,
    summary: validation.reviewStatus === "recorded" ? "mock execution review recorded" : validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockExecutionReviewReceipt(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockExecutionReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockExecutionReviewResult({ ...input, validation }, options);

  return {
    receiptId: "step143_mock_execution_review_receipt",
    sourceStep: "step143",
    mockExecutionReviewResultId: reviewResult.mockExecutionReviewResultId,
    mockExecutionPreflightId: reviewResult.mockExecutionPreflightId,
    mockRunCandidateId: reviewResult.mockRunCandidateId,
    inputBundleId: reviewResult.inputBundleId,
    strategyDraftId: reviewResult.strategyDraftId,
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "placeholder_recorded_at",
    executionIntentCount: reviewResult.executionIntentCount,
    blockedExecutionIntentCount: reviewResult.blockedExecutionIntentCount,
    warningExecutionIntentCount: reviewResult.warningExecutionIntentCount,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockExecutionReviewResultRecordingGate(input = {}, options = {}) {
  const mockExecutionPreflightStatus = input.mockExecutionPreflightStatus || buildAdminTradingLabMockExecutionPreflightStatus(input, options);
  const intentReviewSummary = input.intentReviewSummary || buildTradingLabMockExecutionIntentReviewSummary({ ...input, mockExecutionPreflightStatus }, options);
  const fillPlanReviewSummary = input.fillPlanReviewSummary || buildTradingLabMockFillPlanReviewSummary({ ...input, mockExecutionPreflightStatus }, options);
  const cashImpactReviewSummary = input.cashImpactReviewSummary || buildTradingLabMockExecutionCashImpactReviewSummary({ ...input, mockExecutionPreflightStatus }, options);
  const positionImpactReviewSummary = input.positionImpactReviewSummary || buildTradingLabMockExecutionPositionImpactReviewSummary({ ...input, mockExecutionPreflightStatus }, options);
  const validation = input.validation || validateTradingLabMockExecutionReviewResult(
    { ...input, mockExecutionPreflightStatus, intentReviewSummary, fillPlanReviewSummary, cashImpactReviewSummary, positionImpactReviewSummary },
    options,
  );
  const reviewResult = input.reviewResult || buildTradingLabMockExecutionReviewResult({ ...input, validation }, options);
  const receipt = input.receipt || buildTradingLabMockExecutionReviewReceipt({ ...input, validation, reviewResult }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockExecutionReviewDecisionSummary({ ...input, validation }, options);

  return {
    recordingGateId: "step143_mock_execution_review_result_recording_gate",
    sourceStep: "step143",
    status: validation.reviewStatus,
    decision: validation.decision,
    mockExecutionPreflightStatus,
    intentReviewSummary,
    fillPlanReviewSummary,
    cashImpactReviewSummary,
    positionImpactReviewSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
    blockerSummary: {
      summaryId: "step143_mock_execution_review_blocker_summary",
      sourceStep: "step143",
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    mockHistory: [
      {
        historyId: "step143_mock_execution_review_history_1",
        sourceStep: "step143",
        reviewStatus: validation.reviewStatus,
        decision: validation.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_fill_simulation_preflight",
      },
    ],
    flags: { ...STEP143_ADMIN_TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step143_mock_execution_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabMockExecutionReviewResultStatus(input = {}, options = {}) {
  const recordingGate = input.recordingGate || buildTradingLabMockExecutionReviewResultRecordingGate(input, options);

  return {
    ok: true,
    step: "Step 143: Admin trading lab mock execution review result recording gate",
    status: "admin_only_trading_lab_mock_execution_review_result_recording_gate_fail_closed",
    mockExecutionReviewResultModel: TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_MODEL,
    mockExecutionReviewReceiptSchema: TRADING_LAB_MOCK_EXECUTION_REVIEW_RECEIPT_SCHEMA,
    mockExecutionIntentReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_INTENT_REVIEW_SUMMARY_MODEL,
    mockFillPlanReviewSummaryModel: TRADING_LAB_MOCK_FILL_PLAN_REVIEW_SUMMARY_MODEL,
    mockExecutionCashImpactReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_REVIEW_SUMMARY_MODEL,
    mockExecutionPositionImpactReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_REVIEW_SUMMARY_MODEL,
    mockExecutionReviewDecisionSummaryModel: TRADING_LAB_MOCK_EXECUTION_REVIEW_DECISION_SUMMARY_MODEL,
    recordingGate,
    validation: recordingGate.validation,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    intentReviewSummary: recordingGate.intentReviewSummary,
    fillPlanReviewSummary: recordingGate.fillPlanReviewSummary,
    cashImpactReviewSummary: recordingGate.cashImpactReviewSummary,
    positionImpactReviewSummary: recordingGate.positionImpactReviewSummary,
    decisionSummary: recordingGate.decisionSummary,
    blockerSummary: recordingGate.blockerSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP143_ADMIN_TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

const ALLOWED_MOCK_FILL_POLICIES = Object.freeze(["mock_close_price", "mock_vwap_placeholder", "mock_mid_price_placeholder"]);
const ALLOWED_MOCK_FILL_TIMINGS = Object.freeze(["mock_same_day", "mock_next_open_placeholder"]);

function getStep144ExecutionReviewContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockExecutionReviewResultStatus");
  const mockExecutionReviewResultStatus = hasReviewStatus
    ? input.mockExecutionReviewResultStatus
    : buildAdminTradingLabMockExecutionReviewResultStatus(input, options);
  const recordingGate = input.recordingGate || mockExecutionReviewResultStatus?.recordingGate || null;
  const reviewResult = input.reviewResult || mockExecutionReviewResultStatus?.reviewResult || recordingGate?.reviewResult || null;
  const receipt = input.receipt || mockExecutionReviewResultStatus?.receipt || recordingGate?.receipt || null;
  const mockExecutionPreflightStatus = input.mockExecutionPreflightStatus || recordingGate?.mockExecutionPreflightStatus || null;
  const executionPreflight = input.executionPreflight || mockExecutionPreflightStatus?.preflight || null;
  const executionValidation = input.executionValidation || mockExecutionPreflightStatus?.validation || executionPreflight?.validation || {};
  const mockExecutionIntents = input.mockExecutionIntents || mockExecutionPreflightStatus?.mockExecutionIntents || executionPreflight?.mockExecutionIntents || [];
  const fillPlans = input.fillPlans || mockExecutionPreflightStatus?.fillPlans || executionPreflight?.fillPlans || [];
  const riskGuard = input.riskGuard || mockExecutionPreflightStatus?.riskGuard || executionPreflight?.riskGuard || {};
  const cashImpactPreview = input.cashImpactPreview || mockExecutionPreflightStatus?.cashImpactPreview || executionPreflight?.cashImpactPreview || {};
  const positionImpactPreview = input.positionImpactPreview || mockExecutionPreflightStatus?.positionImpactPreview || executionPreflight?.positionImpactPreview || {};
  const inputBundle = input.inputBundle
    || executionPreflight?.mockOrderGenerationReviewResultStatus?.recordingGate?.mockOrderGenerationPreflightStatus?.preflight?.inputBundle
    || null;

  return {
    mockExecutionReviewResultStatus,
    recordingGate,
    reviewResult,
    receipt,
    mockExecutionPreflightStatus,
    executionPreflight,
    executionValidation,
    mockExecutionIntents,
    fillPlans,
    riskGuard,
    cashImpactPreview,
    positionImpactPreview,
    inputBundle,
  };
}

export function buildTradingLabMockFillSimulationCandidates(input = {}, options = {}) {
  const context = getStep144ExecutionReviewContext(input, options);
  const intents = Array.isArray(input.mockExecutionIntents) ? input.mockExecutionIntents : context.mockExecutionIntents;
  const fillPlans = Array.isArray(input.fillPlans) ? input.fillPlans : context.fillPlans;
  const priceSeries = getMockPriceSeries(options);
  const latestDate = getPriceDates(priceSeries).at(-1);
  const latestPriceMap = priceSeries[latestDate] || {};

  return (Array.isArray(intents) ? intents : []).map((intent, index) => {
    const plan = fillPlans[index] || {};
    const symbol = intent.symbol || plan.symbol || "SYMBOL_PLACEHOLDER";
    const quantity = Math.max(0, Number(intent.mockQuantityPlaceholder || 0));
    const fillPrice = Number(intent.mockExecutionPricePlaceholder || latestPriceMap[symbol] || 1);
    const grossAmount = roundMoney(quantity * fillPrice);
    const slippage = roundMoney(grossAmount * 0.0005);
    const fee = roundMoney(grossAmount * 0.001);
    const side = intent.side || plan.side || "mock_hold";
    const netAmount = side === "mock_sell"
      ? roundMoney(Math.max(0, grossAmount - slippage - fee))
      : side === "mock_buy"
        ? roundMoney(grossAmount + slippage + fee)
        : 0;
    const fillPolicy = plan.fillPolicy || "mock_close_price";
    const fillTiming = plan.fillTiming || "mock_same_day";
    const mockPriceSource = plan.mockPriceSource || "static_mock_series";
    const status = intent.status === "blocked" || plan.expectedFillStatus === "blocked"
      ? "blocked"
      : intent.status === "validation_required" || plan.expectedFillStatus === "validation_required"
        ? "validation_required"
        : "mock_only";

    return {
      mockFillSimulationCandidateId: `step144_mock_fill_simulation_candidate_${index + 1}`,
      sourceStep: "step144",
      mockExecutionIntentId: intent.mockExecutionIntentId || plan.mockExecutionIntentId || `step142_mock_execution_intent_${index + 1}`,
      symbol,
      side,
      mockQuantityPlaceholder: roundQuantity(quantity),
      fillPolicy,
      fillTiming,
      mockPriceSource,
      mockFillPricePlaceholder: fillPrice,
      mockSlippagePlaceholder: slippage,
      mockFeePlaceholder: fee,
      mockGrossAmount: grossAmount,
      mockNetAmount: netAmount,
      status,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      providerPayloadStored: false,
      orderPayloadStored: false,
      kisOrderPayloadCreated: false,
      kisExecutionPayloadCreated: false,
      kisFillPayloadCreated: false,
      rawProviderResponseStored: false,
      credentialStored: false,
      accountIdentifierStored: false,
      privatePathStored: false,
      hashValueStored: false,
      digestValueStored: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      tokenIssuanceAttempted: false,
      quoteRequestAttempted: false,
      networkCallAttempted: false,
      orderSubmissionAttempted: false,
      actualOrderCandidateCreated: false,
      actualOrderDraftCreated: false,
      actualExecutionCreated: false,
      executionRecordCreated: false,
      actualFillRecordCreated: false,
      fillRecordCreated: false,
      fillCreated: false,
      accountBalanceQueried: false,
      persistentStorageUsed: false,
      dbWriteUsed: false,
    };
  });
}

export function validateTradingLabMockFillPolicyAndPriceSource(input = {}, options = {}) {
  const candidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates(input, options);
  const blockers = [];
  const warnings = [];

  for (const candidate of candidates) {
    if (!ALLOWED_MOCK_FILL_POLICIES.includes(candidate.fillPolicy)) blockers.push("invalid_mock_fill_policy");
    if (!ALLOWED_MOCK_FILL_TIMINGS.includes(candidate.fillTiming)) blockers.push("invalid_mock_fill_timing");
    if (candidate.mockPriceSource !== "static_mock_series") blockers.push("non_mock_price_source_rejected");
    if (!Number.isFinite(Number(candidate.mockFillPricePlaceholder)) || Number(candidate.mockFillPricePlaceholder) <= 0) warnings.push("mock_fill_price_placeholder_validation_required");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_only";

  return {
    validationId: "step144_mock_fill_policy_price_source_validation",
    sourceStep: "step144",
    status,
    fillPolicyStatus: uniqueBlockers.some((blocker) => blocker.includes("fill_policy") || blocker.includes("fill_timing")) ? "blocked" : "mock_only",
    fillPriceSourceStatus: uniqueBlockers.includes("non_mock_price_source_rejected") ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_only",
    allowedFillPolicies: [...ALLOWED_MOCK_FILL_POLICIES],
    allowedFillTimings: [...ALLOWED_MOCK_FILL_TIMINGS],
    allowedPriceSource: "static_mock_series",
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    redacted: true,
    providerQuoteUsed: false,
    providerQuoteQueried: false,
    kisQuoteQueryAttempted: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualFillPriceLookupAttempted: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockFillSlippageFeePreview(input = {}, options = {}) {
  const candidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates(input, options);
  const mockGrossAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockGrossAmount || 0), 0));
  const mockSlippageAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockSlippagePlaceholder || 0), 0));
  const mockFeeAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockFeePlaceholder || 0), 0));
  const mockNetAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockNetAmount || 0), 0));
  const warnings = [];
  if (candidates.length === 0) warnings.push("mock_fill_candidate_missing");
  if (candidates.some((candidate) => candidate.status === "validation_required")) warnings.push("mock_fill_candidate_validation_required");

  return {
    previewId: "step144_mock_fill_slippage_fee_preview",
    sourceStep: "step144",
    status: candidates.some((candidate) => candidate.status === "blocked") ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only",
    mockFillPricePlaceholder: Number(candidates[0]?.mockFillPricePlaceholder || 0),
    mockSlippageRate: 0.0005,
    mockSlippageAmount,
    mockFeeRate: 0.001,
    mockFeeAmount,
    mockGrossAmount,
    mockNetAmount,
    candidateCount: candidates.length,
    warnings,
    redacted: true,
    actualFeeScheduleQueried: false,
    actualFillPriceLookupAttempted: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
  };
}

export function validateTradingLabMockFillCashImpact(input = {}, options = {}) {
  const context = getStep144ExecutionReviewContext(input, options);
  const candidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates(input, options);
  const startingCash = Number(input.startingCashPlaceholder ?? context.cashImpactPreview?.startingCashPlaceholder ?? context.inputBundle?.cashPlaceholder ?? 0);
  const buyImpact = candidates
    .filter((candidate) => candidate.side === "mock_buy")
    .reduce((sum, candidate) => sum + Number(candidate.mockNetAmount || 0), 0);
  const sellImpact = candidates
    .filter((candidate) => candidate.side === "mock_sell")
    .reduce((sum, candidate) => sum + Number(candidate.mockNetAmount || 0), 0);
  const mockGrossAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockGrossAmount || 0), 0));
  const mockFeeAmount = roundMoney(candidates.reduce((sum, candidate) => sum + Number(candidate.mockFeePlaceholder || 0), 0));
  const mockNetCashImpact = roundMoney(sellImpact - buyImpact);
  const projectedCash = roundMoney(startingCash + mockNetCashImpact);
  const warnings = [];
  if (!Number.isFinite(startingCash) || startingCash <= 0) warnings.push("mock_cash_placeholder_validation_required");
  if (projectedCash < 0) warnings.push("mock_cash_reserve_validation_required");

  return {
    validationId: "step144_mock_fill_cash_impact_validation",
    sourceStep: "step144",
    status: warnings.length > 0 ? "validation_required" : "mock_only",
    startingCashPlaceholder: Number.isFinite(startingCash) ? startingCash : 0,
    mockGrossAmount,
    mockFeeAmount,
    mockNetCashImpact,
    projectedCashPlaceholder: projectedCash,
    cashReserveStatus: warnings.length > 0 ? "validation_required" : "mock_only",
    warnings,
    redacted: true,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillPositionImpact(input = {}, options = {}) {
  const context = getStep144ExecutionReviewContext(input, options);
  const candidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates(input, options);
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const positionMap = new Map((positionLedger.positions || []).map((position) => [position.symbol, position]));
  const allocationMap = new Map((allocationSummary.allocations || []).map((allocation) => [allocation.symbol, allocation]));
  const targetMap = new Map((context.inputBundle?.targetWeights || []).map((target) => [target.symbol, Number(target.weightPct || 0)]));

  const rows = candidates.map((candidate, index) => {
    const currentPosition = positionMap.get(candidate.symbol) || {};
    const currentAllocation = allocationMap.get(candidate.symbol) || {};
    const currentMockQuantity = Number(currentPosition.quantity || 0);
    const fillQuantity = candidate.side === "mock_buy"
      ? Number(candidate.mockQuantityPlaceholder || 0)
      : candidate.side === "mock_sell"
        ? -Number(candidate.mockQuantityPlaceholder || 0)
        : 0;
    const projectedMockQuantity = roundQuantity(Math.max(0, currentMockQuantity + fillQuantity));
    const currentWeight = Number(currentAllocation.weightPct || 0);
    const targetWeight = Number(targetMap.get(candidate.symbol) ?? currentWeight);
    const projectedWeight = roundPct(currentWeight + (fillQuantity === 0 ? 0 : Math.sign(fillQuantity) * Math.min(Math.abs(targetWeight - currentWeight), 5)));

    return {
      rowId: `step144_mock_fill_position_impact_${index + 1}`,
      sourceStep: "step144",
      symbol: candidate.symbol || "SYMBOL_PLACEHOLDER",
      currentMockQuantity,
      mockFillQuantity: fillQuantity,
      projectedMockQuantity,
      currentWeight,
      projectedWeight,
      targetWeight,
      projectedWeightGap: roundPct(targetWeight - projectedWeight),
      status: candidate.status || "mock_only",
      redacted: true,
      actualBalanceQueried: false,
      accountBalanceQueried: false,
      actualFillRecordCreated: false,
      executionRecordCreated: false,
      providerPayloadStored: false,
      orderPayloadStored: false,
      rawProviderResponseStored: false,
    };
  });
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const warningCount = rows.filter((row) => row.status === "validation_required").length;

  return {
    validationId: "step144_mock_fill_position_impact_validation",
    sourceStep: "step144",
    status: blockedCount > 0 ? "blocked" : warningCount > 0 || rows.length === 0 ? "validation_required" : "mock_only",
    rows,
    blockerCount: blockedCount,
    warningCount,
    redacted: true,
    actualBalanceQueried: false,
    accountBalanceQueried: false,
    actualFillRecordCreated: false,
    executionRecordCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillSimulationPreflight(input = {}, options = {}) {
  const context = getStep144ExecutionReviewContext(input, options);
  const fillCandidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates(input, options);
  const policyValidation = input.policyValidation || validateTradingLabMockFillPolicyAndPriceSource({ ...input, fillCandidates }, options);
  const slippageFeePreview = input.slippageFeePreview || buildTradingLabMockFillSlippageFeePreview({ ...input, fillCandidates }, options);
  const cashImpactValidation = input.cashImpactValidation || validateTradingLabMockFillCashImpact({ ...input, fillCandidates }, options);
  const positionImpactValidation = input.positionImpactValidation || validateTradingLabMockFillPositionImpact({ ...input, fillCandidates }, options);
  const blockers = [];
  const warnings = [];

  if (!context.reviewResult) blockers.push("mock_execution_review_result_missing");
  if (!context.receipt) blockers.push("mock_execution_review_receipt_missing");
  if (context.reviewResult && context.reviewResult.redacted !== true) blockers.push("mock_execution_review_result_not_redacted");
  if (context.receipt && context.receipt.redacted !== true) blockers.push("mock_execution_review_receipt_not_redacted");
  if (context.reviewResult && context.reviewResult.readinessImpact !== "none") blockers.push("review_result_readiness_impact_not_none");
  if (context.reviewResult && context.reviewResult.providerCallImpact !== "blocked") blockers.push("review_result_provider_call_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.orderSubmissionImpact !== "blocked") blockers.push("review_result_order_submission_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.liveTradingImpact !== "blocked") blockers.push("review_result_live_trading_impact_not_blocked");
  if (context.reviewResult?.reviewStatus === "blocked") blockers.push("mock_execution_review_result_blocked");
  if (context.reviewResult?.reviewStatus === "validation_required") warnings.push("mock_execution_review_result_validation_required");
  if (context.receipt?.nextAllowedStep && context.receipt.nextAllowedStep !== "mock_fill_simulation_preflight") blockers.push("review_receipt_next_step_not_mock_fill_simulation_preflight");
  if (!context.inputBundle) blockers.push("mock_fill_input_bundle_missing");
  if (context.inputBundle?.scope !== "mock_only") blockers.push("mock_fill_input_bundle_scope_not_mock_only");
  if (context.inputBundle && String(context.inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if ((context.inputBundle?.symbols || context.inputBundle?.allowedSymbols || []).some((symbol) => ["*", "ALL", "ALL_SYMBOLS"].includes(String(symbol || "").toUpperCase()))) {
    blockers.push("wildcard_all_symbols_rejected");
  }
  if (context.inputBundle?.priceSeriesStatus !== "available") warnings.push("mock_price_series_dependency_validation_required");
  if (!Number.isFinite(Number(context.inputBundle?.cashPlaceholder)) || Number(context.inputBundle?.cashPlaceholder) <= 0) warnings.push("mock_cash_placeholder_validation_required");
  if (input.mockPositionDependencyAvailable === false || options.mockPositionDependencyAvailable === false) warnings.push("mock_position_dependency_validation_required");
  if (context.executionValidation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (context.riskGuard?.status === "blocked") blockers.push("mock_fill_risk_guard_blocked");
  if (context.riskGuard?.status === "validation_required") warnings.push("mock_fill_risk_guard_validation_required");
  if (policyValidation.status === "blocked") blockers.push(...(policyValidation.blockers || ["mock_fill_policy_validation_blocked"]));
  if (policyValidation.status === "validation_required") warnings.push(...(policyValidation.warnings || ["mock_fill_policy_validation_required"]));
  if (slippageFeePreview.status === "blocked") blockers.push("mock_slippage_fee_preview_blocked");
  if (slippageFeePreview.status === "validation_required") warnings.push(...(slippageFeePreview.warnings || ["mock_slippage_fee_preview_validation_required"]));
  if (cashImpactValidation.status === "blocked") blockers.push("mock_fill_cash_impact_blocked");
  if (cashImpactValidation.status === "validation_required") warnings.push(...(cashImpactValidation.warnings || ["mock_fill_cash_impact_validation_required"]));
  if (positionImpactValidation.status === "blocked") blockers.push("mock_fill_position_impact_blocked");
  if (positionImpactValidation.status === "validation_required") warnings.push("mock_fill_position_impact_validation_required");
  if (fillCandidates.some((candidate) => candidate.status === "blocked")) blockers.push("mock_fill_candidate_blocked");
  if (fillCandidates.some((candidate) => candidate.status === "validation_required")) warnings.push("mock_fill_candidate_validation_required");
  if (fillCandidates.some((candidate) => candidate.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.kisFillPayloadCreated !== false)) blockers.push("kis_fill_payload_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.actualExecutionCreated !== false || candidate.executionRecordCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.actualFillRecordCreated !== false || candidate.fillRecordCreated !== false || candidate.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (fillCandidates.some((candidate) => candidate.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_fill_simulation_candidate";
  const blockedFillCandidateCount = fillCandidates.filter((candidate) => candidate.status === "blocked").length;
  const warningFillCandidateCount = fillCandidates.filter((candidate) => candidate.status === "validation_required").length;

  return {
    validationId: "step144_mock_fill_simulation_preflight_validation",
    sourceStep: "step144",
    status,
    mockFillSimulationPreflightId: "step144_mock_fill_simulation_preflight",
    mockExecutionReviewResultId: context.reviewResult?.mockExecutionReviewResultId || "missing_mock_execution_review_result",
    mockExecutionPreflightId: context.reviewResult?.mockExecutionPreflightId || context.receipt?.mockExecutionPreflightId || "missing_mock_execution_preflight",
    mockOrderGenerationReviewResultId: context.reviewResult?.mockOrderGenerationReviewResultId || "missing_mock_order_generation_review_result",
    mockRunCandidateId: context.reviewResult?.mockRunCandidateId || context.receipt?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: context.reviewResult?.inputBundleId || context.receipt?.inputBundleId || context.inputBundle?.inputBundleId || "missing_input_bundle",
    strategyDraftId: context.reviewResult?.strategyDraftId || context.receipt?.strategyDraftId || context.inputBundle?.strategyDraftId || "missing_strategy_draft",
    mode: context.inputBundle?.mode || "mock",
    scope: "mock_only",
    fillCandidateCount: fillCandidates.length,
    blockedFillCandidateCount,
    warningFillCandidateCount,
    fillPolicyStatus: policyValidation.fillPolicyStatus || policyValidation.status,
    fillPriceSourceStatus: policyValidation.fillPriceSourceStatus || policyValidation.status,
    slippageStatus: slippageFeePreview.status,
    feeStatus: slippageFeePreview.status,
    cashImpactStatus: cashImpactValidation.status,
    positionImpactStatus: positionImpactValidation.status,
    riskGuardStatus: context.riskGuard?.status || "blocked",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_review",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step144_mock_fill_simulation_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockFillSimulationPreflightResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationPreflight(input, options);

  return {
    mockFillSimulationPreflightId: validation.mockFillSimulationPreflightId,
    sourceStep: "step144",
    mockExecutionReviewResultId: validation.mockExecutionReviewResultId,
    mockExecutionPreflightId: validation.mockExecutionPreflightId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    fillCandidateCount: validation.fillCandidateCount,
    blockedFillCandidateCount: validation.blockedFillCandidateCount,
    warningFillCandidateCount: validation.warningFillCandidateCount,
    fillPolicyStatus: validation.fillPolicyStatus,
    fillPriceSourceStatus: validation.fillPriceSourceStatus,
    slippageStatus: validation.slippageStatus,
    feeStatus: validation.feeStatus,
    cashImpactStatus: validation.cashImpactStatus,
    positionImpactStatus: validation.positionImpactStatus,
    riskGuardStatus: validation.riskGuardStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_review",
    blockers: validation.blockers,
    warnings: validation.warnings,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockFillSimulationPreflight(input = {}, options = {}) {
  const mockExecutionReviewResultStatus = input.mockExecutionReviewResultStatus || buildAdminTradingLabMockExecutionReviewResultStatus(input, options);
  const fillCandidates = input.fillCandidates || buildTradingLabMockFillSimulationCandidates({ ...input, mockExecutionReviewResultStatus }, options);
  const policyValidation = input.policyValidation || validateTradingLabMockFillPolicyAndPriceSource({ ...input, mockExecutionReviewResultStatus, fillCandidates }, options);
  const slippageFeePreview = input.slippageFeePreview || buildTradingLabMockFillSlippageFeePreview({ ...input, mockExecutionReviewResultStatus, fillCandidates }, options);
  const cashImpactValidation = input.cashImpactValidation || validateTradingLabMockFillCashImpact({ ...input, mockExecutionReviewResultStatus, fillCandidates }, options);
  const positionImpactValidation = input.positionImpactValidation || validateTradingLabMockFillPositionImpact({ ...input, mockExecutionReviewResultStatus, fillCandidates }, options);
  const validation = input.validation || validateTradingLabMockFillSimulationPreflight(
    { ...input, mockExecutionReviewResultStatus, fillCandidates, policyValidation, slippageFeePreview, cashImpactValidation, positionImpactValidation },
    options,
  );
  const result = input.result || buildTradingLabMockFillSimulationPreflightResult({ ...input, validation }, options);

  return {
    mockFillSimulationPreflightId: "step144_mock_fill_simulation_preflight",
    sourceStep: "step144",
    status: result.status,
    scope: "mock_only",
    mockExecutionReviewResultStatus,
    fillCandidates,
    policyValidation,
    slippageFeePreview,
    cashImpactValidation,
    positionImpactValidation,
    validation,
    result,
    blockerSummary: {
      blockerSummaryId: "step144_mock_fill_simulation_preflight_blocker_summary",
      sourceStep: "step144",
      status: result.status,
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    flags: { ...STEP144_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step144_mock_fill_simulation_preflight_v1" }),
  };
}

export function buildAdminTradingLabMockFillSimulationPreflightStatus(input = {}, options = {}) {
  const preflight = input.preflight || buildTradingLabMockFillSimulationPreflight(input, options);

  return {
    ok: true,
    step: "Step 144: Admin trading lab mock fill simulation preflight",
    status: "admin_only_trading_lab_mock_fill_simulation_preflight_fail_closed",
    mockFillSimulationPreflightModel: TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_MODEL,
    mockFillSimulationCandidateModel: TRADING_LAB_MOCK_FILL_SIMULATION_CANDIDATE_MODEL,
    mockFillPolicyModel: TRADING_LAB_MOCK_FILL_POLICY_MODEL,
    mockFillSlippageFeePreviewModel: TRADING_LAB_MOCK_FILL_SLIPPAGE_FEE_PREVIEW_MODEL,
    mockFillCashImpactValidationModel: TRADING_LAB_MOCK_FILL_CASH_IMPACT_VALIDATION_MODEL,
    mockFillPositionImpactValidationModel: TRADING_LAB_MOCK_FILL_POSITION_IMPACT_VALIDATION_MODEL,
    mockFillSimulationPreflightResultSchema: TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_RESULT_SCHEMA,
    preflight,
    validation: preflight.validation,
    result: preflight.result,
    fillCandidates: preflight.fillCandidates,
    policyValidation: preflight.policyValidation,
    slippageFeePreview: preflight.slippageFeePreview,
    cashImpactValidation: preflight.cashImpactValidation,
    positionImpactValidation: preflight.positionImpactValidation,
    blockerSummary: preflight.blockerSummary,
    flags: { ...STEP144_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep145FillSimulationPreflightContext(input = {}, options = {}) {
  const hasPreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockFillSimulationPreflightStatus");
  const mockFillSimulationPreflightStatus = hasPreflightStatus
    ? input.mockFillSimulationPreflightStatus
    : buildAdminTradingLabMockFillSimulationPreflightStatus(input, options);
  const preflight = input.preflight || mockFillSimulationPreflightStatus?.preflight || null;
  const validation = input.validation || mockFillSimulationPreflightStatus?.validation || preflight?.validation || null;
  const result = input.preflightResult || input.result || mockFillSimulationPreflightStatus?.result || preflight?.result || null;
  const fillCandidates = input.fillCandidates || mockFillSimulationPreflightStatus?.fillCandidates || preflight?.fillCandidates || [];
  const slippageFeePreview = input.slippageFeePreview || mockFillSimulationPreflightStatus?.slippageFeePreview || preflight?.slippageFeePreview || {};
  const cashImpactValidation = input.cashImpactValidation || mockFillSimulationPreflightStatus?.cashImpactValidation || preflight?.cashImpactValidation || {};
  const positionImpactValidation = input.positionImpactValidation || mockFillSimulationPreflightStatus?.positionImpactValidation || preflight?.positionImpactValidation || {};
  const policyValidation = input.policyValidation || mockFillSimulationPreflightStatus?.policyValidation || preflight?.policyValidation || {};

  return {
    mockFillSimulationPreflightStatus,
    preflight,
    validation,
    result,
    fillCandidates,
    slippageFeePreview,
    cashImpactValidation,
    positionImpactValidation,
    policyValidation,
  };
}

export function buildTradingLabMockFillSimulationReviewImpactSummary(input = {}, options = {}) {
  const context = getStep145FillSimulationPreflightContext(input, options);
  const slippageStatus = context.result?.slippageStatus || context.slippageFeePreview?.status || "validation_required";
  const feeStatus = context.result?.feeStatus || context.slippageFeePreview?.status || "validation_required";
  const cashStatus = context.result?.cashImpactStatus || context.cashImpactValidation?.status || "validation_required";
  const positionStatus = context.result?.positionImpactStatus || context.positionImpactValidation?.status || "validation_required";
  const rows = Array.isArray(context.positionImpactValidation?.rows) ? context.positionImpactValidation.rows : [];

  return {
    summaryId: "step145_mock_fill_simulation_review_impact_summary",
    sourceStep: "step145",
    status: [slippageStatus, feeStatus, cashStatus, positionStatus].includes("blocked")
      ? "blocked"
      : [slippageStatus, feeStatus, cashStatus, positionStatus].includes("validation_required")
        ? "validation_required"
        : "mock_only",
    slippageReviewStatus: slippageStatus,
    feeReviewStatus: feeStatus,
    cashImpactReviewStatus: cashStatus,
    positionImpactReviewStatus: positionStatus,
    estimatedMockSlippage: Number(context.slippageFeePreview?.mockSlippageAmount || 0),
    estimatedMockFee: Number(context.slippageFeePreview?.mockFeeAmount || 0),
    cashAfterMockFillPlaceholder: Number(context.cashImpactValidation?.projectedCashPlaceholder || 0),
    positionDeltaPlaceholderCount: rows.length,
    rows: rows.slice(0, 5).map((row) => ({
      symbol: row.symbol || "SYMBOL_PLACEHOLDER",
      projectedMockQuantity: Number(row.projectedMockQuantity || 0),
      projectedWeight: Number(row.projectedWeight || 0),
      projectedWeightGap: Number(row.projectedWeightGap || 0),
      status: row.status || "mock_only",
      redacted: true,
    })),
    redacted: true,
    actualFillPriceLookupAttempted: false,
    actualFeeScheduleQueried: false,
    accountBalanceQueried: false,
    actualPositionQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillSimulationReviewResult(input = {}, options = {}) {
  const context = getStep145FillSimulationPreflightContext(input, options);
  const impactSummary = input.impactSummary || buildTradingLabMockFillSimulationReviewImpactSummary(input, options);
  const blockers = [];
  const warnings = [];
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];

  if (!context.preflight) blockers.push("mock_fill_simulation_preflight_missing");
  if (!context.result) blockers.push("mock_fill_simulation_preflight_result_missing");
  if (context.result && context.result.redacted !== true) blockers.push("mock_fill_simulation_preflight_result_not_redacted");
  if (context.preflight && context.preflight.scope !== "mock_only") blockers.push("mock_fill_simulation_scope_not_mock_only");
  if (context.result && context.result.scope !== "mock_only") blockers.push("mock_fill_simulation_result_scope_not_mock_only");
  if (context.result && context.result.readinessImpact !== "none") blockers.push("preflight_readiness_impact_not_none");
  if (context.result && context.result.providerCallImpact !== "blocked") blockers.push("preflight_provider_call_impact_not_blocked");
  if (context.result && context.result.orderSubmissionImpact !== "blocked") blockers.push("preflight_order_submission_impact_not_blocked");
  if (context.result && context.result.liveTradingImpact !== "blocked") blockers.push("preflight_live_trading_impact_not_blocked");
  if (context.result?.status === "blocked") blockers.push("mock_fill_simulation_preflight_blocked");
  if (context.result?.status === "validation_required") warnings.push("mock_fill_simulation_preflight_validation_required");
  if (context.result?.nextAllowedStep && context.result.nextAllowedStep !== "mock_fill_simulation_review") blockers.push("preflight_next_step_not_mock_fill_simulation_review");
  if (context.validation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (context.validation?.blockers?.includes("unsafe_live_or_order_mode_rejected")) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.validation?.blockers?.includes("wildcard_all_symbols_rejected")) blockers.push("wildcard_all_symbols_rejected");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.reviewResult || input.receipt || {})) blockers.push("unsafe_private_or_payload_value_rejected");
  if (impactSummary.status === "blocked") blockers.push("mock_fill_simulation_review_impact_blocked");
  if (impactSummary.status === "validation_required") warnings.push("mock_fill_simulation_review_impact_validation_required");
  if (context.result?.riskGuardStatus === "blocked") blockers.push("mock_fill_risk_guard_blocked");
  if (context.result?.riskGuardStatus === "validation_required") warnings.push("mock_fill_risk_guard_validation_required");
  if (candidates.length === 0) warnings.push("mock_fill_simulation_candidate_missing");
  if (candidates.some((candidate) => candidate.redacted !== true)) blockers.push("mock_fill_candidate_not_redacted");
  if (candidates.some((candidate) => candidate.status === "blocked")) blockers.push("mock_fill_candidate_blocked");
  if (candidates.some((candidate) => candidate.status === "validation_required")) warnings.push("mock_fill_candidate_validation_required");
  if (candidates.some((candidate) => candidate.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisFillPayloadCreated !== false)) blockers.push("kis_fill_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualExecutionCreated !== false || candidate.executionRecordCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualFillRecordCreated !== false || candidate.fillRecordCreated !== false || candidate.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (candidates.some((candidate) => candidate.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";
  const decision = reviewStatus === "recorded" ? "mock_fill_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected";
  const firstCandidate = candidates[0] || {};

  return {
    validationId: "step145_mock_fill_simulation_review_result_validation",
    sourceStep: "step145",
    reviewStatus,
    decision,
    fillSimulationReviewResultId: "step145_mock_fill_simulation_review_result",
    fillSimulationPreflightId: context.result?.mockFillSimulationPreflightId || context.validation?.mockFillSimulationPreflightId || "missing_mock_fill_simulation_preflight",
    fillSimulationCandidateId: firstCandidate.mockFillSimulationCandidateId || "missing_mock_fill_simulation_candidate",
    mockExecutionReviewResultId: context.result?.mockExecutionReviewResultId || context.validation?.mockExecutionReviewResultId || "missing_mock_execution_review_result",
    mockOrderGenerationReviewResultId: context.validation?.mockOrderGenerationReviewResultId || "missing_mock_order_generation_review_result",
    mockRunCandidateId: context.result?.mockRunCandidateId || context.validation?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: context.result?.inputBundleId || context.validation?.inputBundleId || "missing_input_bundle",
    strategyDraftId: context.result?.strategyDraftId || context.validation?.strategyDraftId || "missing_strategy_draft",
    fillCandidateCount: context.result?.fillCandidateCount || candidates.length,
    blockedFillCandidateCount: context.result?.blockedFillCandidateCount || candidates.filter((candidate) => candidate.status === "blocked").length,
    warningFillCandidateCount: context.result?.warningFillCandidateCount || candidates.filter((candidate) => candidate.status === "validation_required").length,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    slippageReviewStatus: impactSummary.slippageReviewStatus,
    feeReviewStatus: impactSummary.feeReviewStatus,
    cashImpactReviewStatus: impactSummary.cashImpactReviewStatus,
    positionImpactReviewStatus: impactSummary.positionImpactReviewStatus,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step145_mock_fill_simulation_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockFillSimulationReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationReviewResult(input, options);

  return {
    fillSimulationReviewResultId: validation.fillSimulationReviewResultId,
    sourceStep: "step145",
    fillSimulationPreflightId: validation.fillSimulationPreflightId,
    fillSimulationCandidateId: validation.fillSimulationCandidateId,
    mockExecutionReviewResultId: validation.mockExecutionReviewResultId,
    mockOrderGenerationReviewResultId: validation.mockOrderGenerationReviewResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_recorded_at",
    reviewedBy: "admin_placeholder",
    fillCandidateCount: validation.fillCandidateCount,
    blockedFillCandidateCount: validation.blockedFillCandidateCount,
    warningFillCandidateCount: validation.warningFillCandidateCount,
    slippageReviewStatus: validation.slippageReviewStatus,
    feeReviewStatus: validation.feeReviewStatus,
    cashImpactReviewStatus: validation.cashImpactReviewStatus,
    positionImpactReviewStatus: validation.positionImpactReviewStatus,
    summary: validation.reviewStatus === "recorded" ? "mock fill simulation review recorded" : validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockFillSimulationReviewReceipt(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockFillSimulationReviewResult({ ...input, validation }, options);

  return {
    receiptId: "step145_mock_fill_simulation_review_receipt",
    sourceStep: "step145",
    fillSimulationReviewResultId: reviewResult.fillSimulationReviewResultId,
    fillSimulationPreflightId: reviewResult.fillSimulationPreflightId,
    fillSimulationCandidateId: reviewResult.fillSimulationCandidateId,
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "placeholder_recorded_at",
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    slippageReviewStatus: validation.slippageReviewStatus,
    feeReviewStatus: validation.feeReviewStatus,
    cashImpactReviewStatus: validation.cashImpactReviewStatus,
    positionImpactReviewStatus: validation.positionImpactReviewStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockFillSimulationReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationReviewResult(input, options);

  return {
    summaryId: "step145_mock_fill_simulation_review_decision_summary",
    sourceStep: "step145",
    decision: validation.decision,
    reviewStatus: validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    blockerMessages: validation.blockerSummary,
    warningMessages: validation.warningSummary,
    messages: [
      "Mock fill simulation review recorded only.",
      "No actual fill or execution record created.",
      "KIS calls and order submission remain blocked.",
      "External order authority evidence is still required.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockFillSimulationReviewResultRecordingGate(input = {}, options = {}) {
  const mockFillSimulationPreflightStatus = input.mockFillSimulationPreflightStatus || buildAdminTradingLabMockFillSimulationPreflightStatus(input, options);
  const impactSummary = input.impactSummary || buildTradingLabMockFillSimulationReviewImpactSummary({ ...input, mockFillSimulationPreflightStatus }, options);
  const validation = input.validation || validateTradingLabMockFillSimulationReviewResult(
    { ...input, mockFillSimulationPreflightStatus, impactSummary },
    options,
  );
  const reviewResult = input.reviewResult || buildTradingLabMockFillSimulationReviewResult({ ...input, validation }, options);
  const receipt = input.receipt || buildTradingLabMockFillSimulationReviewReceipt({ ...input, validation, reviewResult }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockFillSimulationReviewDecisionSummary({ ...input, validation }, options);

  return {
    recordingGateId: "step145_mock_fill_simulation_review_result_recording_gate",
    sourceStep: "step145",
    status: validation.reviewStatus,
    decision: validation.decision,
    mockFillSimulationPreflightStatus,
    impactSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
    blockerSummary: {
      summaryId: "step145_mock_fill_simulation_review_blocker_summary",
      sourceStep: "step145",
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    mockHistory: [
      {
        historyId: "step145_mock_fill_simulation_review_history_1",
        sourceStep: "step145",
        reviewStatus: validation.reviewStatus,
        decision: validation.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_fill_simulation_core_preflight",
      },
    ],
    flags: { ...STEP145_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step145_mock_fill_simulation_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabMockFillSimulationReviewResultStatus(input = {}, options = {}) {
  const recordingGate = input.recordingGate || buildTradingLabMockFillSimulationReviewResultRecordingGate(input, options);

  return {
    ok: true,
    step: "Step 145: Admin trading lab mock fill simulation review result recording gate",
    status: "admin_only_trading_lab_mock_fill_simulation_review_result_recording_gate_fail_closed",
    mockFillSimulationReviewResultModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_MODEL,
    mockFillSimulationReviewReceiptSchema: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RECEIPT_SCHEMA,
    mockFillSimulationReviewDecisionSummaryModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_DECISION_SUMMARY_MODEL,
    mockFillSimulationReviewImpactSummaryModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_IMPACT_SUMMARY_MODEL,
    recordingGate,
    validation: recordingGate.validation,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    impactSummary: recordingGate.impactSummary,
    decisionSummary: recordingGate.decisionSummary,
    blockerSummary: recordingGate.blockerSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP145_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep146FillSimulationReviewContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockFillSimulationReviewResultStatus");
  const mockFillSimulationReviewResultStatus = hasReviewStatus
    ? input.mockFillSimulationReviewResultStatus
    : buildAdminTradingLabMockFillSimulationReviewResultStatus(input, options);
  const recordingGate = input.recordingGate || mockFillSimulationReviewResultStatus?.recordingGate || null;
  const reviewResult = input.reviewResult || mockFillSimulationReviewResultStatus?.reviewResult || recordingGate?.reviewResult || null;
  const receipt = input.receipt || mockFillSimulationReviewResultStatus?.receipt || recordingGate?.receipt || null;
  const validation = input.reviewValidation || mockFillSimulationReviewResultStatus?.validation || recordingGate?.validation || null;
  const preflightStatus = input.mockFillSimulationPreflightStatus
    || recordingGate?.mockFillSimulationPreflightStatus
    || mockFillSimulationReviewResultStatus?.mockFillSimulationPreflightStatus
    || null;
  const fillCandidates = input.fillCandidates
    || preflightStatus?.fillCandidates
    || preflightStatus?.preflight?.fillCandidates
    || [];
  const policyValidation = input.policyValidation
    || preflightStatus?.policyValidation
    || preflightStatus?.preflight?.policyValidation
    || {};
  const slippageFeePreview = input.slippageFeePreview
    || preflightStatus?.slippageFeePreview
    || preflightStatus?.preflight?.slippageFeePreview
    || {};
  const cashImpactValidation = input.cashImpactValidation
    || preflightStatus?.cashImpactValidation
    || preflightStatus?.preflight?.cashImpactValidation
    || {};
  const positionImpactValidation = input.positionImpactValidation
    || preflightStatus?.positionImpactValidation
    || preflightStatus?.preflight?.positionImpactValidation
    || {};

  return {
    mockFillSimulationReviewResultStatus,
    recordingGate,
    reviewResult,
    receipt,
    validation,
    preflightStatus,
    fillCandidates,
    policyValidation,
    slippageFeePreview,
    cashImpactValidation,
    positionImpactValidation,
  };
}

export function buildTradingLabMockFillCoreInputBundle(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];
  const cashPlaceholder = Number(context.cashImpactValidation?.projectedCashPlaceholder || context.cashImpactValidation?.startingCashPlaceholder || 0);
  const positionRows = Array.isArray(context.positionImpactValidation?.rows) ? context.positionImpactValidation.rows : [];

  return {
    inputBundleId: context.reviewResult?.inputBundleId || context.receipt?.inputBundleId || "missing_input_bundle",
    sourceStep: "step146",
    scope: "mock_only",
    mode: input.mode || "mock",
    fillSimulationReviewResultId: context.reviewResult?.fillSimulationReviewResultId || "missing_fill_simulation_review_result",
    fillSimulationPreflightId: context.reviewResult?.fillSimulationPreflightId || context.receipt?.fillSimulationPreflightId || "missing_fill_simulation_preflight",
    mockRunCandidateId: context.reviewResult?.mockRunCandidateId || "missing_mock_run_candidate",
    strategyDraftId: context.reviewResult?.strategyDraftId || "missing_strategy_draft",
    candidateCount: candidates.length,
    priceSource: "static_mock_series",
    priceSeriesStatus: input.mockPriceSeriesAvailable === false || options.mockPriceSeriesAvailable === false ? "validation_required" : "available",
    cashPlaceholder,
    cashPlaceholderStatus: cashPlaceholder > 0 ? "mock_only" : "validation_required",
    positionDependencyStatus: positionRows.length > 0 ? "mock_only" : "validation_required",
    redacted: true,
    actualAccountCashQueried: false,
    actualPositionQueried: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockFillScenario(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];
  const firstCandidate = candidates[0] || {};

  return {
    scenarioId: "step146_mock_fill_simulation_core_scenario",
    sourceStep: "step146",
    scope: "mock_only",
    scenarioType: "mock_fill_core_preflight",
    fillCandidateCount: candidates.length,
    fillPolicy: firstCandidate.fillPolicy || "mock_close_price",
    fillTiming: firstCandidate.fillTiming || "mock_same_day",
    priceSource: firstCandidate.mockPriceSource || "static_mock_series",
    redacted: true,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockFillCorePricingSlippageFeePolicy(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];
  const allowedFillPolicies = new Set(["mock_close_price", "mock_vwap_placeholder", "mock_mid_price_placeholder"]);
  const allowedFillTimings = new Set(["mock_same_day", "mock_next_open_placeholder"]);
  const blockers = [];
  const warnings = [];

  if (candidates.length === 0) warnings.push("mock_fill_core_candidate_missing");
  if (candidates.some((candidate) => !allowedFillPolicies.has(candidate.fillPolicy || "mock_close_price"))) blockers.push("invalid_mock_fill_policy_rejected");
  if (candidates.some((candidate) => !allowedFillTimings.has(candidate.fillTiming || "mock_same_day"))) blockers.push("invalid_mock_fill_timing_rejected");
  if (candidates.some((candidate) => (candidate.mockPriceSource || "static_mock_series") !== "static_mock_series")) blockers.push("non_mock_price_source_rejected");
  if (context.policyValidation?.providerQuoteUsed === true || context.policyValidation?.kisQuoteQueryUsed === true) blockers.push("provider_quote_must_not_be_used");
  if (context.slippageFeePreview?.actualFillPriceLookupAttempted === true) blockers.push("actual_fill_price_lookup_must_not_run");
  if (context.slippageFeePreview?.actualFeeScheduleQueried === true) blockers.push("actual_fee_schedule_query_must_not_run");
  if (!Number.isFinite(Number(context.slippageFeePreview?.mockSlippageRate ?? 0))) warnings.push("mock_slippage_rate_validation_required");
  if (!Number.isFinite(Number(context.slippageFeePreview?.mockFeeRate ?? 0))) warnings.push("mock_fee_rate_validation_required");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";

  return {
    validationId: "step146_mock_fill_core_pricing_slippage_fee_policy_validation",
    sourceStep: "step146",
    status,
    pricingPolicyStatus: status,
    slippagePolicyStatus: status,
    feePolicyStatus: status,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    mockFillPricePlaceholder: Number(candidates[0]?.mockFillPricePlaceholder || context.slippageFeePreview?.mockFillPricePlaceholder || 0),
    mockSlippageRate: Number(context.slippageFeePreview?.mockSlippageRate || 0),
    mockFeeRate: Number(context.slippageFeePreview?.mockFeeRate || 0),
    priceSource: "static_mock_series",
    redacted: true,
    providerQuoteUsed: false,
    kisQuoteQueryUsed: false,
    actualFillPriceLookupAttempted: false,
    actualFeeScheduleQueried: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillCoreCashAvailability(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const cashImpact = context.cashImpactValidation || {};
  const blockers = [];
  const warnings = [];
  const startingCash = Number(cashImpact.startingCashPlaceholder || 0);
  const projectedCash = Number(cashImpact.projectedCashPlaceholder || 0);

  if (cashImpact.actualBalanceQueried === true || cashImpact.accountBalanceQueried === true) blockers.push("actual_balance_query_must_not_run");
  if (!Number.isFinite(startingCash) || startingCash <= 0) warnings.push("mock_cash_placeholder_validation_required");
  if (!Number.isFinite(projectedCash) || projectedCash < 0) warnings.push("mock_cash_availability_validation_required");
  if (cashImpact.dbWriteUsed === true || cashImpact.persistentStorageUsed === true) blockers.push("mock_cash_validation_must_not_persist");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";

  return {
    validationId: "step146_mock_fill_core_cash_availability_validation",
    sourceStep: "step146",
    status,
    startingCashPlaceholder: Number.isFinite(startingCash) ? startingCash : 0,
    projectedCashPlaceholder: Number.isFinite(projectedCash) ? projectedCash : 0,
    cashReserveStatus: status,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    redacted: true,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillCorePositionImpact(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const rows = Array.isArray(context.positionImpactValidation?.rows) ? context.positionImpactValidation.rows : [];
  const blockers = [];
  const warnings = [];

  if (rows.length === 0) warnings.push("mock_position_dependency_validation_required");
  if (rows.some((row) => row.actualBalanceQueried === true || row.accountBalanceQueried === true)) blockers.push("actual_position_or_balance_query_must_not_run");
  if (rows.some((row) => row.actualFillRecordCreated === true || row.executionRecordCreated === true)) blockers.push("actual_fill_or_execution_record_must_not_be_created");
  if (context.positionImpactValidation?.dbWriteUsed === true || context.positionImpactValidation?.persistentStorageUsed === true) blockers.push("mock_position_validation_must_not_persist");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";

  return {
    validationId: "step146_mock_fill_core_position_impact_validation",
    sourceStep: "step146",
    status,
    rowCount: rows.length,
    rows: rows.slice(0, 5).map((row) => ({
      symbol: row.symbol || "SYMBOL_PLACEHOLDER",
      currentMockQuantity: Number(row.currentMockQuantity || 0),
      mockFillQuantity: Number(row.mockFillQuantity || 0),
      projectedMockQuantity: Number(row.projectedMockQuantity || 0),
      currentWeight: Number(row.currentWeight || 0),
      projectedWeight: Number(row.projectedWeight || 0),
      targetWeight: Number(row.targetWeight || 0),
      projectedWeightGap: Number(row.projectedWeightGap || 0),
      redacted: true,
    })),
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    redacted: true,
    accountBalanceQueried: false,
    actualPositionQueried: false,
    actualPositionUpdated: false,
    actualFillRecordCreated: false,
    executionRecordCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillDeterministicCalculationReadiness(input = {}, options = {}) {
  const inputBundle = input.inputBundle || buildTradingLabMockFillCoreInputBundle(input, options);
  const scenario = input.scenario || buildTradingLabMockFillScenario(input, options);
  const context = getStep146FillSimulationReviewContext(input, options);
  const blockers = [];
  const warnings = [];

  if (inputBundle.priceSeriesStatus !== "available") warnings.push("static_mock_price_series_validation_required");
  if (inputBundle.cashPlaceholderStatus !== "mock_only") warnings.push("mock_cash_placeholder_validation_required");
  if (inputBundle.positionDependencyStatus !== "mock_only") warnings.push("mock_position_dependency_validation_required");
  if (scenario.priceSource !== "static_mock_series") blockers.push("deterministic_price_source_not_mock_static_series");
  if (context.validation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (context.validation?.blockers?.includes("unsafe_live_or_order_mode_rejected")) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.validation?.blockers?.includes("wildcard_all_symbols_rejected")) blockers.push("wildcard_all_symbols_rejected");

  const status = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "mock_only";

  return {
    readinessId: "step146_mock_fill_deterministic_calculation_readiness",
    sourceStep: "step146",
    status,
    deterministicCalculationStatus: status,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    deterministicInputsOnly: true,
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    actualFillRecordCreated: false,
    actualExecutionCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockFillSimulationCorePreflight(input = {}, options = {}) {
  const context = getStep146FillSimulationReviewContext(input, options);
  const inputBundle = input.inputBundle || buildTradingLabMockFillCoreInputBundle(input, options);
  const scenario = input.scenario || buildTradingLabMockFillScenario(input, options);
  const policyValidation = input.policyValidation || validateTradingLabMockFillCorePricingSlippageFeePolicy(input, options);
  const cashAvailability = input.cashAvailability || validateTradingLabMockFillCoreCashAvailability(input, options);
  const positionImpact = input.positionImpact || validateTradingLabMockFillCorePositionImpact(input, options);
  const deterministicReadiness = input.deterministicReadiness || validateTradingLabMockFillDeterministicCalculationReadiness(
    { ...input, inputBundle, scenario },
    options,
  );
  const blockers = [];
  const warnings = [];
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];

  if (!context.reviewResult) blockers.push("mock_fill_simulation_review_result_missing");
  if (!context.receipt) blockers.push("mock_fill_simulation_review_receipt_missing");
  if (context.reviewResult && context.reviewResult.redacted !== true) blockers.push("mock_fill_simulation_review_result_not_redacted");
  if (context.receipt && context.receipt.redacted !== true) blockers.push("mock_fill_simulation_review_receipt_not_redacted");
  if (context.reviewResult && context.reviewResult.readinessImpact !== "none") blockers.push("review_result_readiness_impact_not_none");
  if (context.reviewResult && context.reviewResult.providerCallImpact !== "blocked") blockers.push("review_result_provider_call_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.orderSubmissionImpact !== "blocked") blockers.push("review_result_order_submission_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.liveTradingImpact !== "blocked") blockers.push("review_result_live_trading_impact_not_blocked");
  if (context.reviewResult?.reviewStatus === "blocked") blockers.push("mock_fill_simulation_review_result_blocked");
  if (context.reviewResult?.reviewStatus === "validation_required") warnings.push("mock_fill_simulation_review_result_validation_required");
  if (context.receipt?.nextAllowedStep && context.receipt.nextAllowedStep !== "mock_fill_simulation_core_preflight") blockers.push("review_receipt_next_step_not_mock_fill_simulation_core_preflight");
  if (inputBundle.scope !== "mock_only") blockers.push("mock_fill_core_input_bundle_scope_not_mock_only");
  if (String(inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if (candidates.some((candidate) => candidate.redacted !== true)) blockers.push("mock_fill_core_candidate_not_redacted");
  if (candidates.some((candidate) => candidate.status === "blocked")) blockers.push("mock_fill_core_candidate_blocked");
  if (candidates.some((candidate) => candidate.status === "validation_required")) warnings.push("mock_fill_core_candidate_validation_required");
  if (candidates.some((candidate) => candidate.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisFillPayloadCreated !== false)) blockers.push("kis_fill_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualExecutionCreated !== false || candidate.executionRecordCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualFillRecordCreated !== false || candidate.fillRecordCreated !== false || candidate.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (candidates.some((candidate) => candidate.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");

  for (const child of [policyValidation, cashAvailability, positionImpact, deterministicReadiness]) {
    if (child.status === "blocked") blockers.push(...(child.blockers || ["mock_fill_core_child_validation_blocked"]));
    if (child.status === "validation_required") warnings.push(...(child.warnings || ["mock_fill_core_child_validation_required"]));
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_fill_core_ready";

  return {
    validationId: "step146_mock_fill_simulation_core_preflight_validation",
    sourceStep: "step146",
    status,
    mockFillSimulationCorePreflightId: "step146_mock_fill_simulation_core_preflight",
    fillSimulationReviewResultId: context.reviewResult?.fillSimulationReviewResultId || "missing_fill_simulation_review_result",
    fillSimulationPreflightId: context.reviewResult?.fillSimulationPreflightId || context.receipt?.fillSimulationPreflightId || "missing_fill_simulation_preflight",
    fillSimulationCandidateId: context.reviewResult?.fillSimulationCandidateId || context.receipt?.fillSimulationCandidateId || "missing_fill_simulation_candidate",
    mockExecutionReviewResultId: context.reviewResult?.mockExecutionReviewResultId || "missing_mock_execution_review_result",
    mockRunCandidateId: context.reviewResult?.mockRunCandidateId || "missing_mock_run_candidate",
    inputBundleId: inputBundle.inputBundleId,
    strategyDraftId: inputBundle.strategyDraftId,
    mode: inputBundle.mode,
    scope: "mock_only",
    inputBundleStatus: inputBundle.cashPlaceholderStatus === "mock_only" && inputBundle.positionDependencyStatus === "mock_only" ? "mock_only" : "validation_required",
    fillScenarioStatus: scenario.priceSource === "static_mock_series" ? "mock_only" : "blocked",
    pricingPolicyStatus: policyValidation.pricingPolicyStatus || policyValidation.status,
    slippagePolicyStatus: policyValidation.slippagePolicyStatus || policyValidation.status,
    feePolicyStatus: policyValidation.feePolicyStatus || policyValidation.status,
    cashAvailabilityStatus: cashAvailability.status,
    positionImpactStatus: positionImpact.status,
    deterministicCalculationStatus: deterministicReadiness.status,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step146_mock_fill_simulation_core_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockFillSimulationCorePreflightResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationCorePreflight(input, options);

  return {
    mockFillSimulationCorePreflightId: validation.mockFillSimulationCorePreflightId,
    sourceStep: "step146",
    fillSimulationReviewResultId: validation.fillSimulationReviewResultId,
    fillSimulationPreflightId: validation.fillSimulationPreflightId,
    mockRunCandidateId: validation.mockRunCandidateId,
    inputBundleId: validation.inputBundleId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    inputBundleStatus: validation.inputBundleStatus,
    fillScenarioStatus: validation.fillScenarioStatus,
    pricingPolicyStatus: validation.pricingPolicyStatus,
    slippagePolicyStatus: validation.slippagePolicyStatus,
    feePolicyStatus: validation.feePolicyStatus,
    cashAvailabilityStatus: validation.cashAvailabilityStatus,
    positionImpactStatus: validation.positionImpactStatus,
    deterministicCalculationStatus: validation.deterministicCalculationStatus,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockers: validation.blockers,
    warnings: validation.warnings,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockFillSimulationCorePreflight(input = {}, options = {}) {
  const mockFillSimulationReviewResultStatus = input.mockFillSimulationReviewResultStatus || buildAdminTradingLabMockFillSimulationReviewResultStatus(input, options);
  const inputBundle = input.inputBundle || buildTradingLabMockFillCoreInputBundle({ ...input, mockFillSimulationReviewResultStatus }, options);
  const scenario = input.scenario || buildTradingLabMockFillScenario({ ...input, mockFillSimulationReviewResultStatus }, options);
  const policyValidation = input.policyValidation || validateTradingLabMockFillCorePricingSlippageFeePolicy({ ...input, mockFillSimulationReviewResultStatus }, options);
  const cashAvailability = input.cashAvailability || validateTradingLabMockFillCoreCashAvailability({ ...input, mockFillSimulationReviewResultStatus }, options);
  const positionImpact = input.positionImpact || validateTradingLabMockFillCorePositionImpact({ ...input, mockFillSimulationReviewResultStatus }, options);
  const deterministicReadiness = input.deterministicReadiness || validateTradingLabMockFillDeterministicCalculationReadiness(
    { ...input, mockFillSimulationReviewResultStatus, inputBundle, scenario },
    options,
  );
  const validation = input.validation || validateTradingLabMockFillSimulationCorePreflight(
    { ...input, mockFillSimulationReviewResultStatus, inputBundle, scenario, policyValidation, cashAvailability, positionImpact, deterministicReadiness },
    options,
  );
  const result = input.result || buildTradingLabMockFillSimulationCorePreflightResult({ ...input, validation }, options);

  return {
    mockFillSimulationCorePreflightId: "step146_mock_fill_simulation_core_preflight",
    sourceStep: "step146",
    status: result.status,
    scope: "mock_only",
    mockFillSimulationReviewResultStatus,
    inputBundle,
    scenario,
    policyValidation,
    cashAvailability,
    positionImpact,
    deterministicReadiness,
    validation,
    result,
    blockerSummary: {
      blockerSummaryId: "step146_mock_fill_simulation_core_preflight_blocker_summary",
      sourceStep: "step146",
      status: result.status,
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    flags: { ...STEP146_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step146_mock_fill_simulation_core_preflight_v1" }),
  };
}

export function buildAdminTradingLabMockFillSimulationCorePreflightStatus(input = {}, options = {}) {
  const preflight = input.preflight || buildTradingLabMockFillSimulationCorePreflight(input, options);

  return {
    ok: true,
    step: "Step 146: Admin trading lab mock fill simulation core preflight",
    status: "admin_only_trading_lab_mock_fill_simulation_core_preflight_fail_closed",
    mockFillSimulationCorePreflightModel: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_MODEL,
    mockFillCoreInputBundleModel: TRADING_LAB_MOCK_FILL_CORE_INPUT_BUNDLE_MODEL,
    mockFillScenarioModel: TRADING_LAB_MOCK_FILL_SCENARIO_MODEL,
    mockFillSimulationCorePreflightResultSchema: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_RESULT_SCHEMA,
    preflight,
    validation: preflight.validation,
    result: preflight.result,
    inputBundle: preflight.inputBundle,
    scenario: preflight.scenario,
    policyValidation: preflight.policyValidation,
    cashAvailability: preflight.cashAvailability,
    positionImpact: preflight.positionImpact,
    deterministicReadiness: preflight.deterministicReadiness,
    blockerSummary: preflight.blockerSummary,
    flags: { ...STEP146_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep147FillSimulationCorePreflightContext(input = {}, options = {}) {
  const hasCorePreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockFillSimulationCorePreflightStatus");
  const mockFillSimulationCorePreflightStatus = hasCorePreflightStatus
    ? input.mockFillSimulationCorePreflightStatus
    : buildAdminTradingLabMockFillSimulationCorePreflightStatus(input, options);
  const preflight = input.preflight || mockFillSimulationCorePreflightStatus?.preflight || null;
  const validation = input.preflightValidation || mockFillSimulationCorePreflightStatus?.validation || preflight?.validation || null;
  const result = input.preflightResult || input.result || mockFillSimulationCorePreflightStatus?.result || preflight?.result || null;
  const inputBundle = input.inputBundle || mockFillSimulationCorePreflightStatus?.inputBundle || preflight?.inputBundle || null;
  const scenario = input.scenario || mockFillSimulationCorePreflightStatus?.scenario || preflight?.scenario || null;
  const policyValidation = input.policyValidation || mockFillSimulationCorePreflightStatus?.policyValidation || preflight?.policyValidation || {};
  const cashAvailability = input.cashAvailability || mockFillSimulationCorePreflightStatus?.cashAvailability || preflight?.cashAvailability || {};
  const positionImpact = input.positionImpact || mockFillSimulationCorePreflightStatus?.positionImpact || preflight?.positionImpact || {};
  const deterministicReadiness = input.deterministicReadiness || mockFillSimulationCorePreflightStatus?.deterministicReadiness || preflight?.deterministicReadiness || {};
  const reviewStatus = input.mockFillSimulationReviewResultStatus
    || preflight?.mockFillSimulationReviewResultStatus
    || mockFillSimulationCorePreflightStatus?.mockFillSimulationReviewResultStatus
    || null;
  const fillCandidates = input.fillCandidates
    || reviewStatus?.recordingGate?.mockFillSimulationPreflightStatus?.fillCandidates
    || reviewStatus?.recordingGate?.mockFillSimulationPreflightStatus?.preflight?.fillCandidates
    || [];

  return {
    mockFillSimulationCorePreflightStatus,
    preflight,
    validation,
    result,
    inputBundle,
    scenario,
    policyValidation,
    cashAvailability,
    positionImpact,
    deterministicReadiness,
    reviewStatus,
    fillCandidates,
  };
}

export function buildTradingLabMockFillCorePolicyReviewSummary(input = {}, options = {}) {
  const context = getStep147FillSimulationCorePreflightContext(input, options);
  const result = context.result || {};
  const statuses = [
    result.pricingPolicyStatus || context.policyValidation?.pricingPolicyStatus || context.policyValidation?.status || "validation_required",
    result.slippagePolicyStatus || context.policyValidation?.slippagePolicyStatus || context.policyValidation?.status || "validation_required",
    result.feePolicyStatus || context.policyValidation?.feePolicyStatus || context.policyValidation?.status || "validation_required",
    result.cashAvailabilityStatus || context.cashAvailability?.status || "validation_required",
    result.positionImpactStatus || context.positionImpact?.status || "validation_required",
    result.deterministicCalculationStatus || context.deterministicReadiness?.status || "validation_required",
  ];
  const status = statuses.includes("blocked") ? "blocked" : statuses.includes("validation_required") ? "validation_required" : "mock_only";

  return {
    summaryId: "step147_mock_fill_core_policy_review_summary",
    sourceStep: "step147",
    status,
    dependencyReviewStatus: context.result?.status === "mock_fill_core_ready" ? "mock_only" : context.result?.status === "blocked" ? "blocked" : "validation_required",
    pricingPolicyReviewStatus: statuses[0],
    slippagePolicyReviewStatus: statuses[1],
    feePolicyReviewStatus: statuses[2],
    cashAvailabilityReviewStatus: statuses[3],
    positionImpactReviewStatus: statuses[4],
    deterministicCalculationReviewStatus: statuses[5],
    positionRowCount: Array.isArray(context.positionImpact?.rows) ? context.positionImpact.rows.length : 0,
    redacted: true,
    actualFillPriceLookupAttempted: false,
    actualFeeScheduleQueried: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockFillSimulationCoreReviewResult(input = {}, options = {}) {
  const context = getStep147FillSimulationCorePreflightContext(input, options);
  const policyReviewSummary = input.policyReviewSummary || buildTradingLabMockFillCorePolicyReviewSummary(input, options);
  const blockers = [];
  const warnings = [];
  const candidates = Array.isArray(context.fillCandidates) ? context.fillCandidates : [];

  if (!context.preflight) blockers.push("mock_fill_simulation_core_preflight_missing");
  if (!context.result) blockers.push("mock_fill_simulation_core_preflight_result_missing");
  if (!context.inputBundle) blockers.push("mock_fill_core_input_bundle_missing");
  if (context.result && context.result.redacted !== true) blockers.push("mock_fill_simulation_core_preflight_result_not_redacted");
  if (context.inputBundle && context.inputBundle.redacted !== true) blockers.push("mock_fill_core_input_bundle_not_redacted");
  if (context.result && context.result.scope !== "mock_only") blockers.push("mock_fill_core_preflight_scope_not_mock_only");
  if (context.result && context.result.readinessImpact !== "none") blockers.push("preflight_readiness_impact_not_none");
  if (context.result && context.result.providerCallImpact !== "blocked") blockers.push("preflight_provider_call_impact_not_blocked");
  if (context.result && context.result.orderSubmissionImpact !== "blocked") blockers.push("preflight_order_submission_impact_not_blocked");
  if (context.result && context.result.liveTradingImpact !== "blocked") blockers.push("preflight_live_trading_impact_not_blocked");
  if (context.result?.status === "blocked") blockers.push("mock_fill_simulation_core_preflight_blocked");
  if (context.result?.status === "validation_required") warnings.push("mock_fill_simulation_core_preflight_validation_required");
  if (context.result?.nextAllowedStep && context.result.nextAllowedStep !== "mock_fill_simulation_core") blockers.push("preflight_next_step_not_mock_fill_simulation_core");
  if (context.inputBundle && String(context.inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.validation?.blockers?.includes("unsafe_live_or_order_mode_rejected")) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.validation?.blockers?.includes("wildcard_all_symbols_rejected")) blockers.push("wildcard_all_symbols_rejected");
  if (context.validation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (policyReviewSummary.status === "blocked") blockers.push("mock_fill_core_policy_review_blocked");
  if (policyReviewSummary.status === "validation_required") warnings.push("mock_fill_core_policy_review_validation_required");
  if (context.policyValidation?.status === "blocked") blockers.push("mock_fill_core_policy_blocked");
  if (context.cashAvailability?.status === "blocked") blockers.push("mock_fill_core_cash_availability_blocked");
  if (context.positionImpact?.status === "blocked") blockers.push("mock_fill_core_position_impact_blocked");
  if (context.deterministicReadiness?.status === "blocked") blockers.push("mock_fill_core_deterministic_readiness_blocked");
  if (candidates.some((candidate) => candidate.redacted !== true)) blockers.push("mock_fill_candidate_not_redacted");
  if (candidates.some((candidate) => candidate.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.kisFillPayloadCreated !== false)) blockers.push("kis_fill_payload_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualExecutionCreated !== false || candidate.executionRecordCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualFillRecordCreated !== false || candidate.fillRecordCreated !== false || candidate.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (candidates.some((candidate) => candidate.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");
  if (context.cashAvailability?.actualCashUpdated === true || context.result?.actualCashUpdated === true) blockers.push("actual_cash_update_must_not_run");
  if (context.positionImpact?.actualPositionUpdated === true || context.result?.actualPositionUpdated === true) blockers.push("actual_position_update_must_not_run");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.reviewResult || input.receipt || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";
  const decision = reviewStatus === "recorded" ? "mock_fill_core_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected";

  return {
    validationId: "step147_mock_fill_simulation_core_review_result_validation",
    sourceStep: "step147",
    reviewStatus,
    decision,
    fillCoreReviewResultId: "step147_mock_fill_core_review_result",
    fillCorePreflightId: context.result?.mockFillSimulationCorePreflightId || context.validation?.mockFillSimulationCorePreflightId || "missing_mock_fill_core_preflight",
    fillCoreInputBundleId: context.inputBundle?.inputBundleId || context.result?.inputBundleId || "missing_fill_core_input_bundle",
    fillSimulationReviewResultId: context.result?.fillSimulationReviewResultId || context.validation?.fillSimulationReviewResultId || "missing_fill_simulation_review_result",
    fillSimulationCandidateId: context.validation?.fillSimulationCandidateId || "missing_fill_simulation_candidate",
    mockExecutionReviewResultId: context.validation?.mockExecutionReviewResultId || "missing_mock_execution_review_result",
    mockOrderGenerationReviewResultId: context.reviewStatus?.reviewResult?.mockOrderGenerationReviewResultId || "missing_mock_order_generation_review_result",
    mockRunCandidateId: context.result?.mockRunCandidateId || context.validation?.mockRunCandidateId || "missing_mock_run_candidate",
    strategyDraftId: context.result?.strategyDraftId || context.validation?.strategyDraftId || context.inputBundle?.strategyDraftId || "missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    pricingPolicyReviewStatus: policyReviewSummary.pricingPolicyReviewStatus,
    slippagePolicyReviewStatus: policyReviewSummary.slippagePolicyReviewStatus,
    feePolicyReviewStatus: policyReviewSummary.feePolicyReviewStatus,
    cashAvailabilityReviewStatus: policyReviewSummary.cashAvailabilityReviewStatus,
    positionImpactReviewStatus: policyReviewSummary.positionImpactReviewStatus,
    deterministicCalculationReviewStatus: policyReviewSummary.deterministicCalculationReviewStatus,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step147_mock_fill_simulation_core_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockFillSimulationCoreReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationCoreReviewResult(input, options);

  return {
    fillCoreReviewResultId: validation.fillCoreReviewResultId,
    sourceStep: "step147",
    fillCorePreflightId: validation.fillCorePreflightId,
    fillCoreInputBundleId: validation.fillCoreInputBundleId,
    fillSimulationReviewResultId: validation.fillSimulationReviewResultId,
    fillSimulationCandidateId: validation.fillSimulationCandidateId,
    mockExecutionReviewResultId: validation.mockExecutionReviewResultId,
    mockOrderGenerationReviewResultId: validation.mockOrderGenerationReviewResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_recorded_at",
    reviewedBy: "admin_placeholder",
    summary: validation.reviewStatus === "recorded" ? "mock fill core review recorded" : validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    privatePathStored: false,
    hashValueStored: false,
    digestValueStored: false,
  };
}

export function buildTradingLabMockFillCoreReviewReceipt(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationCoreReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockFillSimulationCoreReviewResult({ ...input, validation }, options);

  return {
    receiptId: "step147_mock_fill_core_review_receipt",
    sourceStep: "step147",
    fillCoreReviewResultId: reviewResult.fillCoreReviewResultId,
    fillCorePreflightId: reviewResult.fillCorePreflightId,
    fillCoreInputBundleId: reviewResult.fillCoreInputBundleId,
    reviewStatus: reviewResult.reviewStatus,
    decision: reviewResult.decision,
    redacted: true,
    recordedAt: "placeholder_recorded_at",
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    pricingPolicyReviewStatus: validation.pricingPolicyReviewStatus,
    slippagePolicyReviewStatus: validation.slippagePolicyReviewStatus,
    feePolicyReviewStatus: validation.feePolicyReviewStatus,
    cashAvailabilityReviewStatus: validation.cashAvailabilityReviewStatus,
    positionImpactReviewStatus: validation.positionImpactReviewStatus,
    deterministicCalculationReviewStatus: validation.deterministicCalculationReviewStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_fill_simulation_core",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockFillCoreReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockFillSimulationCoreReviewResult(input, options);

  return {
    summaryId: "step147_mock_fill_core_review_decision_summary",
    sourceStep: "step147",
    decision: validation.decision,
    reviewStatus: validation.reviewStatus,
    blockers: validation.blockers,
    warnings: validation.warnings,
    blockerMessages: validation.blockerSummary,
    warningMessages: validation.warningSummary,
    messages: [
      "Mock fill core preparation review only.",
      "Not an actual fill result.",
      "Not an actual order candidate.",
      "No actual cash or position update.",
      "KIS calls and order submission remain blocked.",
      "External order authority evidence is still required.",
    ],
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabMockFillSimulationCoreReviewResultRecordingGate(input = {}, options = {}) {
  const mockFillSimulationCorePreflightStatus = input.mockFillSimulationCorePreflightStatus || buildAdminTradingLabMockFillSimulationCorePreflightStatus(input, options);
  const policyReviewSummary = input.policyReviewSummary || buildTradingLabMockFillCorePolicyReviewSummary(
    { ...input, mockFillSimulationCorePreflightStatus },
    options,
  );
  const validation = input.validation || validateTradingLabMockFillSimulationCoreReviewResult(
    { ...input, mockFillSimulationCorePreflightStatus, policyReviewSummary },
    options,
  );
  const reviewResult = input.reviewResult || buildTradingLabMockFillSimulationCoreReviewResult({ ...input, validation }, options);
  const receipt = input.receipt || buildTradingLabMockFillCoreReviewReceipt({ ...input, validation, reviewResult }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockFillCoreReviewDecisionSummary({ ...input, validation }, options);

  return {
    recordingGateId: "step147_mock_fill_simulation_core_review_result_recording_gate",
    sourceStep: "step147",
    status: validation.reviewStatus,
    decision: validation.decision,
    mockFillSimulationCorePreflightStatus,
    policyReviewSummary,
    validation,
    reviewResult,
    receipt,
    decisionSummary,
    blockerSummary: {
      summaryId: "step147_mock_fill_core_review_blocker_summary",
      sourceStep: "step147",
      blockers: validation.blockers,
      warnings: validation.warnings,
      blockerMessages: validation.blockerSummary,
      warningMessages: validation.warningSummary,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
    },
    mockHistory: [
      {
        historyId: "step147_mock_fill_core_review_history_1",
        sourceStep: "step147",
        reviewStatus: validation.reviewStatus,
        decision: validation.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_fill_simulation_core",
      },
    ],
    flags: { ...STEP147_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step147_mock_fill_simulation_core_review_result_recording_gate_v1" }),
  };
}

export function buildAdminTradingLabMockFillSimulationCoreReviewResultStatus(input = {}, options = {}) {
  const recordingGate = input.recordingGate || buildTradingLabMockFillSimulationCoreReviewResultRecordingGate(input, options);

  return {
    ok: true,
    step: "Step 147: Admin trading lab mock fill simulation core review result recording gate",
    status: "admin_only_trading_lab_mock_fill_simulation_core_review_result_recording_gate_fail_closed",
    mockFillSimulationCoreReviewResultModel: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_MODEL,
    mockFillCoreReviewReceiptSchema: TRADING_LAB_MOCK_FILL_CORE_REVIEW_RECEIPT_SCHEMA,
    mockFillCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_FILL_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockFillCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_FILL_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    recordingGate,
    validation: recordingGate.validation,
    reviewResult: recordingGate.reviewResult,
    receipt: recordingGate.receipt,
    policyReviewSummary: recordingGate.policyReviewSummary,
    decisionSummary: recordingGate.decisionSummary,
    blockerSummary: recordingGate.blockerSummary,
    mockHistory: recordingGate.mockHistory,
    flags: { ...STEP147_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}

function getStep148FillSimulationCoreContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockFillSimulationCoreReviewResultStatus");
  const mockFillSimulationCoreReviewResultStatus = hasReviewStatus
    ? input.mockFillSimulationCoreReviewResultStatus
    : buildAdminTradingLabMockFillSimulationCoreReviewResultStatus(input, options);
  const reviewResult = input.reviewResult || mockFillSimulationCoreReviewResultStatus?.reviewResult || mockFillSimulationCoreReviewResultStatus?.recordingGate?.reviewResult || null;
  const receipt = input.receipt || mockFillSimulationCoreReviewResultStatus?.receipt || mockFillSimulationCoreReviewResultStatus?.recordingGate?.receipt || null;
  const reviewValidation = input.reviewValidation || mockFillSimulationCoreReviewResultStatus?.validation || mockFillSimulationCoreReviewResultStatus?.recordingGate?.validation || null;
  const corePreflightStatus = input.mockFillSimulationCorePreflightStatus
    || mockFillSimulationCoreReviewResultStatus?.recordingGate?.mockFillSimulationCorePreflightStatus
    || null;
  const inputBundle = input.inputBundle || corePreflightStatus?.inputBundle || corePreflightStatus?.preflight?.inputBundle || null;
  const policyValidation = input.policyValidation || corePreflightStatus?.policyValidation || corePreflightStatus?.preflight?.policyValidation || {};
  const cashAvailability = input.cashAvailability || corePreflightStatus?.cashAvailability || corePreflightStatus?.preflight?.cashAvailability || {};
  const positionImpact = input.positionImpact || corePreflightStatus?.positionImpact || corePreflightStatus?.preflight?.positionImpact || {};
  const reviewStatus = input.mockFillSimulationReviewResultStatus
    || corePreflightStatus?.mockFillSimulationReviewResultStatus
    || corePreflightStatus?.preflight?.mockFillSimulationReviewResultStatus
    || null;
  const fillCandidates = input.fillCandidates
    || reviewStatus?.recordingGate?.mockFillSimulationPreflightStatus?.fillCandidates
    || reviewStatus?.recordingGate?.mockFillSimulationPreflightStatus?.preflight?.fillCandidates
    || [];

  return {
    mockFillSimulationCoreReviewResultStatus,
    reviewResult,
    receipt,
    reviewValidation,
    corePreflightStatus,
    inputBundle,
    policyValidation,
    cashAvailability,
    positionImpact,
    reviewStatus,
    fillCandidates: Array.isArray(fillCandidates) ? fillCandidates : [],
  };
}

function getMockFillMode(candidate = {}, index = 0) {
  const candidateMode = candidate.fillMode || candidate.mockFillMode || candidate.status;
  if (candidateMode === "partial_fill_placeholder" || candidateMode === "mock_partial") return "partial_fill_placeholder";
  if (candidateMode === "rejected_placeholder" || candidateMode === "mock_rejected" || candidate.status === "blocked") return "rejected_placeholder";
  if (index === 1) return "partial_fill_placeholder";
  if (index === 2) return "rejected_placeholder";
  return "full_fill";
}

export function buildTradingLabMockFillCalculationInputs(input = {}, options = {}) {
  const context = getStep148FillSimulationCoreContext(input, options);
  const defaultCandidates = context.fillCandidates.length > 0
    ? context.fillCandidates
    : [
        { mockFillSimulationCandidateId: "step148_mock_fill_candidate_buy", symbol: "QQQ", side: "mock_buy", mockQuantityPlaceholder: 2, mockFillPricePlaceholder: 100, mockSlippagePlaceholder: 0.1, mockFeePlaceholder: 0.05, redacted: true },
        { mockFillSimulationCandidateId: "step148_mock_fill_candidate_sell", symbol: "SCHD", side: "mock_sell", mockQuantityPlaceholder: 1, mockFillPricePlaceholder: 70, mockSlippagePlaceholder: 0.05, mockFeePlaceholder: 0.04, redacted: true },
        { mockFillSimulationCandidateId: "step148_mock_fill_candidate_rejected", symbol: "CASH", side: "mock_hold", mockQuantityPlaceholder: 0, mockFillPricePlaceholder: 1, mockSlippagePlaceholder: 0, mockFeePlaceholder: 0, redacted: true, status: "blocked" },
      ];
  const feeRate = Math.max(0, toFiniteNumber(context.policyValidation?.mockFeeRate, 0.0005));
  const slippageRate = Math.max(0, toFiniteNumber(context.policyValidation?.mockSlippageRate, 0.001));
  const cashBefore = Math.max(0, toFiniteNumber(context.cashAvailability?.startingCashPlaceholder ?? context.inputBundle?.cashPlaceholder, 100000));

  return defaultCandidates.slice(0, 6).map((candidate, index) => {
    const requestedQuantity = Math.max(0, toFiniteNumber(candidate.mockQuantityPlaceholder ?? candidate.requestedQuantity ?? index + 1, index + 1));
    const referencePrice = Math.max(0, toFiniteNumber(candidate.mockFillPricePlaceholder ?? candidate.mockExecutionPricePlaceholder ?? candidate.mockReferencePrice ?? 100 + index * 10, 100 + index * 10));
    const fillMode = getMockFillMode(candidate, index);

    return {
      calculationInputId: `step148_mock_fill_calculation_input_${index + 1}`,
      sourceStep: "step148",
      fillCoreInputBundleId: context.inputBundle?.inputBundleId || context.reviewResult?.fillCoreInputBundleId || "step148_missing_fill_core_input_bundle",
      fillSimulationCandidateId: candidate.mockFillSimulationCandidateId || candidate.fillSimulationCandidateId || `step148_mock_fill_candidate_${index + 1}`,
      fillCoreReviewResultId: context.reviewResult?.fillCoreReviewResultId || "step148_missing_fill_core_review_result",
      fillCorePreflightId: context.reviewResult?.fillCorePreflightId || context.reviewValidation?.fillCorePreflightId || "step148_missing_fill_core_preflight",
      mockRunCandidateId: context.reviewResult?.mockRunCandidateId || context.reviewValidation?.mockRunCandidateId || "step148_missing_mock_run_candidate",
      strategyDraftId: context.reviewResult?.strategyDraftId || context.reviewValidation?.strategyDraftId || "step148_missing_strategy_draft",
      mockExecutionPlanId: "mock_execution_plan_placeholder",
      mockOrderId: "mock_order_placeholder",
      symbol: candidate.symbol || `SYMBOL_${index + 1}_PLACEHOLDER`,
      side: candidate.side || "mock_hold",
      requestedQuantity,
      mockReferencePrice: referencePrice,
      mockLimitPrice: Math.max(0, toFiniteNumber(candidate.mockLimitPrice ?? referencePrice, referencePrice)),
      mockSlippageRate: Math.max(0, toFiniteNumber(candidate.mockSlippageRate ?? slippageRate, slippageRate)),
      mockFeeRate: Math.max(0, toFiniteNumber(candidate.mockFeeRate ?? feeRate, feeRate)),
      cashBeforePlaceholder: cashBefore,
      positionBeforePlaceholder: Math.max(0, toFiniteNumber(candidate.currentMockQuantity ?? candidate.positionBeforePlaceholder, 0)),
      partialFillRatioPlaceholder: Math.max(0, Math.min(1, toFiniteNumber(candidate.partialFillRatioPlaceholder, 0.5))),
      fillMode,
      scope: "mock_only",
      redacted: true,
      actualOrderCandidateCreated: false,
      actualOrderDraftCreated: false,
      kisOrderPayloadCreated: false,
      kisExecutionPayloadCreated: false,
      kisFillPayloadCreated: false,
      actualExecutionCreated: false,
      executionRecordCreated: false,
      actualFillRecordCreated: false,
      fillRecordCreated: false,
      fillCreated: false,
      accountBalanceQueried: false,
      actualCashUpdated: false,
      actualPositionUpdated: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
    };
  });
}

export function calculateTradingLabMockFillResult(calculationInput = {}) {
  const requestedQuantity = Math.max(0, toFiniteNumber(calculationInput.requestedQuantity, 0));
  const fillMode = calculationInput.fillMode || "full_fill";
  const partialRatio = Math.max(0, Math.min(1, toFiniteNumber(calculationInput.partialFillRatioPlaceholder, 0.5)));
  const filledQuantity = fillMode === "rejected_placeholder"
    ? 0
    : fillMode === "partial_fill_placeholder"
      ? roundQuantity(requestedQuantity * partialRatio)
      : roundQuantity(requestedQuantity);
  const side = calculationInput.side || "mock_hold";
  const referencePrice = Math.max(0, toFiniteNumber(calculationInput.mockReferencePrice, 0));
  const slippageRate = Math.max(0, toFiniteNumber(calculationInput.mockSlippageRate, 0));
  const feeRate = Math.max(0, toFiniteNumber(calculationInput.mockFeeRate, 0));
  const sideDirection = side === "mock_sell" ? -1 : side === "mock_buy" ? 1 : 0;
  const slippageUnit = fillMode === "rejected_placeholder" ? 0 : roundMoney(referencePrice * slippageRate);
  const mockFillPrice = fillMode === "rejected_placeholder"
    ? 0
    : roundMoney(referencePrice + (sideDirection >= 0 ? slippageUnit : -slippageUnit));
  const grossAmount = roundMoney(filledQuantity * mockFillPrice);
  const mockSlippage = roundMoney(filledQuantity * slippageUnit);
  const mockFee = roundMoney(grossAmount * feeRate);
  const netAmount = side === "mock_sell" ? roundMoney(grossAmount - mockFee) : roundMoney(grossAmount + mockFee);
  const cashDelta = fillMode === "rejected_placeholder"
    ? 0
    : side === "mock_buy"
      ? -netAmount
      : side === "mock_sell"
        ? netAmount
        : 0;
  const positionDelta = fillMode === "rejected_placeholder"
    ? 0
    : side === "mock_buy"
      ? filledQuantity
      : side === "mock_sell"
        ? -filledQuantity
        : 0;
  const fillStatus = fillMode === "rejected_placeholder"
    ? "mock_rejected"
    : fillMode === "partial_fill_placeholder"
      ? "mock_partial"
      : "mock_filled";

  return {
    mockFillResultId: `step148_mock_fill_result_${calculationInput.fillSimulationCandidateId || calculationInput.calculationInputId || "placeholder"}`,
    calculationInputId: calculationInput.calculationInputId || "step148_missing_calculation_input",
    sourceStep: "step148",
    fillCoreReviewResultId: calculationInput.fillCoreReviewResultId || "step148_missing_fill_core_review_result",
    fillCorePreflightId: calculationInput.fillCorePreflightId || "step148_missing_fill_core_preflight",
    fillCoreInputBundleId: calculationInput.fillCoreInputBundleId || "step148_missing_fill_core_input_bundle",
    fillSimulationCandidateId: calculationInput.fillSimulationCandidateId || "step148_missing_fill_candidate",
    mockRunCandidateId: calculationInput.mockRunCandidateId || "step148_missing_mock_run_candidate",
    strategyDraftId: calculationInput.strategyDraftId || "step148_missing_strategy_draft",
    scope: "mock_only",
    fillMode,
    fillStatus,
    symbol: calculationInput.symbol || "SYMBOL_PLACEHOLDER",
    side,
    requestedQuantity,
    filledQuantity,
    residualQuantityPlaceholder: roundQuantity(Math.max(0, requestedQuantity - filledQuantity)),
    mockFillPrice,
    mockSlippage,
    mockFee,
    grossAmount,
    netAmount,
    cashDelta,
    positionDelta,
    calculationStatus: "deterministic_mock_only",
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_portfolio_ledger_update_preflight",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateTradingLabMockFillSimulationCore(input = {}, options = {}) {
  const context = getStep148FillSimulationCoreContext(input, options);
  const calculationInputs = input.calculationInputs || buildTradingLabMockFillCalculationInputs(input, options);
  const blockers = [];
  const warnings = [];

  if (!context.reviewResult) blockers.push("mock_fill_core_review_result_missing");
  if (!context.receipt) blockers.push("mock_fill_core_review_receipt_missing");
  if (context.reviewResult && context.reviewResult.redacted !== true) blockers.push("mock_fill_core_review_result_not_redacted");
  if (context.receipt && context.receipt.redacted !== true) blockers.push("mock_fill_core_review_receipt_not_redacted");
  if (context.reviewResult && context.reviewResult.readinessImpact !== "none") blockers.push("review_readiness_impact_not_none");
  if (context.reviewResult && context.reviewResult.providerCallImpact !== "blocked") blockers.push("review_provider_call_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.orderSubmissionImpact !== "blocked") blockers.push("review_order_submission_impact_not_blocked");
  if (context.reviewResult && context.reviewResult.liveTradingImpact !== "blocked") blockers.push("review_live_trading_impact_not_blocked");
  if (context.inputBundle && context.inputBundle.redacted !== true) blockers.push("mock_fill_core_input_bundle_not_redacted");
  if (context.reviewResult?.reviewStatus === "blocked") blockers.push("mock_fill_core_review_result_blocked");
  if (context.reviewResult?.reviewStatus === "validation_required") warnings.push("mock_fill_core_review_result_validation_required");
  if (context.receipt?.nextAllowedStep && context.receipt.nextAllowedStep !== "mock_fill_simulation_core") blockers.push("review_next_step_not_mock_fill_simulation_core");
  if (context.inputBundle && String(context.inputBundle.mode || "").match(/live|real|production|order_submit|submit_order/i)) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.reviewValidation?.blockers?.includes("unsafe_live_or_order_mode_rejected")) blockers.push("unsafe_live_or_order_mode_rejected");
  if (context.reviewValidation?.blockers?.includes("wildcard_all_symbols_rejected")) blockers.push("wildcard_all_symbols_rejected");
  if (context.reviewValidation?.warnings?.includes("target_weight_residual_review_required")) warnings.push("target_weight_residual_review_required");
  if (!context.policyValidation || Object.keys(context.policyValidation).length === 0) warnings.push("mock_fill_policy_validation_required");
  if (!Array.isArray(calculationInputs) || calculationInputs.length === 0) blockers.push("mock_fill_calculation_input_missing");
  if (calculationInputs.some((item) => item.redacted !== true)) blockers.push("mock_fill_calculation_input_not_redacted");
  if (calculationInputs.some((item) => item.scope !== "mock_only")) blockers.push("mock_fill_calculation_input_scope_not_mock_only");
  if (calculationInputs.some((item) => String(item.fillMode || "").match(/live|market|real/i))) blockers.push("unsafe_fill_mode_rejected");
  if (calculationInputs.some((item) => item.actualOrderCandidateCreated !== false)) blockers.push("actual_order_candidate_must_not_be_created");
  if (calculationInputs.some((item) => item.actualOrderDraftCreated !== false)) blockers.push("actual_order_draft_must_not_be_created");
  if (calculationInputs.some((item) => item.kisOrderPayloadCreated !== false)) blockers.push("kis_order_payload_must_not_be_created");
  if (calculationInputs.some((item) => item.kisExecutionPayloadCreated !== false)) blockers.push("kis_execution_payload_must_not_be_created");
  if (calculationInputs.some((item) => item.kisFillPayloadCreated !== false)) blockers.push("kis_fill_payload_must_not_be_created");
  if (calculationInputs.some((item) => item.actualExecutionCreated !== false || item.executionRecordCreated !== false)) blockers.push("actual_execution_must_not_be_created");
  if (calculationInputs.some((item) => item.actualFillRecordCreated !== false || item.fillRecordCreated !== false || item.fillCreated !== false)) blockers.push("actual_fill_must_not_be_created");
  if (calculationInputs.some((item) => item.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");
  if (calculationInputs.some((item) => item.actualCashUpdated !== false)) blockers.push("actual_cash_update_must_not_run");
  if (calculationInputs.some((item) => item.actualPositionUpdated !== false)) blockers.push("actual_position_update_must_not_run");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.fillResultInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_fill_result_ready";

  return {
    validationId: "step148_mock_fill_simulation_core_validation",
    sourceStep: "step148",
    status,
    calculationStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic_mock_only",
    fillCoreReviewResultId: context.reviewResult?.fillCoreReviewResultId || "step148_missing_fill_core_review_result",
    fillCorePreflightId: context.reviewResult?.fillCorePreflightId || context.reviewValidation?.fillCorePreflightId || "step148_missing_fill_core_preflight",
    fillCoreInputBundleId: context.reviewResult?.fillCoreInputBundleId || context.inputBundle?.inputBundleId || "step148_missing_fill_core_input_bundle",
    mockRunCandidateId: context.reviewResult?.mockRunCandidateId || context.reviewValidation?.mockRunCandidateId || "step148_missing_mock_run_candidate",
    strategyDraftId: context.reviewResult?.strategyDraftId || context.reviewValidation?.strategyDraftId || "step148_missing_strategy_draft",
    inputCount: Array.isArray(calculationInputs) ? calculationInputs.length : 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step148_mock_fill_simulation_core_validation_v1" }),
  };
}

export function buildTradingLabMockFillSimulationCore(input = {}, options = {}) {
  const calculationInputs = input.calculationInputs || buildTradingLabMockFillCalculationInputs(input, options);
  const validation = input.validation || validateTradingLabMockFillSimulationCore({ ...input, calculationInputs }, options);
  const calculatedResults = calculationInputs.map((calculationInput) => calculateTradingLabMockFillResult(calculationInput));
  const fillResults = calculatedResults.map((result) => validation.status === "blocked"
    ? { ...result, fillStatus: "blocked", calculationStatus: "blocked" }
    : validation.status === "validation_required"
      ? { ...result, fillStatus: result.fillStatus === "mock_rejected" ? "mock_rejected" : "validation_required", calculationStatus: "validation_required" }
      : result);

  return {
    ok: true,
    step: "Step 148: Admin trading lab mock fill simulation core",
    status: "admin_only_trading_lab_mock_fill_simulation_core_fail_closed",
    sourceStep: "step148",
    mockFillResultModel: TRADING_LAB_MOCK_FILL_RESULT_MODEL,
    mockFillCalculationInputModel: TRADING_LAB_MOCK_FILL_CALCULATION_INPUT_MODEL,
    mockFillResultSchema: TRADING_LAB_MOCK_FILL_RESULT_SCHEMA,
    validation,
    calculationInputs,
    fillResults,
    summary: {
      summaryId: "step148_mock_fill_result_summary",
      sourceStep: "step148",
      fillResultCount: fillResults.length,
      filledCount: fillResults.filter((result) => result.fillStatus === "mock_filled").length,
      partialCount: fillResults.filter((result) => result.fillStatus === "mock_partial").length,
      rejectedCount: fillResults.filter((result) => result.fillStatus === "mock_rejected").length,
      blockedCount: fillResults.filter((result) => result.fillStatus === "blocked").length,
      validationRequiredCount: fillResults.filter((result) => result.fillStatus === "validation_required").length,
      totalGrossAmount: roundMoney(fillResults.reduce((sum, result) => sum + toFiniteNumber(result.grossAmount), 0)),
      totalNetAmount: roundMoney(fillResults.reduce((sum, result) => sum + toFiniteNumber(result.netAmount), 0)),
      totalMockFee: roundMoney(fillResults.reduce((sum, result) => sum + toFiniteNumber(result.mockFee), 0)),
      totalMockSlippage: roundMoney(fillResults.reduce((sum, result) => sum + toFiniteNumber(result.mockSlippage), 0)),
      cashDelta: roundMoney(fillResults.reduce((sum, result) => sum + toFiniteNumber(result.cashDelta), 0)),
      positionDeltaCount: fillResults.filter((result) => toFiniteNumber(result.positionDelta) !== 0).length,
      deterministic: true,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_preflight",
    },
    mockHistory: [
      {
        historyId: "step148_mock_fill_result_history_1",
        sourceStep: "step148",
        status: validation.status,
        fillResultCount: fillResults.length,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_ledger_update_preflight",
      },
    ],
    flags: { ...STEP148_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    actualOrderCandidateCreated: false,
    actualOrderDraftCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
    redaction: makeLabRedaction({ schema: "step148_mock_fill_simulation_core_status_v1" }),
  };
}

export function buildAdminTradingLabMockFillSimulationCoreStatus(input = {}, options = {}) {
  return buildTradingLabMockFillSimulationCore(input, options);
}

export function buildTradingLabStrategyConfig(options = {}) {
  const strategyDraft = options.strategyDraft || buildTradingLabStrategyConfigDraft({}, options);
  return {
    strategyId: options.strategyId || strategyDraft.strategyDraftId || "step131_admin_trading_lab_strategy_placeholder",
    strategyType: "admin_trading_lab_strategy_config",
    sourceStep: "step134",
    name: strategyDraft.strategyName || "Admin mock strategy draft",
    allowedModes: ["mock", "dry_run", "shadow"],
    activeMode: strategyDraft.mode || "mock",
    allowedSymbolsStatus: strategyDraft.allowedSymbolsStatus || "placeholder_only",
    allowedSymbols: strategyDraft.allowedSymbols || ["SYMBOL_A_PLACEHOLDER", "SYMBOL_B_PLACEHOLDER", "SYMBOL_C_PLACEHOLDER"],
    targetWeights: strategyDraft.targetWeights || [],
    rebalanceCondition: strategyDraft.rebalanceRule?.interval || "manual_review",
    maxOrderAmountStatus: strategyDraft.riskLimits?.maxOrderAmount > 0 ? "mock_limit_configured" : "not_configured_placeholder",
    maxDailyLossStatus: strategyDraft.riskLimits?.maxDailyLossPct > 0 ? "mock_limit_configured" : "blocked_by_default",
    maxPositionWeightStatus: strategyDraft.riskLimits?.maxPositionWeightPct > 0 ? "mock_limit_configured" : "blocked_by_default",
    killSwitchRequired: true,
    riskGateRequired: true,
    currentStatus: strategyDraft.status || "blocked",
    calculationSource: "step134_strategy_draft_mock_recalculation_boundary",
    flags: { ...STEP134_ADMIN_TRADING_LAB_STRATEGY_DRAFT_FLAGS },
    redaction: makeLabRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
  };
}

export function buildTradingLabDailyReturnSeries(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const calculated = options.dailyReturns || calculateTradingLabDailyReturnSeries(mockLedger, options);
  return {
    seriesId: options.seriesId || "step131_mock_daily_return_series",
    seriesType: "mock_daily_return_series",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    rows: calculated.rows,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_daily_return_series_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabCumulativePerformance(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const dailyReturns = options.dailyReturns || calculateTradingLabDailyReturnSeries(mockLedger, options);
  const summary = calculateTradingLabPerformanceSummary(mockLedger, { ...options, dailyReturns });
  return {
    performanceId: options.performanceId || "step131_mock_cumulative_performance",
    performanceType: "mock_cumulative_performance",
    ...summary,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_cumulative_performance_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabKpiSummaryCards(input = {}, options = {}) {
  const performance = input.performance || buildTradingLabCumulativePerformance(options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries(options);
  const positions = input.positions || buildTradingLabPositionSnapshot(options);
  const orderCandidates = input.orderCandidates || buildTradingLabOrderCandidateSummary(options);
  const latestRow = dailyReturns.rows.at(-1) || {};
  const positionWeight = positions.positions.reduce((sum, position) => sum + Number(position.weightPct || 0), 0);

  return {
    summaryId: options.summaryId || "step132_mock_kpi_summary_cards",
    summaryType: "mock_kpi_summary_cards",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    cards: [
      {
        cardId: "mock_total_equity",
        label: "Mock equity",
        value: Number(latestRow.equityPlaceholder || 0),
        valueType: "placeholder_currency",
        status: "mock_only",
      },
      {
        cardId: "mock_cumulative_return",
        label: "Cumulative return",
        value: Number(performance.cumulativeReturnPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_daily_return",
        label: "Latest daily return",
        value: Number(latestRow.dailyReturnPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_mdd",
        label: "Max drawdown",
        value: Number(performance.mddPct || 0),
        suffix: "%",
        status: "mock_only",
      },
      {
        cardId: "mock_position_weight",
        label: "Position weight",
        value: positionWeight,
        suffix: "%",
        status: "placeholder_only",
      },
      {
        cardId: "mock_order_candidates",
        label: "Order candidates",
        value: orderCandidates.candidates.length,
        status: "blocked",
      },
    ],
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabEquityVisualization(dailyReturns = buildTradingLabDailyReturnSeries(), options = {}) {
  return {
    visualizationId: options.visualizationId || "step132_mock_daily_equity_visualization",
    visualizationType: "mock_daily_equity_line",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      equity: Number(row.equity || row.equityPlaceholder || 0),
      equityPlaceholder: Number(row.equityPlaceholder || row.equity || 0),
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabReturnVisualization(dailyReturns = buildTradingLabDailyReturnSeries(), options = {}) {
  return {
    visualizationId: options.visualizationId || "step132_mock_return_visualization",
    visualizationType: "mock_return_bar_series",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    points: dailyReturns.rows.map((row, index) => ({
      index,
      date: row.date,
      dailyReturnPct: Number(row.dailyReturnPct || 0),
      cumulativeReturnPct: Number(row.cumulativeReturnPct || 0),
      drawdownPct: Number(row.drawdownPct || 0),
      status: "mock_calculated",
    })),
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    providerPayloadStored: false,
    orderPayloadStored: false,
    accountIdentifierStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabAllocationVisualization(
  positions = buildTradingLabPositionSnapshot(),
  strategy = buildTradingLabStrategyConfig(),
  options = {},
) {
  const targetWeights = new Map((strategy.targetWeights || []).map((target) => [target.symbol, Number(target.weightPct || 0)]));
  const allocationSummary = options.allocationSummary || calculateTradingLabAllocationSummary({
    positions: positions.positions || [],
    totalMarketValue: positions.totalMarketValue || 0,
    totalEquity: positions.totalEquity || 0,
    cash: positions.cash || 0,
  });

  return {
    visualizationId: options.visualizationId || "step132_mock_allocation_visualization",
    visualizationType: "mock_allocation_table_bars",
    sourceStep: "step133",
    dataSource: "mock_ledger_calculation_result",
    staticPlaceholderSourceRetained: "static_placeholder_only",
    allocations: allocationSummary.allocations.map((position) => ({
      symbol: position.symbol,
      name: position.name,
      weightPct: Number(position.weightPct || 0),
      marketValue: Number(position.marketValue || 0),
      unrealizedPnl: Number(position.unrealizedPnl || 0),
      targetWeightPct: targetWeights.get(position.symbol) || 0,
      status: position.status || "mock_calculated",
    })),
    positionWeightTotalPct: allocationSummary.positionWeightTotalPct,
    residualCashWeightPct: allocationSummary.residualCashWeightPct,
    totalWeightPct: allocationSummary.totalWeightPct,
    redaction: makeLabRedaction({ schema: "step132_admin_trading_lab_visualization_v1" }),
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabPositionSnapshot(options = {}) {
  const mockLedger = options.mockLedger || buildTradingLabMockLedger(options);
  const calculated = options.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  return {
    snapshotId: options.snapshotId || "step131_mock_position_snapshot",
    snapshotType: "mock_position_snapshot",
    sourceStep: "step133",
    status: "mock_calculated",
    dataSource: "mock_ledger_calculation_result",
    positions: calculated.positions.map((position) => ({
      ...position,
      quantityPlaceholder: position.quantity,
      averagePricePlaceholder: position.averagePrice,
      currentPricePlaceholder: position.mockCurrentPrice,
      marketValuePlaceholder: position.marketValue,
      unrealizedPnLPlaceholder: position.unrealizedPnl,
    })),
    cash: calculated.cash,
    totalMarketValue: calculated.totalMarketValue,
    totalEquity: calculated.totalEquity,
    redaction: makeLabRedaction({ schema: "step133_admin_trading_lab_position_snapshot_v1" }),
    accountIdentifierStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildTradingLabOrderCandidateSummary(options = {}) {
  return {
    summaryId: options.summaryId || "step131_mock_order_candidate_summary",
    summaryType: "mock_order_candidate_summary",
    sourceStep: "step131",
    status: "blocked",
    candidates: [
      {
        draftId: "step131_mock_draft_candidate_1",
        mode: "mock",
        sidePlaceholder: "mock_side_only",
        quantityPlaceholder: "mock_quantity_only",
        estimatedAmountPlaceholder: "mock_amount_only",
        riskStatus: "blocked",
        killSwitchStatus: "active_blocking",
        preflightStatus: "not_ready",
      },
    ],
    redaction: makeLabRedaction(),
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderSubmissionAttempted: false,
  };
}

export function buildTradingLabAuditLogSummary(options = {}) {
  return {
    summaryId: options.summaryId || "step131_mock_audit_log_summary",
    summaryType: "mock_audit_log_summary",
    sourceStep: "step131",
    storageMode: "static_in_memory_placeholder_only",
    events: [
      {
        eventId: "step131_mock_audit_event_1",
        eventType: "trading_lab_dashboard_snapshot",
        status: "blocked",
        createdAt: "2026-07-03T00:00:00.000Z",
        redactedReason: "metadata_only_no_private_values",
        blockedReason: "live_provider_and_order_paths_disabled",
      },
    ],
    redaction: makeLabRedaction(),
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function buildAdminTradingLabDashboardStatus(input = {}, options = {}) {
  const strategyDraftStatus = input.strategyDraftStatus || buildAdminTradingLabStrategyDraftStatus(input.strategyDraft || {}, options);
  const strategyDraftReviewStatus = input.strategyDraftReviewStatus || buildAdminTradingLabStrategyDraftReviewStatus(
    { ...input, strategyDraft: strategyDraftStatus.strategyDraft, validation: strategyDraftStatus.validation },
    options,
  );
  const strategyDraftReviewResultStatus = input.strategyDraftReviewResultStatus || buildAdminTradingLabStrategyDraftReviewResultStatus(
    {
      ...input,
      strategyDraft: strategyDraftStatus.strategyDraft,
      validation: strategyDraftStatus.validation,
      comparison: strategyDraftReviewStatus.comparison,
      reviewGate: strategyDraftReviewStatus.reviewGate,
    },
    options,
  );
  const strategyDraftClearancePreflightStatus = input.strategyDraftClearancePreflightStatus || buildAdminTradingLabStrategyDraftClearancePreflightStatus(
    {
      ...input,
      strategyDraft: strategyDraftStatus.strategyDraft,
      validation: strategyDraftStatus.validation,
      comparison: strategyDraftReviewStatus.comparison,
      reviewGate: strategyDraftReviewStatus.reviewGate,
      reviewResultStatus: strategyDraftReviewResultStatus,
    },
    options,
  );
  const strategyDraftClearanceReviewResultStatus = input.strategyDraftClearanceReviewResultStatus || buildAdminTradingLabStrategyDraftClearanceReviewResultStatus(
    {
      ...input,
      strategyDraft: strategyDraftStatus.strategyDraft,
      validation: strategyDraftStatus.validation,
      comparison: strategyDraftReviewStatus.comparison,
      reviewGate: strategyDraftReviewStatus.reviewGate,
      reviewResultStatus: strategyDraftReviewResultStatus,
      clearancePreflightStatus: strategyDraftClearancePreflightStatus,
    },
    options,
  );
  const mockRunCandidatePreflightStatus = input.mockRunCandidatePreflightStatus || buildAdminTradingLabMockRunCandidatePreflightStatus(
    {
      ...input,
      strategyDraft: strategyDraftStatus.strategyDraft,
      validation: strategyDraftStatus.validation,
      clearanceReviewResultStatus: strategyDraftClearanceReviewResultStatus,
    },
    options,
  );
  const mockRecalculationBoundary = input.mockRecalculationBoundary || strategyDraftStatus.mockRecalculationBoundary;
  const mockLedger = input.mockLedger || mockRecalculationBoundary.mockLedger || buildTradingLabMockLedger(options);
  const mockTradeEvents = input.mockTradeEvents || buildTradingLabMockTradeEvents({ ...options, events: mockLedger.events });
  const positionLedger = input.positionLedger || calculateTradingLabPositionLedger(mockLedger, options);
  const dailyEquity = input.dailyEquity || calculateTradingLabDailyEquitySeries(mockLedger, options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries({ ...options, mockLedger, dailyReturns: calculateTradingLabDailyReturnSeries(mockLedger, { ...options, dailyEquity }) });
  const cumulativeReturns = input.cumulativeReturns || calculateTradingLabCumulativeReturnSeries(mockLedger, { ...options, dailyReturns });
  const drawdownSummary = input.drawdownSummary || calculateTradingLabDrawdownSummary(mockLedger, { ...options, dailyReturns });
  const allocationSummary = input.allocationSummary || calculateTradingLabAllocationSummary(positionLedger, options);
  const mockOrderGenerationPreflightStatus = input.mockOrderGenerationPreflightStatus || buildAdminTradingLabMockOrderGenerationPreflightStatus(
    {
      ...input,
      mockRunCandidatePreflightStatus,
      inputBundle: mockRunCandidatePreflightStatus.inputBundle,
      mockLedger,
      positionLedger,
      allocationSummary,
    },
    options,
  );
  const mockOrderGenerationReviewResultStatus = input.mockOrderGenerationReviewResultStatus || buildAdminTradingLabMockOrderGenerationReviewResultStatus(
    {
      ...input,
      mockOrderGenerationPreflightStatus,
    },
    options,
  );
  const mockExecutionPreflightStatus = input.mockExecutionPreflightStatus || buildAdminTradingLabMockExecutionPreflightStatus(
    {
      ...input,
      mockOrderGenerationReviewResultStatus,
      mockLedger,
      positionLedger,
      allocationSummary,
    },
    options,
  );
  const mockExecutionReviewResultStatus = input.mockExecutionReviewResultStatus || buildAdminTradingLabMockExecutionReviewResultStatus(
    {
      ...input,
      mockExecutionPreflightStatus,
    },
    options,
  );
  const mockFillSimulationPreflightStatus = input.mockFillSimulationPreflightStatus || buildAdminTradingLabMockFillSimulationPreflightStatus(
    {
      ...input,
      mockExecutionReviewResultStatus,
      mockLedger,
      positionLedger,
      allocationSummary,
    },
    options,
  );
  const mockFillSimulationReviewResultStatus = input.mockFillSimulationReviewResultStatus || buildAdminTradingLabMockFillSimulationReviewResultStatus(
    {
      ...input,
      mockFillSimulationPreflightStatus,
    },
    options,
  );
  const mockFillSimulationCorePreflightStatus = input.mockFillSimulationCorePreflightStatus || buildAdminTradingLabMockFillSimulationCorePreflightStatus(
    {
      ...input,
      mockFillSimulationReviewResultStatus,
    },
    options,
  );
  const mockFillSimulationCoreReviewResultStatus = input.mockFillSimulationCoreReviewResultStatus || buildAdminTradingLabMockFillSimulationCoreReviewResultStatus(
    {
      ...input,
      mockFillSimulationCorePreflightStatus,
    },
    options,
  );
  const mockFillSimulationCoreStatus = input.mockFillSimulationCoreStatus || buildAdminTradingLabMockFillSimulationCoreStatus(
    {
      ...input,
      mockFillSimulationCoreReviewResultStatus,
    },
    options,
  );
  const performance = input.performance || buildTradingLabCumulativePerformance({ ...options, mockLedger, dailyReturns });
  const strategy = input.strategy || buildTradingLabStrategyConfig({ ...options, strategyDraft: strategyDraftStatus.strategyDraft });
  const positions = input.positions || buildTradingLabPositionSnapshot({ ...options, mockLedger, positionLedger });
  const orderCandidates = input.orderCandidates || buildTradingLabOrderCandidateSummary(options);
  const auditLogs = input.auditLogs || buildTradingLabAuditLogSummary(options);
  const kpiCards = input.kpiCards || buildTradingLabKpiSummaryCards(
    { performance, dailyReturns, positions, orderCandidates },
    options,
  );
  const equityVisualization = input.equityVisualization || buildTradingLabEquityVisualization(dailyReturns, options);
  const returnVisualization = input.returnVisualization || buildTradingLabReturnVisualization(dailyReturns, options);
  const allocationVisualization = input.allocationVisualization || buildTradingLabAllocationVisualization(
    positions,
    strategy,
    { ...options, allocationSummary },
  );

  return {
    ok: true,
    step: "Step 148: Admin trading lab mock fill simulation core",
    status: "admin_only_trading_lab_dashboard_shell_fail_closed",
    calculationMode: "strategy_draft_mock_recalculation_admin_only",
    step133CalculationMode: "mock_ledger_calculation_admin_only",
    step133Compatibility: {
      calculationMode: "mock_ledger_calculation_admin_only",
      mockLedgerCalculationCoreRetained: true,
    },
    visualizationMode: "mock_static_admin_only",
    strategyConfigSchema: TRADING_LAB_STRATEGY_CONFIG_SCHEMA,
    strategyDraftStatus,
    strategyDraftReviewStatus,
    strategyDraftReviewResultStatus,
    strategyDraftClearancePreflightStatus,
    strategyDraftClearanceReviewResultStatus,
    mockRunCandidatePreflightStatus,
    mockOrderGenerationPreflightStatus,
    mockOrderGenerationReviewResultStatus,
    mockExecutionPreflightStatus,
    mockExecutionReviewResultStatus,
    mockFillSimulationPreflightStatus,
    mockFillSimulationReviewResultStatus,
    mockFillSimulationCorePreflightStatus,
    mockFillSimulationCoreReviewResultStatus,
    mockFillSimulationCoreStatus,
    strategyDraftSchema: TRADING_LAB_STRATEGY_CONFIG_DRAFT_SCHEMA,
    strategyDraftComparisonSchema: TRADING_LAB_STRATEGY_DRAFT_COMPARISON_SCHEMA,
    strategyDraftChangeHistoryModel: TRADING_LAB_STRATEGY_DRAFT_CHANGE_HISTORY_MODEL,
    strategyRiskImpactPreviewSchema: TRADING_LAB_STRATEGY_RISK_IMPACT_PREVIEW_SCHEMA,
    strategyDraftReviewResultSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_SCHEMA,
    strategyDraftReviewResultRecordingSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RESULT_RECORDING_SCHEMA,
    strategyDraftReviewReceiptSchema: TRADING_LAB_STRATEGY_DRAFT_REVIEW_RECEIPT_SCHEMA,
    strategyDraftReviewBlockerSummaryModel: TRADING_LAB_STRATEGY_DRAFT_REVIEW_BLOCKER_SUMMARY_MODEL,
    strategyDraftClearancePreflightSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_SCHEMA,
    strategyDraftClearanceCandidateModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_CANDIDATE_MODEL,
    strategyDraftClearanceBlockerModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_BLOCKER_MODEL,
    strategyDraftClearancePreflightResultSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_PREFLIGHT_RESULT_SCHEMA,
    strategyDraftClearanceReviewResultRecordingSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RESULT_RECORDING_SCHEMA,
    strategyDraftClearanceReviewReceiptSchema: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_RECEIPT_SCHEMA,
    strategyDraftClearanceReviewDecisionSummaryModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_DECISION_SUMMARY_MODEL,
    strategyDraftClearanceReviewBlockerSummaryModel: TRADING_LAB_STRATEGY_DRAFT_CLEARANCE_REVIEW_BLOCKER_SUMMARY_MODEL,
    mockRunCandidateModel: TRADING_LAB_MOCK_RUN_CANDIDATE_MODEL,
    mockRunPreflightModel: TRADING_LAB_MOCK_RUN_PREFLIGHT_MODEL,
    mockRunInputBundleModel: TRADING_LAB_MOCK_RUN_INPUT_BUNDLE_MODEL,
    mockRunUniverseSnapshotModel: TRADING_LAB_MOCK_RUN_UNIVERSE_SNAPSHOT_MODEL,
    mockRunInitialCapitalModel: TRADING_LAB_MOCK_RUN_INITIAL_CAPITAL_MODEL,
    mockRunReadinessSchema: TRADING_LAB_MOCK_RUN_READINESS_SCHEMA,
    mockRunPreflightResultSchema: TRADING_LAB_MOCK_RUN_PREFLIGHT_RESULT_SCHEMA,
    mockOrderGenerationPreflightModel: TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_MODEL,
    mockOrderIntentModel: TRADING_LAB_MOCK_ORDER_INTENT_MODEL,
    mockRebalanceDeltaModel: TRADING_LAB_MOCK_REBALANCE_DELTA_MODEL,
    mockTargetAllocationGapModel: TRADING_LAB_MOCK_TARGET_ALLOCATION_GAP_MODEL,
    mockBuySellSignalPlaceholderModel: TRADING_LAB_MOCK_BUY_SELL_SIGNAL_PLACEHOLDER_MODEL,
    mockOrderGenerationRiskGuardPreflightModel: TRADING_LAB_MOCK_ORDER_GENERATION_RISK_GUARD_PREFLIGHT_MODEL,
    mockOrderGenerationPreflightResultSchema: TRADING_LAB_MOCK_ORDER_GENERATION_PREFLIGHT_RESULT_SCHEMA,
    mockOrderGenerationReviewResultModel: TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RESULT_MODEL,
    mockOrderGenerationReviewReceiptSchema: TRADING_LAB_MOCK_ORDER_GENERATION_REVIEW_RECEIPT_SCHEMA,
    mockOrderIntentReviewSummaryModel: TRADING_LAB_MOCK_ORDER_INTENT_REVIEW_SUMMARY_MODEL,
    mockOrderReviewDecisionSummaryModel: TRADING_LAB_MOCK_ORDER_REVIEW_DECISION_SUMMARY_MODEL,
    mockExecutionPreflightModel: TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_MODEL,
    mockExecutionIntentModel: TRADING_LAB_MOCK_EXECUTION_INTENT_MODEL,
    mockFillPlanPlaceholderModel: TRADING_LAB_MOCK_FILL_PLAN_PLACEHOLDER_MODEL,
    mockExecutionRiskGuardPreflightModel: TRADING_LAB_MOCK_EXECUTION_RISK_GUARD_PREFLIGHT_MODEL,
    mockExecutionCashImpactPreviewModel: TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_PREVIEW_MODEL,
    mockExecutionPositionImpactPreviewModel: TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_PREVIEW_MODEL,
    mockExecutionPreflightResultSchema: TRADING_LAB_MOCK_EXECUTION_PREFLIGHT_RESULT_SCHEMA,
    mockExecutionReviewResultModel: TRADING_LAB_MOCK_EXECUTION_REVIEW_RESULT_MODEL,
    mockExecutionReviewReceiptSchema: TRADING_LAB_MOCK_EXECUTION_REVIEW_RECEIPT_SCHEMA,
    mockExecutionIntentReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_INTENT_REVIEW_SUMMARY_MODEL,
    mockFillPlanReviewSummaryModel: TRADING_LAB_MOCK_FILL_PLAN_REVIEW_SUMMARY_MODEL,
    mockExecutionCashImpactReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_CASH_IMPACT_REVIEW_SUMMARY_MODEL,
    mockExecutionPositionImpactReviewSummaryModel: TRADING_LAB_MOCK_EXECUTION_POSITION_IMPACT_REVIEW_SUMMARY_MODEL,
    mockExecutionReviewDecisionSummaryModel: TRADING_LAB_MOCK_EXECUTION_REVIEW_DECISION_SUMMARY_MODEL,
    mockFillSimulationPreflightModel: TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_MODEL,
    mockFillSimulationCandidateModel: TRADING_LAB_MOCK_FILL_SIMULATION_CANDIDATE_MODEL,
    mockFillPolicyModel: TRADING_LAB_MOCK_FILL_POLICY_MODEL,
    mockFillSlippageFeePreviewModel: TRADING_LAB_MOCK_FILL_SLIPPAGE_FEE_PREVIEW_MODEL,
    mockFillCashImpactValidationModel: TRADING_LAB_MOCK_FILL_CASH_IMPACT_VALIDATION_MODEL,
    mockFillPositionImpactValidationModel: TRADING_LAB_MOCK_FILL_POSITION_IMPACT_VALIDATION_MODEL,
    mockFillSimulationPreflightResultSchema: TRADING_LAB_MOCK_FILL_SIMULATION_PREFLIGHT_RESULT_SCHEMA,
    mockFillSimulationReviewResultModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RESULT_MODEL,
    mockFillSimulationReviewReceiptSchema: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_RECEIPT_SCHEMA,
    mockFillSimulationReviewDecisionSummaryModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_DECISION_SUMMARY_MODEL,
    mockFillSimulationReviewImpactSummaryModel: TRADING_LAB_MOCK_FILL_SIMULATION_REVIEW_IMPACT_SUMMARY_MODEL,
    mockFillSimulationCorePreflightModel: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_MODEL,
    mockFillCoreInputBundleModel: TRADING_LAB_MOCK_FILL_CORE_INPUT_BUNDLE_MODEL,
    mockFillScenarioModel: TRADING_LAB_MOCK_FILL_SCENARIO_MODEL,
    mockFillSimulationCorePreflightResultSchema: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_PREFLIGHT_RESULT_SCHEMA,
    mockFillSimulationCoreReviewResultModel: TRADING_LAB_MOCK_FILL_SIMULATION_CORE_REVIEW_RESULT_MODEL,
    mockFillCoreReviewReceiptSchema: TRADING_LAB_MOCK_FILL_CORE_REVIEW_RECEIPT_SCHEMA,
    mockFillCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_FILL_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockFillCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_FILL_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    mockFillResultModel: TRADING_LAB_MOCK_FILL_RESULT_MODEL,
    mockFillCalculationInputModel: TRADING_LAB_MOCK_FILL_CALCULATION_INPUT_MODEL,
    mockFillResultSchema: TRADING_LAB_MOCK_FILL_RESULT_SCHEMA,
    targetWeightDraftModel: TRADING_LAB_TARGET_WEIGHT_DRAFT_MODEL,
    rebalanceRuleDraftModel: TRADING_LAB_REBALANCE_RULE_DRAFT_MODEL,
    riskLimitDraftModel: TRADING_LAB_RISK_LIMIT_DRAFT_MODEL,
    mockRecalculationBoundary,
    dailyReturnSeriesSchema: TRADING_LAB_DAILY_RETURN_SERIES_SCHEMA,
    cumulativePerformanceSchema: TRADING_LAB_CUMULATIVE_PERFORMANCE_SCHEMA,
    kpiSummaryCardSchema: TRADING_LAB_KPI_SUMMARY_CARD_SCHEMA,
    equityVisualizationSchema: TRADING_LAB_EQUITY_VISUALIZATION_SCHEMA,
    returnVisualizationSchema: TRADING_LAB_RETURN_VISUALIZATION_SCHEMA,
    allocationVisualizationSchema: TRADING_LAB_ALLOCATION_VISUALIZATION_SCHEMA,
    mockLedgerSchema: TRADING_LAB_MOCK_LEDGER_SCHEMA,
    mockTradeEventSchema: TRADING_LAB_MOCK_TRADE_EVENT_SCHEMA,
    positionSnapshotSchema: TRADING_LAB_POSITION_SNAPSHOT_SCHEMA,
    orderCandidateSummarySchema: TRADING_LAB_ORDER_CANDIDATE_SUMMARY_SCHEMA,
    auditLogSummarySchema: TRADING_LAB_AUDIT_LOG_SUMMARY_SCHEMA,
    mockLedger,
    mockTradeEvents,
    positionLedger,
    dailyEquity,
    cumulativeReturns,
    drawdownSummary,
    allocationSummary,
    strategy,
    dailyReturns,
    performance,
    kpiCards,
    equityVisualization,
    returnVisualization,
    allocationVisualization,
    positions,
    orderCandidates,
    auditLogs,
    flags: { ...STEP148_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
