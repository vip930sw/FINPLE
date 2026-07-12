const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step201 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step201-ai-ml-contract-primitives-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step201-ai-ml-contract-primitives-pilot\] ok/);
});

test("Step201 package script keeps Step200 checker test linked", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step201-ai-ml-contract-primitives-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlContractPrimitives\.test\.js/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlArchitectureMilestoneReview\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step201-ai-ml-contract-primitives-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step200-ai-ml-architecture-milestone-review\.test\.cjs/);
});

test("Step201 primitives remain service-only and do not touch admin UI", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const css = fs.readFileSync("src/App.css", "utf8");
  assert.doesNotMatch(panel, /Step201/);
  assert.doesNotMatch(panel, /tradingAiMlContractPrimitives/);
  assert.doesNotMatch(css, /Step201/);
});
