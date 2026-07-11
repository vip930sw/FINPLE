const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step188 checker is wired to mock trading history browser UI guardrails", () => {
  const packageJson = JSON.parse(read("package.json"));
  const checkText = read("scripts/check-trading-step188-mock-trading-history-browser-ui.cjs");
  const moduleText = read("server/src/services/tradingMockHistoryBrowser.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(
    packageJson.scripts["check:trading-step188-mock-trading-history-browser-ui"],
    /check-trading-step188-mock-trading-history-browser-ui\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step188-mock-trading-history-browser-ui"],
    /tradingMockHistoryBrowser\.test\.js/,
  );
  assert.match(checkText, /assertNoEndpointAdded/);
  assert.match(checkText, /assertNoPublicExposureOrForbiddenArtifacts/);
  assert.match(checkText, /supabaseSelectAttempted: true/);
  assert.match(moduleText, /TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS/);
  assert.match(moduleText, /filterMockHistoryRecords/);
  assert.match(moduleText, /paginateMockHistoryRecords/);
  assert.match(moduleText, /dbReadAllowed: false/);
  assert.match(moduleText, /dbWriteAllowed: false/);
  assert.match(panelText, /mock-trading-history-browser-ui/);
  assert.match(panelText, /Mock trading history browser/);
  assert.match(panelText, /tradingLabHistoryBrowserTable/);
});
