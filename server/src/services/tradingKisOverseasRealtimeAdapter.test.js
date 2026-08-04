import test from "node:test";
import assert from "node:assert/strict";

import {
  KIS_OVERSEAS_REALTIME_TR_IDS,
  buildKisApprovalRequest,
  buildKisOverseasSubscriptionEnvelope,
  buildKisOverseasSubscriptionKey,
  createKisOverseasRealtimeFeed,
  evaluateKisRealtimeFreshness,
  getKisReconnectDelayMs,
  parseKisOverseasRealtimeFrame,
} from "./tradingKisOverseasRealtimeAdapter.js";

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
  const approval = buildKisApprovalRequest({ appKey: "key", appSecret: "secret" });
  assert.equal(approval.valid, true);
  assert.match(approval.url, /oauth2\/Approval$/);
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

test("feed is blocked without explicit provider opt-in", async () => {
  const feed = createKisOverseasRealtimeFeed({ fetchImpl: async () => ({}), webSocketFactory: () => ({}) });
  const session = await feed.connect({ symbols: ["TQQQ"], market: "NASDAQ", appKey: "k", appSecret: "s" });
  assert.equal(session.connected, false);
  assert.ok(session.reasons.includes("provider_calls_not_opted_in"));
});

test("feed obtains ephemeral approval, subscribes trade+quote, parses events and clears on close", async () => {
  const sent = [];
  const events = [];
  const statuses = [];
  let socket;
  const feed = createKisOverseasRealtimeFeed({
    now: () => 77_000,
    fetchImpl: async () => ({ ok: true, json: async () => ({ approval_key: "ephemeral" }) }),
    webSocketFactory: () => {
      socket = { readyState: 1, send: (value) => sent.push(value), close() { this.onclose?.(); } };
      queueMicrotask(() => socket.onopen?.());
      return socket;
    },
  });
  const session = await feed.connect({ allowProviderCalls: true, symbols: ["TQQQ"], market: "NASDAQ", appKey: "k", appSecret: "s", maxReconnectAttempts: 0 }, {
    onEvent: (event) => events.push(event),
    onStatus: (status) => statuses.push(status),
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(session.connected, true);
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
