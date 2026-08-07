import test from "node:test";
import assert from "node:assert/strict";

import {
  readKisHistoricalCaptureRuntimeStatus,
  resetKisHistoricalCaptureRuntimeForTest,
  startKisHistoricalCaptureRuntime,
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
  const sentinels = {
    approvalId: "SENSITIVE_APPROVAL_ID_SENTINEL",
    approvedBy: "SENSITIVE_APPROVER_SENTINEL",
    approvedAt: "SENSITIVE_APPROVED_AT_SENTINEL",
    expiresAt: "SENSITIVE_EXPIRES_AT_SENTINEL",
    evidenceTicket: "SENSITIVE_EVIDENCE_TICKET_SENTINEL",
    revocationPlan: "SENSITIVE_REVOCATION_PLAN_SENTINEL",
    accountIdHash: "SENSITIVE_ACCOUNT_HASH_SENTINEL",
    redactionVersion: "SENSITIVE_REDACTION_VERSION_SENTINEL",
  };
  const status = await readKisHistoricalCaptureRuntimeStatus({
    env: {},
    nowMs: Date.parse("2026-08-05T00:00:00.000Z"),
    receipt: sentinels,
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
  const serialized = JSON.stringify(status);
  for (const sentinel of Object.values(sentinels)) assert.equal(serialized.includes(sentinel), false);
  assert.equal("rawDataChecksum" in status.summary.latestRevision, false);
});

test("capture status fails closed when the database status query fails", async () => {
  resetKisHistoricalCaptureRuntimeForTest();
  const events = [];
  const status = await readKisHistoricalCaptureRuntimeStatus({
    env: {
      DATABASE_URL: "postgres://configured-but-unavailable",
      FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true",
    },
  }, {
    getPersistenceStatus: async () => { throw new Error("synthetic database outage"); },
    readSummary: async () => summary,
    getDeploymentInfo: () => ({ commitSha: null }),
    onLifecycleEvent: (event) => events.push(event.event),
  });

  assert.equal(status.persistence.databaseConfigured, true);
  assert.equal(status.persistence.databaseAvailable, false);
  assert.equal(status.persistence.reason, "database_unavailable");
  assert.equal(status.startEligible, false);
  assert.ok(status.blockingReasons.includes("database_unavailable"));
  assert.ok(events.includes("persistence_failed"));
  assert.equal(events.includes("summary_started"), false);
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

test("capture status emits ordered lifecycle stages", async () => {
  const events = [];
  const persistence = {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady: true,
    durable: true,
    mode: "postgres_durable",
    reason: null,
  };
  await readKisHistoricalCaptureRuntimeStatus({ env: { DATABASE_URL: "synthetic", FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true" } }, {
    getPersistenceStatus: async () => persistence,
    readSummary: async () => summary,
    getDeploymentInfo: () => ({ commitSha: "abcdef1234567890" }),
    onLifecycleEvent: (event) => events.push(event.event),
  });

  assert.deepEqual(events, [
    "persistence_started",
    "persistence_completed",
    "summary_started",
    "summary_completed",
    "service_completed",
  ]);
});

test("capture status logs summary failure without exposing the error message", async () => {
  const events = [];
  const persistence = {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady: true,
    durable: true,
    mode: "postgres_durable",
    reason: null,
  };
  const status = await readKisHistoricalCaptureRuntimeStatus({ env: { DATABASE_URL: "synthetic", FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true" } }, {
    getPersistenceStatus: async () => persistence,
    readSummary: async () => { throw new Error("synthetic summary failure"); },
    getDeploymentInfo: () => ({ commitSha: null }),
    onLifecycleEvent: (event) => events.push(event),
  });

  assert.equal(status.persistence.mode, "database_unavailable");
  assert.ok(events.some((event) => event.event === "summary_failed"));
  assert.equal(JSON.stringify(events).includes("synthetic summary failure"), false);
});

test("capture status stops before summary after client disconnect", async () => {
  let disconnected = false;
  let summaryCalls = 0;
  const events = [];
  const persistence = {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady: true,
    durable: true,
    mode: "postgres_durable",
    reason: null,
  };

  await assert.rejects(
    readKisHistoricalCaptureRuntimeStatus({ env: { DATABASE_URL: "synthetic", FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true" } }, {
      getPersistenceStatus: async () => {
        disconnected = true;
        return persistence;
      },
      readSummary: async () => {
        summaryCalls += 1;
        return summary;
      },
      isClientDisconnected: () => disconnected,
      onLifecycleEvent: (event) => events.push(event.event),
    }),
    (error) => error.code === "CLIENT_DISCONNECTED",
  );

  assert.equal(summaryCalls, 0);
  assert.ok(events.includes("persistence_completed"));
  assert.ok(events.includes("service_failed"));
});

test("capture status does not normalize database timeouts into a healthy status", async () => {
  const events = [];
  await assert.rejects(
    readKisHistoricalCaptureRuntimeStatus({ env: { DATABASE_URL: "synthetic", FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true" } }, {
      getPersistenceStatus: async () => {
        const error = new Error("synthetic query timeout");
        error.code = "57014";
        throw error;
      },
      onLifecycleEvent: (event) => events.push(event.event),
    }),
    (error) => error.code === "57014",
  );
  assert.ok(events.includes("persistence_failed"));
  assert.ok(events.includes("service_failed"));
});

test("direct capture start without authenticated admin authorization fails before lease or runner setup", async () => {
  resetKisHistoricalCaptureRuntimeForTest();
  let accumulatorFactories = 0;
  let runnerFactories = 0;
  const env = {
    FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true",
    FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
    KIS_TRADING_BASE_URL: "https://openapi.koreainvestment.com:9443",
    KIS_TRADING_APP_KEY: "configured",
    KIS_TRADING_APP_SECRET: "configured",
  };
  const receipt = {
    approvalId: "approval-1",
    approvedBy: "operator",
    approvedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    scope: "trading_read_only_market_data",
    environment: "production_live",
    baseUrl: "https://openapi.koreainvestment.com:9443",
    accountIdHash: "market-data-only",
    allowedReadScopes: ["current_quotes", "market_session_state", "provider_rate_limit_state"],
    forbiddenActions: [
      "order_submission",
      "order_cancellation",
      "position_mutation",
      "live_trading_endpoint",
      "raw_provider_response_persistence",
    ],
    evidenceTicket: "ISSUE-465",
    revocationPlan: "disable",
    redactionVersion: "v1",
  };

  await assert.rejects(
    () => startKisHistoricalCaptureRuntime(
      { receipt, selectedSymbols: ["TQQQ"] },
      { env, nowMs: Date.parse("2026-08-05T00:00:00Z") },
      {
        env,
        readShadowFeedStatus: async () => ({ active: false }),
        getPersistenceStatus: async () => ({ schemaReady: true, reason: null }),
        accumulatorFactory: () => { accumulatorFactories += 1; return {}; },
        runnerFactory: () => { runnerFactories += 1; return {}; },
      },
    ),
    (error) => error.code === "KIS_ADMIN_START_AUTHORIZATION_REQUIRED"
      && error.details.includes("authenticated_admin_start_required"),
  );
  assert.equal(accumulatorFactories, 0);
  assert.equal(runnerFactories, 0);
});
