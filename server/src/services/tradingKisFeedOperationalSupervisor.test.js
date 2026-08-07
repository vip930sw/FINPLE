import test from "node:test";
import assert from "node:assert/strict";

import { authenticatedAdminStartAuthorization } from "../../test-utils/adminStartAuthorization.js";
import {
  buildKisFeedRecoveryState,
  createKisFeedOperationalSupervisor,
} from "./tradingKisFeedOperationalSupervisor.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  KIS_READ_ONLY_BASE_URLS,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

function providerDecision(receiptOverrides = {}) {
  const approval = assessKisShadowFeedApproval({
    receipt: {
      approvalId: "approval-1",
      approvedBy: "operator",
      approvedAt: "2026-08-01T00:00:00Z",
      expiresAt: "2026-09-01T00:00:00Z",
      scope: "trading_read_only_market_data",
      environment: "production_live",
      baseUrl: KIS_READ_ONLY_BASE_URLS.live,
      accountIdHash: "market-data-only",
      allowedReadScopes: [...REQUIRED_KIS_SHADOW_READ_SCOPES],
      forbiddenActions: [...REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS],
      evidenceTicket: "ISSUE-465",
      revocationPlan: "disable",
      redactionVersion: "v1",
      ...receiptOverrides,
    },
  }, {
    nowMs: Date.parse("2026-08-05T00:00:00Z"),
    env: {
      FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
      FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
      KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
      KIS_TRADING_APP_KEY: "configured",
      KIS_TRADING_APP_SECRET: "configured",
    },
  });
  return createKisProviderAccessDecision(approval, authenticatedAdminStartAuthorization());
}

function createRunner(nowRef) {
  let state = {
    active: false,
    state: "created",
    lastProviderEventAt: null,
    lastCompletedMinute: null,
    protocolIssueCount: 0,
    staleQuoteBarCount: 0,
    incompleteCycleCount: 0,
  };
  return {
    async start() {
      state = {
        ...state,
        active: true,
        state: "connected",
        lastProviderEventAt: new Date(nowRef.value).toISOString(),
        lastCompletedMinute: new Date(nowRef.value - 60_000).toISOString(),
      };
      return { ...state };
    },
    async stop(reason) {
      state = { ...state, active: false, state: "closed", stopReason: reason };
      return { ...state };
    },
    status() {
      return { ...state };
    },
    set(next) {
      state = { ...state, ...next };
    },
  };
}

function options(runner, receiptOverrides) {
  return {
    runner,
    shadowRunId: "run-1",
    strategyVersionId: "version-1",
    strategyVersionNumber: 1,
    selectedSymbols: ["TQQQ", "SQQQ"],
    providerAccessDecision: providerDecision(receiptOverrides),
    watchdogIntervalMs: 1_000,
    checkpointIntervalMs: 1_000,
    guardPolicy: {
      providerHeartbeatTripMs: 5_000,
      providerHeartbeatWarningMs: 2_000,
    },
  };
}

test("starts only during an approved market session and persists a sanitized checkpoint", async () => {
  const nowRef = { value: Date.parse("2026-08-05T13:35:00Z") };
  const runner = createRunner(nowRef);
  const checkpoints = [];
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => {
      checkpoints.push(payload);
      return { checkpoint: payload, persistence: { mode: "memory_checkpoint" } };
    },
  });

  const status = await supervisor.start({ appKey: "ephemeral", appSecret: "ephemeral-secret" });
  assert.equal(status.active, true);
  assert.equal(status.guard.state, "healthy");
  assert.equal(checkpoints.length, 1);
  assert.equal(checkpoints[0].manualResumeRequired, true);
  assert.doesNotMatch(JSON.stringify(checkpoints[0]), /ephemeral-secret/);
});

test("checkpoint persists only the redacted public approval projection", async () => {
  const nowRef = { value: Date.parse("2026-08-05T13:35:00Z") };
  const sentinels = {
    approvalId: "SENSITIVE_APPROVAL_ID_SENTINEL",
    approvedBy: "SENSITIVE_APPROVER_SENTINEL",
    evidenceTicket: "SENSITIVE_EVIDENCE_TICKET_SENTINEL",
    revocationPlan: "SENSITIVE_REVOCATION_PLAN_SENTINEL",
    accountIdHash: "SENSITIVE_ACCOUNT_HASH_SENTINEL",
    redactionVersion: "SENSITIVE_REDACTION_VERSION_SENTINEL",
  };
  const checkpoints = [];
  const supervisor = createKisFeedOperationalSupervisor(options(createRunner(nowRef), sentinels), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => {
      checkpoints.push(payload);
      return { checkpoint: payload, persistence: { mode: "memory_checkpoint" } };
    },
  });
  await supervisor.start({ appKey: "ephemeral", appSecret: "ephemeral-secret" });
  const serialized = JSON.stringify(checkpoints);
  for (const sentinel of Object.values(sentinels)) assert.equal(serialized.includes(sentinel), false);
  assert.equal(checkpoints[0].approval.receipt.rawReceiptStored, false);
});

test("circuit breaker stops the runner and requires manual resume", async () => {
  const nowRef = { value: Date.parse("2026-08-05T13:35:00Z") };
  const runner = createRunner(nowRef);
  const checkpoints = [];
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => {
      checkpoints.push(payload);
      return { checkpoint: payload, persistence: { mode: "memory_checkpoint" } };
    },
  });
  await supervisor.start({ appKey: "key", appSecret: "secret" });

  nowRef.value += 8_000;
  const status = await supervisor.tick();
  assert.equal(status.active, false);
  assert.equal(status.guard.tripped, true);
  assert.equal(status.guard.trip.code, "provider_heartbeat_stale");
  assert.match(status.stoppedReason, /^circuit_breaker:/);
  assert.equal(status.checkpoint.automaticResumeAllowed, false);
  assert.ok(checkpoints.length >= 2);
});

test("blocks start on an exchange holiday", async () => {
  const nowRef = { value: Date.parse("2026-07-03T15:00:00Z") };
  const runner = createRunner(nowRef);
  const supervisor = createKisFeedOperationalSupervisor(options(runner), {
    now: () => nowRef.value,
    setIntervalImpl: () => 1,
    clearIntervalImpl: () => {},
    saveCheckpoint: async (payload) => ({ checkpoint: payload, persistence: { mode: "memory_checkpoint" } }),
  });

  await assert.rejects(
    supervisor.start({ appKey: "key", appSecret: "secret" }),
    (error) => error.code === "KIS_FEED_MARKET_SESSION_CLOSED" && error.details.includes("exchange_holiday"),
  );
});

test("recovery state never enables automatic restart", () => {
  const recovery = buildKisFeedRecoveryState({
    operationalState: "tripped",
    stopReason: "circuit_breaker:provider_heartbeat_stale",
    createdAt: "2026-08-05T14:00:00Z",
    shadowRunId: "run-1",
    strategyVersionId: "version-1",
    selectedSymbols: ["TQQQ"],
    manualResumeRequired: true,
  });
  assert.equal(recovery.checkpointAvailable, true);
  assert.equal(recovery.manualResumeRequired, true);
  assert.equal(recovery.automaticResumeAllowed, false);
  assert.equal(recovery.priorOperationalState, "tripped");
});
