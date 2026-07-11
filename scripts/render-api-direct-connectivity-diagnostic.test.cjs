const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildClientCommandMatrix,
  buildDiagnosticPlan,
  classifyConnectivityOutcome,
  summarizeRootCauseCandidate,
} = require("./render-api-direct-connectivity-diagnostic.cjs");

test("classifies Render connectivity failures by DNS TCP TLS HTTP and response body stage", () => {
  assert.equal(classifyConnectivityOutcome({ dns: { ok: false } }), "dns_lookup_failed");
  assert.equal(classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: false } }), "tcp_connect_failed");
  assert.equal(classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: true }, tls: { ok: false } }), "tls_handshake_failed");
  assert.equal(
    classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: true }, tls: { ok: true }, http: { ok: false, status: null } }),
    "http_response_missing",
  );
  assert.equal(
    classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: true }, tls: { ok: true }, http: { ok: false, status: 500 } }),
    "http_status_unexpected",
  );
  assert.equal(
    classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: true }, tls: { ok: true }, http: { ok: true }, body: { ok: false } }),
    "response_body_invalid",
  );
  assert.equal(
    classifyConnectivityOutcome({ dns: { ok: true }, tcp: { ok: true }, tls: { ok: true }, http: { ok: true }, body: { ok: true } }),
    "ok",
  );
});

test("summarizes direct curl failure candidates without blaming app route code", () => {
  const result = {
    dns: { ok: true, addresses: [{ address: "216.24.57.9", family: 4 }] },
    tcp: { ok: false, error: { code: "EACCES", message: "Bad access" } },
  };

  assert.equal(classifyConnectivityOutcome(result), "tcp_connect_failed");
  assert.match(summarizeRootCauseCandidate(result), /TCP port 443/);
});

test("builds endpoint and client command matrix for curl Node fetch and PowerShell comparison", () => {
  const plan = buildDiagnosticPlan({
    apiBaseUrl: "https://example-api.test/api/",
    appUrl: "https://example-app.test/",
  });
  const keys = plan.map((target) => target.key);

  assert.deepEqual(keys, [
    "render_api_health",
    "render_db_health",
    "render_admin_trading_readiness",
    "vercel_production",
  ]);
  assert.equal(plan[0].url, "https://example-api.test/api/health");
  assert.equal(plan[2].expectedStatus, 403);
  assert.match(plan[0].clientCommands.curl, /curl\.exe/);
  assert.match(plan[0].clientCommands.nodeFetch, /fetch/);
  assert.match(plan[0].clientCommands.powershellInvokeWebRequest, /Invoke-WebRequest/);
  assert.match(buildClientCommandMatrix("https://finple-api.onrender.com/api/health").curlVerbose, /--connect-timeout 30/);
});
