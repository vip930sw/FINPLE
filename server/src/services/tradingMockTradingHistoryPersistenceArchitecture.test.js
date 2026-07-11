import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus,
  buildAdminTradingLabMockTradingHistoryPersistenceArchitectureStatus,
  buildMockTradingHistoryPersistenceArchitecture,
  validateMockTradingHistoryPersistenceArchitecture,
} from "./tradingAdminLabDashboardShell.js";

const DEFAULT_STEP185_STATUS = buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus();
const DEFAULT_STEP186_STATUS = buildAdminTradingLabMockTradingHistoryPersistenceArchitectureStatus({
  migrationReviewResultStatus: DEFAULT_STEP185_STATUS,
});

const REQUIRED_DOMAIN_IDS = [
  "strategy_preset",
  "mock_trading_run",
  "mock_order_fill_summaries",
  "ledger_snapshots",
  "performance_snapshots",
  "allocation_and_risk_snapshots",
];

const FORBIDDEN_RAW_PATTERNS = [
  /credential_raw/i,
  /account_number_raw/i,
  /kis_access_token/i,
  /provider_response_body/i,
  /order_payload_raw/i,
  /private_packet_path/i,
  /sha256:[a-f0-9]{16,}/i,
  /digest_value/i,
];

test("Step186 records an architecture-only mock trading history persistence model", () => {
  const status = DEFAULT_STEP186_STATUS;
  const { architecture, domainSummary } = status;

  assert.equal(status.sourceStep, "step186");
  assert.equal(architecture.scope, "admin_mock_trading_lab");
  assert.equal(architecture.architectureMode, "architecture_only");
  assert.equal(architecture.status, "architecture_decision_recorded");
  assert.equal(architecture.persistenceIntent, "future_supabase_postgres_storage");
  assert.equal(architecture.redacted, true);
  assert.deepEqual(domainSummary.domainIds, REQUIRED_DOMAIN_IDS);
});

test("Step186 defines strategy versioning and mock run history as separate mock-only domains", () => {
  const { architecture } = DEFAULT_STEP186_STATUS;
  const strategyDomain = architecture.storageDomains.find((domain) => domain.domainId === "strategy_preset");
  const runDomain = architecture.storageDomains.find((domain) => domain.domainId === "mock_trading_run");

  assert.ok(strategyDomain);
  assert.ok(runDomain);
  assert.equal(strategyDomain.mutableDraftSeparatedFromImmutableVersion, true);
  assert.equal(strategyDomain.actualAccountConfigurationSeparated, true);
  assert.equal(strategyDomain.kisOrderConfigurationSeparated, true);
  assert.equal(runDomain.actualTradingRunSeparated, true);
  assert.equal(runDomain.uiNamingRequiresMockPrefix, true);
});

test("Step186 entity relationship graph keeps StrategyPreset to snapshots deterministic", () => {
  const { relationshipSummary } = DEFAULT_STEP186_STATUS;

  assert.equal(relationshipSummary.root, "StrategyPreset");
  assert.ok(relationshipSummary.edgeCount >= 8);
  assert.deepEqual(relationshipSummary.tree, [
    "StrategyPreset",
    "  StrategyVersion",
    "    MockTradingRun",
    "      MockOrderSummary",
    "      MockFillSummary",
    "      LedgerSnapshot",
    "      PerformanceSnapshot",
    "      AllocationSnapshot",
    "      RiskSnapshot",
  ]);
});

test("Step186 snapshot versioning lifecycle browser compare and restore contracts stay mock-only", () => {
  const { architecture } = DEFAULT_STEP186_STATUS;

  assert.equal(architecture.snapshotVersioningStrategy.strategyVersioning.fingerprintValueGenerated, false);
  assert.equal(architecture.snapshotVersioningStrategy.metricSnapshotVersioning.checksumValueGenerated, false);
  assert.equal(architecture.historyLifecycle.writesEnabledNow, false);
  assert.equal(architecture.browserCompareRestoreContract.browser.primaryRowEntity, "MockTradingRun");
  assert.equal(architecture.browserCompareRestoreContract.browser.publicUiAllowed, false);
  assert.equal(architecture.browserCompareRestoreContract.restore.restoreCreatesNewMockDraftOnly, true);
  assert.equal(architecture.browserCompareRestoreContract.restore.actualTradingRunRestoreBlocked, true);
});

test("Step186 retention redaction policy excludes sensitive values", () => {
  const { architecture } = DEFAULT_STEP186_STATUS;
  const redaction = architecture.retentionRedactionPolicy.redaction;
  const serialized = JSON.stringify(architecture);

  assert.equal(redaction.credentialStored, false);
  assert.equal(redaction.accountIdentifierStored, false);
  assert.equal(redaction.tokenStored, false);
  assert.equal(redaction.providerPayloadStored, false);
  assert.equal(redaction.orderPayloadStored, false);
  assert.equal(redaction.rawProviderResponseStored, false);
  assert.equal(redaction.actualOrderFillExecutionIdsStored, false);
  assert.equal(redaction.liveAccountBalanceStored, false);
  assert.equal(redaction.privatePathStored, false);
  assert.equal(redaction.hashDigestStored, false);
  for (const pattern of FORBIDDEN_RAW_PATTERNS) {
    assert.doesNotMatch(serialized, pattern);
  }
});

test("Step186 implementation contracts define Step187 through Step190 without enabling writes", () => {
  const { architecture, contractSummary } = DEFAULT_STEP186_STATUS;

  assert.deepEqual(
    architecture.implementationContracts.map((contract) => contract.step),
    ["Step 187", "Step 188", "Step 189", "Step 190"],
  );
  assert.equal(contractSummary.nextAllowedStep, "db_backed_mock_trading_history_sql_draft_preflight");
  for (const contract of architecture.implementationContracts) {
    assert.equal(contract.redacted, true);
    assert.ok(contract.forbiddenOutput.includes("persistent_db_write") || contract.forbiddenOutput.includes("provider_call"));
  }
});

test("Step186 validation blocks missing unsafe or non-recorded Step185 dependency", () => {
  const missing = validateMockTradingHistoryPersistenceArchitecture({
    migrationReviewResultStatus: { reviewResult: null, receipt: null },
  });
  assert.ok(missing.blockers.includes("step185_migration_review_result_missing"));

  const nonRecorded = structuredClone(DEFAULT_STEP185_STATUS);
  nonRecorded.reviewResult.reviewStatus = "blocked";
  const blocked = validateMockTradingHistoryPersistenceArchitecture({ migrationReviewResultStatus: nonRecorded });
  assert.ok(blocked.blockers.includes("step185_migration_review_result_not_recorded"));
});

test("Step186 architecture never promotes DB provider order or live gates", () => {
  const status = DEFAULT_STEP186_STATUS;
  const built = buildMockTradingHistoryPersistenceArchitecture({
    migrationReviewResultStatus: DEFAULT_STEP185_STATUS,
  });

  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.networkCallAttempted, false);
  assert.equal(status.orderSubmissionAttempted, false);
  assert.equal(status.actualTradingRunCreated, false);
  assert.equal(status.accountBalanceQueried, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbWriteUsed, false);
  assert.equal(status.dbMigrationCreated, false);
  assert.equal(status.dbSchemaChanged, false);
  assert.equal(status.sqlFileCreated, false);
  assert.equal(built.dbMigrationDecision.persistentDbWriteAttempted, false);
});
