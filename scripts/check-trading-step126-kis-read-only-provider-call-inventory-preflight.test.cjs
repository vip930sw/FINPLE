const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step126-kis-read-only-provider-call-inventory-preflight.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step126-check-"));
  [
    "server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.js",
    "server/src/services/tradingKisReadOnlyProviderCallInventoryPreflight.test.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/App.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step126-kis-read-only-provider-call-inventory-preflight.cjs",
    "scripts/check-trading-step126-kis-read-only-provider-call-inventory-preflight.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8", timeout: 30000 });
}

test("passes with current Step 126 KIS read-only provider-call inventory preflight", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step126-kis-read-only-provider-call-inventory-preflight/);
});

test("blocks if KIS provider-call inventory UI appears in mypage source", () => {
  const workspace = makeWorkspace();
  const accountPagePath = path.join(workspace, "src", "components", "AccountPages.jsx");
  fs.appendFileSync(accountPagePath, "\n<TradingReadinessPanel kisProviderCallInventoryStatus />\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mypage/);
});

test("blocks if KIS inventory endpoint loses the admin guard", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "adminTradingReadinessRoutes.js");
  fs.writeFileSync(routePath, fs.readFileSync(routePath, "utf8").replace(/requireAdminAccess/g, "missingGuard"));
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});

test("blocks if forbidden KIS runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  const forbiddenFile = path.join(workspace, "server", "src", "services", "trading", "kisTokenClient.js");
  fs.mkdirSync(path.dirname(forbiddenFile), { recursive: true });
  fs.writeFileSync(forbiddenFile, "{}\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden trading artifacts present/);
});
