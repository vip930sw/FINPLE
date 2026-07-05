import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const STABILIZATION_SOURCE = new URL("./MyPageRenderStabilizationPatch.js", import.meta.url);
const SUBSCRIPTION_SOURCE = new URL("./MyPageSubscriptionStatusPatch.js", import.meta.url);

test("mypage stabilization treats the rendered shell as ready without waiting for final menu labels", async () => {
  const source = await readFile(STABILIZATION_SOURCE, "utf8");
  const shellReadyBody = source.match(/function isShellReady\(\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(shellReadyBody, /document\.querySelector\("\.accountPage\.myPage"\)/);
  assert.match(shellReadyBody, /\.accountPanelStack \.accountStatusPanel/);
  assert.doesNotMatch(shellReadyBody, /내 구독\/플랜|내 결제수단|hasOldSidebarLabels|hasFinalMenuNames/);
});

test("mypage fallback can recover when the shell renders after the timeout", async () => {
  const source = await readFile(STABILIZATION_SOURCE, "utf8");

  assert.match(source, /let fallbackShown = false;/);
  assert.match(source, /window\.setTimeout\(tryReveal, 500\);/);
  assert.doesNotMatch(source, /window\.location\.reload\(\);/);
});

test("mypage subscription status loads lazily only when the billing panel is visible or refreshed", async () => {
  const source = await readFile(SUBSCRIPTION_SOURCE, "utf8");
  const upsertBody = source.match(/function upsertSubscriptionPanel\(\) \{[\s\S]*?\n\}/)?.[0] || "";

  assert.doesNotMatch(upsertBody, /requestSubscriptionStatusOnce\(\)/);
  assert.match(source, /function requestSubscriptionStatusWhenVisible\(\)/);
  assert.match(source, /isSubscriptionPanelVisible\(\)/);
});
