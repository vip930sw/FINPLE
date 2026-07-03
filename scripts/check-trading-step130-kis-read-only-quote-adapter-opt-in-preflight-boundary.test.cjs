const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 130 KIS quote adapter opt-in preflight boundary check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary\] ok/);
});

test("Step 130 check script guards admin-only route and public UI absence", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary.cjs",
    "utf8",
  );

  assert.match(scriptText, /requireAdminAccess/);
  assert.match(scriptText, /AccountPages\.jsx/);
  assert.match(scriptText, /src\/App\.jsx/);
  assert.match(scriptText, /kis-read-only-quote-adapter-opt-in-preflight/);
  assert.match(scriptText, /KIS quote adapter opt-in UI must not be exposed on \/mypage/);
});

test("Step 130 check script blocks live provider and readiness promotion terms", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step130-kis-read-only-quote-adapter-opt-in-preflight-boundary.cjs",
    "utf8",
  );

  for (const term of [
    "issueAccessToken(",
    "queryKisQuote(",
    "providerCallsAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "tokenIssuanceAttempted: true",
    "quoteRequestAttempted: true",
    "adapterCallEnabled: true",
    "liveAdapterImplemented: true",
  ]) {
    assert.match(scriptText, new RegExp(term.replace(/[()]/g, "\\$&")));
  }
});
