const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step187 checker is wired to Supabase schema draft guardrails", () => {
  const packageJson = JSON.parse(read("package.json"));
  const checkText = read("scripts/check-trading-step187-mock-trading-history-supabase-schema-draft.cjs");
  const moduleText = read("server/src/services/tradingMockHistorySupabaseSchemaDraft.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(
    packageJson.scripts["check:trading-step187-mock-trading-history-supabase-schema-draft"],
    /check-trading-step187-mock-trading-history-supabase-schema-draft\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step187-mock-trading-history-supabase-schema-draft"],
    /tradingMockHistorySupabaseSchemaDraft\.test\.js/,
  );
  assert.match(checkText, /assertNoEndpointAdded/);
  assert.match(checkText, /assertNoPublicExposureOrForbiddenArtifacts/);
  assert.match(checkText, /CREATE TABLE/);
  assert.match(moduleText, /TRADING_LAB_MOCK_HISTORY_SUPABASE_TABLE_DRAFTS/);
  assert.match(moduleText, /TRADING_LAB_MOCK_HISTORY_BROWSER_QUERY_CONTRACT/);
  assert.match(moduleText, /dbSchemaChanged: false/);
  assert.match(moduleText, /persistentDbWriteAttempted: false/);
  assert.match(panelText, /mock-trading-history-supabase-schema-draft/);
  assert.match(panelText, /Mock trading history Supabase schema draft/);
});
