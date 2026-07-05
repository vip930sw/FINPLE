import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const CLIENT_SOURCE = new URL("./paymentMethodClient.js", import.meta.url);

test("payment method client includes safe bank and last4 display normalization", async () => {
  const source = await readFile(CLIENT_SOURCE, "utf8");
  const safeDisplayBody = source.match(/export function getSafeBillingMethodDisplayLabel\(method = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(source, /getSafeBillingMethodDisplayLabel/);
  assert.match(source, /33: "우리카드"/);
  assert.match(source, /W1: "우리카드"/);
  assert.match(source, /getPaymentMethodLast4\(method\)/);
  assert.match(source, /getCleanDisplayLabel\(resolvePaymentMethodCompanyLabel\(getPaymentMethodCompany\(method\)\), last4\)/);
  assert.match(safeDisplayBody, /`등록 카드 · \*\*\*\* \$\{last4\}`/);
  assert.ok(source.includes('if (/^[*\\s.\\-()·]+$/.test(label)) return "";'));
  assert.doesNotMatch(safeDisplayBody, /billingKey|customerKey|cardNumber|raw provider/i);
});

test("payment method client dedupes and caches status requests for the mypage policy window", async () => {
  const source = await readFile(CLIENT_SOURCE, "utf8");

  assert.match(source, /BILLING_METHOD_STATUS_CACHE_TTL_MS = 45000/);
  assert.match(source, /billingMethodStatusInflight\.has\(cacheKey\)/);
  assert.match(source, /billingMethodStatusCache\.set\(cacheKey/);
  assert.match(source, /fetchPaymentJsonWithTimeout\(`\$\{getFinpleApiBaseUrl\(\)\}\/payments\/toss\/billing\/method`/);
});
