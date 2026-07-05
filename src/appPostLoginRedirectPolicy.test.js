import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SOURCE_PATH = new URL("./App.jsx", import.meta.url);

test("app preserves only explicit personal and mypage login destinations", async () => {
  const source = await readFile(SOURCE_PATH, "utf8");

  assert.match(source, /if \(!\["mypage", "personal"\]\.includes\(page\)\) return;/);
  assert.match(source, /if \(page === "personal" && !isFinpleUserLoggedIn\(\)\) \{/);
  assert.match(source, /if \(page === "mypage" && !isFinpleUserLoggedIn\(\)\) \{/);
  assert.match(source, /rememberPostLoginRedirectPage\("mypage"\);/);
});
