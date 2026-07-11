import test from "node:test";
import assert from "node:assert/strict";

import {
  TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS,
  TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS,
  TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS,
  buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus,
  buildMockHistorySupabaseSchemaDraft,
  validateMockHistorySupabaseSchemaDraft,
} from "./tradingMockHistorySupabaseSchemaDraft.js";

const SAFE_ARCHITECTURE_STATUS = Object.freeze({
  architecture: {
    status: "architecture_decision_recorded",
    redacted: true,
    dbMigrationDecision: {
      nextAllowedStep: "db_backed_mock_trading_history_sql_draft_preflight",
    },
  },
});

test("Step187 schema draft is deterministic and includes all expected tables", () => {
  const first = buildMockHistorySupabaseSchemaDraft({ architectureStatus: SAFE_ARCHITECTURE_STATUS });
  const second = buildMockHistorySupabaseSchemaDraft({ architectureStatus: SAFE_ARCHITECTURE_STATUS });

  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, "draft_v1");
  assert.equal(first.database, "postgres");
  assert.equal(first.platform, "supabase");
  assert.equal(first.scope, "admin_mock_trading_lab");
  assert.equal(first.status, "draft_only");
  assert.equal(first.tables.length, 9);
  assert.deepEqual(
    first.tables.map((table) => table.tableName),
    [
      "mock_trading_strategy_presets",
      "mock_trading_strategy_versions",
      "mock_trading_runs",
      "mock_trading_order_summaries",
      "mock_trading_fill_summaries",
      "mock_trading_ledger_snapshots",
      "mock_trading_performance_snapshots",
      "mock_trading_allocation_snapshots",
      "mock_trading_risk_snapshots",
    ],
  );
});

test("Step187 table drafts define primary key and relationship candidates", () => {
  for (const table of TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS) {
    assert.equal(table.primaryKey, "id");
    assert.equal(table.columns.some((column) => column.name === "id" && column.type === "uuid"), true);
    assert.equal(table.redacted, true);
  }

  assert.equal(
    TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS.some(
      (relationship) =>
        relationship.fromTable === "mock_trading_strategy_presets" &&
        relationship.toTable === "mock_trading_strategy_versions",
    ),
    true,
  );
  assert.equal(
    TRADING_LAB_MOCK_HISTORY_SUPABASE_RELATIONSHIP_DRAFTS.some(
      (relationship) =>
        relationship.fromTable === "mock_trading_runs" &&
        relationship.toTable === "mock_trading_runs" &&
        relationship.relation === "self_reference_parent_and_restore_source",
    ),
    true,
  );
});

test("Step187 preserves completed run immutability and sensitive field exclusion", () => {
  const strategyVersion = TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS.find((table) => table.tableName === "mock_trading_strategy_versions");
  const mockRun = TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS.find((table) => table.tableName === "mock_trading_runs");
  const serialized = JSON.stringify(TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS);

  assert.equal(strategyVersion.candidateChecks.includes("completed_run_version_immutable"), true);
  assert.equal(mockRun.candidateChecks.includes("completed_run_immutable"), true);
  assert.equal(serialized.includes("credential_raw"), false);
  assert.equal(serialized.includes("account_number_raw"), false);
  assert.equal(serialized.includes("provider_raw_response"), false);
  assert.equal(serialized.includes("order_payload_raw"), false);
  assert.equal(serialized.includes("private_path_raw"), false);
  assert.equal(serialized.includes("hash_value"), false);
  assert.equal(serialized.includes("digest_value"), false);
});

test("Step187 RLS draft denies anon public mypage and general user surfaces", () => {
  const deniedPolicyIds = TRADING_LAB_MOCK_HISTORY_SUPABASE_RLS_POLICY_DRAFTS.filter((policy) => policy.access === "deny").map((policy) => policy.policyId);

  assert.equal(deniedPolicyIds.includes("public_access_denied"), true);
  assert.equal(deniedPolicyIds.includes("authenticated_user_access_denied"), true);
  assert.equal(deniedPolicyIds.includes("mypage_access_denied"), true);
});

test("Step187 query contracts support browser pagination compare and restore boundaries", () => {
  const status = buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus({ architectureStatus: SAFE_ARCHITECTURE_STATUS });
  const draft = status.schemaDraft;

  assert.equal(draft.browserQueryContract.pagination.mode, "cursor");
  assert.equal(draft.browserQueryContract.pagination.defaultPageSize, 20);
  assert.equal(draft.browserQueryContract.pagination.maxPageSize, 100);
  assert.equal(draft.browserQueryContract.pagination.secondarySort, "id");
  assert.equal(draft.browserQueryContract.fields.includes("restoredFromRunId"), true);
  assert.equal(draft.compareQueryContract.runCount.min, 2);
  assert.equal(draft.compareQueryContract.runCount.max, 3);
  assert.equal(draft.compareQueryContract.calculationVersionCompatibilityRequired, true);
  assert.equal(draft.restoreQueryContract.futureWrite.resultSnapshotsCopyBlocked, true);
  assert.equal(draft.restoreQueryContract.futureWrite.credentialAccountProviderFieldCopyBlocked, true);
  assert.equal(draft.restoreQueryContract.writeImplementedNow, false);
});

test("Step187 validation depends on Step186 architecture and blocks unsafe inputs", () => {
  const missing = validateMockHistorySupabaseSchemaDraft({});
  const unsafe = validateMockHistorySupabaseSchemaDraft({
    architectureStatus: {
      architecture: {
        status: "blocked",
        redacted: false,
        dbMigrationDecision: { nextAllowedStep: "unexpected" },
      },
    },
  });

  assert.equal(missing.blockers.includes("step186_architecture_not_recorded"), true);
  assert.equal(unsafe.blockers.includes("step186_architecture_not_recorded"), true);
  assert.equal(unsafe.blockers.includes("step186_architecture_not_redacted"), true);
  assert.equal(unsafe.blockers.includes("step186_next_step_not_schema_draft"), true);
});

test("Step187 status keeps DB provider order live gates blocked", () => {
  const status = buildAdminTradingLabMockHistorySupabaseSchemaDraftStatus({ architectureStatus: SAFE_ARCHITECTURE_STATUS });

  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.sqlFileCreated, false);
  assert.equal(status.blockedConfirmation.migrationFileCreated, false);
  assert.equal(status.blockedConfirmation.supabaseMigrationCreated, false);
  assert.equal(status.blockedConfirmation.dbSchemaChanged, false);
  assert.equal(status.blockedConfirmation.persistentDbWriteAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseUpdateAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseDeleteAttempted, false);
  assert.equal(status.blockedConfirmation.providerCallAttempted, false);
  assert.equal(status.blockedConfirmation.orderSubmissionAttempted, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
});
