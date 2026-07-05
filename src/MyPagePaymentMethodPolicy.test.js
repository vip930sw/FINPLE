import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SIDEBAR_SOURCE = new URL("./MyPageSidebarPatch.js", import.meta.url);
const CLIENT_SOURCE = new URL("./components/paymentMethodClient.js", import.meta.url);

test("mypage payment method refresh preserves stale registered data while loading", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");
  const loadBody = source.match(/async function loadBillingMethodStatus\(options = \{\}\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(loadBody, /\.\.\.billingMethodState/);
  assert.match(loadBody, /loading: !billingMethodState\.method/);
  assert.match(loadBody, /refreshing: Boolean\(billingMethodState\.method\)/);
  assert.doesNotMatch(loadBody, /registered: false,\s*method: null/);
});

test("mypage payment method requests use force only on explicit refresh and reset on auth change", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");

  assert.match(source, /fetchBillingMethodStatus\(\{ force: Boolean\(options\.force\) \}\)/);
  assert.match(source, /function resetBillingMethodRequestState\(\)/);
  assert.match(source, /clearBillingMethodStatusCache\(\)/);
  assert.match(source, /window\.addEventListener\("finple-auth-updated"/);
});

test("mypage sidebar patch skips heavy reapply after the shell is stable", async () => {
  const source = await readFile(SIDEBAR_SOURCE, "utf8");

  assert.match(source, /let sidebarPatchStable = false;/);
  assert.match(source, /function isSidebarPatchStable\(\)/);
  assert.match(source, /function applyMyPageSidebarIfNeeded\(\)/);
  assert.match(source, /window\.setTimeout\(applyMyPageSidebarIfNeeded, delay\)/);
  assert.match(source, /sidebarPatchStable = isSidebarPatchStable\(\)/);
});

test("payment method client dedupes in-flight requests and does not query assets or KIS", async () => {
  const source = await readFile(CLIENT_SOURCE, "utf8");

  assert.match(source, /billingMethodStatusInflight\.has\(cacheKey\)/);
  assert.match(source, /billingMethodStatusInflight\.set\(cacheKey, requestPromise\)/);
  assert.match(source, /BILLING_METHOD_STATUS_CACHE_TTL_MS = 45000/);
  assert.doesNotMatch(source, /\/api\/assets|\/assets\/batch|kis|KIS|token issuance|quote/i);
});
