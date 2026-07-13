import assert from "node:assert/strict";
import test from "node:test";

import {
  createIpRateLimiter,
  requestContextMiddleware,
} from "./requestStability.js";

function createRequest(overrides = {}) {
  return {
    method: "POST",
    path: "/login",
    ip: "203.0.113.10",
    socket: {},
    get(name) {
      return overrides.headers?.[String(name).toLowerCase()] || "";
    },
    ...overrides,
  };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: new Map(),
    payload: null,
    setHeader(name, value) {
      this.headers.set(String(name).toLowerCase(), String(value));
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("requestContextMiddleware attaches a request id", () => {
  const request = createRequest();
  const response = createResponse();
  let nextCalled = false;

  requestContextMiddleware(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(request.requestId);
  assert.equal(response.headers.get("x-request-id"), request.requestId);
});

test("rate limiter returns 429 after the configured maximum", () => {
  const limiter = createIpRateLimiter({ windowMs: 60000, max: 2, keyPrefix: "test" });

  for (let index = 0; index < 2; index += 1) {
    const request = createRequest({ requestId: `request-${index}` });
    const response = createResponse();
    let nextCalled = false;
    limiter(request, response, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, 200);
  }

  const limitedRequest = createRequest({ requestId: "request-limited" });
  const limitedResponse = createResponse();
  let limitedNextCalled = false;
  limiter(limitedRequest, limitedResponse, () => {
    limitedNextCalled = true;
  });

  assert.equal(limitedNextCalled, false);
  assert.equal(limitedResponse.statusCode, 429);
  assert.equal(limitedResponse.payload?.code, "RATE_LIMITED");
  assert.ok(Number(limitedResponse.headers.get("retry-after")) >= 1);
});
