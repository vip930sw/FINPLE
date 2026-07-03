const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step118-shadow-ledger-dry-run-replay.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step118-check-"));
  [
    "server/src/index.js",
    "server/src/services/tradingShadowLedger.js",
    "server/src/services/tradingShadowLedger.test.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/App.jsx",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/components/AdminInquiriesPage.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step118-shadow-ledger-dry-run-replay.cjs",
    "scripts/check-trading-step118-shadow-ledger-dry-run-replay.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8" });
}

test("passes with current Step 118 shadow ledger and dry-run replay core", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step118-shadow-ledger-dry-run-replay/);
});

test("blocks if mypage exposes the trading dashboard", () => {
  const workspace = makeWorkspace();
  const accountPagePath = path.join(workspace, "src", "components", "AccountPages.jsx");
  fs.appendFileSync(accountPagePath, "\n<TradingReadinessPanel />\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mypage/);
});

test("blocks if forbidden runtime trading artifacts appear", () => {
  const workspace = makeWorkspace();
  const forbiddenFile = path.join(workspace, "server", "src", "routes", "trading", "orders.js");
  fs.mkdirSync(path.dirname(forbiddenFile), { recursive: true });
  fs.writeFileSync(forbiddenFile, "{}\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden trading artifacts present/);
});

test("blocks if admin guard is removed from the route", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "adminTradingReadinessRoutes.js");
  fs.writeFileSync(routePath, fs.readFileSync(routePath, "utf8").replace(/requireAdminAccess/g, "missingGuard"));
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});
