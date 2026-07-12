const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

test("Step193 checker is wired to AI ML feature pipeline architecture guardrails", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step193-ai-ml-feature-pipeline-architecture.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /check-trading-step193-ai-ml-feature-pipeline-architecture/);

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const script = packageJson.scripts["check:trading-step193-ai-ml-feature-pipeline-architecture"];
  assert.match(script, /tradingAiMlFeaturePipelineArchitecture\.test\.js/);
  assert.match(script, /check-trading-step193-ai-ml-feature-pipeline-architecture\.test\.cjs/);
  assert.match(script, /check-trading-step192-ai-ml-dataset-and-labeling-architecture\.test\.cjs/);

  const moduleText = fs.readFileSync("server/src/services/tradingAiMlFeaturePipelineArchitecture.js", "utf8");
  assert.match(moduleText, /featureSourceMappings/);
  assert.match(moduleText, /pointInTimeJoinPolicy/);
  assert.match(moduleText, /rollingFeatureContracts/);
  assert.match(moduleText, /noUnconditionalZeroFill: true/);
  assert.match(moduleText, /normalizerFitScope: "training_split_only"/);
  assert.match(moduleText, /providerCallsAllowed: false/);
  assert.match(moduleText, /orderSubmissionAllowed: false/);

  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panelText, /AI\/ML feature pipeline architecture/);
  assert.match(panelText, /feature generation blocked/);
  assert.match(panelText, /provider\/KIS\/order blocked/);
});
