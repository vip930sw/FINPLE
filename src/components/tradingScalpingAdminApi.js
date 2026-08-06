import {
  getFinpleAdminToken,
  getFinpleApiBaseUrl,
} from "./portfolio/services/serverPortfolioService.js";
import { normalizeFinpleApiBaseUrl } from "./portfolio/services/apiBaseUrl.js";

const DEFAULT_TIMEOUT_MS = 10_000;

function buildUrl(path) {
  const base = normalizeFinpleApiBaseUrl(getFinpleApiBaseUrl());
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function adminHeaders(token, extra = {}) {
  return {
    Accept: "application/json",
    ...(token ? { "x-finple-admin-token": token } : {}),
    ...extra,
  };
}

function requestError(message, code, details = {}) {
  return Object.assign(new Error(message), { code, ...details });
}

async function readJson(response, context = {}) {
  const text = await response.text();
  let body = null;
  let parseFailed = false;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    parseFailed = true;
  }
  if (!response.ok) {
    const code = response.status === 404
      ? "ADMIN_ROUTE_NOT_FOUND"
      : response.status === 403 && body?.code === "ADMIN_TOKEN_REQUIRED"
        ? context.adminTokenConfigured ? "ADMIN_AUTH_INVALID" : "ADMIN_AUTH_MISSING"
        : response.status === 403
          ? "ADMIN_FORBIDDEN"
          : response.status === 401
            ? "ADMIN_AUTH_INVALID"
            : body?.code || "ADMIN_SCALPING_REQUEST_FAILED";
    throw requestError(body?.message || body?.code || `요청 실패 (${response.status})`, code, {
      status: response.status,
      reasons: Array.isArray(body?.reasons)
        ? body.reasons
        : Array.isArray(body?.details)
          ? body.details
          : [],
      body,
      parseFailed,
      ...context,
    });
  }
  if (parseFailed) {
    throw requestError("API 응답이 올바른 JSON이 아닙니다.", "RESPONSE_JSON_PARSE_FAILED", context);
  }
  return body;
}

async function requestJson(path, options = {}) {
  const {
    signal: externalSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...fetchOptions
  } = options;
  const requestUrl = buildUrl(path);
  const adminToken = getFinpleAdminToken();
  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort("timeout");
  }, timeoutMs);

  if (externalSignal?.aborted) abortFromExternalSignal();
  else externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });

  try {
    const response = await fetch(requestUrl, {
      credentials: "omit",
      ...fetchOptions,
      signal: controller.signal,
      headers: adminHeaders(adminToken, {
        ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
        ...(fetchOptions.headers || {}),
      }),
    });
    return await readJson(response, {
      requestUrl,
      adminTokenConfigured: Boolean(adminToken),
    });
  } catch (error) {
    if (error?.code) throw error;
    if (timedOut) {
      throw requestError("API 응답 시간이 초과되었습니다.", "REQUEST_TIMEOUT", { requestUrl });
    }
    if (externalSignal?.aborted) {
      throw requestError("API 요청이 취소되었습니다.", "REQUEST_ABORTED", { requestUrl });
    }
    throw requestError("API 서버에 연결하지 못했습니다.", "TRANSPORT_FAILURE", { requestUrl });
  } finally {
    window.clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }
}

export async function fetchTradingScalpingAdminDashboard() {
  return requestJson("/admin/trading-readiness/scalping-dashboard", { method: "GET" });
}

export async function saveTradingScalpingAdminDraft(payload) {
  return requestJson("/admin/trading-readiness/scalping-strategy-draft", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function requestTradingScalpingStrategyReview(expectedRevision) {
  return requestJson("/admin/trading-readiness/scalping-strategy-draft/review-request", {
    method: "POST",
    body: JSON.stringify({ expectedRevision }),
  });
}

export async function approveTradingScalpingStrategyDraft(expectedRevision) {
  return requestJson("/admin/trading-readiness/scalping-strategy-draft/approve", {
    method: "POST",
    body: JSON.stringify({ expectedRevision }),
  });
}

export async function retireTradingScalpingStrategyVersion(versionId, reason) {
  return requestJson(`/admin/trading-readiness/scalping-strategy-versions/${encodeURIComponent(versionId)}/retire`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchTradingScalpingShadowStatus() {
  return requestJson("/admin/trading-readiness/scalping-shadow", { method: "GET" });
}

export async function startTradingScalpingShadowRuntime(payload) {
  return requestJson("/admin/trading-readiness/scalping-shadow/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function stopTradingScalpingShadowRuntime(reason = "operator_stop") {
  return requestJson("/admin/trading-readiness/scalping-shadow/stop", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchTradingScalpingKisFeedStatus() {
  return requestJson("/admin/trading-readiness/scalping-shadow-feed", { method: "GET" });
}

export async function startTradingScalpingKisFeed(payload = {}) {
  return requestJson("/admin/trading-readiness/scalping-shadow-feed/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function stopTradingScalpingKisFeed(reason = "operator_stop") {
  return requestJson("/admin/trading-readiness/scalping-shadow-feed/stop", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchTradingScalpingKisCaptureStatus(options = {}) {
  return requestJson("/admin/trading-readiness/scalping-kis-capture", { method: "GET", ...options });
}

export async function startTradingScalpingKisCapture(payload = {}) {
  return requestJson("/admin/trading-readiness/scalping-kis-capture/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function stopTradingScalpingKisCapture(reason = "operator_stop") {
  return requestJson("/admin/trading-readiness/scalping-kis-capture/stop", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function sealTradingScalpingKisCaptureSession(payload = {}) {
  return requestJson("/admin/trading-readiness/scalping-kis-capture/seal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTradingScalpingModelSignalStatus() {
  return requestJson("/admin/trading-readiness/scalping-model-signal", { method: "GET" });
}

export async function acknowledgeTradingScalpingModelSignalCircuitBreaker() {
  return requestJson("/admin/trading-readiness/scalping-model-signal/acknowledge", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
