import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("admin refund preview route stays dry-run and admin-only", () => {
  const source = readFileSync(new URL("./adminRoutes.js", import.meta.url), "utf8");

  assert.match(source, /router\.post\("\/payments\/:paymentId\/refund-preview"/);
  assert.match(source, /requireAdminAccess\(request, response/);
  assert.match(source, /refundExecutionEnabled:\s*false/);
  assert.match(source, /이번 endpoint는 검토 전용이며 Toss 결제 취소 API를 호출하지 않습니다\./);
  assert.doesNotMatch(source, /fetch\(\s*["'`]https:\/\/api\.tosspayments\.com\/v1\/payments/);
});
