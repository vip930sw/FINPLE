import test from "node:test";
import assert from "node:assert/strict";

import { createKisHistoricalCaptureRunner } from "./tradingKisHistoricalCaptureRunner.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  KIS_READ_ONLY_BASE_URLS,
  readKisProviderAccessDecision,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

function providerDecision() {
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

function fakeAggregator() {
  return {
    ingest(event) {
      return { accepted: true, completedBars: event.completedBars || [] };
    },
    flush() {
      return [];
    },
  };
}

test("capture runner connects market data only and persists complete cycles", async () => {
  let handlers;
  let feedConfig;
  const captured = [];
  const intervals = [];
  const minuteStartMs = Date.parse("2026-08-04T13:30:00.000Z");
  const runner = createKisHistoricalCaptureRunner(
    {
      selectedSymbols: ["TQQQ", "SQQQ"],
      providerAccessDecision: providerDecision(),
      flushIntervalMs: 1000,
    },
    {
      now: () => minuteStartMs + 70_000,
      aggregatorFactory: fakeAggregator,
      marketSessionResolver: () => ({
        calendarSupported: true,
        state: "REGULAR",
        sessionDate: "2026-08-04",
        calendarVersion: "nyse-calendar-2026-v1",
        earlyClose: false,
      }),
      accumulator: {
        ingestCycle: async ({ bars }) => {
          captured.push(bars);
          return { accepted: true };
        },
        status: () => ({ acceptedCycles: captured.length }),
      },
      feedFactory: () => ({
        connect: async (config, nextHandlers) => {
          feedConfig = config;
          handlers = nextHandlers;
          return { connected: true, close() {} };
        },
      }),
      setIntervalImpl: (fn) => {
        intervals.push(fn);
        return 1;
      },
      clearIntervalImpl: () => {},
    },
  );

  const started = await runner.start({ appKey: "x", appSecret: "y" });
  assert.equal(started.active, true);
  const access = readKisProviderAccessDecision(feedConfig.providerAccessDecision);
  assert.equal(access.baseUrlEnvironment, "live");
  assert.equal(access.credentialEnvironment, "live");
  assert.equal(access.websocketEnvironment, "live");
  assert.equal(access.environmentWebsocketMatch, true);

  const makeBar = (symbol) => ({
    symbol,
    minuteStartMs,
    minuteEndMs: minuteStartMs + 60_000,
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 10,
    tradeCount: 2,
    quote: { bid: 100.4, ask: 100.6, eventTimeMs: minuteStartMs + 59_000 },
  });
  handlers.onEvent({ completedBars: [makeBar("TQQQ"), makeBar("SQQQ")] });
  await runner.flush();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].length, 2);
  assert.equal(runner.status().safety.orderSubmissionAllowed, false);
  await runner.stop();
});

test("capture runner rejects fabricated approval before creating a provider feed", () => {
  let feedFactoryCalls = 0;
  assert.throws(
    () => createKisHistoricalCaptureRunner({
      selectedSymbols: ["TQQQ"],
      providerAccessDecision: { ready: true, environmentWebsocketMatch: true },
    }, {
      accumulator: { ingestCycle: async () => ({ accepted: true }) },
      feedFactory: () => { feedFactoryCalls += 1; return {}; },
    }),
    (error) => error.code === "INVALID_KIS_HISTORICAL_CAPTURE_CONFIGURATION"
      && error.details.includes("provider_authorization_required"),
  );
  assert.equal(feedFactoryCalls, 0);
});
