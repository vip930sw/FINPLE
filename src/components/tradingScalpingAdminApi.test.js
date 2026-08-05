import test from "node:test";
import assert from "node:assert/strict";

import { fetchTradingScalpingKisCaptureStatus } from "./tradingScalpingAdminApi.js";

test("scalping admin client normalizes URLs and classifies diagnostics", async (t) => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  let token = "";
  let requestUrl = "";

  globalThis.window = {
    FINPLE_ASSET_DATA_CONFIG: { apiBaseUrl: "https://example.test" },
    localStorage: { getItem: () => token },
    setTimeout,
    clearTimeout,
  };
  t.after(() => {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url) => {
    requestUrl = url;
    return new Response('{"ok":true}', { status: 200 });
  };
  await fetchTradingScalpingKisCaptureStatus();
  assert.equal(requestUrl, "https://example.test/api/admin/trading-readiness/scalping-kis-capture");

  window.FINPLE_ASSET_DATA_CONFIG.apiBaseUrl = "https://example.test/api/";
  await fetchTradingScalpingKisCaptureStatus();
  assert.equal(requestUrl, "https://example.test/api/admin/trading-readiness/scalping-kis-capture");

  globalThis.fetch = async () => new Response(
    '{"ok":false,"code":"ADMIN_TOKEN_REQUIRED","message":"required"}',
    { status: 403 },
  );
  await assert.rejects(
    fetchTradingScalpingKisCaptureStatus(),
    (error) => error.code === "ADMIN_AUTH_MISSING" && error.adminTokenConfigured === false,
  );

  token = "synthetic-token";
  await assert.rejects(
    fetchTradingScalpingKisCaptureStatus(),
    (error) => error.code === "ADMIN_AUTH_INVALID" && error.adminTokenConfigured === true,
  );

  globalThis.fetch = async () => new Response("not found", { status: 404 });
  await assert.rejects(
    fetchTradingScalpingKisCaptureStatus(),
    (error) => error.code === "ADMIN_ROUTE_NOT_FOUND",
  );

  globalThis.fetch = async () => new Response("not json", { status: 200 });
  await assert.rejects(
    fetchTradingScalpingKisCaptureStatus(),
    (error) => error.code === "RESPONSE_JSON_PARSE_FAILED",
  );

  globalThis.fetch = async (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  await assert.rejects(
    fetchTradingScalpingKisCaptureStatus({ timeoutMs: 5 }),
    (error) => error.code === "REQUEST_TIMEOUT",
  );
});
