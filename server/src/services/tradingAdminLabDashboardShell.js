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

export const STEP149_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP148_ADMIN_TRADING_LAB_MOCK_FILL_SIMULATION_CORE_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP150_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP149_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP151_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP150_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP152_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP151_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP153_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_FLAGS = Object.freeze({
  ...STEP152_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP154_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP153_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP155_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP154_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP156_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP155_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP157_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP156_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP158_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_FLAGS = Object.freeze({
  ...STEP157_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP159_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP158_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP160_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP159_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP161_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_FLAGS = Object.freeze({
  ...STEP160_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP162_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_FLAGS = Object.freeze({
  ...STEP161_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP163_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP162_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const STEP164_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_FLAGS = Object.freeze({
  ...STEP163_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_FLAGS,
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

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_MODEL = Object.freeze({
  ledgerUpdatePreflightId: "string",
  sourceStep: "step149",
  mockFillResultId: "string",
  calculationInputId: "string",
  fillCoreReviewResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_ledger_update_ready | not_ready",
  cashDeltaStatus: "valid | blocked | validation_required",
  positionDeltaStatus: "valid | blocked | validation_required",
  portfolioValueImpactStatus: "valid | blocked | validation_required",
  realizedPnlStatus: "placeholder_only | blocked | validation_required",
  unrealizedPnlStatus: "placeholder_only | blocked | validation_required",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  dependencyStatus: "mock_fill_result_required | satisfied | blocked",
  blockerCount: "number",
  warningCount: "number",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_CANDIDATE_MODEL = Object.freeze({
  ledgerUpdateCandidateId: "string",
  sourceStep: "step149",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  updateType: "mock_cash_position_delta",
  cashBeforePlaceholder: "number",
  cashDelta: "number",
  cashAfterPreview: "number",
  positionBeforePlaceholder: "number",
  positionDelta: "number",
  positionAfterPreview: "number",
  portfolioValueBeforePlaceholder: "number",
  portfolioValueAfterPreview: "number",
  status: "blocked | validation_required | candidate",
  redacted: true,
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  ledgerUpdatePreflightId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  status: "blocked | validation_required | mock_ledger_update_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  cashDeltaStatus: "valid | blocked | validation_required",
  positionDeltaStatus: "valid | blocked | validation_required",
  portfolioValueImpactStatus: "valid | blocked | validation_required",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  cashAfterPreview: "number",
  positionAfterPreview: "number",
  portfolioValueAfterPreview: "number",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_ledger_update_review_result",
});

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_MODEL = Object.freeze({
  ledgerUpdateReviewResultId: "string",
  ledgerUpdatePreflightId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  calculationInputId: "string",
  fillCoreReviewResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_ledger_update_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  summary: "string[]",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  ledgerUpdateReviewResultId: "string",
  ledgerUpdatePreflightId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_ledger_update_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  blockerCount: "number",
  warningCount: "number",
  cashDeltaReviewStatus: "reviewed | blocked | validation_required",
  positionDeltaReviewStatus: "reviewed | blocked | validation_required",
  portfolioValueImpactReviewStatus: "reviewed | blocked | validation_required",
  ledgerConsistencyReviewStatus: "deterministic | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_ledger_update_core_preflight",
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step150",
  decision: "mock_ledger_update_review_recorded | blocked | rejected",
  blockerCount: "number",
  warningCount: "number",
  externalOrderAuthorityRequired: true,
  actualLedgerUpdateAllowed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_IMPACT_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step150",
  cashDeltaReviewStatus: "reviewed | blocked | validation_required",
  positionDeltaReviewStatus: "reviewed | blocked | validation_required",
  portfolioValueImpactReviewStatus: "reviewed | blocked | validation_required",
  ledgerConsistencyReviewStatus: "deterministic | blocked | validation_required",
  dependencyReviewStatus: "satisfied | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_MODEL = Object.freeze({
  ledgerUpdateCorePreflightId: "string",
  sourceStep: "step151",
  ledgerUpdateReviewResultId: "string",
  ledgerUpdatePreflightId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_ledger_update_core_ready | not_ready",
  cashLedgerPolicyStatus: "valid | blocked | validation_required",
  positionLedgerPolicyStatus: "valid | blocked | validation_required",
  valuationPolicyStatus: "valid | blocked | validation_required",
  pnlPlaceholderStatus: "placeholder_only | blocked | validation_required",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  deterministicUpdateStatus: "deterministic | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_LEDGER_CORE_INPUT_BUNDLE_MODEL = Object.freeze({
  ledgerCoreInputBundleId: "string",
  sourceStep: "step151",
  ledgerUpdateReviewResultId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  scope: "mock_only",
  updateType: "mock_cash_position_delta_preview",
  cashBeforePlaceholder: "number",
  cashDelta: "number",
  cashAfterPreview: "number",
  positionBeforePlaceholder: "number",
  positionDelta: "number",
  positionAfterPreview: "number",
  portfolioValueBeforePlaceholder: "number",
  portfolioValueAfterPreview: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_SCENARIO_MODEL = Object.freeze({
  ledgerUpdateScenarioId: "string",
  sourceStep: "step151",
  ledgerCoreInputBundleId: "string",
  scope: "mock_only",
  updateMode: "mock_cash_position_delta_preview",
  cashLedgerPolicy: "mock_cash_delta_preview_only",
  positionLedgerPolicy: "mock_position_delta_preview_only",
  valuationPolicy: "static_mock_series_only",
  pnlPolicy: "placeholder_only",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  ledgerUpdateCorePreflightId: "string",
  ledgerCoreInputBundleId: "string",
  ledgerUpdateReviewResultId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  status: "blocked | validation_required | mock_ledger_update_core_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  cashLedgerPolicyStatus: "valid | blocked | validation_required",
  positionLedgerPolicyStatus: "valid | blocked | validation_required",
  valuationPolicyStatus: "valid | blocked | validation_required",
  pnlPlaceholderStatus: "placeholder_only | blocked | validation_required",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  deterministicUpdateStatus: "deterministic | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_ledger_update_core",
});

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_MODEL = Object.freeze({
  ledgerUpdateCoreReviewResultId: "string",
  sourceStep: "step152",
  ledgerUpdateCorePreflightId: "string",
  ledgerCoreInputBundleId: "string",
  ledgerUpdateReviewResultId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_ledger_update_core_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  summary: "string[]",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  ledgerUpdateCoreReviewResultId: "string",
  ledgerUpdateCorePreflightId: "string",
  ledgerCoreInputBundleId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_ledger_update_core_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  blockerCount: "number",
  warningCount: "number",
  cashLedgerPolicyReviewStatus: "reviewed | blocked | validation_required",
  positionLedgerPolicyReviewStatus: "reviewed | blocked | validation_required",
  portfolioValuationPolicyReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  ledgerConsistencyReviewStatus: "deterministic | blocked | validation_required",
  deterministicUpdateReviewStatus: "deterministic | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_ledger_update_core",
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step152",
  decision: "mock_ledger_update_core_review_recorded | blocked | rejected",
  blockerCount: "number",
  warningCount: "number",
  externalOrderAuthorityRequired: true,
  actualLedgerUpdateAllowed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_POLICY_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step152",
  cashLedgerPolicyReviewStatus: "reviewed | blocked | validation_required",
  positionLedgerPolicyReviewStatus: "reviewed | blocked | validation_required",
  portfolioValuationPolicyReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  ledgerConsistencyReviewStatus: "deterministic | blocked | validation_required",
  deterministicUpdateReviewStatus: "deterministic | blocked | validation_required",
  dependencyReviewStatus: "satisfied | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_MODEL = Object.freeze({
  ledgerUpdateResultId: "string",
  sourceStep: "step153",
  ledgerUpdateCoreReviewResultId: "string",
  ledgerUpdateCorePreflightId: "string",
  ledgerCoreInputBundleId: "string",
  ledgerUpdateCandidateId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  updateStatus: "mock_ledger_updated | blocked | validation_required",
  cashBefore: "number",
  cashDelta: "number",
  cashAfter: "number",
  positionBefore: "number",
  positionDelta: "number",
  positionAfter: "number",
  portfolioValueBefore: "number",
  portfolioValueAfter: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_CASH_LEDGER_UPDATE_RESULT_MODEL = Object.freeze({
  cashLedgerResultId: "string",
  sourceStep: "step153",
  cashBefore: "number",
  cashDelta: "number",
  cashAfter: "number",
  cashUpdateStatus: "mock_updated | blocked | validation_required",
  negativeCashBlocked: "boolean",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_POSITION_LEDGER_UPDATE_RESULT_MODEL = Object.freeze({
  positionLedgerResultId: "string",
  sourceStep: "step153",
  symbol: "string",
  positionBefore: "number",
  positionDelta: "number",
  positionAfter: "number",
  positionUpdateStatus: "mock_updated | blocked | validation_required",
  negativePositionBlocked: "boolean",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_VALUE_UPDATE_RESULT_MODEL = Object.freeze({
  portfolioValueResultId: "string",
  sourceStep: "step153",
  portfolioValueBefore: "number",
  portfolioValueAfter: "number",
  portfolioValueDelta: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  valuationStatus: "mock_updated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PNL_PLACEHOLDER_RESULT_MODEL = Object.freeze({
  pnlPlaceholderResultId: "string",
  sourceStep: "step153",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  pnlStatus: "placeholder_only | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_SCHEMA = Object.freeze({
  ledgerUpdateResultId: "string",
  ledgerUpdateCoreReviewResultId: "string",
  ledgerCoreInputBundleId: "string",
  mockFillResultId: "string",
  updateStatus: "mock_ledger_updated | blocked | validation_required",
  scope: "mock_only",
  redacted: true,
  cashBefore: "number",
  cashDelta: "number",
  cashAfter: "number",
  positionBefore: "number",
  positionDelta: "number",
  positionAfter: "number",
  portfolioValueBefore: "number",
  portfolioValueAfter: "number",
  portfolioValueDelta: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  ledgerConsistencyStatus: "deterministic | blocked | validation_required",
  deterministic: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_performance_recalculation_preflight",
});

export const TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_MODEL = Object.freeze({
  performanceRecalculationPreflightId: "string",
  sourceStep: "step154",
  ledgerUpdateResultId: "string",
  ledgerUpdateCoreReviewResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_performance_recalculation_ready | not_ready",
  equitySeriesStatus: "ready | blocked | validation_required",
  dailyReturnStatus: "ready | blocked | validation_required",
  cumulativeReturnStatus: "ready | blocked | validation_required",
  drawdownStatus: "ready | blocked | validation_required",
  mddStatus: "ready | blocked | validation_required",
  allocationStatus: "ready | blocked | validation_required",
  realizedPnlStatus: "placeholder_only | blocked | validation_required",
  unrealizedPnlStatus: "placeholder_only | blocked | validation_required",
  kpiSummaryStatus: "ready | blocked | validation_required",
  chartDataStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_INPUT_BUNDLE_MODEL = Object.freeze({
  performanceInputBundleId: "string",
  sourceStep: "step154",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  equityBeforePlaceholder: "number",
  equityAfterPreview: "number",
  cashAfterPreview: "number",
  positionAfterPreview: "number",
  portfolioValueAfterPreview: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  priorEquitySeriesPlaceholder: "number[]",
  priorReturnSeriesPlaceholder: "number[]",
  mockCalendarRef: "static_mock_calendar",
  mockBenchmarkRef: "static_mock_benchmark",
  mockValuationPolicy: "static_mock_series_only",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_SCENARIO_MODEL = Object.freeze({
  scenarioId: "string",
  sourceStep: "step154",
  scenarioName: "string",
  scope: "mock_only",
  recalculationMode: "equity_return_allocation_preview",
  equityPolicy: "static_mock_equity_series_only",
  returnPolicy: "deterministic_mock_return_preview",
  drawdownPolicy: "deterministic_mock_drawdown_preview",
  allocationPolicy: "mock_allocation_preview_only",
  kpiPolicy: "mock_kpi_summary_preview_only",
  chartDataPolicy: "mock_chart_data_dependency_preview_only",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  performanceRecalculationPreflightId: "string",
  performanceInputBundleId: "string",
  ledgerUpdateResultId: "string",
  status: "blocked | validation_required | mock_performance_recalculation_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  equitySeriesStatus: "ready | blocked | validation_required",
  dailyReturnStatus: "ready | blocked | validation_required",
  cumulativeReturnStatus: "ready | blocked | validation_required",
  drawdownStatus: "ready | blocked | validation_required",
  mddStatus: "ready | blocked | validation_required",
  allocationStatus: "ready | blocked | validation_required",
  realizedPnlStatus: "placeholder_only | blocked | validation_required",
  unrealizedPnlStatus: "placeholder_only | blocked | validation_required",
  kpiSummaryStatus: "ready | blocked | validation_required",
  chartDataStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  equityAfterPreview: "number",
  dailyReturnPreview: "number",
  cumulativeReturnPreview: "number",
  drawdownPreview: "number",
  allocationPreview: "mock_allocation_preview",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_performance_recalculation_review_result",
});

export const TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_MODEL = Object.freeze({
  performanceRecalculationReviewResultId: "string",
  sourceStep: "step155",
  performanceRecalculationPreflightId: "string",
  performanceInputBundleId: "string",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_performance_recalculation_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  summary: "string[]",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step155",
  performanceRecalculationReviewResultId: "string",
  performanceRecalculationPreflightId: "string",
  performanceInputBundleId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_performance_recalculation_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  blockerCount: "number",
  warningCount: "number",
  equitySeriesReviewStatus: "reviewed | blocked | validation_required",
  dailyReturnReviewStatus: "reviewed | blocked | validation_required",
  cumulativeReturnReviewStatus: "reviewed | blocked | validation_required",
  drawdownReviewStatus: "reviewed | blocked | validation_required",
  mddReviewStatus: "reviewed | blocked | validation_required",
  allocationReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlReviewStatus: "reviewed | blocked | validation_required",
  kpiSummaryReviewStatus: "reviewed | blocked | validation_required",
  chartDataReviewStatus: "reviewed | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_performance_recalculation_core",
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step155",
  decision: "mock_performance_recalculation_review_recorded | blocked | rejected",
  blockerCount: "number",
  warningCount: "number",
  externalOrderAuthorityRequired: true,
  actualPerformanceRecordUpdateAllowed: false,
  actualLedgerUpdateAllowed: false,
  persistentDbWriteAllowed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step155",
  equitySeriesReviewStatus: "reviewed | blocked | validation_required",
  dailyReturnReviewStatus: "reviewed | blocked | validation_required",
  cumulativeReturnReviewStatus: "reviewed | blocked | validation_required",
  drawdownReviewStatus: "reviewed | blocked | validation_required",
  mddReviewStatus: "reviewed | blocked | validation_required",
  allocationReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlReviewStatus: "reviewed | blocked | validation_required",
  kpiSummaryReviewStatus: "reviewed | blocked | validation_required",
  chartDataReviewStatus: "reviewed | blocked | validation_required",
  dependencyReviewStatus: "satisfied | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_MODEL = Object.freeze({
  performanceCorePreflightId: "string",
  sourceStep: "step156",
  performanceRecalculationReviewResultId: "string",
  performanceRecalculationPreflightId: "string",
  performanceInputBundleId: "string",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_performance_core_ready | not_ready",
  coreInputBundleStatus: "mock_only | blocked | validation_required",
  equitySeriesPolicyStatus: "ready | blocked | validation_required",
  dailyReturnPolicyStatus: "ready | blocked | validation_required",
  cumulativeReturnPolicyStatus: "ready | blocked | validation_required",
  drawdownPolicyStatus: "ready | blocked | validation_required",
  mddPolicyStatus: "ready | blocked | validation_required",
  allocationPolicyStatus: "ready | blocked | validation_required",
  realizedPnlPolicyStatus: "placeholder_only | blocked | validation_required",
  unrealizedPnlPolicyStatus: "placeholder_only | blocked | validation_required",
  kpiSummaryPolicyStatus: "ready | blocked | validation_required",
  chartDataPolicyStatus: "ready | blocked | validation_required",
  deterministicCalculationStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_INPUT_BUNDLE_MODEL = Object.freeze({
  performanceCoreInputBundleId: "string",
  sourceStep: "step156",
  performanceRecalculationReviewResultId: "string",
  performanceInputBundleId: "string",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  equityBeforePlaceholder: "number",
  equityAfterPreview: "number",
  cashAfterPreview: "number",
  positionAfterPreview: "number",
  portfolioValueAfterPreview: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  priorEquitySeriesPlaceholder: "number[]",
  priorReturnSeriesPlaceholder: "number[]",
  priorDrawdownSeriesPlaceholder: "number[]",
  priorAllocationSnapshotPlaceholder: "mock_allocation_snapshot[]",
  mockCalendarRef: "static_mock_calendar",
  mockBenchmarkRef: "static_mock_benchmark",
  mockValuationPolicy: "static_mock_series_only",
  mockReturnPolicy: "deterministic_mock_return_preview",
  mockDrawdownPolicy: "deterministic_mock_drawdown_preview",
  mockAllocationPolicy: "mock_allocation_preview_only",
  mockKpiPolicy: "mock_kpi_summary_preview_only",
  mockChartDataPolicy: "mock_chart_data_preview_only",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_SCENARIO_MODEL = Object.freeze({
  scenarioId: "string",
  sourceStep: "step156",
  scenarioName: "string",
  scope: "mock_only",
  recalculationMode: "equity_return_drawdown_allocation_kpi_chart_preview",
  equityPolicy: "static_mock_equity_series_only",
  returnPolicy: "deterministic_mock_return_preview",
  cumulativeReturnPolicy: "deterministic_mock_cumulative_return_preview",
  drawdownPolicy: "deterministic_mock_drawdown_preview",
  mddPolicy: "deterministic_mock_mdd_preview",
  allocationPolicy: "mock_allocation_preview_only",
  kpiPolicy: "mock_kpi_summary_preview_only",
  chartDataPolicy: "mock_chart_data_preview_only",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  performanceCorePreflightId: "string",
  sourceStep: "step156",
  performanceCoreInputBundleId: "string",
  performanceRecalculationReviewResultId: "string",
  performanceInputBundleId: "string",
  ledgerUpdateResultId: "string",
  status: "blocked | validation_required | mock_performance_core_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  equitySeriesPolicyStatus: "ready | blocked | validation_required",
  dailyReturnPolicyStatus: "ready | blocked | validation_required",
  cumulativeReturnPolicyStatus: "ready | blocked | validation_required",
  drawdownPolicyStatus: "ready | blocked | validation_required",
  mddPolicyStatus: "ready | blocked | validation_required",
  allocationPolicyStatus: "ready | blocked | validation_required",
  realizedPnlPolicyStatus: "placeholder_only | blocked | validation_required",
  unrealizedPnlPolicyStatus: "placeholder_only | blocked | validation_required",
  kpiSummaryPolicyStatus: "ready | blocked | validation_required",
  chartDataPolicyStatus: "ready | blocked | validation_required",
  deterministicCalculationStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  equityAfterPreview: "number",
  dailyReturnPreview: "number",
  cumulativeReturnPreview: "number",
  drawdownPreview: "number",
  mddPreview: "number",
  allocationPreview: "mock_allocation_preview",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_performance_recalculation_core",
});

export const TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_MODEL = Object.freeze({
  performanceCoreReviewResultId: "string",
  sourceStep: "step157",
  performanceCorePreflightId: "string",
  performanceCoreInputBundleId: "string",
  performanceRecalculationReviewResultId: "string",
  performanceRecalculationPreflightId: "string",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_performance_core_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  summary: "string[]",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step157",
  performanceCoreReviewResultId: "string",
  performanceCorePreflightId: "string",
  performanceCoreInputBundleId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_performance_core_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  blockerCount: "number",
  warningCount: "number",
  equitySeriesPolicyReviewStatus: "reviewed | blocked | validation_required",
  dailyReturnPolicyReviewStatus: "reviewed | blocked | validation_required",
  cumulativeReturnPolicyReviewStatus: "reviewed | blocked | validation_required",
  drawdownPolicyReviewStatus: "reviewed | blocked | validation_required",
  mddPolicyReviewStatus: "reviewed | blocked | validation_required",
  allocationPolicyReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  kpiSummaryPolicyReviewStatus: "reviewed | blocked | validation_required",
  chartDataPolicyReviewStatus: "reviewed | blocked | validation_required",
  deterministicCalculationReviewStatus: "reviewed | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_portfolio_performance_recalculation_core",
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step157",
  decision: "mock_performance_core_review_recorded | blocked | rejected",
  blockerCount: "number",
  warningCount: "number",
  externalOrderAuthorityRequired: true,
  actualPerformanceRecordCreateAllowed: false,
  actualPerformanceRecordUpdateAllowed: false,
  actualLedgerUpdateAllowed: false,
  actualCashUpdateAllowed: false,
  actualPositionUpdateAllowed: false,
  persistentDbWriteAllowed: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_CORE_POLICY_REVIEW_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step157",
  equitySeriesPolicyReviewStatus: "reviewed | blocked | validation_required",
  dailyReturnPolicyReviewStatus: "reviewed | blocked | validation_required",
  cumulativeReturnPolicyReviewStatus: "reviewed | blocked | validation_required",
  drawdownPolicyReviewStatus: "reviewed | blocked | validation_required",
  mddPolicyReviewStatus: "reviewed | blocked | validation_required",
  allocationPolicyReviewStatus: "reviewed | blocked | validation_required",
  realizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  unrealizedPnlPolicyReviewStatus: "reviewed | blocked | validation_required",
  kpiSummaryPolicyReviewStatus: "reviewed | blocked | validation_required",
  chartDataPolicyReviewStatus: "reviewed | blocked | validation_required",
  deterministicCalculationReviewStatus: "reviewed | blocked | validation_required",
  dependencyReviewStatus: "satisfied | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_MODEL = Object.freeze({
  performanceResultId: "string",
  sourceStep: "step158",
  performanceCoreReviewResultId: "string",
  performanceCorePreflightId: "string",
  performanceCoreInputBundleId: "string",
  ledgerUpdateResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  calculationStatus: "mock_performance_calculated | blocked | validation_required",
  equitySeriesStatus: "calculated | blocked | validation_required",
  dailyReturnStatus: "calculated | blocked | validation_required",
  cumulativeReturnStatus: "calculated | blocked | validation_required",
  drawdownStatus: "calculated | blocked | validation_required",
  mddStatus: "calculated | blocked | validation_required",
  allocationStatus: "calculated | blocked | validation_required",
  kpiSummaryStatus: "calculated | blocked | validation_required",
  chartDataStatus: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_PERFORMANCE_RESULT_MODEL = Object.freeze({
  performanceResultId: "string",
  sourceStep: "step158",
  scope: "mock_only",
  calculationStatus: "mock_performance_calculated | blocked | validation_required",
  equitySeries: "mock_equity_series_point[]",
  dailyReturnSeries: "mock_daily_return_point[]",
  cumulativeReturnSeries: "mock_cumulative_return_point[]",
  drawdownSeries: "mock_drawdown_point[]",
  mdd: "number",
  allocationSnapshot: "mock_allocation_snapshot[]",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  kpiSummary: "mock_kpi_summary",
  chartData: "mock_chart_data",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_EQUITY_SERIES_RESULT_MODEL = Object.freeze({
  equitySeriesResultId: "string",
  sourceStep: "step158",
  priorEquity: "number",
  currentEquity: "number",
  equityDelta: "number",
  equitySeries: "mock_equity_series_point[]",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_DAILY_RETURN_RESULT_MODEL = Object.freeze({
  dailyReturnResultId: "string",
  sourceStep: "step158",
  previousEquity: "number",
  currentEquity: "number",
  dailyReturn: "number",
  dailyReturnSeries: "mock_daily_return_point[]",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_CUMULATIVE_RETURN_RESULT_MODEL = Object.freeze({
  cumulativeReturnResultId: "string",
  sourceStep: "step158",
  initialEquity: "number",
  currentEquity: "number",
  cumulativeReturn: "number",
  cumulativeReturnSeries: "mock_cumulative_return_point[]",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_DRAWDOWN_MDD_RESULT_MODEL = Object.freeze({
  drawdownResultId: "string",
  sourceStep: "step158",
  equitySeries: "mock_equity_series_point[]",
  drawdownSeries: "mock_drawdown_point[]",
  mdd: "number",
  peakEquity: "number",
  troughEquity: "number",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_ALLOCATION_RESULT_MODEL = Object.freeze({
  allocationResultId: "string",
  sourceStep: "step158",
  positions: "mock_allocation_position[]",
  totalPortfolioValue: "number",
  allocationSnapshot: "mock_allocation_snapshot[]",
  residualWeight: "number",
  allocationStatus: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_KPI_SUMMARY_RESULT_MODEL = Object.freeze({
  kpiSummaryResultId: "string",
  sourceStep: "step158",
  totalEquity: "number",
  dailyReturn: "number",
  cumulativeReturn: "number",
  mdd: "number",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  cashWeight: "number",
  positionCount: "number",
  allocationResidual: "number",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_CHART_DATA_RESULT_MODEL = Object.freeze({
  chartDataResultId: "string",
  sourceStep: "step158",
  equityChartData: "mock_chart_point[]",
  returnChartData: "mock_chart_point[]",
  drawdownChartData: "mock_chart_point[]",
  allocationChartData: "mock_chart_point[]",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_PERFORMANCE_RESULT_SCHEMA = Object.freeze({
  performanceResultId: "string",
  sourceStep: "step158",
  performanceCoreReviewResultId: "string",
  performanceCoreInputBundleId: "string",
  ledgerUpdateResultId: "string",
  calculationStatus: "mock_performance_calculated | blocked | validation_required",
  scope: "mock_only",
  redacted: true,
  equitySeries: "mock_equity_series_point[]",
  dailyReturnSeries: "mock_daily_return_point[]",
  cumulativeReturnSeries: "mock_cumulative_return_point[]",
  drawdownSeries: "mock_drawdown_point[]",
  mdd: "number",
  allocationSnapshot: "mock_allocation_snapshot[]",
  realizedPnlPlaceholder: "number",
  unrealizedPnlPlaceholder: "number",
  kpiSummary: "mock_kpi_summary",
  chartData: "mock_chart_data",
  deterministic: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_trading_run_summary_preflight",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_MODEL = Object.freeze({
  tradingRunSummaryPreflightId: "string",
  sourceStep: "step159",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  status: "blocked | validation_required | mock_summary_ready | not_ready",
  strategySummaryStatus: "ready | blocked | validation_required",
  orderSummaryStatus: "ready | blocked | validation_required",
  executionSummaryStatus: "ready | blocked | validation_required",
  fillSummaryStatus: "ready | blocked | validation_required",
  ledgerSummaryStatus: "ready | blocked | validation_required",
  performanceSummaryStatus: "ready | blocked | validation_required",
  riskSummaryStatus: "ready | blocked | validation_required",
  dashboardAggregationStatus: "ready | blocked | validation_required",
  chartAggregationStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  blockerCount: "number",
  warningCount: "number",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_INPUT_BUNDLE_MODEL = Object.freeze({
  summaryInputBundleId: "string",
  sourceStep: "step159",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  strategySnapshot: "redacted_mock_strategy_summary",
  mockOrderSummaryPlaceholder: "redacted_mock_order_summary",
  mockExecutionSummaryPlaceholder: "redacted_mock_execution_summary",
  mockFillSummary: "redacted_mock_fill_summary",
  mockLedgerSummary: "redacted_mock_ledger_summary",
  mockPerformanceSummary: "redacted_mock_performance_summary",
  mockRiskSummary: "redacted_mock_risk_summary",
  mockChartSummary: "redacted_mock_chart_summary",
  mockDashboardSections: "redacted_admin_dashboard_section[]",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_CHAIN_DEPENDENCY_MAP_MODEL = Object.freeze({
  dependencyMapId: "string",
  sourceStep: "step159",
  strategyDraftStatus: "satisfied | blocked | validation_required",
  mockRunCandidateStatus: "satisfied | blocked | validation_required",
  mockOrderGenerationStatus: "satisfied | blocked | validation_required",
  mockExecutionStatus: "satisfied | blocked | validation_required",
  mockFillStatus: "satisfied | blocked | validation_required",
  mockLedgerStatus: "satisfied | blocked | validation_required",
  mockPerformanceStatus: "satisfied | blocked | validation_required",
  dashboardAggregationStatus: "satisfied | blocked | validation_required",
  chartAggregationStatus: "satisfied | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  tradingRunSummaryPreflightId: "string",
  sourceStep: "step159",
  summaryInputBundleId: "string",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  status: "blocked | validation_required | mock_summary_ready | not_ready",
  scope: "mock_only",
  redacted: true,
  blockerCount: "number",
  warningCount: "number",
  strategySummaryStatus: "ready | blocked | validation_required",
  orderSummaryStatus: "ready | blocked | validation_required",
  executionSummaryStatus: "ready | blocked | validation_required",
  fillSummaryStatus: "ready | blocked | validation_required",
  ledgerSummaryStatus: "ready | blocked | validation_required",
  performanceSummaryStatus: "ready | blocked | validation_required",
  riskSummaryStatus: "ready | blocked | validation_required",
  dashboardAggregationStatus: "ready | blocked | validation_required",
  chartAggregationStatus: "ready | blocked | validation_required",
  dependencyStatus: "satisfied | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_trading_run_summary_review_result",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_MODEL = Object.freeze({
  tradingRunSummaryReviewResultId: "string",
  sourceStep: "step160",
  tradingRunSummaryPreflightId: "string",
  summaryInputBundleId: "string",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_trading_run_summary_review_recorded | blocked | rejected",
  reviewedAt: "placeholder_recorded_at",
  reviewedBy: "admin_placeholder",
  summary: "string[]",
  blockers: "string[]",
  warnings: "string[]",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step160",
  tradingRunSummaryReviewResultId: "string",
  tradingRunSummaryPreflightId: "string",
  summaryInputBundleId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_trading_run_summary_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder_recorded_at",
  blockerCount: "number",
  warningCount: "number",
  strategySummaryReviewStatus: "reviewed | blocked | validation_required",
  orderSummaryReviewStatus: "reviewed | blocked | validation_required",
  executionSummaryReviewStatus: "reviewed | blocked | validation_required",
  fillSummaryReviewStatus: "reviewed | blocked | validation_required",
  ledgerSummaryReviewStatus: "reviewed | blocked | validation_required",
  performanceSummaryReviewStatus: "reviewed | blocked | validation_required",
  riskSummaryReviewStatus: "reviewed | blocked | validation_required",
  dashboardAggregationReviewStatus: "reviewed | blocked | validation_required",
  chartAggregationReviewStatus: "reviewed | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_trading_run_summary_core",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step160",
  decision: "mock_trading_run_summary_review_recorded | blocked | rejected",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  blockers: "string[]",
  warnings: "string[]",
  messages: "string[]",
  externalOrderAuthorityRequired: true,
  realTradingRunSummaryStored: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_SECTION_SUMMARY_MODEL = Object.freeze({
  summaryId: "string",
  sourceStep: "step160",
  strategySummaryReviewStatus: "reviewed | blocked | validation_required",
  orderSummaryReviewStatus: "reviewed | blocked | validation_required",
  executionSummaryReviewStatus: "reviewed | blocked | validation_required",
  fillSummaryReviewStatus: "reviewed | blocked | validation_required",
  ledgerSummaryReviewStatus: "reviewed | blocked | validation_required",
  performanceSummaryReviewStatus: "reviewed | blocked | validation_required",
  riskSummaryReviewStatus: "reviewed | blocked | validation_required",
  dashboardAggregationReviewStatus: "reviewed | blocked | validation_required",
  chartAggregationReviewStatus: "reviewed | blocked | validation_required",
  dependencyReviewStatus: "reviewed | blocked | validation_required",
  redacted: true,
  realTradingRunIdentifierCreated: false,
  actualPerformanceRecordStored: false,
  actualCashUpdated: false,
  actualPositionUpdated: false,
  persistentStorageUsed: false,
  dbWriteUsed: false,
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_MODEL = Object.freeze({
  tradingRunSummaryCoreId: "string",
  sourceStep: "step161",
  tradingRunSummaryReviewResultId: "string",
  tradingRunSummaryPreflightId: "string",
  summaryInputBundleId: "string",
  scope: "mock_only",
  coreStatus: "mock_summary_calculated | blocked | validation_required",
  deterministicAggregationStatus: "deterministic | blocked | validation_required",
  dashboardAggregationStatus: "calculated | blocked | validation_required",
  chartAggregationStatus: "calculated | blocked | validation_required",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_MODEL = Object.freeze({
  tradingRunSummaryResultId: "string",
  sourceStep: "step161",
  tradingRunSummaryReviewResultId: "string",
  tradingRunSummaryPreflightId: "string",
  summaryInputBundleId: "string",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  scope: "mock_only",
  summaryStatus: "mock_summary_calculated | blocked | validation_required",
  strategySummary: "redacted_mock_strategy_summary",
  orderSummary: "redacted_mock_order_summary",
  executionSummary: "redacted_mock_execution_summary",
  fillSummary: "redacted_mock_fill_summary",
  ledgerSummary: "redacted_mock_ledger_summary",
  performanceSummary: "redacted_mock_performance_summary",
  riskSummary: "redacted_mock_risk_summary",
  safetySummary: "redacted_mock_safety_summary",
  dashboardAggregation: "redacted_mock_dashboard_aggregation",
  chartAggregation: "redacted_mock_chart_aggregation",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_TRADING_RUN_STRATEGY_SUMMARY_RESULT_MODEL = Object.freeze({
  strategySummaryResultId: "string",
  sourceStep: "step161",
  strategyDraftId: "string",
  mode: "mock",
  scope: "mock_only",
  status: "mock_only | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_ORDER_EXECUTION_FILL_SUMMARY_RESULT_MODEL = Object.freeze({
  summaryResultId: "string",
  sourceStep: "step161",
  orderSummaryStatus: "mock_only | blocked | validation_required",
  executionSummaryStatus: "mock_only | blocked | validation_required",
  fillSummaryStatus: "mock_only | blocked | validation_required",
  orderCandidateCreated: false,
  orderDraftCreated: false,
  executionRecordCreated: false,
  fillRecordCreated: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_LEDGER_SUMMARY_RESULT_MODEL = Object.freeze({
  ledgerSummaryResultId: "string",
  sourceStep: "step161",
  ledgerUpdateResultId: "string",
  status: "mock_only | blocked | validation_required",
  portfolioLedgerPersisted: false,
  cashPositionMutated: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_PERFORMANCE_SUMMARY_RESULT_MODEL = Object.freeze({
  performanceSummaryResultId: "string",
  sourceStep: "step161",
  performanceResultId: "string",
  status: "mock_only | blocked | validation_required",
  totalEquity: "number",
  cumulativeReturn: "number",
  mdd: "number",
  performanceRecordPersisted: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_RISK_SAFETY_SUMMARY_RESULT_MODEL = Object.freeze({
  riskSafetySummaryResultId: "string",
  sourceStep: "step161",
  riskStatus: "mock_only | blocked | validation_required",
  safetyStatus: "blocked",
  externalOrderAuthorityRequired: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_DASHBOARD_AGGREGATION_RESULT_MODEL = Object.freeze({
  dashboardAggregationResultId: "string",
  sourceStep: "step161",
  kpiCards: "mock_kpi_summary_card[]",
  equityChartSummary: "redacted_mock_chart_summary",
  returnChartSummary: "redacted_mock_chart_summary",
  drawdownChartSummary: "redacted_mock_chart_summary",
  allocationSummary: "redacted_mock_allocation_summary",
  positionSummary: "redacted_mock_position_summary",
  mockRunStatusSummary: "redacted_mock_run_status_summary",
  riskSafetyStatusSummary: "redacted_mock_risk_safety_summary",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_CHART_AGGREGATION_RESULT_MODEL = Object.freeze({
  chartAggregationResultId: "string",
  sourceStep: "step161",
  equityChartData: "mock_chart_point[]",
  returnChartData: "mock_chart_point[]",
  drawdownChartData: "mock_chart_point[]",
  allocationChartData: "mock_chart_point[]",
  status: "calculated | blocked | validation_required",
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_SCHEMA = Object.freeze({
  tradingRunSummaryResultId: "string",
  sourceStep: "step161",
  tradingRunSummaryReviewResultId: "string",
  summaryInputBundleId: "string",
  performanceResultId: "string",
  ledgerUpdateResultId: "string",
  mockFillResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  summaryStatus: "mock_summary_calculated | blocked | validation_required",
  scope: "mock_only",
  redacted: true,
  strategySummary: "redacted_mock_strategy_summary",
  orderSummary: "redacted_mock_order_summary",
  executionSummary: "redacted_mock_execution_summary",
  fillSummary: "redacted_mock_fill_summary",
  ledgerSummary: "redacted_mock_ledger_summary",
  performanceSummary: "redacted_mock_performance_summary",
  riskSummary: "redacted_mock_risk_summary",
  safetySummary: "redacted_mock_safety_summary",
  dashboardAggregation: "redacted_mock_dashboard_aggregation",
  chartAggregation: "redacted_mock_chart_aggregation",
  deterministic: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_trading_run_dashboard_cleanup_preflight",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_MODEL = Object.freeze({
  mockDashboardCleanupPreflightId: "string",
  sourceStep: "step162",
  tradingRunSummaryResultId: "string",
  tradingRunSummaryCoreId: "string",
  scope: "mock_only",
  mode: "mock",
  status: "mock_dashboard_cleanup_ready | blocked | validation_required | not_ready",
  summaryFirstLayoutStatus: "planned | blocked | validation_required",
  sectionInventoryStatus: "mock_inventory_ready | blocked | validation_required",
  priorityLayoutStatus: "mock_layout_ready | blocked | validation_required",
  collapsibleSectionPlanStatus: "mock_collapsible_plan_ready | blocked | validation_required",
  adminOnly: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_DASHBOARD_SECTION_INVENTORY_MODEL = Object.freeze({
  sectionInventoryId: "string",
  sourceStep: "step162",
  sectionCount: "number",
  primarySectionCount: "number",
  detailSectionCount: "number",
  duplicateSectionIds: "string[]",
  sections: "redacted_mock_dashboard_section[]",
  deterministic: true,
  redacted: true,
  status: "mock_inventory_ready | blocked | validation_required",
});

export const TRADING_LAB_MOCK_DASHBOARD_PRIORITY_LAYOUT_MODEL = Object.freeze({
  priorityLayoutId: "string",
  sourceStep: "step162",
  priorityMode: "summary_first",
  primaryOrder: "string[]",
  detailOrder: "string[]",
  safetyPanelSeparated: true,
  adminOnly: true,
  deterministic: true,
  redacted: true,
  status: "mock_layout_ready | blocked | validation_required",
});

export const TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_SECTION_PLAN_MODEL = Object.freeze({
  collapsibleSectionPlanId: "string",
  sourceStep: "step162",
  defaultCollapsed: true,
  groups: "redacted_mock_collapsible_group[]",
  preservesExistingSections: true,
  deletesExistingSections: false,
  deterministic: true,
  redacted: true,
  status: "mock_collapsible_plan_ready | blocked | validation_required",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_RESULT_SCHEMA = Object.freeze({
  mockDashboardCleanupPreflightId: "string",
  sourceStep: "step162",
  tradingRunSummaryResultId: "string",
  status: "mock_dashboard_cleanup_ready | blocked | validation_required | not_ready",
  scope: "mock_only",
  mode: "mock",
  redacted: true,
  sectionCount: "number",
  primarySectionCount: "number",
  detailSectionCount: "number",
  summaryFirstLayoutStatus: "planned | blocked | validation_required",
  collapsibleSectionPlanStatus: "mock_collapsible_plan_ready | blocked | validation_required",
  readabilityImpact: "summary_first_admin_mock_only",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_dashboard_cleanup_review",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_MODEL = Object.freeze({
  dashboardCleanupReviewResultId: "string",
  sourceStep: "step163",
  dashboardCleanupPreflightId: "string",
  tradingRunSummaryResultId: "string",
  tradingRunSummaryReviewResultId: "string",
  mockRunCandidateId: "string",
  strategyDraftId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_dashboard_cleanup_review_recorded | blocked | rejected",
  reviewedAt: "placeholder",
  reviewedBy: "admin_placeholder",
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  sourceStep: "step163",
  dashboardCleanupReviewResultId: "string",
  dashboardCleanupPreflightId: "string",
  tradingRunSummaryResultId: "string",
  reviewStatus: "recorded | blocked | validation_required | mock_only",
  decision: "mock_dashboard_cleanup_review_recorded | blocked | rejected",
  redacted: true,
  recordedAt: "placeholder",
  blockerCount: "number",
  warningCount: "number",
  sectionInventoryReviewStatus: "reviewed | blocked | validation_required",
  priorityLayoutReviewStatus: "reviewed | blocked | validation_required",
  collapsibleSectionPlanReviewStatus: "reviewed | blocked | validation_required",
  summaryFirstLayoutReviewStatus: "reviewed | blocked | validation_required",
  safetyPanelSeparationReviewStatus: "reviewed | blocked | validation_required",
  sourceAlignmentReviewStatus: "reviewed | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_dashboard_cleanup_core",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_DECISION_SUMMARY_MODEL = Object.freeze({
  decisionSummaryId: "string",
  sourceStep: "step163",
  decision: "mock_dashboard_cleanup_review_recorded | blocked | rejected",
  blockers: "string[]",
  warnings: "string[]",
  externalOrderAuthorityRequired: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_SECTION_SUMMARY_MODEL = Object.freeze({
  sectionReviewSummaryId: "string",
  sourceStep: "step163",
  sectionInventoryReviewStatus: "reviewed | blocked | validation_required",
  priorityLayoutReviewStatus: "reviewed | blocked | validation_required",
  collapsibleSectionPlanReviewStatus: "reviewed | blocked | validation_required",
  summaryFirstLayoutReviewStatus: "reviewed | blocked | validation_required",
  safetyPanelSeparationReviewStatus: "reviewed | blocked | validation_required",
  sourceAlignmentReviewStatus: "reviewed | blocked | validation_required",
  redacted: true,
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_MODEL = Object.freeze({
  dashboardCleanupCoreId: "string",
  sourceStep: "step164",
  dashboardCleanupReviewResultId: "string",
  dashboardCleanupPreflightId: "string",
  tradingRunSummaryResultId: "string",
  scope: "mock_only",
  mode: "mock",
  coreStatus: "mock_dashboard_cleanup_applied | blocked | validation_required",
  summaryFirstLayoutStatus: "applied | blocked | validation_required",
  collapsibleDetailGroupStatus: "applied | blocked | validation_required",
  sourceAlignmentStatus: "aligned | blocked | validation_required",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_MODEL = Object.freeze({
  dashboardCleanupResultId: "string",
  sourceStep: "step164",
  dashboardCleanupReviewResultId: "string",
  dashboardCleanupPreflightId: "string",
  tradingRunSummaryResultId: "string",
  scope: "mock_only",
  cleanupStatus: "mock_dashboard_cleanup_applied | blocked | validation_required",
  summaryFirstLayout: "redacted_summary_first_layout_result",
  kpiSourceAlignment: "aligned | blocked | validation_required",
  chartSourceAlignment: "aligned | blocked | validation_required",
  allocationSourceAlignment: "aligned | blocked | validation_required",
  collapsibleGroups: "redacted_collapsible_detail_group[]",
  visiblePrimarySections: "string[]",
  visibleDetailGroups: "string[]",
  safetyPanelSeparationStatus: "separated | blocked | validation_required",
  dangerousActionLabelStatus: "absent | blocked | validation_required",
  deterministic: true,
  redacted: true,
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
});

export const TRADING_LAB_MOCK_DASHBOARD_SUMMARY_FIRST_LAYOUT_RESULT_MODEL = Object.freeze({
  summaryFirstLayoutResultId: "string",
  sourceStep: "step164",
  overview: "redacted_mock_dashboard_overview",
  kpi: "redacted_mock_dashboard_kpi",
  charts: "redacted_mock_dashboard_charts",
  strategy: "redacted_mock_dashboard_strategy",
  mockRunSummary: "redacted_mock_run_summary",
  detailChain: "redacted_collapsible_detail_groups",
  summaryFirst: true,
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_DETAIL_GROUP_RESULT_MODEL = Object.freeze({
  collapsibleDetailGroupResultId: "string",
  sourceStep: "step164",
  defaultCollapsed: true,
  groups: "redacted_collapsible_detail_group[]",
  preservesExistingSections: true,
  deletesExistingSections: false,
  deterministic: true,
  redacted: true,
});

export const TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_SCHEMA = Object.freeze({
  dashboardCleanupResultId: "string",
  sourceStep: "step164",
  dashboardCleanupReviewResultId: "string",
  dashboardCleanupPreflightId: "string",
  tradingRunSummaryResultId: "string",
  cleanupStatus: "mock_dashboard_cleanup_applied | blocked | validation_required",
  scope: "mock_only",
  redacted: true,
  summaryFirstLayoutStatus: "applied | blocked | validation_required",
  collapsibleDetailGroupStatus: "applied | blocked | validation_required",
  kpiSourceAlignment: "aligned | blocked | validation_required",
  chartSourceAlignment: "aligned | blocked | validation_required",
  allocationSourceAlignment: "aligned | blocked | validation_required",
  safetyPanelSeparationStatus: "separated | blocked | validation_required",
  dangerousActionLabelStatus: "absent | blocked | validation_required",
  readinessImpact: "none",
  providerCallImpact: "blocked",
  orderSubmissionImpact: "blocked",
  liveTradingImpact: "blocked",
  nextAllowedStep: "mock_dashboard_cleanup_core_review",
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

function getStep149MockPortfolioLedgerUpdateContext(input = {}, options = {}) {
  const hasCoreStatus = Object.prototype.hasOwnProperty.call(input, "mockFillSimulationCoreStatus");
  const mockFillSimulationCoreStatus = hasCoreStatus
    ? input.mockFillSimulationCoreStatus
    : buildAdminTradingLabMockFillSimulationCoreStatus(input, options);
  const fillResults = Array.isArray(input.fillResults)
    ? input.fillResults
    : Array.isArray(mockFillSimulationCoreStatus?.fillResults)
      ? mockFillSimulationCoreStatus.fillResults
      : [];
  const validation = input.validation || mockFillSimulationCoreStatus?.validation || null;
  const summary = input.summary || mockFillSimulationCoreStatus?.summary || {};

  return {
    mockFillSimulationCoreStatus,
    fillResults,
    validation,
    summary,
  };
}

export function buildTradingLabMockLedgerUpdateCandidates(input = {}, options = {}) {
  const context = getStep149MockPortfolioLedgerUpdateContext(input, options);
  const baseCash = Math.max(0, toFiniteNumber(input.cashBeforePlaceholder ?? context.summary?.cashBeforePlaceholder, 100000));
  const basePortfolioValue = Math.max(0, toFiniteNumber(input.portfolioValueBeforePlaceholder ?? context.summary?.portfolioValueBeforePlaceholder, 150000));
  const defaultPositionBefore = Math.max(0, toFiniteNumber(input.positionBeforePlaceholder, 10));

  return context.fillResults.slice(0, 6).map((fillResult, index) => {
    const cashBeforePlaceholder = Math.max(0, toFiniteNumber(fillResult.cashBeforePlaceholder ?? baseCash, baseCash));
    const positionBeforePlaceholder = Math.max(0, toFiniteNumber(fillResult.positionBeforePlaceholder ?? defaultPositionBefore, defaultPositionBefore));
    const cashDelta = roundMoney(toFiniteNumber(fillResult.cashDelta, 0));
    const positionDelta = roundQuantity(toFiniteNumber(fillResult.positionDelta, 0));
    const cashAfterPreview = roundMoney(cashBeforePlaceholder + cashDelta);
    const positionAfterPreview = roundQuantity(positionBeforePlaceholder + positionDelta);
    const portfolioValueBeforePlaceholder = Math.max(0, toFiniteNumber(fillResult.portfolioValueBeforePlaceholder ?? basePortfolioValue, basePortfolioValue));
    const mockFillPrice = Math.max(0, toFiniteNumber(fillResult.mockFillPrice, 0));
    const positionValueDelta = roundMoney(positionDelta * mockFillPrice);
    const portfolioValueAfterPreview = roundMoney(portfolioValueBeforePlaceholder + cashDelta + positionValueDelta);
    const warningStatus = cashAfterPreview < 0 || positionAfterPreview < 0 || portfolioValueAfterPreview < 0
      ? "validation_required"
      : "candidate";

    return {
      ledgerUpdateCandidateId: `step149_mock_ledger_update_candidate_${index + 1}`,
      sourceStep: "step149",
      mockFillResultId: fillResult.mockFillResultId || `step149_missing_mock_fill_result_${index + 1}`,
      calculationInputId: fillResult.calculationInputId || "step149_missing_calculation_input",
      fillCoreReviewResultId: fillResult.fillCoreReviewResultId || "step149_missing_fill_core_review_result",
      mockRunCandidateId: fillResult.mockRunCandidateId || "step149_missing_mock_run_candidate",
      strategyDraftId: fillResult.strategyDraftId || "step149_missing_strategy_draft",
      scope: "mock_only",
      updateType: "mock_cash_position_delta",
      symbol: fillResult.symbol || "SYMBOL_PLACEHOLDER",
      side: fillResult.side || "mock_hold",
      fillStatus: fillResult.fillStatus || "validation_required",
      cashBeforePlaceholder,
      cashDelta,
      cashAfterPreview,
      positionBeforePlaceholder,
      positionDelta,
      positionAfterPreview,
      portfolioValueBeforePlaceholder,
      portfolioValueAfterPreview,
      realizedPnlPlaceholder: 0,
      unrealizedPnlPlaceholder: 0,
      status: fillResult.fillStatus === "blocked" ? "blocked" : warningStatus,
      deterministic: true,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      actualLedgerEntryCreated: false,
      actualPortfolioLedgerUpdated: false,
      actualCashUpdated: false,
      actualPositionUpdated: false,
      accountBalanceQueried: false,
      persistentStorageUsed: false,
      dbWriteUsed: false,
    };
  });
}

export function validateTradingLabMockPortfolioLedgerUpdatePreflight(input = {}, options = {}) {
  const context = getStep149MockPortfolioLedgerUpdateContext(input, options);
  const candidates = input.ledgerUpdateCandidates || buildTradingLabMockLedgerUpdateCandidates(input, options);
  const blockers = [];
  const warnings = [];

  if (!context.mockFillSimulationCoreStatus) blockers.push("mock_fill_simulation_core_status_missing");
  if (!Array.isArray(context.fillResults) || context.fillResults.length === 0) blockers.push("mock_fill_result_missing");
  if (context.mockFillSimulationCoreStatus && context.mockFillSimulationCoreStatus.status !== "admin_only_trading_lab_mock_fill_simulation_core_fail_closed") warnings.push("mock_fill_core_status_review_required");
  if (context.validation?.status === "blocked") blockers.push("mock_fill_core_validation_blocked");
  if (context.validation?.status === "validation_required") warnings.push("mock_fill_core_validation_required");
  if (context.fillResults.some((result) => result.redacted !== true)) blockers.push("mock_fill_result_not_redacted");
  if (context.fillResults.some((result) => result.scope !== "mock_only")) blockers.push("mock_fill_result_scope_not_mock_only");
  if (context.fillResults.some((result) => result.readinessImpact !== "none")) blockers.push("fill_result_readiness_impact_not_none");
  if (context.fillResults.some((result) => result.providerCallImpact !== "blocked")) blockers.push("fill_result_provider_call_impact_not_blocked");
  if (context.fillResults.some((result) => result.orderSubmissionImpact !== "blocked")) blockers.push("fill_result_order_submission_impact_not_blocked");
  if (context.fillResults.some((result) => result.liveTradingImpact !== "blocked")) blockers.push("fill_result_live_trading_impact_not_blocked");
  if (context.fillResults.some((result) => result.actualFillRecordCreated !== false || result.fillRecordCreated !== false || result.fillCreated !== false)) blockers.push("actual_fill_record_must_not_be_created");
  if (context.fillResults.some((result) => result.actualExecutionCreated !== false || result.executionRecordCreated !== false)) blockers.push("actual_execution_record_must_not_be_created");
  if (context.fillResults.some((result) => result.actualOrderCandidateCreated !== false || result.actualOrderDraftCreated !== false)) blockers.push("actual_order_artifact_must_not_be_created");
  if (context.fillResults.some((result) => result.kisOrderPayloadCreated !== false || result.kisExecutionPayloadCreated !== false || result.kisFillPayloadCreated !== false)) blockers.push("kis_payload_must_not_be_created");
  if (context.fillResults.some((result) => result.accountBalanceQueried !== false)) blockers.push("account_balance_query_must_not_run");
  if (context.fillResults.some((result) => result.actualCashUpdated !== false)) blockers.push("actual_cash_update_must_not_run");
  if (context.fillResults.some((result) => result.actualPositionUpdated !== false)) blockers.push("actual_position_update_must_not_run");

  for (const result of context.fillResults) {
    const cashDelta = toFiniteNumber(result.cashDelta, 0);
    const positionDelta = toFiniteNumber(result.positionDelta, 0);
    if (result.side === "mock_buy" && result.fillStatus !== "mock_rejected") {
      if (cashDelta >= 0) blockers.push("mock_buy_cash_delta_sign_invalid");
      if (positionDelta <= 0) blockers.push("mock_buy_position_delta_sign_invalid");
    }
    if (result.side === "mock_sell" && result.fillStatus !== "mock_rejected") {
      if (cashDelta <= 0) blockers.push("mock_sell_cash_delta_sign_invalid");
      if (positionDelta >= 0) blockers.push("mock_sell_position_delta_sign_invalid");
    }
    if (result.fillStatus === "mock_rejected" && (cashDelta !== 0 || positionDelta !== 0)) blockers.push("mock_rejected_fill_delta_must_be_zero");
  }

  if (!Array.isArray(candidates) || candidates.length === 0) blockers.push("mock_ledger_update_candidate_missing");
  if (candidates.some((candidate) => candidate.redacted !== true)) blockers.push("mock_ledger_update_candidate_not_redacted");
  if (candidates.some((candidate) => candidate.scope !== "mock_only")) blockers.push("mock_ledger_update_candidate_scope_not_mock_only");
  if (candidates.some((candidate) => candidate.actualLedgerEntryCreated !== false)) blockers.push("actual_ledger_entry_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualPortfolioLedgerUpdated !== false)) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (candidates.some((candidate) => candidate.persistentStorageUsed !== false || candidate.dbWriteUsed !== false)) blockers.push("persistent_db_write_must_not_run");
  if (candidates.some((candidate) => toFiniteNumber(candidate.cashAfterPreview, 0) < 0)) warnings.push("cash_after_preview_negative");
  if (candidates.some((candidate) => toFiniteNumber(candidate.positionAfterPreview, 0) < 0)) warnings.push("position_after_preview_negative");
  if (candidates.some((candidate) => toFiniteNumber(candidate.portfolioValueAfterPreview, 0) < 0)) warnings.push("portfolio_value_after_preview_negative");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.ledgerUpdateInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_ledger_update_ready";
  const firstFillResult = context.fillResults[0] || {};

  return {
    validationId: "step149_mock_portfolio_ledger_update_preflight_validation",
    sourceStep: "step149",
    status,
    dependencyStatus: uniqueBlockers.includes("mock_fill_result_missing") ? "blocked" : "satisfied",
    cashDeltaStatus: uniqueBlockers.some((blocker) => blocker.includes("cash_delta")) ? "blocked" : uniqueWarnings.includes("cash_after_preview_negative") ? "validation_required" : "valid",
    positionDeltaStatus: uniqueBlockers.some((blocker) => blocker.includes("position_delta")) ? "blocked" : uniqueWarnings.includes("position_after_preview_negative") ? "validation_required" : "valid",
    portfolioValueImpactStatus: uniqueWarnings.includes("portfolio_value_after_preview_negative") ? "validation_required" : "valid",
    realizedPnlStatus: "placeholder_only",
    unrealizedPnlStatus: "placeholder_only",
    ledgerConsistencyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic",
    mockFillResultId: firstFillResult.mockFillResultId || "step149_missing_mock_fill_result",
    calculationInputId: firstFillResult.calculationInputId || "step149_missing_calculation_input",
    fillCoreReviewResultId: firstFillResult.fillCoreReviewResultId || "step149_missing_fill_core_review_result",
    mockRunCandidateId: firstFillResult.mockRunCandidateId || "step149_missing_mock_run_candidate",
    strategyDraftId: firstFillResult.strategyDraftId || "step149_missing_strategy_draft",
    candidateCount: Array.isArray(candidates) ? candidates.length : 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    deterministic: true,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step149_mock_portfolio_ledger_update_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioLedgerUpdatePreflight(input = {}, options = {}) {
  const ledgerUpdateCandidates = input.ledgerUpdateCandidates || buildTradingLabMockLedgerUpdateCandidates(input, options);
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdatePreflight({ ...input, ledgerUpdateCandidates }, options);
  const firstCandidate = ledgerUpdateCandidates[0] || {};
  const readyStatus = validation.status === "mock_ledger_update_ready" ? "mock_ledger_update_ready" : validation.status;

  return {
    ok: true,
    step: "Step 149: Admin trading lab mock portfolio ledger update preflight",
    status: "admin_only_trading_lab_mock_portfolio_ledger_update_preflight_fail_closed",
    sourceStep: "step149",
    mockPortfolioLedgerUpdatePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_MODEL,
    mockLedgerUpdateCandidateModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CANDIDATE_MODEL,
    mockLedgerUpdatePreflightResultSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_PREFLIGHT_RESULT_SCHEMA,
    validation,
    ledgerUpdateCandidates: ledgerUpdateCandidates.map((candidate) => ({
      ...candidate,
      status: validation.status === "blocked" ? "blocked" : candidate.status,
    })),
    result: {
      ledgerUpdatePreflightId: "step149_mock_portfolio_ledger_update_preflight",
      ledgerUpdateCandidateId: firstCandidate.ledgerUpdateCandidateId || "step149_missing_ledger_update_candidate",
      mockFillResultId: validation.mockFillResultId,
      status: readyStatus,
      scope: "mock_only",
      redacted: true,
      cashDeltaStatus: validation.cashDeltaStatus,
      positionDeltaStatus: validation.positionDeltaStatus,
      portfolioValueImpactStatus: validation.portfolioValueImpactStatus,
      realizedPnlStatus: validation.realizedPnlStatus,
      unrealizedPnlStatus: validation.unrealizedPnlStatus,
      ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
      dependencyStatus: validation.dependencyStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      cashAfterPreview: firstCandidate.cashAfterPreview ?? 0,
      positionAfterPreview: firstCandidate.positionAfterPreview ?? 0,
      portfolioValueAfterPreview: firstCandidate.portfolioValueAfterPreview ?? 0,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_review_result",
    },
    summary: {
      summaryId: "step149_mock_ledger_update_preflight_summary",
      sourceStep: "step149",
      candidateCount: ledgerUpdateCandidates.length,
      readyCandidateCount: validation.status === "mock_ledger_update_ready" ? ledgerUpdateCandidates.filter((candidate) => candidate.status === "candidate").length : 0,
      validationRequiredCandidateCount: ledgerUpdateCandidates.filter((candidate) => candidate.status === "validation_required").length,
      blockedCandidateCount: validation.status === "blocked" ? ledgerUpdateCandidates.length : ledgerUpdateCandidates.filter((candidate) => candidate.status === "blocked").length,
      totalCashDelta: roundMoney(ledgerUpdateCandidates.reduce((sum, candidate) => sum + toFiniteNumber(candidate.cashDelta, 0), 0)),
      totalPositionDeltaCount: ledgerUpdateCandidates.filter((candidate) => toFiniteNumber(candidate.positionDelta, 0) !== 0).length,
      totalPortfolioValueAfterPreview: roundMoney(ledgerUpdateCandidates.reduce((sum, candidate) => sum + toFiniteNumber(candidate.portfolioValueAfterPreview, 0), 0)),
      ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
      deterministic: true,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_review_result",
    },
    mockHistory: [
      {
        historyId: "step149_mock_ledger_update_preflight_history_1",
        sourceStep: "step149",
        status: readyStatus,
        candidateCount: ledgerUpdateCandidates.length,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_ledger_update_review_result",
      },
    ],
    flags: { ...STEP149_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
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
      actualLedgerUpdateAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step149_mock_portfolio_ledger_update_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioLedgerUpdatePreflight(input, options);
}

function getStep150MockPortfolioLedgerUpdateReviewContext(input = {}, options = {}) {
  const hasPreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdatePreflightStatus");
  const mockPortfolioLedgerUpdatePreflightStatus = hasPreflightStatus
    ? input.mockPortfolioLedgerUpdatePreflightStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus(input, options);
  const result = input.ledgerUpdatePreflightResult || mockPortfolioLedgerUpdatePreflightStatus?.result || null;
  const validation = input.ledgerUpdatePreflightValidation || mockPortfolioLedgerUpdatePreflightStatus?.validation || {};
  const ledgerUpdateCandidates = Array.isArray(input.ledgerUpdateCandidates)
    ? input.ledgerUpdateCandidates
    : Array.isArray(mockPortfolioLedgerUpdatePreflightStatus?.ledgerUpdateCandidates)
      ? mockPortfolioLedgerUpdatePreflightStatus.ledgerUpdateCandidates
      : [];
  const summary = input.ledgerUpdateSummary || mockPortfolioLedgerUpdatePreflightStatus?.summary || {};

  return {
    mockPortfolioLedgerUpdatePreflightStatus,
    result,
    validation,
    ledgerUpdateCandidates,
    summary,
  };
}

export function buildTradingLabMockLedgerUpdateImpactReviewSummary(input = {}, options = {}) {
  const context = getStep150MockPortfolioLedgerUpdateReviewContext(input, options);
  const validation = context.validation || {};

  return {
    summaryId: "step150_mock_ledger_update_impact_review_summary",
    sourceStep: "step150",
    cashDeltaReviewStatus: validation.cashDeltaStatus === "valid" ? "reviewed" : validation.cashDeltaStatus || "validation_required",
    cashAfterPreviewStatus: context.ledgerUpdateCandidates.some((candidate) => toFiniteNumber(candidate.cashAfterPreview, 0) < 0)
      ? "validation_required"
      : "reviewed",
    positionDeltaReviewStatus: validation.positionDeltaStatus === "valid" ? "reviewed" : validation.positionDeltaStatus || "validation_required",
    positionAfterPreviewStatus: context.ledgerUpdateCandidates.some((candidate) => toFiniteNumber(candidate.positionAfterPreview, 0) < 0)
      ? "validation_required"
      : "reviewed",
    portfolioValueImpactReviewStatus: validation.portfolioValueImpactStatus === "valid" ? "reviewed" : validation.portfolioValueImpactStatus || "validation_required",
    realizedPnlPlaceholderStatus: validation.realizedPnlStatus || "placeholder_only",
    unrealizedPnlPlaceholderStatus: validation.unrealizedPnlStatus || "placeholder_only",
    ledgerConsistencyReviewStatus: validation.ledgerConsistencyStatus || "validation_required",
    dependencyReviewStatus: validation.dependencyStatus || "validation_required",
    actualLedgerUpdateAllowed: false,
    actualCashUpdateAllowed: false,
    actualPositionUpdateAllowed: false,
    persistentDbWriteAllowed: false,
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
}

export function buildTradingLabMockLedgerUpdateReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateReviewResult(input, options);
  const decision = validation.status === "recorded" ? "mock_ledger_update_review_recorded" : validation.status === "validation_required" ? "rejected" : "blocked";

  return {
    summaryId: "step150_mock_ledger_update_review_decision_summary",
    sourceStep: "step150",
    decision,
    decisionSummary: [
      "mock ledger update review recorded",
      "mock portfolio ledger update review only",
      "not an actual account ledger update",
      "no real cash or position update",
      "not an actual fill, execution, or order result",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    externalOrderAuthorityRequired: true,
    actualLedgerUpdateAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}

export function validateTradingLabMockPortfolioLedgerUpdateReviewResult(input = {}, options = {}) {
  const context = getStep150MockPortfolioLedgerUpdateReviewContext(input, options);
  const result = context.result || {};
  const validation = context.validation || {};
  const candidates = context.ledgerUpdateCandidates;
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioLedgerUpdatePreflightStatus) blockers.push("mock_portfolio_ledger_update_preflight_missing");
  if (!context.result) blockers.push("mock_portfolio_ledger_update_preflight_result_missing");
  if (context.mockPortfolioLedgerUpdatePreflightStatus && context.mockPortfolioLedgerUpdatePreflightStatus.status !== "admin_only_trading_lab_mock_portfolio_ledger_update_preflight_fail_closed") warnings.push("mock_portfolio_ledger_update_preflight_status_review_required");
  if (result.redacted !== true) blockers.push("mock_portfolio_ledger_update_preflight_result_not_redacted");
  if (result.scope !== "mock_only") blockers.push("mock_portfolio_ledger_update_preflight_scope_not_mock_only");
  if (result.readinessImpact !== "none") blockers.push("preflight_readiness_impact_not_none");
  if (result.providerCallImpact !== "blocked") blockers.push("preflight_provider_call_impact_not_blocked");
  if (result.orderSubmissionImpact !== "blocked") blockers.push("preflight_order_submission_impact_not_blocked");
  if (result.liveTradingImpact !== "blocked") blockers.push("preflight_live_trading_impact_not_blocked");
  if (result.nextAllowedStep && result.nextAllowedStep !== "mock_portfolio_ledger_update_review_result") blockers.push("preflight_next_step_not_ledger_update_review_result");
  if (validation.status === "blocked" || result.status === "blocked") blockers.push("mock_portfolio_ledger_update_preflight_blocked");
  if (validation.status === "validation_required" || result.status === "validation_required") warnings.push("mock_portfolio_ledger_update_preflight_validation_required");
  if (!Array.isArray(candidates) || candidates.length === 0) blockers.push("mock_ledger_update_candidate_missing");
  if (candidates.some((candidate) => candidate.redacted !== true)) blockers.push("mock_ledger_update_candidate_not_redacted");
  if (candidates.some((candidate) => candidate.scope !== "mock_only")) blockers.push("mock_ledger_update_candidate_scope_not_mock_only");
  if (candidates.some((candidate) => candidate.actualLedgerEntryCreated !== false)) blockers.push("actual_ledger_entry_must_not_be_created");
  if (candidates.some((candidate) => candidate.actualPortfolioLedgerUpdated !== false)) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (candidates.some((candidate) => candidate.persistentStorageUsed !== false || candidate.dbWriteUsed !== false)) blockers.push("persistent_db_write_must_not_run");
  if (candidates.some((candidate) => candidate.actualCashUpdated !== false)) blockers.push("actual_cash_update_must_not_run");
  if (candidates.some((candidate) => candidate.actualPositionUpdated !== false)) blockers.push("actual_position_update_must_not_run");
  if (candidates.some((candidate) => candidate.accountBalanceQueried !== false)) blockers.push("actual_account_balance_query_must_not_run");
  if (candidates.some((candidate) => toFiniteNumber(candidate.cashAfterPreview, 0) < 0)) warnings.push("cash_after_preview_negative");
  if (candidates.some((candidate) => toFiniteNumber(candidate.positionAfterPreview, 0) < 0)) warnings.push("position_after_preview_negative");
  if (candidates.some((candidate) => toFiniteNumber(candidate.portfolioValueAfterPreview, 0) < 0)) warnings.push("portfolio_value_after_preview_negative");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.ledgerUpdateReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";
  const firstCandidate = candidates[0] || {};

  return {
    validationId: "step150_mock_portfolio_ledger_update_review_result_validation",
    sourceStep: "step150",
    status,
    ledgerUpdatePreflightId: result.ledgerUpdatePreflightId || "step150_missing_ledger_update_preflight",
    ledgerUpdateCandidateId: firstCandidate.ledgerUpdateCandidateId || result.ledgerUpdateCandidateId || "step150_missing_ledger_update_candidate",
    mockFillResultId: result.mockFillResultId || firstCandidate.mockFillResultId || "step150_missing_mock_fill_result",
    calculationInputId: firstCandidate.calculationInputId || "step150_missing_calculation_input",
    fillCoreReviewResultId: firstCandidate.fillCoreReviewResultId || validation.fillCoreReviewResultId || "step150_missing_fill_core_review_result",
    mockRunCandidateId: firstCandidate.mockRunCandidateId || validation.mockRunCandidateId || "step150_missing_mock_run_candidate",
    strategyDraftId: firstCandidate.strategyDraftId || validation.strategyDraftId || "step150_missing_strategy_draft",
    candidateCount: Array.isArray(candidates) ? candidates.length : 0,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    cashDeltaReviewStatus: uniqueBlockers.some((blocker) => blocker.includes("cash")) ? "blocked" : uniqueWarnings.includes("cash_after_preview_negative") ? "validation_required" : "reviewed",
    positionDeltaReviewStatus: uniqueBlockers.some((blocker) => blocker.includes("position")) ? "blocked" : uniqueWarnings.includes("position_after_preview_negative") ? "validation_required" : "reviewed",
    portfolioValueImpactReviewStatus: uniqueWarnings.includes("portfolio_value_after_preview_negative") ? "validation_required" : "reviewed",
    ledgerConsistencyReviewStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic",
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step150_mock_portfolio_ledger_update_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateReviewResult(input, options);
  const reviewStatus = validation.status === "recorded" ? "recorded" : validation.status;
  const decision = reviewStatus === "recorded" ? "mock_ledger_update_review_recorded" : reviewStatus === "validation_required" ? "rejected" : "blocked";

  return {
    ledgerUpdateReviewResultId: "step150_mock_portfolio_ledger_update_review_result",
    ledgerUpdatePreflightId: validation.ledgerUpdatePreflightId,
    ledgerUpdateCandidateId: validation.ledgerUpdateCandidateId,
    mockFillResultId: validation.mockFillResultId,
    calculationInputId: validation.calculationInputId,
    fillCoreReviewResultId: validation.fillCoreReviewResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus,
    decision,
    reviewedAt: "placeholder_reviewed_at",
    reviewedBy: "admin_placeholder",
    summary: [
      "mock portfolio ledger update review only",
      "not an actual account ledger update",
      "no real cash or position update",
      "no persistent DB write",
      "not an actual fill, execution, or order result",
      "KIS calls and order submission remain blocked",
    ],
    blockers: validation.blockers,
    warnings: validation.warnings,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateReviewResultRecordingGate(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockPortfolioLedgerUpdateReviewResult({ ...input, validation }, options);
  const impactReviewSummary = input.impactReviewSummary || buildTradingLabMockLedgerUpdateImpactReviewSummary(input, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockLedgerUpdateReviewDecisionSummary({ ...input, validation }, options);

  return {
    ok: true,
    step: "Step 150: Admin trading lab mock portfolio ledger update review result recording gate",
    status: "admin_only_trading_lab_mock_portfolio_ledger_update_review_result_fail_closed",
    sourceStep: "step150",
    mockPortfolioLedgerUpdateReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_MODEL,
    mockLedgerUpdateReviewReceiptSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_RECEIPT_SCHEMA,
    mockLedgerUpdateReviewDecisionSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_DECISION_SUMMARY_MODEL,
    mockLedgerUpdateImpactReviewSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_IMPACT_REVIEW_SUMMARY_MODEL,
    validation,
    reviewResult,
    impactReviewSummary,
    decisionSummary,
    receipt: {
      receiptId: "step150_mock_ledger_update_review_receipt",
      ledgerUpdateReviewResultId: reviewResult.ledgerUpdateReviewResultId,
      ledgerUpdatePreflightId: reviewResult.ledgerUpdatePreflightId,
      ledgerUpdateCandidateId: reviewResult.ledgerUpdateCandidateId,
      mockFillResultId: reviewResult.mockFillResultId,
      reviewStatus: reviewResult.reviewStatus,
      decision: reviewResult.decision,
      redacted: true,
      recordedAt: "placeholder_recorded_at",
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      cashDeltaReviewStatus: validation.cashDeltaReviewStatus,
      positionDeltaReviewStatus: validation.positionDeltaReviewStatus,
      portfolioValueImpactReviewStatus: validation.portfolioValueImpactReviewStatus,
      ledgerConsistencyReviewStatus: validation.ledgerConsistencyReviewStatus,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_core_preflight",
    },
    mockHistory: [
      {
        historyId: "step150_mock_ledger_update_review_history_1",
        sourceStep: "step150",
        status: reviewResult.reviewStatus,
        decision: reviewResult.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_ledger_update_core_preflight",
      },
    ],
    flags: { ...STEP150_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
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
      actualLedgerUpdateAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step150_mock_portfolio_ledger_update_review_result_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioLedgerUpdateReviewResultRecordingGate(input, options);
}

function getStep151MockPortfolioLedgerUpdateCoreContext(input = {}, options = {}) {
  const hasReviewResultStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdateReviewResultStatus");
  const mockPortfolioLedgerUpdateReviewResultStatus = hasReviewResultStatus
    ? input.mockPortfolioLedgerUpdateReviewResultStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus(input, options);
  const hasPreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdatePreflightStatus");
  const mockPortfolioLedgerUpdatePreflightStatus = hasPreflightStatus
    ? input.mockPortfolioLedgerUpdatePreflightStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus(input, options);
  const reviewResult = input.ledgerUpdateReviewResult || mockPortfolioLedgerUpdateReviewResultStatus?.reviewResult || null;
  const receipt = input.ledgerUpdateReviewReceipt || mockPortfolioLedgerUpdateReviewResultStatus?.receipt || null;
  const reviewValidation = input.ledgerUpdateReviewValidation || mockPortfolioLedgerUpdateReviewResultStatus?.validation || {};
  const ledgerUpdateCandidates = Array.isArray(input.ledgerUpdateCandidates)
    ? input.ledgerUpdateCandidates
    : Array.isArray(mockPortfolioLedgerUpdatePreflightStatus?.ledgerUpdateCandidates)
      ? mockPortfolioLedgerUpdatePreflightStatus.ledgerUpdateCandidates
      : [];

  return {
    mockPortfolioLedgerUpdateReviewResultStatus,
    mockPortfolioLedgerUpdatePreflightStatus,
    reviewResult,
    receipt,
    reviewValidation,
    ledgerUpdateCandidates,
  };
}

export function buildTradingLabMockLedgerCoreInputBundle(input = {}, options = {}) {
  const context = getStep151MockPortfolioLedgerUpdateCoreContext(input, options);
  const candidate = input.ledgerUpdateCandidate || context.ledgerUpdateCandidates[0] || {};
  const reviewResult = context.reviewResult || {};
  const cashBeforePlaceholder = toFiniteNumber(candidate.cashBeforePlaceholder, 100000);
  const cashDelta = toFiniteNumber(candidate.cashDelta, 0);
  const positionBeforePlaceholder = toFiniteNumber(candidate.positionBeforePlaceholder, 0);
  const positionDelta = toFiniteNumber(candidate.positionDelta, 0);
  const portfolioValueBeforePlaceholder = toFiniteNumber(candidate.portfolioValueBeforePlaceholder, 100000);
  const portfolioValueAfterPreview = toFiniteNumber(
    candidate.portfolioValueAfterPreview,
    portfolioValueBeforePlaceholder + cashDelta,
  );

  return {
    ledgerCoreInputBundleId: "step151_mock_ledger_core_input_bundle",
    ledgerUpdateReviewResultId: reviewResult.ledgerUpdateReviewResultId || "step151_missing_ledger_update_review_result",
    ledgerUpdatePreflightId: reviewResult.ledgerUpdatePreflightId || candidate.ledgerUpdatePreflightId || "step151_missing_ledger_update_preflight",
    ledgerUpdateCandidateId: reviewResult.ledgerUpdateCandidateId || candidate.ledgerUpdateCandidateId || "step151_missing_ledger_update_candidate",
    mockFillResultId: reviewResult.mockFillResultId || candidate.mockFillResultId || "step151_missing_mock_fill_result",
    calculationInputId: reviewResult.calculationInputId || candidate.calculationInputId || "step151_missing_calculation_input",
    fillCoreReviewResultId: reviewResult.fillCoreReviewResultId || candidate.fillCoreReviewResultId || "step151_missing_fill_core_review_result",
    mockRunCandidateId: reviewResult.mockRunCandidateId || candidate.mockRunCandidateId || "step151_missing_mock_run_candidate",
    strategyDraftId: reviewResult.strategyDraftId || candidate.strategyDraftId || "step151_missing_strategy_draft",
    sourceStep: "step151",
    scope: "mock_only",
    updateType: "mock_cash_position_delta_preview",
    cashBeforePlaceholder: roundMoney(cashBeforePlaceholder),
    cashDelta: roundMoney(cashDelta),
    cashAfterPreview: roundMoney(toFiniteNumber(candidate.cashAfterPreview, cashBeforePlaceholder + cashDelta)),
    positionBeforePlaceholder: roundQuantity(positionBeforePlaceholder),
    positionDelta: roundQuantity(positionDelta),
    positionAfterPreview: roundQuantity(toFiniteNumber(candidate.positionAfterPreview, positionBeforePlaceholder + positionDelta)),
    portfolioValueBeforePlaceholder: roundMoney(portfolioValueBeforePlaceholder),
    portfolioValueAfterPreview: roundMoney(portfolioValueAfterPreview),
    realizedPnlPlaceholder: roundMoney(toFiniteNumber(candidate.realizedPnlPlaceholder, 0)),
    unrealizedPnlPlaceholder: roundMoney(toFiniteNumber(candidate.unrealizedPnlPlaceholder, 0)),
    mockLedgerPolicy: "mock_in_memory_preview_only",
    mockValuationPolicy: "static_mock_series_only",
    deterministic: true,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockLedgerUpdateScenario(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);

  return {
    ledgerUpdateScenarioId: "step151_mock_ledger_update_scenario",
    ledgerCoreInputBundleId: ledgerCoreInputBundle.ledgerCoreInputBundleId,
    sourceStep: "step151",
    scope: "mock_only",
    updateMode: "mock_cash_position_delta_preview",
    cashLedgerPolicy: "mock_cash_delta_preview_only",
    positionLedgerPolicy: "mock_position_delta_preview_only",
    valuationPolicy: "static_mock_series_only",
    pnlPolicy: "placeholder_only",
    consistencyPolicy: "mock_double_entry_consistency_preview",
    deterministicUpdatePolicy: "pure_function_input_output_preview",
    persistentDbWritePolicy: "blocked",
    accountBalanceQueryPolicy: "blocked",
    actualLedgerUpdatePolicy: "blocked",
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
}

export function validateTradingLabMockCashLedgerUpdatePolicy(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const blockers = [];
  const warnings = [];

  if (ledgerCoreInputBundle.redacted !== true) blockers.push("mock_ledger_core_input_bundle_not_redacted");
  if (ledgerCoreInputBundle.scope !== "mock_only") blockers.push("mock_ledger_core_input_bundle_scope_not_mock_only");
  if (ledgerCoreInputBundle.actualCashUpdated !== false) blockers.push("actual_cash_update_must_not_run");
  if (ledgerCoreInputBundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (ledgerCoreInputBundle.persistentStorageUsed !== false || ledgerCoreInputBundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (toFiniteNumber(ledgerCoreInputBundle.cashAfterPreview, 0) < 0) warnings.push("mock_cash_after_preview_negative");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    validationId: "step151_mock_cash_ledger_update_policy_validation",
    sourceStep: "step151",
    status: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    cashBeforePlaceholder: ledgerCoreInputBundle.cashBeforePlaceholder,
    cashDelta: ledgerCoreInputBundle.cashDelta,
    cashAfterPreview: ledgerCoreInputBundle.cashAfterPreview,
    cashLedgerPolicyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    actualCashUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
  };
}

export function validateTradingLabMockPositionLedgerUpdatePolicy(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const blockers = [];
  const warnings = [];

  if (ledgerCoreInputBundle.redacted !== true) blockers.push("mock_ledger_core_input_bundle_not_redacted");
  if (ledgerCoreInputBundle.scope !== "mock_only") blockers.push("mock_ledger_core_input_bundle_scope_not_mock_only");
  if (ledgerCoreInputBundle.actualPositionUpdated !== false) blockers.push("actual_position_update_must_not_run");
  if (ledgerCoreInputBundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (toFiniteNumber(ledgerCoreInputBundle.positionAfterPreview, 0) < 0) warnings.push("mock_position_after_preview_negative");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    validationId: "step151_mock_position_ledger_update_policy_validation",
    sourceStep: "step151",
    status: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    positionBeforePlaceholder: ledgerCoreInputBundle.positionBeforePlaceholder,
    positionDelta: ledgerCoreInputBundle.positionDelta,
    positionAfterPreview: ledgerCoreInputBundle.positionAfterPreview,
    positionLedgerPolicyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    redacted: true,
  };
}

export function validateTradingLabMockPortfolioValuationPolicy(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const blockers = [];
  const warnings = [];

  if (ledgerCoreInputBundle.mockValuationPolicy !== "static_mock_series_only") blockers.push("mock_valuation_policy_must_use_static_mock_series");
  if (ledgerCoreInputBundle.quoteRequestAttempted !== false || ledgerCoreInputBundle.networkCallAttempted !== false) blockers.push("provider_quote_query_must_not_run");
  if (toFiniteNumber(ledgerCoreInputBundle.portfolioValueAfterPreview, 0) < 0) warnings.push("mock_portfolio_value_after_preview_negative");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    validationId: "step151_mock_portfolio_valuation_policy_validation",
    sourceStep: "step151",
    status: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    valuationPolicyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "valid",
    portfolioValueBeforePlaceholder: ledgerCoreInputBundle.portfolioValueBeforePlaceholder,
    portfolioValueAfterPreview: ledgerCoreInputBundle.portfolioValueAfterPreview,
    providerCallsAllowed: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    redacted: true,
  };
}

export function validateTradingLabMockPnlPlaceholderPolicy(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const blockers = [];
  const warnings = [];

  if (!Number.isFinite(toFiniteNumber(ledgerCoreInputBundle.realizedPnlPlaceholder, 0))) blockers.push("realized_pnl_placeholder_not_finite");
  if (!Number.isFinite(toFiniteNumber(ledgerCoreInputBundle.unrealizedPnlPlaceholder, 0))) blockers.push("unrealized_pnl_placeholder_not_finite");
  if (ledgerCoreInputBundle.actualLedgerEntryCreated !== false) blockers.push("actual_ledger_entry_must_not_be_created");
  if (ledgerCoreInputBundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_portfolio_ledger_update_must_not_run");

  return {
    validationId: "step151_mock_pnl_placeholder_policy_validation",
    sourceStep: "step151",
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "placeholder_only",
    pnlPlaceholderStatus: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "placeholder_only",
    realizedPnlPlaceholder: ledgerCoreInputBundle.realizedPnlPlaceholder,
    unrealizedPnlPlaceholder: ledgerCoreInputBundle.unrealizedPnlPlaceholder,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    redacted: true,
  };
}

export function validateTradingLabMockLedgerConsistencyReadiness(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const ledgerUpdateScenario = input.ledgerUpdateScenario || buildTradingLabMockLedgerUpdateScenario({ ...input, ledgerCoreInputBundle }, options);
  const blockers = [];
  const warnings = [];

  if (ledgerCoreInputBundle.deterministic !== true || ledgerUpdateScenario.deterministic !== true) blockers.push("mock_ledger_update_must_be_deterministic");
  if (ledgerUpdateScenario.scope !== "mock_only") blockers.push("mock_ledger_update_scenario_scope_not_mock_only");
  if (ledgerUpdateScenario.persistentDbWritePolicy !== "blocked") blockers.push("persistent_db_write_policy_must_remain_blocked");
  if (ledgerUpdateScenario.actualLedgerUpdatePolicy !== "blocked") blockers.push("actual_ledger_update_policy_must_remain_blocked");
  if (toFiniteNumber(ledgerCoreInputBundle.cashAfterPreview, 0) < 0 || toFiniteNumber(ledgerCoreInputBundle.positionAfterPreview, 0) < 0) warnings.push("mock_ledger_consistency_validation_required");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    validationId: "step151_mock_ledger_consistency_readiness",
    sourceStep: "step151",
    status: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic",
    ledgerConsistencyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic",
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    redacted: true,
  };
}

export function validateTradingLabMockLedgerDeterministicUpdateReadiness(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const ledgerUpdateScenario = input.ledgerUpdateScenario || buildTradingLabMockLedgerUpdateScenario({ ...input, ledgerCoreInputBundle }, options);
  const blockers = [];

  if (ledgerUpdateScenario.deterministicUpdatePolicy !== "pure_function_input_output_preview") blockers.push("deterministic_update_policy_missing");
  if (ledgerCoreInputBundle.providerCallsAllowed !== false || ledgerCoreInputBundle.orderSubmissionAllowed !== false) blockers.push("provider_or_order_gate_must_remain_blocked");
  if (ledgerCoreInputBundle.persistentStorageUsed !== false || ledgerCoreInputBundle.dbWriteUsed !== false) blockers.push("deterministic_update_must_not_write_database");

  const uniqueBlockers = [...new Set(blockers)];

  return {
    validationId: "step151_mock_ledger_deterministic_update_readiness",
    sourceStep: "step151",
    status: uniqueBlockers.length > 0 ? "blocked" : "deterministic",
    deterministicUpdateStatus: uniqueBlockers.length > 0 ? "blocked" : "deterministic",
    blockers: uniqueBlockers,
    warnings: [],
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
  };
}

export function validateTradingLabMockPortfolioLedgerUpdateCorePreflight(input = {}, options = {}) {
  const context = getStep151MockPortfolioLedgerUpdateCoreContext(input, options);
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const ledgerUpdateScenario = input.ledgerUpdateScenario || buildTradingLabMockLedgerUpdateScenario({ ...input, ledgerCoreInputBundle }, options);
  const cashLedgerPolicyValidation = input.cashLedgerPolicyValidation || validateTradingLabMockCashLedgerUpdatePolicy({ ...input, ledgerCoreInputBundle }, options);
  const positionLedgerPolicyValidation = input.positionLedgerPolicyValidation || validateTradingLabMockPositionLedgerUpdatePolicy({ ...input, ledgerCoreInputBundle }, options);
  const valuationPolicyValidation = input.valuationPolicyValidation || validateTradingLabMockPortfolioValuationPolicy({ ...input, ledgerCoreInputBundle }, options);
  const pnlPlaceholderPolicyValidation = input.pnlPlaceholderPolicyValidation || validateTradingLabMockPnlPlaceholderPolicy({ ...input, ledgerCoreInputBundle }, options);
  const ledgerConsistencyReadiness = input.ledgerConsistencyReadiness || validateTradingLabMockLedgerConsistencyReadiness({ ...input, ledgerCoreInputBundle, ledgerUpdateScenario }, options);
  const deterministicUpdateReadiness = input.deterministicUpdateReadiness || validateTradingLabMockLedgerDeterministicUpdateReadiness({ ...input, ledgerCoreInputBundle, ledgerUpdateScenario }, options);
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioLedgerUpdateReviewResultStatus) blockers.push("mock_portfolio_ledger_update_review_result_status_missing");
  if (!context.reviewResult) blockers.push("mock_portfolio_ledger_update_review_result_missing");
  if (!context.receipt) blockers.push("mock_portfolio_ledger_update_review_receipt_missing");
  if (reviewResult.redacted !== true) blockers.push("mock_portfolio_ledger_update_review_result_not_redacted");
  if (receipt.redacted !== true) blockers.push("mock_portfolio_ledger_update_review_receipt_not_redacted");
  if (reviewResult.readinessImpact !== "none" || receipt.readinessImpact !== "none") blockers.push("review_result_readiness_impact_not_none");
  if (reviewResult.providerCallImpact !== "blocked" || receipt.providerCallImpact !== "blocked") blockers.push("review_result_provider_call_impact_not_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked" || receipt.orderSubmissionImpact !== "blocked") blockers.push("review_result_order_submission_impact_not_blocked");
  if (reviewResult.liveTradingImpact !== "blocked" || receipt.liveTradingImpact !== "blocked") blockers.push("review_result_live_trading_impact_not_blocked");
  if (receipt.nextAllowedStep && receipt.nextAllowedStep !== "mock_portfolio_ledger_update_core_preflight") blockers.push("review_result_next_step_not_ledger_update_core_preflight");
  if (reviewResult.reviewStatus === "blocked" || receipt.reviewStatus === "blocked") blockers.push("mock_portfolio_ledger_update_review_result_blocked");
  if (reviewResult.reviewStatus === "validation_required" || receipt.reviewStatus === "validation_required") warnings.push("mock_portfolio_ledger_update_review_result_validation_required");
  if (ledgerCoreInputBundle.redacted !== true || ledgerUpdateScenario.redacted !== true) blockers.push("mock_ledger_update_core_payload_not_redacted");
  if (ledgerCoreInputBundle.scope !== "mock_only" || ledgerUpdateScenario.scope !== "mock_only") blockers.push("mock_ledger_update_core_scope_not_mock_only");
  if (ledgerCoreInputBundle.actualLedgerEntryCreated !== false || ledgerCoreInputBundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_ledger_update_must_not_run");
  if (ledgerCoreInputBundle.actualCashUpdated !== false || ledgerCoreInputBundle.actualPositionUpdated !== false) blockers.push("actual_cash_or_position_update_must_not_run");
  if (ledgerCoreInputBundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (ledgerCoreInputBundle.persistentStorageUsed !== false || ledgerCoreInputBundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.ledgerUpdateCoreInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  [
    cashLedgerPolicyValidation,
    positionLedgerPolicyValidation,
    valuationPolicyValidation,
    pnlPlaceholderPolicyValidation,
    ledgerConsistencyReadiness,
    deterministicUpdateReadiness,
  ].forEach((validation) => {
    if (validation.status === "blocked") blockers.push(`${validation.validationId}_blocked`);
    if (validation.status === "validation_required") warnings.push(`${validation.validationId}_validation_required`);
  });

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_ledger_update_core_ready";

  return {
    validationId: "step151_mock_portfolio_ledger_update_core_preflight_validation",
    sourceStep: "step151",
    status,
    ledgerUpdateCorePreflightId: "step151_mock_portfolio_ledger_update_core_preflight",
    ledgerCoreInputBundleId: ledgerCoreInputBundle.ledgerCoreInputBundleId,
    ledgerUpdateScenarioId: ledgerUpdateScenario.ledgerUpdateScenarioId,
    ledgerUpdateReviewResultId: reviewResult.ledgerUpdateReviewResultId || ledgerCoreInputBundle.ledgerUpdateReviewResultId,
    ledgerUpdatePreflightId: reviewResult.ledgerUpdatePreflightId || ledgerCoreInputBundle.ledgerUpdatePreflightId,
    ledgerUpdateCandidateId: reviewResult.ledgerUpdateCandidateId || ledgerCoreInputBundle.ledgerUpdateCandidateId,
    mockFillResultId: reviewResult.mockFillResultId || ledgerCoreInputBundle.mockFillResultId,
    calculationInputId: reviewResult.calculationInputId || ledgerCoreInputBundle.calculationInputId,
    fillCoreReviewResultId: reviewResult.fillCoreReviewResultId || ledgerCoreInputBundle.fillCoreReviewResultId,
    mockRunCandidateId: reviewResult.mockRunCandidateId || ledgerCoreInputBundle.mockRunCandidateId,
    strategyDraftId: reviewResult.strategyDraftId || ledgerCoreInputBundle.strategyDraftId,
    cashLedgerPolicyStatus: cashLedgerPolicyValidation.cashLedgerPolicyStatus,
    positionLedgerPolicyStatus: positionLedgerPolicyValidation.positionLedgerPolicyStatus,
    valuationPolicyStatus: valuationPolicyValidation.valuationPolicyStatus,
    pnlPlaceholderStatus: pnlPlaceholderPolicyValidation.pnlPlaceholderStatus,
    ledgerConsistencyStatus: ledgerConsistencyReadiness.ledgerConsistencyStatus,
    deterministicUpdateStatus: deterministicUpdateReadiness.deterministicUpdateStatus,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step151_mock_portfolio_ledger_update_core_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateCorePreflight(input = {}, options = {}) {
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || buildTradingLabMockLedgerCoreInputBundle(input, options);
  const ledgerUpdateScenario = input.ledgerUpdateScenario || buildTradingLabMockLedgerUpdateScenario({ ...input, ledgerCoreInputBundle }, options);
  const cashLedgerPolicyValidation = input.cashLedgerPolicyValidation || validateTradingLabMockCashLedgerUpdatePolicy({ ...input, ledgerCoreInputBundle }, options);
  const positionLedgerPolicyValidation = input.positionLedgerPolicyValidation || validateTradingLabMockPositionLedgerUpdatePolicy({ ...input, ledgerCoreInputBundle }, options);
  const valuationPolicyValidation = input.valuationPolicyValidation || validateTradingLabMockPortfolioValuationPolicy({ ...input, ledgerCoreInputBundle }, options);
  const pnlPlaceholderPolicyValidation = input.pnlPlaceholderPolicyValidation || validateTradingLabMockPnlPlaceholderPolicy({ ...input, ledgerCoreInputBundle }, options);
  const ledgerConsistencyReadiness = input.ledgerConsistencyReadiness || validateTradingLabMockLedgerConsistencyReadiness({ ...input, ledgerCoreInputBundle, ledgerUpdateScenario }, options);
  const deterministicUpdateReadiness = input.deterministicUpdateReadiness || validateTradingLabMockLedgerDeterministicUpdateReadiness({ ...input, ledgerCoreInputBundle, ledgerUpdateScenario }, options);
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCorePreflight(
    {
      ...input,
      ledgerCoreInputBundle,
      ledgerUpdateScenario,
      cashLedgerPolicyValidation,
      positionLedgerPolicyValidation,
      valuationPolicyValidation,
      pnlPlaceholderPolicyValidation,
      ledgerConsistencyReadiness,
      deterministicUpdateReadiness,
    },
    options,
  );

  return {
    ok: true,
    step: "Step 151: Admin trading lab mock portfolio ledger update core preflight",
    status: "admin_only_trading_lab_mock_portfolio_ledger_update_core_preflight_fail_closed",
    sourceStep: "step151",
    mockPortfolioLedgerUpdateCorePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_MODEL,
    mockLedgerCoreInputBundleModel: TRADING_LAB_MOCK_LEDGER_CORE_INPUT_BUNDLE_MODEL,
    mockLedgerUpdateScenarioModel: TRADING_LAB_MOCK_LEDGER_UPDATE_SCENARIO_MODEL,
    mockLedgerUpdateCorePreflightResultSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_PREFLIGHT_RESULT_SCHEMA,
    ledgerCoreInputBundle,
    ledgerUpdateScenario,
    cashLedgerPolicyValidation,
    positionLedgerPolicyValidation,
    valuationPolicyValidation,
    pnlPlaceholderPolicyValidation,
    ledgerConsistencyReadiness,
    deterministicUpdateReadiness,
    validation,
    result: {
      ledgerUpdateCorePreflightId: validation.ledgerUpdateCorePreflightId,
      ledgerCoreInputBundleId: validation.ledgerCoreInputBundleId,
      ledgerUpdateScenarioId: validation.ledgerUpdateScenarioId,
      ledgerUpdateReviewResultId: validation.ledgerUpdateReviewResultId,
      ledgerUpdatePreflightId: validation.ledgerUpdatePreflightId,
      ledgerUpdateCandidateId: validation.ledgerUpdateCandidateId,
      mockFillResultId: validation.mockFillResultId,
      calculationInputId: validation.calculationInputId,
      fillCoreReviewResultId: validation.fillCoreReviewResultId,
      mockRunCandidateId: validation.mockRunCandidateId,
      strategyDraftId: validation.strategyDraftId,
      status: validation.status,
      scope: "mock_only",
      redacted: true,
      cashLedgerPolicyStatus: validation.cashLedgerPolicyStatus,
      positionLedgerPolicyStatus: validation.positionLedgerPolicyStatus,
      valuationPolicyStatus: validation.valuationPolicyStatus,
      pnlPlaceholderStatus: validation.pnlPlaceholderStatus,
      ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
      deterministicUpdateStatus: validation.deterministicUpdateStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      cashAfterPreview: ledgerCoreInputBundle.cashAfterPreview,
      positionAfterPreview: ledgerCoreInputBundle.positionAfterPreview,
      portfolioValueAfterPreview: ledgerCoreInputBundle.portfolioValueAfterPreview,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_core",
    },
    summary: {
      summaryId: "step151_mock_portfolio_ledger_update_core_preflight_summary",
      sourceStep: "step151",
      inputBundleStatus: validation.status === "blocked" ? "blocked" : "redacted_mock_only",
      cashLedgerPolicyStatus: validation.cashLedgerPolicyStatus,
      positionLedgerPolicyStatus: validation.positionLedgerPolicyStatus,
      valuationPolicyStatus: validation.valuationPolicyStatus,
      pnlPlaceholderStatus: validation.pnlPlaceholderStatus,
      ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
      deterministicUpdateStatus: validation.deterministicUpdateStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      deterministic: deterministicUpdateReadiness.status === "deterministic",
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_core",
    },
    mockHistory: [
      {
        historyId: "step151_mock_ledger_update_core_preflight_history_1",
        sourceStep: "step151",
        status: validation.status,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_ledger_update_core",
      },
    ],
    flags: { ...STEP151_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
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
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step151_mock_portfolio_ledger_update_core_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioLedgerUpdateCorePreflight(input, options);
}

function getStep152MockPortfolioLedgerUpdateCoreReviewContext(input = {}, options = {}) {
  const hasCorePreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdateCorePreflightStatus");
  const mockPortfolioLedgerUpdateCorePreflightStatus = hasCorePreflightStatus
    ? input.mockPortfolioLedgerUpdateCorePreflightStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus(input, options);
  const result = input.ledgerUpdateCorePreflightResult || mockPortfolioLedgerUpdateCorePreflightStatus?.result || null;
  const validation = input.ledgerUpdateCorePreflightValidation || mockPortfolioLedgerUpdateCorePreflightStatus?.validation || {};
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle || mockPortfolioLedgerUpdateCorePreflightStatus?.ledgerCoreInputBundle || null;
  const ledgerUpdateScenario = input.ledgerUpdateScenario || mockPortfolioLedgerUpdateCorePreflightStatus?.ledgerUpdateScenario || null;
  const summary = input.ledgerUpdateCorePreflightSummary || mockPortfolioLedgerUpdateCorePreflightStatus?.summary || {};

  return {
    mockPortfolioLedgerUpdateCorePreflightStatus,
    result,
    validation,
    ledgerCoreInputBundle,
    ledgerUpdateScenario,
    summary,
  };
}

function mapLedgerPolicyReviewStatus(status) {
  if (status === "valid" || status === "placeholder_only" || status === "deterministic") return "reviewed";
  if (status === "blocked") return "blocked";
  return "validation_required";
}

export function buildTradingLabMockLedgerUpdateCorePolicyReviewSummary(input = {}, options = {}) {
  const context = getStep152MockPortfolioLedgerUpdateCoreReviewContext(input, options);
  const result = context.result || {};
  const validation = context.validation || {};

  return {
    summaryId: "step152_mock_ledger_update_core_policy_review_summary",
    sourceStep: "step152",
    cashLedgerPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.cashLedgerPolicyStatus || result.cashLedgerPolicyStatus),
    positionLedgerPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.positionLedgerPolicyStatus || result.positionLedgerPolicyStatus),
    portfolioValuationPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.valuationPolicyStatus || result.valuationPolicyStatus),
    realizedPnlPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.pnlPlaceholderStatus || result.pnlPlaceholderStatus),
    unrealizedPnlPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.pnlPlaceholderStatus || result.pnlPlaceholderStatus),
    ledgerConsistencyReviewStatus: validation.ledgerConsistencyStatus || result.ledgerConsistencyStatus || "validation_required",
    deterministicUpdateReviewStatus: validation.deterministicUpdateStatus || result.deterministicUpdateStatus || "validation_required",
    dependencyReviewStatus: context.result ? "satisfied" : "blocked",
    actualLedgerUpdateAllowed: false,
    actualCashUpdateAllowed: false,
    actualPositionUpdateAllowed: false,
    persistentDbWriteAllowed: false,
    deterministic: validation.deterministicUpdateStatus === "deterministic" || result.deterministicUpdateStatus === "deterministic",
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
}

export function buildTradingLabMockLedgerUpdateCoreReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult(input, options);
  const decision = validation.status === "recorded" ? "mock_ledger_update_core_review_recorded" : validation.status === "validation_required" ? "rejected" : "blocked";

  return {
    summaryId: "step152_mock_ledger_update_core_review_decision_summary",
    sourceStep: "step152",
    decision,
    decisionSummary: [
      "mock portfolio ledger update core review recorded",
      "FINPLE internal mock ledger update core review only",
      "not an actual account ledger update",
      "no persistent DB write",
      "no real cash or position update",
      "not an actual fill, execution, or order result",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    externalOrderAuthorityRequired: true,
    actualLedgerUpdateAllowed: false,
    actualCashUpdateAllowed: false,
    actualPositionUpdateAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}

export function validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult(input = {}, options = {}) {
  const context = getStep152MockPortfolioLedgerUpdateCoreReviewContext(input, options);
  const result = context.result || {};
  const validation = context.validation || {};
  const ledgerCoreInputBundle = context.ledgerCoreInputBundle || {};
  const ledgerUpdateScenario = context.ledgerUpdateScenario || {};
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioLedgerUpdateCorePreflightStatus) blockers.push("mock_portfolio_ledger_update_core_preflight_status_missing");
  if (!context.result) blockers.push("mock_portfolio_ledger_update_core_preflight_result_missing");
  if (!context.ledgerCoreInputBundle) blockers.push("mock_ledger_core_input_bundle_missing");
  if (result.redacted !== true) blockers.push("mock_portfolio_ledger_update_core_preflight_result_not_redacted");
  if (result.scope !== "mock_only") blockers.push("mock_portfolio_ledger_update_core_preflight_scope_not_mock_only");
  if (ledgerCoreInputBundle.redacted !== true) blockers.push("mock_ledger_core_input_bundle_not_redacted");
  if (ledgerCoreInputBundle.scope !== "mock_only") blockers.push("mock_ledger_core_input_bundle_scope_not_mock_only");
  if (ledgerUpdateScenario && ledgerUpdateScenario.scope && ledgerUpdateScenario.scope !== "mock_only") blockers.push("mock_ledger_update_scenario_scope_not_mock_only");
  if (result.readinessImpact !== "none") blockers.push("core_preflight_readiness_impact_not_none");
  if (result.providerCallImpact !== "blocked") blockers.push("core_preflight_provider_call_impact_not_blocked");
  if (result.orderSubmissionImpact !== "blocked") blockers.push("core_preflight_order_submission_impact_not_blocked");
  if (result.liveTradingImpact !== "blocked") blockers.push("core_preflight_live_trading_impact_not_blocked");
  if (result.nextAllowedStep && result.nextAllowedStep !== "mock_portfolio_ledger_update_core") blockers.push("core_preflight_next_step_not_mock_ledger_update_core");
  if (validation.status === "blocked" || result.status === "blocked") blockers.push("mock_portfolio_ledger_update_core_preflight_blocked");
  if (validation.status === "validation_required" || result.status === "validation_required") warnings.push("mock_portfolio_ledger_update_core_preflight_validation_required");
  if (ledgerCoreInputBundle.actualLedgerEntryCreated !== false || ledgerCoreInputBundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_ledger_update_must_not_run");
  if (ledgerCoreInputBundle.actualCashUpdated !== false) blockers.push("actual_cash_update_must_not_run");
  if (ledgerCoreInputBundle.actualPositionUpdated !== false) blockers.push("actual_position_update_must_not_run");
  if (ledgerCoreInputBundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (ledgerCoreInputBundle.persistentStorageUsed !== false || ledgerCoreInputBundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (ledgerCoreInputBundle.kisOrderPayloadCreated !== false || ledgerCoreInputBundle.kisExecutionPayloadCreated !== false || ledgerCoreInputBundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (ledgerCoreInputBundle.actualOrderCandidateCreated !== false || ledgerCoreInputBundle.actualOrderDraftCreated !== false) blockers.push("actual_order_candidate_or_draft_must_not_be_created");
  if (ledgerCoreInputBundle.actualExecutionCreated !== false || ledgerCoreInputBundle.actualFillRecordCreated !== false) blockers.push("actual_fill_or_execution_record_must_not_be_created");
  if (toFiniteNumber(result.cashAfterPreview ?? ledgerCoreInputBundle.cashAfterPreview, 0) < 0) warnings.push("mock_cash_after_preview_negative");
  if (toFiniteNumber(result.positionAfterPreview ?? ledgerCoreInputBundle.positionAfterPreview, 0) < 0) warnings.push("mock_position_after_preview_negative");
  if (toFiniteNumber(result.portfolioValueAfterPreview ?? ledgerCoreInputBundle.portfolioValueAfterPreview, 0) < 0) warnings.push("mock_portfolio_value_after_preview_negative");
  if (validation.ledgerConsistencyStatus && validation.ledgerConsistencyStatus !== "deterministic") warnings.push("mock_ledger_consistency_review_required");
  if (validation.deterministicUpdateStatus && validation.deterministicUpdateStatus !== "deterministic") warnings.push("mock_deterministic_update_review_required");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.ledgerUpdateCoreReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";

  return {
    validationId: "step152_mock_portfolio_ledger_update_core_review_result_validation",
    sourceStep: "step152",
    status,
    ledgerUpdateCorePreflightId: result.ledgerUpdateCorePreflightId || validation.ledgerUpdateCorePreflightId || "step152_missing_ledger_update_core_preflight",
    ledgerCoreInputBundleId: result.ledgerCoreInputBundleId || validation.ledgerCoreInputBundleId || ledgerCoreInputBundle.ledgerCoreInputBundleId || "step152_missing_ledger_core_input_bundle",
    ledgerUpdateReviewResultId: result.ledgerUpdateReviewResultId || validation.ledgerUpdateReviewResultId || ledgerCoreInputBundle.ledgerUpdateReviewResultId || "step152_missing_ledger_update_review_result",
    ledgerUpdateCandidateId: result.ledgerUpdateCandidateId || validation.ledgerUpdateCandidateId || ledgerCoreInputBundle.ledgerUpdateCandidateId || "step152_missing_ledger_update_candidate",
    mockFillResultId: result.mockFillResultId || validation.mockFillResultId || ledgerCoreInputBundle.mockFillResultId || "step152_missing_mock_fill_result",
    mockRunCandidateId: result.mockRunCandidateId || validation.mockRunCandidateId || ledgerCoreInputBundle.mockRunCandidateId || "step152_missing_mock_run_candidate",
    strategyDraftId: result.strategyDraftId || validation.strategyDraftId || ledgerCoreInputBundle.strategyDraftId || "step152_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    cashLedgerPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.cashLedgerPolicyStatus || result.cashLedgerPolicyStatus),
    positionLedgerPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.positionLedgerPolicyStatus || result.positionLedgerPolicyStatus),
    portfolioValuationPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.valuationPolicyStatus || result.valuationPolicyStatus),
    realizedPnlPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.pnlPlaceholderStatus || result.pnlPlaceholderStatus),
    unrealizedPnlPolicyReviewStatus: mapLedgerPolicyReviewStatus(validation.pnlPlaceholderStatus || result.pnlPlaceholderStatus),
    ledgerConsistencyReviewStatus: validation.ledgerConsistencyStatus || result.ledgerConsistencyStatus || "validation_required",
    deterministicUpdateReviewStatus: validation.deterministicUpdateStatus || result.deterministicUpdateStatus || "validation_required",
    dependencyReviewStatus: context.result ? "satisfied" : "blocked",
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step152_mock_portfolio_ledger_update_core_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateCoreReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult(input, options);
  const reviewStatus = validation.status === "recorded" ? "recorded" : validation.status;
  const decision = reviewStatus === "recorded" ? "mock_ledger_update_core_review_recorded" : reviewStatus === "validation_required" ? "rejected" : "blocked";

  return {
    ledgerUpdateCoreReviewResultId: "step152_mock_portfolio_ledger_update_core_review_result",
    ledgerUpdateCorePreflightId: validation.ledgerUpdateCorePreflightId,
    ledgerCoreInputBundleId: validation.ledgerCoreInputBundleId,
    ledgerUpdateReviewResultId: validation.ledgerUpdateReviewResultId,
    ledgerUpdateCandidateId: validation.ledgerUpdateCandidateId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus,
    decision,
    reviewedAt: "placeholder_reviewed_at",
    reviewedBy: "admin_placeholder",
    summary: [
      "FINPLE internal mock ledger update core review only",
      "not an actual account ledger update",
      "no real cash or position update",
      "no persistent DB write",
      "not an actual fill, execution, or order result",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
    ],
    blockers: validation.blockers,
    warnings: validation.warnings,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateCoreReviewResultRecordingGate(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCoreReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockPortfolioLedgerUpdateCoreReviewResult({ ...input, validation }, options);
  const policyReviewSummary = input.policyReviewSummary || buildTradingLabMockLedgerUpdateCorePolicyReviewSummary(input, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockLedgerUpdateCoreReviewDecisionSummary({ ...input, validation }, options);

  return {
    ok: true,
    step: "Step 152: Admin trading lab mock portfolio ledger update core review result recording gate",
    status: "admin_only_trading_lab_mock_portfolio_ledger_update_core_review_result_fail_closed",
    sourceStep: "step152",
    mockPortfolioLedgerUpdateCoreReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_MODEL,
    mockLedgerUpdateCoreReviewReceiptSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_RECEIPT_SCHEMA,
    mockLedgerUpdateCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockLedgerUpdateCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    validation,
    reviewResult,
    policyReviewSummary,
    decisionSummary,
    receipt: {
      receiptId: "step152_mock_ledger_update_core_review_receipt",
      ledgerUpdateCoreReviewResultId: reviewResult.ledgerUpdateCoreReviewResultId,
      ledgerUpdateCorePreflightId: reviewResult.ledgerUpdateCorePreflightId,
      ledgerCoreInputBundleId: reviewResult.ledgerCoreInputBundleId,
      reviewStatus: reviewResult.reviewStatus,
      decision: reviewResult.decision,
      redacted: true,
      recordedAt: "placeholder_recorded_at",
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      cashLedgerPolicyReviewStatus: validation.cashLedgerPolicyReviewStatus,
      positionLedgerPolicyReviewStatus: validation.positionLedgerPolicyReviewStatus,
      portfolioValuationPolicyReviewStatus: validation.portfolioValuationPolicyReviewStatus,
      realizedPnlPolicyReviewStatus: validation.realizedPnlPolicyReviewStatus,
      unrealizedPnlPolicyReviewStatus: validation.unrealizedPnlPolicyReviewStatus,
      ledgerConsistencyReviewStatus: validation.ledgerConsistencyReviewStatus,
      deterministicUpdateReviewStatus: validation.deterministicUpdateReviewStatus,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_ledger_update_core",
    },
    mockHistory: [
      {
        historyId: "step152_mock_ledger_update_core_review_history_1",
        sourceStep: "step152",
        status: reviewResult.reviewStatus,
        decision: reviewResult.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_ledger_update_core",
      },
    ],
    flags: { ...STEP152_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
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
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step152_mock_portfolio_ledger_update_core_review_result_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioLedgerUpdateCoreReviewResultRecordingGate(input, options);
}

function getStep153MockPortfolioLedgerUpdateCoreContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdateCoreReviewResultStatus");
  const mockPortfolioLedgerUpdateCoreReviewResultStatus = hasReviewStatus
    ? input.mockPortfolioLedgerUpdateCoreReviewResultStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus(input, options);
  const hasCorePreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdateCorePreflightStatus");
  const mockPortfolioLedgerUpdateCorePreflightStatus = hasCorePreflightStatus
    ? input.mockPortfolioLedgerUpdateCorePreflightStatus
    : mockPortfolioLedgerUpdateCoreReviewResultStatus?.mockPortfolioLedgerUpdateCorePreflightStatus
      || buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus(input, options);
  const reviewResult = input.ledgerUpdateCoreReviewResult
    || mockPortfolioLedgerUpdateCoreReviewResultStatus?.reviewResult
    || null;
  const receipt = input.ledgerUpdateCoreReviewReceipt
    || mockPortfolioLedgerUpdateCoreReviewResultStatus?.receipt
    || null;
  const reviewValidation = input.ledgerUpdateCoreReviewValidation
    || mockPortfolioLedgerUpdateCoreReviewResultStatus?.validation
    || {};
  const ledgerCoreInputBundle = input.ledgerCoreInputBundle
    || mockPortfolioLedgerUpdateCorePreflightStatus?.ledgerCoreInputBundle
    || null;
  const ledgerUpdateScenario = input.ledgerUpdateScenario
    || mockPortfolioLedgerUpdateCorePreflightStatus?.ledgerUpdateScenario
    || null;
  const preflightResult = input.ledgerUpdateCorePreflightResult
    || mockPortfolioLedgerUpdateCorePreflightStatus?.result
    || null;

  return {
    mockPortfolioLedgerUpdateCoreReviewResultStatus,
    mockPortfolioLedgerUpdateCorePreflightStatus,
    reviewResult,
    receipt,
    reviewValidation,
    ledgerCoreInputBundle,
    ledgerUpdateScenario,
    preflightResult,
  };
}

export function validateTradingLabMockPortfolioLedgerUpdateCore(input = {}, options = {}) {
  const context = getStep153MockPortfolioLedgerUpdateCoreContext(input, options);
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const reviewValidation = context.reviewValidation || {};
  const ledgerCoreInputBundle = context.ledgerCoreInputBundle || {};
  const ledgerUpdateScenario = context.ledgerUpdateScenario || {};
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioLedgerUpdateCoreReviewResultStatus) blockers.push("mock_portfolio_ledger_update_core_review_result_status_missing");
  if (!context.reviewResult) blockers.push("mock_portfolio_ledger_update_core_review_result_missing");
  if (!context.receipt) blockers.push("mock_portfolio_ledger_update_core_review_receipt_missing");
  if (!context.ledgerCoreInputBundle) blockers.push("mock_ledger_core_input_bundle_missing");
  if (reviewResult.redacted !== true || receipt.redacted !== true) blockers.push("mock_ledger_update_core_review_result_not_redacted");
  if (ledgerCoreInputBundle.redacted !== true) blockers.push("mock_ledger_core_input_bundle_not_redacted");
  if (ledgerCoreInputBundle.scope !== "mock_only") blockers.push("mock_ledger_core_input_bundle_scope_not_mock_only");
  if (ledgerUpdateScenario && ledgerUpdateScenario.scope && ledgerUpdateScenario.scope !== "mock_only") blockers.push("mock_ledger_update_scenario_scope_not_mock_only");
  if (reviewResult.reviewStatus !== "recorded") blockers.push("mock_ledger_update_core_review_result_not_recorded");
  if (receipt.reviewStatus !== "recorded") blockers.push("mock_ledger_update_core_review_receipt_not_recorded");
  if (reviewResult.readinessImpact !== "none" || receipt.readinessImpact !== "none") blockers.push("review_result_readiness_impact_not_none");
  if (reviewResult.providerCallImpact !== "blocked" || receipt.providerCallImpact !== "blocked") blockers.push("review_result_provider_call_impact_not_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked" || receipt.orderSubmissionImpact !== "blocked") blockers.push("review_result_order_submission_impact_not_blocked");
  if (reviewResult.liveTradingImpact !== "blocked" || receipt.liveTradingImpact !== "blocked") blockers.push("review_result_live_trading_impact_not_blocked");
  if (receipt.nextAllowedStep && receipt.nextAllowedStep !== "mock_portfolio_ledger_update_core") blockers.push("review_receipt_next_step_not_mock_ledger_update_core");
  if (reviewValidation.status === "blocked") blockers.push("mock_ledger_update_core_review_validation_blocked");
  if (reviewValidation.status === "validation_required") warnings.push("mock_ledger_update_core_review_validation_required");
  if (ledgerCoreInputBundle.actualLedgerEntryCreated !== false || ledgerCoreInputBundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_ledger_update_must_not_run");
  if (ledgerCoreInputBundle.actualCashUpdated !== false) blockers.push("actual_cash_update_must_not_run");
  if (ledgerCoreInputBundle.actualPositionUpdated !== false) blockers.push("actual_position_update_must_not_run");
  if (ledgerCoreInputBundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (ledgerCoreInputBundle.persistentStorageUsed !== false || ledgerCoreInputBundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (ledgerCoreInputBundle.kisOrderPayloadCreated !== false || ledgerCoreInputBundle.kisExecutionPayloadCreated !== false || ledgerCoreInputBundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (ledgerCoreInputBundle.actualOrderCandidateCreated !== false || ledgerCoreInputBundle.actualOrderDraftCreated !== false) blockers.push("actual_order_candidate_or_draft_must_not_be_created");
  if (ledgerCoreInputBundle.actualExecutionCreated !== false || ledgerCoreInputBundle.actualFillRecordCreated !== false) blockers.push("actual_fill_or_execution_record_must_not_be_created");

  const cashBefore = roundMoney(input.cashBefore ?? ledgerCoreInputBundle.cashBeforePlaceholder, 0);
  const cashDelta = roundMoney(input.cashDelta ?? ledgerCoreInputBundle.cashDelta, 0);
  const cashAfter = roundMoney(cashBefore + cashDelta);
  const positionBefore = roundQuantity(input.positionBefore ?? ledgerCoreInputBundle.positionBeforePlaceholder, 0);
  const positionDelta = roundQuantity(input.positionDelta ?? ledgerCoreInputBundle.positionDelta, 0);
  const positionAfter = roundQuantity(positionBefore + positionDelta);
  const side = input.side || ledgerCoreInputBundle.side || "mock_hold";
  const fillStatus = input.fillStatus || ledgerCoreInputBundle.fillStatus || "mock_filled";

  if (side === "mock_buy" && fillStatus !== "mock_rejected") {
    if (cashDelta >= 0) blockers.push("mock_buy_cash_delta_sign_invalid");
    if (positionDelta <= 0) blockers.push("mock_buy_position_delta_sign_invalid");
  }
  if (side === "mock_sell" && fillStatus !== "mock_rejected") {
    if (cashDelta <= 0) blockers.push("mock_sell_cash_delta_sign_invalid");
    if (positionDelta >= 0) blockers.push("mock_sell_position_delta_sign_invalid");
  }
  if (fillStatus === "mock_rejected" && (cashDelta !== 0 || positionDelta !== 0)) blockers.push("mock_rejected_fill_delta_must_be_zero");
  if (cashAfter < 0) warnings.push("mock_cash_after_negative");
  if (positionAfter < 0) warnings.push("mock_position_after_negative");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.ledgerUpdateCoreInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_ledger_updated";

  return {
    validationId: "step153_mock_portfolio_ledger_update_core_validation",
    sourceStep: "step153",
    status,
    ledgerUpdateCoreReviewResultId: reviewResult.ledgerUpdateCoreReviewResultId || reviewValidation.ledgerUpdateCoreReviewResultId || "step153_missing_ledger_update_core_review_result",
    ledgerUpdateCorePreflightId: reviewResult.ledgerUpdateCorePreflightId || reviewValidation.ledgerUpdateCorePreflightId || ledgerCoreInputBundle.ledgerUpdateCorePreflightId || "step153_missing_ledger_update_core_preflight",
    ledgerCoreInputBundleId: reviewResult.ledgerCoreInputBundleId || reviewValidation.ledgerCoreInputBundleId || ledgerCoreInputBundle.ledgerCoreInputBundleId || "step153_missing_ledger_core_input_bundle",
    ledgerUpdateCandidateId: reviewResult.ledgerUpdateCandidateId || reviewValidation.ledgerUpdateCandidateId || ledgerCoreInputBundle.ledgerUpdateCandidateId || "step153_missing_ledger_update_candidate",
    mockFillResultId: reviewResult.mockFillResultId || reviewValidation.mockFillResultId || ledgerCoreInputBundle.mockFillResultId || "step153_missing_mock_fill_result",
    mockRunCandidateId: reviewResult.mockRunCandidateId || reviewValidation.mockRunCandidateId || ledgerCoreInputBundle.mockRunCandidateId || "step153_missing_mock_run_candidate",
    strategyDraftId: reviewResult.strategyDraftId || reviewValidation.strategyDraftId || ledgerCoreInputBundle.strategyDraftId || "step153_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    cashUpdateStatus: status === "blocked" ? "blocked" : cashAfter < 0 ? "validation_required" : "mock_updated",
    positionUpdateStatus: status === "blocked" ? "blocked" : positionAfter < 0 ? "validation_required" : "mock_updated",
    valuationStatus: status === "blocked" ? "blocked" : "mock_updated",
    pnlStatus: status === "blocked" ? "blocked" : "placeholder_only",
    ledgerConsistencyStatus: status === "blocked" ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "deterministic",
    deterministicCalculationStatus: status === "blocked" ? "blocked" : "deterministic",
    deterministic: true,
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step153_mock_portfolio_ledger_update_core_validation_v1" }),
  };
}

export function calculateTradingLabMockPortfolioLedgerUpdateResult(input = {}, options = {}) {
  const context = getStep153MockPortfolioLedgerUpdateCoreContext(input, options);
  const ledgerCoreInputBundle = context.ledgerCoreInputBundle || {};
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCore(input, options);
  const cashBefore = roundMoney(input.cashBefore ?? ledgerCoreInputBundle.cashBeforePlaceholder, 0);
  const cashDelta = roundMoney(input.cashDelta ?? ledgerCoreInputBundle.cashDelta, 0);
  const cashAfter = roundMoney(cashBefore + cashDelta);
  const positionBefore = roundQuantity(input.positionBefore ?? ledgerCoreInputBundle.positionBeforePlaceholder, 0);
  const positionDelta = roundQuantity(input.positionDelta ?? ledgerCoreInputBundle.positionDelta, 0);
  const positionAfter = roundQuantity(positionBefore + positionDelta);
  const portfolioValueBefore = roundMoney(input.portfolioValueBefore ?? ledgerCoreInputBundle.portfolioValueBeforePlaceholder, 0);
  const mockFillPrice = Math.max(0, toFiniteNumber(input.mockFillPrice ?? ledgerCoreInputBundle.mockFillPrice, 0));
  const positionValueDelta = roundMoney(positionDelta * mockFillPrice);
  const portfolioValueAfter = roundMoney(input.portfolioValueAfter ?? ledgerCoreInputBundle.portfolioValueAfterPreview, portfolioValueBefore + cashDelta + positionValueDelta);
  const portfolioValueDelta = roundMoney(portfolioValueAfter - portfolioValueBefore);
  const realizedPnlPlaceholder = roundMoney(input.realizedPnlPlaceholder ?? ledgerCoreInputBundle.realizedPnlPlaceholder, 0);
  const unrealizedPnlPlaceholder = roundMoney(input.unrealizedPnlPlaceholder ?? ledgerCoreInputBundle.unrealizedPnlPlaceholder, 0);
  const updateStatus = validation.status === "mock_ledger_updated" ? "mock_ledger_updated" : validation.status;

  return {
    ledgerUpdateResultId: "step153_mock_portfolio_ledger_update_result",
    sourceStep: "step153",
    ledgerUpdateCoreReviewResultId: validation.ledgerUpdateCoreReviewResultId,
    ledgerUpdateCorePreflightId: validation.ledgerUpdateCorePreflightId,
    ledgerCoreInputBundleId: validation.ledgerCoreInputBundleId,
    ledgerUpdateCandidateId: validation.ledgerUpdateCandidateId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    scope: "mock_only",
    updateStatus,
    cashBefore,
    cashDelta,
    cashAfter,
    positionBefore,
    positionDelta,
    positionAfter,
    portfolioValueBefore,
    portfolioValueAfter,
    portfolioValueDelta,
    realizedPnlPlaceholder,
    unrealizedPnlPlaceholder,
    ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPortfolioLedgerUpdateCore(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioLedgerUpdateCore(input, options);
  const ledgerUpdateResult = input.ledgerUpdateResult || calculateTradingLabMockPortfolioLedgerUpdateResult({ ...input, validation }, options);

  const cashLedgerUpdateResult = {
    cashLedgerResultId: "step153_mock_cash_ledger_update_result",
    sourceStep: "step153",
    cashBefore: ledgerUpdateResult.cashBefore,
    cashDelta: ledgerUpdateResult.cashDelta,
    cashAfter: ledgerUpdateResult.cashAfter,
    cashUpdateStatus: validation.cashUpdateStatus,
    negativeCashBlocked: ledgerUpdateResult.cashAfter < 0,
    deterministic: true,
    redacted: true,
  };
  const positionLedgerUpdateResult = {
    positionLedgerResultId: "step153_mock_position_ledger_update_result",
    sourceStep: "step153",
    symbol: input.symbol || "SYMBOL_PLACEHOLDER",
    positionBefore: ledgerUpdateResult.positionBefore,
    positionDelta: ledgerUpdateResult.positionDelta,
    positionAfter: ledgerUpdateResult.positionAfter,
    positionUpdateStatus: validation.positionUpdateStatus,
    negativePositionBlocked: ledgerUpdateResult.positionAfter < 0,
    deterministic: true,
    redacted: true,
  };
  const portfolioValueUpdateResult = {
    portfolioValueResultId: "step153_mock_portfolio_value_update_result",
    sourceStep: "step153",
    portfolioValueBefore: ledgerUpdateResult.portfolioValueBefore,
    portfolioValueAfter: ledgerUpdateResult.portfolioValueAfter,
    portfolioValueDelta: ledgerUpdateResult.portfolioValueDelta,
    realizedPnlPlaceholder: ledgerUpdateResult.realizedPnlPlaceholder,
    unrealizedPnlPlaceholder: ledgerUpdateResult.unrealizedPnlPlaceholder,
    valuationStatus: validation.valuationStatus,
    deterministic: true,
    redacted: true,
  };
  const pnlPlaceholderResult = {
    pnlPlaceholderResultId: "step153_mock_pnl_placeholder_result",
    sourceStep: "step153",
    realizedPnlPlaceholder: ledgerUpdateResult.realizedPnlPlaceholder,
    unrealizedPnlPlaceholder: ledgerUpdateResult.unrealizedPnlPlaceholder,
    pnlStatus: validation.pnlStatus,
    deterministic: true,
    redacted: true,
  };

  return {
    ok: true,
    step: "Step 153: Admin trading lab mock portfolio ledger update core",
    status: "admin_only_trading_lab_mock_portfolio_ledger_update_core_fail_closed",
    sourceStep: "step153",
    mockPortfolioLedgerUpdateResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_MODEL,
    mockCashLedgerUpdateResultModel: TRADING_LAB_MOCK_CASH_LEDGER_UPDATE_RESULT_MODEL,
    mockPositionLedgerUpdateResultModel: TRADING_LAB_MOCK_POSITION_LEDGER_UPDATE_RESULT_MODEL,
    mockPortfolioValueUpdateResultModel: TRADING_LAB_MOCK_PORTFOLIO_VALUE_UPDATE_RESULT_MODEL,
    mockPnlPlaceholderResultModel: TRADING_LAB_MOCK_PNL_PLACEHOLDER_RESULT_MODEL,
    mockPortfolioLedgerUpdateResultSchema: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_SCHEMA,
    validation,
    ledgerUpdateResult,
    cashLedgerUpdateResult,
    positionLedgerUpdateResult,
    portfolioValueUpdateResult,
    pnlPlaceholderResult,
    summary: {
      summaryId: "step153_mock_portfolio_ledger_update_result_summary",
      sourceStep: "step153",
      updateStatus: ledgerUpdateResult.updateStatus,
      cashUpdateStatus: validation.cashUpdateStatus,
      positionUpdateStatus: validation.positionUpdateStatus,
      valuationStatus: validation.valuationStatus,
      pnlStatus: validation.pnlStatus,
      ledgerConsistencyStatus: validation.ledgerConsistencyStatus,
      deterministicCalculationStatus: validation.deterministicCalculationStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      deterministic: true,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_performance_recalculation_preflight",
    },
    mockHistory: [
      {
        historyId: "step153_mock_portfolio_ledger_update_result_history_1",
        sourceStep: "step153",
        status: ledgerUpdateResult.updateStatus,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_performance_recalculation_preflight",
      },
    ],
    flags: { ...STEP153_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
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
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step153_mock_portfolio_ledger_update_core_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioLedgerUpdateCore(input, options);
}

function getStep154MockPortfolioPerformanceRecalculationPreflightContext(input = {}, options = {}) {
  const hasLedgerCoreStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioLedgerUpdateCoreStatus");
  const mockPortfolioLedgerUpdateCoreStatus = hasLedgerCoreStatus
    ? input.mockPortfolioLedgerUpdateCoreStatus
    : buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus(input, options);
  const ledgerUpdateResult = input.ledgerUpdateResult
    || mockPortfolioLedgerUpdateCoreStatus?.ledgerUpdateResult
    || null;
  const cashLedgerUpdateResult = input.cashLedgerUpdateResult
    || mockPortfolioLedgerUpdateCoreStatus?.cashLedgerUpdateResult
    || {};
  const positionLedgerUpdateResult = input.positionLedgerUpdateResult
    || mockPortfolioLedgerUpdateCoreStatus?.positionLedgerUpdateResult
    || {};
  const portfolioValueUpdateResult = input.portfolioValueUpdateResult
    || mockPortfolioLedgerUpdateCoreStatus?.portfolioValueUpdateResult
    || {};
  const pnlPlaceholderResult = input.pnlPlaceholderResult
    || mockPortfolioLedgerUpdateCoreStatus?.pnlPlaceholderResult
    || {};
  const validation = input.ledgerUpdateCoreValidation
    || mockPortfolioLedgerUpdateCoreStatus?.validation
    || {};

  return {
    mockPortfolioLedgerUpdateCoreStatus,
    ledgerUpdateResult,
    cashLedgerUpdateResult,
    positionLedgerUpdateResult,
    portfolioValueUpdateResult,
    pnlPlaceholderResult,
    validation,
  };
}

export function buildTradingLabMockPerformanceRecalculationInputBundle(input = {}, options = {}) {
  const context = getStep154MockPortfolioPerformanceRecalculationPreflightContext(input, options);
  const ledgerUpdateResult = context.ledgerUpdateResult || {};
  const equityBeforePlaceholder = roundMoney(input.equityBeforePlaceholder ?? ledgerUpdateResult.portfolioValueBefore, 0);
  const equityAfterPreview = roundMoney(input.equityAfterPreview ?? ledgerUpdateResult.portfolioValueAfter, 0);
  const dailyReturnPreview = roundPct(input.dailyReturnPreview ?? safeRatio(equityAfterPreview - equityBeforePlaceholder, equityBeforePlaceholder) * 100);
  const priorEquitySeriesPlaceholder = Array.isArray(input.priorEquitySeriesPlaceholder)
    ? input.priorEquitySeriesPlaceholder.map((value) => roundMoney(value))
    : [
      roundMoney(Math.max(1, equityBeforePlaceholder * 0.985)),
      roundMoney(Math.max(1, equityBeforePlaceholder)),
      equityAfterPreview,
    ];
  const priorReturnSeriesPlaceholder = Array.isArray(input.priorReturnSeriesPlaceholder)
    ? input.priorReturnSeriesPlaceholder.map((value) => roundPct(value))
    : [0, dailyReturnPreview];

  return {
    performanceInputBundleId: "step154_mock_performance_recalculation_input_bundle",
    sourceStep: "step154",
    ledgerUpdateResultId: ledgerUpdateResult.ledgerUpdateResultId || "step154_missing_ledger_update_result",
    mockRunCandidateId: ledgerUpdateResult.mockRunCandidateId || "step154_missing_mock_run_candidate",
    strategyDraftId: ledgerUpdateResult.strategyDraftId || "step154_missing_strategy_draft",
    scope: "mock_only",
    equityBeforePlaceholder,
    equityAfterPreview,
    cashAfterPreview: roundMoney(input.cashAfterPreview ?? ledgerUpdateResult.cashAfter, 0),
    positionAfterPreview: roundQuantity(input.positionAfterPreview ?? ledgerUpdateResult.positionAfter, 0),
    portfolioValueAfterPreview: roundMoney(input.portfolioValueAfterPreview ?? equityAfterPreview, 0),
    realizedPnlPlaceholder: roundMoney(input.realizedPnlPlaceholder ?? ledgerUpdateResult.realizedPnlPlaceholder, 0),
    unrealizedPnlPlaceholder: roundMoney(input.unrealizedPnlPlaceholder ?? ledgerUpdateResult.unrealizedPnlPlaceholder, 0),
    priorEquitySeriesPlaceholder,
    priorReturnSeriesPlaceholder,
    mockCalendarRef: "static_mock_calendar",
    mockBenchmarkRef: "static_mock_benchmark",
    mockValuationPolicy: "static_mock_series_only",
    deterministic: true,
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    redaction: makeLabRedaction({ schema: "step154_mock_performance_recalculation_input_bundle_v1" }),
  };
}

export function buildTradingLabMockPerformanceRecalculationScenario(input = {}) {
  return {
    scenarioId: input.scenarioId || "step154_mock_performance_recalculation_scenario",
    sourceStep: "step154",
    scenarioName: input.scenarioName || "Mock portfolio performance recalculation readiness",
    scope: "mock_only",
    recalculationMode: "equity_return_allocation_preview",
    equityPolicy: "static_mock_equity_series_only",
    returnPolicy: "deterministic_mock_return_preview",
    drawdownPolicy: "deterministic_mock_drawdown_preview",
    allocationPolicy: "mock_allocation_preview_only",
    kpiPolicy: "mock_kpi_summary_preview_only",
    chartDataPolicy: "mock_chart_data_dependency_preview_only",
    deterministic: true,
    redacted: true,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockPortfolioPerformanceRecalculationPreflight(input = {}, options = {}) {
  const context = getStep154MockPortfolioPerformanceRecalculationPreflightContext(input, options);
  const ledgerUpdateResult = context.ledgerUpdateResult || {};
  const bundle = input.performanceInputBundle || buildTradingLabMockPerformanceRecalculationInputBundle(input, options);
  const scenario = input.performanceScenario || buildTradingLabMockPerformanceRecalculationScenario(input);
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioLedgerUpdateCoreStatus) blockers.push("mock_portfolio_ledger_update_core_status_missing");
  if (!context.ledgerUpdateResult) blockers.push("mock_portfolio_ledger_update_result_missing");
  if (ledgerUpdateResult.redacted !== true) blockers.push("mock_portfolio_ledger_update_result_not_redacted");
  if (ledgerUpdateResult.scope !== "mock_only") blockers.push("mock_portfolio_ledger_update_result_scope_not_mock_only");
  const ledgerUpdateResultStatus = ledgerUpdateResult.updateStatus;
  if (!["mock_ledger_updated", "blocked"].includes(ledgerUpdateResultStatus)) {
    blockers.push("mock_portfolio_ledger_update_result_not_ready");
  }
  if (ledgerUpdateResult.readinessImpact !== "none") blockers.push("ledger_update_result_readiness_impact_not_none");
  if (ledgerUpdateResult.providerCallImpact !== "blocked") blockers.push("ledger_update_result_provider_call_impact_not_blocked");
  if (ledgerUpdateResult.orderSubmissionImpact !== "blocked") blockers.push("ledger_update_result_order_submission_impact_not_blocked");
  if (ledgerUpdateResult.liveTradingImpact !== "blocked") blockers.push("ledger_update_result_live_trading_impact_not_blocked");
  if (ledgerUpdateResult.actualLedgerEntryCreated !== false || ledgerUpdateResult.actualPortfolioLedgerUpdated !== false) blockers.push("actual_ledger_update_must_not_run");
  if (ledgerUpdateResult.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (ledgerUpdateResult.actualCashUpdated !== false || ledgerUpdateResult.actualPositionUpdated !== false) blockers.push("actual_cash_position_update_must_not_run");
  if (ledgerUpdateResult.persistentStorageUsed !== false || ledgerUpdateResult.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (bundle.redacted !== true || bundle.scope !== "mock_only") blockers.push("mock_performance_input_bundle_not_redacted_or_mock_only");
  if (scenario.redacted !== true || scenario.scope !== "mock_only") blockers.push("mock_performance_scenario_not_redacted_or_mock_only");
  if (bundle.kisOrderPayloadCreated !== false || bundle.kisExecutionPayloadCreated !== false || bundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (bundle.actualPerformanceRecordUpdated !== false) blockers.push("actual_performance_record_must_not_update");
  if (bundle.actualCashUpdated !== false || bundle.actualPositionUpdated !== false || bundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_cash_position_or_ledger_update_must_not_run");
  if (bundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run_from_bundle");
  if (bundle.persistentStorageUsed !== false || bundle.dbWriteUsed !== false) blockers.push("bundle_persistent_db_write_must_not_run");
  if (containsUnsafeReviewResultInput(input.performanceInput || input.performanceRecalculationInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const equityBefore = toFiniteNumber(bundle.equityBeforePlaceholder, 0);
  const equityAfter = toFiniteNumber(bundle.equityAfterPreview, 0);
  const dailyReturnPreview = roundPct(safeRatio(equityAfter - equityBefore, equityBefore) * 100);
  const equitySeries = Array.isArray(bundle.priorEquitySeriesPlaceholder) ? bundle.priorEquitySeriesPlaceholder : [];
  const returnSeries = Array.isArray(bundle.priorReturnSeriesPlaceholder) ? bundle.priorReturnSeriesPlaceholder : [];

  if (equityAfter < 0 || equityBefore < 0) warnings.push("mock_equity_preview_negative");
  if (equityBefore <= 0) warnings.push("mock_prior_equity_missing_or_zero");
  if (!Number.isFinite(dailyReturnPreview) || Math.abs(dailyReturnPreview) > 100) warnings.push("mock_daily_return_preview_invalid");
  if (equitySeries.length < 2) warnings.push("mock_equity_series_dependency_missing");
  if (returnSeries.length < 1) warnings.push("mock_return_series_dependency_missing");
  if (bundle.portfolioValueAfterPreview < 0) warnings.push("mock_portfolio_value_preview_negative");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0
    ? "blocked"
    : uniqueWarnings.length > 0
      ? "validation_required"
      : "mock_performance_recalculation_ready";
  const readyStatus = status === "blocked" ? "blocked" : status === "validation_required" ? "validation_required" : "ready";
  const placeholderStatus = status === "blocked" ? "blocked" : status === "validation_required" ? "validation_required" : "placeholder_only";

  return {
    validationId: "step154_mock_performance_recalculation_preflight_validation",
    sourceStep: "step154",
    status,
    performanceInputBundleId: bundle.performanceInputBundleId,
    ledgerUpdateResultId: ledgerUpdateResult.ledgerUpdateResultId || bundle.ledgerUpdateResultId || "step154_missing_ledger_update_result",
    ledgerUpdateCoreReviewResultId: ledgerUpdateResult.ledgerUpdateCoreReviewResultId || "step154_missing_ledger_update_core_review_result",
    mockFillResultId: ledgerUpdateResult.mockFillResultId || "step154_missing_mock_fill_result",
    mockRunCandidateId: ledgerUpdateResult.mockRunCandidateId || bundle.mockRunCandidateId || "step154_missing_mock_run_candidate",
    strategyDraftId: ledgerUpdateResult.strategyDraftId || bundle.strategyDraftId || "step154_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    equitySeriesStatus: readyStatus,
    dailyReturnStatus: readyStatus,
    cumulativeReturnStatus: readyStatus,
    drawdownStatus: readyStatus,
    mddStatus: readyStatus,
    allocationStatus: readyStatus,
    realizedPnlStatus: placeholderStatus,
    unrealizedPnlStatus: placeholderStatus,
    kpiSummaryStatus: readyStatus,
    chartDataStatus: readyStatus,
    dependencyStatus: status === "blocked" ? "blocked" : status === "validation_required" ? "validation_required" : "satisfied",
    dailyReturnPreview,
    cumulativeReturnPreview: roundPct((returnSeries.reduce((sum, value) => sum + toFiniteNumber(value), 0) + dailyReturnPreview)),
    drawdownPreview: roundPct(Math.min(0, safeRatio(equityAfter - Math.max(...equitySeries, equityAfter), Math.max(...equitySeries, equityAfter)) * 100)),
    deterministic: true,
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
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    redaction: makeLabRedaction({ schema: "step154_mock_performance_recalculation_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationPreflight(input = {}, options = {}) {
  const performanceInputBundle = input.performanceInputBundle || buildTradingLabMockPerformanceRecalculationInputBundle(input, options);
  const performanceScenario = input.performanceScenario || buildTradingLabMockPerformanceRecalculationScenario(input);
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationPreflight(
    { ...input, performanceInputBundle, performanceScenario },
    options,
  );
  const result = {
    performanceRecalculationPreflightId: "step154_mock_portfolio_performance_recalculation_preflight",
    sourceStep: "step154",
    performanceInputBundleId: performanceInputBundle.performanceInputBundleId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    ledgerUpdateCoreReviewResultId: validation.ledgerUpdateCoreReviewResultId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    equitySeriesStatus: validation.equitySeriesStatus,
    dailyReturnStatus: validation.dailyReturnStatus,
    cumulativeReturnStatus: validation.cumulativeReturnStatus,
    drawdownStatus: validation.drawdownStatus,
    mddStatus: validation.mddStatus,
    allocationStatus: validation.allocationStatus,
    realizedPnlStatus: validation.realizedPnlStatus,
    unrealizedPnlStatus: validation.unrealizedPnlStatus,
    kpiSummaryStatus: validation.kpiSummaryStatus,
    chartDataStatus: validation.chartDataStatus,
    dependencyStatus: validation.dependencyStatus,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    equityAfterPreview: performanceInputBundle.equityAfterPreview,
    dailyReturnPreview: validation.dailyReturnPreview,
    cumulativeReturnPreview: validation.cumulativeReturnPreview,
    drawdownPreview: validation.drawdownPreview,
    allocationPreview: {
      allocationPreviewId: "step154_mock_allocation_preview",
      sourceStep: "step154",
      cashAfterPreview: performanceInputBundle.cashAfterPreview,
      positionAfterPreview: performanceInputBundle.positionAfterPreview,
      portfolioValueAfterPreview: performanceInputBundle.portfolioValueAfterPreview,
      allocationStatus: validation.allocationStatus,
      redacted: true,
    },
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_portfolio_performance_recalculation_review_result",
  };

  return {
    ok: true,
    step: "Step 154: Admin trading lab mock portfolio performance recalculation preflight",
    status: "admin_only_trading_lab_mock_portfolio_performance_recalculation_preflight_fail_closed",
    sourceStep: "step154",
    mockPortfolioPerformanceRecalculationPreflightModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_MODEL,
    mockPerformanceRecalculationInputBundleModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_INPUT_BUNDLE_MODEL,
    mockPerformanceRecalculationScenarioModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_SCENARIO_MODEL,
    mockPerformanceRecalculationPreflightResultSchema: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_PREFLIGHT_RESULT_SCHEMA,
    performanceInputBundle,
    performanceScenario,
    validation,
    result,
    summary: {
      summaryId: "step154_mock_performance_recalculation_preflight_summary",
      sourceStep: "step154",
      status: result.status,
      equitySeriesStatus: result.equitySeriesStatus,
      dailyReturnStatus: result.dailyReturnStatus,
      cumulativeReturnStatus: result.cumulativeReturnStatus,
      drawdownStatus: result.drawdownStatus,
      mddStatus: result.mddStatus,
      allocationStatus: result.allocationStatus,
      kpiSummaryStatus: result.kpiSummaryStatus,
      chartDataStatus: result.chartDataStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      deterministic: true,
      redacted: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_performance_recalculation_review_result",
    },
    mockHistory: [
      {
        historyId: "step154_mock_performance_recalculation_preflight_history_1",
        sourceStep: "step154",
        status: result.status,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_performance_recalculation_review_result",
      },
    ],
    flags: { ...STEP154_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordUpdated: false,
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
      actualPerformanceRecordUpdateAllowed: false,
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step154_mock_portfolio_performance_recalculation_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioPerformanceRecalculationPreflight(input, options);
}

function mapPerformanceRecalculationReviewStatus(status) {
  if (["ready", "placeholder_only", "satisfied", "mock_performance_recalculation_ready"].includes(status)) return "reviewed";
  if (status === "blocked") return "blocked";
  return "validation_required";
}

function getStep155MockPortfolioPerformanceRecalculationReviewContext(input = {}, options = {}) {
  const hasPreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioPerformanceRecalculationPreflightStatus");
  const mockPortfolioPerformanceRecalculationPreflightStatus = hasPreflightStatus
    ? input.mockPortfolioPerformanceRecalculationPreflightStatus
    : buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus(input, options);
  const result = input.performanceRecalculationPreflightResult
    || mockPortfolioPerformanceRecalculationPreflightStatus?.result
    || null;
  const performanceInputBundle = input.performanceInputBundle
    || mockPortfolioPerformanceRecalculationPreflightStatus?.performanceInputBundle
    || null;
  const validation = input.performanceRecalculationPreflightValidation
    || mockPortfolioPerformanceRecalculationPreflightStatus?.validation
    || {};
  const summary = input.performanceRecalculationPreflightSummary
    || mockPortfolioPerformanceRecalculationPreflightStatus?.summary
    || {};

  return {
    mockPortfolioPerformanceRecalculationPreflightStatus,
    result,
    performanceInputBundle,
    validation,
    summary,
  };
}

export function validateTradingLabMockPortfolioPerformanceRecalculationReviewResult(input = {}, options = {}) {
  const context = getStep155MockPortfolioPerformanceRecalculationReviewContext(input, options);
  const result = context.result || {};
  const bundle = context.performanceInputBundle || {};
  const validation = context.validation || {};
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioPerformanceRecalculationPreflightStatus) blockers.push("mock_performance_recalculation_preflight_status_missing");
  if (!context.result) blockers.push("mock_performance_recalculation_preflight_result_missing");
  if (!context.performanceInputBundle) blockers.push("mock_performance_recalculation_input_bundle_missing");
  if (result.redacted !== true) blockers.push("mock_performance_recalculation_preflight_result_not_redacted");
  if (result.scope !== "mock_only") blockers.push("mock_performance_recalculation_preflight_scope_not_mock_only");
  if (bundle.redacted !== true) blockers.push("mock_performance_recalculation_input_bundle_not_redacted");
  if (bundle.scope !== "mock_only") blockers.push("mock_performance_recalculation_input_bundle_scope_not_mock_only");
  if (result.readinessImpact !== "none") blockers.push("performance_recalculation_readiness_impact_not_none");
  if (result.providerCallImpact !== "blocked") blockers.push("performance_recalculation_provider_call_impact_not_blocked");
  if (result.orderSubmissionImpact !== "blocked") blockers.push("performance_recalculation_order_submission_impact_not_blocked");
  if (result.liveTradingImpact !== "blocked") blockers.push("performance_recalculation_live_trading_impact_not_blocked");
  if (result.nextAllowedStep && result.nextAllowedStep !== "mock_portfolio_performance_recalculation_review_result") blockers.push("performance_recalculation_next_step_not_review_result");
  if (result.status === "blocked" || validation.status === "blocked") blockers.push("mock_performance_recalculation_preflight_blocked");
  if (result.status === "validation_required" || validation.status === "validation_required") warnings.push("mock_performance_recalculation_preflight_validation_required");
  if (bundle.actualPerformanceRecordUpdated !== false) blockers.push("actual_performance_record_must_not_update");
  if (bundle.actualCashUpdated !== false || bundle.actualPositionUpdated !== false) blockers.push("actual_cash_position_update_must_not_run");
  if (bundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (bundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (bundle.persistentStorageUsed !== false || bundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (bundle.kisOrderPayloadCreated !== false || bundle.kisExecutionPayloadCreated !== false || bundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (context.mockPortfolioPerformanceRecalculationPreflightStatus?.actualPerformanceRecordUpdated !== false) blockers.push("status_actual_performance_record_must_not_update");
  if (context.mockPortfolioPerformanceRecalculationPreflightStatus?.actualPortfolioLedgerUpdated !== false) blockers.push("status_actual_portfolio_ledger_update_must_not_run");
  if (context.mockPortfolioPerformanceRecalculationPreflightStatus?.actualCashUpdated !== false || context.mockPortfolioPerformanceRecalculationPreflightStatus?.actualPositionUpdated !== false) blockers.push("status_actual_cash_position_update_must_not_run");
  if (context.mockPortfolioPerformanceRecalculationPreflightStatus?.persistentStorageUsed !== false || context.mockPortfolioPerformanceRecalculationPreflightStatus?.dbWriteUsed !== false) blockers.push("status_persistent_db_write_must_not_run");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.performanceRecalculationReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const equityAfter = toFiniteNumber(result.equityAfterPreview ?? bundle.equityAfterPreview, 0);
  const dailyReturnPreview = toFiniteNumber(result.dailyReturnPreview ?? validation.dailyReturnPreview, 0);
  const cumulativeReturnPreview = toFiniteNumber(result.cumulativeReturnPreview ?? validation.cumulativeReturnPreview, 0);
  const drawdownPreview = toFiniteNumber(result.drawdownPreview ?? validation.drawdownPreview, 0);

  if (equityAfter < 0) warnings.push("mock_equity_preview_negative");
  if (!Number.isFinite(dailyReturnPreview) || Math.abs(dailyReturnPreview) > 100) warnings.push("mock_daily_return_preview_invalid");
  if (!Number.isFinite(cumulativeReturnPreview) || Math.abs(cumulativeReturnPreview) > 1000) warnings.push("mock_cumulative_return_preview_invalid");
  if (!Number.isFinite(drawdownPreview) || drawdownPreview > 0 || drawdownPreview < -100) warnings.push("mock_drawdown_preview_invalid");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";

  return {
    validationId: "step155_mock_portfolio_performance_recalculation_review_result_validation",
    sourceStep: "step155",
    status,
    performanceRecalculationPreflightId: result.performanceRecalculationPreflightId || "step155_missing_performance_recalculation_preflight",
    performanceInputBundleId: result.performanceInputBundleId || bundle.performanceInputBundleId || "step155_missing_performance_input_bundle",
    ledgerUpdateResultId: result.ledgerUpdateResultId || bundle.ledgerUpdateResultId || "step155_missing_ledger_update_result",
    mockRunCandidateId: result.mockRunCandidateId || bundle.mockRunCandidateId || "step155_missing_mock_run_candidate",
    strategyDraftId: result.strategyDraftId || bundle.strategyDraftId || "step155_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    equitySeriesReviewStatus: mapPerformanceRecalculationReviewStatus(result.equitySeriesStatus || validation.equitySeriesStatus),
    dailyReturnReviewStatus: mapPerformanceRecalculationReviewStatus(result.dailyReturnStatus || validation.dailyReturnStatus),
    cumulativeReturnReviewStatus: mapPerformanceRecalculationReviewStatus(result.cumulativeReturnStatus || validation.cumulativeReturnStatus),
    drawdownReviewStatus: mapPerformanceRecalculationReviewStatus(result.drawdownStatus || validation.drawdownStatus),
    mddReviewStatus: mapPerformanceRecalculationReviewStatus(result.mddStatus || validation.mddStatus),
    allocationReviewStatus: mapPerformanceRecalculationReviewStatus(result.allocationStatus || validation.allocationStatus),
    realizedPnlReviewStatus: mapPerformanceRecalculationReviewStatus(result.realizedPnlStatus || validation.realizedPnlStatus),
    unrealizedPnlReviewStatus: mapPerformanceRecalculationReviewStatus(result.unrealizedPnlStatus || validation.unrealizedPnlStatus),
    kpiSummaryReviewStatus: mapPerformanceRecalculationReviewStatus(result.kpiSummaryStatus || validation.kpiSummaryStatus),
    chartDataReviewStatus: mapPerformanceRecalculationReviewStatus(result.chartDataStatus || validation.chartDataStatus),
    dependencyReviewStatus: context.result ? mapPerformanceRecalculationReviewStatus(result.dependencyStatus || validation.dependencyStatus) : "blocked",
    equityAfterPreview: equityAfter,
    dailyReturnPreview,
    cumulativeReturnPreview,
    drawdownPreview,
    deterministic: true,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step155_mock_performance_recalculation_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationReviewResult(input, options);
  const reviewStatus = validation.status === "recorded" ? "recorded" : validation.status;
  const decision = reviewStatus === "recorded" ? "mock_performance_recalculation_review_recorded" : reviewStatus === "validation_required" ? "rejected" : "blocked";

  return {
    performanceRecalculationReviewResultId: "step155_mock_portfolio_performance_recalculation_review_result",
    sourceStep: "step155",
    performanceRecalculationPreflightId: validation.performanceRecalculationPreflightId,
    performanceInputBundleId: validation.performanceInputBundleId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus,
    decision,
    reviewedAt: "placeholder_reviewed_at",
    reviewedBy: "admin_placeholder",
    summary: [
      "FINPLE internal mock performance recalculation review only",
      "not an actual investment performance confirmation",
      "not an actual account performance result",
      "no actual performance record update",
      "no persistent DB write",
      "no real cash, position, or portfolio ledger update",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockers: validation.blockers,
    warnings: validation.warnings,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPerformanceRecalculationReviewSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationReviewResult(input, options);

  return {
    summaryId: "step155_mock_performance_recalculation_review_summary",
    sourceStep: "step155",
    equitySeriesReviewStatus: validation.equitySeriesReviewStatus,
    dailyReturnReviewStatus: validation.dailyReturnReviewStatus,
    cumulativeReturnReviewStatus: validation.cumulativeReturnReviewStatus,
    drawdownReviewStatus: validation.drawdownReviewStatus,
    mddReviewStatus: validation.mddReviewStatus,
    allocationReviewStatus: validation.allocationReviewStatus,
    realizedPnlReviewStatus: validation.realizedPnlReviewStatus,
    unrealizedPnlReviewStatus: validation.unrealizedPnlReviewStatus,
    kpiSummaryReviewStatus: validation.kpiSummaryReviewStatus,
    chartDataReviewStatus: validation.chartDataReviewStatus,
    dependencyReviewStatus: validation.dependencyReviewStatus,
    reviewSummary: [
      "equity series review uses mock-only preflight values",
      "daily and cumulative return review is deterministic",
      "drawdown and MDD review is deterministic",
      "allocation review is mock-only",
      "KPI and chart data review does not confirm actual investment performance",
      "no real account balance or DB performance update is performed",
    ],
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    deterministic: true,
    redacted: true,
  };
}

export function buildTradingLabMockPerformanceRecalculationReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationReviewResult(input, options);
  const decision = validation.status === "recorded" ? "mock_performance_recalculation_review_recorded" : validation.status === "validation_required" ? "rejected" : "blocked";

  return {
    summaryId: "step155_mock_performance_recalculation_review_decision_summary",
    sourceStep: "step155",
    decision,
    decisionSummary: [
      "mock performance recalculation review recorded",
      "FINPLE internal mock performance recalculation review only",
      "not an actual investment performance confirmation",
      "no actual performance record update",
      "no persistent DB write",
      "no real cash, position, or portfolio ledger update",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    externalOrderAuthorityRequired: true,
    actualPerformanceRecordUpdateAllowed: false,
    actualLedgerUpdateAllowed: false,
    actualCashUpdateAllowed: false,
    actualPositionUpdateAllowed: false,
    persistentDbWriteAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationReviewResultRecordingGate(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockPortfolioPerformanceRecalculationReviewResult({ ...input, validation }, options);
  const reviewSummary = input.reviewSummary || buildTradingLabMockPerformanceRecalculationReviewSummary({ ...input, validation }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockPerformanceRecalculationReviewDecisionSummary({ ...input, validation }, options);

  return {
    ok: true,
    step: "Step 155: Admin trading lab mock portfolio performance recalculation review result recording gate",
    status: "admin_only_trading_lab_mock_portfolio_performance_recalculation_review_result_fail_closed",
    sourceStep: "step155",
    mockPortfolioPerformanceRecalculationReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_MODEL,
    mockPerformanceRecalculationReviewReceiptSchema: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_RECEIPT_SCHEMA,
    mockPerformanceRecalculationReviewDecisionSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_DECISION_SUMMARY_MODEL,
    mockPerformanceRecalculationReviewSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_SUMMARY_MODEL,
    validation,
    reviewResult,
    reviewSummary,
    decisionSummary,
    receipt: {
      receiptId: "step155_mock_performance_recalculation_review_receipt",
      sourceStep: "step155",
      performanceRecalculationReviewResultId: reviewResult.performanceRecalculationReviewResultId,
      performanceRecalculationPreflightId: reviewResult.performanceRecalculationPreflightId,
      performanceInputBundleId: reviewResult.performanceInputBundleId,
      reviewStatus: reviewResult.reviewStatus,
      decision: reviewResult.decision,
      redacted: true,
      recordedAt: "placeholder_recorded_at",
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      equitySeriesReviewStatus: validation.equitySeriesReviewStatus,
      dailyReturnReviewStatus: validation.dailyReturnReviewStatus,
      cumulativeReturnReviewStatus: validation.cumulativeReturnReviewStatus,
      drawdownReviewStatus: validation.drawdownReviewStatus,
      mddReviewStatus: validation.mddReviewStatus,
      allocationReviewStatus: validation.allocationReviewStatus,
      realizedPnlReviewStatus: validation.realizedPnlReviewStatus,
      unrealizedPnlReviewStatus: validation.unrealizedPnlReviewStatus,
      kpiSummaryReviewStatus: validation.kpiSummaryReviewStatus,
      chartDataReviewStatus: validation.chartDataReviewStatus,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_performance_recalculation_core",
    },
    mockHistory: [
      {
        historyId: "step155_mock_performance_recalculation_review_history_1",
        sourceStep: "step155",
        status: reviewResult.reviewStatus,
        decision: reviewResult.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_performance_recalculation_core",
      },
    ],
    flags: { ...STEP155_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordUpdated: false,
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
      actualPerformanceRecordUpdateAllowed: false,
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step155_mock_portfolio_performance_recalculation_review_result_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioPerformanceRecalculationReviewResultRecordingGate(input, options);
}

function mapPerformanceCorePolicyStatus(status) {
  if (["recorded", "reviewed", "ready", "placeholder_only", "satisfied", "mock_performance_core_ready"].includes(status)) return "ready";
  if (status === "blocked") return "blocked";
  return "validation_required";
}

function getStep156MockPortfolioPerformanceCorePreflightContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioPerformanceRecalculationReviewResultStatus");
  const mockPortfolioPerformanceRecalculationReviewResultStatus = hasReviewStatus
    ? input.mockPortfolioPerformanceRecalculationReviewResultStatus
    : buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus(input, options);
  const reviewResult = input.performanceRecalculationReviewResult
    || mockPortfolioPerformanceRecalculationReviewResultStatus?.reviewResult
    || null;
  const receipt = input.performanceRecalculationReviewReceipt
    || mockPortfolioPerformanceRecalculationReviewResultStatus?.receipt
    || null;
  const reviewValidation = input.performanceRecalculationReviewValidation
    || mockPortfolioPerformanceRecalculationReviewResultStatus?.validation
    || {};
  const sourcePerformanceInputBundle = input.performanceInputBundle
    || buildTradingLabMockPerformanceRecalculationInputBundle(input, options);

  return {
    mockPortfolioPerformanceRecalculationReviewResultStatus,
    reviewResult,
    receipt,
    reviewValidation,
    sourcePerformanceInputBundle,
  };
}

export function buildTradingLabMockPerformanceCoreInputBundle(input = {}, options = {}) {
  const context = getStep156MockPortfolioPerformanceCorePreflightContext(input, options);
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const sourceBundle = context.sourcePerformanceInputBundle || {};
  const reviewValidation = context.reviewValidation || {};

  return {
    performanceCoreInputBundleId: "step156_mock_performance_core_input_bundle",
    sourceStep: "step156",
    performanceRecalculationReviewResultId: reviewResult.performanceRecalculationReviewResultId || receipt.performanceRecalculationReviewResultId || "step156_missing_performance_recalculation_review_result",
    performanceInputBundleId: reviewResult.performanceInputBundleId || receipt.performanceInputBundleId || sourceBundle.performanceInputBundleId || "step156_missing_performance_input_bundle",
    ledgerUpdateResultId: reviewResult.ledgerUpdateResultId || sourceBundle.ledgerUpdateResultId || "step156_missing_ledger_update_result",
    mockRunCandidateId: reviewResult.mockRunCandidateId || sourceBundle.mockRunCandidateId || "step156_missing_mock_run_candidate",
    strategyDraftId: reviewResult.strategyDraftId || sourceBundle.strategyDraftId || "step156_missing_strategy_draft",
    scope: "mock_only",
    coreInputBundleStatus: "mock_only",
    equityBeforePlaceholder: toFiniteNumber(sourceBundle.equityBeforePlaceholder, 1000000),
    equityAfterPreview: toFiniteNumber(input.equityAfterPreview ?? reviewValidation.equityAfterPreview ?? sourceBundle.equityAfterPreview, 1000000),
    cashAfterPreview: toFiniteNumber(sourceBundle.cashAfterPreview, 120000),
    positionAfterPreview: toFiniteNumber(sourceBundle.positionAfterPreview, 880000),
    portfolioValueAfterPreview: toFiniteNumber(sourceBundle.portfolioValueAfterPreview, 1000000),
    realizedPnlPlaceholder: toFiniteNumber(sourceBundle.realizedPnlPlaceholder, 0),
    unrealizedPnlPlaceholder: toFiniteNumber(sourceBundle.unrealizedPnlPlaceholder, 0),
    priorEquitySeriesPlaceholder: Array.isArray(sourceBundle.priorEquitySeriesPlaceholder) && sourceBundle.priorEquitySeriesPlaceholder.length > 0
      ? sourceBundle.priorEquitySeriesPlaceholder
      : [960000, 980000, 1000000],
    priorReturnSeriesPlaceholder: Array.isArray(sourceBundle.priorReturnSeriesPlaceholder) && sourceBundle.priorReturnSeriesPlaceholder.length > 0
      ? sourceBundle.priorReturnSeriesPlaceholder
      : [0, 2.0833, 2.0408],
    priorDrawdownSeriesPlaceholder: Array.isArray(sourceBundle.priorDrawdownSeriesPlaceholder) && sourceBundle.priorDrawdownSeriesPlaceholder.length > 0
      ? sourceBundle.priorDrawdownSeriesPlaceholder
      : [0, -1.2, -0.4],
    priorAllocationSnapshotPlaceholder: Array.isArray(sourceBundle.priorAllocationSnapshotPlaceholder) && sourceBundle.priorAllocationSnapshotPlaceholder.length > 0
      ? sourceBundle.priorAllocationSnapshotPlaceholder
      : [
        { symbol: "MOCK_QQQ", weightPct: 45, status: "mock_only" },
        { symbol: "MOCK_SCHD", weightPct: 35, status: "mock_only" },
        { symbol: "CASH", weightPct: 20, status: "mock_only" },
      ],
    mockCalendarRef: "static_mock_calendar",
    mockBenchmarkRef: "static_mock_benchmark",
    mockValuationPolicy: "static_mock_series_only",
    mockReturnPolicy: "deterministic_mock_return_preview",
    mockDrawdownPolicy: "deterministic_mock_drawdown_preview",
    mockAllocationPolicy: "mock_allocation_preview_only",
    mockKpiPolicy: "mock_kpi_summary_preview_only",
    mockChartDataPolicy: "mock_chart_data_preview_only",
    deterministic: true,
    redacted: true,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    accountIdentifierStored: false,
    credentialStored: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    actualPortfolioLedgerUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPerformanceCoreScenario(input = {}, options = {}) {
  return {
    scenarioId: "step156_mock_performance_core_scenario",
    sourceStep: "step156",
    scenarioName: "Mock portfolio performance recalculation core readiness",
    scope: "mock_only",
    recalculationMode: "equity_return_drawdown_allocation_kpi_chart_preview",
    equityPolicy: "static_mock_equity_series_only",
    returnPolicy: "deterministic_mock_return_preview",
    cumulativeReturnPolicy: "deterministic_mock_cumulative_return_preview",
    drawdownPolicy: "deterministic_mock_drawdown_preview",
    mddPolicy: "deterministic_mock_mdd_preview",
    allocationPolicy: "mock_allocation_preview_only",
    kpiPolicy: "mock_kpi_summary_preview_only",
    chartDataPolicy: "mock_chart_data_preview_only",
    deterministic: true,
    redacted: true,
    actualPerformanceConfirmation: false,
    investmentAdvice: false,
    returnGuarantee: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
}

export function validateTradingLabMockPortfolioPerformanceRecalculationCorePreflight(input = {}, options = {}) {
  const context = getStep156MockPortfolioPerformanceCorePreflightContext(input, options);
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const bundle = input.performanceCoreInputBundle || buildTradingLabMockPerformanceCoreInputBundle(input, options);
  const scenario = input.performanceCoreScenario || buildTradingLabMockPerformanceCoreScenario(input, options);
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioPerformanceRecalculationReviewResultStatus) blockers.push("mock_performance_recalculation_review_result_status_missing");
  if (!context.reviewResult) blockers.push("mock_performance_recalculation_review_result_missing");
  if (!context.receipt) blockers.push("mock_performance_recalculation_review_receipt_missing");
  if (reviewResult.redacted !== true) blockers.push("mock_performance_recalculation_review_result_not_redacted");
  if (receipt.redacted !== true) blockers.push("mock_performance_recalculation_review_receipt_not_redacted");
  if (reviewResult.reviewStatus !== "recorded") blockers.push("mock_performance_recalculation_review_not_recorded");
  if (reviewResult.decision !== "mock_performance_recalculation_review_recorded") blockers.push("mock_performance_recalculation_review_decision_not_recorded");
  if (receipt.nextAllowedStep && receipt.nextAllowedStep !== "mock_portfolio_performance_recalculation_core") blockers.push("mock_performance_recalculation_review_next_step_not_core");
  if (reviewResult.readinessImpact !== "none" || receipt.readinessImpact !== "none") blockers.push("performance_core_readiness_impact_not_none");
  if (reviewResult.providerCallImpact !== "blocked" || receipt.providerCallImpact !== "blocked") blockers.push("performance_core_provider_call_impact_not_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked" || receipt.orderSubmissionImpact !== "blocked") blockers.push("performance_core_order_submission_impact_not_blocked");
  if (reviewResult.liveTradingImpact !== "blocked" || receipt.liveTradingImpact !== "blocked") blockers.push("performance_core_live_trading_impact_not_blocked");
  if (bundle.redacted !== true) blockers.push("mock_performance_core_input_bundle_not_redacted");
  if (bundle.scope !== "mock_only") blockers.push("mock_performance_core_input_bundle_scope_not_mock_only");
  if (scenario.redacted !== true) blockers.push("mock_performance_core_scenario_not_redacted");
  if (scenario.scope !== "mock_only") blockers.push("mock_performance_core_scenario_scope_not_mock_only");
  if (bundle.actualPerformanceRecordCreated !== false || bundle.actualPerformanceRecordUpdated !== false) blockers.push("actual_performance_record_must_not_change");
  if (bundle.actualCashUpdated !== false || bundle.actualPositionUpdated !== false) blockers.push("actual_cash_position_update_must_not_run");
  if (bundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (bundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (bundle.persistentStorageUsed !== false || bundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (bundle.kisOrderPayloadCreated !== false || bundle.kisExecutionPayloadCreated !== false || bundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (containsUnsafeReviewResultInput(input.performanceCoreInput || input.performanceCoreReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  for (const [key, value] of Object.entries({
    mockValuationPolicy: bundle.mockValuationPolicy,
    mockReturnPolicy: bundle.mockReturnPolicy,
    mockDrawdownPolicy: bundle.mockDrawdownPolicy,
    mockAllocationPolicy: bundle.mockAllocationPolicy,
    mockKpiPolicy: bundle.mockKpiPolicy,
    mockChartDataPolicy: bundle.mockChartDataPolicy,
    equityPolicy: scenario.equityPolicy,
    returnPolicy: scenario.returnPolicy,
    cumulativeReturnPolicy: scenario.cumulativeReturnPolicy,
    drawdownPolicy: scenario.drawdownPolicy,
    mddPolicy: scenario.mddPolicy,
    allocationPolicy: scenario.allocationPolicy,
    kpiPolicy: scenario.kpiPolicy,
    chartDataPolicy: scenario.chartDataPolicy,
  })) {
    if (!value || !String(value).includes("mock")) blockers.push(`${key}_missing_or_not_mock_policy`);
  }
  if (scenario.deterministic !== true || bundle.deterministic !== true) blockers.push("performance_core_deterministic_policy_missing");

  const equityAfter = toFiniteNumber(bundle.equityAfterPreview, 0);
  const equityBefore = toFiniteNumber(bundle.equityBeforePlaceholder, 0);
  const dailyReturnPreview = equityBefore > 0 ? ((equityAfter - equityBefore) / equityBefore) * 100 : toFiniteNumber(input.dailyReturnPreview, 0);
  const priorReturns = Array.isArray(bundle.priorReturnSeriesPlaceholder) ? bundle.priorReturnSeriesPlaceholder.map((value) => toFiniteNumber(value, 0)) : [];
  const cumulativeReturnPreview = priorReturns.reduce((acc, value) => ((1 + acc / 100) * (1 + value / 100) - 1) * 100, dailyReturnPreview);
  const drawdownPreview = toFiniteNumber(input.drawdownPreview ?? (equityAfter >= equityBefore ? 0 : ((equityAfter - equityBefore) / equityBefore) * 100), 0);
  const priorDrawdowns = Array.isArray(bundle.priorDrawdownSeriesPlaceholder) ? bundle.priorDrawdownSeriesPlaceholder.map((value) => toFiniteNumber(value, 0)) : [];
  const mddPreview = Math.min(drawdownPreview, ...priorDrawdowns, 0);
  const allocationPreview = Array.isArray(bundle.priorAllocationSnapshotPlaceholder) ? bundle.priorAllocationSnapshotPlaceholder : [];

  if (equityAfter < 0) warnings.push("mock_equity_preview_negative");
  if (!Number.isFinite(dailyReturnPreview) || Math.abs(dailyReturnPreview) > 100) warnings.push("mock_daily_return_preview_invalid");
  if (!Number.isFinite(cumulativeReturnPreview) || Math.abs(cumulativeReturnPreview) > 1000) warnings.push("mock_cumulative_return_preview_invalid");
  if (!Number.isFinite(drawdownPreview) || drawdownPreview > 0 || drawdownPreview < -100) warnings.push("mock_drawdown_preview_invalid");
  if (!Number.isFinite(mddPreview) || mddPreview > 0 || mddPreview < -100) warnings.push("mock_mdd_preview_invalid");
  if (allocationPreview.length === 0) warnings.push("mock_allocation_preview_missing");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_performance_core_ready";
  const policyStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "ready";

  return {
    validationId: "step156_mock_portfolio_performance_recalculation_core_preflight_validation",
    sourceStep: "step156",
    status,
    performanceCorePreflightId: "step156_mock_portfolio_performance_recalculation_core_preflight",
    performanceCoreInputBundleId: bundle.performanceCoreInputBundleId,
    performanceRecalculationReviewResultId: reviewResult.performanceRecalculationReviewResultId || receipt.performanceRecalculationReviewResultId || bundle.performanceRecalculationReviewResultId,
    performanceRecalculationPreflightId: reviewResult.performanceRecalculationPreflightId || receipt.performanceRecalculationPreflightId || "step156_missing_performance_recalculation_preflight",
    performanceInputBundleId: bundle.performanceInputBundleId,
    ledgerUpdateResultId: bundle.ledgerUpdateResultId,
    mockRunCandidateId: bundle.mockRunCandidateId,
    strategyDraftId: bundle.strategyDraftId,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    coreInputBundleStatus: mapPerformanceCorePolicyStatus(bundle.coreInputBundleStatus),
    equitySeriesPolicyStatus: policyStatus,
    dailyReturnPolicyStatus: policyStatus,
    cumulativeReturnPolicyStatus: policyStatus,
    drawdownPolicyStatus: policyStatus,
    mddPolicyStatus: policyStatus,
    allocationPolicyStatus: policyStatus,
    realizedPnlPolicyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "placeholder_only",
    unrealizedPnlPolicyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "placeholder_only",
    kpiSummaryPolicyStatus: policyStatus,
    chartDataPolicyStatus: policyStatus,
    deterministicCalculationStatus: scenario.deterministic === true && bundle.deterministic === true ? policyStatus : "blocked",
    dependencyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "satisfied",
    equityAfterPreview: equityAfter,
    dailyReturnPreview,
    cumulativeReturnPreview,
    drawdownPreview,
    mddPreview,
    allocationPreview,
    deterministic: true,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step156_mock_performance_core_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationCorePreflight(input = {}, options = {}) {
  const performanceCoreInputBundle = input.performanceCoreInputBundle || buildTradingLabMockPerformanceCoreInputBundle(input, options);
  const performanceCoreScenario = input.performanceCoreScenario || buildTradingLabMockPerformanceCoreScenario(input, options);
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCorePreflight(
    { ...input, performanceCoreInputBundle, performanceCoreScenario },
    options,
  );

  const result = {
    performanceCorePreflightId: validation.performanceCorePreflightId,
    sourceStep: "step156",
    performanceCoreInputBundleId: validation.performanceCoreInputBundleId,
    performanceRecalculationReviewResultId: validation.performanceRecalculationReviewResultId,
    performanceRecalculationPreflightId: validation.performanceRecalculationPreflightId,
    performanceInputBundleId: validation.performanceInputBundleId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    coreInputBundleStatus: validation.coreInputBundleStatus,
    equitySeriesPolicyStatus: validation.equitySeriesPolicyStatus,
    dailyReturnPolicyStatus: validation.dailyReturnPolicyStatus,
    cumulativeReturnPolicyStatus: validation.cumulativeReturnPolicyStatus,
    drawdownPolicyStatus: validation.drawdownPolicyStatus,
    mddPolicyStatus: validation.mddPolicyStatus,
    allocationPolicyStatus: validation.allocationPolicyStatus,
    realizedPnlPolicyStatus: validation.realizedPnlPolicyStatus,
    unrealizedPnlPolicyStatus: validation.unrealizedPnlPolicyStatus,
    kpiSummaryPolicyStatus: validation.kpiSummaryPolicyStatus,
    chartDataPolicyStatus: validation.chartDataPolicyStatus,
    deterministicCalculationStatus: validation.deterministicCalculationStatus,
    dependencyStatus: validation.dependencyStatus,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    equityAfterPreview: validation.equityAfterPreview,
    dailyReturnPreview: validation.dailyReturnPreview,
    cumulativeReturnPreview: validation.cumulativeReturnPreview,
    drawdownPreview: validation.drawdownPreview,
    mddPreview: validation.mddPreview,
    allocationPreview: validation.allocationPreview,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_portfolio_performance_recalculation_core",
  };

  return {
    ok: true,
    step: "Step 156: Admin trading lab mock portfolio performance recalculation core preflight",
    status: "admin_only_trading_lab_mock_portfolio_performance_recalculation_core_preflight_fail_closed",
    sourceStep: "step156",
    mockPortfolioPerformanceRecalculationCorePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_MODEL,
    mockPerformanceCoreInputBundleModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_INPUT_BUNDLE_MODEL,
    mockPerformanceCoreScenarioModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_SCENARIO_MODEL,
    mockPerformanceCorePreflightResultSchema: TRADING_LAB_MOCK_PERFORMANCE_CORE_PREFLIGHT_RESULT_SCHEMA,
    performanceCoreInputBundle,
    performanceCoreScenario,
    validation,
    result,
    summary: {
      summaryId: "step156_mock_performance_core_preflight_summary",
      sourceStep: "step156",
      status: validation.status,
      deterministicCalculationStatus: validation.deterministicCalculationStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      blockerSummary: validation.blockerSummary,
      warningSummary: validation.warningSummary,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_performance_recalculation_core",
      redacted: true,
    },
    mockHistory: [
      {
        historyId: "step156_mock_performance_core_preflight_history_1",
        sourceStep: "step156",
        status: validation.status,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_performance_recalculation_core",
      },
    ],
    flags: { ...STEP156_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
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
      actualPerformanceRecordCreateAllowed: false,
      actualPerformanceRecordUpdateAllowed: false,
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step156_mock_portfolio_performance_recalculation_core_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioPerformanceRecalculationCorePreflight(input, options);
}

function mapPerformanceCorePolicyReviewStatus(status) {
  if (["recorded", "reviewed", "ready", "placeholder_only", "satisfied", "mock_performance_core_ready"].includes(status)) return "reviewed";
  if (status === "blocked") return "blocked";
  return "validation_required";
}

function getStep157MockPortfolioPerformanceCoreReviewContext(input = {}, options = {}) {
  const hasPreflightStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioPerformanceRecalculationCorePreflightStatus");
  const mockPortfolioPerformanceRecalculationCorePreflightStatus = hasPreflightStatus
    ? input.mockPortfolioPerformanceRecalculationCorePreflightStatus
    : buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus(input, options);
  const result = input.performanceCorePreflightResult
    || mockPortfolioPerformanceRecalculationCorePreflightStatus?.result
    || null;
  const performanceCoreInputBundle = input.performanceCoreInputBundle
    || mockPortfolioPerformanceRecalculationCorePreflightStatus?.performanceCoreInputBundle
    || null;
  const validation = input.performanceCorePreflightValidation
    || mockPortfolioPerformanceRecalculationCorePreflightStatus?.validation
    || {};
  const summary = input.performanceCorePreflightSummary
    || mockPortfolioPerformanceRecalculationCorePreflightStatus?.summary
    || {};

  return {
    mockPortfolioPerformanceRecalculationCorePreflightStatus,
    result,
    performanceCoreInputBundle,
    validation,
    summary,
  };
}

export function validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input = {}, options = {}) {
  const context = getStep157MockPortfolioPerformanceCoreReviewContext(input, options);
  const result = context.result || {};
  const bundle = context.performanceCoreInputBundle || {};
  const validation = context.validation || {};
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioPerformanceRecalculationCorePreflightStatus) blockers.push("mock_performance_core_preflight_status_missing");
  if (!context.result) blockers.push("mock_performance_core_preflight_result_missing");
  if (!context.performanceCoreInputBundle) blockers.push("mock_performance_core_input_bundle_missing");
  if (result.redacted !== true) blockers.push("mock_performance_core_preflight_result_not_redacted");
  if (result.scope !== "mock_only") blockers.push("mock_performance_core_preflight_scope_not_mock_only");
  if (bundle.redacted !== true) blockers.push("mock_performance_core_input_bundle_not_redacted");
  if (bundle.scope !== "mock_only") blockers.push("mock_performance_core_input_bundle_scope_not_mock_only");
  if (result.readinessImpact !== "none") blockers.push("performance_core_review_readiness_impact_not_none");
  if (result.providerCallImpact !== "blocked") blockers.push("performance_core_review_provider_call_impact_not_blocked");
  if (result.orderSubmissionImpact !== "blocked") blockers.push("performance_core_review_order_submission_impact_not_blocked");
  if (result.liveTradingImpact !== "blocked") blockers.push("performance_core_review_live_trading_impact_not_blocked");
  if (result.nextAllowedStep && result.nextAllowedStep !== "mock_portfolio_performance_recalculation_core") blockers.push("performance_core_review_next_step_not_core");
  if (result.status === "blocked" || validation.status === "blocked") blockers.push("mock_performance_core_preflight_blocked");
  if (result.status === "validation_required" || validation.status === "validation_required") warnings.push("mock_performance_core_preflight_validation_required");
  if (bundle.actualPerformanceRecordCreated !== false || bundle.actualPerformanceRecordUpdated !== false) blockers.push("actual_performance_record_must_not_change");
  if (bundle.actualCashUpdated !== false || bundle.actualPositionUpdated !== false) blockers.push("actual_cash_position_update_must_not_run");
  if (bundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (bundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (bundle.persistentStorageUsed !== false || bundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (bundle.kisOrderPayloadCreated !== false || bundle.kisExecutionPayloadCreated !== false || bundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.actualPerformanceRecordCreated !== false) blockers.push("status_actual_performance_record_must_not_create");
  if (context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.actualPerformanceRecordUpdated !== false) blockers.push("status_actual_performance_record_must_not_update");
  if (context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.actualPortfolioLedgerUpdated !== false) blockers.push("status_actual_portfolio_ledger_update_must_not_run");
  if (context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.actualCashUpdated !== false || context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.actualPositionUpdated !== false) blockers.push("status_actual_cash_position_update_must_not_run");
  if (context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.persistentStorageUsed !== false || context.mockPortfolioPerformanceRecalculationCorePreflightStatus?.dbWriteUsed !== false) blockers.push("status_persistent_db_write_must_not_run");
  if (containsUnsafeReviewResultInput(input.reviewResultInput || input.performanceCoreReviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");

  const equityAfter = toFiniteNumber(result.equityAfterPreview ?? validation.equityAfterPreview ?? bundle.equityAfterPreview, 0);
  const dailyReturnPreview = toFiniteNumber(result.dailyReturnPreview ?? validation.dailyReturnPreview, 0);
  const cumulativeReturnPreview = toFiniteNumber(result.cumulativeReturnPreview ?? validation.cumulativeReturnPreview, 0);
  const drawdownPreview = toFiniteNumber(result.drawdownPreview ?? validation.drawdownPreview, 0);
  const mddPreview = toFiniteNumber(result.mddPreview ?? validation.mddPreview, 0);

  if (equityAfter < 0) warnings.push("mock_equity_preview_negative");
  if (!Number.isFinite(dailyReturnPreview) || Math.abs(dailyReturnPreview) > 100) warnings.push("mock_daily_return_preview_invalid");
  if (!Number.isFinite(cumulativeReturnPreview) || Math.abs(cumulativeReturnPreview) > 1000) warnings.push("mock_cumulative_return_preview_invalid");
  if (!Number.isFinite(drawdownPreview) || drawdownPreview > 0 || drawdownPreview < -100) warnings.push("mock_drawdown_preview_invalid");
  if (!Number.isFinite(mddPreview) || mddPreview > 0 || mddPreview < -100) warnings.push("mock_mdd_preview_invalid");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";

  return {
    validationId: "step157_mock_portfolio_performance_recalculation_core_review_result_validation",
    sourceStep: "step157",
    status,
    performanceCorePreflightId: result.performanceCorePreflightId || "step157_missing_performance_core_preflight",
    performanceCoreInputBundleId: result.performanceCoreInputBundleId || bundle.performanceCoreInputBundleId || "step157_missing_performance_core_input_bundle",
    performanceRecalculationReviewResultId: result.performanceRecalculationReviewResultId || bundle.performanceRecalculationReviewResultId || "step157_missing_performance_recalculation_review_result",
    performanceRecalculationPreflightId: result.performanceRecalculationPreflightId || "step157_missing_performance_recalculation_preflight",
    ledgerUpdateResultId: result.ledgerUpdateResultId || bundle.ledgerUpdateResultId || "step157_missing_ledger_update_result",
    mockRunCandidateId: result.mockRunCandidateId || bundle.mockRunCandidateId || "step157_missing_mock_run_candidate",
    strategyDraftId: result.strategyDraftId || bundle.strategyDraftId || "step157_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    equitySeriesPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.equitySeriesPolicyStatus || validation.equitySeriesPolicyStatus),
    dailyReturnPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.dailyReturnPolicyStatus || validation.dailyReturnPolicyStatus),
    cumulativeReturnPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.cumulativeReturnPolicyStatus || validation.cumulativeReturnPolicyStatus),
    drawdownPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.drawdownPolicyStatus || validation.drawdownPolicyStatus),
    mddPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.mddPolicyStatus || validation.mddPolicyStatus),
    allocationPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.allocationPolicyStatus || validation.allocationPolicyStatus),
    realizedPnlPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.realizedPnlPolicyStatus || validation.realizedPnlPolicyStatus),
    unrealizedPnlPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.unrealizedPnlPolicyStatus || validation.unrealizedPnlPolicyStatus),
    kpiSummaryPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.kpiSummaryPolicyStatus || validation.kpiSummaryPolicyStatus),
    chartDataPolicyReviewStatus: mapPerformanceCorePolicyReviewStatus(result.chartDataPolicyStatus || validation.chartDataPolicyStatus),
    deterministicCalculationReviewStatus: mapPerformanceCorePolicyReviewStatus(result.deterministicCalculationStatus || validation.deterministicCalculationStatus),
    dependencyReviewStatus: context.result ? mapPerformanceCorePolicyReviewStatus(result.dependencyStatus || validation.dependencyStatus) : "blocked",
    equityAfterPreview: equityAfter,
    dailyReturnPreview,
    cumulativeReturnPreview,
    drawdownPreview,
    mddPreview,
    deterministic: true,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step157_mock_performance_core_review_result_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input, options);
  const reviewStatus = validation.status === "recorded" ? "recorded" : validation.status;
  const decision = reviewStatus === "recorded" ? "mock_performance_core_review_recorded" : reviewStatus === "validation_required" ? "rejected" : "blocked";

  return {
    performanceCoreReviewResultId: "step157_mock_portfolio_performance_recalculation_core_review_result",
    sourceStep: "step157",
    performanceCorePreflightId: validation.performanceCorePreflightId,
    performanceCoreInputBundleId: validation.performanceCoreInputBundleId,
    performanceRecalculationReviewResultId: validation.performanceRecalculationReviewResultId,
    performanceRecalculationPreflightId: validation.performanceRecalculationPreflightId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus,
    decision,
    reviewedAt: "placeholder_reviewed_at",
    reviewedBy: "admin_placeholder",
    summary: [
      "FINPLE internal mock performance recalculation core review only",
      "not an actual investment performance confirmation",
      "not an actual account performance result",
      "no actual performance record create or update",
      "no persistent DB write",
      "no real cash, position, or portfolio ledger update",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockers: validation.blockers,
    warnings: validation.warnings,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildTradingLabMockPerformanceCorePolicyReviewSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input, options);

  return {
    summaryId: "step157_mock_performance_core_policy_review_summary",
    sourceStep: "step157",
    equitySeriesPolicyReviewStatus: validation.equitySeriesPolicyReviewStatus,
    dailyReturnPolicyReviewStatus: validation.dailyReturnPolicyReviewStatus,
    cumulativeReturnPolicyReviewStatus: validation.cumulativeReturnPolicyReviewStatus,
    drawdownPolicyReviewStatus: validation.drawdownPolicyReviewStatus,
    mddPolicyReviewStatus: validation.mddPolicyReviewStatus,
    allocationPolicyReviewStatus: validation.allocationPolicyReviewStatus,
    realizedPnlPolicyReviewStatus: validation.realizedPnlPolicyReviewStatus,
    unrealizedPnlPolicyReviewStatus: validation.unrealizedPnlPolicyReviewStatus,
    kpiSummaryPolicyReviewStatus: validation.kpiSummaryPolicyReviewStatus,
    chartDataPolicyReviewStatus: validation.chartDataPolicyReviewStatus,
    deterministicCalculationReviewStatus: validation.deterministicCalculationReviewStatus,
    dependencyReviewStatus: validation.dependencyReviewStatus,
    reviewSummary: [
      "equity series policy review uses mock-only core preflight values",
      "daily and cumulative return policy review is deterministic",
      "drawdown and MDD policy review is deterministic",
      "allocation policy review is mock-only",
      "KPI and chart data policy review does not confirm actual investment performance",
      "no real account balance or DB performance update is performed",
    ],
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    deterministic: true,
    redacted: true,
  };
}

export function buildTradingLabMockPerformanceCoreReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input, options);
  const decision = validation.status === "recorded" ? "mock_performance_core_review_recorded" : validation.status === "validation_required" ? "rejected" : "blocked";

  return {
    summaryId: "step157_mock_performance_core_review_decision_summary",
    sourceStep: "step157",
    decision,
    decisionSummary: [
      "mock performance core review recorded",
      "FINPLE internal mock performance recalculation core review only",
      "not an actual investment performance confirmation",
      "not an actual account performance result",
      "no actual performance record create or update",
      "no persistent DB write",
      "no real cash, position, or portfolio ledger update",
      "KIS calls and order submission remain blocked",
      "live trading readiness stays blocked",
      "external order authority evidence remains required",
    ],
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockerSummary: validation.blockerSummary,
    warningSummary: validation.warningSummary,
    externalOrderAuthorityRequired: true,
    actualPerformanceRecordCreateAllowed: false,
    actualPerformanceRecordUpdateAllowed: false,
    actualLedgerUpdateAllowed: false,
    actualCashUpdateAllowed: false,
    actualPositionUpdateAllowed: false,
    persistentDbWriteAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForLiveGuardedTrading: false,
    redacted: true,
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultRecordingGate(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult(input, options);
  const reviewResult = input.reviewResult || buildTradingLabMockPortfolioPerformanceRecalculationCoreReviewResult({ ...input, validation }, options);
  const policyReviewSummary = input.policyReviewSummary || buildTradingLabMockPerformanceCorePolicyReviewSummary({ ...input, validation }, options);
  const decisionSummary = input.decisionSummary || buildTradingLabMockPerformanceCoreReviewDecisionSummary({ ...input, validation }, options);

  return {
    ok: true,
    step: "Step 157: Admin trading lab mock portfolio performance recalculation core review result recording gate",
    status: "admin_only_trading_lab_mock_portfolio_performance_recalculation_core_review_result_fail_closed",
    sourceStep: "step157",
    mockPortfolioPerformanceRecalculationCoreReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_MODEL,
    mockPerformanceCoreReviewReceiptSchema: TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_RECEIPT_SCHEMA,
    mockPerformanceCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockPerformanceCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    validation,
    reviewResult,
    policyReviewSummary,
    decisionSummary,
    receipt: {
      receiptId: "step157_mock_performance_core_review_receipt",
      sourceStep: "step157",
      performanceCoreReviewResultId: reviewResult.performanceCoreReviewResultId,
      performanceCorePreflightId: reviewResult.performanceCorePreflightId,
      performanceCoreInputBundleId: reviewResult.performanceCoreInputBundleId,
      reviewStatus: reviewResult.reviewStatus,
      decision: reviewResult.decision,
      redacted: true,
      recordedAt: "placeholder_recorded_at",
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      equitySeriesPolicyReviewStatus: validation.equitySeriesPolicyReviewStatus,
      dailyReturnPolicyReviewStatus: validation.dailyReturnPolicyReviewStatus,
      cumulativeReturnPolicyReviewStatus: validation.cumulativeReturnPolicyReviewStatus,
      drawdownPolicyReviewStatus: validation.drawdownPolicyReviewStatus,
      mddPolicyReviewStatus: validation.mddPolicyReviewStatus,
      allocationPolicyReviewStatus: validation.allocationPolicyReviewStatus,
      realizedPnlPolicyReviewStatus: validation.realizedPnlPolicyReviewStatus,
      unrealizedPnlPolicyReviewStatus: validation.unrealizedPnlPolicyReviewStatus,
      kpiSummaryPolicyReviewStatus: validation.kpiSummaryPolicyReviewStatus,
      chartDataPolicyReviewStatus: validation.chartDataPolicyReviewStatus,
      deterministicCalculationReviewStatus: validation.deterministicCalculationReviewStatus,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_portfolio_performance_recalculation_core",
    },
    mockHistory: [
      {
        historyId: "step157_mock_performance_core_review_history_1",
        sourceStep: "step157",
        status: reviewResult.reviewStatus,
        decision: reviewResult.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_portfolio_performance_recalculation_core",
      },
    ],
    flags: { ...STEP157_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
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
      actualPerformanceRecordCreateAllowed: false,
      actualPerformanceRecordUpdateAllowed: false,
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step157_mock_portfolio_performance_recalculation_core_review_result_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultRecordingGate(input, options);
}

function getStep158MockPortfolioPerformanceRecalculationCoreContext(input = {}, options = {}) {
  const hasReviewStatus = Object.prototype.hasOwnProperty.call(input, "mockPortfolioPerformanceRecalculationCoreReviewResultStatus");
  const mockPortfolioPerformanceRecalculationCoreReviewResultStatus = hasReviewStatus
    ? input.mockPortfolioPerformanceRecalculationCoreReviewResultStatus
    : buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus(input, options);
  const reviewResult = input.performanceCoreReviewResult
    || mockPortfolioPerformanceRecalculationCoreReviewResultStatus?.reviewResult
    || null;
  const receipt = input.performanceCoreReviewReceipt
    || mockPortfolioPerformanceRecalculationCoreReviewResultStatus?.receipt
    || null;
  const reviewValidation = input.performanceCoreReviewValidation
    || mockPortfolioPerformanceRecalculationCoreReviewResultStatus?.validation
    || {};
  const sourceCorePreflightStatus = input.mockPortfolioPerformanceRecalculationCorePreflightStatus
    || mockPortfolioPerformanceRecalculationCoreReviewResultStatus?.mockPortfolioPerformanceRecalculationCorePreflightStatus
    || buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus(input, options);
  const performanceCoreInputBundle = input.performanceCoreInputBundle
    || sourceCorePreflightStatus?.performanceCoreInputBundle
    || buildTradingLabMockPerformanceCoreInputBundle(input, options);

  return {
    mockPortfolioPerformanceRecalculationCoreReviewResultStatus,
    reviewResult,
    receipt,
    reviewValidation,
    sourceCorePreflightStatus,
    performanceCoreInputBundle,
  };
}

function calculateStep158EquitySeries(bundle = {}) {
  const prior = Array.isArray(bundle.priorEquitySeriesPlaceholder)
    ? bundle.priorEquitySeriesPlaceholder.map((value) => roundMoney(value)).filter((value) => Number.isFinite(value))
    : [];
  const currentEquity = roundMoney(bundle.equityAfterPreview);
  const equitySeries = [...prior, currentEquity].map((equity, index) => ({
    index,
    date: `mock_day_${index + 1}`,
    equity,
    equityPlaceholder: equity,
    source: "static_mock_series",
    redacted: true,
  }));
  const priorEquity = equitySeries.length > 1 ? equitySeries[equitySeries.length - 2].equity : roundMoney(bundle.equityBeforePlaceholder);

  return {
    equitySeriesResultId: "step158_mock_equity_series_result",
    sourceStep: "step158",
    priorEquity,
    currentEquity,
    equityDelta: roundMoney(currentEquity - priorEquity),
    equitySeries,
    status: equitySeries.length >= 2 && currentEquity >= 0 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

function calculateStep158DailyReturnSeries(equityResult = {}) {
  const equitySeries = Array.isArray(equityResult.equitySeries) ? equityResult.equitySeries : [];
  const dailyReturnSeries = equitySeries.map((point, index) => {
    const previousEquity = index > 0 ? toFiniteNumber(equitySeries[index - 1].equity, 0) : toFiniteNumber(point.equity, 0);
    const currentEquity = toFiniteNumber(point.equity, 0);
    const dailyReturn = previousEquity > 0 && index > 0 ? roundPct(safeRatio(currentEquity - previousEquity, previousEquity) * 100) : 0;
    return {
      index,
      date: point.date,
      previousEquity: roundMoney(previousEquity),
      currentEquity: roundMoney(currentEquity),
      dailyReturn,
      dailyReturnPct: dailyReturn,
      source: "static_mock_series",
      redacted: true,
    };
  });
  const latest = dailyReturnSeries[dailyReturnSeries.length - 1] || {};

  return {
    dailyReturnResultId: "step158_mock_daily_return_result",
    sourceStep: "step158",
    previousEquity: roundMoney(latest.previousEquity),
    currentEquity: roundMoney(latest.currentEquity),
    dailyReturn: roundPct(latest.dailyReturn),
    dailyReturnSeries,
    status: dailyReturnSeries.length >= 2 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

function calculateStep158CumulativeReturnSeries(equityResult = {}) {
  const equitySeries = Array.isArray(equityResult.equitySeries) ? equityResult.equitySeries : [];
  const initialEquity = toFiniteNumber(equitySeries[0]?.equity, 0);
  const cumulativeReturnSeries = equitySeries.map((point, index) => {
    const currentEquity = toFiniteNumber(point.equity, 0);
    const cumulativeReturn = initialEquity > 0 ? roundPct((safeRatio(currentEquity, initialEquity) - 1) * 100) : 0;
    return {
      index,
      date: point.date,
      initialEquity: roundMoney(initialEquity),
      currentEquity: roundMoney(currentEquity),
      cumulativeReturn,
      cumulativeReturnPct: cumulativeReturn,
      source: "static_mock_series",
      redacted: true,
    };
  });
  const latest = cumulativeReturnSeries[cumulativeReturnSeries.length - 1] || {};

  return {
    cumulativeReturnResultId: "step158_mock_cumulative_return_result",
    sourceStep: "step158",
    initialEquity: roundMoney(initialEquity),
    currentEquity: roundMoney(latest.currentEquity),
    cumulativeReturn: roundPct(latest.cumulativeReturn),
    cumulativeReturnSeries,
    status: cumulativeReturnSeries.length >= 2 && initialEquity > 0 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

function calculateStep158DrawdownMddResult(equityResult = {}) {
  const equitySeries = Array.isArray(equityResult.equitySeries) ? equityResult.equitySeries : [];
  let runningPeak = 0;
  const drawdownSeries = equitySeries.map((point, index) => {
    const equity = toFiniteNumber(point.equity, 0);
    runningPeak = Math.max(runningPeak, equity);
    const drawdown = runningPeak > 0 ? roundPct((safeRatio(equity, runningPeak) - 1) * 100) : 0;
    return {
      index,
      date: point.date,
      equity: roundMoney(equity),
      runningPeak: roundMoney(runningPeak),
      drawdown,
      drawdownPct: drawdown,
      source: "static_mock_series",
      redacted: true,
    };
  });
  const mdd = drawdownSeries.reduce((min, point) => Math.min(min, toFiniteNumber(point.drawdown, 0)), 0);
  const peakEquity = drawdownSeries.reduce((max, point) => Math.max(max, toFiniteNumber(point.runningPeak, 0)), 0);
  const mddPoint = drawdownSeries.find((point) => toFiniteNumber(point.drawdown, 0) === mdd);

  return {
    drawdownResultId: "step158_mock_drawdown_mdd_result",
    sourceStep: "step158",
    equitySeries,
    drawdownSeries,
    mdd: roundPct(mdd),
    peakEquity: roundMoney(peakEquity),
    troughEquity: roundMoney(mddPoint?.equity ?? 0),
    status: drawdownSeries.length >= 2 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

function normalizeStep158AllocationSnapshot(bundle = {}) {
  const source = Array.isArray(bundle.priorAllocationSnapshotPlaceholder) ? bundle.priorAllocationSnapshotPlaceholder : [];
  const totalPortfolioValue = Math.max(0, roundMoney(bundle.portfolioValueAfterPreview || bundle.equityAfterPreview));
  const positions = source.map((item, index) => {
    const weightPct = roundPct(item.weightPct);
    return {
      symbol: String(item.symbol || `MOCK_ASSET_${index + 1}`),
      mockPositionValue: roundMoney(totalPortfolioValue * safeRatio(weightPct, 100)),
      weightPct,
      status: item.status || "mock_only",
      redacted: true,
    };
  });
  const totalWeight = roundPct(positions.reduce((sum, item) => sum + toFiniteNumber(item.weightPct, 0), 0));
  const residualWeight = roundPct(100 - totalWeight);

  return {
    allocationResultId: "step158_mock_allocation_result",
    sourceStep: "step158",
    positions,
    totalPortfolioValue,
    allocationSnapshot: positions.map((item) => ({
      symbol: item.symbol,
      weightPct: item.weightPct,
      status: "mock_only",
      redacted: true,
    })),
    residualWeight,
    allocationStatus: positions.length > 0 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

export function calculateTradingLabMockPortfolioPerformanceResult(input = {}, options = {}) {
  const bundle = input.performanceCoreInputBundle || buildTradingLabMockPerformanceCoreInputBundle(input, options);
  const calculationStatus = input.calculationStatus || "mock_performance_calculated";
  const equitySeriesResult = calculateStep158EquitySeries(bundle);
  const dailyReturnResult = calculateStep158DailyReturnSeries(equitySeriesResult);
  const cumulativeReturnResult = calculateStep158CumulativeReturnSeries(equitySeriesResult);
  const drawdownMddResult = calculateStep158DrawdownMddResult(equitySeriesResult);
  const allocationResult = normalizeStep158AllocationSnapshot(bundle);
  const latestEquity = toFiniteNumber(equitySeriesResult.currentEquity, 0);
  const latestDailyReturn = toFiniteNumber(dailyReturnResult.dailyReturn, 0);
  const latestCumulativeReturn = toFiniteNumber(cumulativeReturnResult.cumulativeReturn, 0);
  const realizedPnlPlaceholder = roundMoney(bundle.realizedPnlPlaceholder);
  const unrealizedPnlPlaceholder = roundMoney(bundle.unrealizedPnlPlaceholder);
  const cashWeight = latestEquity > 0 ? roundPct(safeRatio(bundle.cashAfterPreview, latestEquity) * 100) : 0;
  const status = calculationStatus === "mock_performance_calculated" ? "calculated" : calculationStatus;
  const chartData = {
    chartDataResultId: "step158_mock_chart_data_result",
    sourceStep: "step158",
    equityChartData: equitySeriesResult.equitySeries.map((point) => ({ date: point.date, value: point.equity, redacted: true })),
    returnChartData: cumulativeReturnResult.cumulativeReturnSeries.map((point) => ({ date: point.date, value: point.cumulativeReturn, redacted: true })),
    drawdownChartData: drawdownMddResult.drawdownSeries.map((point) => ({ date: point.date, value: point.drawdown, redacted: true })),
    allocationChartData: allocationResult.allocationSnapshot.map((point) => ({ label: point.symbol, value: point.weightPct, redacted: true })),
    status,
    deterministic: true,
    redacted: true,
  };
  const kpiSummary = {
    kpiSummaryResultId: "step158_mock_kpi_summary_result",
    sourceStep: "step158",
    totalEquity: roundMoney(latestEquity),
    dailyReturn: roundPct(latestDailyReturn),
    cumulativeReturn: roundPct(latestCumulativeReturn),
    mdd: roundPct(drawdownMddResult.mdd),
    realizedPnlPlaceholder,
    unrealizedPnlPlaceholder,
    cashWeight,
    positionCount: allocationResult.positions.filter((item) => item.symbol !== "CASH").length,
    allocationResidual: allocationResult.residualWeight,
    status,
    deterministic: true,
    redacted: true,
  };

  return {
    performanceResultId: "step158_mock_portfolio_performance_recalculation_core_result",
    sourceStep: "step158",
    performanceCoreReviewResultId: input.performanceCoreReviewResultId || "step157_mock_portfolio_performance_recalculation_core_review_result",
    performanceCorePreflightId: input.performanceCorePreflightId || bundle.performanceCorePreflightId || "step156_mock_portfolio_performance_recalculation_core_preflight",
    performanceCoreInputBundleId: bundle.performanceCoreInputBundleId,
    ledgerUpdateResultId: bundle.ledgerUpdateResultId,
    mockRunCandidateId: bundle.mockRunCandidateId,
    strategyDraftId: bundle.strategyDraftId,
    scope: "mock_only",
    calculationStatus,
    equitySeries: equitySeriesResult.equitySeries,
    dailyReturnSeries: dailyReturnResult.dailyReturnSeries,
    cumulativeReturnSeries: cumulativeReturnResult.cumulativeReturnSeries,
    drawdownSeries: drawdownMddResult.drawdownSeries,
    mdd: drawdownMddResult.mdd,
    allocationSnapshot: allocationResult.allocationSnapshot,
    realizedPnlPlaceholder,
    unrealizedPnlPlaceholder,
    kpiSummary,
    chartData,
    equitySeriesResult,
    dailyReturnResult,
    cumulativeReturnResult,
    drawdownMddResult,
    allocationResult,
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_trading_run_summary_preflight",
  };
}

export function validateTradingLabMockPortfolioPerformanceRecalculationCore(input = {}, options = {}) {
  const context = getStep158MockPortfolioPerformanceRecalculationCoreContext(input, options);
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const bundle = input.performanceCoreInputBundle || context.performanceCoreInputBundle || {};
  const performanceResult = input.performanceResult || calculateTradingLabMockPortfolioPerformanceResult(
    {
      ...input,
      performanceCoreInputBundle: bundle,
      performanceCoreReviewResultId: reviewResult.performanceCoreReviewResultId,
      performanceCorePreflightId: reviewResult.performanceCorePreflightId,
    },
    options,
  );
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioPerformanceRecalculationCoreReviewResultStatus) blockers.push("mock_performance_core_review_result_status_missing");
  if (!context.reviewResult) blockers.push("mock_performance_core_review_result_missing");
  if (!context.receipt) blockers.push("mock_performance_core_review_receipt_missing");
  if (reviewResult.redacted !== true) blockers.push("mock_performance_core_review_result_not_redacted");
  if (receipt.redacted !== true) blockers.push("mock_performance_core_review_receipt_not_redacted");
  if (reviewResult.reviewStatus !== "recorded") blockers.push("mock_performance_core_review_not_recorded");
  if (reviewResult.decision !== "mock_performance_core_review_recorded") blockers.push("mock_performance_core_review_decision_not_recorded");
  if (receipt.nextAllowedStep && receipt.nextAllowedStep !== "mock_portfolio_performance_recalculation_core") blockers.push("mock_performance_core_review_next_step_not_core");
  if (reviewResult.readinessImpact !== "none" || receipt.readinessImpact !== "none") blockers.push("mock_performance_result_readiness_impact_not_none");
  if (reviewResult.providerCallImpact !== "blocked" || receipt.providerCallImpact !== "blocked") blockers.push("mock_performance_result_provider_call_impact_not_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked" || receipt.orderSubmissionImpact !== "blocked") blockers.push("mock_performance_result_order_submission_impact_not_blocked");
  if (reviewResult.liveTradingImpact !== "blocked" || receipt.liveTradingImpact !== "blocked") blockers.push("mock_performance_result_live_trading_impact_not_blocked");
  if (bundle.redacted !== true) blockers.push("mock_performance_core_input_bundle_not_redacted");
  if (bundle.scope !== "mock_only") blockers.push("mock_performance_core_input_bundle_scope_not_mock_only");
  if (bundle.actualPerformanceRecordCreated !== false || bundle.actualPerformanceRecordUpdated !== false) blockers.push("actual_performance_record_must_not_change");
  if (bundle.actualCashUpdated !== false || bundle.actualPositionUpdated !== false) blockers.push("actual_cash_position_update_must_not_run");
  if (bundle.actualPortfolioLedgerUpdated !== false) blockers.push("actual_portfolio_ledger_update_must_not_run");
  if (bundle.accountBalanceQueried !== false) blockers.push("actual_account_balance_query_must_not_run");
  if (bundle.persistentStorageUsed !== false || bundle.dbWriteUsed !== false) blockers.push("persistent_db_write_must_not_run");
  if (bundle.kisOrderPayloadCreated !== false || bundle.kisExecutionPayloadCreated !== false || bundle.kisFillPayloadCreated !== false) blockers.push("kis_order_execution_fill_payload_must_not_be_created");
  if (containsUnsafeReviewResultInput(input.performanceResultInput || input.performanceCoreInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");
  if (performanceResult.redacted !== true) blockers.push("mock_performance_result_not_redacted");
  if (performanceResult.scope !== "mock_only") blockers.push("mock_performance_result_scope_not_mock_only");
  if (performanceResult.deterministic !== true) blockers.push("mock_performance_result_not_deterministic");

  const equityValues = Array.isArray(performanceResult.equitySeries) ? performanceResult.equitySeries.map((point) => toFiniteNumber(point.equity, 0)) : [];
  const dailyReturns = Array.isArray(performanceResult.dailyReturnSeries) ? performanceResult.dailyReturnSeries.map((point) => toFiniteNumber(point.dailyReturn, 0)) : [];
  const cumulativeReturns = Array.isArray(performanceResult.cumulativeReturnSeries) ? performanceResult.cumulativeReturnSeries.map((point) => toFiniteNumber(point.cumulativeReturn, 0)) : [];
  const drawdowns = Array.isArray(performanceResult.drawdownSeries) ? performanceResult.drawdownSeries.map((point) => toFiniteNumber(point.drawdown, 0)) : [];
  const allocationWeight = Array.isArray(performanceResult.allocationSnapshot)
    ? performanceResult.allocationSnapshot.reduce((sum, point) => sum + toFiniteNumber(point.weightPct, 0), 0)
    : 0;

  if (equityValues.length < 2) warnings.push("mock_equity_series_missing");
  if (equityValues.some((value) => value < 0)) warnings.push("mock_equity_series_negative");
  if (dailyReturns.some((value) => !Number.isFinite(value) || Math.abs(value) > 100)) warnings.push("mock_daily_return_invalid");
  if (cumulativeReturns.some((value) => !Number.isFinite(value) || Math.abs(value) > 1000)) warnings.push("mock_cumulative_return_invalid");
  if (drawdowns.some((value) => !Number.isFinite(value) || value > 0 || value < -100)) warnings.push("mock_drawdown_invalid");
  if (!Number.isFinite(toFiniteNumber(performanceResult.mdd, 0)) || toFiniteNumber(performanceResult.mdd, 0) > 0 || toFiniteNumber(performanceResult.mdd, 0) < -100) warnings.push("mock_mdd_invalid");
  if (!Array.isArray(performanceResult.allocationSnapshot) || performanceResult.allocationSnapshot.length === 0) warnings.push("mock_allocation_snapshot_missing");
  if (!Number.isFinite(allocationWeight) || Math.abs(100 - allocationWeight) > 1) warnings.push("mock_allocation_residual_reported");
  if (!performanceResult.kpiSummary || performanceResult.kpiSummary.redacted !== true) warnings.push("mock_kpi_summary_missing");
  if (!performanceResult.chartData || performanceResult.chartData.redacted !== true) warnings.push("mock_chart_data_missing");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_performance_calculated";
  const resultStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "calculated";

  return {
    validationId: "step158_mock_portfolio_performance_recalculation_core_validation",
    sourceStep: "step158",
    status,
    calculationStatus: status,
    performanceResultId: performanceResult.performanceResultId,
    performanceCoreReviewResultId: reviewResult.performanceCoreReviewResultId || performanceResult.performanceCoreReviewResultId || "step158_missing_performance_core_review_result",
    performanceCorePreflightId: reviewResult.performanceCorePreflightId || performanceResult.performanceCorePreflightId || "step158_missing_performance_core_preflight",
    performanceCoreInputBundleId: bundle.performanceCoreInputBundleId || performanceResult.performanceCoreInputBundleId || "step158_missing_performance_core_input_bundle",
    ledgerUpdateResultId: bundle.ledgerUpdateResultId || performanceResult.ledgerUpdateResultId || "step158_missing_ledger_update_result",
    mockRunCandidateId: bundle.mockRunCandidateId || performanceResult.mockRunCandidateId || "step158_missing_mock_run_candidate",
    strategyDraftId: bundle.strategyDraftId || performanceResult.strategyDraftId || "step158_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    equitySeriesStatus: resultStatus,
    dailyReturnStatus: resultStatus,
    cumulativeReturnStatus: resultStatus,
    drawdownStatus: resultStatus,
    mddStatus: resultStatus,
    allocationStatus: resultStatus,
    kpiSummaryStatus: resultStatus,
    chartDataStatus: resultStatus,
    deterministicCalculationStatus: performanceResult.deterministic === true ? resultStatus : "blocked",
    dependencyStatus: uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "satisfied",
    allocationResidual: roundPct(100 - allocationWeight),
    deterministic: true,
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
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    actualExecutionCreated: false,
    executionRecordCreated: false,
    actualFillRecordCreated: false,
    fillRecordCreated: false,
    fillCreated: false,
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step158_mock_portfolio_performance_recalculation_core_validation_v1" }),
  };
}

export function buildTradingLabMockPortfolioPerformanceRecalculationCore(input = {}, options = {}) {
  const context = getStep158MockPortfolioPerformanceRecalculationCoreContext(input, options);
  const performanceCoreInputBundle = input.performanceCoreInputBundle || context.performanceCoreInputBundle;
  const performanceResultBase = input.performanceResult || calculateTradingLabMockPortfolioPerformanceResult(
    {
      ...input,
      performanceCoreInputBundle,
      performanceCoreReviewResultId: context.reviewResult?.performanceCoreReviewResultId,
      performanceCorePreflightId: context.reviewResult?.performanceCorePreflightId,
    },
    options,
  );
  const validation = input.validation || validateTradingLabMockPortfolioPerformanceRecalculationCore(
    { ...input, performanceCoreInputBundle, performanceResult: performanceResultBase },
    options,
  );
  const calculationStatus = validation.status;
  const resultStatus = validation.equitySeriesStatus;
  const performanceResult = {
    ...performanceResultBase,
    calculationStatus,
    equitySeriesResult: { ...performanceResultBase.equitySeriesResult, status: resultStatus },
    dailyReturnResult: { ...performanceResultBase.dailyReturnResult, status: validation.dailyReturnStatus },
    cumulativeReturnResult: { ...performanceResultBase.cumulativeReturnResult, status: validation.cumulativeReturnStatus },
    drawdownMddResult: { ...performanceResultBase.drawdownMddResult, status: validation.drawdownStatus },
    allocationResult: { ...performanceResultBase.allocationResult, allocationStatus: validation.allocationStatus },
    kpiSummary: { ...performanceResultBase.kpiSummary, status: validation.kpiSummaryStatus },
    chartData: { ...performanceResultBase.chartData, status: validation.chartDataStatus },
  };

  return {
    ok: true,
    step: "Step 158: Admin trading lab mock portfolio performance recalculation core",
    status: "admin_only_trading_lab_mock_portfolio_performance_recalculation_core_fail_closed",
    sourceStep: "step158",
    mockPortfolioPerformanceRecalculationCoreModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_MODEL,
    mockPerformanceResultModel: TRADING_LAB_MOCK_PERFORMANCE_RESULT_MODEL,
    mockEquitySeriesResultModel: TRADING_LAB_MOCK_EQUITY_SERIES_RESULT_MODEL,
    mockDailyReturnResultModel: TRADING_LAB_MOCK_DAILY_RETURN_RESULT_MODEL,
    mockCumulativeReturnResultModel: TRADING_LAB_MOCK_CUMULATIVE_RETURN_RESULT_MODEL,
    mockDrawdownMddResultModel: TRADING_LAB_MOCK_DRAWDOWN_MDD_RESULT_MODEL,
    mockAllocationResultModel: TRADING_LAB_MOCK_ALLOCATION_RESULT_MODEL,
    mockKpiSummaryResultModel: TRADING_LAB_MOCK_KPI_SUMMARY_RESULT_MODEL,
    mockChartDataResultModel: TRADING_LAB_MOCK_CHART_DATA_RESULT_MODEL,
    mockPerformanceResultSchema: TRADING_LAB_MOCK_PERFORMANCE_RESULT_SCHEMA,
    performanceCoreInputBundle,
    validation,
    performanceResult,
    equitySeriesResult: performanceResult.equitySeriesResult,
    dailyReturnResult: performanceResult.dailyReturnResult,
    cumulativeReturnResult: performanceResult.cumulativeReturnResult,
    drawdownMddResult: performanceResult.drawdownMddResult,
    allocationResult: performanceResult.allocationResult,
    kpiSummaryResult: performanceResult.kpiSummary,
    chartDataResult: performanceResult.chartData,
    summary: {
      summaryId: "step158_mock_performance_recalculation_core_summary",
      sourceStep: "step158",
      calculationStatus,
      deterministicCalculationStatus: validation.deterministicCalculationStatus,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      blockerSummary: validation.blockerSummary,
      warningSummary: validation.warningSummary,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_trading_run_summary_preflight",
      redacted: true,
    },
    mockHistory: [
      {
        historyId: "step158_mock_performance_recalculation_core_history_1",
        sourceStep: "step158",
        status: calculationStatus,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_trading_run_summary_preflight",
      },
    ],
    flags: { ...STEP158_ADMIN_TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_FLAGS },
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
    actualLedgerEntryCreated: false,
    actualPortfolioLedgerUpdated: false,
    actualPerformanceRecordCreated: false,
    actualPerformanceRecordUpdated: false,
    accountBalanceQueried: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      actualPerformanceRecordCreateAllowed: false,
      actualPerformanceRecordUpdateAllowed: false,
      actualLedgerUpdateAllowed: false,
      actualCashUpdateAllowed: false,
      actualPositionUpdateAllowed: false,
      accountBalanceQueryAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step158_mock_portfolio_performance_recalculation_core_status_v1" }),
  };
}

export function buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus(input = {}, options = {}) {
  return buildTradingLabMockPortfolioPerformanceRecalculationCore(input, options);
}

function getStep159MockTradingRunSummaryPreflightContext(input = {}, options = {}) {
  const mockPortfolioPerformanceRecalculationCoreStatus = input.mockPortfolioPerformanceRecalculationCoreStatus === null
    ? null
    : input.mockPortfolioPerformanceRecalculationCoreStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus(input, options);
  const performanceResult = input.performanceResult
    || mockPortfolioPerformanceRecalculationCoreStatus?.performanceResult
    || null;
  const performanceCoreInputBundle = input.performanceCoreInputBundle
    || mockPortfolioPerformanceRecalculationCoreStatus?.performanceCoreInputBundle
    || {};

  return {
    mockPortfolioPerformanceRecalculationCoreStatus,
    performanceResult,
    performanceCoreInputBundle,
  };
}

function summarizeStep159Status(value) {
  if (!value) return "blocked";
  if (["blocked", "validation_required"].includes(value)) return value;
  return "ready";
}

export function buildTradingLabMockTradingRunSummaryInputBundle(input = {}, options = {}) {
  const context = getStep159MockTradingRunSummaryPreflightContext(input, options);
  const performanceResult = input.performanceResult || context.performanceResult || {};
  const coreBundle = input.performanceCoreInputBundle || context.performanceCoreInputBundle || {};
  const kpiSummary = performanceResult.kpiSummary || {};
  const chartData = performanceResult.chartData || {};
  const allocationSnapshot = Array.isArray(performanceResult.allocationSnapshot) ? performanceResult.allocationSnapshot : [];

  return {
    summaryInputBundleId: "step159_mock_trading_run_summary_input_bundle",
    sourceStep: "step159",
    performanceResultId: performanceResult.performanceResultId || "step159_missing_performance_result",
    ledgerUpdateResultId: performanceResult.ledgerUpdateResultId || coreBundle.ledgerUpdateResultId || "step159_missing_ledger_update_result",
    mockFillResultId: coreBundle.mockFillResultId || "step148_mock_fill_result",
    mockRunCandidateId: performanceResult.mockRunCandidateId || coreBundle.mockRunCandidateId || "step159_missing_mock_run_candidate",
    strategyDraftId: performanceResult.strategyDraftId || coreBundle.strategyDraftId || "step159_missing_strategy_draft",
    scope: "mock_only",
    strategySnapshot: {
      strategyDraftId: performanceResult.strategyDraftId || coreBundle.strategyDraftId || "step159_missing_strategy_draft",
      mode: "mock",
      scope: "mock_only",
      redacted: true,
    },
    mockOrderSummaryPlaceholder: {
      status: "mock_only",
      orderCandidateCreated: false,
      orderDraftCreated: false,
      orderPayloadCreated: false,
      redacted: true,
    },
    mockExecutionSummaryPlaceholder: {
      status: "mock_only",
      executionRecordCreated: false,
      accountBalanceQueried: false,
      redacted: true,
    },
    mockFillSummary: {
      status: "mock_only",
      fillRecordCreated: false,
      kisFillPayloadCreated: false,
      redacted: true,
    },
    mockLedgerSummary: {
      ledgerUpdateResultId: performanceResult.ledgerUpdateResultId || coreBundle.ledgerUpdateResultId || "step159_missing_ledger_update_result",
      status: "mock_only",
      portfolioLedgerPersisted: false,
      cashPositionMutated: false,
      redacted: true,
    },
    mockPerformanceSummary: {
      performanceResultId: performanceResult.performanceResultId || "step159_missing_performance_result",
      calculationStatus: performanceResult.calculationStatus || "validation_required",
      totalEquity: roundMoney(kpiSummary.totalEquity),
      cumulativeReturn: roundPct(kpiSummary.cumulativeReturn),
      mdd: roundPct(kpiSummary.mdd ?? performanceResult.mdd),
      redacted: true,
    },
    mockRiskSummary: {
      status: "mock_only",
      externalOrderAuthorityRequired: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      redacted: true,
    },
    mockChartSummary: {
      status: chartData.redacted === true ? "mock_only" : "validation_required",
      equityPointCount: Array.isArray(chartData.equityChartData) ? chartData.equityChartData.length : 0,
      returnPointCount: Array.isArray(chartData.returnChartData) ? chartData.returnChartData.length : 0,
      drawdownPointCount: Array.isArray(chartData.drawdownChartData) ? chartData.drawdownChartData.length : 0,
      allocationPointCount: Array.isArray(chartData.allocationChartData) ? chartData.allocationChartData.length : allocationSnapshot.length,
      redacted: true,
    },
    mockDashboardSections: [
      "strategy_summary",
      "mock_order_summary",
      "mock_execution_summary",
      "mock_fill_summary",
      "mock_ledger_summary",
      "mock_performance_summary",
      "mock_risk_summary",
      "mock_chart_summary",
    ].map((section) => ({ section, status: "mock_only", redacted: true })),
    deterministic: true,
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
    orderCandidateCreated: false,
    orderDraftCreated: false,
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    accountBalanceQueried: false,
    cashPositionMutated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redaction: makeLabRedaction({ schema: "step159_mock_trading_run_summary_input_bundle_v1" }),
  };
}

export function validateTradingLabMockTradingRunSummaryPreflight(input = {}, options = {}) {
  const context = getStep159MockTradingRunSummaryPreflightContext(input, options);
  const performanceStatus = context.mockPortfolioPerformanceRecalculationCoreStatus || {};
  const performanceResult = input.performanceResult || context.performanceResult || {};
  const summaryInputBundle = input.summaryInputBundle || buildTradingLabMockTradingRunSummaryInputBundle(input, options);
  const blockers = [];
  const warnings = [];

  if (!context.mockPortfolioPerformanceRecalculationCoreStatus) blockers.push("mock_performance_recalculation_core_status_missing");
  if (!context.performanceResult) blockers.push("mock_performance_result_missing");
  if (performanceResult.redacted !== true) blockers.push("mock_performance_result_not_redacted");
  if (performanceResult.scope !== "mock_only") blockers.push("mock_performance_result_scope_not_mock_only");
  if (performanceResult.calculationStatus !== "mock_performance_calculated") warnings.push("mock_performance_result_not_calculated");
  if (performanceResult.readinessImpact !== "none" || performanceStatus.readinessImpact === "ready") blockers.push("mock_summary_readiness_impact_not_none");
  if (performanceResult.providerCallImpact !== "blocked") blockers.push("mock_summary_provider_call_impact_not_blocked");
  if (performanceResult.orderSubmissionImpact !== "blocked") blockers.push("mock_summary_order_submission_impact_not_blocked");
  if (performanceResult.liveTradingImpact !== "blocked") blockers.push("mock_summary_live_trading_impact_not_blocked");
  if (summaryInputBundle.redacted !== true) blockers.push("mock_trading_run_summary_input_bundle_not_redacted");
  if (summaryInputBundle.scope !== "mock_only") blockers.push("mock_trading_run_summary_input_bundle_scope_not_mock_only");
  if (summaryInputBundle.providerCallsAllowed !== false) blockers.push("provider_calls_must_remain_blocked");
  if (summaryInputBundle.orderSubmissionAllowed !== false) blockers.push("order_submission_must_remain_blocked");
  if (summaryInputBundle.dbWriteUsed !== false || summaryInputBundle.persistentStorageUsed !== false) blockers.push("summary_preflight_must_not_write_db");
  if (summaryInputBundle.orderCandidateCreated !== false || summaryInputBundle.orderDraftCreated !== false) blockers.push("summary_preflight_must_not_create_order_artifacts");
  if (summaryInputBundle.executionRecordCreated !== false || summaryInputBundle.fillRecordCreated !== false) blockers.push("summary_preflight_must_not_create_execution_or_fill_records");
  if (summaryInputBundle.portfolioLedgerPersisted !== false || summaryInputBundle.performanceRecordPersisted !== false) blockers.push("summary_preflight_must_not_persist_ledger_or_performance");
  if (summaryInputBundle.accountBalanceQueried !== false || summaryInputBundle.cashPositionMutated !== false) blockers.push("summary_preflight_must_not_query_or_mutate_account_state");
  if (
    summaryInputBundle.kisOrderPayloadCreated !== false
    || summaryInputBundle.kisExecutionPayloadCreated !== false
    || summaryInputBundle.kisFillPayloadCreated !== false
  ) blockers.push("summary_preflight_must_not_create_kis_payloads");
  const unsafeSummaryKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
  ];
  if (
    containsUnsafeReviewResultInput(input.summaryInput || {})
    || unsafeSummaryKeys.some((key) => Object.prototype.hasOwnProperty.call(summaryInputBundle, key))
  ) blockers.push("unsafe_private_or_payload_value_rejected");
  if (!summaryInputBundle.performanceResultId || summaryInputBundle.performanceResultId.includes("missing")) blockers.push("performance_result_dependency_missing");
  if (!summaryInputBundle.ledgerUpdateResultId || summaryInputBundle.ledgerUpdateResultId.includes("missing")) blockers.push("ledger_update_dependency_missing");
  if (!summaryInputBundle.mockRunCandidateId || summaryInputBundle.mockRunCandidateId.includes("missing")) blockers.push("mock_run_candidate_dependency_missing");
  if (!summaryInputBundle.strategyDraftId || summaryInputBundle.strategyDraftId.includes("missing")) blockers.push("strategy_draft_dependency_missing");
  if (!summaryInputBundle.mockPerformanceSummary || summaryInputBundle.mockPerformanceSummary.redacted !== true) warnings.push("mock_performance_summary_missing");
  if (!summaryInputBundle.mockChartSummary || summaryInputBundle.mockChartSummary.status !== "mock_only") warnings.push("mock_chart_summary_validation_required");
  if (!Array.isArray(summaryInputBundle.mockDashboardSections) || summaryInputBundle.mockDashboardSections.length < 8) warnings.push("mock_dashboard_aggregation_incomplete");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_summary_ready";
  const readyStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "ready";
  const dependencyStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "satisfied";
  const chartStatus = summarizeStep159Status(summaryInputBundle.mockChartSummary?.status);
  const dashboardStatus = Array.isArray(summaryInputBundle.mockDashboardSections) && summaryInputBundle.mockDashboardSections.length >= 8
    ? readyStatus
    : "validation_required";

  return {
    validationId: "step159_mock_trading_run_summary_preflight_validation",
    sourceStep: "step159",
    status,
    tradingRunSummaryPreflightId: "step159_mock_trading_run_summary_preflight",
    summaryInputBundleId: summaryInputBundle.summaryInputBundleId,
    performanceResultId: summaryInputBundle.performanceResultId,
    ledgerUpdateResultId: summaryInputBundle.ledgerUpdateResultId,
    mockFillResultId: summaryInputBundle.mockFillResultId,
    mockRunCandidateId: summaryInputBundle.mockRunCandidateId,
    strategyDraftId: summaryInputBundle.strategyDraftId,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    strategySummaryStatus: readyStatus,
    orderSummaryStatus: readyStatus,
    executionSummaryStatus: readyStatus,
    fillSummaryStatus: readyStatus,
    ledgerSummaryStatus: readyStatus,
    performanceSummaryStatus: readyStatus,
    riskSummaryStatus: readyStatus,
    dashboardAggregationStatus: dashboardStatus,
    chartAggregationStatus: chartStatus === "ready" ? readyStatus : chartStatus,
    dependencyStatus,
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
    orderCandidateCreated: false,
    orderDraftCreated: false,
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    accountBalanceQueried: false,
    cashPositionMutated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step159_mock_trading_run_summary_preflight_validation_v1" }),
  };
}

export function buildTradingLabMockTradingRunSummaryPreflight(input = {}, options = {}) {
  const summaryInputBundle = input.summaryInputBundle || buildTradingLabMockTradingRunSummaryInputBundle(input, options);
  const validation = input.validation || validateTradingLabMockTradingRunSummaryPreflight(
    { ...input, summaryInputBundle },
    options,
  );
  const result = {
    tradingRunSummaryPreflightId: validation.tradingRunSummaryPreflightId,
    sourceStep: "step159",
    summaryInputBundleId: validation.summaryInputBundleId,
    performanceResultId: validation.performanceResultId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    status: validation.status,
    scope: "mock_only",
    redacted: true,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    strategySummaryStatus: validation.strategySummaryStatus,
    orderSummaryStatus: validation.orderSummaryStatus,
    executionSummaryStatus: validation.executionSummaryStatus,
    fillSummaryStatus: validation.fillSummaryStatus,
    ledgerSummaryStatus: validation.ledgerSummaryStatus,
    performanceSummaryStatus: validation.performanceSummaryStatus,
    riskSummaryStatus: validation.riskSummaryStatus,
    dashboardAggregationStatus: validation.dashboardAggregationStatus,
    chartAggregationStatus: validation.chartAggregationStatus,
    dependencyStatus: validation.dependencyStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_trading_run_summary_review_result",
  };

  return {
    ok: true,
    step: "Step 159: Admin trading lab mock trading run summary preflight",
    status: "admin_only_trading_lab_mock_trading_run_summary_preflight_fail_closed",
    sourceStep: "step159",
    mockTradingRunSummaryPreflightModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_MODEL,
    mockTradingRunSummaryInputBundleModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_INPUT_BUNDLE_MODEL,
    mockTradingRunChainDependencyMapModel: TRADING_LAB_MOCK_TRADING_RUN_CHAIN_DEPENDENCY_MAP_MODEL,
    mockTradingRunSummaryPreflightResultSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_RESULT_SCHEMA,
    summaryInputBundle,
    dependencyMap: {
      dependencyMapId: "step159_mock_trading_run_chain_dependency_map",
      sourceStep: "step159",
      strategyDraftStatus: validation.dependencyStatus,
      mockRunCandidateStatus: validation.dependencyStatus,
      mockOrderGenerationStatus: validation.dependencyStatus,
      mockExecutionStatus: validation.dependencyStatus,
      mockFillStatus: validation.dependencyStatus,
      mockLedgerStatus: validation.dependencyStatus,
      mockPerformanceStatus: validation.dependencyStatus,
      dashboardAggregationStatus: validation.dashboardAggregationStatus === "ready" ? "satisfied" : validation.dashboardAggregationStatus,
      chartAggregationStatus: validation.chartAggregationStatus === "ready" ? "satisfied" : validation.chartAggregationStatus,
      redacted: true,
    },
    validation,
    result,
    summary: {
      summaryId: "step159_mock_trading_run_summary_preflight_summary",
      sourceStep: "step159",
      status: validation.status,
      blockerCount: validation.blockerCount,
      warningCount: validation.warningCount,
      blockerSummary: validation.blockerSummary,
      warningSummary: validation.warningSummary,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      nextAllowedStep: "mock_trading_run_summary_review_result",
      redacted: true,
    },
    mockHistory: [
      {
        historyId: "step159_mock_trading_run_summary_preflight_history_1",
        sourceStep: "step159",
        status: validation.status,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_trading_run_summary_review_result",
      },
    ],
    flags: { ...STEP159_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    accountBalanceQueried: false,
    cashPositionMutated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      portfolioLedgerPersistenceAllowed: false,
      performanceRecordPersistenceAllowed: false,
      accountBalanceQueryAllowed: false,
      cashPositionMutationAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step159_mock_trading_run_summary_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockTradingRunSummaryPreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockTradingRunSummaryPreflight(input, options);
}

function getStep160MockTradingRunSummaryReviewResultContext(input = {}, options = {}) {
  const mockTradingRunSummaryPreflightStatus = input.mockTradingRunSummaryPreflightStatus === null
    ? null
    : input.mockTradingRunSummaryPreflightStatus || buildAdminTradingLabMockTradingRunSummaryPreflightStatus(input, options);
  const preflightResult = input.preflightResult
    || mockTradingRunSummaryPreflightStatus?.result
    || null;
  const summaryInputBundle = input.summaryInputBundle
    || mockTradingRunSummaryPreflightStatus?.summaryInputBundle
    || {};
  const validation = input.preflightValidation
    || mockTradingRunSummaryPreflightStatus?.validation
    || {};

  return {
    mockTradingRunSummaryPreflightStatus,
    preflightResult,
    summaryInputBundle,
    validation,
  };
}

function toStep160ReviewStatus(value) {
  if (!value) return "blocked";
  if (["blocked", "validation_required"].includes(value)) return value;
  return "reviewed";
}

export function validateTradingLabMockTradingRunSummaryReviewResult(input = {}, options = {}) {
  const context = getStep160MockTradingRunSummaryReviewResultContext(input, options);
  const preflightStatus = context.mockTradingRunSummaryPreflightStatus || {};
  const preflightResult = input.preflightResult || context.preflightResult || {};
  const summaryInputBundle = input.summaryInputBundle || context.summaryInputBundle || {};
  const preflightValidation = input.preflightValidation || context.validation || {};
  const blockers = [];
  const warnings = [];

  if (!context.mockTradingRunSummaryPreflightStatus) blockers.push("mock_trading_run_summary_preflight_status_missing");
  if (!context.preflightResult) blockers.push("mock_trading_run_summary_preflight_result_missing");
  if (preflightResult.redacted !== true) blockers.push("mock_trading_run_summary_preflight_result_not_redacted");
  if (preflightResult.scope !== "mock_only") blockers.push("mock_trading_run_summary_preflight_scope_not_mock_only");
  if (summaryInputBundle.redacted !== true) blockers.push("mock_trading_run_summary_input_bundle_not_redacted");
  if (summaryInputBundle.scope !== "mock_only") blockers.push("mock_trading_run_summary_input_bundle_scope_not_mock_only");
  if (summaryInputBundle.orderCandidateCreated !== false || summaryInputBundle.orderDraftCreated !== false) blockers.push("summary_review_must_not_create_order_artifacts");
  if (summaryInputBundle.executionRecordCreated !== false || summaryInputBundle.fillRecordCreated !== false) blockers.push("summary_review_must_not_create_execution_or_fill_records");
  if (summaryInputBundle.portfolioLedgerPersisted !== false || summaryInputBundle.performanceRecordPersisted !== false) blockers.push("summary_review_must_not_persist_ledger_or_performance");
  if (summaryInputBundle.dbWriteUsed !== false || summaryInputBundle.persistentStorageUsed !== false) blockers.push("summary_review_must_not_write_db");
  if (summaryInputBundle.accountBalanceQueried !== false || summaryInputBundle.cashPositionMutated !== false) blockers.push("summary_review_must_not_query_or_mutate_account_state");
  if (
    summaryInputBundle.kisOrderPayloadCreated !== false
    || summaryInputBundle.kisExecutionPayloadCreated !== false
    || summaryInputBundle.kisFillPayloadCreated !== false
  ) blockers.push("summary_review_must_not_create_kis_payloads");
  if (preflightResult.readinessImpact !== "none" || preflightStatus.readinessImpact === "ready") blockers.push("summary_review_readiness_impact_not_none");
  if (preflightResult.providerCallImpact !== "blocked") blockers.push("summary_review_provider_call_impact_not_blocked");
  if (preflightResult.orderSubmissionImpact !== "blocked") blockers.push("summary_review_order_submission_impact_not_blocked");
  if (preflightResult.liveTradingImpact !== "blocked") blockers.push("summary_review_live_trading_impact_not_blocked");
  if (preflightResult.status === "blocked") blockers.push("mock_trading_run_summary_preflight_blocked");
  if (preflightResult.status === "validation_required") warnings.push("mock_trading_run_summary_preflight_validation_required");
  if (preflightValidation.blockerCount > 0) blockers.push("mock_trading_run_summary_preflight_has_blockers");
  if (preflightValidation.warningCount > 0) warnings.push("mock_trading_run_summary_preflight_has_warnings");
  if (containsUnsafeReviewResultInput(input.reviewInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");
  const unsafeKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "kisOrderPayload",
    "kisExecutionPayload",
    "kisFillPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
    "realOrderIdentifier",
    "realExecutionIdentifier",
    "realFillIdentifier",
    "realAccountBalance",
    "realPerformanceRecordIdentifier",
    "realTradingRunIdentifier",
  ];
  if (unsafeKeys.some((key) => Object.prototype.hasOwnProperty.call(preflightResult, key) || Object.prototype.hasOwnProperty.call(summaryInputBundle, key))) {
    blockers.push("unsafe_actual_or_private_identifier_rejected");
  }
  if (!preflightResult.tradingRunSummaryPreflightId) blockers.push("trading_run_summary_preflight_dependency_missing");
  if (!preflightResult.summaryInputBundleId) blockers.push("summary_input_bundle_dependency_missing");
  if (!preflightResult.performanceResultId || String(preflightResult.performanceResultId).includes("missing")) blockers.push("performance_result_dependency_missing");
  if (!preflightResult.ledgerUpdateResultId || String(preflightResult.ledgerUpdateResultId).includes("missing")) blockers.push("ledger_update_dependency_missing");

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";
  const decision = reviewStatus === "recorded" ? "mock_trading_run_summary_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected";

  return {
    validationId: "step160_mock_trading_run_summary_review_validation",
    sourceStep: "step160",
    reviewStatus,
    decision,
    tradingRunSummaryReviewResultId: "step160_mock_trading_run_summary_review_result",
    tradingRunSummaryPreflightId: preflightResult.tradingRunSummaryPreflightId || "step159_mock_trading_run_summary_preflight",
    summaryInputBundleId: preflightResult.summaryInputBundleId || summaryInputBundle.summaryInputBundleId || "step159_mock_trading_run_summary_input_bundle",
    performanceResultId: preflightResult.performanceResultId || summaryInputBundle.performanceResultId || "step160_missing_performance_result",
    ledgerUpdateResultId: preflightResult.ledgerUpdateResultId || summaryInputBundle.ledgerUpdateResultId || "step160_missing_ledger_update_result",
    mockFillResultId: preflightResult.mockFillResultId || summaryInputBundle.mockFillResultId || "step148_mock_fill_result",
    mockRunCandidateId: preflightResult.mockRunCandidateId || summaryInputBundle.mockRunCandidateId || "step160_missing_mock_run_candidate",
    strategyDraftId: preflightResult.strategyDraftId || summaryInputBundle.strategyDraftId || "step160_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    strategySummaryReviewStatus: toStep160ReviewStatus(preflightResult.strategySummaryStatus),
    orderSummaryReviewStatus: toStep160ReviewStatus(preflightResult.orderSummaryStatus),
    executionSummaryReviewStatus: toStep160ReviewStatus(preflightResult.executionSummaryStatus),
    fillSummaryReviewStatus: toStep160ReviewStatus(preflightResult.fillSummaryStatus),
    ledgerSummaryReviewStatus: toStep160ReviewStatus(preflightResult.ledgerSummaryStatus),
    performanceSummaryReviewStatus: toStep160ReviewStatus(preflightResult.performanceSummaryStatus),
    riskSummaryReviewStatus: toStep160ReviewStatus(preflightResult.riskSummaryStatus),
    dashboardAggregationReviewStatus: toStep160ReviewStatus(preflightResult.dashboardAggregationStatus),
    chartAggregationReviewStatus: toStep160ReviewStatus(preflightResult.chartAggregationStatus),
    dependencyReviewStatus: toStep160ReviewStatus(preflightResult.dependencyStatus),
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
    orderCandidateCreated: false,
    orderDraftCreated: false,
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step160_mock_trading_run_summary_review_validation_v1" }),
  };
}

export function buildTradingLabMockTradingRunSummaryReviewResult(input = {}, options = {}) {
  const context = getStep160MockTradingRunSummaryReviewResultContext(input, options);
  const validation = input.validation || validateTradingLabMockTradingRunSummaryReviewResult(input, options);
  const reviewResult = {
    tradingRunSummaryReviewResultId: validation.tradingRunSummaryReviewResultId,
    sourceStep: "step160",
    tradingRunSummaryPreflightId: validation.tradingRunSummaryPreflightId,
    summaryInputBundleId: validation.summaryInputBundleId,
    performanceResultId: validation.performanceResultId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_recorded_at",
    reviewedBy: "admin_placeholder",
    summary: [
      "FINPLE internal mock trading run summary review only",
      "Not a stored trading run summary",
      "No actual trading run id, performance record, cash update, position update, or DB write",
      "KIS/provider calls and order submission remain blocked",
      "External order authority approval evidence is still required",
    ],
    blockers: validation.blockerSummary,
    warnings: validation.warningSummary,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
  const receipt = {
    receiptId: "step160_mock_trading_run_summary_review_receipt",
    sourceStep: "step160",
    tradingRunSummaryReviewResultId: validation.tradingRunSummaryReviewResultId,
    tradingRunSummaryPreflightId: validation.tradingRunSummaryPreflightId,
    summaryInputBundleId: validation.summaryInputBundleId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    redacted: true,
    recordedAt: "placeholder_recorded_at",
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    strategySummaryReviewStatus: validation.strategySummaryReviewStatus,
    orderSummaryReviewStatus: validation.orderSummaryReviewStatus,
    executionSummaryReviewStatus: validation.executionSummaryReviewStatus,
    fillSummaryReviewStatus: validation.fillSummaryReviewStatus,
    ledgerSummaryReviewStatus: validation.ledgerSummaryReviewStatus,
    performanceSummaryReviewStatus: validation.performanceSummaryReviewStatus,
    riskSummaryReviewStatus: validation.riskSummaryReviewStatus,
    dashboardAggregationReviewStatus: validation.dashboardAggregationReviewStatus,
    chartAggregationReviewStatus: validation.chartAggregationReviewStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_trading_run_summary_core",
  };
  const sectionReviewSummary = {
    summaryId: "step160_mock_trading_run_summary_section_review_summary",
    sourceStep: "step160",
    strategySummaryReviewStatus: validation.strategySummaryReviewStatus,
    orderSummaryReviewStatus: validation.orderSummaryReviewStatus,
    executionSummaryReviewStatus: validation.executionSummaryReviewStatus,
    fillSummaryReviewStatus: validation.fillSummaryReviewStatus,
    ledgerSummaryReviewStatus: validation.ledgerSummaryReviewStatus,
    performanceSummaryReviewStatus: validation.performanceSummaryReviewStatus,
    riskSummaryReviewStatus: validation.riskSummaryReviewStatus,
    dashboardAggregationReviewStatus: validation.dashboardAggregationReviewStatus,
    chartAggregationReviewStatus: validation.chartAggregationReviewStatus,
    dependencyReviewStatus: validation.dependencyReviewStatus,
    redacted: true,
    realTradingRunIdentifierCreated: false,
    actualPerformanceRecordStored: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
  const decisionSummary = {
    summaryId: "step160_mock_trading_run_summary_review_decision_summary",
    sourceStep: "step160",
    decision: validation.decision,
    reviewStatus: validation.reviewStatus,
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    blockers: validation.blockerSummary,
    warnings: validation.warningSummary,
    messages: reviewResult.summary,
    externalOrderAuthorityRequired: true,
    realTradingRunSummaryStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };

  return {
    ok: true,
    step: "Step 160: Admin trading lab mock trading run summary review result recording gate",
    status: "admin_only_trading_lab_mock_trading_run_summary_review_result_fail_closed",
    sourceStep: "step160",
    mockTradingRunSummaryReviewResultModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_MODEL,
    mockTradingRunSummaryReviewReceiptSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RECEIPT_SCHEMA,
    mockTradingRunSummaryReviewDecisionSummaryModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_DECISION_SUMMARY_MODEL,
    mockTradingRunSummaryReviewSectionSummaryModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_SECTION_SUMMARY_MODEL,
    dependency: {
      dependencyId: "step160_mock_trading_run_summary_review_dependency",
      sourceStep: "step160",
      tradingRunSummaryPreflightId: validation.tradingRunSummaryPreflightId,
      step159Required: true,
      preflightStatus: context.preflightResult?.status || "blocked",
      scope: context.preflightResult?.scope || "mock_only",
      redacted: true,
    },
    validation,
    reviewResult,
    receipt,
    sectionReviewSummary,
    decisionSummary,
    mockHistory: [
      {
        historyId: "step160_mock_trading_run_summary_review_history_1",
        sourceStep: "step160",
        reviewStatus: validation.reviewStatus,
        decision: validation.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_trading_run_summary_core",
      },
    ],
    flags: { ...STEP160_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      tradingRunSummaryPersistenceAllowed: false,
      performanceRecordPersistenceAllowed: false,
      accountBalanceQueryAllowed: false,
      cashPositionMutationAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step160_mock_trading_run_summary_review_result_status_v1" }),
  };
}

export function buildAdminTradingLabMockTradingRunSummaryReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockTradingRunSummaryReviewResult(input, options);
}

function getStep161MockTradingRunSummaryCoreContext(input = {}, options = {}) {
  const mockTradingRunSummaryPreflightStatus = input.mockTradingRunSummaryPreflightStatus === null
    ? null
    : input.mockTradingRunSummaryPreflightStatus || buildAdminTradingLabMockTradingRunSummaryPreflightStatus(input, options);
  const mockTradingRunSummaryReviewResultStatus = input.mockTradingRunSummaryReviewResultStatus === null
    ? null
    : input.mockTradingRunSummaryReviewResultStatus || buildAdminTradingLabMockTradingRunSummaryReviewResultStatus(
      {
        ...input,
        mockTradingRunSummaryPreflightStatus,
      },
      options,
    );
  const reviewResult = input.reviewResult
    || mockTradingRunSummaryReviewResultStatus?.reviewResult
    || null;
  const reviewReceipt = input.reviewReceipt
    || mockTradingRunSummaryReviewResultStatus?.receipt
    || {};
  const reviewSectionSummary = input.reviewSectionSummary
    || mockTradingRunSummaryReviewResultStatus?.sectionReviewSummary
    || {};
  const summaryInputBundle = input.summaryInputBundle
    || mockTradingRunSummaryPreflightStatus?.summaryInputBundle
    || {};

  return {
    mockTradingRunSummaryPreflightStatus,
    mockTradingRunSummaryReviewResultStatus,
    reviewResult,
    reviewReceipt,
    reviewSectionSummary,
    summaryInputBundle,
  };
}

function normalizeStep161SummaryStatus(value) {
  if (!value) return "blocked";
  if (["blocked", "validation_required"].includes(value)) return value;
  return "mock_only";
}

function summarizeChartPoints(points, valueKey) {
  const rows = Array.isArray(points) ? points : [];
  const values = rows.map((point) => Number(point?.[valueKey] || 0)).filter((value) => Number.isFinite(value));
  return {
    pointCount: rows.length,
    firstValue: values.length > 0 ? values[0] : 0,
    lastValue: values.length > 0 ? values[values.length - 1] : 0,
    status: rows.length > 0 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
  };
}

export function buildTradingLabMockTradingRunDashboardAggregationResult(input = {}, options = {}) {
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries({ ...options, mockLedger });
  const performance = input.performance || buildTradingLabCumulativePerformance({ ...options, mockLedger, dailyReturns });
  const positions = input.positions || buildTradingLabPositionSnapshot({ ...options, mockLedger });
  const orderCandidates = input.orderCandidates || buildTradingLabOrderCandidateSummary(options);
  const kpiCards = input.kpiCards || buildTradingLabKpiSummaryCards(
    { performance, dailyReturns, positions, orderCandidates },
    options,
  );
  const kpiCardRows = Array.isArray(kpiCards) ? kpiCards : Array.isArray(kpiCards.cards) ? kpiCards.cards : [];
  const equityPoints = input.equityPoints || input.equityVisualization?.points || dailyReturns.rows || [];
  const returnPoints = input.returnPoints || input.returnVisualization?.points || dailyReturns.rows || [];
  const allocationRows = input.allocationRows || input.allocationVisualization?.allocations || positions.positions || [];
  const status = kpiCardRows.length > 0 ? "calculated" : "validation_required";

  return {
    dashboardAggregationResultId: "step161_mock_trading_run_dashboard_aggregation_result",
    sourceStep: "step161",
    kpiCards: kpiCardRows,
    equityChartSummary: summarizeChartPoints(equityPoints, "equityPlaceholder"),
    returnChartSummary: summarizeChartPoints(returnPoints, "cumulativeReturnPct"),
    drawdownChartSummary: summarizeChartPoints(input.drawdownPoints || returnPoints, "drawdownPct"),
    allocationSummary: {
      itemCount: Array.isArray(allocationRows) ? allocationRows.length : 0,
      status: Array.isArray(allocationRows) && allocationRows.length > 0 ? "calculated" : "validation_required",
      deterministic: true,
      redacted: true,
    },
    positionSummary: {
      positionCount: Array.isArray(positions.positions) ? positions.positions.length : 0,
      status: "mock_only",
      accountBalanceQueried: false,
      redacted: true,
    },
    mockRunStatusSummary: {
      status: "mock_only",
      sourceStep: "step161",
      redacted: true,
    },
    riskSafetyStatusSummary: {
      status: "blocked",
      externalOrderAuthorityRequired: true,
      readinessImpact: "none",
      providerCallImpact: "blocked",
      orderSubmissionImpact: "blocked",
      liveTradingImpact: "blocked",
      redacted: true,
    },
    status,
    deterministic: true,
    redacted: true,
  };
}

export function buildTradingLabMockTradingRunChartAggregationResult(input = {}, options = {}) {
  const mockLedger = input.mockLedger || buildTradingLabMockLedger(options);
  const dailyReturns = input.dailyReturns || buildTradingLabDailyReturnSeries({ ...options, mockLedger });
  const equityChartData = input.equityChartData || input.equityVisualization?.points || dailyReturns.rows || [];
  const returnChartData = input.returnChartData || input.returnVisualization?.points || dailyReturns.rows || [];
  const drawdownChartData = input.drawdownChartData || dailyReturns.rows || [];
  const allocationChartData = input.allocationChartData || input.allocationVisualization?.allocations || [];

  return {
    chartAggregationResultId: "step161_mock_trading_run_chart_aggregation_result",
    sourceStep: "step161",
    equityChartData,
    returnChartData,
    drawdownChartData,
    allocationChartData,
    status: equityChartData.length > 0 && returnChartData.length > 0 ? "calculated" : "validation_required",
    deterministic: true,
    redacted: true,
    providerCallsAllowed: false,
    quoteRequestAttempted: false,
    rawProviderResponseStored: false,
  };
}

export function validateTradingLabMockTradingRunSummaryCore(input = {}, options = {}) {
  const context = getStep161MockTradingRunSummaryCoreContext(input, options);
  const reviewStatus = context.mockTradingRunSummaryReviewResultStatus || {};
  const reviewResult = input.reviewResult || context.reviewResult || {};
  const reviewReceipt = input.reviewReceipt || context.reviewReceipt || {};
  const reviewSectionSummary = input.reviewSectionSummary || context.reviewSectionSummary || {};
  const summaryInputBundle = input.summaryInputBundle || context.summaryInputBundle || {};
  const dashboardAggregation = input.dashboardAggregation || buildTradingLabMockTradingRunDashboardAggregationResult(input.dashboardAggregationInput || input, options);
  const chartAggregation = input.chartAggregation || buildTradingLabMockTradingRunChartAggregationResult(input.chartAggregationInput || input, options);
  const blockers = [];
  const warnings = [];

  if (!context.mockTradingRunSummaryReviewResultStatus) blockers.push("mock_trading_run_summary_review_result_status_missing");
  if (!context.reviewResult) blockers.push("mock_trading_run_summary_review_result_missing");
  if (reviewResult.redacted !== true) blockers.push("mock_trading_run_summary_review_result_not_redacted");
  if (reviewResult.reviewStatus !== "recorded") blockers.push("mock_trading_run_summary_review_result_not_recorded");
  if (reviewReceipt.redacted !== true) blockers.push("mock_trading_run_summary_review_receipt_not_redacted");
  if (reviewReceipt.nextAllowedStep !== "mock_trading_run_summary_core") blockers.push("mock_trading_run_summary_core_not_allowed_by_step160");
  if (reviewResult.readinessImpact !== "none" || reviewStatus.readinessImpact === "ready") blockers.push("summary_core_readiness_impact_not_none");
  if (reviewResult.providerCallImpact !== "blocked") blockers.push("summary_core_provider_call_impact_not_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked") blockers.push("summary_core_order_submission_impact_not_blocked");
  if (reviewResult.liveTradingImpact !== "blocked") blockers.push("summary_core_live_trading_impact_not_blocked");
  if (summaryInputBundle.redacted !== true) blockers.push("mock_trading_run_summary_input_bundle_not_redacted");
  if (summaryInputBundle.scope !== "mock_only") blockers.push("mock_trading_run_summary_input_bundle_scope_not_mock_only");
  if (summaryInputBundle.dbWriteUsed !== false || summaryInputBundle.persistentStorageUsed !== false) blockers.push("summary_core_must_not_write_db");
  if (summaryInputBundle.orderCandidateCreated !== false || summaryInputBundle.orderDraftCreated !== false) blockers.push("summary_core_must_not_create_order_artifacts");
  if (summaryInputBundle.executionRecordCreated !== false || summaryInputBundle.fillRecordCreated !== false) blockers.push("summary_core_must_not_create_execution_or_fill_records");
  if (summaryInputBundle.portfolioLedgerPersisted !== false || summaryInputBundle.performanceRecordPersisted !== false) blockers.push("summary_core_must_not_persist_ledger_or_performance");
  if (summaryInputBundle.accountBalanceQueried !== false || summaryInputBundle.cashPositionMutated !== false) blockers.push("summary_core_must_not_query_or_mutate_account_state");
  if (
    summaryInputBundle.kisOrderPayloadCreated !== false
    || summaryInputBundle.kisExecutionPayloadCreated !== false
    || summaryInputBundle.kisFillPayloadCreated !== false
  ) blockers.push("summary_core_must_not_create_kis_payloads");
  if (reviewSectionSummary.realTradingRunIdentifierCreated !== false) blockers.push("summary_core_must_not_create_real_trading_run_identifier");
  if (reviewSectionSummary.actualPerformanceRecordStored !== false) blockers.push("summary_core_must_not_store_performance_record");
  if (reviewSectionSummary.actualCashUpdated !== false || reviewSectionSummary.actualPositionUpdated !== false) blockers.push("summary_core_must_not_mutate_account_state");
  if (dashboardAggregation.redacted !== true || dashboardAggregation.deterministic !== true) blockers.push("dashboard_aggregation_must_be_redacted_and_deterministic");
  if (chartAggregation.redacted !== true || chartAggregation.deterministic !== true) blockers.push("chart_aggregation_must_be_redacted_and_deterministic");
  if (dashboardAggregation.status !== "calculated") warnings.push("dashboard_aggregation_validation_required");
  if (chartAggregation.status !== "calculated") warnings.push("chart_aggregation_validation_required");
  if (containsUnsafeReviewResultInput(input.summaryInput || {})) blockers.push("unsafe_private_or_payload_value_rejected");
  const unsafeKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "kisOrderPayload",
    "kisExecutionPayload",
    "kisFillPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
    "realOrderIdentifier",
    "realExecutionIdentifier",
    "realFillIdentifier",
    "realAccountBalance",
    "realPerformanceRecordIdentifier",
    "realTradingRunIdentifier",
  ];
  if (unsafeKeys.some((key) => Object.prototype.hasOwnProperty.call(reviewResult, key) || Object.prototype.hasOwnProperty.call(summaryInputBundle, key))) {
    blockers.push("unsafe_actual_or_private_identifier_rejected");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const summaryStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_summary_calculated";

  return {
    validationId: "step161_mock_trading_run_summary_core_validation",
    sourceStep: "step161",
    summaryStatus,
    tradingRunSummaryCoreId: "step161_mock_trading_run_summary_core",
    tradingRunSummaryResultId: "step161_mock_trading_run_summary_result",
    tradingRunSummaryReviewResultId: reviewResult.tradingRunSummaryReviewResultId || "step160_mock_trading_run_summary_review_result",
    tradingRunSummaryPreflightId: reviewResult.tradingRunSummaryPreflightId || reviewReceipt.tradingRunSummaryPreflightId || "step159_mock_trading_run_summary_preflight",
    summaryInputBundleId: reviewResult.summaryInputBundleId || summaryInputBundle.summaryInputBundleId || "step159_mock_trading_run_summary_input_bundle",
    performanceResultId: reviewResult.performanceResultId || summaryInputBundle.performanceResultId || "step161_missing_performance_result",
    ledgerUpdateResultId: reviewResult.ledgerUpdateResultId || summaryInputBundle.ledgerUpdateResultId || "step161_missing_ledger_update_result",
    mockFillResultId: reviewResult.mockFillResultId || summaryInputBundle.mockFillResultId || "step148_mock_fill_result",
    mockRunCandidateId: reviewResult.mockRunCandidateId || summaryInputBundle.mockRunCandidateId || "step161_missing_mock_run_candidate",
    strategyDraftId: reviewResult.strategyDraftId || summaryInputBundle.strategyDraftId || "step161_missing_strategy_draft",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    deterministicAggregationStatus: "deterministic",
    dashboardAggregationStatus: dashboardAggregation.status,
    chartAggregationStatus: chartAggregation.status,
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
    orderCandidateCreated: false,
    orderDraftCreated: false,
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step161_mock_trading_run_summary_core_validation_v1" }),
  };
}

export function buildTradingLabMockTradingRunSummaryCore(input = {}, options = {}) {
  const context = getStep161MockTradingRunSummaryCoreContext(input, options);
  const summaryInputBundle = input.summaryInputBundle || context.summaryInputBundle || {};
  const dashboardAggregation = input.dashboardAggregation || buildTradingLabMockTradingRunDashboardAggregationResult(input.dashboardAggregationInput || input, options);
  const chartAggregation = input.chartAggregation || buildTradingLabMockTradingRunChartAggregationResult(input.chartAggregationInput || input, options);
  const validation = input.validation || validateTradingLabMockTradingRunSummaryCore(
    {
      ...input,
      dashboardAggregation,
      chartAggregation,
      summaryInputBundle,
    },
    options,
  );
  const strategySummary = {
    strategySummaryResultId: "step161_mock_strategy_summary_result",
    sourceStep: "step161",
    strategyDraftId: validation.strategyDraftId,
    mode: "mock",
    scope: "mock_only",
    status: normalizeStep161SummaryStatus(context.reviewSectionSummary?.strategySummaryReviewStatus),
    strategyName: summaryInputBundle.strategySnapshot?.strategyDraftId || validation.strategyDraftId,
    redacted: true,
  };
  const orderExecutionFillSummary = {
    summaryResultId: "step161_mock_order_execution_fill_summary_result",
    sourceStep: "step161",
    orderSummaryStatus: normalizeStep161SummaryStatus(context.reviewSectionSummary?.orderSummaryReviewStatus),
    executionSummaryStatus: normalizeStep161SummaryStatus(context.reviewSectionSummary?.executionSummaryReviewStatus),
    fillSummaryStatus: normalizeStep161SummaryStatus(context.reviewSectionSummary?.fillSummaryReviewStatus),
    orderCandidateCreated: false,
    orderDraftCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    redacted: true,
  };
  const ledgerSummary = {
    ledgerSummaryResultId: "step161_mock_ledger_summary_result",
    sourceStep: "step161",
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    status: normalizeStep161SummaryStatus(context.reviewSectionSummary?.ledgerSummaryReviewStatus),
    portfolioLedgerPersisted: false,
    cashPositionMutated: false,
    redacted: true,
  };
  const performanceSummary = {
    performanceSummaryResultId: "step161_mock_performance_summary_result",
    sourceStep: "step161",
    performanceResultId: validation.performanceResultId,
    status: normalizeStep161SummaryStatus(context.reviewSectionSummary?.performanceSummaryReviewStatus),
    totalEquity: roundMoney(summaryInputBundle.mockPerformanceSummary?.totalEquity || 0),
    cumulativeReturn: roundPct(summaryInputBundle.mockPerformanceSummary?.cumulativeReturn || 0),
    mdd: roundPct(summaryInputBundle.mockPerformanceSummary?.mdd || 0),
    performanceRecordPersisted: false,
    redacted: true,
  };
  const riskSafetySummary = {
    riskSafetySummaryResultId: "step161_mock_risk_safety_summary_result",
    sourceStep: "step161",
    riskStatus: normalizeStep161SummaryStatus(context.reviewSectionSummary?.riskSummaryReviewStatus),
    safetyStatus: "blocked",
    externalOrderAuthorityRequired: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
  };
  const result = {
    tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
    sourceStep: "step161",
    tradingRunSummaryReviewResultId: validation.tradingRunSummaryReviewResultId,
    tradingRunSummaryPreflightId: validation.tradingRunSummaryPreflightId,
    summaryInputBundleId: validation.summaryInputBundleId,
    performanceResultId: validation.performanceResultId,
    ledgerUpdateResultId: validation.ledgerUpdateResultId,
    mockFillResultId: validation.mockFillResultId,
    mockRunCandidateId: validation.mockRunCandidateId,
    strategyDraftId: validation.strategyDraftId,
    scope: "mock_only",
    summaryStatus: validation.summaryStatus,
    strategySummary,
    orderSummary: summaryInputBundle.mockOrderSummaryPlaceholder || orderExecutionFillSummary,
    executionSummary: summaryInputBundle.mockExecutionSummaryPlaceholder || orderExecutionFillSummary,
    fillSummary: summaryInputBundle.mockFillSummary || orderExecutionFillSummary,
    ledgerSummary,
    performanceSummary,
    riskSummary: riskSafetySummary,
    safetySummary: riskSafetySummary,
    dashboardAggregation,
    chartAggregation,
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_trading_run_dashboard_cleanup_preflight",
  };

  return {
    ok: true,
    step: "Step 161: Admin trading lab mock trading run summary core",
    status: "admin_only_trading_lab_mock_trading_run_summary_core_fail_closed",
    sourceStep: "step161",
    mockTradingRunSummaryCoreModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_MODEL,
    mockTradingRunSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_MODEL,
    mockStrategySummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_STRATEGY_SUMMARY_RESULT_MODEL,
    mockOrderExecutionFillSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_ORDER_EXECUTION_FILL_SUMMARY_RESULT_MODEL,
    mockLedgerSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_LEDGER_SUMMARY_RESULT_MODEL,
    mockPerformanceSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_PERFORMANCE_SUMMARY_RESULT_MODEL,
    mockRiskSafetySummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_RISK_SAFETY_SUMMARY_RESULT_MODEL,
    mockDashboardAggregationResultModel: TRADING_LAB_MOCK_TRADING_RUN_DASHBOARD_AGGREGATION_RESULT_MODEL,
    mockChartAggregationResultModel: TRADING_LAB_MOCK_TRADING_RUN_CHART_AGGREGATION_RESULT_MODEL,
    mockTradingRunSummaryResultSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_SCHEMA,
    dependency: {
      dependencyId: "step161_mock_trading_run_summary_core_dependency",
      sourceStep: "step161",
      tradingRunSummaryReviewResultId: validation.tradingRunSummaryReviewResultId,
      step160Required: true,
      reviewStatus: context.reviewResult?.reviewStatus || "blocked",
      redacted: true,
    },
    validation,
    result,
    dashboardAggregation,
    chartAggregation,
    strategySummary,
    orderExecutionFillSummary,
    ledgerSummary,
    performanceSummary,
    riskSafetySummary,
    mockHistory: [
      {
        historyId: "step161_mock_trading_run_summary_core_history_1",
        sourceStep: "step161",
        summaryStatus: validation.summaryStatus,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_trading_run_dashboard_cleanup_preflight",
      },
    ],
    flags: { ...STEP161_ADMIN_TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      tradingRunSummaryPersistenceAllowed: false,
      performanceRecordPersistenceAllowed: false,
      accountBalanceQueryAllowed: false,
      cashPositionMutationAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step161_mock_trading_run_summary_core_status_v1" }),
  };
}

export function buildAdminTradingLabMockTradingRunSummaryCoreStatus(input = {}, options = {}) {
  return buildTradingLabMockTradingRunSummaryCore(input, options);
}

function getStep162MockDashboardCleanupContext(input = {}, options = {}) {
  const mockTradingRunSummaryCoreStatus = input.mockTradingRunSummaryCoreStatus || buildAdminTradingLabMockTradingRunSummaryCoreStatus(input, options);
  const summaryResult = input.summaryResult || mockTradingRunSummaryCoreStatus.result || {};
  return {
    mockTradingRunSummaryCoreStatus,
    summaryResult,
    dashboardAggregation: input.dashboardAggregation || mockTradingRunSummaryCoreStatus.dashboardAggregation || summaryResult.dashboardAggregation || {},
    chartAggregation: input.chartAggregation || mockTradingRunSummaryCoreStatus.chartAggregation || summaryResult.chartAggregation || {},
  };
}

export function buildTradingLabMockDashboardSectionInventory(input = {}) {
  const sections = input.sections || [
    {
      sectionId: "mock_trading_run_summary_result",
      sourceStep: "step161",
      title: "Mock trading run summary result",
      group: "overview",
      priority: "primary",
      defaultCollapsed: false,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      endpoint: "/admin/trading-readiness/trading-lab-mock-trading-run-summary-core",
      redacted: true,
    },
    {
      sectionId: "mock_kpi_cards",
      sourceStep: "step132",
      title: "Mock KPI cards",
      group: "overview",
      priority: "primary",
      defaultCollapsed: false,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_chart_summary",
      sourceStep: "step161",
      title: "Mock chart summary",
      group: "overview",
      priority: "primary",
      defaultCollapsed: false,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_allocation_summary",
      sourceStep: "step132",
      title: "Mock allocation summary",
      group: "overview",
      priority: "primary",
      defaultCollapsed: false,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "strategy_draft_review_clearance",
      sourceStep: "step134_step138",
      title: "Strategy draft review and clearance",
      group: "strategy_detail",
      priority: "detail",
      defaultCollapsed: true,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_order_execution_fill_flow",
      sourceStep: "step139_step148",
      title: "Mock order execution fill flow",
      group: "mock_flow_detail",
      priority: "detail",
      defaultCollapsed: true,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_ledger_update_flow",
      sourceStep: "step149_step153",
      title: "Mock ledger update flow",
      group: "mock_flow_detail",
      priority: "detail",
      defaultCollapsed: true,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_performance_recalculation_flow",
      sourceStep: "step154_step158",
      title: "Mock performance recalculation flow",
      group: "mock_flow_detail",
      priority: "detail",
      defaultCollapsed: true,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "mock_trading_run_summary_flow",
      sourceStep: "step159_step161",
      title: "Mock trading run summary flow",
      group: "mock_flow_detail",
      priority: "detail",
      defaultCollapsed: true,
      visibleInLabTab: true,
      visibleInSafetyTab: false,
      redacted: true,
    },
    {
      sectionId: "safety_audit_detail",
      sourceStep: "step116_step161",
      title: "Safety audit detail",
      group: "safety_detail",
      priority: "safety",
      defaultCollapsed: true,
      visibleInLabTab: false,
      visibleInSafetyTab: true,
      redacted: true,
    },
  ];
  const sectionIds = sections.map((section) => section.sectionId);
  const duplicateSectionIds = sectionIds.filter((sectionId, index) => sectionIds.indexOf(sectionId) !== index);
  const primarySectionCount = sections.filter((section) => section.priority === "primary").length;
  const detailSectionCount = sections.filter((section) => section.priority === "detail").length;

  return {
    sectionInventoryId: "step162_mock_dashboard_section_inventory",
    sourceStep: "step162",
    sections,
    sectionCount: sections.length,
    primarySectionCount,
    detailSectionCount,
    duplicateSectionIds: [...new Set(duplicateSectionIds)],
    deterministic: input.deterministic !== false,
    redacted: input.redacted !== false,
    status: duplicateSectionIds.length > 0 || input.deterministic === false || input.redacted === false
      ? "validation_required"
      : "mock_inventory_ready",
  };
}

export function buildTradingLabMockDashboardPriorityLayout(input = {}) {
  const primaryOrder = input.primaryOrder || [
    "mock_trading_run_summary_result",
    "mock_kpi_cards",
    "mock_chart_summary",
    "mock_allocation_summary",
  ];
  const detailOrder = input.detailOrder || [
    "strategy_draft_review_clearance",
    "mock_order_execution_fill_flow",
    "mock_ledger_update_flow",
    "mock_performance_recalculation_flow",
    "mock_trading_run_summary_flow",
    "safety_audit_detail",
  ];

  return {
    priorityLayoutId: "step162_mock_dashboard_priority_layout",
    sourceStep: "step162",
    priorityMode: "summary_first",
    primaryOrder,
    detailOrder,
    summaryFirstSectionId: primaryOrder[0] || "blocked",
    safetyPanelSeparated: input.safetyPanelSeparated !== false,
    adminOnly: true,
    deterministic: input.deterministic !== false,
    redacted: input.redacted !== false,
    status: primaryOrder[0] === "mock_trading_run_summary_result" && input.deterministic !== false && input.redacted !== false
      ? "mock_layout_ready"
      : "validation_required",
  };
}

export function buildTradingLabMockDashboardCollapsibleSectionPlan(input = {}) {
  const groups = input.groups || [
    {
      groupId: "strategy_draft_review_clearance",
      title: "Strategy draft review and clearance",
      sourceSteps: ["step134", "step135", "step136", "step137", "step138"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_order_execution_fill_flow",
      title: "Mock order execution fill flow",
      sourceSteps: ["step139", "step140", "step141", "step142", "step143", "step144", "step145", "step146", "step147", "step148"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_ledger_update_flow",
      title: "Mock ledger update flow",
      sourceSteps: ["step149", "step150", "step151", "step152", "step153"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_performance_recalculation_flow",
      title: "Mock performance recalculation flow",
      sourceSteps: ["step154", "step155", "step156", "step157", "step158"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_trading_run_summary_flow",
      title: "Mock trading run summary flow",
      sourceSteps: ["step159", "step160", "step161"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "safety_audit_detail",
      title: "Safety audit detail",
      sourceSteps: ["step116", "step117", "step118", "step119", "step120", "step121"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
  ];

  return {
    collapsibleSectionPlanId: "step162_mock_dashboard_collapsible_section_plan",
    sourceStep: "step162",
    groups,
    groupCount: groups.length,
    defaultCollapsed: true,
    preservesExistingSections: true,
    deletesExistingSections: false,
    deterministic: input.deterministic !== false,
    redacted: input.redacted !== false,
    status: groups.length > 0 && input.deterministic !== false && input.redacted !== false
      ? "mock_collapsible_plan_ready"
      : "validation_required",
  };
}

export function validateTradingLabMockDashboardCleanupPreflight(input = {}, options = {}) {
  const context = getStep162MockDashboardCleanupContext(input, options);
  const summaryStatus = context.mockTradingRunSummaryCoreStatus || {};
  const summaryResult = context.summaryResult || {};
  const sectionInventory = input.sectionInventory || buildTradingLabMockDashboardSectionInventory(input.sectionInventoryInput || {});
  const priorityLayout = input.priorityLayout || buildTradingLabMockDashboardPriorityLayout(input.priorityLayoutInput || {});
  const collapsibleSectionPlan = input.collapsibleSectionPlan || buildTradingLabMockDashboardCollapsibleSectionPlan(input.collapsibleSectionPlanInput || {});
  const blockers = [];
  const warnings = [];

  if (!summaryStatus || Object.keys(summaryStatus).length === 0) blockers.push("step161_mock_trading_run_summary_core_required");
  if (!summaryResult || Object.keys(summaryResult).length === 0) blockers.push("step161_mock_trading_run_summary_result_required");
  if (summaryResult.redacted !== true) blockers.push("step161_summary_result_must_be_redacted");
  if (summaryResult.scope !== "mock_only") blockers.push("step161_summary_scope_must_be_mock_only");
  if (summaryResult.readinessImpact !== "none") blockers.push("readiness_impact_must_remain_none");
  if (summaryResult.providerCallImpact !== "blocked") blockers.push("provider_call_impact_must_remain_blocked");
  if (summaryResult.orderSubmissionImpact !== "blocked") blockers.push("order_submission_impact_must_remain_blocked");
  if (summaryResult.liveTradingImpact !== "blocked") blockers.push("live_trading_impact_must_remain_blocked");
  if (summaryResult.summaryStatus !== "mock_summary_calculated") warnings.push("step161_summary_status_requires_review");
  if (summaryResult.nextAllowedStep !== "mock_trading_run_dashboard_cleanup_preflight") warnings.push("step161_next_step_requires_dashboard_cleanup_preflight");
  if (context.dashboardAggregation?.redacted !== true || context.dashboardAggregation?.deterministic !== true) warnings.push("dashboard_aggregation_must_stay_redacted_deterministic");
  if (context.chartAggregation?.redacted !== true || context.chartAggregation?.deterministic !== true) warnings.push("chart_aggregation_must_stay_redacted_deterministic");
  if (sectionInventory.redacted !== true || sectionInventory.deterministic !== true) blockers.push("section_inventory_must_be_redacted_deterministic");
  if ((sectionInventory.duplicateSectionIds || []).length > 0) blockers.push("dashboard_section_inventory_must_not_have_duplicate_ids");
  if ((sectionInventory.primarySectionCount || 0) < 4) warnings.push("summary_first_primary_sections_required");
  if ((sectionInventory.detailSectionCount || 0) < 4) warnings.push("mock_detail_sections_should_be_grouped");
  if (priorityLayout.redacted !== true || priorityLayout.deterministic !== true) blockers.push("priority_layout_must_be_redacted_deterministic");
  if (priorityLayout.priorityMode !== "summary_first") blockers.push("priority_layout_must_be_summary_first");
  if (priorityLayout.summaryFirstSectionId !== "mock_trading_run_summary_result") blockers.push("summary_result_must_be_first");
  if (priorityLayout.safetyPanelSeparated !== true) blockers.push("safety_panel_must_remain_separated");
  if (collapsibleSectionPlan.redacted !== true || collapsibleSectionPlan.deterministic !== true) blockers.push("collapsible_plan_must_be_redacted_deterministic");
  if (collapsibleSectionPlan.deletesExistingSections === true) blockers.push("cleanup_preflight_must_not_delete_existing_sections");
  if ((collapsibleSectionPlan.groupCount || 0) < 5) warnings.push("collapsible_detail_groups_required");

  const unsafeKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "kisOrderPayload",
    "kisExecutionPayload",
    "kisFillPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
    "realOrderIdentifier",
    "realExecutionIdentifier",
    "realFillIdentifier",
    "realAccountBalance",
    "realPerformanceRecordIdentifier",
    "realTradingRunIdentifier",
  ];
  if (unsafeKeys.some((key) => Object.prototype.hasOwnProperty.call(summaryResult, key) || Object.prototype.hasOwnProperty.call(input, key))) {
    blockers.push("unsafe_actual_or_private_identifier_rejected");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const status = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_dashboard_cleanup_ready";

  return {
    validationId: "step162_mock_dashboard_cleanup_preflight_validation",
    sourceStep: "step162",
    status,
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    tradingRunSummaryResultId: summaryResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result",
    sectionInventoryStatus: sectionInventory.status,
    priorityLayoutStatus: priorityLayout.status,
    collapsibleSectionPlanStatus: collapsibleSectionPlan.status,
    summaryFirstLayoutStatus: priorityLayout.status === "mock_layout_ready" ? "planned" : "validation_required",
    publicDashboardExposed: false,
    myPageDashboardExposed: false,
    homepageDashboardExposed: false,
    existingSectionsDeleted: false,
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step162_mock_dashboard_cleanup_validation_v1" }),
  };
}

export function buildTradingLabMockDashboardCleanupPreflight(input = {}, options = {}) {
  const context = getStep162MockDashboardCleanupContext(input, options);
  const sectionInventory = input.sectionInventory || buildTradingLabMockDashboardSectionInventory(input.sectionInventoryInput || {});
  const priorityLayout = input.priorityLayout || buildTradingLabMockDashboardPriorityLayout(input.priorityLayoutInput || {});
  const collapsibleSectionPlan = input.collapsibleSectionPlan || buildTradingLabMockDashboardCollapsibleSectionPlan(input.collapsibleSectionPlanInput || {});
  const validation = input.validation || validateTradingLabMockDashboardCleanupPreflight(
    {
      ...input,
      mockTradingRunSummaryCoreStatus: context.mockTradingRunSummaryCoreStatus,
      summaryResult: context.summaryResult,
      dashboardAggregation: context.dashboardAggregation,
      chartAggregation: context.chartAggregation,
      sectionInventory,
      priorityLayout,
      collapsibleSectionPlan,
    },
    options,
  );
  const result = {
    mockDashboardCleanupPreflightId: "step162_mock_dashboard_cleanup_preflight",
    sourceStep: "step162",
    tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
    status: validation.status,
    scope: "mock_only",
    mode: "mock",
    redacted: true,
    sectionCount: sectionInventory.sectionCount,
    primarySectionCount: sectionInventory.primarySectionCount,
    detailSectionCount: sectionInventory.detailSectionCount,
    summaryFirstLayoutStatus: validation.summaryFirstLayoutStatus,
    sectionInventoryStatus: validation.sectionInventoryStatus,
    priorityLayoutStatus: validation.priorityLayoutStatus,
    collapsibleSectionPlanStatus: validation.collapsibleSectionPlanStatus,
    readabilityImpact: "summary_first_admin_mock_only",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    readinessImpact: "none",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_dashboard_cleanup_review",
  };

  return {
    ok: true,
    step: "Step 162: Admin trading lab mock dashboard cleanup preflight",
    status: "admin_only_trading_lab_mock_dashboard_cleanup_preflight_fail_closed",
    sourceStep: "step162",
    mockDashboardCleanupPreflightModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_MODEL,
    mockDashboardSectionInventoryModel: TRADING_LAB_MOCK_DASHBOARD_SECTION_INVENTORY_MODEL,
    mockDashboardPriorityLayoutModel: TRADING_LAB_MOCK_DASHBOARD_PRIORITY_LAYOUT_MODEL,
    mockDashboardCollapsibleSectionPlanModel: TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_SECTION_PLAN_MODEL,
    mockDashboardCleanupPreflightResultSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_RESULT_SCHEMA,
    dependency: {
      dependencyId: "step162_mock_dashboard_cleanup_preflight_dependency",
      sourceStep: "step162",
      step161Required: true,
      tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
      summaryStatus: context.summaryResult?.summaryStatus || "blocked",
      redacted: true,
    },
    validation,
    result,
    sectionInventory,
    priorityLayout,
    collapsibleSectionPlan,
    mockHistory: [
      {
        historyId: "step162_mock_dashboard_cleanup_preflight_history_1",
        sourceStep: "step162",
        status: validation.status,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_dashboard_cleanup_review",
      },
    ],
    flags: { ...STEP162_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      existingSectionsDeleted: false,
      summaryFirstCleanupOnly: true,
      dashboardCleanupPersistenceAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step162_mock_dashboard_cleanup_preflight_status_v1" }),
  };
}

export function buildAdminTradingLabMockDashboardCleanupPreflightStatus(input = {}, options = {}) {
  return buildTradingLabMockDashboardCleanupPreflight(input, options);
}

function getStep163MockDashboardCleanupReviewContext(input = {}, options = {}) {
  const mockDashboardCleanupPreflightStatus = input.mockDashboardCleanupPreflightStatus || buildAdminTradingLabMockDashboardCleanupPreflightStatus(input, options);
  const preflightResult = input.preflightResult || mockDashboardCleanupPreflightStatus.result || {};
  return {
    mockDashboardCleanupPreflightStatus,
    preflightResult,
    validation: input.preflightValidation || mockDashboardCleanupPreflightStatus.validation || {},
    sectionInventory: input.sectionInventory || mockDashboardCleanupPreflightStatus.sectionInventory || {},
    priorityLayout: input.priorityLayout || mockDashboardCleanupPreflightStatus.priorityLayout || {},
    collapsibleSectionPlan: input.collapsibleSectionPlan || mockDashboardCleanupPreflightStatus.collapsibleSectionPlan || {},
  };
}

function normalizeStep163ReviewStatus(status) {
  if (status === "mock_dashboard_cleanup_ready" || status === "mock_inventory_ready" || status === "mock_layout_ready" || status === "mock_collapsible_plan_ready" || status === "planned") return "reviewed";
  if (status === "blocked") return "blocked";
  return "validation_required";
}

export function buildTradingLabMockDashboardCleanupReviewSectionSummary(input = {}, options = {}) {
  const context = getStep163MockDashboardCleanupReviewContext(input, options);
  const sectionInventoryReviewStatus = normalizeStep163ReviewStatus(context.sectionInventory.status);
  const priorityLayoutReviewStatus = normalizeStep163ReviewStatus(context.priorityLayout.status);
  const collapsibleSectionPlanReviewStatus = normalizeStep163ReviewStatus(context.collapsibleSectionPlan.status);
  const summaryFirstLayoutReviewStatus = normalizeStep163ReviewStatus(context.preflightResult.summaryFirstLayoutStatus);
  const safetyPanelSeparationReviewStatus = context.priorityLayout.safetyPanelSeparated === true ? "reviewed" : "blocked";
  const sourceAlignmentReviewStatus = context.preflightResult.tradingRunSummaryResultId ? "reviewed" : "validation_required";

  return {
    sectionReviewSummaryId: "step163_mock_dashboard_cleanup_section_review_summary",
    sourceStep: "step163",
    dashboardCleanupPreflightId: context.preflightResult.mockDashboardCleanupPreflightId || "step162_mock_dashboard_cleanup_preflight",
    sectionInventoryReviewStatus,
    priorityLayoutReviewStatus,
    collapsibleSectionPlanReviewStatus,
    summaryFirstLayoutReviewStatus,
    safetyPanelSeparationReviewStatus,
    sourceAlignmentReviewStatus,
    kpiChartAllocationSourceAlignment: "reviewed",
    dependencyReviewStatus: context.preflightResult.redacted === true ? "reviewed" : "blocked",
    redacted: true,
  };
}

export function buildTradingLabMockDashboardCleanupReviewDecisionSummary(input = {}, options = {}) {
  const validation = input.validation || validateTradingLabMockDashboardCleanupReviewResult(input, options);
  const decision = validation.reviewStatus === "recorded" ? "mock_dashboard_cleanup_review_recorded" : validation.reviewStatus === "blocked" ? "blocked" : "rejected";

  return {
    decisionSummaryId: "step163_mock_dashboard_cleanup_review_decision_summary",
    sourceStep: "step163",
    decision,
    blockers: validation.blockerSummary || [],
    warnings: validation.warningSummary || [],
    messages: [
      "Mock dashboard cleanup review only",
      "Not an actual trading execution result",
      "No actual trading run id",
      "No persistent DB write",
      "No actual cash or position update",
      "KIS calls and order submission remain blocked",
      "Live trading readiness remains blocked",
      "mock dashboard cleanup review recorded",
      "External order authority evidence still required",
    ],
    externalOrderAuthorityRequired: true,
    redacted: true,
  };
}

export function validateTradingLabMockDashboardCleanupReviewResult(input = {}, options = {}) {
  const context = getStep163MockDashboardCleanupReviewContext(input, options);
  const preflightStatus = context.mockDashboardCleanupPreflightStatus || {};
  const preflightResult = context.preflightResult || {};
  const sectionSummary = input.sectionReviewSummary || buildTradingLabMockDashboardCleanupReviewSectionSummary(
    {
      mockDashboardCleanupPreflightStatus: preflightStatus,
      preflightResult,
      sectionInventory: context.sectionInventory,
      priorityLayout: context.priorityLayout,
      collapsibleSectionPlan: context.collapsibleSectionPlan,
    },
    options,
  );
  const blockers = [];
  const warnings = [];

  if (!preflightStatus || Object.keys(preflightStatus).length === 0) blockers.push("step162_dashboard_cleanup_preflight_status_required");
  if (!preflightResult || Object.keys(preflightResult).length === 0) blockers.push("step162_dashboard_cleanup_preflight_result_required");
  if (preflightResult.redacted !== true) blockers.push("step162_dashboard_cleanup_preflight_result_must_be_redacted");
  if (preflightResult.scope !== "mock_only") blockers.push("step162_dashboard_cleanup_preflight_scope_must_be_mock_only");
  if (preflightResult.status !== "mock_dashboard_cleanup_ready") warnings.push("step162_dashboard_cleanup_preflight_not_ready");
  if (preflightResult.readinessImpact !== "none") blockers.push("readiness_impact_must_remain_none");
  if (preflightResult.providerCallImpact !== "blocked") blockers.push("provider_call_impact_must_remain_blocked");
  if (preflightResult.orderSubmissionImpact !== "blocked") blockers.push("order_submission_impact_must_remain_blocked");
  if (preflightResult.liveTradingImpact !== "blocked") blockers.push("live_trading_impact_must_remain_blocked");
  if (preflightResult.nextAllowedStep !== "mock_dashboard_cleanup_review") warnings.push("step162_next_step_requires_dashboard_cleanup_review");
  if (context.sectionInventory.redacted !== true || context.sectionInventory.deterministic !== true) blockers.push("section_inventory_review_must_be_redacted_deterministic");
  if (context.priorityLayout.redacted !== true || context.priorityLayout.deterministic !== true) blockers.push("priority_layout_review_must_be_redacted_deterministic");
  if (context.collapsibleSectionPlan.redacted !== true || context.collapsibleSectionPlan.deterministic !== true) blockers.push("collapsible_plan_review_must_be_redacted_deterministic");
  if (context.priorityLayout.priorityMode !== "summary_first") blockers.push("summary_first_layout_must_be_preserved");
  if (context.priorityLayout.safetyPanelSeparated !== true) blockers.push("safety_panel_must_remain_separated");
  if (context.collapsibleSectionPlan.deletesExistingSections === true) blockers.push("review_must_not_delete_existing_sections");
  if (sectionSummary.sectionInventoryReviewStatus !== "reviewed") warnings.push("section_inventory_review_requires_attention");
  if (sectionSummary.priorityLayoutReviewStatus !== "reviewed") warnings.push("priority_layout_review_requires_attention");
  if (sectionSummary.collapsibleSectionPlanReviewStatus !== "reviewed") warnings.push("collapsible_section_plan_review_requires_attention");
  if (sectionSummary.summaryFirstLayoutReviewStatus !== "reviewed") warnings.push("summary_first_layout_review_requires_attention");
  if (sectionSummary.safetyPanelSeparationReviewStatus !== "reviewed") blockers.push("safety_panel_separation_review_blocked");
  if (sectionSummary.sourceAlignmentReviewStatus !== "reviewed") warnings.push("source_alignment_review_requires_attention");

  const unsafeKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "kisOrderPayload",
    "kisExecutionPayload",
    "kisFillPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
    "realOrderIdentifier",
    "realExecutionIdentifier",
    "realFillIdentifier",
    "realAccountBalance",
    "realPerformanceRecordIdentifier",
    "realTradingRunIdentifier",
  ];
  if (unsafeKeys.some((key) => Object.prototype.hasOwnProperty.call(preflightResult, key) || Object.prototype.hasOwnProperty.call(input, key))) {
    blockers.push("unsafe_actual_or_private_identifier_rejected");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const reviewStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "recorded";

  return {
    validationId: "step163_mock_dashboard_cleanup_review_validation",
    sourceStep: "step163",
    reviewStatus,
    decision: reviewStatus === "recorded" ? "mock_dashboard_cleanup_review_recorded" : reviewStatus === "blocked" ? "blocked" : "rejected",
    dashboardCleanupPreflightId: preflightResult.mockDashboardCleanupPreflightId || "step162_mock_dashboard_cleanup_preflight",
    tradingRunSummaryResultId: preflightResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    sectionInventoryReviewStatus: sectionSummary.sectionInventoryReviewStatus,
    priorityLayoutReviewStatus: sectionSummary.priorityLayoutReviewStatus,
    collapsibleSectionPlanReviewStatus: sectionSummary.collapsibleSectionPlanReviewStatus,
    summaryFirstLayoutReviewStatus: sectionSummary.summaryFirstLayoutReviewStatus,
    safetyPanelSeparationReviewStatus: sectionSummary.safetyPanelSeparationReviewStatus,
    sourceAlignmentReviewStatus: sectionSummary.sourceAlignmentReviewStatus,
    publicDashboardExposed: false,
    myPageDashboardExposed: false,
    homepageDashboardExposed: false,
    existingSectionsDeleted: false,
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step163_mock_dashboard_cleanup_review_validation_v1" }),
  };
}

export function buildTradingLabMockDashboardCleanupReviewResult(input = {}, options = {}) {
  const context = getStep163MockDashboardCleanupReviewContext(input, options);
  const sectionReviewSummary = input.sectionReviewSummary || buildTradingLabMockDashboardCleanupReviewSectionSummary(
    {
      ...input,
      mockDashboardCleanupPreflightStatus: context.mockDashboardCleanupPreflightStatus,
      preflightResult: context.preflightResult,
      sectionInventory: context.sectionInventory,
      priorityLayout: context.priorityLayout,
      collapsibleSectionPlan: context.collapsibleSectionPlan,
    },
    options,
  );
  const validation = input.validation || validateTradingLabMockDashboardCleanupReviewResult(
    {
      ...input,
      mockDashboardCleanupPreflightStatus: context.mockDashboardCleanupPreflightStatus,
      preflightResult: context.preflightResult,
      sectionInventory: context.sectionInventory,
      priorityLayout: context.priorityLayout,
      collapsibleSectionPlan: context.collapsibleSectionPlan,
      sectionReviewSummary,
    },
    options,
  );
  const reviewResult = {
    dashboardCleanupReviewResultId: "step163_mock_dashboard_cleanup_review_result",
    sourceStep: "step163",
    dashboardCleanupPreflightId: validation.dashboardCleanupPreflightId,
    tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
    tradingRunSummaryReviewResultId: context.mockDashboardCleanupPreflightStatus?.mockTradingRunSummaryReviewResultStatus?.reviewResult?.tradingRunSummaryReviewResultId || "step160_mock_trading_run_summary_review_result",
    mockRunCandidateId: context.mockDashboardCleanupPreflightStatus?.mockTradingRunSummaryCoreStatus?.result?.mockRunCandidateId || "step139_mock_run_candidate",
    strategyDraftId: context.mockDashboardCleanupPreflightStatus?.mockTradingRunSummaryCoreStatus?.result?.strategyDraftId || "step134_strategy_draft",
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    reviewedAt: "placeholder_reviewed_at",
    reviewedBy: "admin_placeholder",
    summary: "FINPLE internal mock dashboard cleanup review only; no actual trading execution result and no account or DB mutation.",
    blockers: validation.blockers,
    warnings: validation.warnings,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
  };
  const receipt = {
    receiptId: "step163_mock_dashboard_cleanup_review_receipt",
    sourceStep: "step163",
    dashboardCleanupReviewResultId: reviewResult.dashboardCleanupReviewResultId,
    dashboardCleanupPreflightId: validation.dashboardCleanupPreflightId,
    tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
    reviewStatus: validation.reviewStatus,
    decision: validation.decision,
    redacted: true,
    recordedAt: "placeholder_recorded_at",
    blockerCount: validation.blockerCount,
    warningCount: validation.warningCount,
    sectionInventoryReviewStatus: validation.sectionInventoryReviewStatus,
    priorityLayoutReviewStatus: validation.priorityLayoutReviewStatus,
    collapsibleSectionPlanReviewStatus: validation.collapsibleSectionPlanReviewStatus,
    summaryFirstLayoutReviewStatus: validation.summaryFirstLayoutReviewStatus,
    safetyPanelSeparationReviewStatus: validation.safetyPanelSeparationReviewStatus,
    sourceAlignmentReviewStatus: validation.sourceAlignmentReviewStatus,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_dashboard_cleanup_core",
  };
  const decisionSummary = input.decisionSummary || buildTradingLabMockDashboardCleanupReviewDecisionSummary({ ...input, validation }, options);

  return {
    ok: true,
    step: "Step 163: Admin trading lab mock dashboard cleanup review result recording gate",
    status: "admin_only_trading_lab_mock_dashboard_cleanup_review_result_fail_closed",
    sourceStep: "step163",
    mockDashboardCleanupReviewResultModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_MODEL,
    mockDashboardCleanupReviewReceiptSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RECEIPT_SCHEMA,
    mockDashboardCleanupReviewDecisionSummaryModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_DECISION_SUMMARY_MODEL,
    mockDashboardCleanupReviewSectionSummaryModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_SECTION_SUMMARY_MODEL,
    dependency: {
      dependencyId: "step163_mock_dashboard_cleanup_review_dependency",
      sourceStep: "step163",
      step162Required: true,
      dashboardCleanupPreflightId: validation.dashboardCleanupPreflightId,
      preflightStatus: context.preflightResult?.status || "blocked",
      redacted: true,
    },
    validation,
    reviewResult,
    receipt,
    sectionReviewSummary,
    decisionSummary,
    mockHistory: [
      {
        historyId: "step163_mock_dashboard_cleanup_review_history_1",
        sourceStep: "step163",
        reviewStatus: validation.reviewStatus,
        decision: validation.decision,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_dashboard_cleanup_core",
      },
    ],
    flags: { ...STEP163_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
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
      realTradingRunIdentifierAllowed: false,
      realPerformanceRecordAllowed: false,
      accountBalanceQueryAllowed: false,
      cashPositionMutationAllowed: false,
      dashboardCleanupReviewPersistenceAllowed: false,
    },
    redaction: makeLabRedaction({ schema: "step163_mock_dashboard_cleanup_review_status_v1" }),
  };
}

export function buildTradingLabMockDashboardCleanupReviewResultRecordingGate(input = {}, options = {}) {
  return buildTradingLabMockDashboardCleanupReviewResult(input, options);
}

export function buildAdminTradingLabMockDashboardCleanupReviewResultStatus(input = {}, options = {}) {
  return buildTradingLabMockDashboardCleanupReviewResultRecordingGate(input, options);
}

function getStep164MockDashboardCleanupCoreContext(input = {}, options = {}) {
  const mockDashboardCleanupReviewResultStatus = input.mockDashboardCleanupReviewResultStatus || buildAdminTradingLabMockDashboardCleanupReviewResultStatus(input, options);
  const reviewResult = input.reviewResult || mockDashboardCleanupReviewResultStatus.reviewResult || {};
  const receipt = input.receipt || mockDashboardCleanupReviewResultStatus.receipt || {};
  const mockTradingRunSummaryCoreStatus = input.mockTradingRunSummaryCoreStatus || buildAdminTradingLabMockTradingRunSummaryCoreStatus(input, options);
  const summaryResult = input.summaryResult || mockTradingRunSummaryCoreStatus.result || {};
  const dashboardAggregation = input.dashboardAggregation || mockTradingRunSummaryCoreStatus.dashboardAggregation || summaryResult.dashboardAggregation || {};
  const chartAggregation = input.chartAggregation || mockTradingRunSummaryCoreStatus.chartAggregation || summaryResult.chartAggregation || {};
  const cleanupPreflightStatus = input.mockDashboardCleanupPreflightStatus || buildAdminTradingLabMockDashboardCleanupPreflightStatus(
    {
      ...input,
      mockTradingRunSummaryCoreStatus,
    },
    options,
  );
  const preflightResult = input.preflightResult || cleanupPreflightStatus.result || {};

  return {
    mockDashboardCleanupReviewResultStatus,
    reviewResult,
    receipt,
    mockTradingRunSummaryCoreStatus,
    summaryResult,
    dashboardAggregation,
    chartAggregation,
    cleanupPreflightStatus,
    preflightResult,
  };
}

export function buildTradingLabMockDashboardSummaryFirstLayoutResult(input = {}, options = {}) {
  const context = getStep164MockDashboardCleanupCoreContext(input, options);
  const summaryResult = context.summaryResult || {};
  const dashboardAggregation = context.dashboardAggregation || {};
  const chartAggregation = context.chartAggregation || {};
  const strategySummary = summaryResult.strategySummary || {};
  const performanceSummary = summaryResult.performanceSummary || {};
  const ledgerSummary = summaryResult.ledgerSummary || {};
  const orderSummary = summaryResult.orderSummary || {};
  const executionSummary = summaryResult.executionSummary || {};
  const fillSummary = summaryResult.fillSummary || {};
  const riskSummary = summaryResult.riskSummary || {};

  return {
    summaryFirstLayoutResultId: "step164_mock_dashboard_summary_first_layout_result",
    sourceStep: "step164",
    tradingRunSummaryResultId: summaryResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result",
    overview: {
      title: "Mock trading run summary",
      mockOnlyNotice: "FINPLE internal mock dashboard cleanup core only",
      badges: [
        "not_real_trading",
        "no_kis_call",
        "no_order_submission",
        "no_db_write",
      ],
      summaryStatus: summaryResult.summaryStatus || "validation_required",
      redacted: true,
    },
    kpi: {
      totalEquity: performanceSummary.totalEquity ?? dashboardAggregation.totalEquity ?? 0,
      cumulativeReturn: performanceSummary.cumulativeReturn ?? dashboardAggregation.cumulativeReturn ?? 0,
      dailyReturn: dashboardAggregation.dailyReturn ?? 0,
      mdd: performanceSummary.mdd ?? dashboardAggregation.mdd ?? 0,
      cashWeight: ledgerSummary.cashWeight ?? dashboardAggregation.cashWeight ?? 0,
      mockRunStatus: summaryResult.summaryStatus || "validation_required",
      sourceAlignment: "step161_summary_result",
      redacted: true,
    },
    charts: {
      equity: chartAggregation.equityChartData || dashboardAggregation.equityChartSummary || [],
      returns: chartAggregation.returnChartData || dashboardAggregation.returnChartSummary || [],
      drawdown: chartAggregation.drawdownChartData || dashboardAggregation.drawdownChartSummary || [],
      allocation: chartAggregation.allocationChartData || dashboardAggregation.allocationSummary || [],
      sourceAlignment: "step161_chart_aggregation",
      redacted: true,
    },
    strategy: {
      strategyDraftId: strategySummary.strategyDraftId || summaryResult.strategyDraftId || "step134_strategy_draft",
      strategyName: strategySummary.strategyName || "Admin mock strategy draft",
      mode: strategySummary.mode || "mock",
      targetWeightStatus: strategySummary.targetWeightStatus || "mock_only",
      rebalanceRuleStatus: strategySummary.rebalanceRuleStatus || "mock_only",
      redacted: true,
    },
    mockRunSummary: {
      orderStatus: orderSummary.status || orderSummary.orderSummaryStatus || "mock_only",
      executionStatus: executionSummary.status || executionSummary.executionSummaryStatus || "mock_only",
      fillStatus: fillSummary.status || fillSummary.fillSummaryStatus || "mock_only",
      ledgerStatus: ledgerSummary.status || "mock_only",
      performanceStatus: performanceSummary.status || "mock_only",
      safetyStatus: riskSummary.safetyStatus || "blocked",
      redacted: true,
    },
    detailChain: {
      defaultCollapsed: true,
      groups: "see_collapsible_detail_group_result",
      redacted: true,
    },
    summaryFirst: true,
    deterministic: input.deterministic !== false,
    redacted: input.redacted !== false,
    status: input.deterministic === false || input.redacted === false ? "validation_required" : "applied",
  };
}

export function buildTradingLabMockDashboardCollapsibleDetailGroupResult(input = {}, options = {}) {
  const context = getStep164MockDashboardCleanupCoreContext(input, options);
  const groups = input.groups || [
    {
      groupId: "strategy_draft_review_chain",
      title: "Strategy draft and review",
      sourceSteps: ["step134", "step135", "step136", "step137", "step138"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_order_execution_fill_chain",
      title: "Mock order execution fill flow",
      sourceSteps: ["step139", "step140", "step141", "step142", "step143", "step144", "step145", "step146", "step147", "step148"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_ledger_update_chain",
      title: "Mock portfolio ledger update",
      sourceSteps: ["step149", "step150", "step151", "step152", "step153"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_performance_calculation_chain",
      title: "Mock performance calculation",
      sourceSteps: ["step154", "step155", "step156", "step157", "step158"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_trading_run_summary_chain",
      title: "Mock trading run summary",
      sourceSteps: ["step159", "step160", "step161"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "mock_dashboard_cleanup_chain",
      title: "Mock dashboard cleanup",
      sourceSteps: ["step162", "step163", "step164"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      redacted: true,
    },
    {
      groupId: "safety_detail_chain",
      title: "Safety detail",
      sourceSteps: ["step116", "step117", "step118", "step119", "step120", "step121", "step122", "step123", "step124", "step125", "step126", "step127", "step128", "step129", "step130"],
      defaultCollapsed: true,
      preservesExistingSections: true,
      safetyPanelSeparated: true,
      redacted: true,
    },
  ];
  const unsafeGroup = groups.find((group) => group.defaultCollapsed !== true || group.preservesExistingSections !== true || group.redacted !== true);

  return {
    collapsibleDetailGroupResultId: "step164_mock_dashboard_collapsible_detail_group_result",
    sourceStep: "step164",
    dashboardCleanupReviewResultId: context.reviewResult.dashboardCleanupReviewResultId || "step163_mock_dashboard_cleanup_review_result",
    groups,
    groupCount: groups.length,
    visibleDetailGroups: groups.map((group) => group.groupId),
    defaultCollapsed: true,
    preservesExistingSections: true,
    deletesExistingSections: false,
    safetyPanelSeparated: true,
    deterministic: input.deterministic !== false,
    redacted: input.redacted !== false,
    status: unsafeGroup || input.deterministic === false || input.redacted === false ? "validation_required" : "applied",
  };
}

export function validateTradingLabMockDashboardCleanupCore(input = {}, options = {}) {
  const context = getStep164MockDashboardCleanupCoreContext(input, options);
  const reviewStatus = context.mockDashboardCleanupReviewResultStatus || {};
  const reviewResult = context.reviewResult || {};
  const receipt = context.receipt || {};
  const summaryResult = context.summaryResult || {};
  const preflightResult = context.preflightResult || {};
  const summaryFirstLayout = input.summaryFirstLayout || buildTradingLabMockDashboardSummaryFirstLayoutResult(input, options);
  const collapsibleDetailGroupResult = input.collapsibleDetailGroupResult || buildTradingLabMockDashboardCollapsibleDetailGroupResult(input, options);
  const blockers = [];
  const warnings = [];

  if (!reviewStatus || Object.keys(reviewStatus).length === 0) blockers.push("step163_dashboard_cleanup_review_status_required");
  if (!reviewResult || Object.keys(reviewResult).length === 0) blockers.push("step163_dashboard_cleanup_review_result_required");
  if (reviewResult.redacted !== true) blockers.push("step163_dashboard_cleanup_review_result_must_be_redacted");
  if (reviewResult.reviewStatus !== "recorded") warnings.push("step163_dashboard_cleanup_review_not_recorded");
  if (reviewResult.readinessImpact !== "none") blockers.push("readiness_impact_must_remain_none");
  if (reviewResult.providerCallImpact !== "blocked") blockers.push("provider_call_impact_must_remain_blocked");
  if (reviewResult.orderSubmissionImpact !== "blocked") blockers.push("order_submission_impact_must_remain_blocked");
  if (reviewResult.liveTradingImpact !== "blocked") blockers.push("live_trading_impact_must_remain_blocked");
  if (receipt.redacted !== true) blockers.push("step163_receipt_must_be_redacted");
  if (receipt.nextAllowedStep !== "mock_dashboard_cleanup_core") warnings.push("step163_next_step_requires_dashboard_cleanup_core");
  if (!summaryResult || Object.keys(summaryResult).length === 0) blockers.push("step161_summary_result_required");
  if (summaryResult.redacted !== true) blockers.push("step161_summary_result_must_be_redacted");
  if (summaryResult.scope !== "mock_only") blockers.push("step161_summary_scope_must_be_mock_only");
  if (preflightResult.redacted !== true) warnings.push("step162_preflight_result_should_be_redacted");
  if (summaryFirstLayout.redacted !== true || summaryFirstLayout.deterministic !== true) blockers.push("summary_first_layout_must_be_redacted_deterministic");
  if (summaryFirstLayout.summaryFirst !== true || summaryFirstLayout.status !== "applied") blockers.push("summary_first_layout_must_be_applied");
  if (collapsibleDetailGroupResult.redacted !== true || collapsibleDetailGroupResult.deterministic !== true) blockers.push("collapsible_detail_groups_must_be_redacted_deterministic");
  if (collapsibleDetailGroupResult.defaultCollapsed !== true) blockers.push("detail_groups_must_default_collapsed");
  if (collapsibleDetailGroupResult.deletesExistingSections === true) blockers.push("cleanup_core_must_not_delete_existing_sections");
  if (collapsibleDetailGroupResult.safetyPanelSeparated !== true) blockers.push("safety_panel_must_remain_separated");
  if ((collapsibleDetailGroupResult.groupCount || 0) < 6) warnings.push("detail_chain_groups_should_cover_step134_to_step164");

  const unsafeKeys = [
    "credential",
    "accountIdentifier",
    "providerPayload",
    "orderPayload",
    "kisOrderPayload",
    "kisExecutionPayload",
    "kisFillPayload",
    "rawProviderResponse",
    "privatePath",
    "hash",
    "digest",
    "token",
    "appKey",
    "appSecret",
    "accountNumber",
    "realOrderIdentifier",
    "realExecutionIdentifier",
    "realFillIdentifier",
    "realAccountBalance",
    "realPerformanceRecordIdentifier",
    "realTradingRunIdentifier",
  ];
  if (unsafeKeys.some((key) => Object.prototype.hasOwnProperty.call(reviewResult, key) || Object.prototype.hasOwnProperty.call(summaryResult, key) || Object.prototype.hasOwnProperty.call(input, key))) {
    blockers.push("unsafe_actual_or_private_identifier_rejected");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const cleanupStatus = uniqueBlockers.length > 0 ? "blocked" : uniqueWarnings.length > 0 ? "validation_required" : "mock_dashboard_cleanup_applied";

  return {
    validationId: "step164_mock_dashboard_cleanup_core_validation",
    sourceStep: "step164",
    cleanupStatus,
    dashboardCleanupReviewResultId: reviewResult.dashboardCleanupReviewResultId || "step163_mock_dashboard_cleanup_review_result",
    dashboardCleanupPreflightId: reviewResult.dashboardCleanupPreflightId || preflightResult.mockDashboardCleanupPreflightId || "step162_mock_dashboard_cleanup_preflight",
    tradingRunSummaryResultId: reviewResult.tradingRunSummaryResultId || summaryResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result",
    blockerCount: uniqueBlockers.length,
    warningCount: uniqueWarnings.length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    blockerSummary: summarizeReviewBlockers(uniqueBlockers),
    warningSummary: summarizeReviewBlockers(uniqueWarnings),
    summaryFirstLayoutStatus: summaryFirstLayout.status,
    collapsibleDetailGroupStatus: collapsibleDetailGroupResult.status,
    kpiSourceAlignment: summaryFirstLayout.kpi?.sourceAlignment === "step161_summary_result" ? "aligned" : "validation_required",
    chartSourceAlignment: summaryFirstLayout.charts?.sourceAlignment === "step161_chart_aggregation" ? "aligned" : "validation_required",
    allocationSourceAlignment: summaryFirstLayout.charts?.sourceAlignment === "step161_chart_aggregation" ? "aligned" : "validation_required",
    safetyPanelSeparationStatus: collapsibleDetailGroupResult.safetyPanelSeparated === true ? "separated" : "blocked",
    dangerousActionLabelStatus: "absent",
    publicDashboardExposed: false,
    myPageDashboardExposed: false,
    homepageDashboardExposed: false,
    existingSectionsDeleted: false,
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    dashboardCleanupCoreExecuted: false,
    redacted: true,
    redaction: makeLabRedaction({ schema: "step164_mock_dashboard_cleanup_core_validation_v1" }),
  };
}

export function buildTradingLabMockDashboardCleanupCore(input = {}, options = {}) {
  const context = getStep164MockDashboardCleanupCoreContext(input, options);
  const summaryFirstLayout = input.summaryFirstLayout || buildTradingLabMockDashboardSummaryFirstLayoutResult(input, options);
  const collapsibleDetailGroupResult = input.collapsibleDetailGroupResult || buildTradingLabMockDashboardCollapsibleDetailGroupResult(input, options);
  const validation = input.validation || validateTradingLabMockDashboardCleanupCore(
    {
      ...input,
      mockDashboardCleanupReviewResultStatus: context.mockDashboardCleanupReviewResultStatus,
      reviewResult: context.reviewResult,
      receipt: context.receipt,
      mockTradingRunSummaryCoreStatus: context.mockTradingRunSummaryCoreStatus,
      summaryResult: context.summaryResult,
      preflightResult: context.preflightResult,
      summaryFirstLayout,
      collapsibleDetailGroupResult,
    },
    options,
  );
  const result = {
    dashboardCleanupResultId: "step164_mock_dashboard_cleanup_result",
    sourceStep: "step164",
    dashboardCleanupReviewResultId: validation.dashboardCleanupReviewResultId,
    dashboardCleanupPreflightId: validation.dashboardCleanupPreflightId,
    tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
    scope: "mock_only",
    mode: "mock",
    cleanupStatus: validation.cleanupStatus,
    summaryFirstLayout,
    kpiSourceAlignment: validation.kpiSourceAlignment,
    chartSourceAlignment: validation.chartSourceAlignment,
    allocationSourceAlignment: validation.allocationSourceAlignment,
    collapsibleGroups: collapsibleDetailGroupResult.groups,
    visiblePrimarySections: ["overview", "kpi", "charts", "strategy", "mockRunSummary"],
    visibleDetailGroups: collapsibleDetailGroupResult.visibleDetailGroups || [],
    safetyPanelSeparationStatus: validation.safetyPanelSeparationStatus,
    dangerousActionLabelStatus: validation.dangerousActionLabelStatus,
    deterministic: true,
    redacted: true,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextAllowedStep: "mock_dashboard_cleanup_core_review",
  };

  return {
    ok: true,
    step: "Step 164: Admin trading lab mock dashboard cleanup core",
    status: "admin_only_trading_lab_mock_dashboard_cleanup_core_fail_closed",
    sourceStep: "step164",
    mockDashboardCleanupCoreModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_MODEL,
    mockDashboardCleanupResultModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_MODEL,
    mockDashboardSummaryFirstLayoutResultModel: TRADING_LAB_MOCK_DASHBOARD_SUMMARY_FIRST_LAYOUT_RESULT_MODEL,
    mockDashboardCollapsibleDetailGroupResultModel: TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_DETAIL_GROUP_RESULT_MODEL,
    mockDashboardCleanupResultSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_SCHEMA,
    dependency: {
      dependencyId: "step164_mock_dashboard_cleanup_core_dependency",
      sourceStep: "step164",
      step163Required: true,
      dashboardCleanupReviewResultId: validation.dashboardCleanupReviewResultId,
      reviewStatus: context.reviewResult.reviewStatus || "blocked",
      tradingRunSummaryResultId: validation.tradingRunSummaryResultId,
      redacted: true,
    },
    validation,
    result,
    summaryFirstLayout,
    collapsibleDetailGroupResult,
    mockHistory: [
      {
        historyId: "step164_mock_dashboard_cleanup_core_history_1",
        sourceStep: "step164",
        cleanupStatus: validation.cleanupStatus,
        redacted: true,
        recordedAt: "placeholder_recorded_at",
        nextAllowedStep: "mock_dashboard_cleanup_core_review",
      },
    ],
    flags: { ...STEP164_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_FLAGS },
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
    orderPayloadCreated: false,
    kisOrderPayloadCreated: false,
    kisExecutionPayloadCreated: false,
    kisFillPayloadCreated: false,
    executionRecordCreated: false,
    fillRecordCreated: false,
    realTradingRunIdentifierCreated: false,
    realOrderIdentifierCreated: false,
    realExecutionIdentifierCreated: false,
    realFillIdentifierCreated: false,
    portfolioLedgerPersisted: false,
    performanceRecordPersisted: false,
    actualPerformanceRecordUpdated: false,
    actualCashUpdated: false,
    actualPositionUpdated: false,
    accountBalanceQueried: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    actualInvestmentPerformanceConfirmed: false,
    returnGuaranteeProvided: false,
    investmentAdviceProvided: false,
    dashboardCleanupCoreExecuted: false,
    existingSectionsDeleted: false,
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
      realTradingRunIdentifierAllowed: false,
      realPerformanceRecordAllowed: false,
      accountBalanceQueryAllowed: false,
      cashPositionMutationAllowed: false,
      dashboardCleanupCorePersistenceAllowed: false,
      existingDashboardSectionDeleted: false,
    },
    redaction: makeLabRedaction({ schema: "step164_mock_dashboard_cleanup_core_status_v1" }),
  };
}

export function buildAdminTradingLabMockDashboardCleanupCoreStatus(input = {}, options = {}) {
  return buildTradingLabMockDashboardCleanupCore(input, options);
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
  const mockPortfolioLedgerUpdatePreflightStatus = input.mockPortfolioLedgerUpdatePreflightStatus || buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus(
    {
      ...input,
      mockFillSimulationCoreStatus,
    },
    options,
  );
  const mockPortfolioLedgerUpdateReviewResultStatus = input.mockPortfolioLedgerUpdateReviewResultStatus || buildAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus(
    {
      ...input,
      mockPortfolioLedgerUpdatePreflightStatus,
    },
    options,
  );
  const mockPortfolioLedgerUpdateCorePreflightStatus = input.mockPortfolioLedgerUpdateCorePreflightStatus || buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus(
    {
      ...input,
      mockPortfolioLedgerUpdatePreflightStatus,
      mockPortfolioLedgerUpdateReviewResultStatus,
    },
    options,
  );
  const mockPortfolioLedgerUpdateCoreReviewResultStatus = input.mockPortfolioLedgerUpdateCoreReviewResultStatus || buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus(
    {
      ...input,
      mockPortfolioLedgerUpdateCorePreflightStatus,
    },
    options,
  );
  const mockPortfolioLedgerUpdateCoreStatus = input.mockPortfolioLedgerUpdateCoreStatus || buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus(
    {
      ...input,
      mockPortfolioLedgerUpdateCorePreflightStatus,
      mockPortfolioLedgerUpdateCoreReviewResultStatus,
    },
    options,
  );
  const mockPortfolioPerformanceRecalculationPreflightStatus = input.mockPortfolioPerformanceRecalculationPreflightStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus(
    {
      ...input,
      mockPortfolioLedgerUpdateCoreStatus,
    },
    options,
  );
  const mockPortfolioPerformanceRecalculationReviewResultStatus = input.mockPortfolioPerformanceRecalculationReviewResultStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus(
    {
      ...input,
      mockPortfolioPerformanceRecalculationPreflightStatus,
    },
    options,
  );
  const mockPortfolioPerformanceRecalculationCorePreflightStatus = input.mockPortfolioPerformanceRecalculationCorePreflightStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus(
    {
      ...input,
      mockPortfolioPerformanceRecalculationReviewResultStatus,
    },
    options,
  );
  const mockPortfolioPerformanceRecalculationCoreReviewResultStatus = input.mockPortfolioPerformanceRecalculationCoreReviewResultStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus(
    {
      ...input,
      mockPortfolioPerformanceRecalculationCorePreflightStatus,
    },
    options,
  );
  const mockPortfolioPerformanceRecalculationCoreStatus = input.mockPortfolioPerformanceRecalculationCoreStatus || buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus(
    {
      ...input,
      mockPortfolioPerformanceRecalculationCoreReviewResultStatus,
    },
    options,
  );
  const mockTradingRunSummaryPreflightStatus = input.mockTradingRunSummaryPreflightStatus || buildAdminTradingLabMockTradingRunSummaryPreflightStatus(
    {
      ...input,
      mockPortfolioPerformanceRecalculationCoreStatus,
    },
    options,
  );
  const mockTradingRunSummaryReviewResultStatus = input.mockTradingRunSummaryReviewResultStatus || buildAdminTradingLabMockTradingRunSummaryReviewResultStatus(
    {
      ...input,
      mockTradingRunSummaryPreflightStatus,
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
  const mockTradingRunSummaryCoreStatus = input.mockTradingRunSummaryCoreStatus || buildAdminTradingLabMockTradingRunSummaryCoreStatus(
    {
      ...input,
      mockTradingRunSummaryPreflightStatus,
      mockTradingRunSummaryReviewResultStatus,
      performance,
      dailyReturns,
      positions,
      orderCandidates,
      kpiCards,
      equityVisualization,
      returnVisualization,
      allocationVisualization,
      dashboardAggregationInput: {
        performance,
        dailyReturns,
        positions,
        orderCandidates,
        kpiCards,
        equityVisualization,
        returnVisualization,
        allocationVisualization,
      },
      chartAggregationInput: {
        dailyReturns,
        equityVisualization,
        returnVisualization,
        allocationVisualization,
      },
    },
    options,
  );
  const mockDashboardCleanupPreflightStatus = input.mockDashboardCleanupPreflightStatus || buildAdminTradingLabMockDashboardCleanupPreflightStatus(
    {
      ...input,
      mockTradingRunSummaryCoreStatus,
    },
    options,
  );
  const mockDashboardCleanupReviewResultStatus = input.mockDashboardCleanupReviewResultStatus || buildAdminTradingLabMockDashboardCleanupReviewResultStatus(
    {
      ...input,
      mockDashboardCleanupPreflightStatus,
    },
    options,
  );
  const mockDashboardCleanupCoreStatus = input.mockDashboardCleanupCoreStatus || buildAdminTradingLabMockDashboardCleanupCoreStatus(
    {
      ...input,
      mockDashboardCleanupReviewResultStatus,
      mockTradingRunSummaryCoreStatus,
      mockDashboardCleanupPreflightStatus,
    },
    options,
  );

  return {
    ok: true,
    step: "Step 164: Admin trading lab mock dashboard cleanup core",
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
    mockPortfolioLedgerUpdatePreflightStatus,
    mockPortfolioLedgerUpdateReviewResultStatus,
    mockPortfolioLedgerUpdateCorePreflightStatus,
    mockPortfolioLedgerUpdateCoreReviewResultStatus,
    mockPortfolioLedgerUpdateCoreStatus,
    mockPortfolioPerformanceRecalculationPreflightStatus,
    mockPortfolioPerformanceRecalculationReviewResultStatus,
    mockPortfolioPerformanceRecalculationCorePreflightStatus,
    mockPortfolioPerformanceRecalculationCoreReviewResultStatus,
    mockPortfolioPerformanceRecalculationCoreStatus,
    mockTradingRunSummaryPreflightStatus,
    mockTradingRunSummaryReviewResultStatus,
    mockTradingRunSummaryCoreStatus,
    mockDashboardCleanupPreflightStatus,
    mockDashboardCleanupReviewResultStatus,
    mockDashboardCleanupCoreStatus,
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
    mockPortfolioLedgerUpdatePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_PREFLIGHT_MODEL,
    mockLedgerUpdateCandidateModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CANDIDATE_MODEL,
    mockLedgerUpdatePreflightResultSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_PREFLIGHT_RESULT_SCHEMA,
    mockPortfolioLedgerUpdateReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_REVIEW_RESULT_MODEL,
    mockLedgerUpdateReviewReceiptSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_RECEIPT_SCHEMA,
    mockLedgerUpdateReviewDecisionSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_REVIEW_DECISION_SUMMARY_MODEL,
    mockLedgerUpdateImpactReviewSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_IMPACT_REVIEW_SUMMARY_MODEL,
    mockPortfolioLedgerUpdateCorePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_PREFLIGHT_MODEL,
    mockLedgerCoreInputBundleModel: TRADING_LAB_MOCK_LEDGER_CORE_INPUT_BUNDLE_MODEL,
    mockLedgerUpdateScenarioModel: TRADING_LAB_MOCK_LEDGER_UPDATE_SCENARIO_MODEL,
    mockLedgerUpdateCorePreflightResultSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_PREFLIGHT_RESULT_SCHEMA,
    mockPortfolioLedgerUpdateCoreReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_CORE_REVIEW_RESULT_MODEL,
    mockLedgerUpdateCoreReviewReceiptSchema: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_RECEIPT_SCHEMA,
    mockLedgerUpdateCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockLedgerUpdateCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_LEDGER_UPDATE_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    mockPortfolioLedgerUpdateResultModel: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_MODEL,
    mockCashLedgerUpdateResultModel: TRADING_LAB_MOCK_CASH_LEDGER_UPDATE_RESULT_MODEL,
    mockPositionLedgerUpdateResultModel: TRADING_LAB_MOCK_POSITION_LEDGER_UPDATE_RESULT_MODEL,
    mockPortfolioValueUpdateResultModel: TRADING_LAB_MOCK_PORTFOLIO_VALUE_UPDATE_RESULT_MODEL,
    mockPnlPlaceholderResultModel: TRADING_LAB_MOCK_PNL_PLACEHOLDER_RESULT_MODEL,
    mockPortfolioLedgerUpdateResultSchema: TRADING_LAB_MOCK_PORTFOLIO_LEDGER_UPDATE_RESULT_SCHEMA,
    mockPortfolioPerformanceRecalculationPreflightModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_PREFLIGHT_MODEL,
    mockPerformanceRecalculationInputBundleModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_INPUT_BUNDLE_MODEL,
    mockPerformanceRecalculationScenarioModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_SCENARIO_MODEL,
    mockPerformanceRecalculationPreflightResultSchema: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_PREFLIGHT_RESULT_SCHEMA,
    mockPortfolioPerformanceRecalculationReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_REVIEW_RESULT_MODEL,
    mockPerformanceRecalculationReviewReceiptSchema: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_RECEIPT_SCHEMA,
    mockPerformanceRecalculationReviewDecisionSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_DECISION_SUMMARY_MODEL,
    mockPerformanceRecalculationReviewSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_RECALCULATION_REVIEW_SUMMARY_MODEL,
    mockPortfolioPerformanceRecalculationCorePreflightModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_PREFLIGHT_MODEL,
    mockPerformanceCoreInputBundleModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_INPUT_BUNDLE_MODEL,
    mockPerformanceCoreScenarioModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_SCENARIO_MODEL,
    mockPerformanceCorePreflightResultSchema: TRADING_LAB_MOCK_PERFORMANCE_CORE_PREFLIGHT_RESULT_SCHEMA,
    mockPortfolioPerformanceRecalculationCoreReviewResultModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_REVIEW_RESULT_MODEL,
    mockPerformanceCoreReviewReceiptSchema: TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_RECEIPT_SCHEMA,
    mockPerformanceCoreReviewDecisionSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_REVIEW_DECISION_SUMMARY_MODEL,
    mockPerformanceCorePolicyReviewSummaryModel: TRADING_LAB_MOCK_PERFORMANCE_CORE_POLICY_REVIEW_SUMMARY_MODEL,
    mockPortfolioPerformanceRecalculationCoreModel: TRADING_LAB_MOCK_PORTFOLIO_PERFORMANCE_RECALCULATION_CORE_MODEL,
    mockPerformanceResultModel: TRADING_LAB_MOCK_PERFORMANCE_RESULT_MODEL,
    mockEquitySeriesResultModel: TRADING_LAB_MOCK_EQUITY_SERIES_RESULT_MODEL,
    mockDailyReturnResultModel: TRADING_LAB_MOCK_DAILY_RETURN_RESULT_MODEL,
    mockCumulativeReturnResultModel: TRADING_LAB_MOCK_CUMULATIVE_RETURN_RESULT_MODEL,
    mockDrawdownMddResultModel: TRADING_LAB_MOCK_DRAWDOWN_MDD_RESULT_MODEL,
    mockAllocationResultModel: TRADING_LAB_MOCK_ALLOCATION_RESULT_MODEL,
    mockKpiSummaryResultModel: TRADING_LAB_MOCK_KPI_SUMMARY_RESULT_MODEL,
    mockChartDataResultModel: TRADING_LAB_MOCK_CHART_DATA_RESULT_MODEL,
    mockPerformanceResultSchema: TRADING_LAB_MOCK_PERFORMANCE_RESULT_SCHEMA,
    mockTradingRunSummaryPreflightModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_MODEL,
    mockTradingRunSummaryInputBundleModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_INPUT_BUNDLE_MODEL,
    mockTradingRunChainDependencyMapModel: TRADING_LAB_MOCK_TRADING_RUN_CHAIN_DEPENDENCY_MAP_MODEL,
    mockTradingRunSummaryPreflightResultSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_PREFLIGHT_RESULT_SCHEMA,
    mockTradingRunSummaryReviewResultModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RESULT_MODEL,
    mockTradingRunSummaryReviewReceiptSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_RECEIPT_SCHEMA,
    mockTradingRunSummaryReviewDecisionSummaryModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_DECISION_SUMMARY_MODEL,
    mockTradingRunSummaryReviewSectionSummaryModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_REVIEW_SECTION_SUMMARY_MODEL,
    mockTradingRunSummaryCoreModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_CORE_MODEL,
    mockTradingRunSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_MODEL,
    mockStrategySummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_STRATEGY_SUMMARY_RESULT_MODEL,
    mockOrderExecutionFillSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_ORDER_EXECUTION_FILL_SUMMARY_RESULT_MODEL,
    mockLedgerSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_LEDGER_SUMMARY_RESULT_MODEL,
    mockPerformanceSummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_PERFORMANCE_SUMMARY_RESULT_MODEL,
    mockRiskSafetySummaryResultModel: TRADING_LAB_MOCK_TRADING_RUN_RISK_SAFETY_SUMMARY_RESULT_MODEL,
    mockDashboardAggregationResultModel: TRADING_LAB_MOCK_TRADING_RUN_DASHBOARD_AGGREGATION_RESULT_MODEL,
    mockChartAggregationResultModel: TRADING_LAB_MOCK_TRADING_RUN_CHART_AGGREGATION_RESULT_MODEL,
    mockTradingRunSummaryResultSchema: TRADING_LAB_MOCK_TRADING_RUN_SUMMARY_RESULT_SCHEMA,
    mockDashboardCleanupPreflightModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_MODEL,
    mockDashboardSectionInventoryModel: TRADING_LAB_MOCK_DASHBOARD_SECTION_INVENTORY_MODEL,
    mockDashboardPriorityLayoutModel: TRADING_LAB_MOCK_DASHBOARD_PRIORITY_LAYOUT_MODEL,
    mockDashboardCollapsibleSectionPlanModel: TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_SECTION_PLAN_MODEL,
    mockDashboardCleanupPreflightResultSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_PREFLIGHT_RESULT_SCHEMA,
    mockDashboardCleanupReviewResultModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RESULT_MODEL,
    mockDashboardCleanupReviewReceiptSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_RECEIPT_SCHEMA,
    mockDashboardCleanupReviewDecisionSummaryModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_DECISION_SUMMARY_MODEL,
    mockDashboardCleanupReviewSectionSummaryModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_REVIEW_SECTION_SUMMARY_MODEL,
    mockDashboardCleanupCoreModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_MODEL,
    mockDashboardCleanupResultModel: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_MODEL,
    mockDashboardSummaryFirstLayoutResultModel: TRADING_LAB_MOCK_DASHBOARD_SUMMARY_FIRST_LAYOUT_RESULT_MODEL,
    mockDashboardCollapsibleDetailGroupResultModel: TRADING_LAB_MOCK_DASHBOARD_COLLAPSIBLE_DETAIL_GROUP_RESULT_MODEL,
    mockDashboardCleanupResultSchema: TRADING_LAB_MOCK_DASHBOARD_CLEANUP_RESULT_SCHEMA,
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
    flags: { ...STEP164_ADMIN_TRADING_LAB_MOCK_DASHBOARD_CLEANUP_CORE_FLAGS },
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
