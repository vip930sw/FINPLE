import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUsRegularSessionForMinute,
  createKisCompletedBarFeedRunner,
} from "./tradingKisCompletedBarFeedRunner.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  KIS_READ_ONLY_BASE_URLS,
  readKisProviderAccessDecision,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

function providerDecision(receiptOverrides = {}) {
  const approval = assessKisShadowFeedApproval({
    explicitStartRequested: true,
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
  return createKisProviderAccessDecision(approval);
}

function createFeedHarness() {
  let handlers = null;
  let config = null;
  return {
    factory() {
      return {
        async connect(nextConfig, nextHandlers) {
          config = nextConfig;
          handlers = nextHandlers;
          nextHandlers.onStatus?.({ state: "connected" });
          return { connected: true, reasons: [], close() {} };
        },
      };
    },
    event(event) {
      handlers.onEvent(event);
    },
    config() {
      return config;
    },
  };
}

function quote(symbol, eventTimeMs, bid, ask) {
  return {
    type: "quote",
    symbol,
    bid,
    ask,
    bidSize: 100,
    askSize: 100,
    spreadBps: ((ask - bid) / ((ask + bid) / 2)) * 10_000,
    eventTimeMs,
  };
}

function trade(symbol, eventTimeMs, price, volume = 100) {
  return {
    type: "trade",
    symbol,
    last: price,
    eventVolume: volume,
    totalVolume: volume,
    eventTimeMs,
  };
}

test("maps New York regular-session minutes without using local server timezone", () => {
  const regular = buildUsRegularSessionForMinute(Date.parse("2026-08-05T13:35:00Z"));
  assert.equal(regular.name, "REGULAR");
  assert.equal(regular.minutesSinceOpen, 5);
  assert.equal(regular.minutesToClose, 385);
  assert.equal(regular.sessionDate, "2026-08-05");

  const closed = buildUsRegularSessionForMinute(Date.parse("2026-08-05T12:00:00Z"));
  assert.equal(closed.name, "CLOSED");
});

test("creates one synchronized Shadow cycle only after all selected bars complete", async () => {
  const harness = createFeedHarness();
  const cycles = [];
  let nowMs = Date.parse("2026-08-05T13:35:10Z");
  const runner = createKisCompletedBarFeedRunner(
    {
      selectedSymbols: ["TQQQ", "SQQQ"],
      providerAccessDecision: providerDecision(),
      activeShadowRun: true,
      maximumCycleLagMs: 5_000,
      maximumQuoteAgeMs: 60_000,
    },
    {
      feedFactory: harness.factory,
      ingestShadowCycle: async (cycle) => cycles.push(cycle),
      modelSignalProvider: ({ symbol }) => ({
        probabilityUp: symbol === "TQQQ" ? 0.7 : 0.3,
        expectedReturnBps: 12,
        confidence: 0.8,
        regime: "test",
        modelVersion: "test-v1",
      }),
      now: () => nowMs,
      setIntervalImpl: () => 1,
      clearIntervalImpl: () => {},
    },
  );

  await runner.start({ appKey: "ephemeral-key", appSecret: "ephemeral-secret" });
  const access = readKisProviderAccessDecision(harness.config().providerAccessDecision);
  assert.equal(access.baseUrlEnvironment, "live");
  assert.equal(access.credentialEnvironment, "live");
  assert.equal(access.websocketEnvironment, "live");
  assert.equal(access.environmentWebsocketMatch, true);
  harness.event(quote("TQQQ", nowMs, 49.99, 50.01));
  harness.event(trade("TQQQ", nowMs + 1_000, 50));
  harness.event(quote("SQQQ", nowMs, 30, 30.02));
  harness.event(trade("SQQQ", nowMs + 2_000, 30.01));

  assert.equal(cycles.length, 0);
  nowMs = Date.parse("2026-08-05T13:36:01Z");
  const status = await runner.flush();

  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0].bars.map((bar) => bar.symbol), ["SQQQ", "TQQQ"]);
  assert.ok(cycles[0].bars.every((bar) => bar.session.name === "REGULAR"));
  assert.equal(status.completedCycleCount, 1);
  assert.equal(status.safety.forwardFillUsed, false);
  assert.equal(status.safety.orderSubmissionAllowed, false);
  assert.doesNotMatch(JSON.stringify(status), /ephemeral-key|ephemeral-secret/);
});

test("drops incomplete multi-symbol minutes instead of forward filling", async () => {
  const harness = createFeedHarness();
  const cycles = [];
  let nowMs = Date.parse("2026-08-05T13:40:05Z");
  const runner = createKisCompletedBarFeedRunner(
    {
      selectedSymbols: ["TQQQ", "SQQQ"],
      providerAccessDecision: providerDecision(),
      activeShadowRun: true,
      maximumCycleLagMs: 5_000,
      maximumQuoteAgeMs: 60_000,
    },
    {
      feedFactory: harness.factory,
      ingestShadowCycle: async (cycle) => cycles.push(cycle),
      now: () => nowMs,
      setIntervalImpl: () => 1,
      clearIntervalImpl: () => {},
    },
  );

  await runner.start({ appKey: "key", appSecret: "secret" });
  harness.event(quote("TQQQ", nowMs, 50, 50.02));
  harness.event(trade("TQQQ", nowMs + 1_000, 50.01));
  nowMs = Date.parse("2026-08-05T13:41:10Z");
  const status = await runner.flush();

  assert.equal(cycles.length, 0);
  assert.equal(status.incompleteCycleCount, 1);
  assert.deepEqual(status.lastIncompleteCycle.missingSymbols, ["SQQQ"]);
  assert.equal(status.lastIncompleteCycle.forwardFilled, false);
});

test("fails fail-closed when a completed bar quote is stale", async () => {
  const harness = createFeedHarness();
  let nowMs = Date.parse("2026-08-05T13:45:05Z");
  const runner = createKisCompletedBarFeedRunner(
    {
      selectedSymbols: ["TQQQ"],
      providerAccessDecision: providerDecision(),
      activeShadowRun: true,
      maximumQuoteAgeMs: 20_000,
    },
    {
      feedFactory: harness.factory,
      ingestShadowCycle: async () => assert.fail("stale quote bar must not reach Shadow"),
      now: () => nowMs,
      setIntervalImpl: () => 1,
      clearIntervalImpl: () => {},
    },
  );

  await runner.start({ appKey: "key", appSecret: "secret" });
  harness.event(quote("TQQQ", nowMs, 50, 50.02));
  harness.event(trade("TQQQ", nowMs + 1_000, 50.01));
  nowMs = Date.parse("2026-08-05T13:46:01Z");
  const status = await runner.flush();

  assert.equal(status.completedCycleCount, 0);
  assert.equal(status.staleQuoteBarCount, 1);
});

test("fails closed for fabricated approval state or an inactive Shadow run", () => {
  let feedFactoryCalls = 0;
  assert.throws(
    () => createKisCompletedBarFeedRunner({
      selectedSymbols: ["TQQQ"],
      providerAccessDecision: { ready: true, environmentWebsocketMatch: true },
      activeShadowRun: true,
    }, {
      ingestShadowCycle: async () => {},
      feedFactory: () => { feedFactoryCalls += 1; return {}; },
    }),
    (error) => error.code === "INVALID_KIS_SHADOW_FEED_CONFIGURATION" && error.details.includes("provider_authorization_required"),
  );
  assert.equal(feedFactoryCalls, 0);
  assert.throws(
    () => createKisCompletedBarFeedRunner({ selectedSymbols: ["TQQQ"], providerAccessDecision: providerDecision(), activeShadowRun: false }, { ingestShadowCycle: async () => {} }),
    (error) => error.details.includes("active_shadow_run_required"),
  );
});

test("runner status contains only the public approval projection", () => {
  const sentinels = {
    approvalId: "SENSITIVE_APPROVAL_ID_SENTINEL",
    approvedBy: "SENSITIVE_APPROVER_SENTINEL",
    evidenceTicket: "SENSITIVE_EVIDENCE_TICKET_SENTINEL",
    revocationPlan: "SENSITIVE_REVOCATION_PLAN_SENTINEL",
    accountIdHash: "SENSITIVE_ACCOUNT_HASH_SENTINEL",
    redactionVersion: "SENSITIVE_REDACTION_VERSION_SENTINEL",
  };
  const runner = createKisCompletedBarFeedRunner({
    selectedSymbols: ["TQQQ"],
    providerAccessDecision: providerDecision(sentinels),
    activeShadowRun: true,
  }, { ingestShadowCycle: async () => {} });
  const serialized = JSON.stringify(runner.status());
  for (const sentinel of Object.values(sentinels)) assert.equal(serialized.includes(sentinel), false);
});
