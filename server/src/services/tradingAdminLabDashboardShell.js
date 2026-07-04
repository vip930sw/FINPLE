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
    step: "Step 140: Admin trading lab mock order generation preflight",
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
