const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step190 checker is wired to mock strategy restore candidate guardrails", () => {
  const packageJson = JSON.parse(read("package.json"));
  const checkText = read("scripts/check-trading-step190-mock-strategy-restore-candidate.cjs");
  const moduleText = read("server/src/services/tradingMockStrategyRestoreCandidate.js");
  const panelText = read("src/components/TradingReadinessPanel.jsx");

  assert.match(
    packageJson.scripts["check:trading-step190-mock-strategy-restore-candidate"],
    /check-trading-step190-mock-strategy-restore-candidate\.cjs/,
  );
  assert.match(
    packageJson.scripts["check:trading-step190-mock-strategy-restore-candidate"],
    /tradingMockStrategyRestoreCandidate\.test\.js/,
  );
  assert.match(checkText, /assertNoEndpointAdded/);
  assert.match(checkText, /assertNoPublicExposureOrForbiddenArtifacts/);
  assert.match(checkText, /sourceRunMutated: true/);
  assert.match(moduleText, /TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL/);
  assert.match(moduleText, /buildMockStrategyRestoreCandidate/);
  assert.match(moduleText, /targetDraftPreview/);
  assert.match(moduleText, /immutableSourceConfirmed/);
  assert.match(moduleText, /dbReadAllowed: false/);
  assert.match(moduleText, /dbWriteAllowed: false/);
  assert.match(panelText, /mock-strategy-restore-candidate/);
  assert.match(panelText, /Mock strategy restore candidate/);
  assert.match(panelText, /tradingLabStrategyRestorePreviewGrid/);
});
