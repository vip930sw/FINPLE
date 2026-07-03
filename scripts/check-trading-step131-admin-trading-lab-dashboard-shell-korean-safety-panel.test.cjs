const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 131 admin trading lab dashboard shell check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step131-admin-trading-lab-dashboard-shell-korean-safety-panel.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step131-admin-trading-lab-dashboard-shell-korean-safety-panel\] ok/);
});

test("Step 131 check script requires Korean safety labels and admin-only dashboard surface", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step131-admin-trading-lab-dashboard-shell-korean-safety-panel.cjs",
    "utf8",
  );

  assert.match(scriptText, /거래 안전상태/);
  assert.match(scriptText, /내부 증권 API 호출/);
  assert.match(scriptText, /읽기 전용 시세 조회/);
  assert.match(scriptText, /trading-lab-dashboard/);
  assert.match(scriptText, /requireAdminAccess/);
});

test("Step 131 check script blocks dangerous trading actions and live readiness promotion", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step131-admin-trading-lab-dashboard-shell-korean-safety-panel.cjs",
    "utf8",
  );

  for (const term of [
    "지금 주문하기",
    "자동매매 시작",
    "거래 기능 활성화",
    "issueAccessToken(",
    "queryKisQuote(",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForReadOnlyProviderCalls: true",
    "readyForOrderSubmission: true",
    "readyForLiveGuardedTrading: true",
  ]) {
    assert.match(scriptText, new RegExp(term.replace(/[()]/g, "\\$&")));
  }
});
