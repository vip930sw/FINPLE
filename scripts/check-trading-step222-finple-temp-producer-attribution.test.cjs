const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step222 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step222-finple-temp-producer-attribution.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step222-finple-temp-producer-attribution\] ok/);
});

test("Step222 package script links producer attribution coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /diagnose:finple-temp-producers/);
  assert.match(packageJson, /check:trading-step222-finple-temp-producer-attribution/);
  assert.match(packageJson, /scripts\/finple-temp-baseline-audit\.test\.cjs/);
  assert.match(packageJson, /scripts\/finple-temp-producer-attribution\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step221-finple-temp-baseline-provenance\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step222-finple-temp-producer-attribution\.test\.cjs/);
});

test("Step222 stays scoped to producer attribution without cleanup or runtime edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  for (const forbidden of [
    "scripts/finple-test-temp-guard.cjs",
    "scripts/check-trading-step206-finple-test-temp-guard.cjs",
    "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
    "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
    "server/src/services/tradingAiMlStrategyManagement.js",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
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
