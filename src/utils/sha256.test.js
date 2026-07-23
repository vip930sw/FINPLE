import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "./sha256.js";

test("sha256Hex matches standard UTF-8 vectors", () => {
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(
    sha256Hex("FINPLE 한글"),
    "a1331dc06ab938265313af7ba28554b3717195427c15f635fee14abf3d0e052f",
  );
});

test("sha256Hex accepts byte arrays without string coercion", () => {
  assert.equal(
    sha256Hex(new Uint8Array([0, 1, 2, 255])),
    "3d1f57c984978ef98a18378c8166c1cb8ede02c03eeb6aee7e2f121dfeee3e56",
  );
});
