const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step117-implementation-shell-readonly-dashboard.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step117-check-"));
  [
    "server/src/index.js",
    "server/src/services/tradingImplementationShell.js",
    "server/src/services/tradingImplementationShell.test.js",
    "server/src/services/tradingProviderAdapterSkeleton.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/components/AdminInquiriesPage.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step117-implementation-shell-readonly-dashboard.cjs",
    "scripts/check-trading-step117-implementation-shell-readonly-dashboard.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8" });
}

test("passes with the current Step 117 shell and read-only dashboard", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step117-implementation-shell-readonly-dashboard/);
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

test("blocks if the route mount is removed", () => {
  const workspace = makeWorkspace();
  const indexPath = path.join(workspace, "server", "src", "index.js");
  fs.writeFileSync(
    indexPath,
    fs.readFileSync(indexPath, "utf8").replace('app.use("/api/admin/trading-readiness", adminTradingReadinessRoutes);', ""),
  );
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});
