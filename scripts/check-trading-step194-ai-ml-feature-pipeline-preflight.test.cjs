const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

test("Step194 checker is wired to AI ML feature pipeline preflight guardrails", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step194-ai-ml-feature-pipeline-preflight.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /check-trading-step194-ai-ml-feature-pipeline-preflight/);

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const script = packageJson.scripts["check:trading-step194-ai-ml-feature-pipeline-preflight"];
  assert.match(script, /tradingAiMlFeaturePipelinePreflight\.test\.js/);
  assert.match(script, /check-trading-step194-ai-ml-feature-pipeline-preflight\.test\.cjs/);
  assert.match(script, /check-trading-step193-ai-ml-feature-pipeline-architecture\.test\.cjs/);

  const moduleText = fs.readFileSync("server/src/services/tradingAiMlFeaturePipelinePreflight.js", "utf8");
  assert.match(moduleText, /metadataOnlyPreflightEvaluationAllowed: true/);
  assert.match(moduleText, /valid_contract_execution_blocked/);
  assert.match(moduleText, /blocked_by_safety_policy/);
  assert.match(moduleText, /feature\.availableAt <= predictionTime/);
  assert.match(moduleText, /normalizerFitScope: "training_split_only"/);
  assert.match(moduleText, /scenario_i_prohibited_execution_intent/);
  assert.match(moduleText, /providerCallsAllowed: false/);
  assert.match(moduleText, /orderSubmissionAllowed: false/);

  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panelText, /AI\/ML feature pipeline preflight/);
  assert.match(panelText, /metadata validation only/);
  assert.match(panelText, /provider\/KIS\/order blocked/);
});
