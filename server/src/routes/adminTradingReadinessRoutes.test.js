import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { requireAdminAccess } from "../middleware/adminGuard.js";

test("exposes only admin-guarded read-only trading readiness, shadow status, review, risk, result, and draft endpoints", () => {
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");

  assert.match(routeText, /requireAdminAccess/);
  assert.match(routeText, /router\.get\("\/readiness"/);
  assert.match(routeText, /router\.get\("\/shadow-status"/);
  assert.match(routeText, /router\.get\("\/shadow-review"/);
  assert.match(routeText, /router\.get\("\/risk-kill-switch"/);
  assert.match(routeText, /router\.get\("\/risk-kill-switch-review-result"/);
  assert.match(routeText, /router\.get\("\/manual-approval-order-draft-preflight"/);
  assert.match(routeText, /router\.get\("\/manual-approval-order-draft-review-result"/);
  assert.doesNotMatch(routeText, /router\.(post|put|patch|delete)\(/);
  assert.doesNotMatch(routeText, /submitOrder|placeOrder|providerRequest/);
});

test("unauthenticated admin endpoint guard returns ADMIN_TOKEN_REQUIRED when token is configured", () => {
  const originalEnv = {
    FINPLE_ADMIN_PREVIEW_ENABLED: process.env.FINPLE_ADMIN_PREVIEW_ENABLED,
    FINPLE_ADMIN_TOKEN: process.env.FINPLE_ADMIN_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };
  process.env.FINPLE_ADMIN_PREVIEW_ENABLED = "true";
  process.env.FINPLE_ADMIN_TOKEN = "test-admin-token";
  process.env.NODE_ENV = "production";
  let statusCode = null;
  let payload = null;
  const request = {
    get() {
      return "";
    },
  };
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  try {
    requireAdminAccess(request, response, () => {
      throw new Error("admin guard should not allow unauthenticated requests");
    });

    assert.equal(statusCode, 403);
    assert.equal(payload?.code, "ADMIN_TOKEN_REQUIRED");
  } finally {
    process.env.FINPLE_ADMIN_PREVIEW_ENABLED = originalEnv.FINPLE_ADMIN_PREVIEW_ENABLED;
    process.env.FINPLE_ADMIN_TOKEN = originalEnv.FINPLE_ADMIN_TOKEN;
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  }
});
