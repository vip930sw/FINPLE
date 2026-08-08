import process from "node:process";

import { consumeAdminStartAuthorization } from "../middleware/adminGuard.js";
import {
  KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE,
  KIS_OVERSEAS_BALANCE_ENDPOINT,
  KIS_OVERSEAS_BALANCE_MAX_PAGES,
  KIS_OVERSEAS_BALANCE_TR_IDS,
  requestKisOverseasAccountBalance,
} from "./tradingKisOverseasAccountReadOnly.js";
import { KIS_READ_ONLY_BASE_URLS } from "./tradingKisReadOnlyApproval.js";
import { TRADING_ENV_NAMES, isKisTradingAccountIdValid } from "./tradingEnvConfig.js";

export const KIS_ACCOUNT_READ_RUNTIME_VERSION = "kis-account-read-v1";
export const KIS_ACCOUNT_READ_MAX_RUNTIME_MS = 30_000;
export const KIS_ACCOUNT_READ_FEATURE_ENV = "FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED";

const TOKEN_PATH = "/oauth2/tokenP";
const FIXED_EXCHANGE = "NASD";
const FIXED_CURRENCY = "USD";
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const SAFE_FAILURE_CODES = new Set([
  "KIS_ACCOUNT_READ_ABORTED",
  "KIS_ACCOUNT_READ_TOKEN_REQUEST_FAILED",
  "KIS_ACCOUNT_READ_TOKEN_HTTP_ERROR",
  "KIS_ACCOUNT_READ_TOKEN_SCHEMA_INVALID",
  "KIS_ACCOUNT_READ_TOKEN_REQUIRED",
  "KIS_ACCOUNT_READ_PROVIDER_REQUEST_FAILED",
  "KIS_ACCOUNT_READ_PROVIDER_SCHEMA_INVALID",
  "KIS_ACCOUNT_READ_REQUEST_CONTRACT_INVALID",
  "KIS_ACCOUNT_REQUEST_ABORTED",
  "KIS_ACCOUNT_PROVIDER_REQUEST_FAILED",
  "KIS_ACCOUNT_PROVIDER_HTTP_ERROR",
  "KIS_ACCOUNT_PROVIDER_SCHEMA_INVALID",
  "KIS_ACCOUNT_PROVIDER_REJECTED",
  "KIS_ACCOUNT_CONTINUATION_INVALID",
  "KIS_ACCOUNT_CONTINUATION_REPEATED",
  "KIS_ACCOUNT_PAGINATION_LIMIT_REACHED",
  "KIS_ACCOUNT_DUPLICATE_POSITION",
  "KIS_ACCOUNT_POSITION_SYMBOL_INVALID",
  "KIS_ACCOUNT_POSITION_EXCHANGE_INVALID",
]);

let currentRun = null;

function clean(value) {
  return String(value ?? "").trim();
}

function featureEnabled(env) {
  return TRUE_VALUES.has(clean(env[KIS_ACCOUNT_READ_FEATURE_ENV]).toLowerCase());
}

function credentialEnvironment(env) {
  const value = clean(env.FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT).toLowerCase();
  return value === "paper" || value === "live" ? value : "invalid";
}

function baseUrlEnvironment(env) {
  const value = clean(env[TRADING_ENV_NAMES.baseUrl]).replace(/\/+$/, "");
  if (value === KIS_READ_ONLY_BASE_URLS.paper) return "paper";
  if (value === KIS_READ_ONLY_BASE_URLS.live) return "live";
  return "invalid";
}

function assessConfiguration(env) {
  const accountId = clean(env[TRADING_ENV_NAMES.accountId]);
  const credentialEnv = credentialEnvironment(env);
  const baseUrlEnv = baseUrlEnvironment(env);
  const reasons = [
    featureEnabled(env) ? null : "kis_account_read_feature_flag_disabled",
    accountId ? null : "kis_account_read_account_required",
    accountId && !isKisTradingAccountIdValid(accountId) ? "kis_account_read_account_invalid" : null,
    clean(env[TRADING_ENV_NAMES.appKey]) ? null : "kis_account_read_app_key_required",
    clean(env[TRADING_ENV_NAMES.appSecret]) ? null : "kis_account_read_app_secret_required",
    credentialEnv === "invalid" ? "kis_account_read_credential_environment_invalid" : null,
    baseUrlEnv === "invalid" ? "kis_account_read_base_url_invalid" : null,
    credentialEnv !== "invalid" && baseUrlEnv !== "invalid" && credentialEnv !== baseUrlEnv
      ? "kis_account_read_environment_mismatch"
      : null,
  ].filter(Boolean);
  return {
    accountId,
    accountConfigured: Boolean(accountId),
    accountFormatValid: isKisTradingAccountIdValid(accountId),
    credentialEnvironment: credentialEnv,
    baseUrlEnvironment: baseUrlEnv,
    environmentMatch: credentialEnv !== "invalid" && credentialEnv === baseUrlEnv,
    reasons,
  };
}

function runtimeError(code, details = [], statusCode = 409) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  error.statusCode = statusCode;
  return error;
}

function safeReason(value, fallback = "kis_account_read_stopped") {
  return clean(value).replace(/[^A-Za-z0-9_:-]/g, "_").slice(0, 80) || fallback;
}

function failureReason(error) {
  if (SAFE_FAILURE_CODES.has(error?.code)) return error.code;
  return error?.name === "AbortError" ? "KIS_ACCOUNT_READ_ABORTED" : "KIS_ACCOUNT_READ_FAILED";
}

function transition(run, state) {
  if (run.finished && state !== "STOPPED") return;
  run.state = state;
  if (run.lifecycle.at(-1) !== state) run.lifecycle.push(state);
}

function finish(run, reason) {
  if (!run || run.finished) return;
  run.finished = true;
  run.endedAtMs = run.now();
  run.reason = safeReason(reason);
  run.abortController.abort();
  if (run.timeout) run.clearTimeout(run.timeout);
  run.timeout = null;
  run.cleanShutdown = true;
  transition(run, "STOPPED");
}

function status(run = currentRun, env = process.env) {
  const config = assessConfiguration(env);
  const active = Boolean(run && !run.finished);
  return {
    ok: true,
    version: KIS_ACCOUNT_READ_RUNTIME_VERSION,
    capability: KIS_OVERSEAS_ACCOUNT_READ_ONLY_SCOPE,
    state: run?.state || "IDLE",
    lifecycle: run ? [...run.lifecycle] : ["IDLE"],
    active,
    featureEnabled: featureEnabled(env),
    accountReadEnabled: featureEnabled(env),
    accountConfigured: config.accountConfigured,
    accountFormatValid: config.accountFormatValid,
    credentialEnvironment: config.credentialEnvironment,
    baseUrlEnvironment: config.baseUrlEnvironment,
    environmentMatch: config.environmentMatch,
    providerIoPending: run?.providerIoPending === true,
    accessTokenRequestCount: run?.accessTokenRequestCount || 0,
    accountRequestCount: run?.accountRequestCount || 0,
    pageCount: run?.pageCount || 0,
    positionCount: run?.positionCount || 0,
    schemaReasonCount: run?.schemaReasonCount || 0,
    schemaAccepted: run?.schemaAccepted === true,
    snapshotAvailable: run?.snapshotAvailable === true,
    validationDurationMs: run ? Math.max(0, Math.round((run.endedAtMs ?? run.now()) - run.startedAtMs)) : 0,
    cleanShutdown: run?.cleanShutdown === true,
    reason: run?.reason || null,
    rawStored: false,
    safety: {
      adminOnly: true,
      accountReadOnly: true,
      processLocalStateOnly: true,
      explicitStartRequired: true,
      providerCallsAllowed: active,
      providerAccountCallsAllowed: active && run.state === "ACCOUNT_READING",
      automaticRestartAllowed: false,
      retryAllowed: false,
      websocketConnectionsAllowed: false,
      approvalKeyRequestsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      positionMutationAllowed: false,
      liveTradingAllowed: false,
      captureRuntimeStarted: false,
      shadowRuntimeStarted: false,
      modelRuntimeStarted: false,
      connectionLeaseAcquired: false,
      credentialsExposed: false,
      credentialsPersisted: false,
      accessTokenPersisted: false,
      rawProviderPayloadStored: false,
      snapshotPersisted: false,
      databaseWritesAllowed: false,
    },
  };
}

async function parseJson(response, code) {
  try {
    return await response.json();
  } catch {
    throw runtimeError(code);
  }
}

export function createKisAccountReadRestTransport(options = {}) {
  const environment = clean(options.environment).toLowerCase();
  const baseUrl = KIS_READ_ONLY_BASE_URLS[environment];
  const trId = KIS_OVERSEAS_BALANCE_TR_IDS[environment];
  const appKey = clean(options.appKey);
  const appSecret = clean(options.appSecret);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  if (!baseUrl || !trId || !appKey || !appSecret || typeof fetchImpl !== "function") {
    throw runtimeError("KIS_ACCOUNT_READ_TRANSPORT_CONFIGURATION_INVALID");
  }

  return Object.freeze({
    async requestAccessToken(signal) {
      let response;
      try {
        response = await fetchImpl(`${baseUrl}${TOKEN_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/plain" },
          body: JSON.stringify({ grant_type: "client_credentials", appkey: appKey, appsecret: appSecret }),
          signal,
        });
      } catch (error) {
        if (signal?.aborted || error?.name === "AbortError") throw runtimeError("KIS_ACCOUNT_READ_ABORTED");
        throw runtimeError("KIS_ACCOUNT_READ_TOKEN_REQUEST_FAILED");
      }
      if (!response?.ok) throw runtimeError("KIS_ACCOUNT_READ_TOKEN_HTTP_ERROR");
      const body = await parseJson(response, "KIS_ACCOUNT_READ_TOKEN_SCHEMA_INVALID");
      const accessToken = clean(body?.access_token);
      if (!accessToken) throw runtimeError("KIS_ACCOUNT_READ_TOKEN_SCHEMA_INVALID");
      return accessToken;
    },

    accountTransport(accessToken) {
      const token = clean(accessToken);
      if (!token) throw runtimeError("KIS_ACCOUNT_READ_TOKEN_REQUIRED");
      return async ({ request, signal }) => {
        if (
          request?.method !== "GET"
          || request?.path !== KIS_OVERSEAS_BALANCE_ENDPOINT
          || request?.trId !== trId
        ) {
          throw runtimeError("KIS_ACCOUNT_READ_REQUEST_CONTRACT_INVALID");
        }
        const url = new URL(`${baseUrl}${KIS_OVERSEAS_BALANCE_ENDPOINT}`);
        for (const [name, value] of Object.entries(request.query || {})) url.searchParams.set(name, value);
        let response;
        try {
          response = await fetchImpl(url, {
            method: "GET",
            headers: {
              authorization: `Bearer ${token}`,
              appkey: appKey,
              appsecret: appSecret,
              tr_id: trId,
              tr_cont: request.continuation,
            },
            signal,
          });
        } catch (error) {
          if (signal?.aborted || error?.name === "AbortError") throw runtimeError("KIS_ACCOUNT_READ_ABORTED");
          throw runtimeError("KIS_ACCOUNT_READ_PROVIDER_REQUEST_FAILED");
        }
        const body = await parseJson(response, "KIS_ACCOUNT_READ_PROVIDER_SCHEMA_INVALID");
        return { ok: response.ok === true, body, trCont: response.headers?.get?.("tr_cont") || "" };
      };
    },
  });
}

export function readKisAccountReadRuntimeStatus(options = {}) {
  return status(currentRun, options.env ?? process.env);
}

export async function startKisAccountReadRuntime(options = {}, dependencies = {}) {
  if (!consumeAdminStartAuthorization(options.adminStartAuthorization)) {
    throw runtimeError("KIS_ADMIN_START_AUTHORIZATION_REQUIRED", ["authenticated_admin_start_required"], 403);
  }
  if (currentRun && !currentRun.finished) {
    throw runtimeError("KIS_ACCOUNT_READ_ALREADY_ACTIVE", ["kis_account_read_single_flight_required"]);
  }
  if (currentRun?.providerIoPending) {
    throw runtimeError("KIS_ACCOUNT_READ_PREVIOUS_IO_PENDING", ["previous_provider_io_settlement_required"]);
  }

  const env = dependencies.env ?? process.env;
  const config = assessConfiguration(env);
  if (config.reasons.length > 0) {
    throw runtimeError("KIS_ACCOUNT_READ_CONFIGURATION_BLOCKED", config.reasons);
  }

  const now = dependencies.now ?? Date.now;
  const setTimeoutImpl = dependencies.setTimeoutImpl ?? setTimeout;
  const clearTimeoutImpl = dependencies.clearTimeoutImpl ?? clearTimeout;
  const abortController = new AbortController();
  const run = {
    state: "AUTHORIZED",
    lifecycle: ["AUTHORIZED"],
    finished: false,
    startedAtMs: now(),
    endedAtMs: null,
    now,
    clearTimeout: clearTimeoutImpl,
    abortController,
    timeout: null,
    reason: null,
    providerIoPending: false,
    accessTokenRequestCount: 0,
    accountRequestCount: 0,
    pageCount: 0,
    positionCount: 0,
    schemaReasonCount: 0,
    schemaAccepted: false,
    snapshotAvailable: false,
    cleanShutdown: false,
  };
  currentRun = run;
  const requestedTimeoutMs = Number(dependencies.timeoutMs);
  const timeoutMs = Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0
    ? Math.min(requestedTimeoutMs, KIS_ACCOUNT_READ_MAX_RUNTIME_MS)
    : KIS_ACCOUNT_READ_MAX_RUNTIME_MS;
  run.timeout = setTimeoutImpl(() => finish(run, "kis_account_read_timeout"), timeoutMs);

  run.providerIoPending = true;
  try {
    const transport = dependencies.transportFactory?.({ env, environment: config.credentialEnvironment, signal: abortController.signal })
      ?? createKisAccountReadRestTransport({
        environment: config.credentialEnvironment,
        appKey: env[TRADING_ENV_NAMES.appKey],
        appSecret: env[TRADING_ENV_NAMES.appSecret],
        fetchImpl: dependencies.fetchImpl,
      });
    transition(run, "TOKEN_REQUESTING");
    run.accessTokenRequestCount = 1;
    const accessToken = await transport.requestAccessToken(abortController.signal);
    if (run.finished) return status(run, env);
    transition(run, "TOKEN_READY");
    transition(run, "ACCOUNT_READING");
    const accountTransport = transport.accountTransport(accessToken);
    const snapshot = await requestKisOverseasAccountBalance({
      environment: config.credentialEnvironment,
      accountId: config.accountId,
      exchange: FIXED_EXCHANGE,
      currency: FIXED_CURRENCY,
      maxPages: KIS_OVERSEAS_BALANCE_MAX_PAGES,
      signal: abortController.signal,
      transport: async (input) => {
        if (run.accountRequestCount >= KIS_OVERSEAS_BALANCE_MAX_PAGES) {
          throw runtimeError("KIS_ACCOUNT_PAGINATION_LIMIT_REACHED");
        }
        run.accountRequestCount += 1;
        return accountTransport(input);
      },
    });
    if (!run.finished) {
      run.pageCount = Number(snapshot?.pageCount) || 0;
      run.positionCount = Array.isArray(snapshot?.positions) ? snapshot.positions.length : 0;
      run.schemaReasonCount = Array.isArray(snapshot?.schemaReasons) ? snapshot.schemaReasons.length : 0;
      run.schemaAccepted = snapshot?.rawStored === false;
      run.snapshotAvailable = run.schemaAccepted;
      transition(run, "ACCOUNT_VALIDATED");
      finish(run, run.schemaAccepted ? "kis_account_read_validated" : "kis_account_read_schema_rejected");
    }
  } catch (error) {
    finish(run, failureReason(error));
  } finally {
    run.providerIoPending = false;
  }
  return status(run, env);
}

export function stopKisAccountReadRuntime() {
  if (currentRun && !currentRun.finished) finish(currentRun, "admin_operator_stop");
  return status(currentRun);
}

export function resetKisAccountReadRuntimeForTest() {
  if (currentRun && !currentRun.finished) finish(currentRun, "test_reset");
  if (!currentRun?.providerIoPending) currentRun = null;
}
