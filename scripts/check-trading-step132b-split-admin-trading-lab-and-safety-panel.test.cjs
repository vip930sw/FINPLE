const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("Step 132B split admin trading lab and safety panel check passes", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-trading-step132b-split-admin-trading-lab-and-safety-panel.cjs"],
    { encoding: "utf8" },
  );

  assert.match(output, /check-trading-step132b-split-admin-trading-lab-and-safety-panel\] ok/);
});

test("Step 132B check requires lab default and safety tab separation", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132b-split-admin-trading-lab-and-safety-panel.cjs",
    "utf8",
  );

  assert.match(scriptText, /return "lab"/);
  assert.match(scriptText, /activeTradingPanelTab === "lab"/);
  assert.match(scriptText, /activeTradingPanelTab === "safety"/);
  assert.match(scriptText, /lab tab must not render safety gate detail list by default/);
  assert.match(scriptText, /safety tab must not render trading lab KPI or chart sections/);
});

test("Step 132B check requires Korean labels and public exposure guardrails", () => {
  const scriptText = fs.readFileSync(
    "scripts/check-trading-step132b-split-admin-trading-lab-and-safety-panel.cjs",
    "utf8",
  );

  for (const term of [
    "거래 관리",
    "모의운용·안전평가",
    "모의 평가금액",
    "일별 자산 변화",
    "수익률 경로",
    "현재 자산분포",
    "trading lab dashboard must not be exposed on /mypage",
    "providerCallsAllowed: true",
    "orderSubmissionAllowed: true",
    "readyForLiveGuardedTrading: true",
  ]) {
    assert.match(scriptText, new RegExp(term.replace(/[()]/g, "\\$&")));
  }
});
