import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("exposes only the read-only trading readiness endpoint without order routes", () => {
  const routeText = fs.readFileSync("server/src/routes/tradingReadinessRoutes.js", "utf8");

  assert.match(routeText, /router\.get\("\/readiness"/);
  assert.doesNotMatch(routeText, /router\.(post|put|patch|delete)\(/);
  assert.doesNotMatch(routeText, /submitOrder|placeOrder|providerRequest/);
});
