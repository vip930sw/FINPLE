import process from "node:process";

import { TRADING_ENV_NAMES, isKisTradingAccountIdValid } from "./tradingEnvConfig.js";

export const KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE = "trading_read_only_account_state";
export const KIS_OVERSEAS_BALANCE_ENDPOINT = "/uapi/overseas-stock/v1/trading/inquire-balance";
export const KIS_OVERSEAS_BALANCE_TR_IDS = Object.freeze({ live: "TTTS3012R", paper: "VTTS3012R" });
export const KIS_OVERSEAS_BALANCE_MAX_PAGES = 10;

const US_EXCHANGES_BY_ENVIRONMENT = Object.freeze({
  live: new Set(["NASD", "NAS", "NYSE", "AMEX"]),
  paper: new Set(["NASD", "NYSE", "AMEX"]),
});
const SYMBOL_PATTERN = /^[A-Z0-9._-]{1,20}$/;
const NUMBER_PATTERN = /^-?(?:\d+\.?\d*|\.\d+)$/;

function clean(value) {
  return String(value ?? "").trim();
}

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function accountParts(value) {
  const accountId = clean(value);
  if (!isKisTradingAccountIdValid(accountId)) fail("KIS_ACCOUNT_ID_INVALID");
  return { cano: accountId.slice(0, 8), accountProductCode: accountId.slice(9) };
}

function continuationPair(value = {}) {
  const fk200 = clean(value.fk200);
  const nk200 = clean(value.nk200);
  if (!fk200 && !nk200) return { fk200: "", nk200: "" };
  const valid = (key) => key.length <= 200 && [...key].every((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  });
  if (!fk200 || !nk200 || !valid(fk200) || !valid(nk200)) {
    fail("KIS_ACCOUNT_CONTINUATION_INVALID");
  }
  return { fk200, nk200 };
}

function normalizeExchange(value, environment) {
  const exchange = clean(value).toUpperCase();
  if (!US_EXCHANGES_BY_ENVIRONMENT[environment]?.has(exchange)) fail("KIS_ACCOUNT_EXCHANGE_UNSUPPORTED");
  return exchange;
}

function finiteNumber(value, reason, reasons, options = {}) {
  const raw = clean(value);
  if (!raw) return null;
  if (!NUMBER_PATTERN.test(raw)) {
    reasons.push(reason);
    return null;
  }
  const number = Number(raw);
  if (!Number.isFinite(number) || (options.nonNegative === true && number < 0)) {
    reasons.push(reason);
    return null;
  }
  return number;
}

function records(value) {
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
}

function normalizePosition(record, index, reasons) {
  const symbol = clean(record?.ovrs_pdno).toUpperCase();
  const exchange = clean(record?.ovrs_excg_cd).toUpperCase();
  if (!SYMBOL_PATTERN.test(symbol)) fail("KIS_ACCOUNT_POSITION_SYMBOL_INVALID");
  if (!["NASD", "NAS", "NYSE", "AMEX"].includes(exchange)) fail("KIS_ACCOUNT_POSITION_EXCHANGE_INVALID");
  const prefix = `position_${index}`;
  return {
    symbol,
    exchange,
    quantity: finiteNumber(record.ovrs_cblc_qty, `${prefix}_quantity_invalid`, reasons, { nonNegative: true }),
    averageAcquisitionPrice: finiteNumber(record.pchs_avg_pric, `${prefix}_average_acquisition_price_invalid`, reasons, { nonNegative: true }),
    currentPrice: finiteNumber(record.now_pric2, `${prefix}_current_price_invalid`, reasons, { nonNegative: true }),
    evaluationAmount: finiteNumber(record.ovrs_stck_evlu_amt, `${prefix}_evaluation_amount_invalid`, reasons, { nonNegative: true }),
    unrealizedProfitLoss: finiteNumber(record.frcr_evlu_pfls_amt, `${prefix}_unrealized_profit_loss_invalid`, reasons),
    unrealizedProfitLossRate: finiteNumber(record.evlu_pfls_rt, `${prefix}_unrealized_profit_loss_rate_invalid`, reasons),
  };
}

function normalizeSummary(value, reasons) {
  const summary = records(value).at(-1) || {};
  return {
    totalPurchaseAmount: finiteNumber(summary.frcr_pchs_amt1, "summary_total_purchase_amount_invalid", reasons, { nonNegative: true }),
    totalUnrealizedProfitLoss: finiteNumber(summary.tot_evlu_pfls_amt, "summary_total_unrealized_profit_loss_invalid", reasons),
    realizedProfitLoss: finiteNumber(summary.ovrs_rlzt_pfls_amt, "summary_realized_profit_loss_invalid", reasons),
    totalProfitLossRate: finiteNumber(summary.tot_pftrt, "summary_total_profit_loss_rate_invalid", reasons),
  };
}

export function buildKisOverseasBalanceRequest(input = {}) {
  const environment = clean(input.environment).toLowerCase();
  const trId = KIS_OVERSEAS_BALANCE_TR_IDS[environment];
  if (!trId) fail("KIS_ACCOUNT_ENVIRONMENT_INVALID");
  const { cano, accountProductCode } = accountParts(input.accountId);
  const exchange = normalizeExchange(input.exchange, environment);
  const currency = clean(input.currency).toUpperCase();
  if (currency !== "USD") fail("KIS_ACCOUNT_CURRENCY_UNSUPPORTED");
  const continuation = continuationPair(input.continuation);

  return Object.freeze({
    method: "GET",
    path: KIS_OVERSEAS_BALANCE_ENDPOINT,
    trId,
    continuation: continuation.fk200 ? "N" : "",
    query: Object.freeze({
      CANO: cano,
      ACNT_PRDT_CD: accountProductCode,
      OVRS_EXCG_CD: exchange,
      TR_CRCY_CD: currency,
      CTX_AREA_FK200: continuation.fk200,
      CTX_AREA_NK200: continuation.nk200,
    }),
  });
}

export function buildKisOverseasAccountReadOnlyStatus(options = {}) {
  const env = options.env ?? process.env;
  const accountId = clean(env[TRADING_ENV_NAMES.accountId]);
  return {
    capability: KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE,
    accountReadImplemented: true,
    accountReadEnabled: false,
    accountConfigured: Boolean(accountId),
    accountFormatValid: isKisTradingAccountIdValid(accountId),
    accountReadRuntimeAllowed: false,
    providerAccountCallsAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    positionMutationAllowed: false,
    liveActivationAllowed: false,
    rawStored: false,
  };
}

export async function requestKisOverseasAccountBalance(input = {}) {
  if (typeof input.transport !== "function") fail("KIS_ACCOUNT_TRANSPORT_REQUIRED");
  const requestedMaxPages = Number(input.maxPages);
  const maxPages = Number.isInteger(requestedMaxPages) && requestedMaxPages > 0
    ? Math.min(requestedMaxPages, KIS_OVERSEAS_BALANCE_MAX_PAGES)
    : KIS_OVERSEAS_BALANCE_MAX_PAGES;
  const seenContinuation = new Set();
  const positions = [];
  const positionKeys = new Set();
  const schemaReasons = [];
  let continuation = { fk200: "", nk200: "" };
  let summary = {};
  let pageCount = 0;

  while (pageCount < maxPages) {
    if (input.signal?.aborted) fail("KIS_ACCOUNT_REQUEST_ABORTED");
    const request = buildKisOverseasBalanceRequest({ ...input, continuation });
    let response;
    try {
      response = await input.transport({ request, signal: input.signal });
    } catch (error) {
      if (input.signal?.aborted || error?.name === "AbortError") fail("KIS_ACCOUNT_REQUEST_ABORTED");
      fail("KIS_ACCOUNT_PROVIDER_REQUEST_FAILED");
    }
    if (input.signal?.aborted) fail("KIS_ACCOUNT_REQUEST_ABORTED");
    if (!response || typeof response !== "object" || response.ok !== true) fail("KIS_ACCOUNT_PROVIDER_HTTP_ERROR");
    const body = response.body;
    if (!body || typeof body !== "object") fail("KIS_ACCOUNT_PROVIDER_SCHEMA_INVALID");
    if (body.rt_cd !== undefined && clean(body.rt_cd) !== "0") fail("KIS_ACCOUNT_PROVIDER_REJECTED");

    pageCount += 1;
    for (const record of records(body.output1)) {
      const position = normalizePosition(record, positions.length, schemaReasons);
      const key = `${position.exchange}:${position.symbol}`;
      if (positionKeys.has(key)) fail("KIS_ACCOUNT_DUPLICATE_POSITION");
      positionKeys.add(key);
      positions.push(position);
    }
    if (records(body.output2).length > 0) summary = normalizeSummary(body.output2, schemaReasons);

    const trCont = clean(response.trCont).toUpperCase();
    if (trCont !== "M" && trCont !== "F") break;
    if (pageCount >= maxPages) fail("KIS_ACCOUNT_PAGINATION_LIMIT_REACHED");
    const next = continuationPair({ fk200: body.ctx_area_fk200, nk200: body.ctx_area_nk200 });
    if (!next.fk200) fail("KIS_ACCOUNT_CONTINUATION_INVALID");
    const key = `${next.fk200}\u0000${next.nk200}`;
    if (seenContinuation.has(key)) fail("KIS_ACCOUNT_CONTINUATION_REPEATED");
    seenContinuation.add(key);
    continuation = next;
  }

  const nowMs = Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  return {
    provider: "KIS",
    capability: KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE,
    environment: clean(input.environment).toLowerCase(),
    asOf: new Date(nowMs).toISOString(),
    currency: "USD",
    positions,
    summary: { ...summary, currency: "USD" },
    pageCount,
    schemaReasons,
    rawStored: false,
  };
}
