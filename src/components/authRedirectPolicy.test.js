import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SOURCE_PATH = new URL("./AuthPages.jsx", import.meta.url);

test("login redirect policy defaults to home unless a gated destination is stored", async () => {
  const source = await readFile(SOURCE_PATH, "utf8");

  assert.match(source, /function consumePostLoginRedirectPage\(fallbackPage = "home"\)/);
  assert.match(source, /new Set\(\["home", "mypage", "personal"\]\)/);
  assert.match(source, /if \(nextPage === "home"\) \{/);
  assert.match(source, /window\.history\.replaceState\(\{ page: "home" \}, "", "\/"\)/);
});

test("login redirect policy keeps mypage loader scoped to explicit mypage redirects", async () => {
  const source = await readFile(SOURCE_PATH, "utf8");

  assert.match(source, /if \(nextPage === "personal"\) triggerRouteTransitionLoader\(\);/);
  assert.match(source, /if \(nextPage === "mypage"\) triggerMyPageTransitionLoader\(\);/);
});
