import assert from "node:assert/strict";
import test from "node:test";

import {
  TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_CANDIDATE_TABLE_DRAFT,
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus,
  buildDbBackedMockTradingHistoryMigrationReviewResult,
  validateDbBackedMockTradingHistoryMigrationReviewResult,
} from "./tradingAdminLabDashboardShell.js";

const EXPECTED_TABLES = [
  "mock_trading_strategy_presets",
  "mock_trading_runs",
  "mock_trading_order_summaries",
  "mock_trading_fill_summaries",
  "mock_trading_ledger_snapshots",
  "mock_trading_performance_snapshots",
  "mock_trading_allocation_snapshots",
  "mock_trading_risk_snapshots",
];

const SENSITIVE_RAW_VALUE_PATTERNS = [
  /kis_access_token/i,
  /app_secret_raw/i,
  /account_number_raw/i,
  /provider_response_body/i,
  /order_payload_raw/i,
  /private_packet_path/i,
  /sha256:[a-f0-9]{16,}/i,
  /digest_value/i,
  /actual_order_id/i,
  /actual_fill_id/i,
  /actual_execution_id/i,
  /actual_trading_run_id/i,
  /actual_account_balance/i,
];

const DEFAULT_STEP184_STATUS = buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus();
const DEFAULT_STEP185_STATUS = buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus({
  migrationPreflightStatus: DEFAULT_STEP184_STATUS,
});
const DEFAULT_STEP185_BUNDLE = buildDbBackedMockTradingHistoryMigrationReviewResult({
  migrationPreflightStatus: DEFAULT_STEP184_STATUS,
});

test("Step185 records a redacted migration review receipt from Step184 preflight", () => {
  const status = DEFAULT_STEP185_STATUS;
  const { reviewResult, receipt } = status;

  assert.equal(status.sourceStep, "step185");
  assert.equal(reviewResult.scope, "admin_mock_trading_lab");
  assert.equal(reviewResult.reviewStatus, "recorded");
  assert.equal(reviewResult.decision, "migration_draft_review_recorded");
  assert.equal(reviewResult.migrationMode, "draft_only");
  assert.equal(reviewResult.ddlDraftStatus, "reviewed_not_created");
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "db_backed_mock_trading_history_sql_draft_preflight");
});

test("Step185 reviews all candidate table index constraint and RLS drafts without creating files", () => {
  const status = DEFAULT_STEP185_STATUS;
  const { receipt, tableIndexConstraintRlsReviewSummary, migrationChangeBlockedConfirmation } = status;

  assert.equal(receipt.candidateTableCount, EXPECTED_TABLES.length);
  assert.equal(receipt.approvedTableDraftCount, EXPECTED_TABLES.length);
  assert.equal(receipt.blockedTableDraftCount, 0);
  assert.ok(receipt.candidateIndexCount >= 8);
  assert.ok(receipt.candidateConstraintCount >= 8);
  assert.equal(receipt.candidateRlsPolicyCount, 2);
  assert.deepEqual(
    tableIndexConstraintRlsReviewSummary.tableReviewSummary.map((table) => table.tableName),
    EXPECTED_TABLES,
  );
  assert.equal(tableIndexConstraintRlsReviewSummary.rlsReviewSummary.publicExposureBlocked, true);
  assert.equal(tableIndexConstraintRlsReviewSummary.redactionReviewSummary.providerRawResponseExcluded, true);
  assert.equal(migrationChangeBlockedConfirmation.migrationFileCreated, false);
  assert.equal(migrationChangeBlockedConfirmation.sqlFileCreated, false);
  assert.equal(migrationChangeBlockedConfirmation.supabaseMigrationCreated, false);
});

test("Step185 keeps migration schema write and Supabase mutation blocked", () => {
  const status = DEFAULT_STEP185_STATUS;
  const { receipt, migrationChangeBlockedConfirmation } = status;

  assert.equal(receipt.dbMigrationStatus, "blocked");
  assert.equal(receipt.schemaChangeStatus, "blocked");
  assert.equal(receipt.dbWriteStatus, "blocked");
  assert.equal(receipt.supabaseMutationStatus, "blocked");
  assert.equal(migrationChangeBlockedConfirmation.dbMigrationExecuted, false);
  assert.equal(migrationChangeBlockedConfirmation.dbSchemaChanged, false);
  assert.equal(migrationChangeBlockedConfirmation.persistentDbWriteAttempted, false);
  assert.equal(migrationChangeBlockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(migrationChangeBlockedConfirmation.supabaseUpdateAttempted, false);
  assert.equal(migrationChangeBlockedConfirmation.supabaseDeleteAttempted, false);
});

test("Step185 blocks missing non-redacted or non-draft Step184 preflight", () => {
  const missingValidation = validateDbBackedMockTradingHistoryMigrationReviewResult({
    migrationPreflightStatus: { migrationPreflight: null, validation: null, dbChangeBlockedConfirmation: {} },
  });
  assert.ok(missingValidation.blockers.includes("step184_migration_preflight_missing"));

  const nonRedactedStatus = structuredClone(DEFAULT_STEP184_STATUS);
  nonRedactedStatus.migrationPreflight.redacted = false;
  const nonRedactedValidation = validateDbBackedMockTradingHistoryMigrationReviewResult({ migrationPreflightStatus: nonRedactedStatus });
  assert.ok(nonRedactedValidation.blockers.includes("step184_migration_preflight_not_redacted"));

  const nonDraftStatus = structuredClone(DEFAULT_STEP184_STATUS);
  nonDraftStatus.migrationPreflight.migrationMode = "live";
  const nonDraftValidation = validateDbBackedMockTradingHistoryMigrationReviewResult({ migrationPreflightStatus: nonDraftStatus });
  assert.ok(nonDraftValidation.blockers.includes("step184_migration_mode_not_draft_only"));
});

test("Step185 blocks forbidden sensitive table draft values and missing deterministic tables", () => {
  const migrationPreflightStatus = structuredClone(DEFAULT_STEP184_STATUS);
  migrationPreflightStatus.migrationPreflight.candidateTables = [
    {
      ...TRADING_LAB_DB_BACKED_MOCK_TRADING_HISTORY_MIGRATION_CANDIDATE_TABLE_DRAFT[0],
      proposedColumns: ["id", "credential"],
    },
  ];

  const validation = validateDbBackedMockTradingHistoryMigrationReviewResult({ migrationPreflightStatus });
  assert.ok(validation.blockers.includes("candidate_tables_missing_required_drafts"));
  assert.ok(validation.blockers.includes("candidate_table_count_not_deterministic"));
  assert.ok(validation.blockers.includes("candidate_table_contains_forbidden_sensitive_field"));
  assert.equal(validation.dbMigrationStatus, "blocked");
  assert.equal(validation.dbWriteStatus, "blocked");
  assert.equal(validation.supabaseMutationStatus, "blocked");
});

test("Step185 result remains redacted and does not promote provider order live or DB gates", () => {
  const status = DEFAULT_STEP185_STATUS;
  const serialized = JSON.stringify(status);
  const built = DEFAULT_STEP185_BUNDLE;

  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.tokenIssuanceAttempted, false);
  assert.equal(status.quoteRequestAttempted, false);
  assert.equal(status.networkCallAttempted, false);
  assert.equal(status.orderSubmissionAttempted, false);
  assert.equal(status.actualTradingRunCreated, false);
  assert.equal(status.accountBalanceQueried, false);
  assert.equal(status.dbWriteUsed, false);
  assert.equal(status.dbMigrationCreated, false);
  assert.equal(status.dbSchemaChanged, false);
  assert.equal(status.sqlFileCreated, false);
  assert.equal(built.receipt.migrationFileStatus, "not_created");
  for (const pattern of SENSITIVE_RAW_VALUE_PATTERNS) {
    assert.doesNotMatch(serialized, pattern);
  }
});
