const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { execFileSync } = require("node:child_process");

const CHECK_PATH = "scripts/check-trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight.cjs";

test("Step 149 mock portfolio ledger update preflight checker passes", () => {
  const output = execFileSync(process.execPath, [CHECK_PATH], { encoding: "utf8" });
  assert.match(output, /\[check-trading-step149-admin-trading-lab-mock-portfolio-ledger-update-preflight\] ok/);
});

test("Step 149 checker guards endpoint, UI scope, no-go terms, and scenario files", () => {
  const checkerText = fs.readFileSync(CHECK_PATH, "utf8");

  for (const requiredTerm of [
    "trading-lab-mock-portfolio-ledger-update-preflight",
    "buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "tradingLabMockPortfolioLedgerUpdatePreflightStatus",
    "actualLedgerEntryCreated: true",
    "actualPortfolioLedgerUpdated: true",
    "actualCashUpdated: true",
    "actualPositionUpdated: true",
    "accountBalanceQueried: true",
    "actualOrderId",
    "actualExecutionId",
    "actualFillId",
    "readyForLiveGuardedTrading: true",
    "scenario_monthly_returns.csv",
    "AccountPages.jsx",
    "src/App.jsx",
  ]) {
    assert.ok(checkerText.includes(requiredTerm), `checker must cover ${requiredTerm}`);
  }
});
