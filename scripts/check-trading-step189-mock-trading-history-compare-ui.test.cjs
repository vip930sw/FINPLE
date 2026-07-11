const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step189 checker is wired to mock trading history compare UI guardrails", () => {
  const packageJson = JSON.parse(read("package.json"));
  const checkText = read("scripts/check-trading-step189-mock-trading-history-compare-ui.cjs");
  const moduleText = read("server/src/services/tradingMockHistoryCompare.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(
    packageJson.scripts["check:trading-step189-mock-trading-history-compare-ui"],
    /check-trading-step189-mock-trading-history-compare-ui\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step189-mock-trading-history-compare-ui"],
    /tradingMockHistoryCompare\.test\.js/,
  );
  assert.match(checkText, /assertNoEndpointAdded/);
  assert.match(checkText, /assertNoPublicExposureOrForbiddenArtifacts/);
  assert.match(checkText, /supabaseSelectAttempted: true/);
  assert.match(moduleText, /TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL/);
  assert.match(moduleText, /buildMockHistoryCompare/);
  assert.match(moduleText, /compatibilityStatus/);
  assert.match(moduleText, /restoreCandidateEligibility/);
  assert.match(moduleText, /dbReadAllowed: false/);
  assert.match(moduleText, /dbWriteAllowed: false/);
  assert.match(panelText, /mock-trading-history-compare-ui/);
  assert.match(panelText, /Mock trading history compare/);
  assert.match(panelText, /tradingLabHistoryCompareTable/);
});
