import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ADMIN_SOURCE_PATH = new URL("./AdminInquiriesPage.jsx", import.meta.url);
const CSS_SOURCE_PATH = new URL("../App.css", import.meta.url);

test("admin member list does not expose a frontend member delete action", async () => {
  const source = await readFile(ADMIN_SOURCE_PATH, "utf8");

  assert.doesNotMatch(source, /deleteAdminMember/);
  assert.doesNotMatch(source, /onDeleteMember/);
  assert.doesNotMatch(source, /회원 계정을 soft delete/);
});

test("admin member list renders server-sourced MBTI with a safe missing fallback", async () => {
  const source = await readFile(ADMIN_SOURCE_PATH, "utf8");

  assert.match(source, /<th>투자 MBTI<\/th>/);
  assert.match(source, /member\.mbtiNickname \|\| "검사 없음"/);
});

test("admin pagination controls keep top spacing around tables and refresh areas", async () => {
  const source = await readFile(CSS_SOURCE_PATH, "utf8");

  assert.match(source, /\.adminPaginationControls\s*\{[\s\S]*margin: 18px 0 14px;/);
  assert.match(source, /\.adminPaginationControls\s*\{[\s\S]*padding-right: 16px;/);
});
