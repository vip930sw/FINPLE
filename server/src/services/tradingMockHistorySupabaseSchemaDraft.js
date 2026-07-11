export const STEP187_MOCK_TRADING_HISTORY_SUPABASE_SCHEMA_DRAFT_FLAGS = Object.freeze({
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  dbWriteAllowed: false,
  supabaseMutationAllowed: false,
  sqlFileCreationAllowed: false,
  migrationFileCreationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_SCHEMA_DRAFT_MODEL = Object.freeze({
  schemaDraftId: "string",
  schemaVersion: "draft_v1",
  database: "postgres",
  platform: "supabase",
  scope: "admin_mock_trading_lab",
  status: "draft_only",
  redacted: true,
  tables: "table_definition[]",
  relationships: "relationship_definition[]",
  indexes: "index_draft[]",
  constraints: "constraint_draft[]",
  rlsPolicies: "rls_policy_draft[]",
  retentionPolicies: "retention_policy[]",
  migrationOrder: "migration_sequence_step[]",
  browserQueryContract: "history_browser_query_contract",
  compareQueryContract: "history_compare_query_contract",
  restoreQueryContract: "history_restore_query_contract",
  blockedOperations: "blocked_operation[]",
  nextImplementationStep: "mock_trading_history_browser_ui",
});

const column = (name, type, options = {}) => ({
  name,
  type,
  nullable: options.nullable === true,
  defaultValue: options.defaultValue || null,
  role: options.role || "mock_history_field",
  sensitive: false,
  redacted: true,
});

const jsonbColumn = (name, options = {}) => column(name, "jsonb", options);
const textColumn = (name, options = {}) => column(name, "text", options);
const timestampColumn = (name, options = {}) => column(name, "timestamptz", options);
const numericColumn = (name, options = {}) => column(name, "numeric", options);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS = Object.freeze([
  {
    tableName: "mock_trading_strategy_presets",
    entityName: "StrategyPreset",
    role: "admin_defined_strategy_container",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      textColumn("name", { role: "display_name" }),
      textColumn("description", { nullable: true, role: "admin_description" }),
      textColumn("status", { role: "strategy_status" }),
      jsonbColumn("tags", { defaultValue: "empty_json_array", role: "admin_tags" }),
      textColumn("source", { defaultValue: "admin_mock_lab", role: "mock_source" }),
      timestampColumn("archived_at", { nullable: true, role: "soft_archive_marker" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      timestampColumn("updated_at", { role: "updated_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    candidateChecks: [
      "name_length_limit",
      "status_text_check",
      "soft_archive_state",
      "unique_name_requires_future_product_decision",
    ],
    forbiddenFields: ["credential", "account_identifier", "provider_payload", "order_payload"],
    redacted: true,
  },
  {
    tableName: "mock_trading_strategy_versions",
    entityName: "StrategyVersion",
    role: "immutable_strategy_version_for_mock_runs",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("strategy_preset_id", "uuid", { role: "foreign_key_to_strategy_preset" }),
      column("version_number", "integer", { role: "version_number" }),
      textColumn("version_label", { nullable: true, role: "admin_version_label" }),
      textColumn("strategy_type", { role: "strategy_type" }),
      jsonbColumn("asset_universe", { role: "mock_asset_universe" }),
      jsonbColumn("target_allocations", { role: "mock_target_allocations" }),
      jsonbColumn("rebalance_rule", { role: "mock_rebalance_rule" }),
      jsonbColumn("risk_limits", { role: "mock_risk_limits" }),
      textColumn("calculation_version", { role: "calculation_version" }),
      timestampColumn("frozen_at", { role: "immutable_version_timestamp" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["strategy_preset_id", "version_number"]],
    candidateChecks: [
      "completed_run_version_immutable",
      "json_shape_validation_before_write",
      "no_live_account_or_credential_fields",
    ],
    forbiddenFields: ["credential", "live_account_setting", "kis_order_setting"],
    redacted: true,
  },
  {
    tableName: "mock_trading_runs",
    entityName: "MockTradingRun",
    role: "history_browser_primary_row",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("strategy_version_id", "uuid", { role: "foreign_key_to_strategy_version" }),
      textColumn("run_label", { role: "history_display_label" }),
      textColumn("run_scope", { defaultValue: "mock_only", role: "mock_scope" }),
      textColumn("run_status", { role: "run_status" }),
      jsonbColumn("input_snapshot", { role: "mock_input_snapshot" }),
      jsonbColumn("output_summary", { nullable: true, role: "mock_output_summary" }),
      jsonbColumn("safety_snapshot", { role: "fail_closed_safety_snapshot" }),
      timestampColumn("started_at", { nullable: true, role: "mock_started_at" }),
      timestampColumn("completed_at", { nullable: true, role: "mock_completed_at" }),
      column("parent_run_id", "uuid", { nullable: true, role: "self_reference_parent" }),
      column("restored_from_run_id", "uuid", { nullable: true, role: "self_reference_restore_source" }),
      timestampColumn("archived_at", { nullable: true, role: "soft_archive_marker" }),
      timestampColumn("invalidated_at", { nullable: true, role: "invalidation_marker" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    candidateChecks: [
      "run_status_text_check",
      "completed_run_immutable",
      "self_reference_cycle_guard_required",
      "name_and_prefix_separate_from_live_run",
    ],
    forbiddenFields: ["live_trading_run_identifier", "provider_payload", "order_payload"],
    redacted: true,
  },
  {
    tableName: "mock_trading_order_summaries",
    entityName: "MockOrderSummary",
    role: "mock_order_summary_without_live_order_identity",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("sequence_number", "integer", { role: "run_local_sequence" }),
      textColumn("symbol", { role: "mock_symbol" }),
      textColumn("market", { role: "mock_market" }),
      textColumn("side", { role: "mock_side" }),
      numericColumn("mock_quantity", { role: "mock_quantity" }),
      numericColumn("mock_price", { nullable: true, role: "mock_price" }),
      numericColumn("mock_notional", { nullable: true, role: "mock_notional" }),
      textColumn("order_reason", { nullable: true, role: "mock_order_reason" }),
      textColumn("validation_status", { role: "validation_status" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["mock_trading_run_id", "sequence_number"]],
    candidateChecks: ["non_negative_mock_quantity_price_notional", "provider_payload_forbidden"],
    forbiddenFields: ["live_order_identifier", "provider_payload", "kis_request", "kis_response"],
    redacted: true,
  },
  {
    tableName: "mock_trading_fill_summaries",
    entityName: "MockFillSummary",
    role: "mock_fill_summary_without_live_execution_identity",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("mock_order_summary_id", "uuid", { role: "foreign_key_to_mock_order_summary" }),
      column("sequence_number", "integer", { role: "run_local_sequence" }),
      textColumn("symbol", { role: "mock_symbol" }),
      numericColumn("mock_fill_price", { role: "mock_fill_price" }),
      numericColumn("mock_fill_quantity", { role: "mock_fill_quantity" }),
      numericColumn("mock_fee", { defaultValue: "0", role: "mock_fee" }),
      numericColumn("mock_slippage", { defaultValue: "0", role: "mock_slippage" }),
      textColumn("fill_status", { role: "mock_fill_status" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    candidateChecks: [
      "non_negative_mock_fill_quantity_price_fee_slippage",
      "mock_order_and_run_relation_consistency_required",
    ],
    forbiddenFields: ["live_execution_identifier", "live_fill_identifier", "kis_execution_payload", "kis_fill_payload"],
    redacted: true,
  },
  {
    tableName: "mock_trading_ledger_snapshots",
    entityName: "MockLedgerSnapshot",
    role: "mock_cash_position_equity_snapshot",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("snapshot_sequence", "integer", { role: "run_local_snapshot_sequence" }),
      timestampColumn("snapshot_at", { role: "mock_snapshot_timestamp" }),
      numericColumn("mock_cash", { role: "mock_cash" }),
      numericColumn("mock_equity", { role: "mock_equity" }),
      jsonbColumn("position_summary", { role: "mock_position_summary" }),
      jsonbColumn("cash_delta", { nullable: true, role: "mock_cash_delta" }),
      jsonbColumn("position_delta", { nullable: true, role: "mock_position_delta" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["mock_trading_run_id", "snapshot_sequence"]],
    candidateChecks: ["separate_from_live_account_balance", "no_raw_checksum_value_storage"],
    forbiddenFields: ["live_account_balance", "live_position", "raw_hash", "raw_digest"],
    redacted: true,
  },
  {
    tableName: "mock_trading_performance_snapshots",
    entityName: "MockPerformanceSnapshot",
    role: "mock_performance_metric_snapshot",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("snapshot_sequence", "integer", { role: "run_local_snapshot_sequence" }),
      timestampColumn("snapshot_at", { role: "mock_snapshot_timestamp" }),
      numericColumn("cumulative_return", { nullable: true, role: "mock_cumulative_return" }),
      numericColumn("period_return", { nullable: true, role: "mock_period_return" }),
      numericColumn("mdd", { nullable: true, role: "mock_mdd" }),
      numericColumn("volatility", { nullable: true, role: "mock_volatility" }),
      numericColumn("sharpe", { nullable: true, role: "mock_sharpe" }),
      numericColumn("turnover", { nullable: true, role: "mock_turnover" }),
      numericColumn("mock_fees", { nullable: true, role: "mock_fees" }),
      numericColumn("mock_slippage", { nullable: true, role: "mock_slippage" }),
      jsonbColumn("equity_curve", { nullable: true, role: "mock_equity_curve" }),
      jsonbColumn("drawdown_series", { nullable: true, role: "mock_drawdown_series" }),
      textColumn("calculation_version", { role: "calculation_version" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["mock_trading_run_id", "snapshot_sequence"]],
    candidateChecks: [
      "metric_range_checks_before_write",
      "large_series_storage_cost_review_required",
      "latest_snapshot_summary_query_required",
    ],
    forbiddenFields: ["provider_debug_payload", "live_performance_record"],
    redacted: true,
  },
  {
    tableName: "mock_trading_allocation_snapshots",
    entityName: "MockAllocationSnapshot",
    role: "mock_allocation_drift_snapshot",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("snapshot_sequence", "integer", { role: "run_local_snapshot_sequence" }),
      timestampColumn("snapshot_at", { role: "mock_snapshot_timestamp" }),
      jsonbColumn("allocation", { role: "mock_allocation" }),
      jsonbColumn("drift", { nullable: true, role: "mock_allocation_drift" }),
      column("rebalance_needed", "boolean", { defaultValue: "false", role: "mock_rebalance_flag" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["mock_trading_run_id", "snapshot_sequence"]],
    candidateChecks: ["allocation_sum_service_validation_before_write"],
    forbiddenFields: ["live_account_position", "live_account_balance"],
    redacted: true,
  },
  {
    tableName: "mock_trading_risk_snapshots",
    entityName: "MockRiskSnapshot",
    role: "mock_risk_metric_snapshot",
    primaryKey: "id",
    columns: [
      column("id", "uuid", { role: "primary_key" }),
      column("mock_trading_run_id", "uuid", { role: "foreign_key_to_mock_run" }),
      column("snapshot_sequence", "integer", { role: "run_local_snapshot_sequence" }),
      timestampColumn("snapshot_at", { role: "mock_snapshot_timestamp" }),
      numericColumn("risk_score", { nullable: true, role: "mock_risk_score" }),
      numericColumn("concentration_risk", { nullable: true, role: "mock_concentration_risk" }),
      numericColumn("liquidity_risk", { nullable: true, role: "mock_liquidity_risk" }),
      numericColumn("volatility_risk", { nullable: true, role: "mock_volatility_risk" }),
      jsonbColumn("risk_flags", { defaultValue: "empty_json_array", role: "mock_risk_flags" }),
      timestampColumn("created_at", { role: "created_timestamp" }),
      column("redacted", "boolean", { defaultValue: "true", role: "redaction_marker" }),
    ],
    uniqueDrafts: [["mock_trading_run_id", "snapshot_sequence"]],
    candidateChecks: ["risk_score_range_review_before_write", "risk_flags_shape_validation_before_write"],
    forbiddenFields: ["live_risk_record", "provider_payload"],
    redacted: true,
  },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS = Object.freeze([
  { fromTable: "mock_trading_strategy_presets", toTable: "mock_trading_strategy_versions", relation: "one_to_many", deletePolicyDraft: "soft_archive_first" },
  { fromTable: "mock_trading_strategy_versions", toTable: "mock_trading_runs", relation: "one_to_many", deletePolicyDraft: "used_version_hard_delete_blocked" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_order_summaries", relation: "one_to_many", deletePolicyDraft: "cascade_only_after_explicit_run_hard_delete_approval" },
  { fromTable: "mock_trading_order_summaries", toTable: "mock_trading_fill_summaries", relation: "one_to_many", deletePolicyDraft: "run_consistency_required" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_ledger_snapshots", relation: "one_to_many", deletePolicyDraft: "cascade_only_after_explicit_run_hard_delete_approval" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_performance_snapshots", relation: "one_to_many", deletePolicyDraft: "cascade_only_after_explicit_run_hard_delete_approval" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_allocation_snapshots", relation: "one_to_many", deletePolicyDraft: "cascade_only_after_explicit_run_hard_delete_approval" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_risk_snapshots", relation: "one_to_many", deletePolicyDraft: "cascade_only_after_explicit_run_hard_delete_approval" },
  { fromTable: "mock_trading_runs", toTable: "mock_trading_runs", relation: "self_reference_parent_and_restore_source", deletePolicyDraft: "cycle_guard_required" },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_INDEX_DRAFTS = Object.freeze([
  { tableName: "mock_trading_strategy_presets", columns: ["status", "updated_at"], priority: "history_admin_filter" },
  { tableName: "mock_trading_strategy_versions", columns: ["strategy_preset_id", "version_number"], priority: "version_lookup" },
  { tableName: "mock_trading_runs", columns: ["strategy_version_id"], priority: "strategy_run_lookup" },
  { tableName: "mock_trading_runs", columns: ["created_at"], priority: "history_default_sort" },
  { tableName: "mock_trading_runs", columns: ["completed_at"], priority: "history_completed_sort" },
  { tableName: "mock_trading_runs", columns: ["run_status"], priority: "status_filter" },
  { tableName: "mock_trading_runs", columns: ["archived_at"], priority: "archive_filter" },
  { tableName: "mock_trading_runs", columns: ["restored_from_run_id"], priority: "restore_trace_lookup" },
  { tableName: "mock_trading_order_summaries", columns: ["mock_trading_run_id"], priority: "child_lookup" },
  { tableName: "mock_trading_fill_summaries", columns: ["mock_trading_run_id"], priority: "child_lookup" },
  { tableName: "mock_trading_ledger_snapshots", columns: ["mock_trading_run_id", "snapshot_sequence"], priority: "snapshot_sequence_lookup" },
  { tableName: "mock_trading_performance_snapshots", columns: ["mock_trading_run_id", "snapshot_sequence"], priority: "snapshot_sequence_lookup" },
  { tableName: "mock_trading_allocation_snapshots", columns: ["mock_trading_run_id", "snapshot_sequence"], priority: "snapshot_sequence_lookup" },
  { tableName: "mock_trading_risk_snapshots", columns: ["mock_trading_run_id", "snapshot_sequence"], priority: "snapshot_sequence_lookup" },
  { tableName: "mock_trading_performance_snapshots", columns: ["cumulative_return", "mdd"], priority: "future_performance_filter_candidate" },
  { tableName: "mock_trading_risk_snapshots", columns: ["risk_score"], priority: "future_risk_filter_candidate" },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_CONSTRAINT_DRAFTS = Object.freeze([
  { constraintId: "strategy_status_text_check", tableName: "mock_trading_strategy_presets", values: ["draft", "reviewed", "archived"], implementationPreference: "text_check_before_enum" },
  { constraintId: "run_status_text_check", tableName: "mock_trading_runs", values: ["draft", "running", "completed", "failed", "blocked", "archived", "invalidated"], implementationPreference: "text_check_before_enum" },
  { constraintId: "order_side_text_check", tableName: "mock_trading_order_summaries", values: ["mock_buy", "mock_sell", "mock_hold"], implementationPreference: "text_check_before_enum" },
  { constraintId: "validation_status_text_check", tableName: "mock_trading_order_summaries", values: ["mock_only", "blocked", "validation_required"], implementationPreference: "text_check_before_enum" },
  { constraintId: "fill_status_text_check", tableName: "mock_trading_fill_summaries", values: ["mock_only", "blocked", "validation_required"], implementationPreference: "text_check_before_enum" },
  { constraintId: "non_negative_mock_amounts", tableName: "mock_trading_order_summaries", values: ["mock_quantity", "mock_price", "mock_notional"], implementationPreference: "numeric_check_draft" },
  { constraintId: "no_nan_or_infinity_numeric_values", tableName: "all_numeric_tables", values: ["numeric_values_finite"], implementationPreference: "service_validation_plus_db_check_candidate" },
  { constraintId: "allocation_sum_validation", tableName: "mock_trading_allocation_snapshots", values: ["allocation_json_shape"], implementationPreference: "service_validation_before_db_constraint" },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS = Object.freeze([
  { policyId: "admin_mock_history_select", actor: "admin_user", operation: "select", status: "future_read_only_candidate", access: "allow_admin_only" },
  { policyId: "admin_mock_history_insert_future_candidate", actor: "admin_user", operation: "insert", status: "blocked_until_write_approval", access: "blocked_now" },
  { policyId: "public_access_denied", actor: "anon_public", operation: "all", status: "blocked", access: "deny" },
  { policyId: "authenticated_user_access_denied", actor: "general_authenticated_user", operation: "all", status: "blocked", access: "deny" },
  { policyId: "mypage_access_denied", actor: "mypage_user_surface", operation: "all", status: "blocked", access: "deny" },
  { policyId: "future_owner_history_requires_redesign", actor: "future_user_owned_history", operation: "select", status: "not_designed_now", access: "requires_owner_id_redesign" },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_RETENTION_POLICIES = Object.freeze([
  { subject: "completed_runs", policy: "retain_by_default", note: "mock history browser depends on completed run summaries" },
  { subject: "failed_or_blocked_runs", policy: "retain_for_diagnostics_candidate", note: "retention duration remains configurable and undecided" },
  { subject: "archived_runs", policy: "exclude_from_default_list", note: "archive first before any hard delete candidate" },
  { subject: "hard_delete", policy: "requires_admin_double_approval_candidate", note: "no hard delete is implemented now" },
  { subject: "raw_provider_debug_payload", policy: "never_store", note: "redaction boundary remains closed" },
  { subject: "large_curve_snapshot_data", policy: "storage_cost_review_required", note: "future aggregate snapshot or downsampling candidate" },
]);

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_MIGRATION_SEQUENCE = Object.freeze([
  "strategy_preset",
  "strategy_version",
  "mock_run",
  "order_summary",
  "fill_summary",
  "ledger_snapshot",
  "performance_snapshot",
  "allocation_snapshot",
  "risk_snapshot",
  "indexes",
  "rls_enable_and_policy_drafts",
  "rollback_verification",
  "read_only_smoke_query",
  "write_gate_separate_approval",
]);

export const TRADING_LAB_MOCK_HISTORY_BROWSER_QUERY_CONTRACT = Object.freeze({
  fields: [
    "runId",
    "runLabel",
    "strategyPresetId",
    "strategyName",
    "strategyVersion",
    "runStatus",
    "createdAt",
    "completedAt",
    "assetCount",
    "orderCount",
    "fillCount",
    "finalMockEquity",
    "cumulativeReturn",
    "mdd",
    "riskScore",
    "archived",
    "restoredFromRunId",
  ],
  pagination: {
    mode: "cursor",
    defaultPageSize: 20,
    maxPageSize: 100,
    secondarySort: "id",
  },
  filters: ["date_range", "strategy_preset", "run_status", "return_range", "mdd_range", "risk_score", "archived"],
  dbQueryImplementedNow: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_HISTORY_COMPARE_QUERY_CONTRACT = Object.freeze({
  runCount: { min: 2, max: 3 },
  fields: [
    "run_summary",
    "strategy_version",
    "allocation",
    "capital_equity",
    "return",
    "mdd",
    "volatility",
    "sharpe",
    "turnover",
    "fee_slippage",
    "risk_score",
    "warning_blocker_count",
  ],
  calculationVersionCompatibilityRequired: true,
  dbQueryImplementedNow: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_HISTORY_RESTORE_QUERY_CONTRACT = Object.freeze({
  readFields: ["source_run", "source_strategy_version", "eligible_copied_fields"],
  futureWrite: {
    createsNewStrategyDraftCandidate: true,
    sourceRunImmutable: true,
    sourceVersionImmutable: true,
    resultSnapshotsCopyBlocked: true,
    orderFillPerformanceSnapshotCopyBlocked: true,
    credentialAccountProviderFieldCopyBlocked: true,
  },
  writeImplementedNow: false,
  redacted: true,
});

export const TRADING_LAB_MOCK_HISTORY_SUPABASE_BLOCKED_OPERATIONS = Object.freeze([
  "sql_file_creation",
  "migration_file_creation",
  "supabase_migration_creation",
  "db_schema_change",
  "persistent_db_write",
  "supabase_insert_update_delete",
  "provider_network_call",
  "kis_token_issuance",
  "kis_quote_query",
  "order_submission",
  "live_account_balance_query",
  "live_trading_run_creation",
  "mypage_trading_ui",
  "homepage_public_trading_ui",
  "readiness_flag_promotion",
]);

function summarizeTables(tables) {
  return tables.map((table) => ({
    tableName: table.tableName,
    entityName: table.entityName,
    columnCount: table.columns.length,
    primaryKey: table.primaryKey,
    uniqueDraftCount: table.uniqueDrafts?.length || 0,
    candidateCheckCount: table.candidateChecks.length,
    redacted: true,
  }));
}

export function validateMockHistorySupabaseSchemaDraft(input = {}) {
  const architectureStatus = input.architectureStatus || {};
  const architecture = architectureStatus.architecture || {};
  const tables = input.tables || TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS;
  const relationships = input.relationships || TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS;
  const indexes = input.indexes || TRADING_LAB_MOCK_HISTORY_SUPABASE_INDEX_DRAFTS;
  const constraints = input.constraints || TRADING_LAB_MOCK_HISTORY_SUPABASE_CONSTRAINT_DRAFTS;
  const rlsPolicies = input.rlsPolicies || TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS;
  const requiredTables = [
    "mock_trading_strategy_presets",
    "mock_trading_strategy_versions",
    "mock_trading_runs",
    "mock_trading_order_summaries",
    "mock_trading_fill_summaries",
    "mock_trading_ledger_snapshots",
    "mock_trading_performance_snapshots",
    "mock_trading_allocation_snapshots",
    "mock_trading_risk_snapshots",
  ];
  const tableNames = tables.map((table) => table.tableName);
  const missingTables = requiredTables.filter((tableName) => !tableNames.includes(tableName));
  const serialized = JSON.stringify({ tables, relationships, indexes, constraints, rlsPolicies });
  const forbiddenMarkers = [
    "credential_raw",
    "account_number_raw",
    "kis_access_token",
    "provider_raw_response",
    "order_payload_raw",
    "private_path_raw",
    "hash_value",
    "digest_value",
  ].filter((marker) => serialized.includes(marker));
  const blockers = [];
  const warnings = [
    "schema_draft_only_no_sql_file_created",
    "migration_sequence_requires_future_review",
    "write_gate_requires_separate_approval",
  ];

  if (architecture?.status !== "architecture_decision_recorded") blockers.push("step186_architecture_not_recorded");
  if (architecture?.redacted !== true) blockers.push("step186_architecture_not_redacted");
  if (architecture?.dbMigrationDecision?.nextAllowedStep !== "db_backed_mock_trading_history_sql_draft_preflight") blockers.push("step186_next_step_not_schema_draft");
  if (missingTables.length > 0) blockers.push("schema_draft_missing_expected_tables");
  if (relationships.length < 9) blockers.push("relationship_draft_incomplete");
  if (indexes.length < 14) blockers.push("index_draft_incomplete");
  if (!constraints.some((constraint) => constraint.constraintId === "run_status_text_check")) blockers.push("run_status_constraint_missing");
  if (!rlsPolicies.some((policy) => policy.policyId === "public_access_denied" && policy.access === "deny")) blockers.push("public_rls_denial_missing");
  if (!rlsPolicies.some((policy) => policy.policyId === "mypage_access_denied" && policy.access === "deny")) blockers.push("mypage_rls_denial_missing");
  if (forbiddenMarkers.length > 0) blockers.push("schema_draft_contains_forbidden_sensitive_marker");

  return {
    validationId: "step187_mock_trading_history_supabase_schema_draft_validation",
    sourceStep: "step187",
    architectureStatus: architecture?.status || "missing",
    expectedTableCount: requiredTables.length,
    tableCount: tables.length,
    missingTables,
    relationshipCount: relationships.length,
    indexCount: indexes.length,
    constraintCount: constraints.length,
    rlsPolicyCount: rlsPolicies.length,
    forbiddenMarkers,
    sqlFileCreated: false,
    migrationFileCreated: false,
    supabaseMigrationCreated: false,
    dbSchemaChanged: false,
    persistentDbWriteAttempted: false,
    supabaseMutationAttempted: false,
    blockers,
    warnings,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    readinessImpact: "none",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    redacted: true,
  };
}

export function buildMockHistorySupabaseSchemaDraft(input = {}) {
  const validation = input.validation || validateMockHistorySupabaseSchemaDraft(input);
  return {
    schemaDraftId: "step187_mock_trading_history_supabase_schema_draft",
    schemaVersion: "draft_v1",
    database: "postgres",
    platform: "supabase",
    scope: "admin_mock_trading_lab",
    status: validation.blockerCount === 0 ? "draft_only" : "blocked",
    redacted: true,
    tables: input.tables || TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS,
    relationships: input.relationships || TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS,
    indexes: input.indexes || TRADING_LAB_MOCK_HISTORY_SUPABASE_INDEX_DRAFTS,
    constraints: input.constraints || TRADING_LAB_MOCK_HISTORY_SUPABASE_CONSTRAINT_DRAFTS,
    rlsPolicies: input.rlsPolicies || TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS,
    retentionPolicies: input.retentionPolicies || TRADING_LAB_MOCK_HISTORY_SUPABASE_RETENTION_POLICIES,
    migrationOrder: input.migrationOrder || TRADING_LAB_MOCK_HISTORY_SUPABASE_MIGRATION_SEQUENCE,
    browserQueryContract: input.browserQueryContract || TRADING_LAB_MOCK_HISTORY_BROWSER_QUERY_CONTRACT,
    compareQueryContract: input.compareQueryContract || TRADING_LAB_MOCK_HISTORY_COMPARE_QUERY_CONTRACT,
    restoreQueryContract: input.restoreQueryContract || TRADING_LAB_MOCK_HISTORY_RESTORE_QUERY_CONTRACT,
    blockedOperations: input.blockedOperations || TRADING_LAB_MOCK_HISTORY_SUPABASE_BLOCKED_OPERATIONS,
    nextImplementationStep: "mock_trading_history_browser_ui",
    sqlFileCreated: false,
    migrationFileCreated: false,
    supabaseMigrationCreated: false,
    dbSchemaChanged: false,
    persistentDbWriteAttempted: false,
    supabaseMutationAttempted: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
  };
}

export function buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus(input = {}) {
  const validation = input.validation || validateMockHistorySupabaseSchemaDraft(input);
  const schemaDraft = input.schemaDraft || buildMockHistorySupabaseSchemaDraft({ ...input, validation });
  const tableSummary = summarizeTables(schemaDraft.tables);

  return {
    ok: true,
    step: "Step 187: Design Supabase schema draft for mock trading history",
    status: "admin_only_mock_trading_history_supabase_schema_draft_read_only",
    sourceStep: "step187",
    schemaDraftModel: TRADING_LAB_MOCK_HISTORY_SUPABASE_SCHEMA_DRAFT_MODEL,
    schemaDraft,
    validation,
    tableSummary,
    relationshipSummary: {
      relationshipCount: schemaDraft.relationships.length,
      selfReferenceIncluded: schemaDraft.relationships.some((relationship) => relationship.fromTable === relationship.toTable),
      deletePolicy: "archive_or_invalidate_first",
      redacted: true,
    },
    queryContractSummary: {
      browserFieldCount: schemaDraft.browserQueryContract.fields.length,
      compareRunLimit: schemaDraft.compareQueryContract.runCount,
      restoreWriteImplementedNow: false,
      redacted: true,
    },
    blockedConfirmation: {
      endpointAdded: false,
      sqlFileCreated: false,
      migrationFileCreated: false,
      supabaseMigrationCreated: false,
      dbSchemaChanged: false,
      persistentDbWriteAttempted: false,
      supabaseInsertAttempted: false,
      supabaseUpdateAttempted: false,
      supabaseDeleteAttempted: false,
      providerCallAttempted: false,
      tokenIssuanceAttempted: false,
      quoteQueryAttempted: false,
      orderSubmissionAttempted: false,
      liveAccountBalanceQueried: false,
      liveTradingRunCreated: false,
      mypageTradingUiExposed: false,
      homepageTradingUiExposed: false,
      publicTradingUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP187_MOCK_TRADING_HISTORY_SUPABASE_SCHEMA_DRAFT_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    dbMigrationAllowed: false,
    dbWriteAllowed: false,
    dbMigrationCreated: false,
    dbSchemaChanged: false,
    sqlFileCreated: false,
    migrationFileCreated: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    supabaseMutationAttempted: false,
    redacted: true,
  };
}
