const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

test("Step208 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step208-ai-ml-contract-primitives-step197-pilot.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step208-ai-ml-contract-primitives-step197-pilot\] ok/);
});

test("Step208 package script links Step197, Step207, Step202, and Step206 regression coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step208-ai-ml-contract-primitives-step197-pilot/);
  assert.match(packageJson, /server\/src\/services\/tradingAiMlDatasetBuildDryRunManifest\.test\.js/);
  assert.match(packageJson, /scripts\/check-trading-step208-ai-ml-contract-primitives-step197-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step197-ai-ml-dataset-build-dry-run-manifest\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step207-ai-ml-contract-primitives-step198-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step202-ai-ml-contract-primitives-step199-pilot\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step206-finple-test-temp-guard\.test\.cjs/);
});

test("Step208 remains service-only without admin UI or CSS migration markers", () => {
  for (const file of [
    "src/components/TradingReadinessPanel.jsx",
    "src/App.css",
    "server/src/services/tradingAdminLabDashboardShell.js",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Step208/);
    assert.doesNotMatch(source, /STEP197_METADATA_ONLY_ALLOWED_FLAGS/);
  }
});
