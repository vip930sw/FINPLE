const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

test("Step191 checker is wired to AI ML strategy management console guardrails", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step191-ai-ml-strategy-management-console.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /check-trading-step191-ai-ml-strategy-management-console/);

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const script = packageJson.scripts["check:trading-step191-ai-ml-strategy-management-console"];
  assert.match(script, /tradingAiMlStrategyManagement\.test\.js/);
  assert.match(script, /check-trading-step190-mock-strategy-restore-candidate\.test\.cjs/);

  const moduleText = fs.readFileSync("server/src/services/tradingAiMlStrategyManagement.js", "utf8");
  assert.match(moduleText, /modelTrainingAllowed: false/);
  assert.match(moduleText, /modelDeploymentAllowed: false/);
  assert.match(moduleText, /modelAutoApprovalAllowed: false/);
  assert.match(moduleText, /deterministic_mock_registry/);

  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  assert.match(panelText, /AI\/ML strategy management console/);
  assert.match(panelText, /training\/deploy\/write blocked/);
});
