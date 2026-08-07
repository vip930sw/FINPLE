import { Buffer } from "node:buffer";

import {
  KIS_OVERSEAS_REALTIME_SUPPORT,
  KIS_READ_ONLY_BASE_URLS,
  KIS_READ_ONLY_WEBSOCKET_URLS,
  kisProviderAccessCredentialsMatch,
  readKisProviderAccessDecision,
} from "./tradingKisReadOnlyApproval.js";

export const KIS_OVERSEAS_REALTIME_TR_IDS = Object.freeze({
  trade: "HDFSCNT0",
  quote: "HDFSASP0",
});

export const KIS_OVERSEAS_MARKET_CODES = Object.freeze({
  NASDAQ: "NAS",
  NAS: "NAS",
  NYSE: "NYS",
  NYS: "NYS",
  AMEX: "AMS",
  AMS: "AMS",
});

export const KIS_OVERSEAS_REALTIME_ENDPOINTS = Object.freeze({
  ...KIS_READ_ONLY_WEBSOCKET_URLS,
});

export const KIS_OVERSEAS_QUOTE_COLUMNS = Object.freeze([
  "symb", "zdiv", "xymd", "xhms", "kymd", "khms", "bvol", "avol",
  "bdvl", "advl", "pbid1", "pask1", "vbid1", "vask1", "dbid1", "dask1",
]);

export const KIS_OVERSEAS_TRADE_COLUMNS = Object.freeze([
  "SYMB", "ZDIV", "TYMD", "XYMD", "XHMS", "KYMD", "KHMS", "OPEN",
  "HIGH", "LOW", "LAST", "SIGN", "DIFF", "RATE", "PBID", "PASK",
  "VBID", "VASK", "EVOL", "TVOL", "TAMT", "BIVL", "ASVL", "STRN", "MTYP",
]);

export const KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL = Object.freeze({
  TQQQ: "NAS",
  SQQQ: "NAS",
  SOXL: "AMS",
  SOXS: "AMS",
  UPRO: "AMS",
  SPXU: "AMS",
  TNA: "AMS",
  TZA: "AMS",
});

const ALLOWED_SYMBOLS = new Set(Object.keys(KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL));
const MAX_RECONNECT_ATTEMPTS = 6;

function clean(value) {
  return String(value ?? "").trim();
}

function toFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSymbol(value) {
  return clean(value).toUpperCase();
}

function normalizeMarket(value) {
  return KIS_OVERSEAS_MARKET_CODES[clean(value).toUpperCase()] ?? "";
}

function maskError(error, fallback) {
  const code = clean(error?.code || error?.name).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
  return code ? `${fallback}:${code}` : fallback;
}

function columnsForTrId(trId) {
  if (trId === KIS_OVERSEAS_REALTIME_TR_IDS.trade) return KIS_OVERSEAS_TRADE_COLUMNS;
  if (trId === KIS_OVERSEAS_REALTIME_TR_IDS.quote) return KIS_OVERSEAS_QUOTE_COLUMNS;
  return null;
}

function mapRecord(columns, values) {
  return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""]));
}

function parseRecords(columns, payload, declaredCount) {
  const values = clean(payload).split("^");
  if (values.length < columns.length) return [];
  const maximum = Math.floor(values.length / columns.length);
  const requested = Number.isInteger(declaredCount) && declaredCount > 0 ? declaredCount : maximum;
  const count = Math.min(requested, maximum);
  return Array.from({ length: count }, (_, index) => {
    const start = index * columns.length;
    return mapRecord(columns, values.slice(start, start + columns.length));
  });
}

export function buildKisOverseasSubscriptionKey({ market, symbol, session = "regular" } = {}) {
  const normalizedMarket = normalizeMarket(market);
  const normalizedSymbol = normalizeSymbol(symbol);
  const prefix = clean(session).toLowerCase() === "daytime" ? "R" : "D";
  const reasons = unique([
    normalizedMarket ? null : "unsupported_market",
    normalizedSymbol ? null : "missing_symbol",
    normalizedSymbol && !/^[A-Z0-9._-]{1,20}$/.test(normalizedSymbol) ? "invalid_symbol" : null,
  ]);
  return {
    valid: reasons.length === 0,
    reasons,
    market: normalizedMarket,
    symbol: normalizedSymbol,
    session: prefix === "R" ? "daytime" : "regular",
    trKey: reasons.length === 0 ? `${prefix}${normalizedMarket}${normalizedSymbol}` : "",
  };
}

export function buildKisOverseasSubscriptionEnvelope({ approvalKey, trId, trKey, subscribe = true } = {}) {
  const normalizedApprovalKey = clean(approvalKey);
  const normalizedTrId = clean(trId).toUpperCase();
  const normalizedTrKey = clean(trKey).toUpperCase();
  const reasons = unique([
    normalizedApprovalKey ? null : "missing_approval_key",
    columnsForTrId(normalizedTrId) ? null : "unsupported_tr_id",
    normalizedTrKey ? null : "missing_tr_key",
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    message: reasons.length > 0 ? null : {
      header: {
        approval_key: normalizedApprovalKey,
        custtype: "P",
        tr_type: subscribe ? "1" : "2",
        "content-type": "utf-8",
      },
      body: {
        input: {
          tr_id: normalizedTrId,
          tr_key: normalizedTrKey,
        },
      },
    },
  };
}

export function buildKisApprovalRequest({ appKey, appSecret, baseUrlEnvironment } = {}) {
  const normalizedAppKey = clean(appKey);
  const normalizedAppSecret = clean(appSecret);
  const approvalBaseUrl = KIS_READ_ONLY_BASE_URLS[clean(baseUrlEnvironment).toLowerCase()] || "";
  const reasons = unique([
    normalizedAppKey ? null : "missing_app_key",
    normalizedAppSecret ? null : "missing_app_secret",
    approvalBaseUrl ? null : "invalid_base_url_environment",
  ]);
  return {
    valid: reasons.length === 0,
    reasons,
    url: approvalBaseUrl ? `${approvalBaseUrl}/oauth2/Approval` : null,
    init: reasons.length > 0 ? null : {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: normalizedAppKey,
        secretkey: normalizedAppSecret,
      }),
    },
  };
}

function normalizeTrade(record, receivedAtMs) {
  const symbol = normalizeSymbol(record.SYMB);
  return {
    type: "trade",
    provider: "KIS",
    trId: KIS_OVERSEAS_REALTIME_TR_IDS.trade,
    symbol,
    exchangeDate: clean(record.XYMD),
    exchangeTime: clean(record.XHMS),
    koreaDate: clean(record.KYMD),
    koreaTime: clean(record.KHMS),
    open: toFinite(record.OPEN),
    high: toFinite(record.HIGH),
    low: toFinite(record.LOW),
    last: toFinite(record.LAST),
    bid: toFinite(record.PBID),
    ask: toFinite(record.PASK),
    bidSize: toFinite(record.VBID),
    askSize: toFinite(record.VASK),
    eventVolume: toFinite(record.EVOL),
    totalVolume: toFinite(record.TVOL),
    totalAmount: toFinite(record.TAMT),
    strength: toFinite(record.STRN),
    receivedAtMs,
    eventTimeMs: receivedAtMs,
    rawStored: false,
  };
}

function normalizeQuote(record, receivedAtMs) {
  const symbol = normalizeSymbol(record.symb);
  const bid = toFinite(record.pbid1);
  const ask = toFinite(record.pask1);
  const mid = bid !== null && ask !== null && bid > 0 && ask >= bid ? (bid + ask) / 2 : null;
  const spreadBps = mid ? ((ask - bid) / mid) * 10_000 : null;
  return {
    type: "quote",
    provider: "KIS",
    trId: KIS_OVERSEAS_REALTIME_TR_IDS.quote,
    symbol,
    exchangeDate: clean(record.xymd),
    exchangeTime: clean(record.xhms),
    koreaDate: clean(record.kymd),
    koreaTime: clean(record.khms),
    bid,
    ask,
    bidSize: toFinite(record.vbid1),
    askSize: toFinite(record.vask1),
    bidChange: toFinite(record.dbid1),
    askChange: toFinite(record.dask1),
    spreadBps,
    receivedAtMs,
    eventTimeMs: receivedAtMs,
    rawStored: false,
  };
}

export function parseKisOverseasRealtimeFrame(rawFrame, options = {}) {
  const raw = typeof rawFrame === "string" ? rawFrame : Buffer.isBuffer(rawFrame) ? rawFrame.toString("utf8") : clean(rawFrame?.data ?? rawFrame);
  const receivedAtMs = Number.isFinite(options.receivedAtMs) ? options.receivedAtMs : Date.now();
  if (!raw) return { valid: false, kind: "invalid", reasons: ["empty_frame"], events: [], rawStored: false };

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      const trId = clean(parsed?.header?.tr_id || parsed?.body?.input?.tr_id).toUpperCase();
      const isPingPong = trId === "PINGPONG" || clean(parsed?.header?.tr_type).toUpperCase() === "PINGPONG";
      return {
        valid: true,
        kind: isPingPong ? "pingpong" : "control",
        trId,
        controlStatus: clean(parsed?.body?.rt_cd || parsed?.body?.msg_cd || parsed?.header?.tr_type),
        events: [],
        echoRequired: isPingPong,
        rawStored: false,
      };
    } catch {
      return { valid: false, kind: "invalid", reasons: ["invalid_json_frame"], events: [], rawStored: false };
    }
  }

  const first = raw.indexOf("|");
  const second = first >= 0 ? raw.indexOf("|", first + 1) : -1;
  const third = second >= 0 ? raw.indexOf("|", second + 1) : -1;
  if (first < 0 || second < 0 || third < 0) {
    return { valid: false, kind: "invalid", reasons: ["invalid_pipe_frame"], events: [], rawStored: false };
  }

  const encryptionFlag = raw.slice(0, first);
  const trId = raw.slice(first + 1, second).toUpperCase();
  const countRaw = raw.slice(second + 1, third);
  const payload = raw.slice(third + 1);
  const columns = columnsForTrId(trId);
  if (!columns) {
    return { valid: false, kind: "unsupported", reasons: ["unsupported_tr_id"], trId, events: [], rawStored: false };
  }
  if (encryptionFlag !== "0") {
    return { valid: false, kind: "encrypted", reasons: ["encrypted_market_frame_not_supported"], trId, events: [], rawStored: false };
  }

  const records = parseRecords(columns, payload, Number.parseInt(countRaw, 10));
  const normalizer = trId === KIS_OVERSEAS_REALTIME_TR_IDS.trade ? normalizeTrade : normalizeQuote;
  const events = records.map((record) => normalizer(record, receivedAtMs)).filter((event) => event.symbol);
  return {
    valid: events.length > 0,
    kind: "data",
    reasons: events.length > 0 ? [] : ["no_complete_records"],
    trId,
    events,
    echoRequired: false,
    rawStored: false,
  };
}

export function evaluateKisRealtimeFreshness(event, options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const maxAgeMs = Number.isFinite(options.maxAgeMs) && options.maxAgeMs > 0 ? options.maxAgeMs : 3_000;
  const eventTimeMs = Number(event?.eventTimeMs ?? event?.receivedAtMs);
  const ageMs = Number.isFinite(eventTimeMs) ? Math.max(0, nowMs - eventTimeMs) : null;
  return {
    fresh: ageMs !== null && ageMs <= maxAgeMs,
    ageMs,
    maxAgeMs,
    reason: ageMs === null ? "missing_event_time" : ageMs > maxAgeMs ? "stale_market_event" : null,
  };
}

export function getKisReconnectDelayMs(attempt, options = {}) {
  const normalizedAttempt = Math.max(0, Math.floor(Number(attempt) || 0));
  const baseMs = Number.isFinite(options.baseMs) && options.baseMs > 0 ? options.baseMs : 1_000;
  const maxMs = Number.isFinite(options.maxMs) && options.maxMs > 0 ? options.maxMs : 30_000;
  return Math.min(maxMs, baseMs * (2 ** normalizedAttempt));
}

function bindSocketEvent(socket, eventName, handler) {
  if (typeof socket?.addEventListener === "function") {
    socket.addEventListener(eventName, handler);
    return;
  }
  if (typeof socket?.on === "function") {
    socket.on(eventName, handler);
    return;
  }
  socket[`on${eventName}`] = handler;
}

function validateFeedConfig(config = {}) {
  const symbols = Array.isArray(config.symbols) ? config.symbols.map(normalizeSymbol) : [];
  const marketBySymbol = config.marketBySymbol && typeof config.marketBySymbol === "object" ? config.marketBySymbol : {};
  const symbolEntries = symbols.map((symbol) => ({ symbol, market: normalizeMarket(marketBySymbol[symbol] ?? KIS_LEVERAGED_ETF_MARKET_BY_SYMBOL[symbol] ?? config.market) }));
  const access = readKisProviderAccessDecision(config.providerAccessDecision);
  const approvalRequest = buildKisApprovalRequest({
    appKey: config.appKey,
    appSecret: config.appSecret,
    baseUrlEnvironment: access?.baseUrlEnvironment,
  });
  const websocketEnvironment = access?.websocketEnvironment || "";
  const websocketUrl = KIS_OVERSEAS_REALTIME_ENDPOINTS[websocketEnvironment] || "";
  const realtimeSupport = KIS_OVERSEAS_REALTIME_SUPPORT[websocketEnvironment];
  const reasons = unique([
    access ? null : "provider_authorization_required",
    ...(access?.authorized ? [] : access?.reasons || []),
    kisProviderAccessCredentialsMatch(config.providerAccessDecision, config.appKey, config.appSecret)
      ? null
      : "provider_credentials_mismatch",
    ...approvalRequest.reasons,
    websocketUrl ? null : "websocket_environment_not_allowed",
    access?.environmentWebsocketMatch === true
      && websocketEnvironment === access.baseUrlEnvironment
      && websocketEnvironment === access.credentialEnvironment
        ? null
        : "environment_websocket_mismatch",
    websocketEnvironment === "paper" && realtimeSupport?.HDFSCNT0 !== true
      ? "paper_realtime_trade_scope_unsupported"
      : null,
    websocketEnvironment === "paper" && realtimeSupport?.HDFSASP0 !== true
      ? "paper_realtime_quote_scope_unsupported"
      : null,
    websocketEnvironment === "paper" && (realtimeSupport?.HDFSCNT0 !== true || realtimeSupport?.HDFSASP0 !== true)
      ? "paper_shadow_feed_not_supported"
      : null,
    symbols.length > 0 ? null : "missing_symbols",
    ...symbols.filter((symbol) => !ALLOWED_SYMBOLS.has(symbol)).map((symbol) => `symbol_not_in_scalping_universe_${symbol}`),
    ...symbolEntries.filter((entry) => !entry.market).map((entry) => `unsupported_market_${entry.symbol}`),
  ]);
  return { valid: reasons.length === 0, reasons, symbolEntries, approvalRequest, websocketUrl };
}

export function createKisOverseasRealtimeFeed(dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl;
  const webSocketFactory = dependencies.webSocketFactory;
  const setTimeoutImpl = dependencies.setTimeoutImpl ?? setTimeout;
  const clearTimeoutImpl = dependencies.clearTimeoutImpl ?? clearTimeout;
  const now = dependencies.now ?? Date.now;

  return {
    async connect(config = {}, handlers = {}) {
      const validation = validateFeedConfig(config);
      if (!validation.valid) {
        return { connected: false, reasons: validation.reasons, close() {}, status() { return "blocked"; } };
      }
      if (typeof fetchImpl !== "function" || typeof webSocketFactory !== "function") {
        return { connected: false, reasons: ["missing_network_dependencies"], close() {}, status() { return "blocked"; } };
      }

      let active = true;
      let socket = null;
      let reconnectTimer = null;
      let reconnectAttempt = 0;
      let state = "connecting";
      let approvalKey = "";

      const emitStatus = (nextState, details = {}) => {
        state = nextState;
        handlers.onStatus?.({ state: nextState, ...details, credentialStored: false, rawProviderPayloadStored: false });
      };

      const requestApprovalKey = async () => {
        const request = validation.approvalRequest;
        const response = await fetchImpl(request.url, request.init);
        if (!active) return "";
        if (!response?.ok) throw Object.assign(new Error("approval_request_failed"), { code: `http_${response?.status ?? "unknown"}` });
        const body = await response.json();
        if (!active) return "";
        const key = clean(body?.approval_key);
        if (!key) throw Object.assign(new Error("approval_key_missing"), { code: "approval_key_missing" });
        return key;
      };

      const subscribeAll = () => {
        for (const entry of validation.symbolEntries) {
          const key = buildKisOverseasSubscriptionKey(entry);
          for (const trId of Object.values(KIS_OVERSEAS_REALTIME_TR_IDS)) {
            const envelope = buildKisOverseasSubscriptionEnvelope({ approvalKey, trId, trKey: key.trKey, subscribe: true });
            socket.send(JSON.stringify(envelope.message));
          }
        }
      };

      const scheduleReconnect = (reason) => {
        if (!active || reconnectAttempt >= (config.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS)) {
          emitStatus("closed", { reason: reconnectAttempt >= (config.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS) ? "reconnect_exhausted" : reason });
          return;
        }
        const delayMs = getKisReconnectDelayMs(reconnectAttempt, config.reconnectPolicy);
        reconnectAttempt += 1;
        emitStatus("reconnecting", { attempt: reconnectAttempt, delayMs, reason });
        reconnectTimer = setTimeoutImpl(() => void openSocket(), delayMs);
      };

      const openSocket = async () => {
        if (!active) return;
        try {
          emitStatus("authorizing", { attempt: reconnectAttempt });
          const nextApprovalKey = await requestApprovalKey();
          if (!active || !nextApprovalKey) return;
          approvalKey = nextApprovalKey;
          if (!active) {
            approvalKey = "";
            return;
          }
          socket = webSocketFactory(validation.websocketUrl);
          bindSocketEvent(socket, "open", () => {
            if (!active) return;
            reconnectAttempt = 0;
            emitStatus("subscribing");
            subscribeAll();
            emitStatus("connected", { subscriptionCount: validation.symbolEntries.length * 2 });
          });
          bindSocketEvent(socket, "message", (message) => {
            if (!active) return;
            const rawValue = message?.data ?? message;
            const raw = typeof rawValue === "string" ? rawValue : Buffer.isBuffer(rawValue) ? rawValue.toString("utf8") : clean(rawValue);
            const parsed = parseKisOverseasRealtimeFrame(raw, { receivedAtMs: now() });
            if (parsed.echoRequired && socket?.readyState === 1) socket.send(raw);
            if (!parsed.valid) {
              handlers.onProtocolIssue?.({ kind: parsed.kind, reasons: parsed.reasons, trId: parsed.trId ?? "", rawStored: false });
              return;
            }
            if (parsed.kind === "control") {
              handlers.onControl?.({ trId: parsed.trId, controlStatus: parsed.controlStatus, rawStored: false });
            }
            for (const event of parsed.events) handlers.onEvent?.(event);
          });
          bindSocketEvent(socket, "error", () => {
            if (!active) return;
            handlers.onProtocolIssue?.({ kind: "socket_error", reasons: ["websocket_error"], rawStored: false });
          });
          bindSocketEvent(socket, "close", () => {
            approvalKey = "";
            socket = null;
            if (active) scheduleReconnect("websocket_closed");
          });
        } catch (error) {
          approvalKey = "";
          if (!active) return;
          handlers.onProtocolIssue?.({ kind: "authorization_error", reasons: [maskError(error, "kis_realtime_connect_failed")], rawStored: false });
          scheduleReconnect("authorization_failed");
        }
      };

      void openSocket();
      return {
        connected: true,
        reasons: [],
        close() {
          if (!active) return;
          active = false;
          approvalKey = "";
          if (reconnectTimer) clearTimeoutImpl(reconnectTimer);
          reconnectTimer = null;
          const socketToClose = socket;
          socket = null;
          if (socketToClose && typeof socketToClose.close === "function") socketToClose.close();
          emitStatus("closed", { reason: "operator_close" });
        },
        status() {
          return state;
        },
      };
    },
  };
}
