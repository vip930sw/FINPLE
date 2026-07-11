import test from "node:test";
import assert from "node:assert/strict";

import {
  TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS,
  buildAdminTradingLabMockHistoryBrowserStatus,
  buildMockHistoryBrowser,
  buildMockHistoryCompareCandidateSummary,
  buildMockHistoryDetailSummary,
  filterMockHistoryRecords,
  paginateMockHistoryRecords,
  sortMockHistoryRecords,
} from "./tradingMockHistoryBrowser.js";

test("Step188 dataset is deterministic mock-only and redacted", () => {
  const first = buildMockHistoryBrowser();
  const second = buildMockHistoryBrowser();

  assert.deepEqual(second, first);
  assert.equal(first.source, "deterministic_mock_history");
  assert.equal(first.scope, "admin_mock_trading_lab");
  assert.equal(first.status, "mock_only");
  assert.equal(first.records.length, 10);
  for (const record of first.records) {
    assert.equal(record.runId.startsWith("mock-run-"), true);
    assert.equal(record.redacted, true);
  }
});

test("Step188 records include required browser fields without sensitive identifiers", () => {
  const serialized = JSON.stringify(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS);
  const requiredFields = [
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
    "volatility",
    "sharpe",
    "riskScore",
    "archived",
    "restoredFromRunId",
    "warningCount",
    "blockerCount",
    "calculationVersion",
  ];

  for (const field of requiredFields) assert.equal(Object.hasOwn(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS[0], field), true);
  for (const forbidden of ["account_number", "credential", "provider_payload", "order_payload", "raw_provider_response", "hash_value", "digest_value"]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("Step188 filters are deterministic", () => {
  const completed = filterMockHistoryRecords(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, {
    runStatus: "completed",
    archivedMode: "exclude_archived",
    dateRange: "all",
    strategyPreset: "all",
    returnRange: "all",
    mddRange: "all",
    riskScoreRange: "all",
  });
  const highRisk = filterMockHistoryRecords(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, {
    runStatus: "all",
    archivedMode: "include_archived",
    dateRange: "all",
    strategyPreset: "all",
    returnRange: "all",
    mddRange: "all",
    riskScoreRange: "high",
  });

  assert.equal(completed.every((record) => record.runStatus === "completed" && !record.archived), true);
  assert.equal(highRisk.every((record) => record.riskScore > 60), true);
});

test("Step188 sort is stable with runId secondary ordering", () => {
  const records = [
    { ...TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS[0], runId: "mock-run-b", cumulativeReturn: 1, completedAt: "2026-07-01T00:00:00.000Z" },
    { ...TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS[1], runId: "mock-run-a", cumulativeReturn: 1, completedAt: "2026-07-01T00:00:00.000Z" },
  ];
  const sorted = sortMockHistoryRecords(records, "return_desc");

  assert.deepEqual(sorted.map((record) => record.runId), ["mock-run-a", "mock-run-b"]);
});

test("Step188 pagination is client-side and clamps page size", () => {
  const pagination = paginateMockHistoryRecords(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, { page: 99, pageSize: 50 });

  assert.equal(pagination.dbPaginationUsed, false);
  assert.equal(pagination.pageSize, 20);
  assert.equal(pagination.page, 1);
  assert.equal(pagination.pageCount, 1);
  assert.equal(pagination.totalRecords, 10);
});

test("Step188 compare selection requires 2 to 3 supported runs", () => {
  const ready = buildMockHistoryCompareCandidateSummary(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, [
    "mock-run-2026-07-01-balanced-growth-v3",
    "mock-run-2026-07-02-income-tilt-v2",
  ]);
  const blocked = buildMockHistoryCompareCandidateSummary(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, [
    "mock-run-2026-07-03-risk-cap-v1",
    "mock-run-2026-07-05-momentum-v2",
  ]);

  assert.equal(ready.compareReady, true);
  assert.equal(ready.maxCompareCount, 3);
  assert.equal(blocked.compareReady, false);
  assert.equal(blocked.excludedReason.includes("unsupported_status_selected"), true);
});

test("Step188 calculationVersion mismatch produces warning", () => {
  const summary = buildMockHistoryCompareCandidateSummary(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, [
    "mock-run-2026-07-01-balanced-growth-v3",
    "mock-run-2026-07-10-tech-core-v5",
  ]);

  assert.equal(summary.compareReady, true);
  assert.equal(summary.calculationVersionCompatibility, "warning_mismatch");
  assert.equal(summary.excludedReason.includes("calculation_version_mismatch_warning"), true);
});

test("Step188 detail summary is read-only", () => {
  const detail = buildMockHistoryDetailSummary(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS[0]);

  assert.equal(detail.readOnly, true);
  assert.equal(detail.dbReadStatus, "blocked");
  assert.equal(detail.dbWriteStatus, "blocked");
  assert.equal(detail.redacted, true);
});

test("Step188 status keeps DB provider order and live gates blocked", () => {
  const status = buildAdminTradingLabMockHistoryBrowserStatus();

  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.dbReadAttempted, false);
  assert.equal(status.blockedConfirmation.dbWriteAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseSelectAttempted, false);
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
  assert.equal(status.dbReadAllowed, false);
  assert.equal(status.dbWriteAllowed, false);
});
