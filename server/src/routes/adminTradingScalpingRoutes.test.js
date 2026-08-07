import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import process from "node:process";
import test from "node:test";

import {
  handleKisHistoricalCaptureStatusRequest,
  handleKisProviderSmokeStartRequest,
  handleKisProviderSmokeStatusRequest,
} from "./adminTradingScalpingRoutes.js";

function createRequest() {
  const request = new EventEmitter();
  request.requestId = "request-tsc4h6";
  request.get = (name) => String(name).toLowerCase() === "authorization" ? "Bearer SENSITIVE_ADMIN_TOKEN_SENTINEL" : "";
  return request;
}

function createResponse() {
  const response = new EventEmitter();
  response.statusCode = 200;
  response.writableFinished = false;
  response.headers = new Map();
  response.setHeader = (name, value) => response.headers.set(String(name).toLowerCase(), String(value));
  response.json = (payload) => {
    response.payload = payload;
    return response;
  };
  return response;
}

function createGuardResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    setHeader() {},
  };
}

function dependencies(logs, serviceDependencies = {}) {
  return {
    requireAdminAccess: (request, response, next) => next(),
    log: (payload) => logs.push(payload),
    getDeploymentInfo: () => ({ commitSha: "abcdef1234567890" }),
    getPoolStats: () => ({ totalCount: 1, idleCount: 1, waitingCount: 0 }),
    isDatabaseConfigured: () => true,
    serviceDependencies: {
      env: {
        DATABASE_URL: "SENSITIVE_DATABASE_URL_SENTINEL",
        FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true",
      },
      appKey: "SENSITIVE_PROVIDER_KEY_SENTINEL",
      appSecret: "SENSITIVE_PROVIDER_SECRET_SENTINEL",
      getPersistenceStatus: async () => ({
        databaseConfigured: true,
        featureEnabled: true,
        schemaReady: true,
        durable: true,
        mode: "postgres_durable",
        reason: null,
      }),
      readSummary: async () => ({ totalRows: 0, latestCapturedMinute: null, latestRevision: null }),
      getDeploymentInfo: () => ({ commitSha: "abcdef1234567890" }),
      getPoolStats: () => ({ totalCount: 1, idleCount: 1, waitingCount: 0 }),
      ...serviceDependencies,
    },
  };
}

test("capture status logs the ordered request and service lifecycle without secrets", async () => {
  const logs = [];
  const request = createRequest();
  const response = createResponse();
  const nextErrors = [];

  await handleKisHistoricalCaptureStatusRequest(
    request,
    response,
    (error) => nextErrors.push(error),
    dependencies(logs),
  );
  response.writableFinished = true;
  response.emit("finish");
  response.emit("close");

  const required = new Set([
    "request_started",
    "admin_auth_passed",
    "persistence_started",
    "persistence_completed",
    "summary_started",
    "summary_completed",
    "response_finished",
    "response_closed",
  ]);
  assert.deepEqual(logs.map((entry) => entry.event).filter((event) => required.has(event)), [...required]);
  assert.equal(nextErrors.length, 0);
  assert.equal(response.payload.ok, true);
  assert.equal(logs.at(-1).clientDisconnected, false);
  const serializedLogs = JSON.stringify(logs);
  assert.equal(serializedLogs.includes("SENSITIVE_ADMIN_TOKEN_SENTINEL"), false);
  assert.equal(serializedLogs.includes("SENSITIVE_DATABASE_URL_SENTINEL"), false);
  assert.equal(serializedLogs.includes("SENSITIVE_PROVIDER"), false);
});

test("capture status records close and abort and skips summary after disconnect", async () => {
  const logs = [];
  const request = createRequest();
  const response = createResponse();
  let resolvePersistence;
  let summaryCalls = 0;
  const persistencePending = new Promise((resolve) => {
    resolvePersistence = resolve;
  });
  const operation = handleKisHistoricalCaptureStatusRequest(
    request,
    response,
    () => assert.fail("disconnected request must not reach the error response middleware"),
    dependencies(logs, {
      getPersistenceStatus: () => persistencePending,
      readSummary: async () => {
        summaryCalls += 1;
        return { totalRows: 0, latestCapturedMinute: null, latestRevision: null };
      },
    }),
  );

  await Promise.resolve();
  request.emit("aborted");
  response.emit("close");
  resolvePersistence({
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady: true,
    durable: true,
    mode: "postgres_durable",
    reason: null,
  });
  await operation;

  assert.equal(summaryCalls, 0);
  assert.ok(logs.some((entry) => entry.event === "client_aborted" && entry.clientDisconnected));
  assert.ok(logs.some((entry) => entry.event === "response_closed" && entry.clientDisconnected));
  assert.ok(logs.some((entry) => entry.event === "request_failed"
    && entry.errorCode === "CLIENT_DISCONNECTED"
    && entry.httpStatus === 499));
  assert.equal(logs.some((entry) => entry.event === "summary_started"), false);
});

test("capture status failure logs expose only error code and class", async () => {
  for (const stage of ["persistence", "summary"]) {
    const logs = [];
    const request = createRequest();
    const response = createResponse();
    const failure = new Error(`secret ${stage} failure`);
    failure.code = `SYNTHETIC_${stage.toUpperCase()}_FAILURE`;
    await handleKisHistoricalCaptureStatusRequest(
      request,
      response,
      (error) => assert.fail(`fail-closed status should not reach middleware: ${error.code}`),
      dependencies(logs, stage === "persistence"
        ? { getPersistenceStatus: async () => { throw failure; } }
        : { readSummary: async () => { throw failure; } }),
    );

    const event = logs.find((entry) => entry.event === `${stage}_failed`);
    assert.equal(event.errorCode, failure.code);
    assert.equal(event.errorClass, "Error");
    assert.equal(JSON.stringify(logs).includes(`secret ${stage} failure`), false);
  }
});

test("provider smoke start rejects missing, invalid and dev-open admin authentication", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    FINPLE_ADMIN_PREVIEW_ENABLED: process.env.FINPLE_ADMIN_PREVIEW_ENABLED,
    FINPLE_ADMIN_TOKEN: process.env.FINPLE_ADMIN_TOKEN,
  };
  const responses = [];
  try {
    process.env.NODE_ENV = "test";
    process.env.FINPLE_ADMIN_PREVIEW_ENABLED = "true";
    process.env.FINPLE_ADMIN_TOKEN = "expected-token";
    for (const provided of ["", "wrong-token"]) {
      const response = createGuardResponse();
      handleKisProviderSmokeStartRequest(
        { get: (name) => name === "x-finple-admin-token" ? provided : "", body: {} },
        response,
        (error) => assert.fail(error),
      );
      responses.push([response.statusCode, response.payload?.code]);
    }
    delete process.env.FINPLE_ADMIN_TOKEN;
    const response = createGuardResponse();
    handleKisProviderSmokeStartRequest(
      { get: () => "", body: {} },
      response,
      (error) => assert.fail(error),
    );
    responses.push([response.statusCode, response.payload?.code]);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  assert.deepEqual(responses, [
    [403, "ADMIN_TOKEN_REQUIRED"],
    [403, "ADMIN_TOKEN_REQUIRED"],
    [403, "ADMIN_TOKEN_REQUIRED"],
  ]);
});

test("provider smoke status is admin-only and no-store", () => {
  const previousToken = process.env.FINPLE_ADMIN_TOKEN;
  const previousPreview = process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    process.env.FINPLE_ADMIN_PREVIEW_ENABLED = "true";
    process.env.FINPLE_ADMIN_TOKEN = "expected-token";
    const denied = createGuardResponse();
    handleKisProviderSmokeStatusRequest({ get: () => "" }, denied, (error) => assert.fail(error));
    assert.equal(denied.statusCode, 403);
    assert.equal(denied.payload.code, "ADMIN_TOKEN_REQUIRED");

    const allowed = createGuardResponse();
    const headers = new Map();
    allowed.setHeader = (name, value) => headers.set(String(name).toLowerCase(), value);
    handleKisProviderSmokeStatusRequest(
      { get: (name) => name === "x-finple-admin-token" ? "expected-token" : "" },
      allowed,
      (error) => assert.fail(error),
    );
    assert.equal(allowed.payload.state, "IDLE");
    assert.equal(headers.get("cache-control"), "no-store, max-age=0");
  } finally {
    if (previousToken === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previousToken;
    if (previousPreview === undefined) delete process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
    else process.env.FINPLE_ADMIN_PREVIEW_ENABLED = previousPreview;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
