import test from "node:test";
import assert from "node:assert/strict";

import {
  readKisHistoricalCaptureRuntimeStatus,
  resetKisHistoricalCaptureRuntimeForTest,
} from "./tradingKisHistoricalCaptureRuntimeService.js";

const summary = {
  totalRows: 0,
  latestCapturedMinute: null,
  latestRevision: {
    sessionDate: "2026-08-05",
    rawDataChecksum: "synthetic-checksum",
    selectedSymbols: ["TQQQ"],
    coverage: { coverageRatio: 1 },
    rowCount: 1,
    immutable: true,
    readyForModelResearch: false,
  },
};

test("capture status exposes version metadata and redacts approval receipt values", async () => {
  resetKisHistoricalCaptureRuntimeForTest();
  const status = await readKisHistoricalCaptureRuntimeStatus({
    env: {},
    nowMs: Date.parse("2026-08-05T00:00:00.000Z"),
    receipt: {
      approvalId: "synthetic-approval",
      approvedBy: "synthetic-operator",
      approvedAt: "2026-08-04T00:00:00.000Z",
      expiresAt: "2026-08-06T00:00:00.000Z",
      evidenceTicket: "synthetic-ticket",
    },
  }, {
    getPersistenceStatus: async () => ({
      databaseConfigured: false,
      featureEnabled: false,
      schemaReady: false,
      durable: false,
      mode: "memory_ephemeral",
      reason: "database_not_configured",
    }),
    readSummary: async () => summary,
    getDeploymentInfo: () => ({ commitSha: "abcdef1234567890" }),
  });

  assert.equal(status.schemaVersion, "1.0.0");
  assert.equal(status.runtimeVersion, "1.0.0");
  assert.equal(status.persistenceContractVersion, "20260805");
  assert.equal(status.deploymentSha, "abcdef1234567890");
  assert.equal(status.checkedAt, "2026-08-05T00:00:00.000Z");
  assert.equal(status.approval.receipt.approvalIdPresent, true);
  assert.equal(status.approval.receipt.approvedByPresent, true);
  assert.equal(status.approval.receipt.evidenceTicketPresent, true);
  assert.equal("approvalId" in status.approval.receipt, false);
  assert.equal("approvedBy" in status.approval.receipt, false);
  assert.equal("evidenceTicket" in status.approval.receipt, false);
  assert.equal("rawDataChecksum" in status.summary.latestRevision, false);
});

test("capture status fails closed when the database status query fails", async () => {
  resetKisHistoricalCaptureRuntimeForTest();
  const status = await readKisHistoricalCaptureRuntimeStatus({
    env: {
      DATABASE_URL: "postgres://configured-but-unavailable",
      FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true",
    },
  }, {
    getPersistenceStatus: async () => { throw new Error("synthetic database outage"); },
    readSummary: async () => summary,
    getDeploymentInfo: () => ({ commitSha: null }),
  });

  assert.equal(status.persistence.databaseConfigured, true);
  assert.equal(status.persistence.databaseAvailable, false);
  assert.equal(status.persistence.reason, "database_unavailable");
  assert.equal(status.startEligible, false);
  assert.ok(status.blockingReasons.includes("database_unavailable"));
});

test("capture status reuses persistence and does not overlap database work", async () => {
  resetKisHistoricalCaptureRuntimeForTest();
  const events = [];
  const persistence = {
    databaseConfigured: true,
    featureEnabled: false,
    schemaReady: true,
    durable: true,
    mode: "postgres",
    reason: null,
  };
  const status = await readKisHistoricalCaptureRuntimeStatus({ env: {} }, {
    getPersistenceStatus: async () => {
      events.push("persistence:start");
      await new Promise((resolve) => setImmediate(resolve));
      events.push("persistence:end");
      return persistence;
    },
    readSummary: async (options) => {
      events.push("summary");
      assert.equal(options.persistence, persistence);
      return summary;
    },
    getPoolStats: () => ({ initialized: true, totalCount: 1, idleCount: 1, waitingCount: 0 }),
    getDeploymentInfo: () => ({ commitSha: null }),
  });

  assert.deepEqual(events, ["persistence:start", "persistence:end", "summary"]);
  assert.equal(status.diagnostics.pool.after.waitingCount, 0);
});
