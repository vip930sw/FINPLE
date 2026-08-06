import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  fetchTradingScalpingAdminDashboard,
  fetchTradingScalpingKisCaptureStatus,
  requestTradingScalpingStrategyReview,
  saveTradingScalpingAdminDraft,
} from "./tradingScalpingAdminApi.js";

test("scalping admin client normalizes URLs and classifies diagnostics", async (t) => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  let token = "";
  let requestUrl = "";
  let requestOptions = null;

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

  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Response('{"ok":true}', { status: 200 });
  };
  await fetchTradingScalpingKisCaptureStatus();
  assert.equal(requestUrl, "https://example.test/api/admin/trading-readiness/scalping-kis-capture");
  assert.equal(requestOptions.credentials, "omit");
  assert.equal(requestOptions.headers["x-finple-admin-token"], undefined);

  token = "synthetic-token";
  await fetchTradingScalpingAdminDashboard();
  assert.equal(requestOptions.method, "GET");
  assert.equal(requestOptions.headers["x-finple-admin-token"], token);
  assert.equal(requestOptions.headers["Content-Type"], undefined);

  await requestTradingScalpingStrategyReview(1);
  assert.equal(requestOptions.method, "POST");
  assert.equal(requestOptions.headers["Content-Type"], "application/json");

  await saveTradingScalpingAdminDraft({ revision: 1 });
  assert.equal(requestOptions.method, "PUT");
  assert.equal(requestOptions.headers["Content-Type"], "application/json");

  window.FINPLE_ASSET_DATA_CONFIG.apiBaseUrl = "https://example.test/api/";
  await fetchTradingScalpingKisCaptureStatus();
  assert.equal(requestUrl, "https://example.test/api/admin/trading-readiness/scalping-kis-capture");

  token = "";
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
    (error) => {
      assert.equal(error.code, "ADMIN_AUTH_INVALID");
      assert.equal(error.adminTokenConfigured, true);
      assert.doesNotMatch(JSON.stringify(error), /synthetic-token/);
      return true;
    },
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

  const externalController = new AbortController();
  const abortedRequest = fetchTradingScalpingKisCaptureStatus({ signal: externalController.signal });
  externalController.abort();
  await assert.rejects(abortedRequest, (error) => error.code === "REQUEST_ABORTED");
});

test("scalping admin client has an explicit token-only credential mode", async () => {
  const source = await readFile(new URL("./tradingScalpingAdminApi.js", import.meta.url), "utf8");
  assert.match(source, /credentials:\s*"omit"/);
  assert.doesNotMatch(source, /credentials:\s*"include"/);
});
