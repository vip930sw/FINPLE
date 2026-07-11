const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

test("Step192 checker is wired to AI ML dataset and labeling architecture guardrails", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step192-ai-ml-dataset-and-labeling-architecture.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /check-trading-step192-ai-ml-dataset-and-labeling-architecture/);

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const script = packageJson.scripts["check:trading-step192-ai-ml-dataset-and-labeling-architecture"];
  assert.match(script, /tradingAiMlDatasetArchitecture\.test\.js/);
  assert.match(script, /check-trading-step191-ai-ml-strategy-management-console\.test\.cjs/);

  const moduleText = fs.readFileSync("server/src/services/tradingAiMlDatasetArchitecture.js", "utf8");
  assert.match(moduleText, /datasetBuildAllowed: false/);
  assert.match(moduleText, /featureGenerationAllowed: false/);
  assert.match(moduleText, /deterministic_mock_dataset_registry/);
  assert.match(moduleText, /randomSplitAllowed: false/);

  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panelText, /AI\/ML dataset and labeling architecture/);
  assert.match(panelText, /dataset build \/ feature generation blocked/);
});
