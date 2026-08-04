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
    error.reasons = Array.isArray(body?.reasons) ? body.reasons : [];
    error.body = body;
    throw error;
  }
  return body;
}

export async function fetchTradingScalpingAdminDashboard() {
  const response = await fetch(buildUrl("/admin/trading-readiness/scalping-dashboard"), {
    method: "GET",
    credentials: "include",
    headers: adminHeaders(),
  });
  return readJson(response);
}

export async function saveTradingScalpingAdminDraft(payload) {
  const response = await fetch(buildUrl("/admin/trading-readiness/scalping-strategy-draft"), {
    method: "PUT",
    credentials: "include",
    headers: adminHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJson(response);
}
