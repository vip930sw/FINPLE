import assert from "node:assert/strict";
import test from "node:test";

import { normalizeFinpleApiBaseUrl } from "./apiBaseUrl.js";

test("preview API base remains same-origin without a duplicated api segment", () => {
  assert.equal(normalizeFinpleApiBaseUrl("/preview-api"), "/preview-api");
  assert.equal(normalizeFinpleApiBaseUrl("/preview-api/"), "/preview-api");
});

test("existing production and local API base contracts remain unchanged", () => {
  assert.equal(
    normalizeFinpleApiBaseUrl("https://finple-api.onrender.com/api"),
    "https://finple-api.onrender.com/api",
  );
  assert.equal(normalizeFinpleApiBaseUrl("http://localhost:5050"), "http://localhost:5050/api");
});
