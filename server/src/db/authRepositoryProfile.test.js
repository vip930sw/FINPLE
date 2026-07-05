import assert from "node:assert/strict";
import test from "node:test";

import { normalizeNicknameForProfile } from "./authRepository.js";

test("profile nickname update trims and accepts 2 to 20 characters", () => {
  assert.equal(normalizeNicknameForProfile("  finple-user  "), "finple-user");
  assert.equal(normalizeNicknameForProfile("이상원"), "이상원");
});

test("profile nickname update rejects empty, one character, and too long values", () => {
  assert.throws(() => normalizeNicknameForProfile(""), /Nickname must be 2 to 20 characters/);
  assert.throws(() => normalizeNicknameForProfile("a"), /Nickname must be 2 to 20 characters/);
  assert.throws(() => normalizeNicknameForProfile("a".repeat(21)), /Nickname must be 2 to 20 characters/);
});
