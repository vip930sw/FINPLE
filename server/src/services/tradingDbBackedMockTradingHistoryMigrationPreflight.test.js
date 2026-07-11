import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus,
  buildDbBackedMockTradingHistoryMigrationPreflight,
  validateDbBackedMockTradingHistoryMigrationPreflight,
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
];

test("Step184 builds a draft-only migration preflight from Step183 review result", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus();
  const { migrationPreflight, candidateTableDraftSummary } = status;

  assert.equal(status.sourceStep, "step184");
  assert.equal(migrationPreflight.scope, "admin_mock_trading_lab");
  assert.equal(migrationPreflight.migrationMode, "draft_only");
  assert.equal(migrationPreflight.migrationStatus, "draft_ready");
  assert.equal(migrationPreflight.ddlDraftStatus, "draft_only");
  assert.equal(migrationPreflight.redacted, true);
  assert.equal(candidateTableDraftSummary.tableCount, EXPECTED_TABLES.length);
  assert.deepEqual(candidateTableDraftSummary.tableNames, EXPECTED_TABLES);
  assert.equal(migrationPreflight.nextAllowedStep, "db_backed_mock_trading_history_migration_review_result");
});

test("Step184 includes candidate table index constraint and RLS policy drafts without SQL files", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus();
  const { migrationPreflight, candidateIndexConstraintRlsPolicyDraftSummary } = status;

  assert.equal(migrationPreflight.candidateTables.length, 8);
  assert.ok(migrationPreflight.candidateIndexes.length >= 8);
  assert.ok(migrationPreflight.candidateConstraints.length >= 8);
  assert.equal(migrationPreflight.candidateRlsPolicies.length, 2);
  assert.equal(candidateIndexConstraintRlsPolicyDraftSummary.adminOnlyAccessPolicyDrafted, true);
  assert.equal(candidateIndexConstraintRlsPolicyDraftSummary.publicAccessBlocked, true);
  assert.equal(candidateIndexConstraintRlsPolicyDraftSummary.userFacingAccessBlocked, true);
  assert.equal(candidateIndexConstraintRlsPolicyDraftSummary.appliedToDatabase, false);
  assert.equal(migrationPreflight.sqlFileCreated, false);
  assert.equal(migrationPreflight.migrationFileCreated, false);
  assert.equal(migrationPreflight.supabaseMigrationCreated, false);
});

test("Step184 readiness checklist keeps migration and DB writes blocked", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus();
  const checklist = status.migrationReadinessChecklist.items;
  const keys = checklist.map((item) => item.key);

  for (const key of [
    "candidate_table_names_reviewed",
    "sensitive_field_exclusion_reviewed",
    "redaction_policy_reviewed",
    "mock_only_naming_reviewed",
    "actual_account_data_exclusion_reviewed",
    "provider_raw_response_exclusion_reviewed",
    "order_payload_exclusion_reviewed",
    "db_write_remains_blocked",
    "migration_file_not_created",
    "supabase_mutation_not_performed",
    "mypage_user_facing_exposure_blocked",
    "admin_only_boundary_maintained",
    "next_step_requires_explicit_approval",
  ]) {
    assert.ok(keys.includes(key));
  }
  assert.equal(status.dbChangeBlockedConfirmation.dbMigrationExecuted, false);
  assert.equal(status.dbChangeBlockedConfirmation.dbSchemaChanged, false);
  assert.equal(status.dbChangeBlockedConfirmation.persistentDbWriteAttempted, false);
  assert.equal(status.dbChangeBlockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(status.dbChangeBlockedConfirmation.supabaseUpdateAttempted, false);
  assert.equal(status.dbChangeBlockedConfirmation.supabaseDeleteAttempted, false);
});

test("Step184 blocks missing unsafe or non-recorded Step183 review result", () => {
  const missingValidation = validateDbBackedMockTradingHistoryMigrationPreflight({
    reviewResultStatus: { reviewResult: null, receipt: null },
  });
  assert.ok(missingValidation.blockers.includes("step183_review_result_missing"));

  const reviewResultStatus = structuredClone(buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus());
  reviewResultStatus.reviewResult.reviewStatus = "blocked";
  const blockedValidation = validateDbBackedMockTradingHistoryMigrationPreflight({ reviewResultStatus });
  assert.ok(blockedValidation.blockers.includes("step183_review_result_not_recorded"));
});

test("Step184 blocks forbidden sensitive migration candidate columns", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus();
  const candidateTables = [
    {
      tableName: "mock_trading_strategy_presets",
      proposedColumns: ["id", "credential_raw"],
      redacted: true,
    },
  ];
  const validation = validateDbBackedMockTradingHistoryMigrationPreflight({
    reviewResultStatus: status,
    candidateTables,
  });

  assert.ok(validation.blockers.includes("migration_candidate_tables_missing"));
  assert.ok(validation.blockers.includes("candidate_table_contains_forbidden_sensitive_field"));
  assert.equal(validation.schemaChangeStatus, "blocked");
  assert.equal(validation.dbWriteStatus, "blocked");
  assert.equal(validation.supabaseMutationStatus, "blocked");
});

test("Step184 does not promote DB provider order or live readiness", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus();
  const serialized = JSON.stringify(status);

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
  for (const pattern of SENSITIVE_RAW_VALUE_PATTERNS) {
    assert.doesNotMatch(serialized, pattern);
  }
});
