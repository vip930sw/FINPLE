import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { TRADING_ENV_NAMES, isKisTradingAccountIdValid } from "./tradingEnvConfig.js";
import {
  KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE,
  KIS_OVERSEAS_BALANCE_ENDPOINT,
  buildKisOverseasAccountReadOnlyStatus,
  buildKisOverseasBalanceRequest,
  requestKisOverseasAccountBalance,
} from "./tradingKisOverseasAccountReadOnly.js";

const accountId = "12345678-01";
const nowMs = Date.parse("2026-08-08T00:00:00.000Z");

function position(overrides = {}) {
  return {
    ovrs_pdno: "TQQQ",
    ovrs_excg_cd: "NASD",
    ovrs_cblc_qty: "2",
    pchs_avg_pric: "80.125",
    now_pric2: "81.50",
    ovrs_stck_evlu_amt: "163.00",
    frcr_evlu_pfls_amt: "2.75",
    evlu_pfls_rt: "1.716",
    ...overrides,
  };
}

function summary(overrides = {}) {
  return {
    frcr_pchs_amt1: "160.25",
    tot_evlu_pfls_amt: "2.75",
    ovrs_rlzt_pfls_amt: "-1.50",
    tot_pftrt: "1.716",
    ...overrides,
  };
}

function page(overrides = {}) {
  return {
    ok: true,
    trCont: "",
    body: {
      rt_cd: "0",
      output1: [],
      output2: {},
      ctx_area_fk200: "",
      ctx_area_nk200: "",
      ...overrides.body,
    },
    ...overrides,
  };
}

function requestInput(overrides = {}) {
  return {
    environment: "live",
    accountId,
    exchange: "NASD",
    currency: "USD",
    nowMs,
    transport: async () => page(),
    ...overrides,
  };
}

test("canonical account parser accepts only XXXXXXXX-XX", () => {
  assert.equal(isKisTradingAccountIdValid(accountId), true);
  assert.equal(isKisTradingAccountIdValid("1234567801"), false);
  assert.equal(isKisTradingAccountIdValid("12345678-1"), false);
});

test("request builder splits account only at the provider boundary", () => {
  const request = buildKisOverseasBalanceRequest(requestInput());
  assert.equal(request.query.CANO, "12345678");
  assert.equal(request.query.ACNT_PRDT_CD, "01");
  assert.throws(() => buildKisOverseasBalanceRequest({ ...requestInput(), accountId: "bad" }), { code: "KIS_ACCOUNT_ID_INVALID" });
});

test("redacted status never contains account digits", () => {
  const status = buildKisOverseasAccountReadOnlyStatus({ env: { [TRADING_ENV_NAMES.accountId]: accountId } });
  assert.equal(status.capability, KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE);
  assert.equal(status.accountConfigured, true);
  assert.equal(status.accountFormatValid, true);
  assert.equal(JSON.stringify(status).includes("12345678"), false);
  assert.equal(JSON.stringify(status).includes("01"), false);
});

test("status remains independently disabled and order-safe", () => {
  const status = buildKisOverseasAccountReadOnlyStatus({ env: {} });
  assert.equal(status.accountReadEnabled, false);
  assert.equal(status.accountReadRuntimeAllowed, false);
  assert.equal(status.providerAccountCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.positionMutationAllowed, false);
  assert.equal(status.liveActivationAllowed, false);
});

test("live builder uses the official GET endpoint and TTTS3012R", () => {
  const request = buildKisOverseasBalanceRequest(requestInput());
  assert.equal(request.method, "GET");
  assert.equal(request.path, KIS_OVERSEAS_BALANCE_ENDPOINT);
  assert.equal(request.trId, "TTTS3012R");
});

test("paper builder uses the official GET endpoint and VTTS3012R", () => {
  const request = buildKisOverseasBalanceRequest({ ...requestInput(), environment: "paper" });
  assert.equal(request.method, "GET");
  assert.equal(request.path, KIS_OVERSEAS_BALANCE_ENDPOINT);
  assert.equal(request.trId, "VTTS3012R");
});

test("builder accepts official US exchange codes and USD only", () => {
  for (const exchange of ["NASD", "NAS", "NYSE", "AMEX"]) {
    assert.equal(buildKisOverseasBalanceRequest({ ...requestInput(), exchange }).query.OVRS_EXCG_CD, exchange);
  }
  assert.equal(buildKisOverseasBalanceRequest(requestInput()).query.TR_CRCY_CD, "USD");
  assert.throws(() => buildKisOverseasBalanceRequest({ ...requestInput(), currency: "KRW" }), { code: "KIS_ACCOUNT_CURRENCY_UNSUPPORTED" });
});

test("live NASD represents the official all-US query while paper stays explicit", () => {
  assert.equal(buildKisOverseasBalanceRequest({ ...requestInput(), environment: "live", exchange: "NASD" }).query.OVRS_EXCG_CD, "NASD");
  assert.throws(
    () => buildKisOverseasBalanceRequest({ ...requestInput(), environment: "paper", exchange: "NAS" }),
    { code: "KIS_ACCOUNT_EXCHANGE_UNSUPPORTED" },
  );
});

test("single-page empty account returns an empty redacted snapshot", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput());
  assert.deepEqual(snapshot.positions, []);
  assert.equal(snapshot.provider, "KIS");
  assert.equal(snapshot.rawStored, false);
  assert.equal(snapshot.pageCount, 1);
});

test("one position is normalized without provider field leakage", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({ body: { output1: [position()], output2: summary() } }),
  }));
  assert.deepEqual(snapshot.positions[0], {
    symbol: "TQQQ",
    exchange: "NASD",
    quantity: 2,
    averageAcquisitionPrice: 80.125,
    currentPrice: 81.5,
    evaluationAmount: 163,
    unrealizedProfitLoss: 2.75,
    unrealizedProfitLossRate: 1.716,
  });
  assert.equal("ovrs_pdno" in snapshot.positions[0], false);
});

test("multiple positions retain deterministic provider order", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({
      body: { output1: [position(), position({ ovrs_pdno: "UPRO", ovrs_excg_cd: "AMEX" })], output2: summary() },
    }),
  }));
  assert.deepEqual(snapshot.positions.map(({ symbol }) => symbol), ["TQQQ", "UPRO"]);
});

test("positive and negative profit and loss values are preserved", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({
      body: { output1: [position({ frcr_evlu_pfls_amt: "-2.50", evlu_pfls_rt: "-1.2" })], output2: summary() },
    }),
  }));
  assert.equal(snapshot.positions[0].unrealizedProfitLoss, -2.5);
  assert.equal(snapshot.positions[0].unrealizedProfitLossRate, -1.2);
  assert.equal(snapshot.summary.realizedProfitLoss, -1.5);
});

test("malformed numeric and negative quantity become null with safe reasons", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({
      body: { output1: [position({ ovrs_cblc_qty: "-1", now_pric2: "$81", frcr_evlu_pfls_amt: "1,000" })], output2: summary() },
    }),
  }));
  assert.equal(snapshot.positions[0].quantity, null);
  assert.equal(snapshot.positions[0].currentPrice, null);
  assert.equal(snapshot.positions[0].unrealizedProfitLoss, null);
  assert.deepEqual(snapshot.schemaReasons, [
    "position_0_quantity_invalid",
    "position_0_current_price_invalid",
    "position_0_unrealized_profit_loss_invalid",
  ]);
});

test("unknown or malformed position identity fails closed", async () => {
  await assert.rejects(
    requestKisOverseasAccountBalance(requestInput({ transport: async () => page({ body: { output1: [position({ ovrs_pdno: "BAD SYMBOL" })] } }) })),
    { code: "KIS_ACCOUNT_POSITION_SYMBOL_INVALID" },
  );
  await assert.rejects(
    requestKisOverseasAccountBalance(requestInput({ transport: async () => page({ body: { output1: [position({ ovrs_excg_cd: "UNKNOWN" })] } }) })),
    { code: "KIS_ACCOUNT_POSITION_EXCHANGE_INVALID" },
  );
});

test("summary contains only officially supported normalized concepts", async () => {
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({ body: { output2: summary() } }),
  }));
  assert.deepEqual(snapshot.summary, {
    totalPurchaseAmount: 160.25,
    totalUnrealizedProfitLoss: 2.75,
    realizedProfitLoss: -1.5,
    totalProfitLossRate: 1.716,
    currency: "USD",
  });
  assert.equal("cash" in snapshot.summary, false);
  assert.equal("totalEvaluationAmount" in snapshot.summary, false);
});

test("provider and HTTP errors are reduced to safe codes", async () => {
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({ transport: async () => page({ body: { rt_cd: "1" } }) })), { code: "KIS_ACCOUNT_PROVIDER_REJECTED" });
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({ transport: async () => ({ ok: false }) })), { code: "KIS_ACCOUNT_PROVIDER_HTTP_ERROR" });
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({ transport: async () => { throw new Error("raw provider secret"); } })), { code: "KIS_ACCOUNT_PROVIDER_REQUEST_FAILED" });
});

test("AbortSignal stops the transport contract with a redacted error", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({
    signal: controller.signal,
    transport: async () => { calls += 1; return page(); },
  })), { code: "KIS_ACCOUNT_REQUEST_ABORTED" });
  assert.equal(calls, 0);
});

test("pagination starts blank, follows M/F keys, and finishes deterministically", async () => {
  const requests = [];
  const responses = [
    page({ trCont: "M", body: { output1: [position()], output2: summary(), ctx_area_fk200: "FK1", ctx_area_nk200: "NK1" } }),
    page({ trCont: "", body: { output1: [position({ ovrs_pdno: "UPRO", ovrs_excg_cd: "AMEX" })], output2: summary() } }),
  ];
  const snapshot = await requestKisOverseasAccountBalance(requestInput({
    continuation: { fk200: "CALLER_FK", nk200: "CALLER_NK" },
    transport: async ({ request }) => { requests.push(request); return responses.shift(); },
  }));
  assert.equal(requests[0].query.CTX_AREA_FK200, "");
  assert.equal(requests[1].query.CTX_AREA_FK200, "FK1");
  assert.equal(requests[1].continuation, "N");
  assert.equal(snapshot.pageCount, 2);
  assert.deepEqual(snapshot.positions.map(({ symbol }) => symbol), ["TQQQ", "UPRO"]);
});

test("pagination stops at the configured hard bound", async () => {
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({
    maxPages: 1,
    transport: async () => page({ trCont: "M", body: { ctx_area_fk200: "FK1", ctx_area_nk200: "NK1" } }),
  })), { code: "KIS_ACCOUNT_PAGINATION_LIMIT_REACHED" });
});

test("pagination rejects repeated and malformed continuation keys", async () => {
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({ trCont: "M", body: { ctx_area_fk200: "FK1", ctx_area_nk200: "NK1" } }),
  })), { code: "KIS_ACCOUNT_CONTINUATION_REPEATED" });
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({ trCont: "F", body: { ctx_area_fk200: "FK_ONLY" } }),
  })), { code: "KIS_ACCOUNT_CONTINUATION_INVALID" });
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({
    transport: async () => page({ trCont: "M", body: { ctx_area_fk200: "FK\u0001", ctx_area_nk200: "NK1" } }),
  })), { code: "KIS_ACCOUNT_CONTINUATION_INVALID" });
});

test("pagination rejects blank M/F continuation before a second transport call", async () => {
  for (const trCont of ["M", "F"]) {
    let calls = 0;
    await assert.rejects(requestKisOverseasAccountBalance(requestInput({
      transport: async () => {
        calls += 1;
        return page({ trCont, body: { ctx_area_fk200: "", ctx_area_nk200: "" } });
      },
    })), { code: "KIS_ACCOUNT_CONTINUATION_INVALID" });
    assert.equal(calls, 1);
  }
});

test("pagination rejects duplicate positions instead of accumulating them", async () => {
  const responses = [
    page({ trCont: "M", body: { output1: [position()], ctx_area_fk200: "FK1", ctx_area_nk200: "NK1" } }),
    page({ body: { output1: [position()] } }),
  ];
  await assert.rejects(requestKisOverseasAccountBalance(requestInput({ transport: async () => responses.shift() })), { code: "KIS_ACCOUNT_DUPLICATE_POSITION" });
});

test("caller cannot inject an order method or endpoint", () => {
  const request = buildKisOverseasBalanceRequest({ ...requestInput(), method: "POST", path: "/uapi/order" });
  assert.equal(request.method, "GET");
  assert.equal(request.path, KIS_OVERSEAS_BALANCE_ENDPOINT);
  assert.equal(JSON.stringify(request).includes("/uapi/order"), false);
});

test("import and status checks perform no network or persistence work", async () => {
  let calls = 0;
  const status = buildKisOverseasAccountReadOnlyStatus({ env: {}, transport: () => { calls += 1; } });
  assert.equal(calls, 0);
  assert.equal(status.rawStored, false);
  const source = await readFile(new URL("./tradingKisOverseasAccountReadOnly.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from\s+["'][^"']*\/db\//);
  assert.doesNotMatch(source, /(?:INSERT|UPDATE|DELETE)\s+/i);
});
