import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus,
  buildDbBackedMockTradingHistoryReviewResult,
  validateDbBackedMockTradingHistoryReviewResult,
} from "./tradingAdminLabDashboardShell.js";

const REQUIRED_CANDIDATES = [
  "strategy_preset",
  "mock_trading_run_summary",
  "mock_order_summary",
  "mock_fill_summary",
  "mock_portfolio_ledger_snapshot",
  "mock_performance_snapshot",
  "allocation_snapshot",
  "risk_metric_snapshot",
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

test("Step183 records a redacted review receipt for Step182 DB-backed mock history preflight", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus();
  const { reviewResult, receipt, candidateSchemaReviewSummary } = status;

  assert.equal(status.sourceStep, "step183");
  assert.equal(reviewResult.reviewStatus, "recorded");
  assert.equal(reviewResult.decision, "db_backed_mock_history_review_recorded");
  assert.equal(reviewResult.storageMode, "pre_migration_review_only");
  assert.equal(reviewResult.redacted, true);
  assert.equal(receipt.redacted, true);
  assert.equal(receipt.nextAllowedStep, "db_backed_mock_trading_history_migration_preflight");
  assert.equal(receipt.candidateSchemaCount, REQUIRED_CANDIDATES.length);
  assert.equal(candidateSchemaReviewSummary.approvedCandidateSchemaCount, REQUIRED_CANDIDATES.length);
  assert.deepEqual(reviewResult.approvedCandidateSchemas, REQUIRED_CANDIDATES);
});

test("Step183 keeps DB migration writes and Supabase mutations blocked", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus();

  assert.equal(status.dbWriteUsed, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbMigrationCreated, false);
  assert.equal(status.dbSchemaChanged, false);
  assert.equal(status.supabaseInsertAttempted, false);
  assert.equal(status.supabaseUpdateAttempted, false);
  assert.equal(status.supabaseDeleteAttempted, false);
  assert.equal(status.boundaries.persistentDbWriteAllowed, false);
  assert.equal(status.boundaries.dbMigrationAllowed, false);
  assert.equal(status.boundaries.supabaseMutationAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.supabaseMutationAllowed, false);
});

test("Step183 redaction review carries forbidden type labels without sensitive raw values", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus();
  const serialized = JSON.stringify(status);

  for (const valueType of [
    "credential",
    "account_identifier",
    "raw_provider_response",
    "provider_payload",
    "order_payload",
    "kis_token",
    "account_number",
    "private_path",
    "hash",
    "digest",
  ]) {
    assert.ok(status.redactionPolicyReviewSummary.forbiddenValueTypes.includes(valueType));
  }
  assert.equal(status.redactionPolicyReviewSummary.credentialStored, false);
  assert.equal(status.redactionPolicyReviewSummary.accountIdentifierStored, false);
  assert.equal(status.redactionPolicyReviewSummary.rawProviderResponseStored, false);
  assert.equal(status.redactionPolicyReviewSummary.providerPayloadStored, false);
  assert.equal(status.redactionPolicyReviewSummary.orderPayloadStored, false);
  assert.equal(status.redactionPolicyReviewSummary.privatePathStored, false);
  assert.equal(status.redactionPolicyReviewSummary.hashDigestStored, false);
  for (const pattern of SENSITIVE_RAW_VALUE_PATTERNS) {
    assert.doesNotMatch(serialized, pattern);
  }
});

test("Step183 blocks when the Step182 preflight is missing or non-redacted", () => {
  const missingBundle = buildDbBackedMockTradingHistoryReviewResult({
    preflightStatus: { preflight: null },
  });
  assert.equal(missingBundle.reviewResult.reviewStatus, "blocked");
  assert.ok(missingBundle.validation.blockers.includes("step182_preflight_missing"));

  const basePreflight = structuredClone(buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus().preflight);
  basePreflight.redacted = false;
  const nonRedactedValidation = validateDbBackedMockTradingHistoryReviewResult({
    preflightStatus: { preflight: basePreflight },
  });
  assert.ok(nonRedactedValidation.blockers.includes("step182_preflight_not_redacted"));
});

test("Step183 blocks unsafe schema drafts and Supabase mutation attempts", () => {
  const basePreflight = structuredClone(buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus().preflight);
  basePreflight.schemaDraft.tables[0].proposedColumns.push({ name: "credential_raw", type: "credential" });
  basePreflight.dbWriteBlockedConfirmation.supabaseInsertAllowed = true;

  const validation = validateDbBackedMockTradingHistoryReviewResult({
    preflightStatus: { preflight: basePreflight },
  });

  assert.ok(validation.blockers.includes("candidate_schema_draft_contains_forbidden_storage_columns"));
  assert.ok(validation.blockers.includes("supabase_mutation_allowed"));
  assert.equal(validation.dbWriteStatus, "blocked");
  assert.equal(validation.dbMigrationStatus, "blocked");
  assert.equal(validation.supabaseMutationStatus, "blocked");
});

test("Step183 recorded review does not promote provider order or live readiness", () => {
  const status = buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus();

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
