import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("mypage account email card is not hidden by beta simplification CSS", () => {
  const css = readFileSync(new URL("./MyPageBetaSimplify.css", import.meta.url), "utf8");

  assert.match(css, /nth-child\(4\):not\(\.accountStatusEmailCard\)/);
  assert.doesNotMatch(css, /accountStatusGrid\s*>\s*div:nth-child\(4\)\s*\{\s*display:\s*none\s*!important;/);
});
