import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import process from "node:process";
import test from "node:test";

import { requireAdminStartAccess } from "../middleware/adminGuard.js";
import {
  assertKisOverseasBalanceRequestContract,
  buildKisOverseasBalanceRequest,
} from "./tradingKisOverseasAccountReadOnly.js";
import { KIS_READ_ONLY_BASE_URLS } from "./tradingKisReadOnlyApproval.js";
import {
  KIS_ACCOUNT_LIVE_READ_ENVIRONMENT,
  KIS_ACCOUNT_LIVE_READ_SCOPE,
  REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS,
} from "./tradingKisAccountLiveReadApproval.js";
import * as accountReadRuntime from "./tradingKisAccountReadRuntimeService.js";
import {
  KIS_ACCOUNT_READ_MAX_RUNTIME_MS,
  readKisAccountReadRuntimeStatus,
  resetKisAccountReadRuntimeForTest,
  startKisAccountReadRuntime,
  stopKisAccountReadRuntime,
} from "./tradingKisAccountReadRuntimeService.js";

const secrets = ["12345678-01", "SENSITIVE_APP_KEY", "SENSITIVE_APP_SECRET", "SENSITIVE_ACCESS_TOKEN"];

function adminStartAuthorization() {
  const previous = process.env.FINPLE_ADMIN_TOKEN;
  process.env.FINPLE_ADMIN_TOKEN = "test-admin-token";
  let authorization;
  try {
    requireAdminStartAccess(
      { get: (name) => name === "x-finple-admin-token" ? "test-admin-token" : "" },
      { status() { return this; }, json(payload) { assert.fail(payload.code); } },
      (value) => { authorization = value; },
    );
  } finally {
    if (previous === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previous;
  }
  return authorization;
}

function paperEnv(overrides = {}) {
  return {
    FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "true",
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "paper",
    KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.paper,
    KIS_TRADING_ACCOUNT_ID: secrets[0],
    KIS_TRADING_APP_KEY: secrets[1],
    KIS_TRADING_APP_SECRET: secrets[2],
    ...overrides,
  };
}

function liveEnv(overrides = {}) {
  return {
    FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "true",
    FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
    KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    KIS_TRADING_ACCOUNT_ID: secrets[0],
    KIS_TRADING_APP_KEY: secrets[1],
    KIS_TRADING_APP_SECRET: secrets[2],
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVAL_ID: "synthetic-approval",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_BY: "synthetic-operator",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_AT: "2026-08-07T00:00:00.000Z",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_EXPIRES_AT: "2026-08-30T00:00:00.000Z",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_SCOPE: KIS_ACCOUNT_LIVE_READ_SCOPE,
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENVIRONMENT: KIS_ACCOUNT_LIVE_READ_ENVIRONMENT,
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ACCOUNT_ID_HASH: createHash("sha256")
      .update(secrets[0], "utf8").digest("hex"),
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_FORBIDDEN_ACTIONS:
      REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS.join(","),
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_EVIDENCE_TICKET: "synthetic-evidence",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_REVOCATION_PLAN: "synthetic-revocation",
    FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_REDACTION_VERSION: "v1",
    ...overrides,
  };
}

function page({ positions = [], trCont = "", fk200 = "", nk200 = "" } = {}) {
  return {
    ok: true,
    trCont,
    body: { rt_cd: "0", output1: positions, output2: [{}], ctx_area_fk200: fk200, ctx_area_nk200: nk200 },
  };
}

function position() {
  return {
    ovrs_pdno: "TQQQ",
    ovrs_excg_cd: "NASD",
    ovrs_cblc_qty: "1",
    pchs_avg_pric: "50",
    now_pric2: "60",
    ovrs_stck_evlu_amt: "60",
    frcr_evlu_pfls_amt: "10",
    evlu_pfls_rt: "20",
  };
}

function fakeTransport(responses = [page()]) {
  let tokenCalls = 0;
  let accountCalls = 0;
  return {
    transport: {
      async requestAccessToken() { tokenCalls += 1; return secrets[3]; },
      accountTransport() { return async () => { accountCalls += 1; return responses.shift(); }; },
    },
    tokenCalls: () => tokenCalls,
    accountCalls: () => accountCalls,
  };
}

async function startWith(harness, options = {}) {
  return startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    { env: paperEnv(), transportFactory: () => harness.transport, ...options },
  );
}

test.beforeEach(() => resetKisAccountReadRuntimeForTest());
test.afterEach(() => resetKisAccountReadRuntimeForTest());

test("feature and configuration failures are fail-closed before provider I/O", async () => {
  assert.equal(readKisAccountReadRuntimeStatus({ env: paperEnv({ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "" }) }).featureEnabled, false);
  assert.equal(readKisAccountReadRuntimeStatus({ env: paperEnv({ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "" }) }).accountReadEnabled, false);
  const cases = [
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "" }, "kis_account_read_feature_flag_disabled"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "false" }, "kis_account_read_feature_flag_disabled"],
    [{ KIS_TRADING_ACCOUNT_ID: "" }, "kis_account_read_account_required"],
    [{ KIS_TRADING_ACCOUNT_ID: "invalid" }, "kis_account_read_account_invalid"],
    [{ KIS_TRADING_APP_KEY: "" }, "kis_account_read_app_key_required"],
    [{ KIS_TRADING_APP_SECRET: "" }, "kis_account_read_app_secret_required"],
    [{ KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live }, "kis_account_read_environment_mismatch"],
  ];
  for (const [overrides, reason] of cases) {
    let providerCalls = 0;
    await assert.rejects(
      startKisAccountReadRuntime(
        { adminStartAuthorization: adminStartAuthorization() },
        { env: paperEnv(overrides), transportFactory: () => { providerCalls += 1; } },
      ),
      (error) => error.code === "KIS_ACCOUNT_READ_CONFIGURATION_BLOCKED" && error.details.includes(reason),
    );
    assert.equal(providerCalls, 0);
  }
});

test("paper rollout remains unchanged and live configurations stay closed by default", async () => {
  const paper = fakeTransport();
  const paperResult = await startWith(paper);
  assert.equal(paperResult.credentialEnvironment, "paper");
  assert.equal(paperResult.environmentMatch, true);
  assert.equal(paperResult.rolloutEnvironment, "paper");
  assert.equal(paperResult.runtimeAuthorized, true);

  resetKisAccountReadRuntimeForTest();
  const cases = [
    [{
      FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live",
      KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live,
    }, "kis_account_read_live_feature_flag_disabled"],
    [{ KIS_TRADING_BASE_URL: KIS_READ_ONLY_BASE_URLS.live }, "kis_account_read_environment_mismatch"],
    [{ FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT: "live" }, "kis_account_read_environment_mismatch"],
  ];
  for (const [overrides, reason] of cases) {
    let transportCalls = 0;
    let fetchCalls = 0;
    const env = paperEnv(overrides);
    const inspected = readKisAccountReadRuntimeStatus({ env });
    if (overrides.FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT === "live"
      && overrides.KIS_TRADING_BASE_URL === KIS_READ_ONLY_BASE_URLS.live) {
      assert.equal(inspected.credentialEnvironment, "live");
      assert.equal(inspected.baseUrlEnvironment, "live");
      assert.equal(inspected.environmentMatch, true);
      assert.equal(inspected.runtimeAuthorized, false);
    }
    await assert.rejects(
      startKisAccountReadRuntime(
        { adminStartAuthorization: adminStartAuthorization() },
        {
          env,
          fetchImpl: async () => { fetchCalls += 1; },
          transportFactory: () => { transportCalls += 1; return fakeTransport().transport; },
        },
      ),
      (error) => error.code === "KIS_ACCOUNT_READ_CONFIGURATION_BLOCKED"
        && error.details.includes(reason),
    );
    assert.equal(transportCalls, 0);
    assert.equal(fetchCalls, 0);
  }
});

test("live rollout requires its dedicated flag and every approval gate before provider I/O", async () => {
  const productionLike = readKisAccountReadRuntimeStatus({
    env: liveEnv({
      FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "",
      FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "",
    }),
    nowMs: Date.parse("2026-08-08T00:00:00.000Z"),
  });
  assert.equal(productionLike.rolloutMode, "live");
  assert.equal(productionLike.paperFeatureEnabled, false);
  assert.equal(productionLike.liveFeatureEnabled, false);
  assert.equal(productionLike.runtimeAuthorized, false);
  assert.equal(productionLike.active, false);
  assert.equal(productionLike.providerIoPending, false);

  const cases = [
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "", FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "" }, "kis_account_read_live_feature_flag_disabled"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "true", FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "" }, "kis_account_read_live_feature_flag_disabled"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVAL_ID: "" }, "kis_account_read_live_approval_required"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_AT: "invalid" }, "kis_account_read_live_approved_at_invalid"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_AT: "2026-08-09T00:00:00.000Z" }, "kis_account_read_live_approval_inactive"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_EXPIRES_AT: "2026-08-07T00:00:00.000Z" }, "kis_account_read_live_approval_expired"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_SCOPE: "trading_read_only_market_data" }, "kis_account_read_live_scope_mismatch"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENVIRONMENT: "virtual_shadow" }, "kis_account_read_live_environment_mismatch"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_BASE_URL: KIS_READ_ONLY_BASE_URLS.paper }, "kis_account_read_live_base_url_mismatch"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ACCOUNT_ID_HASH: "mismatch" }, "kis_account_read_live_account_binding_mismatch"],
    [{ FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_FORBIDDEN_ACTIONS: "order_submission" }, "kis_account_read_live_forbidden_actions_incomplete"],
  ];
  for (const [overrides, reason] of cases) {
    let transportCalls = 0;
    let fetchCalls = 0;
    const env = liveEnv(overrides);
    await assert.rejects(
      startKisAccountReadRuntime(
        { adminStartAuthorization: adminStartAuthorization() },
        {
          env,
          now: () => Date.parse("2026-08-08T00:00:00.000Z"),
          fetchImpl: async () => { fetchCalls += 1; },
          transportFactory: () => { transportCalls += 1; return fakeTransport().transport; },
        },
      ),
      (error) => error.code === "KIS_ACCOUNT_READ_CONFIGURATION_BLOCKED" && error.details.includes(reason),
    );
    assert.equal(transportCalls, 0);
    assert.equal(fetchCalls, 0);
    resetKisAccountReadRuntimeForTest();
  }
});

test("generic Phase 2C-0 builder retains the future live TTTS3012R contract", () => {
  const request = buildKisOverseasBalanceRequest({
    environment: "live",
    accountId: secrets[0],
    exchange: "NASD",
    currency: "USD",
  });
  assert.equal(request.trId, "TTTS3012R");
});

test("the live flag cannot authorize paper and the paper flag cannot authorize live", async () => {
  for (const [env, reason] of [
    [paperEnv({ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "", FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "true" }), "kis_account_read_feature_flag_disabled"],
    [liveEnv({ FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED: "true", FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED: "" }), "kis_account_read_live_feature_flag_disabled"],
  ]) {
    let providerCalls = 0;
    await assert.rejects(
      startKisAccountReadRuntime(
        { adminStartAuthorization: adminStartAuthorization() },
        {
          env,
          now: () => Date.parse("2026-08-08T00:00:00.000Z"),
          transportFactory: () => { providerCalls += 1; return fakeTransport().transport; },
        },
      ),
      (error) => error.code === "KIS_ACCOUNT_READ_CONFIGURATION_BLOCKED" && error.details.includes(reason),
    );
    assert.equal(providerCalls, 0);
    resetKisAccountReadRuntimeForTest();
  }
});

test("a synthetic approved live run uses TTTS3012R and finishes without persistence", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) return { ok: true, json: async () => ({ access_token: secrets[3] }) };
    return { ok: true, headers: { get: () => "" }, json: async () => page().body };
  };
  const result = await startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    {
      env: liveEnv(),
      now: () => Date.parse("2026-08-08T00:00:00.000Z"),
      fetchImpl,
    },
  );
  assert.deepEqual(result.lifecycle, [
    "AUTHORIZED",
    "LIVE_APPROVAL_VALIDATED",
    "TOKEN_REQUESTING",
    "TOKEN_READY",
    "ACCOUNT_READING",
    "ACCOUNT_VALIDATED",
    "STOPPED",
  ]);
  assert.equal(result.rolloutMode, "live");
  assert.equal(result.liveApprovalReady, true);
  assert.equal(result.liveApprovalReasonCount, 0);
  assert.equal(result.liveApprovalActive, true);
  assert.equal(result.liveApprovalScopeMatch, true);
  assert.equal(result.liveApprovalEnvironmentMatch, true);
  assert.equal(result.liveApprovalBaseUrlMatch, true);
  assert.equal(result.liveApprovalAccountBindingMatch, true);
  assert.equal(result.runtimeAuthorized, true);
  assert.equal(result.accessTokenRequestCount, 1);
  assert.equal(result.accountRequestCount, 1);
  assert.equal(result.schemaAccepted, true);
  assert.equal(result.rawStored, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${KIS_READ_ONLY_BASE_URLS.live}/oauth2/tokenP`);
  assert.equal(new URL(calls[1].url).pathname, "/uapi/overseas-stock/v1/trading/inquire-balance");
  assert.equal(calls[1].init.headers.tr_id, "TTTS3012R");
  assert.equal(new URL(calls[1].url).searchParams.get("OVRS_EXCG_CD"), "NASD");
  assert.equal(new URL(calls[1].url).searchParams.get("TR_CRCY_CD"), "USD");
  const serialized = JSON.stringify(result);
  for (const hidden of [
    secrets[0],
    secrets[1],
    secrets[2],
    secrets[3],
    liveEnv().FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ACCOUNT_ID_HASH,
    "synthetic-approval",
    "synthetic-operator",
    "synthetic-evidence",
  ]) assert.equal(serialized.includes(hidden), false);
});

test("a forged live access decision fails before transport or fetch", async () => {
  let transportCalls = 0;
  let fetchCalls = 0;
  await assert.rejects(
    startKisAccountReadRuntime(
      { adminStartAuthorization: adminStartAuthorization() },
      {
        env: liveEnv(),
        now: () => Date.parse("2026-08-08T00:00:00.000Z"),
        liveAccessDecision: {},
        fetchImpl: async () => { fetchCalls += 1; },
        transportFactory: () => { transportCalls += 1; return fakeTransport().transport; },
      },
    ),
    { code: "KIS_ACCOUNT_READ_LIVE_ACCESS_REQUIRED" },
  );
  assert.equal(transportCalls, 0);
  assert.equal(fetchCalls, 0);
});

test("only a genuine one-time admin proof can start the runtime", async () => {
  for (const authorization of [undefined, true, {}, JSON.parse("{}")]) {
    await assert.rejects(
      startKisAccountReadRuntime({ adminStartAuthorization: authorization }, { env: paperEnv() }),
      { code: "KIS_ADMIN_START_AUTHORIZATION_REQUIRED" },
    );
  }
  const authorization = adminStartAuthorization();
  const first = fakeTransport();
  await startKisAccountReadRuntime({ adminStartAuthorization: authorization }, { env: paperEnv(), transportFactory: () => first.transport });
  await assert.rejects(
    startKisAccountReadRuntime({ adminStartAuthorization: authorization }, { env: paperEnv() }),
    { code: "KIS_ADMIN_START_AUTHORIZATION_REQUIRED" },
  );
});

test("one-page empty and normalized-position reads finish with redacted counts", async () => {
  for (const positions of [[], [position()]]) {
    const harness = fakeTransport([page({ positions })]);
    const result = await startWith(harness);
    assert.deepEqual(result.lifecycle, ["AUTHORIZED", "TOKEN_REQUESTING", "TOKEN_READY", "ACCOUNT_READING", "ACCOUNT_VALIDATED", "STOPPED"]);
    assert.equal(result.state, "STOPPED");
    assert.equal(result.schemaAccepted, true);
    assert.equal(result.snapshotAvailable, true);
    assert.equal(result.positionCount, positions.length);
    assert.equal(result.pageCount, 1);
    assert.equal(result.accessTokenRequestCount, 1);
    assert.equal(result.accountRequestCount, 1);
    assert.equal(harness.tokenCalls(), 1);
    assert.equal(harness.accountCalls(), 1);
    assert.equal(result.safety.rawProviderPayloadStored, false);
    resetKisAccountReadRuntimeForTest();
  }
});

test("provider, schema and token failures stop safely without retry", async () => {
  const cases = [
    fakeTransport([{ ok: false, body: {} }]),
    fakeTransport([{ ok: true, body: { rt_cd: "0", output1: "bad", output2: [] } }]),
  ];
  for (const harness of cases) {
    const result = await startWith(harness);
    assert.equal(result.state, "STOPPED");
    assert.equal(result.schemaAccepted, false);
    assert.equal(harness.accountCalls(), 1);
    resetKisAccountReadRuntimeForTest();
  }

  let tokenCalls = 0;
  const result = await startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    {
      env: paperEnv(),
      transportFactory: () => ({
        async requestAccessToken() { tokenCalls += 1; throw Object.assign(new Error("raw secret"), { code: "KIS_ACCOUNT_READ_TOKEN_REQUEST_FAILED" }); },
      }),
    },
  );
  assert.equal(result.reason, "KIS_ACCOUNT_READ_TOKEN_REQUEST_FAILED");
  assert.equal(tokenCalls, 1);

  resetKisAccountReadRuntimeForTest();
  const redacted = await startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    {
      env: paperEnv(),
      transportFactory: () => ({
        async requestAccessToken() { throw Object.assign(new Error("raw secret"), { code: "SENSITIVE_PROVIDER_CODE" }); },
      }),
    },
  );
  assert.equal(redacted.reason, "KIS_ACCOUNT_READ_FAILED");
  assert.equal(JSON.stringify(redacted).includes("SENSITIVE_PROVIDER_CODE"), false);
});

test("pagination remains bounded by the existing ten-page contract", async () => {
  const responses = Array.from({ length: 10 }, (_, index) => page({
    trCont: index === 9 ? "" : "M",
    fk200: `FK${index + 1}`,
    nk200: `NK${index + 1}`,
  }));
  const harness = fakeTransport(responses);
  const result = await startWith(harness);
  assert.equal(result.accountRequestCount, 10);
  assert.equal(harness.accountCalls(), 10);
  assert.equal(result.accessTokenRequestCount, 1);
});

test("active single-flight and unsettled previous I/O block a second run", async () => {
  let resolveToken;
  const pending = new Promise((resolve) => { resolveToken = resolve; });
  const firstStart = startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    {
      env: paperEnv(),
      transportFactory: () => ({ requestAccessToken: () => pending, accountTransport: () => async () => page() }),
    },
  );
  await Promise.resolve();
  await assert.rejects(
    startKisAccountReadRuntime({ adminStartAuthorization: adminStartAuthorization() }, { env: paperEnv() }),
    { code: "KIS_ACCOUNT_READ_ALREADY_ACTIVE" },
  );
  stopKisAccountReadRuntime();
  assert.equal(readKisAccountReadRuntimeStatus({ env: paperEnv() }).providerIoPending, true);
  await assert.rejects(
    startKisAccountReadRuntime({ adminStartAuthorization: adminStartAuthorization() }, { env: paperEnv() }),
    { code: "KIS_ACCOUNT_READ_PREVIOUS_IO_PENDING" },
  );
  resolveToken(secrets[3]);
  await firstStart;
  assert.equal(readKisAccountReadRuntimeStatus({ env: paperEnv() }).providerIoPending, false);
});

test("timeout and operator stop abort in-flight I/O and end in STOPPED", async () => {
  for (const stopMode of ["timeout", "operator"]) {
    let timeoutCallback;
    let aborted = false;
    const start = startKisAccountReadRuntime(
      { adminStartAuthorization: adminStartAuthorization() },
      {
        env: paperEnv(),
        timeoutMs: KIS_ACCOUNT_READ_MAX_RUNTIME_MS + 10_000,
        setTimeoutImpl(callback, delay) { timeoutCallback = callback; assert.equal(delay, KIS_ACCOUNT_READ_MAX_RUNTIME_MS); return 1; },
        clearTimeoutImpl() {},
        transportFactory: () => ({
          requestAccessToken(signal) {
            return new Promise((resolve, reject) => signal.addEventListener("abort", () => {
              aborted = true;
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
            }, { once: true }));
          },
        }),
      },
    );
    await Promise.resolve();
    if (stopMode === "timeout") timeoutCallback();
    else stopKisAccountReadRuntime();
    const result = await start;
    assert.equal(aborted, true);
    assert.equal(result.state, "STOPPED");
    assert.equal(result.cleanShutdown, true);
    assert.equal(result.reason, stopMode === "timeout" ? "kis_account_read_timeout" : "admin_operator_stop");
    resetKisAccountReadRuntimeForTest();
  }
});

test("status is structural, redacted and contains no financial snapshot", async () => {
  const result = await startWith(fakeTransport([page({ positions: [position()] })]));
  const serialized = JSON.stringify(result);
  for (const secret of secrets) assert.equal(serialized.includes(secret), false);
  for (const forbidden of ["CANO", "ACNT_PRDT_CD", "quantity", "averageAcquisitionPrice", "currentPrice", "summary"]) {
    assert.equal(serialized.includes(forbidden), false);
  }
  assert.equal(result.safety.orderSubmissionAllowed, false);
  assert.equal(result.safety.positionMutationAllowed, false);
  assert.equal(result.safety.liveTradingAllowed, false);
  assert.equal(result.safety.databaseWritesAllowed, false);
  assert.equal(result.safety.websocketConnectionsAllowed, false);
  assert.equal(result.safety.approvalKeyRequestsAllowed, false);
});

test("private REST transport is reachable only through the genuine runtime boundary", async () => {
  assert.equal("createKisAccountReadRestTransport" in accountReadRuntime, false);
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) return { ok: true, json: async () => ({ access_token: secrets[3] }) };
    if (calls.length === 2) {
      return {
        ok: true,
        headers: { get: (name) => name === "tr_cont" ? "M" : "" },
        json: async () => page({ fk200: "NEXT_FK", nk200: "NEXT_NK" }).body,
      };
    }
    return { ok: true, headers: { get: () => "" }, json: async () => page().body };
  };
  const result = await startKisAccountReadRuntime(
    { adminStartAuthorization: adminStartAuthorization() },
    { env: paperEnv(), fetchImpl },
  );
  assert.equal(result.schemaAccepted, true);
  assert.equal(result.accountRequestCount, 2);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, `${KIS_READ_ONLY_BASE_URLS.paper}/oauth2/tokenP`);
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calls[0].init.headers, { "Content-Type": "application/json", Accept: "text/plain", charset: "UTF-8" });
  assert.deepEqual(JSON.parse(calls[0].init.body), { grant_type: "client_credentials", appkey: secrets[1], appsecret: secrets[2] });
  assert.equal(new URL(calls[1].url).pathname, "/uapi/overseas-stock/v1/trading/inquire-balance");
  assert.equal(calls[1].init.method, "GET");
  assert.equal(calls[1].init.headers.tr_id, "VTTS3012R");
  assert.equal(calls[1].init.headers.custtype, "P");
  assert.equal(calls[1].init.headers.tr_cont, "");
  assert.equal(calls[1].init.headers["Content-Type"], "application/json");
  assert.equal(calls[1].init.headers.authorization, `Bearer ${secrets[3]}`);
  assert.equal(new URL(calls[1].url).searchParams.get("CANO"), "12345678");
  assert.equal(new URL(calls[1].url).searchParams.get("CTX_AREA_FK200"), "");
  assert.equal(new URL(calls[2].url).searchParams.get("CTX_AREA_FK200"), "NEXT_FK");
  assert.equal(new URL(calls[2].url).searchParams.get("CTX_AREA_NK200"), "NEXT_NK");
  assert.equal(calls[2].init.headers.tr_cont, "N");
  assert.equal(JSON.stringify(result).includes("12345678"), false);
});

test("canonical request guard rejects every identity override before fetch", () => {
  const expected = { environment: "paper", accountId: secrets[0], exchange: "NASD", currency: "USD" };
  const initial = buildKisOverseasBalanceRequest(expected);
  const continuation = buildKisOverseasBalanceRequest({ ...expected, continuation: { fk200: "NEXT_FK", nk200: "NEXT_NK" } });
  assert.equal(assertKisOverseasBalanceRequestContract(initial, expected), true);
  assert.equal(assertKisOverseasBalanceRequestContract(continuation, expected), true);

  const tampered = [
    { ...initial, query: { ...initial.query, CANO: "00000000" } },
    { ...initial, query: { ...initial.query, ACNT_PRDT_CD: "99" } },
    { ...initial, query: { ...initial.query, OVRS_EXCG_CD: "NYSE" } },
    { ...initial, query: { ...initial.query, TR_CRCY_CD: "KRW" } },
    { ...initial, query: { ...initial.query, EXTRA: "blocked" } },
    { ...initial, query: Object.fromEntries(Object.entries(initial.query).filter(([key]) => key !== "CANO")) },
  ];
  let fetchCalls = 0;
  const guardedFetch = (request) => {
    assertKisOverseasBalanceRequestContract(request, expected);
    fetchCalls += 1;
  };
  for (const request of tampered) {
    assert.throws(() => guardedFetch(request), { code: "KIS_ACCOUNT_READ_REQUEST_CONTRACT_INVALID" });
    assert.equal(fetchCalls, 0);
  }
});
