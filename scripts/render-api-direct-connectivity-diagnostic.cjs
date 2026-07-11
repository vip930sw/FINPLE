const dns = require("node:dns").promises;
const https = require("node:https");
const tls = require("node:tls");

const DEFAULT_RENDER_API_BASE_URL = "https://finple-api.onrender.com/api";
const DEFAULT_VERCEL_URL = "https://finple.co.kr/";

const DEFAULT_ENDPOINTS = [
  { key: "render_api_health", url: `${DEFAULT_RENDER_API_BASE_URL}/health`, expectedStatus: 200 },
  { key: "render_db_health", url: `${DEFAULT_RENDER_API_BASE_URL}/db/health`, expectedStatus: 200 },
  { key: "render_admin_trading_readiness", url: `${DEFAULT_RENDER_API_BASE_URL}/admin/trading-readiness/readiness`, expectedStatus: 403 },
  { key: "vercel_production", url: DEFAULT_VERCEL_URL, expectedStatus: 200 },
];

function normalizeError(error) {
  if (!error) return null;
  return {
    code: error.code || error.cause?.code || null,
    message: String(error.message || error.cause?.message || error),
  };
}

function classifyConnectivityOutcome(result) {
  if (result.dns?.ok === false) return "dns_lookup_failed";
  if (result.tcp?.ok === false) return "tcp_connect_failed";
  if (result.tls?.ok === false) return "tls_handshake_failed";
  if (result.http?.ok === false && result.http?.status == null) return "http_response_missing";
  if (result.http?.ok === false) return "http_status_unexpected";
  if (result.body?.ok === false) return "response_body_invalid";
  if (result.retry?.eventuallySucceeded === true) return "retry_recovered";
  if (result.http?.ok === true && result.body?.ok !== false) return "ok";
  return "not_attempted";
}

function summarizeRootCauseCandidate(result) {
  const stage = classifyConnectivityOutcome(result);
  if (stage === "dns_lookup_failed") return "DNS resolution failed before any TCP connection attempt.";
  if (stage === "tcp_connect_failed") return "DNS resolved, but TCP port 443 connection failed before TLS or HTTP.";
  if (stage === "tls_handshake_failed") return "TCP connected, but TLS handshake failed before HTTP response.";
  if (stage === "http_response_missing") return "TLS likely succeeded, but no HTTP response was received.";
  if (stage === "http_status_unexpected") return "HTTP response arrived with an unexpected status code.";
  if (stage === "response_body_invalid") return "HTTP response arrived, but response body was missing or invalid.";
  if (stage === "retry_recovered") return "Initial failure recovered after retry; cold start or transient edge/network issue is plausible.";
  if (stage === "ok") return "Endpoint returned the expected HTTP response.";
  return "No live probe result was recorded.";
}

function buildClientCommandMatrix(url) {
  return {
    curl: `curl.exe -sS -i ${url}`,
    curlVerbose: `curl.exe -v --connect-timeout 30 --max-time 60 ${url}`,
    nodeFetch: `node -e "fetch('${url}', { headers: { Accept: 'application/json' } }).then(async r => console.log(r.status, await r.text())).catch(e => { console.error(e.cause?.code || e.message); process.exit(1); })"`,
    powershellInvokeWebRequest: `Invoke-WebRequest -Uri '${url}' -Method Get -TimeoutSec 30 -Headers @{Accept='application/json'}`,
  };
}

function buildDiagnosticPlan({ apiBaseUrl = DEFAULT_RENDER_API_BASE_URL, appUrl = DEFAULT_VERCEL_URL } = {}) {
  const normalizedApiBaseUrl = String(apiBaseUrl).replace(/\/+$/, "");
  const normalizedAppUrl = String(appUrl);
  return [
    { key: "render_api_health", url: `${normalizedApiBaseUrl}/health`, expectedStatus: 200 },
    { key: "render_db_health", url: `${normalizedApiBaseUrl}/db/health`, expectedStatus: 200 },
    { key: "render_admin_trading_readiness", url: `${normalizedApiBaseUrl}/admin/trading-readiness/readiness`, expectedStatus: 403 },
    { key: "vercel_production", url: normalizedAppUrl, expectedStatus: 200 },
  ].map((target) => ({
    ...target,
    clientCommands: buildClientCommandMatrix(target.url),
  }));
}

async function probeDns(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return { ok: true, addresses };
  } catch (error) {
    return { ok: false, error: normalizeError(error) };
  }
}

function probeTls(hostname, port = 443, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = tls.connect({ host: hostname, port, servername: hostname, timeout: timeoutMs }, () => {
      const result = {
        ok: true,
        authorized: socket.authorized,
        protocol: socket.getProtocol(),
        elapsedMs: Date.now() - startedAt,
      };
      socket.end();
      resolve(result);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: { code: "TLS_TIMEOUT", message: "TLS connection timed out" }, elapsedMs: Date.now() - startedAt });
    });
    socket.on("error", (error) => {
      resolve({ ok: false, error: normalizeError(error), elapsedMs: Date.now() - startedAt });
    });
  });
}

function probeHttp(url, expectedStatus, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const request = https.request(url, { method: "GET", timeout: timeoutMs, headers: { Accept: "application/json" } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          ok: response.statusCode === expectedStatus,
          status: response.statusCode,
          expectedStatus,
          elapsedMs: Date.now() - startedAt,
          body: { ok: body.length > 0, length: body.length },
        });
      });
    });
    request.on("timeout", () => {
      request.destroy(new Error("HTTP_TIMEOUT"));
    });
    request.on("error", (error) => {
      resolve({ ok: false, status: null, expectedStatus, error: normalizeError(error), elapsedMs: Date.now() - startedAt });
    });
    request.end();
  });
}

async function probeEndpoint(target) {
  const url = new URL(target.url);
  const dnsResult = await probeDns(url.hostname);
  const tlsResult = dnsResult.ok ? await probeTls(url.hostname, Number(url.port || 443)) : { ok: false, skipped: true };
  const httpResult = tlsResult.ok ? await probeHttp(target.url, target.expectedStatus) : { ok: false, status: null, skipped: true };
  const result = {
    key: target.key,
    url: target.url,
    expectedStatus: target.expectedStatus,
    dns: dnsResult,
    tcp: tlsResult.ok ? { ok: true } : { ok: false, error: tlsResult.error, via: "tls_connect" },
    tls: tlsResult,
    http: httpResult,
    body: httpResult.body || null,
  };
  return {
    ...result,
    failureStage: classifyConnectivityOutcome(result),
    rootCauseCandidate: summarizeRootCauseCandidate(result),
  };
}

async function runLiveDiagnostic(options = {}) {
  const plan = buildDiagnosticPlan(options);
  const results = [];
  for (const target of plan) {
    results.push(await probeEndpoint(target));
  }
  return {
    checkedAt: new Date().toISOString(),
    targets: results,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (!args.has("--live")) {
    console.log(JSON.stringify({ ok: true, mode: "plan", targets: buildDiagnosticPlan() }, null, 2));
    return;
  }
  const result = await runLiveDiagnostic();
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_ENDPOINTS,
  DEFAULT_RENDER_API_BASE_URL,
  DEFAULT_VERCEL_URL,
  buildClientCommandMatrix,
  buildDiagnosticPlan,
  classifyConnectivityOutcome,
  normalizeError,
  probeEndpoint,
  runLiveDiagnostic,
  summarizeRootCauseCandidate,
};
