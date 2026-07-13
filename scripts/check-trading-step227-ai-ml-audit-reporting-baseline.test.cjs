const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step227 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step227-ai-ml-audit-reporting-baseline\] ok/);
  assert.match(output, /"coreScope": "step192_to_step200"/);
  assert.match(output, /"totalUniqueCheckerTestCount": 26/);
  assert.match(output, /"actualLiveTradingReady": false/);
});

test("Step227 package scripts link report and baseline checker", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /report:trading-ai-ml-audit-summary/);
  assert.match(packageJson, /check:trading-step227-ai-ml-audit-reporting-baseline/);
  assert.match(packageJson, /scripts\/report-trading-ai-ml-audit-summary\.cjs/);
  assert.match(packageJson, /scripts\/report-trading-ai-ml-audit-summary\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step227-ai-ml-audit-reporting-baseline\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step227-ai-ml-audit-reporting-baseline\.test\.cjs/);
});

test("Step227 remains reporting-only without runtime UI route or registry edits", () => {
  const touched = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
  for (const forbidden of [
    "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
    "scripts/trading-ai-ml-primitives-migration-audit.cjs",
    "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
    "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
    "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
    "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
    "server/src/services/tradingAiMlDatasetArchitecture.js",
    "server/src/services/tradingAiMlDatasetContractManifest.js",
    "server/src/index.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/App.jsx",
    "data/processed/scenario_monthly_returns.csv",
    "src/components/portfolio/services/calculatePortfolioResult.js",
  ]) {
    assert.equal(touched.includes(forbidden), false, forbidden);
  }
});
