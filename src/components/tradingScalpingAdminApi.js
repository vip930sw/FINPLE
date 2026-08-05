import {
  getFinpleAdminToken,
  getFinpleApiBaseUrl,
} from "./portfolio/services/serverPortfolioService.js";

function buildUrl(path) {
  const base = String(getFinpleApiBaseUrl() || "").replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function adminHeaders(extra = {}) {
  const token = getFinpleAdminToken();
  return {
    Accept: "application/json",
    ...(token ? { "x-finple-admin-token": token } : {}),
    ...extra,
  };
}

async function readJson(response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const error = new Error(body?.message || body?.code || `요청 실패 (${response.status})`);
    error.status = response.status;
    error.code = body?.code || "ADMIN_SCALPING_REQUEST_FAILED";
    error.reasons = Array.isArray(body?.reasons)
      ? body.reasons
      : Array.isArray(body?.details)
        ? body.details
        : [];
    error.body = body;
    throw error;
  }
  return body;
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers: adminHeaders({
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    }),
  });
  return readJson(response);
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

export async function fetchTradingScalpingModelSignalStatus() {
  return requestJson("/admin/trading-readiness/scalping-model-signal", { method: "GET" });
}

export async function acknowledgeTradingScalpingModelSignalCircuitBreaker() {
  return requestJson("/admin/trading-readiness/scalping-model-signal/acknowledge", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
