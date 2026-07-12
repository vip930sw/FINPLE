const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step202 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step202-ai-ml-contract-primitives-step199-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step202-ai-ml-contract-primitives-step199-pilot\] ok/);
});

test("Step202 package script links Step199 and Step201 regression checker tests", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step202-ai-ml-contract-primitives-step199-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlManifestHandoffEligibility\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step201-ai-ml-contract-primitives-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step199-ai-ml-manifest-handoff-eligibility\.test\.cjs/);
});

test("Step202 remains service-only without admin UI or CSS migration markers", () => {
  const panel = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const css = fs.readFileSync("src/App.css", "utf8");
  assert.doesNotMatch(panel, /Step202/);
  assert.doesNotMatch(panel, /tradingAiMlContractPrimitives/);
  assert.doesNotMatch(css, /Step202/);
});
