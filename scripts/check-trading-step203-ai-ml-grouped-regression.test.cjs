const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step203 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step203-ai-ml-grouped-regression.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step203-ai-ml-grouped-regression\] ok/);
});

test("Step203 package scripts are wired without removing Step191 through Step202 scripts", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  for (const snippet of [
    "check:trading-ai-ml-regression:architecture",
    "check:trading-ai-ml-regression:contracts",
    "check:trading-ai-ml-regression:consolidation",
    "check:trading-ai-ml-regression",
    "check:trading-step203-ai-ml-grouped-regression",
    "check:trading-step191-ai-ml-strategy-management-console",
    "check:trading-step202-ai-ml-contract-primitives-step199-pilot",
  ]) {
    assert.match(packageJson, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Step203 keeps service, admin UI, CSS, and endpoint surfaces untouched", () => {
  for (const file of [
    "server/src/services/tradingAiMlManifestHandoffEligibility.js",
    "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
    "server/src/services/tradingAdminLabDashboardShell.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
  ]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /Step203/);
  }
});
