import test from "node:test";
import assert from "node:assert/strict";

import { authenticatedAdminStartAuthorization } from "../../test-utils/adminStartAuthorization.js";
import {
  KIS_OVERSEAS_REALTIME_TR_IDS,
  KIS_OVERSEAS_REALTIME_ENDPOINTS,
  buildKisApprovalRequest,
  buildKisOverseasSubscriptionEnvelope,
  buildKisOverseasSubscriptionKey,
  createKisOverseasRealtimeFeed,
  evaluateKisRealtimeFreshness,
  getKisReconnectDelayMs,
  parseKisOverseasRealtimeFrame,
} from "./tradingKisOverseasRealtimeAdapter.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  KIS_READ_ONLY_BASE_URLS,
  REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS,
  REQUIRED_KIS_SHADOW_READ_SCOPES,
} from "./tradingKisReadOnlyApproval.js";

const approvalNowMs = Date.parse("2026-08-05T00:00:00Z");

function providerAssessment(environment = "live", input = {}) {
  const live = environment === "live";
  const receiptEnvironment = live ? "production_live" : "virtual_shadow";
  const baseUrl = KIS_READ_ONLY_BASE_URLS[environment];
  const approval = assessKisShadowFeedApproval({
    ...input,
    receipt: {
      approvalId: "approval-1",
      approvedBy: "operator",
      approvedAt: "2026-08-01T00:00:00Z",
      expiresAt: "2026-09-01T00:00:00Z",
      scope: "trading_read_only_market_data",
      environment: receiptEnvironment,
      baseUrl,
      accountIdHash: "market-data-only",
      allowedReadScopes: [...REQUIRED_KIS_SHADOW_READ_SCOPES],
      forbiddenActions: [...REQUIRED_KIS_SHADOW_FORBIDDEN_ACTIONS],
      evidenceTicket: "ISSUE-465",
      revocationPlan: "disable",
      redactionVersion: "v1",
    },
  }, {
    nowMs: approvalNowMs,
    env: {
      FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED: "true",
      FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: environment,
      KIS_TRADING_BASE_URL: baseUrl,
      KIS_TRADING_APP_KEY: "k",
      KIS_TRADING_APP_SECRET: "s",
    },
  });
  return approval;
}

function providerDecision(environment = "live") {
  return createKisProviderAccessDecision(
    providerAssessment(environment),
    authenticatedAdminStartAuthorization(),
  );
}

function makeTradePayload(overrides = {}) {
  const values = {
    SYMB: "TQQQ", ZDIV: "4", TYMD: "20260805", XYMD: "20260804", XHMS: "103001",
    KYMD: "20260805", KHMS: "233001", OPEN: "80", HIGH: "82", LOW: "79", LAST: "81.25",
    SIGN: "2", DIFF: "1.2", RATE: "1.5", PBID: "81.24", PASK: "81.26", VBID: "100",
    VASK: "120", EVOL: "15", TVOL: "1000015", TAMT: "81000000", BIVL: "500", ASVL: "600",
    STRN: "112.5", MTYP: "1", ...overrides,
  };
  return Object.values(values).join("^");
}

function makeQuotePayload() {
  return ["TQQQ", "4", "20260804", "103001", "20260805", "233001", "1", "1", "0", "0", "81.24", "81.26", "100", "120", "0", "0"].join("^");
}

test("builds official regular-session subscription key", () => {
  assert.deepEqual(buildKisOverseasSubscriptionKey({ market: "NASDAQ", symbol: "tqqq" }), {
    valid: true, reasons: [], market: "NAS", symbol: "TQQQ", session: "regular", trKey: "DNASTQQQ",
  });
});

test("builds KIS approval and subscription envelopes without exposing derived secrets", () => {
  const approval = buildKisApprovalRequest({
    appKey: "key",
    appSecret: "secret",
    baseUrlEnvironment: "paper",
  });
  assert.equal(approval.valid, true);
  assert.equal(approval.url, `${KIS_READ_ONLY_BASE_URLS.paper}/oauth2/Approval`);
  assert.equal(
    buildKisApprovalRequest({ appKey: "key", appSecret: "secret", baseUrlEnvironment: "live" }).url,
    `${KIS_READ_ONLY_BASE_URLS.live}/oauth2/Approval`,
  );
  assert.equal(buildKisApprovalRequest({ appKey: "key", appSecret: "secret", baseUrlEnvironment: "other" }).valid, false);
  const envelope = buildKisOverseasSubscriptionEnvelope({ approvalKey: "approval", trId: "HDFSCNT0", trKey: "DNASTQQQ" });
  assert.equal(envelope.valid, true);
  assert.equal(envelope.message.body.input.tr_id, "HDFSCNT0");
  assert.equal(envelope.message.header.tr_type, "1");
});

test("parses official HDFSCNT0 trade frame", () => {
  const parsed = parseKisOverseasRealtimeFrame(`0|HDFSCNT0|1|${makeTradePayload()}`, { receivedAtMs: 123456 });
  assert.equal(parsed.valid, true);
  assert.equal(parsed.events[0].symbol, "TQQQ");
  assert.equal(parsed.events[0].last, 81.25);
  assert.equal(parsed.events[0].eventVolume, 15);
  assert.equal(parsed.events[0].rawStored, false);
});

test("parses official HDFSASP0 quote frame and spread", () => {
  const parsed = parseKisOverseasRealtimeFrame(`0|HDFSASP0|1|${makeQuotePayload()}`, { receivedAtMs: 1000 });
  assert.equal(parsed.valid, true);
  const quote = parsed.events[0];
  assert.equal(quote.bid, 81.24);
  assert.equal(quote.ask, 81.26);
  assert.ok(quote.spreadBps > 2 && quote.spreadBps < 3);
});

test("recognizes pingpong control frame", () => {
  const parsed = parseKisOverseasRealtimeFrame(JSON.stringify({ header: { tr_id: "PINGPONG" } }));
  assert.equal(parsed.valid, true);
  assert.equal(parsed.kind, "pingpong");
  assert.equal(parsed.echoRequired, true);
});

test("fails closed on encrypted or malformed market frames", () => {
  assert.equal(parseKisOverseasRealtimeFrame(`1|HDFSCNT0|1|${makeTradePayload()}`).valid, false);
  assert.equal(parseKisOverseasRealtimeFrame("bad").valid, false);
});

test("evaluates freshness and bounded exponential reconnect", () => {
  assert.equal(evaluateKisRealtimeFreshness({ eventTimeMs: 8_000 }, { nowMs: 10_000, maxAgeMs: 3_000 }).fresh, true);
  assert.equal(evaluateKisRealtimeFreshness({ eventTimeMs: 5_000 }, { nowMs: 10_000, maxAgeMs: 3_000 }).fresh, false);
  assert.equal(getKisReconnectDelayMs(0), 1_000);
  assert.equal(getKisReconnectDelayMs(10), 30_000);
});

test("direct caller booleans cannot authorize provider access", async () => {
  let fetchCalls = 0;
  let socketCalls = 0;
  let timerCalls = 0;
  const feed = createKisOverseasRealtimeFeed({
    fetchImpl: async () => { fetchCalls += 1; return {}; },
    webSocketFactory: () => { socketCalls += 1; return {}; },
    setTimeoutImpl: () => { timerCalls += 1; return 1; },
  });
  const session = await feed.connect({
    allowProviderCalls: true,
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "k",
    appSecret: "s",
    baseUrlEnvironment: "live",
    credentialEnvironment: "live",
    websocketEnvironment: "live",
    environmentWebsocketMatch: true,
  });
  assert.equal(session.connected, false);
  assert.ok(session.reasons.includes("provider_authorization_required"));
  assert.equal(fetchCalls, 0);
  assert.equal(socketCalls, 0);
  assert.equal(timerCalls, 0);
});

test("canonical assessment with a caller-asserted start flag cannot reach provider I/O", async () => {
  let approvalKeyRequests = 0;
  let socketCalls = 0;
  const assessment = providerAssessment("live", { explicitStartRequested: true });
  const providerAccessDecision = createKisProviderAccessDecision(assessment);
  const feed = createKisOverseasRealtimeFeed({
    fetchImpl: async () => { approvalKeyRequests += 1; return {}; },
    webSocketFactory: () => { socketCalls += 1; return {}; },
  });
  const session = await feed.connect({
    providerAccessDecision,
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "k",
    appSecret: "s",
  });
  assert.equal(providerAccessDecision, null);
  assert.equal(session.connected, false);
  assert.ok(session.reasons.includes("provider_authorization_required"));
  assert.equal(approvalKeyRequests, 0);
  assert.equal(socketCalls, 0);
});

test("feed obtains ephemeral approval, subscribes trade+quote, parses events and clears on close", async () => {
  const sent = [];
  const events = [];
  const statuses = [];
  let socket;
  let socketUrl;
  const feed = createKisOverseasRealtimeFeed({
    now: () => 77_000,
    fetchImpl: async () => ({ ok: true, json: async () => ({ approval_key: "ephemeral" }) }),
    webSocketFactory: (url) => {
      socketUrl = url;
      socket = { readyState: 1, send: (value) => sent.push(value), close() { this.onclose?.(); } };
      queueMicrotask(() => socket.onopen?.());
      return socket;
    },
  });
  const session = await feed.connect({
    providerAccessDecision: providerDecision("live"),
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "k",
    appSecret: "s",
    websocketUrl: "ws://example.invalid/ignored",
    maxReconnectAttempts: 0,
  }, {
    onEvent: (event) => events.push(event),
    onStatus: (status) => statuses.push(status),
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(session.connected, true);
  assert.equal(socketUrl, KIS_OVERSEAS_REALTIME_ENDPOINTS.live);
  assert.equal(sent.length, 2);
  const messages = sent.map(JSON.parse);
  assert.deepEqual(messages.map((message) => message.body.input.tr_id).sort(), Object.values(KIS_OVERSEAS_REALTIME_TR_IDS).sort());
  socket.onmessage({ data: `0|HDFSCNT0|1|${makeTradePayload()}` });
  assert.equal(events.length, 1);
  assert.equal(events[0].eventTimeMs, 77_000);
  session.close();
  assert.equal(session.status(), "closed");
  assert.ok(statuses.every((status) => status.credentialStored === false && status.rawProviderPayloadStored === false));
});

test("paper maps only to the paper WebSocket but blocks unsupported overseas realtime TRs", async () => {
  let socketCreated = false;
  const feed = createKisOverseasRealtimeFeed({
    fetchImpl: async () => assert.fail("paper approval must not be requested"),
    webSocketFactory: () => { socketCreated = true; },
  });
  const session = await feed.connect({
    providerAccessDecision: providerDecision("paper"),
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "k",
    appSecret: "s",
  });
  assert.equal(KIS_OVERSEAS_REALTIME_ENDPOINTS.paper, "ws://ops.koreainvestment.com:31000/tryitout");
  assert.equal(session.connected, false);
  assert.equal(socketCreated, false);
  assert.ok(session.reasons.includes("paper_realtime_trade_scope_unsupported"));
  assert.ok(session.reasons.includes("paper_realtime_quote_scope_unsupported"));
  assert.ok(session.reasons.includes("paper_shadow_feed_not_supported"));
});

test("caller-selected cross-environment strings cannot replace provider authorization", async () => {
  const feed = createKisOverseasRealtimeFeed({ fetchImpl: async () => ({}), webSocketFactory: () => ({}) });
  const session = await feed.connect({
    allowProviderCalls: true,
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "k",
    appSecret: "s",
    baseUrlEnvironment: "live",
    credentialEnvironment: "paper",
    websocketEnvironment: "live",
    environmentWebsocketMatch: false,
  });
  assert.equal(session.connected, false);
  assert.ok(session.reasons.includes("provider_authorization_required"));
  assert.ok(session.reasons.includes("environment_websocket_mismatch"));
});

test("canonical authorization cannot be reused with different credentials", async () => {
  let fetchCalls = 0;
  const feed = createKisOverseasRealtimeFeed({
    fetchImpl: async () => { fetchCalls += 1; return {}; },
    webSocketFactory: () => assert.fail("mismatched credentials must not open a socket"),
  });
  const session = await feed.connect({
    providerAccessDecision: providerDecision("live"),
    symbols: ["TQQQ"],
    market: "NASDAQ",
    appKey: "different-key",
    appSecret: "different-secret",
  });
  assert.equal(session.connected, false);
  assert.ok(session.reasons.includes("provider_credentials_mismatch"));
  assert.equal(fetchCalls, 0);
});
