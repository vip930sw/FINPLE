import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("exposes only admin-guarded read-only trading readiness, shadow status, and review endpoints", () => {
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");

  assert.match(routeText, /requireAdminAccess/);
  assert.match(routeText, /router\.get\("\/readiness"/);
  assert.match(routeText, /router\.get\("\/shadow-status"/);
  assert.match(routeText, /router\.get\("\/shadow-review"/);
  assert.doesNotMatch(routeText, /router\.(post|put|patch|delete)\(/);
  assert.doesNotMatch(routeText, /submitOrder|placeOrder|providerRequest/);
});
