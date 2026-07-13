const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step220 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step220-platform-correct-temp-root-identity.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step220-platform-correct-temp-root-identity\] ok/);
});

test("Step220 package script links platform-correct TEMP identity coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /check:trading-step220-platform-correct-temp-root-identity/);
  assert.match(packageJson, /scripts\/check-trading-step220-platform-correct-temp-root-identity\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step220-platform-correct-temp-root-identity\.test\.cjs/);
  assert.match(packageJson, /scripts\/finple-test-temp-guard\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step219-windows-long-path-temp-cleanup\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
});

test("Step220 stays scoped to TEMP guard identity without service runtime or UI edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  for (const forbidden of [
    "server/src/services/tradingAiMlStrategyManagement.js",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.test.js",
    "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/run-trading-ai-ml-regression-group.cjs",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/TradingAiMlPanelGroup.jsx",
    "src/App.css",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});
