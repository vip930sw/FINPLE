import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus,
  buildDbBackedMockTradingHistoryPreflight,
} from "./tradingAdminLabDashboardShell.js";

const FORBIDDEN_VALUE_TYPES = [
  "actual_account_number",
  "kis_token",
  "credential",
  "provider_raw_response",
  "order_payload",
  "actual_order_id",
  "actual_fill_id",
  "actual_execution_id",
  "actual_account_balance",
  "private_path",
  "hash",
  "digest",
];

test("Step182 DB-backed mock trading history preflight is schema draft only", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus();
  const preflight = status.preflight;

  assert.equal(status.sourceStep, "step182");
  assert.equal(preflight.scope, "mock_only");
  assert.equal(preflight.status, "preflight_ready_db_write_blocked");
  assert.equal(preflight.storageMode, "schema_draft_only_no_persistence");
  assert.equal(preflight.candidateCount, 8);
  assert.deepEqual(
    preflight.schemaDraft.tables.map((table) => table.candidate),
    [
      "strategy_preset",
      "mock_trading_run_summary",
      "mock_order_summary",
      "mock_fill_summary",
      "mock_portfolio_ledger_snapshot",
      "mock_performance_snapshot",
      "allocation_snapshot",
      "risk_metric_snapshot",
    ],
  );
});

test("Step182 redaction policy blocks sensitive DB history values", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus();
  const policy = status.redactionPolicySummary;
  const serialized = JSON.stringify(status);

  for (const valueType of FORBIDDEN_VALUE_TYPES) {
    assert.ok(policy.prohibitedValueTypes.includes(valueType));
  }
  assert.equal(policy.rawProviderResponseStored, false);
  assert.equal(policy.providerPayloadStored, false);
  assert.equal(policy.orderPayloadStored, false);
  assert.equal(policy.hashDigestStored, false);
  assert.equal(policy.privatePathStored, false);
  assert.doesNotMatch(serialized, /kis_access_token|app_secret|account_number_raw|private_packet_path/);
});

test("Step182 confirms DB migration and persistent writes remain blocked", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus();
  const dbWrite = status.dbWriteBlockedConfirmation;

  assert.equal(status.dbWriteUsed, false);
  assert.equal(status.dbMigrationCreated, false);
  assert.equal(status.dbSchemaChanged, false);
  assert.equal(status.supabaseInsertAttempted, false);
  assert.equal(status.supabaseUpdateAttempted, false);
  assert.equal(status.supabaseDeleteAttempted, false);
  assert.equal(dbWrite.dbMigrationAllowed, false);
  assert.equal(dbWrite.persistentDbWriteAllowed, false);
  assert.equal(dbWrite.dbWriteAttempted, false);
  assert.equal(status.boundaries.persistentDbWriteAllowed, false);
  assert.equal(status.boundaries.dbMigrationAllowed, false);
});

test("Step182 does not promote provider order or live readiness flags", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus();

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
});

test("Step182 blocks when the upstream mock dashboard dependency is unsafe", () => {
  const preflight = buildDbBackedMockTradingHistoryPreflight({
    dashboardUxPolishCoreStatus: {
      coreResult: { redacted: false },
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbWriteUsed: false,
    },
  });

  assert.equal(preflight.status, "blocked");
  assert.equal(preflight.dependencyStatus, "blocked");
  assert.ok(preflight.blockers.includes("step169_dashboard_ux_polish_core_dependency_not_redacted_or_safe"));
});
